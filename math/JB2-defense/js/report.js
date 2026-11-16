/* 學習回報：把每一關的結果（答對率、題型、星數、時間）和進度傳到老師的 Google 試算表
   設定在 js/game-config.js 的 report.url（Apps Script 網頁應用程式網址）；沒填就完全不送。
   只送：學號、勇者名、關卡成績、各題型對錯數、星數進度。不送真名、不送答題內容。
   沒網路時先存在這台裝置，連上網再補送。 */
(function () {
  const G = window.G, QK = "md_report_queue_v1";
  const conf = () => (window.GAME_CONFIG && window.GAME_CONFIG.report) || {};
  const hub = () => (G.S && G.S.hub) || {};
  const on = () => !!(conf().url && hub().sid);
  const load = () => { try { return JSON.parse(localStorage.getItem(QK)) || []; } catch (e) { return []; } };
  const store = (q) => { try { localStorage.setItem(QK, JSON.stringify(q.slice(-200))); } catch (e) {} };
  let flushing = false;

  async function flush() {
    if (!on() || flushing) return;
    flushing = true;
    try {
      let q = load();
      while (q.length) {
        // text/plain + no-cors：不會觸發預檢，Apps Script 收得到；送出成功就從佇列拿掉
        await fetch(conf().url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(q[0]) });
        q = load(); q.shift(); store(q);
      }
    } catch (e) { /* 沒網路：留在佇列，下次再送 */ }
    flushing = false;
  }
  const send = (payload) => {
    if (!on()) return;
    const q = load();
    q.push({ key: conf().key || "", sid: String(hub().sid), name: hub().name || "", at: new Date().toISOString(), ...payload });
    store(q);
    flush();
  };

  // 目前進度快照：總星數、通關關數、各章星數、各關星數、待複習怪物
  function snapshot() {
    const nodes = {}, ch = [];
    let total = 0, cleared = 0;
    for (let c = 1; c <= 6; c++) {
      const d = window.CH_DATA && window.CH_DATA["jb2_ch" + c];
      let cs = 0;
      const list = d ? d.nodes : (G.CAT.chapters["jb2_ch" + c] || { nodes: [] }).nodes.map((id) => ({ id }));
      list.forEach((n) => { const s = G.nodeState(n.id).stars || 0; nodes[n.id.replace("jb2_", "")] = s; cs += s; if (s > 0) cleared += 1; });
      ch.push(cs); total += cs;
    }
    return { type: "snap", total, cleared, ch, nodes, pending: G.monstersDue().length + G.monstersSleeping(), streak: G.S.streak ? G.S.streak.count : 0 };
  }
  G.reportSnapshot = () => send(snapshot());

  // 每一關結束：關卡成績 + 各題型的對錯數
  const _fin = G.finishStage;
  G.finishStage = (node, r) => {
    const out = _fin(node, r);
    try {
      const types = {};
      (r.results || []).forEach((x) => {
        const t = String(x.key).split("|").pop(); // 「關卡:題型」
        const e = types[t] || (types[t] = [0, 0]);
        e[0] += 1; if (x.ok) e[1] += 1;
      });
      const m = /^jb2_(\d+)_(\d+)_(\d+)$/.exec(node.id) || [];
      send({ type: "level", ch: +m[1] || 0, stage: m.length ? `${m[1]}-${m[2]}-${m[3]}` : node.id, mode: r.monster ? "monster" : (r.mode || ""), correct: r.correct || 0, total: r.total || 0,
        stars: r.stars || 0, cleared: !!r.cleared, seconds: Math.round(r.seconds || 0), hints: r.hints || 0, types });
      send(snapshot());
    } catch (e) { /* 回報失敗不影響遊戲 */ }
    return out;
  };

  // 開大地圖時順便回報進度、補送沒送出的
  const _hub = G.openHub;
  if (_hub) G.openHub = () => { _hub(); setTimeout(() => { if (on()) { G.reportSnapshot(); flush(); } }, 1500); };
  window.addEventListener("online", flush);
  setTimeout(flush, 3000);
  G.reportFlush = flush;
})();
