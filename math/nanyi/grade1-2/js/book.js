'use strict';
/* 南一版 一年級下學期：單元與關卡對照，給 nanyi.js（KGVer）用。
   levels＝遊戲內部單元代號，names＝卡片裡關卡小標題用的名稱，bankUnits＝exam-bank.js 裡對應的 unit 名稱。 */
(function () {
  const B = {
    u1: '第 1 單元 數到 100', u2: '第 2 單元 18 以內的加法', u3: '第 3 單元 長度', u4: '第 4 單元 18 以內的減法', u5: '第 5 單元 圖形和形體',
    u6: '第 6 單元 幾月幾日', u7: '第 7 單元 錢幣', u8: '第 8 單元 二位數的加減', u9: '第 9 單元 做紀錄'
  };
  const U = (no, title, levels, names) => ({ no, title, levels, bankUnits: levels.map(l => B[l]), names });
  window.BOOK = {
    subject: 'math', grade: 1, sem: '下', defaultVersion: 'nani',
    versions: {
      nani: [U(1, '數到 100', ['u1']), U(2, '18 以內的加法', ['u2']), U(3, '長度', ['u3']), U(4, '18 以內的減法', ['u4']), U(5, '圖形和形體', ['u5']),
        U(6, '幾月幾日', ['u6']), U(7, '錢幣', ['u7']), U(8, '二位數的加減', ['u8']), U(9, '做紀錄', ['u9'])],
    }
  };
})();
