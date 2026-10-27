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
  - 系统更新关闭后商店打不开
  - Windows Update 服务禁用后商店异常
keywords: [Microsoft Store, Windows Update依赖, wsreset, 商店修复, 商店重置, 应用安装失败, 0x80131500, 区域设置, 应用商店]
aliases: [应用商店打不开, 微软商店问题, 商店无法加载, Store 修复, 系统更新没开商店打不开]
updated: 2026-10-27
version: "1.3"
prerequisites:
  - Windows 机器有管理员权限
  - Windows 更新已开启且能正常检查更新
  - 网络正常（浏览器能上网）
  - 改「区域/时间」前记住当前设置（用完改回来）
tools: [设置应用, wsreset, 命令提示符（管理员）, Windows 更新]
related: [win-app-crash-missing-dll, browser-proxy, enterprise-proxy, win-safe-restore, codex-desktop-install, win-update-enable]
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

> ⚠ 前提：Microsoft Store 要正常打开、加载和下载应用，前提是 Windows 更新处于开启状态并且能够正常检查更新。Windows Update 服务被禁用、更新被暂停或更新组件损坏时，先修更新，再修商店。
>
> 本文的「重置商店」会清除商店登录状态与缓存（重新登录即可，不影响已装应用）；「重置商店应用」不动个人文件。改区域或代理设置后记得复原。

## 一句话结论

先确认 **Windows 更新已开启并能正常检查更新**，这是商店可用的前提。更新正常后，再按 **`wsreset.exe` 清缓存 → 设置里「修复」→「重置」** 处理商店本身。Windows Update 被关闭时，不要先反复重置商店，直接按 [重新开启 Windows 更新](./win-update-enable.html) 恢复服务和更新功能。

## 30 秒快速排查

1. 打开「设置 → Windows 更新」，确认更新没有被暂停、`Windows Update` 服务不是禁用状态，并且能正常检查更新。
2. 如果更新关闭、无法检查或 `Windows Update` 被禁用，先看 [Windows 更新被关闭了，怎么重新开启](./win-update-enable.html)。更新恢复正常后再回来修商店。
3. 更新正常后，运行 `wsreset.exe` 清理商店缓存；仍异常时继续检查代理、时间和区域。

## 小白一键修复

- 下载：[修复 Microsoft Store（.bat）](../scripts/repair-microsoft-store.bat)
- 适合：Windows 10/11，商店打不开、闪退、缓存损坏或应用下载长期卡住。
- 脚本会：先检查 Windows Update 服务；未开启或无法启动时停止流程，并引导先恢复更新；更新服务正常后才执行 `wsreset.exe` 和商店重新注册。
- 运行前：先在「设置 → Windows 更新」确认系统能正常检查更新；保存正在填写的商店页面信息。
- 注意：脚本不会替你修改组策略，不会卸载应用，也不会删除个人文件。若更新组件本身损坏，还要按更新教程执行 `DISM` 和 `sfc`。

## 适用 / 不适用

**适用**

- Microsoft Store 打不开、无限转圈、闪退、报 0x80131500/0x80131505 等错误码。
- 商店里应用下载卡 0% / 安装失败。
- 商店应用（照片/计算器等 UWP 应用）打不开或闪退。
- 准备从商店安装 ChatGPT/Codex，但商店无法加载商品页。

**不适用**

- Windows 更新被暂停、关闭，或 `Windows Update` 服务被禁用：先按 [重新开启 Windows 更新](./win-update-enable.html) 处理。
- 更新能打开但长期检查失败、下载卡住或安装失败：先按 [Windows 更新卡住修复](./win-update-stuck.html) 处理。
- 普通桌面软件闪退/缺 DLL：看[「Win 软件打不开 / 闪退提示缺少 DLL 怎么修」](./win-app-crash-missing-dll.html)。
- 公司电脑商店被组策略禁用（打不开且提示「联系管理员」）：找 IT，不是故障。
- 网页版商店可以但客户端不行：就是本文明示的网络/缓存层，照做。

## 开始前确认

- [ ] 浏览器能正常上网（排除全断网）。
- [ ] Windows 更新没有暂停，`Windows Update` 服务没有禁用。
- [ ] 「设置 → Windows 更新」能正常点击“检查更新”。
- [ ] 退出 VPN、代理、加速器。
- [ ] 记下当前「区域」设置值。
- [ ] 微软账户密码记得（重置后要重登）。

## 分步骤

### 步骤 1：先确认 Windows 更新正常（商店前提）

**目的**：Microsoft Store 依赖 Windows 更新服务和应用安装组件。更新关闭时，商店可能打不开、无法加载商品页或下载失败。

**操作**：

1. 打开「设置 → Windows 更新」。
2. 如果显示“继续更新”或“恢复更新”，先恢复更新。
3. 点击“检查更新”，确认页面能正常检查，而不是提示服务已禁用。
4. 按 `Win + R` 输入 `services.msc`，找到 `Windows Update`，确认启动类型不是“禁用”。

**预期结果**：Windows 更新已开启，能够正常检查更新；`Windows Update` 服务不是禁用状态。

**失败怎么办**：按 [Windows 更新被关闭了，怎么重新开启](./win-update-enable.html) 恢复更新服务。能检查但一直失败时，按 [Windows 更新卡住修复](./win-update-stuck.html) 处理。更新没有恢复前，不要继续后面的商店修复。

