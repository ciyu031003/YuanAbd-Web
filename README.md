# YuanAbd-Web

YUAN.ABD 门户与项目落地页（纯静态，单文件内联，无构建步骤）。

## 站点结构

| 本地文件（`demo/`） | 线上地址 | 服务器路径 |
|---|---|---|
| `index.html` | https://www.yuanabd.cn/ | `/var/www/yuanabd/` |
| `learn.html` + `download.html` | https://learn.yuanabd.cn/ | `/var/www/learn-landing/` |
| `travel.html` + `js/travel-download.js` 等 | https://travel-notes.yuanabd.cn/ | `/var/www/travel-landing/` |

后端应用（Docker，与本仓库无关）：learn-workbench(:3001)、travel-notes(:3000)，由 nginx 反代。

## 本地预览

```bash
cd demo && node serve.cjs   # http://localhost:8080
```

## 部署

```bash
# 门户（本次重构的站点）
scp demo/index.html travel-notes:/var/www/yuanabd/index.html
```

落地页同法。部署前先 `git commit`，不要在服务器上直接改文件；不再使用 `.bak` 备份（版本管理走 git）。

## 服务器 nginx 要点（2026-09-03 加固）

- 全站 HTTP/2 + HSTS + `X-Content-Type-Options`/`Referrer-Policy`/`X-Frame-Options`
- 全局 gzip（css/js/svg/json/webp/woff2），静态资源 30d 长缓存（css/js 用 `?v=` 版本号刷新）
- `location ~* \.bak { deny all; }` 屏蔽备份文件泄露
- 配置备份：服务器 `/var/www/backups/nginx-20260903/`
