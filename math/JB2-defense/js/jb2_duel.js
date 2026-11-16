/* 數靈對戰（取自 JB2V2 的「數靈怪物團體戰」）：3 對 3 輪流出招，速度快的先動。
   這一版是單機：跟「AI 幽靈」打；數值、招式、AI 都照 JB2V2（js/jb2_duel_config.js 來自 game-config.js 的 battle、skills）。
   沒有帶過來的：跟同學連線對戰（要網路與學號資料庫）、商店道具、研發招式。 */
(function () {
  const G = window.G, h = G.h, C = window.JB2_DUEL;
  if (!C) return;
  const B = C.battle, GCS = C.skills;
  const STATKEYS = ["hp", "mp", "atk", "matk", "def", "mdef", "spd"];
  const BASE = Object.assign({ hp: 1000, mp: 300, atk: 50, matk: 50, spd: 100, def: 20, mdef: 20 }, B.statBase, { hp: B.baseHp });
  const GROWTH = Object.assign({ hp: 100, mp: 30, atk: 5, matk: 5, def: 3, mdef: 3, spd: 1 }, B.statGrowth, { hp: B.growthHp });
  const HP_RATE = B.hpRate || 0.5, OTHER_RATE = B.monOtherRate || 2, TIME_UNIT = 100, GUARD = GCS.guard;
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  let MONS = {}; // id → {id,name,emoji,ci,img,nodeId}
  const ITEM_CFG = {};
  ((window.JB2_HUB && window.JB2_HUB.shop.items) || []).forEach((i) => { if (i.healPct || i.mpPct || i.revivePct) ITEM_CFG[i.id] = i; });
  const itemTargetOk = (it, m) => (it.revivePct ? m.hp <= 0 : m.hp > 0 && (it.healPct ? m.hp < m.hpMax : m.mp < m.mpMax));
  G.monLevel = (stars, plays) => Math.min(30, 3 + stars * 4 + Math.min(plays || 0, 5));
  G.duelStats = (lv) => statsAt(lv);

  /* ---------- 數值 ---------- */
  function statsAt(lv) {
    const o = {};
    STATKEYS.forEach((k) => { o[k] = Math.max(1, Math.round((BASE[k] + GROWTH[k] * (lv - 1)) * (k === "hp" ? HP_RATE : OTHER_RATE))); });
    return o;
  }
  const skDef = (id) => (GCS.defs ? GCS.defs[id] || null : null);
  const skType = (id) => { const d = skDef(id); return d ? GCS.types[d.t] || null : null; };
  const skUnlockLv = (id) => (GCS.learnLv && GCS.learnLv[String(id).split(":")[1]]) || 1;
  const basicName = (monId) => { const i = MONS[monId]; return (GCS.basicNames && GCS.basicNames[i ? i.ci : 0]) || "基本攻擊"; };
  function filterSk(list, level, monId) {
    const out = [];
    (list || []).forEach((id) => { if (id && skDef(id) && !out.includes(id) && level >= skUnlockLv(id) && (!String(id).includes(":") || String(id).split(":")[0] === monId)) out.push(id); });
    return out.slice(0, GCS.slots || 4);
  }
  function makeMon(spec) {
    const info = MONS[spec.id];
    if (!info) return null;
    const lv = Math.max(1, spec.level | 0 || 1), s = statsAt(lv), hp0 = spec.hp != null ? Math.max(0, Math.min(s.hp, spec.hp)) : s.hp;
    return { id: spec.id, name: info.name, emoji: info.emoji, level: lv, hp: hp0, hpMax: s.hp, mp: s.mp, mpMax: s.mp, atk: s.atk, matk: s.matk, def: s.def, mdef: s.mdef, spd: s.spd,
      t: TIME_UNIT / s.spd, sk: filterSk(spec.sk || GCS.mon[spec.id] || [], lv, spec.id), buf: [], used: {}, dot: 0, dotT: 0, blind: 0, blindP: 0 };
  }
  const makeSide = (name, specs) => ({ name, team: specs.map(makeMon).filter(Boolean), active: 0 });
  const bufMul = (m, key) => { let r = 1; (m.buf || []).forEach((b) => { if (b.k === key) r *= b.m; }); return r; };
  const addBuf = (m, key, mul, turns, self) => { m.buf = (m.buf || []).filter((b) => b.k !== key || (b.m > 1) !== (mul > 1)); m.buf.push({ k: key, m: mul, t: turns, fresh: !!self }); };
  const statusText = (m) => {
    const s = [];
    if (bufMul(m, "def") > 1) s.push("🛡️防禦↑");
    if (bufMul(m, "def") < 1) s.push("💔破防");
    if (bufMul(m, "out") > 1) s.push("⚔️攻擊↑");
    if (bufMul(m, "out") < 1) s.push("⚔️攻擊↓");
    if (m.dotT > 0) s.push(`☠️中毒${m.dotT}`);
    if (m.blind > 0) s.push(`🌑失明${m.blind}`);
    return s.join(" ");
  };
  const skCanUse = (m, id) => { const ty = skType(id); if (!ty || m.mp < ty.mp) return false; return !(ty.lim && ((m.used || {})[id] || 0) >= ty.lim); };
  const skLeft = (m, id) => { const ty = skType(id); return ty && ty.lim ? Math.max(0, ty.lim - ((m.used || {})[id] || 0)) : null; };
  const actorOf = (s) => s.team[s.active];
  const aliveIdx = (s) => s.team.map((m, i) => (m.hp > 0 ? i : -1)).filter((i) => i >= 0);
  // 誰下一個行動：比「下次行動時間 t」，t 小的先；一樣時速度快的先
  function nextTurn(room) {
    const A = actorOf(room.a), Bm = actorOf(room.b);
    if (Math.abs(A.t - Bm.t) > 1e-6) return A.t < Bm.t ? "a" : "b";
    if (A.spd !== Bm.spd) return A.spd > Bm.spd ? "a" : "b";
    return "a";
  }
  function enterMon(s, idx, now) { s.active = idx; const m = s.team[idx]; m.t = now + TIME_UNIT / m.spd; m.buf = []; }
  function calcDmg(att, def, base, isMagic) {
    const raw = base * bufMul(att, "out") * (0.8 + Math.random() * 0.3);
    return Math.max(1, Math.round(raw - (isMagic ? def.mdef : def.def) * bufMul(def, "def")));
  }
  function applyEffect(att, def, ty, rate, lines, dmgDone) {
    switch (ty.k) {
      case "vamp": { const x = Math.round(dmgDone * (ty.leech || 0) * rate); if (x > 0) { att.hp = Math.min(att.hpMax, att.hp + x); lines.push(`🩸 ${att.name} 吸回 ${x} 點血`); } break; }
      case "drain": { const st = Math.min(def.mp, Math.round(def.mpMax * (ty.pct || 0) * rate)); if (st > 0) { def.mp -= st; att.mp = Math.min(att.mpMax, att.mp + st); lines.push(`🔷 ${att.name} 吸走 ${def.name} ${st} 點魔力`); } break; }
      case "shield": addBuf(att, "def", 1 + (ty.m - 1) * rate, ty.t, true); lines.push(`🛡️ ${att.name} 防禦力提高！`); break;
      case "buff": addBuf(att, "out", 1 + (ty.m - 1) * rate, ty.t, true); lines.push(`⚔️ ${att.name} 攻擊力提高！`); break;
      case "debuff": addBuf(def, "def", 1 - (1 - ty.m) * rate, ty.t, false); lines.push(`💔 ${def.name} 的防禦被削弱了！`); break;
      case "heal": { const x = Math.round(att.hpMax * ty.pct * rate); att.hp = Math.min(att.hpMax, att.hp + x); lines.push(`💚 ${att.name} 回復 ${x} 點血`); break; }
      case "mpheal": { const x = Math.round(att.mpMax * ty.pct * rate); att.mp = Math.min(att.mpMax, att.mp + x); lines.push(`🔷 ${att.name} 回復 ${x} 點魔力`); break; }
      case "poison": def.dot = Math.round(def.hpMax * ty.pct * rate); def.dotT = ty.t; lines.push(`☠️ ${def.name} 中毒了（${ty.t} 回合）`); break;
      case "blind": def.blind = ty.t; def.blindP = Math.min(0.95, ty.miss * rate); lines.push(`🌑 ${def.name} 失明了，攻擊可能落空（${ty.t} 回合）`); break;
      case "stun": if (Math.random() < rate) { def.t += TIME_UNIT / def.spd; lines.push(`😵 ${def.name} 被定身，少一次行動！`); } else lines.push(`${def.name} 掙脫了定身`); break;
    }
  }
  const ATTACK_KINDS = ["phys", "mag", "vamp", "drain", "ult"];
  // kind：basic 基本攻擊／skill 招式（arg＝招式代號）／defend 解題守勢／swap 換人（arg＝第幾隻）
  function doAction(room, side, kind, arg) {
    const me = room[side], foeSide = side === "a" ? "b" : "a", foe = room[foeSide];
    const att = actorOf(me), def = actorOf(foe), now = att.t, lines = [];
    let swapped = false;
    const missed = () => att.blind > 0 && Math.random() < att.blindP;
    if (kind === "defend") {
      addBuf(att, "def", GUARD.defMul, GUARD.t, true); addBuf(att, "out", GUARD.outMul, GUARD.t, true);
      lines.push(`${att.name} 使用「${GUARD.name}」！接下來 ${GUARD.t} 回合防禦力 ×${GUARD.defMul}、攻擊力 ×${GUARD.outMul}`);
    } else if (kind === "swap") {
      const idx = arg | 0, to = me.team[idx];
      if (!to || to.hp <= 0 || idx === me.active) return { ok: false, msg: "這隻不能換上場喔" };
      lines.push(`🔄 ${att.name} 退下，換 ${to.name} 上場！`);
      enterMon(me, idx, now); swapped = true;
    } else if (kind === "basic") {
      const nm = basicName(att.id);
      if (missed()) lines.push(`${att.name} 使用「${nm}」，但是失明，攻擊落空了！`);
      else { const dmg = calcDmg(att, def, att.atk * (GCS.basicP || 1), false); def.hp -= dmg; lines.push(`${att.name} 使用「${nm}」，對 ${def.name} 造成 ${dmg} 點傷害！`); }
    } else if (kind === "item") { // 道具：arg＝"道具代號|第幾隻"（補血／補魔／復活）
      const parts = String(arg || "").split("|"), iid = parts[0], tgt = me.team[parts[1] | 0], it = ITEM_CFG[iid], hub = G.S.hub || {};
      if (!it) return { ok: false, msg: "不能用這個道具" };
      if ((me.itemUsed || 0) >= (B.itemPerBattle || 3)) return { ok: false, msg: `這場戰鬥道具最多用 ${B.itemPerBattle || 3} 次` };
      if (((hub.inv || {})[iid] | 0) < 1) return { ok: false, msg: "背包裡沒有這個道具了" };
      if (!tgt || !itemTargetOk(it, tgt)) return { ok: false, msg: "這隻現在不需要這個道具" };
      if (it.revivePct) { tgt.hp = Math.max(1, Math.round(tgt.hpMax * it.revivePct / 100)); tgt.buf = []; tgt.dot = 0; tgt.dotT = 0; tgt.blind = 0; lines.push(`🎒 ${att.name} 使用「${it.name}」，${tgt.name} 復活了！（HP ${tgt.hp}/${tgt.hpMax}）`); }
      else if (it.healPct) { const x = Math.min(tgt.hpMax - tgt.hp, Math.round(tgt.hpMax * it.healPct / 100)); tgt.hp += x; lines.push(`🎒 ${att.name} 使用「${it.name}」，${tgt.name} 回復了 ${x} 點生命！`); }
      else { const x = Math.min(tgt.mpMax - tgt.mp, Math.round(tgt.mpMax * it.mpPct / 100)); tgt.mp += x; lines.push(`🎒 ${att.name} 使用「${it.name}」，${tgt.name} 回復了 ${x} 點魔力！`); }
      hub.inv[iid]--; me.itemUsed = (me.itemUsed || 0) + 1; G.save();
    } else if (kind === "skill") {
      const d = skDef(arg), ty = skType(arg);
      if (!d || !ty || !(att.sk || []).includes(arg)) return { ok: false, msg: "沒有這個招式" };
      if (att.mp < ty.mp) return { ok: false, msg: "魔力不夠喔" };
      if (ty.lim && ((att.used || {})[arg] || 0) >= ty.lim) return { ok: false, msg: "這一招這場用完了" };
      att.mp -= ty.mp; att.used = att.used || {}; att.used[arg] = (att.used[arg] || 0) + 1;
      lines.push(`${att.name} 使用「${d.n}」！`);
      if (ATTACK_KINDS.includes(ty.k) && missed()) lines.push("但是失明，攻擊落空了！");
      else {
        let dmg = 0;
        if (ty.k === "phys" || ty.k === "vamp") { dmg = calcDmg(att, def, att.atk * ty.p, false); def.hp -= dmg; lines.push(`對 ${def.name} 造成 ${dmg} 點傷害！`); }
        else if (ty.k === "mag" || ty.k === "drain" || ty.k === "ult") { dmg = calcDmg(att, def, att.matk * ty.p, true); def.hp -= dmg; lines.push(`對 ${def.name} 造成 ${dmg} 點傷害！`); }
        if (ty.k === "ult") { const bt = GCS.types[d.b]; if (bt) applyEffect(att, def, bt, ty.rate || 1, lines, dmg); }
        else applyEffect(att, def, ty, 1, lines, dmg);
      }
      if (d.c) lines.push(`📖 課本觀念：${d.c}`);
    } else return { ok: false, msg: "不能這樣做" };
    if (!swapped) { // 自己行動：狀態倒數、中毒扣血，排下一次行動時間
      att.buf = (att.buf || []).filter((b) => { if (b.fresh) { b.fresh = false; return true; } b.t--; return b.t > 0; });
      if (att.dotT > 0) { att.hp -= att.dot; att.dotT--; lines.push(`☠️ ${att.name} 受到毒傷 ${att.dot} 點`); }
      if (att.blind > 0) att.blind--;
      att.t = now + TIME_UNIT / att.spd;
    }
    const wipe = {};
    [side, foeSide].forEach((k) => {
      const s = room[k], m = actorOf(s);
      if (m.hp > 0) return;
      lines.push(`💀 ${m.name} 倒下了！`);
      const nx = aliveIdx(s)[0];
      if (nx === undefined) wipe[k] = true;
      else { enterMon(s, nx, now); lines.push(`📣 ${s.name} 派出 ${s.team[nx].name}！`); }
    });
    let over = false, winnerSide = null;
    if (wipe.a || wipe.b) { over = true; winnerSide = wipe.a && wipe.b ? "draw" : wipe.a ? "b" : "a"; }
    return { ok: true, lines, over, winnerSide };
  }
  const AI_W = { H: 3, B: 3, V: 3, S: 1.5, P: 2, K: 2, R: 3, M: 1.5, D: 2, X: 3, L: 2, Z: 2, U1: 4, U2: 5 };
  function aiPick(room, side) {
    const me = room[side], foe = room[side === "a" ? "b" : "a"], att = actorOf(me), def = actorOf(foe);
    const bench = aliveIdx(me).filter((i) => i !== me.active);
    if (bench.length && att.hp < att.hpMax * 0.25 && Math.random() < 0.3) { bench.sort((x, y) => me.team[y].hp - me.team[x].hp); return { kind: "swap", arg: bench[0] }; }
    const opts = [["basic", null, 2]];
    (att.sk || []).forEach((id) => {
      if (!skCanUse(att, id)) return;
      const d = skDef(id), ty = skType(id), k = ty.k;
      if (k === "heal" && att.hp > att.hpMax * 0.55) return;
      if (k === "mpheal" && att.mp > att.mpMax * 0.5) return;
      if (k === "buff" && bufMul(att, "out") > 1) return;
      if (k === "shield" && bufMul(att, "def") > 1) return;
      if (k === "debuff" && bufMul(def, "def") < 1) return;
      if (k === "poison" && def.dotT > 0) return;
      if (k === "blind" && def.blind > 0) return;
      opts.push(["skill", id, AI_W[d.t] || 2]);
    });
    if (bufMul(att, "def") <= 1) opts.push(["defend", null, 1]);
    let r = Math.random() * opts.reduce((s, o) => s + o[2], 0);
    for (const o of opts) { r -= o[2]; if (r <= 0) return { kind: o[0], arg: o[1] }; }
    return { kind: "basic" };
  }
  function aiAct(room, side) {
    const p = aiPick(room, side);
    let r = doAction(room, side, p.kind, p.arg);
    if (!r.ok) r = doAction(room, side, "basic");
    return r;
  }

  /* ---------- 資料：我的隊伍（通關過的關卡的數靈，等級看星數與玩的次數）、AI 幽靈 ---------- */
  async function loadMons() {
    MONS = {};
    const mine = [];
    for (let c = 1; c <= 6; c++) {
      const d = await G.loadChapter("jb2_ch" + c);
      d.nodes.forEach((n) => {
        const id = n.place.split(" ")[0];
        MONS[id] = { id, name: n.title, emoji: n.emoji, ci: c - 1, img: `assets/${n.img}.webp`, nodeId: n.id };
        const st = G.nodeState(n.id);
        if (st.stars > 0) { const level = G.monLevel(st.stars, st.plays), sp = G.hubSpec ? G.hubSpec(id, level) : {}; mine.push({ id, level, stars: st.stars, hp: sp.hp, sk: sp.sk }); }
      });
    }
    mine.sort((a, b) => b.level - a.level);
    return mine;
  }
  function ghostSide(mine) {
    const avg = Math.max(1, Math.round(mine.reduce((a, x) => a + x.level, 0) / Math.max(1, mine.length) + (B.ghostLevelOffset || 0)));
    const ids = Object.keys(MONS).sort(() => Math.random() - 0.5).slice(0, B.ghostTeamSize || 3);
    const names = B.ghostNames || ["幽靈"];
    return makeSide(names[rint(0, names.length - 1)], ids.map((id) => ({ id, level: Math.max(1, avg + rint(-1, 1)) })));
  }

  /* ---------- 畫面 ---------- */
  let root = null;
  const close = () => { if (root) { root.remove(); root = null; } };
  const invItems = () => Object.values(ITEM_CFG).filter((it) => (((G.S.hub || {}).inv || {})[it.id] | 0) > 0);
  const bar = (cls, a, b) => h("div", { class: "dl-bar " + cls }, h("i", { style: `width:${Math.max(0, Math.min(100, (a / b) * 100))}%` }), h("b", {}, `${Math.max(0, Math.round(a))} / ${b}`));
  function sideView(s, isMe, tag) {
    const m = actorOf(s);
    return h("div", { class: "dl-side " + (isMe ? "me" : "foe") },
      h("div", { class: "dl-card" },
        h("small", {}, isMe ? `你（${s.name}）` : `${tag || "👻"} ${s.name}`),
        h("b", {}, `${m.name}　Lv.${m.level}`),
        bar("hp", m.hp, m.hpMax), bar("mp", m.mp, m.mpMax),
        h("div", { class: "dl-st" }, statusText(m) || "　")),
      h("div", { class: "dl-sprite", id: isMe ? "dl-sp-me" : "dl-sp-foe" }, MONS[m.id] ? h("img", { src: MONS[m.id].img, alt: m.name }) : m.emoji),
      h("div", { class: "dl-team" }, s.team.map((x, i) => h("span", { class: (x.hp <= 0 ? "dead " : "") + (i === s.active ? "on" : ""), title: `${x.name} Lv.${x.level}` }, MONS[x.id] ? h("img", { src: MONS[x.id].img, alt: "" }) : x.emoji))));
  }

  /* 戰鬥畫面（AI 幽靈、雲端幽靈、同學即時對戰共用）
     ctx：{ room, me: "a"|"b", mode: "ai"|"cloud"|"sync", foeTag, send(kind,arg)→新的 room 或 null（只有 sync 用）, onClose, banner() } */
  function battleUI(ctx) {
    if (!root) { root = h("div", { class: "dl-root" }); document.body.append(root); }
    let room = ctx.room, sub = null, busy = false, settled = false;
    const me = ctx.me, foe = me === "a" ? "b" : "a", local = ctx.mode !== "sync";
    const flash = (side) => { const el = root && root.querySelector(side === me ? "#dl-sp-me" : "#dl-sp-foe"); if (el) { el.classList.add("hit"); setTimeout(() => el.classList.remove("hit"), 450); } };
    const winnerSide = () => (room.winnerSide ? room.winnerSide : room.winner === room[me].name ? me : room.winner === room[foe].name ? foe : "draw");
    const settle = () => {
      if (settled) return; settled = true;
      const w = winnerSide(), hubS = (G.S.hub = G.S.hub || {}); hubS.mon = hubS.mon || {};
      room[me].team.forEach((x) => { hubS.mon[x.id] = { hp: Math.max(0, Math.round(x.hp)) }; });
      let gold = 0;
      if (ctx.mode === "ai") { // 跟 AI 幽靈才有金幣；跟同學打記在戰績排行
        const D = (G.S.duel = G.S.duel || { date: "", wins: 0, w: 0, l: 0 }), today = G.today();
        if (D.date !== today) { D.date = today; D.wins = 0; }
        if (w === me) { D.w++; if (D.wins < (B.winRewardsPerDay || 0)) gold = B.winGold || 0; D.wins++; } else if (w === foe) { D.l++; gold = B.loseGold || 0; }
        if (gold) G.S.coins += gold;
      }
      G.sfx(w === me ? "win" : "bad"); G.save();
      if (ctx.onSettle) { try { ctx.onSettle(w); } catch (e) {} }
      const wiped = G.hubCheckWipe ? G.hubCheckWipe() : null;
      room.reward = ctx.mode === "ai" ? (w === me ? (gold ? `獲得 🪙 ${gold}` : "今天的勝利獎勵已經領完了") : w === foe ? (gold ? `安慰獎 🪙 ${gold}` : "") : "") : (w === me ? "🏅 戰績 +1 勝" : w === foe ? "戰績 +1 敗" : "平手");
      if (wiped) room.reward += `　💀 數靈全部倒下了！扣掉一半金幣（🪙 ${wiped.lost}），所有數靈已恢復到滿。`;
    };
    const render = () => {
      if (!root) return;
      root.innerHTML = "";
      if (room.over) settle();
      const A = room[me], F = room[foe], myTurn = room.turn === me && !room.over && !busy, m = actorOf(A);
      const bench = aliveIdx(A).filter((i) => i !== A.active);
      let menu;
      if (room.over) menu = null;
      else if (!myTurn) menu = h("div", { class: "dl-wait" }, ctx.mode === "sync" && room.turn !== me ? "等對手出招…" : "對手行動中…");
      else if (!sub) menu = h("div", { class: "dl-menu" },
        h("button", { onclick: () => act("basic") }, `⚔️ ${basicName(m.id)}`),
        h("button", { disabled: m.sk && m.sk.length ? null : "disabled", onclick: () => { sub = "k"; render(); } }, `✨ 招式（${(m.sk || []).length}）`),
        h("button", { onclick: () => act("defend") }, `🛡️ ${GUARD.name}`),
        h("button", { disabled: bench.length ? null : "disabled", onclick: () => { sub = "s"; render(); } }, "🔄 換人"),
        h("button", { disabled: invItems().length ? null : "disabled", onclick: () => { sub = "i"; render(); } }, "🎒 道具"));
      else if (sub === "i") menu = h("div", { class: "dl-menu" },
        invItems().map((it) => h("button", { onclick: () => { sub = "i:" + it.id; render(); } }, `${it.icon} ${it.name}`, h("small", {}, `×${((G.S.hub || {}).inv || {})[it.id] | 0}`))),
        h("button", { class: "back", onclick: () => { sub = null; render(); } }, "返回"));
      else if (String(sub).indexOf("i:") === 0) { const it = ITEM_CFG[sub.slice(2)];
        menu = h("div", { class: "dl-menu" }, A.team.map((x, i) => itemTargetOk(it, x) ? h("button", { onclick: () => act("item", it.id + "|" + i) }, `${x.emoji} ${x.name} Lv.${x.level}`, h("small", {}, `HP ${x.hp}/${x.hpMax}　MP ${x.mp}/${x.mpMax}`)) : null),
          h("button", { class: "back", onclick: () => { sub = "i"; render(); } }, "返回")); }
      else if (sub === "k") menu = h("div", { class: "dl-menu" },
        (m.sk || []).map((id) => { const d = skDef(id), ty = skType(id), left = skLeft(m, id);
          return h("button", { disabled: skCanUse(m, id) ? null : "disabled", title: d.c || "", onclick: () => act("skill", id) }, d.n, h("small", {}, `${ty.n}${d.b ? "＋" + GCS.types[d.b].n : ""}｜耗魔${ty.mp}${left != null ? `｜剩${left}次` : ""}`)); }),
        h("button", { class: "back", onclick: () => { sub = null; render(); } }, "返回"));
      else menu = h("div", { class: "dl-menu" },
        bench.map((i) => { const x = A.team[i]; return h("button", { onclick: () => act("swap", i) }, `${x.emoji} ${x.name} Lv.${x.level}`, h("small", {}, `HP ${x.hp}/${x.hpMax}`)); }),
        h("button", { class: "back", onclick: () => { sub = null; render(); } }, "返回"));
      const w = room.over ? winnerSide() : null;
      root.append(h("div", { class: "dl-top" }, h("button", { class: "btn ghost", onclick: () => { if (room.over || confirm("要離開對戰嗎？" + (ctx.mode === "sync" ? "離開後對手會等你一陣子，太久就判你認輸。" : "這場不算輸贏。"))) leave(); } }, "✖ 離開"), h("b", {}, "⚔️ 數靈對戰"), h("span", {}, `你 vs ${ctx.foeTag || "👻"} ${F.name}`)),
        ctx.banner && ctx.banner() ? h("div", { class: "dl-banner" }, ctx.banner()) : null,
        h("div", { class: "dl-field" }, sideView(F, false, ctx.foeTag), sideView(A, true)),
        h("div", { class: "dl-log" }, (room.log || []).slice(-6).map((x) => h("div", {}, "· " + x))),
        menu);
      if (room.over) root.append(h("div", { class: "dl-result" }, h("h2", {}, w === me ? "🎉 你贏了！" : w === "draw" ? "🤝 平手" : "💫 這場輸了"), h("p", {}, room.reward || ""),
        h("div", { class: "row" }, h("button", { class: "btn", onclick: () => { leave(); openDuel(); } }, "再戰一場"), h("button", { class: "btn ghost", onclick: leave }, "回去"))));
    };
    const leave = () => { if (ctx.onClose) ctx.onClose(); close(); };
    const apply = (r) => { // 本機（AI／雲端幽靈）套用一次行動的結果
      const before = [actorOf(room[me]).hp, actorOf(room[foe]).hp];
      room.log.push(...r.lines);
      if (actorOf(room[me]).hp < before[0]) flash(me);
      if (actorOf(room[foe]).hp < before[1]) flash(foe);
      if (r.over) { room.over = true; room.winnerSide = r.winnerSide; return render(); }
      room.turn = nextTurn(room); busy = false; sub = null; render();
      if (room.turn === foe) aiTurn();
    };
    const act = async (kind, arg) => {
      if (busy || room.turn !== me || room.over) return;
      if (local) {
        const r = doAction(room, me, kind, arg);
        if (!r.ok) return G.toast(r.msg);
        G.sfx(kind === "defend" ? "power" : "shot"); busy = true; apply(r);
      } else {
        busy = true; sub = null; render();
        const nr = await ctx.send(kind, arg);
        busy = false;
        if (nr) { G.sfx(kind === "defend" ? "power" : "shot"); setRoom(nr); } else render();
      }
    };
    const aiTurn = () => { busy = true; render(); setTimeout(() => { if (!root || room.over) return; G.sfx("hurt"); apply(aiAct(room, foe)); }, 900); };
    const setRoom = (nr) => {
      if (!root) return;
      const b0 = room && room[me] && room[me].team ? actorOf(room[me]).hp : null, f0 = room && room[foe] && room[foe].team ? actorOf(room[foe]).hp : null;
      room = nr; busy = false;
      if (nr[me] && nr[foe]) { if (b0 != null && actorOf(nr[me]).hp < b0) setTimeout(() => flash(me), 30); if (f0 != null && actorOf(nr[foe]).hp < f0) setTimeout(() => flash(foe), 30); }
      render();
    };
    render();
    if (local && room.turn === foe) aiTurn();
    return { setRoom, getRoom: () => room, refresh: render, close: leave };
  }

  async function openDuel() {
    close();
    root = h("div", { class: "dl-root" });
    document.body.append(root);
    root.append(h("div", { class: "dl-load" }, "載入中…"));
    const mine = await loadMons();
    if (!root) return;
    root.innerHTML = "";
    if (!mine.length) {
      root.append(h("div", { class: "dl-setup" }, h("h2", {}, "⚔️ 數靈對戰"), h("p", {}, "你還沒有收服任何數靈。先去通關一關（至少 1 顆星），就能帶著那隻數靈來對戰！"), h("button", { class: "btn", onclick: close }, "知道了")));
      return;
    }
    const picks = mine.filter((x) => !(x.hp <= 0)).slice(0, 3).map((x) => x.id);
    let oppSid = "";
    const specsOf = () => picks.map((id) => mine.find((x) => x.id === id)).filter((x) => x && !(x.hp <= 0));
    const draw = () => {
      root.innerHTML = "";
      const D = G.S.duel || { w: 0, l: 0 }, O = G.online, hub = G.S.hub || {};
      const inp = h("input", { type: "text", placeholder: "同學的學號", value: oppSid, style: "font-size:20px;padding:6px 10px;border-radius:10px;border:0;width:180px", oninput: (e) => { oppSid = e.target.value.trim(); } });
      const need = () => { if (!picks.length) { G.toast("先選要出戰的數靈"); return false; } return true; };
      const needOpp = () => { if (!oppSid) { G.toast("先輸入同學的學號"); return false; } if (!O || !O.ready()) { G.toast("連不上網路對戰功能，請檢查網路"); return false; } return need(); };
      root.append(h("div", { class: "dl-setup" },
        h("h2", {}, "⚔️ 數靈對戰"),
        h("p", {}, "選 1～3 隻數靈出戰（依點選順序上場），3 對 3 輪流出招。速度快的先動；招式要耗魔力。等級由星數和練習次數決定，多練習就會變強！"),
        h("div", { class: "dl-pick" }, mine.map((x) => { const i = picks.indexOf(x.id), info = MONS[x.id];
          const dead = x.hp <= 0, max = statsAt(x.level).hp;
          return h("button", { class: "dl-mon" + (i >= 0 ? " on" : "") + (dead ? " dead" : ""), onclick: () => { if (dead) return G.toast("💀 倒下了！到大地圖的「🩹 隊伍」用復活羽毛，或回小屋睡一覺"); if (i >= 0) picks.splice(i, 1); else if (picks.length < 3) picks.push(x.id); else G.toast("最多出戰 3 隻"); draw(); } },
            h("img", { src: info.img, alt: "" }), h("b", {}, info.name), h("small", {}, `Lv.${x.level}　${"★".repeat(x.stars)}`), h("small", {}, dead ? "💀 倒下" : `HP ${x.hp}/${max}`), i >= 0 ? h("span", { class: "no" }, i + 1) : null); })),
        h("p", { class: "muted" }, `戰績：${D.w || 0} 勝 ${D.l || 0} 敗　（贏 AI 幽靈得 🪙 ${B.winGold}，每天前 ${B.winRewardsPerDay} 場；輸了也有 🪙 ${B.loseGold}）`),
        h("div", { class: "row" }, h("button", { class: "btn big", onclick: () => { if (!need()) return; const specs = specsOf(), a = makeSide(hub.name || "你", specs), b = ghostSide(specs); const room = { a, b, turn: null, over: false, log: [`👻 幽靈「${b.name}」出現了！`] }; room.turn = nextTurn(room); battleUI({ room, me: "a", mode: "ai", foeTag: "👻" }); } }, "👻 跟 AI 幽靈打")),
        h("div", { class: "dl-friend" }, h("h3", {}, "👥 跟朋友對戰"),
          hub.sid ? h("div", { class: "row" }, inp, h("button", { class: "btn", onclick: () => { if (needOpp()) O.challengeSync(oppSid, specsOf()); } }, "⚡ 即時對戰（雙方都在線）"), h("button", { class: "btn ghost", onclick: () => { if (needOpp()) O.challengeCloud(oppSid, specsOf()); } }, "👻 挑戰他的雲端幽靈（對方不用在線）"))
            : h("p", { class: "muted" }, "要先到大地圖登記學號，才能跟同學對戰。"),
          h("small", {}, O && O.ready() ? `你的學號：${hub.sid || "（還沒登記）"}　對方在線時用「即時對戰」，他會收到邀請；不在線可以打他留在雲端的隊伍。` : "（連不上雲端，朋友對戰暫時不能用）")),
        h("div", { class: "row" }, h("button", { class: "btn ghost", onclick: close }, "回去"))));
    };
    draw();
  }
  G.openDuel = openDuel;
  // 給網路對戰模組用
  G.DuelAPI = { makeSide, doAction, aiAct, nextTurn, actorOf, aliveIdx, battleUI, loadMons, openDuel, closeDuel: close, getRoot: () => root, setRoot: (r) => { root = r; }, MONS: () => MONS, TIME_UNIT };
})();
