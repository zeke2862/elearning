/* JB2 學生端防作弊守衛  v2（換題規則）
 * 用法：<script src="../stage-guard.js"></script>            → 只關右鍵／複製／選取／開發人員快捷鍵
 *       <script src="../stage-guard.js" data-leave="1"></script> → 另外加上「換題規則」：離開畫面／重新整理／關掉重開都算換題，同一局 3 次判定違規（只放在關卡頁）
 * 教師專用頁（teacher / config-editor / world-map-vol2-teacher / jb2-report）請不要引入。
 */
(function () {
  'use strict';
  var me = document.currentScript;
  var LEAVE = !!(me && me.getAttribute('data-leave'));

  /* ---------- C. 關閉右鍵、複製、選取、拖曳、列印 ---------- */
  var st = document.createElement('style');
  st.textContent =
    '*{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-user-drag:none}' +
    'input,textarea,[contenteditable="true"]{-webkit-user-select:text;user-select:text}' +
    '@media print{body{display:none!important}}';
  (document.head || document.documentElement).appendChild(st);

  function isField(t) {
    return !!(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable));
  }
  function stop(e) { e.preventDefault(); return false; }

  document.addEventListener('contextmenu', stop, true);
  document.addEventListener('dragstart', stop, true);
  document.addEventListener('selectstart', function (e) { if (!isField(e.target)) stop(e); }, true);
  ['copy', 'cut'].forEach(function (n) {
    document.addEventListener(n, function (e) { if (!isField(e.target)) stop(e); }, true);
  });

  document.addEventListener('keydown', function (e) {
    var ctrl = e.ctrlKey || e.metaKey, k = e.code || '';
    var bad = false;
    if (e.key === 'F12') bad = true;                                   // 開發人員工具
    else if (ctrl && e.shiftKey && /^Key[IJCKM]$/.test(k)) bad = true; // Ctrl+Shift+I/J/C/K/M
    else if (e.metaKey && e.altKey && /^Key[IJCU]$/.test(k)) bad = true; // Mac：Cmd+Option+I/J/C/U
    else if (ctrl && /^Key[USP]$/.test(k)) bad = true;                 // 檢視原始碼／另存／列印
    else if (ctrl && /^Key[ACX]$/.test(k) && !isField(e.target)) bad = true; // 全選／複製／剪下（輸入框除外）
    if (bad) { e.preventDefault(); e.stopPropagation(); return false; }
  }, true);

  /* ---------- D. 防截圖：已關閉（電腦版允許截圖；不再偵測截圖鍵、不再因切換視窗蓋黑畫面）---------- */

  /* ---------- 從地圖選好模式進來：一開始就把關卡自己的「模式選單」藏起來，避免閃一下／手機卡住 ----------
   * （原本要等頁面底部的 mode-system.js 跑完才會藏；網路慢時會先畫出選單。只在關卡頁啟用） */
  if (LEAVE) {
    try {
      var q = new URLSearchParams(location.search), md = q.get('mode');
      if (q.get('endless') === '1' || q.get('practice') || ['easy', 'real', 'hard'].indexOf(md) >= 0) {
        var hs = document.createElement('style');
        hs.textContent = 'html.jb-pre #s-start{visibility:hidden}html.jb-pre #s-start #ms-lesson-holder{visibility:visible}';
        (document.head || document.documentElement).appendChild(hs);
        document.documentElement.classList.add('jb-pre');
        setTimeout(function () { document.documentElement.classList.remove('jb-pre'); }, 6000); // 保險：6 秒後一定放行
      }
    } catch (e) {}
  }

  /* ---------- B. 「換題」規則（只在關卡頁啟用）----------
   * 一局＝按下開始到結算。下面三種情況都算「換題」一次：
   *   1) 切到別的分頁／App 超過 2 秒再回來  → 這一題作廢、重新出題
   *   2) 重新整理                          → 這一局沒打完就重開
   *   3) 關掉重開（含回地圖再進來）          → 同上
   * 同一局累計 3 次換題 → 這一局判定違規（不計成績，只這一局失敗，不鎖定）。
   * 30 分鐘內第 2 次違規 → 這一關鎖定 10 分鐘。
   * 已拿掉：「頁面失去焦點超過 3 秒」的偵測（手機通知、分割畫面、小遊戲視窗都會誤判）。 */
  if (!LEAVE) return;

  var LK = 'jb2-leave-v1', MAX = 3, LOCK_MS = 600000, AWAY_MS = 2000, WIN_MS = 1800000, VIOL_LOCK = 2;
  var SKEY = (location.pathname.match(/(stage[\d-]+)/) || [])[1] || location.pathname;
  var live = false, hideAt = 0, fired = false;

  function cover(msg) {
    try {
      var d = document.createElement('div');
      d.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#161a2e;color:#f1e8d2;' +
        'display:flex;align-items:center;justify-content:center;text-align:center;font:700 20px/1.6 sans-serif;padding:24px';
      d.style.whiteSpace = 'pre-line'; d.textContent = msg;
      document.body.appendChild(d);
    } catch (e) {}
  }
  function banner(msg) {
    try {
      var d = document.createElement('div');
      d.style.cssText = 'position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:2147483646;background:#b3261e;color:#fff;' +
        'padding:10px 16px;border-radius:10px;font:700 15px/1.5 system-ui,sans-serif;max-width:92vw;text-align:center;white-space:pre-line;box-shadow:0 4px 14px #0008';
      d.textContent = '⚠️ ' + msg; document.body.appendChild(d);
      setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 7000);
    } catch (e) {}
  }

  /* 記錄：每一關 { n:這一局已換題幾次, at:這一局最後動靜, open:這一局還沒結算, v:近期違規次數, vAt, until:鎖到何時 }；
   * 全域 n／secs／lastAt 是「離開次數」給老師後台看（jb2-sync.js 會讀） */
  function ld() { try { var o = JSON.parse(localStorage.getItem(LK)); if (o && typeof o === 'object') return o; } catch (e) {} return { n: 0, secs: 0, lastAt: 0, stages: {} }; }
  function sv(o) { try { localStorage.setItem(LK, JSON.stringify(o)); } catch (e) {} }
  function stOf(o) { o.stages = o.stages || {}; return o.stages[SKEY] || (o.stages[SKEY] = { n: 0, at: 0, open: 0, v: 0, vAt: 0, until: 0 }); }
  function lockLeft() {
    var s = (ld().stages || {})[SKEY];
    return s && s.until > Date.now() ? Math.min(s.until - Date.now(), LOCK_MS) : 0;
  }
  function exitTo(reason, msg) {
    fired = true; live = false;
    cover(msg);
    if (window.parent !== window) {
      try { window.parent.postMessage({ type: 'stage-exit', reason: reason, msg: msg }, '*'); } catch (e) {}
    } else {                                   // 單獨開啟關卡（沒有被地圖包著）→ 直接回該章地圖
      var m = location.pathname.match(/stage(\d)-/);
      setTimeout(function () { location.replace('world-map-vol2ch' + (m ? m[1] : '1') + '.html'); }, 1500);
    }
  }
  var LOCKMSG = function (ms) { return '🚫 這一關近期已 ' + VIOL_LOCK + ' 次判定違規，暫時鎖定。\n請等 ' + Math.ceil(ms / 60000) + ' 分鐘後再挑戰（已記錄給老師）。'; };

  /* 記一次換題；回傳 { n:這一局目前幾次, viol:這一局判定違規, locked:這一關被鎖 } */
  function change(secs) {
    var o = ld(), now = Date.now(), s = stOf(o);
    if (s.at && now - s.at > WIN_MS) s.n = 0;            // 超過 30 分鐘沒動靜：重新算
    if (s.vAt && now - s.vAt > WIN_MS) s.v = 0;
    s.n += 1; s.at = now;
    o.n = (o.n | 0) + 1; o.secs = (o.secs | 0) + (secs | 0); o.lastAt = now;
    var r = { n: s.n, viol: false, locked: false };
    if (s.n >= MAX) {
      r.viol = true; s.n = 0; s.open = 0; s.v = (s.v | 0) + 1; s.vAt = now;
      if (s.v >= VIOL_LOCK) { s.until = now + LOCK_MS; s.v = 0; r.locked = true; }
    }
    sv(o); return r;
  }
  function report(r) {
    if (r.locked) return exitTo('leave3', LOCKMSG(LOCK_MS));
    if (r.viol) return exitTo('viol', '⚠️ 這一局已換題 ' + MAX + ' 次（離開畫面、重新整理或關掉重開都算），判定違規，這一局不計成績。\n請專心作答；再發生一次，這一關會鎖定 10 分鐘。（已記錄給老師）');
  }

  /* 給關卡頁用：一局開始／結算 */
  window.JB2Guard = {
    roundStart: function (rescue) {
      if (rescue || fired) return;
      var o = ld(), s = stOf(o), now = Date.now();
      if (s.at && now - s.at > WIN_MS) s.n = 0;
      s.open = 1; s.at = now; live = true; sv(o);
    },
    roundEnd: function () {
      var o = ld(), s = stOf(o); s.open = 0; s.n = 0; s.at = Date.now(); live = false; sv(o);
    },
    changes: function () { return (stOf(ld()).n | 0); }
  };

  /* 一進關卡就檢查：這關還在鎖定中 → 直接退出 */
  var lk = lockLeft();
  if (lk > 0) { fired = true; var _go = function () { exitTo('locked', LOCKMSG(lk)); }; if (document.body) _go(); else document.addEventListener('DOMContentLoaded', _go); return; }

  /* 上一局沒結算就進來（重新整理／關掉重開）：算換題一次 */
  (function () {
    var o = ld(), s = stOf(o), now = Date.now();
    if (!s.open) return;
    s.open = 0;
    if (s.at && now - s.at > WIN_MS) { s.n = 0; sv(o); return; }   // 隔很久才回來：不算
    sv(o);
    var r = change(0);
    if (r.viol || r.locked) { var go = function () { report(r); }; if (document.body) go(); else document.addEventListener('DOMContentLoaded', go); }
    else {
      var go2 = function () { banner('偵測到你重新整理或關掉重開，這算「換題」（這一局已換題 ' + r.n + ' / ' + MAX + ' 次，滿 ' + MAX + ' 次這一局判定違規）。'); };
      if (document.body) go2(); else document.addEventListener('DOMContentLoaded', go2);
    }
  })();

  /* 切到別的分頁／App：回來時若離開超過 2 秒 → 這一題作廢重抽，算換題一次 */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { hideAt = Date.now(); return; }
    var away = hideAt ? Date.now() - hideAt : 0; hideAt = 0;
    if (!live || fired || away < AWAY_MS) return;
    var r = change(Math.round(away / 1000));
    if (r.viol || r.locked) return report(r);
    var redrawn = false;
    try { redrawn = !!(window.__jb2Redraw && window.__jb2Redraw()); } catch (e) {}
    banner('偵測到你離開了遊戲畫面' + (redrawn ? '，這一題已作廢、重新出題' : '') + '（這一局已換題 ' + r.n + ' / ' + MAX + ' 次，滿 ' + MAX + ' 次這一局判定違規）。作答時請不要切換到其他網頁或程式喔。');
  });
})();
