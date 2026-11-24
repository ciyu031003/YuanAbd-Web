/* admin/src/login-scenes.cjs — 登录页四幅「电影镜头」插画（纯内联 SVG）
   -----------------------------------------------------------------------------
   · 为什么内联 SVG：后台 CSP 为 default-src 'self'，不能引外部图片；SVG 是标记，
     矢量清晰、可随主题换色、体积极小。
   · 构图原则：右侧 35% 永远是半透明登录卡，所以**视觉焦点放在左侧 60%**；
     每幅画都有「天幕 / 中景主体 / 前景压暗」三层，切换时靠缓慢推近 + 交叉淡入。
   · 这里只输出静态结构；轮播、视差、暂停由 /static/login.js 控制。
   ============================================================================= */
"use strict";

/* 确定性伪随机：同一颗星每次渲染都在同一位置，刷新不跳动 */
function rnd(seed) {
  let x = seed * 9301 + 49297;
  return function () { x = (x * 9301 + 49297) % 233280; return x / 233280; };
}

function stars(n, seed, w, h, oMin, oMax) {
  const r = rnd(seed);
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = (r() * w).toFixed(1);
    const y = (r() * h * 0.7).toFixed(1);
    const rad = (0.5 + r() * 1.7).toFixed(2);
    const op = (oMin + r() * (oMax - oMin)).toFixed(2);
    out.push('<circle cx="' + x + '" cy="' + y + '" r="' + rad + '" fill="#EAF6FF" opacity="' + op + '"/>');
  }
  return out.join("");
}

/* 楼体窗户：随机点亮的小方块 */
function windows(x, y, w, h, seed, color, lit) {
  const r = rnd(seed);
  const out = [];
  for (let yy = y + 16; yy < y + h - 14; yy += 15) {
    for (let xx = x + 11; xx < x + w - 11; xx += 10) {
      if (r() > lit) continue;
      out.push('<rect x="' + xx + '" y="' + yy + '" width="7" height="9" rx="1.6" fill="' + color +
        '" opacity="' + (0.4 + r() * 0.55).toFixed(2) + '"/>');
    }
  }
  return out.join("");
}

/* ---------------- 01 电路之城 ----------------
   夜空、月、层叠楼群与在楼体之间穿行的电路走线。 */
