@echo off
chcp 65001 >nul
setlocal EnableExtensions
title 修盒子 - 清理 DNS 缓存

echo ============================================================
echo 修盒子 - 清理 DNS 缓存
echo ============================================================
echo 适用于：网页打不开，但 QQ/微信可用，或刚改过 DNS。
echo 此脚本不会修改 DNS 服务器地址，也不会删除网络配置。
echo.
choice /C YN /N /M "确认继续？[Y/N] "
if errorlevel 2 goto :cancelled

echo.
echo 正在清理 DNS 缓存...
ipconfig /flushdns
if errorlevel 1 (
  echo 清理失败。请右键本文件，选择“以管理员身份运行”后再试。
) else (
  echo.
  echo 完成。请完全关闭浏览器后重新打开网页。
)
goto :end

:cancelled
echo.
echo 已取消，没有修改任何设置。

:end
echo.
pause
endlocal
