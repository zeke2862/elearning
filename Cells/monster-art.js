/* ============================================================
   鍵位特工：怪物向量圖（10 種）
   - 每隻都是 64x64 的 SVG 字串，線條用 currentColor，
     所以會自動套用遊戲裡 .type-basic / .type-flying / .type-worm 的顏色
   - 雙色幽靈與毀滅者·Omega 有自己固定的顏色
   - 用法：element.innerHTML = MONSTER_SVG.worm;
   ============================================================ */
(function(root){
  var O = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  var C = '</svg>';
  var BG = '#0f1622';

  var S = {

    // 基本錯誤代碼：警告三角形 + 觸角的小蟲
    basic: O +
      '<path d="M32 9 L58 54 H6 Z" fill="currentColor" fill-opacity=".14"/>' +
      '<path d="M26 14 L20 5 M38 14 L44 5"/>' +
      '<path d="M11 44 L3 48 M53 44 L61 48" stroke-width="2.5"/>' +
      '<rect x="29.5" y="25" width="5" height="16" rx="2.5" fill="currentColor" stroke="none"/>' +
      '<circle cx="32" cy="47.5" r="3" fill="currentColor" stroke="none"/>' + C,

    // 飛行探針：四旋翼無人機 + 掃描光束
    flying: O +
      '<path d="M25 25 L12 15 M39 25 L52 15 M25 35 L12 45 M39 35 L52 45" stroke-width="2.5"/>' +
      '<ellipse cx="10" cy="13" rx="8" ry="2.6" fill="currentColor" fill-opacity=".25" stroke-width="2"/>' +
      '<ellipse cx="54" cy="13" rx="8" ry="2.6" fill="currentColor" fill-opacity=".25" stroke-width="2"/>' +
      '<ellipse cx="10" cy="47" rx="8" ry="2.6" fill="currentColor" fill-opacity=".25" stroke-width="2"/>' +
      '<ellipse cx="54" cy="47" rx="8" ry="2.6" fill="currentColor" fill-opacity=".25" stroke-width="2"/>' +
      '<circle cx="32" cy="30" r="10" fill="' + BG + '"/>' +
      '<circle cx="32" cy="30" r="3.6" fill="currentColor" stroke="none"/>' +
      '<path d="M27 42 L32 59 L37 42" stroke-width="2" stroke-dasharray="2 3" fill="currentColor" fill-opacity=".12"/>' + C,

    // 潛伏蠕蟲怪：一節一節的蟲，從地底電纜鑽出
    worm: O +
      '<path d="M2 58 H62" stroke-width="2" stroke-dasharray="3 4" opacity=".55"/>' +
      '<circle cx="9" cy="49" r="4.5" fill="' + BG + '"/>' +
      '<circle cx="19" cy="42" r="5.6" fill="' + BG + '"/>' +
      '<circle cx="30" cy="44" r="6.6" fill="' + BG + '"/>' +
      '<circle cx="41" cy="36" r="7.6" fill="' + BG + '"/>' +
      '<circle cx="50" cy="24" r="10" fill="' + BG + '"/>' +
      '<circle cx="46.5" cy="21.5" r="2.2" fill="currentColor" stroke="none"/>' +
      '<circle cx="54" cy="21.5" r="2.2" fill="currentColor" stroke="none"/>' +
      '<path d="M46 28.5 Q50 31.5 54.5 28.5" stroke-width="2"/>' + C,

    // 延遲漏洞怪：長腳的時鐘（拖延就會暴衝）
    delay: O +
      '<path d="M25 17 L20 7 M39 17 L44 7" stroke-width="2.5"/>' +
      '<circle cx="19.5" cy="6" r="2" fill="currentColor" stroke="none"/><circle cx="44.5" cy="6" r="2" fill="currentColor" stroke="none"/>' +
      '<path d="M15 38 L5 36 M15 46 L6 50 M49 38 L59 36 M49 46 L58 50" stroke-width="2.5"/>' +
      '<circle cx="32" cy="38" r="19" fill="currentColor" fill-opacity=".12"/>' +
      '<path d="M32 22.5 V25 M32 51 V53.5 M16.5 38 H19 M45 38 H47.5" stroke-width="2.5"/>' +
      '<path d="M32 38 V27 M32 38 L40 43" stroke-width="3.2"/>' +
      '<circle cx="32" cy="38" r="2.2" fill="currentColor" stroke="none"/>' + C,

    // 跳躍跳蚤怪：彈簧後腿，一下跳走
    jump: O +
      '<path d="M8 26 Q18 8 36 12" stroke-width="2" stroke-dasharray="2 4" opacity=".6"/>' +
      '<path d="M33.5 10 L38 12.5 L33 16" stroke-width="2"/>' +
      '<ellipse cx="34" cy="34" rx="15" ry="10.5" transform="rotate(-22 34 34)" fill="currentColor" fill-opacity=".14"/>' +
      '<path d="M26 40 L19 46 L29 49 L17 55 L27 58" stroke-width="2.6"/>' +
      '<path d="M40 43 L45 49 L52 47" stroke-width="2.6"/>' +
      '<path d="M44 24 L51 17 M47.5 28 L56 25" stroke-width="2.5"/>' +
      '<circle cx="42" cy="28.5" r="2.4" fill="currentColor" stroke="none"/>' + C,

    // 分裂軟泥怪：被切成兩半的軟泥
    split: O +
      '<circle cx="22" cy="38" r="15" fill="currentColor" fill-opacity=".14"/>' +
      '<circle cx="43" cy="31" r="13" fill="currentColor" fill-opacity=".14"/>' +
      '<path d="M33 9 V55" stroke-width="2" stroke-dasharray="3 3.5" opacity=".75"/>' +
      '<circle cx="17" cy="35" r="2.3" fill="currentColor" stroke="none"/><circle cx="26" cy="35" r="2.3" fill="currentColor" stroke="none"/>' +
      '<circle cx="39" cy="28" r="2" fill="currentColor" stroke="none"/><circle cx="47" cy="28" r="2" fill="currentColor" stroke="none"/>' +
      '<path d="M18 43 Q21.5 46 25 43" stroke-width="2"/>' + C,

    // 干擾霧怪：雲狀的霧，身上有雜訊條紋，兩個發光的眼睛
    fog: O +
      '<circle cx="19" cy="36" r="11" fill="currentColor" fill-opacity=".14"/>' +
      '<circle cx="32" cy="27" r="14" fill="currentColor" fill-opacity=".14"/>' +
      '<circle cx="46" cy="36" r="11" fill="currentColor" fill-opacity=".14"/>' +
      '<path d="M10 47 H54" stroke-width="3" fill="currentColor" fill-opacity=".14"/>' +
      '<path d="M8 53 H30 M36 53 H58 M14 58.5 H26 M32 58.5 H50" stroke-width="2" opacity=".6"/>' +
      '<circle cx="26" cy="31" r="3" fill="currentColor" stroke="none"/><circle cx="38" cy="31" r="3" fill="currentColor" stroke="none"/>' + C,

    // 符號魔像：用方塊拼成的石像，胸口是「#」
    golem: O +
      '<rect x="23" y="7" width="18" height="15" rx="2" fill="' + BG + '"/>' +
      '<path d="M27 14 H37" stroke-width="3.5"/>' +
      '<rect x="16" y="25" width="32" height="23" rx="2" fill="currentColor" fill-opacity=".14"/>' +
      '<rect x="5" y="25" width="9" height="20" rx="2" fill="' + BG + '"/>' +
      '<rect x="50" y="25" width="9" height="20" rx="2" fill="' + BG + '"/>' +
      '<rect x="20" y="50" width="9" height="10" rx="2" fill="' + BG + '"/>' +
      '<rect x="35" y="50" width="9" height="10" rx="2" fill="' + BG + '"/>' +
      '<path d="M27.5 29.5 V44 M36.5 29.5 V44 M22 35 H42 M22 40 H42" stroke-width="2.4"/>' + C,

    // 雙色幽靈怪：左紅右藍，對應大寫／小寫
    ghost:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="100%" height="100%" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M14 57 V30 C14 16 22 8 32 8 V50 L26 57 L20 50 Z" fill="#ff5f6d" fill-opacity=".28" stroke="#ff5f6d"/>' +
      '<path d="M32 8 C42 8 50 16 50 30 V57 L44 50 L38 57 L32 50 Z" fill="#4fc3ff" fill-opacity=".28" stroke="#4fc3ff"/>' +
      '<circle cx="25.5" cy="28" r="3.4" fill="#ffd9dc" stroke="none"/><circle cx="38.5" cy="28" r="3.4" fill="#d6f1ff" stroke="none"/>' +
      '<path d="M26.5 38 Q32 42.5 37.5 38" stroke="#d7e4ee" stroke-width="2"/>' + C,

    // 毀滅者·Omega：骷髏頭，額頭刻著 Ω，頭頂是尖刺王冠
    boss:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="100%" height="100%" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M14 21 L18 6 L25 15 L32 3 L39 15 L46 6 L50 21" stroke="#ffd23f" fill="#ffd23f" fill-opacity=".2"/>' +
      '<path d="M32 15 C46 15 54 24 54 35 C54 41 51 45 47 47 V54 H17 V47 C13 45 10 41 10 35 C10 24 18 15 32 15 Z" fill="#ff2e6c" fill-opacity=".16" stroke="#ff2e6c"/>' +
      '<ellipse cx="22.5" cy="36" rx="6" ry="7" fill="#ff2e6c" stroke="none"/><ellipse cx="41.5" cy="36" rx="6" ry="7" fill="#ff2e6c" stroke="none"/>' +
      '<circle cx="22.5" cy="36" r="2.2" fill="#fff" stroke="none"/><circle cx="41.5" cy="36" r="2.2" fill="#fff" stroke="none"/>' +
      '<path d="M27.5 24 H30.5 C28.6 22.8 27.8 21 27.8 19.2 A4.2 4.2 0 1 1 36.2 19.2 C36.2 21 35.4 22.8 33.5 24 H36.5" stroke="#ffd23f" stroke-width="2.2"/>' +
      '<path d="M30 45 L32 49 L34 45 M24 54 V49 M40 54 V49 M32 54 V50" stroke="#ff2e6c" stroke-width="2.2"/>' + C
  };

  // 對照遊戲 MOB_TYPES 的 key，方便之後直接套用
  root.MONSTER_SVG = S;
})(typeof window !== "undefined" ? window : this);
