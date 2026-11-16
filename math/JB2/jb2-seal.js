/* jb2-seal.js — JB2 防竄改守衛（學生端每一頁都要最先載入）
 *
 * 做六件事（另外也保護「數學保衛戰」的存檔與紀錄、存檔碼／匯出檔）：
 *  1. 簽章：星星、經驗、數靈幣的存檔，每次由「遊戲自己」寫入時蓋一個章；下次打開對不上就知道被改過。
 *  2. 寫入保護：在網址列／主控台直接寫存檔會被擋下（只有遊戲程式本身能寫）。
 *  3. 竄改處理：一眼看出不可能的數字（星星 > 5、數靈幣與收支對不上…）→ 清掉被改的那一份，並記錄通報老師。
 *  4. 答案保護：題目的 ans／explain 只有遊戲程式讀得到，主控台讀到的是 undefined。
 *  5. 成績訊息檢查：關卡傳給地圖的「通關」訊息要合理（星數上限、作答題數、花的時間）。
 *  6. 存檔碼／匯出檔簽章：沒有簽章或簽章不對的一律不能還原。
 *
 * 老實說明：這是「純網頁」的防護，程式碼學生看得到，防不了很有心又很懂技術的人，
 * 目標是讓常見的作弊（改網址、改存檔碼、主控台讀答案、偽造訊息）變得很麻煩，並讓老師看得出來。
 */
