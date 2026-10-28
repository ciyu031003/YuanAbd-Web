@echo off
chcp 65001 >nul
setlocal EnableExtensions
title 修盒子 - 重启 Windows 搜索

fltmc >nul 2>&1
if errorlevel 1 (
  echo 正在请求管理员权限...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo ============================================================
echo 修盒子 - 重启 Windows 搜索
echo ============================================================
echo 适用于：开始菜单搜不到程序、文件资源管理器搜索无结果、
echo 或搜索框输入后长时间没有反应。
echo.
echo 将把 Windows Search 服务恢复为自动启动并重启该服务。
echo 不会删除个人文件，也不会清空现有搜索索引。
echo 单位统一管理的电脑可能禁用了这项服务，请先联系 IT。
echo.
choice /C YN /N /M "确认继续？[Y/N] "
if errorlevel 2 goto :cancelled

echo.
echo [1/3] 恢复 Windows Search 服务启动类型...
sc config WSearch start= auto >nul 2>&1

echo [2/3] 重启 Windows Search 服务...
net stop WSearch /y >nul 2>&1
net start WSearch >nul 2>&1
if errorlevel 1 (
  echo 搜索服务未能启动。请重启电脑后再运行一次本脚本。
) else (
  echo 搜索服务已重新启动。
)

echo [3/3] 打开索引选项...
start "" control.exe srchadmin.dll

echo.
echo 完成。请在索引选项里确认常用文件夹已包含；
echo 然后打开开始菜单，输入一个已安装程序的名字测试。
echo 如果仍然无效，请回到文章执行搜索和系统文件排查。
goto :end

:cancelled
echo.
echo 已取消，没有修改任何设置。

:end
echo.
pause
endlocal
