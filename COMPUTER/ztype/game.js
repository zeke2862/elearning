// =============================================
//   TypeStrike — Main Game Engine v2
// =============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ── Character Pools by Category ────────────────
// Home row keys
const HOME_CHARS = 'asdfghjkl'.split('');
// Top row keys
const TOP_CHARS  = 'qwertyuiop'.split('');
// Bottom row keys
const BOT_CHARS  = 'zxcvbnm'.split('');
// Symbol characters (typable without Shift and with Shift)
const SYMBOL_CHARS = '!@#$%^&*()-_=+[]{};:\'",./<>?\\|`~'.split('');
// All alpha for mixed case
const ALPHA = 'abcdefghijklmnopqrstuvwxyz'.split('');

// ── Word Bank (for "words" category) ───────────
const WORD_BANK = {
  easy: [
    'cat','dog','sun','run','fly','sky','war','aim','hit','cup',
    'fire','jump','left','zero','code','dark','star','fast','cool','ship',
    'moon','blue','void','nova','beam','wave','icon','bold','type','lock',
    'red','box','pen','map','win','key','top','net','fog','gem'
  ],
  medium: [
    'laser','space','pilot','orbit','pulse','blast','shield','enemy','radar','storm',
    'comet','forge','power','speed','angle','sniper','target','sector','command','signal',
    'weapon','strike','battle','galaxy','nebula','photon','vector','missile','fighter','captain',
    'planet','engine','turret','breach','defend','attack','launch','deploy','module','system'
  ],
  hard: [
    'asteroid','hyperdrive','destroyer','satellite','intergalactic','annihilate',
    'invincible','commander','obliterate','supernova','cybernetic','interceptor',
    'detonation','spaceship','trajectory','mothership','calibration','bombardment',
    'navigation','coordinate','holographic','teleporter','acceleration','antimatter'
  ]
};

// ── Generate text for a given category ─────────
function generateText(category, wave) {
  switch (category) {
    case 'home':
      return generateFromPool(HOME_CHARS, wave);
    case 'top':
      return generateFromPool(TOP_CHARS, wave);
    case 'bottom':
      return generateFromPool(BOT_CHARS, wave);
    case 'symbols':
      return generateSymbolText(wave);
    case 'case':
      return generateCaseText(wave);
    case 'mixed':
      return generateMixedText(wave);
    case 'words':
    default:
      return pickWord(wave);
  }
}

function generateFromPool(pool, wave) {
  const len = Math.min(2 + Math.floor(wave * 0.6), 10);
  let s = '';
  for (let i = 0; i < len; i++) {
    s += pool[Math.floor(Math.random() * pool.length)];
  }
  return s;
}

function generateSymbolText(wave) {
  // Mix letters and symbols
  const syms = '!@#;:,.?-_=+'.split('');
  const letters = 'asdfjkl'.split(''); // home row for anchoring
  const len = Math.min(3 + Math.floor(wave * 0.5), 8);
  let s = '';
  for (let i = 0; i < len; i++) {
    s += Math.random() < 0.5 ? syms[Math.floor(Math.random() * syms.length)]
                              : letters[Math.floor(Math.random() * letters.length)];
  }
  return s;
}

function generateCaseText(wave) {
  const len = Math.min(3 + Math.floor(wave * 0.5), 9);
  let s = '';
  for (let i = 0; i < len; i++) {
    const c = ALPHA[Math.floor(Math.random() * ALPHA.length)];
    s += Math.random() < 0.4 ? c.toUpperCase() : c;
  }
  return s;
}

function generateMixedText(wave) {
  const all = [...ALPHA, ...'1234567890!@#;:,.-_'.split('')];
  const len = Math.min(3 + Math.floor(wave * 0.5), 10);
  let s = '';
  for (let i = 0; i < len; i++) {
    let c = all[Math.floor(Math.random() * all.length)];
    if (Math.random() < 0.2 && /[a-z]/.test(c)) c = c.toUpperCase();
    s += c;
  }
  return s;
}

// ── Chinese Mode Helpers (看拼音選字) ───────────
// CHINESE_ARTICLES is loaded from chinese-articles-data.js as:
//   [{ id, title, chain: [[char, pinyinOrNull], ...] }, ...]
let selectedArticleIds = new Set();

function getSelectedArticles() {
  if (typeof CHINESE_ARTICLES === 'undefined') return [];
  const list = CHINESE_ARTICLES.filter(a => selectedArticleIds.has(a.id));
  return list.length > 0 ? list : CHINESE_ARTICLES;
}

let chinesePinyinBuffer = '';
function normalizePinyin(s) {
  return String(s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[1-5]/g, '').replace(/ü/g, 'v').replace(/[^a-zv]/g, '');
}

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

// 從一篇文章中隨機抽出連續 len 個字
// requireHanziStart：是否必須從「有拼音的國字」開始（標點不行）
function extractSpan(article, len, requireHanziStart = true) {
  const chain = article.chain;
  if (!chain || chain.length < len) return null;
  for (let attempt = 0; attempt < 30; attempt++) {
    const start = randomInt(0, chain.length - len);
    if (requireHanziStart && chain[start][1] === null) continue; // 開頭必須是實際漢字，不能是標點
    const slice = chain.slice(start, start + len);
    const hanzi = slice.map(c => c[0]).join('');
    const pinyinDisplay = slice.map(c => c[1] || c[0]).join(len > 1 ? ' ' : '');
    return { hanzi, pinyinDisplay };
  }
  return null;
}

// 一般模式：單一「國字」，顯示拼音，玩家用點選的方式作答
// 專家模式：單一「文字」（可能是國字，也可能是標點符號），玩家自己打字輸入作答
function pickChineseTarget(isExpert) {
  const articles = getSelectedArticles();
  if (articles.length === 0) return null;
  for (let attempt = 0; attempt < 10; attempt++) {
    const article = articles[Math.floor(Math.random() * articles.length)];
    const target = extractSpan(article, 1, !isExpert);
    if (target) return target;
  }
  return null;
}

