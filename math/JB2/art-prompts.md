# 美術提示詞（水彩）— 國一下 數靈召喚師

> 規則：全水彩、角色/物件白邊、**圖上不要有任何文字**、檔名英文小寫。Canva 目前只確認能做版面與匯入匯出，**不保證能生成水彩原畫**；建議流程：把下面英文提示詞貼到你慣用的繪圖工具生成 → 存成指定檔名放進指定資料夾 → 遊戲自動套用（沒圖時自動用向量備用圖，不會壞）。

## 1. 大地圖  `images/map/world-map.jpg`（2900×1000，橫向長卷）

**Prompt:**
```
A wide panoramic fantasy world map in soft watercolor storybook style, aspect ratio 2.9:1, seen from a gentle bird's-eye view. A calm blue sea surrounds seven islands arranged left to right in a gentle zigzag: a small flower-filled starter village island on the far left, then a lush green forest island, a sandy desert-plateau island with tiny crystal spires, a blue lake island with a little waterfall, a grassy hill island with a winding stream, an autumn-orange meadow island, and a snowy mountain island with crystal formations on the far right. A winding sandy path connects the islands through small stone bridges. Warm paper texture, light wash edges, soft shadows, no characters, absolutely no text, no letters, no numbers, no labels, no UI.
```

### 節點位置表（遊戲用百分比定位，圖要大致對上）

| 節點 | x% | y% | 說明 |
|---|---|---|---|
| 起始村莊 | 8.62 | 65 | 左側小島，要留出小屋/鬥技場/商店三棟建築的空地 |
| 第1章 方程森林 | 23.45 | 33 | 約 14% 寬的島 |
| 第2章 坐標荒漠 | 38.62 | 69 | 約 14% 寬的島 |
| 第3章 比例湖域 | 53.79 | 32 | 約 14% 寬的島 |
| 第4章 不等式火山 | 68.97 | 69 | 約 14% 寬的島 |
| 第5章 統計平原 | 82.76 | 33 | 約 14% 寬的島 |
| 第6章 幾何天空城 | 91.38 | 69 | 約 14% 寬的島 |

路徑會由遊戲依節點自動畫勇者走過；圖裡的小路只要大致串起這些點即可。

## 2. 小屋牆紙  `images/home/wallpaper.jpg`（1600×1000，比例 16:10）

**Prompt:**
```
Cozy empty wizard-apprentice cottage room interior in soft watercolor style, front view, warm wooden plank floor occupying the lower 38 percent of the image (floor line at about 62 percent from top), cream plaster wall above with wooden beams, a blank window frame area on the upper left, a lit lantern glow, completely EMPTY room: no furniture, no characters, no rug, no text, no letters.
```

## 3. 村莊建築圖示（透明背景 PNG，白色外框，約 512×512）

| 檔名 | 內容 |
|---|---|
| `images/map/bld-home.png` | 我的小屋 🏠 的水彩小建築，白色外框，無文字 |
| `images/map/bld-arena.png` | 鬥技場 🏟️ 的水彩小建築，白色外框，無文字 |
| `images/map/bld-shop.png` | 商店 🏪 的水彩小建築，白色外框，無文字 |

共同 prompt 前綴：`Single watercolor game icon, thick white outline, transparent background, centered, no text. Subject: ...`

## 4. 小屋互動物件（透明 PNG，白邊，無字）

| 檔名 | 內容 |
|---|---|
| `images/home/trophy.png` | 怪物圖鑑牆 🏆 |
| `images/home/closet.png` | 衣櫃 🧥 |
| `images/home/bed.png` | 簽到・任務 🛏️ |
| `images/home/desk.png` | 我的資料 🖥️ |
| `images/home/catnest.png` | 智慧貓 🐱 |
| `images/home/safe.png` | 備份・存檔碼 📦 |
| `images/home/furn_rug.png` | 家具 rug |
| `images/home/furn_fish.png` | 家具 🐠 |
| `images/home/furn_shelf.png` | 家具 📚 |

## 5. 商店商品圖示（透明 PNG，白邊，無字，約 256×256）

| 檔名 | 商品 | 分類 |
|---|---|---|
| `images/shop/cloak_blue.png` | 初心藍袍 | cloak |
| `images/shop/cloak_red.png` | 烈焰紅袍 | cloak |
| `images/shop/cloak_green.png` | 翡翠綠袍 | cloak |
| `images/shop/cloak_purple.png` | 暮光紫袍 | cloak |
| `images/shop/cloak_gold.png` | 黃金披風 | cloak |
| `images/shop/hat_none.png` | 不戴帽子 | hat |
| `images/shop/hat_apprentice.png` | 學徒尖帽 | hat |
| `images/shop/hat_star.png` | 星辰法帽 | hat |
| `images/shop/hat_crown.png` | 數學王冠 | hat |
| `images/shop/staff_wood.png` | 橡木杖 | staff |
| `images/shop/staff_crystal.png` | 水晶杖 | staff |
| `images/shop/staff_rainbow.png` | 彩虹杖 | staff |
| `images/shop/pet_slime.png` | 史萊姆 | pet |
| `images/shop/pet_fox.png` | 比例小狐 | pet |
| `images/shop/pet_cat.png` | 智慧貓寶寶 | pet |
| `images/shop/pet_dragon.png` | 迷你小龍 | pet |
| `images/shop/furn_rug.png` | 魔法地毯 | furn |
| `images/shop/furn_shelf.png` | 魔法書櫃 | furn |
| `images/shop/furn_fish.png` | 水族箱 | furn |
| `images/shop/furn_stars.png` | 星空天花板 | furn |
| `images/shop/title_1.png` | 方程小學徒 | title |
| `images/shop/title_2.png` | 坐標探險家 | title |
| `images/shop/title_3.png` | 不等式裁決者 | title |
| `images/shop/title_4.png` | 數理大陸傳奇 | title |
| `images/shop/boost.png` | 雙倍券 | special |
| `images/shop/rename.png` | 改名卡 | special |

## 6. 放置與驗收
- 圖放在遊戲根目錄對應的 `images/...` 資料夾；沒放的會自動使用向量/表情符號備用圖。
- 驗收：圖上無文字、白邊乾淨、水彩風一致、手機縮小後仍看得出是什麼。
- 狀態：**待實測**（圖還沒生成，目前交付的是向量備用版）。

## 7. 更新（2026-10-19）
- 已改用 Canva 生成，成果與缺少項目見 `canva-images.md`。
- 新增商品「治療用品」：heal_s（粉紅小藥水）、heal_l（金色大藥水）、revive（發光白色鳳凰羽毛）— 沿用上面共同 prompt 前綴。
- 勇者圖：images/hero/<披風ID>.png（cloak_blue/red/green/purple/gold），直立全身、白邊、2:3。

## 8. 六角形大地圖（2026-10-19 改版）
尺寸比例 5:4（遊戲內 2000×1600）。村莊在正中央，六座島在上、右上、右下、下、左下、左上，順時針是第 1～6 章。
Prompt:
```
A fantasy world map in soft watercolor storybook style, bird's-eye view, calm blue sea. Exactly seven islands in a hexagonal flower layout: one slightly larger flower-filled starter village island in the exact center, surrounded by six islands evenly spaced like the corners of a hexagon — top: lush green forest; upper right: sandy desert plateau with crystal spires; lower right: blue lake with a small waterfall; bottom: grassy hills with a winding stream; lower left: autumn-orange meadow; upper left: snowy mountain with glowing crystals. Narrow sea gaps, empty sea margin. No characters, no text, no letters, no numbers, no path lines.
```
