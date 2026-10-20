/* data/hardware-parts.js — 3D 拆解图的「多机型零件清单」（唯一数据源）
   ------------------------------------------------------------------
   为什么单独一个文件：零件与教程的对应关系是「内容」，不是「代码」。
   以后加机型、换配色、改联动的教程，只改这里，不动 hardware-3d.js。

   结构：
     window.FX_DEVICES = [
       { id, name, sub, kind, poster, intro, parts: [ ... ] }
     ]
   · kind = "laptop" | "tower"：决定用哪套 3D 建模
   · parts 的 id 必须与 3D 场景里的 mesh.userData.partId 一致，否则点了没反应
   · 台式机的 id 三台通用（side-panel / front-bezel / mainboard / cpu / ram /
     gpu / hdd / ssd / psu / case-fan / odd），差异体现在名字、说明与位置

   零件字段：
     id / name / en / color / desc / faults / links / explode / kb
     explode：分解时相对装配位置的位移向量（单位 ≈ 1cm）
   ------------------------------------------------------------------ */

/* ---------- 台式机通用：品牌机「非标」是现场最大的坑，逐条写进说明 ---------- */
function tower(lenovo) { return lenovo; }

window.FX_DEVICES = [
  /* ============================================================
     一、笔记本（14 寸参考机型）
     ============================================================ */
  {
    id: "laptop",
    name: "笔记本",
    sub: "14 寸 · 参考机型",
    kind: "laptop",
    poster: "./img/hardware-poster.webp",
    intro: "上盖、键盘面、电池、主板、CPU、内存、硬盘、风扇、网卡——一台轻薄本里的全部主要零件。",
    parts: [
      {
        id: "lid", name: "屏幕总成", en: "Display Assembly", color: "#79CFFF",
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
        id: "hinge", name: "屏轴与屏线", en: "Hinge & Display Cable", color: "#FFC7D9",
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
        id: "keyboard", name: "键盘面（C 面）", en: "Keyboard Deck", color: "#FFD84D",
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
        id: "battery", name: "电池", en: "Battery Pack", color: "#7FE3C0",
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
        id: "mainboard", name: "主板", en: "Mainboard", color: "#0F766E",
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
        id: "cpu", name: "CPU 与散热器", en: "CPU & Heatsink", color: "#FF8A6B",
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
        id: "ram", name: "内存条", en: "Memory (RAM)", color: "#A995FF",
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
        id: "ssd", name: "固态硬盘", en: "SSD / Storage", color: "#FFD84D",
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
        id: "fan", name: "散热风扇", en: "Cooling Fan", color: "#A995FF",
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
        id: "wifi", name: "无线网卡", en: "Wi-Fi Card", color: "#79CFFF",
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
        id: "speaker", name: "扬声器", en: "Speakers", color: "#FF9278",
        desc: "左右各一个，贴在掌托两侧。拆机时容易被忽略、装回时压到排线。",
        faults: ["一边没声音", "杂音 / 破音", "音量不可调"],
        kb: "单边没声先看声卡设置和插孔，两个都没声才怀疑扬声器排线。",
        links: [{ href: "./search.html?q=无声音", label: "搜索：无声音 / 杂音" }],
        explode: [-7, 2, 9]
      },
      {
        id: "ports", name: "接口与排线", en: "I/O Ports & Cables", color: "#FFC7D9",
        desc: "USB、HDMI、电源口与内部排线，是「外设不识别」时最先要排除的一层。",
        faults: ["USB 设备不识别", "外接显示器无信号", "接口松动、接触不良"],
        kb: "外设不识别先换口、换线、换机器交叉验证，别一上来就重装驱动。",
        links: [
          { href: "./fix/usb-drive-not-recognized.html", label: "U 盘 / 移动硬盘不识别" },
          { href: "./fix/monitor-no-signal.html", label: "显示器无信号" }
        ],
        explode: [0, 2, 0]
      }
    ]
  }
];

/* ============================================================
   二、台式主机（联想 / 戴尔 / 惠普）
   ------------------------------------------------------------
   三台共用零件 id，但「品牌差异」写进说明——这才是现场真正踩坑的地方：
   非标电源、非标主板、免工具结构、硬盘笼朝向。
   ============================================================ */
