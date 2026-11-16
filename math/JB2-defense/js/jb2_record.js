/* jb2_record.js — 把「數學保衛戰」每一關的結果，記成 JB2 紀錄的格式，交給 JB2 的同步程式合併後送給老師。
 *
 * 這個遊戲放在 math/JB2-defense/，跟 JB2（math/JB2/）是同一個網站，瀏覽器資料互通：
 *   - 學號：用 JB2 已經登記的學號（localStorage keyagent_active_student），學生不用重打。
 *   - 紀錄：每玩完一關，寫進 localStorage『md_jb2rec_v1』（格式跟 JB2 紀錄的 stages／q 一樣），
 *           再呼叫 ../JB2/jb2-sync.js 的 push()：它會把 JB2 的紀錄與這裡的紀錄合併（星星取最高、練習累計），
 *           透過 sync-client.js 送出，所以老師現有的報表不用改就看得到。
 *
 * 記什麼：學號、勇者名、每一關的星數／練習次數／練習秒數／答題數與答對數／每次作答、各題型對錯。
 * 不記：真名、答題內容。討伐怪物（複習）不算。
 */
(function () {
  'use strict';
  var KEY = 'md_jb2rec_v1';
  function rd() { try { var o = JSON.parse(localStorage.getItem(KEY)); return o && o.v === 1 ? o : null; } catch (e) { return null; } }
  function wr(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function hubOf() { return (window.G && G.S && G.S.hub) || {}; }
  function stageOf(nodeId) { var m = /^jb2_(\d+)_(\d+)_(\d+)$/.exec(String(nodeId)); return m ? m[1] + '-' + m[2] + '-' + m[3] : null; }
  function activeNo() { try { return window.JB2Sync && JB2Sync.activeNo ? String(JB2Sync.activeNo() || '') : ''; } catch (e) { return ''; } }

  /* ---------- 學號：沿用 JB2 的 ---------- */
  // 有 JB2 學號 → 直接採用（不再問）；沒有 → 學生第一次登記時，順便登記給 JB2（讓兩邊是同一個人）
  function adoptNo() {
    var hub = hubOf(), act = activeNo();
    if (!act && hub.sid) { try { JB2Sync.setNo(String(hub.sid)); } catch (e) {} return; }       // 以前直接玩過這個遊戲的學生
    if (act && !hub.sid) { hub.sid = act; try { G.save(); } catch (e) {} }                         // JB2 學生第一次來玩
  }
  function sameNo() { var hub = hubOf(), act = activeNo(); return !!act && String(hub.sid || '') === act; }

  /* ---------- 記錄一關 ---------- */
  function record(node, r) {
    if (!r || r.monster || !node) return;
    var id = stageOf(node.id); if (!id) return;
    var o = rd() || { v: 1, stages: {}, q: {} };
    var mode = r.mode === 'endless' ? 'end' : (r.mode || 'easy');
    var total = r.total | 0, right = r.correct | 0, secs = Math.max(0, Math.min(1800, Math.round(r.seconds || 0))), at = Date.now();
    var s = o.stages[id] || (o.stages[id] = { n: '', ch: +id.charAt(0), bestStars: 0, plays: 0, pSecs: 0, totalQ: 0, totalOk: 0, lastStars: null, lastMode: '', lastAt: 0, hist: [] });
    if (node.title) s.n = String(node.title);
    var stars = r.cleared ? (r.stars | 0) : 0;
    s.bestStars = Math.max(s.bestStars | 0, stars);
    s.plays = (s.plays | 0) + 1;
    s.pSecs = (s.pSecs || 0) + secs;
    s.totalQ = (s.totalQ | 0) + total;
    s.totalOk = (s.totalOk | 0) + right;
    s.lastStars = stars; s.lastMode = mode; s.lastAt = at;
    s.hist = (s.hist || []).concat([{ at: at, q: total, ok: right, s: secs, st: stars, m: mode }]).slice(-30);
    (r.results || []).forEach(function (x) {                         // 各題型對錯：key 長得像「jb2_1_1_1|a|3|combine」，最後一段是題型
      var t = String(x.key).split('|').pop(); if (!t) return;
      var k = id + ':' + t, c = o.q[k] || (o.q[k] = { n: 0, ok: 0 }); c.n += 1; if (x.ok) c.ok += 1;
    });
    o.lastId = id; o.lastAt = at; o.hero = String(hubOf().name || '').slice(0, 8);
    wr(o);
  }
  function push() { try { adoptNo(); if (sameNo() && window.JB2Sync) JB2Sync.push(); } catch (e) {} }

  /* ---------- 掛上「結算一關」 ---------- */
  function install() {
    if (!window.G || typeof G.finishStage !== 'function' || window.__jb2RecOn) return;
    window.__jb2RecOn = 1;
    var fin = G.finishStage;
    G.finishStage = function (node, r) {
      var out = fin.apply(this, arguments);
      try { record(node, r); push(); } catch (e) {}                  // 記錄失敗不影響遊戲
      return out;
    };
    adoptNo();
    setTimeout(push, 2500);                                          // 開啟遊戲時也送一次（補上之前沒送出的）
    var hub = G.openHub; if (typeof hub === 'function') G.openHub = function () { adoptNo(); var r = hub.apply(this, arguments); setTimeout(push, 1500); return r; };
  }
  // 還原存檔失敗時，給學生看的說明
  function msg(why) {
    why = String(why || '');
    if (why === 'old') return '這是舊版的存檔碼／存檔檔，已經不能使用了。請回到原本那台電腦，重新產生新的存檔碼（或匯出新的檔案）。';
    if (why === 'sig') return '這個存檔被修改過或不完整，沒辦法還原。';
    if (why.indexOf('owner:') === 0) return '這份存檔是學號 ' + why.slice(6) + ' 的，不是你的，不能還原。';
    if (why.indexOf('data:') === 0) return '存檔裡有不合理的數字，沒辦法還原。';
    return '存檔碼不對，請確認有整段貼上。';
  }
  window.JB2Record = { install: install, msg: msg, _record: record, _adopt: adoptNo };
  if (document.readyState === 'complete') install(); else window.addEventListener('load', install);
})();
