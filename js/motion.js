/* =========================================================
   PANCHAL GASES — motion engine
   Everything here is an enhancement layered on a page that
   already reads perfectly without it. If JS fails, if the
   visitor asks for reduced motion, or if a browser is old,
   the page stays plain, still and fully legible.
   ========================================================= */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var raf = window.requestAnimationFrame.bind(window);
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  /* =========================================================
     1. PRELOADER — the firm's seal draws itself in, then the
        page is handed over.
     ========================================================= */
  var boot = document.getElementById("boot");

  function finishBoot() {
    if (!boot || boot.classList.contains("done")) return;
    boot.classList.add("done");
    document.body.style.removeProperty("overflow");
    startHero();
    setTimeout(function () { if (boot.parentNode) boot.parentNode.removeChild(boot); }, 900);
  }

  function runBoot() {
    if (!boot) { startHero(); return; }
    if (reduced) { finishBoot(); return; }

    document.body.style.overflow = "hidden";
    var ring = document.getElementById("bootRing");
    var fill = document.getElementById("bootFill");
    var start = null;
    var DUR = 900;

    function frame(t) {
      if (start === null) start = t;
      var p = clamp((t - start) / DUR, 0, 1);
      var e = p === 1 ? 1 : 1 - Math.pow(2, -9 * p);   // fast, then settles
      if (ring) ring.setAttribute("stroke-dashoffset", String(100 - e * 100));
      if (fill) fill.style.transform = "scaleX(" + e.toFixed(3) + ")";
      if (p < 1) raf(frame); else setTimeout(finishBoot, 200);
    }
    raf(frame);
  }

  /* =========================================================
     2. LINE SPLITTING — wrap each visual line of a heading in
        its own overflow-hidden mask so it can slide up from
        under the line above. Measured after fonts settle so
        the masks land on real line boxes, not guessed ones.
     ========================================================= */
  function splitToLines(el) {
    if (el.dataset.splitDone) return;
    var text = el.textContent.replace(/\s+/g, " ").trim();
    if (!text) return;

    var words = text.split(" ");
    el.textContent = "";
    var probes = words.map(function (w, i) {
      var s = document.createElement("span");
      s.className = "w";
      s.style.display = "inline-block";
      s.textContent = w;
      el.appendChild(s);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
      return s;
    });

    // group probes by their vertical position = one visual line
    var lines = [];
    var lastTop = null;
    probes.forEach(function (s) {
      var top = s.offsetTop;
      if (lastTop === null || Math.abs(top - lastTop) > 3) { lines.push([]); lastTop = top; }
      lines[lines.length - 1].push(s.textContent);
    });

    el.textContent = "";
    lines.forEach(function (words, i) {
      var mask = document.createElement("span");
      mask.className = "line";
      var inner = document.createElement("span");
      inner.textContent = words.join(" ");
      inner.style.setProperty("--d", i * 90 + "ms");
      mask.appendChild(inner);
      el.appendChild(mask);
    });
    el.classList.add("reveal-line");
    el.dataset.splitDone = "1";
  }

  function splitAll() {
    document.querySelectorAll("[data-split]").forEach(splitToLines);
  }

  /* =========================================================
     3. REVEALS — driven from the scroll loop rather than an
        IntersectionObserver.

        IO looks like the right tool here, and it isn't: it only
        fires when the intersection ratio *crosses* a threshold.
        Jump straight from the top of the page to the bottom and
        an element goes from 0% to 0% visible without ever
        crossing anything, so no callback is ever delivered and
        the element stays hidden for good. With .plate hiding its
        content behind clip-path, that meant the five product
        photos could vanish permanently after one fast flick.

        A rect check per scroll frame is cheap — the list only
        ever shrinks — and it cannot miss.
     ========================================================= */
  var pendingReveals = [];
  var pendingCounts = [];

  function collectReveals() {
    pendingReveals = Array.prototype.slice.call(
      document.querySelectorAll(".rise, .reveal-line, .plate")
    );
    pendingCounts = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
    if (reduced) {
      pendingCounts.forEach(function (el) { el.textContent = el.dataset.count; });
      pendingCounts = [];
    }
  }

  function sweepReveals() {
    var vh = window.innerHeight;
    var trigger = vh * 0.92; // fires as the top edge rises past 92% of the viewport

    for (var i = pendingReveals.length - 1; i >= 0; i--) {
      var el = pendingReveals[i];
      // top is negative once an element is above the fold, so this single
      // comparison covers both "entering from below" and "already scrolled past"
      if (el.getBoundingClientRect().top < trigger) {
        if (el.dataset.d) el.style.setProperty("--d", el.dataset.d + "ms");
        el.classList.add("in");
        pendingReveals.splice(i, 1);
      }
    }

    for (var j = pendingCounts.length - 1; j >= 0; j--) {
      var c = pendingCounts[j];
      if (c.getBoundingClientRect().top < vh * 0.85) {
        runCount(c);
        pendingCounts.splice(j, 1);
      }
    }
  }

  function runCount(el) {
    var to = parseInt(el.dataset.count, 10) || 0, t0 = null;
    (function tick(t) {
      if (t0 === null) t0 = t;
      var p = clamp((t - t0) / 900, 0, 1);
      el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * to);
      if (p < 1) raf(tick);
    })(performance.now());
  }

  /* the hero doesn't wait to be scrolled into — it's already there,
     so it plays as a sequence the moment the loader clears */
  function startHero() {
    var heroBits = Array.prototype.slice.call(document.querySelectorAll("#hero .rise"));
    pendingReveals = pendingReveals.filter(function (el) { return heroBits.indexOf(el) === -1; });
    var h = document.getElementById("heroH");
    if (h) {
      h.querySelectorAll(".line > span").forEach(function (s, i) {
        s.style.setProperty("--d", 90 + i * 110 + "ms");
      });
      h.classList.add("in");
    }
    document.querySelectorAll("#hero .rise").forEach(function (el) {
      if (el.dataset.d) el.style.setProperty("--d", (parseInt(el.dataset.d, 10) + 260) + "ms");
      el.classList.add("in");
    });
  }

  /* =========================================================
     5. SCROLL FRACTION — used by nothing visual now that the
        scroll indicator is gone, kept because the header and nav
        highlighting both read scroll position.
     ========================================================= */
  function scrollFraction() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
  }

  /* =========================================================
     6. SMOOTH SCROLL — eases the real scroll position rather
        than transforming the page, so position:fixed, sticky,
        anchors, find-in-page and screen readers all keep
        working exactly as they normally would. Touch keeps
        native scrolling untouched.
     ========================================================= */
  var target = window.scrollY, current = window.scrollY, smoothing = false;

  function nativeScrollable(node) {
    while (node && node !== document.body && node !== document.documentElement) {
      if (node.scrollHeight > node.clientHeight + 2) {
        var oy = getComputedStyle(node).overflowY;
        if (oy === "auto" || oy === "scroll") return true;
      }
      node = node.parentElement;
    }
    return false;
  }

  function initSmooth() {
    if (reduced || !finePointer) return;

    window.addEventListener("wheel", function (e) {
      if (e.ctrlKey) return;                       // pinch zoom
      if (nativeScrollable(e.target)) return;      // dropdowns, the register's own x-scroll
      e.preventDefault();
      var max = document.documentElement.scrollHeight - window.innerHeight;
      target = clamp(target + e.deltaY, 0, max);
      smoothing = true;
    }, { passive: false });

    // anything that moves scroll by other means re-syncs the target
    window.addEventListener("scroll", function () {
      if (!smoothing) { target = window.scrollY; current = window.scrollY; }
    }, { passive: true });

    window.addEventListener("resize", function () { target = window.scrollY; current = window.scrollY; }, { passive: true });

    (function loop() {
      raf(loop);
      if (!smoothing) return;
      current = lerp(current, target, 0.11);
      if (Math.abs(target - current) < 0.4) { current = target; smoothing = false; }
      window.scrollTo(0, current);
    })();
  }

  /* anchor links glide instead of jumping */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href").slice(1);
    if (!id) return;
    var el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    var y = el.getBoundingClientRect().top + window.scrollY - (id === "hero" ? 0 : 40);
    smoothing = false;
    window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
    target = current = y;
  });

  /* =========================================================
     7. SCROLL-DRIVEN CHROME — sticky header, active nav, reveals
     ========================================================= */
  function initScrollChrome() {
    var top = document.getElementById("top");
    var navLinks = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));
    var sections = navLinks.map(function (a) { return document.getElementById(a.dataset.nav); });
    var pending = false;

    function paint() {
      pending = false;
      var y = window.scrollY;
      if (top) top.classList.toggle("stuck", y > 40);
      sweepReveals();

      var activeIdx = -1;
      for (var i = 0; i < sections.length; i++) {
        var s = sections[i];
        if (s && s.getBoundingClientRect().top <= window.innerHeight * 0.42) activeIdx = i;
      }
      navLinks.forEach(function (a, i) { a.classList.toggle("active", i === activeIdx); });
    }

    window.addEventListener("scroll", function () {
      if (pending) return;
      pending = true;
      raf(paint);
    }, { passive: true });
    window.addEventListener("resize", function () {
      if (pending) return;
      pending = true;
      raf(paint);
    }, { passive: true });
    paint();
  }

  /* =========================================================
     8. TICKER — one strip, duplicated until it's wider than
        the screen, then translated at a constant rate.
     ========================================================= */
  function initTicker() {
    var run = document.getElementById("ticker");
    if (!run || reduced) return;
    var unit = run.firstElementChild;
    if (!unit) return;
    var w = unit.getBoundingClientRect().width;
    if (!w) return;
    var need = Math.ceil((window.innerWidth * 2) / w) + 1;
    for (var i = 0; i < need; i++) run.appendChild(unit.cloneNode(true));

    var x = 0;
    (function tick() {
      raf(tick);
      x -= 0.42;
      if (x <= -w) x += w;
      run.style.transform = "translate3d(" + x.toFixed(2) + "px,0,0)";
    })();
  }

  /* =========================================================
     9. CURSOR — a ring that follows with a little lag, grows
        and labels itself over plates, shrinks over links.
     ========================================================= */
  function initCursor() {
    if (reduced || !finePointer) return;
    var el = document.getElementById("cursor");
    var label = document.getElementById("cursorLabel");
    if (!el) return;

    var mx = window.innerWidth / 2, my = window.innerHeight / 2, cx = mx, cy = my;

    window.addEventListener("pointermove", function (e) {
      mx = e.clientX; my = e.clientY;
      el.classList.add("on");

      var t = e.target;
      var plate = t.closest && t.closest("[data-cursor='view']");
      var tiny = t.closest && t.closest("a, button, .inp, [data-cursor='tiny']");
      if (plate) {
        el.classList.add("grow"); el.classList.remove("tiny");
        if (label) label.textContent = "View";
      } else if (tiny) {
        el.classList.add("tiny"); el.classList.remove("grow");
        if (label) label.textContent = "";
      } else {
        el.classList.remove("grow", "tiny");
        if (label) label.textContent = "";
      }
    }, { passive: true });

    document.addEventListener("pointerleave", function () { el.classList.remove("on"); });

    (function loop() {
      raf(loop);
      cx = lerp(cx, mx, 0.19); cy = lerp(cy, my, 0.19);
      el.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
    })();
  }

  /* =========================================================
     10. MAGNETIC TARGETS — buttons lean toward the cursor as
         it approaches, then spring back when it leaves.
     ========================================================= */
  function initMagnets() {
    if (reduced || !finePointer) return;
    document.querySelectorAll("[data-magnet]").forEach(function (el) {
      var RANGE = 26;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        el.style.transform = "translate3d(" + (dx * RANGE * 0.5).toFixed(1) + "px," + (dy * RANGE * 0.34).toFixed(1) + "px,0)";
        el.style.transition = "transform 120ms linear";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transition = "transform 620ms cubic-bezier(.16,1,.3,1)";
        el.style.transform = "translate3d(0,0,0)";
      });
    });
  }

  /* =========================================================
     BOOT ORDER
     ========================================================= */
  function ready() {
    var go = function () {
      splitAll();
      collectReveals();
      initScrollChrome();
      initSmooth();
      initCursor();
      initMagnets();
      initTicker();
      runBoot();
    };
    // measure line boxes only once the real display face is in
    if (document.fonts && document.fonts.ready) {
      var raced = false;
      var once = function () { if (!raced) { raced = true; go(); } };
      document.fonts.ready.then(once);
      setTimeout(once, 1600); // never let a font stall the page
    } else {
      go();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready);
  } else {
    ready();
  }

  // re-measure line masks if the viewport width changes enough to reflow
  var lastW = window.innerWidth;
  window.addEventListener("resize", function () {
    if (Math.abs(window.innerWidth - lastW) < 60) return;
    lastW = window.innerWidth;
    document.querySelectorAll("[data-split]").forEach(function (el) {
      var t = el.textContent.replace(/\s+/g, " ").trim();
      el.dataset.splitDone = "";
      el.classList.remove("reveal-line", "in");
      el.textContent = t;
      splitToLines(el);
      el.classList.add("in");   // already read — don't replay it
    });
  }, { passive: true });
})();
