@echo off
chcp 65001 >nul
setlocal EnableExtensions
title 修盒子 - 重启无线网卡与 WLAN 服务

fltmc >nul 2>&1
if errorlevel 1 (
  echo 正在请求管理员权限...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo ============================================================
echo 修盒子 - 重启无线网卡与 WLAN 服务
echo ============================================================
echo 将重新扫描硬件，并重启 Windows 的 WLAN AutoConfig 服务。
echo 不会卸载驱动，不会删除已保存的 Wi-Fi 密码。
echo.
choice /C YN /N /M "确认继续？[Y/N] "
if errorlevel 2 goto :cancelled

echo.
echo [1/3] 重新扫描即插即用设备...
pnputil /scan-devices

echo.
echo [2/3] 重启 WLAN AutoConfig...
sc stop WlanSvc >nul 2>&1
timeout /t 2 /nobreak >nul
sc start WlanSvc >nul 2>&1
if errorlevel 1 (
  echo WLAN 服务未能启动。请重启电脑后再次检查。
) else (
  echo WLAN 服务已启动。
)

echo.
echo [3/3] 当前无线网卡状态：
netsh wlan show interfaces

echo.
echo 完成。若仍没有 WLAN 选项，请回到文章检查设备管理器与驱动。
goto :end

:cancelled
echo.
echo 已取消，没有修改任何设置。

:end
echo.
pause
endlocal
