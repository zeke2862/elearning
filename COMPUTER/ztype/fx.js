/* ZFX：看打射擊練習的音效與背景音樂（全部用 WebAudio 合成，不需要音檔）
 * 用法：ZFX.sfx('hit'|'shoot'|'kill'|'wrong'|'hurt'|'wave'|'horde'|'clear'|'over')
 *       ZFX.bgmStart() / ZFX.bgmStop() / ZFX.bgmPause() / ZFX.bgmResume() / ZFX.setIntense(true|false)
 *       右上角有 🔊/🔇 按鈕可以開關（記在 localStorage ztype_sound_v1）
 */
(function () {
  var KEY = 'ztype_sound_v1';
  var ctx = null, master = null, musicG = null, sfxG = null, noiseBuf = null;
  var on = true;
  try { on = localStorage.getItem(KEY) !== '0'; } catch (e) {}
  var playing = false, paused = false, intense = false, timer = null, nextT = 0, step = 0;

  function ensure() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = on ? 0.9 : 0; master.connect(ctx.destination);
    musicG = ctx.createGain(); musicG.gain.value = 0.16; musicG.connect(master);
    sfxG = ctx.createGain(); sfxG.gain.value = 0.5; sfxG.connect(master);
    var len = ctx.sampleRate * 0.5, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    noiseBuf = b;
    return ctx;
  }
  function unlock() { var c = ensure(); if (c && c.state === 'suspended') c.resume(); }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, unlock, { passive: true }); });

  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function tone(type, f0, f1, t, dur, vol, dest) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || sfxG);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(t, dur, vol, hp, dest) {
    var s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = hp || 800;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || sfxG);
    s.start(t); s.stop(t + dur + 0.05);
  }

  var lastHit = 0, combo = 0;
  var SFX = {
    shoot: function (t) {           // 打對一個字：勇者揮出劍氣（連續打對音調會慢慢升高）
      var now = performance.now(); combo = (now - lastHit < 900) ? Math.min(combo + 1, 10) : 0; lastHit = now;
      var f = 520 * Math.pow(2, combo / 12 * 2);
      tone('triangle', f, f * 1.6, t, 0.09, 0.28);
      noise(t, 0.05, 0.08, 3000);
    },
    kill: function (t) {            // 擊倒衛兵
      noise(t, 0.22, 0.32, 500);
      tone('square', 330, 110, t, 0.2, 0.18);
      tone('triangle', 660, 1320, t + 0.04, 0.16, 0.2);
    },
    wrong: function (t) { tone('square', 150, 100, t, 0.14, 0.16); },
    hurt: function (t) {            // 勇者受傷
      tone('sawtooth', 220, 55, t, 0.35, 0.34);
      noise(t, 0.3, 0.28, 200);
    },
    wave: function (t) { [0, 4, 7, 12].forEach(function (s, i) { tone('triangle', mtof(69 + s), 0, t + i * 0.09, 0.2, 0.22); }); },
    horde: function (t) {
      tone('sawtooth', 110, 98, t, 0.7, 0.3); tone('sawtooth', 165, 147, t, 0.7, 0.2);
      tone('square', 110, 110, t + 0.35, 0.5, 0.16);
    },
    clear: function (t) { [0, 4, 7, 12, 16].forEach(function (s, i) { tone('triangle', mtof(72 + s), 0, t + i * 0.1, 0.28, 0.24); }); },
    over: function (t) { [0, -3, -5, -8, -12].forEach(function (s, i) { tone('sawtooth', mtof(64 + s), 0, t + i * 0.22, 0.4, 0.22); }); }
  };
  function sfx(name) {
    if (!on) return;
    var c = ensure(); if (!c) return;
    if (c.state === 'suspended') c.resume();
    try { SFX[name] && SFX[name](c.currentTime + 0.005); } catch (e) {}
  }

  // ---- 背景音樂：Am F C G 循環，低音＋琶音；大軍時加快並加入鼓點 ----
  var CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
  var ARP = [0, 1, 2, 1, 2, 1, 2, 1];
  function schedule() {
    if (!playing || paused || !ctx) return;
    var spb = 60 / (intense ? 132 : 100) / 2;   // 八分音符長度
    while (nextT < ctx.currentTime + 0.35) {
      var bar = Math.floor(step / 8) % 4, k = step % 8, ch = CH[bar];
      if (k === 0 || k === 4) tone('sine', mtof(ch[0] - 12), 0, nextT, spb * 1.8, 0.9, musicG);
      tone('triangle', mtof(ch[ARP[k]] + 12), 0, nextT, spb * 0.9, 0.5, musicG);
      if (k === 0 && bar % 2 === 0) tone('sine', mtof(ch[2] + 12), 0, nextT, spb * 7, 0.18, musicG);
      if (intense) {
        if (k % 4 === 0) { tone('sine', 120, 45, nextT, 0.14, 1.0, musicG); }
        if (k % 2 === 1) noise(nextT, 0.04, 0.22, 7000, musicG);
      } else if (k === 4) noise(nextT, 0.05, 0.1, 6000, musicG);
      nextT += spb; step++;
    }
  }
  function bgmStart() {
    var c = ensure(); if (!c) return;
    if (c.state === 'suspended') c.resume();
    playing = true; paused = false; step = 0; nextT = c.currentTime + 0.1;
    clearInterval(timer); timer = setInterval(schedule, 100); schedule();
  }
  function bgmStop() { playing = false; clearInterval(timer); timer = null; }
  function bgmPause() { paused = true; }
  function bgmResume() { if (!playing || !ctx) return; paused = false; nextT = ctx.currentTime + 0.1; }

  // ---- 右上角開關 ----
  function addButton() {
    if (document.getElementById('zfxBtn') || !document.body) return;
    var b = document.createElement('button');
    b.id = 'zfxBtn'; b.type = 'button'; b.title = '音效／音樂開關';
    b.style.cssText = 'position:fixed;right:10px;bottom:10px;z-index:60;width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.35);background:rgba(0,0,0,.55);color:#fff;font-size:20px;cursor:pointer;opacity:.75';
    function paint() { b.textContent = on ? '🔊' : '🔇'; }
    b.onclick = function () {
      on = !on; try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
      ensure(); if (master) master.gain.value = on ? 0.9 : 0; paint(); unlock(); b.blur();
    };
    paint(); document.body.appendChild(b);
  }
  if (document.body) addButton(); else document.addEventListener('DOMContentLoaded', addButton);

  window.ZFX = { sfx: sfx, bgmStart: bgmStart, bgmStop: bgmStop, bgmPause: bgmPause, bgmResume: bgmResume, setIntense: function (v) { intense = !!v; }, unlock: unlock };
})();
