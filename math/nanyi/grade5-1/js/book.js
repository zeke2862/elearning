'use strict';
/* 南一版 五年級上學期：單元與關卡對照，給 nanyi.js（KGVer）用。
   levels＝遊戲內部單元代號，names＝卡片裡關卡小標題用的名稱，bankUnits＝exam-bank.js 裡對應的 unit 名稱。 */
(function () {
  const B = {
    u1: '第 1 單元 折線圖', u2: '第 2 單元 因數和倍數', u3: '第 3 單元 多邊形', u4: '第 4 單元 擴分、約分和通分', u5: '第 5 單元 線對稱圖形',
    u6: '第 6 單元 異分母分數的加減', u7: '第 7 單元 整數四則計算', u8: '第 8 單元 平行四邊形、三角形和梯形的面積', u9: '第 9 單元 時間的乘除', u10: '第 10 單元 正方體和長方體'
  };
  const U = (no, title, levels, names) => ({ no, title, levels, bankUnits: levels.map(l => B[l]), names });
  window.BOOK = {
    subject: 'math', grade: 5, sem: '上', defaultVersion: 'nani',
    versions: {
      nani: [U(1, '折線圖', ['u1']), U(2, '因數和倍數', ['u2']), U(3, '多邊形', ['u3']), U(4, '擴分、約分和通分', ['u4']), U(5, '線對稱圖形', ['u5']),
        U(6, '異分母分數的加減', ['u6']), U(7, '整數四則計算', ['u7']), U(8, '平行四邊形、三角形和梯形的面積', ['u8']), U(9, '時間的乘除', ['u9']), U(10, '正方體和長方體', ['u10'])],
    }
  };
})();
