@echo off
chcp 65001 >nul
setlocal EnableExtensions
title 修盒子 - 重新扫描 USB 与存储设备

fltmc >nul 2>&1
if errorlevel 1 (
  echo 正在请求管理员权限...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo ============================================================
echo 修盒子 - 重新扫描 USB 与存储设备
echo ============================================================
echo 本脚本只触发 Windows 重新扫描硬件。
echo 不会格式化、初始化、修复或写入任何磁盘。
echo.
choice /C YN /N /M "确认继续？[Y/N] "
if errorlevel 2 goto :cancelled

echo.
echo 正在重新扫描设备...
pnputil /scan-devices

echo.
echo 当前存在问题的设备：
powershell -NoProfile -Command "Get-PnpDevice -PresentOnly | Where-Object Status -ne 'OK' | Select-Object Status,Class,FriendlyName | Format-Table -AutoSize"

echo.
echo 完成。请拔下设备，等待 5 秒后换一个 USB 接口重新插入。
echo 若系统提示格式化，请先不要点“格式化”，回到文章先抢救数据。
goto :end

:cancelled
echo.
echo 已取消，没有修改任何设置。

:end
echo.
pause
endlocal
