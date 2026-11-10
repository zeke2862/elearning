# 遊戲接入「教師後台」規格（給製作遊戲的同學與你的 AI）

> **這份文件可以整份貼給你的 AI（Claude、ChatGPT、Gemini 都行）**，請它照規格把你的遊戲接上教師後台。
> 接好之後，老師就能看到：**誰玩的（學號）、玩了幾次、最高分、每一關的答對率、每一關花了多少時間、哪些題型比較弱**。
> 範例程式碼都已經實際測試過，可以直接使用。

---

## 0. 貼給 AI 的指令（複製這一段，再把這份文件整份貼在後面）

```
請幫我把我的網頁遊戲接上「教師後台」，完全照下面這份規格做：
1. 我的遊戲代號是：＿＿＿＿（小寫英文／數字／-／_，格式「科目簡碼-遊戲名」，例如 chi-hanzi）
2. 使用文件第 4 節的整段程式，只改 GAME_KEY；不要改寫 sync-client.js，也不要改它裡面的網址。
3. 學號沒輸入不能開始玩；只記學號和遊戲成績，不記真名、電話、住址、生日。
4. 每一局結束時呼叫 finishRound(...)，把「這一關的名稱、分數、作答題數、答對題數、各題型的答對狀況」都傳進去。
5. 練習時間只算玩完一局的時間；切走、中途關閉的不算（第 4 節已經包含）。
6. 做完請依第 6 節的「驗收清單」逐項自己檢查，並告訴我檢查結果。
```

---

## 1. 這是怎麼運作的（簡單版）

```
你的遊戲 ─ 寄信 ─▶ 老師的 Google 試算表（信箱）─▶ 老師的「教師後台」網頁
 玩完一局就寄       每一封信 = 一位同學一次的紀錄       整理成表格給老師看
```

- **sync-client.js** 是幫你寄信的「郵差」，老師已經做好，**你只要放進你的遊戲資料夾，不要改它**。它裡面已經填好老師的信箱網址。
- **學號** 是信封上的收件人。沒有學號，老師就不知道是誰玩的。
- **遊戲代號** 是你的遊戲的名字，老師的後台用它來分辨是哪一款遊戲。
- 你**不需要**自己做資料庫、不需要伺服器、不需要設定任何密碼。

---

## 2. 遊戲代號怎麼取

- 只能用：**小寫英文字母、數字、`-`、`_`**，長度 2～31 個字。
- 建議格式：**科目簡碼-遊戲名**。這樣老師可以用「科目」一次開放權限給整科老師看。

| 科目 | 簡碼 | 範例 |
|---|---|---|
| 國文 | `chi` | `chi-hanzi`、`chi-poem` |
| 英文 | `eng` | `eng-vocab` |
| 數學 | `math` | `math-fraction` |
| 自然 | `sci` | `sci-cell` |
| 社會 | `soc` | `soc-map` |
| 電腦 | `com` | `com-typing` |
| 其他科目 | 跟老師討論 | |

> 不要跟別人的遊戲代號重複，否則紀錄會混在一起。取好之後**不要再改**，改了就等於變成另一款遊戲。

---

## 3. 資料規格（你要送出去的資料長什麼樣子）

每位學生在你的遊戲只會有「一份」紀錄，每次更新就是改這一份。格式如下（沒有的欄位可以不放）：

```jsonc
{
  "nick": "小勇者",              // 遊戲裡的暱稱（不是真名）
  "totalPlays": 3,               // 一共玩了幾局
  "bestScore": 80,               // 最高分
  "totalSecs": 600,              // 累積練習秒數（只算玩完一局的時間）
  "totalQ": 30,                  // 累積作答題數
  "totalOk": 24,                 // 累積答對題數
  "lastScore": 80,               // 最近一局的分數
  "lastId": "L1",                // 最近玩的關卡代碼
  "lastName": "第一課 認字",      // 最近玩的關卡名稱
  "lastAt": 1790000000000,       // 最近一次玩的時間（Date.now()）

  "stages": {                    // 每一關一格（沒有關卡概念的遊戲可以不放）
    "L1": {
      "n": "第一課 認字",         // 這一關的中文名稱 ← 後台的欄位名稱就是用它
      "bestStars": 2,            // 這一關最高幾星（沒有星星就不用放）
      "bestScore": 80,           // 這一關最高分
      "plays": 2,                // 這一關玩了幾次
      "totalSecs": 300,          // 這一關累積練習秒數
      "totalQ": 20,              // 這一關累積作答題數
      "totalOk": 18              // 這一關累積答對題數  → 答對率 = totalOk ÷ totalQ
    }
  },

  "q": {                         // 各題型的答對狀況（可選，用來看「弱點」）
    "L1:read": { "n": 12, "ok": 10, "label": "看字讀音" }   // 關卡代碼:題型代碼
  }
}
```

### 關卡名稱（章節）怎麼處理

