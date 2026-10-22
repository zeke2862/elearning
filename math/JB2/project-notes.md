# project-notes — 國一下 數靈召喚師（JB2）地圖遊戲化
更新：2026-10-19｜設定檔版本 v1.0

## 拍板紀錄
- 貨幣：數靈幣 💰（全遊戲只有一種）。每日基準收入 200（程式模擬：輕度≈76／一般≈202／認真≈370 每日曆天）。
- 價格 = 每日基準收入 × 天數係數（消耗品 0.1–0.5、小物 1–3、大物 7–15、終局約 30），並有購買條件（總星數／某章星數）。
- 學生畫面只有「學號＋勇者名」；勇者名第一次免費，之後要改名卡。
- 模式字樣：教學／挑戰／極限（總地圖本身不出現其他說法）。
- 唯一編輯器：config-editor.html＋game-config.js（教師用，不上傳）。教師版地圖另存、不上傳。
- 存檔碼（JB2-…）＋JSON 匯出入。

## 特例／與通用規則的差異
- 章節地圖與關卡仍沿用原本 24+ 檔，各章獨立存檔；總地圖只讀它們的 localStorage（不改本體）。
- 「回總地圖」按鈕用 add-back-link.js 補丁加入（唯一碰到章節本體的地方，會備份 .bak）。
- 連敗次數：章節遊戲沒有這個資料，報表無法提供。
- 水彩圖尚未生成；目前為向量備用版，圖放入 images/ 後自動套用。

## 待實測
- 雲端載入（放網站後星星是否讀得到；file:// 下各瀏覽器可能不共用存檔）
- 存檔碼還原、Google 試算表收信（report.js + report-apps-script.gs）
- 體驗員（2–3 位真實學生）試玩：**尚未做**，只做了程式與瀏覽器自動測試。

## 待回寫（給「更新總監」）
1. 「總地圖＋既有章節遊戲」這種外掛式地圖化的做法（只讀 localStorage、不改本體）可列入玩法庫。
2. 經濟模擬腳本（以星/經驗增量發幣、每日上限）可列入 部門/20。
3. 水彩圖「圖檔缺席時自動向量備用」的作法可列入 部門/30。

## 遊戲腳本（SKILL 格式）
1. 一句話：學生扮演數靈召喚師，在數理大陸走訪六座島，透過答題收服數靈、練習國一下數學。
2. 目標學生：國一，個人使用。
3. 教材特點：概念型＋計算型。
4. 玩法：地圖探索＋小屋養成＋商店（新）；戰鬥沿用既有章節。
5. 畫面：總地圖／小屋／商店／圖鑑牆／弱點診斷。
6. 流程：點島→勇者走過去→進章節→通關得星→回地圖領幣。
7. 世界觀：數理大陸 Arithema，六章六島。
8. 經濟：數靈幣；見拍板紀錄。
9. 素材：地圖、牆紙、建築、商品圖（見 art-prompts.md）。
10. 問 Eric：水彩圖由誰/用什麼工具產生？

## 分析師修正建議單
| 項目 | 等級 | 理由／改法 |
|---|---|---|
| 水彩圖替換向量 | 必改 | 向量質感不足；用 art-prompts.md 生成 |
| 真實學生試玩 | 必改 | 尚未做；找 2–3 位 |
| 每日獎勵上限是否太鬆 | 建議改 | 以試玩資料調 config 的 expCap |
| 手機直向體驗 | 建議改 | 地圖橫向捲動，直向可再優化 |

## 2026-10-19 追加
- 圖片改用 Canva 生成（非向量），清單見 canva-images.md；Canva 額度用完，寵物／治療道具／紫金披風等圖待額度恢復。
- battle-vol2.html 新增「🤖 AI幽靈」：找不到同學、雲端連不上、同學沒設主力怪時，會詢問是否改打系統幽靈（也可直接按鈕）。幽靈不計入戰績排行；贏了給幣（game-config.js 的 battle.winGold，每天前 3 場）。
- 怪物生命：只有「主力培養怪」有生命值，公式與對戰頁一致（baseHp／growthHp／hpRate 在 game-config.js）。對戰受傷會存到 jb2-hub-v1.mon，總地圖「🩹 隊伍」用商店的小／大治療藥水、復活羽毛恢復；倒下的怪物不能出戰。
- 學號欄位：總地圖與對戰頁的 _who 同時寫 sid 與 no，兩邊互通。
- 已移除：jb2-editor.html（舊編輯器，由 config-editor.html 取代）、teacher_1.html（重複，改用 teacher.html）。
- 待實測：真人學生試玩幽靈難度（ghostLevelOffset、ghostTeamSize）；Supabase 即時對戰沒有在沙盒測（連不到外網），請在學校環境試一場。
- 注意：battle-vol2.html 內含 Supabase 的公開 anon key，這是設計給前端用的，安全性要靠資料表的權限規則（RLS），請確認有開。
- 各章怪物圖：第 1 章齊全；第 2 章只有 4 張；第 3～6 章還沒有（目前顯示表情符號）。
- 教師專用、不要上傳：config-editor.html、world-map-vol2-teacher.html、teacher.html、report-apps-script.gs、素材原圖（不用上傳）資料夾。
- 2026-10-19 地圖改為六角形：起始村莊在正中央，六章島嶼環繞（順時針 1 上、2 右上、3 右下、4 下、5 左下、6 左上）。村莊有放射路通各島，相鄰島有環狀路；從 A 島走到不相鄰的 B 島會先回村莊。地圖尺寸 2000×1600，手機可拖曳捲動。新地圖圖檔 images/map/world-map-hex.jpg（見 canva-images.md），島的位置用 game-config.js 的 island x／y 微調。

