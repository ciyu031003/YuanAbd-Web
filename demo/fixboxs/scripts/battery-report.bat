@echo off
chcp 65001 >nul
setlocal EnableExtensions
title 修盒子 - 生成笔记本电脑电池报告

echo ============================================================
echo 修盒子 - 生成笔记本电脑电池报告
echo ============================================================
echo 适用于：电池插着电却充不进、电量卡在某个百分比不动，
echo         想确认电池损耗与充放电历史，判断是电池问题还是设置问题。
echo.
echo 将用系统自带 powercfg 在桌面生成一份电池报告（HTML），
echo 内容包含设计容量、实际满充容量、近期充放电记录。
echo 不会修改任何设置，不会联网，不会删除文件。
echo 报告里没有个人隐私，只记录电池型号与使用数据。
echo.
choice /C YN /N /M "确认生成报告？[Y/N] "
if errorlevel 2 goto :cancelled

set "REPORT=%USERPROFILE%\Desktop\battery-report.html"
echo.
echo [1/2] 正在生成电池报告...
powercfg /batteryreport /output "%REPORT%" >nul 2>&1
if not exist "%REPORT%" (
  echo 生成失败。请确认当前用户是管理员组成员，或改用正文中的
  echo 命令提示符（管理员）方式手动执行 powercfg /batteryreport。
  goto :end
)

echo [2/2] 用默认浏览器打开报告...
start "" "%REPORT%"

echo.
echo 怎么看这份报告：
echo  - 「DESIGN CAPACITY 设计容量」vs「FULL CHARGE CAPACITY 满充容量」：
echo    满充低于设计容量的 80%% 说明电池已明显老化。
echo  - 「RECENT USAGE 近期用电」：插电期间电量仍持续下降，多为适配器/接口问题。
echo  - 电池长期只充到 60-80%%？请先检查联想 Vantage / 戴尔 Power Manager 等
echo    厂商工具里的「保养模式 / 充电阈值」，那不是故障。
goto :end

:cancelled
echo.
echo 已取消，没有生成任何报告。

:end
echo.
pause
endlocal
