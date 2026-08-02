// pet-engine.js
// ============ 心靈戰寵：核心邏輯 + 存檔串接 ============
// 前半段是 PetEngine.ts 改寫成不需要 TypeScript 的版本（規則完全比照原檔：
// 演化里程碑、生存衰減、復活、學期封存）。
// 後半段是新增的「跟 GBit 存檔串接」的輔助函式，讓 index.html 的寵物養成區
// 可以直接讀寫跟塔防遊戲共用的同一份存檔（keyagent_save_v1:<學號>）。
// 需要先載入 pet-catalog-data.js（PET_CATALOG / PET_CATEGORIES / PRAISE_DICTIONARY）。

const PET_HEALTH = { HEALTHY: "HEALTHY", DRIED: "DRIED", SHRUNK: "SHRUNK", PETRIFIED: "PETRIFIED" };
const PET_STAGE = {
  EGG: "EGG",
  STAGE_0_BW: "STAGE_0_BW",
  STAGE_0_VIBRANT: "STAGE_0_VIBRANT",
  STAGE_1_MATURE: "STAGE_1_MATURE",
  STAGE_2_ULTIMATE: "STAGE_2_ULTIMATE",
  STAGE_2_WITH_BOOK: "STAGE_2_WITH_BOOK"
};

const PET_STAGE_LABEL = {
  EGG: "尚未孵化（蛋）",
  STAGE_0_BW: "黑白水墨",
  STAGE_0_VIBRANT: "繽紛原色",
  STAGE_1_MATURE: "成熟體（第一次進化）",
  STAGE_2_ULTIMATE: "究極體（第二次進化）",
  STAGE_2_WITH_BOOK: "究極體・智慧奧義"
};
const PET_HEALTH_LABEL = {
  HEALTHY: "健康活力",
  DRIED: "乾巴巴",
  SHRUNK: "變小變餓",
  PETRIFIED: "石化假死"
};
const PET_HEALTH_COLOR = {
  HEALTHY: "#39ff9d",
  DRIED: "#ffd23f",
  SHRUNK: "#ff8a3d",
  PETRIFIED: "#6c7d8f"
};

// -------- 經濟參數：之後要調整寵物系統的花費／速度，改這幾個數字就好 --------
const PET_EGG_COST_GBIT = 50;          // 開一顆蛋要花的 GBit
const PET_MANUAL_FEED_COST_GBIT = 10;  // 手動餵食「第一次」要花的 GBit（+1 餵養次數）
const PET_MANUAL_FEED_STREAK_MULTIPLIER = 5; // 連續手動餵食（中間沒有靠練習自動餵食）每次費用 ×5
const PET_REVIVE_COST_GBIT = 30;       // 重燃魔藥（復活寵物）要花的 GBit
const PET_GBIT_PER_AUTO_FEED = 1;      // 練習/測驗每賺到幾 GBit，自動 +1 餵養次數（1 = 賺多少、自動餵多少）

/* ============================================================
   MindPetEngine —— 核心規則（比照 PetEngine.ts，邏輯完全相同）
   ============================================================ */
// 依目前演化階段，回傳圖鑑裡對應的稱號（幼體/成熟體/究極體 三種名稱會自動切換）。
// 還在「蛋」階段時（餵養次數 < 50）故意不顯示抽到的名字，保留孵化的驚喜感。
// 找不到圖鑑定義（理論上不會發生）就退回存檔裡固定存的 pet.name。
function petDisplayName(pet) {
  const stage = MindPetEngine.getVisualStage(pet.feedCount);
  if (stage === PET_STAGE.EGG) return "神秘的蛋";
  const def = PET_CATALOG[pet.petDefId];
  if (!def) return pet.name;
  if (stage === PET_STAGE.STAGE_1_MATURE) return def.stage1Name;
  if (stage === PET_STAGE.STAGE_2_ULTIMATE || stage === PET_STAGE.STAGE_2_WITH_BOOK) return def.stage2Name;
  return def.stage0Name;
}

