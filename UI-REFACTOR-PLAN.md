# UI-REFACTOR-PLAN.md — 以 Uiverse 为参照的三门户 UI 组件层重构方案

> 参照对象：https://uiverse.io/ （社区开源 UI 组件库，CSS / Tailwind，元素级组件）
> 产出日期：2026-09（Phase 0.5，待确认后执行）
> 约束依据：`UI-AUDIT.md` Rule A 资产保护清单 + `DESIGN-SYSTEM.md` 设计系统
> 状态：**已确认（2026-09）**，执行参数：强度 **B 档**（组件层全面升级 + 补齐缺失组件）／**允许** `base.css` 结构性重构／**接受** 新增 `js/ui.js`／门户 **维持单文件内联**

---

## 0. 结论先行（TL;DR）

1. **不做「整站换皮」**。三站视觉方向（暖白 / 阳光 / 编辑式）已经对了，问题不在配色，在**组件的完成度**：卡片是「1px 边框 + 平移 3px」，按钮是「变色 + 上移 2px」，缺少 2026 年主流 UI 的细腻反馈层次。
2. **借鉴 Uiverse 的是「组件技法」，不是「组件外观」**。Uiverse 组件多为深色霓虹/玻璃拟态，直接贴进来会和暖白阳光体系冲突（也违反 `DESIGN-SYSTEM.md` §4「禁止厚重投影」）。
3. **全部代码自研重写**，只用我们的 token，不粘贴第三方源码 → **零 License 风险**，且体积可控（CSS 总增量 ≤ 15KB，JS ≤ 6KB，零新增运行时依赖）。
4. **顺手修一个真实存在的架构缺陷**：`base.css`（深色 token）与站点阳光覆盖层的 **cascade 层级错位**，目前靠逐条 `!important` 式补丁维持（详见 §2）。
5. 分 5 个 Phase 执行，每站独立可回滚，全程 `git commit` 粒度推进，不新增 `.bak` 文件。

---

## 1. 现状盘点（代码基线）

| 站点 | 文件 | 体量 | CSS 形态 |
|---|---|---|---|
| YUAN.ABD 门户 | `demo/index.html` | 1050 行 / 65KB | **全部内联**在 `<style>`，不引用 `base.css` |
| 苦旅 Learn | `demo/learn.html` + `css/learn.css` + `css/learn-sunny.css` | 922 行 / 48KB + 44KB + 16KB | `base.css` → `learn.css` → `learn-sunny.css`（覆盖层） |
| 甜途 Travel | `demo/travel.html` + 6 个 CSS | 695 行 / 39KB + 63KB | `base.css` → `travel*.css` → `travel-sunny.css`（覆盖层） |
| 下载页 / 隐私页 | `demo/download.html` / `privacy.html` | 191 / 114 行 | 复用 `base.css` + `learn.css` |

**已有组件层**（`base.css`，307 行）：`.btn`(solid/ghost/line/sm)、`.chip`、`.card`、`.nav`、`.hero`、`.feature`、`.stat-grid`、`.dl-row`、`.footer`、`.toast`、`.grain`、`.vignette`、`.cursor`、`[data-reveal]`、`.mask`。

**已有 JS 能力**（可直接复用的钩子，无需新框架）：`[data-reveal]` 82 处、`[data-count]` 15 处、`[data-split]` 逐字、`[data-magnetic]` 磁吸、`[data-tilt]` 3D 倾斜、`[data-copy]`、`[data-login]`、Lenis 平滑滚动、Three.js 画廊、`drift-wall`。

---

## 2. 先修的地基问题（不改观感，但决定后续成败）

**问题：`base.css` 是深色 token，站点覆盖层是浅色，但 `base.css` 先加载、站点 CSS 后加载 —— 组件层却仍由 `base.css` 定义。**

实际上 `travel.css` / `learn.css` 都在**重新定义** `.card`、`.footer`、`.nav` 等，`travel-sunny.css` 又给 `.card` 打第二遍补丁；`index.html` 干脆完全不复用 `base.css`，自己写了一套 `.btn`。结果是同一颗按钮在三站有 3 份实现、5 处覆盖。

**修法（Phase 1，纯结构性、观感零变化）：**

