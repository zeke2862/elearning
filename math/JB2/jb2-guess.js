/* jb2-guess.js — 防「答錯就立刻關掉重開、秒答亂猜」守衛（JB2 召喚師版與數學保衛戰共用同一份邏輯）
 *
 * 規則（數字都在下面 CFG，可以調）：
 *  1. 「秒答亂猜」＝一題出現後 3.5 秒內就答錯。
 *  2. 「馬上重開」＝秒答答錯之後 12 秒內，就關閉／離開／重新整理遊戲，而且這一局還沒結束。
 *  3. 符合 1+2 算一次「違規」；10 分鐘內累積 2 次 → 這個學號在這台電腦鎖定 5 分鐘，
 *     期間不能開始任何一關，畫面顯示「請確實做答」的提醒與倒數。
 *  4. 第 1 次違規只提醒（下次開遊戲時跳出提醒），不鎖定。
 *  5. 鎖定事件會寫進「送給後台的紀錄」(rec.guess)，後台收到會寄通知信、報表顯示 🔒。
 *
 * 資料：localStorage『jb2-guess-v1』= { s:累計違規次數, n:累計鎖定次數, strikes:[時間…], until:鎖到何時, warn:0|1, lastAt, log:[…最近 8 筆] }
 * 限制（老實說）：鎖定存在這台電腦的瀏覽器裡，清除網站資料或換一台裝置就解除；但那樣會丟掉進度，而且鎖定事件仍會通報老師。
 *
 * API：JB2Guess.gate()（開始一關前呼叫，回傳 true 才可以開始）／start(id)／shown()／answered(ok)／finished()／left()／summary()
 */
