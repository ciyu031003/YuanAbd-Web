# UI-REFACTOR-REPORT.md — 三门户 UI 重构与获奖级品质迭代报告

> 执行日期：2026-10-01
> 依据：`UI-REFACTOR-PLAN.md`（B 档）、`DESIGN-SYSTEM.md`、`UI-AUDIT.md`
> 参照：https://uiverse.io/（仅借鉴组件技法，全部代码自研重写）
> 状态：**已部署上线**（www.yuanabd.cn / learn.yuanabd.cn / travel-notes.yuanabd.cn/portal/）

---

## 1. 交付内容

| 新增/改造 | 说明 |
|---|---|
| `demo/css/tokens.css` | 三站共享设计令牌：品牌原始色、语义槽位、阴影/圆角/动效、外观技法常量 |
| `demo/css/theme-portal.css`<br>`theme-learn.css`<br>`theme-travel.css` | 站点主题映射（只做槽位→色值，不写布局） |
| `demo/css/components.css` | 精美组件层（组件族 A–E + 四条降级路径） |
| `demo/js/ui.js` | 组件层交互（零依赖、渐进增强、16KB，`defer` 加载） |
| `demo/_ui-kit.html` | 组件预览页（`noindex`，不参与部署），支持三主题实时切换 |
| `build-portal.cjs` | 门户单文件装配：用成对标记把 tokens/components/ui.js 内联进 `index.html` |
| `.tmp-shots/*` | 本地回归校验工具链（截图 / 计算样式探针 / 布局探针 / 对比度审计 / 交互断言） |

---

## 2. 组件技法落地（借 Uiverse 的技法，不借其外观）

| 技法 | 落地位置 | 实现要点 |
|---|---|---|
| 渐变描边 + 内高光 | 全部实心按钮 | `--fx-highlight` 内阴影 + 品牌色分层投影 |
| 扫光掠过 | 实心按钮 hover | `::after` 位移高光带，`prefers-reduced-motion` 下关闭 |
| 指针跟随光斑 | `[data-spotlight]` | `js/ui.js` 写入 `--mx/--my`，rAF 节流，仅 `pointer:fine` |
| 分层悬浮 | `.ui-lift` | 抬升 + 分层阴影，触屏与减弱动效自动取消 |
| 媒体渐显 | `[data-fade]` / `.ui-card__media img` | `img.decode()` 后加 `.is-loaded`，无 JS 时保持可见 |
| 浮动标签 + 聚焦光环 | `.ui-field` | `:focus-within` / `.is-filled` 双通道 |
| 分段控件 | `[data-seg]` + `.ui-seg` | 滑块跟随 + `aria-selected` + `seg:change` 事件 |
| 开关 | `.ui-switch` | 原生 `input` + 弹簧过渡 + 键盘可达 |
| 气泡提示 | `.ui-tip` | 纯 CSS，`hover`/`focus-visible` 触发，触屏不显示 |
| 图标按钮双态 | `.ui-iconbtn` | `.is-done` 切换图标与无障碍名称 |
| 骨架屏流光 | `.ui-skel` | 1.4s 扫光；数据就绪后 `.is-done` 淡出 |
| 环形进度 | `.ui-ring` | `conic-gradient` + `mask`，`--p` 驱动 |
| 提示堆栈 | `window.UI.toast()` | 最多 3 条、`role="status"`/`aria-live`、自动出队 |
| 弹窗原点缩放 | `.ui-modal` + `[data-modal]` | 从点击落点展开；原点参考系取最近的 fixed/absolute 祖先 |
| 移动端下拉关闭 | `[data-modal-drag]` | 触屏下拉超 90px 触发关闭，内容已滚动时不接管手势 |

---

## 3. 修复的真实缺陷（既有问题，非本次引入）

