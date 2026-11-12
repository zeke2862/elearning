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
  if (e && e.parameter && e.parameter.action === "games") return gamesReport_(e);
  if (e && e.parameter && e.parameter.action === "game") return gameReport_(e);
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

// 同一位學生可能在多個裝置（手機＋電腦）玩過：關卡的最高星／次數／練習秒數各取較大值，
// 答對率的題數取「作答題數較多」那一份，最後一關取較新那份。
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
    var n = (newer.stages || {})[k] || {}, o = (older.stages || {})[k] || {};
    var base = JSON.parse(JSON.stringify(newer.stages && newer.stages[k] ? n : o));
    base.bestStars = Math.max(n.bestStars || 0, o.bestStars || 0);
    base.plays = Math.max(n.plays || 0, o.plays || 0);
    base.pSecs = Math.max(n.pSecs || 0, o.pSecs || 0);
    var qs = (n.totalQ || 0) >= (o.totalQ || 0) ? n : o;
    base.totalQ = qs.totalQ || 0; base.totalOk = qs.totalOk || 0;
    out.stages[k] = base;
    ts += base.bestStars; tp += base.plays; tt += base.pSecs;
  });
  // 各題型答對統計：同一題型取作答數較多的那一份
  var qa = a.q || {}, qb = b.q || {}, qm = {};
  Object.keys(qa).concat(Object.keys(qb)).forEach(function (k) {
    var x = qa[k], y = qb[k];
    qm[k] = (!y || (x && x.n >= y.n)) ? x : y;
  });
  out.q = qm;
  out.totalStars = ts; out.totalPlays = tp; out.pSecs = tt;
  return out;
}

// ============================================================
// 通用遊戲報表（game-report.html 會呼叫這裡）——任何遊戲（任何科目、任何年級）都能用
//
// 權限（密碼）有三種，都設在「專案設定 → 指令碼屬性」：
//   JB2_TOKEN      ＝總管密碼，可看所有遊戲（老師自己用）。
//   REPORT_TOKENS  ＝其他人的密碼，格式：  密碼1=範圍;密碼2=範圍;…
//                    範圍可以是：  *（全部）、 chi-*（所有 chi- 開頭的遊戲，例如國文科）、 chi-hanzi（只有這一款）
//                    範圍可以用逗號放多個，例如：  abc123=chi-*,eng-*;xyz789=chi-hanzi
//                    （密碼請用英數字長一點，不要含  = ; ,  ）
// 遊戲代號：英文小寫、數字、- 、_ ，建議「科目簡碼-遊戲名」，例如 chi-hanzi、eng-vocab、math-jb2。
// ============================================================
function tokenScope_(token) {
  token = String(token || "");
  if (!token) return null;
  var props = PropertiesService.getScriptProperties();
  var master = props.getProperty("JB2_TOKEN");
  if (master && token === master) return ["*"];
  var parts = String(props.getProperty("REPORT_TOKENS") || "").split(";");
  for (var i = 0; i < parts.length; i++) {
    var at = parts[i].indexOf("=");
    if (at < 1) continue;
    if (parts[i].slice(0, at).trim() === token) {
      return parts[i].slice(at + 1).split(",").map(function (x) { return x.trim(); }).filter(Boolean);
    }
  }
  return null;
}
function scopeAllows_(scope, game) {
  for (var i = 0; i < scope.length; i++) {
    var s = scope[i];
    if (s === "*" || s === game) return true;
    if (s.length > 1 && s.charAt(s.length - 1) === "*" && game.indexOf(s.slice(0, -1)) === 0) return true;
  }
  return false;
}

// 兩份「其他遊戲」紀錄合併（規則跟 sync-client.js 一樣）：best／total／max 開頭或 plays 的數字取大值，其餘取較新的
function mergeOther_(a, b, newerIsA) {
  function isObj(v) { return v && typeof v === "object" && !Array.isArray(v); }
  if (!isObj(a)) return b;
  if (!isObj(b)) return a;
  var out = {}, seen = {};
  Object.keys(a).concat(Object.keys(b)).forEach(function (k) {
    if (seen[k]) return; seen[k] = 1;
    var x = a[k], y = b[k];
    if (x === undefined) out[k] = y;
    else if (y === undefined) out[k] = x;
    else if (typeof x === "number" && typeof y === "number") out[k] = /^(best|total|max)|^(plays|updatedAt)$/.test(k) ? Math.max(x, y) : (newerIsA ? x : y);
    else if (isObj(x) && isObj(y)) {
      var hasTs = x.updatedAt !== undefined || y.updatedAt !== undefined;
      var nA = hasTs ? (Number(x.updatedAt) || 0) >= (Number(y.updatedAt) || 0) : newerIsA;
      out[k] = mergeOther_(x, y, nA);
    } else if (k === "hist" && Array.isArray(x) && Array.isArray(y)) {   // 每次作答紀錄：兩邊合併、依時間排序、保留最近 30 筆
      var u = {}; x.concat(y).forEach(function (e) { if (e) u[e.at] = e; });
      out[k] = Object.keys(u).map(function (t) { return u[t]; }).sort(function (p, q) { return p.at - q.at; }).slice(-30);
    } else out[k] = newerIsA ? x : y;
  });
  return out;
}

