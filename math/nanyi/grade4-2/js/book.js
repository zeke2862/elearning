'use strict';
/* 南一版 四年級下學期：單元與關卡對照，給 nanyi.js（KGVer）用。
   levels＝遊戲內部單元代號，names＝卡片裡關卡小標題用的名稱，bankUnits＝exam-bank.js 裡對應的 unit 名稱。 */
(function () {
  const B = {
    big: '多位數的乘與除', quad: '垂直、平行與四邊形', fadd: '同分母分數的加減與整數倍', appr: '概數',
    chart: '長條圖與折線圖', dmul: '小數乘以整數', peri: '周長與面積', equiv: '等值分數',
    time: '時間的計算', vol: '體積與立方公分', rule: '數量規律', simp: '四則運算與簡化計算'
  };
  const u = (no, title, ids) => ({ no, title, levels: ids, bankUnits: ids.map(id => B[id]) });
  window.BOOK = {
    subject: 'math', grade: 4, sem: '下', defaultVersion: 'nani', bankNames: B,
    versions: {
      nani: [
        u(1, '多位數的乘與除', ['big']), u(2, '四邊形', ['quad']), u(3, '分數的加減和整數倍', ['fadd']),
        u(4, '概數', ['appr']), u(5, '統計圖表', ['chart']), u(6, '小數乘以整數', ['dmul']),
        u(7, '周長和面積', ['peri']), u(8, '等值分數', ['equiv']), u(9, '時間的加減', ['time']), u(10, '立方公分', ['vol'])
      ],
    }
  };
})();
