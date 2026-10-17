---
title: 换机与重装前的数据备份速查：桌面、文档、浏览器、微信与企业微信
slug: sop-data-backup-migrate
kind: reference
domain: ref-manual
category: ref-data-migrate
os: [Windows, macOS]
difficulty: 入门
time: 10-30 分钟
risk: 需谨慎
symptoms: [换机与重装前的数据备份速查 处理方法, SOP 参考]
keywords: [换机与重装前的数据备份速查 SOP, 桌面, 文档, 浏览器, 微信与企业微信, 参考手册, 作业指导]
aliases: [SOP, 作业指导, 参考手册, 换机与重装前的数据备份速查]
updated: 2026-10-17
version: "1.0"
prerequisites: [能登录公司内部 SOP 知识库（部分原文需要账号）]
tools: [浏览器, 内部 SOP 知识库]
related: [sop-pe-usb-install, sop-macos-maintain, sop-diagnose-tools]
sources:
  - title: 公司 SOP 知识库 — Windows拷贝数据方法
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3172
    type: internal
  - title: 公司 SOP 知识库 — 联想电脑管家拷贝数据方法
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3171
    type: internal
  - title: 公司 SOP 知识库 — edge浏览器书签&密码导出导入方法
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3212
    type: internal
  - title: 公司 SOP 知识库 — Win企业微信备份还原聊天记录方法
    url: https://mvs-h5.edianzu.cn/tips-detail?id=2990
    type: internal
  - title: 公司 SOP 知识库 — Win共享文件夹及报错解决方法
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3085
    type: internal
  - title: 公司 SOP 知识库 — 苹果迁移助理使用方法
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3053
    type: internal
  - title: Apple 支持 — Mac 使用手册
    url: https://support.apple.com/zh-cn/guide/mac-help/welcome/mac
    type: official
  - title: Apple 支持 — 在 Mac 上使用「磁盘工具」
    url: https://support.apple.com/zh-cn/guide/disk-utility/welcome/mac
    type: official
reviewer: 内容组
reviewed_at: 2026-10-17
---

# 换机与重装前的数据备份速查：桌面、文档、浏览器、微信与企业微信

## 快速概览

换机、重装、返修之前，**数据是唯一不能重来的东西**。

这一页把 SOP 里「拷贝数据」「浏览器书签与密码」「微信/企业微信」「共享盘」的条目串成一份检查清单：

按用户目录逐项过一遍，再签字确认，基本不会漏。

本页共整理 **16** 条 SOP 条目，全部保留原始链接；处理细节以原文为准。

## 适用对象

换机/重装/返修前负责数据转移的工程师。

## 风险提示

> ⚠ 动手前请逐条核对；涉及数据、证件、客户设备安全的操作，先取得授权再执行。

1. **先备份、后动手**：未完成备份不得格式化、不得拆盘、不得装系统。
2. 浏览器密码、企微/微信聊天记录属于敏感数据，导出文件用完即删，不得留存于个人设备。
3. 备份目标盘容量与健康度要检查：备到坏盘上等于没备。

## 分步骤

### 步骤 1：确认要备什么

**目的**：按用户目录逐项核对

**操作**：
1. 桌面、文档、下载、图片、视频、收藏夹（浏览器书签）。
2. 微信 / 企业微信聊天记录与文件。
3. Outlook 邮件数据、专用客户端（财务/HR/设计软件）的数据目录。
4. 网络共享盘上的个人目录、打印机/扫描仪配置。

**预期结果**：第 1 步的操作都完成后，问题现象能被复现或排除，并能对应到下面「原始 SOP」里的具体条目。

**失败怎么办**：对不上具体条目 → 回到「快速概览」确认现象描述，或按「仍需帮助」一节的说明升级。

### 步骤 2：选择备份方式

**目的**：量大用工具，量小手动

**操作**：
1. 小批量：直接复制到外部硬盘或网盘。
2. 大批量：用 fastcopy 之类的工具，先拷后校验。
3. Mac：优先时间机器整机备份。

