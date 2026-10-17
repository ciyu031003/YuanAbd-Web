---
title: 开机报错与 BIOS 速查：不加电、报警、电池/时间错、密码与启动项
slug: sop-bios-post-errors
kind: reference
domain: ref-manual
category: ref-bios-secure
os: [Windows]
difficulty: 入门
time: 10-30 分钟
risk: 需谨慎
symptoms: [开机报错与 BIOS 速查 处理方法, SOP 参考]
keywords: [开机报错与 BIOS 速查 SOP, 不加电, 报警, 电池/时间错, 密码与启动项, 参考手册, 作业指导]
aliases: [SOP, 作业指导, 参考手册, 开机报错与 BIOS 速查]
updated: 2026-10-17
version: "1.0"
prerequisites: [能登录公司内部 SOP 知识库（部分原文需要账号）]
tools: [浏览器, 内部 SOP 知识库]
related: [sop-pe-usb-install, sop-macos-maintain, sop-diagnose-tools]
sources:
  - title: 公司 SOP 知识库 — Windows电脑不加电
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3120
    type: internal
  - title: 公司 SOP 知识库 — 开机进入恢复界面
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3041
    type: internal
  - title: 公司 SOP 知识库 — 无法登录账户报错PIN不可用
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3045
    type: internal
  - title: 公司 SOP 知识库 — 内存可用只有2G的处理方法
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3303
    type: internal
  - title: 公司 SOP 知识库 — 开机fan error
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3164
    type: internal
  - title: 公司 SOP 知识库 — Eagle安装后报错无法打开
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3337
    type: internal
  - title: Microsoft Learn — Windows 命令参考
    url: https://learn.microsoft.com/zh-cn/windows-server/administration/windows-commands/windows-commands
    type: official
  - title: Microsoft Support — Windows 帮助中心
    url: https://support.microsoft.com/zh-cn/windows
    type: official
reviewer: 内容组
reviewed_at: 2026-10-17
---

# 开机报错与 BIOS 速查：不加电、报警、电池/时间错、密码与启动项

## 快速概览

「开机开不了」在 SOP 里被拆成了十几条具体现象：不加电、加电无显、滴滴报警、fan error、

时间/电池报错、进 BIOS、AC power、脚本错误、登录报错……**先对上现象，再动手**，比盲目拆机快得多。

这一页按「上电 → 自检报错 → 进系统前 → 登录」的顺序排好这些条目。

本页共整理 **57** 条 SOP 条目，全部保留原始链接；处理细节以原文为准。

## 适用对象

处理开机类工单的现场工程师；遇到开不了机需要先给出判断的同事。

## 风险提示

> ⚠ 动手前请逐条核对；涉及数据、证件、客户设备安全的操作，先取得授权再执行。

1. 拆机、拔 BIOS 电池会**清除 BIOS 设置并可能导致固件锁/资产信息异常**，非必要不做。
2. BIOS 密码属于资产安全范畴，清除前必须确认资产归属与授权。
3. 报警声与报错代码要**先记录再处理**，否则后面无法复现、无法报单。

## 分步骤

### 步骤 1：能不能上电

**目的**：不加电是最常见的一类

**操作**：
1. 先换电源线与适配器，再释放静电（长按电源键 15 秒）。
2. 仍不加电 → 按「Windows电脑不加电」走，台式机按「台式电源故障判断方法」判断电源。
3. 加上电但无显示 → 「加电无显」，用外接显示器交叉验证。

**预期结果**：第 1 步的操作都完成后，问题现象能被复现或排除，并能对应到下面「原始 SOP」里的具体条目。

**失败怎么办**：对不上具体条目 → 回到「快速概览」确认现象描述，或按「仍需帮助」一节的说明升级。

### 步骤 2：自检阶段的报错

**目的**：报警声、fan error、时间/电池错、AC power

