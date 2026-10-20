/* data/hardware-parts.js — 笔记本零件清单（3D 拆解页的数据源）
   ------------------------------------------------------------------
   为什么单独一个文件：零件与教程的对应关系是「内容」，不是「代码」。
   以后加机型、换配色、改联动的教程，只改这里，不动 hardware-3d.js。

   字段：
     id        零件标识（同时是 3D 场景里的 mesh.userData.partId）
     name      中文名（面板标题、按钮文字、读屏文本）
     en        英文副标题（演示时更专业，纯装饰）
     color     该零件在 3D 里的主色（取自站点色板 token，保证风格一致）
     desc      一句话说明它在机器里干什么
     faults    常见故障现象（工程师排查用）
     links     站内相关教程（相对 hardware.html 的路径）
     explode   分解时的位移向量 [x, y, z]（单位与场景一致，1 ≈ 1cm）
     kb        面板里的「一眼记住」提示
   ------------------------------------------------------------------ */

window.FX_PARTS = [
  {
    id: "lid",
    name: "屏幕总成",
    en: "Display Assembly",
    color: "#79CFFF",
    desc: "上盖 + 液晶面板 + 屏线。屏幕本身不参与计算，亮不亮、花不花主要看面板和屏线。",
    faults: ["黑屏但有声音", "闪屏 / 花屏 / 竖向屏线", "亮度不可调", "屏轴松动或断裂"],
    kb: "外接显示器正常 → 多半是屏或屏线，不是显卡。",
    links: [
      { href: "./fix/monitor-no-signal.html", label: "显示器无信号 / 外接屏不亮" },
      { href: "./fix/win-blackscreen-cursor.html", label: "开机黑屏只有鼠标指针" }
    ],
    explode: [0, 8.5, -14]
  },
  {
    id: "hinge",
    name: "屏轴与屏线",
    en: "Hinge & Display Cable",
    color: "#FFC7D9",
    desc: "连接屏幕与主板的唯一通道，也是开合时最容易磨损的部件。",
    faults: ["开合到某个角度就闪屏", "屏幕出现竖条纹", "屏轴异响、外壳开裂"],
    kb: "「动一下屏幕就好、动一下就坏」＝优先怀疑屏线，不是屏坏了。",
    links: [
      { href: "./fix/monitor-no-signal.html", label: "显示器无信号" },
      { href: "./browse.html#ref-manual", label: "装机与运维手册（拆装）" }
    ],
    explode: [0, 3.5, -9]
  },
  {
    id: "keyboard",
    name: "键盘面（C 面）",
    en: "Keyboard Deck",
    color: "#FFD84D",
    desc: "承载键盘、触控板与电源键的上表面，拆机第一层就要先卸它。",
    faults: ["按键失灵 / 连击", "进液后大面积失灵", "触控板漂移、按压无反馈"],
    kb: "单个键失灵先换键帽排线；成片失灵多为排线进水或主板接口。",
    links: [
      { href: "./search.html?q=键盘", label: "搜索：键盘异常" },
      { href: "./search.html?q=触摸板", label: "搜索：触摸板异常" }
    ],
    explode: [0, 15, 1.5]
  },
  {
    id: "battery",
    name: "电池",
    en: "Battery Pack",
    color: "#7FE3C0",
    desc: "整机里体积最大的零件，占据掌托下方全部空间，也是拆机时最先断电的对象。",
    faults: ["不充电 / 掉电快", "续航明显缩短", "电池鼓包把触控板顶起来"],
    kb: "拆机第一步永远是断电池排线——带电插拔主板最容易烧元件。",
    links: [
      { href: "./search.html?q=电池", label: "搜索：电池 / 续航" },
      { href: "./browse.html#ref-manual", label: "装机与运维手册（换件）" }
    ],
    explode: [0, 4, 7.5]
  },
  {
    id: "mainboard",
    name: "主板",
    en: "Mainboard",
    color: "#0F766E",
    desc: "所有零件的连接中心：CPU、内存、硬盘、网卡都插在它上面。",
    faults: ["不加电 / 加电无显", "USB 与接口集体失效", "进水后无法开机"],
    kb: "进液机不要反复通电试——每通一次电，腐蚀范围就扩大一圈。",
    links: [
      { href: "./search.html?q=不加电", label: "搜索：不加电" },
      { href: "./fix/sop-bios-post-errors.html", label: "开机报错与 BIOS 速查" }
    ],
    explode: [0, 4, -2.5]
  },
  {
    id: "cpu",
    name: "CPU 与散热器",
    en: "CPU & Heatsink",
    color: "#FF8A6B",
    desc: "处理器本体 + 压在它上面的散热铜块，是整个散热链路的热源。",
    faults: ["开机风扇狂转但无显示", "满载突然掉频变卡", "待机温度就很高"],
    kb: "待机温度超过 70℃ 基本就是硅脂干了或风扇堵了，不是 CPU 坏。",
    links: [
      { href: "./search.html?q=发烫", label: "搜索：发烫 / 降频" },
      { href: "./search.html?q=风扇", label: "搜索：风扇异响" }
    ],
    explode: [10, 7.5, -6]
  },
  {
    id: "ram",
    name: "内存条",
    en: "Memory (RAM)",
    color: "#A995FF",
    desc: "两槽插在主板侧面，是升级成本最低、效果最直接的零件。",
    faults: ["内存可用只有 2G / 识别不全", "开机报警、反复重启", "蓝屏代码指向内存"],
    kb: "内存条金手指氧化是最常见的「假故障」，拔下来擦一下再插回就能好。",
    links: [
      { href: "./fix/win-bluescreen-read-code.html", label: "电脑蓝屏了怎么办" },
      { href: "./fix/win-slow-diagnose.html", label: "电脑越来越卡怎么办" }
    ],
    explode: [12, 5, 1]
  },
  {
    id: "ssd",
    name: "固态硬盘",
    en: "SSD / Storage",
    color: "#FFD84D",
    desc: "系统和数据都在这里。它一旦掉速或掉盘，表现是「什么都卡」而不是报错。",
    faults: ["开机极慢、运行中卡死", "BIOS 里看不到硬盘", "文件丢失、系统反复修复"],
    kb: "硬盘咔咔响或 SMART 异常 → 先备份数据，再谈修复。",
    links: [
      { href: "./fix/disk-clicking-failure.html", label: "硬盘咔咔响 / 识别不到" },
      { href: "./fix/win-c-drive-full-cleanup.html", label: "C 盘爆红怎么清理" }
    ],
    explode: [12, 2, 5.5]
  },
  {
    id: "fan",
    name: "散热风扇",
    en: "Cooling Fan",
    color: "#A995FF",
    desc: "把散热鳍片上的热量吹出机身。笔记本里最容易积灰、最先发出异响的零件。",
    faults: ["风扇异响 / 不转", "开机 fan error", "出风口没风、机身发烫"],
    kb: "风扇不转多半是卡灰或排线松，不是电机坏；清灰后先手动拨一下确认能转。",
    links: [
      { href: "./search.html?q=风扇", label: "搜索：风扇异响" },
      { href: "./search.html?q=发烫", label: "搜索：电脑发烫" }
    ],
    explode: [-10, 7.5, -8]
  },
  {
    id: "wifi",
    name: "无线网卡",
    en: "Wi-Fi Card",
    color: "#79CFFF",
    desc: "插在主板上的小卡，连天线。用久了会掉驱动、掉设备。",
    faults: ["没有 WLAN 选项 / 网卡消失", "Wi-Fi 列表搜不到网络", "连上但网速极慢"],
    kb: "网卡「时有时无」先看天线扣有没有松，再看驱动——换卡是最后一步。",
    links: [
      { href: "./fix/wifi-adapter-missing.html", label: "电脑没有 WLAN 选项" },
      { href: "./fix/wifi-ssid-not-found.html", label: "Wi-Fi 列表找不到自家网络" }
    ],
    explode: [-12, 5, 0.5]
  },
  {
    id: "speaker",
    name: "扬声器",
    en: "Speakers",
    color: "#FF9278",
    desc: "左右各一个，贴在掌托两侧。拆机时容易被忽略、装回时压到排线。",
    faults: ["一边没声音", "杂音 / 破音", "音量不可调"],
    kb: "单边没声先看声卡设置和插孔，两个都没声才怀疑扬声器排线。",
    links: [
      { href: "./search.html?q=无声音", label: "搜索：无声音 / 杂音" }
    ],
    explode: [-7, 2, 9]
  },
  {
    id: "ports",
    name: "接口与排线",
    en: "I/O Ports & Cables",
    color: "#FFC7D9",
    desc: "USB、HDMI、电源口与内部排线，是「外设不识别」时最先要排除的一层。",
    faults: ["USB 设备不识别", "外接显示器无信号", "接口松动、接触不良"],
    kb: "外设不识别先换口、换线、换机器交叉验证，别一上来就重装驱动。",
    links: [
      { href: "./fix/usb-drive-not-recognized.html", label: "U 盘 / 移动硬盘不识别" },
      { href: "./fix/monitor-no-signal.html", label: "显示器无信号" }
    ],
    explode: [0, 2, 0]
  }
];