| # | 站点 | 问题 | 证据 | 修复 |
|---|---|---|---|---|
| 1 | `download.html`<br>`privacy.html` | `learn.css` 的 `body.learn{background:var(--ink-deep)}` 因 `--ink-deep` 只在 `learn-sunny.css` 中定义而整条失效，页面底色与文字色双双落空 | `contrast-audit` 显示两页正文对比度异常；截图确认正文不可读 | `theme-learn.css` 补齐 `learn.css` 依赖的全部令牌 + 显式声明 `body.learn` 底色与文字色 |
| 2 | 门户 | `.tvisual` 无 `position` 声明，其绝对定位子元素以更外层祖先为参照，浮动照片卡溢出栅格轨道、遮住「02 —— PRODUCT」标题 | 盒模型探针：`.tvisual__card` 实测 168×714px | 补 `.tvisual{position:relative}`；`.tvisual__card img` 由 `height:100%` 改为 `width:100% + aspect-ratio`，恢复为 168×164 |
| 3 | 甜途 | 画廊大号城市名下方的序号：JS 每帧写入「05 / 07」，CSS 却把它当 3px 高装饰渐变条排版，文字被压扁溢出 | 截图可见文字压条 | 按「计数器」重新排版为等宽小字 + 品牌色 |
| 4 | 门户 | 章节编号 `color:transparent` + 描边，填充对比度恒为 1:1 | `contrast-audit` 报告 1:1 | 改为 56% ink 实色 + 1.1px 描边，保留填充动效 |
| 5 | 组件层 | `[data-spotlight]` 曾给所有子元素统一加 `position:relative`，把 `.tvisual/.mock` 内部绝对定位的图片盒拉回静态流，`#travel` 高度 +714px | 布局探针实测 | 改为「光斑层不设 z-index」+ 站点显式标注 `.ui-spot-up`，组件层不推断子元素定位 |

---

## 4. 八维度自检结果

| 维度 | 结论 | 依据 |
|---|---|---|
| **排版** | 三级字阶（大号衬线标题 / 正文 / 等宽小字标签）在三站一致；标题 `text-wrap:balance`，正文行高 1.75–1.95 | 逐段截图 + `DESIGN-SYSTEM.md` §2 比对 |
| **留白** | 区块节奏 90–150px 随视口收敛；卡片内边距 clamp 化 | 盒模型探针（所有区块间距与基线一致） |
| **视觉层级** | 每屏一个主锚点（门户=巨型品牌字+太阳；苦旅=五本书；甜途=旋转画廊）；正文/次文字/弱文字三级对比度经审计收敛 | 截图 + `contrast-audit` |
| **色彩** | 三站品牌色各自独立、令牌统一；正文级文字色全部经计算取深阶 | `contrast-pick.cjs` 计算结果 |
| **动效** | 只用 `transform/opacity/filter`；扫光/漂浮/骨架屏全部在 `prefers-reduced-motion` 下关闭 | `verify-ui-kit.cjs` 断言「reduced-motion 下过渡被降级」 |
| **微交互** | hover→active→focus-visible 三层反馈；分段控件/开关/复制/提示/弹窗均有明确状态 | 交互断言 23/23 通过 |
| **响应式** | 390 / 1440 双档逐段截图；移动端修复了 `.tvisual` 溢出；导航在 720px 切换为抽屉 | 移动端截图 |
| **原创性** | 未复制任何第三方组件源码；同色相深阶、光斑模型、弹窗原点参考系均为本仓自研并带实现注释 | 全部代码在 `demo/css/components.css`、`demo/js/ui.js` |

### 对比度审计（WCAG AA 不达标项数）

| 站点 | 修复前 | 修复后 |
|---|---:|---:|
| 门户 index | 53 | 20 |
| 苦旅 learn | 111 | 3 |
| 甜途 travel | 69 | 36 |
| download | 7 | **0** |
| privacy | 2 | **0** |

剩余项集中在：装饰性微型标签（9–13px 大写英文）、照片上的白色文字（背景不可判定）、
以及品牌色 `#E8784A` 用于非文本装饰（本身无对比度要求）。

---

## 5. 回归与证据链

