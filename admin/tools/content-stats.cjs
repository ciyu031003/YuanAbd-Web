/* 内容结构统计（分析用，非生产） */
"use strict";
const fs=require("fs"),path=require("path");
const fx=require(path.join(__dirname,"..","..","fx-frontmatter.cjs"));
const dir=path.join(__dirname,"..","..","content","fixboxs");
const files=fs.readdirSync(dir).filter(f=>f.endsWith(".md")&&!f.startsWith("_"));
let noImg=[],noQuick=[],noBat=[],noFaq=[],noSrc=[],noVerify=[],noPrevent=[],sections={};
for(const f of files){
  const r=fx.parse(fs.readFileSync(path.join(dir,f),"utf8"));const b=r.body||"";
  const h2=(b.match(/^##\s+(.+)$/gm)||[]).map(s=>s.replace(/^##\s+/,"").trim());
  h2.forEach(n=>{sections[n]=(sections[n]||0)+1;});
  if(!/!\[/.test(b))noImg.push(f);
  if(h2.indexOf("30 秒快速排查")<0)noQuick.push(f);
  if(h2.indexOf("小白一键修复")<0)noBat.push(f);
  if(!h2.some(n=>/常见问题|FAQ/i.test(n)))noFaq.push(f);
  if(h2.indexOf("怎么确认修好了")<0)noVerify.push(f);
  if(h2.indexOf("预防")<0)noPrevent.push(f);
  if(!Array.isArray(r.meta.sources)||!r.meta.sources.length)noSrc.push(f);
}
console.log("total",files.length);
console.log("noImg",noImg.length);console.log("noQuick30",noQuick.length,noQuick.slice(0,30).join(","));
console.log("noBat",noBat.length);
console.log("noFaq",noFaq.length);
console.log("noVerify",noVerify.length,noVerify.slice(0,20).join(","));
console.log("noPrevent",noPrevent.length);
console.log("noSrc",noSrc.length,noSrc.join(","));
const ent=Object.entries(sections).sort((a,b)=>b[1]-a[1]);
console.log("sections:");ent.forEach(([k,v])=>console.log("  ",k,v));