const MindPetEngine = {
  // 1. 創立新寵物：從圖鑑中隨機指派該類別＋性別的獨一無二型態
  createPet(studentId, category, gender, customName) {
    const defs = Object.values(PET_CATALOG).filter(
      (d) => d.category === category && d.gender === gender
    );
    const def = defs[Math.floor(Math.random() * defs.length)];
    return {
      id: "INST_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      studentId,
      petDefId: def.id,
      name: customName || def.stage0Name,
      category,
      gender,
      feedCount: 0,
      lastActive: Date.now(), // 存成時間戳（number），跟 JSON/localStorage 相容
      isArchived: false,
      unlockedBookItem: false
    };
  },

  // 2. 計算生存健康狀態
  getHealthStatus(pet, now) {
    now = now || Date.now();
    const diffInHours = (now - pet.lastActive) / (1000 * 60 * 60);
    if (diffInHours >= 216) return PET_HEALTH.PETRIFIED;   // > 9 天
    if (diffInHours >= 144) return PET_HEALTH.SHRUNK;      // 6-8 天
    if (diffInHours >= 72) return PET_HEALTH.DRIED;        // 3-5 天
    return PET_HEALTH.HEALTHY;
  },

  // 3. 計算當前演化／視覺階段
  //    0~49次：蛋（還沒孵化，看不到抽到的樣子）
  //    50~99次：孵化成黑白水墨
  //    100~149次：轉為繽紛原色
  //    150~249次：第一次進化（成熟體）
  //    250~399次：第二次進化（究極體）
  //    400次以上：究極體＋智慧奧義之書
  getVisualStage(feedCount) {
    if (feedCount >= 400) return PET_STAGE.STAGE_2_WITH_BOOK;
    if (feedCount >= 250) return PET_STAGE.STAGE_2_ULTIMATE;
    if (feedCount >= 150) return PET_STAGE.STAGE_1_MATURE;
    if (feedCount >= 100) return PET_STAGE.STAGE_0_VIBRANT;
    if (feedCount >= 50) return PET_STAGE.STAGE_0_BW;
    return PET_STAGE.EGG;
  },

  // 4. 餵食機制
  feed(pet, currentTimes, now) {
    currentTimes = currentTimes || 1;
    now = now || Date.now();
    const currentHealth = this.getHealthStatus(pet, now);

    if (currentHealth === PET_HEALTH.PETRIFIED) {
      return {
        success: false,
        message: "寵物已處於【石化休眠】狀態！請先使用「重燃魔藥」進行復活！",
        evolved: false,
        unlockedBook: false,
        pet
      };
    }

    const previousStage = this.getVisualStage(pet.feedCount);
    const wasBookUnlocked = pet.unlockedBookItem;

    pet.feedCount += currentTimes;
    pet.lastActive = now;

    const newStage = this.getVisualStage(pet.feedCount);
    if (pet.feedCount >= 400 && !pet.unlockedBookItem) {
      pet.unlockedBookItem = true;
    }

    const evolved = previousStage !== newStage;
    const unlockedBook = !wasBookUnlocked && pet.unlockedBookItem;
    const praise = PRAISE_DICTIONARY[Math.floor(Math.random() * PRAISE_DICTIONARY.length)];

    return {
      success: true,
      message: "餵食成功！累積餵養次數：" + pet.feedCount + " 次。",
      praise,
      evolved,
      unlockedBook,
      pet
    };
  },

  // 5. 復活機制
  revive(pet, now) {
    now = now || Date.now();
    const status = this.getHealthStatus(pet, now);
    if (status !== PET_HEALTH.PETRIFIED) {
      return { success: false, message: "寵物目前狀態良好，不需要使用復活藥水。", pet };
    }
    pet.lastActive = now;
    return { success: true, message: "成功使用【重燃魔藥】！寵物已甦醒並恢復滿滿活力！", pet };
  },

  // 6. 學期歸零與封存至英雄殿堂
  archiveSemester(pet, semesterName) {
    pet.isArchived = true;
    const record = {
      semester: semesterName || "",
      petId: pet.id,
      petName: petDisplayName(pet),
      category: pet.category,
      gender: pet.gender,
      finalFeedCount: pet.feedCount,
      finalStage: this.getVisualStage(pet.feedCount),
      archivedAt: Date.now()
    };
    return { record, pet };
  }
};

