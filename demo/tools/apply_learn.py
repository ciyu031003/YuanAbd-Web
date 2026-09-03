# -*- coding: utf-8 -*-
import io, re
path = "demo/learn.html"
html = io.open(path, "r", encoding="utf-8").read()

html = html.replace('<meta name="theme-color" content="#29251d" />', '<meta name="theme-color" content="#FFFDF7" />')
html = html.replace('<link rel="stylesheet" href="./css/learn.css?v=20260830c" />',
                    '<link rel="stylesheet" href="./css/learn.css?v=20260830c" />\n  <link rel="stylesheet" href="./css/learn-sunny.css?v=20260903a" />')
html = html.replace('<meta name="twitter:card" content="summary_large_image" />',
                    '<meta name="twitter:card" content="summary_large_image" />\n  <link rel="canonical" href="https://learn.yuanabd.cn/" />')

old_hero = '    <h1 class="hero-word" aria-hidden="true">学习</h1>\n'
new_hero = '    <h1 class="hero-word" aria-hidden="true">学习</h1>\n\n    <div class="hero-wrap">\n      <span class="card__kicker">LEARN-WORKBENCH · 求职与学习工作台</span>\n      <h2 class="hero-title">把学习，变成一条<br /><em>通往工作的路线</em>。</h2>\n      <p class="hero-sub">市场 · 题库 · 路线 · 管道 · 就绪 —— <b>五本手册，一条职业路线</b>。真实招聘数据每日更新，从 Offer 倒推回今天该学什么。</p>\n      <a class="hero-cta" href="#live" data-login>开始我的职业路线 <span aria-hidden="true">→</span></a>\n      <div class="hero-chips">\n        <span>在库职位 <b>3,279</b></span>\n        <span>覆盖城市 <b>47</b></span>\n        <span>数据源平台 <b>19</b></span>\n        <span>平均薪资 <b>14K</b></span>\n      </div>\n    </div>\n'
assert old_hero in html, "hero marker not found"
html = html.replace(old_hero, new_hero)

new_style = {
    "market": "--cover-color:#FFFFFF; --cover-ink:#18202A",
    "quiz": "--cover-color:#EAF6FF; --cover-ink:#0E5FA8",
    "roadmap": "--cover-color:#FFF3C9; --cover-ink:#6B4E00",
    "pipeline": "--cover-color:#FFEDE6; --cover-ink:#A63D1F",
    "readiness": "--cover-color:#EDF9F2; --cover-ink:#1E7A4F",
}
for book, style in new_style.items():
    m = re.search(r'<button\s+class="book-card"\s+type="button"\s+data-book="' + book + r'"[^>]*>', html)
    if not m:
        print("book not found:", book); continue
    tag = m.group(0)
    tag2 = re.sub(r'\sstyle="[^"]*"', "", tag)
    tag2 = tag2.replace("<button ", "<button style=\"" + style + "\" ", 1)
    html = html.replace(tag, tag2)
    print("book", book, "styled")

old_footer = '  <footer class="footer">\n    <div class="wrap">\n      <a class="footer__back" href="https://www.yuanabd.cn/">← 回到首页</a>\n      <div class="footer__meta">\n        <span>© <span id="year">2026</span> 学习工作台 · Learn Workbench</span>\n        <span>ICP 备案号占位 · 公安备案号占位</span>\n      </div>\n    </div>\n  </footer>\n'
new_footer = '  <footer class="footer">\n    <div class="wrap">\n      <div class="learn-footer-brand">\n        <b>YUAN.ABD / LEARN</b>\n        <span class="sep" aria-hidden="true">·</span>\n        <a href="https://www.yuanabd.cn/" target="_blank" rel="noopener">回到主站</a>\n        <span class="sep" aria-hidden="true">·</span>\n        <a href="https://travel-notes.yuanabd.cn/" target="_blank" rel="noopener">Travel-Notes</a>\n        <span class="sep" aria-hidden="true">·</span>\n        <a href="https://github.com/yuanabd" target="_blank" rel="noopener">GitHub</a>\n      </div>\n      <a class="footer__back" href="https://www.yuanabd.cn/">← 回到首页</a>\n      <div class="footer__meta">\n        <span>© <span id="year">2026</span> 学习工作台 · Learn Workbench</span>\n        <span>ICP 备案号占位 · 公安备案号占位</span>\n      </div>\n    </div>\n  </footer>\n'
assert old_footer in html, "footer marker not found"
html = html.replace(old_footer, new_footer)

io.open(path, "w", encoding="utf-8").write(html)
print("learn.html rewritten, size:", len(html))