**後台不需要事先知道你的關卡。** 你把關卡的中文名稱放在 `stages.<代碼>.n`，後台就會自動把你出現過的關卡排成欄位。
不同科目、不同年級、不同章節數量都可以，老師不用另外更新任何設定。

### 欄位名稱的規則（很重要）

同一位同學可能用手機又用電腦玩，系統會把兩邊的紀錄「合併」。合併時看**名字**決定誰留下：

| 名字長這樣 | 合併時怎麼處理 | 適合放 |
|---|---|---|
| 開頭是 `best`、`total`、`max`，或剛好叫 `plays` | 取**較大的**（只增不減） | 最高分、累積次數、累積秒數、累積題數 |
| 其他（例如 `lastScore`、`lastAt`、`n`） | 取**較新的那一份** | 最近一次的結果、名稱 |

所以：**要累積的用 `total…` 開頭，要最高的用 `best…` 開頭。** 不要自己發明別的名字來放累積值，否則換裝置玩時紀錄可能被舊的蓋掉。

---

## 4. 要放進遊戲的程式（整段複製，只改 `GAME_KEY`）

**前置：** 先把 `sync-client.js` 放在你的遊戲旁邊（下載位置：`https://zeke2862.github.io/elearning/sync-client.js`，直接另存，**不要修改**），並在頁面最前面載入：

```html
<script src="../sync-client.js"></script>   <!-- 依你的遊戲放的位置調整 ../ 的數量 -->
```

> 在瀏覽器按 F12 看「主控台」，如果出現紅字 `sync-client.js 404`，就是路徑不對。

然後加上這一整段：

```html
<script>
/* ========== 接上教師後台的程式（整段複製，只改最上面的 GAME_KEY） ========== */
const GAME_KEY = 'chi-hanzi';            // 遊戲代號：小寫英文／數字／-／_，建議「科目簡碼-遊戲名」

/* 1) 學號：沒有就強迫輸入 */
function ensureStudent(done) {
  const no = keyagentGetActiveStudentNumber();
  if (no) return done(no);
  const v = (prompt('請輸入你的學號') || '').trim();
  if (!/^[A-Za-z0-9_-]{2,12}$/.test(v)) return ensureStudent(done);
  localStorage.setItem('keyagent_active_student', JSON.stringify({ studentNumber: v, verified: false }));
  done(v);
}

/* 2) 練習時間：只算「玩完一局」的時間；切到別的分頁不算；中途關掉的那一局不算 */
let T0 = 0, ACC = 0;
function tStart()  { ACC = 0; T0 = Date.now(); }
function tPause()  { if (T0) { ACC += Date.now() - T0; T0 = 0; } }
function tResume() { if (!T0 && !document.hidden) T0 = Date.now(); }
function tTake()   { tPause(); const s = Math.min(1800, Math.round(ACC / 1000)); ACC = 0; return s; }
document.addEventListener('visibilitychange', () => (document.hidden ? tPause() : tResume()));

/* 3) 一局結束時呼叫 finishRound({...})，會自動記錄並送到老師的後台 */
function finishRound(r) {
  // r = { stageId:'L1', stageName:'第一課 認字', score:80, right:8, total:10, stars:2(可省略), nick:'小勇者'(可省略),
  //       types:[{ key:'read', label:'看字讀音', right:5, total:6 }, ...](可省略) }
  const secs = tTake();
  keyagentUpdateOtherGame(GAME_KEY, prev => {
    const stages = Object.assign({}, prev.stages);
    const s = stages[r.stageId] || {};
    stages[r.stageId] = {
      n: r.stageName || r.stageId,
      bestStars: Math.max(s.bestStars || 0, r.stars || 0),
      bestScore: Math.max(s.bestScore || 0, r.score || 0),
      plays: (s.plays || 0) + 1,
      totalSecs: (s.totalSecs || 0) + secs,
      totalQ: (s.totalQ || 0) + (r.total || 0),
      totalOk: (s.totalOk || 0) + (r.right || 0)
    };
    const q = Object.assign({}, prev.q);
    (r.types || []).forEach(t => {
      const k = r.stageId + ':' + t.key, o = q[k] || { n: 0, ok: 0 };
      q[k] = { n: o.n + (t.total || 0), ok: o.ok + (t.right || 0), label: t.label || t.key };
    });
    return {
      nick: r.nick || prev.nick || '',
      totalPlays: (prev.totalPlays || 0) + 1,
      bestScore: Math.max(prev.bestScore || 0, r.score || 0),
      totalSecs: (prev.totalSecs || 0) + secs,
      totalQ: (prev.totalQ || 0) + (r.total || 0),
      totalOk: (prev.totalOk || 0) + (r.right || 0),
      lastScore: r.score || 0, lastId: r.stageId, lastName: r.stageName || r.stageId, lastAt: Date.now(),
      stages, q
    };
  });
}
keyagentInstallPageHideSync();           // 4) 離開頁面時補寄一次
/* ========== 以上整段不用改 ========== */
</script>
```

> 這段程式裡的 `keyagentGetActiveStudentNumber`、`keyagentUpdateOtherGame`、`keyagentInstallPageHideSync` 都來自 `sync-client.js`，**不要自己重寫**。

