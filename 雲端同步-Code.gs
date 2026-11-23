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

    if (data.action === "gLogin" || data.action === "gPull" || data.action === "gPush") return jsonOut_(gHandle_(data));
    if (data.action === "submitWork") return jsonOut_(wSubmit_(data));        // 作品投稿
    if (data.action === "workStatus") return jsonOut_(wSetStatus_(data));   // Google 帳號綁定（選用）

    try { notifyGuess_(data); } catch (e0) {}   // 學生被「亂猜重開」鎖定時，寄通知給老師（失敗不影響收件）

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
  if (e && e.parameter && e.parameter.action === "works") return wList_(e);      // 作品投稿：清單
  if (e && e.parameter && e.parameter.action === "work") return wGet_(e);        // 作品投稿：取一份程式碼
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

// ============================================================
// 「答錯馬上關掉重開、秒答亂猜」鎖定通知
// 學生端（jb2-guess.js）鎖定時，會把 rec.guess = {s,n,lastAt,log} 放進 JB2 紀錄一起送來。
// 這裡每個學號只在「有新的鎖定」（guess.lastAt 比上次通知晚）時通知一次：
//   1. 在試算表另開 guess_log 工作表記一列（後台隨時可看）
//   2. 寄信給 指令碼屬性 NOTIFY_EMAIL（沒設就寄給部署這支程式的人）
// 第一次使用要在 Apps Script 編輯器手動執行一次任何函式並「授權寄信」，然後重新部署。
// ============================================================
function notifyGuess_(data) {
  var j = data && data.other && data.other.jb2, g = j && j.guess;
  if (!g || !(g.n > 0) || !(g.lastAt > 0)) return;
  var no = String(data.studentNumber || "").trim(); if (!no) return;
  var props = PropertiesService.getScriptProperties(), key = "guessAt_" + no;
  if ((Number(props.getProperty(key)) || 0) >= g.lastAt) return;
  props.setProperty(key, String(g.lastAt));
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sh = ss.getSheetByName("guess_log");
  if (!sh) { sh = ss.insertSheet("guess_log"); sh.appendRow(["通知時間", "學號", "勇者名", "累計鎖定次數", "累計違規次數", "鎖定時間", "來源"]); }
  var src = (j.defense || (j.stages && JSON.stringify(j.stages).indexOf('"g":"d"') >= 0)) ? "保衛戰/JB2" : "JB2";
  sh.appendRow([new Date(), no, j.hero || "", g.n, g.s, new Date(g.lastAt), src]);
  var to = props.getProperty("NOTIFY_EMAIL") || Session.getEffectiveUser().getEmail();
  if (to) MailApp.sendEmail(to, "【數學練習】學號 " + no + " 因「答錯就重開、秒答亂猜」被鎖定 5 分鐘",
    "學號：" + no + (j.hero ? "（勇者名：" + j.hero + "）" : "") + "\n累計鎖定 " + g.n + " 次、違規 " + g.s + " 次\n鎖定時間：" +
    new Date(g.lastAt) + "\n\n系統發現他答錯後很快就關掉遊戲重開、快速亂猜，已自動鎖定 5 分鐘並提醒他確實作答。\n詳細請看試算表的 guess_log 工作表，或 JB2 老師報表名字旁的 🔒。");
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
  // 「數學保衛戰」摘要：不管哪一份比較新，只要有一份標了就保留（各欄位取較大值），報表才標得出「🛡️ 也玩過數學保衛戰」
  var da = a.defense, db = b.defense;
  if (da || db) {
    out.defense = {
      plays: Math.max((da && da.plays) || 0, (db && db.plays) || 0), pSecs: Math.max((da && da.pSecs) || 0, (db && db.pSecs) || 0),
      stars: Math.max((da && da.stars) || 0, (db && db.stars) || 0), lastAt: Math.max((da && da.lastAt) || 0, (db && db.lastAt) || 0)
    };
  } else { delete out.defense; }
  // 「亂猜重開」記錄：不管哪份較新都保留（次數取大、log 依時間合併）
  var ga = a.guess, gb = b.guess;
  if (ga || gb) {
    var lg = ((ga && ga.log) || []).concat((gb && gb.log) || []).sort(function (p, q) { return (p.at || 0) - (q.at || 0); }).slice(-8);
    out.guess = { s: Math.max((ga && ga.s) || 0, (gb && gb.s) || 0), n: Math.max((ga && ga.n) || 0, (gb && gb.n) || 0),
      lastAt: Math.max((ga && ga.lastAt) || 0, (gb && gb.lastAt) || 0), until: Math.max((ga && ga.until) || 0, (gb && gb.until) || 0), log: lg };
  } else { delete out.guess; }
  // 「離開遊戲畫面」記錄（保衛戰：縮小、切 App、分割畫面超過 3 秒）：次數、秒數取大
  var la = a.leave, lb = b.leave;
  if (la || lb) {
    out.leave = { n: Math.max((la && la.n) || 0, (lb && lb.n) || 0), secs: Math.max((la && la.secs) || 0, (lb && lb.secs) || 0),
      lastAt: Math.max((la && la.lastAt) || 0, (lb && lb.lastAt) || 0) };
  } else { delete out.leave; }
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


// =====================================================================
// ===== Google 帳號綁定（選用）：讓學生把進度存在自己的 Google 帳號，換機子可接續 =====
// 前置設定（只做一次）：「專案設定 → 指令碼屬性」新增 GOOGLE_CLIENT_ID = 你在 Google Cloud 申請的「用戶端 ID」
// 資料放在分頁「Google帳號」：A=Google帳號代號(sub) B=Email C=學號 D=存檔JSON E=更新時間 F=登入憑證(session)
// 規則：一個學號只能被一個 Google 帳號綁定（先綁先贏）；沒綁定的人照舊用學號當訪客，完全不受影響。
// =====================================================================
const G_SHEET_ = "Google帳號";

function gSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(G_SHEET_);
  if (!sh) { sh = ss.insertSheet(G_SHEET_); sh.appendRow(["sub", "Email", "學號", "存檔(JSON)", "更新時間", "session"]); }
  return sh;
}

