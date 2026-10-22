/* =====================================================================
   mode-system.js ── 國一下數學戰略地圖：星等制度 + 模式 + 無極限挑戰 + 小老師
   所有關卡 HTML 都會載入這一支（放在同一個資料夾即可）。

   【星等規則】（想調整數字，改下面 CFG 就好）
   三種模式「全部開放、直接選」，只是最高能拿的星數不同：
   練兵模式：不限時，依錯題數拿 1～3 星（最多 3 星）
   實戰模式：每題限時，正確率 ≥ 80% → 4 星
   修羅模式：每題更短，正確率 100%   → 5 星
   無極限挑戰：題目無限，時間從實戰速度慢慢縮到修羅速度（不給星，記錄最高題數）
   練兵的「🧑‍🏫 老師教我」：看老師示範一題，再做一題類似題；用了之後這一局最多 2 星

   【網址參數】由章節地圖開關卡時帶入
   ?stars=N   這一關目前的星數（沒帶＝5）
   ?eb=N      這一關無極限的歷史最高題數
   ?endless=1 進入無極限挑戰
   ===================================================================== */
(function () {
  'use strict';
  var CFG = {
    REAL_NEED: 0,      // 解鎖實戰所需星數（0＝直接開放）
    HARD_NEED: 0,      // 解鎖修羅所需星數（0＝直接開放）
    ENDLESS_NEED: 3,   // 解鎖無極限所需星數
    REAL_PASS: 0.8,    // 實戰達標正確率
    HARD_PASS: 1,      // 修羅達標正確率
    REAL_STAR: 4,
    HARD_STAR: 5,
    MAXSTAR: 5,
    TAUGHT_MAX: 2,     // 練兵用了「老師教我」之後，這一局最多幾顆星
    EASY_STAR2_ACC: 0.7, // 練兵 2 ⭐ 的答對率門檻（0.7＝70%）
    EASY_STAR3_ACC: 1,   // 練兵 3 ⭐ 的答對率門檻（1＝全對；而且整局沒用提示才算）
    SOFT_BANNER: true,   // 答錯／超時橫幅用溫和說法（false＝回到「怪物反擊」原文）
    TUTOR_MISS_MAX: 1,   // 小老師帶做的題：失誤超過幾次就記答錯（1＝失誤 2 次以上記答錯）
    TUTOR_DWELL_MS: 1500, // 小老師做完後，停留幾毫秒再自動送出答案
    RAMP: 30,          // 無極限：作答到第幾題時，時間縮到修羅速度
    SWITCH: 15         // 無極限：第幾題之後，改用修羅難度出題
  };

  var qp = new URLSearchParams(location.search);
  /* 數值由關卡地圖依 game-config.js 的 stage 區塊（修改器可改）用網址帶進來；也可手動測試：?star2=0.6&star3=1&tutormiss=2&dwell=800&soft=0 */
  (function () {
    var map = { star2: 'EASY_STAR2_ACC', star3: 'EASY_STAR3_ACC', tutormiss: 'TUTOR_MISS_MAX', dwell: 'TUTOR_DWELL_MS', realpass: 'REAL_PASS', hardpass: 'HARD_PASS', realneed: 'REAL_NEED', hardneed: 'HARD_NEED', endlessneed: 'ENDLESS_NEED' };
    if (qp.has('soft')) CFG.SOFT_BANNER = qp.get('soft') !== '0';
    Object.keys(map).forEach(function (k) { if (qp.has(k)) { var v = parseFloat(qp.get(k)); if (!isNaN(v) && v >= 0) CFG[map[k]] = v; } });
  })();
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var $ = function (s) { return document.querySelector(s); };
  var S = {
    stars: qp.has('stars') ? clamp(parseInt(qp.get('stars'), 10) || 0, 0, CFG.MAXSTAR) : CFG.MAXSTAR,
    best: Math.max(0, parseInt(qp.get('eb'), 10) || 0),
    flag: qp.get('endless') === '1',
    pre: (['easy', 'real', 'hard'].indexOf(qp.get('mode')) >= 0 && qp.get('endless') !== '1') ? qp.get('mode') : '',
    prac: (qp.get('practice') === 'daily' || qp.get('practice') === 'weak') ? qp.get('practice') : '',
    active: false, ended: false, M: null, orig: null, lastType: null, taught: 0
  };

  function post(m) { try { window.parent.postMessage(m, '*'); } catch (e) {} }
  function easyStr(n) { return '⭐'.repeat(n) + '☆'.repeat(Math.max(0, CFG.MAXSTAR - n)); }  /* 統一 5 格：練兵最多 3、實戰 4、修羅 5 */
  function starStr(n) { return '⭐'.repeat(n) + '☆'.repeat(CFG.MAXSTAR - n); }
  function lockMsg(m) {
    if (m === 'real' && S.stars < CFG.REAL_NEED) return '需先在練兵模式拿到 ' + CFG.REAL_NEED + ' ⭐（目前 ' + S.stars + ' ⭐）';
    if (m === 'hard' && S.stars < CFG.HARD_NEED) return '需先在實戰模式拿到 ' + CFG.HARD_NEED + ' ⭐（目前 ' + S.stars + ' ⭐）';
    return '';
  }
  var RULE = {
    easy: '🎯 最多 3 ⭐（依錯題數）',
    real: '🎯 正確率 ' + Math.round(CFG.REAL_PASS * 100) + '% 以上 → ' + CFG.REAL_STAR + ' ⭐',
    hard: '🎯 正確率 ' + Math.round(CFG.HARD_PASS * 100) + '%（全對）→ ' + CFG.HARD_STAR + ' ⭐'
  };
  // 第 n 題的作答秒數：從實戰時間慢慢縮到修羅時間，之後維持修羅時間
  function timeFor(n, tr, th) {
    var k = Math.min(1, (n - 1) / (CFG.RAMP - 1));
    return Math.round((tr - (tr - th) * k) * 10) / 10;
  }
  function restore() {
    if (S.M && S.orig) { S.M.real.t = S.orig.real; S.M.hard.t = S.orig.hard; }
  }
  // 記住「不要再自動顯示小老師說明」（單關／全部）
  var SKIP_ALL = 'jb2-lesson-skip-all';
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) {} }
  function skipKey() { return 'jb2-lesson-skip-' + S.sid; }
  function lessonSkipped() { return lsGet(SKIP_ALL) === '1' || lsGet(skipKey()) === '1'; }
  var REDUCE = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function injectStyle() {
    var st = document.createElement('style');
    st.textContent =
      '.ms-panel{margin:12px 0;padding:10px 12px;border:1px dashed var(--line,#3a4270);border-radius:10px;line-height:1.7;font-size:.95rem}' +
      '.mode.ms-locked{opacity:.5}' +
      '.mode .ms-rule{display:block;color:var(--bronze,var(--accent-gold,#d2a24c));opacity:1!important}' +
      '.ms-quitrow{text-align:center;margin:14px 0 0}' +
      '.ms-quitrow .btn{padding:8px 16px;font-size:.95rem}' +
      '.ms-replay{display:block;margin:10px auto 0;background:none;border:1px dashed var(--bronze,#d2a24c);color:var(--bronze,#d2a24c);border-radius:10px;padding:7px 14px;font:inherit;font-size:.9rem;cursor:pointer}' +
      /* 小老師 */
      '#ms-st-ov{display:block;width:100%}' +
      '#ms-st-ov .box{width:100%;background:var(--ink2,#20264a);border:2px solid var(--bronze,#d2a24c);border-radius:14px;padding:12px 14px;color:var(--txt,#e9e4d4);box-sizing:border-box}' +
      '#ms-st-ov.ms-fixed{position:fixed;inset:0;z-index:70;background:rgba(8,10,24,.9);display:flex;align-items:center;justify-content:center;padding:10px}' +
      '#ms-st-ov.ms-fixed .box{width:min(760px,100%);max-height:96vh;overflow-y:auto}' +
      /* 練兵教學：教學面板取代原本的題目／選項區，怪物留在畫面上 */
      '.battle-left:has(#ms-st-ov)>.q,.battle-left:has(#ms-st-ov)>.opts,.battle-left:has(#ms-st-ov)>.tools,.battle-left:has(#ms-st-ov)>.timebar,.battle-left:has(#ms-st-ov)>#sec{display:none!important}' +
      '@media (max-width:720px){' +
      '.battle-grid:has(#ms-st-ov){display:flex;flex-direction:column;gap:8px}' +
      '.battle-grid:has(#ms-st-ov) .battle-right{order:-1;display:grid;grid-template-columns:auto 1fr;grid-template-areas:"ring hearts" "ring name" "ring hp";align-items:center;column-gap:12px;row-gap:2px;padding:6px 12px}' +
      '.battle-grid:has(#ms-st-ov) .hearts-row{grid-area:hearts;font-size:1.1rem;letter-spacing:2px}' +
      '.battle-grid:has(#ms-st-ov) .boss-ring{grid-area:ring;width:92px;height:92px;margin:0}' +
      '.battle-grid:has(#ms-st-ov) #mon{font-size:3rem}.battle-grid:has(#ms-st-ov) #mon-img{width:76px;height:76px}.battle-grid:has(#ms-st-ov) .seal{display:none}' +
      '.battle-grid:has(#ms-st-ov) .mname{grid-area:name;text-align:left;font-size:.9rem;margin:0}' +
      '.battle-grid:has(#ms-st-ov) .mhpwrap{grid-area:hp;width:100%;margin:0}}' +
      '#ms-st-ov .st-q{margin:4px 0 8px;padding:12px 14px;background:#0003;border-radius:10px;font-size:1.2rem;font-weight:700;line-height:1.6;text-align:center}' +
      '#ms-st-ov .st-q.spot{animation:st-spot 1.6s ease-out 1}' +
      '#ms-st-ov .qsvg{margin:4px auto;text-align:center}#ms-st-ov .qsvg svg{max-width:210px!important;height:auto}#ms-st-ov .qsvg table{margin:4px auto!important}' +
      '#ms-st-ov .st-cap{font-size:.78rem;color:#cfd8dc;text-align:center;margin:2px 0}' +
      '@keyframes st-spot{0%,50%{background:#ffe27a;color:#2b2416;transform:scale(1)}12%{transform:scale(1.05)}25%{transform:scale(1)}37%{transform:scale(1.05)}50%{transform:scale(1)}100%{background:#0003;color:inherit;transform:scale(1)}}' +
      '@keyframes st-late{from{opacity:0}to{opacity:1}}' +
      '#ms-st-ov .ms-tstage,#ms-st-ov .st-hist,#ms-st-ov .st-cur,#ms-st-ov .st-ch,#ms-st-ov .ms-ctl{animation:st-late .4s ease 1.2s both}' +
      '.st-hist{margin:8px 0 2px;opacity:.65;font-size:1.05rem;line-height:1.8}' +
      '.st-cur{margin:4px 0 10px;padding:10px 12px;background:#0004;border-radius:10px;font-size:1.5rem;line-height:2;min-height:3em;word-break:keep-all}' +
      '.st-cur .op{opacity:.8}.st-b{cursor:pointer;color:var(--bronze,#d2a24c);display:inline-block;min-width:34px;min-height:42px;line-height:42px;text-align:center;font-size:1.5rem;padding:0 6px;margin:0 2px;border:2px dashed #d2a24c88;border-radius:10px;vertical-align:middle}.st-b:hover{background:#d2a24c44}.st-b.hot{background:#d2a24c55;box-shadow:0 0 0 2px #d2a24c}.st-b.sel{background:#d2a24c;color:#2a1d05}' +
      '.st-ch{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}' +
      '.st-fb{margin:8px 0 2px;padding:8px 12px;border-radius:12px;font-size:.95rem;line-height:1.5;display:none;background:#ffe3dc;color:#5a1d12}.st-fb.hint{background:#fff3c4;color:#4d3a00}.st-gl{font-size:.85rem;line-height:1.5}.st-gl .gl{margin:6px 0;padding:6px 10px;border-radius:10px;background:#e3f0ff;color:#14304f}.st-meter{margin:6px 0 2px;font-size:.82rem;opacity:.9}.st-meter.over{color:#ff9d8d;font-weight:bold}' +
      '.st-chip{border:2px solid var(--line,#3a4270);background:var(--ink,#141a3a);color:inherit;border-radius:10px;padding:6px 10px;margin:3px;font-size:1.15rem;cursor:pointer}.st-chip.sel{border-color:#d2a24c;background:#d2a24c44;transform:translateY(-2px)}.st-chip.g0{background:#3b7dd855;border-color:#3b7dd8}.st-chip.g1{background:#3fae6a55;border-color:#3fae6a}.st-chip.g2{background:#c05bd155;border-color:#c05bd1}.st-chip.g3{background:#e0873a55;border-color:#e0873a}' +
      '.st-opt{border:2px solid var(--line,#3a4270);background:var(--ink,#141a3a);color:inherit;border-radius:10px;padding:10px 8px;font-size:1.1rem}' +
      '.st-opt:hover:not(:disabled){border-color:var(--bronze,#d2a24c)}.st-opt.bad{opacity:.35;border-color:#d96a5a;text-decoration:line-through}' +
      '.ms-pre > *:not(#ms-lesson-holder){display:none !important}' +
      '.ms-lesson{margin:14px 0;padding:14px 16px;border:1.5px solid var(--accent-gold,#d2a24c);border-radius:14px;background:rgba(210,162,76,0.08);text-align:left}' +
      '.ms-thead{font-weight:700;margin-bottom:8px;font-size:1.05rem}' +
      '.ms-tstage{display:flex;gap:12px;align-items:flex-start}' +
      '.ms-cat{flex:none;width:76px;text-align:center;font-size:3.2rem;line-height:1;position:relative}' +
      '.ms-cat small{display:block;font-size:.7rem;opacity:.75;margin-top:2px;line-height:1.2}' +
      '.ms-cat .cap{position:absolute;left:50%;top:-12px;transform:translateX(-50%) rotate(-8deg);font-size:1.5rem}' +
      '.ms-cat.talk .face{display:inline-block;animation:msbob .5s ease-in-out infinite}' +
      '@keyframes msbob{50%{transform:translateY(-6px) rotate(-4deg)}}' +
      '.ms-bubble{flex:1;position:relative;background:var(--paper,#f1e8d2);color:#2b2416;border-radius:14px;padding:12px 14px;min-height:96px;line-height:1.75;font-size:1rem;animation:mspop .25s ease-out}' +
      '.ms-bubble::before{content:"";position:absolute;left:-9px;top:22px;border:9px solid transparent;border-right-color:var(--paper,#f1e8d2);border-left:0}' +
      '@keyframes mspop{from{transform:scale(.92);opacity:0}to{transform:none;opacity:1}}' +
      '.ms-tag{display:inline-block;font-size:.75rem;font-weight:700;background:#2b2416;color:var(--bronze,#d2a24c);border-radius:8px;padding:1px 8px;margin-bottom:4px}' +
      '.ms-dots{display:flex;gap:6px;justify-content:center;margin:10px 0 2px}' +
      '.ms-dots i{width:8px;height:8px;border-radius:50%;background:#fff3;transition:.2s}.ms-dots i.on{background:var(--bronze,#d2a24c);transform:scale(1.3)}' +
      '.ms-ctl{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:8px}' +
      '.ms-ctl .btn{padding:8px 16px;font-size:.95rem}' +
      '.ms-skip{margin-top:10px;font-size:.88rem;line-height:1.9}.ms-skip label{display:block;cursor:pointer}' +
      '.ms-video{position:relative;padding-bottom:56.25%;height:0;margin:10px 0;border-radius:8px;overflow:hidden;background:#000}' +
      '.ms-video iframe{position:absolute;inset:0;width:100%;height:100%;border:0}' +
      /* 老師教我 */
      '#ms-teach-ov{position:fixed;inset:0;z-index:70;background:rgba(8,10,24,.86);display:flex;align-items:center;justify-content:center;padding:12px}' +
      '#ms-teach-ov .box{width:min(720px,100%);max-height:94vh;overflow-y:auto;background:var(--ink2,#20264a);border:2px solid var(--bronze,#d2a24c);border-radius:16px;padding:14px 16px;color:var(--txt,#e9e4d4)}' +
      '.ms-tq{margin:10px 0;padding:10px 12px;background:#0003;border-radius:10px;line-height:1.7}' +
      '.ms-tq .qt{font-size:1.05rem}.ms-tq svg{max-width:100%;height:auto}' +
      '.ms-topts{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-top:8px}' +
      '.ms-topts span{border:2px solid var(--line,#3a4270);border-radius:10px;padding:6px 8px;text-align:center;transition:.3s}' +
      '.ms-topts span.right{border-color:#43a58f;background:#43a58f33;font-weight:700}' +
      '.ms-topts span.dim{opacity:.35}' +
      '#ms-taught{margin-left:8px;font-size:.8rem;background:var(--bronze,#d2a24c);color:#2a1d05;border-radius:10px;padding:1px 8px;font-weight:700}' +
      '@media (max-width:480px){.ms-cat{width:56px;font-size:2.4rem}.ms-bubble{font-size:.95rem}}' +
      '@media (prefers-reduced-motion:reduce){.ms-cat.talk .face,.ms-bubble{animation:none}}';
    document.head.appendChild(st);
  }

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  /* ------------------------------------------------------------------
     🐱 小老師說明（取代原本的文字複習卡）
     - 小貓老師一句一句講「觀念重點」與「作答技巧」，點一下就下一句
     - 看完可勾選「以後不要再自動顯示」（單關或全部），想再看隨時按「🐱 小老師說明」
     ------------------------------------------------------------------ */
  function lessonSteps(L) {
    var steps = [{ tag: '', text: '嗨！我是智慧貓小老師～開戰前，我用幾句話幫你複習重點！' }];
    (L.concept || []).forEach(function (t, i) { steps.push({ tag: '🧠 觀念重點 ' + (i + 1), text: t }); });
    (L.tip || []).forEach(function (t, i) { steps.push({ tag: '💡 作答技巧 ' + (i + 1), text: t }); });
    steps.push({ tag: '', text: S.pre ? '重點講完囉！準備好就開始答題，加油～' : '重點講完囉！準備好就去選一個模式，點下去就會開打～加油！', last: true });
    return steps;
  }
  function buildLesson(L, onDone) {
    var steps = lessonSteps(L), i = 0, timer = 0;
    var box = document.createElement('div'); box.className = 'ms-lesson';
    box.innerHTML =
      '<div class="ms-thead">🐱 智慧貓小老師說明</div>' +
      '<div class="ms-tstage"><div class="ms-cat talk" id="ms-cat"><span class="cap">🎓</span><span class="face">🐱</span><small>小老師</small></div>' +
      '<div class="ms-bubble" id="ms-bub"></div></div>' +
      '<div class="ms-dots" id="ms-dots"></div>' +
      '<div id="ms-vid"></div>' +
      '<div class="ms-ctl"><button class="btn ghost" id="ms-tskip">⏭ 直接略過</button><button class="btn" id="ms-tnext">下一句 ▶</button></div>' +
      '<div class="ms-skip hide" id="ms-skipbox">' +
      '<label><input type="checkbox" id="ms-sk1"> 這一關以後不要再自動顯示小老師說明</label>' +
      '<label><input type="checkbox" id="ms-sk2"> 所有關卡都不要再自動顯示（之後可按「🐱 小老師說明」重看）</label></div>';
    var bub = box.querySelector('#ms-bub'), cat = box.querySelector('#ms-cat'), dots = box.querySelector('#ms-dots'), nx = box.querySelector('#ms-tnext');
    dots.innerHTML = steps.map(function () { return '<i></i>'; }).join('');
    function finish() {
      lsSet(skipKey(), box.querySelector('#ms-sk1').checked ? '1' : '');
      if (box.querySelector('#ms-sk2').checked) lsSet(SKIP_ALL, '1');
      clearInterval(timer); onDone();
    }
    function show() {
      var s = steps[i]; clearInterval(timer);
      bub.style.animation = 'none'; void bub.offsetWidth; bub.style.animation = '';
      bub.innerHTML = (s.tag ? '<div class="ms-tag">' + esc(s.tag) + '</div><br>' : '') + '<span id="ms-line"></span>';
      var line = bub.querySelector('#ms-line'), n = 0, txt = s.text;
      Array.prototype.forEach.call(dots.children, function (d, k) { d.classList.toggle('on', k === i); });
      if (REDUCE) { line.textContent = txt; cat.classList.remove('talk'); }
      else {
        cat.classList.add('talk');
        timer = setInterval(function () {
          n += 1; line.textContent = txt.slice(0, n);
          if (n >= txt.length) { clearInterval(timer); cat.classList.remove('talk'); }
        }, 28);
      }
      nx.textContent = s.last ? '✅ 我懂了，去選模式！' : '下一句 ▶';
      box.querySelector('#ms-skipbox').classList.toggle('hide', !s.last);
      if (s.last && L.video) {
        box.querySelector('#ms-vid').innerHTML = '<div class="ms-video"><iframe src="' + esc(L.video) + '" title="教學影片" loading="lazy" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe></div>';
      }
    }
    function next() {
      // 打字中再按一下＝先把這一句顯示完
      var line = bub.querySelector('#ms-line');
      if (line && line.textContent.length < steps[i].text.length && !REDUCE) { clearInterval(timer); line.textContent = steps[i].text; cat.classList.remove('talk'); return; }
      if (steps[i].last) return finish();
      i++; show();
    }
    nx.onclick = next;
    bub.onclick = function () { if (!steps[i].last) next(); };
    box.querySelector('#ms-tskip').onclick = finish;
    show();
    return box;
  }

  // 在「模式選單」前面插入小老師說明；說明看完（或略過）才顯示模式選單
  function injectLesson(anchor) {
    var L = window.LESSONS && window.LESSONS[S.sid];
    var parent = anchor.parentNode;
    var gate = document.createElement('div'); gate.id = 'ms-gate';
    parent.insertBefore(gate, anchor);
    var goEl = $('#go'), node = anchor, next;
    while (node) { next = node.nextSibling; gate.appendChild(node); if (node === goEl) break; node = next; }
    if (S.pre || S.flag || S.prac) return;
    if (!L) return;
    var holder = document.createElement('div'); holder.id = 'ms-lesson-holder';
    parent.insertBefore(holder, gate);
    var replay = document.createElement('button'); replay.className = 'ms-replay'; replay.type = 'button'; replay.textContent = '🐱 小老師說明（再看一次）';
    function open() {
      holder.innerHTML = ''; gate.style.display = 'none'; replay.style.display = 'none';
      holder.appendChild(buildLesson(L, function () { holder.innerHTML = ''; gate.style.display = ''; replay.style.display = ''; }));
    }
    replay.onclick = open;
    gate.appendChild(replay);
    if (!lessonSkipped()) open();
  }

  // 從地圖點「練兵／實戰／修羅」進來：不顯示關卡說明與模式選單，先看小老師觀念複習，再直接開始答題
  function preStart(anchor) {
    var card = anchor.closest('section') || anchor.parentNode;
    card.classList.add('ms-pre');
    var b = $('.mode[data-m="' + S.pre + '"]'); if (b) b.click();
    var L = window.LESSONS && window.LESSONS[S.sid];
    function go() { var g = $('#go'); if (g) g.click(); }
    if (!L || lessonSkipped()) { setTimeout(go, 0); return; }
    var holder = document.createElement('div'); holder.id = 'ms-lesson-holder';
    card.appendChild(holder);
    holder.appendChild(buildLesson(L, function () { holder.innerHTML = ''; go(); }));
  }

  /* ===== 收服動畫＋音效（純程式合成，不需要音檔；localStorage jb2-mute=1 可靜音） ===== */
  var AC = null;
  function sfx(list) {
    try {
      if (localStorage.getItem('jb2-mute') === '1') return;
      var A = window.AudioContext || window.webkitAudioContext; if (!A) return;
      if (!AC) AC = new A(); if (AC.state === 'suspended') AC.resume();
      var t0 = AC.currentTime;
      list.forEach(function (n) {
        var o = AC.createOscillator(), g = AC.createGain();
        o.type = n.w || 'triangle'; o.frequency.setValueAtTime(n.f, t0 + n.t);
        if (n.f2) o.frequency.exponentialRampToValueAtTime(n.f2, t0 + n.t + n.d);
        g.gain.setValueAtTime(0.0001, t0 + n.t);
        g.gain.exponentialRampToValueAtTime(n.v || 0.15, t0 + n.t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.t + n.d);
        o.connect(g); g.connect(AC.destination); o.start(t0 + n.t); o.stop(t0 + n.t + n.d + 0.05);
      });
    } catch (e) {}
  }
  function capture() {
    try {
      if (document.getElementById('ms-cap')) return;
      var img = document.getElementById('mon-img'), em = document.getElementById('mon-emoji');
      var mon = (img && img.style.display !== 'none' && img.getAttribute('src')) ? '<img src="' + img.getAttribute('src') + '" alt="">' : '<span style="font-size:96px">' + ((em && em.textContent) || '👾') + '</span>';
      var st = document.createElement('style'); st.id = 'ms-cap-css';
      st.textContent = '#ms-cap{position:fixed;inset:0;z-index:99999;background:radial-gradient(circle,#2a2f6b 0%,#080a1e 80%);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#ffe9a8;font-family:inherit;opacity:0;animation:capIn .25s forwards}' +
        '#ms-cap .m{width:150px;height:150px;display:flex;align-items:center;justify-content:center;animation:capWob .9s ease-in-out 0s 1,capSuck .55s ease-in .9s forwards}#ms-cap .m img{width:150px;height:150px;object-fit:contain}' +
        '#ms-cap .o{position:absolute;width:64px;height:64px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#9fd8ff 40%,#4a6cff);box-shadow:0 0 30px #9fd8ff;opacity:0;animation:capOrb .9s ease-out 1.35s forwards}' +
        '#ms-cap .s{position:absolute;font-size:26px;opacity:0;animation:capSpark 1s ease-out 2.2s forwards}' +
        '#ms-cap .t{margin-top:190px;font-size:30px;font-weight:800;letter-spacing:2px;opacity:0;animation:capIn .5s ease-out 2.2s forwards;text-shadow:0 0 14px #ffd84d}' +
        '@keyframes capIn{to{opacity:1}}@keyframes capWob{0%,100%{transform:rotate(0)}15%{transform:rotate(-14deg)}30%{transform:rotate(12deg)}45%{transform:rotate(-14deg)}60%{transform:rotate(12deg)}80%{transform:rotate(-6deg)}}' +
        '@keyframes capSuck{to{transform:scale(.05) rotate(540deg);opacity:0}}@keyframes capOrb{0%{opacity:0;transform:scale(.2)}30%{opacity:1;transform:scale(1.15)}60%{transform:scale(.9)}100%{opacity:1;transform:scale(1)}}' +
        '@keyframes capSpark{0%{opacity:0;transform:translate(0,0) scale(.3)}30%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1.2)}}';
      document.head.appendChild(st);
      var ov = document.createElement('div'); ov.id = 'ms-cap';
      var sp = ''; for (var i = 0; i < 14; i++) { var a = i / 14 * 6.283, r = 110 + (i % 3) * 30; sp += '<span class="s" style="--dx:' + Math.round(Math.cos(a) * r) + 'px;--dy:' + Math.round(Math.sin(a) * r - 40) + 'px">' + (i % 2 ? '⭐' : '✨') + '</span>'; }
      ov.innerHTML = '<div class="m">' + mon + '</div><div class="o"></div>' + sp + '<div class="t">✨ 收服成功！</div>';
      document.body.appendChild(ov);
      function done() { if (ov.parentNode) ov.remove(); }
      ov.addEventListener('click', done); setTimeout(done, 3300);
      sfx([{ f: 520, t: 0.05, d: 0.12 }, { f: 520, t: 0.33, d: 0.12 }, { f: 560, t: 0.6, d: 0.12 },
        { f: 1100, f2: 180, t: 0.95, d: 0.45, w: 'sine', v: 0.12 },
        { f: 523, t: 1.4, d: 0.5, w: 'sine' }, { f: 659, t: 1.55, d: 0.5, w: 'sine' }, { f: 784, t: 1.7, d: 0.5, w: 'sine' }, { f: 1047, t: 1.85, d: 0.9, w: 'sine', v: 0.18 }]);
    } catch (e) {}
  }
  /* ===== 每日挑戰／錯題練習（由主城帶 ?practice=daily 或 ?practice=weak&types=a,b 進來） ===== */
  function ymdNow() { var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }
  function pracTypes() {
    var plan = []; try { plan = PLAN.slice(); } catch (e) {}
    var uniq = plan.filter(function (x, i) { return plan.indexOf(x) === i; });
    function shuf(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    var want = (qp.get('types') || '').split(',').filter(function (x) { return uniq.indexOf(x) >= 0; });
    var n = S.prac === 'daily' ? 5 : 6, out = [];
    if (S.prac === 'weak' && want.length) { while (out.length < n) out = out.concat(shuf(want)); return out.slice(0, n); }
    while (out.length < n) out = out.concat(shuf(uniq)); return out.slice(0, n);
  }
  function pracStart(anchor) {
    var card = anchor.closest('section') || anchor.parentNode; card.classList.add('ms-pre');
    var b = $('.mode[data-m="' + (S.prac === 'daily' ? 'real' : 'easy') + '"]'); if (b) b.click();
    var ol = window.log;
    if (typeof ol === 'function') window.log = function (ok) { try { var qq = q; if (qq && qq.type) post({ type: 'wave-log', id: S.sid, qtype: qq.type, ok: !!ok }); } catch (e) {} return ol.apply(this, arguments); };
    setTimeout(function () { try { start(pracTypes(), true); } catch (e) {} }, 60);
  }
  function pracDone(o) {
    var $t = $('#e-title'), $s = $('#e-stars'), $i = $('#e-info');
    var daily = S.prac === 'daily', ok = o.total ? o.right / o.total : 0;
    try {
      var K = 'jb2-practice-v1', st = {}; try { st = JSON.parse(localStorage.getItem(K)) || {}; } catch (e) {}
      var old = st[S.prac];
      if (!old || old.date !== ymdNow() || (daily && (old.sid !== S.sid || o.right > old.right))) st[S.prac] = { date: ymdNow(), sid: S.sid, right: o.right, total: o.total, t: Date.now() };
      else if (!daily) st[S.prac] = { date: ymdNow(), sid: S.sid, right: (old.right || 0) + o.right, total: (old.total || 0) + o.total, t: Date.now() };
      localStorage.setItem(K, JSON.stringify(st));
    } catch (e) {}
    if ($t) $t.textContent = daily ? '🎯 今日挑戰完成！' : '🧩 錯題練習完成！';
    if ($s) $s.textContent = ok >= 0.8 ? '🏅' : '';
    if ($i) $i.innerHTML = '答對 ' + o.right + ' / ' + o.total + ' 題<br>' + (ok >= 0.8 ? '👏 很棒！回到主城按 <b>📅 每日</b> 領取獎勵吧！' : '💪 再練一次更穩！回到主城按 <b>📅 每日</b> 看看獎勵。');
    var r = $('#rescue'); if (r) r.classList.add('hide');
    if (ok >= 0.8) sfx([{ f: 523, t: 0, d: 0.3, w: 'sine' }, { f: 659, t: 0.12, d: 0.3, w: 'sine' }, { f: 784, t: 0.24, d: 0.5, w: 'sine' }]);
    post({ type: 'practice-result', kind: S.prac, id: S.sid, right: o.right, total: o.total });
  }

  function refresh() {
    var box = $('#modes'), panel = $('#ms-panel');
    if (!panel) return;
    if (S.flag) {
      if (box) box.style.display = 'none';
      var tr = S.orig ? S.orig.real : 15, th = S.orig ? S.orig.hard : 10;
      var locked = S.stars < CFG.ENDLESS_NEED;
      panel.innerHTML = '<b>♾️ 無極限挑戰</b><br>' +
        (locked
          ? '🔒 這一關要先拿到 ' + CFG.ENDLESS_NEED + ' ⭐ 才能挑戰（目前 ' + S.stars + ' ⭐）。'
          : '題目源源不絕，答錯或超時扣一顆心，5 顆心用完就結束。每題時間會從實戰速度（' + tr + ' 秒）慢慢縮短到修羅速度（' + th + ' 秒）。<br>🏆 目前最高紀錄：<b>' + S.best + '</b> 題');
      var go = $('#go'); if (go) go.disabled = locked;
      return;
    }
    panel.innerHTML = '<b>本關目前最高 ' + starStr(S.stars) + '</b><br>' +
      '三種模式都可以直接選，差別是最高能拿的星數不同。<b>點下去就直接開打！</b><br>' +
      '<small>🧑‍🏫 練兵模式裡有「老師教我」：老師示範一題、你再做類似題（用了之後這一局最多 ' + CFG.TAUGHT_MAX + ' ⭐）。</small>';
    if (!box) return;
    Array.prototype.forEach.call(box.querySelectorAll('.mode'), function (b) {
      var m = b.dataset.m, r = lockMsg(m);
      b.classList.toggle('ms-locked', !!r);
      var tag = b.querySelector('.ms-rule');
      if (!tag) { tag = document.createElement('small'); tag.className = 'ms-rule'; b.appendChild(tag); }
      tag.textContent = r ? '🔒 ' + r : RULE[m];
      var bt = b.querySelector('b');
      if (bt) { if (!bt.dataset.o) bt.dataset.o = bt.textContent; bt.textContent = (r ? '🔒 ' : '') + bt.dataset.o; }
    });
  }

  /* ------------------------------------------------------------------
     🧑‍🏫 老師教我（練兵專用）
     流程：說明會少拿星 → 老師用「同題型的另一題」示範（題目→想法→一步一步算→答案）
           → 換學生做一題類似題（取代目前這一題）
     ------------------------------------------------------------------ */
  function qInner() { // 這個關卡是用 innerHTML 還是 textContent 顯示題目（有圖的關卡才用 innerHTML）
    return Array.prototype.some.call(document.scripts, function (s) { return /\('#qt'\)\.innerHTML\s*=/.test(s.textContent); });
  }
  function stripTags(h) { var d = document.createElement('div'); d.innerHTML = h; return d.textContent; }
  function explainSteps(html) {
    var out = [];
    String(html || '').split(/<br\s*\/?>/i).forEach(function (part) {
      part.split(/(?<=[；。])/).forEach(function (s) { if (stripTags(s).trim()) out.push(s.trim()); });
    });
    return out;
  }
  // 找「同題型、而且長得像」的另一題：先比文字裡的中文（同一種問法中文相同），找不到就隨便挑一題同題型
  function sig(x) { return String(x.text || '').replace(/<[^>]*>/g, '').replace(/[^\u4e00-\u9fff]/g, ''); }
  function similar(type, ref, avoid) {
    var best = null, k;
    for (k = 0; k < 30; k++) {
      var c = Object.assign(gen(type), { type: type });
      if (c.text === ref.text || c.text === avoid.text) continue;
      if (!best) best = c;
      if (sig(c) === sig(ref)) return c;
    }
    return best || Object.assign(gen(type), { type: type });
  }
  function teachOpen() {
    if (typeof q === 'undefined' || !q || typeof gen !== 'function' || typeof lock === 'undefined' || lock) return;
    var type = q.type, d = null, t = 0;
    d = similar(type, q, q);
    var inner = qInner();
    var steps = [];
    if (d.hint) steps.push({ say: '💡 先想一下：' + esc(d.hint), show: 'q' });
    explainSteps(d.explain).forEach(function (h) { steps.push({ say: h, show: 'q' }); });
    steps.push({ say: '所以答案是 <b>' + esc(d.ans) + '</b>！換你囉～老師再出一題<b>類似的</b>給你做。', show: 'ans', last: true });

    var ov = document.createElement('div'); ov.id = 'ms-teach-ov';
    var box = document.createElement('div'); box.className = 'box'; ov.appendChild(box);
    box.innerHTML =
      '<div class="ms-thead">🧑‍🏫 老師教我</div>' +
      '<div id="ms-t0"><div class="ms-bubble" style="margin:6px 0">用了「老師教我」之後，<b>這一局練兵最多拿 ' + CFG.TAUGHT_MAX + ' ⭐</b>（想拿 3 ⭐ 的話，請不要用）。<br>要讓老師示範嗎？</div>' +
      '<div class="ms-ctl"><button class="btn ghost" id="ms-tno">不用了</button><button class="btn" id="ms-tyes">🐱 好，請老師教我</button></div></div>' +
      '<div id="ms-t1" class="hide"><div class="ms-tstage"><div class="ms-cat talk" id="ms-tcat"><span class="cap">🎓</span><span class="face">🐱</span><small>老師</small></div>' +
      '<div class="ms-bubble" id="ms-tbub"></div></div>' +
      '<div class="ms-tq hide" id="ms-tq"><div class="qt" id="ms-tqt"></div><div class="ms-topts" id="ms-topts"></div></div>' +
      '<div class="ms-ctl"><button class="btn ghost" id="ms-tcancel">取消</button><button class="btn" id="ms-tnext2">下一步 ▶</button></div></div>';
    document.body.appendChild(ov);
    var i = 0, $b = function (s) { return box.querySelector(s); };
    function close() { ov.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    $b('#ms-tno').onclick = close; $b('#ms-tcancel').onclick = close;
    $b('#ms-tyes').onclick = function () {
      S.taught++; updateBadge();
      $b('#ms-t0').classList.add('hide'); $b('#ms-t1').classList.remove('hide');
      $b('#ms-tqt').innerHTML = inner ? d.text + (d.svg || '') : esc(d.text);
      $b('#ms-topts').innerHTML = d.options.map(function (v) { return '<span data-v="' + esc(String(v)) + '">' + esc(String(v)) + '</span>'; }).join('');
      go();
    };
    function go() {
      var s = steps[i], bub = $b('#ms-tbub'), cat = $b('#ms-tcat');
      bub.style.animation = 'none'; void bub.offsetWidth; bub.style.animation = '';
      bub.innerHTML = s.say;
      $b('#ms-tq').classList.toggle('hide', s.show === 'none');
      Array.prototype.forEach.call($b('#ms-topts').children, function (sp) {
        var ok = sp.dataset.v === String(d.ans);
        sp.classList.toggle('right', s.show === 'ans' && ok);
        sp.classList.toggle('dim', s.show === 'ans' && !ok);
      });
      cat.classList.add('talk'); if (!REDUCE) setTimeout(function () { cat.classList.remove('talk'); }, 900); else cat.classList.remove('talk');
      $b('#ms-tnext2').textContent = s.last ? '✏️ 換我做類似題！' : '下一步 ▶';
    }
    $b('#ms-tnext2').onclick = function () {
      if (steps[i].last) {
        close();
        var sim = similar(type, d, q);
        qs[idx - 1] = sim; idx--; next();
        var hb = $('#hintbox'); if (hb) { hb.textContent = '🧑‍🏫 老師出了一題「類似的」給你，換你試試看！'; hb.classList.remove('hide'); }
        return;
      }
      i++; go();
    };
    $b('#ms-tyes').onclick();
  }
  function updateBadge() {
    var b = $('#ms-taught'); if (!b) return;
    b.style.display = S.taught ? '' : 'none';
    b.textContent = '🧑‍🏫 用了老師教我 → 這局最多 ' + CFG.TAUGHT_MAX + ' ⭐';
  }

  /* ------------------------------------------------------------------
     🧮 練兵「一步一步化簡」（比照負數勇者教學版：去括號 → 合併同類項，每一步都由學生點、選）
     只在練兵、題目是「化簡：…」時啟動；可按「改用一般作答」略過。
     失誤 ≤ 1 次＝這題算答對；失誤 ≥ 2 次＝這題算答錯（會進錯題重練）。
     ------------------------------------------------------------------ */
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
  function stMount(ov) {
    var bl = document.querySelector('#s-game .battle-left') || document.querySelector('.battle-left');
    if (bl) bl.insertBefore(ov, bl.querySelector('#say') || null);
    else { ov.classList.add('ms-fixed'); document.body.appendChild(ov); }
  }
  function stUI(ov, getMiss) {
    var shown = {}, hintI = 0;
    var $o = function (q2) { return ov.querySelector(q2); };
    function fb(h, kind) {
      var f = $o('#st-fb'); f.className = 'st-fb' + (kind === 'hint' ? ' hint' : ''); f.innerHTML = h; f.style.display = 'block';
      f.style.animation = 'none'; void f.offsetWidth; f.style.animation = '';
    }
    function gloss(h) {
      var plain = String(h).replace(/<[^>]+>/g, ''), out = [], rest = plain;
      GLOSS.forEach(function (g) { if (rest.indexOf(g[0]) >= 0 && !shown[g[0]]) { shown[g[0]] = 1; out.push('<b>' + g[0] + '</b>：' + g[1]); rest = rest.split(g[0]).join(''); } });
      $o('#st-gl').innerHTML = out.length ? '<div class="gl">📘 名詞小卡<br>' + out.join('<br>') + '</div>' : '';
    }
    function say(h, kind) {
      if (kind) { fb(h, kind === 'hint' ? 'hint' : 'warn'); return; }
      var b = $o('#st-say'); b.innerHTML = h; $o('#st-fb').style.display = 'none'; hintI = 0; gloss(h);
    }
    function hint(list) { var l = (list || []).filter(Boolean).concat(GEN_HINTS), k = Math.min(hintI, l.length - 1); fb('💡 ' + l[k], 'hint'); hintI++; }
    function meter(n) {
      var m = $o('#st-meter'); if (!m) return; m.style.display = 'none'; return;
      m.className = 'st-meter' + (n >= 2 ? ' over' : '');
      m.textContent = n >= 2 ? '失誤 ' + n + ' 次：這題會記成「答錯」，不過把步驟做完會學得更紮實！' : '失誤 ' + n + ' 次（0～1 次算答對；2 次以上這題算答錯）';
    }
    return { say: say, hint: hint, meter: meter, fb: fb };
  }
  function stFinish(wrongCount, okEq, misses) {
    var btns = Array.prototype.slice.call(document.querySelectorAll('#opts .opt')), bad = wrongCount || !okEq;
    var pick = bad ? btns.filter(function (x) { return x.dataset.v !== q.ans; })[0] : btns.filter(function (x) { return x.dataset.v === q.ans; })[0];
    if (pick) { pick.click(); if (bad) setTimeout(function () { pick.classList.remove('bad'); }, 0); }
    if (wrongCount) setTimeout(function () {
      var e = document.getElementById('say'); if (!e) return;
      var bb = e.querySelector('b'); if (bb && /^(💥|⏰)/.test(bb.textContent)) bb.textContent = '📝 這題先記答錯，再練一次就會了！';
      var w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT), n;
      while ((n = w.nextNode())) {
        if (/正確答案是\s*$/.test(n.nodeValue)) {
          n.nodeValue = n.nodeValue.replace(/正確答案是\s*$/, '');
          var b = n.nextSibling; if (b && b.nodeType === 1 && b.tagName === 'B') { var t = b.nextSibling; b.remove(); if (t && t.nodeType === 3) t.nodeValue = t.nodeValue.replace(/^[。.]\s*/, ''); }
          break;
        }
      }
    }, 0);
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
      '<div class="ms-tstage"><div class="ms-cat talk"><span class="cap">🎓</span><span class="face">🐱</span><small>小老師</small></div><div class="ms-bubble" id="st-say" style="min-height:70px"></div></div>' +
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
      say('🎉 化簡完成！答案是 <b>' + esc(fin) + '</b>。' + (wrongCount ? '<br>🐱 步驟做對了，但失誤超過 ' + CFG.TUTOR_MISS_MAX + ' 次，這題先記答錯，之後可以再練。' : ''));
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
  /* ------------------------------------------------------------------
     🪜 練兵「一步一步解」通用版（解方程式、代入消去、加減消去、不等式、平均數、中位數、比例…）
     每一題先算出「步驟劇本」，劇本的最後答案必須和題目的標準答案一致才會啟動（否則自動不出現）。
     ------------------------------------------------------------------ */
  function Nm(v) { v = Math.round(v * 100) / 100; if (v === 0) v = 0; return String(v); }
  function isNum(s) { return /^-?\d+(\.\d+)?$/.test(String(s)); }
  function cf(c, v) { return c === 1 ? v : c === -1 ? '-' + v : c + v; }
  function sg(v) { return v < 0 ? '(' + v + ')' : String(v); }
  function eq2(a, b, c) { return cf(a, 'x') + ' ' + (b < 0 ? '-' : '+') + ' ' + cf(Math.abs(b), 'y') + ' = ' + c; }
  function cleanVal(x) {
    if (typeof x === 'number') return isFinite(x) ? Nm(x) : '';
    var t = String(x); if (isNum(t) && /\.\d{3,}/.test(t)) return Nm(parseFloat(t)); return t;
  }
  var POS = false;
  function mkOpts(ok, wr, pos) {
    if (pos === undefined) pos = POS;
    var okS = cleanVal(ok), okInt = isNum(okS) && Number(okS) === Math.round(Number(okS));
    var out = [{ t: okS, ok: true }], seen = {}; seen[okS] = 1;
    var okey = function (t) {
      if (t === '' || t === 'NaN' || /Infinity/.test(t)) return false;
      if (isNum(t)) { var nv = Number(t); if (okInt && nv !== Math.round(nv)) return false; if (pos && nv < 1) return false; }
      return true;
    };
    (wr || []).forEach(function (w) {
      var t = cleanVal(Array.isArray(w) ? w[0] : w);
      if (!seen[t] && out.length < 4 && okey(t)) { seen[t] = 1; out.push({ t: t, ok: false, why: Array.isArray(w) ? w[1] : '' }); }
    });
    if (isNum(okS)) {
      var v = parseFloat(okS), step = okInt ? 1 : 0.1;
      var alt = [[v + step, '算出來的數差一點點（多了），再檢查一下這一步的計算。'], [v - step, '算出來的數差一點點（少了），再檢查一下這一步的計算。'], [-v, '數字對了，但正負號剛好相反。'], [v + 2 * step, '算出來的數差一點，再檢查一下這一步的計算。'], [v * 2, '看起來多乘了一次，再回頭看這一步在算什麼。'], [v + 10, '差很多，再看一次這一步要算什麼。'], [v - 2 * step, '算出來的數差一點，再檢查一下這一步的計算。']];
      for (var i = 0; i < alt.length && out.length < 4; i++) { var t2 = cleanVal(alt[i][0]); if (!seen[t2] && okey(t2)) { seen[t2] = 1; out.push({ t: t2, ok: false, why: alt[i][1] }); } }
    }
    return shuffle(out);
  }
  function flipOp(op) { return { '<': '>', '>': '<', '≤': '≥', '≥': '≤' }[op]; }
  function plainText(h) { var d = document.createElement('div'); d.innerHTML = h; return d.textContent; }
  function asNum(x) { return parseFloat(String(x).replace(/[^\d.\-]/g, '')); }
  function pInt(s, dflt) { s = String(s == null ? '' : s).replace(/\s+/g, ''); if (s === '' || s === '+') return dflt; if (s === '-') return -1; return parseInt(s, 10); }

  // ---- 各題型的劇本產生器：回傳 {steps:[{say,hint,opts,line}], final} 或 null ----
  var PLANNERS = {};

  // 已知一個未知數，代入求另一個（1-1-2 solve、1-1-3 find、2-2-1 findPoint）
  function planSubKnown(eqm, kv, val, av) {
    var a = pInt(eqm[1], 1), s = eqm[2] === '-' ? -1 : 1, b = s * pInt(eqm[3], 1), c = parseInt(eqm[4], 10);
    var ck = kv === 'x' ? a : b, ca = av === 'x' ? a : b;
    if (!ca) return null;
    var t1 = ck * val, r = c - t1, steps = [];
    var eqTxt = eq2(a, b, c);
    if (ck !== 1) steps.push({
      say: '已知 <b>' + kv + ' = ' + val + '</b>，代入 <b>' + eqTxt + '</b>。<br>先算「已知的那一項」：' + ck + ' × ' + sg(val) + ' = ？',
      hint: '把數字乘起來，注意正負號：負 × 正 = 負、負 × 負 = 正。',
      opts: mkOpts(t1, [[ck + val, '這裡是「相乘」，不是相加喔。'], [-t1, '正負號弄反了。'], [ca * val, '要用 ' + kv + ' 那一項的係數 ' + ck + ' 喔。']]),
      line: cf(ca, av) + ' ' + (t1 < 0 ? '-' : '+') + ' ' + Math.abs(t1) + ' = ' + c
    });
    steps.push({
      say: (ck === 1 ? '已知 <b>' + kv + ' = ' + val + '</b>，代入 <b>' + eqTxt + '</b>，那一項就是 ' + sg(val) + '。<br>' : '') + '把已知的數移到等號右邊：<b>' + cf(ca, av) + ' = ' + c + ' − ' + sg(t1) + '</b> = ？',
      hint: '移項要變號：右邊減掉它。減去負數，等於加上它的絕對值。',
      opts: mkOpts(r, [[c + t1, '移項要「變號」，是減掉它。'], [t1 - c, '順序弄反了，是 ' + c + ' 去減。'], [c - Math.abs(t1), '要看清楚 ' + sg(t1) + ' 是正是負。']]),
      line: cf(ca, av) + ' = ' + r
    });
    var final = r / ca;
    if (ca !== 1) steps.push({
      say: '兩邊同除以 ' + sg(ca) + '：<b>' + av + ' = ' + r + ' ÷ ' + sg(ca) + '</b> = ？',
      hint: '除以係數 ' + ca + ' 就得到 ' + av + '。',
      opts: mkOpts(Nm(final), [[Nm(r * ca), '是「除以」係數，不是乘。'], [Nm(r - ca), '是「除以」係數，不是相減。'], [Nm(-final), '正負號弄反了。']]),
      line: av + ' = ' + Nm(final)
    });
    return { steps: steps, final: Nm(final) };
  }
  PLANNERS.solve = function (t) {
    var m = /已知\s*(-?\d*)x\s*([+\-])\s*(\d*)y\s*=\s*(-?\d+)，且\s*([xy])\s*=\s*(-?\d+)，求\s*([xy])/.exec(t);
    return m ? planSubKnown(m, m[5], parseInt(m[6], 10), m[7]) : null;
  };
  PLANNERS.find = function (t) {
    var m = /（即\s*(-?\d*)x\s*([+\-])\s*(\d*)y\s*=\s*(-?\d+)）/.exec(t), g = /([xy])\s*=\s*(-?\d+)\s*(?:本|個|杯|張|支|件|瓶)/.exec(t) || /([xy])=(-?\d+)/.exec(t), a = /（([xy]) 的值）/.exec(t);
    return (m && g && a) ? planSubKnown(m, g[1], parseInt(g[2], 10), a[1]) : null;
  };
  PLANNERS.findPoint = function (t) {
    var m = /直線\s*(-?\d*)x\s*([+\-])\s*(\d*)y\s*=\s*(-?\d+)\s*上/.exec(t), g = /([xy]) 坐標是\s*(-?\d+)，求這一點的\s*([xy])\s*坐標/.exec(t);
    return (m && g) ? planSubKnown(m, g[1], parseInt(g[2], 10), g[3]) : null;
  };

  // 代入消去法（1-2-2）
  PLANNERS.sub = function (t) {
    var m1 = /①\s*([xy])\s*=\s*(-?\d*)([xy])\s*(?:([+\-])\s*(\d+))?\s*(?:　|\s)*②/.exec(t), m2 = /②\s*(-?\d*)x\s*([+\-])\s*(\d*)y\s*=\s*(-?\d+)/.exec(t), ask = /求出\s*([xy])/.exec(t);
    if (!m1 || !m2 || !ask) return null;
    var v1 = m1[1], mm = pInt(m1[2], 1), v2 = m1[3], kk = m1[4] ? (m1[4] === '-' ? -1 : 1) * parseInt(m1[5], 10) : 0;
    if (v1 === v2) return null;
    var a = pInt(m2[1], 1), b = (m2[2] === '-' ? -1 : 1) * pInt(m2[3], 1), e = parseInt(m2[4], 10);
    var c1 = v1 === 'x' ? a : b, c2 = v1 === 'x' ? b : a;
    var A = c1 * mm + c2, B = c1 * kk;
    if (!A) return null;
    var lin = function (mmm, kkk) { return cf(mmm, v2) + (kkk ? ' ' + (kkk < 0 ? '-' : '+') + ' ' + Math.abs(kkk) : ''); };
    var build = function (rep1, rep2) { // 依 ② 原本的順序（x 項在前）組出式子
      var tx = v1 === 'x' ? rep1 : rep2, ty = v1 === 'x' ? rep2 : rep1;
      return tx + ' ' + (b < 0 && v1 !== 'y' ? '+' : '+') + ' ' + ty + ' = ' + e;
    };
    var termOf = function (coef, inner) { // 係數 coef 乘上括號 inner
      if (coef === 1) return '(' + inner + ')'; if (coef === -1) return '-(' + inner + ')'; return coef + '(' + inner + ')';
    };
    var plain = function (coef, v) { return cf(coef, v); };
    var fmt = function (s) { return s.replace(/\+ -/g, '- '); };
    var good = fmt(build(termOf(c1, lin(mm, kk)), plain(c2, v2)));
    var w1 = fmt(build(termOf(c1, lin(mm, -kk)), plain(c2, v2)));
    var w2 = fmt(build(plain(c1, v1), termOf(c2, lin(mm, kk))));
    var w3 = fmt(build('(' + lin(mm, kk) + ')', plain(c2, v2)));
    var steps = [];
    steps.push({
      say: '把 ① 的 <b>' + v1 + ' = ' + lin(mm, kk) + '</b> 代進 ② 裡面的 <b>' + v1 + '</b>。代入後的式子是哪一個？',
      hint: '② 裡的 ' + v1 + ' 要整個換成「' + lin(mm, kk) + '」，而且要加括號、保留 ' + v1 + ' 前面的係數。',
      opts: mkOpts(good, [[w1, '① 裡面的符號要照抄，不能變。'], [w2, '要代進 ' + v1 + '，不是代進另一個未知數。'], [w3, '別忘了 ' + v1 + ' 前面的係數也要乘進去。']]),
      line: good
    });
    var step2 = cf(A, v2) + (B ? ' ' + (B < 0 ? '-' : '+') + ' ' + Math.abs(B) : '') + ' = ' + e;
    var cands2 = [
      [cf(c1 * mm - c2, v2) + (B ? ' ' + (B < 0 ? '-' : '+') + ' ' + Math.abs(B) : '') + ' = ' + e, '同類項要「相加」，連同正負號一起算。'],
      [cf(A, v2) + (B ? ' ' + (B < 0 ? '+' : '-') + ' ' + Math.abs(B) : '') + ' = ' + e, '括號展開時，常數也要乘上係數 ' + c1 + '，符號跟著算。'],
      [cf(A, v2) + (kk ? ' ' + (kk < 0 ? '-' : '+') + ' ' + Math.abs(kk) : '') + ' = ' + e, '常數項也要乘上括號外的係數 ' + c1 + '（分配律）。']
    ];
    steps.push({
      say: '展開括號、合併同類項，會變成哪一個？',
      hint: '先用分配律把 ' + c1 + ' 乘進括號，再把 ' + v2 + ' 的係數相加。',
      opts: mkOpts(fmt(step2), cands2.map(function (x) { return [fmt(x[0]), x[1]]; })),
      line: fmt(step2)
    });
    var val2 = (e - B) / A;
    if (Math.round(val2) !== val2) return null;
    steps.push({
      say: '移項後兩邊同除以 ' + sg(A) + '：<b>' + v2 + ' = (' + e + ' − ' + sg(B) + ') ÷ ' + sg(A) + '</b> = ？',
      hint: '先把常數移到右邊，再除以 ' + v2 + ' 的係數。',
      opts: mkOpts(val2, [[(e + B) / A, '常數移項要變號。'], [e - B, '最後還要除以係數 ' + A + '。'], [-val2, '正負號弄反了。']]),
      line: v2 + ' = ' + val2
    });
    var final = val2;
    if (ask[1] === v1) {
      final = mm * val2 + kk;
      steps.push({
        say: '求出 ' + v2 + ' = ' + val2 + ' 了！再代回 ① 求 ' + v1 + '：<b>' + v1 + ' = ' + lin(mm, kk) + '</b>，把 ' + v2 + ' 換成 ' + sg(val2) + '，' + v1 + ' = ？',
        hint: '把 ' + val2 + ' 放進 ① 的式子，照順序算。',
        opts: mkOpts(final, [[mm + val2 + kk, '係數是「相乘」，不是相加。'], [mm * val2 - kk, '常數項的正負號要照抄。'], [-final, '正負號弄反了。']]),
        line: v1 + ' = ' + final
      });
    }
    return { steps: steps, final: String(final) };
  };

  // 加減消去法（1-2-3，只處理整數係數）
  PLANNERS.elim = function (t) {
    var m1 = /①\s*(-?\d*)x\s*([+\-])\s*(\d*)y\s*=\s*(-?\d+)/.exec(t), m2 = /②\s*(-?\d*)x\s*([+\-])\s*(\d*)y\s*=\s*(-?\d+)/.exec(t), ask = /求出\s*([xy])/.exec(t);
    if (!m1 || !m2 || !ask) return null;
    var a1 = pInt(m1[1], 1), b1 = (m1[2] === '-' ? -1 : 1) * pInt(m1[3], 1), e1 = parseInt(m1[4], 10);
    var a2 = pInt(m2[1], 1), b2 = (m2[2] === '-' ? -1 : 1) * pInt(m2[3], 1), e2 = parseInt(m2[4], 10);
    var ev, keep, c1, c2, k1, k2;
    if (Math.abs(b1) === Math.abs(b2)) { ev = 'y'; keep = 'x'; c1 = b1; c2 = b2; k1 = a1; k2 = a2; }
    else if (Math.abs(a1) === Math.abs(a2)) { ev = 'x'; keep = 'y'; c1 = a1; c2 = a2; k1 = b1; k2 = b2; }
    else return null;
    var add = (c1 === -c2), op = add ? '①＋②' : '①－②', other = add ? '①－②' : '①＋②';
    var K = add ? k1 + k2 : k1 - k2, E = add ? e1 + e2 : e1 - e2;
    if (!K) return null;
    var steps = [];
    steps.push({
      say: '我們要先消去 <b>' + ev + '</b>。① 的 ' + ev + ' 係數是 ' + c1 + '，② 的是 ' + c2 + '，要用哪個動作才能讓 ' + ev + ' 不見？',
      hint: add ? '係數一正一負（互為相反數），兩式「相加」就會變 0。' : '係數一樣（同號同數），兩式「相減」就會變 0。',
      opts: mkOpts(op, [[other, add ? '相減會變成 ' + (2 * c1) + ev + '，消不掉。' : '相加會變成 ' + (2 * c1) + ev + '，消不掉。'], ['①×②', '加減消去法是「相加」或「相減」，不是相乘。'], ['把①代入②', '這一題要用的是加減消去法。']]),
      line: op + '：消去 ' + ev
    });
    var left = cf(K, keep) + ' = ' + E;
    steps.push({
      say: op + '，式子會變成哪一個？（左邊的 ' + ev + ' 已經消掉了）',
      hint: '左邊：' + keep + ' 的係數 ' + (add ? '相加' : '相減') + '；右邊：等號右邊的數 ' + (add ? '相加' : '相減') + '。',
      opts: mkOpts(left, [[cf(add ? k1 - k2 : k1 + k2, keep) + ' = ' + E, '要用 ' + op + '，係數也要照這個動作算。'], [cf(K, keep) + ' = ' + (add ? e1 - e2 : e1 + e2), '右邊也要用同一個動作。'], [cf(-K, keep) + ' = ' + E, '正負號弄反了。']]),
      line: left
    });
    var kv = E / K;
    if (Math.round(kv) !== kv) return null;
    steps.push({
      say: '解出 <b>' + keep + ' = ' + E + ' ÷ ' + sg(K) + '</b> = ？',
      hint: '兩邊同除以 ' + keep + ' 的係數。',
      opts: mkOpts(kv, [[E * K, '是「除以」係數喔。'], [-kv, '正負號弄反了。'], [E - K, '是「除以」係數，不是相減。']]),
      line: keep + ' = ' + kv
    });
    var final = kv;
    if (ask[1] === ev) {
      var ka = keep === 'x' ? a1 : b1, ca = ev === 'x' ? a1 : b1;
      var r = (e1 - ka * kv) / ca; final = r;
      if (Math.round(r) !== r) return null;
      steps.push({
        say: '把 ' + keep + ' = ' + kv + ' 代回 ①，求 ' + ev + '：<b>' + cf(ca, ev) + ' = ' + sg(e1) + ' − ' + sg(ka) + ' × ' + sg(kv) + '</b>，再除以 ' + sg(ca) + '，' + ev + ' = ？',
        hint: '先算 ' + ka + ' × ' + sg(kv) + '，移項後再除以 ' + ev + ' 的係數。',
        opts: mkOpts(r, [[(e1 + ka * kv) / ca, '移項要變號。'], [e1 - ka * kv, '最後還要除以 ' + ev + ' 的係數。'], [-r, '正負號弄反了。']]),
        line: ev + ' = ' + r
      });
    }
    return { steps: steps, final: String(final) };
  };

  // 不等式（4-2-1 solveFlip、4-2-2 oneStep / twoSided / distribute）
  function planIneq(a, b, op, c, d, pre) { // a x + b  op  c x + d
    var steps = [], A = a - c, B = d - b;
    if (!A) return null;
    if (pre) steps.push(pre);
    if (c !== 0) steps.push({
      say: '把含 x 的項都移到左邊，合併後 x 前面的數字會變成多少？<br><b>' + cf(a, 'x') + ' − ' + cf(c, 'x') + '</b> = ？',
      hint: '移項要變號：右邊的 ' + cf(c, 'x') + ' 移到左邊，變成減。',
      opts: mkOpts(A, [[a + c, '移項要變號，是「減掉」。'], [c - a, '順序弄反了，是 ' + a + ' 去減 ' + c + '。'], [-A, '正負號弄反了。']]),
      line: cf(A, 'x') + (b ? ' ' + (b < 0 ? '-' : '+') + ' ' + Math.abs(b) : '') + ' ' + op + ' ' + d
    });
    if (b !== 0) steps.push({
      say: '把常數移到右邊：<b>' + d + ' − ' + sg(b) + '</b> = ？',
      hint: '常數項移項要變號。',
      opts: mkOpts(B, [[d + b, '移項要變號，是「減掉」。'], [b - d, '順序弄反了。'], [-B, '正負號弄反了。']]),
      line: cf(A, 'x') + ' ' + op + ' ' + B
    });
    var nop = op;
    if (A < 0) {
      nop = flipOp(op);
      var wrongs = ['<', '>', '≤', '≥'].filter(function (x) { return x !== nop; }).map(function (x) { return [x, x === op ? '兩邊同除以「負數」，不等號方向要翻轉！' : '有沒有「等號」不會變，只有方向會翻轉。']; });
      steps.push({
        say: '兩邊要同除以 ' + A + '（負數）。不等號 <b>' + op + '</b> 要變成什麼？',
        hint: '同乘或同除「負數」，不等號方向要翻轉；有沒有等號不變。',
        opts: mkOpts(nop, wrongs), line: '(除以負數，翻轉) ' + nop
      });
    }
    var v = B / A;
    if (A === 1) { if (!steps.length) return null; return { steps: steps, final: 'x ' + op + ' ' + Nm(B) }; }
    steps.push({
      say: '兩邊同除以 ' + sg(A) + '：<b>x ' + nop + ' ' + B + ' ÷ ' + sg(A) + '</b> = ？',
      hint: '除以 ' + A + ' 就得到 x。',
      opts: mkOpts(Nm(v), [[Nm(B * A), '是「除以」係數。'], [Nm(-v), '正負號弄反了。'], [Nm(B - A), '是「除以」係數，不是相減。']]),
      line: 'x ' + nop + ' ' + Nm(v)
    });
    return { steps: steps, final: 'x ' + nop + ' ' + Nm(v) };
  }
  PLANNERS.solveFlip = function (t) {
    var m = /(-?\d+)x\s*([<>≤≥])\s*(-?\d+)/.exec(t); if (!m) return null;
    var a = parseInt(m[1], 10), op = m[2], c = parseInt(m[3], 10);
    return planIneq(a, 0, op, 0, c, {
      say: '不等式 <b>' + a + 'x ' + op + ' ' + c + '</b>：要讓 x 單獨一個，兩邊同除以多少？',
      hint: 'x 前面的係數是多少，就同除以多少（連正負號）。',
      opts: mkOpts(a, [[-a, '要除的是「係數」本身，含正負號。'], [c, '要除的是 x 前面的數。'], [-c, '要除的是 x 前面的數。']]),
      line: '兩邊同除以 ' + a
    });
  };
  PLANNERS.oneStep = function (t) {
    var m = /：\s*(-?\d*)x\s*([+\-])\s*(\d+)\s*([<>≤≥])\s*(-?\d+)/.exec(t); if (!m) return null;
    return planIneq(pInt(m[1], 1), (m[2] === '-' ? -1 : 1) * parseInt(m[3], 10), m[4], 0, parseInt(m[5], 10));
  };
  PLANNERS.twoSided = function (t) {
    var m = /：\s*(-?\d*)x\s*([+\-])\s*(\d+)\s*([<>≤≥])\s*(-?\d*)x\s*([+\-])\s*(\d+)/.exec(t); if (!m) return null;
    return planIneq(pInt(m[1], 1), (m[2] === '-' ? -1 : 1) * parseInt(m[3], 10), m[4], pInt(m[5], 1), (m[6] === '-' ? -1 : 1) * parseInt(m[7], 10));
  };
  PLANNERS.distribute = function (t) {
    var m = /：\s*(-?\d+)\(x\s*([+\-])\s*(\d+)\)\s*([<>≤≥])\s*(-?\d+)/.exec(t); if (!m) return null;
    var k = parseInt(m[1], 10), s = (m[2] === '-' ? -1 : 1) * parseInt(m[3], 10), op = m[4], r = parseInt(m[5], 10), b = k * s;
    var str = function (kk, bb) { return cf(kk, 'x') + (bb ? ' ' + (bb < 0 ? '-' : '+') + ' ' + Math.abs(bb) : '') + ' ' + op + ' ' + r; };
    return planIneq(k, b, op, 0, r, {
      say: '先用分配律把括號展開：<b>' + k + '(x ' + (s < 0 ? '-' : '+') + ' ' + Math.abs(s) + ')</b> 會變成？',
      hint: '括號外的 ' + k + ' 要乘到括號裡「每一項」。',
      opts: mkOpts(str(k, b), [[str(k, s), '常數項 ' + s + ' 也要乘上 ' + k + '。'], [str(k, -b), '常數項的正負號要跟著算。'], [str(1, b), '括號外的 ' + k + ' 也要乘 x。']]),
      line: str(k, b)
    });
  };

  // 平均數（5-1-2）
  PLANNERS.computeMean = function (t) {
    var m = /分數：([\d,\s]+)，請問平均/.exec(t); if (!m) return null;
    var xs = m[1].split(',').map(function (x) { return parseInt(x, 10); }), sum = xs.reduce(function (a, b) { return a + b; }, 0), n = xs.length, mean = sum / n;
    return {
      steps: [
        { say: '平均數＝總和 ÷ 個數。先把分數全部加起來：<b>' + xs.join(' + ') + '</b> = ？', hint: '一個一個慢慢加。', opts: mkOpts(sum, [[sum + 10, '再加一次看看。'], [sum - 10, '再加一次看看。'], [Math.round(mean), '這是平均，還沒到這一步。']]), line: '總和 = ' + sum },
        { say: '一共有 ' + n + ' 個分數：平均 = ' + sum + ' ÷ ' + n + ' = ？（四捨五入到小數第 2 位）', hint: '總和除以個數。', opts: mkOpts(Nm(mean), [[Nm(sum * n), '是「除以」個數。'], [Nm(sum / (n + 1)), '個數是 ' + n + ' 個。'], [Nm(sum / (n - 1)), '個數是 ' + n + ' 個。']]), line: '平均 = ' + Nm(mean) }
      ], final: Nm(mean)
    };
  };
  PLANNERS.targetScore = function (t) {
    var m = /前 (\d+) 次小考分數：([\d,\s]+)，如果要讓 (\d+) 次的總平均達到 (\d+) 分/.exec(t); if (!m) return null;
    var xs = m[2].split(',').map(function (x) { return parseInt(x, 10); }), n2 = +m[3], avg = +m[4], tot = avg * n2, kn = xs.reduce(function (a, b) { return a + b; }, 0), need = tot - kn;
    return {
      steps: [
        { say: '想要 ' + n2 + ' 次平均 ' + avg + ' 分，這 ' + n2 + ' 次的<b>總分</b>要是多少？ ' + avg + ' × ' + n2 + ' = ？', hint: '平均 × 次數 = 總分。', opts: mkOpts(tot, [[tot + n2, '是「相乘」。'], [avg + n2, '是「相乘」。'], [tot - avg, '再算一次。']]), line: n2 + ' 次總分要 ' + tot },
        { say: '前面已經考的分數加起來：<b>' + xs.join(' + ') + '</b> = ？', hint: '一個一個慢慢加。', opts: mkOpts(kn, [[kn + 10, '再加一次看看。'], [kn - 10, '再加一次看看。']]), line: '已經有 ' + kn + ' 分' },
        { say: '還差多少分？ ' + tot + ' − ' + kn + ' = ？', hint: '總分目標 減 已經有的分數。', opts: mkOpts(need, [[tot + kn, '是「相減」。'], [kn - tot, '順序弄反了。']]), line: '最後一次要考 ' + need }
      ], final: String(need)
    };
  };
  PLANNERS.missingScore = function (t) {
    var m = /(\d+) 個分數：([^，]+)，已知平均是 (\d+) 分，求 x/.exec(t); if (!m) return null;
    var n = +m[1], parts = m[2].split(',').map(function (s) { return s.trim(); }), avg = +m[3];
    var known = parts.filter(function (s) { return s !== 'x'; }).map(Number), kn = known.reduce(function (a, b) { return a + b; }, 0), tot = avg * n, x = tot - kn;
    if (parts.length !== n || known.length !== n - 1) return null;
    return {
      steps: [
        { say: n + ' 個分數平均 ' + avg + ' 分，<b>總和</b>是多少？ ' + avg + ' × ' + n + ' = ？', hint: '平均 × 個數 = 總和。', opts: mkOpts(tot, [[tot + n, '是「相乘」。'], [avg + n, '是「相乘」。'], [tot - avg, '再算一次。']]), line: '總和 = ' + tot },
        { say: '已知的分數加起來：<b>' + known.join(' + ') + '</b> = ？', hint: '只加已經知道的那幾個。', opts: mkOpts(kn, [[kn + 10, '再加一次看看。'], [kn - 10, '再加一次看看。']]), line: '已知的和 = ' + kn },
        { say: 'x = 總和 − 已知的和 = ' + tot + ' − ' + kn + ' = ？', hint: '總和減掉已知的。', opts: mkOpts(x, [[tot + kn, '是「相減」。'], [kn - tot, '順序弄反了。']]), line: 'x = ' + x }
      ], final: String(x)
    };
  };
  // 中位數（5-1-3）
  PLANNERS.findMedian = function (t) {
    var m = /\[([\d,\s]+)\]/.exec(t); if (!m) return null;
    var xs = m[1].split(',').map(function (x) { return parseInt(x, 10); }), s = xs.slice().sort(function (a, b) { return a - b; }), n = s.length;
    var med = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2, steps = [];
    var sw = s.slice(); if (n > 2) { var i = 0; while (i < n - 1 && sw[i] === sw[i + 1]) i++; var tmp = sw[i]; sw[i] = sw[i + 1]; sw[i + 1] = tmp; }
    steps.push({ say: '找中位數，第一步：先把資料<b>由小到大排好</b>。<br>' + xs.join(', '), hint: '從最小的開始，一個一個排。', opts: mkOpts(s.join(', '), [[xs.join(', '), '還沒排序喔！'], [s.slice().reverse().join(', '), '要由「小到大」。'], [sw.join(', '), '有兩個數的順序放錯了。']]), line: '排序：' + s.join(', ') });
    var pos = n % 2 ? '第 ' + (n + 1) / 2 + ' 個' : '第 ' + n / 2 + '、第 ' + (n / 2 + 1) + ' 個的平均';
    var wr = n % 2 ? ['第 ' + (n - 1) / 2 + ' 個', '第 ' + n + ' 個', '第 1 個'] : ['第 ' + n / 2 + ' 個', '第 ' + (n / 2 + 1) + ' 個', '第 ' + n + ' 個'];
    steps.push({ say: '一共 ' + n + ' 個數（' + (n % 2 ? '奇數' : '偶數') + '個），中位數是哪個位置？', hint: n % 2 ? '奇數個：正中間那一個。' : '偶數個：中間兩個的平均。', opts: mkOpts(pos, wr.map(function (x) { return [x, n % 2 ? '奇數個要找正中間那一個。' : '偶數個要取中間「兩個」的平均。']; })), line: '位置：' + pos });
    steps.push({ say: '所以中位數是？', hint: '照剛剛的位置，在排好的數列裡找。', opts: mkOpts(Nm(med), [[Nm(s[0]), '要去中間找。'], [Nm(s[n - 1]), '要去中間找。']]), line: '中位數 = ' + Nm(med) });
    return { steps: steps, final: Nm(med) };
  };

  // 比例（3-1-3 / 3-2-3）
  PLANNERS.distribute_ratio = null;
  PLANNERS.findMissing = function (t) {
    var m = /(\d+) 分鐘可以走 (\d+) 公里。用同樣的速度，(\d+) 分鐘可以走幾公里/.exec(t); if (!m) return null;
    var a = +m[1], b = +m[2], c = +m[3], prod = b * c, x = prod / a;
    return {
      steps: [
        { say: '比例 ' + a + ' : ' + b + ' = ' + c + ' : x，用<b>交叉相乘</b>：' + a + ' × x = ' + b + ' × ' + c + '。先算右邊 ' + b + ' × ' + c + ' = ？', hint: '外項乘外項、內項乘內項。', opts: mkOpts(prod, [[b + c, '是「相乘」。'], [a * c, '右邊是 ' + b + ' 乘 ' + c + '。']]), line: a + 'x = ' + prod },
        { say: x === Math.round(x) ? '兩邊同除以 ' + a + '：x = ' + prod + ' ÷ ' + a + ' = ？' : 'x = ' + prod + ' ÷ ' + a + ' = ？', hint: '兩邊同除以 x 前面的數。', opts: mkOpts(Nm(x), [[Nm(prod * a), '是「除以」。'], [Nm(prod - a), '是「除以」。']]), line: 'x = ' + Nm(x) }
      ], final: Nm(x)
    };
  };
  PLANNERS.apply = function (t) {
    var m = /y 與 x 成(正比|反比)，已知 x=(\d+) 時 y=(\d+)，求 x=(\d+) 時 y 是多少/.exec(t); if (!m) return null;
    var pro = m[1] === '正比', x1 = +m[2], y1 = +m[3], x2 = +m[4], k = pro ? y1 / x1 : x1 * y1, y2 = pro ? k * x2 : k / x2;
    return {
      steps: [
        { say: pro ? '成<b>正比</b>：y = kx，所以 k = y ÷ x = ' + y1 + ' ÷ ' + x1 + ' = ？' : '成<b>反比</b>：xy = k，所以 k = x × y = ' + x1 + ' × ' + y1 + ' = ？', hint: pro ? '正比：y ÷ x 固定。' : '反比：x × y 固定。', opts: mkOpts(Nm(k), [[Nm(pro ? x1 * y1 : y1 / x1), pro ? '正比是用 y ÷ x。' : '反比是用 x × y。'], [Nm(x1 + y1), '不是相加。']]), line: 'k = ' + Nm(k) },
        { say: pro ? 'y = k × x = ' + Nm(k) + ' × ' + x2 + ' = ？' : 'y = k ÷ x = ' + Nm(k) + ' ÷ ' + x2 + ' = ？', hint: pro ? '正比：y = kx。' : '反比：y = k ÷ x。', opts: mkOpts(Nm(y2), [[Nm(pro ? k / x2 : k * x2), pro ? '正比是「乘」。' : '反比是「除」。'], [Nm(k + x2), '不是相加。']]), line: 'y = ' + Nm(y2) }
      ], final: Nm(y2)
    };
  };

  // 與座標軸的交點、點是否在線上（2-2-1）
  function planIntercept(t, axis) {
    var m = /方程式是\s*(-?\d*)x\s*([+\-])\s*(\d*)y\s*=\s*(-?\d+)/.exec(t); if (!m) return null;
    var a = pInt(m[1], 1), b = (m[2] === '-' ? -1 : 1) * pInt(m[3], 1), c = parseInt(m[4], 10), v = axis === 'x' ? 'x' : 'y', zero = axis === 'x' ? 'y' : 'x', cv = axis === 'x' ? a : b;
    if (!cv) return null;
    var val = c / cv; if (Math.round(val) !== val) return null;
    var simp = cf(cv, v) + ' = ' + c;
    return {
      steps: [
        { say: '交點在 ' + axis + ' 軸上，所以 <b>' + zero + ' = 0</b>。把 ' + zero + ' = 0 代進方程式，會變成哪一個？', hint: '含 ' + zero + ' 的那一項，乘 0 就消失了。', opts: mkOpts(simp, [[eq2(a, b, c), '要把 ' + zero + ' 換成 0。'], [cf(cv, v) + ' + 0 = ' + (c + 1), '等號右邊的數不會變。'], [cf(cv === a ? b : a, v) + ' = ' + c, '要留下的是 ' + v + ' 那一項。']]), line: simp },
        { say: '兩邊同除以 ' + sg(cv) + '：' + v + ' = ' + c + ' ÷ ' + sg(cv) + ' = ？', hint: '除以係數。', opts: mkOpts(val, [[c * cv, '是「除以」。'], [-val, '正負號弄反了。']]), line: v + ' = ' + val }
      ], final: axis === 'x' ? '(' + val + ', 0)' : '(0, ' + val + ')'
    };
  }
  PLANNERS.xIntercept = function (t) { return planIntercept(t, 'x'); };
  PLANNERS.yIntercept = function (t) { return planIntercept(t, 'y'); };
  PLANNERS.onLine = function (t) {
    var m = /點 [A-Z] \((-?\d+), (-?\d+)\) 是否在直線 (-?\d*)x\s*([+\-])\s*(\d*)y\s*=\s*(-?\d+) 上/.exec(t); if (!m) return null;
    var px = +m[1], py = +m[2], a = pInt(m[3], 1), b = (m[4] === '-' ? -1 : 1) * pInt(m[5], 1), c = +m[6], ax = a * px, by = b * py, tot = ax + by, on = tot === c;
    var dec = function (isOn, total) { return isOn ? '總和是 ' + total + '，等於 ' + c + '，在直線上' : '總和是 ' + total + '，不等於 ' + c + '，不在直線上'; };
    return {
      steps: [
        { say: '把 x = ' + sg(px) + ' 代進去：' + a + ' × ' + sg(px) + ' = ？', hint: '注意正負號。', opts: mkOpts(ax, [[-ax, '正負號弄反了。'], [a + px, '是「相乘」。']]), line: a + 'x = ' + ax },
        { say: '再把 y = ' + sg(py) + ' 代進去：' + b + ' × ' + sg(py) + ' = ？', hint: '注意正負號。', opts: mkOpts(by, [[-by, '正負號弄反了。'], [b + py, '是「相乘」。']]), line: b + 'y = ' + by },
        { say: '兩個加起來：' + sg(ax) + ' + ' + sg(by) + ' = ' + tot + '。和等號右邊的 ' + c + ' 比一比，結論是？', hint: '左邊算出來等於右邊，才在直線上。', opts: mkOpts(dec(on, tot), [[dec(!on, tot), '看清楚 ' + tot + ' 和 ' + c + ' 一不一樣。'], [dec(on, tot + 1), '總和算錯了。'], [dec(!on, tot + 1), '總和算錯了。']]), line: dec(on, tot) }
      ], final: on ? '是，在直線上' : '不是，不在直線上'
    };
  };

  // 比例分配（3-1-3 distribute）
  PLANNERS.distribute = (function (old) {
    return function (t) {
      var m = /把 (\d+) 顆.*?依照 ([^=]+?) = ([\d:]+) 的比例分給 [^，]+，請問 (\S+) 分到幾顆/.exec(t);
      if (!m) return old(t);
      var total = +m[1], names = m[2].trim().split(':'), parts = m[3].split(':').map(Number), who = names.indexOf(m[4]);
      if (who < 0 || names.length !== parts.length) return null;
      var sum = parts.reduce(function (a, b) { return a + b; }, 0), each = total / sum, mine = parts[who] * each;
      if (Math.round(each) !== each) return null;
      return {
        steps: [
          { say: '比例 ' + parts.join(':') + '，全部共有幾「份」？ ' + parts.join(' + ') + ' = ？', hint: '把每一份加起來。', opts: mkOpts(sum, [[parts.reduce(function (a, b) { return a * b; }, 1), '是「相加」。'], [sum + 1, '再加一次。']]), line: '共 ' + sum + ' 份' },
          { say: total + ' 顆分成 ' + sum + ' 份，每 1 份是幾顆？ ' + total + ' ÷ ' + sum + ' = ？', hint: '總數 ÷ 總份數。', opts: mkOpts(each, [[total * sum, '是「除以」。'], [total - sum, '是「除以」。']]), line: '每份 ' + each + ' 顆' },
          { say: m[4] + ' 佔 ' + parts[who] + ' 份：' + parts[who] + ' × ' + each + ' = ？', hint: '份數 × 每份的顆數。', opts: mkOpts(mine, [[parts[who] + each, '是「相乘」。'], [each, '要乘上自己有幾份。']]), line: m[4] + ' = ' + mine + ' 顆' }
        ], final: String(mine)
      };
    };
  })(PLANNERS.distribute);

  // 預算不等式（4-2-3）
  PLANNERS.budgetMax = function (t) {
    var m = /買 x [^，]*，每[^\d]*(\d+) 元，另外還要付[^\d]*(\d+) 元，總花費不超過 (\d+) 元/.exec(t); if (!m) return null;
    var p = +m[1], lim = +m[3], fix = +m[2], rest = lim - fix, xv = rest / p, ans = Math.floor(xv + 1e-9);
    if (rest < 0) return null;
    return {
      steps: [
        { say: '先列不等式：買 x 個，每個 ' + p + ' 元，再加上固定費用 ' + fix + ' 元，總花費「不超過」' + lim + ' 元。', hint: '「不超過」＝小於或等於（≤）。', opts: mkOpts(p + 'x + ' + fix + ' ≤ ' + lim, [[p + 'x + ' + fix + ' ≥ ' + lim, '「不超過」是 ≤，不是 ≥。'], [p + 'x + ' + fix + ' < ' + lim, '「不超過」包含剛好等於，要用 ≤。'], [p + ' + ' + fix + 'x ≤ ' + lim, '個數 x 要乘單價 ' + p + '。']]), line: p + 'x + ' + fix + ' ≤ ' + lim },
        { say: '把 ' + fix + ' 移到右邊：<b>' + lim + ' − ' + fix + '</b> = ？', hint: '移項要變號。', opts: mkOpts(rest, [[lim + fix, '移項要變號，是減掉。'], [fix - lim, '順序弄反了。']]), line: p + 'x ≤ ' + rest },
        { say: '兩邊同除以 ' + p + '：x ≤ ' + rest + ' ÷ ' + p + ' = ？（可以有小數）', hint: '除以單價。', opts: mkOpts(Nm(xv), [[Nm(rest * p), '是「除以」。'], [Nm(rest - p), '是「除以」。']]), line: 'x ≤ ' + Nm(xv) },
        { say: '個數一定是「整數」，而且不能超過 ' + Nm(xv) + '，最多可以買幾個？', hint: '無條件捨去小數。', opts: mkOpts(ans, [[Math.ceil(xv), '超過了 ' + Nm(xv) + ' 就不行了，要往下捨去。'], [ans + 1, '超過了就不行。'], [ans - 1, '還可以再多買一個喔。']]), line: '最多 ' + ans + ' 個' }
      ], final: String(ans)
    };
  };
  PLANNERS.minCount = function (t) {
    var m = /可以賺 (\d+) 元，如果目標利潤要達到不低於 (\d+) 元/.exec(t); if (!m) return null;
    var p = +m[1], goal = +m[2], xv = goal / p, ans = Math.ceil(xv - 1e-9);
    return {
      steps: [
        { say: '賣 x 件，每件賺 ' + p + ' 元，利潤「不低於」' + goal + ' 元，列不等式：', hint: '「不低於」＝大於或等於（≥）。', opts: mkOpts(p + 'x ≥ ' + goal, [[p + 'x ≤ ' + goal, '「不低於」是 ≥。'], [p + 'x > ' + goal, '「不低於」包含剛好等於，要用 ≥。'], ['x ≥ ' + p + goal, '應該是 ' + p + ' 乘 x。']]), line: p + 'x ≥ ' + goal },
        { say: '兩邊同除以 ' + p + '：x ≥ ' + goal + ' ÷ ' + p + ' = ？（可以有小數）', hint: '除以每件賺的錢。', opts: mkOpts(Nm(xv), [[Nm(goal * p), '是「除以」。'], [Nm(goal - p), '是「除以」。']]), line: 'x ≥ ' + Nm(xv) },
        { say: '件數一定是整數，而且至少要有 ' + Nm(xv) + '，最少要賣幾件？', hint: '無條件進位。', opts: mkOpts(ans, [[Math.floor(xv), '不夠喔，要往上進位。'], [ans + 1, '多了一件，還可以再少一點。'], [ans - 1, '不夠喔。']]), line: '至少 ' + ans + ' 件' }
      ], final: String(ans)
    };
  };

  // ---- 追加：比例式、應用題、百分率、代入檢驗 ----
  PLANNERS.solve_ratio = function (t) {
    var m = /\(?x\s*(?:([+\-])\s*(\d+))?\)?\s*:\s*(\d+)\s*=\s*(\d+)\s*:\s*(\d+)，求 x/.exec(t.replace(/\(\s*x/, '(x')); if (!m) return null;
    var k = m[1] ? (m[1] === '-' ? -1 : 1) * parseInt(m[2], 10) : 0, B = +m[3], C = +m[4], D = +m[5], prod = B * C, v = prod / D, x = v - k;
    if (Math.round(v) !== v) return null;
    var lhs = k ? '(x ' + (k < 0 ? '-' : '+') + ' ' + Math.abs(k) + ')' : 'x';
    var steps = [
      { say: '比例式 ' + lhs + ' : ' + B + ' = ' + C + ' : ' + D + '，<b>交叉相乘</b>（外項乘積＝內項乘積）：' + D + ' × ' + lhs + ' = ' + B + ' × ' + C + '。右邊 ' + B + ' × ' + C + ' = ？', hint: '外項乘外項、內項乘內項。', opts: mkOpts(prod, [[B + C, '是「相乘」。'], [D * C, '右邊是 ' + B + ' 乘 ' + C + '。']]), line: D + ' × ' + lhs + ' = ' + prod },
      { say: '兩邊同除以 ' + D + '：' + lhs + ' = ' + prod + ' ÷ ' + D + ' = ？', hint: '除以 ' + lhs + ' 前面的數。', opts: mkOpts(v, [[prod * D, '是「除以」。'], [prod - D, '是「除以」。']]), line: lhs + ' = ' + v }
    ];
    if (k) steps.push({ say: '把 ' + (k < 0 ? '−' : '+') + ' ' + Math.abs(k) + ' 移到右邊，x = ' + v + (k < 0 ? ' + ' : ' − ') + Math.abs(k) + ' = ？', hint: '移項要變號。', opts: mkOpts(x, [[v + k, '移項要變號。'], [-x, '正負號弄反了。']]), line: 'x = ' + x });
    return { steps: steps, final: String(x) };
  };
  PLANNERS.word_ratio = function (t) {
    var m = /(\d+)\D*?需要\s*(\d+)\D*?，用同樣的比例，\D*?(\d+)\D*?需要多少/.exec(t); if (!m) return null;
    var a = +m[1], b = +m[2], c = +m[3], prod = b * c, x = prod / a;
    return {
      steps: [
        { say: '列比例式 ' + a + ' : ' + b + ' = ' + c + ' : x，<b>交叉相乘</b>：' + a + ' × x = ' + b + ' × ' + c + '。右邊 ' + b + ' × ' + c + ' = ？', hint: '外項乘內項。', opts: mkOpts(prod, [[b + c, '是「相乘」。'], [a * c, '要用 ' + b + ' 乘 ' + c + '。']]), line: a + 'x = ' + prod },
        { say: '兩邊同除以 ' + a + '：x = ' + prod + ' ÷ ' + a + ' = ？', hint: '除以 x 前面的數。', opts: mkOpts(Nm(x), [[Nm(prod * a), '是「除以」。'], [Nm(prod - a), '是「除以」。']]), line: 'x = ' + Nm(x) }
      ], final: Nm(x)
    };
  };
  PLANNERS.check = function (t) {
    var m = /比例式 (\d+) : (\d+) = (\d+) : (\d+) 成立嗎/.exec(t); if (!m) return null;
    var a = +m[1], b = +m[2], c = +m[3], d = +m[4], o = a * d, i2 = b * c, same = o === i2;
    var dec = function (s, x, y) { return s ? '外項乘積 ' + x + '、內項乘積 ' + y + '，相等，所以成立' : '外項乘積 ' + x + '、內項乘積 ' + y + '，不相等，所以不成立'; };
    return {
      steps: [
        { say: '看是不是比例式，要比<b>外項乘積</b>和<b>內項乘積</b>。外項乘積 = ' + a + ' × ' + d + ' = ？', hint: '最外面兩個數相乘。', opts: mkOpts(o, [[a * c, '那是 ' + a + ' 乘第三個數，外項是最外面的兩個。'], [b * c, '那是內項乘積。']]), line: '外項乘積 = ' + o },
        { say: '內項乘積 = ' + b + ' × ' + c + ' = ？', hint: '中間兩個數相乘。', opts: mkOpts(i2, [[b * d, '內項是中間兩個數。'], [a * d, '那是外項乘積。']]), line: '內項乘積 = ' + i2 },
        { say: ' ' + o + ' 和 ' + i2 + ' 比一比，結論是？', hint: '兩個乘積一樣，才是比例式。', opts: mkOpts(same ? '成立（是比例式）' : '不成立（不是比例式）', [[same ? '不成立（不是比例式）' : '成立（是比例式）', '看清楚兩個乘積一不一樣。'], ['無法判斷', '算出兩個乘積就能判斷。'], ['只有外項乘積要相等', '外項乘積和內項乘積都要比。']]), line: same ? '成立' : '不成立' }
      ], final: same ? '成立（是比例式）' : '不成立（不是比例式）'
    };
  };
  // 和差問題（1-3-1 sumdiff）
  PLANNERS.sumdiff = function (t) {
    var ns = (t.match(/\d+/g) || []).map(Number); if (ns.length < 2) return null;
    var S = Math.max(ns[0], ns[1]), D = Math.min(ns[0], ns[1]);
    if ((S + D) % 2) return null;
    var big = (S + D) / 2, small = (S - D) / 2, askBig = String(big) === String(CURQ.ans);
    if (!askBig && String(small) !== String(CURQ.ans)) return null;
    var steps = [
      { say: '設「較多的」是 <b>x</b>、「較少的」是 <b>y</b>。合計 ' + S + '、相差 ' + D + '，列出方程式：', hint: '合計＝相加；相差＝相減。', opts: mkOpts('① x + y = ' + S + '　② x − y = ' + D, [['① x + y = ' + D + '　② x − y = ' + S, '合計和相差的數字放反了。'], ['① x × y = ' + S + '　② x − y = ' + D, '合計是「相加」。'], ['① x + y = ' + S + '　② x + y = ' + D, '一個是相加、一個是相減。']]), line: 'x + y = ' + S + '，x − y = ' + D },
      { say: '①＋②，y 就消掉了：<b>2x = ' + S + ' + ' + D + '</b> = ？', hint: '兩式相加。', opts: mkOpts(S + D, [[S - D, '是 ① ＋ ②，要相加。'], [S * D, '是相加。']]), line: '2x = ' + (S + D) },
      { say: '兩邊同除以 2：x = ' + (S + D) + ' ÷ 2 = ？', hint: '除以 2。', opts: mkOpts(big, [[S + D, '還要除以 2。'], [small, '那是較少的那一個。']]), line: 'x = ' + big }
    ];
    if (!askBig) steps.push({ say: '題目問的是「較少的」，代回 ① 求 y：y = ' + S + ' − ' + big + ' = ？', hint: '合計減掉較多的。', opts: mkOpts(small, [[S + big, '是「相減」。'], [big, '那是較多的那一個。']]), line: 'y = ' + small });
    return { steps: steps, final: String(askBig ? big : small) };
  };
  // 單價問題（1-3-1 price）
  PLANNERS.price = function (t) {
    var ns = (t.match(/\d+/g) || []).map(Number); if (ns.length < 4) return null;
    var p1 = ns[0], p2 = ns[1], n = ns[2], T = ns[3];
    if (p1 === p2) return null;
    var xv = (T - p2 * n) / (p1 - p2); if (Math.round(xv) !== xv || xv < 0 || xv > n) return null;
    var yv = n - xv, ansIsX = String(xv) === String(CURQ.ans);
    if (!ansIsX && String(yv) !== String(CURQ.ans)) return null;
    var A = p1 - p2, B = p2 * n;
    var steps = [
      { say: '設「第一種（先出現的）」買 <b>x</b>、「第二種」買 <b>y</b>。總數 ' + n + '、總價 ' + T + '，列出方程式：', hint: '數量相加＝總數；單價×數量，相加＝總價。', opts: mkOpts('① x + y = ' + n + '　② ' + p1 + 'x + ' + p2 + 'y = ' + T, [['① x + y = ' + T + '　② ' + p1 + 'x + ' + p2 + 'y = ' + n, '總數和總價放反了。'], ['① x + y = ' + n + '　② ' + p2 + 'x + ' + p1 + 'y = ' + T, '單價要對應到自己那一種。'], ['① x + y = ' + n + '　② x + y = ' + T, '總價要用「單價 × 數量」。']]), line: 'x + y = ' + n + '，' + p1 + 'x + ' + p2 + 'y = ' + T },
      { say: '由 ① 得 y = ' + n + ' − x，代入 ②，會變成？', hint: '② 裡的 y 要整個換成 (' + n + ' − x)，記得加括號。', opts: mkOpts(p1 + 'x + ' + p2 + '(' + n + ' − x) = ' + T, [[p1 + 'x + ' + p2 + '(' + n + ' + x) = ' + T, 'y = ' + n + ' − x，是減。'], [p1 + 'x + ' + p2 + ' × ' + n + ' − x = ' + T, '要用括號，' + p2 + ' 要乘整個 (' + n + ' − x)。'], [p1 + '(' + n + ' − x) + ' + p2 + 'x = ' + T, '要代進 y，不是 x。']]), line: p1 + 'x + ' + p2 + '(' + n + ' − x) = ' + T },
      { say: '展開、合併：<b>' + (A < 0 ? '(' + p1 + ' − ' + p2 + ')' : '(' + p1 + ' − ' + p2 + ')') + 'x + ' + p2 + ' × ' + n + ' = ' + T + '</b>，會變成？', hint: '把 x 的係數相減，常數項是 ' + p2 + ' × ' + n + '。', opts: mkOpts(A + 'x + ' + B + ' = ' + T, [[(p1 + p2) + 'x + ' + B + ' = ' + T, 'x 的係數是 ' + p1 + ' 減 ' + p2 + '。'], [A + 'x − ' + B + ' = ' + T, '常數項是 +' + B + '。'], [A + 'x + ' + p2 + ' = ' + T, '常數項是 ' + p2 + ' × ' + n + '。']]), line: A + 'x + ' + B + ' = ' + T },
      { say: '移項、同除：x = (' + T + ' − ' + B + ') ÷ ' + sg(A) + ' = ？', hint: '常數移到右邊再除以係數。', opts: mkOpts(xv, [[(T + B) / A, '移項要變號。'], [T - B, '還要除以 ' + A + '。'], [-xv, '正負號弄反了。']]), line: 'x = ' + xv }
    ];
    if (!ansIsX) steps.push({ say: '題目問的是第二種，代回 ① ：y = ' + n + ' − ' + xv + ' = ？', hint: '總數減掉 x。', opts: mkOpts(yv, [[n + xv, '是「相減」。'], [xv, '那是第一種的數量。']]), line: 'y = ' + yv });
    return { steps: steps, final: String(ansIsX ? xv : yv) };
  };
  // 百分率（5-1-1）
  PLANNERS.percentCalc = function (t) {
    var m = /全校 (\d+) 名學生.*?佔 (\d+)%/.exec(t); if (!m) return null;
    var N = +m[1], p = +m[2], pr = N * p, r = pr / 100;
    return { steps: [
      { say: p + '% 就是 ' + p + '/100。先算 ' + N + ' × ' + p + ' = ？', hint: '先乘再除。', opts: mkOpts(pr, [[N + p, '是「相乘」。'], [N * 100, '要乘的是 ' + p + '。']]), line: N + ' × ' + p + ' = ' + pr },
      { say: '再除以 100：' + pr + ' ÷ 100 = ？', hint: '除以 100 就是小數點往左移 2 位。', opts: mkOpts(Nm(r), [[Nm(pr * 100), '是「除以」100。'], [Nm(pr / 10), '要除以 100，不是 10。']]), line: Nm(r) + ' 人' }
    ], final: Nm(r) };
  };
  PLANNERS.fractionCalc = function (t) {
    var m = /全校 (\d+) 名學生中.*?佔全體的 (\d+)\/(\d+)/.exec(t); if (!m) return null;
    var N = +m[1], a = +m[2], b = +m[3], pr = N * a, r = pr / b;
    return { steps: [
      { say: '全體的 ' + a + '/' + b + '：先算 ' + N + ' × ' + a + ' = ？', hint: '先用分子乘。', opts: mkOpts(pr, [[N + a, '是「相乘」。'], [N * b, '要乘分子 ' + a + '。']]), line: N + ' × ' + a + ' = ' + pr },
      { say: '再除以分母 ' + b + '：' + pr + ' ÷ ' + b + ' = ？', hint: '除以分母。', opts: mkOpts(Nm(r), [[Nm(pr * b), '是「除以」。'], [Nm(pr - b), '是「除以」。']]), line: Nm(r) + ' 人' }
    ], final: Nm(r) };
  };
  PLANNERS.findPercent = function (t) {
    var m = /全校 (\d+) 名學生中，[^\d]*?有 (\d+) 人/.exec(t); if (!m) return null;
    var N = +m[1], k = +m[2], r = k / N, pc = r * 100;
    return { steps: [
      { say: '佔全體的幾分之幾？ ' + k + ' ÷ ' + N + ' = ？（小數）', hint: '部分 ÷ 全體。', opts: mkOpts(Nm(r), [[Nm(N / k), '要用「部分 ÷ 全體」。'], [Nm(r * 100), '還沒到乘 100 這一步。']]), line: k + ' ÷ ' + N + ' = ' + Nm(r) },
      { say: '再乘以 100，換成百分率：' + Nm(r) + ' × 100 = ？', hint: '小數點往右移 2 位。', opts: mkOpts(Nm(pc) + '%', [[Nm(r / 100) + '%', '是「乘」100。'], [Nm(pc * 10) + '%', '是乘 100。'], [Nm(r) + '%', '還要乘 100。']]), line: Nm(pc) + '%' }
    ], final: Nm(pc) + '%' };
  };
  PLANNERS.findMissing = (function (old) {
    return function (t) {
      var m = /全部共 (\d+) 人，其中 (.+?)，請問(\S+)有幾人/.exec(t);
      if (!m) return old(t);
      var tot = +m[1], ks = (m[2].match(/(\d+) 人/g) || []).map(function (x) { return parseInt(x, 10); }), kn = ks.reduce(function (a, b) { return a + b; }, 0), r = tot - kn;
      return { steps: [
        { say: '已經知道的人數加起來：<b>' + ks.join(' + ') + '</b> = ？', hint: '只加題目給的那幾類。', opts: mkOpts(kn, [[kn + 10, '再加一次看看。'], [kn - 10, '再加一次看看。']]), line: '已知共 ' + kn + ' 人' },
        { say: m[3] + ' = 全部 − 已知的 = ' + tot + ' − ' + kn + ' = ？', hint: '總人數減掉已知的。', opts: mkOpts(r, [[tot + kn, '是「相減」。'], [kn - tot, '順序弄反了。']]), line: m[3] + ' = ' + r + ' 人' }
      ], final: String(r) };
    };
  })(PLANNERS.findMissing);
  // 代入檢驗（4-1-2 checkOne）
  PLANNERS.checkOne = function (t) {
    var m = /：\s*(-?\d*)x\s*([+\-])\s*(\d+)\s*([<>≤≥])\s*(-?\d+)。候選數 x=(-?\d+)/.exec(t); if (!m) return null;
    var a = pInt(m[1], 1), b = (m[2] === '-' ? -1 : 1) * parseInt(m[3], 10), op = m[4], c = +m[5], xv = +m[6], ax = a * xv, L = ax + b;
    var okf = { '<': L < c, '>': L > c, '≤': L <= c, '≥': L >= c }[op];
    var yes = '是，x=' + xv + ' 是解', no = '不是，x=' + xv + ' 不是解';
    return { steps: [
      { say: '把 x = ' + sg(xv) + ' 代進左邊：先算 ' + a + ' × ' + sg(xv) + ' = ？', hint: '注意正負號。', opts: mkOpts(ax, [[-ax, '正負號弄反了。'], [a + xv, '是「相乘」。']]), line: a + ' × ' + sg(xv) + ' = ' + ax },
      { say: '再加上常數：' + sg(ax) + ' ' + (b < 0 ? '−' : '+') + ' ' + Math.abs(b) + ' = ？', hint: '照順序算。', opts: mkOpts(L, [[ax - b, '常數的正負號要照抄。'], [-L, '正負號弄反了。']]), line: '左邊 = ' + L },
      { say: '看看 ' + L + ' ' + op + ' ' + c + ' 成不成立？結論是？', hint: '把數字放進不等號判斷。', opts: mkOpts(okf ? yes : no, [[okf ? no : yes, L + ' ' + op + ' ' + c + (okf ? ' 是成立的。' : ' 是不成立的。')], ['不一定', '代入算出數字就能判斷。'], ['無法判斷', '代入算出數字就能判斷。']]), line: okf ? '成立' : '不成立' }
    ], final: okf ? yes : no };
  };
  // 3-1-2 的 solve / word 轉接
  PLANNERS.solve = (function (old) { return function (t) { return old(t) || PLANNERS.solve_ratio(t); }; })(PLANNERS.solve);
  PLANNERS.word = PLANNERS.word_ratio;
  /* ===== 3-1-1 比值化簡、4-1-1 不等式翻譯 的步驟教學 ===== */
  function gcdN(a, b) { a = Math.abs(a); b = Math.abs(b); return b ? gcdN(b, a % b) : a; }
  function mkSimple(a, b) {
    var k = gcdN(a, b), p = a / k, r = b / k;
    var divs = []; for (var d = 1; d < k; d++) if (a % d === 0 && b % d === 0) divs.push(d);
    var smaller = divs.length ? divs[divs.length - 1] : null;
    var step1 = {
      say: '想把 <b>' + a + ' : ' + b + '</b> 化成最簡整數比，要先找<b>最大公因數</b>（兩個數都能整除的最大數）。' + a + ' 和 ' + b + ' 的最大公因數是多少？',
      hint: '從小到大試：哪些數可以同時整除 ' + a + ' 和 ' + b + '？最大的那個就是答案。',
      opts: mkOpts(k, [[smaller, smaller === null ? '' : smaller + ' 雖然是公因數，但還不是「最大」的，還能再約分。'], [k * 2, k * 2 + ' 不能同時整除 ' + a + ' 和 ' + b + '。'], [a, a + ' 只能整除 ' + a + '，不能整除 ' + b + '。'], [b, b + ' 只能整除 ' + b + '，不能整除 ' + a + '。'], [k + 1, (k + 1) + ' 不能同時整除 ' + a + ' 和 ' + b + '。'], [k + 2, (k + 2) + ' 不能同時整除 ' + a + ' 和 ' + b + '。']].filter(function (x) { return x[0] !== null; }), true),
      line: '最大公因數 = ' + k
    };
    var step2 = {
      say: '前項、後項<b>同時除以 ' + k + '</b>。前項：' + a + ' ÷ ' + k + ' = ？',
      hint: '用 ' + a + ' 去除以 ' + k + '。',
      opts: mkOpts(p, [[a - k, '是「除以」' + k + '，不是減。'], [p + 1, '再算一次 ' + a + ' ÷ ' + k + '。'], [k, '那是最大公因數，不是商。'], [p + 2, '再算一次 ' + a + ' ÷ ' + k + '。']], true),
      line: a + ' ÷ ' + k + ' = ' + p
    };
    var step3 = {
      say: '後項：' + b + ' ÷ ' + k + ' = ？',
      hint: '用 ' + b + ' 去除以 ' + k + '。',
      opts: mkOpts(r, [[b - k, '是「除以」' + k + '，不是減。'], [r + 1, '再算一次 ' + b + ' ÷ ' + k + '。'], [k, '那是最大公因數，不是商。'], [r + 2, '再算一次 ' + b + ' ÷ ' + k + '。']], true),
      line: p + ' : ' + r
    };
    return { steps: [step1, step2, step3], final: p + ' : ' + r, p: p, r: r, k: k };
  }
  PLANNERS.simplify = function (t) {
    var m = /兩個數量：(\d+) 與 (\d+)，請化成最簡整數比/.exec(t); if (!m) return null;
    var pl = mkSimple(+m[1], +m[2]); return { steps: pl.steps, final: pl.final };
  };
  PLANNERS.word = (function (old) {
    return function (t) {
      var r = old ? old(t) : null; if (r) return r;
      var m = /(\d+)\s*\D+?與\D*?(\d+)\s*\D+?，請問.+?的最簡整數比/.exec(t); if (!m) return null;
      var pl = mkSimple(+m[1], +m[2]); return { steps: pl.steps, final: pl.final };
    };
  })(PLANNERS.word);
  PLANNERS.value = function (t) {
    var m = /已知比為 (\d+) : (\d+)，求它的比值/.exec(t); if (!m) return null;
    var a = +m[1], b = +m[2], k = gcdN(a, b), p = a / k, r = b / k;
    var fs = function (n, d) { return d === 1 ? String(n) : n + '/' + d; };
    var steps = [
      { say: '<b>比值 = 前項 ÷ 後項</b>，所以 ' + a + ' : ' + b + ' 的比值可以寫成分數 <b>' + a + '/' + b + '</b>。接著要<b>約分</b>，先找 ' + a + ' 和 ' + b + ' 的最大公因數是多少？',
        hint: '哪個最大的數可以同時整除 ' + a + ' 和 ' + b + '？',
        opts: mkOpts(k, [[k * 2, k * 2 + ' 不能同時整除兩個數。'], [a, a + ' 不能整除 ' + b + '。'], [b, b + ' 不能整除 ' + a + '。'], [k + 1, (k + 1) + ' 不能同時整除兩個數。']], true),
        line: '比值 = ' + a + '/' + b + '，最大公因數 = ' + k },
      { say: '分子分母同時除以 ' + k + '：<b>' + a + '/' + b + '</b> 約分後是？',
        hint: '分子 ' + a + ' ÷ ' + k + '，分母 ' + b + ' ÷ ' + k + '。',
        opts: (function () {
          var ok = fs(p, r), cand = [[fs(r, p), '分子分母顛倒了，比值是「前項 ÷ 後項」。'], [fs(a, b), '還沒有約分，要分子分母同除以最大公因數。'], [fs(p + 1, r), '再算一次分子 ' + a + ' ÷ ' + k + '。'], [fs(p, r + 1), '再算一次分母 ' + b + ' ÷ ' + k + '。']];
          var out = [{ t: ok, ok: true }], seen = {}; seen[ok] = 1;
          cand.forEach(function (c) { if (!seen[c[0]] && out.length < 4) { seen[c[0]] = 1; out.push({ t: c[0], ok: false, why: c[1] }); } });
          return shuffle(out);
        })(),
        line: '比值 = ' + fs(p, r) }
    ];
    return { steps: steps, final: fs(p, r) };
  };
  function parseRatio(s) { var m = /(\d+)\s*:\s*(\d+)/.exec(s); return m ? [+m[1], +m[2]] : null; }
  PLANNERS.equivalent = function (t) {
    var m = /出示比 (\d+) : (\d+)，下列哪一個比與它相等/.exec(t); if (!m || !CURQ || !CURQ.options) return null;
    var a = +m[1], b = +m[2], pl = mkSimple(a, b), p = pl.p, r = pl.r;
    var steps = pl.steps.slice(0, 1).concat([{
      say: '同除以 ' + pl.k + '，' + a + ' : ' + b + ' 化簡後是 <b>？ : ？</b>（寫成最簡整數比）',
      hint: '前項 ' + a + ' ÷ ' + pl.k + '，後項 ' + b + ' ÷ ' + pl.k + '。',
      opts: (function () {
        var ok = p + ' : ' + r, cand = [[r + ' : ' + p, '前後項顛倒了。'], [a + ' : ' + b, '還沒有約分。'], [(p + 1) + ' : ' + r, '前項再算一次。']];
        var out = [{ t: ok, ok: true }]; cand.forEach(function (c) { if (out.length < 4) out.push({ t: c[0], ok: false, why: c[1] }); });
        return shuffle(out);
      })(),
      line: a + ' : ' + b + ' = ' + p + ' : ' + r
    }]);
    var opts = CURQ.options.map(function (o) {
      var rr = parseRatio(String(o)), good = String(o) === String(CURQ.ans), why = '';
      if (!good && rr) { var g2 = gcdN(rr[0], rr[1]); why = o + ' 化簡後是 ' + (rr[0] / g2) + ' : ' + (rr[1] / g2) + '，跟 ' + p + ' : ' + r + ' 不一樣。'; }
      return { t: String(o), ok: good, why: why };
    });
    steps.push({ say: '最後，下面哪一個比，化簡後也是 <b>' + p + ' : ' + r + '</b>？（把每個選項都化簡看看）', hint: '把前項、後項同除以最大公因數，看看是不是 ' + p + ' : ' + r + '。', opts: opts, line: '答案：' + CURQ.ans });
    return { steps: steps, final: String(CURQ.ans) };
  };

  /* 「先挑一個來試」：學生自己從選項挑一個→代入計算→判斷成不成立；不是解就再挑下一個，直到找到解。
     cands＝[{label:選項文字, steps:[代入步驟…], isSol:是不是解}]；挑哪個都可以（不算錯），只有代入、判斷的步驟會記失誤 */
  function walkPlan(cands, firstSay, firstHint, ans) {
    function pickStep(rem, first) {
      return { say: first ? firstSay : '🐱 這個不是解，再挑下一個來試試看吧！', hint: firstHint, line: '',
        opts: rem.map(function (c) { return { t: c.label, ok: true, line: (first ? '我先試 ' : '再試 ') + c.label, ack: '👍 好，來試試看 ' + c.label + '！', next: function () { return after(c, rem); } }; }) };
    }
    function after(c, rem) {
      var out = c.steps.slice();
      if (!c.isSol) {
        var r2 = rem.filter(function (x) { return x !== c; });
        if (r2.length > 1) out.push(pickStep(r2, false));
        else if (r2.length === 1) out = out.concat(after(r2[0], r2));
      }
      return out;
    }
    return { steps: [pickStep(cands, true)], final: ans };
  }
  function addPlanner(type, fn) { var old = PLANNERS[type]; PLANNERS[type] = function (t) { var r = null; if (old) { try { r = old(t); } catch (e) { r = null; } } return r || fn(t); }; }
  /* ---- 4-1-1 不等式翻譯 ---- */
  var PHR = { '不小於': '≥', '不低於': '≥', '至少': '≥', '最少': '≥', '最低': '≥', '以上': '≥', '不大於': '≤', '不超過': '≤', '至多': '≤', '最多': '≤', '最高': '≤', '以下': '≤', '超過': '>', '多於': '>', '未滿': '<', '少於': '<' };
  var SYMS = ['>', '<', '≥', '≤'];
  var SYMNAME = { '>': '大於（不含等於）', '<': '小於（不含等於）', '≥': '大於或等於', '≤': '小於或等於' };
  function dirOf(s) { return (s === '>' || s === '≥') ? '大' : '小'; }
  function inclOf(s) { return s === '≥' || s === '≤'; }
  function opt2(good, bad, whyBad) { return shuffle([{ t: good, ok: true }, { t: bad, ok: false, why: whyBad }]); }
  function stepsFromWord(phrase, val, finalLabel, ineqOpts, ans, name) {
    var sym = PHR[phrase], big = dirOf(sym) === '大', inc = inclOf(sym), vv = '';
    var s1 = { say: '先看關鍵詞<b>「' + phrase + '」</b>：' + (name || '這個數') + ' 會落在 ' + val + ' 的哪一邊？', hint: '想一想：「' + phrase + '」是在說比 ' + val + ' 大，還是比 ' + val + ' 小？',
      opts: opt2(big ? '比 ' + val + ' 大的一邊' : '比 ' + val + ' 小的一邊', big ? '比 ' + val + ' 小的一邊' : '比 ' + val + ' 大的一邊', '方向弄反了，再讀一次「' + phrase + '」。'), line: '方向：' + (big ? '大於' : '小於') + ' ' + val };
    var s2 = { say: '再想想：<b>' + val + ' 本身</b>算不算？（「' + phrase + '」有沒有包含剛好等於 ' + val + '？）', hint: '「至少、至多、不大於、不小於、不低於、不超過」都包含等於；「超過、多於、未滿、少於」不包含。',
      opts: opt2(inc ? '算（要加等號：≥ 或 ≤）' : '不算（沒有等號：> 或 <）', inc ? '不算（沒有等號：> 或 <）' : '算（要加等號：≥ 或 ≤）', inc ? '「' + phrase + '」是可以剛好等於 ' + val + ' 的，要加等號。' : '「' + phrase + '」不能剛好等於 ' + val + '，不加等號。'), line: val + ' ' + (inc ? '算' : '不算') + '在範圍內' };
    var s3 = { say: '合起來：方向「' + (big ? '大' : '小') + '」、' + (inc ? '含等於' : '不含等於') + '，' + finalLabel, hint: '大 + 含等於 = ≥；小 + 含等於 = ≤；大 + 不含 = ＞；小 + 不含 = ＜。', opts: ineqOpts, line: ans };
    return [s1, s2, s3];
  }
  PLANNERS.translate = function (t) {
    var m = /『(\S+?) ([xy]) (\S+?)(不小於|不低於|至少|最少|最低|不大於|不超過|至多|最多|最高|超過|多於|未滿|少於) (\d+)』/.exec(t), mp = /『(\S+?) ([xy]) 是 (\d+)\S*?(以上|以下)』/.exec(t); if (mp) m = [mp[0], mp[1], mp[2], '', mp[4], mp[3]]; if (!m || !CURQ || !CURQ.options) return null;
    var phrase = m[4], val = m[5], ans = String(CURQ.ans);
    var opts = CURQ.options.map(function (o) { var sy = (/([<>≤≥])/.exec(o) || [])[1]; return { t: String(o), ok: String(o) === ans, why: String(o) === ans ? '' : '這個符號是「' + (SYMNAME[sy] || '') + '」，跟「' + phrase + '」的意思不一樣。' }; });
    return { steps: stepsFromWord(phrase, val, '請選出正確的不等式：', opts, ans, m[1] + ' ' + m[2]), final: ans };
  };
  PLANNERS.setupWord = function (t) {
    var m = /請寫出「\S+?(不小於|不低於|至少|最少|最低|不大於|不超過|至多|最多|最高|超過|多於|未滿|少於) (\d+)」這個條件的不等式/.exec(t), mp = /請寫出「\S+? (\d+) \S*?(以上|以下)」這個條件的不等式/.exec(t); if (mp) m = [mp[0], mp[2], mp[1]]; if (!m || !CURQ || !CURQ.options) return null;
    var phrase = m[1], val = m[2], ans = String(CURQ.ans);
    var opts = CURQ.options.map(function (o) { var sy = (/([<>≤≥])/.exec(o) || [])[1]; return { t: String(o), ok: String(o) === ans, why: String(o) === ans ? '' : '這個符號是「' + (SYMNAME[sy] || '') + '」，跟「' + phrase + '」的意思不一樣。' }; });
    var st = stepsFromWord(phrase, val, '請選出這個條件的不等式：', opts, ans, '這個數');
    st[0].say = '告示牌有兩個條件，<b>題目只問這一個</b>：' + (/^(以上|以下)$/.test(phrase) ? '「…' + val + ' ' + phrase : '「…' + phrase + ' ' + val) + '」。' + st[0].say;
    return { steps: st, final: ans };
  };
  PLANNERS.symbol = function (t) {
    var m = /生活用語「(\S+?)」應該對應下列哪一個不等號/.exec(t); if (!m || !PHR[m[1]]) return null;
    var phrase = m[1], sym = PHR[phrase], big = dirOf(sym) === '大', inc = inclOf(sym);
    var opts = SYMS.map(function (s) { return { t: s, ok: s === sym, why: s === sym ? '' : '「' + s + '」是' + SYMNAME[s] + '，不是「' + phrase + '」的意思。' }; });
    var st = stepsFromWord(phrase, '某個數', '請選出對應的不等號：', shuffle(opts), sym, '這個數');
    st[0].say = '先看關鍵詞<b>「' + phrase + '」</b>：它是在說「比某個數大」，還是「比某個數小」？';
    st[1].say = '再想想：「' + phrase + '」有沒有包含<b>剛好等於</b>那個數？';
    return { steps: st, final: sym };
  };
  PLANNERS.reverse = function (t) {
    var m = /不等式 ([xy]) ([<>≤≥]) (\d+) 用生活用語來說/.exec(t); if (!m || !CURQ || !CURQ.options) return null;
    var v = m[1], sym = m[2], val = m[3], big = dirOf(sym) === '大', inc = inclOf(sym), ans = String(CURQ.ans);
    var s1 = { say: '先讀懂符號 <b>' + sym + '</b>：它是什麼意思？', hint: '＞＜ 不含等於；≥≤ 含等於（等號在下面）。尖口開的那邊是比較大的。',
      opts: (function () { var out = SYMS.map(function (s) { return { t: SYMNAME[s], ok: s === sym, why: s === sym ? '' : '「' + sym + '」不是這個意思，再看一次符號。' }; }); return shuffle(out); })(), line: sym + ' 讀作「' + SYMNAME[sym] + '」' };
    var opts = CURQ.options.map(function (o) {
      var ph = Object.keys(PHR).filter(function (k) { return String(o).indexOf(k) >= 0; })[0], good = String(o) === ans;
      return { t: String(o), ok: good, why: good ? '' : (ph ? '「' + ph + '」對應的是「' + PHR[ph] + '」，不是「' + sym + '」。' : '這個說法的意思不一樣。') };
    });
    var s2 = { say: '「' + v + ' ' + sym + ' ' + val + '」（' + SYMNAME[sym] + '）用生活用語來說，哪一個最適合？', hint: '大於或等於＝至少／不小於／不低於；小於或等於＝至多／不大於／不超過；大於＝超過／多於；小於＝未滿／少於。', opts: opts, line: ans };
    return { steps: [s1, s2], final: ans };
  };


  // ---- 項／係數／常數項／同類項（1-1-1 identify）----
  PLANNERS.identify = function (t) {
    var m = /代數式[\s　]*(.+?)[\s　]*中，/.exec(t); if (!m) return null;
    var items; try { items = stParse(m[1]); } catch (e) { return null; }
    var terms = items.filter(function (x) { return x.k === 't'; }).map(function (x) { return { c: x.c, v: x.v, txt: (Fr.sign(x.c) < 0 ? '-' : '+') + tTxt(x.c, x.v), n: Fr.sign(x.c) * Fr.abs(x.c).n }; });
    if (!terms.length) return null;
    var all = function (f) { return terms.map(f).join('、'); };
    if (/一共有幾「項」/.test(t)) {
      var n = terms.length, ok = all(function (x) { return x.txt; });
      var noSign = all(function (x) { return x.txt.slice(1); });
      var merged = terms.length > 2 ? [terms[0].txt + ' ' + terms[1].txt].concat(terms.slice(2).map(function (x) { return x.txt; })).join('、') : '';
      var extra = ok + '、+0';
      return { steps: [
        { say: '「項」就是用加號、減號隔開的每一小段，<b>正負號跟著後面那一項</b>。這個式子要怎麼切？', hint: '加號、減號是切開的地方；每一項要帶著它前面的正負號。',
          opts: mkOpts(ok, [[noSign, '每一項前面的正負號要一起帶著，不能丟掉喔。'], [merged, '加號、減號才是切開的地方，每一段都是一項，不要把兩段黏在一起。'], [extra, '式子裡沒有這一項，不要多切出來。']].filter(function (w) { return w[0]; })), line: '切成：' + ok },
        { say: '切成這幾段：<b>' + esc(ok) + '</b>。一共有幾段（幾項）？', hint: '一段一段數。', opts: mkOpts(n, [[n - 1, '少數了一段。'], [n + 1, '多數了一段。'], [n - 2, '再數一次。']]), line: '共 ' + n + ' 項' }
      ], final: String(n) };
    }
    if (/「常數項」是多少/.test(t)) {
      var k = terms.filter(function (x) { return x.v === ''; })[0]; if (!k) return null;
      var others = terms.filter(function (x) { return x.v !== ''; });
      return { steps: [
        { say: '「常數項」就是<b>沒有字母</b>、只有數字的那一項。哪一項沒有字母？', hint: '看每一項後面有沒有 x 或 y。', opts: mkOpts(k.txt, others.slice(0, 3).map(function (x) { return [x.txt, '「' + x.txt + '」後面有字母，不是常數項。']; })), line: '常數項是 ' + k.txt },
        { say: '連同前面的正負號一起看，常數項是多少？', hint: '正負號是跟著那一項走的。', opts: mkOpts(String(k.n), [[String(-k.n), '正負號弄反了。'], [String(Math.abs(k.n)), '前面的正負號也要算進去。']]), line: '常數項 = ' + k.n }
      ], final: String(k.n) };
    }
    var cm = /「([+\-]?)(\d*)([xy])」這一項的「係數」/.exec(t);
    if (cm) {
      var sgn = cm[1] === '-' ? -1 : 1, digs = cm[2], val = sgn * (digs ? parseInt(digs, 10) : 1), ab = Math.abs(val), lab = cm[1] + cm[2] + cm[3];
      var s1 = digs
        ? { say: '「係數」是字母前面的數字（連同正負號）。「' + esc(lab) + '」裡，字母 <b>' + cm[3] + '</b> 前面的數字（先不管正負號）是多少？', hint: '字母前面寫的那個數字。', opts: mkOpts(String(ab), [[String(ab + 1), '看清楚字母前面寫的數字。'], [String(ab * 2), '看清楚字母前面寫的數字。'], ['1', '字母前面有寫數字，就用它。']]), line: '數字是 ' + ab }
        : { say: '「係數」是字母前面的數字（連同正負號）。「' + esc(lab) + '」的字母前面<b>沒有寫數字</b>，這時候數字其實是多少？', hint: '沒有寫數字，就是 1 個那個字母。', opts: mkOpts('1', [['0', '如果是 0，這一項就不見了。'], ['2', '沒有寫數字時，是 1 個。'], [cm[3], '係數是數字，不是字母。']]), line: '數字是 1' };
      return { steps: [s1,
        { say: '再看前面的正負號：「' + esc(lab) + '」前面是<b>' + (sgn < 0 ? '減號（負）' : '加號（正）') + '</b>，所以係數是多少？', hint: '負號要帶進係數。', opts: mkOpts(String(val), [[String(-val), '正負號弄反了。'], [String(ab), '前面的正負號要一起算進去。']]), line: '係數 = ' + val }
      ], final: String(val) };
    }
    var lm = /兩個「([xy])」項合併成同類項後/.exec(t);
    if (lm) {
      var lv = lm[1], same = terms.filter(function (x) { return x.v === lv; }), diff = terms.filter(function (x) { return x.v !== lv && x.v !== ''; });
      if (same.length < 2) return null;
      var sum = same.reduce(function (a, x) { return a + x.n; }, 0), sl = same.map(function (x) { return sg(x.n); }).join(' + ');
      var okl = same.map(function (x) { return x.txt.replace(lv, ''); }).map(function (z, i) { return String(same[i].n >= 0 ? '+' + same[i].n : same[i].n); }).join('、');
      var wl = diff.slice(0, 2).map(function (x) { return x.n >= 0 ? '+' + x.n : String(x.n); }).join('、');
      var mixl = same.length ? [same[0].n >= 0 ? '+' + same[0].n : String(same[0].n)].concat(diff.length ? [diff[0].n >= 0 ? '+' + diff[0].n : String(diff[0].n)] : []).join('、') : '';
      return { steps: [
        { say: '「同類項」就是字母一樣的項。先把<b>所有的 ' + lv + ' 項</b>找出來，它們的係數分別是多少？', hint: '只看字母是 ' + lv + ' 的項，連同前面的正負號。', opts: mkOpts(okl, [[wl, '那是別的字母的項，不是 ' + lv + ' 項。'], [mixl, lv + ' 項只能跟 ' + lv + ' 項合併，不能混進別的字母。']].filter(function (w) { return w[0] && w[0] !== okl; })), line: lv + ' 項的係數：' + okl },
        { say: '把它們的係數加起來：<b>' + esc(sl) + '</b> = ？', hint: '連同正負號一起加。', opts: mkOpts(sum, [[-sum, '正負號弄反了。'], [same.reduce(function (a, x) { return a + Math.abs(x.n); }, 0), '負的不能當成正的加。']]), line: '係數和 = ' + sum }
      ], final: String(sum) };
    }
    return null;
  };

    /* ===== plan4a：共用工具＋第 1 章（方程式）補齊 ===== */
  function numOf(s) { s = String(s).replace(/[−－]/g, '-').replace(/\s+/g, ''); var m = /^(-?)(\d*\.?\d+)(?:\/(\d+))?$/.exec(s); if (!m) return NaN; var v = parseFloat(m[2]); if (m[3]) v /= parseInt(m[3], 10); return m[1] ? -v : v; }
  function fmtF(v, frac) {
    if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
    if (frac) { for (var d = 2; d <= 12; d++) { var n = v * d; if (Math.abs(n - Math.round(n)) < 1e-9) return Math.round(n) + '/' + d; } }
    return String(Math.round(v * 10000) / 10000);
  }
  function pairOf(s) { var m = /^\(\s*(-?[\d.\/]+)\s*,\s*(-?[\d.\/]+)\s*\)$/.exec(String(s).replace(/[−－]/g, '-').trim()); return m ? [numOf(m[1]), numOf(m[2])] : null; }
  function linParse(s) {
    s = String(s).replace(/[−－]/g, '-').replace(/\s+/g, ''); var a = 0, b = 0, re = /([+\-]?)(\d*\.?\d*)([xy])(?:\/(\d+))?/g, m, any = false;
    while ((m = re.exec(s))) { var c = m[2] === '' ? 1 : parseFloat(m[2]); if (m[4]) c /= parseInt(m[4], 10); if (m[1] === '-') c = -c; if (m[3] === 'x') a += c; else b += c; any = true; }
    return any ? { a: a, b: b } : null;
  }
  function stp(say, hint, opts, line) {
    var good = opts.filter(function (o) { return o.ok; }).length;
    if (opts.length < 2 || opts.length > 4 || good !== 1) throw new Error('bad-step:' + say.slice(0, 20));
    return { say: say, hint: hint, opts: opts, line: line };
  }
  function txOpts(ok, wr) {
    var out = [{ t: String(ok), ok: true }], seen = {}; seen[String(ok)] = 1;
    (wr || []).forEach(function (w) { var t = String(w[0]); if (t !== '' && !seen[t] && out.length < 4) { seen[t] = 1; out.push({ t: t, ok: false, why: w[1] || '再想想看～' }); } });
    return shuffle(out);
  }
  /* 數字選項：先放指定的錯誤選項（附針對性說明），不夠再用中性的「多一點／少一點」補，不亂說正負號 */
  function nOpts(ok, wr, nonneg) {
    var okS = cleanVal(ok), okN = parseFloat(okS), isInt = isNum(okS) && okN === Math.round(okN), out = [{ t: okS, ok: true }], seen = {}; seen[okS] = 1;
    var add = function (v, why) {
      var t = cleanVal(v); if (t === '' || t === 'NaN' || /Infinity/.test(t) || seen[t] || out.length >= 4) return;
      if (isNum(t)) { var nv = parseFloat(t); if (isInt && nv !== Math.round(nv)) return; if (nonneg && nv < 0) return; }
      seen[t] = 1; out.push({ t: t, ok: false, why: why || '再算一次。' });
    };
    (wr || []).forEach(function (w) { if (Array.isArray(w) && w.length > 2 && !w[2]) return; add(Array.isArray(w) ? w[0] : w, Array.isArray(w) ? w[1] : ''); });
    if (isNum(okS)) { var st = isInt ? 1 : 0.1; [[okN + st, '多算了一點，再檢查一次。'], [okN - st, '少算了一點，再檢查一次。'], [okN + 2 * st, '差比較多，再檢查一次。'], [okN - 2 * st, '差比較多，再檢查一次。']].forEach(function (w) { add(w[0], w[1]); }); }
    return shuffle(out);
  }
  function fOpts(whyFn) {
    var ans = String(CURQ.ans), ansNum = isNum(ans), seen = {};
    var os = (CURQ.options || []).map(String).filter(function (o) { if (seen[o]) return false; seen[o] = 1; return o === ans || isNum(o) === ansNum; });
    if (os.indexOf(ans) < 0) os.unshift(ans);
    if (os.length > 4) { os = os.filter(function (o) { return o !== ans; }).slice(0, 3).concat([ans]); }
    return shuffle(os.map(function (o) { var ok = o === ans; return { t: o, ok: ok, why: ok ? '' : whyFn(o) }; }));
  }
  function conceptPlan(s1say, s1hint, s1ok, s1wr, line1, s2say, s2hint, whyFn) {
    return { steps: [stp(s1say, s1hint, txOpts(s1ok, s1wr), line1), stp(s2say, s2hint, fOpts(whyFn), String(CURQ.ans))], final: String(CURQ.ans) };
  }
  function lcmN(a, b) { return Math.abs(a * b) / gcdN(a, b); }

  // ---- 1-1-2 is / isFrac / isDec：代入看左邊是不是等於右邊 ----
  function planIs(t, frac) {
    var m = /方程式\s*(.+?)\s*=\s*(\S+?)\s*(?:（[^）]*）)?\s*有下列四組數對/.exec(t);
    if (!m || !CURQ || !CURQ.options) return null;
    var L = linParse(m[1]), R = numOf(m[2]); if (!L || isNaN(R)) return null;
    var f = function (v) { return fmtF(v, frac); }, val = function (p) { return L.a * p[0] + L.b * p[1]; };
    var ans = String(CURQ.ans), pa = pairOf(ans); if (!pa || Math.abs(val(pa) - R) > 1e-9) return null;
    var wrongs = CURQ.options.map(String).filter(function (o) { return o !== ans && pairOf(o); }); if (!wrongs.length) return null;
    var s1 = stp('要知道一組 (x, y) 是不是<b>解</b>，要怎麼檢查？', '「解」的意思：代進去之後，等號兩邊會一樣大。',
      txOpts('把 x、y 的值代進去，左邊要等於 ' + m[2], [['只要 x 比 y 大就是解', '解跟誰大誰小沒有關係，要代進去算。'], ['只要兩個數都是整數就是解', '不一定喔，要代進去看左邊是不是 ' + m[2] + '。'], ['x、y 隨便選都可以', '不是隨便選的，要讓等式成立才是解。']]),
      '檢查方法：代入，左邊要等於 ' + m[2]);
    var all = CURQ.options.map(String).filter(function (o) { return pairOf(o); });
    var sols = all.filter(function (o) { return Math.abs(val(pairOf(o)) - R) < 1e-9; }); if (all.length < 2 || sols.length !== 1 || sols[0] !== ans) return null;
    var cands = all.map(function (o) {
      var pw = pairOf(o), vw = val(pw), sol = Math.abs(vw - R) < 1e-9;
      var a1 = stp('把 <b>' + esc(o) + '</b>（x = ' + f(pw[0]) + '，y = ' + f(pw[1]) + '）代進 ' + esc(m[1]) + '，左邊等於多少？',
        '括號裡第一個數是 x，第二個數是 y。把它們放進 ' + esc(m[1]) + '，照樣子乘起來再加（減）起來。',
        nOpts(f(vw), [[f(val([pw[1], pw[0]])), 'x、y 放反位置了：括號裡第一個數是 x，第二個數是 y。'], [f(val([-pw[0], pw[1]])), 'x 的正負號看錯了。'], [f(val([pw[0], -pw[1]])), 'y 的正負號看錯了。'], [f(vw + 1), '再算一次乘法。']]),
        '代入 ' + o + '：左邊 = ' + f(vw) + '（要 ' + m[2] + '）');
      var yes = '一樣，所以 ' + o + ' 是解', no = '不一樣，所以 ' + o + ' 不是解';
      var a2 = stp('左邊是 ' + f(vw) + '，要剛好等於 <b>' + esc(m[2]) + '</b> 才是解。' + f(vw) + ' 和 ' + esc(m[2]) + ' 一樣嗎？', '左邊要剛好等於 ' + m[2] + ' 才算是解。',
        txOpts(sol ? yes : no, [[sol ? no : yes, sol ? '左邊剛好是 ' + m[2] + '，兩邊一樣。' : '左邊是 ' + f(vw) + '，不等於 ' + m[2] + '。']]), sol ? o + ' 是解' : o + ' 不是解');
      return { label: o, steps: [a1, a2], isSol: sol };
    });
    var w = walkPlan(cands, '要找出<b>解</b>，就把每一組數對<b>一個一個代進去</b>檢查，左邊剛好等於 ' + esc(m[2]) + ' 的才是解。<br>先挑一組你想試的吧！（挑哪個都可以，不是解就換下一組）', '隨便挑一組來代入都可以；左邊剛好等於 ' + m[2] + ' 就是解，不是就換下一組。', ans);
    return { steps: [s1].concat(w.steps), final: ans };
  }
  addPlanner('is', function (t) { return planIs(t, false); });
  addPlanner('isFrac', function (t) { return planIs(t, true); });
  addPlanner('isDec', function (t) { return planIs(t, false); });

  // ---- 1-1-3 countsol：非負整數解有幾組 ----
  function rangeTxt(arr) {
    if (!arr.length) return '沒有任何一個 x';
    var consec = arr.every(function (v, i) { return i === 0 || v === arr[i - 1] + 1; });
    if (consec && arr.length > 5) return 'x = ' + arr[0] + '、' + arr[1] + '、' + arr[2] + '、…、' + arr[arr.length - 1] + '（全部都行）';
    return 'x = ' + arr.join('、');
  }
  addPlanner('countsol', function (t) {
    var m = /即\s*(\d+)x\s*\+\s*(\d+)y\s*=\s*(\d+)/.exec(t); if (!m) return null;
    var a = +m[1], b = +m[2], c = +m[3], mx = Math.floor(c / a), xs = [], all = [], i;
    for (i = 0; i <= mx; i++) { all.push(i); if ((c - a * i) % b === 0) xs.push(i); }
    if (String(xs.length) !== String(CURQ.ans)) return null;
    var txt = rangeTxt, cands = [], seen = {}; seen[txt(xs)] = 1;
    [[all, '不是每個 x 都行：剩下的錢 ' + c + ' − ' + a + '×x 要剛好除盡（沒有餘數），y 才是整數。'], [all.filter(function (v) { return xs.indexOf(v) < 0; }), '你選到的是「不行」的那些 x，把可以和不可以弄反了。'], [xs.slice(0, -1), '漏掉了一個可以的 x，從 0 到 ' + mx + ' 再檢查一次。'], [xs.concat([mx + 1]), 'x = ' + (mx + 1) + ' 會讓 ' + a + '×x 超過 ' + c + '，不行。']].forEach(function (w) { var tt = txt(w[0]); if (w[0].length && !seen[tt]) { seen[tt] = 1; cands.push([tt, w[1]]); } });
    if (!cands.length) cands.push(['x = ' + all.join('、'), '再檢查一次。']);
    var s1 = stp('<b>x</b> 是「每個 ' + a + ' 元」的那種東西用了幾個。總共才 ' + c + ' 元，x 最多能是多少？（' + a + '×x 不能超過 ' + c + '）', '用 ' + c + ' ÷ ' + a + '，只看整數部分。（「非負整數」就是 0、1、2、3…，不會是負的。）',
      nOpts(mx, [[mx + 1, a + '×' + (mx + 1) + ' = ' + a * (mx + 1) + '，已經超過 ' + c + ' 了。'], [mx - 1, '還可以再多一個喔。'], [c, '那樣金額會爆掉，x 沒辦法用到 ' + c + ' 個。']], true), 'x 最多 ' + mx);
    var ex = all.filter(function (v) { return xs.indexOf(v) < 0; })[0]; if (ex === undefined) ex = 0;
    var rest = c - a * ex, ok2 = rest % b === 0;
    var s2a = stp('舉個例子，如果 <b>x = ' + ex + '</b>，剩下的錢 ' + c + ' − ' + a + '×' + ex + ' 是多少？', '先算 ' + a + '×' + ex + '，再用 ' + c + ' 去減。', nOpts(rest, [[c + a * ex, '剩下的錢要用「減」的。'], [a * ex, '那是已經用掉的錢，剩下的要用 ' + c + ' 去減。']], true), 'x = ' + ex + ' → 剩 ' + rest);
    var s2b = stp('剩下的 ' + rest + ' 元要全部用 ' + b + ' 元的那種來湊，要「剛好除盡」（' + rest + ' ÷ ' + b + ' 沒有餘數）。可以嗎？', '除不盡就代表 y 不是整數，這組就不行。', txOpts(ok2 ? '可以，剛好除盡' : '不行，除不盡（有餘數）', [[ok2 ? '不行，除不盡（有餘數）' : '可以，剛好除盡', rest + ' ÷ ' + b + ' = ' + fmtF(rest / b) + (ok2 ? '，剛好除盡。' : '，不是整數（除不盡）。')]]), 'x = ' + ex + (ok2 ? ' 可以' : ' 不行'));
    var s2 = stp('其他的 x（從 0 到 ' + mx + '）也這樣一個一個檢查。哪些 x 可以剛好除盡？', '每個 x 都算「' + c + ' − ' + a + '×x」，看能不能被 ' + b + ' 整除（沒有餘數）。', txOpts(txt(xs), cands), '可以的 ' + txt(xs));
    var s3 = stp('可以的 x 有 ' + xs.length + ' 個，所以共有幾種組合？', '一個可以的 x，就對應一組解。', nOpts(xs.length, [[xs.length + 1, '多數了。'], [xs.length - 1, '少數了，再數一次。'], [mx + 1, '那是 x 能取的所有值，不一定都能配出整數 y。']], true), '共 ' + xs.length + ' 種');
    return { steps: [s1, s2a, s2b, s2, s3], final: String(xs.length) };
  });

  // ---- 1-2-1 both：同時滿足兩個方程式 ----
  addPlanner('both', function (t) {
    var m = /①\s*(.+?)\s*=\s*(-?[\d.\/]+)\s*②\s*(.+?)\s*=\s*(-?[\d.\/]+)\s*下列哪一組數對/.exec(t); if (!m || !CURQ.options) return null;
    var L1 = linParse(m[1]), L2 = linParse(m[3]), R1 = numOf(m[2]), R2 = numOf(m[4]); if (!L1 || !L2 || isNaN(R1) || isNaN(R2)) return null;
    var st = function (p) { return [Math.abs(L1.a * p[0] + L1.b * p[1] - R1) < 1e-9, Math.abs(L2.a * p[0] + L2.b * p[1] - R2) < 1e-9]; };
    var f = function (v) { return fmtF(v, true); };
    var ans = String(CURQ.ans), pa = pairOf(ans); if (!pa || !st(pa)[0] || !st(pa)[1]) return null;
    var all = CURQ.options.map(String).filter(function (o) { return pairOf(o); });
    var sols = all.filter(function (o) { var q2 = st(pairOf(o)); return q2[0] && q2[1]; }); if (all.length < 2 || sols.length !== 1 || sols[0] !== ans) return null;
    var names = ['①、②都成立', '只有①成立', '只有②成立', '①、②都不成立'];
    var key = function (s) { return s[0] && s[1] ? 0 : s[0] ? 1 : s[1] ? 2 : 3; };
    var s1 = stp('「<b>同時</b>滿足①和②」是什麼意思？', '同時＝兩個都要，少一個都不行。', txOpts('①和②代進去都要成立', [['只要①成立就好', '「同時」是兩個都要成立。'], ['只要②成立就好', '「同時」是兩個都要成立。'], ['只要 x、y 看起來差不多就好', '要真的代進去算，兩個式子都要成立。']]), '同時＝①和②都成立');
    var cands = all.map(function (o) {
      var pw = pairOf(o), sw = st(pw), v1 = L1.a * pw[0] + L1.b * pw[1], v2 = L2.a * pw[0] + L2.b * pw[1];
      var wrs = names.map(function (n) { return [n, '再代一次：①的左邊是 ' + f(v1) + '（要 ' + m[2] + '），②的左邊是 ' + f(v2) + '（要 ' + m[4] + '）。']; }).filter(function (w, i) { return i !== key(sw); });
      var a1 = stp('把 <b>' + esc(o) + '</b>（x = ' + f(pw[0]) + '，y = ' + f(pw[1]) + '）代進①和②，結果是哪一種？', '分別算①的左邊、②的左邊，跟右邊比一比。', txOpts(names[key(sw)], wrs), esc(o) + '：' + names[key(sw)]);
      return { label: o, steps: [a1], isSol: sw[0] && sw[1] };
    });
    var w = walkPlan(cands, '要找出同時滿足①和②的數對，就把每一組<b>一個一個代進去</b>檢查，①、②都成立的才是答案。<br>先挑一組你想試的吧！（挑哪個都可以，不是就換下一組）', '隨便挑一組來代入都可以；①、②都成立就是答案，不是就換下一組。', ans);
    return { steps: [s1].concat(w.steps), final: ans };
  });

  // ---- 1-2-3 elimMix：先同乘變整數／配成相同係數，再加減消去 ----
  function scaleInt(e) {
    var Ls = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 30, 100, 60], i;
    for (i = 0; i < Ls.length; i++) { var L = Ls[i]; if ([e.a, e.b, e.e].every(function (v) { return Math.abs(v * L - Math.round(v * L)) < 1e-9; })) return { L: L, a: Math.round(e.a * L), b: Math.round(e.b * L), e: Math.round(e.e * L) }; }
    return null;
  }
  addPlanner('elimMix', function (t) {
    var m = /①\s*(.+?)\s*=\s*(-?[\d.\/]+)\s*②\s*(.+?)\s*=\s*(-?[\d.\/]+)\s*解聯立方程式，求出\s*([xy])/.exec(t); if (!m) return null;
    var l1 = linParse(m[1]), l2 = linParse(m[3]), r1 = numOf(m[2]), r2 = numOf(m[4]); if (!l1 || !l2 || isNaN(r1) || isNaN(r2)) return null;
    var raw = [{ a: l1.a, b: l1.b, e: r1, lab: '①' }, { a: l2.a, b: l2.b, e: r2, lab: '②' }], steps = [], eqs = [];
    for (var i = 0; i < 2; i++) {
      var e = raw[i], si = scaleInt(e); if (!si || !si.a || !si.b) return null;
      if (si.L > 1) {
        var good = eq2(si.a, si.b, si.e), rawE = fmtF(e.e, true);
        steps.push(stp(e.lab + ' 裡有小數或分數，先把整條式子<b>兩邊同乘 ' + si.L + '</b>，變成整數。乘完後 ' + e.lab + ' 會變成哪一個？', '左邊每一項、右邊的數都要乘 ' + si.L + '。',
          txOpts(good, [[eq2(si.a, si.b, rawE), '右邊的數也要一起乘 ' + si.L + '，不能漏掉。'], [eq2(-si.a, si.b, si.e), '乘的是正數，正負號不會變。'], [eq2(si.a, -si.b, si.e), '乘的是正數，正負號不會變。']]), e.lab + '×' + si.L + '：' + good));
      }
      eqs.push(si);
    }
    var A = eqs[0], B = eqs[1], same = Math.abs(A.a) === Math.abs(B.a) || Math.abs(A.b) === Math.abs(B.b), mm = [1, 1];
    if (!same) {
      var Lx = lcmN(A.a, B.a), Ly = lcmN(A.b, B.b), useX = Lx < Ly, Lv = useX ? Lx : Ly;
      mm = [Lv / Math.abs(useX ? A.a : A.b), Lv / Math.abs(useX ? B.a : B.b)];
      A = { a: A.a * mm[0], b: A.b * mm[0], e: A.e * mm[0] }; B = { a: B.a * mm[1], b: B.b * mm[1], e: B.e * mm[1] };
      var ev = Math.abs(A.b) === Math.abs(B.b) ? 'y' : 'x', c1 = ev === 'x' ? eqs[0].a : eqs[0].b, c2 = ev === 'x' ? eqs[1].a : eqs[1].b;
      var mt = function (a, b) { return (a === 1 ? '①不用乘' : '①×' + a) + '、' + (b === 1 ? '②不用乘' : '②×' + b); };
      var why = '這樣 ' + ev + ' 的係數大小還是不一樣，消不掉。';
      var wr = [[mt(mm[1], mm[0]), why], [mt(mm[0], mm[0]), why], [mt(mm[0] + 1, mm[1]), why], [mt(mm[0], mm[1] + 1), why]].filter(function (w) { return w[0] !== mt(mm[0], mm[1]); });
      steps.push(stp('要消去 <b>' + ev + '</b>：現在 ① 的 ' + ev + ' 係數是 ' + c1 + '，② 的是 ' + c2 + '。①、② 要各乘多少，才能讓 ' + ev + ' 的係數「大小一樣」？', '找出兩個係數的最小公倍數，再想想各要乘幾倍才會變成它。', txOpts(mt(mm[0], mm[1]), wr),
        '新的①：' + eq2(A.a, A.b, A.e) + '；新的②：' + eq2(B.a, B.b, B.e)));
    } else { A = { a: A.a, b: A.b, e: A.e }; B = { a: B.a, b: B.b, e: B.e }; }
    var txt = '①' + eq2(A.a, A.b, A.e) + '　②' + eq2(B.a, B.b, B.e) + '　解聯立方程式，求出 ' + m[5] + ' 的值。';
    var pl = PLANNERS.elim(txt); if (!pl) return null;
    if (steps.length) pl.steps[0].say = '現在的兩式是：<br><b>① ' + eq2(A.a, A.b, A.e) + '</b>　<b>② ' + eq2(B.a, B.b, B.e) + '</b><br>' + pl.steps[0].say;
    return { steps: steps.concat(pl.steps), final: pl.final };
  });

  // ---- 1-1-1 expr / exprDiff：列式 ----
  function exprCommon(t) {
    var pr = [], re = /（每[^0-9（）]*?(\d+)\s*元）/g, m; while ((m = re.exec(t))) pr.push(+m[1]);
    return pr.length === 2 ? pr : null;
  }
  function exprWhy(o, p1, p2, diff) {
    var n = norm(o);
    if (n.indexOf('+') >= 0 && diff) return '「多花多少」是兩個人的花費「相減」，不是相加。';
    if (n.charAt(0) === '(') return '要先算各自的花費（單價×數量）再合起來，不能把單價先加起來。';
    if (!diff && n.indexOf('-') >= 0) return '「總共」是兩種東西的花費「相加」，不是相減。';
    if (diff && n === norm(p2 + 'y-' + p1 + 'x')) return '順序反了：是「比較多的人」減「比較少的人」，題目問誰比誰多，誰就放前面。';
    return '單價和數量配錯了：x 的單價是 ' + p1 + '，y 的單價是 ' + p2 + '。';
  }
  addPlanner('expr', function (t) {
    var p = exprCommon(t); if (!p || /多花/.test(t)) return null;
    var sA = stp('先看第一種：x 個、每個 <b>' + p[0] + ' 元</b>，花費是多少元？', '花費 = 單價 × 數量（字母前面的數字就是單價）。', txOpts(p[0] + 'x', [[p[1] + 'x', p[1] + ' 是另一種東西的單價。'], [p[0] + ' + x', '單價和數量要「相乘」，不是相加。'], ['x ÷ ' + p[0], '單價和數量要「相乘」，不是相除。']]), '第一種：' + p[0] + 'x 元');
    var sB = stp('再看第二種：y 個、每個 <b>' + p[1] + ' 元</b>，花費是多少元？', '花費 = 單價 × 數量。', txOpts(p[1] + 'y', [[p[0] + 'y', p[0] + ' 是另一種東西的單價。'], [p[1] + ' + y', '單價和數量要「相乘」，不是相加。'], ['y ÷ ' + p[1], '單價和數量要「相乘」，不是相除。']]), '第二種：' + p[1] + 'y 元');
    var sC = stp('兩種東西的花費 <b>' + p[0] + 'x</b> 和 <b>' + p[1] + 'y</b>，合起來要怎麼列式？', '「總共」就是把兩種的花費加起來。', fOpts(function (o) { return exprWhy(o, p[0], p[1], false); }), String(CURQ.ans));
    return { steps: [sA, sB, sC], final: String(CURQ.ans) };
  });
  addPlanner('exprDiff', function (t) {
    var p = exprCommon(t); var nm = /。\s*(\S+?)比(\S+?)多花/.exec(t) || /，\s*(\S+?)比(\S+?)多花/.exec(t); if (!p || !nm) return null;
    var sA = stp(nm[1] + '：x 個、每個 <b>' + p[0] + ' 元</b>，花費是多少元？', '花費 = 單價 × 數量。', txOpts(p[0] + 'x', [[p[1] + 'x', p[1] + ' 是另一個人買的東西的單價。'], [p[0] + ' + x', '單價和數量要「相乘」，不是相加。'], ['x ÷ ' + p[0], '單價和數量要「相乘」，不是相除。']]), nm[1] + '花 ' + p[0] + 'x 元');
    var sB = stp(nm[2] + '：y 個、每個 <b>' + p[1] + ' 元</b>，花費是多少元？', '花費 = 單價 × 數量。', txOpts(p[1] + 'y', [[p[0] + 'y', p[0] + ' 是另一個人買的東西的單價。'], [p[1] + ' + y', '單價和數量要「相乘」，不是相加。'], ['y ÷ ' + p[1], '單價和數量要「相乘」，不是相除。']]), nm[2] + '花 ' + p[1] + 'y 元');
    var sC = stp('「' + nm[1] + '比' + nm[2] + '多花多少」要怎麼算？', '想想看：比較多的減掉比較少的，就是多出來的部分。', txOpts('「' + nm[1] + '的花費」減去「' + nm[2] + '的花費」', [['「' + nm[1] + '的花費」加上「' + nm[2] + '的花費」', '加起來是「一共」，題目問的是「多多少」。'], ['「' + nm[2] + '的花費」減去「' + nm[1] + '的花費」', '順序反了：是' + nm[1] + '比' + nm[2] + '多，所以' + nm[1] + '放前面。']]), '多花 = ' + nm[1] + ' − ' + nm[2]);
    var sD = stp('把 <b>' + p[0] + 'x</b> 和 <b>' + p[1] + 'y</b> 照剛剛的算法列成式子：', '前面是' + nm[1] + '的花費，後面是' + nm[2] + '的花費，中間用減號。', fOpts(function (o) { return exprWhy(o, p[0], p[1], true); }), String(CURQ.ans));
    return { steps: [sA, sB, sC, sD], final: String(CURQ.ans) };
  });

  /* ===== plan4b：第 2 章（坐標）補齊 ===== */
  var QUAD_POS = { '一': '右上', '二': '左上', '三': '左下', '四': '右下' };
  var QUAD_SIGN = { '一': [1, 1], '二': [-1, 1], '三': [-1, -1], '四': [1, -1] };
  function quadOf(x, y) { return x > 0 && y > 0 ? '一' : x < 0 && y > 0 ? '二' : x < 0 && y < 0 ? '三' : x > 0 && y < 0 ? '四' : ''; }
  function pairStr(p) { return '(' + p[0] + ', ' + p[1] + ')'; }

  // 2-1-1 word：用文字描述找坐標
  addPlanner('word', function (t) {
    var m = /距離\s*y\s*軸(左|右)方\s*(\d+)\s*單位、距離\s*x\s*軸(上|下)方\s*(\d+)\s*單位/.exec(t); if (!m) return null;
    var X = (m[1] === '右' ? 1 : -1) * +m[2], Y = (m[3] === '上' ? 1 : -1) * +m[4];
    var s1 = stp('「距離 y 軸" + m[1] + "方 " + m[2] + " 單位」是左右的位置，它決定 <b>x 坐標</b>。右邊是正、左邊是負，所以 x 坐標是多少？', '右邊是正數，左邊是負數。', nOpts(X, [[-X, '方向弄反了：右邊是正、左邊是負。'], [Y, '這是上下的位置，決定的是 y 坐標。'], [-Y, '這是上下的位置，決定的是 y 坐標。']]), 'x = ' + X);
    s1.say = '「距離 y 軸' + m[1] + '方 ' + m[2] + ' 單位」是左右的位置，它決定 <b>x 坐標</b>。右邊是正、左邊是負，所以 x 坐標是多少？';
    var s2 = stp('「距離 x 軸' + m[3] + '方 ' + m[4] + ' 單位」是上下的位置，它決定 <b>y 坐標</b>。上面是正、下面是負，所以 y 坐標是多少？', '上面是正數，下面是負數。', nOpts(Y, [[-Y, '方向弄反了：上面是正、下面是負。'], [X, '這是左右的位置，決定的是 x 坐標。'], [-X, '這是左右的位置，決定的是 x 坐標。']]), 'y = ' + Y);
    var s3 = stp('坐標要寫成 (x, y)：x 在前、y 在後。寫出來是？', '(x 坐標, y 坐標)，先左右、再上下。', fOpts(function (o) { var p = pairOf(o); if (!p) return '再看一次。'; if (p[0] === Y && p[1] === X && X !== Y) return 'x、y 放反位置了：x 在前，y 在後。'; if (p[0] === -X) return 'x 坐標的正負號看錯了。'; return 'y 坐標的正負號看錯了。'; }), '坐標 ' + pairStr([X, Y]));
    return { steps: [s1, s2, s3], final: String(CURQ.ans) };
  });

  // 2-1-1 origin
  function originWhy(o) {
    var m = /^(.*?)\s*\((-?\d+),\s*(-?\d+)\)$/.exec(String(o).replace(/[−－]/g, '-'));
    if (!m) return '再想想：兩條軸交會的點離兩條軸都是 0 個單位。';
    if (m[2] !== '0' || m[3] !== '0') return '原點離兩條軸都是 0 個單位，坐標是 (0, 0)，不是 (' + m[2] + ', ' + m[3] + ')。';
    return '兩條軸交會的點，名字叫「原點」。';
  }
  addPlanner('origin', function (t) {
    if (/交點，有一個特別的名字/.test(t)) {
      var a1 = stp('x 軸（橫的）和 y 軸（直的）交會在一個點。這個點離兩條軸各有幾個單位？', '交會的地方，兩條軸都「剛好經過」。', nOpts(0, [[1, '交會點就在軸上，離軸是 0 個單位。'], [5, '交會點就在軸上，離軸是 0 個單位。'], [-1, '距離不會是負的，而且交會點離軸是 0。']]), '離兩條軸都是 0');
      var a2 = stp('所以這個點的坐標是 (0, 0)，名字叫什麼？選出正確的說法：', '它是坐標系的起點，叫「原點」。', fOpts(originWhy), String(CURQ.ans));
      return { steps: [a1, a2], final: String(CURQ.ans) };
    }
    var pts = {}, re = /([甲乙丙丁])\(([^)]*)\)/g, m; while ((m = re.exec(t))) pts[m[1]] = m[2];
    if (Object.keys(pts).length < 3) return null;
    var s1 = stp('「原點」是兩條軸交會的地方，它的坐標是什麼？', '原點在最中間，離兩條軸都是 0。', txOpts('(0, 0)', [['(1, 1)', '1 是離軸一個單位，原點是 0。'], ['(0, 1)', '原點的 y 坐標也要是 0。'], ['(1, 0)', '原點的 x 坐標也要是 0。']]), '原點 = (0, 0)');
    var s2 = stp('哪一個點的坐標是 <b>(0, 0)</b>？', '兩個數都是 0 才是原點。', fOpts(function (o) { return pts[o] ? '「' + o + '」的坐標是 (' + pts[o] + ')，不是 (0, 0)。' : '再看一次。'; }), '答案 ' + CURQ.ans);
    return { steps: [s1, s2], final: String(CURQ.ans) };
  });

  // 2-1-1 compare：比較 x 或 y 坐標
  addPlanner('compare', function (t) {
    var m = /比較(\S+?)點\s*\(([^)]+)\)\s*與(\S+?)點\s*\(([^)]+)\)，哪一點的\s*([xy])\s*坐標比較(大|小)/.exec(t); if (!m) return null;
    var pa = pairOf('(' + m[2] + ')'), pb = pairOf('(' + m[4] + ')'); if (!pa || !pb) return null;
    var k = m[5] === 'x' ? 0 : 1, a = pa[k], b = pb[k], bigger = m[6] === '大';
    var s1 = stp('坐標 (x, y) 裡，<b>' + m[5] + ' 坐標</b>是括號裡的第幾個數？', 'x 在前（逗號左邊），y 在後（逗號右邊）。', txOpts(k === 0 ? '第一個數（逗號左邊）' : '第二個數（逗號右邊）', [[k === 0 ? '第二個數（逗號右邊）' : '第一個數（逗號左邊）', '看反了：x 在前、y 在後。'], ['兩個數加起來', '坐標是一個一個看的，不用加。']]), m[5] + ' 坐標 = ' + (k === 0 ? '第一個數' : '第二個數'));
    var s2 = stp(m[1] + '的 ' + m[5] + ' 坐標是 <b>' + a + '</b>，' + m[3] + '的 ' + m[5] + ' 坐標是 <b>' + b + '</b>。哪一點的 ' + m[5] + ' 坐標比較' + m[6] + '？', '負數越小越靠左（越靠下）；正數越大越靠右（越靠上）。', fOpts(function (o) {
      if (o === '一樣大') return '兩個數是 ' + a + ' 和 ' + b + '，不一樣大。';
      if (o === '看不出來') return '把數字找出來比一比就看得出來了：' + a + ' 和 ' + b + '。';
      var mine = o === m[1] ? a : b, other = o === m[1] ? b : a;
      return o + ' 的是 ' + mine + '，' + (a === b ? '兩個一樣大。' : '它比 ' + other + (mine > other ? ' 大' : ' 小') + '，不是比較' + m[6] + '的。');
    }), '答案 ' + CURQ.ans);
    return { steps: [s1, s2], final: String(CURQ.ans) };
  });

  // 2-1-1 read：看圖寫出 P 點坐標（答案藏在圖裡，用答案反推教學）
  addPlanner('read', function (t) {
    if (!/寫出\s*P\s*點的坐標/.test(t)) return null;
    var pa = pairOf(CURQ.ans); if (!pa) return null; var X = pa[0], Y = pa[1];
    var s1 = stp('先看 P 點在<b>左右</b>的位置：從 y 軸（直的那條）往右或往左數，P 的 x 坐標是多少？', '往右是正、往左是負；數格子要從 y 軸數起。', nOpts(X, [[-X, '方向弄反了：右邊是正、左邊是負。'], [Y, '那是上下的位置，是 y 坐標。'], [-Y, '那是上下的位置，是 y 坐標。']]), 'x = ' + X);
    var s2 = stp('再看<b>上下</b>的位置：從 x 軸（橫的那條）往上或往下數，P 的 y 坐標是多少？', '往上是正、往下是負；數格子要從 x 軸數起。', nOpts(Y, [[-Y, '方向弄反了：上面是正、下面是負。'], [X, '那是左右的位置，是 x 坐標。'], [-X, '那是左右的位置，是 x 坐標。']]), 'y = ' + Y);
    var s3 = stp('寫成 (x, y)，x 在前、y 在後：', '先左右、再上下。', fOpts(function (o) { var p = pairOf(o); if (!p) return '再看一次。'; return p[0] === Y && p[1] === X ? 'x、y 放反位置了。' : '正負號要跟圖上的位置一樣，再看一次。'; }), '坐標 ' + String(CURQ.ans));
    return { steps: [s1, s2, s3], final: String(CURQ.ans) };
  });

  // 2-1-2 quadrant
  addPlanner('quadrant', function (t) {
    var m = /點\s*P\s*\((-?\d+),\s*(-?\d+)\)\s*位在哪一個象限/.exec(t); if (!m) return null;
    var x = +m[1], y = +m[2], q4 = quadOf(x, y);
    var sgn = function (v, n) { return v > 0 ? '正數（在 ' + (n === 'x' ? 'y 軸右邊' : 'x 軸上面') + '）' : v < 0 ? '負數（在 ' + (n === 'x' ? 'y 軸左邊' : 'x 軸下面') + '）' : '0（剛好在軸上）'; };
    var op = function (v, n) { var all = ['正數（在 ' + (n === 'x' ? 'y 軸右邊' : 'x 軸上面') + '）', '負數（在 ' + (n === 'x' ? 'y 軸左邊' : 'x 軸下面') + '）', '0（剛好在軸上）']; return all.filter(function (z) { return z !== sgn(v, n); }).map(function (z) { return [z, n + ' 坐標是 ' + v + '，再看一次它是正、負還是 0。']; }); };
    var s1 = stp('先看 <b>x 坐標 ' + x + '</b>，它是正數、負數，還是 0？', '正數在 y 軸右邊，負數在左邊，0 剛好在 y 軸上。', txOpts(sgn(x, 'x'), op(x, 'x')), 'x = ' + x + '：' + sgn(x, 'x').split('（')[0]);
    var s2 = stp('再看 <b>y 坐標 ' + y + '</b>，它是正數、負數，還是 0？', '正數在 x 軸上面，負數在下面，0 剛好在 x 軸上。', txOpts(sgn(y, 'y'), op(y, 'y')), 'y = ' + y + '：' + sgn(y, 'y').split('（')[0]);
    var fin = String(CURQ.ans);
    var s3 = stp('口訣：一正正、二負正、三負負、四正負。這一點在哪裡？', '只要有一個坐標是 0，就不在任何象限裡。', fOpts(function (o) {
      var mq = /第(.)象限/.exec(o);
      if (mq) { var sg2 = QUAD_SIGN[mq[1]]; return '第' + mq[1] + '象限是 x ' + (sg2[0] > 0 ? '正' : '負') + '、y ' + (sg2[1] > 0 ? '正' : '負') + '，這一點是 x ' + (x > 0 ? '正' : x < 0 ? '負' : '0') + '、y ' + (y > 0 ? '正' : y < 0 ? '負' : '0') + '。'; }
      if (/原點/.test(o)) return '原點要 x、y 都是 0。'; if (/x 軸/.test(o)) return '在 x 軸上代表 y 坐標是 0。'; if (/y 軸/.test(o)) return '在 y 軸上代表 x 坐標是 0。'; return '再想想口訣。';
    }), fin);
    return { steps: [s1, s2, s3], final: fin };
  });

  // 2-1-2 sign：象限 → 正負
  addPlanner('sign', function (t) {
    var mv = /x 坐標是(正數|負數)、y 坐標是(正數|負數)，這個點會在第幾象限/.exec(t);
    if (mv) {
      var sx = mv[1] === '正數' ? 1 : -1, sy = mv[2] === '正數' ? 1 : -1, qk = quadOf(sx, sy);
      var d1 = stp('x 坐標是' + mv[1] + '：點在 y 軸（直的那條）的左邊還是右邊？', '正數在右邊，負數在左邊。', txOpts(sx > 0 ? '右邊' : '左邊', [[sx > 0 ? '左邊' : '右邊', mv[1] + '在 y 軸的' + (sx > 0 ? '右' : '左') + '邊。']]), sx > 0 ? '在右邊' : '在左邊');
      var d2 = stp('y 坐標是' + mv[2] + '：點在 x 軸（橫的那條）的上面還是下面？', '正數在上面，負數在下面。', txOpts(sy > 0 ? '上面' : '下面', [[sy > 0 ? '下面' : '上面', mv[2] + '在 x 軸的' + (sy > 0 ? '上' : '下') + '面。']]), sy > 0 ? '在上面' : '在下面');
      var d3 = stp('口訣：一在右上、二在左上、三在左下、四在右下。這一點在第幾象限？', '把「左右」和「上下」合起來。', fOpts(function (o) { var m2 = /第(.)象限/.exec(o); return m2 ? '第' + m2[1] + '象限在' + QUAD_POS[m2[1]] + '，這一點在' + QUAD_POS[qk] + '。' : '再看一次。'; }), String(CURQ.ans));
      return { steps: [d1, d2, d3], final: String(CURQ.ans) };
    }
    var m = /在第(一|二|三|四)象限，那麼/.exec(t); if (!m) return null;
    var s1 = stp('第' + m[1] + '象限在整張坐標圖的哪個位置？', '一在右上、二在左上、三在左下、四在右下（逆時針轉）。', txOpts(QUAD_POS[m[1]], Object.keys(QUAD_POS).filter(function (k) { return k !== m[1]; }).map(function (k) { return [QUAD_POS[k], '那是第' + k + '象限的位置。']; })), '第' + m[1] + '象限在' + QUAD_POS[m[1]]);
    var s2 = stp('在' + QUAD_POS[m[1]] + '：x 是在 y 軸的左邊還是右邊？y 是在 x 軸的上面還是下面？這樣正負關係是？', '右邊的 x 是正、左邊是負；上面的 y 是正、下面是負。', fOpts(function (o) {
      var mm = /x\s*([<>])\s*0,\s*y\s*([<>])\s*0/.exec(o); if (!mm) return '再看一次。'; var sx = mm[1] === '>' ? 1 : -1, sy = mm[2] === '>' ? 1 : -1, qk = quadOf(sx, sy);
      return '這個正負組合是第' + qk + '象限（' + QUAD_POS[qk] + '），不是第' + m[1] + '象限。';
    }), String(CURQ.ans));
    return { steps: [s1, s2], final: String(CURQ.ans) };
  });

  // 2-1-2 axis：落在哪條軸
  addPlanner('axis', function (t) {
    var m = /點\s*\((-?\d+),\s*(-?\d+)\)\s*是落在/.exec(t); if (!m) return null;
    var x = +m[1], y = +m[2], st2 = x === 0 && y === 0 ? '兩個坐標都是 0' : x === 0 ? 'x 坐標是 0（y 坐標不是）' : y === 0 ? 'y 坐標是 0（x 坐標不是）' : '兩個坐標都不是 0';
    var all = ['兩個坐標都是 0', 'x 坐標是 0（y 坐標不是）', 'y 坐標是 0（x 坐標不是）', '兩個坐標都不是 0'];
    var s1 = stp('(' + x + ', ' + y + ') 裡，哪個坐標是 0？', 'x 是逗號左邊的數，y 是逗號右邊的數。', txOpts(st2, all.filter(function (z) { return z !== st2; }).map(function (z) { return [z, '再看一次：x = ' + x + '，y = ' + y + '。']; })), 'x = ' + x + '，y = ' + y);
    var s2 = stp('規則：y 坐標是 0 → 在 x 軸上；x 坐標是 0 → 在 y 軸上；兩個都是 0 → 原點。這一點在哪裡？', '先看哪個坐標是 0，再對照規則。', fOpts(function (o) { if (/x 軸/.test(o)) return '在 x 軸上代表 y 坐標是 0，這一點的 y 是 ' + y + '。'; if (/y 軸/.test(o)) return '在 y 軸上代表 x 坐標是 0，這一點的 x 是 ' + x + '。'; if (/原點/.test(o)) return '原點要兩個坐標都是 0。'; return '只要有一個坐標是 0，就會剛好落在軸上，不在象限裡。'; }), String(CURQ.ans));
    return { steps: [s1, s2], final: String(CURQ.ans) };
  });

  // 2-1-2 visual：看圖判斷象限（用答案反推）
  addPlanner('visual', function (t) {
    if (!/圖中的\s*P\s*點位在第幾象限/.test(t)) return null;
    var mq = /第(.)象限/.exec(String(CURQ.ans)); if (!mq || !QUAD_SIGN[mq[1]]) return null; var sgn = QUAD_SIGN[mq[1]];
    var s1 = stp('看圖：P 點在 <b>y 軸（直的那條）</b>的左邊還是右邊？', '圖的正中間有兩條軸，先看 P 離哪一邊。', txOpts(sgn[0] > 0 ? '右邊（x 是正數）' : '左邊（x 是負數）', [[sgn[0] > 0 ? '左邊（x 是負數）' : '右邊（x 是正數）', '再看一次圖，P 點在 y 軸的另一邊。']]), sgn[0] > 0 ? 'P 在右邊' : 'P 在左邊');
    var s2 = stp('再看：P 點在 <b>x 軸（橫的那條）</b>的上面還是下面？', '看 P 點比橫軸高還是低。', txOpts(sgn[1] > 0 ? '上面（y 是正數）' : '下面（y 是負數）', [[sgn[1] > 0 ? '下面（y 是負數）' : '上面（y 是正數）', '再看一次圖，P 點在 x 軸的另一邊。']]), sgn[1] > 0 ? 'P 在上面' : 'P 在下面');
    var s3 = stp('口訣：一在右上、二在左上、三在左下、四在右下。P 點在第幾象限？', '把剛剛的「左右」和「上下」合起來。', fOpts(function (o) { var m2 = /第(.)象限/.exec(o); return m2 ? '第' + m2[1] + '象限在' + QUAD_POS[m2[1]] + '，P 點在' + QUAD_POS[mq[1]] + '。' : '再看一次。'; }), String(CURQ.ans));
    return { steps: [s1, s2, s3], final: String(CURQ.ans) };
  });

  // 2-1-3 distX / distY：到軸的距離
  function distPlan(t, which) {
    var m = /坐標\s*A\s*\((-?\d+),\s*(-?\d+)\)，牠距離\s*([xy])\s*軸/.exec(t); if (!m) return null;
    var x = +m[1], y = +m[2], ax = m[3], use = ax === 'x' ? 'y' : 'x', v = ax === 'x' ? y : x, o = ax === 'x' ? x : y;
    var s1 = stp('到 <b>' + ax + ' 軸</b>的距離，要看哪一個坐標？', ax === 'x' ? 'x 軸是橫的，離它多遠要看上下的位置，也就是 y 坐標。' : 'y 軸是直的，離它多遠要看左右的位置，也就是 x 坐標。', txOpts(use + ' 坐標', [[(use === 'x' ? 'y' : 'x') + ' 坐標', '看反了：到 ' + ax + ' 軸的距離，看的是 ' + use + ' 坐標。']]), '看 ' + use + ' 坐標 = ' + v);
    var s2 = stp(use + ' 坐標是 ' + v + '，距離是「幾個單位」，<b>不會是負的</b>。所以到 ' + ax + ' 軸的距離是？', '距離去掉正負號（取絕對值）。', nOpts(Math.abs(v), [[Math.abs(o), '看錯坐標了：要看 ' + use + ' 坐標。', Math.abs(o) !== Math.abs(v)], [v < 0 ? v : -Math.abs(v) - 1, '距離不會是負的。'], [Math.abs(v) + 2, '再數一次。']]), '距離 = ' + Math.abs(v));
    return { steps: [s1, s2], final: String(CURQ.ans) };
  }
  addPlanner('distX', function (t) { return distPlan(t); });
  addPlanner('distY', function (t) { return distPlan(t); });

  // 2-1-3 both：兩個距離
  addPlanner('both', function (t) {
    var m = /站在\s*A\s*\((-?\d+),\s*(-?\d+)\)，牠到 x 軸與到 y 軸/.exec(t); if (!m) return null;
    var x = +m[1], y = +m[2];
    var s1 = stp('到 <b>x 軸</b>的距離看 y 坐標 ' + y + '（去掉正負號）。是多少？', 'x 軸是橫的，離它多遠要看上下的位置。', nOpts(Math.abs(y), [[Math.abs(x), '那是 x 坐標，到 x 軸的距離要看 y 坐標。', Math.abs(x) !== Math.abs(y)], [-Math.abs(y), '距離不會是負的。'], [Math.abs(y) + 1, '再數一次。']]), '到 x 軸 ' + Math.abs(y));
    var s2 = stp('到 <b>y 軸</b>的距離看 x 坐標 ' + x + '（去掉正負號）。是多少？', 'y 軸是直的，離它多遠要看左右的位置。', nOpts(Math.abs(x), [[Math.abs(y), '那是 y 坐標，到 y 軸的距離要看 x 坐標。', Math.abs(y) !== Math.abs(x)], [-Math.abs(x), '距離不會是負的。'], [Math.abs(x) + 1, '再數一次。']]), '到 y 軸 ' + Math.abs(x));
    var s3 = stp('合起來：到 x 軸 ' + Math.abs(y) + '，到 y 軸 ' + Math.abs(x) + '。哪一個才對？', '到 x 軸的是第一個數，到 y 軸的是第二個數。', fOpts(function (o) { return '到 x 軸要是 ' + Math.abs(y) + '、到 y 軸要是 ' + Math.abs(x) + '，這個選項的數字不一樣。'; }), String(CURQ.ans));
    return { steps: [s1, s2, s3], final: String(CURQ.ans) };
  });

  // 2-1-3 reverse：由距離＋象限寫坐標
  addPlanner('reverse', function (t) {
    var m = /一個點在第(一|二|三|四)象限，牠到\s*y\s*軸的距離是\s*(\d+)、到\s*x\s*軸的距離是\s*(\d+)/.exec(t); if (!m) return null;
    var sg2 = QUAD_SIGN[m[1]], dx = +m[2], dy = +m[3], X = sg2[0] * dx, Y = sg2[1] * dy;
    var s1 = stp('到 <b>y 軸</b>的距離是 ' + dx + '、到 <b>x 軸</b>的距離是 ' + dy + '。那 x 坐標的大小（先不管正負）是多少？', '到 y 軸看的是 x 坐標；到 x 軸看的是 y 坐標。', nOpts(dx, [[dy, '看反了：到 y 軸的距離才是 x 坐標的大小。', dy !== dx], [dx + dy, '不用加起來，各看各的。']]), '|x| = ' + dx + '，|y| = ' + dy);
    var s2 = stp('第' + m[1] + '象限在' + QUAD_POS[m[1]] + '。x 坐標是正數還是負數？', '右邊是正、左邊是負。', txOpts(sg2[0] > 0 ? '正數' : '負數', [[sg2[0] > 0 ? '負數' : '正數', QUAD_POS[m[1]] + '的 x 坐標是' + (sg2[0] > 0 ? '正' : '負') + '數（在 y 軸的' + (sg2[0] > 0 ? '右' : '左') + '邊）。']]), 'x 是' + (sg2[0] > 0 ? '正' : '負') + '數');
    var s3 = stp('y 坐標是正數還是負數？', '上面是正、下面是負。', txOpts(sg2[1] > 0 ? '正數' : '負數', [[sg2[1] > 0 ? '負數' : '正數', QUAD_POS[m[1]] + '的 y 坐標是' + (sg2[1] > 0 ? '正' : '負') + '數（在 x 軸的' + (sg2[1] > 0 ? '上' : '下') + '面）。']]), 'y 是' + (sg2[1] > 0 ? '正' : '負') + '數');
    var s4 = stp('x 坐標 ' + X + '、y 坐標 ' + Y + '，寫成 (x, y)：', '先 x、後 y。', fOpts(function (o) { var p = pairOf(o); if (!p) return '再看一次。'; if (p[0] === Y && p[1] === X) return 'x、y 放反位置了。'; return '正負號要符合第' + m[1] + '象限（x ' + (sg2[0] > 0 ? '正' : '負') + '、y ' + (sg2[1] > 0 ? '正' : '負') + '）。'; }), String(CURQ.ans));
    return { steps: [s1, s2, s3, s4], final: String(CURQ.ans) };
  });

  // 2-2-2 identifyType：y=k 水平線／x=k 鉛垂線
  addPlanner('identifyType', function (t) {
    var m = /方程式是\s*([xy])\s*=\s*(-?\d+)，牠的圖形是/.exec(t); if (!m) return null;
    var v = m[1], hor = v === 'y';
    var s1 = stp('方程式 <b>' + v + ' = ' + m[2] + '</b> 的意思是：所有點的哪一個坐標都等於 ' + m[2] + '？', '等號左邊的字母，就是固定不變的那個坐標。', txOpts(v + ' 坐標', [[(hor ? 'x' : 'y') + ' 坐標', '看反了，式子裡寫的是 ' + v + '。']]), v + ' 坐標固定是 ' + m[2]);
    var s2 = stp(v + ' 固定、' + (hor ? 'x' : 'y') + ' 自由變，這些點連起來是什麼線？', hor ? 'y 固定 → 高度一樣 → 橫著走的水平線。' : 'x 固定 → 左右位置一樣 → 直直的鉛垂線。', fOpts(function (o) { if (/斜線/.test(o)) return '斜線上的點 x、y 都會變；這裡有一個坐標固定不變。'; if (/無法/.test(o)) return '看得出來：有一個坐標固定，就是水平線或鉛垂線。'; return hor ? 'y 固定是水平線（平行 x 軸），不是鉛垂線。' : 'x 固定是鉛垂線（平行 y 軸），不是水平線。'; }), String(CURQ.ans));
    return { steps: [s1, s2], final: String(CURQ.ans) };
  });

  // 2-2-2 throughPoint
  addPlanner('throughPoint', function (t) {
    var m = /落在直線\s*([xy])\s*=\s*(-?\d+)\s*上/.exec(t); if (!m) return null;
    var v = m[1], k = +m[2], idx = v === 'x' ? 0 : 1;
    var s1 = stp('直線 <b>' + v + ' = ' + k + '</b> 上的點，哪一個坐標一定是 ' + k + '？', '看式子，字母是 ' + v + '，就是 ' + v + ' 坐標固定。', txOpts(v + ' 坐標', [[(v === 'x' ? 'y' : 'x') + ' 坐標', '看反了，式子裡寫的是 ' + v + '。']]), v + ' 坐標要是 ' + k);
    var s2 = stp('(x, y) 裡，' + v + ' 坐標是' + (idx === 0 ? '左邊' : '右邊') + '那個數。哪一個點的 ' + v + ' 坐標是 ' + k + '？', '另一個坐標可以是任何數，不用管它。', fOpts(function (o) { var p = pairOf(o); return p ? o + ' 的 ' + v + ' 坐標是 ' + p[idx] + '，不是 ' + k + '。' : '再看一次。'; }), String(CURQ.ans));
    return { steps: [s1, s2], final: String(CURQ.ans) };
  });

  // 2-2-2 writeEq
  addPlanner('writeEq', function (t) {
    var m = /一條(水平線|鉛垂線|垂直線)通過點\s*\((-?\d+),\s*(-?\d+)\)/.exec(t); if (!m) return null;
    var hor = m[1] === '水平線', v = hor ? 'y' : 'x', k = hor ? +m[3] : +m[2], other = hor ? +m[2] : +m[3];
    var s1 = stp(m[1] + '上所有的點，哪一個坐標都一樣？', hor ? '水平線：高度都一樣，所以 y 坐標都一樣。' : '鉛垂線：左右位置都一樣，所以 x 坐標都一樣。', txOpts(v + ' 坐標', [[(hor ? 'x' : 'y') + ' 坐標', m[1] + '上固定不變的是 ' + v + ' 坐標。']]), v + ' 坐標固定');
    var s2 = stp('通過點 (' + m[2] + ', ' + m[3] + ')，它的 ' + v + ' 坐標是 ' + k + '。方程式是？', '寫成「' + v + ' = 那個固定的數」。', fOpts(function (o) {
      var mm = /^([xy])\s*=\s*(-?\d+)$/.exec(o.replace(/[−－]/g, '-'));
      if (!mm) return '這個式子有兩個字母相加，不是水平線或鉛垂線的方程式。';
      if (mm[1] !== v) return '「' + o + '」是' + (hor ? '鉛垂線' : '水平線') + '的方程式，不是' + m[1] + '。';
      return '要用通過點的 ' + v + ' 坐標 ' + k + '，不是 ' + mm[2] + '。';
    }), String(CURQ.ans));
    return { steps: [s1, s2], final: String(CURQ.ans) };
  });

  // 2-2-2 axisEq
  addPlanner('axisEq', function (t) {
    var mv = /方程式\s*([xy])\s*=\s*0\s*的圖形是哪一條線/.exec(t);
    if (mv) {
      var v = mv[1], other = v === 'x' ? 'y' : 'x';
      var b1 = stp('方程式 <b>' + v + ' = 0</b> 表示所有點的哪個坐標都是 0？', '看等號左邊的字母。', txOpts(v + ' 坐標', [[other + ' 坐標', '式子裡寫的是 ' + v + '，所以是 ' + v + ' 坐標固定為 0。']]), v + ' 坐標固定是 0');
      var b2 = stp(v + ' 坐標是 0、' + other + ' 坐標可以任意，這些點連成哪一條線？', v === 'x' ? '左右位置在正中間（0），上下可以任意 → 直直的 y 軸。' : '上下位置在正中間（0），左右可以任意 → 橫橫的 x 軸。', fOpts(function (o) { if (/斜線/.test(o)) return '有一個坐標固定為 0，圖形是直的或橫的，不是斜的。'; if (/不存在/.test(o)) return '這條線是存在的，就是一條坐標軸。'; return v === 'x' ? 'x 軸上的點是 y 坐標為 0；x = 0 的是 y 軸。' : 'y 軸上的點是 x 坐標為 0；y = 0 的是 x 軸。'; }), String(CURQ.ans));
      return { steps: [b1, b2], final: String(CURQ.ans) };
    }
    if (/軸與\s*y\s*軸相交在哪一點/.test(t)) {
      var c1 = stp('x 軸（橫的）和 y 軸（直的）交會的那一點，離兩條軸各有幾個單位？', '交會點就在兩條軸上。', nOpts(0, [[1, '交會點就在軸上，離軸是 0 個單位。'], [5, '交會點就在軸上，離軸是 0 個單位。'], [-1, '距離不會是負的，而且交會點離軸是 0。']]), '離兩條軸都是 0');
      var c2 = stp('所以交會點的坐標是？', '兩個坐標都是 0。', fOpts(originWhy), String(CURQ.ans));
      return { steps: [c1, c2], final: String(CURQ.ans) };
    }
    var m = /([xy])\s*軸本身其實也可以用一個方程式表示/.exec(t); if (!m) return null;
    var ax = m[1], on = ax === 'x' ? 'y' : 'x';
    var s1 = stp(ax + ' 軸上的每一個點，哪一個坐標一定是 0？', ax === 'x' ? 'x 軸是橫的，在它上面「高度」是 0，也就是 y 坐標是 0。' : 'y 軸是直的，在它上面「左右位置」是 0，也就是 x 坐標是 0。', txOpts(on + ' 坐標', [[ax + ' 坐標', ax + ' 軸上的點，' + ax + ' 坐標是可以變來變去的。']]), on + ' 坐標 = 0');
    var s2 = stp('所以 ' + ax + ' 軸的方程式是？', '把「' + on + ' 坐標是 0」寫成式子。', fOpts(function (o) { var n = norm(o); if (n === 'x=0') return '「x = 0」是 y 軸的方程式。'; if (n === 'y=0') return '「y = 0」是 x 軸的方程式。'; if (n === 'xy=0') return 'xy = 0 的意思是 x 或 y 其中一個是 0，那會是兩條軸，不是只有一條。'; if (n === 'x=y') return 'x = y 是一條斜線，不是軸。'; return '再想想：' + ax + ' 軸上的點，' + on + ' 坐標是多少？'; }), String(CURQ.ans));
    return { steps: [s1, s2], final: String(CURQ.ans) };
  });

  // 2-2-3 intersect：用加減消去求交點
  addPlanner('intersect', function (t) {
    var m1 = /①\s*(.+?)\s*=\s*(-?\d+)\s*②\s*(.+?)\s*=\s*(-?\d+)\s*，兩條光束/.exec(t); if (!m1) return null;
    var base = '①' + m1[1] + ' = ' + m1[2] + '　②' + m1[3] + ' = ' + m1[4];
    var px = PLANNERS.elimMix(base + '　解聯立方程式，求出 x 的值。'); if (!px) return null;
    var pa = pairOf(CURQ.ans); if (!pa) return null; var X = pa[0], Y = pa[1], l1 = linParse(m1[1]);
    var s0 = stp('兩條直線的<b>交點</b>，同時在兩條線上。所以交點的 (x, y) 要滿足什麼？', '同時在兩條線上＝同時滿足兩個方程式。', txOpts('①和②兩個方程式都成立（解聯立方程式）', [['只要滿足①就好', '交點也在第二條線上，②也要成立。'], ['只要滿足②就好', '交點也在第一條線上，①也要成立。']]), '交點 = 聯立方程式的解');
    var steps = [s0].concat(px.steps);
    var back = l1.b !== 0 ? stp('x = ' + X + ' 代回①：<b>' + m1[1].replace(/\s+/g, '') + ' = ' + m1[2] + '</b>，求 y。y = ？', '把 x 換成 ' + X + '，解出 y。', nOpts(Y, [[-Y, '正負號弄反了。'], [Y + 1, '再算一次。'], [X, '那是 x 的值，這裡要求 y。']]), 'y = ' + Y) : null;
    if (back) steps.push(back);
    var fin = stp('x = ' + X + '，y = ' + Y + '。交點坐標寫成 (x, y)：', '先 x、後 y。', fOpts(function (o) { var p = pairOf(o); return p && p[0] === Y && p[1] === X ? 'x、y 放反位置了。' : '兩個數要跟你算出來的 x = ' + X + '、y = ' + Y + ' 一樣。'; }), String(CURQ.ans));
    steps.push(fin);
    return { steps: steps, final: String(CURQ.ans) };
  });

  // 2-2-3 area：與兩軸圍成的三角形面積
  addPlanner('area', function (t) {
    var m = /直線\s*(.+?)\s*=\s*(-?\d+)\s*與\s*x\s*軸、y\s*軸分別交於兩點/.exec(t); if (!m) return null;
    var L = linParse(m[1]), c = +m[2]; if (!L || !L.a || !L.b) return null;
    var xi = c / L.a, yi = c / L.b, area = Math.abs(xi * yi) / 2;
    var s1 = stp('直線與 <b>x 軸</b>相交時，y = 0。把 y = 0 代進 ' + esc(m[1]) + ' = ' + c + '，x = ？', '令 y = 0，算出 x。', nOpts(fmtF(xi), [[fmtF(-xi), '正負號弄反了。'], [fmtF(yi), '那是 y 軸上的交點；這裡 y = 0，要求的是 x。', fmtF(yi) !== fmtF(xi)], [fmtF(c), '還要除以 x 的係數。']]), '與 x 軸交於 (' + fmtF(xi) + ', 0)');
    var s2 = stp('直線與 <b>y 軸</b>相交時，x = 0。把 x = 0 代進去，y = ？', '令 x = 0，算出 y。', nOpts(fmtF(yi), [[fmtF(-yi), '正負號弄反了。'], [fmtF(xi), '那是 x 軸上的交點；這裡 x = 0，要求的是 y。', fmtF(xi) !== fmtF(yi)], [fmtF(c), '還要除以 y 的係數。']]), '與 y 軸交於 (0, ' + fmtF(yi) + ')');
    var s3 = stp('三角形的底是 ' + fmtF(Math.abs(xi)) + '、高是 ' + fmtF(Math.abs(yi)) + '。面積 = 底 × 高 ÷ 2 = ？', '底 × 高，再除以 2。', nOpts(fmtF(area), [[fmtF(area * 2), '三角形面積要再除以 2。'], [fmtF(area / 2), '多除了一次 2。'], [fmtF(Math.abs(xi) + Math.abs(yi)), '面積是「相乘」再除以 2，不是相加。']]), '面積 = ' + fmtF(area));
    return { steps: [s1, s2, s3], final: String(CURQ.ans) };
  });

  // 2-2-3 interpret：交點與聯立方程式的觀念
  addPlanner('interpret', function (t) {
    var key, s1;
    if (/完全重合/.test(t)) { key = '兩條線完全重合，每一個點都同時在兩條線上，所以解有無限多組。'; s1 = ['兩條直線完全重合時，它們共同擁有多少個點？', '無限多個點（每一點都共同）', [['只有 1 個點', '重合的線是整條疊在一起。'], ['0 個點', '重合時，每一個點都是共同的。']]]; }
    else if (/不平行/.test(t)) { key = '兩條不平行的直線，一定會在剛好一個點相交。'; s1 = ['兩條<b>不平行</b>的直線，會相交嗎？', '會相交，而且交在同一個點', [['永遠不會相交', '不平行就一定會交在一點。'], ['會交在兩個點', '兩條直線最多只能交一個點。']]]; }
    else if (/平行/.test(t)) { key = '平行的兩條線永遠不會相交，沒有共同點，所以沒有解。'; s1 = ['兩條平行（不重合）的直線，會相交嗎？', '永遠不會相交', [['會交在一個點', '平行線不會相交。'], ['會交在兩個點', '平行線不會相交。']]]; }
    else if (/解是/.test(t)) { key = '聯立方程式的解，要同時滿足兩個方程式，所以圖形上的點會在兩條線上，也就是它們的交點。'; s1 = ['聯立方程式的解 (x, y)，要滿足幾個方程式？', '兩個方程式都要滿足', [['只要滿足一個', '聯立方程式要「同時」滿足兩個。'], ['一個都不用', '解一定要代進去讓式子成立。']]]; }
    else if (/交點坐標/.test(t)) { key = '交點在兩條線上，所以它同時滿足兩個方程式，這就是聯立方程式的解。'; s1 = ['兩條直線相交的那一點，是在「第一條線上」、「第二條線上」，還是「兩條線都在」？', '兩條線都在', [['只在第一條線上', '交點也在第二條線上。'], ['只在第二條線上', '交點也在第一條線上。']]]; }
    else return null;
    return conceptPlan('想一想：' + s1[0], '畫畫看兩條線的樣子。', s1[1], s1[2], s1[1], '把剛剛想到的用在題目上，選出最合適的說法：', '重點：' + key, function () { return '想想重點：' + key; });
  });

  /* ===== plan4c：第 3、4 章（比例、正反比、不等式）補齊 ===== */
  // 3-1-2 cross：內項乘積／外項乘積
  addPlanner('cross', function (t) {
    var m = /比例式\s*(\d+)\s*:\s*(\d+)\s*=\s*(\d+)\s*:\s*(\d+)\s*成立，求(內項|外項)乘積/.exec(t); if (!m) return null;
    var a = +m[1], b = +m[2], c = +m[3], d = +m[4], inner = m[5] === '內項', p = inner ? [b, c] : [a, d], o = inner ? [a, d] : [b, c];
    var s1 = stp('比例式 <b>' + a + ' : ' + b + ' = ' + c + ' : ' + d + '</b> 裡，' + m[5] + '是哪兩個數？', inner ? '內項＝中間那兩個數（第 2 個和第 3 個）。' : '外項＝兩邊最外面那兩個數（第 1 個和第 4 個）。',
      txOpts(p[0] + ' 和 ' + p[1], [[o[0] + ' 和 ' + o[1], '那是' + (inner ? '外項' : '內項') + '，看清楚位置。'], [a + ' 和 ' + b, '這是前面那個比的兩項，不是' + m[5] + '。'], [c + ' 和 ' + d, '這是後面那個比的兩項，不是' + m[5] + '。']]), m[5] + '：' + p[0] + '、' + p[1]);
    var v = p[0] * p[1];
    var s2 = stp(m[5] + '乘積 = ' + p[0] + ' × ' + p[1] + ' = ？', '把兩個數相乘。', nOpts(v, [[p[0] + p[1], '乘積是「相乘」，不是相加。'], [v * 2, '再算一次乘法。']], true), m[5] + '乘積 = ' + v);
    return { steps: [s1, s2], final: String(v) };
  });

  // 3-1-3 mapScale：比例尺
  addPlanner('mapScale', function (t) {
    var m = /比例尺是\s*1\s*:\s*(\d+)。如果圖上量到的距離是\s*([\d.]+)\s*公分，實際距離是幾(公里|公尺|公分)/.exec(t); if (!m) return null;
    var sc = +m[1], d = parseFloat(m[2]), cm = d * sc, unit = m[3], div = unit === '公里' ? 100000 : unit === '公尺' ? 100 : 1;
    var s1 = stp('比例尺 1 : ' + sc + ' 表示：圖上 1 公分，實際是 ' + sc + ' 公分。圖上 ' + d + ' 公分，實際是幾<b>公分</b>？', '圖上距離 × ' + sc + '。', nOpts(Nm(cm), [[Nm(d / sc), '要「乘」比例尺，不是除。'], [Nm(cm * 10), '再數一次 0 的個數。'], [Nm(cm / 10), '再數一次 0 的個數。']]), '實際 = ' + d + ' × ' + sc + ' = ' + Nm(cm) + ' 公分');
    var toCm = function (o) { var mm = /^(-?[\d.]+)\s*(公里|公尺|公分)$/.exec(o); if (!mm) return null; return parseFloat(mm[1]) * (mm[2] === '公里' ? 100000 : mm[2] === '公尺' ? 100 : 1); };
    var s2 = stp(Nm(cm) + ' 公分要換成<b>' + unit + '</b>' + (div > 1 ? '（1 ' + unit + ' = ' + div + ' 公分）' : '') + '，答案是？', div > 1 ? '公分換成' + unit + '要「除以」' + div + '。' : '單位已經是公分。', fOpts(function (o) {
      var c2 = toCm(o); if (c2 === null) return '再換算一次單位。';
      if (Math.abs(c2 - cm) < 1e-6) return '這個數字的大小對，但題目問的是' + unit + '，單位要換成' + unit + '。';
      return '這個選項換回公分是 ' + Nm(c2) + '，但實際距離是 ' + Nm(cm) + ' 公分，單位換算錯了。';
    }), String(CURQ.ans));
    return { steps: [s1, s2], final: String(CURQ.ans) };
  });

  // 3-2-1 / 3-2-2：正比、反比
  function propKind(t) { return /成正比|y\s*=\s*kx|y\s*=\s*\d+x/.test(t) && !/成反比|xy\s*=/.test(t) ? 'dir' : /成反比|xy\s*=/.test(t) ? 'inv' : null; }
  addPlanner('findK', function (t) {
    var m = /已知當\s*x=(-?\d+)\s*時，y=(-?\d+)，求關係式（用\s*(y=kx|xy=k)\s*表示）/.exec(t); if (!m) return null;
    var x = +m[1], y = +m[2], dir = m[3] === 'y=kx', k = dir ? y / x : x * y;
    if (dir && k !== Math.round(k)) return null;
    var s1 = stp(dir ? '正比的關係式是 y = kx，所以 k = y ÷ x = ' + y + ' ÷ ' + x + ' = ？' : '反比的關係式是 xy = k，所以 k = x × y = ' + x + ' × ' + y + ' = ？', dir ? '把 y 除以 x。' : '把 x 和 y 乘起來。',
      nOpts(k, dir ? [[x * y, '正比要用 y「除以」x。'], [y - x, '要用 y ÷ x，不是相減。'], [x / y, '順序反了：是 y ÷ x。']] : [[x + y, '反比要把 x 和 y「相乘」，不是相加。'], [y / x, '反比是 x × y，不是相除。'], [x * y + 1, '再算一次乘法。']]), 'k = ' + k);
    var s2 = stp('k = ' + k + '，寫成關係式（' + (dir ? 'y = kx' : 'xy = k') + ' 的樣子）：', dir ? '把 k 放進 y = kx。' : '把 k 放進 xy = k。', fOpts(function (o) {
      var n = norm(o), mm = /^y=(-?\d+)x$/.exec(n), m2 = /^xy=(-?\d+)$/.exec(n);
      if (dir) { if (m2) return 'xy = k 是反比的寫法，這題是正比，要寫成 y = kx。'; if (mm) return 'k 要是 ' + y + ' ÷ ' + x + ' = ' + k + '，不是 ' + mm[1] + '。'; return '正比的關係式要寫成 y = kx，k = ' + k + '。'; }
      if (mm) return 'y = kx 是正比的寫法，這題是反比，要寫成 xy = k。'; if (m2) return 'k 要把 x 和 y 相乘：' + x + ' × ' + y + ' = ' + k + '，不是 ' + m2[1] + '。'; return '反比的關係式要寫成 xy = k，k = ' + k + '。';
    }), String(CURQ.ans));
    return { steps: [s1, s2], final: String(CURQ.ans) };
  });
  function propEval(t, wantY) {
    var m = wantY ? /關係式為\s*(?:y\s*=\s*(-?\d+)x|xy\s*=\s*(-?\d+))，當\s*x\s*=\s*(-?\d+)\s*時，y\s*是多少/.exec(t) : /關係式為\s*(?:y\s*=\s*(-?\d+)x|xy\s*=\s*(-?\d+))，當\s*y\s*=\s*(-?\d+)\s*時，x\s*是多少/.exec(t);
    if (!m) return null;
    var dir = m[1] !== undefined, k = +(dir ? m[1] : m[2]), g = +m[3], res = wantY ? (dir ? k * g : k / g) : (dir ? g / k : k / g), nm = wantY ? 'y' : 'x', given = wantY ? 'x' : 'y';
    var good, wr;
    if (dir) {
      if (wantY) { good = k + ' × ' + g; wr = [[k + ' + ' + g, '正比是「乘」的關係：y = ' + k + ' × x。'], [k + ' ÷ ' + g, '正比是「乘」，不是除。'], [g + ' ÷ ' + k, '正比是「乘」，不是除。']]; }
      else { good = g + ' ÷ ' + k; wr = [[g + ' × ' + k, 'y = ' + k + 'x，要求 x，就要把 y 「除以」' + k + '。'], [k + ' ÷ ' + g, '順序反了：是 y 除以 ' + k + '。'], [g + ' − ' + k, '正比是乘除的關係，不是相減。']]; }
    } else { good = k + ' ÷ ' + g; wr = [[k + ' × ' + g, '反比的 xy = ' + k + '，求另一個數要用 ' + k + ' 「除以」已知的數。'], [g + ' ÷ ' + k, '順序反了：是 ' + k + ' ÷ ' + g + '。'], [k + ' − ' + g, '反比是乘除的關係，不是相減。']]; }
    var s1 = stp('已知 ' + (dir ? 'y = ' + k + 'x' : 'xy = ' + k) + '，' + given + ' = ' + g + '，要求 ' + nm + '。要列哪一個算式？', dir ? (wantY ? '正比：y = k × x。' : '正比：x = y ÷ k。') : '反比：另一個數 = k ÷ 已知的數。', txOpts(good, wr), nm + ' = ' + good);
    var s2 = stp(good + ' = ？', '照順序算出來。', nOpts(fmtF(res), [[fmtF(-res), '正負號弄反了。'], [fmtF(res + 1), '再算一次。'], [fmtF(res * 2), '再算一次。']]), nm + ' = ' + fmtF(res));
    return { steps: [s1, s2], final: String(CURQ.ans) };
  }
  addPlanner('findY', function (t) { return propEval(t, true); });
  addPlanner('findX', function (t) { return propEval(t, false); });
  addPlanner('identify', function (t) {
    var m = /這(?:兩|三|幾)組數據符合\s*([xy])\s*與\s*([xy])\s*成(正比|反比)嗎/.exec(t); if (!m) return null;
    var dir = m[3] === '正比', pairs = [], re = /x=(-?\d+)\s*時\s*y=(-?\d+)/g, mm; while ((mm = re.exec(t))) pairs.push([+mm[1], +mm[2]]);
    if (pairs.length < 2) return null;
    var f = function (p) { return dir ? p[1] / p[0] : p[0] * p[1]; }, nm = dir ? 'y ÷ x' : 'x × y', vals = pairs.map(f), same = vals.every(function (v) { return Math.abs(v - vals[0]) < 1e-9; });
    var steps = [stp('要檢查是不是<b>' + m[3] + '</b>，要看每一組的什麼是不是都一樣？', dir ? '正比：y ÷ x 都一樣（y = kx）。' : '反比：x × y 都一樣（xy = k）。', txOpts(nm + ' 是不是都一樣', [[dir ? 'x × y 是不是都一樣' : 'y ÷ x 是不是都一樣', dir ? '那是反比的檢查方法。正比要看 y ÷ x。' : '那是正比的檢查方法。反比要看 x × y。'], [dir ? 'y − x 是不是都一樣' : 'x + y 是不是都一樣', '正比、反比是乘除的關係，不是加減。']]), '檢查 ' + nm)];
    pairs.forEach(function (p, i) { steps.push(stp('第 ' + (i + 1) + ' 組 x = ' + p[0] + '、y = ' + p[1] + '：<b>' + nm + '</b> = ？', dir ? 'y 除以 x。' : 'x 乘以 y。', nOpts(Nm(vals[i]), [[Nm(dir ? p[0] / p[1] : p[0] + p[1]), dir ? '順序反了：是 y ÷ x。' : '反比要「相乘」，不是相加。'], [Nm(dir ? p[0] * p[1] : p[1] / p[0]), dir ? '正比要看 y ÷ x。' : '反比要看 x × y。'], [Nm(vals[i] + 1), '再算一次。']]), '第 ' + (i + 1) + ' 組：' + nm + ' = ' + Nm(vals[i]))); });
    steps.push(stp('各組算出來是 ' + vals.map(Nm).join('、') + '，' + (same ? '全部一樣' : '不一樣') + '。符合' + m[3] + '嗎？', '一樣才符合；只要有一組不一樣就不符合。', fOpts(function (o) {
      if (/資料不足/.test(o)) return '資料夠用了：把各組的 ' + nm + ' 算出來比一比，只要有一組不一樣，就不符合；每一組都一樣，才符合。';
      if (/一定符合/.test(o)) return '不一定：要把各組的 ' + nm + ' 算出來，一樣才符合' + m[3] + '。';
      return same ? '各組 ' + nm + ' 都是 ' + Nm(vals[0]) + '，一樣，所以符合。' : '各組 ' + nm + ' 分別是 ' + vals.map(Nm).join('、') + '，不一樣，所以不符合。';
    }), String(CURQ.ans)));
    return { steps: steps, final: String(CURQ.ans) };
  });

  // 3-2-3 classifyEq / classifyTable
  addPlanner('classifyEq', function (t) {
    var m = /方程式為\s*(.+?)，請問/.exec(t); if (!m) return null;
    var e = m[1].replace(/[−－]/g, '-').replace(/\s+/g, ''), kind = /^y=-?\d*\.?\d*x$/.test(e) ? '正比' : (/^y=-?\d+\/x$/.test(e) || /^xy=-?\d+$/.test(e) || /^-?\d+\/x=y$/.test(e)) ? '反比' : '兩者皆非';
    var forms = [['y = k × x 的樣子（y 是 x 的固定倍數）', '正比'], ['x × y = k 的樣子（x 和 y 乘起來固定）', '反比'], ['都不是這兩種樣子', '兩者皆非']];
    var ok = forms.filter(function (f) { return f[1] === kind; })[0][0];
    var s1 = stp('先看式子 <b>' + esc(m[1]) + '</b>，它像下面哪一種？', '正比：y = kx（沒有加減）。反比：xy = k 或 y = k/x。有加減常數（像 y = x + 3）就不是這兩種。', txOpts(ok, forms.filter(function (f) { return f[1] !== kind; }).map(function (f) { return [f[0], '再比對一次式子的樣子。']; })), '式子的樣子：' + ok);
    var s2 = stp('所以 y 與 x 是什麼關係？', '對照剛剛的樣子：y = kx → 正比；xy = k → 反比；其他 → 兩者皆非。', fOpts(function (o) { if (/無法/.test(o)) return '看得出來：這個式子的樣子很明確。'; var why = { '正比': '正比的樣子是 y = kx，這個式子不是。', '反比': '反比的樣子是 xy = k（或 y = k/x），這個式子不是。', '兩者皆非': '這個式子其實是' + kind + '的樣子，不是「兩者皆非」。' }; return why[o] || '再比對一次。'; }), String(CURQ.ans));
    return { steps: [s1, s2], final: String(CURQ.ans) };
  });
  addPlanner('classifyTable', function (t) {
    var pairs = [], re = /x=(-?\d+)\s*時\s*y=(-?\d+)/g, mm; while ((mm = re.exec(t))) pairs.push([+mm[1], +mm[2]]);
    if (pairs.length < 2 || !/正比、反比，還是兩者皆非/.test(t)) return null;
    var r1 = pairs.map(function (p) { return p[1] / p[0]; }), r2 = pairs.map(function (p) { return p[0] * p[1]; });
    var same1 = r1.every(function (v) { return Math.abs(v - r1[0]) < 1e-9; }), same2 = r2.every(function (v) { return Math.abs(v - r2[0]) < 1e-9; });
    var yn = function (b) { return b ? '都一樣' : '不一樣'; };
    var s1 = stp('先檢查<b>正比</b>：每一組的 y ÷ x 分別是 ' + r1.map(Nm).join('、') + '。它們…？', '正比：y ÷ x 要都一樣。', txOpts(yn(same1), [[yn(!same1), same1 ? '數字是一樣的，再看一次。' : '數字不一樣，再看一次。']]), 'y ÷ x：' + r1.map(Nm).join('、') + '（' + yn(same1) + '）');
    var s2 = stp('再檢查<b>反比</b>：每一組的 x × y 分別是 ' + r2.map(Nm).join('、') + '。它們…？', '反比：x × y 要都一樣。', txOpts(yn(same2), [[yn(!same2), same2 ? '數字是一樣的，再看一次。' : '數字不一樣，再看一次。']]), 'x × y：' + r2.map(Nm).join('、') + '（' + yn(same2) + '）');
    var s3 = stp('y ÷ x ' + yn(same1) + '、x × y ' + yn(same2) + '，所以這組數據是？', '正比＝y÷x 一樣；反比＝x×y 一樣；兩個都不一樣＝兩者皆非。', fOpts(function (o) {
      if (/資料不足/.test(o)) return '兩組數據就足夠檢查了。';
      if (o === '正比') return same1 ? '再檢查 x × y 有沒有一樣。' : 'y ÷ x 不一樣，所以不是正比。';
      if (o === '反比') return same2 ? '再檢查。' : 'x × y 不一樣，所以不是反比。';
      return '其中有一個檢查是「都一樣」，所以不是「兩者皆非」。';
    }), String(CURQ.ans));
    return { steps: [s1, s2, s3], final: String(CURQ.ans) };
  });

  // ---- 第 4 章 ----
  function linX(s) {
    s = String(s).replace(/[−－]/g, '-').replace(/\s+/g, ''); var a = 0, b = 0, re = /([+\-]?)(\d*\.?\d*)(x?)/g, m, any = false;
    while ((m = re.exec(s)) && m[0] !== '') { var c = m[2] === '' ? (m[3] ? 1 : NaN) : parseFloat(m[2]); if (isNaN(c)) return null; if (m[1] === '-') c = -c; if (m[3]) a += c; else b += c; any = true; }
    return any ? { a: a, b: b } : null;
  }
  function holds(v, op, c) { return op === '>' ? v > c : op === '<' ? v < c : op === '≥' ? v >= c : v <= c; }
  addPlanner('checkMultiple', function (t) {
    var m = /不等式是\s*(.+?)\s*([<>≤≥])\s*(-?\d+)。下列哪一個 x 是這個不等式的解/.exec(t); if (!m || !CURQ.options) return null;
    var L = linX(m[1]), c = +m[3], op = m[2]; if (!L || !L.a) return null;
    var ans = String(CURQ.ans), opts = CURQ.options.map(String).filter(isNum); if (opts.length < 2 || opts.indexOf(ans) < 0) return null;
    var sols = opts.filter(function (o) { return holds(L.a * +o + L.b, op, c); }); if (sols.length !== 1 || sols[0] !== ans) return null;
    var cands = opts.map(function (o) {
      var x = +o, v = L.a * x + L.b, sol = holds(v, op, c);
      var s1 = stp('把 <b>x = ' + o + '</b> 代進 ' + esc(m[1]) + '，算出來是多少？', '把 x 換成 ' + o + '，照式子算。', nOpts(v, [[L.a * x - L.b, '常數的正負號要照原式，不要變號。'], [-v, '正負號弄反了。'], [L.a + x + L.b, '係數和 x 之間是「相乘」，不是相加。']]), 'x = ' + o + ' → ' + v);
      var yes = '成立，所以 ' + o + ' 是解', no = '不成立，所以 ' + o + ' 不是解';
      var s2 = stp(v + ' ' + op + ' ' + c + ' 成立嗎？', '把 ' + v + ' 跟 ' + c + ' 比一比，看符號對不對。', txOpts(sol ? yes : no, [[sol ? no : yes, sol ? v + ' 和 ' + c + ' 比起來，剛好滿足「' + op + '」。' : v + ' 和 ' + c + ' 比起來，並不滿足「' + op + '」。']]), sol ? o + ' 是解' : o + ' 不是解');
      return { label: 'x = ' + o, steps: [s1, s2], isSol: sol };
    });
    return walkPlan(cands, '想知道哪個 x 是<b>解</b>，就要把選項的數字<b>一個一個代進不等式</b>，看看不等式成不成立，成立的才是解。<br>先挑一個你想試的 x 吧！（挑哪個都可以，不是解就換下一個）', '隨便挑一個選項來代入都可以；代進去之後不等式成立，它就是解，不成立就換下一個。', ans);
  });
  addPlanner('findBoundary', function (t) {
    var m = /不等式是\s*(.+?)\s*([<>≤≥])\s*(-?\d+)，解開之後 x 的範圍是/.exec(t); if (!m) return null;
    var L = linX(m[1]); if (!L || !L.a) return null;
    var pl = planIneq(L.a, L.b, m[2], 0, +m[3]); return pl;
  });

  // 4-1-3：數線與不等式
  function ineqParts(s) { var m = /([<>≤≥])\s*(-?\d+)/.exec(String(s).replace(/[−－]/g, '-')); return m ? { sym: m[1], v: m[2] } : null; }
  addPlanner('graphToIneq', function (t) {
    if (!/對應的不等式是/.test(t)) return null;
    var p = ineqParts(CURQ.ans); if (!p) return null; var inc = inclOf(p.sym), right = dirOf(p.sym) === '大';
    var s1 = stp('看數線：在 <b>' + p.v + '</b> 這個點，是實心圓點還是空心圓圈？', '實心＝包含這個數（有等號）；空心＝不包含（沒有等號）。', txOpts(inc ? '實心圓點（包含 ' + p.v + '）' : '空心圓圈（不包含 ' + p.v + '）', [[inc ? '空心圓圈（不包含 ' + p.v + '）' : '實心圓點（包含 ' + p.v + '）', '再看一次圖上的圓圈是實心還是空心。']]), inc ? '實心 → 有等號' : '空心 → 沒有等號');
    var s2 = stp('光芒（射線）是往<b>左</b>還是往<b>右</b>？', '右邊的數比較大、左邊的數比較小。', txOpts(right ? '往右（比 ' + p.v + ' 大）' : '往左（比 ' + p.v + ' 小）', [[right ? '往左（比 ' + p.v + ' 小）' : '往右（比 ' + p.v + ' 大）', '再看一次圖上箭頭的方向。']]), right ? '往右 → 大於' : '往左 → 小於');
    var s3 = stp('合起來：' + (inc ? '有等號' : '沒有等號') + '、' + (right ? '往右（大）' : '往左（小）') + '。不等式是？', '＞＜沒有等號；≥≤ 有等號。', fOpts(function (o) { var q2 = ineqParts(o); if (!q2) return '再看一次。'; if (q2.v !== p.v) return '數字要是圖上標的 ' + p.v + '。'; if (inclOf(q2.sym) !== inc) return inc ? '圓點是實心的，要有等號。' : '圓圈是空心的，不能有等號。'; return '方向弄反了：' + (right ? '往右是大於' : '往左是小於') + '。'; }), String(CURQ.ans));
    return { steps: [s1, s2, s3], final: String(CURQ.ans) };
  });
  addPlanner('ineqToDesc', function (t) {
    var m = /不等式\s*x\s*([<>≤≥])\s*(-?\d+)\s*畫在數線上/.exec(t); if (!m) return null;
    var inc = inclOf(m[1]), right = dirOf(m[1]) === '大';
    var s1 = stp('<b>x ' + m[1] + ' ' + m[2] + '</b> 有沒有等號？要畫實心還是空心？', '有等號（≥、≤）→ 實心；沒有等號（>、<）→ 空心。', txOpts(inc ? '有等號 → 實心圓點' : '沒有等號 → 空心圓圈', [[inc ? '沒有等號 → 空心圓圈' : '有等號 → 實心圓點', m[1] + ' ' + (inc ? '有' : '沒有') + '等號，再看一次符號。']]), inc ? '實心' : '空心');
    var s2 = stp('x ' + m[1] + ' ' + m[2] + '：x 比 ' + m[2] + ' 大還是小？射線往哪邊？', '大的往右、小的往左。', txOpts(right ? '比 ' + m[2] + ' 大 → 往右' : '比 ' + m[2] + ' 小 → 往左', [[right ? '比 ' + m[2] + ' 小 → 往左' : '比 ' + m[2] + ' 大 → 往右', '再看一次符號：' + m[1] + ' 是' + (right ? '大' : '小') + '於。']]), right ? '往右' : '往左');
    var s3 = stp('合起來，正確的畫法是？', '圓點的種類＋射線的方向，兩個都要對。', fOpts(function (o) { var solid = /實心/.test(o), toRight = /右方/.test(o); if (solid !== inc) return inc ? '有等號要畫實心圓點。' : '沒有等號要畫空心圓圈。'; if (toRight !== right) return '射線方向弄反了：' + m[1] + ' 要往' + (right ? '右' : '左') + '。'; return '數字要是 ' + m[2] + '。'; }), String(CURQ.ans));
    return { steps: [s1, s2, s3], final: String(CURQ.ans) };
  });
  addPlanner('circleType', function (t) {
    var m = /不等式\s*x\s*([<>≤≥])\s*(-?\d+|k)\s*的解(?:畫在數線上，|時，)/.exec(t); if (!m || !/實心圓點還是空心圓圈/.test(t)) return null;
    var inc = inclOf(m[1]);
    var s1 = stp('<b>x ' + m[1] + ' ' + m[2] + '</b> 的符號有沒有「等號」（符號下面有沒有那一橫）？', '＞＜ 沒有；≥≤ 有。', txOpts(inc ? '有等號' : '沒有等號', [[inc ? '沒有等號' : '有等號', '再看一次符號：' + m[1] + ' ' + (inc ? '下面有' : '下面沒有') + '一橫。']]), m[1] + (inc ? ' 有等號' : ' 沒有等號'));
    var s2 = stp('有等號 → 包含這個數 → 實心；沒有等號 → 不包含 → 空心。所以在 ' + m[2] + ' 要畫？', '照剛剛的結果。', fOpts(function (o) { if (/實心/.test(o)) return '沒有等號，不包含 ' + m[2] + '，不能畫實心。'; if (/空心/.test(o)) return '有等號，包含 ' + m[2] + '，不能畫空心。'; return '要畫實心圓點或空心圓圈其中一種。'; }), String(CURQ.ans));
    return { steps: [s1, s2], final: String(CURQ.ans) };
  });
  addPlanner('direction', function (t) {
    var m = /不等式\s*x\s*([<>≤≥])\s*(-?\d+|k)\s*的解(?:畫在數線上，|時，)射線/.exec(t); if (!m) return null;
    var right = dirOf(m[1]) === '大';
    var s1 = stp('<b>x ' + m[1] + ' ' + m[2] + '</b>：x 是比 ' + m[2] + ' 大，還是比 ' + m[2] + ' 小？', '＞、≥ 是大；＜、≤ 是小。', txOpts(right ? '比 ' + m[2] + ' 大' : '比 ' + m[2] + ' 小', [[right ? '比 ' + m[2] + ' 小' : '比 ' + m[2] + ' 大', '再看一次符號：' + m[1] + ' 是' + (right ? '大' : '小') + '於。']]), right ? 'x 比 ' + m[2] + ' 大' : 'x 比 ' + m[2] + ' 小');
    var s2 = stp('數線上，右邊的數比較大、左邊的數比較小。所以射線指向？', '大的往右，小的往左。', fOpts(function (o) { if (/同時/.test(o)) return '不等式只有一個方向，不會同時往兩邊。'; if (/不需要/.test(o)) return '不等式的解有很多個，要用射線表示。'; return right ? '比 ' + m[2] + ' 大的數在右邊，射線要往右。' : '比 ' + m[2] + ' 小的數在左邊，射線要往左。'; }), String(CURQ.ans));
    return { steps: [s1, s2], final: String(CURQ.ans) };
  });

  // 4-2-1
  addPlanner('flipOrNot', function (t) {
    var m = /兩邊同乘（或同除）以\s*(-?\d+)，不等號方向會改變嗎/.exec(t); if (!m) return null;
    var n = +m[1], neg = n < 0, a = 1 * n, b = 2 * n, rel = a < b ? '<' : '>';
    var s1 = stp('用數字試試看：<b>1 &lt; 2</b>，兩邊同乘 <b>' + n + '</b> 之後變成 ' + a + ' 和 ' + b + '。這兩個數誰大誰小？', '把兩個數放在數線上比比看，越右邊越大。', txOpts(a + ' ' + rel + ' ' + b, [[a + ' ' + (rel === '<' ? '>' : '<') + ' ' + b, '再比一次：' + a + ' 和 ' + b + '，在數線上 ' + (a < b ? a + ' 在左邊，比較小' : a + ' 在右邊，比較大') + '。']]), n + '×1 ' + rel + ' ' + n + '×2');
    var s2 = stp('原本是 1 &lt; 2（小於），乘 ' + n + ' 之後變成 ' + a + ' ' + rel + ' ' + b + '。不等號方向有改變嗎？', '原本是「＜」，現在是「' + rel + '」，一樣就是沒改變，不一樣就是改變了。', fOpts(function (o) {
      if (/看不等號種類/.test(o)) return '不管是 >、<、≥、≤，規則都一樣，只看乘（除）的是正還是負。';
      if (/一定會改變/.test(o)) return '只有乘（除）負數才會翻轉；乘（除）正數方向不變，所以不是「一定」。';
      return neg ? '剛剛試出來，方向從「＜」變成「＞」，有改變；乘（除）的是負數。' : '剛剛試出來，方向還是「＜」，沒有改變；乘（除）的是正數。';
    }), String(CURQ.ans));
    return { steps: [s1, s2], final: String(CURQ.ans) };
  });
  function symWhy(z, op, nop, n) {
    if (z === op) return n < 0 ? '乘（除）的是負數，方向要翻轉，不能還是 ' + op + '。' : '';
    if (inclOf(z) !== inclOf(nop)) return '有沒有「等號」不會因為乘除而改變：原本是 ' + op + '，' + (inclOf(op) ? '有' : '沒有') + '等號，變完也要' + (inclOf(op) ? '有' : '沒有') + '等號。';
    return n < 0 ? '方向要翻轉成 ' + nop + '，這個符號的方向不對。' : '乘（除）的是正數，方向不會改變，還是 ' + op + '。';
  }
  addPlanner('applyOp', function (t) {
    var m = /已知\s*x\s*([<>≤≥])\s*(-?\d+)，如果不等式兩邊同(乘以|除以)\s*(-?\d+)/.exec(t); if (!m) return null;
    var op = m[1], c = +m[2], mul = m[3] === '乘以', n = +m[4], nop = n < 0 ? flipOp(op) : op, rc = mul ? c * n : c / n;
    var s1 = stp('兩邊同' + m[3] + ' <b>' + n + '</b>（' + (n < 0 ? '負數' : '正數') + '）。不等號 <b>' + op + '</b> 要變成什麼？', '乘（除）正數方向不變；乘（除）負數方向要翻轉；有沒有等號不會變。',
      nOpts(nop, ['<', '>', '≤', '≥'].filter(function (z) { return z !== nop; }).map(function (z) { return [z, symWhy(z, op, nop, n)]; }).filter(function (w) { return w[1]; })), '符號變成 ' + nop);
    var s2 = stp('右邊的 ' + c + ' 也要' + m[3].replace('以', '') + ' ' + n + '：' + c + (mul ? ' × ' : ' ÷ ') + sg(n) + ' = ？', '兩邊都要做一樣的事。', nOpts(Nm(rc), [[Nm(-rc), '正負號弄反了。'], [Nm(c), '右邊也要一起' + m[3].replace('以', '') + '，不能不動。'], [Nm(mul ? c / n : c * n), '是' + m[3].replace('以', '') + '，不是' + (mul ? '除' : '乘') + '。']]), '右邊 = ' + Nm(rc));
    var s3 = stp('合起來，結果是？', '符號和右邊的數都要對。', fOpts(function (o) { var mm = /([<>≤≥])\s*(-?[\d.]+)$/.exec(norm(o).replace(/(.)([<>≤≥])/, '$1 $2')); var mo = /([<>≤≥])/.exec(o), mn = /(-?[\d.]+)\s*$/.exec(o.replace(/[−－]/g, '-')); if (!mo || !mn) return '再看一次。'; if (parseFloat(mn[1]) !== rc) return '右邊的數應該是 ' + Nm(rc) + '。'; return '不等號應該是 ' + nop + '（' + (n < 0 ? '乘除負數要翻轉' : '乘除正數方向不變') + '）。'; }), String(CURQ.ans));
    return { steps: c === 0 ? [s1, s3] : [s1, s2, s3], final: String(CURQ.ans) };
  });
  function ccFinal(truthTxt, claimTxt, correct) {
    return stp('規則算出來是「' + truthTxt + '」，題目說「' + claimTxt + '」。這個敘述對不對？', correct ? '兩個一樣就是正確。' : '兩個不一樣就是錯誤。', fOpts(function (o) { if (/部分|視情況/.test(o)) return '算出來的結果是確定的，敘述只會「正確」或「錯誤」。'; return o === '正確' ? '算出來是「' + truthTxt + '」，敘述說「' + claimTxt + '」，不一樣，所以是錯的。' : '算出來是「' + truthTxt + '」，敘述說「' + claimTxt + '」，一樣，所以是對的。'; }), String(CURQ.ans));
  }
  addPlanner('conceptCheck', function (t) {
    var tn = t.replace(/[−－]/g, '-');
    var m1 = /若\s*a\s*([<>≤≥])\s*b，則\s*(-?\d*)a\s*([<>≤≥])\s*(-?\d*)b/.exec(tn);
    if (m1) {
      var op = m1[1], n = m1[2] === '' ? 1 : m1[2] === '-' ? -1 : +m1[2], cop = m1[3], nop = n < 0 ? flipOp(op) : op, correct = cop === nop;
      var e1 = stp('a ' + op + ' b，兩邊同乘 <b>' + n + '</b>（' + (n < 0 ? '負數' : '正數') + '）。不等號 ' + op + ' 會變成什麼？', '乘正數方向不變；乘負數方向要翻轉。', nOpts(nop, ['<', '>', '≤', '≥'].filter(function (z) { return z !== nop; }).map(function (z) { return [z, symWhy(z, op, nop, n)]; }).filter(function (w) { return w[1]; })), '變成 ' + nop);
      return { steps: [e1, ccFinal(n + 'a ' + nop + ' ' + n + 'b', n + 'a ' + cop + ' ' + n + 'b', correct)], final: String(CURQ.ans) };
    }
    var m2 = /若\s*a\s*([<>≤≥])\s*b，則\s*a\s*\+\s*(\d+)\s*([<>≤≥])\s*b\s*\+\s*(\d+)/.exec(tn);
    if (m2) {
      var op2 = m2[1], cop2 = m2[3];
      var e2 = stp('a ' + op2 + ' b，兩邊同時<b>加上 ' + m2[2] + '</b>。不等號方向會變嗎？', '加上或減去同一個數，方向不變。', txOpts('不會改變，還是 ' + op2, [['要翻轉', '加減同一個數，方向不會翻轉；只有乘除負數才翻轉。']]), '加上同一個數，方向不變');
      return { steps: [e2, ccFinal('a + ' + m2[2] + ' ' + op2 + ' b + ' + m2[2], 'a + ' + m2[2] + ' ' + cop2 + ' b + ' + m2[4], cop2 === op2)], final: String(CURQ.ans) };
    }
    var m3 = /不等式\s*(-?)x\s*([<>≤≥])\s*(-?\d+)\s*兩邊同乘\s*(-?\d+)，會變成\s*x\s*([<>≤≥])\s*(-?\d+)/.exec(tn);
    if (m3) {
      var a = m3[1] ? -1 : 1, op3 = m3[2], c3 = +m3[3], n3 = +m3[4], nop3 = n3 < 0 ? flipOp(op3) : op3, nc = c3 * n3, correct3 = a * n3 === 1 && m3[5] === nop3 && +m3[6] === nc;
      var f1 = stp('兩邊同乘 <b>' + n3 + '</b>（' + (n3 < 0 ? '負數' : '正數') + '）。不等號 ' + op3 + ' 會變成什麼？', '乘負數方向要翻轉。', nOpts(nop3, ['<', '>', '≤', '≥'].filter(function (z) { return z !== nop3; }).map(function (z) { return [z, symWhy(z, op3, nop3, n3)]; }).filter(function (w) { return w[1]; })), '符號變成 ' + nop3);
      var f2 = stp('右邊的 ' + c3 + ' 也要乘 ' + n3 + '：' + c3 + ' × ' + sg(n3) + ' = ？', '兩邊都要做一樣的事。', nOpts(nc, [[-nc, '正負號弄反了。'], [c3, '右邊也要一起乘。'], [nc + 1, '再算一次。']]), '右邊 = ' + nc);
      return { steps: [f1, f2, ccFinal('x ' + nop3 + ' ' + nc, 'x ' + m3[5] + ' ' + m3[6], correct3)], final: String(CURQ.ans) };
    }
    var m = /兩邊同(乘以|除以|加上|減去)一個(正數|負數|數)，不等號方向(不會改變|要翻轉|會翻轉|不會翻轉|不變)/.exec(t); if (!m) return null;
    var addsub = /加|減/.test(m[1]), neg = m[2] === '負數', truth = (!addsub && neg) ? '要翻轉' : '不會改變', claim = /^(要翻轉|會翻轉)$/.test(m[3]) ? '要翻轉' : '不會改變', correct = truth === claim;
    var s1 = stp('先想規則：不等式兩邊同' + m[1].replace('以', '').replace('上', '').replace('去', '') + '一個' + m[2] + '，不等號的方向會怎樣？', '加、減：不變。乘、除正數：不變。乘、除負數：要翻轉。', txOpts(truth === '要翻轉' ? '要翻轉' : '不會改變', [[truth === '要翻轉' ? '不會改變' : '要翻轉', addsub ? '加減怎麼做，方向都不變。' : (neg ? '乘除負數時方向要翻轉。' : '乘除正數時方向不變。')]]), '規則：方向' + truth);
    var s2 = stp('規則是「' + truth + '」，題目說「' + claim + '」。這個敘述對不對？', correct ? '兩個一樣就是正確。' : '兩個不一樣就是錯誤。', fOpts(function (o) { if (/部分|視情況/.test(o)) return '規則是固定的，敘述只會「正確」或「錯誤」。'; return o === '正確' ? '規則是「' + truth + '」，敘述卻說「' + claim + '」，不一樣，所以是錯的。' : '規則是「' + truth + '」，敘述也說「' + claim + '」，一樣，所以是對的。'; }), String(CURQ.ans));
    return { steps: [s1, s2], final: String(CURQ.ans) };
  });

  // 4-2-3 setupApp
  addPlanner('setupApp', function (t) {
    var m = /買\s*x\s*[^，]*?，每\S*\s*(\d+)\s*元，另外還要付\S*?\s*(\d+)\s*元，總花費(不超過|不低於|不少於|不大於|至少|至多|最多|最少|最低|超過|少於|多於|未滿)\s*(\d+)\s*元/.exec(t); if (!m || !PHR[m[3]]) return null;
    var p = +m[1], f2 = +m[2], lim = +m[4], sym = PHR[m[3]], left = p + 'x + ' + f2;
    var s1 = stp('總花費 = 單價 × 個數 + 固定費用。每個 ' + p + ' 元、買 x 個，另外付 ' + f2 + ' 元，總花費怎麼寫？', '單價×個數＝' + p + 'x，再加上固定的 ' + f2 + ' 元。', txOpts(left, [[p + 'x − ' + f2, '固定費用是「另外要付」的，要加上去，不是減掉。'], ['(' + p + ' + ' + f2 + ')x', '固定費用只付一次，不用乘以個數。'], [p + ' + x + ' + f2, '單價和個數要相乘：' + p + 'x。']]), '總花費 = ' + left);
    var big = dirOf(sym) === '大', inc = inclOf(sym);
    var s2 = stp('題目說總花費<b>「' + m[3] + '」</b>' + lim + ' 元。這是哪一個符號？', '至少／不低於／不少於／不小於＝≥；至多／不超過／不大於＝≤；超過／多於＝＞；未滿／少於＝＜。', nOpts(sym, SYMS.filter(function (z) { return z !== sym; }).map(function (z) { return [z, z === (inc ? flipOp(sym) : sym) ? '方向弄反了：「' + m[3] + '」是' + (big ? '大' : '小') + '的那一邊。' : (inclOf(z) !== inc ? '「' + m[3] + '」' + (inc ? '包含剛好等於，要有等號。' : '不包含剛好等於，不能有等號。') : '方向不對。')]; })), '「' + m[3] + '」→ ' + sym);
    var s3 = stp('合起來，不等式是？', '左邊是總花費，右邊是 ' + lim + '。', fOpts(function (o) { var mm = /^(.+?)\s*([<>≤≥])\s*(\d+)$/.exec(o); if (!mm) return '再看一次。'; if (norm(mm[1]) !== norm(left)) return '左邊的總花費算式不對，要是 ' + left + '。'; if (mm[2] !== sym) return inclOf(mm[2]) !== inc ? '「' + m[3] + '」' + (inc ? '包含等於，要有等號。' : '不包含等於，不能有等號。') : '符號方向弄反了：「' + m[3] + '」是 ' + sym + '。'; return '再看一次。'; }), String(CURQ.ans));
    return { steps: [s1, s2, s3], final: String(CURQ.ans) };
  });

  /* META423：4-2-3 多情境（電梯、計程車、手機、遊樂園、存錢、水池…）讀 CURQ.meta；用語含 最多／最少／最低／以上／以下／未滿／超過 */
  (function () {
    var oBM = PLANNERS.budgetMax, oMC = PLANNERS.minCount, oSA = PLANNERS.setupApp;
    var FLIP = { '≤': '≥', '≥': '≤', '<': '>', '>': '<' }, ALT = { '≤': '<', '≥': '>', '<': '≤', '>': '≥' };
    function sayEq(M) { return inclOf(M.sym) ? '包含剛好等於，要有等號' : '不包含剛好等於，不能有等號'; }
    PLANNERS.budgetMax = function (t) {
      var M = CURQ && CURQ.meta; if (!M || M.kind !== 'max') return oBM(t);
      var p = M.p, fix = M.f, lim = M.B, rest = lim - fix, xv = rest / p, ans = Math.floor(xv + 1e-9), C = M.cu, U = M.unit, S = M.sym, W = M.word;
      if (rest < 0) return null;
      return { steps: [
        { say: '先列不等式：' + M.total + ' ＝ ' + M.per + ' ' + p + ' ' + C + ' × x，再加上固定的 ' + fix + ' ' + C + '，' + M.total + '「' + W + '」' + lim + ' ' + C + '。', hint: '「' + W + '」＝' + (S === '≤' ? '小於或等於（≤）' : '小於（＜）') + '。', opts: mkOpts(p + 'x + ' + fix + ' ' + S + ' ' + lim, [[p + 'x + ' + fix + ' ' + FLIP[S] + ' ' + lim, '「' + W + '」是 ' + S + '，方向弄反了。'], [p + 'x + ' + fix + ' ' + ALT[S] + ' ' + lim, '「' + W + '」' + sayEq(M) + '。'], [p + ' + ' + fix + 'x ' + S + ' ' + lim, 'x 要乘 ' + p + '，固定的 ' + fix + ' 只加一次。']]), line: p + 'x + ' + fix + ' ' + S + ' ' + lim },
        { say: '把 ' + fix + ' 移到右邊：<b>' + lim + ' − ' + fix + '</b> = ？', hint: '移項要變號。', opts: mkOpts(rest, [[lim + fix, '移項要變號，是減掉。'], [fix - lim, '順序弄反了。']]), line: p + 'x ' + S + ' ' + rest },
        { say: '兩邊同除以 ' + p + '：x ' + S + ' ' + rest + ' ÷ ' + p + ' = ？（可以有小數）', hint: '除以每 1 ' + U + ' 的量。', opts: mkOpts(Nm(xv), [[Nm(rest * p), '是「除以」。'], [Nm(rest - p), '是「除以」。']]), line: 'x ' + S + ' ' + Nm(xv) },
        { say: U + '一定要是整數，而且不能超過 ' + Nm(xv) + '，' + (M.ask || '最多是多少？'), hint: '無條件捨去小數。', opts: mkOpts(ans, [[Math.ceil(xv), '超過了 ' + Nm(xv) + ' 就不行了，要往下捨去。'], [ans + 1, '超過了就不行。'], [ans - 1, '還可以再多一個喔。']]), line: '最多 ' + ans + ' ' + U }
      ], final: String(ans) };
    };
    PLANNERS.minCount = function (t) {
      var M = CURQ && CURQ.meta; if (!M || M.kind !== 'min') return oMC(t);
      var p = M.p, fix = M.f, goal = M.B, C = M.cu, U = M.unit, S = M.sym, W = M.word, rest = goal - fix, xv = rest / p, ans = Math.ceil(xv - 1e-9), steps = [], L = p + 'x' + (fix ? ' + ' + fix : '');
      steps.push({ say: M.total + ' ＝ ' + (fix ? '原本的 ' + fix + ' ' + C + ' ＋ ' : '') + M.per + ' ' + p + ' ' + C + ' × x，要「' + W + '」' + goal + ' ' + C + '，列不等式：', hint: '「' + W + '」＝' + (S === '≥' ? '大於或等於（≥）' : '大於（＞）') + '。', opts: mkOpts(L + ' ' + S + ' ' + goal, [[L + ' ' + FLIP[S] + ' ' + goal, '「' + W + '」是 ' + S + '，方向弄反了。'], [L + ' ' + ALT[S] + ' ' + goal, '「' + W + '」' + sayEq(M) + '。'], [(fix ? p + 'x − ' + fix : 'x ' + S + ' ' + p + goal) + (fix ? ' ' + S + ' ' + goal : ''), '要把「原本有的」加上去，x 乘 ' + p + '。']]), line: L + ' ' + S + ' ' + goal });
      if (fix) steps.push({ say: '把 ' + fix + ' 移到右邊：<b>' + goal + ' − ' + fix + '</b> = ？', hint: '移項要變號。', opts: mkOpts(rest, [[goal + fix, '移項要變號，是減掉。'], [fix - goal, '順序弄反了。']]), line: p + 'x ' + S + ' ' + rest });
      steps.push({ say: '兩邊同除以 ' + p + '：x ' + S + ' ' + rest + ' ÷ ' + p + ' = ？（可以有小數）', hint: '除以每 1 ' + U + ' 的量。', opts: mkOpts(Nm(xv), [[Nm(rest * p), '是「除以」。'], [Nm(rest - p), '是「除以」。']]), line: 'x ' + S + ' ' + Nm(xv) });
      steps.push({ say: U + '一定要是整數，而且至少要有 ' + Nm(xv) + '，' + (M.ask || '最少是多少？'), hint: '無條件進位。', opts: mkOpts(ans, [[Math.floor(xv), '不夠喔，要往上進位。'], [ans + 1, '多了一個，還可以再少一點。'], [ans - 1, '不夠喔。']]), line: '至少 ' + ans + ' ' + U });
      return { steps: steps, final: String(ans) };
    };
    PLANNERS.setupApp = function (t) {
      var M = CURQ && CURQ.meta; if (!M || !M.sym) return oSA(t);
      var p = M.p, f2 = M.f, lim = M.B, sym = M.sym, word = M.word, left = p + 'x + ' + f2, big = dirOf(sym) === '大', inc = inclOf(sym);
      var s1 = stp(M.total + ' = ' + M.per + '的量 × x + ' + f2 + '。' + M.per + ' ' + p + ' ' + M.cu + '、x ' + M.unit + '，再加上 ' + f2 + ' ' + M.cu + '，' + M.total + '怎麼寫？', M.per + '的量×x＝' + p + 'x，再加上固定的 ' + f2 + '。', txOpts(left, [[p + 'x − ' + f2, '那 ' + f2 + ' 是要「加上去」的，不是減掉。'], ['(' + p + ' + ' + f2 + ')x', f2 + ' 只出現一次，不用乘以 x。'], [p + ' + x + ' + f2, p + ' 和 x 要相乘：' + p + 'x。']]), M.total + ' = ' + left);
      var s2 = stp('題目說' + M.total + '<b>「' + word + '」</b>' + lim + ' ' + M.cu + (M.post ? '（注意：「' + word + '」是數字放前面，意思是「' + lim + ' ' + M.cu + (big ? '或更多' : '或更少') + '」）' : '') + '。這是哪一個符號？', '至少／最少／最低／不低於／以上＝≥；至多／最多／不超過／以下＝≤；超過／多於＝＞；未滿／少於＝＜。', nOpts(sym, SYMS.filter(function (z) { return z !== sym; }).map(function (z) { return [z, z === (inc ? flipOp(sym) : sym) ? '方向弄反了：「' + word + '」是' + (big ? '大' : '小') + '的那一邊。' : (inclOf(z) !== inc ? '「' + word + '」' + (inc ? '包含剛好等於，要有等號。' : '不包含剛好等於，不能有等號。') : '方向不對。')]; })), '「' + word + '」→ ' + sym);
      var s3 = stp('合起來，不等式是？', '左邊是' + M.total + '，右邊是 ' + lim + '。', fOpts(function (o) { var mm = /^(.+?)\s*([<>≤≥])\s*(\d+)$/.exec(o); if (!mm) return '再看一次。'; if (norm(mm[1]) !== norm(left)) return '左邊的算式不對，要是 ' + left + '。'; if (mm[2] !== sym) return inclOf(mm[2]) !== inc ? '「' + word + '」' + (inc ? '包含等於，要有等號。' : '不包含等於，不能有等號。') : '符號方向弄反了：「' + word + '」是 ' + sym + '。'; return '再看一次。'; }), String(CURQ.ans));
      return { steps: [s1, s2, s3], final: String(CURQ.ans) };
    };
  })();

  /* ===== plan4d：第 5、6 章（統計、垂直、對稱、三視圖）補齊 ===== */
  addPlanner('sumFromMean', function (t) {
    var m = /(\d+)\s*個數字的平均數是\s*(-?[\d.]+)/.exec(t); if (!m) return null;
    var n = +m[1], mean = parseFloat(m[2]), sum = n * mean;
    var s1 = stp('平均數 = 總和 ÷ 個數。如果要由平均數求<b>總和</b>，要怎麼算？', '把「÷ 個數」倒過來做，就是「× 個數」。', txOpts('平均數 × 個數', [['平均數 ÷ 個數', '平均數本身就是「總和 ÷ 個數」，要倒過來用乘的。'], ['平均數 + 個數', '平均數和個數是「相乘」的關係。']]), '總和 = 平均數 × 個數');
    var s2 = stp('總和 = ' + Nm(mean) + ' × ' + n + ' = ？', '照順序乘起來。', nOpts(Nm(sum), [[Nm(sum - n), '再算一次乘法。'], [Nm(sum + n), '再算一次乘法。'], [Nm(mean), '那是平均數，還要乘以個數。']], true), '總和 = ' + Nm(sum));
    return { steps: [s1, s2], final: String(CURQ.ans) };
  });
  function listOf(t) { var m = /\[([^\]]+)\]/.exec(t); if (!m) return null; var a = m[1].split(/\s*,\s*/).map(Number); return a.some(isNaN) ? null : a; }
  function countsOf(a) { var c = {}; a.forEach(function (v) { c[v] = (c[v] || 0) + 1; }); return c; }
  function modePlan(t) {
    var a = listOf(t); if (!a || !/眾數/.test(t)) return null;
    var c = countsOf(a), mx = 0, k; for (k in c) if (c[k] > mx) mx = c[k];
    var modes = Object.keys(c).filter(function (z) { return c[z] === mx; }); if (modes.length !== 1) return null;
    var distinct = Object.keys(c).length;
    var s1 = stp('先數一數：每個數字各出現幾次？出現<b>最多次</b>的那個數字，出現了幾次？', '把一樣的數字圈起來，一個一個數。', nOpts(mx, [[mx + 1, '多數了一次，再數一次。'], [mx - 1, '少數了，再數一次。', mx - 1 > 0], [distinct, '那是「有幾種不同的數字」，不是最多的出現次數。']], true), '最多出現 ' + mx + ' 次');
    var s2 = stp('哪一個數字出現了 <b>' + mx + ' 次</b>？它就是眾數。', '眾數＝出現次數最多的數字。', fOpts(function (o) { var v = c[o] || 0; return o + ' 只出現 ' + v + ' 次，不是最多（最多是 ' + mx + ' 次）。'; }), '眾數 = ' + modes[0]);
    return { steps: [s1, s2], final: String(CURQ.ans) };
  }
  function medianPlan(t) {
    var a = listOf(t); if (!a || !/中位數/.test(t)) return null;
    var s = a.slice().sort(function (x, y) { return x - y; }), n = s.length, odd = n % 2 === 1, med = odd ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
    var good = s.join(', '), desc = s.slice().reverse().join(', '), swap = s.slice(); if (n > 2) { var tmp = swap[0]; swap[0] = swap[1]; swap[1] = tmp; }
    var wr = [[a.join(', '), '還沒有排好，要由小到大排。'], [desc, '要由「小」到「大」，這個是反過來排。'], [swap.join(', '), '排序沒排完，還有數字順序不對。']].filter(function (w) { return w[0] !== good; });
    var s1 = stp('求中位數的第一步：把資料由小到大<b>排好</b>。排好是哪一個？', '從最小的開始，一個一個挑。', txOpts(good, wr), '排好：' + good);
    var s2 = stp('共有 ' + n + ' 個數字，是<b>奇數</b>個還是<b>偶數</b>個？中位數是哪裡的數？', odd ? '奇數個：正中間剛好有一個數。' : '偶數個：中間有兩個數，要取它們的平均。', txOpts(odd ? '奇數個，取正中間（第 ' + (n + 1) / 2 + ' 個）' : '偶數個，取第 ' + n / 2 + '、第 ' + (n / 2 + 1) + ' 個的平均', [[odd ? '偶數個，取中間兩個的平均' : '奇數個，取正中間那一個', odd ? n + ' 是奇數，正中間剛好有一個數。' : n + ' 是偶數，中間有兩個數，要取平均。']]), odd ? '取第 ' + (n + 1) / 2 + ' 個' : '取第 ' + n / 2 + '、' + (n / 2 + 1) + ' 個的平均');
    var s3 = stp('所以中位數是多少？', odd ? '數到排好的第 ' + (n + 1) / 2 + ' 個。' : '把第 ' + n / 2 + '、第 ' + (n / 2 + 1) + ' 個數加起來除以 2。', nOpts(Nm(med), odd ? [[Nm(s[Math.min(n - 1, (n - 1) / 2 + 1)]), '數的位置不對，從左邊數第 ' + (n + 1) / 2 + ' 個。'], [Nm(s[Math.max(0, (n - 1) / 2 - 1)]), '數的位置不對，從左邊數第 ' + (n + 1) / 2 + ' 個。'], [Nm(s[n - 1]), '那是最大的，不是正中間的。']] : [[Nm(s[n / 2 - 1]), '偶數個要取中間兩個數的「平均」。'], [Nm(s[n / 2]), '偶數個要取中間兩個數的「平均」。'], [Nm(s[n / 2 - 1] + s[n / 2]), '加起來之後還要除以 2。']]), '中位數 = ' + Nm(med));
    return { steps: [s1, s2, s3], final: String(CURQ.ans) };
  }
  addPlanner('findMode', modePlan);
  addPlanner('combined', function (t) { return modePlan(t) || medianPlan(t); });
  addPlanner('compareConcept', function (t) {
    var mn = /資料有\s*(\d+)\s*個數字（(?:偶數|奇數)個）/.exec(t);
    if (mn) {
      var n = +mn[1], odd = n % 2 === 1;
      return conceptPlan('資料有 ' + n + ' 個數字，是奇數個還是偶數個？', '能被 2 整除是偶數。', odd ? '奇數個' : '偶數個', [[odd ? '偶數個' : '奇數個', n + ' ' + (odd ? '不能被 2 整除，是奇數' : '能被 2 整除，是偶數') + '。']], odd ? '奇數個' : '偶數個',
        '排序後，中位數是什麼？', odd ? '奇數個：正中間剛好有一個數。' : '偶數個：中間有兩個數，取平均。', function (o) { return odd ? '奇數個的時候，正中間剛好有一個數（第 ' + (n + 1) / 2 + ' 個），不用取平均。' : '偶數個的時候，中間有兩個數（第 ' + n / 2 + '、' + (n / 2 + 1) + ' 個），要取它們的平均。'; });
    }
    var mode = /眾數|出現次數最多/.test(t) && !/中位數/.test(t);
    var key = mode ? '眾數看的是「出現的次數」，出現最多次的數字就是眾數；一組資料可以有不只一個眾數。' : '中位數看的是「排序後的位置」：先排好，奇數個取正中間，偶數個取中間兩個的平均；它不會被極端的大小數字拉動。';
    return conceptPlan(mode ? '先回想：眾數看的是什麼？' : '先回想：中位數看的是什麼？', mode ? '眾數＝出現最多次。' : '中位數＝排序後最中間。', mode ? '看每個數字出現的次數' : '看排序後正中間的位置', mode ? [['看排序後的位置', '那是中位數。'], ['看所有數字加起來', '那是平均數。']] : [['看每個數字出現的次數', '那是眾數。'], ['看所有數字加起來再平均', '那是平均數。']], mode ? '眾數看次數' : '中位數看位置', '用剛剛的重點，選出最合適的說法：', '重點：' + key, function () { return '想想重點：' + key; });
  });

  // 6-1-1
  var KEY_PERP = '兩條直線垂直＝交成直角（90°）、四個角都是直角；從直線外一點到直線的所有線段中，垂線段最短，點到直線的距離就是垂線段的長度。';
  var CONCEPT_TOPICS = [
    [/餘角/, '兩個角互為餘角，它們的和是 90°。', '兩個角互為「餘角」，它們加起來是幾度？', '90°', [['180°', '180° 是「補角」（平角）。'], ['360°', '360° 是一整圈。']]],
    [/最短|最長|斜斜|距離|垂直線段|垂線段/, '從直線外一點到這條直線的所有線段中，垂線段最短；點到直線的距離就是垂線段的長度。', '從直線外一點，畫線段到這條直線，哪一種最短？', '垂直的那一條（垂線段）', [['斜得最厲害的那一條', '斜的越厲害越長。'], ['每一條都一樣長', '不一樣長，斜的比垂直的長。']]],
    [/平行/, '平行的兩條線永遠不會相交；垂直的兩條線一定會相交成直角，所以平行線不可能互相垂直。', '平行的兩條線，會相交嗎？', '永遠不會相交', [['會交成直角', '交成直角的是垂直，不是平行。'], ['會交在一個點', '平行線不會相交。']]],
    [/一定會相交/, '垂直的兩條直線交成直角，所以一定會相交在一個點。', '兩條直線要「垂直」，它們要先怎樣？', '要先相交在一個點', [['不能相交', '垂直就是交成直角，一定要先相交。'], ['要完全重合', '重合是同一條線，不是垂直。']]],
    [/180°|60 度|90 度|四個角|直角/, '垂直＝兩條線交成直角（90°），而且四個角都是直角。', '兩條直線垂直時，交角是幾度？', '90°（直角）', [['60°', '垂直一定是 90°，不是別的角度。'], ['180°', '180° 是平角，不是直角。']]],
    [/符號|⊥/, '垂直的符號是「⊥」，像一條線站在另一條線上。', '垂直的符號長什麼樣子？', '⊥（一條線站在另一條線上）', [['∥（兩條平行線）', '那是平行的符號。'], ['∠（角的符號）', '那是角的符號，不是垂直。']]],
    [/只能畫一條/, '過直線外（或線上）一點，只能畫出一條直線垂直於已知直線。', '過一個點，要畫一條「垂直於已知直線」的線，可以畫幾條？', '只有 1 條', [['2 條', '垂直的方向只有一個，不能有第二條。'], ['無限多條', '垂直的方向只有一個，不能畫出很多條。']]]
  ];
  addPlanner('concept', function (t) {
    if (!/判斷下列敘述是否正確/.test(t)) return null;
    var tp = null; CONCEPT_TOPICS.forEach(function (c) { if (!tp && c[0].test(t)) tp = c; });
    if (!tp) return null;
    return conceptPlan('先回想一個重點：' + tp[2], '想像一下畫圖的樣子。', tp[3], tp[4], tp[3], '把這句敘述跟剛剛的重點比一比，它對不對？', '重點：' + tp[1], function (o) {
      if (/部分|視情況/.test(o)) return '這種觀念題有明確的對錯，不會「部分」或「看情況」。';
      return o === '正確' ? '再比對一次重點：' + tp[1] + ' 這句敘述跟它不一樣，所以是錯的。' : '再比對一次重點：' + tp[1] + ' 這句敘述符合它，所以是對的。';
    });
  });
  addPlanner('angleCalc', function (t) {
    var m = /∠AOB\s*=\s*(\d+)°.*已知\s*∠AOC\s*=\s*(\d+)°，求\s*∠COB/.exec(t); if (!m) return null;
    var tot = +m[1], a = +m[2], b = tot - a;
    var s1 = stp('∠AOC 和 ∠COB 合起來就是整個 ∠AOB。∠AOB 是幾度？', 'OA ⊥ OB，垂直就是直角。', nOpts(tot, [[180, '垂直是直角 90°，180° 是平角。'], [tot + a, '再看一次題目寫的 ∠AOB。'], [a, '那只是 ∠AOC 的度數。']]), '∠AOB = ' + tot + '°');
    var s2 = stp('∠COB = ' + tot + '° − ' + a + '° = ？', '大角減掉已知的小角。', nOpts(b, [[tot + a, '要用減的：整個角減掉已知的角。'], [180 - a, '整個角是 ' + tot + '°，不是 180°。'], [a, '那是 ∠AOC，要求的是另一個角。']]), '∠COB = ' + b + '°');
    return { steps: [s1, s2], final: String(CURQ.ans) };
  });
  addPlanner('symbolMeaning', function (t) {
    var par = /∥|平行/.test(t) && !/⊥|90°|垂直/.test(t);
    return conceptPlan(par ? '符號 ∥ 表示兩條線什麼關係？先回想一下。' : '符號 ⊥ 或 ∠=90° 表示兩條線什麼關係？先回想一下。', par ? '∥ 像兩條平躺的線。' : '⊥ 像一條線站在另一條線上。', par ? '平行，永遠不相交' : '垂直，交成 90° 直角', par ? [['垂直，交成 90° 直角', '垂直的符號是 ⊥。'], ['重合，是同一條線', '平行的兩條線是分開的。']] : [['平行，永遠不相交', '平行的符號是 ∥。'], ['重合，是同一條線', '垂直的兩條線是交叉的。']], par ? '∥ = 平行' : '⊥ = 垂直', '所以題目問的符號，意思是？', par ? '∥ 就是平行。' : '⊥ 就是垂直。', function (o) { if (/長/.test(o)) return '符號是在說兩條線的位置關係，不是比長度。'; if (/平行/.test(o) && !par) return '平行的符號是 ∥；這題是垂直。'; if (/垂直/.test(o) && par) return '垂直的符號是 ⊥；這題是平行。'; if (/重合/.test(o)) return '重合是兩條線疊在一起，不是這個符號的意思。'; return '再想想符號的意思。'; });
  });
  addPlanner('distanceDefine', function (t) {
    if (!/距離|最短|垂線|垂直線段/.test(t)) return null;
    return conceptPlan('從一個點到一條直線，可以畫很多條線段。哪一種最短？', '想想看：直直走過去，和斜斜繞過去，哪個比較短？', '垂直那一條（垂線段）', [['斜得最厲害的那一條', '斜的越厲害越長。'], ['每一條都一樣長', '不一樣長，斜的比垂直的長。']], '垂線段最短', '所以「點到直線的距離」，要量哪一段？', '點到直線的距離，就是垂線段的長度。', function () { return '距離要量的是最短的垂線段，這個選項量的不是垂線段。'; });
  });

  // 6-1-2
  function reflKind(p, q2) {
    if (q2[0] === -p[0] && q2[1] === p[1]) return 'y軸'; if (q2[0] === p[0] && q2[1] === -p[1]) return 'x軸'; if (q2[0] === -p[0] && q2[1] === -p[1]) return '原點'; if (q2[0] === p[1] && q2[1] === p[0]) return '互換'; return '其他';
  }
  function reflWhy(kind, goal, o, p) {
    var q2 = pairOf(o); if (!q2) return '再看一次。'; var k = reflKind(p, q2);
    if (k === '互換') return 'x、y 的位置被換掉了，這不是' + goal + '對稱；' + goal + '對稱時，數字的位置不變，只有正負號會改。';
    if (k === '其他') return '對稱點的數字大小不變，只有正負號會變。';
    return '這個是關於「' + k + '」的對稱點，這題要的是關於「' + goal + '」。';
  }
  addPlanner('reflectYAxis', function (t) {
    var m = /坐標\s*\((-?\d+),\s*(-?\d+)\)，對稱軸為\s*y\s*軸/.exec(t); if (!m) return null; var p = [+m[1], +m[2]];
    var s1 = stp('關於 <b>y 軸</b>對稱：點會跳到 y 軸的另一邊，高度不變。哪個坐標變、哪個不變？', 'y 軸是直的線。左右位置會翻過去，上下位置不變。', txOpts('x 變成相反數，y 不變', [['y 變成相反數，x 不變', '那是關於 x 軸對稱。'], ['x、y 都變成相反數', '那是關於原點對稱。'], ['x 和 y 位置互換', '這題的對稱，x、y 的位置不會換，只有正負號會改。']]), '(x, y) → (−x, y)');
    var s2 = stp('(' + p[0] + ', ' + p[1] + ') 關於 y 軸的對稱點是？', 'x 變相反數，y 不變。', fOpts(function (o) { return reflWhy('y軸', 'y 軸', o, p); }), String(CURQ.ans));
    return { steps: [s1, s2], final: String(CURQ.ans) };
  });
  addPlanner('reflectXAxis', function (t) {
    var m = /坐標\s*\((-?\d+),\s*(-?\d+)\)，對稱軸為\s*x\s*軸/.exec(t); if (!m) return null; var p = [+m[1], +m[2]];
    var s1 = stp('關於 <b>x 軸</b>對稱：點會跳到 x 軸的另一邊，左右位置不變。哪個坐標變、哪個不變？', 'x 軸是橫的線。上下位置會翻過去，左右位置不變。', txOpts('y 變成相反數，x 不變', [['x 變成相反數，y 不變', '那是關於 y 軸對稱。'], ['x、y 都變成相反數', '那是關於原點對稱。'], ['x 和 y 位置互換', '這題的對稱，x、y 的位置不會換，只有正負號會改。']]), '(x, y) → (x, −y)');
    var s2 = stp('(' + p[0] + ', ' + p[1] + ') 關於 x 軸的對稱點是？', 'y 變相反數，x 不變。', fOpts(function (o) { return reflWhy('x軸', 'x 軸', o, p); }), String(CURQ.ans));
    return { steps: [s1, s2], final: String(CURQ.ans) };
  });
  addPlanner('identifyAxis', function (t) {
    var m = /已知一點\s*\((-?\d+),\s*(-?\d+)\)\s*與它的對稱點\s*\((-?\d+),\s*(-?\d+)\)/.exec(t); if (!m) return null; var p = [+m[1], +m[2]], q2 = [+m[3], +m[4]];
    var xc = p[0] !== q2[0], yc = p[1] !== q2[1], yn = function (b) { return b ? '變了（變成相反數）' : '沒變'; };
    var s1 = stp('x 坐標從 ' + p[0] + ' 變成 ' + q2[0] + '，有沒有變？', '看正負號有沒有變。', txOpts(yn(xc), [[yn(!xc), xc ? '正負號變了。' : '兩個一樣，沒變。']]), 'x ' + yn(xc));
    var s2 = stp('y 坐標從 ' + p[1] + ' 變成 ' + q2[1] + '，有沒有變？', '看正負號有沒有變。', txOpts(yn(yc), [[yn(!yc), yc ? '正負號變了。' : '兩個一樣，沒變。']]), 'y ' + yn(yc));
    var s3 = stp('規則：只有 x 變 → y 軸；只有 y 變 → x 軸；兩個都變 → 原點。這是關於什麼對稱？', '對照剛剛的結果。', fOpts(function (o) { if (/無法/.test(o)) return '看得出來：x、y 有沒有變，就能判斷。'; if (/原點/.test(o)) return '原點對稱是 x、y 兩個都變。'; if (/x 軸/.test(o)) return 'x 軸對稱是只有 y 變。'; return 'y 軸對稱是只有 x 變。'; }), String(CURQ.ans));
    return { steps: [s1, s2, s3], final: String(CURQ.ans) };
  });
  addPlanner('reflectVLine', function (t) {
    var m = /鉛垂線\s*x\s*=\s*(-?\d+)，已知一點坐標\s*\((-?\d+),\s*(-?\d+)\)/.exec(t); if (!m) return null;
    var k = +m[1], x = +m[2], y = +m[3], d = Math.abs(x - k), nx = 2 * k - x; if (d === 0) return null;
    var s1 = stp('點 (' + x + ', ' + y + ') 到對稱軸 <b>x = ' + k + '</b> 的距離是多少？', '兩個 x 之間差多少：' + x + ' 和 ' + k + '（距離不會是負的）。', nOpts(d, [[Math.abs(x + k), '距離是兩個數相差多少，要用減的。', Math.abs(x + k) !== d], [Math.abs(x), '要算到對稱軸 x = ' + k + ' 的距離，不是到 y 軸。'], [d * 2, '那是兩個點之間的距離；到對稱軸的距離是它的一半。']]), '距離 = ' + d);
    var s2 = stp('對稱點在對稱軸的另一邊，一樣遠。對稱點的 x 坐標是？（公式：2 × ' + sg(k) + ' − ' + sg(x) + '）', '對稱點 x = 2k − 原本的 x。', nOpts(nx, [[-x, '那是關於 y 軸的對稱，這題的對稱軸是 x = ' + k + '。'], [x + 2 * k, '要用 2k 減掉原本的 x。'], [nx + 2, '再算一次。']]), '對稱點 x = ' + nx);
    var s3 = stp('鉛垂線對稱時，y 坐標不變。對稱點坐標是？', 'x 用剛剛算的，y 不變。', fOpts(function (o) { var p = pairOf(o); if (!p) return '再看一次。'; if (p[0] !== nx) return 'x 坐標應該是 ' + nx + '。'; return '鉛垂線對稱時，y 坐標不變，還是 ' + y + '。'; }), String(CURQ.ans));
    return { steps: [s1, s2, s3], final: String(CURQ.ans) };
  });

  // 6-1-3 三視圖
  function gridOfQ(qq) {
    if (qq && qq.grid) return qq.grid;
    if (!qq || !qq.svg) return null; var d = document.createElement('div'); d.innerHTML = qq.svg; var rows = d.querySelectorAll('tr'); if (!rows.length) return null;
    var g = [], ok = true; Array.prototype.forEach.call(rows, function (tr) { var r = []; Array.prototype.forEach.call(tr.querySelectorAll('td'), function (td) { var v = parseInt(td.textContent, 10); if (isNaN(v)) ok = false; r.push(v); }); g.push(r); });
    return ok && g.length && g[0].length ? g : null;
  }
  function hlCells(ov, byCol, idx) {
    var tb = ov.querySelector('.qsvg table'); if (!tb) return; var rows = tb.querySelectorAll('tr');
    Array.prototype.forEach.call(rows, function (tr, ri) { Array.prototype.forEach.call(tr.querySelectorAll('td'), function (td, ci) { var on = byCol ? ci === idx : ri === idx; td.style.background = on ? '#ffe27a' : '#fff'; }); });
  }
  function viewSteps(label, names, sets, from, byCol, idxs) { // sets[i] = 該欄/排的數字陣列
    var steps = [], res = [];
    sets.forEach(function (arr, i) {
      var mx = Math.max.apply(null, arr), sm = arr.reduce(function (a, b) { return a + b; }, 0), mn = Math.min.apply(null, arr), wr = [];
      if (sm !== mx) wr.push([sm, '看的是「最高的那一疊」，不是把這一' + label + '全部加起來。']);
      if (mn !== mx) wr.push([mn, '要看最高的那一疊，不是最矮的。']);
      steps.push(stp(names[i] + '：這一' + label + '的積木疊了 ' + arr.join('、') + ' 塊（' + (label === '欄' ? '先看後排、再看前排' : '由左到右') + '）。從' + from + '看過去，同一' + label + '裡矮的會被最高的擋住，看到的高度是幾個？', '同一' + label + '的方塊從' + from + '看是疊在一起的，看到的是最高的那一疊。', nOpts(mx, wr, true), names[i] + ' 高度 ' + mx));
      steps[steps.length - 1].onShow = (function (k) { return function (ov) { hlCells(ov, byCol, idxs[k]); }; })(i);
      res.push(mx);
    });
    return { steps: steps, res: res };
  }
  addPlanner('frontView', function (t) {
    var g = gridOfQ(CURQ); if (!g || !/前視圖/.test(t)) return null; var cols = g[0].length, sets = [], names = [];
    for (var j = 0; j < cols; j++) { sets.push(g.map(function (r) { return r[j]; })); names.push('由左數第 ' + (j + 1) + ' 欄'); }
    var v = viewSteps('欄', names, sets, '正前方', true, sets.map(function (_, j) { return j; })), fin = v.res.join(', ');
    v.steps.push(stp('由左到右的高度依序是 ' + fin + '。選出正確的寫法：', '順序是由左到右。', fOpts(function (o) { return '應該是 ' + fin + '（由左到右，每一欄看最高的那疊）。'; }), String(CURQ.ans)));
    return { steps: v.steps, final: fin };
  });
  addPlanner('sideView', function (t) {
    var g = gridOfQ(CURQ); if (!g || !/側視圖|右視圖|右側/.test(t)) return null; var sets = [], names = [], n = g.length;
    for (var i = n - 1; i >= 0; i--) { sets.push(g[i]); names.push('由前數第 ' + (n - i) + ' 排'); }
    var v = viewSteps('排', names, sets, '右側', false, sets.map(function (_, j) { return n - 1 - j; })), fin = v.res.join(', ');
    v.steps.push(stp('由前排到後排的高度依序是 ' + fin + '。選出正確的寫法：', '下排是前排，上排是後排；順序是由前到後。', fOpts(function (o) { return '應該是 ' + fin + '（由前排到後排，每一排看最高的那疊）。'; }), String(CURQ.ans)));
    return { steps: v.steps, final: fin };
  });
  addPlanner('topCount', function (t) {
    var g = gridOfQ(CURQ); if (!g || !/上視圖/.test(t)) return null; var flat = [].concat.apply([], g), n = flat.filter(function (v) { return v > 0; }).length, sum = flat.reduce(function (a, b) { return a + b; }, 0);
    var s1 = stp('從正上方往下看，只看「有沒有」方塊，不管疊幾個。格子裡的數字要怎麼看？', '0 表示沒有方塊；1 以上表示有方塊。', txOpts('有積木的位置，就算一個位置', [['每個數字都加起來', '那是在算全部的方塊數，不是看有幾個位置。'], ['只算最高的那一格', '每個有方塊的位置都要算。']]), '數「不是 0 的格子」');
    var wr2 = []; if (sum !== n) wr2.push([sum, '把格子裡的數字全部加起來，算的是「方塊總數」，不是「有幾個位置」。']); if (flat.length !== n) wr2.push([flat.length, '空格（0）沒有放方塊，不能算進去。']);
    var s2 = stp('數一數，有幾格不是 0？', '一格一格數，0 的不算。', nOpts(n, wr2, true), '共 ' + n + ' 個位置');
    return { steps: [s1, s2], final: String(n) };
  });
  addPlanner('totalCubes', function (t) {
    var g = gridOfQ(CURQ); if (!g || !/總共用了幾(個正方體|塊積木)/.test(t)) return null; var flat = [].concat.apply([], g), sum = flat.reduce(function (a, b) { return a + b; }, 0), n = flat.filter(function (v) { return v > 0; }).length;
    var s1 = stp('每一疊有幾塊積木，先一疊一疊數清楚。要知道總共幾塊，要怎麼算？', '全部的方塊都要算進去。', txOpts('把每一疊的積木數加起來', [['只看最大的數字', '每個位置的方塊都要算，不是只算最高的。'], ['把所有數字乘起來', '是「總共幾個」，用加的。'], ['數有幾格不是 0', '每一格可能疊好幾個，不是一格一個。']]), '總數 = 全部數字加起來');
    var wr3 = []; if (n !== sum) wr3.push([n, '那是「有方塊的位置數」，不是方塊總數；一個位置可能疊好幾個。']);
    var s2 = stp('每一疊的積木數是 ' + flat.join('、') + '，加起來：' + flat.join(' + ') + ' = ？', '一格一格加。', nOpts(sum, wr3, true), '總數 = ' + sum);
    return { steps: [s1, s2], final: String(sum) };
  });

  /* 3D 積木圖版：先把圖「數成數字」再作答 */
  addPlanner('topView', function (t) {
    var g = gridOfQ(CURQ); if (!g || !/上視圖/.test(t)) return null;
    var rowS = function (r) { return g[r].map(function (v) { return v > 0 ? '■' : '□'; }).join(''); };
    var flipS = function (s2) { return s2.split('').map(function (c) { return c === '■' ? '□' : '■'; }).join(''); };
    var s1 = stp('從正上方往下看，只看「有沒有」積木，不管疊幾塊。有積木的位置要畫成什麼？', '有疊積木＝實心（紅色）；沒有＝空格。', txOpts('實心（有積木）', [['空格', '有積木的地方，從上面一定看得到。'], ['畫上疊的塊數', '上視圖只看有沒有，不看疊幾塊。']]), '有積木 → 實心');
    var s2 = stp('先看<b>後排</b>（上視圖的上面一排），由左到右每一疊有 ' + g[0].join('、') + ' 塊。哪些位置有積木？（■有、□沒有）', '塊數是 0 就是沒有。', txOpts(rowS(0), [[flipS(rowS(0)), '有跟沒有顛倒了。'], [rowS(0).split('').reverse().join(''), '由左到右的順序要對。']].filter(function (x) { return x[0] !== rowS(0); }).concat([[rowS(1), '那是前排，這裡先看後排。']].filter(function (x) { return x[0] !== rowS(0); }))), '後排 ' + rowS(0));
    var s3 = stp('再看<b>前排</b>（上視圖的下面一排），由左到右每一疊有 ' + g[1].join('、') + ' 塊。哪些位置有積木？', '塊數是 0 就是沒有。', txOpts(rowS(1), [[flipS(rowS(1)), '有跟沒有顛倒了。'], [rowS(1).split('').reverse().join(''), '由左到右的順序要對。'], [rowS(0), '那是後排，這裡要看前排。']].filter(function (x) { return x[0] !== rowS(1); })), '前排 ' + rowS(1));
    var ans = String(CURQ.ans);
    var s4 = stp('上排是後排、下排是前排。選出完整的上視圖（文字版：■有、□沒有，「／」分隔上下兩排）：', '上排＝後排，下排＝前排。', fOpts(function (o) { return o === [rowS(1), rowS(0)].join('／') ? '上下排顛倒了：上排要是後排。' : '再對照一下每一排有沒有積木。'; }), ans);
    return { steps: [s1, s2, s3, s4], final: ans };
  });
  /* 積木立體圖：前視／右視／總數 的第一步，先教怎麼把圖數成數字 */
  ['frontView', 'sideView', 'totalCubes'].forEach(function (ty) {
    var old = PLANNERS[ty]; if (!old) return;
    PLANNERS[ty] = function (t) {
      var r = old(t); if (!r || !r.steps || !r.steps.length) return r;
      var g = gridOfQ(CURQ); if (!g) return r;
      r.steps[0].say = '先把立體圖「數」清楚（由左到右）：<b>後排</b>各疊 ' + g[0].join('、') + ' 塊；<b>前排</b>各疊 ' + g[1].join('、') + ' 塊。<br>' + r.steps[0].say;
      return r;
    };
  });



  var CURQ = null;
  function stPlanFor(qq) {
    CURQ = qq;
    /* 題目自帶小老師步驟：qq.tutor = [{say,hint,ok,wrong:[[選項,為什麼錯]],line}]，最後一步固定是「選出答案」 */
    if (qq.tutor && qq.tutor.length) {
      try {
        var tsteps = qq.tutor.map(function (u) { return stp(u.say, u.hint || '再看一次題目。', txOpts(u.ok, u.wrong || []), u.line || ''); });
        tsteps.push(stp(qq.tutorFinal || '把剛剛的結果合起來，答案是？', '回頭看剛剛每一步的結論。', fOpts(function (o) { return (qq.why && qq.why[o]) || '和剛剛一步一步推出來的結果不一樣，再對照一次。'; }), String(qq.ans)));
        return { steps: tsteps, final: String(qq.ans) };
      } catch (e) { try { console.warn('TUTOR-EMBED-ERR', qq.type, e.message); } catch (e2) {} return null; }
    }
    var f = PLANNERS[qq.type]; if (!f) return null;
    POS = /^(sumdiff|price|budgetMax|minCount|percentCalc|fractionCalc|findPercent|findMissing|word|word_ratio|simplify|value|equivalent)$/.test(qq.type);
    var t = plainText(qq.text).replace(/\s+/g, ' ');
    var p;
    try { p = f(t); } catch (e) { return null; }
    if (!p || !p.steps || !p.steps.length) return null;
    var fin = norm(p.final), ans = norm(qq.ans);
    if (fin !== ans) { try { console.warn('PLAN-MISMATCH', qq.type, t.slice(0, 60), p.final, qq.ans); } catch (e) {} return null; }
    return p;
  }

  function stRunPlan(plan) {
    var qt = plainText(q.text).trim(), misses = 0, i = 0, hist = [];
    var ov = document.createElement('div'); ov.id = 'ms-st-ov';
    ov.innerHTML = '<div class="box"><div class="ms-thead">小老師帶你一步一步解</div>' +
      '<div class="st-q spot" id="st-q"></div>' +
      '<div class="ms-tstage"><div class="ms-cat talk"><span class="cap">🎓</span><span class="face">🐱</span><small>小老師</small></div><div class="ms-bubble" id="st-say" style="min-height:70px"></div></div>' +
      '<div class="st-fb" id="st-fb"></div><div class="st-gl" id="st-gl"></div><div class="st-meter" id="st-meter"></div>' +
      '<div class="st-hist" id="st-hist"></div><div class="st-ch" id="st-ch"></div>' +
      '<div class="ms-ctl"><button class="btn ghost" id="st-hint">💡 提示</button></div></div>';
    stMount(ov); ov._q = q;
    var $o = function (s) { return ov.querySelector(s); };
    $o('#st-q').textContent = qt;
    if (q.svg) {
      $o('#st-q').insertAdjacentHTML('afterend', q.svg);
      var cap = ov.querySelector('.qsvg caption');
      if (cap) { var cd = document.createElement('div'); cd.className = 'st-cap'; cd.textContent = cap.textContent; var tb = cap.parentNode; tb.parentNode.insertBefore(cd, tb); cap.remove(); }
    }
    var ui = stUI(ov), say = ui.say;
    function miss() { misses++; ui.meter(misses); }
    ui.meter(0);
    function renderHist() { $o('#st-hist').innerHTML = hist.map(function (h) { return '<div>→ ' + esc(h) + '</div>'; }).join(''); }
    function show() {
      var s = plan.steps[i]; renderHist(); say(s.say);
      if (s.onShow) { try { s.onShow(ov); } catch (e) {} }
      var el = $o('#st-ch'); el.innerHTML = '';
      s.opts.forEach(function (o) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'st-opt'; b.textContent = o.t;
        b.onclick = function () {
          if (b.disabled) return;
          if (o.ok) {
            el.innerHTML = ''; hist.push(o.line != null ? o.line : s.line); i++;
            if (o.next) { try { Array.prototype.splice.apply(plan.steps, [i, 0].concat(o.next() || [])); } catch (e) {} }   // 「一個一個試」：點了哪個，就接上那個的代入步驟
            say(o.ack || '✅ 對！'); renderHist(); setTimeout(i < plan.steps.length ? show : done, 550);
          }
          else { miss(); b.disabled = true; b.classList.add('bad'); say('🐱 ' + (o.why || '再想想看～'), true); }
        };
        el.appendChild(b);
      });
    }
    function done() {
      var wrongCount = misses > CFG.TUTOR_MISS_MAX;
      say('🎉 完成！答案是 <b>' + esc(plan.final) + '</b>。' + (wrongCount ? '<br>🐱 步驟做對了，但失誤超過 ' + CFG.TUTOR_MISS_MAX + ' 次，這題先記答錯，之後可以再練。' : ''));
      $o('#st-hint').style.display = 'none';
      setTimeout(function () { if (!ov.parentNode || ov._q !== q) return; ov.remove(); stFinish(wrongCount, true, misses); }, CFG.TUTOR_DWELL_MS);
    }
    $o('#st-hint').onclick = function () { ui.hint([plan.steps[Math.min(i, plan.steps.length - 1)].hint]); };
    show();
  }

  function stMaybe() {
    if (S.flag || S.taught || S.skipTutor) return;
    if (typeof mode === 'undefined' || mode !== 'easy') return;
    if (typeof rescue !== 'undefined' && rescue) return;
    if (typeof q === 'undefined' || !q || typeof lock === 'undefined' || lock) return;
    var old = document.getElementById('ms-st-ov');
    if (old) { if (old._q === q) return; old.remove(); }
    try {
      if (/^化簡/.test(String(q.text || ''))) { stTutor(); return; }
      var plan = stPlanFor(q);
      if (plan) stRunPlan(plan);
    } catch (e) { var o = document.getElementById('ms-st-ov'); if (o) o.remove(); }
  }

  /* 選項位置隨機：所有關卡出題後，把四個選項重新洗牌（甲乙丙丁、ABCD 這種有編號的、以及「以上皆…」類型除外） */
  function shuffleOpts(r) {
    if (!r || !r.options || r.options.length < 3) return;
    var o = r.options.map(String);
    if (o.every(function (x) { return /^[甲乙丙丁ABCD①②③④1-4]$/.test(x.trim()); })) return;
    var pin = [], free = [];
    o.forEach(function (x) { (/皆是|皆非|皆不|皆可|以上皆|以上都/.test(x) ? pin : free).push(x); });
    for (var i = free.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = free[i]; free[i] = free[j]; free[j] = t; }
    var n = free.concat(pin);
    if (n.indexOf(String(r.ans)) < 0) return;
    r.options = n;
  }
  function wrapGen() {
    if (typeof window.gen !== 'function' || window.gen.__ms) return;
    var og = window.gen;
    var w = function () { var r = og.apply(this, arguments); try { shuffleOpts(r); } catch (e) {} return r; };
    w.__ms = 1; window.gen = w;
  }

  document.addEventListener('click', function (e) { var t = e.target; if (t && t.closest && t.closest('#t-hint, #st-hint, #t-cut') && !(typeof lock !== 'undefined' && lock)) S.hints = (S.hints || 0) + 1; }, true);
  var MS = {
    cfg: CFG,
    _plan: function (qq) { return stPlanFor(qq); },
    _st: function () { stTutor(); },
    _parse: function (t) { return listTxt(stParse(t)); },
    _closeTutor: function () { var o = document.getElementById('ms-st-ov'); if (o) o.remove(); },
    // 每個關卡主程式最後呼叫一次：MS.init(MODES, SID)
    init: function (M, sid) {
      S.M = M || null;
      S.sid = sid || '';
      wrapGen();
      if (M && M.real && M.hard) S.orig = { real: M.real.t, hard: M.hard.t };
      injectStyle();
      var anchor = $('#modes');
      if (anchor && S.flag) { (anchor.closest('section') || anchor.parentNode).classList.add('ms-pre'); setTimeout(function () { var g = $('#go'); if (g) g.click(); }, 0); }
      if (anchor) {
        injectLesson(anchor);
        var p = document.createElement('div'); p.className = 'ms-panel'; p.id = 'ms-panel';
        anchor.parentNode.insertBefore(p, anchor);
        var ag = $('#again');
        if (ag && (S.pre || S.flag)) ag.addEventListener('click', function () { setTimeout(function () { var g = $('#go'); if (g) g.click(); }, 0); });
        if (S.pre) { preStart(anchor); }
        else if (S.prac) { pracStart(anchor); }
        else if (!S.flag) {
          // 三種模式直接開放：點模式＝選好模式並立刻開打（原本的「迎戰」按鈕收起來）
          var goEl = $('#go'); if (goEl) goEl.style.display = 'none';
          anchor.addEventListener('click', function (e) {
            var b = e.target.closest && e.target.closest('.mode');
            if (!b || b.classList.contains('ms-locked')) return;
            setTimeout(function () { var g = $('#go'); if (g) g.click(); }, 0);
          });
        }
      }
      // 練兵專用：老師教我 + 已使用提示
      var tools = $('.tools');
      if (tools && !S.flag) {
        var tb = document.createElement('button'); tb.className = 'tool'; tb.id = 't-teach'; tb.type = 'button'; tb.textContent = '🧑‍🏫 老師教我'; tb.style.display = 'none';
        tb.onclick = teachOpen; tools.appendChild(tb);
      }
      var top = $('#s-game .top');
      if (top) { var bd = document.createElement('span'); bd.id = 'ms-taught'; bd.style.display = 'none'; top.appendChild(bd); }
      if (S.flag) {
        var g = $('#s-game');
        if (g) {
          var row = document.createElement('div'); row.className = 'ms-quitrow';
          row.innerHTML = '<button class="btn ghost" id="ms-quit">🏁 結算離場</button>';
          g.appendChild(row);
          $('#ms-quit').onclick = function () {
            if (S.active && !S.ended && typeof window.finish === 'function') window.finish();
          };
        }
      }
      refresh();
    },
    // start() 裡呼叫：回傳 true 代表這一局是無極限（題目改成一題一題現場出）
    begin: function (rescue) {
      S.ended = false; S.lastType = null; S.taught = 0; S.hints = 0; updateBadge(); var agb0 = document.getElementById('again'); if (agb0) agb0.classList.remove('hide');
      S.active = S.flag && !rescue && S.stars >= CFG.ENDLESS_NEED;
      if (!S.active) restore();
      var tb = $('#t-teach');
      if (tb) tb.style.display = (!rescue && !S.flag && typeof mode !== 'undefined' && mode === 'easy') ? '' : 'none';
      return S.active;
    },
    active: function () { return S.active; },
    halt: function () { return S.active && S.ended; },
    // next() 裡呼叫：設定第 n 題的時間，並回傳出題難度（'real' 或 'hard'）
    prep: function (n) {
      var t = timeFor(n, S.orig.real, S.orig.hard);
      S.M.real.t = t; S.M.hard.t = t;
      return n > CFG.SWITCH ? 'hard' : 'real';
    },
    // 從題型清單隨機挑一種（盡量不連續重複）
    pick: function (PL) {
      var kinds = PL.filter(function (v, i) { return PL.indexOf(v) === i; }).length, t, k = 0;
      do { t = PL[Math.floor(Math.random() * PL.length)]; } while (kinds > 1 && t === S.lastType && k++ < 8);
      S.lastType = t; return t;
    },
    wave: function (idx, len, unit) {
      setTimeout(stMaybe, 0);
      return S.active ? '♾️ 第 ' + idx + ' ' + unit : '第 ' + idx + '/' + len + ' ' + unit;
    },
    hp: function (right, len) {   // Boss 血條：無極限時每答對 10 題循環一次
      return S.active ? 100 - (right % 10) * 10 : 100 - right / len * 100;
    },
    // finish() 最後呼叫：依模式結算星數、畫結算畫面、通知地圖
    result: function (o) {
      var so = document.getElementById('ms-st-ov'); if (so) so.remove();
      if (o.rescue) { if (S.prac) pracDone(o); return; }
      var $t = $('#e-title'), $s = $('#e-stars'), $i = $('#e-info');

      /* ---- 無極限 ---- */
      if (S.active) {
        var count = o.right, old = S.best, isNew = count > old && count > 0;
        if (isNew) S.best = count;
        S.ended = true; restore();
        $t.textContent = '♾️ 無極限挑戰結束';
        $s.textContent = '🏆 ' + count + ' 題';
        $i.innerHTML = '戰功 ' + o.score + '<br>' + (isNew
          ? '🎉 新紀錄！' + (old ? '超越原本的 ' + old + ' 題' : '這是你的第一筆紀錄')
          : '🏆 目前最高紀錄：<b>' + S.best + '</b> 題（本次 ' + count + ' 題）');
        if (o.emb) post({ type: 'endless-result', id: o.sid, count: count, score: o.score, newRecord: isNew });
        refresh();
        return;
      }

      /* ---- 練兵 ---- */
      if (o.mode === 'easy') {
        var prev = S.stars, add = '', acc = o.total ? o.right / o.total : 0, hinted = S.hints > 0;
        var stars = o.fail ? 0 : (acc >= CFG.EASY_STAR3_ACC - 1e-9 && !hinted) ? 3 : (acc >= CFG.EASY_STAR2_ACC - 1e-9) ? 2 : 1;
        var names = ['', '見習召喚師', '中階召喚師', '菁英召喚師'];
        if (!o.fail && acc >= CFG.EASY_STAR3_ACC - 1e-9 && hinted) add += '<br>💡 這一局用了提示，所以是 2 ⭐；不用提示全部答對，就是完美通關！';
        if (S.taught > 0 && !o.fail && stars > CFG.TAUGHT_MAX) {
          stars = CFG.TAUGHT_MAX;
          add += '<br>🧑‍🏫 這一局用了「老師教我」，最多拿 ' + CFG.TAUGHT_MAX + ' ⭐（想拿 3 ⭐ 就自己挑戰一次吧！）';
        } else if (S.taught > 0) {
          add += '<br>🧑‍🏫 這一局用了「老師教我」。';
        }
        if (names[o.stars] && names[stars] && o.stars !== stars && $i.textContent.indexOf(names[o.stars]) === 0) $i.textContent = $i.textContent.replace(names[o.stars], names[stars]);
        if (!o.fail && stars >= 1) {
          var msg = stars === 3 ? '🏆 完美通關！直接去實戰驗收吧！' : stars === 2 ? '👏 恭喜答對率達 ' + Math.round(CFG.EASY_STAR2_ACC * 100) + '%，來挑戰完美通關吧！' : '🐱 你完成這一局了！答對率達 ' + Math.round(CFG.EASY_STAR2_ACC * 100) + '% 就能拿 2 ⭐，準備好增加答對率了嗎？';
          add += '<br><b>' + msg + '</b><br><button class="btn" id="ms-nextgo" type="button">' + (stars === 3 ? '⚔️ 去實戰' : '🔁 重新挑戰') + '</button>';
        }
        if (!o.fail) $s.textContent = easyStr(stars);
        if (!o.fail && stars >= 1) capture();
        S.stars = Math.max(S.stars, stars);
        $i.innerHTML += add + '<br>📊 本關目前最高：' + easyStr(S.stars);
        var ng = document.getElementById('ms-nextgo'), agb = document.getElementById('again'); if (ng && agb) agb.classList.add('hide');
        if (ng) ng.onclick = function () { if (stars === 3) { var rm = document.querySelector('.mode[data-m="real"]'); if (rm) rm.click(); } var ag = document.getElementById('again'); if (ag) ag.click(); };
        if (o.emb) post({ type: 'stage-result', id: o.sid, stars: stars, fail: o.fail, score: o.score, right: o.right, total: o.total, mode: 'easy' });
        refresh();
        return;
      }

      /* ---- 實戰 / 修羅 ---- */
      var real = o.mode === 'real';
      var need = real ? CFG.REAL_PASS : CFG.HARD_PASS, prize = real ? CFG.REAL_STAR : CFG.HARD_STAR;
      var acc = o.total ? o.right / o.total : 0, pct = Math.round(acc * 100);
      var pass = !o.fail && acc + 1e-9 >= need, gain = pass ? prize : 0, prev2 = S.stars;
      if (pass) S.stars = Math.max(S.stars, gain);
      var orig = $t.textContent;
      if (!pass) { if (!o.fail) $t.textContent = '差一點就達標了！'; }
      else if (/凱旋！$/.test(orig)) $t.textContent = (real ? '將軍' : '兵仙') + '　凱旋！';   // Boss 關保留原本標題
      $s.textContent = pass ? starStr(gain) : (o.fail ? '🏃' : '');   /* 沒達標：不顯示星星，避免和「差一點」互相矛盾 */
      var add2 = '<br>🎯 正確率 ' + pct + '%（目標 ' + Math.round(need * 100) + '%）　' + (pass ? '✅ 達標！' : '💪 還差一點，再挑戰一次！這關已有的星數不會減少');
      if (pass && gain > prev2) add2 += '<br>⭐ 這一關升到 ' + gain + ' 星！';
      if (!pass) add2 += '<br>📊 本關目前最高：' + (S.stars ? starStr(S.stars) : '還沒有星');
      else add2 += '<br>📊 本關目前最高：' + starStr(S.stars);
      $i.innerHTML += add2;
      if (pass) capture();
      if (o.emb) post({ type: 'stage-result', id: o.sid, stars: gain, fail: !pass, score: o.score, right: o.right, total: o.total, mode: o.mode });
      refresh();
    }
  };
  window.MS = MS;
  // 答錯／超時橫幅改溫和（練兵、實戰、修羅都適用）；用 CFG.SOFT_BANNER 可關掉
  try {
    new MutationObserver(function () {
      if (CFG.SOFT_BANNER === false) return;
      var e = document.getElementById('say'); if (!e) return;
      var bb = e.querySelector('b'); if (!bb) return;
      var t = bb.textContent;
      if (/^💥/.test(t)) { var md = (typeof mode !== 'undefined') ? mode : ''; bb.textContent = md === 'easy' ? '📝 這題先記答錯，再練一次就會了！' : md === 'hard' ? '📝 這題沒答對，看看解析吧；修羅要全對才達標，下次再挑戰！' : '📝 這題沒答對，看看解析，下一題再加油！'; e.style.borderColor = '#e0a030'; }
      else if (/^⏰ 時間到，/.test(t)) { bb.textContent = '⏰ 時間到囉，看看解析，下一題再加油！'; e.style.borderColor = '#e0a030'; }
    }).observe(document.body, { childList: true, subtree: true });
  } catch (e) {}
})();

