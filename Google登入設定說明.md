# Google 帳號綁定（選用）— 設定說明

## 學生怎麼用
- **不想綁定**：照舊輸入學號當訪客，進度存在這台裝置（沒有任何變化）。
- **想換機子也能接續**：用學號登入後，在選單最上方按「用 Google 登入／綁定」。之後進度會自動備份到自己的 Google 帳號底下；換機子在登入頁按 Google 按鈕就會回到自己的學號和進度。
- 「不是我，換人登入」時會先備份一次，並清掉這台電腦上的 Google 憑證（共用電腦安全）。
- 一個學號只能被一個 Google 帳號綁定（先綁先贏）；綁錯了請老師到試算表「Google帳號」分頁刪掉那一列。

## 老師要做的設定（只做一次）
1. 到 [Google Cloud Console](https://console.cloud.google.com/) → 建立專案 → 「API 和服務」→「憑證」→「建立憑證」→「OAuth 用戶端 ID」，類型選 **網頁應用程式**。
2. 「已授權的 JavaScript 來源」加入網站網址：`https://zeke2862.github.io`（不含路徑）。
3. 複製產生的「用戶端 ID」（長得像 `1234-abc.apps.googleusercontent.com`），兩個地方各貼一次：
   - `sync-client.js` 最下面的 `const GOOGLE_CLIENT_ID = "";`
   - Apps Script →「專案設定 → 指令碼屬性」新增 `GOOGLE_CLIENT_ID`，值相同。
4. 把最新的 `雲端同步-Code.gs` 整份貼進 Apps Script，**重新部署**（部署 → 管理部署作業 → 編輯 → 新版本）。第一次會要求授權「連線到外部服務」，按允許。
5. 沒填 `GOOGLE_CLIENT_ID` 之前，Google 按鈕會自動隱藏，其他功能完全不受影響。

## 注意
- Android App（WebView）常被 Google 擋掉登入，手機 App 版可能無法用，請改用瀏覽器。
- 目前範圍：所有載入 `sync-client.js` 的遊戲（鍵位特工、ETP、看打、末日生存、ZType、同學作品區）。數學 JB1／JB2 等各自存檔的遊戲尚未納入。
- 學號本身仍是「打了就能用」的訪客身分；Google 綁定只是讓進度能帶走，不是用來防冒用。
