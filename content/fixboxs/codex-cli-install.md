---
title: Codex CLI 下载安装与登录：Windows 一条命令搞定
slug: codex-cli-install
domain: win-app
category: win-ai-tools
os: [Windows 10, Windows 11]
difficulty: 进阶
time: 10-30 分钟
risk: 需谨慎
symptoms: [Codex CLI怎么安装, npm安装Codex失败, codex命令找不到, Codex登录不了, Codex升级, Codex doctor报错, Node版本不兼容]
keywords: [Codex CLI, npm, @openai/codex, codex login, codex doctor, Node.js, Windows终端]
aliases: [安装Codex命令行, Codex终端版, Codex npm, Codex CLI教程, Codex update]
updated: 2026-10-27
version: "1.0"
prerequisites:
  - Windows 10/11
  - 能安装 Node.js LTS
  - 有可登录 OpenAI 的账号
  - 愿意在终端中运行命令
tools: [PowerShell, Node.js, npm, Codex CLI, 修盒子安装脚本]
related: [codex-desktop-install, win-store-not-opening, browser-proxy, win-update-enable]
sources:
  - title: OpenAI Docs - Codex CLI
    url: https://developers.openai.com/codex/cli/
    type: official
  - title: OpenAI Docs - Codex
    url: https://developers.openai.com/codex/
    type: official
  - title: npm - @openai/codex
    url: https://www.npmjs.com/package/@openai/codex
    type: vendor
  - title: Node.js 官方下载
    url: https://nodejs.org/en/download
    type: vendor
reviewer: 内容组
reviewed_at: 2026-10-27
detail_href: ./fix/codex-cli-install.html
---

# Codex CLI 下载安装与登录：Windows 一条命令搞定

> ⚠️ 需谨慎：Codex CLI 会在本地读取项目并执行命令。安装包来自 npm 官方包 `@openai/codex`，安装后仍要检查工作目录、确认权限和逐项审查改动，不要在不了解风险时关闭全部确认。

## 一句话结论

Codex CLI 的 Windows 主流程是：安装 Node.js LTS → 运行 `npm install -g @openai/codex` → 用 `codex --version` 验证 → 用 `codex login` 登录。下方 BAT 会检查 Node.js 和 npm，确认后自动完成安装；缺少 Node.js 时只打开官方下载页，不会静默装依赖。

## 30 秒快速排查

1. PowerShell 运行 `node --version` 和 `npm --version`，两者都能显示版本号才可继续。
2. 运行下方 BAT，按提示安装 Codex CLI。
3. 新开一个 PowerShell，运行 `codex --version`、`codex login` 和 `codex doctor`。
4. 如果 `codex` 命令找不到，先关闭旧终端再重新打开，仍失败时检查 npm 全局目录是否在 PATH。

## 小白一键修复

- 下载：[安装或更新 Codex CLI（.bat）](../scripts/install-codex-cli.bat)
- 适合：Windows 10/11，已经安装 Node.js/npm，想用一条批处理完成官方包安装或更新。
- 脚本会：检查 Node.js 与 npm，确认后执行 `npm install -g @openai/codex`，显示版本并询问是否登录。
- 运行前：关闭正在运行的 Codex 命令窗口；普通用户不需要管理员权限。
- 注意：脚本不会自动安装 Node.js，也不会使用第三方 npm 镜像；缺少 Node.js 时会打开官方下载页。

## 适用 / 不适用

**适用：**

- 需要在自己的电脑或项目目录中使用 Codex CLI。
- 已经安装 Node.js，希望快速安装、更新或验证 `@openai/codex`。
- 想通过 `codex doctor` 检查配置、登录和本地运行环境。
- 已经用过桌面版，但需要终端自动化工作流。

**不适用：**

- 只想使用图形界面 → [Codex 怎么下载安装：Windows 桌面版](./codex-desktop-install.html)。
- 电脑由公司、学校或组织管理，禁止全局 npm 安装 → 联系 IT。
- 没有 Node.js 且不愿安装开发运行环境 → 优先使用桌面版或网页版。
- 希望通过第三方“破解版”绕过账号或地区限制 → 不支持，也有凭据和代码泄露风险。

## 开始前确认

- [ ] Windows PowerShell 能正常打开。
- [ ] Node.js 已安装，版本以官方当前 LTS 为准。
- [ ] `npm config get registry` 指向可信的官方或单位批准源。
- [ ] 有可正常登录的 OpenAI 账号。
- [ ] 准备一个测试项目目录，不要先在高风险仓库运行自动修改。

## 分步骤

### 步骤 1：安装 Node.js LTS

**目的**：npm 随 Node.js 提供，没有 Node.js 就没有 `npm` 命令。

**操作**：

