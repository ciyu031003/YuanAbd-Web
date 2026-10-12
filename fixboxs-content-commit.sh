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