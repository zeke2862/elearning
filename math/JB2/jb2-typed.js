/* jb2-typed.js — 修羅模式：自己按出答案（只輸入「數字」或「座標」）
 *
 * 規則：
 *  - 只在「修羅」模式啟用；練兵、實戰維持選擇題。
 *  - 答案是「數字」（整數、小數、分數；%、°、公里這類單位由畫面顯示，學生只輸入數字）、
 *    「座標／數對」（兩格：x 與 y）、「第幾象限」（輸入 1～4）的題目 → 用螢幕上的數字鍵盤輸入。
 *  - 答案是算式、方程式、不等式、文字描述，或「下列哪一個…」有很多個正確答案的題目 → 仍是選擇題。
 *  - 交卷時呼叫關卡原本的 answer()，所以星星、連擊、計時、小老師、重練錯題全部照舊。
 *
 * 由 mode-system.js 的 MS.init() 呼叫 JB2Typed.install()。
 */
(function () {
  'use strict';
  if (window.JB2Typed) return;

  var ASK = /下列|哪一|哪個|哪些|哪兩|哪幾/;          // 有很多個正確答案的「選一個」題 → 維持選擇題
  var NUMRE = /^-?\d+(?:\.\d+)?(?:\/\d+)?$/;
  var QUAD = { '一': 1, '二': 2, '三': 3, '四': 4 };

  /* ---------------- 數字處理 ---------------- */
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function pn(s) {                                      // 字串 → {n,d,t}；t：i 整數／d 小數／f 分數
    s = String(s == null ? '' : s).replace(/[−–﹣－]/g, '-').replace(/\s+/g, '');
    if (!NUMRE.test(s)) return null;
    var neg = s.charAt(0) === '-'; if (neg) s = s.slice(1);
    var n, d = 1, t = 'i', p;
    if (s.indexOf('/') >= 0) { p = s.split('/'); n = +p[0]; d = +p[1]; t = 'f'; if (!(d > 0)) return null; }
    else if (s.indexOf('.') >= 0) { p = s.split('.'); if (p[1].length > 6) return null; d = Math.pow(10, p[1].length); n = +(p[0] + p[1]); t = 'd'; }
    else n = +s;
    if (!isFinite(n) || !isFinite(d)) return null;
    return { n: neg ? -n : n, d: d, t: t };
  }
  function same(a, b) { return a.n * b.d === b.n * a.d; }
  function numOk(typed, ans) {                          // 輸入的數字對不對
    if (!typed || !ans || !same(typed, ans)) return false;
    if (typed.t === 'f') return typed.d > 1 && gcd(typed.n, typed.d) === 1;   // 分數要寫最簡，不能是 6/2、2/4
    if (ans.t === 'f') return false;                                           // 答案是分數，就要寫成分數
    return true;
  }
  function plain(h) { return String(h == null ? '' : h).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }

  /* ---------------- 這題能不能用按的？ ---------------- */
  // 回傳 null（維持選擇題），或 { k:'num'|'pair'|'quad', ... }
  function kindOf(Q) {
    if (!Q) return null;
    var a = String(Q.ans == null ? '' : Q.ans).trim(), t = plain(Q.text), m;
    if ((m = /^第([一二三四])象限$/.exec(a))) return { k: 'quad', v: QUAD[m[1]] };
    if (ASK.test(t)) return null;
    if ((m = /^(\d+)\s*[:：]\s*(\d+)$/.exec(a))) {                     // 最簡整數比：前項、後項各按一個數字
      return { k: 'pair', a: pn(m[1]), b: pn(m[2]), labels: ['前項', '後項'], coord: false, ratio: true };
    }
    if ((m = /^\(\s*([^,()]+?)\s*,\s*([^,()]+?)\s*\)$/.exec(a))) {
      var x = pn(m[1]), y = pn(m[2]);
      if (x && y) return { k: 'pair', a: x, b: y, labels: (Q.labels && Q.labels.length === 2) ? Q.labels : ['x', 'y'], coord: !(Q.labels && Q.labels.length === 2) };
      return null;
    }
    if ((m = /^(-?\d+(?:\.\d+)?(?:\/\d+)?)\s*(%|°|[^\d\s,，:：()（）.\-]{1,4})?$/.exec(a))) {
      var r = pn(m[1]); if (r) return { k: 'num', r: r, unit: m[2] || '' };
    }
    return null;
  }
  function check(kind, vals) {                          // vals：每一格輸入的字串
    if (!kind) return false;
    if (kind.k === 'quad') return /^[1-4]$/.test(vals[0]) && +vals[0] === kind.v;
    if (kind.k === 'num') return numOk(pn(vals[0]), kind.r);
    if (kind.k === 'pair') return numOk(pn(vals[0]), kind.a) && numOk(pn(vals[1]), kind.b);
    return false;
  }
  function complete(kind, vals) {                       // 每一格都是完整的數字了嗎？
    for (var i = 0; i < vals.length; i++) { if (!vals[i] || !pn(vals[i])) return false; if (kind.k === 'quad' && !/^[1-4]$/.test(vals[i])) return false; }
    return true;
  }

  /* ---------------- 畫面 ---------------- */
  var panel = null, S = null, cssDone = false;
  function $(s) { return document.querySelector(s); }
  function css() {
    if (cssDone) return; cssDone = true;
    var st = document.createElement('style');
    st.textContent =
      '#ms-typed{margin:10px 0;user-select:none;-webkit-user-select:none;touch-action:manipulation}' +
      '#ms-typed .mt-boxes{display:flex;gap:10px 18px;align-items:center;justify-content:center;flex-wrap:wrap;margin:6px 0}' +
      '#ms-typed .mt-lab{font-weight:700;color:var(--bronze,#d2a24c);font-size:1.15rem}' +
      '#ms-typed .mt-unit{font-weight:700;color:var(--txt,#e9e4d4);font-size:1.15rem}' +
      '#ms-typed .mt-box{min-width:96px;height:54px;padding:0 14px;border:2px solid var(--line,#3a4270);border-radius:12px;background:#0b0f22;color:#fff;font-size:1.6rem;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-variant-numeric:tabular-nums}' +
      '#ms-typed .mt-box.on{border-color:var(--bronze,#d2a24c);box-shadow:0 0 0 3px #d2a24c44}' +
      '#ms-typed .mt-box.on:after{content:"";width:2px;height:1.5rem;background:var(--bronze,#d2a24c);margin-left:3px;animation:mtblink 1s steps(1) infinite}' +
      '@keyframes mtblink{50%{opacity:0}}' +
      '#ms-typed .mt-pad{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:340px;margin:10px auto 0}' +
      '#ms-typed .mt-key{height:54px;border-radius:12px;border:2px solid var(--line,#3a4270);background:var(--ink2,#20264a);color:var(--txt,#e9e4d4);font-size:1.35rem;font-weight:700;cursor:pointer;padding:0}' +
      '#ms-typed .mt-key:active{transform:scale(.96)}' +
      '#ms-typed .mt-key.fn{background:#2b2a3c;font-size:1rem}' +
      '#ms-typed .mt-key.go{background:var(--bronze,#d2a24c);color:#2a1d05;font-size:1.05rem}' +
      '#ms-typed .mt-key.wide{grid-column:1 / -1;height:44px;font-size:1rem}' +
      '#ms-typed .mt-msg{min-height:22px;text-align:center;color:#ffb38a;font-size:.95rem;margin-top:6px}' +
      '#ms-typed.done .mt-key{opacity:.45;pointer-events:none}' +
      '#ms-typed.done.good .mt-box{border-color:#43a58f;background:#12362f}' +
      '#ms-typed.done.bad .mt-box{border-color:#d24a33;background:#3a1612}';
    document.head.appendChild(st);
  }
  function labelsOf(kind) {
    if (kind.k === 'quad') return { pre: '第', post: '象限', labs: [''] };
    if (kind.k === 'pair') return { pre: '', post: '', labs: kind.coord ? ['x 坐標', 'y 坐標'] : kind.labels.map(function (s) { return kind.ratio ? s : s + ' ='; }) };
    return { pre: '', post: kind.unit || '', labs: [''] };
  }
  function draw() {
    if (!panel || !S) return;
    var L = labelsOf(S.kind), h = '<div class="mt-boxes">';
    for (var i = 0; i < S.vals.length; i++) {
      if (L.labs[i]) h += '<span class="mt-lab">' + L.labs[i] + '</span>';
      else if (L.pre && i === 0) h += '<span class="mt-lab">' + L.pre + '</span>';
      h += '<span class="mt-box' + (i === S.cur && !S.done ? ' on' : '') + '" data-i="' + i + '" role="textbox" aria-label="答案欄">' + (S.vals[i] || '&nbsp;') + '</span>';
    }
    if (L.post) h += '<span class="mt-unit">' + L.post + '</span>';
    panel.querySelector('.mt-show').innerHTML = h + '</div>';
  }
  function build(kind) {
    var d = document.createElement('div'); d.id = 'ms-typed';
    var keys = ['7', '8', '9', 'back', '4', '5', '6', 'clr', '1', '2', '3', 'neg', '0', 'dot', 'slash', 'ok'];
    var lab = { back: '⌫', clr: '清除', neg: '±', dot: '.', slash: '/', ok: '確定' };
    var h = '<div class="mt-show"></div><div class="mt-msg" aria-live="polite"></div><div class="mt-pad">';
    keys.forEach(function (k) {
      var fn = /^(back|clr)$/.test(k), go = k === 'ok';
      h += '<button type="button" class="mt-key' + (fn ? ' fn' : '') + (go ? ' go' : '') + '" data-k="' + k + '" aria-label="' + (lab[k] || k) + '">' + (lab[k] || k) + '</button>';
    });
    if (kind.k === 'pair') h += '<button type="button" class="mt-key fn wide" data-k="next">換到下一格</button>';
    d.innerHTML = h + '</div>';
    return d;
  }
  function msg(t) { var m = panel && panel.querySelector('.mt-msg'); if (m) m.textContent = t || ''; }

  function press(k) {
    if (!S || S.done) return;
    var v = S.vals[S.cur] || '';
    msg('');
    if (/^\d$/.test(k)) { if (v.replace('-', '').length < 9) v += k; }
    else if (k === 'neg') v = v.charAt(0) === '-' ? v.slice(1) : '-' + v;
    else if (k === 'dot') { if (v && !/[./]/.test(v) && /\d$/.test(v) && S.kind.k !== 'quad') v += '.'; }
    else if (k === 'slash') { if (v && !/[./]/.test(v) && /\d$/.test(v) && S.kind.k !== 'quad') v += '/'; }
    else if (k === 'back') v = v.slice(0, -1);
    else if (k === 'clr') v = '';
    else if (k === 'next') { S.cur = (S.cur + 1) % S.vals.length; draw(); return; }
    else if (k === 'ok') { submit(); return; }
    S.vals[S.cur] = v; draw();
  }
  function submit() {
    if (!S || S.done) return;
    if (!complete(S.kind, S.vals)) { msg(S.kind.k === 'quad' ? '請輸入 1、2、3、4 其中一個數字' : S.vals.length > 1 ? '兩格都要填完整的數字喔' : '數字還沒按完整喔'); return; }
    var Q; try { Q = q; } catch (e) { return; }
    var ok = check(S.kind, S.vals);
    S.done = true; panel.className = 'done ' + (ok ? 'good' : 'bad'); draw();
    var opts = [].slice.call(document.querySelectorAll('#opts button')), ans = Q.ans;
    try {
      if (ok) answer(ans, opts.filter(function (b) { return b.dataset.v === ans; })[0] || opts[0]);
      else answer('⌨' + S.vals.join(','), opts.filter(function (b) { return b.dataset.v !== ans; })[0] || opts[0]);
    } catch (e) {}
  }
  function lockPanel() { if (S && !S.done) { S.done = true; if (panel) { panel.className = 'done bad'; draw(); } } }

  function reset() {
    if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    panel = null; S = null;
    var o = $('#opts'); if (o) o.style.display = '';
    var c = $('#t-cut'); if (c) c.style.display = '';
  }
  function sync() {
    var g = $('#s-game'); if (!g || g.classList.contains('hide')) return reset();
    var Q, md; try { Q = q; md = mode; } catch (e) { return reset(); }
    if (md !== 'hard' || !Q) return reset();
    var kind = kindOf(Q); if (!kind) return reset();
    css(); reset();
    var o = $('#opts'); if (!o) return;
    o.style.display = 'none';
    var c = $('#t-cut'); if (c) c.style.display = 'none';          // 沒有選項可以刪，這個道具先收起來
    panel = build(kind); o.parentNode.insertBefore(panel, o.nextSibling);
    S = { kind: kind, vals: kind.k === 'pair' ? ['', ''] : [''], cur: 0, done: false };
    draw();
    panel.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.mt-key'); if (b) { press(b.dataset.k); return; }
      var x = e.target.closest && e.target.closest('.mt-box'); if (x && S && !S.done) { S.cur = +x.dataset.i; draw(); }
    });
  }
  function onKey(e) {
    if (!S || S.done || !panel || e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    var k = e.key, a = null;
    if (/^\d$/.test(k)) a = k; else if (k === '-') a = 'neg'; else if (k === '.') a = 'dot'; else if (k === '/') a = 'slash';
    else if (k === 'Backspace') a = 'back'; else if (k === 'Delete') a = 'clr'; else if (k === 'Enter') a = 'ok';
    else if (k === 'Tab' || k === ',' || k === ' ') { if (S.vals.length > 1) a = 'next'; else if (k === ' ') a = 'ok'; }
    if (a) { e.preventDefault(); e.stopPropagation(); press(a); }
  }
  function install() {
    if (window.__jb2TypedOn) return; window.__jb2TypedOn = 1;
    var on = window.next, om = window.miss;
    if (typeof on !== 'function') return;
    window.next = function () { var r = on.apply(this, arguments); try { sync(); } catch (e) { try { reset(); } catch (e2) {} } return r; };
    if (typeof om === 'function') window.miss = function () { var r = om.apply(this, arguments); try { lockPanel(); } catch (e) {} return r; };
    document.addEventListener('keydown', onKey, true);
  }

  window.JB2Typed = { install: install, _kindOf: kindOf, _check: check, _parse: pn, _complete: complete };
})();
