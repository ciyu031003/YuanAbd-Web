---
title: 电脑获取不到 IP 地址 / IP 是 169.254 开头
slug: dhcp-no-ip-169-254
domain: ip-dns
category: ip-dhcp
os: [Windows 10, Windows 11, macOS 12+]
difficulty: 进阶
time: 20-60 分钟
risk: 需谨慎
symptoms: [IP是169.254开头, 获取不到IP地址, 169.254开头的地址, 没有有效的IP配置, 网络未识别的网络, 无Internet访问, 自动配置IPv4地址, 拿不到IP, DHCP失败, 一直显示正在识别]
keywords: [APIPA, 169.254, DHCP, 自动专用 IP 地址, 链路本地地址, ipconfig /renew, 网络重置, RFC 3927]
aliases: [拿不到IP, 没有IP地址, IP是169开头, 自动私有地址]
updated: 2026-10-27
version: "1.1"
prerequisites: [能登录路由器管理页面, Windows 有管理员权限, 记得 Wi-Fi 密码（网络重置后要重输）, 如果是有线网络，手边有一根备用网线]
tools: [命令提示符 / PowerShell, macOS 终端, 路由器管理页面, 网线（备用）]
related: [ip-conflict-locate-device, wifi-connected-but-no-internet, home-network-all-offline, router-admin-page-unreachable]
sources:
  - title: Microsoft Learn — 如何在不使用 DHCP 服务器的情况下使用自动 TCP/IP 寻址（APIPA）
    url: https://learn.microsoft.com/zh-cn/windows-server/troubleshoot/how-to-use-automatic-tcpip-addressing-without-a-dh
  - title: Microsoft Learn — 事件 ID 4199 与客户端无法从 DHCP 服务器获取 IP 地址
    url: https://learn.microsoft.com/zh-cn/troubleshoot/windows-server/networking/event-4199-windows-client-cannot-get-ip-address-dhcp-server
  - title: IETF — RFC 3927：IPv4 链路本地地址的动态配置
    url: https://datatracker.ietf.org/doc/html/rfc3927
  - title: Apple 支持 — 如果 Mac 无法通过 Wi-Fi 接入互联网
    url: https://support.apple.com/zh-cn/101588
reviewer: 内容组
reviewed_at: 2026-10-27
detail_href: ./fix/dhcp-no-ip-169-254.html
---

# 电脑获取不到 IP 地址 / IP 是 169.254 开头

> ⚠️ 本文会修改网络配置并可能重置网络。操作前请截图保存当前 IP、DNS 设置，并确认你知道 Wi-Fi 密码（重置后需要重新输入）。

## 一句话结论

`169.254.x.x` 是系统在"没要到 IP"时给自己随便发的地址，叫 APIPA/链路本地地址，不代表网卡坏了。九成情况是 DHCP 没响应：先重启路由器和本机，再查路由器 DHCP 是否开启、地址池是否用完。

## 30 秒快速排查

1. **重启路由器和电脑**：路由器断电 30 秒后通电，等 2 分钟，再重启电脑。期望：约一半情况地址会变回 `192.168.x.x`。
2. **让本机强制重新要一次地址**：管理员命令提示符执行 `ipconfig /release`，再执行 `ipconfig /renew`。期望：提示里出现新的 IPv4 地址。
3. **用手机连同一个 Wi-Fi 看它的 IP**（Wi-Fi 详情里有"IP 地址"）。期望：手机拿到 192.168 开头的地址 → 路由器 DHCP 正常，问题在这台电脑；手机也是 169.254 → 路由器 DHCP 出问题了。

## 小白一键修复

- 下载：[网络连接快速修复（.bat）](../scripts/fix-network-stack.bat)
- 适合：Windows 10/11，网卡地址是 `169.254.x.x`，路由器和其他设备工作正常。
- 脚本会：清理 DNS 缓存、重置 Winsock/TCP-IP、重新请求 DHCP 地址。
- 运行前：保存文档并确认这不是公司统一配置的静态 IP。
- 注意：重置后必须重启；如果路由器 DHCP 关闭或网线/无线链路本身有问题，脚本不能替代硬件排查。

## 适用 / 不适用

**适用：**

