#!/bin/bash
# 修盒子后台备份 → /data（cosfs 对象存储）。保留 30 天。
#
# 沿用同机既有备份约定（/usr/local/bin/backup-db.sh）：
#   · 从容器内 dump，避免把数据库端口暴露到网络
#   · PG 用自定义格式（-Fc），并用 pg_restore --list 读一遍归档目录做**可恢复性自检**
#   · 坏备份立即删除并记 FAILED —— 绝不留下「看起来成功」的坏文件
#
# 注意：pg_restore --list 读完 TOC 就退出，会让上游 cat 收到 SIGPIPE（141）；
#       所以不用 pipefail，改为显式读 PIPESTATUS[1]。
set -u

TS=$(date +%F)
DEST=/data/backups/yuanabd-pc-fixboxs
PG_CONTAINER=learn-workbench-db-1
DB_NAME=yuanabd_pc_fixboxs
REPO=/srv/fixboxs/repo
KEEP_DAYS=30

mkdir -p "$DEST/db" "$DEST/content"
FAIL=0

log() { echo "[$(date '+%F %T')] $*"; }

# ---------------- 1) 后台数据库（独立库，只 dump 自己的库） ----------------
# 绝不使用 pg_dumpall：那会把服务器上所有库一起导出，回灌时误伤面太大。
OUT="$DEST/db/pg-$TS.dump"
if docker exec "$PG_CONTAINER" sh -c "exec pg_dump -Fc -U lwb $DB_NAME" > "$OUT" 2>/dev/null && [ -s "$OUT" ]; then
  cat "$OUT" | docker exec -i "$PG_CONTAINER" pg_restore --list >/dev/null 2>&1
  if [ "${PIPESTATUS[1]}" -eq 0 ]; then
    log "db ok: $(du -h "$OUT" | cut -f1)（pg_restore --list 自检通过）"
  else
    log "db FAILED（归档不可读，已删除坏备份）"
    rm -f "$OUT"; FAIL=1
  fi
else
  log "db FAILED（pg_dump 失败或输出为空）"
  rm -f "$OUT"; FAIL=1
fi

# ---------------- 2) 内容仓库（正文唯一真源） ----------------
# 内容真源是 git 仓库，所以用 bundle 而非裸拷贝：bundle 自带完整历史，
# 且可以直接 git clone 回来，比 tar 快照更可靠、更省空间。
if [ -d "$REPO/.git" ]; then
  OUTB="$DEST/content/repo-$TS.bundle"
  if git -C "$REPO" bundle create "$OUTB" --all 2>/dev/null && [ -s "$OUTB" ]; then
    # 自检必须**真正克隆一次**，而不是只看 git bundle verify。
    #
    # 为什么：实测踩过坑 —— 浅克隆仓库（git clone --depth 1）生成的 bundle
    # 能通过 `git bundle verify`，却**无法 clone**（fatal: Failed to traverse
    # parents / remote did not send all necessary objects）。verify 只检查
    # refs/HEAD 是否可解析，不检查对象是否完整。
    # 一个「验证通过但恢复不了」的备份比没有备份更危险，所以这里做真实克隆。
    TMPC=$(mktemp -d)
    if git clone -q --no-local "$OUTB" "$TMPC/check" >/dev/null 2>&1; then
      NCOMMITS=$(git -C "$TMPC/check" rev-list --count HEAD 2>/dev/null || echo "?")
      NFILES=$(ls "$TMPC/check/content/fixboxs/"*.md 2>/dev/null | wc -l)
      log "content ok: $(du -h "$OUTB" | cut -f1)（克隆自检通过：$NCOMMITS 个提交 / $NFILES 篇文章）"
      if [ "$NFILES" -lt 1 ]; then
        log "content WARN：备份里没有文章文件，请检查仓库路径"
      fi
    else
      log "content FAILED（bundle 无法克隆，已删除坏备份）"
      rm -f "$OUTB"; FAIL=1
    fi
    rm -rf "$TMPC"
  else
    log "content FAILED（git bundle 创建失败）"; FAIL=1
  fi

  # 同时留一份工作区快照（含未提交改动，防止「改了但没提交」的内容丢失）
  TARBALL="$DEST/content/worktree-$TS.tar.gz"
  if tar -czf "$TARBALL" -C "$REPO" content 2>/dev/null && [ -s "$TARBALL" ]; then
    log "worktree ok: $(du -h "$TARBALL" | cut -f1)"
  else
    log "worktree FAILED"; rm -f "$TARBALL"; FAIL=1
  fi
else
  log "content FAILED（仓库不存在：$REPO）"; FAIL=1
fi

# ---------------- 3) 反向验证：数据库里能否读到账号 ----------------
# 只有 dump 能恢复还不够，这里顺带确认备份时数据库确实可读。
N=$(docker exec "$PG_CONTAINER" psql -U lwb -d "$DB_NAME" -tAc 'SELECT count(*) FROM users' 2>/dev/null || echo "?")
log "数据库自检：users 表 $N 行"

# ---------------- 4) 轮转（保留 30 天） ----------------
find "$DEST/db" -name '*.dump' -mtime +$KEEP_DAYS -delete 2>/dev/null
find "$DEST/content" -name '*.bundle' -mtime +$KEEP_DAYS -delete 2>/dev/null
find "$DEST/content" -name '*.tar.gz' -mtime +$KEEP_DAYS -delete 2>/dev/null

log "完成（失败项：$FAIL）；当前占用：$(du -sh "$DEST" 2>/dev/null | cut -f1)"
exit $FAIL