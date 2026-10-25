---
title: Wi-Fi 显示已连接但无法上网（打不开网页）
slug: wifi-connected-but-no-internet
domain: net-basic
category: net-connected-noint
os: [Windows 10, Windows 11, macOS 12+]
difficulty: 入门
time: 15-45 分钟
risk: 安全
symptoms: [连上wifi上不了网, 无Internet访问权限, 网络受限, 打不开网页, 有WiFi没网, 显示已连接但无法访问互联网, 网页转圈打不开, connected no internet, 有信号没网速, 微信能用网页打不开]
keywords: [已连接但无法上网, 分层定位, 默认网关, DNS 解析, 代理设置, ipconfig, nslookup, netsh winsock reset]
aliases: [上不了网, 断网, 没网, 连上网不能用, 有网但打不开网页]
updated: 2026-10-11
version: "1.0"
prerequisites: [能正常使用手机, 知道自家路由器位置和管理地址, 电脑可以正常开关机]
tools: [手机（对照测试）, Windows 命令提示符 / PowerShell, macOS 终端, 可以打开记事本或备忘录记录配置]
related: [home-network-all-offline, dhcp-no-ip-169-254, dns-broken-but-app-works, wifi-adapter-missing, router-admin-page-unreachable]
sources:
  - title: Microsoft 支持 — 修复 Windows 中的 Wi-Fi 连接问题
    url: https://support.microsoft.com/zh-cn/windows/fix-wi-fi-connection-issues-in-windows-9424a1f7-6a3b-65a6-4d78-7f07eee84d2c
  - title: Microsoft Learn — netsh winsock 命令
    url: https://learn.microsoft.com/zh-cn/windows-server/administration/windows-commands/netsh-winsock
  - title: Apple 支持 — 如果 Mac 无法通过 Wi-Fi 接入互联网
    url: https://support.apple.com/zh-cn/101588
  - title: Apple 支持 — 在 Mac 上更改 DNS 设置
    url: https://support.apple.com/zh-cn/guide/mac-help/mh14127/mac
  - title: Apple 支持 — 在 Mac 上使用"无线诊断"
    url: https://support.apple.com/zh-cn/guide/mac-help/mchlf4de377f/mac
reviewer: 内容组
reviewed_at: 2026-10-11
detail_href: ./fix/wifi-connected-but-no-internet.html
---

# Wi-Fi 显示已连接但无法上网（打不开网页）

## 一句话结论

「已连接」只说明电脑和路由器握手了，不代表路由器能上网。不要乱试，按**物理层 → IP 层 → DNS 层 → 代理层**四层各敲一条命令定位，哪层不通就修哪层。

## 30 秒快速排查

1. **用手机连同一个 Wi-Fi 打开网页。** 期望：手机也不行 → 是路由器或宽带的问题，直接看 [家里所有设备都上不了网：先分清是谁的问题](./home-network-all-offline.html)；手机正常 → 问题在这台电脑，继续往下。
2. **重启路由器和光猫。** 两个都断电 30 秒，先开光猫、等指示灯稳定后再开路由器，再等 2 分钟。期望：约有一半的"连上没网"这样就好了。
3. **按下面四层各敲一条命令**（Windows 用命令提示符，Mac 用终端）。期望：找出到底是哪一层断了，再对症处理。

## 适用 / 不适用

**适用：**

- Wi-Fi 图标显示已连接，但浏览器打不开网页，或任务栏出现地球/叹号图标
- 提示「无 Internet 访问权限」「网络受限」「无法访问互联网」
- 一会儿能上一会儿不能上，网页时好时坏

**不适用（请转对应文章）：**

- Wi-Fi 列表里根本没有自家网络 → [Wi-Fi 列表里找不到自家网络怎么办](./wifi-ssid-not-found.html)
- 所有设备（含手机）都上不了网 → [家里所有设备都上不了网：先分清是谁的问题](./home-network-all-offline.html)
- 电脑地址是 169.254 开头 → 直接看 [电脑获取不到 IP 地址 / IP 是 169.254 开头](./dhcp-no-ip-169-254.html)
- 网页打不开但 QQ、微信能正常收发消息 → [网页打不开但 QQ / 微信能用：DNS 问题怎么修](./dns-broken-but-app-works.html)
- 进不去路由器管理页面 → [路由器后台 192.168.1.1 打不开怎么办](./router-admin-page-unreachable.html)

## 开始前确认