const SCENE_CITY = [
'<svg class="lg-svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">',
'<defs>',
'  <linearGradient id="s1sky" x1="0" y1="0" x2="0" y2="1">',
'    <stop offset="0" stop-color="#05080F"/><stop offset=".42" stop-color="#0A1626"/><stop offset=".74" stop-color="#103243"/><stop offset="1" stop-color="#0A1F2B"/>',
'  </linearGradient>',
'  <radialGradient id="s1halo" cx=".5" cy=".5" r=".5">',
'    <stop offset="0" stop-color="#CFF8EE" stop-opacity=".72"/><stop offset=".38" stop-color="#6FD8C6" stop-opacity=".24"/><stop offset="1" stop-color="#6FD8C6" stop-opacity="0"/>',
'  </radialGradient>',
'  <radialGradient id="s1moon" cx=".42" cy=".38" r=".62">',
'    <stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#DFFBF3"/><stop offset="1" stop-color="#A8E6D8"/>',
'  </radialGradient>',
'  <linearGradient id="s1haze" x1="0" y1="0" x2="0" y2="1">',
'    <stop offset="0" stop-color="#5FF0C0" stop-opacity="0"/><stop offset=".55" stop-color="#5FF0C0" stop-opacity=".1"/><stop offset="1" stop-color="#5FF0C0" stop-opacity=".2"/>',
'  </linearGradient>',
'  <linearGradient id="s1trace" x1="0" y1="0" x2="1" y2="0">',
'    <stop offset="0" stop-color="#6EF2C2" stop-opacity="0"/><stop offset=".28" stop-color="#8BFFD6" stop-opacity=".95"/><stop offset=".72" stop-color="#6EF2C2" stop-opacity=".55"/><stop offset="1" stop-color="#6EF2C2" stop-opacity="0"/>',
'  </linearGradient>',
'  <linearGradient id="s1fg" x1="0" y1="0" x2="0" y2="1">',
'    <stop offset="0" stop-color="#05080F" stop-opacity="0"/><stop offset=".55" stop-color="#04070D" stop-opacity=".55"/><stop offset="1" stop-color="#03060B" stop-opacity=".95"/>',
'  </linearGradient>',
'</defs>',
'<rect width="1440" height="900" fill="url(#s1sky)"/>',
'<ellipse cx="720" cy="268" rx="470" ry="330" fill="url(#s1halo)"/>',
'<circle cx="720" cy="250" r="96" fill="url(#s1moon)"/>',
'<circle cx="694" cy="232" r="13" fill="#BFE9DE" opacity=".35"/><circle cx="748" cy="276" r="18" fill="#BFE9DE" opacity=".25"/><circle cx="716" cy="292" r="8" fill="#BFE9DE" opacity=".3"/>',
'<g class="lg-stars">' + stars(96, 7, 1440, 900, 0.15, 0.85) + '</g>',
/* 薄云带 */
'<g fill="#7FE8D2" opacity=".08"><ellipse cx="300" cy="446" rx="220" ry="16"/><ellipse cx="1040" cy="430" rx="180" ry="13"/></g>',
'<rect y="520" width="1440" height="420" fill="url(#s1haze)"/>',
/* 远山剪影 */
'<path d="M0 636 L140 556 L268 612 L400 540 L540 620 L680 552 L820 628 L960 560 L1100 632 L1240 566 L1360 626 L1440 590 L1440 900 L0 900 Z" fill="#0A1D2C" opacity=".9"/>',
/* 中层楼群 */
'<g fill="#0E2637">',
'  <rect x="60" y="566" width="78" height="334" rx="4"/><rect x="152" y="608" width="52" height="292" rx="3"/>',
'  <rect x="286" y="530" width="92" height="370" rx="4"/><rect x="392" y="600" width="58" height="300" rx="3"/>',
'  <rect x="520" y="566" width="76" height="334" rx="4"/><rect x="610" y="620" width="50" height="280" rx="3"/>',
'  <rect x="760" y="542" width="86" height="358" rx="4"/><rect x="860" y="606" width="56" height="294" rx="3"/>',
'  <rect x="980" y="574" width="80" height="326" rx="4"/><rect x="1074" y="628" width="48" height="272" rx="3"/>',
'  <rect x="1200" y="552" width="88" height="348" rx="4"/><rect x="1302" y="614" width="54" height="286" rx="3"/>',
'</g>',
/* 近景楼群（更暗、更靠近） */
'<g fill="#071523">',
'  <rect x="-20" y="664" width="150" height="236" rx="6"/><rect x="146" y="620" width="112" height="280" rx="6"/>',
'  <rect x="272" y="700" width="168" height="200" rx="6"/><rect x="452" y="662" width="104" height="238" rx="6"/>',
'  <rect x="566" y="726" width="196" height="174" rx="6"/><rect x="774" y="652" width="128" height="248" rx="6"/>',
'  <rect x="914" y="706" width="158" height="194" rx="6"/><rect x="1084" y="636" width="120" height="264" rx="6"/>',
'  <rect x="1216" y="690" width="140" height="210" rx="6"/><rect x="1368" y="654" width="92" height="246" rx="6"/>',
'</g>',
/* 窗光 */
'<g class="lg-windows">' +
  windows(146, 620, 112, 280, 11, "#FFC97A", 0.36) +
  windows(286, 530, 92, 370, 23, "#8FE9D8", 0.3) +
  windows(760, 542, 86, 358, 31, "#FFC97A", 0.32) +
  windows(980, 574, 80, 326, 43, "#8FE9D8", 0.26) +
  windows(1200, 552, 88, 348, 47, "#FFC97A", 0.3) +
'</g>',
/* 电路走线：穿过楼体之间 */
'<g fill="none" stroke="url(#s1trace)" stroke-linecap="round" class="lg-traces">',
'  <path d="M0 618 H180 L214 584 H430 L462 618 H700 L734 584 H980 L1012 618 H1240 L1272 584 H1440" stroke-width="1.8"/>',
'  <path d="M0 676 H140 L172 644 H392 L420 676 H640 L668 644 H900 L930 676 H1180 L1210 644 H1440" stroke-width="1.4" opacity=".8"/>',
'  <path d="M0 732 H240 L268 704 H520 L548 732 H820 L848 704 H1120 L1150 732 H1440" stroke-width="1.1" opacity=".55"/>',
'</g>',
'<g class="lg-nodes" fill="#8BFFD6">',
'  <circle cx="214" cy="584" r="4"/><circle cx="462" cy="618" r="3.4"/><circle cx="734" cy="584" r="4"/><circle cx="1012" cy="618" r="3.4"/><circle cx="1272" cy="584" r="3.6"/>',
'  <circle cx="172" cy="644" r="2.8" opacity=".85"/><circle cx="668" cy="644" r="2.8" opacity=".85"/><circle cx="1210" cy="644" r="2.8" opacity=".85"/>',
'  <circle cx="268" cy="704" r="2.4" opacity=".7"/><circle cx="848" cy="704" r="2.4" opacity=".7"/>',
'</g>',
'<rect y="700" width="1440" height="200" fill="url(#s1fg)"/>',
'</svg>'
].join("\n");

