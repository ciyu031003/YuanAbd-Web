---
title: 打印机连接与故障速查：USB / 共享 / 网络、卡纸、缺墨与扫描
slug: sop-printer-connected-fix
kind: reference
domain: ref-manual
category: ref-peripheral-setup
os: [Windows, macOS]
difficulty: 入门
time: 10-30 分钟
risk: 需谨慎
symptoms: [打印机连接与故障速查 处理方法, SOP 参考]
keywords: [打印机连接与故障速查 SOP, USB / 共享 / 网络, 卡纸, 缺墨与扫描, 参考手册, 作业指导]
aliases: [SOP, 作业指导, 参考手册, 打印机连接与故障速查]
updated: 2026-10-17
version: "1.0"
prerequisites: [能登录公司内部 SOP 知识库（部分原文需要账号）]
tools: [浏览器, 内部 SOP 知识库]
related: [sop-pe-usb-install, sop-macos-maintain, sop-diagnose-tools]
sources:
  - title: 公司 SOP 知识库 — USB打印机连接方法
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3204
    type: internal
  - title: 公司 SOP 知识库 — USB打印机打印不出来打印慢的解决方法
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3194
    type: internal
  - title: 公司 SOP 知识库 — 打印机卡纸进纸异常解决方法
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3191
    type: internal
  - title: 公司 SOP 知识库 — 打印机扫描异常的解决方法
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3029
    type: internal
  - title: 公司 SOP 知识库 — 佳能iR-ADV C3926网络（SMB）扫描苹果版
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3340
    type: internal
  - title: 公司 SOP 知识库 — 佳能iR-ADV C3926使用U盘扫描文件方法
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3343
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

# 打印机连接与故障速查：USB / 共享 / 网络、卡纸、缺墨与扫描

## 快速概览

打印机是工单里最高频的外设，也是「到现场十分钟解决」的典型场景：

先分清楚是**连接方式的问题**还是**打印机本身的问题**，再决定是重连还是报修。

这一页把 SOP 里连接方法（USB/共享/网络）+ 故障处理（打不出、卡纸、缺墨、异响、不加电、扫描）+ 佳能 C3926 扫描配置拼成一条线。

本页共整理 **20** 条 SOP 条目，全部保留原始链接；处理细节以原文为准。

## 适用对象

负责办公外设的现场工程师、需要自己连打印机的同事。

## 风险提示

> ⚠ 动手前请逐条核对；涉及数据、证件、客户设备安全的操作，先取得授权再执行。

1. 共享打印机依赖主机，主机休眠/关机就会掉线；给客户建议时要说清楚这不是打印机坏了。
2. 拆机清卡纸前先断电，避免齿轮咬手；激光机定影部位高温，注意烫伤。
3. 网络打印机建议固定 IP，否则重启后 IP 变化会导致打印任务全部失败。

## 分步骤

### 步骤 1：先分清连接方式

**目的**：三种连接方式的排查路径完全不同

**操作**：
1. USB 直连：线 → 驱动 → 端口，见「USB打印机连接方法」。
2. 共享：先看主机是否开机、共享是否还在，见「共享打印机连接方法」。
3. 网络：先 ping 打印机 IP，再装端口，见「网络打印机连接方法」。

**预期结果**：第 1 步的操作都完成后，问题现象能被复现或排除，并能对应到下面「原始 SOP」里的具体条目。

**失败怎么办**：对不上具体条目 → 回到「快速概览」确认现象描述，或按「仍需帮助」一节的说明升级。

### 步骤 2：打不出来/打印慢

**目的**：大多数不是打印机坏，是队列或驱动卡住

**操作**：
1. 清空打印队列 → 重启打印服务（Print Spooler）→ 重开任务。
2. 按连接方式对照原文：USB / 共享 / 网络各有一篇。
3. 打印慢多为驱动或 USB 带宽问题，换官方驱动重试。

**预期结果**：第 2 步的操作都完成后，问题现象能被复现或排除，并能对应到下面「原始 SOP」里的具体条目。

**失败怎么办**：对不上具体条目 → 回到「快速概览」确认现象描述，或按「仍需帮助」一节的说明升级。

### 步骤 3：打印质量问题

**目的**：缺墨、漏墨、不清晰

**操作**：
1. 看墨量/碳粉量，再跑打印机自带的喷嘴检查或清洁。
2. 条纹、漏墨多半是喷头或硒鼓，需要更换耗材。

**预期结果**：第 3 步的操作都完成后，问题现象能被复现或排除，并能对应到下面「原始 SOP」里的具体条目。

**失败怎么办**：对不上具体条目 → 回到「快速概览」确认现象描述，或按「仍需帮助」一节的说明升级。

### 步骤 4：物理故障

**目的**：卡纸、异响、不加电、故障灯