**预期结果**：第 2 步的操作都完成后，问题现象能被复现或排除，并能对应到下面「原始 SOP」里的具体条目。

**失败怎么办**：对不上具体条目 → 回到「快速概览」确认现象描述，或按「仍需帮助」一节的说明升级。

### 步骤 3：校验与迁移

**目的**：拷完不算完，能打开才算

**操作**：
1. 抽查文件数量、大小与随机打开。
2. 新机器上逐项还原，并把桌面/文档路径指向用户目录。
3. 微信/企微按原文还原聊天记录后登录验证。

**预期结果**：第 3 步的操作都完成后，问题现象能被复现或排除，并能对应到下面「原始 SOP」里的具体条目。

**失败怎么办**：对不上具体条目 → 回到「快速概览」确认现象描述，或按「仍需帮助」一节的说明升级。

### 步骤 4：留证与回收

**目的**：责任边界

**操作**：
1. 客户确认数据完整后签字。
2. 旧机器按「数据清除」要求处理，确认已清空再回收。

**预期结果**：第 4 步的操作都完成后，问题现象能被复现或排除，并能对应到下面「原始 SOP」里的具体条目。

**失败怎么办**：对不上具体条目 → 回到「快速概览」确认现象描述，或按「仍需帮助」一节的说明升级。

## 原始 SOP

下表的「原文」全部指向公司 SOP 知识库（需要内部账号登录）。点击即可核对处理步骤、截图与注意事项。

| 条目 | 是什么 / 什么时候用 | 一句话提醒 | 原文 |
|---|---|---|---|
| Windows拷贝数据方法 | Windows 下数据拷贝的完整清单。 | 按用户目录逐项核对 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3172) |
| fastcopy使用方法 | 大批量拷贝与校验。 | 先拷后校验 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3211) |
| 联想电脑管家拷贝数据方法 | 联想专用迁移工具。 | 仅限联想机型 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3171) |
| 谷歌浏览器书签导入导出方法 | Chrome 书签迁移。 | 账号同步更省事 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3197) |
| edge浏览器书签&密码导出导入方法 | Edge 书签与密码。 | 密码文件用完即删 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3212) |
| outlook邮箱备份还原、删除账户方法 | Outlook 数据与账户。 | PST 体积大 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3187) |
| Win企业微信备份还原聊天记录方法 | 企微聊天记录迁移。 | 备份到非系统盘 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2990) |
| 微信导数据方法 | 个人微信迁移。 | 两端同账号登录 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3079) |
| Win共享文件夹及报错解决方法 | 局域网共享与报错。 | 先看权限 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3085) |
| 苹果时间机器的使用 | Mac 整机备份。 | 备份盘容量大于 1.5 倍 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3054) |
| 苹果迁移助理使用方法 | Mac 换机迁移。 | 系统版本尽量一致 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3053) |
| 苹果无法进入系统时导资料方法 | Mac 不能开机时导数据。 | 目标磁盘模式 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2912) |
| macOS设置共享盘方法 | Mac 共享盘设置。 | 注意 SMB 版本 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3056) |
| 隔空投送使用方法 | 小文件快传。 | 同一 Apple ID | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3055) |
| Windows的EFS加密解密方法 | 加密文件的迁移与解密。 | 证书丢=数据丢 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3062) |
| 企微聊天记录损坏无法识别修复方法 | 企微数据损坏修复。 | 先备份数据目录 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3240) |

## 处理明细

上表是把条目「按顺序摊开」；这一节给每一条一条带编号的明细，写入工单时可以直接引用编号，例如「按 SOP 第 12 条的步骤处理」。

### 01｜Windows拷贝数据方法
**是什么**：Windows 下数据拷贝的完整清单。

- 提醒：按用户目录逐项核对

