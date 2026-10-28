@echo off
chcp 65001 >nul
setlocal EnableExtensions
title 修盒子 - 清除异常代理设置

fltmc >nul 2>&1
if errorlevel 1 (
  echo 正在请求管理员权限...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo ============================================================
echo 修盒子 - 清除异常代理设置
echo ============================================================
echo 将关闭当前用户的浏览器代理、PAC 自动配置和 WinHTTP 代理。
echo.
echo 重要：公司、学校或 VPN 环境可能有统一代理配置。
echo 这类设备请不要运行，否则内网系统可能暂时无法访问。
echo.
choice /C YN /N /M "确认继续？[Y/N] "
if errorlevel 2 goto :cancelled

echo.
echo [1/3] 重置 WinHTTP 代理...
netsh winhttp reset proxy

echo.
echo [2/3] 关闭当前用户代理与 PAC...
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f >nul
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyServer /f >nul 2>&1
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v AutoConfigURL /f >nul 2>&1

echo.
echo [3/3] 清理 DNS 缓存...
ipconfig /flushdns >nul

echo.
echo 完成。请完全关闭并重新打开浏览器。
echo 若内网系统无法访问，请恢复原来的代理地址或联系 IT。
goto :end

:cancelled
echo.
echo 已取消，没有修改任何设置。

:end
echo.
pause
endlocal
