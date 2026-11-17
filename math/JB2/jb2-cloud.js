/* jb2-cloud.js — JB2 用 Google 登入的「雲端存檔」（換電腦／換平板可以接著玩）
 *
 * 流程：
 *  1. 第一次進總地圖：跳出提醒「要用 Google 登入保存進度嗎？」（選「以後再說」7 天內不再問）；
 *     總地圖上方的「☁️ 雲端」按鈕隨時可以登入、同步、登出。
 *  2. 登入後：自動存檔（進入遊戲、每 3 分鐘、離開頁面時有變動才存）。
 *  3. 換一台裝置登入：雲端有存檔、這台沒進度 → 問要不要載入；兩邊都有進度且不一樣 → 讓學生選「用雲端的／用這台的」。
 * 防竄改：
 *  - 資料表學生端「不能直接寫」，只能呼叫雲端函式 jb2_cloud_save（雲端伺服器會檢查格式、星數上限、
 *    經驗上限、數靈幣範圍，以及兩次存檔之間「不可能增加那麼多」，可疑的直接擋下並記錄）。
 *  - 一個 Google 帳號只能綁一個學號、一個學號只能被一個 Google 帳號綁。
 *  - 載入雲端存檔時，先通過 jb2-seal.js 的 checkSnapshot 檢查，再寫入（跟「存檔碼還原」同一條路）。
 * 設定步驟見「Google登入設定說明.md」。總地圖用 JB2Cloud.init({ snapshot })；章節地圖加 data-quiet="1" 只做背景存檔。
 */