```
css/tokens.css        新建：三站共享 primitive + semantic token（--brand-*, --sun-*, --sky-*, --coral-*, --mint-*, 圆角/阴影/缓动/时长/层级）
css/base.css          改造：token 段迁出，组件层只使用 semantic token，删除硬编码深色值
css/theme-learn.css   新建：Learn 主题映射（--brand: sky-blue 等），输出到 :root
css/theme-travel.css  新建：Travel 主题映射（--brand: coral 等）
css/components.css    新建：本次新增的精美组件层（§4）
```

`<link>` 顺序统一为 **tokens → base → components → 站点样式 → 站点主题 → 站点覆盖层**，从根上消除「先浅后被深盖回」的补丁依赖，同时**保证 `.card` 之类同名类不再跨站点互相污染**（门户/旅行画廊的 `.card` 是轮播卡，与通用卡片同名 —— 本次一并做命名隔离，通用卡片迁到 `.ui-card`，旧类名保留别名不破坏现有 HTML）。

> 门户 `index.html` 保持单文件内联（部署脚本 `scp demo/index.html` 依赖此形态），只把新增组件层内联进 `<style>`，不动部署链路。

---

## 3. Uiverse 对标清单：我们要「学」的 12 个技法

> 下列为参照 Uiverse 高人气组件的**设计技法分类**（技法本身是通用 CSS 手法）。**执行时全部用本仓 token 重写，不复制任何第三方源码**，因此不涉及逐组件署名与 License 跟随问题；若你希望在某处保留「灵感来源：Uiverse」的注释署名，我可以在 CSS 头部统一加一行。

| # | Uiverse 技法类 | 借用到我们哪 | 落点 |
|---|---|---|---|
| 1 | Gradient-border + inner highlight（渐变描边 + 内高光边框） | 主按钮 / 主卡片 | `.btn--solid`、`.ui-card--accent` |
| 2 | Shine sweep（扫光掠过） | 主 CTA、卡片 hover | `.btn--solid::after`、`.fcard:hover` |
| 3 | Pointer spotlight（指针跟随光斑） | 所有卡片 | 复用已有 pointer 逻辑 → `--mx/--my` |
| 4 | Tilt card（3D 倾斜卡片） | 产品卡 / 城市卡 / 手册卡 | 已有 `[data-tilt]`，扩到卡片组 |
| 5 | Glass pill + status pulse（毛玻璃胶囊 + 呼吸状态点） | 导航、`chip.acc`、`hero__badge` | `.nav__inner`、`.chip` |
| 6 | Animated toggle / segmented control（滑块开关 / 分段控件） | Learn 站内菜单、列表筛选 | 新增 `.ui-seg`、`.ui-switch` |
| 7 | Progress ring + track（环形进度） | 回顶按钮、手册就绪度 | 合并为 `.ui-ring`，复用已绘制的 SVG |
| 8 | Shimmer skeleton（骨架屏流光） | 职位流 / 图库加载态 | 新增 `.ui-skel` |
| 9 | Stacked toast with icon（堆叠提示 + 图标） | 登录提示 / 复制成功 / 下载提示 | `.toast` 升级为 `.ui-toast` 堆栈 |
| 10 | Icon button + tooltip（图标按钮 + 气泡提示） | 下载/复制/分享 | 新增 `.ui-iconbtn` + `.ui-tip` |
| 11 | Focus glow + floating label（聚焦光环 + 浮动标签） | 表单输入（下载重试/邮箱订阅） | 新增 `.ui-field` |
| 12 | Modal scale-from-origin + drag-to-close（缩放弹出 + 下拉关闭） | 甜途下载弹窗、苦旅详情面板 | `.dl-modal`、`.detail-panel` |

---

## 4. 逐站替换清单（Rule A 对齐：只谈升级，不删资产）

### 4.1 门户 `index.html`