function towerParts(brand) {
  var B = {
    lenovo: {
      side: "ThinkCentre 侧板：后部一颗手拧螺丝，向后推 1cm 再向外掀。",
      bezel: "前面板为卡扣固定，从底部凹槽向外撬，注意别扯断电源键排线。",
      board: "联想多数机型为非标主板：24pin 改成 10pin/14pin，换电源必须用原厂或专用转接。",
      psu: "电源在后上方。联想非标电源接口是现场换电源最常见的翻车点——先看针脚数再买。",
      cage: "硬盘笼在前下方，拆硬盘要先取下前面板。",
      odd: "5.25 寸光驱位在顶部，可改装硬盘托架或前置接口面板。",
      fan: "后置单风扇，直接对着 CPU 散热器抽风；扇叶积灰是「夏天突然变卡」的元凶。"
    },
    dell: {
      side: "OptiPlex 侧板免工具：后侧拉手向外一拉，侧板整体向后滑出。",
      bezel: "前面板免工具卡扣，按下顶部卡舌即可整块取下。",
      board: "戴尔定制主板：电源接口为专用针脚，CPU 供电与前置面板针脚均不通用。",
      psu: "电源在后下方，戴尔专用电源；不同代际针脚不同，不能跨机型互换。",
      cage: "硬盘架可整体上翻：掰开蓝色卡扣，硬盘笼向上翻出后再拔线。",
      odd: "戴尔塔式通常已取消光驱位，此处是导风罩/硬盘支架位置。",
      fan: "后置风扇 + CPU 导风罩组成风道；导风罩没装回会导致整机温度明显偏高。"
    },
    hp: {
      side: "ProDesk 侧板：后部一颗螺丝固定，拧下后向后推再掀开。",
      bezel: "前面板自下而上卡扣，底部两个卡舌先松，再整体向外掰。",
      board: "惠普定制主板：电源接口与前面板针脚非标，换件前务必核对机型代号。",
      psu: "电源在后上方，惠普非标电源；同功率不同代际也可能不通用。",
      cage: "硬盘笼在前方下层，需要先取下前面板才能抽出硬盘托架。",
      odd: "顶部 5.25 寸位可装光驱，也可换 3.5 寸硬盘托架做双盘位。",
      fan: "后置排气扇为主，部分机型前面板内侧还有一颗进风扇。"
    }
  }[brand];

  return [
    {
      id: "side-panel", name: "侧板", en: "Side Panel", color: "#8A939E",
      desc: B.side,
      faults: ["侧板装回后机箱异响（没卡到位）", "螺丝滑丝、卡扣断裂", "拆机后忘记接回机箱风扇线"],
      kb: "开机前确认侧板卡扣已到位——没卡好会形成风道短路，温度反而更高。",
      links: [
        { href: "./browse.html#ref-manual", label: "装机与运维手册（拆装）" },
        { href: "./search.html?q=风扇", label: "搜索：风扇 / 散热" }
      ],
      explode: [28, 0, 0]
    },
    {
      id: "front-bezel", name: "前面板", en: "Front Bezel", color: "#55606E",
      desc: B.bezel,
      faults: ["电源键按了没反应（排线没插）", "前置 USB 失灵", "卡扣断裂、面板松动"],
      kb: "拆前面板前先拍张照——电源键、前置 USB、音频的排线走向很容易装反。",
      links: [
        { href: "./fix/usb-drive-not-recognized.html", label: "USB 设备不识别" },
        { href: "./search.html?q=不加电", label: "搜索：不加电" }
      ],
      explode: [0, 0, 28]
    },
    {
      id: "mainboard", name: "主板", en: "Mainboard", color: "#0F766E",
      desc: B.board,
      faults: ["加电无显、风扇转但不亮机", "USB 与音频集体失效", "电容鼓包、进水腐蚀"],
      kb: "品牌机的「换主板」= 换整块非标板，价格和配型都要先跟客户说清楚。",
      links: [
        { href: "./fix/sop-bios-post-errors.html", label: "开机报错与 BIOS 速查" },
        { href: "./search.html?q=不加电", label: "搜索：不加电" }
      ],
      explode: [11, 1, 0]
    },
    {
      id: "cpu", name: "CPU 与散热器", en: "CPU & Cooler", color: "#FF8A6B",
      desc: "处理器 + 下压式散热器，台式机的散热器比笔记本大得多，拆装要断电并按对角松紧螺丝。",
      faults: ["开机风扇狂转无显示", "满载降频、温度瞬间破 90℃", "散热器压太紧导致不开机"],
      kb: "重装散热器必须重涂硅脂，并按对角线顺序上螺丝——一边拧到底会压裂 CPU 角。",
      links: [
        { href: "./search.html?q=发烫", label: "搜索：发烫 / 降频" },
        { href: "./fix/win-bluescreen-read-code.html", label: "电脑蓝屏了怎么办" }
      ],
      explode: [20, 11, -4]
    },
    {
      id: "ram", name: "内存条", en: "Memory (RAM)", color: "#A995FF",
      desc: "直插在主板内存槽上，卡扣向两侧掰开即可拔出。品牌机常见 2 槽，升级空间有限。",
      faults: ["内存识别不全 / 只有一半容量", "开机报警、反复重启", "蓝屏指向内存"],
      kb: "两条内存要插在同色插槽（通常是 2、4 槽）才能组双通道，插错会掉性能。",
      links: [
        { href: "./fix/win-bluescreen-read-code.html", label: "电脑蓝屏了怎么办" },
        { href: "./fix/win-slow-diagnose.html", label: "电脑越来越卡怎么办" }
      ],
      explode: [18, 3, 6]
    },
    {
      id: "gpu", name: "独立显卡", en: "Graphics Card", color: "#FF9278",
      desc: "插在 PCIe 槽上的长卡，尾部有供电线。品牌机多为核显，加装独显要先确认电源功率与卡长。",
      faults: ["开机无显、风扇转但不亮屏", "花屏 / 驱动频繁崩溃", "加装后整机功率不足"],
      kb: "加显卡前先算功率：品牌机电源通常只有 180–300W，且没有 6pin/8pin 供电线。",
      links: [
        { href: "./fix/monitor-no-signal.html", label: "显示器无信号" },
        { href: "./search.html?q=花屏", label: "搜索：花屏 / 闪屏" }
      ],
      explode: [24, -9, 2]
    },
    {
      id: "hdd", name: "机械硬盘", en: "3.5\" HDD", color: "#FFD84D",
      desc: B.cage,
      faults: ["咔咔响、识别不到", "开机极慢、频繁卡死", "SMART 报重映射扇区"],
      kb: "硬盘一旦开始咔咔响，先断电保数据——继续通电只会让磁头把盘片划得更狠。",
      links: [
        { href: "./fix/disk-clicking-failure.html", label: "硬盘咔咔响 / 识别不到" },
        { href: "./fix/win-c-drive-full-cleanup.html", label: "C 盘爆红怎么清理" }
      ],
      explode: [14, -16, 10]
    },
    {
      id: "ssd", name: "固态硬盘 / M.2", en: "SSD / M.2", color: "#7FE3C0",
      desc: "系统盘。台式机可以是 2.5 寸 SATA 盘，也可以是主板上的 M.2 条；后者拆装只需一颗螺丝。",
      faults: ["BIOS 里看不到硬盘", "掉盘、系统反复修复", "写入掉速、开机变慢"],
      kb: "M.2 装回去要压平再上螺丝，翘着装会导致接触不良、随机掉盘。",
      links: [
        { href: "./fix/disk-clicking-failure.html", label: "硬盘识别不到" },
        { href: "./fix/win-update-stuck.html", label: "Windows 更新卡住" }
      ],
      explode: [18, -10, 16]
    },
    {
      id: "psu", name: "电源", en: "Power Supply", color: "#A995FF",
      desc: B.psu,
      faults: ["整机不加电、无 5V 待机", "开机瞬间断电、风扇转一下就停", "电源异响、焦味"],
      kb: "换电源先核对两个参数：针脚定义（非标！）和额定功率，光看瓦数会装不上。",
      links: [
        { href: "./fix/sop-bios-post-errors.html", label: "不加电与开机报错" },
        { href: "./search.html?q=不加电", label: "搜索：不加电" }
      ],
      explode: [0, 0, -26]
    },
    {
      id: "case-fan", name: "机箱风扇", en: "Case Fan", color: "#79CFFF",
      desc: B.fan,
      faults: ["风扇异响 / 不转", "风扇转但风力很弱", "开机提示 CPU Fan Error"],
      kb: "清灰后手动拨一下扇叶确认能自由转动，再上电——卡死的风扇会直接报错停机。",
      links: [
        { href: "./search.html?q=风扇", label: "搜索：风扇异响" },
        { href: "./search.html?q=发烫", label: "搜索：电脑发烫" }
      ],
      explode: [0, 0, -18]
    },
    {
      id: "odd", name: "光驱位 / 扩展位", en: "Drive Bay", color: "#FFC7D9",
      desc: B.odd,
      faults: ["光驱不出仓、读盘失败", "改装硬盘托架后识别不到", "位面板挡板装不回"],
      kb: "光驱位现在更多用来加硬盘或前置接口，改装前确认 SATA 口和数据线够用。",
      links: [
        { href: "./browse.html#ref-manual", label: "装机与运维手册" },
        { href: "./fix/disk-clicking-failure.html", label: "硬盘识别不到" }
      ],
      explode: [0, 10, 20]
    }
  ];
}

