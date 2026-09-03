# -*- coding: utf-8 -*-
import io
path = "demo/travel.html"
html = io.open(path, "r", encoding="utf-8").read()

html = html.replace('<meta name="theme-color" content="#ffb0c8" />', '<meta name="theme-color" content="#F5FAFF" />')
html = html.replace('<meta name="twitter:card" content="summary_large_image" />',
                    '<meta name="twitter:card" content="summary_large_image" />\n  <link rel="canonical" href="https://travel-notes.yuanabd.cn/" />')
html = html.replace('<link rel="stylesheet" href="./css/travel-download.css?v=20260902b" />',
                    '<link rel="stylesheet" href="./css/travel-download.css?v=20260902b" />\n  <link rel="stylesheet" href="./css/travel-sunny.css?v=20260903a" />')

# 1. 画廊标题 / 描述（§7.4 Hero）
old_kicker = '<span class="card__kicker">Travel Notes · 记忆画廊</span>'
html = html.replace(old_kicker, '<span class="card__kicker">TRAVEL-NOTES · 记忆画廊</span>')
old_desc = 'p class="gallery-title__desc">每一次出发，都是一座城市的旋转入口。滚动，开始环游。</p>'
new_desc = 'p class="gallery-title__desc">把走过的路，变成自己的故事。滚动，开始环游这座城市画廊。</p>'
assert old_desc in html, "gallery desc not found"
html = html.replace(old_desc, new_desc)

# 2. 城市足迹标题
old_cf = '<span class="section__label">示例足迹 · Six Cities</span>'
html = html.replace(old_cf, '<span class="section__label">CITIES · 七座城市</span>')
old_cf2 = '<h2 class="section__title">每一站，都是一页画册</h2>'
html = html.replace(old_cf2, '<h2 class="section__title">一座城市，<br />一段自己的故事</h2>')

