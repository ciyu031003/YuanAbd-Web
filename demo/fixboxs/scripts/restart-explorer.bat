@echo off
chcp 65001 >nul
setlocal EnableExtensions
title 修盒子 - 重启 Windows 桌面

echo ============================================================
echo 修盒子 - 重启 Windows 桌面
echo ============================================================
echo 适用于：能看到鼠标，但桌面、任务栏或图标不显示。
echo 将重启 explorer.exe，不会删除文件，不会重启电脑。
echo.
choice /C YN /N /M "确认继续？[Y/N] "
if errorlevel 2 goto :cancelled

echo.
echo 正在重启 Explorer...
taskkill /f /im explorer.exe >nul 2>&1
timeout /t 2 /nobreak >nul
start "" explorer.exe

echo.
echo 完成。请等待几秒，让桌面和任务栏重新出现。
echo 如果仍然黑屏，请回到文章检查显卡驱动和系统文件。
goto :end

:cancelled
echo.
echo 已取消，没有修改任何设置。

:end
echo.
pause
endlocal
