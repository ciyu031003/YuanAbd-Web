@echo off
chcp 65001 >nul
setlocal EnableExtensions
title 修盒子 - Windows 更新开关

fltmc >nul 2>&1
if errorlevel 1 (
  echo 正在请求管理员权限...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

if /I "%~1"=="/restore" goto :restore_mode

echo ============================================================
echo 修盒子 - Windows 更新开关
echo ============================================================
echo [1] 开启或恢复 Windows 更新
echo [2] 临时暂停 24 小时，到期自动恢复
echo [Q] 退出
echo.
echo 不会永久关闭更新，不会修改组策略或删除个人文件。
echo 企业、学校或单位统一管理的电脑请先联系 IT。
echo.
choice /C 12Q /N /M "请选择 [1/2/Q] "
if errorlevel 3 goto :cancelled
if errorlevel 2 goto :pause_update
if errorlevel 1 goto :enable_update
goto :cancelled

:enable_update
echo.
choice /C YN /N /M "确认开启更新服务并取消定时恢复？[Y/N] "
if errorlevel 2 goto :cancelled
call :restore_services
schtasks /Delete /TN "Fixbox\RestoreWindowsUpdate" /F >nul 2>&1
echo.
echo Windows 更新服务已恢复为手动启动并已尝试启动。
start "" ms-settings:windowsupdate
echo 请在设置页面点击“检查更新”；若显示“暂停更新”，再点“恢复更新”。
goto :end

:pause_update
echo.
echo 只会暂停 24 小时，到期后计划任务会自动恢复服务。
echo 暂停期间无法获取安全补丁，请勿在联网办公电脑长期使用。
choice /C YN /N /M "确认临时暂停 24 小时？[Y/N] "
if errorlevel 2 goto :cancelled

for /f %%I in ('powershell -NoProfile -Command "(Get-Date).AddHours(24).AddMinutes(1).ToString('HH:mm')"') do set "RESTORE_AT=%%I"
if not exist "%ProgramData%\Fixbox" mkdir "%ProgramData%\Fixbox" >nul 2>&1
copy /Y "%~f0" "%ProgramData%\Fixbox\manage-windows-update.bat" >nul

echo.
echo [1/3] 创建自动恢复任务，计划时间 %RESTORE_AT% ...
schtasks /Create /TN "Fixbox\RestoreWindowsUpdate" /TR "C:\ProgramData\Fixbox\manage-windows-update.bat /restore" /SC ONCE /ST %RESTORE_AT% /RU SYSTEM /RL HIGHEST /F >nul
if errorlevel 1 (
  echo 创建自动恢复任务失败，未暂停更新。
  goto :end
)

echo [2/3] 停止更新相关服务...
net stop usosvc /y >nul 2>&1
net stop wuauserv /y >nul 2>&1
net stop bits /y >nul 2>&1

echo [3/3] 临时禁用 Windows Update 服务...
sc config wuauserv start= disabled >nul 2>&1
sc config bits start= demand >nul 2>&1
sc config usosvc start= demand >nul 2>&1

echo.
echo 已临时暂停 Windows 更新。系统安全中心仍可能提示更新风险。
echo 如需立即恢复，请重新运行本脚本并选择 [1]。
goto :end

:restore_mode
call :restore_services
if not exist "%ProgramData%\Fixbox" mkdir "%ProgramData%\Fixbox" >nul 2>&1
>>"%ProgramData%\Fixbox\windows-update-restore.log" echo %DATE% %TIME% Windows Update services restored by scheduled task.
schtasks /Delete /TN "Fixbox\RestoreWindowsUpdate" /F >nul 2>&1
endlocal & exit /b 0

:restore_services
echo.
echo 正在恢复 Windows 更新服务...
sc config wuauserv start= demand >nul 2>&1
sc config bits start= demand >nul 2>&1
sc config usosvc start= demand >nul 2>&1
sc config cryptsvc start= auto >nul 2>&1
net start cryptsvc >nul 2>&1
net start bits >nul 2>&1
net start wuauserv >nul 2>&1
net start usosvc >nul 2>&1
exit /b 0

:cancelled
echo.
echo 已取消，没有修改任何设置。

:end
echo.
pause
endlocal
