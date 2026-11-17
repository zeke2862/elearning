'use strict';
/* 南一版 六年級下學期：單元與關卡對照，給 nanyi.js（KGVer）用。
   levels＝遊戲內部單元代號，names＝卡片裡關卡小標題用的名稱，bankUnits＝exam-bank.js 裡對應的 unit 名稱。 */
(function () {
  const B = {
    mixed: '分數與小數的四則混合計算', pie: '圓形圖與可能性', base: '基準量與比較量', scale: '放大圖、縮圖與比例尺',
    solve: '怎樣解題（年齡、和差、雞兔、平均）', chase: '相遇、追趕與流水', speed: '速率', prism: '柱體的體積與表面積', circ: '圓面積與扇形面積'
  };
  /* bgame＝🎮 闖關任務「誰才是老大？基準量偵探社」（js/ratio-detective.js），跟著基準量單元出現，題庫用同一個單元 */
  const u = (no, title, ids) => ({ no, title, levels: ids, bankUnits: ids.map(id => B[id]).filter(Boolean) });
  window.BOOK = {
    subject: 'math', grade: 6, sem: '下', defaultVersion: 'nani', bankNames: B,
    versions: {
      nani: [
        u(1, '四則混合運算', ['mixed']), u(2, '圓形圖', ['pie']), u(3, '基準量和比較量', ['base', 'bgame']),
        u(4, '放大圖、縮圖和比例尺', ['scale']), u(5, '怎樣解題', ['solve', 'chase']), u(6, '柱體的體積和表面積', ['prism'])
      ],
    }
  };
})();
