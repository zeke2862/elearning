/* ============================================================
   鍵位特工：駭客美編特效（程式碼雨、標題故障、FX 開關）
   - 只做視覺，不碰遊戲邏輯
   - 打字畫面（遊戲/ETP/閃卡/小遊戲）自動安靜，不干擾答題
   - 右下角左側有 FX 開關，舊電腦可關閉；選擇會記在本機
   ============================================================ */
(function(){
  "use strict";
  var root = document.documentElement;
  var KEY = "keyagent_fx_off";
  // 這些畫面是要專心打字的，不顯示背景特效
  var QUIET_SCREENS = ["screen-onboarding","screen-game","screen-etp-test","screen-flashcard","screen-minigames"];

  function readOff(){ try{ return localStorage.getItem(KEY) === "1"; }catch(e){ return false; } }
  function writeOff(v){ try{ localStorage.setItem(KEY, v ? "1" : "0"); }catch(e){} }

  var off = readOff();
  if(off) root.classList.add("fx-off");

  /* ---------- 標題故障：把文字複製到 data-text ---------- */
  function markGlitch(){
    var els = document.querySelectorAll(".game-logo");
    for(var i=0;i<els.length;i++){
      if(!els[i].getAttribute("data-text")) els[i].setAttribute("data-text", els[i].textContent);
    }
  }

  /* ---------- 程式碼雨 ---------- */
  var canvas = document.createElement("canvas");
  canvas.id = "matrix-rain";
  document.body.appendChild(canvas);
  var ctx = canvas.getContext("2d");
  var FS = 16, cols = 0, drops = [], timer = null, last = 0;
  // 鍵盤字元 + 數字 + 片假名 + 十六進位，看起來像入侵畫面
  var CH = "01ABCDEF0123456789QWERTYUIOPASDFGHJKLZXCVBNM{}[]<>/\\|=+-*&^%$#@!ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ".split("");

  function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cols = Math.ceil(canvas.width / FS);
    drops = [];
    for(var i=0;i<cols;i++) drops[i] = Math.floor(Math.random() * -40);
    ctx.fillStyle = "#000"; ctx.fillRect(0,0,canvas.width,canvas.height);
  }

  function frame(t){
    timer = requestAnimationFrame(frame);
    if(t - last < 55) return;           // 約 18 fps，省電又有質感
    last = t;
    ctx.fillStyle = "rgba(0,0,0,0.12)";  // 拖影
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.font = FS + "px monospace";
    for(var i=0;i<cols;i++){
      if(drops[i] < 0){ drops[i]++; continue; }
      var ch = CH[Math.floor(Math.random()*CH.length)];
      var y = drops[i] * FS;
      ctx.fillStyle = (Math.random() < 0.04) ? "#d6ffe9" : "#39ff9d";
      ctx.fillText(ch, i * FS, y);
      if(y > canvas.height && Math.random() > 0.975) drops[i] = Math.floor(Math.random() * -20);
      drops[i]++;
    }
  }

  function start(){ if(!timer && !root.classList.contains("fx-off") && !root.classList.contains("fx-quiet")) timer = requestAnimationFrame(frame); }
  function stop(){ if(timer){ cancelAnimationFrame(timer); timer = null; } }

  /* ---------- 依目前畫面決定要不要安靜 ---------- */
  function syncScreen(){
    var active = document.querySelector(".screen.active");
    var quiet = !!active && QUIET_SCREENS.indexOf(active.id) !== -1;
    root.classList.toggle("fx-quiet", quiet);
    if(quiet || root.classList.contains("fx-off")) stop(); else start();
  }

  /* ---------- FX 開關按鈕 ---------- */
  var btn = document.createElement("button");
  btn.id = "fx-toggle";
  btn.type = "button";
  function paintBtn(){ btn.textContent = "FX: " + (root.classList.contains("fx-off") ? "OFF" : "ON"); }
  btn.addEventListener("click", function(){
    var nowOff = !root.classList.contains("fx-off");
    root.classList.toggle("fx-off", nowOff);
    writeOff(nowOff);
    paintBtn(); syncScreen();
  });
  paintBtn();
  document.body.appendChild(btn);

  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", function(){ if(document.hidden) stop(); else syncScreen(); });

  var app = document.getElementById("app") || document.body;
  new MutationObserver(syncScreen).observe(app, {subtree:true, attributes:true, attributeFilter:["class"]});

  markGlitch();
  resize();
  syncScreen();
})();
