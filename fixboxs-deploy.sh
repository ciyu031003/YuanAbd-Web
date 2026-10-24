#!/bin/sh
# fixboxs-deploy.sh — 宿主机侧部署（消费后台容器写的部署请求）
#
# 职责：把容器已生成好的 dist-fixboxs.tgz 做「原子切换 + 线上全量校验」。
#
# 为什么在宿主机做（与 git 提交同一逻辑）：
#   原子切换要写 /var/www/fixboxs 并 chown -R，需要 root；
#   而容器里没有 sudo，也不应通过 docker socket / 特权去取得宿主 root。
#   宿主机本来就有 sudo 与 /var/www —— 权限最小、链路最短。
#
# 触发方式：
#   1) systemd timer 每 2 分钟扫一次（推荐）
#   2) 手动执行
#
# 退出码：0 = 无待处理请求或部署成功；非零 = 部署失败。
set -eu

REPO="${FIXBOXS_REPO:-/srv/fixboxs/repo}"
REQ="$REPO/.admin-deploy-request"
ROOT="${FIXBOXS_WWW:-/var/www/fixboxs}"
DOMAIN="${FIXBOXS_DOMAIN:-pc-fixboxs.yuanabd.cn}"
LOG="${FIXBOXS_DEPLOY_LOG:-/srv/fixboxs/deploy.log}"

# 没有请求就直接退出（避免每 2 分钟无谓地重新部署）
if [ ! -f "$REQ" ]; then
  exit 0
fi

TARBALL="$REPO/dist-fixboxs.tgz"
if [ ! -f "$TARBALL" ]; then
  echo "找不到产物包：$TARBALL（保留请求，等待下次重试）" >&2
  exit 1
fi

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"; }

log "开始部署（请求文件 $REQ）"

# ---- 原子切换：调用仓库里同一份脚本（本地模式） ----
# 注意用 sh 而非 bash：宿主机有 bash，但统一用 sh 可以保证与容器侧的调用方式一致。
cd "$REPO"
if ! sh ./atomic-switch.sh --local "$TARBALL" "$ROOT" >> "$LOG" 2>&1; then
  log "原子切换失败"
  exit 1
fi
SWITCH_LINE=$(grep 'SWITCH_OK' "$LOG" | tail -1 || true)
log "原子切换完成：$SWITCH_LINE"

# ---- 线上全量校验 ----
if ! sh ./verify-live.sh --dir "$REPO/dist/fixboxs" --domain "$DOMAIN" >> "$LOG" 2>&1; then
  log "线上校验失败：站点可能有问题，请检查"
  log "回滚请执行：sudo rm -rf ${ROOT}.failed && sudo mv $ROOT ${ROOT}.failed && sudo mv ${ROOT}.prev $ROOT"
  exit 1
fi
VERIFY_LINE=$(grep 'VERIFY_OK' "$LOG" | tail -1 || true)
log "线上校验通过：$VERIFY_LINE"

# 成功后才删除请求文件（失败时保留，便于重试与排查）
rm -f "$REQ"
log "部署完成：https://$DOMAIN/"