/* jb2-sync.js — JB2（數靈召喚師）接上 sync-client.js 的橋。
 * 做三件事：
 *  1. gate()：沒有學號就彈出視窗強迫輸入（總地圖、各章地圖都會呼叫）。
 *  2. build()：把六章的星數、練習次數、練習時間、最後一次結果、弱點整理成一包。
 *  3. push()：用 sync-client.js 的 keyagentUpdateOtherGame('jb2', …) 送出，
 *     在學校會直接進校內資料庫，在家會走雲端中繼站（跟鍵位特工同一條路）。
 * 需要先載入 game-config.js 和 sync-client.js（sync-client.js 沒載入時，只會少了「送出」，其他照常）。
 * 欄位命名配合 sync-client.js 的合併規則：total*／best*／plays 取大值（只增不減），其餘取較新那份。 */
(function () {
  var ACTIVE = 'keyagent_active_student', HUB = 'jb2-hub-v1';
  var GC = window.GAME_CONFIG || {};
  var NCH = (GC.chapters && GC.chapters.length) || 6;
  function chKey(n) { return 'monster-ch' + n + '-progress-v1'; }
  function rd(k) { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } }
  function wr(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function activeNo() {
    try { if (typeof keyagentGetActiveStudentNumber === 'function') { var a = keyagentGetActiveStudentNumber(); if (a) return String(a); } } catch (e) {}
    var o = rd(ACTIVE); return o && o.studentNumber ? String(o.studentNumber) : '';
  }
  function setActive(no) {
    var o = rd(ACTIVE);
    if (!o || String(o.studentNumber) !== String(no)) wr(ACTIVE, { studentNumber: String(no), name: null, className: null, seatNumber: null, verified: false, source: 'jb2' });
    // 同步寫進總地圖與各章，讓大家看到同一個學號
    var h = rd(HUB); h.who = Object.assign({ cls: '', no: '', name: '' }, h.who || {}, { no: String(no) }); wr(HUB, h);
    for (var n = 1; n <= NCH; n++) { var d = rd(chKey(n)); d._who = Object.assign({ cls: '', name: '' }, d._who || {}, { no: String(no), sid: String(no) }); wr(chKey(n), d); }
  }
  function knownNo() {  // 之前在 JB2 裡填過的學號（沒有平台登入時沿用）
    var h = rd(HUB); if (h.who && h.who.no) return String(h.who.no);
    for (var n = 1; n <= NCH; n++) { var w = rd(chKey(n))._who; if (w && (w.no || w.sid)) return String(w.no || w.sid); }
    return '';
  }

  /* ===== 1. 強迫輸入學號 ===== */
  function gate(onDone) {
    var q = ''; try { q = new URLSearchParams(location.search).get('student') || ''; } catch (e) {}
    var cur = activeNo() || knownNo(), no = cur || q;   // 本機已經有學號就以它為準，網址上的 ?student= 不能覆蓋（避免冒用）
    if (q && cur && q !== cur) { try { window.JB2Seal && JB2Seal.log('idChange', '', '網址學號 ' + q + ' 被忽略（本機是 ' + cur + '）'); } catch (e) {} }
    if (no) { setActive(no); onDone && onDone(no); return; }
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#0b0f22f2;display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,"Noto Sans TC",sans-serif';
    ov.innerHTML = '<div style="max-width:380px;width:100%;background:#161a2e;border:2px solid #d2a24c;border-radius:16px;padding:22px;color:#f1e8d2;text-align:center">' +
      '<div style="font-size:42px">🪪</div><h2 style="margin:6px 0 8px;font-size:20px">請先輸入你的學號</h2>' +
      '<p style="margin:0 0 12px;font-size:14px;opacity:.85">老師要靠學號才看得到你的星星和練習紀錄。不用填真名、電話。</p>' +
      '<input id="jb2gNo" inputmode="numeric" maxlength="12" autocomplete="off" placeholder="學號" style="width:100%;box-sizing:border-box;font-size:20px;text-align:center;padding:10px;border-radius:10px;border:1px solid #3a4270;background:#0b0f22;color:#f1e8d2">' +
      '<div id="jb2gMsg" style="min-height:20px;margin:8px 0;color:#ffb38a;font-size:13px"></div>' +
      '<button id="jb2gOk" style="font-size:17px;font-weight:700;padding:10px 26px;border:0;border-radius:12px;background:#d2a24c;color:#2a1d05;cursor:pointer">開始冒險</button></div>';
    document.body.appendChild(ov);
    var inp = ov.querySelector('#jb2gNo'), msg = ov.querySelector('#jb2gMsg');
    function ok() {
      var v = inp.value.trim();
      if (!/^[A-Za-z0-9_-]{2,12}$/.test(v)) { msg.textContent = '請輸入正確的學號（2～12 個英數字）'; return; }
      setActive(v); ov.remove(); onDone && onDone(v); push();
    }
    ov.querySelector('#jb2gOk').onclick = ok;
    inp.onkeydown = function (e) { if (e.key === 'Enter') ok(); };
    setTimeout(function () { inp.focus(); }, 50);
  }

  /* ===== 2. 整理資料 ===== */
  // pSecs＝練習秒數（只算做完一次的時間，跳開／中途關閉不算）；totalQ／totalOk＝該關累計作答題數／答對題數
  function build() {
    var stages = {}, q = {}, weak = [], totalStars = 0, totalPlays = 0, pSecs = 0, lastAt = 0, lastId = '';
    var names = {};
    (GC.chapters || []).forEach(function (c) { (c.stages || []).forEach(function (s) { names[s[0]] = s[1]; }); });
    for (var n = 1; n <= NCH; n++) {
      var d = rd(chKey(n)), Q = d._q || {}, tq = {}, tok = {};
      for (var qk in Q) {
        var v = Q[qk]; if (!v || !(v.n > 0)) continue;
        q[qk] = { n: v.n | 0, ok: v.ok | 0 };
        if (v.n >= 3) weak.push({ k: qk, n: v.n | 0, ok: v.ok | 0 });
        var sid = qk.split(':')[0]; tq[sid] = (tq[sid] || 0) + (v.n | 0); tok[sid] = (tok[sid] || 0) + (v.ok | 0);
      }
      for (var k in d) {
        if (k[0] === '_') continue;
        var s = d[k]; if (!s || typeof s !== 'object') continue;
        var st = s.stars | 0, tr = s.tries | 0, sc = Math.round(s.psecs || 0);
        if (!st && !tr && !sc && !tq[k]) continue;
        stages[k] = { n: names[k] || '', ch: n, bestStars: st, plays: tr, pSecs: sc, totalQ: tq[k] || 0, totalOk: tok[k] || 0, lastStars: s.lastStars == null ? null : (s.lastStars | 0), lastMode: s.lastMode || '' };
        if (s.hist && s.hist.length) stages[k].hist = s.hist;   // 每一次作答：at 時間、q 題數、ok 答對、s 秒數、st 星、m 模式
        totalStars += st; totalPlays += tr; pSecs += sc;
      }
      var L = d._last; if (L && L.at > lastAt && stages[L.id]) { lastAt = L.at; lastId = L.id; }
    }
    weak.sort(function (a, b) { return (a.ok / a.n) - (b.ok / b.n) || b.n - a.n; });
    var ls = lastId ? stages[lastId] : null;
    var hw = rd(HUB).who || {};
    var rec = {
      hero: hw.name || '', totalStars: totalStars, totalPlays: totalPlays, pSecs: pSecs,
      lastId: lastId, lastName: ls ? ls.n : '', lastAt: lastAt,
      lastStars: ls ? ls.lastStars : null, lastBest: ls ? ls.bestStars : null, lastMode: ls ? ls.lastMode : '',
      stages: stages, q: q, weak: weak.slice(0, 8),
      tamper: (function () { try { var t = window.JB2Seal && JB2Seal.summary(); return t && (t.wipe || t.soft || t.blocked || t.forged || t.idChange.length) ? t : null; } catch (e) { return null; } })()
    };
    try { rec = mergeDefense(rec, names); } catch (e) {}
    try { var lv = JSON.parse(localStorage.getItem('jb2-leave-v1')); if (lv && lv.n > 0) rec.leave = { n: lv.n | 0, secs: lv.secs | 0, lastAt: lv.lastAt | 0 }; } catch (e) {}   // 離開遊戲畫面的累計次數（老師報表標 🚪）
    try { var gs = window.JB2Guess && JB2Guess.summary(); if (gs) rec.guess = gs; } catch (e) {}   // 「答錯馬上重開、秒答亂猜」的違規／鎖定記錄
    return rec;
  }


  /* ===== 2b. 併入「數學保衛戰」的紀錄（目前用不到：保衛戰已是獨立網站 mathtestjb2.vercel.app，紀錄由它自己送到後台、後台自動合併；
   這段只有在「保衛戰放回同一個網站」時才會作用，沒有資料時完全不動作，留著無害） =====
   * 保衛戰每玩完一關，會把結果記在 localStorage『md_jb2rec_v1』（格式跟這裡的 stages／q 一樣）。
   * 這裡把兩邊合併成同一份交給老師：星星取最高、練習次數／秒數／題數累計、每次作答紀錄依時間合併（保衛戰的標 g:'d'）、
   * 各題型對錯累計，並另外附 defense 摘要，報表可以標出「這位學生也玩過數學保衛戰」。 */
  var DEF = 'md_jb2rec_v1';
  function readDef() { try { var o = JSON.parse(localStorage.getItem(DEF)); return o && o.v === 1 ? o : null; } catch (e) { return null; } }
  function mergeDefense(rec, names) {
    var D = readDef(); if (!D || !D.stages) return rec;
    var hasNames = false; for (var nm in (names || {})) { hasNames = true; break; }
    var st = rec.stages, k, d, b, dPlays = 0, dSecs = 0, dStars = 0;
    for (k in D.stages) {
      d = D.stages[k]; if (!d || !/^[1-6]-[1-3]-[1-3]$/.test(k) || (hasNames && !names[k])) continue;   // 只收真的存在的關卡
      /* 保衛戰的紀錄沒有簽章保護，這裡先擋掉不可能的數字，免得報表被亂填 */
      d = { n: String(d.n || '').slice(0, 20), ch: d.ch, bestStars: Math.min(5, Math.max(0, d.bestStars | 0)), plays: Math.min(5000, Math.max(0, d.plays | 0)),
            pSecs: Math.min(5000 * 1800, Math.max(0, +d.pSecs || 0)), totalQ: Math.min(200000, Math.max(0, d.totalQ | 0)), totalOk: 0, lastStars: d.lastStars == null ? null : Math.min(5, Math.max(0, d.lastStars | 0)),
            lastMode: String(d.lastMode || '').slice(0, 6), lastAt: +d.lastAt || 0, hist: Array.isArray(d.hist) ? d.hist : [], _ok: d.totalOk | 0 };
      d.totalOk = Math.min(d.totalQ, Math.max(0, d._ok));
      b = st[k];
      dPlays += d.plays | 0; dSecs += Math.round(d.pSecs || 0); dStars += d.bestStars | 0;
      if (!b) { st[k] = b = { n: d.n || '', ch: d.ch || +k.charAt(0), bestStars: 0, plays: 0, pSecs: 0, totalQ: 0, totalOk: 0, lastStars: null, lastMode: '' }; }
      else if (!b.n && d.n) b.n = d.n;
      b.bestStars = Math.max(b.bestStars | 0, d.bestStars | 0);
      b.plays = (b.plays | 0) + (d.plays | 0);
      b.pSecs = (b.pSecs || 0) + Math.round(d.pSecs || 0);
      b.totalQ = (b.totalQ | 0) + (d.totalQ | 0);
      b.totalOk = (b.totalOk | 0) + (d.totalOk | 0);
      var bLast = b.hist && b.hist.length ? b.hist[b.hist.length - 1].at : 0;   // JB2 這關最近一次作答的時間
      if (d.lastAt && d.lastAt >= bLast) { b.lastStars = d.lastStars == null ? null : d.lastStars; b.lastMode = d.lastMode || ''; }
      var h = (b.hist || []).concat((d.hist || []).map(function (e) { return { at: e.at, q: e.q, ok: e.ok, s: e.s, st: e.st, m: e.m, g: 'd' }; }));
      if (h.length) { h.sort(function (p, q) { return p.at - q.at; }); b.hist = h.slice(-30); }
    }
    var q = rec.q, weak = [], qk, v, dq = D.q || {};
    for (qk in dq) { v = dq[qk]; if (!v || !(v.n > 0) || v.n > 200000) continue; var c = q[qk] || (q[qk] = { n: 0, ok: 0 }); c.n += v.n | 0; c.ok += Math.min(v.n | 0, Math.max(0, v.ok | 0)); }
    for (qk in q) if (q[qk].n >= 3) weak.push({ k: qk, n: q[qk].n, ok: q[qk].ok });
    weak.sort(function (a, b2) { return (a.ok / a.n) - (b2.ok / b2.n) || b2.n - a.n; });
    rec.weak = weak.slice(0, 8);
    var ts = 0, tp = 0, ps = 0;
    for (k in st) { ts += st[k].bestStars | 0; tp += st[k].plays | 0; ps += st[k].pSecs || 0; }
    rec.totalStars = ts; rec.totalPlays = tp; rec.pSecs = ps;
    if (D.lastAt && D.lastAt > (rec.lastAt || 0) && D.lastId && st[D.lastId]) {      // 最近玩的是保衛戰
      var ls = st[D.lastId]; rec.lastId = D.lastId; rec.lastName = ls.n || ''; rec.lastAt = D.lastAt;
      rec.lastStars = ls.lastStars == null ? null : ls.lastStars; rec.lastBest = ls.bestStars; rec.lastMode = ls.lastMode || '';
    }
    if (!rec.hero && D.hero) rec.hero = D.hero;
    rec.defense = { plays: dPlays, pSecs: dSecs, stars: dStars, lastAt: D.lastAt || 0 };
    return rec;
  }

  /* ===== 3. 送出（經 sync-client.js） ===== */
  var tm = null;
  function push() {
    clearTimeout(tm);
    tm = setTimeout(function () {
      try {
        if (!activeNo() || typeof keyagentUpdateOtherGame !== 'function') return;
        var rec = build();
        keyagentUpdateOtherGame('jb2', function () { return rec; });
      } catch (e) {}
    }, 400);
  }
  try { if (typeof keyagentInstallPageHideSync === 'function') keyagentInstallPageHideSync(); } catch (e) {}

  window.JB2Sync = { setNo: setActive, gate: gate, push: push, build: build, activeNo: activeNo, _merge: mergeDefense };
})();
