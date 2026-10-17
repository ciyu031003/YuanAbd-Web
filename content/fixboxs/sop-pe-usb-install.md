---
title: PE 制作与系统安装速查：PE 盘、多合一、U 盘与在线安装
slug: sop-pe-usb-install
kind: reference
domain: ref-manual
category: ref-os
os: [Windows, macOS]
difficulty: 入门
time: 10-30 分钟
risk: 需谨慎
symptoms: [PE 制作与系统安装速查 处理方法, SOP 参考]
keywords: [PE 制作与系统安装速查 SOP, PE 盘, 多合一, U 盘与在线安装, 参考手册, 作业指导]
aliases: [SOP, 作业指导, 参考手册, PE 制作与系统安装速查]
updated: 2026-10-17
version: "1.0"
prerequisites: [能登录公司内部 SOP 知识库（部分原文需要账号）]
tools: [浏览器, 内部 SOP 知识库]
related: [sop-macos-maintain, sop-diagnose-tools, sop-printer-connected-fix]
sources:
  - title: 公司 SOP 知识库 — PE的制作与使用
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3050
    type: internal
  - title: 公司 SOP 知识库 — 修复系统方法
    url: https://mvs-h5.edianzu.cn/tips-detail?id=2928
    type: internal
  - title: 公司 SOP 知识库 — 清CMOS/BIOS方法
    url: https://mvs-h5.edianzu.cn/tips-detail?id=2902
    type: internal
  - title: 公司 SOP 知识库 — 闪克使用方法
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3023
    type: internal
  - title: 公司 SOP 知识库 — 禁用USB方法
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3234
    type: internal
  - title: 公司 SOP 知识库 — 易点云AI AH等自主研发设备驱动、镜像下载
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3135
    type: internal
  - title: Apple 支持 — Mac 使用手册
    url: https://support.apple.com/zh-cn/guide/mac-help/welcome/mac
    type: official
  - title: Apple 支持 — 在 Mac 上使用「磁盘工具」
    url: https://support.apple.com/zh-cn/guide/disk-utility/welcome/mac
    type: official
reviewer: 内容组
reviewed_at: 2026-10-17
---

# PE 制作与系统安装速查：PE 盘、多合一、U 盘与在线安装

## 快速概览

装系统是桌面运维最高频的动作，也最容易翻车：PE 不认硬盘、引导不对、装完没有驱动。

这一页把 SOP 里「PE 制作 → 进 PE → 分区 → 装系统 → 修复」的 40 多条原文链接按顺序排好，

先按「先做哪一步」的顺序读，再点原文看具体截图。

本页共整理 **123** 条 SOP 条目，全部保留原始链接；处理细节以原文为准。

## 适用对象

新入职工程师、需要重装系统的现场同学、临时被拉去帮忙的同事。

## 风险提示

> ⚠ 动手前请逐条核对；涉及数据、证件、客户设备安全的操作，先取得授权再执行。

1. 重装、格式化、分区都会**清空数据**：动手前必须完成数据备份并让客户签字确认。
2. PE 和镜像只从公司内部分享（「必备工具下载」「易点云镜像下载」）获取，不要用第三方网站的「一键装机」盘。
3. 联想、华为等品牌机开启了安全启动（Secure Boot）时可能进不去 PE，需要在 BIOS 里临时关闭。

## 分步骤

### 步骤 1：准备工具

**目的**：先确认手上有没有能用的 PE 盘和原版镜像

**操作**：
1. 制作 PE：单系统用「PE 的制作与使用」，需要一次覆盖多机型就做「多合一 PE」。
2. 确认启动快捷键：「多品牌电脑选择 PE 启动的快捷键」，避免挨个试 F12/F2/ESC。
3. 镜像与驱动从「易点云镜像&客户专用镜像下载」和「易点云设备驱动、镜像下载」拿，版本要与机型匹配。

**预期结果**：第 1 步的操作都完成后，问题现象能被复现或排除，并能对应到下面「原始 SOP」里的具体条目。

**失败怎么办**：对不上具体条目 → 回到「快速概览」确认现象描述，或按「仍需帮助」一节的说明升级。

### 步骤 2：进 PE 并确认硬盘可见

**目的**：PE 进不去或进去看不到硬盘，是安装卡住的两个主要原因

**操作**：
1. 进不去：先查快捷键，再检查安全启动与 U 盘接口（优先用 USB 2.0 口）。
2. 看不到硬盘：新平台（11 代以后）常缺 Intel VMD/RST 驱动，按「在 PE 无法识别硬盘的解决方法」补驱动；也可能是 SATA 模式设置成了 RAID。
3. 进 PE 后用 DG（DiskGenius）先确认分区表类型：UEFI 对应 GPT，Legacy 对应 MBR，见「UEFI 设置与硬盘分区表类型对应关系」。

**预期结果**：第 2 步的操作都完成后，问题现象能被复现或排除，并能对应到下面「原始 SOP」里的具体条目。

**失败怎么办**：对不上具体条目 → 回到「快速概览」确认现象描述，或按「仍需帮助」一节的说明升级。

### 步骤 3：分区与引导

**目的**：分区做对，后面就不用返工

**操作**：
1. 整盘重装：在 DG 里先转换分区表类型，再重新分区；只调大小用「分区扩大和修改方法」或系统自带的「磁盘管理」。
2. 装双系统或系统盘被误删：用「Windows 系统引导修复」重建引导，必要时用「Windows 系统删除引导项方法」清理多余项。

**预期结果**：第 3 步的操作都完成后，问题现象能被复现或排除，并能对应到下面「原始 SOP」里的具体条目。

**失败怎么办**：对不上具体条目 → 回到「快速概览」确认现象描述，或按「仍需帮助」一节的说明升级。

### 步骤 4：安装系统

**目的**：按场景选一种安装方式

**操作**：
1. 常规：U 盘原版镜像安装（「Windows 安装系统方法」）。
2. PE 内安装：「使用 PE 安装系统方法」。
3. 没有 U 盘：可以走「在线安装系统方法」「MSDN 安装系统方法」「云装机安装系统使用方法」。
4. 保留数据/恢复出厂：优先用「易点云一键还原使用方法」「无 U 盘重置电脑」，而不是直接格式化。

**预期结果**：第 4 步的操作都完成后，问题现象能被复现或排除，并能对应到下面「原始 SOP」里的具体条目。

**失败怎么办**：对不上具体条目 → 回到「快速概览」确认现象描述，或按「仍需帮助」一节的说明升级。

### 步骤 5：装完收尾

**目的**：系统起来只是第一步，驱动、激活、账户都要跟上

**操作**：
1. 装驱动：优先官方驱动，联想机型可用「联想电脑管家」；显卡驱动卸载干净再装（「显卡驱动卸载方法」）。
2. 首次开机跳过联网：「Windows11 跳过联网使用本地账户方法」，避免被强制绑微软账户。
3. 创建微软账户、重置 PIN：见「微软账户创建方法及PIN码忘记处理方法」。
4. 出问题回退：「Windows创建系统还原点和恢复还原点」「使用安装U盘修复系统方法」。

**预期结果**：第 5 步的操作都完成后，问题现象能被复现或排除，并能对应到下面「原始 SOP」里的具体条目。

**失败怎么办**：对不上具体条目 → 回到「快速概览」确认现象描述，或按「仍需帮助」一节的说明升级。

## 原始 SOP

