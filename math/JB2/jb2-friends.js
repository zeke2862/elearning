/* jb2-friends.js — 好友（看誰在線上）＋參觀好友小屋。
 * 資料放在 Supabase（跟學號對戰同一個專案），需要先執行 JB2-好友與小屋-Supabase.sql 建表。
 * 安全設計：只顯示「勇者名＋學號」，沒有聊天、沒有自由輸入文字；加好友要對方按同意；老師可以全校關閉或封鎖個別學號。
 * 「在線上」＝最近 100 秒內有「報到」（每 45 秒自動報到一次，時間由資料庫自己算，不怕電腦時鐘不準）。
 */
(function () {
  'use strict';
  var URL_ = 'https://qkejjznejmxcfiyxviid.supabase.co';
  var KEY_ = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZWpqem5lam14Y2ZpeXh2aWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MjYyODQsImV4cCI6MjEwNjEwMjI4NH0.TBzTQ98emolzRoPaBDDGRpTW8ZkDCGoOstUTfmcrWco';
  var Hub = null, sb = null, cfg = null, cfgAt = 0, blocked = false, list = [], listAt = 0, pingT = 0, refT = 0, busy = false, lastErr = '';
  var MAX_FRIENDS = 30;

  function client() {
    if (sb) return sb;
    try { if (window.supabase) sb = window.supabase.createClient(URL_, KEY_); } catch (e) {}
    return sb;
  }
  var sid = function () { return String((Hub.H.who && Hub.H.who.no) || '').trim(); };
  var esc = function (s) { return Hub.esc(s); };

  /* 老師開關（jb2_settings）＋封鎖名單（jb2_blocked），5 分鐘看一次 */
  function loadCfg(force) {
    var c = client(); if (!c) return Promise.resolve(null);
    if (!force && cfg && Date.now() - cfgAt < 300000) return Promise.resolve(cfg);
    return Promise.all([
      c.from('jb2_settings').select('key,value'),
      sid() ? c.from('jb2_blocked').select('student_number').eq('student_number', sid()).maybeSingle() : Promise.resolve({ data: null })
    ]).then(function (r) {
      if (r[0].error) { lastErr = 'nosetup'; cfg = null; return null; }
      var m = {}; (r[0].data || []).forEach(function (x) { m[x.key] = x.value; });
      cfg = { friends: m.friends_enabled !== '0', visit: m.visit_enabled !== '0' };
      blocked = !!(r[1] && r[1].data); cfgAt = Date.now(); lastErr = '';
      return cfg;
    }).catch(function () { lastErr = 'net'; return null; });
  }
  var enabled = function () { return !!(cfg && cfg.friends && !blocked); };

  function ping() {
    if (document.hidden || !sid() || !client()) return;
    loadCfg().then(function () {
      if (!enabled()) return;
      sb.rpc('jb2_ping', { p_sid: sid(), p_name: Hub.H.who.name || sid() }).then(function () {}, function () {});
    });
  }

  function fetchList() {
    var c = client(); if (!c || !sid()) return Promise.resolve([]);
    return c.rpc('jb2_friend_list', { p_sid: sid() }).then(function (r) {
      if (r.error) { lastErr = 'nosetup'; return list; }
      list = r.data || []; listAt = Date.now(); updateBadge(); return list;
    }, function () { lastErr = 'net'; return list; });
  }
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
    if (lastErr === 'nosetup') return '<p>好友功能還沒準備好 🛠️<br><span class="muted">（老師需要先在 Supabase 執行「JB2-好友與小屋-Supabase.sql」建立資料表）</span></p>';
    if (cfg && !cfg.friends) return '<p>老師暫時把好友功能關起來了，之後再來看看吧！</p>';
    if (blocked) return '<p>你的好友功能目前被老師暫停了，如果有疑問請找老師。</p>';
    if (!cfg) return '<p>連線中…（如果一直卡住，請檢查網路）</p>';
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
    return h;
  }
  function openPanel() {
    Hub.setPanel(function () { Hub.openPanel('👥 好友', '<div class="frp">' + panelHTML() + '</div>', true); });
    Promise.all([loadCfg(true), fetchList()]).then(function () { if (isOpen()) rerender(); });
    clearInterval(refT);
    refT = setInterval(function () { if (!isOpen()) { clearInterval(refT); return; } if (document.activeElement && document.activeElement.id === 'frNo') return; fetchList().then(function () { if (isOpen() && !(document.activeElement && document.activeElement.id === 'frNo')) rerender(); }); }, 20000);
  }
  var isOpen = function () { return !!document.querySelector('#pbox .frp') && document.getElementById('pnlOv').classList.contains('on'); };
  var rerender = function () { var f = document.querySelector('#pbox .frp'); if (f) f.innerHTML = panelHTML(); };
  var msg = function (m) { Hub.toast(m); };

  function addFriend() {
    var inp = document.getElementById('frNo'), no = inp ? inp.value.trim() : '';
    if (!no) { msg('請輸入好友的學號'); return; }
    if (no === sid()) { msg('這是你自己的學號喔 😄'); return; }
    if (busy) return; busy = true;
    var c = client();
    if (list.length >= MAX_FRIENDS * 2) { busy = false; msg('好友太多了，先整理一下吧'); return; }
    if (list.some(function (f) { return f.friend === no; })) { busy = false; msg('他已經在你的名單（或邀請中）了'); return; }
    c.from('jb2_presence').select('student_number,name').eq('student_number', no).maybeSingle().then(function (r) {
      if (!r.data) { busy = false; msg('找不到這位同學。要請他先打開新版總地圖、填好學號喔！'); return; }
      return c.from('jb2_blocked').select('student_number').eq('student_number', no).maybeSingle().then(function (b) {
        if (b.data) { busy = false; msg('這位同學暫時不能加好友'); return; }
        return c.from('jb2_friends').insert({ a: sid(), b: no, status: 'pending' }).then(function (x) {
          busy = false; if (x.error) { msg('送出失敗，請再試一次'); return; }
          msg('邀請已送出，等 ' + (r.data.name || no) + ' 同意！'); return fetchList().then(rerender);
        });
      });
    }).catch(function () { busy = false; msg('網路好像有問題，請再試一次'); });
  }
  function respond(a, other) {
    var c = client();
    if (a === 'ok') return c.from('jb2_friends').update({ status: 'ok' }).eq('a', other).eq('b', sid()).then(function () { msg('成為好友了！'); return fetchList().then(rerender); });
    if (!confirm('確定要刪除嗎？')) return;
    return Promise.all([c.from('jb2_friends').delete().eq('a', sid()).eq('b', other), c.from('jb2_friends').delete().eq('a', other).eq('b', sid())]).then(function () { return fetchList().then(rerender); });
  }
  function visitFriend(other) {
    if (!Hub.owned('perm_visit')) { msg('需要先開通「串門子權」'); return; }
    if (!cfg || !cfg.visit) { msg('老師暫時關閉了參觀功能'); return; }
    var f = list.filter(function (x) { return x.friend === other && x.status === 'ok'; })[0]; if (!f) { msg('你們還不是好友'); return; }
    client().from('jb2_homes').select('student_number,name,eq,layout').eq('student_number', other).maybeSingle().then(function (r) {
      if (r.error) { msg('讀取失敗，請再試一次'); return; }
      if (!r.data) { msg('他還沒有布置過小屋喔'); return; }
      window.JB2Home.visit(r.data);
    }, function () { msg('網路好像有問題'); });
  }

  /* 把自己的小屋存到雲端（給好友參觀），有改動後 2.5 秒才送，避免一直寫 */
  var lastUp = '';
  function uploadHome() {
    if (!sid() || !client() || !enabled()) return;
    var snap = JSON.stringify(window.JB2Home.snapshot()) + JSON.stringify(Hub.H.eq); if (snap === lastUp) return; lastUp = snap;
    sb.from('jb2_homes').upsert({ student_number: sid(), name: Hub.H.who.name || sid(), eq: Hub.H.eq, layout: window.JB2Home.snapshot(), updated_at: new Date().toISOString() }).then(function () {}, function () {});
  }

  function init(hub) {
    Hub = hub;
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-fa]'); if (!b) return;
      var a = b.dataset.fa;
      if (a === 'open') openPanel(); else if (a === 'add') addFriend(); else if (a === 'visit') visitFriend(b.dataset.id); else if (a === 'ok' || a === 'del') respond(a, b.dataset.id);
    });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) ping(); });
    setTimeout(function () { ping(); fetchList().then(function () { if (enabled()) uploadHome(); }); }, 2500);
    pingT = setInterval(function () { ping(); }, 45000);
    setInterval(function () { if (!document.hidden && enabled()) fetchList(); }, 90000);
  }
  window.JB2Friends = { init: init, openPanel: openPanel, uploadHome: uploadHome };
})();