**操作**：
1. 卡纸：断电后从进纸方向取出，别硬拉；检查搓纸轮。
2. 异响：多为异物或齿轮磨损，不拆不建议继续用。
3. 不加电：先换电源线与插座，再看是否属于报修范围。

**预期结果**：第 4 步的操作都完成后，问题现象能被复现或排除，并能对应到下面「原始 SOP」里的具体条目。

**失败怎么办**：对不上具体条目 → 回到「快速概览」确认现象描述，或按「仍需帮助」一节的说明升级。

### 步骤 5：扫描与网络扫描

**目的**：办公场景常和打印一起要

**操作**：
1. 佳能 C3926 支持 SMB（PC/Mac）、FTP、U 盘扫描四种方式，按客户网络环境选。
2. SMB 扫描失败先查共享目录权限与 SMB 版本。

**预期结果**：第 5 步的操作都完成后，问题现象能被复现或排除，并能对应到下面「原始 SOP」里的具体条目。

**失败怎么办**：对不上具体条目 → 回到「快速概览」确认现象描述，或按「仍需帮助」一节的说明升级。

## 原始 SOP

下表的「原文」全部指向公司 SOP 知识库（需要内部账号登录）。点击即可核对处理步骤、截图与注意事项。

| 条目 | 是什么 / 什么时候用 | 一句话提醒 | 原文 |
|---|---|---|---|
| USB打印机连接方法 | USB 直连安装。 | 先装驱动再插线更顺 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3204) |
| 共享打印机连接方法 | 连别人共享出来的打印机。 | 主机睡眠会掉线 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3205) |
| 网络打印机连接方法 | 按 IP 添加打印机。 | 建议固定 IP | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3206) |
| USB打印机打印不出来打印慢的解决方法 | USB 打印异常。 | 先清队列再重启 spooler | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3194) |
| 共享打印机打印不出来打印慢 | 共享打印异常。 | 确认主机在线且共享未关 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3195) |
| 网络打印机打印不出来打印慢 | 网络打印异常。 | ping 通再看端口 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3196) |
| 打印机卡纸进纸异常解决方法 | 卡纸与不进纸。 | 断电操作，别硬拉 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3191) |
| 打印不清晰缺墨漏墨的解决方法 | 印品质量问题。 | 先做喷嘴检查 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3025) |
| 打印机报错、故障灯亮的解决方法 | 故障灯与报错代码。 | 先记代码再查 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3028) |
| 打印机扫描异常的解决方法 | 扫描失败、扫描件黑边。 | 确认扫描方式与共享权限 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3029) |
| 打印机异响的解决方法 | 异响与杂音。 | 异物或齿轮问题，勿反复强用 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3030) |
| 打印机不加电的解决方法 | 打印机不上电。 | 先换电源线/插座 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3031) |
| 佳能iR-ADV C3926网络（SMB）扫描苹果版 | Mac 侧 SMB 扫描配置。 | SMB 选 2.0 以上 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3340) |
| 佳能iR-ADV C3926网络（SMB）扫描PC版 | Windows 侧 SMB 扫描配置。 | 共享目录给写权限 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3341) |
| 佳能iR-ADV C3926网络（FTP）扫描 | FTP 扫描配置。 | 防火墙放行 FTP 端口 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3342) |
| 佳能iR-ADV C3926使用U盘扫描文件方法 | U 盘扫描。 | 注意 U 盘格式 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3343) |
| N95一体机插3.5mm耳机音量小处理方法 | 耳机音量异常。 | 先查系统音量与音频驱动 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3328) |
| 台式机键盘使用异常解决方法 | 外接键盘异常。 | 换口/换机交叉验证 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3218) |
| 鼠标使用异常的解决方法 | 鼠标失灵、飘移。 | 先换垫子与接口 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3219) |
| 苹果一体机配备键盘注意事项 | iMac 键盘配对。 | 蓝牙键盘注意电量 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3152) |

## 处理明细

上表是把条目「按顺序摊开」；这一节给每一条一条带编号的明细，写入工单时可以直接引用编号，例如「按 SOP 第 12 条的步骤处理」。

### 01｜USB打印机连接方法
**是什么**：USB 直连安装。

- 提醒：先装驱动再插线更顺