/* ---------------- 02 信号之海 ----------------
   左侧无线电塔向夜空发信，海面倒映月光，层层山脊拉开纵深。 */
const SCENE_SIGNAL = [
'<svg class="lg-svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">',
'<defs>',
'  <linearGradient id="s2sky" x1="0" y1="0" x2="0" y2="1">',
'    <stop offset="0" stop-color="#031217"/><stop offset=".36" stop-color="#052A2E"/><stop offset=".66" stop-color="#0A4C48"/><stop offset="1" stop-color="#072A2D"/>',
'  </linearGradient>',
'  <radialGradient id="s2sun" cx=".5" cy=".5" r=".5">',
'    <stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset=".32" stop-color="#C8FFEC" stop-opacity=".8"/><stop offset=".62" stop-color="#7FEBD2" stop-opacity=".28"/><stop offset="1" stop-color="#5FE0C0" stop-opacity="0"/>',
'  </radialGradient>',
'  <linearGradient id="s2sea" x1="0" y1="0" x2="0" y2="1">',
'    <stop offset="0" stop-color="#0C4A46"/><stop offset=".45" stop-color="#083230"/><stop offset="1" stop-color="#03181B"/>',
'  </linearGradient>',
'  <linearGradient id="s2refl" x1="0" y1="0" x2="0" y2="1">',
'    <stop offset="0" stop-color="#B9FFE9" stop-opacity=".55"/><stop offset="1" stop-color="#B9FFE9" stop-opacity="0"/>',
'  </linearGradient>',
'</defs>',
'<rect width="1440" height="900" fill="url(#s2sky)"/>',
'<circle cx="700" cy="238" r="330" fill="url(#s2sun)"/>',
'<circle cx="700" cy="238" r="86" fill="#F2FFFB" opacity=".97"/>',
'<g class="lg-stars">' + stars(58, 19, 1440, 640, 0.12, 0.7) + '</g>',
/* 三层山脊：越近越暗 */
'<path d="M0 596 L150 500 L300 570 L450 486 L600 574 L760 502 L910 582 L1060 500 L1200 576 L1330 512 L1440 566 L1440 900 L0 900 Z" fill="#08302F" opacity=".55"/>',
'<path d="M0 646 L170 556 L330 630 L480 548 L640 640 L810 558 L960 648 L1110 570 L1260 646 L1400 578 L1440 606 L1440 900 L0 900 Z" fill="#062524" opacity=".82"/>',
'<path d="M0 704 L160 626 L300 690 L430 620 L560 700 L690 640 L820 706 L950 650 L1080 710 L1210 656 L1340 712 L1440 682 L1440 900 L0 900 Z" fill="#041A1B" opacity=".95"/>',
/* 无线电塔（左侧三分之一，塔尖在画面上部） */
'<g stroke="#A8F7E2" stroke-width="2.4" fill="none" opacity=".92" stroke-linecap="round">',
'  <path d="M330 700 L364 330 L398 700"/><path d="M342 586 L386 586"/><path d="M337 500 L391 500"/><path d="M333 416 L395 416"/>',
'  <path d="M345 610 L383 500"/><path d="M383 610 L345 500"/>',
'  <path d="M364 330 L364 292"/>',
'</g>',
'<circle cx="364" cy="284" r="6" fill="#D8FFF4" class="lg-beacon"/>',
'<g class="lg-waves" fill="none" stroke="#8DF5D4" stroke-linecap="round">',
'  <path d="M364 258 A 66 66 0 0 1 430 324" stroke-width="2.4" opacity=".8"/>',
'  <path d="M364 230 A 96 96 0 0 1 460 326" stroke-width="1.8" opacity=".5"/>',
'  <path d="M364 202 A 126 126 0 0 1 490 328" stroke-width="1.3" opacity=".3"/>',
'</g>',
/* 海面 + 月光倒影 */
'<rect y="700" width="1440" height="200" fill="url(#s2sea)"/>',
'<rect y="700" width="1440" height="40" fill="#031619" opacity=".38"/>',
'<g class="lg-shimmer" stroke="#B9FFE9" stroke-linecap="round" fill="none">',
'  <path d="M622 726 H782" stroke-width="2.6" opacity=".8"/><path d="M646 750 H758" stroke-width="2.1" opacity=".6"/>',
'  <path d="M666 772 H738" stroke-width="1.8" opacity=".48"/><path d="M680 792 H724" stroke-width="1.4" opacity=".34"/>',
'  <path d="M692 810 H712" stroke-width="1.2" opacity=".26"/><path d="M860 742 H980" stroke-width="1.3" opacity=".2"/>',
'  <path d="M120 762 H320" stroke-width="1.4" opacity=".28"/><path d="M470 792 H650" stroke-width="1.2" opacity=".22"/>',
'</g>',
'<g stroke="#CFF7EC" stroke-width="1.8" fill="none" opacity=".55" class="lg-birds">',
'  <path d="M1050 300 q12 -10 24 0 q12 -10 24 0"/><path d="M1120 336 q9 -8 18 0 q9 -8 18 0" opacity=".7"/>',
'</g>',
'<rect y="820" width="1440" height="80" fill="#02100F" opacity=".7"/>',
'</svg>'
].join("\n");

