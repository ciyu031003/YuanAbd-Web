@echo off
chcp 65001 >nul
setlocal EnableExtensions
title 修盒子 - 重置 Windows 更新缓存

fltmc >nul 2>&1
if errorlevel 1 (
  echo 正在请求管理员权限...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo ============================================================
echo 修盒子 - 重置 Windows 更新缓存
echo ============================================================
echo 将停止更新相关服务，备份并重建 SoftwareDistribution 与 catroot2。
echo 不会卸载已安装更新，不会删除个人文件。
echo 企业统一更新环境请先联系 IT。
echo.
choice /C YN /N /M "确认继续？[Y/N] "
if errorlevel 2 goto :cancelled

for /f %%I in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMddHHmmss"') do set "STAMP=%%I"

echo.
echo [1/5] 停止更新服务...
net stop wuauserv /y >nul 2>&1
net stop cryptSvc /y >nul 2>&1
net stop bits /y >nul 2>&1
net stop msiserver /y >nul 2>&1

echo [2/5] 备份更新缓存目录...
if exist "%SystemRoot%\SoftwareDistribution" ren "%SystemRoot%\SoftwareDistribution" "SoftwareDistribution.fixbox-%STAMP%"
if exist "%SystemRoot%\System32\catroot2" ren "%SystemRoot%\System32\catroot2" "catroot2.fixbox-%STAMP%"

echo [3/5] 重新创建缓存目录...
mkdir "%SystemRoot%\SoftwareDistribution" >nul 2>&1
mkdir "%SystemRoot%\System32\catroot2" >nul 2>&1

echo [4/5] 启动更新服务...
net start cryptSvc >nul 2>&1
net start bits >nul 2>&1
net start msiserver >nul 2>&1
net start wuauserv >nul 2>&1

echo [5/5] 打开 Windows 更新...
start "" ms-settings:windowsupdate

echo.
echo 完成。请重新点击“检查更新”。
echo 旧缓存已保留为 .fixbox-%STAMP% 目录，确认更新正常后可手动删除。
echo 如果失败，请回到文章继续运行 DISM / SFC 步骤。
goto :end

:cancelled
echo.
echo 已取消，没有修改任何设置。

:end
echo.
pause
endlocal
