---
title: 电脑没有 WLAN 选项 / 网络适配器不见了
slug: wifi-adapter-missing
domain: net-basic
category: net-adapter
os: [Windows 10, Windows 11, macOS 12+]
difficulty: 进阶
time: 20-60 分钟
risk: 需谨慎
symptoms: [没有WLAN选项, 网络适配器不见了, 设备管理器没有无线网卡, wifi图标没了, 适配器有黄色感叹号, 连不上wifi也没有wifi开关, no wifi adapter, 无线网卡消失, 以太网也看不见, 网络适配器出现感叹号]
keywords: [网络适配器, WLAN, 设备管理器, 无线网卡驱动, 网卡消失, pnputil, Get-PnpDevice, 网络重置]
aliases: [没有wifi选项, 找不到无线网卡, 网卡掉了, 无线适配器丢失]
updated: 2026-10-11
version: "1.0"
prerequisites: [电脑能正常开机进入系统, 知道管理员密码, 另一台能上网的设备（下载驱动用）, 手边有可用的网线或 USB 无线网卡（可选）]
tools: [设备管理器, Windows 设置（网络重置）, PowerShell, 厂商官网驱动下载, macOS 系统设置与终端]
related: [wifi-ssid-not-found, wifi-connected-but-no-internet, ip-conflict-locate-device, home-network-all-offline]
sources:
  - title: Microsoft Learn — Get-NetAdapter 命令参考
    url: https://learn.microsoft.com/zh-cn/powershell/module/netadapter/get-netadapter
  - title: Microsoft Learn — pnputil 命令参考
    url: https://learn.microsoft.com/zh-cn/windows-hardware/drivers/devtest/pnputil
  - title: Microsoft Learn — netsh winsock 命令
    url: https://learn.microsoft.com/zh-cn/windows-server/administration/windows-commands/netsh-winsock
  - title: Apple 支持 — 重置 Mac 上的 NVRAM
    url: https://support.apple.com/zh-cn/102539
  - title: Apple 支持 — 重置 Mac 上的 SMC
    url: https://support.apple.com/zh-cn/102605
  - title: Apple 支持 — 使用"Apple 诊断"测试你的 Mac
    url: https://support.apple.com/zh-cn/102550
reviewer: 内容组
reviewed_at: 2026-10-11
detail_href: ./fix/wifi-adapter-missing.html
---

# 电脑没有 WLAN 选项 / 网络适配器不见了

> ⚠️ 本文会修改系统网络设置并重装驱动。操作前建议记下当前的 IP、DNS 配置和 Wi-Fi 密码，以便随时还原。公司/学校管理的电脑请先联系 IT。

## 一句话结论

"没有 WLAN 选项"通常是三种情况之一：无线开关被关掉（含飞行模式）、驱动被卸载或损坏、网卡被硬件禁用/松动。先确认网卡是"消失"还是"被禁用"，再决定重装驱动还是送修。

## 30 秒快速排查

1. **看 Windows 快速设置面板有没有飞行模式、Wi-Fi 磁贴。** 期望：飞行模式是关的；Wi-Fi 磁贴可以点亮 → 只是被关掉了，不用重装驱动。
2. **打开设备管理器 → 网络适配器**，看有没有带"无线/Wireless/WLAN/Wi-Fi"字样的设备。期望：有但带黄色感叹号 → 驱动问题；完全没有 → 网卡未被识别。
3. **重启一次电脑并接上网线试。** 期望：网线能上网 → 至少系统网络组件正常，问题集中在无线网卡上。

## 适用 / 不适用

**适用：**

- 右下角没有 Wi-Fi 图标，设置里找不到"WLAN"开关
- 设备管理器里无线网卡带黄色感叹号、或整个"网络适配器"里没有无线设备
- 换过驱动、装过系统、进过 BIOS 之后 Wi-Fi 就没了
- 网络适配器列表里连"以太网"也不见了

**不适用（请转对应文章）：**