**原文**：[USB打印机连接方法](https://mvs-h5.edianzu.cn/tips-detail?id=3204)

### 02｜共享打印机连接方法
**是什么**：连别人共享出来的打印机。

- 提醒：主机睡眠会掉线

**原文**：[共享打印机连接方法](https://mvs-h5.edianzu.cn/tips-detail?id=3205)

### 03｜网络打印机连接方法
**是什么**：按 IP 添加打印机。

- 提醒：建议固定 IP

**原文**：[网络打印机连接方法](https://mvs-h5.edianzu.cn/tips-detail?id=3206)

### 04｜USB打印机打印不出来打印慢的解决方法
**是什么**：USB 打印异常。

- 提醒：先清队列再重启 spooler

**原文**：[USB打印机打印不出来打印慢的解决方法](https://mvs-h5.edianzu.cn/tips-detail?id=3194)

### 05｜共享打印机打印不出来打印慢
**是什么**：共享打印异常。

- 提醒：确认主机在线且共享未关

**原文**：[共享打印机打印不出来打印慢](https://mvs-h5.edianzu.cn/tips-detail?id=3195)

### 06｜网络打印机打印不出来打印慢
**是什么**：网络打印异常。

- 提醒：ping 通再看端口

**原文**：[网络打印机打印不出来打印慢](https://mvs-h5.edianzu.cn/tips-detail?id=3196)

### 07｜打印机卡纸进纸异常解决方法
**是什么**：卡纸与不进纸。

- 提醒：断电操作，别硬拉

**原文**：[打印机卡纸进纸异常解决方法](https://mvs-h5.edianzu.cn/tips-detail?id=3191)

### 08｜打印不清晰缺墨漏墨的解决方法
**是什么**：印品质量问题。

- 提醒：先做喷嘴检查

**原文**：[打印不清晰缺墨漏墨的解决方法](https://mvs-h5.edianzu.cn/tips-detail?id=3025)

### 09｜打印机报错、故障灯亮的解决方法
**是什么**：故障灯与报错代码。

- 提醒：先记代码再查

**原文**：[打印机报错、故障灯亮的解决方法](https://mvs-h5.edianzu.cn/tips-detail?id=3028)

### 10｜打印机扫描异常的解决方法
**是什么**：扫描失败、扫描件黑边。

- 提醒：确认扫描方式与共享权限

**原文**：[打印机扫描异常的解决方法](https://mvs-h5.edianzu.cn/tips-detail?id=3029)

### 11｜打印机异响的解决方法
**是什么**：异响与杂音。

- 提醒：异物或齿轮问题，勿反复强用

**原文**：[打印机异响的解决方法](https://mvs-h5.edianzu.cn/tips-detail?id=3030)

### 12｜打印机不加电的解决方法
**是什么**：打印机不上电。

- 提醒：先换电源线/插座

**原文**：[打印机不加电的解决方法](https://mvs-h5.edianzu.cn/tips-detail?id=3031)

### 13｜佳能iR-ADV C3926网络（SMB）扫描苹果版
**是什么**：Mac 侧 SMB 扫描配置。

- 提醒：SMB 选 2.0 以上

**原文**：[佳能iR-ADV C3926网络（SMB）扫描苹果版](https://mvs-h5.edianzu.cn/tips-detail?id=3340)

### 14｜佳能iR-ADV C3926网络（SMB）扫描PC版
**是什么**：Windows 侧 SMB 扫描配置。

- 提醒：共享目录给写权限

**原文**：[佳能iR-ADV C3926网络（SMB）扫描PC版](https://mvs-h5.edianzu.cn/tips-detail?id=3341)

### 15｜佳能iR-ADV C3926网络（FTP）扫描
**是什么**：FTP 扫描配置。

- 提醒：防火墙放行 FTP 端口

**原文**：[佳能iR-ADV C3926网络（FTP）扫描](https://mvs-h5.edianzu.cn/tips-detail?id=3342)

### 16｜佳能iR-ADV C3926使用U盘扫描文件方法
**是什么**：U 盘扫描。

- 提醒：注意 U 盘格式

**原文**：[佳能iR-ADV C3926使用U盘扫描文件方法](https://mvs-h5.edianzu.cn/tips-detail?id=3343)

### 17｜N95一体机插3.5mm耳机音量小处理方法
**是什么**：耳机音量异常。

- 提醒：先查系统音量与音频驱动

**原文**：[N95一体机插3.5mm耳机音量小处理方法](https://mvs-h5.edianzu.cn/tips-detail?id=3328)

### 18｜台式机键盘使用异常解决方法
**是什么**：外接键盘异常。

- 提醒：换口/换机交叉验证

**原文**：[台式机键盘使用异常解决方法](https://mvs-h5.edianzu.cn/tips-detail?id=3218)

### 19｜鼠标使用异常的解决方法
**是什么**：鼠标失灵、飘移。

- 提醒：先换垫子与接口

**原文**：[鼠标使用异常的解决方法](https://mvs-h5.edianzu.cn/tips-detail?id=3219)

### 20｜苹果一体机配备键盘注意事项
**是什么**：iMac 键盘配对。

- 提醒：蓝牙键盘注意电量

**原文**：[苹果一体机配备键盘注意事项](https://mvs-h5.edianzu.cn/tips-detail?id=3152)

## 仍需帮助

- 原文能对上但做不下去：按「工单升级方法」带上截图与现象升级，不要在客户现场硬试。
- 本文与原文不一致：以原文为准，并在「纠错与反馈」告诉我们，我们会回来更新这份索引。
- 需要看具体的排障思路，而不是 SOP 索引：去「领域」页找对应的故障教程。
