# pc-fixboxs.yuanabd.cn · 内容更新与发布工作流方案

> 版本 V1.0 ｜ 2026-10-12 ｜ 状态：待决策 ｜ 涉及域名 `pc-fixboxs.yuanabd.cn`
>
> 回答的问题：**不做管理后端，文章怎么更新、怎么发布？**

---

## 0. 结论先行

**「不做后端」不等于「不能更新内容」——内容更新今天就能做，真正的缺口不是后端，是两道闸门。**

| 判断 | 说明 |
|---|---|
| 内容更新链路的**能力** | ✅ 已完全具备。`写 Markdown → 构建 → 部署`，构建耗时实测 **0.11 秒** |
| 内容更新的**安全性** | ❌ 有严重缺口：构建**静默吞掉错误**，文章会无声消失且退出码为 0（实测见 §1.2） |
| 是否需要数据库/后台 | ❌ 在 30–300 篇量级**不需要**。一次内容变更本质是一次**文本 diff**，Git 天然承担版本、审核、权限、回滚 |
| 能否**不要后端**却有**可视化编辑界面** | ✅ 能。Git 后端 CMS（Sveltia/Decap）是纯静态 admin 页面，直接调 GitHub API 提交，零服务端 |
| 什么时候才真的需要后端 | 见 §7 诚实清单。核心触发条件只有一条：**「非技术人员必须在不碰 Git 的前提下高频发稿」** |

**因此建议的推进顺序是：先补闸门（P0）→ 再装工作台（P1）→ 最后才谈可视化界面（P2，且仍然无后端）。**

---

## 1. 现状：链路能跑，但会静默丢文章

### 1.1 今天的实际链路

```
content/fixboxs/<文件名>.md       ← 作者写这里（19 个 front-matter 字段 + 10 个固定正文段落）
        │  node build-fix.cjs      ← 0.11 秒
        ▼
demo/fixboxs/fix/<slug>.html      ← 教程页（注意：产物名取自 front-matter 的 slug，不是源文件名）
        │  node deploy-fixboxs.cjs  ← 0.16 秒，复制 tokens.css + 打 ?v= 内容哈希
        ▼
dist/fixboxs/                     ← 自包含产物（42 文件 / ~1MB）
        │  bash deploy-fixboxs.sh   ← 打包 → scp → 原子切换 → 校验 6 个 URL
        ▼
/var/www/fixboxs  （旧版留 /var/www/fixboxs.prev）
```

**关键数字**：构建 0.11s ｜ 产物化 0.16s ｜ 全站 30 篇 / 394KB 正文 ｜ 单篇均 13KB ｜ front-matter 19 字段 ｜ 正文固定 10 段

### 1.2 实测的三个静默失败（本方案最重要的发现）

我往 `content/fixboxs/` 放了三个故障探针，跑真实的 `node build-fix.cjs`，结果：

| 探针 | 人为制造的故障 | 构建输出 | 退出码 | 实际后果 |
|---|---|---|---|---|
| A | `related` 指向不存在的 slug | 「构建完成：文章 32 篇」 | **0** | 文章照常生成，但相关链接指向 404 或空缺 |
| B | 文件带 UTF-8 **BOM** | 仅一行 `跳过（缺 title）` | **0** | **文章静默消失**，站点上查无此篇 |
| C | 删掉 `## 分步骤` 等必需段落 | 「构建完成」无任何提示 | **0** | **文章静默消失** |

更糟的是**部署闸门也拦不住**：`deploy-fixboxs.sh` 只校验 6 个 URL（5 个壳页 + 1 篇样文），**不覆盖 30 篇教程**。所以一篇文章消失，整条流水线会一路绿灯发布上线。

**当前构建的全部校验只有一行**（`build-fix.cjs` L345）：

```js
if (!meta.title) { console.warn("跳过（缺 title）：" + f); return; }
```

只查 `title` 一个字段。`slug` / `domain` / `category` / `os` / `risk` / `symptoms` / `sources` **一律不查**；正文 10 段是否齐全**不查**；`related` 的 slug 是否存在**不查**；`sources` 的 URL 是否可达**不查**。

