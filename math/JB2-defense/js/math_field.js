/* 數學保衛戰 — 戰場：數學圖形全部程式畫（坐標、圓、線、角度、數線、能量條、磚塊），算出來的數字就是砲火真正打去的地方 */
(function () {
  const G = window.G;
  const M = G.M;
  const NS = "http://www.w3.org/2000/svg";
  const UFOS = ["mx_ufo_a", "mx_ufo_b", "mx_ufo_c", "mx_ufo_d"];
  const el = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) if (v != null) e.setAttribute(k, v);
    if (parent) parent.append(e);
    return e;
  };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  function tween(ms, fn) {
    return new Promise((res) => {
      const t0 = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - t0) / ms);
        fn(t);
        if (t < 1) requestAnimationFrame(step);
        else res();
      };
      requestAnimationFrame(step);
    });
  }

  /* 圖的格式：fig = { box: [x0, y0, x1, y1], grid: true, axes: true, step: 1, items: [...] }，y 軸朝上，單位是數學坐標 */
  M.field = (host) => {
    const svg = el("svg", { class: "mx-svg", preserveAspectRatio: "xMidYMid meet" }, host);
    let S = 40, K = 1, box = [-8, -8, 8, 8], ufos = [], top = null, gun = null, pv = null, baseN = 0, tapFn = null, W0 = 800, H0 = 600;
    const X = (x) => (x - box[0]) * S;
    const Y = (y) => (box[3] - y) * S;
    const P = ([x, y]) => [X(x), Y(y)];

    function txt(p, str, size, cls, parent) {
      const [x, y] = P(p);
      const t = el("text", { x, y, "font-size": (size || 18) * K, class: cls || "mx-t", "text-anchor": "middle", "dominant-baseline": "central" }, parent || top);
      t.textContent = M.plain(str);
      return t;
    }
    // 直線 ax + by = c 在畫面範圍裡的兩端
    function clip(a, b, c) {
      const [x0, y0, x1, y1] = box;
      const out = [];
      if (b !== 0) {
        for (const x of [x0, x1]) { const y = (c - a * x) / b; if (y >= y0 - 1e-9 && y <= y1 + 1e-9) out.push([x, y]); }
      }
      if (a !== 0) {
        for (const y of [y0, y1]) { const x = (c - b * y) / a; if (x >= x0 - 1e-9 && x <= x1 + 1e-9) out.push([x, y]); }
      }
      if (out.length < 2) return null;
      let best = [out[0], out[1]], d = -1;
      for (let i = 0; i < out.length; i++) for (let j = i + 1; j < out.length; j++) {
        const k = Math.hypot(out[i][0] - out[j][0], out[i][1] - out[j][1]);
        if (k > d) { d = k; best = [out[i], out[j]]; }
      }
      return best;
    }
    const DRAW = {
      line(it) { // eq: [a, b, c]（ax + by = c）或 a、b 兩點
        const eq = it.eq || [it.a[1] - it.b[1], it.b[0] - it.a[0], (it.a[1] - it.b[1]) * it.a[0] + (it.b[0] - it.a[0]) * it.a[1]];
        const e = clip(...eq);
        if (!e) return;
        el("line", { x1: X(e[0][0]), y1: Y(e[0][1]), x2: X(e[1][0]), y2: Y(e[1][1]), class: it.cls || "mx-l" }, top);
      },
      seg(it) { el("line", { x1: X(it.a[0]), y1: Y(it.a[1]), x2: X(it.b[0]), y2: Y(it.b[1]), class: it.cls || "mx-l" }, top); if (it.text) txt(it.at || [(it.a[0] + it.b[0]) / 2, (it.a[1] + it.b[1]) / 2], it.text, it.size || 20, "mx-t lab"); },
      curve(it) { el("polyline", { points: it.pts.map(P).map((p) => p.join(",")).join(" "), class: it.cls || "mx-curve" }, top); }, // 曲線：pts 連起來
      circle(it) { el("circle", { cx: X(it.c[0]), cy: Y(it.c[1]), r: it.r * S, class: "mx-c " + (it.cls || "") }, top); },
      arc(it) { // 從 from 度到 to 度（逆時針）的一段弧
        const pt = (d) => [X(it.c[0] + it.r * Math.cos(d * Math.PI / 180)), Y(it.c[1] + it.r * Math.sin(d * Math.PI / 180))];
        const [ax, ay] = pt(it.from), [bx, by] = pt(it.to), big = ((it.to - it.from + 360) % 360) > 180 ? 1 : 0;
        el("path", { d: `M${ax},${ay}A${it.r * S},${it.r * S} 0 ${big} 0 ${bx},${by}`, class: it.cls || "mx-arc" }, top);
      },
      sector(it) {
        const pt = (d) => [X(it.c[0] + it.r * Math.cos(d * Math.PI / 180)), Y(it.c[1] + it.r * Math.sin(d * Math.PI / 180))];
        const [ax, ay] = pt(it.from), [bx, by] = pt(it.to), big = ((it.to - it.from + 360) % 360) > 180 ? 1 : 0;
        el("path", { d: `M${X(it.c[0])},${Y(it.c[1])}L${ax},${ay}A${it.r * S},${it.r * S} 0 ${big} 0 ${bx},${by}Z`, class: it.cls || "mx-sector" }, top);
      },
      poly(it) { el("polygon", { points: it.pts.map(P).map((p) => p.join(",")).join(" "), class: it.cls || "mx-poly" }, top); },
      rect(it) { el("rect", { x: X(it.x), y: Y(it.y + it.h), width: it.w * S, height: it.h * S, rx: it.rx != null ? it.rx : 3, class: it.cls || "mx-rect" }, top); if (it.text) txt([it.x + it.w / 2, it.y + it.h / 2], it.text, it.size || 22, it.tcls || "mx-t lab"); },
      pt(it) {
        const [x, y] = P(it.p);
        el("circle", { cx: x, cy: y, r: (it.r || 5) * K, class: it.cls || "mx-pt" }, top);
        if (it.label) txt([it.p[0] + (it.dx != null ? it.dx : 0.45), it.p[1] + (it.dy != null ? it.dy : 0.45)], it.label, it.size || 22, "mx-t name");
      },
      text(it) { txt(it.p, it.text, it.size, it.cls); },
      // 角度：at 是頂點，a、b 是兩邊上的點；text 標在角裡面
      angle(it) {
        const r = it.r || 1;
        const a0 = Math.atan2(it.a[1] - it.at[1], it.a[0] - it.at[0]), b0 = Math.atan2(it.b[1] - it.at[1], it.b[0] - it.at[0]);
        let d = b0 - a0;
        while (d <= -Math.PI) d += 2 * Math.PI;
        while (d > Math.PI) d -= 2 * Math.PI;
        const pt = (k) => [X(it.at[0] + r * Math.cos(k)), Y(it.at[1] + r * Math.sin(k))];
        const [ax, ay] = pt(a0), [bx, by] = pt(a0 + d);
        el("path", { d: `M${X(it.at[0])},${Y(it.at[1])}L${ax},${ay}A${r * S},${r * S} 0 0 ${d > 0 ? 0 : 1} ${bx},${by}Z`, class: it.cls || "mx-ang" }, top);
        if (it.text) {
          const m = a0 + d / 2, k = r + (it.tr != null ? it.tr : 0.55);
          txt([it.at[0] + k * Math.cos(m), it.at[1] + k * Math.sin(m)], it.text, it.size || 20, "mx-t ang");
        }
      },
      // 直角記號
      right(it) {
        const k = it.k || 0.5;
        const u = (p) => { const dx = p[0] - it.at[0], dy = p[1] - it.at[1], l = Math.hypot(dx, dy) || 1; return [dx / l * k, dy / l * k]; };
        const [ux, uy] = u(it.a), [vx, vy] = u(it.b);
        el("path", { d: `M${X(it.at[0] + ux)},${Y(it.at[1] + uy)}L${X(it.at[0] + ux + vx)},${Y(it.at[1] + uy + vy)}L${X(it.at[0] + vx)},${Y(it.at[1] + vy)}`, class: "mx-right" }, top);
      },
      // 數線：from～to，每 step 一格；marks: [{ x, label, cls }]
      numline(it) {
        const y = it.y || 0, step = it.step || 1;
        el("line", { x1: X(it.from - step * 0.4), y1: Y(y), x2: X(it.to + step * 0.4), y2: Y(y), class: "mx-nl" }, top);
        const every = it.every || 1;
        let n = 0;
        for (let x = it.from; x <= it.to + 1e-9; x += step, n++) {
          const v = +x.toFixed(4);
          el("line", { x1: X(v), y1: Y(y) - 7, x2: X(v), y2: Y(y) + 7, class: "mx-nl" }, top);
          if (n % every === 0) txt([v, y - (it.dy || 0.8)], String(v).replace("-", "−"), it.size || 18, "mx-t tick");
        }
      },
      // 能量條：parts 格，亮 fill 格
      bar(it) {
        const w = it.w / it.parts;
        for (let i = 0; i < it.parts; i++) el("rect", { x: X(it.x + i * w), y: Y(it.y + it.h), width: w * S, height: it.h * S, rx: 4, class: i < it.fill ? it.cls || "mx-bar on" : "mx-bar" }, top);
      },
      // 題目附的圖（JB2V2 的 svg 圖）：整張畫進戰場
      raw(it) {
        const d = document.createElement("div");
        d.innerHTML = it.html;
        const sv = d.querySelector("svg");
        if (!sv) return;
        const vb = (sv.getAttribute("viewBox") || "0 0 260 260").split(/[\s,]+/).map(Number);
        const k = (it.h * S) / vb[3], [x, y] = P([it.p[0], it.p[1] + it.h]);
        const g = el("g", { transform: `translate(${x},${y}) scale(${k}) translate(${-vb[0]},${-vb[1]})` }, top);
        el("rect", { x: vb[0], y: vb[1], width: vb[2], height: vb[3], rx: 10, fill: "#fffdf5", stroke: "#d9cfb4", "stroke-width": 2 }, g);
        while (sv.firstChild) g.append(sv.firstChild);
      },
      img(it) {
        const s = (it.s || 2) * S, [x, y] = P(it.p);
        el("image", { href: `assets/${it.name}.webp`, x: x - s / 2, y: y - s / 2, width: s, height: s, class: it.cls || "" }, top);
      },
      ufo(it) {
        const s = (it.s || 2.2) * S, [x, y] = P(it.p);
        const g = el("g", { transform: `translate(${x},${y})`, class: "mx-ufo" }, top);
        const inner = el("g", { class: "bob" }, g);
        if (it.emoji && !it.name) {
          const t = el("text", { x: 0, y: 0, "font-size": s * 0.8, "text-anchor": "middle", "dominant-baseline": "central" }, inner);
          t.textContent = it.emoji;
        } else el("image", { href: `assets/${it.name || UFOS[it.k != null ? it.k % UFOS.length : ufos.length % UFOS.length]}.webp`, x: -s / 2, y: -s / 2, width: s, height: s }, inner);
        g._at = [x, y];
        g._s = s;
        ufos.push(g);
        if (it.label) txt([it.p[0], it.p[1] - (it.s || 2.2) / 2 - 0.35], it.label, 18, "mx-t tick");
      },
    };

    function draw(fig) {
      svg.innerHTML = "";
      ufos = [];
      box = fig.box || [-8, -8, 8, 8];
      S = fig.scale || 40;
      const W = (box[2] - box[0]) * S, H = (box[3] - box[1]) * S;
      K = Math.min(2, Math.max(1, W / 900)); // 範圍很大的圖（時間軸）整張圖縮得比較小，字和點要放大才看得清楚
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      W0 = W;
      H0 = H;
      pv = null;
      top = el("g", {}, svg);
      if (fig.grid) {
        const step = fig.step || 1;
        for (let x = Math.ceil(box[0] / step) * step; x <= box[2]; x += step) el("line", { x1: X(x), y1: 0, x2: X(x), y2: H, class: "mx-grid" }, top);
        for (let y = Math.ceil(box[1] / step) * step; y <= box[3]; y += step) el("line", { x1: 0, y1: Y(y), x2: W, y2: Y(y), class: "mx-grid" }, top);
      }
      if (fig.axes) {
        el("line", { x1: 0, y1: Y(0), x2: W, y2: Y(0), class: "mx-axis" }, top);
        el("line", { x1: X(0), y1: 0, x2: X(0), y2: H, class: "mx-axis" }, top);
        const lab = fig.ticks || 2;
        for (let x = Math.ceil(box[0] / lab) * lab; x < box[2]; x += lab) if (x) txt([x, -0.5], String(x).replace("-", "−"), 15, "mx-t tick");
        for (let y = Math.ceil(box[1] / lab) * lab; y < box[3]; y += lab) if (y) txt([-0.5, y], String(y).replace("-", "−"), 15, "mx-t tick");
        txt([box[2] - 0.4, 0.5], "x", 18, "mx-t tick");
        txt([0.5, box[3] - 0.4], "y", 18, "mx-t tick");
      }
      for (const it of fig.items || []) if (DRAW[it.t]) DRAW[it.t](it);
      // 有飛碟的圖，左下角放我方砲台；題目沒有自己畫彈道時，雷射從這裡打出去
      gun = null;
      if (ufos.length && fig.turret !== false) {
        const s = 1.9 * Math.min(1, Math.max(0.8, (box[3] - box[1]) / 12));
        gun = [box[0] + s * 0.55, box[1] + s * 0.55];
        DRAW.img({ name: "mx_turret", p: gun, s });
      }
      baseN = top.childNodes.length;
    }
    // 調整中的預覽：每次換掉同一層（調雷射的瞄準線、三座砲塔的距離）
    function preview(items) {
      if (!pv) { pv = el("g", {}, top); baseN = Math.max(baseN, top.childNodes.length); }
      pv.innerHTML = "";
      const keep = top, n = ufos.length;
      top = pv;
      for (const it of items || []) if (DRAW[it.t]) DRAW[it.t](it);
      top = keep;
      ufos.length = n; // 預覽裡的飛碟不算目標
    }
    // 點或拖戰場：回傳數學坐標（比照 shooter.js，用比例換算，整頁 zoom 也對得上）
    const toMath = (e) => {
      const r = svg.getBoundingClientRect(), s = Math.min(r.width / W0, r.height / H0);
      const x = (e.clientX - r.left - (r.width - W0 * s) / 2) / s, y = (e.clientY - r.top - (r.height - H0 * s) / 2) / s;
      return [box[0] + x / S, box[3] - y / S];
    };
    let down = false;
    svg.addEventListener("pointerdown", (e) => { if (tapFn) { down = true; svg.setPointerCapture(e.pointerId); tapFn(...toMath(e)); } });
    svg.addEventListener("pointermove", (e) => { if (tapFn && down) tapFn(...toMath(e)); });
    svg.addEventListener("pointerup", () => { down = false; });
    svg.addEventListener("pointercancel", () => { down = false; });
    function onTap(fn) {
      tapFn = fn;
      svg.style.touchAction = fn ? "none" : "";
      svg.classList.toggle("tap", !!fn);
    }

    /* ---------- 動畫 ---------- */
    // 雷射：沿著 a → b 打出去（a、b 是數學坐標）；eq 給直線方程式時畫滿整條
    async function beam(sh) {
      let a = sh.a, b = sh.b;
      if (sh.eq) {
        const e = clip(...sh.eq);
        if (!e) return;
        [a, b] = sh.from === "right" ? [e[1], e[0]] : e;
      }
      G.sfx("shot");
      const glow = el("line", { x1: X(a[0]), y1: Y(a[1]), x2: X(a[0]), y2: Y(a[1]), class: "mx-beam glow " + (sh.cls || "") }, top);
      const core = el("line", { x1: X(a[0]), y1: Y(a[1]), x2: X(a[0]), y2: Y(a[1]), class: "mx-beam " + (sh.cls || "") }, top);
      await tween(sh.ms || 420, (t) => {
        for (const l of [glow, core]) { l.setAttribute("x2", X(a[0] + (b[0] - a[0]) * t)); l.setAttribute("y2", Y(a[1] + (b[1] - a[1]) * t)); }
      });
      if (sh.fade !== false) {
        await wait(220);
        await tween(240, (t) => { glow.style.opacity = core.style.opacity = 1 - t; });
        glow.remove();
        core.remove();
      }
    }
    // 砲彈：沿著 pts 飛
    async function shell(sh) {
      G.sfx("shot");
      const ball = el("circle", { r: 8, class: "mx-shell" }, top);
      const trail = el("polyline", { points: "", class: "mx-trail" }, top);
      const pts = sh.pts, n = pts.length - 1;
      await tween(sh.ms || 700, (t) => {
        const k = Math.min(n, t * n), i = Math.floor(k), f = k - i;
        const q = i >= n ? pts[n] : [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f];
        ball.setAttribute("cx", X(q[0]));
        ball.setAttribute("cy", Y(q[1]));
        trail.setAttribute("points", pts.slice(0, i + 1).concat([q]).map(P).map((p) => p.join(",")).join(" "));
      });
      ball.remove();
      await wait(180);
      trail.remove();
    }
    function burst(x, y, size = 1) {
      for (let i = 0; i < 12; i++) {
        const c = el("circle", { cx: x, cy: y, r: (4 + (i % 3) * 3) * size, class: "mx-spark k" + (i % 3) }, top);
        const a = (i / 12) * 2 * Math.PI, d = (34 + (i % 4) * 16) * size;
        tween(520, (t) => {
          c.setAttribute("cx", x + Math.cos(a) * d * t);
          c.setAttribute("cy", y + Math.sin(a) * d * t);
          c.style.opacity = 1 - t;
        }).then(() => c.remove());
      }
      const ring = el("circle", { cx: x, cy: y, r: 6, class: "mx-ring" }, top);
      tween(420, (t) => { ring.setAttribute("r", 6 + 60 * size * t); ring.style.opacity = 1 - t; }).then(() => ring.remove());
    }
    // 飛碟被打中：冒煙、轉圈飛走（不是死掉）
    async function hitUfos(which) {
      const list = which == null ? ufos : which.map((k) => ufos[k]).filter(Boolean);
      if (!list.length) return;
      G.sfx("boom");
      await Promise.all(list.map(async (g) => {
        const [x, y] = g._at, inner = g.firstChild;
        burst(x, y, g._s / 90);
        inner.classList.remove("bob");
        await tween(700, (t) => {
          inner.setAttribute("transform", `translate(${120 * t},${-260 * t * t}) rotate(${540 * t}) scale(${1 - 0.6 * t})`);
          inner.style.opacity = 1 - t * t;
        });
        g.remove();
      }));
    }
    // 題目沒有自己的彈道：雷射從砲台打向飛碟；打歪就偏到旁邊
    async function shootUfo(miss) {
      if (!gun || !ufos.length) return;
      const [tx, ty] = ufos[0]._at;
      const t = [box[0] + tx / S + (miss ? 2.4 : 0), box[3] - ty / S + (miss ? 1.8 : 0)];
      await beam({ a: gun, b: t, cls: miss ? "miss" : "", ms: 300 });
    }
    // 打歪：飛碟在原地晃一下、笑你
    function dodge() {
      for (const g of ufos) { g.classList.remove("nah"); void g.getBBox(); g.classList.add("nah"); }
    }
    async function play(steps) {
      for (const st of steps || []) {
        if (st.do === "beam") await beam(st);
        else if (st.do === "shell") await shell(st);
        else if (st.do === "boom") { const [x, y] = P(st.p); G.sfx("hit"); burst(x, y, st.size || 1); await wait(st.ms || 260); }
        else if (st.do === "draw") { for (const it of st.items || []) if (DRAW[it.t]) DRAW[it.t](it); if (st.ms) await wait(st.ms); }
        else if (st.do === "wait") await wait(st.ms);
        else if (st.do === "clear") { while (top.childNodes.length > baseN) top.lastChild.remove(); } // 清掉前一次動畫畫的東西
        else if (st.do === "all") await Promise.all(st.steps.map((x) => play([x]))); // 同時播
      }
    }
    return { draw, play, hitUfos, dodge, shootUfo, preview, onTap, count: () => ufos.length };
  };
})();
