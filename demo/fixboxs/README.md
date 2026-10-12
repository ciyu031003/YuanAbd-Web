# 修盒子 FIXBOX · 站点 Demo

> **线上地址：<https://pc-fixboxs.yuanabd.cn/>（已部署，2026-10-12 上线）**
>
> 本站同时是仓库内的 Demo 源；部署产物由 `deploy-fixboxs.cjs` 生成到 `dist/fixboxs/`，用 `deploy-fixboxs.sh` 一键发布。
> 对应设计文档：`docs/pc-fixboxs.yuanabd.cn-门户网站设计方案.md`

---

## 1. 本地预览

```bash
# 在仓库根目录
node demo/serve.cjs          # http://localhost:8080/fixboxs/
```

打开 <http://localhost:8080/fixboxs/> 即可（目录式 URL 会自动落到 `index.html`）。

> 若提示 `ERR_CONNECTION_REFUSED`，说明预览服务器没在运行——重新执行上面的 `node demo/serve.cjs`。
> 该命令会一直占用当前终端窗口，**不要关掉它**；换一个终端查代码即可。

> `demo/serve.cjs` 对全部资源返回 `no-store`，改完源码刷新即生效。

---

## 2. 目录结构

```
demo/fixboxs/
├─ index.html            首页（搜索优先 + 领域网格 + 热门 + 向导入口）
├─ browse.html           全部 12 个领域（按领域分组列出教程）
├─ search.html           搜索结果页（?q= 直达 + 系统/风险筛选）
├─ wizard.html           症状向导（7 问 → 推荐 1-3 篇）
├─ tools.html            命令速查（Windows / macOS 只读命令，可复制）
├─ about.html            关于 / 免责声明 / 隐私说明 / 纠错反馈
├─ fix/<slug>.html       教程页（由 build-fix.cjs 从 content/ 生成，勿手改）
├─ data/articles.js      列表与搜索索引数据（构建产物，勿手改）
├─ css/theme-fix.css     本站主题映射（薄荷绿 + 风险三色）
├─ css/fix.css           本站站点样式（组件 + 响应式 + 打印）
└─ js/fix.js             零依赖交互（搜索 / 步骤 / 复制 / 目录 / 向导 / 收藏）
```

共享层（不复制、不修改）：`demo/css/tokens.css`（设计令牌）。

---

## 3. 构建

教程源文件是 Markdown（`content/fixboxs/*.md`，front-matter + 固定 10 段），需要构建成 HTML：

```bash
node build-fix.cjs          # 生成 fix/<slug>.html 与 data/articles.js
```

改完 `content/` 下的任何 Markdown **必须重新执行**，否则页面不会更新。

---

## 4. 已实现的交互（零依赖、渐进增强）

| 能力 | 触发方式 | 降级行为 |
|---|---|---|
| 即时搜索 | 首页/搜索页输入框，200ms 防抖 | JS 失效时表单 GET 提交到 `search.html` |
| 快捷键 | `/` 或 `Ctrl/⌘ + K` 聚焦搜索 | — |
| 搜索下拉键盘操作 | `↑ ↓` 选择、`Enter` 进入、`Esc` 关闭 | — |
| 结果高亮 | 命中词自动 `<mark>`（支持标点错位的回溯映射） | 不高亮，内容仍在 |
| 步骤勾选 + 进度 | 教程页每步右上角按钮，写入 localStorage | 按钮不显示，步骤内容照常阅读 |
| 命令复制 | 每个代码块右上角「复制」 | 按钮不显示，可手动选中 |
| 本页目录高亮 | 教程页右侧 TOC，随滚动高亮 | 静态目录，仍可点击跳转 |
| 收藏 | 教程页「☆ 收藏」，存 localStorage | 无 |
| 症状向导 | `/wizard.html`，7 问分支，纯前端评分排序 | 无 JS 时给出「去搜索 / 按领域浏览」链接 |

---

## 5. 设计要点（与设计文档一致）

| 项 | 实现 |
|---|---|
| 主色 | 薄荷绿 `#91E6C1` 只做「面」；文字链接用深阶 `#12805F`（暖白底 4.83:1 ✅ AA） |
| 风险三级 | 安全 `#12805F` / 需谨慎 `#B45309` / 有数据风险 `#C2410C`，**颜色 + 图标形状 + 文字标签**三重表达 |
| 正文 | 17px / 行高 1.75 / 行宽 ≤ 760px |
| 触控 | 所有按钮 ≥44px；`prefers-reduced-motion` 全站降级 |
| 打印 | `@media print` 隐藏导航与页脚、展开全部步骤，便于打印后照着修 |
| 无第三方依赖 | 无 npm 包、无框架、无外部 CDN、无统计脚本 |

---

## 6. 待办（评审通过后）

- [ ] 站点部署：证书签发 + nginx server 块 + `/var/www/fixboxs`（见设计文档 §8.3）
- [ ] 搜索升级：当前 Demo 用前端小索引；正式版按《搜索与索引技术方案》做预构建分片倒排索引
- [ ] 补 `mac-system` 领域教程（首批 30 篇未覆盖）
- [ ] 内容补齐到 150+ 篇，并建立季度复核机制
- [ ] 深色模式（Phase 4）

---

## 7. v2「青春活泼」升级说明（2026-10-11）

参考站点：**StrategyBreakdowns**（奶油纸底 + 墨色描边 + 蓝图手绘虚线连线）、**SiteQuest**（沉浸式加载动画 + 高饱和色块）、**DesignBookmark**（卡片网格 + 悬浮预览）。
素材清单见 `docs/pc-fixboxs.yuanabd.cn-素材库与动效清单.md`。

### 7.1 视觉语言

