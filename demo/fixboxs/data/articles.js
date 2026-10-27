/* 由 build-fix.cjs 生成，请勿手改。源：content/fixboxs/*.md */
window.FX_ARTICLES = [
 {
  "slug": "wifi-connected-but-no-internet",
  "title": "Wi-Fi 显示已连接但无法上网（打不开网页）",
  "domain": "net-basic",
  "domainName": "网络基础",
  "category": "net-connected-noint",
  "categoryName": "连上但上不了网",
  "path": "网络基础 › 连上但上不了网",
  "summary": "「已连接」只说明电脑和路由器握手了，不代表路由器能上网。不要乱试，按物理层 → IP 层 → DNS 层 → 代理层四层各敲一条命令定位，哪层不通就修哪层。",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos",
   "windows",
   "network"
  ],
  "level": "入门",
  "time": "15-45 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "连上wifi上不了网",
   "无Internet访问权限",
   "网络受限",
   "打不开网页",
   "有WiFi没网",
   "显示已连接但无法访问互联网",
   "网页转圈打不开",
   "connected no internet",
   "有信号没网速",
   "微信能用网页打不开"
  ],
  "keywords": [
   "已连接但无法上网",
   "分层定位",
   "默认网关",
   "DNS 解析",
   "代理设置",
   "ipconfig",
   "nslookup",
   "netsh winsock reset"
  ],
  "updated": "2026-10-27",
  "detail_href": "./fix/wifi-connected-but-no-internet.html",
  "kind": "guide",
  "hot": 31
 },
 {
  "slug": "win-blackscreen-cursor",
  "title": "电脑开机黑屏只有鼠标指针，怎么救回来",
  "domain": "win-system",
  "domainName": "Windows 系统与开机",
  "category": "win-boot",
  "categoryName": "开机与引导故障",
  "path": "Windows 系统与开机 › 开机与引导故障",
  "summary": "能看见鼠标说明系统其实已经启动，只是桌面程序 explorer.exe 没起来，或者显卡驱动、最近一次更新出了故障。先按 Ctrl+Alt+Del 打开任务管理器，运行 explorer.ex",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   }
  ],
  "osGroup": [
   "windows"
  ],
  "level": "入门",
  "time": "20-60 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "开机黑屏只有鼠标",
   "黑屏有鼠标能动",
   "登录后黑屏",
   "桌面图标不见",
   "黑屏没有任务栏",
   "black screen with cursor",
   "电脑黑屏只看到箭头",
   "开机后一直黑屏"
  ],
  "keywords": [
   "黑屏只有鼠标指针",
   "explorer.exe 未启动",
   "登录后黑屏",
   "显卡驱动黑屏",
   "资源管理器",
   "black screen cursor",
   "桌面不显示"
  ],
  "updated": "2026-10-27",
  "detail_href": "./fix/win-blackscreen-cursor.html",
  "kind": "guide",
  "hot": 30
 },
 {
  "slug": "ip-conflict-locate-device",
  "title": "IP 地址冲突怎么查是哪台设备",
  "domain": "ip-dns",
  "domainName": "IP 与 DNS",
  "category": "ip-conflict",
  "categoryName": "IP 地址冲突",
  "path": "IP 与 DNS › IP 地址冲突",
  "summary": "IP 冲突=同一个网段里有两台设备用了同一个地址。查法是：先在系统日志确认冲突事件，再用 arp -a 和路由器的 DHCP 客户端列表把人找出来，最后用\"DHCP 保留\"根治。",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos",
   "windows",
   "network"
  ],
  "level": "进阶",
  "time": "20-60 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "IP地址冲突",
   "提示IP冲突",
   "网络时断时续",
   "检测到IP地址冲突",
   "地址已被占用",
   "有的设备能上有的时候不能",
   "another device is using the same IP",
   "Windows 弹出IP地址冲突",
   "上网一会断一会好"
  ],
  "keywords": [
   "IP 冲突",
   "arp -a",
   "事件 ID 4198",
   "DHCP 保留",
   "MAC 地址",
   "Get-NetNeighbor",
   "nbtstat",
   "DHCP 客户端列表"
  ],
  "updated": "2026-10-11",
  "detail_href": "./fix/ip-conflict-locate-device.html",
  "kind": "guide",
  "hot": 29
 },
 {
  "slug": "router-admin-page-unreachable",
  "title": "路由器后台 192.168.1.1 打不开怎么办",
  "domain": "router",
  "domainName": "路由器与家庭网络",
  "category": "rt-login",
  "categoryName": "路由器后台登录",
  "path": "路由器与家庭网络 › 路由器后台登录",
  "summary": "打不开路由器后台，第一位原因不是浏览器坏了，而是地址不对：真正的网段是 192.168.0.1 或路由器被改成了桥接/AP 模式。先查出你电脑真正的默认网关，用它去访问。",
  "os": [
   {
    "t": "通用",
    "k": "windows"
   }
  ],
  "osGroup": [
   "network"
  ],
  "level": "入门",
  "time": "15-45 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "192.168.1.1打不开",
   "进不去路由器",
   "路由器后台打不开",
   "tplogin.cn打不开",
   "管理页面无法访问",
   "登录不了路由器",
   "路由器地址进不去",
   "192.168.0.1打不开",
   "浏览器一直转圈进不去",
   "无法访问此网站"
  ],
  "keywords": [
   "默认网关",
   "管理地址",
   "网段",
   "桥接模式",
   "代理设置",
   "恢复出厂设置",
   "tplogin.cn",
   "路由器标签"
  ],
  "updated": "2026-10-11",
  "detail_href": "./fix/router-admin-page-unreachable.html",
  "kind": "guide",
  "hot": 28
 },
 {
  "slug": "win-bluescreen-read-code",
  "title": "电脑蓝屏了怎么办：先学会读蓝屏代码",
  "domain": "win-system",
  "domainName": "Windows 系统与开机",
  "category": "win-bluescreen",
  "categoryName": "蓝屏与死机",
  "path": "Windows 系统与开机 › 蓝屏与死机",
  "summary": "蓝屏上的那行代码不是给你猜的：停止代码说明哪一类部件出问题，下面的 .sys 文件名往往就是元凶驱动。先拍照记下代码，再去事件查看器确认，然后从「最近装了什么」开始回退。",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   }
  ],
  "osGroup": [
   "windows"
  ],
  "level": "入门",
  "time": "20-60 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "电脑蓝屏",
   "蓝屏重启",
   "蓝屏代码看不懂",
   "你的设备遇到问题需要重启",
   "蓝屏后自动重启",
   "blue screen",
   "电脑蓝屏哭脸",
   "蓝屏错误代码"
  ],
  "keywords": [
   "蓝屏代码",
   "停止代码",
   "stop code",
   "事件查看器 1001",
   "内存检测",
   "小内存转储",
   "驱动导致蓝屏"
  ],
  "updated": "2026-10-11",
  "detail_href": "./fix/win-bluescreen-read-code.html",
  "kind": "guide",
  "hot": 27
 },
 {
  "slug": "home-network-all-offline",
  "title": "家里所有设备都上不了网：先分清是谁的问题",
  "domain": "net-basic",
  "domainName": "网络基础",
  "category": "net-connected-noint",
  "categoryName": "连上但上不了网",
  "path": "网络基础 › 连上但上不了网",
  "summary": "全家断网时，问题几乎都在光猫、路由器或运营商的线路上，跟某台电脑无关。先看两台设备的指示灯，再看路由器里的 WAN/拨号状态，两边都正常才轮到查电脑。",
  "os": [
   {
    "t": "通用",
    "k": "windows"
   }
  ],
  "osGroup": [
   "network"
  ],
  "level": "入门",
  "time": "10-40 分钟",
  "risk": "安全",
  "symptoms": [
   "全家断网",
   "手机也上不了网",
   "wifi连着没网",
   "光猫亮红灯",
   "所有设备都没网",
   "宽带断了",
   "路由器灯不亮",
   "all devices offline",
   "家里网断了",
   "光猫LOS红灯"
  ],
  "keywords": [
   "光猫",
   "ONU",
   "LOS 红灯",
   "PON",
   "PPPoE 拨号",
   "WAN 口",
   "宽带欠费",
   "路由器指示灯"
  ],
  "updated": "2026-10-11",
  "detail_href": "./fix/home-network-all-offline.html",
  "kind": "guide",
  "hot": 26
 },
 {
  "slug": "dns-broken-but-app-works",
  "title": "网页打不开但 QQ / 微信能用：DNS 问题怎么修",
  "domain": "ip-dns",
  "domainName": "IP 与 DNS",
  "category": "ip-dns-fail",
  "categoryName": "DNS 解析",
  "path": "IP 与 DNS › DNS 解析",
  "summary": "\"能 ping 通 IP、却打不开网页\"几乎可以断定是 DNS（域名解析）出了问题。先用 nslookup 验证一次，再清缓存、换 DNS 服务器，两步就能修好大多数情况。",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos",
   "windows",
   "network"
  ],
  "level": "入门",
  "time": "15-40 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "网页打不开但微信能用",
   "QQ能上网页打不开",
   "DNS错误",
   "无法解析域名",
   "有些网站打不开",
   "网页加载很慢",
   "DNS_PROBE_FINISHED",
   "找不到服务器",
   "域名解析失败",
   "部分网站上不去"
  ],
  "keywords": [
   "DNS",
   "nslookup",
   "域名解析",
   "DNS 缓存",
   "安全 DNS",
   "DoH",
   "hosts",
   "223.5.5.5"
  ],
  "updated": "2026-10-27",
  "detail_href": "./fix/dns-broken-but-app-works.html",
  "kind": "guide",
  "hot": 25
 },
 {
  "slug": "win-forgot-password",
  "title": "电脑开机密码忘了 / PIN 突然用不了",
  "domain": "win-system",
  "domainName": "Windows 系统与开机",
  "category": "win-login",
  "categoryName": "登录与密码",
  "path": "Windows 系统与开机 › 登录与密码",
  "summary": "先分清账户类型：微软账户直接去 account.live.com 在线重置密码，本地账户用安全问题或另一个管理员账户改密码。PIN 用不了通常不用慌，点「登录选项」换密码登录后就能重设 PIN",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   }
  ],
  "osGroup": [
   "windows"
  ],
  "level": "入门",
  "time": "20-90 分钟",
  "risk": "有数据风险",
  "symptoms": [
   "开机密码忘了",
   "PIN 用不了",
   "密码错误进不去",
   "忘记PIN",
   "登录界面进不去",
   "forgot windows password",
   "密码提示不正确",
   "PIN 不可用请重试"
  ],
  "keywords": [
   "忘记开机密码",
   "重置PIN",
   "微软账户改密码",
   "本地账户密码",
   "BitLocker 恢复密钥",
   "登录选项",
   "net user 改密码"
  ],
  "updated": "2026-10-27",
  "detail_href": "./fix/win-forgot-password.html",
  "kind": "guide",
  "hot": 24
 },
 {
  "slug": "win-slow-diagnose",
  "title": "电脑越来越卡怎么办：一张表定位是哪里卡",
  "domain": "win-app",
  "domainName": "Windows 软件与性能",
  "category": "win-slow",
  "categoryName": "卡顿与性能",
  "path": "Windows 软件与性能 › 卡顿与性能",
  "summary": "「卡」不是一种病，得先分清卡在哪：先看任务管理器里 CPU、内存、磁盘、网络哪一项长期接近 100%，再按症状对照表定位到具体环节，然后只修那一处，别一上来就重装。",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   }
  ],
  "osGroup": [
   "windows"
  ],
  "level": "入门",
  "time": "20-60 分钟",
  "risk": "安全",
  "symptoms": [
   "电脑越来越卡",
   "电脑很慢",
   "打开程序慢",
   "开机慢",
   "用一会儿就卡",
   "computer slow",
   "鼠标卡顿",
   "电脑反应迟钝"
  ],
  "keywords": [
   "电脑卡顿",
   "任务管理器占用100%",
   "磁盘100%",
   "内存不足",
   "资源监视器",
   "电脑变慢原因",
   "可靠性监视器"
  ],
  "updated": "2026-10-11",
  "detail_href": "./fix/win-slow-diagnose.html",
  "kind": "guide",
  "hot": 23
 },
 {
  "slug": "win-c-drive-full-cleanup",
  "title": "C 盘爆红快满了，怎么安全清理出空间",
  "domain": "win-app",
  "domainName": "Windows 软件与性能",
  "category": "win-storage",
  "categoryName": "磁盘空间",
  "path": "Windows 软件与性能 › 磁盘空间",
  "summary": "C 盘满不要瞎删：先用「设置 → 系统 → 存储」看清是哪一类文件占的空间，再用系统自带的存储感知、磁盘清理（清理系统文件）逐级处理，最后才考虑压缩休眠文件、清理组件存储这类进阶操作。",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   }
  ],
  "osGroup": [
   "windows"
  ],
  "level": "入门",
  "time": "30-90 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "C盘满了",
   "C盘爆红",
   "磁盘空间不足",
   "电脑提示空间不够",
   "C盘越来越小",
   "disk full",
   "只剩几百MB",
   "C盘红了怎么办"
  ],
  "keywords": [
   "C盘清理",
   "清理建议",
   "存储感知",
   "磁盘清理 cleanmgr",
   "清理系统文件",
   "WinSxS 组件清理",
   "hiberfil.sys",
   "Windows.old"
  ],
  "updated": "2026-10-27",
  "detail_href": "./fix/win-c-drive-full-cleanup.html",
  "kind": "guide",
  "hot": 22
 },
 {
  "slug": "wifi-adapter-missing",
  "title": "电脑没有 WLAN 选项 / 网络适配器不见了",
  "domain": "net-basic",
  "domainName": "网络基础",
  "category": "net-adapter",
  "categoryName": "网卡与适配器",
  "path": "网络基础 › 网卡与适配器",
  "summary": "\"没有 WLAN 选项\"通常是三种情况之一：无线开关被关掉（含飞行模式）、驱动被卸载或损坏、网卡被硬件禁用/松动。先确认网卡是\"消失\"还是\"被禁用\"，再决定重装驱动还是送修。",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos",
   "windows",
   "network"
  ],
  "level": "进阶",
  "time": "20-60 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "没有WLAN选项",
   "网络适配器不见了",
   "设备管理器没有无线网卡",
   "wifi图标没了",
   "适配器有黄色感叹号",
   "连不上wifi也没有wifi开关",
   "no wifi adapter",
   "无线网卡消失",
   "以太网也看不见",
   "网络适配器出现感叹号"
  ],
  "keywords": [
   "网络适配器",
   "WLAN",
   "设备管理器",
   "无线网卡驱动",
   "网卡消失",
   "pnputil",
   "Get-PnpDevice",
   "网络重置"
  ],
  "updated": "2026-10-27",
  "detail_href": "./fix/wifi-adapter-missing.html",
  "kind": "guide",
  "hot": 21
 },
 {
  "slug": "proxy-server-not-responding",
  "title": "浏览器提示「代理服务器无响应」怎么修",
  "domain": "proxy-vpn",
  "domainName": "代理与 VPN",
  "category": "px-system",
  "categoryName": "系统代理",
  "path": "代理与 VPN › 系统代理",
  "summary": "九成是本机代理设置里留着一条已经失效的代理地址（装过加速器、抓包工具或公司的代理脚本之后没清干净）；先到「设置 → 网络和 Internet → 代理」把开关关掉试一次，再清 WinHTTP ",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos",
   "windows"
  ],
  "level": "入门",
  "time": "15-40 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "代理服务器无响应",
   "代理服务器没有响应",
   "无法连接到代理服务器",
   "浏览器打不开网页提示代理",
   "proxy server not responding",
   "突然所有网页都上不去",
   "网络代理错误"
  ],
  "keywords": [
   "代理服务器无响应",
   "系统代理",
   "WinHTTP代理",
   "PAC自动配置脚本",
   "netsh winhttp",
   "代理设置残留",
   "proxy server"
  ],
  "updated": "2026-10-27",
  "detail_href": "./fix/proxy-server-not-responding.html",
  "kind": "guide",
  "hot": 20
 },
 {
  "slug": "win-popup-ads-hijack",
  "title": "电脑老是弹广告、浏览器主页被劫持改不回来",
  "domain": "win-app",
  "domainName": "Windows 软件与性能",
  "category": "win-popup",
  "categoryName": "弹窗与主页劫持",
  "path": "Windows 软件与性能 › 弹窗与主页劫持",
  "summary": "先别急着改主页：主页改不回来，通常是某个常驻程序在每次开机时把设置写回去。先用任务管理器或 Process Explorer 定位弹窗是哪个进程弹的，卸载它，最后才处理浏览器主页和搜索设置。",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   }
  ],
  "osGroup": [
   "windows"
  ],
  "level": "进阶",
  "time": "40-120 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "电脑弹广告",
   "浏览器主页被改",
   "主页改不回来",
   "右下角弹窗广告",
   "打开浏览器跳广告页",
   "popup ads",
   "搜索引擎被换掉",
   "桌面多出图标"
  ],
  "keywords": [
   "弹窗广告",
   "主页劫持",
   "浏览器主页被改",
   "hosts 文件",
   "浏览器快捷方式被改",
   "计划任务",
   "Process Explorer 定位弹窗"
  ],
  "updated": "2026-10-11",
  "detail_href": "./fix/win-popup-ads-hijack.html",
  "kind": "guide",
  "hot": 19
 },
 {
  "slug": "mac-fan-noise-overheat",
  "title": "Mac 风扇狂转、机身发烫怎么办",
  "domain": "mac-app",
  "domainName": "macOS 软件与性能",
  "category": "mac-thermal",
  "categoryName": "发热与风扇",
  "path": "macOS 软件与性能 › 发热与风扇",
  "summary": "风扇狂转多半不是硬件坏了：先打开「活动监视器」按 CPU 排序，找出长时间占满处理器的程序，再检查散热环境和后台备份有没有卡住。",
  "os": [
   {
    "t": "macOS 12+",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos"
  ],
  "level": "入门",
  "time": "15-40 分钟",
  "risk": "安全",
  "symptoms": [
   "风扇一直响",
   "风扇狂转",
   "Mac 发烫",
   "机身烫手",
   "风扇声音很大",
   "电脑很热",
   "风扇转个不停",
   "Mac overheating",
   "fan noise",
   "笔记本发热严重"
  ],
  "keywords": [
   "风扇噪音",
   "过热",
   "热节流",
   "kernel_task",
   "活动监视器",
   "SMC",
   "散热",
   "pmset"
  ],
  "updated": "2026-10-11",
  "detail_href": "./fix/mac-fan-noise-overheat.html",
  "kind": "guide",
  "hot": 18
 },
 {
  "slug": "deleted-file-recovery",
  "title": "文件误删了怎么恢复（先做这一步，别写磁盘）",
  "domain": "data-backup",
  "domainName": "数据与备份",
  "category": "db-delete",
  "categoryName": "误删与恢复",
  "path": "数据与备份 › 误删与恢复",
  "summary": "文件刚删掉时数据大概率还在，关键动作是马上停止写入（能关机就关机，至少别下载、别装软件、别存新文件），然后按\"回收站 → 云盘/以前的版本 → 恢复工具\"的顺序找回来。",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos",
   "windows"
  ],
  "level": "入门",
  "time": "20-90 分钟",
  "risk": "有数据风险",
  "symptoms": [
   "文件删了怎么恢复",
   "回收站清空了还能恢复吗",
   "Shift删除的文件能找回来吗",
   "手滑删了文件",
   "误删照片",
   "文件不见了",
   "回收站被清了",
   "删错文件夹"
  ],
  "keywords": [
   "误删文件",
   "回收站清空",
   "Shift+Delete",
   "文件恢复",
   "Windows File Recovery",
   "winfr",
   "卷影副本",
   "以前的版本",
   "时间机器"
  ],
  "updated": "2026-10-11",
  "detail_href": "./fix/deleted-file-recovery.html",
  "kind": "guide",
  "hot": 17
 },
 {
  "slug": "win-stuck-on-boot-logo",
  "title": "电脑开机一直转圈 / 卡在品牌 Logo 进不去系统",
  "domain": "win-system",
  "domainName": "Windows 系统与开机",
  "category": "win-boot",
  "categoryName": "开机与引导故障",
  "path": "Windows 系统与开机 › 开机与引导故障",
  "summary": "卡 Logo 或无限转圈，绝大多数是启动阶段的软件问题：更新没装完、系统文件或启动配置损坏、外接设备与快速启动捣乱。先等够 30 分钟、拔掉外设，再进「自动修复」做启动修复和卸载更新。",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   }
  ],
  "osGroup": [
   "windows"
  ],
  "level": "入门",
  "time": "30-90 分钟",
  "risk": "有数据风险",
  "symptoms": [
   "开机一直转圈",
   "卡在品牌logo",
   "卡在开机画面",
   "转圈进不去系统",
   "开机无限转圈",
   "stuck on boot logo",
   "正在准备自动修复",
   "开机卡很久不进去"
  ],
  "keywords": [
   "开机一直转圈",
   "卡在品牌logo",
   "启动修复",
   "自动修复",
   "winre",
   "bootrec",
   "开机卡死"
  ],
  "updated": "2026-10-27",
  "detail_href": "./fix/win-stuck-on-boot-logo.html",
  "kind": "guide",
  "hot": 16
 },
 {
  "slug": "dhcp-no-ip-169-254",
  "title": "电脑获取不到 IP 地址 / IP 是 169.254 开头",
  "domain": "ip-dns",
  "domainName": "IP 与 DNS",
  "category": "ip-dhcp",
  "categoryName": "DHCP 与获取 IP",
  "path": "IP 与 DNS › DHCP 与获取 IP",
  "summary": "169.254.x.x 是系统在\"没要到 IP\"时给自己随便发的地址，叫 APIPA/链路本地地址，不代表网卡坏了。九成情况是 DHCP 没响应：先重启路由器和本机，再查路由器 DHCP 是否",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos",
   "windows",
   "network"
  ],
  "level": "进阶",
  "time": "20-60 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "IP是169.254开头",
   "获取不到IP地址",
   "169.254开头的地址",
   "没有有效的IP配置",
   "网络未识别的网络",
   "无Internet访问",
   "自动配置IPv4地址",
   "拿不到IP",
   "DHCP失败",
   "一直显示正在识别"
  ],
  "keywords": [
   "APIPA",
   "169.254",
   "DHCP",
   "自动专用 IP 地址",
   "链路本地地址",
   "ipconfig /renew",
   "网络重置",
   "RFC 3927"
  ],
  "updated": "2026-10-27",
  "detail_href": "./fix/dhcp-no-ip-169-254.html",
  "kind": "guide",
  "hot": 15
 },
 {
  "slug": "printer-offline",
  "title": "打印机显示脱机 / 打印没反应怎么修",
  "domain": "peripheral",
  "domainName": "外设",
  "category": "per-printer",
  "categoryName": "打印机",
  "path": "外设 › 打印机",
  "summary": "\"脱机\"九成不是打印机坏了，而是电脑上的打印队列卡死了或者取消了\"脱机使用打印机\"的勾选；先清空队列，再取消脱机状态，最后才考虑重装驱动。",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos",
   "windows"
  ],
  "level": "入门",
  "time": "20-60 分钟",
  "risk": "安全",
  "symptoms": [
   "打印机显示脱机",
   "打印机没反应",
   "打印不了",
   "打印任务卡住",
   "打印机显示离线",
   "点了打印没动静",
   "printer offline",
   "打印机排队不动"
  ],
  "keywords": [
   "打印机脱机",
   "Print Spooler",
   "打印队列",
   "打印后台处理程序",
   "打印任务卡住",
   "网络打印机",
   "打印机驱动"
  ],
  "updated": "2026-10-27",
  "detail_href": "./fix/printer-offline.html",
  "kind": "guide",
  "hot": 14
 },
 {
  "slug": "usb-drive-not-recognized",
  "title": "U 盘 / 移动硬盘不识别、提示格式化怎么办",
  "domain": "peripheral",
  "domainName": "外设",
  "category": "per-usb",
  "categoryName": "U 盘与移动硬盘",
  "path": "外设 › U 盘与移动硬盘",
  "summary": "\"需要格式化才能使用\"通常是文件系统损坏或分区表异常，盘里的数据多数还在；先停止写入、换口换机确认，然后立刻把能读到的数据拷出来，最后才考虑修复文件系统。",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos",
   "windows"
  ],
  "level": "进阶",
  "time": "20-90 分钟",
  "risk": "有数据风险",
  "symptoms": [
   "U盘打不开",
   "提示格式化",
   "移动硬盘识别不到",
   "U盘写保护",
   "U盘无法访问",
   "需要格式化才能使用",
   "优盘不识别",
   "移动硬盘灯亮但不认盘"
  ],
  "keywords": [
   "U盘不识别",
   "提示格式化",
   "RAW分区",
   "盘符丢失",
   "写保护",
   "chkdsk",
   "磁盘管理",
   "数据恢复"
  ],
  "updated": "2026-10-27",
  "detail_href": "./fix/usb-drive-not-recognized.html",
  "kind": "guide",
  "hot": 13
 },
 {
  "slug": "win-app-crash-missing-dll",
  "title": "软件打不开、闪退，提示缺少 dll 或 0xc000007b",
  "domain": "win-app",
  "domainName": "Windows 软件与性能",
  "category": "win-app-crash",
  "categoryName": "软件打不开与闪退",
  "path": "Windows 软件与性能 › 软件打不开与闪退",
  "summary": "「缺少 dll」和 0xc000007b 九成是运行库没装齐或位数不匹配，不是系统坏了。先重装出问题的软件、装齐 Visual C++ 运行库和 DirectX 旧版组件，最后才修系统文件。",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   }
  ],
  "osGroup": [
   "windows"
  ],
  "level": "进阶",
  "time": "30-90 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "软件打不开",
   "软件闪退",
   "缺少dll",
   "0xc000007b",
   "应用程序无法正常启动",
   "missing dll",
   "提示找不到dll文件",
   "游戏闪退"
  ],
  "keywords": [
   "缺少dll",
   "0xc000007b",
   "VC++ 运行库",
   "DirectX 运行库",
   ".NET Framework",
   "依赖查看",
   "闪退"
  ],
  "updated": "2026-10-27",
  "detail_href": "./fix/win-app-crash-missing-dll.html",
  "kind": "guide",
  "hot": 12
 },
 {
  "slug": "wifi-ssid-not-found",
  "title": "Wi-Fi 列表里找不到自家网络怎么办",
  "domain": "net-basic",
  "domainName": "网络基础",
  "category": "net-nowifi",
  "categoryName": "Wi-Fi 连不上",
  "path": "网络基础 › Wi-Fi 连不上",
  "summary": "先分清是\"只有这台电脑搜不到\"还是\"所有设备都搜不到\"：只有一台 → 是电脑的网卡/驱动问题；全都搜不到 → 去路由器那边看，多半是 Wi-Fi 被关了、名字被隐藏或路由器没工作。",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos",
   "windows",
   "network"
  ],
  "level": "入门",
  "time": "10-30 分钟",
  "risk": "安全",
  "symptoms": [
   "搜不到wifi",
   "找不到自家网络",
   "wifi列表里没有我家网络",
   "路由器隐藏了SSID",
   "5G信号搜不到",
   "wifi名字不见了",
   "手机能搜到电脑搜不到",
   "can't find my wifi network",
   "SSID not showing",
   "搜不到路由器信号"
  ],
  "keywords": [
   "SSID",
   "隐藏网络",
   "无线信道",
   "5GHz",
   "2.4GHz",
   "无线网卡驱动",
   "netsh wlan show networks",
   "无线诊断"
  ],
  "updated": "2026-10-27",
  "detail_href": "./fix/wifi-ssid-not-found.html",
  "kind": "guide",
  "hot": 11
 },
 {
  "slug": "malware-first-response",
  "title": "电脑中病毒了怎么办：先做这三件事再杀毒",
  "domain": "account-sec",
  "domainName": "账号与安全",
  "category": "as-malware",
  "categoryName": "恶意软件",
  "path": "账号与安全 › 恶意软件",
  "summary": "先断网、再备份重要文件、然后用 Microsoft Defender 的\"脱机扫描\"做深度查杀——顺序反了（先杀毒后又联网、或边杀毒边用网银）都可能造成不可挽回的损失。",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos",
   "windows"
  ],
  "level": "入门",
  "time": "60-240 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "电脑中病毒了怎么办",
   "电脑中毒",
   "电脑变慢中毒",
   "弹出奇怪的窗口",
   "电脑被控制",
   "木马",
   "杀毒",
   "浏览器被劫持"
  ],
  "keywords": [
   "中病毒",
   "木马",
   "恶意软件",
   "Microsoft Defender",
   "脱机扫描",
   "断网",
   "备份",
   "账号密码",
   "安全模式"
  ],
  "updated": "2026-10-11",
  "detail_href": "./fix/malware-first-response.html",
  "kind": "guide",
  "hot": 10
 },
 {
  "slug": "router-wifi-leech-check",
  "title": "怎么查谁在蹭网 / 给设备限速与拉黑",
  "domain": "router",
  "domainName": "路由器与家庭网络",
  "category": "rt-qos",
  "categoryName": "蹭网与限速",
  "path": "路由器与家庭网络 › 蹭网与限速",
  "summary": "网速被占多半是\"自家设备认不出来\"，先在路由器后台的客户端列表逐台核对；确认有陌生设备，再改 Wi-Fi 密码 + 开访客网络，最后才考虑 MAC 过滤和限速。",
  "os": [
   {
    "t": "通用",
    "k": "windows"
   }
  ],
  "osGroup": [
   "network"
  ],
  "level": "进阶",
  "time": "20-60 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "怎么查看谁在蹭网",
   "WiFi被蹭",
   "陌生设备",
   "网速被人占了",
   "我家wifi有人偷用",
   "路由器客户端列表",
   "有人蹭网络速变慢",
   "给设备限速"
  ],
  "keywords": [
   "蹭网",
   "陌生设备",
   "DHCP客户端列表",
   "MAC地址过滤",
   "QoS限速",
   "访客网络",
   "WPS",
   "router-qos"
  ],
  "updated": "2026-10-11",
  "detail_href": "./fix/router-wifi-leech-check.html",
  "kind": "guide",
  "hot": 9
 },
 {
  "slug": "win-update-stuck",
  "title": "Windows 更新卡在 0% / 一直失败，怎么强制修好",
  "domain": "win-system",
  "domainName": "Windows 系统与开机",
  "category": "win-update",
  "categoryName": "系统更新",
  "path": "Windows 系统与开机 › 系统更新",
  "summary": "更新卡住基本逃不出四类原因：磁盘空间不足、组件存储损坏、第三方杀软拦截、网络或代理干扰。先看错误码和剩余空间，再用 DISM /RestoreHealth 修组件存储、然后跑 sfc /sca",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   }
  ],
  "osGroup": [
   "windows"
  ],
  "level": "进阶",
  "time": "40-120 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "更新卡在0%",
   "更新一直失败",
   "正在配置更新卡住",
   "更新错误码",
   "检查更新卡住",
   "windows update stuck",
   "更新下载不动",
   "更新装到一半失败"
  ],
  "keywords": [
   "Windows更新卡住",
   "更新错误代码",
   "DISM RestoreHealth",
   "sfc scannow",
   "SoftwareDistribution",
   "组件存储损坏",
   "更新疑难解答"
  ],
  "updated": "2026-10-27",
  "detail_href": "./fix/win-update-stuck.html",
  "kind": "guide",
  "hot": 8
 },
 {
  "slug": "mac-storage-system-data",
  "title": "Mac 储存空间不足 /「系统数据」占了上百 G",
  "domain": "mac-app",
  "domainName": "macOS 软件与性能",
  "category": "mac-disk-space",
  "categoryName": "储存空间",
  "path": "macOS 软件与性能 › 储存空间",
  "summary": "「系统数据」不是病毒也不是系统垃圾，它大多是缓存、日志、时间机器本地快照和 iPhone 备份。先删本地快照和缓存，再按体积找大文件，动手前一定先备份。",
  "os": [
   {
    "t": "macOS 12+",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos"
  ],
  "level": "进阶",
  "time": "30-90 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "系统数据占了一百多G",
   "储存空间不足",
   "磁盘快满了",
   "其他占了很大空间",
   "Mac 空间不够",
   "删了文件空间没变",
   "系统数据越来越大",
   "Mac storage full",
   "system data huge",
   "启动磁盘几乎已满"
  ],
  "keywords": [
   "系统数据",
   "System Data",
   "储存空间",
   "本地快照",
   "时间机器",
   "缓存",
   "可清除空间",
   "tmutil"
  ],
  "updated": "2026-10-11",
  "detail_href": "./fix/mac-storage-system-data.html",
  "kind": "guide",
  "hot": 7
 },
 {
  "slug": "disk-clicking-failure",
  "title": "硬盘咔咔响 / 电脑识别不到硬盘，是不是要坏了",
  "domain": "hardware",
  "domainName": "硬件与主机",
  "category": "hw-disk",
  "categoryName": "硬盘与存储",
  "path": "硬件与主机 › 硬盘与存储",
  "summary": "规律性的咔咔/哒哒/刮擦声，基本可以判定机械硬盘已经出现物理故障；此时第一件事是断电并把重要数据备份到别的盘，而不是运行检测或修复——修复工具在坏盘上只会加重损伤。",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos",
   "windows"
  ],
  "level": "进阶",
  "time": "30-120 分钟",
  "risk": "有数据风险",
  "symptoms": [
   "硬盘咔咔响",
   "电脑识别不到硬盘",
   "硬盘异响",
   "硬盘坏道",
   "固态掉盘",
   "SMART警告",
   "电脑卡顿磁盘100%",
   "移动硬盘咔哒声"
  ],
  "keywords": [
   "硬盘异响",
   "咔咔声",
   "SMART",
   "重映射扇区",
   "待定扇区",
   "CrystalDiskInfo",
   "掉盘",
   "坏道",
   "固态掉盘"
  ],
  "updated": "2026-10-11",
  "detail_href": "./fix/disk-clicking-failure.html",
  "kind": "guide",
  "hot": 6
 },
 {
  "slug": "monitor-no-signal",
  "title": "显示器无信号 / 分辨率不对 / 外接屏不亮",
  "domain": "peripheral",
  "domainName": "外设",
  "category": "per-display",
  "categoryName": "显示器",
  "path": "外设 › 显示器",
  "summary": "八成是显示器的输入源选错了（线插在 HDMI1，显示器却停在 HDMI2/USB-C），或者线材/接口接触不良；先按显示器上的 Source/Input 键切换到正确输入源，再换线换口交叉验证",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos",
   "windows"
  ],
  "level": "入门",
  "time": "15-45 分钟",
  "risk": "安全",
  "symptoms": [
   "显示器无信号",
   "显示器黑屏",
   "外接显示器不亮",
   "分辨率不对",
   "投屏没反应",
   "no signal",
   "显示器显示无信号输入",
   "屏幕显示超出范围"
  ],
  "keywords": [
   "显示器无信号",
   "输入源",
   "HDMI",
   "DisplayPort",
   "扩展屏",
   "分辨率",
   "刷新率",
   "显示设置",
   "多显示器"
  ],
  "updated": "2026-10-11",
  "detail_href": "./fix/monitor-no-signal.html",
  "kind": "guide",
  "hot": 5
 },
 {
  "slug": "win-startup-apps-disable",
  "title": "开机太慢：关掉这些开机自启软件",
  "domain": "win-app",
  "domainName": "Windows 软件与性能",
  "category": "win-startup",
  "categoryName": "开机启动",
  "path": "Windows 软件与性能 › 开机启动",
  "summary": "开机慢八成是自启动程序太多：聊天工具、网盘、游戏平台、厂商更新器都会抢开机时间。打开任务管理器的「启动」标签，把标「高」影响的非必要项全部禁用，通常能快一半。",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   }
  ],
  "osGroup": [
   "windows"
  ],
  "level": "入门",
  "time": "10-30 分钟",
  "risk": "安全",
  "symptoms": [
   "开机太慢",
   "开机要很久",
   "开机启动软件太多",
   "进桌面后卡半天",
   "开机自启怎么关",
   "slow startup",
   "右下角一堆图标",
   "开机后硬盘狂转"
  ],
  "keywords": [
   "开机启动项",
   "启动应用",
   "任务管理器启动",
   "启动影响",
   "shell startup",
   "Autoruns",
   "计划任务开机启动"
  ],
  "updated": "2026-10-11",
  "detail_href": "./fix/win-startup-apps-disable.html",
  "kind": "guide",
  "hot": 4
 },
 {
  "slug": "remote-control-scam",
  "title": "有人让我下载软件并远程控制电脑，是诈骗吗",
  "domain": "account-sec",
  "domainName": "账号与安全",
  "category": "as-phishing",
  "categoryName": "诈骗识别",
  "path": "账号与安全 › 诈骗识别",
  "summary": "只要有陌生人主动联系你、说你电脑有问题、要你装软件让他\"远程看一下\"，一律按诈骗处理——正规厂商客服永远不会主动打电话让你安装远程控制软件或共享屏幕。",
  "os": [
   {
    "t": "通用",
    "k": "windows"
   }
  ],
  "osGroup": [],
  "level": "入门",
  "time": "10-30 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "客服让我远程控制",
   "远程协助诈骗",
   "让我下载向日葵",
   "共享屏幕诈骗",
   "假客服",
   "说我电脑有病毒要远程看看",
   "有人要我装TeamViewer",
   "远程控制我电脑"
  ],
  "keywords": [
   "远程控制",
   "远程协助",
   "诈骗",
   "假客服",
   "共享屏幕",
   "验证码",
   "96110",
   "国家反诈中心",
   "报警"
  ],
  "updated": "2026-10-11",
  "detail_href": "./fix/remote-control-scam.html",
  "kind": "guide",
  "hot": 3
 },
 {
  "slug": "proxy-tool-broke-network",
  "title": "装了抓包/加速工具后全网断网怎么恢复",
  "domain": "proxy-vpn",
  "domainName": "代理与 VPN",
  "category": "px-capture",
  "categoryName": "抓包与加速工具冲突",
  "path": "代理与 VPN › 抓包与加速工具冲突",
  "summary": "这类工具会装一块虚拟网卡（TAP/TUN/WinTun）并改写默认路由、DNS 和系统代理，卸载只删了程序、没删这些改动；按\"卸软件 → 删虚拟网卡 → 清代理 → 修 DNS → 清路由表 ",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos",
   "windows"
  ],
  "level": "进阶",
  "time": "30-90 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "装完加速器上不了网",
   "虚拟网卡怎么删除",
   "抓包软件装上就断网",
   "Wireshark装完没网",
   "TAP网卡残留",
   "卸载了还是断网",
   "网络重置"
  ],
  "keywords": [
   "TAP虚拟网卡",
   "TUN",
   "WinTun",
   "虚拟网卡残留",
   "系统代理未清除",
   "DNS被改",
   "路由表被劫持",
   "netsh winsock reset",
   "网络重置"
  ],
  "updated": "2026-10-27",
  "detail_href": "./fix/proxy-tool-broke-network.html",
  "kind": "guide",
  "hot": 2
 },
 {
  "slug": "backup-before-repair",
  "title": "换硬盘 / 重装系统前，怎么把数据备份全",
  "domain": "data-backup",
  "domainName": "数据与备份",
  "category": "db-backup",
  "categoryName": "备份与迁移",
  "path": "数据与备份 › 备份与迁移",
  "summary": "备份的本质是复制 + 验证：把「文档、桌面、图片、下载、浏览器书签、微信聊天记录、软件配置」这七类东西拷到外置盘，再随机打开 5 个文件确认能读。别指望「我记得都存网盘了」——验证过才算备份。",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos",
   "windows"
  ],
  "level": "入门",
  "time": "30-120 分钟",
  "risk": "安全",
  "symptoms": [
   "换硬盘前备份",
   "重装系统要备份什么",
   "电脑数据备份",
   "迁移系统到新硬盘",
   "送修前备份",
   "备份清单"
  ],
  "keywords": [
   "备份",
   "时间机器",
   "文件历史记录",
   "系统镜像",
   "EaseUS",
   "增量备份",
   "321原则",
   "迁移"
  ],
  "updated": "2026-10-24",
  "detail_href": "./fix/backup-before-repair.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "bluetooth-device-not-pairing",
  "title": "蓝牙耳机 / 键鼠连不上、一直配对失败怎么修",
  "domain": "peripheral",
  "domainName": "外设",
  "category": "per-bt",
  "categoryName": "蓝牙与键鼠",
  "path": "外设 › 蓝牙与键鼠",
  "summary": "蓝牙配对失败，八成出在「设备还连着别人 / 系统蓝牙服务假死 / 驱动抽风」：先把设备从旧设备上断开（手机）并放进充电盒重置，再重启电脑的蓝牙服务，最后才动驱动。顺序对了基本都是小问题。",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos",
   "windows"
  ],
  "level": "入门",
  "time": "5-30 分钟",
  "risk": "安全",
  "symptoms": [
   "蓝牙耳机连不上",
   "蓝牙配对失败",
   "蓝牙搜不到设备",
   "蓝牙鼠标卡顿",
   "蓝牙键盘不响应",
   "蓝牙开关不见了",
   "已配对但连不上"
  ],
  "keywords": [
   "蓝牙配对",
   "蓝牙驱动",
   "蓝牙服务",
   "支持流",
   "pairing",
   "蓝牙适配器",
   "2.4G 干扰"
  ],
  "updated": "2026-10-27",
  "detail_href": "./fix/bluetooth-device-not-pairing.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "browser-proxy",
  "title": "浏览器打不开网页但其他应用正常？浏览器代理与 PAC 设置修复",
  "domain": "proxy-vpn",
  "domainName": "代理与 VPN",
  "category": "px-system",
  "categoryName": "系统代理",
  "path": "代理与 VPN › 系统代理",
  "summary": "「微信能用、浏览器不能用」说明网络是通的，锅在浏览器的代理路径上：要么系统代理指向了一个已经死掉的代理端口，要么某个代理插件接管了请求。把浏览器代理改回「使用系统代理设置」或「不使用代理」，九",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos",
   "windows"
  ],
  "level": "入门",
  "time": "5-25 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "浏览器打不开网页",
   "网页打不开但微信能用",
   "ERR_PROXY_CONNECTION_FAILED",
   "ERR_TUNNEL_CONNECTION_FAILED",
   "浏览器代理设置",
   "PAC 脚本错误",
   "浏览器走了代理"
  ],
  "keywords": [
   "浏览器代理",
   "PAC",
   "ERR_PROXY_CONNECTION_FAILED",
   "SwitchyOmega",
   "系统代理",
   "浏览器插件代理"
  ],
  "updated": "2026-10-27",
  "detail_href": "./fix/browser-proxy.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "dns-hijack",
  "title": "DNS 被劫持怎么判断：打开网页要等很久 / 被插广告的根治方法",
  "domain": "ip-dns",
  "domainName": "IP 与 DNS",
  "category": "ip-dns-fail",
  "categoryName": "DNS 解析",
  "path": "IP 与 DNS › DNS 解析",
  "summary": "DNS 劫持 = 你问路（域名解析），指路的人（DNS 服务器）被收买了——给你指到广告页、钓鱼站，或故意绕远路让你觉得慢。判断三板斧：ping 一个不存在的域名（居然能「解析成功」= 劫持实",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   },
   {
    "t": "路由器",
    "k": "router"
   }
  ],
  "osGroup": [
   "macos",
   "windows",
   "network"
  ],
  "level": "进阶",
  "time": "15-60 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "DNS 劫持",
   "打开网页很慢",
   "网页被插广告",
   "跳转到别的网站",
   "域名解析错误",
   "输入网址打开的是别的页",
   "DNS 被改",
   "解析不到正确 IP"
  ],
  "keywords": [
   "DNS 劫持",
   "DNS 污染",
   "域名解析",
   "公共 DNS",
   "223.5.5.5",
   "路由器 DNS 被改",
   "nslookup",
   "DoH",
   "运营商劫持"
  ],
  "updated": "2026-10-25",
  "detail_href": "./fix/dns-hijack.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "driver-install-rollback",
  "title": "驱动装错出问题？安装与回退的正确姿势（从哪下、怎么退）",
  "domain": "win-system",
  "domainName": "Windows 系统与开机",
  "category": "win-driver",
  "categoryName": "驱动与设备",
  "path": "Windows 系统与开机 › 驱动与设备",
  "summary": "驱动的正确姿势一句话：「官网下、对型号、能回退」。装错了别慌——设备管理器里每个设备都有「回退驱动程序」按钮（灰的就说明没装过第二版，改用系统还原）；「更新驱动后蓝屏/花屏/没声音」这类病例，",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   }
  ],
  "osGroup": [
   "windows"
  ],
  "level": "入门",
  "time": "10-40 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "驱动装错了",
   "更新驱动后出问题",
   "怎么回退驱动",
   "驱动从哪里下载",
   "驱动人生 驱动精灵 该不该用",
   "显卡驱动回退",
   "网卡驱动安装",
   "驱动冲突"
  ],
  "keywords": [
   "驱动安装",
   "回退驱动程序",
   "设备管理器",
   "厂商官网",
   "Windows Update 驱动",
   "显卡驱动",
   "DDU",
   "OEM 驱动",
   "第三方驱动工具"
  ],
  "updated": "2026-10-25",
  "detail_href": "./fix/driver-install-rollback.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "enterprise-proxy",
  "title": "公司电脑上不了网 / 提示证书不受信任？企业代理环境排查",
  "domain": "proxy-vpn",
  "domainName": "代理与 VPN",
  "category": "px-system",
  "categoryName": "系统代理",
  "path": "代理与 VPN › 系统代理",
  "summary": "公司电脑「上不了网」的四大来源：上网认证掉线、代理/PAC 配置错误、自装工具抢了代理、证书不被信任。判断口诀：内网网站能开 = 网络是通的，问题在代理/认证层；这时先还原自己装过的工具改过的",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos",
   "windows"
  ],
  "level": "进阶",
  "time": "15-60 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "公司电脑上不了网",
   "提示证书不受信任",
   "内网打得开外网打不开",
   "办公网断网",
   "企业代理",
   "上网认证页面弹不出",
   "代理服务器拒绝连接"
  ],
  "keywords": [
   "企业代理",
   "内网上不了外网",
   "PAC",
   "证书不受信任",
   "上网行为管理",
   "Deep packet inspection",
   "办公网络",
   "802.1X"
  ],
  "updated": "2026-10-25",
  "detail_href": "./fix/enterprise-proxy.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "ethernet-no-link",
  "title": "网线插着却提示「网络电缆被拔出」怎么修",
  "domain": "net-basic",
  "domainName": "网络基础",
  "category": "net-adapter",
  "categoryName": "网卡与适配器",
  "path": "网络基础 › 网卡与适配器",
  "summary": "「电缆被拔出」是网卡在说「我在物理层没看到对端」，所以先查物理层：网口指示灯亮不亮。灯不亮九成是网线/水晶头/对端口的问题；灯亮却报错才是系统层（驱动、节能选项、网络栈），按「换线换口 → 重",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   }
  ],
  "osGroup": [
   "windows",
   "network"
  ],
  "level": "入门",
  "time": "10-40 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "网络电缆被拔出",
   "网线插着没反应",
   "以太网未连接",
   "网口灯不亮",
   "有线网络断了",
   "网线接触不良",
   "ethernet cable unplugged",
   "插网线没网"
  ],
  "keywords": [
   "网络电缆被拔出",
   "以太网",
   "网卡驱动",
   "网线",
   "网口",
   "Energy Efficient Ethernet",
   "网络重置",
   "链路指示灯"
  ],
  "updated": "2026-10-25",
  "detail_href": "./fix/ethernet-no-link.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "format-partition-recovery",
  "title": "格式化后 / 分区不见了，数据还能救回来吗",
  "domain": "data-backup",
  "domainName": "数据与备份",
  "category": "db-delete",
  "categoryName": "误删与恢复",
  "path": "数据与备份 › 误删与恢复",
  "summary": "快速格式化只是撕掉了图书馆的目录卡，书还在书架上——只要没被新数据覆盖，专业软件（DiskGenius 等）扫一遍大多能找回。分区不见（盘符消失/变未分配）多数是分区表损坏，用「搜索已丢失分区",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   }
  ],
  "osGroup": [
   "windows"
  ],
  "level": "进阶",
  "time": "30-180 分钟",
  "risk": "有数据风险",
  "symptoms": [
   "格式化后数据恢复",
   "误格式化了",
   "分区不见了",
   "盘符消失",
   "未分配空间",
   "重装系统格式化错了盘",
   "U 盘提示格式化点了确定",
   "快速格式化"
  ],
  "keywords": [
   "格式化恢复",
   "误格式化",
   "分区丢失",
   "DiskGenius",
   "恢复分区表",
   "快速格式化",
   "数据恢复",
   "原始恢复",
   "恢复概率"
  ],
  "updated": "2026-10-25",
  "detail_href": "./fix/format-partition-recovery.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "icloud-storage-full",
  "title": "iCloud 储存空间不足怎么办：先看谁在吃空间，再决定清还是升",
  "domain": "mac-app",
  "domainName": "macOS 软件与性能",
  "category": "mac-disk-space",
  "categoryName": "储存空间",
  "path": "macOS 软件与性能 › 储存空间",
  "summary": "iCloud 空间不足只有三条路：清掉占大头的旧备份/废文件、把「优化储存」打开让大文件留在云端、或者升级/共享套餐。先打开「管理储存空间」看清楚是照片、备份还是微信数据在吃空间，再做决定——",
  "os": [
   {
    "t": "macOS 13+",
    "k": "macos"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   },
   {
    "t": "iPhone / iPad",
    "k": "windows"
   }
  ],
  "osGroup": [
   "macos"
  ],
  "level": "入门",
  "time": "10-30 分钟",
  "risk": "安全",
  "symptoms": [
   "iCloud 空间不足",
   "iCloud 储存空间已满",
   "提示无法备份",
   "照片不上传",
   "iPhone 储存空间已满提醒",
   "icloud full"
  ],
  "keywords": [
   "iCloud 空间不足",
   "管理储存空间",
   "iCloud 照片",
   "备份失败",
   "降级方案",
   "5GB 免费",
   "家人共享"
  ],
  "updated": "2026-10-24",
  "detail_href": "./fix/icloud-storage-full.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "laptop-battery-not-charging",
  "title": "笔记本插着电却提示「未充电」/ 电量 0% 怎么修",
  "domain": "hardware",
  "domainName": "硬件与主机",
  "category": "hw-battery",
  "categoryName": "电池与充电",
  "path": "硬件与主机 › 电池与充电",
  "summary": "「电源已接通，未充电」的四大来源：主板静电锁死、充电阈值设置、适配器/接口问题、电池驱动异常——前三个五分钟内能解决，真正「电池坏了」排最后。戴尔/惠普/联想官方都把「硬重置放静电」列为第一步",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   },
   {
    "t": "硬件无关",
    "k": "windows"
   }
  ],
  "osGroup": [
   "macos",
   "windows"
  ],
  "level": "入门",
  "time": "15-60 分钟",
  "risk": "安全",
  "symptoms": [
   "电池未充电",
   "电源已接通未充电",
   "电量 0% 充不进去",
   "电池不蓄电",
   "拔电源就关机",
   "充电指示灯不亮",
   "battery not charging",
   "电池老化"
  ],
  "keywords": [
   "电池不充电",
   "电源适配器",
   "硬重置",
   "放静电",
   "电池驱动",
   "BIOS 电池检查",
   "电池健康",
   "充电阈值"
  ],
  "updated": "2026-10-25",
  "detail_href": "./fix/laptop-battery-not-charging.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "leak-check",
  "title": "担心密码泄露？账号泄露自查与止损清单",
  "domain": "account-sec",
  "domainName": "账号与安全",
  "category": "as-leak",
  "categoryName": "泄露与止损",
  "path": "账号与安全 › 泄露与止损",
  "summary": "密码泄露的应对顺序是：先改「一个密码顶十个」的关键账号 → 再查泄露范围 → 最后逐个处理复用密码。邮箱是所有账号的「万能钥匙」（找回密码都走它），所以第一个要改的永远是邮箱密码；然后开双重认",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   },
   {
    "t": "手机也适用",
    "k": "windows"
   }
  ],
  "osGroup": [
   "macos",
   "windows"
  ],
  "level": "入门",
  "time": "15-45 分钟",
  "risk": "安全",
  "symptoms": [
   "密码泄露",
   "收到异地登录提醒",
   "账号被盗",
   "数据泄露查询",
   "密码被撞库",
   "改密码来得及吗",
   "邮箱泄露"
  ],
  "keywords": [
   "泄露自查",
   "撞库",
   "Have I Been Pwned",
   "双重认证",
   "密码管理器",
   "异地登录",
   "止损"
  ],
  "updated": "2026-10-25",
  "detail_href": "./fix/leak-check.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "mac-battery-health",
  "title": "Mac 电池健康怎么看：循环次数、续航变差与「建议维修」",
  "domain": "mac-app",
  "domainName": "macOS 软件与性能",
  "category": "mac-battery",
  "categoryName": "电池与续航",
  "path": "macOS 软件与性能 › 电池与续航",
  "summary": "Mac 电池的判断标准只有两个数：循环次数和电池健康状态。Apple 官方口径是循环 1000 次后仍保留最多 80% 容量——低于这个表现或系统提示「建议维修」就该换电池了。续航变差先区分「",
  "os": [
   {
    "t": "macOS 13+",
    "k": "macos"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   },
   {
    "t": "macOS 11",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos"
  ],
  "level": "入门",
  "time": "5-30 分钟",
  "risk": "安全",
  "symptoms": [
   "Mac 电池健康",
   "循环次数",
   "Mac 续航变差",
   "建议维修",
   "电池鼓包",
   "Mac 掉电快",
   "电池百分比不准",
   "优化电池充电"
  ],
  "keywords": [
   "Mac 电池",
   "循环次数",
   "电池健康",
   "建议维修",
   "优化电池充电",
   "充电上限",
   "续航",
   "system_profiler"
  ],
  "updated": "2026-10-27",
  "detail_href": "./fix/mac-battery-health.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "mac-forgot-password",
  "title": "Mac 忘记开机密码怎么办（Apple Silicon / Intel 都覆盖）",
  "domain": "mac-system",
  "domainName": "macOS 系统与开机",
  "category": "mac-login",
  "categoryName": "登录与密码",
  "path": "macOS 系统与开机 › 登录与密码",
  "summary": "macOS 自带密码重置：在登录窗口按提示尝试「使用 Apple 账户重置」，具体入口取决于系统版本、账户类型和 FileVault 状态；Apple Silicon 机器还可以在恢复模式里运",
  "os": [
   {
    "t": "macOS 13+",
    "k": "macos"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   },
   {
    "t": "macOS 11",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos"
  ],
  "level": "入门",
  "time": "10-40 分钟",
  "risk": "有数据风险",
  "symptoms": [
   "Mac 忘记密码",
   "MacBook 密码不对",
   "苹果电脑登录密码忘了",
   "Mac 开机密码错误",
   "FileVault 密码丢失",
   "Mac 登录不上"
  ],
  "keywords": [
   "Mac 忘记密码",
   "重置密码",
   "Apple 账户重置",
   "恢复模式重置",
   "FileVault",
   "Reset Password Assistant",
   "登录钥匙串"
  ],
  "updated": "2026-10-27",
  "detail_href": "./fix/mac-forgot-password.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "mac-time-machine-troubleshoot",
  "title": "时间机器备份卡住 / 失败怎么修（含备份盘满了怎么办）",
  "domain": "data-backup",
  "domainName": "数据与备份",
  "category": "db-backup",
  "categoryName": "备份与迁移",
  "path": "数据与备份 › 备份与迁移",
  "summary": "时间机器卡住/失败的四大惯犯按概率排：磁盘连接/格式问题、磁盘空间满、磁盘需要「急救」、首次备份本来就慢（几百 GB 走 USB 需要数小时到一晚，卡在「正在准备备份」几小时往往是正常的）。按",
  "os": [
   {
    "t": "macOS 13+",
    "k": "macos"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   },
   {
    "t": "macOS 11",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos"
  ],
  "level": "入门",
  "time": "15-60 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "时间机器备份卡住",
   "时间机器备份失败",
   "备份盘已满",
   "时间机器很慢",
   "备份进行中不动了",
   "找不到备份磁盘",
   "时间机器报错",
   "备份磁盘只读"
  ],
  "keywords": [
   "时间机器",
   "Time Machine",
   "备份失败",
   "备份卡住",
   "磁盘已满",
   "磁盘工具急救",
   "tmutil",
   "备份磁盘",
   "APFS"
  ],
  "updated": "2026-10-25",
  "detail_href": "./fix/mac-time-machine-troubleshoot.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "mac-wifi-keeps-dropping",
  "title": "Mac 的 Wi-Fi 反复断连 / 自己关掉怎么修",
  "domain": "mac-system",
  "domainName": "macOS 系统与开机",
  "category": "mac-network",
  "categoryName": "Wi-Fi 与网络",
  "path": "macOS 系统与开机 › Wi-Fi 与网络",
  "summary": "Mac Wi-Fi 断连先分清「只有 Mac 断还是「全家都断」：手机同网正常 → 问题在 Mac 这边，走「忘记网络重连 → 新建网络位置 → 关 VPN/代理干扰 → 无线诊断」；全家都断",
  "os": [
   {
    "t": "macOS 13+",
    "k": "macos"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   },
   {
    "t": "macOS 11",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos"
  ],
  "level": "入门",
  "time": "10-45 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "Mac Wi-Fi 反复断开",
   "MacBook Wi-Fi 自动关闭",
   "Mac 上网时断时续",
   "Wi-Fi 图案打叉",
   "Mac 连不上 Wi-Fi",
   "自分配 IP",
   "Mac 网络很慢",
   "wifi 断流"
  ],
  "keywords": [
   "Mac Wi-Fi 断连",
   "无线诊断",
   "自分配 IP",
   "新建网络位置",
   "DNS",
   "VPN 冲突",
   "SMC",
   "无线漫游"
  ],
  "updated": "2026-10-25",
  "detail_href": "./fix/mac-wifi-keeps-dropping.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "mac-wont-boot",
  "title": "Mac 开不了机 / 卡在苹果标志怎么办",
  "domain": "mac-system",
  "domainName": "macOS 系统与开机",
  "category": "mac-boot",
  "categoryName": "开机与恢复模式",
  "path": "macOS 系统与开机 › 开机与恢复模式",
  "summary": "Mac 开不了机，九成是「没电 / 外接设备捣乱 / 系统卷挂载异常」三类，真正的主板故障很少。先强制重启一次，再进安全模式排软件，最后才用恢复模式修复磁盘或重装系统——顺序不要反。",
  "os": [
   {
    "t": "macOS 13+",
    "k": "macos"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   },
   {
    "t": "macOS 11",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos"
  ],
  "level": "入门",
  "time": "15-60 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "Mac 开不了机",
   "按电源键没反应",
   "卡在苹果标志",
   "Mac 进度条走一半卡住",
   "Mac 开机黑屏",
   "电脑启动失败 macOS",
   "Mac 反复重启",
   "MacBook 无法开机"
  ],
  "keywords": [
   "Mac 开不了机",
   "安全模式",
   "恢复模式",
   "macOS 实用工具",
   "Apple 诊断",
   "NVRAM",
   "SMC",
   "苹果标志卡住"
  ],
  "updated": "2026-10-24",
  "detail_href": "./fix/mac-wont-boot.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "partition-manager",
  "title": "硬盘怎么分区 / C 盘不够想扩容怎么办",
  "domain": "hardware",
  "domainName": "硬件与主机",
  "category": "hw-disk",
  "categoryName": "硬盘与存储",
  "path": "硬件与主机 › 硬盘与存储",
  "summary": "C 盘扩容的本质是「把相邻右侧分区的空地挪给 C 盘」：先用压缩卷在 D 盘头部挤出一块「未分配空间」，再对 C 盘做扩展卷。系统自带的磁盘管理就能做；但相邻和未分配在右侧这两个条件缺一不可，",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   }
  ],
  "osGroup": [
   "windows"
  ],
  "level": "进阶",
  "time": "20-90 分钟",
  "risk": "有数据风险",
  "symptoms": [
   "C 盘不够用想扩容",
   "新硬盘怎么分区",
   "磁盘管理分区",
   "压缩卷灰色",
   "D 盘合并到 C 盘",
   "调整分区大小",
   "硬盘分区"
  ],
  "keywords": [
   "分区",
   "磁盘管理",
   "压缩卷",
   "扩展卷",
   "未分配空间",
   "DiskGenius",
   "MBR",
   "GPT",
   "数据备份"
  ],
  "updated": "2026-10-24",
  "detail_href": "./fix/partition-manager.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "pc-overheat-cleaning",
  "title": "电脑温度过高 / 风扇狂转？清灰降温实操指南",
  "domain": "hardware",
  "domainName": "硬件与主机",
  "category": "hw-cooling",
  "categoryName": "散热与清灰",
  "path": "硬件与主机 › 散热与清灰",
  "summary": "温度高 = 「热量产生得多」或「热量散不出去」：先看是谁在占用 CPU（软件层，看任务管理器），再清风扇和鳍片的灰（物理层，占八成），最后才是换硅脂/改善风道。别一觉得热就换散热器——积灰的散",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   },
   {
    "t": "硬件无关",
    "k": "windows"
   }
  ],
  "osGroup": [
   "macos",
   "windows"
  ],
  "level": "进阶",
  "time": "30-90 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "电脑温度过高",
   "风扇狂转",
   "CPU 90 度",
   "电脑烫手",
   "自动关机过热",
   "游戏降频卡顿",
   "需要清灰",
   "换硅脂"
  ],
  "keywords": [
   "清灰",
   "硅脂",
   "温度",
   "散热",
   "风扇",
   "降频",
   "过热关机",
   "风道",
   "HWMonitor"
  ],
  "updated": "2026-10-25",
  "detail_href": "./fix/pc-overheat-cleaning.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "phishing-message-check",
  "title": "收到「账户异常」「快递赔付」短信/邮件？三步识别钓鱼",
  "domain": "account-sec",
  "domainName": "账号与安全",
  "category": "as-phishing",
  "categoryName": "诈骗识别",
  "path": "账号与安全 › 诈骗识别",
  "summary": "钓鱼信息只有一个目的：让你在慌乱中点进假网站输密码/验证码。识别只要看三点——域名对不对、是否制造紧迫感、是否索要验证码。正规机构永远不向你要短信验证码；你犹豫的每一秒，都是骗局失效的时间。",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   },
   {
    "t": "手机也适用",
    "k": "windows"
   }
  ],
  "osGroup": [
   "macos",
   "windows"
  ],
  "level": "入门",
  "time": "5-15 分钟",
  "risk": "安全",
  "symptoms": [
   "收到钓鱼短信",
   "账户异常验证短信",
   "快递赔付链接",
   "中奖邮件",
   "冒充客服",
   "钓鱼网站",
   "短信里的链接能点吗",
   "疑似诈骗邮件"
  ],
  "keywords": [
   "钓鱼识别",
   "诈骗短信",
   "钓鱼链接",
   "域名核对",
   "双重认证",
   "官方渠道核实",
   "反诈"
  ],
  "updated": "2026-10-25",
  "detail_href": "./fix/phishing-message-check.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "printer-jam-quality",
  "title": "打印机卡纸 / 打印有横纹、颜色淡怎么处理",
  "domain": "peripheral",
  "domainName": "外设",
  "category": "per-printer",
  "categoryName": "打印机",
  "path": "外设 › 打印机",
  "summary": "卡纸九成是「纸受潮 / 纸张规格不对 / 走纸道有残留纸屑」；质量差要按机型分诊——喷墨的横纹/缺色 ≈ 打印头堵塞（清洁+校准解决），激光的颜色淡 ≈ 硒鼓碳粉不足或废粉满。先打一张「打印质",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   },
   {
    "t": "打印机固件",
    "k": "windows"
   }
  ],
  "osGroup": [
   "macos",
   "windows"
  ],
  "level": "入门",
  "time": "10-45 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "打印机卡纸",
   "打印有横纹",
   "打印颜色淡",
   "打印重影",
   "打印有白线",
   "纸张皱",
   "打印糊",
   "进纸歪"
  ],
  "keywords": [
   "卡纸",
   "打印质量",
   "横纹",
   "颜色淡",
   "清洁打印头",
   "校准",
   "硒鼓",
   "墨盒",
   "热凝器",
   "打印质量报告"
  ],
  "updated": "2026-10-25",
  "detail_href": "./fix/printer-jam-quality.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "printer-network-ip-fixed",
  "title": "网络打印机 IP 变了就离线？固定 IP 与端口配置",
  "domain": "peripheral",
  "domainName": "外设",
  "category": "per-printer",
  "categoryName": "打印机",
  "path": "外设 › 打印机",
  "summary": "网络打印机「过一阵就离线」的经典剧本：打印机靠 DHCP 自动拿 IP，路由器重启或租约到期后 IP 变了，而电脑上的打印机端口还指着旧 IP——自然连不上。解法两选一：路由器端做 DHCP ",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   },
   {
    "t": "路由器",
    "k": "router"
   }
  ],
  "osGroup": [
   "macos",
   "windows"
  ],
  "level": "进阶",
  "time": "15-45 分钟",
  "risk": "安全",
  "symptoms": [
   "网络打印机离线",
   "打印机 IP 变了",
   "打印机经常掉线",
   "找不到网络打印机",
   "打印机连不上",
   "添加网络打印机",
   "打印机端口"
  ],
  "keywords": [
   "网络打印机",
   "固定 IP",
   "DHCP 保留",
   "TCP/IP 端口",
   "打印机离线",
   "MAC 绑定",
   "静态 IP",
   "打印机 IP 查询"
  ],
  "updated": "2026-10-25",
  "detail_href": "./fix/printer-network-ip-fixed.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "printer-shared-error-11b",
  "title": "共享打印机连不上 / 报错 0x0000011b 怎么修",
  "domain": "peripheral",
  "domainName": "外设",
  "category": "per-printer",
  "categoryName": "打印机",
  "path": "外设 › 打印机",
  "summary": "0x0000011b 常见于 2021 年打印组件安全更新之后，与打印队列的 RPC 凭据/隐私验证兼容性有关，不一定是打印机坏了。修复顺序应是：主机和客户机安装仍在支持期内的系统更新 → 客",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "Windows 7（作主机时）",
    "k": "windows"
   }
  ],
  "osGroup": [
   "windows"
  ],
  "level": "进阶",
  "time": "15-60 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "共享打印机连不上",
   "0x0000011b",
   "连接共享打印机失败",
   "拒绝访问共享打印机",
   "打印机共享突然不能用",
   "局域网打印机报错",
   "Windows 更新后打印机连不上"
  ],
  "keywords": [
   "0x0000011b",
   "共享打印机",
   "Print Spooler",
   "RpcAuthnLevelPrivacyEnabled",
   "KB5005565",
   "凭据管理器",
   "RPC",
   "打印机共享"
  ],
  "updated": "2026-10-27",
  "detail_href": "./fix/printer-shared-error-11b.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "psu-no-power-check",
  "title": "电脑按开机键没反应？电源故障自查清单（含短接启动法）",
  "domain": "hardware",
  "domainName": "硬件与主机",
  "category": "hw-psu",
  "categoryName": "电源与供电",
  "path": "硬件与主机 › 电源与供电",
  "summary": "「按了没反应」要按 插座 → 电源线 → 开关 → 电源本身 → 主板开机电路 的顺序查，其中「回形针短接 24pin」是判断电源死活的金标准：短接后电源风扇转、各路电压正常，电源就是好的，锅",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "硬件无关",
    "k": "windows"
   }
  ],
  "osGroup": [
   "windows"
  ],
  "level": "进阶",
  "time": "15-45 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "按开机键没反应",
   "电脑完全不通电",
   "电源灯不亮",
   "风扇转一下就停",
   "电脑突然断电关机",
   "开机烧焦味",
   "电源故障",
   "主机不通电"
  ],
  "keywords": [
   "电源自查",
   "PSU",
   "短接启动",
   "回形针点火",
   "24pin",
   "电源烧了",
   "自动关机",
   "功率不足"
  ],
  "updated": "2026-10-25",
  "detail_href": "./fix/psu-no-power-check.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "ram-reseat-no-boot",
  "title": "电脑反复重启 / 开机报警一长两短？先重插内存条",
  "domain": "hardware",
  "domainName": "硬件与主机",
  "category": "hw-memory",
  "categoryName": "内存",
  "path": "硬件与主机 › 内存",
  "summary": "「风扇转一下就停、反复重启循环、主板 Debug 灯停在 DRAM、报警一长两短」——这些十有八九是内存条接触不良，尤其发生在搬动过机箱、加过新内存、很久没清灰之后。断电 → 拔条 → 橡皮擦",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "硬件无关",
    "k": "windows"
   }
  ],
  "osGroup": [
   "windows"
  ],
  "level": "入门",
  "time": "10-30 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "电脑反复重启",
   "开机报警一长两短",
   "内存报警",
   "风扇转一下就停",
   "点亮但反复重启循环",
   "电脑开机无显示",
   "加装内存后开不了机",
   "内存条接触不良"
  ],
  "keywords": [
   "内存条重插",
   "报警声",
   "一长两短",
   "Debug 灯",
   "DRAM",
   "金手指",
   "橡皮擦",
   "双通道",
   "XMP"
  ],
  "updated": "2026-10-25",
  "detail_href": "./fix/ram-reseat-no-boot.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "ransomware-encrypted-response",
  "title": "文件被加密 / 弹出勒索要钱怎么办：勒索软件应急指南",
  "domain": "account-sec",
  "domainName": "账号与安全",
  "category": "as-malware",
  "categoryName": "恶意软件",
  "path": "账号与安全 › 恶意软件",
  "summary": "勒索软件的应对就一句话：先隔离（断网），再定损（哪些被加密、备份在不在），后恢复（解密工具或备份还原）。有干净备份的人，勒索信只是一张废纸——没有备份的人，第一时间去 [NoMoreRanso",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos",
   "windows"
  ],
  "level": "进阶",
  "time": "30-120 分钟",
  "risk": "有数据风险",
  "symptoms": [
   "文件被加密了",
   "文件后缀变奇怪了",
   "弹出勒索信息要比特币",
   "桌面壁纸被改成勒索信",
   "文件打不开了",
   "勒索病毒",
   "ransomware",
   "电脑中勒索"
  ],
  "keywords": [
   "勒索软件",
   "勒索病毒",
   "文件加密",
   "应急响应",
   "断网隔离",
   "解密工具",
   "备份恢复",
   "no_more_ransom",
   "报警"
  ],
  "updated": "2026-10-25",
  "detail_href": "./fix/ransomware-encrypted-response.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "router-firmware-reset",
  "title": "路由器固件升级与恢复出厂的正确姿势（含变砖救援）",
  "domain": "router",
  "domainName": "路由器与家庭网络",
  "category": "rt-firmware",
  "categoryName": "固件与恢复出厂",
  "path": "路由器与家庭网络 › 固件与恢复出厂",
  "summary": "固件要不要升：要，而且建议开自动升级——路由器固件更新大多数是修安全漏洞，老固件挂在公网上就是别人家的后门。越用越卡/抽风：先重启，无效再恢复出厂（官方标准流程是先导出配置备份）；真刷挂了还有",
  "os": [
   {
    "t": "路由器",
    "k": "router"
   }
  ],
  "osGroup": [
   "network"
  ],
  "level": "入门",
  "time": "15-60 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "路由器固件升级",
   "路由器恢复出厂",
   "路由器重置",
   "路由器越用越卡",
   "路由器固件要不要更新",
   "路由器 reset",
   "刷固件变砖",
   "路由器重置后怎么设置"
  ],
  "keywords": [
   "路由器固件",
   "恢复出厂",
   "重置",
   "Reset",
   "救援模式",
   "变砖",
   "配置备份",
   "自动升级",
   "华硕",
   "TP-Link",
   "小米"
  ],
  "updated": "2026-10-25",
  "detail_href": "./fix/router-firmware-reset.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "router-port-forward",
  "title": "端口映射怎么做：外网访问家里的 NAS / 摄像头 / 电脑",
  "domain": "router",
  "domainName": "路由器与家庭网络",
  "category": "rt-forward",
  "categoryName": "端口映射与远程访问",
  "path": "路由器与家庭网络 › 端口映射与远程访问",
  "summary": "外网访问家里设备的完整链路 = 固定内网 IP（设备的门牌）→ 端口映射（把门牌挂到公网）→ DDNS（公网 IP 老变就绑个域名）。动手前先确认一件事：你家有没有公网 IP（ip.cn 查到",
  "os": [
   {
    "t": "路由器",
    "k": "router"
   },
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   }
  ],
  "osGroup": [
   "windows",
   "network"
  ],
  "level": "进阶",
  "time": "30-90 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "端口映射",
   "外网访问 NAS",
   "远程访问家里电脑",
   "摄像头远程看不了",
   "DDNS",
   "没有公网 IP 怎么办",
   "虚拟服务器",
   "远程桌面外网连不上"
  ],
  "keywords": [
   "端口映射",
   "端口转发",
   "虚拟服务器",
   "DDNS",
   "公网IP",
   "内网穿透",
   "NAS远程",
   "远程桌面",
   "IPv6",
   "安全暴露"
  ],
  "updated": "2026-10-25",
  "detail_href": "./fix/router-port-forward.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "router-wifi-coverage",
  "title": "某些房间 WiFi 信号差 / 一进卧室就断流怎么优化",
  "domain": "router",
  "domainName": "路由器与家庭网络",
  "category": "rt-coverage",
  "categoryName": "信号与覆盖",
  "path": "路由器与家庭网络 › 信号与覆盖",
  "summary": "WiFi 信号差，八成不是路由器「功率不够」，而是位置不对、频段选错、信道打架三件事：路由器挪到房子中心并抬高，经常用的房间连 5GHz（近处快），远隔两堵墙的房间连 2.4GHz（穿墙好），",
  "os": [
   {
    "t": "路由器",
    "k": "router"
   },
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   },
   {
    "t": "手机也适用",
    "k": "windows"
   }
  ],
  "osGroup": [
   "macos",
   "windows",
   "network"
  ],
  "level": "入门",
  "time": "20-60 分钟",
  "risk": "安全",
  "symptoms": [
   "WiFi 信号差",
   "一进卧室就断",
   "信号满格网速慢",
   "WiFi 覆盖不到",
   "隔墙信号弱",
   "家里有的房间没信号",
   "无线漫游卡",
   "5G 频段穿墙差"
  ],
  "keywords": [
   "WiFi 覆盖",
   "信号差",
   "穿墙",
   "Mesh 组网",
   "信道干扰",
   "路由器摆放",
   "2.4G 5G",
   "穿墙模式"
  ],
  "updated": "2026-10-25",
  "detail_href": "./fix/router-wifi-coverage.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "screen-artifacts-flicker",
  "title": "花屏 / 闪屏 / 有条纹：显卡、线还是屏坏了怎么分",
  "domain": "peripheral",
  "domainName": "外设",
  "category": "per-display",
  "categoryName": "显示器",
  "path": "外设 › 显示器",
  "summary": "花屏闪屏的分诊口诀：「条纹固定看面板，满屏雪花看显卡，换根线材定乾坤」——竖条纹位置固定不动 → 面板/排线嫌疑；满屏马赛克/绿屏 → 显卡或驱动；DP↔HDMI 换线互测，症状跟着线走就是线",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   }
  ],
  "osGroup": [
   "windows"
  ],
  "level": "进阶",
  "time": "15-60 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "花屏",
   "闪屏",
   "屏幕有条纹",
   "绿屏",
   "雪花点",
   "屏幕闪烁",
   "显示乱码",
   "竖条纹"
  ],
  "keywords": [
   "花屏",
   "闪屏",
   "条纹",
   "绿屏",
   "显卡",
   "DP线",
   "HDMI",
   "刷新率",
   "驱动",
   "排线",
   "面板",
   "交叉测试"
  ],
  "updated": "2026-10-25",
  "detail_href": "./fix/screen-artifacts-flicker.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "screen-cast-miracast",
  "title": "无线投屏失败 / 搜不到电视怎么修（Win+K、Miracast、手机投屏）",
  "domain": "peripheral",
  "domainName": "外设",
  "category": "per-display",
  "categoryName": "显示器",
  "path": "外设 › 显示器",
  "summary": "投屏失败先分类：「搜不到设备」查同网段与电视入口（电视端功能名字各异：屏幕镜像/多屏互动/Miracast）；「搜得到连不上」查驱动（Windows 跑 dxdiag 看 Miracast 支",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "Android 8+",
    "k": "windows"
   },
   {
    "t": "智能电视",
    "k": "windows"
   }
  ],
  "osGroup": [
   "windows"
  ],
  "level": "入门",
  "time": "10-40 分钟",
  "risk": "安全",
  "symptoms": [
   "无线投屏失败",
   "搜不到电视",
   "投屏连不上",
   "Win K 没有设备",
   "Miracast 不支持",
   "手机投屏搜不到电视",
   "投屏卡顿断开",
   "无线显示器连接失败"
  ],
  "keywords": [
   "无线投屏",
   "Miracast",
   "Win+K",
   "投屏到电视",
   "dxdiag",
   "无线显示器",
   "DLNA",
   "投屏搜不到",
   "连接失败"
  ],
  "updated": "2026-10-25",
  "detail_href": "./fix/screen-cast-miracast.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "slow-network",
  "title": "网速慢怎么定位：是宽带、路由器还是电脑的问题",
  "domain": "net-basic",
  "domainName": "网络基础",
  "category": "net-connected-noint",
  "categoryName": "连上但上不了网",
  "path": "网络基础 › 连上但上不了网",
  "summary": "网速慢要按「设备 → Wi-Fi 链路 → 路由器 → 运营商」分段测，每一段都有明确判据：有线直连测速够签约值 = 宽带没问题；同一房间里手机也慢 = Wi-Fi 链路问题；只有一台设备慢 ",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   },
   {
    "t": "路由器",
    "k": "router"
   }
  ],
  "osGroup": [
   "macos",
   "windows",
   "network"
  ],
  "level": "入门",
  "time": "10-40 分钟",
  "risk": "安全",
  "symptoms": [
   "网速慢",
   "视频卡顿",
   "网页加载慢",
   "下载速度慢",
   "网络时快时慢",
   "WiFi 慢",
   "网络延迟高"
  ],
  "keywords": [
   "网速慢",
   "测速",
   "延迟",
   "丢包",
   "5GHz",
   "DNS",
   "运营商",
   "网线",
   "信道拥堵"
  ],
  "updated": "2026-10-24",
  "detail_href": "./fix/slow-network.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "sop-billable-repair",
  "title": "有偿维修与延保速查：摔碎、进水、屏轴、外壳与付费检测",
  "domain": "ref-manual",
  "domainName": "装机与运维手册",
  "category": "ref-paid-maint",
  "categoryName": "有偿维修与延保",
  "path": "装机与运维手册 › 有偿维修与延保",
  "summary": "有一部分故障不在标准保修范围内：摔、砸、进水、人为损坏，以及过了保修期的机器。",
  "os": [
   {
    "t": "Windows",
    "k": "windows"
   },
   {
    "t": "macOS",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos",
   "windows",
   "reference"
  ],
  "level": "入门",
  "time": "10-30 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "有偿维修与延保速查 处理方法",
   "SOP 参考"
  ],
  "keywords": [
   "有偿维修与延保速查 SOP",
   "摔碎",
   "进水",
   "屏轴",
   "外壳与付费检测",
   "参考手册",
   "作业指导"
  ],
  "updated": "2026-10-17",
  "detail_href": "./fix/sop-billable-repair.html",
  "kind": "reference",
  "hot": 1
 },
 {
  "slug": "sop-bios-post-errors",
  "title": "开机报错与 BIOS 速查：不加电、报警、电池/时间错、密码与启动项",
  "domain": "ref-manual",
  "domainName": "装机与运维手册",
  "category": "ref-bios-secure",
  "categoryName": "BIOS 与加密锁定",
  "path": "装机与运维手册 › BIOS 与加密锁定",
  "summary": "「开机开不了」在 SOP 里被拆成了十几条具体现象：不加电、加电无显、滴滴报警、fan error、",
  "os": [
   {
    "t": "Windows",
    "k": "windows"
   }
  ],
  "osGroup": [
   "windows",
   "reference"
  ],
  "level": "入门",
  "time": "10-30 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "开机报错与 BIOS 速查 处理方法",
   "SOP 参考"
  ],
  "keywords": [
   "开机报错与 BIOS 速查 SOP",
   "不加电",
   "报警",
   "电池/时间错",
   "密码与启动项",
   "参考手册",
   "作业指导"
  ],
  "updated": "2026-10-17",
  "detail_href": "./fix/sop-bios-post-errors.html",
  "kind": "reference",
  "hot": 1
 },
 {
  "slug": "sop-data-backup-migrate",
  "title": "换机与重装前的数据备份速查：桌面、文档、浏览器、微信与企业微信",
  "domain": "ref-manual",
  "domainName": "装机与运维手册",
  "category": "ref-data-migrate",
  "categoryName": "数据迁移与备份还原",
  "path": "装机与运维手册 › 数据迁移与备份还原",
  "summary": "换机、重装、返修之前，数据是唯一不能重来的东西。",
  "os": [
   {
    "t": "Windows",
    "k": "windows"
   },
   {
    "t": "macOS",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos",
   "windows",
   "reference"
  ],
  "level": "入门",
  "time": "10-30 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "换机与重装前的数据备份速查 处理方法",
   "SOP 参考"
  ],
  "keywords": [
   "换机与重装前的数据备份速查 SOP",
   "桌面",
   "文档",
   "浏览器",
   "微信与企业微信",
   "参考手册",
   "作业指导"
  ],
  "updated": "2026-10-17",
  "detail_href": "./fix/sop-data-backup-migrate.html",
  "kind": "reference",
  "hot": 1
 },
 {
  "slug": "sop-diagnose-tools",
  "title": "故障检测工具速查：蓝屏、DMP、硬盘、内存、温度与日志",
  "domain": "ref-manual",
  "domainName": "装机与运维手册",
  "category": "ref-tools-diag",
  "categoryName": "检测工具与日志",
  "path": "装机与运维手册 › 检测工具与日志",
  "summary": "「查不出原因」通常不是技术难度问题，而是没有证据。",
  "os": [
   {
    "t": "Windows",
    "k": "windows"
   }
  ],
  "osGroup": [
   "windows",
   "reference"
  ],
  "level": "入门",
  "time": "10-30 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "故障检测工具速查 处理方法",
   "SOP 参考"
  ],
  "keywords": [
   "故障检测工具速查 SOP",
   "蓝屏",
   "DMP",
   "硬盘",
   "内存",
   "温度与日志",
   "参考手册",
   "作业指导"
  ],
  "updated": "2026-10-17",
  "detail_href": "./fix/sop-diagnose-tools.html",
  "kind": "reference",
  "hot": 1
 },
 {
  "slug": "sop-driver-image-misc",
  "title": "驱动、镜像与软件环境杂项：Ubuntu 驱动、WPS VBA、CAD 与网页视频",
  "domain": "ref-manual",
  "domainName": "装机与运维手册",
  "category": "ref-driver",
  "categoryName": "驱动与镜像",
  "path": "装机与运维手册 › 驱动与镜像",
  "summary": "SOP 里还有一批「装完系统/装完软件之后的杂项」：Ubuntu 显卡驱动与 CUDA、",
  "os": [
   {
    "t": "Windows",
    "k": "windows"
   },
   {
    "t": "macOS",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos",
   "windows",
   "reference"
  ],
  "level": "入门",
  "time": "10-30 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "驱动、镜像与软件环境杂项 处理方法",
   "SOP 参考"
  ],
  "keywords": [
   "驱动",
   "镜像与软件环境杂项 SOP",
   "Ubuntu 驱动",
   "WPS VBA",
   "CAD 与网页视频",
   "参考手册",
   "作业指导"
  ],
  "updated": "2026-10-17",
  "detail_href": "./fix/sop-driver-image-misc.html",
  "kind": "reference",
  "hot": 1
 },
 {
  "slug": "sop-hardware-peripheral",
  "title": "外设与显示速查：屏幕、键鼠、触摸板、音频、蓝牙、指纹与摄像头",
  "domain": "ref-manual",
  "domainName": "装机与运维手册",
  "category": "ref-hardware",
  "categoryName": "硬件检测与拆装",
  "path": "装机与运维手册 › 硬件检测与拆装",
  "summary": "屏幕、键盘、鼠标、音频、蓝牙、指纹、摄像头这些「小问题」的处理套路高度一致：",
  "os": [
   {
    "t": "Windows",
    "k": "windows"
   }
  ],
  "osGroup": [
   "windows",
   "reference"
  ],
  "level": "入门",
  "time": "10-30 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "外设与显示速查 处理方法",
   "SOP 参考"
  ],
  "keywords": [
   "外设与显示速查 SOP",
   "屏幕",
   "键鼠",
   "触摸板",
   "音频",
   "蓝牙",
   "指纹与摄像头",
   "参考手册",
   "作业指导"
  ],
  "updated": "2026-10-17",
  "detail_href": "./fix/sop-hardware-peripheral.html",
  "kind": "reference",
  "hot": 1
 },
 {
  "slug": "sop-macos-maintain",
  "title": "Mac 维护速查：装系统、恢复模式、SMC/NVRAM 与资料迁移",
  "domain": "ref-manual",
  "domainName": "装机与运维手册",
  "category": "ref-macos",
  "categoryName": "macOS 维护",
  "path": "装机与运维手册 › macOS 维护",
  "summary": "Mac 的问题和 Windows 是两套解法：没有 BIOS、没有 PE，靠的是恢复模式（Recovery）、",
  "os": [
   {
    "t": "macOS",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos",
   "reference"
  ],
  "level": "入门",
  "time": "10-30 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "Mac 维护速查 处理方法",
   "SOP 参考"
  ],
  "keywords": [
   "Mac 维护速查 SOP",
   "装系统",
   "恢复模式",
   "SMC/NVRAM 与资料迁移",
   "参考手册",
   "作业指导"
  ],
  "updated": "2026-10-17",
  "detail_href": "./fix/sop-macos-maintain.html",
  "kind": "reference",
  "hot": 1
 },
 {
  "slug": "sop-new-device-onboarding",
  "title": "新机交付与日常使用规范：开箱检测、跳过联网、防卡顿与一键还原",
  "domain": "ref-manual",
  "domainName": "装机与运维手册",
  "category": "ref-os",
  "categoryName": "装系统与 PE",
  "path": "装机与运维手册 › 装系统与 PE",
  "summary": "SOP 的「客户类」把新员工领电脑这件事拆成了几步：开箱检测 → 跳过联网激活 → 性能优化 → 使用规范。",
  "os": [
   {
    "t": "Windows",
    "k": "windows"
   }
  ],
  "osGroup": [
   "windows",
   "reference"
  ],
  "level": "入门",
  "time": "10-30 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "新机交付与日常使用规范 处理方法",
   "SOP 参考"
  ],
  "keywords": [
   "新机交付与日常使用规范 SOP",
   "开箱检测",
   "跳过联网",
   "防卡顿与一键还原",
   "参考手册",
   "作业指导"
  ],
  "updated": "2026-10-17",
  "detail_href": "./fix/sop-new-device-onboarding.html",
  "kind": "reference",
  "hot": 1
 },
 {
  "slug": "sop-onsite-service",
  "title": "现场服务与检测标准：到场、沟通、检测、报价与离场",
  "domain": "ref-field",
  "domainName": "现场作业与工单",
  "category": "field-service",
  "categoryName": "现场服务与检测",
  "path": "现场作业与工单 › 现场服务与检测",
  "summary": "同一台机器，换个工程师去，客户的评价可能完全不同——差别往往不在技术，而在现场动作是否标准。",
  "os": [
   {
    "t": "通用",
    "k": "windows"
   }
  ],
  "osGroup": [
   "reference"
  ],
  "level": "入门",
  "time": "10-30 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "现场服务与检测标准 处理方法",
   "SOP 参考"
  ],
  "keywords": [
   "现场服务与检测标准 SOP",
   "到场",
   "沟通",
   "检测",
   "报价与离场",
   "参考手册",
   "作业指导"
  ],
  "updated": "2026-10-17",
  "detail_href": "./fix/sop-onsite-service.html",
  "kind": "reference",
  "hot": 1
 },
 {
  "slug": "sop-pe-usb-install",
  "title": "PE 制作与系统安装速查：PE 盘、多合一、U 盘与在线安装",
  "domain": "ref-manual",
  "domainName": "装机与运维手册",
  "category": "ref-os",
  "categoryName": "装系统与 PE",
  "path": "装机与运维手册 › 装系统与 PE",
  "summary": "装系统是桌面运维最高频的动作，也最容易翻车：PE 不认硬盘、引导不对、装完没有驱动。",
  "os": [
   {
    "t": "Windows",
    "k": "windows"
   },
   {
    "t": "macOS",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos",
   "windows",
   "reference"
  ],
  "level": "入门",
  "time": "10-30 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "PE 制作与系统安装速查 处理方法",
   "SOP 参考"
  ],
  "keywords": [
   "PE 制作与系统安装速查 SOP",
   "PE 盘",
   "多合一",
   "U 盘与在线安装",
   "参考手册",
   "作业指导"
  ],
  "updated": "2026-10-17",
  "detail_href": "./fix/sop-pe-usb-install.html",
  "kind": "reference",
  "hot": 1
 },
 {
  "slug": "sop-printer-connected-fix",
  "title": "打印机连接与故障速查：USB / 共享 / 网络、卡纸、缺墨与扫描",
  "domain": "ref-manual",
  "domainName": "装机与运维手册",
  "category": "ref-peripheral-setup",
  "categoryName": "打印机与外设配置",
  "path": "装机与运维手册 › 打印机与外设配置",
  "summary": "打印机是工单里最高频的外设，也是「到现场十分钟解决」的典型场景：",
  "os": [
   {
    "t": "Windows",
    "k": "windows"
   },
   {
    "t": "macOS",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos",
   "windows",
   "reference"
  ],
  "level": "入门",
  "time": "10-30 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "打印机连接与故障速查 处理方法",
   "SOP 参考"
  ],
  "keywords": [
   "打印机连接与故障速查 SOP",
   "USB / 共享 / 网络",
   "卡纸",
   "缺墨与扫描",
   "参考手册",
   "作业指导"
  ],
  "updated": "2026-10-17",
  "detail_href": "./fix/sop-printer-connected-fix.html",
  "kind": "reference",
  "hot": 1
 },
 {
  "slug": "sop-testing-practice",
  "title": "故障复现与测试规范：避免「测错方向」把故障数量做大",
  "domain": "ref-field",
  "domainName": "现场作业与工单",
  "category": "field-good-practice",
  "categoryName": "检测与测试规范",
  "path": "现场作业与工单 › 检测与测试规范",
  "summary": "SOP 的 BadCase 里有一条很典型的教训：过多不必要的交叉测试。",
  "os": [
   {
    "t": "通用",
    "k": "windows"
   }
  ],
  "osGroup": [
   "reference"
  ],
  "level": "入门",
  "time": "10-30 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "故障复现与测试规范 处理方法",
   "SOP 参考"
  ],
  "keywords": [
   "故障复现与测试规范 SOP",
   "避免「测错方向」把故障数量做大",
   "参考手册",
   "作业指导"
  ],
  "updated": "2026-10-17",
  "detail_href": "./fix/sop-testing-practice.html",
  "kind": "reference",
  "hot": 1
 },
 {
  "slug": "sop-ticket-workflow",
  "title": "工单全流程速查：接单、改派、挂起、升级、换机与寄回",
  "domain": "ref-field",
  "domainName": "现场作业与工单",
  "category": "field-ticket",
  "categoryName": "工单与服务流程",
  "path": "现场作业与工单 › 工单与服务流程",
  "summary": "工单流程比技术细节更容易扣分：该打卡没打、该申请跳字没申请、改派没走流程，评价直接掉。",
  "os": [
   {
    "t": "通用",
    "k": "windows"
   }
  ],
  "osGroup": [
   "reference"
  ],
  "level": "入门",
  "time": "10-30 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "工单全流程速查 处理方法",
   "SOP 参考"
  ],
  "keywords": [
   "工单全流程速查 SOP",
   "接单",
   "改派",
   "挂起",
   "升级",
   "换机与寄回",
   "参考手册",
   "作业指导"
  ],
  "updated": "2026-10-17",
  "detail_href": "./fix/sop-ticket-workflow.html",
  "kind": "reference",
  "hot": 1
 },
 {
  "slug": "webcam-not-working",
  "title": "摄像头打不开 / 视频会议对方看不到我怎么修",
  "domain": "peripheral",
  "domainName": "外设",
  "category": "per-cam",
  "categoryName": "摄像头",
  "path": "外设 › 摄像头",
  "summary": "摄像头问题的三大来源按顺序是：物理遮挡/开关 → 隐私权限没放开 → 被别的程序占用。Windows 大版本更新后「相机访问」总开关被重置是高发原因——会议前 5 分钟打不开摄像头的人，九成是",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   },
   {
    "t": "macOS 12+",
    "k": "macos"
   }
  ],
  "osGroup": [
   "macos",
   "windows"
  ],
  "level": "入门",
  "time": "5-30 分钟",
  "risk": "安全",
  "symptoms": [
   "摄像头打不开",
   "视频会议看不到我",
   "相机黑屏",
   "摄像头被占用",
   "找不到摄像头",
   "视频会议没画面",
   "camera not working",
   "相机权限"
  ],
  "keywords": [
   "摄像头",
   "相机",
   "视频会议",
   "隐私设置",
   "相机权限",
   "驱动",
   "物理开关",
   "联想",
   "会议软件"
  ],
  "updated": "2026-10-27",
  "detail_href": "./fix/webcam-not-working.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "win-no-sound",
  "title": "电脑没声音 / 右下角喇叭有红叉怎么修",
  "domain": "peripheral",
  "domainName": "外设",
  "category": "per-audio",
  "categoryName": "耳机与音箱",
  "path": "外设 › 耳机与音箱",
  "summary": "没声音按「物理 → 输出目标 → 系统服务 → 驱动」四层查：音箱/耳机本身和插口先确认；然后看是不是「声音输出到了错误的设备」（接了 HDMI 显示器却没选它/该选它没选）；红叉提示「音频服",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   }
  ],
  "osGroup": [
   "windows"
  ],
  "level": "入门",
  "time": "5-30 分钟",
  "risk": "安全",
  "symptoms": [
   "电脑没声音",
   "喇叭红叉",
   "音频服务未运行",
   "声音输出设备找不到",
   "耳机没声音",
   "更新后没声音",
   "音量键叉号",
   "no audio output device"
  ],
  "keywords": [
   "没声音",
   "音频",
   "Realtek",
   "音频服务",
   "默认设备",
   "疑难解答",
   "Windows 更新后无声",
   "音频驱动"
  ],
  "updated": "2026-10-27",
  "detail_href": "./fix/win-no-sound.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "win-safe-restore",
  "title": "系统改坏了进不去？安全模式、系统还原与重置的正确顺序",
  "domain": "win-system",
  "domainName": "Windows 系统与开机",
  "category": "win-boot",
  "categoryName": "开机与引导故障",
  "path": "Windows 系统与开机 › 开机与引导故障",
  "summary": "「把系统退回能用的状态」有四招，破坏力从小到大：安全模式排障 → 卸载最近更新 → 系统还原到还原点 → 重置此电脑。按这个顺序走，九成「改坏了」的系统能在前两步救回来；千万别一上来就重置甚至",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   }
  ],
  "osGroup": [
   "windows"
  ],
  "level": "入门",
  "time": "20-90 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "装完软件开不了机",
   "更新后系统异常",
   "系统还原",
   "安全模式进不去",
   "想退回之前的状态",
   "重置此电脑",
   "改了设置系统出问题",
   "winre 恢复环境"
  ],
  "keywords": [
   "安全模式",
   "系统还原",
   "还原点",
   "WinRE",
   "高级启动",
   "重置此电脑",
   "卸载更新",
   "恢复选项"
  ],
  "updated": "2026-10-27",
  "detail_href": "./fix/win-safe-restore.html",
  "kind": "guide",
  "hot": 1
 },
 {
  "slug": "win-store-not-opening",
  "title": "Microsoft Store 打不开 / 商店应用装不上怎么修",
  "domain": "win-app",
  "domainName": "Windows 软件与性能",
  "category": "win-app-crash",
  "categoryName": "软件打不开与闪退",
  "path": "Windows 软件与性能 › 软件打不开与闪退",
  "summary": "商店问题的修复顺序照抄微软官方三板斧：wsreset.exe 清缓存 → 设置里「修复」→ 「重置」。九成卡在第一步就好了。开不了机的病因大都是这几样：代理/VPN 拦截、区域设成了奇怪的国家",
  "os": [
   {
    "t": "Windows 10",
    "k": "windows"
   },
   {
    "t": "Windows 11",
    "k": "windows"
   }
  ],
  "osGroup": [
   "windows"
  ],
  "level": "入门",
  "time": "10-45 分钟",
  "risk": "需谨慎",
  "symptoms": [
   "Microsoft Store 打不开",
   "商店一直转圈",
   "商店应用安装失败",
   "应用商店打不开",
   "Store 闪退",
   "无法从商店下载",
   "商店报错代码",
   "商店应用打不开"
  ],
  "keywords": [
   "Microsoft Store",
   "wsreset",
   "商店修复",
   "商店重置",
   "应用安装失败",
   "0x80131500",
   "区域设置",
   "应用商店"
  ],
  "updated": "2026-10-27",
  "detail_href": "./fix/win-store-not-opening.html",
  "kind": "guide",
  "hot": 1
 }
];