window.FX_DEVICES.push({
  id: "lenovo", name: "联想", sub: "ThinkCentre · 塔式", kind: "tower",
  poster: "./img/hardware-poster-lenovo.webp",
  intro: "塔式机身，侧板向后推再掀开。联想最需要注意的是非标电源接口与前置面板排线走向。",
  parts: towerParts("lenovo")
});
window.FX_DEVICES.push({
  id: "dell", name: "戴尔", sub: "OptiPlex · 塔式", kind: "tower",
  poster: "./img/hardware-poster-dell.webp",
  intro: "侧板免工具、硬盘笼可上翻。戴尔定制主板的电源针脚与前置针脚都不通用，换件前先核对机型。",
  parts: towerParts("dell")
});
window.FX_DEVICES.push({
  id: "hp", name: "惠普", sub: "ProDesk · 塔式", kind: "tower",
  poster: "./img/hardware-poster-hp.webp",
  intro: "前面板自下而上卡扣、后部螺丝固定侧板。惠普的电源与前置面板同样是非标件，跨代际也不通用。",
  parts: towerParts("hp")
});

/* ============================================================
   三、零件 → 拆装 SOP 直达表
   ------------------------------------------------------------
   为什么要单独一张表：同一个零件在「笔记本」和「塔式主机」上的拆法完全不同，
   但落到的站点文章是同一批。这里只解决「点零件 → 去哪一篇」的映射，
   文章本身的机型差异写在各篇 SOP 里。
   · default：找不到专用条目时的兜底（装机与运维手册总览）
   · map：按零件 id 映射到最相关的那一篇 + 锚点说明
   ============================================================ */
