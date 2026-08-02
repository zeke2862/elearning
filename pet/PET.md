# PET.md — 心靈戰寵（Mind Battle Pets）核心資料

這份文件記錄「寵物養成區」目前的完整規格，給 Eric 之後回來調整、
或交接給別人接手時查閱用。日期：這份文件對應的是目前已交付的版本
（蛋孵化機制＋手動餵食遞增費用＋index.html 精簡化 這幾次修改之後）。

---

## 一、系統在哪裡、怎麼串起來的

```
（網站根目錄）
├── index.html                 ← 學生登入後的選單首頁
└── pet/                        ← 寵物系統全部收在這裡
    ├── pet-catalog-data.js     ← 純資料：10屬性×2性別×5支線＝100隻圖鑑
    ├── pet-engine.js           ← 核心邏輯：演化規則＋存檔讀寫＋經濟系統
    ├── pet-view.html           ← 唯一的功能頁面（開蛋/餵食/復活/封存/殿堂）
    ├── pet-demo-1-egg.png      ┐
    ├── pet-demo-2-baby.png     │ 開蛋前的「示範進化模組」4張參考圖
    ├── pet-demo-3-mature.png   │ （以「數理」屬性示範蛋→黑白→彩色→究極體）
    ├── pet-demo-4-ultimate.png ┘
    └── thumbs/                 ← 正式縮圖放這裡，檔名＝圖鑑編號.png（目前是空的）
```

**index.html 現在只是入口**：選單上只有一小條「🥚 寵物養成區 GBit：123 ›」，
點下去才會帶著 `?student=<學號>` 跳到 `pet/pet-view.html`。開蛋、餵食、
復活、封存、英雄殿堂——所有互動都在 `pet-view.html` 這一頁完成。

**存檔位置**：跟塔防遊戲、ETP、看打共用同一份 localStorage 存檔
`keyagent_save_v1:<學號>`，寵物資料存在這份存檔裡新增的 `pet` 欄位下，
GBit 收支也是直接讀寫這份存檔的 `gbit` / `gbitEarnedLifetime` /
`gbitSpentLifetime`，不是另外開一套帳號系統。

---

## 二、存檔資料結構（`save.pet`）

```js
save.pet = {
  active: null | {
    id: "INST_<時間戳>_<亂數>",   // 這隻寵物實例的唯一 id
    studentId: "<學號>",
    petDefId: "PET_037",          // 對應圖鑑（pet-catalog-data.js）裡的固定編號
    name: "數理雄性幼體 3號",      // 建立當下的名字（顯示時其實是動態算出來的，見下方）
    category: "MATH",             // 10 大屬性其中之一
    gender: "MALE" | "FEMALE",
    feedCount: 0,                 // 累積餵養次數，決定演化階段
    lastActive: 1784980710290,    // 上次被餵食的時間戳，決定生存衰減狀態
    isArchived: false,
    unlockedBookItem: false       // 餵養次數 ≥400 時變 true
  },
  hallOfFame: [ { semester, petId, petName, category, gender,
                  finalFeedCount, finalStage, archivedAt } , ... ],
  lastFeedSyncGbit: 0,            // 上次「自動餵食換算」用到的 gbitEarnedLifetime 基準值
  manualFeedStreak: 0             // 連續手動餵食次數（沒被自動餵食打斷的計數）
}
```

同時間**只能有一隻 `active` 寵物**。要開新蛋必須先封存目前這隻
（`petArchiveActive`），封存後的紀錄進 `hallOfFame`，不能復原。

---

## 三、演化階段與門檻

寵物的「長相」完全由 `feedCount`（累積餵養次數）決定，不需要另外記錄
階段欄位，隨時用 `MindPetEngine.getVisualStage(feedCount)` 現算：

| 餵養次數 | 階段代號 | 中文顯示 | 視覺效果 |
|---|---|---|---|
| 0 ～ 49 | `EGG` | 尚未孵化（蛋） | 顯示 🥚，**看不到抽到的寵物長相**（連自己都不知道，孵化前是個驚喜） |
| 50 ～ 99 | `STAGE_0_BW` | 黑白水墨 | 縮圖套灰階+對比濾鏡 |
| 100 ～ 149 | `STAGE_0_VIBRANT` | 繽紛原色 | 縮圖套飽和度濾鏡（正常上色） |
| 150 ～ 249 | `STAGE_1_MATURE` | 成熟體（第一次進化） | 金色光暈特效開始 |
| 250 ～ 399 | `STAGE_2_ULTIMATE` | 究極體（第二次進化） | 金色光暈＋右下角疊 👑 徽章 |
| 400 以上 | `STAGE_2_WITH_BOOK` | 究極體・智慧奧義 | 同究極體，另外解鎖「智慧奧義之書」道具徽章 |

