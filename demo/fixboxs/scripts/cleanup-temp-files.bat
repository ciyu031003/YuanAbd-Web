@echo off
chcp 65001 >nul
setlocal EnableExtensions
title 修盒子 - 安全清理临时文件

fltmc >nul 2>&1
if errorlevel 1 (
  echo 正在请求管理员权限...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo ============================================================
echo 修盒子 - 安全清理临时文件
echo ============================================================
echo 将清理当前用户临时目录和 Windows 临时目录。
echo 不会清理下载、桌面、文档、图片、回收站或系统还原点。
echo 正在使用的文件会自动跳过。
echo.
choice /C YN /N /M "确认继续？[Y/N] "
if errorlevel 2 goto :cancelled

echo.
echo [1/3] 清理用户临时目录...
for /d %%D in ("%TEMP%\*") do rd /s /q "%%D" >nul 2>&1
del /F /Q /S "%TEMP%\*.*" >nul 2>&1

echo [2/3] 清理 Windows 临时目录...
for /d %%D in ("%SystemRoot%\Temp\*") do rd /s /q "%%D" >nul 2>&1
del /F /Q /S "%SystemRoot%\Temp\*.*" >nul 2>&1

echo [3/3] 输出 C 盘可用空间...
powershell -NoProfile -Command "$d=Get-PSDrive C; '{0:N2} GB 可用' -f ($d.Free/1GB)"

echo.
echo 完成。此脚本只清理临时文件，不会处理 Windows.old、休眠文件或系统还原点。
echo 若 C 盘仍满，请回到文章按“存储感知 / 磁盘清理”继续处理。
goto :end

:cancelled
echo.
echo 已取消，没有删除任何文件。

:end
echo.
pause
endlocal
