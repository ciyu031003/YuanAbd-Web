@echo off
chcp 65001 >nul
setlocal EnableExtensions
title 修盒子 - 修复 Microsoft Store

fltmc >nul 2>&1
if errorlevel 1 (
  echo 正在请求管理员权限...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo ============================================================
echo 修盒子 - 修复 Microsoft Store
echo ============================================================
echo 将关闭商店、清理缓存，并重新注册当前系统内的 Microsoft Store。
echo 不会卸载已安装应用，不会删除个人文件。
echo 企业或学校统一管理的电脑请先联系 IT。
echo.
choice /C YN /N /M "确认继续？[Y/N] "
if errorlevel 2 goto :cancelled

echo.
echo [1/3] 关闭商店进程并清理缓存...
taskkill /f /im WinStore.App.exe >nul 2>&1
call wsreset.exe

echo [2/3] 重新注册 Microsoft Store（不卸载应用）...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$pkgs = Get-AppxPackage -AllUsers -Name Microsoft.WindowsStore; if (-not $pkgs) { exit 2 }; foreach ($pkg in $pkgs) { $manifest = Join-Path $pkg.InstallLocation 'AppXManifest.xml'; if (Test-Path $manifest) { Add-AppxPackage -DisableDevelopmentMode -Register $manifest -ErrorAction Stop } }"
set "STORE_RC=%ERRORLEVEL%"

echo [3/3] 重新打开 Microsoft Store...
start "" ms-windows-store:

echo.
if "%STORE_RC%"=="0" (
  echo 修复流程已完成。请等待商店加载并尝试搜索一个应用。
) else (
  echo 缓存已清理，但重新注册未完全成功。
  echo 请重启电脑后重试；仍失败时回到文章检查更新、区域和账户状态。
)
echo 若系统提示商店组件缺失，请先完成 Windows 更新，不要安装第三方“商店修复包”。
goto :end

:cancelled
echo.
echo 已取消，没有修改任何设置。

:end
echo.
pause
endlocal
