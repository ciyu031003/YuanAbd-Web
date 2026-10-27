@echo off
chcp 65001 >nul
setlocal EnableExtensions
title 修盒子 - 重启摄像头服务

fltmc >nul 2>&1
if errorlevel 1 (
  echo 正在请求管理员权限...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo ============================================================
echo 修盒子 - 重启摄像头服务
echo ============================================================
echo 将重新扫描摄像头并重启 FrameServer 服务。
echo 不会更改隐私权限，不会卸载摄像头驱动。
echo.
choice /C YN /N /M "确认继续？[Y/N] "
if errorlevel 2 goto :cancelled

echo.
echo [1/3] 重新扫描设备...
pnputil /scan-devices

echo [2/3] 重启 FrameServer...
powershell -NoProfile -Command "Restart-Service -Name FrameServer -Force -ErrorAction SilentlyContinue"
sc query FrameServer | findstr /I "STATE"

echo [3/3] 打开摄像头隐私设置...
start "" ms-settings:privacy-webcam

echo.
echo 完成。请确认“摄像头访问”和对应应用的权限已经打开。
goto :end

:cancelled
echo.
echo 已取消，没有修改任何设置。

:end
echo.
pause
endlocal