1. 打开 [Node.js 官方下载页](https://nodejs.org/en/download)。
2. 安装当前 LTS 版本，保留 npm 和“添加到 PATH”的默认选项。
3. 安装后关闭所有旧终端，再打开新的 PowerShell。
4. 分别运行：

```powershell
node --version
npm --version
```

**预期结果**：两条命令都返回版本号。

**失败怎么办**：确认安装的是 LTS 而不是只下载了压缩包；重新打开终端；仍找不到时重新安装并选择加入 PATH。

### 步骤 2：用 BAT 安装 Codex CLI

**目的**：完成官方 npm 包安装，并避免手工拼错包名。

**操作**：

1. 下载 [install-codex-cli.bat](../scripts/install-codex-cli.bat)。
2. 双击运行，阅读提示后选择 `Y`。
3. 脚本会执行：

```powershell
npm install -g @openai/codex
codex --version
```

**预期结果**：npm 安装结束，终端显示 Codex CLI 版本号。

**失败怎么办**：记录 npm 错误。权限错误检查 `npm config get prefix`；网络错误检查代理与 DNS；Node 版本过旧时升级到当前 LTS。

### 步骤 3：登录 Codex

**目的**：把本地 CLI 与你的 OpenAI 账号关联。

**操作**：

1. 新开 PowerShell。
2. 运行：

```powershell
codex login
```

3. 按终端提示在浏览器完成登录。只在你亲自发起的登录页面输入账号。

**预期结果**：终端显示登录成功。

**失败怎么办**：先运行 `codex login status` 查看状态；浏览器无法回调时尝试 `codex login --device-auth`；账号或地区限制按 OpenAI 官方说明处理。

### 步骤 4：运行环境自检

**目的**：确认安装、配置、认证和本地运行环境没有明显问题。

**操作**：

```powershell
codex doctor --summary
```

**预期结果**：关键检查项通过，并给出配置或认证的明确提示。

**失败怎么办**：按 `codex doctor` 的提示处理；认证失败重新运行 `codex login`，配置冲突检查 `~/.codex/config.toml`，不要直接删除整个用户目录。

### 步骤 5：在项目目录第一次使用

**目的**：限制工作范围，先验证读取、修改和审批流程。

**操作**：

1. 在 PowerShell 中进入测试项目：

```powershell
cd "D:\Projects\demo"
codex
```

2. 先让它“阅读项目结构并说明，不要修改文件”。
3. 确认工作目录和权限提示，再让它做一个小改动。
4. 运行 `git diff` 审查改动，确认后再继续。

**预期结果**：Codex 能读取当前项目，修改前请求必要确认，改动可审查。

**失败怎么办**：确认终端当前目录正确；仓库权限不足时修复文件权限；不要用全盘访问参数规避正常的权限检查。

### 步骤 6：更新桌面应用或 CLI

**目的**：保持命令行版本可用，避免长期停留在旧版本。

**操作**：

```powershell
codex --version
codex update
codex app
```

`codex app` 会启动桌面应用；如果本机缺少桌面应用，当前 CLI 会尝试打开应用安装器。

**预期结果**：CLI 更新成功，桌面应用能正常启动。

**失败怎么办**：桌面应用安装失败先修 [Microsoft Store](./win-store-not-opening.html)；npm 更新失败检查网络和全局目录权限。

## 怎么确认修好了

- `node --version`、`npm --version`、`codex --version` 都能正常返回。
- `codex login status` 显示已登录。
- `codex doctor --summary` 没有阻断使用的关键错误。
- 在测试目录运行 `codex` 时能读取项目，并在修改前显示权限确认。

## 还是不行？

- `npm` 不是内部或外部命令 → Node.js 未安装或 PATH 未生效，重新安装 LTS 并重开终端。
- `codex` 命令找不到 → 重开终端；检查 `npm config get prefix` 对应目录是否在 PATH。
- npm 下载超时或证书错误 → 检查系统时间、代理和 DNS；不要直接换用来路不明的脚本源。
- 浏览器无法完成登录 → 查看 `codex login status`，或使用设备授权登录。
- 只想安装桌面版 → [Codex 怎么下载安装：Windows 桌面版](./codex-desktop-install.html)。

## 预防

1. 只用 npm 上的官方包 `@openai/codex`，核对包名不要拼错。
2. 使用 Node.js LTS，不混装多个来源不明的 Node 版本。
3. 在 Git 仓库和测试目录中开始使用，修改前先看 `git diff`。
4. 不要在公共电脑长期保存登录凭据；使用完运行 `codex logout`。
5. 不关闭审批、沙箱和权限检查来追求速度，除非你完全清楚命令影响。

## 相关教程

- [Codex 怎么下载安装：Windows 桌面版](./codex-desktop-install.html)
- [Microsoft Store 打不开 / 商店应用装不上怎么修](./win-store-not-opening.html)
- [浏览器打不开网页但其他应用正常](./browser-proxy.html)
- [Windows 更新被关闭了，怎么重新开启](./win-update-enable.html)

## 更新日志

| 日期 | 版本 | 变更 | 作者/审核 |
|---|---|---|---|
| 2026-10-27 | 1.0 | 首版：Node.js、npm 官方包安装、登录、doctor 自检与首次使用 | 内容组 |