| 区块 | 现状 | 替换为 | 优先级 |
|---|---|---|---|
| `.nav__inner` | 毛玻璃胶囊，链接下划线生长 | 玻璃胶囊 + **滚动压缩态**（滚过 120px 收窄为 56px 高）+ 链接 hover 光斑 | P1 |
| `.nav__cta` / `.btn--primary` | 纯色 + 上移 | 渐变描边 + 内高光 + 扫光 + 按下回弹（技法 1/2/11） | **P0** |
| `.btn--learn` / `.btn--travel` | 站点色实心 | 同技法，按站点色生成渐变（`color-mix` 派生，不新增 token） | **P0** |
| `.hero__badge` / `.chip` | 静态描边胶囊 | 呼吸状态点 + hover 光环 | P1 |
| `.mock`（Learn 视觉） | 浏览器框 + 4 宫格 + 柱图 | 加**指针光斑**与卡片分层阴影；柱图加 count-up 联动 | P1 |
| `.tvisual`（Travel 视觉） | 大图 + 浮动小卡 | 浮动小卡加**视差跟随 + 光扫**；大图 hover 遮罩渐变 | P1 |
| `.credo__card` / `.bcard` / `.ncard` | 边框 + 上移 5px | 统一 `.ui-card`：光斑 + 4° 倾斜 + 底部色条生长 | **P0** |
| `.fcard`（页脚产品卡） | 箭头位移 + 色条展开 | 加**扫光 + logo 微旋转 + 指针光斑** | P1 |
| `.to-top` 环形回顶 | 已有环形进度（技法 7） | 提为 `.ui-ring`：进度发光 + hover 放大 1.08 | P2 |
| `.marquee` / `.gallery__track` | 无限滚动 + hover 暂停 | hover **减速**（而非硬停）+ 边缘渐隐加深 + 单项微缩放 | P2 |
| `.section__index` 描边数字 | 进视口从描边→实色 | 加**字符逐个填充**（已有 `[data-split]` 基建） | P2 |
| **新增** 城市卡 / 图库 | — | 统一 `.ui-card` + 骨架屏占位（图片加载前） | P1 |

### 4.2 苦旅 `learn.html`

| 区块 | 现状 | 替换为 | 优先级 |
|---|---|---|---|
| `.topbar` + `.menu-glyph` | 两横线汉堡 | **三横线 → X 形变**（技法 6 配套）+ 菜单层入场改 stagger | P1 |
| `.book-card` 五本书 | 3D 书本，hover 抬升 + 阅读徽章 | **保留全部 3D 结构**，升级：`open-badge` 呼吸光环、hover 时书脊光扫、focus-visible 光环 | **P0** |
| `.detail-panel` 详情面板 | 弹出 + 焦点陷阱 | 加**从书卡原点缩放升起**（transform-origin 跟随被点书卡）+ 移动端下拉关闭（技法 12） | **P0** |
| `.job` 职位卡 | 边框 + 上移 | `.ui-card` 光斑 + **骨架屏**（真实数据到达前）+ `jobfilm` 无缝滚动减速 | P1 |
| `.numbers__row` 数据带 | 静态数字 | **count-up 滚动数字**（复用 `[data-count]`）+ 数字底部渐变下划线 | P1 |
| `.toast` | 单条淡入 | `.ui-toast` 堆叠 + 图标 + 出队动画（技法 9） | P1 |
| `.mindgrid` 思维链路 | 静态 3 列网格 | **连接线逐段绘制** + 节点 hover 光环（保留结构） | P2 |
| `.menu-layer` | 全屏菜单 | 链接 **stagger 入场** + 当前项发光指示条 | P2 |
| `.footer__dl` 下载按钮 | 上移 + 阴影 | 统一主按钮技法 1/2 | P2 |
| `download.html` / `privacy.html` | 复用 `base.css` + `learn.css` | 随 `base.css` 改造自动获益；补上主题映射 | P2 |

### 4.3 甜途 `travel.html`

