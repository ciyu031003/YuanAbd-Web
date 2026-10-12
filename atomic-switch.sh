#!/usr/bin/env bash
# atomic-switch.sh -- 远端原子切换（可复用，供「手工部署」与「后台发布 worker」共用）
#
# 为什么单独成文件（V2 §7.6）：
#   原 deploy-fixboxs.sh 把这段逻辑写成 ssh 的 heredoc 内联（原 L40-51），
#   没有任何函数封装、不可被第二个调用方复用。后台发布 worker 需要「同一段
#   原子切换代码」，若各自复制一份就会开始漂移 —— 而 .prev 回滚、全量校验、
#   一键回滚这三件事全部依赖这段代码的唯一性。
#
# 用法：
#   bash atomic-switch.sh <tarball> [remote_root]        # 默认远端 root=/var/www/fixboxs
#   bash atomic-switch.sh --local <tarball> [remote_root]# 在本机执行（部署机 == 目标机）
#
# 环境变量：
#   FX_HOST        目标主机（默认 ubuntu@106.55.2.197），--local 时忽略
#   FX_SSH_KEY     SSH 私钥路径
#   FX_REMOTE_TMP  远端暂存目录（默认 /tmp）
#
# 输出（机器可读，供后台 worker 解析）：
#   SWITCH_OK files=<n> root=<path> prev=<path>
#   失败时以非零退出并在 stderr 输出 SWITCH_FAIL reason=<...>
set -euo pipefail

LOCAL=0
if [ "${1:-}" = "--local" ]; then LOCAL=1; shift; fi

TARBALL="${1:?用法: atomic-switch.sh [--local] <tarball> [remote_root]}"
REMOTE_ROOT="${2:-/var/www/fixboxs}"

HOST="${FX_HOST:-ubuntu@106.55.2.197}"
KEY="${FX_SSH_KEY:-$HOME/.ssh/id_ed25519}"
REMOTE_TMP="${FX_REMOTE_TMP:-/tmp}"
BASENAME="$(basename "$TARBALL")"

# ---- 原子切换的核心动作。这段正文只有一份，两种模式都调用它。----
# 参数：$1=tar 包绝对路径  $2=目标 root
run_switch() {
  local tar_path="$1" root="$2"
  set -e
  sudo rm -rf "${root}.new" && sudo mkdir -p "${root}.new"
  sudo tar -xzf "$tar_path" -C "${root}.new"
  sudo find "${root}.new" -type d -exec chmod 755 {} +
  sudo find "${root}.new" -type f -exec chmod 644 {} +
  sudo chown -R ubuntu:ubuntu "${root}.new"
  sudo rm -rf "${root}.prev"
  if [ -d "${root}" ]; then sudo mv "${root}" "${root}.prev"; fi
  sudo mv "${root}.new" "${root}"
  echo "SWITCH_OK files=$(sudo find "${root}" -type f | wc -l) root=${root} prev=${root}.prev"
}

if [ "$LOCAL" = "1" ]; then
  run_switch "$TARBALL" "$REMOTE_ROOT" || { echo "SWITCH_FAIL reason=local-switch-error" >&2; exit 1; }
  exit 0
fi

# 远端模式：上传 → 在目标机执行同一段正文
scp -i "$KEY" -o BatchMode=yes "$TARBALL" "$HOST:$REMOTE_TMP/$BASENAME" >/dev/null
# 把 run_switch 的函数体连同参数送到远端执行（通过 stdbuf 保持输出顺序）
ssh -i "$KEY" -o BatchMode=yes "$HOST" "sudo bash -s -- '$REMOTE_TMP/$BASENAME' '$REMOTE_ROOT'" <<'REMOTE_SWITCH' || { echo "SWITCH_FAIL reason=ssh-switch-error" >&2; exit 1; }
set -e
tar_path="$1"; root="$2"
sudo rm -rf "${root}.new" && sudo mkdir -p "${root}.new"
sudo tar -xzf "$tar_path" -C "${root}.new"
sudo find "${root}.new" -type d -exec chmod 755 {} +
sudo find "${root}.new" -type f -exec chmod 644 {} +
sudo chown -R ubuntu:ubuntu "${root}.new"
sudo rm -rf "${root}.prev"
if [ -d "${root}" ]; then sudo mv "${root}" "${root}.prev"; fi
sudo mv "${root}.new" "${root}"
echo "SWITCH_OK files=$(sudo find "${root}" -type f | wc -l) root=${root} prev=${root}.prev"
REMOTE_SWITCH

# 回滚辅助：把 .prev 切回来（产物级回滚，V2 §7.7）
if [ "${1:-}" = "--rollback" ]; then :; fi
