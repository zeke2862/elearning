# JB2 Google 登入・雲端存檔：設定說明（老師／資訊老師操作）

程式與資料庫都已經做好了（Supabase 專案 `math`、資料表 `jb2_cloud_saves`）。
**只差 Google 授權這一步**；做完後把 `math/JB2/jb2-cloud.js` 最上面的 `var ENABLED = false;` 改成 `true`，上傳，學生才會看到「☁️ 雲端」按鈕和登入提醒。
（沒設定好之前不要開，不然學生按了登入會失敗。）

## 步驟 1：在 Google Cloud 建立登入設定（約 10 分鐘）
1. 打開 https://console.cloud.google.com ，用您的 Google 帳號登入，建立一個專案（名稱隨意，例如 jb2-login）。
2. 左邊選單「API 和服務」→「OAuth 同意畫面」→ 使用者類型選「外部」→ 填應用程式名稱（例：數靈召喚師）、您的 Email → 儲存。
   - 發布狀態請按「發布應用程式」（不然只有您指定的測試帳號能登入）。只要求基本資料（email、名稱），不需要 Google 審查。
3. 「API 和服務」→「憑證」→「建立憑證」→「OAuth 用戶端 ID」→ 類型選「網頁應用程式」。
4. 「已授權的重新導向 URI」填：
   `https://qkejjznejmxcfiyxviid.supabase.co/auth/v1/callback`
5. 建立後會得到「用戶端 ID」和「用戶端密鑰」，先留著。

## 步驟 2：在 Supabase 開啟 Google 登入
1. 打開 https://supabase.com/dashboard ，進入專案 `math`。
2. 左邊「Authentication」→「Sign In / Providers」→ 找到 Google → 開啟，貼上剛才的「用戶端 ID」與「用戶端密鑰」→ 儲存。
3. 「Authentication」→「URL Configuration」：
   - Site URL：填 JB2 遊戲網站的網址（例如 `https://您的網站/`）。
   - Redirect URLs：新增 `https://您的網站/**`（讓登入完成後可以回到遊戲頁面）。
4. （建議）同一頁把「Allow new users to sign up」保持開啟；「Confirm email」不需要。

## 步驟 3：打開功能
把 `math/JB2/jb2-cloud.js` 的 `var ENABLED = false;` 改成 `var ENABLED = true;`，上傳網站，請學生按 Ctrl+F5。

## 老師日常管理（Supabase 後台 → SQL Editor）
- 看誰綁了哪個學號：
  `select s.student_no, u.email, s.stars, s.updated_at, s.flags from jb2_cloud_saves s join auth.users u on u.id = s.user_id order by s.updated_at desc;`
- 學號綁錯／被別人冒用，解除綁定：`delete from jb2_cloud_saves where student_no = '學號';`
- 回復上一版存檔：`update jb2_cloud_saves set data = prev, updated_at = now() where student_no = '學號' and prev is not null;`
- `flags` 欄位有記錄＝這個帳號曾送出「不正常的進度」被雲端擋下。

## 防竄改怎麼運作（給老師看）
- 學生端不能直接改資料表，只能呼叫雲端函式 `jb2_cloud_save`；函式會檢查格式、星數上限、經驗上限、數靈幣範圍，
  以及「兩次存檔之間不可能增加那麼多」（星數、收入的速率上限），可疑的直接拒絕並記在 `flags`。
- 一個 Google 帳號只能綁一個學號、一個學號只能被一個帳號綁。
- 載入雲端存檔到電腦時，還會再通過遊戲內 `jb2-seal.js` 的檢查才寫入。
- 老實說的限制：第一次上傳時無法判斷進度是真是假（只能擋「不可能」的數字）；學號是學生自己輸入的，
  所以如果有人搶先用別人的學號綁定，需要老師用上面的 SQL 解除。

## 不登入的學生
完全不受影響，照常用「存檔碼／匯出檔」備份。
