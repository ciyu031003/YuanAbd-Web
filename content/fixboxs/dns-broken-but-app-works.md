---
title: 网页打不开但 QQ / 微信能用：DNS 问题怎么修
slug: dns-broken-but-app-works
domain: ip-dns
category: ip-dns-fail
os: [Windows 10, Windows 11, macOS 12+]
difficulty: 入门
time: 15-40 分钟
risk: 需谨慎
symptoms: [网页打不开但微信能用, QQ能上网页打不开, DNS错误, 无法解析域名, 有些网站打不开, 网页加载很慢, DNS_PROBE_FINISHED, 找不到服务器, 域名解析失败, 部分网站上不去]
keywords: [DNS, nslookup, 域名解析, DNS 缓存, 安全 DNS, DoH, hosts, 223.5.5.5]
aliases: [DNS有问题, 域名解析不了, 网站打不开, 部分网站上不去]
updated: 2026-10-27
version: "1.1"
prerequisites: [能使用 QQ/微信等即时通讯软件（说明网络本身是通的）, 知道管理员密码（清缓存和改 DNS 需要）, 知道自家路由器管理地址]
tools: [命令提示符 / PowerShell, macOS 终端, 浏览器设置, 路由器管理页面]
related: [wifi-connected-but-no-internet, dhcp-no-ip-169-254, ip-conflict-locate-device, home-network-all-offline]
sources:
  - title: Apple 支持 — 在 Mac 上更改 DNS 设置
    url: https://support.apple.com/zh-cn/guide/mac-help/mh14127/mac
  - title: Microsoft 支持 — 修复 Windows 中的 Wi-Fi 连接问题
    url: https://support.microsoft.com/zh-cn/windows/fix-wi-fi-connection-issues-in-windows-9424a1f7-6a3b-65a6-4d78-7f07eee84d2c
  - title: Microsoft Learn — ipconfig 命令
    url: https://learn.microsoft.com/zh-cn/windows-server/administration/windows-commands/ipconfig
  - title: IETF — RFC 1034：域名概念与设施
    url: https://datatracker.ietf.org/doc/html/rfc1034
reviewer: 内容组
reviewed_at: 2026-10-27
detail_href: ./fix/dns-broken-but-app-works.html
---

# 网页打不开但 QQ / 微信能用：DNS 问题怎么修

> ⚠️ 本文会修改 DNS 设置。操作前建议把当前的 DNS 配置截图保存，改完若无效可按文中的方法改回"自动获取"。

## 一句话结论

"能 ping 通 IP、却打不开网页"几乎可以断定是 DNS（域名解析）出了问题。先用 `nslookup` 验证一次，再清缓存、换 DNS 服务器，两步就能修好大多数情况。

## 30 秒快速排查

1. **验证是不是 DNS**：管理员命令提示符执行 `ping 223.5.5.5`（能通）再执行 `ping www.baidu.com`（提示找不到主机）。期望：前者通、后者不通 → 确认是 DNS 问题。
2. **清一次 DNS 缓存**：Windows 执行 `ipconfig /flushdns`；macOS 执行 `sudo dscacheutil -flushcache` 和 `sudo killall -HUP mDNSResponder`。期望：缓存造成的解析错误立刻修复。
3. **临时换公共 DNS**：Windows 在网络设置里把 DNS 改成手动 `223.5.5.5`；macOS 执行 `networksetup -setdnsservers Wi-Fi 223.5.5.5 119.29.29.29`。期望：网页恢复打开。

## 小白一键修复

- 下载：[清理 DNS 缓存（.bat）](../scripts/flush-dns-cache.bat)
- 适合：Windows 10/11，QQ/微信等直连应用正常，但网页域名解析失败或刚改过 DNS。
- 脚本会：执行 `ipconfig /flushdns` 清空本机 DNS 缓存。
- 运行前：关闭正在打开的浏览器。
- 注意：脚本不会修改 DNS 服务器地址；如果 DNS 被路由器或恶意软件篡改，还要继续按正文修正上游配置。

## 适用 / 不适用

**适用：**

