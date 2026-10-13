/* admin/src/totp.cjs — TOTP 双因素认证（RFC 6238，零依赖）
   为什么自实现：本后台依赖面刻意最小（V2 §7.3.1）。
   TOTP 算法本身很短（HMAC-SHA1 + 时间步长 + Base32），
   Node 内置 crypto 就够，不需要引 otplib 之类的包。
   兼容 Google Authenticator / Microsoft Authenticator / 1Password 等标准 App。
   ============================================================ */
"use strict";
const crypto = require("crypto");

const DIGITS = 6;
const PERIOD = 30;          // 秒
const ALGO = "sha1";        // 标准 App 默认

/* ---------- Base32（RFC 4648，无填充）---------- */
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buf) {
  let bits = 0, value = 0, out = "";
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(str) {
  const clean = String(str).toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0, value = 0;
  const out = [];
  for (let i = 0; i < clean.length; i++) {
    const idx = B32.indexOf(clean[i]);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/* ---------- 生成密钥 ---------- */
function generateSecret(bytes) {
  return base32Encode(crypto.randomBytes(bytes || 20));  // 160 bit，RFC 推荐
}

/* ---------- 计算某时间点的 6 位码 ---------- */
function hotp(secretBuf, counter) {
  const buf = Buffer.alloc(8);
  // 64 位大端计数器（JS 精度下高 32 位用除法取值）
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const hmac = crypto.createHmac(ALGO, secretBuf).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24) |
               ((hmac[offset + 1] & 0xff) << 16) |
               ((hmac[offset + 2] & 0xff) << 8) |
               (hmac[offset + 3] & 0xff);
  return String(code % Math.pow(10, DIGITS)).padStart(DIGITS, "0");
}

function codeAt(secretBase32, timestampMs) {
  const counter = Math.floor((timestampMs || Date.now()) / 1000 / PERIOD);
  return hotp(base32Decode(secretBase32), counter);
}

/* 校验：允许 ±1 个时间窗（共 90 秒），容忍客户端时钟偏差。
   这是标准做法 —— 不允许窗口会让用户频繁「验证码错误」。 */
function verify(secretBase32, token, window) {
  const t = String(token || "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(t)) return false;
  const w = (window === undefined) ? 1 : window;
  const now = Date.now();
  for (let i = -w; i <= w; i++) {
    const expect = codeAt(secretBase32, now + i * PERIOD * 1000);
    // 定长比较，避免时序侧信道
    if (crypto.timingSafeEqual(Buffer.from(expect), Buffer.from(t))) return true;
  }
  return false;
}

/* ---------- otpauth URI（用于生成二维码内容）---------- */
function otpauthURL(secretBase32, account, issuer) {
  const label = encodeURIComponent((issuer || "内容后台") + ":" + (account || ""));
  const params = [
    "secret=" + secretBase32,
    "issuer=" + encodeURIComponent(issuer || "内容后台"),
    "algorithm=SHA1",
    "digits=" + DIGITS,
    "period=" + PERIOD
  ].join("&");
  return "otpauth://totp/" + label + "?" + params;
}

/* ---------- 恢复码：2FA 设备丢失时的后备入口 ---------- */
function generateRecoveryCodes(n) {
  const codes = [];
  for (let i = 0; i < (n || 8); i++) {
    // 形如 XXXX-XXXX，去掉易混淆字符
    const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    let s = "";
    const b = crypto.randomBytes(8);
    for (let j = 0; j < 8; j++) s += alphabet[b[j] % alphabet.length];
    codes.push(s.slice(0, 4) + "-" + s.slice(4));
  }
  return codes;
}
function hashCode(c) { return crypto.createHash("sha256").update(String(c).toUpperCase().replace(/[^A-Z0-9]/g, "")).digest("hex"); }

module.exports = {
  generateSecret: generateSecret, codeAt: codeAt, verify: verify,
  otpauthURL: otpauthURL, generateRecoveryCodes: generateRecoveryCodes, hashCode: hashCode,
  PERIOD: PERIOD, DIGITS: DIGITS
};
