# pc-fixboxs.yuanabd.cn · 管理后台系统实施方案 V2.0（上）

> 版本 V2.0-上 ｜ 2026-10-12 ｜ 状态：待拍板 ｜ 覆盖第 1–4 章
>
> 本文件是《管理后台系统实施方案 V2.0》的**上半部分**（前提变更、架构选型、技术栈、数据库设计）。
> 下半部分见 [管理后台系统实施方案-V2-下.md](./pc-fixboxs.yuanabd.cn-管理后台系统实施方案-V2-下.md)（账号体系 / 安全 / 发布链路 / 路线图 / 决策清单）。
>
> **本文件相对 V1.0 的性质**：V1.0（[管理后台实施方案.md](./pc-fixboxs.yuanabd.cn-管理后台实施方案.md)，476 行）的前提**已被用户于 2026-10-12 显式替换**。
> 上一轮评审（[管理后台方案-评审与优化-总览.md](./pc-fixboxs.yuanabd.cn-管理后台方案-评审与优化-总览.md)）给出的「路线 A′ = Sveltia CMS + 自建 Gitea」推荐**随之作废**。
> 本文件重新做选型论证，不复述旧文档。
>
> **本文档中所有「实测」结论均基于 2026-10-12 对工作副本 `F:\CodeFiles\YuanAbd-Web` 的独立复现**，证据以 `文件:行号` 或探针输出给出。

---

## 1. 前提变更与结论重述

### 1.1 被替换的前提

| 维度 | V1.0 / 上一轮评审的前提 | 用户 2026-10-12 的新前提 | 影响 |
|---|---|---|---|
| 协作者准入 | 「协作者能否持有 GitHub 账号」是路线分水岭；路线 A′ 用自建 Gitea 规避 | **完全不考虑协作者是否有 GitHub 账号**，以「自建管理后台网站 + 后台系统」为准 | GitHub / Gitea 两条 Git 后端路线整体退出候选；选型回到「自建后台」本身 |
| 数据存储 | 铁律 1「数据库不得成为正文的唯一副本」；V1 用 SQLite 仅存元数据 | **后台直接接入数据库**，MySQL / PostgreSQL 二选一，**新建独立库**，不污染已有库 | DB 从「可选的小配件」升为**一等架构组件**，需重新论证选型、隔离、备份 |
| 后台形态 | 复用 Git 后端 CMS（Sveltia）以省掉自研量 | **独立登录页 + root 超管分发账号 + 内部人员增删改** | 账号体系、RBAC、审计必须自建（或由所选框架提供），不能再外包给 Gitea |
| 开源复用 | 「鼓励复用」但默认自研 B | **在自用/不商用/不违法前提下鼓励复用开源项目** | 全栈框架（芋道/RuoYi、Payload）重新进入候选，且权重上升 |

### 1.2 V2.0 结论摘要

| 判断 | 结论 | 依据 |
|---|---|---|
| 后台要不要做 | **要做**，且这次是**没有退路的自建**——Git 后端 CMS 路线（A/A′）因前提变更已出局 | 用户明确要求「自建管理后台网站和管理后台系统」 |
| 后台整体形态 | **自建服务端 + 独立登录 + 直连数据库**；数据库承载**业务态**（账号/会话/审计/审核/发布任务），**正文真源仍为 `content/fixboxs/*.md`** | 见 §2.3 独立论证 |
| 数据库 | **PostgreSQL**（含明确翻转条件，见 §4.1） | 见 §4.1 |
| 后端栈 | **Node + TypeScript**，而非 Java。**不建议引入 JVM 栈** | 见 §3.3（这是本文件最需要拍板的一个结论） |
| 可复用资产 | 分层复用：**Payload（可选重框架）** 或 **自研轻后端 + vue-vben-admin（UI 壳）+ Vditor（编辑器）+ gray-matter（front-matter）** | 见 §3.2 |
| 必须先修的两个致命缺陷 | **与选型无关，任何路线都要先修**（见 §1.3） | 实测证据 |
| 前台是否依赖后台 | **不依赖**。前台仍是纯静态，后台宕机不影响读者 | 铁律保留（见 §1.4） |

### 1.3 两个致命缺陷：V1.0 完全没算，本轮独立复现确认

这两条**不因为选型变化而消失**，恰恰相反：**自建后台的写入路径比 Sveltia 更直接地摧残 front-matter**，风险更高。

#### 缺陷 1：front-matter 解析器不支持嵌套对象，109 条官方来源 URL 全部被丢弃

**实测证据**（本次独立复现，非引用）：

| 项 | 实测结果 |
|---|---|
| 解析器位置 | `build-fix.cjs:78-97` `parseFrontMatter` |
| 解析器能力 | 只识别「标量」「扁平 `[a, b]` 数组」「扁平 `- item` 列表」三态（`build-fix.cjs:83-95`） |
| `content/fixboxs` 篇数 | 30 |
| front-matter 字段数 | **每篇恰好 19 个**（`title, slug, domain, category, os, difficulty, time, risk, symptoms, keywords, aliases, updated, version, prerequisites, tools, related, sources, reviewer, reviewed_at`） |
| 嵌套字段 | **只有 `sources` 一个**（30/30 篇） |
| `sources` 原始条目总数 | **109** |
| `url:` 行总数 | **109**（与条目数 1:1） |
| `type:` 行总数 | **32**（`official` 31 条 + `opensource` 1 条） |
| 解析后仍含 `http` 的条目数 | **2 / 109** |
| 解析后条目数与原文件不一致的篇数 | 0（条目数对，**内容错**——这是最危险的一种） |

**根因**（两处，均已定位）：

1. `  url: …` 缩进行不匹配 `^([A-Za-z_][\w-]*):`（该正则要求键在第 0 列），在 `build-fix.cjs:88` 的 `if (!kv) return;` 处被**静默丢弃**；
2. `  - title: …` 行匹配 `build-fix.cjs:85` 的扁平列表分支 `^\s*-\s+(.*)$`，被 `unquote()` 收成**整串文本**，于是 `sources` 变成形如
   `["title: Microsoft Learn — sfc 命令", …]` 的**字符串数组**（不是对象数组）。

**关于「2 篇保留了 URL」的澄清（重要：这是一个假阳性，不是例外）**：若只用 `JSON.stringify(sources).includes("http")` 作判据，会得到「2 篇保留了 URL」的结论（`proxy-server-not-responding.md`、`proxy-tool-broke-network.md`）。**该结论是错误的**，我把它追到底了：

那两篇的解析结果里确实有一个元素含 `http` 子串，但**命中的是 `winhttp` 这个单词**，不是 URL：

