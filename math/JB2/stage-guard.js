/* JB2 學生端防作弊守衛  v1
 * 用法：<script src="../stage-guard.js"></script>            → 只關右鍵／複製／選取／開發人員快捷鍵
 *       <script src="../stage-guard.js" data-leave="1"></script> → 另外加上「離開頁面＝關閉此局」（只放在關卡頁）
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

  /* ---------- B. 離開頁面 = 直接關閉這一局（只在關卡頁啟用） ---------- */
  if (!LEAVE) return;
  var fired = false;

  function cover(msg) {
    try {
      var d = document.createElement('div');
      d.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#161a2e;color:#f1e8d2;' +
        'display:flex;align-items:center;justify-content:center;text-align:center;font:700 20px/1.6 sans-serif;padding:24px';
      d.style.whiteSpace = 'pre-line'; d.textContent = msg || '⚠️ 偵測到離開遊戲頁面，這一局已關閉';
      document.body.appendChild(d);
    } catch (e) {}
  }

  /* ---------- 離開次數：同一關累計 3 次 → 這關判定失敗、鎖 10 分鐘（存在這台裝置；累計次數也送給老師後台） ---------- */
  var LK = 'jb2-leave-v1', MAX = 3, LOCK_MS = 600000, AWAY_MS = 3000;
  var SKEY = (location.pathname.match(/(stage[\d-]+)/) || [])[1] || location.pathname;
  function ld() { try { var o = JSON.parse(localStorage.getItem(LK)); if (o && typeof o === 'object') return o; } catch (e) {} return { n: 0, secs: 0, lastAt: 0, stages: {} }; }
  function sv(o) { try { localStorage.setItem(LK, JSON.stringify(o)); } catch (e) {} }
  function lockLeft() {
    var s = (ld().stages || {})[SKEY];
    return s && s.until > Date.now() ? Math.min(s.until - Date.now(), LOCK_MS) : 0;
  }
  function note(secs) {                          // 記一次離開；回傳這一關目前累計幾次
    var o = ld(), now = Date.now(), s = (o.stages = o.stages || {})[SKEY] || (o.stages[SKEY] = { n: 0, lastAt: 0, until: 0 });
    if (now - (s.lastAt || 0) > 1800000) s.n = 0;          // 超過 30 分鐘沒再離開，重新算
    s.n += 1; s.lastAt = now;
    o.n = (o.n | 0) + 1; o.secs = (o.secs | 0) + (secs | 0); o.lastAt = now;
    if (s.n >= MAX) { s.until = now + LOCK_MS; s.n = 0; sv(o); return MAX; }
    sv(o); return s.n;
  }
  function exitTo(reason, msg) {
    cover(msg);
    if (window.parent !== window) {
      try { window.parent.postMessage({ type: 'stage-exit', reason: reason, msg: msg }, '*'); } catch (e) {}
    } else {                                   // 單獨開啟關卡（沒有被地圖包著）→ 直接回該章地圖
      var m = location.pathname.match(/stage(\d)-/);
      setTimeout(function () { location.replace('world-map-vol2ch' + (m ? m[1] : '1') + '.html'); }, 1500);
    }
  }
  var LOCKMSG = function (ms) { return '🚫 這一關你已離開遊戲畫面 ' + MAX + ' 次，這關判定失敗！\n請等 ' + Math.ceil(ms / 60000) + ' 分鐘後再挑戰（已記錄給老師）。'; };

  function leave(secs) {
    if (fired) return;
    fired = true;
    var n = note(secs);
    if (n >= MAX) return exitTo('leave3', LOCKMSG(LOCK_MS));
    exitTo('left', '⚠️ 偵測到你離開了遊戲頁面，這一局已被關閉！（這關已離開 ' + n + ' / ' + MAX + ' 次，滿 ' + MAX + ' 次這關判定失敗）\n作答時請不要切換到其他網頁或程式喔。');
  }

  /* 一進關卡就檢查：這關還在鎖定中就直接退出 */
  var lk = lockLeft();
  if (lk > 0) { fired = true; var _go = function () { exitTo('locked', LOCKMSG(lk)); }; if (document.body) _go(); else document.addEventListener('DOMContentLoaded', _go); return; }

  /* 切到別的分頁／App（頁面被藏起來）→ 立刻關閉這一局 */
  document.addEventListener('visibilitychange', function () { if (document.hidden) leave(0); });
  /* 縮成小視窗、分割畫面、懸浮視窗（頁面沒被藏起來，只是失去焦點）→ 離開超過 3 秒，回來時關閉這一局 */
  var since = 0, okSeen = false, relaxWas = false, relaxLost = false;
  function relaxOn() { try { return !!(window.RelaxBreak && window.RelaxBreak.active); } catch (e) { return false; } }
  function tick() {
    /* 休息小遊戲（iframe 在本頁內）進行中／剛結束：焦點在小遊戲裡或剛被收掉，不是學生離開。
       小遊戲收掉後本頁會暫時沒有焦點（直到學生再點一下），所以結束後要「等到重新取得焦點」才恢復偵測，否則會誤判成離開。 */
    var rx = relaxOn();
    if (rx) { relaxWas = true; since = 0; if (!document.hidden) return; }
    else if (relaxWas) { relaxWas = false; relaxLost = true; since = 0; try { window.focus(); } catch (e) {} }
    var bad = document.hidden || (document.hasFocus && !document.hasFocus());
    if (bad && relaxLost && !document.hidden) return;   // 小遊戲剛結束、尚未重新取得焦點：先不計
    if (!bad) relaxLost = false;
    if (bad) { if (okSeen && !since) since = Date.now(); return; }
    okSeen = true;
    if (!since) return;
    var ms = Date.now() - since; since = 0;
    if (ms >= AWAY_MS) leave(Math.round(ms / 1000));
  }
  window.addEventListener('blur', function () { setTimeout(tick, 60); });
  window.addEventListener('focus', function () { setTimeout(tick, 60); });
  setInterval(tick, 500);
})();
