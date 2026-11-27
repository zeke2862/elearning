/* jb2-feedback.js — 「💬 給遊戲的建議」回饋區（JB2 召喚師版與數學保衛戰共用同一份；中文／泰文雙語）
 *
 * 做什麼：
 *  1. 畫面左側放一顆小圓鈕 💬，學生按下去 → 選類型（有錯誤／看不懂／想要新功能／泰文翻譯不對／喜歡）＋寫幾句話 → 送出。
 *  2. 自動附上「問題在哪裡」：學號、哪一章哪一關、模式、語言、手機或電腦（老師不用再問學生「是哪一關」）。
 *  3. 用跟學習紀錄同一條路送到 Google 試算表的「回饋」分頁（雲端同步-Code.gs 的 action:'feedback'）；
 *     老師端會收到 Email 通知。連不上網路時先存在這台裝置，下次開啟或恢復網路時自動補送。
 *
 * 引入方式（放在 </body> 前）：<script src="…/jb2-feedback.js?v=1" data-game="jb2"></script>（保衛戰寫 data-game="defense"）
 * 想讓畫面自己提供「目前在哪一關」：定義 window.JB2FB_CONTEXT = function(){ return { stage:'3-1-2', mode:'easy' }; }
 * 不需要其他檔案；有載入 sync-client.js 時會沿用它的 CLOUD_RELAY_URL，沒有就用下面的預設網址。
 */