```
proxy-server-not-responding.md
  [1] 含http=true :: "title: Microsoft Learn - netsh winhttp 命令参考"
                                              ^^^^^^^ 子串匹配到 winhttp，非 URL
```

这两篇的 `sources` 里恰好有标题含 **`netsh winhttp`** 的条目的原文 `url:` 行**同样被丢弃**。因此正确的口径是：

> **109 条 `url:` 行 → 109 条全部丢失；32 条 `type:` → 32 条全部丢失。保留率 0/109。**
> 「2 篇保留」是 `includes("http")` 这一**判据本身的假阳性**（子串 `http` ≠ URL）。

> **这一点本身就是一条方法论教训，被写进本方案的验收标准**：**不要用「字符串里有没有 http」来判断 URL 是否存活**。回归断言必须解析出**结构化字段**后逐条比对键值与键集合——否则这个假阳性会让「URL 全丢」看起来像「丢了 28/30」，从而低估缺陷的严重程度。

**为什么这是致命的**：V1.0 §5.4 的 V2 规则要求 `sources` 为「对象数组」，铁律 2 要求「后台只能写出同样格式的 Markdown」。而当前解析器**既读不出对象，也写不回嵌套结构**。最坏结局不是构建失败（构建根本不消费 `sources`，见 `build-fix.cjs:356-369` 只透传 12 个字段），而是**静默数据损坏**：后台点一次「保存」，30 篇的官方来源引用被清空，而构建、部署、线上校验（`deploy-fixboxs.sh:54` 只查 6 个 URL）**没有任何一道闸门会发现**。

**修复要求**（并入前置阶段，见 §3.4 选型与下半部分路线图）：

- 用**成熟库**替换手写正则：`gray-matter`（MIT）解析 + `eemeli/yaml`（ISC）序列化；手写正则正是本次丢 url 的根因；
- **同一份字段定义同时驱动读与写**（同源），杜绝「读得进、写不回」；
- round-trip 断言必须**逐篇比对**，不能只比字段总数（条目数对了内容仍可能错，如上表所示）：
  - 三态语义等价：`parse → serialize → parse`；
  - `sources` 的**条目数**与**每条的键集合**都与原文一致；
  - **回归基线：`url` 总数 = 109、`type` 总数 = 32**；
  - 键顺序保持 `title → url → type`，且 `type` 只在原文存在时才输出。

**对数据建模的直接影响（贯穿 §3、§4）**：`sources` 必须建模为「**可变字段的对象数组**」——`title` 与 `url` 必有，`type` 可选。若把 `type` 设成 `NOT NULL`，20 篇写不出来；若把 `type` 丢掉，10 篇数据静默丢失——与现在丢 `url` 是同一类错误。

#### 缺陷 2：整条 fixboxs 流水线未纳入 Git，所有 Git 侧恢复机制都是空转

| 项 | 实测结果 |
|---|---|
| 文章数 | 30 |
| `git ls-files content` 计数 | **0** |
| `package.json` 是否存在 | **不存在**（零依赖，全仓成立） |

V1.0 的铁律 1（内容真源 = Markdown + Git）、D3（worker `git commit`）、D11（`git revert` 回滚）、D5（content_hash 乐观锁）**全部假设 `content/` 已在 Git 里**。今天没有任何已提交基线 → 所有 Git 侧恢复机制都是**演示性质的**。

> **V2.0 的处理**：本条与选型完全解耦。**先提交基线**（0.5 小时内可完成、零风险），否则后台的「版本历史 / 一键回滚 / 审计」全是空转。注意：本方案**不**因为引入数据库就放弃 Git 基线——见 §2.3。

### 1.4 V1.0 里哪些结论作废、哪些仍然有效

| V1.0 条目 | 判定 | 理由 |
|---|---|---|
| §2 路线 A（Git 后端 CMS + OAuth） | ❌ **作废** | 前提被用户替换：不考虑 GitHub 账号，且要求自建后台 |
| 上一轮评审「路线 A′（Sveltia + 自建 Gitea）」 | ❌ **作废** | 同上。Gitea 能解决「账号」问题，但解决不了用户新提的「直连数据库 + root 分发 + 独立登录页」——那些是**自建后台**才有的能力 |
| §2 路线 C（DB-first）「否决」 | ⚠️ **部分作废** | 「DB 当唯一真源」仍不推荐（见 §2.3），但「直连数据库」本身已被用户明确要求，不再是禁忌。旧结论「DB-first 一律否决」过于笼统 |
| §0 铁律 3「前台不依赖后台」 | ✅ **保留（不可让步）** | 前台纯静态是本站的性能与可用性地基；后台宕机不得影响读者。这条与选型无关 |
| §0 铁律 1「内容真源 = Markdown + Git」 | ⚠️ **保留判断，但需重新论证** | 见 §2.3。我独立论证后的结论是**保留**，但理由与 V1.0 不同 |
| §0 铁律 2「`build-fix.cjs` 输入契约一行不改」 | ⚠️ **改为「输入契约不变、解析层必须升级」** | 契约（19 字段 + 10 段）不变；但**解析器本身必须换掉**（缺陷 1）。V1.0 把「不改」字面化，反而掩盖了必须动的部分 |
| §1.2「构建静默吞错」是前置必修 | ✅ **保留，且确认为前置** | `build-fix.cjs:345` 只校验 `title`，`console.warn` 后 `return`，构建 `exit 0`，文章静默消失 |
| §2.3「部署只校验 6 个 URL」是前置必修 | ✅ **保留，且确认为前置** | `deploy-fixboxs.sh:54` 硬编码 6 个路径，29/30 篇教程未覆盖 |
| §2/D1 内容真源 = Markdown + Git | ⚠️ **保留**（见 §2.3） | 但理由从「DB 不好」改为「构建链与合规复核的实际需求」 |
| D2 `_drafts/` `_archive/` 目录隔离 | ⚠️ **保留但必须加固** | 依赖 `build-fix.cjs:331` 的 `readdirSync` **非递归**——这是**「偶然正确」**。任何人把 `readdirSync` 改成递归（一个很自然的「改进」），**所有草稿会被直接发布**。必须加显式断言 + 结果校验 |
| D4 单并发发布队列 | ✅ 保留 | 构建目录共享、部署是整目录切换，串行是正确判断 |
| D5 content_hash 乐观锁 | ✅ **保留，重要性上调** | 多人编辑必然并发；且后台直连 DB 后，DB 侧版本号同样需要 |
| D6 角色模型 / D7 会话安全 | ✅ 保留并**扩充** | 用户明确要求 root 超管分发账号；见下半部分第 5、6 章 |
| D10 taxonomy 外置 | ✅ 保留，应提前 | `build-fix.cjs:22-40` `DOMAINS=12` / `CATS=28` 硬编码，是编辑器下拉框的前置 |
| §5.4 V2「19 个字段齐全」 | ⚠️ **修正** | 「19」是**快照而非约束**：加入 `status`/`author` 后立刻 >19。规则应写成「**必填字段集合**」而非数字 |
| §5.4 V6「正文 10 段齐全」 | ⚠️ **修正，必须带同义白名单** | 实测每篇恰好 10 个 H2，但 `怎么确认修好了` 出现 **29** 篇、`怎么确认处理好了` **1** 篇（`remote-control-scam.md`）。写死单标题会把线上文章判死 |
| §6 数据模型（SQLite，仅元数据） | ⚠️ **重做** | 换 PostgreSQL、表结构按 root 分发账号 + 审核 + 审计重设计，见 §4 |
| §8 安全清单 14 项 | ✅ 保留 | 用户明确要求「全面的安全机制」，且这次**没有 Gitea 可以外包**，全部要自己付 |
| §10 工作量 13–17.5 人日 | ⚠️ **重估** | 未含缺陷 1/2；且未含引入 DB 后的迁移/备份/隔离工作。修正值见下半部分 |

