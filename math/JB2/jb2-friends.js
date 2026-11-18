/* jb2-friends.js — 好友（看誰在線上）＋參觀好友小屋。
 * 資料放在 Supabase（跟學號對戰同一個專案），需要先執行 JB2-好友與小屋-Supabase.sql 建表。
 * 安全設計：只顯示「勇者名＋學號」，沒有聊天、沒有自由輸入文字；加好友要對方按同意；老師可以全校關閉或封鎖個別學號。
 * 「在線上」＝最近 100 秒內有「報到」（每 45 秒自動報到一次，時間由資料庫自己算，不怕電腦時鐘不準）。
 */
(function () {
  'use strict';
  var URL_ = 'https://qkejjznejmxcfiyxviid.supabase.co';
  var KEY_ = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZWpqem5lam14Y2ZpeXh2aWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MjYyODQsImV4cCI6MjEwNjEwMjI4NH0.TBzTQ98emolzRoPaBDDGRpTW8ZkDCGoOstUTfmcrWco';
  var Hub = null, sb = null, cfg = null, cfgAt = 0, st = null, list = [], refT = 0, busy = false, lastErr = '', pairCode = '';
  var MAX_FRIENDS = 30, TK = 'jb2-device-token-v1';

  function client() {
    if (sb) return sb;
    try { if (window.supabase) sb = window.supabase.createClient(URL_, KEY_); } catch (e) {}
    return sb;
  }
  var sid = function () { return String((Hub.H.who && Hub.H.who.no) || '').trim(); };
  var esc = function (s) { return Hub.esc(s); };
  /* 裝置暗號：這台裝置自己產生、只存在這台裝置，學生不用記。清除瀏覽器資料就會消失（要請老師重設或用配對碼）。 */
  function token() {
    try {
      var t = localStorage.getItem(TK);
      if (!t || t.length < 16) { var a = new Uint8Array(16); crypto.getRandomValues(a); t = Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); localStorage.setItem(TK, t); }
      return t;
    } catch (e) { return window.__jb2tok || (window.__jb2tok = String(Math.random()).slice(2) + String(Math.random()).slice(2) + 'abcdefgh'); }
  }
  function rpc(fn, args) { return client().rpc(fn, Object.assign({ p_sid: sid(), p_token: token() }, args || {})); }

  function loadCfg(force) {
    var c = client(); if (!c) return Promise.resolve(null);
    if (!force && cfg && Date.now() - cfgAt < 300000) return Promise.resolve(cfg);
    return c.rpc('jb2_settings_get').then(function (r) {
      if (r.error || !r.data) { lastErr = 'nosetup'; cfg = null; return null; }
      cfg = { friends: !!r.data.friends, visit: !!r.data.visit }; cfgAt = Date.now(); lastErr = ''; return cfg;
    }, function () { lastErr = 'net'; return null; });
  }
  var enabled = function () { return !!(cfg && cfg.friends && st === 'ok'); };

  function ping() {
    if (document.hidden || !sid() || !client()) return Promise.resolve();
    return loadCfg().then(function () {
      if (!cfg || !cfg.friends) return;
      return rpc('jb2_ping', { p_name: Hub.H.who.name || sid() }).then(function (r) { if (!r.error) st = r.data; }, function () {});
    });
  }
  function fetchList() {
    var c = client(); if (!c || !sid()) return Promise.resolve([]);
    return rpc('jb2_friend_list').then(function (r) {
      if (r.error || !r.data) { lastErr = 'nosetup'; return list; }
      st = r.data.status; list = st === 'ok' ? (r.data.friends || []) : []; listAt = Date.now(); updateBadge(); return list;
    }, function () { lastErr = 'net'; return list; });
  }
  var listAt = 0;
  function updateBadge() {
    var b = document.getElementById('friendB'); if (!b) return;
    var on = list.filter(function (f) { return f.status === 'ok' && f.online; }).length, req = list.filter(function (f) { return f.status === 'pending' && f.direction === 'in'; }).length;
    b.textContent = '👥 好友' + (on ? ' 🟢' + on : '') + (req ? ' 🔔' + req : '');
  }
  function ago(s) {
    s = +s; if (!isFinite(s)) return '還沒上線過';
    if (s < 100) return '剛剛';
    if (s < 3600) return Math.round(s / 60) + ' 分鐘前';
    if (s < 86400) return Math.round(s / 3600) + ' 小時前';
    return Math.round(s / 86400) + ' 天前';
  }

  /* ---------- 面板 ---------- */
  function panelHTML() {
    if (!sid()) return '<p>要先到「🏠 小屋 → 🖥️ 書桌」填好<b>學號</b>和<b>勇者名</b>，才能使用好友功能喔！</p>';
    if (lastErr === 'nosetup') return '<p>好友功能還沒準備好 🛠️<br><span class="muted">（老師需要先在 Supabase 執行「JB2-好友與小屋-Supabase.sql」）</span></p>';
    if (cfg && !cfg.friends) return '<p>老師暫時把好友功能關起來了，之後再來看看吧！</p>';
    if (st === 'blocked') return '<p>你的好友功能目前被老師暫停了，如果有疑問請找老師。</p>';
    if (st === 'taken') return '<p>這個學號已經綁定在<b>另一台裝置</b>了（這是為了避免別人冒用）。</p><p>👉 在<b>原本那台</b>裝置打開「👥 好友」，按「📱 新增另一台裝置」會得到 6 位數配對碼，輸入在這裡：</p><div class="row"><input type="text" id="frCode" maxlength="6" inputmode="numeric" style="width:110px"> <button class="btn small" data-fa="pairUse">✅ 配對</button></div><p class="muted">原本的裝置壞了或資料清除了？請老師幫你重設。</p>';
    if (!cfg || st !== 'ok') return '<p>連線中…（如果一直卡住，請檢查網路）</p>';
    var me = list.filter(function (f) { return f.status === 'ok'; }), inc = list.filter(function (f) { return f.status === 'pending' && f.direction === 'in'; }), out = list.filter(function (f) { return f.status === 'pending' && f.direction === 'out'; });
    var canV = Hub.owned('perm_visit') && cfg.visit;
    var h = '<p class="muted">你的學號：<b>' + esc(sid()) + '</b>　勇者名：<b>' + esc(Hub.H.who.name || '') + '</b>　（只有學號和勇者名會被好友看到，沒有聊天功能）</p>';
    h += '<div class="row" style="margin:8px 0">好友的學號 <input type="text" id="frNo" maxlength="12" style="width:130px"> <button class="btn small" data-fa="add">➕ 送出好友邀請</button></div>';
    if (inc.length) { h += '<h3 style="margin:10px 0 4px">🔔 想成為你好友的人</h3>'; inc.forEach(function (f) { h += '<div class="mis"><div><b>' + esc(f.name || f.friend) + '</b> <span class="muted">（' + esc(f.friend) + '）</span></div><div><button class="btn small" data-fa="ok" data-id="' + esc(f.friend) + '">✅ 同意</button> <button class="btn ghost small" data-fa="del" data-id="' + esc(f.friend) + '">❌ 拒絕</button></div></div>'; }); }
    h += '<h3 style="margin:10px 0 4px">👥 我的好友（' + me.length + '/' + MAX_FRIENDS + '）</h3>';
    if (!me.length) h += '<p class="muted">還沒有好友。把朋友的學號打進上面的格子，等他按同意就成功啦！</p>';
    me.sort(function (a, b) { return (b.online ? 1 : 0) - (a.online ? 1 : 0) || (a.secs_ago || 1e9) - (b.secs_ago || 1e9); });
    me.forEach(function (f) {
      h += '<div class="mis"><div>' + (f.online ? '🟢' : '⚪') + ' <b>' + esc(f.name || f.friend) + '</b> <span class="muted">（' + esc(f.friend) + '）' + (f.online ? '在線上' : ago(f.secs_ago)) + '</span></div><div>' +
        (canV ? '<button class="btn small" data-fa="visit" data-id="' + esc(f.friend) + '">🏠 參觀小屋</button> ' : '<button class="btn small" disabled title="到商店開通「串門子權」">🔒 參觀小屋</button> ') +
        '<button class="btn ghost small" data-fa="del" data-id="' + esc(f.friend) + '" title="刪除好友">💔</button></div></div>';
    });
    if (!Hub.owned('perm_visit')) h += '<p class="muted">想參觀好友的小屋，要先到商店「🔑 小屋權限」開通「🚪 串門子權」。</p>';
    if (cfg && !cfg.visit) h += '<p class="muted">老師暫時關閉了「參觀小屋」。</p>';
    if (out.length) { h += '<h3 style="margin:10px 0 4px">⏳ 等待對方同意</h3>'; out.forEach(function (f) { h += '<div class="mis"><div>' + esc(f.name || f.friend) + ' <span class="muted">（' + esc(f.friend) + '）</span></div><button class="btn ghost small" data-fa="del" data-id="' + esc(f.friend) + '">取消</button></div>'; }); }
    h += '<p class="muted" style="margin-top:10px">想跟好友對戰？到「⚔️ 鬥技場」輸入他的學號就可以了。每 45 秒會自動更新「誰在線上」。</p>';
    h += '<details style="margin-top:8px"><summary class="muted">⚙️ 我的資料與裝置</summary><p class="muted">雲端只存：學號、勇者名、最後上線時間、好友關係、你的小屋擺設。進度、金幣和存檔都只存在這台裝置。</p><p><button class="btn ghost small" data-fa="pairMake">📱 新增另一台裝置</button> <button class="btn ghost small" data-fa="delme">🗑️ 從雲端刪除我的資料</button></p>' + (pairCode ? '<p>配對碼：<b style="font-size:26px;letter-spacing:4px">' + esc(pairCode) + '</b><br><span class="muted">5 分鐘內，在另一台裝置打開「👥 好友」輸入這組數字。</span></p>' : '') + '</details>';
    return h;
  }
  function openPanel() {
    pairCode = '';
    Hub.setPanel(function () { Hub.openPanel('👥 好友', '<div class="frp">' + panelHTML() + '</div>', true); });
    Promise.all([loadCfg(true), ping().then(fetchList)]).then(function () { if (isOpen()) rerender(); });
    clearInterval(refT);
    refT = setInterval(function () { if (!isOpen()) { clearInterval(refT); return; } if (typing()) return; fetchList().then(function () { if (isOpen() && !typing()) rerender(); }); }, 20000);
  }
  var typing = function () { var a = document.activeElement; return a && (a.id === 'frNo' || a.id === 'frCode'); };
  var isOpen = function () { return !!document.querySelector('#pbox .frp') && document.getElementById('pnlOv').classList.contains('on'); };
  var rerender = function () { var f = document.querySelector('#pbox .frp'); if (f) f.innerHTML = panelHTML(); };
  var msg = function (m) { Hub.toast(m); };
  var again = function () { return fetchList().then(rerender); };

  function addFriend() {
    var inp = document.getElementById('frNo'), no = inp ? inp.value.trim() : '';
    if (!no) { msg('請輸入好友的學號'); return; }
    if (busy) return; busy = true;
    rpc('jb2_friend_add', { p_target: no }).then(function (r) {
      busy = false;
      var M = { ok: '邀請已送出，等對方同意！', self: '這是你自己的學號喔 😄', notfound: '找不到這位同學。要請他先打開 JB2 或保衛戰、登記好學號喔！', exists: '他已經在你的名單（或邀請中）了', full: '好友太多了，先整理一下吧', blocked_target: '這位同學暫時不能加好友', off: '老師暫時關閉了好友功能', taken: '這個學號綁定在另一台裝置' };
      msg(r.error ? '送出失敗，請再試一次' : (M[r.data] || '送出失敗')); if (!r.error && r.data === 'ok') again();
    }, function () { busy = false; msg('網路好像有問題，請再試一次'); });
  }
  function respond(a, other) {
    if (a !== 'ok' && !confirm('確定要刪除嗎？')) return;
    rpc('jb2_friend_respond', { p_other: other, p_accept: a === 'ok' }).then(function () { if (a === 'ok') msg('成為好友了！'); again(); });
  }
  function visitFriend(other) {
    if (!Hub.owned('perm_visit')) { msg('需要先開通「串門子權」'); return; }
    rpc('jb2_home_get', { p_target: other }).then(function (r) {
      var d = r.data || {}, M = { notfriend: '你們還不是好友', nohome: '他還沒有布置過小屋喔', off: '老師暫時關閉了參觀功能', taken: '這個學號綁定在另一台裝置' };
      if (r.error) { msg('讀取失敗，請再試一次'); return; }
      if (d.status !== 'ok') { msg(M[d.status] || '無法參觀'); return; }
      window.JB2Home.visit(d.home);
    }, function () { msg('網路好像有問題'); });
  }
  function pairMake() { rpc('jb2_pair_create').then(function (r) { if (r.error || !r.data) { msg('產生失敗，請再試一次'); return; } pairCode = r.data; rerender(); var d = document.querySelector('#pbox details'); if (d) d.open = true; }); }
  function pairUse() {
    var c = (document.getElementById('frCode').value || '').trim();
    if (!/^\d{6}$/.test(c)) { msg('請輸入 6 位數字'); return; }
    client().rpc('jb2_pair_use', { p_sid: sid(), p_code: c, p_token: token() }).then(function (r) {
      var M = { ok: '配對成功！', badcode: '配對碼不對或過期了，請回原本的裝置重新產生', toomany: '這個學號綁定的裝置太多了，請找老師', blocked: '你的好友功能被暫停了', bad: '配對失敗' };
      msg(r.error ? '配對失敗，請再試一次' : (M[r.data] || '配對失敗'));
      if (!r.error && r.data === 'ok') ping().then(function () { return again(); });
    });
  }
  function delMe() {
    if (!confirm('要把你在雲端的好友關係、小屋擺設和上線資料全部刪除嗎？\n（你的進度、金幣、存檔都在這台裝置，不會被刪。）')) return;
    rpc('jb2_delete_me').then(function (r) { if (r.error || r.data !== 'ok') { msg('刪除失敗，請再試一次'); return; } list = []; st = null; lastUp = ''; msg('已刪除。之後再打開好友功能，會重新登記。'); closeP(); });
  }
  var closeP = function () { try { Hub.closePanel(); } catch (e) {} };

  /* 把自己的小屋存到雲端（給好友參觀），有改動後 2.5 秒才送，避免一直寫 */
  var lastUp = '';
  function uploadHome() {
    if (!sid() || !client() || !enabled()) return;
    var snap = JSON.stringify(window.JB2Home.snapshot()) + JSON.stringify(Hub.H.eq); if (snap === lastUp) return; lastUp = snap;
    rpc('jb2_home_put', { p_name: Hub.H.who.name || sid(), p_eq: Hub.H.eq, p_layout: window.JB2Home.snapshot() }).then(function () {}, function () {});
  }

  function init(hub) {
    Hub = hub;
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-fa]'); if (!b) return;
      var a = b.dataset.fa;
      if (a === 'open') openPanel(); else if (a === 'add') addFriend(); else if (a === 'visit') visitFriend(b.dataset.id); else if (a === 'ok' || a === 'del') respond(a, b.dataset.id);
      else if (a === 'pairMake') pairMake(); else if (a === 'pairUse') pairUse(); else if (a === 'delme') delMe();
    });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) ping(); });
    setTimeout(function () { ping().then(fetchList).then(function () { if (enabled()) uploadHome(); }); }, 2500);
    setInterval(function () { ping(); }, 45000);
    setInterval(function () { if (!document.hidden && enabled()) fetchList(); }, 90000);
  }
  window.JB2Friends = { init: init, openPanel: openPanel, uploadHome: uploadHome };
})();
