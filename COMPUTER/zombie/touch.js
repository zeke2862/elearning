// ============================================================
// 手機／平板 觸控支援 (touch.js)
// 電腦版完全不受影響；在手機上會自動開啟：
//   ① 左側方向鍵  ② 螢幕鍵盤  ③ 右側「道具／攻擊」鍵  ④ 手指好按的主選單
// 做法：按鈕只是「假裝按了一下鍵盤」，所以遊戲本身的規則完全沒改。
// ============================================================
(function () {
  'use strict';

  const W = 916, H = 500;                       // 遊戲畫面的原始大小（跟 game.js 一致）
  const LS_KEY = 'zombieTyping_touchMode';      // 'on' | 'off'：使用者手動選的觸控版面
  const KB_ROWS = ['qwertyuiop[]', 'asdfghjkl;', 'zxcvbnm,./'];
  const ROW_HINT = { home_row: 'asdfghjkl;', top_row: 'qwertyuiop[]', bottom_row: 'zxcvbnm,./' };
  const CATEGORY_LABELS = {
    easy_words: ['簡單單字', '英文短單字'],
    hard_words: ['困難單字', '英文長單字'],
    home_row: ['中列', 'ASDF 那一排'],
    top_row: ['上列', 'QWER 那一排'],
    bottom_row: ['下列', 'ZXCV 那一排'],
    chinese: ['中文拼音', '看字打拼音'],
    chinese_article: ['中文-文章', '用手機輸入法'],
  };
  const DIFF_LABELS = ['簡單', '普通', '挑戰'];

  const $ = (id) => document.getElementById(id);
  const body = document.body;
  let touchOn = false;
  let menuBuilt = false;
  let lastMenuSig = '';
  let hintKey = '';
  let hintTimer = null;

  // ── 小工具 ──────────────────────────────────────────────
  function lsGet() { try { return localStorage.getItem(LS_KEY); } catch (e) { return null; } }
  function lsSet(v) { try { localStorage.setItem(LS_KEY, v); } catch (e) { /* ignore */ } }

  function isCoarse() {
    return window.matchMedia('(pointer: coarse)').matches ||
      (window.matchMedia('(hover: none)').matches && navigator.maxTouchPoints > 0);
  }
  function wantTouch() {
    const v = lsGet();
    if (v === 'on') return true;
    if (v === 'off') return false;
    return isCoarse();
  }

  // 直放還是橫放？（不能只看視窗大小，因為跳出手機輸入法時視窗會變矮，會被誤判成橫放）
  function isPortrait() {
    if (!isCoarse()) return window.innerHeight >= window.innerWidth;
    try {
      if (screen.orientation && screen.orientation.type) return screen.orientation.type.indexOf('portrait') === 0;
    } catch (e) { /* ignore */ }
    if (typeof window.orientation === 'number') return Math.abs(window.orientation) !== 90;
    return window.innerHeight >= window.innerWidth;
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // 假裝按一下鍵盤，交給 game.js 原本的鍵盤處理
  function press(key) {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: key, bubbles: true, cancelable: true }));
  }

  // ── 螢幕鍵盤 ────────────────────────────────────────────
  function buildKeyboard() {
    const kb = $('tcKeyboard');
    if (!kb || kb.childElementCount) return;
    KB_ROWS.forEach((chars, ri) => {
      const row = el('div', 'tc-krow tc-krow' + ri);
      chars.split('').forEach((ch) => {
        const b = el('button', 'tc-btn tc-key', ch.toUpperCase());
        b.type = 'button';
        b.tabIndex = -1;
        b.dataset.key = ch;
        row.appendChild(b);
      });
      kb.appendChild(row);
    });
    // 中文拼音／中文-文章：小狼毫輸入引擎要用「空白鍵／數字鍵選字、Backspace 刪拼音」，
    // 所以多兩排（只在中文模式顯示）：數字 1～9、0（翻頁），以及 ⌫／空白／↵
    const nums = el('div', 'tc-krow tc-krow-zh');
    '1234567890'.split('').forEach((ch) => {
      const b = el('button', 'tc-btn tc-key', ch); b.type = 'button'; b.tabIndex = -1; b.dataset.key = ch; nums.appendChild(b);
    });
    kb.appendChild(nums);
    const ctl = el('div', 'tc-krow tc-krow-zh');
    [['⌫', 'Backspace', 1], ['空白（選字）', ' ', 3], ['↵', 'Enter', 1]].forEach((d) => {
      const b = el('button', 'tc-btn tc-key', d[0]); b.type = 'button'; b.tabIndex = -1; b.dataset.key = d[1]; b.style.flexGrow = d[2]; b.style.fontSize = '1rem'; ctl.appendChild(b);
    });
    kb.appendChild(ctl);
  }

  // 按鈕的「按下」處理：用 pointerdown，反應最快，也支援多指同時按
  function bindPress(root) {
    if (!root) return;
    root.addEventListener('pointerdown', (e) => {
      const b = e.target.closest('.tc-btn[data-key]');
      if (!b || !root.contains(b)) return;
      e.preventDefault();                         // 不要搶走輸入框的焦點（輸入法才不會收起來）
      if (b.classList.contains('off')) return;
      if (window.game && window.game.audio) window.game.audio.init();
      b.classList.add('down');
      press(b.dataset.key);
      if (navigator.vibrate) { try { navigator.vibrate(8); } catch (err) { /* ignore */ } }
      const up = () => {
        b.classList.remove('down');
        b.removeEventListener('pointerup', up);
        b.removeEventListener('pointercancel', up);
        b.removeEventListener('pointerleave', up);
      };
      b.addEventListener('pointerup', up);
      b.addEventListener('pointercancel', up);
      b.addEventListener('pointerleave', up);
    });
    ['mousedown', 'touchstart'].forEach((t) => {
      root.addEventListener(t, (e) => { if (e.target.closest('.tc-btn')) e.preventDefault(); }, { passive: false });
    });
    root.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // ── 工具列：手機搬到右邊，電腦搬回原位 ───────────────────
  function placeToolbar(on) {
    const bar = document.querySelector('.top-controls-bar');
    const slot = $('tcToolbarSlot');
    const home = $('bottomBarRow');
    if (!bar || !slot || !home) return;
    (on ? slot : home).appendChild(bar);
  }

  // ── 畫面大小：直放用整個寬度，橫放放進中間的格子 ────────────
  function fit() {
    const wrap = $('canvasWrapper');
    const slot = $('canvasSlot');
    if (!wrap || !slot) return;
    if (!touchOn) {
      wrap.style.width = '';
      wrap.style.height = '';
      return;
    }
    const cs = getComputedStyle(slot);
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const sw = slot.clientWidth - padX;
    let w;
    if (body.classList.contains('tc-portrait')) {
      w = sw;
    } else {
      const sh = slot.clientHeight - padY;
      w = Math.min(sw, sh * W / H);
    }
    w = Math.max(120, Math.floor(w));
    wrap.style.width = w + 'px';
    wrap.style.height = Math.floor(w * H / W) + 'px';
    fitPad();
  }

  // 直放＋中文輸入法：手機輸入法會佔掉大半個螢幕，方向鍵要依剩下的高度縮小，才不會被切掉
  function fitPad() {
    const wrap = $('canvasWrapper');
    if (touchOn && wrap && body.classList.contains('tc-portrait') && body.classList.contains('tc-article')) {
      const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      const avail = vh - wrap.offsetHeight - 60 - 16;
      const pad = Math.max(30, Math.min(56, Math.floor(avail / 3.1)));
      body.style.setProperty('--pad', pad + 'px');
    } else {
      body.style.removeProperty('--pad');
    }
  }

  function updateOrientationClass() {
    const portrait = isPortrait();
    body.classList.toggle('tc-portrait', touchOn && portrait);
    body.classList.toggle('tc-landscape', touchOn && !portrait);
  }

  function updateViewport() {
    const root = document.documentElement;
    const vv = window.visualViewport;
    if (touchOn && vv) {
      root.style.setProperty('--vvh', vv.height + 'px');
      root.style.setProperty('--vv-top', vv.offsetTop + 'px');
    } else {
      root.style.removeProperty('--vvh');
      root.style.removeProperty('--vv-top');
    }
  }

  function relayout() {
    updateOrientationClass();
    updateViewport();
    fit();
  }

  // ── 開關觸控版面 ────────────────────────────────────────
  function setTouch(on) {
    touchOn = on;
    body.classList.toggle('touch-mode', on);
    placeToolbar(on);
    relayout();
    syncUI(true);
  }

  // ── 手機版主選單 ────────────────────────────────────────
  function buildMenu() {
    const g = window.game;
    if (menuBuilt || !g) return;
    menuBuilt = true;

    const diff = $('tcDifficulty');
    DIFF_LABELS.forEach((label, i) => {
      const b = el('button', 'tc-opt', label);
      b.type = 'button';
      b.addEventListener('click', () => {
        g.menuSelection.difficultyIndex = i;
        g.menuSelection.difficulty = ['Easy', 'Medium', 'Hard'][i];
        g.audio.menuClick();
        syncMenu();
      });
      diff.appendChild(b);
    });

    const cat = $('tcCategory');
    g.categories.forEach((c, i) => {
      const lab = CATEGORY_LABELS[c.id] || [c.label, ''];
      const b = el('button', 'tc-opt');
      b.type = 'button';
      b.appendChild(document.createTextNode(lab[0]));
      if (lab[1]) b.appendChild(el('small', '', lab[1]));
      b.addEventListener('click', () => {
        g.menuSelection.categoryIndex = i;
        g.menuSelection.category = c.id;
        g.audio.menuClick();
        syncMenu();
        syncUI(true);
      });
      cat.appendChild(b);
    });

    $('tcPlay').addEventListener('click', () => {
      g.audio.init();
      g._startGame();                             // 在「點一下」的當下開始，手機才會跳出輸入法
      const n = window.articleManager ? window.articleManager.getSelectedArticles().length : 0;
      if (g.menuSelection.category === 'chinese_article' && g.state === 'MENU' && n === 0) {
        const btn = $('articlesBtn');
        if (btn) btn.click();                     // 還沒選文章 → 直接幫他打開文章題庫
      }
      syncMenu();
    });
    $('tcMenuArticles').addEventListener('click', () => $('articlesBtn').click());
    $('tcMenuSprites').addEventListener('click', () => $('settingsBtn').click());
    $('tcMenuOff').addEventListener('click', () => { lsSet('off'); setTouch(false); });
  }

  function syncMenu() {
    const g = window.game;
    if (!g || !menuBuilt) return;
    const ms = g.menuSelection;
    const nArticles = window.articleManager ? window.articleManager.getSelectedArticles().length : 0;
    const warning = g.menuWarningTimer > 0 ? g.menuWarning : '';
    const portrait = body.classList.contains('tc-portrait');
    const sig = [ms.difficultyIndex, ms.category, nArticles, warning, portrait].join('|');
    if (sig === lastMenuSig) return;
    lastMenuSig = sig;

    Array.prototype.forEach.call($('tcDifficulty').children, (b, i) => b.classList.toggle('sel', i === ms.difficultyIndex));
    Array.prototype.forEach.call($('tcCategory').children, (b, i) => b.classList.toggle('sel', i === ms.categoryIndex));

    const note = $('tcMenuNote');
    note.className = 'tc-menu-note';
    if (warning) {
      note.textContent = warning.replace('右上角 📚', '下方「📚 文章題庫」');
      note.classList.add('bad');
    } else if (ms.category === 'chinese_article') {
      note.textContent = (nArticles > 0 ? '已選 ' + nArticles + ' 篇文章 ✓　' : '還沒選文章，請先點「📚 文章題庫」　') +
        (portrait ? '' : '（這個模式用手機輸入法，建議直放）');
      note.classList.add(nArticles > 0 ? 'ok' : 'bad');
    } else {
      note.textContent = portrait ? '📱 把手機橫放，遊戲畫面會比較大喔！' : '';
    }
  }

  // ── 提示小膠囊 ──────────────────────────────────────────
  function showHint(msg) {
    const h = $('tcHint');
    if (!h) return;
    h.textContent = msg;
    h.hidden = false;
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => { h.hidden = true; }, 6500);
  }
  function hideHint() {
    const h = $('tcHint');
    if (h) h.hidden = true;
    clearTimeout(hintTimer);
  }

  // ── 定時同步：跟遊戲目前狀態對齊 ────────────────────────
  function syncUI(force) {
    const g = window.game;
    if (!g) return;

    // 觸控版面是開的 → 同步畫面；沒開 → 全部收起來
    const cat = g.menuSelection.category;
    const article = cat === 'chinese_article';
    const portrait = isPortrait();

    if (touchOn) {
      if (body.classList.contains('tc-portrait') !== portrait) relayout();
      const zh = cat === 'chinese' || article;
      if (body.classList.contains('tc-zh') !== zh) { body.classList.toggle('tc-zh', zh); fit(); }
      if (body.classList.contains('tc-article') !== article) {
        body.classList.toggle('tc-article', article);
        fit();
      }

      // 主選單
      buildMenu();
      const menu = $('tcMenu');
      const inMenu = g.state === 'MENU';
      if (menu.hidden === inMenu) menu.hidden = !inMenu;
      if (inMenu) syncMenu();

      // 右側動作鍵：英打模式是「使用道具」，中文-文章是「攻擊」
      const act = $('tcAction');
      const label = article ? '⚔ 攻擊' : '⚡ 道具';
      if (act.textContent !== label) act.textContent = label;
      act.classList.toggle('off', g.state !== 'PLAYING');

      // 中列／上列／下列：把對應那一排的鍵標成金色
      const hint = ROW_HINT[cat] || '';
      Array.prototype.forEach.call($('tcKeyboard').querySelectorAll('.tc-key'), (k) => {
        const on = hint.indexOf(k.dataset.key) >= 0;
        if (k.classList.contains('hint') !== on) k.classList.toggle('hint', on);
      });

      // 橫放／直放提醒（遊戲開始後才提醒，選單裡已經有文字說明）
      let msg = '';
      if (g.state !== 'MENU') {
        if (article && !portrait) msg = '🔤 「中文-文章」要用手機輸入法，把手機直著拿比較好打喔！';
        else if (!article && portrait) msg = '📱 把手機橫過來，遊戲畫面會變大喔！';
      }
      const key = msg ? msg : '';
      if (key !== hintKey) {
        hintKey = key;
        if (msg) showHint(msg); else hideHint();
      }
    } else {
      hideHint();
      hintKey = '';
    }
    if (force) fit();
  }

  // ── 啟動 ────────────────────────────────────────────────
  function init() {
    buildKeyboard();
    ['tcLeft', 'tcRight', 'tcKeyboard'].forEach((id) => bindPress($(id)));

    const zh = $('zhTypingInput');
    if (zh) zh.setAttribute('enterkeyhint', 'send');

    const hint = $('tcHint');
    if (hint) hint.addEventListener('click', hideHint);

    // 工具列上的「手機」按鈕：手動開關觸控版面
    const tgl = $('touchToggleBtn');
    if (tgl) tgl.addEventListener('click', () => {
      const next = !touchOn;
      lsSet(next ? 'on' : 'off');
      setTouch(next);
    });

    // 畫面大小變動（轉向、輸入法跳出、視窗縮放）
    window.addEventListener('resize', relayout);
    window.addEventListener('orientationchange', () => setTimeout(relayout, 250));
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', relayout);
      window.visualViewport.addEventListener('scroll', updateViewport);
    }
    if (window.ResizeObserver) {
      new ResizeObserver(fit).observe($('canvasSlot'));
    }
    try {
      window.matchMedia('(pointer: coarse)').addEventListener('change', () => {
        if (!lsGet()) setTouch(wantTouch());
      });
    } catch (e) { /* 舊瀏覽器不支援就算了 */ }

    setTouch(wantTouch());
    setInterval(() => syncUI(false), 150);
  }

  // game.js 的 DOMContentLoaded 會建立 window.game；這裡晚一步執行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 0));
  } else {
    setTimeout(init, 0);
  }
})();
