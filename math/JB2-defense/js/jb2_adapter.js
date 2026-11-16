/* 數學保衛戰 × JB2V2 轉接層
   把 JB2V2（數靈召喚師）的題目產生器，轉成「數學保衛戰」引擎看得懂的題目格式：
   - 答案是純數字（含分數、小數、帶單位）的題目 → 數字鍵盤，真的要算、要打字
   - 答案是坐標 (x, y) 的題目 → 兩格鍵盤（x＝、y＝）
   - 其他（文字、判斷、選哪一個）→ 四選一按鈕
   - 題目附圖（svg）直接畫進戰場，怪獸是 JB2V2 的數靈 */
(function () {
  const G = window.G, M = G.M;

  /* ---------- 文字清理 ---------- */
  const clean = (s) => String(s == null ? "" : s)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/~/g, "～").replace(/\{/g, "｛").replace(/\}/g, "｝").replace(/\*\*/g, "＊＊");
  const norm = (s) => clean(s).replace(/[−－–]/g, "-").trim();

  /* ---------- 判斷「答案是不是數字」 ---------- */
  function numOf(s) {
    s = norm(s);
    let m = s.match(/^(-?\d+(?:\.\d+)?)$/);
    if (m) return { ans: +m[1], kind: m[1].includes(".") ? "dec" : "int" };
    m = s.match(/^(-?\d+)\/(\d+)$/);
    if (m && +m[2] > 0) return { ans: M.frac(+m[1], +m[2]), kind: "frac", simplest: true };
    return null;
  }
  // 12 個、30 公分、20% 這種：數字＋單位
  function withUnit(s) {
    s = norm(s);
    const m = s.match(/^(-?\d+(?:\.\d+)?(?:\/\d+)?)\s*([^\d\sA-Za-z=+()\-*/.,;:<>≤≥]{1,5})$/);
    if (!m) return null;
    const n = numOf(m[1]);
    return n ? { ...n, unit: m[2] } : null;
  }
  const PAIR = /^\(\s*(-?\d+(?:\.\d+)?)\s*[,，]\s*(-?\d+(?:\.\d+)?)\s*\)$/;
  const pairOf = (s) => { const m = norm(s).match(PAIR); return m ? [+m[1], +m[2]] : null; };
  const CHOOSE = /哪|下列|選出|何者|以下|選擇|是否|對不對|正確的|錯誤的/;

  function convert(jq, lv, type) {
    const text = clean(jq.text), opts = jq.options.map(clean), ans = clean(jq.ans);
    const ai = Math.max(0, opts.indexOf(ans));
    const explain = clean(jq.explain), hint = clean(jq.hint);
    const q = { q: text, hint, ok: explain, steps: explain ? [explain] : [] };
    q.jb = Object.assign({}, jq, { type }); // 教學模式的小老師要用原始題目資料
    if (jq.svg) q.rawSvg = jq.svg;
    // 每個錯誤選項的理由（JB2 的 why 以選項文字為 key）
    const whyOf = (i) => {
      if (!jq.why) return "";
      const w = jq.why[jq.options[i]] != null ? jq.why[jq.options[i]] : jq.why[opts[i]];
      return w ? clean(w) : "";
    };
    // 教學（lv 1）一律選擇題；挑戰、極限（lv 2、3）能算的題改成打字作答
    const calc = lv > 1 && !CHOOSE.test(text);

    if (calc) {
      // 1) 純數字（可帶單位）→ 數字鍵盤
      const a1 = numOf(ans), au = a1 ? null : withUnit(ans);
      const A = a1 || au;
      if (A) {
        const unit = au ? au.unit : "";
        const others = opts.map((o, i) => [o, i]).filter(([, i]) => i !== ai);
        const parse = au ? withUnit : numOf;
        const sameUnit = others.every(([o]) => { const v = parse(o); return !v || !au || v.unit === unit; });
        if (sameUnit) {
          q.ask = [{ ans: A.ans, kind: A.kind, simplest: A.simplest, post: unit ? " " + unit : "" }];
          q.traps = others.map(([o, i]) => { const v = parse(o); return v && whyOf(i) ? { a: v.ans, why: whyOf(i) } : null; }).filter(Boolean);
          return q;
        }
      }
      // 2) 坐標 (x, y) → 兩格鍵盤
      const p1 = pairOf(ans);
      if (p1) {
        q.ask = [{ ans: p1[0], kind: "int", pre: "x ＝" }, { ans: p1[1], kind: "int", pre: "y ＝" }];
        q.traps = opts.map((o, i) => { const v = pairOf(o); return i !== ai && v && whyOf(i) ? { a: v, why: whyOf(i) } : null; }).filter(Boolean);
        return q;
      }
    }
    // 3) 其他 → 四選一
    q.pick = opts;
    q.ans = ai;
    q.why = {};
    opts.forEach((o, i) => { if (i !== ai) q.why[i] = whyOf(i) || hint; });
    return q;
  }
  G.jb2Convert = convert;

  /* ---------- 註冊 31 關 × 各題型的產生器 ---------- */
  const MODE = ["easy", "real", "hard"];
  for (const [sid, st] of Object.entries(window.JB2.stages)) {
    for (const t of new Set(st.plan)) {
      M.gens[`${sid}:${t}`] = (r, lv) => {
        const old = Math.random;
        Math.random = () => r.next(); // 同一個 seed 出同一題；怪物回來換 seed 就換數字
        try { return convert(st.gen(t, MODE[(lv || 1) - 1] || "real"), lv || 1, t); } finally { Math.random = old; }
      };
    }
  }

  /* ---------- 戰場畫面：數靈當敵人，題目附圖畫在中間 ---------- */
  M.figFor = (q, node) => {
    const mon = { t: "ufo", name: node && node.img, emoji: node && node.emoji };
    if (q.rawSvg) {
      const vb = (q.rawSvg.match(/viewBox="([^"]+)"/) || [])[1];
      const [, , vw, vh] = (vb || "0 0 260 260").split(/\s+/).map(Number);
      const h = 8.2, w = Math.min(9.4, (h * vw) / vh);
      return { box: [0, 0, 14, 9], turret: true, items: [{ t: "raw", html: q.rawSvg, p: [7 - w / 2, 0.4], h, w }, { ...mon, p: [12.7, 4.5], s: 3.0 }] };
    }
    return { box: [-6, -3.2, 6, 3.2], items: [{ ...mon, p: [2.6, 0], s: 4 }] };
  };


  /* ---------- 結算後的選項 ----------
     教學：答對率 < 80% 問要不要重新挑戰；≥ 80% 問要不要進入挑戰版。
     挑戰、極限：60% 以上過關 → 「重新挑戰」或「直接進入下一關」。 */
  G.resultChoice = (node, r, again) => {
    const h = G.h, i = G.CH.nodes.indexOf(node), next = G.CH.nodes[i + 1];
    const pct = r.total ? Math.round((r.correct / r.total) * 100) : 0;
    const btn = (label, fn, cls) => h("button", { class: "btn " + (cls || ""), onclick: () => { G.closeOverlay(); fn(); } }, label);
    const toMap = btn("🗺️ 回地圖", () => G.backToMap(), "ghost");
    let q, btns;
    if (r.mode === "endless") {
      const inf = G.endlessInfo || { count: r.correct, best: 0, isNew: false };
      q = `♾️ 答對 ${inf.count} 題！` + (inf.isNew ? `🎉 新紀錄！${inf.best ? `（原本 ${inf.best} 題）` : ""}` : `（這關最高 ${inf.best} 題）`);
      btns = [btn("↻ 再挑戰", again), toMap];
    } else if (r.mode === "easy") {
      if (!r.cleared) { q = "這次體力用完了，要重新挑戰嗎？"; btns = [btn("↻ 重新挑戰", again), toMap]; }
      else if (pct < 80) { q = `答對率 ${pct}%，要重新挑戰嗎？`; btns = [btn("↻ 重新挑戰", again), toMap]; }
      else { q = `答對率 ${pct}%！要進入挑戰版嗎？`; btns = [btn("⚔️ 進入挑戰版", () => G.startNode(i, false, "real")), btn("↻ 再練一次", again, "ghost"), toMap]; }
    } else if (r.cleared) {
      q = `正確率 ${pct}%，過關了！`;
      btns = [btn("↻ 重新挑戰", again), next ? btn("⏭ 直接進入下一關", () => G.startNode(i + 1, false, r.mode)) : btn("🗺️ 回大地圖", () => G.backToMap()), ];
    } else { q = `正確率 ${pct}%，還差一點！`; btns = [btn("↻ 重新挑戰", again), toMap]; }
    const tick = G.S.tickets > 0 ? h("div", { class: "row", style: "justify-content:center;margin-top:6px" }, btn(`🎴 去抽卡（${G.S.tickets}）`, () => { G.backToMap(); G.openGacha(); }, "red")) : null;
    return h("div", { class: "mx-rq" }, h("div", { class: "q" }, q), h("div", { class: "row", style: "justify-content:center" }, btns), tick);
  };

  G.TYPE_LABEL.mfight = "武器實戰";
  G.loadSprites = G.loadSprites || (async () => {});

  /* ---------- 三種難度的選擇按鈕（關卡面板）與結算說明 ---------- */
  const GC = () => window.GAME_CONFIG || {};
  const secOf = (node, m) => (m === "real" ? GC().realTime || node.tReal : GC().hardTime || node.tHard) || 0;
  G.modeButtons = (i) => {
    const node = G.CH.nodes[i], h = G.h, st = G.nodeState(node.id);
    const defs = [
      ["easy", "📘 教學", "選擇題・不限時", "小老師一步一步帶你做，最高 3 ⭐"],
      ["real", "⚔️ 挑戰", `算出來打字・每題 ${GC().realTime || 90} 秒`, "答對 60% 得 3⭐、90% 得 4⭐"],
      ["hard", "🔥 極限", `算出來打字・每題 ${GC().hardTime || 60} 秒`, "60% 得 3⭐、80% 得 4⭐、全對 5⭐"],
    ];
    const need = GC().endlessNeed != null ? GC().endlessNeed : 3, endOk = st.stars >= need;
    defs.push(["endless", endOk ? "♾️ 無極限" : "🔒 無極限", "算到體力用完・越答越快", endOk ? `這關最高 ${st.endless || 0} 題` : `這關拿到 ${need} ⭐ 解鎖`]);
    return h("div", { class: "mx-modes" }, defs.map(([m, t, a, b]) =>
      h("button", { class: "mx-mode " + m, disabled: m === "endless" && !endOk ? "disabled" : null, onclick: () => { G.closeOverlay(); G.startNode(i, false, m); } },
        h("b", {}, t), h("span", {}, a), h("small", {}, b))));
  };
  G.modeSummary = (r) => {
    if (r.mode === "endless") return "♾️ 無極限：一直答到體力用完";
    const pct = r.total ? Math.round((r.correct / r.total) * 100) : 0, name = G.MODE_NAME[r.mode] || "";
    if (r.mode === "easy") return `📘 ${name}：答對率 ${pct}%` + (r.hints ? `（用了 ${r.hints} 次提示）` : "") + (r.cleared ? (r.stars === 3 ? "　🏆 完美通關！去挑戰看看吧" : r.stars === 2 ? "　再不用提示全部答對，就是 3 ⭐" : "　答對率 70% 就能拿 2 ⭐") : "");
    const tiers = (r.mode === "real" ? GC().realTiers : GC().hardTiers) || [];
    const low = tiers.length ? Math.round(tiers[tiers.length - 1][0] * 100) : 60;
    return `${r.mode === "real" ? "⚔️" : "🔥"} ${name}：正確率 ${pct}%（至少 ${low}% 才過關）` + (r.cleared ? "　✅ 過關！" : "　💪 還差一點，再挑戰一次！這關已有的星數不會減少");
  };

  /* ---------- 休息小遊戲：連續答對 N 題才出現（relax-break.bundle.js） ---------- */
  if (window.RelaxBreak) {
    const R = GC().relax || {};
    // 國中生：留短一點的遊戲（不放圍棋、象棋、暗棋、跳棋；六角寶石不給大盤）
    const games = R.games || (() => {
      const ids = RelaxBreak.REGISTRY.map((r) => r.id).filter((id) => !(R.exclude || []).includes(id));
      const o = {};
      ids.forEach((id) => { o[id] = null; });
      if (o.hexxagon === null) o.hexxagon = ["small37", "random37", "classic", "square7"];
      return o;
    })();
    RelaxBreak.init({
      every: 1e9, streak: R.streak || 4, level: R.level || "easy", adaptive: R.adaptive !== false,
      unlockWins: R.unlockWins != null ? R.unlockWins : 3, dailyLimit: R.dailyLimit || 2,
      storageKey: "math_defense_relax_v1", rewardMode: R.rewardMode || "random", games,
      canTrigger: () => !G._noRelax,
      rewards: {
        chest() { G.S.tickets += 1; G.save(); if (G.refreshSide && G.$(".screen.active")) try { G.refreshScreen(); } catch (e) {} return "🎟️ 抽卡券 +1"; },
        stage() { const c = R.stageCoins || 50; G.S.coins += c; G.save(); return `🪙 金幣 +${c}`; },
      },
      onStart() { G.paused = true; },
      onEnd() { G.paused = false; const f = G._relaxEnd; G._relaxEnd = null; if (f) f(); },
    });
  }
})();
