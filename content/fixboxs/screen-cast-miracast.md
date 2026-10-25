---
title: 无线投屏失败 / 搜不到电视怎么修（Win+K、Miracast、手机投屏）
slug: screen-cast-miracast
domain: peripheral
category: per-display
os: [Windows 10, Windows 11, Android 8+, 智能电视]
difficulty: 入门
time: 10-40 分钟
risk: 安全
symptoms:
  - 无线投屏失败
  - 搜不到电视
  - 投屏连不上
  - Win K 没有设备
  - Miracast 不支持
  - 手机投屏搜不到电视
  - 投屏卡顿断开
  - 无线显示器连接失败
keywords: [无线投屏, Miracast, Win+K, 投屏到电视, dxdiag, 无线显示器, DLNA, 投屏搜不到, 连接失败]
aliases: [投屏失败, 电脑投电视, 手机投屏, 无线显示器, 投屏卡]
updated: 2026-10-25
version: "1.0"
prerequisites:
  - 电脑（或手机）与电视/投屏盒连接**同一个 Wi-Fi**（或电视与电脑都在 2.4G/同一频段）
  - 知道电视的品牌与投屏功能入口（设置里的「屏幕镜像/多屏互动/Wireless Projection」）
  - Windows 机器有管理员权限
tools: [Win+K 投屏面板, dxdiag, 设备管理器]
related: [monitor-no-signal, screen-artifacts-flicker, router-wifi-coverage, wifi-connected-but-no-internet]
sources:
  - title: Microsoft 支持 - 修复 Windows 中无线显示器或扩展坞的连接问题
    url: https://support.microsoft.com/zh-cn/windows/hardware/display-graphics/fix-connections-to-wireless-displays-or-docks-in-windows
  - title: 华为官方 - 手机/平板无线投屏至电视失败的排查
    url: https://consumer.huawei.com/cn/support/content/zh-cn15871281
reviewer: 内容组
reviewed_at: 2026-10-25
detail_href: ./fix/screen-cast-miracast.html
---

# 无线投屏失败 / 搜不到电视怎么修（Win+K、Miracast、手机投屏）

> ℹ️ 本教程全部是设置与驱动层面的操作，可逆。投屏三要素先记牢：**同一 Wi-Fi、双方功能开启、驱动支持 Miracast**——九成失败案例栽在这三件事上。

## 一句话结论

投屏失败先分类：**「搜不到设备」**查同网段与电视入口（电视端功能名字各异：屏幕镜像/多屏互动/Miracast）；**「搜得到连不上」**查驱动（Windows 跑 `dxdiag` 看 Miracast 支持状态）与 Wi-Fi 频段（5G/2.4G 不同段互不可见）；**「能投但卡」**查信号强度与干扰——投屏走 Wi-Fi 直连，路由器离得远就卡。微软官方口径的第一步永远是：**确认两端都支持且已开启 Miracast，然后重启两端**。

## 30 秒快速排查

1. 电视端打开投屏入口（设置 → 网络与连接 → 屏幕镜像/多屏互动），让它**处于等待被搜索状态**。**期望结果**：电视显示「等待连接」——多数「搜不到」是电视根本没开这个功能。
2. Windows 按 `Win + K`；手机在相册/控制中心点「投屏/无线投屏」。**期望结果**：列表里出现电视；没有 → 电脑/手机与电视**换到同一个 Wi-Fi**（先查电视连的是哪个）再刷新。
3. `Win + R` → `dxdiag` → 保存信息 → 打开txt搜「Miracast」。**期望结果**：「支持，Graphics 驱动程序会显示 HDCP」；「不支持」→ 旧无线网卡驱动或 VPN 虚拟网卡干扰，见步骤 3。

## 适用 / 不适用

**适用**

- 电脑 Win+K 搜不到电视/投屏盒。
- 手机投屏搜得到但连接失败、或投上几秒就断。
- 投屏画面卡顿、音画不同步。
- 「此设备不支持 Miracast」提示。

**不适用**

- 有线连接问题（HDMI 没信号）：看[「显示器无信号 / 分辨率不对 / 外接屏不亮」](./monitor-no-signal.html)。
- 画面花屏条纹：看[「花屏 / 闪屏 / 有条纹：显卡、线还是屏坏了怎么分」](./screen-artifacts-flicker.html)。
- 电视连 Wi-Fi 都失败：先修电视的网络连接（密码/信号），不在本文范围。
- 公司会议室的投屏器（Barco/亿联等）：走厂商 App，按其说明操作。

## 开始前确认

- [ ] 电视和电脑/手机连的是**同一个 Wi-Fi 名称**（2.4G 与 5G 分开命名的要特别注意）。
- [ ] 电视端投屏功能已打开并处于等待状态。
- [ ] 电脑 Wi-Fi 是**开着**的（微软官方明确：即使电脑走网线上网，Miracast 也要求 Wi-Fi 开启）。
- [ ] 关掉 VPN/代理再试（虚拟网卡会劫持 Miracast）。

## 分步骤

### 步骤 1：两端同网 + 重启（官方第一招）

