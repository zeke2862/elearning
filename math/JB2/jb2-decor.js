/* jb2-decor.js — 小屋「權限」與「30 樣裝飾品」商品目錄。
 * 這個檔案會在遊戲啟動前，把下面的商品自動加進商店（GAME_CONFIG.shop.items），
 * 所以不用去改 game-config.js，也不怕用「修改器」重存設定檔時被蓋掉。
 *
 * 想調價格：改每一項的 days（天數×每日基準收入＝價格），或加 price: 數字 直接指定。
 * 圖片：全部放在 images/decor/ 資料夾，檔名＝商品 id + .webp（沒有圖時，遊戲會自動用表情符號代替，不會壞）。
 * 提示詞請看 JB2-小屋裝飾品提示詞.md
 */
(function () {
  'use strict';

  /* ===== 小屋編輯權限（用金幣開通；沒圖，用表情符號） ===== */
  var PERMS = [
    { id: 'perm_move',  name: '🪑 家具擺設權',   days: 3, icon: '🪑', effect: '開通後：可拖曳、放大縮小、旋轉、翻面家具，也能把家具收起來或重新擺出來' },
    { id: 'perm_deco',  name: '✨ 小配件裝飾權', days: 4, icon: '✨', effect: '開通後：可以把買到的小配件（畫框、掛鐘、燈籠…）貼在牆上、擺在屋裡' },
    { id: 'perm_wall',  name: '🖼️ 壁紙更換權',  days: 3, icon: '🖼️', effect: '開通後：可以更換買到的壁紙', need: { type: 'total', min: 10 } },
    { id: 'perm_color', name: '🎨 調色權',       days: 6, icon: '🎨', effect: '開通後：家具、小配件、寵物、壁紙都能自己調顏色和亮度', need: { type: 'total', min: 25 } },
    { id: 'perm_pet',   name: '🐾 寵物放養權',   days: 3, icon: '🐾', effect: '開通後：可以決定寵物在小屋裡站在哪裡、多大、面向哪邊' },
    { id: 'perm_visit', name: '🚪 串門子權',     days: 2, icon: '🚪', effect: '開通後：可以去參觀好友的小屋' }
  ].map(function (p) { p.slot = 'perm'; if (!p.need) p.need = null; return p; });

  /* ===== 30 樣裝飾品 ===== */
  /* kind：floor＝地上、wall＝牆上、ceil＝天花板（決定剛買到時自動擺在哪裡）　w＝預設寬度（佔房間寬度的 %）　copies＝最多可擺幾個 */
  function P(id, name, icon, days, need) { return { id: id, slot: 'pet', name: name, icon: icon, days: days, need: need || null, effect: '小屋寵物（也會跟著勇者走）', img: 'images/decor/' + id + '.webp' }; }
  function F(id, name, icon, days, kind, w, need, eff) { return { id: id, slot: 'furn', name: name, icon: icon, days: days, need: need || null, kind: kind, w: w, copies: 1, effect: eff || '小屋家具（需要擺設權才能搬動）', img: 'images/decor/' + id + '.webp' }; }
  function W(id, name, icon, days, bg, need) { return { id: id, slot: 'wall', name: name, icon: icon, days: days, need: need || null, bg: bg, effect: '小屋壁紙（需要壁紙更換權才能換上）', img: 'images/decor/' + id + '.webp' }; }
  function D(id, name, icon, days, kind, w, copies, need) { return { id: id, slot: 'deco', name: name, icon: icon, days: days, need: need || null, kind: kind, w: w, copies: copies || 1, effect: '小配件（需要小配件裝飾權才能擺放）' + (copies > 1 ? '，最多擺 ' + copies + ' 個' : ''), img: 'images/decor/' + id + '.webp' }; }
  var T = function (n) { return { type: 'total', min: n }; };

  var ITEMS = [
    /* --- 寵物 6 --- */
    P('pet_bunny',   '算盤小兔',     '🐰', 2.5),
    P('pet_owl',     '博士貓頭鷹',   '🦉', 3),
    P('pet_turtle',  '公式小烏龜',   '🐢', 3.5, T(10)),
    P('pet_robot',   '圓周率機器人', '🤖', 5,   T(25)),
    P('pet_unicorn', '彩虹小獨角獸', '🦄', 8,   T(40)),
    P('pet_phoenix', '小鳳凰',       '🦅', 10,  T(65)),
    /* --- 家具 10 --- */
    F('furn_sofa',       '魔法沙發',   '🛋️', 2.5, 'floor', 17),
    F('furn_table',      '茶具圓桌',   '☕', 2,   'floor', 13),
    F('furn_bookpile',   '書本小塔',   '📖', 1.5, 'floor', 8),
    F('furn_plant',      '發光盆栽',   '🪴', 1.5, 'floor', 8),
    F('furn_globe',      '星象地球儀', '🌍', 3,   'floor', 9,  T(10)),
    F('furn_chest',      '勇者寶箱',   '🧰', 3,   'floor', 11, T(15)),
    F('furn_cauldron',   '魔法大鍋',   '🍲', 3.5, 'floor', 12, T(20)),
    F('furn_fireplace',  '暖暖壁爐',   '🔥', 4.5, 'floor', 17, T(30)),
    F('furn_blackboard', '數學小黑板', '🧮', 3,   'wall',  17, T(10)),
    F('furn_chandelier', '水晶吊燈',   '💎', 5,   'ceil',  13, T(45)),
    /* --- 壁紙 6（底下的 CSS 色是沒圖時的備用背景；地平線約在 62%） --- */
    W('wall_forest', '森林樹屋壁紙', '🌲', 3,   'linear-gradient(#bfe6b4 0 62%,#6b4a22 62% 100%)'),
    W('wall_sea',    '海底世界壁紙', '🐟', 3.5, 'linear-gradient(#8fd8ee 0 62%,#d9c58f 62% 100%)', T(10)),
    W('wall_candy',  '糖果屋壁紙',   '🍭', 4,   'linear-gradient(#ffd0e6 0 62%,#f5a8c8 62% 100%)', T(20)),
    W('wall_castle', '古堡石牆壁紙', '🏰', 4,   'linear-gradient(#b8b6c4 0 62%,#6d6a7a 62% 100%)', T(30)),
    W('wall_sakura', '櫻花和室壁紙', '🌸', 5,   'linear-gradient(#ffe3ea 0 62%,#c99a62 62% 100%)', T(45)),
    W('wall_space',  '星空太空壁紙', '🚀', 6,   'linear-gradient(#0b1030 0 62%,#2a2f66 62% 100%)', T(65)),
    /* --- 小配件 8 --- */
    D('deco_frame',   '金邊畫框',     '🖼️', 1,   'wall',  9,  3),
    D('deco_clock',   '數字掛鐘',     '🕰️', 1.5, 'wall',  7,  1),
    D('deco_poster',  '勇者海報',     '📜', 1,   'wall',  8,  3),
    D('deco_lantern', '紙燈籠',       '🏮', 1.5, 'ceil',  6,  3),
    D('deco_flag',    '彩旗串',       '🎏', 1.5, 'wall',  16, 2),
    D('deco_star',    '吊掛星星',     '⭐', 1,   'ceil',  6,  4),
    D('deco_candle',  '蠟燭組',       '🕯️', 1,   'floor', 5,  3),
    D('deco_cushion', '圓圓抱枕',     '🧸', 1,   'floor', 6,  3)
  ];

  window.JB2Decor = {
    perms: PERMS,
    items: ITEMS,
    permIds: PERMS.map(function (p) { return p.id; }),
    extend: function (GC) {
      if (!GC || !GC.shop || GC._decorDone) return;
      GC._decorDone = true;
      var have = {}; GC.shop.items.forEach(function (i) { have[i.id] = 1; });
      PERMS.concat(ITEMS).forEach(function (it) { if (!have[it.id]) GC.shop.items.push(JSON.parse(JSON.stringify(it))); });
      var tabs = GC.shop.tabs, k = {}; tabs.forEach(function (t) { k[t[0]] = 1; });
      var at = Math.max(0, tabs.findIndex(function (t) { return t[0] === 'furn'; }));
      [['perm', '🔑 小屋權限'], ['wall', '🖼️ 壁紙'], ['deco', '✨ 小配件']].reverse().forEach(function (t) { if (!k[t[0]]) tabs.splice(at + 1, 0, t); });
    }
  };
  if (window.GAME_CONFIG) window.JB2Decor.extend(window.GAME_CONFIG);
})();
