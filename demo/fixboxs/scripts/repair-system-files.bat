@echo off
chcp 65001 >nul
setlocal EnableExtensions
title 修盒子 - 修复 Windows 系统文件

fltmc >nul 2>&1
if errorlevel 1 (
  echo 正在请求管理员权限...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo ============================================================
echo 修盒子 - 修复 Windows 系统文件
echo ============================================================
echo 将依次运行 DISM RestoreHealth 与 SFC 扫描。
echo 总耗时可能为 15-60 分钟，进度条可能长时间不动。
echo 请保持电源连接，不要强制关机。
echo.
choice /C YN /N /M "确认继续？[Y/N] "
if errorlevel 2 goto :cancelled

echo.
echo [1/2] 修复 Windows 组件存储...
DISM /Online /Cleanup-Image /RestoreHealth
set "DISM_CODE=%ERRORLEVEL%"

echo.
echo [2/2] 扫描并修复系统文件...
sfc /scannow
set "SFC_CODE=%ERRORLEVEL%"

echo.
echo 结果：DISM=%DISM_CODE%  SFC=%SFC_CODE%
echo 完成后建议重启电脑，再回到文章继续排查。
echo 若 DISM 报 0x800f081f，请使用与系统版本匹配的安装镜像作为修复源。
goto :end

:cancelled
echo.
echo 已取消，没有修改任何设置。

:end
echo.
pause
endlocal