// 向 Google 驗證學生傳來的 id_token 是真的、而且是發給我們這個網站的
function gVerify_(idToken) {
  const cid = PropertiesService.getScriptProperties().getProperty("GOOGLE_CLIENT_ID");
  if (!cid) throw new Error("尚未設定 GOOGLE_CLIENT_ID");
  const res = UrlFetchApp.fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken), { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error("Google 驗證失敗，請重新登入");
  const t = JSON.parse(res.getContentText());
  if (t.aud !== cid) throw new Error("這個登入不是發給本網站的");
  if (Number(t.exp) * 1000 < Date.now()) throw new Error("登入已過期，請重新登入");
  if (String(t.email_verified) !== "true") throw new Error("這個 Google 帳號的 Email 尚未驗證");
  return { sub: String(t.sub), email: String(t.email || "") };
}

function gFindRow_(sh, col, value) {   // 回傳列號（找不到 0）
  const n = sh.getLastRow(); if (n < 2) return 0;
  const vals = sh.getRange(2, col, n - 1, 1).getValues();
  for (let i = 0; i < vals.length; i++) if (String(vals[i][0]) === String(value)) return i + 2;
  return 0;
}

function gHandle_(data) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = gSheet_();
    if (data.action === "gLogin") {
      const g = gVerify_(String(data.idToken || ""));
      let row = gFindRow_(sh, 1, g.sub);
      if (!row) {
        const sn = String(data.studentNumber || "").trim();
        if (!sn) return { success: true, needStudent: true };                 // 這個 Google 還沒綁定學號
        if (gFindRow_(sh, 3, sn)) return { success: false, message: "這個學號已經綁定在另一個 Google 帳號了，請找老師處理" };
        sh.appendRow([g.sub, g.email, sn, "", new Date(), ""]);
        row = sh.getLastRow();
      }
      const session = Utilities.getUuid() + Utilities.getUuid();
      sh.getRange(row, 6).setValue(session);                                   // 每次登入換新憑證（同時間只有最近登入的那台能自動備份）
      const r = sh.getRange(row, 1, 1, 6).getValues()[0];
      let save = null; try { save = r[3] ? JSON.parse(r[3]) : null; } catch (e) {}
      return { success: true, studentNumber: String(r[2]), email: String(r[1]), session: session, save: save };
    }
    // gPull / gPush：用登入換到的 session 憑證，不必每次重新跳 Google 視窗
    const row = data.session ? gFindRow_(sh, 6, data.session) : 0;
    if (!row) return { success: false, expired: true, message: "Google 登入已失效，請重新登入" };
    if (data.action === "gPull") {
      let save = null; try { const s = sh.getRange(row, 4).getValue(); save = s ? JSON.parse(s) : null; } catch (e) {}
      return { success: true, save: save };
    }
    if (data.action === "gPush") {
      const txt = JSON.stringify(data.save || {});
      if (txt.length > 45000) return { success: false, message: "存檔太大，無法備份" };
      sh.getRange(row, 4).setValue(txt); sh.getRange(row, 5).setValue(new Date());
      return { success: true };
    }
    return { success: false, message: "未知動作" };
  } catch (err) {
    return { success: false, message: String(err && err.message || err) };
  } finally { lock.releaseLock(); }
}


