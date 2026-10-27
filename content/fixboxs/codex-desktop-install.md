---
title: Codex 怎么下载安装：Windows 桌面版与第一次使用
slug: codex-desktop-install
domain: win-app
category: win-ai-tools
os: [Windows 10, Windows 11]
difficulty: 入门
time: 10-20 分钟
risk: 安全
symptoms: [Codex怎么下载, Codex桌面版下载, ChatGPT里没有Codex, Codex安装不了, Codex打不开, Codex登录不了, 微软商店找不到Codex]
keywords: [Codex下载, Codex Windows, ChatGPT桌面版, OpenAI Codex, Microsoft Store, Codex安装, Codex登录]
aliases: [下载Codex, 安装Codex, Codex电脑版, Codex桌面应用, ChatGPT Codex]
updated: 2026-10-27
version: "1.0"
prerequisites:
  - Windows 10/11 电脑
  - Microsoft Store 能正常打开
  - 拥有可登录 OpenAI 的账号
  - 账号可用地区和服务状态以 OpenAI 官方说明为准
tools: [Microsoft Store, ChatGPT 桌面应用, OpenAI Codex 页面]
related: [win-store-not-opening, codex-cli-install, win-update-enable, browser-proxy]
sources:
  - title: OpenAI Docs - Codex
    url: https://developers.openai.com/codex/
    type: official
  - title: OpenAI - Codex 网页入口
    url: https://chatgpt.com/codex/
    type: official
  - title: Microsoft Store - 搜索 ChatGPT
    url: https://apps.microsoft.com/search?query=ChatGPT
    type: vendor
  - title: 本机 Windows 安装信息 - OpenAI.Codex 商店包
    url: https://developers.openai.com/codex/
    type: tested
reviewer: 内容组
reviewed_at: 2026-10-27
detail_href: ./fix/codex-desktop-install.html
---

# Codex 怎么下载安装：Windows 桌面版与第一次使用

> ℹ️ 渠道说明：Windows 桌面能力由 OpenAI 发布的 Microsoft Store 包提供。截至 2026-10-27，本机安装信息显示包名为 `OpenAI.Codex`、应用显示名为 `ChatGPT`、发布者为 OpenAI。商店界面和账号可用范围可能变化，请以设备实际显示和 OpenAI 官方页面为准。

## 一句话结论

不要从软件下载站找“Codex 独立安装包”。Windows 用户先在 Microsoft Store 搜索 **ChatGPT**，只安装发布者为 **OpenAI** 的应用；打开后登录账号并进入 Codex。商店打不开时，先用修盒子的商店修复教程处理，再回来安装。

## 30 秒快速排查

1. 打开 Microsoft Store，搜索 `ChatGPT`，核对发布者必须是 **OpenAI**。
2. 如果已经安装，在开始菜单打开 **ChatGPT**，登录后查找 Codex。
3. 如果商店搜索不到、打不开或安装失败，先看 [Microsoft Store 打不开](./win-store-not-opening.html)。
4. 如果只是想用命令行版本，直接看 [Codex CLI 下载安装](./codex-cli-install.html)。

## 小白一键修复

- 下载：[打开 Codex 官方获取入口（.bat）](../scripts/open-codex-install.bat)
- 适合：已经安装商店但找不到 Codex，或不确定本机是否安装过 OpenAI Codex。
- 脚本会：检查本机 `OpenAI.Codex` 安装状态，打开 Microsoft Store 搜索页和 OpenAI Codex 页面。
- 运行前：确认 Microsoft Store 能正常打开；脚本不会自动点击安装或代替账号登录。
- 注意：只安装发布者为 OpenAI 的结果，不要从第三方网盘下载“绿色版”“破解版”。

## 适用 / 不适用

**适用：**

- 第一次在 Windows 安装 Codex 桌面应用。
- 已经安装 ChatGPT 桌面应用，但不知道 Codex 从哪里进入。
- 想确认电脑里有没有安装 OpenAI 发布的 Codex。
- 需要区分桌面应用、网页版与 CLI 三种入口。

**不适用：**

- 想要终端里的 Codex → [Codex CLI 下载安装](./codex-cli-install.html)。
- Microsoft Store 本身打不开、闪退或安装一直失败 → 先修 [Microsoft Store](./win-store-not-opening.html)。
- 账号无法登录、所在地区不支持或组织账号无权限 → 按 OpenAI 官方账号与地区说明处理，本文不提供绕过方法。
- 希望安装第三方修改版 → 不建议，存在账号、代码和本地文件泄露风险。

## 开始前确认

- [ ] Windows 10/11 已安装可用更新。
- [ ] 系统时间和时区准确。
- [ ] Microsoft Store 能搜索和下载其他应用。
- [ ] 有可正常登录的 OpenAI 账号。
- [ ] 知道桌面应用显示名可能是 ChatGPT，而不是只显示 Codex。

## 分步骤

### 步骤 1：先确认商店正常

**目的**：商店组件损坏时，搜索、下载和更新都会失败。

**操作**：

