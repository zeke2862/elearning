/* 數學保衛戰｜國一下第二冊：可調整的數字（老師改這裡就好，不用動程式） */
window.GAME_CONFIG = {
  hearts: 5,            // 每關生命
  realTime: 90,         // 挑戰：每題限時（秒）
  hardTime: 60,         // 極限：每題限時（秒）
  realTiers: [[0.9, 4], [0.6, 3]],            // 挑戰：答對率 ≥90% 4 星、≥60% 3 星，低於 60% 沒過關
  hardTiers: [[1, 5], [0.8, 4], [0.6, 3]],    // 極限：100% 5 星、≥80% 4 星、≥60% 3 星
  easyStar2: 0.7,       // 教學：答對率 ≥70% 得 2 星
  easyStar3: 1,         // 教學：答對率 100% 而且沒用提示得 3 星
  endlessNeed: 3,       // 無極限：這一關拿到幾顆星才解鎖
  endlessSwitch: 15,    // 無極限：第幾題之後改用極限難度
  endlessRamp: 30,      // 無極限：每題限時從挑戰的秒數縮到極限的秒數，要多少題
  tutorMissMax: 1,      // 小老師帶做的題：失誤超過幾次就記答錯（1＝失誤 2 次以上記答錯）
  tutorDwellMs: 1500,   // 小老師做完後停留多久再送出答案（毫秒）
  report: {             // 學習回報（老師的 Google 試算表）：url 填 Apps Script 網頁應用程式網址，空白＝不回報
    url: "",
    key: ""             // 要跟 Apps Script 指令碼屬性 KEY 一樣（選填，防亂填）
  },
  relax: {              // 休息小遊戲
    streak: 4,          // 連續答對幾題後出現
    level: "easy",      // 電腦強度起點 easy / normal / hard（會依勝率自動調整）
    unlockWins: 3,      // 同一款贏電腦幾次後，可在首頁「遊戲區」直接玩
    dailyLimit: 2,      // 遊戲區每一款每天最多玩幾回
    rewardMode: "random", // random／chest（抽卡券）／stage（金幣）
    stageCoins: 50,     // 關卡獎勵的金幣數
    exclude: ["go9", "xiangqi", "banqi", "checkers"] // 太長的遊戲不放
  }
};
