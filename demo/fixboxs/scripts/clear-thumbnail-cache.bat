@echo off
chcp 65001 >nul
setlocal EnableExtensions
title 修盒子 - 重建缩略图与图标缓存

echo ============================================================
echo 修盒子 - 重建缩略图与图标缓存
echo ============================================================
echo 适用于：图片缩略图空白、文件图标变成白纸、
echo 或资源管理器里出现错乱、重复、显示错误的图标。
echo.
echo 将重启 Explorer，并删除当前用户可自动重建的缩略图和图标缓存。
echo 不会删除照片、视频、文档或任何个人文件。
echo 桌面和打开的文件夹会短暂消失，随后自动恢复。
echo.
choice /C YN /N /M "确认继续？[Y/N] "
if errorlevel 2 goto :cancelled

echo.
echo [1/3] 关闭资源管理器...
taskkill /f /im explorer.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] 清理可自动重建的缓存...
del /f /q "%LocalAppData%\Microsoft\Windows\Explorer\thumbcache_*.db" >nul 2>&1
del /f /q "%LocalAppData%\Microsoft\Windows\Explorer\iconcache_*.db" >nul 2>&1
del /f /q "%LocalAppData%\IconCache.db" >nul 2>&1

echo [3/3] 重新打开资源管理器...
start "" explorer.exe

echo.
echo 完成。首次打开图片较多的文件夹时缩略图会重新生成，
echo 磁盘和 CPU 可能短暂升高，请等待几分钟再判断效果。
goto :end

:cancelled
echo.
echo 已取消，没有修改任何设置。

:end
echo.
pause
endlocal
