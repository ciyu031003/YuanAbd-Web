# YuanAbd-Web

YUAN.ABD 门户与项目落地页（纯静态；门户 `index.html` 为单文件内联形态，改源文件后需重新构建，见下文）。

## 站点结构

| 本地文件（`demo/`） | 线上地址 | 服务器路径 |
|---|---|---|
| `index.html` | https://www.yuanabd.cn/ | `/var/www/yuanabd/` |
| `learn.html` + `download.html` + `privacy.html` + `css/` + `js/` | https://learn.yuanabd.cn/ | `/data/learn-workbench/landing/` |
| `travel.html` + `css/` + `js/` 等 | https://travel-notes.yuanabd.cn**/portal/** | `/var/www/travel-landing/` |
| （子站，独立部署） | https://pc-fixboxs.yuanabd.cn/ | 不在本仓库部署链路内；门户 03 节做介绍章节 + 入口跳转 |

> **甜途门户已迁到 `/portal/` 子路径**（2026-09 起）：`travel-notes.yuanabd.cn/`
> 根路径由 Next.js 应用（Docker :3000）接管，门户通过 nginx 的
> `location ^~ /portal/ { alias /var/www/travel-landing/; }` 暴露。
> 门户内资源为相对路径（`./css/...`），因此经 `/portal/` 访问会自动落到
> `/portal/css/...`，无需改动 HTML。

后端应用（Docker，与本仓库无关）：learn-workbench(:3001)、travel-notes(:3000)，由 nginx 反代。

## 样式分层（UI-REFACTOR-PLAN.md）

```
demo/css/tokens.css        设计令牌（primitive + semantic），三站共享
demo/css/base.css          Reset + 兼容令牌 + 基础组件层
demo/css/components.css    精美组件层（按钮/卡片/控件/容器/降级路径）
demo/css/theme-*.css       站点主题映射（portal / learn / travel）
demo/<site>.css            站点样式
demo/<site>-sunny.css      站点历史覆盖层
demo/index-portal.css      门户自有样式（修盒子章节 .fx-* / .btn--fix / .fcard--fix）
demo/js/ui.js              组件层交互（零依赖、渐进增强）
```

`<link>` 顺序固定为 **tokens → base → components → 站点 → 覆盖层 → 主题**。

门户 `index.html` 保持**单文件内联**形态：`tokens.css` / `index-portal.css` /
`components.css` / `ui.js` 由构建脚本内联进 HTML，改完源文件必须重新构建：

```bash
node build-portal.cjs         # 重新内联
node build-portal.cjs --check # 校验产物与源文件是否同步
```

## 修盒子（pc-fixboxs）内容

| 内容 | 源 | 产出 |
|---|---|---|
| 故障教程与指南 81 篇 | `content/fixboxs/*.md` | `demo/fixboxs/fix/*.html` + `data/articles.js` |
| **参考资料 10 篇（SOP）** | `content/fixboxs/sop-*.md`，由 `content/sop-source/` 生成 | 同上，带「参考 SOP」标识 |
| 分类字典 | `content/taxonomy.json` v1.8（故障 12 领域 + 参考 1 领域「装机与运维手册」，共 13 领域） | 后台下拉框与构建共用 |
| 媒体库上传 | 服务器 `demo/fixboxs/media/`（**不入库**，已 gitignore） | 随发布产物上线，不经 git |

合计 **13 个领域 · 91 篇教程**（与线上 `data/articles.js` 一致）。

```bash
node content-lint.cjs        # 内容校验（V1–V15，失败非零退出）
node build-fix.cjs           # 构建站点产物
node content/sop-source/import-xlsx.cjs <SOP.xlsx>   # 校验 SOP 表格与 catalog 一一对应
node content/sop-source/gen.cjs                      # 由 catalog 重新生成 SOP 参考资料（现 10 篇）
```

SOP 资料为什么单独维护、怎么更新，见 [content/sop-source/README.md](content/sop-source/README.md)。

> **门户口径同步**：门户 `demo/index.html` 里修盒子的数字是硬编码的——03 节描述
> 与 chips、右栏浮动徽章（13 DOMAINS）、JSON-LD、NOW 列表、页脚 `fcard--fix`、
> marquee 数据带。每批内容上线后要同步改这些数字并重新构建门户。

## 苦旅 KuLv（learn.yuanabd.cn · Learn-Workbench）