# 3. Your World 区块：插入到 features 前
marker_features = '    <!-- ============ 核心功能（XMind 式堆叠卡）============ -->'
world = '''    <!-- ============ Your World 足迹 ============ -->
    <section class="worldband" id="world" aria-label="足迹世界">
      <div class="wrap worldband__head" data-reveal>
        <span class="section__label">Your World · 足迹</span>
        <h2 class="section__title">走过的地方，<br />拼成自己的世界</h2>
        <p class="worldband__desc">每一座点亮的城市，都是一段真实旅程的起点。地图会记得你走过哪里，也会记得你下一次想去哪。</p>
      </div>
      <div class="worldband__body">
        <div class="worldmap" data-reveal aria-label="足迹地图：北京、上海、杭州、成都、西安、重庆">
          <svg class="worldmap__svg" viewBox="0 0 400 260" aria-hidden="true" fill="none" stroke="rgba(46,143,216,.55)" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="4 6">
            <path d="M238 88 L270 148 L205 172 L155 186 L204 206 L270 148" />
            <path d="M270 148 L285 168" />
          </svg>
          <span class="wdot" style="--x:238px;--y:88px"><i></i>北京<em>39.9°N</em></span>
          <span class="wdot" style="--x:270px;--y:148px"><i></i>上海<em>31.2°N</em></span>
          <span class="wdot" style="--x:205px;--y:172px"><i></i>杭州<em>30.3°N</em></span>
          <span class="wdot" style="--x:155px;--y:186px"><i></i>成都<em>30.6°N</em></span>
          <span class="wdot" style="--x:204px;--y:206px"><i></i>重庆<em>29.6°N</em></span>
          <span class="wdot" style="--x:285px;--y:168px"><i></i>西安<em>34.3°N</em></span>
        </div>
        <div class="worldband__stats" data-reveal data-reveal-delay="1">
          <div class="wstat"><b>07</b><span>Cities · 城市</span></div>
          <div class="wstat"><b>12</b><span>Trips · 旅程</span></div>
          <div class="wstat"><b>240+</b><span>Memories · 记忆</span></div>
          <div class="wstat"><b>6,800km</b><span>Distance · 足迹里程</span></div>
        </div>
      </div>
    </section>

    <!-- ============ Travel Stories 城市故事 ============ -->
    <section class="tstories" id="stories" aria-label="城市故事">
      <div class="wrap tstories__head" data-reveal>
        <span class="section__label">Travel Stories · 城市故事</span>
        <h2 class="section__title">每一座城市，<br />都是一段故事的开头</h2>
      </div>
      <div class="tstories__grid">
        <article class="scard-story" data-reveal>
          <figure class="sshot"><img src="./img/chongqing-900.webp" alt="重庆山城夜景" loading="lazy" /></figure>
          <div class="scopy">
            <span class="smeta">重庆 · 29.6°N · 2026.05</span>
            <h3>山城的灯，一层叠一层</h3>
            <p>洪崖洞把夜拉成长街，轻轨从楼宇间穿过。在重庆，地图是立体的，路是走出来的。</p>
          </div>
        </article>
        <article class="scard-story" data-reveal data-reveal-delay="1">
          <figure class="sshot"><img src="./img/xian-900.webp" alt="西安城墙" loading="lazy" /></figure>
          <div class="scopy">
            <span class="smeta">西安 · 34.3°N · 2025.10</span>
            <h3>城墙下的灯火与马蹄</h3>
            <p>从钟楼到鼓楼，从兵马俑到回民街。历史的重量压在黄土上，也被一碗羊肉泡馍轻轻接住。</p>
          </div>
        </article>
        <article class="scard-story" data-reveal data-reveal-delay="2">
          <figure class="sshot"><img src="./img/chengdu-900.webp" alt="成都慢生活" loading="lazy" /></figure>
          <div class="scopy">
            <span class="smeta">成都 · 30.6°N · 2025.04</span>
            <h3>慢下来的日子，才值得记住</h3>
            <p>盖碗茶从午后泡到黄昏，熊猫躲在竹林里打盹。成都教会我一件事：有些风景，急不得。</p>
          </div>
        </article>
      </div>
    </section>

    <!-- ============ Memories 胶片记忆 ============ -->
    <section class="memories" id="memories" aria-label="Memories 记忆档案">
      <div class="wrap memories__head" data-reveal>
        <span class="section__label">Memories · 记忆档案</span>
        <h2 class="section__title">翻开来，<br />是走过的路</h2>
        <p class="memories__desc">把照片、日期与一句话并排放进胶片相框——每次出发都被剪成一帧，合上这本档案，就是记下的日子。</p>
      </div>
      <div class="filmstrip" data-reveal>
        <figure class="fstrip">
          <img src="./img/beijing-900.webp" alt="北京 · 故宫" loading="lazy" />
          <figcaption><b>故宫的雪</b><span>北京 · 2025.12</span></figcaption>
        </figure>
        <figure class="fstrip fstrip--tall">
          <img src="./img/shanghai-900.webp" alt="上海 · 外滩" loading="lazy" />
          <figcaption><b>外滩的夜</b><span>上海 · 2026.01</span></figcaption>
        </figure>
        <figure class="fstrip fstrip--wide">
          <img src="./img/hangzhou-900.webp" alt="杭州 · 西湖" loading="lazy" />
          <figcaption><b>西湖的烟柳</b><span>杭州 · 2025.08</span></figcaption>
        </figure>
        <figure class="fstrip">
          <img src="./img/chongqing-900.webp" alt="重庆 · 洪崖洞" loading="lazy" />
          <figcaption><b>洪崖洞的人潮</b><span>重庆 · 2026.05</span></figcaption>
        </figure>
        <figure class="fstrip fstrip--tall">
          <img src="./img/xian-900.webp" alt="西安 · 城墙" loading="lazy" />
          <figcaption><b>城墙的黄昏</b><span>西安 · 2025.10</span></figcaption>
        </figure>
        <figure class="fstrip">
          <img src="./img/chengdu-900.webp" alt="成都 · 盖碗茶" loading="lazy" />
          <figcaption><b>盖碗茶的午后</b><span>成都 · 2025.04</span></figcaption>
        </figure>
      </div>
    </section>

'''
assert marker_features in html, "features marker not found"
html = html.replace(marker_features, world + marker_features, 1)

# 4. Footer 品牌壳
old_footer = '''  <footer class="footer">
    <div class="wrap">
      <a class="footer__back" href="https://www.yuanabd.cn/">← 回到首页</a>
      <div class="footer__meta">
        <span>© <span id="year">2026</span> 行迹 · Travel Notes</span>
        <span>ICP 备案号占位 · 公安备案号占位</span>
      </div>
    </div>
  </footer>'''
new_footer = '''  <footer class="footer">
    <div class="wrap">
      <div class="travel-footer-brand">
        <b>YUAN.ABD / TRAVEL</b>
        <span class="sep" aria-hidden="true">·</span>
        <a href="https://www.yuanabd.cn/" target="_blank" rel="noopener">回到主站</a>
        <span class="sep" aria-hidden="true">·</span>
        <a href="https://learn.yuanabd.cn/" target="_blank" rel="noopener">Learn-Workbench</a>
        <span class="sep" aria-hidden="true">·</span>
        <a href="https://github.com/yuanabd" target="_blank" rel="noopener">GitHub</a>
      </div>
      <a class="footer__back" href="https://www.yuanabd.cn/">← 回到首页</a>
      <div class="footer__meta">
        <span>© <span id="year">2026</span> 行迹 · Travel Notes</span>
        <span>ICP 备案号占位 · 公安备案号占位</span>
      </div>
    </div>
  </footer>'''
assert old_footer in html, "footer not found"
html = html.replace(old_footer, new_footer)

io.open(path, "w", encoding="utf-8").write(html)
print("travel.html rewritten, size:", len(html))
