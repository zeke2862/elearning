// race-common.js
// ============ 打字賽車 共用邏輯 ============
// 給 typing-race-solo.html（個人賽）、typing-race-class.html（班級賽車手端）、
// typing-race-host.html（教室投影端）共用，確保三邊的「分類字元」「文章產生規則」
// 「WPM／分數／代幣換算公式」完全一致，不會各自實作出不同版本。
//
// 分類字元定義沿用「英打測試36線上功能.html」自主修煉頁面既有的 ROW_DEFS，
// 這樣賽車遊戲練到的按鍵分佈跟學生原本熟悉的中列／上列／下列／綜合／符號／混合進階
// 完全對得起來。

const RACE_TOP_P1 = "qwert", RACE_TOP_P2 = "yuiop";
const RACE_HOME_P1 = "asdfg", RACE_HOME_P2 = "hjkl";
const RACE_BOTTOM_P1 = "zxcvb", RACE_BOTTOM_P2 = "nm";
const RACE_ALL_P1 = RACE_TOP_P1 + RACE_HOME_P1 + RACE_BOTTOM_P1;
const RACE_ALL_P2 = RACE_TOP_P2 + RACE_HOME_P2 + RACE_BOTTOM_P2;
const RACE_TOP_P2_SYM = "[]", RACE_HOME_P2_SYM = ";'", RACE_BOTTOM_P2_SYM = ",./";
const RACE_LEFT_SYM = "~!@#$%";
const RACE_RIGHT_SYM = "^&*()_+-=[]{}|;:'\",.<>/?";
const RACE_UPPER_ALL_P1 = RACE_ALL_P1.toUpperCase();
const RACE_UPPER_ALL_P2 = RACE_ALL_P2.toUpperCase();

// 每一項：chars（可以抽出來組成字串的字元池）、label（顯示名稱，跟自主修煉頁面一致）、color（賽道主題色）
const RACE_CATEGORY_DEFS = {
  top:    { chars: RACE_TOP_P1 + RACE_TOP_P2, label: "上列字母", color: "#4fc3ff" },
  home:   { chars: RACE_HOME_P1 + RACE_HOME_P2, label: "中列字母", color: "#39ff9d" },
  bottom: { chars: RACE_BOTTOM_P1 + RACE_BOTTOM_P2, label: "下列字母", color: "#ff8a3d" },
  all:    { chars: RACE_ALL_P1 + RACE_ALL_P2 + RACE_TOP_P2_SYM + RACE_HOME_P2_SYM + RACE_BOTTOM_P2_SYM, label: "綜合練習", color: "#ffd23f" },
  symbols:{ chars: RACE_LEFT_SYM + RACE_RIGHT_SYM, label: "符號專攻", color: "#ff5c5c" },
  caseSymbols: { chars: RACE_ALL_P1 + RACE_UPPER_ALL_P1 + RACE_ALL_P2 + RACE_UPPER_ALL_P2 + RACE_LEFT_SYM + RACE_RIGHT_SYM + RACE_TOP_P2_SYM + RACE_HOME_P2_SYM + RACE_BOTTOM_P2_SYM, label: "混合進階", color: "#c58bff" }
};

const RACE_CATEGORY_ORDER = ["top", "home", "bottom", "all", "symbols", "caseSymbols"];

// 產生比賽用的文章（預設 100 字元）。傳入 seed 時用簡單線性同餘產生「可重現」的隨機序列，
// 讓班級賽車模式下所有學生（跟老師投影端）拿到「完全相同」的一篇文章，比賽才公平；
// 個人賽不需要公平性，不傳 seed 就好（每次都不一樣）。
function raceGenerateText(categoryKey, targetLen, seed) {
  targetLen = targetLen || 100;
  const def = RACE_CATEGORY_DEFS[categoryKey] || RACE_CATEGORY_DEFS.home;
  const chars = def.chars;
  let s = (typeof seed === "number" ? seed : Date.now()) % 2147483647;
  if (s <= 0) s += 2147483646;
  function rand() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  }
  let out = "";
  while (out.length < targetLen) {
    const wlen = 3 + Math.floor(rand() * 4); // 3~6 字一個「字塊」，中間用空白隔開
    let word = "";
    for (let i = 0; i < wlen && out.length + word.length < targetLen; i++) {
      word += chars[Math.floor(rand() * chars.length)];
    }
    out += (out.length ? " " : "") + word;
  }
  return out.slice(0, targetLen);
}

// 標準 WPM 公式：(正確字元數 / 5) / 分鐘數
function raceCalcWpm(correctChars, elapsedMs) {
  const minutes = elapsedMs / 60000;
  if (minutes <= 0) return 0;
  return Math.round((correctChars / 5) / minutes);
}

// 分數 = WPM × 完成字元數；沒開虛擬鍵盤提示 × 1.5（比照自主修煉頁面既有規則）
function raceCalcScore(wpm, completedChars, keyboardShown) {
  const base = wpm * completedChars;
  return Math.round(keyboardShown ? base : base * 1.5);
}

