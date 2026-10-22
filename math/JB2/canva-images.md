# Canva 已生成圖片對照表（請下載後改名、放進遊戲資料夾）

做法：點連結 → 在 Canva 右上角「分享 → 下載」存成 PNG／JPG → 依下表改檔名，放進 `images/` 對應資料夾。
遊戲載入時會**自動把白色背景去掉**（需放到網站上才有效；直接用電腦開檔案時瀏覽器會擋，會看到白底方塊）。

| 存成的檔名 | 放哪裡 | 內容 | Canva 連結 |
|---|---|---|---|
| world-map-hex.jpg | images/map/ | 大地圖・六角形版（村莊在中央、六島環繞；舊的橫長版 world-map.jpg 已不用，可刪） | https://www.canva.com/M/MAHYc0dBOAs |
| wallpaper.jpg | images/home/ | 小屋牆紙（空房間） | https://www.canva.com/M/MAHYcQE33Fw |
| bld-home.png | images/map/ | 我的小屋 | https://www.canva.com/M/MAHYcbutDcI |
| bld-arena.png | images/map/ | 鬥技場 | https://www.canva.com/M/MAHYccTK9VA |
| bld-shop.png | images/map/ | 商店 | https://www.canva.com/M/MAHYcV8e8Cc |
| trophy.png | images/home/ | 怪物圖鑑牆 | https://www.canva.com/M/MAHYcdVspa4 |
| closet.png | images/home/ | 衣櫃 | https://www.canva.com/M/MAHYcQSxreY |
| bed.png | images/home/ | 床（簽到） | https://www.canva.com/M/MAHYcVKyKX0 |
| desk.png | images/home/ | 書桌（我的資料） | https://www.canva.com/M/MAHYcSZcDPM |
| catnest.png | images/home/ | 智慧貓窩 | https://www.canva.com/M/MAHYcZIjY2o |
| safe.png | images/home/ | 寶箱（備份） | https://www.canva.com/M/MAHYccoXDCM |
| cloak_blue.png | images/hero/ | 勇者（藍袍） | https://www.canva.com/M/MAHYcUeeybA |
| cloak_red.png | images/hero/ | 勇者（紅袍） | https://www.canva.com/M/MAHYcbW7hQc |
| cloak_green.png | images/hero/ | 勇者（綠袍） | https://www.canva.com/M/MAHYcY4kzLs |

## 還沒生成（Canva 額度用完，額度恢復後再做）
- 勇者：cloak_purple.png、cloak_gold.png（放 images/hero/）
- 寵物：pet_slime／pet_fox／pet_cat／pet_dragon.png（放 images/shop/）
- 治療道具：heal_s／heal_l／revive.png（放 images/shop/）
- 其餘商店小圖（帽子、法杖、家具、稱號）、小屋家具 furn_rug／furn_shelf／furn_fish／furn_stars.png
提示詞都在 art-prompts.md；沒圖的項目會暫時顯示表情符號或簡單備用圖。

## 注意
- 大地圖的島嶼位置是 Canva 自己排的，和遊戲裡的節點座標（game-config.js 的 island x/y）不一定完全對齊。放進去後請看一下，若路線沒對上島，用 config-editor.html 微調各章 x／y（%）即可，不用改程式。

## 六角形地圖的對位
- 村莊在正中央，六章依序順時針：1 森林（上）→ 2 沙漠（右上）→ 3 湖泊（右下）→ 4 丘陵（下）→ 5 秋色草原（左下）→ 6 雪山（左上）。
- 圖裡的島形與遊戲的點擊位置、關卡牌子，是用 game-config.js 的 island x／y（百分比）對齊，我是看縮圖估的，**放進圖後請檢查**：若牌子沒對準島的中心，用 config-editor.html 的「大地圖 → 各章 island」微調 x／y 即可，不用改程式。
