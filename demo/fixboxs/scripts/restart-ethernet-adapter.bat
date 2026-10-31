@echo off
chcp 65001 >nul
setlocal EnableExtensions
title 修盒子 - 重启有线网卡

fltmc >nul 2>&1
if errorlevel 1 (
  echo 正在请求管理员权限...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo ============================================================
echo 修盒子 - 重启有线网卡
echo ============================================================
echo 适用于：网口指示灯正常，但电脑仍提示「网络电缆被拔出」，
echo         或以太网适配器出现黄色感叹号/无法获取 IP。
echo.
echo 将重新扫描即插即用设备，并重启除 Wi-Fi 之外的物理网卡。
echo 网络会中断几秒钟；不会卸载驱动，不会删除任何文件。
echo 正在远程控制这台电脑时请先不要运行，否则会掉线。
echo.
choice /C YN /N /M "确认继续？[Y/N] "
if errorlevel 2 goto :cancelled

echo.
echo [1/4] 重新扫描即插即用设备...
pnputil /scan-devices

echo [2/4] 重启物理有线网卡（跳过 Wi-Fi 与虚拟适配器）...
powershell -NoProfile -Command "Get-NetAdapter -Physical | Where-Object { $_.MediaType -ne '802.11' } | Restart-NetAdapter -Confirm:$false"

echo [3/4] 等待网卡重新协商（约 5 秒）...
timeout /t 5 /nobreak >nul

echo [4/4] 打开网络连接面板，请确认「以太网」已启用...
start "" ncpa.cpl

echo.
echo 完成。如果适配器仍显示「未识别的网络」，请按正文检查 IP 获取方式
echo （应为自动 DHCP），或继续按正文重装网卡驱动。
goto :end

:cancelled
echo.
echo 已取消，没有修改任何设置。

:end
echo.
pause
endlocal
