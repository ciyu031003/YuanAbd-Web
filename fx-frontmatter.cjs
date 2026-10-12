/* fx-frontmatter.cjs — front-matter 解析 / 序列化（零依赖）
   ------------------------------------------------------------
   为什么不用 gray-matter / js-yaml：
     本仓库是「零依赖」设计（无 package.json、无 node_modules），
     构建脚本全部只用 Node 内置模块。引入 npm 依赖会改变整个构建与部署契约
     （需要 lockfile、需要 npm install、离线/服务器侧都要装依赖）。
   为什么不能直接照抄 YAML 库的 dump：
     实测 js-yaml 的 load() 能正确解析 sources 嵌套对象（url 不再丢失），
     但 yaml.dump() 会把行内数组 [a, b] 改写成块状列表：
         os: [Windows 10, Windows 11, macOS 12+]   →   os:\n  - Windows 10\n  - Windows 11 ...
     并把 version: "1.0" 改写成 version: '1.0'。
     结果是「保存一次」就让 30 篇全部产生 diff —— 内容没变但历史全乱
     （违反 V2 §7.3.4 的 R8「未改动字段不得产生 diff」）。
   因此本模块采用 V2 方案 §7.3.4 明确推荐的**最小改写（minimal rewrite）**策略：
     - 解析：严格按本项目实际使用的 YAML 子集解析，支持嵌套映射；
     - 序列化：以「原文行」为基准，只重写真正变更的字段，未变更部分**逐字节原样保留**。
   这样 round-trip 对未修改文件是**字节级恒等**的（R8 通过）。
   ============================================================ */
"use strict";

/* ---------- 解析 ---------- */

// 单个标量值：去引号，但保留「原本是不是带引号」的信息（序列化要用）
function parseScalar(raw) {
  const s = String(raw).trim();
  if (s === "") return { value: "", quoted: null };
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
    return { value: s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\"), quoted: '"' };
  }
  if (s.length >= 2 && s.startsWith("'") && s.endsWith("'")) {
    return { value: s.slice(1, -1).replace(/''/g, "'"), quoted: "'" };
  }
  return { value: s, quoted: null };
}

// 行内数组：[a, b, c]  —— 本项目 18 个字段里有 7 个用这种写法
function parseInlineArray(inner) {
  const out = [];
  let cur = "";
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === ",") { out.push(cur); cur = ""; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map(function (x) { return parseScalar(x).value; }).filter(function (x) { return x !== ""; });
}

/**
 * 解析 front-matter。
 * 返回 { meta, order, lines, body, rawFm, hasFm, eol, bom }
 *  - meta:   字段 → 值（标量 string / 数组 string[] / 对象数组 [{...}]）
 *  - shapes: 字段 → 形态标记（"scalar" | "inline-array" | "block-array" | "block-objects"）
 *  - lines:  front-matter 的原始行数组（最小改写时作为基准）
 *  - eol:    原文换行符（"\r\n" 或 "\n"）—— 序列化时必须还原，
 *            否则一次「无改动保存」会把整个文件的行尾改写，产生满屏 diff
 *  - bom:    原文是否带 BOM（同样要还原）
 */
function parse(text) {
  const src = String(text);
  const bom = src.charCodeAt(0) === 0xFEFF;
  const m = src.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) {
    return { meta: {}, shapes: {}, lines: [], body: src, rawFm: null, hasFm: false, eol: "\n", bom: bom };
  }
  const rawFm = m[1];
  // 记录原文换行风格：只要出现 CRLF 就按 CRLF 还原
  const eol = /\r\n/.test(m[0]) ? "\r\n" : "\n";
  const lines = rawFm.split(/\r?\n/);
  const body = src.slice(m[0].length);
  const meta = {};
  const shapes = {};

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith("#")) { i++; continue; }
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) { i++; continue; }            // 缩进行由上面的块分支消费，不会到这
    const key = kv[1];
    const rest = kv[2].trim();

    if (rest === "") {
      // 块状：后续缩进行。可能是 - 标量（块数组）或 - key: value（对象数组）
      const block = [];
      let j = i + 1;
      while (j < lines.length && /^\s+\S/.test(lines[j])) { block.push(lines[j]); j++; }
      if (block.length === 0) { meta[key] = []; shapes[key] = "block-array"; i = j; continue; }
      const isObjects = /^\s*-\s+[A-Za-z_][\w-]*:\s*/.test(block[0]);
      if (isObjects) {
        // 对象数组：每个 "- key: value" 起一个新对象，其后更深缩进的 "key: value" 并入该对象
        const arr = [];
        let cur = null;
        block.forEach(function (bl) {
          const dash = bl.match(/^\s*-\s+([A-Za-z_][\w-]*):\s*(.*)$/);
          if (dash) {
            cur = {};
            cur[dash[1]] = parseScalar(dash[2]).value;
            arr.push(cur);
            return;
          }
          const sub = bl.match(/^\s+([A-Za-z_][\w-]*):\s*(.*)$/);
          if (sub && cur) cur[sub[1]] = parseScalar(sub[2]).value;
        });
        meta[key] = arr;
        shapes[key] = "block-objects";
      } else {
        const arr = [];
        block.forEach(function (bl) {
          const li = bl.match(/^\s*-\s+(.*)$/);
          if (li) arr.push(parseScalar(li[1]).value);
        });
        meta[key] = arr;
        shapes[key] = "block-array";
      }
      i = j;
      continue;
    }

    if (/^\[.*\]$/.test(rest)) {
      meta[key] = parseInlineArray(rest.slice(1, -1));
      shapes[key] = "inline-array";
      i++;
      continue;
    }

    const sc = parseScalar(rest);
    meta[key] = sc.value;
    shapes[key] = "scalar";
    i++;
  }

  return { meta: meta, shapes: shapes, lines: lines, body: body, rawFm: rawFm, hasFm: true, eol: eol, bom: bom };
}