> **这就是「Git 当 CMS」能不能成立的真正前提**：版本控制负责「谁改了什么、能不能回滚」，但**「改坏了会被立刻拦住」必须由构建闸门提供**。闸门不补，任何工作流（手工、Git、CMS）都会静默丢文章。

### 1.3 已具备、不需要重做的部分

| 能力 | 现状 |
|---|---|
| 内容与展示分离 | ✅ 正文在 `content/*.md`，展示在 `demo/fixboxs/` |
| 结构化元数据 | ✅ 19 字段，30/30 篇 100% 覆盖 |
| 原子发布 + 回滚 | ✅ `.prev` 目录 + nginx 配置独立备份 |
| 线上校验 | ✅ 6 URL 状态码 + 安全响应头（覆盖面待扩，见 §1.2） |
| 版本控制 | ✅ Git，远端 `github.com/ciyu031003/YuanAbd-Web`，已用 `chore(release):` 提交规范 |

---

## 2. 为什么「文本 diff」等价于内容管理

后台系统提供的能力，逐条对照 Git：

| 典型 CMS 能力 | Git 等价物 | 是否够用（30–300 篇） |
|---|---|---|
| 草稿 | 分支 / 未提交的工作区 | ✅ 够 |
| 审核 | Pull Request + Review | ✅ 够，且留痕更强 |
| 发布 | 合并到 `main` | ✅ 够 |
| 版本历史 | `git log` / `git blame` | ✅ 更强（逐行追责） |
| 回滚 | `git revert` / `/var/www/fixboxs.prev` | ✅ 够 |
| 权限 | GitHub 仓库权限 / 分支保护 | ✅ 够（粒度粗，但本站不需要细粒度） |
| 定时发布 | 见 §5.3（GitHub Actions schedule） | ⚠️ 要额外做，低频需求可手工 |
| 富文本所见即所得 | 见 §5.2（Sveltia CMS） | ⚠️ 要额外装，但**仍然无需后端** |
| 多人在线协同编辑 | 无（会冲突） | ❌ 本站在此量级不需要 |

**结论**：除「非技术人员网页富文本编辑」和「定时发布」两项外，Git 在上表全部维度**不劣于**后台系统，实现成本近乎为零。

---

## 3. 五档方案（按投入递增，可逐级升级）

| 档 | 名称 | 作者需要什么 | 单次改稿耗时 | 新增工作量 | 适用阶段 |
|---|---|---|---|---|---|
| **L0** | 现状 + 补闸门 | 会编辑器 + 命令行 | ~2 分钟 | **1–2 人日** | **现在就该做** |
| **L1** | 本地工作台 | 同上，但更顺手 | ~40 秒 | 2–3 人日 | 内容量上来后 |
| **L2** | GitHub 网页即 CMS | 只需浏览器/手机 | ~2 分钟 | 1–2 人日 | **想摆脱本地环境时** |
| **L3** | Git 后端可视化 CMS | 点表单，零 Git 知识 | ~3 分钟 | 2–4 人日 | 有非技术协作者时 |
| **L4** | 真后端（数据库/CMS 服务） | 网页登录 | — | 30+ 人日 | **当前不需要**（见 §7） |

### 3.1 L0 — 补闸门（P0，必做第一步）

**目标**：让任何内容错误在**构建阶段**就失败，而不是静默上线。

新增 `content-lint.cjs`（零依赖，与现有脚本风格一致），校验项：

| # | 校验 | 失败策略 |
|---|---|---|
| 1 | front-matter 可解析（含 **BOM 检测**与明确的报错文案） | 失败 |
| 2 | 19 个字段全部存在且类型正确（`os`/`symptoms`/`keywords` 等为数组） | 失败 |
| 3 | `slug` 全局唯一（防止两篇同名互相覆盖） | 失败 |
| 4 | `slug` 符合 `^[a-z0-9-]+$` | 失败 |
| 5 | `domain` / `category` 在分类表中存在 | 失败 |
| 6 | `risk` ∈ {安全, 需谨慎, 有数据风险}；`difficulty` ∈ {入门, 进阶} | 失败 |
| 7 | 正文 10 个固定段落齐全（含 `## 分步骤` 下有 `### 步骤 N`） | 失败 |
| 8 | `related` 的每个 slug 都真实存在 | 失败 |
| 9 | `sources` 非空且 URL 形态合法（可选：联网 HEAD 校验，默认关闭） | 警告 |
| 10 | 文内锚点链接 `#...` 有对应标题 | 警告 |

