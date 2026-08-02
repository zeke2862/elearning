const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const iconv = require('iconv-lite');
const chardet = require('chardet');   // 自動偵測編碼
const db = require('./database');     // 資料庫連線

const app = express();
app.use(express.json());
app.use(cors());


// 靜態檔案路徑
app.use(express.static(path.join(__dirname, 'public')));

// 上傳暫存位置
const upload = multer({ dest: 'uploads/' });
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads', { recursive: true }); // 資料夾不存在的話CSV上傳會直接失敗，先確保它存在

// 💡 目前上課中的班級（老師選擇後存在這裡，用來解決「同一台電腦IP在不同班級是不同學生」的歧義）
// 存成檔案而不是只放記憶體，這樣伺服器重開（當機/手動重啟/更新程式）也不會忘記目前選的是哪個班
const ACTIVE_SESSION_FILE = path.join(__dirname, 'active-session.json');

function loadActiveSession() {
  try {
    return JSON.parse(fs.readFileSync(ACTIVE_SESSION_FILE, 'utf8'));
  } catch (err) {
    return null; // 檔案不存在或壞掉，視為尚未設定
  }
}

function saveActiveSession(session) {
  fs.writeFileSync(ACTIVE_SESSION_FILE, JSON.stringify(session));
}

let activeSession = loadActiveSession(); // 格式：{ year, className }，開機時就把上次的設定讀回來
if (activeSession) {
  console.log(`已從檔案讀回上次的上課班級設定：${activeSession.year} ${activeSession.className}`);
}

// 💡 臨時換座位：有些學生今天沒坐自己原本的位置，改坐別台電腦，
// 需要讓「那台電腦送出的成績」暫時算在「這位學生」名下，而不是算給平常坐那個位置的人。
// key = 那台電腦實際的IP，value = 要被歸屬到的學生 id。一樣存成檔案，重開伺服器不會消失。
const SEAT_OVERRIDE_FILE = path.join(__dirname, 'seat-overrides.json');

function loadSeatOverrides() {
  try {
    return JSON.parse(fs.readFileSync(SEAT_OVERRIDE_FILE, 'utf8'));
  } catch (err) {
    return {};
  }
}
// 💡 新增：班際競賽模式開關
let isCompetitionMode = false;

// 💡 競賽「回合ID」：每次開啟班際競賽模式就換一個新的值。
// 前端在送出成績前會跟這個值比對，只要跟自己上次記住的不一樣（換了新回合，或競賽已關閉），
// 就代表「這台電腦原本記住的名字」已經失效，前端應清掉 localStorage 裡的名字並重新詢問。
// 存成檔案，伺服器重開也不會忘記目前是第幾回合。
const COMPETITION_ROUND_FILE = path.join(__dirname, 'competition-round.json');

function loadCompetitionRound() {
  try {
    const data = JSON.parse(fs.readFileSync(COMPETITION_ROUND_FILE, 'utf8'));
    return { roundId: data.roundId || null, startedAt: data.startedAt || null };
  } catch (err) {
    return { roundId: null, startedAt: null };
  }
}

function saveCompetitionRound(roundId, startedAt) {
  fs.writeFileSync(COMPETITION_ROUND_FILE, JSON.stringify({ roundId, startedAt }));
}

const loadedRound = loadCompetitionRound();
let competitionRoundId = loadedRound.roundId; // null 代表目前沒有（或還沒開始過）任何競賽回合
let competitionRoundStartedAt = loadedRound.startedAt; // 這次競賽開始的時間戳(ISO字串)，給「本次競賽最強」用來篩選成績

// 💡 設定班際競賽模式
app.post('/set-competition-mode', (req, res) => {
  const { action } = req.body;
  isCompetitionMode = (action === 'start');

  if (isCompetitionMode) {
    // 開啟：換一個新的回合ID，讓所有電腦（不管上一回合記住了誰）都被視為「新回合」，
    // 之後只要送出成績就會被要求重新輸入姓名。同時記錄這個回合開始的時間，
    // 讓「本次競賽最強」只統計這個時間點之後送出的成績。
    competitionRoundId = `${Date.now()}`;
    competitionRoundStartedAt = new Date().toISOString();
    saveCompetitionRound(competitionRoundId, competitionRoundStartedAt);

    activeSession = { year: (activeSession && activeSession.year) ? String(activeSession.year) : '2026', className: '班際競賽' };
    saveActiveSession(activeSession);
  } else {
    // 關閉：把「這台電腦現在代表誰」的關聯解除，但學生資料與所有成績歷史都完整保留，
    // 供之後在 admin.html / class-report.html 查閱。做法是把回合ID清成 null，
    // 讓下一次任何人送成績時，前端都會發現回合已結束、名字失效，進而清掉自己存的名字。
    // 注意：competitionRoundStartedAt 不清除，讓關閉後「本次競賽最強」仍能顯示剛結束的那場結果，
    // 直到下一次重新開啟競賽模式（產生新的 startedAt）才會換一批。
    competitionRoundId = null;
    saveCompetitionRound(null, competitionRoundStartedAt);

    if (activeSession && activeSession.className === '班際競賽') {
      activeSession = null;
      saveActiveSession(null);
    }
  }
  console.log(`[系統] 班際競賽模式已 ${isCompetitionMode ? '開啟' : '關閉'}（回合ID: ${competitionRoundId}）`);
  res.send(`班際競賽模式已 ${isCompetitionMode ? '開啟' : '關閉'}`);
});

// 💡 給前端定期查詢目前的競賽回合狀態，用來判斷自己記住的名字是否還有效
app.get('/competition-round', (req, res) => {
  res.json({ isCompetitionMode, roundId: competitionRoundId, startedAt: competitionRoundStartedAt });
});
function saveSeatOverrides(overrides) {
  fs.writeFileSync(SEAT_OVERRIDE_FILE, JSON.stringify(overrides));
}

let seatOverrides = loadSeatOverrides(); // { "192.168.1.205": 37, ... }
if (Object.keys(seatOverrides).length > 0) {
  console.log(`已從檔案讀回 ${Object.keys(seatOverrides).length} 筆臨時換座位設定`);
}

// 💡 取得「今天」的日期字串（YYYY-MM-DD），一律以老師電腦（也就是伺服器）當下的時間為準。
// 所有成績寫入時都是用 new Date().toISOString()（伺服器時間戳記），這裡用同一顆時鐘算「今天」，
// 才能讓「即時排行榜只顯示今天成績」跟「成績登記時間」用同一個時間基準，不會對不起來。
function getTodayDateStr() {
  return new Date().toISOString().split('T')[0];
}

// 💡 Node/Express 讀到的 IP 有時候會是 "::ffff:192.168.1.201" 這種格式，要先把前綴去掉才能跟資料庫比對
function normalizeIp(ip) {
  if (!ip) return ip;
  return ip.replace(/^::ffff:/, '');
}

// 💡 用 IP 找出這是哪位學生，不相信前端傳來的名字
// 有設定「目前上課班級」就只在該班名單裡找；沒設定的話，退回全表比對，但只有「唯一符合」才採用，避免認錯人
function findStudentByIp(rawIp) {
  const ip = normalizeIp(rawIp);
  console.log('正在嘗試用這個 IP 尋找學生:', ip);

  // 💡 優先檢查有沒有「臨時換座位」的覆寫設定
  if (seatOverrides[ip]) {
    const overriddenStudent = db.prepare("SELECT * FROM students WHERE id = ?").get(seatOverrides[ip]);
    if (overriddenStudent) {
      console.log(`↪️ IP ${ip} 目前臨時代表：${overriddenStudent.name}(座號${overriddenStudent.seat_number})`);
      return overriddenStudent;
    }
    // 覆寫指向的學生資料已經不存在了（例如名單被清空過），視為覆寫失效，往下走正常比對
    console.warn(`⚠️ IP ${ip} 有臨時換座位設定，但對應的學生資料已經找不到了，忽略這筆覆寫`);
  }

  if (activeSession) {
    const student = db.prepare("SELECT * FROM students WHERE ip_address = ? AND year = ? AND class = ?")
      .get(ip, activeSession.year, activeSession.className);
    if (!student) {
      console.warn(`⚠️ IP ${ip} 不在目前上課班級「${activeSession.year} ${activeSession.className}」的名單裡`);
    }
    return student || null;
  }
  const matches = db.prepare("SELECT * FROM students WHERE ip_address = ?").all(ip);
  if (matches.length === 0) {
    console.warn(`⚠️ 尚未設定上課班級，且全校名單裡都找不到 IP ${ip}`);
  } else if (matches.length > 1) {
    console.warn(`⚠️ 尚未設定上課班級，IP ${ip} 在多個班級重複出現（${matches.map(m => m.class).join('、')}），無法判斷是哪一班，請先在 admin.html 選擇上課班級`);
  }
  return matches.length === 1 ? matches[0] : null;
}

// 💡 從班級名稱猜出「年級」，給 God 排行榜的「全校／年級／班級」三層排行用。
// 資料庫目前沒有獨立的年級欄位，只能靠班級字串自己猜規則，是盡力而為的寫法：
//   1) 開頭含「OO年」的（例如「七年3班」「國小三年2班」）→ 取到「年」字為止當年級
//   2) 開頭是連續數字的（例如「701」「1203」）→ 去掉最後兩碼當年級（701→7、1203→12）
//   3) 都不符合 → 直接把整個班級名稱當年級（等於年級排行＝班級排行，不會出錯，只是失去意義）
// 如果貴校班級命名方式跟這三種都不同，排行榜的「年級」那一層可能會不準，
// 麻煩實際看一下 /debug-classes 印出來的班級名稱，再調整這個函式的規則即可。
function deriveGrade(classStr) {
  const c = String(classStr || '').trim();
  if (!c) return '';
  const yearMatch = c.match(/^(.*?年)/);
  if (yearMatch) return yearMatch[1];
  const digitMatch = c.match(/^\d+/);
  if (digitMatch && digitMatch[0].length >= 3) return digitMatch[0].slice(0, -2);
  if (digitMatch) return digitMatch[0];
  return c;
}

// 💡 God（打字修仙傳）可選遊戲項目清單，給 god-leaderboard.html 的下拉選單用
const GOD_CATEGORIES = [
  { key: '1', label: '第一關【紮馬步】基準鍵' },
  { key: '2', label: '第二關【梯雲縱】上排鍵' },
  { key: '3', label: '第三關【掃堂腿】下排鍵' },
  { key: '4', label: '第四關【劍氣縱橫】單字連段' },
  { key: '5', label: '第五關【決戰魔教】盲打總決賽' },
  { key: 'endless', label: '魔王模式（無盡）' }
];

// 測試首頁
app.get('/', (req, res) => {
  res.send('伺服器已啟動！');
});

// 清空資料（先刪 scores，再刪 students）
app.post('/clear-students', (req, res) => {
  try {
    db.prepare("DELETE FROM scores").run();
    db.prepare("DELETE FROM students").run();
    seatOverrides = {}; // 學生資料都清空了，之前的臨時換座位設定也跟著失去意義
    saveSeatOverrides(seatOverrides);
    res.send('所有資料已清空！');
  } catch (err) {
    console.error(err);
    res.status(500).send("清空失敗：" + err.message);
  }
});

