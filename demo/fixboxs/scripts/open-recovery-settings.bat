@echo off
chcp 65001 >nul
setlocal EnableExtensions
title 修盒子 - 打开 Windows 恢复环境

fltmc >nul 2>&1
if errorlevel 1 (
  echo 正在请求管理员权限...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo ============================================================
echo 修盒子 - 打开 Windows 恢复环境
echo ============================================================
echo 此脚本只负责重启进入“高级启动”，不会自动执行系统还原或重置。
echo.
echo 请先保存所有文档。电脑将在确认后 20 秒重启。
echo.
reagentc /info
echo.
choice /C YN /N /M "确认重启并进入恢复环境？[Y/N] "
if errorlevel 2 goto :cancelled

echo.
echo 正在安排重启。进入蓝色选项页后选择“疑难解答”或“高级选项”。
shutdown /r /o /t 20 /c "修盒子：进入 Windows 恢复环境"
echo 如需取消，请在当前窗口执行 shutdown /a。
goto :end

:cancelled
echo.
echo 已取消，没有重启电脑。

:end
echo.
pause
endlocal