(function () {
  'use strict';
  if (window.JB2Guess) return;
  var KEY = 'jb2-guess-v1';
  var CFG = { FAST_MS: 3500, LEAVE_MS: 12000, STRIKES: 2, WINDOW_MS: 600000, LOCK_MS: 300000 };

  function load() {
    try { var o = JSON.parse(localStorage.getItem(KEY)); if (o && typeof o === 'object') return o; } catch (e) {}
    return { s: 0, n: 0, strikes: [], until: 0, warn: 0, lastAt: 0, log: [] };
  }
  function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function now() { return Date.now(); }

  var round = null;                                   // 目前這一局：{ id, shown, last:{ok,at,fast}, answers }

  function remaining() {
    var st = load(), r = (st.until || 0) - now();
    if (r > CFG.LOCK_MS + 5000) r = CFG.LOCK_MS;      // 電腦時間被往前調：最多算一個鎖定長度
    return r > 0 ? r : 0;
  }

  var leaveFns = [];
  function start(id) { var t = now(); round = { id: String(id || ''), startAt: t, lastAt: t, shown: t, last: null, answers: 0, wrong: 0 }; }
  function shown() { if (round) round.shown = now(); }
  function answered(ok) {
    if (!round) return;
    var t = now();
    round.answers++; if (!ok) round.wrong++; round.lastAt = t;
    round.last = { ok: !!ok, at: t, fast: !ok && (t - round.shown) <= CFG.FAST_MS, ms: t - round.shown };
    round.shown = t;
  }
  function finished() { round = null; }

  function lockNow(st, t) {
    st.until = t + CFG.LOCK_MS; st.n = (st.n | 0) + 1; st.lastAt = t; st.strikes = []; st.warn = 0;
    st.log = (st.log || []).concat([{ at: t, id: round ? round.id : '', k: 'lock' }]).slice(-8);
  }
  function left(soft) {                               // 離開／關閉／重新整理：只有「秒答答錯後馬上離開」才算違規
    var r = round;
    if (soft) { if (r) { var f0 = r.last; r.last = null; return strike(r, f0); } return false; }   // 只是切到背景：算一次違規但這局繼續
    round = null;
    leaveFns.forEach(function (fn) { try { fn(r); } catch (e) {} });                       // 通知「這局沒打完就離開」（保衛戰用來補記時間）
    return r ? strike(r, r.last) : false;
  }
  function strike(r, last) {
    if (!r || !last || !last.fast) return false;
    var t = now(); if (t - last.at > CFG.LEAVE_MS) return false;
    var st = load();
    st.s = (st.s | 0) + 1;
    st.strikes = (st.strikes || []).filter(function (x) { return t - x <= CFG.WINDOW_MS; }).concat([t]);
    st.log = (st.log || []).concat([{ at: t, id: r.id, k: 'strike', ms: last.ms }]).slice(-8);
    if (st.strikes.length >= CFG.STRIKES) lockNow(st, t); else st.warn = 1;
    save(st);
    return true;
  }

  /* ---------- 畫面 ---------- */
  function fmt(ms) { var s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function overlay(title, body, left, onClose) {
    var ov = document.createElement('div');
    ov.setAttribute('role', 'alertdialog');
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:#0b0f22ee;display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,"Noto Sans TC",sans-serif';
    ov.innerHTML = '<div style="max-width:420px;width:100%;background:#161a2e;border:2px solid #d2a24c;border-radius:16px;padding:22px;color:#f1e8d2;text-align:center">' +
      '<div style="font-size:44px">' + (left ? '🔒' : '⚠️') + '</div><h2 style="margin:6px 0 8px;font-size:20px">' + title + '</h2>' +
      '<p style="margin:0 0 10px;font-size:15px;line-height:1.7">' + body + '</p>' +
      (left ? '<div class="jg-t" style="font-size:34px;font-weight:700;margin:6px 0 12px;color:#ffd27a"></div>' : '') +
      '<button class="jg-ok" style="font-size:17px;font-weight:700;padding:10px 26px;border:0;border-radius:12px;background:#d2a24c;color:#2a1d05;cursor:pointer">' + (left ? '先回地圖' : '我知道了，會認真作答') + '</button></div>';
    (document.body || document.documentElement).appendChild(ov);
    var tm = null;
    function close() { clearInterval(tm); if (ov.parentNode) ov.parentNode.removeChild(ov); if (onClose) onClose(); }
    ov.querySelector('.jg-ok').onclick = close;
    if (left) {
      var el = ov.querySelector('.jg-t');
      var tick = function () { var r = remaining(); el.textContent = fmt(r); if (r <= 0) { clearInterval(tm); ov.querySelector('p').textContent = '時間到了。這次請先看清楚題目、想一想再作答，答錯也沒關係，看說明就會進步！'; ov.querySelector('.jg-ok').textContent = '我知道了，會認真作答'; el.textContent = '✔'; } };
      tick(); tm = setInterval(tick, 500);
    }
  }
  var shownLock = false;
  function showLock(onClose) {
    if (shownLock) return; shownLock = true;
    overlay('請確實作答喔！',
      '系統發現你「答錯就馬上關掉重開、很快亂猜」。這樣學不到東西，也不會有真正的星星。<br>先休息一下，回來後請<b>認真想過再作答</b>。',
      true, function () { shownLock = false; if (onClose) onClose(); });
  }

  /* 開始一關之前呼叫：被鎖定 → 顯示倒數並回傳 false；有未讀的提醒 → 跳出提醒（仍回傳 true） */
  function gate() {
    if (remaining() > 0) {
      try { window.dispatchEvent(new Event('jb2-guess-lock')); } catch (e) {}
      showLock(); return false;
    }
    var st = load();
    if (st.warn) {
      st.warn = 0; save(st);
      overlay('請確實作答喔！', '剛才你「答錯後馬上離開遊戲」，系統看到了。<br>再發生一次就會<b>鎖定 5 分鐘</b>不能玩，請看清楚題目、認真作答。', false);
    }
    return true;
  }

  /* 給後台的摘要（沒有任何違規就回傳 null） */
  function summary() {
    var st = load(); if (!(st.s | 0) && !(st.n | 0)) return null;
    return { s: st.s | 0, n: st.n | 0, lastAt: st.lastAt || 0, until: st.until || 0, log: (st.log || []).slice(-5) };
  }

  window.addEventListener('pagehide', function () { try { left(); } catch (e) {} });
  window.JB2Guess = { CFG: CFG, gate: gate, start: start, shown: shown, answered: answered, finished: finished, left: left, remaining: remaining, summary: summary, showLock: showLock, cur: function () { return round; }, onLeave: function (fn) { leaveFns.push(fn); } };
})();