/* ============================================================
   存檔串接：讀寫跟塔防遊戲共用的 keyagent_save_v1:<學號>
   （跟 savesys.html / sync-client.js 用同一把 key，同學號的
   GBit／進度自然就是同一包，不用另外做一套帳號系統）
   ============================================================ */
const PET_BASE_SAVE_KEY = "keyagent_save_v1";

function petSaveKeyFor(studentNumber) {
  return studentNumber ? PET_BASE_SAVE_KEY + ":" + studentNumber : PET_BASE_SAVE_KEY;
}

// 讀存檔，並確保 pet 欄位一定存在（相容舊存檔，防呆邏輯比照 savesys.html
// 對 shop/stats/endless 等欄位的 Object.assign 合併方式）
function petLoadSave(studentNumber) {
  const key = petSaveKeyFor(studentNumber);
  let save = {};
  try {
    const raw = localStorage.getItem(key);
    save = raw ? JSON.parse(raw) : {};
  } catch (err) {
    save = {};
  }
  if (typeof save.gbit !== "number") save.gbit = 0;
  if (typeof save.gbitEarnedLifetime !== "number") save.gbitEarnedLifetime = 0;
  if (typeof save.gbitSpentLifetime !== "number") save.gbitSpentLifetime = 0;
  if (!save.pet || typeof save.pet !== "object") {
    // 第一次接觸寵物系統：lastFeedSyncGbit 直接設成目前的終身賺取量，
    // 不會把「這個功能上線前就存在的 GBit」拿去換算成一大筆餵食次數。
    save.pet = { active: null, hallOfFame: [], lastFeedSyncGbit: save.gbitEarnedLifetime };
  }
  if (!Array.isArray(save.pet.hallOfFame)) save.pet.hallOfFame = [];
  if (typeof save.pet.lastFeedSyncGbit !== "number") save.pet.lastFeedSyncGbit = save.gbitEarnedLifetime;
  if (typeof save.pet.manualFeedStreak !== "number") save.pet.manualFeedStreak = 0;
  return save;
}

// 每次要動存檔前才即時讀最新版本、動完馬上寫回去（不長期持有整包物件），
// 降低跟遊戲那邊剛好也在寫入時互相蓋掉的機率。
function petPersistSave(studentNumber, save) {
  try {
    localStorage.setItem(petSaveKeyFor(studentNumber), JSON.stringify(save));
  } catch (err) {
    console.error("寵物存檔寫入失敗", err);
  }
}

// 把「賺到的 GBit」自動換算成餵食次數。用終身賺取量（只增不減）跟上次
// 換算過的基準值相減，整除轉成餵食次數，餘數留到下次再換，不會有零頭
// 被吃掉。每次打開寵物養成區（petRefreshAndRender）呼叫一次即可。
function petSyncAutoFeed(save) {
  if (!save.pet.active) {
    save.pet.lastFeedSyncGbit = save.gbitEarnedLifetime;
    return null;
  }
  const earnedSince = save.gbitEarnedLifetime - save.pet.lastFeedSyncGbit;
  if (earnedSince < PET_GBIT_PER_AUTO_FEED) return null;
  const feeds = Math.floor(earnedSince / PET_GBIT_PER_AUTO_FEED);
  save.pet.lastFeedSyncGbit += feeds * PET_GBIT_PER_AUTO_FEED;
  save.pet.manualFeedStreak = 0; // 有練習賺到 GBit，手動餵食加價重新從第一次算起
  return MindPetEngine.feed(save.pet.active, feeds);
}

