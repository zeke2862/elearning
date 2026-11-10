// sync-client.js
// ============ 共用「雲端同步」小工具 ============
// 三個地方都會載入這支：index.html（登入/選單頁）、ETP 測驗、看打測驗。
//
// 負責兩件事：
//   1. 交卷/練習當下連不到學校主機時（通常是在家），先把這筆資料存進
//      localStorage 的「待同步佇列」，不會憑空遺失。
//   2. 找機會（登入時、按下「立即同步」、或每次交卷後）把待同步佇列
//      連同目前的塔防存檔快照，一次送到 Google 試算表（透過 Apps Script
//      Web App 中繼）。之後老師電腦會定期來試算表把資料領走、寫進校內
//      資料庫，見 admin.html「六、雲端同步」。
//
// ⚠️ 部署設定：把下面 CLOUD_RELAY_URL 換成你自己部署好的 Apps Script Web
// App 網址（步驟見隨附的「雲端同步部署說明.md」）。沒填之前，這支工具的
// 所有同步功能都會安靜跳過、不報錯，不影響遊戲/測驗照常運作——先不部署
// 雲端同步，其他功能完全不受影響。
const CLOUD_RELAY_URL = "https://script.google.com/macros/s/AKfycbwVsNUmhpicvrNRmqcsZhIl2TMuImIMBwO40P9Oxma0fWPgT_j2sEDu4IPegXjr4K9c/exec"; // 例如 "https://script.google.com/macros/s/xxxxx/exec"

const SYNC_PENDING_QUEUE_KEY = "keyagent_pending_sync";
const SYNC_ACTIVE_STUDENT_KEY = "keyagent_active_student";
const SYNC_BASE_SAVE_KEY = "keyagent_save_v1";
const SYNC_OTHER_KEY = "keyagent_other_v1";   // 末日生存、ZType 等「其他遊戲」的紀錄（依學號分開存）
// 學校主機：在學校內網時，進度會直接送到這裡（不必等老師匯入雲端資料）。
const KEYAGENT_SCHOOL_HOST = "http://192.168.1.1:3000";

function keyagentGetActiveStudentNumber() {
  try {
    const raw = localStorage.getItem(SYNC_ACTIVE_STUDENT_KEY);
    const identity = raw ? JSON.parse(raw) : null;
    return (identity && identity.studentNumber) || null;
  } catch (err) {
    return null;
  }
}

function keyagentSaveKeyFor(studentNumber) {
  return studentNumber ? `${SYNC_BASE_SAVE_KEY}:${studentNumber}` : SYNC_BASE_SAVE_KEY;
}