// 查詢某年度某班級的學生
app.get('/students', (req, res) => {
    const { year, className } = req.query; // 抓取前端傳過來的參數
    
    console.log(`後端接收到請求：年度=${year}, 班級=${className}`); // 在終端機看是否有收到

    // 關鍵：這裡加上 WHERE 條件，只撈出特定年度與班級的學生，若為班際競賽則包含競賽組
    const stmt = db.prepare("SELECT * FROM students WHERE year = ? AND (class = ? OR (? = '班際競賽' AND class = '競賽組')) ORDER BY seat_number");
    const rows = stmt.all(year, className, className); // 將參數傳入 SQL
    
    res.json(rows);
});
// 3. 查詢單一學生的所有成績
app.get('/scores/:studentId', (req, res) => {
  const studentId = req.params.studentId;
  const scores = db.prepare(`
    SELECT id, date, category, best_score, sub_category, wpm, article_filename, accuracy, time_str, wrong_count
    FROM scores
    WHERE student_id = ?
    ORDER BY date ASC
  `).all(studentId);
  res.json(scores);
});

// 💡 匯出「名單＋成績」CSV：可一次選多個班級一起匯出，方便老師整理成績、繳交紀錄。
// 每一列＝一位學生的一筆成績（同一個學生有幾筆成績就有幾列）；完全沒有任何成績的學生
// 也會出現一列（成績相關欄位留空），確保班級名單本身不會漏掉人。
// query: ?year=2026&classes=國一忠,國一孝（用逗號分隔，可以只選一班或全選）
app.get('/admin/export-scores', (req, res) => {
  const { year, classes } = req.query;
  if (!year) return res.status(400).send('缺少年度');
  if (!classes) return res.status(400).send('請至少選擇一個班級');

  const classList = String(classes).split(',').map(c => c.trim()).filter(Boolean);
  if (classList.length === 0) return res.status(400).send('請至少選擇一個班級');

  const placeholders = classList.map(() => '?').join(',');
  const rows = db.prepare(`
    SELECT s.class AS 班級, s.seat_number AS 座號, s.student_number AS 學號, s.name AS 姓名, s.ip_address AS IP,
           sc.date AS 成績時間, sc.category AS 類別, sc.sub_category AS 子類別,
           sc.article_filename AS 文章檔名, sc.best_score AS 分數, sc.wpm AS WPM,
           sc.accuracy AS 正確率, sc.time_str AS 花費時間, sc.wrong_count AS 錯誤數
    FROM students s
    LEFT JOIN scores sc ON sc.student_id = s.id
    WHERE s.year = ? AND s.class IN (${placeholders})
    ORDER BY s.class, s.seat_number, sc.date
  `).all(year, ...classList);

  if (rows.length === 0) return res.status(404).send('找不到這些班級的任何學生資料，請確認年度與班級名稱是否正確');

  // 組成 CSV：Excel 用逗號分隔+雙引號包起來避免內容裡有逗號時跑版，開頭加 UTF-8 BOM 避免中文亂碼
  const headers = ['班級', '座號', '學號', '姓名', 'IP', '成績時間', '類別', '子類別', '文章檔名', '分數', 'WPM', '正確率', '花費時間', '錯誤數'];
  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const lines = [headers.join(',')];
  rows.forEach(row => {
    lines.push(headers.map(h => escapeCsv(row[h])).join(','));
  });
  const csvContent = '\uFEFF' + lines.join('\r\n'); // \uFEFF = UTF-8 BOM，讓 Excel 開啟中文不會亂碼

  const filename = `成績匯出_${year}_${classList.join('_')}_${getTodayDateStr()}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  // 💡 中文檔名要用 RFC 5987 的 filename* 格式，不然部分瀏覽器下載下來檔名會變成亂碼；
  // 同時保留一個純英文的 filename 當作不支援 filename* 的瀏覽器的備用檔名。
  res.setHeader('Content-Disposition', `attachment; filename="export.csv"; filename*=UTF-8''${encodeURIComponent(filename)}`);
  res.send(csvContent);
});
app.delete('/score/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM scores WHERE id = ?').run(req.params.id);
    res.send('成績已刪除');
  } catch (err) {
    res.status(500).send("刪除失敗：" + err.message);
  }
});

// 3. 新增：刪除學生（並一併刪除其所有成績）
app.delete('/student/:id', (req, res) => {
  try {
    // 確保先刪除成績，避免外鍵限制問題
    db.prepare('DELETE FROM scores WHERE student_id = ?').run(req.params.id);
    db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
    res.send('學生資料及相關成績已刪除');
  } catch (err) {
    res.status(500).send("刪除失敗：" + err.message);
  }
});
// 批次刪除學生 (同時刪除該學生的所有成績)
app.post('/delete-students', (req, res) => {
  const { ids } = req.body; // 預期收到 { ids: [1, 2, 3] }
  if (!ids || ids.length === 0) return res.status(400).send('未選擇任何學生');

  try {
    const transaction = db.transaction((idList) => {
      const placeholders = idList.map(() => '?').join(',');
      // 1. 先刪除成績
      db.prepare(`DELETE FROM scores WHERE student_id IN (${placeholders})`).run(...idList);
      // 2. 再刪除學生
      db.prepare(`DELETE FROM students WHERE id IN (${placeholders})`).run(...idList);
    });
    
    transaction(ids);
    res.send(`成功刪除 ${ids.length} 位學生及其相關成績`);
  } catch (err) {
    res.status(500).send("刪除失敗：" + err.message);
  }
});

// 批次刪除成績
app.post('/delete-scores', (req, res) => {
  const { ids } = req.body;
  if (!ids || ids.length === 0) return res.status(400).send('未選擇任何成績');

  try {
    const placeholders = ids.map(() => '?').join(',');
    db.prepare(`DELETE FROM scores WHERE id IN (${placeholders})`).run(...ids);
    res.send(`成功刪除 ${ids.length} 筆成績`);
  } catch (err) {
    res.status(500).send("刪除失敗：" + err.message);
  }
});
// 新增這個除錯路由
const { Readable } = require('stream'); 

app.post('/upload-csv', upload.single('file'), (req, res) => {
    try {
        const filePath = req.file.path;
        const fileBuffer = fs.readFileSync(filePath);
        const encoding = chardet.detect(fileBuffer) || 'big5';
        const fileContent = iconv.decode(fileBuffer, encoding);

        const results = [];
        const stream = Readable.from(fileContent);
        
        // 使用 csv-parser 自動處理 CSV，且我們設為沒有標題列 (headers: false)
        // 如果您的 CSV 第一行真的是標題，請把 headers: false 改成 true
        stream
            .pipe(csv({ headers: false })) 
            .on('data', (row) => {
                const cols = Object.values(row);
                
                // 【偵錯】列印每一行讀取到的內容，讓我們看清楚到底發生什麼事
                console.log(`讀取到行: 班級=${cols[1]}, 姓名=${cols[3]}`);

                // 關鍵過濾（保留原邏輯）
                // 💡 判斷是不是標題列：改成看「座號」那一欄是不是數字，比死板比對文字更可靠
                // （之前用 cols[1] === '班級' 比對，但這份CSV標題欄位其實打成「級」，導致標題列沒被跳過、被當成一筆垃圾資料匯入）
                const looksLikeHeader = !cols[0] || !cols[1] || isNaN(parseInt(cols[4], 10));
                if (looksLikeHeader) {
                    console.log(`  => 跳過此行 (可能是標題或空行):`, cols);
                    return;
                }

                if (cols.length >= 6) {
                    results.push({
                        year: cols[0].trim(),
                        class: cols[1].trim(),
                        student_number: cols[2].trim(),
                        name: cols[3].trim(),
                        seat_number: cols[4].trim(),
                        ip: cols[5].trim()
                    });
                } else {
                    console.log("  => 【嚴重警告】此行欄位不足，無法匯入:", cols);
                }
            })
            .on('end', () => {
                const insertMany = db.transaction((dataList) => {
    // 拿掉 ON CONFLICT，單純的 INSERT，如果有錯誤它會直接跳出來報錯，不會吞掉資料
    const stmt = db.prepare(`
        INSERT INTO students (year, class, student_number, name, seat_number, ip_address)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    for (const row of dataList) {
        try {
            stmt.run(row.year, row.class, row.student_number, row.name, row.seat_number, row.ip);
        } catch (err) {
            // 如果這一次 INSERT 失敗，把錯誤印出來，我們馬上就知道是哪個人卡住了！
            console.error("匯入失敗的學生資料:", row);
            console.error("錯誤原因:", err.message);
        }
    }
});

                insertMany(results);
                fs.unlinkSync(filePath);
                res.send(`匯入成功！成功處理並寫入 ${results.length} 筆資料。`);
            });

    } catch (err) {
        console.error("匯入錯誤:", err);
        res.status(500).send("匯入失敗：" + err.message);
    }
});
// ============================================================
// 💡 英文看打（Look & Type）相關路由：文章管理 + 排行榜
// ============================================================

// 💡 批次匯入 TXT 文章（可一次選多個檔案）。檔名即為題目名稱，內容供學生看打測驗使用。
// 沿用跟 CSV 匯入一樣的編碼偵測方式，避免中文/Big5編碼文章匯入後變亂碼。
app.post('/upload-articles', upload.array('files'), (req, res) => {
  try {
    const files = req.files || [];
    if (files.length === 0) return res.status(400).send('未選擇任何檔案');

    let successCount = 0;
    const errors = [];

    const insertOrReplace = db.prepare(`
      INSERT INTO articles (filename, content, uploaded_at)
      VALUES (?, ?, ?)
      ON CONFLICT(filename) DO UPDATE SET content = excluded.content, uploaded_at = excluded.uploaded_at
    `);

    for (const file of files) {
      try {
        const fileBuffer = fs.readFileSync(file.path);
        const encoding = chardet.detect(fileBuffer) || 'utf-8';
        // 💡 修正：原本用 .trim() 會把文章「第一行開頭的縮排（Tab/空白）」一併吃掉，
        // 造成看打畫面第一行看不到縮排。這裡改成只去除檔頭 BOM 與檔案最尾端的換行/空白，
        // 不動到第一行開頭與文章中間的縮排。
        let content = iconv.decode(fileBuffer, encoding);
        content = content.replace(/^\uFEFF/, '');        // 去除 UTF-8 BOM
        content = content.replace(/[\r\n\s]+$/, '');      // 只去除檔案「最尾端」的換行與空白
        const filename = file.originalname;

        insertOrReplace.run(filename, content, new Date().toISOString());
        successCount++;
      } catch (err) {
        console.error(`匯入文章失敗 (${file.originalname}):`, err.message);
        errors.push(file.originalname);
      } finally {
        fs.unlinkSync(file.path); // 不管成功失敗都清掉暫存檔
      }
    }

    let msg = `匯入完成！成功 ${successCount} 篇`;
    if (errors.length > 0) msg += `，失敗 ${errors.length} 篇（${errors.join('、')}）`;
    res.send(msg);
  } catch (err) {
    console.error('匯入文章錯誤:', err);
    res.status(500).send('匯入失敗：' + err.message);
  }
});

// 💡 取得所有已上傳文章的清單（給看打測驗選文章、排行榜下拉選單篩選用）
app.get('/articles', (req, res) => {
  try {
    const rows = db.prepare('SELECT id, filename, uploaded_at FROM articles ORDER BY filename ASC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).send('查詢失敗：' + err.message);
  }
});

// 💡 取得單篇文章內容（給學生端看打測驗抓題目用）
app.get('/article/:filename', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM articles WHERE filename = ?').get(req.params.filename);
    if (!row) return res.status(404).send('找不到這篇文章');
    res.json(row);
  } catch (err) {
    res.status(500).send('查詢失敗：' + err.message);
  }
});

