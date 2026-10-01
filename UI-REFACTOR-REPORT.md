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

### 第二轮（首屏垂直节奏 + 首屏性能）

- 备份：`/var/www/backups/ui-refactor-20261001-123724/`（21 个文件）
- 上传：`learn-sunny.css` + 苦旅 3 HTML + 甜途 `travel.html`（引用版本号 `?v=20261001b`）
- 线上复验：`learn-sunny.css` md5 与本地一致；线上 1440 截图与本地逐字节同尺寸

### 第三轮（首屏性能）

- 备份：`/var/www/backups/ui-refactor-20261001-125000/`（21 个文件）
- 上传：门户 `index.html`、苦旅 3 HTML + `learn-sunny.css`、甜途 `travel.html`
  （引用版本号 `?v=20261001c`）
- 线上复验：三个入口 HTML 的 md5 与服务端逐一一致；
  线上 1440 渲染 contentH 与本地一致（门户 7125 / 苦旅 5433）

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

### 第三轮：首屏性能（已修复）

用 `perf-audit.cjs` / `block-hunt.cjs` / `reveal-timing.cjs` 定位到三处瓶颈：

| # | 问题 | 证据 | 修复 | 效果 |
|---|---|---|---|---|
| 1 | Google Fonts 样式表为渲染阻塞资源，推迟 DOMContentLoaded，进而推迟全部 deferred 脚本 | DOMContentLoaded 964ms | 改为 `media="print"` + `onload` 异步加载 + `noscript` 兜底 | DCL 964→324ms，load 1681→388ms |
| 2 | `[data-reveal]` 转场 1s，首屏文字在 opacity≈0.9 才被记为 LCP | 透明度时间线：1490ms 起从 0 爬到 0.92 | 首屏 reveal 转场缩到 .5s（滚动区块仍 1s） | LCP 2.75→1.9s |
| 3 | `boot()` 在 DOMContentLoaded 同步执行 403ms，星点 canvas 初始化占大头 | `block-hunt` 单次回调 403ms | canvas 改为 `requestIdleCallback` 延后（rAF 双帧兜底） | boot 403→261ms |

另按实测字重收敛 Google Fonts 请求（`font-usage.cjs`）：门户由
Space Grotesk 400;500;600;700 + Noto Serif SC 600;700;900 收敛到实际用到的
700 / 900；苦旅与甜途的可变字重轴改为具体字重。字体传输 1600KB→1262KB。

**A/B 实测的取舍**：`display=optional` 与 `display=swap` 对 LCP 无差异
（均 1.85–2.1s），且 optional 会随机掉到系统字体、造成跨次渲染不一致，
因此保留 `swap`。

**尝试后撤销**：对首屏外区块加 `content-visibility:auto` 使 scrollHeight
从 7125 涨到 8313（+1188px）且性能无改善，已完全回退。

三站 LCP：门户 1900ms / 苦旅 1428ms / 甜途 1352ms；CLS ≤ 0.01（基线 0.023）。

### 第四轮：无障碍复核与标题层级（已修复）

新写 `a11y-audit.cjs`（图片替代文本 / 标题层级 / 地标 / 触控目标 / 表单标签 /
焦点规则）与 `hit-test.cjs`（用 elementFromPoint 实测命中区，而非量元素盒子）。
三站复核结果：

| 检查项 | 结果 |
|---|---|
| 图片替代文本 | 5 页均 0 缺失 ✓ |
| 表单控件标签 | 5 页均 0 无标签 ✓ |
| `lang` / `<title>` / `h1` 数量 / 地标 | 全部正常 ✓ |
| 标题层级 | 门户存在 **h2→h4 跳级** ✗ → 已修 |
| 触控目标 | 门户 `/` 与苦旅顶栏品牌链接仅 22px 高 ✗ → 已修 |

1. **标题跳级**：门户 mockup 卡片标签（市场雷达/面试题库/学习路线图/求职看板/
   就绪度）挂在「苦旅」h2 之下却用了 h4。改为 h3，样式选择器扩展为同时匹配，
   外观不变。修复后全站标题序列 `1→2→3…` 无跳级。
