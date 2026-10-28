@echo off
chcp 65001 >nul
setlocal EnableExtensions
title 修盒子 - 生成电脑诊断报告

fltmc >nul 2>&1
if errorlevel 1 (
  echo 正在请求管理员权限...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo ============================================================
echo 修盒子 - 生成电脑诊断报告
echo ============================================================
echo 适用于：电脑反复卡顿、死机或偶发蓝屏，想知道应该查什么。
echo.
echo 将读取系统版本、磁盘健康、空间、启动项、高占用进程和近期错误，
echo 并把结果保存为桌面上的 TXT 报告。
echo 不会修改系统设置，不会删除文件，不会上传任何内容。
echo 报告会包含电脑名、用户名、软件名和日志，分享前请先自行检查。
echo.
choice /C YN /N /M "确认生成报告？[Y/N] "
if errorlevel 2 goto :cancelled

set "REPORT=%USERPROFILE%\Desktop\Fixbox-Diagnostics-%RANDOM%.txt"
echo 正在收集信息，可能需要 1-3 分钟...

> "%REPORT%" echo 修盒子 Windows 诊断报告
>> "%REPORT%" echo 生成时间：
>> "%REPORT%" echo ------------------------------------------------------------
>> "%REPORT%" powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd HH:mm:ss'"

>> "%REPORT%" echo.
>> "%REPORT%" echo [系统与硬件]
>> "%REPORT%" echo ------------------------------------------------------------
>> "%REPORT%" powershell -NoProfile -Command "Get-ComputerInfo | Select-Object CsManufacturer,CsModel,CsName,WindowsProductName,WindowsVersion,OsBuildNumber,OsArchitecture,CsTotalPhysicalMemory | Format-List"

>> "%REPORT%" echo.
>> "%REPORT%" echo [磁盘健康]
>> "%REPORT%" echo ------------------------------------------------------------
>> "%REPORT%" powershell -NoProfile -Command "Get-PhysicalDisk | Select-Object FriendlyName,MediaType,HealthStatus,OperationalStatus,Size | Format-Table -AutoSize"

>> "%REPORT%" echo.
>> "%REPORT%" echo [分区剩余空间]
>> "%REPORT%" echo ------------------------------------------------------------
>> "%REPORT%" powershell -NoProfile -Command "Get-Volume | Where-Object DriveLetter | Select-Object DriveLetter,FileSystemLabel,FileSystem,HealthStatus,@{N='SizeGB';E={[math]::Round($_.Size/1GB,1)}},@{N='FreeGB';E={[math]::Round($_.SizeRemaining/1GB,1)}} | Format-Table -AutoSize"

>> "%REPORT%" echo.
>> "%REPORT%" echo [内存占用最高的 15 个进程]
>> "%REPORT%" echo ------------------------------------------------------------
>> "%REPORT%" powershell -NoProfile -Command "Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 15 Name,Id,@{N='MemoryMB';E={[math]::Round($_.WorkingSet64/1MB,1)}},CPU | Format-Table -AutoSize"

>> "%REPORT%" echo.
>> "%REPORT%" echo [启动项]
>> "%REPORT%" echo ------------------------------------------------------------
>> "%REPORT%" powershell -NoProfile -Command "Get-CimInstance Win32_StartupCommand | Select-Object Name,Command,Location,User | Format-List"

>> "%REPORT%" echo.
>> "%REPORT%" echo [最近 30 条系统错误和严重事件]
>> "%REPORT%" echo ------------------------------------------------------------
>> "%REPORT%" powershell -NoProfile -Command "Get-WinEvent -FilterHashtable @{LogName='System'; Level=1,2} -MaxEvents 30 | Select-Object TimeCreated,Id,ProviderName,Message | Format-List"

echo.
echo 报告已保存到：
echo %REPORT%
echo.
echo 请先查看报告，删除不愿公开的电脑名、用户名等信息，再发给维护人员。
start "" notepad "%REPORT%"
goto :end

:cancelled
echo.
echo 已取消，没有读取或写入诊断报告。

:end
echo.
pause
endlocal
