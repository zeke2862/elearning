/* game-config.js ── 全遊戲數值設定檔（由數值修改器產生於 2026/10/18 上午11:49:48）
   用法：覆蓋遊戲資料夾裡的 game-config.js，學生重新整理即可套用。 */
window.GAME_CONFIG_DEFAULT = {
 "relax": {
  "enabled": 1,
  "every": 5,
  "streak": 5,
  "level": "easy",
  "dailyRewardLimit": 6,
  "excludeGames": "",
  "rewardItems": {
   "heal_s": 30,
   "heal_m": 20,
   "heal_l": 5,
   "shield_s": 15,
   "shield_m": 6,
   "shield_l": 2,
   "speed_s": 10,
   "revive_m": 12,
   "mb_s": 8
  }
 },
 "gifts": [],
 "poses": {
  "0": {
   "idle": "images/pose/rank0-idle.png",
   "attack": "images/pose/rank0-attack.png",
   "hit": "images/pose/rank0-hit.png",
   "win": "images/pose/rank0-win.png"
  },
  "1": {
   "idle": "",
   "attack": "",
   "hit": "",
   "win": ""
  },
  "2": {
   "idle": "",
   "attack": "",
   "hit": "",
   "win": ""
  },
  "3": {
   "idle": "",
   "attack": "",
   "hit": "",
   "win": ""
  },
  "4": {
   "idle": "",
   "attack": "",
   "hit": "",
   "win": ""
  },
  "5": {
   "idle": "",
   "attack": "",
   "hit": "",
   "win": ""
  },
  "6": {
   "idle": "",
   "attack": "",
   "hit": "",
   "win": ""
  }
 },
 "rig": {
  "height": 72, "shoulderX": 0.6945, "shoulderY": 0.4,
  "pivotX": 0.165, "pivotY": 0.482, "armScale": 1.86,
  "restAngle": 0, "raiseAngle": -72, "slashAngle": 58,
  "raiseMs": 260, "slashMs": 130, "backMs": 300,
  "tipX": 545, "tipY": 167, "guardX": 332, "guardY": 372, "trail": 1
 },
  "skillLab": {
  "tiers": [
   { "name": "粗胚", "uses": 40, "dmg": 0.5, "stat": 0.1,  "heal": 0.1,  "poison": 0.02, "blind": 0.15, "prob": 40 },
   { "name": "普通", "uses": 20, "dmg": 0.9, "stat": 0.18, "heal": 0.18, "poison": 0.03, "blind": 0.22, "prob": 28 },
   { "name": "精良", "uses": 15, "dmg": 1.3, "stat": 0.28, "heal": 0.28, "poison": 0.04, "blind": 0.3,  "prob": 18 },
   { "name": "強力", "uses": 10, "dmg": 1.8, "stat": 0.42, "heal": 0.42, "poison": 0.06, "blind": 0.38, "prob": 10 },
   { "name": "傳說", "uses": 5,  "dmg": 2.6, "stat": 0.6,  "heal": 0.6,  "poison": 0.08, "blind": 0.45, "prob": 4 }
  ],
  "upCap": 1,
  "dnCap": 0.5,
  "layerCap": 3,
  "healCapHp": 0.6,
  "healCapMp": 0.6,
  "poisonLayerCap": 3,
  "poisonTurns": 3,
  "blindTurns": 2,
  "mpPerTier": 15,
  "bagMax": 12,
  "baseCost": 500,
  "costStep": 500,
  "aiSkillProb": 0.5,
  "effWeight": {
   "dmg": 22, "up_atk": 8, "up_def": 7, "up_matk": 8, "up_mdef": 7, "up_spd": 8,
   "dn_atk": 6, "dn_def": 5, "dn_matk": 6, "dn_mdef": 5, "dn_spd": 6,
   "heal_hp": 8, "heal_mp": 6, "poison": 8, "blind": 6
  }
 },
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
   },
   "daily": 10,
   "file": "potion-heal-small"
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
   },
   "daily": 3,
   "file": "potion-heal-large"
  },
  {
   "id": "revive",
   "cat": "revive",
   "icon": "🪶",
   "name": "復活羽毛",
   "price": 3000,
   "desc": "進入對戰時自動帶上（用掉 1 個）：生命歸零時以 30% 生命復活一次",
   "passive": true,
   "daily": 1,
   "file": "feather-revive"
  },
  {
   "id": "revive_m",
   "cat": "revive",
   "icon": "💖",
   "name": "戰場復活藥",
   "price": 800,
   "desc": "闖關時城牆被打倒的瞬間可以使用：恢復 3 顆心繼續作答（每次闖關限用 1 瓶）",
   "stageUse": true,
   "daily": 3,
   "file": "potion-revive"
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
   },
   "daily": 5,
   "file": "potion-speed"
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
   },
   "daily": 3,
   "file": "ticket-merit-small"
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
   },
   "daily": 5,
   "file": "book-exp-small"
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
   },
   "daily": 2,
   "file": "book-exp-large"
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
   },
   "daily": 3,
   "file": "stone-forge"
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
   },
   "daily": 1,
   "file": "ticket-body"
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
   },
   "daily": 2,
   "file": "stone-reroll"
  },
  {
   "id": "heal_m",
   "cat": "heal",
   "icon": "🍶",
   "name": "中補血瓶",
   "price": 500,
   "desc": "對戰中使用：恢復 50% 生命（每場最多喝 3 瓶血）",
   "battle": {
    "heal": 0.5
   },
   "daily": 6,
   "file": "potion-heal-medium"
  },
  {
   "id": "shield_s",
   "cat": "shield",
   "icon": "🛡️",
   "name": "小護盾",
   "price": 500,
   "desc": "對戰中使用：擋下對方的下 1 次攻擊（傷害變 0）",
   "battle": {
    "shield": 1
   },
   "daily": 5,
   "file": "shield-small"
  },
  {
   "id": "shield_m",
   "cat": "shield",
   "icon": "🔰",
   "name": "中護盾",
   "price": 900,
   "desc": "對戰中使用：擋下對方的下 2 次攻擊",
   "battle": {
    "shield": 2
   },
   "daily": 3,
   "file": "shield-medium"
  },
  {
   "id": "shield_l",
   "cat": "shield",
   "icon": "🏰",
   "name": "城牆護盾",
   "price": 1300,
   "desc": "對戰中使用：擋下對方的下 3 次攻擊",
   "battle": {
    "shield": 3
   },
   "daily": 2,
   "file": "shield-castle"
  },
  {
   "id": "mb_l",
   "cat": "points",
   "icon": "🎖️",
   "name": "戰功加成券（大）",
   "price": 1000,
   "desc": "使用：接下來 6 次通關，戰功 +50%（每天限買 1 張，避免衝爆排行榜）",
   "fx": {
    "mboost": 6
   },
   "daily": 1,
   "file": "ticket-merit-large"
  },
  {
   "id": "ttl_1",
   "cat": "title",
   "icon": "📝",
   "name": "數學學徒",
   "price": 1500,
   "desc": "稱號：顯示在角色名稱前面",
   "cos": {
    "slot": "title",
    "text": "數學學徒"
   },
   "file": "title-apprentice"
  },
  {
   "id": "ttl_2",
   "cat": "title",
   "icon": "🧮",
   "name": "計算能手",
   "price": 3000,
   "desc": "稱號：顯示在角色名稱前面",
   "cos": {
    "slot": "title",
    "text": "計算能手"
   },
   "file": "title-calculator"
  },
  {
   "id": "ttl_3",
   "cat": "title",
   "icon": "🏹",
   "name": "因數獵人",
   "price": 4000,
   "desc": "稱號：顯示在角色名稱前面",
   "cos": {
    "slot": "title",
    "text": "因數獵人"
   },
   "file": "title-factor-hunter"
  },
  {
   "id": "ttl_4",
   "cat": "title",
   "icon": "💠",
   "name": "質數守護者",
   "price": 5000,
   "desc": "稱號：顯示在角色名稱前面",
   "cos": {
    "slot": "title",
    "text": "質數守護者"
   },
   "file": "title-prime-guardian"
  },
  {
   "id": "ttl_5",
   "cat": "title",
   "icon": "🥁",
   "name": "韓信再世",
   "price": 8000,
   "desc": "稱號：顯示在角色名稱前面",
   "cos": {
    "slot": "title",
    "text": "韓信再世"
   },
   "file": "title-han-xin"
  },
  {
   "id": "ttl_6",
   "cat": "title",
   "icon": "🔮",
   "name": "代數賢者",
   "price": 12000,
   "desc": "稱號：顯示在角色名稱前面",
   "cos": {
    "slot": "title",
    "text": "代數賢者"
   },
   "file": "title-algebra-sage"
  },
  {
   "id": "frm_1",
   "cat": "frame",
   "icon": "🟤",
   "name": "青銅光環",
   "price": 2000,
   "desc": "頭像框：角色頭像外圍的光環",
   "cos": {
    "slot": "frame",
    "color": "#d2a24c",
    "glow": 8
   },
   "file": "frame-bronze"
  },
  {
   "id": "frm_2",
   "cat": "frame",
   "icon": "🟢",
   "name": "翡翠光環",
   "price": 2500,
   "desc": "頭像框：角色頭像外圍的光環",
   "cos": {
    "slot": "frame",
    "color": "#43e0a8",
    "glow": 12
   },
   "file": "frame-jade"
  },
  {
   "id": "frm_3",
   "cat": "frame",
   "icon": "🔵",
   "name": "冰藍光環",
   "price": 4000,
   "desc": "頭像框：角色頭像外圍的光環",
   "cos": {
    "slot": "frame",
    "color": "#6ad0ff",
    "glow": 14
   },
   "file": "frame-ice"
  },
  {
   "id": "frm_4",
   "cat": "frame",
   "icon": "🔴",
   "name": "赤焰光環",
   "price": 4000,
   "desc": "頭像框：角色頭像外圍的光環",
   "cos": {
    "slot": "frame",
    "color": "#ff6a3d",
    "glow": 14
   },
   "file": "frame-flame"
  },
  {
   "id": "frm_5",
   "cat": "frame",
   "icon": "🟣",
   "name": "紫電光環",
   "price": 6000,
   "desc": "頭像框：角色頭像外圍的光環",
   "cos": {
    "slot": "frame",
    "color": "#b07cff",
    "glow": 18
   },
   "file": "frame-thunder"
  },
  {
   "id": "frm_6",
   "cat": "frame",
   "icon": "🌟",
   "name": "傳說金光",
   "price": 8000,
   "desc": "頭像框：最閃亮的金色光環",
   "cos": {
    "slot": "frame",
    "color": "#ffd84a",
    "glow": 24
   },
   "file": "frame-legend"
  },
  {
   "id": "acc_4",
   "cat": "acc",
   "icon": "🐱",
   "name": "貓咪夥伴",
   "price": 3000,
   "desc": "夥伴：站在勇者旁邊的陪在你身邊的小貓",
   "cos": {
    "slot": "acc",
    "emoji": "🐱",
    "pet": true
   },
   "file": "pet-cat"
  },
  {
   "id": "acc_5",
   "cat": "acc",
   "icon": "🦉",
   "name": "貓頭鷹博士",
   "price": 5000,
   "desc": "夥伴：站在勇者旁邊的聰明的貓頭鷹博士",
   "cos": {
    "slot": "acc",
    "emoji": "🦉",
    "pet": true
   },
   "file": "pet-owl"
  },
  {
   "id": "acc_8",
   "cat": "acc",
   "icon": "🐉",
   "name": "小龍夥伴",
   "price": 9000,
   "desc": "夥伴：站在勇者旁邊的會噴小火花的小龍",
   "cos": {
    "slot": "acc",
    "emoji": "🐉",
    "pet": true
   },
   "file": "pet-dragon"
  },
  {
   "id": "rename",
   "cat": "rename",
   "icon": "🪪",
   "name": "改名卡",
   "price": 2000,
   "desc": "使用：幫角色改一個新名字（最多 8 個字，不能使用不雅字眼）",
   "fx": {
    "rename": 1
   },
   "file": "card-rename"
  },
  {
   "id": "th_sea",
   "cat": "theme",
   "icon": "🏖️",
   "name": "海邊小屋",
   "price": 4000,
   "desc": "小屋主題：把大廳換成明亮的海邊小屋（到背包切換）",
   "cos": {
    "slot": "theme",
    "wall": "#bfe6f2",
    "wall2": "#8fcbe0",
    "floor": "#f1d9a0",
    "floor2": "#d9b56a",
    "rail": "#b07a3c"
   },
   "file": "theme-seaside"
  },
  {
   "id": "th_star",
   "cat": "theme",
   "icon": "🌌",
   "name": "星空閣樓",
   "price": 8000,
   "desc": "小屋主題：把大廳換成滿天星斗的閣樓",
   "cos": {
    "slot": "theme",
    "wall": "#2a2f6b",
    "wall2": "#171a45",
    "floor": "#6a5240",
    "floor2": "#3d2e24",
    "rail": "#8a6a3a"
   },
   "file": "theme-starry-attic"
  },
  {
   "id": "th_snow",
   "cat": "theme",
   "icon": "❄️",
   "name": "雪夜暖屋",
   "price": 8000,
   "desc": "小屋主題：把大廳換成溫暖的雪夜木屋",
   "cos": {
    "slot": "theme",
    "wall": "#e3ecf6",
    "wall2": "#b8c8dc",
    "floor": "#b5834f",
    "floor2": "#7e5233",
    "rail": "#6b4426"
   },
   "file": "theme-snow-cabin"
  },
  {
   "id": "th_magic",
   "cat": "theme",
   "icon": "🔮",
   "name": "魔法書房",
   "price": 15000,
   "desc": "小屋主題：把大廳換成神祕的魔法書房",
   "cos": {
    "slot": "theme",
    "wall": "#5a2f6d",
    "wall2": "#3a1c4a",
    "floor": "#74502f",
    "floor2": "#4a3220",
    "rail": "#b8863a"
   },
   "file": "theme-magic-study"
  },
  {
   "id": "th_magic_2",
   "cat": "theme",
   "name": "軍營",
   "price": 2000,
   "desc": "小屋主題：把大廳換成軍營",
   "cos": {
    "slot": "theme",
    "wall": "#5a2f6d",
    "wall2": "#3a1c4a",
    "floor": "#74502f",
    "floor2": "#4a3220",
    "rail": "#b8863a"
   },
   "file": "1",
   "icon": "🔮"
  },
  {
   "id": "th_magic_3",
   "cat": "theme",
   "name": "森林樹屋",
   "price": 2000,
   "desc": "小屋主題：把大廳換成森林樹屋",
   "cos": {
    "slot": "theme",
    "wall": "#5a2f6d",
    "wall2": "#3a1c4a",
    "floor": "#74502f",
    "floor2": "#4a3220",
    "rail": "#b8863a"
   },
   "file": "2",
   "icon": "🔮"
  },
  {
   "id": "th_magic_4",
   "cat": "theme",
   "name": "糖果屋",
   "price": 2000,
   "desc": "小屋主題：把大廳換成糖果屋",
   "cos": {
    "slot": "theme",
    "wall": "#5a2f6d",
    "wall2": "#3a1c4a",
    "floor": "#74502f",
    "floor2": "#4a3220",
    "rail": "#b8863a"
   },
   "file": "3",
   "icon": "🔮"
  },
  {
   "id": "th_magic_5",
   "cat": "theme",
   "name": "城堡",
   "price": 2000,
   "desc": "小屋主題：把大廳換成城堡",
   "cos": {
    "slot": "theme",
    "wall": "#5a2f6d",
    "wall2": "#3a1c4a",
    "floor": "#74502f",
    "floor2": "#4a3220",
    "rail": "#b8863a"
   },
   "file": "6",
   "icon": "🔮"
  },
  {
   "id": "dc_1",
   "cat": "decor",
   "icon": "🪴",
   "name": "盆栽",
   "price": 1500,
   "desc": "房間飾品：買了就會擺在大廳裡",
   "cos": {
    "slot": "decor",
    "emoji": "🪴",
    "x": 8,
    "y": 25,
    "size": 9
   },
   "file": "decor-plant"
  },
  {
   "id": "dc_2",
   "cat": "decor",
   "icon": "🎐",
   "name": "風鈴",
   "price": 2000,
   "desc": "房間飾品：掛在大廳的牆上",
   "cos": {
    "slot": "decor",
    "emoji": "🎐",
    "x": 88,
    "y": 64,
    "size": 6,
    "onWall": true
   },
   "file": "decor-windchime"
  },
  {
   "id": "dc_3",
   "cat": "decor",
   "icon": "🏮",
   "name": "紅燈籠",
   "price": 2500,
   "desc": "房間飾品：掛在大廳的牆上",
   "cos": {
    "slot": "decor",
    "emoji": "🏮",
    "x": 72,
    "y": 62,
    "size": 7,
    "onWall": true
   },
   "file": "decor-lantern"
  },
  {
   "id": "dc_4",
   "cat": "decor",
   "icon": "📚",
   "name": "書堆",
   "price": 3000,
   "desc": "房間飾品：買了就會擺在大廳裡",
   "cos": {
    "slot": "decor",
    "emoji": "📚",
    "x": 80,
    "y": 25,
    "size": 8
   },
   "file": "decor-books"
  },
  {
   "id": "dc_5",
   "cat": "decor",
   "icon": "🧸",
   "name": "玩偶",
   "price": 3500,
   "desc": "房間飾品：買了就會擺在大廳裡",
   "cos": {
    "slot": "decor",
    "emoji": "🧸",
    "x": 64,
    "y": 25,
    "size": 7
   },
   "file": "decor-plush"
  },
  {
   "id": "dc_6",
   "cat": "decor",
   "icon": "🖼️",
   "name": "掛畫",
   "price": 5000,
   "desc": "房間飾品：掛在大廳的牆上",
   "cos": {
    "slot": "decor",
    "emoji": "🖼️",
    "x": 18,
    "y": 58,
    "size": 10,
    "onWall": true
   },
   "file": "decor-painting"
  },
  {
   "id": "dc_7",
   "cat": "decor",
   "icon": "🕰️",
   "name": "古董時鐘",
   "price": 6000,
   "desc": "房間飾品：掛在大廳的牆上",
   "cos": {
    "slot": "decor",
    "emoji": "🕰️",
    "x": 50,
    "y": 66,
    "size": 8,
    "onWall": true
   },
   "file": "decor-clock"
  },
  {
   "id": "dc_8",
   "cat": "decor",
   "icon": "🏆",
   "name": "數學獎盃",
   "price": 8000,
   "desc": "房間飾品：擺在大廳裡，閃閃發亮",
   "cos": {
    "slot": "decor",
    "emoji": "🏆",
    "x": 91,
    "y": 27,
    "size": 7
   },
   "file": "decor-trophy"
  },
  {
   "id": "bk_1",
   "cat": "back",
   "icon": "🪽",
   "name": "光之翅膀",
   "price": 6000,
   "desc": "背後特效：在勇者背後展開光之翅膀（放在人物後面，不會蓋住人物）",
   "file": "wings-light",
   "cos": {
    "slot": "back",
    "kind": "wings",
    "c1": "#ffffff",
    "c2": "#ffe08a"
   }
  },
  {
   "id": "bk_2",
   "cat": "back",
   "icon": "🦇",
   "name": "暗影之翼",
   "price": 9000,
   "desc": "背後特效：在勇者背後展開暗影之翼",
   "file": "wings-shadow",
   "cos": {
    "slot": "back",
    "kind": "wings",
    "c1": "#b07cff",
    "c2": "#2a1650"
   }
  },
  {
   "id": "bk_3",
   "cat": "back",
   "icon": "😇",
   "name": "神聖光輪",
   "price": 4000,
   "desc": "背後特效：勇者身後散發金色光輪",
   "file": "halo-holy",
   "cos": {
    "slot": "back",
    "kind": "halo",
    "c1": "#ffd86b",
    "c2": "#fff3c0"
   }
  },
  {
   "id": "ft_1",
   "cat": "feet",
   "icon": "🔵",
   "name": "青色魔法陣",
   "price": 3000,
   "desc": "腳下特效：腳下浮現旋轉的魔法陣",
   "file": "circle-cyan",
   "cos": {
    "slot": "feet",
    "color": "#4fe0ff"
   }
  },
  {
   "id": "ft_2",
   "cat": "feet",
   "icon": "🟡",
   "name": "金色魔法陣",
   "price": 6000,
   "desc": "腳下特效：腳下浮現旋轉的魔法陣",
   "file": "circle-gold",
   "cos": {
    "slot": "feet",
    "color": "#ffd24a"
   }
  },
  {
   "id": "ft_3",
   "cat": "feet",
   "icon": "🔴",
   "name": "紅蓮魔法陣",
   "price": 9000,
   "desc": "腳下特效：腳下浮現旋轉的魔法陣",
   "file": "circle-crimson",
   "cos": {
    "slot": "feet",
    "color": "#ff5a4a"
   }
  },
  {
   "id": "ob_1",
   "cat": "orbit",
   "icon": "🧚",
   "name": "小精靈",
   "price": 3500,
   "desc": "環繞特效：一隻小精靈繞著勇者飛",
   "file": "orbit-fairy",
   "cos": {
    "slot": "orbit",
    "emoji": "🧚",
    "n": 1
   }
  },
  {
   "id": "ob_2",
   "cat": "orbit",
   "icon": "🔮",
   "name": "魔法水晶",
   "price": 5000,
   "desc": "環繞特效：三顆魔法水晶繞著勇者旋轉",
   "file": "orbit-crystal",
   "cos": {
    "slot": "orbit",
    "emoji": "🔮",
    "n": 3
   }
  },
  {
   "id": "ob_3",
   "cat": "orbit",
   "icon": "🦋",
   "name": "飛舞蝴蝶",
   "price": 4000,
   "desc": "環繞特效：兩隻蝴蝶繞著勇者飛舞",
   "file": "orbit-butterfly",
   "cos": {
    "slot": "orbit",
    "emoji": "🦋",
    "n": 2
   }
  }
 ],
 "shopRules": {
  "bagCap": 30,
  "maxHealPerDuel": 3,
  "nameMaxLen": 8,
  "trialSec": 10,
  "badWords": [
   "幹",
   "靠北",
   "白痴",
   "智障",
   "垃圾",
   "去死",
   "三小",
   "屁",
   "屎",
   "幹你娘",
   "操",
   "fuck",
   "shit"
  ],
  "starterGift": {
   "heal_s": 2,
   "shield_s": 1
  }
 }
};
window.GAME_CONFIG_LABELS = {
 "relax": "🎮 休息小遊戲（答題中場）",
 "relax.enabled": "休息小遊戲開關（1＝開、0＝關）",
 "relax.every": "每答幾題就跳出一款小遊戲",
 "relax.streak": "連續答對幾題也會跳出（0＝不使用）；和上一項先到先觸發",
 "relax.level": "電腦強度起點（easy 簡單／normal 中等／hard 困難）；之後會依該款的勝場自動調整",
 "relax.dailyRewardLimit": "每人每天最多領幾次小遊戲道具（領滿後當天不再跳小遊戲；0＝不限）",
 "relax.excludeGames": "不要出現的小遊戲代號，用逗號分開（例：xiangqi,go9,checkers）。可用代號：go9 gomoku9 reversi hexxagon snake catmouse minesweeper checkers memory banqi xiangqi pickupred upstairs downstairs whack oldmaid sevens",
 "relax.rewardItems": "贏了送的商店道具與抽中權重（數字越大越容易抽到；0＝不送）",
 "relax.rewardItems.heal_s": "小補血瓶 權重",
 "relax.rewardItems.heal_m": "中補血瓶 權重",
 "relax.rewardItems.heal_l": "大補血瓶 權重",
 "relax.rewardItems.shield_s": "小護盾 權重",
 "relax.rewardItems.shield_m": "中護盾 權重",
 "relax.rewardItems.shield_l": "城牆護盾 權重",
 "relax.rewardItems.speed_s": "疾風藥水 權重",
 "relax.rewardItems.revive_m": "戰場復活藥 權重",
 "relax.rewardItems.mb_s": "戰功加成券 權重",
 "gifts": "🎁 獎勵發放（戰功／道具／經驗值／寶箱，學生進遊戲自動收到）",
 "skillLab": "🔮 招式工坊（學生自己研發、替換對戰八格的招式）",
 "poses": "🎭 對戰姿勢圖（依軍階：待機／出招／受擊／勝利；空白＝沿用原頭像）",
 "poses.0": "軍階 0 的四姿勢圖",
 "poses.0.idle": "待機姿勢圖檔",
 "poses.0.attack": "出招姿勢圖檔",
 "poses.0.hit": "受擊姿勢圖檔",
 "poses.0.win": "勝利姿勢圖檔",
 "poses.1": "軍階 1 的四姿勢圖",
 "poses.1.idle": "待機姿勢圖檔",
 "poses.1.attack": "出招姿勢圖檔",
 "poses.1.hit": "受擊姿勢圖檔",
 "poses.1.win": "勝利姿勢圖檔",
 "poses.2": "軍階 2 的四姿勢圖",
 "poses.2.idle": "待機姿勢圖檔",
 "poses.2.attack": "出招姿勢圖檔",
 "poses.2.hit": "受擊姿勢圖檔",
 "poses.2.win": "勝利姿勢圖檔",
 "poses.3": "軍階 3 的四姿勢圖",
 "poses.3.idle": "待機姿勢圖檔",
 "poses.3.attack": "出招姿勢圖檔",
 "poses.3.hit": "受擊姿勢圖檔",
 "poses.3.win": "勝利姿勢圖檔",
 "poses.4": "軍階 4 的四姿勢圖",
 "poses.4.idle": "待機姿勢圖檔",
 "poses.4.attack": "出招姿勢圖檔",
 "poses.4.hit": "受擊姿勢圖檔",
 "poses.4.win": "勝利姿勢圖檔",
 "poses.5": "軍階 5 的四姿勢圖",
 "poses.5.idle": "待機姿勢圖檔",
 "poses.5.attack": "出招姿勢圖檔",
 "poses.5.hit": "受擊姿勢圖檔",
 "poses.5.win": "勝利姿勢圖檔",
 "poses.6": "軍階 6 的四姿勢圖",
 "poses.6.idle": "待機姿勢圖檔",
 "poses.6.attack": "出招姿勢圖檔",
 "poses.6.hit": "受擊姿勢圖檔",
 "poses.6.win": "勝利姿勢圖檔",
 "rig": "🗡️ 揮劍校準（角色揮劍動畫：轉軸、位置、大小、速度）",
 "rig.height": "身體高度（佔舞台寬度的 %）",
 "rig.shoulderX": "身體圓心 X（斷臂圓形的圓心，佔身體圖寬度比例）",
 "rig.shoulderY": "身體圓心 Y（佔身體圖高度比例）",
 "rig.pivotX": "手臂轉軸 X（手臂肩甲圓心，佔手臂圖寬度比例）",
 "rig.pivotY": "手臂轉軸 Y（佔手臂圖高度比例）",
 "rig.armScale": "手臂大小（手臂圖寬 ÷ 身體圖寬）",
 "rig.restAngle": "待機角度（度）",
 "rig.raiseAngle": "舉劍角度（度，負＝往上）",
 "rig.slashAngle": "下劈角度（度，正＝往下）",
 "rig.raiseMs": "舉劍時間（毫秒）",
 "rig.slashMs": "下劈時間（毫秒）",
 "rig.backMs": "收招時間（毫秒）",
 "rig.tipX": "劍尖位置 X（手臂圖像素，算劍光用）",
 "rig.tipY": "劍尖位置 Y",
 "rig.guardX": "護手位置 X",
 "rig.guardY": "護手位置 Y",
 "rig.trail": "劍光（1＝開，0＝關）",
 "skillLab.tiers": "五個階級（越強每場能用的次數越少）",
 "skillLab.tiers[].name": "階級名稱",
 "skillLab.tiers[].uses": "每場對戰可用次數",
 "skillLab.tiers[].dmg": "傷害招式：攻擊力的幾倍",
 "skillLab.tiers[].stat": "強化／削弱：原數值的幾成（0.1＝一成）",
 "skillLab.tiers[].heal": "補血／補魔：上限的幾成",
 "skillLab.tiers[].poison": "中毒：每回合扣血量占血量上限的幾成",
 "skillLab.tiers[].blind": "失明：對方攻擊落空的機率",
 "skillLab.tiers[].prob": "研發時抽到這一階的權重（數字越大越容易抽到）",
 "skillLab.upCap": "同一種強化最多加到原數值的幾倍（1＝最多再加一倍）",
 "skillLab.dnCap": "同一種削弱最多扣掉原數值的幾成（0.5＝最多扣一半）",
 "skillLab.layerCap": "同一種強化／削弱最多疊幾層",
 "skillLab.healCapHp": "每場對戰補血總量上限（占血量上限的幾成）",
 "skillLab.healCapMp": "每場對戰補魔總量上限（占魔力上限的幾成）",
 "skillLab.poisonLayerCap": "中毒最多疊幾層",
 "skillLab.poisonTurns": "中毒持續幾回合（再中毒會重新計時）",
 "skillLab.blindTurns": "失明持續幾回合",
 "skillLab.mpPerTier": "法術招式每一階要耗多少魔力（1 階＝1 倍、5 階＝5 倍）",
 "skillLab.bagMax": "招式庫最多存幾個招式",
 "skillLab.baseCost": "第一次研發招式要幾戰功",
 "skillLab.costStep": "每研發一次，費用增加多少戰功",
 "skillLab.aiSkillProb": "幽靈 AI 優先使用招式的傾向（0～1）",
 "skillLab.effWeight": "各種效果被抽到的權重（數字越大越容易抽到）",
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
 "skill": "🗄️ 舊版招式（已停用，只留著給改版退費用，請改用上面的「招式工坊」）",
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
 "proRatio.大魔導士": "大魔導士",
 "shopRules": "🛒 商店規則",
 "shopRules.bagCap": "每種消耗品的持有上限（買到這個數量就不能再買）",
 "shopRules.maxHealPerDuel": "每場對戰最多可以喝幾瓶補血瓶",
 "shopRules.trialSec": "試用功能：試用幾秒（到時間自動關閉並詢問是否購買）",
 "shopRules.nameMaxLen": "改名卡：名字最多幾個字",
 "shopRules.badWords": "改名卡：不能使用的字眼（含有就不能改名）",
 "shop[].daily": "每日限購（每人每天最多買幾個，空白＝不限）",
 "shop[].cos": "外觀資料（稱號／頭像框／飾品，請勿改欄位名稱）",
 "shop[].cos.slot": "外觀欄位代號（請勿改）",
 "shop[].cos.text": "稱號文字",
 "shop[].cos.color": "顏色",
 "shop[].cos.glow": "頭像框光暈大小",
 "shop[].cos.emoji": "飾品圖示",
 "shop[].battle.shield": "護盾可擋下幾次攻擊",
 "shop[].fx.rename": "改名（1＝啟用）",
 "shopRules.starterGift": "🎁 新手禮（第一次通關送的道具：道具代號與數量）",
 "shop[].cos.onWall": "掛在牆上（true／false）",
 "shop[].cos.x": "飾品位置：左右（0～100）",
 "shop[].cos.y": "飾品位置：離地高度（0～100）",
 "shop[].cos.size": "飾品大小",
 "shop[].cos.pet": "夥伴（true＝站在勇者旁邊）",
 "shop[].file": "圖片檔名（不含 .png；商店圖放 images/shop/，大廳圖放 images/lobby/，兩邊同名）",
 "shop[].cos.kind": "背後特效種類（wings 翅膀／halo 光輪）",
 "shop[].cos.c1": "特效顏色 1",
 "shop[].cos.c2": "特效顏色 2",
 "shop[].cos.n": "環繞的數量"
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
