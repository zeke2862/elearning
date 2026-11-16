/* 時空守護者 — 結算、抽卡、卡冊、獎勵商店、家長專區、攻略本 */
(function () {
  const G = window.G, h = G.h;
  const RAR = { N: { w: 50, dup: 20, stars: "★" }, R: { w: 30, dup: 40, stars: "★★" }, SR: { w: 15, dup: 80, stars: "★★★" }, SSR: { w: 5, dup: 150, stars: "★★★★" } };
  const TICKET_PRICE = 300; // 金幣換抽卡券：孩子自己決定存錢換獎勵還是抽卡
  const SET_BONUS = 3; // 集滿一章卡片送的券
  const TAB_COINS = 3000; // 集滿一整篇的卡片送的金幣，另外送稱號（家長 2026-11-02）

  /* ---------- 集滿獎勵 ---------- */
  // 慶祝畫面：蓋在最上面（抽卡視窗、卡冊留在下面），點一下關掉
  G.celebrate = ({ icon, title, lines }) => new Promise((res) => {
    G.sfx("win");
    const colors = ["#ffd56b", "#ff7b9c", "#7cc0ff", "#9be38a", "#d79bff"];
    const el = h("div", { class: "celebrate", onclick: () => { el.remove(); res(); } },
      h("div", { class: "cel-rays" }),
      Array.from({ length: 28 }, (_, i) => h("i", { class: "cel-bit", style: `left:${(i * 37) % 100}%;background:${colors[i % 5]};animation-delay:${(i % 7) * 0.18}s;animation-duration:${2.2 + (i % 4) * 0.35}s` })),
      h("div", { class: "cel-box" }, h("div", { class: "cel-ic" }, icon), h("h2", {}, title), lines.map((t) => h("p", {}, t)), h("div", { class: "cel-tap" }, "點一下繼續")));
    document.body.append(el);
  });
  // 一科（玩家選的版本）的每一篇（章節列表的分頁）有哪些做好的章
  function subjectTabs(sub) {
    const vers = G.CAT.subjects[sub].versions;
    const v = vers[G.versionOf(sub)] || vers._ || Object.values(vers)[0];
    return Object.entries(v).map(([tab, items]) => ({ tab, cids: items.map((it) => it.cid).filter((cid) => cid && G.CAT.chapters[cid] && G.CAT.chapters[cid].ready) }));
  }
  // 章節資料（卡片清單）：付費章還沒買拿不到，回 null
  const loadCards = (cid) => (G.CAT.chapters[cid].locked && !(G.ME && G.ME.entitled) ? Promise.resolve(null) : G.loadChapter(cid).catch(() => null));
  // 這一篇的卡片收集到幾張；有拿不到的章（還沒買）就是 locked。只有一章有卡片的篇（例如英文）不算一整篇
  async function tabProgress(sub, tab, cids) {
    const ds = (await Promise.all(cids.map(loadCards))).filter(Boolean);
    const locked = ds.length < cids.length;
    const cards = ds.filter((d) => d.cards.length).flatMap((d) => d.cards);
    const chapters = ds.filter((d) => d.cards.length).length;
    return { tab, key: `${sub}|${tab}`, name: `${tab.replace(/^[^\p{L}\p{N}]+/u, "")}${sub}大師`, locked, counts: chapters >= 2,
      total: cards.length, got: cards.filter((c) => G.S.cards[c.id]).length };
  }
  // 集滿一整篇：送稱號和金幣，每一篇只送一次；only 給章節代號時，只看那一章所在的篇
  async function checkTabs(sub, only) {
    const won = [];
    for (const { tab, cids } of subjectTabs(sub)) {
      if (G.S.titles[`${sub}|${tab}`] || (only && !cids.includes(only))) continue;
      const p = await tabProgress(sub, tab, cids);
      if (p.locked || !p.counts || p.got < p.total) continue;
      G.S.titles[p.key] = { name: p.name, at: Date.now() };
      G.S.coins += TAB_COINS;
      won.push(p);
    }
    if (!won.length) return;
    G.save();
    for (const p of won) await G.celebrate({ icon: "🏅", title: `獲得稱號「${p.name}」`, lines: [`${p.tab}的 ${p.total} 張卡片全部收集完成！`, `獎勵 🪙 ${TAB_COINS} 金幣`] });
  }

  /* ---------- 結算 ---------- */
  // 看結果：結算視窗暫時藏起來，右下角留一個按鈕回到結算
  function peekResult() {
    const ov = G.$("#ov");
    ov.classList.add("peek");
    const back = h("button", { class: "btn big peek-back", onclick: () => { ov.classList.remove("peek"); back.remove(); } }, "📋 回到結算");
    G.$("#play-stage").append(back);
  }

  G.showResult = (node, r, award, again) => {
    const monster = r.monster;
    const bossName = (G.CH.boss && G.CH.boss.name) || "數靈王";
    let title = monster ? "怪物討伐完成！" : r.cleared ? (node.type === "boss" ? `打倒${bossName}！` : "過關！") : r.bossEscaped ? `${bossName}逃走了…` : r.timeout ? "時間到！" : "挑戰失敗…";
    if (!monster && r.mode === "endless") title = "♾️ 無極限結束";
    if (!monster && r.mode === "easy") title = r.cleared ? "學習完成！" : "再加油！";
    G.sfx(r.cleared ? "win" : "bad");
    G.overlay((box) => {
      box.classList.add("result");
      const starEls = [0, 1, 2, 3, 4].map(() => h("span", {}, "★"));
      const coinEl = h("span", {}, "+0");
      box.append(h("h2", { class: "big-title " + (r.cleared ? "win" : "lose") }, title));
      if (!monster) box.append(h("div", { class: "rstars" }, starEls));
      box.append(
        h("div", { class: "stats" },
          h("div", { class: "stat" }, h("b", {}, `${r.correct} / ${r.total}`), "答對"),
          h("div", { class: "stat" }, h("b", {}, r.maxCombo), "最高連擊"),
          h("div", { class: "stat" }, h("b", {}, r.score || 0), "分數")),
        h("div", { class: "loot" },
          h("span", { class: "pill" }, h("span", { class: "ic" }, "🪙"), coinEl),
          award.tickets ? h("span", { class: "pill" }, h("span", { class: "ic" }, "🎟️"), `+${award.tickets} 抽卡券`) : null)
      );
      const msgs = [];
      if (!monster && r.mode) msgs.push(G.modeSummary(r));
      if (award.first) {
        const i = G.CH.nodes.indexOf(node);
        if (G.CH.nodes[i + 1]) msgs.push(`🔓 解鎖新關卡「${G.CH.nodes[i + 1].title}」！`);
      }
      if (award.streakBonus) msgs.push(`🔥 連續 ${G.S.streak.count} 天！多送 1 張抽卡券`);
      if (!monster && r.cleared && award.replay < 1) msgs.push(`↻ 今天重玩這關，金幣只有 ${Math.round(award.replay * 100)}%。去挑戰新關卡或打怪物賺更多！`);
      if (monster) {
        const ok = r.results.filter((x) => x.ok).length;
        msgs.push(`👾 打倒 ${ok} 隻怪物${r.results.length - ok ? `，${r.results.length - ok} 隻跑回關卡裡了` : ""}。打倒的怪物過幾天還會再出現一次，再打一次就記牢了！`);
      }
      msgs.forEach((m) => box.append(h("div", { class: "center", style: "font-weight:900;font-size:19px;margin-top:6px" }, m)));
      if (r.wrongs.length && !monster) {
        const det = h("details", { class: "wrong-list" }, h("summary", {}, `👾 ${r.wrongs.length} 題答錯，變成怪物佔領了「${node.title}」（點開看正確答案）`));
        r.wrongs.forEach((w) => {
          const q = w.q;
          det.append(h("div", { class: "wrong-item" },
            h("div", { style: "font-weight:900" }, q.img ? `會考 ${q.y} 年第 ${q.n} 題` : q.q),
            // 會考題的文字選項有辨識雜訊，只顯示答案字母（題目圖裡看得到選項）
            h("div", { class: "ans" }, q.img ? `✔ 答案是 ${"ABCD"[q.a]}` : `✔ ${q.o[q.a]}`),
            q.ex ? h("div", { class: "muted" }, q.ex) : null));
        });
        box.append(det);
      }
      box.append(!monster && r.mode ? G.resultChoice(node, r, again) : h("div", { class: "row", style: "justify-content:center;margin-top:18px" },
        h("button", { class: "btn ghost", style: "color:var(--ink);box-shadow:inset 0 0 0 2px #b9821f", onclick: () => { G.closeOverlay(); again(); } }, monster ? "再打一次" : "↻ 再挑戰"),
        h("button", { class: "btn", onclick: () => { G.closeOverlay(); G.backToMap(); } }, "🗺️ 回地圖"),
        G.S.tickets > 0 ? h("button", { class: "btn red", onclick: () => { G.closeOverlay(); G.backToMap(); G.openGacha(); } }, `🎴 去抽卡（${G.S.tickets}）`) : null
      ));
      // DLC 的比較表、博物館館藏、地圖任務的航線：結算先收起來，讓玩家看看自己完成的成果
      if (!monster && r.cleared && ["council", "museum", "voyage"].includes(node.type)) {
        box.append(h("div", { class: "row", style: "justify-content:center;margin-top:10px" },
          h("button", { class: "btn green", onclick: () => peekResult() }, "👀 看結果")));
      }
      // 動畫：星星一顆顆亮、金幣跳動
      starEls.forEach((s, i) => setTimeout(() => { if (i < r.stars) { s.classList.add("on"); G.sfx("star"); } }, 400 + i * 350));
      let c = 0;
      const step = Math.max(1, Math.round(award.coins / 25));
      const iv = setInterval(() => {
        c = Math.min(award.coins, c + step);
        coinEl.textContent = `+${c}`;
        if (c >= award.coins) { clearInterval(iv); if (award.coins) G.sfx("coin"); }
      }, 40);
    }, { close: false });
  };

  /* ---------- 抽卡 ---------- */
  function cardFace(c, isNew) {
    const bf = c.buff ? h("div", { class: "bf" }, `✨ ${c.buff.text}`) : h("div", { class: "bf", style: "opacity:.6" }, "點卡片看背面");
    // 有卡圖：插畫滿版，名字壓在下方；沒有卡圖的照舊用 emoji
    const front = c.art
      ? h("div", { class: `face cface art rar-${c.rarity}` },
        h("img", { class: "pic", src: c.art, alt: c.name, draggable: "false" }),
        h("span", { class: "r" }, `${c.rarity} ${RAR[c.rarity].stars}`),
        h("div", { class: "plate" }, h("div", { class: "nm" }, c.name), h("div", { class: "tt" }, c.title), bf))
      : h("div", { class: `face cface rar-${c.rarity}` },
        h("span", { class: "r" }, `${c.rarity} ${RAR[c.rarity].stars}`),
        h("div", { class: "ic" }, c.icon),
        h("div", { class: "nm" }, c.name),
        h("div", { class: "tt" }, c.title),
        bf);
    // 背面淡淡印著插畫（直接寫在 style：放進 CSS 變數的相對網址會被當成相對於 css/ 資料夾）
    const back = h("div", { class: "face back cback" + (c.art ? " art" : ""),
      style: c.art ? `background-image:linear-gradient(180deg,rgba(255,250,240,.82),rgba(240,220,174,.9)),url("${c.art}")` : null },
      h("h4", {}, `${c.icon} ${c.name}`),
      h("ul", {}, c.facts.map((f) => h("li", {}, f))),
      c.buff ? h("p", { style: "font-weight:900;color:#7a4b12;margin:10px 0 0" }, `✨ 收藏效果：${c.buff.text}`) : null);
    const card = h("div", { class: "card3d" }, h("div", { class: "inner" }, front, back));
    if (isNew) card.append(h("span", { class: "newtag" }, "NEW!"));
    card.addEventListener("click", () => { card.classList.toggle("flipped"); G.sfx("click"); });
    return card;
  }
  G.cardFace = cardFace;

  // 抽卡降低重複（不是完全不重複）：稀有度照原本機率；同一個稀有度裡，還沒收集到的卡機率是已收集的 3 倍；
  // 抽到重複的卡會自動重抽一次，重抽的結果就算數。8 張卡的章節平均約 13 抽集滿（原本約 25 抽）。
  const FRESH_WEIGHT = 3;
  function wpick(items, weight) {
    let x = Math.random() * items.reduce((s, it) => s + weight(it), 0);
    for (const it of items) { x -= weight(it); if (x < 0) return it; }
    return items[items.length - 1];
  }
  function rollOnce() {
    const S = G.S, cards = G.CH.cards;
    const rars = ["SSR", "SR", "R", "N"].filter((k) => cards.some((c) => c.rarity === k));
    const rar = S.pity >= 9 && rars.includes("SSR") ? "SSR" : wpick(rars, (k) => RAR[k].w);
    return wpick(cards.filter((c) => c.rarity === rar), (c) => (S.cards[c.id] ? 1 : FRESH_WEIGHT));
  }
  function roll() {
    let c = rollOnce();
    if (G.S.cards[c.id]) c = rollOnce();
    G.S.pity = c.rarity === "SSR" ? 0 : G.S.pity + 1;
    return c;
  }

  G.openGacha = () => {
    G.overlay((box) => {
      box.classList.add("gacha");
      const tk = h("b", {}, G.S.tickets);
      const stage = h("div", { class: "orb-stage" }, h("div", { class: "beam" }), h("div", { class: "orb" }, "🎴"));
      const info = h("div", { class: "muted", style: "font-weight:700" }, `機率：SSR 5%・SR 15%・R 30%・N 50%　|　沒收集到的卡比較容易出現　|　再抽 ${Math.max(0, 10 - G.S.pity)} 次內保證出 SSR`);
      const btn = h("button", { class: "btn big", onclick: go }, "✨ 抽 1 次（1 張券）");
      const coinTxt = h("b", {}, G.S.coins);
      const buy = h("button", { class: "btn ghost", style: "color:var(--ink);box-shadow:inset 0 0 0 2px #b9821f", onclick: buyTicket }, `🪙 ${TICKET_PRICE} 換 1 張券`);
      box.append(h("h2", {}, "🎴 數靈召喚"),
        h("div", { style: "font-weight:900;font-size:20px" }, "抽卡券：", tk, " 張　🪙 ", coinTxt),
        stage, h("div", { class: "row", style: "justify-content:center" }, btn, buy), h("div", { style: "margin-top:10px" }, info));
      let busy = false;
      async function buyTicket() {
        if (G.S.coins < TICKET_PRICE) { G.toast(`金幣不夠，要 🪙${TICKET_PRICE}`); return; }
        if (!(await G.confirm(`用 🪙${TICKET_PRICE} 換 1 張抽卡券？（金幣也可以存起來換現實獎勵喔）`, "換"))) return G.openGacha();
        G.S.coins -= TICKET_PRICE;
        G.S.tickets += 1;
        G.save();
        G.sfx("coin");
        G.openGacha();
      }
      function go() {
        if (busy) return;
        if (G.S.tickets < 1) { G.toast(`抽卡券不夠！第一次過關、連續 3 天登入會送券，也可以用 🪙${TICKET_PRICE} 換`); return; }
        busy = true;
        G.S.tickets -= 1;
        tk.textContent = G.S.tickets;
        const c = roll();
        if (c.art) new Image().src = c.art;  // 召喚動畫的 1.3 秒裡先把卡圖載好
        const isNew = !G.S.cards[c.id];
        G.S.cards[c.id] = (G.S.cards[c.id] || 0) + 1;
        let dupCoins = 0;
        if (!isNew) { dupCoins = RAR[c.rarity].dup; G.S.coins += dupCoins; }
        const all = G.CH.cards.every((x) => G.S.cards[x.id]);
        let setBonus = false;
        if (all && !G.S.collectDone[G.CH.id]) { G.S.collectDone[G.CH.id] = true; G.S.tickets += SET_BONUS; setBonus = true; }
        G.save();
        const orb = G.$(".orb", stage), beam = G.$(".beam", stage);
        orb.style.display = "";
        orb.classList.add("shake");
        G.sfx("power");
        const color = { N: "#d5dde5", R: "#7cc0ff", SR: "#d79bff", SSR: "#ffd56b" }[c.rarity];
        setTimeout(() => {
          orb.classList.remove("shake");
          orb.style.display = "none";
          beam.style.setProperty("--bc", color);
          beam.classList.remove("on"); void beam.offsetWidth; beam.classList.add("on");
          G.sfx("reveal");
          if (c.rarity === "SSR" || c.rarity === "SR") G.sfx("win");
          const face = cardFace(c, isNew);
          face.style.animation = "pop .5s cubic-bezier(.2,1.5,.4,1)";
          G.$$(".card3d", stage).forEach((x) => x.remove());
          stage.append(face);
          info.textContent = isNew ? `獲得新卡「${c.name}」！點卡片可以看背面的重點。` : `重複的「${c.name}」→ 換成 🪙 ${dupCoins} 金幣`;
          coinTxt.textContent = G.S.coins;
          btn.textContent = G.S.tickets ? "✨ 再抽 1 次" : "沒有券了";
          G.refreshSide && G.refreshSide();
          if (!setBonus) { busy = false; return; }
          // 先讓孩子看一下抽到的卡，再跳集滿的慶祝畫面
          setTimeout(async () => {
            await G.celebrate({ icon: "🏆", title: "全收集！", lines: [`「${G.CH.title}」的 ${G.CH.cards.length} 張卡片全部到手！`, `送你 ${SET_BONUS} 張抽卡券`] });
            await checkTabs(G.CH.subject, G.CH.id);
            tk.textContent = G.S.tickets;
            coinTxt.textContent = G.S.coins;
            btn.textContent = G.S.tickets ? "✨ 再抽 1 次" : "沒有券了";
            busy = false;
          }, 900);
        }, 1300);
      }
    }, { onClose: () => G.refreshScreen() });
  };

  /* ---------- 卡冊 ---------- */
  // 卡冊：這一關的卡片在最上面，往下滑看同一科其他關卡收集到的卡（關卡資料要用到才載入）
  function albumChapters() {
    const sub = G.CH.subject, vers = G.CAT.subjects[sub].versions;
    const v = vers[G.versionOf(sub)] || vers._ || Object.values(vers)[0];
    const list = [], seen = new Set([G.CH.id]);
    Object.values(v).forEach((items) => items.forEach((it) => {
      if (!seen.has(it.cid) && G.CAT.chapters[it.cid] && G.CAT.chapters[it.cid].ready) { seen.add(it.cid); list.push(it); }
    }));
    const here = G.CAT.chapters[G.CH.id];
    return [{ cid: G.CH.id, num: here.num, title: G.CH.title }].concat(list);
  }
  function miniCard(c) {
    const n = G.S.cards[c.id];
    // 有卡圖：沒收集到的卡顯示看不清楚的暗影，看得出稀有度、看不出是誰
    const m = c.art
      ? h("div", { class: `mini art rar-${c.rarity}${n ? "" : " unknown"}` },
        h("img", { class: "pic", src: c.art, alt: "", loading: "lazy", draggable: "false" }),
        h("span", { class: "r" }, c.rarity),
        n ? h("span", { class: "cnt" }, `×${n}`) : null,
        h("div", { class: "nm" }, n ? c.name : "？？？"))
      : n
        ? h("div", { class: `mini rar-${c.rarity}` }, h("div", { class: "ic" }, c.icon), h("div", { class: "nm" }, c.name), h("div", { style: "font-size:13px;font-weight:900" }, c.rarity), h("span", { class: "cnt" }, `×${n}`))
        : h("div", { class: "mini unknown" }, h("div", { class: "ic" }, c.icon), h("div", { class: "nm" }, "？？？"), h("div", { style: "font-size:13px;font-weight:900" }, c.rarity));
    if (n) m.addEventListener("click", () => {
      G._albumScroll = G.$("#ov-box").scrollTop;
      G.overlay((b2) => {
        b2.append(h("div", { class: "center" }, cardFace(c, false)), h("p", { class: "center muted", style: "font-weight:700" }, "點卡片翻面"),
          h("div", { class: "center" }, h("button", { class: "btn", onclick: () => G.openCards() }, "← 回卡冊")));
      });
    });
    return m;
  }
  G.openCards = () => {
    const order = { SSR: 0, SR: 1, R: 2, N: 3 };
    G.overlay((box) => {
      const head = h("h2", {}, "🗂️ 卡冊");
      const body = h("div", {}, h("p", { class: "muted", style: "font-weight:700" }, "卡冊載入中…"));
      box.append(head,
        h("div", { class: "muted", style: "font-weight:700" }, `往下滑，看看每一關收集到的卡片。集滿一關送 ${SET_BONUS} 張抽卡券；集滿一整篇送稱號和 🪙${TAB_COINS}！卡片背面就是重點！`),
        body);
      const chs = albumChapters();
      Promise.all(chs.map((it) => {
        const meta = G.CAT.chapters[it.cid];
        if (meta.locked && !(G.ME && G.ME.entitled)) return null;
        return G.loadChapter(it.cid).catch(() => null);
      })).then(async (datas) => {
        // 以前就集滿、但還沒拿到獎勵的（例如兩台裝置的卡片合併後才集滿）：補發
        const sub = G.CH.subject;
        datas.forEach((d, i) => {
          if (d && d.cards.length && !G.S.collectDone[chs[i].cid] && d.cards.every((c) => G.S.cards[c.id])) {
            G.S.collectDone[chs[i].cid] = true;
            G.S.tickets += SET_BONUS;
            G.toast(`🏆「${chs[i].title}」集滿了，補送 ${SET_BONUS} 張抽卡券`);
          }
        });
        G.save();
        await checkTabs(sub);
        const tabs = (await Promise.all(subjectTabs(sub).map(({ tab, cids }) => tabProgress(sub, tab, cids)))).filter((p) => p.counts || p.locked);
        body.innerHTML = "";
        if (tabs.length) body.append(h("div", { class: "tab-prog" }, h("b", {}, "集滿一整篇："),
          tabs.map((p) => G.S.titles[p.key] ? h("span", { class: "tp done" }, `🏅 ${G.S.titles[p.key].name}`)
            : h("span", { class: "tp" }, p.locked ? `${p.tab} 🔒 解鎖後才能集滿` : `${p.tab} ${p.got} / ${p.total}`))));
        const uniq = new Map();
        datas.forEach((d) => d && d.cards.forEach((c) => uniq.set(c.id, c)));
        const owned = [...uniq.values()].filter((c) => G.S.cards[c.id]);
        head.textContent = `🗂️ 卡冊　${owned.length} / ${uniq.size}`;
        const buffs = owned.filter((c) => c.buff);
        if (buffs.length) body.append(h("div", { class: "buffbar", style: "margin-top:10px" }, "✨ 目前生效：", buffs.map((c) => `${c.icon}${c.buff.text}`).join("、")));
        chs.forEach((it, i) => {
          const d = datas[i];
          const got = d ? d.cards.filter((c) => G.S.cards[c.id]).length : 0;
          const full = d && d.cards.length && got === d.cards.length;
          body.append(h("div", { class: "coll-head" + (i === 0 ? " here" : "") + (full ? " full" : "") },
            h("b", {}, it.num), h("span", { class: "t" }, i === 0 ? `${it.title}（這一關）` : it.title),
            full ? h("span", { class: "full-tag" }, "🏆 全收集") : null,
            h("span", { class: "n" }, d ? `${got} / ${d.cards.length}` : "🔒 解鎖後才能收集")));
          if (d) {
            const grid = h("div", { class: "coll-grid" });
            d.cards.slice().sort((a, b) => order[a.rarity] - order[b.rarity]).forEach((c) => grid.append(miniCard(c)));
            body.append(grid);
          }
        });
        if (G._albumScroll) { box.scrollTop = G._albumScroll; G._albumScroll = 0; }
      });
    }, { wide: true, onClose: () => G.refreshScreen() });
  };

  /* ---------- 獎勵商店 ---------- */
  G.openShop = () => {
    G.overlay((box) => {
      const R = G.S.rewards;
      box.append(h("h2", {}, "🎁 獎勵商店"), h("div", { style: "font-size:22px;font-weight:900" }, `你有 🪙 ${G.S.coins} 金幣`),
        h("div", { class: "muted", style: "font-weight:700" }, "兌換後要拿給爸媽確認，確認了才算數喔！"));
      R.items.forEach((it) => {
        const can = G.S.coins >= it.cost;
        box.append(h("div", { class: "shop-item" },
          h("span", { style: "font-size:34px" }, "🎁"),
          h("span", { class: "nm" }, it.name),
          h("span", { class: "cost" }, `🪙 ${it.cost}`),
          h("button", { class: "btn" + (can ? "" : ""), disabled: can ? null : "disabled", onclick: () => redeem(it) }, can ? "兌換" : `差 ${it.cost - G.S.coins}`)));
      });
      const mine = R.log.slice(-6).reverse();
      if (mine.length) {
        box.append(h("h3", { style: "margin:18px 0 4px" }, "我的兌換紀錄"));
        mine.forEach((l) => box.append(h("div", { style: "font-weight:700;padding:4px 0" }, `${l.date}　${l.name}　`, h("span", { class: "st " + l.status }, { pending: "等爸媽確認", ok: "已確認", no: "沒通過（金幣已退回）" }[l.status]))));
      }
    }, { onClose: () => G.refreshScreen() });
    async function redeem(it) {
      const ok = await G.confirm(`用 🪙${it.cost} 兌換「${it.name}」？`, "兌換");
      if (!ok) return G.openShop();
      G.S.coins -= it.cost;
      const log = { id: Date.now(), name: it.name, cost: it.cost, date: G.today(), status: "pending" };
      G.S.rewards.log.push(log);
      G.save();
      G.sfx("win");
      G.overlay((box) => {
        box.append(h("h2", { class: "center" }, "🎉 兌換成功！"),
          h("div", { class: "voucher" }, "🎟️ 兌換券", h("div", { style: "font-size:30px;margin:8px 0" }, it.name), h("div", { class: "muted" }, `${log.date}・🪙${it.cost}`), h("div", { style: "margin-top:8px;color:#b23a3a" }, "請拿給爸媽在「家長」裡確認")),
          h("div", { class: "center", style: "margin-top:16px" }, h("button", { class: "btn", onclick: () => G.openShop() }, "好的")));
      }, { onClose: () => G.refreshScreen() });
    }
  };

  /* ---------- 家長專區（密碼） ---------- */
  G.openParent = () => {
    let code = "";
    G.overlay((box) => {
      const R = G.S.rewards;
      const dots = h("div", { class: "pindots" }, "○○○○");
      box.append(h("h2", { class: "center" }, "👪 家長專區"),
        h("p", { class: "center muted", style: "font-weight:700" }, R.pinSet ? "請輸入 4 位數密碼" : "第一次使用：預設密碼是 0000，進去後請改掉"), dots);
      const pad = h("div", { class: "pinpad" });
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((k) => pad.append(h("button", { onclick: () => {
        G.sfx("click");
        if (k === "⌫") code = code.slice(0, -1);
        else if (k === "✓") return check();
        else if (code.length < 4) code += k;
        dots.textContent = "●".repeat(code.length) + "○".repeat(4 - code.length);
        if (code.length === 4) check();
      } }, k)));
      box.append(pad);
      function check() {
        if (code === R.pin) parentHome("redeem");
        else { G.sfx("bad"); code = ""; dots.textContent = "○○○○"; G.toast("密碼不對"); }
      }
    }, { onClose: () => G.refreshScreen() });
  };

  function parentHome(tab) {
    G.overlay((box) => {
      const R = G.S.rewards, S = G.S;
      const tabs = { redeem: "兌換確認", rewards: "獎勵設定", learn: "學習紀錄", settings: "設定" };
      box.append(h("h2", {}, "👪 家長專區"),
        h("div", { class: "tabs" }, Object.entries(tabs).map(([k, v]) => h("button", { class: k === tab ? "on" : "", onclick: () => parentHome(k) }, v + (k === "redeem" && R.log.some((l) => l.status === "pending") ? " 🔴" : "")))));
      if (!R.pinSet) box.append(h("div", { class: "buffbar", style: "background:#ffe1dc;margin-bottom:10px" }, "⚠️ 還在用預設密碼 0000，請到「設定」改掉，免得孩子自己確認兌換。"));
      if (tab === "redeem") {
        const pend = R.log.filter((l) => l.status === "pending");
        if (!pend.length) box.append(h("p", { class: "muted", style: "font-weight:700" }, "目前沒有等待確認的兌換。"));
        pend.forEach((l) => box.append(h("div", { class: "shop-item" },
          h("span", { class: "nm" }, `${l.name}`, h("div", { class: "muted", style: "font-size:14px" }, `${l.date}・🪙${l.cost}`)),
          h("button", { class: "btn green", onclick: () => { l.status = "ok"; G.save(); G.sfx("good"); parentHome("redeem"); } }, "✔ 確認"),
          h("button", { class: "btn red", onclick: () => { l.status = "no"; S.coins += l.cost; G.save(); parentHome("redeem"); } }, "✖ 退回"))));
        const done = R.log.filter((l) => l.status !== "pending").slice(-10).reverse();
        if (done.length) {
          box.append(h("h3", {}, "最近紀錄"));
          const t = h("table", { class: "tbl" });
          done.forEach((l) => t.append(h("tr", {}, h("td", {}, l.date), h("td", {}, l.name), h("td", {}, `🪙${l.cost}`), h("td", {}, h("span", { class: "st " + l.status }, l.status === "ok" ? "已確認" : "已退回")))));
          box.append(t);
        }
      }
      if (tab === "rewards") {
        const rate = S.settings.coinRate || 1;
        box.append(
          h("h3", { style: "margin:0 0 6px" }, "金幣難度"),
          h("div", { class: "row" }, Object.entries(G.COIN_RATES).sort((a, b) => b[0] - a[0]).map(([v, label]) =>
            h("button", { class: "btn" + (Number(v) === rate ? "" : " ghost"), style: Number(v) === rate ? "" : "color:var(--ink);box-shadow:inset 0 0 0 2px #b9821f",
              onclick: () => { S.settings.coinRate = Number(v); G.save(); parentHome("rewards"); } }, `${label} ×${v}`))),
          h("p", { class: "muted", style: "font-weight:700;line-height:1.6" },
            `目前（${G.COIN_RATES[rate]}）：整張地圖 7 關玩一輪大約 ${Math.round(1200 * rate)}～${Math.round(1600 * rate)} 金幣，玩兩輪大約 ${Math.round(3000 * rate)}（第一輪有首次過關獎勵，會多一些）。`,
            h("br"), `同一關一天內前 2 次全額，之後只給 30%、10%；打錯題怪物每隻 ${Math.round(10 * rate)}。抽卡券也能用 🪙${TICKET_PRICE} 換。`),
          h("h3", { style: "margin:14px 0 0" }, "獎勵與價格"));
        R.items.forEach((it) => {
          const nm = h("input", { class: "inp", value: it.name, style: "flex:1" });
          const cost = h("input", { class: "inp", type: "number", value: it.cost, style: "width:110px" });
          box.append(h("div", { class: "shop-item" }, nm, h("span", {}, "🪙"), cost,
            h("button", { class: "btn green", onclick: () => { it.name = nm.value.trim() || it.name; it.cost = Math.max(1, parseInt(cost.value, 10) || it.cost); G.save(); G.toast("已儲存"); } }, "存"),
            h("button", { class: "btn red", onclick: () => { R.items = R.items.filter((x) => x !== it); G.save(); parentHome("rewards"); } }, "刪")));
        });
        box.append(h("div", { style: "margin-top:12px" }, h("button", { class: "btn", onclick: () => { R.items.push({ id: "r" + Date.now(), name: "新獎勵", cost: 300 }); G.save(); parentHome("rewards"); } }, "＋ 新增獎勵")));
      }
      if (tab === "learn") {
        const acc = S.stats.answered ? Math.round((S.stats.correct / S.stats.answered) * 100) : 0;
        box.append(h("div", { class: "stats", style: "display:grid;grid-template-columns:repeat(4,1fr);gap:10px" },
          ...[["遊玩次數", S.stats.plays], ["答對率", acc + "%"], ["遊玩分鐘", Math.round(S.stats.minutes)], ["連續天數", S.streak.count]].map(([k, v]) => h("div", { class: "stat", style: "text-align:center;padding:10px;border-radius:14px;background:rgba(0,0,0,.06);font-weight:900" }, h("b", { style: "display:block;font-size:28px" }, v), k))));
        const titles = Object.values(S.titles || {}).sort((a, b) => a.at - b.at).map((t) => t.name);
        const full = Object.keys(S.collectDone || {}).length;
        if (titles.length || full) box.append(h("p", { style: "font-weight:900;margin:12px 0 0" },
          full ? `🏆 卡片全收集 ${full} 章` : null, titles.length && full ? "　" : null, titles.length ? `🏅 稱號：${titles.join("、")}` : null));
        // 玩過的章節：星數、次數、最近一次、還沒打倒的怪物
        const t = h("table", { class: "tbl", style: "margin-top:12px" }, h("tr", {}, h("th", {}, "章節"), h("th", {}, "星"), h("th", {}, "次數"), h("th", {}, "最近"), h("th", {}, "怪物")));
        let any = false;
        for (const [cid, c] of Object.entries(G.CAT.chapters)) {
          const sts = c.nodes.map((id) => G.nodeState(id));
          const plays = sts.reduce((a, s) => a + (s.plays || 0), 0);
          if (!plays) continue;
          any = true;
          const last = sts.map((s) => s.last || "").sort().pop() || "—";
          const mon = Object.values(S.wrong).filter((w) => c.nodes.includes(w.node)).length;
          t.append(h("tr", {}, h("td", {}, `${c.subject}・${c.grade} ${c.num} ${c.title}`), h("td", {}, `${G.chapterStars(cid)}/${G.chapterMax(cid)}`), h("td", {}, plays), h("td", {}, last), h("td", {}, mon || "—")));
        }
        box.append(any ? t : h("p", { class: "muted", style: "font-weight:700" }, "還沒有玩過的章節。"));
        const wl = Object.values(S.wrong);
        if (wl.length) {
          box.append(h("h3", {}, `孩子還沒記牢的題目（${wl.length}）`));
          wl.slice(0, 30).forEach((w) => box.append(h("div", { class: "wrong-item" }, h("b", {}, w.q.img ? `會考 ${w.q.y} 年第 ${w.q.n} 題` : w.q.q), "　→ ", h("span", { class: "ans" }, w.q.img ? `答案 ${"ABCD"[w.q.a]}` : w.q.o[w.q.a]))));
        }
      }
      if (tab === "settings") {
        const p1 = h("input", { class: "inp", type: "password", inputmode: "numeric", maxlength: 4, placeholder: "新密碼 4 位數" });
        const adj = h("input", { class: "inp", type: "number", placeholder: "例如 100 或 -50", style: "width:180px" });
        const file = h("input", { type: "file", accept: ".json", style: "display:none" });
        file.addEventListener("change", () => {
          const f = file.files[0];
          if (!f) return;
          f.text().then((txt) => {
            try { const d = JSON.parse(txt); const r = window.JB2Seal ? JB2Seal.openDef(d) : { ok: d.v === 1, state: d, why: "bad" }; if (!r.ok) { G.toast(window.JB2Record ? JB2Record.msg(r.why) : "檔案格式不對"); return; } G.S = Object.assign(G.S, r.state); G.save(); G.toast("已匯入進度"); parentHome("settings"); }
            catch (e) { G.toast("檔案格式不對"); }
          });
        });
        box.append(
          h("h3", {}, "改密碼"), h("div", { class: "row" }, p1, h("button", { class: "btn", onclick: () => {
            if (!/^\d{4}$/.test(p1.value)) return G.toast("請輸入 4 位數字");
            R.pin = p1.value; R.pinSet = true; G.save(); G.toast("密碼已更新"); parentHome("settings");
          } }, "儲存")),
          h("h3", {}, `調整金幣（目前 🪙${S.coins}）`), h("div", { class: "row" }, adj, h("button", { class: "btn", onclick: () => {
            const v = parseInt(adj.value, 10); if (!v) return; S.coins = Math.max(0, S.coins + v); G.save(); G.toast(`金幣 ${v > 0 ? "+" : ""}${v}`); parentHome("settings");
          } }, "套用")),
          h("h3", {}, "進度備份"), h("div", { class: "row" },
            h("button", { class: "btn", onclick: () => {
              const a = h("a", { href: URL.createObjectURL(new Blob([JSON.stringify(window.JB2Seal ? JB2Seal.makeDefFile(G.S) : G.S)], { type: "application/json" })), download: `數學保衛戰進度_${G.today()}.json` });
              a.click();
            } }, "⬇ 匯出進度"),
            h("button", { class: "btn ghost", style: "color:var(--ink);box-shadow:inset 0 0 0 2px #b9821f", onclick: () => file.click() }, "⬆ 匯入進度"), file),
          h("h3", {}, "重來"), h("button", { class: "btn red", onclick: async () => {
            if (await G.confirm("確定清除所有進度、卡片和金幣？", "清除")) { G.resetAll(); G.toast("已清除");
              // 分享版只有一個國度：回到它的章節列表，不要跑到全科目的世界地圖
              if (G.CAT.single) G.openSubject(G.CAT.single); else { G.show("s-world"); G.renderWorld(); }
              G.closeOverlay(); }
            else parentHome("settings");
          } }, "清除全部進度"));
      }
    }, { wide: true, onClose: () => G.refreshScreen() });
  }

  /* ---------- 攻略本 ---------- */
  G.openGuide = (tab = "ten", page = 0) => {
    const gd = G.CH.guide, S = G.S;
    const rec = (S.guide[G.CH.id] = S.guide[G.CH.id] && S.guide[G.CH.id].date === G.today() ? S.guide[G.CH.id] : { date: G.today(), pages: [], podcast: false, earned: false, used: false });
    const earn = () => {
      if (!rec.earned && (rec.pages.length >= 6 || rec.podcast)) {
        rec.earned = true;
        G.sfx("power");
        G.toast("📖 攻略加持！下一關多 1 條命");
      }
      G.save();
    };
    G.overlay((box) => {
      box.classList.add("guide");
      box.append(h("h2", {}, "📖 攻略本"),
        h("div", { class: "buffbar" }, rec.earned ? (rec.used ? "✔ 今天的攻略加持已經用掉了" : "✔ 攻略加持已啟動：下一關 +1 生命") : `翻 6 頁重點筆記或聽 Podcast，下一關 +1 生命（已翻 ${rec.pages.length} 頁）`),
        h("div", { class: "tabs" }, [["ten", "🧑‍🏫 重點筆記"], ["pod", "🎧 Podcast"], ["kx", "📘 講義"], ["sum", "⚡ 3 分鐘重點"]].map(([k, v]) => h("button", { class: k === tab ? "on" : "", onclick: () => G.openGuide(k) }, v))));
      if (tab === "ten" && gd.ten) {
        const pages = gd.ten.pages;
        const p = G.clamp(page, 0, pages.length - 1);
        if (!rec.pages.includes(p)) { rec.pages.push(p); earn(); }
        const go = (d) => G.openGuide("ten", p + d);
        box.append(h("div", { class: "muted", style: "font-weight:900;margin-bottom:6px" }, gd.ten.title),
          h("div", { class: "slide" }, h("img", { src: pages[p], alt: "" })),
          h("div", { class: "nav" },
            h("button", { class: "btn", disabled: p === 0 ? "disabled" : null, onclick: () => go(-1) }, "◀"),
            `${p + 1} / ${pages.length}`,
            h("button", { class: "btn", disabled: p === pages.length - 1 ? "disabled" : null, onclick: () => go(1) }, "▶")));
        G._guideKey = (e) => { if (e.key === "ArrowRight" && p < pages.length - 1) go(1); if (e.key === "ArrowLeft" && p > 0) go(-1); };
      }
      if (tab === "pod") {
        const urls = (gd.ten && gd.ten.podcast) || [];
        box.append(h("p", { style: "font-size:19px;font-weight:700;line-height:1.6" }, "這章有一段深度對談，邊聽邊想「為什麼」，比背重點更好記。會用瀏覽器開 YouTube。"));
        urls.forEach((u, i) => box.append(h("div", { style: "margin-top:10px" }, h("button", { class: "btn big", onclick: () => { window.open(u, "_blank"); rec.podcast = true; earn(); } }, `🎧 播放 Podcast${urls.length > 1 ? " " + (i + 1) : ""}`))));
        (gd.ten_more || []).forEach((t) => (t.podcast || []).forEach((u) => box.append(h("div", { style: "margin-top:10px" }, h("button", { class: "btn ghost", style: "color:var(--ink);box-shadow:inset 0 0 0 2px #b9821f", onclick: () => window.open(u, "_blank") }, `🎧 延伸：${t.title}`)))));
      }
      if (tab === "kx") {
        box.append(h("div", { class: "muted", style: "font-weight:900;margin-bottom:6px" }, `${gd.unit_name}`), h("div", { class: "kx" }, gd.kx.map((src) => h("img", { src, alt: "" }))));
      }
      if (tab === "sum") {
        gd.summary.forEach((s) => box.append(h("h3", { style: "margin:8px 0 4px" }, s.title), h("div", { class: "sum" }, s.text)));
      }
    }, { wide: true, onClose: () => { G._guideKey = null; G.refreshScreen(); } });
  };
  document.addEventListener("keydown", (e) => { if (G._guideKey) G._guideKey(e); });
})();
