/* ============================================================
   learn.js — 学习工作台 · 求职手册
   交互层移植自 ThreeUI BestsellersBookShowcase canonical source
   （书架视差 / 选中翻阅 / 菜单 / Toast），内容为工作台真实能力。
   ============================================================ */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  /* ---------- 五本手册：内容来自线上产品真实功能与数据 ---------- */
  var books = {
    market: {
      title: "市场",
      year: "2026",
      source: "数据源 · 19 个平台",
      description:
        "招聘市场分析把在库的 3,279 个职位拆开看：哪些技能正在被需要、哪些城市在招人、薪资落在什么区间——用真实招聘数据决定备考方向，而不是凭感觉。",
      steps: [
        { title: "打开市场总览", body: "在「职业 → 市场分析」查看 3,024 个岗位样本、47 个城市的整体分布。" },
        { title: "找到技能缺口", body: "按技能查看需求排行：Vue 26 岗、Python 20 岗、JavaScript 18 岗、React 17 岗。" },
        { title: "锁定目标市场", body: "对比城市与薪资分布，选出你真正想去的市场，而不是投遍全国。" },
        { title: "缺口一键入路线", body: "把缺的技能直接加入学习路线图，市场告诉你缺什么，路线就排什么。" }
      ],
      prompt: "vue 26 岗在招 · python 20 岗在招 · javascript 18 岗在招 · react 17 岗在招\n平均薪资 14K · 覆盖平台 19 个 · 上次抓取 2 小时前",
      review: "每周回看一次技能缺口：优先补「在招岗位最多」的那一项，而不是最容易的那一项。"
    },
    quiz: {
      title: "题库",
      year: "2026",
      source: "练习记录",
      description:
        "面试题库把刷题、模拟与真实面试记录放进同一条作答流：自评、对错、反应与复盘都落在一次作答里，事后可回溯，错题不会白错。",
      steps: [
        { title: "选模块与难度", body: "进入「职业 → 面试」，按模块和难度开始刷题，先自答再提交。" },
        { title: "用模拟做整卷", body: "切到模拟模式做整卷演练，模拟接近真实面试的节奏与压力。" },
        { title: "录入真实面试", body: "每场面试结束后，把被问到的问题录回去，沉淀成你自己的题库。" },
        { title: "回看错题复盘", body: "按模块回看答题统计：正确率、自评与反应时间，弱项一目了然。" }
      ],
      prompt: "第 1 / 12 题 · Agent · 中\n什么是 Agent？与普通程序的区别？\n——先自己作答，再看市场驱动备考的考点提示。",
      review: "别只刷会做的题。答错的部分，才是就绪度曲线里真正缺的那一段。"
    },
    roadmap: {
      title: "路线",
      year: "2026",
      source: "职业规划",
      description:
        "学习路线图按职业规划阶段推进：前端开发工程师从 HTML / CSS / JavaScript 一路到性能与架构，19 个主题完成即打勾，进度自动聚合，也可自定义主题。",
      steps: [
        { title: "选一条职业路线", body: "前端、后端、数据分析、AI、网络安全、ICT 综合路线，选后可随时切换。" },
        { title: "按阶段推进", body: "Fe·P1 前端基础（第 1-4 周）→ Fe·P2 工程化与框架（第 5-10 周），完成主题即打勾。" },
        { title: "与题库市场联动", body: "市场缺口可以一键加入路线；路线主题也能直接跳到对应的题库刷题。" },
        { title: "每周回看进度", body: "进度自动聚合成整体百分比——关注周趋势，而不是某一天的情绪。" }
      ],
      prompt: "Fe·P1 前端基础：HTML / CSS / JS（第 1-4 周 · 0/4）\nFe·P2 工程化与框架：Git / 构建 / Vue / React（第 5-10 周 · 0/4）\nFe·P3 跨端 → Fe·P4 性能与架构",
      review: "路线是进度尺，不是任务清单。卡住时回看市场缺口，调整主题，而不是硬推。"
    },
    pipeline: {
      title: "管道",
      year: "2026",
      source: "求职记录",
      description:
        "求职看板把每一条线索放进九态管道：收藏、投递、笔试面试、Offer、入职——进度与上下文一目了然，不丢任何机会，也不让任何线索停在「忘了跟进」。",
      steps: [
        { title: "从招花收藏职位", body: "「招花 · 今日好岗」每天更新 300+ 新岗，看到合适的先收藏。" },
        { title: "转入求职管道", body: "收藏的职位一键转入看板，九个状态列清楚：从投递到入职。" },
        { title: "推进每个状态", body: "投递、笔试、面试、Offer——每动一步都记录时间与上下文。" },
        { title: "面试问题回流", body: "面完把问题录回题库复盘；下次面试前，管道和题库一起复习。" }
      ],
      prompt: "收藏 → 投递 → 笔试 → 面试 → Offer → 入职\n每一条投递都有状态、时间线与下一步动作。",
      review: "每一条投递都要有下一步动作；两周没有回复的线索，主动跟进一次再归档。"
    },
    readiness: {
      title: "就绪",
      year: "2026",
      source: "评估报告",
      description:
        "就绪度评估把技能、项目、简历、面试四个维度汇成一条职业准备度曲线——让你看见与目标岗位之间，真正差的那一段，而不是笼统地焦虑。",
      steps: [
        { title: "看总览", body: "在「首页」查看职业准备度总览：技能 · 项目 · 简历 · 面试四个维度。" },
        { title: "按维度补齐", body: "哪个维度低就补哪个：技能测评、项目经历、简历完善、模拟面试。" },
        { title: "缺口自动回流", body: "评估发现的缺口会回流到学习路线，形成「评估 → 补齐 → 再评估」的循环。" },
        { title: "盯趋势不盯单点", body: "准备度是曲线不是数字——一周看一次趋势，胜过一天刷十次。" }
      ],
      prompt: "技能 0% · 项目 0% · 简历 0% · 面试 0% → 职业准备度 0%\n发现 3,279 个适合你的职位，等你把第一条曲线拉起来。",
      review: "就绪度永远相对于目标岗位——先锁定岗位，再看差距，评估才有意义。"
    }
  };

  var body = document.body;
  var docEl = document.documentElement;
  var stage = document.querySelector(".stage");
  var cards = Array.prototype.slice.call(document.querySelectorAll(".book-card"));
  var detailPanel = document.querySelector("#detailPanel");
  var detailTitle = document.querySelector("#detailTitle");
  var detailScroll = document.querySelector("#detailScroll");
  var detailDescription = document.querySelector("#detailDescription");
  var detailSteps = document.querySelector("#detailSteps");
  var detailPrompt = document.querySelector("#detailPrompt");
  var detailReview = document.querySelector("#detailReview");
  var detailSource = document.querySelector("#detailSource");
  var detailYear = document.querySelector("#detailYear");
  var closeButton = document.querySelector("#closeButton");
  var menuButton = document.querySelector("#menuButton");
  var menuLayer = document.querySelector("#menuLayer");
  var saveButton = document.querySelector("#saveButton");
  var toast = document.querySelector("#toast");
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var selectedCard = null;
  var toastTimer = 0;
  var frame = 0;
  var pointerX = 0;
  var pointerY = 0;
  var pointerClientX = -10000;
  var pointerClientY = -10000;
  /* ---------- 模态焦点圈（detail / menu 打开时循环 Tab） ---------- */
  var FOCUSABLE = 'a[href], button:not([tabindex="-1"]), [tabindex]:not([tabindex="-1"]), input, select, textarea';
  function trapFocus(container, event) {
    var focusables = Array.prototype.slice.call(container.querySelectorAll(FOCUSABLE)).filter(function (el) {
      return el.offsetParent !== null;
    });
    if (!focusables.length) { event.preventDefault(); container.focus && container.focus(); return; }
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    var active = document.activeElement;
    if (event.shiftKey) {
      if (active === first || !container.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (active === last || !container.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  /* ---------- Toast（兼容 project.js 的 .is-on 机制） ---------- */
  function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.dataset.show = "true";
    toast.classList.add("is-on");
    toastTimer = window.setTimeout(function () {
      toast.dataset.show = "false";
      toast.classList.remove("is-on");
    }, 1800);
  }

  /* ---------- 指针视差（源逻辑保留） ---------- */
  function updateParallax() {
    frame = 0;
    if (reducedMotion.matches) return;

    if (body.dataset.mode === "detail" && selectedCard) {
      var bounds = selectedCard.getBoundingClientRect();
      var bookCenterX = bounds.left + bounds.width / 2;
      var bookCenterY = bounds.top + bounds.height / 2;
      var isPointerInViewport =
        pointerClientX >= 0 && pointerClientX <= window.innerWidth &&
        pointerClientY >= 0 && pointerClientY <= window.innerHeight;
      var horizontalReach = pointerClientX < bookCenterX
        ? Math.max(bookCenterX, 1)
        : Math.max(window.innerWidth - bookCenterX, 1);
      var verticalReach = pointerClientY < bookCenterY
        ? Math.max(bookCenterY, 1)
        : Math.max(window.innerHeight - bookCenterY, 1);
      var viewportX = isPointerInViewport
        ? Math.max(-1, Math.min(1, (pointerClientX - bookCenterX) / horizontalReach))
        : -5 / 16;
      var viewportY = isPointerInViewport
        ? Math.max(-1, Math.min(1, (pointerClientY - bookCenterY) / verticalReach))
        : 0;
      selectedCard.style.setProperty("--detail-yaw", (viewportX * 16) + "deg");
      selectedCard.style.setProperty("--detail-pitch", (viewportY * -10) + "deg");
      selectedCard.dataset.orbiting = String(isPointerInViewport);
      return;
    }

    if (body.dataset.mode !== "gallery") return;

    docEl.style.setProperty("--mx", (pointerX * 11) + "px");
    docEl.style.setProperty("--my", (pointerY * 8) + "px");

    var centerIndex = Math.floor(cards.length / 2);
    cards.forEach(function (card, index) {
      var depth = index === centerIndex ? 1 : .58;
      card.style.setProperty("--local-x", (pointerX * 15 * depth) + "px");
      card.style.setProperty("--local-y", (pointerY * 9 * depth) + "px");
    });
  }

  /* ---------- 选中 / 关闭（源逻辑保留，内容替换） ---------- */
  function selectBook(card) {
    if (body.dataset.mode === "detail") return;
    var data = books[card.dataset.book];
    if (!data) return;

    selectedCard = card;
    selectedCard.style.setProperty("--detail-yaw", "-5deg");
    selectedCard.style.setProperty("--detail-pitch", "0deg");
    selectedCard.dataset.orbiting = "false";
    detailTitle.textContent = data.title;
    detailDescription.textContent = data.description;
    detailSteps.replaceChildren.apply(detailSteps, data.steps.map(function (step) {
      var item = document.createElement("li");
      var copy = document.createElement("span");
      var title = document.createElement("strong");
      var bodyCopy = document.createElement("span");
      copy.className = "doc-step-copy";
      title.textContent = step.title;
      bodyCopy.textContent = step.body;
      copy.append(title, bodyCopy);
      item.append(copy);
      return item;
    }));
    detailPrompt.textContent = data.prompt;
    detailReview.textContent = data.review;
    detailSource.textContent = data.source;
    detailScroll.scrollTop = 0;
    detailYear.textContent = data.year;
    cards.forEach(function (item) { item.classList.toggle("selected", item === card); });
    cards.forEach(function (item) { item.tabIndex = -1; });
    body.dataset.mode = "detail";
    detailPanel.setAttribute("aria-hidden", "false");
    detailPanel.setAttribute("aria-label", data.title + " 手册详情");
    detailPanel.inert = false;
    closeButton.tabIndex = 0;
    saveButton.setAttribute("aria-pressed", "false");
    window.setTimeout(function () {
      closeButton.focus({ preventScroll: true });
    }, reducedMotion.matches ? 0 : 700);
  }

  function closeDetail() {
    if (body.dataset.mode !== "detail") return;
    body.dataset.mode = "gallery";
    detailPanel.setAttribute("aria-hidden", "true");
    detailPanel.inert = true;
    closeButton.tabIndex = -1;
    var lastCard = selectedCard;
    if (lastCard) {
      lastCard.style.setProperty("--detail-yaw", "-5deg");
      lastCard.style.setProperty("--detail-pitch", "0deg");
      lastCard.dataset.orbiting = "false";
    }
    window.setTimeout(function () {
      cards.forEach(function (card) { card.classList.remove("selected"); });
      cards.forEach(function (card) { card.tabIndex = 0; });
      selectedCard = null;
      if (lastCard) lastCard.focus({ preventScroll: true });
    }, reducedMotion.matches ? 0 : 700);
  }

  function toggleMenu(force) {
    var willOpen = typeof force === "boolean" ? force : body.dataset.menu !== "open";
    body.dataset.menu = willOpen ? "open" : "closed";
    menuLayer.inert = !willOpen;
    menuButton.setAttribute("aria-expanded", String(willOpen));
    menuButton.setAttribute("aria-label", willOpen ? "关闭菜单" : "打开菜单");
    window.setTimeout(function () {
      if (willOpen) {
        var firstLink = menuLayer.querySelector(".menu-link");
        if (firstLink) firstLink.focus({ preventScroll: true });
      } else {
        menuButton.focus({ preventScroll: true });
      }
    }, reducedMotion.matches ? 0 : 220);
  }

  cards.forEach(function (card) {
    card.addEventListener("click", function () { selectBook(card); });
    card.addEventListener("pointerenter", function () { card.dataset.hovered = "true"; });
    card.addEventListener("pointerleave", function () { card.dataset.hovered = "false"; });
  });

  window.addEventListener("pointermove", function (event) {
    pointerX = event.clientX / window.innerWidth - .5;
    pointerY = event.clientY / window.innerHeight - .5;
    pointerClientX = event.clientX;
    pointerClientY = event.clientY;
    if (!frame) frame = window.requestAnimationFrame(updateParallax);
  }, { passive: true });

  window.addEventListener("pointerleave", function () {
    pointerX = 0;
    pointerY = 0;
    pointerClientX = -10000;
    pointerClientY = -10000;
    if (!frame) frame = window.requestAnimationFrame(updateParallax);
  });

  closeButton.addEventListener("click", closeDetail);
  menuButton.addEventListener("click", function () { toggleMenu(); });

  saveButton.addEventListener("click", function () {
    var saved = saveButton.getAttribute("aria-pressed") !== "true";
    saveButton.setAttribute("aria-pressed", String(saved));
    showToast(saved ? "已加入你的书单。" : "已从书单移除。");
  });

  document.addEventListener("click", function (event) {
    var toastTarget = event.target.closest("[data-toast]");
    if (toastTarget) {
      event.preventDefault();
      showToast(toastTarget.dataset.toast);
    }
    if (event.target.closest("[data-menu-close]")) {
      toggleMenu(false);
    }
    var gotoTarget = event.target.closest("[data-goto]");
    if (gotoTarget) {
      event.preventDefault();
      if (body.dataset.mode === "detail") closeDetail();
      var el = document.querySelector(gotoTarget.dataset.goto);
      if (el) el.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      if (body.dataset.menu === "open") toggleMenu(false);
      else closeDetail();
      return;
    }
    if (event.key === "Tab") {
      if (body.dataset.mode === "detail") trapFocus(detailPanel, event);
      else if (body.dataset.menu === "open") trapFocus(menuLayer, event);
    }
  });

  /* ---------- 下方区块滚动揭示 ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
  if (!("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: .14, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 年份 ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
