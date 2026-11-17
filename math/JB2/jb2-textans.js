/* jb2-textans.js — 修羅／極限模式：「自己寫出答案」的判斷（算式、方程式、對錯）
 *
 * 兩種題型（其餘題型維持選擇題：不等式、看圖辨認、概念名稱等）：
 *   1. 算式／方程式：答案像 51x + 30y、y = 3、y = 2x、xy = 20。學生用手機／電腦「內建輸入法」打出來（手寫輸入法也可以），
 *      用「代入多組數字看結果是否一致」判斷對錯，所以 30y+51x、y=3、3=y、2y=6 都算對（方程式兩邊同乘一個數也算同一條）。
 *      題目要求「化簡」時，還要求沒有括號、沒有同類項沒合併。
 *   2. 對錯：答案是「是／不是、正確／錯誤、成立／不成立、會改變／不會改變」→ 輸入 對／錯（也接受 是／否、○／×、O／X、Y／N）。
 *
 * API：
 *   JB2Text.specOf(ansText, questionText) → null（維持選擇題）或 { t:'alg', a, eq, simple } 或 { t:'tf', v }
 *   JB2Text.judge(spec, typed)           → 'ok' | 'no' | 'simplify' | 'invalid'（invalid＝格式看不懂，不扣命，請學生重打）
 *   JB2Text.hint(spec)                   → 輸入框下面的提示文字
 */
