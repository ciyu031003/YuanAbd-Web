---
title: Microsoft Store 打不开 / 商店应用装不上怎么修
slug: win-store-not-opening
domain: win-app
category: win-app-crash
os: [Windows 10, Windows 11]
difficulty: 入门
time: 10-45 分钟
risk: 需谨慎
symptoms:
  - Microsoft Store 打不开
  - 商店一直转圈
  - 商店应用安装失败
  - 应用商店打不开
  - Store 闪退
  - 无法从商店下载
  - 商店报错代码
  - 商店应用打不开
keywords: [Microsoft Store, wsreset, 商店修复, 商店重置, 应用安装失败, 0x80131500, 区域设置, 应用商店]
aliases: [应用商店打不开, 微软商店问题, 商店无法加载, Store 修复]
updated: 2026-10-27
version: "1.1"
prerequisites:
  - Windows 机器有管理员权限
  - 网络正常（浏览器能上网）
  - 改「区域/时间」前记住当前设置（用完改回来）
tools: [设置应用, wsreset, 命令提示符（管理员）, Windows 更新]
related: [win-app-crash-missing-dll, browser-proxy, enterprise-proxy, win-safe-restore, dns-hijack]
sources:
  - title: Microsoft 支持 - Microsoft Store 打不开（wsreset 官方流程）
    url: https://support.microsoft.com/zh-cn/accounts-billing/microsoft-store-doesn-t-open
  - title: Microsoft 支持 - 修复 Microsoft Store 应用出现的问题
    url: https://support.microsoft.com/zh-cn/accounts-billing/fix-problems-with-apps-from-microsoft-store
  - title: Microsoft Learn 问答 - 商店损坏的修复与重置
    url: https://learn.microsoft.com/zh-cn/answers/questions/3880734/question-3880734
reviewer: 内容组
reviewed_at: 2026-10-27
detail_href: ./fix/win-store-not-opening.html
---

# Microsoft Store 打不开 / 商店应用装不上怎么修

> ⚠ 需谨慎：本文的「重置商店」会清除商店的登录状态与缓存（重新登录即可，不影响已装应用）；「重置商店应用」级操作不动个人文件。改区域/代理设置后记得复原。

## 一句话结论

商店问题的修复顺序照抄微软官方三板斧：**`wsreset.exe` 清缓存 → 设置里「修复」→ 「重置」**。九成卡在第一步就好了。开不了机的病因大都是这几样：**代理/VPN 拦截、区域设成了奇怪的国家、时间不对、商店缓存坏了**——按本文顺序走，从软到硬，不用重装系统。

## 30 秒快速排查

1. `Win + R` → 输入 `wsreset.exe` → 回车。**期望结果**：黑窗闪 10 秒后商店自动打开——官方第一步，命中率最高。
2. 关掉 VPN/代理（退出加速器、抓包工具），看[「浏览器打不开网页但其他应用正常？浏览器代理与 PAC 设置修复」](./browser-proxy.html)清一下系统代理。**期望结果**：商店恢复加载。
3. 看日期时间与区域：设置 → 时间和语言 → 区域 =「中国」（或你所在地区）；时间自动同步。**期望结果**：商店服务器握手正常。

## 小白一键修复

- 下载：[清理 Microsoft Store 缓存（.bat）](../scripts/reset-windows-store.bat)
- 适合：Windows 10/11，商店打不开、闪退或应用下载长期卡住。
- 脚本会：关闭商店窗口，执行系统自带 `wsreset.exe`，完成后尝试重新打开商店。
- 运行前：保存正在填写的商店页面信息；脚本不会卸载应用。
- 注意：若公司代理、区域设置或 Windows 更新时间异常，脚本只能清缓存，仍需继续按正文排查。

## 适用 / 不适用

**适用**

- Microsoft Store 打不开、无限转圈、闪退、报 0x80131500/0x80131505 等错误码。
- 商店里应用下载卡 0% / 安装失败。
- 商店应用（照片/计算器等 UWP 应用）打不开或闪退。

**不适用**

- 普通桌面软件闪退/缺 DLL：看[「Win 软件打不开 / 闪退提示缺少 DLL 怎么修」](./win-app-crash-missing-dll.html)。
- 公司电脑商店被组策略禁用（打不开且提示「联系管理员」）：找 IT，不是故障。
- 网页版商店可以但客户端不行：就是本文明示的网络/缓存层，照做。

## 开始前确认