| 区块 | 现状 | 替换为 | 优先级 |
|---|---|---|---|
| `.gallery-title` / `.stage__hud` | 已有 HUD（审计要求保留） | HUD 数字加**滚动换位动画**、圆点改**发光药丸**（已部分做）、`.scroll-line` 改呼吸 | P1 |
| `.hud__dot` | 7 点分页 | 技法 7 进度环变体：当前项为**拉长药丸 + 光晕**（无障碍保持 `aria-current`） | P1 |
| `.worldband` 足迹地图 | SVG 路径 + 6 个点 | 路径**逐段绘制**（已有 `scroll-draw` 概念）+ 点标 hover 弹出城市小卡（技法 10） | **P0** |
| `.wstat` 数据块 | 静态数字 | count-up + 单位淡入 | P1 |
| `.scard-story` / `.scard` 故事卡 | 图 + 文案 | `.ui-card`：光斑 + 图片 `scale` 视差 + 标签胶囊统一 | **P0** |
| `.memories` 胶片墙 | 漂移墙（`drift-wall.js`） | 保留；加**指针深度视差**（`drift-wall` 已支持 `parallax` 参数，仅调参）+ 骨架占位 | P2 |
| `.tfeatures` 功能列表 | 图标 + 文案 | `.ui-card` 统一 + 图标容器渐变底 | P1 |
| `.cityfilm` 城市胶片带 | 无限滚动 + hover 暂停 | 减速 + 边缘渐隐 + 城市名描边字 | P2 |
| `.dl-modal` 下载弹窗 | 已有 spring 弹出 + QR | 技法 12：从点击原点缩放 + 内高光描边 + 移动端下拉关闭 + **复制链接**改图标按钮 + tooltip | **P0** |
| `.outro` 收尾 CTA | 文案 + 按钮 | 主按钮技法 1/2/11 | P1 |
| `.nav` / `data-login` 登录 | 实心渐变按钮 | 统一；登录后状态点呼吸 | P2 |
| **新增** | — | 图片骨架屏、懒加载渐显（`decode()` 后 200ms 淡入） | P1 |

### 4.4 明确**不动**的资产（Rule A「KEEP」）

- 门户：巨型 YUAN.ABD 品牌字、太阳光晕、产品左右布局、城市横向滚动画廊、Marquee 数据带、Lenis 视差。
- Learn：五本手册的 3D 结构与全部交互、招花今日好岗真实 Mockup、真实数据（3,279 岗 / 47 城 / 465 技能 / 19 平台 / 14K）、详情面板交互、思维链路。
- Travel：Three.js 旋转画廊、7 城市分页、堆叠卡、漂移墙、浅色底、下载弹窗流程、全部 7 城真实图片。
- 全站：SEO / canonical / JSON-LD / OG、`prefers-reduced-motion` 支持、focus-visible、触控区 ≥44px、文案一字不改。

---

## 5. 新增组件层清单（`css/components.css` 内容大纲）

```
/* A. 交互反馈 */
.btn--solid 升级      渐变描边(1) + 内高光(1) + 扫光(2) + 按下回弹
.btn--line 升级       边框光晕 + hover 填充上浮
.ui-iconbtn           圆形图标按钮 + 状态切换（复制→对勾）
.ui-tip               纯 CSS 气泡提示（tooltip，技法 10）
/* B. 卡片族 */
.ui-card              基座：指针光斑(3) + 可选倾斜(4) + 分层阴影
.ui-card--media       图片卡：懒加载渐显 + 视差 + 扫光
.ui-card--stat        数据卡：count-up + 渐变下划线
/* C. 控件族 */
.ui-seg               分段控件（滑块跟随，技法 6）
.ui-switch            开关（技法 6）
.ui-field             浮动标签输入 + 聚焦光环(11)
.ui-skel              骨架屏流光(8)
.ui-ring              环形进度(7)
/* D. 容器族 */
.ui-toast             堆叠提示(9)
.ui-modal             弹窗基座（原点缩放 + 下拉关闭，技法 12）
/* E. 无障碍 / 降级（强制） */
@media (prefers-reduced-motion:reduce)  全部动效降级为静态
@media (hover:none)                     触屏禁用 hover 依赖态
@supports not (backdrop-filter)         毛玻璃降级为实色
```

**JS 增量**：`js/ui.js`（≤6KB，无依赖）—— 指针光斑（文档级委派，复用 `--mx/--my`）、扫光触发、骨架屏移除、toast 队列、弹窗原点计算与下拉关闭。全部以 `IntersectionObserver` / `pointermove` 被动监听实现，不引入新库。