1. 确认电视、电脑/手机在同一个 Wi-Fi；拿不准就把电脑也连电视那个 Wi-Fi。
2. **重启两端**：电视断电 30 秒（不是待机）；电脑重启。
3. 电视重新进入「等待投屏」状态，电脑 `Win+K` 重新搜索。
**期望结果**：设备出现并能连接。**失败了怎么办**：仍搜不到 → 步骤 2。

### 步骤 2：电视端入口与频段核对

1. 电视投屏功能名对照：小米「无线投屏」、华为/荣耀「多屏互动」、索尼/三星「屏幕镜像 Screen Mirroring」、TCL「多屏互动」——在电视**设置 → 网络**里逐一找。
2. 双频路由器「双频合一」的：把两端都手动指到 **2.4G**（兼容性最好）试一次，成功后再回 5G 对比。
3. 电视有线接路由器的：Miracast 走 Wi-Fi 直连，电视插网线不影响，但电脑端 Wi-Fi 必须开。
**期望结果**：设备可见。**失败了怎么办**：电视端确认支持 Miracast 吗？查电视型号参数；不支持 → 用 HDMI 投屏器（电视 USB 供电的 Miracast dongle）或换 DLNA/App 方案（步骤 5）。

### 步骤 3：电脑端——dxdiag 查支持 + 驱动修复

1. `dxdiag` 保存报告，txt 里搜 Miracast：
   - 「支持」→ 驱动没问题，问题在网络层（回步骤 1/2 或进步骤 4）。
   - 「不支持，UiA」或完全没有 → 无线网卡驱动过旧：去笔记本官网装最新 **Wi-Fi 驱动 + 显卡驱动**（Miracast 依赖两者）。
2. 设备管理器确认无线网卡是实体网卡（名字含 Intel/Realtek/MediaTek Wireless），VPN/虚拟机的虚拟网卡在「网络适配器」禁用后重试。
3. 投屏依赖的服务：`services.msc` 里「SSDP Discovery」和「Windows Connect Now」启动。
**期望结果**：Win+K 能搜到并连接。**失败了怎么办**：搜到但连接失败/秒断 → 步骤 4。

### 步骤 4：连得上但卡顿/断流

1. 距离：电脑与电视都靠近路由器（投屏是 Wi-Fi 直连，两端之间的信号才是关键）；信号差的房间先解决覆盖，看[「某些房间 WiFi 信号差 / 一进卧室就断流怎么优化」](./router-wifi-coverage.html)。
2. 干扰：微波炉、蓝牙音箱挪开；路由器换信道（1/6/11）。
3. 降负载：投屏分辨率降到 1080p（电视端/发送端设置里可选「最佳画质/流畅」时选流畅）。
4. 手机端：华为官方建议关闭「WLAN+」功能后重试（智能切换会打断直连）。
**期望结果**：流畅稳定。**失败了怎么办**：仍卡 → 家里 2.4G 太挤，给投屏专用 5G 频段，或干脆用有线 HDMI。

### 步骤 5：替代方案（电视不支持/环境太差时）

1. **HDMI 线直连**：最稳，零延迟，会议/观影首选。
2. **Miracast 投屏器**：电视有 HDMI 口就能加，几十到一两百。
3. **DLNA/App 投放**：只投视频/照片时（爱奇艺/B站 TV 版、AirScreen 等 App），对网络要求低。
4. 苹果生态：Apple TV + 隔空播放，或电视装 AirScreen 接收 AirPlay。
**期望结果**：找到当前环境下最可靠的投屏路径。**失败了怎么办**：接受物理规律——墙厚路由远的环境，有线永远是无冕之王。

## 怎么确认修好了

- Win+K / 手机投屏一次成功，30 分钟观影不断连。
- 重启两端后依然能搜到、能连。
- 延迟可接受（视频同步、鼠标可见移动无明显滞后）。

## 还是不行？

- 只有某台电脑不行、其他设备都能投 → 该电脑网卡/驱动个案，按步骤 3 深挖或买 USB 无线网卡（注意选支持 Miracast 的型号）。
- 公司网络下全员投不了 → 域策略/防火墙拦了 Miracast 端口，找 IT。
- 电视系统太老（5 年+）→ 电视端 Miracast 实现缺陷，投屏器是终解。

## 预防

- 电视固件保持更新（厂商会修投屏兼容性）。
- 家里 2.4G 拥挤的，给投屏固定用 5G 或专门信道。
- 重要场合（开会/上课）提前 5 分钟试投，永远留一根 HDMI 备胎。

## 相关教程

- [显示器无信号 / 分辨率不对 / 外接屏不亮](./monitor-no-signal.html)
- [花屏 / 闪屏 / 有条纹：显卡、线还是屏坏了怎么分](./screen-artifacts-flicker.html)
- [某些房间 WiFi 信号差 / 一进卧室就断流怎么优化](./router-wifi-coverage.html)
- [Wi-Fi 显示已连接但无法上网（打不开网页）](./wifi-connected-but-no-internet.html)

## 更新日志

- 2026-10-25 v1.0：首版发布。流程综合微软官方无线显示器连接修复指南与华为投屏排查文档。
