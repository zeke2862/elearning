/* mobile-input.js —— 讓只聽「電腦鍵盤按鍵」的遊戲，也能在手機／平板上用螢幕鍵盤打字。
 * 做法：右下角出現「⌨️ 鍵盤」按鈕，點一下叫出手機鍵盤；打的每個字，會被轉成一次電腦按鍵
 * （key、code 都有）送給遊戲，遊戲本身的規則完全不用改。電腦版不會出現這顆按鈕。
 * 遊戲自己有輸入框（例如中打的拼音框）時，點那個框就直接用，不會被搶走。 */
(function () {
  if (window.__mobileInput) return; window.__mobileInput = true;
  var coarse = false;
  try { coarse = matchMedia('(pointer: coarse)').matches || (matchMedia('(hover: none)').matches && navigator.maxTouchPoints > 0); } catch (e) {}
  if (!coarse && !/[?&]mobile=1/.test(location.search)) return;

  var SENT = '​';             // 輸入框裡先放一個看不見的字，這樣按「刪除」才收得到事件
  var emitted = '';
  var inp, btn;

  function codeOf(ch) {
    if (/^[a-z]$/i.test(ch)) return 'Key' + ch.toUpperCase();
    if (/^[0-9]$/.test(ch)) return 'Digit' + ch;
    return ({ ' ': 'Space', ',': 'Comma', '.': 'Period', '/': 'Slash', ';': 'Semicolon', "'": 'Quote', '[': 'BracketLeft', ']': 'BracketRight',
      '\\': 'Backslash', '-': 'Minus', '=': 'Equal', '`': 'Backquote' })[ch] || '';
  }
  function send(key, code, shift) {
    var init = { key: key, code: code || '', shiftKey: !!shift, bubbles: true, cancelable: true };
    var tgt = document.body || document;
    tgt.dispatchEvent(new KeyboardEvent('keydown', init));
    tgt.dispatchEvent(new KeyboardEvent('keyup', init));
  }
  function sendChar(ch) {
    if (ch === '\n') return send('Enter', 'Enter');
    send(ch, codeOf(ch), ch !== ch.toLowerCase());
  }
  function reset() { inp.value = SENT; emitted = ''; }

  function onInput() {
    var v = inp.value;
    if (v.indexOf(SENT) !== 0) {                 // 看不見的字被刪掉了＝按了刪除鍵
      send('Backspace', 'Backspace'); reset(); return;
    }
    var cur = v.slice(1), p = 0;
    while (p < emitted.length && p < cur.length && emitted[p] === cur[p]) p++;
    for (var i = emitted.length; i > p; i--) send('Backspace', 'Backspace');   // 輸入法把字改掉：先退回再補
    Array.from(cur.slice(p)).forEach(sendChar);
    emitted = cur;
    if (!inp.__comp && cur.length > 0) reset();
  }

  function build() {
    inp = document.createElement('input');
    inp.type = 'text'; inp.id = 'mobileKbdBridge';
    inp.setAttribute('autocomplete', 'off'); inp.setAttribute('autocorrect', 'off');
    inp.setAttribute('autocapitalize', 'off'); inp.setAttribute('spellcheck', 'false');
    inp.setAttribute('enterkeyhint', 'go'); inp.setAttribute('aria-label', '手機鍵盤輸入');
    inp.style.cssText = 'position:fixed;left:0;bottom:0;width:1px;height:1px;opacity:0.01;border:0;padding:0;font-size:16px;z-index:2147483000;';
    inp.value = SENT;
    inp.addEventListener('input', onInput);
    inp.addEventListener('compositionstart', function () { inp.__comp = true; });
    inp.addEventListener('compositionend', function () { inp.__comp = false; onInput(); });
    inp.addEventListener('keyup', function (e) { e.stopPropagation(); });
    inp.addEventListener('keydown', function (e) {
      e.stopPropagation();          // 輸入框自己的真按鍵不要傳給遊戲，不然 iOS 會一個字送兩次
      if (e.key === 'Enter') { e.preventDefault(); send('Enter', 'Enter'); reset(); }
      else if (e.key === 'Escape') { e.preventDefault(); send('Escape', 'Escape'); }
      else if (e.key === 'Tab') { e.preventDefault(); send('Tab', 'Tab'); }
    });
    inp.addEventListener('focus', function () { reset(); btn.textContent = '⌨️ 收起'; });
    inp.addEventListener('blur', function () { btn.textContent = '⌨️ 鍵盤'; });
    document.body.appendChild(inp);

    btn = document.createElement('button');
    btn.type = 'button'; btn.id = 'mobileKbdBtn'; btn.textContent = '⌨️ 鍵盤';
    btn.style.cssText = 'position:fixed;right:10px;bottom:10px;z-index:2147483001;padding:10px 14px;font-size:16px;font-weight:700;border-radius:999px;border:2px solid #fff;background:rgba(20,20,40,.88);color:#fff;touch-action:manipulation;';
    // 用 pointerdown 而且不搶焦點，鍵盤才不會一閃就收起來
    btn.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (document.activeElement === inp) inp.blur(); else inp.focus();
    });
    document.body.appendChild(btn);

    // 點遊戲畫面（canvas）也會叫出鍵盤；點到按鈕、連結、遊戲自己的輸入框則不理
    document.addEventListener('pointerup', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      if (t.closest('input,textarea,select,button,a,[contenteditable]')) return;
      if (t.tagName === 'CANVAS') inp.focus();
    }, true);
    // 遊戲自己的輸入框取得焦點時，把按鈕收起來，避免擋住
    document.addEventListener('focusin', function (e) {
      var t = e.target;
      btn.style.display = (t && t !== inp && /^(INPUT|TEXTAREA)$/.test(t.tagName) && t.type !== 'button') ? 'none' : '';
    });
    document.addEventListener('focusout', function () { setTimeout(function () { if (!/^(INPUT|TEXTAREA)$/.test((document.activeElement || {}).tagName || '')) btn.style.display = ''; }, 50); });
  }
  if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
})();
