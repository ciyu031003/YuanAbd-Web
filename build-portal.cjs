/* build-portal.cjs — 门户单文件装配（UI-REFACTOR-PLAN.md Phase 3）
   ------------------------------------------------------------
   门户 index.html 为「单文件内联」形态（部署脚本 scp demo/index.html 依赖此约定），
   但共享设计令牌层与组件层必须单一真源、可复用。二者用构建标记调和。

   标记形态（CSS 用块注释，JS 用行注释，成对出现）：
     [inline 起始]  @inline:tokens      [inline 结束]  @endinline:tokens
     [inline 起始]  @inline:components  [inline 结束]  @endinline:components
     [inline 起始]  @inline:ui          [inline 结束]  @endinline:ui
   构建时把两个标记之间的内容替换为对应源文件全文。

   用法：
     node build-portal.cjs          # 写入 demo/index.html
     node build-portal.cjs --check  # 只校验产物是否与源文件一致（回归用）

   说明：每次修改 css/tokens.css、css/components.css、js/ui.js 后需重新执行本脚本；
   产物已提交到 git，因此部署链路与线上形态完全不变。
*/
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const TARGET = path.join(ROOT, "demo", "index.html");

/* 标记约定：@inline:<名> 与 @endinline:<名> 成对出现，
   构建时把两者之间的内容替换为对应源文件全文。 */
const BLOCKS = [
  { kind: "css", file: "css/tokens.css", marker: "tokens" },
  { kind: "css", file: "css/components.css", marker: "components" },
  { kind: "js", file: "js/ui.js", marker: "ui" },
];

const HEADER = "==== 由 build-portal.cjs 内联自 demo/%s（请勿手改；改源文件后重新构建）====";

function readSource(rel) {
  const p = path.join(ROOT, "demo", rel);
  if (!fs.existsSync(p)) throw new Error("源文件不存在：" + p);
  return fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n").replace(/\s+$/, "");
}

/* 统一渲染：块注释（CSS）与行注释（JS）共用同一套 begin/end 逻辑 */
function renderBlock(html, block) {
  const start = block.kind === "css" ? `/* @inline:${block.marker} */` : `// @inline:${block.marker} */`;
  const end = block.kind === "css" ? `/* @endinline:${block.marker} */` : `// @endinline:${block.marker} */`;
  const i = html.indexOf(start);
  const j = html.indexOf(end);
  if (i < 0 || j < 0 || j < i) {
    throw new Error(`缺少标记 ${start} / ${end}（文件：demo/index.html）`);
  }
  const body = readSource(block.file);
  const header = block.kind === "css"
    ? `/* ${HEADER.replace("%s", block.file)} */`
    : `/* ${HEADER.replace("%s", block.file)} */`;
  return html.slice(0, i + start.length) + "\n" + header + "\n" + body + "\n" + html.slice(j);
}

function render(html) {
  return BLOCKS.reduce((acc, b) => renderBlock(acc, b), html);
}

const original = fs.readFileSync(TARGET, "utf8");
const built = render(original);

if (process.argv.includes("--check")) {
  if (built !== original) {
    console.error("门户产物与源文件不一致：请运行 `node build-portal.cjs` 重新生成 demo/index.html");
    process.exit(1);
  }
  console.log("门户产物与源文件一致（tokens.css / components.css / ui.js 均已内联到最新）");
  process.exit(0);
}

if (built === original) {
  console.log("无需变更：demo/index.html 已是最新内联产物");
} else {
  fs.writeFileSync(TARGET, built);
  const delta = built.length - original.length;
  console.log(`已写入 demo/index.html（${original.length} → ${built.length} 字节，${delta >= 0 ? "+" : ""}${delta}）`);
}
