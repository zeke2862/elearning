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

  function cover() {
    try {
      var d = document.createElement('div');
      d.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#161a2e;color:#f1e8d2;' +
        'display:flex;align-items:center;justify-content:center;text-align:center;font:700 20px/1.6 sans-serif;padding:24px';
      d.textContent = '⚠️ 偵測到離開遊戲頁面，這一局已關閉';
      document.body.appendChild(d);
    } catch (e) {}
  }

  function leave() {
    if (fired) return;
    fired = true;
    cover();
    if (window.parent !== window) {
      try { window.parent.postMessage({ type: 'stage-exit', reason: 'left' }, '*'); } catch (e) {}
    } else {                                   // 單獨開啟關卡（沒有被地圖包著）→ 直接回該章地圖
      var m = location.pathname.match(/stage(\d)-/);
      location.replace('world-map-vol2ch' + (m ? m[1] : '1') + '.html');
    }
  }

  document.addEventListener('visibilitychange', function () { if (document.hidden) leave(); });
})();
