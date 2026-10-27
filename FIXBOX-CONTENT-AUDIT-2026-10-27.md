# 修盒子内容审计与小白一键修复落地报告

审计日期：2026-10-27
增量复核：2026-10-27
范围：`content/fixboxs/*.md` 全部 82 篇、生成文章页、文章内链、命令块、来源链接与 BAT 方案。

## 1. 审计结果

- 文章：82 篇，覆盖 14 个领域。
- 风险分布：安全 21 篇、需谨慎 52 篇、有数据风险 9 篇。
- 结构检查：`content-lint.cjs` 为 0 error / 0 warning / 0 info。
- 正文命令块：137 个；Markdown 链接：1,584 条。
- Front-matter：310 条来源 URL；解析、序列化、换行与空值往返测试通过。
- 来源在线检查：230 个去重 URL，225 个返回正常或可跳转；5 个因站点反爬、地区限制或网络拒绝无法自动确认。没有仅凭 HTTP 状态就删除来源。
- 站内链接：构建及部署自检均为 0 断链。
- 累计 18 个 BAT，接入 23 篇文章；所有脚本均可在文章页直接下载、展开查看全部源码、一键复制源码。
- 反馈邮箱已改为 `yuanhm0821@foxmail.com`。

## 2. 已修正的技术与内容问题

| 文章 | 原问题 | 处理 |
|---|---|---|
| `wifi-connected-but-no-internet` | 风险标成“安全”；把 Winsock/TCP-IP 重置写成会清空 Wi-Fi 密码 | 改为“需谨慎”；区分 `netsh` 重置与 Windows 系统级“网络重置”的影响范围 |
| `browser-proxy` | 清除代理被标成“安全” | 改为“需谨慎”，明确企业代理、VPN 内网可能失效 |
| `win-forgot-password` | 正文明确存在 BitLocker 数据风险，但风险等级仅为“需谨慎” | 改为“有数据风险” |
| `win-stuck-on-boot-logo` | 涉及 `chkdsk`、启动修改和重置，但风险等级偏低 | 改为“有数据风险” |
| `mac-forgot-password` | 写成“输错三次一定出现 Apple 账户重置”，且低估 FileVault/钥匙串风险 | 改为取决于系统、账户与 FileVault 状态；升级为“有数据风险” |
| `mac-battery-health` | 暗示必须满充才能看健康数据，并把完整充放电描述为刷新计量 | 改为现代 Mac 不需要定期校准；以系统状态与实际续航判断 |
| `printer-shared-error-11b` | 承诺“接近 100%”恢复；注册表降低 RPC 隐私保护但缺少后续恢复提醒 | 删除成功率承诺；仅作版本不适用时的临时方案，并要求后续改回 `1` 或删除 |
| `win-update-stuck` | 固定要求安装某个旧 KB 包，容易与系统版本/架构不匹配 | 改为先从 Update Catalog 匹配本机版本，再替换真实文件名；补充 Windows 10 已于 2025-10-14 结束常规支持 |
| 首页 | “大家都在修”声称按近期访问量排序，但站点没有访问统计 | 改为“按常见故障推荐” |
| 公共页脚/构建模板 | 文章页仍写“全部 12 个领域”，与当前 14 个不一致 | 统一为 14 |
| `fx-frontmatter.test.cjs` | 硬编码文章数、URL 数、来源类型数，且来源枚举易与 taxonomy 漂移 | 改为按当前原文与 taxonomy 动态对账，文章和来源类型增长不再误报 |
| `win-store-not-opening` | “九成 wsreset 就好”属于无数据支持的命中率承诺；商店前置条件不清；BAT 只清缓存 | 删除成功率承诺；明确 Windows 更新正常是商店可用前提；BAT 先验更新服务，再清缓存和重新注册商店 |

## 3. 已接入小白一键修复的 23 篇文章

| 文章 | BAT |
|---|---|
| `bluetooth-device-not-pairing` | `restart-bluetooth-services.bat` |
| `browser-proxy` | `reset-proxy-settings.bat` |
| `dhcp-no-ip-169-254` | `fix-network-stack.bat` |
| `dns-broken-but-app-works` | `flush-dns-cache.bat` |
| `printer-offline` | `clear-print-queue.bat` |
| `proxy-server-not-responding` | `reset-proxy-settings.bat` |
| `proxy-tool-broke-network` | `reset-proxy-settings.bat` |
| `usb-drive-not-recognized` | `rescan-usb-devices.bat` |
| `webcam-not-working` | `restart-camera-service.bat` |
| `wifi-adapter-missing` | `restart-wifi-adapter.bat` |
| `wifi-connected-but-no-internet` | `fix-network-stack.bat` |
| `wifi-ssid-not-found` | `restart-wifi-adapter.bat` |
| `win-app-crash-missing-dll` | `repair-system-files.bat` |
| `win-blackscreen-cursor` | `restart-explorer.bat` |
| `win-c-drive-full-cleanup` | `cleanup-temp-files.bat` |
| `win-no-sound` | `restart-audio-services.bat` |
| `win-safe-restore` | `open-recovery-settings.bat` |
| `win-store-not-opening` | `repair-microsoft-store.bat` |
| `win-update-stuck` | `repair-windows-update.bat` |
| `win-update-enable` | `manage-windows-update.bat` |
| `win-update-pause` | `manage-windows-update.bat` |
| `codex-desktop-install` | `open-codex-install.bat` |
| `codex-cli-install` | `install-codex-cli.bat` |

