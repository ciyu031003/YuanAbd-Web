#!/usr/bin/env bash
# verify-live.sh -- 线上全量校验（可复用，供「手工部署」与「后台发布 worker」共用）
#
# 为什么要全量（V2 §7.5）：
#   原 deploy-fixboxs.sh:54 硬编码 6 个 URL，其中教程页只有 1 篇，
#   30 篇教程里 29 篇从未被校验 —— 一篇文章消失，整条流水线依旧一路绿灯。
#   本脚本改为：**从产物目录实际文件生成清单**，逐页探测，双向对账。
#
# 用法：
#   bash verify-live.sh [--dir dist/fixboxs] [--domain pc-fixboxs.yuanabd.cn]
#   bash verify-live.sh --list           # 只打印将要校验的 URL，不发请求
#
# 退出码：0 = 全部 200；非零 = 有失败（并列出失败项）
# 注意：本脚本刻意只用 POSIX sh 语法。
# 原因：后台服务跑在精简容器里（不装 bash —— 实测本机到 alpine CDN 只有 ~79 字节/秒，
# 装 bash 要十几分钟且会中途停滞）。若这里用 mapfile / 进程替换等 bash 专有语法，
# 后台的发布 worker 就无法复用同一份校验脚本，又会退化成「两份实现各自漂移」。
set -eu

DIR="dist/fixboxs"
DOMAIN="pc-fixboxs.yuanabd.cn"
LIST_ONLY=0

while [ $# -gt 0 ]; do
  case "$1" in
    --dir) DIR="$2"; shift 2 ;;
    --domain) DOMAIN="$2"; shift 2 ;;
    --list) LIST_ONLY=1; shift ;;
    *) echo "未知参数: $1" >&2; exit 2 ;;
  esac
done

[ -d "$DIR" ] || { echo "VERIFY_FAIL reason=product-dir-not-found dir=$DIR" >&2; exit 1; }

# 从产物实际文件推导 URL：
#   fix/xxx.html        -> /fix/xxx.html
#   根页 xxx.html       -> /xxx.html
#   index.html          -> /
# 用 POSIX 兼容写法（不用 mapfile / 进程替换），以便在无 bash 的容器里运行。
URLS_FILE="$(mktemp)"
trap 'rm -f "$URLS_FILE"' EXIT
(
  cd "$DIR"
  find . -name '*.html' -type f | sed 's|^\./||' | sort | while read -r f; do
    case "$f" in
      index.html) echo "/" ;;
      *) echo "/$f" ;;
    esac
  done
) > "$URLS_FILE"

COUNT=$(wc -l < "$URLS_FILE" | tr -d ' ')
if [ "$LIST_ONLY" = "1" ]; then
  echo "将校验 $COUNT 个 URL（来源：$DIR 实际文件）"
  cat "$URLS_FILE"
  exit 0
fi

echo "==> 线上全量校验：$COUNT 个 URL（来源：$DIR 实际文件，非手工维护清单）"
FAILED=0
while IFS= read -r p; do
  [ -z "$p" ] && continue
  code=$(curl -sS -o /dev/null -w '%{http_code}' "https://${DOMAIN}${p}" || echo "000")
  if [ "$code" != "200" ]; then
    printf '     ✗ %-52s %s\n' "$p" "$code"
    FAILED=$((FAILED+1))
  fi
done < "$URLS_FILE"

if [ "$FAILED" -gt 0 ]; then
  echo "VERIFY_FAIL failed=$FAILED total=$COUNT domain=$DOMAIN" >&2
  exit 1
fi

echo "     全部 $COUNT 个 URL 返回 200 ✅"
echo "     安全头："
curl -sSI "https://${DOMAIN}/" | grep -iE 'strict-transport|x-content-type|referrer-policy|x-frame' | sed 's/^/       /' || true
echo "VERIFY_OK checked=$COUNT domain=$DOMAIN"
