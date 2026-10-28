@echo off
chcp 65001 >nul
setlocal EnableExtensions
title 修盒子 - 导出蓝屏证据

fltmc >nul 2>&1
if errorlevel 1 (
  echo 正在请求管理员权限...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo ============================================================
echo 修盒子 - 导出蓝屏证据
echo ============================================================
echo 适用于：电脑蓝屏后自动重启，没来得及看清停止代码。
echo.
echo 将导出近期异常关机与 BugCheck 日志，并列出系统的小内存转储文件。
echo 不会分析、移动或删除转储文件，也不会修改系统设置。
echo 报告只保存在本机桌面，不会上传。
echo.
choice /C YN /N /M "确认继续？[Y/N] "
if errorlevel 2 goto :cancelled

set "REPORT=%USERPROFILE%\Desktop\Fixbox-BlueScreen-%RANDOM%.txt"

echo 正在读取事件日志...
> "%REPORT%" echo 修盒子蓝屏证据报告
>> "%REPORT%" echo 生成时间：
>> "%REPORT%" powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd HH:mm:ss'"
>> "%REPORT%" echo.
>> "%REPORT%" echo [事件 ID 41 / 1001 / 6008，最近 50 条]
>> "%REPORT%" echo ------------------------------------------------------------
wevtutil qe System /q:"*[System[(EventID=41 or EventID=1001 or EventID=6008)]]" /c:50 /rd:true /f:text >> "%REPORT%" 2>&1

>> "%REPORT%" echo.
>> "%REPORT%" echo [Minidump 文件列表]
>> "%REPORT%" echo ------------------------------------------------------------
if exist "%SystemRoot%\Minidump" (
  dir /a "%SystemRoot%\Minidump" >> "%REPORT%" 2>&1
) else (
  >> "%REPORT%" echo 未找到 C:\Windows\Minidump 文件夹。
  >> "%REPORT%" echo 可能尚未启用小内存转储，或本次不是内核蓝屏。
)

>> "%REPORT%" echo.
>> "%REPORT%" echo [使用提示]
>> "%REPORT%" echo ------------------------------------------------------------
>> "%REPORT%" echo 1. 先在报告中搜索 BugCheck、0x 开头的代码和 .sys 文件名。
>> "%REPORT%" echo 2. 小内存转储位于 C:\Windows\Minidump，可交给维护人员分析。
>> "%REPORT%" echo 3. 报告可能含电脑名与软件名，分享前请先检查。

echo.
echo 报告已保存到：
echo %REPORT%
start "" notepad "%REPORT%"
if exist "%SystemRoot%\Minidump" start "" explorer.exe "%SystemRoot%\Minidump"
goto :end

:cancelled
echo.
echo 已取消，没有读取或写入报告。

:end
echo.
pause
endlocal
