---
title: Windows 更新被关闭了，怎么重新开启并恢复检查更新
slug: win-update-enable
domain: win-system
category: win-update
os: [Windows 10, Windows 11]
difficulty: 入门
time: 10-30 分钟
risk: 需谨慎
symptoms: [无法检查更新, 更新被暂停, 更新服务被禁用, 设置里没有检查更新, Windows更新打不开, 更新页面空白, 更新一直显示已暂停]
keywords: [开启Windows更新, 恢复更新, wuauserv, BITS, Windows Update服务, 暂停更新, 组策略]
aliases: [系统更新被我关了, 怎么恢复Windows更新, Windows Update服务禁用, 更新功能不见了]
updated: 2026-10-27
version: "1.0"
prerequisites:
  - 电脑能正常进入桌面
  - 有管理员权限
  - 企业或学校电脑先联系 IT
tools: [Windows 设置, 服务, 命令提示符（管理员）, 修盒子 Windows 更新开关 BAT]
related: [win-update-pause, win-update-stuck, win-store-not-opening, codex-desktop-install]
sources:
  - title: Microsoft Learn - 配置 Windows 更新客户端策略
    url: https://learn.microsoft.com/en-us/windows/deployment/update/waas-wu-settings
    type: official
  - title: Microsoft Learn - 排查 Windows 更新问题
    url: https://learn.microsoft.com/zh-cn/troubleshoot/windows-client/installing-updates-features-roles/troubleshoot-windows-update-issues
    type: official
  - title: Microsoft Learn - sc config 命令
    url: https://learn.microsoft.com/zh-cn/windows-server/administration/windows-commands/sc-config
    type: official
reviewer: 内容组
reviewed_at: 2026-10-27
detail_href: ./fix/win-update-enable.html
---

# Windows 更新被关闭了，怎么重新开启并恢复检查更新

> ⚠️ 需谨慎：本文会检查并恢复 Windows Update 相关服务。长期关闭安全更新会扩大漏洞风险，不建议为了“电脑不提醒”而永久禁用更新。企业、学校或单位统一管理的设备不要自行改策略。

## 一句话结论

先看设置里是不是点了“暂停更新”，再检查 Windows Update、BITS、加密服务和更新协调服务有没有被停用。个人电脑可用下方 BAT 选择“开启或恢复”，脚本只恢复服务启动方式并尝试启动，不修改组策略，也不删除个人文件。

## 30 秒快速排查

1. 打开「设置 → Windows 更新」，如果出现“继续更新”或“恢复更新”，先点它。
2. 看页面有没有“你的组织已管理更新”或“某些设置由组织管理”；出现这类提示时直接联系 IT。
3. 运行下方 BAT 并选择 `[1] 开启或恢复 Windows 更新`，完成后重启一次再检查更新。

## 小白一键修复

- 下载：[Windows 更新开关（.bat）](../scripts/manage-windows-update.bat)
- 适合：Windows 10/11 个人电脑，更新服务被误设为禁用，或曾用第三方工具“关闭更新”。
- 脚本会：把 Windows Update、BITS、USOClient 恢复为按需启动，启动加密服务，删除修盒子创建的自动恢复任务，并打开更新设置。
- 运行前：保存文档；如果是公司电脑、学校电脑或提示“由组织管理”，先联系 IT。
- 注意：脚本不会修改注册表组策略，也不会绕过单位的更新管理；恢复后仍应在设置中点击“检查更新”。

## 适用 / 不适用

**适用：**

- 曾在“服务”里把 `Windows Update` 设为禁用。
- 使用过第三方“更新屏蔽工具”，工具卸载后仍无法检查更新。
- 设置页能打开，但检查更新按钮不可用、页面一直空白或显示更新已暂停。

**不适用：**

- 公司、学校或单位明确用组策略、Intune 或桌管软件管理更新 → 联系 IT。
- 更新能检查但下载卡住、安装失败 → 看 [Windows 更新卡在 0% / 一直失败](./win-update-stuck.html)。
- Microsoft Store 打不开，准备从商店安装 Codex → 看 [Microsoft Store 打不开](./win-store-not-opening.html)。
- 系统盘空间不足、系统组件损坏或开机就蓝屏 → 先解决对应故障。

## 开始前确认

- [ ] 笔记本接好电源，网络可用。
- [ ] 当前账户有管理员权限。
- [ ] 知道电脑是否属于公司、学校或组织。
- [ ] 没有安装来源不明的“永久关闭更新”工具。
- [ ] 重要文件已有备份或同步。

## 分步骤

### 步骤 1：先取消“暂停更新”

**目的**：设置中的暂停状态和服务禁用是两套机制，只启动服务并不一定会取消暂停。

**操作**：