// 💡 刪除單篇文章
app.delete('/article/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id);
    res.send('文章已刪除');
  } catch (err) {
    res.status(500).send('刪除失敗：' + err.message);
  }
});

// 💡 英文看打對話框用：依「送出成績當下的來源 IP ＋ 班級」找出對應的學生，回傳 studentId 給後續 /submit-look-type 使用。
// 💡 修正3：原本是靠學生自己填的「姓名＋學號/身分證字號」去比對（比對不到還會直接建立新學生），
// 姓名/學號打錯字或亂填，成績就會跑到別人名下或憑空冒出重複帳號。改成比照 ETP 模式（findStudentByIp），
// 直接用 IP 對照座位表，不管姓名欄位打的是什麼都不影響歸屬，也不再自動建立新學生——
// 找不到就直接回報錯誤，請老師確認座位表/該電腦 IP 設定，而不是生一筆來路不明的資料。
app.post('/look-type-identify', (req, res) => {
  try {
    const { className, seatNumber, year } = req.body;
    if (!className) return res.status(400).send('缺少班級');

    const y = String(year || '2026');
    const ip = normalizeIp(req.ip);

    // 💡 臨時換座位設定優先於一般座位比對，跟 findStudentByIp 的邏輯保持一致
    let student = null;
    if (seatOverrides[ip]) {
      student = db.prepare('SELECT * FROM students WHERE id = ?').get(seatOverrides[ip]);
      if (student) {
        console.log(`↪️ [看打身份確認] IP ${ip} 目前臨時代表：${student.name}(座號${student.seat_number})`);
      }
    }
    if (!student) {
      student = db.prepare('SELECT * FROM students WHERE ip_address = ? AND year = ? AND class = ?')
        .get(ip, y, className);
    }

    if (!student) {
      console.warn(`⚠️ [看打身份確認] 找不到 IP ${ip} 在「${y} ${className}」名單裡對應的學生，請確認座位表或該電腦的 IP 設定是否正確`);
      return res.status(404).send(`找不到這個座位（IP: ${ip}）在「${y} ${className}」的學生資料，請確認座位表設定`);
    }

    if (seatNumber && String(student.seat_number) !== String(seatNumber)) {
      console.warn(`⚠️ [看打身份確認] 學生填寫的座號「${seatNumber}」與 IP ${ip} 實際對應的座號「${student.seat_number}」不一致（${student.name}），已放行但請留意。`);
    }

    res.json({ studentId: student.id, name: student.name, className: student.class, seatNumber: student.seat_number });
  } catch (err) {
    console.error('[看打身份確認] 錯誤:', err.message);
    res.status(500).send(err.message);
  }
});

// 💡 登記時間一律用 new Date().toISOString()，也就是「這台伺服器（老師電腦）」當下的時間，
// 不採用學生端瀏覽器回報的任何時間欄位，確保個人成績與班級統計表的登記依據一致、不會被學生電腦時鐘跑掉影響。
app.post('/submit-look-type', (req, res) => {
  try {
    const {
      studentId, articleFilename, level, timeLimit, timeUsed,
      accuracy, wrongRate, inputMethod, birthdate, idNumber,
      totalScore, obtainedScore
    } = req.body;

    // 💡 修正：不管學生端有沒有勾選「主機或IP位置」並先手動連線確認身份，
    // 只要沒有帶 studentId 過來（或帶來的 id 查無此人），一律改用送出成績當下的
    // 來源 IP 直接比對學生（比照 ETP／塔防的 getStudentForSubmission 做法），
    // 這樣不管學生有沒有勾選，成績都能依教室內電腦 IP 正確歸戶。
    let student = studentId ? db.prepare('SELECT * FROM students WHERE id = ?').get(studentId) : null;
    if (!student) {
      student = getStudentForSubmission(req);
    }
    if (!student) return res.status(404).send('找不到學生（studentId 不存在，且送出來源 IP 也比對不到座位表）');

    const ip = normalizeIp(req.ip);

    db.prepare(`
      INSERT INTO scores (
        student_id, date, category, best_score,
        time_str, accuracy, wpm, composite_score,
        birthdate, id_number, article_filename, level, time_limit,
        input_method, code, ip_recorded, wrong_count
      ) VALUES (?, ?, 'ENGLISH_Look', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ENGLISH_Look', ?, ?)
    `).run(
      student.id, new Date().toISOString(), obtainedScore || 0,
      timeUsed || '', accuracy || '', 0, totalScore || 0,
      birthdate || '', idNumber || '', articleFilename || '', level || '', timeLimit || '',
      inputMethod || '', ip, wrongRate != null ? wrongRate : null
    );

    // 💡 obtainedScore === -999 代表學生在測驗/練習進行中提前關閉頁面（比照 ETP 模式）
    if (obtainedScore === -999) {
      console.warn(`⚠️ [看打-提前關閉] 學生: ${student.name}, 文章: ${articleFilename} 於測驗進行中關閉頁面`);
    } else {
      console.log(`[看打成績上傳] 學生: ${student.name}, 文章: ${articleFilename}, 得分: ${obtainedScore}/${totalScore}`);
    }
    res.send('看打成績已記錄');
  } catch (err) {
    console.error('[看打成績上傳] 錯誤:', err.message);
    res.status(500).send(err.message);
  }
});

// 💡 英文看打排行榜：可用文章檔名篩選；未指定 articleFilename 時列出全部成績。
// 名次以 obtained_score(得分/best_score) 由高到低排序，同分則測驗時間早的在前。
app.get('/look-type-leaderboard', (req, res) => {
  try {
    const { articleFilename } = req.query;
    const date = req.query.date || getTodayDateStr();

    let rows;
    if (articleFilename) {
      rows = db.prepare(`
        SELECT sc.*, s.name, s.seat_number, s.class, s.year
        FROM scores sc
        JOIN students s ON s.id = sc.student_id
        WHERE sc.category = 'ENGLISH_Look' AND sc.article_filename = ? AND sc.date LIKE ? || '%'
        ORDER BY sc.best_score DESC, sc.date ASC
      `).all(articleFilename, date);
    } else {
      rows = db.prepare(`
        SELECT sc.*, s.name, s.seat_number, s.class, s.year
        FROM scores sc
        JOIN students s ON s.id = sc.student_id
        WHERE sc.category = 'ENGLISH_Look' AND sc.date LIKE ? || '%'
        ORDER BY sc.best_score DESC, sc.date ASC
      `).all(date);
    }

    const result = rows.map((r, idx) => ({
      rank: idx + 1,
      name: r.name,
      birthdate: r.birthdate || '',
      idNumber: r.id_number || '',
      articleFilename: r.article_filename || '',
      speed: r.wpm || 0,
      level: r.level || '',
      class: r.class,
      seatNumber: r.seat_number,
      timeLimit: r.time_limit || '',
      timeUsed: r.time_str || '',
      accuracy: r.accuracy || '',
      wrongRate: r.wrong_count != null ? r.wrong_count : '',
      inputMethod: r.input_method || '',
      testDate: r.date ? r.date.split('T')[0] : '',
      code: r.code || 'ENGLISH_Look',
      totalScore: r.composite_score || 0,
      obtainedScore: r.best_score || 0,
      ip: r.ip_recorded || ''
    }));

    res.json(result);
  } catch (err) {
    console.error('[看打排行榜] 錯誤:', err.message);
    res.status(500).send(err.message);
  }
});

