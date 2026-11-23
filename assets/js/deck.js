/* ==========================================================================
   Motor da apresentação (sem dependências).
   - body[data-mode="audience"]  -> rota pública (/), só os slides principais
   - body[data-mode="presenter"] -> rota do apresentador (/apresentador/):
       carrega os slides de index.html, acrescenta o apêndice, mostra o
       roteiro de fala, cronômetro, próximo slide e sincroniza a janela do
       público via BroadcastChannel.
   ========================================================================== */
(async function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const MODE = document.body.dataset.mode || "audience";
  const PRESENTER = MODE === "presenter";
  const WORK_TITLE = "Orquestração de um Pipeline End-to-End de Dados Geoespaciais sobre Unidades de Conservação em Santa Catarina";
  const SECTION_NAMES = { Problema: "Contexto e problema", Produto: "Produto desenvolvido", Resultados: "Resultados", "Conclusão": "Conclusão" };

  const viewport = $("#viewport");

  /* ----------------------------------------------------------- carregar */
  if (PRESENTER) {
    try {
      const html = await (await fetch("index.html", { cache: "no-store" })).text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const first = viewport.firstElementChild;
      $$("#viewport > section.slide", doc).forEach((s) => viewport.insertBefore(document.importNode(s, true), first));
    } catch (e) {
      viewport.insertAdjacentHTML("afterbegin", '<section class="slide" data-title="Erro"><div class="kicker">Erro</div><h1 class="s-title">Não foi possível carregar index.html. Sirva a pasta por HTTP.</h1></section>');
    }
  }

  const sections = $$(":scope > section.slide", viewport);
  let mainCount = 0, apxCount = 0;
  const slides = sections.map((sec, i) => {
    const apx = sec.hasAttribute("data-appendix");
    const label = apx ? "A" + ++apxCount : String(++mainCount);
    return { sec, i, apx, label, title: sec.dataset.title || "", section: sec.dataset.section || "", bare: sec.hasAttribute("data-bare") };
  });
  const MAIN = mainCount;
  const pad = (n) => String(n).padStart(2, "0");
  const ICON_TOC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>';
  const ICON_ZOOM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>';

  /* ------------------------------------------------- master de cada slide */
  slides.forEach((s) => {
    const frame = document.createElement("div");
    frame.className = "frame";
    frame.dataset.label = s.label;
    viewport.appendChild(frame);
    frame.appendChild(s.sec);
    s.frame = frame;
    if (s.bare) return;

    const body = document.createElement("div");
    body.className = "s-body";
    while (s.sec.firstChild) body.appendChild(s.sec.firstChild);

    const num = s.apx ? s.label : pad(s.label) + " / " + pad(MAIN);
    const isToc = s.sec.hasAttribute("data-toc");
    const head = document.createElement("div");
    head.className = "s-head";
    head.innerHTML =
      '<div class="mark"><div class="logo"><img src="assets/img/univali-logo.png" alt="UNIVALI"></div><span>Escola Politécnica · Ciência da Computação</span></div>' +
      '<div class="right"><span class="sec">' + (SECTION_NAMES[s.section] || s.section) + "</span>" +
      (isToc ? "" : '<button class="toc-btn" data-goto="2" aria-label="Ir ao sumário">' + ICON_TOC + "Sumário</button>") +
      '<span class="pg">' + num + "</span></div>";

    const foot = document.createElement("div");
    foot.className = "s-foot";
    const pct = s.apx ? 100 : (Number(s.label) / MAIN) * 100;
    foot.innerHTML = '<span class="bar" style="width:' + pct + '%"></span><span>' + WORK_TITLE + "</span><b>" + (s.apx ? s.label : s.label + " / " + MAIN) + "</b>";

    s.sec.append(head, body, foot);
  });

  /* figuras: selo "ampliar" */
  $$(".fig .imgbox").forEach((box) => {
    box.setAttribute("role", "button");
    box.setAttribute("tabindex", "0");
    box.setAttribute("aria-label", "Ampliar figura em tela cheia");
    box.insertAdjacentHTML("beforeend", '<span class="zoom-badge">' + ICON_ZOOM + "Ampliar</span>");
  });

  /* sumário clicável */
  const tocGrid = $("#tocGrid");
  if (tocGrid) {
    const groups = {};
    slides.filter((s) => !s.apx && s.section !== "Abertura").forEach((s) => (groups[s.section] = groups[s.section] || []).push(s));
    tocGrid.innerHTML = Object.keys(groups).map((g, gi) =>
      '<div class="grp"><h3>' + (gi + 1) + ". " + (SECTION_NAMES[g] || g) + '</h3>' +
      groups[g].map((s) => '<button class="it" data-goto="' + s.label + '"><span>' + pad(s.label) + "</span>" + s.title + "</button>").join("") +
      "</div>").join("");
  }

  /* ----------------------------------------------------------- escala */
  function fit() {
    const r = viewport.getBoundingClientRect();
    const sc = Math.max(0.05, Math.min(r.width / 1920, r.height / 1080));
    viewport.style.setProperty("--s", sc);
  }
  new ResizeObserver(fit).observe(viewport);
  fit();

  /* ----------------------------------------------------------- navegação */
  let cur = -1;
  const counter = $("#counter"), progress = $("#progress");
  const btnPrev = $("#btnPrev"), btnNext = $("#btnNext");
  const lastIdx = PRESENTER ? slides.length - 1 : MAIN - 1;
  const chan = "BroadcastChannel" in window ? new BroadcastChannel("tcc3-defesa-deck") : null;

  function idxOf(label) {
    const l = String(label).toUpperCase();
    const i = slides.findIndex((s) => s.label.toUpperCase() === l);
    return i;
  }

  function go(i, opts = {}) {
    i = Math.max(0, Math.min(lastIdx, i));
    if (i === cur && !opts.force) return;
    if (cur >= 0) slides[cur].frame.classList.remove("is-active");
    cur = i;
    const s = slides[i];
    s.frame.classList.add("is-active");
    counter.textContent = s.apx ? s.label + " · apoio" : pad(s.label) + " / " + pad(MAIN);
    progress.style.width = (s.apx ? 100 : (Number(s.label) / MAIN) * 100) + "%";
    btnPrev.disabled = i === 0;
    btnNext.disabled = i === lastIdx;
    history.replaceState(null, "", location.pathname + location.search + "#/" + s.label);
    document.title = (PRESENTER ? "[Apresentador] " : "") + (s.apx ? s.label : s.label + "/" + MAIN) + " · " + s.title + " · Defesa TCC III";
    $$("#drawerNav a.item").forEach((a) => a.classList.toggle("active", a.dataset.label === s.label));
    $$("#overviewGrid .thumb").forEach((t) => t.classList.toggle("active", t.dataset.label === s.label));
    if (PRESENTER) renderPresenter();
    if (chan && !opts.remote) chan.postMessage({ type: "goto", label: s.label, from: MODE });
  }
  const next = () => go(cur + 1);
  const prev = () => go(cur - 1);
  function gotoLabel(label) {
    const i = idxOf(label);
    if (i >= 0) { go(i); closeAll(); }
  }

  btnPrev.addEventListener("click", prev);
  btnNext.addEventListener("click", next);

  /* ----------------------------------------------------------- menu */
  const drawer = $("#drawer"), scrim = $("#scrim");
  const nav = $("#drawerNav");
  {
    let html = "", lastSec = null;
    slides.forEach((s) => {
      if (s.section !== lastSec) {
        html += "<h4>" + (s.apx ? "Slides de apoio" : SECTION_NAMES[s.section] || s.section) + "</h4>";
        lastSec = s.section;
      }
      const t = PRESENTER && window.ROTEIRO && !s.apx && window.ROTEIRO[Number(s.label) - 1] ? fmt(window.ROTEIRO[Number(s.label) - 1].time) : "";
      html += '<a class="item" href="#/' + s.label + '" data-label="' + s.label + '"><span class="n">' + (s.apx ? s.label : pad(s.label)) + "</span><span>" + s.title + '</span><span class="t">' + t + "</span></a>";
    });
    nav.innerHTML = html;
  }
  nav.addEventListener("click", (e) => {
    const a = e.target.closest("a.item");
    if (!a) return;
    e.preventDefault();
    gotoLabel(a.dataset.label);
  });
  function openMenu() { drawer.classList.add("open"); scrim.classList.add("open"); const a = $("#drawerNav a.active"); if (a) a.scrollIntoView({ block: "center" }); }
  function closeMenu() { drawer.classList.remove("open"); scrim.classList.remove("open"); }
  $("#btnMenu").addEventListener("click", () => (drawer.classList.contains("open") ? closeMenu() : openMenu()));
  $("#btnCloseMenu").addEventListener("click", closeMenu);
  scrim.addEventListener("click", closeMenu);

  /* ----------------------------------------------------------- visão geral */
  const overview = $("#overview"), ovGrid = $("#overviewGrid"), btnGrid = $("#btnGrid");
  let ovBuilt = false;
  function cloneFrame(frame) {
    const c = frame.cloneNode(true);
    c.classList.remove("is-active");
    c.removeAttribute("id");
    $$("[id]", c).forEach((n) => n.removeAttribute("id"));
    $$("button, a, [tabindex]", c).forEach((n) => n.setAttribute("tabindex", "-1"));
    return c;
  }
  function buildOverview() {
    let html = "", lastSec = null;
    const frag = document.createDocumentFragment();
    slides.forEach((s) => {
      if (s.section !== lastSec) {
        const h = document.createElement("h3");
        h.textContent = s.apx ? "Slides de apoio" : SECTION_NAMES[s.section] || s.section;
        frag.appendChild(h);
        lastSec = s.section;
      }
      const b = document.createElement("button");
      b.className = "thumb";
      b.dataset.label = s.label;
      b.innerHTML = '<div class="mini"></div><div class="cap"><span>' + (s.apx ? s.label : pad(s.label)) + "</span>" + s.title + "</div>";
      b.firstChild.appendChild(cloneFrame(s.frame));
      b.addEventListener("click", () => gotoLabel(s.label));
      frag.appendChild(b);
    });
    ovGrid.appendChild(frag);
    ovBuilt = true;
  }
  function scaleThumbs() {
    $$("#overviewGrid .mini").forEach((m) => m.style.setProperty("--ts", m.clientWidth / 1920));
  }
  function toggleOverview(force) {
    const open = force !== undefined ? force : !overview.classList.contains("open");
    if (open && !ovBuilt) buildOverview();
    overview.classList.toggle("open", open);
    btnGrid.setAttribute("aria-pressed", open);
    if (open) {
      requestAnimationFrame(() => {
        scaleThumbs();
        $$("#overviewGrid .thumb").forEach((t) => t.classList.toggle("active", t.dataset.label === slides[cur].label));
        const a = $("#overviewGrid .thumb.active"); if (a) a.scrollIntoView({ block: "center" });
      });
    }
  }
  btnGrid.addEventListener("click", () => toggleOverview());
  window.addEventListener("resize", () => overview.classList.contains("open") && scaleThumbs());

  /* ----------------------------------------------------------- lightbox */
  const lb = $("#lightbox"), lbImg = $("#lbImg"), lbCanvas = $("#lbCanvas");
  let z = 1, x = 0, y = 0, lastFocus = null;
  function applyZoom() {
    if (z <= 1) { z = 1; x = 0; y = 0; }
    lbImg.style.setProperty("--z", z);
    lbImg.style.setProperty("--x", x + "px");
    lbImg.style.setProperty("--y", y + "px");
    lbCanvas.classList.toggle("zoomed", z > 1);
  }
  function openLightbox(src, cap) {
    lastFocus = document.activeElement;
    lbImg.src = src;
    lbImg.alt = cap || "";
    $("#lbCap").textContent = cap || "";
    $("#lbOpen").href = src;
    z = 1; applyZoom();
    lb.classList.add("open");
    $("#lbClose").focus();
  }
  function closeLightbox() {
    lb.classList.remove("open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  const zoomBy = (f) => { z = Math.max(1, Math.min(8, z * f)); applyZoom(); };
  $("#lbClose").addEventListener("click", closeLightbox);
  $("#lbIn").addEventListener("click", () => zoomBy(1.4));
  $("#lbOut").addEventListener("click", () => zoomBy(1 / 1.4));
  $("#lbReset").addEventListener("click", () => { z = 1; applyZoom(); });
  lbCanvas.addEventListener("wheel", (e) => { e.preventDefault(); zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15); }, { passive: false });
  lbCanvas.addEventListener("dblclick", () => { z = z > 1 ? 1 : 2.5; applyZoom(); });
  let drag = null, moved = false;
  lbCanvas.addEventListener("pointerdown", (e) => {
    moved = false;
    if (z <= 1) return;
    drag = { sx: e.clientX, sy: e.clientY, x, y };
    lbCanvas.setPointerCapture(e.pointerId);
    lbCanvas.classList.add("dragging");
  });
  lbCanvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    x = drag.x + dx; y = drag.y + dy; applyZoom();
  });
  lbCanvas.addEventListener("pointerup", () => { drag = null; lbCanvas.classList.remove("dragging"); });
  lbCanvas.addEventListener("click", (e) => {
    if (moved) return;
    if (e.target === lbCanvas && z === 1) closeLightbox();
  });

  /* ----------------------------------------------------------- cliques delegados */
  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-goto]");
    if (g && !g.closest(".thumb")) { e.preventDefault(); gotoLabel(g.dataset.goto); return; }
    const zb = e.target.closest("[data-zoom]");
    if (zb) { openLightbox(zb.dataset.zoom, zb.dataset.caption); return; }
    const box = e.target.closest(".fig .imgbox");
    if (box && !box.closest(".thumb")) {
      const img = $("img", box), cap = box.parentElement.querySelector("figcaption");
      openLightbox(img.getAttribute("src"), cap ? cap.textContent.trim() : img.alt);
    }
  });

  /* ----------------------------------------------------------- ajuda */
  const help = $("#help");
  $("#btnHelp").addEventListener("click", () => help.classList.toggle("open"));
  help.addEventListener("click", (e) => e.target === help && help.classList.remove("open"));

  /* ----------------------------------------------------------- tela cheia */
  const btnFull = $("#btnFull");
  function toggleFull() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  }
  btnFull.addEventListener("click", toggleFull);
  document.addEventListener("fullscreenchange", () => {
    document.body.classList.toggle("is-fullscreen", !!document.fullscreenElement && !PRESENTER);
    $(".lbl", btnFull) && ($(".lbl", btnFull).textContent = document.fullscreenElement ? "Sair" : "Apresentar");
    setTimeout(fit, 50);
  });
  let pillTimer;
  document.addEventListener("mousemove", () => {
    if (!document.body.classList.contains("is-fullscreen")) return;
    document.body.classList.add("show-pill");
    clearTimeout(pillTimer);
    pillTimer = setTimeout(() => document.body.classList.remove("show-pill"), 1800);
  });

  /* ----------------------------------------------------------- impressão */
  const btnPrint = $("#btnPrint");
  if (btnPrint) btnPrint.addEventListener("click", () => window.print());

  /* ----------------------------------------------------------- teclado */
  function closeAll() {
    closeMenu();
    toggleOverview(false);
    help.classList.remove("open");
  }
  let typed = "", typedTimer;
  document.addEventListener("keydown", (e) => {
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (lb.classList.contains("open")) {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "+" || e.key === "=") zoomBy(1.4);
      else if (e.key === "-") zoomBy(1 / 1.4);
      else if (e.key === "0") { z = 1; applyZoom(); }
      e.preventDefault();
      return;
    }
    if (e.key === "Escape") {
      if (help.classList.contains("open") || drawer.classList.contains("open") || overview.classList.contains("open")) closeAll();
      return;
    }
    if (/^[0-9]$/.test(e.key) || (PRESENTER && !typed && /^[aA]$/.test(e.key))) {
      typed += e.key.toUpperCase();
      clearTimeout(typedTimer);
      typedTimer = setTimeout(() => (typed = ""), 1500);
      return;
    }
    if (e.key === "Enter" && typed) { gotoLabel(typed); typed = ""; e.preventDefault(); return; }

    switch (e.key) {
      case "ArrowRight": case "PageDown": case " ": case "ArrowDown": e.preventDefault(); next(); break;
      case "ArrowLeft": case "PageUp": case "ArrowUp": e.preventDefault(); prev(); break;
      case "Home": e.preventDefault(); go(0); break;
      case "End": e.preventDefault(); go(MAIN - 1); break;
      case "s": case "S": gotoLabel("2"); break;
      case "m": case "M": drawer.classList.contains("open") ? closeMenu() : openMenu(); break;
      case "g": case "G": toggleOverview(); break;
      case "f": case "F": toggleFull(); break;
      case "?": help.classList.toggle("open"); break;
      case "t": case "T": if (PRESENTER) toggleTimer(); break;
      case "o": case "O": if (PRESENTER) openAudience(); break;
    }
  });

  /* ----------------------------------------------------------- toque */
  let touch = null;
  $("#stage").addEventListener("touchstart", (e) => { if (e.touches.length === 1) touch = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: true });
  $("#stage").addEventListener("touchend", (e) => {
    if (!touch || overview.classList.contains("open")) return;
    const dx = e.changedTouches[0].clientX - touch.x, dy = e.changedTouches[0].clientY - touch.y;
    if (Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? next : prev)();
    touch = null;
  });

  /* ----------------------------------------------------------- sincronização */
  if (chan) {
    chan.onmessage = (ev) => {
      const m = ev.data || {};
      if (m.from === MODE) return;
      if (m.type === "goto") {
        const i = idxOf(m.label);
        if (i >= 0) go(i, { remote: true });
      } else if (m.type === "hello" && PRESENTER) {
        setSync(true);
        chan.postMessage({ type: "goto", label: slides[cur].label, from: MODE });
      } else if (m.type === "hello-presenter" && !PRESENTER) {
        chan.postMessage({ type: "hello", from: MODE });
      }
    };
  }

  /* ----------------------------------------------------------- apresentador */
  function fmt(sec) {
    sec = Math.max(0, Math.round(sec));
    return pad(Math.floor(sec / 60)) + ":" + pad(sec % 60);
  }
  let timerStart = null, timerAcc = 0, timerTick = null;
  const elapsed = () => timerAcc + (timerStart ? (Date.now() - timerStart) / 1000 : 0);
  function toggleTimer() {
    if (timerStart) { timerAcc = elapsed(); timerStart = null; clearInterval(timerTick); }
    else { timerStart = Date.now(); timerTick = setInterval(renderClock, 500); }
    renderClock();
  }
  function renderClock() {
    const clock = $("#clock");
    if (!clock) return;
    const R = window.ROTEIRO || [];
    const total = R.reduce((a, r) => a + r.time, 0);
    const s = slides[cur];
    const upTo = s && !s.apx ? R.slice(0, Number(s.label)).reduce((a, r) => a + r.time, 0) : total;
    const el = elapsed();
    clock.textContent = fmt(el);
    clock.classList.toggle("over", el > 25 * 60);
    clock.classList.toggle("warn", el <= 25 * 60 && el > upTo + 30);
    $("#btnTimer").textContent = timerStart ? "Pausar" : el ? "Retomar" : "Iniciar";
    const diff = el - upTo;
    $("#budget").innerHTML = "Planejado até o fim deste slide: <b>" + fmt(upTo) + "</b> · total " + fmt(total) + " de 25:00" +
      (el ? " · " + (diff > 0 ? '<b style="color:var(--red)">+' + fmt(diff) + " atrasado</b>" : '<b style="color:var(--green)">' + fmt(-diff) + " de folga</b>") : "");
  }
  function setSync(on) {
    const el = $("#syncState");
    if (!el) return;
    el.textContent = on ? "Tela do público conectada" : "Tela do público não aberta";
    el.classList.toggle("on", on);
  }
  let audienceWin = null;
  function openAudience() {
    audienceWin = window.open("index.html#/" + (slides[cur].apx ? MAIN : slides[cur].label), "tcc3-publico");
  }
  function renderPresenter() {
    const s = slides[cur];
    const body = $("#notesBody");
    if (!body) return;
    let notes = [], time = null;
    if (!s.apx && window.ROTEIRO) { const r = window.ROTEIRO[Number(s.label) - 1]; if (r) { notes = r.notes; time = r.time; } }
    if (s.apx && window.ROTEIRO_APENDICE) notes = window.ROTEIRO_APENDICE[Number(s.label.slice(1)) - 1] || [];
    const words = notes.join(" ").split(/\s+/).filter(Boolean).length;
    body.innerHTML =
      "<h3 style=\"margin:0 0 10px;font-size:20px;color:var(--navy)\">" + (s.apx ? s.label : pad(s.label)) + " · " + s.title + "</h3>" +
      notes.map((p) => "<p>" + p + "</p>").join("") +
      '<p class="words">' + words + " palavras · cerca de " + fmt((words / 110) * 60) + " de fala" + (time ? " · tempo do slide " + fmt(time) : "") + "</p>" +
      (s.apx ? '<p class="words">Slide de apoio: não aparece na tela do público.</p>' : "");
    const n = slides[cur + 1];
    const nextBox = $("#nextBox");
    if (nextBox) {
      nextBox.innerHTML = n
        ? '<div class="mini"></div><div><small>Próximo</small><b>' + (n.apx ? n.label : pad(n.label)) + " · " + n.title + "</b></div>"
        : "<div></div><div><small>Próximo</small><b>Fim</b></div>";
      if (n) $(".mini", nextBox).appendChild(cloneFrame(n.frame));
    }
    renderClock();
  }
  if (PRESENTER) {
    $("#btnTimer").addEventListener("click", toggleTimer);
    $("#btnTimerReset").addEventListener("click", () => { timerAcc = 0; if (timerStart) timerStart = Date.now(); renderClock(); });
    $("#btnAudience").addEventListener("click", openAudience);
    setSync(false);
    if (chan) chan.postMessage({ type: "hello-presenter", from: MODE });
  } else if (chan) {
    chan.postMessage({ type: "hello", from: MODE });
  }

  /* ----------------------------------------------------------- início */
  function fromUrl() {
    const m = location.hash.match(/^#\/?([Aa]?\d+)/);
    const q = new URLSearchParams(location.search).get("s");
    const i = m ? idxOf(m[1]) : q ? idxOf(q) : 0;
    return i >= 0 && i <= lastIdx ? i : 0;
  }
  go(fromUrl(), { force: true, remote: !PRESENTER });
  window.addEventListener("hashchange", () => { closeAll(); go(fromUrl()); });
})();