---

## 5. 在你的遊戲裡怎麼用

只需要在遊戲的三個地方各加一行：

```js
// ① 遊戲一開始：沒有學號就先問，問完才開始
ensureStudent(() => { startMyGame(); });

// ② 每一局（或每一關）開始時：
tStart();

// ③ 每一局結束時，把結果傳進去：
finishRound({
  stageId: 'L1',                 // 關卡代碼（同一關永遠用同一個代碼）
  stageName: '第一課 認字',        // 關卡中文名稱（老師的表格欄位名稱就是它）
  score: 80,                     // 這一局的分數
  right: 8, total: 10,           // 這一局答對 8 題、共 10 題
  stars: 2,                      // （可省略）幾顆星
  types: [                       // （可省略）每種題型各答幾題、答對幾題
    { key: 'read',  label: '看字讀音', right: 5, total: 6 },
    { key: 'write', label: '寫字',     right: 3, total: 4 }
  ]
});
tStart();                        // 如果馬上開始下一局
```

### 什麼時候算「一局」

- **玩完、拿到結果**才呼叫 `finishRound`。中途關掉、按返回，都**不要**呼叫，這一局就不會算（練習時間和次數都不算）。
- 沒有「題目答對率」概念的遊戲（例如純計分的遊戲）：`right`、`total` 填 0 即可，後台就不會顯示答對率。
- 沒有「關卡」概念的遊戲：`stageId` 固定填 `'main'`、`stageName` 填遊戲名稱，也可以。
- **答對率要看的是「作答的每一題」**，所以 `total` 請放「這一局作答的題數」，`right` 放「答對的題數」，不要放分數。

---

## 6. 驗收清單（做完請逐項確認）

1. [ ] 遊戲一開始，**沒有學號就不能玩**，輸入格式不對（例如只有 1 個字）會再問一次。
2. [ ] 玩完一局，在瀏覽器 F12 → Application → Local Storage 看得到 `keyagent_other_v1:你的學號`，裡面有你的遊戲代號和 `totalPlays`、`stages`。
3. [ ] 同一關玩兩次，`plays` 變 2，`totalQ`、`totalOk` 是兩局加起來的。
4. [ ] 玩到一半直接關掉分頁，`totalPlays` **沒有**增加。
5. [ ] 切到別的分頁 10 秒再回來，`totalSecs` 沒有把那 10 秒算進去。
6. [ ] 玩完一局後等 10 秒，請老師看 Google 試算表的 `sync_queue`，多一列，B 欄是你的學號，C 欄找得到 `"other":{"你的遊戲代號":{...`。
7. [ ] 沒有改 `sync-client.js`，裡面的網址還是老師原本給的。
8. [ ] 資料裡**沒有**真名、電話、住址、生日。

### 沒成功的話

| 症狀 | 可能原因 |
|---|---|
| 主控台紅字 `keyagentUpdateOtherGame is not defined` | `sync-client.js` 沒載入，路徑不對 |
| 試算表沒有新的一列 | 沒輸入學號；網路不通；老師的接收網址還沒設定好 |
| 有新的一列，但沒有你的遊戲代號 | `GAME_KEY` 寫錯，或代號含有大寫／空白／中文 |
| 紀錄一直被舊的蓋掉 | 累積欄位的名字沒用 `total…`／`best…` 開頭 |
| 後台的關卡欄位是代碼而不是中文 | `stageName`（也就是 `n`）沒有傳 |

---

## 7. 製作人自己也能看到你的遊戲

可以。老師會給你一組**「只能看你這款遊戲」的密碼**，你打開老師的通用後台：

`https://zeke2862.github.io/elearning/game-report.html`

填入老師給你的「接收網址」和「密碼」，就會看到玩你遊戲的同學（顯示學號、遊戲內名稱、次數、答對率、練習時間、題型弱點）。

- 這組密碼**只看得到你的遊戲**，看不到別人的遊戲。
- 你看到的是**學號**，看不到真名（真名名單只在老師電腦上）。請不要私下去問同學的成績或公開貼出他們的學號。
- **密碼不要貼到任何公開的地方**（GitHub、聊天群組、你的遊戲程式碼裡）。

---

## 8. 規則（一定要遵守）

1. **只記學號和遊戲成績。** 不要記真名、電話、住址、生日、照片、定位。
2. **學號要輸入自己的。** 輸入別人的學號，老師看到的就會是別人的紀錄。
3. **不要改 `sync-client.js`**，也不要換掉裡面的網址。它是大家共用的，改壞了所有遊戲都送不出去。
4. **不要把任何密碼寫進你的遊戲程式。** 你的遊戲不需要密碼。
5. **不要自己去讀老師的試算表。** 要看資料，用第 7 節的方式。
6. 資料只存在玩家的瀏覽器和老師的試算表。玩家清除瀏覽器資料，那台裝置上的紀錄會歸零（已經寄出的不會消失）。