**同时改两处**：
1. `build-fix.cjs` —— 把「静默跳过」改为**收集所有错误后统一失败**（退出码非 0），并打印可点击的文件路径与行号；
2. `deploy-fixboxs.sh` —— 部署前先跑 lint；并把线上校验从「6 个固定 URL」改为**遍历 `dist/fixboxs/fix/*.html` 全量探测**（30 篇全查，篇数增加后自动跟随）。

**验收标准**：故意删掉某篇的 `title` / 加 BOM / 写错 `related`，`bash deploy-fixboxs.sh` **必须失败退出且不发布**。

### 3.2 L1 — 本地工作台（P1）

三个脚本，把「改一篇文章」从 5 步压到 1 步：

| 脚本 | 作用 |
|---|---|
| `node new-article.cjs "标题"` | 生成预填 19 字段 + 10 段骨架的新文件，自动算 `slug`、填 `updated`、按分类挂 `related` |
| `node preview.cjs` | 起本地预览（复用现有 `demo/serve.cjs`），作者改完立刻在浏览器看效果 |
| `bash publish.sh "说明"` | lint → build → deploy → 线上全量校验 → `git commit`。**一条命令完成发布** |

配套：VS Code 工作区 + 片段（`fx-article` 生成 front-matter 骨架）+ 推荐扩展（Markdown All in One、YAML 校验）。

### 3.3 L2 — GitHub 网页即 CMS（P1，**零后端的关键答案**）

**很多人忽略的事实：GitHub 自己的网页编辑器就已经是一个 Markdown CMS。**

工作流：

```
作者在浏览器/手机上打开
  https://github.com/ciyu031003/YuanAbd-Web/blob/main/content/fixboxs/xxx.md
→ 点铅笔图标直接编辑（支持预览、提交说明）
→ Commit changes（可直接建分支发 PR，也可直接提交 main）
→ GitHub Actions 自动：lint → build → 部署到服务器 → 线上校验
```

**作者不需要**：本地环境、Node、命令行、Git 客户端、SSH 密钥。**只需要**：一个 GitHub 账号 + 浏览器。

实现要点：
- 新增 `.github/workflows/publish.yml`：`on: push: paths: ['content/**', 'build-fix.cjs', 'demo/fixboxs/**']`；
- 构建后经 SSH 部署（把现有 `deploy-fixboxs.sh` 挪到 Action 里跑，SSH 私钥存 GitHub Secrets）；
- `lint` 失败则 Action 失败，**不部署**，作者在 GitHub 上直接看到红色叉与错误详情；
- 保留人工 `deploy-fixboxs.sh` 作为应急通道。

**代价**：内容一旦 push 到 GitHub 就是公开的（除非买私有仓库）。对本站（公开教程站）不是问题。

### 3.4 L3 — Git 后端可视化 CMS（P2，**仍然无后端**）

当出现「不碰 Git 的人也要写稿」时，装一个 **Git 后端 CMS**。它是**一个静态 HTML 页面**，放在站点的 `/admin/`，通过 GitHub API 读写仓库——**没有任何服务端进程、没有数据库**。

| 方案 | 说明 | 备注 |
|---|---|---|
| **Sveltia CMS** | Decap 的现代替代实现，体积小、UI 新、支持手机 | 首选 |
| Decap CMS（原 Netlify CMS） | 生态最成熟、文档最全 | 次选 |
| TinaCMS | 支持可视化就地编辑（visual editing） | 需要其云服务或自托管 GraphQL 层，**这条路径会引入服务端**，与本站前提冲突 |

配置示例（`admin/config.yml`，概念示意）：