// 產生選字按鈕候選（1 個正確答案 + 其餘干擾選項）——僅一般模式使用
function buildAnswerChoices(correctHanzi, len) {
  const choices = new Set([correctHanzi]);
  const articles = getSelectedArticles();
  let guard = 0;
  while (choices.size < 4 && guard < 60 && articles.length > 0) {
    guard++;
    const article = articles[Math.floor(Math.random() * articles.length)];
    const target = extractSpan(article, len);
    if (target && target.hanzi !== correctHanzi) choices.add(target.hanzi);
  }
  const arr = Array.from(choices);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}


function pickWord(wave) {
  if (wave <= 2) return WORD_BANK.easy[Math.floor(Math.random() * WORD_BANK.easy.length)];
  if (wave <= 5) {
    const pool = wave <= 3
      ? [...WORD_BANK.easy, ...WORD_BANK.medium]
      : [...WORD_BANK.medium, ...WORD_BANK.easy.slice(0,10)];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  if (wave <= 9) {
    const pool = [...WORD_BANK.medium, ...WORD_BANK.hard.slice(0,8)];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  const pool = [...WORD_BANK.medium.slice(0,10), ...WORD_BANK.hard];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Game State ─────────────────────────────────
const STATE = {
  MENU: 'menu',
  CATEGORIES: 'categories',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAMEOVER: 'gameover'
};

let state = STATE.MENU;
let mode = 'normal'; // 'normal' | 'expert'
let category = 'home'; // selected category
let showKeyboard = false; // on-screen keyboard visible
let score = 0;
let wave = 1;
let lives = 3;
let maxLives = 3; // 中文模式改為 5 條命，其餘模式維持 3 條
let killCount = 0;
let totalKeystrokes = 0;
let correctKeystrokes = 0;
let typedSoFar = '';
let lockedTarget = null;
let enemies = [];
let bullets = [];
let particles = [];
let stars = [];
let explosions = [];
let waveTimer = 0;
let waveEnemyCount = 0;
let spawnedThisWave = 0;
let waveDone = false;
let frameCount = 0;
let lastTime = 0;
let nebulaCanvas = null;

// ── Resize ─────────────────────────────────────
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  nebulaCanvas = null; // force redraw
}
window.addEventListener('resize', () => { resize(); initStars(); });
resize();

// ── Stars Background ───────────────────────────
function initStars() {
  stars = [];
  const count = Math.floor((canvas.width * canvas.height) / 6000);
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.2,
      brightness: Math.random(),
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinklePhase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.15 + 0.05,
      color: Math.random() < 0.15 ? '#a0c8ff' : Math.random() < 0.1 ? '#ffd0b0' : '#ffffff'
    });
  }
}
initStars();

// ── Player Ship ────────────────────────────────
const ship = {
  x: 0, y: 0,
  w: 18, h: 26,
  thrustAnim: 0,
  shieldFlash: 0,
  get cx() { return canvas.width / 2; },
  get cy() { return canvas.height - (showKeyboard ? 220 : 80); }
};

// ── Enemy Class ────────────────────────────────
class Enemy {
  constructor(word, x) {
    this.word = word;
    this.x = x;
    this.y = -30;
    this.typed = 0;
    this.size = 18;
    this.speed = this.calcSpeed();
    this.hue = Math.random() * 30 - 15;
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleAmp = Math.random() * 8 + 4;
    this.wobbleSpeed = Math.random() * 0.02 + 0.008;
    this.id = Math.random();
    this.glowPulse = Math.random() * Math.PI * 2;
  }

  calcSpeed() {
    if (category === 'chinese' && mode === 'expert') {
      // 中文專家模式：初始速度放慢很多，隨關卡數逐漸加快
      const base = 0.2;
      const waveBonus = Math.min(wave * 0.035, 0.55);
      return (base + waveBonus) * (0.9 + Math.random() * 0.3);
    }
    const base = mode === 'expert' ? 0.7 : 0.4;
    const waveBonus = Math.min(wave * 0.08, 1.2);
    return (base + waveBonus) * (0.9 + Math.random() * 0.3);
  }

  get isLocked() { return lockedTarget === this; }
  get progress() { return this.typed / this.word.length; }

  update(dt) {
    this.y += this.speed * dt * 60;
    this.wobble += this.wobbleSpeed;
    this.glowPulse += 0.05;
  }