2. **触屏命中区**：`hit-test.cjs` 实测品牌链接命中高度由 20–28px 提升到 42–44px。
   做法是用负 inset 覆盖层扩展命中区，不改盒模型。页脚文字链实测 25.8px 已满足
   WCAG 2.5.8 的 24px，且相邻间距仅 28px，扩展会互相重叠，因此**明确不做**并记录原因。

### 事故与修复：门户构建标记被误删

去除触屏规则的 `@media` 外壳时，脚本正则误吞了 `@endinline:components` 标记
及其后全部内容，`index.html` 从 1990 行被截断到 579 行。处理过程：

1. 新增 `rebuild-portal.cjs`：按已知锚点从 `git HEAD` 精确重建
   （前缀 + 重新内联的 components 块 + 后缀），用标记齐全性与
   `</body></html>` 收尾做结构自检；
2. 新增 `fix-split-selector.cjs` / `fix-orphan-selector.cjs` /
   `clean-broken-selectors.cjs`：清理重建过程中被重复插入的注释造成的
   选择器断裂（CSS 会丢弃整条规则，导致 mockup 标题字重丢失）；
3. 以 `build-portal.cjs --check`、门户自身内容与 HEAD 的行级差异（0 行）、
   三站 `scrollHeight`、1440/390 像素对比（差异 ≤0.15%）完成回归。

### 第五轮：中文改用系统字族（已修复，最大单项收益）

`cjk-variant-measure.cjs` / `font-breakdown.cjs` 实测并落地：

| 站点 | 改动前字体 | 改动后 | 节省 |
|---|---|---|---|
| 门户 | 31 个 / 1419KB | 4 个 / **43KB** | 1376KB |
| 苦旅 | 23 个 / 759KB | 4 个 / **55KB** | 705KB |
| 甜途 | 16 个 / 942KB | 3 个 / **114KB** | 828KB |

**为什么这是安全的排版决策**：
1. 三站字体栈**本来就**把 `PingFang SC` / `Microsoft YaHei` / `Songti SC` 写在
   fallback 里，`DESIGN-SYSTEM.md` §2 也正是这么规定的——中文网络字体只是插在
   系统字体之前；
2. 苦旅与甜途的 `--font-display` 是 `Fraunces` / `Iowan Old Style`，
   `Noto Serif SC` 仅是其**备选**，在 Georgia/Songti 之前几乎不会命中，
   属「下载了却用不上」；
3. 拉丁字体（Space Grotesk / IBM Plex Mono / Inter / Fraunces）全部保留，
   它们才是品牌气质的主要来源。

**一处诚实的澄清**：四路对照（`fcp-isolate.cjs`）显示，先前观察到的
「FCP 1.4s → 60ms」主要来自**首次访问时对 fonts.gstatic.com 的 DNS/TLS 冷启动**
（第二轮即回到 60ms）。因此本改动的主要收益是**传输体积**（每页省 0.7–1.4MB）
与冷启动连接数，而非稳态首屏绘制速度。原始数字已按此口径修正。

---

### 第六轮：顶栏被祖先裁剪（已修复的真实缺陷）

新写 `pixel-probe2.cjs`（按选择器取采样点、解码 PNG 读像素）后，发现一个
**几何判定会漏掉、肉眼也难以在截图里察觉**的缺陷：

苦旅 `.topbar` 是 `position:fixed`，但它是 `main#top.stage{overflow:hidden}` 的
子元素。fixed 元素虽然以视口定位，**仍会被处于其包含块链上的 overflow 裁剪**；
`.stage` 只有 `100svh`，因此滚过首屏后：

| 检查点 | 实测 |
|---|---|
| y=2400 `.topbar` 中心像素 | rgb(255,253,247) = 页面底色 → **未绘制** |
| y=2400 `.ticket-button` 中心像素 | rgb(255,253,247)，而其 `background-color` 是 rgb(24,32,42) → **未绘制** |

即用户在首屏以下**完全失去导航与登录入口**。本地与线上一致（旧版同样存在）。