```yaml
backend:
  name: github
  repo: ciyu031003/YuanAbd-Web
  branch: main
media_folder: static/img
collections:
  - name: tutorials
    label: 教程
    folder: content/fixboxs
    extension: md
    format: frontmatter
    fields:
      - { name: title, label: 标题, widget: string }
      - { name: slug,  label: slug, widget: string }
      - { name: domain, label: 领域, widget: select, options: [net-basic, win-boot, ...] }
      - { name: risk,  label: 风险, widget: select, options: [安全, 需谨慎, 有数据风险] }
      - { name: symptoms, label: 症状, widget: list }
      - { name: body, label: 正文, widget: markdown }
```

**代价**：需要一个 GitHub OAuth 中转（因为 GitHub 的 OAuth 不能纯前端完成）。这个中转可以是 Cloudflare Worker / Vercel 函数等**免费托管的极小服务**，或直接用 Sveltia 官方提供的中转。**这是 L3 唯一「非纯静态」的一环，但它是认证中转，不是业务后端。**

**关键收益**：表单里 `domain` / `risk` 是下拉框，`sources` 是结构化列表——**从源头消灭 §1.2 的字段类故障**。

---

## 4. 日常操作手册（每档具体怎么做）

### 4.1 改一个错别字（最高频场景）

| 档 | 操作 | 耗时 |
|---|---|---|
| L0/L1 | 改 `.md` → `bash publish.sh "修正错别字"` | ~40 秒 |
| L2 | 浏览器打开该文件 → 编辑 → Commit → 等 Action 变绿 | ~1 分钟 |
| L3 | 打开 `/admin/` → 找到文章 → 改 → Save | ~1 分钟 |

### 4.2 新增一篇文章

| 档 | 操作 |
|---|---|
| L0 | 复制现有 `.md`，改 19 个字段 → `bash publish.sh` |
| L1 | `node new-article.cjs "标题"` → 填正文 → `bash publish.sh` |
| L2 | GitHub 网页 New file → 粘贴骨架 → Commit |
| L3 | `/admin/` → 新建 → 表单填写 → Save |

### 4.3 批量改（如全站更新 `reviewed_at`）

`node review-stamp.cjs --older-than 180d` 之类的脚本一次性处理，比在后台里逐篇点开快得多——**这是文本管线的天然优势**。

---

## 5. 三个必须一并设计的点

### 5.1 审核闸门（谁有权发布）

| 场景 | 建议 |
|---|---|
| 单人维护 | 直接 push `main`，靠 lint 兜底 |
| 有协作者 | 开启 GitHub 分支保护：`main` 需 PR + 1 approval；作者提 PR，Action 在 PR 上跑 lint 预览 |
| 对外投稿 | `content/contrib/` 目录 + PR 模板；合并前人工过 §6 的「内容质量清单」 |

### 5.2 预览（作者必须能先看到效果）

- **本地**：`node preview.cjs` → `http://localhost:8080/fixboxs/`
- **PR 预览（L2 之后）**：Action 在 PR 里构建并部署到 `pr-<号>.preview.yuanabd.cn` 或临时目录，PR 评论贴链接，合并后自动清理

### 5.3 定时发布（Git 唯一明显短板）

需求真实但低频。三个办法，按简单度排序：
1. **GitHub Actions `schedule`**：每天定时检查 `content/` 里 `publish_at` 已到的文章，自动构建部署；
2. **frp：文章带 `publish_at` 字段，构建时跳过未到期文章**（最省事，无需定时任务，靠下次任意构建生效）；
3. 手工：到点了跑一次 `publish.sh`。

---

## 6. 内容质量清单（拟稿人自查 + 审核人复核）

| 项 | 要求 |
|---|---|
| 标题 | 含用户会搜的词（如「Wi-Fi 显示已连接但无法上网」而非「网络异常处理」） |
| `symptoms` | ≥5 条**口语**说法（用户不会说「链路层不通」） |
| `aliases` | 2–4 条更短的口语（「上不了网」「没网」） |
| `keywords` | 含命令名与术语（便于正文检索） |
| 结论 | 一句话能说清「先做什么」 |
| 步骤 | 每步含**做什么 / 会看到什么 / 失败怎么办**三件套 |
| 风险 | 涉及数据丢失必须标「有数据风险」并置顶备份提醒 |
| `sources` | ≥2 条官方来源（Microsoft / Apple / 厂商文档） |
| `related` | 3–5 篇，且均为真实存在的 slug |
| 跨系统 | Windows 与 macOS 都要给命令，或明确说明只适用其一 |

