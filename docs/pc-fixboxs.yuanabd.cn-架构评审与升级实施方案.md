# pc-fixboxs.yuanabd.cn · 架构评审与升级实施方案

| 项 | 值 |
|---|---|
| 文档版本 | v1.0（评审草稿） |
| 日期 | 2026-10-12 |
| 状态 | 草稿 · 待项目负责人评审 |
| 涉及域名 | https://pc-fixboxs.yuanabd.cn/ |
| 评审对象 | 《修盒子（PC-FixBox）全方位升级优化实施方案 V1.0》（外部顾问 ChatGPT，1274 行） |
| 评审方式 | 逐条对照仓库真实文件 + 线上 http 抓取验证（非文档臆断） |
| 仓库 | `F:\CodeFiles\YuanAbd-Web`（git 仓库，remote `github.com/ciyu031003/YuanAbd-Web`） |
| 评审员 | 架构评审员（本会话） |

> **阅读约定**
> - 「现状判定」四档：**已实现** / **部分实现** / **未实现** / **不适用**。
> - 每条判定都给出**依据**（文件路径+行号，或线上验证结果）。无法核实的写「未核实」。
> - 本文所有"现状"结论均可复现，复现命令见 §2.4。

---

## 0. 执行摘要（TL;DR）

### 0.1 一句话结论

外部方案是一份**合格的通用 CMS 建设指南**，但它**默认项目存在后端、数据库、ORM 与认证体系**——而修盒子是**零依赖纯静态站**，这两者之间存在根本性错配。方案自己也声明「未经审计不得直接推翻现有架构」（原文 L14、L396），本评审就是补上这份审计。结论是：**方案中约 78% 的篇幅（后台/数据库/权限/上传/备份/审计）对本站一次也不适用或需要彻底改写；但其中约 6 条建议切中了本站真实的结构性短板，值得优先采纳。**

### 0.2 关键数字

| 指标 | 实测值 | 来源 |
|---|---|---|
| 教程数 | 30 篇 | `content/fixboxs/*.md` 计数 |
| 内容总字数 | 394 KB（均 13.1 KB/篇） | PowerShell `Measure-Object` |
| 站点壳页 | 6 个（index/browse/search/wizard/tools/about） | `demo/fixboxs/*.html` |
| 构建脚本 | 2 个（`build-fix.cjs` 378 行 + `deploy-fixboxs.cjs` 101 行） | 文件读取 |
| 运行时脚本 | 1 个（`js/fix.js` 626 行） | 文件读取 |
| npm 依赖 | **0**（无 `package.json`、无 `node_modules`） | `glob package.json` → 空 |
| 数据库 | **0** | 全仓无 DB 连接代码 |
| 后端进程 | **0**（nginx 直接托管静态文件） | `nginx-fixboxs.conf` L5-33 |
| 首屏搜索索引 | `data/articles.js` 36.2 KB 未压缩、**全量同步加载** | `dist/fixboxs/data/articles.js` |
| dist 产物 | 42 文件 / 1013.6 KB | PowerShell 统计 |
| `robots.txt` | **HTTP 404** | `web_fetch` |
| `sitemap.xml` | **HTTP 404** | `web_fetch` |
| canonical / og / JSON-LD | **全部缺失**（首页、教程页、搜索页、领域页均无） | `web_fetch` + 正则检测 |
| 统计脚本 | 无（README L84 明确「无统计脚本」） | README + 抓取 |

### 0.3 五条关键结论

1. **架构错配是首要问题。** 方案 P1「基础后台与内容管理闭环」要求引入 API、数据库、RBAC、文件持久化——这与本站「零依赖纯静态 + 整目录 scp」的硬约束（`deploy-fixboxs.sh` L16-51）**正面冲突**。若照做，等于新建一个全栈系统，成本远超方案估算的 5–10 人日。
2. **真正被方案说中、且本站确实没做的，是这 6 件事**：`robots.txt`、`sitemap.xml`、结构化数据（JSON-LD）、搜索升级为预构建分片倒排索引、分类聚合页、搜索埋点。这些全部可以用现有零依赖范式落地，**合计 8–14 人日**即可补齐，收益远高于建后台。
3. **本站已有大量方案以为是"待做"的东西。** front-matter 19 个字段全站 100% 覆盖、风险分级、验证时间、来源引用、相关文章、步骤勾选、症状向导、`prefers-reduced-motion`——方案的「文章质量规范」「文章元数据」「故障自查」等章节，本站**已经实现或已超纲**。
4. **发现一个方案和现有设计文档都没提的真实缺陷**：`build-fix.cjs` 构造 `articles.js` 时**丢弃了 `aliases` 字段**（另有 `sources/prerequisites/tools/reviewer/related/version` 也被丢弃）。而 `aliases` 正是《搜索与索引技术方案》§3.5 认定的口语召回主力。这是**当前线上搜索质量的一个可量化漏洞**，属于本评审新发现。
5. **建议路线：否决方案的「建后台」主线，改走「静态内容管线增强」。** 内容工作流用 **Git + Markdown + 校验脚本**替代 CMS；后台的诉求（草稿/审核/发布/权限/版本）由 Git 的 branch / PR / review / history 天然承担。只有在"必须非技术人员网页发稿"成为硬需求时，才评估方案路线 B（独立 CMS）。

---

## 1. 外部方案逐条评审表

> 编号规则：`章节号-序号`，与原文段落对应。判定依据全部指向真实文件或线上验证。

### 1.1 第一部分：产品定位与总体目标（原文 L31-126）

| 编号 | 建议要点 | 现状判定 | 依据（文件/行号/线上证据） | 建议动作 |
|---|---|---|---|---|
| 1.1-1 | 定位为「电脑故障自查与知识服务平台」，三部分：前台 / 管理后台 / 结构化知识引擎 | **部分实现** | 前台已完整落地（6 壳页 + 30 教程）；管理后台**不存在**；结构化知识引擎**部分存在**——front-matter 已有 domain/category/os/risk/symptoms 等结构化字段（`content/fixboxs/wifi-connected-but-no-internet.md` L1-31），但无错误代码库、无诊断规则表 | 认可定位；**管理后台降级为「Git 工作流」**，知识引擎按 §3.4 做纯静态扩展 |
| 1.1-2 | 10 条核心原则（先审计、保留资产、内容与代码分离、发布流程可控等） | **部分实现** | 「先审计」✅ 有 5 份设计文档（`docs/`）；「保留资产」✅ 无破坏性重构；「内容与代码分离」**部分**——内容已在 `content/*.md` 与展示分离，但**分类字典仍硬编码在构建脚本**（`build-fix.cjs` L22-40 `DOMAINS`/`CATS`）；「发布流程可控」❌ 无草稿/审核状态；「权限后端校验」❌ 无权限体系；「安全可恢复」✅ `deploy-fixboxs.sh` L42-49 有 `.prev` 原子切换 | 采纳原则；**将 DOMAINS/CATS 外置为数据文件**（§4.3），这是"内容与代码分离"唯一未落实处 |
| 1.1-3 | 「所有数据真实可追溯」，统计来自真实业务数据 | **不适用（当前）** | 本站无后台、无统计脚本（`demo/fixboxs/README.md` L84「无统计脚本」）；线上抓取 4 个页面均无任何 analytics 代码 | 本站无"数据"可造；此项针对有后台场景。若要埋点见 §5.3 P1-4，但需先解决隐私声明 |

### 1.2 第二部分：管理后台设计（原文 L130-368）

| 编号 | 建议要点 | 现状判定 | 依据 | 建议动作 |
|---|---|---|---|---|
| 1.2-1 | 后台信息架构：8 个一级菜单（工作台/内容/素材/知识体系/审核/用户/反馈/设置） | **不适用** | 全仓无 admin 路由、无后台目录；`nginx-fixboxs.conf` L11-33 只有静态文件 location | **不采纳**。凭本站规模（30 篇、个人维护），8 菜单后台是过度设计 |
| 1.2-2 | 后台首页统计（文章总数/草稿/待审核/最近更新等） | **部分实现（换载体）** | 「文章总数」已实现：`index.html` 有 `data-fx-count-all`，由 `fix.js` L381 填充；「最近更新」已实现：`fix.js` L370 `mode==="new"` 按 `updated` 排序。其余（草稿/待审核）无状态模型故无 | 采纳「真实统计」精神 → 用**构建期产出的 `stats.json`** 承担（§4.4） |
| 1.2-3 | 文章列表：检索/筛选/排序/分页/批量操作/软删除 | **部分实现** | 前台已实现：检索（`fix.js` L155 `search()`）、系统筛选（L284 `osGroup`）、风险筛选（L285）、排序（L171 按 score+hot）。**无分页**（L172 `slice(0, limit)` 一次出 100 条）、**无批量操作**（无写能力） | 前台无需批量操作；**建议加分页或虚拟滚动**（P2，30 篇不紧急） |
| 1.2-4 | Markdown 编辑器 + 实时预览 + 组件（步骤/警告/代码块） | **部分实现（组件已全）** | **渲染端全部实现**：代码块+复制（`build-fix.cjs` L136-138）、危险命令识别（L135）、风险 callout 三色（L151-154）、步骤组件（L203-223）、任务清单（L184-187）、表格（L116-124）。**编辑器不存在**——目前编辑=改 `.md` 文件 | 编辑器**不做**；渲染端已达标，**补 `sources` 渲染**（见 §2.2 缺陷 D4） |
| 1.2-5 | 教程固定模板（11 段：适用范围/现象/原因/准备/步骤/验证/未解决/风险/参考/验证信息） | **已实现（已超纲）** | 30/30 篇含固定 10 段：`一句话结论`30、`30 秒快速排查`30、`适用 / 不适用`30、`开始前确认`30、`分步骤`30、`怎么确认修好了`29、`还是不行？`30、`预防`30、`相关教程`30、`更新日志`30 | **无需动作**。方案模板的"可能原因/风险与回退"已由 callout + `还是不行？`覆盖 |
| 1.2-6 | 内容状态机：DRAFT/IN_REVIEW/CHANGES_REQUESTED/SCHEDULED/PUBLISHED/UNPUBLISHED/ARCHIVED | **未实现** | front-matter 无 `status` 字段（19 个字段中无状态项）；构建脚本无状态过滤 | **改用 Git 承担**：branch=草稿，PR=审核，merge=发布，`git revert`=回滚，tag=归档。见 §4.5 |
| 1.2-7 | 四角色 RBAC（管理员/编辑/审核/贡献者）+ 后端校验 | **不适用** | 无用户表、无登录、无 session；`nginx-fixboxs.conf` 无 auth 指令 | **不采纳**。单人/小团队项目，Git 的 commit 权限即 RBAC |
| 1.2-8 | 账号启用停用、密码重置、登录失败限制、会话过期、审计 | **不适用** | 同上，无认证体系 | **不采纳** |