**操作**：
1. 滴滴报警：记报警节奏，按「开机滴滴报警」对照。
2. fan error：风扇被灰尘卡住或排线松动，先清灰。
3. 开机时间/电池报错：多为 CMOS 电池没电。
4. AC power 报错：适配器功率或非原装。
5. 反复重启/自动关机：按「自动开关机」与「系统更新反复重启」排查。

**预期结果**：第 2 步的操作都完成后，问题现象能被复现或排除，并能对应到下面「原始 SOP」里的具体条目。

**失败怎么办**：对不上具体条目 → 回到「快速概览」确认现象描述，或按「仍需帮助」一节的说明升级。

### 步骤 3：进系统前卡住

**目的**：进恢复界面、进 BIOS、启动项错

**操作**：
1. 开机直接进恢复界面 → 系统损坏或更新失败。
2. 开机进 BIOS/启动选项 → 启动项丢失或硬盘识别异常。
3. 「修改 BIOS 无效，启动项设置错误」要结合 UEFI/GPT 对应关系检查。

**预期结果**：第 3 步的操作都完成后，问题现象能被复现或排除，并能对应到下面「原始 SOP」里的具体条目。

**失败怎么办**：对不上具体条目 → 回到「快速概览」确认现象描述，或按「仍需帮助」一节的说明升级。

### 步骤 4：能进系统但登录/应用报错

**目的**：登录报错与开机弹窗

**操作**：
1. PIN 不可用、无法登录到你的账户 → 账户或网络问题。
2. 开机弹出脚本错误 / MigHost.exe 报错 → 启动项残留。
3. 开机慢、桌面卡半分钟 → 「Windows开机慢」。

**预期结果**：第 4 步的操作都完成后，问题现象能被复现或排除，并能对应到下面「原始 SOP」里的具体条目。

**失败怎么办**：对不上具体条目 → 回到「快速概览」确认现象描述，或按「仍需帮助」一节的说明升级。

## 原始 SOP

下表的「原文」全部指向公司 SOP 知识库（需要内部账号登录）。点击即可核对处理步骤、截图与注意事项。

