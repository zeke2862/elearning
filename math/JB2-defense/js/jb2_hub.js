/* 大地圖（取自 JB2V2 的「數理大陸」）：六座島＝六章，中間是起始村莊（小屋、鬥技場、商店）。
   按「開始冒險」之後的第一頁就是這張地圖；獎勵商店（家長設定的兌換）放在商店的「特別」分頁。 */
(function () {
  const G = window.G, h = G.h, C = window.JB2_HUB;
  if (!C) return;
  const ITEM = {};
  C.shop.items.forEach((i) => { ITEM[i.id] = i; });
  const CIDS = C.chapters.map((c) => "jb2_ch" + c.n);
  const price = (it) => Math.round((it.days * C.economy.dailyBase) / C.economy.priceRound) * C.economy.priceRound;

  /* ---------- 存檔（放在 G.S.hub，跟著遊戲存檔走） ---------- */
  function H() {
    const s = (G.S.hub = G.S.hub || {});
    s.own = s.own || {}; s.mon = s.mon || {}; s.sk = s.sk || {}; s.eq = s.eq || {}; s.inv = s.inv || {}; s.buy = s.buy || { date: "", n: {} }; s.checkin = s.checkin || { date: "" };
    C.shop.items.forEach((i) => { if (i.days === 0 && !i.cons) s.own[i.id] = 1; });
    s.eq.cloak = s.eq.cloak || "cloak_blue"; s.eq.hat = s.eq.hat || "hat_none"; s.eq.staff = s.eq.staff || "staff_wood";
    return s;
  }
  const totalStars = () => CIDS.reduce((a, cid) => a + G.chapterStars(cid), 0);
  const needOk = (it) => { const n = it.need; if (!n) return true; return n.type === "total" ? totalStars() >= n.min : G.chapterStars("jb2_ch" + n.ch) >= n.min; };
  const needText = (it) => { const n = it.need; if (!n) return ""; return n.type === "total" ? `總星數要 ${n.min} ⭐（現在 ${totalStars()}）` : `第 ${n.ch} 章要 ${n.min} ⭐（現在 ${G.chapterStars("jb2_ch" + n.ch)}）`; };

  /* ---------- 勇者（分層換裝：身體含服飾＋法杖＋帽子） ---------- */
  function heroEl(eq, px) {
    const c = ITEM[eq.cloak] || ITEM.cloak_blue, hat = ITEM[eq.hat] || ITEM.hat_none, st = ITEM[eq.staff] || ITEM.staff_wood;
    const box = h("span", { class: "hb-hero", style: `width:${px}px;height:${px * 1.5}px` });
    const layer = (src, lay) => { const l = lay || {}; box.append(h("img", { src, alt: "", style: `transform:translate(${+l.x || 0}%,${+l.y || 0}%) scale(${l.s ? +l.s : 1})` })); };
    layer(`assets/hub/body_${c.id}.webp`);
    if (st && !/_none$/.test(st.id)) layer(`assets/hub/${st.id}.webp`, st.lay);
    if (hat && !/_none$/.test(hat.id)) layer(`assets/hub/${hat.id}.webp`, hat.lay);
    return box;
  }
  const petOf = () => { const p = ITEM[H().eq.pet]; return p || null; };
  const petEl = (cls) => { const p = petOf(); if (!p) return null; return h("span", { class: cls || "hb-pet", title: p.name }, h("img", { src: `assets/hub/shop_${p.id}.webp`, alt: p.name, onerror: (e) => { e.target.replaceWith(document.createTextNode(p.icon || "🐾")); } })); };

  /* ---------- 大地圖 ---------- */
  G.openHub = () => { G.show("s-hub"); G.renderHub(); G.hubLoadAll().then(() => { if (G.$("#s-hub").classList.contains("active") && !G.$("#s-hub").querySelector(".hb-me.walk")) G.renderHub(); }).catch(() => {}); };
  G.renderHub = () => {
    const el = G.$("#s-hub"), S = G.S, M = C.map;
    el.innerHTML = "";
    const title = ITEM[H().eq.title], nm = H().name;
    const hud = h("div", { class: "hb-hud" },
      h("button", { class: "btn ghost", onclick: () => G.show("s-title") }, "⬅ 首頁"),
      h("span", { class: "pill" }, h("span", { class: "ic" }, "🪙"), S.coins),
      h("span", { class: "pill" }, h("span", { class: "ic" }, "🎟️"), S.tickets),
      h("span", { class: "pill", title: "連續天數" }, h("span", { class: "ic" }, "🔥"), `${S.streak.count} 天`),
      nm ? h("span", { class: "pill" }, h("span", { class: "ic" }, "🧙"), nm) : null,
      title ? h("span", { class: "pill title-pill" }, h("span", { class: "ic" }, "🏷️"), h("span", { class: "tt" }, title.name)) : null,
      h("span", { class: "spacer" }),
      h("button", { class: "btn ghost", onclick: () => G.openTeam() }, "🩹 隊伍"),
      window.RelaxBreak ? h("button", { class: "btn ghost", onclick: () => RelaxBreak.openZone() }, "🎮 遊戲區") : null,
      h("a", { class: "btn ghost", href: "../JB2/world-map-vol2-all.html", title: "換成召喚師版（JB2）。兩個版本的學習紀錄都會交給老師" }, "🧙 召喚師版"),
      h("button", { class: "btn ghost", onclick: () => G.openParent() }, "👪 家長"),
      h("button", { class: "icon-btn", onclick: () => { S.settings.sound = !S.settings.sound; G.save(); G.renderHub(); } }, S.settings.sound ? "🔊" : "🔇"));
    const stage = h("div", { class: "hb-stage" });
    const hub = H(), VIL = { x: M.village.x, y: M.village.y + 6 };
    // 目前進度＝第一個還沒全部通關的章（都沒通關就是第 1 章）
    const cur = C.chapters.find((c) => { const d = window.CH_DATA && window.CH_DATA["jb2_ch" + c.n]; const nodes = d ? d.nodes : null; return !(nodes && nodes.every((n) => G.nodeState(n.id).stars > 0)); });
    const ptOf = (n) => { const c = C.chapters.find((x) => x.n === n); return c ? { x: c.island.x, y: c.island.y - 1 } : VIL; };
    const here = hub.heroAt && hub.heroAt !== "v" ? ptOf(hub.heroAt) : VIL;
    const me = h("div", { class: "hb-me", style: `left:${here.x}%;top:${here.y}%` }, heroEl(hub.eq, 64), petEl("hb-pet"));
    let busy = false;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    // 勇者走過去（跟 JB2V2 一樣：島跟島之間要先回村莊）
    const walk = async (pt) => {
      const cx = parseFloat(me.style.left), cy = parseFloat(me.style.top), d = Math.hypot((pt.x - cx) * 20, (pt.y - cy) * 16);
      if (d < 4) return;
      me.classList.add("walk"); me.classList.toggle("flip", pt.x < cx);
      const ms = Math.max(500, Math.min(1500, d * 5));
      me.style.transition = `left ${ms}ms ease-in-out, top ${ms}ms ease-in-out`;
      me.style.left = pt.x + "%"; me.style.top = pt.y + "%";
      await sleep(ms + 60);
      me.classList.remove("walk");
    };
    const goIsland = async (c) => {
      if (busy) return; busy = true; G.sfx("click");
      if (hub.heroAt && hub.heroAt !== "v" && hub.heroAt !== c.n) await walk(VIL);
      await walk(ptOf(c.n));
      hub.heroAt = c.n; G.save(); busy = false;
      G.openChapter("jb2_ch" + c.n);
    };
    const goBuilding = async (b, fn) => {
      if (busy) return; busy = true; G.sfx("click");
      if (hub.heroAt && hub.heroAt !== "v") await walk(VIL);
      await walk({ x: b.x, y: b.y + 3 });
      hub.heroAt = "v"; G.save(); busy = false;
      fn();
    };
    const holes = [`<ellipse cx="${M.village.x * 20}" cy="${M.village.y * 16}" rx="${M.village.rx + 40}" ry="${M.village.ry + 30}" fill="black" filter="url(#hbBlur)"/>`]; // 村莊一直亮著
    C.chapters.forEach((c) => {
      const cid = "jb2_ch" + c.n, stars = G.chapterStars(cid), max = G.chapterMax(cid) || c.max, mon = G.chapterMonsters(cid);
      let rank = c.ranks[0][1]; c.ranks.forEach(([min, name]) => { if (stars >= min) rank = name; });
      const isCur = cur && cur.n === c.n;
      
      // 黑色迷霧：前一章的星數達 50% 才亮起（第 1 章一開始就亮）
      const prev = C.chapters.find((x) => x.n === c.n - 1), open = !prev || G.chapterStars("jb2_ch" + prev.n) >= (G.chapterMax("jb2_ch" + prev.n) || prev.max) * 0.5;
      if (open) holes.push(`<ellipse cx="${c.island.x * 20}" cy="${c.island.y * 16}" rx="${c.island.rx + 50}" ry="${c.island.ry + 40}" fill="black" filter="url(#hbBlur)"/>`);
      stage.append(h("button", { class: "hb-isl" + (isCur ? " cur" : "") + (open ? "" : " fog"), style: `left:${c.island.x}%;top:${c.island.y}%;width:${(c.island.rx * 2 / M.w) * 100}%;height:${(c.island.ry * 2 / M.h) * 100}%`, onclick: () => (open ? goIsland(c) : (G.sfx("bad"), G.toast(`🌫️ 迷霧還沒散開：第 ${prev.n} 章的星星要拿到 50% 才會亮起`))) },
        isCur ? h("span", { class: "here" }, "📍 目前進度") : null,
        open ? h("span", { class: "plate" }, h("small", {}, `${c.em} 第 ${c.n} 章・${c.theme}`), h("b", {}, c.name), h("em", {}, `★ ${stars} / ${max}　${rank}`)) : h("span", { class: "plate lock" }, h("small", {}, `第 ${c.n} 章`), h("b", {}, "🔒 迷霧"), h("em", {}, `前一章 50% 開啟`)),
        mon ? h("span", { class: "badge" }, `👾${mon}`) : null));
    });
    const act = { home: () => G.openHome(), arena: () => G.openDuel(), shop: () => G.openStore() };
    M.buildings.forEach((b) => {
      stage.append(h("button", { class: "hb-bld", style: `left:${b.x}%;top:${b.y}%;width:${(b.size / M.w) * 100}%`, onclick: () => goBuilding(b, act[b.id]) },
        h("img", { src: `assets/hub/bld-${b.id}.webp`, alt: b.label }), h("span", {}, `${b.emoji} ${b.label}`)));
    });
    // 整張地圖蓋上黑色迷霧，只有村莊和已開啟的島嶼亮著
    stage.insertAdjacentHTML("afterbegin", `<svg class="hb-dark" viewBox="0 0 2000 1600" preserveAspectRatio="none"><defs><filter id="hbBlur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="40"/></filter><mask id="hbMask"><rect width="2000" height="1600" fill="white"/>${holes.join("")}</mask></defs><rect width="2000" height="1600" fill="#04060c" opacity=".97" mask="url(#hbMask)"/></svg>`);
    stage.append(me);
    if (!cur) stage.append(h("div", { class: "hb-allclear" }, "🏆 六章全部通關！"));
    const wrap = h("div", { class: "hb-wrap" }, stage);
    el.append(hud, wrap);
    if ((!H().sid || !H().name) && !G._idAsking) setTimeout(identityFlow, 300);
    else if (G.online) G.online.start();
    // 直接用整張大地圖鋪滿畫面（不縮成小圖）；畫面比較扁時，上下可以捲動，一開始對準村莊
    const W = wrap.clientWidth || window.innerWidth, Hh = wrap.clientHeight || window.innerHeight, sw = Math.max(W, Hh / 0.8);
    stage.style.width = sw + "px"; stage.style.height = sw * 0.8 + "px"; stage.style.setProperty("--sw", String(Math.round(sw)));
    wrap.scrollLeft = (sw - W) / 2; wrap.scrollTop = Math.max(0, (sw * 0.8 * (M.village.y / 100)) - Hh / 2);
  };

  /* ---------- 商店 ---------- */
  let lastTab = "cloak";
  function preview(it) {
    if (["cloak", "hat", "staff"].includes(it.slot)) return heroEl(Object.assign({}, H().eq, { [it.slot]: it.id }), 54);
    if (it.slot === "pet") return h("img", { src: `assets/hub/shop_${it.id}.webp`, alt: "", onerror: (e) => { e.target.replaceWith(document.createTextNode(it.icon || "🐾")); } });
    return h("span", { class: "hb-emoji" }, it.icon || "🎁");
  }
  G.openStore = (tab) => {
    tab = tab || lastTab; lastTab = tab;
    G.overlay((box) => {
      const S = G.S, hub = H();
      box.classList.add("hb-store");
      box.append(h("h2", {}, "🏪 數靈雜貨店"),
        h("div", { class: "muted", style: "font-weight:800" }, "你的金幣：", h("b", { style: "color:#b9821f;font-size:20px" }, `🪙 ${S.coins}`), "　（闖關、打怪物、休息小遊戲都能賺）"),
        h("div", { class: "hb-tabs" }, C.shop.tabs.map(([k, n]) => h("button", { class: k === tab ? "on" : "", onclick: () => G.openStore(k) }, n))));
      const grid = h("div", { class: "hb-grid" });
      const bought = (it) => { const t = G.today(); if (hub.buy.date !== t) hub.buy = { date: t, n: {} }; return hub.buy.n[it.id] || 0; };
      if (tab === "tech") { box.append(techBody()); return; }
      C.shop.items.filter((i) => i.slot === tab).forEach((it) => {
        const pr = price(it);
        let btn, note = null;
        if (it.cons) {
          const have = hub.inv[it.id] || 0, full = it.maxOwn && have >= it.maxOwn, lim = it.dailyLimit && bought(it) >= it.dailyLimit;
          btn = h("button", { class: "btn small", disabled: S.coins < pr || full || lim || !needOk(it) ? "disabled" : null, onclick: () => buy(it) }, full ? "已達持有上限" : lim ? "今天買過了" : `買 🪙${pr}`);
          note = h("small", {}, `持有：${have} 張`);
          if (it.id === "boost" && have > 0 && !hub.boostOn) note = h("span", {}, h("small", {}, `持有：${have} 張　`), h("button", { class: "btn small ghost", onclick: () => { hub.inv.boost--; hub.boostOn = true; G.save(); G.toast("🎟️ 下一關的金幣 ×2！"); G.openStore(tab); } }, "使用"));
          if (hub.boostOn && it.id === "boost") note = h("small", {}, "✅ 下一關金幣 ×2 準備好了");
        } else if (hub.own[it.id]) {
          if (it.slot === "furn") btn = h("button", { class: "btn small", disabled: "disabled" }, "已擺進小屋");
          else { const on = hub.eq[it.slot] === it.id; btn = h("button", { class: "btn small" + (on ? "" : " ghost"), disabled: on ? "disabled" : null, onclick: () => { hub.eq[it.slot] = it.id; G.save(); G.openStore(tab); } }, on ? "使用中" : "裝備"); }
        } else if (!needOk(it)) { btn = h("button", { class: "btn small", disabled: "disabled" }, `🔒 🪙${pr}`); note = h("small", {}, needText(it)); }
        else btn = h("button", { class: "btn small", disabled: S.coins < pr ? "disabled" : null, onclick: () => buy(it) }, S.coins < pr ? `金幣不足 🪙${pr}` : `買 🪙${pr}`);
        grid.append(h("div", { class: "it" }, h("div", { class: "pv" }, preview(it)), h("b", {}, it.name), h("small", {}, it.effect || ""), btn, note));
      });
      if (tab === "special") {
        // 家長設定的獎勵（原本的「獎勵商店」）放在這裡
        const R = S.rewards;
        grid.append(h("div", { class: "hb-reward" },
          h("h3", {}, "🎁 家長的獎勵"),
          h("div", { class: "muted", style: "font-weight:700" }, "兌換後要拿給爸媽確認，確認了才算數喔！"),
          R.items.map((it) => { const can = S.coins >= it.cost;
            return h("div", { class: "shop-item" }, h("span", { style: "font-size:30px" }, "🎁"), h("span", { class: "nm" }, it.name), h("span", { class: "cost" }, `🪙 ${it.cost}`),
              h("button", { class: "btn", disabled: can ? null : "disabled", onclick: () => redeem(it) }, can ? "兌換" : `差 ${it.cost - S.coins}`)); }),
          R.log.length ? h("div", {}, h("h3", { style: "margin:12px 0 4px" }, "我的兌換紀錄"),
            R.log.slice(-6).reverse().map((l) => h("div", { style: "font-weight:700;padding:3px 0" }, `${l.date}　${l.name}　`, h("span", { class: "st " + l.status }, { pending: "等爸媽確認", ok: "已確認", no: "沒通過" }[l.status] || l.status)))) : null));
      }
      box.append(grid);
    }, { wide: true, onClose: () => G.refreshScreen() });
    function buy(it) {
      const S = G.S, hub = H(), pr = price(it);
      if (!needOk(it)) return G.toast("還沒達成購買條件：" + needText(it));
      if (S.coins < pr) return G.toast("金幣不夠喔，再去闖幾關吧！");
      if (it.cons) {
        const t = G.today(); if (hub.buy.date !== t) hub.buy = { date: t, n: {} };
        hub.inv[it.id] = (hub.inv[it.id] || 0) + 1; hub.buy.n[it.id] = (hub.buy.n[it.id] || 0) + 1;
      } else {
        hub.own[it.id] = 1;
        if (["cloak", "hat", "staff", "pet", "title"].includes(it.slot)) hub.eq[it.slot] = it.id;
      }
      S.coins -= pr; G.save(); G.sfx("coin"); G.toast(`買到「${it.name}」！`);
      G.openStore(lastTab);
    }
    async function redeem(it) {
      const ok = await G.confirm(`用 🪙${it.cost} 兌換「${it.name}」？`, "兌換");
      if (!ok) return G.openStore("special");
      G.S.coins -= it.cost;
      const log = { id: Date.now(), name: it.name, cost: it.cost, date: G.today(), status: "pending" };
      G.S.rewards.log.push(log); G.save(); G.sfx("win");
      G.overlay((box) => {
        box.append(h("h2", { class: "center" }, "🎉 兌換成功！"),
          h("div", { class: "voucher" }, "🎟️ 兌換券", h("div", { style: "font-size:30px;margin:8px 0" }, it.name), h("div", { class: "muted" }, `${log.date}・🪙${it.cost}`), h("div", { style: "margin-top:8px;font-weight:900" }, "拿給爸媽確認喔！")),
          h("div", { class: "center", style: "margin-top:16px" }, h("button", { class: "btn", onclick: () => G.openStore("special") }, "好的")));
      }, { onClose: () => G.refreshScreen() });
    }
  };
  G.openShop = () => G.openStore("special"); // 舊的獎勵商店入口改指到商店的「特別」

  /* ---------- 小屋 ---------- */
  G.openHome = () => {
    const hub = H(), HM = C.home;
    let layer = G.$("#hb-home");
    if (layer) layer.remove();
    layer = h("div", { id: "hb-home", class: "hh-layer" });
    document.body.append(layer);
    const close = () => { layer.remove(); G.refreshScreen(); };
    const pos = (o, extra) => `left:${o.x}%;top:${o.y}%;width:${o.w}%;${o.h ? `height:${o.h}%;` : ""}z-index:${o.z || 1};${extra || ""}`;
    const room = h("div", { class: "hh-room", style: `background-image:url(assets/hub/wallpaper.webp)` });
    const furnAct = {
      furn_rug: () => { const n = 1 + Math.floor(Math.random() * 9); G.sfx("power"); G.toast(`🧶 踩在魔法地毯上，今天的幸運數字是 ${n}！（試試看，這個數字會不會出現在題目裡？）`); },
      furn_shelf: () => panel("📚 魔法書櫃：我學過的重點", shelfBody()),
      furn_fish: () => { G.sfx("coin"); const t = ["🐠 小魚游過來吃飼料了！", "🐟 魚兒吐了一串泡泡：x ＋ y ＝ ？", "🐡 河豚說：一元一次不等式，記得負數要變號！", "🐠 魚兒在水裡畫了一條直線 y ＝ ax ＋ b"]; G.toast(t[Math.floor(Math.random() * t.length)]); },
      furn_stars: () => { room.classList.toggle("night"); G.sfx("click"); G.toast(room.classList.contains("night") ? "🌌 星空亮起來了" : "☀️ 回到白天"); },
    };
    const furnList = (HM.furniture || []).concat((HM.furniture || []).some((f) => f.id === "furn_stars") ? [] : [{ id: "furn_stars", x: 84, y: 4, w: 8, h: 10, z: 5, emoji: "🌌" }]);
    furnList.forEach((f) => { if (hub.own[f.id]) room.append(h("button", { class: "hh-furn", style: pos(f), title: (ITEM[f.id] ? ITEM[f.id].name : f.id), onclick: () => (furnAct[f.id] || (() => {}))() }, h("span", {}, ITEM[f.id] ? ITEM[f.id].icon : f.emoji))); });
    const acts = {
      trophy: () => panel("🏆 數靈圖鑑牆", trophyBody()),
      closet: () => panel("🧥 衣櫃", closetBody()),
      bed: () => bed(),
      desk: () => panel("🖥️ 我的資料", deskBody()),
      catnest: () => panel("🐱 智慧貓", catBody()),
      safe: () => panel("📦 備份・存檔碼", safeBody()),
    };
    HM.items.forEach((it) => room.append(h("button", { class: "hh-item", style: pos(it), title: it.label, onclick: () => { G.sfx("click"); acts[it.act](); } }, h("img", { src: `assets/hub/home_${it.id}.webp`, alt: it.label }), h("span", {}, `${it.emoji} ${it.label}`))));
    room.append(h("button", { class: "hh-hero", style: pos(HM.hero), title: "點我換裝", onclick: () => { G.sfx("click"); acts.closet(); } }, heroEl(hub.eq, 100)));
    const pe = petEl("hh-pet");
    if (pe) {
      pe.setAttribute("style", `left:${HM.pet.x}%;top:${HM.pet.y}%;width:${Math.max(HM.pet.w, 7)}%`);
      pe.addEventListener("click", () => { pe.classList.remove("hop"); void pe.offsetWidth; pe.classList.add("hop"); G.sfx("coin"); const p = petOf(); G.toast(`${p ? p.icon : "🐾"} ${p ? p.name : "寵物"}開心地跳了一下！`); });
      room.append(pe);
    }
    layer.append(h("div", { class: "hh-top" }, h("button", { class: "btn ghost", onclick: close }, "⬅ 回大地圖"), h("b", {}, "🏠 我的小屋"), h("span", {}, "點家具看看")), room);

    function panel(title, body) { G.overlay((box) => { box.append(h("h2", {}, title), body); }, { wide: true }); }
    function trophyBody() {
      const wrap = h("div", { class: "hb-mons" });
      C.chapters.forEach((c) => {
        const cid = "jb2_ch" + c.n, d = window.CH_DATA && window.CH_DATA[cid];
        if (!d) return;
        d.nodes.forEach((n) => { const st = G.nodeState(n.id), got = st.stars > 0;
          wrap.append(h("div", { class: "mon" + (got ? "" : " off") }, h("img", { src: `assets/${n.img}.webp`, alt: "" }), h("b", {}, got ? n.title : "？？？"), h("small", {}, got ? `${"★".repeat(st.stars)}` : "還沒收服"))); });
      });
      return h("div", {}, h("p", { class: "muted" }, "通關的關卡，那隻數靈就會出現在這裡。"), wrap);
    }
    function shelfBody() {
      const wrap = h("div", { style: "max-height:60vh;overflow:auto;color:#3b2508" });
      let any = false;
      CIDS.forEach((cid, ci) => {
        const d = window.CH_DATA && window.CH_DATA[cid]; if (!d) return;
        const got = d.nodes.filter((n) => G.nodeState(n.id).stars > 0);
        if (!got.length) return;
        any = true;
        wrap.append(h("h3", { style: "margin:10px 0 4px" }, `第 ${C.chapters[ci].n} 章　${C.chapters[ci].theme}`));
        got.forEach((n) => wrap.append(h("div", { class: "hb-sk" }, h("b", {}, n.place), ...n.intro.slice(1).map((t) => h("div", { style: "font-size:15px;margin-top:3px" }, "・" + t)))));
      });
      if (!any) wrap.append(h("p", { class: "muted" }, "通關的關卡，重點會收進這個書櫃裡，隨時可以回來複習。"));
      return wrap;
    }
    function closetBody() {
      const box = h("div", {});
      [["cloak", "服飾"], ["hat", "帽子"], ["staff", "法杖"], ["pet", "寵物"], ["title", "稱號"]].forEach(([slot, name]) => {
        const own = C.shop.items.filter((i) => i.slot === slot && hub.own[i.id]);
        const row = h("div", { class: "hb-row" }, h("b", {}, name + "："));
        if (slot === "pet" || slot === "title") row.append(h("button", { class: "btn small" + (!hub.eq[slot] ? "" : " ghost"), onclick: () => { hub.eq[slot] = null; G.save(); G.openHome(); G.closeOverlay(); } }, "不戴／不帶"));
        own.forEach((i) => row.append(h("button", { class: "btn small" + (hub.eq[slot] === i.id ? "" : " ghost"), onclick: () => { hub.eq[slot] = i.id; G.save(); G.openHome(); G.closeOverlay(); } }, i.name)));
        if (!own.length && slot !== "cloak") row.append(h("small", {}, "到商店買買看"));
        box.append(row);
      });
      return h("div", {}, h("div", { class: "hb-me2" }, heroEl(hub.eq, 90)), box);
    }
    function bed() {
      const t = G.today(), ck = hub.checkin;
      G.overlay((box) => {
        const done = ck.date === t, gold = Math.min(C.economy.checkin.limit, C.economy.checkin.base + C.economy.checkin.step * Math.max(0, G.S.streak.count - 1));
        box.append(h("h2", {}, "🛏️ 每日簽到"), h("p", { style: "font-size:19px;font-weight:700" }, `連續玩了 ${G.S.streak.count} 天。今天簽到可以拿 🪙 ${gold}（連續越久越多，最多 ${C.economy.checkin.limit}）。`),
          h("button", { class: "btn big", disabled: done ? "disabled" : null, onclick: () => { ck.date = t; G.S.coins += gold; G.save(); G.sfx("coin"); G.toast(`簽到成功！🪙 +${gold}`); G.closeOverlay(); } }, done ? "今天簽到過了" : "簽到"),
          h("h3", { style: "margin-top:16px" }, "😴 睡一覺"), h("p", { class: "muted" }, "每天可以睡一覺，讓所有數靈各恢復 30% 生命（倒下的也會起來；對戰受的傷會帶回地圖）。"),
          h("button", { class: "btn", disabled: hub.slept === t ? "disabled" : null, onclick: () => { hub.slept = t; capturedList().forEach((m) => { const mx = G.duelStats(m.lv).hp; hub.mon[m.id] = { hp: Math.min(mx, monHp(m) + Math.round(mx * 0.3)) }; }); G.save(); G.toast("😴 睡飽了，數靈們恢復了精神！"); G.closeOverlay(); } }, hub.slept === t ? "今天睡過了" : "睡一覺"));
      });
    }
    function deskBody() {
      const S = G.S, st = S.stats;
      return h("div", { style: "font-size:19px;font-weight:700;line-height:1.9" }, `學號：${hub.sid || "（還沒登記）"}　勇者名：${hub.name || "（還沒取名）"}　`, h("button", { class: "btn small ghost", onclick: () => nameFlow(false) }, "改名"), h("br"), `總星數：${totalStars()} ⭐`, h("br"), `玩過 ${st.plays} 關　答了 ${st.answered} 題　答對率 ${st.answered ? Math.round((st.correct / st.answered) * 100) : 0}%`, h("br"),
        `連續 ${S.streak.count} 天　金幣 🪙 ${S.coins}　抽卡券 🎟️ ${S.tickets}`, h("br"), `對戰：${(S.duel && S.duel.w) || 0} 勝 ${(S.duel && S.duel.l) || 0} 敗`);
    }
    function catBody() {
      const by = {};
      Object.values(G.S.wrong).forEach((w) => { by[w.node] = (by[w.node] || 0) + 1; });
      const rows = Object.entries(by).sort((a, b) => b[1] - a[1]);
      const names = {};
      Object.values(window.CH_DATA || {}).forEach((d) => d.nodes.forEach((n) => { names[n.id] = `${n.place}`; }));
      return h("div", { style: "font-size:18px;font-weight:700;line-height:1.8" }, h("p", {}, "🐱 我是智慧貓！答錯的題目會變成怪物，我幫你記著，哪裡最需要複習一目了然："),
        rows.length ? rows.map(([id, n]) => h("div", {}, `👾 ${n} 隻　${names[id] || id}`)) : h("div", {}, "目前沒有還沒記牢的題目，太厲害了！"));
    }
    function safeBody() {
      const code = window.JB2Seal ? JB2Seal.makeDefCode(G.S) : "MD1-" + btoa(unescape(encodeURIComponent(JSON.stringify(G.S))));   // MD2- 開頭＝有簽章，被改過就不能還原
      const ta = h("textarea", { class: "hb-code", rows: 5 }); ta.value = code;
      const inp = h("textarea", { class: "hb-code", rows: 3, placeholder: "貼上存檔碼" });
      return h("div", {}, h("p", { class: "muted" }, "進度存在這台裝置的瀏覽器裡。換電腦或清除資料前，先複製存檔碼，之後貼回來就能還原。"), ta,
        h("button", { class: "btn small", onclick: () => { ta.select(); try { document.execCommand("copy"); G.toast("已複製"); } catch (e) {} } }, "複製"),
        h("h3", {}, "還原"), inp,
        h("button", { class: "btn small red", onclick: async () => { try { const s = inp.value.trim(); const r = window.JB2Seal ? JB2Seal.openDef(s) : { ok: false, why: "bad" }; if (!r.ok) { G.toast(window.JB2Record ? JB2Record.msg(r.why) : "存檔碼不對"); return; } if (!(await G.confirm("要用這個存檔碼覆蓋目前的進度嗎？", "覆蓋"))) return; G.S = r.state; G.save(); location.reload(); } catch (e) { G.toast("存檔碼不對"); } } }, "還原"));
    }
  };


  /* ---------- 我的數靈（通關過的關卡）、受傷、招式 ---------- */
  const GSK = window.JB2_DUEL && window.JB2_DUEL.skills;
  const SLOTN = (GSK && GSK.slots) || 4;
  function capturedList() {
    const out = [];
    CIDS.forEach((cid, ci) => { const d = window.CH_DATA && window.CH_DATA[cid]; if (!d) return;
      d.nodes.forEach((n) => { const st = G.nodeState(n.id); if (st.stars > 0) out.push({ id: n.place.split(" ")[0], name: n.title, emoji: n.emoji, img: `assets/${n.img}.webp`, ci, lv: G.monLevel(st.stars, st.plays), boss: !!n.boss }); }); });
    return out;
  }
  G.hubLoadAll = async () => { for (const cid of CIDS) await G.loadChapter(cid); };
  const monHp = (m) => { const mx = G.duelStats(m.lv).hp, r = H().mon[m.id]; return r && r.hp != null ? Math.min(mx, r.hp) : mx; };
  const skD = (id) => (GSK ? GSK.defs[id] || null : null);
  const skT = (id) => { const d = skD(id); return d ? GSK.types[d.t] : null; };
  const skLv = (id) => (GSK.learnLv && GSK.learnLv[String(id).split(":")[1]]) || 1;
  const isTech = (id) => String(id).charAt(0) === "T";
  // 這隻目前裝在招式格的招（依設定；沒設定過＝預設專屬招）
  function effSlots(id, lv) {
    const r = H().sk[id], list = r && Array.isArray(r.slots) ? r.slots : (GSK.mon[id] || []).slice(0, SLOTN), out = [];
    for (let i = 0; i < SLOTN; i++) { const x = list[i]; out.push(x && skD(x) && (isTech(x) ? ((r && r.tech) || []).includes(x) : x.split(":")[0] === id && lv >= skLv(x)) ? x : null); }
    return out;
  }
  const ownSkills = (id, lv) => (GSK.mon[id] || []).filter((x) => lv >= skLv(x)).concat((H().sk[id] && H().sk[id].tech) || []);
  G.hubSpec = (id, lv) => ({ hp: monHp({ id, lv }), sk: effSlots(id, lv).filter(Boolean) });
  const pc = (x) => Math.round(x * 100) + "%";
  function typeText(ty, bonus) {
    let t = "";
    switch (ty.k) {
      case "phys": t = `物理攻擊 ×${ty.p}`; break; case "mag": t = `魔法攻擊 ×${ty.p}`; break;
      case "vamp": t = `物理攻擊 ×${ty.p}，吸回傷害的 ${pc(ty.leech)}`; break; case "drain": t = `魔法攻擊 ×${ty.p}，吸走對手 ${pc(ty.pct)} 魔力`; break;
      case "shield": t = `自己防禦 ×${ty.m}，${ty.t} 回合`; break; case "buff": t = `自己攻擊 ×${ty.m}，${ty.t} 回合`; break;
      case "debuff": t = `對手防禦 ×${ty.m}，${ty.t} 回合`; break; case "heal": t = `補回 ${pc(ty.pct)} 血量`; break;
      case "mpheal": t = `補回 ${pc(ty.pct)} 魔力`; break; case "poison": t = `每回合扣最大血量 ${pc(ty.pct)}，${ty.t} 回合`; break;
      case "blind": t = `對手 ${pc(ty.miss)} 機率落空，${ty.t} 回合`; break; case "stun": t = "對手少一次行動"; break;
      case "ult": { const b = GSK.types[bonus]; t = `魔法攻擊 ×${ty.p}` + (b ? `，另附「${b.n}」（強度 ${pc(ty.rate)}）` : ""); break; }
    }
    return t + `｜耗魔 ${ty.mp}` + (ty.lim ? `｜每場 ${ty.lim} 次` : "");
  }
  function skCard(id, tag) {
    const d = skD(id), ty = skT(id);
    if (!d || !ty) return null;
    return h("div", { class: "hb-sk" }, h("b", {}, d.n), h("span", { class: "tg" }, ty.n + (d.b ? "＋" + GSK.types[d.b].n : "")), tag || null, h("br"), h("small", {}, typeText(ty, d.b)), h("br"), h("small", {}, "📖 " + (d.c || "")));
  }
  const reopen = (fn) => { G.closeOverlay(); setTimeout(fn, 30); };

  // 🩹 隊伍：看每隻的生命、用道具、管理招式
  G.openTeam = async () => {
    await G.hubLoadAll();
    const hub = H(), list = capturedList(), inv = hub.inv;
    G.overlay((box) => {
      box.append(h("h2", {}, "🩹 我的數靈隊伍"));
      if (!list.length) return box.append(h("p", { class: "muted" }, "還沒有收服任何數靈。通關一關就能收服那一關的數靈，帶去鬥技場對戰！"));
      box.append(h("div", { class: "muted", style: "font-weight:700" }, `補血藥水：小 ${inv.heal_s || 0}、中 ${inv.heal_m || 0}、大 ${inv.heal_l || 0}　復活羽毛：${inv.revive || 0}　補魔藥水：小 ${inv.mp_s || 0}、中 ${inv.mp_m || 0}、大 ${inv.mp_l || 0}（補魔只在戰鬥中用）。道具到商店「治療用品」買。`));
      const grid = h("div", { class: "hb-mons team" });
      list.forEach((m) => {
        const mx = G.duelStats(m.lv).hp, hp = monHp(m), down = hp <= 0, full = hp >= mx;
        const use = (iid) => { const it = C.shop.items.find((x) => x.id === iid); if (!(inv[iid] > 0)) return;
          hub.mon[m.id] = { hp: it.revivePct ? Math.round((mx * it.revivePct) / 100) : Math.min(mx, hp + Math.round((mx * it.healPct) / 100)) }; inv[iid]--; G.save(); G.sfx("power"); G.toast(it.revivePct ? `「${m.name}」復活了！` : `「${m.name}」恢復了生命`); reopen(G.openTeam); };
        const btns = [];
        if (down) btns.push(h("button", { class: "btn small", disabled: inv.revive ? null : "disabled", onclick: () => use("revive") }, "🪶 復活"));
        else if (!full) ["heal_s:🧪小", "heal_m:🥤中", "heal_l:⚗️大"].forEach((x) => { const [iid, lb] = x.split(":"); btns.push(h("button", { class: "btn small", disabled: inv[iid] ? null : "disabled", onclick: () => use(iid) }, lb)); });
        btns.push(h("button", { class: "btn small ghost", onclick: () => reopen(() => G.openSkills(m.id)) }, "✨ 招式"));
        grid.append(h("div", { class: "mon" + (down ? " off" : "") }, h("img", { src: m.img, alt: "" }), h("b", {}, m.name), h("small", {}, `Lv.${m.lv}${down ? "　💀倒下" : full ? "　健康" : ""}`),
          h("div", { class: "hpbar" }, h("i", { style: `width:${Math.max(0, (hp / mx) * 100)}%` })), h("small", {}, `${hp}/${mx}`), h("div", { class: "hb-row" }, btns)));
      });
      box.append(grid);
    }, { wide: true });
  };
  // ✨ 招式管理
  G.openSkills = async (id) => {
    await G.hubLoadAll();
    const hub = H(), m = capturedList().find((x) => x.id === id);
    G.overlay((box) => {
      if (!m) return box.append(h("p", {}, "還沒收服這隻數靈。"));
      const slots = effSlots(id, m.lv), own = ownSkills(id, m.lv);
      box.append(h("h2", {}, `✨ ${m.name} 的招式`), h("div", { class: "muted", style: "font-weight:700" }, `Lv.${m.lv}　對戰時可選：基本攻擊＋下面 ${SLOTN} 個招式＋${GSK.guard.name}＋換人`));
      const grid = h("div", { class: "hb-grid" });
      slots.forEach((sid, i) => {
        const sel = h("select", {}, h("option", { value: "" }, "（空）"), own.map((x) => h("option", { value: x, selected: x === sid ? "selected" : null }, `${skD(x).n}〔${skT(x).n}〕`)));
        sel.onchange = () => { const arr = effSlots(id, m.lv), v = sel.value; if (v) { const j = arr.indexOf(v); if (j >= 0 && j !== i) arr[j] = null; } arr[i] = v || null; const r = hub.sk[id] || (hub.sk[id] = { slots: null, tech: [], n: 0 }); r.slots = arr; G.save(); reopen(() => G.openSkills(id)); };
        grid.append(h("div", { class: "it", style: "align-items:stretch;text-align:left" }, h("b", {}, `招式格 ${i + 1}`), sel, h("small", {}, sid ? typeText(skT(sid), skD(sid).b) : "空格：對戰時沒有這一招")));
      });
      box.append(grid, h("div", { class: "hb-row" },
        h("button", { class: "btn small ghost", onclick: () => { const r = hub.sk[id]; if (r) r.slots = null; G.save(); G.toast("已還原成預設的專屬招"); reopen(() => G.openSkills(id)); } }, "↺ 還原預設招式"),
        h("button", { class: "btn small", onclick: () => { techMon = id; G.closeOverlay(); G.openStore("tech"); } }, "🔬 研發新招")));
      box.append(h("h3", {}, "這隻的所有招式"));
      (GSK.mon[id] || []).forEach((x) => box.append(skCard(x, m.lv >= skLv(x) ? null : h("span", { class: "tg lock" }, `🔒 Lv.${skLv(x)} 學會`))));
      ((hub.sk[id] && hub.sk[id].tech) || []).forEach((x) => box.append(skCard(x, h("span", { class: "tg tech" }, "研發"))));
    }, { wide: true });
  };
  // 🔬 研發所（商店「研發」分頁）
  let techMon = null;
  const researchPrice = (id) => { const n = (H().sk[id] && H().sk[id].n) || 0, R2 = C.skills.research; return Math.round(((R2.baseDays + R2.stepDays * n) * C.economy.dailyBase) / C.economy.priceRound) * C.economy.priceRound; };
  function techBody() {
    const hub = H(), list = capturedList(), R2 = C.skills.research, box = h("div", {});
    box.append(h("div", { class: "hb-note" }, `🔬 在研發所，花金幣替一隻數靈研發通用新招。這隻被研發過的次數越多，下次越貴（每次多 ${R2.stepDays} 天的基準收入）；沒研發過的最便宜。學會後可以裝在牠的招式格。`));
    if (!list.length) return box.append(h("p", { class: "muted" }, "還沒有收服任何數靈。先去闖關吧！")), box;
    if (!techMon || !list.find((x) => x.id === techMon)) {
      box.append(h("h3", {}, "① 先選要研發的數靈"));
      const grid = h("div", { class: "hb-mons" });
      list.forEach((m) => { const n = (hub.sk[m.id] && hub.sk[m.id].n) || 0; grid.append(h("button", { class: "mon", style: "border:0;cursor:pointer", onclick: () => { techMon = m.id; G.openStore("tech"); } }, h("img", { src: m.img, alt: "" }), h("b", {}, m.name), h("small", {}, `Lv.${m.lv}　已研發 ${n} 次`), h("small", { style: "color:#a06a10" }, `下次 🪙${researchPrice(m.id)}`))); });
      return box.append(grid), box;
    }
    const m = list.find((x) => x.id === techMon), pr = researchPrice(m.id), learned = (hub.sk[m.id] && hub.sk[m.id].tech) || [];
    box.append(h("div", { class: "hb-row" }, h("button", { class: "btn small ghost", onclick: () => { techMon = null; G.openStore("tech"); } }, "← 換一隻"), h("button", { class: "btn small ghost", onclick: () => reopen(() => G.openSkills(m.id)) }, "✨ 管理招式")),
      h("div", {}, h("b", {}, `${m.emoji} ${m.name}`), `　Lv.${m.lv}　下次研發 🪙${pr}（你有 🪙${G.S.coins}）`), h("h3", {}, "② 選要研發的招式（那一章全部通關後開放）"));
    CIDS.forEach((cid, ci) => {
      const d = window.CH_DATA && window.CH_DATA[cid], open = d && d.nodes.every((n) => G.nodeState(n.id).stars > 0), c = C.chapters[ci];
      box.append(h("div", { class: "muted", style: "margin-top:6px" }, `第 ${c.n} 章　${c.theme}${open ? "" : "　🔒 全通關後開放"}`));
      if (!open) return;
      (C.skills.techList[c.n] || []).forEach((tid) => { const has = learned.includes(tid);
        box.append(skCard(tid), h("div", { style: "text-align:right" }, h("button", { class: "btn small", disabled: has || G.S.coins < pr ? "disabled" : null, onclick: () => {
          if (G.S.coins < pr) return G.toast("金幣不夠喔！");
          const r = hub.sk[m.id] || (hub.sk[m.id] = { slots: null, tech: [], n: 0 });
          G.S.coins -= pr; r.tech.push(tid); r.n = (r.n | 0) + 1;
          const arr = effSlots(m.id, m.lv), i = arr.indexOf(null); let msg = `「${m.name}」研發了「${skD(tid).n}」！`;
          if (i >= 0) { arr[i] = tid; r.slots = arr; msg += `已裝在招式格 ${i + 1}`; } else msg += "招式格已滿，到「管理招式」替換上去吧";
          G.save(); G.sfx("power"); G.toast(msg); G.openStore("tech");
        } }, has ? "已學會" : G.S.coins < pr ? "金幣不足" : `研發 🪙${pr}`))); });
    });
    return box;
  }
  // 全部數靈都倒下：扣一半金幣，所有數靈恢復到滿。發生時回傳 {lost}，沒發生回傳 null
  G.hubCheckWipe = () => {
    const list = capturedList();
    if (!list.length || !list.every((m) => monHp(m) <= 0)) return null;
    const lost = Math.floor(G.S.coins / 2);
    G.S.coins -= lost; H().mon = {}; G.save();
    return { lost };
  };
  // 第一次登入：先打學號，再取遊戲名稱（只收這兩樣，不收真名、電話）
  function identityFlow() {
    if (G._idAsking) return; G._idAsking = true;
    const hub = H();
    const finish = () => { G._idAsking = false; G.save(); G.closeOverlay(); G.toast(`你好，${hub.name}！`); if (G.$("#s-hub").classList.contains("active")) G.renderHub(); if (G.online) G.online.start(); };
    const stepName = () => G.overlay((box) => {
      const inp = h("input", { type: "text", maxlength: 8, placeholder: "遊戲名稱（最多 8 個字）", style: "font-size:22px;padding:8px;width:100%;box-sizing:border-box" });
      inp.value = hub.name || (function () { try { return (JSON.parse(localStorage.getItem("jb2-hub-v1")) || {}).who.name || ""; } catch (e) { return ""; } })();   // 沿用 JB2 的勇者名
      box.append(h("h2", {}, "② 取一個遊戲名稱"), h("p", { class: "muted" }, "第一次取名免費，以後要改名需要「改名卡」。請不要用真名。"), inp,
        h("div", { class: "row", style: "justify-content:center;margin-top:12px" }, h("button", { class: "btn", onclick: () => { const v = inp.value.trim().slice(0, 8); if (!v) return G.toast("請輸入名字"); hub.name = v; finish(); } }, "開始冒險！")));
    }, { close: false });
    const stepSid = () => G.overlay((box) => {
      const inp = h("input", { type: "text", maxlength: 20, placeholder: "學號", inputmode: "text", style: "font-size:24px;padding:8px;width:100%;box-sizing:border-box" });
      inp.value = hub.sid || "";
      box.append(h("h2", {}, "① 請輸入你的學號"), h("p", { class: "muted" }, "學號用來跟同學對戰、讓老師看到學習狀況。請打正確的學號，只能用英文字母、數字。"), inp,
        h("div", { class: "row", style: "justify-content:center;margin-top:12px" }, h("button", { class: "btn", onclick: async () => {
          const v = inp.value.trim();
          if (!/^[A-Za-z0-9_-]{1,20}$/.test(v)) return G.toast("學號只能用英文字母、數字（1～20 個字）");
          if (!(await G.confirm(`你的學號是「${v}」，沒有打錯嗎？`, "沒錯"))) return stepSid();
          hub.sid = v; G.save(); try { window.JB2Sync && JB2Sync.setNo(v); } catch (e) {} G.closeOverlay(); stepName();
        } }, "下一步")));
    }, { close: false });
    // JB2 已經登記過學號 → 直接沿用，不再問（兩個遊戲是同一個人，老師的報表才對得起來）
    if (!hub.sid && window.JB2Sync && JB2Sync.activeNo && JB2Sync.activeNo()) { hub.sid = String(JB2Sync.activeNo()); G.save(); }
    if (hub.sid) stepName(); else stepSid();
  }
  // 勇者名：第一次免費，之後要改名卡
  function nameFlow(first) {
    const hub = H();
    if (!first && hub.name && !((hub.inv.rename | 0) > 0)) return G.toast("要改名需要「改名卡」，到商店的「特別」分頁買一張！");
    G.overlay((box) => {
      const inp = h("input", { type: "text", maxlength: 8, placeholder: "勇者名（最多 8 個字）", style: "font-size:22px;padding:8px;width:100%;box-sizing:border-box" });
      inp.value = hub.name || "";
      box.append(h("h2", {}, first ? "✨ 幫自己取個勇者名吧" : "🪪 改名"), h("p", { class: "muted" }, first ? "第一次取名免費。以後要改名需要「改名卡」，所以想清楚喔！不要用真名。" : "會用掉 1 張改名卡。"), inp,
        h("div", { class: "row", style: "justify-content:center;margin-top:12px" }, h("button", { class: "btn", onclick: () => { const v = inp.value.trim().slice(0, 8); if (!v) return G.toast("請輸入名字"); if (!first && hub.name) hub.inv.rename--; hub.name = v; G.save(); G.closeOverlay(); G.toast(`你好，${v}！`); if (G.$("#s-hub").classList.contains("active")) G.renderHub(); } }, "確定"), first ? h("button", { class: "btn ghost", onclick: () => { hub.name = "勇者"; G.save(); G.closeOverlay(); } }, "先叫「勇者」") : null));
    });
  }

  /* ---------- 雙倍券：下一關金幣 ×2 ---------- */
  const _buff = G.buff;
  G.buff = (t) => _buff(t) + (t === "coins" && G.S.hub && G.S.hub.boostOn ? 1 : 0);
  const _fin = G.finishStage;
  G.finishStage = (n, r) => { const o = _fin(n, r); if (G.S.hub && G.S.hub.boostOn && !r.monster) { G.S.hub.boostOn = false; G.save(); } return o; };
})();
