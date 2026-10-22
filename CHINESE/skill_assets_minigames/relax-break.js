/* relax-break.js v1.4 ｜ 休息小遊戲控制器（教育遊戲通用）
 * 規則（Eric 10-21 拍板）：
 *   1. 學生連續答題 N 次（預設 5）→ 隨機出現「某一款遊戲的某一種玩法」
 *   2. 一次一局決勝負；平手就再玩一次；連續平手 → 電腦失誤率逐次提高
 *   3. 贏了 → 給寶箱或關卡獎勵（內容由各遊戲自己實作 rewards.chest / rewards.stage）
 *   4. 輸了或放棄 → 沒有獎勵，直接回去答題
 * v1.1：新增 打地鼠／抽鬼牌／排七（共 17 款）；連續答對 N 題也觸發（streak）；累積贏電腦 N 次解鎖「遊戲區」、每天最多玩 M 回（unlockWins／dailyLimit）
 * v1.2：解鎖改成「同一款贏電腦 N 次，該款就能在遊戲區直接玩」（unlockWins，預設用 3）；電腦強度依該款的勝場數與勝率慢慢調高（adaptive），一律從最簡單開始；翻牌只留 4×4、打地鼠 20 秒
 * v1.3：遊戲區「每一款」每天各玩 dailyLimit 回（不再是全部合計）
 * v1.4：遊戲區改成「圖鑑」（未解鎖也看得到、顯示進度與最佳成績）；上／下樓梯解鎖後變單人挑戰（層數越多越快）；打地鼠時間說明修正
 * 用法與整合步驟見 references/dept-90-relax-minigames.md
 * 遊戲本體由 relax-break.bundle.js 內嵌（window.RELAX_GAMES）；或設定 baseUrl 改讀外部 games/*.html
 */