// 交卷但連不到學校主機時呼叫：先把這筆資料存起來，等同步時一起送出。
// type 用 "etp" 或 "lookType"，data 放這次測驗的完整結果物件。
function keyagentQueuePendingAttempt(type, data) {
  try {
    const raw = localStorage.getItem(SYNC_PENDING_QUEUE_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    queue.push({ type, data, queuedAt: Date.now() });
    localStorage.setItem(SYNC_PENDING_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error("待同步佇列寫入失敗", err);
  }
}

// 打包這次要送出的資料：目前存檔快照 + 所有待同步的 ETP/看打紀錄。
// 回傳 null 代表沒有登入或沒有東西需要同步，呼叫端可以直接跳過。
// 供一般同步 (keyagentCloudSyncNow) 與離開頁面時的 beacon 同步共用，
// 避免兩處各寫一份、之後改欄位漏改。
function keyagentBuildSyncPayload() {
  const studentNumber = keyagentGetActiveStudentNumber();
  if (!studentNumber) return null;

  let save = null;
  try {
    const raw = localStorage.getItem(keyagentSaveKeyFor(studentNumber));
    save = raw ? JSON.parse(raw) : null;
  } catch (err) { /* 存檔壞掉就不附，待同步紀錄照送 */ }

  let pendingAttempts = [];
  try {
    const raw = localStorage.getItem(SYNC_PENDING_QUEUE_KEY);
    pendingAttempts = raw ? JSON.parse(raw) : [];
  } catch (err) { /* ignore */ }

  const other = keyagentGetOtherGames(studentNumber);
  if (!save && !other && pendingAttempts.length === 0) return null;
  return { studentNumber, save, other, pendingAttempts, syncedAt: Date.now() };
}

// 立即同步：把目前存檔快照 + 所有待同步的 ETP/看打紀錄，一次送到雲端中繼站。
// 全程安靜失敗（沒設定中繼網址、沒登入、沒網路都直接回傳 success:false），
// 呼叫端不需要特別處理錯誤，同步本來就是「有的話更好，沒有也不影響練習」。
async function keyagentCloudSyncNow() {
  const payload = keyagentBuildSyncPayload();
  if (!payload) {
    return { success: false, reason: keyagentGetActiveStudentNumber() ? "nothing-to-sync" : "not-logged-in" };
  }

  // 💡 在學校內網就直接送到學校主機（進度馬上進資料庫、老師報表看得到、換電腦也能接續）；
  //    連不到（在家）才走雲端中繼站。
  if (await keyagentPushToSchool(payload)) {
    localStorage.setItem(SYNC_PENDING_QUEUE_KEY, "[]");
    return { success: true, via: "school" };
  }
  if (!CLOUD_RELAY_URL) return { success: false, reason: "network-error" };

  try {
    const res = await fetch(CLOUD_RELAY_URL, {
      method: "POST",
      // 💡 Apps Script Web App 對 application/json 常常會先跑一次 CORS 預檢(OPTIONS)
      // 而卡住，改用 text/plain 送出、後端自己 JSON.parse(e.postData.contents) 是
      // 官方文件推薦的繞法，瀏覽器不會發預檢請求。
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) return { success: false, reason: "relay-error" };
    // 送出成功才清空待同步佇列；存檔快照本來就是每次都附最新的，不用另外處理。
    localStorage.setItem(SYNC_PENDING_QUEUE_KEY, "[]");
    return { success: true };
  } catch (err) {
    return { success: false, reason: "network-error" };
  }
}

// 「關閉分頁/登出當下」專用的同步：這個時間點頁面隨時可能被瀏覽器砍掉，
// 一般的 fetch() 常常來不及送出就被中斷，所以改用瀏覽器保證「即使頁面關閉
// 也會盡力送出」的 navigator.sendBeacon。是 fire-and-forget，沒有回應可讀，
// 也不能 await——呼叫端（登出按鈕/關閉頁面事件）不用等它，也不需要處理錯誤。
function keyagentCloudSyncBeacon() {
  if (typeof navigator === "undefined" || !navigator.sendBeacon) return false;
  const payload = keyagentBuildSyncPayload();
  if (!payload) return false;
  try {
    const blob = new Blob([JSON.stringify(payload)], { type: "text/plain;charset=utf-8" });
    // 學校主機和雲端中繼站各送一份（互不影響；學校主機的合併規則是「只增不減」，重複送沒關係）
    let sentSchool = false;
    try { sentSchool = navigator.sendBeacon(KEYAGENT_SCHOOL_HOST + "/sync-import", blob); } catch (e) { /* ignore */ }
    const sent = (CLOUD_RELAY_URL ? navigator.sendBeacon(CLOUD_RELAY_URL, blob) : false) || sentSchool;
    // 樂觀清空待同步佇列：sendBeacon 回傳 true 只代表瀏覽器已接手排入送出，
    // 不保證伺服器端一定收到，但這已是頁面關閉前的最後機會，不清空的話
    // 佇列只會越積越多；之後登入時若真的漏送，補救靠 keyagentPullCloudSave
    // 從雲端彙總存檔合併回來，不會真的遺失代幣進度。
    if (sent) localStorage.setItem(SYNC_PENDING_QUEUE_KEY, "[]");
    return sent;
  } catch (err) {
    return false;
  }
}

// 學校電腦驗證登入成功後呼叫：跟學校主機要這個學生的「雲端彙總存檔」，
// 跟本機存檔做安全合併，讓「在家賺到的代幣/進度」在學校電腦也看得到。
async function keyagentPullCloudSave(schoolHost, studentId) {
  if (!schoolHost || !studentId) return;
  try {
    const res = await fetch(`${schoolHost}/get-save?studentId=${encodeURIComponent(studentId)}`);
    if (!res.ok) return;
    const data = await res.json();
    if (!data || !data.success || !data.save) return;
    keyagentMergeSaveInto(keyagentGetActiveStudentNumber(), data.save);
  } catch (err) { /* 拿不到就算了，不影響登入，下次同步再補 */ }
}

// 把雲端／學校資料庫的存檔，跟這台電腦上的本機存檔「安全合併」：
// 關卡星數、最佳成績取較大值，只要任何一邊通關就算通關（見下方 keyagentMergeProgress）。
// 所以學生換座位、換電腦，打學號登入後就能接續自己的進度；舊電腦上的舊存檔也不會擋住新進度。
function keyagentMergeSaveInto(studentNumber, cloudSave) {
  if (!studentNumber || !cloudSave) return;
  const key = keyagentSaveKeyFor(studentNumber);
  let local = {};
  try {
    const raw = localStorage.getItem(key);
    local = raw ? JSON.parse(raw) : {};
  } catch (err) {
    local = {};
  }
  const merged = keyagentMergeProgress(local, cloudSave);
  // 其他遊戲的紀錄另外存，不放進鍵位特工的存檔裡（免得被鍵位特工的存檔覆蓋掉）
  const otherCloud = merged.otherGames || null;
  delete merged.otherGames;
  localStorage.setItem(key, JSON.stringify(merged));
  if (otherCloud) {
    const localOther = keyagentGetOtherGames(studentNumber);
    const newerIsLocal = (Number((localOther || {}).updatedAt) || 0) >= (Number(otherCloud.updatedAt) || 0);
    localStorage.setItem(SYNC_OTHER_KEY + ":" + studentNumber,
      JSON.stringify(keyagentMergeOther(localOther || {}, otherCloud, newerIsLocal)));
  }
}

// ===== 其他遊戲（末日生存 zombie、ZType ztype）的紀錄 =====
// 格式：{ updatedAt, zombie:{ bestScore, plays, resume:{...} }, ztype:{...} }
function keyagentGetOtherGames(studentNumber) {
  studentNumber = studentNumber || keyagentGetActiveStudentNumber();
  if (!studentNumber) return null;
  try {
    const raw = localStorage.getItem(SYNC_OTHER_KEY + ":" + studentNumber);
    return raw ? JSON.parse(raw) : null;
  } catch (err) { return null; }
}
// 更新某個遊戲的紀錄。updater(舊紀錄) 回傳新紀錄；沒登入學號就什麼都不做（回傳 null）。
function keyagentUpdateOtherGame(gameKey, updater) {
  const studentNumber = keyagentGetActiveStudentNumber();
  if (!studentNumber) return null;
  const all = keyagentGetOtherGames(studentNumber) || {};
  const now = Date.now();
  const prev = all[gameKey] || {};
  const next = Object.assign({}, prev, updater(prev) || {});   // 只需回傳要更新的欄位，其他欄位保留
  next.updatedAt = now;
  all[gameKey] = next;
  all.updatedAt = now;
  try { localStorage.setItem(SYNC_OTHER_KEY + ":" + studentNumber, JSON.stringify(all)); } catch (err) { /* ignore */ }
  keyagentSchedulePush();
  return next;
}

// ===== 直接送到學校主機 =====
async function keyagentPushToSchool(payload) {
  if (!payload) return false;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(KEYAGENT_SCHOOL_HOST + "/sync-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal
    });
    clearTimeout(timer);
    if (!res.ok) return false;
    const data = await res.json();
    return !!(data && data.success);
  } catch (err) {
    return false;   // 連不到學校主機（在家或主機沒開），交給雲端中繼站
  }
}

// 過關／存檔之後呼叫：2 秒內多次呼叫只會送一次，不會拖慢遊戲。
let _keyagentPushTimer = null;
function keyagentSchedulePush(delayMs) {
  if (!keyagentGetActiveStudentNumber()) return;
  clearTimeout(_keyagentPushTimer);
  _keyagentPushTimer = setTimeout(() => { keyagentCloudSyncNow(); }, delayMs || 2000);
}
// 離開遊戲頁面時再送一次（排程中的也一併補上）
function keyagentInstallPageHideSync() {
  window.addEventListener("pagehide", () => {
    clearTimeout(_keyagentPushTimer);
    keyagentCloudSyncBeacon();
  });
}

// ===== keyagentMergeProgress：兩份「鍵位特工」存檔的安全合併（本機 ↔ 雲端／學校資料庫）=====
// 原則：進度只增不減。關卡星數／最佳成績取較大值、通關狀態取「任一邊通關就算通關」，
// 可消耗品（代幣）取較新那份、GBit 用「終身賺取／花費」各取大值重算餘額。
// ⚠️ 這段程式在 sync-client.js（學生端）和 God/server.js（學校主機）各有一份一模一樣的副本，
//    改規則時兩邊要一起改。
function keyagentIsObj(v){ return v && typeof v === "object" && !Array.isArray(v); }
function keyagentMaxNum(a, b){ return Math.max(Number(a) || 0, Number(b) || 0); }
function keyagentMergeNumMax(a, b){
  const out = {};
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  keys.forEach(k => {
    const x = (a || {})[k], y = (b || {})[k];
    if (typeof x === "number" || typeof y === "number") out[k] = keyagentMaxNum(x, y);
    else out[k] = (y !== undefined ? y : x);
  });
  return out;
}
function keyagentMergeLevels(a, b){
  const out = {};
  const ids = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  ids.forEach(id => {
    const x = (a || {})[id] || {}, y = (b || {})[id] || {};
    out[id] = Object.assign({}, x, y, {
      stars: keyagentMaxNum(x.stars, y.stars),
      bestWpm: keyagentMaxNum(x.bestWpm, y.bestWpm),
      bestAcc: keyagentMaxNum(x.bestAcc, y.bestAcc),
      bestCombo: keyagentMaxNum(x.bestCombo, y.bestCombo),
      plays: keyagentMaxNum(x.plays, y.plays),
      cleared: !!(x.cleared || y.cleared)
    });
  });
  return out;
}
// 其他遊戲（末日生存、ZType…）的紀錄：數字取大；其餘欄位（例如文章接續位置）取 updatedAt 較新的那份
function keyagentMergeOther(a, b, newerIsA){
  if (!keyagentIsObj(a)) return b;
  if (!keyagentIsObj(b)) return a;
  const out = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  keys.forEach(k => {
    const x = a[k], y = b[k];
    if (x === undefined) out[k] = y;
    else if (y === undefined) out[k] = x;
    // 「最佳／累計」類數字（best*、total*、plays、updatedAt）取大值；其餘（例如接續位置、最近一次分數）取較新那份
    else if (typeof x === "number" && typeof y === "number") out[k] = /^(best|total|max)|^(plays|updatedAt)$/.test(k) ? Math.max(x, y) : (newerIsA ? x : y);
    else if (keyagentIsObj(x) && keyagentIsObj(y)) {
      const hasTs = x.updatedAt !== undefined || y.updatedAt !== undefined;   // 自己有時間戳就用自己的，沒有就沿用上一層的判斷
      const nA = hasTs ? (Number(x.updatedAt) || 0) >= (Number(y.updatedAt) || 0) : newerIsA;
      out[k] = keyagentMergeOther(x, y, nA);
    }
    else out[k] = newerIsA ? x : y;
  });
  return out;
}
function keyagentMergeProgress(local, cloud){
  local = local || {}; cloud = cloud || {};
  const lp = Number(local.lastPlayed) || 0, cp = Number(cloud.lastPlayed) || 0;
  const newer = lp >= cp ? local : cloud, older = lp >= cp ? cloud : local;
  const out = Object.assign({}, older, newer);          // 其他沒特別處理的欄位：較新的那份優先
  if (!out.playerName) out.playerName = local.playerName || cloud.playerName || "";
  out.createdAt = Math.min(Number(local.createdAt) || Infinity, Number(cloud.createdAt) || Infinity);
  if (!isFinite(out.createdAt)) out.createdAt = Date.now();
  out.lastPlayed = Math.max(lp, cp);

  // 劇情進度
  out.storyUnlockedChapter = Math.max(Number(local.storyUnlockedChapter) || 1, Number(cloud.storyUnlockedChapter) || 1);
  out.storyClearedChapter = keyagentMaxNum(local.storyClearedChapter, cloud.storyClearedChapter);

  // 各章各關
  const chapters = {};
  const cids = new Set([...Object.keys(local.chapters || {}), ...Object.keys(cloud.chapters || {})]);
  cids.forEach(cid => {
    const a = (local.chapters || {})[cid] || {}, b = (cloud.chapters || {})[cid] || {};
    chapters[cid] = Object.assign({}, a, b, { levels: keyagentMergeLevels(a.levels, b.levels) });
  });
  out.chapters = chapters;

  // 小遊戲、無盡模式
  out.minigames = keyagentMergeLevels(local.minigames, cloud.minigames);
  const le = local.endless || {}, ce = cloud.endless || {};
  const best = (Number(le.bestScore) || 0) >= (Number(ce.bestScore) || 0) ? le : ce;
  out.endless = Object.assign({}, ce, le, {
    bestTime: keyagentMaxNum(le.bestTime, ce.bestTime), bestScore: keyagentMaxNum(le.bestScore, ce.bestScore),
    bestGrade: best.bestGrade || le.bestGrade || ce.bestGrade || null, plays: keyagentMaxNum(le.plays, ce.plays)
  });

  // 成就、統計、防禦塔研究、商店
  out.achievements = Object.assign({}, cloud.achievements || {}, local.achievements || {});
  out.stats = keyagentMergeNumMax(local.stats, cloud.stats);
  out.towerResearch = keyagentMergeNumMax(local.towerResearch, cloud.towerResearch);
  const shop = keyagentMergeNumMax(local.shop, cloud.shop);
  Object.keys(shop).forEach(k => { if (/_tokens$/.test(k)) shop[k] = Number((newer.shop || {})[k]) || 0; });  // 消耗品取較新那份
  out.shop = shop;

  // 核心、GBit：核心取較新；GBit 用終身賺取／花費各取大值重算餘額
  out.core = Number(newer.core) || 0;
  const earned = keyagentMaxNum(local.gbitEarnedLifetime, cloud.gbitEarnedLifetime);
  const spent = keyagentMaxNum(local.gbitSpentLifetime, cloud.gbitSpentLifetime);
  out.gbitEarnedLifetime = earned; out.gbitSpentLifetime = spent;
  out.gbit = Math.max(0, earned - spent);

  // 其他遊戲
  if (local.otherGames || cloud.otherGames) {
    out.otherGames = keyagentMergeOther(local.otherGames, cloud.otherGames, (Number((local.otherGames || {}).updatedAt) || 0) >= (Number((cloud.otherGames || {}).updatedAt) || 0));
  }
  return out;
}
// ===== /keyagentMergeProgress =====
