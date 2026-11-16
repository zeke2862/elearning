/* 跟朋友對戰（取自 JB2V2 battle-vol2.html 的連線部分）
   兩種玩法：⚡ 即時對戰（雙方都在線，Supabase 即時同步，對手離線會由系統代打，太久判認輸）、
             👻 雲端幽靈（對方不用在線，抓他存在雲端的出戰隊伍，由 AI 操作）。
   學號前面加 v2_ 跟 JB2V2 國一下共用同一套雲端資料；只收學號＋勇者名。
   注意：資料表的權限（RLS）要在 Supabase 後台設好；這個檔案裡的 anon key 是公開金鑰，設計給前端用。 */
(function () {
  const G = window.G, h = G.h;
  const SUPABASE_URL = "https://qkejjznejmxcfiyxviid.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZWpqem5lam14Y2ZpeXh2aWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MjYyODQsImV4cCI6MjEwNjEwMjI4NH0.TBzTQ98emolzRoPaBDDGRpTW8ZkDCGoOstUTfmcrWco";
  let sb = null;
  try { if (window.supabase) sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); } catch (e) { console.warn("Supabase 初始化失敗，朋友對戰停用", e); }
  const O = (G.online = { ready: () => !!sb });
  const PREFIX = "v2_";
  const hub = () => (G.S.hub = G.S.hub || {});
  const mySid = () => (hub().sid ? PREFIX + String(hub().sid).trim() : null);
  const API = () => G.DuelAPI;
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const winnerName = (work, r) => (r.winnerSide === "draw" ? "draw" : work[r.winnerSide].name);
  O.sid = mySid;
  const bump = (id, field) => {
    if (!sb || !id) return;
    const fn = field === "wins" ? "bump_duel_win" : field === "losses" ? "bump_duel_loss" : "bump_duel_draw";
    sb.rpc(fn, { p_sid: id }).then(() => {}).catch(() => {});
  };
  const specOf = (x) => ({ id: x.id, level: x.level, sk: x.sk || [] });
  // 我的出戰隊伍（雲端幽靈用）：活著的前 3 隻
  async function defaultTeam() { const mine = await API().loadMons(); return mine.filter((x) => !(x.hp <= 0)).slice(0, 3); }
  O.syncUser = async () => {
    if (!sb || !mySid()) return;
    try {
      const team = (await defaultTeam()).map(specOf);
      const lv = Math.max(1, ...team.map((x) => x.level));
      const r = await sb.from("duel_users").upsert({ student_number: mySid(), name: hub().name || mySid(), level: lv, stats: { team }, updated_at: new Date().toISOString() });
      if (r && r.error) console.warn("duel_users 上傳失敗", r.error);
    } catch (e) { console.warn("duel_users 上傳失敗", e); }
  };
  const mySideOf = (picks) => { const s = API().makeSide(hub().name || mySid(), picks); s.studentId = mySid(); return s; };

  /* ---------- 雲端幽靈 ---------- */
  O.challengeCloud = async (typed, picks) => {
    if (!sb) return G.toast("連不上雲端");
    const osid = PREFIX + typed;
    G.toast("查詢中…");
    const { data: op, error } = await sb.from("duel_users").select("*").eq("student_number", osid).maybeSingle();
    if (error) return G.toast("連線雲端失敗");
    if (!op) return G.toast("找不到這位同學的資料（他要先用過對戰功能）");
    const team = (op.stats && op.stats.team) || [];
    const b = API().makeSide(op.name || osid, team);
    if (!b.team.length) return G.toast("這位同學還沒有出戰隊伍");
    const a = mySideOf(picks);
    const room = { a, b, turn: null, over: false, log: [`⚔️ ${a.name} 挑戰了 ${b.name} 的雲端幽靈！`] };
    room.turn = API().nextTurn(room);
    API().battleUI({ room, me: "a", mode: "cloud", foeTag: "👻",
      onSettle: (w) => { const id = mySid(); if (w === "a") { bump(id, "wins"); bump(osid, "losses"); } else if (w === "b") { bump(id, "losses"); bump(osid, "wins"); } else { bump(id, "draws"); bump(osid, "draws"); } } });
  };

  /* ---------- 即時對戰 ---------- */
  let state = null; // {battleId, room, ctrl, channel, watchdog, absentSince, proxyBusy}
  const PROXY_GRACE = 8000, FORFEIT = 90000, RESUME_WINDOW = 300000;
  function stopState() {
    if (!state) return;
    if (state.watchdog) clearInterval(state.watchdog);
    if (state.channel) { try { sb.removeChannel(state.channel); } catch (e) {} }
    state = null;
  }
  O.challengeSync = async (typed, picks) => {
    if (!sb) return G.toast("連不上雲端");
    const sid = mySid(), osid = PREFIX + typed;
    G.toast("查詢中…");
    const { data: op, error } = await sb.from("duel_users").select("*").eq("student_number", osid).maybeSingle();
    if (error) return G.toast("連線雲端失敗");
    if (!op) return G.toast("找不到這位同學的資料（他要先用過對戰功能）");
    const a = mySideOf(picks);
    const { data: battle, error: e2 } = await sb.from("duel_battles").insert({ mode: "sync", a_id: sid, b_id: osid, a, b: null, turn: null, over: false, winner: null, log: [`⚔️ ${a.name} 發起了挑戰，等待 ${op.name || typed} 加入！`] }).select().single();
    if (e2 || !battle) return G.toast("❗ 建立對戰失敗，請再試一次");
    await sb.from("duel_pending").upsert({ target_id: osid, battle_id: battle.id });
    enterSync(battle.id);
  };
  async function acceptSync(battleId) {
    const sid = mySid(), team = await defaultTeam();
    if (!team.length) return G.toast("你的數靈都倒下了，先到「🩹 隊伍」治療");
    const { data: room } = await sb.from("duel_battles").select("*").eq("id", battleId).maybeSingle();
    if (!room || room.b) return G.toast("這場對戰已經結束或已經開始了");
    if (!room.a || !room.a.team) return G.toast("對方用的是舊版對戰，請他重新發起挑戰");
    const b = mySideOf(team);
    const turn = API().nextTurn({ a: room.a, b });
    await sb.from("duel_battles").update({ b, turn, log: [...(room.log || []), `${b.name} 加入戰場！⚔️ 對戰開始！`], updated_at: new Date().toISOString() }).eq("id", battleId);
    await sb.from("duel_pending").delete().eq("target_id", sid);
    enterSync(battleId);
  }
  const meOf = (room) => (room.a_id === mySid() ? "a" : room.b_id === mySid() ? "b" : null);
  function view() { // 依目前 room 畫畫面：還在等人就顯示等待
    if (!state) return;
    const room = state.room;
    if (!room) return;
    if (!room.b) {
      let root = API().getRoot();
      if (!root) { root = h("div", { class: "dl-root" }); document.body.append(root); API().setRoot(root); }
      root.innerHTML = "";
      root.append(h("div", { class: "dl-setup" }, h("h2", {}, "⏳ 等同學接受挑戰…"), h("p", {}, "對方打開遊戲、進到大地圖就會收到邀請。"), h("button", { class: "btn ghost", onclick: async () => { const id = state && state.battleId; if (id) { await sb.from("duel_pending").delete().eq("battle_id", id); await sb.from("duel_battles").delete().eq("id", id).is("b", null); } stopState(); API().closeDuel(); } }, "取消")));
      return;
    }
    if (!state.ctrl) {
      state.ctrl = API().battleUI({ room, me: meOf(room), mode: "sync", foeTag: "👤", send: sendAction, banner: bannerText, onClose: () => { stopState(); } });
    } else state.ctrl.setRoom(room);
  }
  async function loadRoom(id) {
    const { data: room } = await sb.from("duel_battles").select("*").eq("id", id).maybeSingle();
    if (!state || state.battleId !== id) return;
    if (!room) { G.toast("⚠️ 對戰資料不見了"); stopState(); API().closeDuel(); return; }
    state.room = room; view();
  }
  function enterSync(battleId) {
    stopState();
    state = { battleId, room: null, ctrl: null, absentSince: null, proxyBusy: false };
    API().setRoot(API().getRoot() || (() => { const r = h("div", { class: "dl-root" }); document.body.append(r); return r; })());
    loadRoom(battleId);
    state.channel = sb.channel("battle-" + battleId, { config: { presence: { key: mySid() } } })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "duel_battles", filter: "id=eq." + battleId }, (p) => { if (state && state.battleId === battleId) { state.room = p.new; view(); } })
      .on("presence", { event: "sync" }, watchTick)
      .subscribe((status) => { if (status === "SUBSCRIBED") { state && state.channel.track({ sid: mySid(), t: Date.now() }); loadRoom(battleId); } });
    state.watchdog = setInterval(watchTick, 1000);
  }
  async function sendAction(kind, arg) {
    const room = state.room, mine = meOf(room);
    if (!room || room.turn !== mine || room.over) return null;
    const work = { a: clone(room.a), b: clone(room.b) };
    const r = API().doAction(work, mine, kind, arg);
    if (!r.ok) { G.toast(r.msg); return null; }
    const patch = { a: work.a, b: work.b, turn: r.over ? room.turn : API().nextTurn(work), log: [...(room.log || []).slice(-40), ...r.lines], over: r.over, winner: r.over ? winnerName(work, r) : null, updated_at: new Date().toISOString() };
    const { data: upd, error } = await sb.from("duel_battles").update(patch).eq("id", state.battleId).eq("turn", mine).eq("over", false).select("id");
    if (error || !upd || !upd.length) { G.toast("⚠️ 戰況已經更新（可能剛剛被系統代打），同步最新畫面…"); loadRoom(state.battleId); return null; }
    if (r.over) {
      const myId = mine === "a" ? room.a_id : room.b_id, opId = mine === "a" ? room.b_id : room.a_id;
      if (r.winnerSide === "draw") { bump(myId, "draws"); bump(opId, "draws"); } else if (r.winnerSide === mine) { bump(myId, "wins"); bump(opId, "losses"); } else { bump(myId, "losses"); bump(opId, "wins"); }
    }
    state.room = { ...room, ...patch };
    return state.room;
  }
  // 對手離線：先等一下，再由系統代打，太久判認輸
  const bannerText = () => {
    if (!state || state.absentSince === null) return "";
    const gone = Date.now() - state.absentSince;
    if (gone < 3000) return "";
    const sec = Math.floor(gone / 1000), left = Math.max(0, Math.ceil((FORFEIT - gone) / 1000));
    return gone >= PROXY_GRACE ? `🤖 對方已離線 ${sec} 秒，系統代打中。他回來就改回手動；${left} 秒內沒回來將判定認輸。` : `📡 對方連線中斷…（${sec} 秒）再等一下看看`;
  };
  function watchTick() {
    if (!state || !state.channel || !state.room || !state.room.b || state.room.over) return;
    const room = state.room, mine = meOf(room); if (!mine) return;
    const other = mine === "a" ? "b" : "a", opId = other === "a" ? room.a_id : room.b_id;
    const stt = state.channel.presenceState() || {};
    if (!stt[mySid()]) { state.absentSince = null; return; }
    if (stt[opId]) { state.absentSince = null; if (state.ctrl) state.ctrl.refresh(); return; }
    if (state.absentSince === null) state.absentSince = Date.now();
    const gone = Date.now() - state.absentSince;
    if (state.ctrl) state.ctrl.refresh();
    if (gone >= FORFEIT) return claimForfeit();
    if (gone >= PROXY_GRACE && room.turn === other) proxyAct();
  }
  async function proxyAct() {
    if (!state || state.proxyBusy) return; state.proxyBusy = true;
    try {
      await new Promise((r) => setTimeout(r, 900));
      if (!state) return;
      const room = state.room; if (!room || !room.b || room.over) return;
      const mine = meOf(room), other = mine === "a" ? "b" : "a";
      if (room.turn !== other || state.absentSince === null) return;
      const work = { a: clone(room.a), b: clone(room.b) }, r = API().aiAct(work, other);
      r.lines[0] = "🤖 系統代打｜" + r.lines[0];
      const patch = { a: work.a, b: work.b, turn: r.over ? room.turn : API().nextTurn(work), log: [...(room.log || []).slice(-40), ...r.lines], over: r.over, winner: r.over ? winnerName(work, r) : null, updated_at: new Date().toISOString() };
      const { data: upd, error } = await sb.from("duel_battles").update(patch).eq("id", state.battleId).eq("turn", other).eq("over", false).select("id");
      if (error || !upd || !upd.length) { loadRoom(state.battleId); return; }
      const opId = other === "a" ? room.a_id : room.b_id;
      if (r.over) { if (r.winnerSide === "draw") { bump(mySid(), "draws"); bump(opId, "draws"); } else if (r.winnerSide === mine) { bump(mySid(), "wins"); bump(opId, "losses"); } else { bump(mySid(), "losses"); bump(opId, "wins"); } }
      state.room = { ...room, ...patch }; view();
    } catch (e) { console.warn("系統代打失敗", e); } finally { if (state) state.proxyBusy = false; }
  }
  async function claimForfeit() {
    if (!state || state.proxyBusy) return; state.proxyBusy = true;
    try {
      const room = state.room; if (!room || !room.b || room.over) return;
      const mine = meOf(room), other = mine === "a" ? "b" : "a", opId = other === "a" ? room.a_id : room.b_id;
      const patch = { over: true, winner: room[mine].name, log: [...(room.log || []).slice(-40), `🏳️ ${room[other].name} 離線超過 ${Math.round(FORFEIT / 1000)} 秒，判定認輸！`], updated_at: new Date().toISOString() };
      const { data: upd, error } = await sb.from("duel_battles").update(patch).eq("id", state.battleId).eq("over", false).select("id");
      if (error || !upd || !upd.length) { loadRoom(state.battleId); return; }
      bump(mySid(), "wins"); bump(opId, "losses");
      state.room = { ...room, ...patch }; view();
    } catch (e) { console.warn("認輸判定失敗", e); } finally { if (state) state.proxyBusy = false; }
  }

  /* ---------- 收到邀請、回到沒打完的對戰 ---------- */
  let pendingChannel = null, started = false;
  async function showInvite(battleId) {
    const { data: battle } = await sb.from("duel_battles").select("a").eq("id", battleId).maybeSingle();
    if (!battle) return;
    G.overlay((box) => {
      box.append(h("h2", {}, `⚔️ ${(battle.a && battle.a.name) || "同學"} 想要挑戰你！`), h("p", { class: "muted" }, "接受後會用你目前最強的 3 隻數靈（要調整先按「稍後再說」，到鬥技場看看）。"),
        h("div", { class: "row", style: "justify-content:center;margin-top:12px" }, h("button", { class: "btn big", onclick: () => { G.closeOverlay(); acceptSync(battleId); } }, "接受挑戰"), h("button", { class: "btn ghost", onclick: () => G.closeOverlay() }, "稍後再說")));
    });
  }
  async function checkResume(sid) {
    try {
      const since = new Date(Date.now() - RESUME_WINDOW).toISOString();
      const { data, error } = await sb.from("duel_battles").select("id,b").eq("mode", "sync").eq("over", false).or("a_id.eq." + sid + ",b_id.eq." + sid).gte("updated_at", since).order("updated_at", { ascending: false }).limit(1);
      if (error || !data || !data.length || !data[0].b) return false;
      G.toast("⚔️ 偵測到還沒打完的對戰，帶你回到戰場！");
      enterSync(data[0].id);
      return true;
    } catch (e) { return false; }
  }
  O.start = async () => {
    if (!sb || !mySid() || started) return;
    started = true;
    O.syncUser();
    const sid = mySid();
    if (await checkResume(sid)) return;
    const { data } = await sb.from("duel_pending").select("battle_id").eq("target_id", sid).maybeSingle();
    if (data && !state) showInvite(data.battle_id);
    pendingChannel = sb.channel("pending-" + sid)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "duel_pending", filter: "target_id=eq." + sid }, (p) => { if (!state) showInvite(p.new.battle_id); })
      .subscribe();
  };
})();