- [ ] 手机连同一个 Wi-Fi 试过，确认不是全家断网
- [ ] 手边有记事本或备忘录，先把下面三条信息抄下来：IP 地址、默认网关、DNS 服务器（改坏了可以照着还原）
- [ ] Windows 建议用**管理员**身份打开命令提示符：开始菜单搜索 `cmd` → 右键 → 以管理员身份运行
- [ ] macOS 需要输密码时，能输入管理员账户密码
- [ ] 已保存正在编辑的文档，部分步骤需要重启

## 分步骤

先看这张表，它是本文的骨架。**每一层只敲一条命令，先判断在哪一层断，再往下走。**

| 层 | 要回答的问题 | Windows 命令 | macOS 命令 | 怎么读结果 |
|---|---|---|---|---|
| 物理层 | 电脑到路由器通不通 | `ping 192.168.1.1` | `ping -c 4 路由器地址` | 不通 → 无线链路/路由器问题 |
| IP 层 | 有没有拿到有效地址 | `ipconfig /all` | `ifconfig en0` + `netstat -nr` | 169.254 或没有 IPv4 → DHCP 失败 |
| DNS 层 | 域名能不能解析 | `nslookup www.baidu.com` | `nslookup www.baidu.com` | ping 得通公网 IP 却解析失败 → DNS 问题 |
| 代理层 | 有没有"中间人"拦流量 | `netsh winhttp show proxy` | 系统设置 → 网络 → 代理 | 有不认识的代理 → 关掉它 |

### 步骤 1：确认故障范围

**目的**：分清是"路由器/宽带的问题"还是"这台电脑的问题"，方向错了会越修越乱。

**操作**：用手机连同一个 Wi-Fi，打开任意网页；再打开一个视频 App 播 10 秒。

**预期结果**：

- 手机正常 → 问题在电脑侧，继续步骤 2
- 手机也不行 → 转 [家里所有设备都上不了网：先分清是谁的问题](./home-network-all-offline.html)，本文后续步骤不适用

**失败怎么办**：手机可能连的是移动数据，先在手机上关掉移动数据再测一次，确认走的是 Wi-Fi。

### 步骤 2：物理层——能不能 ping 通网关

**目的**：网关就是路由器，ping 不通它说明"电脑到路由器"这段就不通，后面的 DNS、代理都不用查。

**操作**：先拿到网关地址（见步骤 3 的命令），然后：

Windows（命令提示符）：

```bat
ping 192.168.1.1
```

macOS（终端，ping 默认一直发包，用 `-c 4` 发 4 个就停）：

```bash
ping -c 4 192.168.1.1
```

**预期结果**：出现 `来自 192.168.1.1 的回复` / `4 packets transmitted, 4 packets received`，丢包率 0%。说明电脑到路由器这一段是通的。

**失败怎么办**：

- 全部"请求超时" → 先换成 ping 别的设备试；把电脑搬到路由器旁边；重启路由器。仍然不通就把它当作局域网问题处理，检查是否连错 Wi-Fi、是否开了 VPN 虚拟网卡。
- 提示"无法访问目标主机" → 本机地址或掩码不对，看 [电脑获取不到 IP 地址 / IP 是 169.254 开头](./dhcp-no-ip-169-254.html)。

### 步骤 3：IP 层——看电脑拿到了什么地址

**目的**：确认电脑是不是真的从路由器拿到有效地址。

**操作**：

Windows（命令提示符）：

```bat
ipconfig /all
```

macOS（终端）：

```bash
ifconfig en0
netstat -nr
route -n get default
```

**预期结果**：

- 看到形如 `192.168.x.x`、`10.x.x.x` 的 IPv4 地址，掩码正常；
- 默认网关是路由器地址（常见 `192.168.1.1`、`192.168.0.1`、`192.168.31.1`）；
- macOS 的 `netstat -nr` 第一行 `default` 右侧就是网关。

拿到网关后再做一次公网连通性测试：

```bat
ping 223.5.5.5
ping 114.114.114.114
```

**失败怎么办**：

- 地址是 `169.254.x.x`（Windows 会写"自动配置 IPv4 地址"）→ 电脑没拿到 DHCP 租约，转 [电脑获取不到 IP 地址 / IP 是 169.254 开头](./dhcp-no-ip-169-254.html)
- 完全没有 IPv4 地址、只有 IPv6 → 网卡或驱动问题，转 [电脑没有 WLAN 选项 / 网络适配器不见了](./wifi-adapter-missing.html)
- ping 公网 IP 也不通但网关能通 → 路由器到宽带这一段有问题，转 [家里所有设备都上不了网：先分清是谁的问题](./home-network-all-offline.html)