(function () {
  'use strict';
  if (window.JB2Feedback) return;

  var RELAY_DEFAULT = 'https://script.google.com/macros/s/AKfycbwVsNUmhpicvrNRmqcsZhIl2TMuImIMBwO40P9Oxma0fWPgT_j2sEDu4IPegXjr4K9c/exec';
  var QKEY = 'jb2-fb-queue', DKEY = 'jb2-fb-day', MAXLEN = 300, PER_DAY = 5, QMAX = 10;
  var cs = document.currentScript;
  var GAME = (cs && cs.getAttribute('data-game')) || (/JB2-defense|mathtestjb2/i.test(location.href) ? 'defense' : 'jb2');

  var TYPES = [
    ['bug', '🐞', '有錯誤', 'มีข้อผิดพลาด'],
    ['hard', '🤔', '看不懂', 'ไม่เข้าใจ'],
    ['idea', '💡', '想要新功能', 'อยากได้ฟีเจอร์ใหม่'],
    ['trans', '🌐', '泰文翻譯不對', 'แปลภาษาไทยไม่ถูก'],
    ['like', '👍', '我喜歡', 'ฉันชอบ']
  ];
  var MODE_ZH = { easy: '練兵', real: '實戰', hard: '修羅', end: '無極限', endless: '無極限' };

  function relay() { try { if (typeof CLOUD_RELAY_URL === 'string' && CLOUD_RELAY_URL) return CLOUD_RELAY_URL; } catch (e) {} return RELAY_DEFAULT; }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function jget(k, d) { try { return JSON.parse(lsGet(k)) || d; } catch (e) { return d; } }
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + (d.getDate()); }
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  /* ---------- 學號與「在哪裡」 ---------- */
  function studentNo() {
    try { if (window.G && G.S && G.S.hub && G.S.hub.sid) return String(G.S.hub.sid); } catch (e) {}   // 數學保衛戰：遊戲內登記的學號
    var a = jget('keyagent_active_student', null);
    if (a && a.studentNumber) return String(a.studentNumber);
    var h = jget('jb2-hub-v1', null); if (h && h.who && h.who.no) return String(h.who.no);
    var d = jget('math_defense_jb2_v1', null); if (d && d.hub && d.hub.sid) return String(d.hub.sid);
    return '';
  }
  function context() {
    var c = {}, p = location.pathname || '', m;
    try { if (typeof window.JB2FB_CONTEXT === 'function') c = window.JB2FB_CONTEXT() || {}; } catch (e) { c = {}; }
    if (!c.stage) {
      if ((m = /stage(\d+-\d+-\d+)/.exec(p))) c.stage = m[1];
      else if ((m = /world-map-vol2ch(\d)/.exec(p))) c.stage = '第' + m[1] + '章地圖';
      else if (/world-map-vol2-all/.test(p)) c.stage = '總地圖';
      else if (/battle-vol2/.test(p)) c.stage = '對戰頁';
    }
    if (!c.mode) { try { c.mode = new URLSearchParams(location.search).get('mode') || ''; } catch (e) { c.mode = ''; } }
    c.mode = MODE_ZH[c.mode] || c.mode || '';
    c.stage = c.stage || '';
    c.lang = lsGet('jb2-lang') === 'th' ? 'th' : 'zh';
    c.device = (window.innerWidth < 760 ? '手機' : '電腦');
    c.page = (p.split('/').slice(-2).join('/') || '/').slice(0, 60);
    return c;
  }

  /* ---------- 待送佇列 ---------- */
  var sending = false;
  function queue(item) { var q = jget(QKEY, []); q.push(item); if (q.length > QMAX) q = q.slice(-QMAX); lsSet(QKEY, JSON.stringify(q)); }
  function post(item) {
    return fetch(relay(), { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(item) })
      .then(function (r) { return r.json(); });
  }
  function flush() {
    if (sending) return; var q = jget(QKEY, []); if (!q.length) return; sending = true;
    (function step() {
      var cur = jget(QKEY, []); if (!cur.length) { sending = false; return; }
      post(cur[0]).then(function (r) {
        // 成功，或老師端明確拒絕（太多／空白）＝都從佇列拿掉，不再重送
        var rest = jget(QKEY, []).slice(1); lsSet(QKEY, JSON.stringify(rest)); step();
      }).catch(function () { sending = false; });
    })();
  }

  /* ---------- 畫面 ---------- */
  var css = '#jb2fb-btn{position:fixed;left:6px;bottom:96px;z-index:2147482000;width:44px;height:44px;border-radius:50%;border:2px solid #d2a24c;background:#20264aee;color:#fff;font-size:22px;line-height:1;cursor:pointer;box-shadow:0 2px 8px #0008;padding:0;opacity:.88}' +
    '#jb2fb-btn:hover,#jb2fb-btn:focus{opacity:1;outline:none;background:#2f3a78}' +
    '#jb2fb-ov{position:fixed;inset:0;z-index:2147483002;background:rgba(8,10,24,.86);display:flex;align-items:center;justify-content:center;padding:10px}' +
    '#jb2fb-ov .bx{width:min(520px,100%);max-height:96vh;overflow-y:auto;background:#20264a;color:#e9e4d4;border:2px solid #d2a24c;border-radius:16px;padding:14px 16px;box-sizing:border-box;font:15px/1.6 system-ui,"Noto Sans TC","Noto Sans Thai",sans-serif}' +
    '#jb2fb-ov h3{margin:0 0 4px;font-size:1.1rem}#jb2fb-ov .sub{font-size:.82rem;opacity:.8;margin-bottom:8px}' +
    '#jb2fb-ov .ty{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 8px}' +
    '#jb2fb-ov .ty button{flex:1 1 46%;border:2px solid #3a4270;background:#141a3a;color:inherit;border-radius:10px;padding:6px 8px;cursor:pointer;font:inherit;font-size:.88rem;text-align:left;line-height:1.35}' +
    '#jb2fb-ov .ty button.on{border-color:#d2a24c;background:#d2a24c33}' +
    '#jb2fb-ov textarea,#jb2fb-ov input{width:100%;box-sizing:border-box;border:2px solid #3a4270;background:#0f1330;color:#fff;border-radius:10px;padding:8px;font:inherit}' +
    '#jb2fb-ov textarea{min-height:96px;resize:vertical}#jb2fb-ov .cnt{text-align:right;font-size:.78rem;opacity:.7}' +
    '#jb2fb-ov .ctx{font-size:.78rem;opacity:.75;margin:4px 0}#jb2fb-ov .msg{min-height:1.4em;margin:4px 0;font-size:.9rem}' +
    '#jb2fb-ov .row{display:flex;gap:8px;justify-content:flex-end;margin-top:6px}' +
    '#jb2fb-ov .row button{border:2px solid #d2a24c;border-radius:10px;padding:8px 16px;font:inherit;cursor:pointer;background:transparent;color:#e9e4d4}' +
    '#jb2fb-ov .row button.go{background:#d2a24c;color:#2a1d05;font-weight:700}#jb2fb-ov .row button:disabled{opacity:.5}' +
    '@media(max-width:480px){#jb2fb-ov .ty button{flex-basis:100%}}';

  var ov = null;
  function close() { if (ov) { ov.remove(); ov = null; } window.removeEventListener('keydown', onKeyCap, true); }
  // 遊戲自己有監聽鍵盤（數字鍵、Enter…）：輸入視窗打開時，不讓這些事件傳給遊戲，打字才不會被吃掉（輸入文字本身不受影響）
  function onKeyCap(e) {
    if (!ov) return;
    if (e.key === 'Escape') { close(); e.stopPropagation(); return; }
    if (ov.contains(e.target)) e.stopPropagation();
  }
  function open() {
    if (ov) return;
    var sel = '', sno = studentNo(), c = context();
    ov = document.createElement('div'); ov.id = 'jb2fb-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
    ov.innerHTML = '<div class="bx"><h3>💬 給遊戲的建議　ข้อเสนอแนะเกี่ยวกับเกม</h3>' +
      '<div class="sub">老師會看到你寫的話，謝謝你幫忙讓遊戲更好！<br>ครูจะอ่านสิ่งที่คุณเขียน ขอบคุณที่ช่วยทำให้เกมดีขึ้น!</div>' +
      '<div class="ty"></div>' +
      '<textarea id="jb2fb-tx" maxlength="' + MAXLEN + '" placeholder="寫中文或泰文都可以　เขียนภาษาจีนหรือภาษาไทยก็ได้"></textarea>' +
      '<div class="cnt"><span id="jb2fb-n">0</span>/' + MAXLEN + '</div>' +
      (sno ? '' : '<input id="jb2fb-no" inputmode="numeric" maxlength="20" placeholder="學號（選填）รหัสนักเรียน (ไม่บังคับ)">') +
      '<div class="ctx" id="jb2fb-ctx"></div><div class="msg" id="jb2fb-msg" role="status"></div>' +
      '<div class="row"><button type="button" id="jb2fb-x">取消 ยกเลิก</button><button type="button" class="go" id="jb2fb-go" disabled>送出 ส่ง</button></div></div>';
    document.body.appendChild(ov);
    var $ = function (s) { return ov.querySelector(s); }, ty = $('.ty'), tx = $('#jb2fb-tx'), go = $('#jb2fb-go'), msg = $('#jb2fb-msg');
    $('#jb2fb-ctx').textContent = '一併送出 ส่งไปพร้อมกัน：' + [sno ? ('學號 ' + sno) : '', c.stage, c.mode, c.lang === 'th' ? 'ไทย' : '中文', c.device].filter(Boolean).join('・');
    TYPES.forEach(function (t) {
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
      b.innerHTML = t[1] + ' ' + esc(t[2]) + '<br><small>' + esc(t[3]) + '</small>';
      b.onclick = function () { sel = t[0]; Array.prototype.forEach.call(ty.children, function (x) { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); }); b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); upd(); };
      ty.appendChild(b);
    });
    function upd() { $('#jb2fb-n').textContent = tx.value.length; go.disabled = !(sel && tx.value.trim().length >= 2); }
    tx.addEventListener('input', upd);
    $('#jb2fb-x').onclick = close;
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    window.addEventListener('keydown', onKeyCap, true);
    go.onclick = function () {
      var day = jget(DKEY, {}); if (day.d !== today()) day = { d: today(), n: 0 };
      if (day.n >= PER_DAY) { msg.textContent = '今天已經送了 ' + PER_DAY + ' 則囉，明天再來！ วันนี้ส่งครบ ' + PER_DAY + ' ข้อความแล้ว พรุ่งนี้มาใหม่นะ!'; return; }
      var noEl = $('#jb2fb-no'), item = {
        action: 'feedback', cid: Date.now().toString(36) + Math.random().toString(36).slice(2, 8), game: GAME,
        studentNumber: sno || (noEl ? noEl.value.trim() : ''), type: sel, text: tx.value.trim().slice(0, MAXLEN),
        stage: c.stage, mode: c.mode, lang: c.lang, device: c.device, page: c.page, at: Date.now()
      };
      go.disabled = true; msg.textContent = '送出中… กำลังส่ง…';
      day.n++; lsSet(DKEY, JSON.stringify(day));
      post(item).then(function (r) {
        if (r && r.success) { msg.textContent = '✅ 謝謝你！老師收到了　ขอบคุณ! ครูได้รับแล้ว'; setTimeout(close, 1400); }
        else if (r && r.message === 'limit') { msg.textContent = '今天送太多囉，明天再來！ วันนี้ส่งมากเกินไปแล้ว พรุ่งนี้มาใหม่นะ!'; }
        else { queue(item); msg.textContent = '📮 已存起來，連上網路後會自動送出　บันทึกไว้แล้ว จะส่งให้อัตโนมัติเมื่อมีอินเทอร์เน็ต'; setTimeout(close, 2200); }
      }).catch(function () { queue(item); msg.textContent = '📮 已存起來，連上網路後會自動送出　บันทึกไว้แล้ว จะส่งให้อัตโนมัติเมื่อมีอินเทอร์เน็ต'; setTimeout(close, 2200); });
    };
    setTimeout(function () { try { ty.firstChild.focus(); } catch (e) {} }, 0);
  }

  function mount() {
    if (document.getElementById('jb2fb-btn')) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var b = document.createElement('button'); b.id = 'jb2fb-btn'; b.type = 'button'; b.textContent = '💬';
    b.title = '給遊戲的建議 / ข้อเสนอแนะ'; b.setAttribute('aria-label', '給遊戲的建議 / ข้อเสนอแนะเกี่ยวกับเกม');
    b.onclick = open; document.body.appendChild(b);
    setTimeout(flush, 3000); window.addEventListener('online', flush);
  }

  window.JB2Feedback = { open: open, flush: flush, _context: context };
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
