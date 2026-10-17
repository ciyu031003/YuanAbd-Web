# SOP 参考资料（content/sop-source）

把公司《新人故障类目SOP.xlsx》整理成站内可检索的 13 篇「参考资料」，生成到 `content/fixboxs/sop-*.md`。

## 为什么单独做一套流程

故障教程（30 篇）是**我们自己写的排障方法**，正文走 10 段骨架；
SOP 表格里的是**公司已有的作业指导**，原文在内部知识库（mvs-h5.edianzu.cn，需要账号），
站上不做全文复制，只做**索引 + 分类 + 一句话提醒 + 风险提示**，并保留每条原文链接。

因此：

- front-matter 带 `kind: reference`，domain 为 `ref-manual`（装机与运维手册）/ `ref-field`（现场作业与工单）；
- 前台列表显示「参考 SOP」徽章，领域页单独成组，搜索里可按「参考 SOP」筛选；
- 正文是 `快速概览 / 适用对象 / 风险提示 / 分步骤 / 原始 SOP（表格）/ 处理明细（逐条）/ 来源`，不是教程骨架；
- `content-lint.cjs` 对参考资料改用另一套必写段落（`快速概览` + `分步骤`）。

## 文件

| 文件 | 作用 |
|---|---|
| `catalog.cjs` | **单一真源**：13 篇的分区、分步、每一条 SOP 的 name/url/说明/提醒 |
| `gen.cjs` | 由 catalog 生成 `content/fixboxs/sop-*.md`（整份覆盖） |
| `import-xlsx.cjs` | 校验 xlsx 与 catalog 是否一一对应（表格更新后跑一次） |
| `xlsx.cjs` | 零依赖 xlsx 读取（解 zip + sharedStrings + worksheet） |

## 日常流程

```bash
# 1. 表格有新条目 → 先看差在哪
node content/sop-source/import-xlsx.cjs 新人故障类目SOP.xlsx     # 退出码 2 = 有缺失
# 2. 把缺失条目补进 catalog.cjs（按表格顺序放）
# 3. 重新生成 + 校验 + 构建
node content/sop-source/gen.cjs
node content-lint.cjs && node build-fix.cjs
```

生成后在后台 `/articles` 里能看到这 13 篇（状态 published），前台 `/browse.html#ref-manual` 可直接查看。

## 注意

- **不要手改 `content/fixboxs/sop-*.md`**：下次生成会整体覆盖。要改内容就改 `catalog.cjs`。
- `catalog.cjs` 里的「说明 / 提醒」是我们自己的注释，不是原文摘录；涉及收费、定性的表述以原文与公司规则为准。
- 13 篇的分区见 `catalog.cjs` 顶部注释：A–M 对应 13 篇文章。