**原文**：[Windows拷贝数据方法](https://mvs-h5.edianzu.cn/tips-detail?id=3172)

### 02｜fastcopy使用方法
**是什么**：大批量拷贝与校验。

- 提醒：先拷后校验

**原文**：[fastcopy使用方法](https://mvs-h5.edianzu.cn/tips-detail?id=3211)

### 03｜联想电脑管家拷贝数据方法
**是什么**：联想专用迁移工具。

- 提醒：仅限联想机型

**原文**：[联想电脑管家拷贝数据方法](https://mvs-h5.edianzu.cn/tips-detail?id=3171)

### 04｜谷歌浏览器书签导入导出方法
**是什么**：Chrome 书签迁移。

- 提醒：账号同步更省事

**原文**：[谷歌浏览器书签导入导出方法](https://mvs-h5.edianzu.cn/tips-detail?id=3197)

### 05｜edge浏览器书签&密码导出导入方法
**是什么**：Edge 书签与密码。

- 提醒：密码文件用完即删

**原文**：[edge浏览器书签&密码导出导入方法](https://mvs-h5.edianzu.cn/tips-detail?id=3212)

### 06｜outlook邮箱备份还原、删除账户方法
**是什么**：Outlook 数据与账户。

- 提醒：PST 体积大

**原文**：[outlook邮箱备份还原、删除账户方法](https://mvs-h5.edianzu.cn/tips-detail?id=3187)

### 07｜Win企业微信备份还原聊天记录方法
**是什么**：企微聊天记录迁移。

- 提醒：备份到非系统盘

**原文**：[Win企业微信备份还原聊天记录方法](https://mvs-h5.edianzu.cn/tips-detail?id=2990)

### 08｜微信导数据方法
**是什么**：个人微信迁移。

- 提醒：两端同账号登录

**原文**：[微信导数据方法](https://mvs-h5.edianzu.cn/tips-detail?id=3079)

### 09｜Win共享文件夹及报错解决方法
**是什么**：局域网共享与报错。

- 提醒：先看权限

**原文**：[Win共享文件夹及报错解决方法](https://mvs-h5.edianzu.cn/tips-detail?id=3085)

### 10｜苹果时间机器的使用
**是什么**：Mac 整机备份。

- 提醒：备份盘容量大于 1.5 倍

**原文**：[苹果时间机器的使用](https://mvs-h5.edianzu.cn/tips-detail?id=3054)

### 11｜苹果迁移助理使用方法
**是什么**：Mac 换机迁移。

- 提醒：系统版本尽量一致

**原文**：[苹果迁移助理使用方法](https://mvs-h5.edianzu.cn/tips-detail?id=3053)

### 12｜苹果无法进入系统时导资料方法
**是什么**：Mac 不能开机时导数据。

- 提醒：目标磁盘模式

**原文**：[苹果无法进入系统时导资料方法](https://mvs-h5.edianzu.cn/tips-detail?id=2912)

### 13｜macOS设置共享盘方法
**是什么**：Mac 共享盘设置。

- 提醒：注意 SMB 版本

**原文**：[macOS设置共享盘方法](https://mvs-h5.edianzu.cn/tips-detail?id=3056)

### 14｜隔空投送使用方法
**是什么**：小文件快传。

- 提醒：同一 Apple ID

**原文**：[隔空投送使用方法](https://mvs-h5.edianzu.cn/tips-detail?id=3055)

### 15｜Windows的EFS加密解密方法
**是什么**：加密文件的迁移与解密。

- 提醒：证书丢=数据丢

**原文**：[Windows的EFS加密解密方法](https://mvs-h5.edianzu.cn/tips-detail?id=3062)

### 16｜企微聊天记录损坏无法识别修复方法
**是什么**：企微数据损坏修复。

- 提醒：先备份数据目录

**原文**：[企微聊天记录损坏无法识别修复方法](https://mvs-h5.edianzu.cn/tips-detail?id=3240)

## 仍需帮助

- 原文能对上但做不下去：按「工单升级方法」带上截图与现象升级，不要在客户现场硬试。
- 本文与原文不一致：以原文为准，并在「纠错与反馈」告诉我们，我们会回来更新这份索引。
- 需要看具体的排障思路，而不是 SOP 索引：去「领域」页找对应的故障教程。
