/* admin/src/preview.cjs — 编辑器分栏预览的 HTML 后处理（纯函数，可单测）
   -----------------------------------------------------------------------------
   build-fix.cjs 渲染的是「线上文章页」：外链站点 CSS、站点脚本、以 /fixboxs/fix/
   为基准的相对路径。直接塞进后台的 srcdoc iframe 会有三个问题：
     1) srcdoc 继承后台 CSP：外站 CSS/JS 被拦 → 预览变成裸 HTML；
     2) 相对路径按后台地址解析 → 图片 404；
     3) 上传图片真实位置在 /fixboxs/media/，旧正文里可能只写 media/xxx.png。
   处理策略：
     · 站内 CSS 内联（后台允许 inline style，预览与线上视觉一致）；
     · 站点脚本全部去掉（预览只需排版与图片，也避免在后台上下文执行站点脚本）；
     · ../ → 站点 /fixboxs/，../../ → 站点根；裸 media/ → /fixboxs/media/。
   注意：iframe 仍带 sandbox（无 allow-same-origin），预览文档是 opaque origin。
   ============================================================================= */
"use strict";
const fs = require("fs");
const path = require("path");
const config = require("./config.cjs");

function inlineStylesheets(page) {
  const repoRoot = config.repo.root;
  return page.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/gi, function (tag) {
    const m = /href="([^"]+)"/i.exec(tag);
    if (!m) return tag;
    const href = m[1];
    let file = null;
    if (href.indexOf("../../") === 0) file = path.join(repoRoot, "demo", href.slice(6));
    else if (href.indexOf("../") === 0) file = path.join(repoRoot, "demo", "fixboxs", href.slice(3));
    else if (href.charAt(0) === "/") file = path.join(repoRoot, "demo", href.slice(1));
    try {
      if (file && fs.existsSync(file)) return "<style>\n" + fs.readFileSync(file, "utf8") + "\n</style>";
    } catch (e) { /* 读不到就保留原 link，不阻塞预览 */ }
    return tag;
  });
}

function previewDocument(page) {
  const site = String(config.siteUrl || "").replace(/\/+$/, "");
  let out = String(page || "");
  out = inlineStylesheets(out);
  // 站点脚本：srcdoc 的 CSP 不放行外站脚本，预览也不需要交互
  out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  // 站点靠 JS 关闭首屏 preloader；预览里脚本被移除，必须用 CSS 兜底隐藏，否则整页被遮罩挡住
  out = out.replace(/<\/head>/i, "<style>.fx-preloader,.fx-curtain{display:none!important}</style></head>");
  /* 相对路径：修盒子站点部署在域名根目录（文章页 /fix/<slug>.html），
     所以 ../ 与 ../../ 都指向站点根；上传图片的 media/x.png = /media/x.png。
     旧实现写死了 /fixboxs/ 前缀，导致预览里的图片 404（线上站已不在子路径下）。 */
  out = out.replace(/(src|href)="\.\.\/\.\.\//g, '$1="' + site + "/");
  out = out.replace(/(src|href)="\.\.\//g, '$1="' + site + "/");
  out = out.replace(/(src)="(?:\.\/)?media\//g, '$1="' + site + "/media/");
  return out;
}

module.exports = { previewDocument: previewDocument, inlineStylesheets: inlineStylesheets };