## 2026-10-19 追加：小屋編排器
- config-editor.html 新增「🏠 小屋編排器」：拖曳＝移動、右下紅點＝縮放、上方藍點＝旋轉、方向鍵微調，可切電腦16:10／手機4:5。
- game-config.js 的 home 內每個物件（items、furniture、hero、pet）新增 rot（角度）與 z（層次）；pet 新增 {w,h,rot,z}。
- 修改後按「匯出 game-config.js」覆蓋即可，遊戲不用改程式。待實測：手機直向實機排版。

## 2026-10-19 追加：編輯器直接存檔
- config-editor.html 新增「💾 直接存進遊戲資料夾」（Chrome/Edge，第一次選資料夾，寫入後自動讀回驗證）。舊的「匯出」會下載檔案，若檔名變 game-config (1).js 必須改回原名覆蓋，否則重開看不到修改。
- 學生若用網站，需把存好的 game-config.js 上傳覆蓋；學生端若有快取，請按 Ctrl+F5。

## 2026-10-19 追加（三）
- 回上頁按鈕：章節地圖與對戰頁的連結原本是瀏覽器預設藍字，和深藍背景幾乎同色 → 改成 .backlink（銅金底、深色字）；關卡頁的 .btn.ghost 加底色；對戰頁補上 .btn 樣式。
- 小屋：擺設不再顯示文字標籤（只留 aria-label 給讀屏），窗戶只顯示時間（hh:mm），保留右上「出門」按鈕。
- 圖鑑：總地圖「怪物圖鑑牆」點怪物圖 → 詳細頁（大圖、等級、經驗、介紹、各項能力、專屬技能欄）；各章地圖的卡片視窗新增能力值。能力值公式來自 game-config.js 的 battle.statBase／statGrowth／monOtherRate，對戰頁同步改為讀設定。
- 技能重新設計：已發「任務單-怪物技能原創設計.md」給研發組（製作人＋教學設計＋數值經濟）與體驗組。
- 新規則：以後畫圖（Canva）一律先給 Eric「草稿／大概設想」，核可後才生成。

## 2026-10-20 skill system (ch1-6 data-driven, ch1 first to test)
- New game-config.js block `skills`: types (12 effects + 2 ult tiers), defs (31 monsters x 4 + 18 tech), mon, techList, research (baseDays/stepDays), guard, basicNames, learnLv. All editable in config-editor.html.
- battle-vol2.html: old fist/kick/charge/slash + small/mid/large magic REMOVED. New: basic attack + up to 4 skills + guard + swap. Skills read from hub save jb2-hub-v1 `sk`.
- Hub: shop tab "research" (pick monster first; price = (baseDays + stepDays x times researched) x dailyBase, arithmetic), skill manager in team panel, monster detail shows dedicated skills.
- Pending real-play test: balance (Lv20 defence build strong, Lv5 defence weak), mp-heal / mp-drain / ult bonus strength.

## 2026-10-22 小遊戲＋寶箱道具（update19）
- 會議結論（工程師／體驗員／分析師）：放入。條件：題與題之間才彈出、一局決勝、贏了才開寶箱、保留「先不玩」、象棋偏長要可略過、第 1～3 章與第 4～6 章各 5 款且每組至少 2 款短局。
- 抽籤（隨機）：第 1～3 章＝踩地雷、五子棋、跳棋、象棋、黑白棋；第 4～6 章＝六角寶石戰、暗棋、翻牌對對碰、抽鬼牌、圍棋。每次觸發從該組 5 款隨機抽一款＋一種玩法。
- 觸發與解鎖規則不變：每答 10 題或連續答對 5 題（先到先觸發）；同一款贏電腦 3 次 → 首頁「🎮 遊戲區」可直接玩，每款每天 2 回；電腦強度依該款勝場自動調，從最簡單開始；平手重玩（連續平手電腦失誤率 +0.25，上限 0.9）。
- 新增限制：無極限挑戰、重練錯題、最後一題之後，不彈出小遊戲；六角寶石戰不出最大盤（open61）；翻牌只有 4×4。
- 獎勵：小遊戲一局，贏電腦 → 開寶箱（不再有「關卡獎勵」）。寶箱中心品階＝目前模式（教學 1 小／挑戰 2 中／極限 3 大），離中心 0/1/2/3 階機率 90/9/0.7/0.3（%），超出範圍往另一邊；第 4 階＝復活羽毛。每階的道具是補血／補魔隨機。持有已滿 10 個→改發數靈幣（等於商店價）。
- 商品（商店「治療用品」）：小／中／大補血藥水（30%／60%／100%，60／120／200 幣）、小／中／大補魔藥水（30%／60%／100%，60／120／200 幣）、復活羽毛（50% 生命，300 幣）。heal_s、heal_l 的名稱由「小／大治療藥水」改為「小／大補血藥水」，代號沒變，舊存檔不受影響。
- 戰場：戰鬥頁新增「🎒 道具」，用道具會用掉那一次行動；每一方每場最多 3 次（game-config.js battle.itemPerBattle）；補血／補魔可用在場上或後備怪，復活羽毛救這場戰鬥中倒下的怪。補魔只在戰鬥中有用（魔力不會帶回地圖）。
- 道具圖（images/shop/heal_m、mp_s、mp_m、mp_l.png）尚未製作，先用表情符號；畫圖前先給 Eric 草稿。
- 待實測：真實手機觸控；即時（Supabase）對戰中使用道具（沙盒連不到外網，只測了 AI 幽靈對戰）；整局人工玩完 10 款小遊戲；2～3 位學生真機試玩。
