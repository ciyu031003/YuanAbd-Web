# YuanAbd-Web · 改动记录与下一步待办

> 本文档面向**新会话快速接手**：先读「项目速览」与「工作约定」，再按需查「改动时间线」与「下一轮实施方案」。
> 最后更新：2026-09-06

---

## 一、项目速览（新会话必读）

一台腾讯云服务器（ssh 别名 `travel-notes`，IP 106.55.2.197，Ubuntu + nginx 1.24 + Docker）跑三个站点：

| 站点 | 品牌 | 本地文件（`demo/`） | 服务器路径 | 后端 |
|---|---|---|---|---|
| www.yuanabd.cn | YUAN.ABD 工作室门户 | `index.html`（内联 CSS/JS 单文件） | `/var/www/yuanabd/` | 无（纯静态） |
| learn.yuanabd.cn | **苦旅 KuLv**（学习工作台） | `learn.html` + `download.html` + `css/learn.css` + `css/learn-sunny.css` + `js/learn.js` + `js/project.js` | `/var/www/learn-landing/` | Docker :3001 + PostgreSQL |
| travel-notes.yuanabd.cn | **甜途 TianTu**（旅行 App，原"行迹"） | `travel.html` + `css/travel*.css` + `js/travel-*.js` 等 | `/var/www/travel-landing/` | Docker :3000 + MySQL |

- 本地预览：`cd demo && node serve.cjs` → http://localhost:8080（若报 EADDRINUSE 说明旧进程还在服务，可直接用）
- GitHub：`github.com/ciyu031003/YuanAbd-Web`（remote 用 SSH；HTTPS/SSH 偶发被网络重置，重试即可）
- git 仓库 = 部署源头；**不要在服务器上直接改文件**（Codex 曾这样改过，后来已同步回仓库）

### 工作约定（踩过的坑，务必遵守）

1. **缓存版本号**：`learn.html`/`travel.html` 引用的 `learn-sunny.css`、`travel-sunny.css`、`travel-*.js` 都带 `?v=` 参数。**凡修改了这些 css/js 的内容，必须同步 bump HTML 里的 `?v=`**（已踩坑两次，最新版本：sunny `20260905e`、travel js `20260905`）。门户 `index.html` 是内联单文件 + nginx no-cache，无此问题。
2. 部署用 `scp` 逐文件上传（见上表路径）；`travel-gallery.js`、`project.js` 这类**无版本号的引用**改动后尤其要记得 bump 或确认。
3. 全部动效必须支持 `prefers-reduced-motion` 降级。
4. 平滑滚动：门户与 learn 用 Lenis（`vendor/lenis/lenis.min.js`，实例挂 `window.__lenis`）；**甜途站有意不接 Lenis**（3D 画廊自带动效驱动，避免冲突）。
5. 品牌名规范：中文品牌名 **苦旅**（英文 KuLv）/ **甜途**（英文 TianTu）；"学习工作台/旅行记忆空间"只作品类描述用语。域名 `travel-notes.yuanabd.cn`、APK 文件名 `tiantu.apk` 保持不变。
6. GitHub 链接统一指向 `github.com/yuanabd`（用户指定的个人账号，勿改具体仓库）。

### 品牌视觉规范

- **甜途**（logo `img/tiantu-logo.png`，512/180/64 三尺寸）：品牌三色 紫 `#A487BF` / 深蓝 `#4E4D93` / 珊瑚 `#F88D82`，渐变 `linear-gradient(120deg, 紫, 深蓝 52%, 珊瑚)`，CSS 变量 `--tu-*`（见 `travel-sunny.css` 末尾）。已应用：登录按钮、HUD 激活圆点、章节标签镂字、滚动进度条。
- **苦旅**（logo `img/kulv-logo.png`，512/180/64）：橙 + 深蓝书本 + 上升箭头；品牌寓意文案：**"学习之路虽苦，行则将至"**（已落位 learn 浏览器标题与页脚）。
- **门户**：暖白阳光主题（`--bg:#FFFDF7` + 巨型太阳 `--sun:#FFD84D`），章节色：苦旅=蓝（`#79CFFF/#4B8FCC`）、甜途=琥珀珊瑚（`#FF9278/#F88D82`）。