// 掃描整份信箱，回傳 { 遊戲代號: { 學號: 合併後的紀錄 } }（只含這把密碼看得到的遊戲）
function collectGames_(scope, onlyGame) {
  var sheet = getSheet_(), last = sheet.getLastRow(), out = {};
  if (last < 2) return out;
  var vals = sheet.getRange(2, 1, last - 1, 3).getValues();
  for (var i = 0; i < vals.length; i++) {
    var raw = String(vals[i][2] || "");
    if (raw.indexOf('"other"') < 0) continue;
    if (onlyGame && raw.indexOf('"' + onlyGame + '"') < 0) continue;
    var p;
    try { p = JSON.parse(raw); } catch (err) { continue; }     // 超過儲存格上限被截斷的列會解析失敗，略過
    var o = p && p.other;
    if (!o || typeof o !== "object") continue;
    var no = String(p.studentNumber || vals[i][1] || "").trim();
    if (!no) continue;
    var at = (vals[i][0] instanceof Date) ? vals[i][0].getTime() : 0;
    Object.keys(o).forEach(function (g) {
      var v = o[g];
      if (!v || typeof v !== "object" || Array.isArray(v)) return;
      if (!/^[a-z0-9][a-z0-9_-]{1,30}$/.test(g)) return;
      if (onlyGame && g !== onlyGame) return;
      if (!scopeAllows_(scope, g)) return;
      var byNo = out[g] || (out[g] = {});
      var prev = byNo[no];
      var rec = prev ? mergeOther_(prev, v, (Number(prev.updatedAt) || 0) >= (Number(v.updatedAt) || 0)) : JSON.parse(JSON.stringify(v));
      rec._at = Math.max(prev ? (Number(prev._at) || 0) : 0, at);
      byNo[no] = rec;
    });
  }
  return out;
}

// ?action=games&token=…  → 這把密碼看得到的遊戲清單與玩過的人數
function gamesReport_(e) {
  var scope = tokenScope_(e.parameter.token);
  if (!scope) return jsonOut_({ success: false, message: "forbidden" });
  var all = collectGames_(scope, "");
  var games = Object.keys(all).sort().map(function (g) { return { game: g, students: Object.keys(all[g]).length }; });
  return jsonOut_({ success: true, games: games });
}

// 資料檢查：只「標記」可疑的紀錄（不刪、不改學生的資料），讓後台顯示 ⚠️。
// 規則：答對題數不可多於題數／一次超過 30 分鐘／時間在未來／兩次作答間隔不到 5 秒／
//       拿到星卻平均每題不到 1.5 秒／星數超過 5／逐次紀錄比總次數多。
// 每筆可疑的逐次紀錄會加上 f（原因陣列）；整份紀錄加上 _flags（[{sid, msg}]）。
function checkRec_(rec) {
  var now = new Date().getTime(), flags = [];
  var stages = (rec && rec.stages) || {};
  Object.keys(stages).forEach(function (sid) {
    var st = stages[sid] || {};
    if ((st.totalOk || 0) > (st.totalQ || 0)) flags.push({ sid: sid, msg: "累計答對題數多於作答題數" });
    if ((st.bestStars || 0) > 5) flags.push({ sid: sid, msg: "星數超過 5" });
    var hist = Array.isArray(st.hist) ? st.hist : [];
    if (hist.length > (st.plays || 0) && (st.plays || 0) > 0) flags.push({ sid: sid, msg: "逐次紀錄筆數比總次數多" });
    var prev = null;
    hist.forEach(function (h) {
      if (!h || typeof h !== "object") return;
      var f = [];
      if ((h.ok || 0) > (h.q || 0)) f.push("答對題數多於題數");
      if ((h.s || 0) > 1800) f.push("單次超過 30 分鐘");
      if ((h.at || 0) > now + 3600000) f.push("時間在未來");
      if ((h.st || 0) > 5) f.push("星數超過 5");
      if ((h.st || 0) > 0 && (h.q || 0) >= 5 && (h.s || 0) < (h.q || 0) * 1.5) f.push("拿到星但太快（平均每題不到 1.5 秒）");
      if (prev && (h.at || 0) - (prev.at || 0) < 5000) f.push("和上一次相隔不到 5 秒");
      if (f.length) { h.f = f; f.forEach(function (m) { flags.push({ sid: sid, msg: m }); }); }
      prev = h;
    });
  });
  if (flags.length) rec._flags = flags;
}

// ?action=game&game=遊戲代號&token=…  → 這款遊戲每位學生「合併後」的最新紀錄
function gameReport_(e) {
  var scope = tokenScope_(e.parameter.token);
  var g = String(e.parameter.game || "");
  if (!scope || !scopeAllows_(scope, g)) return jsonOut_({ success: false, message: "forbidden" });
  var byNo = (collectGames_(scope, g)[g]) || {};
  var students = Object.keys(byNo).map(function (no) { checkRec_(byNo[no]); return { studentNumber: no, rec: byNo[no] }; });
  return jsonOut_({ success: true, game: g, generatedAt: new Date().getTime(), students: students });
}