// =====================================================================
// ===== 作品投稿（submit.html 學生投稿／submissions.html 老師管理）=====
// 為什麼要有？蘋果手機免費版的學生做出的遊戲只能在 Claude 裡自己玩、下載不了。
// 做法：學生把「複製」下來的程式碼貼到投稿頁 → 存進試算表的「作品投稿」分頁 → 老師在管理頁預覽／下載成 .html。
//
// 試算表欄位：A 時間｜B 編號｜C 年級｜D 作品名稱｜E 作者｜F 學號｜G 狀態(new/done)｜H 字數｜I 片段數｜J 以後的欄＝程式碼分段
// （一格最多放約 5 萬字，所以長的程式碼要切成好幾段放在 J、K、L…欄，讀的時候再接回來）
//
// 設定（都在「專案設定 → 指令碼屬性」，選用）：
//   SUBMIT_CODE ＝投稿碼。有設的話，學生一定要填對才收件，可擋掉亂投稿的人。
//   老師看／下載投稿：用跟 game-report 同一把密碼（JB2_TOKEN 總管密碼最方便；
//   REPORT_TOKENS 的範圍要包含 work-submissions，例如  abc123=work-submissions）。
// =====================================================================
const W_SHEET_ = "作品投稿";
const W_CHUNK_ = 40000;        // 每格存的字數（Google 試算表一格上限約 5 萬字）
const W_MAX_CODE_ = 480000;    // 一份作品最多收 48 萬字（12 段），再大就拒收
const W_GRADES_ = ["中二", "中三", "高一", "高三", "其他"];
const W_FIRST_CODE_COL_ = 10;  // J 欄

function wSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(W_SHEET_);
  if (!sh) { sh = ss.insertSheet(W_SHEET_); sh.appendRow(["時間", "編號", "年級", "作品名稱", "作者", "學號", "狀態", "字數", "片段數", "程式碼分段…"]); sh.setFrozenRows(1); }
  return sh;
}
function wClean_(v, max) { return String(v == null ? "" : v).replace(/[\r\n\t]+/g, " ").trim().slice(0, max); }

// 學生投稿（doPost 呼叫）
function wSubmit_(data) {
  const need = PropertiesService.getScriptProperties().getProperty("SUBMIT_CODE");
  if (need && String(data.submitCode || "").trim() !== need) return { success: false, message: "投稿碼不對，請向老師確認" };
  const grade = wClean_(data.grade, 10), title = wClean_(data.title, 60), author = wClean_(data.author, 30), sn = wClean_(data.studentNumber, 20);
  const code = String(data.code || "");
  if (W_GRADES_.indexOf(grade) < 0) return { success: false, message: "請選擇年級" };
  if (!title) return { success: false, message: "請填作品名稱" };
  if (!author) return { success: false, message: "請填作者姓名" };
  if (code.length < 200) return { success: false, message: "程式碼太短，可能沒有貼完整" };
  if (code.length > W_MAX_CODE_) return { success: false, message: "程式碼太大（超過 " + W_MAX_CODE_ + " 字），請老師協助處理" };
  if (!/<\s*(!doctype|html|body|script)/i.test(code)) return { success: false, message: "這看起來不是網頁程式碼，請回 Claude 按「複製」再貼一次" };
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = wSheet_();
    const chunks = []; for (let i = 0; i < code.length; i += W_CHUNK_) chunks.push(code.slice(i, i + W_CHUNK_));
    const id = "W" + Utilities.formatDate(new Date(), "Asia/Taipei", "MMddHHmmss") + "-" + Utilities.getUuid().slice(0, 4);
    sh.appendRow([new Date(), id, grade, title, author, sn, "new", code.length, chunks.length].concat(chunks));
    return { success: true, id: id, length: code.length };
  } finally { lock.releaseLock(); }
}

// 老師端：要先有權限（密碼）
function wAllowed_(token) {
  const scope = tokenScope_(token);
  return !!(scope && scopeAllows_(scope, "work-submissions"));
}
function wList_(e) {                // ?action=works&token=…   → 清單（不含程式碼）
  if (!wAllowed_(e.parameter.token)) return jsonOut_({ success: false, message: "forbidden" });
  const sh = wSheet_(), n = sh.getLastRow();
  const rows = n < 2 ? [] : sh.getRange(2, 1, n - 1, 9).getValues();
  const list = rows.map(function (r) {
    return { at: r[0] instanceof Date ? r[0].getTime() : 0, id: String(r[1]), grade: String(r[2]), title: String(r[3]), author: String(r[4]), studentNumber: String(r[5]), status: String(r[6]), length: Number(r[7]) || 0 };
  }).reverse().slice(0, 500);
  return jsonOut_({ success: true, works: list });
}
function wGet_(e) {                 // ?action=work&id=…&token=…  → 這一份的程式碼
  if (!wAllowed_(e.parameter.token)) return jsonOut_({ success: false, message: "forbidden" });
  const sh = wSheet_(), row = gFindRow_(sh, 2, e.parameter.id);
  if (!row) return jsonOut_({ success: false, message: "找不到這份作品" });
  const parts = Number(sh.getRange(row, 9).getValue()) || 0;
  const cells = sh.getRange(row, W_FIRST_CODE_COL_, 1, Math.max(parts, 1)).getValues()[0];
  return jsonOut_({ success: true, code: cells.join("") });
}
function wSetStatus_(data) {        // POST action=workStatus {token,id,status}
  if (!wAllowed_(data.token)) return { success: false, message: "forbidden" };
  const sh = wSheet_(), row = gFindRow_(sh, 2, data.id);
  if (!row) return { success: false, message: "找不到這份作品" };
  sh.getRange(row, 7).setValue(data.status === "done" ? "done" : "new");
  return { success: true };
}