---

## 二、改动时间线

### 2026-11-24 修盒子评审轮：Web 与后台代码/UI 评审修复 + 重新部署

> 在 11-23 三线优化之后做的一轮「评审 → 修复 → 复验 → 上线」。

**Web 前台（build-fix.cjs + demo/fixboxs）**
- P0 安全：修复搜索页反射型 XSS（risk/domain/os 参数直接进 innerHTML）；构建期图片 src 属性未转义（协议白名单 + escAttr）。
- P0 可用性：无 JS / 主 JS 失败时加载层永久遮罩 → noscript 隐藏 + 2.4–2.8s 自动兜底动画；列表页补 noscript 纯链接列表（browse 98 条）。
- P1：首页恢复桌面/移动导航与抽屉；搜索表单提交链路修正（不再跳 index.html?q=）；表格窄屏逐字竖排改横滚；拟态皮肤全站常驻；JS 渲染统一转义；向导动态进度与焦点；tools 补回转场脚本；搜索建议面板定位。
- P2：死代码清理、重复分隔合并、对比度全部 ≥AA、粗指针 44px 热区、滚动节流、抽屉焦点环、SEO（canonical/OG/Twitter/JSON-LD url）、320px 细节。
- 验收：40 组视口×页面无横向溢出、0 控制台错误、注入探针不执行、构建/校验/测试全通过。

**内容后台（admin）**
- P0：发布只改 DB 不搬 `_drafts` 文件（现在统一在 applyStatusTransition 内 move 到构建目录）；编辑器页嵌套 form（评论提交错路由）；状态真源改为 DB（已发布文章重新提审不再矛盾）。
- P1：状态下拉可绕过审核写盘、列表错误无出口、窄屏栅格被裁、表格列锁死/按钮压日期、登录页 div 未闭合、表单控件缺可访问名称、内联 onclick 被 CSP 拦（复制/改 alt 死按钮）、javascript: 外链、预览 srcdoc 同源风险、审核台权限与 ARIA、畸形 Cookie/表单 500、发布通道关闭仍入队、视图删除与邀请撤销无入口。
- P2：auth.can 请求级缓存、listAll 1.5s 缓存、搜索索引复用、命令面板权限过滤、页码/排序白名单、taxonomy 读取兜底、邮件 HTML 转义、preview.cjs 加固。
- 测试从 7 组扩到 40 组（状态机、withQuery、文件移动、转义、结构、权限文案、边界）。
- 验收：24 个文件语法通过；28 预览页 1440/1024/768/390 无页面级溢出；暗色 3 页核查；注入审计 18 页 × 3 类载荷干净。

**上线**
- 前台：git push → 服务器 `git pull --ff-only` → 容器内 `build-fix.cjs` + `deploy-fixboxs.cjs` → tar → 宿主 `fixboxs-deploy.sh`（原子切换 + 103 URL 全量校验）。
- 后台：`admin/` 镜像重建（新增 ui-v3.css / cmdk.js / workflow.cjs）→ `docker compose up -d`。
- 部署后校验脚本覆盖：站点首页/文章页（FAQ、JSON-LD）/领域页/搜索页/articles.js、后台 healthz/登录页（v3 样式）/未登录路由 302/静态脚本/安全头。
- 部署结果（2026-11-24 01:48）：前台 `SWITCH_OK files=185`，线上 `VERIFY_OK checked=103`；后台镜像重建并 `Up (healthy)`；部署后独立校验 25 项全通过（首页/文章页 FAQ/JSON-LD/领域页/搜索/articles.js/healthz/登录页 v3/未登录路由 302/cmdk.js/安全头）。
- 运维备注：服务器到 GitHub 的 HTTPS 偶发不可达，本次通过 `git bundle` 传输提交（服务器 HEAD `8c19d81` 与 GitHub main 一致）；`/srv/fixboxs/repo/dist/fixboxs` 目录曾为 root 所有导致 `deploy-fixboxs.cjs` EACCES，已 `chown -R ubuntu:ubuntu dist` 修正。