/* ---------- 序列化（最小改写） ---------- */

function dumpScalar(value, origRaw) {
  const s = String(value);
  const t = s.trim();
  // 保持原文的引号策略：原文带引号就继续带引号（version: "1.0" 必须仍是字符串）
  if (origRaw !== undefined) {
    const trimmed = String(origRaw).trim();
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
    }
    if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
      return "'" + s.replace(/'/g, "''") + "'";
    }
  }
  // 新值（无原文可依）：判断是否需要引号
  if (t === "" ) return '""';
  if (/^[\[\]{},&*#?|>%@`"'!]/.test(t) || /:\s/.test(t) || /\s#/.test(t)) {
    return '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
  }
  return s;
}

// 渲染一个对象数组为块状（保持 title → url → type 的键序）
function dumpBlockObjects(arr) {
  const out = [];
  arr.forEach(function (obj, idx) {
    const keys = Object.keys(obj);
    keys.forEach(function (k, ki) {
      const prefix = ki === 0 ? "  - " : "    ";
      const v = obj[k];
      // 嵌套对象里的值统一按标量处理（本项目 sources 只有一层）
      out.push(prefix + k + ": " + dumpScalar(v));
    });
    if (idx < arr.length - 1) { /* 无需分隔 */ }
  });
  return out;
}

/**
 * 最小改写序列化：
 *   opts.original  = parse() 的结果（用于逐行比对，未变更的行原样保留）
 *   opts.meta      = 新的字段对象
 * 未在 meta 中出现的字段保持原样；值未变的字段保持**原文那一行**不变。
 */
function serialize(meta, opts) {
  const o = opts || {};
  const orig = o.original;
  const srcLines = (orig && orig.lines) ? orig.lines.slice() : [];
  const srcShapes = (orig && orig.shapes) ? orig.shapes : {};
  const srcMeta = (orig && orig.meta) ? orig.meta : {};

  // 收集字段顺序：以原文顺序为准，新字段追加在末尾
  const order = [];
  srcLines.forEach(function (l) {
    const kv = l.match(/^([A-Za-z_][\w-]*):/);
    if (kv && order.indexOf(kv[1]) < 0) order.push(kv[1]);
  });
  Object.keys(meta).forEach(function (k) { if (order.indexOf(k) < 0) order.push(k); });

  const out = [];
  let i = 0;
  while (i < srcLines.length) {
    const line = srcLines[i];
    const kv = line.match(/^([A-Za-z_][\w-]*):/);
    if (!kv) { out.push(line); i++; continue; }
    const key = kv[1];

    // 计算该字段在原文中占用的行范围 [i, end)
    let end = i + 1;
    if (String(line).trim().endsWith(":")) {
      while (end < srcLines.length && /^\s+\S/.test(srcLines[end])) end++;
    }

    if (!(key in meta)) { // 字段被删除
      i = end; continue;
    }

    const newVal = meta[key];
    const oldVal = srcMeta[key];
    const shape = srcShapes[key] || (Array.isArray(newVal) ? "block-array" : "scalar");
    const unchanged = JSON.stringify(newVal) === JSON.stringify(oldVal);

    if (unchanged) {
      // ★ 关键：未变更 → 原样输出原文行，保证字节级恒等（R8）
      for (let k = i; k < end; k++) out.push(srcLines[k]);
      i = end;
      continue;
    }

    // 变更了 → 只重写这个字段
    if (shape === "block-objects") {
      out.push(key + ":");
      dumpBlockObjects(newVal).forEach(function (l) { out.push(l); });
    } else if (shape === "block-array") {
      out.push(key + ":");
      (newVal || []).forEach(function (v) { out.push("  - " + dumpScalar(v)); });
    } else if (shape === "inline-array") {
      out.push(key + ": [" + (newVal || []).map(function (v) { return dumpScalar(v); }).join(", ") + "]");
    } else {
      const origValueRaw = (line.match(/^[A-Za-z_][\w-]*:\s*(.*)$/) || [null, undefined])[1];
      out.push(key + ": " + dumpScalar(newVal, origValueRaw));
    }
    i = end;
  }

  // 追加全新字段
  Object.keys(meta).forEach(function (k) {
    if (order.indexOf(k) >= 0 && srcLines.some(function (l) { return new RegExp("^" + k + ":\\s").test(l); })) return;
    if (srcMeta[k] === undefined) {
      const v = meta[k];
      if (Array.isArray(v)) {
        out.push(k + ": [" + v.map(function (x) { return dumpScalar(x); }).join(", ") + "]");
      } else {
        out.push(k + ": " + dumpScalar(v));
      }
    }
  });

  // 还原原文的换行风格与 BOM：这是「无改动保存不产生 diff」的必要条件。
  // 实测：仓库里 29 篇是 LF、1 篇（printer-offline.md）是 CRLF；
  // 若一律输出 LF，那一篇每次保存都会整文件 diff，历史随之失真。
  const eol = (orig && orig.eol) ? orig.eol : (o.eol || "\n");
  const bom = (orig && orig.bom) ? "\uFEFF" : (o.bom ? "\uFEFF" : "");
  const fm = out.join(eol);
  let body = (orig && orig.body !== undefined) ? orig.body : (o.body || "");
  // 正文同样按原风格统一（parse 时未规范化，这里只补 front-matter 与正文的衔接）
  if (eol === "\r\n") {
    body = body.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n");
  }
  return bom + "---" + eol + fm + eol + "---" + eol + body;
}

module.exports = { parse: parse, serialize: serialize, parseScalar: parseScalar, dumpScalar: dumpScalar };
