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
  (function(){ var sc = document.createElement('script'); sc.src = 'bgm.js'; sc.onload = function(){ if (window.BGM) BGM.play('battle'); }; document.head.appendChild(sc); })();
  var CFG = {
    REAL_NEED: 0,      // 三種模式皆可直接挑戰
    HARD_NEED: 0,
    EASY_MAX: 2,       // 練兵最高星數
    REAL_MID: 0.6,     // 實戰 3 星所需正確率
    REAL_MIDSTAR: 3,
    ENDLESS_NEED: 3,   // 解鎖無極限所需星數
    REAL_PASS: 0.8,    // 實戰達標正確率
    HARD_PASS: 1,      // 修羅達標正確率
    REAL_STAR: 4,
    HARD_STAR: 5,
    MAXSTAR: 5,
    RAMP: 30,          // 無極限：作答到第幾題時，時間縮到修羅速度
    SWITCH: 15         // 無極限：第幾題之後，改用修羅難度出題
  };

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
  var RULE = {
    easy: '🎯 依錯題數拿 1～2 ⭐（最高 2 ⭐）',
    real: '🎯 正確率 ' + Math.round(CFG.REAL_MID * 100) + '% → 3 ⭐、' + Math.round(CFG.REAL_PASS * 100) + '% 以上 → ' + CFG.REAL_STAR + ' ⭐',
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
      '#ms-ready{display:block;margin:12px auto 2px}';
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
    var vid = L.video
      ? '<div class="ms-video"><iframe src="' + esc(L.video) + '" title="教學影片" loading="lazy" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe></div>'
      : '<div class="ms-novideo">🎬 老師還沒有放教學影片，先看看上面的觀念與技巧複習吧！</div>';
    var li = function (t) { return '<li>' + esc(t) + '</li>'; };
    box.innerHTML =
      '<div class="ms-lhead">📖 上課前，先複習一下！</div>' +
      (L.concept && L.concept.length ? '<div class="ms-lsec"><b>🧠 觀念重點</b><ul>' + L.concept.map(li).join('') + '</ul></div>' : '') +
      (L.tip && L.tip.length ? '<div class="ms-lsec"><b>💡 作答技巧</b><ul>' + L.tip.map(li).join('') + '</ul></div>' : '') +
      vid +
      '<button class="btn" id="ms-ready">✅ 我複習好了，開始選模式！</button>';
    parent.insertBefore(box, gate);
    $('#ms-ready').onclick = function () { gate.style.display = ''; box.style.display = 'none'; };
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
      '三種模式可自由挑戰：練兵最高 2 ⭐、實戰最高 4 ⭐、修羅最高 5 ⭐，星數取各模式最高；拿到 3 ⭐ 就解鎖無極限挑戰。';
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

  // 連續失敗 2 次 → 練習建議（過關即歸零）
  function pityLine(o, ok) {
    try {
      var k = 'ms-pity-' + o.sid, c = ok ? 0 : (+localStorage.getItem(k) || 0) + 1;
      localStorage.setItem(k, c);
      if (c >= 2) return '<br>💡 這一關已經連續 ' + c + ' 次沒過囉！練習建議：<br>① 回到關卡開頭，先看「課前複習」的觀念與影片<br>② 改用 🎯 練兵模式（不計時）慢慢練<br>③ 回地圖首頁的「錯題練習」，看看哪種題型最容易錯';
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
  var MS = {
    cfg: CFG,
    // 每個關卡主程式最後呼叫一次：MS.init(MODES, SID)
    init: function (M, sid) {
      S.M = M || null;
      S.sid = sid || '';
      if (M && M.real && M.hard) S.orig = { real: M.real.t, hard: M.hard.t };
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
      var pm = qp.get('mode');
      if (pm && !S.flag && !lockMsg(pm)) { var pb = $('#modes .mode[data-m="' + pm + '"]'); if (pb) pb.click(); }
      refresh();
    },
    // start() 裡呼叫：回傳 true 代表這一局是無極限（題目改成一題一題現場出）
    begin: function (rescue) {
      S.ended = false; S.lastType = null; S.t0 = Date.now();
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
      tone(o.fail ? SFX.lose : SFX.win); if (window.BGM) BGM.stop();
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
        var es = Math.min(CFG.EASY_MAX, o.stars);
        if (!o.fail) $s.textContent = starStr(es);
        S.stars = Math.max(S.stars, es);
        var add = '<br>📊 本關目前最高：' + starStr(S.stars) + '（練兵最高 2 ⭐，想拿更多請挑戰實戰與修羅）';
        $i.innerHTML += add + speedLine(o, !o.fail) + pityLine(o, !o.fail);
        if (o.emb) post({ type: 'stage-result', id: o.sid, stars: es, fail: o.fail, score: o.score, right: o.right, total: o.total, mode: 'easy' });
        refresh();
        return;
      }

      /* ---- 實戰 / 修羅 ---- */
      var real = o.mode === 'real';
      var need = real ? CFG.REAL_PASS : CFG.HARD_PASS, prize = real ? CFG.REAL_STAR : CFG.HARD_STAR;
      var acc = o.total ? o.right / o.total : 0, pct = Math.round(acc * 100);
      var gain = 0;
      if (!o.fail) { if (real) gain = acc + 1e-9 >= CFG.REAL_PASS ? CFG.REAL_STAR : (acc + 1e-9 >= CFG.REAL_MID ? CFG.REAL_MIDSTAR : 0); else if (acc + 1e-9 >= need) gain = prize; }
      var pass = gain > 0, prev2 = S.stars;
      if (pass) S.stars = Math.max(S.stars, gain);
      var orig = $t.textContent;
      if (!pass) { if (!o.fail) $t.textContent = '差一點就達標了！'; }
      else if (/凱旋！$/.test(orig)) $t.textContent = (real ? '將軍' : '兵仙') + '　凱旋！';   // Boss 關保留原本標題
      $s.textContent = o.fail ? '💔' : starStr(pass ? gain : S.stars);
      var add2 = '<br>🎯 正確率 ' + pct + '%（' + (real ? '3 ⭐ 需 60%、4 ⭐ 需 80%' : '5 ⭐ 需全對') + '）　' + (pass ? '✅ 拿到 ' + gain + ' ⭐' : '❌ 未達標，星數不變');
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
    document.body.appendChild(b);
    new MutationObserver(function (list) {
      var bad = 0, ok = 0;
      list.forEach(function (r) {
        var c = r.target.classList, old = r.oldValue || '';
        if (!c) return;
        if (c.contains('bad') && !/\bbad\b/.test(old)) bad = 1;
        if (c.contains('ok') && !/\bok\b/.test(old)) ok = 1;
      });
      if (bad) tone(SFX.bad); else if (ok) tone(SFX.ok);
    }).observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true, attributeOldValue: true });
  }
  if (document.body) initSfx(); else document.addEventListener('DOMContentLoaded', initSfx);
  window.MS = MS;
})();
