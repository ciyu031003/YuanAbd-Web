@echo off
chcp 65001 >nul
setlocal EnableExtensions
title 修盒子 - 重启蓝牙服务

fltmc >nul 2>&1
if errorlevel 1 (
  echo 正在请求管理员权限...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo ============================================================
echo 修盒子 - 重启蓝牙服务
echo ============================================================
echo 将重新扫描设备并重启 Bluetooth Support Service。
echo 不会卸载蓝牙驱动，不会删除配对记录。
echo.
choice /C YN /N /M "确认继续？[Y/N] "
if errorlevel 2 goto :cancelled

echo.
echo [1/3] 重新扫描设备...
pnputil /scan-devices

echo [2/3] 重启蓝牙服务...
powershell -NoProfile -Command "Restart-Service -Name bthserv -Force -ErrorAction SilentlyContinue"
sc query bthserv | findstr /I "STATE"

echo [3/3] 打开蓝牙设置...
start "" ms-settings:bluetooth

echo.
echo 完成。请删除失败的旧配对记录，再重新配对一次。
goto :end

:cancelled
echo.
echo 已取消，没有修改任何设置。

:end
echo.
pause
endlocal
