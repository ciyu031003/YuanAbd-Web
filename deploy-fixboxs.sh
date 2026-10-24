#!/usr/bin/env bash
# deploy-fixboxs.sh -- 修盒子（pc-fixboxs.yuanabd.cn）一键部署
#
# 做四件事：
#   1) 构建自包含产物 dist/fixboxs/（含 tokens.css 复制与 ?v= 内容哈希）
#   2) 打包上传到服务器 /tmp
#   3) 调用 atomic-switch.sh 做「原子切换」（保留上一版 /var/www/fixboxs.prev 便于回滚）
#   4) 调用 verify-live.sh 做「线上全量校验」（覆盖全部产物页，非手工 6 条清单）
#
# 用法：
#   bash deploy-fixboxs.sh              # 完整部署
#   bash deploy-fixboxs.sh --check      # 只构建并自检，不上传
#   bash deploy-fixboxs.sh --verify-only# 跳过构建，只做线上全量校验
#
# 注意：服务器 nginx 配置在 /etc/nginx/sites-available/fixboxs，
#       备份在 /var/www/backups/，本脚本不改动 nginx 配置。
#
# 设计说明（V2 §7.5/§7.6）：
#   原子切换与线上校验各自抽成独立脚本，供「手工部署」与「后台发布 worker」
#   共用同一实现，避免两条路径各写一份后开始漂移。
set -euo pipefail

cd "$(dirname "$0")"

DOMAIN="pc-fixboxs.yuanabd.cn"
REMOTE_ROOT="/var/www/fixboxs"
TARBALL="dist-fixboxs.tgz"

MODE="deploy"
case "${1:-}" in
  --check) MODE="check" ;;
  --verify-only) MODE="verify" ;;
  "") ;;
  *) echo "未知参数: $1" >&2; exit 2 ;;
esac

if [ "$MODE" != "verify" ]; then
  echo "==> 1/3 构建产物"
  node deploy-fixboxs.cjs
fi

if [ "$MODE" = "check" ]; then
  echo "==> --check：构建完成，未上传"
  exit 0
fi

if [ "$MODE" = "deploy" ]; then
  echo "==> 2/3 打包并原子切换"
  rm -f "$TARBALL"
  tar -czf "$TARBALL" -C dist/fixboxs .
  bash atomic-switch.sh "$TARBALL" "$REMOTE_ROOT"
fi

echo "==> 3/3 线上全量校验"
bash verify-live.sh --dir dist/fixboxs --domain "$DOMAIN"

echo "==> 部署完成：https://${DOMAIN}/"
