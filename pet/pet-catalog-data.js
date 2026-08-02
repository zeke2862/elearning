// pet-catalog-data.js
// ============ 心靈戰寵：圖鑑資料 ============
// 這支檔案把 catalogData.ts 的內容改寫成不需要 TypeScript / 打包工具、
// 用 <script src="./pet-catalog-data.js"></script> 就能直接在瀏覽器跑的版本。
// 給 index.html 的「寵物養成區」使用，要搭配 pet-engine.js 一起載入。

// 10 大屬性蛋：類別 id -> 中文名稱／稱號／圖示／代表色
// 💡 icon 目前先用 emoji 佔位，日後有正式縮圖美術後，
//    只要在這裡加一個 thumb 欄位（圖片路徑）即可，不用改其他程式。
const PET_CATEGORIES = [
  { id: "MATH",     name: "數理", epithet: "虛擬天機", icon: "🔢", color: "#4fc3ff" },
  { id: "LANGUAGE", name: "語文", epithet: "萬卷詩篇", icon: "📜", color: "#ffd23f" },
  { id: "SCIENCE",  name: "自然", epithet: "元素泰坦", icon: "🌿", color: "#39ff9d" },
  { id: "ART",      name: "美學", epithet: "幻彩星海", icon: "🎨", color: "#ff8a3d" },
  { id: "SPORTS",   name: "體能", epithet: "狂暴極速", icon: "🏃", color: "#ff5c5c" },
  { id: "SOCIAL",   name: "社群", epithet: "皇家騎士", icon: "🤝", color: "#c792ea" },
  { id: "FOCUS",    name: "專注", epithet: "深海心流", icon: "🧘", color: "#4fc3ff" },
  { id: "MAKER",    name: "創客", epithet: "賽博核心", icon: "🛠️", color: "#39ff9d" },
  { id: "HISTORY",  name: "歷史", epithet: "時空帝王", icon: "🏛️", color: "#ffd23f" },
  { id: "COURAGE",  name: "勇氣", epithet: "不滅狂鳳", icon: "🔥", color: "#ff5c5c" }
];

const PET_GENDERS = [
  { id: "MALE",   name: "雄性" },
  { id: "FEMALE", name: "雌性" }
];

// 餵食成功時隨機顯示的讚美語
const PRAISE_DICTIONARY = [
  "這種難度也能輕鬆拿下？你的專注能量正在暴增！",
  "自律就是最強的武器，今天身上的金色光芒又更亮了！",
  "這不是運氣，是你一步步積累出來的實力，做得好！",
  "讚！戰力持續飆升中，距離『智慧奧義之書』又近了一步！",
  "有你這樣的搭檔，我們隨時都能突破極限！",
  "你的持之以恆，正在將平凡鍛造成奇蹟！"
];

// 圖鑑生成：10 類別 × 2 性別 × 5 支線 = 100 種不重複寵物定義
// 對應 catalogData.ts 的自動建構迴圈，只是把 enum 換成上面的中文類別資料。
const PET_CATALOG = {};
(function buildCatalog() {
  let count = 1;
  PET_CATEGORIES.forEach((cat) => {
    PET_GENDERS.forEach((g) => {
      for (let i = 1; i <= 5; i++) {
        const id = "PET_" + String(count).padStart(3, "0");
        const genderLabel = g.id === "MALE" ? "雄性" : "雌性";
        const title1 = g.id === "MALE" ? "重裝戰神" : "星脈女武神";
        const title2 = g.id === "MALE" ? "霸王帝君" : "絢彩女皇";
        PET_CATALOG[id] = {
          id,
          category: cat.id,
          gender: g.id,
          stage0Name: cat.name + genderLabel + "幼體 " + i + "號",
          stage1Name: cat.name + title1 + " " + i + "號",
          stage2Name: cat.name + title2 + " " + i + "號"
        };
        count++;
      }
    });
  });
})();

// 依類別 id 查詢顯示用中文資訊（名稱／稱號／icon／代表色）
function petCategoryMeta(catId) {
  return PET_CATEGORIES.find((c) => c.id === catId) || null;
}

/* ============================================================
   縮圖（正式美術）掛載慣例
   ============================================================
   每隻寵物的縮圖檔名固定用它的圖鑑 id，例如 PET_037.png，
   統一放在 pet/thumbs/ 資料夾裡。不用改這支檔案裡的任何一行、
   也不用逐筆填 thumb 欄位——Eric 畫好一張、丟進資料夾一張，
   對應的寵物馬上就會顯示正式圖；還沒畫好的會自動顯示類別 icon
   佔位，不會出現破圖，兩種狀態學生都看不出差異（不會露出「還沒畫」
   的痕跡）。完整的 100 隻對照表另外有一份文件。
*/

// 縮圖網址：basePath 由呼叫端依「自己頁面到 pet/thumbs/ 的相對路徑」提供
// （index.html 在根目錄要傳 "./pet/thumbs/"；pet-view.html 本身就在 pet/
// 資料夾裡，要傳 "./thumbs/"）。
function petThumbUrl(petDefId, basePath) {
  return (basePath || "") + petDefId + ".png";
}

// 把寵物縮圖畫進指定的容器裡：先試著載入正式縮圖，
// 如果檔案還沒上傳（瀏覽器抓圖 404），onerror 會自動退回顯示
// emoji 佔位圖示，不會出現破圖，也不用另外寫判斷式。
function petRenderAvatarInto(containerEl, petDefId, thumbBasePath, fallbackEmoji) {
  const img = document.createElement("img");
  img.src = petThumbUrl(petDefId, thumbBasePath);
  img.alt = "";
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "contain";
  img.onerror = function () {
    containerEl.textContent = fallbackEmoji;
  };
  containerEl.innerHTML = "";
  containerEl.appendChild(img);
}
