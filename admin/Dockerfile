# admin/Dockerfile — 内容后台镜像
# 为什么用容器：服务器上已有 Docker（learn-workbench / travel-notes 都在跑），
# 且宿主机没有 Node。用容器复用现成运行时，不污染宿主环境。
#
# 关于「镜像里装什么」的重要取舍（实测结论）：
#   本机到 alpine CDN 的下载速度实测只有 ~79 字节/秒，装一个 git 包要十几分钟
#   且会中途停滞。因此镜像里**不装任何 apk 包**，只用 node:22-alpine 自带的东西：
#     · sh / tar / wget  由 busybox 提供
#     · git 操作改为调用宿主机 git（通过挂载的 wrapper 脚本 exec 到宿主）
#   代价：发布流程依赖宿主机 git（本来就有）；收益：镜像秒级构建、可重复构建。
FROM node:22-alpine

ENV TZ=Asia/Shanghai
WORKDIR /app

# 依赖层单独缓存
COPY admin/package.json admin/package-lock.json ./admin/
RUN cd admin && npm ci --omit=dev --no-audit --no-fund

# 应用代码
COPY admin ./admin

# 非 root 运行（最小权限）
RUN addgroup -S admin && adduser -S admin -G admin && chown -R admin:admin /app
USER admin

EXPOSE 3020
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3020/healthz || exit 1

CMD ["node", "admin/src/server.cjs"]
