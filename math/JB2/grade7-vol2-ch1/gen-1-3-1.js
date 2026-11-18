/* gen-1-3-1.js — 1-3-1「聯立方程式的應用」隨機出題引擎
 *
 * 題庫來源：課本 CH1-3、習作（教用／練習／附錄）、114 基礎講義 1-3 的 43 個原題。
 * 每個原題都改寫成「題型模板」：人物、情境、數字每次重新亂數產生，答案由程式先算好並檢驗。
 *
 * 出題形式（q.type）：
 *   setup  選出正確的列式（任何題型模板都能出，逼學生真的把題目翻成方程式）
 *   check  檢查解是否合理（負數、非整數、日期不存在…；也會出「其實有合理解」的題，避免直接猜「無解」）
 *   其餘   各「題型模板」的求答案題（sumprice／twoBuy／sumdiff／diffprice／seat／swap／ratio／age／digit／pack）
 *
 * 防止「湊答案」的設計：
 *   1. 數字每次不同，且兩個條件都要用到才會得到整數解（程式反推，保證有整數解）。
 *   2. 錯誤選項＝「列式列錯之後算出來的答案」，不是隨便的 ±1。
 *   3. 加入「間接問法」（兩數乘積、面積、改變分組後的帳篷數…），光猜 x 或 y 沒有用。
 *   4. 一定有 1/4 以上是「選列式」與「判斷合理性」，不用計算就必須讀懂題意。
 *
 * 對外：window.G131 = { make(type, lv), TYPES, PLAN_ALL, buildPlan(lv), LABELS, _FAM }
 *   lv：1＝練兵、2＝實戰、3＝修羅
 *   make 回傳：{ text, ans, options, hint, explain, tutor, tutorFinal, why, labels?, type, fam }
 */
