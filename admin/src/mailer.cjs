/* admin/src/mailer.cjs — 邮件发送（SMTP，nodemailer）
   ------------------------------------------------------------
   用途：root 在账号页为用户换绑邮箱时，向新邮箱发送 6 位验证码。
   传输：SMTPS（默认 465 端口，隐式 TLS）—— 腾讯云/阿里云服务器默认
         封 25 端口出站，25 直连基本发不出去；465 一般可用。
   配置：全部来自环境变量（admin.env），MAIL_ENABLED=true 才启用；
         未启用时 sendCode() 抛出带明确提示的错误，由路由转成用户可读的
         「邮件服务未配置」，不静默、不假装发送成功。
   频控：按目标邮箱限流（内存 Map，重启即清——频控是防骚扰，不是账本）。
   ============================================================ */
"use strict";
const crypto = require("crypto");
const config = require("./config.cjs");

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  const nodemailer = require("nodemailer");
  transporter = nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.secure,
    auth: { user: config.mail.user, pass: config.mail.pass }
  });
  return transporter;
}

/* ---------- 6 位验证码（密码学随机） ---------- */
function generateCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}
function hashCode(code) {
  return crypto.createHash("sha256").update(String(code), "utf8").digest("hex");
}

/* ---------- 发送频控：同一目标邮箱 N 次 / 窗口 ---------- */
const sendLog = new Map();   // key: email -> [timestamps]
function assertSendAllowed(email) {
  const now = Date.now();
  const arr = (sendLog.get(email) || []).filter(function (t) { return now - t < config.mail.sendWindowMs; });
  if (arr.length >= config.mail.sendMaxPerWindow) {
    const e = new Error("该邮箱发送过于频繁（" + config.mail.sendMaxPerWindow + " 次 / " +
      Math.round(config.mail.sendWindowMs / 60000) + " 分钟），请稍后再试");
    e.status = 429;
    throw e;
  }
  arr.push(now);
  sendLog.set(email, arr);
}

/* ---------- 发送验证码邮件 ---------- */
async function sendBindCode(toEmail, code, userName) {
  if (!config.mail.enabled) {
    const e = new Error("邮件服务未配置：请在 /srv/fixboxs/admin.env 中设置 MAIL_ENABLED/MAIL_HOST/MAIL_USER/MAIL_PASS/MAIL_FROM 并重建容器");
    e.status = 503;
    throw e;
  }
  assertSendAllowed(toEmail);
  const from = config.mail.from || config.mail.user;
  const name = userName ? "（" + userName + "）" : "";
  const ttl = config.mail.codeTtlMin;
  await getTransporter().sendMail({
    from: from,
    to: toEmail,
    subject: "【修盒子内容后台】邮箱绑定验证码 " + code,
    text:
      "你好" + name + "：\n\n" +
      "管理员正在「修盒子内容后台」为你的账号绑定此邮箱。\n\n" +
      "验证码：" + code + "\n" +
      "有效期：" + ttl + " 分钟（一次性）。\n\n" +
      "把验证码告知管理员即可完成绑定。绑定成功后，你将使用本邮箱登录后台（密码不变）。\n\n" +
      "如果你没有在进行此操作，请忽略本邮件并告知管理员。",
    html:
      '<div style="font-family:-apple-system,\'PingFang SC\',\'Microsoft YaHei\',sans-serif;max-width:520px;margin:0 auto;' +
      'padding:28px;border-radius:14px;background:#F6F8FC;color:#1A2233;line-height:1.8">' +
      '<h2 style="margin:0 0 14px;font-size:18px">修盒子内容后台 · 邮箱绑定验证</h2>' +
      '<p style="margin:0 0 10px">你好' + (userName ? "，" + userName : "") + "：</p>" +
      '<p style="margin:0 0 14px">管理员正在为你的账号绑定此邮箱。请把下面的验证码告知管理员完成绑定：</p>' +
      '<div style="font-size:32px;font-weight:800;letter-spacing:10px;font-family:Consolas,monospace;' +
      'background:#fff;border-radius:12px;padding:16px 0;text-align:center;margin:0 0 14px">' + code + "</div>" +
      '<p style="margin:0 0 6px;color:#5A6474;font-size:13px">有效期 ' + ttl + " 分钟，一次性使用。" +
      "绑定成功后，你将使用本邮箱登录后台（密码不变）。</p>" +
      '<p style="margin:0;color:#8A93A3;font-size:12px">如果你没有在进行此操作，请忽略本邮件并告知管理员。</p>' +
      "</div>"
  });
}

module.exports = {
  generateCode: generateCode,
  hashCode: hashCode,
  assertSendAllowed: assertSendAllowed,
  sendBindCode: sendBindCode,
  enabled: function () { return config.mail.enabled; }
};