(function () {
  'use strict';
  if (window.JB2Seal) return;

  /* ★ 開關：false＝「看起來合理、只是沒有簽章」的變動只記錄通報、不清資料（剛上線、全班還在更新頁面時用）；
   *         true ＝ 只要簽章對不上就清掉那一份。全班都更新完（約一週後）建議改成 true。 */
  var STRICT = false;

  // 前 7 個是 JB2 的；後 2 個是「數學保衛戰」（math/JB2-defense）：遊戲存檔、以及要併入老師報表的紀錄
  var KEYS = ['jb2-hub-v1', 'monster-ch1-progress-v1', 'monster-ch2-progress-v1', 'monster-ch3-progress-v1',
              'monster-ch4-progress-v1', 'monster-ch5-progress-v1', 'monster-ch6-progress-v1',
              'math_defense_jb2_v1', 'md_jb2rec_v1'];
  var ID_KEY = 'keyagent_active_student', SEAL_P = 'jb2-seal-v1:', TLOG = 'jb2-tamper-v1';

  var LS = null;
  try { LS = window.localStorage; LS.getItem('x'); } catch (e) { LS = null; }

  /* ---------------- SHA-256 / HMAC（同步版） ---------------- */
  var K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }
  function sha256bin(bin) {            // 輸入／輸出都是「每個字元 0~255」的字串
    var l = bin.length, w = [], i, j;
    for (i = 0; i < l; i++) w[i >> 2] |= bin.charCodeAt(i) << (24 - (i % 4) * 8);
    w[l >> 2] |= 0x80 << (24 - (l % 4) * 8);
    var nw = (((l + 8) >> 6) + 1) * 16; for (i = 0; i < nw; i++) if (w[i] === undefined) w[i] = 0;
    w[nw - 1] = l * 8;
    var H0 = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19], a = new Array(64);
    for (i = 0; i < nw; i += 16) {
      for (j = 0; j < 16; j++) a[j] = w[i + j];
      for (j = 16; j < 64; j++) {
        var s0 = rotr(a[j - 15], 7) ^ rotr(a[j - 15], 18) ^ (a[j - 15] >>> 3), s1 = rotr(a[j - 2], 17) ^ rotr(a[j - 2], 19) ^ (a[j - 2] >>> 10);
        a[j] = (a[j - 16] + s0 + a[j - 7] + s1) | 0;
      }
      var h = H0.slice(), A = h[0], B = h[1], C = h[2], D = h[3], E = h[4], F = h[5], G = h[6], Hh = h[7];
      for (j = 0; j < 64; j++) {
        var S1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25), ch = (E & F) ^ (~E & G), t1 = (Hh + S1 + ch + K[j] + a[j]) | 0;
        var S0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22), mj = (A & B) ^ (A & C) ^ (B & C), t2 = (S0 + mj) | 0;
        Hh = G; G = F; F = E; E = (D + t1) | 0; D = C; C = B; B = A; A = (t1 + t2) | 0;
      }
      H0[0] = (H0[0] + A) | 0; H0[1] = (H0[1] + B) | 0; H0[2] = (H0[2] + C) | 0; H0[3] = (H0[3] + D) | 0;
      H0[4] = (H0[4] + E) | 0; H0[5] = (H0[5] + F) | 0; H0[6] = (H0[6] + G) | 0; H0[7] = (H0[7] + Hh) | 0;
    }
    var out = ''; for (i = 0; i < 8; i++) out += String.fromCharCode((H0[i] >>> 24) & 255, (H0[i] >>> 16) & 255, (H0[i] >>> 8) & 255, H0[i] & 255);
    return out;
  }
  function toHex(bin) { var s = ''; for (var i = 0; i < bin.length; i++) s += (bin.charCodeAt(i) + 256).toString(16).slice(1); return s; }
  function utf8(s) { return unescape(encodeURIComponent(String(s))); }
  // 金鑰（學生看得到這支程式，所以這只是「讓偽造變麻煩」，不是真正的保密）
  var SECRET = [74, 66, 50, 45, 115, 101, 97, 108, 45, 118, 49, 45, 21654, 38752, 21484, 21931, 24107, 20559, 28781, 22307]
    .map(function (c) { return String.fromCharCode(c); }).join('');
  function hmacHex(msg) {
    var key = utf8(SECRET), i, ip = '', op = '';
    for (i = 0; i < 64; i++) { var c = i < key.length ? key.charCodeAt(i) : 0; ip += String.fromCharCode(c ^ 0x36); op += String.fromCharCode(c ^ 0x5c); }
    return toHex(sha256bin(op + sha256bin(ip + utf8(msg)))).slice(0, 32);
  }

  /* ---------------- 誰在呼叫？（遊戲程式 vs 主控台／網址列） ---------------- */
  // 取呼叫端的第一個「有行列號、且不是本檔、也不是瀏覽器內建函式」的位置：
  // 在 .js／.html 檔裡 → 遊戲自己的程式（可信）；在 <anonymous>、VM、debugger eval、blob 等 → 主控台／網址列（不可信）。
  // 分辨不出來（瀏覽器不給堆疊）時一律當作可信，避免誤傷正常的學生。
  function trusted() {
    try {
      var st = String((new Error()).stack || ''); if (!st) return true;
      var lines = st.split('\n'), seen = false;
      for (var i = 0; i < lines.length; i++) {
        var ln = lines[i];
        if (!/:\d+:\d+/.test(ln)) continue;                 // 沒有行列號（內建函式、標題行）
        if (/jb2-seal\.js/.test(ln)) continue;              // 本檔
        seen = true;
        // 只看這一行「結尾」的位置（避免 eval 包起來的程式，在括號中段夾帶遊戲網頁網址而被誤判）
        return /(?:https?|file):\/\/[^\s()]*?\.(?:js|html)(?:\?[^\s()]*?)?:\d+:\d+\)?\s*$/.test(ln);
      }
      return !seen;
    } catch (e) { return true; }
  }

  /* ---------------- 記錄（通報老師用） ---------------- */
  function now() { return new Date().toISOString(); }
  var _set = null, _rem = null, _clr = null;
  function logRead() { try { return JSON.parse(LS.getItem(TLOG)) || []; } catch (e) { return []; } }
  function log(t, k, why) {
    try {
      if (!LS) return; var a = logRead(); a.push({ t: t, k: k || '', w: String(why || '').slice(0, 60), at: now() });
      if (a.length > 30) a = a.slice(-30); (_set || LS.setItem).call(LS, TLOG, JSON.stringify(a));
    } catch (e) {}
  }
  function summary() {
    var a = logRead(), o = { wipe: 0, soft: 0, blocked: 0, forged: 0, idChange: [], last: '' };
    a.forEach(function (x) {
      if (x.t === 'wipe') o.wipe++; else if (x.t === 'soft') o.soft++; else if (x.t === 'blocked') o.blocked++;
      else if (x.t === 'forged') o.forged++; else if (x.t === 'idChange') o.idChange.push(x.w); o.last = x.at;
    });
    return o;
  }

  /* ---------------- 資料檢查（只抓「不可能」的數字） ---------------- */
  function isInt(x) { return typeof x === 'number' && isFinite(x) && Math.floor(x) === x; }
  function vCh(n, d) {
    if (!d || typeof d !== 'object' || Array.isArray(d)) return '資料格式';
    var expSum = 0, anyTries = false, k, s;
    for (k in d) {
      if (k.charAt(0) === '_') continue;
      if (!/^\d-\d-\d$/.test(k) || +k.charAt(0) !== n) return '未知的關卡 ' + k;
      s = d[k]; if (!s || typeof s !== 'object') return '關卡資料格式 ' + k;
      if (s.stars != null && !(isInt(s.stars) && s.stars >= 0 && s.stars <= 5)) return '星數不合理 ' + k;
      if (s.exp != null && !(isInt(s.exp) && s.exp >= 0)) return '經驗不合理 ' + k;
      if (s.best != null && !(isInt(s.best) && s.best >= 0 && s.best <= 60000)) return '分數不合理 ' + k;
      if (s.eb != null && !(isInt(s.eb) && s.eb >= 0 && s.eb <= 5000)) return '無極限紀錄不合理 ' + k;
      if (s.tries != null && !(isInt(s.tries) && s.tries >= 0)) return '挑戰次數不合理 ' + k;
      if (s.tries > 0) anyTries = true;
      expSum += (s.exp | 0);
    }
    if (anyTries) for (k in d) {                              // 新版資料：有星星一定有挑戰紀錄
      if (k.charAt(0) === '_') continue; s = d[k];
      if ((s.stars | 0) > 0 && !(s.tries > 0)) return '有星星卻沒有挑戰紀錄 ' + k;
    }
    var Q = d._q, nsum = 0, cnt = 0, q, v;                    // 經驗只能從「作答」得到：每題最多 +10
    if (Q && typeof Q === 'object') for (q in Q) {
      v = Q[q]; if (!v || !isInt(v.n) || !isInt(v.ok) || v.n < 0 || v.ok < 0 || v.ok > v.n) return '作答統計不合理';
      nsum += v.n; cnt++;
    }
    if (cnt > 0 && expSum > nsum * 10 + 300) return '經驗超過作答題數能得到的上限';
    return '';
  }
  function vHub(h, off) {
    if (!h || typeof h !== 'object' || Array.isArray(h)) return '資料格式';
    if (!isInt(h.gold) || h.gold < 0 || h.gold > 2000000) return '數靈幣不合理';
    var st = h.stat || {}, e = st.earned | 0, sp = st.spent | 0;
    if (e < 0 || sp < 0) return '收支不合理';
    if (off != null && h.gold !== e - sp + off) return '數靈幣與收支對不上';
    var k; if (h.inv && typeof h.inv === 'object') for (k in h.inv) if (!isInt(h.inv[k]) || h.inv[k] < 0 || h.inv[k] > 999) return '道具數量不合理 ' + k;
    return '';
  }

  // 保衛戰「併入報表的紀錄」（md_jb2rec_v1）：只擋不可能的數字
  function vRec(o) {
    if (!o || typeof o !== 'object' || o.v !== 1 || !o.stages || typeof o.stages !== 'object') return '資料格式';
    var k, s, q, v;
    for (k in o.stages) {
      if (!/^[1-6]-[1-3]-[1-3]$/.test(k)) return '未知的關卡 ' + k;
      s = o.stages[k]; if (!s || typeof s !== 'object') return '關卡資料格式 ' + k;
      if (!(isInt(s.bestStars) && s.bestStars >= 0 && s.bestStars <= 5)) return '星數不合理 ' + k;
      if (!(isInt(s.plays) && s.plays >= 0 && s.plays <= 5000)) return '練習次數不合理 ' + k;
      if (!(typeof s.pSecs === 'number' && s.pSecs >= 0 && s.pSecs <= 5000 * 1800)) return '練習時間不合理 ' + k;
      if (!(isInt(s.totalQ) && isInt(s.totalOk) && s.totalQ >= 0 && s.totalOk >= 0 && s.totalOk <= s.totalQ)) return '答題統計不合理 ' + k;
    }
    for (q in (o.q || {})) { v = o.q[q]; if (!v || !isInt(v.n) || !isInt(v.ok) || v.n < 0 || v.ok < 0 || v.ok > v.n) return '題型統計不合理'; }
    return '';
  }
  // 保衛戰「遊戲存檔」（math_defense_jb2_v1）：金幣、抽卡券、每關星數等不可能的數字
  function vDef(o) {
    if (!o || typeof o !== 'object' || Array.isArray(o) || o.v !== 1) return '資料格式';
    if (!isInt(o.coins) || o.coins < 0 || o.coins > 10000000) return '金幣不合理';
    if (!isInt(o.tickets) || o.tickets < 0 || o.tickets > 100000) return '抽卡券不合理';
    var k, s;
    if (o.nodes && typeof o.nodes === 'object') for (k in o.nodes) {
      s = o.nodes[k]; if (!/^jb2_\d_\d_\d$/.test(k)) return '未知的關卡 ' + k;
      if (!s || typeof s !== 'object') return '關卡資料格式 ' + k;
      if (s.stars != null && !(isInt(s.stars) && s.stars >= 0 && s.stars <= 5)) return '星數不合理 ' + k;
      if (s.plays != null && !(isInt(s.plays) && s.plays >= 0 && s.plays <= 100000)) return '練習次數不合理 ' + k;
      if (s.best != null && !(isInt(s.best) && s.best >= 0 && s.best <= 1000000)) return '分數不合理 ' + k;
      if (s.endless != null && !(isInt(s.endless) && s.endless >= 0 && s.endless <= 5000)) return '無極限紀錄不合理 ' + k;
    }
    if (o.cards && typeof o.cards === 'object') for (k in o.cards) if (!isInt(o.cards[k]) || o.cards[k] < 0 || o.cards[k] > 9999) return '卡片數量不合理';
    return '';
  }
  function validate(key, raw, off) {
    var o; try { o = JSON.parse(raw); } catch (e) { return '無法讀取'; }
    if (key === 'md_jb2rec_v1') return vRec(o);
    if (key === 'math_defense_jb2_v1') return vDef(o);
    var m = /^monster-ch(\d)-progress-v1$/.exec(key);
    return m ? vCh(+m[1], o) : vHub(o, off);
  }
  function checkSnapshot(sn) {                                 // 匯入存檔前的檢查
    if (!sn || sn.v !== 1 || !sn.ch) return '格式不對';
    var n, r;
    for (n = 1; n <= 6; n++) if (sn.ch[n] && (r = vCh(n, sn.ch[n]))) return '第 ' + n + ' 章：' + r;
    if (sn.hub && (r = vHub(sn.hub, null))) return r;
    return '';
  }

  /* ---------------- 簽章與檢查 ---------------- */
  function sigOf(key, raw) { return hmacHex(key + '\n' + raw); }
  function sealGet(k) { try { return JSON.parse(LS.getItem(SEAL_P + k)); } catch (e) { return null; } }
  function sealPut(k, raw, off) {
    var o = { s: sigOf(k, raw) }; if (off != null) o.o = off;
    (_set || LS.setItem).call(LS, SEAL_P + k, JSON.stringify(o));
  }
  function hubOff(raw) { try { var h = JSON.parse(raw), st = h.stat || {}; return (h.gold | 0) - ((st.earned | 0) - (st.spent | 0)); } catch (e) { return 0; } }
  var notice = '';
  function check() {
    if (!LS) return;
    KEYS.forEach(function (k) {
      var raw = LS.getItem(k), sl = sealGet(k);
      if (raw == null) { if (sl) (_rem || LS.removeItem).call(LS, SEAL_P + k); return; }   // 資料沒了（清除網站資料）→ 章也一起清掉
      if (!sl) { sealPut(k, raw, k === KEYS[0] ? hubOff(raw) : null); return; }            // 第一次（舊紀錄自動納入簽章）
      if (sl.s === sigOf(k, raw)) return;                                                // 沒被動過
      var why = validate(k, raw, k === KEYS[0] ? (sl.o | 0) : null);
      if (why) { (_rem || LS.removeItem).call(LS, k); (_rem || LS.removeItem).call(LS, SEAL_P + k); log('wipe', k, why); notice = '偵測到存檔資料異常（' + why + '），這部分的進度已經重設，並已通知老師。'; }
      else if (STRICT) { (_rem || LS.removeItem).call(LS, k); (_rem || LS.removeItem).call(LS, SEAL_P + k); log('wipe', k, '簽章對不上'); notice = '偵測到存檔被遊戲以外的方式修改，這部分的進度已經重設，並已通知老師。'; }
      else { sealPut(k, raw, k === KEYS[0] ? (sl.o | 0) : null); log('soft', k, '簽章對不上（內容合理）'); }
    });
    try {                                                                                  // 換了學號？記下來（不清資料：共用電腦的正常換人也會觸發）
      var cur = ''; try { cur = String((JSON.parse(LS.getItem(ID_KEY)) || {}).studentNumber || ''); } catch (e) {}
      var ow = LS.getItem(SEAL_P + '_owner');
      if (cur && ow && ow !== cur) log('idChange', '', ow + '→' + cur);
      if (cur && ow !== cur) (_set || LS.setItem).call(LS, SEAL_P + '_owner', cur);
    } catch (e) {}
  }

  /* ---------------- 寫入保護：主控台／網址列直接寫存檔會被擋 ---------------- */
  function guarded(k) { return KEYS.indexOf(k) >= 0 || k === ID_KEY || k === TLOG || k === 'jb2-teacher' || String(k).indexOf(SEAL_P) === 0; }
  if (LS && window.Storage && Storage.prototype) {
    var P = Storage.prototype; _set = P.setItem; _rem = P.removeItem; _clr = P.clear;
    P.setItem = function (k, v) {
      if (this === LS && guarded(String(k))) {
        if (!trusted()) { log('blocked', String(k), '主控台寫入'); return; }
        var r = _set.apply(this, arguments);
        if (KEYS.indexOf(String(k)) >= 0) { try { sealPut(String(k), String(v), String(k) === KEYS[0] ? (sealGet(String(k)) || {}).o | 0 : null); } catch (e) {} }
        return r;
      }
      return _set.apply(this, arguments);
    };
    P.removeItem = function (k) {
      if (this === LS && guarded(String(k)) && !trusted()) { log('blocked', String(k), '主控台刪除'); return; }
      return _rem.apply(this, arguments);
    };
    P.clear = function () {
      if (this === LS && !trusted()) { log('blocked', '*', '主控台清空'); return; }
      return _clr.apply(this, arguments);
    };
  }

  /* ---------------- 答案保護 ---------------- */
  function guardQ(q) {
    if (!q || typeof q !== 'object') return q;
    ['ans', 'explain'].forEach(function (p) {
      if (!(p in q)) return;
      var v = q[p];
      try { Object.defineProperty(q, p, { get: function () { return trusted() ? v : undefined; }, set: function (x) { v = x; }, enumerable: true, configurable: true }); } catch (e) {}
    });
    return q;
  }

  /* ---------------- 關卡傳給地圖的訊息要合理 ---------------- */
  var MODE_MAX = { easy: 3, real: 4, hard: 5 }, lastLog = 0;
  function rej(why, d) { log('forged', d && d.type, why); return false; }
  // c：{ cur＝目前開的關卡, playSec＝這次已經玩了幾秒, n＝這次收到幾題作答紀錄 }
  function okMsg(d, c) {
    if (!d || typeof d !== 'object') return false;
    var t = d.type; c = c || {};
    if (typeof d.id !== 'string' || d.id !== c.cur) return rej('不是目前的關卡', d);
    if (t === 'wave-log') {
      if (typeof d.qtype !== 'string' || d.qtype.length > 40 || typeof d.ok !== 'boolean') return rej('作答紀錄格式', d);
      var n = Date.now(); if (n - lastLog < 400) return rej('作答太快', d); lastLog = n;
      return true;
    }
    if (t === 'stage-result') {
      var m = MODE_MAX[d.mode];
      if (!m) return rej('模式不明', d);
      if (typeof d.fail !== 'boolean') return rej('格式', d);
      if (!isInt(d.stars) || d.stars < 0 || d.stars > m) return rej('星數超過上限', d);
      if (!isInt(d.total) || d.total < 1 || d.total > 80 || !isInt(d.right) || d.right < 0 || d.right > d.total) return rej('題數不合理', d);
      if (!isInt(d.score) || d.score < 0 || d.score > 60000) return rej('分數不合理', d);
      if (!d.fail) {
        if ((c.n | 0) < Math.ceil(d.total * 0.6)) return rej('作答紀錄太少', d);
        if ((c.playSec || 0) < Math.max(3, d.total * 0.8)) return rej('花的時間太短', d);
      }
      return true;
    }
    if (t === 'endless-result') {
      if (!isInt(d.count) || d.count < 0 || d.count > 3000) return rej('題數不合理', d);
      if ((c.n | 0) < d.count * 0.5 || (c.playSec || 0) < d.count * 0.5) return rej('作答紀錄或時間不足', d);
      return true;
    }
    return true;
  }

  /* ---------------- 存檔碼／匯出檔簽章 ---------------- */
  function b64e(s) { return btoa(unescape(encodeURIComponent(s))); }
  function b64d(s) { return decodeURIComponent(escape(atob(s))); }
  function signSnap(sn) { return hmacHex('save\n' + JSON.stringify(sn)); }
  function makeCode(sn) { return 'JB2s-' + b64e(JSON.stringify({ d: sn, s: signSnap(sn) })); }
  function makeFile(sn) { var o = JSON.parse(JSON.stringify(sn)); o._sig = signSnap(sn); return o; }
  // 回傳 { ok, snap, why }
  function openSave(x) {
    try {
      var sn, sg;
      if (typeof x === 'string') {
        x = x.trim();
        if (/^JB2-/.test(x)) return { ok: false, why: 'old' };
        if (!/^JB2s-/.test(x)) return { ok: false, why: 'bad' };
        var p = JSON.parse(b64d(x.slice(5))); sn = p.d; sg = p.s;
      } else { if (!x || !x._sig) return { ok: false, why: 'old' }; sg = x._sig; sn = JSON.parse(JSON.stringify(x)); delete sn._sig; }
      if (!sn || sg !== signSnap(sn)) return { ok: false, why: 'sig' };
      var r = checkSnapshot(sn); if (r) return { ok: false, why: 'data:' + r };
      return { ok: true, snap: sn };
    } catch (e) { return { ok: false, why: 'bad' }; }
  }


  /* ---------------- 章節地圖的關卡：沒達到解鎖條件，直接輸入網址也進不去 ---------------- */
  // 規則（跟總地圖相同）：上一章的星星要夠（max × unlockRatio），而且要通過上一章的最後一關。
  // 設定檔沒載入、讀不到資料時一律放行（寧可放行，也不誤擋正常學生）。老師用專用標記通行。
  function chapterOpen(n, GC) {
    try {
      if (n <= 1) return { ok: true };
      var ch = GC.chapters[n - 2], ratio = (GC.economy && GC.economy.unlockRatio), L = ch.stages;
      var d = JSON.parse(LS.getItem('monster-ch' + (n - 1) + '-progress-v1')) || {}, stars = 0, i;
      for (i = 0; i < L.length; i++) { var s = d[L[i][0]]; stars += (s && s.stars | 0) || 0; }
      var need = Math.ceil(ch.max * ratio), last = L[L.length - 1], bs = d[last[0]];
      var bossDone = !!(bs && bs.stars > 0);
      return { ok: stars >= need && bossDone, stars: stars, need: need, bossDone: bossDone, boss: last[1] };
    } catch (e) { return { ok: true }; }
  }
  function gateChapter() {
    try {
      var m = /world-map-vol2ch(\d)\.html/.exec(location.pathname); if (!m || !LS) return;
      if (LS.getItem('jb2-teacher') === '1') return;
      var n = +m[1], r = chapterOpen(n, window.GAME_CONFIG); if (r.ok) return;
      log('gate', 'ch' + n, '沒達到解鎖條件，從網址進入被送回總地圖');
      location.replace('../world-map-vol2-all.html?locked=' + n);
    } catch (e) {}
  }


  /* ---------------- 保衛戰的存檔碼／匯出檔簽章（MD2-…／檔案內的 _sig） ---------------- */
  function signDef(st) { return hmacHex('def\n' + JSON.stringify(st)); }
  function makeDefCode(st) { return 'MD2-' + b64e(JSON.stringify({ d: st, s: signDef(st) })); }
  function makeDefFile(st) { var o = JSON.parse(JSON.stringify(st)); o._sig = signDef(st); return o; }
  // 回傳 { ok, state, why }：why＝old（舊版沒簽章）／sig（被改過）／data:原因／owner:學號／bad
  function openDef(x) {
    try {
      var st, sg;
      if (typeof x === 'string') {
        x = x.trim();
        if (/^MD1-/.test(x)) return { ok: false, why: 'old' };
        if (!/^MD2-/.test(x)) return { ok: false, why: 'bad' };
        var p = JSON.parse(b64d(x.slice(4))); st = p.d; sg = p.s;
      } else { if (!x || !x._sig) return { ok: false, why: 'old' }; sg = x._sig; st = JSON.parse(JSON.stringify(x)); delete st._sig; }
      if (!st || sg !== signDef(st)) return { ok: false, why: 'sig' };
      var r = vDef(st); if (r) return { ok: false, why: 'data:' + r };
      var cur = ''; try { cur = String((JSON.parse(LS.getItem(ID_KEY)) || {}).studentNumber || ''); } catch (e) {}
      var who = String((st.hub && st.hub.sid) || '');
      if (cur && who && cur !== who) return { ok: false, why: 'owner:' + who };         // 只能還原給同一個學號
      return { ok: true, state: st };
    } catch (e) { return { ok: false, why: 'bad' }; }
  }

  window.JB2Seal = {
    guardAns: guardQ, okMsg: okMsg, openSave: openSave, makeCode: makeCode, makeFile: makeFile,
    checkSnapshot: checkSnapshot, summary: summary, log: log, check: check, gateChapter: gateChapter, chapterOpen: chapterOpen, makeDefCode: makeDefCode, makeDefFile: makeDefFile, openDef: openDef, _vDef: vDef, _vRec: vRec, _hmac: hmacHex
  };

  /* ---------------- 啟動 ---------------- */
  check();
  document.addEventListener('visibilitychange', function () { if (!document.hidden) check(); });
  window.addEventListener('focus', check);
  function showNotice() {
    if (!notice || !document.body) return;
    var d = document.createElement('div');
    d.style.cssText = 'position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:2147483646;background:#b3261e;color:#fff;padding:10px 16px;border-radius:10px;font:700 15px/1.5 system-ui,sans-serif;max-width:90vw;text-align:center;box-shadow:0 4px 18px #0008';
    d.textContent = '⚠️ ' + notice; document.body.appendChild(d); notice = ''; setTimeout(function () { d.remove(); }, 12000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showNotice); else showNotice();
})();