1. 打开「设置 → Windows 更新」。
2. 找到“暂停更新”区域，点击“继续更新”或“恢复更新”。
3. 回到更新首页，点击“检查更新”。

**预期结果**：按钮恢复可用，并开始检查更新。

**失败怎么办**：如果显示“由组织管理”，不要继续改注册表，直接联系设备管理员；个人电脑继续步骤 2。

### 步骤 2：运行更新开关脚本

**目的**：把被误禁用的 Windows Update 组件恢复为正常按需启动。

**操作**：

1. 下载 [manage-windows-update.bat](../scripts/manage-windows-update.bat)。
2. 右键选择“以管理员身份运行”。
3. 选择 `[1] 开启或恢复 Windows 更新`，再选择 `Y`。
4. 脚本会打开更新设置，点击“检查更新”。

**预期结果**：更新页面不再提示服务已禁用，检查更新能够开始。

**失败怎么办**：重启一次再试；仍失败时继续步骤 3。

### 步骤 3：确认关键服务状态

**目的**：排除安全软件继续阻止服务启动。

**操作**：

1. 按 `Win + R`，输入 `services.msc`。
2. 分别找到：
   - `Windows Update`
   - `Background Intelligent Transfer Service`
   - `Cryptographic Services`
   - `Update Orchestrator Service`
3. 前三项正常状态应为“手动”或“自动”，USOClient 通常为“手动”。
4. 不要随意修改 `Windows Update Medic Service`，它是受保护的系统修复服务。

**预期结果**：服务没有被第三方软件持续改回“禁用”。

**失败怎么办**：如果服务刚启动又被改回禁用，卸载来源不明的“优化大师”“更新屏蔽器”，再重启。

### 步骤 4：只读检查是否有策略限制

**目的**：判断更新是否被组织策略或旧工具写入限制，避免盲目删除注册表。

**操作**：管理员命令提示符执行以下只读检查：

```bat
reg query "HKLM\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate" /s
reg query "HKLM\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU" /s
```

**预期结果**：没有输出，或没有 `NoAutoUpdate`、`DisableWindowsUpdateAccess` 等限制项。

**失败怎么办**：看到策略项时不要直接 `reg delete`。公司电脑交给 IT；个人电脑先卸载曾使用的更新管理软件，再重启检查。仍不能恢复时，使用系统还原退回安装该工具之前。

### 步骤 5：运行系统更新疑难解答

**目的**：让 Windows 自动修复更新组件注册、权限和临时缓存问题。

**操作**：

1. 打开「设置 → 系统 → 疑难解答 → 其他疑难解答」。
2. 运行“Windows 更新”疑难解答。
3. 完成后重启电脑，再检查更新。

**预期结果**：疑难解答报告已修复问题，更新页面恢复。

**失败怎么办**：能检查但下载失败时，转 [Windows 更新卡住修复](./win-update-stuck.html) 执行缓存重置与系统文件检查。

## 怎么确认修好了

- 「设置 → Windows 更新」能正常点击“检查更新”。
- `Windows Update` 服务状态为“手动”或“正在运行”，不再是“已禁用”。
- 系统能发现新的质量更新或明确显示“你已是最新版本”。
- 重启后没有被第三方工具自动改回禁用。

## 还是不行？

- 更新能检查但卡在下载或安装 → [Windows 更新卡在 0% / 一直失败](./win-update-stuck.html)。
- 只想短时间避开自动重启 → [Windows 自动更新怎么安全暂停](./win-update-pause.html)。
- 微软商店无法打开，影响应用安装 → [Microsoft Store 打不开](./win-store-not-opening.html)。
- 页面提示“由组织管理” → 联系公司、学校或组织的 IT，不要自行绕过。
- 系统时间明显错误、代理被异常修改 → 先校准时间并检查系统代理设置。

## 预防

1. 不要用“永久关闭 Windows 更新”的第三方工具；需要避开工作时间时使用“暂停更新”和“活动时间”。
2. 每月至少检查一次更新，安全补丁不要长期积压。
3. 更新前保持电源连接，并保留 20 GB 以上系统盘空间。
4. 企业设备遵循单位更新策略，不要用个人脚本覆盖组织策略。
5. 安装过优化工具后如果更新异常，先卸载工具并创建还原点，再排查服务。

## 相关教程

- [Windows 自动更新怎么安全暂停](./win-update-pause.html)
- [Windows 更新卡在 0% / 一直失败](./win-update-stuck.html)
- [Microsoft Store 打不开 / 商店应用装不上](./win-store-not-opening.html)
- [Codex 怎么下载安装：Windows 桌面版](./codex-desktop-install.html)

## 更新日志

| 日期 | 版本 | 变更 | 作者/审核 |
|---|---|---|---|
| 2026-10-27 | 1.0 | 首版：更新服务恢复、暂停状态、组织策略只读判断与一键开关脚本 | 内容组 |