### 2026-11-23 修盒子三线优化：文章内容 · Web 前台 · 内容后台 UI

> 本轮不动门户/苦旅/甜途，只改修盒子（内容 + 前台 + 后台）。

**1) 文章内容（96 篇 · 两批并行）**
- 每篇新增 §常见问题`（3–4 组，基于正文既有事实与常见误操作；不编造系统行为、成功率与外部链接）。共计 383 组问答。
- 10 篇 `sop-*` 第三方运维参考不套故障教程骨架，改写「快速概览」首段（什么时候用这份 SOP / 看完能得到什么），FAQ 放在「仍需帮助」之前。
- 补齐 `symptoms/keywords/aliases` 数量达标；核对 `related` 无悬空、无重复；收紧 2 篇过长标题（slug 未动）。
- `updated/reviewed_at` → 2026-11-23，`version` 次版本 +1；清理「九成 / 一定 / 100%」类承诺表述。
- 校验：`content-lint` 96 篇 0 error / 0 warning；`fx-frontmatter.test` 1495 断言通过。

**2) Web 前台（`demo/fixboxs/` + `build-fix.cjs` 模板）**
- 口径统一（P0）：领域数/文章数/最近更新全部由 `content/taxonomy.json` + 构建结果派生（13 领域 = 12 故障 + 1 参考 · 96 篇），页脚/侧栏/JSON-LD/静态页计数同源；`build-fix.cjs --check` 会校验口径漂移。
- 文章页：正文 68ch / 行高 1.88、TOC scrollspy、代码块复制、步骤勾选与 localStorage 进度、图片灯箱、相关教程卡片、同领域上一篇/下一篇、打印样式；表格窄屏横滚。
- 栏目页：`browse` 改吸顶领域条 + 紧凑索引行；`search` 加高亮/结果计数/键盘上下选择/系统·领域·风险筛选/空态出口，修复纯拉丁乱码命中全库的检索 bug；`wizard` 固定分母进度 + 返回清理；`tools` 命令统一复制并标注「需要管理员权限」。
- 无障碍与移动端：每页 1 个 h1、焦点环、aria-current/aria-live、触控 ≥44px、320–1440 无横向溢出、reduced-motion 全保留。
- 交付文档：`docs/修盒子-前端展示优化-20261123.md`。

**3) 内容后台（`admin/`）**
- 设计语言 v3：新增 `admin/src/ui-v3.css` 覆盖层，从整屏新拟物改为「暖纸底 + 白卡 + 细边」的结构化界面；暗色模式与窄屏同步适配。
- 信息架构：侧栏按「写作 / 协作 / 管理」分组，新增**审核台**与**数据分析**两个页面，顶部条新增 `Ctrl/⌘+K` 命令面板（文章标题/slug/关键词/症状/别名 + 页面跳转）。
- 工作台重排：首屏「今日待办」（待审 / 退回 / 草稿 / 缺来源）→ 总览横幅 → 领域分布（横向条）/ 状态构成 / 更新热力 / 发布节奏 → 反馈摘要 → 最近编辑与陈旧内容。
- 审核台 `/review`：左队列 + 右全文（iframe 复用 `build-fix.cjs` 在线渲染，单独 CSP 放行站点域名）+ 检查清单 + 常驻结论条；新增 `POST /review/decision`，通过与退回复用同一套状态机，退回意见写成文章评论。
- 编辑器：Markdown 工具条与快捷键、图片上传后**直接插入 Markdown**（新媒体上传 JSON 模式）、保存状态位、吸顶操作条。
- 其它：登录页去装饰并修复标签叠字；表格按用途分层；移动端侧栏转横向滚动；`/api/search`；侧栏徽章计数带 5s 缓存；后台测试补充新页面断言。
- 本地看版式：`node admin/tools/preview.cjs`（无需数据库，14 个页面，3025 端口）。
- 交付文档：`docs/修盒子-内容后台-UI优化-20261123.md`（docs/ 按约定不入库，本地留存）。

### 2026-10-17 门户接入「修盒子 FIXBOX」子站入口
> 子站 https://pc-fixboxs.yuanabd.cn/（12 类电脑/网络故障自助排障手册）此前未在主站露出。
> 按要求「现有菜单项之间 / 卡片列表末尾 / 页脚站点导航」三处补齐，风格沿用门户既有语法。

- **导航**：胶囊内新增 `FIXBOX`（锚到首页 `#fixbox` 章节，与 LEARN/TRAVEL/STUDIO/NOW 同构）；
  移动端汉堡菜单同步出现。右上 CTA 文案 两件作品 → **三件作品**在线