**修法**（最小结构改动）：把 `header.topbar` 从 `main.stage` 内移到 `body` 下、
`main` 之前。它是 fixed 浮层、不参与 `main` 布局，移动后不再被裁剪且视觉位置
不变（实测 `scrollHeight` 仍为 5433）；DOM 顺序变化使导航先于主内容被读到，
对读屏更合理。

**配套**：顶栏恢复渲染后，截图显示 logo 与正文直接叠在一起（无任何背景），
故重新启用「滚动实底」——与门户/甜途一致的模型；`.topbar` 自身是
`pointer-events:none` 容器，加背景不拦点击。

### 两点方法论教训（已固化到工具链）

1. **几何相交 ≠ 视觉遮挡**。先前的 `nav-overlay.cjs` 只比较矩形，把「已被
   overflow 裁掉、根本没绘制」的元素也判为「压住正文」，产生假阳性；
   并据此先给一个**不可见的元素**加了实底样式。发现后按「不发布无法验证的
   改动」回退，待结构修复后才重新启用。结论：可读性类判定必须以**像素采样**
   （`pixel-probe2.cjs`）为准，几何只用于定位候选。
2. **改裁剪要验证代价**。试过把 `.stage` 改为 `overflow:visible` 让 fixed 顶栏
   脱困，结果在 1024px 引入 13 处横向溢出（`.jobfilm__track` 等出血元素）且顶栏
   仍未绘制，已完全回退；最终用「移动 DOM」这一最小改动解决。

---

### 第七轮：甜途交互流程回归（发现并修好静默失效的弹窗原点）

新增 `travel-flows2.cjs`：14 项真实交互流程回归，全部用 CDP 鼠标/键盘事件驱动，
断言状态机而非看截图。覆盖：导航锚点滚动、下载弹窗开关（触发器/ESC/遮罩/关闭键）、
滚动锁定与恢复、复制链接反馈、画廊滚轮推进、HUD 与城市序号同步、回到顶部。

**首轮 8/12「失败」中，4 项是我自己的测试假设错误，不是站点缺陷**：
导航「下载」的语义是**滚动到 outro 区**（`travel-gallery.js` 的 `data-nav` 处理），
真正打开弹窗的是 outro 区里的 `.dl-chip[data-download-modal]`。
修正测试后 14/14 通过 —— 全站实际功能完好。

但这轮回归确实揪出一个**一直静默失效的动效**：下载弹窗的面板 `--ox/--oy`
恒为 `50.00%,50.00%`，即「从触发原点缩放」从未生效。两个叠加原因：

1. 触发器缺 `data-modal-trigger`，`ui.js` 无法按触发元素定位；
2. 时序问题：`travel-download.js` 的 click 监听器挂在**触发器自身**，在同一次
   点击里同步 `openModal()`，早于 `ui.js` 挂在 document 捕获阶段的落点记录；
   而 `ui.js` 的「初始即可见弹窗补算」在加载时就把 `dataset.uiOriginSet` 置上，
   导致再次打开时 observer 既不重算也不清除。

**修法**：组件层新增 `UI.origin(el)` 公开 API（`ui.js`），由自己控制打开时机的脚本
在 `openModal()` 前声明原点；`setOrigin` 直接写入当前可见面板，绕开 observer 时序；
`travel-download.js` 的 `openModal(triggerEl)` 接收触发器；触发器补 `data-modal-trigger`。

**验证**：原点由 `50%/50%` 变为 `21.36%/32.43%`，与触发器中心在弹窗覆盖层内的
相对位置逐位吻合（断言已收紧为数值比对，防止以后再退化却测试仍绿）。

### 教训：一个被 try/catch 吞掉的低级错误

修 `setOrigin` 时我把 `$$`（返回数组）误写成 `$`（返回单元素），
`panels.forEach is not a function` 抛出后被 `travel-download.js` 的 try/catch 吞掉
—— 表现为「代码确实执行了、却毫无效果、控制台也干净」。
只看点击路径的黑盒结果，这个错误查不出来；最后靠 `probe-origin-direct.cjs`
**直接调用 `UI.origin`** 才暴露。

→ 结论：动效类问题不能只测「用户路径」的结果，还要能**单独调用内部 API** 做定点验证。

---

### 第八轮：苦旅交互流程回归（21 项断言，全部通过）

