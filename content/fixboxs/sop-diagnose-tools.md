---
title: 故障检测工具速查：蓝屏、DMP、硬盘、内存、温度与日志
slug: sop-diagnose-tools
kind: reference
domain: ref-manual
category: ref-tools-diag
os: [Windows]
difficulty: 入门
time: 10-30 分钟
risk: 需谨慎
symptoms: [故障检测工具速查 处理方法, SOP 参考]
keywords: [故障检测工具速查 SOP, 蓝屏, DMP, 硬盘, 内存, 温度与日志, 参考手册, 作业指导]
aliases: [SOP, 作业指导, 参考手册, 故障检测工具速查]
updated: 2026-10-17
version: "1.0"
prerequisites: [能登录公司内部 SOP 知识库（部分原文需要账号）]
tools: [浏览器, 内部 SOP 知识库]
related: [sop-pe-usb-install, sop-macos-maintain, sop-printer-connected-fix]
sources:
  - title: 公司 SOP 知识库 — 查看可靠性历史和事件查看器方法
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3078
    type: internal
  - title: 公司 SOP 知识库 — 蓝屏速查表
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3185
    type: internal
  - title: 公司 SOP 知识库 — Windows硬盘检测方法
    url: https://mvs-h5.edianzu.cn/tips-detail?id=2932
    type: internal
  - title: 公司 SOP 知识库 — DiskFresh使用方法
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3355
    type: internal
  - title: 公司 SOP 知识库 — 电脑温度检测方法
    url: https://mvs-h5.edianzu.cn/tips-detail?id=2949
    type: internal
  - title: 公司 SOP 知识库 — mediainfo使用方法
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3184
    type: internal
  - title: Microsoft Learn — Windows 命令参考
    url: https://learn.microsoft.com/zh-cn/windows-server/administration/windows-commands/windows-commands
    type: official
  - title: Microsoft Support — Windows 帮助中心
    url: https://support.microsoft.com/zh-cn/windows
    type: official
reviewer: 内容组
reviewed_at: 2026-10-17
---

# 故障检测工具速查：蓝屏、DMP、硬盘、内存、温度与日志

## 快速概览

「查不出原因」通常不是技术难度问题，而是**没有证据**。

这一页把 SOP 里最常用的检测工具排成一张表：什么症状用哪个工具、看哪个字段、拿到什么截图就能报单或升级。

每个工具后面都带原始链接，具体截图和分支判断在原文里。

本页共整理 **16** 条 SOP 条目，全部保留原始链接；处理细节以原文为准。

## 适用对象

需要给客户/后方一个明确结论的现场工程师；带新人做故障判断的师傅。

## 风险提示

> ⚠ 动手前请逐条核对；涉及数据、证件、客户设备安全的操作，先取得授权再执行。

1. 磁盘扫描（坏道检测）、压测等操作**会让机器长时间满载**，需提前告知客户并约定时间。
2. 日志与转储文件可能包含用户名、路径等隐私信息，外发前先脱敏并取得授权。
3. 修改注册表、服务、启动项前先建还原点，避免把「查故障」变成「造故障」。

## 分步骤

### 步骤 1：先用系统自带工具定性

**目的**：免费、快、不装软件，多数问题这一步就能定位

**操作**：
1. 卡顿/死机：任务管理器 + 资源监视器 + 可靠性监视器（「查看可靠性历史和事件查看器方法」）。
2. 开机慢：事件查看器 Diagnostics-Performance 日志里的启动耗时事件。
3. 蓝屏：先记 STOP 代码，再对照「蓝屏速查表」。
4. 硬件是否故障：用「硬件诊断」类工具判断，避免反复拆机试错。

**预期结果**：第 1 步的操作都完成后，问题现象能被复现或排除，并能对应到下面「原始 SOP」里的具体条目。

**失败怎么办**：对不上具体条目 → 回到「快速概览」确认现象描述，或按「仍需帮助」一节的说明升级。

### 步骤 2：再做针对性检测

**目的**：按怀疑方向选工具，别一上来全套跑一遍

