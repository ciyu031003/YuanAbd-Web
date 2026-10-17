---
title: Mac 维护速查：装系统、恢复模式、SMC/NVRAM 与资料迁移
slug: sop-macos-maintain
kind: reference
domain: ref-manual
category: ref-macos
os: [macOS]
difficulty: 入门
time: 10-30 分钟
risk: 需谨慎
symptoms: [Mac 维护速查 处理方法, SOP 参考]
keywords: [Mac 维护速查 SOP, 装系统, 恢复模式, SMC/NVRAM 与资料迁移, 参考手册, 作业指导]
aliases: [SOP, 作业指导, 参考手册, Mac 维护速查]
updated: 2026-10-17
version: "1.0"
prerequisites: [能登录公司内部 SOP 知识库（部分原文需要账号）]
tools: [浏览器, 内部 SOP 知识库]
related: [sop-pe-usb-install, sop-diagnose-tools, sop-printer-connected-fix]
sources:
  - title: 公司 SOP 知识库 — 苹果在线安装系统方法
    url: https://mvs-h5.edianzu.cn/tips-detail?id=2916
    type: internal
  - title: 公司 SOP 知识库 — 重置SMC
    url: https://mvs-h5.edianzu.cn/tips-detail?id=2905
    type: internal
  - title: 公司 SOP 知识库 — 苹果硬件诊断方法
    url: https://mvs-h5.edianzu.cn/tips-detail?id=2957
    type: internal
  - title: 公司 SOP 知识库 — 苹果一体机配备键盘注意事项
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3152
    type: internal
  - title: 公司 SOP 知识库 — 开机出现由直线穿过的圆圈图案
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3049
    type: internal
  - title: 公司 SOP 知识库 — macOS开机慢
    url: https://mvs-h5.edianzu.cn/tips-detail?id=2953
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

# Mac 维护速查：装系统、恢复模式、SMC/NVRAM 与资料迁移

## 快速概览

Mac 的问题和 Windows 是两套解法：没有 BIOS、没有 PE，靠的是**恢复模式（Recovery）**、

**安全模式**、**SMC/NVRAM 重置**和**磁盘工具急救**这四件套。

这一页按「先做哪一步」排好 SOP 里 25 条 Mac 原文链接，遇到装不上、开不了机、数据要导出时对照着走。

本页共整理 **47** 条 SOP 条目，全部保留原始链接；处理细节以原文为准。

## 适用对象

负责 Mac 客户的工程师；带 Mac 出行、需要自行重装的同事。

## 风险提示

> ⚠ 动手前请逐条核对；涉及数据、证件、客户设备安全的操作，先取得授权再执行。

1. 抹盘、重装会清空数据：先做时间机器备份或用「苹果无法进入系统时导资料方法」把数据拿出来。
2. **固件锁（Activation Lock）与 T2/Apple 芯片的启动安全策略**没有解除时，重装会失败，需先确认是否属于公司资产并已解绑。
3. Apple 芯片机型**不支持外接 U 盘启动之外的 Intel 流程**，选错方法会浪费大量时间。

## 分步骤

### 步骤 1：先判断是什么机型

**目的**：Intel 与 Apple 芯片的操作入口完全不同

**操作**：
1. 关于本机看芯片：Intel / Apple M 系列。
2. Intel 机型重装走「苹果Intel芯片安装系统方法」；Apple 芯片走「苹果在线安装系统方法」。
3. 双系统需求只有 Intel 机型可以做（Boot Camp）。

**预期结果**：第 1 步的操作都完成后，问题现象能被复现或排除，并能对应到下面「原始 SOP」里的具体条目。

**失败怎么办**：对不上具体条目 → 回到「快速概览」确认现象描述，或按「仍需帮助」一节的说明升级。

### 步骤 2：进恢复模式 / 安全模式

**目的**：大部分修复动作都在恢复模式里完成

**操作**：
1. Intel：开机长按 Command+R；Apple 芯片：长按电源键直到出现「选项」。
2. 进不去系统但能进恢复模式 → 先用「磁盘工具 - 急救」检查磁盘（「macOS急救硬盘方法」）。
3. 怀疑第三方内核扩展导致的问题：进「macOS 安全模式」或关闭第三方扩展（「macOS关闭第三方扩展内核方法」）。

**预期结果**：第 2 步的操作都完成后，问题现象能被复现或排除，并能对应到下面「原始 SOP」里的具体条目。