  draw() {
    const wx = this.x + Math.sin(this.wobble) * this.wobbleAmp * (1 - this.progress * 0.7);
    const wy = this.y;
    const glow = this.isLocked ? 1 : 0.5 + 0.25 * Math.sin(this.glowPulse);
    const alpha = this.isLocked ? 1 : 0.85;

    // Engine trail
    for (let i = 0; i < 3; i++) {
      const trail = this.size * (0.3 - i * 0.07);
      const trailAlpha = (0.25 - i * 0.07) * alpha;
      const grad = ctx.createRadialGradient(wx, wy + this.size * 0.5 + i * 6, 0, wx, wy + this.size * 0.5 + i * 6, trail * 3);
      grad.addColorStop(0, `rgba(255, 80, 120, ${trailAlpha})`);
      grad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(wx, wy + this.size * 0.5 + i * 6, trail * 3, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Ship body glow
    const bodyGlow = ctx.createRadialGradient(wx, wy, 0, wx, wy, this.size * 2.5 * glow);
    bodyGlow.addColorStop(0, `rgba(255, 60, 100, ${0.3 * glow})`);
    bodyGlow.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(wx, wy, this.size * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = bodyGlow;
    ctx.fill();

    // Ship body
    ctx.save();
    ctx.translate(wx, wy);
    ctx.beginPath();
    ctx.moveTo(0, this.size);
    ctx.lineTo(-this.size * 0.7, -this.size * 0.6);
    ctx.lineTo(0, -this.size * 0.3);
    ctx.lineTo(this.size * 0.7, -this.size * 0.6);
    ctx.closePath();
    const fillGrad = ctx.createLinearGradient(0, -this.size, 0, this.size);
    fillGrad.addColorStop(0, `rgba(255,80,110,${0.95 * alpha})`);
    fillGrad.addColorStop(1, `rgba(180,20,50,${0.7 * alpha})`);
    ctx.fillStyle = fillGrad;
    ctx.fill();
    ctx.strokeStyle = this.isLocked ? `rgba(255,200,200,0.9)` : `rgba(255,100,130,0.5)`;
    ctx.lineWidth = this.isLocked ? 1.5 : 0.8;
    ctx.stroke();

    // Core dot
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,200,200,${0.8 * alpha})`;
    ctx.fill();
    ctx.restore();

    // Word label
    this.drawLabel(wx, wy);
  }

  drawLabel(wx, wy) {
    if (this.isChinese) { this.drawChineseLabel(wx, wy); return; }
    const fontSize = this.isLocked ? 20 : 17;
    ctx.font = `${this.isLocked ? '700' : '600'} ${fontSize}px 'Orbitron', monospace`;
    const totalW = ctx.measureText(this.word).width;
    const lx = wx - totalW / 2;
    const ly = wy - this.size - 12;

    // Background pill
    const padX = 10;
    const padY = 6;
    const bgW = totalW + padX * 2;
    const bgH = fontSize + padY * 2;
    const bgX = lx - padX;
    const bgY = ly - fontSize - 2;
    ctx.fillStyle = this.isLocked ? 'rgba(0,12,30,0.92)' : 'rgba(0,5,15,0.75)';
    roundRect(ctx, bgX, bgY, bgW, bgH, 5);
    ctx.fill();

    if (this.isLocked) {
      ctx.strokeStyle = 'rgba(0,245,255,0.7)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, bgX, bgY, bgW, bgH, 5);
      ctx.stroke();
    }

    // Typed portion (lit up)
    if (this.typed > 0) {
      const typedWord = this.word.slice(0, this.typed);
      ctx.fillStyle = '#00f5ff';
      ctx.shadowColor = 'rgba(0,245,255,0.9)';
      ctx.shadowBlur = 10;
      ctx.fillText(typedWord, lx, ly);
      ctx.shadowBlur = 0;
    }

    // Remaining portion
    if (this.typed < this.word.length) {
      const remainWord = this.word.slice(this.typed);
      const offsetX = this.typed > 0 ? ctx.measureText(this.word.slice(0, this.typed)).width : 0;
      ctx.fillStyle = this.isLocked ? 'rgba(255,255,255,0.9)' : 'rgba(180,200,220,0.6)';
      ctx.fillText(remainWord, lx + offsetX, ly);
    }
  }

  // 中文一般模式：只顯示拼音；中文專家模式：同時顯示國字與拼音（練習打字用）
  drawChineseLabel(wx, wy) {
    const fontSize = this.isLocked ? 19 : 16;
    ctx.font = `${this.isLocked ? '700' : '600'} ${fontSize}px 'Noto Sans TC', 'Orbitron', sans-serif`;
    const label = chineseDisplayLabel(this);
    const totalW = ctx.measureText(label).width;
    const lx = wx - totalW / 2;
    const ly = wy - this.size - 12;

    const padX = 10, padY = 6;
    const bgW = totalW + padX * 2;
    const bgH = fontSize + padY * 2;
    const bgX = lx - padX;
    const bgY = ly - fontSize - 2;
    ctx.fillStyle = this.isLocked ? 'rgba(0,12,30,0.92)' : 'rgba(0,5,15,0.75)';
    roundRect(ctx, bgX, bgY, bgW, bgH, 5);
    ctx.fill();

    if (this.isLocked) {
      ctx.strokeStyle = 'rgba(0,245,255,0.7)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, bgX, bgY, bgW, bgH, 5);
      ctx.stroke();
    }

    if (this.isLocked) {
      ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(0,245,255,0.9)';
      ctx.shadowBlur = 10;
    } else {
      ctx.fillStyle = 'rgba(180,200,220,0.75)';
    }
    ctx.fillText(label, lx, ly);
    ctx.shadowBlur = 0;
  }
}

// ── Bullet Class ───────────────────────────────
class Bullet {
  constructor(tx, ty) {
    this.x = canvas.width / 2;
    this.y = ship.cy;
    this.tx = tx;
    this.ty = ty;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.vx = (dx / dist) * 14;
    this.vy = (dy / dist) * 14;
    this.life = 1;
    this.trail = [];
  }

  update() {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 8) this.trail.shift();
    this.x += this.vx;
    this.y += this.vy;
    const dx = this.x - this.tx;
    const dy = this.y - this.ty;
    if (dx * dx + dy * dy < 200) this.life = 0;
  }

  draw() {
    for (let i = 0; i < this.trail.length; i++) {
      const t = i / this.trail.length;
      ctx.beginPath();
      ctx.arc(this.trail[i].x, this.trail[i].y, 2 * t, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,245,255,${t * 0.6})`;
      ctx.fill();
    }
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 5);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#00f5ff');
    grad.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }
}

// ── Particle System ────────────────────────────
function spawnExplosion(x, y, color = '#ff4466') {
  const count = 22;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const speed = Math.random() * 4 + 1.5;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: Math.random() * 0.03 + 0.02,
      size: Math.random() * 4 + 1.5,
      color
    });
  }
  explosions.push({ x, y, r: 4, maxR: 55, life: 1, color });
}

function spawnLetterPop(x, y, letter) {
  particles.push({
    x, y,
    vx: (Math.random() - 0.5) * 3,
    vy: -Math.random() * 3 - 1,
    life: 1,
    decay: 0.025,
    size: 11,
    letter,
    isLetter: true
  });
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1;
    p.life -= p.decay;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    if (p.isLetter) {
      const isCJK = /[\u4e00-\u9fff]/.test(p.letter);
      ctx.font = isCJK ? `bold 18px 'Noto Sans TC', sans-serif` : `bold 16px 'Orbitron', monospace`;
      ctx.fillStyle = `rgba(0,245,255,${p.life})`;
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 8;
      ctx.fillText(p.letter, p.x, p.y);
      ctx.shadowBlur = 0;
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color.startsWith('#') ? hexToRgba(p.color, p.life * 0.85) : p.color;
      ctx.fill();
    }
  }
  for (let i = explosions.length - 1; i >= 0; i--) {
    const e = explosions[i];
    e.r += (e.maxR - e.r) * 0.15;
    e.life -= 0.04;
    if (e.life <= 0) { explosions.splice(i, 1); continue; }
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.strokeStyle = hexToRgba(e.color, e.life * 0.7);
    ctx.lineWidth = 2 * e.life;
    ctx.stroke();
  }
}

