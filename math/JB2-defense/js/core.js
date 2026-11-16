/* 時空守護者 — core: helpers, save data, sound, overlays, dialog, monsters (spaced review), rewards */
(function () {
  const G = (window.G = {});

  /* ---------- helpers ---------- */
  G.$ = (s, r = document) => r.querySelector(s);
  G.$$ = (s, r = document) => [...r.querySelectorAll(s)];
  G.h = (tag, attrs, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "class") e.className = v;
      else if (k === "style") e.style.cssText = v;
      else if (k === "html") e.innerHTML = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      e.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return e;
  };
  G.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  G.pick = (arr) => arr[(Math.random() * arr.length) | 0];
  G.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  G.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  G.today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  G.preload = (src) =>
    new Promise((res) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = src;
    });

  /* ---------- save data ---------- */
  // 分享版（單一遊戲）用自己的存檔名，不會和全科版的進度混在一起
  const KEY = (window.CATALOG && window.CATALOG.saveKey) || "timeguard_v1";
  G.SAVE_KEY = KEY;
  const fresh = () => ({
    v: 1,
    coins: 0,
    tickets: 1,
    nodes: {}, // nodeId -> {stars, best, plays, last}
    cards: {}, // cardId -> count
    pity: 0,
    wrong: {}, // key -> {node, lvl, due, q}
    guide: {}, // chapterId -> {date, pages:[], podcast, used}
    streak: { last: "", count: 0 },
    seen: {}, // dialogs already shown
    collectDone: {},
    titles: {}, // 集滿一整篇的卡片拿到的稱號：「科目|篇名」-> {name, at}
    rewards: {
      pin: "",   // 預設密碼不放在程式裡（見 meta.js 的雜湊值）；家長在「設定」自己改密碼後才會存在這裡
      pinSet: false,
      items: [
        { id: "r1", name: "20 分鐘手機時間", cost: 3000 },
        { id: "r2", name: "50 元零用錢", cost: 6000 },
        { id: "r3", name: "週末決定晚餐吃什麼", cost: 4000 },
      ],
      log: [],
    },
    stats: { plays: 0, correct: 0, answered: 0, minutes: 0, days: {} },
    daily: { date: "", plays: {} }, // 今天每關領過幾次金幣（重玩遞減）
    settings: { sound: true, coinRate: 1 },
  });
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.v === 1) {
        const S = Object.assign(fresh(), s);
        S.settings = Object.assign(fresh().settings, s.settings);
        // 舊版預設獎勵太便宜：家長沒改過的（還是舊預設值）換成新的預設
        const NEW = { r1: ["20 分鐘手機時間", 3000], r2: ["50 元零用錢", 6000], r3: ["週末決定晚餐吃什麼", 4000] };
        const OLD = { r1: [300, 600], r2: [500, 1000], r3: [400, 800] };
        for (const it of S.rewards.items) {
          if (OLD[it.id] && OLD[it.id].includes(it.cost)) [it.name, it.cost] = NEW[it.id];
        }
        return S;
      }
    } catch (e) {}
    return fresh();
  }
  G.S = load();
  G.save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(G.S));
    } catch (e) {}
  };
  G.resetAll = () => {
    G.S = fresh();
    G.save();
  };

  /* ---------- sound (synthesized, no files) ---------- */
  let ac = null;
  const AC = () => (ac = ac || new (window.AudioContext || window.webkitAudioContext)());
  function tone(type, f0, f1, dur, vol = 0.18, delay = 0) {
    const c = AC(), t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
  function noise(dur, vol = 0.2, freq = 1800, delay = 0) {
    const c = AC(), t = c.currentTime + delay;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf;
    f.type = "lowpass";
    f.frequency.value = freq;
    g.gain.value = vol;
    src.connect(f).connect(g).connect(c.destination);
    src.start(t);
  }
  const SFX = {
    shot: () => { noise(0.09, 0.22, 3200); tone("square", 520, 120, 0.09, 0.07); },
    hit: () => { tone("square", 440, 990, 0.12, 0.12); noise(0.25, 0.25, 900, 0.03); },
    boom: () => { noise(0.5, 0.4, 700); tone("sine", 140, 40, 0.5, 0.25); },
    miss: () => { tone("sawtooth", 180, 70, 0.32, 0.16); },
    hurt: () => { tone("square", 220, 90, 0.25, 0.14); noise(0.2, 0.2, 500); },
    combo: () => [0, 0.07, 0.14].forEach((d, i) => tone("triangle", [660, 880, 1320][i], [660, 880, 1320][i], 0.1, 0.12, d)),
    coin: () => { tone("sine", 988, 988, 0.07, 0.12); tone("sine", 1319, 1319, 0.16, 0.12, 0.07); },
    star: () => tone("triangle", 520, 1560, 0.35, 0.16),
    click: () => tone("sine", 900, 600, 0.05, 0.08),
    good: () => [0, 0.06].forEach((d, i) => tone("triangle", [784, 1175][i], [784, 1175][i], 0.12, 0.13, d)),
    bad: () => tone("square", 200, 120, 0.22, 0.12),
    power: () => [0, 0.05, 0.1, 0.15].forEach((d, i) => tone("sine", 600 + i * 220, 900 + i * 220, 0.12, 0.1, d)),
    reveal: () => { [523, 659, 784, 1047].forEach((f, i) => tone("triangle", f, f, 0.6, 0.08, i * 0.05)); noise(0.6, 0.08, 6000); },
    roar: () => { tone("sawtooth", 110, 55, 0.7, 0.2); noise(0.7, 0.18, 400); },
    win: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone("triangle", f, f, 0.22, 0.12, i * 0.09)),
  };
  G.sfx = (name) => {
    if (!G.S.settings.sound) return;
    try { SFX[name] && SFX[name](); } catch (e) {}
  };

  /* ---------- screens, overlay, toast ---------- */
  G.show = (id) => {
    G.$$(".screen").forEach((s) => s.classList.toggle("active", s.id === id));
  };
  G.overlay = (build, opts = {}) => {
    const ov = G.$("#ov"), box = G.$("#ov-box");
    // 畫面上「沒有就不顯示」的項目會傳 null 進來，Element.append 會把它印成「null」字樣
    if (!box._safe) {
      const raw = box.append.bind(box);
      box.append = (...kids) => raw(...kids.filter((k) => k != null && k !== false));
      box._safe = true;
    }
    box.className = "modal parch" + (opts.wide ? " wide" : "") + (opts.cls ? " " + opts.cls : "");
    box.innerHTML = "";
    if (opts.close !== false) box.append(G.h("button", { class: "x", onclick: () => G.closeOverlay() }, "✕"));
    build(box);
    ov.classList.remove("peek");
    ov.classList.add("on");
    G._onClose = opts.onClose || null;
  };
  G.closeOverlay = () => {
    G.$("#ov").classList.remove("on");
    const cb = G._onClose;
    G._onClose = null;
    if (cb) cb();
  };
  // 答題的解說卡要停一會兒才能關，避免一直亂點跳過：色條由滿到空、文字倒數秒數，時間到才可以點（答對 2 秒、答錯 5 秒；家長 2026-11-04 把答對從 3 秒改成 2 秒）
  G.RIGHT_WAIT = 2000;
  G.WRONG_WAIT = 5000;
  G.explainWait = (card, go, ms, done) => {
    const bar = G.h("div", { class: "wait-bar" }, G.h("i", { style: `animation-duration:${ms}ms` }));
    card.insertBefore(bar, go);
    go.classList.add("wait");
    const t0 = performance.now();
    const tick = () => {
      const left = Math.ceil((ms - (performance.now() - t0)) / 1000);
      if (left > 0) {
        go.textContent = `${left} 秒後可以繼續`;
        setTimeout(tick, 200);
        return;
      }
      go.textContent = "點一下繼續 ▶";
      go.classList.remove("wait");
      bar.remove();
      card.classList.add("ready");
      if (done) done();
    };
    tick();
  };
  G.toast = (msg) => {
    const t = G.h("div", { class: "toast" }, msg);
    G.$("#toast").append(t);
    setTimeout(() => t.remove(), 2700);
  };
  G.confirm = (msg, okText = "確定") =>
    new Promise((res) => {
      G.overlay((box) => {
        box.append(
          G.h("h2", {}, msg),
          G.h("div", { class: "row", style: "justify-content:flex-end;margin-top:18px" },
            G.h("button", { class: "btn ghost", style: "color:var(--ink)", onclick: () => { G.closeOverlay(); res(false); } }, "取消"),
            G.h("button", { class: "btn", onclick: () => { G._onClose = null; G.closeOverlay(); res(true); } }, okText))
        );
      }, { onClose: () => res(false) });
    });

  /* ---------- story dialog ---------- */
  // img：換成別的說話者（例如攻城戰打完出來講話的將軍），預設是時空女神
  G.dialog = (lines, who, img) =>
    new Promise((res) => {
      // 公民的帶路人物是法槌精靈，其他科照舊是時空女神
      if (!who) {
        const civ = (G.CH && G.CH.subject === "公民") || (G.CAT && G.CAT.single === "公民"); // G.CAT.single：公民網站的標題畫面還沒進章
        who = "智慧貓";
        if (!img) img = "assets/cat.webp";
        if (civ && !img) img = "assets/npc_civ_sprite.webp";
      }
      const d = G.$("#dialog"), txt = G.$(".txt", d), pic = G.$("img.portrait", d);
      pic.src = img || "assets/goddess.webp";
      pic.classList.toggle("speaker", !!img);
      G.$(".who", d).textContent = who;
      d.classList.add("on");
      let i = 0, typing = null, full = "";
      const type = () => {
        full = lines[i];
        let n = 0;
        txt.textContent = "";
        clearInterval(typing);
        typing = setInterval(() => {
          n += 1;
          txt.textContent = full.slice(0, n);
          if (n >= full.length) { clearInterval(typing); typing = null; }
        }, 28);
      };
      const next = () => {
        G.sfx("click");
        if (typing) { clearInterval(typing); typing = null; txt.textContent = full; return; }
        i += 1;
        if (i >= lines.length) {
          d.classList.remove("on");
          d.removeEventListener("click", next);
          document.removeEventListener("keydown", key);
          res();
        } else type();
      };
      const key = (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); next(); } };
      d.addEventListener("click", next);
      document.addEventListener("keydown", key);
      type();
    });

  /* ---------- chapters ---------- */
  // 章節資料一章一個檔案（data/ch/<cid>.js），進那一章才載入；file:// 也能用 <script> 載
  window.CH_DATA = window.CH_DATA || {};
  G.CAT = window.CATALOG;
  G.loadChapter = (cid) =>
    new Promise((res, rej) => {
      if (window.CH_DATA[cid]) return res(window.CH_DATA[cid]);
      const s = document.createElement("script");
      // 付費解鎖的戰役（雲端版）向伺服器要資料，伺服器確認買過才給
      const meta = G.CAT.chapters[cid];
      s.src = meta && meta.locked ? `api/ch/${cid}.js` : `data/ch/${cid}.js`;
      s.onload = () => (window.CH_DATA[cid] ? res(window.CH_DATA[cid]) : rej(new Error("no data " + cid)));
      s.onerror = () => rej(new Error("load failed " + cid));
      document.head.append(s);
    });
  G.chapterStars = (cid) => {
    const c = G.CAT.chapters[cid];
    return c ? c.nodes.reduce((s, id) => s + G.nodeState(id).stars, 0) : 0;
  };
  G.chapterMax = (cid) => (G.CAT.chapters[cid] ? G.CAT.chapters[cid].nodes.length * 5 : 0);
  G.chapterMonsters = (cid) => {
    const c = G.CAT.chapters[cid];
    if (!c) return 0;
    const set = new Set(c.nodes);
    return G.monstersDue().filter((m) => set.has(m.node)).length;
  };
  // 有多個版本的科目（例如國文）記住孩子選的版本
  G.versionOf = (subject) => (G.S.ver || {})[subject];
  G.setVersion = (subject, v) => { G.S.ver = G.S.ver || {}; G.S.ver[subject] = v; G.save(); };

  /* ---------- cards & buffs ---------- */
  G.cardById = (id) => G.CH.cards.find((c) => c.id === id);
  // 最新拿到的稱號（章節列表的狀態列、網站上帳號名字旁邊顯示）
  G.latestTitle = () => {
    const t = Object.values(G.S.titles || {}).sort((a, b) => b.at - a.at)[0];
    return t ? t.name : null;
  };
  // 有加成效果的卡（目前只有試玩章的 5 張）跨章節都有效
  G.buff = (type) => {
    let v = 0;
    for (const [id, b] of Object.entries(G.CAT.buffs || {})) if (b.type === type && G.S.cards[id]) v += b.value;
    return v;
  };
  // 攻略本加持：讀過攻略本，當天下一關 +1 生命（用一次）
  G.guideBuffReady = () => {
    const g = G.S.guide[G.CH.id];
    return !!(g && g.date === G.today() && g.earned && !g.used);
  };
  G.useGuideBuff = () => {
    const g = G.S.guide[G.CH.id];
    if (g) { g.used = true; G.save(); }
  };

  /* ---------- monsters = spaced review of wrong answers ---------- */
  const DAY = 86400000;
  const GAPS = [0, 1, 3, 7, 14]; // 打倒第 n 次之後，隔幾天再出現
  G.wrongAdd = (key, node, q) => {
    G.S.wrong[key] = { node, lvl: 0, due: Date.now(), q };
  };
  G.wrongResult = (key, ok) => {
    const w = G.S.wrong[key];
    if (!w) return;
    if (!ok) { w.lvl = 0; w.due = Date.now(); return; }
    w.lvl += 1;
    if (w.lvl >= GAPS.length) delete G.S.wrong[key];
    else w.due = Date.now() + GAPS[w.lvl] * DAY;
  };
  G.monstersDue = (node) =>
    Object.entries(G.S.wrong)
      .filter(([, w]) => (!node || w.node === node) && w.due <= Date.now())
      .map(([key, w]) => ({ key, ...w }));
  G.monstersSleeping = () => Object.values(G.S.wrong).filter((w) => w.due > Date.now()).length;

  /* ---------- progress ---------- */
  G.nodeState = (id) => G.S.nodes[id] || { stars: 0, best: 0, plays: 0 };
  G.unlocked = (idx) => idx === 0 || G.nodeState(G.CH.nodes[idx - 1].id).stars > 0;
  G.totalStars = () => G.CH.nodes.reduce((s, n) => s + G.nodeState(n.id).stars, 0);

  G.touchStreak = () => {
    const t = G.today(), st = G.S.streak;
    if (st.last === t) return false;
    const y = new Date(Date.now() - DAY);
    const ys = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, "0")}-${String(y.getDate()).padStart(2, "0")}`;
    st.count = st.last === ys ? st.count + 1 : 1;
    st.last = t;
    return true;
  };

  /* ---------- 獎勵經濟（家長訂的標準：20 分鐘手機時間 = 3000 金幣 = 整張地圖玩兩輪） ----------
     一輪（7 關各玩一次、平均兩星）約 1,200～1,600 金幣；第一輪另有首次過關、首次三星獎勵。
     同一關一天內前 2 次全額，之後 30%、10%：要整輪玩，不能刷同一關。家長可調「金幣難度」。 */
  G.COIN_RATES = { 1.5: "寬鬆", 1: "標準", 0.6: "嚴格" };
  G.REPLAY = [1, 1, 0.3, 0.1];
  G.coinsFor = (node, r, prev) => {
    const boss = (node.type === "boss" || node.boss);
    const first = prev.stars === 0 && r.stars > 0;
    const firstThree = prev.stars < 3 && r.stars >= 3;
    let c;
    if (r.monster) c = r.results.filter((x) => x.ok).length * 10;
    else if (!r.cleared) c = r.correct * 4; // 沒過關只給一點安慰
    else c = r.correct * 12 + r.stars * (boss ? 40 : 20) + (boss ? 100 : 30) + (first ? (boss ? 120 : 40) : 0) + (firstThree ? 40 : 0);
    return { c, first, firstThree };
  };

  // 結算一關，回傳給結果畫面用的資料
  G.finishStage = (node, r) => {
    const S = G.S, prev = G.nodeState(node.id);
    const { c, first } = G.coinsFor(node, r, prev);
    if (S.daily.date !== G.today()) S.daily = { date: G.today(), plays: {} };
    const n = S.daily.plays[node.id] || 0;
    const replay = r.monster ? 1 : G.REPLAY[Math.min(n, G.REPLAY.length - 1)];
    if (!r.monster && r.cleared) S.daily.plays[node.id] = n + 1;
    const coins = Math.round(c * replay * (S.settings.coinRate || 1) * (1 + G.buff("coins")));
    let tickets = 0;
    if (first) tickets += (node.type === "boss" || node.boss) ? 2 : 1;
    const newDay = G.touchStreak();
    if (newDay && S.streak.count > 1 && S.streak.count % 3 === 0) tickets += 1;
    S.coins += coins;
    S.tickets += tickets;
    if (!r.monster) {
      S.nodes[node.id] = {
        ...prev,
        stars: Math.max(prev.stars, r.stars),
        best: Math.max(prev.best || 0, r.score || 0),
        plays: (prev.plays || 0) + 1,
        last: G.today(),
      };
    }
    S.stats.plays += 1;
    S.stats.correct += r.correct;
    S.stats.answered += r.total;
    S.stats.minutes += (r.seconds || 0) / 60;
    S.stats.days[G.today()] = (S.stats.days[G.today()] || 0) + 1;
    G.save();
    return { coins, tickets, first, replay, streakBonus: newDay && S.streak.count > 1 && S.streak.count % 3 === 0 };
  };

  // 三種錯題轉成選擇題，讓怪物戰可以重打
  G.mcqFromPair = (pair, all) => ({
    q: `「${pair.a}」是什麼？`,
    o: [pair.b, ...G.shuffle(all.filter((p) => p !== pair).map((p) => p.b)).slice(0, 3)],
    a: 0,
    ex: `${pair.a}：${pair.b}`,
  });
  G.mcqFromSort = (card, bins) => ({
    q: `「${card.t}」是哪一方？`,
    o: bins.map((b) => b.label),
    a: bins.findIndex((b) => b.id === card.bin),
    ex: `${card.t} → ${bins.find((b) => b.id === card.bin).label}`,
  });
  G.mcqFromEvent = (ev, all) => {
    const lab = (e) => String(e.label || e.y);
    const others = G.shuffle(all.filter((e) => e.y !== ev.y).map(lab)).slice(0, 3);
    const year = /^\d{3,4}$/.test(lab(ev));
    return { q: year ? `「${ev.t}」是哪一年？` : `「${ev.t}」排在哪裡？`, o: [lab(ev), ...others], a: 0, ex: `${lab(ev)}：${ev.ex}` };
  };
})();