// 代幣 = 總分 / 500，無條件捨去
function raceCalcTokens(totalScore) {
  return Math.max(0, Math.floor(totalScore / 500));
}

// 前三名代幣加成（比照競賽普遍做法：1.5倍/1.25倍/1.1倍，四捨五入）—— 這是 Eric 需求中
// 「前三名另計」尚未指定倍率時的合理預設值，之後想調整只要改這裡三個數字就好。
const RACE_TOP3_BONUS = [1.5, 1.25, 1.1];
function raceApplyRankBonus(tokens, rankIndex) {
  const mult = RACE_TOP3_BONUS[rankIndex];
  return mult ? Math.round(tokens * mult) : tokens;
}

// ---- 學生存檔共用（跟 ETP／看打一樣，直接讀寫 keyagent_save_v1:<學號>） ----
function raceSaveKeyFor(studentNumber) {
  return studentNumber ? `keyagent_save_v1:${studentNumber}` : `keyagent_save_v1`;
}

function raceLoadSave(studentNumber) {
  try {
    const raw = localStorage.getItem(raceSaveKeyFor(studentNumber));
    return raw ? JSON.parse(raw) : { gbit: 0, gbitEarnedLifetime: 0, gbitSpentLifetime: 0 };
  } catch (err) {
    return { gbit: 0, gbitEarnedLifetime: 0, gbitSpentLifetime: 0 };
  }
}

function raceAwardTokens(studentNumber, tokens) {
  const key = raceSaveKeyFor(studentNumber);
  const save = raceLoadSave(studentNumber);
  save.gbit = (save.gbit || 0) + tokens;
  save.gbitEarnedLifetime = (save.gbitEarnedLifetime || 0) + tokens;
  save.lastModified = Date.now();
  try { localStorage.setItem(key, JSON.stringify(save)); } catch (err) { /* 存不進去就算了，不影響比賽本身 */ }
  return save.gbit;
}

// ---- 個人賽關卡進度（每學號 × 每分類 分開記錄解鎖到第幾關） ----
const RACE_PROGRESS_KEY_PREFIX = "keyagent_race_progress:";

function raceLoadProgress(studentNumber) {
  try {
    const raw = localStorage.getItem(RACE_PROGRESS_KEY_PREFIX + (studentNumber || "guest"));
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    return {};
  }
}

function raceSaveProgress(studentNumber, progress) {
  try { localStorage.setItem(RACE_PROGRESS_KEY_PREFIX + (studentNumber || "guest"), JSON.stringify(progress)); } catch (err) {}
}

function raceUnlockedLevel(studentNumber, categoryKey) {
  const p = raceLoadProgress(studentNumber);
  return p[categoryKey] || 1;
}

function raceClearLevel(studentNumber, categoryKey, level) {
  const p = raceLoadProgress(studentNumber);
  const current = p[categoryKey] || 1;
  if (level >= current) p[categoryKey] = level + 1;
  raceSaveProgress(studentNumber, p);
  return p[categoryKey];
}

// 取得目前登入身分（跟 index.html 存的格式一致），供三個頁面共用讀取
function raceGetActiveStudent() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("student");
  if (fromUrl) return fromUrl;
  try {
    const raw = localStorage.getItem("keyagent_active_student");
    const identity = raw ? JSON.parse(raw) : null;
    return (identity && identity.studentNumber) || null;
  } catch (err) {
    return null;
  }
}

// ============ 虛擬鍵盤提示（實際畫出鍵盤圖案並亮起下一個要按的鍵） ============
// 之前的版本只有文字說明「顯示中／已隱藏」，沒有真的畫出鍵盤——這裡補上實際渲染，
// 三個頁面（個人賽／班級賽／未來如果還有其他打字頁面）共用同一份，畫面跟亮燈邏輯才會一致。
const RACE_KB_ROWS = [
  ['`','1','2','3','4','5','6','7','8','9','0','-','='],
  ['q','w','e','r','t','y','u','i','o','p','[',']','\\'],
  ['a','s','d','f','g','h','j','k','l',';','\''],
  ['z','x','c','v','b','n','m',',','.','/']
];
const RACE_SHIFT_MAP = {
  '`':'~','1':'!','2':'@','3':'#','4':'$','5':'%','6':'^','7':'&','8':'*','9':'(','0':')','-':'_','=':'+',
  '[':'{',']':'}','\\':'|',';':':','\'':'"',',':'<','.':'>','/':'?'
};
const RACE_UNSHIFT_MAP = {};
Object.entries(RACE_SHIFT_MAP).forEach(([base, shifted]) => { RACE_UNSHIFT_MAP[shifted] = base; });