- `ipconfig /all` 里写"自动配置 IPv4 地址：169.254.x.x"，或"没有有效的 IP 配置"
- Windows 网络显示"未识别的网络""无 Internet 访问权限"
- 网络图标一直在转圈"正在识别…"
- 换过路由器、改过路由器设置之后就上不了网

**不适用（请转对应文章）：**

- 已经拿到 192.168 开头地址，但网页打不开 → [Wi-Fi 显示已连接但无法上网（打不开网页）](./wifi-connected-but-no-internet.html)
- Windows 弹出"检测到 IP 地址冲突" → [IP 地址冲突怎么查是哪台设备](./ip-conflict-locate-device.html)
- 家里所有设备（含手机）都拿不到地址 → [家里所有设备都上不了网：先分清是谁的问题](./home-network-all-offline.html)
- 网络适配器整个消失、没有 WLAN 选项 → [电脑没有 WLAN 选项 / 网络适配器不见了](./wifi-adapter-missing.html)
- 进不去路由器管理页面 → [路由器后台 192.168.1.1 打不开怎么办](./router-admin-page-unreachable.html)

## 开始前确认

- [ ] 知道 Wi-Fi 密码（网络重置后会清空已保存的网络）
- [ ] Windows 用管理员身份打开命令提示符：开始菜单搜索 `cmd` → 右键 → 以管理员身份运行
- [ ] 能登录路由器管理页面（地址和密码通常在机身标签上）
- [ ] 台式机/有线网络准备一根备用网线
- [ ] 公司/学校电脑：先联系 IT，企业网络常用 802.1X 或 MAC 准入，自行改设置可能被拒绝入网

## 分步骤

### 步骤 1：先读懂 169.254 这个地址

**目的**：知道它的含义，才不会把时间浪费在"杀毒、重装系统"上。

**操作**：在 Windows 里执行 `ipconfig /all`，在 macOS 里执行 `ifconfig en0`，找到 IPv4 地址那一行。

| 看到的地址 | 含义 | 说明 |
|---|---|---|
| `192.168.x.x`、`10.x.x.x`、`172.16-31.x.x` | 私有地址，正常 | 由路由器 DHCP 分配 |
| `169.254.0.0/16`（掩码 `255.255.0.0`） | **APIPA / 链路本地地址** | 系统没等到 DHCP 应答时自我分配的临时地址，只能和同一链路上的设备通信，不能上网 |
| `0.0.0.0` | 没有地址 | 网卡未连接或协议未启用 |
| `fe80::` 开头 | IPv6 链路本地地址 | 和 169.254 不是一回事，IPv6 有它是正常的 |

APIPA 的行为由 RFC 3927 定义，Windows 与 macOS 都实现了它。**看到 169.254 说明"本机网络本身是好的，是没要到地址"**，绝大多数情况下问题在 DHCP 服务器（也就是路由器）那一侧。

**预期结果**：确认自己看到的就是 169.254 开头，继续下一步。

**失败怎么办**：地址是 0.0.0.0 或根本没有 IPv4 → 先检查网线/Wi-Fi 是否连上，再看 [电脑没有 WLAN 选项 / 网络适配器不见了](./wifi-adapter-missing.html)。

### 步骤 2：重启设备，最省事的办法

**目的**：DHCP 服务临时卡死、租约表异常，重启常常直接解决。

**操作**：

1. 路由器断电 30 秒，通电后等 2 分钟。
2. 电脑关机再开机（不是"睡眠唤醒"）。
3. 如果是有线网络，拔插一次网线，确认网口指示灯亮。

**预期结果**：开机后 `ipconfig /all` 显示 192.168 开头的地址。

**失败怎么办**：仍然 169.254 → 继续步骤 3。

### 步骤 3：强制释放并重新获取地址

**目的**：清掉本机残留的地址状态，重新走一次 DHCP 四步流程。

**操作**：

Windows（管理员命令提示符，逐条执行）：

```bat
ipconfig /release
ipconfig /renew
ipconfig /all
```

如果提示"媒体已断开连接"，说明链路层没通，先检查 Wi-Fi 是否连上或网线是否插好。

