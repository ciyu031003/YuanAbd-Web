# DESIGN-SYSTEM.md — YUAN.ABD 三门户统一设计系统

> 依据：《YUAN.ABD 三门户网站整体视觉与 UI 重构实施方案》Phase 1（§3 / §4 / §8）
> 三站共享品牌 DNA，但拥有不同产品性格。
> 目标：从 Dark / Cold / Editorial → Sunny / Fresh / Playful / Editorial

## 1. 色彩令牌（Color Tokens）

### 1.1 品牌色（三站共享）
| Token | 值 | 用途 |
|---|---|---|
| `--warm-white` | `#FFFDF7` | 大面积背景 |
| `--sun-yellow` | `#FFD84D` | 品牌记忆点 / 主站主强调 |
| `--sky-blue` | `#79CFFF` | 科技 / 成长（Learn 主强调） |
| `--mint` | `#91E6C1` | 状态 / 正向反馈 |
| `--coral` | `#FF9278` | 情绪 / CTA（Travel 主强调） |
| `--lavender` | `#A995FF` | 小面积视觉彩蛋 |

### 1.2 文字色
| Token | 值 | 用途 |
|---|---|---|
| `--text-primary` | `#18202A` | 主文字 |
| `--text-secondary` | `#5C6673` | 次文字 |
| `--text-muted` | `#8A939E` | 弱文字 / 说明 |

### 1.3 三站视觉差异（§8）
| 项目 | YUAN.ABD | Learn | Travel |
|---|---|---|---|
| 主色 | 暖白 + 黄 | 蓝 + 黄 | 天空蓝 + 橙 |
| 气质 | 阳光 / 创造 | 成长 / 行动 | 自由 / 记忆 |
| Hero | 太阳 / 品牌 | Career Journey | 地图 / 照片 |
| 字体 | 大胆表现型 | 清晰现代 | 编辑式 |
| 动效 | 漂浮 / 微视差 | 路径 / 进度 | 地图 / 图片 |
| CTA | Explore | Start Journey | Start Recording |

## 2. 排版（Typography）
- 中文：Noto Sans SC（正文）；Hero 可配合 Noto Serif SC / Display 字体
- 英文：Space Grotesk / Inter / Plus Jakarta Sans
- H1：64–112px（Desktop）→ 44–64px（Mobile）
- H2：44–72px（Desktop）→ 32–44px（Mobile）
- H3：28–40px
- Body：16–20px（Mobile 16–18px）
- Caption：12–14px

## 3. 圆角（Radius）
| Token | 值 |
|---|---|
| Small | 8px |
| Medium | 16px |
| Large | 24px |
| Hero | 32px |

## 4. 阴影（Shadow）
- 禁止厚重投影；优先 软阴影 / 边框 / 色块 / 轻量 offset shadow。
- Card：`0 24px 60px -30px rgba(24,32,42,.18)` + 1px 边框。
- 按钮：hover 轻量 translate(-2px) + 色块阴影。

## 5. 栅格（Grid）
- Desktop：1200–1440px 上限，12 列
- Tablet：768px，8 列
- Mobile：单列 / 4 列
- 页面节奏：视觉锚点 → 内容区 → CTA → 下一段

## 6. 组件规范
### 6.1 Button
- 主按钮：品牌色实心（主站黄 / Learn 蓝 / Travel 橙），圆角 999px 或 16px，触控区 ≥44px
- 次按钮：描边（1px, `--text-secondary` 40%）
- Focus：2px outline + 3px offset

### 6.2 Card
- 圆角 16–24px；背景 `#FFFFFF` 或 `rgba(255,255,255,.8)`；1px 边框；软阴影
- 每站卡片统一使用本站强调色，禁止每个卡片不同色

### 6.3 Navigation（统一 Brand Shell）
- Logo 位置统一（左上 YUAN.ABD / 产品名）
- CTA 位置统一（右上）
- 产品切换：主站链接 Learn / Travel；产品站链接「回到 YUAN.ABD」
- Mobile Menu 逻辑统一

### 6.4 Footer（统一）
- YUAN.ABD + 两产品链接 + GitHub/Email + © 2026 YUAN.ABD · Built with curiosity
- 产品站可增加 Product / Features / Login

## 7. Motion（§10）
- 原则：Motion should explain, not decorate
- Hero reveal 0.6–1.0s；标题分段出现；背景缓慢漂移
- Scroll：section reveal、图片 scale、数字 count-up、路径绘制
- Hover：translate / scale 1.02–1.04 / 阴影变化
- 禁止：超长加载动画、无限旋转、高频粒子、大量 WebGL、强制视频
- 必须支持 `@media (prefers-reduced-motion: reduce)`

## 8. 工程要求
- 图片：WebP / AVIF、lazy loading、Hero 优先加载
- 动效：transform / opacity only
- 目标：LCP < 2.5s、CLS < 0.1、INP < 200ms
- 触控区域 ≥ 44px；无横向溢出
