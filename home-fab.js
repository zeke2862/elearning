/* home-fab.js —— 手機版「回主科目選單」小按鈕
 * 右側邊緣一顆半透明的 🏠，點了會問「要離開遊戲回主選單嗎？」確定就回到學號登入／科目首頁。
 * 只在手機／平板（或視窗很窄）出現；被包在別的頁面裡（iframe）時不出現；首頁本身不出現。
 * 用法：在遊戲頁面最後面加  <script src="路徑/home-fab.js"></script>（home-fab.js 放在網站最外層，跟 index.html 同一層） */
(function () {
  if (window.__homeFab || window.parent !== window) return; window.__homeFab = true;
  var me = document.currentScript, base = '';
  try { base = new URL('.', me.src).href; } catch (e) { return; }
  var home = base + 'index.html';
  try {
    var here = location.href.split(/[?#]/)[0];
    if (here === home || here === base) return;                      // 已經在首頁
  } catch (e) {}
  var coarse = false;
  try { coarse = matchMedia('(pointer: coarse)').matches || (matchMedia('(hover: none)').matches && navigator.maxTouchPoints > 0); } catch (e) {}
  if (!coarse && window.innerWidth > 900 && !/[?&]mobile=1/.test(location.search)) return;

  function dock() {
    var d = document.getElementById('mobileDock');
    if (d) return d;
    d = document.createElement('div'); d.id = 'mobileDock';
    d.style.cssText = 'position:fixed;right:max(4px,env(safe-area-inset-right));top:50%;transform:translateY(-50%);z-index:2147483001;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
    document.body.appendChild(d); return d;
  }
  function build() {
    var b = document.createElement('button');
    b.type = 'button'; b.id = 'mobileHomeBtn'; b.textContent = '🏠'; b.setAttribute('aria-label', '回主科目選單'); b.title = '回主科目選單';
    b.style.cssText = 'pointer-events:auto;width:38px;height:38px;padding:0;font-size:18px;line-height:1;border-radius:50%;border:1px solid rgba(255,255,255,.7);background:rgba(20,20,40,.55);color:#fff;touch-action:manipulation;opacity:.7;';
    b.addEventListener('pointerdown', function (e) { e.preventDefault(); });
    b.addEventListener('click', function (e) {
      e.preventDefault();
      if (window.confirm('要離開這個遊戲，回到主科目選單嗎？\n（這一局還沒結束的進度可能不會儲存）')) location.href = home;
    });
    dock().insertBefore(b, dock().firstChild);
  }
  if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
})();