---

## 7. 什么时候才真的需要后端（诚实清单）

只有命中以下**任意一条**，才值得重新评估 L4（真后端）：

| # | 触发条件 | 为什么 Git 方案不够 |
|---|---|---|
| 1 | **非技术人员必须发稿，且明确拒绝使用 GitHub 网页** | L3 已能覆盖绝大多数此类需求；只有连 `/admin/` 表单都不接受时才是真需求 |
| 2 | 需要**多人在线协同编辑同一篇**（实时协同） | Git 会产生冲突，文本管线无解 |
| 3 | 内容需要**动态查询**（如「按错误代码实时检索诊断规则库」） | 纯静态需预构建全量组合，规则库足够大时不划算 |
| 4 | 需要**用户账号 / 收藏 / 提交纠错工单**等写入功能 | 一旦有用户写入，就必须有服务端与数据库 |
| 5 | 内容规模进入**数千篇**且更新频繁 | 全量重建变慢、产物变大；此时应优先考虑构建增量优化，而非上 CMS |
| 6 | 需要**细粒度权限**（如某编辑只能改某领域） | GitHub 权限粒度到仓库级 |

**当前 30 篇、单人/小团队维护、公开教程站——六条全部不成立。**

---

## 8. 迁移保证：内容格式就是契约

本方案能安全推迟后端决策，根本原因是**内容层已经与展示层解耦**：

```
content/fixboxs/*.md  ← 唯一真源（Markdown + YAML front-matter）
        ↓ 任何工具都只是它的读写者
  ├─ build-fix.cjs        （现在的构建器）
  ├─ GitHub 网页编辑器    （L2）
  ├─ Sveltia / Decap CMS  （L3）
  └─ 未来任何 CMS / 后台  （L4）
```

**因此**：将来若真要上后台，它只需**写出同样格式的 Markdown 文件**，构建管线与线上站点**一行都不用改**。这条路径是**加法**，不是重写。

**必须守住的两条**：
1. 不要把内容塞进数据库成为唯一副本；
2. 不要让构建器反向写入内容（构建必须是无副作用的纯读）。

---

## 9. 实施建议（分三步，可独立验收）

| 步骤 | 内容 | 工作量 | 依赖 | 验收 |
|---|---|---|---|---|
| **S1（P0）** | `content-lint.cjs` + 改造 `build-fix.cjs` 失败策略 + `deploy-fixboxs.sh` 全量校验 | 1–2 人日 | 无 | 三种故障探针 **全部被拦下且不发布** |
| **S2（P1）** | `new-article.cjs` + `preview.cjs` + `publish.sh` + VS Code 片段 | 2–3 人日 | S1 | 新增一篇教程只输 1 条命令 |
| **S3（P1/P2）** | GitHub Actions 自动发布（L2）；视需要再上 Sveltia（L3） | 1–4 人日 | S1 | 网页改一次 `.md`，2 分钟内线上生效 |

**建议先做 S1，并且立刻做**：它不是「为将来做准备」，而是**当前线上就在漏的洞**——今天任何人（包括我）只要文件带了 BOM，那篇文章就会无声消失。

---

## 10. 待确认

| # | 问题 | 影响 |
|---|---|---|
| Q1 | 未来会不会有**非技术人员**参与写稿？ | 决定 L3 是否必要 |
| Q2 | 是否需要**定时发布**？ | 决定 §5.3 做不做 |
| Q3 | 内容是否接受存在 **GitHub 公开仓库**？ | 决定 L2 可行性（私有仓库亦可用，仅额度限制） |
| Q4 | 是否需要 **PR 审核流程**？ | 决定分支保护与 Actions 的形态 |
| Q5 | 是否现在就把 `mac-system` 领域缺的教程补上？ | 与内容补齐篇数一起排期 |