// 花費 GBit：比照 sync-client.js 的 keyagentMergeSaveInto() 用「終身賺取
// -終身花費」算餘額的方式，維持跟雲端合併邏輯一致。
function petSpendGbit(save, amount) {
  if ((save.gbit || 0) < amount) return false;
  save.gbitSpentLifetime = (save.gbitSpentLifetime || 0) + amount;
  save.gbit = Math.max(0, (save.gbitEarnedLifetime || 0) - save.gbitSpentLifetime);
  return true;
}

// 開蛋認養：規則（依 Eric 的決定）—— 同時只能養 1 隻，要先封存目前這隻
// 才能開新蛋；成功後這隻新寵物的自動餵食基準點設成「現在」，不會回頭把
// 之前賺的 GBit 也算進來。
function petBuyEgg(save, studentId, category, gender) {
  if (save.pet.active) {
    return { success: false, message: "目前還有寵物在養，請先封存目前這隻才能開新蛋。" };
  }
  if (!petSpendGbit(save, PET_EGG_COST_GBIT)) {
    return { success: false, message: "GBit 不夠，開蛋需要 " + PET_EGG_COST_GBIT + " GBit。" };
  }
  const pet = MindPetEngine.createPet(studentId, category, gender);
  save.pet.active = pet;
  save.pet.lastFeedSyncGbit = save.gbitEarnedLifetime;
  save.pet.manualFeedStreak = 0;
  return { success: true, pet };
}

// 計算「下一次」手動餵食要花多少 GBit：連續手動餵食（中間沒有靠自動餵食
// 打斷）每次費用 ×5，一直沒有去練習就會越餵越貴，避免一次把存的 GBit
// 全部拿去手動催熟。只要有練習賺到 GBit（petSyncAutoFeed 觸發過一次），
// 這個倍數就會重置回原價。
function petNextManualFeedCost(save) {
  const streak = (save.pet && save.pet.manualFeedStreak) || 0;
  return PET_MANUAL_FEED_COST_GBIT * Math.pow(PET_MANUAL_FEED_STREAK_MULTIPLIER, streak);
}

// 手動餵食：花 GBit 直接 +1 餵養次數（跟自動累積是兩條互不影響的路徑）
function petManualFeed(save) {
  if (!save.pet.active) return { success: false, message: "目前沒有養寵物。" };
  const cost = petNextManualFeedCost(save);
  if (!petSpendGbit(save, cost)) {
    return { success: false, message: "GBit 不夠，這次手動餵食需要 " + cost + " GBit（連續手動餵食會越來越貴）。" };
  }
  save.pet.manualFeedStreak = (save.pet.manualFeedStreak || 0) + 1;
  return MindPetEngine.feed(save.pet.active, 1);
}

// 重燃魔藥：直接用 GBit 購買並立即使用（依 Eric 的決定，不做另外的道具庫存）
function petRevive(save) {
  if (!save.pet.active) return { success: false, message: "目前沒有養寵物。" };
  if (!petSpendGbit(save, PET_REVIVE_COST_GBIT)) {
    return { success: false, message: "GBit 不夠，重燃魔藥需要 " + PET_REVIVE_COST_GBIT + " GBit。" };
  }
  return MindPetEngine.revive(save.pet.active);
}

// 封存目前寵物到英雄殿堂，讓玩家可以認養下一隻
function petArchiveActive(save, semesterName) {
  if (!save.pet.active) return null;
  const result = MindPetEngine.archiveSemester(save.pet.active, semesterName || "");
  save.pet.hallOfFame.push(result.record);
  save.pet.active = null;
  save.pet.manualFeedStreak = 0;
  return result;
}
