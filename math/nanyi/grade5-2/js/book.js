'use strict';
/* 南一版 五年級下學期：單元與關卡對照，給 nanyi.js（KGVer）用。
   levels＝遊戲內部單元代號，names＝卡片裡關卡小標題用的名稱，bankUnits＝exam-bank.js 裡對應的 unit 名稱。 */
(function () {
  const B = {
    u1: '第 1 單元 分數的計算', u2: '第 2 單元 數的十進位結構', u3: '第 3 單元 小數的乘法', u4: '第 4 單元 扇形', u5: '第 5 單元 體積',
    u6: '第 6 單元 整數、小數除以整數', u7: '第 7 單元 生活中的大單位', u8: '第 8 單元 比率和百分率', u9: '第 9 單元 容積和容量', u10: '第 10 單元 柱體、錐體和球體'
  };
  const U = (no, title, levels, names) => ({ no, title, levels, bankUnits: levels.map(l => B[l]), names });
  window.BOOK = {
    subject: 'math', grade: 5, sem: '下', defaultVersion: 'nani',
    versions: {
      nani: [U(1, '分數的計算', ['u1']), U(2, '數的十進位結構', ['u2']), U(3, '小數的乘法', ['u3']), U(4, '扇形', ['u4']), U(5, '體積', ['u5']),
        U(6, '整數、小數除以整數', ['u6']), U(7, '生活中的大單位', ['u7']), U(8, '比率和百分率', ['u8']), U(9, '容積和容量', ['u9']), U(10, '柱體、錐體和球體', ['u10'])],
    }
  };
})();