下表的「原文」全部指向公司 SOP 知识库（需要内部账号登录）。点击即可核对处理步骤、截图与注意事项。

| 条目 | 是什么 / 什么时候用 | 一句话提醒 | 原文 |
|---|---|---|---|
| PE的制作与使用 | 最基础的一份：怎么做一只可启动 PE 盘、怎么进 PE。 | 优先做 64 位 PE，老机型再补一个 32 位 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3050) |
| 多合一PE制作方法 | 把多个 PE 和多个系统镜像做进同一只 U 盘，适合一次跑多个客户点。 | 体积大，建议 128G 以上高速 U 盘 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2900) |
| U盘魔术师常见问题及解决方案 | PE 制作失败、启动报错时的对照表。 | 做盘失败先换 U 盘和接口，再怀疑工具 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3160) |
| 无法使用PE启动电脑 | 插了 PE 盘但开机不进 PE 的排查路径。 | 先查启动快捷键，再关安全启动 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2920) |
| 多品牌电脑选择PE启动的快捷键 | 联想/戴尔/惠普/华硕/机械革命等品牌的 F 键对照。 | 开机一瞬间连按，别长按不放 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2921) |
| PE进入与DG分区工具使用 | 进 PE 之后的第一站：DG 的常用操作。 | 先备份分区表再动手 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3052) |
| 分区扩大和修改方法 | C 盘不够用时的扩分区流程。 | 相邻分区才有空间可扩 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3099) |
| 系统自带磁盘管理进行分区 | 不依赖第三方工具的分区方式。 | 压缩卷只能压缩连续空闲空间 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3101) |
| 在系统下使用DG和磁盘管理修改分区大小 | 在运行中的系统里调分区。 | 操作前先关掉占用该盘的软件 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3100) |
| 硬盘分区 | 从零分区：分区表类型、分区数量与大小。 | 系统盘建议 200G 起，留 15% 空闲 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3232) |
| 螺丝滑丝 | 拆机时螺丝拧花了的处理。 | 别硬拧，先上润滑油或换批头 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3051) |
| Windows系统引导修复 | 开机引导丢失时的修复。 | 修复前先确认分区表类型没被改过 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2937) |
| Windows系统删除引导项方法 | 清理启动项里重复/无效的系统。 | 只删确认不用的项 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3090) |
| Windows硬盘检测方法 | 判断硬盘是否健康、是否需要更换。 | 先看 SMART，再看坏道扫描 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2932) |
| 硬盘掉速修复方法 | 用一段时间就变慢的「掉速盘」处理。 | 掉速盘大概率是固件问题，建议直接换 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3325) |
| DiskFresh使用方法 | 通过重写数据恢复机械/固态盘的读取速度。 | 本质是整盘读写，耗时数小时 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3355) |
| 复磁盘修复硬盘命令 | 命令行层面的硬盘修复。 | 命令行修复前务必先备份 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3385) |
| 虚拟内存调整方法 | 内存不足时用页面文件兜底。 | 物理内存够就不要盲目加大 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3356) |
| 内存检测方法 | 判断是不是内存条的问题。 | mdsched 或 MemTest 至少跑一轮 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2933) |
| 电脑温度检测方法 | 看 CPU/GPU 温度判断是否降频发热。 | 待机超过 70℃ 基本就是散热问题 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2949) |
| 修复系统方法 | 系统文件损坏、功能异常时的修复。 | sfc 与 DISM 组合使用 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2928) |
| 在PE无法识别硬盘的解决方法 | PE 里看不到硬盘的专门解法。 | 新平台缺 VMD/RST 驱动最常见 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2967) |
| 在PE注入硬盘驱动方法 | 把 VMD/RST 驱动注入 PE，让 PE 认出新平台的硬盘。 | 注入后重新制作启动盘 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2967) |
| Windows安装系统方法 | U 盘原版镜像安装的标准流程。 | UEFI+GPT 是当前主流组合 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3302) |
| 使用PE安装系统方法 | 在 PE 里用安装器装系统。 | 装完记得修复引导 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3103) |
| 在线安装系统方法 | 没有 U 盘时的网络安装。 | 耗时取决于网速，建议有线网络 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3324) |
| MSDN安装系统方法 | 基于 MSDN 原版镜像的安装。 | 只从官方/内部可信渠道取镜像 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3104) |
| 易点云一键还原使用方法 | 客户机器恢复出厂或恢复镜像。 | 执行前确认数据已备份 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3105) |
| 云装机安装系统使用方法 | 远程方式装机。 | 网络不稳时容易中断，先测试链路 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3106) |
| 原版镜像设置方法及驱动安装方法 | 原版镜像的自定义与驱动安装。 | 驱动顺序：芯片组 → 显卡 → 其他 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3107) |
| Windows创建系统还原点和恢复还原点 | 大动作前先做还原点。 | 还原点不替代数据备份 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3144) |
| 无U盘重置电脑 | 没有 U 盘时重置系统。 | 会清空用户程序，先备份 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3145) |
| 使用安装U盘修复系统方法 | 系统坏了但不想重装。 | 修复成功率低于重装，需提前说明 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3147) |
| 创建微软官方安装系统U盘 | 用微软官方工具做安装盘。 | 会格式化 U 盘 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3148) |
| 系统格式化 | 格式化系统盘并重装的完整流程。 | 格式化不可逆，务必二次确认 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3226) |
| 微软账户创建方法及PIN码忘记处理方法 | 账户与 PIN 的创建、找回。 | 找回 PIN 需要能联网 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3108) |
| 必备工具下载 | 内部工具与常用软件合集（提取码 ds6i）。 | 只从内部链接下载，别用搜索引擎找同名工具 | [原文](https://pan.baidu.com/s/1KNT3EMqOYPaUYA20IHqNcA?pwd=ds6i) |
| 易点云镜像&客户专用镜像下载 | 装机镜像与客户专用镜像（提取码 33kd）。 | 客户专用镜像需按客户编号对齐 | [原文](https://pan.baidu.com/s/10NISXe43AjnETVYnF7ZoDg?pwd=33kd) |
| 一键部署易点云PE | 公司统一下发的 PE 部署方式。 | 优先用官方 PE，问题最少 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3154) |
| 释放静电方法 | 不加电、开机异常的常见前置处理。 | 拔电源、长按电源键 15 秒 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2903) |
| 清CMOS/BIOS方法 | BIOS 设置错乱、密码遗忘时的清除。 | 清 CMOS 会丢失 BIOS 设置，需重新配置 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2902) |
| 台式电源故障判断方法 | 判断是不是电源的问题。 | 用替代电源交叉验证最准 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2904) |
| 内存插拔 | 内存接触不良导致的加电无显。 | 断电、放静电后再插拔 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2907) |
| 大写灯可亮屏幕无显示外接可亮导数据方法 | 屏幕不亮但主机正常时如何把数据导出来。 | 先确认外接屏能出画面 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2922) |
| Win企业微信备份还原聊天记录方法 | 换机前保住企业微信聊天记录。 | 备份到非系统盘或外部存储 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2990) |
| 微信导数据方法 | 个人微信聊天记录迁移。 | 迁移前两端都要登录同一账号 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3079) |
| Win共享文件夹及报错解决方法 | 局域网共享的设置与常见报错。 | 先看权限，再看防火墙 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3085) |
| Windows拷贝数据方法 | 换机/重装前的数据拷贝流程。 | 按用户目录逐项核对：桌面、文档、下载、收藏夹 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3172) |
| fastcopy使用方法 | 大批量文件快速拷贝。 | 先拷后校验，别只看进度条 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3211) |
| 联想电脑管家拷贝数据方法 | 联想家的专用迁移工具。 | 仅限联想机型 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3171) |
| 谷歌浏览器书签导入导出方法 | 换机时保住浏览器书签。 | 登录账号同步更省事 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3197) |
| edge浏览器书签&密码导出导入方法 | Edge 书签与密码迁移。 | 密码导出文件属于敏感信息，用完删除 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3212) |
| outlook邮箱备份还原、删除账户方法 | Outlook 数据文件与账户处理。 | PST 文件可能很大，优先拷到外部存储 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3187) |
| Windows开启高性能模式 | 电源模式与性能设置。 | 笔记本开高性能会明显更热 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2951) |
| 无法开启bitlocker的解决方法 | BitLocker 无法启用时的排查。 | 先确认 TPM 状态与版本 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3242) |
| 获取bitlocker密钥和解锁方法 | BitLocker 恢复密钥的获取。 | 密钥在微软账户或 AD 里，重装前务必确认 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2952) |
| Windows进入安全模式方法 | 驱动/软件冲突时的安全模式入口。 | WinRE 里也能进安全模式 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2961) |
| Windows修改Mac地址方法 | 改 MAC 地址的场景与方法。 | 部分网卡驱动不支持软改 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2970) |
| BIOS修改自动开机方法 | 定时自动开机等 BIOS 电源设置。 | 笔记本 BIOS 选项通常受限 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2988) |
| UEFI设置与硬盘分区表类型对应关系 | UEFI↔GPT、Legacy↔MBR 的对应。 | 对不上就会出现「找不到引导设备」 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3387) |
| 闪克使用方法 | 公司内部装机工具的使用。 | 按工具版本对应的说明操作 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3023) |
| 拆电池方法 | 断电前的安全拆机步骤。 | 内置电池机型必须先断电池排线 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3061) |
| Windows的EFS加密解密方法 | EFS 加密文件的解密。 | 证书丢失即无法恢复，先导出证书 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3062) |
| 使用系统版本转换后Win+x失效 | 系统版本转换后的副作用修复。 | 版本转换属于非标准操作，能重装就重装 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3166) |
| 查看可靠性历史和事件查看器方法 | 定位崩溃、卡死时间点。 | 可靠性监视器比事件查看器更直观 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3078) |
| Windows没有恢复模式解决方法 | WinRE 丢失时的重建。 | 需要管理员权限 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3080) |
| Windows11跳过联网使用本地账户方法 | 首次开机 OOBE 跳过联网。 | 新版系统可通过 Shift+F10 输入命令跳过 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3081) |
| 清理垃圾软件 | 清理捆绑、流氓软件。 | 先看启动项和计划任务，别只删快捷方式 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3168) |
| 磁盘空间清理和扩容方法 | C 盘空间不足的处理。 | 先清缓存和大文件，再考虑扩分区 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3170) |
| 完整卸载Adobe系列软件方法 | Adobe 全家桶卸载不干净的问题。 | 按官方清理工具卸载 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3179) |
| 显卡驱动卸载方法 | DDU 类干净卸载。 | 卸载后重启再装新驱动 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3180) |
| Windows Defender卸载方法 | 第三方杀软冲突时的处理。 | 卸载后系统防护会变弱，需提示客户 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3169) |
| 事件查看器速查表 | 常见事件 ID 对照。 | 先记时间点，再按 ID 查 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3181) |
| windbg分析DMP文件使用方法 | 蓝屏转储文件的分析。 | 小内存转储就够日常定位 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3182) |
| HWinfo使用方法 | 硬件信息与温度、功耗监控。 | 看传感器页的 CPU 频率与温度曲线 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3183) |
| mediainfo使用方法 | 音视频文件信息检测。 | 客户投诉播放异常时先看编码 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3184) |
| 蓝屏速查表 | 按蓝屏代码查原因。 | 先记 STOP 代码再查 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3185) |
| 整机压力测试方法 | 换件、维修后的压力验证。 | 跑满 30 分钟以上再看温度与报错 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3186) |
| 完整卸载autodesk系列软件 | AutoCAD 等卸载残留处理。 | 残留多时配合注册表清理 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3188) |
| 完整卸载SolidWorks系列软件方法 | SolidWorks 卸载残留处理。 | 卸载失败常见于服务未停止 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3189) |
| 禁用USB方法 | 合规场景下禁用 USB 存储。 | 禁用前与客户确认需求 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3234) |
| USB打印机连接方法 | USB 直连打印机的安装。 | 先装驱动再插线成功率更高 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3204) |
| 共享打印机连接方法 | 通过共享方式连打印机。 | 主机睡眠会导致共享掉线 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3205) |
| 网络打印机连接方法 | 按 IP 直连网络打印机。 | 固定 IP 更稳定 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3206) |
| 佳能iR-ADV C3926网络（SMB）扫描苹果版 | Mac 侧 SMB 扫描配置。 | SMB 版本选 SMB2/3 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3340) |
| 佳能iR-ADV C3926网络（SMB）扫描PC版 | Windows 侧 SMB 扫描配置。 | 共享目录需给足写权限 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3341) |
| 佳能iR-ADV C3926网络（FTP）扫描 | FTP 方式扫描到电脑。 | FTP 服务器要允许匿名写入 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3342) |
| 佳能iR-ADV C3926使用U盘扫描文件方法 | 不依赖电脑的 U 盘扫描。 | 注意打印机 U 口格式限制 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3343) |
| 系统日志收集方法 | 给后方/厂商准备日志包。 | 收集前先确认隐私与授权 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3091) |
| Windows远程工具使用方法 | 远程协助与远程排障。 | 远程前要取得客户明确授权 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3096) |
| 人为故障 | 识别并处理人为造成的故障。 | 先定性再报单，避免误判 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3143) |
| 易点云修机贴士+AH/AP/AS机型刷UUID方法 | 换主板后刷新 UUID。 | 刷写工具与步骤必须按原文 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3311) |
| 校色仪使用方法 | 屏幕偏色、为客户调色。 | 调色前先暖机 30 分钟 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3297) |
| 常见SN序列号样式 | 识别各厂商序列号规则。 | 报单前核对 SN 位数与格式 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3301) |
| AH21拆机教程 | 自有机型 AH21 的拆装。 | 拆机前拍下螺丝位置 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2862) |
| AH21加装硬盘 | AH21 加装 SSD/HDD。 | 确认接口协议与尺寸 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2863) |
| AI一体机拆机教程 | AI 一体机拆装。 | 一体机拆装风险高，注意保修封条 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3244) |
| 乌班图22.04系统安装在50系显卡方法 | NVIDIA 50 系显卡的 Ubuntu 安装。 | 先装系统装开源驱动，再换闭源驱动 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3293) |
| 26.04乌班图安装 | Ubuntu 26.04 安装流程。 | 注意内核版本与驱动兼容 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3308) |
| 乌班图26安装方法 | Ubuntu 26 的通用安装。 | 分区与 Windows 双系统需谨慎 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3312) |
| 易点云AI AH等自主研发设备驱动、镜像下载 | 自有设备的驱动与镜像。 | 按机型号精确匹配 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3135) |
| 亮机卡显卡驱动安装方法 | 装完系统显卡只显示低分辨率的处理。 | 先装基础显示驱动再装正式驱动 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3391) |
| 暗影精灵GT14-GT15拆机教程 | 暗影精灵 GT 系列拆装。 | 注意电池排线与散热模组 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2866) |
| 泰格医药装系统作业指导书 | 客户专用装机作业指导书。 | 客户专用要求优先于通用流程 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2992) |
| 联斯达&康斯达&法荟作业指导书 | 客户专用装机作业指导书。 | 客户专用要求优先于通用流程 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3008) |
| 车和家作业指导书 | 客户专用装机作业指导书。 | 客户专用要求优先于通用流程 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3156) |
| 深圳华大智造科技股份有限公司 | 客户专用装机作业指导书。 | 客户专用要求优先于通用流程 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3131) |
| 你缺失的那门计算机课 | 计算机基础科普（表格「自学类」第一行）。 | 新人通读一遍，很多「为什么」能自己想明白 | [原文](https://www.criwits.top/missing/) |
| 主流宽带上传和下载速度对照表 | 判断「网慢」是否真的是带宽问题。 | 100 兆宽带实测下行约 90+ Mbps | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3310) |
| 惠普S01主板差别和USB设置 | 惠普 S01 主板的 USB 相关设置。 | USB 无法识别时先查主板设置 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3327) |
| 各设备电源适配器出厂标配 | 核对客户机器的原装适配器。 | 功率不足会导致不充电/降频 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3329) |
| Windows电脑PIN码或密码忘记 | PIN/密码忘记的恢复路径。 | 先试在线重置，再考虑重装 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3222) |
| 开启关闭系统更新方法： | 按客户要求启停系统更新。 | 关闭更新有安全风险，需留记录 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3279) |
| Eagle安装后报错无法打开： | 特定软件安装报错。 | 按原文排查环境依赖 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3337) |
| 可连接但上不了网的解决方法 | Wi-Fi 已连但打不开网页。 | 先分清是 DNS 还是网关 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2969) |
| 连不上网的处理方法 | 完全连不上网。 | 先看网线与 Wi-Fi 状态 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2971) |
| 电脑搜不到WiFi的解决方法 | 搜不到无线网络。 | 开/关无线开关，检查驱动 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2973) |
| wifi信号差不稳定 | 信号弱、频繁掉线。 | 换信道/靠近路由器 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2974) |
| 电脑上网速度慢解决方法 | 上网慢。 | 先测速再判断是带宽还是设备 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=2975) |
| 清理垃圾软件 | 清理流氓软件与捆绑软件。 | 先查启动项与计划任务 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3168) |
| win开机其他报错 | 其他开机报错汇总。 | 截图后对照原文 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3047) |
| 打印机工作原理 | 培训课上口述的内容，SOP 表格里没有对应原文。 | 先学原理：成像方式与纸张路径 | —（培训口述内容，无原文） |
| 易点云产品驱动 | 常识类：易点云自研设备的驱动入口（原表指向 xdriver.edianyun.com）。 | 驱动按具体机型下载 | —（培训口述内容，无原文） |