BAT 统一规则：

- 需要管理员权限的脚本自动请求 UAC，执行前再次显示影响范围并要求选择 `Y/N`。
- 禁止自动格式化、分区、静默重装、上传文件、下载外部可执行文件或修改安全账户。
- 脚本不会调用来源不明的第三方工具；系统自带命令之外只使用 PowerShell 系统 cmdlet。
- 文章页读取真实 `.bat` 源码渲染，下载文件、说明与“查看源码”不会出现两套内容。
- 浏览器无法直接下载时，可使用“复制全部脚本”保存为 TXT，再把后缀改为 `.bat`。
- Windows 更新开关不永久停更：只恢复服务，或暂停 24 小时后由计划任务自动恢复。
- Codex CLI 只在用户已有 Node.js/npm 时安装官方包 `@openai/codex`；缺少 Node.js 时仅打开官方下载页。

## 4. 未接入 BAT 的 59 篇及原因

### macOS、系统选择或平台不兼容（9 篇）

`mac-battery-health`、`mac-fan-noise-overheat`、`mac-forgot-password`、`mac-storage-system-data`、`mac-time-machine-troubleshoot`、`mac-wifi-keeps-dropping`、`mac-wont-boot`、`icloud-storage-full`、`sop-macos-maintain`。

原因：BAT 仅能在 Windows CMD 下运行；这些流程还依赖 Apple Silicon/Intel、FileVault、恢复模式或磁盘工具的具体状态。

### 硬件、数据恢复与不可逆操作（12 篇）

`backup-before-repair`、`deleted-file-recovery`、`disk-clicking-failure`、`format-partition-recovery`、`laptop-battery-not-charging`、`monitor-no-signal`、`partition-manager`、`pc-overheat-cleaning`、`printer-jam-quality`、`psu-no-power-check`、`ram-reseat-no-boot`、`screen-artifacts-flicker`。

原因：需要观察异响、指示灯、SMART、物理连接或画面变化。错误自动化可能覆盖待恢复数据、破坏分区或掩盖硬件故障。

### 网络、路由器与设备环境判断（13 篇）

`dns-hijack`、`enterprise-proxy`、`ethernet-no-link`、`home-network-all-offline`、`ip-conflict-locate-device`、`printer-network-ip-fixed`、`router-admin-page-unreachable`、`router-firmware-reset`、`router-port-forward`、`router-wifi-coverage`、`router-wifi-leech-check`、`screen-cast-miracast`、`slow-network`。

原因：需要确认 ISP、光猫、路由器后台、AP 隔离、网段、端口映射和设备归属，不能在本机盲改。

### 安全事件、账号止损与恶意软件（6 篇）

`leak-check`、`malware-first-response`、`phishing-message-check`、`ransomware-encrypted-response`、`remote-control-scam`、`win-popup-ads-hijack`。

原因：涉及证据保全、账号冻结、恶意样本判断与数据处置；固定 BAT 容易误删证据或给出错误安全感。

### Windows 故障树判断或当前无法进入桌面（7 篇）

`driver-install-rollback`、`printer-shared-error-11b`、`win-bluescreen-read-code`、`win-forgot-password`、`win-slow-diagnose`、`win-startup-apps-disable`、`win-stuck-on-boot-logo`。

原因：需要蓝屏代码、设备型号、启动状态或具体注册表兼容性判断。共享打印机 11b 的注册表改动不应被一键静默执行；卡 Logo 时通常也无法运行本地 BAT。

### 第三方或团队 SOP / 参考资料（12 篇）

`sop-billable-repair`、`sop-bios-post-errors`、`sop-data-backup-migrate`、`sop-diagnose-tools`、`sop-driver-image-misc`、`sop-hardware-peripheral`、`sop-new-device-onboarding`、`sop-onsite-service`、`sop-pe-usb-install`、`sop-printer-connected-fix`、`sop-testing-practice`、`sop-ticket-workflow`。

原因：这些是运维手册与现场 SOP，不是单一可自动复现的故障；其中系统安装、BIOS、资产与工单动作不能安全收敛成一个通用 BAT。

## 5. 发布与回归门禁

- `node content-lint.cjs`
- `node fx-frontmatter.test.cjs`
- `node fixboxs-bat.test.cjs`
- `node build-fix.cjs`
- `node deploy-fixboxs.cjs`
- 桌面 1440×940、移动端 390×844、360×800、320×760 截图与横向溢出检查。
- 37 个页面与视口状态回归，覆盖新增的更新、商店和两篇 Codex 教程；零控制台错误、零失败请求。
- 新增 4 个 BAT 的 HTTP 200、关键命令内容、源码展开、复制按钮、管理员运行说明与移动端触控尺寸检查。
- 全部 HTML、CSS、JS、数据和 BAT 进入自包含产物；线上逐页 HTTP 200 校验。
