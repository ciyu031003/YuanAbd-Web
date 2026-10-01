# YuanAbd-Web

YUAN.ABD 门户与项目落地页（纯静态，无构建步骤）。

## 站点结构

| 本地文件（`demo/`） | 线上地址 | 服务器路径 |
|---|---|---|
| `index.html` | https://www.yuanabd.cn/ | `/var/www/yuanabd/` |
| `learn.html` + `download.html` + `privacy.html` + `css/` + `js/` | https://learn.yuanabd.cn/ | `/data/learn-workbench/landing/` |
| `travel.html` + `css/` + `js/` 等 | https://travel-notes.yuanabd.cn**/portal/** | `/var/www/travel-landing/` |

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
demo/js/ui.js              组件层交互（零依赖、渐进增强）
```

`<link>` 顺序固定为 **tokens → base → components → 站点 → 覆盖层 → 主题**。

门户 `index.html` 保持**单文件内联**形态：`tokens.css` / `components.css` /
`ui.js` 由构建脚本内联进 HTML，改完源文件必须重新构建：

```bash
node build-portal.cjs         # 重新内联
node build-portal.cjs --check # 校验产物与源文件是否同步
```

## 本地预览

```bash
cd demo && node serve.cjs   # http://localhost:8080
```

- 本地服务器对全部资源返回 `no-store`，改完源码刷新即生效
- 需要逐像素比对时加 `?test=1`（冻结动效与揭示态，保证截图确定性）

## 部署

```bash
# 1) 门户（单文件）
scp demo/index.html travel-notes:/var/www/yuanabd/index.html

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

部署前先 `git commit`，不要在服务器上直接改文件；不用 `.bak` 备份（版本管理走 git）。
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
