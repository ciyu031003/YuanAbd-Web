@echo off
chcp 65001 >nul
setlocal EnableExtensions
title 修盒子 - 安装 Codex CLI

echo ============================================================
echo 修盒子 - 安装 Codex CLI
echo ============================================================
echo 将从 npm 官方注册表安装 @openai/codex。
echo 不需要管理员权限；不会修改系统代理或安全设置。
echo.

where node >nul 2>&1
if errorlevel 1 goto :missing_node
where npm >nul 2>&1
if errorlevel 1 goto :missing_node

for /f "delims=" %%V in ('node --version') do echo 已检测到 Node.js %%V
for /f "delims=" %%V in ('npm --version') do echo 已检测到 npm %%V
echo.
choice /C YN /N /M "确认安装或更新 Codex CLI？[Y/N] "
if errorlevel 2 goto :cancelled

echo.
echo [1/3] 正在执行 npm install -g @openai/codex ...
call npm install -g @openai/codex
if errorlevel 1 goto :install_failed

echo [2/3] 检查 Codex CLI 版本...
call codex --version
if errorlevel 1 goto :path_failed

echo [3/3] 安装完成。
echo 首次使用请运行 codex login 完成登录，再在项目目录运行 codex。
echo.
choice /C YN /N /M "现在启动 Codex CLI 登录？[Y/N] "
if errorlevel 2 goto :end
call codex login
goto :end

:missing_node
echo.
echo 未检测到可用的 Node.js 或 npm。
echo 本脚本不会静默安装依赖，即将打开 Node.js 官方下载页和 Codex CLI 文档。
start "" "https://nodejs.org/en/download"
start "" "https://developers.openai.com/codex/cli/"
echo 安装 Node.js LTS 后，关闭本窗口并重新运行脚本。
goto :end

:install_failed
echo.
echo npm 安装失败。请检查网络、npm 权限和磁盘空间。
echo 可运行 npm config get prefix 查看全局安装目录。
goto :end

:path_failed
echo.
echo npm 已结束，但当前窗口找不到 codex 命令。
echo 请关闭此窗口，重新打开 PowerShell 后再运行 codex --version。
goto :end

:cancelled
echo.
echo 已取消，没有安装或修改任何内容。

:end
echo.
pause
endlocal