(function () {
  'use strict';
  if (window.JB2Text) return;

  /* ---------- 文字正規化 ---------- */
  function norm(s) {
    s = String(s == null ? '' : s).replace(/²/g, '^2').replace(/³/g, '^3');
    try { s = s.normalize('NFKC'); } catch (e) {}
    return s.replace(/[−–—﹣‐]/g, '-').replace(/[×·⋅∙]/g, '*').replace(/÷/g, '/').replace(/\s+/g, '');
  }

  /* ---------- 算式解析（遞迴下降）：回傳 { f(env), vars } ---------- */
  function parse(src) {
    var s = norm(src), i = 0, vars = {};
    function peek() { return s.charAt(i); }
    function isNum(c) { return c >= '0' && c <= '9' || c === '.'; }
    function isVar(c) { return /[a-zA-Z]/.test(c); }
    function startsFactor(c) { return c !== '' && (isNum(c) || isVar(c) || c === '('); }
    function expr() {
      var l = term(), c;
      while ((c = peek()) === '+' || c === '-') { i++; var r = term(); l = c === '+' ? add(l, r) : sub(l, r); }
      return l;
    }
    function term() {
      var l = unary(), c;
      for (;;) {
        c = peek();
        if (c === '*' || c === '/') { i++; var r = unary(); l = c === '*' ? mul(l, r) : div(l, r); }
        else if (startsFactor(c)) { l = mul(l, unary()); }       // 2x、2(x+1)、xy、(a)(b)
        else break;
      }
      return l;
    }
    function unary() {
      var c = peek();
      if (c === '-') { i++; var u = unary(); return function (e) { return -u(e); }; }
      if (c === '+') { i++; return unary(); }
      return power();
    }
    function power() {
      var b = atom();
      if (peek() === '^') { i++; var x = unary(); return function (e) { return Math.pow(b(e), x(e)); }; }
      return b;
    }
    function atom() {
      var c = peek(), st = i;
      if (c === '(') { i++; var v = expr(); if (peek() !== ')') throw new Error('paren'); i++; return v; }
      if (isNum(c)) {
        while (isNum(peek())) i++;
        var n = parseFloat(s.slice(st, i)); if (!isFinite(n)) throw new Error('num');
        return function () { return n; };
      }
      if (isVar(c)) { i++; var k = c.toLowerCase(); vars[k] = 1; return function (e) { return e[k]; }; }
      throw new Error('atom');
    }
    function add(a, b) { return function (e) { return a(e) + b(e); }; }
    function sub(a, b) { return function (e) { return a(e) - b(e); }; }
    function mul(a, b) { return function (e) { return a(e) * b(e); }; }
    function div(a, b) { return function (e) { return a(e) / b(e); }; }
    if (!s) throw new Error('empty');
    var f = expr(); if (i < s.length) throw new Error('trail');
    return { f: f, vars: vars };
  }
  /* 「A=B」→ 回傳 A−B；沒有等號 → 回傳算式本身 */
  function build(src) {
    var s = norm(src), p = s.split('=');
    if (p.length > 2) throw new Error('eq');
    if (p.length === 2) {
      if (!p[0] || !p[1]) throw new Error('eq');
      var L = parse(p[0]), R = parse(p[1]), v = {}, k;
      for (k in L.vars) v[k] = 1; for (k in R.vars) v[k] = 1;
      return { eq: true, vars: v, f: function (e) { return L.f(e) - R.f(e); } };
    }
    var E = parse(s); return { eq: false, vars: E.vars, f: E.f };
  }

  /* ---------- 比較：代入多組數字 ---------- */
  var PTS = [1.37, -2.11, 3.53, 0.71, -1.93, 2.89, -0.59, 4.17];
  function envs(vars) {
    var names = Object.keys(vars).sort(), out = [], p, k;
    for (p = 0; p < PTS.length; p++) { var e = {}; for (k = 0; k < names.length; k++) e[names[k]] = PTS[(p * 3 + k * 5) % PTS.length] + (k ? 0.13 * k : 0); out.push(e); }
    return out;
  }
  function close(a, b) { return Math.abs(a - b) <= 1e-7 * (1 + Math.abs(a) + Math.abs(b)); }
  function sameThing(A, B) {                                       // A、B 都是 build() 的結果
    if (A.eq !== B.eq) return false;
    var v = {}, k; for (k in A.vars) v[k] = 1; for (k in B.vars) v[k] = 1;
    var es = envs(v), i, a = [], b = [];
    for (i = 0; i < es.length; i++) { a.push(A.f(es[i])); b.push(B.f(es[i])); if (!isFinite(a[i]) || !isFinite(b[i])) return false; }
    if (!A.eq) { for (i = 0; i < es.length; i++) if (!close(a[i], b[i])) return false; return true; }
    var p0 = -1; for (i = 0; i < es.length; i++) if (Math.abs(b[i]) > 1e-9) { p0 = i; break; }
    if (p0 < 0 || Math.abs(a[p0]) < 1e-9) return false;               // 方程式：只要是同一條（兩邊同乘一個不是 0 的數）就算對
    var c = a[p0] / b[p0];
    for (i = 0; i < es.length; i++) if (!close(a[i], c * b[i])) return false;
    return true;
  }
  /* 化簡：沒有括號、沒有重複的同類項、沒有「乘號連著兩個數字」 */
  function simplified(src) {
    var s = norm(src); if (/[()]/.test(s)) return false;
    var terms = s.replace(/^-/, '').split(/[+-]/), seen = {}, i;
    for (i = 0; i < terms.length; i++) {
      var t = terms[i]; if (!t) return false;
      var key = t.replace(/[\d.*\/]/g, '').split('').sort().join('');
      if (seen[key]) return false; seen[key] = 1;
      if (/\d\*\d/.test(t)) return false;
    }
    return true;
  }

  /* ---------- 對錯 ---------- */
  var POS = /^(對|是|是的|正確|成立|會|會改變|符合|有|在|○|〇|o|y|yes|t|true|1)$/i;
  var NEG = /^(錯|不對|否|不是|錯誤|不成立|不會|不會改變|不符合|沒有|不在|×|x|n|no|f|false|0)$/i;
  function tfWord(s) {
    s = String(s == null ? '' : s); try { s = s.normalize('NFKC'); } catch (e) {} s = s.replace(/\s+/g, '').replace(/[。.!！?？]+$/, '');
    if (POS.test(s)) return true; if (NEG.test(s)) return false; return null;
  }

  /* ---------- 這題能不能用「寫的」？ ---------- */
  var PICK = /哪(一|個|些|組|種|兩|幾)|選出|何者|下列哪/;           // 「下列敘述是否正確」不算，只擋真的在選一個的
  function specOf(ansText, qText) {
    var a = String(ansText == null ? '' : ansText).trim(), t = String(qText == null ? '' : qText).replace(/<[^>]*>/g, ' ');
    if (!a || PICK.test(t)) return null;
    if (/^(不是|不成立|錯誤|不會改變|不符合|不在)/.test(a)) return { t: 'tf', v: false };
    if (/^(是|成立|正確|會改變|符合)/.test(a)) return { t: 'tf', v: true };
    if (/[≤≥<>≦≧≠]/.test(a)) return null;                              // 不等式先維持選擇題
    if (!/^[0-9a-zA-Z+\-−×÷*\/^()=.\s²³]+$/.test(a)) return null;
    if (!/[a-zA-Z]/.test(a) || !(/[=+\-−×÷*\/^()]/.test(a) || /\d\s*[a-zA-Z]/.test(a))) return null;
    try { var B = build(a); return { t: 'alg', a: a, eq: B.eq, simple: /化簡|最簡/.test(t) }; } catch (e) { return null; }
  }
  function judge(spec, typed) {
    if (!spec) return 'invalid';
    if (spec.t === 'tf') { var w = tfWord(typed); return w === null ? 'invalid' : (w === spec.v ? 'ok' : 'no'); }
    var A, B;
    try { A = build(typed); } catch (e) { return 'invalid'; }
    try { B = build(spec.a); } catch (e) { return 'invalid'; }
    if (A.eq !== B.eq) return spec.eq && !A.eq ? 'invalid' : 'no';
    if (!sameThing(A, B)) return 'no';
    if (spec.simple && !simplified(typed)) return 'simplify';
    return 'ok';
  }
  function hint(spec) {
    if (!spec) return '';
    if (spec.t === 'tf') return '請輸入「對」或「錯」（也可以輸入 是／否、○／×）';
    return spec.eq ? '請寫出方程式，例如 y=2x+1（用手機內建輸入法或手寫都可以）' : '請寫出算式，例如 3x+2y（用手機內建輸入法或手寫都可以）';
  }

  window.JB2Text = { specOf: specOf, judge: judge, hint: hint, _norm: norm, _simplified: simplified };
})();