### 1.3 第三部分：文档、图片与附件中心（原文 L372-462）

| 编号 | 建议要点 | 现状判定 | 依据 | 建议动作 |
|---|---|---|---|---|
| 1.3-1 | 方式 A：在线创建文章 | **不适用** | 无编辑器、无后端 | 不采纳；改「本地写 md → 构建」 |
| 1.3-2 | 方式 B：上传已有文档（md/txt/pdf/图片） | **部分实现** | Markdown 导入 ✅（就是现有流程）；**图片/PDF 上传无**——教程目前无图片资源，全站图片仅 logo/favicon | 「Markdown 导入」已是现状；图片能力见 §3.4 静态方案 |
| 1.3-3 | 方式 C：ZIP 批量导入（含压缩炸弹/路径穿越防护） | **不适用** | 无服务端上传入口 | 不采纳。批量导入 = `cp content/` |
| 1.3-4 | 方式 D：更新已有文档 + 版本记录 | **已实现（换载体）** | Git 承担全部版本与恢复；`content/*.md` 每篇有 `version` 与 `updated` 字段（30/30） | 无需动作；**建议把 `version` 字段真正渲染出来** |
| 1.3-5 | `assets` 表 12 字段（id/storage_key/mime_type/checksum/scan_status…） | **不适用** | 无数据库、无上传 | 不采纳。若未来加图，用「文件系统 + 命名规范」代替（§4.3） |
| 1.3-6 | 文件安全 12 条（真类型校验/大小限制/重编码/防穿越/随机名/恶意扫描…） | **不适用（当前）／需预案** | 无上传入口 ⇒ 无攻击面；**但** nginx 已屏蔽 `.md` 与隐藏文件（`nginx-fixboxs.conf` L36-37），`.bak` 曾在门户站泄露源码并被清理（`CHANGELOG.md` L45） | 保留 nginx 的 `.md`/`.bak` deny；**把该规则同步进 fixboxs 的 sec 片段**（P1，见 §5.3） |

### 1.4 第四部分：技术架构与框架升级策略（原文 L466-572）

| 编号 | 建议要点 | 现状判定 | 依据 | 建议动作 |
|---|---|---|---|---|
| 1.4-1 | 先审计 10 项（框架/后端/数据存储/DB/认证/图床/URL-SEO/部署/构建/测试日志备份） | **已实现** | 已有 5 份设计文档；`docs/pc-fixboxs.yuanabd.cn-搜索与索引技术方案.md` §1.1 有完整现状表（L38-50），含核实来源列。**本次评审补全其缺项**：SEO 资产、测试/日志/备份状态 | 采纳。本评审 §2 即该审计的补全版 |
| 1.4-2 | 审计结论落到 `docs/audit/current-architecture.md` 等 6 份文档 | **部分实现** | 本站审计在单一文档的章节里，**未按 `docs/audit/` 分目录**；命名规范是 `pc-fixboxs.yuanabd.cn-*.md`（`docs/` 下 6 个文件） | **不采纳其目录方案**（会割裂现有命名规范）；本评审文档即审计载体 |
| 1.4-3 | 三路线比较 A（原项目加后台）> B（独立 CMS）> C（重建全栈） | **不适用/需改写** | 原方案三路线**全部假设存在"可扩展的应用"**。本站无可扩展应用，三选项少了一个正确选项：**D. 不建后台，增强静态内容管线** | **提出路线 D 并推荐之**（见 §3.1） |
| 1.4-4 | 评估 Directus / Strapi | **不适用** | 二者均需 Node 服务 + DB 常驻；本站部署是 `scp` 静态目录（`deploy-fixboxs.sh` L34-51），引入即需 systemd/端口/备份/监控，与「零依赖」硬约束冲突 | 不采纳。若未来走 B，须先接受运维面上升 |
| 1.4-5 | 目标架构：模块化单体 + 11 个业务模块 API | **不适用** | 无服务端进程 | 不采纳。**替代**：把"模块"投射到构建脚本与数据文件层（§3.3） |
| 1.4-6 | 技术选型表：Next.js/PostgreSQL/Prisma/对象存储/DB 全文检索/容器化 | **不适用** | `package.json` 不存在；无 ORM；无 DB | **不采纳全部**。本站选型已定：Node 内置模块 + 静态文件 + nginx |

### 1.5 第五部分：数据库与内容模型（原文 L576-668）

| 编号 | 建议要点 | 现状判定 | 依据 | 建议动作 |
|---|---|---|---|---|
| 1.5-1 | 14 张数据表（users/roles/permissions/articles/…/feedback） | **不适用** | 无数据库。**但**其字段清单可直接映射为 front-matter 与 JSON 数据文件 | **采纳其"字段思维"，否决其"表"** → §4.3 |
| 1.5-2 | 文章字段（id/slug/summary/status/author/published_at/verified_at/risk_level/reading_level/seo_*/deleted_at） | **部分实现** | 已实现：`slug`✅ `summary`✅（构建期从结论派生，`build-fix.cjs` L348-349）`risk`✅ `updated`✅ `reviewed_at`✅ `reviewer`✅。**缺**：`status`❌ `seo_title`❌ `seo_description`❌ `published_at`❌（有 `updated` 无首次发布） | **补 `seo_title`/`seo_description`/`published_at`**（P1，SEO 前置条件，见 §4.3） |
| 1.5-3 | Slug 唯一稳定；改标题不改 URL；变更须 301 | **已实现** | `slug` 全站显式声明且与文件名一致（30/30）；`build-fix.cjs` L338 兜底用文件名。**301 重定向未实现**（nginx 无 redirect 块） | 稳定 ✅；**补重定向清单机制**（P2，见 §5.4） |
| 1.5-4 | 文章元数据 13 项（OS/设备/类别/难度/风险/权限/重启/数据修改/来源/验证时间/环境/责任人/过期） | **已实现（已超纲）** | front-matter 实测 19 字段 100% 覆盖（`os`/`difficulty`/`time`/`risk`/`domain`/`category`/`prerequisites`/`tools`/`sources`/`reviewed_at`/`reviewer`/`updated`/`version`…） | **无需动作**。唯一缺「是否需重启/是否改数据」两布尔位，可并入 P2 |
| 1.5-5 | 验证状态 4 档（UNVERIFIED/VERIFIED/NEEDS_REVIEW/OUTDATED） | **部分实现** | 有 `reviewed_at` + `reviewer`（30/30）与渲染的「复核：内容组」（`build-fix.cjs` L305），**但无状态枚举、无"过期"自动判定** | **采纳**：构建期按 `reviewed_at` 距今 >180 天自动打 `OUTDATED` 徽章（P1，纯构建期，成本 0.5 人日） |
| 1.5-6 | 内容质量规范 10 条 + 高风险操作必须警告 | **已实现** | 10 段结构 30/30；高危命令自动识别（`build-fix.cjs` L135 正则含 `diskpart/format/chkdsk/reg delete/bcdedit/diskutil erase/mkfs`）并渲染 `fx-cmd--danger` | **无需动作** |

### 1.6 第六部分：前台体验升级（原文 L672-756）

| 编号 | 建议要点 | 现状判定 | 依据 | 建议动作 |
|---|---|---|---|---|
| 1.6-1 | 首页：搜索优先 + 分类 + 错误代码入口 + 热门 + 最新 + 向导 + 反馈 | **部分实现** | 已实现：搜索框（`index.html`）、分类网格（12 领域）、热门（`data-fx-list="hot"`，`index.html` 实测 mode 仅 "hot"）、向导入口、「最近更新」逻辑存在（`fix.js` L370）。**缺**：错误代码入口、首页显式「最新更新」区块、反馈入口（有 `about.html#feedback` 但首页未挂） | 补「最新更新」区块与错误代码入口（P2） |
| 1.6-2 | 文章详情：面包屑/摘要/系统难度耗时风险/目录/步骤/截图/代码复制/验证结果/替代方案/参考来源/更新时间/相关文章/反馈 | **部分实现（14 项中 11 项已实现）** | 已实现：面包屑（L291）、徽章组（L252-255）、TOC（L307-312）、步骤（L301）、代码复制（L138+L422）、验证段「怎么确认修好了」、替代「还是不行？」、更新时间（L305）、相关文章（L304）、反馈块（L302-303）。**缺**：截图（无图）、**参考来源未渲染**（`sources` 被丢弃）、摘要未独立渲染 | **补 `sources` 渲染** = 修复缺陷 D4（P0，1 人日内） |
| 1.6-3 | 移动端 8 项（行宽/代码横滚/图自适应/目录折叠/触控≥44/浮层不遮正文/懒加载/动画节制） | **部分实现** | 已实现：行宽 ≤760px、触控 ≥44px、`prefers-reduced-motion` 全站降级（README L82）、打印样式（README L83）、动效只动 transform/opacity（README L138）。**缺**：图片懒加载（因无图）、**目录在移动端折叠未见实现**（`fx-doc__toc` 在 HTML 中始终输出，`build-fix.cjs` L307） | 核查移动端 TOC 折叠（P2，需实机验证 → 标注**未核实**） |
| 1.6-4 | 搜索：标题/正文全文/分类标签/错误代码/OS 筛选/排序/无结果提示与推荐 | **部分实现** | 已实现：标题（权重 10）、symptoms（6）、keywords（4）、category（3）、summary（2）（`fix.js` L142-145）；OS 筛选（L284）、风险筛选（L285）、排序（L171）、无结果提示+推荐（L208-212）。**缺**：**正文全文检索**（索引只到 summary，不含 body）、**错误代码精确搜索**、**分类标签筛选**（只有 os/risk 两维） | **正文召回与错误代码是最大缺口** → §5.2 P0-3（分片倒排索引一并解决） |
| 1.6-5 | 搜索统计：高频词/无结果词/点击/低解决率/缺教程的错误代码 | **未实现** | 无任何统计脚本；线上抓取无 analytics。**仅有被动日志**：nginx `access_log`（`nginx-fixboxs.conf` L39） | **采纳**：零依赖「客户端批量上报 + nginx 被动日志」方案（§5.3 P1-4）。须先补隐私声明 |
| 1.6-6 | SEO：稳定 URL/标题描述/Canonical/Sitemap/robots/301/禁索引后台/结构化数据/监控 404 | **部分实现（偏未实现）** | URL 稳定 ✅；`<title>`✅ `<meta description>`✅（`build-fix.cjs` L270-271）。**线上实测缺失**：`robots.txt`→**404**、`sitemap.xml`→**404**、canonical→**无**、og/twitter→**无**、JSON-LD→**无**（4 个页面全部检测为 false）。301 无。**注**：`CHANGELOG.md` L44 称"三站补齐 robots/sitemap"，但 fixboxs 站**未补齐**——这是文档与现实的偏差 | **P0 最高优先**：补 robots.txt + sitemap.xml + canonical + JSON-LD（§5.2 P0-1/2/5） |

