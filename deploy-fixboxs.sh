#!/usr/bin/env bash
# deploy-fixboxs.sh -- 修盒子（pc-fixboxs.yuanabd.cn）一键部署
#
# 做四件事：
#   1) 构建自包含产物 dist/fixboxs/（含 tokens.css 复制与 ?v= 内容哈希）
#   2) 打包上传到服务器 /tmp
#   3) 解包到 /var/www/fixboxs.new 后「原子切换」，保留上一版 /var/www/fixboxs.prev 便于回滚
#   4) 校验 HTTP 状态与响应头
#
# 用法：
#   bash deploy-fixboxs.sh            # 完整部署
#   bash deploy-fixboxs.sh --check    # 只构建并自检，不上传
#
# 注意：服务器 nginx 配置在 /etc/nginx/sites-available/fixboxs，
#       备份在 /var/www/backups/，本脚本不改动 nginx 配置。
set -euo pipefail

cd "$(dirname "$0")"

KEY="${FX_SSH_KEY:-$HOME/.ssh/id_ed25519}"
HOST="${FX_HOST:-ubuntu@106.55.2.197}"
DOMAIN="pc-fixboxs.yuanabd.cn"
REMOTE_ROOT="/var/www/fixboxs"
TARBALL="dist-fixboxs.tgz"

echo "==> 1/4 构建产物"
node deploy-fixboxs.cjs

if [ "${1:-}" = "--check" ]; then
  echo "==> --check：构建完成，未上传"
  exit 0
fi

echo "==> 2/4 打包并上传"
rm -f "$TARBALL"
tar -czf "$TARBALL" -C dist/fixboxs .
scp -i "$KEY" -o BatchMode=yes "$TARBALL" "$HOST:/tmp/$TARBALL"

echo "==> 3/4 远端原子切换"
ssh -i "$KEY" -o BatchMode=yes "$HOST" 'bash -s' <<REMOTE
set -e
sudo rm -rf ${REMOTE_ROOT}.new && sudo mkdir -p ${REMOTE_ROOT}.new
sudo tar -xzf /tmp/${TARBALL} -C ${REMOTE_ROOT}.new
sudo find ${REMOTE_ROOT}.new -type d -exec chmod 755 {} +
sudo find ${REMOTE_ROOT}.new -type f -exec chmod 644 {} +
sudo chown -R ubuntu:ubuntu ${REMOTE_ROOT}.new
sudo rm -rf ${REMOTE_ROOT}.prev
if [ -d ${REMOTE_ROOT} ]; then sudo mv ${REMOTE_ROOT} ${REMOTE_ROOT}.prev; fi
sudo mv ${REMOTE_ROOT}.new ${REMOTE_ROOT}
echo "     远端文件数: \$(find ${REMOTE_ROOT} -type f | wc -l)"
REMOTE

echo "==> 4/4 线上校验"
for p in / /browse.html /search.html /wizard.html /tools.html /fix/wifi-connected-but-no-internet.html; do
  code=$(curl -sS -o /dev/null -w '%{http_code}' "https://${DOMAIN}${p}")
  printf '     %-46s %s\n' "$p" "$code"
  [ "$code" = "200" ] || { echo "     !! 期望 200，实际 $code"; exit 1; }
done
echo "     安全头："
curl -sSI "https://${DOMAIN}/" | grep -iE 'strict-transport|x-content-type|referrer-policy|x-frame' | sed 's/^/       /'
echo "==> 部署完成：https://${DOMAIN}/"
