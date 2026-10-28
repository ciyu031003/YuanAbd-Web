@echo off
chcp 65001 >nul
setlocal EnableExtensions
title 修盒子 - 打开开机启动设置

echo ============================================================
echo 修盒子 - 打开开机启动设置
echo ============================================================
echo 适用于：开机太慢，想先看哪些软件会自动启动。
echo.
echo 将打开 Windows 启动应用设置、任务管理器和两个启动文件夹。
echo 只打开设置窗口，不会自动禁用、删除或卸载任何软件。
echo.
choice /C YN /N /M "确认继续？[Y/N] "
if errorlevel 2 goto :cancelled

echo.
echo [1/4] 打开“启动应用”设置...
start "" ms-settings:startupapps
timeout /t 1 /nobreak >nul

echo [2/4] 打开任务管理器...
start "" taskmgr.exe
timeout /t 1 /nobreak >nul

echo [3/4] 打开当前用户启动文件夹...
start "" explorer.exe shell:startup
timeout /t 1 /nobreak >nul

echo [4/4] 打开所有用户启动文件夹...
start "" explorer.exe shell:common startup

echo.
echo 完成。请只关闭你认识、且不需要开机自动运行的软件。
echo 不确定的项目先保留，回到文章对照“哪些绝对不能关”。
goto :end

:cancelled
echo.
echo 已取消，没有打开任何设置。

:end
echo.
pause
endlocal
