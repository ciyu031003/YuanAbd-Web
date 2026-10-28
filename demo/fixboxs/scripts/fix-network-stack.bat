@echo off
chcp 65001 >nul
setlocal EnableExtensions
title 修盒子 - 网络连接快速修复

fltmc >nul 2>&1
if errorlevel 1 (
  echo 正在请求管理员权限...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo ============================================================
echo 修盒子 - 网络连接快速修复
echo ============================================================
echo 将执行：
echo   1. 清理 DNS 缓存
echo   2. 重置 Winsock 与 TCP/IP
echo   3. 重新获取 IP 地址
echo.
echo 注意：VPN、代理、静态 IP 或公司网络配置可能需要重新设置。
echo 公司/学校统一管理的电脑请不要运行，先联系 IT。
echo.
choice /C YN /N /M "确认继续？[Y/N] "
if errorlevel 2 goto :cancelled

echo.
echo [1/3] 清理 DNS 缓存...
ipconfig /flushdns

echo.
echo [2/3] 重置网络协议栈...
netsh winsock reset
netsh int ip reset

echo.
echo [3/3] 重新获取 IP 地址...
ipconfig /renew

echo.
echo 网络组件已重置。必须重启 Windows 后才会完全生效。
choice /C YN /N /M "现在重启电脑？[Y/N] "
if errorlevel 2 goto :done
shutdown /r /t 15 /c "修盒子网络修复：15 秒后重启"
echo 已计划在 15 秒后重启。可执行 shutdown /a 取消。
goto :done

:cancelled
echo.
echo 已取消，没有修改任何设置。
goto :end

:done
echo.
echo 修复流程结束。若仍未联网，请回到文章继续按步骤排查。

:end
echo.
pause
endlocal
