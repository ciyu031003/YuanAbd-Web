# pc-fixboxs.yuanabd.cn · UI 参考清单（designeer.xyz 选型）

> 版本：v0.1 ｜ 日期：2026-10-11 ｜ 状态：已采纳并落地到 Demo
> 参考站点：[designeer.xyz](https://www.designeer.xyz/)（Design Engineer 工具与灵感目录）
> 用途：回答「这个站上哪些 UI 设计可以直接拿过来用」

---

## 0. 先说结论

designeer.xyz 收录 **422 个条目 / 17 个分类**（Design Galleries 78、Component Libraries 109、Icons 30、Utilities 34、Reading 33、Agents & MCP 35 …）。

但我们的站点是**零依赖纯静态站**（无 npm、无框架、无打包器，nginx 直接托管）。这决定了：

| 分类 | 能否直接用 | 说明 |
|---|---|---|
| **Component Libraries（109 项）** | ❌ **几乎不能直接用** | 约九成是 React + Tailwind 组件（shadcn/ui、Magic UI、Aceternity、Cult UI…），需要 npm 构建链；与我们「零构建 + tokens.css」的形态冲突。**只能借鉴其结构与交互**，代码要自己用原生 CSS 重写 |
| **Icons（30 项）** | ✅ **可直接用** | SVG 图标库（Tabler / Lucide / Feather / Heroicons / Phosphor）；`css.gg` 更是纯 CSS 图标，连 SVG 文件都不需要 |
| **Design Galleries（78 项）** | ✅ **可直接参考** | navbar.design / footer.design / cta.gallery 等按「页面区块」分类的画廊，正是我们做页面时最缺的参照 |
| **Interface Design / Type / Color / Motion / Utilities** | ✅ **大部分可用** | 多为**框架无关**的在线工具（Utopia、OKLCH、Huetone、Transitions、Easing Wizard、SVGOMG、Squoosh） |

**一句话**：**这个站的价值对我们而言是「灵感与工具」，不是「组件仓库」。** 真正能直接搬的是**图标 + 区块画廊 + 设计工具**三类。

---

## 1. 直接采用（本 Demo 已用或已纳入规范）

### 1.1 图标 · 可直接搬

| 条目 | 地址 | 为什么能用 | 本 Demo 的处理 |
|---|---|---|---|
| **Tabler Icons** | https://tabler.io/icons | 纯 SVG、24px 网格、描边风格统一，无运行时依赖 | 领域图标按其风格手写为内联 `<svg>`（stroke-width 1.7） |
| **Lucide** | https://lucide.dev/ | 同上，Feather 系，生态大、命名清晰 | 搜索 / 复制 / 收藏等 UI 图标参考 |
| **Feather** | https://feathericons.com/ | 24px 网格的极简线性图标，正是「安静工具感」需要的调性 | 图标规范基准（24×24、1.5–1.7 描边、圆头圆角） |
| **Heroicons** | https://heroicons.com/ | Tailwind 官方，outline/solid 双套 | 备选 |
| **Phosphor** | https://phosphoricons.com/ | 六种字重（weight）一致性强 | 备选（若后续需要「重要程度」用字重表达） |
| **css.gg** | https://css.gg/ | **纯 CSS 渲染**的 700 个图标，零文件依赖 | 场景适合：极简站点减少请求数；本 Demo 未用（内联 SVG 更可控） |

> 实现约定：**内联 SVG，不用 icon font，不用 emoji 当图标**。图标只是视觉增强，一律 `aria-hidden="true"`，语义由相邻文字承担。

### 1.2 设计工具 · 框架无关，直接用于出规范

| 条目 | 地址 | 用途 |
|---|---|---|
| **Utopia** | https://utopia.fyi/ | 流体排版计算器，生成 `clamp()` —— 本站 H1/H2 的 `clamp()` 阶梯按它校准 |
| **OKLCH** | https://oklch.com/ | 感知均匀色彩空间取色；本站薄荷深阶（`#12805F` / `#0F766E`）在此校准明度差 |
| **Huetone** | https://huetone.ardov.me/ | 生成可访问（对比度达标）的色阶 —— 风险三色（安全/谨慎/危险）用它验证 |
| **Color.review** | https://color.review/ | 对比度检查，直接给出「这个色能不能用于正文」 |
| **APCA** | https://www.myndex.com/APCA/ | 下一代对比度算法（WCAG 3 草案），用于复核 WCAG 2.1 的边界值 |
| **Ramps** | https://www.ramps.studio/ | 生成 OKLCH 色阶并导出为 design token |
| **Transitions** | https://transitions.dev/ | **框架无关**的 CSS 过渡配方与缓动曲线 |
| **Easing Wizard** | https://easingwizard.com/ | 可视化生成 CSS spring 缓动，直接产出 `cubic-bezier()` |
| **UI Playbook** | https://uiplaybook.dev/ | 逐个讲解组件的**状态**（default/hover/focus/disabled/loading）—— 正好补上我们组件规格表最容易漏的部分 |
| **Component Gallery** | https://component.gallery/ | 横向对比各大设计系统对同一组件的不同做法，用于做组件命名与 API 决策 |
| **SVGOMG** | https://jakearchibald.github.io/svgomg/ | 内联 SVG 前压缩（本 Demo 的图标均已是手写精简路径） |
| **Squoosh** | https://squoosh.app/ | 教程截图转 WebP/AVIF |
| **textmotion** | https://textmotion.dev/ | 零依赖文本滚动动画原语 —— 若后续做「搜索框里的轮播提示词」可用 |

### 1.3 区块画廊 · 做页面时的第一参照

这些画廊**按页面区块分类**，比「整站灵感」实用得多：

| 条目 | 用于本项目的哪个部分 |
|---|---|
| **navbar.design** / **navbar.gallery** | 顶栏（Logo + 4 项导航 + 右侧常驻搜索）的形态与吸顶处理 |
| **footer.design** | 页脚四栏（品牌 / 领域快链 / 常用 / 关于）+ 底部备案合规条 |
| **cta.gallery** | 「不知道怎么描述问题？用症状向导」这条横幅的按钮与文案排版 |
| **Sections.wtf** / **Supahhero** | Hero 区（大标题 + 一句话副标题 + 搜索框 + 热词 chips）的节奏 |
| **Collect UI**（按组件标签） | 搜索框、空状态、步骤条、徽章等单组件形态 |
| **Mobbin** / **Screenlane** / **Pttrns** | 「分步骤引导」在真实 App 里的做法（进度、勾选、下一步） |
| **Dark Mode Design** | 若后续做深色模式的配色参照（当前 Phase 4 再说） |
| **Loader Buttons** | 复制命令按钮的「已复制」反馈动效参考 |
| **UI Playbook** | 空结果、加载中、错误态等「非理想状态」的清单 |

---

## 2. 需要改造后才能用（只借鉴，不引入）

以下都属 React/Tailwind 生态，**直接引入会破坏本站「零构建、零依赖」的架构**。正确的用法是：**读它的结构与交互，用我们自己的 `fix.css` + tokens 重写**。

| 条目 | 地址 | 值得借鉴的部分 |
|---|---|---|
| **shadcn/ui** | https://ui.shadcn.com/ | 「复制进代码库而不是装依赖」的哲学与本项目一致；其组件 API 命名可作参考 |
| **21st.dev** / **shoogle** | https://21st.dev/ | shadcn 生态的组件检索；找「某个交互长什么样」时很好用 |
| **Base UI** / **Radix** | https://base-ui.com/ | **无障碍交互模式**（combobox / dialog / tabs 的键盘与 ARIA 行为）—— 我们手写搜索框 combobox 时以它为准 |
| **daisyUI** | https://daisyui.com/ | 纯类名组件库，语义类命名（`btn-primary`/`badge-warning`）启发了本站 `.fx-badge--caution` 的命名 |
| **HyperUI** / **Float UI** / **TailGrids** / **Meraki UI** | https://www.hyperui.dev/ | 纯 HTML+Tailwind 片段，**去 Tailwind 后结构可直接复用**，是改造成本最低的一类 |
| **Preline** / **Flowbite** | https://preline.co/ | 组件状态与交互细节（尤其表单、下拉、手风琴） |
| **Magic UI** / **Aceternity** / **Cult UI** / **Motion Primitives** | https://magicui.design/ | 动效思路；但本站动效克制（只解释不装饰），**绝大多数不适用** |
| **Tailark** / **UI Layouts** / **blocks.so** | https://tailark.com/ | 整段页面布局（Hero / Feature / FAQ / Pricing）—— 可借鉴信息密度与留白比例 |
| **Tremor** | https://tremor.so/ | 若后续做「排障数据看板」（零结果词统计）可参考图表样式 |

---

## 3. 明确不采用

| 类别 | 原因 |
|---|---|
| 所有需要 npm 安装的组件库 | 与「纯静态 + 零依赖」架构冲突；引入打包器会让部署链从 `scp 静态文件` 变成 `构建 + 容器`，收益不抵成本 |
| 3D / Shader / WebGL 类（Spline、Canvas UI 等） | 用户设备可能就是那台坏电脑，低配优先，禁用 WebGL（设计方案 §9.2 已定） |
| 声音类（soundcn、cuelume、sensory-ui） | 排障场景需要安静；且属额外依赖 |
| 大面积动效组件（Smooth UI、Vengeance UI 等） | 违反「Motion should explain, not decorate」 |
| 第三方统计脚本（Umami Cloud 等托管版） | 隐私说明承诺「不使用第三方追踪」；如需统计只上自托管方案 |

---

## 4. 映射表：我们的页面 ← 参考来源

| 页面/组件 | 主要参考 | 借鉴了什么 |
|---|---|---|
| 顶栏 sticky + 常驻搜索 | navbar.design、navbar.gallery | 高度 64px、右侧常驻搜索胶囊、滚动后毛玻璃 |
| Hero + 大搜索框 | Supahhero、Sections.wtf | 「搜索框就是 Hero」的排版配比、热词 chips 的位置 |
| 领域卡网格（4×3） | Tailark、UI Layouts | 卡片信息密度（图标+名称+描述+计数）与留白 |
| 教程卡 | HyperUI、Float UI | 卡片结构顺序；去 Tailwind 后用 `.fx-card` 重写 |
| 步骤时间轴 | Mobbin、Screenlane | 步骤勾选与进度的交互惯性 |
| 命令块 + 复制 | Collect UI、Loader Buttons | 复制后的即时反馈样式 |
| 空结果三件套 | UI Playbook | 「非理想状态」必须给出口，不留白屏 |
| 风险提示条三色 | Huetone、Color.review | 三色对比度达标验证（详见设计方案 §4.3） |
| 症状向导选项卡 | Mobbin、Radix 交互模式 | 一次一问、选择即前进、可返回 |
| 排版阶梯 | Utopia | 用 `clamp()` 生成流体字号（H1 30→46px） |

---

## 5. 落地结果

本清单中被采纳的部分已全部体现在 Demo 里（见 `demo/fixboxs/`），且**没有引入任何第三方运行时依赖**：

| 采纳项 | 落地位置 |
|---|---|
| 内联 SVG 线性图标（Tabler/Feather 风格） | `demo/fixboxs/index.html`、`browse.html`、`tools.html` 及构建脚本 |
| 流体字号 `clamp()`（Utopia 思路） | `demo/fixboxs/css/fix.css` 的 `.fx-hero h1`、`.fx-title`、`.fx-wiz__q` |
| 对比度校验后的薄荷深阶与风险三色 | `demo/fixboxs/css/theme-fix.css` |
| 组件状态规范（UI Playbook 思路） | `fix.css` 中按钮/卡片/输入框的 hover / focus-visible / active / disabled |
| 框架无关 CSS 过渡（Transitions 思路） | `fix.css` 的 `--ui-ease-out` 系列过渡 |

---

## 6. 参考链接

- Designeer 目录：https://www.designeer.xyz/
- Tabler Icons：https://tabler.io/icons ｜ Lucide：https://lucide.dev/ ｜ Feather：https://feathericons.com/ ｜ css.gg：https://css.gg/
- Utopia：https://utopia.fyi/ ｜ OKLCH：https://oklch.com/ ｜ Huetone：https://huetone.ardov.me/ ｜ Color.review：https://color.review/ ｜ APCA：https://www.myndex.com/APCA/
- UI Playbook：https://uiplaybook.dev/ ｜ Component Gallery：https://component.gallery/ ｜ Transitions：https://transitions.dev/
- navbar.design：https://navbar.design/ ｜ footer.design：https://footer.design/ ｜ cta.gallery：https://cta.gallery/ ｜ Collect UI：https://collectui.com/ ｜ Mobbin：https://mobbin.com/

---

*文档完。*
