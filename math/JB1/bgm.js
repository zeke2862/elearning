/* bgm.js ── 背景音樂（WebAudio 合成，不需音檔）。world-map.html 與所有關卡共用。
   BGM.play('map'|'battle'|'arena')  BGM.stop()  BGM.clang()
   靜音開關與音效共用 localStorage 的 ms-mute（1＝靜音）。 */
(function () {
  var AC = null, timer = null, kind = null, step = 0;
  var SC = { map: [0, 2, 4, 7, 9, 7, 4, 2], battle: [0, 0, 3, 5, 7, 5, 3, 0], arena: [0, 3, 7, 3, 0, 3, 7, 10] };
  var BASE = { map: 262, battle: 196, arena: 220 }, TEMPO = { map: 430, battle: 270, arena: 230 };
  function muted() { try { return localStorage.getItem('ms-mute') === '1'; } catch (e) { return false; } }
  function ctx() {
    try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) {}
    return AC;
  }
  function note(f, d, type, v) {
    var c = ctx(); if (!c) return;
    var t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0008, t + d);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + 0.02);
  }
  function tick() {
    if (muted() || document.hidden || !kind) return;
    var sc = SC[kind], b = BASE[kind], s = sc[step % sc.length];
    note(b * Math.pow(2, s / 12) * 2, 0.5, 'triangle', 0.035);
    if (step % 4 === 0) note(b / 2, 0.9, 'sine', 0.05);
    if (kind !== 'map' && step % 2 === 0) note(b * Math.pow(2, (s + 7) / 12), 0.12, 'square', 0.012);
    step++;
  }
  function stop() { clearInterval(timer); timer = null; kind = null; }
  function play(k) { if (!SC[k] || (kind === k && timer)) return; stop(); kind = k; step = 0; timer = setInterval(tick, TEMPO[k]); }
  document.addEventListener('pointerdown', function () { ctx(); }, { once: true });
  window.BGM = { play: play, stop: stop, clang: function () { if (muted()) return; note(880, 0.12, 'square', 0.06); note(1320, 0.3, 'triangle', 0.05); } };
})();
