'use strict';
/* 浮動小按鈕（背景音樂 🎵、國字加註）避開遊戲按鈕：
   蓋到遊戲自己的按鈕時變透明、讓點擊穿過去。
   （原本是別人網站 home-button.js 的一部分；這裡只留這個功能，不連外、不載入其他腳本。） */
(function () {
  var css = document.createElement('style');
  css.textContent = '.kg-dodge{opacity:.12!important;pointer-events:none!important}';
  document.head.appendChild(css);
  var FLOAT = ['nz-btn', 'kg-bgm-btn'];
  var GAME = 'button,a[href],input,select,textarea,label,[role="button"],[onclick],[draggable="true"],[tabindex]:not([tabindex="-1"])';
  function isFloat(el) { for (var i = 0; i < FLOAT.length; i++) { var f = document.getElementById(FLOAT[i]); if (f && (f === el || f.contains(el))) return true; } return false; }
  function covers(f) {
    var r = f.getBoundingClientRect();
    if (!r.width) return false;
    var pts = [[.5, .5], [.15, .2], [.85, .2], [.15, .8], [.85, .8]];
    for (var i = 0; i < pts.length; i++) {
      var x = r.left + r.width * pts[i][0], y = r.top + r.height * pts[i][1];
      var stack = document.elementsFromPoint ? document.elementsFromPoint(x, y) : [];
      for (var j = 0; j < stack.length; j++) {
        var el = stack[j];
        if (el === document.body || el === document.documentElement) break;
        if (isFloat(el) || (el.closest && el.closest('#nz-pop'))) continue;
        var g = el.closest ? el.closest(GAME) : null;
        if (g && !isFloat(g) && !g.disabled) return true;
      }
    }
    return false;
  }
  function dodge() {
    for (var i = 0; i < FLOAT.length; i++) {
      var f = document.getElementById(FLOAT[i]);
      if (!f) continue;
      f.classList.remove('kg-dodge');
      if (covers(f)) f.classList.add('kg-dodge');
    }
  }
  setInterval(dodge, 400);
  window.addEventListener('scroll', dodge, { passive: true });
  window.addEventListener('resize', dodge);
})();