// ── Ship Drawing ───────────────────────────────
function drawShip() {
  const cx = canvas.width / 2;
  const cy = ship.cy;
  ship.thrustAnim += 0.15;

  // Engine glow
  for (let i = 0; i < 3; i++) {
    const glowR = (12 + Math.sin(ship.thrustAnim + i) * 5) * (1 - i * 0.25);
    const g = ctx.createRadialGradient(cx, cy + 20 + i * 8, 0, cx, cy + 20 + i * 8, glowR * 2);
    g.addColorStop(0, `rgba(0,180,255,${0.5 - i * 0.13})`);
    g.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(cx, cy + 20 + i * 8, glowR * 2, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  }

  ctx.save();
  ctx.translate(cx, cy);

  // Body
  ctx.beginPath();
  ctx.moveTo(0, -26);
  ctx.lineTo(-12, 10);
  ctx.lineTo(-5, 5);
  ctx.lineTo(0, 14);
  ctx.lineTo(5, 5);
  ctx.lineTo(12, 10);
  ctx.closePath();
  const bodyGrad = ctx.createLinearGradient(0, -26, 0, 14);
  bodyGrad.addColorStop(0, '#60e8ff');
  bodyGrad.addColorStop(0.5, '#00a8d4');
  bodyGrad.addColorStop(1, '#003a5c');
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,245,255,0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Cockpit
  ctx.beginPath();
  ctx.ellipse(0, -12, 4, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,245,255,0.5)';
  ctx.fill();

  // Wings
  ctx.beginPath();
  ctx.moveTo(-12, 10);
  ctx.lineTo(-22, 18);
  ctx.lineTo(-14, 8);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,120,200,0.8)';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(12, 10);
  ctx.lineTo(22, 18);
  ctx.lineTo(14, 8);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,120,200,0.8)';
  ctx.fill();

  // Shield flash
  if (ship.shieldFlash > 0) {
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 80, 120, ${ship.shieldFlash})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ship.shieldFlash -= 0.06;
  }

  ctx.restore();
}

