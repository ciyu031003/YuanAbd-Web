@echo off
chcp 65001 >nul
setlocal EnableExtensions
title 修盒子 - 获取 Codex 桌面应用

echo ============================================================
echo 修盒子 - 获取 Codex 桌面应用
echo ============================================================
echo 将打开 Microsoft Store 的官方搜索页和 OpenAI Codex 页面。
echo 只安装发布者为 OpenAI、商店包名为 OpenAI.Codex 的应用。
echo 不会下载第三方安装包，也不会修改系统设置。
echo.
choice /C YN /N /M "确认打开官方获取页面？[Y/N] "
if errorlevel 2 goto :cancelled

echo.
echo [1/3] 检查本机是否已经安装 Codex 桌面应用...
powershell -NoProfile -Command "$pkg = Get-AppxPackage -Name OpenAI.Codex; if ($pkg) { Write-Host ('已安装：OpenAI.Codex ' + $pkg.Version) } else { Write-Host '尚未安装：请在商店中核对发布者 OpenAI' }"

echo [2/3] 打开 Microsoft Store 搜索页...
start "" "ms-windows-store://search/?query=ChatGPT"
timeout /t 2 /nobreak >nul

echo [3/3] 打开 OpenAI Codex 页面...
start "" "https://chatgpt.com/codex/"

echo.
echo 如果本机已安装，可在开始菜单搜索 ChatGPT 并从应用内进入 Codex。
echo 商店没有结果时，先回到“Microsoft Store 打不开”教程修复商店。
goto :end

:cancelled
echo.
echo 已取消，没有打开任何页面。

:end
echo.
pause
endlocal