- 有 WLAN 选项、能看到网络但搜不到自家网络名 → [Wi-Fi 列表里找不到自家网络怎么办](#)
- 能连上 Wi-Fi 但打不开网页 → [Wi-Fi 显示已连接但无法上网（打不开网页）](#)
- 所有设备都没网（不是单台电脑的问题） → [家里所有设备都上不了网：先分清是谁的问题](#)
- 提示 IP 地址冲突、地址是 169.254 开头 → [电脑获取不到 IP 地址 / IP 是 169.254 开头](#)
- 公司配发的笔记本、带企业管控或 BIOS 密码 → 直接联系 IT，不要自行改 BIOS

## 开始前确认

- [ ] 电脑能正常开机进入系统
- [ ] 有管理员权限（重装驱动、重置网络需要）
- [ ] 手边有另一台能上网的设备，用于下载网卡驱动
- [ ] 记下当前的 IP、DNS、Wi-Fi 密码（网络重置后要重输）
- [ ] 知道电脑型号（笔记本看机身底部标签或"关于本机"，台式机看主板型号）

## 分步骤

### 步骤 1：先判断网卡是"消失"还是"被禁用"

**目的**：这两种情况的处理方式完全不同，先分清能省一半时间。

**操作**：以管理员身份运行 PowerShell（开始菜单搜索 `PowerShell` → 右键 → 以管理员身份运行）：

```powershell
Get-NetAdapter -IncludeHidden
Get-PnpDevice -Class Net | Format-Table Status, FriendlyName
netsh wlan show interfaces
```

再打开**设备管理器**（右键开始菜单 → 设备管理器），点菜单「查看 → 显示隐藏的设备」，展开「网络适配器」。

**预期结果**：

- `Get-NetAdapter` 里能看到无线网卡（名字常含 Intel、Realtek、MediaTek、Qualcomm、Wireless、Wi-Fi），状态是 Up 或 Disconnected；
- 设备管理器里能看到无线网卡，或至少能看到带感叹号/灰色的设备。

**失败怎么办**：

- 完全看不到任何无线设备 → 直接跳到步骤 3（重装驱动）和步骤 5（网络重置）；
- `netsh wlan show interfaces` 报"无线自动配置服务(wlansvc)没有运行" → 先在服务里启动 `WLAN AutoConfig`，见步骤 3。

### 步骤 2：检查被关掉的开关（含 BIOS）

**目的**：很多"网卡消失"其实是开关或固件层被禁用，不需要动驱动。

**操作**：

1. **飞行模式**：Windows 11 点右下角网络图标打开快速设置，确认飞行模式关闭。
2. **快捷键**：笔记本常见 `Fn` + `F2`/`F12` 等组合键用于切换无线开关，键帽上有天线或飞机图标。
3. **物理开关**：老机型机身侧面可能有拨动开关。
4. **BIOS/UEFI**：重启时按 `F2`、`F10`、`Del` 或 `Esc` 进入 BIOS（各品牌不同），找到 `Wireless LAN`、`WLAN`、`Network` 相关项，确认没有被设为 `Disabled`。**不要改动其它设置，改完保存退出。**

**预期结果**：开关打开后，Wi-Fi 图标和 WLAN 选项立刻出现。

**失败怎么办**：BIOS 里相关项是灰色、或提示需要密码 → 不要强行破解，联系品牌售后或单位 IT；有些企业机型会在 BIOS 里锁定无线网卡，这是正常的管理策略。

### 步骤 3：卸载并重装无线网卡驱动

**目的**：驱动损坏或不兼容是"网卡带感叹号/消失"最常见的原因。

**操作**：

1. 在设备管理器里找到无线网卡（可能显示为"未知设备"），右键 → **卸载设备**；如果出现"删除此设备的驱动程序软件"选项，勾选它，确定。
2. 重启电脑，让 Windows 自动重新识别（多数情况会自动装回可用驱动）。
3. 如果仍不行，用另一台电脑到**笔记本/主板厂商官网**或**网卡芯片厂商官网**（Intel、Realtek、MediaTek、Qualcomm）下载对应型号的驱动，拷到本机安装。
4. 也可以用命令行查看当前系统里已注册的驱动包：

```powershell
pnputil /enum-drivers
Get-Service WlanSvc, Dhcp | Format-Table Name, Status, StartType
```

**预期结果**：设备管理器里无线网卡恢复正常、无感叹号；`netsh wlan show interfaces` 能输出网卡信息；系统出现 WLAN 选项。

**失败怎么办**：

- 安装驱动时报"系统找不到指定的文件" → 确认下载的是本机型、本系统版本的驱动；
- 装了厂商驱动仍无效 → 继续步骤 4、5；
- 不确定型号时，优先用笔记本厂商官网按机型查驱动，不要用第三方"驱动大师"类工具。

### 步骤 4：修复系统组件

**目的**：系统文件或组件损坏也会让网络适配器反复出问题。

**操作**：管理员 PowerShell 或命令提示符，逐条执行（每条约几分钟，需要联网）：

```bat
DISM /Online /Cleanup-Image /RestoreHealth
sfc /scannow
```

然后运行 Windows 更新（**设置 → Windows 更新**），检查"可选更新 → 驱动程序更新"里有没有网卡相关项。

**预期结果**：DISM 显示"还原操作已成功完成"，`sfc` 显示"未找到完整性冲突"或已修复并提示重启。

**失败怎么办**：命令报错且无法联网时，可以用系统安装介质做离线修复；不熟悉的话，先做步骤 5 的网络重置，或联系 IT。

### 步骤 5：重置网络（会清空已保存的 Wi-Fi 密码）

> ⛔ 网络重置会删除并重装所有网络适配器，**已保存的 Wi-Fi 名称和密码会被清空**，自定义的 IP、DNS、代理设置也会还原。请先把这些信息记下来。

**目的**：把网络组件恢复到初始状态，解决适配器配置损坏类问题。

**操作**：

图形方式：**设置 → 网络和 Internet → 高级网络设置 → 网络重置 → 立即重置**，然后重启。

命令行方式（管理员命令提示符，执行后重启）：

```bat
netsh winsock reset
netsh int ip reset
shutdown /r /t 0
```

**预期结果**：重启后网络适配器重新枚举，WLAN 选项恢复，需要重新输入 Wi-Fi 密码。

**失败怎么办**：重启后设备管理器里依然没有无线设备，说明大概率不是软件问题，进入步骤 6/7。

### 步骤 6：Mac 上"Wi-Fi 服务消失"的处理

**目的**：macOS 上类似现象通常是网络服务被删、NVRAM 异常或硬件识别失败。

**操作**（终端）：

```bash
networksetup -listallhardwareports
system_profiler SPAirPortDataType | head -n 60
```

- 如果硬件端口里有 Wi-Fi，但**系统设置 → 网络**里没有 Wi-Fi 服务：点网络设置右下角的"…"→ **添加服务** → 选 Wi-Fi → 创建。
- 如果硬件端口列表里完全没有 Wi-Fi：关机后重启；仍不行按 Apple 官方文档重置 NVRAM（Intel 机型）；Intel 机型还可尝试重置 SMC；Apple 芯片机型不需要重置 SMC。
- 以安全模式启动一次（Apple 芯片：关机后按住电源键进入启动选项，选磁盘时按住 Shift；Intel：开机按住 Shift），观察 Wi-Fi 是否出现。
- 最后用 Apple 诊断（关机后按官方文档的按键进入）检查硬件。

**预期结果**：网络设置里重新出现 Wi-Fi 服务并能扫描到网络。

**失败怎么办**：Apple 诊断报出以 NDD、PPN 等开头的参考代码，或硬件端口里始终没有 Wi-Fi，说明可能是无线模块故障，预约 Apple 支持或授权服务商；公司设备先联系 IT。

### 步骤 7：判断是否需要送修

**目的**：区分"还能救"和"必须修"。

**操作**：把前面几步的现象汇总判断：

| 现象 | 大概原因 | 接下来做什么 |
|---|---|---|
| 重装驱动后立刻恢复，过几天又消失 | 驱动/更新冲突 | 固定使用厂商官网驱动版本，关闭自动驱动更新或回退 |
| 设备管理器里完全没有无线设备，重装驱动也无效 | 网卡硬件或主板接口故障 | 送修 |
| 插网线能用，无线始终没有 | 无线模块或天线故障 | 送修；可先用 USB 无线网卡应急 |
| 只在某次系统更新/断电/进 BIOS 之后出现 | 设置或固件问题 | 检查 BIOS 无线开关，或恢复 BIOS 默认设置 |
| 公司/学校统一管理的电脑 | 管控策略 | 联系 IT，不要自行改 BIOS 或驱动 |

**预期结果**：明确下一步是"继续自救"还是"送修/找 IT"。

**失败怎么办**：拿不准就先接一根网线保证能用，再联系品牌售后描述现象和已做过的步骤。

## 怎么确认修好了

同时满足：

1. `netsh wlan show interfaces`（Windows）或 `networksetup -listallhardwareports`（macOS）能正常列出无线网卡；
2. 系统设置里 WLAN / Wi-Fi 开关可见且能打开；
3. 能在 Wi-Fi 列表里看到自家网络并成功连上，打开网页正常。

## 还是不行？

- **只有搜不到某几个网络** → 看 [Wi-Fi 列表里找不到自家网络怎么办](#)
- **能连上但打不开网页** → 看 [Wi-Fi 显示已连接但无法上网（打不开网页）](#)
- **无线不行、网线也不认** → 主板或网卡硬件问题，先备份重要文件再送修
- **公司/学校设备、或 BIOS 被锁定** → 联系 IT 处理，不要尝试绕过管控
- **Apple 诊断报出参考代码** → 预约 Apple Store 或 Apple 授权服务商

## 预防

1. 更新驱动只用笔记本/主板厂商官网的版本，不装"驱动大师""一键修复"类工具。
2. 做网络重置前先记下 Wi-Fi 密码、固定 IP 和 DNS。
3. 系统大版本更新前做一次还原点或备份，更新后确认网络正常。
4. 不要在 BIOS 里随意修改与网络无关的选项；改动前先拍照记录原值。
5. 笔记本避免在开机状态下震动、摔碰，无线网卡的天线接口比较脆弱。

## 相关教程

- [Wi-Fi 列表里找不到自家网络怎么办](#)
- [Wi-Fi 显示已连接但无法上网（打不开网页）](#)
- [电脑获取不到 IP 地址 / IP 是 169.254 开头](#)
- [家里所有设备都上不了网：先分清是谁的问题](#)
- [如何正确安装和回退网卡驱动](#)

## 更新日志

| 日期 | 版本 | 变更 | 作者/审核 |
|---|---|---|---|
| 2026-10-11 | 1.0 | 首次发布：网卡消失/禁用分诊、驱动重装、系统修复、网络重置与 macOS 对照 | 内容组 |
