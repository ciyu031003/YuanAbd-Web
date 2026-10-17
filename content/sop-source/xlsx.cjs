/* Minimal XLSX reader: unzip (stored/deflate) + sharedStrings + sheets -> rows */
"use strict";
const fs = require("fs");
const zlib = require("zlib");

function unzip(file) {
  const buf = fs.readFileSync(file);
  // find EOCD
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 70000; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("not a zip");
  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  const entries = {};
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) throw new Error("bad central dir");
    const method = buf.readUInt16LE(off + 10);
    const compSize = buf.readUInt32LE(off + 20);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const localOff = buf.readUInt32LE(off + 42);
    const name = buf.slice(off + 46, off + 46 + nameLen).toString("utf8");
    // local header
    const lnameLen = buf.readUInt16LE(localOff + 26);
    const lextraLen = buf.readUInt16LE(localOff + 28);
    const dataStart = localOff + 30 + lnameLen + lextraLen;
    const raw = buf.slice(dataStart, dataStart + compSize);
    let data;
    if (method === 0) data = raw;
    else if (method === 8) data = zlib.inflateRawSync(raw);
    else throw new Error("unsupported method " + method + " for " + name);
    entries[name] = data;
    off += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

function decodeXml(s) {
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, "&");
}

function textOf(xml) {
  // collect all <t> contents, incl. rich text runs
  let out = "";
  const re = /<t[^>]*>([\s\S]*?)<\/t>/g;
  let m;
  while ((m = re.exec(xml))) out += decodeXml(m[1]);
  return out;
}

function readXlsx(file) {
  const entries = unzip(file);
  const names = Object.keys(entries);
  // shared strings
  let sst = [];
  const sstName = names.find(n => /sharedStrings\.xml$/.test(n));
  if (sstName) {
    const xml = entries[sstName].toString("utf8");
    const siRe = /<si>([\s\S]*?)<\/si>/g;
    let m;
    while ((m = siRe.exec(xml))) sst.push(textOf(m[1]));
  }
  // workbook sheet names
  const wb = entries["xl/workbook.xml"].toString("utf8");
  const rels = entries["xl/_rels/workbook.xml.rels"].toString("utf8");
  const relMap = {};
  const relRe = /<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"[^>]*\/?>/g;
  let rm;
  while ((rm = relRe.exec(rels))) relMap[rm[1]] = rm[2].replace(/^\/?(xl\/)?/, "xl/");
  const sheets = [];
  const shRe = /<sheet[^>]*name="([^"]*)"[^>]*r:id="([^"]*)"[^>]*\/?>/g;
  while ((rm = shRe.exec(wb))) {
    sheets.push({ name: decodeXml(rm[1]), path: relMap[rm[2]] || ("xl/worksheets/" + rm[2] + ".xml") });
  }
  // fallback: use whatever worksheets exist
  const result = [];
  for (const sh of sheets) {
    let xml = entries[sh.path];
    if (!xml) {
      const guess = names.filter(n => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort();
      continue;
    }
    xml = xml.toString("utf8");
    const rows = [];
    const rowRe = /<row[^>]*?(?:r="(\d+)")?[^>]*>([\s\S]*?)<\/row>/g;
    let rmm;
    while ((rmm = rowRe.exec(xml))) {
      const rowNum = rmm[1] ? parseInt(rmm[1], 10) : (rows.length + 1);
      const cells = [];
      const cRe = /<c([^>]*)>([\s\S]*?)<\/c>|<c([^>]*)\/>/g;
      let cm;
      while ((cm = cRe.exec(rmm[2]))) {
        const attrs = cm[1] || cm[3] || "";
        const inner = cm[2] || "";
        const refM = /r="([A-Z]+)(\d+)"/.exec(attrs);
        const col = refM ? colToNum(refM[1]) : cells.length;
        const tM = /t="([^"]+)"/.exec(attrs);
        const t = tM ? tM[1] : "n";
        let val = "";
        if (t === "inlineStr") val = textOf(inner);
        else {
          const vM = /<v>([\s\S]*?)<\/v>/.exec(inner);
          const v = vM ? decodeXml(vM[1]) : "";
          if (t === "s") val = sst[parseInt(v, 10)] || "";
          else val = v;
        }
        cells[col] = val;
      }
      rows[rowNum - 1] = cells;
    }
    result.push({ name: sh.name, rows: rows });
  }
  return result;
}

function colToNum(letters) {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

module.exports = { readXlsx, unzip, colToNum };