## 处理明细

上表是把条目「按顺序摊开」；这一节给每一条一条带编号的明细，写入工单时可以直接引用编号，例如「按 SOP 第 12 条的步骤处理」。

### 01｜PE的制作与使用
**是什么**：最基础的一份：怎么做一只可启动 PE 盘、怎么进 PE。

- 提醒：优先做 64 位 PE，老机型再补一个 32 位

**原文**：[PE的制作与使用](https://mvs-h5.edianzu.cn/tips-detail?id=3050)

### 02｜多合一PE制作方法
**是什么**：把多个 PE 和多个系统镜像做进同一只 U 盘，适合一次跑多个客户点。

- 提醒：体积大，建议 128G 以上高速 U 盘

**原文**：[多合一PE制作方法](https://mvs-h5.edianzu.cn/tips-detail?id=2900)

### 03｜U盘魔术师常见问题及解决方案
**是什么**：PE 制作失败、启动报错时的对照表。

- 提醒：做盘失败先换 U 盘和接口，再怀疑工具

**原文**：[U盘魔术师常见问题及解决方案](https://mvs-h5.edianzu.cn/tips-detail?id=3160)

### 04｜无法使用PE启动电脑
**是什么**：插了 PE 盘但开机不进 PE 的排查路径。

- 提醒：先查启动快捷键，再关安全启动

**原文**：[无法使用PE启动电脑](https://mvs-h5.edianzu.cn/tips-detail?id=2920)

### 05｜多品牌电脑选择PE启动的快捷键
**是什么**：联想/戴尔/惠普/华硕/机械革命等品牌的 F 键对照。

- 提醒：开机一瞬间连按，别长按不放

**原文**：[多品牌电脑选择PE启动的快捷键](https://mvs-h5.edianzu.cn/tips-detail?id=2921)

### 06｜PE进入与DG分区工具使用
**是什么**：进 PE 之后的第一站：DG 的常用操作。

- 提醒：先备份分区表再动手

**原文**：[PE进入与DG分区工具使用](https://mvs-h5.edianzu.cn/tips-detail?id=3052)

### 07｜分区扩大和修改方法
**是什么**：C 盘不够用时的扩分区流程。

- 提醒：相邻分区才有空间可扩

**原文**：[分区扩大和修改方法](https://mvs-h5.edianzu.cn/tips-detail?id=3099)

### 08｜系统自带磁盘管理进行分区
**是什么**：不依赖第三方工具的分区方式。

- 提醒：压缩卷只能压缩连续空闲空间

**原文**：[系统自带磁盘管理进行分区](https://mvs-h5.edianzu.cn/tips-detail?id=3101)

### 09｜在系统下使用DG和磁盘管理修改分区大小
**是什么**：在运行中的系统里调分区。

- 提醒：操作前先关掉占用该盘的软件

**原文**：[在系统下使用DG和磁盘管理修改分区大小](https://mvs-h5.edianzu.cn/tips-detail?id=3100)

### 10｜硬盘分区
**是什么**：从零分区：分区表类型、分区数量与大小。

- 提醒：系统盘建议 200G 起，留 15% 空闲

**原文**：[硬盘分区](https://mvs-h5.edianzu.cn/tips-detail?id=3232)

### 11｜螺丝滑丝
**是什么**：拆机时螺丝拧花了的处理。

- 提醒：别硬拧，先上润滑油或换批头

**原文**：[螺丝滑丝](https://mvs-h5.edianzu.cn/tips-detail?id=3051)

### 12｜Windows系统引导修复
**是什么**：开机引导丢失时的修复。

- 提醒：修复前先确认分区表类型没被改过

**原文**：[Windows系统引导修复](https://mvs-h5.edianzu.cn/tips-detail?id=2937)

### 13｜Windows系统删除引导项方法
**是什么**：清理启动项里重复/无效的系统。

- 提醒：只删确认不用的项

**原文**：[Windows系统删除引导项方法](https://mvs-h5.edianzu.cn/tips-detail?id=3090)

### 14｜Windows硬盘检测方法
**是什么**：判断硬盘是否健康、是否需要更换。

- 提醒：先看 SMART，再看坏道扫描

**原文**：[Windows硬盘检测方法](https://mvs-h5.edianzu.cn/tips-detail?id=2932)

### 15｜硬盘掉速修复方法
**是什么**：用一段时间就变慢的「掉速盘」处理。

- 提醒：掉速盘大概率是固件问题，建议直接换

**原文**：[硬盘掉速修复方法](https://mvs-h5.edianzu.cn/tips-detail?id=3325)

### 16｜DiskFresh使用方法
**是什么**：通过重写数据恢复机械/固态盘的读取速度。

- 提醒：本质是整盘读写，耗时数小时

**原文**：[DiskFresh使用方法](https://mvs-h5.edianzu.cn/tips-detail?id=3355)

### 17｜复磁盘修复硬盘命令
**是什么**：命令行层面的硬盘修复。

- 提醒：命令行修复前务必先备份

**原文**：[复磁盘修复硬盘命令](https://mvs-h5.edianzu.cn/tips-detail?id=3385)

### 18｜虚拟内存调整方法
**是什么**：内存不足时用页面文件兜底。

- 提醒：物理内存够就不要盲目加大

**原文**：[虚拟内存调整方法](https://mvs-h5.edianzu.cn/tips-detail?id=3356)

### 19｜内存检测方法
**是什么**：判断是不是内存条的问题。

- 提醒：mdsched 或 MemTest 至少跑一轮

**原文**：[内存检测方法](https://mvs-h5.edianzu.cn/tips-detail?id=2933)

### 20｜电脑温度检测方法
**是什么**：看 CPU/GPU 温度判断是否降频发热。

- 提醒：待机超过 70℃ 基本就是散热问题

**原文**：[电脑温度检测方法](https://mvs-h5.edianzu.cn/tips-detail?id=2949)

### 21｜修复系统方法
**是什么**：系统文件损坏、功能异常时的修复。

- 提醒：sfc 与 DISM 组合使用

**原文**：[修复系统方法](https://mvs-h5.edianzu.cn/tips-detail?id=2928)

### 22｜在PE无法识别硬盘的解决方法
**是什么**：PE 里看不到硬盘的专门解法。

- 提醒：新平台缺 VMD/RST 驱动最常见

**原文**：[在PE无法识别硬盘的解决方法](https://mvs-h5.edianzu.cn/tips-detail?id=2967)

### 23｜在PE注入硬盘驱动方法
**是什么**：把 VMD/RST 驱动注入 PE，让 PE 认出新平台的硬盘。

- 提醒：注入后重新制作启动盘

**原文**：[在PE注入硬盘驱动方法](https://mvs-h5.edianzu.cn/tips-detail?id=2967)

### 24｜Windows安装系统方法
**是什么**：U 盘原版镜像安装的标准流程。

- 提醒：UEFI+GPT 是当前主流组合

**原文**：[Windows安装系统方法](https://mvs-h5.edianzu.cn/tips-detail?id=3302)

### 25｜使用PE安装系统方法
**是什么**：在 PE 里用安装器装系统。

- 提醒：装完记得修复引导

**原文**：[使用PE安装系统方法](https://mvs-h5.edianzu.cn/tips-detail?id=3103)

### 26｜在线安装系统方法
**是什么**：没有 U 盘时的网络安装。

- 提醒：耗时取决于网速，建议有线网络

**原文**：[在线安装系统方法](https://mvs-h5.edianzu.cn/tips-detail?id=3324)

### 27｜MSDN安装系统方法
**是什么**：基于 MSDN 原版镜像的安装。

- 提醒：只从官方/内部可信渠道取镜像

**原文**：[MSDN安装系统方法](https://mvs-h5.edianzu.cn/tips-detail?id=3104)

### 28｜易点云一键还原使用方法
**是什么**：客户机器恢复出厂或恢复镜像。

- 提醒：执行前确认数据已备份

**原文**：[易点云一键还原使用方法](https://mvs-h5.edianzu.cn/tips-detail?id=3105)

### 29｜云装机安装系统使用方法
**是什么**：远程方式装机。

- 提醒：网络不稳时容易中断，先测试链路

**原文**：[云装机安装系统使用方法](https://mvs-h5.edianzu.cn/tips-detail?id=3106)

### 30｜原版镜像设置方法及驱动安装方法
**是什么**：原版镜像的自定义与驱动安装。

- 提醒：驱动顺序：芯片组 → 显卡 → 其他

**原文**：[原版镜像设置方法及驱动安装方法](https://mvs-h5.edianzu.cn/tips-detail?id=3107)

### 31｜Windows创建系统还原点和恢复还原点
**是什么**：大动作前先做还原点。

- 提醒：还原点不替代数据备份

**原文**：[Windows创建系统还原点和恢复还原点](https://mvs-h5.edianzu.cn/tips-detail?id=3144)

### 32｜无U盘重置电脑
**是什么**：没有 U 盘时重置系统。

- 提醒：会清空用户程序，先备份

**原文**：[无U盘重置电脑](https://mvs-h5.edianzu.cn/tips-detail?id=3145)

### 33｜使用安装U盘修复系统方法
**是什么**：系统坏了但不想重装。

- 提醒：修复成功率低于重装，需提前说明

**原文**：[使用安装U盘修复系统方法](https://mvs-h5.edianzu.cn/tips-detail?id=3147)

### 34｜创建微软官方安装系统U盘
**是什么**：用微软官方工具做安装盘。

- 提醒：会格式化 U 盘

**原文**：[创建微软官方安装系统U盘](https://mvs-h5.edianzu.cn/tips-detail?id=3148)

### 35｜系统格式化
**是什么**：格式化系统盘并重装的完整流程。

- 提醒：格式化不可逆，务必二次确认

**原文**：[系统格式化](https://mvs-h5.edianzu.cn/tips-detail?id=3226)

### 36｜微软账户创建方法及PIN码忘记处理方法
**是什么**：账户与 PIN 的创建、找回。

- 提醒：找回 PIN 需要能联网

**原文**：[微软账户创建方法及PIN码忘记处理方法](https://mvs-h5.edianzu.cn/tips-detail?id=3108)

### 37｜必备工具下载
**是什么**：内部工具与常用软件合集（提取码 ds6i）。

- 提醒：只从内部链接下载，别用搜索引擎找同名工具

**原文**：[必备工具下载](https://pan.baidu.com/s/1KNT3EMqOYPaUYA20IHqNcA?pwd=ds6i)

### 38｜易点云镜像&客户专用镜像下载
**是什么**：装机镜像与客户专用镜像（提取码 33kd）。

- 提醒：客户专用镜像需按客户编号对齐

**原文**：[易点云镜像&客户专用镜像下载](https://pan.baidu.com/s/10NISXe43AjnETVYnF7ZoDg?pwd=33kd)

### 39｜一键部署易点云PE
**是什么**：公司统一下发的 PE 部署方式。

- 提醒：优先用官方 PE，问题最少

**原文**：[一键部署易点云PE](https://mvs-h5.edianzu.cn/tips-detail?id=3154)

### 40｜释放静电方法
**是什么**：不加电、开机异常的常见前置处理。

- 提醒：拔电源、长按电源键 15 秒

**原文**：[释放静电方法](https://mvs-h5.edianzu.cn/tips-detail?id=2903)

### 41｜清CMOS/BIOS方法
**是什么**：BIOS 设置错乱、密码遗忘时的清除。

- 提醒：清 CMOS 会丢失 BIOS 设置，需重新配置

**原文**：[清CMOS/BIOS方法](https://mvs-h5.edianzu.cn/tips-detail?id=2902)

### 42｜台式电源故障判断方法
**是什么**：判断是不是电源的问题。

- 提醒：用替代电源交叉验证最准

**原文**：[台式电源故障判断方法](https://mvs-h5.edianzu.cn/tips-detail?id=2904)

### 43｜内存插拔
**是什么**：内存接触不良导致的加电无显。

- 提醒：断电、放静电后再插拔

**原文**：[内存插拔](https://mvs-h5.edianzu.cn/tips-detail?id=2907)

### 44｜大写灯可亮屏幕无显示外接可亮导数据方法
**是什么**：屏幕不亮但主机正常时如何把数据导出来。

- 提醒：先确认外接屏能出画面

**原文**：[大写灯可亮屏幕无显示外接可亮导数据方法](https://mvs-h5.edianzu.cn/tips-detail?id=2922)

### 45｜Win企业微信备份还原聊天记录方法
**是什么**：换机前保住企业微信聊天记录。

- 提醒：备份到非系统盘或外部存储

**原文**：[Win企业微信备份还原聊天记录方法](https://mvs-h5.edianzu.cn/tips-detail?id=2990)

### 46｜微信导数据方法
**是什么**：个人微信聊天记录迁移。

- 提醒：迁移前两端都要登录同一账号

**原文**：[微信导数据方法](https://mvs-h5.edianzu.cn/tips-detail?id=3079)

### 47｜Win共享文件夹及报错解决方法
**是什么**：局域网共享的设置与常见报错。

- 提醒：先看权限，再看防火墙

**原文**：[Win共享文件夹及报错解决方法](https://mvs-h5.edianzu.cn/tips-detail?id=3085)

### 48｜Windows拷贝数据方法
**是什么**：换机/重装前的数据拷贝流程。

- 提醒：按用户目录逐项核对：桌面、文档、下载、收藏夹

**原文**：[Windows拷贝数据方法](https://mvs-h5.edianzu.cn/tips-detail?id=3172)

### 49｜fastcopy使用方法
**是什么**：大批量文件快速拷贝。

- 提醒：先拷后校验，别只看进度条

**原文**：[fastcopy使用方法](https://mvs-h5.edianzu.cn/tips-detail?id=3211)

### 50｜联想电脑管家拷贝数据方法
**是什么**：联想家的专用迁移工具。

- 提醒：仅限联想机型

**原文**：[联想电脑管家拷贝数据方法](https://mvs-h5.edianzu.cn/tips-detail?id=3171)

### 51｜谷歌浏览器书签导入导出方法
**是什么**：换机时保住浏览器书签。

- 提醒：登录账号同步更省事

**原文**：[谷歌浏览器书签导入导出方法](https://mvs-h5.edianzu.cn/tips-detail?id=3197)

### 52｜edge浏览器书签&密码导出导入方法
**是什么**：Edge 书签与密码迁移。

- 提醒：密码导出文件属于敏感信息，用完删除

**原文**：[edge浏览器书签&密码导出导入方法](https://mvs-h5.edianzu.cn/tips-detail?id=3212)

### 53｜outlook邮箱备份还原、删除账户方法
**是什么**：Outlook 数据文件与账户处理。

- 提醒：PST 文件可能很大，优先拷到外部存储

**原文**：[outlook邮箱备份还原、删除账户方法](https://mvs-h5.edianzu.cn/tips-detail?id=3187)

### 54｜Windows开启高性能模式
**是什么**：电源模式与性能设置。

- 提醒：笔记本开高性能会明显更热

**原文**：[Windows开启高性能模式](https://mvs-h5.edianzu.cn/tips-detail?id=2951)

### 55｜无法开启bitlocker的解决方法
**是什么**：BitLocker 无法启用时的排查。

- 提醒：先确认 TPM 状态与版本

**原文**：[无法开启bitlocker的解决方法](https://mvs-h5.edianzu.cn/tips-detail?id=3242)

### 56｜获取bitlocker密钥和解锁方法
**是什么**：BitLocker 恢复密钥的获取。

- 提醒：密钥在微软账户或 AD 里，重装前务必确认

**原文**：[获取bitlocker密钥和解锁方法](https://mvs-h5.edianzu.cn/tips-detail?id=2952)

### 57｜Windows进入安全模式方法
**是什么**：驱动/软件冲突时的安全模式入口。

- 提醒：WinRE 里也能进安全模式

**原文**：[Windows进入安全模式方法](https://mvs-h5.edianzu.cn/tips-detail?id=2961)

### 58｜Windows修改Mac地址方法
**是什么**：改 MAC 地址的场景与方法。

- 提醒：部分网卡驱动不支持软改

**原文**：[Windows修改Mac地址方法](https://mvs-h5.edianzu.cn/tips-detail?id=2970)

### 59｜BIOS修改自动开机方法
**是什么**：定时自动开机等 BIOS 电源设置。

- 提醒：笔记本 BIOS 选项通常受限

**原文**：[BIOS修改自动开机方法](https://mvs-h5.edianzu.cn/tips-detail?id=2988)

### 60｜UEFI设置与硬盘分区表类型对应关系
**是什么**：UEFI↔GPT、Legacy↔MBR 的对应。

- 提醒：对不上就会出现「找不到引导设备」

**原文**：[UEFI设置与硬盘分区表类型对应关系](https://mvs-h5.edianzu.cn/tips-detail?id=3387)

### 61｜闪克使用方法
**是什么**：公司内部装机工具的使用。

- 提醒：按工具版本对应的说明操作

**原文**：[闪克使用方法](https://mvs-h5.edianzu.cn/tips-detail?id=3023)

### 62｜拆电池方法
**是什么**：断电前的安全拆机步骤。

- 提醒：内置电池机型必须先断电池排线

**原文**：[拆电池方法](https://mvs-h5.edianzu.cn/tips-detail?id=3061)

### 63｜Windows的EFS加密解密方法
**是什么**：EFS 加密文件的解密。

- 提醒：证书丢失即无法恢复，先导出证书

**原文**：[Windows的EFS加密解密方法](https://mvs-h5.edianzu.cn/tips-detail?id=3062)

### 64｜使用系统版本转换后Win+x失效
**是什么**：系统版本转换后的副作用修复。

- 提醒：版本转换属于非标准操作，能重装就重装

**原文**：[使用系统版本转换后Win+x失效](https://mvs-h5.edianzu.cn/tips-detail?id=3166)

### 65｜查看可靠性历史和事件查看器方法
**是什么**：定位崩溃、卡死时间点。

- 提醒：可靠性监视器比事件查看器更直观

**原文**：[查看可靠性历史和事件查看器方法](https://mvs-h5.edianzu.cn/tips-detail?id=3078)

### 66｜Windows没有恢复模式解决方法
**是什么**：WinRE 丢失时的重建。

- 提醒：需要管理员权限

**原文**：[Windows没有恢复模式解决方法](https://mvs-h5.edianzu.cn/tips-detail?id=3080)

### 67｜Windows11跳过联网使用本地账户方法
**是什么**：首次开机 OOBE 跳过联网。

- 提醒：新版系统可通过 Shift+F10 输入命令跳过

**原文**：[Windows11跳过联网使用本地账户方法](https://mvs-h5.edianzu.cn/tips-detail?id=3081)

### 68｜清理垃圾软件
**是什么**：清理捆绑、流氓软件。

- 提醒：先看启动项和计划任务，别只删快捷方式

**原文**：[清理垃圾软件](https://mvs-h5.edianzu.cn/tips-detail?id=3168)

### 69｜磁盘空间清理和扩容方法
**是什么**：C 盘空间不足的处理。

- 提醒：先清缓存和大文件，再考虑扩分区

**原文**：[磁盘空间清理和扩容方法](https://mvs-h5.edianzu.cn/tips-detail?id=3170)

### 70｜完整卸载Adobe系列软件方法
**是什么**：Adobe 全家桶卸载不干净的问题。

- 提醒：按官方清理工具卸载

**原文**：[完整卸载Adobe系列软件方法](https://mvs-h5.edianzu.cn/tips-detail?id=3179)

### 71｜显卡驱动卸载方法
**是什么**：DDU 类干净卸载。

- 提醒：卸载后重启再装新驱动

**原文**：[显卡驱动卸载方法](https://mvs-h5.edianzu.cn/tips-detail?id=3180)

### 72｜Windows Defender卸载方法
**是什么**：第三方杀软冲突时的处理。

- 提醒：卸载后系统防护会变弱，需提示客户

**原文**：[Windows Defender卸载方法](https://mvs-h5.edianzu.cn/tips-detail?id=3169)

### 73｜事件查看器速查表
**是什么**：常见事件 ID 对照。

- 提醒：先记时间点，再按 ID 查

**原文**：[事件查看器速查表](https://mvs-h5.edianzu.cn/tips-detail?id=3181)

### 74｜windbg分析DMP文件使用方法
**是什么**：蓝屏转储文件的分析。

- 提醒：小内存转储就够日常定位

**原文**：[windbg分析DMP文件使用方法](https://mvs-h5.edianzu.cn/tips-detail?id=3182)

### 75｜HWinfo使用方法
**是什么**：硬件信息与温度、功耗监控。

- 提醒：看传感器页的 CPU 频率与温度曲线

**原文**：[HWinfo使用方法](https://mvs-h5.edianzu.cn/tips-detail?id=3183)

### 76｜mediainfo使用方法
**是什么**：音视频文件信息检测。

- 提醒：客户投诉播放异常时先看编码

**原文**：[mediainfo使用方法](https://mvs-h5.edianzu.cn/tips-detail?id=3184)

### 77｜蓝屏速查表
**是什么**：按蓝屏代码查原因。

- 提醒：先记 STOP 代码再查

**原文**：[蓝屏速查表](https://mvs-h5.edianzu.cn/tips-detail?id=3185)

### 78｜整机压力测试方法
**是什么**：换件、维修后的压力验证。

- 提醒：跑满 30 分钟以上再看温度与报错

**原文**：[整机压力测试方法](https://mvs-h5.edianzu.cn/tips-detail?id=3186)

### 79｜完整卸载autodesk系列软件
**是什么**：AutoCAD 等卸载残留处理。

- 提醒：残留多时配合注册表清理

**原文**：[完整卸载autodesk系列软件](https://mvs-h5.edianzu.cn/tips-detail?id=3188)

### 80｜完整卸载SolidWorks系列软件方法
**是什么**：SolidWorks 卸载残留处理。

- 提醒：卸载失败常见于服务未停止

**原文**：[完整卸载SolidWorks系列软件方法](https://mvs-h5.edianzu.cn/tips-detail?id=3189)

### 81｜禁用USB方法
**是什么**：合规场景下禁用 USB 存储。

- 提醒：禁用前与客户确认需求

**原文**：[禁用USB方法](https://mvs-h5.edianzu.cn/tips-detail?id=3234)

### 82｜USB打印机连接方法
**是什么**：USB 直连打印机的安装。

- 提醒：先装驱动再插线成功率更高

**原文**：[USB打印机连接方法](https://mvs-h5.edianzu.cn/tips-detail?id=3204)

### 83｜共享打印机连接方法
**是什么**：通过共享方式连打印机。

- 提醒：主机睡眠会导致共享掉线

**原文**：[共享打印机连接方法](https://mvs-h5.edianzu.cn/tips-detail?id=3205)

### 84｜网络打印机连接方法
**是什么**：按 IP 直连网络打印机。

- 提醒：固定 IP 更稳定

**原文**：[网络打印机连接方法](https://mvs-h5.edianzu.cn/tips-detail?id=3206)

### 85｜佳能iR-ADV C3926网络（SMB）扫描苹果版
**是什么**：Mac 侧 SMB 扫描配置。

- 提醒：SMB 版本选 SMB2/3

**原文**：[佳能iR-ADV C3926网络（SMB）扫描苹果版](https://mvs-h5.edianzu.cn/tips-detail?id=3340)

### 86｜佳能iR-ADV C3926网络（SMB）扫描PC版
**是什么**：Windows 侧 SMB 扫描配置。

- 提醒：共享目录需给足写权限

**原文**：[佳能iR-ADV C3926网络（SMB）扫描PC版](https://mvs-h5.edianzu.cn/tips-detail?id=3341)

### 87｜佳能iR-ADV C3926网络（FTP）扫描
**是什么**：FTP 方式扫描到电脑。

- 提醒：FTP 服务器要允许匿名写入

**原文**：[佳能iR-ADV C3926网络（FTP）扫描](https://mvs-h5.edianzu.cn/tips-detail?id=3342)

### 88｜佳能iR-ADV C3926使用U盘扫描文件方法
**是什么**：不依赖电脑的 U 盘扫描。

- 提醒：注意打印机 U 口格式限制

**原文**：[佳能iR-ADV C3926使用U盘扫描文件方法](https://mvs-h5.edianzu.cn/tips-detail?id=3343)

### 89｜系统日志收集方法
**是什么**：给后方/厂商准备日志包。

- 提醒：收集前先确认隐私与授权

**原文**：[系统日志收集方法](https://mvs-h5.edianzu.cn/tips-detail?id=3091)

### 90｜Windows远程工具使用方法
**是什么**：远程协助与远程排障。

- 提醒：远程前要取得客户明确授权

**原文**：[Windows远程工具使用方法](https://mvs-h5.edianzu.cn/tips-detail?id=3096)

### 91｜人为故障
**是什么**：识别并处理人为造成的故障。

- 提醒：先定性再报单，避免误判

**原文**：[人为故障](https://mvs-h5.edianzu.cn/tips-detail?id=3143)

### 92｜易点云修机贴士+AH/AP/AS机型刷UUID方法
**是什么**：换主板后刷新 UUID。

- 提醒：刷写工具与步骤必须按原文

**原文**：[易点云修机贴士+AH/AP/AS机型刷UUID方法](https://mvs-h5.edianzu.cn/tips-detail?id=3311)

### 93｜校色仪使用方法
**是什么**：屏幕偏色、为客户调色。

- 提醒：调色前先暖机 30 分钟

**原文**：[校色仪使用方法](https://mvs-h5.edianzu.cn/tips-detail?id=3297)

### 94｜常见SN序列号样式
**是什么**：识别各厂商序列号规则。

- 提醒：报单前核对 SN 位数与格式

**原文**：[常见SN序列号样式](https://mvs-h5.edianzu.cn/tips-detail?id=3301)

### 95｜AH21拆机教程
**是什么**：自有机型 AH21 的拆装。

- 提醒：拆机前拍下螺丝位置

**原文**：[AH21拆机教程](https://mvs-h5.edianzu.cn/tips-detail?id=2862)

### 96｜AH21加装硬盘
**是什么**：AH21 加装 SSD/HDD。

- 提醒：确认接口协议与尺寸

**原文**：[AH21加装硬盘](https://mvs-h5.edianzu.cn/tips-detail?id=2863)

### 97｜AI一体机拆机教程
**是什么**：AI 一体机拆装。

- 提醒：一体机拆装风险高，注意保修封条

**原文**：[AI一体机拆机教程](https://mvs-h5.edianzu.cn/tips-detail?id=3244)

### 98｜乌班图22.04系统安装在50系显卡方法
**是什么**：NVIDIA 50 系显卡的 Ubuntu 安装。

- 提醒：先装系统装开源驱动，再换闭源驱动

**原文**：[乌班图22.04系统安装在50系显卡方法](https://mvs-h5.edianzu.cn/tips-detail?id=3293)

### 99｜26.04乌班图安装
**是什么**：Ubuntu 26.04 安装流程。

- 提醒：注意内核版本与驱动兼容

**原文**：[26.04乌班图安装](https://mvs-h5.edianzu.cn/tips-detail?id=3308)

### 100｜乌班图26安装方法
**是什么**：Ubuntu 26 的通用安装。

- 提醒：分区与 Windows 双系统需谨慎

**原文**：[乌班图26安装方法](https://mvs-h5.edianzu.cn/tips-detail?id=3312)

### 101｜易点云AI AH等自主研发设备驱动、镜像下载
**是什么**：自有设备的驱动与镜像。

- 提醒：按机型号精确匹配

**原文**：[易点云AI AH等自主研发设备驱动、镜像下载](https://mvs-h5.edianzu.cn/tips-detail?id=3135)

### 102｜亮机卡显卡驱动安装方法
**是什么**：装完系统显卡只显示低分辨率的处理。

- 提醒：先装基础显示驱动再装正式驱动

**原文**：[亮机卡显卡驱动安装方法](https://mvs-h5.edianzu.cn/tips-detail?id=3391)

### 103｜暗影精灵GT14-GT15拆机教程
**是什么**：暗影精灵 GT 系列拆装。

- 提醒：注意电池排线与散热模组

**原文**：[暗影精灵GT14-GT15拆机教程](https://mvs-h5.edianzu.cn/tips-detail?id=2866)

### 104｜泰格医药装系统作业指导书
**是什么**：客户专用装机作业指导书。

- 提醒：客户专用要求优先于通用流程

**原文**：[泰格医药装系统作业指导书](https://mvs-h5.edianzu.cn/tips-detail?id=2992)

### 105｜联斯达&康斯达&法荟作业指导书
**是什么**：客户专用装机作业指导书。

- 提醒：客户专用要求优先于通用流程

**原文**：[联斯达&康斯达&法荟作业指导书](https://mvs-h5.edianzu.cn/tips-detail?id=3008)

### 106｜车和家作业指导书
**是什么**：客户专用装机作业指导书。

- 提醒：客户专用要求优先于通用流程

**原文**：[车和家作业指导书](https://mvs-h5.edianzu.cn/tips-detail?id=3156)

### 107｜深圳华大智造科技股份有限公司
**是什么**：客户专用装机作业指导书。

- 提醒：客户专用要求优先于通用流程

**原文**：[深圳华大智造科技股份有限公司](https://mvs-h5.edianzu.cn/tips-detail?id=3131)

### 108｜你缺失的那门计算机课
**是什么**：计算机基础科普（表格「自学类」第一行）。

- 提醒：新人通读一遍，很多「为什么」能自己想明白

**原文**：[你缺失的那门计算机课](https://www.criwits.top/missing/)

### 109｜主流宽带上传和下载速度对照表
**是什么**：判断「网慢」是否真的是带宽问题。

- 提醒：100 兆宽带实测下行约 90+ Mbps

**原文**：[主流宽带上传和下载速度对照表](https://mvs-h5.edianzu.cn/tips-detail?id=3310)

### 110｜惠普S01主板差别和USB设置
**是什么**：惠普 S01 主板的 USB 相关设置。

- 提醒：USB 无法识别时先查主板设置

**原文**：[惠普S01主板差别和USB设置](https://mvs-h5.edianzu.cn/tips-detail?id=3327)

### 111｜各设备电源适配器出厂标配
**是什么**：核对客户机器的原装适配器。

- 提醒：功率不足会导致不充电/降频

**原文**：[各设备电源适配器出厂标配](https://mvs-h5.edianzu.cn/tips-detail?id=3329)

### 112｜Windows电脑PIN码或密码忘记
**是什么**：PIN/密码忘记的恢复路径。

- 提醒：先试在线重置，再考虑重装

**原文**：[Windows电脑PIN码或密码忘记](https://mvs-h5.edianzu.cn/tips-detail?id=3222)

### 113｜开启关闭系统更新方法：
**是什么**：按客户要求启停系统更新。

- 提醒：关闭更新有安全风险，需留记录

**原文**：[开启关闭系统更新方法：](https://mvs-h5.edianzu.cn/tips-detail?id=3279)

### 114｜Eagle安装后报错无法打开：
**是什么**：特定软件安装报错。

- 提醒：按原文排查环境依赖

**原文**：[Eagle安装后报错无法打开：](https://mvs-h5.edianzu.cn/tips-detail?id=3337)

### 115｜可连接但上不了网的解决方法
**是什么**：Wi-Fi 已连但打不开网页。

- 提醒：先分清是 DNS 还是网关

**原文**：[可连接但上不了网的解决方法](https://mvs-h5.edianzu.cn/tips-detail?id=2969)

### 116｜连不上网的处理方法
**是什么**：完全连不上网。

- 提醒：先看网线与 Wi-Fi 状态

**原文**：[连不上网的处理方法](https://mvs-h5.edianzu.cn/tips-detail?id=2971)

### 117｜电脑搜不到WiFi的解决方法
**是什么**：搜不到无线网络。

- 提醒：开/关无线开关，检查驱动

**原文**：[电脑搜不到WiFi的解决方法](https://mvs-h5.edianzu.cn/tips-detail?id=2973)

### 118｜wifi信号差不稳定
**是什么**：信号弱、频繁掉线。

- 提醒：换信道/靠近路由器

**原文**：[wifi信号差不稳定](https://mvs-h5.edianzu.cn/tips-detail?id=2974)

### 119｜电脑上网速度慢解决方法
**是什么**：上网慢。

- 提醒：先测速再判断是带宽还是设备

**原文**：[电脑上网速度慢解决方法](https://mvs-h5.edianzu.cn/tips-detail?id=2975)

### 120｜清理垃圾软件
**是什么**：清理流氓软件与捆绑软件。

- 提醒：先查启动项与计划任务

**原文**：[清理垃圾软件](https://mvs-h5.edianzu.cn/tips-detail?id=3168)

### 121｜win开机其他报错
**是什么**：其他开机报错汇总。

- 提醒：截图后对照原文

**原文**：[win开机其他报错](https://mvs-h5.edianzu.cn/tips-detail?id=3047)

### 122｜打印机工作原理
**是什么**：培训课上口述的内容，SOP 表格里没有对应原文。

- 提醒：先学原理：成像方式与纸张路径

**原文**：培训口述内容，SOP 表格中没有对应链接。

### 123｜易点云产品驱动
**是什么**：常识类：易点云自研设备的驱动入口（原表指向 xdriver.edianyun.com）。

- 提醒：驱动按具体机型下载

**原文**：培训口述内容，SOP 表格中没有对应链接。

## 仍需帮助

- 原文能对上但做不下去：按「工单升级方法」带上截图与现象升级，不要在客户现场硬试。
- 本文与原文不一致：以原文为准，并在「纠错与反馈」告诉我们，我们会回来更新这份索引。
- 需要看具体的排障思路，而不是 SOP 索引：去「领域」页找对应的故障教程。
