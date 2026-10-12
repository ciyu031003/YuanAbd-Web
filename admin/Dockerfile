# admin/Dockerfile — 内容后台镜像
# 为什么用容器：服务器上已有 Docker（learn-workbench / travel-notes 都在跑），
# 且宿主机没有 Node。用容器可以复用现成运行时，不污染宿主环境。
FROM node:22-alpine

# 时区：日志与「日期」字段按本地时区显示
ENV TZ=Asia/Shanghai
RUN apk add --no-cache tzdata git bash tar curl && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone

WORKDIR /app

# 依赖层单独缓存
COPY admin/package.json admin/package-lock.json ./admin/
RUN cd admin && npm ci --omit=dev --no-audit --no-fund

# 应用代码
COPY admin ./admin

# 站点仓库（构建脚本 + 内容 + 解析器）通过 volume 挂载到 /srv/fixboxs/repo。
# 这里只做一次构建期存在性断言，避免容器起来了才发现挂载缺失。
RUN test -d /srv/fixboxs/repo || echo "提示：/srv/fixboxs/repo 将在运行时通过 volume 挂载"

# 非 root 运行（最小权限）
RUN addgroup -S admin && adduser -S admin -G admin && chown -R admin:admin /app
USER admin

EXPOSE 3020
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3020/healthz || exit 1

CMD ["node", "admin/src/server.cjs"]
