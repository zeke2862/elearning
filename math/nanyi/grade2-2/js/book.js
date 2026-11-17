'use strict';
/* 南一版 二年級下學期：單元與關卡對照，給 nanyi.js（KGVer）用。
   levels＝遊戲內部單元代號，names＝卡片裡關卡小標題用的名稱，bankUnits＝exam-bank.js 裡對應的 unit 名稱。 */
(function () {
  const B = {
    u1: '第 1 單元 數到 1000', u2: '第 2 單元 加加減減', u3: '第 3 單元 幾公尺', u4: '第 4 單元 年月日', u5: '第 5 單元 0、1、10 的乘法',
    u6: '第 6 單元 重量', u7: '第 7 單元 兩步驟的計算', u8: '第 8 單元 分東西', u9: '第 9 單元 單位分數', u10: '第 10 單元 面的大小與立體'
  };
  const U = (no, title, levels, names) => ({ no, title, levels, bankUnits: levels.map(l => B[l]), names });
  window.BOOK = {
    subject: 'math', grade: 2, sem: '下', defaultVersion: 'nani',
    versions: {
      nani: [U(1, '數到 1000', ['u1']), U(2, '加加減減', ['u2']), U(3, '幾公尺', ['u3']), U(4, '年月日', ['u4']), U(5, '0、1、10 的乘法', ['u5']),
        U(6, '重量', ['u6']), U(7, '兩步驟的計算', ['u7']), U(8, '分東西', ['u8']), U(9, '單位分數', ['u9']), U(10, '面的大小與立體', ['u10'])],
    }
  };
})();
