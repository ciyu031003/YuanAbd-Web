# -*- coding: utf-8 -*-
import io, re
path = "F:/CodeFiles/YuanAbd-Web/demo/index.html"
html = io.open(path, "r", encoding="utf-8").read()
css = io.open("F:/CodeFiles/YuanAbd-Web/demo/tools/new_style.css", "r", encoding="utf-8").read()

html = html.replace("<meta name=\"theme-color\" content=\"#0a0e12\" />", "<meta name=\"theme-color\" content=\"#FFFDF7\" />")

style_start = html.index("<style>") + len("<style>")
style_end = html.index("</style>")
html = html[:style_start] + "\n" + css + "\n" + html[style_end:]

old_hero = """  <section class="hero" aria-label="介绍">
    <canvas id="stars" aria-hidden="true"></canvas>
    <div class="hero__glow" aria-hidden="true"></div>
    <div class="hero__word" aria-hidden="true">YUAN.ABD</div>
"""
new_hero = """  <section class="hero" aria-label="介绍">
    <canvas id="stars" aria-hidden="true"></canvas>
    <div class="hero__glow" aria-hidden="true"></div>
    <div class="sun" aria-hidden="true"></div>
    <div class="float-shape float-shape--a" aria-hidden="true"></div>
    <div class="float-shape float-shape--b" aria-hidden="true"></div>
    <div class="float-shape float-shape--c" aria-hidden="true"></div>
    <div class="float-shape float-shape--d" aria-hidden="true"></div>
    <div class="hero__word" aria-hidden="true">YUAN.ABD</div>
"""
assert old_hero in html, "missing hero open"
html = html.replace(old_hero, new_hero)

old_h1 = """      <h1 data-reveal data-reveal-delay="1">把好奇心，<br />做成<em>能用</em>的作品。</h1>
"""
new_h1 = """      <h1 data-reveal data-reveal-delay="1">
        <span class="brandline">YUAN.ABD <em>Personal Digital Studio</em></span>
        把好奇心，<br />做成<em>能用</em>的作品。
      </h1>
"""
assert old_h1 in html, "missing h1"
html = html.replace(old_h1, new_h1)

old_sub = """        YUAN.ABD 是一间一个人的工作室。这里有两件正在生长的产品——
        一本把求职与学习<b>装订成手册</b>的工作台，和一座把走过的路<b>转身成画廊</b>的旅行空间。
      </p>
"""
new_sub = """        YUAN.ABD 是一间一个人的工作室。这里有两件正在生长的产品——
        一本把求职与学习<b>装订成手册</b>的工作台，和一座把走过的路<b>转身成画廊</b>的旅行空间。
      </p>
      <div class="hero__roles" data-reveal data-reveal-delay="2">
        <span>Independent Developer</span>
        <span>Design × Engineering</span>
        <span>Web + Android</span>
      </div>
"""
assert old_sub in html, "missing sub"
html = html.replace(old_sub, new_sub)

old_nav = """    <nav class="nav__links" id="navLinks" aria-label="主导航">
      <a href="#learn">学习工作台</a>
      <a href="#travel">行迹</a>
      <a href="#studio">工作室</a>
    </nav>
"""
new_nav = """    <nav class="nav__links" id="navLinks" aria-label="主导航">
      <a href="#learn">LEARN</a>
      <a href="#travel">TRAVEL</a>
      <a href="#studio">STUDIO</a>
      <a href="#now">NOW</a>
    </nav>
"""
assert old_nav in html, "missing nav"
html = html.replace(old_nav, new_nav)