/* ---------------- 03 工位与光 ----------------
   暖光从台灯落到桌面：显示器、键盘、马克杯、工具、猫。
   四幅中的浅色画面，用来给轮播制造节奏对比。 */
const SCENE_WORKBENCH = [
'<svg class="lg-svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">',
'<defs>',
'  <linearGradient id="s3bg" x1="0" y1="0" x2="0" y2="1">',
'    <stop offset="0" stop-color="#FBF0DA"/><stop offset=".46" stop-color="#F3D9AE"/><stop offset="1" stop-color="#DDAE72"/>',
'  </linearGradient>',
'  <radialGradient id="s3lamp" cx=".5" cy=".5" r=".5">',
'    <stop offset="0" stop-color="#FFF6DC" stop-opacity=".95"/><stop offset=".5" stop-color="#FFDF9E" stop-opacity=".35"/><stop offset="1" stop-color="#FFDF9E" stop-opacity="0"/>',
'  </radialGradient>',
'  <linearGradient id="s3cone" x1="0" y1="0" x2="0" y2="1">',
'    <stop offset="0" stop-color="#FFF0C4" stop-opacity=".8"/><stop offset="1" stop-color="#FFF0C4" stop-opacity="0"/>',
'  </linearGradient>',
'  <linearGradient id="s3desk" x1="0" y1="0" x2="0" y2="1">',
'    <stop offset="0" stop-color="#C08A4E"/><stop offset=".18" stop-color="#A9712F"/><stop offset="1" stop-color="#7C4F22"/>',
'  </linearGradient>',
'  <linearGradient id="s3screen" x1="0" y1="0" x2="0" y2="1">',
'    <stop offset="0" stop-color="#FDF6E6"/><stop offset="1" stop-color="#EBD8B4"/>',
'  </linearGradient>',
'</defs>',
'<rect width="1440" height="900" fill="url(#s3bg)"/>',
/* 窗光 */
'<circle cx="300" cy="150" r="210" fill="url(#s3lamp)" opacity=".9"/>',
'<g stroke="#B8894C" stroke-width="1" opacity=".13">',
'  <path d="M0 250 H1440"/><path d="M0 316 H1440"/><path d="M0 382 H1440"/><path d="M0 448 H1440"/><path d="M0 514 H1440"/>',
'</g>',
/* 台灯（左） */
'<g stroke="#4A3220" stroke-width="8" fill="none" stroke-linecap="round">',
'  <path d="M214 640 L246 300 L330 250"/><path d="M214 640 L164 640"/>',
'</g>',
'<path d="M300 238 h116 l-24 58 h-68 Z" fill="#3B2A1C"/>',
'<path d="M356 296 L300 708 L620 708 L404 296 Z" fill="url(#s3cone)" class="lg-beam" opacity=".75"/>',
/* 桌面 */
'<rect y="640" width="1440" height="30" fill="#B57C3E"/>',
'<rect y="670" width="1440" height="230" fill="url(#s3desk)"/>',
'<rect y="670" width="1440" height="6" fill="#D89A55" opacity=".7"/>',
'<g stroke="#6B4318" stroke-width="1.2" opacity=".22"><path d="M0 706 H1440"/><path d="M0 752 H1440"/><path d="M0 800 H1440"/><path d="M0 852 H1440"/></g>',
/* 显示器 */
'<g>',
'  <rect x="392" y="262" width="392" height="262" rx="16" fill="#3A2A1C"/>',
'  <rect x="412" y="282" width="352" height="222" rx="8" fill="#20160D"/>',
'  <rect x="430" y="300" width="316" height="186" rx="5" fill="url(#s3screen)"/>',
'  <g stroke="#B07C42" stroke-linecap="round">',
'    <path d="M456 332 H610" stroke-width="7" opacity=".55"/><path d="M456 366 H700" stroke-width="7" opacity=".4"/>',
'    <path d="M456 400 H560" stroke-width="7" opacity=".5"/><path d="M456 434 H650" stroke-width="7" opacity=".3"/>',
'  </g>',
'  <rect x="516" y="300" width="4" height="186" fill="#B07C42" opacity=".2"/>',
'  <rect x="560" y="524" width="60" height="48" fill="#3A2A1C"/><rect x="506" y="572" width="168" height="16" rx="8" fill="#3A2A1C"/>',
'  <circle cx="398" cy="650" r="3.4" fill="#7A4E22"/>',
'</g>',
/* 键盘 */
'<g>',
'  <rect x="392" y="620" width="392" height="82" rx="11" fill="#2E2116"/>',
'  <g fill="#F0D9AE" opacity=".82">',
'    <rect x="412" y="636" width="24" height="15" rx="4"/><rect x="446" y="636" width="24" height="15" rx="4"/><rect x="480" y="636" width="24" height="15" rx="4"/><rect x="514" y="636" width="24" height="15" rx="4"/><rect x="548" y="636" width="24" height="15" rx="4"/><rect x="582" y="636" width="24" height="15" rx="4"/><rect x="616" y="636" width="24" height="15" rx="4"/><rect x="650" y="636" width="24" height="15" rx="4"/><rect x="684" y="636" width="24" height="15" rx="4"/><rect x="718" y="636" width="24" height="15" rx="4"/>',
'    <rect x="412" y="658" width="176" height="15" rx="4"/><rect x="600" y="658" width="142" height="15" rx="4"/>',
'  </g>',
'</g>',
/* 马克杯 + 热气 */
'<g>',
'  <ellipse cx="872" cy="668" rx="52" ry="7" fill="#5C3A18" opacity=".28"/>',
'  <path d="M840 588 h64 v54 a24 24 0 0 1 -24 24 h-16 a24 24 0 0 1 -24 -24 Z" fill="#3B2A1C"/>',
'  <path d="M846 592 h52 v46 a18 18 0 0 1 -18 18 h-16 a18 18 0 0 1 -18 -18 Z" fill="#6B4A28"/>',
'  <path d="M846 592 h52 v12 h-52 Z" fill="#F6E7C8" opacity=".85"/>',
'  <path d="M904 600 q30 7 30 26 q0 20 -30 24" fill="none" stroke="#3B2A1C" stroke-width="9"/>',
'  <g class="lg-steam" stroke="#FFF8E7" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9">',
'    <path d="M856 574 q-9 -17 4 -32 q11 -15 2 -30"/><path d="M882 576 q-9 -17 4 -32 q11 -15 2 -30" opacity=".6"/>',
'  </g>',
'</g>',
/* 猫（坐在显示器左侧） */
'<g fill="#4A3220">',
'  <path d="M252 640 q-10 -52 28 -74 q10 -26 26 0 q40 18 28 74 Z"/>',
'  <path d="M258 566 l-6 -26 18 10Z"/><path d="M330 566 l8 -26 -18 10Z"/>',
'  <circle cx="282" cy="604" r="4.2" fill="#FFE7B0"/><circle cx="318" cy="604" r="4.2" fill="#FFE7B0"/>',
'  <path d="M294 618 q6 5 12 0" stroke="#FFE7B0" stroke-width="2" fill="none" stroke-linecap="round"/>',
'  <path d="M240 640 q-26 -6 -34 -30 q-4 -14 8 -12 q14 2 18 22" fill="none" stroke="#4A3220" stroke-width="7" stroke-linecap="round"/>',
'  <g stroke="#FFE7B0" stroke-width="1.4" opacity=".55"><path d="M262 614 l-18 -4"/><path d="M262 620 l-19 2"/><path d="M338 614 l18 -4"/><path d="M338 620 l19 2"/></g>',
'</g>',
/* 工具与零件 */
'<g stroke="#3B2A1C" stroke-width="8" fill="none" stroke-linecap="round" opacity=".92">',
'  <path d="M120 650 L238 604"/><path d="M238 604 l18 -8 16 -3"/><path d="M120 650 l-14 6"/>',
'  <path d="M120 700 q0 -20 20 -20 q20 0 20 20 l0 12 q0 10 -10 10 l-20 0 q-10 0 -10 -10 Z" fill="#3B2A1C" stroke="none"/>',
'</g>',
'<g fill="#4A3220" opacity=".85"><rect x="720" y="664" width="16" height="5" rx="2"/><rect x="742" y="668" width="10" height="10" rx="2"/><circle cx="770" cy="670" r="4"/></g>',
/* 绿植（右） */
'<g><path d="M1010 640 h70 l-9 54 h-52 Z" fill="#8A5A28"/><g stroke="#4F6B3A" stroke-width="5" fill="none" stroke-linecap="round"><path d="M1044 638 q-24 -36 -6 -74"/><path d="M1044 638 q22 -30 8 -64"/><path d="M1044 638 q0 -44 26 -58"/></g></g>',
/* 灰尘颗粒 */
'<g class="lg-motes" fill="#FFF4D9" opacity=".75">',
'  <circle cx="470" cy="420" r="2.6"/><circle cx="560" cy="500" r="1.9"/><circle cx="640" cy="392" r="2.3"/><circle cx="760" cy="470" r="2.8"/><circle cx="860" cy="540" r="1.8"/><circle cx="360" cy="540" r="2"/>',
'</g>',
'<rect y="690" width="1440" height="210" fill="#7A4E22" opacity=".3"/>',
'</svg>'
].join("\n");

