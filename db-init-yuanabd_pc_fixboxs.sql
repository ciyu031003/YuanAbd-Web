-- ============================================================
-- 管理后台数据库初始化：yuanabd_pc_fixboxs
-- ============================================================
-- 对应《管理后台系统实施方案 V2.0》上篇 §4 / 下篇 §6.7、§8.3（阶段 0 ⑩）
--
-- 设计约束（来自项目负责人）：
--   「后台直接接入数据库，新建独立库，不得占用/污染已有数据库」
--
-- 本脚本只做四件事，且**全部限定在 yuanabd_pc_fixboxs 这一个库**：
--   1) 建独立库（若已存在则跳过）
--   2) 建专用登录角色（无 SUPERUSER / CREATEDB / CREATEROLE）
--   3) 收回 PUBLIC 的 CONNECT，只授予专用角色
--   4) 对服务器上**其他每一个库**显式 REVOKE 该角色的 CONNECT
--
-- 为什么第 4 步不能省：
--   PostgreSQL 的 PUBLIC 伪角色默认对整个集群的**所有库**都有 CONNECT。
--   只做 1–3 步，新角色仍可能连上已有库；必须逐库收回才算真正隔离。
--
-- 执行方式（以超级用户身份，在 FIXBOX 服务器上）：
--   sudo -u postgres psql -v ON_ERROR_STOP=1 \
--        -v app_password="'<强随机密码>'" -f db-init-yuanabd_pc_fixboxs.sql
--
-- 密码请用密钥管理器生成，不要写进仓库、不要复用其他服务的密码。
-- ============================================================

\set ON_ERROR_STOP on

-- ---------- 0) 参数（可用 -v 覆盖） ----------
\if :{?db_name}
\else
  \set db_name 'yuanabd_pc_fixboxs'
\endif

\if :{?app_role}
\else
  \set app_role 'yuanabd_pc_fixboxs_app'
\endif

\if :{?app_password}
\else
  \echo '错误：必须用 -v app_password="<密码>" 传入应用账号密码（不要使用默认值）'
  \quit
\endif

\echo '>>> 目标库：' :db_name '  应用角色：' :app_role

-- ---------- 1) 建库（独立库；已存在则跳过，绝不 DROP） ----------
SELECT format('CREATE DATABASE %I', :'db_name')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'db_name')
\gexec

-- ---------- 2) 建/改专用登录角色 ----------
-- 不给 SUPERUSER / CREATEDB / CREATEROLE：这是「凭据泄露爆炸半径」的控制点。
--
-- 注意：此处刻意**不使用 DO $$ ... $$ 块**。
--   psql 的变量插值（:'app_password'）**不会**在美元引用（$$ ... $$）字符串内部发生，
--   在 DO 块里写 :'app_password' 会把字面量 ":'app_password'" 当成密码。
--   因此改用 \gexec：先在普通 SQL 里用 format(%L) 安全拼出语句，再由 \gexec 执行。
--   既避免了该陷阱，也天然防注入（%L 会正确转义引号）。

-- 2a) 角色不存在则创建
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'app_role', :'app_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_role')
\gexec

-- 2b) 角色已存在则仅更新密码
SELECT format('ALTER ROLE %I LOGIN PASSWORD %L', :'app_role', :'app_password')
WHERE EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_role')
\gexec

-- 2c) 无论新建还是既存，都显式收紧权限
SELECT format('ALTER ROLE %I NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS', :'app_role')
\gexec

-- ---------- 3) 新库：收回 PUBLIC，只授权给专用角色 ----------
SELECT format('REVOKE CONNECT ON DATABASE %I FROM PUBLIC', :'db_name')
\gexec
SELECT format('GRANT CONNECT ON DATABASE %I TO %I', :'db_name', :'app_role')
\gexec

-- ---------- 4) 对**其他每个库**显式收回该角色的 CONNECT ----------
-- 这是「不得触碰已有库」的硬保证：不是靠约定，而是靠权限。
SELECT format('REVOKE CONNECT ON DATABASE %I FROM %I', datname, :'app_role')
FROM pg_database
WHERE datname <> :'db_name'
  AND datistemplate = false
\gexec

-- ---------- 5) 库内：schema 权限收敛 ----------
-- 切库执行（\connect 之后仍在同一 psql 会话内）
\connect :db_name

-- public schema 不再对所有人开放建表权
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE, CREATE ON SCHEMA public TO :"app_role";

-- 让后续由该角色建的表，默认也对它自己有完整 DML 权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :"app_role";
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO :"app_role";

\echo ''
\echo '>>> 初始化完成。请接着执行隔离验证：'
\echo '    1) 应用角色能连自己的库：'
\echo '       PGPASSWORD=*** psql -h 127.0.0.1 -U ' :app_role ' -d ' :db_name ' -c "SELECT current_database();"'
\echo '    2) 应用角色**不能**连其他任何库（应报 permission denied）：'
\echo '       PGPASSWORD=*** psql -h 127.0.0.1 -U ' :app_role ' -d <其他库> -c "SELECT 1;"'
\echo '    3) 应用角色无超级权限：'
\echo '       SELECT rolsuper, rolcreatedb, rolcreaterole FROM pg_roles WHERE rolname = ''' :app_role ''';'
\echo ''
