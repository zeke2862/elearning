/*
數學勇者角色與戰鬥規則引擎
檔案格式：JavaScript 原始碼（此版本以 .txt 提供，方便複製）
建議檔名：math_hero_engine.txt

使用方式：
1. 將本檔內容複製到 math_hero_engine.js。
2. 在瀏覽器或遊戲主程式中載入後，呼叫 MathHeroEngine 下列方法。
3. 中文姓名請由學生輸入「姓名總筆劃」；英文姓名會自動依 A=1...Z=26 加總。
*/

const MathHeroEngine = (() => {
  "use strict";

  const ARCHETYPES = {
    0: { name: "聖騎士", bonus: "DEF", amount: 10 },
    1: { name: "刺客", bonus: "SPD", amount: 15 },
    2: { name: "狂戰士", bonus: "HP", amount: 30 },
    3: { name: "大魔導士", bonus: "MATK", amount: 2 }
  };

  const SKILL_POOL = {
    physical: [
      { name: "橫掃千軍", rarity: "普通", multiplier: 1.2, target: "DEF", type: "damage" },
      { name: "裂地重擊", rarity: "強力", multiplier: 1.8, target: "DEF", type: "damage", selfSpeedPenalty: 3 },
      { name: "崩天神皇斬", rarity: "傳說", multiplier: 2.5, target: "DEF", type: "damage" }
    ],
    magic: [
      { name: "大熱計", rarity: "普通", multiplier: 1.2, target: "MDEF", type: "damage" },
      { name: "落雷轟擊", rarity: "強力", multiplier: 1.6, target: "MDEF", type: "damage", targetSpeedPenalty: 5 },
      { name: "九天玄雷破", rarity: "傳說", multiplier: 2.5, target: "MDEF", type: "damage" }
    ],
    speed: [
      { name: "疾風雙刃", rarity: "普通", type: "speedAttack" },
      { name: "神速術", rarity: "強力", type: "speedBuff", selfSpeedBonus: 15 },
      { name: "迅雷閃光刺", rarity: "傳說", type: "speedDamage", speedMultiplier: 3 }
    ]
  };

  // 速度採「累積行動值」比例制：每次判定時雙方各累加有效 SPD，
  // 行動值較高者先攻，先攻者再扣除雙方速度總和。小數差距會保留並累計。
  const DEFAULT_RULES = {
    skillBaseCost: 50,
    skillCostIncrease: 50,
    minimumDamage: 1
  };

  function rollDie() {
    return Math.floor(Math.random() * 6) + 1;
  }

  function rollTwoDice() {
    const die1 = rollDie();
    const die2 = rollDie();
    return { die1, die2, sum: die1 + die2 };
  }

  function englishNameValue(name) {
    const letters = String(name || "").toUpperCase().replace(/[^A-Z]/g, "");
    if (!letters) throw new Error("請輸入有效的英文姓名（A-Z）。");
    return [...letters].reduce((sum, letter) => sum + letter.charCodeAt(0) - 64, 0);
  }

  function getNameValue(name, chineseStrokeTotal) {
    const trimmed = String(name || "").trim();
    if (!trimmed) throw new Error("請先輸入姓名。");
    if (/[A-Za-z]/.test(trimmed) && !/[^\x00-\x7F]/.test(trimmed)) {
      return { method: "英文姓名字母值", total: englishNameValue(trimmed) };
    }
    const strokes = Number(chineseStrokeTotal);
    if (!Number.isInteger(strokes) || strokes <= 0) {
      throw new Error("中文姓名請輸入大於 0 的姓名總筆劃。");
    }
    return { method: "中文姓名總筆劃", total: strokes };
  }

  function createCharacter({ name, chineseStrokeTotal, diceResult } = {}) {
    const nameValue = getNameValue(name, chineseStrokeTotal);
    const remainder = nameValue.total % 4;
    const baseRemainder = remainder === 0 ? 4 : remainder;
    const archetype = ARCHETYPES[remainder];
    const dice = diceResult || rollTwoDice();
    const diceSum = Number(dice.sum);

    if (!Number.isInteger(diceSum) || diceSum < 2 || diceSum > 12) {
      throw new Error("兩顆骰子的點數和必須介於 2 到 12。");
    }

    const stats = {
      HP: baseRemainder * 10 + diceSum * 5,
      ATK: (baseRemainder + diceSum) * 2,
      DEF: baseRemainder * 3 + diceSum,
      SPD: (12 - diceSum) + baseRemainder * 2,
      MATK: baseRemainder * diceSum,
      MDEF: (baseRemainder + 6) * 2
    };

    if (archetype.bonus === "HP") stats.HP += archetype.amount;
    if (archetype.bonus === "DEF") stats.DEF += archetype.amount;
    if (archetype.bonus === "SPD") stats.SPD += archetype.amount;
    if (archetype.bonus === "MATK") stats.MATK *= archetype.amount;

    return {
      name: String(name).trim(),
      nameValue,
      remainder,
      baseRemainder,
      archetype: archetype.name,
      dice: { die1: dice.die1 ?? null, die2: dice.die2 ?? null, sum: diceSum },
      stats,
      currentHP: stats.HP,
      skills: [],
      skillsCreated: 0,
      nextSkillCost: DEFAULT_RULES.skillBaseCost,
      temporary: { speedPenalty: 0, speedBonus: 0, nextTurnTripleAttack: false },
      initiativeMeter: 0
    };
  }

  function getSkillCategory(die) {
    if (die === 1 || die === 2) return "physical";
    if (die === 3 || die === 4) return "magic";
    if (die === 5 || die === 6) return "speed";
    throw new Error("招式類型骰必須是 1 到 6。");
  }

  function getRarityIndex(die) {
    // 第二顆骰決定稀有度：1–3 普通、4–5 強力、6 傳說。
    if (die >= 1 && die <= 3) return 0;
    if (die <= 5) return 1;
    if (die === 6) return 2;
    throw new Error("稀有度骰必須是 1 到 6。");
  }

  function learnSkill(character, options = {}) {
    if (!character || !character.stats) throw new Error("角色資料無效。");
    const rules = { ...DEFAULT_RULES, ...(options.rules || {}) };
    const cost = rules.skillBaseCost + character.skillsCreated * rules.skillCostIncrease;
    const wallet = Number(options.gold);

    if (!Number.isFinite(wallet) || wallet < cost) {
      return {
        success: false,
        reason: "金幣不足",
        cost,
        goldRemaining: Number.isFinite(wallet) ? wallet : 0
      };
    }

    const typeDie = options.typeDie ?? rollDie();
    const rarityDie = options.rarityDie ?? rollDie();
    const category = getSkillCategory(typeDie);
    const rarityIndex = getRarityIndex(rarityDie);
    const skill = { ...SKILL_POOL[category][rarityIndex], category, typeDie, rarityDie };

    character.skills.push(skill);
    character.skillsCreated += 1;
    character.nextSkillCost = rules.skillBaseCost + character.skillsCreated * rules.skillCostIncrease;

    return {
      success: true,
      skill,
      cost,
      goldRemaining: wallet - cost,
      nextSkillCost: character.nextSkillCost
    };
  }

  function effectiveSpeed(character) {
    const t = character.temporary || {};
    return character.stats.SPD + (t.speedBonus || 0) - (t.speedPenalty || 0);
  }

  function nextAttacker(characterA, characterB) {
    if (!characterA || !characterB || !characterA.stats || !characterB.stats) {
      throw new Error("請提供兩名有效的戰鬥角色。");
    }

    const speedA = Math.max(1, effectiveSpeed(characterA));
    const speedB = Math.max(1, effectiveSpeed(characterB));
    characterA.initiativeMeter = Number(characterA.initiativeMeter || 0) + speedA;
    characterB.initiativeMeter = Number(characterB.initiativeMeter || 0) + speedB;

    let actor;
    let target;
    if (characterA.initiativeMeter >= characterB.initiativeMeter) {
      actor = characterA;
      target = characterB;
    } else {
      actor = characterB;
      target = characterA;
    }

    // 扣除雙方速度總和，保留累積餘額，避免速度差距不大時遺失進度。
    actor.initiativeMeter -= speedA + speedB;

    if (actor.temporary?.nextTurnTripleAttack) {
      // 三連擊標記在輪到該角色時消耗；實際連續攻擊次數由戰鬥主程式處理。
      actor.temporary.nextTurnTripleAttack = false;
      actor.temporary.grantedTripleAttack = true;
    }

    return {
      actor,
      target,
      actorName: actor.name,
      targetName: target.name,
      speedA,
      speedB,
      ratio: `${speedA}:${speedB}`,
      actorInitiativeMeter: actor.initiativeMeter,
      targetInitiativeMeter: target.initiativeMeter,
      grantedTripleAttack: Boolean(actor.temporary?.grantedTripleAttack)
    };
  }

  function resetInitiative(...characters) {
    for (const character of characters) {
      if (!character) continue;
      character.initiativeMeter = 0;
      if (character.temporary) character.temporary.grantedTripleAttack = false;
    }
  }

  function calculateDamage(attacker, defender, skill = null, rules = {}) {
    const minimum = rules.minimumDamage ?? DEFAULT_RULES.minimumDamage;
    let rawDamage;
    let message = "";
    const effects = {};

    if (!skill) {
      rawDamage = attacker.stats.ATK - defender.stats.DEF;
      message = "普通攻擊";
    } else if (skill.type === "damage") {
      const attackStat = skill.category === "magic" ? attacker.stats.MATK : attacker.stats.ATK;
      rawDamage = attackStat * skill.multiplier - defender.stats[skill.target];
      message = skill.name;
      if (skill.selfSpeedPenalty) effects.selfSpeedPenalty = skill.selfSpeedPenalty;
      if (skill.targetSpeedPenalty) effects.targetSpeedPenalty = skill.targetSpeedPenalty;
    } else if (skill.type === "speedAttack") {
      rawDamage = attacker.stats.ATK + effectiveSpeed(attacker);
      message = skill.name + "（無視防禦）";
    } else if (skill.type === "speedDamage") {
      rawDamage = effectiveSpeed(attacker) * skill.speedMultiplier;
      message = skill.name + "（無視防禦）";
    } else if (skill.type === "speedBuff") {
      attacker.temporary.speedBonus = (attacker.temporary.speedBonus || 0) + skill.selfSpeedBonus;
      attacker.temporary.nextTurnTripleAttack = true;
      return {
        damage: 0,
        rawDamage: 0,
        message: skill.name + "：速度 +" + skill.selfSpeedBonus,
        effects: { selfSpeedBonus: skill.selfSpeedBonus, nextTurnTripleAttack: true }
      };
    } else {
      throw new Error("不支援的招式類型。");
    }

    const damage = Math.max(minimum, Math.floor(rawDamage));
    defender.currentHP = Math.max(0, defender.currentHP - damage);

    if (effects.selfSpeedPenalty) {
      attacker.temporary.speedPenalty = (attacker.temporary.speedPenalty || 0) + effects.selfSpeedPenalty;
    }
    if (effects.targetSpeedPenalty) {
      defender.temporary.speedPenalty = (defender.temporary.speedPenalty || 0) + effects.targetSpeedPenalty;
    }

    return { damage, rawDamage, message, effects, targetHP: defender.currentHP };
  }

  function endTurn(...characters) {
    for (const character of characters) {
      if (!character?.temporary) continue;
      // 速度加減效果持續到主程式呼叫 endTurn()；累積行動值不在此重置。
      character.temporary.speedPenalty = 0;
      character.temporary.speedBonus = 0;
    }
  }

  return {
    DEFAULT_RULES,
    SKILL_POOL,
    rollDie,
    rollTwoDice,
    englishNameValue,
    createCharacter,
    learnSkill,
    effectiveSpeed,
    nextAttacker,
    resetInitiative,
    calculateDamage,
    endTurn
  };
})();

// 範例（請在實際遊戲中移除註解後測試）：
// const hero = MathHeroEngine.createCharacter({ name: "Alex" });
// let gold = 200;
// const result = MathHeroEngine.learnSkill(hero, { gold });
// if (result.success) gold = result.goldRemaining;
// console.log(hero, result);