**孵化（50 次）是這個系統唯一的「隱藏名字」時間點**：0～49 次時，無論
畫面上的名稱、屬性、性別欄位，一律顯示「神秘的蛋」，不會提前洩漏學生
抽到的是哪一隻──`petDisplayName()` 這個函式統一處理這件事，所有畫面
（大畫面、英雄殿堂）都共用它，不用個別頁面各自判斷。

**寵物名字會隨階段自動換稱號**（不用手動改）：
- 50～149 次：圖鑑的 `stage0Name`（例如「數理雄性幼體 3號」）
- 150～249 次：圖鑑的 `stage1Name`（例如「數理重裝戰神 3號」）
- 250 次以上：圖鑑的 `stage2Name`（例如「數理霸王帝君 3號」）

---

## 四、生存衰減機制（跟餵養次數無關，是另一條時間軸）

依「上次被餵食到現在過了多久」判斷，跟演化階段是兩件事：

| 距離上次餵食 | 狀態 | 說明 |
|---|---|---|
| 0～72 小時 | `HEALTHY` 健康活力 | 正常 |
| 72～144 小時 | `DRIED` 乾巴巴 | 尚可繼續餵食 |
| 144～216 小時 | `SHRUNK` 變小變餓 | 尚可繼續餵食 |
| 216 小時以上（9天） | `PETRIFIED` 石化假死 | **無法餵食**，必須先用重燃魔藥復活 |

---

## 五、經濟參數（都在 `pet-engine.js` 最上面，改數字不用動其他邏輯）

| 常數 | 目前數值 | 說明 |
|---|---|---|
| `PET_EGG_COST_GBIT` | 50 | 開一顆蛋的花費 |
| `PET_MANUAL_FEED_COST_GBIT` | 10 | 手動餵食「第一次」的花費 |
| `PET_MANUAL_FEED_STREAK_MULTIPLIER` | 5 | 連續手動餵食每次費用倍率 |
| `PET_REVIVE_COST_GBIT` | 30 | 重燃魔藥（復活）花費 |
| `PET_GBIT_PER_AUTO_FEED` | 1 | 練習賺多少 GBit，自動餵食就跟著加多少次（1:1） |

### 手動餵食的「連續加價」規則

只要中間沒有靠練習賺到 GBit（沒有觸發過自動餵食），連續手動餵食會越來
越貴：第 1 次 10 GBit、第 2 次 50、第 3 次 250、第 4 次 1250……
（10 × 5ⁿ，n 是這波連續次數，從 0 起算）。

**只要學生實際去練習賺到 GBit**（`petSyncAutoFeed` 判定確實有換算出
新的自動餵食次數），這個倍率就會**重置回原價**。開新蛋、封存寵物時也
會重置。這是用來避免學生把存的 GBit 一次全部拿去手動催熟，鼓勵細水
長流地練習，而不是一次性課金衝等。

計算費用的函式：`petNextManualFeedCost(save)`，回傳「下一次」手動餵食
要花多少 GBit，UI 上的按鈕文字跟是否要 disable 都靠這個函式判斷。

---

## 六、圖鑑資料（`pet-catalog-data.js`）

- **10 大屬性**：數理・虛擬天機、語文・萬卷詩篇、自然・元素泰坦、
  美學・幻彩星海、體能・狂暴極速、社群・皇家騎士、專注・深海心流、
  創客・賽博核心、歷史・時空帝王、勇氣・不滅狂鳳。
- **每屬性 × 2 性別 × 5 支線 = 100 隻**，編號 `PET_001` ～ `PET_100`。
- 完整「編號/屬性/性別/幼體·成熟體·究極體稱號」對照表在另一份文件
  `pet-thumbnail-upload-guide.md` 裡（自動從程式資料產生，保證跟遊戲
  實際顯示一致）。

### 縮圖掛載慣例