---

## 2. 技术架构选型（核心）

### 2.1 分层架构

```
┌──────────────────────────────────────────────────────────────────┐
│ 编辑者（浏览器，任意网络）                                          │
│   独立登录页 admin.pc-fixboxs.yuanabd.cn/login                     │
└───────────────────────────┬──────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ nginx （106.55.2.197，现有实例，复用）                              │
│   ├─ pc-fixboxs.yuanabd.cn        → /var/www/fixboxs  静态，不变   │
│   └─ admin.pc-fixboxs.yuanabd.cn  → 127.0.0.1:3020    新增反代     │
└───────────────────────────┬──────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ 后台服务 fixboxs-admin（新增容器，Node）                            │
│   ├─ Web 进程    登录 / RBAC 服务端强制 / 文章读写 / 预览 / 校验    │
│   └─ 发布 worker 单并发队列：写文件 → commit → build → deploy → 校验│
└──────────┬──────────────────────────────────┬────────────────────┘
           │                                  │
           │ 业务态（账号/会话/审计/          │ 读写工作副本
           │ 审核/发布任务/媒体元数据）        │ /srv/fixboxs/repo
           ▼                                  ▼
┌──────────────────────────────┐   ┌──────────────────────────────┐
│ PostgreSQL  独立库            │   │ content/fixboxs/*.md          │
│ yuanabd_pc_fixboxs                 │   │ ← 正文唯一真源（不变）         │
│ （绝不触碰已有库）             │   └──────────────┬───────────────┘
└──────────────────────────────┘                  │ git（基线 + 版本历史）
                                                  ▼
                              node build-fix.cjs → demo/fixboxs/
                                                  │
                              node deploy-fixboxs.cjs → dist/fixboxs/
                                                  │
                              deploy-fixboxs.sh --local → 原子切换
                                                  │
                                                  ▼
                              /var/www/fixboxs （+ .prev 回滚）
```

### 2.2 五个分层的职责边界

| 层 | 组件 | 职责 | 新增/复用 | 不做什么 |
|---|---|---|---|---|
| 接入层 | nginx | TLS、静态托管、admin 反代、安全头、`.git`/`.env`/`*.db` 拒绝 | 复用，改配置（新增 1 个 server 块） | 不承载业务逻辑 |
| 应用层 | 后台服务（Node） | 认证、RBAC、文章 CRUD、预览、校验、发布编排 | **新增** | 不直接对外发文件（由 worker 统一出口） |
| 数据层 | PostgreSQL 独立库 | 只存**业务态**：账号/会话/审计/审核/发布任务/媒体元数据/设置 | **新增** | **不存正文**（见 §2.3） |
| 内容真源 | `content/fixboxs/*.md` + Git | 正文与 19 字段的唯一权威副本 | 复用，**需补 Git 基线** | 不被后台单方面重写格式 |
| 构建发布 | `build-fix.cjs` / `deploy-fixboxs.cjs` / `deploy-fixboxs.sh` | 渲染、产物化、原子切换、校验 | 复用，**需抽函数 + 补闸门** | 不感知后台存在 |

### 2.3 关键设计决策：正文真源放哪里（本文件最重要的一个判断）

这是进入数据库设计的**前置决断**。两个候选：

- **方案甲**：DB 只存元数据 + 正文仍在 Git 的 markdown（沿用现有构建链，后台写文件）
- **方案乙**：正文进数据库，构建时导出 markdown 再交给现有 `build-fix.cjs`

#### 对照表

| 维度 | 方案甲（正文在 MD+Git，DB 存业务态） | 方案乙（正文进 DB，构建时导出 MD） |
|---|---|---|
| **一致性** | 单一真源，不存在两处真源；DB 与文件不会漂移 | **两处真源**：DB 是权威、MD 是派生物。任何人手工改 MD 或直接跑构建，都会与 DB 分叉 |
| **回滚** | `git revert`（内容级）+ `.prev`（产物级），两层独立且**不依赖 DB** | 回滚要同时回滚 DB 行与导出物；`git revert` 在导出物上无意义（导出物会被下次导出覆盖） |
| **备份** | 内容随 Git（含完整历史）+ 异地副本；DB 只备业务态，体积小、恢复快 | 正文成为 DB 数据，必须靠 `pg_dump` 备份；备份体量与恢复时间上升，且**正文历史只能靠 DB 里自建版本表** |
| **双人复核** | 差异对比天然可用（`git diff`）；审核对象是**文件版本**，可归档、可追溯 | 需要自建版本表 + 差异算法；复核的是 DB 行快照 |
| **构建兼容** | **零改动**即可跑（配好解析器后） | 必须新增「DB → MD 导出器」，且导出结果必须与现有 30 篇手写格式**逐字节可比**，否则构建行为漂移 |
| **迁移成本** | 后台只需会「写文件」；现有 30 篇**无需导入**（已经在文件里） | 必须写一次性导入器把 30 篇灌进 DB，且导入必须是 **109 条 sources / 32 条 type 无损**（见缺陷 1） |
| **主要风险** | 需要保证「后台写出的文件」与手写文件格式一致 → 用同源解析/序列化器 + round-trip 测试锁死 | 导出器与解析器不同源时，形成**新的静默损坏点**（DB 里有、导出时丢）；两个真源必然漂移 |
| **与本项目现有资产的契合度** | 高：`build-fix.cjs` 的输入契约、`deploy-fixboxs.*` 全部原样可用 | 中：多一层导出，且导出必须是幂等的 |
| **工作量** | 低（无导入器、无导出器，只有序列化器） | 高（导入器 + 导出器 + 版本表 + 幂等性测试） |

