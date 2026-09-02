/* ============================================================
   portal.js — 门户主站页面级动效
   补充：滚动驱动的 hero 视差 + 场景导航高亮
   ============================================================ */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  function initHeroParallax() {
    if (!hasGsap || reduceMotion) return;
    var hero = document.querySelector(".portal-hero");
    if (!hero) return;
    window.gsap.registerPlugin(window.ScrollTrigger);
    window.gsap.to(hero.querySelector(".hero__inner"), {
      y: -60, opacity: 0.35, ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom 30%", scrub: 0.8 }
    });
    var blobs = document.querySelectorAll(".blob");
    blobs.forEach(function (b, i) {
      window.gsap.to(b, {
        y: 90 + i * 40, ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true }
      });
    });
  }

  function initNavActive() {
    var links = document.querySelectorAll(".nav__link");
    var sections = ["about", "works", "footer"].map(function (id) { return document.getElementById(id); });
    function onScroll() {
      var y = window.scrollY || 0;
      var h = window.innerHeight;
      var current = "top";
      sections.forEach(function (s) {
        if (s && s.getBoundingClientRect().top <= h * 0.5) current = s.id;
      });
      links.forEach(function (l) {
        l.classList.toggle("is-active", l.getAttribute("href") === "#" + current);
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function init() { initHeroParallax(); initNavActive(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
