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

  if (!save && pendingAttempts.length === 0) return null;
  return { studentNumber, save, pendingAttempts, syncedAt: Date.now() };
}

// 立即同步：把目前存檔快照 + 所有待同步的 ETP/看打紀錄，一次送到雲端中繼站。
// 全程安靜失敗（沒設定中繼網址、沒登入、沒網路都直接回傳 success:false），
// 呼叫端不需要特別處理錯誤，同步本來就是「有的話更好，沒有也不影響練習」。
async function keyagentCloudSyncNow() {
  if (!CLOUD_RELAY_URL) return { success: false, reason: "no-relay-configured" };
  const payload = keyagentBuildSyncPayload();
  if (!payload) {
    return { success: false, reason: keyagentGetActiveStudentNumber() ? "nothing-to-sync" : "not-logged-in" };
  }

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
  if (!CLOUD_RELAY_URL) return false;
  if (typeof navigator === "undefined" || !navigator.sendBeacon) return false;
  const payload = keyagentBuildSyncPayload();
  if (!payload) return false;
  try {
    const blob = new Blob([JSON.stringify(payload)], { type: "text/plain;charset=utf-8" });
    const sent = navigator.sendBeacon(CLOUD_RELAY_URL, blob);
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

// 合併規則：本機欄位優先（缺的才補雲端的），但 GBit 相關欄位改用「終身累積
// 賺取／花費」各自取較大值、重新算出餘額——這樣才不會因為在兩台裝置分別
// 賺、分別花，合併後對不起來（例如在家賺的被學校電腦的舊存檔蓋掉）。
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

  const merged = Object.assign({}, cloudSave, local);
  const earned = Math.max(local.gbitEarnedLifetime || 0, cloudSave.gbitEarnedLifetime || 0);
  const spent = Math.max(local.gbitSpentLifetime || 0, cloudSave.gbitSpentLifetime || 0);
  merged.gbitEarnedLifetime = earned;
  merged.gbitSpentLifetime = spent;
  merged.gbit = Math.max(0, earned - spent);

  localStorage.setItem(key, JSON.stringify(merged));
}