// ── Background ─────────────────────────────────
function drawBackground() {
  ctx.fillStyle = '#020408';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawNebula();

  frameCount++;
  for (const s of stars) {
    s.y += s.speed;
    if (s.y > canvas.height) s.y = 0;
    const twinkle = 0.5 + 0.5 * Math.sin(frameCount * s.twinkleSpeed + s.twinklePhase);
    const a = 0.3 + twinkle * 0.7;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = s.color === '#ffffff' ? `rgba(255,255,255,${a})` :
      s.color === '#a0c8ff' ? `rgba(160,200,255,${a})` : `rgba(255,208,176,${a})`;
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(0,20,40,0.06)';
  for (let y = 0; y < canvas.height; y += 4) {
    ctx.fillRect(0, y, canvas.width, 2);
  }
}

function drawNebula() {
  if (!nebulaCanvas) {
    nebulaCanvas = document.createElement('canvas');
    nebulaCanvas.width = canvas.width;
    nebulaCanvas.height = canvas.height;
    const nc = nebulaCanvas.getContext('2d');
    const blobs = [
      { x: 0.15, y: 0.2, r: 0.25, c: 'rgba(30,0,80,0.15)' },
      { x: 0.85, y: 0.35, r: 0.2,  c: 'rgba(0,40,80,0.12)' },
      { x: 0.5,  y: 0.6, r: 0.3,  c: 'rgba(0,20,60,0.1)'  },
    ];
    for (const b of blobs) {
      const g = nc.createRadialGradient(b.x * canvas.width, b.y * canvas.height, 0,
        b.x * canvas.width, b.y * canvas.height, b.r * canvas.width);
      g.addColorStop(0, b.c);
      g.addColorStop(1, 'transparent');
      nc.beginPath();
      nc.arc(b.x * canvas.width, b.y * canvas.height, b.r * canvas.width, 0, Math.PI * 2);
      nc.fillStyle = g;
      nc.fill();
    }
  }
  ctx.drawImage(nebulaCanvas, 0, 0);
}

// ── Wave Management ────────────────────────────
function waveEnemyCount_(w) {
  return Math.min(4 + w * 2, 20);
}

function startWave() {
  waveEnemyCount = waveEnemyCount_(wave);
  spawnedThisWave = 0;
  waveTimer = 0;
  waveDone = false;
}

function getSpawnInterval() {
  if (category === 'chinese' && mode === 'expert') {
    // 中文專家模式：一開始敵人出現的間隔拉長（畫面上同時存在的敵人較少），
    // 隨關卡數增加逐漸縮短間隔（同時出現的敵人變多）
    const base = 3200;
    return Math.max(base - wave * 180, 1000);
  }
  const base = mode === 'expert' ? 1500 : 2500;
  return Math.max(base - wave * 120, mode === 'expert' ? 500 : 700);
}

function trySpawn(dt) {
  if (spawnedThisWave >= waveEnemyCount) return;
  waveTimer += dt * 1000;
  if (waveTimer >= getSpawnInterval()) {
    waveTimer -= getSpawnInterval();
    spawnEnemy();
  }
}

function spawnEnemy() {
  const margin = 60;
  const x = margin + Math.random() * (canvas.width - margin * 2);

  if (category === 'chinese') {
    spawnedThisWave++;
    const target = pickChineseTarget(mode === 'expert');
    if (!target) return; // 文章資料不足時安全略過
    const en = new Enemy(target.hanzi, x);
    en.isChinese = true;
    en.pinyinLabel = target.pinyinDisplay;
    en.pinyinInput = normalizePinyin(target.pinyinDisplay);
    en.choices = null;
    en.typed = 0;
    if (mode !== 'expert') en.speed *= 0.6;
    enemies.push(en);
    return;
  }

  const word = generateText(category, wave);
  enemies.push(new Enemy(word, x));
  spawnedThisWave++;
}

// 一般模式：敵人顯示國字及拼音；專家模式只顯示國字，不提供拼音提示
function chineseDisplayLabel(enemy) {
  if (mode === 'expert') return enemy.word || '';
  const pinyin = enemy.pinyinLabel || '';
  return `${enemy.word || ''}　(${pinyin})`;
}

// 中文模式改為鍵盤輸入：一般模式輸入拼音，專家模式輸入國字
function updateChineseLock() {
  if (category !== 'chinese' || mode !== 'normal') return;
  const hint = document.getElementById('answerHint');
  const typedDisplay = document.getElementById('typedPinyinDisplay');
  if (hint) hint.textContent = '看國字打拼音（不需輸入聲調）';
  if (typedDisplay) {
    typedDisplay.textContent = chinesePinyinBuffer || '開始輸入拼音';
    typedDisplay.classList.toggle('is-empty', !chinesePinyinBuffer);
  }
}

function renderChineseChoiceUI() {
  const hint = document.getElementById('answerHint');
  const choicesWrap = document.getElementById('answerChoices');
  const inputWrap = document.getElementById('answerInputWrap');
  if (choicesWrap) { choicesWrap.style.display = 'none'; choicesWrap.innerHTML = ''; }
  if (inputWrap) inputWrap.style.display = 'none';
  if (hint) hint.textContent = '看國字打拼音，輸入完整拼音即可消滅敵人（不需輸入聲調）';
  const typedDisplay = document.getElementById('typedPinyinDisplay');
  if (typedDisplay) { typedDisplay.textContent = ''; typedDisplay.classList.add('is-empty'); }
}

// 專家模式：畫面上不鎖定特定敵人，玩家隨時打字、按 Enter 就消滅任何符合文字的敵艦
function showChineseTypingUI() {
  const hint = document.getElementById('answerHint');
  const choicesWrap = document.getElementById('answerChoices');
  const inputWrap = document.getElementById('answerInputWrap');
  const input = document.getElementById('chineseTypeInput');
  if (!hint || !choicesWrap || !inputWrap || !input) return;
  choicesWrap.style.display = 'none';
  choicesWrap.innerHTML = '';
  inputWrap.style.display = 'flex';
  hint.textContent = '看畫面上任一敵艦的國字／拼音，打出正確的字後按 Enter 消滅它';
  input.value = '';
  input.focus();
}

function handleChineseAnswer(enemy, choice, btnEl) {
  // 僅供一般模式的選字按鈕使用
  if (state !== STATE.PLAYING) return;
  if (lockedTarget !== enemy || !enemies.includes(enemy)) return; // 已消滅的敵艦，忽略舊的作答
  totalKeystrokes++;

  if (choice === enemy.word) {
    correctKeystrokes++;
    btnEl.classList.add('correct-flash');
    enemy.typed = enemy.word.length;
    const ex = enemy.x + Math.sin(enemy.wobble) * enemy.wobbleAmp;
    const ey = enemy.y;
    bullets.push(new Bullet(ex, ey));
    spawnLetterPop(ex, ey - 25, enemy.word);
    destroyEnemy(enemy);
  } else {
    // 一般模式：點錯字，扣一條命
    btnEl.classList.add('wrong-flash');
    setTimeout(() => btnEl.classList.remove('wrong-flash'), 300);
    wrongKey();
    chineseWrongAnswer();
  }
}

// 專家模式：Enter 送出打好的文字，畫面上有任何一個敵人的字符合就消滅它
function submitChineseTyping(val) {
  if (state !== STATE.PLAYING) return;
  totalKeystrokes++;
  const candidates = enemies.filter(en => en.word === val);
  if (candidates.length > 0) {
    // 有多個相同文字的敵人時，優先消滅最接近底部（最危險）的那個
    const target = candidates.reduce((a, b) => (a.y > b.y ? a : b));
    correctKeystrokes++;
    const ex = target.x + Math.sin(target.wobble) * target.wobbleAmp;
    const ey = target.y;
    bullets.push(new Bullet(ex, ey));
    spawnLetterPop(ex, ey - 25, target.word);
    target.typed = target.word.length;
    destroyEnemy(target);
  } else {
    // 專家模式：打錯字不扣命，讓學生可以安心多練習幾次
    flashInputWrong();
    wrongKey();
  }
}

// 中文模式答錯：扣一條命（僅一般模式選錯會用到）
function chineseWrongAnswer() {
  lives--;
  ship.shieldFlash = 1;
  updateHUD();
  if (lives <= 0) gameOver();
}

function flashInputWrong() {
  const input = document.getElementById('chineseTypeInput');
  if (!input) return;
  input.classList.add('wrong-flash');
  setTimeout(() => input.classList.remove('wrong-flash'), 300);
}

// 專家模式：輸入框按 Enter 送出答案（不限定特定敵人，符合的都會被消滅）
document.getElementById('chineseTypeInput')?.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  if (state !== STATE.PLAYING || category !== 'chinese' || mode !== 'expert') return;
  const val = e.target.value.trim();
  if (!val) return;
  submitChineseTyping(val);
  e.target.value = '';
});



// ── On-Screen Keyboard ────────────────────────────
const KB_LAYOUT = [
  { keys: ['`','1','2','3','4','5','6','7','8','9','0','-','='], fingers: ['p','p','r','m','i','i','i','i','m','r','p','p','p'] },
  { keys: ['Q','W','E','R','T','Y','U','I','O','P','[',']','\\'], fingers: ['p','r','m','i','i','i','i','m','r','p','p','p','p'] },
  { keys: ['A','S','D','F','G','H','J','K','L',';','\''], fingers: ['p','r','m','i','i','i','i','m','r','p','p'] },
  { keys: ['Z','X','C','V','B','N','M',',','.','/'], fingers: ['p','r','m','i','i','i','i','m','r','p'] },
  { keys: ['Space'], fingers: ['t'] }
];

const FINGER_CLASS = { p: 'f-pinky', r: 'f-ring', m: 'f-middle', i: 'f-index', t: 'f-thumb' };