**失败怎么办**：对不上具体条目 → 回到「快速概览」确认现象描述，或按「仍需帮助」一节的说明升级。

### 步骤 3：SMC / NVRAM 重置

**目的**：通电、风扇、显示、网络不稳时的标准动作

**操作**：
1. SMC 重置：解决不充电、风扇狂转、开不了机等硬件层问题。
2. NVRAM 重置：解决分辨率、启动卷、声音、时区异常。
3. Apple 芯片机型没有 SMC 重置，直接断电量置后重试。

**预期结果**：第 3 步的操作都完成后，问题现象能被复现或排除，并能对应到下面「原始 SOP」里的具体条目。

**失败怎么办**：对不上具体条目 → 回到「快速概览」确认现象描述，或按「仍需帮助」一节的说明升级。

### 步骤 4：安装系统

**目的**：按机型和方法二选一

**操作**：
1. 在线安装（Apple 芯片首选）：恢复模式里选「重新安装 macOS」。
2. U 盘安装：先「多合一苹果安装盘制作方法」，再「苹果电脑使用U盘安装系统方法」。
3. 装不上：按「U盘无法安装苹果系统解决方法」逐项排除（时间、固件锁、启动策略）。
4. 装完系统用「苹果迁移助理使用方法」把资料带回来。

**预期结果**：第 4 步的操作都完成后，问题现象能被复现或排除，并能对应到下面「原始 SOP」里的具体条目。

**失败怎么办**：对不上具体条目 → 回到「快速概览」确认现象描述，或按「仍需帮助」一节的说明升级。

### 步骤 5：数据与备份

**目的**：维修前的第一优先级

**操作**：
1. 能进系统：用「苹果时间机器的使用」做完整备份。
2. 进不了系统：按「苹果无法进入系统时导资料方法」用目标磁盘模式或外接硬盘导出。
3. 共享盘：「macOS设置共享盘方法」，迁移机器之间直接拷。

**预期结果**：第 5 步的操作都完成后，问题现象能被复现或排除，并能对应到下面「原始 SOP」里的具体条目。

**失败怎么办**：对不上具体条目 → 回到「快速概览」确认现象描述，或按「仍需帮助」一节的说明升级。

## 原始 SOP

下表的「原文」全部指向公司 SOP 知识库（需要内部账号登录）。点击即可核对处理步骤、截图与注意事项。