#### 我的结论：**采纳方案甲**——DB 存业务态，markdown 仍是构建输入。理由如下（与 V1.0 的理由不同）

1. **方案乙会制造第二个静默损坏点，而本站已经有一个了。** 缺陷 1 的教训是：手写解析器吃掉了 109 条 URL 而**没有任何闸门发现**。若采纳方案乙，就多了一条「DB → 导出器 → MD」的转换链，而这条链**同样没有下游闸门**（`sources` 不参与渲染，构建不会因为 sources 为空而失败）。用一个新风险换一个已经证实存在的风险，不划算。
2. **构建兼容是硬约束，不是偏好。** 用户的要求是「加一个管理后台」，不是「重写站点」。方案甲让 `build-fix.cjs` 的输入契约（19 字段 + 10 段）**保持不变**，缺陷 1 的修复是「让解析器正确」而不是「改变输入形态」。方案乙则要求导出器精确复现手写格式的每一个细节（缩进、引号、内联数组空格、`sources` 的 `title→url→type` 键序），这些细节**恰恰是当前 30 篇里最容易出错的部分**。
3. **备份与可移植性。** 内容在 Git 里意味着：后台整个删掉，站点照样能维护、能构建、能迁移。DB 只承载「账号/审计/任务」，丢了也只是丢运营数据，不丢内容。这是**降低爆炸半径**而非技术洁癖。
4. **用户要求的是「后台直连数据库」，不是「正文进数据库」。** 这两件事必须分开读。用户的原话是「后台直接接入数据库、新建独立库」——指的是**后台有自己独立的数据库**（而不是后台去连站点已有的库）。方案甲完全满足：后台直连 PostgreSQL，只是那台库里存的是业务态。**我不认为用户要求了正文进库。**
5. **双人复核与合规要求更适合以「文件快照」为对象。** 本站要求代理/VPN 类内容二次复核后才能发布。复核对象是「一份可归档、可核验、与线上产物一一对应的版本」，文件快照比 DB 行更自然。

#### 但我必须诚实标出方案甲的**代价**（不是免费的）

| 代价 | 说明 | 缓解 |
|---|---|---|
| 后台必须会「安全地写 YAML」 | 序列化器一旦出错，就是新一轮静默损坏 | 同源解析/序列化 + round-trip 断言（逐篇比键集合，见缺陷 1 的验收口径） |
| 文件写操作与 DB 事务无法原子统一 | 「更新 DB 记录」与「写文件」不可能在一个事务里 | 采用**文件为真源、DB 为派生视图**的顺序：先写文件成功 → 再写 DB；DB 写失败只影响运营显示，可重建 |
| 多人编辑需要显式冲突处理 | 文件没有行级锁 | content_hash 乐观锁（D5）+ 409 差异视图 |
| 只读文件系统不可用 | 后台需要写入权限 | 后台容器以**专用非 root 用户**运行，只挂载 `content/` 的写权限 |

> **一句话**：**DB 是「后台的心智」，文件是「内容的心脏」。** 后台宕机、DB 损坏都不影响站点；文件损坏才会。因此把内容放在最不容易被单点故障摧毁、且已经有版本控制的地方。

**若日后要翻转到方案乙**，触发条件应是明确的（而非渐进的），至少满足其一：① 编辑者规模超过约 50 人且需要行级协同；② 需要多站点/多语言复用同一内容池；③ 出现「文件系统无法承载」的硬性需求（如多租户隔离）。在达成这些条件前，**不建议**引入导出器。

---

## 3. 技术栈选型与开源复用清单

> 许可信息由 Lead 从各项目源 LICENSE 文件核实，本文件直接引用并标注适用范围。

### 3.1 分层选型表

| 层 | 候选 | 许可（已核） | 活跃度 | 是否推荐 | 「拿走什么」 |
|---|---|---|---|---|---|
| 后端语言 | **Node.js + TypeScript** | MIT（Node 本身） | 极活跃 | ✅ **推荐** | 复用现有 `build-fix.cjs`/`deploy-fixboxs.cjs` 生态；无新运行时 |
| 后端语言 | Java（Spring Boot） | Apache-2.0 | 活跃 | ❌ 见 §3.3 | — |
| 全栈框架 | **Payload v3** | MIT（已核） | 45.2k★，活跃 | ⚠️ **可选**（见 §3.2） | RBAC、登录、媒体库、版本、管理 UI**几乎白拿** |
| 全栈框架 | 自研轻后端（Fastify/Express + 自建 RBAC） | 自选 | — | ✅ **推荐（默认）** | 完全贴合 19 字段 + 10 段骨架；无框架适配成本 |
| 全栈框架 | 芋道 ruoyi-vue-pro | MIT（已核） | 39.7k★，活跃 | ❌ 见 §3.3 | RBAC/菜单按钮级权限/操作与登录日志**最贴合需求**，但代价是 JVM |
| 全栈框架 | RuoYi 若依（单体） | MIT（已核） | 8.6k★ | ❌ 见 §3.3 | 代码可读性极好，UI 较老；同样是 JVM |
| 前端框架 | Vue 3 + Vite + TypeScript | MIT | 极活跃 | ✅ **推荐** | 与既有前端技术栈一致，人才与资料丰富 |
| 前端 UI 壳 | **vue-vben-admin** | MIT（已核） | 33.6k★，活跃 | ✅ **推荐** | 布局/菜单/表格/表单/权限指令，纯 UI 壳，无后端绑定 |
| 前端 UI 壳 | art-design-pro | MIT（已核） | 5.9k★，2026-06 后放缓 | ⚠️ 备选 | 视觉更好，但维护节奏是风险 |
| 前端 UI 壳 | naive-ui-admin | — | **约 9 个月无更新** | ❌ **不推荐** | 停更 |
| 前端 UI 壳 | ant-design-pro | MIT | 活跃 | ⚠️ 不推荐（**React 栈**） | 与 Vue 选型冲突，团队要维护两套心智 |
| UI 组件库 | Element Plus / Naive UI | MIT | 活跃 | ✅ 推荐 | 中文文档完备 |
| 编辑器 | **Vditor** | MIT（已核） | 活跃 | ✅ **推荐** | 中文 Markdown 首选，三模式，**CDN 单文件可零构建引入** |
| 编辑器 | Cherry Markdown | Apache-2.0 | 活跃 | ⚠️ 强备选 | 腾讯出品，功能强；包体更大 |
| 编辑器 | Toast UI Editor | MIT | **已归档（2024-08）** | ❌ **不推荐** | 不再维护 |
| 编辑器 | Monaco / CodeMirror 6 | MIT | 活跃 | ⚠️ 补充 | 纯源码模式可用，**不含 Markdown 专用能力** |
| 数据库 | **PostgreSQL** | PostgreSQL License（无 copyleft） | 极活跃 | ✅ **推荐** | 见 §4.1 |
| 数据库 | MySQL | GPLv2（客户端库豁免） | 极活跃 | ⚠️ 备选（翻转条件见 §4.1） | 服务器已装，可能更空闲 |
| ORM | **Prisma / Drizzle**（Node 栈） | Apache-2.0 / MIT | 活跃 | ✅ 推荐 | 迁移可版本化；Drizzle 更贴近 SQL |
| ORM | MyBatis-Plus（Java 栈） | Apache-2.0 | 活跃 | —（仅 Java 路线） | — |
| 认证 | **Auth.js / Lucia 思路 + 自建会话表** | MIT | 活跃 | ✅ 推荐 | 会话、Cookie、CSRF；**RBAC 仍要自建** |
| 认证 | Gitea / Keycloak | MIT / Apache-2.0 | 活跃 | ❌ 不推荐（本轮） | 引入第二个常驻服务，与「独立登录页」要求不符 |
| front-matter | **gray-matter** | MIT（已核） | 稳定 | ✅ **强烈推荐** | **能正确处置可变嵌套对象**（`sources` 的 2 键/3 键混用） |
| YAML 序列化 | **eemeli/yaml** | ISC（已核） | 活跃 | ✅ **强烈推荐** | round-trip 保留注释与键序 |
| Markdown AST | unified / remark + remark-frontmatter | MIT | 活跃 | ⚠️ 可选 | 需要 AST 级增删改时使用 |
| 部署 | Docker Compose（复用现有 Docker） | Apache-2.0 | 极活跃 | ✅ 推荐 | 服务器已有 Docker，零新增基础设施 |

