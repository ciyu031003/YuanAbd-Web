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
echo 前提：Windows 更新必须已开启，并且 Windows Update 服务能正常运行。
echo 不会卸载已安装应用，不会删除个人文件。
echo 企业或学校统一管理的电脑请先联系 IT。
echo.

echo [前置检查] Windows Update 服务...
set "WU_START=unknown"
for /f "tokens=3" %%S in ('sc.exe qc wuauserv ^| findstr /I "START_TYPE"') do set "WU_START=%%S"
if "%WU_START%"=="4" goto :update_required

sc.exe query wuauserv | findstr /I "RUNNING" >nul
if errorlevel 1 (
  echo Windows Update 服务当前未运行，正在尝试启动...
  net start wuauserv >nul 2>&1
)
sc.exe query wuauserv | findstr /I "RUNNING" >nul
if errorlevel 1 goto :update_required
echo Windows Update 服务状态正常，继续检查商店。

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

:update_required
echo.
echo 商店修复未开始：Windows Update 服务被禁用或无法启动。
echo 请先恢复系统更新，并确认“设置 - Windows 更新”能正常检查更新。
choice /C YN /N /M "是否打开 Windows 更新恢复教程？[Y/N] "
if errorlevel 2 goto :end
start "" "https://pc-fixboxs.yuanabd.cn/fix/win-update-enable.html"
goto :end

:cancelled
echo.
echo 已取消，没有修改任何设置。

:end
echo.
pause
endlocal
