'use strict';
/* 南一版 二年級上學期：單元與關卡對照，給 nanyi.js（KGVer）用。
   levels＝遊戲內部單元代號，names＝卡片裡關卡小標題用的名稱，bankUnits＝exam-bank.js 裡對應的 unit 名稱。 */
(function () {
  const B = {
    u1: '第 1 單元 數到 300', u2: '第 2 單元 二位數的加減', u3: '第 3 單元 幾公分', u4: '第 4 單元 加減的關係與應用', u5: '第 5 單元 容量',
    u6: '第 6 單元 兩步驟的加減', u7: '第 7 單元 2、5、4、8 的乘法', u8: '第 8 單元 幾時幾分', u9: '第 9 單元 3、6、7、9 的乘法', u10: '第 10 單元 平面圖形'
  };
  const U = (no, title, levels, bank, names) => ({ no, title, levels, bankUnits: (bank || levels).map(l => B[l]), names });
  window.BOOK = {
    subject: 'math', grade: 2, sem: '上', defaultVersion: 'nani',
    versions: {
      nani: [U(1, '數到 300', ['u1']), U(2, '二位數的加減', ['u2']), U(3, '幾公分', ['u3']), U(4, '加減的關係與應用', ['u4']), U(5, '容量', ['u5']),
        U(6, '兩步驟的加減', ['u6']), U(7, '2、5、4、8 的乘法', ['u7']), U(8, '幾時幾分', ['u8']), U(9, '3、6、7、9 的乘法', ['u9']), U(10, '平面圖形', ['u10'])],
    }
  };
  // 第 1 單元的數：數到 300（u1 的關卡依這個出題）
  window.numMax = () => 300;
})();
