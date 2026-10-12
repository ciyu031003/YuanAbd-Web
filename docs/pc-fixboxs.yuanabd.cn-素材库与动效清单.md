# pc-fixboxs.yuanabd.cn · 视觉与交互素材库 + 动效清单

> 版本：v0.1（调研稿，不含实现代码）
> 日期：2026-10-11
> 状态：待评审
> 涉及域名：`pc-fixboxs.yuanabd.cn`（修盒子 FIXBOX · 电脑/网络故障自助排障知识库）
> 素材库：[designbookmark.com](https://designbookmark.com/)（2548 个设计工具/网站，59 个分类）
> 用途：把 Demo 的视觉从「安静的工具感」升级为「青春活泼」，并给出可直接落地的加载动画、页面切换、组件流转与微交互方案。

---

## 0. 先说结论

| 结论 | 内容 |
|---|---|
| **素材库规模核实** | designbookmark.com 自带 `sitemap.xml` → `sitemaps/categories.xml` 精确列出 **59 个非分页分类**（见 §2.1），与站点自述的 59 个分类完全吻合 |
| **本次实际抓取** | **14 个分类 / 22 个分类页（含分页）/ 758 条条目**（见 §1.2 抓取台账） |
| **真正相关的分类** | 筛出 **12 个**（见 §2.2）：3D & Motion、Color & Gradient、Free UI Resources、Icons、Typography、Illustrations、Design Inspiration、Design Systems、Design Tools、Website / Framer Templates、Figma Resources、Music & Sound；另附 Mockups 作展示辅助 |
| **能直接搬的** | 图标 SVG、系统字体栈、**纯 CSS 动效片段**（Colorion Tools 66 个文字动效、Kinetics 117 个动效模式、Border Beam、Generative Loaders、Dot Matrix） |
| **只能取数值的** | 渐变 / 配色 / 阴影（Egg Gradients、uiGradients、Box Shadow、Tints.dev…） |
| **只能作灵感的** | React/Tailwind 组件库（Aceternity、Magic UI、React Bits…）、Lottie / Rive / Three.js / Spline 运行时、Framer 模板 |
| **推荐配色** | **方案 A「薄荷气泡 Mint Soda」**（与现有 #91E6C1 / #FFFDF7 完全兼容，见 §4.1） |
| **推荐页面切换** | **§6 方案 3「进场接续式」**（head 内联脚本 + CSS 类 + sessionStorage 首访判断），并以方案 1（跨文档 View Transitions）做渐进增强 |

**一句话**：这个站对我们的价值，是**手法词典**（怎么动、动多久、动哪些属性）+ **数值仓库**（渐变色、阴影、字阶），不是代码仓库。所有候选方案必须能压缩成「一份 CSS 文件 + 几十行原生 JS」。

---

## 1. 抓取记录（真实抓取，可复现）

### 1.1 站点结构与抓取入口

| 步骤 | 请求 | 结果 |
|---|---|---|
| 1 | GET https://designbookmark.com/ | 200，HTML 204,040 字节；RSC 流式载荷；首页仅暴露 14 个一级组链接（/design、/ai、/dev、/web、/marketing、/productivity、/business、/media、/learning、/mac-apps、/windows-apps、/linux-apps、/chrome-extensions…） |
| 2 | GET /robots.txt | 200，声明 `Sitemap: https://designbookmark.com/sitemap.xml`；对 GPTBot / ClaudeBot / OAI-SearchBot 均 Allow: / 且 Crawl-delay: 10 |
| 3 | GET /sitemap.xml | 200，索引三个子 sitemap：pages.xml、categories.xml、tools.xml |
| 4 | GET /sitemaps/categories.xml | 200，16,351 字节 → **去分页后恰好 59 条分类 URL**（本次抓取的分类清单来源，零猜测） |
| 5 | GET /design/3d-motion 等 22 个分类页 | 200，每个页面内嵌 **JSON-LD CollectionPage.hasPart**，逐条含 name / url（官方外链）/ description（一句话简介） |
| 6 | GET /sitemaps/pages.xml | 200，2,747 字节（/newest、/bookmarks、/sponsor、/privacy 等静态页，无额外分类） |

**关键发现**：分类页的 JSON-LD 直接给出了**条目名 + 官方外链 + 官方一句话简介**三件套，无需抓 2548 个详情页即可得到可信事实。本文档中所有条目名、链接、分类名、简介均出自该结构，未做任何推测性补全。

### 1.2 抓取台账（14 分类 / 22 页 / 758 条）

| # | 分类（中文） | slug | 抓取页 | 抓到条数 | 站内总数 | 是否抓全 |
|---|---|---|---|---|---|---|
| 1 | 3D 与动效 | /design/3d-motion | p1 + p2 | 64 | 64 | 全 |
| 2 | 配色与渐变 | /design/color | p1 + p2 | 63 | 63 | 全 |
| 3 | 免费 UI 资源 | /design/ui-resources | p1 + p2 | 84 | 84 | 全 |
| 4 | 图标 | /design/icons | p1 + p2 | 70 | 70 | 全 |
| 5 | 字体排印 | /design/typography | p1 + p2 | 60 | 60 | 全 |
| 6 | 插画 | /design/illustrations | p1 | 32 | 32 | 全 |
| 7 | 设计灵感 | /design/inspiration | p1 + p2 | 96 | **341** | 仅抓 2/8 页（28%） |
| 8 | 设计系统 | /design/design-systems | p1 + p2 | 49 | 49 | 全 |
| 9 | 设计工具 | /design/design-tools | p1 + p2 | 92 | 92 | 全 |
| 10 | 网页模板 | /web-templates | p1 | 23 | 23 | 全 |
| 11 | Framer 模板 | /framer-templates | p1 | 24 | 24 | 全 |
| 12 | Figma 资源 | /figma-resources | p1 | 23 | 23 | 全 |
| 13 | 音乐与音效 | /media/audio | p1 | 38 | 38 | 全 |
| 14 | 样机 | /design/mockups | p1 | 40 | 40 | 全 |
| — | **合计** | — | **22 页** | **758** | — | — |

### 1.3 抓不到的 / 不存在的东西（明说）

| 事项 | 实际情况 |
|---|---|
| **独立的「Loading」分类** | 不存在。加载动画分散在 /design/ui-resources（Generative Loaders、Dot Matrix、Arc UI）与 /design/3d-motion。 |
| **独立的「Cursor」分类** | 不存在。光标类条目在本次抓取范围内**未出现**（站内也没有 cursor 分类）。若要做自定义光标，只能自研或另找 Awwwards 类站点。 |
| **独立的「微交互」分类** | 不存在。最接近的是 /design/inspiration 下的 **Design Spells**、**Detail**、**Details**、**Motion.ed** 四个专做交互细节的站点（见 §3.7）。 |
| **独立的「声音」分类** | 名为 **Music & Sound**（/media/audio），但全部是**音乐 / 音效素材库**，没有「UI 音效交互设计」的方法论站点。 |
| **/design/inspiration 剩余 6 页（245 条）** | 未抓。该分类共 341 条 / 8 页；p1+p2 已覆盖全部「交互细节 / 落地页 / Hero / 导航 / 页脚」条目，剩余以作品集画廊与品牌灵感为主，判断为低收益。**不编造**。 |
| **2548 这个总数** | 未能用单一页面独立复核（/sitemaps/tools.xml 未下载）。本文档只对**已抓到的 758 条**负责。 |

---

## 2. 从 59 个分类里筛出相关的 12 个

### 2.1 全站 59 个分类总览（来自 /sitemaps/categories.xml）

| 组 | 分类 slug | 中文 | 与本次目标相关性 |
|---|---|---|---|
| design | /design/inspiration | 设计灵感 | 强相关（交互细节库） |
| design | /design/design-tools | 设计工具 | 强相关（原型 / 动效 / 取样式） |
| design | /design/ui-resources | 免费 UI 资源 | 强相关（组件与动效片段） |
| design | /design/icons | 图标 | 强相关（动画图标） |
| design | /design/illustrations | 插画 | 相关（视觉年轻化） |
| design | /design/mockups | 样机 | 辅助（展示图） |
| design | /design/color | 配色与渐变 | 强相关 |
| design | /design/typography | 字体排印 | 相关 |
| design | /design/design-systems | 设计系统 | 相关（动效 token） |
| design | /design/3d-motion | 3D 与动效 | 强相关（核心） |
| ai | /ai/ai-writing · /ai/ai-image · /ai/ai-video · /ai/ai-audio · /ai/ai-assistants · /ai/ai-dev · /ai/ai-agents · /ai/agent-skills | AI 写作 / 图像 / 视频 / 音频 / 助手 / 开发 / Agent / 技能 | 全部无关 |
| dev | /dev/code-editors · /dev/frameworks · /dev/hosting · /dev/backend · /dev/dev-tools · /dev/scraping | 代码编辑器 / 框架 / 托管 / 后端 / 开发工具 / 抓取 | 全部无关（站点零框架、零构建） |
| web | /web/website-builders · /web/no-code · /web/cms | 建站器 / 无代码 / CMS | 全部无关 |
| marketing | /marketing/seo · /marketing/email · /marketing/analytics · /marketing/social · /marketing/growth | SEO / 邮件 / 分析 / 社交 / 增长 | 全部无关 |
| productivity | /productivity/notes · /productivity/pm · /productivity/scheduling · /productivity/forms · /productivity/diagrams | 笔记 / 项目管理 / 日程 / 表单 / 图表 | 仅 /productivity/forms 弱相关（表单微交互，本次未抓） |
| business | /business/ecommerce · /business/payments · /business/startups · /business/hiring · /business/freelance | 电商 / 支付 / 创业 / 招聘 / 自由职业 | 全部无关 |
| media | /media/stock-photos · /media/stock-video · /media/video-editing · /media/screen-recording | 图库 / 视频素材 / 视频剪辑 / 录屏 | 全部无关（录屏仅用于录 demo） |
| — | /mac-apps · /windows-apps · /linux-apps · /chrome-extensions · /notion-templates | Mac / Windows / Linux 应用、Chrome 扩展、Notion 模板 | 仅 /chrome-extensions 弱相关（VisBug / CSS Peeper 已归入设计工具） |
| learning | /learning/learn · /learning/podcasts · /learning/community · /learning/marketplaces | 学习 / 播客 / 社区 / 市场 | 全部无关 |

**统计**：59 个分类中，强相关 5 个、相关 4 个、辅助 / 弱相关 4 个、无关 42 个（含 4 个学习类）。

### 2.2 本次纳入的 12 个分类（+1 个辅助）

| # | 分类 | slug | 为什么纳入 | 对本站的产出 |
|---|---|---|---|---|
| 1 | 3D 与动效 | /design/3d-motion | 动效原理、缓动 / 弹簧 token、滚动叙事、SVG 逐笔绘制的主要来源 | 动效清单的**运动曲线与编排** |
| 2 | 配色与渐变 | /design/color | OKLCH、对比度审计、渐变 / 网格渐变 / 颗粒渐变 | §4 三套配色 + 渐变手法 |
| 3 | 免费 UI 资源 | /design/ui-resources | **纯 CSS 动效片段密度最高**的分类 | 按钮 / 加载 / 文字动效的**可复制代码** |
| 4 | 图标 | /design/icons | 动画图标、纯 CSS 图标、描边风格统一 | 微交互图标 + 零文件依赖图标方案 |
| 5 | 字体排印 | /design/typography | 系统字体栈、可变字体、流体字阶 | 不增加体积的「活泼感」排版 |
| 6 | 插画 | /design/illustrations | 可换色 SVG 插画、手绘风、等距插画 | 空状态 / 404 / 引导页的年轻化视觉 |
| 7 | 设计灵感 | /design/inspiration | Design Spells / Detail / Motion.ed / HeroGrids / Navbar Gallery | 微交互与区块的**参照样本** |
| 8 | 设计系统 | /design/design-systems | Material Motion / Laws of UX / 动效 token 管理 | 动效时长与缓动的**规范依据** |
| 9 | 设计工具 | /design/design-tools | 原型动效工具、SVG 优化、对比度检查 | 工作流与**验证手段** |
| 10 | 网页模板 | /web-templates | HTML5 UP / Templatemo 是**真正的纯静态 HTML+CSS** | 可直接拆的布局与动效写法 |
| 11 | Figma 资源 | /figma-resources | 区块库（uiblockify）、UI Kit 规范 | 组件视觉规范 |
| 12 | 音乐与音效 | /media/audio | 免费 UI 音效素材 | 微交互「咔哒」声（默认关闭） |
| + | 样机（辅助） | /design/mockups | 做交付截图与循环展示视频 | README / 门户的展示图 |

---


## 3. 素材总表（按分类，含借鉴手法与落地形式）

**落地形式图例**：
纯CSS = 不引入任何依赖即可复刻；需JS = 需要原生 JS（不含第三方库）；取数值 = 只能取色值 / 阴影 / 尺寸等常量；灵感 = 只能参考思路；素材 = 可直接下载的静态资源（SVG / 字体 / 音效）。

### 3.1 3D 与动效（/design/3d-motion，抓到 64 条）

| 条目 | 链接 | 它是什么 | 我们能用它借鉴什么 | 可落地形式 |
|---|---|---|---|---|
| **Springs** | https://www.springs.studio | 弹簧 / 缓动运动 token 构建器，可导出 CSS、Tailwind、Framer Motion、DTCG | 把动效曲线做成 token：--ease-out-back: cubic-bezier(.34,1.56,.64,1)；用 CSS linear() 采样弹簧曲线做「果冻」回弹；在真实 UI（modal / toast）上预览再定值 | 纯CSS |
| **Kinetics** | https://kinetics.colorion.co | 117 个可复制到 CSS 或 React 的动效模式 | 成套动效类命名（k-fade-up / k-pop / k-slide）+ 错峰延迟 animation-delay: calc(var(--i,0) * 60ms)；一次定义、全站复用 | 纯CSS |
| **anime.js** | https://animejs.com | 轻量 JS 动画库（stagger / 时间线 API 著名） | stagger() 的错峰思路可用原生 WAAPI 复刻：el.animate(kf, {delay: i*60})；不建议引库 | 需JS（原生 WAAPI 替代） |
| **GSAP** | https://gsap.com | 专业级 JS 动画库（时间线 + ScrollTrigger） | 滚动叙事的分镜思维：IntersectionObserver 当触发器，CSS 变量当进度（--p: 0→1），避免引入 100KB+ 运行时 | 灵感 |
| **Lenis** | https://lenis.darkroom.engineering | Studio Freight 的轻量平滑滚动库 | 平滑滚动的**降级阶梯**：① 原生 scroll-behavior: smooth；② 锚点用 element.scrollIntoView({behavior:'smooth'})；③ 惯性滚动只能靠 JS，且必须在 prefers-reduced-motion 下关闭 | 灵感（部分纯CSS） |
| **Tegaki** | https://gkurt.com/tegaki/ | 开源库，把任意字体按笔顺「手写」出来（React/Vue/Svelte/原生 JS） | **SVG 逐笔绘制**：stroke-dasharray: var(--len) + stroke-dashoffset 从 var(--len) 到 0，配合 pathLength="1" 免测量；用于 Logo、标题下划线、图标描边 | 纯CSS |
| **Zdog** | https://zzz.dog | 圆润扁平的伪 3D 引擎（canvas / SVG） | 扁平伪 3D 观感可用纯 CSS 近似：容器 perspective: 600px + 子元素 transform: rotateY(20deg) rotateX(8deg)；只动 transform，合成层友好 | 纯CSS |
| **Three.js** | https://threejs.org | 最流行的 Web 3D 库 | 不建议引入（150KB+）。若要「科技感球体」，用径向渐变 + 缓慢旋转的伪元素堆叠替代 | 灵感 |
| **Spline** | https://spline.design | 浏览器内 3D 设计与协作 | 3D 场景导出为图片 / GIF 当静态装饰位图（可控体积）；交互 3D 需求直接放弃 | 灵感 |
| **Rive** | https://rive.app | 状态机驱动的交互式动画，跨平台 | **状态机思维**照搬到 CSS：.card[data-state="idle" / "hover" / "loading" / "done"] 各挂一套 transition，类名切换即状态流转 | 纯CSS（思路） |
| **Lottie** | https://airbnb.io/lottie | 解析 After Effects 动画 JSON（Bodymovin）并在移动端 / Web 原生渲染的库 | Lottie 播放要 lottie-web（约 250KB）→ **改用内联 SVG + CSS keyframes** 重画关键帧；Lottie 只当「动作参考」 | 灵感 |
| **Lottie Files** | https://lottiefiles.com | 免费轻量动画的托管平台 | 找动作参考最省时的入口；下载 JSON 后只做人眼参考，不入代码 | 灵感 / 素材 |
| **Lottielab** | https://www.lottielab.com | 浏览器内创建与编辑 Lottie 动画 | 关键帧 → CSS keyframes 的转换练习场 | 灵感 |
| **Aninix** | https://www.aninix.com | 把 Figma 设计转成可交互 Lottie 动画 | 微交互的分镜参考（Figma 稿 → 动画） | 灵感 |
| **Keyshape** | https://www.keyshapeapp.com | Mac 上制作动画 SVG 与 Lottie 矢量图 | 导出 SVG 动画后可直接拆成 CSS keyframes 的结构 | 灵感 |
| **useAnimations** | https://useanimations.com | 用 Lottie 做的微交互图标库 | 微交互图标的**场景清单**（加号→叉、汉堡→关闭、播放→暂停），每个用手写 SVG + stroke-dashoffset 重做 | 灵感 + 需JS（类切换） |
| **Lordicon** | https://lordicon.com | 大量动画图标库 | 动画图标的**两段式**做法：hover 触发播放一次（animation + forwards），离开不复位 | 素材 / 灵感 |
| **Motion** | https://motion.dev | React / JS 动画库（原 Framer Motion） | whileHover / whileTap / layout 语义可映射为 CSS：:hover、:active，以及 view-transition-name 做共享元素 | 灵感 |
| **Motion Primitives** | https://motion-primitives.com | 基于 Motion 的动画 UI 组件 | 组件级动效清单（accordion、toast、dialog 的进离场），照着手写 CSS 版本 | 灵感 |
| **Shader Gradient** | https://www.shadergradient.co | 生成可动的 3D 渐变 | 3D 渐变 → CSS 近似：3–4 层 radial-gradient 叠加 + filter: blur(40px) + 60s 缓慢位移；@property --angle 让 conic 角度可动画 | 灵感 / 纯CSS（近似） |
| **Pryzm** | https://pryzm.design | 浏览器里的原创背景与动画循环工作室 | 循环背景的分层思路：底层纯色 → 中层大色斑 → 顶层噪点，各自独立动画 | 灵感 |
| **Theatre.js** | https://www.theatrejs.com | 带可视化编辑器的 Web 动效工具 | 关键帧编排的「序列」概念：用 animation-delay 排时间轴，而不是用 JS setTimeout 串 | 灵感 |
| **Motioner** | https://motioner.app | 像设计软件而不是视频时间线的动效工作台 | 给「哪些元素值得动」定优先级：标题 > 主按钮 > 卡片 > 装饰；静态稿只动 1–2 个元素 | 灵感 |
| **Jitter** | https://jitter.video | 简单的动效设计工具 | 动效节奏参照（何时快、何时停） | 灵感 |
| **Raylight** | https://raylight.app | 浏览器内做高质量动效视频的编辑器 | 同上 | 灵感 |
| **Momentum Graphics** | https://momentum.graphics | 浏览器内把静态视觉变成动效（社交帖 / 作品集 / 演示） | 静态 → 动态的最少动作原则 | 灵感 |
| **Doppio** | https://doppio.design | 精选模板 + 编辑器，输出静态视觉或动效短片 | 模板化动效的复用思路 | 灵感 |
| **Swishy** | https://swishy.ai | AI 动效设计：把静态字体与版式变动画 | 文字动效的类型清单 | 灵感 |
| **Showreel.design** | https://showreel.design | 每周更新的动效 reel 档案 | 动效节奏感参照，不抄画面 | 灵感 |
| **Onshape / Rhino / OpenSCAD / Blender / Womp / Cinema 4D / Polycam / Meshy / Mixamo / Poly Pizza / Sketchfab / Vectary / Substance 3D / Bezi / After Effects / Krita / Vroid** | 见站点各条 | 纯 3D 建模、扫描、角色动画工具 | 与网页视觉升级无关 | 不用 |

### 3.2 配色与渐变（/design/color，抓到 63 条）

| 条目 | 链接 | 它是什么 | 我们能用它借鉴什么 | 可落地形式 |
|---|---|---|---|---|
| **OKLCH Color Picker** | https://oklch.com | 用 OKLCH 色彩空间表示颜色 | 色板全部用 oklch(L C H) 写；hover / active 用 color-mix(in oklch, var(--c), #000 12%) 生成，**不用手算第二个 hex** | 纯CSS |
| **Radix Colors** | https://www.radix-ui.com/colors | 可访问的 12 阶色阶系统 | 把主色做成 --mint-1 … --mint-12 十二阶变量，语义层再映射（--bg / --surface / --border / --solid / --text）；阶数命名法直接抄 | 纯CSS |
| **Leonardo** | https://leonardocolor.io | 按目标对比度反推可访问色板 | 先定「正文 ≥ 4.5:1」目标再生成色板（本文 §4.4 的审计表就是这么做的） | 取数值 |
| **Color Review** | https://color.review | 探索可访问配色对并检查 WCAG 对比度 | 配色定稿前的必过检查 | 取数值 |
| **Who Can Use** | https://whocanuse.com | 展示某组配色在不同视觉条件下如何被读取 | 重点看「主色 vs 错误红 vs 成功绿」是否互相可辨 | 取数值 |
| **Egg Gradients** | https://www.eggradients.com | 现成渐变背景，带 hex 与 CSS 代码 | 直接复制背景渐变（linear-gradient / radial-gradient），用于 Hero 与卡片装饰 | 纯CSS |
| **uiGradients** | https://uigradients.com | 可直接复制 CSS 的渐变集合 | 取渐变值 | 纯CSS |
| **WebGradients** | https://webgradients.com | 180 个线性渐变的 CSS 集合 | 取渐变值 | 纯CSS |
| **Coolhue** | https://webkul.github.io/coolhue | 手挑渐变集合 | 取渐变值 | 纯CSS |
| **Gradient Hunt** | https://gradienthunt.com | 每日更新的渐变精选 | 取渐变值 | 纯CSS |
| **Grabient** | https://www.grabient.com | 简单的渐变生成与取用 | 取渐变值 | 纯CSS |
| **CSS Gradient** | https://cssgradient.io | 免费的 CSS 渐变生成器 | 生成多色标渐变 | 纯CSS |
| **GRADIENTOOL** | https://gradientool.com | 生成渐变与**渐变动画**并导出 | 可动画渐变：background: linear-gradient(var(--angle), c1, c2) + @property --angle { syntax:'<angle>' } + @keyframes 转 --angle 到 360deg | 纯CSS |
| **Gradients.cool** | https://www.gradients.cool | Mac 原生渐变工作室，120 个静 / 动背景预设 | 取预设值；动画部分用 CSS 复刻 | 取数值 |
| **Colir** | https://colir.space | 浏览器内做自定义渐变并复制 CSS | 取渐变值 | 纯CSS |
| **Hypercolor** | https://hypercolor.dev | Tailwind 渐变精选 | 取渐变值 | 纯CSS |
| **Mesh Gradients** | https://meshgradient.com | 可定制网格渐变生成 | 网格渐变 = 4 个 radial-gradient 甩在不同锚点 + 大半径 | 纯CSS |
| **Magic Pattern** | https://www.magicpattern.design | 生成 CSS 背景图案 / 渐变 / 网格渐变 | 图案用 background-image + background-size（如 24px 网格点阵） | 纯CSS |
| **Grainient** | https://grainient.supply | 动画颗粒渐变 | 噪点层：SVG feTurbulence → data-URI → background-repeat + mix-blend-mode: overlay；造「活泼」的廉价手段，体积 < 1KB | 纯CSS |
| **Realtime Colors** | https://www.realtimecolors.com | 把配色实时套到真实网站上预览 | 定色时**直接在真实排版上验证**，别在色卡上定 | 取数值 |
| **Happy Hues** | https://www.happyhues.co | 在真实场景中展示配色的灵感站 | 「配色 + 用途标注」的表示法值得抄进设计文档 | 取数值 |
| **Color Hunt** | https://colorhunt.co | 免费开放的配色灵感平台 | 取配色 | 取数值 |
| **Culrs** | https://culrs.com | 500+ 精选配色 | 取配色 | 取数值 |
| **Colorsinspo** | https://colorsinspo.com | UI / 品牌 / 网站配色库，可一键复制 hex | 取配色 | 取数值 |
| **Color Leap** | https://colorleap.app/home | 4000 年艺术与设计史中的 180 组配色 | 可用于「故障年代感」版块 | 取数值 |
| **ColorsWall** | https://colorswall.com | 配色存储与品牌色码 | 存档用 | 取数值 |
| **Super Color Palette / Supa Palette / PPPalette** | https://supercolorpalette.com · https://www.supa-palette.com · https://www.fffuel.co/pppalette/ | 配色生成器 | 补充来源 | 取数值 |
| **Alphredo** | https://alphredo.app | 生成「看起来与不透明色一致」的半透明色 | 玻璃拟态 / 悬浮层：color-mix(in srgb, var(--accent), transparent 88%) 比手调 rgba 更可预测 | 纯CSS |
| **Color Designer / Converly Colors / Colorbox / Colors.tools / Colormind / Huemint / Khroma / Adobe Color / Paletton / ColorSpace / Color Palette Pro / Colors.lol / Gradient (Shapefactory) / Pigment / PhotoGradient / Gradients.fm / Gradient Generator / Gradients & Shapes** | 见站点各条 | 调色 / 渐变生成的补充工具 | 备用；不产生新手法 | 取数值 |
| **Sip** | https://sipapp.io | Mac 上更好的取色器 | 从参考站快速取色 | 取数值 |
| **Color Oracle / Sim Daltonism** | https://colororacle.org · https://michelf.ca/projects/sim-daltonism | 色盲模拟器（跨平台 / Mac 实时） | 配色定稿前检查「主色 vs 错误红 vs 成功绿」是否互相可辨 | 取数值 |
| **ColorZilla** | https://www.colorzilla.com | 取色器 + 渐变生成器（浏览器扩展） | 同上 | 取数值 |
| **HTML Color Codes** | https://htmlcolorcodes.com | Hex / RGB / HSL / OKLCH 取值与拾色器 | 查值与转换 | 取数值 |

### 3.3 免费 UI 资源（/design/ui-resources，抓到 84 条）——纯 CSS 动效密度最高

| 条目 | 链接 | 它是什么 | 我们能用它借鉴什么 | 可落地形式 |
|---|---|---|---|---|
| **Colorion Tools（Text Effects）** | https://text-effects.colorion.co | **66 个纯 CSS 文字动效**，复制即用 | 标题字的活泼感：逐字弹入、渐变扫过（background-clip: text + background-position 动画）、打字机（clip-path: inset() 步进）、抖动 | 纯CSS |
| **Kinetics** | https://kinetics.colorion.co | 117 个可复制到 CSS 的动效模式 | 全站动效 class 的**唯一来源** | 纯CSS |
| **Border Beam** | https://beam.jakubantalik.com | 沿元素边框跑动的光带组件 | conic-gradient(from var(--a), transparent 0 70%, var(--accent) 85%, transparent 100%) 做遮罩层 + @property --a 动画 → **可动画的渐变描边**；也可用 background-position 跑线性渐变 | 纯CSS |
| **Generative Loaders** | https://generativeloaders.com | 为生成式 UI 状态设计的加载动画集 | 加载态别用旋转菊花：用「呼吸点阵 / 波形 / 骨架微光」；点阵 = 3 个 span + animation-delay 错峰 scale / opacity | 纯CSS |
| **Dot Matrix** | https://dotmatrix.zzzzshawn.cloud/ | 开源点阵 loader 组件库 | 5×5 网格点阵，用坐标算延迟：animation-delay: calc((var(--x) + var(--y)) * 45ms)，只动 opacity / transform | 纯CSS |
| **Thinking Orbs** | https://orbs.jakubantalik.com | AI「思考中」状态动画组件 | 多层模糊圆：3 个 50% 圆角 + filter: blur(12px) 的色块做不同相位的 rotate / scale，产生流体感 | 纯CSS |
| **NumberFlow** | https://number-flow.barvian.me | 带无障碍过渡的数字动画组件 | 数字滚动：每位一个 overflow: hidden 容器 + 内部列 translateY 到目标位；加 font-variant-numeric: tabular-nums 防宽度跳动 | 纯CSS（数值由 JS 给） |
| **Evil Buttons** | https://www.evilbuttons.com | 动画按钮组件注册表（带实时预览与复制代码） | 按钮状态谱：idle → hover（光带扫过 / 边框绘制）→ active（scale(.97)）→ loading（内联圆环）→ success（打勾 morph）；**每个状态都必须有视觉差** | 纯CSS + 需JS（切状态） |
| **Sonner** | https://sonner.emilkowal.ski | React toast 组件 | Toast 进出场：transform: translateY(-8px) scale(.98) + opacity，transition: 180ms cubic-bezier(.2,.8,.2,1)；用普通 div / dialog + 原生 JS 复刻 | 需JS + 纯CSS |
| **Input OTP** | https://input-otp.rodz.dev | 可访问的一次性验证码输入 | 逐格输入的微交互：每格填入后 scale(1.04) 回弹 + 边框主色点亮，校验通过整体抖动一次 | 纯CSS + 需JS |
| **UIverse** | https://uiverse.io | 最大的开源 UI 元素库 | 单个 CSS 元素就能做的效果（纯 CSS 开关、按钮、loader），**大量可直接抄** | 纯CSS |
| **SVG Backgrounds** | https://www.svgbackgrounds.com | 可定制 SVG 背景 / 图案 / 图标，直接粘贴 | 用 data-URI 内联 SVG 做背景图案（点阵、斜纹、波浪），避免额外请求 | 纯CSS |
| **Tabbied** | https://tabbied.com | 生成图案用于墙艺 / 网站 / 印刷 | 同上 | 纯CSS |
| **UI Glass Generator** | https://ui.glass/generator | 玻璃拟态组件生成器 | backdrop-filter: blur(12px) saturate(140%) + border: 1px solid rgba(255,255,255,.5)；**注意**：有 GPU 成本，只在小面积（顶栏 / 弹层）用 | 纯CSS |
| **Drawably** | https://www.drawably.dev | 给 Web 应用加手绘风 UI 元素 | 手绘边框用 SVG feTurbulence + feDisplacementMap 过滤器，或直接用 border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px（「手绘方框」技巧） | 纯CSS |
| **Boring Avatars** | https://boringavatars.com | 从名字生成唯一 SVG 头像的开源 React 库 | SVG 生成算法思路（名字 → 色相 + 形状）；本站暂无头像需求，**仅记录** | 灵感 |
| **UI Faces** | https://uifaces.co | 免费 AI 生成头像，用于原型 | 同上 | 素材 |
| **DiceBear** | https://www.dicebear.com | 多风格头像库与 API | 同上 | 素材 |
| **Hover.dev** | https://www.hover.dev | 面向 React + Tailwind 的动画 UI 组件 | **不能用代码**（需 npm + 构建链）。只当「效果目录」 | 灵感 |
| **Aceternity UI** | https://ui.aceternity.com | 动画 React + Tailwind 组件，复制即用 | 统计高频效果（光带描边、渐变文字、卡片 3D 倾斜、光标跟随），再用纯 CSS 重做 | 灵感 |
| **Magic UI** | https://magicui.design | 150+ 动画组件与特效（React + Tailwind） | 同上 | 灵感 |
| **React Bits** | https://www.reactbits.dev | 让站点出挑的动画 React 组件 | 同上 | 灵感 |
| **Rare UI** | https://rareui.com | 免费开源的非主流动画 React 组件 | 同上（挑 1–2 个不吵的） | 灵感 |
| **Arc UI** | https://uiarc.dev | 144 个动画 React 组件 + 84 个区块（shadcn / Next.js） | 同上 | 灵感 |
| **23rd** | https://23rd.dev | 可复制粘贴的 shadcn 注册表（React / Svelte 5） | 同上 | 灵感 |
| **beUI** | https://beui.dev | React / Next.js 的动效工具包 | 同上 | 灵感 |
| **Originkit** | https://originkit.dev | 交互式 Web 组件，复制即用 | 同上 | 灵感 |
| **Bencho** | https://bencho.dev | 可探索 / 微调 / 直接使用的交互式 UI 区块库 | 同上 | 灵感 |
| **BoardUI** | https://www.boardui.com | 仪表盘用 React 设计系统（83 个组件与区块） | 同上 | 灵感 |
| **UIAble** | https://uiable.com | shadcn 设计系统（组件 / 区块 / 模板 / 仪表盘，有 MIT 免费层） | 同上 | 灵感 |
| **Beautiful UI** | https://www.beautifului.dev | AI 聊天 / 思考态 / 人机协同流程的可复制 React 组件 | 同上 | 灵感 |
| **shadcn/ui** | https://ui.shadcn.com | 可复制粘贴的精美组件 | 组件状态与视觉规范参考 | 灵感 |
| **Stylokit** | https://stylokit.com | UI Kit / 模板 / 组件精选库 | 命名与结构参考 | 灵感 |
| **Viewport UI** | https://viewport-ui.design/ | 追踪社交媒体 UI 趋势的灵感平台 | 趋势校准 | 灵感 |
| **UI Bits** | https://uibits.co/ | 邮件推送的 UI 设计灵感 | 同上 | 灵感 |
| **Untitled UI** | https://www.untitledui.com | 世界最大的 Figma UI Kit 与设计系统 | 取数值规范 | 取数值 |
| **Figma Community** | https://www.figma.com/community | 社区免费文件 / 插件 / UI Kit | 检索入口 | 素材 |
| **UI Store Design** | https://www.uistore.design | 600+ 免费精选设计资源 | 检索入口 | 素材 |
| **UI8 Freebies** | https://ui8.net/category/freebies | 免费精品 UI Kit / 样机 / 图标流 | 检索入口 | 素材 |
| **Tailwind UI / Flowbite / daisyUI / Preline UI / Hyper UI / Float UI / Origin UI / Tailgrids / Tailark / Webpixels / Cruip / Creative Tim / MUI / Chakra UI / Mantine / HeroUI / Park UI / Ark UI / Radix UI / Tremor / shadcn UI Kit / KokonutUI / Kompa / Lexington Themes / Reverse UI / Oxbow UI / Grit UI / Banani / Freebiesbug / Tailwind Awesome** | 见站点各条 | 组件库与模板（多数需构建链） | 只借视觉规范与状态清单 | 灵感 |

### 3.4 图标（/design/icons，抓到 70 条）

| 条目 | 链接 | 它是什么 | 我们能用它借鉴什么 | 可落地形式 |
|---|---|---|---|---|
| **Lucide Animated** | https://lucide-animated.com/ | 免费可定制的**动画图标** | 动画图标最省事的做法：内联 SVG + 对 stroke-dasharray / offset 或 transform-origin 做 keyframes；hover 播放一次 | 纯CSS |
| **Feather Icons / Lucide / Tabler Icons / Heroicons / Bootstrap Icons / Iconoir / Remix Icon / Iconmonstr / System UIcons / CoreUI Icons / Boxicons / Ionicons / Material Symbols / Simple Icons / Font Awesome** | https://feathericons.com · https://lucide.dev · https://tabler.io/icons · https://heroicons.com · https://icons.getbootstrap.com · https://iconoir.com · https://remixicon.com · https://iconmonstr.com · https://systemuicons.com · https://coreui.io/icons · https://boxicons.com · https://ionic.io/ionicons · https://fonts.google.com/icons · https://simpleicons.org · https://fontawesome.com | 主流开源图标集（描边风为主） | 统一图标规范：**24×24 网格、1.75 描边、圆头圆角、内联 SVG、aria-hidden="true"**；本站按此风格手写故障领域图标（硬盘 / 网线 / 路由器 / 风扇） | 素材（SVG 复制） |
| **useAnimations** | https://useanimations.com | Lottie 微交互图标库 | 场景清单（burger ↔ close、plus ↔ minus、play ↔ pause），手写 SVG 复刻 | 灵感 |
| **Lordicon** | https://lordicon.com | 动画图标大库 | 交互触发式动画图标的触发时机定义 | 素材 / 灵感 |
| **css.gg** | https://css.gg | 纯 CSS 渲染的图标库（CSS / SVG / Figma 三种） | **零文件依赖**方案：伪元素 + box-shadow 画图形；适合极简站减少请求（本站更推荐内联 SVG） | 纯CSS |
| **Phosphor Icons** | https://phosphoricons.com | 6 种字重的柔性图标家族，9000+ | 用**字重**表达层级：导航用 regular、强调用 bold，视觉统一又有节奏 | 素材 |
| **Pixel Art Icons** | https://pixelarticons.com | 480+ 像素完美图标 | 若要做复古科技感点缀：image-rendering: pixelated | 素材 |
| **Hugeicons** | https://hugeicons.com | 大量简洁图标库 | 补充来源 | 素材 |
| **Iconbuddy** | https://iconbuddy.com/ | 免费 + 付费图标库 | 补充来源 | 素材 |
| **Iconify** | https://iconify.design | 200,000+ 开源矢量图标，来自 150+ 图标集 | 检索 / 对比同名图标在不同集里的画法 | 素材 / 取数值 |
| **Icônes** | https://icones.js.org/ | 汇集各家图标集合便于检索 | 同上 | 取数值 |
| **SVG Gobbler** | https://svggobbler.com | 浏览器扩展：找出页面所有 SVG，可优化 / 编辑 / 导出 | 从参考站一次抓取全部 SVG 的便利工具 | 取数值 |
| **SVGL** | https://svgl.app/ | 大量 SVG 图标库 | 补充来源 | 素材 |
| **SVG Doodles** | https://svgdoodles.com/ | 可定制 SVG 图标 | 手绘感点缀 | 素材 |
| **3dicons** | https://3dicons.co | 1440+ 开源 3D 图标，免费商用免署名 | 3D 图标当**大尺寸装饰位图**（每张压缩到 < 30KB WebP），只用在首屏 1–2 处 | 素材 |
| **Shapefest** | https://shapefest.com/ | 免费 3D 形状库（设计与演示用） | 同上 | 素材 |
| **Thiings** | https://www.thiings.co | 免费手作 3D 图标库 | 同上 | 素材 |
| **Icoon.co** | https://icoon.co | 3D 图标 / 插画 / AI 生成素材 | 同上 | 素材 |
| **Iconscout / Iconfinder / The Noun Project / Flaticon / Icons8 / Streamline / Untitled UI Icons / Streamline HQ / Nucleo / Iconset / Norde / Orion / Iconic / Iconly / IconSax / Mingcute / MyIcons / PikaIcons / Majesticons / Lineicons / Griddy Icons / Spectrums / Isocons / Iconstica / Solar Icons / Amicons / Zwicon / ForgeGUI / Icon Inspo / Icon Museum / IconCraft / Pikkovia / Pixels Market / Shoot.Design / SkeuDesign / Central icon system / ContentCore / Framer Icons / Overflow Design / iOS Icon Gallery** | 见站点各条 | 图标检索与聚合（含付费） | 备用来源；不引运行时 | 素材 |

### 3.5 字体排印（/design/typography，抓到 60 条）

| 条目 | 链接 | 它是什么 | 我们能用它借鉴什么 | 可落地形式 |
|---|---|---|---|---|
| **Modern Font Stacks** | https://modernfontstacks.com | 纯系统字体栈集合，零下载 Web 字体 | **本站首选**：用系统圆体换活泼感（font-family 里优先 ui-rounded / SF Pro Rounded / Segoe UI Variable Display，再回落 system-ui / PingFang SC / Microsoft YaHei）——**0 字节网络开销、0 CLS** | 纯CSS |
| **Type Scale** | https://typescale.com | 视觉化计算和谐的排版比例 | 定字阶：1.200（小） / 1.250（中） / 1.333（大）；标题比正文大一档以上才有活泼气势 | 纯CSS |
| **Typescale** | https://typescale.io/ | 生成字阶与字号 | 同上 | 纯CSS |
| **Variable Fonts（v-fonts）** | https://v-fonts.com | 查找与试玩可变字体的资源 | 一个 woff2 覆盖多字重；中文站不现实，**拉丁数字 / 标题可考虑** | 素材 |
| **Fontsource** | https://fontsource.org | 把开源字体自托管成规范包 | 自托管字体正确姿势：@font-face + font-display: swap + size-adjust / ascent-override 降 CLS + 只取需要的子集 | 素材 + 纯CSS |
| **Practical Typography** | https://practicaltypography.com | Matthew Butterick 的免费在线排版指南 | 行宽 45–90 字符（max-width: 65ch）、行高 1.4–1.6、标题与正文用字号 + 字重双重区分 | 纯CSS |
| **Tegaki** | https://gkurt.com/tegaki/ | 按笔顺「手写」任意字体的开源库 | SVG 逐笔绘制（见 3.1）；用于 Hero 标题的下划线 / 点缀图形 | 纯CSS |
| **Typewolf / Fonts In Use / Free Faces Gallery / UNCUT.wtf / Open Foundry / Collletttivo / Velvetyne / League of Moveable Type** | https://www.typewolf.com · https://fontsinuse.com · https://www.freefaces.gallery/ · https://uncut.wtf/ · https://open-foundry.com/ · https://www.collletttivo.it/ · https://velvetyne.fr · https://www.theleagueofmoveabletype.com | 字体趋势、真实用法档案与开源字体来源 | 中文站主要借「搭配结构」（1 个有性格的标题字 + 1 个安静的正文字）；若必须加拉丁点缀字，只加 1 款 | 取数值 / 素材 |
| **Wordmark.it / UI Fonts / Web Font Preview / Font Mojo / Fonts Ninja / Brandfetch / MirloMiro / Colors & Fonts** | https://wordmark.it · https://www.uifonts.app/ · https://webfontpreview.com · https://fontmojo.com/ · https://fonts.ninja · https://brandfetch.com/ · https://miromiro.app/ · https://www.colorsandfonts.com/ | 字体预览、识别与品牌信息抓取工具 | 选字与取样式阶段使用；Brandfetch / MirloMiro 可一次拿到竞品站的色与字 | 取数值 |
| **Fontpair** | https://www.fontpair.co | 漂亮的 Google 字体搭配 | 借「搭配结构」：1 个有性格的标题字 + 1 个安静的正文字 | 取数值 |
| **Fontjoy** | https://fontjoy.com | 一键用深度学习生成字体搭配 | 同上 | 取数值 |
| **Beautiful Web Type** | https://beautifulwebtype.com | Google Fonts 最佳字体展示 | 同上 | 取数值 |
| **Wakamai Fondue** | https://wakamaifondue.com | 拖入字体即可看清它支持的一切 | 上线前验证字体是否含所需字形 / 连字 / 可变轴 | 取数值 |
| **Google Fonts / Adobe Fonts / Fontshare / Font Squirrel / DaFont / Befonts / Fontesk / FontGet / Indestructible Type / Heritage Type Co. / Pangram Pangram / Atipo Foundry / Creative Fabrica / Font Bundles / Design Bundles / Fontself Maker / RightFont / Typeface / FontBase / Fontalog / Fontnode / Fonts Arena / Glyphs / Meshfont / Penfont / Calligraphr / Typographica / Letterform Archive / Women in Type / Typographic Posters / Design Systems Surf / FontBrief / Penfont** | 见站点各条 | 字体获取渠道与管理工具 | 只取 1 款拉丁点缀字（若必须）；中文字体一律走系统栈 | 素材 / 取数值 |

### 3.6 插画（/design/illustrations，抓到 32 条）

| 条目 | 链接 | 它是什么 | 我们能用它借鉴什么 | 可落地形式 |
|---|---|---|---|---|
| **unDraw** | https://undraw.co | 开源插画，可按品牌色重新着色 | 内联 SVG + fill="currentColor"，让插画自动跟随主题色；用于**空状态、404、向导首屏** | 素材 + 纯CSS |
| **Storyset** | https://storyset.com | 免费可定制的**动画**插画 | 静态插画 + 少量元素动效（只让 1 个元素动，如眨眼 / 浮动） | 素材 |
| **Open Doodles** | https://www.opendoodles.com | 一套松散的手绘插画，可随处使用 | 手绘涂鸦风是「青春活泼」最省力的视觉信号：**1 张涂鸦 + 2 个手绘箭头**就能打破安静工具感 | 素材 |
| **Open Peeps** | https://www.openpeeps.com | 可混搭的手绘人物插画库 | 同上 | 素材 |
| **Humaaans** | https://www.humaaans.com | Pablo Stanley 的混搭人物插画 | 同上 | 素材 |
| **Absurd Design** | https://absurd.design | 超现实风格免费插画，给项目独特边缘 | 用于 404 与错误态，让失败体验不讨厌 | 素材 |
| **illlustrations** | https://illlustrations.co | 开源插画套件（Vijay Verma 手绘） | 同上 | 素材 |
| **Doodle Ipsum** | https://doodleipsum.com/ | 可定制的插画占位图 | 开发期占位用，避免灰块 | 素材 |
| **Funnn.it** | https://funnn.it/ | 手绘插画库 | 补充来源 | 素材 |
| **Blush** | https://blush.design | 用艺术家作品定制插画 | 可换色插画的思路 | 素材 |
| **IRA Design** | https://iradesign.io | 用渐变与线稿组件自定义插画（Creative Tim） | 「渐变 + 线稿组件自由组合」可用纯 SVG 实现：底色块与描边图层分开 | 素材 |
| **DrawKit** | https://www.drawkit.com | 免费矢量插画与图标 | 补充来源 | 素材 |
| **ManyPixels** | https://www.manypixels.co/gallery | 可完全定制的免费插画画廊 | 同上 | 素材 |
| **Ouch!（Icons8）** | https://icons8.com/illustrations | 多风格一致的免费矢量插画 | 同上 | 素材 |
| **Craftwork** | https://craftwork.design | 高质量插画、UI Kit 与设计素材 | 同上 | 素材 |
| **Designstripe** | https://designstripe.com | 轻松做插画与样机 | 同上 | 素材 |
| **Skribbl** | https://weareskribbl.com | 独家付费免版税插画 | 付费，不用 | 不用 |
| **Pixeltrue** | https://www.pixeltrue.com/free-illustrations | 免费动画与静态插画 | 动画插画 → 拆成 SVG + CSS | 素材 |
| **Icons8 / Streamline / Iconscout / Vecteezy / Icoon.co / Artvee / Transhumans / Black Illustrations / DiceBear** | 见站点各条 | 插画与图形聚合 / 名画 / 人物 | 备用；与故障主题弱相关 | 素材 |
| **Isometric Studio** | https://www.isometic.studio | 浏览器内快速做等距插画，导出 SVG | 等距观感用 CSS 近似：transform: rotateX(60deg) rotateZ(-45deg) + transform-style: preserve-3d 做等距卡片堆叠 | 纯CSS（近似） |
| **SVGator** | https://www.svgator.com | 无需编码的 SVG 动画平台 | 导出 CSS / SMIL 关键帧；作为逐笔绘制 / 形变的参数参考 | 灵感 / 纯CSS |
| **Khagwal 3D** | https://3d.khagwal.com/ | 免费 3D 插画包（45 个模型） | 与 3D 图标同样处理：压缩后的静态装饰 | 素材 |

### 3.7 设计灵感 · 交互细节（/design/inspiration，抓到 96 / 341 条）

| 条目 | 链接 | 它是什么 | 我们能用它借鉴什么 | 可落地形式 |
|---|---|---|---|---|
| **Design Spells** | https://designspells.com/ | **交互与动画**的精选库 | 微交互最直接的参考源；按「效果 > 触发 > 时长」抄成清单 | 灵感 |
| **Detail** | https://detail.design/ | 微交互与 UI 细节决策的洞察 | 每条都讲「为什么这么动」，用于给我们的动效**写理由**（评审时最有说服力） | 灵感 |
| **Details** | https://www.details.so | 放大看单个 UI 元素怎么做的灵感库 | 组件级的近距离解剖 | 灵感 |
| **Motion.ed** | https://motion.zajno.com/ | 用 UI/UX 动画传达品牌情绪 | 「品牌情绪 → 动效性格」的映射（活泼 = 短时长 + 回弹 + 小幅位移） | 灵感 |
| **Landing.Love** | https://www.landing.love | 落地页灵感，带整页动画录像 | 直接看别人的**动效节奏**（首屏如何进场、滚动如何叙事） | 灵感 |
| **HeroGrids** | https://herogrids.com | 真实 Hero 区库，可按行业 / 风格 / 布局 / 配色筛选 | 首屏结构参照：标题 + 一句副标 + 1 主 1 次按钮 + 1 个可视化 | 灵感 |
| **Navbar Gallery** | https://www.navbar.gallery | 网站导航栏精选 | 移动端导航的展开动效与粘性顶栏 | 灵感 |
| **Footer.Design** | https://www.footer.design | 网站页脚精选 | 页脚也可以有活泼收尾（大字号 CTA + 微动效） | 灵感 |
| **404s.Design** | https://www.404s.design/ | 创意 404 页灵感库 | 404 页是活泼最安全的实验场：大插画 + 一个抖动动效 | 灵感 |
| **Page Flows** | https://pageflows.com | 真实产品用户流程录像 | 观察向导 / 多步表单的流转（本站有 wizard.html，直接对口） | 灵感 |
| **Mobbin** | https://mobbin.com | 最新移动与 Web 设计模式精选库 | 组件状态清单（空 / 加载 / 错误 / 成功）的补齐 | 灵感 |
| **Pttrns** | https://pttrns.com | 设计模式与移动 UI 精选 | 同上 | 灵感 |
| **Collect UI** | https://collectui.com | 从 Dribbble 策展的每日灵感 | 同上 | 灵感 |
| **Nicely Done** | https://nicelydone.club | SaaS 与 Web App UI 模式库 | 同上 | 灵感 |
| **Calltoidea** | https://www.calltoidea.com | 分类的 Web 设计想法与组件 | 同上 | 灵感 |
| **Calltoinspiration** | https://calltoinspiration.com/ | 面向 UX 设计师与开发者的灵感库 | 同上 | 灵感 |
| **Refero** | https://refero.design | 产品与 UI 设计示例 | 同上 | 灵感 |
| **Design Vault** | https://screensdesign.com/ | 从顶级数字产品学 Web / 移动设计与 UX 模式 | 同上 | 灵感 |
| **Awwwards** | https://www.awwwards.com | 全球最佳网页设计师与开发者奖项 | 「活泼」与「安静」的分界线参照：**动效只服务信息层级** | 灵感 |
| **siteInspire** | https://www.siteinspire.com | 优秀 Web 与交互设计展示 | 同上 | 灵感 |
| **Httpster** | https://httpster.net | 前沿网站展示（无垃圾内容） | 同上 | 灵感 |
| **CSS Design Awards** | https://www.cssdesignawards.com | 表彰 Web 设计与开发的奖项 | 同上 | 灵感 |
| **CSS Winner** | https://www.csswinner.com | Web 设计奖项画廊 | 同上 | 灵感 |
| **Admire The Web** | https://admiretheweb.com | 精选 Web 设计展示 | 同上 | 灵感 |
| **Land-book** | https://land-book.com | 最佳网站设计灵感画廊 | 同上 | 灵感 |
| **One Page Love** | https://onepagelove.com | 最大的单页网站灵感合集 | 单页滚动叙事参考 | 灵感 |
| **Lapa Ninja** | https://www.lapa.ninja | 7000+ 落地页设计实例，每日更新 | 落地页结构参照 | 灵感 |
| **Landingfolio** | https://www.landingfolio.com | 最佳落地页设计、组件与模板 | 同上 | 灵感 |
| **Saaspo** | https://www.saaspo.com | 最大的 SaaS 网站设计灵感库 | 同上 | 灵感 |
| **SaaS Landing Page** | https://saaslandingpage.com | 按区块整理的优秀 SaaS 落地页 | 按区块取经 | 灵感 |
| **SaaS Pages** | https://saaspages.xyz | SaaS 落地页截图与转化技巧 | 同上 | 灵感 |
| **Curated Design** | https://curated.design | 有分类与标签的 Web 设计灵感目录 | 同上 | 灵感 |
| **Minimal Gallery** | https://minimal.gallery | 极简网站设计展示 | 对照「安静」基准，避免过度装饰 | 灵感 |
| **Dead Simple Sites** | https://deadsimplesites.com/ | 极简网站策展 | 同上 | 灵感 |
| **H1 Gallery** | https://h1gallery.com/ | 创意 H1 标题画廊 | 主标题写法与字重 / 换行策略 | 灵感 |
| **Showreel.design / Killer Portfolio / Pafolios / Wall of Portfolios / Maxibestof / Gallereee / Macfolio / A1 Gallery / Landing.Love / Peek Paper / Wellmade / Curated Supply / SeeSaw / Spotted in Prod / Steep / Godly Website / Recent.design / Muzli / Cosmos / mymind / Bookmarkify / GatherOS / Daily Delights / It's Nice That / The Brand Identity / Brand New / Logo Design Love / Logoinspo / LogoSystem / Logggos / Brand Logo / Archives Design / The Index Website / Interface In Game / Artvee / OG Image Design / OG Image Gallery / Deck.Gallery / Appshots / Apple Summary Slides / Billion Dollar Pitch Decks / ABTest.Design / Adfolio.Design / Pushkeen / Really Good Emails / Freelance Things / Curation of Curations / H1 Gallery / Icon Inspo / Gallery** | 见站点各条 | 作品集 / 品牌 / 邮件 / 通知 / 广告 / 演示稿等垂直灵感画廊 | 与「视觉升级 + 交互动效」弱相关，本次不展开 | 灵感 |

### 3.8 设计系统（/design/design-systems，抓到 49 条）

| 条目 | 链接 | 它是什么 | 我们能用它借鉴什么 | 可落地形式 |
|---|---|---|---|---|
| **Material Design 3** | https://m3.material.io | Google 开源设计系统（含 Motion 章节） | **动效时长与缓动的权威取值**：进场 emphasized-decelerate（cubic-bezier(.05,.7,.1,1)）、离场 emphasized-accelerate（cubic-bezier(.3,0,.8,.15)）；常用时长 100 / 200 / 300 / 400ms | 纯CSS |
| **Apple HIG** | https://developer.apple.com/design/human-interface-guidelines | Apple 人机界面指南 | 动效的「物理感」与「连续性」（元素从哪来往哪去），以及**尊重减弱动态效果设置**的一等公民地位 | 灵感 |
| **Laws of UX** | https://lawsofux.com | 交互设计法则集 | **Doherty 阈值（< 400ms 才有即时感）**、Fitts 定律（点击目标 ≥ 44×44）、Jakob 定律（别发明新交互）；直接决定我们的动效时长上限 | 纯CSS（规范） |
| **Refactoring UI** | https://www.refactoringui.com | 面向开发者的实用设计技巧（Tailwind 团队） | 层次靠「字号 + 字重 + 颜色 + 间距」四件套；阴影要「大而淡」才有活泼的悬浮感 | 纯CSS |
| **Springs** | https://www.springs.studio | 运动 token 构建器 | 把 --dur-fast / slow、--ease-out / spring 写进 :root，全站只允许用 token，禁止散落魔数 | 纯CSS |
| **Radix Colors** | https://www.radix-ui.com/colors | 可访问色阶系统 | 见 3.2：12 阶变量 + 语义映射 | 纯CSS |
| **Polaris / Carbon Design System / Primer / Atlassian Design / Fluent 2 / Adobe Spectrum / Lightning Design System / Base Web / Ant Design / Vercel Geist / Nord Design System / Eva Design System / Workday Canvas / Dell Design System / Paste（Twilio）/ Create UI / Balsa UI** | https://polaris.shopify.com · https://carbondesignsystem.com · https://primer.style · https://atlassian.design · https://fluent2.microsoft.design · https://spectrum.adobe.com · https://www.lightningdesignsystem.com · https://baseweb.design · https://ant.design · https://vercel.com/geist · https://nordhealth.design · https://eva.design · https://canvas.workday.com · https://www.delldesignsystem.com · https://paste.twilio.design · https://createui.co · https://balsa-ui.com | 大型企业级设计系统 | 借「组件状态 + 动效规格」的表格化写法（照抄成我们 DESIGN-SYSTEM 的增补章节） | 纯CSS（规范） |
| **Dot Matrix** | https://dotmatrix.zzzzshawn.cloud/ | 点阵 loader 组件库 | 见 3.3 | 纯CSS |
| **Material Design（3 之外的总站）** | https://m3.material.io | 见上 | 见上 | 纯CSS |
| **The Component Gallery** | https://component.gallery/ | UI 组件与设计系统的仓库，按组件归类 | **组件命名表**可用来统一我们的 class 命名 | 灵感 |
| **Design Systems Repo** | https://designsystemsrepo.com | 设计系统与模式库的大型合集 | 检索入口 | 灵感 |
| **Design Systems** | https://www.designsystems.com/ | 设计系统资源与文章 | 方法论补充 | 灵感 |
| **Design Systems for Figma** | https://www.designsystemsforfigma.com/ | Figma 设计系统合集 | 检索入口 | 灵感 |
| **Design System University** | https://designsystem.university/ | 学习设计系统 | 方法论 | 灵感 |
| **Rebrand Gallery** | https://rebrand.gallery | 最新设计系统、品牌导入与改版视频 | 改版节奏参考 | 灵感 |
| **Tokens Studio** | https://tokens.studio | 在 Figma 管理设计 token 并同步到代码 | token 的 JSON → CSS 变量思路（人工维护一份即可） | 灵感 |
| **Supernova** | https://www.supernova.io | 连接设计与代码的设计系统平台 | 同上 | 灵感 |
| **zeroheight** | https://zeroheight.com | 设计系统文档平台 | 文档结构参考 | 灵感 |
| **Storybook** | https://storybook.js.org | 组件开发与文档的行业标准 | 组件状态穷举的思路 | 灵感 |
| **Chromatic** | https://www.chromatic.com | Storybook 组件的视觉测试与评审 | 视觉回归测试流程 | 灵感 |
| **UIAble / Untitled UI / Frames X / BoardUI / Dot Matrix / Frame Pad / Framerize / Interfaces DS / Modulor / Practical UI / Prime Design System Kit / Segment UI / Atomize Design / Frontify / Lingo / Rebrand Gallery / Balsa UI** | 见站点各条 | UI Kit 与设计系统平台 | 取数值规范或结构参考 | 灵感 / 取数值 |

### 3.9 设计工具（/design/design-tools，抓到 92 条）

| 条目 | 链接 | 它是什么 | 我们能用它借鉴什么 | 可落地形式 |
|---|---|---|---|---|
| **Stark** | https://www.getstark.co | 面向设计与产品团队的无障碍工具包 | 配色与组件的对比度审计流程（本文 §4.4 的手工版） | 取数值 |
| **CSS Peeper** | https://csspeeper.com | 查看任意站点的样式与资源 | 参考站上直接「扒」CSS（渐变、阴影、缓动） | 取数值 |
| **VisBug** | https://github.com/GoogleChromeLabs/ProjectVisBug | Google 的开源浏览器内设计 / 调试工具 | 同上 | 取数值 |
| **Stylebot** | https://stylebot.dev | 用自定义 CSS 改变任意网站外观 | 在参考站上现场试改，找手法 | 取数值 |
| **Picker.Design** | https://picker.design | 直接在浏览器里抽取、克隆、重设任意网站样式 | 同上 | 取数值 |
| **Polypane** | https://polypane.app | 面向 Web 开发者与设计师的浏览器（多视口） | 动效在多断点下的表现校验 | 取数值 |
| **ProtoPie** | https://www.protopie.io | 带传感器、变量与 AI 交互的真实感原型工具 | 交互模型（触发源 → 响应 → 缓动）的规范化表达 | 灵感 |
| **Principle** | https://principleformac.com | Mac 上设计动画与交互界面 | 同上 | 灵感 |
| **Flinto** | https://www.flinto.com | Mac 上设计交互与动画 App 原型 | 同上 | 灵感 |
| **Origami Studio** | https://origami.design | Meta 的免费原型工具（可导入 Figma / Sketch） | 同上 | 灵感 |
| **Kite Compositor** | https://kiteapp.co | Mac 上设计 UI 动画与交互原型 | 同上 | 灵感 |
| **Axure RP** | https://www.axure.com | 复杂 UX 原型、规格与图表 | 同上 | 灵感 |
| **Proto.io** | https://proto.io | 浏览器内低保真到高保真的原型 | 同上 | 灵感 |
| **Motionity** | https://www.motionity.app | 免费开源动效编辑器（关键帧、遮罩、滤镜、文字动画） | 文字动画的关键帧结构参考 | 灵感 |
| **Keyshape** | https://www.keyshapeapp.com | 制作动画 SVG 与 Lottie 矢量图 | 导出结构可拆成 CSS keyframes | 灵感 |
| **SVGViewer** | https://www.svgviewer.dev | 浏览器内优化、编辑、预览 SVG | 上线前压缩 SVG（去掉编辑器元数据） | 取数值 |
| **TinyJPG** | https://tinyjpg.com | 在线智能压缩 WebP / PNG / JPEG | 零依赖站必须控制图片体积；装饰图 < 40KB | 取数值 |
| **HeroKit** | https://herokit.app | 浏览器里构建与导出 Hero 视觉与特效 | 首屏视觉的快速试错 | 灵感 |
| **PaintCode** | https://www.paintcodeapp.com | 把矢量图实时转成 Swift / ObjC 代码 | 理念借鉴：把矢量路径直接写成 CSS clip-path / SVG path，零位图 | 灵感 |
| **Onlook** | https://onlook.com | 面向 React 应用的开源可视化编辑器 | 同上（本站不用 React） | 不用 |
| **Wireframe.cc** | https://wireframe.cc | 极简在线线框图工具 | 低保真结构推演 | 灵感 |
| **Moqups** | https://moqups.com | 线框 / 样机 / 图表 / 原型一体的在线应用 | 同上 | 灵感 |
| **Overflow** | https://overflow.io | 把设计变成交互流程与演示的用户流程图工具 | 向导流程图（wizard.html）的梳理 | 灵感 |
| **Flinto / Marvel / UXPin / Framer / Figma / Sketch / Penpot / Pixso / Lunacy / Affinity Designer / Gravit Designer / Linearity Curve / Vectr / Amadine / Canva / Photopea / GIMP / Inkscape / Krita / Paint.NET / Aseprite / Piskel / Pyxel Edit / Shuffle.dev / Relume / Builder.io / Plasmic / Visily / Uizard / Gamma / Prezi / Chronicle / GenPPT / Plus AI / PopAi / Presentations.AI / Slidesgo / Twistly / Kittl / Creatopy / Maze / Lyssna / FlowMapp / Octopus.do / Pixelied / Looka / Brandmark / Snap Pixel / Appthetics / Stage / Pixlo / Dump / Playbook / Useberry / Zeplin / Screen Sizes / HeroKit / Stark** | 见站点各条 | 通用设计与原型工具、演示稿生成、用户研究 | 与本次目标无关或已知 | 不用 |

### 3.10 模板（/web-templates 23 条 + /framer-templates 24 条）

| 条目 | 链接 | 它是什么 | 我们能用它借鉴什么 | 可落地形式 |
|---|---|---|---|---|
| **HTML5 UP** | https://html5up.net | 响应式、免费的 HTML5 + CSS3 站点模板（CC 授权） | **唯一一类可以整站拆读的参考**：纯 CSS 网格、卡片、导航、动效写法，全部零依赖、零构建，与本项目形态完全一致 | 纯CSS |
| **Templatemo** | https://templatemo.com | 免注册的免费 CSS 网站模板 | 同上；含大量纯 CSS 悬停浮起 / 渐变按钮 / 单页滚动写法 | 纯CSS |
| **Start Bootstrap** | https://startbootstrap.com | 免费 Bootstrap 主题、模板与片段 | 布局骨架；Bootstrap 类需翻译成原生 CSS | 灵感 |
| **Colorlib** | https://colorlib.com/wp/templates | 数千个免费网站与 WordPress 模板 | 同上 | 灵感 |
| **UIdeck** | https://uideck.com | 免费与付费模板、主题、UI Kit | 同上 | 灵感 |
| **One Page Templates** | https://onepagelove.com/templates | 单页网站模板 | 单页滚动叙事参考 | 灵感 |
| **Tailwind Awesome** | https://www.tailwindawesome.com | Tailwind 模板 / Kit / 工具目录 | 需构建链，只作版式灵感 | 灵感 |
| **Box Shadow（Webflow）** | https://box-shadow.webflow.io/ | 自定义 box-shadow 生成器 | 直接取「活泼悬浮感」的阴影值（大模糊、低透明度、带主色倾向） | 取数值 |
| **Flowplay** | https://videsigns.uk/flowplay | Webflow 的可定制视频播放器 | 播放器控件的微交互参考 | 灵感 |
| **Goat Slider** | https://www.goatslider.com/ | Webflow 响应式滑块应用 | 轮播切换动效参考 | 灵感 |
| **Finsweet** | https://finsweet.com/ | Webflow 开发资源合集 | 实现技巧参考 | 灵感 |
| **Jetboost** | https://www.jetboost.io/ | 给 Webflow 站加实时搜索与动态筛选 | 实时搜索的交互模式参考（与本站搜索方案相关） | 灵感 |
| **Wized** | https://www.wized.com/ | 给 Webflow 项目加高级逻辑的工具集 | 同上 | 灵感 |
| **WhaleSync** | https://www.whalesync.com/ | 把 Webflow 与 Airtable / Notion 同步的无代码工具 | 无关 | 不用 |
| **Webflow Marketplace** | https://webflow.com/templates | Webflow 模板市场 | 版式灵感 | 灵感 |
| **Framer 模板群**（Cosmaha / Velox Themes / Marto Mads / Framerbite / Frameblox / Framer Supply / Elements Library / Eleveight Supply / FramerIt / LaunchNow / Pixco / Spotlight Design / Templifica / Windaro / Daily Remix / THE DESIGN FUTURIST / Canvas Supply / Easyfast / HyperFramer / Framer Marketplace / Framer University / BlueStar Supply / Izabysof / Hxmza Ehsan / Selected / FlowCub / Clonify / Sprrrint / Grayblocks） | https://cosmaha.com · https://veloxthemes.com/ · https://www.martomads.com · https://framerbite.com · https://www.frameblox.com · https://www.framersupply.com · https://elements-library.com/ · https://www.eleveight.supply/ · https://framerit.com/ · https://launchnow.design/ · https://pixcodrops.com/ · https://spotlightdesign.io/ · https://templifica.com/ · https://windaro.com/ · https://dailyremix.framer.website/ · https://thedesignfuturist.zip/ · https://www.canvas.supply/ · https://easyfast.design/ · https://www.hyperframer.com/ · https://www.framer.com/marketplace/templates · https://framer.university · https://bluestar.supply/ · https://www.izabysof.com/ · https://www.hxmzaehsan.com/ · https://selected.site/ · https://flowcub.com/ · https://library.clonify.io/ · https://sprrrint.com/ · https://grayblocks.net | Framer 网站模板生态 | **不能落地**（依赖 Framer 运行时 / 构建）。只作版式与动效灵感：Framer 模板普遍用「卡片错峰上浮 + 数字滚动 + 大圆角 + 高饱和点缀色」，这正是青春活泼的通用配方 | 灵感 |
| **DjectStudio** | https://djectstudio.com/store | 免费与付费 Figma / Framer UI Kit 与模板 | 取数值规范 | 取数值 |
| **Stylokit** | https://stylokit.com | UI Kit / 模板 / 组件精选库 | 取数值规范 | 取数值 |

### 3.11 Figma 资源（/figma-resources，抓到 23 条）

| 条目 | 链接 | 它是什么 | 我们能用它借鉴什么 | 可落地形式 |
|---|---|---|---|---|
| **uiblockify** | https://uiblockify.co | 120+ 现成 Figma 网页区块（hero、定价、FAQ、页脚） | 区块清单用作页面结构检查表（有没有漏掉 FAQ / 社会证明 / 页脚 CTA） | 灵感 |
| **Frames X / Setproduct / UI Prep / Beyond UI / GlowUI / NovaUI / Koala UI / Pixsellz / Sort UI / Shadcraft** | https://framesxdesign.com · https://www.setproduct.com · https://www.uiprep.com · https://www.beyondui.design · https://www.glowui.com/ · https://novaui.design/ · https://www.koalaui.com/ · https://pixsellz.io · https://sortui.company/ · https://shadcncraft.com/ | 付费 / 免费 Figma UI Kit 与设计系统 | 取圆角半径、间距刻度、阴影层级等数值规范（活泼风格通常 = 大圆角 16–24px + 8pt 间距 + 2 级阴影） | 取数值 |
| **Uncoverlab** | https://uncoverlab.co/ | 含 Figma 模板与用户旅程的 Web 应用 | 用户旅程模板 | 灵感 |
| **DjectStudio** | https://djectstudio.com/store | Figma / Framer UI Kit 与模板 | 同上 | 取数值 |
| **Aninix** | https://www.aninix.com | 把 Figma 设计转成可交互 Lottie 动画 | 微交互的分镜参考 | 灵感 |
| **Web to Figma** | https://web-to-figma.design | 把任意在线网页转成可编辑 Figma 图层 | 拆参考站结构的便捷工具 | 取数值 |
| **Aura Build** | https://www.aura.build/ | 用 AI 生成设计并导出 HTML 或 Figma | 可作为「对照答案」，生成物需大量手改，不纳入流程 | 灵感 |
| **Stitch（Google）** | https://stitch.withgoogle.com/ | AI 快速做移动与 Web UI 设计，可导出到 Figma | 同上 | 灵感 |
| **Anima** | https://www.animaapp.com/ | 把 Figma 设计转成开发者友好的代码 | 「设计 → 代码」映射表可参考命名 | 灵感 |
| **NextBunny** | https://nextbunny.co/ | 面向 React / Next.js 团队的可视化开发平台 | 无需构建链，仅参考 | 灵感 |
| **Clonify / FlowCub / Waida Studio / Grit UI** | 见站点各条 | 组件库 / 模板 / 设计转代码 | 同上 | 灵感 |

### 3.12 音乐与音效（/media/audio，抓到 38 条）

| 条目 | 链接 | 它是什么 | 我们能用它借鉴什么 | 可落地形式 |
|---|---|---|---|---|
| **Pixabay Music** | https://pixabay.com/music | 免费音乐与免版税音频下载 | **UI 音效**（< 150ms 的轻「咔」）用于：复制成功、向导下一步、错误提示。**必须默认静音 + 用户主动开启 + 记住选择** | 素材 |
| **Mixkit** | https://mixkit.co | 免费视频片段、音乐与模板 | 同上 | 素材 |
| **Freesound** | https://freesound.org | CC 授权音效的协作数据库 | 同上；可按「click / tick / pop」检索 | 素材 |
| **99Sounds** | https://99sounds.org | 免费高质量音效与采样库 | 同上 | 素材 |
| **SoundBible** | https://soundbible.com | 免费免版税音效 | 同上 | 素材 |
| **Zapsplat** | https://www.zapsplat.com | 数十万免费音效与音乐 | 同上 | 素材 |
| **Bensound** | https://www.bensound.com | 视频 / 影片 / 项目用免版税音乐 | 同上 | 素材 |
| **Free Music Archive** | https://freemusicarchive.org | 合法高质量音频下载库 | 同上 | 素材 |
| **YouTube Audio Library** | https://www.youtube.com/audiolibrary | 视频用免费音乐与音效 | 同上 | 素材 |
| **Uppbeat** | https://uppbeat.io | 面向创作者的免费音乐，无版权投诉 | 同上 | 素材 |
| **Incompetech** | https://incompetech.com | Kevin MacLeod 的免版税音乐库 | 同上 | 素材 |
| **Jamendo** | https://www.jamendo.com | 独立音乐人的免费音乐流与授权 | 同上 | 素材 |
| **Myinstants** | https://www.myinstants.com | 可检索、可上传的即时音效板 | 找短音效的最快入口 | 素材 |
| **Audacity** | https://www.audacityteam.org/ | 免费多轨音频编辑器与录音机 | 把音效裁到 < 150ms、归一化响度、转成小体积 mp3 / ogg | 素材 |
| **TheBoringNotch** | https://theboring.name/ | 把 MacBook 刘海变成带可视化的音乐控制中心 | 若做「频谱条」装饰：真频谱要 Web Audio AnalyserNode（需 JS）；纯 CSS 只能做**假波形**（多个 div 错峰缩放） | 灵感 |
| **Ebb** | https://ebb.cool/ | macOS 上的专注计时、应用屏蔽与音乐集成 | 与网页 UI 无关 | 不用 |
| **Splice / Epidemic Sound / Artlist / Soundstripe / Musicbed / Marmoset / AudioJungle / HookSounds / Storyblocks / Mubert / Soundraw / Adobe Podcast / Cleanvoice / Riverside / Podcastle / Buzzsprout / Transistor / BPM Player / Flow Music / Wistia Music / Openverse / Pixabay** | 见站点各条 | 付费 / 生成式音乐与播客工具 | 与网页 UI 无关（本站不做背景音乐） | 不用 |

### 3.13 样机（/design/mockups，抓到 40 条，辅助）

| 条目 | 链接 | 它是什么 | 我们能用它借鉴什么 | 可落地形式 |
|---|---|---|---|---|
| **Logo Ipsum** | https://logoipsum.com/ | 占位 Logo | 占位内容用 SVG 占位图，别用灰色方块 | 素材 |
| **Shots / Pika.style / Brandbird / Screenshot.rocks / Cleanmock / Previewed / Device Shots / MockuPhone / Smartmockups / Screenshot Studio / AppLaunchpad / Mediamodifier** | https://shots.so · https://pika.style · https://www.brandbird.app · https://screenshot.rocks · https://cleanmock.com · https://previewed.app · https://deviceshots.com · https://mockuphone.com · https://smartmockups.com · https://appstorescreenshotstudio.com · https://theapplaunchpad.com · https://mediamodifier.com | 截图美化 / 设备样机 | 给 README、门户、交付汇报生成**统一的展示图**（同一背景、同一圆角、同一阴影），成本几分钟 | 素材 |
| **Rotato / Animos / Shotreel / Supermotion / UI Camera / Arqé** | https://rotato.app · https://animos.app · https://shotreel.app · https://www.supermotion.co/ · https://ui.camera · https://arqe.ai | 动效样机（把截图变成循环视频） | 首页 / 门户的「产品循环演示」视频（720p、静音、autoplay muted loop playsinline，且在 reduced-motion 下换成静态图） | 素材 |
| **Ultramock / Angle / Wannathis / Things by Morflax / Mockup Cloud / Mockuuups Studio / Artboard Studio / MockupWorld / LS Graphics / Dynamic Mockups / Creatoom / Glorify / Mockups Design / Mockups Digital / Mr. Mockup / Phone Mockup / Mocku / Designstripe / Mockupanda / Mockup Freak / Javii Tools** | 见站点各条 | 3D 设备模型与商业样机 | 只取少量免费项；付费项不用 | 素材 / 不用 |

---


## 4. 「青春活泼」配色方案建议（3 套）

### 4.1 方案 A · 薄荷气泡 Mint Soda ★推荐（与现有品牌完全兼容）

**思路**：保留现有 #91E6C1（品牌薄荷）与 #FFFDF7（暖白），只**补上能承载文字与对比度的深薄荷主色**，再加两个高饱和糖果色做点缀。品牌资产 0 损失，活泼度靠「点缀色 + 大圆角 + 动效」补齐。

| 色值 | 用途 | 说明 |
|---|---|---|
| **#0A8064** | **主色 / 链接 / 主按钮底** | 深薄荷，唯一能承载白字与正文链接的薄荷色 |
| **#91E6C1** | **品牌薄荷 · 装饰 / 高亮底 / 进度条** | 保留原有资产；只作填充，不作文字色 |
| **#EDFBF4** | 表面 / 卡片底 / 代码块底 | 主色的极浅版 |
| **#FF6B6B** | **强调（珊瑚红）· 警示 / 关键标记 / 图标填充** | 填充时配深墨字；作大字号文字可用 |
| **#FFD166** | **点缀（暖黄）· 徽章 / 高亮标记 / 星级** | 只作填充，配深墨字 |
| **#FFFDF7** | 页面背景（暖白） | 保留原有资产 |
| **#12332A** | 正文文字（深墨绿） | 替代纯黑，比 #000 更柔和 |
| **#4E6B60** | 次要文字 / 说明 / 元信息 | |

> 派生色（同一套系统，非独立品牌色）：**#077356** = 主色按下态；**#D6EFE3** = 边框 / 分隔线。上面 8 色为核心色板，其余为功能派生色。

**为什么读起来「青春活泼」**：① 薄荷绿本身是「清新」的原型色；② 珊瑚红 #FF6B6B 与暖黄 #FFD166 是糖果系补色，与薄荷形成三段色彩节奏，视觉上像汽水包装；③ 全部色值都偏高明度、低阴影，没有企业深蓝的压迫感；④ 深薄荷 #0A8064 只在功能位（按钮 / 链接）出现，保证界面 90% 面积仍是浅色，读起来「轻」。

**浅色底对比度审计（实测 WCAG 2.1 比值）**：

| 前景 / 背景 | 比值 | 是否达标 |
|---|---|---|
| #12332A 正文 / #FFFDF7 背景 | **13.47:1** | 达标（AAA） |
| #12332A 正文 / #EDFBF4 表面 | **12.86:1** | 达标（AAA） |
| #4E6B60 次要文字 / #FFFDF7 | **5.74:1** | 达标（AA，正文） |
| #0A8064 主色文字 / #FFFDF7 | **4.82:1** | 达标（AA，正文） |
| #0A8064 主色文字 / #EDFBF4 | **4.60:1** | 达标（AA） |
| #FFFFFF 白字 / #0A8064 按钮底 | **4.90:1** | 达标（AA） |
| #FFFFFF 白字 / #077356 按下态 | **5.84:1** | 达标（AA） |
| #12332A 深墨字 / #91E6C1 薄荷块 | **9.33:1** | 达标（AAA） |
| #12332A 深墨字 / #FFD166 暖黄块 | **9.50:1** | 达标（AAA） |
| ⚠ #FF6B6B 珊瑚红 / #FFFDF7 | 2.73:1 | **不达标**：不可作正文色；只作填充（配 #12332A 深墨字时为 4.94:1，达标）或 ≥ 24px 大字 |
| ⚠ #FFFFFF / #FF6B6B | 2.78:1 | **不达标**：珊瑚红底上不要放白字，改放 #12332A |
| ⚠ #91E6C1 / #FFFDF7 | 1.44:1 | **不达标**：薄荷色**只能作背景块**，绝不能作文字色 |

**兼容性结论**：现有 #91E6C1 + #FFFDF7 **原样保留**，只新增 7 个变量；Demo 现有 CSS 变量只需**重新赋主色值**（--brand 从浅薄荷改为 #0A8064，同时新增 --brand-soft: #91E6C1 承接原装饰用法）。

### 4.2 方案 B · 柑橘气泡 Citrus Pop

**思路**：把主色调成血橙 / 柿子，配葡萄紫做强调，整体像果味汽水。活泼度最高，但离现有品牌最远。

| 色值 | 用途 |
|---|---|
| **#C43E17** | 主色 / 主按钮底 / 链接（暖橙红） |
| **#FFD9C2** | 主色浅（标签底 / 引用块底 / 高亮行） |
| **#FFEFE1** | 表面 / 卡片底 |
| **#6C4CF1** | **强调（葡萄紫）· 次按钮 / 选中态 / 图标** |
| **#FFC93C** | **点缀（日光黄）· 徽章 / 高亮标记** |
| **#37D3C4** | **点缀（果冻青）· 数据可视化 / 进度** |
| **#FFFAF3** | 页面背景（奶油白） |
| **#2A1E14** | 正文文字（深棕） |

> 派生色：**#B93A14** = 主色按下态；**#6B5647** = 次要文字（对比度见下方审计表）；**#F5DDC8** = 边框 / 分隔线。

**为什么活泼**：橙红是食欲与能量的颜色，饱和度高、明度中，天然「热」；葡萄紫作冷侧对比，形成强烈互补张力（橙 ↔ 紫）；奶油白背景比纯白暖，让高饱和色块不刺眼。三者合起来是果汁包装的语言。

**对比度审计**：

| 前景 / 背景 | 比值 | 是否达标 |
|---|---|---|
| #2A1E14 正文 / #FFFAF3 | **15.62:1** | 达标（AAA） |
| #2A1E14 正文 / #FFEFE1 | **14.44:1** | 达标（AAA） |
| #6B5647 次要 / #FFFAF3 | **6.64:1** | 达标（AA） |
| #C43E17 主色文字 / #FFFAF3 | **4.99:1** | 达标（AA） |
| #C43E17 主色文字 / #FFEFE1 | **4.62:1** | 达标（AA） |
| #FFFFFF / #C43E17 按钮底 | **5.19:1** | 达标（AA） |
| #6C4CF1 强调文字 / #FFFAF3 | **5.13:1** | 达标（AA） |
| #6C4CF1 / #FFEFE1 表面 | **4.74:1** | 达标（AA） |
| #FFFFFF / #6C4CF1 | **5.33:1** | 达标（AA） |
| #2A1E14 / #FFC93C 黄块 | **10.56:1** | 达标（AAA） |
| #2A1E14 / #37D3C4 青块 | **8.71:1** | 达标（AAA） |
| #2A1E14 / #FFD9C2 浅橙块 | **12.33:1** | 达标（AAA） |

### 4.3 方案 C · 汽水电光 Soda Electric

**思路**：电子蓝主色 + 品红强调 + 柠檬黄点缀，是最「数字原住民」的一套，适合科技故障排障的题材。

| 色值 | 用途 |
|---|---|
| **#2A61E8** | 主色 / 主按钮底 / 链接（电光蓝） |
| **#BBD1FF** | 主色浅（标签底 / 高亮行 / 插图色块） |
| **#E7EEFF** | 表面 / 卡片底 |
| **#C9256A** | **强调（品红）· 次按钮 / 关键标记 / 进度** |
| **#FFD43B** | **点缀（柠檬黄）· 徽章 / 星级 / 高亮** |
| **#00C2A8** | **点缀（湖绿）· 成功态 / 数据可视化** |
| **#F6F8FF** | 页面背景（冷白） |
| **#101A33** | 正文文字（午夜蓝黑） |

> 派生色：**#2557DB** = 主色按下态；**#48546F** = 次要文字（对比度见下方审计表）；**#D3DEFB** = 边框 / 分隔线。

**为什么活泼**：电光蓝明度中高、饱和度高，读起来「通电」；品红与湖绿是 UI 语境里的荧光色，与柠檬黄一起构成四色节奏（蓝 / 品红 / 黄 / 青），是典型的汽水罐配色；冷白背景让蓝色不显脏。

**对比度审计**：

| 前景 / 背景 | 比值 | 是否达标 |
|---|---|---|
| #101A33 正文 / #F6F8FF | **16.25:1** | 达标（AAA） |
| #101A33 正文 / #E7EEFF | **14.84:1** | 达标（AAA） |
| #48546F 次要 / #F6F8FF | **7.14:1** | 达标（AAA） |
| #2A61E8 主色文字 / #F6F8FF | **4.98:1** | 达标（AA） |
| #2A61E8 主色文字 / #E7EEFF | **4.55:1** | 达标（AA） |
| #FFFFFF / #2A61E8 按钮底 | **5.28:1** | 达标（AA） |
| #FFFFFF / #2557DB 按下态 | **6.06:1** | 达标（AA） |
| #C9256A 强调文字 / #F6F8FF | **5.00:1** | 达标（AA） |
| #FFFFFF / #C9256A | **5.31:1** | 达标（AA） |
| #101A33 / #FFD43B 黄块 | **12.10:1** | 达标（AAA） |
| #101A33 / #00C2A8 湖绿块 | **7.62:1** | 达标（AAA） |
| #101A33 / #BBD1FF 浅蓝块 | **11.23:1** | 达标（AAA） |

### 4.4 三套方案横向对比与选型建议

| 维度 | A 薄荷气泡 | B 柑橘气泡 | C 汽水电光 |
|---|---|---|---|
| 与现有 #91E6C1 / #FFFDF7 兼容 | **原样保留** | 需弃用 | 需弃用 |
| 活泼度 | 中高 | **最高** | 高 |
| 与「故障排障」题材的契合 | 高（清爽、可信、不吓人） | 中（热情但偏消费） | **高**（科技感强） |
| 正文对比度 | 13.47 | 15.62 | **16.25** |
| 主色文字对比度（临界项） | 4.82 | 4.99 | 4.98 |
| 改动成本 | **最低**（只改主色变量） | 高（全站换色） | 中高 |
| 主要风险 | 薄荷色若误用为文字色会失败（规范已禁止） | 橙红大面积易显廉价 | 冷色为主，暖色点缀必须足够 |
| **推荐** | **首选（本阶段）** | 备选（若品牌允许大改） | 备选（若后续推出网络 / 极客子品牌线） |

**落地写法（纯 CSS，零依赖）**：

````css
:root {
  /* 采用方案 A；如切方案 B / C，只换这一块 */
  --brand:        #0A8064;   /* 主色：正文级链接、主按钮底 */
  --brand-deep:   #077356;   /* 按下态 */
  --brand-soft:   #91E6C1;   /* 原品牌薄荷：只作填充 */
  --brand-wash:   #EDFBF4;   /* 主色极浅：卡片 / 代码块底 */
  --pop-coral:    #FF6B6B;   /* 强调：填充块 + 深墨字 */
  --pop-sun:      #FFD166;   /* 点缀：徽章 + 深墨字 */
  --bg:           #FFFDF7;
  --surface:      #FFFFFF;
  --ink:          #12332A;
  --ink-muted:    #4E6B60;
  --line:         #D6EFE3;

  /* 动效 token（见 §5.5） */
  --dur-1:  120ms;  --dur-2:  200ms;  --dur-3:  320ms;  --dur-4:  480ms;
  --ease-out:  cubic-bezier(.05,.7,.1,1);
  --ease-in:   cubic-bezier(.3,0,.8,.15);
  --ease-soft: cubic-bezier(.2,.8,.2,1);
  --ease-back: cubic-bezier(.34,1.56,.64,1);
  --r-card: 18px;  --r-pill: 999px;
}
````

---

## 5. 动效清单（四层，共 36 条）

### 5.0 使用说明与全局守则

| 守则 | 内容 |
|---|---|
| 时长上限 | 交互反馈 ≤ 200ms（Doherty 阈值 400ms 的一半以内）；区块进场 ≤ 480ms；页面级 ≤ 600ms |
| 只动合成属性 | 优先 transform / opacity；其次 filter（有 GPU 成本）；**禁止动画 width / height / top / left / margin** |
| 列表错峰 | 用 --i 索引：animation-delay: calc(var(--i) * 40ms)，总错峰不超过 320ms |
| 缓动 | 进场用 decelerate、离场用 accelerate、回弹用 --ease-back；同一元素进场离场用不同曲线 |
| 降级 | 全局 prefers-reduced-motion 规则见 §5.5；**不是「什么都不动」**，而是去掉位移与循环、保留必要的状态切换 |
| 不阻塞 | 所有动效不得阻塞交互；pointer-events 与 will-change 用完即撤 |

### 5.1 页面级（Page）

| # | 名称 | 触发时机 | 效果描述 | 实现要点（CSS / JS） | 性能注意 | reduced-motion 降级 |
|---|---|---|---|---|---|---|
| P1 | 首屏进场 Headline Reveal | 文档 DOMContentLoaded，由 <head> 内联脚本在 <html> 上加 js-ready 类 | 主标题逐行上浮淡入，副标与按钮依次跟随 | .hero h1 span { transform: translateY(14px); opacity: 0 } .js-ready .hero h1 span { transform: none; opacity: 1; transition: transform var(--dur-4) var(--ease-out), opacity var(--dur-4) var(--ease-out); transition-delay: calc(var(--i) * 70ms) } | 只动 transform / opacity；will-change 动画结束即移除 | 直接显示终态（opacity:1; transform:none），去掉 transition |
| P2 | 页面离场 Leave Fade | 站内链接点击（仅方案 2 采用） | 内容整体轻微缩小 + 淡出（180ms），然后跳转 | JS preventDefault → documentElement.classList.add('is-leaving') → transitionend 或 setTimeout(180) 后 location.href | 只动 transform / opacity；**必须**设 180ms 上限 + setTimeout 兜底，避免动画失败导致点了没反应 | 跳过离场，直接跳转 |
| P3 | 返回复位 bfcache Reset | window 的 pageshow 事件 | 从浏览器后退返回时，若页面被 bfcache 恢复，需去掉 is-leaving 类并恢复可用状态 | if (event.persisted) { html.classList.remove('is-leaving'); html.classList.add('is-restored') }；is-restored 用于**禁用这一次进场动画**（避免返回后又重播） | 纯类切换，无动画成本 | 不变（类切换本身即可访问） |
| P4 | 顶部滚动进度条 | 滚动（scroll 事件，用 requestAnimationFrame 节流） | 顶部 2px 主色条随阅读进度增长 | --scroll: 0 由 JS 更新；.progress { transform: scaleX(var(--scroll)); transform-origin: 0 50% } | 只动 transform；用 rAF 节流，不要在 scroll 里反复强制同步布局 | 直接隐藏进度条（display:none），不影响阅读 |
| P5 | 导航中状态 Router Busy | 站内导航点击后 | 顶部进度条瞬间冲到 8% 并呼吸，直到新页接管 | 同 P2 / P4；新页加载后自然消失（整页刷新） | 纯 transform | 跳过 |

### 5.2 区块级（Section）

| # | 名称 | 触发时机 | 效果描述 | 实现要点 | 性能注意 | reduced-motion 降级 |
|---|---|---|---|---|---|---|
| S1 | Hero 渐变漂移 | 首屏可见即开始，无限循环 | 背景色斑缓慢移动 / 变形，60s 一个循环 | 3 个绝对定位 radial-gradient 色斑 + filter: blur(48px)，各自 animation: drift 60s ease-in-out infinite alternate，只动 transform: translate3d / scale | filter: blur 是 GPU 开销；**面积控制在首屏 1 屏内**，移动端降为 2 个色斑 | 关掉动画，保留静态渐变 |
| S2 | 卡片网格错峰入场 | 区块进入视口（IntersectionObserver, threshold: .15） | 卡片从下 16px、透明 → 归位，逐张延迟 50ms | .grid .card { opacity: 0; transform: translateY(16px) } .in-view .card { opacity: 1; transform: none; transition: .38s var(--ease-out) calc(var(--i) * 50ms) } | transform / opacity；IO 触发后 unobserve，避免反复触发 | 一次性显示，无位移 |
| S3 | 章节标题下划线绘制 | 标题进入视口 | 标题下方主色短线从左向右画出 48px | 伪元素 ::after { transform: scaleX(0); transform-origin: 0 50% } .in-view h2::after { transform: scaleX(1); transition: transform .4s var(--ease-out) } | 推荐 transform: scaleX（可合成），**不要动 width** | 直接显示下划线 |
| S4 | 侧栏目录跟随高亮 | 滚动到对应章节 | 目录项背景淡入 + 左侧指示条滑动 | IO 监听各 h2 → 给对应 a 加 .active；指示条用一个绝对定位块 transform: translateY(var(--y)) | translateY 可合成；用 IO 而非 scroll 计算 | 只换文字颜色，不做滑动 |
| S5 | 折叠面板展开 | 点击 summary / 标题 | 内容高度展开 + 内部文字淡入 | <details> 原生方案：::details-content { block-size: 0; transition: block-size .28s, content-visibility .28s allow-discrete; overflow: hidden } details[open]::details-content { block-size: auto }；降级版用 grid-template-rows: 0fr → 1fr | block-size 动画不合成，但区块高度动画不可避免；**限制同时展开 1–2 个面板**，单次 ≤ 280ms | 直接显隐，无过渡 |
| S6 | 图片模糊占位 Blur-up | 图片加载前 / 后 | 低清色块模糊 → onload 后清晰 | 容器 background: var(--brand-wash)；img { opacity: 0; transition: opacity .3s } img.loaded { opacity: 1 }，用 aspect-ratio 占位防 CLS | 只动 opacity；aspect-ratio 防布局抖动 | 不变（加载完直接显示） |
| S7 | 表格行扫过高亮 | 鼠标进入表格行 | 整行背景由浅到深扫过 | tr:hover { background: var(--brand-wash) } + transition: background-color .15s；进阶用 linear-gradient 背景位移 | background-color 不合成但成本极低；行数多时加 content-visibility: auto | 保留更明显的静态 hover 底色 |
| S8 | 结尾 CTA 弹性升起 | 区块进入视口 | CTA 卡片带轻微回弹升起 | .cta { transform: translateY(20px) scale(.98); opacity: 0 } .in-view .cta { transform: none; opacity: 1; transition: .5s var(--ease-back) } | transform / opacity | 直接显示 |

### 5.3 组件级（Component）

| # | 名称 | 触发时机 | 效果描述 | 实现要点 | 性能注意 | reduced-motion 降级 |
|---|---|---|---|---|---|---|
| C1 | 主按钮按压 | :active | 缩到 0.97，阴影收紧 | .btn { transition: transform var(--dur-1) var(--ease-soft), box-shadow var(--dur-1) } .btn:active { transform: scale(.97); box-shadow: 0 1px 2px rgba(0,0,0,.12) } | transform + box-shadow（阴影有轻微重绘，单元素可接受） | 保留颜色变化，去掉缩放 |
| C2 | 按钮光泽扫过 | :hover | 一道白色斜光从左扫到右（约 500ms） | 伪元素 ::before { background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,.55) 50%, transparent 60%); transform: translateX(-120%) } .btn:hover::before { transform: translateX(120%); transition: transform .5s var(--ease-soft) } | 只动 transform；父级 overflow: hidden 裁剪 | 隐藏光泽层 |
| C3 | 按钮 Loading | 提交 / 跳转后 | 文案淡出，内联圆环旋转 | conic-gradient 圆环：background: conic-gradient(from 0deg, transparent, var(--brand)); mask: radial-gradient(farthest-side, #0000 calc(100% - 3px), #000 0)；animation 转 rotate | transform: rotate 是标准合成动画 | 降级为文字「处理中…」，不转 |
| C4 | 复制成功 Toast | 点击复制按钮 | 顶部 / 按钮旁弹出胶囊提示，1.6s 后自动消失 | 原生 <div role="status" aria-live="polite">；进出场 translateY(-8px) scale(.98) + opacity，transition: .18s var(--ease-soft) | transform / opacity；aria-live 保证屏幕阅读器可感知 | 直接出现 / 消失，无位移 |
| C5 | 复制图标 morph | 点击复制成功 | 复制图标用描边绘制变成对勾 | 内联 SVG：path { stroke-dasharray: 24; stroke-dashoffset: 24 } .copied path { stroke-dashoffset: 0; transition: stroke-dashoffset .3s var(--ease-out) }；两段路径用 opacity 切换 | stroke-dashoffset 不是合成属性，但单个小图标成本可忽略 | 直接换图标，无绘制 |
| C6 | 向导步骤条推进 | 点「下一步」 | 当前步骤圆点放大填充，连接线从左向右生长 | 连接线 transform: scaleX(var(--p))，--p 由 JS 按步骤数设置；圆点 transform: scale(1.15) 回弹一次 | 全部 transform | 只换颜色 / 字号，不做生长 |
| C7 | 标签页滑动指示器 | 点击 / 切换 tab | 底部指示条滑到新位置，内容交叉淡入 | 指示条 transform: translateX(var(--x)) scaleX(var(--w))，由 JS 读按钮 offsetLeft / offsetWidth 写入变量；内容 opacity 交叉切换 | translateX / scaleX 可合成（**不要动 left**） | 直接切换，无滑动 |
| C8 | 卡片悬浮抬升 | :hover / :focus-visible | 上移 3px、阴影扩大、边框变主色 | transform: translateY(-3px); box-shadow: 0 12px 28px -12px rgba(10,128,100,.28); border-color: var(--brand-soft) | transform；阴影尽量单层，避免多层模糊 | 只改边框色与背景 |
| C9 | 搜索框聚焦扩展 | :focus-within | 边框点亮为主色、外扩一圈柔光环、图标微移 | .search:focus-within { border-color: var(--brand); box-shadow: 0 0 0 4px color-mix(in srgb, var(--brand-soft) 55%, transparent) }；图标 transform: translateX(1px) | transform + box-shadow | 只保留边框色变化 |
| C10 | 下拉结果条进出 | 输入产生结果 | 结果列表以 40ms 错峰从顶部滑入 | li { animation: dropIn .22s var(--ease-out) backwards; animation-delay: calc(var(--i) * 40ms) } | transform / opacity；**限制渲染条数**（> 10 条时不做逐条动画） | 一次性显示 |
| C11 | 数字滚动计数 | 区块进入视口 | 数字从 0 涨到目标值 | 纯 CSS 滚动列（每位一列 translateY），JS 只负责写目标位；加 font-variant-numeric: tabular-nums | 若用 JS 逐帧改 textContent 会频繁重排；推荐「列滚动」只动 transform | 直接显示最终数字 |

### 5.4 微交互（Micro-interaction）

| # | 名称 | 触发时机 | 效果描述 | 实现要点 | 性能注意 | reduced-motion 降级 |
|---|---|---|---|---|---|---|
| M1 | 开关 Toggle | 点击 | 滑块位移 + 轨道变色 + 轻微回弹 | input:checked + .track { background: var(--brand) } .track::after { transform: translateX(0) } input:checked + .track::after { transform: translateX(18px); transition: transform var(--dur-2) var(--ease-back) } | transform | 立即到位 |
| M2 | 复选框打勾 | 勾选 | 方框填充 + 对勾描边绘制 | SVG stroke-dashoffset: 18 → 0，配合 transition-delay: 60ms 让「框先满、勾后画」 | stroke-dashoffset 非合成；元素极小，可接受 | 直接显示对勾 |
| M3 | 链接下划线从中心展开 | :hover / :focus-visible | 下划线由中心向两侧展开 | a::after { transform: scaleX(0); transform-origin: 50% 100% } a:hover::after { transform: scaleX(1); transition: transform var(--dur-2) var(--ease-out) } | scaleX | 直接显示下划线 |
| M4 | 输入框浮动标签 | 聚焦或有值 | 标签上移缩小到输入框上方 | :focus-within label, input:not(:placeholder-shown) + label { transform: translateY(-14px) scale(.82); color: var(--brand) }，transition: transform .18s, color .18s | transform | 标签直接常驻在上方（不做浮动） |
| M5 | 点击涟漪 Ripple | pointerdown | 从点击点扩散一圈主色涟漪 | 伪元素 radial-gradient + transform: scale(0→1) + opacity 1→0，位置用 --x / --y 变量；450ms 后移除节点 | transform / opacity；只对主按钮启用 | 只保留 :active 的底色变化 |
| M6 | 图标按钮微旋转 | :hover | 图标转 12° 或轻微摆动（如铃铛） | .icon-btn:hover svg { transform: rotate(12deg); transition: transform var(--dur-2) var(--ease-back) } | transform | 只改颜色 |
| M7 | 错误抖动 Shake | 校验失败 | 输入框左右抖动 3 次（300ms） | @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }；动画结束后移除类（避免重播） | translateX | 改为边框变红 + 错误文案（同时设 aria-invalid） |
| M8 | 成功脉冲 Ring | 操作成功 | 按钮外扩一圈主色光环后消失 | ::after { border: 2px solid var(--brand); transform: scale(.8); opacity: 1 } animation: pulse .5s forwards { to { transform: scale(1.35); opacity: 0 } } | transform / opacity | 只改按钮底色为成功色 |
| M9 | 骨架屏微光 | 内容加载中 | 灰块上一道浅色斜光反复扫过 | .skel { background: linear-gradient(100deg, #EEE 30%, #F7F7F7 50%, #EEE 70%); background-size: 200% 100%; animation: shimmer 1.2s linear infinite } @keyframes shimmer { to { background-position: -200% 0 } } | background-position 非合成，但面积小；**限制骨架屏总时长**（真实加载 > 1s 才显示） | 静态灰块，不闪 |
| M10 | 光标跟随光晕（可选） | pointermove | 卡片内一个柔和光斑跟随鼠标 | 用 --mx / --my 变量 + radial-gradient(circle at var(--mx) var(--my), …) 背景；rAF 节流 | 每次移动改背景 = 重绘；**仅桌面端 + 仅卡片 hover 时启用**，移动端与低端设备直接关闭 | 完全关闭 |
| M11 | 滚动到锚点的平滑定位 | 点击目录链接 | 平滑滚到目标并给标题加临时高亮 | el.scrollIntoView({ behavior: 'smooth', block: 'start' })；CSS scroll-margin-top: 84px 避开粘性顶栏；scroll-behavior: smooth 作为无 JS 降级 | 浏览器原生合成实现 | scroll-behavior: auto，瞬时跳转 |
| M12 | 音效反馈（默认关闭） | 复制成功 / 步骤完成 | 极短（< 150ms）的轻「咔」声 | <audio preload="none"> + new Audio(src).play()；**首次由用户点击「开启声音」时创建并播放一次**（解锁自动播放策略）；选择存 localStorage | 不涉及渲染；音频文件 < 8KB | 跟随系统无对应项，但提供显式开关 |

### 5.5 动效 token 与全局降级（可直接粘贴）

````css
/* 1) token 层：全站只允许用这些值 */
:root {
  --dur-1: 120ms; --dur-2: 200ms; --dur-3: 320ms; --dur-4: 480ms;
  --ease-out:  cubic-bezier(.05,.7,.1,1);    /* Material emphasized-decelerate */
  --ease-in:   cubic-bezier(.3,0,.8,.15);    /* Material emphasized-accelerate */
  --ease-soft: cubic-bezier(.2,.8,.2,1);
  --ease-back: cubic-bezier(.34,1.56,.64,1); /* 略过冲的「活泼」曲线 */
  --stagger: 50ms;
}

/* 2) 进场动效的三态：未触发 / 已触发 / 已复位（bfcache 返回） */
.reveal            { opacity: 0; transform: translateY(16px); }
.in-view .reveal,
.reveal.in-view    { opacity: 1; transform: none;
                     transition: opacity var(--dur-3) var(--ease-out) calc(var(--i, 0) * var(--stagger)),
                                 transform var(--dur-3) var(--ease-out) calc(var(--i, 0) * var(--stagger)); }
html.is-restored .reveal { opacity: 1; transform: none; transition: none; }  /* 返回不重播 */

/* 3) 全局减弱动效：不是「全禁用」，而是「去掉位移与循环，保留状态切换」 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
  .reveal { opacity: 1 !important; transform: none !important; }
  [class*="drift"], .shimmer, .orb { animation: none !important; }
}
````

````js
// 4) 区块入场：一个 IO 打天下（原生 JS，约 12 行）
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add('in-view');
    io.unobserve(e.target);           // 触发一次即注销，避免来回播放
  }
}, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

document.querySelectorAll('[data-reveal-group]').forEach((g) => {
  [...g.children].forEach((c, i) => c.style.setProperty('--i', i));  // 写错峰索引
  io.observe(g);
});
````

---


## 6. 页面切换方案（静态多页站，每次点链接都是整页刷新）

**前提**：站点是纯静态多页（index.html / browse.html / search.html / wizard.html / tools.html / about.html / fix/*.html），nginx 直出，无路由层、无 SPA。因此「转场」只能在**两次文档加载之间**做文章。

**共同要解决的三件事**：

1. **白屏闪烁**：旧文档被销毁后、新文档首帧渲染前的空窗期。
2. **bfcache**：浏览器后退 / 前进可能直接恢复内存中的页面（pageshow.persisted === true），此时所有入场动画已播完的 DOM 状态会被原样恢复，但被 JS 改过的类（如 is-leaving）也会被恢复 → 必须显式复位。
3. **首屏不闪烁**：进场动画若不是「从第一帧就处于初始态」，用户会看到「内容先正常显示，然后突然跳回起始位置再播一次」——这是最丑的 bug。

### 6.1 方案 1：跨文档 View Transitions（渐进增强型）

| 项 | 内容 |
|---|---|
| **原理** | 浏览器在两次文档加载之间自动截取旧页快照（::view-transition-old(root)）与新页快照（::view-transition-new(root)），由浏览器做交叉淡入 / 滑动。**纯 CSS 声明即可启用** |
| **代码** | CSS：@view-transition { navigation: auto }，再对 ::view-transition-old(root) / ::view-transition-new(root) 写 animation-duration 与 @keyframes（如旧页上移淡出、新页从下淡入）。命名元素做共享元素转场：header { view-transition-name: site-header } |
| **进入 / 离开时机** | 全部由浏览器掌握：离开 = 旧文档卸载后自动截取；进入 = 新文档首次渲染时自动播放。**开发者不写 JS** |
| **白屏避免** | 浏览器原生接管，快照交替，天然无白屏 |
| **bfcache** | 不冲突；但需注意 view-transition-name 在同一文档内必须唯一，否则整页转场被跳过 |
| **降级** | 特性查询 @supports (view-transition-name: none) { … }，不支持则完全不生效，不影响功能 |
| **优点** | 零 JS、零拦截、最优雅；支持共享元素（点卡片 → 详情页卡片位置延续） |
| **缺点** | **兼容性风险**：跨文档 @view-transition 目前主要在 Chromium 系（Chrome / Edge 126+）落地，Safari 部分版本支持，Firefox 长期未默认开启 → 相当比例用户**永远看不到**转场 |
| **结论** | **可以做，但只能当锦上添花，不能当唯一方案** |

### 6.2 方案 2：离场幕布（Overlay Curtain，拦截式）

| 项 | 内容 |
|---|---|
| **原理** | 原生 JS 拦截全部站内链接点击 → 播放 160–220ms 的幕布覆盖动画 → 再 location.href 跳转；新页在 <head> 内联脚本里让幕布**初始就是覆盖态**，DOM 就绪后揭开 |
| **代码骨架** | ① 每页顶部固定一个 .curtain（position: fixed; inset: 0; background: var(--brand); clip-path: inset(0 0 100% 0); z-index: 9999）；② 点击站内链接时 clip-path 从 inset(0 0 100% 0) 过渡到 inset(0)，transition: clip-path 180ms var(--ease-in)，transitionend 后跳转；③ 新页 <head> 内联脚本检查 sessionStorage.navCurtain === '1' → 立刻在 <html> 上加 is-curtain-on，让幕布首帧即为盖住状态，再在 DOMContentLoaded 后移除 |
| **进入 / 离开时机** | 离开：点击 → 180ms 覆盖 → 跳转；进入：新页首帧覆盖 → 内容就绪 → 200ms 揭开后进场 |
| **白屏避免** | 幕布盖住了整个加载空窗期，用户看到的是品牌色而非白屏 |
| **bfcache** | **最大坑点**：后退返回时浏览器恢复的 DOM 可能仍带 is-curtain-on（幕布盖住）→ 必须在 pageshow 里 if (e.persisted) html.classList.remove('is-curtain-on', 'is-leaving')；同时 sessionStorage.navCurtain 要清掉，否则刷新时又盖一层 |
| **降级** | ① 不用 View Transitions；② prefers-reduced-motion 时幕布时长压到 1ms 直接跳；③ JS 失效时链接本身仍是普通 <a href>（**必须不能只依赖 JS 跳转**，href 要真实存在）；④ 修饰键（Ctrl / Cmd / Shift / 中键）点击、target="_blank"、download、跨域链接、mailto: 一律放行不拦截 |
| **优点** | 全平台一致（纯 CSS + 原生 JS）；品牌感强 |
| **缺点** | ① 给**每次导航加了 180ms 延迟**（用户能感知，尤其快速连点）；② 拦截逻辑容易出错（无 href 的按钮、hash 锚点、同页链接、返回键不触发）；③ bfcache 状态污染风险高 |
| **结论** | **只在 1–2 条关键路径上用**（如「开始排障向导」入口、向导完成 → 结果页），不做全站默认 |

### 6.3 方案 3：进场接续式（Enter-only Reveal + sessionStorage 首访判断）★推荐

| 项 | 内容 |
|---|---|
| **原理** | **不在离开时做任何事**（不拦截、不延迟、不加负担），只保证**新页第一帧就处在起始态**，然后自然过渡到终态。视觉上的转场感来自新旧页的**元素位置接续**（例如列表页卡片 → 详情页顶部图片区，用同一套入场方向），而不是真的把两页连起来 |
| **head 内联脚本（必须极短、渲染前执行）** | 见下方代码块：读 sessionStorage 判断首访 → 加 is-enter 或 is-first → pageshow 里处理 bfcache → 特性探测 View Transitions |
| **为什么必须放在 head 且内联** | ① 外部脚本要等一次网络往返，类会晚于首帧添加 → 用户会看到先正常显示、再跳回起始位的闪跳；② 内联脚本在 body 解析前执行，保证 CSS 第一次匹配到元素时类已存在；③ 脚本必须 **< 1KB 且不能 defer / async**（否则失去时序保证） |
| **CSS 侧** | 起始态定义在 html.is-enter 下，**默认态（无类）就是终态**——这样即使 JS 完全失败，页面也正常显示（渐进增强的铁律）：html.is-enter .reveal { opacity: 0; transform: translateY(14px) }，进入动画由 transition 完成；is-first 只做整体透明度 0→1（100ms），不做位移，避免首次访问「整页晃一下」 |
| **进入 / 离开时机** | 离开：**不做任何事**（浏览器默认行为，导航速度最快）；进入：head 脚本打类 → 首帧即起始态 → rAF 后给 html 加 is-done 触发过渡（并在加类前强制一次样式回读 void document.body.offsetWidth，保证过渡生效） |
| **白屏避免** | 本方案不掩盖白屏，而是**让白屏不存在**：① CSS 在 head 顶部给出 html{background:var(--bg)}（或直接在 <html> 上写内联 style），使浏览器进入「有背景的空白」而非纯白屏；② 关键 CSS 内联（< 6KB）可进一步减少首次渲染阻塞；③ 首帧即有骨架色块而非空白 |
| **bfcache / pageshow 处理** | 见脚本：e.persisted === true 时移除 is-enter、加 is-restored；is-restored 对应的 CSS 是 opacity:1; transform:none; transition:none（**直接终态**）。另外要处理「非 persisted 的 pageshow」（例如页面从缓存恢复但未走 bfcache）——用 pageshow 统一收口即可 |
| **sessionStorage 的坑** | ① 隐私模式 / 被禁用会抛异常 → 必须 try / catch；② 取值用 sessionStorage（标签页级）而非 localStorage，这样关掉标签页再打开会重新算首访；③ 首次访问判定要在 setItem **之前**读，避免竞态；④ 不要用它存「是否播放过动画」以外的任何状态 |
| **降级** | ① JS 失效 → 无 is-enter 类 → 直接终态，页面完全正常；② prefers-reduced-motion: reduce → 全局规则把 transition-duration 压到 .01ms，入场瞬间完成；③ 老浏览器不支持 IntersectionObserver → 用 if (!('IntersectionObserver' in window)) 直接给所有区块加终态类 |
| **优点** | 零导航延迟、零拦截风险、零白屏（首帧即有背景与骨架）、bfcache 行为明确、实现只有几十行、**在浏览器百分百可用** |
| **缺点** | 没有旧页退场的仪式感（但静态站本来也不该为此付出导航延迟） |
| **结论** | ★ **作为本站默认方案全站启用** |

### 6.4 推荐与组合策略

| 层级 | 方案 | 覆盖范围 | 说明 |
|---|---|---|---|
| **基线（必做）** | **方案 3 进场接续式** | 全站所有页面 | 保证不闪、不慢、后退正常 |
| **增强（渐进）** | 方案 1 跨文档 View Transitions | 支持 @view-transition 的浏览器 | 一行 CSS 声明，支持时自动更优雅；必须在 @supports 内，且**不能与方案 3 的入场动画冲突**（支持 VT 时不要重复播放 is-enter，用 @supports 关掉） |
| **选择性使用** | 方案 2 离场幕布 | 仅 index.html → wizard.html（开始排障）与 wizard.html → 结果页两条关键路径 | 制造进入流程的仪式感；时长 ≤ 200ms |
| **不做** | SPA 化 / fetch + history.pushState 局部换页 | — | 与「零依赖纯静态」的项目约束冲突，收益不足以抵消复杂度 |

**冲突处理**：三个方案共存时，用类名分层隔离——
- html.is-enter（方案 3 的入场）
- html.is-curtain-on（方案 2 的幕布，层级最高）
- 用 JS 一次性探测 CSS.supports('view-transition-name: none')，支持时给 html 加 .vt-supported，此时禁用方案 3 的入场动画，交给浏览器。

### 6.5 首屏不闪烁的实现要点（清单）

| # | 要点 | 做法 |
|---|---|---|
| 1 | **背景先有，内容后有** | CSS 顶部写 html { background: #FFFDF7 }，或直接 <html style="background:#FFFDF7">；让首帧是暖白而不是浏览器默认白 |
| 2 | **类先于首帧** | 进场类必须在 <head> 的**内联**脚本里加，不能用外部 JS、不能 defer |
| 3 | **默认态 = 终态** | 起始态只在带类时生效；**绝不要**把 opacity:0 写在无类的基础样式里（JS 一失败就白页） |
| 4 | **字体不跳** | 用系统字体栈（§3.5 Modern Font Stacks）；若必须自托管，font-display: swap + size-adjust |
| 5 | **图片不跳** | 所有 <img> 写死 width / height 或 aspect-ratio |
| 6 | **关键 CSS 内联** | 把 head 必需的 ≤ 6KB CSS（变量、布局、背景、入场起始态）内联，其余 <link> 异步；本站 CSS 很小，直接同步 <link> 亦可 |
| 7 | **首访不做位移** | sessionStorage 判断首访：首次进站只做 100ms 整体淡入，不做逐元素位移（否则显得慢） |
| 8 | **不做「加载遮罩 spinner」** | 静态站加载极快，遮罩反而会在慢网络上卡住内容（遮罩先到、内容后到 = 更长白屏） |
| 9 | **banner 高度固定** | 粘性顶栏写死高度并配 scroll-margin-top 对齐锚点，避免锚点跳转后被顶栏遮挡 |
| 10 | **验证方式** | DevTools Performance 录制 + 手动限速（Fast 3G）看首帧；Network 面板确认 head 内联脚本在 CSS 请求之前执行 |

### 6.6 综合骨架（方案 3 主 + 方案 1 增强，完整可抄）

````html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>html{background:#FFFDF7}html.is-first body{opacity:0}</style>
  <script>
  (function () {
    var d = document.documentElement, k = 'fb-visited';
    try {
      if (sessionStorage.getItem(k)) d.classList.add('is-enter');
      else { sessionStorage.setItem(k, '1'); d.classList.add('is-first'); }
    } catch (e) { d.classList.add('is-first'); }
    // bfcache 返回：跳过入场，直接终态
    addEventListener('pageshow', function (e) {
      if (e.persisted) {
        d.classList.remove('is-enter', 'is-first');
        d.classList.add('is-restored');
        d.classList.remove('is-curtain-on');
      }
    });
    // 特性探测：支持跨文档 View Transitions 时，交给浏览器做转场
    try {
      if (CSS.supports('view-transition-name: none')) d.classList.add('vt-supported');
    } catch (e) {}
  })();
  </script>
  <link rel="stylesheet" href="/css/fix.css">
  <style>
    /* 方案 1：支持时启用跨文档转场 */
    @supports (view-transition-name: none) {
      @view-transition { navigation: auto; }
      ::view-transition-old(root) { animation: vt-out 180ms cubic-bezier(.3,0,.8,.15) both; }
      ::view-transition-new(root) { animation: vt-in 260ms cubic-bezier(.05,.7,.1,1) both; }
      @keyframes vt-out { to   { opacity: 0; transform: translateY(-6px); } }
      @keyframes vt-in  { from { opacity: 0; transform: translateY(10px); } }
      html.vt-supported.is-enter .reveal { opacity: 1; transform: none; transition: none; } /* 交给 VT，不重播 */
    }
    /* 方案 3：默认入场 */
    html.is-enter .reveal { opacity: 0; transform: translateY(14px); }
    html.is-enter body    { opacity: 0; }
    html.is-enter.is-done .reveal { opacity: 1; transform: none;
      transition: opacity 320ms cubic-bezier(.05,.7,.1,1) calc(var(--i,0) * 50ms),
                  transform 320ms cubic-bezier(.05,.7,.1,1) calc(var(--i,0) * 50ms); }
    html.is-enter.is-done body { opacity: 1; transition: opacity 140ms ease-out; }
    html.is-first body { opacity: 1; transition: opacity 100ms ease-out; }
    html.is-restored body, html.is-restored .reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
    /* 方案 2：离场幕布（只在关键路径启用） */
    .curtain { position: fixed; inset: 0; z-index: 9999; pointer-events: none;
               background: var(--brand, #0A8064);
               clip-path: inset(0 0 100% 0);
               transition: clip-path 180ms cubic-bezier(.3,0,.8,.15); }
    html.is-curtain-on .curtain { clip-path: inset(0 0 0 0); }
    @media (prefers-reduced-motion: reduce) { .curtain { transition-duration: .01ms; } }
  </style>
</head>
<body>
  <div class="curtain" aria-hidden="true"></div>
  <main>…</main>
  <script>
    // 触发入场（先读一帧样式，保证过渡生效）
    var d = document.documentElement;
    requestAnimationFrame(function () { void document.body.offsetWidth; d.classList.add('is-done'); });
  </script>
</body>
</html>
````

---

## 7. 落地路线（建议分期，本阶段不写代码）

| 阶段 | 内容 | 产出文件（预计） | 依赖 |
|---|---|---|---|
| 第 1 期 · 配色与 token | 采用方案 A；新增 / 替换 CSS 变量；补 :focus-visible 与对比度自查 | demo/fixboxs/css/theme-fix.css | 无 |
| 第 2 期 · 入场与页面切换 | 方案 3 的 head 内联脚本 + html.is-* 规则；pageshow 复位；顶部进度条 | 各 HTML 的 head + fix.css + js/nav.js | 第 1 期 |
| 第 3 期 · 区块与组件动效 | §5.2 / §5.3 全部条目；统一 .reveal + [data-reveal-group] | fix.css + js/reveal.js（约 30 行） | 第 2 期 |
| 第 4 期 · 微交互 | §5.4；复制按钮、折叠面板、向导步骤条、Toast | fix.css + js/ui.js | 第 3 期 |
| 第 5 期 · 视觉年轻化 | 手绘涂鸦点缀（Open Doodles / Open Peeps 风格自绘 SVG）、大圆角、徽章、空状态插画 | 内联 SVG + fix.css | 第 1 期 |
| 第 6 期 · 验收 | Lighthouse 性能不降级；prefers-reduced-motion 双态截图；pageshow 后退测试；对比度复测 | 验收记录 | 全部 |

**硬性验收线**：

1. 关闭 JS 后，所有页面**内容完整可读**（渐进增强）；
2. prefers-reduced-motion: reduce 下**无任何位移 / 循环动画**，功能全部可用；
3. 浏览器后退（bfcache 命中）后**页面不残留幕布 / 不重播入场**；
4. Lighthouse Performance ≥ 90（移动端，限速 4G）；
5. 所有正文 / 链接对比度 ≥ 4.5:1（§4 已实测）。

---

## 8. 附录

### 8.1 本次抓取用到的原始 URL（可复现）

| 用途 | URL |
|---|---|
| 站点首页 | https://designbookmark.com/ |
| 分类清单（59 条，权威来源） | https://designbookmark.com/sitemaps/categories.xml |
| 静态页清单 | https://designbookmark.com/sitemaps/pages.xml |
| design 组（10 分类，已抓 9 个） | https://designbookmark.com/design/3d-motion · /color · /ui-resources · /icons · /typography · /illustrations · /inspiration · /design-systems · /design-tools · /mockups（各分类的 page/2 为 …/<slug>/page/2） |
| 顶层模板与资源（3 分类，全部已抓） | https://designbookmark.com/web-templates · /framer-templates · /figma-resources |
| media（1 分类，已抓） | https://designbookmark.com/media/audio |
| 未抓的 design/inspiration 分页 | https://designbookmark.com/design/inspiration/page/3 … /page/8（共 6 页 / 245 条，本次未抓） |

### 8.2 抓取元信息

| 项 | 值 |
|---|---|
| 抓取方式 | Invoke-WebRequest（PowerShell）逐页 GET，-UseBasicParsing，页间休眠 700ms（对站点 Crawl-delay: 10 的礼节性让步） |
| 解析方式 | 正则提取页面内 <script type="application/ld+json"> 的 CollectionPage.hasPart，ConvertFrom-Json 结构化 |
| 抓取页数 | 22 个 HTML（14 个分类，其中 8 个含 page/2） |
| 抓取条数 | 758 条（含 name / url / description 三字段） |
| HTML 原文总体积 | 约 3.9 MB（抓取期落盘到工作区临时目录，抓取完成后已清理，**未纳入仓库**） |
| 未抓 | /design/inspiration 的 page/3–8（245 条）；/sitemaps/tools.xml（工具全量清单） |

### 8.3 与既有文档的关系

| 文档 | 关系 |
|---|---|
| [pc-fixboxs.yuanabd.cn-UI参考清单（designeer选型）.md](./pc-fixboxs.yuanabd.cn-UI参考清单（designeer选型）.md) | 上一轮调研（designeer.xyz，422 条 / 17 分类），偏「用什么」；本文档偏「怎么动」，两者互补，**不替换** |
| [pc-fixboxs.yuanabd.cn-门户网站设计方案.md](./pc-fixboxs.yuanabd.cn-门户网站设计方案.md) | 视觉与交互动效落地时需回填其中 |
| [pc-fixboxs.yuanabd.cn-搜索与索引技术方案.md](./pc-fixboxs.yuanabd.cn-搜索与索引技术方案.md) | 搜索框的下拉结果动效（§5.3 C10）需与其 combobox ARIA 规格对齐 |
| [DESIGN-SYSTEM.md](../DESIGN-SYSTEM.md) | 第 1 期落地时应把 §4 的色变量与 §5.5 的动效 token 增补进去 |
| [UI-AUDIT.md](../UI-AUDIT.md) | 第 6 期验收清单可复用其方法 |

### 8.4 术语与手法速查

| 手法 | 一行写法 |
|---|---|
| 可动画渐变角度 | @property --a { syntax: "<angle>"; inherits: false; initial-value: 0deg } .box { background: linear-gradient(var(--a), c1, c2); animation: spin 6s linear infinite } @keyframes spin { to { --a: 360deg } } |
| 渐变描边光束 | conic-gradient(from var(--a), transparent 0 70%, var(--brand) 85%, transparent 100%) + 双层 mask（外框减内框） |
| 逐笔绘制 | path { pathLength: 1; stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw .6s var(--ease-out) forwards } @keyframes draw { to { stroke-dashoffset: 0 } } |
| 错峰列表 | li { animation-delay: calc(var(--i) * 50ms) }（--i 由 JS 或 :nth-child 写） |
| 高度自适应展开 | details::details-content { block-size: 0; overflow: hidden; transition: block-size .28s allow-discrete, content-visibility .28s allow-discrete } details[open]::details-content { block-size: auto }（降级：grid-template-rows: 0fr / 1fr） |
| 高度可预测的悬浮阴影 | box-shadow: 0 12px 28px -12px color-mix(in srgb, var(--brand) 32%, transparent) |
| 首访判断 | try { sessionStorage.getItem('fb-visited') } catch (e) {}（内联在 head） |
| 只动合成属性 | 只写 transform / opacity；不要写 width / height / top / left / margin |

---

*本文档由素材调研产出，不含实现代码；所有条目名、链接、分类名与一句话简介均来自 designbookmark.com 的真实抓取（sitemap + 分类页 JSON-LD），抓取不了的已在 §1.3 明示。*