window.FX_SOP = {
  default: { href: "./fix/sop-pe-usb-install.html", label: "装机与运维手册：拆装与换件总览" },
  map: {
    /* ---- 笔记本 ---- */
    lid:       { href: "./fix/sop-hardware-peripheral.html", label: "屏幕与显示：拆装、屏线、花屏" },
    hinge:     { href: "./fix/sop-hardware-peripheral.html", label: "屏轴与屏线：开合异响 / 闪屏" },
    keyboard:  { href: "./fix/sop-hardware-peripheral.html", label: "键盘与触控板：失灵与更换" },
    battery:   { href: "./fix/sop-billable-repair.html",     label: "电池与续航：不充电 / 鼓包处理" },
    mainboard: { href: "./fix/sop-pe-usb-install.html",      label: "主板与 BIOS：加电无显排查" },
    cpu:       { href: "./fix/sop-pe-usb-install.html",      label: "CPU 与散热：硅脂、散热器拆装" },
    ram:       { href: "./fix/sop-pe-usb-install.html",      label: "内存：检测、插拔与升级" },
    ssd:       { href: "./fix/sop-pe-usb-install.html",      label: "硬盘：检测、换盘与数据迁移" },
    fan:       { href: "./fix/sop-hardware-peripheral.html", label: "散热风扇：清灰与更换" },
    wifi:      { href: "./fix/sop-driver-image-misc.html",   label: "无线网卡：驱动、天线与换卡" },
    speaker:   { href: "./fix/sop-hardware-peripheral.html", label: "扬声器：单边无声与杂音" },
    ports:     { href: "./fix/sop-hardware-peripheral.html", label: "接口与排线：USB / 显示输出" },
    /* ---- 塔式主机 ---- */
    "side-panel":  { href: "./fix/sop-pe-usb-install.html",      label: "开箱与拆机：侧板、免工具结构" },
    "front-bezel": { href: "./fix/sop-pe-usb-install.html",      label: "前面板：卡扣、电源键与前置接口" },
    gpu:           { href: "./fix/sop-driver-image-misc.html",   label: "独立显卡：安装、供电与驱动" },
    hdd:           { href: "./fix/sop-pe-usb-install.html",      label: "机械硬盘：硬盘笼、换盘与迁移" },
    psu:           { href: "./fix/sop-pe-usb-install.html",      label: "电源：功率、针脚与更换" },
    "case-fan":    { href: "./fix/sop-hardware-peripheral.html", label: "机箱风扇：清灰、异响与风道" },
    odd:           { href: "./fix/sop-pe-usb-install.html",      label: "光驱位 / 扩展位：改装硬盘托架" }
  },
  /* 每台机型指向的「该机型拆装总览」入口。
     直接锚到 SOP 页的「处理明细」段——那里逐条列了该机型相关的全部拆装条目，
     和上面「零件级」链接区分开：一个是这块零件怎么拆，一个是整机全部条目。 */
  overview: {
    laptop: { href: "./fix/sop-pe-usb-install.html#处理明细", label: "笔记本装系统与拆装全部条目" },
    lenovo: { href: "./fix/sop-pe-usb-install.html#处理明细", label: "联想 ThinkCentre 拆装全部条目" },
    dell:   { href: "./fix/sop-pe-usb-install.html#处理明细", label: "戴尔 OptiPlex 拆装全部条目" },
    hp:     { href: "./fix/sop-pe-usb-install.html#处理明细", label: "惠普 ProDesk 拆装全部条目" }
  }
};

/* 兼容旧代码/调试：默认机型的零件 */
window.FX_PARTS = window.FX_DEVICES[0].parts;