### 步骤 2：wsreset 清缓存（更新正常后）

1. `Win + R` → `wsreset.exe` → 确定。
2. 空白命令行窗口约 10 秒后自动关闭并拉起商店。
**期望结果**：商店正常打开。**失败了怎么办**：依旧打不开 → 步骤 3。

### 步骤 3：修复与重置商店应用

1. 设置 → 应用 → 已安装的应用 → 搜「Microsoft Store」→ 高级选项。
2. 依次点：**终止 → 修复**（修好为止，不丢数据）→ 无效再**重置**（清商店数据，重新登录）。
3. 商店应用（照片/计算器类）打不开的：对该应用做同样的「修复/重置」。
**期望结果**：商店恢复。**失败了怎么办**：重置也无效 → 步骤 4 查网络层。

### 步骤 4：网络层排查（代理/DNS/IPv6）

1. 系统代理确认为关（设置 → 网络 → 代理），见[「浏览器代理与 PAC 设置修复」](./browser-proxy.html)。
2. DNS 换 `223.5.5.5` / `119.29.29.29`（商店服务器解析被污染是常见案），必要时按[「DNS 被劫持怎么判断」](./dns-hijack.html)排查。
3. 试试临时关 IPv6（适配器属性取消 IPv6 勾选）：部分网络环境下商店对 IPv6 兼容差。
**期望结果**：商店能加载内容。**失败了怎么办**：仍报错 → 记下错误码，进步骤 5。

### 步骤 5：时间、区域与账户

1. 区域设为「中国」，重启一次（微软官方对商店异常也列了区域检查）。
2. 时间：自动设置开启，时区正确——证书校验失败会伪装成「打不开」。
3. 账户：设置 → 账户 → 确认微软账户登录正常；商店内点头像退出再登录。
**预期结果**：账户与区域就位后商店恢复。**失败了怎么办**：进步骤 6 系统层。

### 步骤 6：系统层修复（疑难杂症）

1. 再次确认 Windows 更新已开启并能安装累积更新。更新仍异常时，先按 [Windows 更新卡住修复](./win-update-stuck.html) 处理。
2. 管理员命令行跑系统文件检查：`sfc /scannow`，完成后再 `DISM /Online /Cleanup-Image /RestoreHealth`。
3. 顽固案例（Store 被深度损坏）：管理员 PowerShell 执行重装商店命令
   `Get-AppxPackage -allusers Microsoft.WindowsStore | Foreach {Add-AppxPackage -DisableDevelopmentMode -Register "$($_.InstallLocation)\AppXManifest.xml"}` 后重启。
**期望结果**：商店完整重生。**失败了怎么办**：仍不行 → 按[「系统改坏了进不去？安全模式、系统还原与重置的正确顺序」](./win-safe-restore.html)用系统还原退回正常时点，或「重置此电脑（保留我的文件）」。

## 怎么确认修好了

- Windows 更新处于开启状态，能正常检查更新。
- 商店秒开、能搜索、能下载安装一个应用。
- 商店应用（照片/计算器）正常启动。
- 重启电脑后一切正常。

## 还是不行？

- 报错码固定为 0x80131500 且换网络也一样 → 微软服务端区域问题，换 DNS + 等几天（微软偶发区域故障）。
- 商店仍打不开且 Windows Update 服务反复被禁用 → 先修 [Windows 更新被关闭](./win-update-enable.html)，不要继续反复运行 `wsreset`。
- Windows 更新能打开但下载或安装长期失败 → 先修 [Windows 更新卡住](./win-update-stuck.html)。
- 只有公司电脑不行 → 组策略/防火墙拦了商店域名，找 IT。
- LTSC/精简版系统 → 默认无商店，安装商店包属于系统改造，超出常规修复范围。

## 预防

- 别用「系统精简工具」删商店组件——修复成本远大于省下的空间。
- 不要为了关闭更新而永久禁用 `Windows Update` 服务；商店和应用安装都依赖更新组件。
- 加速器/VPN 用完就退，别常驻改系统代理。
- 大版本更新后先开一次商店，早发现早 wsreset。

## 相关教程

- [Win 软件打不开 / 闪退提示缺少 DLL 怎么修](./win-app-crash-missing-dll.html)
- [浏览器打不开网页但其他应用正常？浏览器代理与 PAC 设置修复](./browser-proxy.html)
- [DNS 被劫持怎么判断：打开网页要等很久 / 被插广告的根治方法](./dns-hijack.html)
- [系统改坏了进不去？安全模式、系统还原与重置的正确顺序](./win-safe-restore.html)
- [Windows 更新被关闭了，怎么重新开启](./win-update-enable.html)
- [Windows 更新卡在 0% / 一直失败](./win-update-stuck.html)
- [Codex 怎么下载安装：Windows 桌面版与第一次使用](./codex-desktop-install.html)

## 更新日志

- 2026-10-25 v1.0：首版发布。wsreset/修复/重置主流程与网络/区域/系统层排查综合微软官方支持文档与 Learn 问答整理。
- 2026-10-27 v1.2：加入商店重新注册 BAT，补充 Windows 更新与 Codex 桌面安装关联路径。
- 2026-10-27 v1.3：明确 Windows 更新正常是 Microsoft Store 可用的前置条件，BAT 增加更新服务门槛检查。
