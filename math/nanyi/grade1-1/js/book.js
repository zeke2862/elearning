'use strict';
/* 南一版 一年級上學期：單元與關卡對照，給 nanyi.js（KGVer）用。
   levels＝遊戲內部單元代號，names＝卡片裡關卡小標題用的名稱，bankUnits＝exam-bank.js 裡對應的 unit 名稱。 */
(function () {
  const B = {
    u1: '第 1 單元 數到 10', u2: '第 2 單元 比長短', u3: '第 3 單元 分與合', u4: '第 4 單元 順序和多少', u5: '第 5 單元 數到 30',
    u6: '第 6 單元 加一加', u7: '第 7 單元 認識形狀', u8: '第 8 單元 減一減與加減應用', u9: '第 9 單元 讀鐘錶'
  };
  const U = (no, title, levels) => ({ no, title, levels, bankUnits: levels.map(l => B[l]) });
  window.BOOK = {
    subject: 'math', grade: 1, sem: '上', defaultVersion: 'nani',
    mid: { nani: 4 }, // 南一期中考考第 1～4 單元
    versions: {
      nani: [U(1, '數到 10', ['u1']), U(2, '比長短', ['u2']), U(3, '分與合', ['u3']), U(4, '順序和多少', ['u4']), U(5, '數到 30', ['u5']),
        U(6, '加一加', ['u6']), U(7, '認識形狀', ['u7']), U(8, '減一減與加減應用', ['u8']), U(9, '讀鐘錶', ['u9'])],
    }
  };
})();
