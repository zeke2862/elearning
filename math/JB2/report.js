/* report.js — 學習回報（學生端）。待實測：Google 試算表收信。
 * 規則：沒有學號就不送；只送學號+勇者名+學習數據；不含真名、班級、電話。
 * 設定在 game-config.js 的 report：{enabled, url, intervalMin}。url 留空或 enabled=false 就完全不送。 */
(function(){
  var LAST='jb2-report-last',Q='jb2-report-queue';
  function now(){return Date.now()}
  function getLast(){try{return +localStorage.getItem(LAST)||0}catch(e){return 0}}
  function post(url,payload){
    return fetch(url,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});
  }
  function flush(cfg){
    var q=[];try{q=JSON.parse(localStorage.getItem(Q))||[]}catch(e){}
    if(!q.length||!cfg.url)return;
    var p=q.shift();
    post(cfg.url,p).then(function(){try{localStorage.setItem(Q,JSON.stringify(q))}catch(e){};if(q.length)flush(cfg)}).catch(function(){});
  }
  window.Report={
    send:function(cfg,payload,force){
      if(!cfg||!cfg.enabled||!cfg.url||!payload||!payload.no)return;
      var gap=(cfg.intervalMin||30)*60000;
      if(!force&&now()-getLast()<gap)return;
      try{localStorage.setItem(LAST,String(now()))}catch(e){}
      post(cfg.url,payload).catch(function(){
        try{var q=JSON.parse(localStorage.getItem(Q))||[];q=q.slice(-4);q.push(payload);localStorage.setItem(Q,JSON.stringify(q))}catch(e){}
      });
      flush(cfg);
    }
  };
})();
