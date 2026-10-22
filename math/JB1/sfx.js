/* sfx.js ── 全遊戲音效庫（WebAudio 現場合成，不需任何音檔，自製、無版權問題）
   用法：SND.play('click')　　SND.names() 可列出全部音效名稱
   靜音開關與 bgm.js、關卡共用 localStorage 的 ms-mute（1＝靜音）。
   world-map.html 與所有關卡共用。想換成真實錄音，把 play 裡該名稱改成播放檔案即可（見 音效清單.md）。 */
(function () {
  var AC = null, NB = null;
  function muted() { try { return localStorage.getItem('ms-mute') === '1'; } catch (e) { return false; } }
  function ctx() {
    try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) {}
    return AC;
  }
  function noiseBuf(c) {
    if (NB) return NB;
    NB = c.createBuffer(1, c.sampleRate, c.sampleRate);
    var d = NB.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return NB;
  }
  /* 音符：o(波形, 起始頻率, 結束頻率, 開始秒, 長度秒, 音量) */
  function o(type, f0, f1, t0, dur, v, c, base) {
    var os = c.createOscillator(), g = c.createGain(), t = base + t0;
    os.type = type; os.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) os.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + Math.min(0.015, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    os.connect(g); g.connect(c.destination); os.start(t); os.stop(t + dur + 0.03);
  }
  /* 雜訊：n(濾波器種類, 起始頻率, 結束頻率, 開始秒, 長度秒, 音量) */
  function n(ft, f0, f1, t0, dur, v, c, base) {
    var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = base + t0;
    s.buffer = noiseBuf(c); s.loop = true; f.type = ft; f.Q.value = 1.2;
    f.frequency.setValueAtTime(f0, t); if (f1 && f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    s.connect(f); f.connect(g); g.connect(c.destination); s.start(t); s.stop(t + dur + 0.03);
  }
  function arp(c, b, type, notes, step, len, v, t0) { notes.forEach(function (f, i) { o(type, f, 0, (t0 || 0) + i * step, len, v, c, b); }); }

  var S = {
    /* ---- 介面 ---- */
    click:   function (c, b) { o('square', 760, 520, 0, .05, .05, c, b); },
    menu:    function (c, b) { o('triangle', 520, 780, 0, .09, .07, c, b); },
    back:    function (c, b) { o('triangle', 560, 330, 0, .09, .07, c, b); },
    select:  function (c, b) { o('square', 600, 0, 0, .05, .05, c, b); o('square', 900, 0, .05, .08, .05, c, b); },
    confirm: function (c, b) { o('square', 660, 0, 0, .07, .05, c, b); o('square', 990, 0, .07, .12, .05, c, b); },
    start:   function (c, b) { arp(c, b, 'square', [392, 523, 659, 784], .07, .1, .05); },
    node:    function (c, b) { o('sine', 880, 0, 0, .3, .08, c, b); o('sine', 1320, 0, .03, .3, .04, c, b); },
    error:   function (c, b) { o('sawtooth', 210, 150, 0, .14, .06, c, b); o('sawtooth', 210, 140, .17, .2, .06, c, b); },
    toast:   function (c, b) { o('sine', 880, 1100, 0, .1, .06, c, b); },
    unlock:  function (c, b) { o('triangle', 784, 0, 0, .12, .08, c, b); o('triangle', 1175, 0, .12, .35, .08, c, b); o('sine', 2350, 0, .12, .3, .03, c, b); },
    /* ---- 買賣與獎勵 ---- */
    buy:     function (c, b) { o('square', 988, 0, 0, .06, .05, c, b); o('square', 1319, 0, .06, .3, .05, c, b); },
    coin:    function (c, b) { o('square', 988, 0, 0, .06, .05, c, b); o('square', 1319, 0, .06, .3, .05, c, b); },
    reward:  function (c, b) { arp(c, b, 'triangle', [523, 659, 784, 1047], .08, .22, .08); o('sine', 2093, 0, .3, .4, .03, c, b); },
    chest:   function (c, b) { n('bandpass', 300, 700, 0, .25, .05, c, b); o('sine', 330, 660, .05, .3, .06, c, b); arp(c, b, 'triangle', [784, 988, 1175, 1568, 1976], .07, .25, .06, .3); },
    levelup: function (c, b) { arp(c, b, 'square', [523, 659, 784, 1047, 1319], .09, .14, .05); o('triangle', 1047, 0, .45, .7, .07, c, b); o('triangle', 1319, 0, .45, .7, .05, c, b); },
    rankup:  function (c, b) { arp(c, b, 'square', [392, 523, 659, 784, 1047, 1319, 1568], .1, .16, .05); o('triangle', 1047, 0, .7, 1, .07, c, b); o('triangle', 1568, 0, .7, 1, .05, c, b); },
    clang:   function (c, b) { o('square', 1200, 1100, 0, .12, .05, c, b); o('square', 1800, 0, 0, .09, .03, c, b); n('highpass', 4000, 0, 0, .08, .04, c, b); },
    forge:   function (c, b) { [0, .22, .44].forEach(function (t) { o('square', 1200, 1100, t, .1, .05, c, b); o('square', 1800, 0, t, .08, .03, c, b); n('highpass', 4000, 0, t, .08, .04, c, b); }); },
    /* ---- 答題（關卡） ---- */
    correct: function (c, b) { o('square', 660, 0, 0, .09, .06, c, b); o('square', 880, 0, .08, .16, .06, c, b); },
    wrong:   function (c, b) { o('sawtooth', 220, 0, 0, .18, .06, c, b); o('sawtooth', 165, 0, .14, .26, .06, c, b); },
    combo:   function (c, b) { arp(c, b, 'triangle', [880, 1047, 1319, 1568, 1760, 2093], .045, .12, .05, .1); },
    timeup:  function (c, b) { [0, .2, .4].forEach(function (t) { o('square', 440, 0, t, .12, .06, c, b); }); o('sawtooth', 120, 70, .6, .35, .07, c, b); },
    wallhit: function (c, b) { n('lowpass', 900, 200, 0, .25, .12, c, b); o('sine', 110, 45, 0, .3, .14, c, b); },
    hint:    function (c, b) { o('sine', 1200, 0, 0, .12, .06, c, b); o('sine', 1600, 0, .1, .2, .06, c, b); },
    cut:     function (c, b) { n('highpass', 3000, 6000, 0, .07, .08, c, b); n('highpass', 3500, 7000, .09, .07, .08, c, b); },
    freeze:  function (c, b) { o('sine', 1800, 400, 0, .5, .06, c, b); o('triangle', 2400, 800, .05, .45, .03, c, b); n('highpass', 6000, 0, 0, .3, .03, c, b); },
    victory: function (c, b) { arp(c, b, 'square', [523, 659, 784], .12, .14, .05); o('square', 1047, 0, .36, .6, .06, c, b); o('triangle', 523, 0, .36, .6, .06, c, b); o('triangle', 784, 0, .36, .6, .05, c, b); },
    defeat:  function (c, b) { arp(c, b, 'triangle', [392, 330, 262, 196], .22, .34, .08); },
    /* ---- 對戰 ---- */
    vs:      function (c, b) { o('sine', 90, 50, 0, .7, .16, c, b); n('lowpass', 1500, 200, 0, .5, .1, c, b); o('sawtooth', 196, 0, .1, .5, .05, c, b); o('sawtooth', 294, 0, .1, .5, .04, c, b); },
    swing:   function (c, b) { n('bandpass', 400, 2400, 0, .2, .09, c, b); },
    hit:     function (c, b) { n('lowpass', 2200, 300, 0, .14, .14, c, b); o('sine', 170, 55, 0, .16, .16, c, b); },
    crit:    function (c, b) { n('lowpass', 3000, 300, 0, .18, .16, c, b); o('sine', 190, 50, 0, .2, .18, c, b); o('square', 1500, 900, 0, .15, .05, c, b); },
    cast:    function (c, b) { o('sine', 300, 1300, 0, .45, .07, c, b); o('triangle', 600, 1900, .05, .4, .04, c, b); },
    magichit:function (c, b) { n('lowpass', 2600, 300, 0, .25, .12, c, b); o('sine', 900, 180, 0, .3, .1, c, b); arp(c, b, 'triangle', [1568, 1976, 2349], .05, .15, .04, .05); },
    block:   function (c, b) { o('square', 1900, 1500, 0, .05, .07, c, b); o('square', 2400, 0, 0, .04, .04, c, b); n('highpass', 5000, 0, 0, .05, .06, c, b); o('sine', 260, 140, 0, .1, .08, c, b); },
    shield:  function (c, b) { o('sine', 400, 950, 0, .3, .08, c, b); o('triangle', 1200, 0, .15, .25, .05, c, b); },
    guard:   function (c, b) { n('lowpass', 800, 250, 0, .12, .09, c, b); o('sine', 220, 150, 0, .14, .09, c, b); },
    heal:    function (c, b) { arp(c, b, 'sine', [523, 659, 784, 1047], .09, .3, .07); },
    buff:    function (c, b) { arp(c, b, 'square', [440, 554, 659], .06, .1, .04); },
    debuff:  function (c, b) { arp(c, b, 'square', [659, 554, 440], .06, .12, .04); },
    poison:  function (c, b) { [0, .07, .15, .21, .3].forEach(function (t, i) { o('sine', 140 + i * 40, 260 + i * 30, t, .09, .07, c, b); }); },
    blind:   function (c, b) { n('highpass', 5000, 800, 0, .35, .07, c, b); o('sine', 1800, 300, 0, .3, .03, c, b); },
    ko:      function (c, b) { o('sine', 420, 60, 0, .7, .12, c, b); n('lowpass', 1200, 150, 0, .5, .08, c, b); },
    /* ---- 休息小遊戲 ---- */
    'minigame-start': function (c, b) { o('square', 330, 660, 0, .12, .05, c, b); o('square', 494, 988, .1, .14, .05, c, b); arp(c, b, 'square', [784, 988, 1175], .07, .1, .04, .24); },
    'minigame-win':   function (c, b) { arp(c, b, 'square', [659, 784, 988, 1319], .08, .13, .05); o('triangle', 1319, 0, .34, .6, .07, c, b); }
  };
  var last = {};
  window.SND = {
    play: function (name) {
      if (muted() || document.hidden || !S[name]) return;
      var t = Date.now(); if (last[name] && t - last[name] < 45) return; last[name] = t;   // 同一個音 45 毫秒內不重複疊
      var c = ctx(); if (!c) return;
      try { S[name](c, c.currentTime + 0.005); } catch (e) {}
    },
    names: function () { return Object.keys(S); }
  };
  document.addEventListener('pointerdown', function () { ctx(); }, { once: true });
})();
