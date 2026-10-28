@echo off
chcp 65001 >nul
setlocal EnableExtensions
title 修盒子 - 同步 Windows 时间

fltmc >nul 2>&1
if errorlevel 1 (
  echo 正在请求管理员权限...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo ============================================================
echo 修盒子 - 同步 Windows 时间
echo ============================================================
echo 适用于：每次开机时间都不对、网页提示证书时间错误、
echo 或手动改完时间后很快又变回错误时间。
echo.
echo 将恢复 Windows Time 服务、连接 time.windows.com 并立即校时。
echo 不会修改时区，不会删除文件。
echo 公司域电脑通常由单位服务器统一校时，请先联系 IT。
echo.
choice /C YN /N /M "确认继续？[Y/N] "
if errorlevel 2 goto :cancelled

echo.
echo [1/4] 恢复 Windows Time 服务...
sc config w32time start= auto >nul 2>&1
net stop w32time /y >nul 2>&1

echo [2/4] 配置微软时间服务器...
w32tm /config /manualpeerlist:"time.windows.com,0x8" /syncfromflags:manual /update

echo [3/4] 启动时间服务...
net start w32time >nul 2>&1

echo [4/4] 立即同步...
w32tm /resync /force
if errorlevel 1 (
  echo.
  echo 首次同步失败，通常是网络、代理或防火墙阻止了 UDP 123 端口。
  echo 请检查网络后重新运行；公司域电脑请联系 IT。
) else (
  echo.
  echo 校时命令已执行。当前状态如下：
  w32tm /query /status
)

echo.
echo 完成。请重启一次电脑，再观察时间是否仍然自动跑偏。
echo 若每次关机后时间归零，通常是主板纽扣电池需要更换。
goto :end

:cancelled
echo.
echo 已取消，没有修改任何设置。

:end
echo.
pause
endlocal
