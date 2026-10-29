/* =====================================================================
   mode-system.js ── 國一數學戰略地圖：星等制度 + 模式解鎖 + 無極限挑戰
   所有關卡 HTML 都會載入這一支（放在同一個資料夾即可）。

   【星等規則】（想調整數字，改下面 CFG 就好）
   三種模式可同時選擇（不需解鎖）：
   練兵模式：最多 2 星
   實戰模式：正確率 ≥ 60% → 3 星、≥ 80% → 4 星
   修羅模式：正確率 100%   → 5 星
   連續 2 次沒過關，結算畫面會給練習建議
   無極限挑戰：該關有 3 星就解鎖；題目無限，時間從實戰速度慢慢縮到修羅速度

   【網址參數】由 world-map.html 開關卡時帶入
   ?stars=N   這一關目前的星數（沒帶＝全部解鎖，方便老師直接開檔測試）
   ?eb=N      這一關無極限的歷史最高題數
   ?endless=1 進入無極限挑戰
   ===================================================================== */
(function () {
  'use strict';
  function stageBgm() { try { if (window.BGM) BGM.play('stage-' + (S.sid || 'x'), 'battle'); } catch (e) {} }   // 有 audio/bgm/stage-關卡代號.mp3 就播它，沒有用內建音樂
  (function(){ var sc = document.createElement('script'); sc.src = 'bgm.js'; sc.onload = function(){ stageBgm(); }; document.head.appendChild(sc);
    var s2 = document.createElement('script'); s2.src = 'sfx.js'; document.head.appendChild(s2);
    var s3 = document.createElement('script'); s3.src = 'th-explain.js'; document.head.appendChild(s3); })();   // 答錯說明的泰文版（按鈕才顯示）
  function snd(n) { try { if (window.SND) { SND.play(n); return true; } } catch (e) {} return false; }
  var GC = window.GAME_CONFIG || {}, GS = GC.stars || {}, GT = GC.stage || {};   // 所有數值來自 game-config.js
  var CFG = { REAL_NEED: 0, HARD_NEED: 0, ENDLESS_NEED: GS.endlessNeed || 3, MAXSTAR: GS.maxStar || 5, RAMP: GT.endlessRamp || 30, SWITCH: GT.endlessSwitch || 15 };
  var TIERS = {
    easy: GS.easy || [{ acc: 0.6, stars: 1 }, { acc: 1, stars: 2 }],
    real: GS.real || [{ acc: 0.6, stars: 3 }, { acc: 0.9, stars: 4 }],
    hard: GS.hard || [{ acc: 0.6, stars: 3 }, { acc: 0.8, stars: 4 }, { acc: 1, stars: 5 }]
  };
  function starsFor(mode, acc) { var g = 0; (TIERS[mode] || []).forEach(function (t) { if (acc + 1e-9 >= t.acc && t.stars > g) g = t.stars; }); return g; }
  function maxStarOf(mode) { var g = 0; (TIERS[mode] || []).forEach(function (t) { if (t.stars > g) g = t.stars; }); return g; }
  function ruleText(mode) { return '🎯 正確率 ' + (TIERS[mode] || []).map(function (t) { return Math.round(t.acc * 100) + '% → ' + t.stars + ' ⭐'; }).join('、'); }

  var qp = new URLSearchParams(location.search);
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var $ = function (s) { return document.querySelector(s); };
  var S = {
    stars: qp.has('stars') ? clamp(parseInt(qp.get('stars'), 10) || 0, 0, CFG.MAXSTAR) : CFG.MAXSTAR,
    best: Math.max(0, parseInt(qp.get('eb'), 10) || 0),
    flag: qp.get('endless') === '1',
    active: false, ended: false, M: null, orig: null, lastType: null
  };

  function post(m) { try { window.parent.postMessage(m, '*'); } catch (e) {} }
  function starStr(n) { return '⭐'.repeat(n) + '☆'.repeat(CFG.MAXSTAR - n); }
  function lockMsg(m) {
    if (m === 'real' && S.stars < CFG.REAL_NEED) return '需先在練兵模式拿到 ' + CFG.REAL_NEED + ' ⭐（目前 ' + S.stars + ' ⭐）';
    if (m === 'hard' && S.stars < CFG.HARD_NEED) return '需先在實戰模式拿到 ' + CFG.HARD_NEED + ' ⭐（目前 ' + S.stars + ' ⭐）';
    return '';
  }
  var RULE = { easy: ruleText('easy'), real: ruleText('real'), hard: ruleText('hard') };
  // 第 n 題的作答秒數：從實戰時間慢慢縮到修羅時間，之後維持修羅時間
  function timeFor(n, tr, th) {
    var k = Math.min(1, (n - 1) / (CFG.RAMP - 1));
    return Math.round((tr - (tr - th) * k) * 10) / 10;
  }
  function restore() {
    if (S.M && S.orig) { S.M.real.t = S.orig.real; S.M.hard.t = S.orig.hard; }
  }

  function injectStyle() {
    var st = document.createElement('style');
    st.textContent =
      '.ms-panel{margin:12px 0;padding:10px 12px;border:1px dashed var(--line,#3a4270);border-radius:10px;line-height:1.7;font-size:.95rem}' +
      '.mode.ms-locked{opacity:.5}' +
      '.mode .ms-rule{color:var(--bronze,var(--accent-gold,#d2a24c));opacity:1!important}' +
      '.ms-quitrow{text-align:center;margin:14px 0 0}' +
      '.ms-quitrow .btn{padding:8px 16px;font-size:.95rem}' +
      '.ms-lesson{margin:14px 0;padding:14px 16px;border:1.5px solid var(--accent-gold,#d2a24c);border-radius:12px;background:rgba(210,162,76,0.08);line-height:1.7;text-align:left}' +
      '.ms-lhead{font-weight:700;margin-bottom:6px;font-size:1.05rem}' +
      '.ms-lsec{margin:8px 0}' +
      '.ms-lsec>b{color:var(--bronze,var(--accent-gold,#d2a24c))}' +
      '.ms-lsec ul{margin:4px 0 0;padding-left:1.3em}' +
      '.ms-lsec li{margin:2px 0}' +
      '.ms-video{position:relative;padding-bottom:56.25%;height:0;margin:10px 0;border-radius:8px;overflow:hidden;background:#000}' +
      '.ms-video iframe{position:absolute;inset:0;width:100%;height:100%;border:0}' +
      '.ms-novideo{margin:10px 0;font-size:.85rem;opacity:.65}' +
      '.ms-lhead small{font-weight:400;opacity:.7;font-size:.8rem}' +
      '.ms-ldots{display:flex;gap:5px;justify-content:center;flex-wrap:wrap;margin:6px 0 10px}' +
      '.ms-ldots i{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.18)}' +
      '.ms-ldots i.ok{background:var(--accent-gold,#d2a24c);opacity:.6}.ms-ldots i.on{background:var(--accent-gold,#d2a24c);transform:scale(1.35)}' +
      '.ms-ltag{font-weight:700;color:var(--bronze,var(--accent-gold,#d2a24c));margin-bottom:6px}' +
      '.ms-lsay{font-size:1.25rem;line-height:1.9;min-height:5.5em;display:flex;align-items:center;animation:mslin .35s ease}' +
      '@keyframes mslin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}' +
      '.ms-lnav{display:flex;gap:10px;justify-content:center;margin-top:12px;flex-wrap:wrap}' +
      '.ms-lnav .btn{padding:10px 20px;font-size:1.05rem}' +
      '.ms-lskip{text-align:center;margin-top:10px;opacity:.85}.ms-lskip .btn{padding:6px 14px;font-size:.9rem;opacity:.8}' +
      '#ms-ready{display:block}' +
      /* ⚔️ 戰場：勇者在左、敵兵在右 */
      '.ms-scene{position:relative;height:150px;margin:12px 0;border-radius:12px;overflow:hidden;border:2px solid var(--line,#3a4270);background:linear-gradient(#1b2040,#2b3160 80%,#3b3f2e 80%)}' +
      '.ms-scene::after{display:none!important}.ms-scene #enemy,.ms-scene .wall{display:none!important}' +
      '.ms-hero{position:absolute;left:5%;bottom:10px;height:122px;transform-origin:35% 100%;z-index:2}' +
      '.ms-hero img{height:100%;width:auto;display:block;filter:drop-shadow(0 4px 4px #0009)}.ms-hero .emo{font-size:4.2rem;line-height:122px}' +
      '.ms-hero.atk{animation:msDash .8s ease}' +
      '@keyframes msDash{0%{transform:none}30%,62%{transform:translateX(var(--dash,160px))}100%{transform:none}}' +
      '.ms-hero.ko{transform-origin:50% 88%;transform:translate(50px,-22px) rotate(-82deg);transition:transform .35s cubic-bezier(.3,1.5,.6,1) .12s;filter:grayscale(.4)}' +
      '.ms-squad{position:absolute;right:3%;bottom:8px;display:flex;align-items:flex-end;transition:transform .2s linear;color:#a4362a}' +
      '.ms-squad.rush{transition:transform .3s cubic-bezier(.5,0,.9,.6)}' +
      '.ms-sol{position:relative;width:44px;height:62px;margin-left:-10px;transform-origin:60% 100%;transition:transform .35s ease,opacity .5s ease .35s}' +
      '.ms-sol:nth-child(even){margin-bottom:14px;color:#8c2d24}.ms-sol svg{width:100%;height:100%;display:block}' +
      '.ms-sol.down{transform:rotate(84deg) translate(6px,-4px);opacity:.55}' +
      '.ms-sol.spawn{animation:msSpawn .45s ease both}@keyframes msSpawn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:none}}' +
      '.ms-sol.thrust svg{animation:msThrust .25s ease 3}@keyframes msThrust{50%{transform:translateX(-10px)}}' +
      '.ms-flag{position:absolute;left:50%;top:-24px;transform:translateX(-50%);font-size:1.2rem;white-space:nowrap}' +
      '.ms-fx{position:absolute;font-size:2.6rem;z-index:3;pointer-events:none;animation:msFx .6s ease forwards}@keyframes msFx{from{transform:scale(.3);opacity:1}to{transform:scale(1.5);opacity:0}}' +
      '@media (max-width:480px){.ms-scene{height:126px}.ms-hero{height:100px}.ms-hero .emo{line-height:100px;font-size:3.4rem}.ms-sol{width:36px;height:51px}}' +
      /* 🧙 軍師一步一步拆解 */
      '#s-game.ms-tut-on>.q,#s-game.ms-tut-on>.opts,#s-game.ms-tut-on>.tools{display:none!important}' +
      '.mt{margin:12px 0;padding:12px 14px;background:var(--ink2,#20264a);border:2px solid var(--bronze,var(--accent-gold,#d2a24c));border-radius:14px}' +
      '.mt-head{display:flex;justify-content:space-between;align-items:center;font-weight:700;color:var(--bronze,#d2a24c)}.mt-head small{font-weight:400;opacity:.8}' +
      '.mt-q{margin:8px 0;padding:10px 12px;background:var(--paper,#f1e8d2);color:#2b2416;border-radius:10px;font-size:1.15rem;font-weight:700;text-align:center;line-height:1.5}' +
      '.mt-vis{background:var(--paper,#f1e8d2);color:#2b2416;border-radius:10px;padding:6px 8px;margin:6px 0;text-align:center;line-height:1.6}.mt-vis:empty{display:none}' +
      '.mt-say{background:#0003;border-left:4px solid var(--bronze,#d2a24c);padding:10px 12px;border-radius:8px;line-height:1.8;font-size:1.05rem;animation:mslin .3s ease}' +
      '.mt-fb{margin:6px 0 0;padding:0 10px;border-radius:8px;line-height:1.6;font-size:.95rem}.mt-fb:empty{display:none}' +
      '.mt-fb.warn{padding:8px 10px;background:#ffe3dc;color:#5a1d12}.mt-fb.hint{padding:8px 10px;background:#fff3c4;color:#4d3a00}.mt-fb.good{padding:6px 10px;background:#d9f2ea;color:#0b3b2e}' +
      '.mt-hist{margin:8px 0 0;font-size:1.05rem;line-height:1.8;font-variant-numeric:tabular-nums;overflow-x:auto}.mt-hist:empty{display:none}.mt-hist div{white-space:nowrap;opacity:.7}.mt-hist div:last-child{opacity:1;color:var(--bronze,#d2a24c);font-weight:700}' +
      '.mt-ch{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}' +
      '.mt-opt{background:var(--ink,#161a2e);border:2px solid var(--line,#3a4270);border-radius:10px;padding:12px 8px;font-size:1.15rem;font-weight:700;font-variant-numeric:tabular-nums}' +
      '.mt-opt:hover:not(:disabled){border-color:var(--bronze,#d2a24c)}.mt-opt.bad{opacity:.35;text-decoration:line-through;border-color:var(--red,#d24a33)}.mt-opt.ok{background:var(--jade,#43a58f);border-color:var(--jade,#43a58f);color:#06231c;opacity:1}' +
      '.mt-expr{margin:8px 0;padding:10px 12px;background:#0003;border-radius:10px;text-align:center;overflow-x:auto;font-variant-numeric:tabular-nums}.mt-expr .h{opacity:.6;font-size:1.1rem;line-height:1.8;white-space:nowrap}.mt-expr .cur{font-size:1.7rem;font-weight:700;line-height:2.1;white-space:nowrap}' +
      '.mt-op{cursor:pointer;display:inline-block;min-width:1.5em;padding:0 .2em;margin:0 .1em;border-radius:8px;background:#ffffff14;border:1px dashed #ffffff66}.mt-op:hover{border-color:var(--bronze,#d2a24c);background:#ffffff26}.mt-op.sup{min-width:0;padding:0 .1em;vertical-align:top;font-size:.8em}.mt-op.hint{background:#fff3c4;color:#4d3a00;border-color:#d2a24c;animation:mslin .3s ease}' +
      '.mt-pad{max-width:320px;margin:10px auto 0}.mt-disp{font-size:1.4rem;font-weight:700;text-align:center;padding:8px;background:#0004;border-radius:10px;margin-bottom:8px;min-height:2.2em;font-variant-numeric:tabular-nums}.mt-keys{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.mt-key{padding:12px 0;font-size:1.3rem;font-weight:700;border-radius:10px;border:2px solid var(--line,#3a4270);background:var(--ink,#161a2e)}.mt-key:hover{border-color:var(--bronze,#d2a24c)}.mt-key.go{grid-column:span 2;background:var(--bronze,#d2a24c);color:#2a1d05;border-color:var(--bronze,#d2a24c)}' +
      '.mt-chips{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}.mt-chip{padding:12px 16px;border:2px solid var(--line,#3a4270);border-radius:12px;font-size:1.4rem;font-weight:700;background:var(--ink,#161a2e);min-width:3.2em}.mt-chip.flip{background:#a4362a;border-color:#d24a33}' +
      '.mt-ch2{margin-top:6px}' +
      '.th-box{margin:8px 0;padding:10px 12px;border-radius:10px;background:#0004;border:1px solid #d2a24c88;text-align:left;line-height:1.8;font-size:.95rem;font-family:"Leelawadee UI","Tahoma","Noto Sans Thai","Noto Sans TC",sans-serif}.th-title{font-weight:700;color:var(--bronze,#d2a24c)}.th-gl{margin-top:8px;padding-top:6px;border-top:1px dashed #ffffff44;font-size:.85rem;opacity:.9}.th-ms{margin-top:6px;opacity:.7;font-size:.85rem}' +
      '.mt-pairx{display:flex;flex-wrap:nowrap;gap:4px;justify-content:center;align-items:center;font-size:1.25rem;font-weight:700;padding:10px 6px;background:#0003;border-radius:10px;margin-bottom:8px;overflow-x:auto;white-space:nowrap}.mt-pairx.good{background:#43a58f33}.mt-tx{padding:0 1px}' +
      '.mt-tk{padding:4px 9px;border:2px dashed var(--bronze,#d2a24c);border-radius:10px;background:var(--ink,#161a2e);font-size:1.25rem;font-weight:700;flex:none}.mt-tk:hover{background:#ffffff1f}.mt-tk.on{background:var(--jade,#43a58f);border-style:solid;color:#06231c}' +
      '.mt-n.pk{cursor:pointer;border:2px dashed var(--bronze,#d2a24c);border-radius:8px;padding:0 .2em;animation:mslin .3s ease}.mt-n.on{background:var(--jade,#43a58f);color:#06231c;border:2px solid var(--jade,#43a58f);border-radius:8px;padding:0 .2em}' +
      '.mt-ctl{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:10px}.mt-ctl .btn{padding:6px 12px;font-size:.9rem}' +
      '@media (max-width:480px){.mt-ch{grid-template-columns:1fr}}' +
      '@media (prefers-reduced-motion:reduce){.ms-hero.atk,.ms-sol.spawn,.ms-sol.thrust svg,.ms-fx{animation:none}}';
    document.head.appendChild(st);
  }

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  // 在「開始挑戰」按鈕群組前面插入課前複習卡片；複習卡片會把模式選單／開始按鈕包進
  // #ms-gate 先隱藏起來，按下「我複習好了」才會顯示，達到「先複習、再作答」的順序。
  function injectLesson(anchor) {
    var goEl = $('#go');
    if (!goEl) return;
    var L = window.LESSONS && window.LESSONS[S.sid];
    var parent = anchor.parentNode;
    var gate = document.createElement('div'); gate.id = 'ms-gate';
    gate.style.display = L ? 'none' : '';
    parent.insertBefore(gate, anchor);
    var node = anchor, next;
    while (node) { next = node.nextSibling; gate.appendChild(node); if (node === goEl) break; node = next; }
    if (!L) return;
    var box = document.createElement('div'); box.className = 'ms-lesson';
    // 把每一條觀念／技巧再拆成「一句一頁」（遇到 。！？ 就換頁）
    var cut = function (t) { return String(t).match(/[^。！？]+[。！？]*[」』）)]*/g) || [String(t)]; };
    var pages = [];
    (L.concept || []).forEach(function (t) { cut(t).forEach(function (x) { pages.push({ k: 'c', t: x.trim() }); }); });
    (L.tip || []).forEach(function (t) { cut(t).forEach(function (x) { pages.push({ k: 't', t: x.trim() }); }); });
    if (L.video) pages.push({ k: 'v' });
    var key = 'hy_lesson_seen_v1', seen = {};
    try { seen = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (e) { }
    var done = !!seen[S.sid], cur = 0;
    var finish = function () {
      try { seen[S.sid] = 1; localStorage.setItem(key, JSON.stringify(seen)); } catch (e) { }
      gate.style.display = ''; box.style.display = 'none';
    };
    function draw() {
      var p = pages[cur], last = cur === pages.length - 1, dots = '';
      for (var i = 0; i < pages.length; i++) dots += '<i class="' + (i === cur ? 'on' : i < cur ? 'ok' : '') + '"></i>';
      var body = p.k === 'v'
        ? '<div class="ms-ltag">🎬 教學影片</div><div class="ms-video"><iframe src="' + esc(L.video) + '" title="教學影片" loading="lazy" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe></div>'
        : '<div class="ms-ltag">' + (p.k === 'c' ? '🧠 觀念重點' : '💡 作答技巧') + '</div><div class="ms-lsay" key="' + cur + '">' + esc(p.t) + '</div>';
      box.innerHTML =
        '<div class="ms-lhead">📖 上課前，先複習一下！<small>　第 ' + (cur + 1) + ' / ' + pages.length + ' 句</small></div>' +
        '<div class="ms-ldots">' + dots + '</div>' + body +
        '<div class="ms-lnav">' +
        (cur > 0 ? '<button class="btn" id="ms-prev">◀ 上一句</button>' : '') +
        (last ? '<button class="btn" id="ms-ready">✅ 我複習好了，開始選模式！</button>' : '<button class="btn" id="ms-nextp">下一句 ▶</button>') +
        '</div>' +
        (done ? '<div class="ms-lskip"><button class="btn" id="ms-skip">⏭️ 這關我看過了，直接略過</button></div>'
              : '<div class="ms-lskip"><small>第一次來這一關，請把每一句都看完喔～以後就可以略過。</small></div>');
      var q = function (id) { return box.querySelector(id); };
      if (q('#ms-prev')) q('#ms-prev').onclick = function () { cur--; draw(); };
      if (q('#ms-nextp')) q('#ms-nextp').onclick = function () { cur++; draw(); };
      if (q('#ms-ready')) q('#ms-ready').onclick = finish;
      if (q('#ms-skip')) q('#ms-skip').onclick = finish;
    }
    if (!pages.length) { gate.style.display = ''; return; }
    draw();
    parent.insertBefore(box, gate);
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
          : '題目源源不絕，答錯或超時扣一顆心，5 顆心用完就結束。每題時間會從實戰速度（' + tr + ' 秒）慢慢縮短到修羅速度（' + th + ' 秒）。<br>🏆 目前最高紀錄：' + (S.best ? '<b>' + S.best + '</b> 題' : '尚無紀錄'));
      var go = $('#go'); if (go) go.disabled = locked;
      return;
    }
    panel.innerHTML = '<b>本關目前 ' + starStr(S.stars) + '</b><br>' +
      '三種模式可自由挑戰：練兵最高 ' + maxStarOf('easy') + ' ⭐、實戰最高 ' + maxStarOf('real') + ' ⭐、修羅最高 ' + maxStarOf('hard') + ' ⭐，星數取各模式最高；拿到 ' + CFG.ENDLESS_NEED + ' ⭐ 就解鎖無極限挑戰。';
    if (S.pre) { panel.innerHTML += '<br>🎮 已選擇：<b>' + ({ easy: '🎯 練兵', real: '⚔️ 實戰', hard: '🔥 修羅' })[S.pre] + ' 模式</b>　' + RULE[S.pre] + '<br><small>想換模式，請回地圖重新選擇</small>'; return; }
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

  // 戰場復活藥：城牆被打倒（hearts<=0）、出現「查看戰報」時，多一顆復活按鈕；每次闖關限用 1 瓶
  var rvLeft = parseInt(qp.get('rv') || '0', 10), rvUsed = false;
  function setupRevive() {
    var box = document.getElementById('say');
    if (!rvLeft || !box || window.parent === window) return;
    new MutationObserver(function () {
      var nx = document.getElementById('nx');
      if (!nx || rvUsed || nx.dataset.rv || typeof hearts === 'undefined' || hearts > 0) return;
      nx.dataset.rv = '1';
      var b = document.createElement('button');
      b.className = 'btn'; b.id = 'rvbtn'; b.style.cssText = 'margin:8px 0 0 8px';
      b.textContent = '🧪 使用戰場復活藥（剩 ' + rvLeft + '）';
      b.onclick = function () { post({ type: 'use-item', id: 'revive_m' }); b.disabled = true; b.textContent = '復活中…'; };
      nx.parentNode.appendChild(b);
    }).observe(box, { childList: true, subtree: true });
    window.addEventListener('message', function (e) {
      var d = e.data || {};
      if (d.type !== 'item-ok' || d.id !== 'revive_m') return;
      rvUsed = true; rvLeft--; hearts = GT.reviveHearts || 3; if (typeof drawHearts === 'function') drawHearts();
      var nx = document.getElementById('nx'), b = document.getElementById('rvbtn');
      if (nx) nx.textContent = '下一題 ▶'; if (b) b.remove();
    });
  }
  // 連續失敗 2 次 → 練習建議（過關即歸零）
  function pityLine(o, ok) {
    try {
      var k = 'ms-pity-' + o.sid, c = ok ? 0 : (+localStorage.getItem(k) || 0) + 1;
      localStorage.setItem(k, c);
      if (c >= (GT.pityFails || 2)) return '<br>💡 這一關已經連續 ' + c + ' 次沒過囉！練習建議：<br>① 回到關卡開頭，先看「課前複習」的觀念與影片<br>② 改用 🎯 練兵模式（不計時）慢慢練<br>③ 回地圖首頁的「錯題練習」，看看哪種題型最容易錯';
    } catch (e) {}
    return '';
  }
  // 速度評價：平均每題秒數 vs 該模式時限；並記錄個人最快平均
  function speedLine(o, ok) {
    if (!S.t0 || !o.total) return '';
    var av = (Date.now() - S.t0) / 1000 / o.total, lim = (S.orig && S.orig[o.mode]) || 0, h = '<br>⏱️ 平均每題 ' + av.toFixed(1) + ' 秒';
    if (lim) h += '　' + (av / lim < 0.5 ? '⚡ 神速' : av / lim < 0.8 ? '🏃 迅捷' : '🐢 穩健');
    try {
      var k = 'ms-spd-' + o.sid + '-' + o.mode, b = parseFloat(localStorage.getItem(k));
      if (ok && (!b || av < b)) { localStorage.setItem(k, av.toFixed(2)); if (b) h += '　🏅 刷新最快紀錄！'; }
      else if (b) h += '（最快 ' + b.toFixed(1) + ' 秒）';
    } catch (e) {}
    return h;
  }

  /* =====================================================================
     🎮 休息小遊戲（Eric 10-23）：每答 5 題、或連續答對 5 題，隨機跳出一款小遊戲
     （暗棋、象棋、五子棋、黑白棋、跳棋、圍棋、排七接龍…），單一局決勝負、平手才重玩，
     贏了送「商店道具 ×1」（放進大廳背包）。所有數字都在 game-config.js 的 relax 區（修改器可調）。
     只掛在 mode-system.js：20 幾個關卡檔都不用改。
     ===================================================================== */
  var RX = { on: false, held: null, t: 0 };
  var RX_DEF_ITEMS = { heal_s: 30, heal_m: 20, heal_l: 5, shield_s: 15, shield_m: 6, shield_l: 2, speed_s: 10, revive_m: 12, mb_s: 8 };
  function rcfg() {
    var r = GC.relax || {};
    return {
      enabled: r.enabled == null ? 1 : +r.enabled,
      every: Math.max(1, +r.every || 5),
      streak: r.streak == null ? 5 : Math.max(0, +r.streak),
      level: r.level || 'easy',
      limit: r.dailyRewardLimit == null ? 6 : Math.max(0, +r.dailyRewardLimit),
      exclude: String(r.excludeGames || '').split(/[,\s，、]+/).filter(Boolean),
      items: r.rewardItems || RX_DEF_ITEMS
    };
  }
  function rxDay() { return new Date(Date.now() + 7 * 36e5).toISOString().slice(0, 10); }   // 泰國時間
  function rxUsed() { try { var o = JSON.parse(localStorage.getItem('jb-relax-reward') || 'null'); return o && o.d === rxDay() ? (+o.n || 0) : 0; } catch (e) { return 0; } }
  function rxMark() { try { localStorage.setItem('jb-relax-reward', JSON.stringify({ d: rxDay(), n: rxUsed() + 1 })); } catch (e) {} }
  function rxLeft(c) { return c.limit > 0 ? Math.max(0, c.limit - rxUsed()) : 999; }   // dailyRewardLimit=0 → 不限
  function rxPickItem(c) {
    var shop = {}; (GC.shop || []).forEach(function (x) { shop[x.id] = x; });
    var list = Object.keys(c.items).filter(function (id) { return (+c.items[id] || 0) > 0 && (!GC.shop || shop[id]); });
    if (!list.length) return null;
    var tot = list.reduce(function (a, id) { return a + (+c.items[id]); }, 0), r = Math.random() * tot, pick = list[0];
    for (var i = 0; i < list.length; i++) { r -= (+c.items[list[i]]); if (r <= 0) { pick = list[i]; break; } }
    return { id: pick, it: shop[pick] || {} };
  }
  function rxIsRescue() { try { return typeof rescue !== 'undefined' && !!rescue; } catch (e) { return false; } }
  function rxDue() {            // 在「下一題之前」彈出（最後一題之後也彈）；只有已經沒血（直接看戰報）才不彈
    try {
      if (typeof hearts !== 'undefined' && hearts <= 0) return false;
      if (S.active && S.ended) return false;
      return true;                // 最後一題答完也要跳（Eric 10-23）：小遊戲玩完才看結算
    } catch (e) { return true; }
  }
  function setupRelax() {
    var c = rcfg();
    if (!c.enabled || RX.hooked) return;
    if (typeof window.next !== 'function' || typeof window.log !== 'function') return;
    RX.hooked = true;
    var oLog = window.log, oNext = window.next;
    window.log = function (ok) {          // 每答一題，關卡都會呼叫 log(對錯)
      var r = oLog.apply(this, arguments);
      try { if (RX.on && !rxIsRescue() && window.RelaxBreak) window.RelaxBreak.answered(ok === true); } catch (e) {}
      return r;
    };
    window.next = function () {           // 出下一題之前，看看要不要先玩小遊戲
      var self = this, args = arguments;
      try {
        if (RX.on && window.RelaxBreak && rxDue()) {
          RX.held = function () { return oNext.apply(self, args); };
          if (window.RelaxBreak.poll()) return;
          RX.held = null;
        }
      } catch (e) { RX.held = null; }
      return oNext.apply(self, args);
    };
    var sc = document.createElement('script');
    sc.src = 'relax-break.bundle.js';
    sc.onload = function () {
      var RB = window.RelaxBreak; if (!RB) return;
      var games = {};
      RB.REGISTRY.forEach(function (r) {
        if (c.exclude.indexOf(r.id) >= 0) return;
        var vs = r.variants.filter(function (v) { return !v.solo; }).map(function (v) { return v.id; });
        if (r.id === 'hexxagon') vs = vs.filter(function (v) { return v !== 'open61'; });   // 最大的盤面太久，不放
        if (vs.length) games[r.id] = vs;
      });
      function give() {
        var cc = rcfg(), p = rxPickItem(cc);
        if (!p) return '（目前沒有設定獎勵道具）';
        rxMark();
        var emb = window.parent !== window;
        if (emb) post({ type: 'relax-reward', id: p.id, n: 1 });
        var left = rxLeft(cc);
        return (p.it.icon || '🎁') + ' <b>' + (p.it.name || p.id) + '</b> ×1' + (emb ? '<br>已經放進你的背包囉！' : '<br>（單獨開啟測試：不會進背包）') +
          (cc.limit > 0 ? '<br><small>今天還能領 ' + left + ' 次小遊戲道具</small>' : '');
      }
      RB.init({
        every: c.every, streak: c.streak, level: c.level, deferred: true,
        unlockWins: 0, dailyLimit: 2, storageKey: 'hy_relax_v1',
        rewardMode: 'chest', rewardLabels: { chest: '商店道具 ×1', stage: '商店道具 ×1' },
        games: games, allowSkip: true,
        canTrigger: function () { return rxLeft(rcfg()) > 0; },   // 今天的道具領滿，就不再跳小遊戲
        rewards: { chest: give, stage: give },
        onStart: function () { RX.t = Date.now(); snd('minigame-start'); try { if (window.BGM) BGM.stop(); } catch (e) {} },
        onEnd: function (info) {
          if (S.t0) S.t0 += Date.now() - RX.t;                      // 休息時間不算進「平均每題秒數」
          if (info && info.result === 'win') snd('reward');
          stageBgm();
          var f = RX.held; RX.held = null; if (f) f();
        }
      });
      RX.on = true;
    };
    document.head.appendChild(sc);
  }

  /* =====================================================================
     ⚔️ 戰場動畫：玩家在左邊，右邊一群敵兵逼近
     答對 → 玩家衝上去揮劍，敵兵全部倒地；答錯／超時 → 敵兵衝過來，把玩家打倒在地
     玩家圖用 game-config.js 的 poses（依網址 ?rk=軍階，沒有就用 0 號）
     ===================================================================== */
  var SC = { on: false, n: 5 };
  function heroPoses() {
    var P = GC.poses || {}, rk = parseInt(qp.get('rk'), 10) || 0;
    var ps = P[rk] && P[rk].idle ? P[rk] : P[0];
    return ps && ps.idle ? ps : null;
  }
  var SOLDIER = '<svg viewBox="0 0 44 62" aria-hidden="true">' +
    '<line x1="2" y1="30" x2="40" y2="30" stroke="#8a6b3c" stroke-width="2.5"/><path d="M0 30l8-4v8z" fill="#cfd6e0"/>' +
    '<rect x="17" y="44" width="5" height="16" rx="1" fill="#3b2f2a"/><rect x="25" y="44" width="5" height="16" rx="1" fill="#3b2f2a"/>' +
    '<rect x="15" y="22" width="17" height="24" rx="3" fill="currentColor"/>' +
    '<circle cx="24" cy="14" r="7" fill="#f0c9a0"/><path d="M16 13a8 8 0 0 1 16 0v-2a8 8 0 0 0-16 0z" fill="#59606e"/><path d="M15 12h18v3H15z" fill="#59606e"/>' +
    '<circle cx="20" cy="15" r="1.2" fill="#222"/>' +
    '<ellipse cx="13" cy="34" rx="6" ry="9" fill="#7a3b2a" stroke="#d2a24c" stroke-width="1.5"/></svg>';
  function scEl(s) { return SC.el && SC.el.querySelector(s); }
  function heroPose(k) {
    var img = scEl('.ms-hero img'), ps = SC.ps; SC.cur = k; if (!img || !ps) return;
    var src = ps[k] || ps.idle; if (img.getAttribute('src') !== src) img.src = src;
  }
  /* 姿勢圖整理：白底（不透明）的圖去掉外圍白色，並縮放、對齊到和其他透明姿勢圖同樣的框，換姿勢時人物才不會跳動 */
  function loadImg(src) { return new Promise(function (res) { var i = new Image(); i.onload = function () { res(i); }; i.onerror = function () { res(null); }; i.src = src; }); }
  function alphaBox(d, w, h) {
    var x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }
  function floodWhite(d, w, h) {   // 從圖的四邊往內，把連在一起的白色背景變透明
    var seen = new Uint8Array(w * h), st = [], i;
    var white = function (p) { var o = p * 4; return d[o + 3] > 0 && Math.min(d[o], d[o + 1], d[o + 2]) > 228; };
    for (i = 0; i < w; i++) st.push(i, (h - 1) * w + i);
    for (i = 0; i < h; i++) st.push(i * w, i * w + w - 1);
    while (st.length) {
      var p = st.pop(); if (seen[p] || !white(p)) continue; seen[p] = 1; d[p * 4 + 3] = 0;
      var x = p % w; if (x > 0) st.push(p - 1); if (x < w - 1) st.push(p + 1); if (p >= w) st.push(p - w); if (p < w * (h - 1)) st.push(p + w);
    }
  }
  function fixPoses(ps) {
    var keys = ['idle', 'attack', 'hit', 'win'].filter(function (k) { return ps[k]; });
    Promise.all(keys.map(function (k) { return loadImg(ps[k]); })).then(function (ims) {
      try {
        var info = {}, ref = null;
        ims.forEach(function (im, i) {
          if (!im) return;
          var c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
          var x = c.getContext('2d'); x.drawImage(im, 0, 0);
          var id = x.getImageData(0, 0, c.width, c.height), d = id.data, opaque = d[3] > 250;
          if (opaque) { floodWhite(d, c.width, c.height); x.putImageData(id, 0, 0); }
          var f = info[keys[i]] = { c: c, box: alphaBox(d, c.width, c.height), opaque: opaque };
          if (!opaque && f.box && (!ref || keys[i] === 'win')) ref = f;
        });
        keys.forEach(function (k) {
          var f = info[k]; if (!f || !f.opaque || !f.box) return;
          if (!ref) { ps[k] = f.c.toDataURL(); return; }
          var rb = ref.box, s = rb.h / f.box.h, o = document.createElement('canvas'); o.width = ref.c.width; o.height = ref.c.height;
          o.getContext('2d').drawImage(f.c, f.box.x, f.box.y, f.box.w, f.box.h, rb.x + rb.w / 2 - f.box.w * s / 2, rb.y + rb.h - f.box.h * s, f.box.w * s, f.box.h * s);
          ps[k] = o.toDataURL();
        });
        heroPose(SC.cur || 'idle');
      } catch (e) {}   // 直接開檔（file://）讀不到像素時，就用原圖
    });
  }
  function setupScene() {
    var g = $('#s-game'); if (!g || SC.on) return;
    var host = g.querySelector('.field');
    if (!host) {
      host = document.createElement('div'); host.className = 'field';
      g.insertBefore(host, g.querySelector('.timebar') || g.children[1] || null);
    }
    host.classList.add('ms-scene');
    var hp = heroPoses();
    SC.ps = hp ? { idle: hp.idle, attack: hp.attack, hit: hp.hit, win: hp.win } : null;
    if (SC.ps) fixPoses(SC.ps);
    var hero = document.createElement('div'); hero.className = 'ms-hero';
    hero.innerHTML = SC.ps ? '<img src="' + SC.ps.idle + '" alt="我方勇者">' : '<span class="emo" aria-label="我方勇者">🤺</span>';
    var squad = document.createElement('div'); squad.className = 'ms-squad';
    host.appendChild(hero); host.appendChild(squad);
    SC.el = host; SC.on = true;
    var bar = $('#bar');
    if (bar) new MutationObserver(scAdvance).observe(bar, { attributes: true, attributeFilter: ['style'] });
    scReset();
  }
  // 計時越少，敵兵越靠近（看時間條的長度）
  function scAdvance() {
    var sq = scEl('.ms-squad'), bar = $('#bar'); if (!sq || !bar || SC.busy) return;
    var w = parseFloat(bar.style.width); if (isNaN(w)) w = 100;
    var T = 0; try { T = S.M && S.M[mode] ? S.M[mode].t : 0; } catch (e) {}
    var p = T ? Math.max(0, Math.min(1, 1 - w / 100)) : 0;
    sq.style.transform = 'translateX(' + (-p * scGap()) + 'px)';
  }
  function scGap() {   // 敵兵原位 → 走到勇者面前的距離（px）
    var sq = scEl('.ms-squad'), h = scEl('.ms-hero'); if (!sq || !h) return 0;
    return Math.max(0, sq.offsetLeft - (h.offsetLeft + h.offsetWidth) - 6);
  }
  function scReset() {
    if (!SC.el) return;
    SC.busy = false;
    var en = $('#enemy'), flag = en ? en.textContent.trim() : '';
    var sq = scEl('.ms-squad'), h = '';
    for (var i = 0; i < SC.n; i++) h += '<div class="ms-sol spawn" style="animation-delay:' + (i * 60) + 'ms">' + (i === 1 && flag ? '<span class="ms-flag">' + esc(flag) + '</span>' : '') + SOLDIER + '</div>';
    sq.className = 'ms-squad'; sq.innerHTML = h; sq.style.transform = '';
    var hero = scEl('.ms-hero'); hero.className = 'ms-hero'; hero.style.removeProperty('--dash');
    heroPose('idle'); scAdvance();
  }
  function scFx(txt, x, y) {
    var f = document.createElement('div'); f.className = 'ms-fx'; f.textContent = txt;
    f.style.left = x + 'px'; f.style.top = y + 'px'; SC.el.appendChild(f);
    setTimeout(function () { f.remove(); }, 700);
  }
  function scWin() {
    if (!SC.el) return; SC.busy = true;
    var hero = scEl('.ms-hero'), sq = scEl('.ms-squad');
    var dash = Math.max(0, sq.offsetLeft + txOf(sq) - (hero.offsetLeft + hero.offsetWidth) + 10);
    hero.style.setProperty('--dash', dash + 'px');
    heroPose('attack'); hero.className = 'ms-hero atk';
    setTimeout(function () {
      scFx('💥', sq.offsetLeft + txOf(sq) + 10, 30);
      Array.prototype.forEach.call(sq.querySelectorAll('.ms-sol'), function (s, i) { s.style.transitionDelay = (i * 70) + 'ms'; s.classList.remove('spawn'); s.classList.add('down'); });
    }, 230);
    setTimeout(function () { heroPose('win'); }, 560);
    setTimeout(function () { if (hero.classList.contains('atk')) heroPose('idle'); }, 950);
  }
  function scLose() {
    if (!SC.el) return; SC.busy = true;
    var hero = scEl('.ms-hero'), sq = scEl('.ms-squad');
    sq.classList.add('rush');
    sq.style.transform = 'translateX(' + (-Math.max(0, scGap() - 40)) + 'px)';
    Array.prototype.forEach.call(sq.querySelectorAll('.ms-sol'), function (s) { s.classList.remove('spawn'); s.classList.add('thrust'); });
    setTimeout(function () {
      scFx('💥', hero.offsetLeft + hero.offsetWidth * .5, 26);
      heroPose('hit'); hero.className = 'ms-hero ko';
    }, 300);
  }
  // 讀出元素目前的 translateX（px）
  function txOf(el) {
    var m = /translateX\((-?[\d.]+)px\)/.exec(el.style.transform || ''); return m ? parseFloat(m[1]) : 0;
  }

  /* =====================================================================
     🧑‍🏫 練兵模式「軍師一步一步帶你拆解」（比照 JB2V2 小老師）
     題目有 q.steps（關卡自己寫的拆解步驟）→ 一步一步選，最後再選答案
     題目是「計算／化簡 …」的算式 → 自動依運算順序拆成一步一步，加減法配數線
     每一步選錯算一次失誤；失誤超過 1 次這題記答錯。可按「這題我自己作答」略過。
     ===================================================================== */
  var TUT = { MISS_MAX: 1, DWELL: 1300 };
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function fmtN(v) { v = Math.round(v * 1e6) / 1e6; if (v === 0) v = 0; return String(v); }
  function isNumS(s) { return /^-?\d+(\.\d+)?$/.test(String(s).trim()); }
  function numOpts(ok, wr) {
    var out = [{ t: fmtN(ok), ok: true }], seen = {}; seen[out[0].t] = 1;
    function add(v, why) { if (v == null || !isFinite(v)) return; var t = fmtN(v); if (seen[t] || out.length >= 4) return; seen[t] = 1; out.push({ t: t, ok: false, why: why }); }
    (wr || []).forEach(function (w) { add(w[0], w[1]); });
    [[ok + 1, '差了 1，再算一次。'], [ok - 1, '差了 1，再算一次。'], [ok + 2, '再仔細算一次。'], [ok - 2, '再仔細算一次。']].forEach(function (w) { add(w[0], w[1]); });
    return shuffle(out);
  }
  function txtOpts(ok, wr) {
    if (isNumS(ok)) return numOpts(parseFloat(ok), (wr || []).filter(function (w) { return isNumS(w[0]); }).map(function (w) { return [parseFloat(w[0]), w[1]]; }));
    var out = [{ t: String(ok), ok: true }], seen = {}; seen[String(ok)] = 1;
    (wr || []).forEach(function (w) { var t = String(w[0]); if (!seen[t] && out.length < 4) { seen[t] = 1; out.push({ t: t, ok: false, why: w[1] }); } });
    return shuffle(out);
  }
  // 數線 SVG（和 stage-int 的同一套畫法）：pts=[{v,t,c}] arrs=[{a,b,t,c,h}]
  function nlSvg(lo, hi, pts, arrs) {
    var W = 620, X = function (v) { return 30 + (v - lo) / (hi - lo) * (W - 60); }, sp = hi - lo;
    var step = sp <= 14 ? 1 : (function () { var r = sp / 6, p = Math.pow(10, Math.floor(Math.log10(r))), f = r / p; return p * (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10); })();
    var s = '<svg viewBox="0 0 ' + W + ' 122" role="img" aria-label="數線圖" style="width:100%;max-width:620px"><defs><marker id="mt1" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0L8 4L0 8z" fill="#d24a33"/></marker><marker id="mt2" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0L8 4L0 8z" fill="#2b6cb0"/></marker></defs>';
    s += '<line x1="12" y1="74" x2="' + (W - 12) + '" y2="74" stroke="#2b2416" stroke-width="3"/><path d="M' + (W - 10) + ' 74l-9-5v10z" fill="#2b2416"/>';
    for (var v = Math.ceil(lo / step) * step; v <= hi; v += step) {
      var z = v === 0, c = z ? '#d24a33' : '#2b2416';
      s += '<line x1="' + X(v) + '" y1="66" x2="' + X(v) + '" y2="82" stroke="' + c + '" stroke-width="' + (z ? 4 : 2) + '"/><text x="' + X(v) + '" y="102" text-anchor="middle" font-size="14" fill="' + c + '" font-weight="' + (z ? 700 : 400) + '">' + fmtN(v) + '</text>';
    }
    (arrs || []).forEach(function (a) {
      var x1 = X(a.a), x2 = X(a.b), c = a.c || '#d24a33', h = a.h == null ? -8 : a.h;
      s += '<path d="M' + x1 + ' 68Q' + ((x1 + x2) / 2) + ' ' + h + ' ' + x2 + ' 68" fill="none" stroke="' + c + '" stroke-width="3" marker-end="url(#' + (c === '#d24a33' ? 'mt1' : 'mt2') + ')"/><text x="' + ((x1 + x2) / 2) + '" y="' + ((68 + h) / 2 - 4) + '" text-anchor="middle" font-size="13" font-weight="700" fill="' + c + '">' + esc(a.t || '') + '</text>';
    });
    (pts || []).forEach(function (p) { s += '<circle cx="' + X(p.v) + '" cy="74" r="8" fill="' + (p.c || '#43a58f') + '" stroke="#2b2416" stroke-width="2"/><text x="' + X(p.v) + '" y="120" text-anchor="middle" font-size="15" font-weight="700" fill="' + (p.c || '#2b6e5e') + '">' + esc(p.t) + '</text>'; });
    return s + '</svg>';
  }
  function nlRange() { var v = [].slice.call(arguments), a = Math.min.apply(null, v.concat(0)), b = Math.max.apply(null, v.concat(0)), m = Math.max(2, Math.ceil((b - a) * .12)); return [a - m, b + m]; }

  /* ---- 算式解析 → 依運算順序一步一步化簡 ---- */
  var SUPD = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  function supS(n) { return String(n).split('').map(function (c) { return c === '-' ? '⁻' : SUPD[+c]; }).join(''); }
  function exTok(s) {
    var out = [], i = 0, m;
    while (i < s.length) {
      var c = s[i], rest = s.slice(i);
      if (c === ' ') { i++; continue; }
      if ((m = /^\d+(?:\.\d+)?/.exec(rest))) { out.push({ t: 'n', v: parseFloat(m[0]) }); i += m[0].length; continue; }
      if ((m = /^⁻?[⁰¹²³⁴⁵⁶⁷⁸⁹]+/.exec(rest))) { var d = m[0].replace('⁻', '').split('').map(function (x) { return SUPD.indexOf(x); }).join(''); out.push({ t: 'e', v: (m[0][0] === '⁻' ? -1 : 1) * parseInt(d, 10) }); i += m[0].length; continue; }
      if ('+-×÷()[]|'.indexOf(c) >= 0) { out.push({ t: c }); i++; continue; }
      throw new Error('tok');
    }
    return out;
  }
  function exParse(s) {
    var T = exTok(s), p = 0;
    function pk() { return T[p]; }
    function eat(t) { if (!T[p] || T[p].t !== t) throw new Error('expect'); p++; }
    function expr() { var a = term(); while (pk() && (pk().t === '+' || pk().t === '-')) { var o = T[p++].t; a = { k: 'b', op: o, a: a, b: term() }; } return a; }
    function term() { var a = unary(); while (pk() && (pk().t === '×' || pk().t === '÷')) { var o = T[p++].t; a = { k: 'b', op: o, a: a, b: unary() }; } return a; }
    function unary() {
      var t = pk(); if (!t) throw new Error('eof');
      if (t.t === '+') { p++; return unary(); }
      if (t.t === '-') { p++; var n = T[p]; if (n && n.t === 'n' && !(T[p + 1] && T[p + 1].t === 'e')) { p++; return { k: 'n', v: -n.v }; } return { k: 'neg', a: unary() }; }
      var a = atom(); if (pk() && pk().t === 'e') a = { k: 'pow', a: a, e: T[p++].v }; return a;
    }
    function atom() {
      var t = T[p++]; if (!t) throw new Error('eof');
      if (t.t === 'n') return { k: 'n', v: t.v };
      if (t.t === '(' || t.t === '[') { var e = expr(); eat(t.t === '(' ? ')' : ']'); e.par = 1; return e; }
      if (t.t === '|') { var e2 = expr(); eat('|'); return { k: 'abs', a: e2 }; }
      throw new Error('atom');
    }
    var r = expr(); if (p < T.length) throw new Error('tail'); return r;
  }
  function exPr(n, first) {
    if (n.k === 'n') return n.v < 0 && !first ? '(' + fmtN(n.v) + ')' : fmtN(n.v);
    if (n.k === 'abs') return '|' + exPr(n.a, true) + '|';
    if (n.k === 'pow') return (n.a.k === 'n' ? (n.a.v < 0 ? '(' + fmtN(n.a.v) + ')' : fmtN(n.a.v)) : '(' + exPr(n.a, true) + ')') + supS(n.e);
    if (n.k === 'neg') { var c = n.a; return '-' + (c.k === 'n' ? (c.v < 0 ? '(' + fmtN(c.v) + ')' : (c.par ? '(+' + fmtN(c.v) + ')' : fmtN(c.v))) : c.k === 'abs' || c.k === 'pow' ? exPr(c, false) : '(' + exPr(c, true) + ')'); }
    var wrap = function (c, right) { return c.k === 'b' && (c.par || PREC[c.op] < PREC[n.op] || (right && PREC[c.op] <= PREC[n.op])); };
    var L = wrap(n.a, false) ? '(' + exPr(n.a, true) + ')' : exPr(n.a, first);
    var R = wrap(n.b, true) ? '(' + exPr(n.b, true) + ')' : exPr(n.b, false);
    return L + ' ' + n.op + ' ' + R;
  }
  var PREC = { '+': 1, '-': 1, '×': 2, '÷': 2 }, EXROOT = null;
  function exFind(n, par, key, grp, out) {   // 由內而外、由左而右，找第一個「可以直接算」的運算
    if (out.r || n.k === 'n') return;
    var g = grp || ((n.par || n.k === 'abs') && n !== EXROOT);
    if (n.k === 'b') { exFind(n.a, n, 'a', g, out); exFind(n.b, n, 'b', g, out); }
    else exFind(n.a, n, 'a', g, out);
    if (out.r) return;
    var ready = n.k === 'b' ? n.a.k === 'n' && n.b.k === 'n' : n.a.k === 'n';
    if (ready) out.r = { n: n, par: par, key: key, grp: grp || (n.k === 'b' && !!n.par && n !== EXROOT) };
  }
  function hasAddSub(n) { return n.k === 'b' ? (n.op === '+' || n.op === '-' || hasAddSub(n.a) || hasAddSub(n.b)) : n.k === 'n' ? false : hasAddSub(n.a); }
  function sgS(v) { return v < 0 ? '(' + fmtN(v) + ')' : fmtN(v); }
  function exStep(f, root) {
    var n = f.n, A = n.a.k === 'n' ? n.a.v : 0, B = n.k === 'b' ? n.b.v : 0, r, say, vis = '', wr = [], hint;
    var pre = f.grp ? '<b>括號（或絕對值）裡面先算</b>：' : n.k === 'pow' ? '<b>先算次方</b>：' : (n.k === 'b' && (n.op === '×' || n.op === '÷') && hasAddSub(root)) ? '<b>先乘除、後加減</b>：' : '';
    if (n.k === 'b' && n.op === '+') {
      r = A + B; var same = A * B >= 0, lr = nlRange(A, r);
      say = pre + '算 <b>' + sgS(A) + ' + ' + sgS(B) + '</b>。在數線上，從 <b>' + fmtN(A) + '</b> 出發，加 ' + sgS(B) + ' 就是往' + (B >= 0 ? '右' : '左') + '走 ' + fmtN(Math.abs(B)) + ' 步，停在哪裡？';
      hint = same ? '同號相加：絕對值相加，符號不變。' : '異號相加：絕對值大的減小的，符號跟著絕對值大的。';
      vis = nlSvg(lr[0], lr[1], [{ v: A, t: '起點 ' + fmtN(A), c: '#43a58f' }], [{ a: A, b: r, t: (B >= 0 ? '往右 ' : '往左 ') + fmtN(Math.abs(B)) }]);
      wr = [[-r, '方向弄反了：加正數往右、加負數往左。'], [A - B, '這裡是「加」，不是減。']];
      if (!same) wr.push([(Math.abs(A) > Math.abs(B) ? Math.sign(A) : Math.sign(B)) * (Math.abs(A) + Math.abs(B)), '一正一負（異號）要「大減小」，不是相加。']);
    } else if (n.k === 'b' && n.op === '-') {
      r = A - B; var lr2 = nlRange(A, r);
      say = pre + '算 <b>' + sgS(A) + ' − ' + sgS(B) + '</b>。減去一個數＝加上它的相反數：<b>' + sgS(A) + ' + ' + sgS(-B) + '</b>，從 ' + fmtN(A) + ' 往' + (B <= 0 ? '右' : '左') + '走 ' + fmtN(Math.abs(B)) + ' 步，停在哪裡？';
      hint = '減 ' + sgS(B) + ' ＝ 加 ' + sgS(-B) + '；加正數往右、加負數往左。';
      vis = nlSvg(lr2[0], lr2[1], [{ v: A, t: '起點 ' + fmtN(A), c: '#43a58f' }], [{ a: A, b: r, t: '加 ' + sgS(-B) + '：往' + (B <= 0 ? '右 ' : '左 ') + fmtN(Math.abs(B)) }]);
      wr = [[A + B, '減法要先改成「加相反數」：減 ' + sgS(B) + ' 等於加 ' + sgS(-B) + '。'], [B - A, '順序弄反了，是 ' + fmtN(A) + ' 去減。'], [-r, '方向弄反了，再看一次數線。']];
    } else if (n.k === 'b') {
      var mul = n.op === '×'; r = mul ? A * B : A / B;
      if (!isFinite(r) || Math.abs(r * 1e6 - Math.round(r * 1e6)) > 1e-6) return null;
      var k = (A < 0 ? 1 : 0) + (B < 0 ? 1 : 0);
      say = pre + '算 <b>' + sgS(A) + ' ' + n.op + ' ' + sgS(B) + '</b>。<br>' + (A === 0 ? '0 ' + (mul ? '乘以' : '除以') + '任何數都是 <b>0</b>。答案是？' : B === 0 && mul ? '任何數乘以 0 都是 <b>0</b>。答案是？'
        : '① 先定正負：負號有 ' + k + ' 個 → ' + (k === 1 ? '異號得<b>負</b>' : '同號得<b>正</b>') + '　② 再算 ' + fmtN(Math.abs(A)) + ' ' + n.op + ' ' + fmtN(Math.abs(B)) + '。答案是？');
      hint = mul ? '同號相乘為正、異號相乘為負，再把絕對值相乘。' : '除法的正負規則和乘法一樣：同號得正、異號得負。';
      wr = [[-r, '正負號弄反了：負號 ' + k + ' 個是' + (k === 1 ? '奇數個 → 負' : '偶數個 → 正') + '。'], [mul ? A + B : A * B, mul ? '這裡是「乘」，不是加。' : '這裡是「除」，不是乘。']];
    } else if (n.k === 'pow') {
      if (n.e < 0 || n.e > 9) return null;
      r = Math.pow(A, n.e);
      var rep = []; for (var i = 0; i < n.e; i++) rep.push(sgS(A));
      say = pre + '<b>' + exPr(n, false) + '</b> 就是 ' + n.e + ' 個 ' + sgS(A) + ' 連乘：<b>' + rep.join(' × ') + '</b>' + (A < 0 ? '（負號 ' + n.e + ' 個，' + (n.e % 2 ? '奇數個 → 負' : '偶數個 → 正') + '）' : '') + '。答案是？';
      hint = '次方是「連乘」，不是乘以指數。底數是負數時，看負號有幾個。';
      wr = [[-r, '正負號弄反了，數一數有幾個負號相乘。'], [A * n.e, '次方是連乘 ' + n.e + ' 次，不是乘以 ' + n.e + '。']];
    } else if (n.k === 'neg') {
      r = -A; var L = Math.max(Math.abs(A), 1) + 2;
      say = pre + '<b>-(' + (A < 0 ? fmtN(A) : '+' + fmtN(A)) + ')</b> 是 ' + fmtN(A) + ' 的<b>相反數</b>：在數線上翻到原點的另一邊、距離一樣。答案是？';
      hint = '前面多一個負號，就翻轉一次：正變負、負變正。';
      vis = nlSvg(-L, L, [{ v: A, t: fmtN(A), c: '#43a58f' }, { v: -A, t: '？', c: '#d24a33' }], [{ a: A, b: -A, t: '翻到另一邊', c: '#2b6cb0', h: -10 }]);
      wr = [[A, '相反數要「變號」喔。']];
    } else {
      r = Math.abs(A); var L2 = Math.abs(A) + 2;
      say = pre + '<b>|' + fmtN(A) + '|</b> 是 ' + fmtN(A) + ' 到原點的<b>距離</b>，距離不會是負的。答案是？';
      hint = '絕對值＝到原點的距離（一定 ≥ 0）。';
      vis = nlSvg(-L2, L2, [{ v: A, t: fmtN(A), c: '#d24a33' }], [{ a: A, b: 0, t: '距離', c: '#2b6cb0', h: -6 }]);
      wr = [[-r, '距離不會是負的。'], [A === 0 ? 1 : 0, '數一數到原點有幾格。']];
    }
    var nn = { k: 'n', v: r };
    if (f.par) f.par[f.key] = nn; else root = nn;
    return { root: root, step: { say: say, hint: hint, vis: vis, opts: numOpts(r, wr), line: '' } };
  }
  function exPlan(q) {
    var t = String(q.text || '').replace(/[−－]/g, '-').replace(/＋/g, '+').replace(/[＊*]/g, '×').replace(/\s*的值\s*[？?]?\s*$/, '');
    var m = /^(?:計算|化簡)\s*[:：]?\s*(.+)$/.exec(t.trim()); if (!m || !isNumS(q.ans)) return null;
    var root; try { root = exParse(m[1]); } catch (e) { return null; }
    var steps = [], guard = 0;
    while (root.k !== 'n' && guard++ < 12) {
      var f = {}; EXROOT = root; exFind(root, null, null, false, f); if (!f.r) return null;
      var r = exStep(f.r, root); if (!r) return null;
      root = r.root; EXROOT = root; r.step.line = exPr(root, true); steps.push(r.step);
    }
    if (root.k !== 'n' || !steps.length || steps.length > 10 || Math.abs(root.v - parseFloat(q.ans)) > 1e-6) return null;
    return { steps: steps, first: m[1].trim(), pickLast: false };
  }
  /* 題目格式有兩種：整數／因倍數關卡用 text + options + ans；代數關卡用 promptHTML + opts(HTML) + correctIndex */
  function htmlPlain(h) {
    var s = String(h == null ? '' : h).replace(/<span class="frac"><span class="num">(.*?)<\/span><span class="den">(.*?)<\/span><\/span>/g, '$1/$2').replace(/<sup>(.*?)<\/sup>/g, '^$1').replace(/<br\s*\/?>/g, ' ');
    var d = document.createElement('div'); d.innerHTML = s; return d.textContent.replace(/\s+/g, ' ').trim();
  }
  function qText(qq) { return qq.promptHTML ? htmlPlain(qq.promptHTML) : String(qq.text || ''); }
  function qAns(qq) { return qq.opts && qq.correctIndex != null ? htmlPlain(qq.opts[qq.correctIndex]) : String(qq.ans); }
  function stepsPlan(q) {
    var algebra = !!(q.opts && q.correctIndex != null), olist = algebra ? q.opts : q.options;
    if (!q.steps || !q.steps.length) return null;
    var steps = q.steps.map(function (s) { return { say: s.say, hint: s.hint || q.hint, vis: s.vis, opts: s.toggle ? [] : txtOpts(s.ok, s.wr), line: s.line || '', input: !!s.input, ans: s.ok, toggle: s.toggle || null, pair: s.pair || null, say2: s.say2 || '' }; });
    if (!olist || !olist.length) return { steps: steps, manual: true };   // 自訂操作介面的題目：帶完步驟後，把畫面還給學生自己操作
    var ans = qAns(q);
    steps.push({ say: '把剛剛一步一步想到的合起來，這一題的答案是哪一個？', hint: q.hint, opts: shuffle(olist.map(function (o, i) { var t = algebra ? htmlPlain(o) : String(o), ok = algebra ? i === q.correctIndex : t === ans; return { t: t, h: algebra ? o : null, ok: ok, why: ok ? '' : '和剛剛一步一步推出來的結果不一樣，再對照一次上面的步驟。' }; })), line: '答案：' + ans });
    return { steps: steps, pickLast: true };
  }
  /* 數字鍵盤：學生自己輸入答案（可輸入負號與小數點；實體鍵盤也能用） */
  function makePad(host, label, onOk) {
    var val = '';
    host.innerHTML = '<div class="mt-pad"><div class="mt-disp"></div><div class="mt-keys"></div></div>';
    var disp = host.querySelector('.mt-disp'), keys = host.querySelector('.mt-keys');
    function draw() { disp.textContent = (label || '') + (val || '＿'); }
    function press(k) {
      if (k === '⌫') val = val.slice(0, -1);
      else if (k === '確認') { if (val !== '') onOk(val.replace('−', '-')); return; }
      else if (k === '−') val = val[0] === '−' ? val.slice(1) : '−' + val;
      else if (k === '.') { if (val.indexOf('.') < 0 && val.length < 9) val += '.'; }
      else if (val.length < 9) val += k;
      draw();
    }
    ['7', '8', '9', '4', '5', '6', '1', '2', '3', '−', '0', '.', '⌫', '確認'].forEach(function (k) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'mt-key' + (k === '確認' ? ' go' : ''); b.textContent = k;
      b.onclick = function () { press(k); }; keys.appendChild(b);
    });
    var kd = function (e) {
      if (!host.isConnected) { document.removeEventListener('keydown', kd); return; }
      if (/^[0-9]$/.test(e.key)) press(e.key); else if (e.key === '.') press('.'); else if (e.key === '-') press('−'); else if (e.key === 'Backspace') press('⌫'); else if (e.key === 'Enter') press('確認');
    };
    document.addEventListener('keydown', kd);
    draw();
    return { clear: function () { val = ''; draw(); }, label: function (t) { label = t; draw(); } };
  }

  /* =====================================================================
     🧮 練兵「遞等式」（比照整數勇者教學版）
     ① 先點「應該最先計算的符號」（括號優先 → 先乘除 → 同級由左到右）；點錯會提示原因
     ② 點對後，自己用數字鍵輸入這一組的結果，按「確認」
     ③ 算對後算式自動變短一行，直到只剩一個數字
     ===================================================================== */
  var EQ = { sel: null, flash: null }, EXID = 0;
  function exIds(n) { n.id = ++EXID; if (n.k === 'b') { exIds(n.a); exIds(n.b); } else if (n.k !== 'n') exIds(n.a); }
  function exEval(n) {
    if (n.k === 'n') return n.v;
    if (n.k === 'b') { var a = exEval(n.a), b = exEval(n.b); return n.op === '+' ? a + b : n.op === '-' ? a - b : n.op === '×' ? a * b : a / b; }
    if (n.k === 'pow') return Math.pow(exEval(n.a), n.e);
    if (n.k === 'neg') return -exEval(n.a);
    return Math.abs(exEval(n.a));
  }
  function exNum(v, first) { var t = fmtN(v).replace('-', '−'); return v < 0 && !first ? '(' + t + ')' : t; }
  function opSp(n, t, cls) { return '<span class="mt-op' + (cls ? ' ' + cls : '') + (EQ.flash && EQ.flash.indexOf(n.id) >= 0 ? ' hint' : '') + '" data-id="' + n.id + '">' + t + '</span>'; }
  function exHtml(n, first) {
    if (n.k === 'n') {
      var pk = EQ.pick, cls = pk && pk.ids.indexOf(n.id) >= 0 ? (pk.on.indexOf(n.id) >= 0 ? ' on' : ' pk') : '';
      return '<span class="mt-n' + cls + '" data-nid="' + n.id + '">' + exNum(n.v, first) + '</span>';
    }
    if (n.k === 'abs') return opSp(n, '|') + exHtml(n.a, true) + opSp(n, '|');
    if (n.k === 'pow') return (n.a.k === 'n' ? exHtml(n.a, false) : '(' + exHtml(n.a, true) + ')') + opSp(n, supS(n.e), 'sup');
    if (n.k === 'neg') { var c = n.a; return opSp(n, '−') + (c.k === 'n' ? '<span class="mt-n">' + exNum(c.v, false) + '</span>' : (c.k === 'abs' || c.k === 'pow') ? exHtml(c, false) : '(' + exHtml(c, true) + ')'); }
    var wrap = function (c, right) { return c.k === 'b' && (c.par || PREC[c.op] < PREC[n.op] || (right && PREC[c.op] <= PREC[n.op])); };
    var L = wrap(n.a, false) ? '(' + exHtml(n.a, true) + ')' : exHtml(n.a, first), R = wrap(n.b, true) ? '(' + exHtml(n.b, true) + ')' : exHtml(n.b, false);
    return L + ' ' + opSp(n, n.op === '-' ? '−' : n.op) + ' ' + R;
  }
  function exReady(root) {
    var out = [];
    (function walk(n, grp) {
      if (n.k === 'n') return;
      var g = grp || (!!n.par && n !== root) || n.k === 'abs';
      if (n.k === 'b') { walk(n.a, g); walk(n.b, g); } else walk(n.a, g);
      var ready = n.k === 'b' ? n.a.k === 'n' && n.b.k === 'n' : n.a.k === 'n';
      if (ready) out.push({ n: n, g: g });
    })(root, false);
    var inG = out.filter(function (r) { return r.g; });
    return inG.length ? inG : out;   // 有括號（或絕對值）時，只能先算括號裡面
  }
  function exById(n, id) { if (n.id === id) return n; if (n.k === 'b') return exById(n.a, id) || exById(n.b, id); if (n.k !== 'n') return exById(n.a, id); return null; }
  function exReplace(n, target, nn) { if (n === target) return nn; if (n.k === 'b') { n.a = exReplace(n.a, target, nn); n.b = exReplace(n.b, target, nn); } else if (n.k !== 'n') n.a = exReplace(n.a, target, nn); return n; }
  function exCount(n) { return n.k === 'n' ? 0 : 1 + (n.k === 'b' ? exCount(n.a) + exCount(n.b) : exCount(n.a)); }
  function exAny(n) { var r = null; (function w(x) { if (r || x.k === 'n') return; if (x.k === 'b') { w(x.a); w(x.b); } else w(x.a); if (!r) r = x; })(n); return r; }
  function exWhy(n, ready) {
    if (ready.some(function (r) { return r.g; })) return 'paren';
    if (ready.some(function (r) { return r.n.k === 'pow'; }) && n.k !== 'pow') return 'pow';
    if (ready.some(function (r) { return r.n.k === 'b' && (r.n.op === '×' || r.n.op === '÷'); }) && n.k === 'b' && (n.op === '+' || n.op === '-')) return 'prec';
    return 'ltr';
  }
  var EX_WHY = {
    paren: '🦉 等等！算式裡有「括號」（或絕對值），括號擁有特權，要先算括號裡面喔！',
    pow: '🦉 小心！次方要最先算（比乘除還優先）喔！',
    prec: '🦉 小心！乘法和除法的位階比較高，要「先乘除、後加減」喔！',
    ltr: '🦉 同一級的運算要乖乖「由左到右」排隊，先算最左邊那一個喔！'
  };
  function exDesc(n) {
    var t = function (c) { return exNum(c.v, false); };
    if (n.k === 'b') return t(n.a) + ' ' + (n.op === '-' ? '−' : n.op) + ' ' + t(n.b);
    if (n.k === 'pow') return t(n.a) + supS(n.e);
    if (n.k === 'neg') return '−(' + fmtN(n.a.v).replace('-', '−') + ')';
    return '|' + fmtN(n.a.v).replace('-', '−') + '|';
  }
  function exParseQ(qq) {
    var t = String(qq.text || '').replace(/[−－]/g, '-').replace(/＋/g, '+').replace(/[＊*]/g, '×').replace(/\s*的值\s*[？?]?\s*$/, '');
    var m = /^(?:計算|化簡)\s*[:：]?\s*(.+)$/.exec(t.trim()); if (!m || !isNumS(qq.ans)) return null;
    var root; try { root = exParse(m[1]); } catch (e) { return null; }
    if (root.k === 'n') return null;
    exIds(root);
    try { if (!isFinite(exEval(root)) || Math.abs(exEval(root) - parseFloat(qq.ans)) > 1e-6) return null; } catch (e) { return null; }
    return root;
  }
  function tutorRunEq(qq, root) {
    var g = $('#s-game'), misses = 0, step = 1, hist = [], phase = 'pick', sel = null, pad = null, selAuto = false;
    EQ = { sel: null, flash: null };
    var ov = document.createElement('div'); ov.id = 'ms-tut'; ov.className = 'mt';
    ov.innerHTML = '<div class="mt-head"><span>🧮 自己一步一步算（遞等式）</span><small id="mt-n"></small></div>' +
      '<div class="mt-q"></div><div class="mt-expr" id="mt-expr"></div><div class="mt-vis" id="mt-vis"></div>' +
      '<div class="mt-say" id="mt-say"></div><div class="mt-fb" id="mt-fb"></div><div class="mt-ch2" id="mt-ch"></div>' +
      '<div class="mt-ctl"><button class="btn ghost" id="mt-hint">💡 提示</button><button class="btn ghost" id="mt-skip">✋ 這題我自己作答</button></div>';
    var qe = g.querySelector('.q'); g.insertBefore(ov, qe); g.classList.add('ms-tut-on');
    var $o = function (s) { return ov.querySelector(s); };
    $o('.mt-q').textContent = String(qq.text);
    function fb(h, cls) { var f = $o('#mt-fb'); f.className = 'mt-fb ' + (cls || ''); f.innerHTML = h; }
    function say(h) { $o('#mt-say').innerHTML = h; }
    function close() { ov.remove(); g.classList.remove('ms-tut-on'); }
    function render() {
      $o('#mt-n').textContent = '第 ' + step + ' 步';
      $o('#mt-expr').innerHTML = hist.map(function (h) { return '<div class="h">' + esc(h) + '</div>'; }).join('') + '<div class="cur">' + (hist.length ? '＝ ' : '') + exHtml(root, true) + '</div>';
    }
    function numberLine(n) {
      if (n.k !== 'b' || (n.op !== '+' && n.op !== '-')) return '';
      var A = n.a.v, B = n.op === '+' ? n.b.v : -n.b.v, r = A + B; if (Math.abs(A) > 200 || Math.abs(B) > 200 || A % 1 || B % 1) return '';
      var lr = nlRange(A, r);
      return nlSvg(lr[0], lr[1], [{ v: A, t: '起點 ' + fmtN(A), c: '#43a58f' }], [{ a: A, b: r, t: (B >= 0 ? '往右 ' : '往左 ') + fmtN(Math.abs(B)) }]);
    }
    function toPick() {
      phase = 'pick'; sel = null; EQ.flash = null; EQ.pick = null; window.__tut = { t: 'pick', ids: exReady(root).map(function (r) { return r.n.id; }) }; $o('#mt-ch').innerHTML = ''; $o('#mt-vis').innerHTML = '';
      if (exCount(root) === 1) { var only = exReady(root)[0].n; select(only, true); return; }
      render(); say(hist.length ? '很好！算式變短了。下一步，要先算哪一個符號？（直接點算式裡的符號）' : '請先點選「<b>應該最先計算的符號</b>」！<br><small>括號優先 → 先乘除（次方最先）→ 同級由左到右</small>');
    }
    function select(n, auto) {
      sel = n; EQ.flash = null; selAuto = auto;
      if (n.k === 'b' && (n.op === '×' || n.op === '÷')) {   // 乘除：先自己點出「誰要跟誰」，才開始算
        phase = 'pairs'; EQ.pick = { ids: [n.a.id, n.b.id], on: [] }; window.__tut = { t: 'pairs', ids: [n.a.id, n.b.id] };
        render(); $o('#mt-ch').innerHTML = ''; $o('#mt-vis').innerHTML = '';
        say((auto ? '👍 只剩最後一組了！' : '✅ 選對了！') + '接下來，請點出要「' + (n.op === '×' ? '相乘' : '相除') + '」的<b>兩個數字</b>。<br><small>就是「' + n.op + '」左右兩邊緊鄰的數字</small>');
        return;
      }
      startCalc(n, auto);
    }
    function startCalc(n, auto) {
      phase = 'calc'; sel = n; EQ.flash = null; EQ.pick = null; window.__tut = { t: 'calc', ans: exEval(n) }; render();
      say((auto ? '👍 只剩最後一組了，不用選符號！' : '✅ 選對了！') + '算算看：<b>' + exDesc(n) + '</b> ＝ ？<br><small>用下面的數字鍵輸入，再按「確認」</small>');
      $o('#mt-vis').innerHTML = numberLine(n);
      pad = makePad($o('#mt-ch'), exDesc(n) + ' ＝ ', function (v) {
        var val = exEval(n);
        if (Math.abs(Number(v) - val) < 1e-6) {
          snd('confirm');
          hist.push(exPr(root, true).replace(/-/g, '−')); root = exReplace(root, n, { k: 'n', v: val, id: n.id }); step++;
          if (root.k === 'n') return finish();
          toPick();
        } else {
          snd('wrong'); misses++; fb('🧙 再算一次：' + esc(exDesc(n)) + ' ＝ ？（這一步要仔細喔）', 'warn'); pad.clear();
        }
      });
    }
    function finish() {
      ov._done = true; render(); $o('#mt-ch').innerHTML = ''; $o('#mt-vis').innerHTML = ''; $o('#mt-hint').style.display = 'none'; $o('#mt-skip').style.display = 'none';
      var bad = misses > TUT.MISS_MAX;
      say('🎉 完成！答案是 <b>' + esc(String(qq.ans)) + '</b>。' + (bad ? '<br>失誤超過 ' + TUT.MISS_MAX + ' 次，這題先記答錯，等一下再練一次就會了！' : '　準備出擊！'));
      setTimeout(function () {
        if (!ov.parentNode || q !== qq) return; close();
        var btns = [].slice.call(document.querySelectorAll('#opts .opt')), isAns = function (b) { return b.dataset.v === String(qq.ans); };
        var pick = bad ? btns.filter(function (b) { return !isAns(b) && !b.classList.contains('cut'); })[0] : btns.filter(isAns)[0];
        if (pick) pick.click();
      }, TUT.DWELL);
    }
    ov.addEventListener('click', function (e) {
      var np = e.target.closest && e.target.closest('[data-nid]');
      if (np && phase === 'pairs' && !ov._done) {   // 點「要相乘（相除）的兩個數字」
        var nid = +np.dataset.nid;
        if (EQ.pick.ids.indexOf(nid) >= 0) {
          if (EQ.pick.on.indexOf(nid) < 0) { EQ.pick.on.push(nid); snd('select'); }
          fb('', ''); render();
          if (EQ.pick.on.length === 2) { say('✅ 沒錯！就是 <b>' + exDesc(sel) + '</b>。'); setTimeout(function () { if (!ov._done && ov.parentNode && phase === 'pairs') startCalc(sel, selAuto); }, 450); }
        } else { snd('wrong'); misses++; fb('🧙 這個數字不是這一組的喔！要「' + (sel.op === '×' ? '相乘' : '相除') + '」的是符號「' + sel.op + '」左右兩邊緊鄰的兩個數字。', 'warn'); }
        return;
      }
      var sp = e.target.closest && e.target.closest('[data-id]'); if (!sp || ov._done) return;
      if (phase === 'pairs') { fb('先點出要' + (sel.op === '×' ? '相乘' : '相除') + '的兩個數字喔！', 'warn'); return; }
      if (phase === 'calc') { fb('先把「' + esc(exDesc(sel)) + '」算出來，再按「確認」喔！', 'warn'); return; }
      var n = exById(root, +sp.dataset.id); if (!n) return;
      var ready = exReady(root);
      if (ready.some(function (r) { return r.n === n; })) { fb('', ''); select(n, false); return; }
      snd('wrong'); misses++; fb(EX_WHY[exWhy(n, ready)], 'warn');
      EQ.flash = ready.map(function (r) { return r.n.id; }); render();
      setTimeout(function () { EQ.flash = null; if (phase === 'pick' && !ov._done && ov.parentNode) render(); }, 1700);
    });
    $o('#mt-hint').onclick = function () {
      if (phase === 'calc') { fb('💡 ' + esc(exDesc(sel)) + ' 在數線上或用口訣算算看（同號相乘為正、異號為負）。', 'hint'); return; }
      EQ.flash = exReady(root).map(function (r) { return r.n.id; }); render(); fb('💡 發亮的符號就是現在可以先算的。', 'hint');
      setTimeout(function () { EQ.flash = null; if (phase === 'pick' && !ov._done && ov.parentNode) render(); }, 1700);
    };
    $o('#mt-skip').onclick = close;
    toPick();
  }
  function tutorMaybe() {
    var old = $('#ms-tut'); if (old) old.remove();
    var g = $('#s-game'); if (g) g.classList.remove('ms-tut-on');
    try {
      if (S.active || mode !== 'easy' || (typeof rescue !== 'undefined' && rescue) || !q || lock || !(q.text || q.promptHTML) || !$('#opts')) return;
    } catch (e) { return; }
    var plan = null, eq = null;
    try { plan = stepsPlan(q); if (!plan) eq = exParseQ(q); } catch (e) { plan = null; eq = null; }
    if (plan) tutorRun(plan); else if (eq) tutorRunEq(q, eq);
  }
  function tutorRun(plan) {
    var g = $('#s-game'), qq = q, i = 0, misses = 0, hist = plan.first ? [plan.first] : [];
    var ov = document.createElement('div'); ov.id = 'ms-tut'; ov.className = 'mt';
    ov.innerHTML = '<div class="mt-head"><span>🧙 軍師帶你一步一步拆解</span><small id="mt-n"></small></div>' +
      '<div class="mt-q"></div><div class="mt-vis" id="mt-vis"></div>' +
      '<div class="mt-say" id="mt-say"></div><div class="mt-fb" id="mt-fb"></div>' +
      '<div class="mt-hist" id="mt-hist"></div><div class="mt-ch" id="mt-ch"></div>' +
      '<div class="mt-ctl"><button class="btn ghost" id="mt-hint">💡 提示</button><button class="btn ghost" id="mt-skip">✋ 這題我自己作答</button></div>';
    var qe = g.querySelector('.q'); g.insertBefore(ov, qe); g.classList.add('ms-tut-on');
    var $o = function (s) { return ov.querySelector(s); };
    if (qq.promptHTML || /<[a-z]/i.test(String(qq.text))) $o('.mt-q').innerHTML = qq.promptHTML || qq.text; else $o('.mt-q').textContent = String(qq.text);
    function fb(h, cls) { var f = $o('#mt-fb'); f.className = 'mt-fb ' + cls; f.innerHTML = h; }
    function renderHist() { $o('#mt-hist').innerHTML = hist.map(function (h, k) { return '<div>' + (k && plan.first ? '= ' : k || !plan.first ? '→ ' : '') + esc(h) + '</div>'; }).join(''); }
    function close() { ov.remove(); g.classList.remove('ms-tut-on'); }
    function show() {
      var s = plan.steps[i];
      $o('#mt-n').textContent = '第 ' + (i + 1) + ' / ' + plan.steps.length + ' 步';
      $o('#mt-vis').innerHTML = s.vis || qq.vis || '';
      $o('#mt-say').innerHTML = s.say; fb('', ''); renderHist();
      var el = $o('#mt-ch'); el.innerHTML = '';
      function good() { if (s.line) hist.push(s.line); i++; renderHist(); fb('✅ 對！', 'good'); setTimeout(i < plan.steps.length ? show : done, 650); }
      window.__tut = s.input ? { t: 'input', ans: s.ans } : s.toggle ? { t: 'toggle', flip: s.toggle.flip } : { t: 'opts' };   // 只供自動測試讀取
      function runInput(host) {   // 自己用數字鍵輸入
        var ph = makePad(host, '', function (v) {
          if (Math.abs(Number(v) - Number(s.ans)) < 1e-6) { snd('confirm'); el.innerHTML = ''; good(); }
          else { snd('wrong'); misses++; fb('🧙 再算一次～ ' + esc(s.hint || ''), 'warn'); ph.clear(); }
        });
      }
      if (s.pair) {   // 先自己點出「要相乘的兩個數字」，再計算
        var P0 = s.pair, sel = [], locked = false;
        window.__tut = { t: 'pair', need: P0.need };
        var ex = document.createElement('div'), pd = document.createElement('div'); ex.className = 'mt-pairx';
        el.appendChild(ex); el.appendChild(pd);
        var check = function () {
          var okp = sel.slice().sort().join() === P0.need.slice().sort().join();
          if (okp) {
            locked = true; snd('confirm'); ex.classList.add('good'); fb('✅ 沒錯，就是這兩個要' + (P0.verb || '相乘') + '！', 'good');
            $o('#mt-say').innerHTML = s.say2 || s.say; window.__tut = { t: 'input', ans: s.ans };
            if (s.input) runInput(pd); else good();
          } else {
            snd('wrong'); misses++; fb('🧙 ' + esc(P0.why || '這兩個數字不是一組喔，再想想「誰要跟誰」' + (P0.verb || '相乘') + '。'), 'warn');
            sel = []; [].forEach.call(ex.querySelectorAll('.mt-tk'), function (x) { x.classList.remove('on'); });
          }
        };
        P0.tokens.forEach(function (t) {
          var b = document.createElement(t.id ? 'button' : 'span'); b.textContent = t.t;
          if (t.id) {
            b.type = 'button'; b.className = 'mt-tk'; b.dataset.id = t.id;
            b.onclick = function () {
              if (locked) return;
              var ix = sel.indexOf(t.id); if (ix >= 0) { sel.splice(ix, 1); b.classList.remove('on'); return; }
              if (sel.length >= 2) return; sel.push(t.id); b.classList.add('on'); snd('select'); if (sel.length === 2) check();
            };
          } else b.className = 'mt-tx';
          ex.appendChild(b);
        });
        return;
      }
      if (s.input) { runInput(el); return; }
      if (s.toggle) {   // 自己點選「哪些項要變號」
        var T0 = s.toggle, flipped = T0.terms.map(function () { return false; });
        var row = document.createElement('div'); row.className = 'mt-chips';
        T0.terms.forEach(function (t, k) {
          var c = document.createElement('button'); c.type = 'button'; c.className = 'mt-chip'; c.textContent = t;
          c.onclick = function () { flipped[k] = !flipped[k]; c.classList.toggle('flip', flipped[k]); c.textContent = flipped[k] ? T0.after[k] : t; };
          row.appendChild(c);
        });
        var go = document.createElement('button'); go.type = 'button'; go.className = 'btn'; go.textContent = '✅ 確認'; go.style.marginTop = '10px';
        go.onclick = function () {
          var bad = -1; flipped.forEach(function (f, k) { if (bad < 0 && f !== T0.flip[k]) bad = k; });
          if (bad < 0) { snd('confirm'); el.innerHTML = ''; good(); return; }
          snd('wrong'); misses++; fb('🧙 「' + esc(T0.terms[bad]) + '」' + (T0.flip[bad] ? '要變號，點它一下！' : '不用變號，再點一次取消。') + esc(T0.why || ''), 'warn');
        };
        el.appendChild(row); el.appendChild(go); return;
      }
      s.opts.forEach(function (o) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'mt-opt'; if (o.h) b.innerHTML = o.h; else b.textContent = o.t;
        b.onclick = function () {
          if (b.disabled || ov._done) return;
          snd(o.ok ? 'confirm' : 'wrong');
          if (o.ok) {
            b.classList.add('ok'); [].forEach.call(el.children, function (x) { x.disabled = true; });
            if (s.line) hist.push(s.line); i++; renderHist(); fb('✅ 對！', 'good');
            setTimeout(i < plan.steps.length ? show : done, 650);
          } else { misses++; b.disabled = true; b.classList.add('bad'); fb('🧙 ' + (o.why || '再想想看～'), 'warn'); }
        };
        el.appendChild(b);
      });
    }
    function done() {
      if (plan.manual) {
        ov._done = true; $o('#mt-ch').innerHTML = ''; $o('#mt-hint').style.display = 'none'; $o('#mt-skip').style.display = 'none';
        $o('#mt-say').innerHTML = '🎉 步驟都做完了！現在換你自己操作答題。';
        setTimeout(function () { if (ov.parentNode && q === qq) close(); }, TUT.DWELL);
        return;
      }
      ov._done = true;
      var bad = misses > TUT.MISS_MAX;
      $o('#mt-ch').innerHTML = ''; $o('#mt-hint').style.display = 'none'; $o('#mt-skip').style.display = 'none';
      $o('#mt-say').innerHTML = '🎉 完成！答案是 <b>' + esc(qAns(qq)) + '</b>。' + (bad ? '<br>步驟都做對了，不過失誤超過 ' + TUT.MISS_MAX + ' 次，這題先記答錯，等一下再練一次就會了！' : '　準備出擊！');
      setTimeout(function () {
        if (!ov.parentNode || q !== qq) return; close();
        var btns = [].slice.call(document.querySelectorAll('#opts .opt')), ci = qq.opts && qq.correctIndex != null ? qq.correctIndex : -1;
        var isAns = function (b, i) { return ci >= 0 ? i === ci : b.dataset.v === String(qq.ans); };
        var pick = bad ? btns.filter(function (b, i) { return !isAns(b, i) && !b.classList.contains('cut'); })[0] : btns.filter(isAns)[0];
        if (pick) pick.click();
      }, TUT.DWELL);
    }
    $o('#mt-hint').onclick = function () { var s = plan.steps[Math.min(i, plan.steps.length - 1)]; fb('💡 ' + esc(s.hint || qq.hint || '慢慢來，一步一步想！'), 'hint'); };
    $o('#mt-skip').onclick = close;
    show();
  }

  /* 🇹🇭 答錯說明最後的「ดูคำอธิบายภาษาไทย」按鈕：按下去才展開泰文說明（中文仍是主要說明） */
  function thaiHtml() {
    var t = window.TH.explain(q.explain, q), h = '<div class="th-title">📘 คำอธิบาย (ภาษาไทย)</div><div>✅ คำตอบที่ถูกต้อง: <b>' + esc(qAns(q)) + '</b></div>';
    h += t.lines.map(function (l) { return '<div>• ' + esc(l) + '</div>'; }).join('');
    if (t.miss.length) h += '<div class="th-ms">' + t.miss.map(function (l) { return '<div>• ' + esc(l) + '</div>'; }).join('') + '</div>';
    if (t.glossary.length) h += '<div class="th-gl">📖 คำศัพท์ (詞彙)<br>' + t.glossary.map(function (g) { return esc(g[0]) + ' = ' + esc(g[1]); }).join('<br>') + '</div>';
    return h;
  }
  function thaiButton() {
    var say = document.getElementById('say'), nx = document.getElementById('nx');
    if (!say || !nx || say.querySelector('.th-btn') || !window.TH || !q || !q.explain) return;
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn ghost th-btn'; btn.textContent = '🇹🇭 ดูคำอธิบายภาษาไทย'; btn.style.cssText = 'margin:8px 8px 0 0';
    var box = document.createElement('div'); box.className = 'th-box'; box.style.display = 'none';
    btn.onclick = function () {
      if (!box.dataset.f) { box.innerHTML = thaiHtml(); box.dataset.f = '1'; }
      var open = box.style.display === 'none'; box.style.display = open ? '' : 'none';
      btn.textContent = open ? '🇹🇭 ซ่อนคำอธิบายภาษาไทย' : '🇹🇭 ดูคำอธิบายภาษาไทย';
    };
    nx.parentNode.insertBefore(btn, nx); nx.parentNode.insertBefore(box, nx);
  }
  // 掛勾：答對／答錯動畫、每題開始時判斷要不要開「軍師拆解」
  function setupHooks() {
    if (typeof window.next !== 'function') return;
    var oNext = window.next;
    window.next = function () { var r = oNext.apply(this, arguments); try { if (!lock) { scReset(); tutorMaybe(); } } catch (e) {} return r; };
    if (typeof window.answer === 'function') {
      var oAns = window.answer;
      window.answer = function (v, btn) {
        var was = true; try { was = lock; } catch (e) {}
        var r = oAns.apply(this, arguments);
        try { if (!was && btn && btn.classList.contains('ok')) scWin(); } catch (e) {}
        return r;
      };
    }
    if (typeof window.miss === 'function') {
      var oMiss = window.miss;
      window.miss = function () {
        var was = true; try { was = lock; } catch (e) {}
        var r = oMiss.apply(this, arguments);
        try { if (!was) { var o = $('#ms-tut'); if (o) o.remove(); $('#s-game').classList.remove('ms-tut-on'); scLose(); thaiButton(); } } catch (e) {}
        return r;
      };
    }
  }

  var MS = {
    cfg: CFG,
    stage: function (k, d) { return GT[k] != null ? GT[k] : d; },
    // 每個關卡主程式最後呼叫一次：MS.init(MODES, SID)
    init: function (M, sid) {
      S.M = M || null;
      S.sid = sid || '';
      if (M && M.real && M.hard) {
        M.real.t = Math.round(M.real.t * (GT.timeScaleReal || 1) * 10) / 10; M.hard.t = Math.round(M.hard.t * (GT.timeScaleHard || 1) * 10) / 10;
        S.orig = { real: M.real.t, hard: M.hard.t };
      }
      injectStyle();
      var anchor = $('#modes');
      if (anchor) {
        injectLesson(anchor);
        var p = document.createElement('div'); p.className = 'ms-panel'; p.id = 'ms-panel';
        anchor.parentNode.insertBefore(p, anchor);
        // 被鎖住的模式：擋在關卡原本的點擊處理之前
        anchor.addEventListener('click', function (e) {
          var b = e.target.closest && e.target.closest('.mode');
          if (!b) return;
          var r = lockMsg(b.dataset.m);
          if (r) {
            e.stopImmediatePropagation(); e.preventDefault();
            var t = $('#ms-panel'); if (t) t.innerHTML = '🔒 ' + r + '<br><small>先回練兵／實戰把星數拿到，再回來挑戰！</small>';
          }
        }, true);
      }
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
      setupRevive();
      var pm = qp.get('mode');
      setupScene();
      setupHooks();      // 要比休息小遊戲先掛：小遊戲暫停後接回的 next 才會帶到動畫與軍師拆解
      setupRelax();
      if (pm && !S.flag && !lockMsg(pm)) { var pb = $('#modes .mode[data-m="' + pm + '"]'); if (pb) { pb.click(); S.pre = pm; var bx = $('#modes'); if (bx) bx.style.display = 'none'; } }
      refresh();
    },
    // start() 裡呼叫：回傳 true 代表這一局是無極限（題目改成一題一題現場出）
    begin: function (rescue) {
      S.ended = false; S.lastType = null; S.t0 = Date.now();
      try { if (window.RelaxBreak && RX.on) window.RelaxBreak.reset(); } catch (e) {}
      S.active = S.flag && !rescue && S.stars >= CFG.ENDLESS_NEED;
      if (!S.active) restore();
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
      return S.active ? '♾️ 第 ' + idx + ' ' + unit : '第 ' + idx + '/' + len + ' ' + unit;
    },
    hp: function (right, len) {   // Boss 血條：無極限時每答對 10 題循環一次
      return S.active ? 100 - (right % 10) * 10 : 100 - right / len * 100;
    },
    // finish() 最後呼叫：依模式結算星數、畫結算畫面、通知地圖
    result: function (o) {
      if (o.rescue) return;
      if (!snd(o.fail ? 'defeat' : 'victory')) tone(o.fail ? SFX.lose : SFX.win); if (window.BGM) BGM.stop();
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
        var accE = o.total ? o.right / o.total : 0, es = o.fail ? 0 : starsFor('easy', accE);
        if (!o.fail) $s.textContent = starStr(es);
        S.stars = Math.max(S.stars, es);
        var add = '<br>🎯 正確率 ' + Math.round(accE * 100) + '%（' + ruleText('easy').replace('🎯 正確率 ', '') + '）<br>📊 本關目前最高：' + starStr(S.stars) + '（練兵最高 ' + maxStarOf('easy') + ' ⭐，想拿更多請挑戰實戰與修羅）';
        $i.innerHTML += add + speedLine(o, !o.fail) + pityLine(o, !o.fail);
        if (o.emb) post({ type: 'stage-result', id: o.sid, stars: es, fail: o.fail, score: o.score, right: o.right, total: o.total, mode: 'easy' });
        refresh();
        return;
      }

      /* ---- 實戰 / 修羅 ---- */
      var real = o.mode === 'real';
      var acc = o.total ? o.right / o.total : 0, pct = Math.round(acc * 100);
      var gain = o.fail ? 0 : starsFor(o.mode, acc);
      var pass = gain > 0, prev2 = S.stars;
      if (pass) S.stars = Math.max(S.stars, gain);
      var orig = $t.textContent;
      if (!pass) { if (!o.fail) $t.textContent = '差一點就達標了！'; }
      else if (/凱旋！$/.test(orig)) $t.textContent = (real ? '將軍' : '兵仙') + '　凱旋！';   // Boss 關保留原本標題
      $s.textContent = o.fail ? '💔' : starStr(pass ? gain : S.stars);
      var add2 = '<br>🎯 正確率 ' + pct + '%（' + ruleText(o.mode).replace('🎯 正確率 ', '') + '）　' + (pass ? '✅ 拿到 ' + gain + ' ⭐' : '❌ 未達標，星數不變');
      if (pass && gain > prev2) add2 += '<br>⭐ 這一關升到 ' + gain + ' 星！';
      $i.innerHTML += add2 + speedLine(o, pass) + pityLine(o, pass);
      if (o.emb) post({ type: 'stage-result', id: o.sid, stars: gain, fail: !pass, score: o.score, right: o.right, total: o.total, mode: o.mode });
      refresh();
    }
  };
  /* ---- 🔊 音效（WebAudio 合成，不需音檔）：答對／答錯／過關／失敗 ---- */
  var AC = null, mute = false;
  try { mute = localStorage.getItem('ms-mute') === '1'; } catch (e) {}
  var SFX = {
    ok: [[660, .1, 'square', 0], [880, .14, 'square', .09]],
    bad: [[220, .18, 'sawtooth', 0], [165, .25, 'sawtooth', .14]],
    win: [[523, .12, 'square', 0], [659, .12, 'square', .12], [784, .12, 'square', .24], [1047, .3, 'square', .36]],
    lose: [[330, .2, 'triangle', 0], [262, .2, 'triangle', .2], [196, .4, 'triangle', .4]]
  };
  function tone(seq) {
    try { mute = localStorage.getItem('ms-mute') === '1'; } catch (e) {}   // 地圖頁的音效鈕會改這個值，要即時讀
    if (mute) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      var t = AC.currentTime;
      seq.forEach(function (n) {
        var o = AC.createOscillator(), g = AC.createGain();
        o.type = n[2]; o.frequency.value = n[0];
        g.gain.setValueAtTime(0.08, t + n[3]); g.gain.exponentialRampToValueAtTime(0.001, t + n[3] + n[1]);
        o.connect(g); g.connect(AC.destination); o.start(t + n[3]); o.stop(t + n[3] + n[1] + 0.02);
      });
    } catch (e) {}
  }
  MS.sfx = function (k) { tone(SFX[k]); };
  function initSfx() {
    var b = document.createElement('button');
    b.textContent = mute ? '🔇' : '🔊'; b.title = '音效開關';
    b.style.cssText = 'position:fixed;right:8px;bottom:8px;z-index:50;border:1px solid #888;border-radius:50%;width:36px;height:36px;background:#0008;color:#fff;font-size:18px;cursor:pointer';
    b.onclick = function () { mute = !mute; b.textContent = mute ? '🔇' : '🔊'; try { localStorage.setItem('ms-mute', mute ? '1' : '0'); } catch (e) {} };
    // 嵌在地圖頁裡時，地圖右下角已經有一顆音效鈕（浮在關卡上面），關卡不要再加第二顆
    var embedded = false; try { embedded = window.parent !== window && !!window.parent.document.getElementById('mutebtn'); } catch (e) {}
    if (!embedded) document.body.appendChild(b);
    // 所有按鈕的點擊音（作答選項 .opt 不在這裡，答對／答錯有自己的音效）
    document.addEventListener('click', function (e) {
      var t = e.target && e.target.closest && e.target.closest('button');
      if (!t || t === b || t.disabled || t.classList.contains('opt') || t.classList.contains('mt-opt') || t.closest('.rb-ov')) return;
      if (t.closest('#ms-tut') && t.id !== 'mt-hint' && t.id !== 'mt-skip' && !t.classList.contains('mt-key') && !t.classList.contains('mt-chip')) return;   // 拆解面板的按鈕自己出聲，不再疊一層點擊音
      if (t.classList.contains('go') && t.closest('#ms-tut')) return;
      var id = t.id || '', n = 'click';
      if (id === 't-hint') n = 'hint'; else if (id === 't-cut') n = 'cut'; else if (id === 't-freeze') n = 'freeze';
      else if (id === 'go' || id === 'again' || id === 'rescue') n = 'start';
      else if (t.classList.contains('mode')) n = 'select';
      else if (id === 'ms-ready') n = 'confirm';
      else if (id === 'back') n = 'back';
      snd(n);
    }, true);
    new MutationObserver(function (list) {
      var bad = 0, ok = 0;
      list.forEach(function (r) {
        var c = r.target.classList, old = r.oldValue || '';
        if (!c || (r.target.closest && r.target.closest('#ms-tut'))) return;   // 練兵拆解面板有自己的音效，不要重複觸發
        if (c.contains('bad') && !/\bbad\b/.test(old)) bad = 1;
        if (c.contains('ok') && !/\bok\b/.test(old)) ok = 1;
      });
      if (bad) { if (!snd('wrong')) tone(SFX.bad); }   // 一次只出一個音效，不再疊「撞牆」的第二層
      else if (ok) {
        var say = document.getElementById('say'), timeUp = say && /時間到/.test(say.textContent || '');
        if (timeUp) { if (!snd('timeup')) tone(SFX.bad); }
        else {
          if (!snd('correct')) tone(SFX.ok);
          setTimeout(function () { var s2 = document.getElementById('say'); if (s2 && /連擊/.test(s2.textContent || '')) snd('combo'); }, 120);
        }
      }
    }).observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true, attributeOldValue: true });
  }
  if (document.body) initSfx(); else document.addEventListener('DOMContentLoaded', initSfx);
  window.MS = MS;

  /* ---- 關卡寫「練兵拆解步驟」用的小工具：TS.st(說明, 正解, [[錯誤選項, 為什麼錯]], 這一步的結論, 附圖) ---- */
  window.TS = (function () {
    var SUPS = '⁰¹²³⁴⁵⁶⁷⁸⁹';
    function sup(n) { return String(n).split('').map(function (c) { return SUPS[+c]; }).join(''); }
    function term(p, e) { return e === 1 ? String(p) : p + sup(e); }
    function st(say, ok, wr, line, vis) { return { say: say, ok: String(ok), wr: (wr || []).map(function (w) { return [String(w[0]), w[1]]; }), line: line, vis: vis }; }
    function fac(n) { var r = []; for (var p = 2; p * p <= n; p++) { var e = 0; while (n % p === 0) { n /= p; e++; } if (e) r.push([p, e]); } if (n > 1) r.push([n, 1]); return r; }
    function std(n) { return fac(n).map(function (x) { return term(x[0], x[1]); }).join(' × '); }
    function gcd2(a, b) { return b ? gcd2(b, a % b) : a; }
    // 最大公因數／最小公倍數：先分解每個數 → 逐個質因數取最少／最多次方 → 相乘
    function gcdSteps(arr, kind) {
      var isG = kind === 'gcd', fs = arr.map(fac), out = [];
      arr.forEach(function (a, i) {
        var f = fs[i], good = std(a), last = f.length - 1;
        var v1 = f.map(function (x, j) { return term(x[0], j === 0 ? x[1] + 1 : x[1]); }).join(' × ');
        var v2 = f.length > 1 ? f.slice(0, -1).map(function (x) { return term(x[0], x[1]); }).join(' × ') : term(f[0][0], f[0][1] + 1);
        var v3 = f.map(function (x, j) { return term(x[0], j === last ? (x[1] > 1 ? x[1] - 1 : x[1] + 1) : x[1]); }).join(' × ');
        var why = '次方數不對，用短除法一層一層除，同一個質數出現幾次，次方就是幾。';
        out.push(st('把 <b>' + a + '</b> 用短除法拆開，寫成標準分解式：', good, [[v1, why], [v2, why], [v3, why]], a + ' = ' + good));
      });
      return out.concat(expSteps(fs, arr, kind));
    }
    function parseStd(s) {   // 「2² × 3」→ [[2,2],[3,1]]
      return String(s).split('×').map(function (t) { var m = /(\d+)\s*([⁰¹²³⁴⁵⁶⁷⁸⁹]*)/.exec(t.trim()); return m ? [+m[1], m[2] ? +m[2].split('').map(function (c) { return SUPS.indexOf(c); }).join('') : 1] : null; }).filter(Boolean);
    }
    function stdWrong(n) {
      var f = fac(n), last = f.length - 1, why = '次方數不對，用短除法一層一層除，同一個質數出現幾次，次方就是幾。';
      return [
        [f.map(function (x, j) { return term(x[0], j === 0 ? x[1] + 1 : x[1]); }).join(' × '), why],
        [f.length > 1 ? f.slice(0, -1).map(function (x) { return term(x[0], x[1]); }).join(' × ') : term(f[0][0], f[0][1] + 1), why],
        [f.map(function (x, j) { return term(x[0], j === last ? (x[1] > 1 ? x[1] - 1 : x[1] + 1) : x[1]); }).join(' × '), why]
      ];
    }
    // 已經分解好（fs＝每個數的 [[質數,次方]]）→ 逐個質因數取最少／最多次方 → 相乘
    function expSteps(fs, arr, kind) {
      var isG = kind === 'gcd', out = [];
      var primes = []; fs.forEach(function (f) { f.forEach(function (x) { if (primes.indexOf(x[0]) < 0) primes.push(x[0]); }); }); primes.sort(function (a, b) { return a - b; });
      var parts = [], val = 1;
      primes.forEach(function (p) {
        var ex = fs.map(function (f) { var m = f.filter(function (x) { return x[0] === p; })[0]; return m ? m[1] : 0; });
        if (isG && ex.indexOf(0) >= 0) return;
        var mn = Math.min.apply(null, ex), mx = Math.max.apply(null, ex), pick = isG ? mn : mx, other = isG ? mx : mn;
        var wr = []; if (other !== pick) wr.push([other, isG ? '最大公因數要取「最少」的次方，只有每個數都有的才算。' : '最小公倍數要取「最多」的次方，每個質因數都要顧到。']);
        wr.push([ex.reduce(function (a, b) { return a + b; }, 0), '不是把次方加起來，是「' + (isG ? '取最少' : '取最多') + '」。']);
        out.push(st('看質因數 <b>' + p + '</b>：它在 ' + arr.join('、') + ' 裡的次方分別是 <b>' + ex.join('、') + '</b>（沒有就是 0）。要' + (isG ? '取「最少」' : '取「最多」') + '的次方，是多少？', pick, wr, p + ' 取 ' + pick + ' 次方 → ' + term(p, pick)));
        parts.push(term(p, pick)); val *= Math.pow(p, pick);
      });
      if (!parts.length) { out.push(st('這些數有沒有共同的質因數？', '沒有，所以最大公因數是 1', [['有，是 2', '2、3、5… 每個都試試看，沒有一個質因數是大家都有的。']], '沒有共同質因數 → 1')); return out; }
      var prodBases = primes.reduce(function (a, p) { return a * p; }, 1);
      out.push(st('把取到的質因數乘起來：<b>' + parts.join(' × ') + '</b> ＝ ？', val, [[prodBases === val ? val + 1 : prodBases, '次方也要乘進去。']], (isG ? '最大公因數' : '最小公倍數') + ' = ' + val));
      return out;
    }
    // 戰術辨識：先看是找因數還找倍數，再看有沒有「剩下／還差」
    function tactic(fam) {
      var g = /^(gcd|gr|gs)$/.test(fam), dir = fam === 'gr' || fam === 'lr' ? 'r' : fam === 'gs' || fam === 'ls' ? 's' : 'n';
      return [
        st('先抓關鍵字：「分裝、剪裁、最大、間隔」是找<b>因數</b>；「同時再遇、週期、最少、最小」是找<b>倍數</b>。這一題是？', g ? '找因數（最大公因數）' : '找倍數（最小公倍數）', [[g ? '找倍數（最小公倍數）' : '找因數（最大公因數）', g ? '「最大、分裝」是把東西切開，找因數。' : '「同時再遇、最少」是往後找倍數。']], g ? '找因數 → 最大公因數' : '找倍數 → 最小公倍數'),
        st('再看有沒有「剩下」或「還差」：', dir === 'r' ? '有「剩下」' : dir === 's' ? '有「還差」' : '都沒有', [[dir === 'n' ? '有「剩下」' : '都沒有', dir === 'n' ? '題目裡沒有「剩下」的字樣。' : '再讀一次題目，有沒有「剩下」或「還差」？'], [dir === 's' ? '有「剩下」' : '有「還差」', '看清楚是「剩下」還是「還差」。']], dir === 'r' ? '剩下 r → ' + (g ? '先減掉餘數' : '最後加上餘數') : dir === 's' ? '還差 s → ' + (g ? '先加上不足' : '最後減去不足') : '直接求')
      ];
    }
    // 判斷一個數是質數、合數、還是 1：用 2、3、5、7… 逐一試
    function primeStep(n) {
      if (n === 1) return st('<b>1</b> 是質數、合數，還是都不是？', '都不是（1 只有 1 個因數）', [['質數', '質數剛好有 2 個因數，1 只有 1 個。'], ['合數', '合數有 3 個以上的因數，1 只有 1 個。']], '1：都不是');
      var a = fac(n)[0][0], prime = a === n;
      return st('<b>' + n + '</b>：除了 1 和自己，能被 2、3、5、7 整除嗎？', prime ? '都不能 → 質數' : a + ' 可以整除 → 合數', [[prime ? '2 可以整除 → 合數' : '都不能 → 質數', prime ? n + ' 試 2、3、5、7 都除不盡。' : n + ' ÷ ' + a + ' = ' + (n / a) + '，可以整除。']], prime ? n + '：質數' : n + ' = ' + a + '×' + (n / a) + '：合數');
    }
    // 「去括號」互動：學生自己點「哪幾項要變號」（flip[i]＝這一項要不要變號）
    // 先點出「要相乘的兩個數字」（tokens 裡有 id 的可以點，need 是正確的兩個 id），再自己輸入結果
    function pair(say, say2, tokens, need, ans, line, why, verb) { return { say: say, say2: say2, ok: String(ans), wr: [], input: true, pair: { tokens: tokens, need: need, why: why, verb: verb }, line: line }; }
    function tog(say, terms, after, flip, line, why) { return { say: say, ok: 'x', wr: [], toggle: { terms: terms, after: after, flip: flip, why: why }, line: line }; }
    return { st: st, tog: tog, pair: pair, primeStep: primeStep, fac: fac, std: std, sup: sup, term: term, gcd: gcd2, gcdSteps: gcdSteps, expSteps: expSteps, parseStd: parseStd, stdWrong: stdWrong, tactic: tactic };
  })();
})();
