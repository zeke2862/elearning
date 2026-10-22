/* bgm.js ── 背景音樂。world-map.html 與所有關卡共用。
   BGM.play('map'|'lobby'|'arena'|'battle')  BGM.play('stage-1-1','battle')  BGM.stop()  BGM.clang()

   ★ 有音檔就播音檔，沒有就自動用內建合成音樂（不會壞）：
     audio/bgm/<名稱>.mp3     例：audio/bgm/lobby.mp3、audio/bgm/stage-I-1-1.mp3
     名稱清單與提示詞請看「背景音樂提示詞.md」。檔名一律英數。
   靜音開關與音效共用 localStorage 的 ms-mute（1＝靜音）。 */
(function () {
  var AC = null, timer = null, kind = null, sk = null, step = 0, audio = null, aTimer = null, failed = {}, DIR = 'audio/bgm/', VOL = 0.5;
  var SC = { map: [0, 2, 4, 7, 9, 7, 4, 2], lobby: [0, 4, 7, 12, 9, 7, 4, 2], battle: [0, 0, 3, 5, 7, 5, 3, 0], arena: [0, 3, 7, 3, 0, 3, 7, 10] };
  var BASE = { map: 262, lobby: 330, battle: 196, arena: 220 }, TEMPO = { map: 430, lobby: 520, battle: 270, arena: 230 };
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
    if (muted() || document.hidden || !sk) return;
    var sc = SC[sk], b = BASE[sk], s = sc[step % sc.length];
    note(b * Math.pow(2, s / 12) * 2, 0.5, 'triangle', 0.035);
    if (step % 4 === 0) note(b / 2, 0.9, 'sine', 0.05);
    if (sk !== 'map' && sk !== 'lobby' && step % 2 === 0) note(b * Math.pow(2, (s + 7) / 12), 0.12, 'square', 0.012);
    step++;
  }
  function stopSynth() { clearInterval(timer); timer = null; sk = null; }
  function stopFile() { clearInterval(aTimer); aTimer = null; if (audio) { try { audio.pause(); audio.src = ''; } catch (e) {} audio = null; } }
  function stop() { stopSynth(); stopFile(); kind = null; }
  function startSynth(k) { if (!SC[k]) return; stopSynth(); sk = k; step = 0; timer = setInterval(tick, TEMPO[k]); }
  function fallback(k, fb) { stopFile(); if (kind === k) startSynth(SC[fb] ? fb : (SC[k] ? k : 'battle')); }
  function play(k, fb) {
    if (!k || (kind === k && (timer || audio))) return;
    stop(); kind = k;
    if (failed[k]) { startSynth(SC[fb] ? fb : (SC[k] ? k : 'battle')); return; }
    try {
      var a = new Audio(DIR + k + '.mp3'); audio = a; a.loop = true; a.volume = VOL; a.preload = 'auto';
      a.addEventListener('error', function () { failed[k] = 1; fallback(k, fb); });
      var p = a.play();
      if (p && p.catch) p.catch(function (err) {
        if (err && err.name === 'NotAllowedError') {   // 瀏覽器要求先點一下畫面才能出聲：點了再播
          document.addEventListener('pointerdown', function () { if (audio === a) a.play().catch(function () {}); }, { once: true });
        } else { failed[k] = 1; fallback(k, fb); }
      });
      aTimer = setInterval(function () { if (audio) audio.muted = muted() || document.hidden; }, 400);
    } catch (e) { failed[k] = 1; startSynth(SC[fb] ? fb : (SC[k] ? k : 'battle')); }
  }
  document.addEventListener('pointerdown', function () { ctx(); }, { once: true });
  window.BGM = { play: play, stop: stop, clang: function () { if (window.SND) return SND.play('clang'); if (muted()) return; note(880, 0.12, 'square', 0.06); note(1320, 0.3, 'triangle', 0.05); } };
})();
