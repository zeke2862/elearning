/**
 * ============================================================
 * 雲端同步中繼站 — Google Apps Script
 * ============================================================
 * 這支程式碼「不是」在你的電腦上跑，是貼到 Google 試算表附帶的 Apps Script
 * 編輯器裡，部署成一個網址（Web App）。它扮演「學生在家的裝置」跟「學校
 * 電腦」中間的信箱：學生在家練習，資料先寄到這個信箱（寫進 Google 試算表
 * 的一列）；老師電腦有空、也連得到網路時，就來把信箱裡還沒處理的信都領走，
 * 寫進校內的 SQLite 資料庫，然後回頭跟這裡說「這幾封處理完了」。
 *
 * 部署步驟看專案裡附的「雲端同步部署說明.md」，這裡只需要照著貼、照著部署，
 * 不用改動下面的程式碼內容。
 * ============================================================
 */

const SHEET_NAME = "sync_queue";

// 學生端（sync-client.js）用 POST 送資料進來，或老師端用 POST 標記已處理
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getSheet_();

    if (data.action === "markDone") {
      (data.rowIndexes || []).forEach(function (idx) {
        sheet.getRange(idx, 4).setValue("done");
      });
      return jsonOut_({ success: true });
    }

    // 預設情況：這是學生端送來的一筆同步資料
    sheet.appendRow([
      new Date(),                  // A 收到時間
      data.studentNumber || "",    // B 學號（方便你人工瞄一眼，實際匯入看的是 C 欄整包 JSON）
      JSON.stringify(data),        // C 完整資料（原封不動存起來，老師端 /sync-import 會解析這欄）
      "pending"                    // D 狀態：pending（還沒處理）／done（已匯入校內資料庫）
    ]);
    return jsonOut_({ success: true });
  } catch (err) {
    return jsonOut_({ success: false, message: String(err) });
  }
}

// 老師端用 GET 把「還沒處理」的資料一次領走
function doGet(e) {
  // 數學科 JB2 老師報表：要帶 ?action=jb2&token=密碼 才會回傳（密碼設在「專案設定 → 指令碼屬性」JB2_TOKEN）
  if (e && e.parameter && e.parameter.action === "jb2") return jb2Report_(e);
  try {
    const sheet = getSheet_();
    const rows = sheet.getDataRange().getValues();
    const pending = [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][3] === "pending") {
        pending.push({
          rowIndex: i + 1,          // Apps Script 試算表列號從 1 開始，第 1 列是標題
          receivedAt: rows[i][0],
          studentNumber: rows[i][1],
          payload: rows[i][2]
        });
      }
    }
    return jsonOut_({ success: true, items: pending });
  } catch (err) {
    return jsonOut_({ success: false, message: String(err) });
  }
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["收到時間", "學號", "資料(JSON)", "狀態"]);
  }
  return sheet;
}

// ============================================================
// 數學科 JB2 老師報表（math/JB2/jb2-report.html 會呼叫這裡）
// 每位學生只回傳「最新彙整後」的 JB2 紀錄，不含鍵位特工等其他遊戲資料，
// 也不管學校主機名單有沒有這個學號。沒有正確的 token 一律拒絕。
// ============================================================
function jb2Report_(e) {
  var tok = PropertiesService.getScriptProperties().getProperty("JB2_TOKEN");
  if (!tok || String(e.parameter.token) !== tok) return jsonOut_({ success: false, message: "forbidden" });
  var sheet = getSheet_();
  var last = sheet.getLastRow();
  if (last < 2) return jsonOut_({ success: true, students: [] });
  var vals = sheet.getRange(2, 1, last - 1, 3).getValues();
  var byNo = {};
  for (var i = 0; i < vals.length; i++) {
    var raw = String(vals[i][2] || "");
    if (raw.indexOf('"jb2"') < 0) continue;          // 沒有 JB2 的列直接略過（也省時間）
    var p;
    try { p = JSON.parse(raw); } catch (err) { continue; }   // 超過儲存格上限被截斷的列會解析失敗，略過
    var j = p && p.other && p.other.jb2;
    if (!j) continue;
    var no = String(p.studentNumber || vals[i][1] || "").trim();
    if (!no) continue;
    var at = (vals[i][0] instanceof Date) ? vals[i][0].getTime() : 0;
    byNo[no] = mergeJb2_(byNo[no], j, at);
  }
  var out = Object.keys(byNo).map(function (no) { return { studentNumber: no, jb2: byNo[no] }; });
  return jsonOut_({ success: true, generatedAt: new Date().getTime(), students: out });
}

// 同一位學生可能在多個裝置（手機＋電腦）玩過：關卡的最高星／次數／時間各取較大值，最後一關取較新那份。
function mergeJb2_(a, b, at) {
  b = JSON.parse(JSON.stringify(b)); b._at = at;
  if (!a) return b;
  var newer = (Number(b.lastAt) || 0) >= (Number(a.lastAt) || 0) ? b : a;
  var older = newer === b ? a : b;
  var out = JSON.parse(JSON.stringify(newer));
  out._at = Math.max(Number(a._at) || 0, at);
  var ids = {};
  Object.keys(a.stages || {}).forEach(function (k) { ids[k] = 1; });
  Object.keys(b.stages || {}).forEach(function (k) { ids[k] = 1; });
  out.stages = {};
  var ts = 0, tp = 0, tt = 0;
  Object.keys(ids).forEach(function (k) {
    var n = (newer.stages || {})[k], o = (older.stages || {})[k];
    var base = JSON.parse(JSON.stringify(n || o));
    base.bestStars = Math.max((n && n.bestStars) || 0, (o && o.bestStars) || 0);
    base.plays = Math.max((n && n.plays) || 0, (o && o.plays) || 0);
    base.totalSecs = Math.max((n && n.totalSecs) || 0, (o && o.totalSecs) || 0);
    out.stages[k] = base;
    ts += base.bestStars; tp += base.plays; tt += base.totalSecs;
  });
  out.totalStars = ts; out.totalPlays = tp; out.totalSecs = tt;
  return out;
}