- **首页新增 03 修盒子章节**（`#fixbox`）：章节序 01 苦旅 / 02 甜途 / **03 修盒子**。
  左栏＝chip + 产品名 + 一句话 + 12 个领域标签墙 + 三步说明 + 4 个标签 + 「前往使用 / 搜索故障现象」；
  右栏＝纯 CSS 排障终端示意（搜索现象 → STEP 01/02 → 验收清单）+ 浮动「12 DOMAINS」徽章。
  **主 CTA「前往使用」跳子站首页**，不新增位图资源
- **页脚**：产品卡三列（新增 `fcard--fix`，薄荷字标「修」）；站点导航新增「修盒子 - 电脑排障手册」
- **Hero**：副文案与 badge 改为三件作品，主 CTA 旁新增次级「打开修盒子」
- **外链规范**：全站 16 处外链统一 `target="_blank" rel="noopener noreferrer"`
  （原有 9 处只写了 `rel="noopener"`，一并升级）
- **配色与可达性**：章节色用薄荷 `--mint` 作装饰；文本级新增局部变量 `--fx-mint-ink:#0F7A57`
  —— 实测 `--c-mint-600(#1FA97C)` 在暖白底仅 **2.94:1** 不达 AA，深阶后 **5.24:1** 通过
- **文案一致性**：meta/OG/JSON-LD（新增 WebApplication 节点）、credo「02→3 在营产品」、
  now 章节标题与列表、ncard 计数同步为三件作品；`og-cover.jpg` 重绘为三卡版
- **构建脚本**：`build-portal.cjs` 新增 `@inline:portal` 块（源文件 `demo/index-portal.css`），
  并修复**重复内联 bug** —— 原实现 `html.slice(j)` 保留了配对起始标记，
  第二次构建会把 `tokens` 块再内联一遍（产物里 tokens 曾出现两份）。现改取 `lastIndexOf` + 幂等重建

### 2026-09-05（第一轮）评审 + 门户 v2 重构（深色版，已被 v3 取代）
- 修复本地/服务器版本漂移（P0）：把服务器 9/2 的改动拉回本地，git 建仓推 GitHub
- 门户以参考站（alethia/voiceflow/lamossa/riotters）设计语言重构（深色沉浸 + 双章节叙事）
- nginx 加固：全站 HTTP/2、HSTS、安全头、全局 gzip、静态 30d 缓存、`.bak` 屏蔽；robots.txt/sitemap.xml 三站补齐
- 清理服务器 web 根下 12 个泄露源码的 `.bak` 文件（移至 `/var/www/backups/`）

### 2026-09-05（Codex 接手，第三方改动，已并入仓库）
- 门户 v3：深色 → 暖白阳光主题 + 巨型太阳，新增 `build`（构建方式四卡）与 `now`（正在发生）章节
- learn 重做：五本立体书 hero + "招花"职位数据带 + 闭环卡
- travel：保留 3D 画廊，新增 worldband 足迹带、城市故事、胶片记忆等区块

