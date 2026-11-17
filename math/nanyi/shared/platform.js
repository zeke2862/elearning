/* platform.js —— 南一版數學樂園 × 教師後台
 * 1) 沒登入學號不能玩（跟平台共用 keyagent_active_student）
 * 2) 回報每一關成績到教師後台（遊戲代號 math-nanyi，用 sync-client.js 寄送）
 * 3) 防竄改：lockdown.js（擋 F12／右鍵／看原始碼）＋ 秒答亂猜標記 ＋ 成績只收「玩完的一局」
 * 提供 window.KGReport（各年級頁、月考卷、故障修復局本來就會呼叫）。 */
(function () {
  'use strict';
  var GAME_KEY = 'math-nanyi';
  var HOME = (function () {           // 平台首頁（math/nanyi/shared → 往上三層）
    try { return new URL('../../../index.html', document.currentScript.src).href; } catch (e) { return '/'; }
  })();
  var hasSync = typeof keyagentUpdateOtherGame === 'function';

  /* ---------- 1. 學號登入 ---------- */
  function student() { return hasSync ? keyagentGetActiveStudentNumber() : null; }
  function gate() {
    if (student()) return;
    var box = document.createElement('div');
    box.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(40,30,70,.92);display:flex;align-items:center;justify-content:center;font-family:"Microsoft JhengHei","PingFang TC",sans-serif';
    box.innerHTML = '<div style="background:#fff;border-radius:22px;padding:26px 28px;max-width:340px;width:88%;text-align:center;color:#4a3b5c">' +
      '<div style="font-size:42px">🎒</div><h2 style="margin:6px 0">請先登入</h2>' +
      '<p style="margin:0 0 12px;font-size:15px">輸入你的學號，老師才看得到你的學習紀錄喔！</p>' +
      '<input id="plId" maxlength="12" placeholder="學號" style="width:100%;box-sizing:border-box;font-size:20px;padding:10px;border:3px solid #ffd9b8;border-radius:12px;text-align:center">' +
      '<div id="plErr" style="color:#d33;font-size:14px;min-height:20px;margin:6px 0"></div>' +
      '<button id="plGo" style="font:inherit;font-weight:800;font-size:18px;padding:10px 26px;border:0;border-radius:999px;background:#e8590c;color:#fff;cursor:pointer">開始玩</button>' +
      '<div style="margin-top:12px"><a href="' + HOME + '" style="color:#8a7a99;font-size:14px">← 回學習平台登入</a></div></div>';
    function mount() { document.body.appendChild(box); var i = box.querySelector('#plId'); i.focus();
      function go() {
        var v = (i.value || '').trim();
        if (!/^[A-Za-z0-9_-]{2,12}$/.test(v)) { box.querySelector('#plErr').textContent = '學號格式不對，請再輸入一次'; return; }
        try { localStorage.setItem('keyagent_active_student', JSON.stringify({ studentNumber: v, verified: false })); } catch (e) {}
        box.remove();
      }
      box.querySelector('#plGo').onclick = go;
      i.onkeydown = function (e) { if (e.key === 'Enter') go(); };
    }
    if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
  }
  if (!hasSync) console.warn('[math-nanyi] sync-client.js 沒載入，成績不會送到後台');
  gate();

  /* ---------- 2. 成績回報 ---------- */
  var GR = ['', '一', '二', '三', '四', '五', '六'];
  var m = /grade(\d)-(\d)/.exec(location.pathname), BOOKID = m ? 'g' + m[1] + m[2] : (/fix-lab/.test(location.pathname) ? 'fixlab' : 'main');
  var BOOKNAME = m ? GR[+m[1]] + (m[2] === '1' ? '上' : '下') : (BOOKID === 'fixlab' ? '故障修復局' : '');
  var L = null, T0 = 0, ACC = 0;
  function tPause() { if (T0) { ACC += Date.now() - T0; T0 = 0; } }
  document.addEventListener('visibilitychange', function () { if (document.hidden) tPause(); else if (L && !T0) T0 = Date.now(); });

  function stageOf(name, unit) {
    var mm = /^(\d+)-/.exec(name || '');
    if (BOOKID === 'fixlab') return { id: 'fixlab', n: '故障修復局' };
    if (mm) return { id: BOOKID + '-u' + mm[1], n: BOOKNAME + ' 第' + mm[1] + '單元' + (unit ? ' ' + String(unit).replace(/^第\s*\d+\s*單元\s*/, '') : '') };
    return { id: BOOKID + '-exam', n: BOOKNAME + ' 月考測驗卷' };
  }
  var API = {
    level: function (name, unit) {
      L = { name: String(name || ''), unit: unit || '', right: 0, total: 0, fast: 0, last: 0 };
      ACC = 0; T0 = document.hidden ? 0 : Date.now();
    },
    answer: function (ok) {
      if (!L) return; var now = Date.now();
      L.total++; if (ok) L.right++;
      if (L.last && now - L.last < 1200) L.fast++;      // 距上一題不到 1.2 秒 → 疑似亂猜
      L.last = now;
    },
    done: function (o) {
      if (!L || !hasSync) { L = null; return; }
      o = o || {}; tPause();
      var secs = Math.min(1800, Math.round(ACC / 1000)), lv = L; L = null; ACC = 0;
      var right = o.total != null ? o.right : lv.right, total = o.total != null ? o.total : lv.total;
      var st = stageOf(lv.name, lv.unit), stars = o.stars || 0;
      var score = total ? Math.round(right / total * 100) : stars * 33;
      var tkey = (lv.name.replace(/^\d+-/, '').split(/[：:]/)[0] || 'main').slice(0, 12);
      keyagentUpdateOtherGame(GAME_KEY, function (prev) {
        var stages = Object.assign({}, prev.stages), s = stages[st.id] || {};
        stages[st.id] = {
          n: st.n, bestStars: Math.max(s.bestStars || 0, stars), bestScore: Math.max(s.bestScore || 0, score),
          plays: (s.plays || 0) + 1,
          hist: (s.hist || []).concat([{ at: Date.now(), q: total, ok: right, s: secs, st: stars }]).slice(-30),
          totalSecs: (s.totalSecs || 0) + secs, totalQ: (s.totalQ || 0) + total, totalOk: (s.totalOk || 0) + right
        };
        var q = Object.assign({}, prev.q), k = st.id + ':' + tkey, qo = q[k] || { n: 0, ok: 0 };
        q[k] = { n: qo.n + total, ok: qo.ok + right, label: lv.name.replace(/^\d+-[A-Z]\s*/, '').slice(0, 24) };
        return {
          totalPlays: (prev.totalPlays || 0) + 1, bestScore: Math.max(prev.bestScore || 0, score),
          totalSecs: (prev.totalSecs || 0) + secs, totalQ: (prev.totalQ || 0) + total, totalOk: (prev.totalOk || 0) + right,
          totalFast: (prev.totalFast || 0) + lv.fast,     // 秒答次數累積（後台看亂猜）
          lastScore: score, lastId: st.id, lastName: st.n, lastAt: Date.now(), stages: stages, q: q
        };
      });
    }
  };
  window.KGReport = API;
  if (hasSync) keyagentInstallPageHideSync();
})();
