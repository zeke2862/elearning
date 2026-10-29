# 國一數學戰略地圖｜勇者分層換裝：統一規格與 Gemini 提示詞（JB1）
版本 v1.0｜2026-10-23｜參考：JB2「分層換裝 SOP」「規格提示詞」兩份文件，針對 JB1 的 7 個軍階與商店裝備重新整理

## 一、先搞懂（小學生也聽得懂）
勇者是一個「紙娃娃」：身體是一張紙，頭、鞋子、鎧甲、盾牌、武器、頭盔各是一張**同樣大小的透明紙**。疊起來就是完整勇者。
- 升軍階 → 只換那幾張紙，不用重畫勇者。
- 買到新帽子或新武器 → 只換那一層。
- 重點只有一個：**每一張紙都一樣大、勇者站的位置都一樣**，疊上去才會剛好對齊。

## 二、圖層與疊放順序（由下往上）
| 層 | 內容 | 檔名（放 `images/hero/`） | 數量 |
|---|---|---|---|
| 1 | 身形（脖子以下的裸體小人，穿基本內衣褲） | `body_base.png` | 1 |
| 2 | 臉型（頭＋臉＋髮型＋脖子上段） | `head_01.png`～`head_04.png` | 4 |
| 3 | 鞋子 | `shoes_t0.png`～`shoes_t6.png` | 7 |
| 4 | 鎧甲（含上衣、褲子、護手、披風以外的所有衣物） | `armor_t0.png`～`armor_t6.png` | 7 |
| 5 | 盾牌（含持盾的手臂） | `shield_t0.png`～`shield_t6.png` | 7 |
| 6 | 武器（含握武器的拳頭） | `weapon_t0.png`～`weapon_t6.png` | 7 |
| 7（最上） | 帽子／頭盔 | `helm_t0.png`～`helm_t6.png` | 7 |

- `t0`～`t6` 對應 7 個軍階：t0 新兵、t1 伍長、t2 校尉、t3 將軍、t4 大元帥、t5 兵仙、t6 代數宗師。
- 共需 1＋4＋7×5＝**40 張**。之後商店新增物品，照同一套規格再畫一張就好（見第八節）。
- 沒有「不戴」的圖：選「不戴」就不疊那一層。
- 之後要加披風、翅膀：背後層放在最底（比身形更下面），規格一樣。

## 三、共同規格（所有圖都一樣）
| 項目 | 規格 |
|---|---|
| 畫布 | **1024×1536 px（直式 2:3）** |
| 背景 | 純白 `#FFFFFF`（遊戲載入時自動去白底）。**物品本身不要用純白**，白色部分請用米白 `#F2EFE6` |
| 白色貼紙外框 | **所有圖層都不要白框**。白框改由程式在「疊好之後」整體加一圈，這樣換任何裝備外框都自動貼合（和 JB2 不同：JB2 只有身體層有白框） |
| 姿勢 | 正面站姿，雙腳與肩同寬，頭在正中。勇者的右手（畫面**左邊**）握拳在腰際、左手（畫面**右邊**）自然下垂 |
| 文字 | 圖上不放任何文字、字母、數字、數學符號（盾牌徽章用抽象幾何圖形） |
| 風格 | 柔和水彩繪本風，線條細而乾淨；不用向量／SVG 手繪 |
| 陰影 | 不要地面影子、不要投影 |

### 位置基準（1024×1536，AI 只能大概，差一點用預覽微調）
| 部位 | 位置 |
|---|---|
| 頭頂最高點 | y≈85 |
| 臉中心 | x≈505、y≈260；頭寬≈270 |
| 脖子 | y≈370～420 |
| 肩膀 | y≈450，寬 x≈330～690 |
| 腰 | y≈800；髖 y≈900 |
| 腳底 | y≈1440；雙腳中心 x≈430、x≈580 |
| 握武器的拳頭（畫面左） | x≈265、y≈600 |
| 武器 | 握把在拳頭，劍尖朝上，劍尖約 (215, 230)；長度可短不可超出畫布 |
| 持盾的手臂（畫面右） | 盾牌中心約 x≈790、y≈700，盾約 300 寬×380 高 |
| 頭盔 | 蓋在頭頂，帽緣約 y≈190～240，寬≈330～360 |

## 四、操作順序（一定要照順序，風格才不會飄）
1. **做「定稿勇者」**：提示詞 A，產一張完整的勇者（穿新兵裝備）。滿意才往下。這張是所有圖的參考圖。
2. **做 `body_base.png`**：提示詞 B，上傳定稿勇者，讓 Gemini 只留「脖子以下的身形」。
3. **做 4 張臉型**：提示詞 C。
4. **鞋子、鎧甲、盾牌、武器、頭盔**：提示詞 D～H，每次都上傳「定稿勇者」當位置參考，**一次一張、同一段對話連續做**。
5. 存成上表檔名。用預覽頁疊起來看有沒有對準，沒對準微調位移與縮放。
6. 小技巧：圖會歪就在提示詞最後加一句 `Match the reference image's canvas, scale and position exactly.`。