**仓库**：[ciyu031003/Learn-Workbench](https://github.com/ciyu031003/Learn-Workbench)（独立仓库，不在本仓库部署链路内）

求职与学习全栈工作台：多职业学习路线图、每日任务与专注计时、习惯与健康、求职工作台（招聘信息每日抓取 + 面试题库 + 简历管理）、SM-2 间隔复习、运动档案；**Web（Next.js 16 + React 19 + PostgreSQL 16，Docker :3001）+ Android（Expo，签名 OTA 应用内升级）** 双端云端同步。

| 门户引用 | 位置 | 状态 |
|---|---|---|
| 五本手册：市场雷达 / 题库路线图 / 看板 / 就绪度 | 01 节 feat + chips + mock | 产品叙事口径 |
| 20 个数据源 · 每日自动抓取 | marquee + NOW 卡 `data-count="20"` | ✅ 2026-10-31 按生产库 `job_postings` 实测（20 个 source）更新 |
| v1.0.0 · LIVE / WEB + ANDROID | 01 节 chips | 版本以 Learn-Workbench 仓库为准 |

落地页 = 本仓库 `demo/learn.html`（+ `download.html` / `privacy.html` / 共享 css/js），部署见「部署」一节第 2 步；应用本体由 Learn-Workbench 仓库自行发布（Docker Compose + GHCR 镜像 + 一键回滚）。

## 甜途 TIAN TU（travel-notes.yuanabd.cn · Travel-Notes）

**仓库**：[ciyu031003/Travel-Notes](https://github.com/ciyu031003/Travel-Notes)（独立仓库）

个人旅行记忆空间：旅行记录（Travel → TravelDay → 行程项 → 花费闭环）、交互式中国地图（d3-geo）、相册（复古像素 / 银河星空双视觉）、护照式记忆档案、旅行圈（Masonry Feed + 点赞评论收藏）、多人旅行空间（RBAC 协作）、全功能后台；**Web（Next.js 15 + MySQL/Prisma，Docker :3000）+ Android（Capacitor，SQLite 离线 + 同步队列）**。

| 门户引用 | 位置 | 状态 |
|---|---|---|
| 足迹地图 / 城市画册 / 相册同步 / 旅行圈 | 02 节 feat | 产品叙事口径 |
| 7 座城市已收录 | 02 节 chips + NOW 卡 `data-count="7"` + marquee | ✅ 2026-10-31 三处统一为 7（口径 = 画廊北京/上海/杭州 + 生产库广州/乌鲁木齐/博尔塔拉/喀什，去重合计 7） |

落地页 = 本仓库 `demo/travel.html`，线上入口 `travel-notes.yuanabd.cn/portal/`（nginx alias `/var/www/travel-landing/`，见顶部说明）；应用本体由 Travel-Notes 仓库自行发布。

## 本地预览

```bash
cd demo && node serve.cjs   # http://localhost:8080
```

- 本地服务器对全部资源返回 `no-store`，改完源码刷新即生效
- 需要逐像素比对时加 `?test=1`（冻结动效与揭示态，保证截图确定性）

## 部署

```bash
# 1) 门户（单文件；scp 直接覆盖亦可，推荐下面这种「备份 → .new → 原子替换」流程）
ssh travel-notes 'cp -p /var/www/yuanabd/index.html ~/portal-bak/yuanabd-index.html.bak-$(date +%Y%m%d)'
scp demo/index.html travel-notes:/var/www/yuanabd/index.html.new
ssh travel-notes 'chmod 644 /var/www/yuanabd/index.html.new && chown ubuntu:ubuntu /var/www/yuanabd/index.html.new && mv -f /var/www/yuanabd/index.html.new /var/www/yuanabd/index.html'

# 2) 苦旅（注意：nginx root 是 /data/learn-workbench/landing，不是 /var/www/learn-landing）
scp demo/learn.html demo/download.html demo/privacy.html travel-notes:/data/learn-workbench/landing/
scp demo/css/tokens.css demo/css/base.css demo/css/components.css \
    demo/css/theme-learn.css demo/css/learn.css demo/css/learn-sunny.css \
    travel-notes:/data/learn-workbench/landing/css/
scp demo/js/ui.js travel-notes:/data/learn-workbench/landing/js/

# 3) 甜途（根落地页；线上入口为 /portal/）
scp demo/travel.html travel-notes:/var/www/travel-landing/travel.html
scp demo/css/tokens.css demo/css/base.css demo/css/components.css \
    demo/css/theme-travel.css demo/css/theme-portal.css \
    demo/css/travel.css demo/css/travel-sunny.css \
    travel-notes:/var/www/travel-landing/css/
scp demo/js/ui.js travel-notes:/var/www/travel-landing/js/
```

部署前先 `git commit`，不要在服务器上直接改文件；web root 内不留 `.bak`
（nginx 已屏蔽 `\.bak`，版本管理走 git），发布前旧文件备份到服务器
`~/portal-bak/`（既有惯例，目录不在 web root 内）。
部署后快速验证：`curl -s https://www.yuanabd.cn/ | grep -c "13 个领域"` 之类的口径词。
> 三个站点的 nginx `root`：www → `/var/www/yuanabd/`、learn → `/data/learn-workbench/landing/`、
> travel → `/var/www/travel-landing/`（线上入口 `/portal/`）。

### 缓存

nginx 对 `.js/.css/.json/图片` 配了长缓存，因此**本地引用需带版本号**：

```bash
node .tmp-shots/bump-asset-versions.cjs 20261001a   # 给 html 里的本地 css/js 引用打版本
```

门户 `index.html` 为单文件内联，不经过该流程。

## 服务器 nginx 要点（2026-09-03 加固）

- 全站 HTTP/2 + HSTS + `X-Content-Type-Options`/`Referrer-Policy`/`X-Frame-Options`
- 全局 gzip（css/js/svg/json/webp/woff2），静态资源 30d 长缓存（css/js 用 `?v=` 版本号刷新）
- `location ~* \.bak { deny all; }` 屏蔽备份文件泄露
- 配置备份：服务器 `/var/www/backups/nginx-20260903/`
- 发布前备份：`/var/www/backups/ui-refactor-<stamp>/`（本次 UI 重构引入）