// Which keys belong to which category (for highlighting)
const CAT_KEYS = {
  home:   new Set('aAssdSdDfFgGhHjJkKlL;\''.split('').concat('a','s','d','f','g','h','j','k','l',';','\'')),
  top:    new Set('qQwWeErRtTyYuUiIoOpP'.split('').concat('q','w','e','r','t','y','u','i','o','p')),
  bottom: new Set('zZxXcCvVbBnNmM,./'.split('').concat('z','x','c','v','b','n','m',',','.','/')),
  symbols: new Set('`1234567890-=[]\\;\',./ ~!@#$%^&*()_+{}|:"<>?'.split('')),
  case:   null, // all alpha
  mixed:  null, // everything
  words:  null  // everything
};

function buildKeyboard() {
  const container = document.getElementById('onscreenKB');
  container.innerHTML = '';

  for (const row of KB_LAYOUT) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'kb-row';
    for (let i = 0; i < row.keys.length; i++) {
      const key = row.keys[i];
      const finger = row.fingers[i];
      const keyEl = document.createElement('div');
      keyEl.className = `kb-key ${FINGER_CLASS[finger]}`;
      keyEl.dataset.key = key;

      if (key === 'Space') {
        keyEl.classList.add('space');
        keyEl.textContent = '⎵';
      } else {
        keyEl.textContent = key;
      }

      // Highlight keys in active category
      if (isKeyInCategory(key)) {
        keyEl.classList.add('in-range');
      }

      rowDiv.appendChild(keyEl);
    }
    container.appendChild(rowDiv);
  }
}

function isKeyInCategory(key) {
  const set = CAT_KEYS[category];
  if (!set) return true; // null = all keys
  return set.has(key) || set.has(key.toLowerCase()) || set.has(key.toUpperCase());
}

function highlightKey(ch) {
  // Remove all pressed
  document.querySelectorAll('.kb-key.pressed').forEach(k => k.classList.remove('pressed'));
  // Find matching key
  const keys = document.querySelectorAll('.kb-key');
  for (const k of keys) {
    if (k.dataset.key === ch || k.dataset.key === ch.toUpperCase() ||
        (ch === ' ' && k.dataset.key === 'Space')) {
      k.classList.add('pressed');
    }
  }
  // Auto-remove highlight
  setTimeout(() => {
    document.querySelectorAll('.kb-key.pressed').forEach(k => k.classList.remove('pressed'));
  }, 200);
}

function setKeyboardVisible(visible) {
  showKeyboard = visible;
  const kb = document.getElementById('onscreenKB');
  const btn = document.getElementById('kbToggleBtn');
  kb.style.display = visible ? 'flex' : 'none';
  btn.classList.toggle('active', visible);
  document.body.classList.toggle('kb-visible', visible);
}

// ── Typing Logic ───────────────────────────────
window.addEventListener('keydown', e => {
  if (state === STATE.MENU || state === STATE.CATEGORIES) {
    if (e.key === 'Enter') {
      if (state === STATE.MENU) goToCategories();
      else startGame();
    }
    return;
  }
  if (e.key === 'Escape') {
    if (state === STATE.PLAYING) pauseGame();
    else if (state === STATE.PAUSED) resumeGame();
    return;
  }
  if (state !== STATE.PLAYING) return;
  if (category === 'chinese') {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (mode === 'expert') return; // 專家模式透過輸入框輸入國字
    if (e.key === 'Backspace') { chinesePinyinBuffer = chinesePinyinBuffer.slice(0, -1); updateChineseLock(); e.preventDefault(); return; }
    if (e.key === 'Escape') { chinesePinyinBuffer = ''; updateChineseLock(); return; }
    if (!/^[a-zA-Z]$/.test(e.key)) return;
    chinesePinyinBuffer += e.key.toLowerCase();
    if (showKeyboard) highlightKey(e.key);
    const matches = enemies.filter(en => en.pinyinInput && en.pinyinInput === chinesePinyinBuffer);
    if (matches.length) {
      const target = matches.reduce((a,b) => a.y > b.y ? a : b);
      correctKeystrokes++;
      const ex = target.x + Math.sin(target.wobble) * target.wobbleAmp;
      bullets.push(new Bullet(ex, target.y));
      spawnLetterPop(ex, target.y - 25, target.word);
      destroyEnemy(target);
      chinesePinyinBuffer = '';
    } else if (!enemies.some(en => en.pinyinInput && en.pinyinInput.startsWith(chinesePinyinBuffer))) {
      wrongKey();
      chinesePinyinBuffer = e.key.toLowerCase();
      if (!enemies.some(en => en.pinyinInput && en.pinyinInput.startsWith(chinesePinyinBuffer))) chinesePinyinBuffer = '';
    }
    totalKeystrokes++;
    updateChineseLock();
    return;
  }
  if (e.key.length !== 1) return;

  // For case-sensitive categories, use actual key; otherwise lowercase
  const isCaseSensitive = (category === 'case' || category === 'mixed' || category === 'symbols');
  const ch = isCaseSensitive ? e.key : e.key.toLowerCase();
  totalKeystrokes++;

  // Highlight on on-screen keyboard
  if (showKeyboard) highlightKey(e.key);

  // Try to find a target
  if (!lockedTarget) {
    const candidates = enemies.filter(en => en.word[en.typed] === ch);
    if (candidates.length > 0) {
      lockedTarget = candidates.reduce((a, b) => a.y > b.y ? a : b);
    }
  }

  if (lockedTarget) {
    const expected = lockedTarget.word[lockedTarget.typed];
    if (ch === expected) {
      correctKeystrokes++;
      lockedTarget.typed++;
      typedSoFar = lockedTarget.word.slice(0, lockedTarget.typed);

      const ex = lockedTarget.x + Math.sin(lockedTarget.wobble) * lockedTarget.wobbleAmp;
      const ey = lockedTarget.y;
      bullets.push(new Bullet(ex, ey));
      spawnLetterPop(ex, ey - 25, ch);

      if (lockedTarget.typed >= lockedTarget.word.length) {
        destroyEnemy(lockedTarget);
      }
    } else {
      wrongKey();
    }
  } else {
    wrongKey();
  }

  updateTypingBar();
});