(function () {
  'use strict';
  if (window.JB2Cloud) return;
  /* ★ 開關：Google 登入設定完成（見「Google登入設定說明.md」）之後，把 false 改成 true 才會對學生顯示。 */
  var ENABLED = false;
  var URL_ = 'https://qkejjznejmxcfiyxviid.supabase.co';
  var PUB = 'sb_publishable_ws6oQhzsjjgNv-tqhmPHtg_JCWHxZ72';           // 公開金鑰（設計給前端用的）
  var SDK = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
  var AUTH_KEY = 'sb-qkejjznejmxcfiyxviid-auth-token', ST = 'jb2-cloud-v1', HUB = 'jb2-hub-v1', ACTIVE = 'keyagent_active_student';
  var me = document.currentScript, QUIET = !!(me && me.getAttribute('data-quiet'));
  var host = { snapshot: null }, sb = null, sbP = null, busy = false, lastSent = '', timer = null, started = false;

  function rd(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function wr(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function st() { return rd(ST) || {}; }
  function setSt(p) { var o = st(); for (var k in p) o[k] = p[k]; wr(ST, o); }
  function hasSession() { try { return !!localStorage.getItem(AUTH_KEY); } catch (e) { return false; } }
  function activeNo() {
    try { if (window.JB2Sync && JB2Sync.activeNo) { var a = JB2Sync.activeNo(); if (a) return String(a); } } catch (e) {}
    var o = rd(ACTIVE); return o && o.studentNumber ? String(o.studentNumber) : '';
  }

  /* ---------- Supabase ---------- */
  function client() {
    if (sbP) return sbP;
    sbP = new Promise(function (res, rej) {
      function make() {
        try {
          sb = window.supabase.createClient(URL_, PUB, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
          res(sb);
        } catch (e) { rej(e); }
      }
      if (window.supabase && window.supabase.createClient) return make();
      var s = document.createElement('script'); s.src = SDK; s.onload = make; s.onerror = function () { sbP = null; rej(new Error('sdk')); };
      document.head.appendChild(s);
    });
    return sbP;
  }
  function session() { return client().then(function (c) { return c.auth.getSession(); }).then(function (r) { return r && r.data && r.data.session; }); }

  /* ---------- 資料 ---------- */
  function snap() {
    if (host.snapshot) { try { return host.snapshot(); } catch (e) {} }
    var o = { v: 1, hub: rd(HUB) || {}, ch: {} }, n; for (n = 1; n <= 6; n++) o.ch[n] = rd('monster-ch' + n + '-progress-v1') || {};
    return o;
  }
  function strip(sn) { var o = JSON.parse(JSON.stringify(sn)); delete o.at; return o; }
  function starsOf(sn) {
    var t = 0, n, k, s; for (n in (sn.ch || {})) for (k in sn.ch[n]) { if (k.charAt(0) === '_') continue; s = sn.ch[n][k]; t += (s && s.stars | 0) || 0; }
    return t;
  }
  function hasProgress(sn) {
    var n, k, s; for (n in (sn.ch || {})) for (k in sn.ch[n]) { if (k.charAt(0) === '_') continue; s = sn.ch[n][k]; if (s && ((s.stars | 0) > 0 || (s.tries | 0) > 0)) return true; }
    return false;
  }
  function when(t) { try { var d = new Date(t); return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); } catch (e) { return ''; } }
  function mask(e) { e = String(e || ''); var i = e.indexOf('@'); return i > 2 ? e.slice(0, 2) + '***' + e.slice(i) : e; }

  /* 把雲端存檔寫回這台（跟「用存檔碼還原」同一條路：先檢查，再寫入，最後重新整理） */
  function apply(sn, sid) {
    var why = ''; try { why = window.JB2Seal ? JB2Seal.checkSnapshot(sn) : '防護程式沒有載入'; } catch (e) { why = '檢查失敗'; }
    if (why) { toast('雲端的存檔沒有通過檢查，沒有載入（' + why + '）'); return false; }
    try { if (!activeNo() && window.JB2Sync && JB2Sync.setNo) JB2Sync.setNo(sid); } catch (e) {}
    var n; for (n = 1; n <= 6; n++) if (sn.ch && sn.ch[n]) wr('monster-ch' + n + '-progress-v1', sn.ch[n]);
    if (sn.hub) wr(HUB, sn.hub);
    setSt({ last: Date.now() });
    setTimeout(function () { location.reload(); }, 300);
    return true;
  }

  /* ---------- 畫面 ---------- */
  var ov = null;
  function toast(m) { try { var t = document.getElementById('toast'); if (t) { t.textContent = m; t.style.display = 'block'; setTimeout(function () { t.style.display = 'none'; }, 3500); return; } } catch (e) {} if (!QUIET) alert(m); }
  function close() { if (ov && ov.parentNode) ov.parentNode.removeChild(ov); ov = null; }
  function dialog(icon, title, body, buttons) {                    // buttons：[[文字, 函式, 'ghost'?]…]
    if (QUIET) return;
    close();
    ov = document.createElement('div'); ov.setAttribute('role', 'dialog');
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147482000;background:#0b0f22ee;display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,"Noto Sans TC",sans-serif';
    var h = '<div style="max-width:400px;width:100%;background:#161a2e;border:2px solid #d2a24c;border-radius:16px;padding:20px;color:#f1e8d2;text-align:center"><div style="font-size:40px">' + icon + '</div>' +
      '<h2 style="margin:6px 0 8px;font-size:19px">' + title + '</h2><div style="font-size:14.5px;line-height:1.7;margin-bottom:12px">' + body + '</div><div class="jc-b" style="display:flex;flex-direction:column;gap:8px">';
    buttons.forEach(function (b, i) { h += '<button data-i="' + i + '" style="font-size:16px;font-weight:700;padding:10px 14px;border-radius:12px;cursor:pointer;' + (b[2] ? 'background:transparent;color:#f1e8d2;border:1px solid #3a4270' : 'background:#d2a24c;color:#2a1d05;border:0') + '">' + b[0] + '</button>'; });
    ov.innerHTML = h + '</div></div>'; document.body.appendChild(ov);
    ov.querySelector('.jc-b').onclick = function (e) { var b = e.target.closest('button'); if (b) { var f = buttons[+b.dataset.i][1]; if (f !== close) close(); if (f) f(); } };
  }

  /* ---------- 登入／登出 ---------- */
  function signIn() {
    client().then(function (c) {
      return c.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname, queryParams: { prompt: 'select_account' } } });
    }).then(function (r) { if (r && r.error) throw r.error; }).catch(function () { toast('登入功能暫時連不上，請稍後再試（如果在 LINE 或臉書裡面開的，請改用 Chrome／Safari）'); });
  }
  function signOut() {
    client().then(function (c) { return c.auth.signOut(); }).then(function () { setSt({ base: null, last: 0 }); lastSent = ''; toast('已登出，這台電腦的進度還在'); openMenu(); refreshBtn(); }).catch(function () {});
  }

  /* ---------- 同步 ---------- */
  function msgOf(r) {
    var e = r && r.err;
    if (e === 'student_mismatch') return '這個 Google 帳號已經綁定學號 ' + r.student_no + '，和這台電腦的學號不同，所以不能同步。學號填錯的話，請找老師。';
    if (e === 'student_taken') return '這個學號已經被另一個 Google 帳號綁定了。如果那不是你，請找老師處理。';
    if (e === 'invalid' || e === 'implausible') return '這次的進度被雲端擋下（資料看起來不正常），沒有存上去，老師會看到記錄。';
    if (e === 'student') return '還沒有學號，請先在遊戲裡輸入學號。';
    return '雲端存檔失敗，稍後會再試一次。';
  }
  function upload(sn, sid, force) {
    return client().then(function (c) { return c.rpc('jb2_cloud_save', { p_student: sid, p_data: sn, p_base: st().base || null, p_force: !!force }); })
      .then(function (r) { return r.error ? { ok: false, err: 'net' } : r.data; });
  }
  function choose(cloud, sn, sid) {                                  // 兩邊都有進度且不一樣：讓學生選
    var mine = starsOf(sn);
    dialog('☁️', '雲端和這台的進度不一樣', '雲端存檔：⭐ ' + cloud.stars + '（' + when(cloud.updated_at) + '）<br>這台電腦：⭐ ' + mine + '<br><span style="opacity:.8">選的那一份會蓋掉另一份，請看清楚喔。</span>',
      [['用雲端的（載入後重新整理）', function () { apply(cloud.data, sid) ? setSt({ base: cloud.updated_at }) : 0; }],
       ['用這台的（覆蓋雲端）', function () { upload(sn, sid, true).then(function (r) { if (r.ok) { setSt({ base: r.updated_at, last: Date.now() }); lastSent = JSON.stringify(strip(sn)); toast('已用這台的進度更新雲端'); } else toast(msgOf(r)); }); }, 'ghost'],
       ['先不要選', close, 'ghost']]);
  }
  /* manual＝學生按了「立即同步」（可以跳對話框）；否則只做安靜的背景存檔 */
  function sync(manual) {
    if (busy) return Promise.resolve(); busy = true;
    var sn = snap(), sid = activeNo(), cloud;
    return session().then(function (s) {
      if (!s) { busy = false; return; }
      return client().then(function (c) { return c.rpc('jb2_cloud_load'); }).then(function (r) {
        if (r.error || !r.data || r.data.ok === false) throw new Error('load');
        cloud = r.data;
        if (!cloud.exists) {
          if (!sid) { if (manual) toast('請先在遊戲裡輸入學號，再同步'); return; }
          return upload(sn, sid, false).then(function (u) { if (u.ok) { setSt({ base: u.updated_at, last: Date.now() }); lastSent = JSON.stringify(strip(sn)); if (manual) toast('☁️ 已把這台的進度存到雲端'); } else if (manual || u.err !== 'net') toast(msgOf(u)); });
        }
        if (sid && sid !== cloud.student_no) { dialog('⚠️', '學號不一樣', msgOf({ err: 'student_mismatch', student_no: cloud.student_no }), [['我知道了', close]]); return; }
        var same = JSON.stringify(strip(cloud.data)) === JSON.stringify(strip(sn));
        if (same) { setSt({ base: cloud.updated_at, last: Date.now() }); lastSent = JSON.stringify(strip(sn)); if (manual) toast('☁️ 已經是最新的'); return; }
        if (!hasProgress(sn)) {                                       // 這台是新的：問要不要載入雲端
          dialog('☁️', '找到你的雲端存檔', '學號 ' + cloud.student_no + '，⭐ ' + cloud.stars + '（' + when(cloud.updated_at) + '）。<br>要載入到這台嗎？',
            [['載入雲端存檔', function () { if (apply(cloud.data, cloud.student_no)) setSt({ base: cloud.updated_at }); }], ['先不要', close, 'ghost']]);
          return;
        }
        if (st().base && st().base === cloud.updated_at) {            // 雲端沒有別台更新：把這台的新進度存上去
          return upload(sn, sid, false).then(function (u) {
            if (u.ok) { setSt({ base: u.updated_at, last: Date.now() }); lastSent = JSON.stringify(strip(sn)); if (manual) toast('☁️ 已同步'); }
            else if (u.err === 'conflict') { if (manual) choose(cloud, sn, sid); else setSt({ needChoice: 1 }); }
            else if (manual || u.err !== 'net') toast(msgOf(u));
          });
        }
        if (manual || !QUIET) choose(cloud, sn, sid); else setSt({ needChoice: 1 });   // 從沒同步過、兩邊都有進度：一定要學生自己選
      });
    }).catch(function () { if (manual) toast('連不上雲端，請檢查網路'); }).then(function () { busy = false; refreshBtn(); });
  }
  function autosave() {
    if (!hasSession() || busy || st().needChoice) return;
    var sn = snap(), s = JSON.stringify(strip(sn)); if (s === lastSent || !activeNo()) return;
    busy = true;
    session().then(function (se) {
      if (!se) return; return upload(sn, activeNo(), false).then(function (u) {
        if (u.ok) { setSt({ base: u.updated_at, last: Date.now() }); lastSent = s; }
        else if (u.err === 'conflict') setSt({ needChoice: 1 });
      });
    }).catch(function () {}).then(function () { busy = false; refreshBtn(); });
  }

  /* ---------- 選單 ---------- */
  function openMenu() {
    if (QUIET || !ENABLED) return;
    if (!hasSession()) {
      dialog('☁️', '雲端存檔', '用 Google 登入，進度會自動存到雲端，<b>換電腦、換平板</b>也能接著玩。<br><span style="opacity:.8;font-size:13px">只存遊戲進度，不存真名和電話。不登入也可以正常玩。</span>',
        [['用 Google 登入', signIn], ['先不要', close, 'ghost']]);
      return;
    }
    dialog('☁️', '雲端存檔', '載入中…', []);
    session().then(function (s) {
      if (!s) { close(); openMenu(); return; }
      var o = st();
      dialog('☁️', '雲端存檔已開啟', '登入帳號：' + mask(s.user && s.user.email) + '<br>學號：' + (activeNo() || '（尚未輸入）') + '<br>最後同步：' + (o.last ? when(o.last) : '尚未') + (o.needChoice ? '<br><b style="color:#ffb38a">雲端有另一台裝置的存檔，請按「立即同步」選擇要用哪一份</b>' : ''),
        [['立即同步', function () { setSt({ needChoice: 0 }); sync(true); }], ['登出', signOut, 'ghost'], ['關閉', close, 'ghost']]);
    }).catch(function () { close(); toast('連不上雲端'); });
  }
  function refreshBtn() {
    var b = document.getElementById('jbCloudBtn'); if (!b) return;
    b.textContent = hasSession() ? (st().needChoice ? '☁️ 需選擇' : '☁️ 已同步') : '☁️ 雲端';
  }
  function prompt_() {
    if (QUIET || hasSession()) return;
    var o = st(); if (o.dismissed && Date.now() - o.dismissed < 7 * 86400000) return;
    dialog('☁️', '要保存你的進度嗎？', '用 Google 登入後，進度會自動存到雲端，<b>換電腦、換平板</b>也能接著玩。<br><span style="opacity:.8;font-size:13px">不登入也可以玩；之後想登入，按上面的「☁️ 雲端」。</span>',
      [['用 Google 登入', signIn], ['以後再說', function () { setSt({ dismissed: Date.now() }); }, 'ghost']]);
  }

  function start() {
    if (started) return; started = true;
    if (!ENABLED) { var hb = document.getElementById('jbCloudBtn'); if (hb) hb.style.display = 'none'; return; }
    refreshBtn();
    if (hasSession()) {
      sync(false);
      timer = setInterval(autosave, 180000);
      document.addEventListener('visibilitychange', function () { if (document.hidden) autosave(); });
      window.addEventListener('pagehide', autosave);
    } else if (!QUIET) setTimeout(prompt_, 4000);
    if (/[?#&](code|access_token)=/.test(location.search + location.hash)) {       // 剛從 Google 登入回來：換好 session 後開始同步
      client().then(function (c) { return c.auth.getSession(); }).then(function () {
        try { history.replaceState(null, '', location.pathname + location.search.replace(/[?&]code=[^&]*/, '').replace(/^&/, '?')); } catch (e) {}
        refreshBtn(); sync(true); if (!timer) timer = setInterval(autosave, 180000);
      }).catch(function () {});
    }
  }

  window.JB2Cloud = { init: function (o) { if (o && o.snapshot) host.snapshot = o.snapshot; start(); }, open: openMenu, sync: sync, _apply: apply, _starsOf: starsOf };
  if (QUIET) { if (document.readyState === 'complete') setTimeout(start, 3000); else window.addEventListener('load', function () { setTimeout(start, 3000); }); }
})();
