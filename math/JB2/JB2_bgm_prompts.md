# 數靈召喚師 JB2｜背景音樂提示詞包 v0.1（2026-10-23）

> 給 Suno／Udio／其他 AI 音樂工具使用。提示詞用英文（AI 比較聽得懂），說明用中文。**這份只是提示詞，遊戲程式目前還沒有播放背景音樂的功能**；音檔做好之後，再由我接進遊戲（會附靜音開關）。

## 一、共通規格（每首都照這個要求）

| 項目 | 規定 |
|---|---|
| 風格 | 奇幻冒險、兒童／青少年友善、明亮、不嚇人 |
| 人聲 | **一律純音樂（instrumental）**，不要歌詞、不要人聲念詞 |
| 長度 | 60–120 秒，要能**無縫循環**（結尾回到開頭），生成時加上 `seamless loop` |
| 音量 | 整體平均音量不要太大，不要突然的爆音（學生會戴耳機／在教室） |
| 檔案 | mp3，128–192 kbps，檔名只能用英文與數字（見下表命名） |
| 答題背景 | 關卡音樂要「不吵、不搶注意力」，節奏穩定、少用高頻尖銳音色，讓學生能專心想題目 |
| 授權 | 請使用付費方案或確認可商用／校內使用的授權；保留生成紀錄 |

### 提示詞通用尾巴（每一首後面都加）
```
instrumental, no vocals, seamless loop, game background music, kid-friendly, warm and clear mix, no harsh high frequencies, no sudden loud hits
```

## 二、介面與場景音樂（5 首）

| 檔名 | 用在哪裡 | 提示詞（英文，貼進 AI） | 感覺 |
|---|---|---|---|
| bgm_map.mp3 | 大地圖（主城＋六座島） | Epic yet cozy fantasy overworld theme, orchestral and acoustic mix, warm strings, harp, soft french horn, gentle drums, sense of a grand adventure map with six mysterious islands, 90 BPM, major key with hopeful melody | 廣闊、期待、想出門冒險 |
| bgm_arena.mp3 | 鬥技場（對戰） | Energetic fantasy arena battle theme, driving taiko and snare, brass fanfare accents, fast string ostinato, friendly competitive spirit, 128 BPM, minor key with heroic chorus-like melody, exciting but not violent | 熱血、競賽感 |
| bgm_shop.mp3 | 商店 | Cheerful whimsical fantasy shop music, pizzicato strings, glockenspiel, light jazzy upright bass, brushed drums, bustling market vibe, playful and cozy, 104 BPM, major key | 輕快、愛逛、有點俏皮 |
| bgm_home.mp3 | 小屋（休息、簽到） | Very calm cozy home lullaby, soft felt piano, gentle music box, warm acoustic guitar, quiet rain or fireplace ambience hint, slow 68 BPM, relaxing and safe, sleepy-friendly | 安心、放鬆、睡前感 |
| bgm_title.mp3 | （選用）登入／開場畫面 | Magical opening theme for a math adventure RPG, sparkling celesta, rising strings, light choir pads, wondrous and inspiring, builds from soft to bright, 96 BPM, major key | 驚奇、啟程 |

每首提示詞最後請接上「通用尾巴」。

## 三、六章關卡音樂（每章 1 首「章節主題」，共 6 首；共用給該章所有一般關卡）