macOS（终端，服务名一般是 `Wi-Fi`，可用 `networksetup -listallnetworkservices` 确认）：

```bash
sudo ipconfig set en0 NONE
sudo ipconfig set en0 DHCP
ipconfig getpacket en0
```

**预期结果**：

- Windows 的 `/renew` 显示新的 IPv4 地址与默认网关；
- macOS 的 `ipconfig getpacket en0` 能打印出 DHCP 服务器返回的包（含 `yiaddr` 分配的地址、`server_identifier` 服务器地址）。

**失败怎么办**：

- `/renew` 一直等、最后报"操作超时" → 路由器没有应答，进入步骤 4；
- macOS 提示 `No DHCP server` → 同样是路由器侧问题；
- 命令本身报错"服务未启动" → 看步骤 5 检查 DHCP Client 服务。

### 步骤 4：查路由器侧的 DHCP

**目的**：既然本机在要地址，就要看"发地址的人"是否正常工作。

**操作**：用手机登录路由器管理页面（默认地址常在机身标签上），逐项确认：

1. **DHCP 服务器是否开启**（有些路由器默认关闭，或在"AP/桥接模式"下自动关闭）。
2. **地址池范围与剩余数量**：例如 `192.168.1.100` - `192.168.1.199`，如果家里设备多（手机、电视、摄像头、智能家居），池子可能已经用完。
3. **DHCP 客户端列表**：看这台电脑有没有出现在列表里。
4. **MAC 过滤 / 黑名单 / 家长控制**：有没有把这台电脑的 MAC 拉黑。
5. **访客网络或 Mesh 子节点**：子节点故障时，它下面的设备常常拿不到地址。
6. **是不是有两台路由器都在发地址**（双 DHCP），或上级光猫也开了 DHCP。

**预期结果**：找到具体原因（关闭 / 池满 / 被拉黑 / 双 DHCP），修正后本机即可拿到地址。

**失败怎么办**：进不去管理页面 → [路由器后台 192.168.1.1 打不开怎么办](./router-admin-page-unreachable.html)；地址池确实太小，把结束地址改大（例如到 `192.168.1.250`）并保存重启。

### 步骤 5：检查本机 DHCP 服务与第三方软件

**目的**：Windows 的 DHCP Client 服务被禁用或被杀软拦截，也会一直拿不到地址。

**操作**：

```powershell
Get-Service Dhcp, WlanSvc, NetSetupSvc | Format-Table Name, Status, StartType
```

- `Dhcp` 应为 Running、启动类型 Automatic。若不是，在 `services.msc` 里手动启动并设为自动。
- 检查是否装了 VPN、加速器、抓包工具、虚拟机软件——它们创建的虚拟网卡有时会抢走默认路由或干扰 DHCP。临时禁用这些虚拟网卡再试。
- 关闭第三方防火墙/杀毒软件 5 分钟做一次测试（测完立刻打开）。

**预期结果**：服务正常后，`ipconfig /renew` 能拿到地址。

**失败怎么办**：服务启动后自动停止 → 查看系统日志中的服务错误，或执行步骤 6 的系统修复。

### 步骤 6：重置网络栈（会清空网络配置）

> ⛔ 网络重置会删除并重装所有网络适配器，**已保存的 Wi-Fi 名称和密码、固定 IP、DNS、代理设置都会被清空**。动手前请先记下这些信息。

**目的**：把协议栈恢复初始状态，解决配置损坏类问题。

**操作**：

图形方式：**设置 → 网络和 Internet → 高级网络设置 → 网络重置 → 立即重置**，重启。

命令方式（管理员命令提示符，执行后重启）：

```bat
netsh winsock reset
netsh int ip reset
ipconfig /flushdns
shutdown /r /t 0
```

macOS 换成重建 Wi-Fi 服务：**系统设置 → 网络** → 选中 Wi-Fi → 点"-"移除 → 再用"+"重新添加 Wi-Fi。

**预期结果**：重启后网络适配器重新枚举，能正常获取 192.168 开头的地址。

**失败怎么办**：仍然 169.254，且已确认路由器 DHCP 正常 → 优先怀疑网卡驱动或无线模块，转 [电脑没有 WLAN 选项 / 网络适配器不见了](./wifi-adapter-missing.html)。