(function (global) {
  'use strict';

  /* ---------- 小遊戲登記表（新增小遊戲 = 在這裡加一筆 + 放進 games/ + 重新打包）---------- */
  var REGISTRY = [
    { id: 'go9', file: 'go9.html', name: '九路圍棋', emoji: '⚫', mins: '5～10',
      rule: '你執黑先下，圍住比較多的地方就贏（白棋貼 7 子）。雙方連續按「虛手」就結束算分。',
      variants: [{ id: 'std', label: '單局決勝' }] },
    { id: 'gomoku9', file: 'gomoku9.html', name: '九路五子棋', emoji: '⚪', mins: '2～5',
      rule: '輪流下棋，先把自己的 5 顆棋子連成一直線（橫、直、斜都可以）就贏。',
      variants: [{ id: 'black', label: '你執黑（先手）' }, { id: 'white', label: '你執白（後手）' }] },
    { id: 'reversi', file: 'reversi.html', name: '黑白棋', emoji: '⚫', mins: '4～8',
      rule: '下一顆棋，夾住對方的棋就能翻成自己的顏色。棋盤下滿時，棋子比較多的人贏。',
      variants: [{ id: 'black', label: '你執黑（先手）' }, { id: 'white', label: '你執白（後手）' }] },
    { id: 'hexxagon', file: 'hexxagon.html', name: '六角寶石戰', emoji: '💎', mins: '3～8',
      rule: '點自己的寶石：隔壁一格是「分身」，隔兩格是「跳躍」。落點周圍的對方寶石會被翻成你的顏色，最後寶石多的人贏。',
      variants: [{ id: 'small37', label: '小六角（速戰）' }, { id: 'random37', label: '小六角（隨機 4 洞）' },
                 { id: 'classic', label: '經典六角（中間有洞）' }, { id: 'square7', label: '7×7 方形' }, { id: 'open61', label: '大六角（無障礙）' }] },
    { id: 'snake', file: 'snake-duel.html', name: '貪吃蛇對決', emoji: '🐍', mins: '1～2',
      rule: '吃蘋果變長；用蛇頭碰到對方「最後一格尾巴」可以咬斷它；撞牆或撞身體會輸。時間到比誰比較長。',
      variants: [{ id: '6-on', label: '6×6・有邊界' }, { id: '6-off', label: '6×6・可穿牆' },
                 { id: '10-on', label: '10×10・有邊界' }, { id: '10-off', label: '10×10・可穿牆' }] },
    { id: 'catmouse', file: 'cat-mouse-maze.html', name: '貓抓老鼠大迷宮', emoji: '🐭', mins: '2～4',
      rule: '你是老鼠，吃光所有乳酪就贏。小心三隻貓！吃到大乳酪後貓會發抖，這時可以反過來吃貓。三條命用完就輸。',
      variants: [{ id: 'std', label: '經典迷宮' }] },
    { id: 'minesweeper', file: 'minesweeper.html', name: '踩地雷', emoji: '💣', mins: '1～5',
      rule: '打開沒有地雷的格子。數字是「周圍 8 格藏了幾顆地雷」。全部安全格都打開就贏，踩到地雷就輸。',
      variants: [{ id: '6,6,5', label: '入門 6×6（5 顆）' }, { id: '6,6,8', label: '入門進階 6×6（8 顆）' }, { id: '9,9,10', label: '初級 9×9（10 顆）' }] },
    { id: 'checkers', file: 'chinese-checkers.html', name: '跳棋', emoji: '🎯', mins: '5～12',
      rule: '點自己的棋子，再點亮起來的空格。可以走相鄰一格，或跳過旁邊的棋子（可以連續跳）。先把所有棋子搬到對面的三角形就贏。',
      variants: [{ id: '6', label: '每人 6 顆（較快）' }, { id: '10', label: '每人 10 顆' }] },
    { id: 'memory', file: 'memory-match.html', name: '翻牌對對碰', emoji: '🃏', mins: '2～5',
      rule: '輪流翻兩張牌，圖案一樣就配對成功，可以再翻一次；翻錯就換電腦。最後配對比較多的人贏。',
      variants: [{ id: '4x4', label: '4×4（8 對）' }] },
    { id: 'upstairs', file: 'upstairs.html', name: '上樓梯大對決', emoji: '⬆️', mins: '1～3',
      rule: '你（藍）和電腦（紅）一起往上跳。左右移動，踩到樓梯會自動彈起；小心尖刺、會碎的假樓梯，下面的岩漿會一直往上追。先出局的人輸。',
      variants: [{ id: 'std', label: '標準（不補血）' }, { id: 'heal', label: '踩一般樓梯會補血' }, { id: 'solo', solo: true, label: '單人挑戰（越爬越快）', rule: '解鎖後的單人挑戰：只有你一個人往上跳，爬得越高，岩漿追得越快！左右移動，踩到樓梯會自動彈起；小心尖刺和會碎的假樓梯。看你能爬到第幾層，創下最佳紀錄。' }], best: { unit: '層', solo: true } },
    { id: 'downstairs', file: 'downstairs.html', name: '下樓梯大對決', emoji: '⬇️', mins: '1～3',
      rule: '你（藍）和電腦（紅）一起往下跳。左右移動，避開尖刺，別被天花板壓到或掉出畫面。先出局的人輸。',
      variants: [{ id: 'std', label: '標準（不補血）' }, { id: 'heal', label: '踩一般樓梯會補血' }, { id: 'solo', solo: true, label: '單人挑戰（越跳越快）', rule: '解鎖後的單人挑戰：只有你一個人往下跳，越往下，天花板壓得越快！左右移動，避開尖刺，別被天花板壓到或掉出畫面。看你能到地下第幾層，創下最佳紀錄。' }], best: { unit: '層', solo: true } },
    { id: 'banqi', file: 'banqi.html', name: '暗棋', emoji: '🎴', mins: '5～12',
      rule: '32 顆棋子全部蓋著。每一步可以翻開一顆，或把自己的棋走一格、吃掉比較小的對方棋子（兵卒能吃將帥，炮要隔一顆跳著吃）。把對方吃光或讓對方無棋可走就贏；連續 40 步沒有翻棋也沒有吃子算平手。',
      variants: [{ id: 'me', label: '你先手' }, { id: 'ai', label: '電腦先手' }] },
    { id: 'xiangqi', file: 'xiangqi.html', name: '象棋', emoji: '♟️', mins: '10～25',
      rule: '紅方先走。把對方的將（帥）將死，或讓對方無棋可走就贏。點自己的棋子會出現藍點（可走）和藍圈（可吃）。重複局面或太久沒人吃子算平手。',
      variants: [{ id: 'red', label: '你執紅（先手）' }, { id: 'black', label: '你執黑（後手）' }] },
    { id: 'pickupred', file: 'pickup-red.html', name: '撿紅點', emoji: '♥️', mins: '3～6',
      rule: '只有紅色牌（♥♦）有分。出一張手牌，和桌上的牌湊成「單十（2+8、3+7、4+6、5+5）」「雙十（10、J、Q、K 同點數）」或「A+9」就能收走，紅點加起來就是得分。出完牌要自己翻一張共牌。最後得分最高的人贏。',
      variants: [{ id: '2', label: '2 人（你＋1 電腦）' }, { id: '3', label: '3 人（你＋2 電腦）' }, { id: '4', label: '4 人（你＋3 電腦）' }] },
    { id: 'whack', file: 'whack-a-mole.html', name: '打地鼠', emoji: '🔨', mins: '1', timeText: '20 秒', best: { unit: '分' },
      rule: '20 秒內，你（左邊）和電腦（右邊）同時打一模一樣的地鼠。普通地鼠打 1 下 10 分、鐵帽打 2 下 30 分、黃金打 3 下 60 分。分數比電腦高就贏。',
      variants: [{ id: 'std', label: '你 vs 電腦' }] },
    { id: 'oldmaid', file: 'oldmaid-joker.html', name: '抽鬼牌', emoji: '🃏', mins: '3～6',
      rule: '你和 2 台電腦玩。先把手上成對的牌挑出來丟掉，再輪流從下一位的牌裡盲抽一張。最後手上剩下鬼牌的人輸；你沒拿到鬼牌就贏！',
      variants: [{ id: 'std', label: '鬼牌版（你＋2 電腦）' }] },
    { id: 'sevens', file: 'sevens.html', name: '排七', emoji: '🂡', mins: '4～8',
      rule: '拿到黑桃 7 的人先出。輪流出「任何花色的 7」或「接在桌上同花色、數字相連的牌」；能出就一定要出，真的不能出才蓋一張小牌。全部出完後，蓋牌點數最少的人贏。',
      variants: [{ id: '4', label: '4 人（你＋3 電腦）' }, { id: '3', label: '3 人（你＋2 電腦）' }] }
  ];

  var DEFAULTS = {
    enabled: true,
    every: 5,                 // 連續答題幾次後出現
    streak: 0,                // 連續答對幾題也觸發（0＝不啟用）；和 every 兩者先到先觸發
    unlockWins: 0,            // 同一款小遊戲累積贏電腦幾次，就能在「遊戲區」直接玩這一款（0＝不使用遊戲區）
    adaptive: true,           // 電腦強度依「這一款」的勝場數與勝率自動調整，一律從最簡單開始（false＝固定用 level）
    dailyLimit: 2,            // 遊戲區「每一款」每天最多玩幾回
    storageKey: 'relax_break_v1', // 存在瀏覽器 localStorage 的鍵名（累積勝場、今日已玩回數）
    countCorrectOnly: false,  // true＝只算答對，答錯就歸零（預設：不管對錯都算「答題一次」）
    level: 'normal',          // 電腦強度 easy / normal / hard
    errStep: 0.25,            // 每連續平手一次，電腦失誤率加多少
    errMax: 0.9,              // 失誤率上限
    rewardMode: 'random',     // 'random' | 'chest' | 'stage'
    chestWeight: 0.5,         // rewardMode=random 時抽到寶箱的機率
    rewardLabels: { chest: '寶箱', stage: '關卡獎勵' },
    games: null,              // null＝全部；['hexxagon','snake']；或 {hexxagon:['small37'], snake:null}
    allowSkip: true,          // 是否允許「先不玩 / 放棄」（視為沒贏，沒有獎勵）
    baseUrl: '',              // 空字串＝用內嵌的 RELAX_GAMES；否則讀 baseUrl + 檔名
    rewards: {},              // { chest: function(ctx){return '說明文字'}, stage: function(ctx){...} }
    canTrigger: null,         // function(){return true}；回傳 false 時先不出現（計數保留）
    onStart: null,            // 休息開始（遊戲請在這裡暫停答題計時）
    onEnd: null               // 休息結束（遊戲請在這裡恢復計時、顯示下一題）
  };

  var cfg = null;
  var st = { count: 0, streak: 0, prog: { wins: 0, day: '', plays: 0 }, active: false, cur: null, drawStreak: 0, lastGame: null, inventory: { chest: 0, stage: 0 } };
  var ui = null;

  /* ---------- 累積勝場／每日回數（存在瀏覽器 localStorage）---------- */
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function loadProg() {
    var p = { wins: 0, day: today(), plays: {}, games: {} };
    try {
      var s = JSON.parse(localStorage.getItem(cfg.storageKey) || 'null');
      if (s && typeof s === 'object') {
        p.wins = +s.wins || 0;
        if (s.day === today() && s.plays && typeof s.plays === 'object') Object.keys(s.plays).forEach(function (k) { p.plays[k] = +s.plays[k] || 0; });
        if (s.games && typeof s.games === 'object') Object.keys(s.games).forEach(function (k) { var g = s.games[k] || {}; p.games[k] = { p: +g.p || 0, w: +g.w || 0, b: +g.b || 0 }; });
      }
    } catch (e) {}
    return p;
  }
  function saveProg() { try { localStorage.setItem(cfg.storageKey, JSON.stringify(st.prog)); } catch (e) {} }
  function dayRoll() { var t = today(); if (st.prog.day !== t) { st.prog.day = t; st.prog.plays = {}; saveProg(); } }
  function gstat(id) { return st.prog.games[id] || { p: 0, w: 0, b: 0 }; }
  function recordResult(id, won) {            // 每一局的最後結果（贏／輸）才記；平手重玩、放棄不記
    var g = st.prog.games[id] || (st.prog.games[id] = { p: 0, w: 0, b: 0 });
    g.p++; if (won) { g.w++; st.prog.wins++; }
    saveProg();
  }
  function isUnlocked(id) { return cfg.unlockWins > 0 && gstat(id).w >= cfg.unlockWins; }
  /* 電腦強度：d 介於 0～1，由「這款」的勝場數和勝率決定；0 分＝最簡單。
     d = min(1, 勝場/12) × (0.5 + 0.5×勝率)；d<0.3 簡單、<0.7 普通、否則困難；另外給一點起始失誤率（0.3×(1-d)），讓一開始更好贏 */
  function difficulty(id) {
    if (!cfg.adaptive) return { level: cfg.level, err: 0, d: null };
    var g = gstat(id), rate = g.p ? g.w / g.p : 0;
    var d = Math.min(1, g.w / 12) * (0.5 + 0.5 * rate);
    return { level: d < 0.3 ? 'easy' : (d < 0.7 ? 'normal' : 'hard'), err: Math.round(0.3 * (1 - d) * 100) / 100, d: d };
  }
  function progress() {
    dayRoll();
    var ids = REGISTRY.map(function (r) { return r.id; }), un = ids.filter(isUnlocked), left = {};
    ids.forEach(function (id) { left[id] = Math.max(0, cfg.dailyLimit - (st.prog.plays[id] || 0)); });
    return { need: cfg.unlockWins, unlockedIds: un, games: st.prog.games, wins: st.prog.wins,
             plays: st.prog.plays, limit: cfg.dailyLimit, left: left };
  }

  /* ---------- 小工具 ---------- */
  function $el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function pickOne(a) { return a[Math.floor(Math.random() * a.length)]; }
  function findGame(id) { for (var i = 0; i < REGISTRY.length; i++) if (REGISTRY[i].id === id) return REGISTRY[i]; return null; }

  function allowedPairs() {
    var g = cfg.games, out = {};
    REGISTRY.forEach(function (r) {
      var vs = r.variants.filter(function (v) { return !v.solo; }).map(function (v) { return v.id; });
      if (g == null) { out[r.id] = vs; return; }
      if (Array.isArray(g)) { if (g.indexOf(r.id) >= 0) out[r.id] = vs; return; }
      if (Object.prototype.hasOwnProperty.call(g, r.id)) {
        var want = g[r.id];
        out[r.id] = (want && want.length) ? vs.filter(function (v) { return want.indexOf(v) >= 0; }) : vs;
      }
    });
    Object.keys(out).forEach(function (k) { if (!out[k].length) delete out[k]; });
    return out;
  }

  function pickGame(forceGame, forceVariant) {
    var ok = allowedPairs(), ids = Object.keys(ok);
    if (!ids.length) return null;
    var gid = forceGame && findGame(forceGame) ? forceGame : null;
    if (!gid) {
      var pool = ids.length > 1 ? ids.filter(function (x) { return x !== st.lastGame; }) : ids;  // 盡量不連續出同一款
      gid = pickOne(pool);
    }
    var vlist = ok[gid] || findGame(gid).variants.filter(function (v) { return !v.solo; }).map(function (v) { return v.id; });
    var vid = (forceVariant && vlist.indexOf(forceVariant) >= 0) ? forceVariant : pickOne(vlist);
    return { game: gid, variant: vid };
  }

  function pickRewardType() {
    if (cfg.rewardMode === 'chest') return 'chest';
    if (cfg.rewardMode === 'stage') return 'stage';
    return Math.random() < cfg.chestWeight ? 'chest' : 'stage';
  }

  function currentErr() { return Math.min(cfg.errMax, st.drawStreak * cfg.errStep); }

  /* ---------- 畫面 ---------- */
  var CSS = '.rb-ov{position:fixed;inset:0;z-index:2147483000;background:rgba(10,8,24,.88);display:flex;align-items:center;justify-content:center;padding:10px;font-family:"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif;color:#fff}' +
    '.rb-card{background:#2b2150;border:2px solid #7a64e8;border-radius:18px;padding:20px 22px;max-width:420px;width:100%;max-height:94vh;overflow:auto;text-align:center;line-height:1.7;box-shadow:0 10px 40px #000a}' +
    '.rb-card h2{margin:4px 0 6px;font-size:26px;color:#ffd84d}' +
    '.rb-card .rb-big{font-size:46px;line-height:1.2}' +
    '.rb-card .rb-game{font-size:20px;font-weight:bold;margin:6px 0 2px}' +
    '.rb-card .rb-var{opacity:.85;margin:0 0 6px}' +
    '.rb-card .rb-rule{font-size:15px;background:#00000033;border-radius:10px;padding:8px 12px;margin:8px 0;text-align:left}' +
    '.rb-card .rb-rw{color:#ffe08a;font-size:16px;margin:8px 0}' +
    '.rb-btn{font-family:inherit;font-size:18px;font-weight:bold;border:0;border-radius:12px;padding:10px 26px;margin:6px 4px 0;cursor:pointer;background:#ffb703;color:#3a2200}' +
    '.rb-btn:active{transform:scale(.96)}.rb-btn.gray{background:#5d5290;color:#fff;font-size:15px;padding:8px 16px}' +
    '.rb-card.wide{max-width:560px}.rb-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}' +
    '.rb-tile{background:#3a2f6e;border:2px solid #7a64e8;border-radius:12px;padding:8px 6px;color:#fff;font-family:inherit;cursor:pointer;text-align:center;line-height:1.35}' +
    '.rb-tile .e{font-size:30px;display:block}.rb-tile b{display:block;font-size:15px}.rb-tile small{display:block;font-size:12px;opacity:.9}' +
    '.rb-tile.lock{filter:grayscale(1);opacity:.6;border-color:#666}.rb-tile.full{opacity:.7;border-style:dashed}' +
    '.rb-wrap{width:min(100%,640px);height:min(100%,900px);display:flex;flex-direction:column;gap:6px}' +
    '.rb-bar{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:15px}' +
    '.rb-frame{flex:1;width:100%;border:3px solid #7a64e8;border-radius:12px;background:#111}';

  function mount() {
    if (ui) return;
    if (!document.getElementById('rb-style')) { var s = $el('style'); s.id = 'rb-style'; s.textContent = CSS; document.head.appendChild(s); }
    ui = $el('div', 'rb-ov');
    document.body.appendChild(ui);
  }
  function unmount() { if (ui && ui.parentNode) ui.parentNode.removeChild(ui); ui = null; }

  function showCard(html, buttons) {
    mount();
    ui.innerHTML = '';
    var card = $el('div', 'rb-card', html);
    (buttons || []).forEach(function (b) {
      var btn = $el('button', 'rb-btn' + (b.gray ? ' gray' : ''), b.text);
      btn.addEventListener('click', b.fn);
      card.appendChild(btn);
    });
    ui.appendChild(card);
  }

  function gameInfo() { var g = findGame(st.cur.game); var v = g.variants.filter(function (x) { return x.id === st.cur.variant; })[0]; return { g: g, v: v }; }

  function backText() { return st.cur && st.cur.zone ? '回遊戲區' : '回去答題'; }

  function showIntro() {
    var gi = gameInfo(), rl = st.cur.rewardType ? cfg.rewardLabels[st.cur.rewardType] : '';
    var rwLine = st.cur.rewardType ? '<div class="rb-rw">🎁 贏了就可以拿到「' + rl + '」！</div>' : '<div class="rb-rw">🎮 自由玩一局，沒有獎勵</div>';
    showCard('<div class="rb-big">🎮</div><h2>' + (st.cur.zone ? '遊戲解鎖區' : '休息一下！') + '</h2>' +
      '<div class="rb-game">' + gi.g.emoji + ' ' + gi.g.name + '</div><div class="rb-var">' + gi.v.label + '（約 ' + (gi.g.timeText || (gi.g.mins + ' 分鐘')) + '）</div>' +
      '<div class="rb-rule">' + (gi.v.rule || gi.g.rule) + '</div>' +
      rwLine,
      [{ text: '開始挑戰', fn: startRound }].concat(cfg.allowSkip ? [{ text: st.cur.zone ? '先不玩，回遊戲區' : '先不玩，回去答題', gray: true, fn: function () { finish('skip'); } }] : []));
  }

  function startRound() {
    var gi = gameInfo();
    mount();
    ui.innerHTML = '';
    var wrap = $el('div', 'rb-wrap');
    var bar = $el('div', 'rb-bar', '<b>' + gi.g.emoji + ' ' + gi.g.name + '・' + gi.v.label + '</b>');
    if (cfg.allowSkip) {
      var give = $el('button', 'rb-btn gray', st.cur.zone ? '放棄，回遊戲區' : '放棄，回去答題');
      give.addEventListener('click', function () { finish('giveup'); });
      bar.appendChild(give);
    }
    var dif = difficulty(st.cur.game);
    var params = new URLSearchParams({ embed: '1', id: st.cur.token, v: st.cur.variant, lv: dif.level, err: String(Math.min(cfg.errMax, Math.max(dif.err, currentErr()))) });
    var f = $el('iframe', 'rb-frame');
    f.setAttribute('allow', 'autoplay');
    f.name = 'RB:' + params.toString();            // 遊戲從 window.name 讀設定（srcdoc 沒有網址參數）
    if (cfg.baseUrl) f.src = cfg.baseUrl.replace(/\/?$/, '/') + gi.g.file + '?' + params.toString();
    else if (global.RELAX_GAMES && global.RELAX_GAMES[gi.g.id]) f.srcdoc = global.RELAX_GAMES[gi.g.id];
    else { showCard('<h2>😵 小遊戲檔案沒載入</h2><p>請確認有放 relax-break.bundle.js（或設定 baseUrl）。</p>', [{ text: '回去答題', fn: function () { finish('error'); } }]); return; }
    wrap.appendChild(bar); wrap.appendChild(f); ui.appendChild(wrap);
    st.cur.frame = f;
    setTimeout(function () { try { f.focus(); f.contentWindow.focus(); } catch (e) {} }, 250);
  }

  function recordBest(id, info) {            // 最佳成績（只有 REGISTRY 有 best 的遊戲才記）
    var g = findGame(id), v = parseFloat(info);
    if (!g || !g.best || !(v >= 0)) return null;
    if (g.best.solo && st.cur.variant !== 'solo') return null;
    var s = st.prog.games[id] || (st.prog.games[id] = { p: 0, w: 0, b: 0 });
    var old = s.b || 0, isNew = v > old;
    if (isNew) { s.b = v; saveProg(); }
    return { v: v, isNew: isNew, old: old, unit: g.best.unit };
  }
  function bestLine(br) {
    if (!br) return '';
    return '<div class="rb-rw">' + (br.isNew ? '🌟 新紀錄！' : '🏅 ') + '這次 ' + br.v + ' ' + br.unit + (br.isNew ? (br.old ? '（原本 ' + br.old + ' ' + br.unit + '）' : '') : '　最佳 ' + br.old + ' ' + br.unit) + '</div>';
  }
  function onResult(result, info) {
    st.cur.frame = null;
    if (result === 'win' || result === 'lose') recordResult(st.cur.game, result === 'win');
    var br = (result === 'score' || result === 'win' || result === 'lose' || result === 'draw') ? recordBest(st.cur.game, info) : null;
    if (result === 'score') {
      showCard('<div class="rb-big">🧗</div><h2>挑戰結束！</h2><div class="rb-game">' + findGame(st.cur.game).emoji + ' ' + findGame(st.cur.game).name + '</div>' + bestLine(br),
        [{ text: backText(), fn: function () { finish('score'); } }]);
      return;
    }
    if (result === 'win' && st.cur.practice) {
      showCard('<div class="rb-big">🏆</div><h2>你贏了！</h2><p>太厲害了！</p>' + bestLine(br), [{ text: backText(), fn: function () { finish('win'); } }]);
    } else if (result === 'win') {
      var type = st.cur.rewardType, text = '', fn = cfg.rewards && cfg.rewards[type];
      try { if (typeof fn === 'function') text = fn({ game: st.cur.game, variant: st.cur.variant, type: type }) || ''; } catch (e) { if (global.console) console.error(e); }
      if (typeof fn !== 'function') { st.inventory[type]++; text = text || '（這款遊戲還沒接上獎勵，先記在 RelaxBreak.state.inventory）'; }
      st.cur.rewardText = text;
      var unlockLine = '';
      if (cfg.unlockWins > 0) {
        var gw = gstat(st.cur.game).w, gn = findGame(st.cur.game).name;
        unlockLine = gw === cfg.unlockWins ? '<div class="rb-rw">🔓 「' + gn + '」贏電腦 ' + cfg.unlockWins + ' 次，解鎖了！以後可以在首頁「遊戲區」直接玩' + (findGame(st.cur.game).best && findGame(st.cur.game).best.solo ? '，而且會變成單人挑戰，看你能爬多深！' : '。') + '</div>'
                   : gw < cfg.unlockWins ? '<div class="rb-rw">🔓 「' + gn + '」贏電腦 ' + gw + '／' + cfg.unlockWins + ' 次，再贏 ' + (cfg.unlockWins - gw) + ' 次就能在遊戲區直接玩</div>' : '';
      }
      showCard('<div class="rb-big">🏆</div><h2>你贏了！</h2><div class="rb-rw">🎁 獲得「' + cfg.rewardLabels[type] + '」</div>' + bestLine(br) + (text ? '<div class="rb-rule">' + text + '</div>' : '') + unlockLine,
        [{ text: '回去答題', fn: function () { finish('win'); } }]);
    } else if (result === 'draw') {
      st.drawStreak++;
      showCard('<div class="rb-big">🤝</div><h2>平手！</h2><p>勢均力敵，再玩一次決勝負！</p>',
        [{ text: '再玩一次', fn: startRound }].concat(cfg.allowSkip ? [{ text: st.cur.zone ? '不玩了，回遊戲區' : '不玩了，回去答題', gray: true, fn: function () { finish('giveup'); } }] : []));
    } else {
      showCard('<div class="rb-big">😅</div><h2>這次沒贏…</h2><p>沒關係，下次再挑戰！</p>' + bestLine(br), [{ text: backText(), fn: function () { finish('lose'); } }]);
    }
  }

  function finish(result) {
    var cur = st.cur;
    unmount();
    st.active = false; st.cur = null; st.drawStreak = 0;
    if (cur) st.lastGame = cur.game;
    var info = cur ? { result: result, game: cur.game, variant: cur.variant, rewardType: result === 'win' ? cur.rewardType : null, rewardText: cur.rewardText || '', zone: !!cur.zone } : { result: result };
    if (cur && cur.zone && result === 'skip') { st.prog.plays[cur.game] = Math.max(0, (st.prog.plays[cur.game] || 0) - 1); saveProg(); }  // 還沒開始玩就返回：不扣次數
    if (typeof cfg.onEnd === 'function') { try { cfg.onEnd(info); } catch (e) { if (global.console) console.error(e); } }
    if (cur && cur.zone) zoneCard();
  }

  /* ---------- 遊戲解鎖區 ---------- */
  function closeZone() { unmount(); }
  function bestText(id) {
    var g = findGame(id), s = gstat(id), t = '';
    if (g.best) t = '🏅 最佳 ' + (s.b > 0 ? s.b + ' ' + g.best.unit : '—') + '　';
    return t + (s.p ? s.w + ' 勝／' + s.p + ' 局' : '還沒玩過');
  }
  function zoneList() { var ok = allowedPairs(); return REGISTRY.filter(function (r) { return ok[r.id]; }); }
  function gameDetail(id) {
    var g = findGame(id), p = progress(), s = gstat(id), un = isUnlocked(id);
    var status = un ? '🔓 已解鎖・今天剩 ' + p.left[id] + ' 回' : '🔒 同一款贏電腦 ' + p.need + ' 次解鎖（目前 ' + Math.min(s.w, p.need) + '／' + p.need + '）';
    var solo = g.best && g.best.solo ? '<div class="rb-rule">🔓 解鎖後會變成<b>單人挑戰</b>：層數越多速度越快，比誰爬得最深。</div>' : '';
    showCard('<div class="rb-big">' + g.emoji + '</div><h2>' + g.name + '</h2><div class="rb-var">' + status + '</div>' +
      '<div class="rb-rule">' + g.rule + '</div>' + solo + '<div class="rb-rw">' + bestText(id) + '</div>',
      [{ text: '回圖鑑', fn: zoneCard }]);
  }
  function zoneCard() {
    var p = progress(), list = zoneList(), nUn = list.filter(function (r) { return isUnlocked(r.id); }).length;
    mount(); ui.innerHTML = '';
    var card = $el('div', 'rb-card wide', '<div class="rb-big">📖</div><h2>遊戲圖鑑</h2><p>同一款贏電腦 <b>' + p.need + '</b> 次就解鎖，解鎖後每一款每天可以玩 <b>' + p.limit + '</b> 回。<br>已解鎖 <b>' + nUn + '</b>／' + list.length + ' 款（點一下可看玩法）</p>');
    var grid = $el('div', 'rb-grid');
    list.forEach(function (r) {
      var un = isUnlocked(r.id), left = p.left[r.id], s = gstat(r.id);
      var status = un ? (left > 0 ? '🔓 剩 ' + left + ' 回' : '😴 今天玩滿') : '🔒 贏 ' + Math.min(s.w, p.need) + '／' + p.need;
      var b = $el('button', 'rb-tile' + (un ? (left > 0 ? '' : ' full') : ' lock'), '<span class="e">' + r.emoji + '</span><b>' + r.name + '</b><small>' + status + '</small><small>' + bestText(r.id) + '</small>');
      b.addEventListener('click', function () { if (un && left > 0) beginZone(r.id); else gameDetail(r.id); });
      grid.appendChild(b);
    });
    card.appendChild(grid);
    var c = $el('button', 'rb-btn gray', '關閉'); c.addEventListener('click', closeZone); card.appendChild(c);
    ui.appendChild(card);
  }
  function beginZone(id) {
    dayRoll();
    if ((st.prog.plays[id] || 0) >= cfg.dailyLimit) { zoneCard(); return; }
    st.prog.plays[id] = (st.prog.plays[id] || 0) + 1; saveProg();
    begin(id, null, { practice: true, zone: true });
  }

  function begin(forceGame, forceVariant, opts) {
    opts = opts || {};
    var p = pickGame(forceGame, forceVariant);
    if (!p) return false;
    if (opts.zone) { var gg = findGame(p.game); if (gg && gg.variants.some(function (v) { return v.solo; })) p.variant = 'solo'; }
    st.active = true; st.drawStreak = 0;
    st.cur = { game: p.game, variant: p.variant, practice: !!opts.practice, zone: !!opts.zone, rewardType: opts.practice ? null : pickRewardType(), token: 'rb' + Date.now() + Math.floor(Math.random() * 1000), frame: null };
    if (typeof cfg.onStart === 'function') { try { cfg.onStart({ game: p.game, variant: p.variant }); } catch (e) { if (global.console) console.error(e); } }
    showIntro();
    return true;
  }

  /* ---------- 公開介面 ---------- */
  var RelaxBreak = {
    REGISTRY: REGISTRY,
    state: st,
    init: function (opts) {
      cfg = {}; var k;
      for (k in DEFAULTS) cfg[k] = DEFAULTS[k];
      for (k in (opts || {})) cfg[k] = opts[k];
      cfg.rewardLabels = Object.assign({}, DEFAULTS.rewardLabels, (opts && opts.rewardLabels) || {});
      st.count = 0; st.streak = 0; st.prog = loadProg();
      return RelaxBreak;
    },
    /** 學生每答完一題、準備進入下一題前呼叫。回傳 true＝休息開始了（請先別出下一題，等 onEnd 再出）。 */
    answered: function (correct) {
      if (!cfg) RelaxBreak.init({});
      if (!cfg.enabled || st.active) return false;
      if (correct) st.streak++; else st.streak = 0;
      if (cfg.countCorrectOnly) { if (correct) st.count++; else st.count = 0; }
      else st.count++;
      var hitStreak = cfg.streak > 0 && st.streak >= cfg.streak;
      if (st.count < cfg.every && !hitStreak) return false;
      if (typeof cfg.canTrigger === 'function' && !cfg.canTrigger()) return false;  // 計數保留，下一題再試
      st.count = 0; st.streak = 0;
      return begin();
    },
    /** 手動觸發（測試或老師端按鈕）；可指定遊戲與玩法。 */
    trigger: function (game, variant) { if (!cfg) RelaxBreak.init({}); if (st.active) return false; return begin(game, variant); },
    reset: function () { st.count = 0; st.streak = 0; },
    /** 中途改設定（例如依年級換遊戲清單、電腦強度）：RelaxBreak.configure({games:{...}, level:'easy'}) */
    configure: function (o) { if (!cfg) RelaxBreak.init({}); for (var k in (o || {})) cfg[k] = o[k]; return RelaxBreak; },
    /** 打開「遊戲解鎖區」：沒解鎖顯示還差幾次；解鎖後依 games 清單列出可玩的遊戲，每天最多 dailyLimit 回 */
    openZone: function () { if (!cfg) RelaxBreak.init({}); if (st.active) return false; zoneCard(); return true; },
    progress: function () { if (!cfg) RelaxBreak.init({}); return progress(); },
    get active() { return st.active; }
  };

  // 休息中：擋掉外層遊戲的鍵盤快捷鍵（iframe 內的按鍵不受影響）
  global.addEventListener('keydown', function (e) {
    if (!st.active) return;
    e.stopImmediatePropagation();
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].indexOf(e.key) >= 0) e.preventDefault();
  }, true);

  global.addEventListener('message', function (e) {
    var d = e.data;
    if (!st.active || !st.cur || !st.cur.frame || !d || d.source !== 'relax' || d.type !== 'result') return;
    if (e.source !== st.cur.frame.contentWindow || d.id !== st.cur.token) return;
    onResult(d.result, d.info);
  });

  global.RelaxBreak = RelaxBreak;
})(window);
