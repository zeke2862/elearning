'use strict';
/* 南一版 六年級上學期：單元與關卡對照，給 nanyi.js（KGVer）用。
   levels＝遊戲內部單元代號，names＝卡片裡關卡小標題用的名稱，bankUnits＝exam-bank.js 裡對應的 unit 名稱。 */
(function () {
  const B = {
    u1: '第 1 單元 質因數分解和短除法', u2: '第 2 單元 分數的除法', u3: '第 3 單元 小數的除法', u4: '第 4 單元 圓周長和圓面積',
    u5: '第 5 單元 比和比值', u6: '第 6 單元 扇形的周長和面積', u7: '第 7 單元 速率', u8: '第 8 單元 數量關係'
  };
  const U = (no, title, levels, names) => ({ no, title, levels, bankUnits: levels.map(l => B[l]).filter(Boolean), names }); // xgame（🎮 闖關任務）沒有自己的題庫
  window.BOOK = {
    subject: 'math', grade: 6, sem: '上', defaultVersion: 'nani',
    versions: {
      nani: [U(1, '質因數分解和短除法', ['u1']), U(2, '分數的除法', ['u2']), U(3, '小數的除法', ['u3']), U(4, '圓周長和圓面積', ['u4']),
        U(5, '比和比值', ['u5']), U(6, '扇形的周長和面積', ['u6']), U(7, '速率', ['u7']), U(8, '數量關係', ['u8'])],
    }
  };
})();
