# UI-AUDIT.md — YUAN.ABD 三门户现状审计

> 审计日期：2026-09-03
> 依据：《YUAN.ABD 三门户网站整体视觉与 UI 重构实施方案》Phase 0
> 代码基线：git 8ccdcb6（与线上 www.yuanabd.cn / learn.yuanabd.cn / travel-notes.yuanabd.cn 一致）

## 1. 项目形态

| 站点 | 本地文件 | 线上地址 | 技术形态 |
|---|---|---|---|
| 主站 | demo/index.html（单文件内联） | https://www.yuanabd.cn/ | 纯静态 · Lenis + Canvas + IntersectionObserver |
| Learn | demo/learn.html + css/learn.css + js/learn.js | https://learn.yuanabd.cn/ | 纯静态 · CSS 3D 书本 + 真实数据 |
| Travel | demo/travel.html + 多 CSS + 多 JS | https://travel-notes.yuanabd.cn/ | 纯静态 · Three.js 旋转画廊 + 堆叠卡 + 漂移墙 |

全部为单文件内联 / 本地静态资源，无构建步骤。

## 2. 现状问题清单

### 2.1 主站（index.html）
- **P0** 第一屏为深黑背景（#0a0e12），与「阳光、青春、明快」目标相悖。
- **P0** Hero 缺少独特品牌视觉资产，仅有星尘 Canvas，冲击力不足。
- **P1** 两个产品区偏文字化，缺乏「产品即视觉对象」的表达。
- **P1** 缺少 Now / Future、How I Build 等 Studio 叙事段落。
- **P1** Footer 品牌记忆点弱（只有标题 + 两张卡）。
- **可选** *.bak-deploy 为过期备份，仓库内不应保留（走 git 版本管理）。

### 2.2 Learn（learn.html）
- **P0** 深橄榄/棕调（#29251d）压制成长感，与蓝色/成长定位不符。
- **P1** 五本 CSS 3D 书色彩偏复古（陶土/橄榄/棕），需要阳光化（暖白封面 + 品牌色书脊）。
- **P1** 缺少 Hero 标题层，进入页面先看到五本书才知道产品定位。
- **P1** 页面底部 footer 过于简单，缺少统一品牌骨架。
- **数据资产强**：真实职位数、城市、技能、薪资、19 平台、招花今日好岗 Mockup 必须保留。

### 2.3 Travel（travel.html + js）
- **P0** 旋转画廊 HUD 首项标题为「行迹」，与城市列表（北京/上海…）混用，首屏出现「产品名当城市」的空洞感。
- **P0** 画廊滚动依赖 window.lenis；若 Lenis 被 reduced-motion 禁用或未初始化，滚动事件仍回退，但 Three.js renderScene 在部分环境不会随滚动重绘，造成「页面空白/交互无法推进」观感。
- **P0** stage__hint / 画廊标题在首屏被快速压暗，用户不知道可以滚动切换城市。
- **P1** 粉色主题（#fbeef1 + #e8638f）偏离「天空蓝 + 橙」定位。
- **P1** 缺少「Your World 足迹 / Travel Stories 城市故事 / Memories 胶片墙」叙事段，功能列表过重。
- **P1** cityfilm 区域只有图片 + 名字，缺「故事」文案与 CTA。
- **可保留**：旋转画廊概念、7 城市分页、堆叠卡、漂移墙、浅色底方向。

## 3. 资产保护清单（Rule A）

### 主站
| 类别 | 项目 |
|---|---|
| KEEP | 巨型 YUAN.ABD 品牌字概念；产品左右布局；功能标签；CTA；城市横向滚动画廊；Marquee 数据带 |
| MODIFY | 深黑背景→暖白体系；描边字→实心粗体+黄/蓝强调；Hero 视觉；Navigation；Footer |
| REPLACE | 星尘 Canvas → 太阳光晕 + 轻量浮动图形（保留漂浮光点可选） |
| DELETE | .bak 备份文件（走 git） |

### Learn
| 类别 | 项目 |
|---|---|
| KEEP | 五本手册创意；招花今日好岗真实 Mockup；职位横向滚动；真实数据（3,279 岗 / 47 城 / 465 技能 / 19 平台 / 14K 薪资）；详情面板交互；思维链路 |
| MODIFY | 深橄榄/棕 → 阳光蓝黄；书本封面/书脊配色；Hero 标题层；Footer |
| REPLACE | 复古 3D 书摊 → Sunny Career Library（CSS 2.5D 轻量阴影） |
| DELETE | 无业务逻辑 |

### Travel
| 类别 | 项目 |
|---|---|
| KEEP | 旋转画廊；7 城市分页；堆叠卡；漂移墙；下载/关于弹窗；浅色底 |
| MODIFY | 粉色 → 天空蓝 + 橙；HUD 首项文案；画廊滚动联动；cityfilm 故事补全；Footer 统一 |
| REPLACE | 缺失的城市故事/足迹/记忆叙事段 → 新增 Your World / Stories / Memories 区块 |
| DELETE | 无（修复而非删除） |

## 4. 重构优先级（与方案 §31 一致）
1. Travel 内容与交互修复（P0-1）
2. 主站 Travel Mockup 图片路径修复（P0-2，无 404，保持）
3. 域名/URL 规范（P0-3，canonical 已存在，保持）
4. Design System（P0-4）→ 配套 DESIGN-SYSTEM.md
5. Learn 五本书阳光化（P0-5）
6. 主站重构（P0-6）
7. Travel 全页重构（P0-7）
8. Mobile 同步（P0-8）

## 5. 性能基线（方案 §30）
| 指标 | 主站 | Learn | Travel |
|---|---|---:|---:|---:|
| HTML | 41KB | 42KB | 30KB |
| CSS | 内联+32KB | 44KB | 63KB |
| JS（首屏依赖） | Lenis 10KB + 内联 | learn.js 17KB + project.js | three 143KB + lenis + 各模块 |
| 图片（webp） | ~1MB | ~1MB | ~1MB |
| LCP/CLS/INP | 重构后补测 | 重构后补测 | 重构后补测 |
