@echo off
chcp 65001 >nul
setlocal EnableExtensions
title 修盒子 - 直达路由器管理后台

echo ============================================================
echo 修盒子 - 直达路由器管理后台
echo ============================================================
echo 适用于：路由器后台地址记不住、192.168.1.1 打不开、
echo         或换了新路由器不知道管理地址是多少。
echo.
echo 将读取当前网络的默认网关地址（就是你家路由器的管理地址），
echo 并用浏览器打开它。不会修改任何设置，不会输入任何账号密码。
echo 需要这台电脑当前通过该路由器上网（有线或 Wi-Fi 均可）。
echo.
choice /C YN /N /M "确认打开？[Y/N] "
if errorlevel 2 goto :cancelled

set "GW="
for /f "delims=" %%G in ('powershell -NoProfile -Command "(Get-NetRoute -DestinationPrefix '0.0.0.0/0' -ErrorAction SilentlyContinue | Sort-Object RouteMetric | Select-Object -First 1).NextHop"') do set "GW=%%G"

echo.
echo [1/2] 检测到的默认网关：%GW%
echo %GW% | findstr /r "^[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*$" >nul
if errorlevel 1 (
  echo 没有检测到有效网关地址，改用常见默认地址 192.168.1.1 尝试...
  set "GW=192.168.1.1"
)

echo [2/2] 用浏览器打开 http://%GW% （请使用 http 而不是 https）...
start "" "http://%GW%"

echo.
echo 打不开的话，按正文继续：换无痕窗口 / 关掉本机代理后再试；
echo 或用手机连接同一个 Wi-Fi 访问同一地址，判断是不是这台电脑的问题。
goto :end

:end
echo.
pause
endlocal