### 2026-09-05（第二轮）三优先级修复 + 动效骨架 + 打磨
- P0/P1 修复：travel 移动端 hero 玻璃衬底 + 下载卡防竖排 + 假 ".exe 桌面端"文案改为真实 "甜途 App · APK 直装"；learn hero 副标题遮挡 + footer 下载入口恢复 + 尾部空白；门户 credo/now 对比度与断行
- 动效骨架：门户/learn 接入 Lenis；逐字入场（渐变字拆字后需继承 `background-clip`，否则隐形——已修）；数字计数（Codex 已有，保留）
- 打磨：卡片 3D 倾斜 hover（26 张）、太阳光晕收敛、章节编号描边填充、移动端汉堡菜单

### 2026-09-05（第三轮）品牌更名：行迹 → 甜途 + 甜途 logo
- travel 站 28 处更名（英文副标 Travel Notes → TianTu）、门户 14 处、learn footer 链接、5 个 JS 文件
- 甜途 logo 裁剪去水印 + 圆角，三尺寸集成（favicon/apple-touch-icon/nav 品牌区/门户 footer 卡）
- 新增：三站滚动进度条、门户+甜途回到顶部按钮；marquee 城市数修正 6→7

### 2026-09-05（第四轮）九项增强
1. 甜途品牌色延伸（logo 取色三色渐变：登录按钮/HUD 圆点/章节标签/进度条）
2. 门户 hero 打字机数据行（三条轮换：kulv/甜途/坐标，逐字打出 + 光标闪烁）
3. 门户 marquee 双向车道（两行反向，第二行产品能力文案）
4. 回顶按钮环形进度（SVG stroke-dashoffset，门户 + 甜途）
5. learn 书册点击翻页（3D rotateY + 封面高光扫过，不阻塞详情面板）
6. 甜途 3D 画廊拖拽旋转（水平拖动映射滚动，轴向锁定 + `touch-action:pan-y` 保留移动端竖滚，带惯性衰减）
7. 甜途 HUD 城市名滑入（MutationObserver 驱动，不侵入 3D 逻辑）
8. lazy loading 三站审计（全覆盖确认）
9. GitHub 链接确认统一 `github.com/yuanabd`
- 部署坑：travel-gallery.js 无版本号被缓存导致 HUD 仍显示旧名 → 加 `?v=20260905`；sunny.css 两次内容更新忘 bump → 已 bump 至 `20260905e`

### 2026-09-06（第五轮，本次）品牌更名：学习工作台 → 苦旅 + 清理
- 苦旅 logo 裁剪（1510×1204 原图 → 书本主体正方形）三尺寸；learn favicon/apple-touch-icon 替换；nav 品牌区 logo + "苦旅"
- learn 站 12 处更名：title（含寓意"学习之路虽苦，行则将至"）/meta/OG/hero kicker（KULV · 苦旅）/aria/app 模拟区/footer
- 门户 13 处联动：01 章节标题"苦旅"、`Product · KuLv · Learn-Workbench` 标签、mock aria、credo、now 列表、footer 卡（加 logo + `KU LV` 标注，与甜途卡对称）、marquee `苦旅 KULV · LIVE`、打字机行 `kulv v1.0.0`
- 清理未引用文件：`favicon-travel.svg`、`favicon-learn.svg`、`img/app-icon.png`（download.html 已改用苦旅 favicon）、`served-stack.js`、`_sheet.html`；服务器门户 `vendor/three`（1.3MB 未引用）与 home 目录部署日志
- 门户 HTML 已设 nginx no-cache（`location = /` + expires -1）

