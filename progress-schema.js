// progress-schema.js
// 共用進度紀錄結構：塔防、ETP、看打、代幣，三個系統共用同一份存檔。
// 這份 JSON 結構會同時存在 localStorage（家用/離線）跟 server.js 的資料庫（校內），
// 由 savesys.html 負責讀寫、由教師電腦的同步排程負責兩邊合併。

import { TOWER_DEFENSE_STAGE_ORDER, ETP_STAGE_ORDER } from './wordbank.js';

const SCHEMA_VERSION = "1.0.0";

function buildTowerDefenseStages() {
  const stages = {};
  TOWER_DEFENSE_STAGE_ORDER.forEach(key => {
    stages[key] = { passed: false, bestWpm: 0, bestAccuracy: 0, attemptCount: 0, weakKeys: {} };
  });
  return stages;
}

function buildEtpStages() {
  const stages = {};
  ETP_STAGE_ORDER.forEach(key => {
    stages[key] = { passed: false, bestWpm: 0, bestAccuracy: 0, attemptCount: 0 };
  });
  return stages;
}

export function createDefaultProgress() {
  return {
    version: SCHEMA_VERSION,
    studentId: null,          // 代碼登入（學號）後填入，串起塔防/ETP/看打三邊
    agentId: null,            // 塔防角色 ID，沿用 savesys.html defaultSave() 產生的格式

    towerDefense: {
      unlockedStage: TOWER_DEFENSE_STAGE_ORDER[0],   // 目前解鎖到哪一關
      stages: buildTowerDefenseStages()
    },

    etp: {
      // 軟性提示用：null 代表還沒有任何塔防紀錄可以參考
      recommendedStage: null,
      stages: buildEtpStages()
    },

    lookType: {
      // key 為文章 id，value 為該篇最佳成績
      attempts: {}   // { [articleId]: { bestWpm, bestAccuracy, attemptCount, passed } }
    },

    tokens: {
      gbit: 0,          // 可花費餘額（塔防商店用）
      totalEarned: 0     // 累計一生賺了多少，只增不減，供教師端看投入程度
    },

    lastModified: Date.now()
  };
}

// 合併舊存檔與預設結構，補上新欄位但不覆蓋既有進度（給存檔升級用）
export function mergeWithDefaults(saved) {
  const d = createDefaultProgress();
  if (!saved) return d;
  const merged = { ...d, ...saved };
  merged.towerDefense = {
    ...d.towerDefense,
    ...(saved.towerDefense || {}),
    stages: { ...d.towerDefense.stages, ...((saved.towerDefense || {}).stages || {}) }
  };
  merged.etp = {
    ...d.etp,
    ...(saved.etp || {}),
    stages: { ...d.etp.stages, ...((saved.etp || {}).stages || {}) }
  };
  merged.lookType = {
    ...d.lookType,
    ...(saved.lookType || {}),
    attempts: { ...(saved.lookType || {}).attempts }
  };
  merged.tokens = { ...d.tokens, ...(saved.tokens || {}) };
  return merged;
}

// 塔防過關時呼叫：更新關卡紀錄、發代幣、往前解鎖下一關
export function recordTowerDefenseClear(progress, stageKey, { wpm, accuracy, tokensEarned }) {
  const stage = progress.towerDefense.stages[stageKey];
  if (!stage) return progress;
  stage.attemptCount += 1;
  stage.bestWpm = Math.max(stage.bestWpm, wpm);
  stage.bestAccuracy = Math.max(stage.bestAccuracy, accuracy);
  stage.passed = true;

  const idx = TOWER_DEFENSE_STAGE_ORDER.indexOf(stageKey);
  const next = TOWER_DEFENSE_STAGE_ORDER[idx + 1];
  if (next && TOWER_DEFENSE_STAGE_ORDER.indexOf(progress.towerDefense.unlockedStage) <= idx) {
    progress.towerDefense.unlockedStage = next;
  }

  progress.tokens.gbit += tokensEarned;
  progress.tokens.totalEarned += tokensEarned;
  progress.lastModified = Date.now();
  return progress;
}

// ETP 檢定送出時呼叫：更新紀錄、發代幣（獨立於塔防的代幣發放）
export function recordEtpAttempt(progress, rowKey, { wpm, accuracy, passed, tokensEarned }) {
  const stage = progress.etp.stages[rowKey];
  if (!stage) return progress;
  stage.attemptCount += 1;
  stage.bestWpm = Math.max(stage.bestWpm, wpm);
  stage.bestAccuracy = Math.max(stage.bestAccuracy, accuracy);
  if (passed) stage.passed = true;

  progress.tokens.gbit += tokensEarned;
  progress.tokens.totalEarned += tokensEarned;
  progress.lastModified = Date.now();
  return progress;
}

// 看打文章交卷時呼叫
export function recordLookTypeAttempt(progress, articleId, { wpm, accuracy, passed, tokensEarned }) {
  const existing = progress.lookType.attempts[articleId] || { bestWpm: 0, bestAccuracy: 0, attemptCount: 0, passed: false };
  existing.attemptCount += 1;
  existing.bestWpm = Math.max(existing.bestWpm, wpm);
  existing.bestAccuracy = Math.max(existing.bestAccuracy, accuracy);
  if (passed) existing.passed = true;
  progress.lookType.attempts[articleId] = existing;

  progress.tokens.gbit += tokensEarned;
  progress.tokens.totalEarned += tokensEarned;
  progress.lastModified = Date.now();
  return progress;
}
