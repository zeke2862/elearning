/* 自動產生：取自 JB2V2 mode-system.js 的「化簡小老師」（括號、同類項、合併，含正負號與分數／小數係數） */
window.JB2=window.JB2||{stages:{}};
(function(){
var q=null, hooks=null, CFG={TUTOR_MISS_MAX:1,TUTOR_DWELL_MS:1500}, MS_CAT_URL='assets/cat.webp';
function esc(s){var d=document.createElement('div');d.textContent=s==null?'':String(s);return d.innerHTML;}
function plainText(h){var d=document.createElement('div');d.innerHTML=h;return d.textContent;}
function catify(h){return String(h).replace(/🐱/g,'<img src="assets/cat.webp" alt="" style="width:1.1em;height:1.1em;vertical-align:-0.2em">');}
function stMount(ov){hooks.mount(ov);}
function stFinish(wc,ok,m){hooks.finish(wc,ok,m);}
  var Fr = (function () {
    function g(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
    function mk(n, d) { if (d < 0) { n = -n; d = -d; } var k = g(n, d); return { n: n / k, d: d / k }; }
    return {
      mk: mk, int: function (n) { return mk(n, 1); },
      add: function (a, b) { return mk(a.n * b.d + b.n * a.d, a.d * b.d); },
      mul: function (a, b) { return mk(a.n * b.n, a.d * b.d); },
      neg: function (a) { return { n: -a.n, d: a.d }; },
      abs: function (a) { return { n: Math.abs(a.n), d: a.d }; },
      eq: function (a, b) { return a.n === b.n && a.d === b.d; },
      sign: function (a) { return a.n < 0 ? -1 : a.n > 0 ? 1 : 0; },
      parse: function (s) {
        var m = /^(\d+)(?:\.(\d+))?(?:\/(\d+))?$/.exec(s); if (!m) return null;
        if (m[2]) return mk(parseInt(m[1] + m[2], 10), Math.pow(10, m[2].length));
        return m[3] ? mk(parseInt(m[1], 10), parseInt(m[3], 10)) : mk(parseInt(m[1], 10), 1);
      }
    };
  })();
  var ST = { dec: false };
  function frStr(a) {
    if (a.d === 1) return String(a.n);
    if (ST.dec) { var v = a.n / a.d; return String(Math.round(v * 1000) / 1000); }
    return a.n + '/' + a.d;
  }
  var gid = 0;
  function stParse(text) {
    var s = text.replace(/^化簡[^：:]*[：:]\s*/, '').replace(/[−－]/g, '-').replace(/\s+/g, '');
    var pos = 0; ST.dec = /\d\.\d/.test(s);
    function parseSum(close) {
      var items = [], sign = 1;
      while (pos < s.length && s[pos] !== close) {
        var ch = s[pos];
        if (ch === '+') { sign = 1; pos++; continue; }
        if (ch === '-') { sign = -sign; pos++; continue; }
        var fm = /^(\d+)?([xy])\/(\d+)/.exec(s.slice(pos)), num = fm ? null : /^\d+(?:\.\d+)?(?:\/\d+)?/.exec(s.slice(pos)), coef = null;
        if (fm) { coef = Fr.mk(parseInt(fm[1] || '1', 10), parseInt(fm[3], 10)); pos += (fm[1] ? fm[1].length : 0); var vv = s[pos]; pos += 1 + 1 + fm[3].length; var c0 = coef; if (sign < 0) c0 = Fr.neg(c0); items.push({ k: 't', c: c0, v: vv }); sign = 1; continue; }
        if (num) { coef = Fr.parse(num[0]); pos += num[0].length; }
        var c = coef || Fr.int(1); if (sign < 0) c = Fr.neg(c);
        var nx = s[pos];
        if (nx === 'x' || nx === 'y') { items.push({ k: 't', c: c, v: nx }); pos++; }
        else if (nx === '(' || nx === '[' || nx === '{') {
          var cl = nx === '(' ? ')' : nx === '[' ? ']' : '}'; pos++;
          var kids = parseSum(cl); pos++;
          items.push({ k: 'g', id: ++gid, m: c, kids: kids, br: nx, cl: cl });
        } else if (coef) items.push({ k: 't', c: c, v: '' });
        else throw new Error('parse ' + ch);
        sign = 1;
      }
      return items;
    }
    var it = parseSum(null); if (pos < s.length) throw new Error('parse tail');
    return it;
  }
  function hasGrp(items) { return items.some(function (x) { return x.k === 'g'; }); }
  function innermost(items, out) {
    items.forEach(function (x) { if (x.k === 'g') { if (hasGrp(x.kids)) innermost(x.kids, out); else out.push(x); } });
    return out;
  }
  function tTxt(c, v) {
    var a = Fr.abs(c);
    if (v && a.n === 1 && a.d === 1) return v;
    if (v && a.d !== 1 && !ST.dec) return (a.n === 1 ? '' : String(a.n)) + v + '/' + a.d;   // 分數係數：2x/3、x/3
    return frStr(a) + v;
  }
  // 純文字：用於歷程與選項
  function listTxt(items) {
    var out = '';
    items.forEach(function (x, i) {
      var neg, body;
      if (x.k === 't') { neg = Fr.sign(x.c) < 0; body = tTxt(x.c, x.v); }
      else { neg = Fr.sign(x.m) < 0; var a = Fr.abs(x.m); body = (a.n === 1 && a.d === 1 ? '' : frStr(a)) + x.br + ' ' + listTxt(x.kids) + ' ' + x.cl; }
      out += (i === 0 ? (neg ? '-' : '') : (neg ? ' - ' : ' + ')) + body;
    });
    return out || '0';
  }
  // HTML：括號符號可以點
  var BRSEL = null;
  function listHtml(items, ok) {
    var out = '';
    items.forEach(function (x, i) {
      var neg, body;
      if (x.k === 't') { neg = Fr.sign(x.c) < 0; body = tTxt(x.c, x.v); }
      else {
        neg = Fr.sign(x.m) < 0; var a = Fr.abs(x.m);
        var cls = 'st-b' + (ok && ok.indexOf(x) >= 0 ? ' hot' : '');
        var so = BRSEL && BRSEL.id === x.id && BRSEL.side === 'o' ? ' sel' : '', sc = BRSEL && BRSEL.id === x.id && BRSEL.side === 'c' ? ' sel' : '';
        body = (a.n === 1 && a.d === 1 ? '' : frStr(a)) + '<b class="' + cls + so + '" data-g="' + x.id + '" data-s="o">' + x.br + '</b> ' + listHtml(x.kids, ok) + ' <b class="' + cls + sc + '" data-g="' + x.id + '" data-s="c">' + x.cl + '</b>';
      }
      out += (i === 0 ? (neg ? '-' : '') : (neg ? ' <span class="op">-</span> ' : ' <span class="op">+</span> ')) + body;
    });
    return out || '0';
  }
  function findParent(items, g) {
    var i = items.indexOf(g); if (i >= 0) return { list: items, i: i };
    for (var k = 0; k < items.length; k++) if (items[k].k === 'g') { var r = findParent(items[k].kids, g); if (r) return r; }
    return null;
  }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function uniq(arr, rightIdx0) { var seen = {}, o = []; arr.forEach(function (x, i) { if (!seen[x.t]) { seen[x.t] = 1; o.push(x); } }); return o; }

  function norm(s) { return String(s).replace(/[−－]/g, '-').replace(/\s+/g, ''); }


  var GLOSS = [
    ['交叉相乘', '外項 × 外項 ＝ 內項 × 內項，把比例式變成一般的等式'], ['外項', '比例式 a : b = c : d 最外面的 a 和 d'], ['內項', '比例式 a : b = c : d 中間的 b 和 c'],
    ['移項', '把一項搬到等號（或不等號）的另一邊，搬過去要變號（＋變－、－變＋）'], ['代入', '把一個未知數換成已知的數字或式子'], ['代回', '把算出來的數字放回原本的式子，求另一個未知數'],
    ['消去', '兩個式子相加或相減，讓其中一個未知數不見'], ['分配律', '括號外面的數，要乘括號裡的每一項'], ['去括號', '把括號拆掉，裡面的項再照規則處理'],
    ['同類項', '字母一樣的項（只有數字的「常數項」彼此也是同類）'], ['係數', '字母前面的數字（連同正負號）'], ['常數項', '沒有字母、只有數字的項'],
    ['「項」', '用加號、減號隔開的每一小段（正負號跟著那一項）'], ['合計', '全部加起來'], ['相差', '大的減去小的'], ['中位數', '資料由小到大排好後，最中間的那個數'], ['眾數', '出現次數最多的數'],
    ['不超過', '最多到那個數，包含剛好等於（≤）'], ['至少', '最少要到那個數，包含剛好等於（≥）']
  ];
  var GEN_HINTS = ['先用手算：把這一步的算式寫在紙上，一個數字一個數字慢慢算。', '用排除法：先刪掉「正負號不對」或「數字差太多」的選項，再從剩下的選。'];
  function stUI(ov, getMiss) {
    var shown = {}, hintI = 0;
    var $o = function (q2) { return ov.querySelector(q2); };
    function fb(h, kind) {
      var f = $o('#st-fb'); f.className = 'st-fb' + (kind === 'hint' ? ' hint' : ''); f.innerHTML = catify(h); f.style.display = 'block';
      f.style.animation = 'none'; void f.offsetWidth; f.style.animation = '';
    }
    function gloss(h) {
      var plain = String(h).replace(/<[^>]+>/g, ''), out = [], rest = plain;
      GLOSS.forEach(function (g) { if (rest.indexOf(g[0]) >= 0 && !shown[g[0]]) { shown[g[0]] = 1; out.push('<b>' + g[0] + '</b>：' + g[1]); rest = rest.split(g[0]).join(''); } });
      $o('#st-gl').innerHTML = out.length ? '<div class="gl">📘 名詞小卡<br>' + out.join('<br>') + '</div>' : '';
    }
    function say(h, kind) {
      if (kind) { fb(h, kind === 'hint' ? 'hint' : 'warn'); return; }
      var b = $o('#st-say'); b.innerHTML = catify(h); $o('#st-fb').style.display = 'none'; hintI = 0; gloss(h);
    }
    function hint(list) { var l = (list || []).filter(Boolean).concat(GEN_HINTS), k = Math.min(hintI, l.length - 1); fb('💡 ' + l[k], 'hint'); hintI++; }
    function meter(n) {
      var m = $o('#st-meter'); if (!m) return; m.style.display = 'none'; return;
      m.className = 'st-meter' + (n >= 2 ? ' over' : '');
      m.textContent = n >= 2 ? '失誤 ' + n + ' 次：這題會記成「答錯」，不過把步驟做完會學得更紮實！' : '失誤 ' + n + ' 次（0～1 次算答對；2 次以上這題算答錯）';
    }
    return { say: say, hint: hint, meter: meter, fb: fb };
  }
  function stTutor() {
    var items;
    try { items = stParse(q.text); } catch (e) { return; }
    var src = listTxt(items);
    var misses = 0, hist = [src], phase = 'pick', cur = null, bad = {}, msg;
    var VARS = ['x', 'y', ''], vi = 0, mergeSet = null;
    var ov = document.createElement('div'); ov.id = 'ms-st-ov';
    ov.innerHTML = '<div class="box"><div class="ms-thead">小老師帶你一步一步化簡</div>' +
      '<div class="st-q spot" id="st-q"></div>' +
      '<div class="ms-tstage"><div class="ms-cat talk"><span class="cap">🎓</span><img class="face" src="' + MS_CAT_URL + '" alt="智慧貓"><small>小老師</small></div><div class="ms-bubble" id="st-say" style="min-height:70px"></div></div>' +
      '<div class="st-fb" id="st-fb"></div><div class="st-gl" id="st-gl"></div><div class="st-meter" id="st-meter"></div>' +
      '<div class="st-hist" id="st-hist"></div><div class="st-cur" id="st-cur"></div><div class="st-ch" id="st-ch"></div>' +
      '<div class="ms-ctl"><button class="btn ghost" id="st-hint">💡 提示</button></div></div>';
    stMount(ov); ov._q = q;
    var $o = function (s) { return ov.querySelector(s); };
    $o('#st-q').textContent = plainText(q.text).trim();
    var ui = stUI(ov), say = ui.say, hintTxt = '', hint2 = '';
    function miss() { misses++; ui.meter(misses); }
    ui.meter(0);
    function close() { ov.remove(); }
    function render(hot) {
      $o('#st-hist').innerHTML = hist.slice(0, -1).map(function (h, i) { return '<div>' + (i ? '= ' : '') + esc(h) + '</div>'; }).join('');
      $o('#st-cur').innerHTML = (hist.length > 1 ? '= ' : '') + listHtml(items, hot);
    }
    function choices(list, onPick) {
      var el = $o('#st-ch'); el.innerHTML = '';
      list.forEach(function (o) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'st-opt'; b.textContent = o.t;
        b.onclick = function () { if (b.disabled) return; if (o.ok) { el.innerHTML = ''; onPick(); } else { miss(); b.disabled = true; b.classList.add('bad'); say(o.why || '再想想看～', true); } };
        el.appendChild(b);
      });
    }
    function sumItems(arr) { return arr.map(function (x, i) { var neg = Fr.sign(x.c) < 0; return (i === 0 ? (neg ? '-' : '') : (neg ? ' - ' : ' + ')) + tTxt(x.c, x.v); }).join('') || '0'; }

    function toPick() {
      phase = 'pick'; var inn = innermost(items, []);
      if (!inn.length) return toClassify();
      var gm = null;
      inn.some(function (g) { scopeG = g; var has = groupsOf().length > 0; scopeG = null; if (has) gm = g; return has; });
      if (gm) { scopeG = gm; return toClassify(); }
      hint2 = '「最裡面」＝括號裡面沒有別的括號。如果有好幾組，從最左邊那一組開始。';
      setSel(null);
      hintTxt = '運算順序：括號先做（由內往外、由左往右）→ 先乘除、後加減 → 同類項再合併。先找「最裡面」、而且最左邊的那一組括號，把它的前括號和後括號都點到。';
      say('算式裡有括號！<b>括號先做</b>：請找到「最裡面」那一組括號，點它<b>前面（左）</b>和<b>後面（右）</b>的括號，湊成一對。如果有好幾組，<b>從左邊開始</b>～');
      $o('#st-ch').innerHTML = ''; render(null);
    }
    var brSel = null;
    function setSel(v) { brSel = v; BRSEL = v; }
    function onClickG(id, side) {
      if (phase !== 'pick') return;
      var inn = innermost(items, []), g = null;
      (function find(l) { l.forEach(function (x) { if (x.k === 'g') { if (x.id === id) g = x; find(x.kids); } }); })(items);
      if (!g) return;
      if (!brSel) {
        if (inn.indexOf(g) < 0) { miss(); say('🐱 這組括號裡面還有別的括號！要先處理<b>最裡面</b>的喔。', true); render(inn.slice(0, 1)); return; }
        if (inn[0] !== g) { miss(); say('🐱 好幾組括號都可以先做的時候，要<b>從左到右</b>，先做最左邊那一組喔。', true); render(inn.slice(0, 1)); return; }
        setSel({ id: id, side: side });
        say('👍 你選了「' + (side === 'o' ? '前面（左）' : '後面（右）') + '」的括號。再點它對應的<b>「' + (side === 'o' ? '後面（右）' : '前面（左）') + '」括號</b>，湊成一對！');
        render(null); return;
      }
      if (brSel.id === id && brSel.side !== side) { setSel(null); cur = g; toExpand(g); return; }
      if (brSel.id === id && brSel.side === side) { setSel(null); toPick(); return; }
      miss(); setSel(null);
      say('🐱 這兩個括號不是一對喔！<b>前括號</b>和<b>後括號</b>要「同一組」才能配成一對，再找找看。', true);
      render(null);
    }
    function toExpand(g) {
      phase = 'expand';
      var m = g.m, kids = g.kids, one = Fr.eq(m, Fr.int(1)), minus1 = Fr.eq(m, Fr.int(-1));
      var isCoef = !(one || minus1);
      hint2 = isCoef ? '例如 3(x − 2) = 3x − 6：x 和 −2 都要乘 3。' : '例如 −(x − 2) = −x + 2：括號裡每一項的符號都反過來。';
      var rule = one ? '括號前面是「＋」（或什麼都沒有）：直接去掉括號，裡面每一項的符號都不變。'
        : minus1 ? '括號前面是「負號」：去掉括號時，裡面<b>每一項都要變號</b>（＋變－、－變＋）。'
        : Fr.sign(m) < 0 ? '括號前面是「' + frStr(m) + '」：括號裡<b>每一項</b>都要乘 ' + frStr(m) + '（分配律），而且負的乘進去會<b>變號</b>。'
        : '括號前面是「' + frStr(m) + '」：括號裡<b>每一項</b>都要乘 ' + frStr(m) + '（分配律），不能只乘第一項。';
      hintTxt = rule;
      var mk = function (f) { return kids.map(function (k, i) { return { k: 't', c: f(k, i), v: k.v }; }); };
      var good = mk(function (k) { return Fr.mul(k.c, m); });
      var cand = [
        { t: sumItems(good), ok: true },
        { t: sumItems(mk(function (k, i) { return i === 0 ? Fr.mul(k.c, m) : k.c; })), why: (isCoef ? '🐱 括號外面的數字要乘到<b>每一項</b>，不是只有第一項喔！' : '🐱 括號裡面<b>每一項</b>都要處理，不是只有第一項喔！') + rule },
        { t: sumItems(mk(function (k) { return Fr.neg(Fr.mul(k.c, m)); })), why: '🐱 符號弄反了。' + rule },
        { t: sumItems(mk(function (k) { return Fr.mul(k.c, Fr.abs(m)); })), why: '🐱 括號前面的符號也要一起算進去喔！' + rule },
        { t: sumItems(mk(function (k, i) { return i === 0 ? Fr.mul(k.c, m) : Fr.mul(k.c, Fr.abs(m)); })), why: '🐱 每一項的符號都要跟著括號前面的符號走。' + rule }
      ];
      var seen = {}, pool = cand.filter(function (o) { if (seen[o.t]) return false; seen[o.t] = 1; return true; });
      var right = pool[0], wrong = pool.slice(1); shuffle(wrong);
      var opts = shuffle([right].concat(wrong.slice(0, 3)));
      say(isCoef ? '<b>先乘除、後加減</b>：括號外面的數要先乘進來。這組括號展開後，會變成哪一個？' : '<b>括號先做</b>：照規則去括號（前面是「＋」不變號、「－」每一項都變號）。展開後會變成哪一個？');
      render([g]);
      choices(opts, function () {
        var p = findParent(items, g); var rep = good;
        Array.prototype.splice.apply(p.list, [p.i, 1].concat(rep));
        hist.push(listTxt(items));
        say('✅ 對！括號拆好了。' + (hasGrp(items) ? '還有括號，繼續！' : ''));
        render(null); setTimeout(toPick, 650);
      });
    }
    var TITLE = '小老師帶你一步一步化簡', gsel = [], grouped = [], gl = [], gi = 0, scopeG = null, colorMap = {};
    function L() { return scopeG ? scopeG.kids : items; }
    function setL(a) { if (scopeG) scopeG.kids = a; else items = a; }
    function endScope() {
      var g = scopeG; scopeG = null;
      if (!g.kids.length) { var pp = findParent(items, g); if (pp) pp.list.splice(pp.i, 1); hist.push(listTxt(items)); }
      setHead(TITLE); render(null); setTimeout(toPick, 500);
    }
    function setHead(t) { $o('.ms-thead').innerHTML = t; }
    function groupsOf() {
      var seenV = {}, out = [], list = L();
      list.forEach(function (x) {
        if (x.k === 't' && !seenV[x.v]) { seenV[x.v] = 1; var ts = list.filter(function (y) { return y.k === 't' && y.v === x.v; }); if (ts.length >= 2) out.push({ v: x.v, ts: ts }); }
      });
      return out;
    }
    function chipTxt(x) { return (Fr.sign(x.c) < 0 ? '-' : '+') + tTxt(x.c, x.v); }
    function gLabel(v) { return v ? v + ' 項（字母是 ' + v + ' 的項）' : '常數項（只有數字、沒有字母的項）'; }
    function renderChips() {
      $o('#st-hist').innerHTML = hist.slice(0, -1).map(function (h, i) { return '<div>' + (i ? '= ' : '') + esc(h) + '</div>'; }).join('');
      var sm = scopeG ? scopeG.m : null, pre = scopeG ? ((Fr.sign(sm) < 0 ? '－' : '') + ((Fr.abs(sm).n === 1 && Fr.abs(sm).d === 1) ? '' : frStr(Fr.abs(sm))) + scopeG.br + ' ') : '', suf = scopeG ? ' ' + scopeG.cl : '';
      $o('#st-cur').innerHTML = (hist.length > 1 ? '= ' : '') + pre + L().map(function (x, i) {
        var gk = (phase === 'merge' && gsel.indexOf(x) >= 0) ? (colorMap[x.v] === undefined ? 0 : colorMap[x.v]) : -1;
        return '<button type="button" class="st-chip' + (gsel.indexOf(x) >= 0 ? ' sel' : '') + (gk >= 0 ? ' g' + (gk % 4) : '') + '" data-c="' + i + '">' + esc(chipTxt(x)) + '</button>';
      }).join('') + suf;
    }
    function toClassify() {
      phase = 'classify'; gl = groupsOf(); gi = 0; grouped = []; colorMap = {};
      if (!gl.length) return scopeG ? endScope() : toDone();
      setHead(scopeG ? '🔍 先找出括號裡的同類項' : '🔍 先找出同類項'); classifyNext();
    }
    function classifyNext() {
      if (gi >= gl.length) { setHead(TITLE); $o('#st-ch').innerHTML = ''; return toMerge(); }
      var g = gl[gi]; gsel = [];
      hintTxt = '同類項＝字母一樣的項（常數項彼此也是同類）。正負號是跟著那一項走的，連同符號一起點。從左邊第一項開始看起。';
      hint2 = '看清楚每一項後面的字母：字母一樣的才是同類，x 和 y 不是同類。常數項（只有數字）彼此是同類。';
      say((scopeG ? '<b>括號先做</b>：這組括號裡面有同類項，先在括號裡合併，再去括號。<br>' : (gi === 0 && hist.length > 1 ? '括號都拆完了！' : '')) + '先別急著算，我們先<b>找同類項</b>。<br>請點出' + (scopeG ? '括號裡' : '算式中') + '所有的 <b>' + gLabel(g.v) + '</b>，點好後按「確認」。');
      renderChips();
      var el = $o('#st-ch'); el.innerHTML = '';
      var b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.textContent = '✅ 確認';
      b.onclick = function () {
        var ok = gsel.length === g.ts.length && g.ts.every(function (t) { return gsel.indexOf(t) >= 0; });
        if (ok) { grouped.push(g); colorMap[g.v] = Object.keys(colorMap).length; gi++; el.innerHTML = ''; say('✅ 沒錯！這些都是 ' + (g.v ? g.v + ' 項' : '常數項') + '，同類項分好了。'); gsel = []; renderChips(); setTimeout(classifyNext, 700); return; }
        miss();
        var extra = gsel.filter(function (t) { return g.ts.indexOf(t) < 0; });
        say(!gsel.length ? '🐱 還沒有點任何一項喔！' : extra.length ? '🐱 「' + esc(chipTxt(extra[0])) + '」的字母跟 ' + (g.v || '常數項') + ' 不一樣，不是同類項喔。' : '🐱 「' + (g.v ? g.v + ' 項' : '常數項') + '」還有沒點到的，再找找（這一類一共有 ' + g.ts.length + ' 項）。', true);
      };
      el.appendChild(b);
    }
    function toMerge() {
      phase = 'merge';
      var gs = groupsOf(); if (!gs.length) return scopeG ? endScope() : toDone();
      hint2 = '例如 3 + (−5)：從 3 往左數 5 步，等於 −2。每一項都要連同正負號一起算。';
      var v = gs[0].v, ts = gs[0].ts;
      var s = ts.reduce(function (a, x) { return Fr.add(a, x.c); }, Fr.int(0)), label = v ? v + ' 項' : '常數項';
      hintTxt = '把所有「' + label + '」前面的數字（連同正負號）從左到右加起來。';
      var abs = ts.reduce(function (a, x) { return Fr.add(a, Fr.abs(x.c)); }, Fr.int(0));
      var step = ST.dec ? Fr.mk(1, 10) : Fr.int(1);
      var cands = [
        { t: frStr(s), v: s, ok: true },
        { t: frStr(abs), v: abs, why: '🐱 負的不能當成正的加喔！連同正負號一起算。' },
        { t: frStr(Fr.neg(s)), v: Fr.neg(s), why: '🐱 數字對了，但答案的正負號剛好相反，再看一次。' },
        { t: frStr(Fr.add(s, step)), v: Fr.add(s, step), why: '🐱 這個數不對：請把這一類每一項的係數（連同正負號）從左到右重新加一遍。' },
        { t: frStr(Fr.add(s, Fr.neg(step))), v: Fr.add(s, Fr.neg(step)), why: '🐱 這個數不對：有沒有漏加某一項？分數要先通分再把分子相加。' },
        { t: frStr(ts[0].c), v: ts[0].c, why: '🐱 你只用了第一項的係數，這一類的<b>每一項</b>都要加進來。' }
      ];
      var seen = {}, pool = cands.filter(function (o) { if (seen[o.t]) return false; seen[o.t] = 1; return true; });
      var right = pool[0], wr = pool.slice(1); shuffle(wr);
      var opts = shuffle([right].concat(wr.slice(0, 3)));
      var eq = ts.map(function (x) { var t = frStr(x.c); return (Fr.sign(x.c) < 0 ? '(' + t + ')' : t); }).join(' + ');
      var fnote = (!ST.dec && ts.some(function (x) { return x.c.d !== 1; })) ? '<br><small>（只看字母前面的係數，例如 2x/3 的係數是 2/3、x/3 的係數是 1/3）</small>' : '';
      say('現在<b>合併「' + label + '」</b>：把係數從左到右加起來。' + fnote + '<br><b>' + esc(eq) + ' = ？</b>');
      grouped = gs; gsel = ts.slice(); renderChips();
      choices(opts, function () {
        var lst = L(), first = lst.indexOf(ts[0]), nl;
        if (Fr.sign(s) === 0) { nl = lst.filter(function (x) { return ts.indexOf(x) < 0; }); }
        else { var nt = { k: 't', c: s, v: v }; lst[first] = nt; nl = lst.filter(function (x) { return ts.indexOf(x) < 0 || x === nt; }); }
        setL(nl);
        hist.push(listTxt(items));
        say('✅ 合併好了！'); render(null); setTimeout(toMerge, 600);
      });
    }
    function toDone() {
      phase = 'done';
      var order = { x: 0, y: 1, '': 2 };
      items.sort(function (a, b) { return order[a.v] - order[b.v]; });
      var fin = listTxt(items); if (hist[hist.length - 1] !== fin) hist.push(fin);
      render(null); $o('#st-ch').innerHTML = '';
      var okEq = norm(fin) === norm(q.ans);
      if (!okEq) { try { console.warn('ST-MISMATCH', q.text, fin, q.ans); } catch (e) {} }
      var wrongCount = misses > CFG.TUTOR_MISS_MAX;
      say('🎉 化簡完成！答案是 <b>' + esc(fin) + '</b>。' + (wrongCount ? '<br>🐱 步驟做對了，但失誤超過 ' + CFG.TUTOR_MISS_MAX + ' 次，這題還沒有完全學會，之後再練一次就會了！' : ''));
      $o('#st-hint').style.display = 'none';
      setTimeout(function () { if (!ov.parentNode || ov._q !== q) return; close(); stFinish(wrongCount, okEq, misses); }, CFG.TUTOR_DWELL_MS);
    }
    ov.addEventListener('click', function (e) {
      var c = e.target.closest && e.target.closest('[data-c]');
      if (c && phase === 'classify') { var x = L()[+c.dataset.c], k = gsel.indexOf(x); if (k >= 0) gsel.splice(k, 1); else gsel.push(x); renderChips(); return; }
      var g = e.target.closest && e.target.closest('[data-g]'); if (g) onClickG(+g.dataset.g, g.dataset.s);
    });
    $o('#st-hint').onclick = function () { ui.hint([hintTxt || '慢慢來，一步一步算！', hint2]); };
    toPick();
  }
window.JB2.simplify=function(qq,h){q=qq;hooks=h;if(h.cfg){CFG.TUTOR_MISS_MAX=h.cfg.miss;CFG.TUTOR_DWELL_MS=h.cfg.dwell;}stTutor();};
})();
