/* rig.js ── 分層角色揮劍模組（身體 + 可旋轉的手臂與劍）
   用法：
     var r = JBRig.create(stageEl, { body:'images/rig-body.png', arm:'images/rig-arm.png', params:{...}, flip:false });
     r.swing(function(){ ...命中瞬間... }, function(){ ...收招結束... });
     r.set(params)        // 即時改參數（校準面板用）
     r.getParams()        // 目前參數（可貼回 game-config.js 的 rig 區段）
   參數意義（全部是比例，不是像素，所以任何畫面大小都通用）：
     shoulderX/Y  身體上「斷臂圓形」的圓心，佔身體圖的 寬/高 比例
     pivotX/Y     手臂圖上「肩甲圓心」，佔手臂圖的 寬/高 比例（也是旋轉的轉軸）
     armScale     手臂圖寬度 ÷ 身體圖寬度
     height       身體高度，佔舞台寬度的 %
     restAngle/raiseAngle/slashAngle  待機／舉劍／下劈 的角度（負＝往上，正＝往下）
     raiseMs/slashMs/backMs           三段動作的毫秒數
     tipX/tipY, guardX/guardY         劍尖、護手在手臂圖的位置（算劍光弧線用，一般不用動）
*/
(function (g) {
  var DEF = {
    height: 72, shoulderX: 0.6945, shoulderY: 0.40,
    pivotX: 0.165, pivotY: 0.482, armScale: 1.86,
    restAngle: 0, raiseAngle: -72, slashAngle: 58,
    raiseMs: 260, slashMs: 130, backMs: 300,
    tipX: 545, tipY: 167, guardX: 332, guardY: 372, trail: 1
  };
  var AW = 576, AH = 488, BW = 312, BH = 900;     // 圖檔原始尺寸（身體 312×900、手臂 576×488）

  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function merge(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) if (b[k] != null && !isNaN(b[k])) o[k] = +b[k]; return o; }

  function create(stage, opt) {
    opt = opt || {};
    var P = merge(DEF, opt.params || {});
    var rig = document.createElement('div');
    rig.className = 'jbrig' + (opt.breathe === false ? '' : ' breathe');
    var body = new Image(); body.className = 'jbrig-body'; body.src = opt.body; body.alt = '';
    var wrap = document.createElement('div'); wrap.className = 'jbrig-arm';
    var arm = new Image(); arm.src = opt.arm; arm.alt = ''; wrap.appendChild(arm);
    var inn = document.createElement('div'); inn.className = 'jbrig-in';
    inn.appendChild(body); inn.appendChild(wrap); rig.appendChild(inn);
    var cv = document.createElement('canvas'); cv.className = 'jbrig-trail';
    stage.appendChild(rig); stage.appendChild(cv);
    if (opt.flip) rig.style.transform = 'translateX(-50%) scaleX(-1)';

    var ang = P.restAngle, busy = false, hist = [], fadeRaf = 0;

    function layout() {
      rig.style.height = P.height + 'cqw';
      rig.style.left = (opt.x != null ? opt.x : '50%');
      rig.style.bottom = (opt.bottom != null ? opt.bottom : '10%');
      var wPct = P.armScale * 100, hPct = wPct * AH / AW;
      wrap.style.left = (P.shoulderX * 100) + '%';
      wrap.style.top = (P.shoulderY * 100) + '%';
      wrap.style.width = wPct + '%';
      wrap.style.marginLeft = (-wPct * P.pivotX) + '%';
      wrap.style.marginTop = (-hPct * P.pivotY) + '%';
      wrap.style.transformOrigin = (P.pivotX * 100) + '% ' + (P.pivotY * 100) + '%';
      draw(ang);
    }
    function draw(a) { ang = a; wrap.style.transform = 'rotate(' + a + 'deg)'; }

    /* 把手臂圖上的一個點（像素）換成舞台上的座標（px），考慮目前旋轉角 */
    function toStage(px, py, a) {
      var rb = rig.getBoundingClientRect(), sb = stage.getBoundingClientRect();
      var bodyW = rb.height * BW / BH;                       // 身體圖顯示寬度
      var s = (bodyW * P.armScale) / AW;                     // 手臂圖每個像素 = 多少 CSS px
      var vx = (px - P.pivotX * AW) * s, vy = (py - P.pivotY * AH) * s;
      var r = a * Math.PI / 180, c = Math.cos(r), sn = Math.sin(r);
      var ox = rb.left - sb.left + (opt.flip ? rb.width - P.shoulderX * bodyW : P.shoulderX * bodyW);
      var oy = rb.top - sb.top + P.shoulderY * rb.height;
      var fx = opt.flip ? -1 : 1;
      return { x: ox + fx * (vx * c - vy * sn), y: oy + (vx * sn + vy * c) };
    }
    function sample(t, a) {
      var tip = toStage(P.tipX, P.tipY, a);
      var gx = P.guardX + (P.tipX - P.guardX) * 0.38, gy = P.guardY + (P.tipY - P.guardY) * 0.38;
      var ib = toStage(gx, gy, a);
      hist.push({ t: t, a: tip, b: ib });
    }
    /* 劍光：把「劍尖軌跡」和「劍身近護手處軌跡」之間的面積填起來，越舊越淡 */
    function paintTrail(now, life) {
      var sb = stage.getBoundingClientRect(), dpr = Math.min(2, g.devicePixelRatio || 1);
      if (cv.width !== Math.round(sb.width * dpr)) { cv.width = Math.round(sb.width * dpr); cv.height = Math.round(sb.height * dpr); }
      var x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, sb.width, sb.height);
      while (hist.length && now - hist[0].t > life) hist.shift();
      if (hist.length < 2 || !P.trail) return;
      x.globalCompositeOperation = 'lighter';
      for (var i = 1; i < hist.length; i++) {
        var h0 = hist[i - 1], h1 = hist[i], age = 1 - Math.min(1, (now - h1.t) / life);
        x.beginPath(); x.moveTo(h0.a.x, h0.a.y); x.lineTo(h1.a.x, h1.a.y); x.lineTo(h1.b.x, h1.b.y); x.lineTo(h0.b.x, h0.b.y); x.closePath();
        var gr = x.createLinearGradient(h1.a.x, h1.a.y, h1.b.x, h1.b.y);
        gr.addColorStop(0, 'rgba(255,252,235,' + (0.9 * age) + ')');
        gr.addColorStop(0.55, 'rgba(255,214,150,' + (0.4 * age) + ')');
        gr.addColorStop(1, 'rgba(255,170,100,0)');
        x.fillStyle = gr; x.fill();
        x.beginPath(); x.moveTo(h0.a.x, h0.a.y); x.lineTo(h1.a.x, h1.a.y);
        x.strokeStyle = 'rgba(255,255,255,' + (0.95 * age) + ')'; x.lineWidth = 3; x.lineCap = 'round'; x.stroke();
      }
    }
    function fade() {
      cancelAnimationFrame(fadeRaf);
      (function f(now) { paintTrail(now, 260); if (hist.length) fadeRaf = requestAnimationFrame(f); else paintTrail(now, 260); })(performance.now());
    }

    function swing(onHit, onEnd, rate) {
      if (busy) { onEnd && onEnd(); return; }
      busy = true; rate = rate || 1; hist = [];
      var legs = [
        { from: P.restAngle, to: P.raiseAngle, ms: P.raiseMs / rate, hit: false },
        { from: P.raiseAngle, to: P.slashAngle, ms: P.slashMs / rate, hit: true },
        { from: P.slashAngle, to: P.restAngle, ms: P.backMs / rate, hit: false }
      ], i = 0;
      (function run() {
        if (i >= legs.length) { busy = false; fade(); onEnd && onEnd(); return; }
        var L = legs[i++], t0 = performance.now();
        if (L.hit) onHit && onHit();
        (function step(now) {
          var p = Math.min(1, (now - t0) / L.ms), prevA = ang, prevT = step.t || t0;
          draw(L.from + (L.to - L.from) * ease(p));
          if (L.hit) {   // 每一幀之間再插 6 個點，弧線才會圓滑
            for (var j = 1; j <= 6; j++) sample(prevT + (now - prevT) * j / 6, prevA + (ang - prevA) * j / 6);
            paintTrail(now, 260);
          }
          step.t = now;
          if (p < 1) requestAnimationFrame(step); else run();
        })(t0);
      })();
    }

    layout();
    return {
      el: rig, swing: swing, setAngle: function (a) { draw(a); },
      set: function (p) { P = merge(P, p); layout(); },
      getParams: function () { var o = {}; for (var k in DEF) o[k] = P[k]; return o; },
      anchor: function () { return toStage(P.pivotX * AW, P.pivotY * AH, ang); },
      isBusy: function () { return busy; },
      destroy: function () { rig.remove(); cv.remove(); }
    };
  }

  g.JBRig = { create: create, DEFAULT: DEF };
  /* 共用樣式：只注入一次 */
  if (!document.getElementById('jbrig-css')) {
    var st = document.createElement('style'); st.id = 'jbrig-css';
    st.textContent =
      '.jbrig{position:absolute;transform:translateX(-50%)}' +
      '.jbrig-in{position:relative;display:inline-block;height:100%;vertical-align:top}' +
      '.jbrig-body{height:100%;width:auto;max-width:none;display:block;filter:drop-shadow(0 6px 7px #0008)}' +
      '.jbrig-arm{position:absolute;aspect-ratio:576/488;will-change:transform}' +
      '.jbrig-arm img{width:100%;display:block;filter:drop-shadow(0 4px 5px #0007)}' +
      '.jbrig.breathe .jbrig-in{animation:jbrig-br 3.2s ease-in-out infinite;transform-origin:50% 100%}' +
      '@keyframes jbrig-br{50%{transform:scaleY(1.02)}}' +
      '.jbrig-trail{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none}';
    document.head.appendChild(st);
  }
})(window);
