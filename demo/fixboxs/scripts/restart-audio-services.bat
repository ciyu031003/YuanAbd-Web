@echo off
chcp 65001 >nul
setlocal EnableExtensions
title 修盒子 - 重启 Windows 音频服务

fltmc >nul 2>&1
if errorlevel 1 (
  echo 正在请求管理员权限...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo ============================================================
echo 修盒子 - 重启 Windows 音频服务
echo ============================================================
echo 将重新扫描音频设备，并重启 AudioEndpointBuilder 与 Audiosrv。
echo 不会删除声卡驱动。
echo.
choice /C YN /N /M "确认继续？[Y/N] "
if errorlevel 2 goto :cancelled

echo.
echo [1/4] 停止音频服务...
net stop Audiosrv /y >nul 2>&1
net stop AudioEndpointBuilder /y >nul 2>&1

echo [2/4] 重新扫描音频设备...
pnputil /scan-devices

echo [3/4] 启动音频服务...
net start AudioEndpointBuilder >nul 2>&1
net start Audiosrv >nul 2>&1

echo [4/4] 打开声音设置...
start "" ms-settings:sound

echo.
echo 完成。请在声音设置里确认已选择正确的输出设备。
goto :end

:cancelled
echo.
echo 已取消，没有修改任何设置。

:end
echo.
pause
endlocal
