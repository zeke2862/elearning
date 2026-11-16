/* 數學保衛戰 — 關卡：武器實戰（算出來、發射）、軍械庫、作戰會議（8 步連鎖題＋比較表）、雷達判讀、謊言巨獸（抓錯算式）
   掛在 G.NODE_TYPES（main.js），只有數學網站載入；生命、連擊、結算、解說倒數照其他科 */
(function () {
  const G = window.G, h = G.h;
  const M = G.M;
  const para = (t, cls) => (t ? h("p", { class: cls || "" }, M.tex(t)) : null);
  const num = (v) => (v.root ? v.root[0] * Math.sqrt(v.root[1]) : v.n / v.d);

  /* ---------- 共用：版面三塊（題目、戰場、鍵盤）、生命、連擊、記錄對錯、解說卡、結算 ---------- */
  function stage(cfg, cls) {
    const st = G.$("#play-stage");
    st.innerHTML = "";
    const qBox = h("div", { class: "mx-q" }), fBox = h("div", { class: "mx-f" }), pBox = h("div", { class: "mx-p" });
    const wrap = h("div", { class: "scene mx " + cls }, qBox, fBox, pBox);
    const bg = cfg.node.bg || G.CH.sceneBg;
    if (bg) wrap.style.backgroundImage = `url(assets/${bg}.webp)`;
    st.append(wrap);
    const S = {
      hearts: cfg.hearts, maxHearts: cfg.hearts, shield: G.buff("shield") > 0 ? 1 : 0, combo: 0, maxCombo: 0, score: 0,
      mistakes: 0, hints: 0, done: false, results: new Map(), wrongs: [], t0: performance.now(), keys: [],
    };
    G.setHearts(S.hearts, S.maxHearts);
    G.setShield(S.shield);
    const A = {
      wrap, qBox, fBox, pBox, S, node: cfg.node, cfg,
      good(points) {
        S.combo += 1;
        S.maxCombo = Math.max(S.maxCombo, S.combo);
        S.score += points + Math.min(S.combo - 1, 5) * 20;
        G.sfx("good");
        if (S.combo >= 3) {
          G.sfx("combo");
          const c = h("div", { class: "combo-big" }, `${S.combo} 連擊！`);
          wrap.append(c);
          setTimeout(() => c.remove(), 800);
        }
      },
      hurt(lose) {
        S.combo = 0;
        S.mistakes += 1;
        G.sfx("bad");
        if (!lose) return;
        if (S.shield > 0) { S.shield -= 1; G.setShield(S.shield); G.toast("🛡️ 護盾擋下了一次！"); return; }
        S.hearts -= 1;
        G.setHearts(S.hearts, S.maxHearts);
        G.sfx("hurt");
        wrap.animate([{ transform: "translateX(-10px)" }, { transform: "translateX(10px)" }, { transform: "none" }], { duration: 260 });
      },
      mark(key, ok, q, ref) {
        if (S.results.has(key)) return;
        S.results.set(key, ok);
        if (!ok) S.wrongs.push({ key, q: M.wrongOf(q, ref) });
      },
      key(fn) { S.keys.push(fn); document.addEventListener("keydown", fn); },
      unkey(fn) { S.keys = S.keys.filter((k) => k !== fn); document.removeEventListener("keydown", fn); },
      // 答對停 2 秒、答錯停 5 秒才能關，說明類（info）不用等（core.js 的 G.explainWait）
      card(kind, title, ...body) {
        return new Promise((res) => {
          const go = h("div", { class: "go" }, "點一下繼續 ▶");
          const c = h("div", { class: "explain-card mx-card " + kind }, h("div", { class: "hd" }, M.tex(title)), ...body.filter(Boolean), go);
          const veil = h("div", { class: "explain-veil" }, c);
          wrap.append(veil);
          const t0 = performance.now();
          const minMs = { good: G.RIGHT_WAIT, bad: G.WRONG_WAIT }[kind] || 600;
          if (minMs > 1000) G.explainWait(c, go, minMs);
          else setTimeout(() => c.classList.add("ready"), minMs);
          const close = () => {
            if (performance.now() - t0 < minMs) return;
            veil.remove();
            A.unkey(key);
            res();
          };
          const key = (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); close(); } };
          veil.addEventListener("click", close);
          A.key(key);
        });
      },
      cleanup() {
        S.done = true;
        S.keys.forEach((k) => document.removeEventListener("keydown", k));
        S.keys = [];
        if (A.pad) A.pad.destroy();
        if (A.scratch) A.scratch.remove();
        if (A.tutorOv) { A.tutorOv.remove(); A.tutorOv = null; }
      },
      async end(allDone, stars) {
        if (S.done) return;
        const results = [...S.results].map(([key, ok]) => ({ key, ok }));
        const correct = results.filter((r) => r.ok).length;
        const cleared = allDone && S.hearts > 0;
        const st0 = !cleared ? 0 : stars != null ? stars : S.mistakes === 0 ? 3 : S.mistakes <= 2 ? 2 : 1;
        A.cleanup();
        // 最後一關第一次過關：故事的結語（其他科寫在 boss 關，這裡的關卡類型自己處理）
        const nodes = G.CH.nodes;
        if (!cfg.monster && cleared && nodes[nodes.length - 1] === cfg.node && !G.S.seen["outro_" + G.CH.id]) {
          G.S.seen["outro_" + G.CH.id] = 1;
          G.save();
          await G.dialog(G.CH.story.outro);
        }
        cfg.onEnd({
          cleared: cfg.monster ? true : cleared, stars: cfg.monster ? 0 : st0, correct, total: results.length,
          score: S.score, maxCombo: S.maxCombo, hearts: S.hearts, maxHearts: S.maxHearts,
          results, wrongs: S.wrongs, seconds: (performance.now() - S.t0) / 1000, bossDead: cleared, mode: cfg.mode, hints: S.hints,
        });
      },
    };
    scratch(A);
    return A;
  }

  // 草稿紙：手指直接在畫面上寫（鼓勵拿紙筆，手邊沒有也能算）
  // 開草稿時：數字鍵盤收起來，草稿紙放大到整個作答區；有 3 種粗細的筆和橡皮擦；收起草稿再輸入答案
  function scratch(A) {
    let on = false, size = 1.5, erase = false;
    const cv = h("canvas", { class: "mx-scratch" });
    const sizeBtns = [[1.5, "細"], [3, "中"], [6, "粗"]].map(([v, t]) => h("button", { class: "btn ghost mx-sc-t" + (v === size ? " on" : ""), onclick: () => { size = v; erase = false; mark(); } }, t));
    const eraser = h("button", { class: "btn ghost mx-sc-t", onclick: () => { erase = true; mark(); } }, "🧽");
    const mark = () => { sizeBtns.forEach((b, i) => b.classList.toggle("on", !erase && [1.5, 3, 6][i] === size)); eraser.classList.toggle("on", erase); };
    const clearBtn = h("button", { class: "btn ghost mx-sc-t", onclick: () => cv.getContext("2d").clearRect(0, 0, cv.width, cv.height) }, "清除");
    const btn = h("button", { class: "btn ghost mx-sc-btn", onclick: () => {
      on = !on;
      A.wrap.classList.toggle("sc-on", on);
      btn.textContent = on ? "✏️ 收起（輸入答案）" : "✏️ 草稿";
      if (on) {
        const r = A.fBox.getBoundingClientRect(); // 用作答區的大小（畫布本身剛顯示時量不準）
        if (r.width > 50 && (Math.abs(cv.width - r.width) > 4 || Math.abs(cv.height - r.height) > 4)) { cv.width = Math.round(r.width); cv.height = Math.round(r.height); }
      }
    } }, "✏️ 草稿");
    const bar = h("div", { class: "mx-sc-bar" }, sizeBtns, eraser, clearBtn, btn);
    let last = null;
    const at = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * (cv.width / r.width), (e.clientY - r.top) * (cv.height / r.height)]; };
    cv.addEventListener("pointerdown", (e) => { last = at(e); cv.setPointerCapture(e.pointerId); });
    cv.addEventListener("pointermove", (e) => {
      if (!last) return;
      const p = at(e), c = cv.getContext("2d");
      c.globalCompositeOperation = erase ? "destination-out" : "source-over";
      c.strokeStyle = "#ffe27a"; c.lineWidth = erase ? 22 : size; c.lineCap = "round"; c.lineJoin = "round";
      c.beginPath(); c.moveTo(...last); c.lineTo(...p); c.stroke();
      last = p;
    });
    cv.addEventListener("pointerup", () => { last = null; });
    cv.addEventListener("pointercancel", () => { last = null; });
    A.wrap.append(cv, bar);
    A.scratch = { remove() {} };
  }

  // 判斷孩子輸入的答案：anyOrder 的題目（一元二次的兩個解）順序不拘
  function judgeAll(q, texts) {
    const one = (order) => order.map((t, i) => M.judge(q.ask[i], t));
    const res = one(texts);
    if (res.every((x) => x === "ok")) return "ok";
    if (q.anyOrder && texts.length === 2) {
      const rev = one([texts[1], texts[0]]);
      if (rev.every((x) => x === "ok")) return "ok";
      if (rev.every((x) => x !== "no")) return "simplify";
    }
    return res.every((x) => x !== "no") ? "simplify" : "no";
  }
  // 比對常見錯法：輸入的值和 traps 裡的一樣，就知道可能錯在哪一步
  function trapOf(q, texts) {
    for (const t of q.traps || []) {
      const want = [].concat(t.a);
      if (want.length === texts.length && want.every((v, i) => M.same(M.parse(texts[i]), v))) return t.why;
    }
    return null;
  }
  const stepsBox = (q) => (q.steps && q.steps.length ? h("ol", { class: "mx-steps" }, ...q.steps.map((s) => h("li", {}, M.tex(s)))) : null);

  /* 問一題：算的題用鍵盤，判斷題用按鈕。可以答兩次，第二次還錯就公布答案。回傳第一次有沒有對 */
  function ask(A, q, key, o = {}) {
    M.cur = q; // 自動測試看得到現在這一題
    if (A.pad) { A.pad.destroy(); A.pad = null; }
    A.qBox.innerHTML = "";
    if (o.head) A.qBox.append(h("div", { class: "mx-tag" }, o.head));
    A.qBox.append(h("div", { class: "mx-qt" }, M.tex(q.q)));
    if (q.tip) A.qBox.append(h("div", { class: "mx-tip" }, M.tex(q.tip)));
    return new Promise((res) => {
      let tries = 0, busy = false, over = false, tm = null;
      const cleanups = [];
      const done = (ok) => {
        if (tm) { clearInterval(tm); tm = null; }
        if (A.pad) { A.pad.destroy(); A.pad = null; }
        res(ok);
      };
      const wrong = async (texts, whyText, label) => {
        A.mark(key, false, q, o.ref);
        tries += 1;
        A.hurt(o.noHurt ? false : tries === 1);
        if (o.field) o.field.dodge();
        if (q.jb) { // JB2 題庫：答錯直接看說明（中文，可切泰文），不再顯示提示
          const easy = o.mode === "easy";
          await A.card(easy ? "good" : "bad", easy ? "🌱 恭喜你學到了！" : "✖ 答錯了，看看說明", explainNode(q, label));
          return done(false);
        }
        if (A.S.hearts <= 0) {
          await A.card("bad", `✖ 正確答案：${label}`, para(whyText), stepsBox(q));
          return done(false);
        }
        if (tries >= 2) {
          await A.card("bad", `✖ 正確答案：${label}`, para(whyText), stepsBox(q));
          return done(false);
        }
        await A.card("bad", "✖ 再算一次！", para(whyText || q.hint || "數字不對，看一下題目給的條件，再算一次。"));
        busy = false;
        if (A.pad) { A.pad.lock(false); A.pad.clear(); }
      };
      const right = async () => {
        if (!A.S.results.has(key)) A.mark(key, tries === 0, q, o.ref);
        A.good(tries === 0 ? 100 : 40);
        if (o.field && !q.next) {
          if (!q.shot) await o.field.shootUfo(false);
          await o.field.hitUfos(q.hit);
        }
        await (o.onRight ? o.onRight() : Promise.resolve());
        if (q.next) {
          if (q.ok) G.toast(M.plain(q.ok));
          const n = q.next;
          n.gen = q.gen; n.lv = q.lv;
          if (n.fig && o.field) o.field.draw(n.fig); // 下一步換一張圖（天平一步步變簡單）
          const ok2 = await ask(A, n, key, o);
          return done(ok2 && tries === 0);
        }
        await A.card("good", q.okTitle || "✔ 命中！", para(q.ok));
        done(tries === 0);
      };
      /* 挑戰、極限：每題限時（秒數取自 game-config.js 或各關原本設定）；答題解說、休息小遊戲時暫停 */
      if (o.time) {
        let left = o.time;
        const bar = h("div", { class: "mx-time" }, h("i"), h("b", {}, o.time + " 秒"));
        A.qBox.append(bar);
        tm = setInterval(async () => {
          if (busy || over || A.S.done || G.paused || document.querySelector(".explain-veil")) return;
          left -= 0.1;
          bar.firstChild.style.width = Math.max(0, (left / o.time) * 100) + "%";
          bar.lastChild.textContent = Math.max(0, Math.ceil(left)) + " 秒";
          bar.classList.toggle("hot", left <= 3);
          if (left > 0) return;
          over = true; busy = true;
          clearInterval(tm); tm = null;
          cleanups.forEach((f) => f());
          if (A.pad) A.pad.lock(true);
          A.mark(key, false, q, o.ref);
          A.hurt(true);
          if (o.field) o.field.dodge();
          await A.card("bad", "⏰ 時間到！看看說明", q.jb ? explainNode(q, M.plain(q.pick ? q.pick[q.ans] : M.ansText(q))) : para(q.ok));
          done(false);
        }, 100);
      }
      /* 調參數：按 ＋／－ 或點、拖戰場，圖跟著動（調雷射的斜率和截距、拖砲塔、調拋物線）。tune.draw 不寫就是看不到預覽，要自己算 */
      if (q.tune) {
        const T = q.tune, vals = {};
        T.params.forEach((p) => (vals[p.key] = p.value));
        const fmt = (p) => (p.fmt ? p.fmt(vals[p.key]) : String(vals[p.key]).replace("-", "−"));
        const faces = {};
        const redraw = () => {
          T.params.forEach((p) => { faces[p.key].innerHTML = ""; faces[p.key].append(M.tex(fmt(p))); });
          if (o.field && T.draw) o.field.preview(T.draw(vals));
        };
        const clampSet = (p, v) => {
          const step = p.step || 1;
          vals[p.key] = +(Math.max(p.min, Math.min(p.max, Math.round((v - p.min) / step) * step + p.min))).toFixed(6);
        };
        const rows = T.params.map((p) => {
          faces[p.key] = h("span", { class: "val" });
          const bump = (d) => () => { if (busy) return; G.sfx("click"); clampSet(p, vals[p.key] + d * (p.step || 1)); redraw(); };
          return h("div", { class: "mx-trow" }, h("span", { class: "lab" }, M.tex(p.label || p.key)),
            h("button", { class: "mx-key alt", onclick: bump(-1) }, "−"), faces[p.key], h("button", { class: "mx-key alt", onclick: bump(1) }, "＋"));
        });
        const fireIt = async () => {
          if (busy || A.S.done) return;
          busy = true;
          const v = { ...vals }, ok = !!T.check(v);
          if (o.field) {
            if (T.draw) o.field.preview(T.draw(v));
            if (q.shot) await o.field.play(q.shot(v, ok)); else if (!ok || q.next) await o.field.shootUfo(!ok);
          }
          if (A.S.done) return;
          if (ok) { cleanTune(); return right(); }
          await wrong(null, T.why ? T.why(v) : "", M.plain(T.answerText));
          if (tries >= 2 || A.S.hearts <= 0) cleanTune();
        };
        const keyFn = (e) => { if (e.key === "Enter" && !document.querySelector(".explain-veil")) { e.preventDefault(); fireIt(); } };
        const cleanTune = () => { A.unkey(keyFn); if (o.field) o.field.onTap(null); };
        A.key(keyFn);
        A.pBox.innerHTML = "";
        A.pBox.append(h("div", { class: "mx-tune" }, ...rows, T.tap ? h("div", { class: "mx-thint" }, "也可以直接點或拖戰場") : null,
          h("button", { class: "mx-key fire", onclick: fireIt }, o.fireLabel || T.fireLabel || "🔥 發射")));
        if (T.tap && o.field) {
          const px = T.params.find((p) => p.key === T.tap[0]), py = T.params.find((p) => p.key === T.tap[1]);
          // 只給一個參數：左右點或拖（數線）；第一個寫 null：上下點或拖
          o.field.onTap((x, y) => { if (busy) return; if (px) clampSet(px, x); if (py) clampSet(py, y); redraw(); });
        }
        redraw();
        return;
      }
      if (q.pick) {
        A.pBox.innerHTML = "";
        const order = q.fixed ? q.pick.map((_, i) => i) : G.shuffle(q.pick.map((_, i) => i));
        const btns = order.map((k, n) => h("button", { class: "mx-pick", onclick: () => choose(k, btns[n]) }, h("b", {}, "ABCD"[n]), M.tex(q.pick[k])));
        A.pBox.append(h("div", { class: "mx-picks" }, ...btns));
        const keyFn = (e) => {
          const n = "1234".indexOf(e.key) >= 0 ? "1234".indexOf(e.key) : "abcd".indexOf(e.key.toLowerCase());
          if (n >= 0 && n < btns.length && e.key.length === 1 && !btns[n].disabled && !document.querySelector(".explain-veil")) btns[n].click();
        };
        A.key(keyFn);
        cleanups.push(() => A.unkey(keyFn));
        if (o.tools) {
          const tip = h("div", { class: "mx-tip2" });
          const hb = h("button", { class: "btn ghost mx-tbtn", onclick: () => { A.S.hints += 1; tip.textContent = "💡 " + (q.hint || "先用手算，再用排除法。"); } }, "💡 提示");
          const cb = h("button", { class: "btn ghost mx-tbtn", onclick: () => {
            A.S.hints += 1; cb.disabled = true;
            G.shuffle(btns.filter((b, n) => order[n] !== q.ans && !b.disabled)).slice(0, 2).forEach((b) => { b.disabled = true; b.classList.add("cut"); });
          } }, "✂️ 刪去法");
          A.pBox.append(tip, h("div", { class: "mx-tools" }, hb, cb));
        }
        const choose = async (k, btn) => {
          if (busy || A.S.done) return;
          busy = true;
          if (k === q.ans) {
            A.unkey(keyFn);
            btn.classList.add("right");
            if (o.field && q.shot) await o.field.play(q.shot(k, true));
            return right();
          }
          btn.classList.add("wrong");
          btn.disabled = true;
          if (o.field && q.shot) await o.field.play(q.shot(k, false));
          const whyText = (q.why && q.why[k]) || "";
          if (tries >= 1 || A.S.hearts <= 1) A.unkey(keyFn);
          await wrong(null, whyText, M.plain(q.pick[q.ans]));
          btns.forEach((b, n) => { if (order[n] === q.ans && tries >= 1) b.classList.add("hint"); });
        };
        return;
      }
      A.pad = M.pad(A.pBox, q, async (texts) => {
        if (busy || A.S.done) return;
        const v = judgeAll(q, texts);
        if (v === "simplify") { G.toast("💡 值是對的，但還可以再化簡！"); return; }
        busy = true;
        A.pad.lock(true);
        const vals = texts.map(M.parse).map(num);
        if (o.field) { if (q.shot) await o.field.play(q.shot(vals, v === "ok")); else if (v !== "ok" || q.next) await o.field.shootUfo(v !== "ok"); }
        if (A.S.done) return;
        if (v === "ok") return right();
        const label = M.plain(M.ansText(q));
        await wrong(texts, trapOf(q, texts), label);
      }, o.fireLabel);
    });
  }

  /* ---------- 三種難度：教學（練兵）／挑戰（實戰）／極限（修羅）──────────
     教學：選擇題、不限時、小老師一步一步帶；挑戰、極限：算出來打字（不能打字的題型仍是選擇題）、每題限時。 */
  const GC = () => window.GAME_CONFIG || {};
  const esc = (s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; };
  const GEN_HINTS = ["先用手算：把這一步的算式寫在紙上，一個數字一個數字慢慢算。", "用排除法：先刪掉「一看就不可能」的選項，再比較剩下的。"];

  // 答錯／學習後的說明：中文，旁邊一顆「🌐 ไทย」按鈕可切成泰文（JB2V2 的 explain-th.js）
  function explainNode(q, label) {
    const jb = q.jb || {};
    const catI = (x) => String(x).replace(/🐱/g, '<img src="assets/cat.webp" alt="" class="mx-catico">');
    const zh = catI(`🐱 正確答案是 <b>${esc(label)}</b>。<br>${jb.explain != null ? jb.explain : esc(q.ok || "")}`);
    const body = h("div", { class: "mx-exp-body", html: zh }), wrap = h("div", { class: "mx-expwrap" }, body);
    if (window.JB2TH && jb.explain != null) {
      let th = "";
      try { th = catI(window.JB2TH.line({ ans: jb.ans, explain: jb.explain })); } catch (e) { th = ""; }
      if (th) { const btn = h("button", { class: "btn ghost mx-thbtn" }); window.JB2TH.attach(btn, body, zh, th); wrap.append(btn); }
    }
    return wrap;
  }
  const labelOf = (q) => M.plain(q.pick ? q.pick[q.ans] : M.ansText(q));
  // 教學的小老師做完：完美＝「恭喜你學會了」，有失誤＝「恭喜你學到了」（教學不說錯）
  async function afterTutor(A, q, key, o, misses, bad) {
    A.mark(key, !bad, q, o.ref);
    if (bad) A.hurt(true); else A.good(100);
    if (A.S.hearts > 0) {
      if (misses === 0) await A.card("good", "🎉 恭喜你學會了！", para("每一步都做對了！"));
      else await A.card("good", "🌱 恭喜你學到了！", explainNode(q, labelOf(q)));
    }
    if (!bad && o.field) { await o.field.shootUfo(false); await o.field.hitUfos(q.hit); }
  }

  // 連續答對 N 題 → 休息小遊戲（relax-break.bundle.js）。回 true 就等小遊戲結束
  async function relaxTick(ok, last) {
    if (!window.RelaxBreak) return;
    G._noRelax = !!last; // 最後一題不彈出，免得蓋住結算
    if (RelaxBreak.answered(!!ok)) await new Promise((res) => { G._relaxEnd = res; });
  }

  // 教學模式的「小老師」：照 JB2V2 的步驟劇本（PLANNERS），一步一步選，失誤 ≤ 1 次算答對
  function tutor(A, q, plan, key, o) {
    M.cur = q;
    A.qBox.innerHTML = "";
    if (o.head) A.qBox.append(h("div", { class: "mx-tag" }, o.head));
    A.qBox.append(h("div", { class: "mx-qt" }, M.tex(q.q)));
    if (A.pad) { A.pad.destroy(); A.pad = null; }
    A.pBox.innerHTML = "";
    return new Promise((res) => {
      let misses = 0, i = 0, hintI = 0;
      const hist = [];
      const sayEl = h("div", { class: "mx-tbubble" }), histEl = h("div", { class: "mx-thist" }), choices = h("div", { class: "mx-tchoices" }), hintEl = h("div", { class: "mx-thint" });
      const CAT = '<img src="assets/cat.webp" alt="" class="mx-catico">';
      const say = (html, bad) => { sayEl.innerHTML = String(html).replace(/🐱/g, CAT); sayEl.classList.toggle("bad", !!bad); };
      const renderHist = () => { histEl.innerHTML = hist.map((x) => `<div>→ ${esc(x)}</div>`).join(""); };
      const hintBtn = h("button", { class: "btn ghost mx-tbtn", onclick: () => {
        A.S.hints += 1;
        const s = plan.steps[Math.min(i, plan.steps.length - 1)], list = [s.hint].concat(GEN_HINTS).filter(Boolean);
        hintEl.innerHTML = "💡 " + list[Math.min(hintI++, list.length - 1)];
      } }, "💡 提示");
      const ov = h("div", { class: "mx-tutor-ov" },
        h("div", { class: "mx-tbox" },
          h("div", { class: "mx-thead" }, "🎓 小老師帶你一步一步解"),
          h("div", { class: "mx-tcols" },
            h("div", { class: "mx-tleft" }, h("div", { class: "mx-tq" }, M.tex(q.q)), q.rawSvg ? h("div", { class: "mx-tsvg", html: q.rawSvg }) : null),
            h("div", { class: "mx-tright" }, h("div", { class: "mx-twho" }, h("div", { class: "mx-tcat" }, h("img", { src: "assets/cat.webp", alt: "智慧貓" }), h("small", {}, "小老師")), sayEl),
              hintEl, histEl, choices, h("div", { class: "mx-tctl" }, hintBtn)))));
      A.wrap.append(ov);
      A.tutorOv = ov;
      const show = () => {
        if (A.S.done) return;
        const s = plan.steps[i];
        if (!s) return done();
        say(s.say);
        hintEl.innerHTML = ""; hintI = 0;
        if (s.onShow) { try { s.onShow(ov); } catch (e) {} }
        choices.innerHTML = "";
        s.opts.forEach((op) => {
          const b = h("button", { class: "mx-topt" }, op.t);
          b.onclick = () => {
            if (!b.isConnected || b.disabled || A.S.done) return;
            if (op.ok) {
              choices.innerHTML = "";
              hist.push(op.line != null ? op.line : s.line);
              i += 1;
              if (op.next) { try { plan.steps.splice(i, 0, ...(op.next() || [])); } catch (e) {} }
              say(op.ack || "✅ 對！");
              renderHist();
              G.sfx("click");
              setTimeout(i < plan.steps.length ? show : done, 550);
            } else {
              misses += 1; b.disabled = true; b.classList.add("bad"); G.sfx("bad");
              say("🐱 " + (op.why || "再想想看～"), true);
            }
          };
          choices.append(b);
        });
      };
      const done = () => {
        if (A.S.done) return;
        const max = GC().tutorMissMax != null ? GC().tutorMissMax : 1, bad = misses > max;
        say(`🎉 完成！答案是 <b>${esc(plan.final)}</b>。` + (bad ? `<br>🌱 這題還沒有完全學會，之後再練一次就會了！` : ""));
        hintBtn.style.display = "none";
        setTimeout(async () => {
          if (A.S.done) return;
          ov.remove(); A.tutorOv = null;
          await afterTutor(A, q, key, o, misses, bad);
          res(!bad);
        }, GC().tutorDwellMs || 1500);
      };
      renderHist();
      show();
    });
  }

  // 化簡題（1-1-1）的小老師：括號、同類項、合併，含正負號與分數／小數係數（JB2V2 的 stTutor）
  function simplify(A, q, key, o) {
    M.cur = q;
    A.qBox.innerHTML = "";
    if (o.head) A.qBox.append(h("div", { class: "mx-tag" }, o.head));
    A.qBox.append(h("div", { class: "mx-qt" }, M.tex(q.q)));
    if (A.pad) { A.pad.destroy(); A.pad = null; }
    A.pBox.innerHTML = "";
    return new Promise((res) => {
      const box = h("div", { class: "mx-tutor-ov" });
      A.wrap.append(box);
      A.tutorOv = box;
      box.addEventListener("click", (e) => { if (e.target.closest && e.target.closest("#st-hint")) A.S.hints += 1; });
      window.JB2.simplify(q.jb, {
        cfg: { miss: GC().tutorMissMax != null ? GC().tutorMissMax : 1, dwell: GC().tutorDwellMs || 1500 },
        mount(ov) { box.append(ov); },
        finish: async (wrongCount, okEq, misses) => {
          box.remove(); A.tutorOv = null;
          if (A.S.done) return;
          await afterTutor(A, q, key, o, misses || 0, !!wrongCount);
          res(!wrongCount);
        },
      });
      if (!box.firstChild) { // 解析不了這題的算式：改用一般選擇題
        box.remove(); A.tutorOv = null;
        res(ask(A, q, key, { ...o, tools: true }));
      }
    });
  }

  // ♾️ 無極限（JB2V2）：一直出題到體力用完；前 15 題挑戰難度，之後極限難度；每題限時由挑戰的秒數慢慢縮到極限的秒數（30 題後固定）
  function endlessRun(A, cfg, field) {
    const node = cfg.node, conf = GC(), tr = conf.realTime || node.tReal || 15, th = conf.hardTime || node.tHard || 10;
    const RAMP = conf.endlessRamp || 30, SWITCH = conf.endlessSwitch || 15, types = [...new Set(node.targets)];
    let n = 0, last = null, right = 0;
    const finish = () => {
      if (A.S.done) return;
      const prev = G.nodeState(node.id).endless || 0;
      G.endlessInfo = { count: right, best: prev, isNew: right > prev && right > 0 };
      if (right > prev) { G.S.nodes[node.id] = { ...G.nodeState(node.id), endless: right }; G.save(); }
      A.end(false);
    };
    A.wrap.append(h("button", { class: "btn ghost mx-endquit", onclick: finish }, "🏁 結算離場"));
    (async () => {
      for (;;) {
        if (A.S.done) return;
        n += 1;
        let gen; do { gen = types[Math.floor(Math.random() * types.length)]; } while (types.length > 1 && gen === last);
        last = gen;
        const lv = n > SWITCH ? 3 : 2, k = Math.min(1, (n - 1) / (RAMP - 1)), time = Math.round((tr - (tr - th) * k) * 10) / 10;
        const q = M.make(gen, lv);
        field.draw(q.fig || M.figFor(q, node));
        const ok = await askAny(A, q, `${node.id}|e|${n}|${gen}`, { field, head: `♾️ 第 ${n} 題　答對 ${right}　（每題 ${time} 秒）`, time, mode: "endless" });
        if (A.S.done) return;
        if (ok) right += 1;
        if (A.S.hearts <= 0) return finish();
        await relaxTick(ok, false);
      }
    })();
  }

  // 依難度決定怎麼問：教學有小老師劇本就走小老師，沒有就是附 💡 提示、✂️ 刪去法的選擇題
  function askAny(A, q, key, o) {
    if (o.mode === "easy" && q.jb && /^化簡/.test(String(q.jb.text || "")) && window.JB2 && window.JB2.simplify) return simplify(A, q, key, o);
    if (o.mode === "easy" && q.jb && window.JB2 && window.JB2.planFor) {
      let plan = null;
      try { plan = window.JB2.planFor(q.jb); } catch (e) { plan = null; }
      if (plan) return tutor(A, q, plan, key, o);
    }
    return ask(A, q, key, { ...o, tools: o.mode === "easy" });
  }
  const MODE_NAME = { easy: "教學", real: "挑戰", hard: "極限" };
  G.MODE_NAME = MODE_NAME;

  /* ---------- 怪物：答錯的題換一組數字再出一次 ---------- */
  function monsterQ(d) {
    const ref = d.q;
    const raw = M.make(ref.gen, ref.lv || 1);
    if (raw.steps && raw.chain) return Object.assign(raw.steps[Math.min(ref.step || 0, raw.steps.length - 1)], { gen: ref.gen, lv: ref.lv });
    if (raw.item) return armoryQ(raw, ref.rooms || []);
    if (raw.lines) return liarQ(raw);
    return raw;
  }
  async function monsters(A) {
    const due = G.monstersDue(A.node.id);
    const field = M.field(A.fBox);
    for (const [i, d] of due.entries()) {
      if (A.S.done) return;
      const q = monsterQ(d);
      q.gen = d.q.gen;
      q.lv = d.q.lv;
      field.draw(q.fig || M.figFor(q, A.node));
      const mok = await askAny(A, q, d.key, { field, head: `👾 第 ${i + 1} / ${due.length} 隻`, ref: pickRef(d.q), mode: (d.q.lv || 2) === 1 ? "easy" : "real" });
      await relaxTick(mok, i === due.length - 1);
    }
    A.end(true);
  }
  const pickRef = (r) => { const o = {}; for (const k of ["step", "rooms"]) if (r[k] != null) o[k] = r[k]; return o; };

  /* ---------- 武器實戰：node.targets 是題型清單（"關卡:題型"）；難度由 cfg.mode 決定 ---------- */
  function battle(cfg) {
    const A = stage(cfg, "mx-battle");
    if (cfg.monster) { monsters(A); return { stop() { A.cleanup(); } }; }
    const field = M.field(A.fBox);
    if (cfg.mode === "endless") { endlessRun(A, cfg, field); return { stop() { A.cleanup(); } }; }
    const mode = cfg.mode || "easy", conf = GC(), lv = { easy: 1, real: 2, hard: 3 }[mode] || 1;
    const time = mode === "easy" ? 0 : (mode === "real" ? conf.realTime || 90 : conf.hardTime || 60); // 挑戰每題 90 秒、極限每題 60 秒
    const list = cfg.node.targets;
    // 星數：教學 1～3★；挑戰／極限依答對率分級（低於最低一級＝沒過關）
    const TIERS = { real: conf.realTiers || [[0.9, 4], [0.6, 3]], hard: conf.hardTiers || [[1, 5], [0.8, 4], [0.6, 3]] };
    const finishByAcc = () => {
      const total = list.length, right = [...A.S.results.values()].filter(Boolean).length, acc = total ? right / total : 0;
      if (mode === "easy") {
        const s3 = conf.easyStar3 != null ? conf.easyStar3 : 1, s2 = conf.easyStar2 != null ? conf.easyStar2 : 0.7;
        return A.end(true, acc >= s3 - 1e-9 && !A.S.hints ? 3 : acc >= s2 - 1e-9 ? 2 : 1);
      }
      const hit = TIERS[mode].find(([need]) => acc + 1e-9 >= need);
      A.end(!!hit, hit ? hit[1] : 0);
    };
    (async () => {
      for (const [i, t] of list.entries()) {
        if (A.S.done) return;
        const gen = Array.isArray(t) ? t[0] : t;
        const q = M.make(gen, lv);
        field.draw(q.fig || M.figFor(q, cfg.node));
        const ok = await askAny(A, q, `${cfg.node.id}|g|${i}|${gen}`, { field, head: `${MODE_NAME[mode]}・目標 ${i + 1} / ${list.length}`, time, mode });
        if (A.S.done) return;
        if (A.S.hearts <= 0) return A.end(false);
        await relaxTick(ok, i === list.length - 1);
        if (A.S.done) return;
      }
      finishByAcc();
    })();
    return { stop() { A.cleanup(); } };
  }

  /* ---------- 軍械庫：照解題過程把東西送進 3 個庫房（其他科的博物館）。node.rooms、node.items（題型清單） ---------- */
  const armoryQ = (raw, rooms) => ({ q: `${raw.item}　→ 這個要放哪一庫？`, pick: rooms, ans: raw.room, fixed: true, ok: raw.ok, why: raw.why || {}, gen: raw.gen, lv: raw.lv });
  function armory(cfg) {
    const node = cfg.node, A = stage(cfg, "mx-armory");
    const rooms = node.rooms.map((r) => r.label);
    if (cfg.monster) { monsters(A); return { stop() { A.cleanup(); } }; }
    const ped = h("div", { class: "mx-ped" });
    A.fBox.append(ped);
    (async () => {
      const list = node.items;
      const shelf = rooms.map(() => []);
      for (const [i, t] of list.entries()) {
        if (A.S.done) return;
        const [gen, lv] = Array.isArray(t) ? t : [t, 1];
        const raw = M.make(gen, lv);
        M.cur = raw; // 自動測試看得到現在這一題
        const key = `${node.id}|a|${i}|${gen}`;
        ped.innerHTML = "";
        ped.append(h("div", { class: "mx-plate" }, M.tex(raw.item)));
        A.qBox.innerHTML = "";
        A.qBox.append(h("div", { class: "mx-tag" }, `第 ${i + 1} / ${list.length} 件`), h("div", { class: "mx-qt" }, M.tex(node.ask || "這件要放進哪一庫？")));
        await new Promise((res) => {
          let tries = 0, busy = false;
          A.pBox.innerHTML = "";
          const doors = node.rooms.map((r, k) => h("button", { class: "mx-door", style: `--c:${r.color || "#3f8de0"}`, onclick: () => go(k, doors[k]) },
            h("b", {}, M.tex(r.label)), r.sub ? h("span", {}, M.tex(r.sub)) : null));
          A.pBox.append(h("div", { class: "mx-doors" }, ...doors));
          const keyFn = (e) => { const n = "123".indexOf(e.key); if (n >= 0 && n < doors.length && !document.querySelector(".explain-veil")) doors[n].click(); };
          A.key(keyFn);
          const go = async (k, door) => {
            if (busy || A.S.done) return;
            busy = true;
            if (k === raw.room) {
              A.unkey(keyFn);
              A.mark(key, tries === 0, armoryQ(raw, rooms), { rooms });
              A.good(tries === 0 ? 100 : 40);
              shelf[k].push(raw.item);
              await A.card("good", `✔ 放進「${rooms[k]}」`, para(raw.ok));
              return res();
            }
            tries += 1;
            A.mark(key, false, armoryQ(raw, rooms), { rooms });
            A.hurt(false);
            door.classList.add("wrong");
            setTimeout(() => door.classList.remove("wrong"), 450);
            const msg = (raw.why && raw.why[k]) || raw.hint || "再想想看！";
            if (tries >= 2) doors[raw.room].classList.add("hint");
            await A.card("bad", "✖ 不是這一庫", para(msg));
            busy = false;
          };
        });
      }
      if (A.S.done) return;
      // 全部歸位：整理好的庫房
      A.qBox.innerHTML = "";
      A.pBox.innerHTML = "";
      A.fBox.innerHTML = "";
      A.qBox.append(h("div", { class: "mx-qt" }, "🎉 軍械庫整理好了！"));
      A.fBox.append(h("div", { class: "mx-hall", style: `grid-template-columns:repeat(${rooms.length},1fr)` }, ...node.rooms.map((r, k) => h("div", { class: "room", style: `--c:${r.color || "#3f8de0"}` },
        h("div", { class: "hd" }, M.tex(r.label)), ...shelf[k].map((x) => h("div", { class: "it" }, M.tex(x)))))));
      G.sfx("win");
      await A.card("info", "🏛️ 記住分類的理由", para(node.done || "每一件都想得出「為什麼放這裡」，下次看到新題目就不會亂。"));
      A.end(true);
    })();
    return { stop() { A.cleanup(); } };
  }

  /* ---------- 作戰會議：8 步連鎖題，前一步的答案是下一步的條件；做完組成一份作戰報告，就是考卷上要寫的過程；最後比較表 ---------- */
  function council(cfg) {
    const node = cfg.node, A = stage(cfg, "mx-council");
    if (cfg.monster) { monsters(A); return { stop() { A.cleanup(); } }; }
    const raw = M.make(node.chain, node.lv || 1);
    const notes = h("ol", { class: "mx-notes" });
    const figBox = h("div", { class: "mx-cfig" });
    const who = h("div", { class: "mx-who" }, h("img", { src: "assets/cat.webp", alt: "" }), h("div", { class: "bubble" }, M.tex(raw.ctx)));
    A.fBox.append(who, figBox, h("div", { class: "mx-book" }, h("div", { class: "hd" }, "📝 作戰報告"), notes));
    const field = raw.fig ? M.field(figBox) : null;
    if (field) field.draw(raw.fig);
    (async () => {
      await A.card("info", `🛰️ ${raw.title}`, para(raw.ctx));
      for (const [i, q] of raw.steps.entries()) {
        if (A.S.done) return;
        q.gen = raw.gen; q.lv = raw.lv;
        if (q.fig && field) field.draw(q.fig);
        await ask(A, q, `${node.id}|c|${i}`, { field, head: `第 ${i + 1} / ${raw.steps.length} 步`, ref: { step: i }, noHurt: true, fireLabel: "✔ 確定" });
        if (A.S.done) return;
        if (q.note) {
          const li = h("li", { class: "new" }, M.tex(q.note));
          notes.append(li);
          notes.scrollTop = notes.scrollHeight;
          setTimeout(() => li.classList.remove("new"), 900);
        }
      }
      A.qBox.innerHTML = "";
      A.pBox.innerHTML = "";
      await A.card("info", "📝 這就是考卷上要寫的過程", h("ol", { class: "mx-steps" }, ...raw.steps.filter((q) => q.note).map((q) => h("li", {}, M.tex(q.note)))),
        para("會考非選題看的是想法和過程，一步一步寫出來，就算算錯也拿得到分。"));
      if (node.compare && !A.S.done) await compare(A, node.compare);
      if (!A.S.done) A.end(true);
    })();
    return { stop() { A.cleanup(); } };
  }
  // 比較表：把卡片放進正確的格子（同中求異）
  function compare(A, cmp) {
    return new Promise((res) => {
      A.wrap.innerHTML = "";
      A.wrap.classList.add("cmp-on");
      const cells = [];
      const table = h("div", { class: "cmp-table", style: `grid-template-columns: 7em repeat(${cmp.cols.length}, 1fr)` },
        h("div", { class: "corner" }), ...cmp.cols.map((c) => h("div", { class: "colh" }, M.tex(c))));
      cmp.rows.forEach((row, ri) => {
        table.append(h("div", { class: "rowh" }, M.tex(row.label)));
        row.cells.forEach((t, ci) => {
          const cell = h("div", { class: "cell", onclick: () => drop(cell) });
          cell._want = `${ri}|${ci}`;
          cell._text = t;
          cells.push(cell);
          table.append(cell);
        });
      });
      const tray = h("div", { class: "cmp-tray" });
      const cards = G.shuffle(cmp.rows.flatMap((row, ri) => row.cells.map((t, ci) => ({ t, ri, ci, row: row.label }))));
      let sel = null, left = cards.length;
      cards.forEach((c) => {
        c.el = h("button", { class: "cmp-card", onclick: () => select(c) }, M.tex(c.t));
        tray.append(c.el);
      });
      const head = h("div", { class: "cmp-head" }, "📋 比較表：先點一張卡片，再點它該放的格子");
      A.wrap.append(head, table, tray);
      function select(c) {
        if (A.S.done) return;
        G.sfx("click");
        if (sel) sel.el.classList.remove("sel");
        sel = sel === c ? null : c;
        if (sel) sel.el.classList.add("sel");
      }
      function drop(cell) {
        if (!sel || cell.classList.contains("filled") || A.S.done) return;
        const c = sel, key = `${A.node.id}|cmp|${c.ri}|${c.ci}`;
        const mq = { q: `比較表「${c.row}」這一列：「${c.t}」是哪一欄？`, pick: [cmp.cols[c.ci]], ans: 0, ok: `${c.row}：${c.t} → ${cmp.cols[c.ci]}` };
        if (cell._want === `${c.ri}|${c.ci}` || cell._text === c.t) {
          A.S.results.set(key, A.S.results.has(key) ? A.S.results.get(key) : true);
          A.good(60);
          cell.classList.add("filled");
          cell.append(M.tex(c.t));
          c.el.remove();
          sel = null;
          left -= 1;
          if (left === 0) {
            G.sfx("win");
            table.classList.add("done");
            head.textContent = "📋 比較表完成！";
            setTimeout(res, 1400);
          }
        } else {
          A.S.results.set(key, false);
          A.hurt(false);
          cell.classList.add("shake");
          setTimeout(() => cell.classList.remove("shake"), 450);
          G.toast(`「${M.plain(c.t)}」不是放這一格喔！看看列和欄的標題。`);
          void mq;
        }
      }
    });
  }

  /* ---------- 雷達判讀：讀圖、讀表推理；線索翻得越少，星星越多（其他科的偵探）。node.cases 是題型清單 ---------- */
  function radar(cfg) {
    const node = cfg.node, A = stage(cfg, "mx-radar");
    if (cfg.monster) { monsters(A); return { stop() { A.cleanup(); } }; }
    (async () => {
      const list = node.cases;
      let points = 0;
      const max = list.length * 3;
      for (const [i, t] of list.entries()) {
        if (A.S.done) return;
        const [gen, lv] = Array.isArray(t) ? t : [t, 1];
        const q = M.make(gen, lv);
        A.fBox.innerHTML = "";
        const figBox = h("div", { class: "mx-rfig" });
        const field = q.fig ? M.field(figBox) : null;
        let opened = 0;
        const clueEls = (q.clues || []).map((c, k) => h("button", { class: "dt-clue mx-clue", onclick: () => open() }, h("span", { class: "back" }, `🔎 線索 ${k + 1}`), h("span", { class: "face" }, M.tex(c))));
        const worth = h("div", { class: "mx-worth" });
        const setWorth = () => {
          const p = Math.max(1, 3 - opened);
          worth.textContent = `這題現在值 ${"⭐".repeat(p)}${"☆".repeat(3 - p)}（目前 ${points} / ${max}）`;
        };
        function open() {
          const next = clueEls.findIndex((c) => !c.classList.contains("open"));
          if (next < 0 || A.S.done) return;
          clueEls[next].classList.add("open");
          opened += 1;
          G.sfx("click");
          setWorth();
        }
        A.fBox.append(figBox, h("div", { class: "mx-clues" }, worth, ...clueEls));
        if (field) field.draw(q.fig);
        setWorth();
        const before = A.S.mistakes;
        await ask(A, q, `${node.id}|r|${i}|${gen}`, { field, head: `案件 ${i + 1} / ${list.length}`, fireLabel: "🔍 破案", onRight: async () => {} });
        points += Math.max(1, 3 - opened - (A.S.mistakes - before));
        if (A.S.done) return;
        if (A.S.hearts <= 0) return A.end(false);
      }
      const ratio = points / max;
      A.end(true, ratio >= 0.8 ? 3 : ratio >= 0.55 ? 2 : 1);
    })();
    return { stop() { A.cleanup(); } };
  }

  /* ---------- 謊言巨獸：看別人算的過程，① 點出第一個算錯的那一步 ② 選出正確的做法。node.lies 是題型清單 ---------- */
  const liarQ = (raw) => {
    const okIdx = raw.fix.findIndex((f) => f.ok);
    return { q: `${raw.q}　有人算到「${raw.lines[raw.bad]}」就錯了。正確的做法是？`, pick: raw.fix.map((f) => f.t), ans: okIdx, ok: raw.ok, why: Object.fromEntries(raw.fix.map((f, i) => [i, f.why || ""])), gen: raw.gen, lv: raw.lv };
  };
  function liar(cfg) {
    const node = cfg.node, A = stage(cfg, "mx-liar");
    if (cfg.monster) { monsters(A); return { stop() { A.cleanup(); } }; }
    const list = G.shuffle(node.lies.slice());
    let hp = node.hp || 5, li = 0;
    const maxHp = hp;
    const bar = h("i");
    const pic = G.LIARS[Math.floor(Math.random() * G.LIARS.length)];
    const boss = h("div", { class: "mx-boss" }, h("div", { class: "nm" }, "👹 謊言巨獸"), h("div", { class: "hp" }, bar), h("img", { src: `assets/${pic}.webp`, alt: "" }));
    const paper = h("div", { class: "mx-paper" });
    A.fBox.append(boss, paper);
    const setHp = () => { bar.style.width = `${(hp / maxHp) * 100}%`; };
    const flinch = (cls) => { boss.classList.remove("hurt", "laugh"); void boss.offsetWidth; boss.classList.add(cls); };
    setHp();
    G.sfx("roar");
    function show() {
      const t = list[li];
      const [gen, lv] = Array.isArray(t) ? t : [t, 1];
      const raw = M.make(gen, lv);
      M.cur = raw; // 自動測試看得到現在這一題
      const key = `${node.id}|l|${li}|${gen}`, mq = liarQ(raw);
      paper.innerHTML = "";
      A.pBox.innerHTML = "";
      A.qBox.innerHTML = "";
      A.qBox.append(h("div", { class: "mx-qt" }, M.tex(raw.q)), h("div", { class: "mx-tip" }, "謊言巨獸散布了一份算錯的過程。① 第一個算錯的是哪一步？點它"));
      let found = false, misses = 0;
      const chips = raw.lines.map((l, k) => h("button", { class: "mx-line", onclick: () => tap(k) }, h("b", {}, `${k + 1}`), M.tex(l)));
      paper.append(...chips);
      function tap(k) {
        if (found || A.S.done) return;
        if (k !== raw.bad) {
          misses += 1;
          A.hurt(false);
          chips[k].classList.add("fine");
          G.toast(k < raw.bad ? "這一步沒有算錯喔！再往下找。" : "這一步是跟著前面算的，再往前找第一個錯的地方。");
          if (misses >= 2) chips[raw.bad].classList.add("hint");
          return;
        }
        found = true;
        chips[k].classList.remove("hint");
        chips[k].classList.add("bad");
        G.sfx("hit");
        flinch("hurt");
        setTimeout(truth, 600);
      }
      function truth() {
        if (A.S.done) return;
        A.qBox.lastChild.textContent = "② 這一步正確的做法是？選一張丟向巨獸！";
        let busy = false;
        const order = G.shuffle(raw.fix.map((_, k) => k));
        const okIdx = raw.fix.findIndex((f) => f.ok);
        const btns = order.map((k, n) => h("button", { class: "mx-pick", onclick: () => play(k, btns[n]) }, h("b", {}, "ABC"[n]), M.tex(raw.fix[k].t)));
        A.pBox.append(h("div", { class: "mx-picks" }, ...btns));
        const keyFn = (e) => { const n = "123".indexOf(e.key); if (n >= 0 && n < btns.length && !document.querySelector(".explain-veil")) btns[n].click(); };
        A.key(keyFn);
        async function play(k, btn) {
          if (busy || A.S.done) return;
          busy = true;
          A.unkey(keyFn);
          btns.forEach((b) => (b.disabled = true));
          const ok = raw.fix[k].ok;
          A.mark(key, ok && misses === 0, mq);
          if (ok) {
            btn.classList.add("right");
            G.sfx("shot");
            await G.sleep(300);
            G.sfx("boom");
            A.good(150);
            hp -= 1;
            setHp();
            flinch("hurt");
            await A.card("good", "✔ 謊言被戳破了！", para(raw.ok));
          } else {
            btn.classList.add("wrong");
            btns[order.indexOf(okIdx)].classList.add("right");
            G.sfx("roar");
            flinch("laugh");
            A.hurt(true);
            await A.card("bad", "✖ 這個做法也不對！", para(raw.fix[k].why), para(`正確的是：${raw.fix[okIdx].t}`), para(raw.ok));
          }
          if (A.S.done) return;
          if (hp <= 0) {
            G.sfx("win");
            boss.classList.add("dead");
            await G.sleep(900);
            return A.end(true);
          }
          if (A.S.hearts <= 0) return A.end(false);
          li += 1;
          if (li >= list.length) return A.end(false);
          show();
        }
      }
    }
    show();
    return { stop() { A.cleanup(); } };
  }

  Object.assign(G.TYPE_LABEL, { mfight: "實習指揮官", mpractice: "武器實戰", marmory: "軍械庫", mcouncil: "作戰會議", mradar: "雷達判讀", mliar: "謊言巨獸" });
  G.NODE_TYPES = Object.assign(G.NODE_TYPES || {}, { mfight: battle, mpractice: battle, marmory: armory, mcouncil: council, mradar: radar, mliar: liar });
})();