| 条目 | 是什么 / 什么时候用 | 一句话提醒 | 原文 |
|---|---|---|---|
| 苹果在线安装系统方法 | Apple 芯片 / 恢复模式里的在线重装。 | 需要稳定网络，耗时可超过 1 小时 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2916) |
| 苹果Intel芯片安装系统方法 | Intel 机型重建启动盘并安装。 | 确认固件锁已解除 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2917) |
| 苹果电脑使用U盘安装系统方法 | 用制作好的安装 U 盘重装。 | Apple 芯片机型需按住电源键选择启动盘 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2919) |
| Intel芯片的苹果安装双系统 | Boot Camp 安装 Windows。 | 注意磁盘空间与 Windows 版本 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3059) |
| 苹果系统修复方法 | 进不去系统的通用修复路径。 | 先急救磁盘，再考虑重装 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2918) |
| macOS进入恢复模式的方法 | 各代机型进恢复模式按键。 | Apple 芯片是长按电源键 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2954) |
| macOS进入安全模式方法 | 排除第三方软件与扩展。 | 安全模式下部分功能不可用 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2956) |
| 重置SMC | 通电、风扇、充电异常。 | Apple 芯片机型不适用 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2905) |
| 重置NVRAM | 分辨率、启动卷、声音异常。 | Intel 机型适用 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2906) |
| 苹果无法进入系统时导资料方法 | 在不能进系统的情况下把资料拿出来。 | 优先目标磁盘模式，其次拆盘读取 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2912) |
| 苹果迁移助理使用方法 | 换机或重装后迁移用户数据。 | 迁移前两台机器系统版本尽量一致 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3053) |
| 苹果时间机器的使用 | 完整备份与还原。 | 备份盘容量建议大于本机 1.5 倍 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3054) |
| 隔空投送使用方法 | 小型文件在 Mac 与 iPhone 间快传。 | 同一 Apple ID 或被允许联系人 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3055) |
| macOS设置共享盘方法 | Mac 之间/与 Windows 之间共享。 | 注意 SMB 协议版本 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3056) |
| 苹果硬件诊断方法 | 用 Apple Diagnostics 判断硬件故障。 | 记录错误代码用于报单 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2957) |
| macOS急救硬盘方法 | 磁盘工具里的「急救」。 | 急救前先备份，避免加重损坏 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2960) |
| macOS关闭第三方扩展内核方法 | 内核扩展/系统扩展导致的异常。 | 关闭后需要重启 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2962) |
| 如何修复或恢复 Mac 固件 | 固件损坏时的恢复（DFU）。 | 需要另一台 Mac 与专用线材 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2963) |
| Mac固件锁的开启与关闭方法 | 激活锁与固件锁处理。 | 必须确认资产归属与解绑流程 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2964) |
| macos如何恢复网络出厂设置 | 网络配置异常时的重置。 | 会清空已保存的 Wi-Fi 密码 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2972) |
| 苹果远程工具使用方法 | Mac 上的远程协助。 | 远程前取得客户授权 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3097) |
| 苹果一体机配备键盘注意事项 | iMac 配键盘的兼容说明。 | 检查蓝牙键盘电量与配对 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3152) |
| 苹果磁盘清理 | Mac 磁盘空间清理。 | 别随手删系统数据目录 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3233) |
| 多合一苹果安装盘制作方法 | 一只 U 盘装多个版本 macOS。 | 需要 32G 以上 U 盘 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3243) |
| macos双开微信工具 | Mac 上同时登录两个微信。 | 注意客户端版本兼容 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3277) |
| 苹果电脑不加电 | 按了电源没反应的排查。 | 先换电源适配器/线 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2888) |
| 苹果电脑加电无显 | 有声音没画面或完全无显。 | 外接屏判断是否屏幕问题 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2895) |
| 开机问号 | 启动盘丢失或系统损坏。 | 进恢复模式检查启动磁盘 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3048) |
| 开机出现由直线穿过的圆圈图案 | 找不到系统或磁盘故障。 | 先做磁盘急救 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3049) |
| macOS开机卡进度条 | 卡在苹果标志/进度条。 | 重置 NVRAM 后重试 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3063) |
| 开机出现灰色、黑色或蓝色的空白屏幕 | 空白屏排查。 | 外接显示器交叉验证 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3064) |
| 开机出现Macintosh HD和选项 | 出现启动选项界面。 | 说明无法自动启动，多半是系统损坏 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3065) |
| 开机出现圆圈里边感叹号 | 恢复分区损坏。 | 通常需要在线重装 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3066) |
| mac开机出现其他报错 | 其他启动报错汇总。 | 截图后对照原文 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3067) |
| 苹果系统运行卡慢处理方法 | Mac 变慢的排查。 | 先看活动监视器与磁盘空间 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2927) |
| macOS开机慢 | 开机慢的处理。 | 减少登录项与启动代理 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2953) |
| macOS办公软件慢 | 办公软件响应慢。 | 检查 Office 版本与插件 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2958) |
| macOS死机的解决方案 | 系统卡死处理。 | 卡死后不要强制断电，先尝试 Command+Option+Esc | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2986) |
| macOS自动开关机重启解决方法 | 自动重启/开关机。 | 查定时任务与电源设置 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2989) |
| macOS安装软件报错解决方法 | 「无法打开，因为无法验证开发者」等。 | 优先从 App Store 或官方下载 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3087) |
| 苹果融合盘修复方法 | Fusion Drive 修复。 | 修复前务必备份 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3088) |
| macOS忘记密码 | 重置登录密码。 | 恢复模式里用终端 resetpassword | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3167) |
| macOS连接网络不稳定的解决方法 | Wi-Fi 频繁断线。 | 先删网络配置重建 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3245) |
| U盘无法安装苹果系统解决方法 | U 盘启动失败的处理。 | 核对机型与安装盘匹配 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3246) |
| 苹果安装双系统时bootcamp报错 | Boot Camp 报错处理。 | 磁盘空间与分区格式是常见原因 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3247) |
| macOS显示感叹号但可上网 | Wi-Fi 图标异常但网络正常。 | 多数是显示问题，重建网络配置 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3294) |
| 苹果m芯片连接戴尔显示器闪烁 | M 系列连接部分显示器的兼容问题。 | 换线或调整刷新率/分辨率 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3357) |

## 处理明细