- 微信、QQ、钉钉能正常收发消息，但浏览器打不开网页
- 提示"找不到服务器""DNS_PROBE_FINISHED_NXDOMAIN""无法解析域名"
- 大部分网页能开，个别网站打不开
- 网页打开很慢，先卡在"正在解析主机"

**不适用（请转对应文章）：**

- 连 QQ/微信也用不了、所有程序都断网 → [Wi-Fi 显示已连接但无法上网（打不开网页）](./wifi-connected-but-no-internet.html)
- 电脑 IP 是 169.254 开头或拿不到地址 → [电脑获取不到 IP 地址 / IP 是 169.254 开头](./dhcp-no-ip-169-254.html)
- 所有设备（含手机）都上不了网 → [家里所有设备都上不了网：先分清是谁的问题](./home-network-all-offline.html)
- 只是进不去路由器后台 → [路由器后台 192.168.1.1 打不开怎么办](./router-admin-page-unreachable.html)
- 公司/学校内网系统打不开 → 联系 IT，内网域名通常由单位 DNS 解析

## 开始前确认

- [ ] 能确认 QQ/微信能正常收发消息（说明物理链路和 IP 层没问题）
- [ ] Windows 用管理员身份打开命令提示符：开始菜单搜索 `cmd` → 右键 → 以管理员身份运行
- [ ] 记下当前 DNS 设置（截图），方便改回自动
- [ ] 知道路由器管理地址与密码（要检查路由器侧的 DNS）
- [ ] 明白本文只做 DNS 故障排查，不涉及任何跨境代理或翻墙方法

## 分步骤

### 步骤 1：三步判定——到底是不是 DNS

**目的**：把"DNS 问题"和"网络完全不通"分开，避免用错方法。

**操作**：

```bat
ping 223.5.5.5
ping www.baidu.com
nslookup www.baidu.com
nslookup www.baidu.com 223.5.5.5
```

macOS 上把第一条改成 `ping -c 4 223.5.5.5` 和 `ping -c 4 www.baidu.com`，其余命令相同。

| 现象 | 结论 | 下一步 |
|---|---|---|
| ping 通 223.5.5.5，但 ping 不通 www.baidu.com | DNS 解析失败 | 继续本文 |
| `nslookup www.baidu.com` 失败，加 `223.5.5.5` 后成功 | 本机/路由器的 DNS 配置有问题 | 跳到步骤 3 |
| 两条 nslookup 都能解析，但网页打不开 | 不是 DNS | 转 [Wi-Fi 显示已连接但无法上网（打不开网页）](./wifi-connected-but-no-internet.html) |
| 连 223.5.5.5 都 ping 不通 | 网络根本没通 | 转 [Wi-Fi 显示已连接但无法上网（打不开网页）](./wifi-connected-but-no-internet.html) |

> 小提示：部分公共 DNS 不响应 ping 属于正常；只要 `ping 114.114.114.114` 能通，就说明公网可达。

**预期结果**：确认"IP 可达、域名不可解析"。

**失败怎么办**：提示 `nslookup` 不是内部命令 → 命令拼写有误；Windows 上也可用 PowerShell 的 `Resolve-DnsName www.baidu.com` 代替。

### 步骤 2：清空 DNS 缓存

**目的**：缓存里存着过期的或错误的解析结果，清一次成本最低。

**操作**：

Windows（管理员命令提示符）：

![在命令提示符里执行 ipconfig /flushdns](../img/guides/cmd-flushdns.webp)
按 Win+R 输入 cmd（建议以管理员身份运行），输入这行命令回车，看到「已成功刷新 DNS 解析缓存」就说明清干净了。

```bat
ipconfig /displaydns
ipconfig /flushdns
```

macOS（终端）：

```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
scutil --dns
```

**预期结果**：

- Windows 提示"已成功刷新 DNS 解析缓存"；
- macOS 的 `scutil --dns` 能列出当前的 DNS 配置和解析顺序。

**失败怎么办**：清缓存后仍打不开 → 说明不是缓存问题，继续步骤 3；`ipconfig /displaydns` 输出的条目过多时可以只看开头几条。

### 步骤 3：换一个可用的 DNS 服务器

**目的**：直接绕过出问题的 DNS。

**操作**：

