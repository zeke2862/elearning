/* game-config.js ── 全遊戲數值設定檔（由數值修改器產生於 2026/10/16 下午7:27:45）
   用法：覆蓋遊戲資料夾裡的 game-config.js，學生重新整理即可套用。 */
window.GAME_CONFIG_DEFAULT = {
 "stars": {
  "easy": [
   {
    "acc": 0.6,
    "stars": 1
   },
   {
    "acc": 0.8,
    "stars": 2
   },
   {
    "acc": 1,
    "stars": 2.5
   }
  ],
  "real": [
   {
    "acc": 0.6,
    "stars": 3
   },
   {
    "acc": 0.9,
    "stars": 4
   }
  ],
  "hard": [
   {
    "acc": 0.6,
    "stars": 3
   },
   {
    "acc": 0.8,
    "stars": 4
   },
   {
    "acc": 1,
    "stars": 5
   }
  ],
  "endlessNeed": 3,
  "maxStar": 5
 },
 "stage": {
  "hardHeartLoss": 2,
  "normalHeartLoss": 1,
  "reviveHearts": 3,
  "pityFails": 2,
  "timeScaleReal": 1,
  "timeScaleHard": 1,
  "endlessRamp": 30,
  "endlessSwitch": 15
 },
 "exp": {
  "base": 50,
  "quad": 50,
  "perCorrect": 10,
  "perWrong": 1
 },
 "economy": {
  "goldPerStar": 20,
  "meritBoostPct": 50
 },
 "chest": {
  "perClear": 1,
  "perStagePerDay": 2,
  "fragNeed": 10,
  "prob": [
   90,
   9,
   0.7,
   0.3
  ],
  "tierMinStars": [
   0,
   3,
   4,
   5
  ]
 },
 "equip": {
  "qualityMul": {
   "normal": 1,
   "fine": 2,
   "legend": 2.5,
   "myth": 8
  },
  "forgePct": 10,
  "forgeMax": 5
 },
 "stats": {
  "base": {
   "hp": 1000,
   "mp": 300,
   "atk": 50,
   "matk": 50,
   "spd": 100,
   "def": 20,
   "mdef": 20
  },
  "growth": {
   "hp": 100,
   "mp": 30,
   "atk": 5,
   "matk": 5,
   "def": 3,
   "mdef": 3,
   "spd": 1
  }
 },
 "proRatio": {
  "聖騎士": {
   "hp": 1.1,
   "atk": 1,
   "def": 1.4,
   "spd": 0.9,
   "matk": 0.8,
   "mdef": 1.2
  },
  "刺客": {
   "hp": 0.9,
   "atk": 1.2,
   "def": 0.8,
   "spd": 1.5,
   "matk": 0.9,
   "mdef": 0.8
  },
  "狂戰士": {
   "hp": 1.4,
   "atk": 1.4,
   "def": 1,
   "spd": 0.9,
   "matk": 0.6,
   "mdef": 0.8
  },
  "大魔導士": {
   "hp": 0.8,
   "atk": 0.7,
   "def": 0.7,
   "spd": 1,
   "matk": 1.5,
   "mdef": 1.4
  }
 },
 "battle": {
  "damageMin": 0.8,
  "damageMax": 1.1,
  "defendMul": 2,
  "releaseMul": 3,
  "chargeRecoil": 0.5,
  "revivePct": 30,
  "normalMoves": [
   {
    "id": "fist",
    "name": "拳",
    "mult": 0.5
   },
   {
    "id": "kick",
    "name": "腳",
    "mult": 0.7
   },
   {
    "id": "charge",
    "name": "衝撞",
    "mult": 0.8
   },
   {
    "id": "slash",
    "name": "劍砍",
    "mult": 1
   }
  ],
  "magicMoves": [
   {
    "id": "s",
    "name": "小",
    "mp": 30,
    "mult": 1
   },
   {
    "id": "m",
    "name": "中",
    "mp": 45,
    "mult": 2
   },
   {
    "id": "l",
    "name": "大",
    "mp": 90,
    "mult": 3
   }
  ]
 },
 "skill": {
  "baseCost": 500,
  "costStep": 500,
  "uses": {
   "普通": 3,
   "強力": 2,
   "傳說": 1
  },
  "speedPctPerPoint": 3,
  "speedAttackSpdRatio": 0.5,
  "speedDamageRatio": 0.6,
  "tripleHits": 3,
  "aiSkillProb": 0.8
 },
 "rank": [
  {
   "min": 0,
   "name": "新兵"
  },
  {
   "min": 8,
   "name": "伍長"
  },
  {
   "min": 20,
   "name": "校尉"
  },
  {
   "min": 40,
   "name": "將軍"
  },
  {
   "min": 67,
   "name": "大元帥"
  },
  {
   "min": 97,
   "name": "兵仙"
  },
  {
   "min": 130,
   "name": "代數宗師"
  }
 ],
 "daily": {
  "perDay": 3,
  "dupBadgeMerit": 150,
  "pool": [
   {
    "id": "clear3",
    "t": "通關任意關卡 3 次",
    "k": "clear",
    "n": 3,
    "r": {
     "merit": 300
    }
   },
   {
    "id": "right30",
    "t": "累計答對 30 題",
    "k": "right",
    "n": 30,
    "r": {
     "exp": 200
    }
   },
   {
    "id": "hard1",
    "t": "修羅模式全對通關 1 次",
    "k": "hard",
    "n": 1,
    "r": {
     "badge": "dq_hard"
    }
   },
   {
    "id": "real2",
    "t": "實戰模式通關 2 次",
    "k": "real",
    "n": 2,
    "r": {
     "merit": 400
    }
   },
   {
    "id": "chest2",
    "t": "打開 2 個寶箱",
    "k": "chest",
    "n": 2,
    "r": {
     "item": "speed_s",
     "itemCount": 1
    }
   },
   {
    "id": "duel1",
    "t": "進行 1 場對戰",
    "k": "duel",
    "n": 1,
    "r": {
     "item": "heal_s",
     "itemCount": 2
    }
   },
   {
    "id": "buy1",
    "t": "在商店兌換 1 個道具",
    "k": "buy",
    "n": 1,
    "r": {
     "exp": 100
    }
   },
   {
    "id": "star1",
    "t": "拿到 1 顆新的星星",
    "k": "star",
    "n": 1,
    "r": {
     "badge": "dq_star"
    }
   }
  ],
  "badges": [
   {
    "id": "dq_hard",
    "icon": "🔥",
    "name": "修羅挑戰者"
   },
   {
    "id": "dq_star",
    "icon": "⭐",
    "name": "摘星新手"
   },
   {
    "id": "dq_d3",
    "icon": "☀️",
    "name": "三日勤學"
   },
   {
    "id": "dq_d7",
    "icon": "🌟",
    "name": "七日勤學"
   },
   {
    "id": "dq_d15",
    "icon": "🌠",
    "name": "十五日勤學"
   },
   {
    "id": "dq_d30",
    "icon": "👑",
    "name": "三十日勤學"
   }
  ],
  "streak": [
   {
    "days": 3,
    "badge": "dq_d3"
   },
   {
    "days": 7,
    "badge": "dq_d7"
   },
   {
    "days": 15,
    "badge": "dq_d15"
   },
   {
    "days": 30,
    "badge": "dq_d30"
   }
  ]
 },
 "shop": [
  {
   "id": "heal_s",
   "cat": "heal",
   "icon": "🧪",
   "name": "小補血瓶",
   "price": 300,
   "desc": "對戰中使用：恢復 30% 生命",
   "battle": {
    "heal": 0.3
   }
  },
  {
   "id": "heal_l",
   "cat": "heal",
   "icon": "⚗️",
   "name": "大補血瓶",
   "price": 800,
   "desc": "對戰中使用：恢復 70% 生命",
   "battle": {
    "heal": 0.7
   }
  },
  {
   "id": "revive",
   "cat": "revive",
   "icon": "🪶",
   "name": "復活羽毛",
   "price": 3000,
   "desc": "進入對戰時自動帶上（用掉 1 個）：生命歸零時以 30% 生命復活一次",
   "passive": true
  },
  {
   "id": "revive_m",
   "cat": "revive",
   "icon": "💖",
   "name": "戰場復活藥",
   "price": 800,
   "desc": "闖關時城牆被打倒的瞬間可以使用：恢復 3 顆心繼續作答（每次闖關限用 1 瓶）",
   "stageUse": true
  },
  {
   "id": "speed_s",
   "cat": "speed",
   "icon": "💨",
   "name": "疾風藥水",
   "price": 600,
   "desc": "對戰中使用：本場速度 +30%（每場限用 1 次）",
   "battle": {
    "spd": 0.3
   }
  },
  {
   "id": "mb_s",
   "cat": "points",
   "icon": "🏅",
   "name": "戰功加成券",
   "price": 600,
   "desc": "使用：接下來 3 次通關，戰功 +50%",
   "fx": {
    "mboost": 3
   }
  },
  {
   "id": "exp_s",
   "cat": "exp",
   "icon": "📘",
   "name": "經驗書（小）",
   "price": 500,
   "desc": "使用：經驗值 +100",
   "fx": {
    "exp": 100
   }
  },
  {
   "id": "exp_l",
   "cat": "exp",
   "icon": "📚",
   "name": "經驗書（大）",
   "price": 2000,
   "desc": "使用：經驗值 +500",
   "fx": {
    "exp": 500
   }
  },
  {
   "id": "forge",
   "cat": "forge",
   "icon": "🔨",
   "name": "鍛造石",
   "price": 1200,
   "desc": "使用：選一件已擁有的裝備，鍛造等級 +1（數值 +10%，最高 +5）",
   "fx": {
    "forge": 1
   }
  },
  {
   "id": "body",
   "cat": "body",
   "icon": "🧬",
   "name": "體質調整券",
   "price": 10000,
   "desc": "使用：選一項天生體質（HP／ATK／DEF／SPD／MATK／MDEF），數值 +1",
   "fx": {
    "body": 1
   }
  },
  {
   "id": "reroll",
   "cat": "equip",
   "icon": "💎",
   "name": "洗鍊石",
   "price": 9000,
   "desc": "使用：選一件已擁有的裝備，重新洗鍊它的基礎數值（結果隨機）",
   "fx": {
    "reroll": 1
   }
  }
 ]
};
window.GAME_CONFIG_LABELS = {
 "stars": "⭐ 星數標準",
 "stars.easy": "練兵模式：正確率達標 → 星數（取達標中最高的）",
 "stars.real": "實戰模式：正確率達標 → 星數",
 "stars.hard": "修羅模式：正確率達標 → 星數",
 "stars.easy[].acc": "正確率（0.6＝60%）",
 "stars.real[].acc": "正確率（0.6＝60%）",
 "stars.hard[].acc": "正確率（0.6＝60%）",
 "stars.easy[].stars": "星數",
 "stars.real[].stars": "星數",
 "stars.hard[].stars": "星數",
 "stars.endlessNeed": "解鎖「無極限挑戰」所需星數",
 "stars.maxStar": "星數上限（只影響畫面顯示）",
 "stage": "🏰 關卡規則",
 "stage.hardHeartLoss": "修羅模式：答錯扣幾顆心",
 "stage.normalHeartLoss": "練兵／實戰：答錯扣幾顆心",
 "stage.reviveHearts": "使用戰場復活藥後，恢復幾顆心",
 "stage.pityFails": "連續失敗幾次後，顯示練習建議",
 "stage.timeScaleReal": "實戰模式作答時間倍率（1＝原本，0.8＝縮短 20%）",
 "stage.timeScaleHard": "修羅模式作答時間倍率",
 "stage.endlessRamp": "無極限：作答到第幾題時，時間縮到修羅速度",
 "stage.endlessSwitch": "無極限：第幾題之後改用修羅難度出題",
 "exp": "📘 經驗值與等級",
 "exp.base": "升級所需經驗：基本值（需求＝基本值＋等級²×係數）",
 "exp.quad": "升級所需經驗：等級平方係數",
 "exp.perCorrect": "答對 1 題得到的經驗值",
 "exp.perWrong": "答錯 1 題得到的經驗值",
 "economy": "🏅 戰功與金幣",
 "economy.goldPerStar": "每拿到 1 顆新星得到的金幣（金幣用途研究中）",
 "economy.meritBoostPct": "戰功加成券：戰功增加的百分比",
 "chest": "📦 寶箱與碎片",
 "chest.perClear": "每次通關獲得的寶箱數",
 "chest.perStagePerDay": "同一小關每天最多給幾次寶箱",
 "chest.fragNeed": "合成裝備所需的同品質碎片數",
 "chest.prob": "抽碎片機率（%）：依序＝與星數對應品質相差 0、1、2、3 階（同距離的機率由上下兩階平分）",
 "chest.tierMinStars": "各品質對應的最低星數：依序＝普通、精良、傳說、神話",
 "equip": "⚔️ 裝備",
 "equip.qualityMul": "各品質的數值倍率",
 "equip.qualityMul.normal": "普通",
 "equip.qualityMul.fine": "精良",
 "equip.qualityMul.legend": "傳說",
 "equip.qualityMul.myth": "神話",
 "equip.forgePct": "鍛造每級增加的數值（%）",
 "equip.forgeMax": "鍛造最高等級",
 "stats": "📊 基礎數值（舊公式備用；魔力 MP 目前仍使用這裡的魔力基礎與成長）",
 "stats.base": "基礎值",
 "stats.growth": "每升 1 級增加",
 "proRatio": "🎭 職業比例（對戰基本值 ＝ 職業比例 ×（六項數值 × 等級 ＋ 裝備效果））",
 "battle": "⚔️ 對戰規則",
 "battle.damageMin": "傷害隨機範圍：下限倍率",
 "battle.damageMax": "傷害隨機範圍：上限倍率",
 "battle.defendMul": "防禦時，防禦力的倍數",
 "battle.releaseMul": "大魔法釋放時，魔攻倍數",
 "battle.chargeRecoil": "衝撞反噬：自己受到傷害的比例",
 "battle.revivePct": "復活羽毛復活時回復的生命（%）",
 "battle.normalMoves": "普通攻擊招式（倍率＝攻擊力的倍數）",
 "battle.normalMoves[].id": "代號（請勿改）",
 "battle.normalMoves[].name": "名稱",
 "battle.normalMoves[].mult": "倍率",
 "battle.magicMoves": "魔法招式",
 "battle.magicMoves[].id": "代號（請勿改）",
 "battle.magicMoves[].name": "名稱",
 "battle.magicMoves[].mp": "消耗魔力",
 "battle.magicMoves[].mult": "魔攻倍率",
 "skill": "🔮 研發招式",
 "skill.baseCost": "第一次研發招式的戰功費用",
 "skill.costStep": "每研發一次，費用增加多少戰功",
 "skill.uses": "每場對戰各稀有度招式的使用次數",
 "skill.uses.普通": "普通",
 "skill.uses.強力": "強力",
 "skill.uses.傳說": "傳說",
 "skill.speedPctPerPoint": "招式的速度加減：引擎 1 點 ＝ 對戰速度幾 %",
 "skill.speedAttackSpdRatio": "疾風雙刃：傷害＝攻擊力＋速度×此倍數（無視防禦）",
 "skill.speedDamageRatio": "迅雷閃光刺：傷害＝速度×招式倍率×此倍數（無視防禦）",
 "skill.tripleHits": "神速術：下一次普通攻擊連擊幾次",
 "skill.aiSkillProb": "幽靈 AI 使用招式的機率（0～1）",
 "rank": "🎖️ 軍階（累計星數門檻）",
 "rank[].min": "所需累計星數",
 "rank[].name": "軍階名稱",
 "daily": "📅 每日任務",
 "daily.perDay": "每天出幾個任務",
 "daily.dupBadgeMerit": "已擁有徽章時，改發多少戰功",
 "daily.pool": "任務庫（每天依日期從這裡抽）",
 "daily.pool[].id": "代號（請勿重複）",
 "daily.pool[].t": "任務說明",
 "daily.pool[].k": "計算項目（clear通關／right答對題數／hard修羅通關／real實戰通關／chest開寶箱／duel對戰／buy兌換／star新星）",
 "daily.pool[].n": "目標數量",
 "daily.pool[].r.merit": "獎勵：戰功",
 "daily.pool[].r.exp": "獎勵：經驗值",
 "daily.pool[].r.badge": "獎勵：徽章代號",
 "daily.pool[].r.item": "獎勵：道具代號",
 "daily.pool[].r.itemCount": "獎勵：道具數量",
 "daily.badges": "特殊徽章清單",
 "daily.badges[].id": "代號",
 "daily.badges[].icon": "圖示",
 "daily.badges[].name": "名稱",
 "daily.streak": "累計全部完成天數 → 徽章",
 "daily.streak[].days": "累計天數",
 "daily.streak[].badge": "徽章代號",
 "shop": "🛒 商店道具（說明文字請和效果數字一起修改）",
 "shop[].id": "代號（請勿改）",
 "shop[].cat": "分類代號（請勿改）",
 "shop[].icon": "圖示",
 "shop[].name": "名稱",
 "shop[].price": "價格（戰功）",
 "shop[].desc": "說明文字",
 "shop[].battle.heal": "對戰回血比例（0.3＝30%）",
 "shop[].battle.spd": "對戰速度提升比例（0.3＝30%）",
 "shop[].fx.exp": "使用得到的經驗值",
 "shop[].fx.mboost": "戰功加成券：可用幾次通關",
 "shop[].fx.forge": "鍛造等級增加",
 "shop[].fx.body": "體質數值增加",
 "shop[].fx.reroll": "洗鍊（1＝啟用）",
 "stats.base.hp": "血量 HP",
 "stats.growth.hp": "血量 HP",
 "proRatio.聖騎士.hp": "血量 HP",
 "proRatio.刺客.hp": "血量 HP",
 "proRatio.狂戰士.hp": "血量 HP",
 "proRatio.大魔導士.hp": "血量 HP",
 "stats.base.atk": "物攻 ATK",
 "stats.growth.atk": "物攻 ATK",
 "proRatio.聖騎士.atk": "物攻 ATK",
 "proRatio.刺客.atk": "物攻 ATK",
 "proRatio.狂戰士.atk": "物攻 ATK",
 "proRatio.大魔導士.atk": "物攻 ATK",
 "stats.base.def": "物防 DEF",
 "stats.growth.def": "物防 DEF",
 "proRatio.聖騎士.def": "物防 DEF",
 "proRatio.刺客.def": "物防 DEF",
 "proRatio.狂戰士.def": "物防 DEF",
 "proRatio.大魔導士.def": "物防 DEF",
 "stats.base.spd": "速度 SPD",
 "stats.growth.spd": "速度 SPD",
 "proRatio.聖騎士.spd": "速度 SPD",
 "proRatio.刺客.spd": "速度 SPD",
 "proRatio.狂戰士.spd": "速度 SPD",
 "proRatio.大魔導士.spd": "速度 SPD",
 "stats.base.matk": "魔攻 MATK",
 "stats.growth.matk": "魔攻 MATK",
 "proRatio.聖騎士.matk": "魔攻 MATK",
 "proRatio.刺客.matk": "魔攻 MATK",
 "proRatio.狂戰士.matk": "魔攻 MATK",
 "proRatio.大魔導士.matk": "魔攻 MATK",
 "stats.base.mdef": "魔防 MDEF",
 "stats.growth.mdef": "魔防 MDEF",
 "proRatio.聖騎士.mdef": "魔防 MDEF",
 "proRatio.刺客.mdef": "魔防 MDEF",
 "proRatio.狂戰士.mdef": "魔防 MDEF",
 "proRatio.大魔導士.mdef": "魔防 MDEF",
 "stats.base.mp": "魔力 MP",
 "stats.growth.mp": "魔力 MP",
 "proRatio.聖騎士.mp": "魔力 MP",
 "proRatio.刺客.mp": "魔力 MP",
 "proRatio.狂戰士.mp": "魔力 MP",
 "proRatio.大魔導士.mp": "魔力 MP",
 "proRatio.聖騎士": "聖騎士",
 "proRatio.刺客": "刺客",
 "proRatio.狂戰士": "狂戰士",
 "proRatio.大魔導士": "大魔導士"
};
window.GAME_CONFIG_BOOT = function () {
  function merge(a, b) {
    for (var k in b) {
      if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) merge(a[k], b[k]);
      else a[k] = b[k];
    }
    return a;
  }
  var c = JSON.parse(JSON.stringify(window.GAME_CONFIG_DEFAULT));
  try { var o = JSON.parse(localStorage.getItem('jb-config-override') || 'null'); if (o) merge(c, o); } catch (e) {}
  window.GAME_CONFIG = c;
};
window.GAME_CONFIG_BOOT();
