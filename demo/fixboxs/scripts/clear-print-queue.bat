@echo off
chcp 65001 >nul
setlocal EnableExtensions
title 修盒子 - 清理打印队列

fltmc >nul 2>&1
if errorlevel 1 (
  echo 正在请求管理员权限...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo ============================================================
echo 修盒子 - 清理打印队列
echo ============================================================
echo 将重启 Print Spooler 并删除尚未打印的排队任务。
echo 不会删除打印机驱动，也不会清空纸盒或更改 IP。
echo.
choice /C YN /N /M "确认继续？[Y/N] "
if errorlevel 2 goto :cancelled

echo.
echo [1/3] 停止 Print Spooler...
net stop spooler /y >nul 2>&1

echo [2/3] 清理打印队列缓存...
del /Q /F "%SystemRoot%\System32\spool\PRINTERS\*.*" >nul 2>&1

echo [3/3] 启动 Print Spooler...
net start spooler >nul 2>&1
if errorlevel 1 (
  echo Print Spooler 未能启动。请重启电脑后再试。
) else (
  echo 打印服务已恢复。
)

echo.
echo 完成。请重新发送一份打印任务测试。
goto :end

:cancelled
echo.
echo 已取消，没有修改任何设置。

:end
echo.
pause
endlocal
