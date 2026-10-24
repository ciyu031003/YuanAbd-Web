#!/usr/bin/env bash
# fixboxs-content-commit.sh — 宿主机侧内容提交（配合容器内后台）
#
# 为什么由宿主机做：
#   本机到 alpine CDN 实测约 79 字节/秒，在后台镜像里装 git 要十几分钟且会停滞；
#   而容器挂载 docker socket 调宿主 git 等于把宿主 root 交给容器，不可接受。
#   宿主机本来就有 git，提交又是纯本地操作 —— 放在这里最简单也最安全。
#
# 触发方式（任选其一）：
#   1) systemd timer 每 5 分钟扫一次（推荐，见 fixboxs-content-commit.timer）
#   2) 手动执行该脚本
#
# 退出码：0 正常（包括「无变更」）；非零表示 git 操作失败。
set -euo pipefail

REPO="${FIXBOXS_REPO:-/srv/fixboxs/repo}"
AUTHOR_NAME="${GIT_AUTHOR_NAME:-fixboxs-admin}"
AUTHOR_EMAIL="${GIT_AUTHOR_EMAIL:-admin@yuanabd.cn}"
REQ="$REPO/.admin-commit-request"
LOG="${FIXBOXS_COMMIT_LOG:-/srv/fixboxs/content-commit.log}"

cd "$REPO"

# 只在内容目录有变更时提交
if [ -z "$(git status --porcelain content/ 2>/dev/null)" ]; then
  # 有请求文件但无变更 → 清掉请求，避免堆积
  [ -f "$REQ" ] && rm -f "$REQ"
  exit 0
fi

MESSAGE="content: 后台内容更新 $(date '+%Y-%m-%d %H:%M:%S')"
if [ -f "$REQ" ]; then
  # 优先使用后台写入的说明
  MESSAGE=$(python3 -c 'import json,sys;print(json.load(open("'"$REQ"'"))["message"])' 2>/dev/null || echo "$MESSAGE")
fi

git add content/
git -c user.name="$AUTHOR_NAME" -c user.email="$AUTHOR_EMAIL" commit -q -m "$MESSAGE"
rm -f "$REQ"

{
echo "[$(date '+%Y-%m-%d %H:%M:%S')] committed: $MESSAGE"
git log --oneline -1
} >> "$LOG"
echo "committed: $MESSAGE"
# ---- 提交后回推 GitHub（防分叉；失败只告警，不影响已完成的提交）----
# 背景：本脚本在服务器仓库做本地提交，若从不回推，GitHub 与服务器会渐行渐远，
#   下一次「服务器 git pull」就会 ff 失败（2026-10-24 实际发生过一次，靠 reset 解决）。
# 凭证：使用专用写权限 deploy key（见《内容后台-部署与运维手册》§内容同步）。
#   未配置凭证时 push 会失败并留下 WARN 日志——此时请尽快手工同步。
PUSH_URL="${FIXBOXS_PUSH_URL:-github-fixboxs:ciyu031003/YuanAbd-Web.git}"
if ! git push "$PUSH_URL" HEAD:main >>"$LOG" 2>&1; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARN: git push 失败（deploy key 未配置或网络异常）——服务器与 GitHub 已分叉，请尽快处理" | tee -a "$LOG"
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] pushed: $PUSH_URL (main)" >> "$LOG"
fi
