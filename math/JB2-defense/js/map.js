/* 時空守護者 — 17 世紀臺灣的時空地圖、關卡面板、側欄 */
(function () {
  const G = window.G, h = G.h;
  const NS = "http://www.w3.org/2000/svg";
  const P = (lon, lat) => [(lon - 118.9) * 330, (25.55 - lat) * 360];
  const TYPE_LABEL = { shoot: "射擊關", match: "配對解謎", sort: "分類快打", timeline: "時空拼圖", sequence: "時空拼圖", siege: "攻城戰", boss: "Boss 戰",
    council: "議事廳", museum: "時空博物館", detective: "時空偵探", voyage: "地圖任務" };
  G.TYPE_LABEL = TYPE_LABEL;

  // 臺灣海岸線（經度, 緯度），順時針
  const COAST = [
    [121.5, 25.29], [121.58, 25.27], [121.66, 25.2], [121.75, 25.15], [121.88, 25.1], [122.0, 25.01], [121.92, 24.95],
    [121.84, 24.86], [121.83, 24.7], [121.87, 24.6], [121.8, 24.4], [121.7, 24.2], [121.62, 24.0], [121.55, 23.75],
    [121.48, 23.5], [121.4, 23.25], [121.3, 23.0], [121.18, 22.8], [121.02, 22.6], [120.92, 22.38], [120.88, 22.1],
    [120.85, 21.9], [120.74, 21.94], [120.7, 22.05], [120.62, 22.3], [120.47, 22.47], [120.3, 22.58], [120.22, 22.78],
    [120.15, 22.98], [120.08, 23.15], [120.13, 23.38], [120.15, 23.55], [120.2, 23.75], [120.32, 23.95], [120.42, 24.08],
    [120.52, 24.25], [120.62, 24.42], [120.78, 24.62], [120.9, 24.8], [121.02, 24.95], [121.18, 25.07], [121.38, 25.16],
    [121.45, 25.25],
  ];

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v);
    if (parent) parent.append(e);
    return e;
  }
  function smoothPath(pts, closed) {
    const n = pts.length;
    const at = (i) => pts[closed ? (i + n) % n : G.clamp(i, 0, n - 1)];
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d + (closed ? "Z" : "");
  }
  function text(parent, x, y, str, size, attrs = {}) {
    const t = el("text", { x, y, "font-size": size, "text-anchor": "middle", "dominant-baseline": "central", ...attrs }, parent);
    t.textContent = str;
    return t;
  }

  function drawBase(svg) {
    // 鏡頭對準中南部與海峽：關卡都在這一帶
    svg.setAttribute("viewBox", "110 290 900 1010");
    svg.innerHTML = `
      <defs>
        <radialGradient id="land" cx="45%" cy="45%" r="70%">
          <stop offset="0%" stop-color="#e9dcae"/><stop offset="70%" stop-color="#cdbb7e"/><stop offset="100%" stop-color="#9f8a4c"/>
        </radialGradient>
        <filter id="dshadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#000" flood-opacity=".45"/></filter>
        <radialGradient id="nodeOn" cx="35%" cy="30%"><stop offset="0%" stop-color="#fff8dc"/><stop offset="60%" stop-color="#f2c14e"/><stop offset="100%" stop-color="#b9821f"/></radialGradient>
        <radialGradient id="nodeBoss" cx="35%" cy="30%"><stop offset="0%" stop-color="#ffd0c8"/><stop offset="60%" stop-color="#d64541"/><stop offset="100%" stop-color="#6e1a17"/></radialGradient>
        <radialGradient id="nodeOff" cx="35%" cy="30%"><stop offset="0%" stop-color="#bdb5a6"/><stop offset="100%" stop-color="#5e574c"/></radialGradient>
      </defs>`;
    // 海浪紋
    const waves = el("g", { opacity: ".35", stroke: "#cfe9ff", "stroke-width": 3, fill: "none", "stroke-linecap": "round" }, svg);
    for (let i = 0; i < 26; i++) {
      const x = 40 + ((i * 397) % 1080), y = 60 + ((i * 263) % 1280);
      el("path", { d: `M${x},${y} q14,-12 28,0 t28,0` }, waves);
    }
    // 澎湖
    const peng = el("g", { filter: "url(#dshadow)" }, svg);
    [[119.58, 23.58, 22, 14], [119.53, 23.65, 12, 8], [119.62, 23.48, 10, 7], [119.45, 23.55, 8, 6]].forEach(([lo, la, rx, ry]) => {
      const [x, y] = P(lo, la);
      el("ellipse", { cx: x, cy: y, rx, ry, fill: "url(#land)", stroke: "#6b5428", "stroke-width": 3 }, peng);
    });
    { const [x, y] = P(119.56, 23.75); text(svg, x, y, "澎湖", 26, { fill: "#fff", "font-weight": 900, opacity: .85 }); }
    // 本島
    const pts = COAST.map(([lo, la]) => P(lo, la));
    const d = smoothPath(pts, true);
    el("path", { d, fill: "#0e3550", opacity: ".45", transform: "translate(10,16)" }, svg);
    el("path", { d, fill: "url(#land)", stroke: "#5b4520", "stroke-width": 6, "stroke-linejoin": "round", filter: "url(#dshadow)" }, svg);
    el("path", { d, fill: "none", stroke: "#f7efd2", "stroke-width": 2, opacity: ".7", transform: "translate(0,0) scale(1)", "stroke-dasharray": "2 9" }, svg);
    // 中央山脈
    const mt = el("g", {}, svg);
    for (let i = 0; i < 15; i++) {
      const la = 24.55 - i * 0.135, lo = 121.32 - (24.55 - la) * 0.27 + (i % 2 ? 0.07 : -0.03);
      const [x, y] = P(lo, la), s = 26 + (i % 3) * 6;
      el("path", { d: `M${x - s},${y + s * 0.7} L${x},${y - s * 0.8} L${x + s},${y + s * 0.7}Z`, fill: "#7d6a3a", stroke: "#4d3d18", "stroke-width": 3 }, mt);
      el("path", { d: `M${x},${y - s * 0.8} L${x + s},${y + s * 0.7} L${x + s * 0.2},${y + s * 0.7}Z`, fill: "#5c4c26" }, mt);
      el("path", { d: `M${x - s * 0.28},${y - s * 0.38} L${x},${y - s * 0.8} L${x + s * 0.28},${y - s * 0.38}Z`, fill: "#f4f0e2" }, mt);
    }
    // 平原上的鹿與森林
    [[120.42, 23.62, "🦌"], [120.62, 23.95, "🦌"], [120.35, 23.32, "🌾"], [121.2, 24.7, "🌲"], [121.0, 23.2, "🌲"], [120.75, 22.75, "🌲"], [121.55, 24.4, "🌲"]].forEach(([lo, la, ic]) => {
      const [x, y] = P(lo, la);
      text(svg, x, y, ic, 40, { opacity: .85 });
    });
    // 船隊
    const ships = el("g", { class: "ship" }, svg);
    [[119.95, 22.75], [119.8, 23.0]].forEach(([lo, la]) => { const [x, y] = P(lo, la); text(ships, x, y, "⛵", 54); });
    { const [x, y] = P(121.9, 25.32); text(svg, x, y, "🚢", 46, { class: "ship" }); }
    // 羅盤
    const cp = el("g", { transform: "translate(920,1180)", opacity: ".9" }, svg);
    el("circle", { r: 64, fill: "#f6ecd6", stroke: "#7a4b12", "stroke-width": 5 }, cp);
    el("path", { d: "M0,-56 L12,0 L0,56 L-12,0Z", fill: "#b23a3a" }, cp);
    el("path", { d: "M-56,0 L0,12 L56,0 L0,-12Z", fill: "#7a4b12" }, cp);
    text(cp, 0, -80, "N", 30, { "font-weight": 900, fill: "#fff" });
  }

  // 小臺灣圖：博物館說明牌標出文物的位置
  G.miniTaiwan = (pins) => {
    const svg = el("svg", { viewBox: "60 20 1060 1340", class: "mini-tw" });
    el("path", { d: smoothPath(COAST.map(([lo, la]) => P(lo, la)), true), fill: "#e9dcae", stroke: "#5b4520", "stroke-width": 12, "stroke-linejoin": "round" }, svg);
    const [px, py] = P(119.58, 23.58);
    el("ellipse", { cx: px, cy: py, rx: 26, ry: 18, fill: "#e9dcae", stroke: "#5b4520", "stroke-width": 8 }, svg);
    pins.forEach(([lo, la]) => {
      const [x, y] = P(lo, la);
      el("circle", { cx: x, cy: y, r: 70, fill: "#d64541", opacity: ".25" }, svg);
      el("circle", { cx: x, cy: y, r: 34, fill: "#d64541", stroke: "#fff", "stroke-width": 10 }, svg);
    });
    return svg;
  };

  // 關卡按鈕共用的漸層與陰影
  const NODE_DEFS = `
        <filter id="dshadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#000" flood-opacity=".45"/></filter>
        <radialGradient id="nodeOn" cx="35%" cy="30%"><stop offset="0%" stop-color="#fff8dc"/><stop offset="60%" stop-color="#f2c14e"/><stop offset="100%" stop-color="#b9821f"/></radialGradient>
        <radialGradient id="nodeBoss" cx="35%" cy="30%"><stop offset="0%" stop-color="#ffd0c8"/><stop offset="60%" stop-color="#d64541"/><stop offset="100%" stop-color="#6e1a17"/></radialGradient>
        <radialGradient id="nodeOff" cx="35%" cy="30%"><stop offset="0%" stop-color="#bdb5a6"/><stop offset="100%" stop-color="#5e574c"/></radialGradient>
        <radialGradient id="vig" cx="50%" cy="50%" r="75%"><stop offset="60%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".45"/></radialGradient>`;

  // 攻城戰：真實海岸線的作戰地圖，關卡放在各場戰鬥的位置（座標由建置程式算好，1600×900 畫布）
  function drawWar(svg) {
    svg.setAttribute("viewBox", "0 0 1600 900");
    svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    const m = { ...window.MAPS[G.CH.warmap], id: G.CH.warmap };
    const { world } = G.War.drawBase(svg, m, 1600, 900, "cm-");
    const f = G.CH.warFit;
    world.setAttribute("transform", `matrix(${f.s},0,0,${f.s},${f.tx},${f.ty})`);
    // 公民之城、校園：總覽地圖上擺畫好的建築
    for (const b of m.sights || []) G.War.spotImg({ href: `assets/${b.img}.webp`, x: b.x - 44, y: b.y - 62, width: 88, height: 88 }, world);
    // 地理的臺灣圖：標上河流、山脈的名字（歷史章的地圖沒有 ranges，照舊不標）
    if (m.ranges) {
      for (const r of m.rivers.concat(m.ranges).filter((x) => x.name)) {
        const x = r.label[0] * f.s + f.tx, y = r.label[1] * f.s + f.ty;
        if (G.CH.nodes.some((n) => Math.hypot(n.x - x, n.y - y) < 110)) continue; // 會被關卡圖示壓住的名字就不標
        const t = el("text", { x, y, "text-anchor": "middle", "font-size": 22,
          class: m.ranges.includes(r) ? "war-range" : "war-river" }, svg);
        t.textContent = r.name;
      }
    }
    svg.querySelector("defs").insertAdjacentHTML("beforeend", NODE_DEFS);
    // 大航海 DLC 的迷霧：過關的關卡會散開它探索到的區域，全部過關迷霧就消失
    const cleared = G.CH.nodes.filter((n) => G.nodeState(n.id).stars > 0);
    if (G.CH.fog && cleared.length < G.CH.nodes.length) {
      const box = { x: -m.w, y: -m.h, width: m.w * 3, height: m.h * 3 };
      svg.querySelector("defs").insertAdjacentHTML("beforeend",
        '<radialGradient id="cm-hole"><stop offset="55%" stop-color="#000"/><stop offset="100%" stop-color="#000" stop-opacity="0"/></radialGradient>');
      const mask = el("mask", { id: "cm-fog", maskUnits: "userSpaceOnUse", ...box }, svg.querySelector("defs"));
      el("rect", { ...box, fill: "#fff" }, mask);
      const holes = G.CH.fog.concat(...cleared.map((n) => n.reveal || []));
      for (const [lo, la, r] of holes) {
        const [x, y] = G.War.proj(m, lo, la);
        el("circle", { cx: x, cy: y, r: r * m.k, fill: "url(#cm-hole)" }, mask);
      }
      el("rect", { ...box, fill: "#1f2c38", opacity: ".86", mask: "url(#cm-fog)" }, world);
    }
    el("rect", { x: 0, y: 0, width: 1600, height: 900, fill: "url(#vig)" }, svg);
  }

  // 一般章節：科目主題的背景圖，5 個關卡排成 S 形路線（座標由建置程式給，1600×900 畫布）
  function drawGeneric(svg) {
    const pt = innerHeight > innerWidth, box = svg.getBoundingClientRect(), vw = pt ? 900 : 1600, vh = pt ? (box.width ? Math.round(Math.min(1000, 900 * box.height / box.width)) : 1000) : 900;
    svg.setAttribute("viewBox", `0 0 ${vw} ${vh}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    svg.innerHTML = `
      <defs>${NODE_DEFS}
      </defs>
      <image href="assets/${G.CH.bg}.webp" x="0" y="0" width="${vw}" height="${vh}" preserveAspectRatio="xMidYMid slice"/>
      <rect x="0" y="0" width="${vw}" height="${vh}" fill="url(#vig)"/>`;
  }

  G.renderMap = () => {
    const svg = G.$("#map-svg");
    const generic = G.CH.map !== "taiwan";
    G.$("#s-map").classList.toggle("generic", generic);
    if (G.CH.map === "war") drawWar(svg);
    else if (generic) drawGeneric(svg);
    else {
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      drawBase(svg);
    }
    const nodes = G.CH.nodes.map((n, i) => ({ n, i, xy: generic ? (innerHeight > innerWidth ? [i % 2 ? 650 : 250, 130 + i * ((svg.viewBox.baseVal.height - 280) / Math.max(1, G.CH.nodes.length - 1))] : [n.x, n.y]) : P(n.lon, n.lat) }));
    // 路線
    const lit = [], dark = [];
    nodes.forEach((a, i) => {
      if (i === 0) return;
      const b = nodes[i - 1];
      const mx = (a.xy[0] + b.xy[0]) / 2 + (i % 2 ? 60 : -60), my = (a.xy[1] + b.xy[1]) / 2;
      const d = `M${b.xy[0]},${b.xy[1]} Q${mx},${my} ${a.xy[0]},${a.xy[1]}`;
      (G.unlocked(i) ? lit : dark).push(d);
    });
    dark.forEach((d) => el("path", { d, fill: "none", stroke: "#3b2c14", "stroke-width": 8, "stroke-dasharray": "6 14", "stroke-linecap": "round", opacity: ".55" }, svg));
    lit.forEach((d) => {
      el("path", { d, fill: "none", stroke: "#5b3a0a", "stroke-width": 14, "stroke-linecap": "round", opacity: ".5" }, svg);
      el("path", { d, fill: "none", stroke: "#ffd56b", "stroke-width": 8, "stroke-dasharray": "14 14", "stroke-linecap": "round", class: "dash-move" }, svg);
    });
    // 關卡點
    const nextIdx = G.CH.nodes.findIndex((n, i) => G.unlocked(i) && G.nodeState(n.id).stars === 0);
    nodes.forEach(({ n, i, xy: [x, y] }) => {
      const open = G.unlocked(i), st = G.nodeState(n.id), boss = (n.type === "boss" || n.boss);
      const g = el("g", { class: "node" + (open ? "" : " locked") + (i === nextIdx ? " next" : ""), transform: `translate(${x},${y})` }, svg);
      if (i === nextIdx) el("circle", { r: 46, fill: "none", stroke: "#fff4c2", "stroke-width": 6, class: "pulse" }, g);
      el("circle", { r: boss ? 50 : 40, class: "ring", fill: open ? (boss ? "url(#nodeBoss)" : "url(#nodeOn)") : "url(#nodeOff)", stroke: "#3b2508", "stroke-width": 5, filter: "url(#dshadow)" }, g);
      if (open && n.spot) el("image", { href: `assets/${n.spot}.webp`, x: -36, y: -36, width: 72, height: 72 }, g);
      else text(g, 0, 2, open ? n.icon : "🔒", boss ? 50 : 40);
      // 地名牌
      const label = `${n.title}`;
      const w = label.length * 26 + 30;
      el("rect", { x: -w / 2, y: (boss ? 58 : 48), width: w, height: 40, rx: 12, fill: "#f6ecd6", stroke: "#7a4b12", "stroke-width": 3 }, g);
      text(g, 0, (boss ? 78 : 68), label, 24, { "font-weight": 900, fill: "#3b2508" });
      // 星星
      const sg = el("g", { transform: `translate(0,${boss ? 116 : 106})` }, g);
      [-60, -30, 0, 30, 60].forEach((dx, k) => text(sg, dx, 0, "★", 30, { fill: k < st.stars ? "#ffb400" : "#5e4a2a", stroke: "#2b1d0e", "stroke-width": 1.5 }));
      // 怪物
      const due = G.monstersDue(n.id).length;
      if (due) {
        const mg = el("g", { transform: `translate(${boss ? 46 : 38},${boss ? -44 : -36})` }, g);
        const inner = el("g", { class: "monster-bob" }, mg);
        el("circle", { r: 24, fill: "#7b1fa2", stroke: "#fff", "stroke-width": 3 }, inner);
        text(inner, 0, 1, "👾", 26);
        el("circle", { cx: 20, cy: -18, r: 14, fill: "#d64541", stroke: "#fff", "stroke-width": 2 }, inner);
        text(inner, 20, -17, String(due), 18, { fill: "#fff", "font-weight": 900 });
      }
      g.addEventListener("click", () => openNode(i));
    });
    renderSide();
  };

  function renderSide() {
    const S = G.S;
    G.$("#hud-coins").textContent = S.coins;
    G.$("#hud-tickets").textContent = S.tickets;
    G.$("#hud-streak").textContent = S.streak.count;
    G.$("#btn-sound").textContent = S.settings.sound ? "🔊" : "🔇";
    G.$("#chap-sub").textContent = G.CH.subtitle;
    G.$("#chap-title").textContent = G.CH.title;
    G.$("#chap-era").textContent = G.CH.era;
    const stars = G.totalStars(), max = G.CH.nodes.length * 5;
    G.$("#chap-prog").style.width = `${(stars / max) * 100}%`;
    G.$("#chap-prog-txt").textContent = `★ ${stars} / ${max}`;
    const bt = G.$("#badge-tickets");
    bt.textContent = S.tickets;
    bt.style.display = S.tickets ? "" : "none";
    G.$("#btn-gacha").classList.toggle("glow", S.tickets > 0);
    const owned = G.CH.cards.filter((c) => S.cards[c.id]).length;
    G.$("#cards-hint").textContent = `${owned} / ${G.CH.cards.length} 張`;
    // 分享版沒有攻略本（筆記、講義有版權），按鈕和每日任務都拿掉
    const hasGuide = !!G.CH.guide;
    G.$("#btn-guide").style.display = hasGuide ? "" : "none";
    const g = S.guide[G.CH.id];
    const readToday = g && g.date === G.today() && g.earned;
    G.$("#guide-hint").textContent = readToday ? (g.used ? "今天的加持用掉了" : "✔ 下一關 +1 生命") : "讀了下一關 +1 生命";
    G.$("#btn-guide").classList.toggle("glow", !readToday);

    const due = G.monstersDue().length, sleeping = G.monstersSleeping();
    const playedToday = (S.stats.days[G.today()] || 0) > 0;
    const daily = G.$("#daily");
    daily.innerHTML = "";
    daily.append(...[
      h("b", {}, "📅 今日任務"),
      h("div", {}, `${playedToday ? "✅" : "⬜"} 玩一關（連續 ${S.streak.count} 天，每 3 天送 1 張券）`),
      hasGuide ? h("div", {}, `${readToday ? "✅" : "⬜"} 讀攻略本（下一關 +1 生命）`) : null,
      h("div", {}, `${due ? "⬜" : "✅"} 打倒地圖上的怪物 ${due ? `（還有 ${due} 隻 👾）` : ""}`),
    ].filter(Boolean));
    if (sleeping) daily.append(h("div", { class: "muted" }, `💤 有 ${sleeping} 隻怪物在睡覺，之後會再回來`));
  }
  G.refreshSide = renderSide;

  function openNode(i) {
    const n = G.CH.nodes[i], st = G.nodeState(n.id), open = G.unlocked(i);
    const due = G.monstersDue(n.id);
    G.sfx("click");
    G.overlay((box) => {
      box.classList.add("node-panel");
      box.append(
        h("div", { class: "head" },
          h("div", { class: "ic" }, open && n.spot ? h("img", { src: `assets/${n.spot}.webp`, alt: "", style: "width:1.2em;height:1.2em;object-fit:contain" }) : open ? n.icon : "🔒"),
          h("div", {},
            // 地理的創世旅程也是用攻城戰的程式，標籤改叫「實習創世神」（家長 2026-10-31）
            h("span", { class: "tag", style: (n.type === "boss" || n.boss) ? "background:#8e2320" : "" }, n.type === "siege" && G.CH.subject === "地理" ? "實習創世神" : n.type === "siege" && G.CH.subject === "公民" ? "實習公民" : (n.boss ? "Boss 戰" : TYPE_LABEL[n.type])),
            h("h2", { style: "margin-top:6px" }, n.title),
            n.place ? h("div", { class: "muted", style: "font-weight:900" }, `📍 ${n.place}`) : null,
            h("div", { class: "stars" }, [0, 1, 2, 3, 4].map((k) => h("span", { class: k < st.stars ? "on" : "" }, "★")))
          )
        ),
        h("p", { style: "font-size:19px;font-weight:700;line-height:1.6" }, n.intro.join(" ")),
        open ? null : h("p", { style: "color:#8e2320;font-weight:900" }, `先通過「${G.CH.nodes[i - 1].title}」才能解鎖`),
        h("div", { class: "acts" },
          open ? G.modeButtons(i) : null,
          due.length ? h("button", { class: "btn red big", onclick: () => { G.closeOverlay(); G.startNode(i, true); } }, `👾 討伐怪物 ×${due.length}`) : null
        ),
        st.plays ? h("div", { class: "muted", style: "margin-top:12px;font-weight:700" }, `已玩 ${st.plays} 次・最高分 ${st.best || 0}`) : null
      );
    });
  }
  G.openNode = openNode;
})();