### 1.7 第七部分：故障自查与知识引擎（原文 L760-816）

| 编号 | 建议要点 | 现状判定 | 依据 | 建议动作 |
|---|---|---|---|---|
| 1.7-1 | 一阶段：故障现象↔教程结构化关联，分支不硬编码链接 | **部分实现** | 关系已存在两处：① `related` front-matter（30/30，`build-fix.cjs` L259-264 渲染为真链接）；② 向导分支（`fix.js` L487-528 `WIZ` 7 问，含 `when` 条件分支）。**但向导选项确实硬编码 slug**（L496-526）——正是方案警告的反模式 | **采纳"不硬编码"**：把 `WIZ` 外置为 `data/wizard.json`（P1，§4.4），并加构建期校验「引用的 slug 必须存在」 |
| 1.7-2 | 二阶段：交互式诊断（节点/条件/跳转/终止/版本/发布状态） | **部分实现** | 现有向导即是其**简化版**（7 问 + 评分排序 + `when` 条件 + 终止于结果页）。**缺**：多级流程图编辑、流程版本、发布状态 | 采纳为 **P2 演进**：把向导从"评分排序"升级为"决策树"（仍是静态 JSON + 纯前端） |
| 1.7-3 | AI 辅助（推荐文章/解释错误码/缩范围/辅助编辑/质量检查/缺口推荐）+ 7 条安全要求 | **未实现** | 全站无 AI 调用、无 fetch 外部 API | **明确排除**（见 §7）。理由：本站为纯静态无后端，前端直连 LLM 会**暴露密钥**，与「零依赖、无第三方脚本」冲突 |

### 1.8 第八部分：部署、安全、备份与恢复（原文 L820-872）

| 编号 | 建议要点 | 现状判定 | 依据 | 建议动作 |
|---|---|---|---|---|
| 1.8-1 | 安全基线 14 条（HTTPS/密码哈希/防注入越权/限流/输入校验/净化/密钥/错误堆栈/缓存/审计/依赖更新/最小权限） | **部分实现（网络层已优，应用层不适用）** | **已实现**：HTTPS + HSTS（线上实测 `Strict-Transport-Security: max-age=31536000`）、`X-Content-Type-Options: nosniff`、`Referrer-Policy: strict-origin-when-cross-origin`、`X-Frame-Options: SAMEORIGIN`；`.md`/隐藏文件 deny（nginx L36-37）。**不适用**：SQL 注入/CSRF/密码/会话/密钥——无这些组件。**缺**：CSP（未设） | 保留现有安全头；**评估加 CSP**（P2，需处理内联脚本 nonce）。**无需**其余应用层项 |
| 1.8-2 | 备份：DB + 文件 + 配置 + 内容导出 + 迁移脚本；自动/保留/告警/异地/演练 | **部分实现（强于方案要求）** | 本站"数据库"就是 Git 仓库 ⇒ **内容、构建脚本、配置全部有完整版本历史 + 异地副本（GitHub）**；部署回滚：`/var/www/fixboxs.prev`（`deploy-fixboxs.sh` L47-49）；nginx 配置备份 `/var/www/backups/`（README L152） | **无需动作**。Git 已是最好的备份；建议补一份「nginx 配置纳入仓库」（P2） |
| 1.8-3 | 发布与回滚 8 步（测试/备份/迁移/部署/健康检查/验证/日志/回滚） | **已实现（已超纲）** | `deploy-fixboxs.sh`：构建（L27）→ 打包（L36）→ 上传（L37）→ 原子切换（L42-49）→ **线上 6 URL 逐一校验 200（L54-58）** → 安全头校验（L60）。任一非 200 即 `exit 1`（L57）。`--check` 可只构建不上传（L29-32） | **无需动作**。这是全仓最成熟的一环 |

### 1.9 第九、十、十一、十二部分（原文 L876-1274）

| 编号 | 建议要点 | 现状判定 | 依据 | 建议动作 |
|---|---|---|---|---|
| 1.9-1 | P0 现状审计（2–4 人日），产出 6 份 audit 文档 | **部分实现** | 审计材料散布在 5 份设计文档；**本次评审即为该 P0 的执行**（§2） | 视为**已完成**（本评审交付） |
| 1.9-2 | P1 基础后台与内容管理闭环（5–10 人日） | **不适用** | 前提（后端/DB/认证/上传）全部不存在 | **否决**，替换为 §5.2 的静态管线增强 |
| 1.9-3 | P2 团队协作与内容质量（4–7 人日）：用户管理/角色/审核/版本/导入/验证状态/过期提醒 | **部分实现** | 版本 ✅（Git）、验证状态部分 ✅（`reviewed_at`/`reviewer`）、过期提醒 ❌、批量导入 ✅（`cp`）。缺口 = 过期提醒 + 状态枚举 | 采纳其中**「过期复核提醒」**（P1，纯构建期）与 **「验证状态枚举」**（P1） |
| 1.9-4 | P3 前台体验、搜索、SEO（4–7 人日） | **部分实现** | 见 1.6 各行。**这是本方案中与本站最契合的一节** | **采纳为核心路线**（§5.2/§5.3），但缩小范围到无需后端的部分 |
| 1.9-5 | P4 故障诊断与智能辅助（1–3 周） | **部分实现** | 向导已存在（见 1.7-1/1.7-2）；AI 部分未实现 | 采纳「决策树升级」；**AI 明确排除** |
| 1.9-6 | 测试与验收清单 5 大类约 50 项 check | **部分实现** | **已实现**：「已发布文章可访问」「结果不含下线内容」（无下线概念故恒真）、「图片自适应」「代码块不撑破」「复制反馈」「URL 未变」「404 行为」——多数已由 `deploy-fixboxs.sh` L54-58 的 URL 校验与构建期自检覆盖（`deploy-fixboxs.cjs` L82-92 断链检查）。**缺（不适用）**：全部 DB/权限/审核/上传类项 | 采纳其**校验精神**；将适用项固化为 `verify-fixboxs.cjs`（P1，§4.6） |
| 1.9-7 | 两轮 Codex 提示词（先审计、后实施 P1） | **部分实现** | 第一轮（L1090-1148）**已实质执行**（本次评审）；第二轮（L1154-1193）以 P1 建后台为前提 | 第一轮采纳；**第二轮需重写**为静态管线版 |
| 1.9-8 | 最终建议：首选 A（原项目加后台）> B（CMS）> C（重建） | **不适用** | 与本站无后端事实冲突（见 1.4-3） | **异议**：推荐路线 D（增强静态管线），理由见 §3.1 |
| 1.9-9 | 第一阶段不应做：AI/微服务/换框架/重写页面/全员发布权/PDF 直转/重型依赖/无回滚迁移 | **已实现（本站恰好全部符合）** | 本站无 AI、无微服务、无框架、无依赖（`package.json` 不存在）、有回滚（`.prev`） | **无需动作**。这 8 条"不做"与本站现状完全一致，等于对本方案的自我否决 |

### 1.10 判定分布统计

| 判定 | 条目数 | 占比 | 说明 |
|---|---|---|---|
| 已实现 | 8 | 22% | 多为本站做在方案要求之前（模板、元数据、质量规范、部署回滚、高危命令识别） |
| 部分实现 | 16 | 43% | 骨架在、缺口明确；**多数缺口是"SEO/搜索/埋点"三类** |
| 未实现 | 4 | 11% | 内容状态机、搜索统计、AI 辅助、Canonical/OG/JSON-LD |
| 不适用 | 9 | 24% | 全部集中在后台/DB/权限/上传/认证——**即方案的主体篇幅** |
| 合计 | 37 | 100% | — |

> **读法**：方案约 **35% 的内容（不适用 + 需改写）与本站架构正面冲突**；另有 **24% 已实现**（方案在描述本站现状）；真正值得执行的收敛为 **8–10 条**，全部归入 §5 的 P0/P1。

---

## 2. 现状架构图与问题清单