### 3.2 Payload 还是自研？——一个必须先回答的分叉

这是 Node 路线内部的选型，直接决定 §3.1 里「全栈框架」取哪一行。

| 项 | Payload v3 | 自研轻后端 + vben-admin 壳 |
|---|---|---|
| 许可 | MIT（已核） ✅ | 自选 ✅ |
| 数据库适配器 | **仅 MongoDB / Postgres / SQLite，无 MySQL 适配器**（官方 database overview 已核） | 任意（Prisma/Drizzle 均支持 PG/MySQL） |
| RBAC | 内置，且可扩展 | 需自建（约 1–2 人日） |
| 管理 UI | 内置（React 栈） | vben-admin（Vue 栈） |
| 登录页可定制性 | 中（框架自带登录，改样式与流程需适配） | **高**（完全自建，可满足「独立登录页 + root 分发」的全部细节） |
| 与「19 字段 + 10 段骨架 + 可变 sources」的贴合度 | 中：Payload 的字段模型是**固定列**风格，`sources` 这种「可变键的对象数组」可用数组字段表达，但**输出序列化格式受框架控制**，与现有 30 篇手写格式的逐字节一致性需额外适配 | **高**：序列化器由自己掌控，可精确复现 `title→url→type` 键序与缩进 |
| 前端技术栈 | React（若团队/现有资产是 Vue，则新增一套心智） | Vue（与 vben-admin 一致） |
| 工作量 | 少 3–5 人日 | 多 3–5 人日，但完全可控 |
| 可逆性 | 中（Payload 的 schema 与数据模型会形成依赖） | 高 |

**结论**：

- **若接受 PostgreSQL**（本方案推荐），Payload 是**值得认真考虑的降本选项**——但要注意它**不支持 MySQL**，这让「数据库选型」与「框架选型」耦合：**选 MySQL 就等于关掉 Payload 这条路**（见 §4.1 的推荐理由之一）。
- **本方案默认推荐「自研轻后端 + vue-vben-admin」**，理由是本项目的**内容格式约束异常苛刻且非标准**：(1) 19 字段且字段集合会演化；(2) 正文要求恰好 10 个 H2 且含同义标题白名单；(3) `sources` 是**可变键的对象数组**且键序有语义。这三点都是「**契约**」而非「内容」，用通用框架表达会持续与框架的默认行为搏斗。**自研序列化层的成本，低于长期适配框架输出格式的成本。**
- **折中路径**：用 Payload 做账号/权限/媒体/版本（这些是通用能力），**自己写正文与 front-matter 的读写层**（这是本项目的特殊性所在）。这是一个真实可行的中间选项，代价是两套模型并存。

### 3.3 Java（芋道/RuoYi）vs Node：我的明确结论

**结论：不引入 JVM 栈。走 Node。**

芋道 ruoyi-vue-pro 的诱惑是真实的：**自带 RBAC 动态权限、菜单/按钮级权限、操作日志与登录日志（审计）、部门岗位、代码生成器、root 超管下发账号**——与用户需求几乎重合，等于把下半部分第 5、6 章的一大半工作白拿。**如果这是一个「从零开始的企业后台项目」，我会推荐它。**

但本项目不是。**运维成本的账要算清楚**：

| 成本项 | 引入 JVM（芋道/RuoYi） | 保持 Node |
|---|---|---|
| 新增运行时 | **JVM 常驻**（Spring Boot 容器通常 512MB–1GB 起），叠加在已有 MySQL+PG+nginx+2 个 Next.js 之上 | 无新增运行时概念（Node 已在跑两个应用） |
| 与现有资产的连接 | `build-fix.cjs`、`deploy-fixboxs.cjs`、`deploy-fixboxs.sh` **全是 Node/Shell**。JVM 后台要发布，必须 **JVM 进程 → 调 Node 子进程**，跨语言进程编排、错误传播、日志聚合都要现做 | 后台可**直接 `require`/`spawn`** 现有脚本，错误栈与日志同源 |
| 部署栈 | 两套构建（Maven/Gradle + npm）、两套依赖升级节奏、两套 CVE 响应流程 | 一套 npm |
| 内容格式层 | 必须用 Java 重写 front-matter 解析/序列化，**而正确处置可变嵌套对象正是缺陷 1 的核心**；Java 侧要么引 SnakeYAML 手写映射，要么引 Jackson YAML——**等于把「用成熟库」的优势重新赌一次** | 直接用 `gray-matter` + `eemily/yaml`，这两个库**已被验证能正确处理本项目的结构** |
| 人力 | 需要有人能改 Spring Boot（权限、审计、发布编排都要改） | 改 Node 的门槛低得多 |
| 白拿的价值 | RBAC + 审计 + 账号分发（估 3–5 人日） | 0 |
| 净账 | **省 3–5 人日，换来一个长期常驻的第二运行时 + 25–40% 的额外内存占用 + 一条跨语言发布链** | — |