- 檔名固定用圖鑑編號：`pet/thumbs/PET_037.png`。
- 一隻寵物只需要 1 張圖，孵化後（50 次起）的所有階段共用同一張，靠
  CSS 濾鏡表現黑白→上色→金色光暈的差異，不用畫多張。
- 縮圖還沒上傳時，畫面自動退回顯示該屬性的 emoji 圖示（`petCategoryMeta`
  裡的 `icon` 欄位），不會破圖，可以想到哪隻畫哪隻慢慢補。
- 負責掛載的函式：`petThumbUrl(petDefId, basePath)` 組網址、
  `petRenderAvatarInto(容器, petDefId, basePath, 備用emoji)` 負責畫進畫面
  並處理 onerror 退回機制。

### 已知未確認事項

`pet-demo-1-egg.png` ～ `pet-demo-4-ultimate.png` 這 4 張示範圖的
「蛋→黑白→彩色→究極體」對應順序，是我依照檔案產生時間**推測**排的，
**還沒請 Eric 實際確認過**。如果打開 `pet-view.html`（尚未開蛋時）看到
示範圖順序不對，直接把 4 個檔名互相對調重新命名即可修正，不用改程式碼。

---

## 七、常用函式速查表

**`pet-engine.js`（核心邏輯＋存檔）：**

| 函式 | 用途 |
|---|---|
| `MindPetEngine.createPet(studentId, category, gender)` | 從圖鑑隨機指派一隻新寵物 |
| `MindPetEngine.getHealthStatus(pet, now?)` | 算生存衰減狀態 |
| `MindPetEngine.getVisualStage(feedCount)` | 算目前演化階段 |
| `MindPetEngine.feed(pet, times?, now?)` | 直接對 pet 物件 +N 次餵養（石化時會拒絕） |
| `MindPetEngine.revive(pet, now?)` | 解除石化 |
| `MindPetEngine.archiveSemester(pet, semesterName)` | 封存進英雄殿堂，回傳存檔用的 record |
| `petDisplayName(pet)` | 依目前階段回傳該顯示的名字（蛋階段回傳「神秘的蛋」） |
| `petLoadSave(studentNumber)` | 讀存檔，順便補齊所有缺欄位的預設值 |
| `petPersistSave(studentNumber, save)` | 寫回存檔 |
| `petSyncAutoFeed(save)` | 把「賺到的 GBit」換算成自動餵食次數，並重置手動餵食連續加價 |
| `petSpendGbit(save, amount)` | 扣 GBit（餘額不夠回傳 false，不會扣成負的） |
| `petBuyEgg(save, studentId, category, gender)` | 開蛋（已有寵物在養會擋掉） |
| `petNextManualFeedCost(save)` | 算下一次手動餵食要花多少 GBit |
| `petManualFeed(save)` | 手動餵食一次（含扣款、連續加價計數） |
| `petRevive(save)` | 用 GBit 買重燃魔藥並立即使用 |
| `petArchiveActive(save, semesterName)` | 封存目前寵物，清空 active |

**`pet-catalog-data.js`（圖鑑資料＋縮圖）：**

| 函式 | 用途 |
|---|---|
| `petCategoryMeta(catId)` | 查某屬性的中文名稱／稱號／icon／代表色 |
| `petThumbUrl(petDefId, basePath)` | 組縮圖網址 |
| `petRenderAvatarInto(容器, petDefId, basePath, 備用emoji)` | 把縮圖畫進畫面（含 onerror 退回機制） |

---

## 八、之後可能會想再調整的地方

- **示範圖順序**：見上方「已知未確認事項」，需要 Eric 打開頁面確認一次。
- **縮圖是否會被學生提前看到**：目前是純靜態網站，技術上會開發者工具
  的學生看得到全部 100 隻的資料（細節跟三種因應方案寫在
  `pet-thumbnail-upload-guide.md` 第五段），目前沒有特別防護。
- **手動餵食遞增倍率（目前 ×5）／起跳價（目前 10 GBit）**：如果實測後
  覺得太貴或太便宜，改 `PET_MANUAL_FEED_COST_GBIT` /
  `PET_MANUAL_FEED_STREAK_MULTIPLIER` 這兩個數字就好。
- **重燃魔藥花費（目前 30 GBit）／開蛋花費（目前 50 GBit）**：同樣是
  改常數就好，不用動邏輯。