### 2.1 当前真实架构（内容源 → 构建 → 产物 → 部署 → 运行时）

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 第 1 层：内容源（人工维护，Git 版本化）                                    │
│   content/fixboxs/*.md   ×30                                              │
│   └─ front-matter 19 字段（title/slug/domain/category/os/difficulty/     │
│      time/risk/symptoms/keywords/aliases/updated/version/prerequisites/   │
│      tools/related/sources[{title,url}]/reviewer/reviewed_at）  ← 100% 覆盖│
│   └─ 正文固定 10 段 H2（一句话结论/30秒快速排查/适用不适用/开始前确认/     │
│      分步骤(###步骤N)/怎么确认修好了/还是不行？/预防/相关教程/更新日志）     │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │  node build-fix.cjs   (378 行, 零依赖)
                                │  ├ 自制 front-matter 解析器  L78-97
                                │  ├ 自制 Markdown→HTML 渲染器 L112-201
                                │  ├ 步骤组件渲染器          L203-223
                                │  └ 分类字典硬编码 DOMAINS/CATS L22-40  ⚠
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 第 2 层：站点源（Demo 源 = 部署源，两用）                                  │
│   demo/fixboxs/                                                           │
│   ├─ 6 个壳页：index / browse / search / wizard / tools / about  (手写 HTML)│
│   ├─ fix/<slug>.html  ×30   ← 构建产物，勿手改                            │
│   ├─ data/articles.js 36.2 KB ← 构建产物：扁平数组，含 11 个字段   ⚠       │
│   ├─ js/fix.js 626 行 ← 全部运行时逻辑（13 个初始化器 + 7 问向导）        │
│   └─ css/theme-fix.css + css/fix.css                                      │
│   共享层（引用不复制）：demo/css/tokens.css                                │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │  node deploy-fixboxs.cjs  (101 行)
                                │  ├ 复制 tokens.css 进产物（自包含）      L40-41
                                │  ├ 按深度改写 tokens 引用 ./ 或 ../      L43-54
                                │  ├ 按内容 md5 打 ?v= 版本号              L56-81
                                │  └ 断链自检（引用必须能解析到文件）      L82-92
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 第 3 层：部署产物 dist/fixboxs/  (42 文件 / 1013.6 KB，完全自包含)         │
│   index.html · browse.html · search.html · wizard.html · tools.html ·     │
│   about.html · fix/*.html ×30 · data/articles.js · js/fix.js ·            │
│   css/{tokens,theme-fix,fix}.css · README.md                              │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │  bash deploy-fixboxs.sh  (61 行)
                                │  ① 构建 → ② tar+scp 到 /tmp → ③ 远端原子切换
                                │     (/var/www/fixboxs.new → .prev → fixboxs)
                                │  ④ 线上 6 URL 校验 200 + 安全头校验，失败即退出
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 第 4 层：托管与运行时                                                      │
│   腾讯云 106.55.2.197 · Ubuntu · nginx 1.24 · /var/www/fixboxs            │
│   ├─ HTTP/2 + TLS(Let's Encrypt) + HSTS + nosniff + Referrer-Policy +     │
│   │  X-Frame-Options  ← 线上实测已确认                                    │
│   ├─ HTML: Cache-Control no-cache ；静态资源: max-age=2592000, immutable  │
│   ├─ try_files $uri $uri.html $uri/ =404   （目录式 URL 回落）             │
│   ├─ deny .md / .bak / 隐藏文件                                            │
│   └─ access_log / error_log → /var/log/nginx/fixboxs.*.log                │
│                                                                           │
│   运行时（浏览器）：fix.js 逐页加载 data/articles.js → 内存建索引 → 检索    │
│   ├─ 无服务端进程 · 无 API · 无数据库 · 无第三方请求                       │
│   └─ 状态仅存 localStorage/sessionStorage（步骤勾选/收藏/转场/预加载）      │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2.2 结构性短板清单（全部实测）

| ID | 短板 | 严重度 | 证据（文件/行号/线上） | 影响 |
|---|---|---|---|---|
| **D1** | **无 `robots.txt`、无 `sitemap.xml`** | 🔴 高 | 线上 `https://pc-fixboxs.yuanabd.cn/robots.txt` → **404**；`/sitemap.xml` → **404**（web_fetch 实测） | 搜索引擎无法发现 30 篇教程；站点几乎无自然流量入口。**注**：`CHANGELOG.md` L44 声称三站已补，fixboxs 实际未补 |
| **D2** | **无 canonical / og / twitter / JSON-LD** | 🔴 高 | 首页、`fix/wifi-connected-but-no-internet.html`、`search.html`、`browse.html` 四个页面正则检测：`hasCanonical=false, hasOg=false, hasJsonLd=false, hasTwitter=false` | 分享无卡片；搜索引擎无结构化理解（`HowTo`/`FAQPage` 可拿富摘要）；`.html` URL 存在重复内容风险 |
| **D3** | **搜索仍是内存小索引**，且**索引不含正文** | 🔴 高 | `fix.js` L147 `buildIndex()` 对 `window.FX_ARTICLES`（36.2 KB 全量同步加载）建内存索引；`FIELDS`（L142-145）只含 title/symptoms/keywords/summary/category，**无 body**。设计文档《搜索与索引技术方案》§2.4 已明确推荐"预构建分片倒排索引"，但**构建脚本不存在**（`glob *index*.cjs` → 空） | 正文里的命令、错误码、型号搜不到；篇数增长时首屏体积线性恶化（与设计 C7「低配老旧电脑」冲突） |
| **D4** | **`aliases` 等 7 个 front-matter 字段被构建丢弃** | 🔴 高（新发现） | `build-fix.cjs` L356-369 组装 `articles.push({...})` 只取 11 字段；实测 `data/articles.js` 中 `"aliases"` 出现 **0 次**，而 `"symptoms"`/`"keywords"` 各 30 次。同被丢弃：`sources` / `prerequisites` / `tools` / `reviewer` / `reviewed_at` / `related` / `version` | `aliases` 是《搜索与索引技术方案》§3.5 认定的**口语召回主力**（如"断网/没网/连上网不能用"），当前**完全不参与检索** ⇒ 召回率损失可直接量化。`sources` 官方来源不在页面显示，削弱可信度与 E-E-A-T |
| **D5** | **分类字典硬编码在构建脚本**，无分类聚合页 | 🟠 中 | `build-fix.cjs` L22-27（12 领域）、L28-40（28 分类）为常量对象；`browse.html` 只有 **12 个领域锚点**（`id="net-basic"` 等），**无 28 个分类的聚合页**；category 仅作为卡片上的一行文字（`fix.js` L294 `a.path`） | ① 内容与展示耦合（违方案原则 3）；② 长尾搜索词「连上但上不了网」没有落地页；③ 无法按 category 浏览/筛选 |
| **D6** | **无搜索/内容埋点**，无内容缺口数据 | 🟠 中 | 无统计脚本（README L84）；线上 4 页检测 `hasAnalytics=false`；无 `search_events` 类机制 | 不知道用户在搜什么、什么搜不到 ⇒ **内容选题凭感觉**，这正是方案 2.2/6.3 想解决的 |
| **D7** | **无内容状态机与校验** | 🟠 中 | front-matter 无 `status`；`build-fix.cjs` L345 只对「缺 title」告警跳过，**不校验 slug 唯一性、分类合法性、related 引用是否存在的 slug** | 添加文章时可能写出死链 `related`（L262-263 会降级为搜索链接，掩盖问题）、非法 domain（L227 回退为原始值） |
| **D8** | **无「过期/待复核」信号** | 🟡 低-中 | 有 `reviewed_at`/`reviewer` 且在页脚渲染「复核：内容组」（L305），但**无时间比较、无状态枚举** | 系统教程会静默过时（如 `Windows 11 24H2` 变更），用户看不到"本文可能已过时" |
| **D9** | **无 301 重定向机制** | 🟡 低 | nginx `fixboxs.conf` 无 `rewrite`/`return 301` 块；构建脚本无重定向表 | slug 一旦变更（方案 5.2 要求"改标题不改 URL"）将产生死链 |
| **D10** | **向导规则硬编码 slug** | 🟡 低-中 | `fix.js` L487-528 `WIZ` 常量内直接写 slug（如 L496 `["win-stuck-on-boot-logo"]`） | 方案 7.1 明确警告的反模式；改 slug 需改 JS；无构建期引用校验 |
| **D11** | **`sources` 有数据但不渲染** | 🟡 低-中 | 30/30 篇有 `sources`（含官方文档 URL），但 `articles.js` 与教程页均无输出（见 D4） | 白写的内容资产；权威性/可验证性无法传达给用户与搜索引擎 |
| **D12** | **图片能力为零** | 🟡 低（当前） | `content/fixboxs` 无图片；教程正文无插图；全站图片仅 favicon（内联 data URI，L272） | 排障教程缺"看图操作"体验；未来补图需先建命名与压缩规范 |
| **D13** | **移动端 TOC 折叠未核实** | ⚪ 未核实 | `build-fix.cjs` L307 无条件输出 `fx-doc__toc`；CSS 折叠规则未在本轮逐行核实 | 若未折叠可能遮挡正文（方案 6.2 明确列为移动端要点） |
| **D14** | **站点源与部署源同一目录（双用）** | 🟡 低 | `demo/fixboxs/` 既是仓库内 Demo 又被 `deploy-fixboxs.cjs` L14 当作部署输入 | 构建产物（`fix/*.html`、`data/articles.js`）混在手写壳页旁边，误改风险；靠注释"勿手改"约束 |

### 2.3 做得好、不应被方案推翻的部分（保留清单）

| 维度 | 现状 | 保留理由 |
|---|---|---|
| 部署与回滚 | `deploy-fixboxs.sh` 四步 + 原子切换 + `.prev` + 6 URL 校验 | 比方案 8.3 的 8 步清单更automated、更可靠 |
| 安全头与 TLS | 线上实测 HSTS/nosniff/Referrer-Policy/X-Frame-Options 齐全 | 已达方案 8.1 的网络层要求 |
| 缓存策略 | HTML no-cache + 静态资源 30d immutable + 内容哈希 `?v=` | 与方案 8.1「缓存策略」一致且更严谨 |
| 零依赖与渐进增强 | 无 npm、无框架、JS 失效仍可读（`fix.js` 头注释 L13） | 方案的"不要引入重型依赖"原则 |
| 内容模型 | 19 字段 front-matter 100% 覆盖、10 段固定结构 | 已超方案 5.3/5.4 要求 |
| 无障碍与降级 | 触控 ≥44px、`prefers-reduced-motion`、打印样式、skip link | 已达方案 6.2 移动端要求 |
| 高危操作警示 | 正则识别 diskpart/format/bcdedit 等 + 三色 callout | 已达方案 5.4「高风险必须提示」 |

### 2.4 复现命令（供复核）

```powershell
# D1/D2：线上 SEO 资产缺失
curl.exe -sSI https://pc-fixboxs.yuanabd.cn/robots.txt      # 期望 404 → 实得 404
curl.exe -sSI https://pc-fixboxs.yuanabd.cn/sitemap.xml     # 期望 404 → 实得 404

# D3：无分片索引构建脚本
glob "**/*index*.cjs"        → []
glob "package.json"          → []

# D4：aliases 未进入运行时索引
Select-String -Path demo/fixboxs/data/articles.js -Pattern '"aliases"' -AllMatches
#   → 0 处匹配（"symptoms"/"keywords" 各 30 处）