上表是把条目「按顺序摊开」；这一节给每一条一条带编号的明细，写入工单时可以直接引用编号，例如「按 SOP 第 12 条的步骤处理」。

### 01｜苹果在线安装系统方法
**是什么**：Apple 芯片 / 恢复模式里的在线重装。

- 提醒：需要稳定网络，耗时可超过 1 小时

**原文**：[苹果在线安装系统方法](https://mvs-h5.edianzu.cn/tips-detail?id=2916)

### 02｜苹果Intel芯片安装系统方法
**是什么**：Intel 机型重建启动盘并安装。

- 提醒：确认固件锁已解除

**原文**：[苹果Intel芯片安装系统方法](https://mvs-h5.edianzu.cn/tips-detail?id=2917)

### 03｜苹果电脑使用U盘安装系统方法
**是什么**：用制作好的安装 U 盘重装。

- 提醒：Apple 芯片机型需按住电源键选择启动盘

**原文**：[苹果电脑使用U盘安装系统方法](https://mvs-h5.edianzu.cn/tips-detail?id=2919)

### 04｜Intel芯片的苹果安装双系统
**是什么**：Boot Camp 安装 Windows。

- 提醒：注意磁盘空间与 Windows 版本

**原文**：[Intel芯片的苹果安装双系统](https://mvs-h5.edianzu.cn/tips-detail?id=3059)

### 05｜苹果系统修复方法
**是什么**：进不去系统的通用修复路径。

- 提醒：先急救磁盘，再考虑重装

**原文**：[苹果系统修复方法](https://mvs-h5.edianzu.cn/tips-detail?id=2918)

### 06｜macOS进入恢复模式的方法
**是什么**：各代机型进恢复模式按键。

- 提醒：Apple 芯片是长按电源键

**原文**：[macOS进入恢复模式的方法](https://mvs-h5.edianzu.cn/tips-detail?id=2954)

### 07｜macOS进入安全模式方法
**是什么**：排除第三方软件与扩展。

- 提醒：安全模式下部分功能不可用

**原文**：[macOS进入安全模式方法](https://mvs-h5.edianzu.cn/tips-detail?id=2956)

### 08｜重置SMC
**是什么**：通电、风扇、充电异常。

- 提醒：Apple 芯片机型不适用

**原文**：[重置SMC](https://mvs-h5.edianzu.cn/tips-detail?id=2905)

### 09｜重置NVRAM
**是什么**：分辨率、启动卷、声音异常。

- 提醒：Intel 机型适用

**原文**：[重置NVRAM](https://mvs-h5.edianzu.cn/tips-detail?id=2906)

### 10｜苹果无法进入系统时导资料方法
**是什么**：在不能进系统的情况下把资料拿出来。

- 提醒：优先目标磁盘模式，其次拆盘读取

**原文**：[苹果无法进入系统时导资料方法](https://mvs-h5.edianzu.cn/tips-detail?id=2912)

### 11｜苹果迁移助理使用方法
**是什么**：换机或重装后迁移用户数据。

- 提醒：迁移前两台机器系统版本尽量一致

**原文**：[苹果迁移助理使用方法](https://mvs-h5.edianzu.cn/tips-detail?id=3053)

### 12｜苹果时间机器的使用
**是什么**：完整备份与还原。

- 提醒：备份盘容量建议大于本机 1.5 倍

**原文**：[苹果时间机器的使用](https://mvs-h5.edianzu.cn/tips-detail?id=3054)

### 13｜隔空投送使用方法
**是什么**：小型文件在 Mac 与 iPhone 间快传。

- 提醒：同一 Apple ID 或被允许联系人

**原文**：[隔空投送使用方法](https://mvs-h5.edianzu.cn/tips-detail?id=3055)

### 14｜macOS设置共享盘方法
**是什么**：Mac 之间/与 Windows 之间共享。

- 提醒：注意 SMB 协议版本

**原文**：[macOS设置共享盘方法](https://mvs-h5.edianzu.cn/tips-detail?id=3056)

### 15｜苹果硬件诊断方法
**是什么**：用 Apple Diagnostics 判断硬件故障。

- 提醒：记录错误代码用于报单

**原文**：[苹果硬件诊断方法](https://mvs-h5.edianzu.cn/tips-detail?id=2957)

### 16｜macOS急救硬盘方法
**是什么**：磁盘工具里的「急救」。

- 提醒：急救前先备份，避免加重损坏

**原文**：[macOS急救硬盘方法](https://mvs-h5.edianzu.cn/tips-detail?id=2960)

### 17｜macOS关闭第三方扩展内核方法
**是什么**：内核扩展/系统扩展导致的异常。

- 提醒：关闭后需要重启

**原文**：[macOS关闭第三方扩展内核方法](https://mvs-h5.edianzu.cn/tips-detail?id=2962)

### 18｜如何修复或恢复 Mac 固件
**是什么**：固件损坏时的恢复（DFU）。

- 提醒：需要另一台 Mac 与专用线材

**原文**：[如何修复或恢复 Mac 固件](https://mvs-h5.edianzu.cn/tips-detail?id=2963)

### 19｜Mac固件锁的开启与关闭方法
**是什么**：激活锁与固件锁处理。

- 提醒：必须确认资产归属与解绑流程

**原文**：[Mac固件锁的开启与关闭方法](https://mvs-h5.edianzu.cn/tips-detail?id=2964)

### 20｜macos如何恢复网络出厂设置
**是什么**：网络配置异常时的重置。

- 提醒：会清空已保存的 Wi-Fi 密码

**原文**：[macos如何恢复网络出厂设置](https://mvs-h5.edianzu.cn/tips-detail?id=2972)

### 21｜苹果远程工具使用方法
**是什么**：Mac 上的远程协助。

- 提醒：远程前取得客户授权

**原文**：[苹果远程工具使用方法](https://mvs-h5.edianzu.cn/tips-detail?id=3097)

### 22｜苹果一体机配备键盘注意事项
**是什么**：iMac 配键盘的兼容说明。

- 提醒：检查蓝牙键盘电量与配对

**原文**：[苹果一体机配备键盘注意事项](https://mvs-h5.edianzu.cn/tips-detail?id=3152)

### 23｜苹果磁盘清理
**是什么**：Mac 磁盘空间清理。

- 提醒：别随手删系统数据目录

**原文**：[苹果磁盘清理](https://mvs-h5.edianzu.cn/tips-detail?id=3233)

### 24｜多合一苹果安装盘制作方法
**是什么**：一只 U 盘装多个版本 macOS。

- 提醒：需要 32G 以上 U 盘

**原文**：[多合一苹果安装盘制作方法](https://mvs-h5.edianzu.cn/tips-detail?id=3243)

### 25｜macos双开微信工具
**是什么**：Mac 上同时登录两个微信。

- 提醒：注意客户端版本兼容

**原文**：[macos双开微信工具](https://mvs-h5.edianzu.cn/tips-detail?id=3277)

### 26｜苹果电脑不加电
**是什么**：按了电源没反应的排查。

- 提醒：先换电源适配器/线

**原文**：[苹果电脑不加电](https://mvs-h5.edianzu.cn/tips-detail?id=2888)

### 27｜苹果电脑加电无显
**是什么**：有声音没画面或完全无显。

- 提醒：外接屏判断是否屏幕问题

**原文**：[苹果电脑加电无显](https://mvs-h5.edianzu.cn/tips-detail?id=2895)

### 28｜开机问号
**是什么**：启动盘丢失或系统损坏。

- 提醒：进恢复模式检查启动磁盘

**原文**：[开机问号](https://mvs-h5.edianzu.cn/tips-detail?id=3048)

### 29｜开机出现由直线穿过的圆圈图案
**是什么**：找不到系统或磁盘故障。

- 提醒：先做磁盘急救

**原文**：[开机出现由直线穿过的圆圈图案](https://mvs-h5.edianzu.cn/tips-detail?id=3049)

### 30｜macOS开机卡进度条
**是什么**：卡在苹果标志/进度条。

- 提醒：重置 NVRAM 后重试

**原文**：[macOS开机卡进度条](https://mvs-h5.edianzu.cn/tips-detail?id=3063)

### 31｜开机出现灰色、黑色或蓝色的空白屏幕
**是什么**：空白屏排查。

- 提醒：外接显示器交叉验证

**原文**：[开机出现灰色、黑色或蓝色的空白屏幕](https://mvs-h5.edianzu.cn/tips-detail?id=3064)

### 32｜开机出现Macintosh HD和选项
**是什么**：出现启动选项界面。

- 提醒：说明无法自动启动，多半是系统损坏

**原文**：[开机出现Macintosh HD和选项](https://mvs-h5.edianzu.cn/tips-detail?id=3065)

### 33｜开机出现圆圈里边感叹号
**是什么**：恢复分区损坏。

- 提醒：通常需要在线重装

**原文**：[开机出现圆圈里边感叹号](https://mvs-h5.edianzu.cn/tips-detail?id=3066)

### 34｜mac开机出现其他报错
**是什么**：其他启动报错汇总。

- 提醒：截图后对照原文

**原文**：[mac开机出现其他报错](https://mvs-h5.edianzu.cn/tips-detail?id=3067)

### 35｜苹果系统运行卡慢处理方法
**是什么**：Mac 变慢的排查。

- 提醒：先看活动监视器与磁盘空间

**原文**：[苹果系统运行卡慢处理方法](https://mvs-h5.edianzu.cn/tips-detail?id=2927)

### 36｜macOS开机慢
**是什么**：开机慢的处理。

- 提醒：减少登录项与启动代理

**原文**：[macOS开机慢](https://mvs-h5.edianzu.cn/tips-detail?id=2953)

### 37｜macOS办公软件慢
**是什么**：办公软件响应慢。

- 提醒：检查 Office 版本与插件

**原文**：[macOS办公软件慢](https://mvs-h5.edianzu.cn/tips-detail?id=2958)

### 38｜macOS死机的解决方案
**是什么**：系统卡死处理。

- 提醒：卡死后不要强制断电，先尝试 Command+Option+Esc

**原文**：[macOS死机的解决方案](https://mvs-h5.edianzu.cn/tips-detail?id=2986)

### 39｜macOS自动开关机重启解决方法
**是什么**：自动重启/开关机。

- 提醒：查定时任务与电源设置

**原文**：[macOS自动开关机重启解决方法](https://mvs-h5.edianzu.cn/tips-detail?id=2989)

### 40｜macOS安装软件报错解决方法
**是什么**：「无法打开，因为无法验证开发者」等。

- 提醒：优先从 App Store 或官方下载

**原文**：[macOS安装软件报错解决方法](https://mvs-h5.edianzu.cn/tips-detail?id=3087)

### 41｜苹果融合盘修复方法
**是什么**：Fusion Drive 修复。

- 提醒：修复前务必备份

**原文**：[苹果融合盘修复方法](https://mvs-h5.edianzu.cn/tips-detail?id=3088)

### 42｜macOS忘记密码
**是什么**：重置登录密码。

- 提醒：恢复模式里用终端 resetpassword

**原文**：[macOS忘记密码](https://mvs-h5.edianzu.cn/tips-detail?id=3167)

### 43｜macOS连接网络不稳定的解决方法
**是什么**：Wi-Fi 频繁断线。

- 提醒：先删网络配置重建

**原文**：[macOS连接网络不稳定的解决方法](https://mvs-h5.edianzu.cn/tips-detail?id=3245)

### 44｜U盘无法安装苹果系统解决方法
**是什么**：U 盘启动失败的处理。

- 提醒：核对机型与安装盘匹配

**原文**：[U盘无法安装苹果系统解决方法](https://mvs-h5.edianzu.cn/tips-detail?id=3246)

### 45｜苹果安装双系统时bootcamp报错
**是什么**：Boot Camp 报错处理。

- 提醒：磁盘空间与分区格式是常见原因

**原文**：[苹果安装双系统时bootcamp报错](https://mvs-h5.edianzu.cn/tips-detail?id=3247)

### 46｜macOS显示感叹号但可上网
**是什么**：Wi-Fi 图标异常但网络正常。

- 提醒：多数是显示问题，重建网络配置

**原文**：[macOS显示感叹号但可上网](https://mvs-h5.edianzu.cn/tips-detail?id=3294)

### 47｜苹果m芯片连接戴尔显示器闪烁
**是什么**：M 系列连接部分显示器的兼容问题。

- 提醒：换线或调整刷新率/分辨率

**原文**：[苹果m芯片连接戴尔显示器闪烁](https://mvs-h5.edianzu.cn/tips-detail?id=3357)

## 仍需帮助

- 原文能对上但做不下去：按「工单升级方法」带上截图与现象升级，不要在客户现场硬试。
- 本文与原文不一致：以原文为准，并在「纠错与反馈」告诉我们，我们会回来更新这份索引。
- 需要看具体的排障思路，而不是 SOP 索引：去「领域」页找对应的故障教程。