| 校验 | 工具 | 结果 |
|---|---|---|
| 组件层交互 | `.tmp-shots/verify-ui-kit.cjs` | 23/23 通过（含 live region、复制兜底、弹窗原点、reduced-motion） |
| 计算样式等价性 | `.tmp-shots/probe.cjs` | Phase 1 全部组件属性零差异（仅新增令牌差异） |
| 布局回归 | `.tmp-shots/layout-probe.cjs` | 三站 `scrollHeight` 与介入前逐项一致（7125 / 5433 / 21078） |
| 像素比对 | `.tmp-shots/shoot.cjs` + `pngdiff.cjs` | 门户/苦旅/下载/隐私在 1440、390 下与基线逐像素一致（甜途因 WebGL 每帧不同，改用计算样式断言） |
| 对比度 | `.tmp-shots/contrast-audit.cjs` | 见 §4 |
| 线上复验 | `curl` + 无头浏览器截图 | 三站入口与全部新增资源 200；渲染与本地一致 |

---

## 6. 部署记录

- 服务端备份：`/var/www/backups/ui-refactor-20261001042236./`（21 个文件）
- 上传：门户 1 文件、苦旅 3 HTML + 6 CSS + 1 JS、甜途 1 HTML + 7 CSS + 1 JS
- 缓存：四站 HTML 内本地 css/js 引用统一打 `?v=20261001a`
- 线上复验：`https://www.yuanabd.cn/`、`https://learn.yuanabd.cn/`（含 download/privacy）、
  `https://travel-notes.yuanabd.cn/portal/` 全部 200，新增资源可用

### 第二轮（首屏垂直节奏）

- 备份：`/var/www/backups/ui-refactor-20261001-123724/`（21 个文件）
- 上传：`learn-sunny.css` + 苦旅 3 HTML + 甜途 `travel.html`（引用版本号 `?v=20261001b`）
- 线上复验：`learn-sunny.css` md5 与本地一致；线上 1440 截图与本地逐字节同尺寸
  （542643 bytes / contentH 5433）

> **注意**：甜途门户线上入口是 `/portal/`，根路径已由 Next.js 应用接管（README 已同步）。

---

## 7. 迭代记录

### 第二轮：首屏垂直节奏（已修复）

用新写的 `collision-audit.cjs`（按 TextRange 墨迹判定元素重叠，排除
`aria-hidden`/`inert` 的关闭态浮层）量化出苦旅首屏的实质遮挡：

| 重叠对 | 面积 | 性质 |
|---|---|---|
| `.hero-cta` ∩ `.cover-title[2]`（中央书「路线」） | 206.8×24.2px | 书名被 CTA 压住 |
| `.hero-cta` ∩ `.cover-kicker[2]` | 206.8×19.6px | 手册序号被压住 |
| `.hero-chips` ∩ `.cover-title[1\|2\|3]` | 高 37/8.9/37px | 第 2/3/4 本书名被数据胶囊压住 |

书卡是可点击入口，书名被遮挡属实质缺陷（非设计层叠），按选定方案 A 修复：
标题 4rem→3.4rem、书堆 34%–46%→41%–49%、桌面隐藏 `.hero-chips`
（其四个数字在下方 mockup 与数据带中已完整呈现）。修复后
`.hero-cta` bottom 373.1 → 书堆 top 408.4，净空 35.3px，五个书名全部可读。

**全站结构重叠复核**：learn / download / privacy 无实质冲突；index 的 3 处
（浮动照片卡与主图叠置）与 travel 的 6 处（固定导航叠在首屏画廊上）均为
设计意图内的层叠，z-index 已正确分层，不计为缺陷。

---

## 8. 剩余可继续优化项

1. **甜途画廊构图**：主卡在部分滚动位置偏右、留有左侧空档（滚动联动逻辑既有行为，需单独调整 Three.js 相机与卡片布局参数）。
2. **对比度收尾**：剩余项中，照片上的文字建议加半透明暗底；微型大写标签可考虑提高字号而非继续加深颜色。
3. **`.tvisual` 卡片负偏移**：`left:-14px` 在窄屏仍会轻微出血，可改为容器内缩。
4. **动效曲线统一**：三站缓动函数已有公共令牌，但少数历史覆盖层仍写死 `cubic-bezier`，可做一次收敛。