// 給定「接下來要打的字元」，回傳它對應的實體鍵（base）跟需不需要按 Shift
function raceKeyInfoFor(ch) {
  if (ch === ' ') return { base: ' ', needsShift: false };
  if (/[A-Z]/.test(ch)) return { base: ch.toLowerCase(), needsShift: true };
  if (RACE_UNSHIFT_MAP[ch]) return { base: RACE_UNSHIFT_MAP[ch], needsShift: true };
  return { base: ch, needsShift: false };
}

function raceEnsureKeyboardStyle() {
  if (document.getElementById('race-kb-style')) return;
  const style = document.createElement('style');
  style.id = 'race-kb-style';
  style.textContent = `
    .race-vk{display:flex;flex-direction:column;gap:5px;align-items:center;padding:12px 8px;}
    .race-vk-row{display:flex;gap:5px;}
    .race-vk-key{
      min-width:28px;height:28px;border:1px solid #1c2836;background:#0f1622;color:#6c7d8f;
      display:flex;align-items:center;justify-content:center;font-size:11px;border-radius:4px;
      font-family:'JetBrains Mono','Noto Sans Mono TC','Courier New',monospace;transition:all .1s;
    }
    .race-vk-key.wide{min-width:58px;}
    .race-vk-key.space{min-width:210px;}
    .race-vk-key.next{background:#ffd23f;color:#05070a;border-color:#ffd23f;box-shadow:0 0 10px rgba(255,210,63,.8);font-weight:bold;transform:translateY(-2px);}
  `;
  document.head.appendChild(style);
}

// 在指定容器內畫出整個虛擬鍵盤（只需要在比賽開始時呼叫一次）
function raceRenderKeyboard(container) {
  if (!container) return;
  raceEnsureKeyboardStyle();
  container.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "race-vk";
  RACE_KB_ROWS.forEach(row => {
    const rowEl = document.createElement("div");
    rowEl.className = "race-vk-row";
    row.forEach(k => {
      const keyEl = document.createElement("div");
      keyEl.className = "race-vk-key";
      keyEl.dataset.key = k;
      keyEl.textContent = k;
      rowEl.appendChild(keyEl);
    });
    wrap.appendChild(rowEl);
  });
  const bottomRow = document.createElement("div");
  bottomRow.className = "race-vk-row";
  const shiftEl = document.createElement("div");
  shiftEl.className = "race-vk-key wide";
  shiftEl.dataset.key = "shift";
  shiftEl.textContent = "Shift";
  const spaceEl = document.createElement("div");
  spaceEl.className = "race-vk-key space";
  spaceEl.dataset.key = " ";
  spaceEl.textContent = "space";
  bottomRow.appendChild(shiftEl);
  bottomRow.appendChild(spaceEl);
  wrap.appendChild(bottomRow);
  container.appendChild(wrap);
}

// 每次換下一個字元時呼叫：清掉舊的亮燈，把新的下一個鍵（跟需要的話 Shift 鍵）亮起來
function raceUpdateKeyboardHighlight(container, nextChar) {
  if (!container) return;
  container.querySelectorAll(".race-vk-key.next").forEach(el => el.classList.remove("next"));
  if (nextChar === undefined || nextChar === null) return;
  const info = raceKeyInfoFor(nextChar);
  const escaped = info.base.replace(/(["\\])/g, "\\$1");
  const keyEl = container.querySelector(`.race-vk-key[data-key="${escaped}"]`);
  if (keyEl) keyEl.classList.add("next");
  if (info.needsShift) {
    const shiftEl = container.querySelector('.race-vk-key[data-key="shift"]');
    if (shiftEl) shiftEl.classList.add("next");
  }
}

// ============ 每行固定 40 個非空白字元的文章產生（班級賽・無限量計時賽用） ============
// 跟 raceGenerateText 的差別：這裡回傳「一行一行」的陣列，每一行剛好 40 個非空白字元，
// 打完一行才會換下一行，符合「打完40個字元(不含空格)後跳出新的一行」的規則。
function raceGenerateLine(categoryKey, nonSpaceTarget) {
  nonSpaceTarget = nonSpaceTarget || 40;
  const def = RACE_CATEGORY_DEFS[categoryKey] || RACE_CATEGORY_DEFS.home;
  const chars = def.chars;
  let out = "";
  let nonSpaceCount = 0;
  while (nonSpaceCount < nonSpaceTarget) {
    const remaining = nonSpaceTarget - nonSpaceCount;
    const wlen = Math.min(3 + Math.floor(Math.random() * 4), remaining);
    let word = "";
    for (let i = 0; i < wlen; i++) word += chars[Math.floor(Math.random() * chars.length)];
    out += (out.length ? " " : "") + word;
    nonSpaceCount += wlen;
  }
  return out;
}

function raceGenerateLines(categoryKey, numLines) {
  const lines = [];
  for (let i = 0; i < numLines; i++) lines.push(raceGenerateLine(categoryKey, 40));
  return lines;
}