**操作**：
1. 怀疑硬盘：Windows 磁盘检测 + SMART；还要看读取速度是否掉速。
2. 怀疑内存：内存检测工具至少跑一轮完整测试。
3. 怀疑散热/降频：温度检测 + 频率曲线。
4. 怀疑显卡/整机：HWinfo 记录 + 整机压力测试。

**预期结果**：第 2 步的操作都完成后，问题现象能被复现或排除，并能对应到下面「原始 SOP」里的具体条目。

**失败怎么办**：对不上具体条目 → 回到「快速概览」确认现象描述，或按「仍需帮助」一节的说明升级。

### 步骤 3：收证据、出结论

**目的**：结论要能让下一环节直接接续

**操作**：
1. 截图/导出日志：系统日志收集方法，按时间点标注。
2. DMP 文件用 WinDbg 打开，记录故障模块名。
3. 整理成一句话结论：现象 + 证据 + 已排除项 + 建议（修/换/升级）。

**预期结果**：第 3 步的操作都完成后，问题现象能被复现或排除，并能对应到下面「原始 SOP」里的具体条目。

**失败怎么办**：对不上具体条目 → 回到「快速概览」确认现象描述，或按「仍需帮助」一节的说明升级。

## 原始 SOP

下表的「原文」全部指向公司 SOP 知识库（需要内部账号登录）。点击即可核对处理步骤、截图与注意事项。

| 条目 | 是什么 / 什么时候用 | 一句话提醒 | 原文 |
|---|---|---|---|
| 查看可靠性历史和事件查看器方法 | 定位崩溃、卡死、更新失败的时间点。 | 可靠性监视器的红色叉号最有用 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3078) |
| 事件查看器速查表 | 常见事件 ID 含义对照。 | 先锁定时间点再看邻近事件 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3181) |
| 蓝屏速查表 | 按 STOP 代码查原因。 | 蓝屏先记代码和故障模块 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3185) |
| windbg分析DMP文件使用方法 | 分析内存转储定位驱动/模块。 | 小内存转储够用且体积小 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3182) |
| Windows硬盘检测方法 | SMART 与坏道检测。 | 先看健康度，再做全盘扫描 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2932) |
| 硬盘掉速修复方法 | 写入后读速衰减的盘处理。 | 掉速盘建议直接更换 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3325) |
| DiskFresh使用方法 | 整盘重写刷新读取速度。 | 耗时数小时，且不能修复物理损伤 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3355) |
| 内存检测方法 | mdsched / MemTest 内存测试。 | 单条测试更容易定位坏条 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2933) |
| 电脑温度检测方法 | CPU/GPU 温度与降频判断。 | 满载超过 95℃ 需要处理散热 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2949) |
| HWinfo使用方法 | 传感器、温度、频率、功耗监控。 | 长时间记录日志便于找偶发问题 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3183) |
| mediainfo使用方法 | 音视频文件信息检测。 | 播放异常的锅很多时候在文件本身 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3184) |
| 整机压力测试方法 | 换件/维修后的验证。 | 至少压测 30 分钟 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3186) |
| 系统日志收集方法 | 统一打包日志给后方。 | 外发前先脱敏 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3091) |
| 修复系统方法 | sfc / DISM 修复系统文件。 | 先 ScanHealth 再 RestoreHealth | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2928) |
| 校色仪使用方法 | 屏幕偏色检测与调色。 | 调色前暖机 30 分钟 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3297) |
| 常见SN序列号样式 | 核对机器序列号。 | 报单前确认 SN 与机身一致 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3301) |

## 处理明细

上表是把条目「按顺序摊开」；这一节给每一条一条带编号的明细，写入工单时可以直接引用编号，例如「按 SOP 第 12 条的步骤处理」。

### 01｜查看可靠性历史和事件查看器方法
**是什么**：定位崩溃、卡死、更新失败的时间点。

- 提醒：可靠性监视器的红色叉号最有用