**判定**：在**共享的小型云服务器**（同机已有 nginx、MySQL、PostgreSQL、两个 Next.js 应用）上，为了省 3–5 人日的 RBAC 开发，永久性地多养一个 JVM 运行时和一条跨语言发布链，**不划算**。这台机器的资源与运维注意力是**共用且有限**的；JVM 的固定开销与升级负担不会因为「后台只服务 5–10 个编辑者」而缩小。

**一句话**：**芋道是好东西，但它是「另一家公司」的东西——它的价值在大型团队与纯 Java 技术栈里才能兑现。本项目要的是「一个能安全写 markdown 的小后台」，用 Node 自研 + 成熟库，比引入 JVM 更快、更省、更贴合。**

> **翻转条件**（诚实标出）：若未来出现以下任一情形，应重新评估 Java 栈——① 内部人员规模超过约 30 人，RBAC/部门/岗位的复杂度显著上升；② 需要与公司既有的 Java 系统对接（单点登录、组织架构同步）；③ 团队已有稳定的 Java 运维能力且服务器资源充裕。**在当前的 5–10 人、单体小站场景下，这些都不成立。**

### 3.4 不建议使用及原因

| 项目 | 不推荐原因 | 依据 |
|---|---|---|
| **Strapi** | 核心 MIT Expat，但 **`ee/` 目录为专有许可**；**Audit Logs 等在企业版目录**——免费版拿不到审计日志，而审计正是用户「完整安全机制」与 root 分发账号的**必需项** | 源 LICENSE 原文已核 |
| **Directus** | 许可已**不是 GPL-3.0**，现为 **MSCL-1.0-GPL**（含 Competing Use 限制，非标准开源）；且架构是 **DB 为真源**，与 §2.3 的结论直接冲突；**不支持单库多 schema** | 源 LICENSE 原文已核 |
| **Toast UI Editor** | **已于 2024-08 归档**，不再维护 | 仓库状态 |
| **sober-admin** | **经 GitHub 核查不存在知名同名项目**，勿采用（避免以讹传讹） | 核查结论 |
| **naive-ui-admin** | **约 9 个月无更新**，作为长期运营后台的 UI 基座风险偏高 | 仓库提交历史 |
| **ant-design-pro** | MIT 但为 **React 栈**，与 Vue 选型冲突，维护两套心智 | 技术栈 |
| **Gitea / Keycloak 作为认证旁路** | 本轮前提变更后，用户要求**独立登录页 + root 直接分发**；引入第二套账号体系反而是分裂。**（注意：这不是否定 Gitea 本身的价值，只是它在本轮需求下不再是答案）** | 前提 |
| **手写 front-matter 正则** | **本项目已在为它付出代价**：109 条 URL 丢失（缺陷 1）。必须换成熟库 | `build-fix.cjs:78-97` |

> **关于「复用开源」的态度**：用户明确鼓励复用。本节列出的「不推荐」**不是拒绝开源**，而是逐项说明**为什么这些具体项目不匹配**。§3.1 中推荐的 Vditor、vue-vben-admin、gray-matter、eemeli/yaml、Payload 全部是开源项目，且都是「拿走成熟能力、自己只写本项目独有的 10%」。

---

## 4. 数据库设计

### 4.1 数据库选型：推荐 PostgreSQL（含翻转条件）

| 判据 | PostgreSQL | MySQL | 对本项目的影响 |
|---|---|---|---|
| **DDL 事务性** | ✅ 支持事务性 DDL，迁移失败可**整体回滚** | ❌ DDL 隐式提交，迁移中途失败会留下**半成品 schema** | 后台会持续演进表结构；半成品 schema 在共享服务器上是事故 |
| **JSON 索引能力** | ✅ `jsonb` + **GIN** 可对**任意路径**建索引 | ❌ **无法为 JSON 内部字段建二级索引**，需生成列变通 | 审计日志 `detail`、发布任务的**分步 logs** 都是天然 JSON；可索引 = 能查「谁在什么时候改了哪个字段」 |
| **未来框架可换性** | ✅ Payload 支持 PG | ❌ **Payload v3 适配器仅 MongoDB/Postgres/SQLite，无 MySQL** | 选 MySQL 会**锁死** Node 后台框架的换路（见 §3.2） |
| **许可** | PostgreSQL License，**无 copyleft** | GPLv2（客户端库有豁免） | 自用场景两者都无碍，但 PG 更清晰 |
| **共享机误伤风险** | ✅ `pg_restore` **可按库还原** | ⚠️ `mysqldump --all-databases` 回灌是**最危险的误伤习惯** | 本机已有其他应用的库，隔离与按库恢复是硬需求 |
| **服务器现状** | 已安装 | 已安装 | 两者都可用，需实测占用 |

**推荐：PostgreSQL。** 核心理由归纳为一条：**本方案要求的是一个「在共享服务器上、能被安全隔离、且支持演进」的库**——PG 的事务性 DDL、`jsonb` 索引、按库还原三点，正好各自命中「迁移安全」「审计可查」「不误伤别人」三个需求。

**翻转条件（必须实测后决定，不要凭直觉）**：若探查发现 **PostgreSQL 正被现有应用占用且负载高**、而 **MySQL 完全空闲**，则改选 MySQL。判定方法（用**活跃连接数**而非「装了没装」）：

```sql
-- PostgreSQL：活跃连接与库级活动
SELECT datname, count(*) AS conns, sum(active) AS active_conns
FROM (SELECT datname, (state = 'active')::int AS active
      FROM pg_stat_activity) t
GROUP BY datname ORDER BY active_conns DESC;

-- MySQL：按库的活跃会话
SELECT table_schema, COUNT(*) AS conns
FROM information_schema.processlist GROUP BY table_schema;
```

- 若 PG 侧出现**持续高活跃连接**且属于他人应用 → 选 MySQL（并接受失去 Payload 选项、用生成列变通 JSON 索引）；
- 若 MySQL 侧更忙 → 选 PG；
- 若两者都空闲 → 按本方案默认选 **PG**。