| 檔名 | 章節 | 提示詞 |
|---|---|---|
| bgm_ch1.mp3 | 第1章 方程森林 | Enchanted forest, mossy ruins, glowing runes; curious, gentle, magical forest adventure; featuring bright plucked harp, soft marimba, wooden flute, light hand percussion; D major; 96 BPM; calm steady rhythm that helps concentration while answering questions |
| bgm_ch2.mp3 | 第2章 坐標荒漠 | Ancient desert with floating stone grid pillars, golden sand; mysterious but friendly, caravan journey; featuring oud-like plucked strings, frame drum, soft synth pad, ney flute; D minor / Phrygian touches; 100 BPM; calm steady rhythm that helps concentration while answering questions |
| bgm_ch3.mp3 | 第3章 比例湖域 | Calm crystal lake with floating balance scales, water reflections; serene, balanced, flowing, a little dreamy; featuring glassy piano, harp glissandi, soft strings, light bells; F major; 88 BPM; calm steady rhythm that helps concentration while answering questions |
| bgm_ch4.mp3 | 第4章 不等式火山 | Volcano island, lava rivers, glowing stone gates; heroic and tense but not scary, kid-friendly; featuring low brass swells, taiko-style drums, pizzicato strings, warm synth bass; A minor; 112 BPM; calm steady rhythm that helps concentration while answering questions |
| bgm_ch5.mp3 | 第5章 統計平原 | Wide sunny plains with colorful chart banners and wind; upbeat, cheerful, open-field exploration; featuring acoustic guitar strumming, ukulele, claps, light bass, whistle; G major; 108 BPM; calm steady rhythm that helps concentration while answering questions |
| bgm_ch6.mp3 | 第6章 幾何天空城 | Floating sky city of crystal geometric shapes above clouds; wondrous, bright, high-altitude, futuristic fairytale; featuring airy synth arpeggios, celesta, choir pads, light strings; E major / Lydian; 104 BPM; calm steady rhythm that helps concentration while answering questions |

## 四、六首 Boss 關音樂（每章最後一關；情緒更緊張、更熱血，但仍然友善）

| 檔名 | 關卡 | 提示詞 |
|---|---|---|
| bgm_boss1.mp3 | 1-3-1 | Boss battle version of: Enchanted forest, mossy ruins, glowing runes; bright plucked harp, soft marimba, wooden flute, light hand percussion; intense but friendly, faster tempo (+16 BPM from 96 BPM), big drums, brass or strong lead melody, dramatic build and heroic climax, still loopable |
| bgm_boss2.mp3 | 2-2-3 | Boss battle version of: Ancient desert with floating stone grid pillars, golden sand; oud-like plucked strings, frame drum, soft synth pad, ney flute; intense but friendly, faster tempo (+16 BPM from 100 BPM), big drums, brass or strong lead melody, dramatic build and heroic climax, still loopable |
| bgm_boss3.mp3 | 3-2-3 | Boss battle version of: Calm crystal lake with floating balance scales, water reflections; glassy piano, harp glissandi, soft strings, light bells; intense but friendly, faster tempo (+16 BPM from 88 BPM), big drums, brass or strong lead melody, dramatic build and heroic climax, still loopable |
| bgm_boss4.mp3 | 4-2-3 | Boss battle version of: Volcano island, lava rivers, glowing stone gates; low brass swells, taiko-style drums, pizzicato strings, warm synth bass; intense but friendly, faster tempo (+16 BPM from 112 BPM), big drums, brass or strong lead melody, dramatic build and heroic climax, still loopable |
| bgm_boss5.mp3 | 5-1-3 | Boss battle version of: Wide sunny plains with colorful chart banners and wind; acoustic guitar strumming, ukulele, claps, light bass, whistle; intense but friendly, faster tempo (+16 BPM from 108 BPM), big drums, brass or strong lead melody, dramatic build and heroic climax, still loopable |
| bgm_boss6.mp3 | 6-1-3 | Boss battle version of: Floating sky city of crystal geometric shapes above clouds; airy synth arpeggios, celesta, choir pads, light strings; intense but friendly, faster tempo (+16 BPM from 104 BPM), big drums, brass or strong lead melody, dramatic build and heroic climax, still loopable |

## 五、31 個關卡的「小變化」對照表

如果你想要**每一關都有自己的曲子**（31 首），請用「章節主題提示詞」＋ 下面那一句小變化一起貼進去；如果只想做 6+6 首，這一章節只要挑對應的章節主題與 Boss 曲即可，關卡就沿用。

