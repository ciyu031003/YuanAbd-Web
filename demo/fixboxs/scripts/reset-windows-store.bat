@echo off
chcp 65001 >nul
setlocal EnableExtensions
title 修盒子 - 清理 Microsoft Store 缓存

echo ============================================================
echo 修盒子 - 清理 Microsoft Store 缓存
echo ============================================================
echo 将关闭商店窗口并执行系统自带的 wsreset 缓存清理。
echo 不会卸载应用，不会删除个人文件。
echo.
choice /C YN /N /M "确认继续？[Y/N] "
if errorlevel 2 goto :cancelled

echo.
taskkill /f /im WinStore.App.exe >nul 2>&1
echo 正在清理商店缓存，可能需要几十秒，请不要关闭此窗口...
call wsreset.exe

echo.
echo 缓存清理结束。正在打开 Microsoft Store...
start "" ms-windows-store:
echo 若商店仍打不开，请回到文章继续检查代理、时间和 Windows 更新。
goto :end

:cancelled
echo.
echo 已取消，没有修改任何设置。

:end
echo.
pause
endlocal