Windows：右键任务栏网络图标 → **网络和 Internet 设置 → 高级网络设置** → 选中你的网卡 → **编辑** → IP 分配保持"自动 (DHCP)"，把 DNS 服务器分配改为"手动"，打开 IPv4，填：

- 首选：`223.5.5.5`（阿里公共 DNS）
- 备用：`119.29.29.29`（腾讯公共 DNS）

保存后执行 `ipconfig /flushdns` 验证。

macOS（终端，服务名一般是 `Wi-Fi`）：

```bash
networksetup -listallnetworkservices
networksetup -setdnsservers Wi-Fi 223.5.5.5 119.29.29.29
networksetup -getdnsservers Wi-Fi
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

常用公共 DNS 对照：

| 服务商 | 主 DNS | 备用 DNS | 说明 |
|---|---|---|---|
| 阿里公共 DNS | `223.5.5.5` | `223.6.6.6` | 国内常用，延迟低 |
| 腾讯 DNSPod | `119.29.29.29` | `119.28.28.28` | 国内常用 |
| 114DNS | `114.114.114.114` | `114.114.115.115` | 老牌公共 DNS |
| 运营商 / 路由器 | 自动获取 | — | 默认状态，通常最省心 |

> 境外公共 DNS（如 8.8.8.8、1.1.1.1）在中国大陆可能不可用或解析结果不佳，遇到打不开时不要把它们当成首选方案。

**预期结果**：网页打开正常，`nslookup www.baidu.com` 返回 IP 地址。

**失败怎么办**：改回自动——Windows 把 DNS 服务器分配改回"自动 (DHCP)"；macOS 执行：

```bash
networksetup -setdnsservers Wi-Fi Empty
```

若换 DNS 后仍不能解析，继续步骤 4。

### 步骤 4：检查浏览器的"安全 DNS"和代理

**目的**：浏览器自带的安全 DNS（DoH）会绕过系统 DNS，配置不当就是"只有浏览器打不开"。

**操作**：

- Chrome：**设置 → 隐私和安全 → 安全 → 使用安全 DNS**，先改成"关闭"或"使用当前服务提供商"再测试。
- Edge：**设置 → 隐私、搜索和服务 → 安全性 → 使用安全 DNS**，做同样处理。
- 关闭浏览器里所有代理类扩展（VPN、代理、广告拦截），用无痕窗口再试一次。
- 系统代理：Windows **设置 → 网络和 Internet → 代理**，关闭"自动检测设置""使用代理服务器"；macOS **系统设置 → 网络 → 详细信息 → 代理**，关闭所有开关。

> 合规提示：本文只讲 DNS 与代理残留导致的网页打不开，不提供任何跨境代理或翻墙方法与工具。公司/学校设备请直接联系 IT。

**预期结果**：关闭后网页恢复；`netsh winhttp show proxy` 显示"直接访问"。

**失败怎么办**：不确定是哪个扩展导致，先全部禁用再逐个打开；普通浏览器插件不会影响系统 DNS，问题多出在代理类扩展上。

### 步骤 5：检查路由器侧的 DNS 与过滤

**目的**：所有设备都解析异常时，问题往往在路由器。

**操作**：

1. 登录路由器管理页面，在「上网设置 / WAN」里查看 DNS 是"自动获取"还是被手工填了地址。
2. 如果被手工填过，改回自动获取，或填入上面表格里的公共 DNS。
3. 检查有没有开启"家长控制""域名过滤""上网时间限制"，这类功能会拦截特定域名的解析。
4. 保存后重启路由器，并让设备重新连接。

**预期结果**：路由器侧 DNS 正常后，家里所有设备都能正常解析。

**失败怎么办**：进不去管理页面 → [路由器后台 192.168.1.1 打不开怎么办](./router-admin-page-unreachable.html)；运营商光猫里的 DNS 一般不用改，拿不准就联系客服。

### 步骤 6：检查 hosts 文件与安全软件

**目的**：hosts 文件被改写、安全软件劫持解析，也会造成"某些网站打不开"。

**操作**：

- Windows：用记事本（以管理员身份运行）打开 `C:\Windows\System32\drivers\etc\hosts`，看有没有别人加过、你不认识的域名映射；有的话删掉或整行前面加 `#` 注释掉，保存。
- macOS：终端执行 `sudo nano /etc/hosts` 检查，`Ctrl+O` 保存、`Ctrl+X` 退出。
- 临时关闭第三方杀毒/防火墙/上网管理软件 5 分钟测试（测完立刻打开）。
- 近期装过"加速""优化""内网穿透"类软件，先卸载并重启。

