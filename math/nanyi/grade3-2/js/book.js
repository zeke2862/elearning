'use strict';
/* 南一版 三年級下學期：單元與關卡對照，給 nanyi.js（KGVer）用。
   levels＝遊戲內部單元代號，names＝卡片裡關卡小標題用的名稱，bankUnits＝exam-bank.js 裡對應的 unit 名稱。 */
(function () {
  const B = {
    u1: '第 1 單元 除法', u2: '第 2 單元 找規律', u3: '第 3 單元 時間', u4: '第 4 單元 兩步驟的計算', u5: '第 5 單元 面積',
    u6: '第 6 單元 公斤和公克', u7: '第 7 單元 分數', u8: '第 8 單元 乘除的應用', u9: '第 9 單元 小數', u10: '第 10 單元 報讀表格'
  };
  const U = (no, title, levels, names) => ({ no, title, levels, bankUnits: levels.map(l => B[l]), names });
  window.BOOK = {
    subject: 'math', grade: 3, sem: '下', defaultVersion: 'nani',
    versions: {
      nani: [U(1, '除法', ['u1']), U(2, '找規律', ['u2']), U(3, '時間', ['u3']), U(4, '兩步驟的計算', ['u4']), U(5, '面積', ['u5']),
        U(6, '公斤和公克', ['u6']), U(7, '分數的加減', ['u7']), U(8, '乘除的應用', ['u8']), U(9, '小數', ['u9']), U(10, '報讀表格', ['u10'])],
    }
  };
})();
