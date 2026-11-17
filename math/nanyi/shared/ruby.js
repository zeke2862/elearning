'use strict';
/* 國字加註：可選「不加註／注音／拼音」。
   - 讀音由 pinyin-pro（shared/pinyin-pro.js，MIT）判斷多音字；注音是從拼音轉換而來。
   - 特殊讀音校正放在 shared/ruby-overrides.js（遇到讀錯的字詞，加在那裡就好）。
   - 加註用 CSS 的 ::before / ::after 畫在字旁，不改變文字內容（textContent），
     所以遊戲判斷答案、朗讀題目都不受影響。
   - 設定記在瀏覽器 localStorage（鍵名 nanyi-ruby），整個網站共用。
   用法：頁面載入 pinyin-pro.js、ruby-overrides.js、ruby.js 即可；
        NanyiRuby.picker(容器) 會在容器裡畫出三段切換按鈕。 */
(function () {
  if (window.NanyiRuby) return;
  var KEY = 'nanyi-ruby';
  var LABEL = { none: '不加註', zhuyin: 'ㄅㄆㄇ 注音', pinyin: 'abc 拼音' };
  var ORDER = ['none', 'zhuyin', 'pinyin'];
  var CJK = /[㐀-鿿豈-﫿]/;
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, SELECT: 1, OPTION: 1, NOSCRIPT: 1, CODE: 1, CANVAS: 1, TITLE: 1, svg: 1, SVG: 1 };
  var P = window.pinyinPro;

  /* ---------- 設定：沒選過時，一、二年級預設注音，其他年級不加註 ---------- */
  function defaultMode() { return /grade[12]-[12]/.test(location.pathname) ? 'zhuyin' : 'none'; }
  function load() {
    var m = null; try { m = localStorage.getItem(KEY); } catch (e) {}
    return LABEL[m] ? m : defaultMode();
  }
  var mode = load();

  /* ---------- 拼音 → 注音 ---------- */
  var INIT = [['zh', 'ㄓ'], ['ch', 'ㄔ'], ['sh', 'ㄕ'], ['b', 'ㄅ'], ['p', 'ㄆ'], ['m', 'ㄇ'], ['f', 'ㄈ'], ['d', 'ㄉ'], ['t', 'ㄊ'], ['n', 'ㄋ'], ['l', 'ㄌ'],
    ['g', 'ㄍ'], ['k', 'ㄎ'], ['h', 'ㄏ'], ['j', 'ㄐ'], ['q', 'ㄑ'], ['x', 'ㄒ'], ['r', 'ㄖ'], ['z', 'ㄗ'], ['c', 'ㄘ'], ['s', 'ㄙ']];
  var FIN = { a: 'ㄚ', o: 'ㄛ', e: 'ㄜ', ai: 'ㄞ', ei: 'ㄟ', ao: 'ㄠ', ou: 'ㄡ', an: 'ㄢ', en: 'ㄣ', ang: 'ㄤ', eng: 'ㄥ', er: 'ㄦ',
    i: 'ㄧ', ia: 'ㄧㄚ', io: 'ㄧㄛ', ie: 'ㄧㄝ', iao: 'ㄧㄠ', iou: 'ㄧㄡ', iu: 'ㄧㄡ', ian: 'ㄧㄢ', in: 'ㄧㄣ', iang: 'ㄧㄤ', ing: 'ㄧㄥ', iong: 'ㄩㄥ',
    u: 'ㄨ', ua: 'ㄨㄚ', uo: 'ㄨㄛ', uai: 'ㄨㄞ', uei: 'ㄨㄟ', ui: 'ㄨㄟ', uan: 'ㄨㄢ', uen: 'ㄨㄣ', un: 'ㄨㄣ', uang: 'ㄨㄤ', ueng: 'ㄨㄥ', ong: 'ㄨㄥ',
    'ü': 'ㄩ', 'üe': 'ㄩㄝ', 'üan': 'ㄩㄢ', 'ün': 'ㄩㄣ' };
  var TONE_Z = ['˙', '', 'ˊ', 'ˇ', 'ˋ', '˙'];
  var zcache = {};
  function toZhuyin(base) {
    if (zcache[base] !== undefined) return zcache[base];
    var s = base.replace(/v/g, 'ü'), ini = '', fin = s, i;
    if (s.charAt(0) === 'y') {
      if (s.charAt(1) === 'u' || s.charAt(1) === 'ü') fin = 'ü' + s.slice(2);       // yu yue yuan yun
      else if (s.charAt(1) === 'i') fin = s.slice(1);                                 // yi yin ying
      else fin = 'i' + s.slice(1);                                                    // ya yo ye yao you yan yang yong
    } else if (s.charAt(0) === 'w') {
      fin = s.charAt(1) === 'u' ? 'u' : 'u' + s.slice(1);                             // wu / wa wo wai wei wan wen wang weng
    } else {
      for (i = 0; i < INIT.length; i++) if (s.indexOf(INIT[i][0]) === 0) { ini = INIT[i][0]; fin = s.slice(ini.length); break; }
      if ('jqx'.indexOf(ini) >= 0 && ini && fin.charAt(0) === 'u') fin = 'ü' + fin.slice(1);   // ju qu xu → ㄐㄩ…
      if (fin === 'i' && 'zh ch sh r z c s'.split(' ').indexOf(ini) >= 0) fin = '';          // zhi chi shi ri zi ci si
    }
    var out = '';
    for (i = 0; i < INIT.length; i++) if (INIT[i][0] === ini) out = INIT[i][1];
    if (fin) { if (FIN[fin] === undefined) { zcache[base] = null; return null; } out += FIN[fin]; }
    return (zcache[base] = out || null);
  }

  /* ---------- 拼音符號（調號標在對的母音上） ---------- */
  var MARKS = { a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', 'ü': 'ǖǘǚǜ' };
  function toSymbol(base, tone) {
    var s = base.replace(/v/g, 'ü');
    if (!(tone >= 1 && tone <= 4)) return s;
    var idx = s.search(/[aeo]/);
    if (idx < 0) idx = /iu/.test(s) ? s.indexOf('iu') + 1 : /ui/.test(s) ? s.indexOf('ui') + 1 : s.search(/[iuü]/);
    if (idx < 0) return s;
    return s.slice(0, idx) + MARKS[s.charAt(idx)].charAt(tone - 1) + s.slice(idx + 1);
  }

  /* ---------- 一個字 → <span class="kz"> ---------- */
  function mk(ch, base, tone) {
    var z = toZhuyin(base);
    if (z === null) return null;
    var s = document.createElement('span');
    s.className = tone === 0 || tone === 5 ? 'kz k0' : 'kz';
    s.setAttribute('data-p', toSymbol(base, tone));
    s.setAttribute('data-z', z);
    s.setAttribute('data-t', TONE_Z[tone] === '˙' ? '˙' : TONE_Z[tone] || '');
    s.style.setProperty('--n', z.length);
    s.textContent = ch;
    return s;
  }
  /* ---------- 讀音：pinyin-pro ＋ 前後文規則 ＋ 台灣輕聲 ---------- */
  var UNMARK = {};
  Object.keys(MARKS).forEach(function (v) { MARKS[v].split('').forEach(function (ch, i) { UNMARK[ch] = [v, i + 1]; }); });
  function parseSym(s) {                       // 'shǔ' → {pinyin:'shu', num:3}
    var base = '', tone = 0;
    for (var i = 0; i < s.length; i++) { var u = UNMARK[s.charAt(i)]; if (u) { base += u[0]; tone = u[1]; } else base += s.charAt(i); }
    return { pinyin: base.replace(/ü/g, 'v'), num: tone };
  }
  var dtone = {};
  function defaultTone(c) {                    // 單字的原本聲調
    if (dtone[c] === undefined) { var r = P.pinyin(c, { type: 'all', v: true, toneType: 'none' })[0]; dtone[c] = r && r.num >= 1 && r.num <= 4 ? r.num : 0; }
    return dtone[c];
  }
  var tcache = {}, tcount = 0;
  function readings(text) {
    if (tcache[text]) return tcache[text];
    var raw = P.pinyin(text, { type: 'all', v: true, toneType: 'none' });
    var out = raw.map(function (it) { return { origin: it.origin, isZh: it.isZh, pinyin: it.pinyin, num: it.num, fixed: false }; });
    if (out.length === text.length) {
      (window.NanyiRubyRules || []).forEach(function (rule) {                    // 前後文規則
        rule[0].lastIndex = 0; var m, py = parseSym(rule[1]);
        while ((m = rule[0].exec(text))) { if (m[0].length !== 1) { rule[0].lastIndex = m.index + 1; continue; } var o = out[m.index]; if (o && o.isZh) { o.pinyin = py.pinyin; o.num = py.num; o.fixed = true; } }
      });
      var NEU = window.NanyiRubyNeutral;                                           // 台灣輕聲：不在字表、也不是疊字，就還原聲調
      out.forEach(function (o, i) {
        if (o.isZh && o.num === 0 && !o.fixed && NEU && !NEU.test(o.origin) && !(i > 0 && out[i - 1].origin === o.origin)) o.num = defaultTone(o.origin);
      });
    }
    if (++tcount > 4000) { tcache = {}; tcount = 0; }
    return (tcache[text] = out);
  }
  function annotateText(node) {
    var t = node.nodeValue;
    if (!CJK.test(t) || !P) return;
    var arr = readings(t), frag = document.createDocumentFragment(), buf = '', any = false;
    function flush() { if (buf) { frag.appendChild(document.createTextNode(buf)); buf = ''; } }
    if (arr.length !== t.length) return;                       // 長度對不上就不冒險
    for (var i = 0; i < arr.length; i++) {
      var it = arr[i], sp = null;
      if (it.isZh && it.pinyin) sp = mk(it.origin, it.pinyin, it.num);
      if (sp) { flush(); frag.appendChild(sp); any = true; } else buf += t.charAt(i);
    }
    if (!any) return;
    flush();
    var wrap = document.createElement('span'); wrap.className = 'kzw'; wrap.appendChild(frag);   // 包成一整段，flex／grid 版面不會把每個字拆成一格
    node.parentNode.replaceChild(wrap, node);
  }
  function skip(el) {
    for (var e = el; e && e !== document.documentElement; e = e.parentNode) {
      if (e.nodeType !== 1) continue;
      if (SKIP[e.nodeName] || e.isContentEditable || e.hasAttribute('data-nozy') || (e.classList && (e.classList.contains('kz') || e.classList.contains('nz-ui')))) return true;
      if (e.namespaceURI && e.namespaceURI !== 'http://www.w3.org/1999/xhtml') return true;
    }
    return false;
  }
  function walk(root) {
    if (mode === 'none' || !root) return;
    if (root.nodeType === 3) { if (root.parentNode && !skip(root.parentNode)) annotateText(root); return; }
    if (root.nodeType !== 1 || skip(root)) return;
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), list = [], n;
    while ((n = tw.nextNode())) if (CJK.test(n.nodeValue) && !skip(n.parentNode)) list.push(n);
    list.forEach(annotateText);
  }

  /* ---------- 監看畫面變化：遊戲動態產生的字也會加註 ---------- */
  var observer = null;
  function run(muts) {
    observer.disconnect();
    try {
      if (muts) muts.forEach(function (m) {
        if (m.type === 'characterData') walk(m.target);
        else m.addedNodes.forEach(function (x) { if (x.isConnected) walk(x); });
      });
      else walk(document.body);
    } finally { observer.observe(document.body, { childList: true, subtree: true, characterData: true }); }
  }
  function unwrapAll() {
    if (observer) observer.disconnect();
    Array.prototype.slice.call(document.querySelectorAll('.kzw')).forEach(function (w) { w.replaceWith(document.createTextNode(w.textContent)); });
  }

  /* ---------- 樣式 ---------- */
  var FONT = '"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif';
  // 月考卷（#kg-exam）和入口面板（#kgx-panel）會把樣式重設，所以每條規則也加一份它們開頭的
  function M(m, sel, body) {
    var h = 'html[data-nz="' + m + '"] ';
    return sel.split(',').map(function (x) { return h + x + ',' + h + '#kgx-panel ' + x + ',' + h + '#kg-exam ' + x; }).join(',') + '{' + body + '}';
  }
  var css = M('zhuyin', '.kz', 'display:inline-flex;align-items:center;position:relative;margin-right:.14em;text-indent:0;text-shadow:none;font-style:normal') +
    M('zhuyin', '.kz::after', 'content:attr(data-z);order:1;writing-mode:vertical-rl;text-orientation:upright;font-family:' + FONT + ';font-size:max(.4em,10px);line-height:1;font-weight:500;letter-spacing:0;white-space:nowrap;margin-left:.1em;color:inherit;-webkit-text-fill-color:currentColor') +
    M('zhuyin', '.kz::before', 'content:attr(data-t);order:2;font-family:' + FONT + ';font-size:max(.4em,10px);line-height:1;font-weight:700;color:inherit;-webkit-text-fill-color:currentColor;transform:translateY(calc((var(--n) - 1) * .5em + .2em))') +
    M('zhuyin', '.kz.k0::before', 'position:absolute;right:0;width:1em;text-align:center;top:calc(50% - (var(--n) * .5 + .8) * 1em);transform:none') +
    M('pinyin', '.kz', 'display:inline-block;text-align:center;position:relative;margin:0 .05em;text-indent:0;text-shadow:none;font-style:normal') +
    M('pinyin', '.kz::before', 'content:attr(data-p);display:block;font-family:Arial,"Segoe UI",sans-serif;font-size:max(.42em,10px);line-height:1.2;font-weight:500;letter-spacing:0;white-space:nowrap;text-align:center;color:inherit;-webkit-text-fill-color:currentColor') +
    '.nz-ui,.nz-ui *{box-sizing:border-box;font-family:' + FONT + '}' +
    '#nz-btn{position:fixed;right:12px;bottom:60px;z-index:2147483000;width:40px;height:40px;padding:0;border-radius:50%;border:3px solid #e8590c;background:rgba(255,255,255,.92);color:#e8590c;font-size:17px;font-weight:900;cursor:pointer;opacity:.85;box-shadow:0 3px 0 #e8590c;line-height:1}' +
    '#nz-btn:hover{opacity:1}' +
    '#nz-pop{position:fixed;right:12px;bottom:108px;z-index:2147483001;background:#fff;border:3px solid #e8590c;border-radius:16px;padding:10px;box-shadow:0 6px 18px rgba(0,0,0,.2);display:none;gap:6px;flex-direction:column;min-width:150px}' +
    '#nz-pop.open{display:flex}#nz-pop b{font-size:14px;color:#555;padding:0 4px 2px}' +
    '.nz-seg{display:inline-flex;gap:6px;flex-wrap:wrap}' +
    '.nz-seg button,#nz-pop button{font:700 15px ' + FONT + ';padding:7px 12px;border-radius:999px;border:2px solid #e0c9b0;background:#fff;color:#2b2b2b;cursor:pointer;min-height:36px;text-align:left}' +
    '.nz-seg button.on,#nz-pop button.on{background:#e8590c;border-color:#e8590c;color:#fff}' +
    '@media print{#nz-btn,#nz-pop{display:none}}';
  var st = document.createElement('style'); st.id = 'nz-css'; st.textContent = css;

  /* ---------- 切換與介面 ---------- */
  var listeners = [];
  function set(m) {
    if (!LABEL[m]) return;
    mode = m;
    try { localStorage.setItem(KEY, m); } catch (e) {}
    document.documentElement.setAttribute('data-nz', m);
    if (m === 'none') unwrapAll(); else if (observer) run(null);
    paint();
    listeners.forEach(function (f) { try { f(m); } catch (e) {} });
  }
  function seg(host) {
    host.classList.add('nz-ui');
    host.innerHTML = ORDER.map(function (m) { return '<button type="button" data-m="' + m + '">' + LABEL[m] + '</button>'; }).join('');
    function sync() { Array.prototype.forEach.call(host.querySelectorAll('button'), function (b) { b.classList.toggle('on', b.getAttribute('data-m') === mode); }); }
    host.onclick = function (e) { var b = e.target.closest && e.target.closest('button[data-m]'); if (b) set(b.getAttribute('data-m')); };
    listeners.push(sync); sync();
  }
  var btn, pop;
  function paint() {
    if (!btn) return;
    btn.textContent = mode === 'zhuyin' ? 'ㄅ' : mode === 'pinyin' ? 'ā' : '字';
    btn.title = '國字加註：' + LABEL[mode];
  }
  function ui() {
    btn = document.createElement('button'); btn.id = 'nz-btn'; btn.type = 'button'; btn.className = 'nz-ui';
    pop = document.createElement('div'); pop.id = 'nz-pop'; pop.className = 'nz-ui';
    pop.innerHTML = '<b>國字加註</b><div id="nz-pop-seg" style="display:flex;flex-direction:column;gap:6px"></div>';
    document.body.appendChild(btn); document.body.appendChild(pop);
    var box = pop.querySelector('#nz-pop-seg');
    box.innerHTML = ORDER.map(function (m) { return '<button type="button" data-m="' + m + '">' + LABEL[m] + '</button>'; }).join('');
    function sync() { Array.prototype.forEach.call(box.querySelectorAll('button'), function (b) { b.classList.toggle('on', b.getAttribute('data-m') === mode); }); }
    box.onclick = function (e) { var b = e.target.closest('button[data-m]'); if (b) { set(b.getAttribute('data-m')); pop.classList.remove('open'); } };
    listeners.push(sync); sync();
    btn.onclick = function (e) { e.stopPropagation(); pop.classList.toggle('open'); };
    document.addEventListener('click', function (e) { if (!pop.contains(e.target)) pop.classList.remove('open'); });
    paint();
  }

  /* 左上角「← 選年級」加了注音會變寬，蓋到固定位置的「回首頁」；量一下，有重疊就往右挪 */
  function fixTop() {
    var g = document.querySelector('.grade-link'), h = document.querySelector('.home-btn');
    if (!g || !h || h.hidden) return;
    h.style.left = '';
    if (mode === 'none') return;
    var a = g.getBoundingClientRect(), b = h.getBoundingClientRect();
    if (b.width && a.right + 8 > b.left && a.left < b.right && a.top < b.bottom && a.bottom > b.top) h.style.left = (b.left + (a.right + 10 - b.left)) + 'px';
  }

  function start() {
    document.head.appendChild(st);
    setInterval(fixTop, 400); window.addEventListener('resize', fixTop);
    document.documentElement.setAttribute('data-nz', mode);
    ui();
    observer = new MutationObserver(run);
    if (mode !== 'none') run(null);          // 「不加註」時不監看、不動畫面；切到注音／拼音才開始
  }
  document.documentElement.setAttribute('data-nz', mode);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  window.NanyiRuby = { get: function () { return mode; }, set: set, picker: seg, walk: walk, labels: LABEL,
    zhuyin: function (text) { return P ? readings(text).map(function (x) { return x.isZh ? toZhuyin(x.pinyin) + (TONE_Z[x.num] || '') : x.origin; }) : []; },
    pinyin: function (text) { return P ? readings(text).map(function (x) { return x.isZh ? toSymbol(x.pinyin, x.num) : x.origin; }) : []; } };
})();