1. 打开 Microsoft Store，搜索任意常用应用。
2. 确认能看到搜索结果和安装按钮。
3. 商店无限转圈或打不开时，先完成 [Microsoft Store 修复](./win-store-not-opening.html)。

**预期结果**：商店能正常加载账户、搜索和下载页面。

**失败怎么办**：运行商店修复 BAT；仍失败时检查代理、系统时间和 Windows 更新状态。

### 步骤 2：从 Microsoft Store 获取 OpenAI 应用

**目的**：确保安装来源可信，避免第三方安装包。

**操作**：

1. 可运行 [open-codex-install.bat](../scripts/open-codex-install.bat)，或手动打开 Microsoft Store。
2. 搜索 `ChatGPT`。
3. 打开结果详情页，核对发布者为 **OpenAI**。
4. 点击“获取”或“安装”，等待完成。

**预期结果**：开始菜单出现 ChatGPT 应用；本机 PowerShell 可查到 `Get-AppxPackage OpenAI.Codex`。

**失败怎么办**：商店报错时记下错误码，回到商店修复文章；不要下载同名第三方安装器。

### 步骤 3：登录并进入 Codex

**目的**：完成账号认证并打开工作入口。

**操作**：

1. 从开始菜单打开 ChatGPT。
2. 使用自己的账号登录。
3. 在应用内选择 Codex，按页面提示打开或新建工作目录。
4. 第一次使用时先选择一个测试文件夹，不要直接让工具修改唯一一份重要资料。

**预期结果**：能看到 Codex 对话界面，并能选择本地项目目录。

**失败怎么办**：退出后重新登录；检查系统时间和网络；组织账号无权限时联系组织管理员。

### 步骤 4：验证应用版本与更新

**目的**：排除旧版本入口缺失或安装包半完成。

**操作**：

1. 打开 Microsoft Store →「库」。
2. 点击“获取更新”，安装 ChatGPT 的可用更新。
3. PowerShell 运行：

```powershell
Get-AppxPackage OpenAI.Codex | Select-Object Name, Version, PublisherDisplayName
```

**预期结果**：返回 `OpenAI.Codex`、版本号，发布者显示 OpenAI。

**失败怎么办**：完全退出应用后重启；仍异常时可从商店卸载再重新安装，项目文件不会因卸载应用被删除，但仍建议先备份。

### 步骤 5：选择桌面、网页或 CLI

**目的**：按使用场景选择入口，避免重复安装和版本混乱。

**操作**：

| 入口 | 适合场景 | 怎么打开 |
|---|---|---|
| Windows 桌面应用 | 图形界面、本地项目、任务管理 | 开始菜单打开 ChatGPT |
| Codex 网页 | 临时查看、云端任务 | 浏览器访问 OpenAI Codex 页面 |
| Codex CLI | 终端工作流、脚本与自动化 | 按 CLI 教程安装后运行 `codex` |

**预期结果**：确定一种主要入口，并完成登录。

**失败怎么办**：桌面入口不可用时先用网页版确认账号状态；终端需求转到 [Codex CLI 下载安装](./codex-cli-install.html)。

## 怎么确认修好了

- Microsoft Store 显示应用已安装，发布者为 OpenAI。
- 开始菜单能打开 ChatGPT，应用内能看到 Codex。
- PowerShell 查询到 `OpenAI.Codex` 包。
- 登录后能选择测试项目目录，应用没有持续闪退或报错。

## 还是不行？

- 商店打不开、闪退或下载卡住 → [Microsoft Store 打不开](./win-store-not-opening.html)。
- Codex 搜索不到或应用内没有入口 → 先在商店“库”更新，再核对账号和服务地区。
- 想使用终端版本 → [Codex CLI 下载安装](./codex-cli-install.html)。
- 浏览器能上网但应用连不上 → 检查代理与系统时间，参考 [浏览器代理与 PAC 设置修复](./browser-proxy.html)。
- 安装应用需要更新系统组件 → [Windows 更新被关闭了，怎么重新开启](./win-update-enable.html)。

## 预防

1. 只从 Microsoft Store 的 OpenAI 发布者页面或 OpenAI 官方入口下载。
2. 不从网盘、论坛或“绿色版”站点安装 Codex，避免账号令牌和代码泄露。
3. 定期打开商店“库 → 获取更新”，不要长期停留在旧版本。
4. 第一次使用先选测试项目，并确认工作目录和文件修改范围。
5. 账号、地区和组织权限限制以 OpenAI 官方说明为准，不使用绕过工具。

## 相关教程

- [Microsoft Store 打不开 / 商店应用装不上怎么修](./win-store-not-opening.html)
- [Codex CLI 下载安装与登录](./codex-cli-install.html)
- [Windows 更新被关闭了，怎么重新开启](./win-update-enable.html)
- [浏览器打不开网页但其他应用正常](./browser-proxy.html)

## 更新日志

| 日期 | 版本 | 变更 | 作者/审核 |
|---|---|---|---|
| 2026-10-27 | 1.0 | 首版：Windows 官方商店渠道、安装验证与三种入口说明 | 内容组 |
