/* jb2-guess-map.js — 把 jb2-guess.js 接到章節地圖（各章 world-map-vol2chN.html 最後載入）
 * 做的事：開始一關前檢查有沒有被鎖定；用關卡傳來的作答訊息（wave-log）判斷「秒答答錯」；
 * 關閉／離開關卡時判斷有沒有「答錯馬上重開」；鎖定時立刻把紀錄送給後台。 */
(function () {
  'use strict';
  var G = window.JB2Guess; if (!G) return;
  var oo = window.openStage, oc = window.closeStage;
  if (typeof oo === 'function') window.openStage = function (id) {
    if (!G.gate()) return;
    var r = oo.apply(this, arguments);
    try { G.start(id); } catch (e) {}
    return r;
  };
  if (typeof oc === 'function') window.closeStage = function () { try { G.left(); } catch (e) {} return oc.apply(this, arguments); };
  window.addEventListener('message', function (e) {
    var d = e.data; if (!d || typeof d !== 'object') return;
    try {
      if (d.type === 'wave-log') { if (G.remaining() > 0) { try { window.closeStage(); } catch (x) {} return; } G.answered(!!d.ok); }
      else if (d.type === 'stage-result' || d.type === 'endless-result' || d.type === 'practice-result') G.finished();
      else if (d.type === 'stage-exit') G.left();
    } catch (x) {}
  });
  window.addEventListener('jb2-guess-lock', function () { try { window.JB2Sync && JB2Sync.push(); } catch (e) {} });
  // 直接用網址帶進來的練習（?practice= / ?open=）會跳過 openStage 的檢查：被鎖定就關掉並顯示倒數
  if (G.remaining() > 0) setTimeout(function () { try { window.closeStage(); } catch (e) {} G.gate(); }, 300);
})();