| 關卡 | 怪物 | 建議檔名 | 小變化（接在章節主題後面） |
|---|---|---|---|
| 1-1-1 | 雙變數蜥蜴 | bgm_1_1_1.mp3 | opening stage, simple melody, relaxed, tutorial feel |
| 1-1-2 | 方程符文犬 | bgm_1_1_2.mp3 | playful dog-like bouncing rhythm, staccato woodwinds |
| 1-1-3 | 組合袋鼠 | bgm_1_1_3.mp3 | hopping kangaroo rhythm, light pizzicato jumps |
| 1-2-1 | 雙生雙頭狼 | bgm_1_2_1.mp3 | two alternating melody lines answering each other like twin wolves, slightly faster |
| 1-2-2 | 替換影法師 | bgm_1_2_2.mp3 | shadowy but cute, sneaky pizzicato, soft mystery |
| 1-2-3 | 抵銷天平獸 | bgm_1_2_3.mp3 | balanced seesaw rhythm, call and response between left and right |
| 1-3-1 | 商業金幣怪 | bgm_1_3_1.mp3 | BOSS: greedy golden coins, jingling bells, brass stabs, bigger drums, exciting but fun |
| 2-1-1 | 軸線雷鷹 | bgm_2_1_1.mp3 | soaring eagle, open wind, long flute lines |
| 2-1-2 | 四象限守護獸 | bgm_2_1_2.mp3 | four-part structure, four repeating motifs, majestic guardians |
| 2-1-3 | 距離星靈 | bgm_2_1_3.mp3 | twinkling star-like bells, shimmering, light walking tempo |
| 2-2-1 | 直線軌跡蛇 | bgm_2_2_1.mp3 | slithering snake, winding melody, subtle shaker |
| 2-2-2 | 水平鉛垂巨像 | bgm_2_2_2.mp3 | two giants, strictly horizontal and vertical rhythm, steady heavy steps |
| 2-2-3 | 交點幾何獸 | bgm_2_2_3.mp3 | BOSS: crossing beams, rising tension, layered rhythms intersecting, epic but playful |
| 3-1-1 | 比值化簡狐 | bgm_3_1_1.mp3 | clever fox, quick light melody, sparkling |
| 3-1-2 | 內外項天秤龍 | bgm_3_1_2.mp3 | dragon scales balancing, majestic slow groove with weighing motif |
| 3-1-3 | 縮放地圖鹿 | bgm_3_1_3.mp3 | gentle deer walking, map-unrolling feel, pastoral |
| 3-2-1 | 正比加速馬 | bgm_3_2_1.mp3 | galloping horse, steady speed-up rhythm, accelerating energy |
| 3-2-2 | 反比平衡水怪 | bgm_3_2_2.mp3 | water monster, deep calm bubbling bass, slow ebb and flow |
| 3-2-3 | 雙向變率獸 | bgm_3_2_3.mp3 | BOSS: two opposite flows (rising and falling) combined, dramatic, big finale feel |
| 4-1-1 | 門檻天平獸 | bgm_4_1_1.mp3 | balance beam heavy and light, weighing groove, firm steps |
| 4-1-2 | 範圍判定蠍 | bgm_4_1_2.mp3 | scorpion creeping, tense plucks, desert-volcano mix |
| 4-1-3 | 數線圓圈光巨龍 | bgm_4_1_3.mp3 | giant dragon on number line, wide cinematic, circles of light |
| 4-2-1 | 變號變向變色龍 | bgm_4_2_1.mp3 | chameleon color-change, melody flips direction, surprising twists |
| 4-2-2 | 移項解鎖獸 | bgm_4_2_2.mp3 | unlocking mechanisms, clicking rhythms, puzzle-box feel |
| 4-2-3 | 限額購物怪 | bgm_4_2_3.mp3 | BOSS: shopping-limit monster, fast busy bazaar rhythm mixed with lava drums, thrilling |
| 5-1-1 | 統計長條怪 | bgm_5_1_1.mp3 | bar charts rising, stepwise ascending bass, bouncy |
| 5-1-2 | 平均權衡獸 | bgm_5_1_2.mp3 | weighing the average, steady swing, friendly |
| 5-1-3 | 中位衆數三頭犬 | bgm_5_1_3.mp3 | BOSS: three-headed dog, three interlocking melodies, energetic chase, big cheerful climax |
| 6-1-1 | 垂直線段精靈 | bgm_6_1_1.mp3 | clean straight lines, minimal precise plucks, calm geometry |
| 6-1-2 | 鏡像對稱蝶 | bgm_6_1_2.mp3 | mirror butterfly, symmetrical melody played forward then reversed, shimmering |
| 6-1-3 | 空間三視幻影怪 | bgm_6_1_3.mp3 | BOSS: 3D illusion ghost, shifting perspective, spiraling arpeggios, grand finale of the game |

