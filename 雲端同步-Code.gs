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
