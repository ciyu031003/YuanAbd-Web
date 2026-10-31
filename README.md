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
