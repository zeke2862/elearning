/* JB2 背景音樂播放器：換歌只要用同樣檔名覆蓋 audio/*.mp3，不用改程式。
 * 規則：地圖＝bgm_map、小屋＝bgm_home、商店＝bgm_shop、鬥技場＝bgm_arena、各章＝bgm_chN、每章最後一關（Boss）＝bgm_bossN。
 * 檔案不存在就靜音，不會報錯。右下角 🔊／🔇 鍵可以靜音（會記住；同時控制通關音效）。*/
(function () {
  if (window.JB2Music || window.parent !== window) return;   // 關卡（iframe）裡不放音樂
  var cs = document.currentScript, BASE = cs && cs.src ? cs.src.replace(/bgm\.js.*$/, '') : 'audio/';
  var KEY = 'jb2-mute', VOL = 0.32, FADE = 700;
  var blocked = false, first = true, leaving = false, miss = {}, cur = null, curName = '', want = '', duck = 1, unlocked = false, old = null;
  function muted() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  function setMuted(v) { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) {} paint(); apply(); }
  function target() { return muted() ? 0 : VOL * duck; }
  function fadeTo(a, v, ms, done) {
    if (!a) { done && done(); return; }
    var from = a.volume, t0 = Date.now();
    clearInterval(a._f);
    a._f = setInterval(function () {
      var k = Math.min(1, (Date.now() - t0) / ms);
      try { a.volume = Math.max(0, Math.min(1, from + (v - from) * k)); } catch (e) {}
      if (k >= 1) { clearInterval(a._f); done && done(); }
    }, 40);
  }
  function apply() { if (cur) fadeTo(cur, target(), 250); }
  function resumeAt(name) {
    try { var o = JSON.parse(sessionStorage.getItem('jb2-bgm-pos') || 'null'); if (o && o.name === name && Math.abs(Date.now() - o.at) < 15000) return Math.max(0, o.t + (Date.now() - o.at) / 1000); } catch (e) {}
    return 0;
  }
  function play(name) {
    want = name;
    if (name === curName || miss[name]) { if (miss[name]) stopCur(); return; }
    if (blocked && !unlocked) return;   // 已確定被瀏覽器擋住，等第一次點擊再播
    var a = new Audio(BASE + name + '.mp3');
    a.loop = true; a.volume = 0; a.preload = 'auto';
    a.addEventListener('error', function () { if (a._dead) return; miss[name] = 1; if (cur === a) { cur = null; curName = ''; } }, { once: true });
    var t = resumeAt(name);
    a.addEventListener('loadedmetadata', function () { try { if (t && a.duration && t < a.duration) a.currentTime = t; } catch (e) {} }, { once: true });
    var p = a.play();
    if (p && p.catch) p.catch(function () {          // 瀏覽器不讓自動播放：記起來，第一次點擊/按鍵就接著播
      if (cur === a) { cur = null; curName = ''; } blocked = true; unlocked = false;
    });
    var prev = cur; cur = a; curName = name;
    fadeTo(a, target(), first ? 1800 : FADE); first = false;
    if (prev) fadeTo(prev, 0, FADE, function () { try { prev._dead = true; prev.pause(); prev.removeAttribute('src'); prev.load(); } catch (e) {} });
  }
  function stopCur() { if (cur) { var p = cur; cur = null; curName = ''; fadeTo(p, 0, 400, function () { try { p._dead = true; p.pause(); } catch (e) {} }); } }
  var btn;
  function paint() { if (btn) { btn.textContent = muted() ? '🔇' : '🔊'; btn.title = muted() ? '開啟音樂與音效' : '關閉音樂與音效'; btn.setAttribute('aria-label', btn.title); } }
  function mkBtn() {
    if (btn || !document.body) return;
    btn = document.createElement('button'); btn.type = 'button'; btn.id = 'jb2-bgm-btn';
    btn.style.cssText = 'position:fixed;left:10px;bottom:10px;z-index:9998;width:44px;height:44px;border-radius:50%;border:2px solid #c9a24c;background:#1b1f3acc;color:#fff;font-size:20px;line-height:1;cursor:pointer;padding:0';
    btn.addEventListener('click', function (e) { e.stopPropagation(); setMuted(!muted()); if (!unlocked) unlock(); });
    document.body.appendChild(btn); paint();
  }
  function unlock() { if (unlocked) return; unlocked = true; blocked = false; if (want && !curName) play(want); }
  ['pointerdown', 'keydown', 'touchend'].forEach(function (ev) { window.addEventListener(ev, unlock, { once: false, passive: true }); });
  window.addEventListener('pagehide', function () { try { if (cur) sessionStorage.setItem('jb2-bgm-pos', JSON.stringify({ name: curName, t: cur.currentTime, at: Date.now() })); } catch (e) {} });
  document.addEventListener('visibilitychange', function () { if (!cur) return; if (document.hidden) cur.pause(); else if (unlocked) { var p = cur.play(); if (p && p.catch) p.catch(function () {}); } });
  /* ---- 換頁前先淡出（連結點擊 + 主城的 location 跳轉） ---- */
  function leave(go) {
    if (leaving) return; leaving = true;
    try { if (cur) { sessionStorage.setItem('jb2-bgm-pos', JSON.stringify({ name: curName, t: cur.currentTime, at: Date.now() + 450 })); fadeTo(cur, 0, 450); } } catch (e) {}
    setTimeout(function () { leaving = false; go(); }, cur ? 470 : 0);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a || e.defaultPrevented || a.target === '_blank') return;
    var h = a.getAttribute('href'); if (!h || /^(#|javascript:|mailto:)/.test(h)) return;
    if (a.origin && a.origin !== location.origin) return;
    e.preventDefault(); leave(function () { location.href = a.href; });
  }, true);
  /* ---- 依畫面自動換歌 ---- */
  var path = location.pathname, chm = /grade7-vol2-ch(\d)/.exec(path), BOSS = { '1-3-1': 1, '2-2-3': 2, '3-2-3': 3, '4-2-3': 4, '5-1-3': 5, '6-1-3': 6 };
  function pick() {
    var d = document, e;
    if (/battle-vol2/.test(path)) return { n: 'bgm_arena', d: 1 };
    if (d.getElementById('goldP') && d.getElementById('home')) {
      if (d.getElementById('home').classList.contains('on')) return { n: 'bgm_home', d: 1 };
      var po = d.getElementById('pnlOv'), h2 = po && po.querySelector('h2');
      if (po && po.classList.contains('on') && h2 && /商店|雜貨/.test(h2.textContent)) return { n: 'bgm_shop', d: 1 };
      return { n: 'bgm_map', d: 1 };
    }
    if (chm && d.getElementById('fr')) {
      var ov = d.getElementById('ov'), open = ov && !ov.classList.contains('hide'), n = +chm[1];
      if (open) { var m = /stage(\d-\d-\d)/.exec(d.getElementById('fr').src || ''); if (m && BOSS[m[1]]) return { n: 'bgm_boss' + BOSS[m[1]], d: 0.55 }; return { n: 'bgm_ch' + n, d: 0.55 }; }
      return { n: 'bgm_ch' + n, d: 1 };
    }
    return null;
  }
  function tick() { var r; try { r = pick(); } catch (e) { r = null; } if (!r) return; if (r.d !== duck) { duck = r.d; apply(); } if (r.n !== want) play(r.n); }
  function start() { mkBtn(); tick(); setInterval(tick, 400); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.JB2Music = { leave: leave, play: play, mute: setMuted, isMuted: muted };
})();