/* ---------------- 04 数据星图 ----------------
   等距网格上的节点、连线和流动的数据包：内容—读者—发布的同一条链路。 */
const SCENE_CONSTELLATION = [
'<svg class="lg-svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">',
'<defs>',
'  <linearGradient id="s4bg" x1="0" y1="0" x2="0" y2="1">',
'    <stop offset="0" stop-color="#070614"/><stop offset=".44" stop-color="#141036"/><stop offset="1" stop-color="#271B52"/>',
'  </linearGradient>',
'  <radialGradient id="s4neb" cx=".5" cy=".5" r=".5">',
'    <stop offset="0" stop-color="#8E7BFF" stop-opacity=".62"/><stop offset=".42" stop-color="#6A55E0" stop-opacity=".24"/><stop offset="1" stop-color="#5E4BD8" stop-opacity="0"/>',
'  </radialGradient>',
'  <radialGradient id="s4neb2" cx=".5" cy=".5" r=".5">',
'    <stop offset="0" stop-color="#5FE0C0" stop-opacity=".38"/><stop offset="1" stop-color="#5FE0C0" stop-opacity="0"/>',
'  </radialGradient>',
'  <linearGradient id="s4line" x1="0" y1="0" x2="1" y2="1">',
'    <stop offset="0" stop-color="#8E7BFF" stop-opacity=".1"/><stop offset=".45" stop-color="#CFC7FF" stop-opacity=".95"/><stop offset="1" stop-color="#5FE0C0" stop-opacity=".35"/>',
'  </linearGradient>',
'</defs>',
'<rect width="1440" height="900" fill="url(#s4bg)"/>',
'<ellipse cx="470" cy="360" rx="520" ry="360" fill="url(#s4neb)"/>',
'<ellipse cx="880" cy="560" rx="380" ry="260" fill="url(#s4neb2)" opacity=".7"/>',
'<g class="lg-stars">' + stars(110, 37, 1440, 900, 0.14, 0.75) + '</g>',
/* 等距网格 */
'<g stroke="#5B4BB4" stroke-width="1" opacity=".22" class="lg-grid">',
'  <path d="M-260 720 L520 250 L1300 720"/><path d="M-260 800 L520 330 L1300 800"/>',
'  <path d="M-260 880 L520 410 L1300 880"/><path d="M-260 640 L520 170 L1300 640"/>',
'  <path d="M-160 900 L520 496 L1200 900"/><path d="M120 900 L520 646 L920 900"/>',
'</g>',
/* 星座连线 */
'<g fill="none" stroke="url(#s4line)" stroke-width="1.7" class="lg-const">',
'  <path d="M180 520 L330 396 L520 470 L680 342 L860 430 L1020 344"/>',
'  <path d="M180 520 L300 640 L520 600 L700 700 L880 610 L1020 690"/>',
'  <path d="M330 396 L300 640"/><path d="M520 470 L520 600"/><path d="M680 342 L700 700"/><path d="M860 430 L880 610"/>',
'  <path d="M520 470 L680 342"/><path d="M300 640 L520 600"/>',
'</g>',
/* 节点 */
'<g class="lg-const-nodes">',
'  <circle cx="180" cy="520" r="4.6" fill="#CFC7FF"/><circle cx="330" cy="396" r="7" fill="#E8E4FF"/>',
'  <circle cx="520" cy="470" r="9" fill="#FFFFFF"/><circle cx="680" cy="342" r="6" fill="#9DF7DD"/>',
'  <circle cx="860" cy="430" r="5" fill="#CFC7FF"/><circle cx="1020" cy="344" r="4" fill="#9DF7DD"/>',
'  <circle cx="300" cy="640" r="4.4" fill="#CFC7FF"/><circle cx="520" cy="600" r="6.4" fill="#E8E4FF"/>',
'  <circle cx="700" cy="700" r="4.6" fill="#9DF7DD"/><circle cx="880" cy="610" r="7" fill="#E8E4FF"/><circle cx="1020" cy="690" r="4.2" fill="#CFC7FF"/>',
'</g>',
/* 主节点的光晕环 */
'<g fill="none" stroke="#CFC7FF" opacity=".5" class="lg-rings">',
'  <circle cx="520" cy="470" r="26"/><circle cx="520" cy="470" r="54" opacity=".6"/><circle cx="520" cy="470" r="86" opacity=".3"/>',
'</g>',
/* 数据包：沿链路的小方块 */
'<g class="lg-packets" fill="#9DF7DD">',
'  <rect x="330" y="396" width="5" height="5" rx="1.2"/><rect x="680" y="342" width="5" height="5" rx="1.2"/>',
'  <rect x="700" y="700" width="4" height="4" rx="1.2"/><rect x="880" y="610" width="5" height="5" rx="1.2"/>',
'</g>',
'<rect y="740" width="1440" height="160" fill="#0A0818" opacity=".55"/>',
'</svg>'
].join("\n");

const SCENES = [
  { key: "city", title: "电路之城", line: "把复杂的故障，拆成一条条可追踪的线路。", svg: SCENE_CITY },
  { key: "signal", title: "信号之海", line: "先找对方向，再一条命令一条命令地排。", svg: SCENE_SIGNAL },
  { key: "bench", title: "工位与光", line: "每一次修好，都从看清问题开始。", svg: SCENE_WORKBENCH },
  { key: "constellation", title: "数据星图", line: "内容、读者与发布，在同一条链路上流动。", svg: SCENE_CONSTELLATION }
];

module.exports = SCENES;