## 五、提示詞
### 共用風格段（每個提示詞都含，不用另外貼）
`soft watercolor storybook style, clean thin outlines, gentle shading, no ground shadow, no text, no letters, no numbers, no symbols, pure plain white #FFFFFF background, 1024x1536 portrait canvas`

### A. 定稿勇者（第一張，不用參考圖；若有現有 avatar 圖可附上當風格參考）
```
A young adventurer hero, androgynous friendly child-teen proportions (head about one quarter of body height), standing front view, feet shoulder-width apart, centered on the canvas. Warm light skin tone #F3CDA6, short messy chestnut-brown hair, large friendly eyes. Wearing the beginner outfit: plain cream linen tunic, brown trousers, brown leather belt, simple cloth-wrapped shoes. Right hand (on the left side of the image) is a closed fist at waist height at about x=265,y=600, as if holding an invisible pole. Left hand (on the right side of the image) hangs relaxed. Head top at about y=85, face center about x=505,y=260, feet bottom about y=1440. Full body, soft watercolor storybook style, clean thin outlines, no ground shadow, no text, no letters, no numbers, pure plain white background, 1024x1536 portrait canvas.
```

### B. 身形層 body_base（附定稿勇者）
```
Use the attached character as the exact reference. Redraw ONLY the body from the neck down, with a short neck stub ending at about y=400: bare skin arms and legs, wearing only plain skin-colored short undergarments (no tunic, no trousers, no shoes, no belt). Keep the exact same proportions, skin tone, pose (right fist at about x=265,y=600 at waist height, left hand relaxed) and canvas position as the reference. Do NOT draw the head, hair or face. Do NOT draw any shoes. No outline around the whole figure. Soft watercolor storybook style, no ground shadow, no text, pure plain white background, 1024x1536 portrait canvas.
```
> 備註：若 Gemini 堅持幫勇者穿衣服，改成「mannequin-like neutral body, smooth skin, no clothing details」。

### C. 臉型層 head_01～04（附定稿勇者；每次只換括號）
- head_01 圓臉（預設）：`round soft face, big round friendly eyes, short messy chestnut-brown hair`
- head_02 鵝蛋臉：`oval face, calm almond eyes, neat medium-length black hair with side part`
- head_03 方圓臉：`slightly square determined face, bold eyebrows, spiky short dark-red hair`
- head_04 小尖臉：`small heart-shaped face with pointed chin, bright big eyes, long ponytail of light-blonde hair`
```
Use the attached character as the exact reference for style and position. Draw ONLY the head: a neck (down to about y=420, so it overlaps the body's neck stub), the face, ears and hair. Face type: (在這裡貼上上面的臉型英文). Keep the same skin tone #F3CDA6, same head size (head width about 270 px), head top at about y=85, face center at about x=505,y=260. Do NOT draw any hat, helmet, shoulders, clothing or body below the neck. No outline around the whole figure. Soft watercolor storybook style, no ground shadow, no text, pure plain white background, 1024x1536 portrait canvas.
```

### 七個軍階的裝備描述（D～H 共用，貼進括號）
| 階 | 軍階 | 鎧甲 armor | 頭盔 helm | 武器 weapon | 盾牌 shield | 鞋子 shoes |
|---|---|---|---|---|---|---|
| t0 | 新兵 | plain cream linen tunic, brown trousers, brown leather belt | simple brown cloth headband | wooden practice sword | small round wooden buckler with a leather strap | simple cloth-wrapped shoes |
| t1 | 伍長 | reinforced brown leather jerkin with bronze shoulder studs, leather gloves | brown leather cap with a bronze band | short iron sword with a plain leather grip | small round shield with a bronze rim | sturdy brown leather boots |
| t2 | 校尉 | blue-and-silver officer coat with a chainmail collar and a light steel breastplate | open-face steel helmet with a short blue plume | polished steel longsword with a blue-wrapped grip | kite-shaped steel shield with an abstract blue diamond emblem | steel-capped dark-blue boots |
| t3 | 將軍 | crimson-and-gold plate armor with broad shoulder pauldrons and gold trim | steel helmet with a tall red crest | broadsword with a gold crossguard | large crimson heater shield with gold trim and a gold star emblem | plated crimson boots with gold edges |
| t4 | 大元帥 | black-and-gold ornate full plate armor with dragon-scale pattern and short spikes | black-and-gold horned helm with small golden wings | dragon-guard greatsword with a faint orange glow along the blade | black dragon-scale tower-style shield with a gold dragon-head emblem | black dragon-scale boots with gold claws |
| t5 | 兵仙 | jade-green and white flowing sage-warrior armor, light plates, floating sash, cloud patterns | jade circlet headdress with small floating gems | slim sword with a soft jade glow and a white tassel | round mirror-like shield with a pale jade glow and cloud pattern | white cloud-pattern boots with jade trim |
| t6 | 代數宗師 | deep-violet armor-robe sprinkled with gold stars (abstract dots, no letters) and glowing constellation lines | starry crown-helm with floating gold light shards | sword of pure light made of small floating geometric shards, no symbols | translucent hexagonal crystal shield glowing violet and gold | glowing starlit violet boots |