补齐上一轮标记的缺口：新增 `learn-flows.cjs`，对照 `learn.js` 的状态机逐条断言，
全部用 CDP 真实鼠标/键盘事件驱动。覆盖：

| 分组 | 断言 |
|---|---|
| 手册详情 | 初始画廊态 → 点击打开（`data-mode=detail` + `aria-hidden=false` + `inert=false`）→ 标题/年份填充 → `aria-label` 随手册变化 → 仅一张 `selected` → 焦点落到关闭键 |
| 书单保存 | `aria-pressed` 切换 true/false + 两次 toast 文案（已加入/已移除） |
| 关闭与焦点 | ESC 关闭并回到画廊、焦点回到原手册卡片 |
| 站内菜单 | 打开（`data-menu=open` + `inert=false`）→ `aria-expanded`/`aria-label` 同步 → 焦点进入首个链接 → ESC 关闭并复位 → 焦点回菜单键 |
| 菜单跳转 | 点击菜单项后菜单关闭 + 滚动到对应区块（`#jobs` top 70px） |
| 键盘可达 | 菜单打开时 Tab 12 次均未逃出（焦点陷阱生效） |
| 登录入口 | 演示环境下给出提示而非跳转 |
| 异常 | 全程 0 条未捕获异常 |

**结果：21/21 通过，零产品改动。** 与甜途那轮不同，这次全部失败都是**我的测试代码**问题
（首轮 7/21），没有发现站点缺陷 —— 但这正是回归的价值：把「已知正确」变成**可复跑的断言**，
以后任何改动破坏交互契约都会立刻暴露。

### 三条工具教训（已固化，避免以后重复踩）

1. **合成点击的坐标必须与派发同拍**。曾为了「让 hover 生效」在取坐标与点击之间加
   `mouseMoved` 与 120ms 等待，结果页面动画让坐标过期、点击全部落空（7/21）。
   最终形态：`clickSel` 只做「取包围盒 → 必要时滚动并重取 → 立即只派发按下/松开」。
2. **卡住时不要只测黑盒路径**。本轮一度完全查不出原因，最后靠
   `learn-probe-state.cjs`（读命中元素与覆盖层）、`save-press-diff.cjs`
   （按下前/后/松开后三次采样）才定位。这类「工具本身有病」的场景，
   必须能**直接调用内部 API / 观察中间态**。
3. **按下期间做布局动画的元素无法用坐标点击稳定验证**。实测 `#saveButton`
   静止在 (1308,905)（12 次采样一致），但 `mousePressed` 之后其父容器
   `.detail-actions` 由 650px 瞬变为 309px、left 125 → 1037，按钮移出光标；
   松开时目标已是 `SECTION.gallery`，浏览器因此不生成 click。
   对该类元素改用 `el.click()` 直接派发，并在注释里**明确写清这不是坐标点击** ——
   验证的是 handler 与状态机，不验证命中区域。

---

### 第九轮：小号文本对比度全部达到 WCAG AA（五页 0 项）

新写 `ca-cluster.cjs`（对比度审计的聚类版）：背景改为「逐级上溯取第一个不透明
背景」，比旧审计更严格，并把失败项按「选择器 + 前景/背景色 + 字号字重 + 父容器」
归并，一眼看出是真实文本缺陷还是装饰性计数。

| 页面 | 修前 | 修后 | 根因与改法 |
|---|---|---|---|
| 门户 | 20 | **0** | `.marquee__group span` 硬编码 `#6B7480` 在跑马灯底色上 4.40:1 → 既有令牌 `--c-ink-500`（5.42:1）；`.learn-sec/.travel-sec .acc` 用亮品牌色作正文（3.38/3.53:1）→ 文本级令牌 `--c-learn-700`/`--c-travel-700` |
| 苦旅 | 3 | **0** | 5 处 `#8A939E`（`--c-ink-300`，本为**深色底**设计的浅灰）被用在浅色面板上，3.11:1 → 收敛到 `--c-ink-500`（5.73:1） |
| 甜途 | 33 | **0** | `--accent-2 #3D7FB5` 3.98:1 → `#3773A4` 5.06:1；`.scard__tag` 用亮橙 2.70:1 → `--c-travel-700` 5.14:1；`.smeta` 3.91:1 → `#9E5F3C` 5.05:1 |
| download / privacy | 0 | **0** | — |

