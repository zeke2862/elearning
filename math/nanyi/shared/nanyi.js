'use strict';
/* 南一版專用：年級頁上方的「期中／期末／全冊」範圍切換，以及月考試卷的範圍。
   （取代原本會連到別人網站的 kg-ver.js；這裡只有南一，沒有版本切換。）
   各年級的 main.js 透過 window.KGVer 呼叫，介面維持不變：
     KGVer.cur(BOOK)            目前版本（固定 nani）和範圍
     KGVer.units(BOOK)          目前範圍要顯示的單元
     KGVer.bar(el, BOOK, 變更時) 畫出「範圍」與「國字加註」列
     KGVer.examBank(BOOK, EB)   依範圍組成期中／期末／全冊三份試卷 */
(function () {
  if (window.KGVer) return;
  var KEY = 'nanyi-math-range';
  var RANGE = { m1: '期中考範圍', m2: '期末考範圍', all: '全冊' };
  var GR = ['', '一', '二', '三', '四', '五', '六'];
  function getRange() { var r = null; try { r = localStorage.getItem(KEY); } catch (e) {} return RANGE[r] ? r : 'all'; }
  function setRange(r) { try { localStorage.setItem(KEY, r); } catch (e) {} }
  function cur() { return { version: 'nani', range: getRange() }; }
  // 期中考考到第幾單元：BOOK.mid 可寫數字或 {nani:4}；沒寫就前一半
  function midOf(BOOK, list) {
    var m = BOOK.mid; if (m && typeof m === 'object') m = m.nani;
    return m > 0 && m < list.length ? m : Math.ceil(list.length / 2);
  }
  function list(BOOK) { return (BOOK.versions.nani || []).slice(); }
  function units(BOOK) {
    var l = list(BOOK), half = midOf(BOOK, l), r = getRange();
    return r === 'm1' ? l.slice(0, half) : r === 'm2' ? l.slice(half) : l;
  }
  function examBank(BOOK, EB) {
    var l = list(BOOK), half = midOf(BOOK, l);
    var bu = function (arr) { var s = []; arr.forEach(function (u) { (u.bankUnits || []).forEach(function (x) { if (s.indexOf(x) < 0) s.push(x); }); }); return s; };
    var a = l.slice(0, half), b = l.slice(half);
    var rng = function (arr) { return arr.length ? '第 ' + arr[0].no + '～' + arr[arr.length - 1].no + ' 單元' : ''; };
    return { grade: (EB.grade || '') + '（南一版）', bank: EB.bank, papers: [
      { title: '期中考範圍（' + rng(a) + '）', units: bu(a), count: 45 },
      { title: '期末考範圍（' + rng(b) + '）', units: bu(b), count: 45 },
      { title: '全冊總複習', units: bu(l), count: 50 }] };
  }
  var CSS = '#kgv-bar{font-family:"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif;color:#2b2b2b;display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;background:rgba(255,255,255,.92);border:2px solid #e6dccb;border-radius:16px;padding:8px 12px;margin:8px auto;max-width:960px;text-align:left}' +
    '#kgv-bar .lb{font-weight:800}#kgv-bar .grp{display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-weight:700}' +
    '#kgv-bar button{font:inherit;font-size:15px;font-weight:700;padding:6px 12px;border-radius:999px;border:2px solid #d8ccb8;background:#fff;color:#2b2b2b;cursor:pointer;min-height:38px}' +
    '#kgv-bar button.on{color:#fff;border-color:transparent;background:#8b5e34}' +
    '#kgv-bar .nz-seg button.on{background:#e8590c}' +
    '#kgv-bar a.fix{margin-left:auto;font-weight:800;font-size:15px;padding:6px 12px;border-radius:999px;background:#4a5568;color:#fff;text-decoration:none}';
  function bar(el, BOOK, onChange) {
    if (!el) return;
    if (!document.getElementById('kgv-css')) { var s = document.createElement('style'); s.id = 'kgv-css'; s.textContent = CSS; document.head.appendChild(s); }
    function draw() {
      var l = list(BOOK), half = midOf(BOOK, l), r = getRange();
      var sub = { m1: l.length ? '第 ' + l[0].no + '～' + l[half - 1].no + ' 單元' : '', m2: l.length > half ? '第 ' + l[half].no + '～' + l[l.length - 1].no + ' 單元' : '', all: '全部單元' };
      el.innerHTML = '<div id="kgv-bar"><span class="lb">📘 ' + GR[BOOK.grade] + '年級' + BOOK.sem + '學期・南一版</span>' +
        '<span class="grp">範圍：' + ['m1', 'm2', 'all'].map(function (k) { return '<button type="button" data-r="' + k + '" class="' + (k === r ? 'on' : '') + '" title="' + sub[k] + '">' + RANGE[k] + '</button>'; }).join('') + '</span>' +
        '<span class="grp">國字加註：<span class="nz-seg" id="kgv-nz"></span></span>' +
        '<a class="fix" href="../fix-lab/index.html">🔧 故障修復局</a></div>';
      Array.prototype.forEach.call(el.querySelectorAll('[data-r]'), function (b) { b.onclick = function () { setRange(b.getAttribute('data-r')); draw(); onChange && onChange(); }; });
      if (window.NanyiRuby) NanyiRuby.picker(el.querySelector('#kgv-nz'));
    }
    draw();
  }
  window.KGVer = { PUB: { nani: '南一' }, cur: cur, units: units, bar: bar, examBank: examBank };
})();
