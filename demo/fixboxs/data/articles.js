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
  "risk": "安全",
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
  "updated": "2026-10-11",
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
  "updated": "2026-10-11",
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
  "updated": "2026-10-11",
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
  "risk": "需谨慎",
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
  "updated": "2026-10-11",
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
  "updated": "2026-10-11",
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
  "updated": "2026-10-11",
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
  "updated": "2026-10-11",
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
  "risk": "需谨慎",
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
  "updated": "2026-10-11",
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
  "updated": "2026-10-11",
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
  "updated": "2026-10-11",
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
  "updated": "2026-10-11",
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
  "updated": "2026-10-11",
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
  "updated": "2026-10-11",
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
  "updated": "2026-10-11",
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
  "updated": "2026-10-11",
  "hot": 2
 }
];
