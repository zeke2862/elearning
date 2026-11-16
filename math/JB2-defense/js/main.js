/* 時空守護者 — 啟動、進關、按鈕 */
(function () {
  const G = window.G;

  G.setHearts = (cur, max) => {
    const el = G.$("#play-hearts");
    el.innerHTML = "";
    for (let i = 0; i < max; i++) el.append(G.h("span", { class: i < cur ? "" : "lost" }, "❤️"));
  };
  G.setShield = (n) => { G.$("#play-shield").textContent = n ? "🛡️" : ""; };

  G.backToMap = () => {
    if (G.current) { G.current.stop(); G.current = null; }
    G.show("s-map");
    G.renderMap();
  };

  function itemsFor(node) {
    const id = node.id;
    switch (node.type) {
      case "shoot": return G.shuffle(G.CH.quick[node.set].map((q, k) => ({ key: `${id}|q|${k}`, q }))).slice(0, 8);
      case "boss": return G.shuffle(G.CH.boss.questions.map((q) => ({ key: `${id}|b|${q.id}`, q }))).slice(0, 7);
      case "match": return G.CH.pairs.map((p, k) => ({ ...p, key: `${id}|p|${k}` }));
      case "sort": return G.CH.sort.cards.map((c, k) => ({ ...c, key: `${id}|s|${k}` }));
      case "timeline": return G.CH.timeline.events.map((e, k) => ({ ...e, key: `${id}|t|${k}` }));
      case "sequence": return G.CH.timeline.events.map((e, k) => ({ ...e, key: `${id}|t|${k}` }));
    }
    return [];
  }

  // 本章專屬 Boss 圖（AI 生的）還沒放進來時，先用舊的選擇題九頭蛇
  const bossImage = async () => (await G.preload(`assets/${G.CH.boss.img}.webp`)) || (await G.preload("assets/boss_h1_3.webp"));

  G.startNode = async (i, monster, mode) => {
    mode = mode || "easy";
    const node = G.CH.nodes[i];
    if (!(G.NODE_TYPES && G.NODE_TYPES[node.type])) await G.loadSprites();
    if (!monster && !G.S.seen[node.id]) {
      await G.dialog(node.intro);
      G.S.seen[node.id] = 1;
      G.save();
    }
    let hearts = ((window.GAME_CONFIG || {}).hearts || 5) + G.buff("heart");
    const guideBonus = !monster && G.guideBuffReady();
    if (guideBonus) { hearts += 1; G.useGuideBuff(); }
    G.show("s-play");
    G.$("#play-title").textContent = (monster ? "👾 討伐怪物：" : `${node.icon} `) + node.title;
    if (guideBonus) setTimeout(() => G.toast("📖 攻略加持：多 1 條命！"), 300);
    if (G.buff("heart")) setTimeout(() => G.toast("🏹 大肚王卡：多 1 條命！"), 900);

    const onEnd = async (r) => {
      G.current = null;
      r.monster = monster;
      for (const res of r.results) {
        if (monster || G.S.wrong[res.key]) G.wrongResult(res.key, res.ok);
      }
      if (!monster) for (const w of r.wrongs) G.wrongAdd(w.key, node.id, w.q);
      const award = G.finishStage(node, r);
      if (node.type === "boss" && r.cleared && !monster && !G.S.seen.outro) {
        G.S.seen.outro = 1;
        G.save();
        await G.dialog(G.CH.story.outro);
      }
      G.showResult(node, r, award, () => G.startNode(i, monster, mode));
    };

    const common = { node, hearts, monster, onEnd, mode };
    // 網站自己加的關卡類型（英文網站的聽力挑戰 js/listen.js）：一般挑戰和討伐怪物都自己處理
    const custom = G.NODE_TYPES && G.NODE_TYPES[node.type];
    if (custom) { G.current = custom(common); return; }
    if (monster) {
      const items = G.monstersDue(node.id).map((d) => ({ key: d.key, q: d.q }));
      if (!items.length) { G.toast("這裡的怪物都打倒了！"); return G.backToMap(); }
      const asBoss = node.type === "boss";
      if (asBoss) common.bossImg = await bossImage();
      G.current = G.Shooter({ ...common, mode: asBoss ? "boss" : "quiz", items: G.shuffle(items), speed: 1, time: 16, bossName: "怪物王" });
      return;
    }
    const items = itemsFor(node);
    if (node.type === "shoot") G.current = G.Shooter({ ...common, mode: "quiz", items, speed: node.speed, time: node.time });
    else if (node.type === "boss" && node.mode === "debate") G.current = G.Scenes.debate({ ...common, data: G.CH.debate });
    else if (node.type === "boss") {
      common.bossImg = await bossImage();
      G.current = G.Shooter({ ...common, mode: "boss", items, speed: node.speed, bossName: G.CH.boss.name });
    } else if (node.type === "match") G.current = G.Puzzles.match({ ...common, items });
    else if (node.type === "sort") G.current = G.Puzzles.sort({ ...common, items, bins: G.CH.sort.bins });
    else if (node.type === "siege" || node.type === "voyage") G.current = G.Siege({ ...common, battle: G.CH.battles[node.battle] });
    // 新玩法（國一上第 3 章試玩）
    else if (node.type === "council") G.current = G.Scenes.council({ ...common, session: G.CH.council[node.session] });
    else if (node.type === "museum") G.current = G.Scenes.museum({ ...common, data: G.CH.museum });
    else if (node.type === "detective") G.current = G.Scenes.detective({ ...common, data: G.CH.detective });
    else if (node.type === "timeline" || node.type === "sequence") G.current = G.Puzzles.timeline({ ...common, items, eras: G.CH.timeline.eras || [], hint: G.CH.timeline.hint });
  };

  /* ---------- 按鈕 ---------- */
  G.$("#btn-start").addEventListener("click", async () => {
    G.sfx("click");
    // 分享版只有一個國度：直接進章節列表
    if (G.CAT.single) {
      G.openHub();
      if (!G.S.seen.world) {
        await G.dialog(G.CAT.intro);
        G.S.seen.world = 1;
        G.save();
      }
      return;
    }
    G.show("s-world");
    G.renderWorld();
    if (!G.S.seen.world) {
      await G.dialog([
        "時空守護者，整個國一的時空都裂開了！",
        "國文、英文、數學、生物、歷史、地理、公民，七個國度都有怪物在搗亂。",
        "先挑一個國度，一章一章把時空修好吧！",
      ]);
      G.S.seen.world = 1;
      G.save();
    }
  });
  G.$("#btn-title-parent").addEventListener("click", () => {
    if (G.CAT.single) G.openHub();
    else { G.show("s-world"); G.renderWorld(); }
    G.openParent();
  });
  G.$("#btn-back-chapters").addEventListener("click", () => { G.sfx("click"); G.backToChapters(); });
  G.$("#btn-map-parent").addEventListener("click", () => G.openParent());
  G.$("#btn-guide").addEventListener("click", () => G.openGuide());
  G.$("#btn-gacha").addEventListener("click", () => G.openGacha());
  G.$("#btn-cards").addEventListener("click", () => G.openCards());
  G.$("#btn-shop").addEventListener("click", () => G.openShop());
  G.$("#btn-sound").addEventListener("click", () => {
    G.S.settings.sound = !G.S.settings.sound;
    G.save();
    G.refreshSide();
    G.sfx("click");
  });
  G.$("#btn-full").addEventListener("click", () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  });
  G.$("#btn-quit").addEventListener("click", async () => {
    const cur = G.current;
    const ok = await G.confirm("要離開這一關嗎？這次的進度不會保存。", "離開");
    if (ok && cur) { cur.stop(); G.current = null; G.backToMap(); }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && G.$("#ov").classList.contains("on") && G.$("#ov-box .x")) G.closeOverlay();
  });

  // 預先載入常用圖片
  ["assets/cat.webp"].forEach((s) => G.preload(s));
})();
