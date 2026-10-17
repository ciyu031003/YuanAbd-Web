---
title: 驱动、镜像与软件环境杂项：Ubuntu 驱动、WPS VBA、CAD 与网页视频
slug: sop-driver-image-misc
kind: reference
domain: ref-manual
category: ref-driver
os: [Windows, macOS]
difficulty: 入门
time: 10-30 分钟
risk: 需谨慎
symptoms: [驱动、镜像与软件环境杂项 处理方法, SOP 参考]
keywords: [驱动, 镜像与软件环境杂项 SOP, Ubuntu 驱动, WPS VBA, CAD 与网页视频, 参考手册, 作业指导]
aliases: [SOP, 作业指导, 参考手册, 驱动、镜像与软件环境杂项]
updated: 2026-10-17
version: "1.0"
prerequisites: [能登录公司内部 SOP 知识库（部分原文需要账号）]
tools: [浏览器, 内部 SOP 知识库]
related: [sop-pe-usb-install, sop-macos-maintain, sop-diagnose-tools]
sources:
  - title: 公司 SOP 知识库 — 易点云AI AH等自主研发设备驱动、镜像下载
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3135
    type: internal
  - title: 公司 SOP 知识库 — 显卡驱动卸载方法
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3180
    type: internal
  - title: 公司 SOP 知识库 — 26.04乌班图安装
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3308
    type: internal
  - title: 公司 SOP 知识库 — AP22安装Ubuntu22.04显卡驱动+cuda教程
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3288
    type: internal
  - title: 公司 SOP 知识库 — CAD打开卡死无响应处理方法
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3292
    type: internal
  - title: 公司 SOP 知识库 — 浏览器打开网页的视频有声音无画面处理方法
    url: https://mvs-h5.edianzu.cn/tips-detail?id=3390
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

# 驱动、镜像与软件环境杂项：Ubuntu 驱动、WPS VBA、CAD 与网页视频

## 快速概览

SOP 里还有一批「装完系统/装完软件之后的杂项」：Ubuntu 显卡驱动与 CUDA、

WPS 的 VBA 支持库、CAD 打开卡死、Eagle 安装报错、网页视频有声音无画面、BOSS 直聘简历字体模糊……

这些问题的共同点是：**版本与驱动不匹配**。这一页按「系统 / 软件 / 网页」分类索引。

本页共整理 **15** 条 SOP 条目，全部保留原始链接；处理细节以原文为准。

## 适用对象

处理软件环境类工单的工程师；负责专用软件（设计、财务、开发）客户交付的同事。

## 风险提示

> ⚠ 动手前请逐条核对；涉及数据、证件、客户设备安全的操作，先取得授权再执行。

1. Linux 显卡驱动装错会导致**无法进入图形界面**，装前务必准备好恢复方式（例如先装系统自带开源驱动）。
2. 第三方「驱动大师」「一键修复」类工具常把驱动装错版本，明确不建议使用。
3. 网页类问题优先用浏览器硬件加速/字体设置排查，不要直接重装浏览器。

## 分步骤

### 步骤 1：先分清是系统、软件还是网页

**目的**：三个层次解法不同

**操作**：
1. 系统层：驱动、系统组件（例如 VBA 支持库）。
2. 软件层：安装包、版本兼容、加载项。
3. 网页层：浏览器硬件加速、字体渲染、缩放。

**预期结果**：第 1 步的操作都完成后，问题现象能被复现或排除，并能对应到下面「原始 SOP」里的具体条目。

**失败怎么办**：对不上具体条目 → 回到「快速概览」确认现象描述，或按「仍需帮助」一节的说明升级。

### 步骤 2：按官方来源替换组件

**目的**：不要用第三方驱动工具

**操作**：
1. 显卡驱动用厂商官网/Windows 更新；Ubuntu 用官方驱动仓库与匹配版本的 CUDA toolkit。
2. Office/WPS 组件从官方安装包补装。
3. 设计类软件（CAD、Eagle、SolidWorks）按官方兼容列表处理。

