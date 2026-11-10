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
    var no = q || activeNo() || knownNo();
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
  function build() {
    var stages = {}, weak = [], totalStars = 0, totalPlays = 0, totalSecs = 0, lastAt = 0, lastId = '';
    var names = {};
    (GC.chapters || []).forEach(function (c) { (c.stages || []).forEach(function (s) { names[s[0]] = s[1]; }); });
    for (var n = 1; n <= NCH; n++) {
      var d = rd(chKey(n));
      for (var k in d) {
        if (k[0] === '_') continue;
        var s = d[k]; if (!s || typeof s !== 'object') continue;
        var st = s.stars | 0, tr = s.tries | 0, sc = Math.round(s.secs || 0);
        if (!st && !tr && !sc) continue;
        stages[k] = { n: names[k] || '', ch: n, bestStars: st, plays: tr, totalSecs: sc, lastStars: s.lastStars == null ? null : (s.lastStars | 0), lastMode: s.lastMode || '' };
        totalStars += st; totalPlays += tr; totalSecs += sc;
      }
      var L = d._last; if (L && L.at > lastAt && stages[L.id]) { lastAt = L.at; lastId = L.id; }
      var Q = d._q || {};
      for (var qk in Q) { var v = Q[qk]; if (v && v.n >= 3) weak.push({ k: qk, n: v.n, ok: v.ok | 0 }); }
    }
    weak.sort(function (a, b) { return (a.ok / a.n) - (b.ok / b.n) || b.n - a.n; });
    var ls = lastId ? stages[lastId] : null;
    var hw = rd(HUB).who || {};
    return {
      hero: hw.name || '', totalStars: totalStars, totalPlays: totalPlays, totalSecs: totalSecs,
      lastId: lastId, lastName: ls ? ls.n : '', lastAt: lastAt,
      lastStars: ls ? ls.lastStars : null, lastBest: ls ? ls.bestStars : null, lastMode: ls ? ls.lastMode : '',
      stages: stages, weak: weak.slice(0, 8)
    };
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

  window.JB2Sync = { setNo: setActive, gate: gate, push: push, build: build, activeNo: activeNo };
})();
