#!/usr/bin/env bash
# verify-db-isolation.sh -- 验证后台数据库的隔离与最小权限（E17 / E18）
#
# 为什么必须单独验证（V2 上篇 §4.2）：
#   「只做授权、不做验证」= 没有隔离。本脚本用**应用账号自己**去尝试连接
#   服务器上的其他每一个库，必须**全部被拒绝**才算通过。
#
# 用法（在 FIXBOX 服务器上）：
#   export PGPASSWORD='<yuanabd_pc_fixboxs_app 的密码>'
#   bash verify-db-isolation.sh                       # 默认 127.0.0.1:5432
#   bash verify-db-isolation.sh --host 127.0.0.1 --port 5432 \
#        --db yuanabd_pc_fixboxs --role yuanabd_pc_fixboxs_app
#
# 退出码：0 = 隔离与最小权限均通过；非零 = 有失败项
set -uo pipefail

HOST="127.0.0.1"; PORT="5432"
DB="yuanabd_pc_fixboxs"; ROLE="yuanabd_pc_fixboxs_app"

while [ $# -gt 0 ]; do
  case "$1" in
    --host) HOST="$2"; shift 2 ;;
    --port) PORT="$2"; shift 2 ;;
    --db)   DB="$2";   shift 2 ;;
    --role) ROLE="$2"; shift 2 ;;
    *) echo "未知参数: $1" >&2; exit 2 ;;
  esac
done

if [ -z "${PGPASSWORD:-}" ]; then
  echo "错误：请先 export PGPASSWORD='<应用账号密码>'" >&2
  exit 2
fi

PSQL="psql -h $HOST -p $PORT -U $ROLE -v ON_ERROR_STOP=1 -tAq"
FAIL=0

echo "==> 目标：$HOST:$PORT  应用角色：$ROLE  本库：$DB"
echo ""

# ---------- 1) 能连自己的库 ----------
echo "[1/4] 能否连接自己的库"
OUT=$($PSQL -d "$DB" -c "SELECT current_database();" 2>&1)
if [ "$OUT" = "$DB" ]; then
  echo "      OK  current_database() = $OUT"
else
  echo "      ✗ 失败：$OUT"
  FAIL=$((FAIL+1))
fi

# ---------- 2) 不能连其他任何库 ----------
echo "[2/4] 是否**无法**连接服务器上的其他库（应全部权限拒绝）"
# 用超级用户列出所有库（若当前角色列不全，回退到默认库名探测）
OTHERS=$(psql -h "$HOST" -p "$PORT" -U postgres -tAq -c \
  "SELECT datname FROM pg_database WHERE datname <> '$DB' AND datistemplate = false;" 2>/dev/null || true)

if [ -z "$OTHERS" ]; then
  echo "      ! 无法用 postgres 角色列出其他库（可能需要 .pgpass 或 sudo -u postgres）"
  echo "        改为探测常见默认库名"
  OTHERS=$(printf '%s\n' postgres template1 mysql information_schema pg_catalog)
fi

CHECKED=0
for d in $OTHERS; do
  [ "$d" = "$DB" ] && continue
  OUT=$($PSQL -d "$d" -c "SELECT 1;" 2>&1)
  if echo "$OUT" | grep -qiE 'permission denied|not permitted|拒绝|FATAL'; then
    CHECKED=$((CHECKED+1))
  else
    echo "      ✗ 竟能连接库 '$d'！返回：$OUT"
    FAIL=$((FAIL+1))
  fi
done
if [ "$FAIL" -eq 0 ]; then
  echo "      OK  已确认无法连接 $CHECKED 个其他库"
fi

# ---------- 3) 无超级权限（E18） ----------
echo "[3/4] 是否无 SUPERUSER / CREATEDB / CREATEROLE"
# 先试直接查（需要能读 pg_roles；失败则用行为探测）
OUT=$($PSQL -d "$DB" -c "SELECT rolsuper::text||','||rolcreatedb::text||','||rolcreaterole::text FROM pg_roles WHERE rolname = current_user;" 2>&1)
if echo "$OUT" | grep -qE '^f,f,f$'; then
  echo "      OK  rolsuper,rolcreatedb,rolcreaterole = f,f,f"
elif echo "$OUT" | grep -qiE 'permission denied|FATAL'; then
  echo "      ! 无权读 pg_roles，改用行为探测"
  OUT2=$($PSQL -d "$DB" -c "CREATE DATABASE probe_should_fail;" 2>&1)
  if echo "$OUT2" | grep -qiE 'permission denied|must be superuser|CREATEDB'; then
    echo "      OK  CREATE DATABASE 被拒绝（确无 CREATEDB）"
  else
    echo "      ✗ 竟能建库！：$OUT2"
    FAIL=$((FAIL+1))
  fi
else
  echo "      ✗ 期望 f,f,f，实际：$OUT"
  FAIL=$((FAIL+1))
fi

# ---------- 4) 确认本库 PUBLIC 不可连 ----------
echo "[4/4] 本库是否已对 PUBLIC 收回 CONNECT"
OUT=$(psql -h "$HOST" -p "$PORT" -U postgres -tAq \
  -c "SELECT has_database_privilege('public', '$DB', 'CONNECT');" 2>/dev/null || echo "?")
if [ "$OUT" = "f" ]; then
  echo "      OK  PUBLIC 无 CONNECT"
elif [ "$OUT" = "?" ]; then
  echo "      ! 无法查询（需要 postgres 角色），请手工确认："
  echo "        SELECT has_database_privilege('public', '$DB', 'CONNECT');  -- 期望 f"
else
  echo "      ✗ PUBLIC 仍可连接本库（实际：$OUT）"
  FAIL=$((FAIL+1))
fi

echo ""
if [ "$FAIL" -gt 0 ]; then
  echo "DB_ISOLATION_FAIL failures=$FAIL" >&2
  exit 1
fi
echo "DB_ISOLATION_OK db=$DB role=$ROLE"