| 项 | v1 | v2 |
|---|---|---|
| 底色 | 暖白 `#FFFDF7` | 奶油纸 `#FBF6EC` + 极淡蓝图点阵 |
| 描边 | 1px 半透明灰，靠阴影分层 | **1.5px 墨色描边 + 硬阴影（offset shadow）**，hover 时卡片上浮并「推」出投影 |
| 主色 | 薄荷绿单色 | 五色活泼色板：薄荷 / 珊瑚 / 薰衣草 / 阳光黄 / 天蓝，按领域分配 |
| 标题 | 常规粗体 | 800 字重 + 负字距 + 黄色手绘标记（Hero） |
| 页脚 | 浅灰底 | **墨色块**（StrategyBreakdowns 式） |
| 装饰 | 无 | Hero 漂浮几何图形（黄圆 / 珊瑚圆 / 天蓝点 / 旋转虚线方框） |

**色彩铁律**：高饱和色只做「面」，文字一律用深阶。所有深阶色在纸底 / 次级底 / 白卡三种底上均实测 ≥4.5:1（见 `theme-fix.css` 注释）。

### 7.2 动效系统

| 层级 | 效果 | 实现 |
|---|---|---|
| 页面级 | **沉浸式加载动画**：薰衣草满屏 + 旋转虚线环 + 修字脉冲 + 三色轨道点 + 微光文字 + 进度条 | `[data-fx-preloader]`，每会话仅一次；`prefers-reduced-motion` 下直接跳过 |
| 页面级 | **页面转场**：点击内链 → 幕布上推盖住 → 跳转 → 新页幕布推走 + 内容上浮淡入 | `<head>` 内联脚本三态（`fx-first` / `fx-entering` / `fx-leaving`）+ `sessionStorage`；`pageshow.persisted` 复位 bfcache |
| 区块级 | **滚动错落入场**：同组元素按 55ms 递增延迟浮现 | `[data-reveal]` + IntersectionObserver；**3.5s 兜底强制显示**，任何情况下内容不会永久不可见 |
| 组件级 | 卡片 / 按钮 hover 上浮 + 硬阴影推进；领域图标旋转；导航下划线生长 | CSS transform + 弹簧缓动 `cubic-bezier(.34,1.56,.64,1)` |
| 微交互 | 步骤勾选、命令复制反馈、搜索下拉弹出、向导题目切换、TOC 高亮 | 各自独立，互不依赖 |

### 7.3 内容页升级

- **蓝图虚线连线**：主要段落之间用「虚线 + 箭头」连接（`.fx-connector`），呼应排障的「流程」语义；
- 结论卡 / 速查卡改为带硬阴影的色块卡（薄荷 / 阳光黄），风险色与之统一；
- 步骤时间轴改为**虚线轨道 + 方形序号块**，完成后轨道变实线、序号块变薄荷并显示 ✓；
- 新增 `- [ ]` 任务清单渲染（方框 + 文字），用于「开始前确认」；
- 表格、代码块、折叠「失败怎么办」全部重做描边与层次。

### 7.4 已知取舍

- 加载动画每会话只播一次（用 `sessionStorage`），避免每次翻页都被打断；
- 转场用「幕布」而非跨文档 View Transitions：后者兼容性仍不足，已按渐进增强预留；
- 动效全部只动 `transform` / `opacity` / `filter`，不触发布局。

---

## 8. 部署（已上线）

| 项 | 值 |
|---|---|
| 线上地址 | <https://pc-fixboxs.yuanabd.cn/> |
| 服务器 | 腾讯云 `106.55.2.197`（与其余三站同机） |
| 部署目录 | `/var/www/fixboxs`（上一版保留在 `/var/www/fixboxs.prev`） |
| nginx 配置 | `/etc/nginx/sites-available/fixboxs`（软链到 `sites-enabled`） |
| 安全头片段 | `/etc/nginx/snippets/fixboxs-sec.conf` |
| 证书 | Let's Encrypt，`/etc/letsencrypt/live/pc-fixboxs.yuanabd.cn/`，自动续期 |
| nginx 备份 | `/var/www/backups/nginx-fixboxs-<stamp>/` 与 `/var/www/backups/fixboxs.conf.<stamp>` |

### 一键发布

```bash
bash deploy-fixboxs.sh          # 构建 → 上传 → 原子切换 → 线上校验
bash deploy-fixboxs.sh --check  # 只构建并自检，不上传
```

脚本做四件事：
1. `node deploy-fixboxs.cjs` 生成自包含产物（复制 `tokens.css`、按内容哈希给 css/js 打 `?v=`）；
2. 打包上传到服务器 `/tmp`；
3. 解包到 `/var/www/fixboxs.new` 后**原子切换**，旧版移到 `.prev` 便于回滚；
4. 校验 6 个关键 URL 的 HTTP 状态与安全响应头，任一不为 200 即失败退出。

### 部署要点（踩过的坑）

- **产物必须自包含**：仓库内引用 `../css/tokens.css`，直接上传会 404；构建期复制并改写为 `./css/tokens.css` / `../css/tokens.css`。
- **缓存与版本号绑定**：静态资源设 `max-age=2592000, immutable`，因此构建期必须给引用打 `?v=<内容哈希>`，否则更新后用户会拿到旧样式。
- **nginx 的 `add_header` 会覆盖**：location 内只要写了 `add_header`，server 级的所有 `add_header` 都会失效——所以安全头放在 `snippets/fixboxs-sec.conf` 里，每个 location 各自 `include`。
- **`http2` 指令需要 nginx ≥ 1.25**：本机是 1.24，必须写成 `listen 443 ssl http2;`。配置改动一律先 `nginx -t` 再 `reload`（测试失败时 reload 会被中止，线上不受影响）。