**预期结果**：删除异常条目后，原本打不开的网站能正常访问。

**失败怎么办**：不知道哪些条目是系统必需的，就只删掉你确定是自己或某个软件最近添加的那几行；改坏了可把整段删除保留默认内容（Windows 的 hosts 默认只有注释行）。

### 步骤 7：区分"单个网站打不开"和"全部打不开"

**目的**：判断是对方网站的问题还是自己这边的问题。

**操作**：换手机用流量打开同一个网站；再用电脑打开另外 3 个不同网站。

| 结果 | 结论 | 处理 |
|---|---|---|
| 只有这一个网站打不开，手机流量也打不开 | 网站自身故障或本地网络到该站的线路问题 | 等待或联系该网站客服，不用折腾电脑 |
| 电脑所有网站都打不开，手机正常 | 本机 DNS 或代理问题 | 回到步骤 2-4 |
| 家里所有设备都打不开同一个网站 | 路由器过滤或运营商侧问题 | 检查家长控制，联系运营商 |
| 换手机热点后一切正常 | 家里网络出口的问题 | 检查路由器 DNS 与过滤 |

**预期结果**：明确责任方，不再做无效操作。

**失败怎么办**：情况反复出现，记录打不开的网站域名和时间点，报修时提供给运营商。

## 怎么确认修好了

同时满足：

1. `nslookup www.baidu.com` 和 `nslookup www.qq.com` 都能解析出 IP 地址；
2. 浏览器里连续打开 3 个不同网站（含一个以前打不开的），刷新两次都正常；
3. 关闭无痕窗口、第二天再打开，网页依旧能正常访问（说明不是缓存碰巧命中）。

## 还是不行？

- **电脑完全断网，不只是网页打不开** → 看 [Wi-Fi 显示已连接但无法上网（打不开网页）](./wifi-connected-but-no-internet.html)
- **拿不到 IP 地址或地址是 169.254 开头** → 看 [电脑获取不到 IP 地址 / IP 是 169.254 开头](./dhcp-no-ip-169-254.html)
- **家里所有设备都上不了网** → 看 [家里所有设备都上不了网：先分清是谁的问题](./home-network-all-offline.html)
- **只有公司的内网系统/办公网站打不开** → 联系单位 IT，内网域名和分流由 IT 配置
- **反复出现、DNS 换成公共的也无效** → 联系运营商报修，说明"域名解析异常、IP 可达"，并保留 `nslookup` 的结果截图

## 预防

1. DNS 平时保持"自动获取"，只有确认解析异常时才临时改公共 DNS，用完改回。
2. 不要安装来源不明的"上网加速""DNS 优选"工具，也不要随意改 hosts 文件。
3. 浏览器里的安全 DNS（DoH）保持默认，除非你清楚它对当前网络的影响。
4. 路由器固件保持更新，开启家长控制/域名过滤时记下自己加过的规则。
5. 遇到解析异常时，先截图 `nslookup` 的结果，报修时能省很多沟通时间。

## 相关教程

- [Wi-Fi 显示已连接但无法上网（打不开网页）](./wifi-connected-but-no-internet.html)
- [电脑获取不到 IP 地址 / IP 是 169.254 开头](./dhcp-no-ip-169-254.html)
- [IP 地址冲突怎么查是哪台设备](./ip-conflict-locate-device.html)
- [家里所有设备都上不了网：先分清是谁的问题](./home-network-all-offline.html)
- [浏览器提示"你的连接不是私密连接"怎么办](./dns-broken-but-app-works.html)

## 更新日志

| 日期 | 版本 | 变更 | 作者/审核 |
|---|---|---|---|
| 2026-10-11 | 1.0 | 首次发布：DNS 三步判定表、缓存刷新、公共 DNS 对照、安全 DNS 与 hosts 排查 | 内容组 |