// 💡 看打排行榜有資料的所有日期（只列真的有資料的日期，供排行榜日期選單使用）
app.get('/look-type-leaderboard-dates', (req, res) => {
  try {
    const { articleFilename } = req.query;
    let rows;
    if (articleFilename) {
      rows = db.prepare(`
        SELECT DISTINCT substr(date, 1, 10) as d FROM scores
        WHERE category = 'ENGLISH_Look' AND article_filename = ?
        ORDER BY d DESC
      `).all(articleFilename);
    } else {
      rows = db.prepare(`
        SELECT DISTINCT substr(date, 1, 10) as d FROM scores
        WHERE category = 'ENGLISH_Look'
        ORDER BY d DESC
      `).all();
    }
    res.json(rows.map(r => r.d));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 排行榜（單人自主修煉 / 一般模式）
// 💡 category 參數：若有指定，只統計「該分類」裡每位學生的最佳成績，分類之間不交叉比較。
// 對應前端 ROW_DEFS 的 label：上列字母／中列字母／下列字母／綜合練習／符號專攻／混合進階／常用英單
// 💡 即時排行榜只計算「今天」送出的成績（以伺服器/老師電腦時間為準），不會撈到其他天的舊成績。
// 歷史紀錄與班級最佳仍完整保留在資料庫、可在 admin.html 個人歷史成績、class-report.html 查閱，
// 只是不會再混進「今天」的排行榜排名。
app.get('/leaderboard', (req, res) => {
  const { year, className, category } = req.query;
  const date = req.query.date || getTodayDateStr();

  let rows;
  if (category) {
    rows = db.prepare(`
      SELECT
          s.seat_number,
          s.name,
          MAX(sc.best_score) as best_score,
          MAX(sc.wpm) as wpm,
          MAX(sc.best_score * (1 + sc.wpm / 100.0)) as composite_score
      FROM students s
      LEFT JOIN scores sc ON s.id = sc.student_id AND sc.category = ? AND sc.date LIKE ? || '%'
      WHERE s.year = ? AND (s.class = ? OR (? = '班際競賽' AND s.class = '競賽組'))
      GROUP BY s.id
      HAVING best_score IS NOT NULL
      ORDER BY composite_score DESC
    `).all(category, date, year, className, className);
  } else {
    // 沒有指定分類：維持舊行為，跨分類取最佳（給還沒升級的舊前端相容用）
    rows = db.prepare(`
      SELECT 
          s.seat_number, 
          s.name, 
          MAX(sc.best_score) as best_score,
          MAX(sc.wpm) as wpm,
          MAX(sc.best_score * (1 + sc.wpm / 100.0)) as composite_score
      FROM students s
      LEFT JOIN scores sc ON s.id = sc.student_id AND sc.date LIKE ? || '%'
      WHERE s.year = ? AND (s.class = ? OR (? = '班際競賽' AND s.class = '競賽組'))
      GROUP BY s.id
      ORDER BY composite_score DESC
    `).all(date, year, className, className);
  }

  res.json(rows.map(r => ({
    ...r,
    composite_score: r.composite_score !== null ? Math.round(r.composite_score) : null
  })));
});

// 💡 這個班級/年度/分類有資料的所有日期（只列真的有資料的日期，供排行榜日期選單使用）
app.get('/leaderboard-dates', (req, res) => {
  const { year, className, category } = req.query;
  let rows;
  if (category) {
    rows = db.prepare(`
      SELECT DISTINCT substr(sc.date, 1, 10) as d
      FROM scores sc
      JOIN students s ON s.id = sc.student_id
      WHERE s.year = ? AND (s.class = ? OR (? = '班際競賽' AND s.class = '競賽組')) AND sc.category = ?
      ORDER BY d DESC
    `).all(year, className, className, category);
  } else {
    rows = db.prepare(`
      SELECT DISTINCT substr(sc.date, 1, 10) as d
      FROM scores sc
      JOIN students s ON s.id = sc.student_id
      WHERE s.year = ? AND (s.class = ? OR (? = '班際競賽' AND s.class = '競賽組'))
      ORDER BY d DESC
    `).all(year, className, className);
  }
  res.json(rows.map(r => r.d));
});

// 💡 提供前端「分類切換」下拉選單使用的固定分類清單（跟 ROW_DEFS 的 label 對齊）
app.get('/leaderboard-categories', (req, res) => {
  res.json([
    { key: '上列字母', short: '上' },
    { key: '中列字母', short: '中' },
    { key: '下列字母', short: '下' },
    { key: '綜合練習', short: '綜' },
    { key: '符號專攻', short: '符' },
    { key: '混合進階', short: '混' },
    { key: '常用英單', short: '單' }
  ]);
});

// ETP排行榜（即時榜，只計算今天的成績；史上最強/本次競賽最強請見 /etp-hall-of-fame）
app.get('/etp-leaderboard', (req, res) => {
  const { year, className } = req.query;
  const today = getTodayDateStr();
  const rows = db.prepare(`
    SELECT s.seat_number, s.name,
           MAX(CASE WHEN sc.category = 'ETP-上' THEN sc.best_score END) as etp_up,
           MAX(CASE WHEN sc.category = 'ETP-中' THEN sc.best_score END) as etp_mid,
           MAX(CASE WHEN sc.category = 'ETP-下' THEN sc.best_score END) as etp_down,
           MAX(CASE WHEN sc.category = 'ETP-綜' THEN sc.best_score END) as etp_mix
    FROM students s
    LEFT JOIN scores sc ON s.id = sc.student_id AND sc.date LIKE ? || '%'
    WHERE s.year = ? AND (s.class = ? OR (? = '班際競賽' AND s.class = '競賽組'))
    GROUP BY s.id
    ORDER BY etp_mix DESC
  `).all(today, year, className, className);

  res.json(rows);
});
app.get('/get-class-summary', (req, res) => {
    const { classId } = req.query;
    // 透過 JOIN 把學生與分數關聯，用 MAX 取最佳成績，用 GROUP BY 歸類
    const query = `
        SELECT s.name, sc.category, MAX(sc.best_score) as max_score
        FROM scores sc
        JOIN students s ON sc.student_id = s.id
        WHERE s.class_id = ?
        GROUP BY s.name, sc.category
    `;
    const data = db.prepare(query).all(classId);
    res.json(data);
});
app.get('/class-report', (req, res) => {
    const { year, className } = req.query;

    const students = db.prepare("SELECT * FROM students WHERE year = ? AND class = ? ORDER BY seat_number").all(year, className);
    const studentIds = students.map(s => s.id);

    let scores = [];
    if (studentIds.length > 0) {
        const placeholders = studentIds.map(() => '?').join(',');
        scores = db.prepare(`SELECT * FROM scores WHERE student_id IN (${placeholders}) ORDER BY date ASC`).all(...studentIds);
    }

    // 1. 修正日期邏輯：只取 "YYYY-MM-DD" 部分來過濾[cite: 3]
    const dates = [...new Set(scores.map(s => s.date.split('T')[0]))].sort();

    const resultStudents = students.map(student => {
    const studentScores = {};
    dates.forEach(date => {
        // 找出該學生該日期的所有紀錄
        const dailyScores = scores.filter(s => s.student_id === student.id && s.date.startsWith(date));
        
        if (dailyScores.length > 0) {
            // 找出該日期分數最高的那一筆紀錄 (以 best_score 為準)
            const bestRecord = dailyScores.reduce((prev, current) => 
                ((current.wpm || 0) > (prev.wpm || 0)) ? current : prev
            );
            
            // 回傳物件，包含 WPM 和 Score
            studentScores[date] = { 
                wpm: bestRecord.wpm || 0, 
                score: bestRecord.best_score 
            };
        } else {
            studentScores[date] = null; // 改成 null 方便判斷
        }
    });
    return {
        id: student.id,
        seat_number: student.seat_number,
        name: student.name,
        scores: studentScores
    };
});

    res.json({ dates, students: resultStudents });
});
// 💡 ETP測驗排行榜（詳細版）：每人每個分類的「最佳一次」完整記錄（含時間/錯誤/正確率）
// 給舊版樣式的 etp-leaderboard.html 用，seatNumber 這裡放的是真的「座號 姓名」，不是學生自己亂打的
const ETP_CATEGORY_FULL = { '上': '上列', '中': '中列', '下': '下列', '綜': '綜合' };
app.get('/etp-scores', (req, res) => {
  const { year, className } = req.query;
  const date = req.query.date || getTodayDateStr();
  const rows = db.prepare(`
    SELECT s.seat_number, s.name, sc.category, sc.best_score, sc.time_str, sc.wrong_count, sc.accuracy, sc.wpm, sc.ip_recorded, sc.date
    FROM scores sc
    JOIN students s ON s.id = sc.student_id
    WHERE s.year = ? AND (s.class = ? OR (? = '班際競賽' AND s.class = '競賽組')) AND sc.category LIKE 'ETP-%'
      AND sc.date LIKE ? || '%'
      AND sc.best_score = (
        SELECT MAX(best_score) FROM scores sc2
        WHERE sc2.student_id = sc.student_id AND sc2.category = sc.category AND sc2.date LIKE ? || '%'
      )
    GROUP BY sc.student_id, sc.category
  `).all(year, className, className, date, date);

  const result = rows.map(r => ({
    seatNumber: `${r.seat_number} ${r.name}`,
    name: r.name,
    rowKey: ETP_CATEGORY_FULL[r.category.replace('ETP-', '')] || r.category,
    timeStr: r.time_str || '',
    wrongCount: r.wrong_count || 0,
    accuracy: r.accuracy || '',
    score: r.best_score || 0,
    wpm: r.wpm || 0,
    ip: r.ip_recorded || '',
    date: r.date ? r.date.split('T')[0] : ''
  }));

  res.json(result);
});

// 💡 這個班級/年度在 ETP 有資料的所有日期（只列真的有資料的日期，供排行榜日期選單使用）
app.get('/etp-scores-dates', (req, res) => {
  const { year, className } = req.query;
  const rows = db.prepare(`
    SELECT DISTINCT substr(sc.date, 1, 10) as d
    FROM scores sc
    JOIN students s ON s.id = sc.student_id
    WHERE s.year = ? AND (s.class = ? OR (? = '班際競賽' AND s.class = '競賽組')) AND sc.category LIKE 'ETP-%'
    ORDER BY d DESC
  `).all(year, className, className);
  res.json(rows.map(r => r.d));
});

// 💡 ETP「歷次最強」排行榜（每區只留 1 位王者，直到被新成績打破）
// - allTime：不分年度/班級/競賽場次，資料庫裡該分類史上最高分（永久保留，除非被更高分打破）
// - thisRound：只看「這次班際競賽」開始之後送出的成績裡最高分（competitionRoundStartedAt 之後）
app.get('/etp-hall-of-fame', (req, res) => {
  try {
    const categories = ['ETP-上', 'ETP-中', 'ETP-下', 'ETP-綜'];

    const allTime = {};
    const thisRound = {};

    for (const cat of categories) {
      const shortKey = cat.replace('ETP-', '');

      // 史上最強：全資料庫、不限班級或年度，同分時取比較早達成的那筆（先馳得點）
      const best = db.prepare(`
        SELECT s.seat_number, s.name, s.year, s.class, sc.best_score, sc.time_str, sc.wrong_count, sc.accuracy, sc.date
        FROM scores sc
        JOIN students s ON s.id = sc.student_id
        WHERE sc.category = ?
        ORDER BY sc.best_score DESC, sc.date ASC
        LIMIT 1
      `).get(cat);

      allTime[shortKey] = best ? {
        seatNumber: `${best.year} ${best.class} ${best.seat_number} ${best.name}`,
        timeStr: best.time_str || '',
        wrongCount: best.wrong_count || 0,
        accuracy: best.accuracy || '',
        score: best.best_score || 0,
        date: best.date
      } : null;

      // 本次競賽最強：只看這次班際競賽開始之後（competitionRoundStartedAt）送出的成績
      let bestThisRound = null;
      if (competitionRoundStartedAt) {
        bestThisRound = db.prepare(`
          SELECT s.seat_number, s.name, sc.best_score, sc.time_str, sc.wrong_count, sc.accuracy, sc.date
          FROM scores sc
          JOIN students s ON s.id = sc.student_id
          WHERE sc.category = ? AND sc.date >= ?
          ORDER BY sc.best_score DESC, sc.date ASC
          LIMIT 1
        `).get(cat, competitionRoundStartedAt);
      }

      thisRound[shortKey] = bestThisRound ? {
        seatNumber: `${bestThisRound.seat_number} ${bestThisRound.name}`,
        timeStr: bestThisRound.time_str || '',
        wrongCount: bestThisRound.wrong_count || 0,
        accuracy: bestThisRound.accuracy || '',
        score: bestThisRound.best_score || 0,
        date: bestThisRound.date
      } : null;
    }

    res.json({ allTime, thisRound, isCompetitionMode });
  } catch (err) {
    console.error('[歷次最強] 錯誤:', err.message);
    res.status(500).send(err.message);
  }
});

// 測試路由
app.get('/ping', (req, res) => {
  res.send('伺服器正常運作，public 路徑正確！');
});
// 檢查資料庫裡到底存了哪些班級名稱
app.get('/debug-classes', (req, res) => {
  try {
    const classes = db.prepare("SELECT DISTINCT class FROM students").all();
    console.log("資料庫內存在的班級名稱:", classes);
    res.json(classes);
  } catch (err) {
    res.status(500).send("錯誤：" + err.message);
  }
});
// 💡 設定/查詢目前上課班級
app.post('/set-active-class', (req, res) => {
  const { year, className } = req.body;
  if (!year || !className) return res.status(400).send('缺少年度或班級');
  activeSession = { year: String(year), className };
  saveActiveSession(activeSession); // 💡 寫進檔案，伺服器重開也記得住

  // 💡 換班級時，先前設定的「臨時換座位」對這一班已經沒有意義了（座位表是照班級對應的），
  // 直接清空，避免帶到新班級或下一堂課造成 IP 對錯人
  const hadOverrides = Object.keys(seatOverrides).length > 0;
  seatOverrides = {};
  saveSeatOverrides(seatOverrides);
  if (hadOverrides) console.log('[系統] 切換上課班級，已自動清空所有臨時換座位設定');
  
  if (className === '班際競賽') {
    isCompetitionMode = true;
    console.log(`[系統] 檢測到選擇「班際競賽」班級，自動開啟班際競賽模式`);
  } else {
    isCompetitionMode = false;
    console.log(`[系統] 選擇普通班級「${className}」，自動關閉班際競賽模式`);
  }

  console.log(`目前上課班級設定為：${year} ${className}`);
  res.send(`已設定上課班級：${year} ${className}`);
});

app.get('/active-class', (req, res) => {
  res.json(activeSession || {});
});

// 💡 臨時換座位：學生輸入「我今天實際坐在座號幾號的電腦」，把那台電腦的IP暫時歸到自己名下
// body: { studentId: 要歸屬的學生id, tempSeatNumber: 實際坐的座號 }
app.post('/set-seat-override', (req, res) => {
  const { studentId, tempSeatNumber } = req.body;
  if (!studentId || !tempSeatNumber) return res.status(400).send('缺少學生id或臨時座號');

  const student = db.prepare("SELECT * FROM students WHERE id = ?").get(studentId);
  if (!student) return res.status(404).send('找不到這位學生');

  // 臨時座位要在「同一個年度、同一個班級」裡面找，才有意義（IP是照座號+200這個規則排的）
  const seatStudent = db.prepare("SELECT * FROM students WHERE year = ? AND class = ? AND seat_number = ?")
    .get(student.year, student.class, tempSeatNumber);
  if (!seatStudent) return res.status(404).send(`找不到座號 ${tempSeatNumber} 對應的電腦IP`);

  // 先清掉這個學生原本可能設定過的其他覆寫（避免一個人同時佔用兩個IP覆寫）
  for (const ip of Object.keys(seatOverrides)) {
    if (seatOverrides[ip] === Number(studentId)) delete seatOverrides[ip];
  }

  seatOverrides[seatStudent.ip_address] = Number(studentId);
  saveSeatOverrides(seatOverrides);

  console.log(`臨時換座位設定：${student.name}(原座號${student.seat_number}) 現在使用 座號${tempSeatNumber} 的電腦(${seatStudent.ip_address})`);
  res.send(`已設定：${student.name} 現在使用座號 ${tempSeatNumber} 的電腦，該電腦送出的成績會算在 ${student.name} 名下`);
});

// 💡 取消某位學生的臨時換座位設定，恢復成該IP原本對應的人
app.post('/clear-seat-override', (req, res) => {
  const { studentId } = req.body;
  if (!studentId) return res.status(400).send('缺少學生id');

  let cleared = false;
  for (const ip of Object.keys(seatOverrides)) {
    if (seatOverrides[ip] === Number(studentId)) {
      delete seatOverrides[ip];
      cleared = true;
    }
  }
  saveSeatOverrides(seatOverrides);
  res.send(cleared ? '已取消臨時換座位設定' : '這位學生原本就沒有臨時換座位設定');
});

// 💡 查詢目前所有臨時換座位設定（給 class-report.html 顯示用）
app.get('/seat-overrides', (req, res) => {
  const result = Object.entries(seatOverrides).map(([ip, studentId]) => ({ ip, studentId }));
  res.json(result);
});

// =========================================================================
// 💡 代碼登入（角色進度模式用）
// 代碼直接用學號，學生不用另外記帳號密碼。
// 在校內區網時，會拿「這台電腦的 IP 原本登記的是誰」跟輸入的學號比對，
// 確保是本人坐在自己的座位上練習，練習資料才算數（可用來加平時分）。
// 家裡/手機打的是另一個雲端端點（不是這支 server.js），
// 那邊物理上連不到這裡，所以完全不需要在這裡另外判斷「是不是校外」。
// =========================================================================

// body: { code }  -- code 是學號
app.post('/login-code', (req, res) => {
  const { code } = req.body;
  if (!code || !String(code).trim()) {
    return res.status(400).json({ success: false, message: '請輸入學號' });
  }
  const trimmedCode = String(code).trim();
  const ip = normalizeIp(req.ip);

  // 用學號找學生：先在目前上課班級裡找（同一學號如果跨年度/班級重複才不會認錯），
  // 找不到再退回全表比對
  let student = null;
  if (activeSession) {
    student = db.prepare("SELECT * FROM students WHERE student_number = ? AND year = ? AND class = ?")
      .get(trimmedCode, activeSession.year, activeSession.className);
  }
  if (!student) {
    student = db.prepare("SELECT * FROM students WHERE student_number = ?").get(trimmedCode);
  }
  if (!student) {
    return res.status(404).json({ success: false, message: '找不到這個學號，請確認輸入是否正確' });
  }

  // 這台電腦（IP）目前登記／臨時代表的是誰（沿用既有的 findStudentByIp，含 seatOverrides 判斷）
  const seatStudent = findStudentByIp(req.ip);

  if (seatStudent && seatStudent.id !== student.id) {
    // 座位登記的是別人，擋下來。這裡不直接動資料，讓老師用下面的修正權限處理
    console.warn(`[代碼登入] 學號 ${trimmedCode}（${student.name}）在座位電腦 IP ${ip}（登記為 ${seatStudent.name}）登入被擋下`);
    return res.status(409).json({
      success: false,
      mismatch: true,
      message: `這台電腦座位登記的是「${seatStudent.name}」。如果今天臨時換位，請老師用「臨時換座位」或「強制修正對應」功能處理`,
      seatStudentName: seatStudent.name
    });
  }

  // IP 完全沒有登記過（新電腦/名單還沒建齊）－先放行，但標記警告方便老師之後追查
  const warning = seatStudent ? null : `這台電腦（IP ${ip}）目前沒有座位對應紀錄，本次登入未經座位核對`;
  if (warning) console.warn(`[代碼登入] ${warning}（學號 ${trimmedCode}，${student.name}）`);

  res.json({
    success: true,
    student: {
      id: student.id,
      name: student.name,
      studentNumber: student.student_number,
      seatNumber: student.seat_number,
      class: student.class,
      year: student.year
    },
    warning
  });
});

// =========================================================================
// 💡 老師修正權限
// 上面的座位核對難免會擋到合理的例外狀況（代課電腦、名單漏建、學生真的臨時換位
// 但老師還沒設定…），這兩支給老師在後台直接修正，不用學生自己想辦法繞過去。
// =========================================================================

// 強制把「指定 IP」對應到「指定學生」，效果等同 set-seat-override，
// 但不要求「這個學生是不是佔用了同班某個座號的電腦」，老師可以直接輸入 IP，
// 用在座位邏輯對不上的各種例外狀況（代課電腦、筆電推車等）
// body: { ip, studentId }
app.post('/admin/force-bind', (req, res) => {
  const { ip, studentId } = req.body;
  if (!ip || !studentId) return res.status(400).send('缺少 IP 或學生 id');

  const student = db.prepare("SELECT * FROM students WHERE id = ?").get(studentId);
  if (!student) return res.status(404).send('找不到這位學生');

  const targetIp = normalizeIp(ip);

  // 一個學生同時間只能佔用一個覆寫，避免這個學生同時綁在兩個IP上搞混
  for (const existingIp of Object.keys(seatOverrides)) {
    if (seatOverrides[existingIp] === Number(studentId)) delete seatOverrides[existingIp];
  }
  seatOverrides[targetIp] = Number(studentId);
  saveSeatOverrides(seatOverrides);

  console.log(`[老師修正] IP ${targetIp} 強制對應到 ${student.name}（學號 ${student.student_number}）`);
  res.send(`已修正：IP ${targetIp} 現在對應到 ${student.name}`);
});

// 直接修正某位學生的學號（登入代碼），例如當初建檔打錯、或學校配發新學號
// body: { studentId, newStudentNumber }
app.post('/admin/update-student-number', (req, res) => {
  const { studentId, newStudentNumber } = req.body;
  if (!studentId || !newStudentNumber) return res.status(400).send('缺少學生id或新學號');

  const trimmed = String(newStudentNumber).trim();
  const student = db.prepare("SELECT * FROM students WHERE id = ?").get(studentId);
  if (!student) return res.status(404).send('找不到這位學生');

  const clash = db.prepare("SELECT id FROM students WHERE student_number = ? AND id != ?").get(trimmed, studentId);
  if (clash) return res.status(409).send('這個學號已經被別的學生使用了');

  db.prepare("UPDATE students SET student_number = ? WHERE id = ?").run(trimmed, studentId);
  console.log(`[老師修正] ${student.name} 的學號改為 ${trimmed}`);
  res.send(`已更新：${student.name} 的學號現在是 ${trimmed}`);
});

// 💡 下課按鈕：一鍵解除「目前所有電腦」的臨時換座位設定（IP 綁定），
// 讓每台電腦下一堂課恢復成座位表原本登記的人，不會把這堂課的臨時綁定帶到下一班。
// 跟 /set-active-class 換班級時的自動清空是同一份資料，這裡是給老師在同一班「下課」時
// 也能主動觸發（不一定要真的換班級才清得掉）。
app.post('/admin/end-class', (req, res) => {
  const overrideCount = Object.keys(seatOverrides).length;
  seatOverrides = {};
  saveSeatOverrides(seatOverrides);

  // 💡 比照班際競賽關閉時的做法：把「這節課是哪個班」的設定也一併解除，
  // 這樣下課後，這幾台電腦即使還連得到主機，也不會因為 activeSession 還留著
  // 上一節課的班級，就把接下來任何人（下一節課的學生、或路過亂按的人）
  // 送出的成績誤算進上一班的名下。沒有 activeSession 之後，伺服器只會在
  // 「這個 IP 在全校名單裡唯一對應到一個人」時才放行，其餘一律擋下來不上傳。
  const hadClass = !!activeSession;
  const endedClassName = activeSession ? activeSession.className : null;
  activeSession = null;
  saveActiveSession(null);
  if (endedClassName === '班際競賽') isCompetitionMode = false;

  console.log(`[老師操作] 下課：已解除 ${overrideCount} 筆臨時換座位設定，${hadClass ? `並解除「${endedClassName}」的上課班級IP鎖定` : '目前本來就沒有設定上課班級'}`);
  res.send(
    `已下課：解除 ${overrideCount} 筆臨時換座位設定` +
    (hadClass ? `，並解除「${endedClassName}」的上課班級IP鎖定（這幾台電腦接下來不會再自動歸戶，要開始下一節課請重新選擇上課班級）` : '')
  );
});

// 💡 老師手動修正學生資料：姓名、IP、班級、座號、學號可以直接在後台改，
// 不用透過「臨時換座位」或「強制修正對應」繞一圈。只會更新有帶過來的欄位，
// 沒帶的欄位維持原值。
// body: { studentId, name, ip_address, class (className), seat_number, student_number }
app.post('/admin/update-student', (req, res) => {
  const { studentId, name, ip_address, className, seat_number, student_number } = req.body;
  if (!studentId) return res.status(400).send('缺少學生 id');

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  if (!student) return res.status(404).send('找不到這位學生');

  if (student_number !== undefined && student_number !== null && String(student_number).trim() !== '') {
    const trimmedNumber = String(student_number).trim();
    const clash = db.prepare('SELECT id FROM students WHERE student_number = ? AND id != ?').get(trimmedNumber, studentId);
    if (clash) return res.status(409).send('這個學號已經被別的學生使用了');
  }

  const updated = {
    name: (name !== undefined && name !== null && String(name).trim() !== '') ? String(name).trim() : student.name,
    ip_address: (ip_address !== undefined && ip_address !== null && String(ip_address).trim() !== '') ? String(ip_address).trim() : student.ip_address,
    class: (className !== undefined && className !== null && String(className).trim() !== '') ? String(className).trim() : student.class,
    seat_number: (seat_number !== undefined && seat_number !== null && String(seat_number).trim() !== '') ? Number(seat_number) : student.seat_number,
    student_number: (student_number !== undefined && student_number !== null && String(student_number).trim() !== '') ? String(student_number).trim() : student.student_number
  };

  db.prepare(`
    UPDATE students SET name = ?, ip_address = ?, class = ?, seat_number = ?, student_number = ?
    WHERE id = ?
  `).run(updated.name, updated.ip_address, updated.class, updated.seat_number, updated.student_number, studentId);

  console.log(`[老師修正] 學生資料已更新：${student.name} -> ${updated.name}（IP: ${updated.ip_address}, 班級: ${updated.class}, 座號: ${updated.seat_number}, 學號: ${updated.student_number}）`);
  res.send(`已更新 ${updated.name} 的資料`);
});

// 💡 老師手動修正單筆成績：分數、WPM、正確率、時間、錯誤數都可以直接改，
// 只會更新有帶過來的欄位，沒帶的欄位維持原值。
// body: { scoreId, best_score, wpm, accuracy, time_str, wrong_count }
app.post('/admin/update-score', (req, res) => {
  const { scoreId, best_score, wpm, accuracy, time_str, wrong_count } = req.body;
  if (!scoreId) return res.status(400).send('缺少成績 id');

  const score = db.prepare('SELECT * FROM scores WHERE id = ?').get(scoreId);
  if (!score) return res.status(404).send('找不到這筆成績');

  const updated = {
    best_score: (best_score !== undefined && best_score !== null && String(best_score).trim() !== '') ? Number(best_score) : score.best_score,
    wpm: (wpm !== undefined && wpm !== null && String(wpm).trim() !== '') ? Number(wpm) : score.wpm,
    accuracy: (accuracy !== undefined && accuracy !== null && String(accuracy).trim() !== '') ? String(accuracy) : score.accuracy,
    time_str: (time_str !== undefined && time_str !== null && String(time_str).trim() !== '') ? String(time_str) : score.time_str,
    wrong_count: (wrong_count !== undefined && wrong_count !== null && String(wrong_count).trim() !== '') ? Number(wrong_count) : score.wrong_count
  };

  db.prepare(`
    UPDATE scores SET best_score = ?, wpm = ?, accuracy = ?, time_str = ?, wrong_count = ?
    WHERE id = ?
  `).run(updated.best_score, updated.wpm, updated.accuracy, updated.time_str, updated.wrong_count, scoreId);

  console.log(`[老師修正] 成績 id=${scoreId} 已更新（分數: ${updated.best_score}, WPM: ${updated.wpm}, 正確率: ${updated.accuracy}）`);
  res.send('成績已更新');
});

// 💡 ETP測驗練習類型的中文全名 -> 資料庫用的單字代號（跟 /etp-leaderboard 的 category 對齊）
const ETP_CATEGORY_MAP = { '上列': '上', '中列': '中', '下列': '下', '綜合': '綜' };

// 💡 一般模式（單人/雙人）最終成績接收
// 登記時間同樣一律用伺服器（老師電腦）當下時間，不採信客戶端時間
app.post('/submit-final', (req, res) => {
  try {
    const { player1 } = req.body;
    if (!player1) return res.status(400).send('缺少 player1 資料');

    const ip = normalizeIp(req.ip);
    const student = getStudentForSubmission(req);

    if (!student) {
      console.warn(`[成績上傳] 失敗：找不到 IP ${ip} 對應的學生`);
      return res.status(404).send('找不到學生');
    }

    if (isCompetitionMode) {
      console.log(`[成績上傳 - 班際競賽] IP: ${ip}, 選手姓名: ${student.name} (座號 ${student.seat_number}), 類別: ${rowKey}, WPM: ${wpm},`);
    } else {
      const ipClasses = db.prepare("SELECT DISTINCT class FROM students WHERE ip_address = ?").all(ip);
      const lockedClasses = ipClasses.map(c => c.class).join('、') || '無登記班級';
      console.log(`[成績上傳] IP: ${ip}, 學生: ${student.name}, 類別: ${player1.category}, WPM: ${player1.wpm}, 分數: ${player1.score}, IP 登記班級: [${lockedClasses}]`);
    }

    db.prepare(`
      INSERT INTO scores (student_id, date, category, best_score, sub_category, wpm, accuracy, composite_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(student.id, new Date().toISOString(), player1.category || '練習', player1.score || 0, player1.mode || 'solo', player1.wpm || 0, player1.accuracy || 100, player1.composite_score || 0);

    res.status(200).send('成績已記錄');
  } catch (err) {
    console.error(`[成績上傳] 錯誤:`, err.message);
    res.status(500).send(err.message);
  }
});
// 💡 ETP測驗成績接收
// 登記時間同樣一律用伺服器（老師電腦）當下時間，不採信客戶端時間
app.post('/submit-etp', (req, res) => {
  try {
    const { rowKey, timeStr, wrongCount, accuracy, wpm } = req.body;
    
    const ip = normalizeIp(req.ip);
    const student = getStudentForSubmission(req);

    if (!student) {
      console.warn(`[ETP 上傳] 失敗：找不到 IP ${ip} 對應的學生`);
      return res.status(404).send('找不到學生');
    }

    if (isCompetitionMode) {
      console.log(`[ETP 上傳 - 班際競賽] IP: ${ip}, 選手姓名: ${student.name} (座號 ${student.seat_number}), 類別: ${rowKey}, WPM: ${wpm},`);
    } else {
      const ipClasses = db.prepare("SELECT DISTINCT class FROM students WHERE ip_address = ?").all(ip);
      const lockedClasses = ipClasses.map(c => c.class).join('、') || '無登記班級';
      console.log(`[ETP 上傳]  IP: ${ip}, 對應學生: ${student.name} (座號 ${student.seat_number}), 類別: ${rowKey}, WPM: ${wpm}, 目前上課班級: [${activeSession ? activeSession.className : '未設定'}], IP 登記班級: [${lockedClasses}]`);
    }

    const shortKey = ETP_CATEGORY_MAP[rowKey] || rowKey;
    const score = Math.round((wpm || 0) * ((parseFloat(accuracy) || 0) / 100));

    db.prepare(`
      INSERT INTO scores (student_id, date, category, best_score, time_str, wrong_count, accuracy, wpm, ip_recorded)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(student.id, new Date().toISOString(), 'ETP-' + shortKey, score, timeStr || '', wrongCount || 0, accuracy || '', wpm || 0, ip);

    res.send('ETP成績已記錄');
  } catch (err) {
    console.error(`[ETP 上傳] 錯誤:`, err.message);
    res.status(500).send(err.message);
  }
});
function getStudentForSubmission(req) {
    const ip = normalizeIp(req.ip);

    // 如果是競賽模式
    if (isCompetitionMode) {
        // 💡 改用玩家自己輸入的名字辨識身份，不管這台電腦的IP原本在哪個班級名單裡對應到誰
        const typedName = (req.body.player1 && req.body.player1.name) || req.body.seatNumber || req.body.name;
        const name = (typedName && String(typedName).trim()) || '匿名選手';

        let student = db.prepare("SELECT * FROM students WHERE (class = '競賽組' OR class = '班際競賽') AND name = ?").get(name);

        if (!student) {
            // 💡 student_number 改用時間戳記確保唯一，原本寫死 '000' 第二個人送成績就會撞到 UNIQUE(year, student_number) 直接報錯
            console.log(`[競賽模式] 為 ${name} 建立班際競賽帳號`);
            const result = db.prepare(`
                INSERT INTO students (year, class, student_number, name, seat_number, ip_address)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run('2026', '班際競賽', `COMP-${Date.now()}-${Math.floor(Math.random()*1000)}`, name, 0, ip);

            student = db.prepare("SELECT * FROM students WHERE id = ?").get(result.lastInsertRowid);
        }
        return student;
    }

    // 如果不是競賽模式，走原本的邏輯
    return findStudentByIp(req.ip);
}
// =========================================================================
// 💡 雲端同步機制（在家練習 → 校內資料庫）
// 學生在家用自己的裝置練習時，連不到這支校內主機，練習資料會先進雲端中繼站
// （Google 試算表，見專案附的「雲端同步部署說明.md」）。老師電腦在校內、能連
// 到這支主機，同時對外也能上網連到那個雲端中繼站，扮演橋樑：把中繼站裡累積
// 的待處理資料抓下來，一筆一筆送進這支 /sync-import，寫進本地資料庫。
// /get-save 則是反方向：學校電腦登入時，把這個學生雲端彙總過的存檔拉回來，
// 跟本機存檔合併，讓在家賺到的 GBit/進度在學校電腦上也看得到。
// =========================================================================

// body: 雲端佇列裡的其中一筆，格式跟 sync-client.js 送出去的一致：
//   { studentNumber, save, pendingAttempts: [{type, data, queuedAt}] }
// admin.html「六、雲端同步」的匯入工具，會對雲端佇列裡每一筆資料各呼叫一次這支。
app.post('/sync-import', (req, res) => {
  try {
    const { studentNumber, save, pendingAttempts } = req.body;
    if (!studentNumber) return res.status(400).json({ success: false, message: '缺少學號' });

    // 找學生：邏輯比照 /login-code，先在目前上課班級裡找，找不到再退回全表比對
    let student = null;
    if (activeSession) {
      student = db.prepare("SELECT * FROM students WHERE student_number = ? AND year = ? AND class = ?")
        .get(String(studentNumber), activeSession.year, activeSession.className);
    }
    if (!student) {
      student = db.prepare("SELECT * FROM students WHERE student_number = ?").get(String(studentNumber));
    }
    if (!student) {
      return res.status(404).json({ success: false, message: `找不到學號 ${studentNumber}，可能是名單還沒建齊` });
    }

    // 1) 合併存檔（GBit 等）。用「終身賺取/花費」各自取較大值、重新算出餘額，
    //    避免同一筆進度因為多次同步、或跟學校電腦上的舊存檔合併而被重複計算。
    if (save) {
      const existingRow = db.prepare('SELECT save_json FROM game_saves WHERE student_id = ?').get(student.id);
      const existing = existingRow ? JSON.parse(existingRow.save_json) : {};
      const merged = Object.assign({}, save, existing);
      const earned = Math.max(existing.gbitEarnedLifetime || 0, save.gbitEarnedLifetime || 0);
      const spent = Math.max(existing.gbitSpentLifetime || 0, save.gbitSpentLifetime || 0);
      merged.gbitEarnedLifetime = earned;
      merged.gbitSpentLifetime = spent;
      merged.gbit = Math.max(0, earned - spent);

      db.prepare(`
        INSERT INTO game_saves (student_id, save_json, updated_at) VALUES (?, ?, ?)
        ON CONFLICT(student_id) DO UPDATE SET save_json = excluded.save_json, updated_at = excluded.updated_at
      `).run(student.id, JSON.stringify(merged), new Date().toISOString());
    }

    // 2) 補寫在家練習時來不及送出的 ETP / 看打成績
    (pendingAttempts || []).forEach(item => {
      const d = item.data || {};
      const when = new Date(item.queuedAt || Date.now()).toISOString();
      if (item.type === 'etp') {
        const shortKey = ETP_CATEGORY_MAP[d.rowKey] || d.rowKey || '';
        const score = Math.round((d.wpm || 0) * ((parseFloat(d.accuracy) || 0) / 100));
        db.prepare(`
          INSERT INTO scores (student_id, date, category, best_score, time_str, wrong_count, accuracy, wpm, ip_recorded)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(student.id, when, 'ETP-' + shortKey, score, d.timeStr || '', d.wrongCount || 0, d.accuracy || '', d.wpm || 0, '在家（雲端同步）');
      } else if (item.type === 'lookType') {
        db.prepare(`
          INSERT INTO scores (
            student_id, date, category, best_score,
            time_str, accuracy, wpm, composite_score,
            article_filename, level, time_limit, input_method, code, ip_recorded
          ) VALUES (?, ?, 'ENGLISH_Look', ?, ?, ?, 0, ?, ?, ?, ?, ?, 'ENGLISH_Look', ?)
        `).run(
          student.id, when, d.obtainedScore || 0,
          d.timeUsed || '', d.accuracy || '', d.totalScore || 0,
          d.articleFilename || '', d.level || '', d.timeLimit || '', d.inputMethod || '', '在家（雲端同步）'
        );
      }
    });

    res.json({ success: true, studentId: student.id, name: student.name });
  } catch (err) {
    console.error('[雲端同步匯入] 錯誤:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// query: ?studentId=123 —— 給 login.html 用
app.get('/get-save', (req, res) => {
  try {
    const { studentId } = req.query;
    if (!studentId) return res.status(400).json({ success: false, message: '缺少 studentId' });
    const row = db.prepare('SELECT save_json FROM game_saves WHERE student_id = ?').get(studentId);
    if (!row) return res.json({ success: true, save: null });
    res.json({ success: true, save: JSON.parse(row.save_json) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================================
// 💡 打字賽車（全班連線賽）
// 跟班際競賽模式一樣，比賽狀態只存在記憶體裡（老師電腦重開伺服器 = 比賽重新開始，
// 不需要跨重啟保留，這點跟 activeSession/seatOverrides 不同，故意不寫進檔案）。
// 文章（raceRoom.lines）由伺服器統一產生一次，所有學生跟投影端拿到的都是同一份，
// 確保全班比的是同一份題目，公平起見不能各自在瀏覽器端各產生一次。
//
// 分類字元定義／文章產生規則／分數與代幣公式，直接複製自 CarRace/race-common.js
// （瀏覽器端跟 Node 伺服器端各自的檔案系統不同，沒辦法直接 require 同一份，
// 兩邊都要保持一致，未來如果改分數公式，記得這裡也要跟著改）。
// =========================================================================
const RACE_TOP_P1 = "qwert", RACE_TOP_P2 = "yuiop";
const RACE_HOME_P1 = "asdfg", RACE_HOME_P2 = "hjkl";
const RACE_BOTTOM_P1 = "zxcvb", RACE_BOTTOM_P2 = "nm";
const RACE_ALL_P1 = RACE_TOP_P1 + RACE_HOME_P1 + RACE_BOTTOM_P1;
const RACE_ALL_P2 = RACE_TOP_P2 + RACE_HOME_P2 + RACE_BOTTOM_P2;
const RACE_TOP_P2_SYM = "[]", RACE_HOME_P2_SYM = ";'", RACE_BOTTOM_P2_SYM = ",./";
const RACE_LEFT_SYM = "~!@#$%";
const RACE_RIGHT_SYM = "^&*()_+-=[]{}|;:'\",.<>/?";
const RACE_UPPER_ALL_P1 = RACE_ALL_P1.toUpperCase();
const RACE_UPPER_ALL_P2 = RACE_ALL_P2.toUpperCase();
const RACE_CATEGORY_DEFS = {
  top:    { chars: RACE_TOP_P1 + RACE_TOP_P2, label: "上列字母" },
  home:   { chars: RACE_HOME_P1 + RACE_HOME_P2, label: "中列字母" },
  bottom: { chars: RACE_BOTTOM_P1 + RACE_BOTTOM_P2, label: "下列字母" },
  all:    { chars: RACE_ALL_P1 + RACE_ALL_P2 + RACE_TOP_P2_SYM + RACE_HOME_P2_SYM + RACE_BOTTOM_P2_SYM, label: "綜合練習" },
  symbols:{ chars: RACE_LEFT_SYM + RACE_RIGHT_SYM, label: "符號專攻" },
  caseSymbols: { chars: RACE_ALL_P1 + RACE_UPPER_ALL_P1 + RACE_ALL_P2 + RACE_UPPER_ALL_P2 + RACE_LEFT_SYM + RACE_RIGHT_SYM + RACE_TOP_P2_SYM + RACE_HOME_P2_SYM + RACE_BOTTOM_P2_SYM, label: "混合進階" }
};

// 每行固定 40 個「不含空格」的字元，打完一行前端就換下一行——這裡一次產生整場比賽會用到的所有行，
// 數量抓「比賽分鐘數 x 60」列，就算全班都是驚人手速也綽綽有餘，不會有人中途沒題目可打。
function raceGenerateLine(categoryKey, nonSpaceTarget) {
  nonSpaceTarget = nonSpaceTarget || 40;
  const def = RACE_CATEGORY_DEFS[categoryKey] || RACE_CATEGORY_DEFS.home;
  const chars = def.chars;
  let out = "";
  let nonSpaceCount = 0;
  while (nonSpaceCount < nonSpaceTarget) {
    const remaining = nonSpaceTarget - nonSpaceCount;
    const wlen = Math.min(3 + Math.floor(Math.random() * 4), remaining);
    let word = "";
    for (let i = 0; i < wlen; i++) word += chars[Math.floor(Math.random() * chars.length)];
    out += (out.length ? " " : "") + word;
    nonSpaceCount += wlen;
  }
  return out;
}
function raceGenerateLines(categoryKey, numLines) {
  const lines = [];
  for (let i = 0; i < numLines; i++) lines.push(raceGenerateLine(categoryKey, 40));
  return lines;
}

const RACE_TOP3_BONUS = [1.5, 1.25, 1.1]; // 前三名代幣加成，跟 race-common.js 保持一致

let raceRoom = null;   // 進行中的比賽：{ id, category, durationMinutes, lines, startedAt, racers:{studentNumber:{name,team,charsTyped,wpm,finished,score}} }
let raceLastResult = null; // 上一場結算結果，讓學生端在交卷後可以查到自己的名次/代幣

// ---- 車隊分配：依「這台電腦的 IP」自動分隊，每隊最多 10 人，同一天固定不變 ----
// 存成檔案而不是只放記憶體，這樣即使伺服器中途重開，同一天內同一台電腦也還是同一隊，
// 隔天檔案裡的日期對不上就自動重新分配（跟 activeSession 那種「跨重啟仍要記得」的邏輯是同一個做法）。
const RACE_TEAM_FILE = path.join(__dirname, 'race-team-assignments.json');

function loadRaceTeamState() {
  try {
    const data = JSON.parse(fs.readFileSync(RACE_TEAM_FILE, 'utf8'));
    if (data.date === getTodayDateStr()) return data;
  } catch (err) { /* 檔案不存在或壞掉、或日期不是今天，都視為要重新開始分隊 */ }
  return { date: getTodayDateStr(), assignments: {}, counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
}
function saveRaceTeamState(state) {
  fs.writeFileSync(RACE_TEAM_FILE, JSON.stringify(state));
}
// 回傳這個 IP 今天被分到第幾隊；隊伍已經滿 10 人時回傳 null（呼叫端要擋下、請學生找老師）
function getOrAssignRaceTeam(ip) {
  const state = loadRaceTeamState();
  if (state.assignments[ip]) return state.assignments[ip];
  const available = [1, 2, 3, 4, 5].filter(t => (state.counts[t] || 0) < 10);
  if (available.length === 0) return null;
  const team = available[Math.floor(Math.random() * available.length)];
  state.assignments[ip] = team;
  state.counts[team] = (state.counts[team] || 0) + 1;
  saveRaceTeamState(state);
  return team;
}

// 老師端：開始一場新比賽（分類 + 比賽時間，1/5/10 分鐘，無限量字數）
app.post('/race/start', (req, res) => {
  const { category, durationMinutes, className } = req.body;
  const cat = RACE_CATEGORY_DEFS[category] ? category : 'home';
  const duration = [1, 5, 10].includes(Number(durationMinutes)) ? Number(durationMinutes) : 5;
  const numLines = Math.max(80, duration * 60);
  raceRoom = {
    id: `${Date.now()}`,
    category: cat,
    className: className || null, // 純供投影端顯示「目前比賽班級」用，比賽本身仍以學號/IP辨識，不受此欄位篩選
    durationMinutes: duration,
    lines: raceGenerateLines(cat, numLines),
    startedAt: Date.now(),
    racers: {}
  };
  raceLastResult = null;
  console.log(`[打字賽車] 老師開始新比賽，分類：${RACE_CATEGORY_DEFS[cat].label}，時間：${duration} 分鐘`);
  res.json({ success: true, roomId: raceRoom.id, category: cat, durationMinutes: duration, lines: raceRoom.lines, startedAt: raceRoom.startedAt });
});

// 學生端：加入目前這場比賽（車隊不用自己選，依這台電腦的 IP 自動分配、每隊上限10人、當天固定）
app.post('/race/join', (req, res) => {
  if (!raceRoom) return res.status(409).json({ success: false, message: '目前沒有進行中的比賽，請等老師開始' });
  const { studentNumber, name } = req.body;
  if (!studentNumber) return res.status(400).json({ success: false, message: '缺少學號' });
  const ip = normalizeIp(req.ip);
  const team = getOrAssignRaceTeam(ip);
  if (!team) return res.status(409).json({ success: false, message: '車隊名額已滿（每隊上限10人，全班50人名額已滿），請找老師確認' });
  raceRoom.racers[studentNumber] = raceRoom.racers[studentNumber] || {
    name: name || studentNumber, team, charsTyped: 0, wpm: 0, finished: false, score: 0
  };
  raceRoom.racers[studentNumber].team = team;
  res.json({ success: true, roomId: raceRoom.id, team, category: raceRoom.category, durationMinutes: raceRoom.durationMinutes, lines: raceRoom.lines, startedAt: raceRoom.startedAt });
});

// 學生端：每秒回報自己的即時進度（供其他同學/投影端看到車隊戰況跟團隊貢獻值）
app.post('/race/progress', (req, res) => {
  if (!raceRoom) return res.status(409).json({ success: false, message: '比賽已結束' });
  const { studentNumber, charsTyped, wpm, finished, score } = req.body;
  const r = raceRoom.racers[studentNumber];
  if (!r) return res.status(404).json({ success: false, message: '尚未加入這場比賽' });
  r.charsTyped = charsTyped || 0;
  r.wpm = wpm || 0;
  r.score = score || 0;
  if (finished) r.finished = true;
  res.json({ success: true });
});

// 投影端/學生端：查詢目前比賽狀態（每秒輪詢一次，比賽結束後回傳 lastResult 一次）
app.get('/race/state', (req, res) => {
  if (raceRoom) {
    return res.json({ active: true, roomId: raceRoom.id, category: raceRoom.category, durationMinutes: raceRoom.durationMinutes, lines: raceRoom.lines, startedAt: raceRoom.startedAt, racers: raceRoom.racers });
  }
  res.json({ active: false, lastResult: raceLastResult });
});

// 老師端：結束比賽，依總分排名結算代幣（前三名有加成）、算出每人的團隊貢獻值%，
// 並且每隊選出貢獻值最高（踩油門王者）跟最低（踩煞車高手）——隊上要有2人以上才頒獎，避免1人隊自己跟自己比。
app.post('/race/end', (req, res) => {
  if (!raceRoom) return res.json({ success: false, message: '目前沒有進行中的比賽' });
  const category = raceRoom.category;
  const list = Object.entries(raceRoom.racers).map(([studentNumber, r]) => ({ studentNumber, ...r }));
  list.sort((a, b) => (b.score || 0) - (a.score || 0));

  const teamTotals = {};
  const teamMembers = {};
  list.forEach(r => {
    if (!r.team) return;
    teamTotals[r.team] = (teamTotals[r.team] || 0) + (r.score || 0);
    teamMembers[r.team] = teamMembers[r.team] || [];
    teamMembers[r.team].push(r);
  });
  const topContributor = {}, bottomContributor = {};
  Object.entries(teamMembers).forEach(([team, members]) => {
    if (members.length < 2) return;
    let top = members[0], bottom = members[0];
    members.forEach(m => {
      if ((m.score || 0) > (top.score || 0)) top = m;
      if ((m.score || 0) < (bottom.score || 0)) bottom = m;
    });
    topContributor[team] = top.studentNumber;
    bottomContributor[team] = bottom.studentNumber;
  });

  list.forEach((r, idx) => {
    let tokens = Math.floor((r.score || 0) / 500);
    const bonus = RACE_TOP3_BONUS[idx];
    if (bonus) tokens = Math.round(tokens * bonus);
    r.rank = idx + 1;
    r.tokens = tokens;
    const teamTotal = r.team ? (teamTotals[r.team] || 0) : 0;
    r.contributionPct = teamTotal > 0 ? Math.round((r.score || 0) / teamTotal * 1000) / 10 : 0;
    r.award = topContributor[r.team] === r.studentNumber ? '踩油門王者'
      : bottomContributor[r.team] === r.studentNumber ? '踩煞車高手' : null;

    const student = db.prepare("SELECT * FROM students WHERE student_number = ?").get(String(r.studentNumber));
    if (!student) return; // 訪客/查無學號的不寫入資料庫，但排行榜結果一樣會回傳給前端顯示

    db.prepare(`
      INSERT INTO scores (student_id, date, category, best_score, sub_category, wpm, accuracy, composite_score, race_contribution_pct, race_award)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(student.id, new Date().toISOString(), 'RACE-' + category, r.score || 0, r.team ? `team${r.team}` : 'solo', r.wpm || 0, 100, r.score || 0, r.contributionPct || 0, r.award || null);

    const row = db.prepare('SELECT save_json FROM game_saves WHERE student_id = ?').get(student.id);
    const save = row ? JSON.parse(row.save_json) : { gbit: 0, gbitEarnedLifetime: 0, gbitSpentLifetime: 0 };
    save.gbit = (save.gbit || 0) + tokens;
    save.gbitEarnedLifetime = (save.gbitEarnedLifetime || 0) + tokens;
    db.prepare(`
      INSERT INTO game_saves (student_id, save_json, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(student_id) DO UPDATE SET save_json = excluded.save_json, updated_at = excluded.updated_at
    `).run(student.id, JSON.stringify(save), new Date().toISOString());
  });

  raceLastResult = { rankings: list, category, endedAt: Date.now() };
  console.log(`[打字賽車] 比賽結束，共 ${list.length} 人參賽，已結算代幣`);
  raceRoom = null;
  res.json({ success: true, result: raceLastResult });
});

// 打字賽車排行榜（給 admin.html「四、排行榜」按鈕開啟的 CarRace/race-leaderboard.html 使用）
app.get('/race-leaderboard', (req, res) => {
  try {
    const date = req.query.date || getTodayDateStr();
    const rows = db.prepare(`
      SELECT sc.*, s.name, s.seat_number, s.class, s.year
      FROM scores sc
      JOIN students s ON s.id = sc.student_id
      WHERE sc.category LIKE 'RACE-%' AND sc.date LIKE ? || '%'
      ORDER BY sc.best_score DESC
    `).all(date);
    const result = rows.map((r, idx) => ({
      rank: idx + 1,
      name: r.name,
      class: r.class,
      seatNumber: r.seat_number,
      category: (r.category || '').replace('RACE-', ''),
      team: r.sub_category || '',
      wpm: r.wpm || 0,
      score: r.best_score || 0,
      contributionPct: r.race_contribution_pct || 0,
      award: r.race_award || '',
      testDate: r.date ? r.date.split('T')[0] : ''
    }));
    res.json(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 💡 打字賽車排行榜有資料的所有日期（供排行榜日期選單使用）
app.get('/race-leaderboard-dates', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT DISTINCT substr(date, 1, 10) as d FROM scores WHERE category LIKE 'RACE-%' ORDER BY d DESC
    `).all();
    res.json(rows.map(r => r.d));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// =========================================================================
// 💡 打字修仙傳（God）—— 送成績、發代幣、排行榜
// 身分認定跟 ETP／看打／打字賽車一致：不採信前端送來的學號，一律用送出
// 當下這台電腦的 IP，在「目前上課班級」或全表比對出真正的學生（見
// getStudentForSubmission／findStudentByIp），前端的 studentNumberHint
// 只是拿來在畫面上顯示、除錯用，不影響實際入帳對象。
// =========================================================================

// 💡 代幣（GBit）換算規則：先用「每 300 分 1 代幣」+「星等加碼」這組預設值，
// 這兩個數字是合理預設，不是 Eric 指定的，正式上線前請依實際練習量調整。
const GOD_SCORE_PER_GBIT = 300;
const GOD_STAR_BONUS_GBIT = 10; // 每顆星額外加碼

app.post('/submit-god', (req, res) => {
  try {
    const {
      categoryKey, categoryLabel, score, accuracy,
      maxCombo, typed, defeated, stars, grade
    } = req.body;

    if (!categoryKey) return res.status(400).json({ success: false, message: '缺少 categoryKey' });

    const student = getStudentForSubmission(req);
    if (!student) {
      console.warn(`[God 上傳] 失敗：找不到 IP ${normalizeIp(req.ip)} 對應的學生（可能是本機模式或連不到學校主機）`);
      return res.status(404).json({ success: false, message: '找不到對應座位的學生，請確認已用學號在學校電腦登入' });
    }

    const category = 'GOD-' + String(categoryKey).toUpperCase();
    const finalScore = Math.max(0, Math.round(score || 0));
    const starCount = Math.max(0, Math.min(3, Math.round(stars || 0)));

    db.prepare(`
      INSERT INTO scores (student_id, date, category, best_score, sub_category, wpm, accuracy, composite_score, wrong_count, ip_recorded)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      student.id, new Date().toISOString(), category, finalScore,
      String(grade || ''), Math.round(maxCombo || 0), String(accuracy || ''), finalScore,
      Math.round(defeated || 0), normalizeIp(req.ip)
    );

    const tokens = Math.floor(finalScore / GOD_SCORE_PER_GBIT) + starCount * GOD_STAR_BONUS_GBIT;

    const row = db.prepare('SELECT save_json FROM game_saves WHERE student_id = ?').get(student.id);
    const save = row ? JSON.parse(row.save_json) : { gbit: 0, gbitEarnedLifetime: 0, gbitSpentLifetime: 0 };
    save.gbit = (save.gbit || 0) + tokens;
    save.gbitEarnedLifetime = (save.gbitEarnedLifetime || 0) + tokens;
    db.prepare(`
      INSERT INTO game_saves (student_id, save_json, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(student_id) DO UPDATE SET save_json = excluded.save_json, updated_at = excluded.updated_at
    `).run(student.id, JSON.stringify(save), new Date().toISOString());

    console.log(`[God 上傳] 學生: ${student.name}(${student.class}), 項目: ${categoryLabel || categoryKey}, 分數: ${finalScore}, 獲得代幣: ${tokens}`);
    res.json({ success: true, tokensAwarded: tokens, gbit: save.gbit });
  } catch (err) {
    console.error('[God 上傳] 錯誤:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 給 god-leaderboard.html 下拉選單用
app.get('/god-categories', (req, res) => {
  res.json(GOD_CATEGORIES);
});

// 💡 全校／年級／班級 歷史最高分（史上最強，永久保留直到被打破，不分日期）
app.get('/god-hall-of-fame', (req, res) => {
  try {
    const { category, year, className } = req.query;
    if (!category) return res.status(400).json({ success: false, message: '缺少 category' });
    const dbCategory = 'GOD-' + String(category).toUpperCase();

    const rows = db.prepare(`
      SELECT s.name, s.seat_number, s.class, s.year, sc.best_score, sc.sub_category, sc.date
      FROM scores sc
      JOIN students s ON s.id = sc.student_id
      WHERE sc.category = ?
      ORDER BY sc.best_score DESC, sc.date ASC
    `).all(dbCategory);

    const toEntry = (r) => r ? {
      name: r.name,
      className: r.class,
      seatNumber: r.seat_number,
      score: r.best_score || 0,
      grade: r.sub_category || '',
      date: r.date
    } : null;

    const targetGrade = deriveGrade(className);
    const schoolBest = rows[0] || null;
    const gradeBest = rows.find(r => deriveGrade(r.class) === targetGrade) || null;
    const classBest = rows.find(r => r.class === className && (!year || r.year === String(year))) || null;

    res.json({
      school: toEntry(schoolBest),
      grade: toEntry(gradeBest),
      class: toEntry(classBest),
      derivedGrade: targetGrade
    });
  } catch (err) {
    console.error('[God 歷史最高分] 錯誤:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 💡 當日班級練習狀態：目前選定班級裡，每個學生今天在該項目的最佳成績（沒練過就是 null）
app.get('/god-leaderboard-today', (req, res) => {
  try {
    const { year, className, category } = req.query;
    if (!year || !className) return res.status(400).json({ success: false, message: '缺少年度或班級' });
    const date = req.query.date || getTodayDateStr();
    const dbCategory = category ? 'GOD-' + String(category).toUpperCase() : null;

    const rows = dbCategory
      ? db.prepare(`
          SELECT s.seat_number, s.name, MAX(sc.best_score) as best_score, MAX(sc.sub_category) as grade
          FROM students s
          LEFT JOIN scores sc ON s.id = sc.student_id AND sc.category = ? AND sc.date LIKE ? || '%'
          WHERE s.year = ? AND s.class = ?
          GROUP BY s.id
          ORDER BY best_score DESC
        `).all(dbCategory, date, year, className)
      : db.prepare(`
          SELECT s.seat_number, s.name, MAX(sc.best_score) as best_score, MAX(sc.sub_category) as grade
          FROM students s
          LEFT JOIN scores sc ON s.id = sc.student_id AND sc.category LIKE 'GOD-%' AND sc.date LIKE ? || '%'
          WHERE s.year = ? AND s.class = ?
          GROUP BY s.id
          ORDER BY best_score DESC
        `).all(date, year, className);

    res.json(rows.map(r => ({
      seatNumber: r.seat_number,
      name: r.name,
      score: r.best_score,
      grade: r.grade || ''
    })));
  } catch (err) {
    console.error('[God 當日練習狀態] 錯誤:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/god-leaderboard-dates', (req, res) => {
  try {
    const { year, className, category } = req.query;
    const dbCategory = category ? 'GOD-' + String(category).toUpperCase() : null;
    const rows = dbCategory
      ? db.prepare(`
          SELECT DISTINCT substr(sc.date, 1, 10) as d FROM scores sc
          JOIN students s ON s.id = sc.student_id
          WHERE s.year = ? AND s.class = ? AND sc.category = ?
          ORDER BY d DESC
        `).all(year, className, dbCategory)
      : db.prepare(`
          SELECT DISTINCT substr(sc.date, 1, 10) as d FROM scores sc
          JOIN students s ON s.id = sc.student_id
          WHERE s.year = ? AND s.class = ? AND sc.category LIKE 'GOD-%'
          ORDER BY d DESC
        `).all(year, className);
    res.json(rows.map(r => r.d));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(3000, () => {
  console.log('伺服器在 http://localhost:3000 運行中');
});