| 条目 | 是什么 / 什么时候用 | 一句话提醒 | 原文 |
|---|---|---|---|
| Windows电脑不加电 | 按电源没反应。 | 先换线与适配器 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3120) |
| Windows电脑加电无显 | 有风扇声没画面。 | 外接屏判断是否屏幕问题 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3121) |
| 戴尔3490拔过BIOS电池后加电无显 | 特定机型加电无显。 | 按原文恢复 BIOS 设置 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3281) |
| 开机蓝屏 | 一开机就蓝屏。 | 先记代码 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3123) |
| 使用中蓝屏 | 用着用着蓝屏。 | 看最近安装的驱动/更新 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3127) |
| 因社保费管理客户端导致蓝屏黑屏 | 特定软件冲突导致蓝屏。 | 卸载或升级该客户端 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3159) |
| 蓝屏-8852BE网卡驱动处理方法 | 网卡驱动导致的蓝屏。 | 回滚/更新网卡驱动 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2851) |
| 使用中黑屏 | 用着用着黑屏。 | 区分是显示问题还是主机死机 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3126) |
| 开机滴滴报警 | POST 报警声。 | 记录报警节奏 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3138) |
| 开机进入恢复界面 | 自动进恢复环境。 | 多为系统损坏或更新中断 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3041) |
| 开机fan error | 风扇报错。 | 先清灰再看排线 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3042) |
| 开机时间报错 | 时间/CMOS 错。 | 换 CMOS 电池 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3043) |
| 开机电池报错 | 电池报警。 | 确认是否原装 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3044) |
| 开机报错进BIOS界面或启动选项 | 自动进 BIOS/启动菜单。 | 检查启动顺序与硬盘识别 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3151) |
| 惠普TP01 2022开机报警 | 惠普 TP01 报警。 | 对照原文代码 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3389) |
| S01电脑清除BIOS方法BIOS有密码 | S01 BIOS 密码清除。 | 确认授权后操作 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3305) |
| 笔记本BIOS密码破解方法 | 笔记本 BIOS 密码。 | 合规前提下操作 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3320) |
| 开机报非原装HP电池 | 非原装电池报警。 | 换回原装电池 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3287) |
| 无法登录账户报错PIN不可用 | PIN 不可用。 | 联网后重新验证 PIN | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3045) |
| 开机提示无法登陆到你的账户 | 登录失败。 | 检查账户状态与网络 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3241) |
| 开机报错AC power | 适配器功率报错。 | 用原装适配器 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3046) |
| 系统开机报MigHost.exe | MigHost 报错。 | 清理启动项/修复组件 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3298) |
| win开机其他报错 | 其他开机报错汇总。 | 截图后对照原文 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3047) |
| 修改BIOS无效，启动项设置错误 | 启动项设置错误。 | 结合 UEFI/GPT 关系检查 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3304) |
| win10开机弹出脚本错误 | 开机脚本报错。 | 查启动文件夹与任务计划 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3158) |
| 系统更新反复重启解决方法 | 更新后反复重启。 | 进安全模式停止更新服务 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3282) |
| Windows系统运行卡慢 | 系统整体卡慢。 | 先看资源占用 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3116) |
| 内存可用只有2G的处理方法 | 可用内存异常少。 | 检查系统位宽与内存识别 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3303) |
| 昭阳X3降频导致卡慢 | 机型性降频。 | 按原文调整策略 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3137) |
| Windows开机慢 | 开机耗时过长。 | 关启动项、换 SSD | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2948) |
| Windows办公软件慢 | Office/WPS 慢。 | 看插件与加载项 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3117) |
| Windows自动开关机 | 自动重启/关机。 | 查电源设置与事件日志 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3128) |
| Windows死机 | 系统卡死。 | 先看是否有 DMP | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3125) |
| 直播慢处理方法 | 直播卡顿。 | 带宽与推流设置 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2965) |
| 剪辑/图像处理慢 | 剪辑渲染慢。 | 看显卡驱动与硬件加速 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3118) |
| 开机滴滴报警 | 报警声的另一处索引。 | 记录报警节奏再对照 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3138) |
| 开机fan error | 培训用版本的风扇报错条目。 | 与 3042 同一主题 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3164) |
| 开机时间报错 | 培训用版本的时间报错条目。 | CMOS 电池 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3165) |
| 开机报错进BIOS界面或启动选项 | 培训用版本的启动项条目。 | 检查启动顺序 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3163) |
| 开机进入恢复界面 | 培训用版本的恢复界面条目。 | 系统损坏 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3162) |
| 苹果开机问号 | Mac 开机问号（跨平台对照）。 | 见 Mac 页 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3048) |
| 电脑中病毒的现象和处理方法 | 中毒现象判断。 | 先断网 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3230) |
| 电脑中勒索病毒 | 勒索病毒处置。 | 断网断电，别重装 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3300) |
| CAD打开卡死无响应处理方法 | CAD 打开卡死。 | 清缓存、换显卡驱动模式 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3292) |
| WPS无法运行VBA支持库 | WPS VBA 缺失。 | 安装对应组件包 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3295) |
| Eagle安装后报错无法打开 | 特定软件安装报错。 | 按原文排查环境依赖 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3337) |
| H610主板无法开启bitlocker加密解决方法： | 主板层面的 BitLocker 问题。 | 先确认 TPM 与安全启动 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3278) |
| 其他无法开启bitlocker的解决方法： | 通用 BitLocker 启用失败。 | 检查磁盘分区与账户类型 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3242) |
| AP22安装Ubuntu22.04显卡驱动+cuda教程 | Ubuntu 驱动与 CUDA。 | 注意驱动与内核版本对应 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3288) |
| 惠普S01主板差别和USB设置 | S01 主板 USB 设置。 | USB 异常先查这里 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3327) |
| 常见SN序列号样式 | 序列号核对。 | 报单前确认 SN | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3301) |
| 显示颜色有色差 | 色差问题。 | 先校色再判断是否硬件 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3296) |
| 惠普640G10冷暖屏调整方法 | 机型性色温差异。 | 按原文调色温 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3291) |
| 苹果m芯片连接戴尔显示器闪烁 | M 芯片外接闪烁。 | 换线/调刷新率 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3357) |
| 浏览器打开网页的视频有声音无画面处理方法 | 网页视频有声音无画面。 | 关闭硬件加速试试 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3390) |
| BOSS直聘预览简历字体模糊/展示不全 | 特定网页显示异常。 | 多为字体渲染与缩放问题 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3284) |
| 企微聊天记录损坏无法识别修复方法 | 企业微信数据损坏。 | 先备份数据目录再修复 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3240) |