/* ===== 🗺️ 隨時可用的「回地圖」按鈕（所有關卡頁共用）=====
   - 從章節地圖打開（iframe）：關閉關卡、回到該章節地圖
   - 直接開關卡檔案：跳到該章節的 world-map-vol2chN.html
   - 這一局正在進行中就會先確認，避免不小心按到而白打 */
(function () {
  'use strict';
  function build() {
    if (document.getElementById('ms-backmap')) return;
    var st = document.createElement('style');
    st.textContent =
      '#ms-backmap{position:fixed;top:8px;left:8px;z-index:40;background:rgba(22,26,46,.92);color:var(--txt,#e9e4d4);' +
      'border:2px solid var(--bronze,var(--accent-gold,#d2a24c));border-radius:20px;padding:5px 14px;font:inherit;font-size:.9rem;font-weight:700;cursor:pointer;line-height:1.4}' +
      '#ms-backmap:hover{background:var(--bronze,var(--accent-gold,#d2a24c));color:#2a1d05}' +
      '#ms-backmap:focus-visible{outline:3px solid #fff;outline-offset:2px}' +
      'body.ms-hasback{padding-top:46px!important}';
    document.head.appendChild(st);
    document.body.classList.add('ms-hasback');
    var b = document.createElement('button');
    b.id = 'ms-backmap'; b.type = 'button'; b.textContent = '🗺️ 回地圖';
    b.setAttribute('aria-label', '回到章節地圖');
    b.onclick = function () {
      var g = document.getElementById('s-game');
      var playing = g && !g.classList.contains('hide');
      if (playing && !confirm('這一局還沒打完，現在離開的話，這一局的星星與成績不會計入。\n確定要回地圖嗎？')) return;
      var embedded = false;
      try { embedded = window.parent && window.parent !== window; } catch (e) { embedded = true; }
      if (embedded) {
        try { window.parent.postMessage({ type: 'stage-exit' }, '*'); } catch (e) {}
      } else {
        var m = location.pathname.match(/stage(\d)-/);
        location.href = 'world-map-vol2ch' + (m ? m[1] : '1') + '.html';
      }
    };
    document.body.appendChild(b);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();

/* ---- 分數上下堆疊顯示（只改畫面，不動資料；文字內容仍保持 "3/4"） ---- */
(function () {
  if (window.__fracStack) return; window.__fracStack = 1;
  var css = '.fr{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 .12em;line-height:1.15;position:relative;text-align:center}' +
    '.fr .fn{border-bottom:.09em solid currentColor;padding:0 .18em .04em;display:block}' +
    '.fr .fd{padding:.04em .18em 0;display:block}' +
    '.fr.fneg{margin-left:.03em}.fr .fs{position:absolute;width:0;height:0;overflow:hidden;font-size:0;opacity:0}';
  var st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);
  var RX = /(?<![\w\/.])(?<!第\s*)(?<!答對\s*)(?<!得分\s*)(?<!共\s*)(?<!答\s*)(-?)(\d*[xy]|\d+|[kxy])\/(\d+|[xy])(?![\w\/])(?!\s*[回題關組個次人局道分步頁])/g;
  function ok(t) { return /\//.test(t); }
  function skip(n) {
    var p = n.parentNode; if (!p) return true;
    var tag = p.nodeName; if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'OPTION' || tag === 'TITLE') return true;
    if (p.closest && (p.closest('.fr') || p.closest('svg') || p.closest('[contenteditable="true"]'))) return true;
    return false;
  }
  function conv(n) {
    var t = n.nodeValue; if (!ok(t) || skip(n)) return;
    RX.lastIndex = 0; var m, last = 0, frag = null;
    while ((m = RX.exec(t))) {
      var num = m[2], den = m[3];
      if (/^[kxy]$/.test(num) && !/^[xy]$/.test(den) && false) continue;
      if (/^[xy]$/.test(den) && !/^[kxy]$/.test(num)) continue;
      if (/^\d+$/.test(den) === false && /^\d+$/.test(num)) continue;
      frag = frag || document.createDocumentFragment();
      if (m.index > last) frag.appendChild(document.createTextNode(t.slice(last, m.index)));
      if (m[1]) frag.appendChild(document.createTextNode(m[1]));
      var s = document.createElement('span'); s.className = m[1] ? 'fr fneg' : 'fr';
      s.innerHTML = '<span class="fn">' + num + '</span><span class="fs">/</span><span class="fd">' + den + '</span>';
      frag.appendChild(s); last = m.index + m[0].length;
    }
    if (!frag) return;
    if (last < t.length) frag.appendChild(document.createTextNode(t.slice(last)));
    n.parentNode.replaceChild(frag, n);
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { conv(root); return; }
    if (root.nodeType !== 1) return;
    if (root.classList && root.classList.contains('fr')) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), arr = [], x;
    while ((x = w.nextNode())) if (ok(x.nodeValue)) arr.push(x);
    arr.forEach(conv);
  }
  var busy = false;
  function run(muts) {
    if (busy) return; busy = true;
    try {
      muts.forEach(function (mu) {
        if (mu.type === 'characterData') conv(mu.target);
        else mu.addedNodes.forEach(function (n) { walk(n); });
      });
    } catch (e) {}
    busy = false;
  }
  function start() {
    walk(document.body);
    new MutationObserver(function (m) { var o = busy; run(m); }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();

/* =====================================================================
   休息小遊戲接口（2026-10-22）
   - 每答 every 題，或連續答對 streak 題（數字在 game-config.js 的 relax 區塊）→ 在「題與題之間」彈出一款小遊戲
   - 小遊戲只玩一局；贏電腦 → 開寶箱（補血／補魔／復活道具）；輸或放棄 → 回去答題
   - 這一章會抽到哪 5 款，由 relax.pools 決定
   - 不在「無極限挑戰」「重練錯題」「最後一題之後」彈出
   - 六個章節資料夾的 mode-system.js 內容一樣；這段會自己把上一層的 game-config.js、relax-break.bundle.js 載進來
   ===================================================================== */
(function () {
  'use strict';
  var me = document.currentScript, base = (me && me.src) ? me.src.replace(/[^\/]*$/, '') : '';
  function loadSync(f) { try { document.write('<script src="' + base + '../' + f + '"><\/script>'); } catch (e) {} }
  if (!window.GAME_CONFIG) loadSync('game-config.js');
  loadSync('relax-break.bundle.js');

  var HUB = 'jb2-hub-v1';
  function hubRead() { try { return JSON.parse(localStorage.getItem(HUB)) || {}; } catch (e) { return {}; } }
  function hubSave(h) { try { localStorage.setItem(HUB, JSON.stringify(h)); return true; } catch (e) { return false; } }
  function priceOf(GC, it) {
    if (it.price !== '' && it.price != null) return +it.price;
    var E = GC.economy || {};
    return Math.round((E.dailyBase || 200) * (it.days || 0) / (E.priceRound || 10)) * (E.priceRound || 10);
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* 寶箱：中心品階由目前模式決定；離中心 0／1／2／3 階的機率照 offsetPct；超出範圍就往另一邊 */
  function rollTier(C, modeName) {
    var tiers = C.tiers || [], n = tiers.length || 1;
    var center = Math.min(n, Math.max(1, (C.centerByMode && C.centerByMode[modeName]) || 1));
    var w = C.offsetPct || [90, 9, 0.7, 0.3], sum = 0, i;
    for (i = 0; i < w.length; i++) sum += +w[i] || 0;
    var r = Math.random() * sum, off = 0;
    for (i = 0; i < w.length; i++) { r -= +w[i] || 0; if (r <= 0) { off = i; break; } }
    var dir = Math.random() < 0.5 ? -1 : 1, t = center + dir * off;
    if (t < 1 || t > n) t = center - dir * off;
    return Math.min(n, Math.max(1, t));
  }
  function openChest(GC, R, modeName) {
    var C = R.chest || {}, tiers = C.tiers || [];
    if (!tiers.length) return '寶箱是空的（設定檔沒有道具）';
    var t = rollTier(C, modeName), id = pick(tiers[t - 1] || tiers[0]);
    var it = null; (GC.shop && GC.shop.items || []).forEach(function (x) { if (x.id === id) it = x; });
    if (!it) return '寶箱是空的（找不到道具 ' + id + '）';
    var h = hubRead(); h.inv = h.inv || {}; h.stat = h.stat || { earned: 0, spent: 0 };
    var have = h.inv[id] || 0, cur = (GC.currency && GC.currency.icon) || '💰', cn = (GC.currency && GC.currency.name) || '數靈幣';
    if (it.maxOwn && have >= it.maxOwn) {
      var g = priceOf(GC, it); h.gold = (h.gold || 0) + g; h.stat.earned = (h.stat.earned || 0) + g; hubSave(h);
      return '🎁 寶箱打開了！裡面是 ' + it.icon + ' ' + it.name + '，但背包已經滿了，換成 ' + cur + ' ' + g + ' ' + cn + '。';
    }
    h.inv[id] = have + 1;
    var ok = hubSave(h);
    return ok ? ('🎁 寶箱打開了！獲得 ' + it.icon + ' ' + it.name + ' ×1（已放進背包，可到地圖「🩹 隊伍」或戰鬥中使用）')
              : '🎁 寶箱打開了，但是存檔失敗（瀏覽器禁止儲存），這次沒有放進背包。';
  }

  /* 狀態回報：網址加 ?relaxdebug=1 會在畫面下方顯示小遊戲有沒有啟動、缺什麼（平常不顯示） */
  var DEBUG = /[?&]relaxdebug=1/.test(location.search);
  function status(msg, bad) {
    window.__relaxStatus = msg;
    try { (bad ? console.warn : console.info)('[小遊戲] ' + msg); } catch (e) {}
    if (!DEBUG) return;
    var d = document.getElementById('rb-status');
    if (!d) { d = document.createElement('div'); d.id = 'rb-status'; d.style.cssText = 'position:fixed;left:6px;right:6px;bottom:6px;z-index:99999;padding:6px 10px;border-radius:8px;font:13px/1.5 sans-serif;color:#fff;text-align:center'; (document.body || document.documentElement).appendChild(d); }
    d.style.background = bad ? '#b3261e' : '#1b6e3a'; d.textContent = '🎮 小遊戲：' + msg;
  }
  function addScript(f, cb) { var s = document.createElement('script'); s.src = base + '../' + f; s.onload = function () { cb(); }; s.onerror = function () { cb(); }; document.head.appendChild(s); }
  var retried = false;
  function setup() {
    var RB = window.RelaxBreak, GC = window.GAME_CONFIG, R = GC && GC.relax;
    if ((!RB || !GC || !R) && !retried) {            // 第一次載入沒成功（快取、網路慢…）：動態補載一次再試
      retried = true;
      var need = []; if (!GC || !R) need.push('game-config.js'); if (!RB) need.push('relax-break.bundle.js');
      var left = need.length; if (!left) return setup();
      need.forEach(function (f) { addScript(f + (f === 'game-config.js' ? '?r=' + Date.now() : ''), function () { if (--left === 0) setup(); }); });
      return;
    }
    if (!RB) return status('找不到 relax-break.bundle.js（要放在遊戲根目錄，和 game-config.js 同一層）', true);
    if (!GC) return status('找不到 game-config.js', true);
    if (!R) return status('game-config.js 是舊版，沒有 relax 區塊（請用 update19 的 game-config.js 覆蓋，並按 Ctrl+F5）', true);
    if (R.enabled === false) return status('設定檔把小遊戲關掉了（relax.enabled = false）', true);
    var sid = ''; try { sid = String(SID); } catch (e) {}
    var ch = +((sid.match(/^(\d+)/) || [])[1] || (location.pathname.match(/grade7-vol2-ch(\d)/) || [])[1] || 0);
    var pool = null; (R.pools || []).forEach(function (p) { if ((p.chapters || []).indexOf(ch) >= 0) pool = p; });
    if (!pool || !pool.games || !pool.games.length) return status('第 ' + ch + ' 章沒有設定小遊戲（relax.pools）', true);
    var games = {}; pool.games.forEach(function (id) { games[id] = (R.limitVariants && R.limitVariants[id]) || null; });

    var origNext = window.next, origLog = window.log;
    if (typeof origNext !== 'function' || typeof origLog !== 'function') return status('這個關卡檔找不到 next／log 函式，無法掛上小遊戲', true);
    if (window.__relaxHooked) return; window.__relaxHooked = true;
    function curMode() { try { return mode; } catch (e) { return 'easy'; } }
    function inRescue() { try { return !!rescue; } catch (e) { return false; } }
    function inEndless() { try { return !!(window.MS && window.MS.active && window.MS.active()); } catch (e) { return false; } }
    function atEnd() { try { return hearts <= 0 || idx >= qs.length; } catch (e) { return true; } }

    RB.init({
      deferred: true, multiple: R.multiple !== false, every: R.every, streak: R.streak, unlockWins: R.unlockWins, dailyLimit: R.dailyLimit,
      errStep: R.errStep, errMax: R.errMax, allowSkip: R.allowSkip !== false, storageKey: R.storageKey,
      adaptive: true, level: 'easy', rewardMode: 'chest', rewardLabels: { chest: '寶箱', stage: '寶箱' },
      games: games,
      rewards: { chest: function () { return openChest(GC, R, curMode()); }, stage: function () { return openChest(GC, R, curMode()); } },
      onStart: function () {},
      onEnd: function () { origNext.call(window); }
    });

    window.log = function (ok) {
      try { if (!inRescue() && !inEndless()) RB.answered(!!ok); } catch (e) {}
      return origLog.apply(this, arguments);
    };
    window.next = function () {
      try { if (!inRescue() && !inEndless() && !atEnd() && RB.poll()) return; } catch (e) {}
      return origNext.apply(this, arguments);
    };
    status('已啟用（第 ' + ch + ' 章：' + pool.games.join('、') + '；每 ' + R.every + ' 題（倍數）或連對 ' + R.streak + ' 題）', false);
  }
  if (document.readyState === 'complete') setup(); else window.addEventListener('load', setup);
})();