### D. 鞋子層 shoes_tX（附定稿勇者＋body_base）
```
Use the attached character only as a position reference. On a pure plain white 1024x1536 canvas (same size), draw ONLY a pair of shoes: (貼上表格的 shoes 英文), placed exactly where the boy's feet are in the reference (feet bottom at about y=1440, foot centers at about x=430 and x=580, foot length about 140 px each). Do NOT draw legs, body, trousers or anything else. No outline around the pair, no ground shadow, no text. Soft watercolor storybook style.
```

### E. 鎧甲層 armor_tX
```
Use the attached character only as a position reference. On a pure plain white 1024x1536 canvas (same size), draw ONLY the clothing/armor worn on the torso, arms and legs: (貼上表格的 armor 英文). It must fit exactly over the reference body: shoulders at y about 450, waist about y=800, long sleeves ending at the wrists; the right arm (left side of the image) bent with the fist position left empty at about x=265,y=600; the left arm (right side of the image) hanging down. Leave the head, neck, hands/fists, and feet completely EMPTY (no hair, no face, no shoes, no weapon, no shield). No outline around the whole figure, no ground shadow, no text. Soft watercolor storybook style.
```

### F. 盾牌層 shield_tX（含持盾的手臂）
```
Use the attached character only as a position reference. On a pure plain white 1024x1536 canvas (same size), draw ONLY a shield strapped on the boy's left forearm (the right side of the image): (貼上表格的 shield 英文). Shield center at about x=790,y=700, about 300 px wide and 380 px tall, with a visible leather strap and the small gloved hand gripping its edge. The shield must cover the left arm area so no bare arm shows behind it. Do NOT draw the body, head, other arm, weapon or clothing. No outline, no ground shadow, no text, no letters or numbers on the emblem.
```

### G. 武器層 weapon_tX（含握武器的拳頭）
```
Use the attached character only as a position reference. On a pure plain white 1024x1536 canvas (same size), draw ONLY a weapon: (貼上表格的 weapon 英文), held upright and slightly tilted by a small gloved brown leather fist at exactly x=265,y=600 (the fist is wearing a plain brown leather glove so it works with every armor). The blade tip points up to about (215, 230), the weapon is entirely in the left half of the image and never leaves the canvas. Do NOT draw the body, arm, sleeve, head or anything else. No outline, no ground shadow, no text.
```

### H. 頭盔／帽子層 helm_tX
```
Use the attached character only as a position reference. On a pure plain white 1024x1536 canvas (same size), draw ONLY a head piece: (貼上表格的 helm 英文), sitting exactly where it would sit on the boy's head in the reference (head top at about y=85, head center x about 505, brim or band around y=190 to 240, width about 340 px). The face must stay uncovered. Do NOT draw the boy, face, hair, body or anything else. No outline, no ground shadow, no text.
```

## 六、常見錯誤（避雷）
- 三種以上圖層的畫布大小或位置不一樣 → 疊起來歪掉。永遠用同一張定稿勇者當參考。
- 在圖層裡自己加白框 → 疊起來有白邊。白框由程式統一加。
- 一次要 AI 畫好幾張 → 風格飄掉。一次一張。
- 鎧甲層畫到了手、頭、鞋 → 疊起來會蓋掉其他層。嚴格「只畫那一層」。
- 武器層的拳頭是裸手 → 換鎧甲會顏色不合。統一用棕色皮手套。
- 物品用到純白 → 會被當成背景去掉。白色改米白 `#F2EFE6`。
- 徽章上畫字或數字 → 違反規則，改用抽象幾何圖形。

## 七、檢查表（每張圖存檔前）
- [ ] 1024×1536、純白底、沒有字
- [ ] 沒有白色外框、沒有地面影子
- [ ] 只有該層內容（身形沒頭、鎧甲沒頭手腳、頭盔沒臉……）
- [ ] 位置對照第三節的基準
- [ ] 檔名全是英數、放進 `images/hero/`

## 八、之後新增商店物品（例：新帽子、新武器、新鞋子）
1. 決定它屬於哪一層（頭盔／武器／盾牌／鞋子／鎧甲）。
2. 用同一個提示詞模板，只換括號內的英文描述，並附上「定稿勇者」。
3. 存成 `helm_<名字>.png`、`weapon_<名字>.png`…（英數檔名）。
4. 在商店設定加一筆，指定它屬於哪一層（程式端待做）。
5. 沒圖時，程式自動退回該軍階預設裝備，不會壞。

## 九、接下來程式端要做的事（待您確認圖到位再做）
- 疊圖引擎：依「身形→臉型→鞋→鎧甲→盾→武器→頭盔」順序疊放，合成後統一加白框。
- 軍階升級自動換成對應的 t0～t6 整套；商店買到的物品覆蓋該層。
- 小屋「穿戴」頁、對戰頁、地圖上的勇者都用同一個疊圖引擎。
- 沒畫齊的層退回現有 avatar-0～6 整張圖，所以可以邊畫邊上線。