> **注意**：这个决定必须在**开工前**用上述命令实测一次并记录输出。凭「服务器上装了哪个」做决定，正是本方案要避免的失误。

### 4.2 独立建库与最小权限（完整做法）

**硬目标**：后台库与已有库**双向不可见**。不仅要「不连别人」，还要「别人连不到我」。

#### 步骤 1：建库与专用角色

```sql
-- 以超级用户执行；库名/角色名一次定死，后续迁移脚本一律引用它
CREATE DATABASE yuanabd_pc_fixboxs
  WITH ENCODING 'UTF8'
       LC_COLLATE 'zh_CN.UTF-8'
       LC_CTYPE   'zh_CN.UTF-8'
       TEMPLATE template0;

-- 专用角色：只用于本后台，绝不与其他应用共用
CREATE ROLE fixboxs_app LOGIN PASSWORD '<由密钥管理器生成，不进代码库>';
```

#### 步骤 2：逐库 REVOKE CONNECT（关键的一步）

PostgreSQL 的 `PUBLIC` 角色**默认对所有库有 CONNECT 权限**。只建库不改权限，等于任何人（含其他应用的 DB 用户）都能连上来。必须：

```sql
-- 1) 收回「所有人默认可连」这一 PostgreSQL 默认行为
REVOKE CONNECT ON DATABASE yuanabd_pc_fixboxs FROM PUBLIC;

-- 2) 只授予本后台的角色
GRANT CONNECT ON DATABASE yuanabd_pc_fixboxs TO fixboxs_app;

-- 3) 反方向：确认本后台角色连不上别人的库
--    对每一个已有库逐一执行（库名需先列出，见验证步骤）
REVOKE CONNECT ON DATABASE <已有库A> FROM fixboxs_app;
REVOKE CONNECT ON DATABASE <已有库B> FROM fixboxs_app;
```

#### 步骤 3：库内权限收敛

```sql
-- 切到 yuanabd_pc_fixboxs 库，以超级用户执行
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO fixboxs_app;

-- 让 fixboxs_app 只能操作本库对象，不能建库
ALTER ROLE fixboxs_app NOCREATEDB NOCREATEROLE NOSUPERUSER;

-- 表级权限（新表默认不继承，需对每个迁移后的表授权或设置默认权限）
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO fixboxs_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO fixboxs_app;

-- 未来的表自动继承（避免每次迁移后忘记授权）
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO fixboxs_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO fixboxs_app;
```

> **注意**：如删除用户/审计留痕需要，可给 `fixboxs_app` **不给 DELETE 权限**、只给「软删除」列，这是更强的保证；本方案默认给 DELETE（后台需要硬删草稿），但**审计日志表单独收紧为「只允许 INSERT」**——见 §4.3。

#### 步骤 4：必须验证隔离（验收命令，不能省）

**验证 A：后台角色能连自己的库**
```bash
PGPASSWORD='<pwd>' psql -h 127.0.0.1 -U fixboxs_app -d yuanabd_pc_fixboxs -c 'SELECT current_database();'
# 期望：成功返回 yuanabd_pc_fixboxs
```

**验证 B：后台角色连不上任何已有库（逐库核对）**
```bash
# 先列出全部库
psql -U postgres -Atc "SELECT datname FROM pg_database WHERE datistemplate = false;"
# 对除 yuanabd_pc_fixboxs 外的每一个库执行；期望每一个都 PERMISSION DENIED
PGPASSWORD='<pwd>' psql -h 127.0.0.1 -U fixboxs_app -d <已有库X> -c 'SELECT 1;'
# 期望：FATAL: permission denied for database "<已有库X>"
```

**验证 C：匿名/其他角色连不上后台库**
```bash
psql -U postgres -Atc "SELECT datname, has_database_privilege('public', datname, 'CONNECT')
                       FROM pg_database WHERE datname = 'yuanabd_pc_fixboxs';"
# 期望：yuanabd_pc_fixboxs | f    （public 不可连）
```

**验证 D：确认没有连到错误的库（应用侧自检）**
后台启动时执行 `SELECT current_database()` 并与白名单常量比对，**不匹配则拒绝启动**。这是防止「环境变量配错导致连上生产主库」的最后一道保险。

> **验收标准**：A 通过 + B 对**每一个**已有库都返回 permission denied + C 返回 `f` + D 生效。四项全绿才算「独立建库」完成。**只做步骤 1–3 而不做验证，等于没有隔离。**

### 4.3 表设计（只存业务态，不存正文）

> 再次明确：**本库不含正文**（§2.3）。所有表只承载「后台运营」所需数据。

| 表 | 关键字段 | 用途 | 约束要点 |
|---|---|---|---|
| `users` | id, username, email, display_name, password_hash, password_changed_at, status, must_change_password, totp_secret, totp_enabled, created_by, created_at | 账号（含 root 分发的账号） | `username` 唯一；`password_hash` 用 argon2id；`must_change_password` 支撑「首次登录强制改密」 |
| `roles` | id, code, name, description, is_system | 角色字典 | `root` 标 `is_system = true`，**不可删除** |
| `user_roles` | user_id, role_id, scope_domain | 用户-角色 + **领域作用域** | `(user_id, role_id, scope_domain)` 唯一；`scope_domain` 可空表示全领域 |
| `permissions` / `role_permissions` | code（如 `article.publish`）, role_id | 权限码与角色映射 | 权限**在服务端每个路由校验**，不靠前端隐藏按钮 |
| `sessions` | id, user_id, token_hash, created_at, last_seen_at, expires_at, absolute_expires_at, ip, user_agent, revoked_at | 会话 | 存 **token 哈希**不存原文；改密即 `revoked_at` 全部会话 |
| `invites` | id, token_hash, email, role_id, scope_domain, expires_at, used_at, revoked_at, created_by | root 下发账号的一次性激活链接 | **一次性**（`used_at` 非空即失效）+ **可撤销**（`revoked_at`）+ **有效期** |
| `articles_meta` | slug (PK), title, domain, category, status, content_hash, git_commit, author_id, reviewer_id, published_at, archived_at, superseded_by, updated_at | 文章的**派生视图**（真源在文件） | `content_hash` 支撑乐观锁；`git_commit` 支撑「这一版对应哪个提交」；**此表可由文件重建** |
| `article_versions` | id, slug, content_hash, git_commit, author_id, created_at, note | 版本索引（快速列出历史） | 只是 **Git 的索引**，不存正文副本，避免第二真源 |
| `review_notes` | id, slug, content_hash, user_id, action(submit/approve/reject), body, created_at | 审核意见与流转记录 | 放在库里而非 md 里，**避免污染内容文件** |
| `audit_log` | id, user_id, action, target_type, target_id, detail `jsonb`, ip, created_at | 审计 | `detail` 用 `jsonb` + GIN 索引；**该表只允许 INSERT**（应用角色不授 UPDATE/DELETE） |
| `publish_jobs` | id, slug, action(publish/archive/revert), status, step_logs `jsonb`, error, created_by, created_at, started_at, finished_at | 发布队列 | 单并发：同一时刻至多一个 `running`（用部分唯一索引强制） |
| `media` | id, slug, path, mime, bytes, sha256, alt, uploaded_by, created_at | 媒体元数据（**文件本体留仓库**） | 与 §2.3 一致：文件是资产真源 |
| `settings` | key, value `jsonb`, updated_by, updated_at | 站点级配置 | 不含密钥（密钥走环境变量/密钥文件） |