# D5：分类字典硬编码
Select-String -Path build-fix.cjs -Pattern '^const (DOMAINS|CATS)'   # L22, L28

# 部署目录与产物
Get-ChildItem -Recurse -File dist/fixboxs | Measure-Object Length -Sum
#   → 42 文件 / 1013.6 KB
```

---

## 3. 目标架构设计

### 3.1 路线决策：提出并推荐路线 D

原方案给出 A/B/C 三条路线，但三者**都假设已存在一个可扩展的应用**（原文 L487 起）。本站不存在该前提。补一条：

| 路线 | 描述 | 适用前提 | 成本 | 对本站 |
|---|---|---|---|---|
| A 原项目加后台 | 在现有项目内建 CMS 功能 | 已有后端 + DB + 认证 | 高 | ❌ 前提不成立 |
| B 独立 CMS | Directus/Strapi | 前台成熟、内容管理是主要短板 | 中高 | ⚠️ 仅当"非技术员网页发稿"成为硬需求 |
| C 重建全栈 | 新建全栈系统 | 现架构不可维护 | 最高 | ❌ 明确否决 |
| **D 增强静态内容管线** | **保持零依赖纯静态，把内容管线、检索、SEO、埋点补全** | **零依赖 + 静态托管 + Git 工作流** | **中低（8–14 人日）** | ✅ **推荐** |

**推荐 D 的四条理由**

1. **成本差一个数量级。** D 是 8–14 人日；A 至少是"新建全栈"（方案自估 P1 5–10 人日只够起步，未含 DB 运维/备份/安全/部署改造）。本站全部内容是 30 篇 394 KB——**为 394 KB 内容引入 PostgreSQL + ORM + RBAC 是不成立的**。
2. **A 会摧毁当前最强的资产。** 本站部署链（原子切换 + URL 校验）与零依赖渐进增强是成熟资产；A 要把它换成"应用部署 + DB 迁移 + 健康检查"，风险远大于收益。
3. **方案要求的后台能力，Git 已经提供且更强。** 草稿=branch，审核=PR review，发布=merge，权限=仓库协作者，版本历史=`git log -p`，回滚=`git revert`，审计=commit 签名。方案 2.5 的 7 条工作流规则，Git **逐条满足**。
4. **D 不阻断未来走 B/A。** 因为 front-matter 与内容结构不变，切换的只是"渲染与检索"层（这一点《搜索与索引技术方案》§2.4 理由 4 已论证）。

**什么时候必须改走 B/A**：出现"非技术人员必须通过网页表单发稿且不能碰 Git"这一硬需求，且该需求的价值 > DB+服务端运维成本。在此之前，D 是唯一合理选择。

### 3.2 目标分层架构

```
┌───────────────────────────────────────────────────────────────────────────┐
│ L1 内容层 Content                                                          │
│   职责：存放唯一真源（Markdown + front-matter）与内容资产（分类表/词典/向导） │
│   产物：content/fixboxs/*.md、data/*.json（新增）                          │
│   接口：文件系统；schema 见 §4.3                                            │
│   约束：零代码、纯文本、可 diff、可 review                                  │
├───────────────────────────────────────────────────────────────────────────┤
│ L2 领域模型层 Domain Model                                                 │
│   职责：「领域 domain → 分类 category → 教程 article」三级映射 + 术语表      │
│   产物：data/taxonomy.json（从 build-fix.cjs 的 DOMAINS/CATS 外置而来）      │
│        data/aliases.json（同义词/别名折叠表）                               │
│        data/stopwords.json / data/dict.json（分词词典）                     │
│   接口：被 L3 读取；被 L5 运行时经索引间接使用                               │
├───────────────────────────────────────────────────────────────────────────┤
│ L3 构建管线层 Build Pipeline（零依赖 Node CJS）                             │
│   职责：校验 → 解析 → 渲染 → 索引 → 聚合 → SEO 工件                        │
│   模块：见 §4.5（validate / parse / render / index / aggregate / seo / stats）│
│   产物：demo/fixboxs/fix/*.html、data/articles.js（瘦身）、data/index/*.json │
│        sitemap.xml、robots.txt、category/*.html、stats.json                 │
│   接口：`node build-fix.cjs [--check]`；退出码非 0 表示校验失败             │
├───────────────────────────────────────────────────────────────────────────┤
│ L4 运行时层 Runtime（浏览器，零依赖 IIFE）                                  │
│   职责：检索、筛选、向导、步骤、复制、TOC、收藏、转场                        │
│   模块：见 §4.6（search / wizard / ui）                                     │
│   接口：`data-*` 驱动；元素缺失即跳过；JS 失效仍可读                       │
│   关键：首屏体积与篇数**解耦**（分片索引）                                   │
├───────────────────────────────────────────────────────────────────────────┤
│ L5 部署层 Deploy                                                           │
│   职责：自包含产物 → 打包 → 原子切换 → 线上校验                             │
│   模块：deploy-fixboxs.cjs（产物） + deploy-fixboxs.sh（发布）              │
│   接口：`bash deploy-fixboxs.sh [--check]`；退出码语义不变                 │
│   新增：sitemap/robots/重定向表的产物化与校验                                │
├───────────────────────────────────────────────────────────────────────────┤
│ L6 观测层 Observability（新增，保持零服务端）                               │
│   职责：搜索事件、零结果、内容缺口                                          │
│   模块：运行时批量上报 → nginx access_log → 构建期离线分析                  │
│   接口：见 §5.3 P1-4；**必须先补隐私声明**                                  │
└───────────────────────────────────────────────────────────────────────────┘
```

### 3.3 分层职责与接口表

| 层 | 输入 | 职责（做什么） | 输出/产物 | 不做什么（边界） |
|---|---|---|---|---|
| L1 内容 | 人工写作 | 提供 md + 资产 JSON | `content/*.md`、`data/*.json` | 不写 HTML、不写逻辑 |
| L2 领域 | — | 维护分类树与词典 | `taxonomy.json` 等 | 不渲染、不检索 |
| L3 构建 | L1+L2 | 校验/渲染/索引/聚合/SEO | 全部静态产物 | 不联网、不写人工文件 |
| L4 运行时 | L3 产物 | 交互与检索 | DOM 操作、localStorage | **不发 XHR 到第三方**、不硬编码内容 |
| L5 部署 | L3 产物 | 原子发布与校验 | 线上目录 | 不改 nginx 配置（脚本 L15 明示） |
| L6 观测 | L4 事件 | 收集→分析 | 事件日志、缺口报告 | 不采个人数据、不做实时后台 |

### 3.4 「零依赖纯静态」的破例评估

| 若引入 | 代价 | 结论 |
|---|---|---|
| 分片倒排索引构建脚本 | **零破例**——纯 Node 内置模块（`fs/path/crypto`），构建期一次性 | ✅ 采纳 |
| 分类聚合页（28 页） | **零破例**——构建期生成静态 HTML | ✅ 采纳 |
| sitemap/robots/JSON-LD | **零破例**——构建期生成文本 | ✅ 采纳 |
| 搜索埋点 | **极小破例**：需一个上报端点。可用 nginx 被动记录 `/log?q=...` 的 access_log，**无服务端代码** | ✅ 采纳（§5.3 P1-4） |
| 图片/插图管线 | 零破例（构建期复制+压缩需引入工具 ⇒ **唯一真破例点**，建议暂缓或手工压缩） | ⏸ 暂缓 |
| Pagefind | 破例：引入 Rust 预编译二进制到构建链 | ❌ 不采纳（设计文档 §2.3 P5 已论证） |
| 独立 CMS | 破例：服务端进程 + DB + systemd + 备份 + 监控 | ❌ 不采纳 |
| AI 问答 | 破例：密钥暴露或需代理服务端 | ❌ 不采纳（§7） |

> **破例总则**：只允许「构建期零依赖、运行时不发第三方请求」的变更。任何需要常驻进程或引入二进制到构建链的方案，一律需要项目负责人显式批准并重估运维成本。

---

## 4. 具体框架设计结构

### 4.1 目标目录树（新增以 `+` 标注）

```
YuanAbd-Web/
├─ content/fixboxs/
│  └─ *.md                       30 篇教程源（不变）
├─ data/                        + 新增：内容资产层（纯数据，非代码）
│  ├─ taxonomy.json             + 12 领域 + 28 分类（从 build-fix.cjs L22-40 外置）
│  ├─ aliases.json              + 全局别名折叠表（"无线网/wlan/wi-fi"→wifi）
│  ├─ dict.json                 + 领域词典（蓝屏代码/无线网卡/0x... 保护词）
│  └─ stopwords.json            + 停用词
├─ demo/fixboxs/
│  ├─ index.html browse.html search.html wizard.html tools.html about.html
│  ├─ fix/<slug>.html           构建产物
│  ├─ category/<catKey>.html   + 新增：28 个分类聚合页（构建产物）
│  ├─ domain/<domKey>.html     + （可选）12 个领域聚合页；若沿用 browse.html 锚点则跳过
│  ├─ data/
│  │  ├─ articles.js            瘦身：只留列表渲染必需字段
│  │  ├─ index/                + 新增：分片倒排索引（构建产物）
│  │  │  ├─ manifest.json      + 版本 + 分片数 + 字段权重
│  │  │  ├─ docs.json          + 正文摘要/标题池（按需加载）
│  │  │  └─ shard-00.json …    + 16 片（term → posting list）
│  │  ├─ wizard.json           + 向导决策树（从 fix.js L487-528 外置）
│  │  └─ stats.json            + 构建期统计（篇数/领域分布/待复核数）
│  ├─ js/
│  │  ├─ fix.js                入口：只做初始化调度
│  │  ├─ fx-search.js          + 检索运行时（分片加载 + 分词 + 打分）
│  │  ├─ fx-wizard.js          + 向导运行时（读 wizard.json）
│  │  └─ fx-ui.js              + 通用 UI（步骤/复制/TOC/收藏/转场）
│  ├─ css/{theme-fix,fix}.css
│  ├─ sitemap.xml              + 构建产物
│  └─ robots.txt               + 构建产物（或由构建期生成，见 §4.7）
├─ scripts/                     + 新增：构建管线模块化（零依赖 CJS）
│  ├─ fx-tokens.cjs            + 前端分词（索引期与查询期**共用**，见 §4.5）
│  ├─ fx-taxonomy.cjs          + 分类表加载与校验
│  ├─ fx-markdown.cjs          + 从 build-fix.cjs 抽出的渲染器
│  └─ fx-index.cjs             + 倒排索引构建器
├─ build-fix.cjs                 主编排：调用 scripts/* 与 data/*
├─ verify-fixboxs.cjs          + 站点级验收（替代方案 §10 的适用项）
├─ deploy-fixboxs.cjs            不变（或增加 sitemap/robots 纳入 ASSETS 版本化）
├─ deploy-fixboxs.sh             不变
└─ docs/
   ├─ pc-fixboxs.yuanabd.cn-架构评审与升级实施方案.md   ← 本文
   └─ （现有 5 份设计文档，命名规范不变）
```

> **命名规范**：新增数据文件用 `data/*.json`（kebab-case）；新增构建模块用 `scripts/fx-<职责>.cjs`；新增运行时用 `js/fx-<职责>.js`；构建产物目录 `fix/`、`category/`、`data/index/` 一律视为只读（注释"由 X 生成，请勿手改"）。

### 4.2 文件命名规范

| 类别 | 规范 | 示例 |
|---|---|---|
| 教程源 | `<slug>.md`，slug 与文件名一致 | `wifi-connected-but-no-internet.md` |
| 教程页 | `fix/<slug>.html` | `fix/win-bluescreen-read-code.html` |
| 分类聚合页 | `category/<categoryKey>.html` | `category/net-connected-noint.html` |
| 索引分片 | `data/index/shard-<NN>.json`（零填充 2 位） | `shard-07.json` |
| 数据资产 | `data/<name>.json` | `taxonomy.json` |
| 构建模块 | `scripts/fx-<role>.cjs` | `fx-index.cjs` |
| 运行时 | `js/fx-<role>.js` | `fx-search.js` |

### 4.3 数据文件 schema

**(1) `content/fixboxs/*.md` front-matter（现有 19 字段 + 建议新增 5 字段）**

| 字段 | 类型 | 现状 | 说明 |
|---|---|---|---|
| `title` | string | ✅ 30/30 | 页面 H1 与 `<title>` |
| `slug` | string | ✅ 30/30 | 唯一、稳定，与文件名一致 |
| `domain` | enum | ✅ 30/30 | 12 领域之一（须过 taxonomy 校验） |
| `category` | enum | ✅ 30/30 | 28 分类之一 |
| `os` | string[] | ✅ 30/30 | 适用系统 |
| `difficulty` | string | ✅ 30/30 | 入门/进阶 |
| `time` | string | ✅ 30/30 | 预计耗时 |
| `risk` | enum | ✅ 30/30 | 安全/需谨慎/有数据风险 |
| `symptoms` | string[] | ✅ 30/30 | **口语现象（召回主力）** |
| `keywords` | string[] | ✅ 30/30 | 术语关键词 |
| `aliases` | string[] | ✅ 30/30 | **同义说法（当前被丢弃！D4）** |
| `updated` | date | ✅ 30/30 | 最后更新 |
| `version` | string | ✅ 30/30 | 内容版本（当前未渲染） |
| `prerequisites` | string[] | ✅ 30/30 | 前置条件（当前未渲染） |
| `tools` | string[] | ✅ 30/30 | 所需工具（当前未渲染） |
| `related` | slug[] | ✅ 30/30 | 相关教程（已渲染；**需加存在性校验**） |
| `sources` | {title,url}[] | ✅ 30/30 | 官方来源（**当前未渲染** D11） |
| `reviewer` | string | ✅ 30/30 | 复核人 |
| `reviewed_at` | date | ✅ 30/30 | 复核日期（用于过期判定） |
| `seo_title` | string | ✚ **建议新增** | 缺省回退 `title` |
| `seo_description` | string | ✚ **建议新增** | 缺省回退 `summary`（L348 派生） |
| `published_at` | date | ✚ **建议新增** | 首次发布，供 sitemap `lastmod`/`priority` |
| `needs_restart` | bool | ✚ 可选 | 是否需重启（方案 5.3 项） |
| `modifies_data` | bool | ✚ 可选 | 是否涉及数据修改（方案 5.3 项） |

**(2) `data/taxonomy.json`（从 `build-fix.cjs` L22-40 外置）**

```json
{
  "version": 1,
  "domains": [
    { "key": "net-basic", "name": "网络基础", "accent": "--fx-sky", "order": 7 }
  ],
  "categories": [
    { "key": "net-connected-noint", "name": "连上但上不了网", "domain": "net-basic", "order": 2 }
  ]
}
```
> `accent` 对应 `fix.js` L333-335 `ACCENTS` 映射；`order` 复现 `PRIORITY`（L43-49）的排序意图。

**(3) `data/articles.js`（瘦身后的列表索引，运行时同步加载）**

当前 36.2 KB 含 11 字段。目标：只留渲染卡片必需的字段，把 `symptoms`/`keywords`/`aliases` 移入分片索引。

```json
{
  "slug": "wifi-connected-but-no-internet",
  "title": "…", "domain": "net-basic", "domainName": "网络基础",
  "category": "net-connected-noint", "categoryName": "连上但上不了网",
  "summary": "…", "os": [{ "t": "Windows 10", "k": "windows" }],
  "osGroup": ["windows","macos","network"],
  "level": "入门", "time": "15-45 分钟", "risk": "安全",
  "updated": "2026-10-11", "hot": 30, "stale": false
}
```

**(4) `data/index/manifest.json`（分片索引清单）**

```json
{
  "v": "sha256:…",            // 内容哈希，用于版本一致性
  "shards": 16,
  "docs": "docs.json",
  "fields": { "title": 10, "symptoms": 6, "aliases": 7, "keywords": 4, "category": 3, "summary": 2, "body": 1 },
  "docCount": 30
}
```

**(5) `data/index/shard-NN.json`（倒排分片）**

```json
{ "terms": { "蓝屏": [[0, 5, 3]], "0x0000007b": [[0, 3, 1]] } }
//                        [docId, tf, fieldFlag]  → BM25 打分输入
```

**(6) `data/wizard.json`（向导决策树，从 `fix.js` L487-528 外置）**

```json
{ "version": 1,
  "steps": [
    { "id": "device", "q": "你的设备是什么？", "hint": "…",
      "when": null,
      "opts": [ { "t": "Windows 电脑", "match": { "os": "windows" } } ] }
  ] }
```
> `when` 由字符串条件表达式描述（如 `"symptom ~ 上不了网"`），运行时求值 —— 避免外置 JSON 无法表达函数的问题。

### 4.4 构建脚本的模块划分

| 模块 | 职责 | 输入 | 输出 | 现状 |
|---|---|---|---|---|
| `build-fix.cjs`（编排） | 读取源 → 依次调用各模块 → 汇总报告 | `content/` + `data/` | 全部产物 + 退出码 | 已有（L327-378），需重构为编排 |
| `scripts/fx-taxonomy.cjs` | 加载并校验 taxonomy；提供 `domainName()/categoryName()/accent()` | `data/taxonomy.json` | 查询函数 | **新增**（替换 L22-40 硬编码） |
| `scripts/fx-markdown.cjs` | front-matter 解析 + md→html + 步骤渲染 | md 文本 | HTML 片段 | **抽出**（现有 L78-223） |
| `scripts/fx-tokens.cjs` | 归一化 + bigram + 词典切分（**索引期/查询期共用同一实现**） | 文本 | token[] | **新增**（关键：保证两端一致） |
| `scripts/fx-index.cjs` | 构建倒排 → 按 termId 哈希分片 → 写 manifest | 文档 token | `data/index/*` | **新增** |
| `scripts/fx-aggregate.cjs` | 生成 28 个分类聚合页 | 文章表 + taxonomy | `category/*.html` | **新增** |
| `scripts/fx-seo.cjs` | 生成 sitemap.xml / robots.txt / JSON-LD / canonical / og | 文章表 | 对应文件 | **新增** |
| `scripts/fx-stats.cjs` | 统计篇数/领域分布/待复核 | 文章表 + `reviewed_at` | `stats.json` | **新增** |
| `scripts/fx-validate.cjs` | 校验：slug 唯一、domain/category 合法、related 存在、必填齐全 | 解析结果 | 错误列表 | **新增**（补 D7） |

**构建期校验规则（`--check` 与常规构建都跑）**

| # | 规则 | 失败处理 |
|---|---|---|
| V1 | `slug` 全局唯一 | 报错退出 |
| V2 | `domain`/`category` 必须在 taxonomy 中 | 报错退出 |
| V3 | `related` 每个 slug 必须存在 | 报错退出（**替代当前静默降级** L262-263） |
| V4 | `sources[].url` 必须 `https://` | 报错 |
| V5 | 正文字段齐全（10 段核心） | 警告 |
| V6 | `reviewed_at` 距今 >180 天 | 警告 + 打 `stale` |

### 4.5 运行时脚本的职责划分

| 模块 | 职责 | 现状归属 | 拆分理由 |
|---|---|---|---|
| `js/fix.js` | 仅启动调度（boot 顺序） | L610-625 | 单文件 626 行已到维护上限 |
| `js/fx-search.js` | 分片加载 + 归一化/bigram + BM25 打分 + 高亮 | L126-330 | 与索引构建共用 `fx-tokens` 逻辑 |
| `js/fx-wizard.js` | 读 `wizard.json` → 条件求值 → 评分排序 | L486-607 | 去掉硬编码（D10） |
| `js/fx-ui.js` | 预加载/转场/入场/吸顶/步骤/复制/TOC/收藏 | L33-124, L384-484 | 与检索无关，可独立缓存 |

**运行时硬约束（延续现状）**
- 元素缺失即跳过；JS 完全失效时页面仍可读（表单 GET 兜底，L245-251）。
- 分片索引按需 fetch，**首屏不加载**；`manifest.json` 用 `no-cache`（nginx 已对 `.json` 长缓存 ⇒ manifest 需单独免缓存或带 v 参数）。
- 不向任何第三方域名发请求。

### 4.6 验收脚本 `verify-fixboxs.cjs`（替代方案 §10 的适用项）

| 检查类 | 项 | 现有覆盖 |
|---|---|---|
| 构建完整性 | 30 篇全产出、断链为 0 | `deploy-fixboxs.cjs` L82-92 |
| 链接完整性 | 所有 `related` / 面包屑 / 分类页链接可解析 | **新增** |
| SEO 工件 | `robots.txt`/`sitemap.xml` 存在且条目数 = 篇数 | **新增** |
| 索引一致性 | `manifest.docCount` = 篇数；每篇在索引中可召回到自己 | **新增** |
| 起始包体积 | `articles.js` + 首屏 JS/CSS gzip 上限 | **新增** |
| 线上 | 6+ 关键 URL 200 + 安全头 | `deploy-fixboxs.sh` L54-60 |
| 移动端 | 无横向溢出、触控 ≥44px | 沿用 `.tmp-shots/` 既有探针 |

---

## 5. 实施方案

> 工作量口径：1 人日 = 1 名熟悉本仓库的开发者（借助 AI 编码）的一个完整工作日。基线参考：方案自估 P1 后台为 5–10 人日，而本方案 P0+P1 合计 8–14 人日**且不引入任何服务端**。

### 5.1 阶段总览与依赖

```
        ┌──────────────────────────────────────────────┐
        │ P0（必须先做 · 串行 ≥3 项）                   │
        │ ① robots.txt+sitemap.xml                      │
        │ ② canonical + JSON-LD + og                    │
        │ ③ 修复 D4：aliases/sources 等字段不再丢弃      │
        │ ④ taxonomy 外置 + 构建期校验 V1–V6            │
        └───────────────┬──────────────────────────────┘
                        │ 依赖：③ 是 ⑤ 的输入；④ 是 ⑥ 的输入
        ┌───────────────┴──────────────────────────────┐
        │ P1（可并行）                                   │
        │ ⑤ 分片倒排索引（fx-tokens + fx-index + 运行时）│
        │ ⑥ 分类聚合页 ×28                               │
        │ ⑦ 过期复核徽章 + stats.json                    │
        │ ⑧ 搜索埋点（被动日志）                         │
        │ ⑨ verify-fixboxs.cjs                           │
        └───────────────┬──────────────────────────────┘
        ┌───────────────┴──────────────────────────────┐
        │ P2（可选 · 视需求）                            │
        │ ⑩ 向导决策树升级   ⑪ 301 重定向表             │
        │ ⑫ 图片管线   ⑬ CSP                             │
        └──────────────────────────────────────────────┘
```

### 5.2 P0：SEO 与内容资产补全（必须先做）

| 项 | 目标 | 具体改动 | 验收标准 | 工作量 | 风险 |
|---|---|---|---|---|---|
| **P0-1** | 让搜索引擎能发现全部 30 篇 | 新增 `scripts/fx-seo.cjs`：① 生成 `sitemap.xml`（30 个 `/fix/*.html` + 6 壳页，`lastmod` 取 `updated`，`priority` 按 hot）；② 生成 `robots.txt`（`Allow: /` + `Disallow: /data/` + `Sitemap: https://…/sitemap.xml`）；③ 纳入 `deploy-fixboxs.cjs` L59 `ASSETS` 版本化 | `curl -sSI …/sitemap.xml` → **200**；条目数 = 30 教程 + 6 壳页；`robots.txt` → 200 且含 Sitemap 行 | 0.5–1 人日 | 低。注意 nginx 无 `.xml` 的 location ⇒ 走 `location /` 回落（L30-33），需确认 `try_files` 能命中 |
| **P0-2** | 补 canonical / og / JSON-LD | 在 `renderArticle`（L267-324）与 6 壳页注入：① `<link rel="canonical">`（绝对 URL）；② `og:title/description/url/type` + `twitter:card`；③ JSON-LD `HowTo`（教程页，用步骤 + `sources`）与 `WebSite`+`SearchAction`（首页） | 4 个页面抓取：`hasCanonical=true, hasOg=true, hasJsonLd=true`；用 Google Rich Results 测试无错误 | 1–1.5 人日 | 低。JSON-LD 必须与页面真实内容一致（方案 L753）；`HowTo` 要求步骤完整 ⇒ 复用 L203 步骤解析 |
| **P0-3** | **修复 D4**：`aliases`/`sources`/`prerequisites`/`tools`/`version`/`reviewer`/`reviewed_at` 不再被丢弃 | ① `build-fix.cjs` L356-369 扩展字段集；② `sources` 渲染为「参考资料」区块（**链接官方文档**）；③ `prerequisites`/`tools` 渲染进「开始前确认」；④ `version`/`reviewer`/`reviewed_at` 进页脚 | `data/articles.js` 含 `aliases` 30 处；教程页出现「参考资料」区块与官方链接；`prerequisites` 可见 | 1–1.5 人日 | 低。**注意**：`articles.js` 体积会涨（36.2 KB → 约 50 KB），这正是 P1-⑤ 要瘦身的动机 |
| **P0-4** | 分类字典外置 + 构建期校验 | ① 新建 `data/taxonomy.json`（从 L22-40 抽出）；② 新建 `scripts/fx-validate.cjs` 实施 V1–V6 | 删除 `build-fix.cjs` 中硬编码常量后构建仍通过；故意写一个非法 `related` slug ⇒ 构建**报错退出**（对比当前静默降级） | 1–2 人日 | 中。`related` 从"静默降级"改为"报错"可能**暴露存量死链** ⇒ 需先跑一次校验看是否 30 篇全通过（若不然，先修内容再开启强校验） |

### 5.3 P1：检索升级、聚合页、观测（可并行）

| 项 | 目标 | 具体改动 | 验收标准 | 工作量 | 风险 |
|---|---|---|---|---|---|
| **P1-⑤** | 搜索升级为**预构建分片倒排索引**（兑现《搜索与索引技术方案》§2.4 的推荐） | ① `scripts/fx-tokens.cjs`（归属索引期与查询期共用）；② `scripts/fx-index.cjs` 产出 `data/index/{manifest,docs,shard-NN}.json`（16 片）；③ `js/fx-search.js` 运行时按需 fetch 分片 + BM25；④ `articles.js` 瘦身为纯列表数据 | 首屏索引体积 ≤15 KB（当前 36.2 KB）**且不随篇数增长**；搜「0x0000007b」「netsh winsock」能命中正文；搜「断网」「没网」（aliases）能命中目标篇；300 篇模拟下首屏体积不变 | 3–5 人日 | 中高。**最大风险是归一化两端不一致** ⇒ 必须让索引期与查询期**引用同一份 token 实现**（把 `fx-tokens.cjs` 同时注入构建与运行时）；分片哈希变更需全量重建（用 `manifest.v` 保证一致性） |
| **P1-⑥** | 28 个分类聚合页（补 D5） | `scripts/fx-aggregate.cjs` 生成 `category/<key>.html`：标题/面包屑/该分类文章列表/相关领域导航/JSON-LD `CollectionPage`；`browse.html` 的 category 文字改为链接 | 28 个 URL 全部 200；从 `browse.html` 可点达；sitemap 包含这 28 条 | 1.5–2.5 人日 | 低。注意分类页会要求 nginx `try_files` 命中目录（已在 L30-33 支持） |
| **P1-⑦** | 过期复核信号（补 D8） | ① `fx-stats.cjs` 产出 `stats.json`（篇数/领域分布/待复核/最近更新）；② 构建期按 `reviewed_at` >180 天打 `stale:true`；③ 卡片与教程页显示「⚠ 本文可能需复核」徽章 | `stats.json` 字段与真实篇数一致；人工把某篇 `reviewed_at` 改到 2024 年 ⇒ 该篇出现 stale 徽章 | 0.5–1 人日 | 低 |
| **P1-⑧** | 搜索埋点（补 D6） | ① 运行时把 `{q, hits, ts}` 在 `navigator.sendBeacon` 到 `/log/q=<urlencoded>&h=<n>`；② nginx `location = /log` 返回 204 并把 query 落入 access_log；③ 构建期脚本离线聚合出「零结果词 top-N」 | `/log` 返回 204；access_log 出现记录；离线脚本能输出零结果词频表 | 1–2 人日 | **中（隐私）**。必须先在 `about.html#privacy` 更新说明"我们记录搜索词用于改进内容"，否则不应上线。风险：`sendBeacon` 需 `navigator` 存在 ⇒ 加特性检测降级 |
| **P1-⑨** | 站点级验收脚本 | `verify-fixboxs.cjs` 实施 §4.6 表；接入 `deploy-fixboxs.sh` 的 `--check` 分支 | 故意制造一个断链 ⇒ 脚本非 0 退出 | 1 人日 | 低 |

### 5.4 P2：可选增强（视需求与资源）

| 项 | 目标 | 工作量 | 前置条件 |
|---|---|---|---|
| **P2-⑩** | 向导从"评分排序"升级为"决策树"（外置 `wizard.json`） | 2–3 人日 | 需先定 `when` 条件表达式语法 |
| **P2-⑪** | 301 重定向表（`data/redirects.json` → nginx 片段或 `_redirects`） | 1 人日 | 需 nginx 配置改动权（当前脚本 L15 明示不改 nginx） |
| **P2-⑫** | 图片/截图管线（压缩 + `<img loading=lazy>`） | 2–4 人日 | **唯一真破例**：需引入压缩工具或手工压缩；建议先手工 |
| **P2-⑬** | CSP（需为内联脚本提供 nonce 或 hash） | 1–2 人日 | `build-fix.cjs` L52-65 有内联 style/script ⇒ 需改造成 hash 白名单 |

### 5.5 并行与串行关系

| 关系 | 项 |
|---|---|
| **必须先做（阻塞后继）** | P0-3（字段补全，是 P1-⑤ 的输入）、P0-4（taxonomy 外置，是 P1-⑥ 的输入）、P0-1/2（独立但应与 P0-3 同批上线，避免二次全量部署） |
| **可并行** | P1-⑤（索引）、P1-⑥（聚合页）、P1-⑦（stale）、P1-⑨（验收）互不依赖；P1-⑧ 仅依赖 `fix.js` 的搜索入口 |
| **建议串行** | P0-4 的"强校验开关"建议在修完存量死链后再打开（见 P0-4 风险） |

---

## 6. 优先级矩阵（影响 × 成本）

| 象限 | 判定 | 条目 |
|---|---|---|
| **高影响 × 低成本** → **P0** | 立刻做 | ① robots.txt + sitemap.xml（0.5–1 人日，解决"完全不可发现"）<br>② `aliases`/`sources` 字段修复（1–1.5 人日，直接提升召回与可信度）<br>③ canonical + JSON-LD + og（1–1.5 人日）<br>④ taxonomy 外置 + 校验（1–2 人日） |
| **高影响 × 中成本** → **P1** | 排期做 | ⑤ 分片倒排索引（3–5 人日，解决正文召回与规模解耦）<br>⑥ 分类聚合页 ×28（1.5–2.5 人日，补长尾落地页）<br>⑨ 验收脚本（1 人日） |
| **低影响 × 低成本** → **P1/P2** | 顺手做 | ⑦ 过期复核徽章（0.5–1 人日）<br>⑩ 向导外置（含在 ⑩ 的前置工作里） |
| **中影响 × 中成本** → **P2** | 视资源 | ⑧ 搜索埋点（1–2 人日，需先补隐私声明）<br>⑪ 301 重定向表（1 人日，需 nginx 权限） |
| **低影响 × 高成本** → **不做** | 排除 | AI 问答、图片管线（暂缓）、CSP（暂缓）、CMS、后台、数据库、微服务、Pagefind |

### 6.1 P0/P1/P2 汇总

| 级别 | 条目 | 合计工作量 | 交付价值 |
|---|---|---|---|
| **P0** | 4 项 | **4–6 人日** | 站点从"搜索引擎不可见"变为"完整可索引"；召回率显著提升；内容管线有校验 |
| **P1** | 5 项 | **7–11.5 人日** | 检索达到设计文档既定目标（首屏体积与篇数解耦 + 正文召回）；补 28 个落地页；有观测与验收 |
| **P2** | 4 项 | **6–10 人日** | 体验与安全增强，非阻塞 |
| **总计（P0+P1）** | **9 项** | **11–17.5 人日** | 对比方案路线 A 的"5–10 人日只够起步且需引入服务端" |

---

## 7. 不做什么（明确排除项与理由）

| # | 排除项 | 理由 | 若将来要做的前提 |
|---|---|---|---|
| N1 | **管理后台（CMS UI）** | 无后端/DB/认证前提；8 菜单后台对 30 篇内容是过度设计（§1.2-1）；Git 已提供版本/审核/权限（§3.1 理由 3） | 「非技术人员必须网页发稿」成为硬需求且价值 > 运维成本 ⇒ 走路线 B |
| N2 | **数据库 + ORM（PostgreSQL/Prisma）** | 唯一数据源是 394 KB Markdown；引入 DB 会使"备份/恢复/部署"复杂度上升一个数量级，而当前 Git 备份已优于方案要求（§1.8-2） | 出现多用户并发写入、结构化诊断规则需动态查询 |
| N3 | **RBAC / 用户体系 / 登录** | 无受保护资源、无写入入口（§1.2-7） | 同上 |
| N4 | **文件上传与附件中心** | 无上传入口 ⇒ 无攻击面；教程当前零图片（§1.3-6） | 引入图片管线的同时评估（P2-⑫） |
| N5 | **AI 问答 / AI 辅助** | **纯静态无后端 ⇒ 前端直连 LLM 必然暴露密钥**，与"零第三方脚本"冲突；方案自身也要求"不自动发布 AI 内容"（L814） | 需先建受控代理服务端（即路线 A/B），且必须先解决密钥与成本 |
| N6 | **Pagefind / 第三方搜索运行时** | 分词不可控、无同义词层、需 Rust 二进制入构建链（设计文档 §2.3 P2/P3/P5 已逐条论证） | 若放弃自研分词（即接受召回率损失） |
| N7 | **微服务 / 容器化 / 构建工具链** | 无服务端；`package.json` 不存在；方案自身 L1243 也反对"一开始就部署微服务集群" | 规模与团队显著扩张 |
| N8 | **前端框架替换（Next.js 等）** | 违背零依赖硬约束；30 篇静态内容无此必要；方案自估也是"优先保留当前框架"（L562） | 出现强交互产品需求（如账号化诊断历史） |
| N9 | **重写现有 6 个壳页与 30 篇教程的展示层** | 现有展示层已达方案 6.2 的 11/14 项要求（§1.6-2）；重写是纯风险 | 不必要 |
| N10 | **页面级 A/B 测试、个性化排序** | 无统计基础（N5/§1.6-5）；且需先有 P1-⑧ 的事件数据 | 先做 P1-⑧，积累 1–2 个月数据 |
| N11 | **改 nginx 配置（由本仓库脚本自动完成）** | `deploy-fixboxs.sh` L15 明确"本脚本不改动 nginx 配置"；配置有独立备份路径（README L152） | 需 nginx 改动时必须人工执行 + `nginx -t` 再 reload |
| N12 | **自动图片格式转换/压缩入构建链** | 唯一真破例点（引入外部工具）；当前零图片，成本不划算 | 图片数 > 50 张时再评估 |

---

## 附录 A：本评审与外部方案的结论对照

| 议题 | 外部方案 | 本评审 | 一致性 |
|---|---|---|---|
| 首要任务 | P0 审计（2–4 人日） | 审计 + **立即执行 SEO 补全（P0）** | 部分一致（本评审认为审计不必独占一阶段） |
| 核心建设对象 | 管理后台 + 内容管理闭环 | **检索 + SEO + 聚合页 + 校验** | ❌ 分歧 |
| 架构路线 | A > B > C | **D（增强静态管线）** | ❌ 分歧（方案缺 D 这个选项） |
| 内容工作流 | 自建状态机（7 态）+ RBAC | **Git branch/PR/merge** | ⚠️ 目标一致、载体不同 |
| 搜索 | 未展开（方案未涉及检索架构） | **分片倒排索引**（沿用已有设计文档 §2.4） | ➕ 本评审补充 |
| SEO | 第六章泛泛列出 | **列为 P0，逐项可验收** | ⚠️ 方案有列但未给优先级 |
| 部署备份 | 8 步清单 + DB/文件备份 | **已达标，无需改** | ⚠️ 方案在描述本站现状 |
| AI | P4 后续阶段 | **明确排除** | ⚠️ 方案更乐观 |
| 工作量 | P1 后台 5–10 人日 | P0+P1 共 11–17.5 人日（**无服务端**） | — |

## 附录 B：主要异议（对外部顾问方案的 5 点）

1. **路线枚举缺失关键选项。** 方案 A/B/C 三条路线全部预设"已有可扩展应用"。当项目是零依赖纯静态站时，三选项里**没有正确答案**，导致推荐结论（A 为首选）在本项目上是错的。应补路线 D 并作为首选。
2. **把"没有的东西"当成"要建的东西"。** 方案第五、六、八章大量描述本站**已经实现**的能力（内容模板、元数据、风险分级、验证时间、部署回滚、安全头）为"建议实现"，这会误导执行者重复造轮子。审计的价值恰恰是先排除这些。
3. **忽略了本站已有的、精度极高的设计文档。** `docs/pc-fixboxs.yuanabd.cn-搜索与索引技术方案.md`（1462 行）已经把检索架构论证到"16 片分片 + BM25 + 双端同源分词"的颗粒度，并明确推荐方案②。外部方案对此**完全未提及**，反而把搜索写成一句"数据库全文检索起步"——这是**能力回退**。
4. **SEO 章节有清单无优先级。** 方案把 SEO 放在 P3（前台体验）里，与"移动端排版优化"同级，且用"建议"措辞。但对一个**当前 robots/sitemap 全部 404**的站点，SEO 是**P0 且单项收益最大**——搜索引擎此刻完全发现不了这 30 篇内容。
5. **工作量估算的前提未披露。** 方案 P1 估 5–10 人日，但其自身清单包含"数据库+权限+上传+统一 API+前后台改造"，历史经验上这是 30+ 人日量级。**低估会让决策者做出错误取舍**，把本该投在检索/SEO 的预算投进后台。

---

## 附录 C：本评审新增发现（原方案与现有设计文档均未覆盖）

| # | 发现 | 证据 | 影响 |
|---|---|---|---|
| F1 | `aliases` 字段被构建脚本丢弃，完全不参与检索 | `data/articles.js` 中 `"aliases"` 匹配 0 处；`build-fix.cjs` L356-369 | 口语召回主力缺失（对应 D4） |
| F2 | `sources`（官方来源）有数据但不渲染 | 30/30 篇有 `sources`，页面无输出 | 可信度与 E-E-A-T 损失（D11） |
| F3 | `CHANGELOG.md` L44 声称"三站补齐 robots.txt/sitemap.xml"，fixboxs 站实测均 404 | 线上 web_fetch | **文档与现实的偏差**，需修正 CHANGELOG 或补做 |
| F4 | `related` 引用不存在的 slug 时**静默降级**为搜索链接 | `build-fix.cjs` L262-263 | 掩盖内容错误，是 D7 校验缺位的直接后果 |

---

## 附录 D：待项目负责人确认的问题

| # | 问题 | 为什么需要你决定 |
|---|---|---|
| Q1 | 是否接受**路线 D**（不建后台），还是确有"非技术人员网页发稿"的硬需求？ | 决定整个方案走向；若是后者，需重估路线 B 的运维成本 |
| Q2 | P0 的 4 项是否立即排期？ | SEO 缺口每天在损失自然流量 |
| Q3 | 搜索埋点（P1-⑧）是否接受？需先更新 `about.html#privacy` 的隐私说明 | 涉及隐私声明合规 |
| Q4 | 是否授权修改 nginx 配置（用于 301 重定向 P2-⑪）？ | 当前部署脚本明确不改 nginx |
| Q5 | 内容补齐到多少篇？是否有季度复核人力？ | 决定 P1-⑦ stale 阈值与是否值得立刻上分片索引 |
| Q6 | `mac-system` 领域 0 篇（README L92 自认缺口）是否优先补？ | 影响 browse.html 该领域的空态体验 |

---

*本文档为评审草稿，所有"现状判定"均基于 2026-10-12 的仓库与线上实测。标注「未核实」的项（D13）需实机验证后补全。*
