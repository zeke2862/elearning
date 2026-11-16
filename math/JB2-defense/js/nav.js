/* 時空守護者 — 選科目、選版本、選章節 */
(function () {
  const G = window.G, h = G.h;
  const SUBJECTS = [
    { name: "國文", icon: "📜", color: "#c0573b", desc: "書院國度" },
    { name: "英文", icon: "🔤", color: "#3f8de0", desc: "海港小鎮" },
    { name: "數學", icon: "🛸", color: "#3f6fe0", desc: "宇宙語言" },
    { name: "生物", icon: "🌿", color: "#2fae66", desc: "森林谷地" },
    { name: "歷史", icon: "⏳", color: "#d9822b", desc: "時光長河" },
    { name: "地理", icon: "🗺️", color: "#1f9aa8", desc: "大地之島" },
    { name: "公民", icon: "⚖️", color: "#b8862e", desc: "公民之城" },
  ];
  G.SUBJECTS = SUBJECTS;
  const SEMS = ["國一上", "國一下"];
  let cur = { subject: null, sem: "國一上" };

  function hud() {
    const S = G.S;
    return h("div", { class: "hud" },
      h("span", { class: "pill" }, h("span", { class: "ic" }, "🪙"), S.coins),
      h("span", { class: "pill" }, h("span", { class: "ic" }, "🎟️"), S.tickets),
      h("span", { class: "pill", title: "連續天數" }, h("span", { class: "ic" }, "🔥"), `${S.streak.count} 天`),
      // 稱號：網站登入了會顯示在帳號名字旁邊（cloud.js），這裡就不重複
      G.latestTitle() && !(G.ME && G.ME.user) ? h("span", { class: "pill title-pill", title: "稱號：集滿一整篇的卡片拿到的" }, h("span", { class: "ic" }, "🏅"), h("span", { class: "tt" }, G.latestTitle())) : null,
      h("span", { class: "spacer" }),
      G.openDuel ? h("button", { class: "btn ghost", onclick: () => G.openDuel() }, "⚔️ 對戰") : null,
      window.RelaxBreak ? h("button", { class: "btn ghost", onclick: () => RelaxBreak.openZone() }, "🎮 遊戲區") : null,
      h("button", { class: "btn ghost", onclick: () => G.openShop() }, "🎁 獎勵商店"),
      h("button", { class: "btn ghost", onclick: () => G.openParent() }, "👪 家長"),
      h("button", { class: "icon-btn", onclick: () => { G.S.settings.sound = !G.S.settings.sound; G.save(); G.refreshScreen(); } }, G.S.settings.sound ? "🔊" : "🔇"));
  }

  // 一個科目（某版本）所有章節的 cid
  function chapterIds(subject, version) {
    const sub = G.CAT.subjects[subject];
    if (!sub) return [];
    const v = sub.versions[version] || sub.versions["_"] || Object.values(sub.versions)[0];
    return Object.values(v || {}).flat().filter((x) => x.cid).map((x) => x.cid);
  }
  function versionsOf(subject) {
    const sub = G.CAT.subjects[subject];
    return sub ? Object.keys(sub.versions).filter((v) => v !== "_") : [];
  }

  G.renderWorld = () => {
    const el = G.$("#s-world");
    el.innerHTML = "";
    const grid = h("div", { class: "world-grid" });
    for (const s of SUBJECTS) {
      const vers = versionsOf(s.name);
      const ver = vers.length ? G.versionOf(s.name) || vers[0] : "_";
      const ids = chapterIds(s.name, ver).filter((cid) => G.CAT.chapters[cid] && G.CAT.chapters[cid].ready);
      const stars = ids.reduce((a, cid) => a + G.chapterStars(cid), 0), max = ids.reduce((a, cid) => a + G.chapterMax(cid), 0);
      const mon = ids.reduce((a, cid) => a + G.chapterMonsters(cid), 0);
      const tile = h("button", { class: "world-tile", style: `--c:${s.color}`, onclick: () => openSubject(s.name) },
        h("span", { class: "wt-ic" }, s.icon),
        h("span", { class: "wt-name" }, s.name),
        h("span", { class: "wt-desc" }, s.desc + (vers.length && G.versionOf(s.name) ? `・${G.versionOf(s.name)}版` : "")),
        h("span", { class: "wt-prog" }, h("i", { style: `width:${max ? (stars / max) * 100 : 0}%` })),
        h("span", { class: "wt-stars" }, ids.length ? `★ ${stars} / ${max}　${ids.length} 章` : "製作中"),
        mon ? h("span", { class: "badge" }, `👾${mon}`) : null);
      grid.append(tile);
    }
    el.append(hud(), h("div", { class: "world-head" }, h("h1", {}, "選擇國度"), h("p", {}, "國一全科・時空地圖")), grid);
  };

  function openSubject(subject) {
    G.sfx("click");
    const vers = versionsOf(subject);
    if (vers.length > 1 && !G.versionOf(subject)) return pickVersion(subject);
    cur.subject = subject;
    G.show("s-chapters");
    G.renderChapters();
  }

  G.openSubject = openSubject;

  function pickVersion(subject) {
    const vers = versionsOf(subject);
    G.overlay((box) => {
      box.append(h("h2", {}, `${subject}：你的課本是哪個版本？`),
        h("p", { class: "muted", style: "font-weight:700" }, "選了之後，章節會照你課本的課次排。之後可以在章節列表右上角換。"));
      const row = h("div", { class: "ver-row" });
      for (const v of vers) {
        const n = chapterIds(subject, v).length;
        row.append(h("button", { class: "ver-card" + (G.versionOf(subject) === v ? " on" : ""), onclick: () => {
          G.setVersion(subject, v);
          G.closeOverlay();
          cur.subject = subject;
          G.show("s-chapters");
          G.renderChapters();
        } }, h("b", {}, `${v}版`), h("span", {}, `${n} 課可以玩`)));
      }
      box.append(row);
    }, { onClose: () => G.refreshScreen() });
  }

  G.renderChapters = () => {
    const subject = cur.subject;
    const s = SUBJECTS.find((x) => x.name === subject);
    const vers = versionsOf(subject);
    const ver = vers.length ? G.versionOf(subject) || vers[0] : "_";
    const sub = G.CAT.subjects[subject];
    const lists = (sub && (sub.versions[ver] || sub.versions["_"])) || {};
    // 學期之外的分頁（例如歷史的「⚔️ 攻城戰」）排在後面；分享版用 CATALOG.tabs 自訂分頁
    const order = G.CAT.tabs || SEMS;
    const tabsList = order.concat(Object.keys(lists).filter((g) => !order.includes(g)));
    if (!lists[cur.sem]) cur.sem = tabsList.find((g) => lists[g]) || SEMS[0];
    const el = G.$("#s-chapters");
    el.innerHTML = "";
    el.style.setProperty("--c", s.color);
    const head = h("div", { class: "chap-head" },
      G.CAT.single
        ? h("button", { class: "btn ghost", onclick: () => G.show("s-title") }, "⬅ 首頁")
        : h("button", { class: "btn ghost", onclick: () => { G.show("s-world"); G.renderWorld(); } }, "⬅ 科目"),
      h("div", { class: "ch-title" }, `${s.icon} ${subject}`, ver !== "_" ? h("span", { class: "tag", style: "margin-left:10px;vertical-align:middle" }, `${ver}版`) : null),
      vers.length > 1 ? h("button", { class: "btn ghost", onclick: () => pickVersion(subject) }, "換版本") : null);
    const tabs = h("div", { class: "sem-tabs" }, tabsList.map((g) => h("button", { class: g === cur.sem ? "on" : "", onclick: () => { cur.sem = g; G.renderChapters(); } }, g)));
    const grid = h("div", { class: "chap-grid" });
    // 歷史大解密排在戰役下面，自己一排（章節總表標了 play 的章）
    const items = lists[cur.sem] || [];
    const isDlc = (it) => !!it.play;
    const dlcs = items.filter(isDlc);
    // 同一分頁有好幾篇的 DLC（攻城戰分頁的中國篇、世界篇），每篇各一個小標題，編號才不會混在一起
    const multi = new Set(dlcs.map((x) => x.part)).size > 1;
    // 地理的主線「創世旅程」（像歷史的攻城戰役）排最上面，下面是大解密，原本的章節放最後
    const journeys = items.filter((x) => x.journey);
    const rest = items.filter((x) => !isDlc(x) && !x.journey);
    const ordered = journeys.length ? journeys.concat(dlcs, rest) : rest.concat(dlcs);
    let lastPart, lastJourney;
    // 公民：一篇裡有上下兩冊時，城市任務也照冊分開標（大解密用下面同一套 part）
    const jmulti = new Set(journeys.map((x) => x.part)).size > 1;
    for (const it of ordered) {
      if (it === journeys[0] || (jmulti && it.journey && it.part !== lastJourney))
        grid.append(h("div", { class: "chap-sep" }, subject === "公民" ? `🏙️ 城市任務${jmulti ? `・${it.part}` : ""}` : "🛸 防衛戰役"));
      if (it.journey) lastJourney = it.part;
      if (journeys.length && it === rest[0]) grid.append(h("div", { class: "chap-sep" }, "📘 課本章節"));
      if (isDlc(it) && (multi ? it.part !== lastPart : it === dlcs[0] && dlcs.length < items.length))
        grid.append(h("div", { class: "chap-sep" }, multi && it.part ? `🧩 ${subject}大解密・${it.part}` : `🧩 ${subject}大解密`));
      if (isDlc(it)) lastPart = it.part;
      const c = it.cid && G.CAT.chapters[it.cid];
      const ready = c && c.ready;
      const stars = ready ? G.chapterStars(it.cid) : 0, max = ready ? G.chapterMax(it.cid) : 0, mon = ready ? G.chapterMonsters(it.cid) : 0;
      // 付費解鎖：還沒買的戰役顯示鎖頭，點了打開購買視窗（雲端版的 cloud.js 提供 G.openPaywall）
      const paywalled = ready && c.locked && !(G.ME && G.ME.entitled);
      const card = h("button", { class: "chap-card2" + (ready ? "" : " todo") + (paywalled ? " paywalled" : ""), disabled: ready ? null : "disabled",
        onclick: () => ready && (paywalled ? G.openPaywall && G.openPaywall(it.cid) : G.openChapter(it.cid)) },
        h("span", { class: "cc-num" }, it.num || ""),
        h("span", { class: "cc-title" }, (it.title || "").replace(/\s*\|\s*/, "｜")),
        paywalled ? h("span", { class: "cc-stars" }, `🔒 ${G.CAT.store ? G.CAT.store.label : "付費解鎖"}`)
          : ready ? h("span", { class: "cc-stars" }, `★ ${stars} / ${max}`) : h("span", { class: "cc-stars" }, it.todo ? "這塊地還在開墾" : "題目製作中"),
        mon ? h("span", { class: "badge" }, `👾${mon}`) : null,
        medal(stars, max));
      grid.append(card);
      // 公民：親屬計算機放在國一上大解密的最後（家長要放在國一上的遊戲頁）
      if (it.cid === "c1_tribe") grid.append(h("button", { class: "chap-card2", style: "background:linear-gradient(180deg,#fff5f9,#ffd6e6);box-shadow:0 5px 0 #d886a8,0 10px 20px rgba(0,0,0,.35)", onclick: openKinship },
        h("span", { class: "cc-num" }, "小工具"),
        h("span", { class: "cc-title" }, "親屬計算機"),
        h("span", { class: "cc-stars" }, "在家族樹上走一次")));
    }
    el.append(hud(), head, tabs, grid);
  };

  // 開在遊戲頁裡，關掉（kinship.js 的「回遊戲」）就回到原來的分頁
  function openKinship() {
    const box = h("div", { style: "position:fixed;inset:0;z-index:400;background:#245d80" },
      h("iframe", { src: "kinship.html", title: "親屬計算機", style: "display:block;width:100%;height:100%;border:0" }));
    // 網站版小螢幕會把整頁縮小（share.js），計算機有自己的手機版面，不要跟著縮；直拿也能用，蓋過轉橫向提示
    const fit = () => { box.style.zoom = 1 / (parseFloat(document.documentElement.style.zoom) || 1); };
    window.addEventListener("resize", fit);
    G.closeKinship = () => { window.removeEventListener("resize", fit); box.remove(); };
    fit();
    document.body.append(box);
  }

  // 過關獎牌（家長訂的，滿分 15 顆星時）：1～5 顆星一個讚、6～10 銅牌、11～14 銀牌、滿分金牌；滿分不是 15 的章照比例換算
  function medal(stars, max) {
    if (!stars || !max) return null;
    const r = stars / max;
    const [icon, name] = r >= 1 ? ["🥇", "金牌"] : r >= 11 / 15 ? ["🥈", "銀牌"] : r >= 6 / 15 ? ["🥉", "銅牌"] : ["👍", "過關"];
    return h("span", { class: "cc-medal", title: `${name}（${stars} / ${max} 顆星）` }, icon);
  }

  G.openChapter = async (cid) => {
    try {
      G.CH = await G.loadChapter(cid);
    } catch (e) {
      G.toast("這一章還在製作中");
      return;
    }
    const c = G.CAT.chapters[cid];
    if (c) cur = { subject: c.subject, sem: c.grade };
    G.show("s-map");
    G.renderMap();
    const key = "intro_" + cid;
    if (!G.S.seen[key] && !(cid === "h1_3" && G.S.seen.intro)) {
      await G.dialog(G.CH.story.intro);
      G.S.seen[key] = 1;
      G.save();
    }
  };

  G.backToChapters = () => {
    if (G.current) { G.current.stop(); G.current = null; }
    G.openHub();
  };

  G.refreshScreen = () => {
    const id = (G.$(".screen.active") || {}).id;
    if (id === "s-map") G.renderMap();
    else if (id === "s-world") G.renderWorld();
    else if (id === "s-chapters") G.renderChapters();
    else if (id === "s-hub" && G.renderHub) G.renderHub();
  };
})();