function wrongKey() {
  ctx.fillStyle = 'rgba(255,0,50,0.08)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function destroyEnemy(en) {
  const ex = en.x + Math.sin(en.wobble) * en.wobbleAmp;
  const ey = en.y;
  spawnExplosion(ex, ey, '#ff4466');
  if (en.word.length > 8) spawnExplosion(ex, ey, '#ff9933');

  let wordScore = en.word.length * 10 * wave;
  // Keyboard hidden bonus: ×1.5 (英文模式限定，中文選字模式不適用)
  if (!showKeyboard && mode === 'normal' && category !== 'chinese') {
    wordScore = Math.round(wordScore * 1.5);
  }
  score += wordScore;
  killCount++;
  scoreFloaters.push({ x: ex, y: ey - 20, val: `+${wordScore}`, life: 1 });

  enemies.splice(enemies.indexOf(en), 1);
  if (lockedTarget === en) lockedTarget = null;
  typedSoFar = '';
  updateTypingBar();
  updateHUD();
}

// Score floaters
const scoreFloaters = [];
function drawFloaters() {
  for (let i = scoreFloaters.length - 1; i >= 0; i--) {
    const f = scoreFloaters[i];
    f.y -= 1.2;
    f.life -= 0.025;
    if (f.life <= 0) { scoreFloaters.splice(i, 1); continue; }
    ctx.font = `bold 18px 'Orbitron', monospace`;
    ctx.fillStyle = `rgba(255,215,0,${f.life})`;
    ctx.shadowColor = 'rgba(255,215,0,0.7)';
    ctx.shadowBlur = 8;
    ctx.fillText(f.val, f.x, f.y);
    ctx.shadowBlur = 0;
  }
}

// ── Enemy reaches bottom ───────────────────────
function enemyReached(en) {
  lives--;
  ship.shieldFlash = 1;
  spawnExplosion(canvas.width / 2, ship.cy, '#ff0055');

  enemies.splice(enemies.indexOf(en), 1);
  if (lockedTarget === en) { lockedTarget = null; typedSoFar = ''; }
  updateHUD();

  if (lives <= 0) gameOver();
}

// ── HUD Updates ────────────────────────────────
function updateHUD() {
  document.getElementById('scoreDisplay').textContent = score.toLocaleString();
  document.getElementById('waveDisplay').textContent = wave;
  const lDiv = document.getElementById('livesDisplay');
  lDiv.innerHTML = '';
  for (let i = 0; i < maxLives; i++) {
    const icon = document.createElement('div');
    icon.className = 'life-icon' + (i >= lives ? ' lost' : '');
    lDiv.appendChild(icon);
  }
}

function updateTypingBar() {
  document.getElementById('typedText').textContent = typedSoFar;
}

// ── Game Flow ──────────────────────────────────
function goToCategories() {
  state = STATE.CATEGORIES;
  showScreen('categoryScreen');
}

function goToMenu() {
  state = STATE.MENU;
  enemies = []; bullets = []; particles = []; explosions = [];
  scoreFloaters.length = 0;
  lockedTarget = null;
  typedSoFar = '';
  setKeyboardVisible(false);
  document.getElementById('kbToggleBtn').style.display = 'none';
  document.getElementById('answerPanel').style.display = 'none';
  document.getElementById('typingBar').style.display = 'block';
  showScreen('startScreen');
  initMenuShips();
}

function startGame() {
  state = STATE.PLAYING;
  maxLives = category === 'chinese' ? 5 : 3;
  score = 0; wave = 1; lives = maxLives; killCount = 0;
  totalKeystrokes = 0; correctKeystrokes = 0;
  typedSoFar = ''; lockedTarget = null;
  enemies = []; bullets = []; particles = []; explosions = [];
  scoreFloaters.length = 0;
  nebulaCanvas = null;
  initStars();
  updateHUD();
  startWave();
  hideAllScreens();

  // Show keyboard toggle (English modes) or answer panel (Chinese mode)
  const kbBtn = document.getElementById('kbToggleBtn');
  const answerPanel = document.getElementById('answerPanel');
  const typingBar = document.getElementById('typingBar');

  if (category === 'chinese') {
    typingBar.style.display = 'none';
    answerPanel.style.display = 'flex';
    chinesePinyinBuffer = '';
    if (mode === 'expert') {
      kbBtn.style.display = 'none';
      setKeyboardVisible(false);
      showChineseTypingUI();
      document.getElementById('chineseTypeInput').placeholder = '輸入畫面上的國字，按 Enter 消滅敵艦';
    } else {
      document.getElementById('answerChoices').style.display = 'none';
      document.getElementById('answerInputWrap').style.display = 'none';
      document.getElementById('answerHint').textContent = '看國字打拼音，輸入完整拼音即可消滅敵人（不需輸入聲調）';
      kbBtn.style.display = 'block';
      buildKeyboard();
      setKeyboardVisible(true);
    }
  } else {
    answerPanel.style.display = 'none';
    typingBar.style.display = 'block';
    if (mode === 'normal') {
      kbBtn.style.display = 'block';
      buildKeyboard();
      // Start with keyboard visible for beginners by default
      setKeyboardVisible(true);
    } else {
      kbBtn.style.display = 'none';
      setKeyboardVisible(false);
    }
  }
}

function pauseGame() {
  state = STATE.PAUSED;
  showScreen('pauseScreen');
}

function resumeGame() {
  state = STATE.PLAYING;
  hideAllScreens();
}

function gameOver() {
  state = STATE.GAMEOVER;
  const acc = totalKeystrokes > 0 ? Math.round((correctKeystrokes / totalKeystrokes) * 100) : 0;
  document.getElementById('finalScore').textContent = score.toLocaleString();
  document.getElementById('finalWave').textContent = wave;
  document.getElementById('finalKills').textContent = killCount;
  document.getElementById('finalAccuracy').textContent = acc + '%';

  // Show keyboard bonus indicator
  const bonusRow = document.getElementById('kbBonusRow');
  if (mode === 'normal' && !showKeyboard && category !== 'chinese') {
    bonusRow.style.display = 'flex';
  } else {
    bonusRow.style.display = 'none';
  }

  showScreen('gameoverScreen');
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function hideAllScreens() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
}