(function (root) {
  'use strict';
  const EPS = 1e-7;
  const R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = a => a[R(0, a.length - 1)];
  const sh = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = R(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const near = (a, b) => Math.abs(a - b) < EPS;
  const isInt = v => near(v, Math.round(v));
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; };
  const lv3 = (lv, a, b, c) => lv <= 1 ? a : lv === 2 ? b : c;
  const rr = (lv, a, b, c) => { const r = lv3(lv, a, b, c); return R(r[0], r[1]); };

  const NAMES = ['小芳', '小美', '浩南', '依霖', '宗正', '家禾', '柏睿', '芝璇', '品謙', '梓茹', '小康', '小德', '阿草', '斌斌', '立翔', '雨珊', '欣言', '小妍', '小文', '俞秀', '宇涵', '倖誼', '彬崎', '杉田'];
  const who = () => pick(NAMES);
  const who2 = () => { const a = sh(NAMES); return [a[0], a[1]]; };

  /* ---------- 數字／算式字串 ---------- */
  function nstr(v) { v = isInt(v) ? Math.round(v) : Math.round(v * 1e6) / 1e6; return String(v).replace('-', '−'); }
  function fracStr(v) {
    if (isInt(v)) return nstr(v);
    for (let d = 2; d <= 60; d++) { const n = v * d; if (near(n, Math.round(n))) { const r = Math.round(n), g = gcd(r, d); return (r < 0 ? '−' : '') + Math.abs(r) / g + '/' + d / g; } }
    return nstr(v);
  }
  function term(co, v, first) {
    const ab = Math.abs(co), body = near(ab, 1) ? v : nstr(ab) + v;
    return first ? (co < 0 ? '−' : '') + body : ' ' + (co < 0 ? '−' : '+') + ' ' + body;
  }
  function stdStr(a, b, c) {
    let s = '';
    if (!near(a, 0)) s += term(a, 'x', true);
    if (!near(b, 0)) s += s ? term(b, 'y', false) : term(b, 'y', true);
    if (!s) s = '0';
    return s + ' = ' + nstr(c);
  }
  function relStr(base, k, c) {
    const o = base === 'x' ? 'y' : 'x';
    let rhs = '';
    if (!near(k, 0)) rhs += term(k, o, true);
    if (!near(c, 0)) rhs += rhs ? (c < 0 ? ' − ' : ' + ') + nstr(Math.abs(c)) : nstr(c);
    if (!rhs) rhs = '0';
    return base + ' = ' + rhs;
  }
  function solve2(e1, e2) {
    const det = e1.a * e2.b - e2.a * e1.b;
    if (near(det, 0)) return null;
    return [(e1.c * e2.b - e2.c * e1.b) / det, (e1.a * e2.c - e2.a * e1.c) / det];
  }

  /* ---------- 方程式物件：{ s 字串, a,b,c 係數（a x + b y = c）, t 這條在說什麼, w 常見錯誤寫法 } ---------- */
  const mk = (s, a, b, c, t, w) => ({ s, a, b, c, t: t || '', w: w || [] });
  const vr = (a, b, c, why, s) => ({ s: s || stdStr(a, b, c), a, b, c, why });
  function stdEq(a, b, c, t, extra) {
    const e = mk(stdStr(a, b, c), a, b, c, t, []);
    e.std = true;
    if (!near(a, b)) e.w.push(vr(b, a, c, a * b < 0 ? '被減數和減數弄反了（「多」的那一個才是被減數）' : '係數放到了錯的未知數（x、y 搞反了）'));
    e.w.push(vr(a, -b, c, b < 0 ? '「相差」是相減，卻寫成了相加' : '兩個量「合起來」是相加，卻寫成了相減'));
    (extra || []).forEach(x => e.w.push(x));
    return e;
  }
  function relEq(base, k, c, t) {
    const o = base === 'x' ? 'y' : 'x';
    const co = (bs, kk, cc) => bs === 'x' ? { a: 1, b: -kk, c: cc } : { a: -kk, b: 1, c: cc };
    const e = mk(relStr(base, k, c), co(base, k, c).a, co(base, k, c).b, co(base, k, c).c, t, []);
    e.w.push(Object.assign({ s: relStr(o, k, c), why: '「幾倍／比誰多」的對象弄反了' }, co(o, k, c)));
    if (!near(c, 0)) {
      e.w.push(Object.assign({ s: relStr(base, k, -c), why: '「多」和「少」弄反了' }, co(base, k, -c)));
      e.w.push(Object.assign({ s: relStr(base, k, 0), why: '漏掉了「多／少」的那一部分' }, co(base, k, 0)));
    }
    return e;
  }
  function cus(s, a, b, c, t, ws) { return mk(s, a, b, c, t, (ws || []).map(w => vr(w[0], w[1], w[2], w[4], w[3]))); }
  // cus 的 wrong 格式：[a, b, c, 字串, 原因]

  const sysStr = (e1, e2) => e1.s + ' ； ' + e2.s;
  const equiv = (u, v) => { // 兩條一次式是否同一條
    const m = [[u.a, u.b, u.c], [v.a, v.b, v.c]];
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (!near(m[0][i] * m[1][j] - m[0][j] * m[1][i], 0)) return false;
    return true;
  };

  function sysDistractors(E1, E2, sol) {
    const cand = [], combos = [];
    E1.w.forEach(w => cand.push({ a: w, b: E2, why: w.why }));
    E2.w.forEach(w => cand.push({ a: E1, b: w, why: w.why }));
    if (E1.std && E2.std && !near(E1.c, E2.c)) cand.push({ a: vr(E1.a, E1.b, E2.c), b: vr(E2.a, E2.b, E1.c), why: '兩個「總量」（等號右邊的數）放到了對方的式子' });
    E1.w.forEach(w1 => E2.w.forEach(w2 => combos.push({ a: w1, b: w2, why: '第 1 式：' + w1.why + '；第 2 式：' + w2.why })));
    const seen = new Set([sysStr(E1, E2)]), out = [];
    sh(cand).concat(sh(combos)).forEach(c => {
      const k = sysStr(c.a, c.b);
      if (seen.has(k)) return;
      if (equiv(c.a, E1) && equiv(c.b, E2)) return;
      const s = solve2(c.a, c.b);
      if (s && near(s[0], sol[0]) && near(s[1], sol[1])) return;
      seen.add(k); out.push({ sys: k, why: c.why, sol: s });
    });
    return out;
  }

  /* ---------- 小老師步驟、選項 ---------- */
  function eqSteps(S) {
    return [S.eqs[0], S.eqs[1]].map((e, i) => ({
      say: (i === 0 ? S.setupStmt + '。' : '') + '第 ' + (i + 1) + ' 個等量關係是「' + e.t + '」，列成方程式是？',
      hint: '看清楚是「相加」還是「相減」，每個數字要跟著它自己的未知數。',
      ok: e.s,
      wrong: uniqWrong(sh(e.w).map(w => [w.s, w.why]), e.s).slice(0, 3),
      line: e.s
    }));
  }
  function uniqWrong(wr, ok) { const seen = new Set([ok]); return wr.filter(w => { if (seen.has(w[0])) return false; seen.add(w[0]); return true; }); }
  function solveSteps(S, wrongSys) {
    const [x0, y0] = S.sol;
    const mkv = (val, other, nm) => {
      const wr = [[fracStr(other), '這是另一個未知數的值，x 和 y 搞混了。']];
      wrongSys.forEach(w => { if (w.sol && isFinite(w.sol[nm === 'x' ? 0 : 1])) { const v = w.sol[nm === 'x' ? 0 : 1]; if (isInt(v) && !near(v, val) && !near(v, other)) wr.push([fracStr(v), '列式錯誤時才會算出這個值。']); } });
      [2, -2, 3, -3, 5].forEach(d => { if (val + d >= 1) wr.push([fracStr(val + d), '計算時再檢查一次（可以代回兩個式子驗算）。']); });
      return uniqWrong(wr, fracStr(val));
    };
    return [
      { say: '兩式合起來解聯立方程式（代入消去或加減消去），x 等於多少？', hint: '把一個式子的 y（或 x）整個代進另一個式子，或把兩式相加／相減消去一個未知數。', ok: fracStr(x0), wrong: mkv(x0, y0, 'x').slice(0, 3), line: 'x = ' + fracStr(x0) },
      { say: '把 x = ' + fracStr(x0) + ' 代回其中一個式子，y 等於多少？', hint: '挑係數簡單的那個式子代入。', ok: fracStr(y0), wrong: mkv(y0, x0, 'y').slice(0, 3), line: 'y = ' + fracStr(y0) }
    ];
  }

  function finishQ(q, S, kind) { q.fam = S.fam; q.type = kind; return q; }

  /* ---------- 組「求答案」題 ---------- */
  function ensureOpts(ans, ordered, whyMap) {
    const set = new Map();
    ordered.forEach(([v, why]) => { const s = String(v); if (s !== ans && !set.has(s)) set.set(s, why); });
    return set;
  }
  function numFill(ansN, set, minV) {
    for (const d of [2, -2, 3, -3, 4, -4, 5, -5, 6, 8, 10, -6, 7, -7]) {
      if (set.size >= 3) break;
      const v = ansN + d, s = String(v);
      if (v >= minV && !set.has(s) && s !== String(ansN)) set.set(s, '計算過程中少算或多算了一步，可以把答案代回兩個條件檢查。');
    }
  }
  function mkAnswer(S, lv) {
    const asks = S.asks.filter(a => !a.minLv || a.minLv <= lv);
    let ask = pick(asks), pair = false;
    if (lv >= 3 && S.pair && Math.random() < 0.35) { pair = true; ask = S.pair; }
    const [x0, y0] = S.sol;
    const wrongSys = sysDistractors(S.eqs[0], S.eqs[1], S.sol);
    let ans, options, why = {};
    if (!pair) {
      const av = ask.f(x0, y0); ans = String(Math.round(av));
      const set = new Map();
      wrongSys.forEach(w => { if (w.sol) { const v = ask.f(w.sol[0], w.sol[1]); if (isFinite(v) && isInt(v) && v >= 1 && String(Math.round(v)) !== ans && !set.has(String(Math.round(v)))) set.set(String(Math.round(v)), '列式出錯：' + w.why + '，就會算出這個答案。'); } });
      [[x0, '這只是' + S.vx + '，題目問的不是它。'], [y0, '這只是' + S.vy + '，題目問的不是它。']].forEach(([v, w]) => { const s = String(Math.round(v)); if (isInt(v) && v >= 1 && s !== ans && !set.has(s) && !(ask.plain)) set.set(s, w); });
      (ask.alts || []).forEach(([v, w]) => { const s = String(Math.round(v)); if (isFinite(v) && isInt(v) && v >= 1 && s !== ans && !set.has(s)) set.set(s, w); });
      numFill(Math.round(av), set, 1);
      const keys = sh([...set.keys()]).slice(0, 3);
      options = sh([ans, ...keys]);
      keys.forEach(k => why[k] = set.get(k));
    } else {
      const P = (a, b) => '(' + a + ', ' + b + ')';
      const [a0, b0] = ask.f(x0, y0); ans = P(a0, b0);
      const set = new Map();
      set.set(P(b0, a0), '兩個答案的順序放反了。');
      wrongSys.forEach(w => { if (w.sol) { const [a, b] = ask.f(w.sol[0], w.sol[1]); if (isInt(a) && isInt(b) && a >= 1 && b >= 1 && P(Math.round(a), Math.round(b)) !== ans) set.set(P(Math.round(a), Math.round(b)), '列式出錯：' + w.why); } });
      for (const d of [1, 2, 3, -1, -2, -3]) { if (set.size >= 5) break; if (a0 + d >= 1 && b0 - d >= 1) set.set(P(a0 + d, b0 - d), '一個多、一個少，總數沒變，但兩者的值算錯了。'); }
      for (const d of [1, 2, 3]) { if (set.size >= 6) break; set.set(P(a0 + d, b0), '其中一個值算錯了。'); }
      const keys = sh([...set.keys()].filter(k => k !== ans)).slice(0, 3);
      options = sh([ans, ...keys]); keys.forEach(k => why[k] = set.get(k));
    }
    const text = S.story + (pair ? S.pair.q : ask.q);
    const tutor = eqSteps(S).concat(solveSteps(S, wrongSys));
    const explain = S.setupStmt + '。列式：' + S.eqs[0].s + '（' + S.eqs[0].t + '）、' + S.eqs[1].s + '（' + S.eqs[1].t + '）。解得 x＝' + fracStr(x0) + '、y＝' + fracStr(y0) + '。' + (ask.how ? ask.how(x0, y0) + '。' : '') + '代回兩個條件檢查，數量都合理。';
    const q = { text, ans, options, hint: S.hint, explain, tutor, tutorFinal: '題目問的是：「' + (pair ? S.pair.q : ask.q) + '」把算出的 x、y 對照題目，答案是？', why };
    if (pair) q.labels = S.pair.lab;
    return finishQ(q, S, S.fam);
  }

  /* ---------- 組「選列式」題 ---------- */
  function mkSetup(S) {
    const D = sysDistractors(S.eqs[0], S.eqs[1], S.sol);
    const ans = sysStr(S.eqs[0], S.eqs[1]);
    const take = sh(D).slice(0, 3), why = {};
    take.forEach(d => why[d.sys] = d.why);
    const options = sh([ans, ...take.map(d => d.sys)]);
    const text = S.story + S.setupStmt + '。下列哪一組聯立方程式符合題意？';
    const explain = S.setupStmt + '。列式：' + S.eqs[0].s + '（' + S.eqs[0].t + '）；' + S.eqs[1].s + '（' + S.eqs[1].t + '）。解得 x＝' + fracStr(S.sol[0]) + '、y＝' + fracStr(S.sol[1]) + '，代回兩式都成立。';
    const q = { text, ans, options, hint: '一個條件寫一條方程式：先找出題目裡的兩個「等量關係」，再檢查每個數字有沒有跟對未知數、加減號有沒有對。', explain, tutor: eqSteps(S), tutorFinal: '把兩個方程式合起來，哪一組聯立方程式符合題意？', why };
    return finishQ(q, S, 'setup');
  }

  /* =========================================================
   *  題型模板（FAM）：回傳規格 S
   *  S = { fam, story, setupStmt, vx, vy, eqs:[E1,E2], sol:[x0,y0], asks:[{q,f,alts?,how?,minLv?}], pair?:{q,lab,f}, hint }
   * ========================================================= */
  const FAM = {};
  const askX = (q, extra) => Object.assign({ q, f: x => x }, extra || {});
  const askY = (q, extra) => Object.assign({ q, f: (x, y) => y }, extra || {});
  const distinctPair = (lv, a, b, c) => { let x, y, g = 0; do { x = rr(lv, a, b, c); y = rr(lv, a, b, c); } while (x === y && g++ < 50); if (x === y) y = x + 1; return [x, y]; };

  /* 1. 加總數量（總數＋總價）：引例水果、投籃、存錢筒、郵票、火鍋料、票價、文具 */
  FAM.sumprice = lv => {
    const [x0, y0] = distinctPair(lv, [4, 10], [5, 16], [6, 24]);
    const N = x0 + y0, w = who();
    const sc = pick([
      () => { const [p, q] = pick([[3, 5], [4, 6], [2, 5], [4, 7], [3, 8], [5, 8]]); const T = p * x0 + q * y0; return { p, q, A: p + ' 顆裝', B: q + ' 顆裝', u: '盒', story: `把 ${T} 顆水果分裝成 ${p} 顆一盒與 ${q} 顆一盒，總共裝成 ${N} 盒。`, t1: `兩種盒子合計 ${N} 盒`, t2: `水果共 ${T} 顆`, st: `設 ${p} 顆裝有 x 盒、${q} 顆裝有 y 盒`, ask: A => `${A}的有幾盒？` }; },
      () => { const [p, q] = pick([[2, 3]]); const T = p * x0 + q * y0; return { p, q, A: p + ' 分球', B: q + ' 分球', u: '顆', story: `投籃遊戲可以投 2 分球與 3 分球。${w}共投進 ${N} 球，總共得 ${T} 分。`, t1: `共投進 ${N} 球`, t2: `總共得 ${T} 分`, st: `設投進 2 分球 x 顆、3 分球 y 顆`, ask: A => `${A}投進幾顆？` }; },
      () => { const [p, q] = pick([[50, 10], [100, 10], [50, 5], [10, 5], [100, 50]]); const T = p * x0 + q * y0; return { p, q, A: p + ' 元硬幣', B: q + ' 元硬幣', u: '枚', story: `${w}的存錢筒裡只有 ${p} 元硬幣和 ${q} 元硬幣，共 ${N} 枚，合計 ${T} 元。`, t1: `共 ${N} 枚`, t2: `合計 ${T} 元`, st: `設 ${p} 元硬幣有 x 枚、${q} 元硬幣有 y 枚`, ask: A => `${A}有幾枚？` }; },
      () => { const [p, q] = pick([[12, 5], [8, 3], [10, 6], [15, 9], [20, 8]]); const T = p * x0 + q * y0; return { p, q, A: p + ' 元郵票', B: q + ' 元郵票', u: '張', story: `${w}到郵局買面額 ${p} 元和 ${q} 元的兩種郵票，共 ${N} 張，總共花了 ${T} 元。`, t1: `共 ${N} 張`, t2: `共花 ${T} 元`, st: `設 ${p} 元郵票買 x 張、${q} 元郵票買 y 張`, ask: A => `${A}買了幾張？` }; },
      () => { const [A, B] = pick([['燕餃', '茼蒿'], ['魚餃', '高麗菜'], ['貢丸', '玉米']]); const [p, q] = pick([[50, 40], [60, 35], [45, 30], [80, 55]]); const T = p * x0 + q * y0; return { p, q, A, B, u: '包', story: `${w}買${A}（一包 ${p} 元）與${B}（一包 ${q} 元），共 ${N} 包，合計 ${T} 元。`, t1: `共 ${N} 包`, t2: `合計 ${T} 元`, st: `設${A}買 x 包、${B}買 y 包`, ask: A2 => `${A2}買了幾包？` }; },
      () => { const [A, B] = pick([['大人票', '小孩票'], ['全票', '學生票']]); const [p, q] = pick([[100, 60], [120, 70], [150, 80], [200, 120], [80, 50]]); const T = p * x0 + q * y0; return { p, q, A, B, u: '張', story: `園遊會的${A}每張 ${p} 元、${B}每張 ${q} 元。共賣出 ${N} 張票，收入 ${T} 元。`, t1: `共賣出 ${N} 張`, t2: `收入 ${T} 元`, st: `設${A}賣出 x 張、${B}賣出 y 張`, ask: A2 => `${A2}賣出幾張？` }; },
      () => { const [p, q] = pick([[25, 5], [30, 8], [20, 6], [35, 10], [18, 4]]); const T = p * x0 + q * y0; return { p, q, A: '原子筆', B: '鉛筆', u: '枝', story: `${w}到文具店買原子筆（1 枝 ${p} 元）和鉛筆（1 枝 ${q} 元），共買 ${N} 枝，花了 ${T} 元。`, t1: `共買 ${N} 枝`, t2: `共花 ${T} 元`, st: `設原子筆買 x 枝、鉛筆買 y 枝`, ask: A => `${A}買了幾枝？` }; }
    ])();
    const asks = [askX(sc.ask(sc.A)), askY(sc.ask(sc.B))];
    const hi = x0 > y0 ? [sc.A, sc.B, x0 - y0] : [sc.B, sc.A, y0 - x0];
    asks.push({ q: `${hi[0]}比${hi[1]}多幾${sc.u}？`, f: (x, y) => Math.abs(x - y), minLv: 2, how: () => `題目問的是兩者的差，所以答案是 ${hi[2]}`, alts: [[N, '這是兩種的總和，題目問的是相差。']] });
    return {
      fam: 'sumprice', story: sc.story, setupStmt: sc.st, vx: sc.A + '的數量', vy: sc.B + '的數量',
      eqs: [stdEq(1, 1, N, sc.t1), stdEq(sc.p, sc.q, sc.p * x0 + sc.q * y0, sc.t2)], sol: [x0, y0], asks,
      pair: { q: `求${sc.A}與${sc.B}各幾${sc.u}？`, lab: [sc.A, sc.B], f: (x, y) => [x, y] },
      hint: '找兩個等量關係：一個是「兩種東西的數量加起來」，另一個是「總共多少（錢／分數／顆數）」＝每種的單價×數量，再相加。'
    };
  };

  /* 2. 兩次購買（例1 黑盤金盤、練習1 筆記本原子筆） */
  FAM.twoBuy = lv => {
    let a1, b1, a2, b2, g = 0;
    do { a1 = R(1, 6); b1 = R(1, 6); a2 = R(1, 6); b2 = R(1, 6); } while ((a1 * b2 - a2 * b1 === 0 || (a1 === a2 && b1 === b2)) && g++ < 100);
    let x0, y0;
    if (lv === 1) { [x0, y0] = distinctPair(1, [2, 12], [2, 12], [2, 12]).map(v => v * 5); } else { [x0, y0] = distinctPair(lv, [10, 40], [8, 60], [12, 98]); }
    const C1 = a1 * x0 + b1 * y0, C2 = a2 * x0 + b2 * y0, [w1, w2] = who2();
    const sc = pick([
      { A: '黑盤', B: '金盤', cA: '盤', cB: '盤', vb: '吃了', pa: n => `${n}每盤`, pc: '盤' },
      { A: '筆記本', B: '原子筆', cA: '本', cB: '枝', vb: '買了', pa: n => `${n}每${n === '筆記本' ? '本' : '枝'}`, tail: '在同一間書局' },
      { A: '蛋餅', B: '豆漿', cA: '份', cB: '杯', vb: '買了', pa: n => `${n}每${n === '蛋餅' ? '份' : '杯'}`, tail: '在同一家早餐店' },
      { A: '蘋果', B: '橘子', cA: '顆', cB: '顆', vb: '買了', pa: n => `${n}每顆`, tail: '在同一個水果攤' }
    ]);
    const item = (n, c, a) => `${a} ${c}${n}`;
    const story = `${w1}${sc.vb} ${item(sc.A, sc.cA, a1)}、${item(sc.B, sc.cB, b1)}，共 ${C1} 元；${w2}${sc.tail ? sc.tail : ''}${sc.vb} ${item(sc.A, sc.cA, a2)}、${item(sc.B, sc.cB, b2)}，共 ${C2} 元。`;
    return {
      fam: 'twoBuy', story, setupStmt: `設${sc.pa(sc.A)} x 元、${sc.pa(sc.B)} y 元`, vx: sc.A + '的單價', vy: sc.B + '的單價',
      eqs: [stdEq(a1, b1, C1, `${w1}買的 ${a1} ${sc.cA}${sc.A}加 ${b1} ${sc.cB}${sc.B}共 ${C1} 元`), stdEq(a2, b2, C2, `${w2}買的 ${a2} ${sc.cA}${sc.A}加 ${b2} ${sc.cB}${sc.B}共 ${C2} 元`)], sol: [x0, y0],
      asks: [askX(`${sc.pa(sc.A)}多少元？`, { plain: false }), askY(`${sc.pa(sc.B)}多少元？`)],
      pair: { q: `求${sc.A}與${sc.B}的單價各多少元？`, lab: [sc.A, sc.B], f: (x, y) => [x, y] },
      hint: '兩個人各買一次，就有兩個「總價」的條件：單價×數量，兩種相加，等於各自付的錢。'
    };
  };

  /* 3. 和差問題 */
  FAM.sumdiff = lv => {
    const y0 = rr(lv, [5, 14], [6, 20], [8, 28]), D = rr(lv, [2, 8], [2, 12], [3, 16]), x0 = y0 + D, S = x0 + y0;
    const sc = pick([
      () => { const k = pick(['七年一班', '七年八班', '八年三班', '七年甲班']); return { A: '男生', B: '女生', u: '人', story: `${k}學生共 ${S} 人，其中男生比女生多 ${D} 人。`, t1: `男女合計 ${S} 人`, t2: `男生比女生多 ${D} 人`, st: '設男生 x 人、女生 y 人', a1: '男生有幾人？', a2: '女生有幾人？' }; },
      () => { const [p, q] = who2(); return { A: p, B: q, u: '元', story: `${p}和${q}的零用錢總和為 ${S} 元，且${p}比${q}多 ${D} 元。`, t1: `兩人零用錢合計 ${S} 元`, t2: `${p}比${q}多 ${D} 元`, st: `設${p}有 x 元、${q}有 y 元`, a1: `${p}有多少元？`, a2: `${q}有多少元？` }; },
      () => ({ A: '甲箱', B: '乙箱', u: '顆', story: `一袋 ${S} 顆水果分給甲、乙兩箱，甲箱要比乙箱多 ${D} 顆。`, t1: `兩箱合計 ${S} 顆`, t2: `甲箱比乙箱多 ${D} 顆`, st: '設甲箱 x 顆、乙箱 y 顆', a1: '甲箱裝幾顆？', a2: '乙箱裝幾顆？' }),
      () => ({ A: '甲', B: '乙', u: '元', dinner: true, story: `甲、乙兩人去吃飯，甲去結帳，共付了 ${S} 元，甲的餐費比乙多 ${D} 元。`, t1: `兩人餐費合計 ${S} 元`, t2: `甲的餐費比乙多 ${D} 元`, st: '設甲的餐費為 x 元、乙的餐費為 y 元', a1: null, a2: '乙要給甲多少元？' }),
      () => ({ A: '大數', B: '小數', u: '', num: true, story: `兩數相加等於 ${S}，而且兩數相減是 ${D}。`, t1: `兩數的和是 ${S}`, t2: `兩數的差是 ${D}`, st: '設大數為 x、小數為 y', a1: '較大的數是多少？', a2: '較小的數是多少？' })
    ])();
    const asks = [];
    if (sc.a1) asks.push(askX(sc.a1)); asks.push(askY(sc.a2));
    if (sc.num) asks.push({ q: '兩數的乘積是多少？', f: (x, y) => x * y, minLv: 2, how: () => `題目問乘積：${x0} × ${y0} = ${x0 * y0}`, alts: [[S, '這是兩數的和。']] });
    return {
      fam: 'sumdiff', story: sc.story, setupStmt: sc.st, vx: sc.A, vy: sc.B,
      eqs: [stdEq(1, 1, S, sc.t1), stdEq(1, -1, D, sc.t2)], sol: [x0, y0], asks,
      pair: sc.num || sc.dinner ? null : { q: `求${sc.A}與${sc.B}各幾${sc.u}？`.replace('各幾元', '各多少元').replace('各幾', '各幾'), lab: [sc.A, sc.B], f: (x, y) => [x, y] },
      hint: '「合計／共」是相加，「比…多」是相減（多的減少的）；兩式相加可以消去 y。'
    };
  };

  /* 4. 相差＋總價（引例芋圓鮮奶、練習2椰果） */
  FAM.diffprice = lv => {
    const y0 = lv === 1 ? R(4, 9) * 5 : R(lv === 2 ? 12 : 15, lv === 2 ? 45 : 70), d = lv === 1 ? R(1, 4) * 5 : R(3, 25), x0 = y0 + d;
    let p, q; if (Math.random() < 0.25) { p = 1; q = 2; } else { p = R(2, 14); q = R(2, 14); }
    const T = p * x0 + q * y0, w = who();
    const sc = pick([
      { A: '芋圓鮮奶', B: '珍珠奶茶', c: '杯', fx: `${w}買了`, tl: '班上家長' },
      { A: '雞腿便當', B: '排骨便當', c: '個', fx: `${w}訂了`, tl: '' },
      { A: '精裝筆記本', B: '普通筆記本', c: '本', fx: `${w}買了`, tl: '' },
      { A: '大杯紅茶', B: '小杯紅茶', c: '杯', fx: `${w}請客買了`, tl: '' }
    ]);
    const cnt = p === 1 && q === 2 ? `1 ${sc.c}${sc.A}和 2 ${sc.c}${sc.B}` : `${p} ${sc.c}${sc.A}、${q} ${sc.c}${sc.B}`;
    return {
      fam: 'diffprice', story: `${sc.fx}${cnt}，1 ${sc.c}${sc.A}比 1 ${sc.c}${sc.B}貴 ${d} 元，全部共 ${T} 元。`, setupStmt: `設${sc.A}每${sc.c} x 元、${sc.B}每${sc.c} y 元`, vx: sc.A + '的單價', vy: sc.B + '的單價',
      eqs: [relEq('x', 1, d, `${sc.A}比${sc.B}貴 ${d} 元`), stdEq(p, q, T, `${p} ${sc.c}${sc.A}加 ${q} ${sc.c}${sc.B}共 ${T} 元`)], sol: [x0, y0],
      asks: [askX(`${sc.A}每${sc.c}多少元？`), askY(`${sc.B}每${sc.c}多少元？`)],
      pair: { q: `求${sc.A}與${sc.B}每${sc.c}各多少元？`, lab: [sc.A, sc.B], f: (x, y) => [x, y] },
      hint: '「貴 d 元」→ 貴的 = 便宜的 + d；總價＝單價×數量再相加。可以把第一式代入第二式。'
    };
  };

  /* 5. 分配問題（人數＋金額；每輛／每間都坐滿）、鳳梨酥、帳篷 */
  FAM.seat = lv => {
    let x0, y0, p, q, g = 0, S;
    for (;;) {
      [x0, y0] = distinctPair(lv, [2, 8], [2, 12], [3, 16]);
      const k = R(0, 4);
      if (k === 0) { [p, q] = pick([[2, 3], [2, 4], [3, 4], [3, 6]]); const c1 = R(2, 8) * 50, c2 = R(2, 8) * 50; if (p * c2 - q * c1 === 0) continue; const P = p * x0 + q * y0; if (P > 90 && g++ < 60) continue; S = { P, c1, c2, C: c1 * x0 + c2 * y0, A: p + ' 人座', B: q + ' 人座', u: '輛', story: `八里的協力車有 ${p} 人座（一輛 ${c1} 元）與 ${q} 人座（一輛 ${c2} 元）。全班 ${P} 人，租車共花 ${c1 * x0 + c2 * y0} 元，每輛車都坐滿。`, st: `設${p} 人座租 x 輛、${q} 人座租 y 輛`, t1: `每輛坐滿，共載 ${P} 人`, t2: `租金共 ${c1 * x0 + c2 * y0} 元` }; }
      else if (k === 1) { [p, q] = pick([[4, 6], [2, 4], [3, 5], [4, 8]]); const c1 = R(4, 14) * 500, c2 = R(4, 14) * 500; if (p * c2 - q * c1 === 0) continue; const P = p * x0 + q * y0; if (P > 90 && g++ < 60) continue; S = { P, c1, c2, C: c1 * x0 + c2 * y0, A: p + ' 人房', B: q + ' 人房', u: '間', story: `墾丁民宿有 ${p} 人房（一間 ${c1} 元）與 ${q} 人房（一間 ${c2} 元）。全班 ${P} 人住宿共花 ${c1 * x0 + c2 * y0} 元，每間房都住滿。`, st: `設${p} 人房租 x 間、${q} 人房租 y 間`, t1: `每間住滿，共住 ${P} 人`, t2: `住宿費共 ${c1 * x0 + c2 * y0} 元` }; }
      else if (k === 2) { [p, q] = pick([[5, 8], [4, 6], [3, 5], [6, 8]]); const c1 = R(8, 20) * 100, c2 = R(10, 28) * 100; if (p * c2 - q * c1 === 0) continue; const P = p * x0 + q * y0; if (P > 100 && g++ < 60) continue; S = { P, c1, c2, C: c1 * x0 + c2 * y0, A: p + ' 人座', B: q + ' 人座', u: '艘', story: `墾丁的香蕉船有 ${p} 人座（一艘 ${c1} 元）與 ${q} 人座（一艘 ${c2} 元）。全班 ${P} 人搭乘共花 ${c1 * x0 + c2 * y0} 元，每艘都坐滿。`, st: `設${p} 人座搭 x 艘、${q} 人座搭 y 艘`, t1: `每艘坐滿，共載 ${P} 人`, t2: `船費共 ${c1 * x0 + c2 * y0} 元` }; }
      else if (k === 3) { [p, q] = pick([[6, 8], [10, 12], [6, 9], [8, 12]]); const c1 = R(8, 16) * 25, c2 = R(10, 20) * 25; if (p * c2 - q * c1 === 0) continue; const P = p * x0 + q * y0; S = { P, c1, c2, C: c1 * x0 + c2 * y0, A: p + ' 入裝', B: q + ' 入裝', u: '盒', story: `${who()}買 ${p} 入裝（一盒 ${c1} 元）與 ${q} 入裝（一盒 ${c2} 元）鳳梨酥各若干盒，共 ${P} 個，全部花了 ${c1 * x0 + c2 * y0} 元。`, st: `設${p} 入裝買 x 盒、${q} 入裝買 y 盒`, t1: `鳳梨酥共 ${P} 個`, t2: `總共花 ${c1 * x0 + c2 * y0} 元` }; }
      else { // 帳篷：x、y 是頂數
        [p, q] = pick([[4, 3], [5, 3], [4, 2], [6, 4], [5, 4]]); const T = x0 + y0, N = p * x0 + q * y0;
        return {
          fam: 'seat', story: `童軍團露營共 ${N} 人。男生剛好每 ${p} 人住一頂、女生剛好每 ${q} 人住一頂，一共住了 ${T} 頂帳篷。`, setupStmt: '設男生住 x 頂、女生住 y 頂', vx: '男生住的帳篷數', vy: '女生住的帳篷數',
          eqs: [stdEq(1, 1, T, `兩種帳篷合計 ${T} 頂`), stdEq(p, q, N, `男生每頂 ${p} 人、女生每頂 ${q} 人，共 ${N} 人`)], sol: [x0, y0],
          asks: [askX('男生住了幾頂帳篷？', { plain: true }), askY('女生住了幾頂帳篷？', { plain: true }), { q: '男生有幾人？', f: x => p * x, how: () => `男生有 ${p} × ${x0} = ${p * x0} 人`, alts: [[x0, '這是男生住的「帳篷數」，不是「人數」。']] }, { q: '女生有幾人？', f: (x, y) => q * y, how: () => `女生有 ${q} × ${y0} = ${q * y0} 人`, alts: [[y0, '這是女生住的「帳篷數」，不是「人數」。']] }],
          pair: { q: '求男生與女生各有幾人？', lab: ['男生', '女生'], f: (x, y) => [p * x, q * y] },
          hint: '設的是「帳篷頂數」：頂數相加＝總頂數；人數＝每頂人數×頂數，兩邊相加＝總人數。最後問人數時要記得再乘一次。'
        };
      }
      break;
    }
    return {
      fam: 'seat', story: S.story, setupStmt: S.st, vx: S.A + '的數量', vy: S.B + '的數量',
      eqs: [stdEq(p, q, S.P, S.t1), stdEq(S.c1, S.c2, S.C, S.t2)], sol: [x0, y0],
      asks: [askX(`${S.A}租了幾${S.u}？`.replace('租了', S.u === '盒' ? '買了' : S.u === '艘' ? '搭了' : '租了')), askY(`${S.B}租了幾${S.u}？`.replace('租了', S.u === '盒' ? '買了' : S.u === '艘' ? '搭了' : '租了')),
        { q: `兩種合計共幾${S.u}？`, f: (x, y) => x + y, minLv: 2, how: () => `合計 ${x0} + ${y0} = ${x0 + y0}`, alts: [] }],
      pair: { q: `求${S.A}與${S.B}各幾${S.u}？`, lab: [S.A, S.B], f: (x, y) => [x, y] },
      hint: '兩個條件：①「每個都坐滿」→ 人數（或個數）＝每個容量×數量，再相加；②「總花費」＝單價×數量，再相加。'
    };
  };

  /* 6. 對換型（硬幣、鉛筆原子筆）與勝負積分 */
  FAM.swap = lv => {
    const [x0, y0] = distinctPair(lv, [3, 12], [4, 18], [5, 30]);
    const [w1, w2] = who2();
    const k = pick(['coin', 'coin', 'pen', 'game']);
    if (k === 'game') {
      const win = pick([2, 3, 4, 5]), lose = pick([1, 1, 2].filter(v => v < win)), A = win * x0 + lose * y0, B = lose * x0 + win * y0;
      return {
        fam: 'swap', story: `${w1}與${w2}比賽，每局必分勝負，勝者得 ${win} 分、敗者得 ${lose} 分。結束時${w1}共得 ${A} 分、${w2}共得 ${B} 分。`, setupStmt: `設${w1}贏了 x 局、輸了 y 局`, vx: w1 + '贏的局數', vy: w1 + '輸的局數',
        eqs: [stdEq(win, lose, A, `${w1}贏 x 局得 ${win} 分、輸 y 局得 ${lose} 分，共 ${A} 分`), stdEq(lose, win, B, `${w1}贏的局，${w2}都是輸；${w1}輸的局，${w2}都是贏，所以${w2}共 ${B} 分`)], sol: [x0, y0],
        asks: [{ q: '兩人總共進行了幾局？', f: (x, y) => x + y, how: () => `總局數就是 x + y = ${x0} + ${y0} = ${x0 + y0}`, alts: [[x0, `這只是${w1}贏的局數，題目問的是總局數。`], [y0, `這只是${w1}輸的局數，題目問的是總局數。`]] }, askX(`${w1}贏了幾局？`), askY(`${w1}輸了幾局？`)],
        pair: { q: `求${w1}贏的局數與輸的局數各幾局？`, lab: ['贏', '輸'], f: (x, y) => [x, y] },
        hint: '一局只有一個贏家、一個輸家：甲贏的局，乙就是輸；甲輸的局，乙就是贏。所以乙的得分式子，勝負的分數要「對調」。'
      };
    }
    const [u1, u2, it] = k === 'coin' ? pick([[5, 10], [10, 50], [1, 5], [5, 50]].map(a => [a[0], a[1], 'coin'])) : pick([[10, 20], [10, 25], [15, 30]].map(a => [a[0], a[1], 'pen']));
    const A = u1 * x0 + u2 * y0, B = u2 * x0 + u1 * y0;
    const n1 = it === 'coin' ? `${u1} 元硬幣` : `${u1} 元鉛筆`, n2 = it === 'coin' ? `${u2} 元硬幣` : `${u2} 元原子筆`, cl = it === 'coin' ? '個' : '支', lab = it === 'coin' ? '共有' : '的總價是';
    const story = it === 'coin'
      ? `${w1}和${w2}各有 ${u1} 元與 ${u2} 元硬幣若干個；${w1}的 ${u1} 元硬幣數等於${w2}的 ${u2} 元硬幣數，${w1}的 ${u2} 元硬幣數等於${w2}的 ${u1} 元硬幣數。${w1}共有 ${A} 元，${w2}共有 ${B} 元。`
      : `${w1}、${w2}各有 ${u1} 元鉛筆與 ${u2} 元原子筆若干支；${w1}的鉛筆數等於${w2}的原子筆數，${w1}的原子筆數等於${w2}的鉛筆數。${w1}的鉛筆與原子筆總價 ${A} 元，${w2}的總價 ${B} 元。`;
    return {
      fam: 'swap', story, setupStmt: `設${w1}有${n1} x ${cl}、${n2} y ${cl}`, vx: w1 + '的' + n1 + '數', vy: w1 + '的' + n2 + '數',
      eqs: [stdEq(u1, u2, A, `${w1}的${n1} x ${cl}加${n2} y ${cl}，共 ${A} 元`), stdEq(u2, u1, B, `${w2}的${n2}數＝${w1}的${n1}數(x)，${w2}的${n1}數＝y，共 ${B} 元`)], sol: [x0, y0],
      asks: [askX(`${w1}有幾${cl}${n1}？`), askY(`${w1}有幾${cl}${n2}？`), askY(`${w2}有幾${cl}${n1}？`), askX(`${w2}有幾${cl}${n2}？`), { q: `${w1}的${n1}與${n2}合計幾${cl}？`, f: (x, y) => x + y, minLv: 2, how: () => `合計 ${x0} + ${y0} = ${x0 + y0}`, alts: [] }],
      pair: { q: `求${w1}的${n1}與${n2}各幾${cl}？`, lab: [n1.replace('硬幣', ''), n2.replace('硬幣', '')], f: (x, y) => [x, y] },
      hint: `兩個人的東西「對調」：${w1}的第一種＝${w2}的第二種。設${w1}的兩種數量為 x、y，${w2}的就是 y、x 對調過來。`
    };
  };

  /* 7. 倍數關係（兩整數、周長、兩校人數、長寬兩種關係、比例） */
  FAM.ratio = lv => {
    const k = pick(lv === 1 ? ['num', 'peri'] : lv === 2 ? ['num', 'num2', 'peri', 'class', 'rect'] : ['num2', 'peri', 'class', 'rect', 'prop']);
    if (k === 'num' || k === 'num2') {
      const y0 = R(3, lv === 1 ? 12 : 18), kk = R(2, 4), cc = R(1, 9) * (Math.random() < 0.5 ? 1 : -1), x0 = kk * y0 + cc;
      if (x0 < 1) return FAM.ratio(lv);
      if (k === 'num') { const S = x0 + y0; return { fam: 'ratio', story: `有兩個整數，大數比小數的 ${kk} 倍${cc > 0 ? '多' : '少'} ${Math.abs(cc)}，且兩數的和是 ${S}。`, setupStmt: '設大數為 x、小數為 y', vx: '大數', vy: '小數', eqs: [relEq('x', kk, cc, `大數比小數的 ${kk} 倍${cc > 0 ? '多' : '少'} ${Math.abs(cc)}`), stdEq(1, 1, S, `兩數的和是 ${S}`)], sol: [x0, y0], asks: [askX('大數是多少？'), askY('小數是多少？')], pair: { q: '求大數與小數各是多少？', lab: ['大數', '小數'], f: (x, y) => [x, y] }, hint: '「大數比小數的 k 倍多 c」→ 大數 = k × 小數 + c；再加上「兩數的和」這個條件。' }; }
      const al = R(1, 4), be = R(1, 5), T = al * x0 + be * y0;
      return { fam: 'ratio', story: `有兩個整數，大數比小數的 ${kk} 倍${cc > 0 ? '多' : '少'} ${Math.abs(cc)}，且大數的 ${al} 倍與小數的 ${be} 倍之和是 ${T}。`, setupStmt: '設大數為 x、小數為 y', vx: '大數', vy: '小數', eqs: [relEq('x', kk, cc, `大數比小數的 ${kk} 倍${cc > 0 ? '多' : '少'} ${Math.abs(cc)}`), stdEq(al, be, T, `大數的 ${al} 倍與小數的 ${be} 倍之和是 ${T}`)], sol: [x0, y0], asks: [askX('大數是多少？'), askY('小數是多少？'), { q: '兩數的和是多少？', f: (x, y) => x + y, minLv: 2, how: () => `${x0} + ${y0} = ${x0 + y0}`, alts: [] }], pair: { q: '求大數與小數各是多少？', lab: ['大數', '小數'], f: (x, y) => [x, y] }, hint: '第一個關係可以直接代入第二式：把 x 換成「k 倍小數 ± c」，就只剩 y 一個未知數。' };
    }
    if (k === 'peri') {
      const y0 = R(3, lv === 1 ? 8 : 14), kk = R(2, 4), cc = R(1, 5) * (Math.random() < 0.5 ? 1 : -1), x0 = kk * y0 + cc, L = 2 * (x0 + y0);
      const E2 = cus(`2(x + y) = ${L}`, 2, 2, L, `長方形周長是長加寬的 2 倍，共 ${L} 公分`, [[1, 1, L, `x + y = ${L}`, '周長是「長＋寬」的 2 倍，不是只有長加寬'], [2, 1, L, `2x + y = ${L}`, '周長有兩條長、兩條寬，寬也要乘 2']]);
      E2.w.push(vr(2, -2, L, '周長是「長＋寬」，不是「長－寬」', `2(x − y) = ${L}`));
      return { fam: 'ratio', story: `用 ${L} 公分的鐵絲圍成一個長方形（鐵絲剛好用完），且長比寬的 ${kk} 倍${cc > 0 ? '多' : '少'} ${Math.abs(cc)} 公分。`, setupStmt: '設長為 x 公分、寬為 y 公分', vx: '長', vy: '寬', eqs: [relEq('x', kk, cc, `長比寬的 ${kk} 倍${cc > 0 ? '多' : '少'} ${Math.abs(cc)}`), E2], sol: [x0, y0], asks: [askX('長方形的長是多少公分？'), askY('長方形的寬是多少公分？'), { q: '長方形的面積是多少平方公分？', f: (x, y) => x * y, minLv: 2, how: () => `面積 = 長 × 寬 = ${x0} × ${y0} = ${x0 * y0}`, alts: [[L, '這是周長，題目問的是面積。'], [x0 + y0, '這是長加寬，不是面積。']] }], pair: { q: '求長方形的長與寬各是多少公分？', lab: ['長', '寬'], f: (x, y) => [x, y] }, hint: '周長＝2×（長＋寬），這就是第一個條件；「長比寬的 k 倍多／少 c」是第二個條件。' };
    }
    if (k === 'class') {
      const y0 = R(18, 40), cc = R(1, 6), s = Math.random() < 0.5 ? -1 : 1, x0 = 2 * y0 + s * cc, a = R(2, 5), b = R(2, 5), T = a * x0 + b * y0;
      return { fam: 'ratio', story: `甲校每班人數比乙校每班人數的 2 倍${s > 0 ? '多' : '少'} ${cc} 人，甲校 ${a} 班、乙校 ${b} 班，共 ${T} 人。`, setupStmt: '設甲校每班 x 人、乙校每班 y 人', vx: '甲校每班人數', vy: '乙校每班人數', eqs: [relEq('x', 2, s * cc, `甲校每班人數比乙校的 2 倍${s > 0 ? '多' : '少'} ${cc}`), stdEq(a, b, T, `甲校 ${a} 班加乙校 ${b} 班，共 ${T} 人`)], sol: [x0, y0], asks: [askX('甲校每班有幾人？'), askY('乙校每班有幾人？')], pair: { q: '求甲校與乙校每班各有幾人？', lab: ['甲校', '乙校'], f: (x, y) => [x, y] }, hint: '總人數＝每班人數×班數，兩校相加；再加上「甲校每班比乙校的 2 倍多／少」的關係。' };
    }
    if (k === 'rect') {
      const k1 = R(2, 3), k2 = k1 + R(1, 2), y0 = R(5, 16), c1 = R(1, 9), c2 = (k2 - k1) * y0 - c1;
      if (c2 < 1) return FAM.ratio(lv);
      const x0 = k1 * y0 + c1;
      return { fam: 'ratio', story: `一個長方形的長比寬的 ${k1} 倍多 ${c1}，且長比寬的 ${k2} 倍少 ${c2} 公分。`, setupStmt: '設長為 x 公分、寬為 y 公分', vx: '長', vy: '寬', eqs: [relEq('x', k1, c1, `長比寬的 ${k1} 倍多 ${c1}`), relEq('x', k2, -c2, `長比寬的 ${k2} 倍少 ${c2}`)], sol: [x0, y0], asks: [askX('長是多少公分？'), askY('寬是多少公分？'), { q: '長方形的周長是多少公分？', f: (x, y) => 2 * (x + y), minLv: 3, how: () => `周長 = 2 × (${x0} + ${y0}) = ${2 * (x0 + y0)}`, alts: [[x0 + y0, '這是長加寬，周長還要乘 2。']] }], pair: { q: '求長與寬各是多少公分？', lab: ['長', '寬'], f: (x, y) => [x, y] }, hint: '長同時等於兩個式子：「k₁ 倍寬 + c₁」和「k₂ 倍寬 − c₂」，兩個右邊相等就能解出寬。' };
    }
    // prop：甲數的 α 倍等於乙數的 β 倍
    for (let tries = 0; tries < 60; tries++) {
      const al = R(2, 6), be = R(2, 6); if (al === be || gcd(al, be) !== 1) continue;
      const t = R(2, 6), x0 = be * t, y0 = al * t, p = R(1, 5), qq = R(1, 5), D = p * x0 - qq * y0; if (D < 1) continue;
      const E1 = cus(`${al}x = ${be}y`, al, -be, 0, `甲數的 ${al} 倍等於乙數的 ${be} 倍`, [[be, -al, 0, `${be}x = ${al}y`, '倍數對調了：甲數的 α 倍要寫在甲數 x 的前面'], [al, be, 0, `${al}x + ${be}y = 0`, '「等於」是兩邊相等，不是相加得 0']]);
      return { fam: 'ratio', story: `甲數的 ${al} 倍等於乙數的 ${be} 倍，且甲數的 ${p} 倍比乙數的 ${qq} 倍多 ${D}。`, setupStmt: '設甲數為 x、乙數為 y', vx: '甲數', vy: '乙數', eqs: [E1, stdEq(p, -qq, D, `甲數的 ${p} 倍比乙數的 ${qq} 倍多 ${D}`)], sol: [x0, y0], asks: [{ q: '甲數和乙數相差多少？', f: (x, y) => Math.abs(x - y), how: () => `相差 |${x0} − ${y0}| = ${Math.abs(x0 - y0)}`, alts: [[x0, '這是甲數，題目問的是相差。'], [y0, '這是乙數，題目問的是相差。']] }, askX('甲數是多少？'), askY('乙數是多少？')], pair: { q: '求甲數與乙數各是多少？', lab: ['甲數', '乙數'], f: (x, y) => [x, y] }, hint: '「甲數的 α 倍等於乙數的 β 倍」寫成 αx = βy；再用第二個條件消去一個未知數。' };
    }
    return FAM.ratio(1);
  };

  /* 8. 年齡問題 */
  FAM.age = lv => {
    const [A, B] = pick([['老師', '兒子'], ['爸爸', '女兒'], ['媽媽', '小明'], ['叔叔', '姪子']]);
    const k = pick(lv === 1 ? ['mulDiff', 'mulSum'] : lv === 2 ? ['mulDiff', 'mulSum', 'diffFut'] : ['mulSum', 'diffFut', 'mulFut']);
    const st = `設${A}今年 x 歲、${B}今年 y 歲`;
    const askAll = (x0, y0, extra) => [askX(`${A}今年幾歲？`), askY(`${B}今年幾歲？`)].concat(extra || []);
    const pairAge = { q: `求${A}與${B}今年各幾歲？`, lab: [A, B], f: (x, y) => [x, y] };
    if (k === 'mulDiff') {
      for (let t = 0; t < 80; t++) {
        const y0 = R(5, 14), kk = R(3, 5), cc = R(1, 6), x0 = kk * y0 + cc; if (x0 > 62) continue; const D = x0 - y0;
        return { fam: 'age', story: `今年${A}的年齡是${B}的 ${kk} 倍多 ${cc} 歲，且兩人相差 ${D} 歲。`, setupStmt: st, vx: A + '的年齡', vy: B + '的年齡', eqs: [relEq('x', kk, cc, `${A}的年齡是${B}的 ${kk} 倍多 ${cc} 歲`), stdEq(1, -1, D, `兩人年齡相差 ${D} 歲`)], sol: [x0, y0], asks: askAll(x0, y0), pair: pairAge, hint: '「相差」用相減（大的減小的）；「是…的 k 倍多 c 歲」→ 大 = k × 小 + c。' };
      }
    }
    if (k === 'mulSum') {
      for (let t = 0; t < 80; t++) {
        const y0 = R(5, 12), kk = R(3, 5), x0 = kk * y0, n = R(3, 10); if (x0 > 62) continue; const S = x0 + y0 + 2 * n;
        const E1 = relEq('x', kk, 0, `${A}的年齡是${B}的 ${kk} 倍`); E1.w.push(vr(1, -1, kk, '「倍」是乘法，不是加法', `x = y + ${kk}`));
        const E2 = cus(`(x + ${n}) + (y + ${n}) = ${S}`, 1, 1, S - 2 * n, `${n} 年後兩人年齡和是 ${S} 歲`, [[1, 1, S - n, `x + y + ${n} = ${S}`, `${n} 年後「兩個人」都要加 ${n} 歲`], [1, 1, S + 2 * n, `(x − ${n}) + (y − ${n}) = ${S}`, `「${n} 年後」是加，不是減`], [1, -1, S, `(x + ${n}) − (y + ${n}) = ${S}`, '「年齡和」是相加，不是相減']]);
        return { fam: 'age', story: `今年${A}的年齡是${B}的 ${kk} 倍，且 ${n} 年後兩人的年齡和恰好是 ${S} 歲。`, setupStmt: st, vx: A + '的年齡', vy: B + '的年齡', eqs: [E1, E2], sol: [x0, y0], asks: askAll(x0, y0, [{ q: `${n} 年後${A}幾歲？`, f: x => x + n, minLv: 3, how: () => `${n} 年後 = ${x0} + ${n} = ${x0 + n}`, alts: [[x0, `這是今年的年齡，題目問的是 ${n} 年後。`]] }]), pair: pairAge, hint: '「n 年後」兩個人都要加 n 歲：(x + n) + (y + n)。' };
      }
    }
    if (k === 'diffFut') {
      for (let t = 0; t < 80; t++) {
        const y0 = R(8, 18), n = R(3, 12), m = R(2, 3), D = (m - 1) * (y0 + n), x0 = y0 + D; if (x0 > 62) continue;
        const E2 = cus(`x + ${n} = ${m}(y + ${n})`, 1, -m, n * (m - 1), `${n} 年後${A}的年齡正好是${B}的 ${m} 倍`, [[1, -m, -n, `x + ${n} = ${m}y`, `${B}也要加 ${n} 歲`], [1, -m, m * n, `x = ${m}(y + ${n})`, `${A}也要加 ${n} 歲`], [-m, 1, n * (m - 1), `y + ${n} = ${m}(x + ${n})`, `「幾倍」的對象弄反了（${A}才是${B}的 ${m} 倍）`]]);
        return { fam: 'age', story: `${A}與${B}的年齡相差 ${D} 歲，${n} 年後${A}的年齡正好是${B}的 ${m} 倍。`, setupStmt: st, vx: A + '的年齡', vy: B + '的年齡', eqs: [stdEq(1, -1, D, `兩人年齡相差 ${D} 歲`), E2], sol: [x0, y0], asks: askAll(x0, y0), pair: pairAge, hint: `「${'n'} 年後」兩個人都要加 n 歲，所以是 x + n = m(y + n)，括號裡的 y 也要加。` };
      }
    }
    for (let t = 0; t < 300; t++) { // mulFut：老師的年齡是兒子的 4 倍多 4 歲；25 年後…
      const y0 = R(6, 14), kk = R(3, 5), mm = R(2, kk - 1), cc = R(1, 8), x0 = kk * y0 + cc, n = R(5, 30), d = (x0 + n) - mm * (y0 + n);
      if (x0 > 62 || d === 0 || Math.abs(d) > 9) continue;
      const dd = Math.abs(d), sg = d > 0 ? '多' : '少', c2 = n * (mm - 1) + d, sgn = d > 0 ? '+' : '−';
      const E2 = cus(`x + ${n} = ${mm}(y + ${n}) ${sgn} ${dd}`, 1, -mm, c2, `${n} 年後${A}的年齡是${B}的 ${mm} 倍${sg} ${dd} 歲`, [[1, -mm, d - n, `x + ${n} = ${mm}y ${sgn} ${dd}`, `${B}也要加 ${n} 歲`], [1, -mm, mm * n + d, `x = ${mm}(y + ${n}) ${sgn} ${dd}`, `${A}也要加 ${n} 歲`], [1, -mm, mm * n - d - n, `x + ${n} = ${mm}(y + ${n}) ${sgn === '+' ? '−' : '+'} ${dd}`, '「多」和「少」弄反了']]);
      return { fam: 'age', story: `${A}今年的年齡是${B}的 ${kk} 倍多 ${cc} 歲；${n} 年後，${A}的年齡會是${B}年齡的 ${mm} 倍${sg} ${dd} 歲。`, setupStmt: st, vx: A + '的年齡', vy: B + '的年齡', eqs: [relEq('x', kk, cc, `${A}今年是${B}的 ${kk} 倍多 ${cc} 歲`), E2], sol: [x0, y0], asks: askAll(x0, y0), pair: pairAge, hint: `${n} 年後兩個人都要加 ${n} 歲。第一式可以直接代入第二式。` };
    }
    return FAM.age(1);
  };

  /* 9. 數字問題（兩位數）：數學魔術、對調數字 */
  FAM.digit = lv => {
    const x0 = R(1, 9);
    if (Math.random() < 0.5) {
      const y0 = R(0, 9), A = 11 * x0 + 2 * y0, B = 9 * x0;
      const E1 = cus(`(10x + y) + y + x = ${A}`, 11, 2, A, `數字加個位數再加十位數是 ${A}`, [[2, 11, A, `(10y + x) + y + x = ${A}`, '十位數字與個位數字弄反了'], [2, 2, A, `(x + y) + y + x = ${A}`, '兩位數是「10 × 十位 + 個位」，不是兩個數字相加']]);
      const E2 = cus(`(10x + y) − y − x = ${B}`, 9, 0, B, `數字減個位數再減十位數是 ${B}`, [[11, 0, B, `(10x + y) − y + x = ${B}`, '減十位數字時符號寫錯'], [0, 9, B, `(10y + x) − y − x = ${B}`, '十位數字與個位數字弄反了']]);
      return { fam: 'digit', story: `數學魔術：把一個兩位數（十位數字 x、個位數字 y）做兩次運算。第一個答案是「這個數＋個位數字＋十位數字」＝${A}，第二個答案是「這個數－個位數字－十位數字」＝${B}。`, setupStmt: '設十位數字為 x、個位數字為 y', vx: '十位數字', vy: '個位數字', eqs: [E1, E2], sol: [x0, y0], asks: [{ q: '這個兩位數是多少？', f: (x, y) => 10 * x + y, how: () => `兩位數 = 10 × ${x0} + ${y0} = ${10 * x0 + y0}`, alts: [[x0, '這是十位數字，題目問的是整個兩位數。']], plain: true }, askX('十位數字是多少？', { plain: true })], pair: null, hint: '兩位數＝10×十位數字＋個位數字。第二個答案化簡後，只剩下十位數字 x。' };
    }
    const y0 = R(x0 + 1, 9), S = x0 + y0, D = 9 * (y0 - x0);
    const E2 = cus(`(10y + x) − (10x + y) = ${D}`, -9, 9, D, `對調後的新數比原數大 ${D}`, [[9, -9, D, `(10x + y) − (10y + x) = ${D}`, '對調後的新數才是被減數'], [-9, 11, D, `10y + x − 10x + y = ${D}`, '減掉整個兩位數，要用括號（每一項都變號）']]);
    return { fam: 'digit', story: `一個兩位數，十位數字與個位數字的和是 ${S}；把十位數字與個位數字對調後，新的兩位數比原來的數大 ${D}。`, setupStmt: '設原數十位數字為 x、個位數字為 y', vx: '十位數字', vy: '個位數字', eqs: [stdEq(1, 1, S, `十位數字與個位數字的和是 ${S}`), E2], sol: [x0, y0], asks: [{ q: '原來的兩位數是多少？', f: (x, y) => 10 * x + y, how: () => `原數 = 10 × ${x0} + ${y0} = ${10 * x0 + y0}`, alts: [[10 * y0 + x0, '這是對調後的新數，題目問原來的數。'], [x0, '這是十位數字。']], plain: true }, askX('原數的十位數字是多少？', { plain: true })], pair: null, hint: '對調後：新數＝10×個位數字＋十位數字。「新數減原數」要用括號。' };
  };

  /* 10. 換算與組合：帳篷改分法、買送組價、成數、拼圖長度 */
  FAM.pack = lv => {
    const k = pick(lv === 1 ? ['wage', 'puzzle'] : ['wage', 'puzzle', 'tent', 'promo']);
    if (k === 'wage') {
      const f = pick([1.2, 1.5, 1.3, 1.1]), ch = Math.round((f - 1) * 10), x0 = R(8, lv === 1 ? 16 : 22) * 10, y0 = Math.round(f * x0), h1 = R(6, 14), h2 = R(5, 12), T = h1 * x0 + h2 * y0;
      const [A, B] = pick([['日班', '夜班'], ['平日', '假日']]);
      const E1 = mk(`y = ${nstr(f)}x`, -f, 1, 0, `${B}時薪比${A}多 ${ch} 成（是${A}的 ${nstr(f)} 倍）`, [vr(1, -f, 0, `「${B}」才是${A}的 ${nstr(f)} 倍，x、y 弄反了`, `x = ${nstr(f)}y`), vr(-(f - 1), 1, 0, `多 ${ch} 成是原來的 ${nstr(f)} 倍，不是 ${nstr(f - 1)} 倍`, `y = ${nstr(f - 1)}x`)]);
      return { fam: 'pack', story: `阿草打工，${B}每小時酬勞比${A}多 ${ch} 成。本月${A}工作 ${h1} 小時、${B}工作 ${h2} 小時，共領 ${T} 元。`, setupStmt: `設${A}每小時 x 元、${B}每小時 y 元`, vx: A + '時薪', vy: B + '時薪', eqs: [E1, stdEq(h1, h2, T, `${A} ${h1} 小時加${B} ${h2} 小時，共領 ${T} 元`)], sol: [x0, y0], asks: [askX(`${A}每小時酬勞多少元？`), askY(`${B}每小時酬勞多少元？`)], pair: { q: `求${A}與${B}每小時酬勞各多少元？`, lab: [A, B], f: (x, y) => [x, y] }, hint: '「多 N 成」是原來的（1 + N/10）倍，例如多兩成＝1.2 倍。' };
    }
    if (k === 'puzzle') {
      const x0 = R(1, 3), y0 = R(4, 12), n1 = R(3, 5), n2 = n1 + R(1, 3), L1 = x0 + n1 * y0, L2 = x0 + n2 * y0;
      return { fam: 'pack', story: `若干片相同的拼圖可以緊密拼成一列。每片拼圖由接合處長度 x 與剩餘長度 y 兩部分組成，拼好以後：${n1} 片拼成一列長 ${L1} 公分，${n2} 片拼成一列長 ${L2} 公分。`, setupStmt: '設接合處長度為 x 公分、剩餘長度為 y 公分', vx: '接合處長度', vy: '剩餘長度', eqs: [stdEq(1, n1, L1, `${n1} 片拼成一列長 ${L1} 公分`), stdEq(1, n2, L2, `${n2} 片拼成一列長 ${L2} 公分`)], sol: [x0, y0], asks: [{ q: '單片拼圖的長度（x ＋ y）是多少公分？', f: (x, y) => x + y, how: () => `單片長度 = x + y = ${x0} + ${y0} = ${x0 + y0}`, alts: [[x0, '這只是接合處長度 x。'], [y0, '這只是剩餘長度 y。']], plain: true }, askY('每片拼圖的剩餘長度 y 是多少公分？', { plain: true })], pair: null, hint: '拼 n 片時，接合處只算一次（x），而剩餘長度要算 n 次（n×y）。兩式相減可以消去 x。' };
    }
    if (k === 'tent') {
      const [a, b] = pick([[3, 4], [4, 5], [2, 3], [3, 5]]), l = a * b / gcd(a, b), x0 = l * R(1, 4), y0 = l * R(1, 4), N = x0 + y0, T = x0 / a + y0 / b;
      if (x0 === y0 || N > 110) return FAM.pack(lv);
      const newT = x0 / b + y0 / a;
      const E2 = mk(`x/${a} + y/${b} = ${T}`, 1 / a, 1 / b, T, `男生每 ${a} 人一頂、女生每 ${b} 人一頂，共 ${T} 頂`, [vr(a, b, T, `${a}x + ${b}y = ${T}`, `${a}x + ${b}y = ${T}`), vr(1 / b, 1 / a, T, `x/${b} + y/${a} = ${T}`, `x/${b} + y/${a} = ${T}`), vr(1, 1, T, `x + y = ${T}`, `x + y = ${T}`)]);
      E2.w[0].why = `「每 ${a} 人住一頂」→ 頂數是 x ÷ ${a}，不是 ${a} × x`; E2.w[1].why = '男生每幾人住一頂，和女生的人數除數放反了'; E2.w[2].why = '這是「人數」的式子，不是「帳篷頂數」的式子';
      return { fam: 'pack', story: `童軍團露營共 ${N} 人。男生每 ${a} 人住一頂帳篷、女生每 ${b} 人住一頂，剛好住滿，共需 ${T} 頂帳篷。`, setupStmt: '設男生 x 人、女生 y 人', vx: '男生人數', vy: '女生人數', eqs: [stdEq(1, 1, N, `男女合計 ${N} 人`), E2], sol: [x0, y0], asks: [{ q: `若改成男生每 ${b} 人住一頂、女生每 ${a} 人住一頂，需要幾頂帳篷？`, f: (x, y) => x / b + y / a, how: () => `新的帳篷數 = ${x0}÷${b} + ${y0}÷${a} = ${newT}`, alts: [[T, '這是原本需要的帳篷數，題目問的是「改變分法」後。'], [x0, '這是男生人數，還沒算帳篷。'], [y0, '這是女生人數，還沒算帳篷。']], plain: true }, askX('男生有幾人？'), askY('女生有幾人？')], pair: { q: '求男生與女生各有幾人？', lab: ['男生', '女生'], f: (x, y) => [x, y] }, hint: '設的是「人數」。每 a 人住一頂 → 頂數＝人數÷a。先解出男女人數，再用新的分法重算帳篷數。' };
    }
    // promo：買 m 送 r（一組 G 杯）
    for (let t = 0; t < 50; t++) {
      const G = pick([10, 8, 6]), m1 = R(G - 4, G - 1), m2 = R(G - 4, G - 1), u1 = R(2, 9) * 5, u2 = R(2, 9) * 5, g1 = u1 * m1, g2 = u2 * m2; if (g1 === g2) continue;
      const [x0, y0] = distinctPair(lv, [2, 8], [2, 10], [3, 14]), N = x0 + y0, T = g1 * x0 + g2 * y0, [w] = who2();
      const E2 = mk(stdStr(g1, g2, T), g1, g2, T, `一組價錢×組數，兩家相加共 ${T} 元（甲家一組 ${u1}×${m1} = ${g1} 元，乙家一組 ${u2}×${m2} = ${g2} 元）`, [vr(u1, u2, T, '', `${u1}x + ${u2}y = ${T}`), vr(u1 * G, u2 * G, T, '', `${u1 * G}x + ${u2 * G}y = ${T}`), vr(g2, g1, T, '', stdStr(g2, g1, T))]);
      E2.std = true; E2.w[0].why = '一組不是只付一杯的錢，要乘上「買幾杯」才是一組的價錢'; E2.w[1].why = '「送」的杯數不用付錢，一組只付「買」的杯數'; E2.w[2].why = '兩家的組價放反了（x 是甲家、y 是乙家）';
      return { fam: 'pack', story: `甲超商的飲料單價 ${u1} 元，特價「買 ${m1} 送 ${G - m1}」（一組 ${G} 杯，只付 ${m1} 杯的錢）；乙超商的單價 ${u2} 元，特價「買 ${m2} 送 ${G - m2}」（一組 ${G} 杯，只付 ${m2} 杯的錢）。${w}在兩家共買了 ${N} 組特價飲料，共花 ${T} 元。`, setupStmt: '設在甲超商買 x 組、在乙超商買 y 組', vx: '甲超商買的組數', vy: '乙超商買的組數', eqs: [stdEq(1, 1, N, `兩家合計買 ${N} 組`), E2], sol: [x0, y0], asks: [askX('在甲超商買了幾組？'), askY('在乙超商買了幾組？'), { q: '兩家總共買了幾杯飲料？', f: (x, y) => (x + y) * G, minLv: 2, how: () => `總杯數 = ${N} 組 × ${G} 杯 = ${N * G}`, alts: [[N, '這是總組數，一組有多杯。']], plain: true }], pair: { q: '求在甲、乙超商各買了幾組？', lab: ['甲', '乙'], f: (x, y) => [x, y] }, hint: '先算「一組要付多少錢」＝單價×要付錢的杯數（送的不用付錢），再列「組數」和「總花費」兩個條件。' };
    }
    return FAM.pack(1);
  };

  /* ---------- 選列式專用：翻譯題（溫故啟思、講義 01・02） ---------- */
  FAM.trans = lv => {
    const k = pick(['a', 'b', 'c', 'd']);
    if (k === 'a') { // x 比 y 的 k 倍少/多 c；m x = n y + e
      const y0 = R(3, 12), kk = R(2, 4), cc = R(1, 6) * (Math.random() < 0.5 ? 1 : -1), x0 = kk * y0 + cc, m = R(2, 4), n = R(2, 6);
      if (m === n || kk * m === n || x0 < 1) return FAM.trans(lv);
      const e = m * x0 - n * y0, es = e >= 0 ? '+' : '−';
      const E2 = cus(`${m}x = ${n}y ${es} ${Math.abs(e)}`, m, -n, e, `x 的 ${m} 倍等於 y 的 ${n} 倍${e >= 0 ? '加' : '減'} ${Math.abs(e)}`, [[m, -n, -e, `${m}x = ${n}y ${es === '+' ? '−' : '+'} ${Math.abs(e)}`, '「加」和「減」弄反了'], [n, -m, e, `${n}x = ${m}y ${es} ${Math.abs(e)}`, '倍數放到了錯的未知數'], [m, n, e, `${m}x + ${n}y = ${e}`, '「等於 y 的 n 倍加 e」要把 y 的項留在等號右邊，不是全部加在一起']]);
      return { fam: 'trans', story: `已知兩數 x、y：x 比 y 的 ${kk} 倍${cc > 0 ? '多' : '少'} ${Math.abs(cc)}，且 x 的 ${m} 倍等於 y 的 ${n} 倍${e >= 0 ? '加' : '減'} ${Math.abs(e)}。`, setupStmt: '（x、y 為兩個未知數）', vx: 'x', vy: 'y', eqs: [relEq('x', kk, cc, `x 比 y 的 ${kk} 倍${cc > 0 ? '多' : '少'} ${Math.abs(cc)}`), E2], sol: [x0, y0], asks: [] };
    }
    if (k === 'b') { // 全票半票
      const [p, q] = pick([[3, 2], [2, 3], [4, 3], [5, 2]]), y0 = R(10, 40) * 5, x0 = 2 * y0, T = p * x0 + q * y0;
      return { fam: 'trans', story: `遊樂園的全票價格是半票的 2 倍，買 ${p} 張全票和 ${q} 張半票共 ${T} 元。`, setupStmt: '設全票每張 x 元、半票每張 y 元', vx: '全票價格', vy: '半票價格', eqs: [relEq('x', 2, 0, '全票價格是半票的 2 倍'), stdEq(p, q, T, `${p} 張全票加 ${q} 張半票共 ${T} 元`)], sol: [x0, y0], asks: [] };
    }
    if (k === 'c') { // 體重
      const [A, B] = who2(), y0 = R(25, 50), kk = R(2, 3), cc = R(2, 9) * 5 / 5, x0 = kk * y0 + cc, S = x0 + y0;
      return { fam: 'trans', story: `${A}的體重是${B}體重的 ${kk} 倍多 ${cc} 公斤，且兩人體重合計 ${S} 公斤。`, setupStmt: `設${A}的體重為 x 公斤、${B}的體重為 y 公斤`, vx: A + '的體重', vy: B + '的體重', eqs: [relEq('x', kk, cc, `${A}的體重是${B}的 ${kk} 倍多 ${cc} 公斤`), stdEq(1, 1, S, `兩人合計 ${S} 公斤`)], sol: [x0, y0], asks: [] };
    }
    const [A, B] = who2(), y0 = R(20, 80), d = R(3, 12) * 10, x0 = y0 + d, S = x0 + y0;
    return { fam: 'trans', story: `${A}的零用錢比${B}多 ${d} 元，兩人的零用錢加起來是 ${S} 元。`, setupStmt: `設${A}有 x 元、${B}有 y 元`, vx: A + '的零用錢', vy: B + '的零用錢', eqs: [relEq('x', 1, d, `${A}比${B}多 ${d} 元`), stdEq(1, 1, S, `兩人合計 ${S} 元`)], sol: [x0, y0], asks: [] };
  };

  /* ---------- 11. 檢查解是否合理 ---------- */
  const CHECK = [
    // pens：文具店
    (valid, lv) => {
      const p = pick([25, 30, 20, 35, 40]), q = pick([5, 8, 6, 10, 4]), N = R(15, 36), w = who();
      let T, kind;
      if (valid) { const x = R(2, N - 2); T = p * x + q * (N - x); }
      else if (Math.random() < 0.5) { const x = N + R(3, 9); T = p * x + q * (N - x); kind = 'neg'; }
      else { do { T = R(q * N + 1, p * N - 1); } while ((T - q * N) % (p - q) === 0); kind = 'frac'; }
      const E1 = stdEq(1, 1, N, `原子筆與鉛筆共 ${N} 枝`), E2 = stdEq(p, q, T, `共花 ${T} 元`);
      return { story: `文具店原子筆 1 枝 ${p} 元、鉛筆 1 枝 ${q} 元。${w}買了原子筆和鉛筆共 ${N} 枝，花費 ${T} 元。`, qq: '請問原子筆和鉛筆各買了幾枝？', st: '設原子筆 x 枝、鉛筆 y 枝', E1, E2, names: ['原子筆', '鉛筆'], u: '枝', fmt: (a, b) => `原子筆 ${a} 枝、鉛筆 ${b} 枝`, nm: ['原子筆', '鉛筆'] };
    },
    // groups：分組
    (valid, lv) => {
      const [p, q] = pick([[3, 4], [3, 5], [4, 6], [2, 5]]), G = R(5, 10); let P, kind;
      if (valid) { const x = R(1, G - 1); P = p * x + q * (G - x); }
      else if (q - p === 1 || Math.random() < 0.5) { P = q * G + R(2, 8); }
      else { do { P = R(p * G + 1, q * G - 1); } while ((P - p * G) % (q - p) === 0); }
      const E1 = stdEq(1, 1, G, `${p} 人組與 ${q} 人組共 ${G} 組`), E2 = stdEq(p, q, P, `全班共 ${P} 人`);
      return { story: `全班 ${P} 人分成 ${G} 組，可以 ${p} 人一組或 ${q} 人一組（每組人數都剛好）。`, qq: `請問 ${p} 人組、${q} 人組各有幾組？`, st: `設 ${p} 人組 x 組、${q} 人組 y 組`, E1, E2, u: '組', fmt: (a, b) => `${p} 人組 ${a} 組、${q} 人組 ${b} 組`, nm: [`${p} 人組`, `${q} 人組`] };
    },
    // quiz：答對得分、答錯倒扣
    (valid, lv) => {
      const N = pick([20, 25, 30]), a = pick([5, 4, 3]), b = pick([1, 2]); let S;
      if (valid) { const x = R(3, N - 2); S = a * x - b * (N - x); }
      else if (Math.random() < 0.5) { let g = 0; do { S = R(-b * N + 5, a * N - 5); } while ((S + b * N) % (a + b) === 0 && g++ < 200); }
      else S = a * N + R(3, 12);
      const E1 = stdEq(1, 1, N, `答對與答錯共 ${N} 題`), E2 = stdEq(a, -b, S, `答對得 ${a} 分、答錯扣 ${b} 分，共得 ${S} 分`);
      return { story: `數學答題比賽每回合 ${N} 題都要作答，答對 1 題得 ${a} 分、答錯 1 題倒扣 ${b} 分。男生隊某回合作答完共得 ${S} 分。`, qq: '請問答對、答錯各有幾題？', st: '設答對 x 題、答錯 y 題', E1, E2, u: '題', fmt: (x, y) => `答對 ${x} 題、答錯 ${y} 題`, nm: ['答對題數', '答錯題數'] };
    },
    // birthday：生日月日
    (valid, lv) => {
      const w = who(), k = R(2, 9); let m, d, S, T;
      const DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      if (valid) { m = R(1, 12); d = R(1, DAYS[m]); }
      else { const t = R(0, 2); if (t === 0) { m = R(13, 16); d = R(1, 25); } else if (t === 1) { m = pick([2, 4, 6, 9, 11]); d = m === 2 ? pick([30, 31]) : 31; } else { m = R(1, 12); d = R(32, 45); } }
      S = m + d; T = k * m + d;
      const E1 = stdEq(1, 1, S, `月份加日期是 ${S}`), E2 = stdEq(k, 1, T, `${k} 倍月份加日期是 ${T}`);
      return { story: `${w}說他生日的月份加日期是 ${S}，且 ${k} 倍的月份加日期是 ${T}。`, qq: '請問他的生日是幾月幾日？', st: '設月份為 x、日期為 y', E1, E2, u: '', fmt: (a, b) => `${a} 月 ${b} 日`, nm: ['月份', '日期'], date: DAYS };
    },
    // class：兩校人數
    (valid, lv) => {
      const c = R(1, 4), a = R(2, 5), b = R(2, 5), y = R(16, 36); let T;
      if (valid) T = a * (2 * y - c) + b * y; else { const y10 = R(16, 36); T = a * (2 * y10 - c) + b * y10 + R(1, 3 * a + b - 1) ; }
      const E1 = relEq('x', 2, -c, `甲校每班比乙校的 2 倍少 ${c} 人`), E2 = stdEq(a, b, T, `甲校 ${a} 班加乙校 ${b} 班共 ${T} 人`);
      return { story: `甲校每班人數比乙校每班人數的 2 倍少 ${c} 人，甲校 ${a} 班、乙校 ${b} 班，共 ${T} 人。`, qq: '請問兩校每班各多少人？', st: '設甲校每班 x 人、乙校每班 y 人', E1, E2, u: '人', fmt: (x, y) => `甲校每班 ${x} 人、乙校每班 ${y} 人`, nm: ['甲校每班人數', '乙校每班人數'] };
    }
  ];

  const dec = v => isInt(v) ? nstr(v) : nstr(Math.round(v * 100) / 100);
  function mkCheck(lv) {
    for (let tries = 0; tries < 200; tries++) {
      const valid = Math.random() < 0.4, S = pick(CHECK)(valid, lv), sol = solve2(S.E1, S.E2);
      if (!sol) continue;
      const [x, y] = sol, okInt = isInt(x) && isInt(y);
      let good = okInt && x >= 1 && y >= 1;
      if (S.date && good) { const m = Math.round(x), d = Math.round(y); good = m >= 1 && m <= 12 && d >= 1 && d <= S.date[m]; }
      if (good !== valid) continue;
      if (good && near(x, y)) continue;
      const nmx = S.nm[0], nmy = S.nm[1], f = S.fmt;
      let ans, why = {}, options = [], reason = '';
      if (good) {
        ans = '有合理解：' + f(x, y);
        const set = new Map();
        set.set('有合理解：' + f(y, x), `把兩個答案的位置對調了（x 是${nmx}、y 是${nmy}）。`);
        const fake = [];
        fake.push('解出來有一個是負數'); if (!near(x, y)) fake.push('兩個未知數解出來是同一個數'); fake.push('解出來不是整數');
        const fk = sh(fake).slice(0, 2);
        fk.forEach(r => set.set('無合理解：' + r, '其實解出來是 ' + f(x, y) + '，兩個值都是合理的整數。'));
        set.set('有合理解：' + f(x + R(1, 3), y - R(1, 2)), '解聯立方程式時計算錯誤。');
        options = sh([ans, ...[...set.keys()].slice(0, 3)]); [...set.keys()].slice(0, 3).forEach(k => why[k] = set.get(k));
        reason = `解得 x＝${dec(x)}、y＝${dec(y)}，都是合理的整數，所以有合理解：${f(x, y)}`;
      } else {
        const neg = x < 0 || y < 0, frac = !okInt;
        const bad = x < 0 ? [nmx, x] : y < 0 ? [nmy, y] : !isInt(x) ? [nmx, x] : [nmy, y];
        if (S.date && okInt && !neg) reason = `解得 ${fmtDate(x, y)}，這個日期不存在`;
        if (neg) reason = `解出${bad[0]}是 ${dec(bad[1])}${S.u || ''}，不可能是負的`;
        else if (frac) reason = `解出${bad[0]}是 ${dec(bad[1])}${S.u || ''}，必須是整數`;
        else if (S.date) reason = `解得 ${S.fmt(dec(x), dec(y))}，但這個日期不存在（月份只有 1～12，每月日數有限）`;
        ans = '無合理解：' + reason.replace(/^解得.*?，但/, '但').replace(/^解得.*?，這/, '這');
        if (S.date && okInt && !neg) ans = '無合理解：解得 ' + S.fmt(dec(x), dec(y)) + '，但這個日期不存在';
        const set = new Map();
        if (neg) set.set('有合理解：' + f(Math.abs(x), Math.abs(y)), '解出負數時，不能直接把負號去掉當答案。');
        else if (frac) set.set('有合理解：' + f(Math.round(x), Math.round(y)), '解出來不是整數時，不能直接四捨五入當答案。');
        else set.set('有合理解：' + f(x, y), '解出來的日期（月份）其實不存在，不能當答案。');
        set.set('有合理解：' + f(y, x), '位置對調，也不是合理的答案。');
        const fake = [];
        if (!neg) fake.push('解出來有負數'); if (!frac) fake.push('解出來有小數'); if (!near(x, y)) fake.push('兩個未知數解出來是同一個數');
        const fr = pick(fake);
        set.set('無合理解：' + fr, '結論雖然是「無合理解」，但理由不對：實際解出來是 ' + dec(x) + '、' + dec(y) + '。');
        options = sh([ans, ...[...set.keys()].slice(0, 3)]); [...set.keys()].slice(0, 3).forEach(k => why[k] = set.get(k));
      }
      if (new Set(options).size !== 4) continue;
      const explain = `${S.st}。列式：${S.E1.s}（${S.E1.t}）、${S.E2.s}（${S.E2.t}）。解得 x＝${dec(x)}、y＝${dec(y)}。` + (good ? '兩個值都合理，' : '檢查：' + (reason || '') + '，') + (good ? '所以有合理解。' : '所以本題無合理解。');
      const qqq = { text: S.story + S.qq, ans, options, hint: '先列式解出來，再回頭檢查：個數、組數、題數要是「不是負數的整數」，日期要真的存在。解出來合理才能當答案喔！', explain, why };
      const mkv = (val, other) => ({ ok: dec(val), wrong: uniqWrong([[dec(other), '這是另一個未知數的值，搞混了。'], [dec(val + 1), '計算時再檢查一次。'], [dec(val - 1 < 0 && Number.isInteger(val) ? val + 2 : val - 1), '計算時再檢查一次。'], [dec(val + 3), '計算時再檢查一次。']], dec(val)).slice(0, 3) });
      const mx = mkv(x, y), my = mkv(y, x);
      qqq.tutor = eqSteps({ setupStmt: S.st, eqs: [S.E1, S.E2] }).concat([
        { say: '解聯立方程式，x（' + nmx + '）等於多少？', hint: '代入消去或加減消去。結果可能是分數或負數，先照算出來的寫。', ok: mx.ok, wrong: mx.wrong, line: 'x = ' + mx.ok },
        { say: '代回求 y（' + nmy + '）等於多少？', hint: '挑簡單的式子代入。', ok: my.ok, wrong: my.wrong, line: 'y = ' + my.ok }
      ]);
      qqq.tutorFinal = '檢查算出來的 x、y 合不合理（個數不能是負的或小數、日期要存在），結論是？';
      return finishQ(qqq, { fam: 'check' }, 'check');
    }
    return mkCheck(lv);
  }
  function fmtDate(x, y) { return `${Math.round(x)} 月 ${Math.round(y)} 日`; }

  /* ---------- 對外：make／buildPlan ---------- */
  const FAMKEYS = ['sumprice', 'twoBuy', 'sumdiff', 'diffprice', 'seat', 'swap', 'ratio', 'age', 'digit', 'pack'];
  const SETUP_POOL = FAMKEYS.concat(['trans', 'trans']);
  const MINLV = { digit: 2 };
  const PLAN_ALL = ['setup', 'setup', 'check'].concat(FAMKEYS);

  function make(type, lv) {
    lv = lv || 1;
    if (type === 'check') return mkCheck(lv);
    if (type === 'setup') { const f = pick(SETUP_POOL.filter(k => (MINLV[k] || 1) <= lv)); return mkSetup(FAM[f](lv)); }
    if (FAM[type]) return mkAnswer(FAM[type](lv), lv);
    throw new Error('unknown type ' + type);
  }
  // 一局 10 題：3 題選列式、1 題合理性檢查、6 題各題型（不重複）；相同題型不相鄰；第 1 題先出較單純的
  function buildPlan(lv) {
    lv = lv || 1;
    const fams = sh(FAMKEYS.filter(k => (MINLV[k] || 1) <= lv)).slice(0, 6);
    let plan = sh(['setup', 'setup', 'setup', 'check'].concat(fams));
    for (let t = 0; t < 40; t++) { let ok = true; for (let i = 1; i < plan.length; i++) if (plan[i] === plan[i - 1]) ok = false; if (ok) break; plan = sh(plan); }
    return plan;
  }
  const LABELS = {
    setup: '選出正確列式', check: '檢查解是否合理', sumprice: '加總數量（總數＋總價）', twoBuy: '兩次購買（求單價）', sumdiff: '和差問題', diffprice: '相差＋總價', seat: '分配問題（滿座）', swap: '對換型（硬幣・積分）', ratio: '倍數關係（兩數・長方形）', age: '年齡問題', digit: '兩位數數字問題', pack: '換算與組合'
  };
  root.G131 = { make, buildPlan, PLAN_ALL, LABELS, FAMKEYS, _FAM: FAM, _CHECK: CHECK, _mkAnswer: mkAnswer, _mkSetup: mkSetup, _solve2: solve2, _sysDistractors: sysDistractors };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.G131;
})(typeof window !== 'undefined' ? window : globalThis);