### 2026-09-06（第六轮）业务数据迁移至 COS 存储桶（/data）
- 服务器挂载了腾讯云 COS（cosfs FUSE，256T）到 `/data`
- **已迁移**：甜途用户上传卷 `travel-notes_uploads-data`（218M，232 文件）→ `/data/travel-notes/uploads`；learn 必应壁纸卷 `learn-workbench_bing`（7M）→ `/data/learn-workbench/bing`
- compose 修改：甜途 `uploads-data:/app/public/uploads` → `/data/travel-notes/uploads:/app/public/uploads`；learn `bing:` → `/data/learn-workbench/bing:...`；两个 compose 的顶级 volumes 声明同步删除（travel 只剩 `mysql-data`、learn 只剩 `pgdata`）
- 两容器 `docker compose up -d` 重建，数据库容器未动（Up 2 weeks 连续运行）
- 验证：232 文件 md5 抽样一致；线上上传图 URL 200（cosfs 读取 0.65s/556KB）；容器向 cosfs 写入成功（上传功能可用）；三站 200
- ⚠️ **数据库卷刻意不迁**：MySQL/PG 依赖随机写/文件锁/rename 原子性，cosfs 对象存储语义会损坏数据——`travel-notes_mysql-data`、`learn-workbench_pgdata` 保留系统盘
- ⚠️ 旧命名卷 `travel-notes_uploads-data`、`learn-workbench_bing` **保留未删**（回滚备份，稳定 1-2 周后可 `docker volume rm` 清理）
- 可选后续优化：nginx 直接 alias `/data/travel-notes/uploads`（跳过 app 容器反代，静态图更快）；cosfs 大目录列表慢，若相册数暴涨考虑分目录

### 2026-09-06（第七轮）推荐方案优化：3D 画廊 A1-A7 + nginx 直返 + SEO
- **nginx**：`location ^~ /uploads/` alias `/data/travel-notes/uploads`（cosfs 静态直返，单图 0.65s→0.15s）。坑：必须用 `^~`，否则被 `\.(jpg...)$` 正则缓存 location 抢占
- **3D 画廊**（travel-gallery.js）：
  - A1 贴图换 `*-900.webp`（2.3MB→0.5MB）+ 纹理 onLoad 淡入防首帧空白（`texReady[]` 标记）
  - A2 大号城市名浮层 `.stage__cityname`（衬线大字 + 品牌渐变下划线 + 玻璃底，`is-on` 随 currentP>0.06 出现，文本变化滑入）
  - A3 正前方卡片品牌三色渐变描边（`makeRoundBorder` CanvasTexture，borders[] 随 falloff 淡入）
  - A4 卡片倒影（`makeMirrorMask` 渐隐翻转 mask，mirrors[] 贴卡片下方）
  - A5 移动端降级：dpr≤1.5、粒子 120、关 antialias
  - A7 旋转 lerp 0.09（currentRot → scrollRot 插值）
  - A6 点击画廊跳 `#stories`（pointer 位移 >8px 视为拖拽不触发）
- **SEO**：C1 OG 分享图（`og-card.html` 1200×630 渲染截图 → `img/og-cover.jpg` 54KB，三站 og:image/twitter:image 指向门户绝对 URL）；C2 JSON-LD（门户 Organization+WebSite、甜途 MobileApplication、苦旅 WebApplication）
- **清理**：7 张城市 jpg 原图 + product-features/product-map-large PNG fallback 删除（img/ 12M→6.3M；travel.html 的 png src 已换 webp）
- 部署版本号：travel-gallery.js / travel-sunny.css → `?v=20260906`
- 注意：`og-card.html` 是生成工具页，部署时不需要上传；改分享图时本地渲染重截即可

### 2026-09-06（第八轮）可靠性/运维加固轮
- **数据库每日自动备份**：`/usr/local/bin/backup-db.sh`（容器内 mysqldump/pg_dump → `/data/backups/{travel-notes,learn-workbench}/`，gzip，保留 14 天）；cron `17 3 * * *`（错开已有 04:30/06:00/08:00 任务）；已实测 gzip 完整性（mysql 31K / pg 929K）
- **Docker 日志轮转**：`/etc/docker/daemon.json` 加 `log-driver json-file / max-size 10m / max-file 3`（保留原有腾讯云 mirror 配置）；两个 compose 显式加 `logging` 段（travel 用 YAML 锚点 `&logging/*logging`，db+app 共用）——学习站 compose 曾插入重复键报错，已修复
- **ufw 防火墙双保险**：先放行 22/80/443/8443 再 `--force enable`；外网验证三站 + 上传图 + App API 全部 200，SSH 不断
- **certbot timer 确认正常**（三证 11 月底到期，自动续期在位）
- **磁盘**：Build Cache 10GB 为活跃镜像层（0% 可回收，prune 无效）；数据库容器随 logging 重建（数据卷完好，healthcheck healthy）
- 本地：`.threeui/`（5MB 设计草稿）删除；门户 Email 链接加 `title` 提示
- 招花抓取 cron（08:00）与磁盘清理 cron（learn 周日 05:00 / travel 周日 04:30）均为既有任务，本次未改动