**原文**：[查看可靠性历史和事件查看器方法](https://mvs-h5.edianzu.cn/tips-detail?id=3078)

### 02｜事件查看器速查表
**是什么**：常见事件 ID 含义对照。

- 提醒：先锁定时间点再看邻近事件

**原文**：[事件查看器速查表](https://mvs-h5.edianzu.cn/tips-detail?id=3181)

### 03｜蓝屏速查表
**是什么**：按 STOP 代码查原因。

- 提醒：蓝屏先记代码和故障模块

**原文**：[蓝屏速查表](https://mvs-h5.edianzu.cn/tips-detail?id=3185)

### 04｜windbg分析DMP文件使用方法
**是什么**：分析内存转储定位驱动/模块。

- 提醒：小内存转储够用且体积小

**原文**：[windbg分析DMP文件使用方法](https://mvs-h5.edianzu.cn/tips-detail?id=3182)

### 05｜Windows硬盘检测方法
**是什么**：SMART 与坏道检测。

- 提醒：先看健康度，再做全盘扫描

**原文**：[Windows硬盘检测方法](https://mvs-h5.edianzu.cn/tips-detail?id=2932)

### 06｜硬盘掉速修复方法
**是什么**：写入后读速衰减的盘处理。

- 提醒：掉速盘建议直接更换

**原文**：[硬盘掉速修复方法](https://mvs-h5.edianzu.cn/tips-detail?id=3325)

### 07｜DiskFresh使用方法
**是什么**：整盘重写刷新读取速度。

- 提醒：耗时数小时，且不能修复物理损伤

**原文**：[DiskFresh使用方法](https://mvs-h5.edianzu.cn/tips-detail?id=3355)

### 08｜内存检测方法
**是什么**：mdsched / MemTest 内存测试。

- 提醒：单条测试更容易定位坏条

**原文**：[内存检测方法](https://mvs-h5.edianzu.cn/tips-detail?id=2933)

### 09｜电脑温度检测方法
**是什么**：CPU/GPU 温度与降频判断。

- 提醒：满载超过 95℃ 需要处理散热

**原文**：[电脑温度检测方法](https://mvs-h5.edianzu.cn/tips-detail?id=2949)

### 10｜HWinfo使用方法
**是什么**：传感器、温度、频率、功耗监控。

- 提醒：长时间记录日志便于找偶发问题

**原文**：[HWinfo使用方法](https://mvs-h5.edianzu.cn/tips-detail?id=3183)

### 11｜mediainfo使用方法
**是什么**：音视频文件信息检测。

- 提醒：播放异常的锅很多时候在文件本身

**原文**：[mediainfo使用方法](https://mvs-h5.edianzu.cn/tips-detail?id=3184)

### 12｜整机压力测试方法
**是什么**：换件/维修后的验证。

- 提醒：至少压测 30 分钟

**原文**：[整机压力测试方法](https://mvs-h5.edianzu.cn/tips-detail?id=3186)

### 13｜系统日志收集方法
**是什么**：统一打包日志给后方。

- 提醒：外发前先脱敏

**原文**：[系统日志收集方法](https://mvs-h5.edianzu.cn/tips-detail?id=3091)

### 14｜修复系统方法
**是什么**：sfc / DISM 修复系统文件。

- 提醒：先 ScanHealth 再 RestoreHealth

**原文**：[修复系统方法](https://mvs-h5.edianzu.cn/tips-detail?id=2928)

### 15｜校色仪使用方法
**是什么**：屏幕偏色检测与调色。

- 提醒：调色前暖机 30 分钟

**原文**：[校色仪使用方法](https://mvs-h5.edianzu.cn/tips-detail?id=3297)

### 16｜常见SN序列号样式
**是什么**：核对机器序列号。

- 提醒：报单前确认 SN 与机身一致

**原文**：[常见SN序列号样式](https://mvs-h5.edianzu.cn/tips-detail?id=3301)

## 仍需帮助

- 原文能对上但做不下去：按「工单升级方法」带上截图与现象升级，不要在客户现场硬试。
- 本文与原文不一致：以原文为准，并在「纠错与反馈」告诉我们，我们会回来更新这份索引。
- 需要看具体的排障思路，而不是 SOP 索引：去「领域」页找对应的故障教程。