// ── UI Buttons ─────────────────────────────────
// Mode select
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    mode = btn.dataset.mode;
  });
});

// Start screen → Category screen
document.getElementById('toCategories').addEventListener('click', goToCategories);

// Category screen buttons
document.querySelectorAll('.cat-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    category = btn.dataset.cat;
    const panel = document.getElementById('chinesePanel');
    if (panel) panel.style.display = category === 'chinese' ? 'block' : 'none';
  });
});

document.getElementById('backToMode').addEventListener('click', () => {
  state = STATE.MENU;
  showScreen('startScreen');
});

document.getElementById('startGameBtn').addEventListener('click', () => {
  if (category === 'chinese' && selectedArticleIds.size === 0) {
    alert('請至少選擇一篇文章，才能開始中文練習喔！');
    return;
  }
  startGame();
});

// ── Chinese Article Selection UI ───────────────
function buildArticleList() {
  const container = document.getElementById('articleList');
  if (!container || typeof CHINESE_ARTICLES === 'undefined') return;
  container.innerHTML = '';
  for (const art of CHINESE_ARTICLES) {
    selectedArticleIds.add(art.id); // 預設全選

    const label = document.createElement('label');
    label.className = 'article-item checked';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = true;
    input.addEventListener('change', () => {
      if (input.checked) selectedArticleIds.add(art.id);
      else selectedArticleIds.delete(art.id);
      label.classList.toggle('checked', input.checked);
    });

    const span = document.createElement('span');
    span.className = 'article-item-text';
    span.textContent = art.title;

    label.appendChild(input);
    label.appendChild(span);
    container.appendChild(label);
  }
}
buildArticleList();

document.getElementById('selectAllArticles')?.addEventListener('click', () => {
  document.querySelectorAll('#articleList input[type=checkbox]').forEach(cb => {
    if (!cb.checked) { cb.checked = true; cb.dispatchEvent(new Event('change')); }
  });
});
document.getElementById('selectNoneArticles')?.addEventListener('click', () => {
  document.querySelectorAll('#articleList input[type=checkbox]').forEach(cb => {
    if (cb.checked) { cb.checked = false; cb.dispatchEvent(new Event('change')); }
  });
});

// Pause screen
document.getElementById('resumeBtn').addEventListener('click', resumeGame);
document.getElementById('pauseMenuBtn').addEventListener('click', goToMenu);

// Game over screen
document.getElementById('restartBtn').addEventListener('click', startGame);
document.getElementById('overMenuBtn').addEventListener('click', goToMenu);

// Keyboard toggle
document.getElementById('kbToggleBtn').addEventListener('click', () => {
  setKeyboardVisible(!showKeyboard);
});

// Fullscreen toggle
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.warn('Fullscreen request failed:', err);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

const fsBtn = document.getElementById('fullscreenBtn');
if (fsBtn) {
  fsBtn.addEventListener('click', toggleFullscreen);
}

document.addEventListener('fullscreenchange', () => {
  if (fsBtn) {
    fsBtn.textContent = document.fullscreenElement ? '🗗 視窗化' : '⛶ 全螢幕';
  }
  resize();
});

// ── Wave completion ────────────────────────────
function checkWaveComplete() {
  if (!waveDone && spawnedThisWave >= waveEnemyCount && enemies.length === 0) {
    waveDone = true;
    wave++;
    updateHUD();
    setTimeout(() => {
      if (state === STATE.PLAYING) startWave();
    }, 1500);
  }
}

// ── Grid / scanlines overlay ───────────────────
function drawGrid() {
  ctx.save();
  ctx.strokeStyle = 'rgba(0,100,200,0.04)';
  ctx.lineWidth = 1;
  const spacing = 60;
  for (let x = 0; x < canvas.width; x += spacing) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += spacing) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
  ctx.restore();
}

// ── Target line ────────────────────────────────
function drawTargetLine() {
  const y = ship.cy;
  ctx.save();
  ctx.strokeStyle = 'rgba(0,245,255,0.08)';
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(canvas.width, y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// ── Main Loop ──────────────────────────────────
function gameLoop(timestamp) {
  requestAnimationFrame(gameLoop);
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  drawBackground();
  drawGrid();

  const bottomLine = ship.cy + 15;

  if (state === STATE.PLAYING) {
    trySpawn(dt);
    if (category === 'chinese') updateChineseLock();

    // Update & draw bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].update();
      if (bullets[i].life <= 0) { bullets.splice(i, 1); continue; }
      bullets[i].draw();
    }

    // Update & draw enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      enemies[i].update(dt);
      if (enemies[i].y > bottomLine) {
        enemyReached(enemies[i]);
        continue;
      }
      enemies[i].draw();
    }

    checkWaveComplete();
    drawTargetLine();
    drawShip();
    updateParticles(dt);
    drawFloaters();
  } else if (state === STATE.PAUSED || state === STATE.GAMEOVER) {
    for (const en of enemies) en.draw();
    drawShip();
  } else {
    // MENU or CATEGORIES — draw animated demo ships
    drawMenuShips(dt);
  }
}

// ── Menu animated ships ────────────────────────
let menuShips = [];
function initMenuShips() {
  menuShips = [];
  for (let i = 0; i < 6; i++) {
    const e = new Enemy(pickWord(Math.floor(Math.random() * 5) + 1), Math.random() * window.innerWidth);
    e.y = Math.random() * window.innerHeight * 0.7;
    e.speed = 0.3 + Math.random() * 0.3;
    menuShips.push(e);
  }
}
initMenuShips();

function drawMenuShips(dt) {
  for (const s of menuShips) {
    s.update(dt);
    s.draw();
    if (s.y > canvas.height + 40) {
      s.y = -40;
      s.x = Math.random() * canvas.width;
    }
  }
}

// ── Utilities ──────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Kick off ───────────────────────────────────
showScreen('startScreen');
requestAnimationFrame(gameLoop);