---

## 三、下一轮实施方案（待办，按建议顺序）

### A. 甜途门户 3D 旋转画廊优化（用户点名重点）
源码：`js/travel-gallery.js`（Three.js 环形阵列 RING_R=9、7 卡、高斯衰减聚焦 MAX_SCALE 1.34 + PUSH 2.7、240 粒子、DOM fallback 保底、可见性管理完善）

| # | 项 | 方案 | 成本 |
|---|---|---|---|
| A1 | 贴图瘦身 | `images` 数组改用 `*-900.webp`（总 2.3MB → 0.5MB，降 75%），纹理加载完成淡入消除首帧空白 | 极低 |
| A2 | 大号城市名浮层 | 正前方卡片下方衬线大字城市名 + 品牌渐变下划线，随帧切换滑入（放大版 hud-swap 动画） | 低 |
| A3 | 正前方卡片品牌描边 | 叠加圆角描边 plane，品牌三色渐变（CanvasTexture 画边框），正前方淡入 | 中 |
| A4 | 卡片倒影 | 正前方卡片下方翻转渐变倒影平面（opacity 0.15 + 渐隐 mask） | 中 |
| A5 | 移动端降级 | dpr>1.5 时 pixelRatio 1.5、粒子 240→120、antialias 关 | 低 |
| A6 | 点击卡片联动城市故事 | 点击正前方卡片平滑滚动到 `#stories` 对应故事卡（三城已有故事） | 低 |
| A7 | 旋转 lerp 平滑 | 目标角与当前角 0.08 插值，消除滚轮步进感 | 低 |

### B. 可删清单（剩余）
- `img/*.jpg` 7 张（356-859KB，webp 已全覆盖引用，确认后删，省 ~4MB）
- `img/product-features.png` / `product-map-large.png`（PNG fallback，2026 年可直接 webp 作 src）
- 本地 `.threeui/`（5MB 设计草稿，已在 gitignore，可磁盘归档删除）

### C. 可增清单
1. **OG 分享图**：三站 og:image 全缺失。做法：写一个 1200×630 的 `og-card.html`（品牌排版）→ 浏览器渲染截图存 `img/og-cover.png` → 三站 `<meta property="og:image">` 引用
2. **JSON-LD 结构化数据**：门户 `Organization`+`WebSite`；甜途/苦旅 `SoftwareApplication`（operatingSystem、offers ¥0）→ 搜索富摘要
3. 门户 footer Email 链接（`mailto:hi@yuanabd.cn`，已确认有效）可加 `title` 提示

**建议实施顺序**：A1 → A2 + A7 → A5 → C1 + C2 → A3 → A4 → A6 → B

---

## 四、快速操作备忘

```bash
# 本地预览
cd demo && node serve.cjs        # http://localhost:8080

# 部署（逐文件 scp；改了哪个传哪个）
scp demo/index.html travel-notes:/var/www/yuanabd/index.html
scp demo/travel.html travel-notes:/var/www/travel-landing/travel.html
scp demo/css/travel-sunny.css travel-notes:/var/www/travel-landing/css/
scp demo/learn.html travel-notes:/var/www/learn-landing/learn.html
scp demo/css/learn-sunny.css travel-notes:/var/www/learn-landing/css/
# 记得同步 bump HTML 里的 ?v= 版本号！

# nginx 配置备份位置（服务器）
/var/www/backups/nginx-20260903/     # 含 20260903 后的历次备份
```