**预期结果**：第 2 步的操作都完成后，问题现象能被复现或排除，并能对应到下面「原始 SOP」里的具体条目。

**失败怎么办**：对不上具体条目 → 回到「快速概览」确认现象描述，或按「仍需帮助」一节的说明升级。

### 步骤 3：交付前回归验证

**目的**：客户怎么用就怎么测一遍

**操作**：
1. 用客户实际的软件版本、文件打开测试。
2. Ubuntu 客户要验证 GPU 驱动加载与 CUDA 版本。
3. 网页类问题在同一浏览器、同一缩放比例下复测。

**预期结果**：第 3 步的操作都完成后，问题现象能被复现或排除，并能对应到下面「原始 SOP」里的具体条目。

**失败怎么办**：对不上具体条目 → 回到「快速概览」确认现象描述，或按「仍需帮助」一节的说明升级。

## 原始 SOP

下表的「原文」全部指向公司 SOP 知识库（需要内部账号登录）。点击即可核对处理步骤、截图与注意事项。

| 条目 | 是什么 / 什么时候用 | 一句话提醒 | 原文 |
|---|---|---|---|
| 易点云AI AH等自主研发设备驱动、镜像下载 | 自有设备驱动与镜像。 | 按机型精确匹配 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3135) |
| 亮机卡显卡驱动安装方法 | 装系统后的基础显示驱动。 | 先基础显示再正式驱动 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3391) |
| 显卡驱动卸载方法 | 干净卸载显卡驱动。 | 卸载后重启再装 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3180) |
| 乌班图22.04系统安装在50系显卡方法 | Ubuntu + 50 系显卡。 | 先开源驱动再换闭源 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3293) |
| 26.04乌班图安装 | Ubuntu 26.04 安装。 | 注意内核版本 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3308) |
| 乌班图26安装方法 | Ubuntu 26 安装。 | 双系统分区要谨慎 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3312) |
| AP22安装Ubuntu22.04显卡驱动+cuda教程 | AP22 的驱动与 CUDA。 | 驱动与 CUDA 版本对应 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3288) |
| WPS无法运行VBA支持库 | WPS 的 VBA 组件缺失。 | 从官方补装组件包 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3295) |
| CAD打开卡死无响应处理方法 | CAD 卡死。 | 清缓存、切换显卡加速模式 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3292) |
| Eagle安装后报错无法打开 | 特定软件安装报错。 | 按原文排查依赖 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3337) |
| 浏览器打开网页的视频有声音无画面处理方法 | 网页视频黑屏有声。 | 关闭/开启硬件加速 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3390) |
| BOSS直聘预览简历字体模糊/展示不全 | 特定网页渲染异常。 | 调整缩放与字体渲染 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3284) |
| 原版镜像设置方法及驱动安装方法 | 原版镜像与驱动安装。 | 芯片组→显卡→其他 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3107) |
| 各设备电源适配器出厂标配 | 适配器规格核对。 | 功率不足会降频 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3329) |
| 惠普S01主板差别和USB设置 | S01 主板 USB 设置。 | USB 异常先查这里 | [原文](https://mvs-h5.edianzu.cn/tips-detail?id=3327) |

## 处理明细

上表是把条目「按顺序摊开」；这一节给每一条一条带编号的明细，写入工单时可以直接引用编号，例如「按 SOP 第 12 条的步骤处理」。

### 01｜易点云AI AH等自主研发设备驱动、镜像下载
**是什么**：自有设备驱动与镜像。

- 提醒：按机型精确匹配

**原文**：[易点云AI AH等自主研发设备驱动、镜像下载](https://mvs-h5.edianzu.cn/tips-detail?id=3135)

### 02｜亮机卡显卡驱动安装方法
**是什么**：装系统后的基础显示驱动。

- 提醒：先基础显示再正式驱动

**原文**：[亮机卡显卡驱动安装方法](https://mvs-h5.edianzu.cn/tips-detail?id=3391)

### 03｜显卡驱动卸载方法
**是什么**：干净卸载显卡驱动。

- 提醒：卸载后重启再装

**原文**：[显卡驱动卸载方法](https://mvs-h5.edianzu.cn/tips-detail?id=3180)

### 04｜乌班图22.04系统安装在50系显卡方法
**是什么**：Ubuntu + 50 系显卡。

- 提醒：先开源驱动再换闭源

**原文**：[乌班图22.04系统安装在50系显卡方法](https://mvs-h5.edianzu.cn/tips-detail?id=3293)

### 05｜26.04乌班图安装
**是什么**：Ubuntu 26.04 安装。

- 提醒：注意内核版本

**原文**：[26.04乌班图安装](https://mvs-h5.edianzu.cn/tips-detail?id=3308)

### 06｜乌班图26安装方法
**是什么**：Ubuntu 26 安装。

- 提醒：双系统分区要谨慎

**原文**：[乌班图26安装方法](https://mvs-h5.edianzu.cn/tips-detail?id=3312)

### 07｜AP22安装Ubuntu22.04显卡驱动+cuda教程
**是什么**：AP22 的驱动与 CUDA。

- 提醒：驱动与 CUDA 版本对应

**原文**：[AP22安装Ubuntu22.04显卡驱动+cuda教程](https://mvs-h5.edianzu.cn/tips-detail?id=3288)

### 08｜WPS无法运行VBA支持库
**是什么**：WPS 的 VBA 组件缺失。

- 提醒：从官方补装组件包

**原文**：[WPS无法运行VBA支持库](https://mvs-h5.edianzu.cn/tips-detail?id=3295)

### 09｜CAD打开卡死无响应处理方法
**是什么**：CAD 卡死。

- 提醒：清缓存、切换显卡加速模式

**原文**：[CAD打开卡死无响应处理方法](https://mvs-h5.edianzu.cn/tips-detail?id=3292)

### 10｜Eagle安装后报错无法打开
**是什么**：特定软件安装报错。

- 提醒：按原文排查依赖

**原文**：[Eagle安装后报错无法打开](https://mvs-h5.edianzu.cn/tips-detail?id=3337)

### 11｜浏览器打开网页的视频有声音无画面处理方法
**是什么**：网页视频黑屏有声。

- 提醒：关闭/开启硬件加速

**原文**：[浏览器打开网页的视频有声音无画面处理方法](https://mvs-h5.edianzu.cn/tips-detail?id=3390)

### 12｜BOSS直聘预览简历字体模糊/展示不全
**是什么**：特定网页渲染异常。

- 提醒：调整缩放与字体渲染

**原文**：[BOSS直聘预览简历字体模糊/展示不全](https://mvs-h5.edianzu.cn/tips-detail?id=3284)

### 13｜原版镜像设置方法及驱动安装方法
**是什么**：原版镜像与驱动安装。

- 提醒：芯片组→显卡→其他

**原文**：[原版镜像设置方法及驱动安装方法](https://mvs-h5.edianzu.cn/tips-detail?id=3107)

### 14｜各设备电源适配器出厂标配
**是什么**：适配器规格核对。

- 提醒：功率不足会降频

**原文**：[各设备电源适配器出厂标配](https://mvs-h5.edianzu.cn/tips-detail?id=3329)

### 15｜惠普S01主板差别和USB设置
**是什么**：S01 主板 USB 设置。

- 提醒：USB 异常先查这里

**原文**：[惠普S01主板差别和USB设置](https://mvs-h5.edianzu.cn/tips-detail?id=3327)

## 仍需帮助

- 原文能对上但做不下去：按「工单升级方法」带上截图与现象升级，不要在客户现场硬试。
- 本文与原文不一致：以原文为准，并在「纠错与反馈」告诉我们，我们会回来更新这份索引。
- 需要看具体的排障思路，而不是 SOP 索引：去「领域」页找对应的故障教程。