## 六、短音效（選用，6 個）

| 檔名 | 用途 | 提示詞 |
|---|---|---|
| sfx_correct.mp3 | 答對 | short bright two-note chime, 0.5 seconds, happy, glassy bell |
| sfx_wrong.mp3 | 答錯（要溫和） | soft low gentle 'bonk' marimba note, 0.5 seconds, not harsh, encouraging |
| sfx_capture.mp3 | 收服成功（目前程式已用合成音） | magical orb capture sound, rising sparkle sweep then triumphant bell arpeggio C-E-G-C, 3 seconds |
| sfx_levelup.mp3 | 升級 | quick ascending harp glissando with sparkle, 1.5 seconds |
| sfx_gift.mp3 | 登入小禮、領獎 | cheerful treasure chest open, coin jingle and soft fanfare, 1.5 seconds |
| sfx_click.mp3 | 按鈕 | tiny soft wooden click, 0.1 seconds |

## 七、做完之後怎麼放進遊戲（update30 起已內建播放器）
**目前狀態**：遊戲已內建音樂播放器，`audio/` 資料夾裡有 18 首**程式合成的簡易佔位曲**（約 30–55 秒、可循環），讓你先聽到整體效果。Suno 做好後，**用同樣的檔名覆蓋 `audio/` 裡的 mp3 就好，不用改程式**。
自動換歌規則：大地圖 `bgm_map`、小屋 `bgm_home`、商店 `bgm_shop`、鬥技場 `bgm_arena`、各章地圖與關卡 `bgm_ch1`~`bgm_ch6`、各章最後一關 `bgm_boss1`~`bgm_boss6`。每一關各自的曲子（`bgm_1_1_1`…）目前**沒有接**，用章節曲；若要接，告訴我。
右下角 🔊／🔇 鍵可靜音（會記住，也會關掉通關音效）。答題畫面（關卡裡面）不放音樂，音樂在章節地圖播放，打開關卡時音量自動降低。

（以下是原本的說明，供參考）

1. 檔案放在遊戲根目錄的 `audio/` 資料夾（英文檔名）。
2. 告訴我「音樂已放好」，我會加一個**統一的音樂播放器**：大地圖、小屋、商店、鬥技場、各章關卡自動換歌；Boss 關自動換 Boss 曲；有靜音／音量按鈕，記住學生的設定。
3. 手機瀏覽器規定「要先點一下畫面才會發聲」，所以第一首會在學生第一次點擊後開始播；這是瀏覽器限制，不是壞掉。
4. 建議答題時音量比地圖小一點（程式會自動壓低），不要影響思考。

## 八、驗收清單（做完請對照）
- [ ] 全部純音樂，沒有人聲
- [ ] 循環接縫沒有爆音或突然停頓
- [ ] 關卡曲聽 10 分鐘不會煩，也不會想睡
- [ ] Boss 曲比一般關卡更有張力，但不嚇人
- [ ] 找 2–3 位學生聽，問「哪首最喜歡、哪首會吵」