## 处理明细

上表是把条目「按顺序摊开」；这一节给每一条一条带编号的明细，写入工单时可以直接引用编号，例如「按 SOP 第 12 条的步骤处理」。

### 01｜Windows电脑不加电
**是什么**：按电源没反应。

- 提醒：先换线与适配器

**原文**：[Windows电脑不加电](https://mvs-h5.edianzu.cn/tips-detail?id=3120)

### 02｜Windows电脑加电无显
**是什么**：有风扇声没画面。

- 提醒：外接屏判断是否屏幕问题

**原文**：[Windows电脑加电无显](https://mvs-h5.edianzu.cn/tips-detail?id=3121)

### 03｜戴尔3490拔过BIOS电池后加电无显
**是什么**：特定机型加电无显。

- 提醒：按原文恢复 BIOS 设置

**原文**：[戴尔3490拔过BIOS电池后加电无显](https://mvs-h5.edianzu.cn/tips-detail?id=3281)

### 04｜开机蓝屏
**是什么**：一开机就蓝屏。

- 提醒：先记代码

**原文**：[开机蓝屏](https://mvs-h5.edianzu.cn/tips-detail?id=3123)

### 05｜使用中蓝屏
**是什么**：用着用着蓝屏。

- 提醒：看最近安装的驱动/更新

**原文**：[使用中蓝屏](https://mvs-h5.edianzu.cn/tips-detail?id=3127)

### 06｜因社保费管理客户端导致蓝屏黑屏
**是什么**：特定软件冲突导致蓝屏。

- 提醒：卸载或升级该客户端

**原文**：[因社保费管理客户端导致蓝屏黑屏](https://mvs-h5.edianzu.cn/tips-detail?id=3159)

### 07｜蓝屏-8852BE网卡驱动处理方法
**是什么**：网卡驱动导致的蓝屏。

- 提醒：回滚/更新网卡驱动

**原文**：[蓝屏-8852BE网卡驱动处理方法](https://mvs-h5.edianzu.cn/tips-detail?id=2851)

### 08｜使用中黑屏
**是什么**：用着用着黑屏。

- 提醒：区分是显示问题还是主机死机

**原文**：[使用中黑屏](https://mvs-h5.edianzu.cn/tips-detail?id=3126)

### 09｜开机滴滴报警
**是什么**：POST 报警声。

- 提醒：记录报警节奏

**原文**：[开机滴滴报警](https://mvs-h5.edianzu.cn/tips-detail?id=3138)

### 10｜开机进入恢复界面
**是什么**：自动进恢复环境。

- 提醒：多为系统损坏或更新中断

**原文**：[开机进入恢复界面](https://mvs-h5.edianzu.cn/tips-detail?id=3041)

### 11｜开机fan error
**是什么**：风扇报错。

- 提醒：先清灰再看排线

**原文**：[开机fan error](https://mvs-h5.edianzu.cn/tips-detail?id=3042)

### 12｜开机时间报错
**是什么**：时间/CMOS 错。

- 提醒：换 CMOS 电池

**原文**：[开机时间报错](https://mvs-h5.edianzu.cn/tips-detail?id=3043)

### 13｜开机电池报错
**是什么**：电池报警。

- 提醒：确认是否原装

**原文**：[开机电池报错](https://mvs-h5.edianzu.cn/tips-detail?id=3044)

### 14｜开机报错进BIOS界面或启动选项
**是什么**：自动进 BIOS/启动菜单。

- 提醒：检查启动顺序与硬盘识别

**原文**：[开机报错进BIOS界面或启动选项](https://mvs-h5.edianzu.cn/tips-detail?id=3151)

### 15｜惠普TP01 2022开机报警
**是什么**：惠普 TP01 报警。

- 提醒：对照原文代码

**原文**：[惠普TP01 2022开机报警](https://mvs-h5.edianzu.cn/tips-detail?id=3389)

### 16｜S01电脑清除BIOS方法BIOS有密码
**是什么**：S01 BIOS 密码清除。

- 提醒：确认授权后操作

**原文**：[S01电脑清除BIOS方法BIOS有密码](https://mvs-h5.edianzu.cn/tips-detail?id=3305)

### 17｜笔记本BIOS密码破解方法
**是什么**：笔记本 BIOS 密码。

- 提醒：合规前提下操作

**原文**：[笔记本BIOS密码破解方法](https://mvs-h5.edianzu.cn/tips-detail?id=3320)

### 18｜开机报非原装HP电池
**是什么**：非原装电池报警。

- 提醒：换回原装电池

**原文**：[开机报非原装HP电池](https://mvs-h5.edianzu.cn/tips-detail?id=3287)

### 19｜无法登录账户报错PIN不可用
**是什么**：PIN 不可用。

- 提醒：联网后重新验证 PIN

**原文**：[无法登录账户报错PIN不可用](https://mvs-h5.edianzu.cn/tips-detail?id=3045)

### 20｜开机提示无法登陆到你的账户
**是什么**：登录失败。

- 提醒：检查账户状态与网络

**原文**：[开机提示无法登陆到你的账户](https://mvs-h5.edianzu.cn/tips-detail?id=3241)

### 21｜开机报错AC power
**是什么**：适配器功率报错。

- 提醒：用原装适配器

**原文**：[开机报错AC power](https://mvs-h5.edianzu.cn/tips-detail?id=3046)

### 22｜系统开机报MigHost.exe
**是什么**：MigHost 报错。

- 提醒：清理启动项/修复组件

**原文**：[系统开机报MigHost.exe](https://mvs-h5.edianzu.cn/tips-detail?id=3298)

### 23｜win开机其他报错
**是什么**：其他开机报错汇总。

- 提醒：截图后对照原文

**原文**：[win开机其他报错](https://mvs-h5.edianzu.cn/tips-detail?id=3047)

### 24｜修改BIOS无效，启动项设置错误
**是什么**：启动项设置错误。

- 提醒：结合 UEFI/GPT 关系检查

**原文**：[修改BIOS无效，启动项设置错误](https://mvs-h5.edianzu.cn/tips-detail?id=3304)

### 25｜win10开机弹出脚本错误
**是什么**：开机脚本报错。

- 提醒：查启动文件夹与任务计划

**原文**：[win10开机弹出脚本错误](https://mvs-h5.edianzu.cn/tips-detail?id=3158)

### 26｜系统更新反复重启解决方法
**是什么**：更新后反复重启。

- 提醒：进安全模式停止更新服务

**原文**：[系统更新反复重启解决方法](https://mvs-h5.edianzu.cn/tips-detail?id=3282)

### 27｜Windows系统运行卡慢
**是什么**：系统整体卡慢。

- 提醒：先看资源占用

**原文**：[Windows系统运行卡慢](https://mvs-h5.edianzu.cn/tips-detail?id=3116)

### 28｜内存可用只有2G的处理方法
**是什么**：可用内存异常少。

- 提醒：检查系统位宽与内存识别

**原文**：[内存可用只有2G的处理方法](https://mvs-h5.edianzu.cn/tips-detail?id=3303)

### 29｜昭阳X3降频导致卡慢
**是什么**：机型性降频。

- 提醒：按原文调整策略

**原文**：[昭阳X3降频导致卡慢](https://mvs-h5.edianzu.cn/tips-detail?id=3137)

### 30｜Windows开机慢
**是什么**：开机耗时过长。

- 提醒：关启动项、换 SSD

**原文**：[Windows开机慢](https://mvs-h5.edianzu.cn/tips-detail?id=2948)

### 31｜Windows办公软件慢
**是什么**：Office/WPS 慢。

- 提醒：看插件与加载项

**原文**：[Windows办公软件慢](https://mvs-h5.edianzu.cn/tips-detail?id=3117)

### 32｜Windows自动开关机
**是什么**：自动重启/关机。

- 提醒：查电源设置与事件日志

**原文**：[Windows自动开关机](https://mvs-h5.edianzu.cn/tips-detail?id=3128)

### 33｜Windows死机
**是什么**：系统卡死。

- 提醒：先看是否有 DMP

**原文**：[Windows死机](https://mvs-h5.edianzu.cn/tips-detail?id=3125)

### 34｜直播慢处理方法
**是什么**：直播卡顿。

- 提醒：带宽与推流设置

**原文**：[直播慢处理方法](https://mvs-h5.edianzu.cn/tips-detail?id=2965)

### 35｜剪辑/图像处理慢
**是什么**：剪辑渲染慢。

- 提醒：看显卡驱动与硬件加速

**原文**：[剪辑/图像处理慢](https://mvs-h5.edianzu.cn/tips-detail?id=3118)

### 36｜开机滴滴报警
**是什么**：报警声的另一处索引。

- 提醒：记录报警节奏再对照

**原文**：[开机滴滴报警](https://mvs-h5.edianzu.cn/tips-detail?id=3138)

### 37｜开机fan error
**是什么**：培训用版本的风扇报错条目。

- 提醒：与 3042 同一主题

**原文**：[开机fan error](https://mvs-h5.edianzu.cn/tips-detail?id=3164)

### 38｜开机时间报错
**是什么**：培训用版本的时间报错条目。

- 提醒：CMOS 电池

**原文**：[开机时间报错](https://mvs-h5.edianzu.cn/tips-detail?id=3165)

### 39｜开机报错进BIOS界面或启动选项
**是什么**：培训用版本的启动项条目。

- 提醒：检查启动顺序

**原文**：[开机报错进BIOS界面或启动选项](https://mvs-h5.edianzu.cn/tips-detail?id=3163)

### 40｜开机进入恢复界面
**是什么**：培训用版本的恢复界面条目。

- 提醒：系统损坏

**原文**：[开机进入恢复界面](https://mvs-h5.edianzu.cn/tips-detail?id=3162)

### 41｜苹果开机问号
**是什么**：Mac 开机问号（跨平台对照）。

- 提醒：见 Mac 页

**原文**：[苹果开机问号](https://mvs-h5.edianzu.cn/tips-detail?id=3048)

### 42｜电脑中病毒的现象和处理方法
**是什么**：中毒现象判断。

- 提醒：先断网

**原文**：[电脑中病毒的现象和处理方法](https://mvs-h5.edianzu.cn/tips-detail?id=3230)

### 43｜电脑中勒索病毒
**是什么**：勒索病毒处置。

- 提醒：断网断电，别重装

**原文**：[电脑中勒索病毒](https://mvs-h5.edianzu.cn/tips-detail?id=3300)

### 44｜CAD打开卡死无响应处理方法
**是什么**：CAD 打开卡死。

- 提醒：清缓存、换显卡驱动模式

**原文**：[CAD打开卡死无响应处理方法](https://mvs-h5.edianzu.cn/tips-detail?id=3292)

### 45｜WPS无法运行VBA支持库
**是什么**：WPS VBA 缺失。

- 提醒：安装对应组件包

**原文**：[WPS无法运行VBA支持库](https://mvs-h5.edianzu.cn/tips-detail?id=3295)

### 46｜Eagle安装后报错无法打开
**是什么**：特定软件安装报错。

- 提醒：按原文排查环境依赖

**原文**：[Eagle安装后报错无法打开](https://mvs-h5.edianzu.cn/tips-detail?id=3337)

### 47｜H610主板无法开启bitlocker加密解决方法：
**是什么**：主板层面的 BitLocker 问题。

- 提醒：先确认 TPM 与安全启动

**原文**：[H610主板无法开启bitlocker加密解决方法：](https://mvs-h5.edianzu.cn/tips-detail?id=3278)

### 48｜其他无法开启bitlocker的解决方法：
**是什么**：通用 BitLocker 启用失败。

- 提醒：检查磁盘分区与账户类型

**原文**：[其他无法开启bitlocker的解决方法：](https://mvs-h5.edianzu.cn/tips-detail?id=3242)

### 49｜AP22安装Ubuntu22.04显卡驱动+cuda教程
**是什么**：Ubuntu 驱动与 CUDA。

- 提醒：注意驱动与内核版本对应

**原文**：[AP22安装Ubuntu22.04显卡驱动+cuda教程](https://mvs-h5.edianzu.cn/tips-detail?id=3288)

### 50｜惠普S01主板差别和USB设置
**是什么**：S01 主板 USB 设置。

- 提醒：USB 异常先查这里

**原文**：[惠普S01主板差别和USB设置](https://mvs-h5.edianzu.cn/tips-detail?id=3327)

### 51｜常见SN序列号样式
**是什么**：序列号核对。

- 提醒：报单前确认 SN

**原文**：[常见SN序列号样式](https://mvs-h5.edianzu.cn/tips-detail?id=3301)

### 52｜显示颜色有色差
**是什么**：色差问题。

- 提醒：先校色再判断是否硬件

**原文**：[显示颜色有色差](https://mvs-h5.edianzu.cn/tips-detail?id=3296)

### 53｜惠普640G10冷暖屏调整方法
**是什么**：机型性色温差异。

- 提醒：按原文调色温

**原文**：[惠普640G10冷暖屏调整方法](https://mvs-h5.edianzu.cn/tips-detail?id=3291)

### 54｜苹果m芯片连接戴尔显示器闪烁
**是什么**：M 芯片外接闪烁。

- 提醒：换线/调刷新率

**原文**：[苹果m芯片连接戴尔显示器闪烁](https://mvs-h5.edianzu.cn/tips-detail?id=3357)

### 55｜浏览器打开网页的视频有声音无画面处理方法
**是什么**：网页视频有声音无画面。

- 提醒：关闭硬件加速试试

**原文**：[浏览器打开网页的视频有声音无画面处理方法](https://mvs-h5.edianzu.cn/tips-detail?id=3390)

### 56｜BOSS直聘预览简历字体模糊/展示不全
**是什么**：特定网页显示异常。

- 提醒：多为字体渲染与缩放问题

**原文**：[BOSS直聘预览简历字体模糊/展示不全](https://mvs-h5.edianzu.cn/tips-detail?id=3284)

### 57｜企微聊天记录损坏无法识别修复方法
**是什么**：企业微信数据损坏。

- 提醒：先备份数据目录再修复

**原文**：[企微聊天记录损坏无法识别修复方法](https://mvs-h5.edianzu.cn/tips-detail?id=3240)

## 仍需帮助

- 原文能对上但做不下去：按「工单升级方法」带上截图与现象升级，不要在客户现场硬试。
- 本文与原文不一致：以原文为准，并在「纠错与反馈」告诉我们，我们会回来更新这份索引。
- 需要看具体的排障思路，而不是 SOP 索引：去「领域」页找对应的故障教程。