- [ ] 浏览器能正常上网（排除全断网）。
- [ ] 退出 VPN、代理、加速器。
- [ ] 记下当前「区域」设置值。
- [ ] 微软账户密码记得（重置后要重登）。

## 分步骤

### 步骤 1：wsreset 清缓存（官方第一招）

1. `Win + R` → `wsreset.exe` → 确定。
2. 空白命令行窗口约 10 秒后自动关闭并拉起商店。
**期望结果**：商店正常打开。**失败了怎么办**：依旧打不开 → 步骤 2。

### 步骤 2：修复与重置商店应用（官方第二三板斧）

1. 设置 → 应用 → 已安装的应用 → 搜「Microsoft Store」→ 高级选项。
2. 依次点：**终止 → 修复**（修好为止，不丢数据）→ 无效再**重置**（清商店数据，重新登录）。
3. 商店应用（照片/计算器类）打不开的：对该应用做同样的「修复/重置」。
**期望结果**：商店恢复。**失败了怎么办**：重置也无效 → 步骤 3 查网络层。

### 步骤 3：网络层排查（代理/DNS/IPv6）

1. 系统代理确认为关（设置 → 网络 → 代理），见[「浏览器代理与 PAC 设置修复」](./browser-proxy.html)。
2. DNS 换 `223.5.5.5` / `119.29.29.29`（商店服务器解析被污染是常见案），必要时按[「DNS 被劫持怎么判断」](./dns-hijack.html)排查。
3. 试试临时关 IPv6（适配器属性取消 IPv6 勾选）：部分网络环境下商店对 IPv6 兼容差。
**期望结果**：商店能加载内容。**失败了怎么办**：仍报错 → 记下错误码，进步骤 4。

### 步骤 4：时间、区域与账户

1. 区域设为「中国」，重启一次（微软官方对商店异常也列了区域检查）。
2. 时间：自动设置开启，时区正确——证书校验失败会伪装成「打不开」。
3. 账户：设置 → 账户 → 确认微软账户登录正常；商店内点头像退出再登录。
**期望结果**：账户与区域就位后商店恢复。**失败了怎么办**：进步骤 5 系统层。

### 步骤 5：系统层修复（疑难杂症）

1. Windows 更新装齐（设置 → Windows 更新）——商店组件随累积更新修复。
2. 管理员命令行跑系统文件检查：`sfc /scannow`，完成后再 `DISM /Online /Cleanup-Image /RestoreHealth`。
3. 顽固案例（Store 被深度损坏）：管理员 PowerShell 执行重装商店命令
   `Get-AppxPackage -allusers Microsoft.WindowsStore | Foreach {Add-AppxPackage -DisableDevelopmentMode -Register "$($_.InstallLocation)\AppXManifest.xml"}` 后重启。
**期望结果**：商店完整重生。**失败了怎么办**：仍不行 → 按[「系统改坏了进不去？安全模式、系统还原与重置的正确顺序」](./win-safe-restore.html)用系统还原退回正常时点，或「重置此电脑（保留我的文件）」。

## 怎么确认修好了

- 商店秒开、能搜索、能下载安装一个应用。
- 商店应用（照片/计算器）正常启动。
- 重启电脑后一切正常。

## 还是不行？

- 报错码固定为 0x80131500 且换网络也一样 → 微软服务端区域问题，换 DNS + 等几天（微软偶发区域故障）。
- 只有公司电脑不行 → 组策略/防火墙拦了商店域名，找 IT。
- LTSC/精简版系统 → 默认无商店，安装商店包属于系统改造，超出常规修复范围。

## 预防

- 别用「系统精简工具」删商店组件——修复成本远大于省下的空间。
- 加速器/VPN 用完就退，别常驻改系统代理。
- 大版本更新后先开一次商店，早发现早 wsreset。

## 相关教程

- [Win 软件打不开 / 闪退提示缺少 DLL 怎么修](./win-app-crash-missing-dll.html)
- [浏览器打不开网页但其他应用正常？浏览器代理与 PAC 设置修复](./browser-proxy.html)
- [DNS 被劫持怎么判断：打开网页要等很久 / 被插广告的根治方法](./dns-hijack.html)
- [系统改坏了进不去？安全模式、系统还原与重置的正确顺序](./win-safe-restore.html)

## 更新日志

- 2026-10-25 v1.0：首版发布。wsreset/修复/重置主流程与网络/区域/系统层排查综合微软官方支持文档与 Learn 问答整理。