**几处必须强调的约束**：

1. **`sources` 不在本库建表**（因为不存正文）。编辑器所需的 `sources` 结构（**可变字段的对象数组**：`title` 必填、`url` 必填 https、`type` 可选）由**序列化层**保证，不落库。若日后确需在库中检索来源，应存为 `jsonb`（而非固定三列）——**固定三列会在 20 篇两键文章上写失败或在 10 篇三键文章上丢 type**。
2. **审计表 append-only**：应用角色的权限里**不给** `audit_log` 的 `UPDATE`/`DELETE`，从数据库层保证「审计不可篡改」——这比在应用层约束更硬。
3. **单并发发布由数据库兜底**：
   ```sql
   CREATE UNIQUE INDEX one_running_publish_job
     ON publish_jobs ((status)) WHERE status = 'running';
   ```
   即使应用层出现 bug，数据库也会拒绝第二个并发发布任务。
4. **`articles_meta` 必须可从文件重建**：写一个 `rebuild-from-files` 命令，任何时候都能扫 `content/fixboxs/*.md` 重建该表。这是「DB 是派生视图」这一主权的**可验证证明**——如果这张表重建不出来，说明我们实质上已经退化成方案乙，需要立刻纠正。

### 4.4 迁移策略

| 项 | 做法 |
|---|---|
| 迁移工具 | Prisma Migrate 或 Drizzle Kit；**迁移文件入库**（进入 §1.3 缺失的 Git 基线） |
| 事务性 | 依赖 PG 的事务性 DDL：**每个迁移要么全成功、要么全回滚**（§4.1 选 PG 的直接收益） |
| 共享机纪律 | 迁移**只操作 `yuanabd_pc_fixboxs`**；迁移脚本中**禁止**出现 `DROP DATABASE`、跨库语句、`pg_dumpall` |
| 前置备份 | 每次迁移前自动 `pg_dump -Fc yuanabd_pc_fixboxs`，保留最近 N 份 |
| 回滚 | 结构回滚靠「反向迁移」；**数据回滚靠 `pg_restore` 的单库还原**（正是 §4.1 选择 PG 的理由之一） |
| 生产验证 | 迁移后在**预发布端口**先跑一次；确认后台能启动且 `current_database()` 校验通过 |
| 破坏性变更 | 分两次发布（先加新列→回填→再删旧列），避免单次不可逆 |

### 4.5 「绝不触碰已有库」的硬保证

| 层 | 保证手段 |
|---|---|
| **数据库权限层** | §4.2 的四项验证：`REVOKE CONNECT ... FROM PUBLIC` + 对每个已有库 `REVOKE CONNECT FROM fixboxs_app`。**物理上连不上**比任何约定都可靠 |
| **应用连接层** | 连接串只来自环境变量；启动自检 `current_database()` 白名单比对，不匹配**拒绝启动** |
| **迁移脚本层** | 迁移目录纳入代码评审；CI/人工检查禁止出现跨库与 `DROP DATABASE` 语句 |
| **备份层** | **只允许按库备份与还原**（`pg_dump -d yuanabd_pc_fixboxs` / `pg_restore -d yuanabd_pc_fixboxs`）；**明确禁止** `pg_dumpall` 回灌与 `mysqldump --all-databases`——这是共享机上最容易造成连带事故的操作 |
| **运维层** | 后台容器只挂载自己的数据卷与 `content/`；不挂载其他应用的目录 |
| **审计层** | 任何对库的操作走后台的迁移流程并留痕；手工 `psql` 改动需在 `settings`/变更记录中说明 |

> **验收**：完成 §4.2 验证 A–D，并**留一次实测记录**（命令 + 输出）归档到项目文档；此后每月复验一次（放在运维检查表里）。

---

## 5. 上半部分小结与下游依赖

| # | 结论 | 下游影响 |
|---|---|---|
| 1 | 前提已被用户替换：Git 后端 CMS 路线（含 A′）整个出局，自建后台是唯一答案 | 下半部分第 5、6 章必须自建账号体系与全部安全项 |
| 2 | **正文真源 = markdown + Git；DB 只存业务态**（方案甲） | 下半部分第 7 章发布链路以「文件为真源」设计；`articles_meta` 必须可重建 |
| 3 | **数据库选 PostgreSQL**，但**必须先用活跃连接数实测**再定 | 下半部分第 9 章决策清单第 1 项 |
| 4 | **不引入 JVM**，走 Node + 自研（或 Payload 折中） | 下半部分第 5 章 RBAC 需自建，不能指望芋道白拿 |
| 5 | **`sources` 是可变字段的对象数组**（title/url 必有，type 可选）；109 url / 32 type 是回归基线 | 下半部分第 7 章序列化器与编辑器控件设计 |
| 6 | 两个致命缺陷（解析器丢 109 条 URL、流水线未入 Git）**与选型无关，必须最先修** | 下半部分第 8 章路线图的前置阶段 |

---

*本文件为《管理后台系统实施方案 V2.0》上半部分（第 1–4 章）。所有「现状判定」基于 2026-10-12 对工作副本 `F:\CodeFiles\YuanAbd-Web` 的独立实测复现：30 篇 markdown 的 front-matter 全量解析、`build-fix.cjs` 解析器行为复现（109/109 `url` 与 32/32 `type` 丢失）、`git ls-files content` 计数、`package.json` 存在性、正文 H2 标题分布统计。许可结论引自各项目源 LICENSE 文件。不含任何代码改动；下半部分见 [管理后台系统实施方案-V2-下.md](./pc-fixboxs.yuanabd.cn-管理后台系统实施方案-V2-下.md)。*