build_now = """  </section>

  <!-- ================= How I Build ================= -->
  <section class="build" id="build" aria-label="如何构建">
    <div class="wrap">
      <div class="section__head" data-reveal>
        <span class="section__index">04</span>
        <span class="section__label">How I Build · 构建方式</span>
      </div>
      <div class="build__grid">
        <article class="bcard" data-reveal>
          <span class="bcard__idx">01 · DESIGN</span>
          <h3>先想清楚，再动手</h3>
          <p>从一句话价值主张出发，先搭信息架构与设计系统，再进入像素。每个页面都先回答「它为什么存在」。</p>
        </article>
        <article class="bcard" data-reveal data-reveal-delay="1">
          <span class="bcard__idx">02 · ENGINEERING</span>
          <h3>小步上线，真实使用</h3>
          <p>不做演示级 Demo。功能从第一行代码走到线上运行，在真实数据与真实使用中迭代。</p>
        </article>
        <article class="bcard" data-reveal data-reveal-delay="2">
          <span class="bcard__idx">03 · DEPLOY</span>
          <h3>自己运维，自己负责</h3>
          <p>从界面设计、前后端工程到服务器部署与性能监控，由同一双手完成，端到端可控。</p>
        </article>
        <article class="bcard" data-reveal data-reveal-delay="3">
          <span class="bcard__idx">04 · LEARN</span>
          <h3>公开构建，持续分享</h3>
          <p>每一步进展都公开进行；踩过的坑写下来，变成下一件作品的地基。</p>
        </article>
      </div>
    </div>
  </section>

  <!-- ================= Now / 2026 ================= -->
  <section class="now" id="now" aria-label="Now 2026">
    <div class="wrap">
      <div class="now__panel" data-reveal>
        <div class="now__inner">
          <div>
            <span class="now__kicker"><i aria-hidden="true"></i>Now · 2026</span>
            <h2 class="now__title">正在发生：<br /><em>两件作品，一条成长曲线。</em></h2>
            <p class="now__desc">
              学习工作台正在用真实招聘数据打磨「职业准备度」闭环；行迹正在把城市画廊扩展成完整的旅行记忆空间。
              下一步：让 Learn 的路线图更聪明，让 Travel 的故事更完整。
            </p>
            <ul class="now__list">
              <li>Learn-Workbench：招聘数据每日更新，职业准备度曲线持续内测</li>
              <li>Travel-Notes：城市画廊已收录 7 座城市，足迹地图与相册同步推进</li>
              <li>Mobile：双端 App 已在线上运行，Web + Android 同步迭代</li>
            </ul>
          </div>
          <div class="now__cards">
            <div class="ncard" data-reveal data-reveal-delay="1"><b>2</b><span>在营产品 · 均已在线上运行</span></div>
            <div class="ncard" data-reveal data-reveal-delay="1"><b>7</b><span>行程城市 · 已收录进旅行画廊</span></div>
            <div class="ncard" data-reveal data-reveal-delay="2"><b>19</b><span>数据源平台 · 每日自动抓取</span></div>
            <div class="ncard" data-reveal data-reveal-delay="2"><b>100%</b><span>独立完成 · 设计与工程一体</span></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ================= Footer ================= -->
"""
marker = "\n  <!-- ================= Footer ================= -->\n"
assert marker in html, "missing footer marker"
html = html.replace(marker, build_now, 1)

old_base = """      <div class="footer__base">
        <p class="mono">© 2026 YUAN.ABD · Built with curiosity</p>
        <p class="mono">Guangzhou · 23.1°N 113.2°E</p>
      </div>
"""
new_base = """      <div class="footer__brand">
        <b>YUAN.ABD</b>
        <a href="https://learn.yuanabd.cn" target="_blank" rel="noopener">Learn-Workbench</a>
        <span class="footer__sep" aria-hidden="true">·</span>
        <a href="https://travel-notes.yuanabd.cn" target="_blank" rel="noopener">Travel-Notes</a>
        <span class="footer__sep" aria-hidden="true">·</span>
        <a href="https://github.com/yuanabd" target="_blank" rel="noopener">GitHub</a>
        <span class="footer__sep" aria-hidden="true">·</span>
        <a href="mailto:hi@yuanabd.cn">Email</a>
      </div>
      <div class="footer__base">
        <p class="mono">© 2026 YUAN.ABD · Built with curiosity</p>
        <p class="mono">Guangzhou · 23.1°N 113.2°E</p>
      </div>
"""
assert old_base in html, "missing footer base"
html = html.replace(old_base, new_base)

html = html.replace("hue: Math.random() < 0.5 ? \"127,181,255\" : \"240,179,92\",",
                    "hue: Math.random() < 0.5 ? \"75,143,204\" : \"255,146,120\",")

io.open(path, "w", encoding="utf-8").write(html)
print("index.html rewritten, size:", len(html))