**性能预算**（对齐 `DESIGN-SYSTEM.md` §8）：
- CSS：三站合计 +12–15KB（gzip 后约 +3KB）
- JS：+6KB（gzip ~2.5KB），不阻塞首屏（`defer`）
- 动效仅用 `transform` / `opacity` / `filter` 单层，避免 layout thrash
- 目标维持 LCP < 2.5s、CLS < 0.1、INP < 200ms

---

## 6. 执行顺序（每步一个 commit，独立可回滚）

| Phase | 内容 | 影响面 | 验证 |
|---|---|---|---|
| **P1** | token 层抽取 + `base.css` 语义化 + 主题映射 + `.card` 命名隔离 + 链接顺序统一 | 结构，观感不变 | 三站像素级 diff ≈ 0（除已知修复） |
| **P2** | `components.css` + `ui.js` 落地（组件族 A–E） | 新增，未接入 | 建 `demo/_ui-kit.html` 组件预览页（不部署） |
| **P3** | 门户接入（`index.html` 内联组件层 + HTML 类名微调） | 主站全量 | `node serve.cjs` + 截图对比（1440 / 375） |
| **P4** | Learn 接入（含 `download.html` / `privacy.html`） | 苦旅全量 | 五本书 3D / 详情面板 / 菜单 / toast 全交互回归 |
| **P5** | Travel 接入（含 `dl-modal` / `drift-wall` 调参） | 甜途全量 | 画廊滚动 / 7 城分页 / 弹窗 / 回流不空白 |
| **P6** | 无障碍与降级复核 + 性能实测 + 文档更新（`UI-AUDIT.md` / `DESIGN-SYSTEM.md`） | 全站 | Lighthouse 三站 Mobile + Desktop |

**回滚**：每 Phase 单独 commit；线上部署前在 `demo/` 本地跑 `node serve.cjs` 全站走查，部署命令沿用 `README.md`（`scp` 逐个文件，不整目录覆盖）。

---

## 7. 风险与对策

| 风险 | 对策 |
|---|---|
| `base.css` 改造波及 Learn/Travel 现有覆盖层（覆盖点最多） | Phase 1 只做**等价迁移**（值不变、选择器不变），改完先截图 diff 确认零观感变化，再进 Phase 2 |
| 通用 `.card` 与 Travel 画廊 `.card` 同名 | 通用卡片迁 `.ui-card`，旧 `.card` 保留为别名；Travel 侧选择器不动 |
| 指针光斑 + 3D 倾斜在低端安卓掉帧 | `matchMedia('(pointer:fine) and (min-width:900px)')` 门控 + `will-change` 用完即卸 + rAF 节流 |
| 毛玻璃/`color-mix` 兼容性 | `@supports` 降级路径（实色 + 1px 边框）；`color-mix` 提供静态 hex 回退 |
| 门户单文件内联导致体积膨胀 | 组件层按需裁剪后再内联，只保留门户实际用到的类（预计 +8KB 内联） |
| Uiverse 素材授权 | 不复制任何第三方源码，全部自研重写（§3 说明） |

---

## 8. 需要你确认的 4 个决策点

1. **替换强度**：`A` 保守（只升级组件微观反馈：按钮/卡片/弹窗/toast，版面与配色零变化）／`B` 推荐（组件层全面升级 + 新增骨架屏、tooltip、分段控件、环形进度等缺失组件）／`C` 激进（在 B 基础上再重做 Hero 与产品展示区的版面构图）。
2. **`base.css` 是否允许结构性重构**（Phase 1）：允许则三站长期可维护；不允许则改为「新增 `components.css` 覆盖层」，代价是补丁继续堆叠、门户仍与另两站割裂。
3. **是否接受新增 `js/ui.js`（≤6KB）**：不接受则光斑/toast 队列/弹窗原点缩放改为**纯 CSS 可实现的部分**（扫光、渐变描边、骨架屏、tooltip、进度环都无需 JS）。
4. **门户是否维持单文件内联**（部署脚本依赖）：维持 / 改为外链 `css/portal.css`（需同步改 `README.md` 部署命令与 nginx 缓存 `?v=`）。

---

## 附：本方案不动的东西（一句话）

**文案、SEO、JSON-LD、canonical、图片资产、Three.js 画廊、Lenis、漂移墙、五本书 3D 结构、全部真实数据、全部无障碍语义 —— 一个都不动。**