### 步骤 7（应急）：临时手动设置一个地址

> ⚠️ 手动设置地址如果与别的设备重复，会造成 IP 冲突。请务必选择路由器地址池**之外**的空闲地址，恢复后及时改回"自动获取"。

**目的**：在 DHCP 一时修不好时，先让电脑能上网应急。

**操作**：Windows **设置 → 网络和 Internet → 你的网卡 → 编辑 → IP 分配 → 手动 → IPv4**，填写：

| 项目 | 示例 | 说明 |
|---|---|---|
| IP 地址 | `192.168.1.240` | 必须与路由器同网段，且不在 DHCP 池内 |
| 子网掩码 | `255.255.255.0` | 家用网络通常是这个 |
| 网关 | `192.168.1.1` | 用 `ipconfig` 里看到的实际网关 |
| DNS | `223.5.5.5` | 或用路由器地址 |

macOS：**系统设置 → 网络 → 详细信息 → TCP/IP → 配置 IPv4 → 手动**，填同样的四项。

**预期结果**：能上网，但**这只是应急**，根因仍是 DHCP。

**失败怎么办**：设置后提示冲突或上不了网 → 立刻改回"自动 (DHCP)"，并按 [IP 地址冲突怎么查是哪台设备](./ip-conflict-locate-device.html) 排查。

## 怎么确认修好了

同时满足：

1. Windows `ipconfig /all` 或 macOS `ifconfig en0` 里，IPv4 地址在路由器网段内（例如 `192.168.1.x`），**不再是 169.254**；
2. 默认网关是本机 ping 得通的路由器地址，`ipconfig /release` 再 `ipconfig /renew` 能拿到同一网段地址；
3. 连续上网 30 分钟不断线，`ipconfig /all` 里的"DHCP 已启用"为"是"。

## 还是不行？

- **手机也拿不到 192.168 地址** → 问题在路由器/光猫，看 [家里所有设备都上不了网：先分清是谁的问题](./home-network-all-offline.html)
- **只有这一台设备拿不到，其他设备正常** → 检查路由器 MAC 过滤/家长控制，或重置本机网络、更新网卡驱动
- **拿到地址后提示 IP 冲突** → 看 [IP 地址冲突怎么查是哪台设备](./ip-conflict-locate-device.html)
- **事件查看器里有来源 Tcpip、事件 ID 4199 的记录** → 这是"无法从 DHCP 服务器获取地址"的典型事件，含义与处理见文末 Microsoft 来源；企业网络中常见原因是三层交换机的 ARP 探测被误判为地址重复，需要网络管理员处理
- **公司/学校设备或多次重装驱动无效** → 联系 IT 或送修，不要在公司网络里关闭地址冲突检测（`Set-NetIPInterface -DadTransmits 0` 这类改动只应由网络管理员在有管理的环境下使用）

## 预防

1. 家用路由器把 DHCP 地址池设大一些（例如 100 个地址以上），并保留 DHCP 功能常开。
2. 智能家居、摄像头等设备接入前，先在路由器里规划好地址池，避免与手工固定 IP 重叠。
3. 只保留一台设备负责 DHCP，扩展器/第二台路由器改为桥接或 AP 模式。
4. 不要把"手动设置 IP"当成长期方案，用完改回自动获取。
5. 路由器固件保持更新，设备较多时定期重启路由器。

## 相关教程

- [IP 地址冲突怎么查是哪台设备](./ip-conflict-locate-device.html)
- [Wi-Fi 显示已连接但无法上网（打不开网页）](./wifi-connected-but-no-internet.html)
- [家里所有设备都上不了网：先分清是谁的问题](./home-network-all-offline.html)
- [路由器后台 192.168.1.1 打不开怎么办](./router-admin-page-unreachable.html)
- [电脑没有 WLAN 选项 / 网络适配器不见了](./wifi-adapter-missing.html)

## 更新日志

| 日期 | 版本 | 变更 | 作者/审核 |
|---|---|---|---|
| 2026-10-11 | 1.0 | 首次发布：APIPA 释义、DHCP 续约、路由器侧排查、4199 事件说明与应急静态地址 | 内容组 |