### 步骤 4：刷新 IP 与 DNS 缓存

**目的**：清掉可能失效的地址租约和错误的解析缓存，这是成本最低的一步。

**操作**：

Windows（管理员命令提示符，逐条执行）：

```bat
ipconfig /release
ipconfig /renew
ipconfig /flushdns
```

macOS（终端，Wi-Fi 的服务名可用 `networksetup -listallnetworkservices` 查询，一般是 `Wi-Fi`）：

```bash
sudo ipconfig set en0 DHCP
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

**预期结果**：`ipconfig /renew` 返回新的 IPv4 地址；提示"已成功刷新 DNS 解析缓存"。

**失败怎么办**：

- 报"媒体已断开" → 链路层没通，回到步骤 2
- `/renew` 长时间无响应 → 路由器 DHCP 没响应，重启路由器后重试；仍不行看 [电脑获取不到 IP 地址 / IP 是 169.254 开头](./dhcp-no-ip-169-254.html)

### 步骤 5：DNS 层——换一个 DNS 服务器

**目的**：DNS 是"连上但打不开网页"最常见的原因。用一条命令就能验证。

**操作**：先判断是不是 DNS 的问题：

```bat
nslookup www.baidu.com
nslookup www.baidu.com 223.5.5.5
```

- 第 1 条解析失败、第 2 条能返回 IP → 是本机/路由器的 DNS 配置有问题。
- 两条都能解析，但网页还是打不开 → 不是 DNS 层，跳到步骤 6。

确认是 DNS 问题后，临时改成公共 DNS：

Windows：**设置 → 网络和 Internet → 高级网络设置 → 你的网卡 → 编辑**，IP 分配保持"自动 (DHCP)"，把 DNS 服务器分配改为"手动"，首选 `223.5.5.5`（阿里公共 DNS），备用 `119.29.29.29`（腾讯公共 DNS），保存。

macOS（终端）：

```bash
networksetup -setdnsservers Wi-Fi 223.5.5.5 119.29.29.29
networksetup -getdnsservers Wi-Fi
```

**预期结果**：能正常打开网页，`nslookup www.baidu.com` 返回 IP 地址。

**失败怎么办**：改回自动获取——Windows 在同一个界面把 DNS 服务器分配改回"自动 (DHCP)"；macOS 执行 `networksetup -setdnsservers Wi-Fi Empty`。仍打不开就看 [网页打不开但 QQ / 微信能用：DNS 问题怎么修](./dns-broken-but-app-works.html)。

### 步骤 6：代理层——关掉代理、VPN 和加速器

**目的**：代理设置残留、VPN 虚拟网卡、抓包工具是"网络看着正常但上不了网"的高频原因。

**操作**：

Windows：

1. **设置 → 网络和 Internet → 代理**，关闭"自动检测设置"和"使用代理服务器"。
2. 管理员命令提示符查看系统级代理：

```bat
netsh winhttp show proxy
```

3. 退出所有 VPN、网游加速器、抓包软件，并在**网络连接**里禁用多余的虚拟网卡。

macOS：**系统设置 → 网络 → 详细信息 → 代理**，关闭所有代理开关；退出 VPN/加速器类 App；旧版的抓包工具（如 Charles、Fiddler）也要退出。

浏览器里也要看：Chrome / Edge 的扩展（代理类插件）先全部禁用再试。

> 合规提示：本文只讲"代理残留导致断网"的故障排查，不提供任何跨境代理或翻墙的方法与工具。在中国大陆，搭建或使用未经批准的跨境代理可能违反相关规定；公司、学校配发的设备请直接联系 IT，不要自行改动代理配置。

**预期结果**：关闭后网页恢复；`netsh winhttp show proxy` 显示"直接访问(没有代理服务器)"。

**失败怎么办**：刚装过加速器、抓包或虚拟网卡软件后全网断网，卸载该软件并重启；仍不行继续步骤 7。

### 步骤 7：重置网络栈（最后手段，需要重启）

**目的**：把网络组件恢复到初始状态，解决协议栈损坏类问题。**注意：会清空已保存的 Wi-Fi 密码和自定义网络配置。**

**操作**：

Windows（管理员命令提示符，逐条执行后重启）：

```bat
netsh winsock reset
netsh int ip reset
ipconfig /flushdns
shutdown /r /t 0
```

也可以在**设置 → 网络和 Internet → 高级网络设置 → 网络重置 → 立即重置**里做同样的事，重启后需要重新输入 Wi-Fi 密码。

macOS：

1. **系统设置 → 网络**，选中 Wi-Fi，点"-"删除服务，再用"+"重新添加 Wi-Fi 服务；
2. 或者重启 Mac，并在开机时按住 Shift 进入安全模式测一次网络，再正常重启。

**预期结果**：重启后网络恢复正常。

**失败怎么办**：重启后仍不行，说明不是本机协议栈问题，回到步骤 1 重新判断范围，或按下一节分流。

### 步骤 8：兜底排查

**目的**：排除少数由安全软件、账户配置或系统更新引起的情况。

**操作**：

1. 临时关闭第三方杀毒/防火墙（只关 5 分钟测试，测完立刻打开），看是否恢复。
2. macOS 新建一个测试用户账户登录，看新账户能否上网（能上说明是你原账户的配置问题）。
3. 检查系统时间和日期是否准确（时间偏差过大会导致 HTTPS 握手失败，网页打不开）。
4. 确认浏览器不是"离线模式"，并换一个浏览器、换一台设备试。
5. 仍怀疑系统文件损坏，可在管理员命令提示符里依次执行 `DISM /Online /Cleanup-Image /RestoreHealth` 和 `sfc /scannow`（各需几分钟），完成后重启。

**预期结果**：找到具体诱因（某个安全软件、账户配置、系统时间、浏览器设置），处理后恢复上网。

**失败怎么办**：所有步骤做完仍然不行，按下一节"还是不行？"分流；公司/学校设备直接联系 IT。

## 怎么确认修好了

同时满足三条：

1. 能连续打开 2-3 个不同的网站（不只是浏览器首页），并刷新两次；
2. Windows 执行 `ping 223.5.5.5`、macOS 执行 `ping -c 4 223.5.5.5` 丢包率为 0；
3. `nslookup www.baidu.com` 能解析出 IP 地址。

只满足第 2 条、网站仍打不开，说明问题在 DNS 或代理层，回到步骤 5、6。

## 还是不行？

- **只有 QQ/微信能用，网页打不开** → 看 [网页打不开但 QQ / 微信能用：DNS 问题怎么修](./dns-broken-but-app-works.html)
- **IP 是 169.254 开头 / 拿不到地址** → 看 [电脑获取不到 IP 地址 / IP 是 169.254 开头](./dhcp-no-ip-169-254.html)
- **手机连同一 Wi-Fi 也上不了网** → 看 [家里所有设备都上不了网：先分清是谁的问题](./home-network-all-offline.html)
- **网卡消失、WLAN 开关没了** → 看 [电脑没有 WLAN 选项 / 网络适配器不见了](./wifi-adapter-missing.html)
- **以上都试过仍不通，或这是公司/学校设备** → 联系运营商报修或联系单位 IT；企业网络里的 DNS、代理、准入策略由 IT 统一管理，不要自行改动

## 预防

1. 不要安装来源不明的"网络加速""一键修复"工具，这类软件常留下代理和虚拟网卡。
2. 卸载 VPN、抓包、模拟器类软件后，顺手检查一遍代理设置是否被清空。
3. 家用路由器 DNS 保持"自动获取"，需要时再临时改公共 DNS，用完改回。
4. 定期重启光猫和路由器（每 1-2 个月一次），并保持路由器固件为最新版本。
## 相关教程

- [家里所有设备都上不了网：先分清是谁的问题](./home-network-all-offline.html)
- [电脑获取不到 IP 地址 / IP 是 169.254 开头](./dhcp-no-ip-169-254.html)
- [网页打不开但 QQ / 微信能用：DNS 问题怎么修](./dns-broken-but-app-works.html)
- [Wi-Fi 列表里找不到自家网络怎么办](./wifi-ssid-not-found.html)
- [电脑没有 WLAN 选项 / 网络适配器不见了](./wifi-adapter-missing.html)

## 更新日志

| 日期 | 版本 | 变更 | 作者/审核 |
|---|---|---|---|
| 2026-10-11 | 1.0 | 首次发布：确立四层定位法（物理层/IP 层/DNS 层/代理层），补齐 Windows 与 macOS 双系统命令 | 内容组 |