甜途三处色值都取「沿同一色相压暗到刚好达标」的结果，不改变品牌色相；
覆盖块放在 `travel-sunny.css` 末尾，避免级联顺序出错。
门槛始终是 **4.5:1**（这些是 10–12px 的普通文本，不享受大字号 3:1 宽限）。

**顺带更正了自己的一条记录**：原「照片上的文字对比度不足」经新增的
`contrast-on-photo.cjs` 实测为 **0 项**（三站无一命中），该条描述不准确，已删除。

### 两项待决项结案（用数据，而不是继续挂着）

**① 「门户内联 CSS 是否该拆外链」——结论：不拆，单文件内联是更好的选择。**
`external-css-bench.cjs` 多轮实测：

| | 冷启动（全新浏览器进程） | 稳态（第 2 轮起） |
|---|---|---|
| FCP | **1430–1516ms**（三次独立测量 1476 / 1428 / 1496） | **60ms** |
| DCL | 320–362ms | 56–77ms |

稳态下内联与外链形态**完全一致（都是 60ms）**；差异只出现在首次访问，
且来自字体域 DNS/TLS 等一次性成本，与 CSS 形态无关。
→ 拆外链只会增加一次额外请求、丢掉单文件的原子性，收益为零。

必须坦白的测量失误：该脚本第一版报告「外链让 FCP 快 448ms」，
但日志里 `抽出 0 字符 CSS` 暴露了注入脚本在 `<style>` 被解析前就运行、
**根本没抽出任何东西** —— 那 448ms 只是「第一次访问 vs 已预热」的差别。
已按此更正结论。

**② 「`.tvisual` 卡片窄屏出血」——结论：不存在出血，是设计内层叠。**
`tvisual-check.cjs` 实测 390px：卡片 left=14px（在视口内）、
`documentElement.scrollWidth = 390 = innerWidth`（页面无横向溢出）；
容器 `.wrap` 左边距 22px，卡片相对容器左溢 8px，但仍落在同一侧留白内。
属「浮动照片卡压在主体图上」的既定构图，非缺陷。

---

## 8. 剩余可继续优化项

1. **首屏冷启动 FCP ≈1.4s（已归因，接受）**：稳态 FCP 60ms，
   1.4s 全部来自首次访问的一次性成本（字体域 DNS/TLS + 连接建立）。
   已用 `external-css-bench.cjs` 排除「内联 CSS 拆外链」这条路（实测收益为零）。
   若要继续压缩，只剩「减少对外部字体域的依赖」——上一轮已移除 CJK 网络字体，
   剩下的拉丁字体（43KB）是品牌气质来源，不建议再去。
2. **甜途画廊构图**：滚动位置与城市序号一一对应（0→01 甜途、1000→02 北京…），
   「主卡偏右」是转场瞬时态；若要改主卡停位需动 Three.js 相机与 `gallery.position.x`。
3. **甜途页面无法做像素回归**：WebGL 画廊初始态随机，同一份代码连测两次
   差异达 **60.4%**。该页的回归只能靠状态断言（`travel-flows2.cjs` 14/14）
   与计算式审计（`ca-cluster.cjs`），不能靠截图比对 —— 这是工具链的已知边界。
4. **窄视口 3px 横向溢出**（甜途 360/390）：逐段扫描未复现稳定溢出；
   `body` 已设 `overflow-x:hidden`，无用户可见影响。
5. **动效曲线统一**：三站缓动函数已有公共令牌，但少数历史覆盖层仍写死 `cubic-bezier`。
6. **苦旅顶栏视觉重量**：现为通栏实底；若要更轻可改「与内容同宽的胶囊」，
   但改动后需用 `pixel-probe2.cjs` 验证伪元素确实被渲染。
7. **详情面板按下期间的宽度过渡**：`mousePressed` 期间 `.detail-actions` 会出现
   650px→309px 瞬变；真实点击（`el.click()` 与键盘）均正常，未擅自改动。
