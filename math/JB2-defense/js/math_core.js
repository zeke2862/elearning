/* 數學保衛戰 — 共用底層：亂數、分數、根式、算式排版、答案判定、數字鍵盤（只有數學網站載入）
   題目由章節資料裡的產生器出（tools/content/math/<cid>.gen.js，M.reg 註冊），格式見 tools/content/MATH_SPEC.md */
(function () {
  const G = window.G, h = G.h;
  const M = (G.M = { gens: {} });

  /* ---------- 亂數：同一個 seed 出同一題，怪物回來時換 seed 就換數字 ---------- */
  M.rand = (seed) => {
    let s = seed >>> 0;
    const next = () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const r = {
      seed,
      next,
      int: (a, b) => a + Math.floor(next() * (b - a + 1)),
      nz: (a, b) => { let v = 0; while (!v) v = r.int(a, b); return v; }, // 不要 0
      pick: (arr) => arr[Math.floor(next() * arr.length)],
      chance: (p) => next() < p,
      sign: () => (next() < 0.5 ? -1 : 1),
      shuffle: (arr) => {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(next() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      },
    };
    return r;
  };
  M.newSeed = () => Math.floor(Math.random() * 2147483647);

  /* ---------- 分數、根式 ---------- */
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  M.gcd = gcd;
  M.lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
  M.frac = (n, d = 1) => {
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1;
    return { n: n / g, d: d / g };
  };
  const F = (x) => (typeof x === "number" ? { n: x, d: 1 } : x);
  M.add = (a, b) => { a = F(a); b = F(b); return M.frac(a.n * b.d + b.n * a.d, a.d * b.d); };
  M.sub = (a, b) => { a = F(a); b = F(b); return M.frac(a.n * b.d - b.n * a.d, a.d * b.d); };
  M.mul = (a, b) => { a = F(a); b = F(b); return M.frac(a.n * b.n, a.d * b.d); };
  M.div = (a, b) => { a = F(a); b = F(b); return M.frac(a.n * b.d, a.d * b.n); };
  // √n 化成 a√b（b 沒有平方因數）
  M.simp = (n) => {
    let a = 1, b = n;
    for (let k = 2; k * k <= b; k++) while (b % (k * k) === 0) { b /= k * k; a *= k; }
    return [a, b];
  };
  // 多項式寫成字串：M.poly([2, "x^2"], [-3, "x"], [1, ""]) → 2x^2 − 3x ＋ 1（係數 0 跳過，1 不寫，負號接得好看）
  M.poly = (...terms) => {
    let out = "";
    for (const [c, v] of terms) {
      if (!c) continue;
      const n = Math.abs(c), body = (n === 1 && v ? "" : n) + v;
      out += out ? (c < 0 ? " − " : " ＋ ") + body : (c < 0 ? "−" : "") + body;
    }
    return out || "0";
  };
  M.root = (a, b) => ({ root: [a, b] });
  M.rootOf = (n) => { const [a, b] = M.simp(n); return b === 1 ? a : M.root(a, b); };

  // 把答案換成「正負號＋平方值」，分數、小數、根式才能互相比（√4 和 2、0.5 和 1/2 都算一樣）
  function sq(x) {
    if (typeof x === "number") {
      if (Number.isInteger(x)) x = { n: x, d: 1 };
      else {
        const k = Math.round(x * 10000);
        x = M.frac(k, 10000);
      }
    }
    if (x.root) {
      const [a, b] = x.root;
      const v = a * a * b;
      return `${a < 0 ? "-" : a === 0 || b === 0 ? "0" : "+"}${a === 0 || b === 0 ? 0 : v}/1`;
    }
    const f = M.frac(x.n, x.d);
    return `${f.n < 0 ? "-" : f.n === 0 ? "0" : "+"}${f.n * f.n}/${f.d * f.d}`;
  }
  M.same = (a, b) => a != null && b != null && sq(a) === sq(b);
  // 孩子輸入的字串 → 值；打到一半（1/、2√）回 null
  M.parse = (s) => {
    if (!s) return null;
    let m = s.match(/^(-?)(\d*)√(\d+)$/);
    if (m) {
      const a = m[2] === "" ? 1 : +m[2];
      return { root: [m[1] ? -a : a, +m[3]], text: s };
    }
    m = s.match(/^(-?)(\d+)\/(\d+)$/);
    if (m) return +m[3] === 0 ? null : { n: (m[1] ? -1 : 1) * +m[2], d: +m[3], text: s };
    m = s.match(/^(-?)(\d+)(?:\.(\d+))?$/);
    if (m) {
      const dec = m[3] || "";
      const d = 10 ** dec.length, n = +m[2] * d + (+dec || 0);
      return { n: (m[1] ? -1 : 1) * n, d, text: s };
    }
    return null;
  };
  // 這一格算對了沒："ok"、"no"，值對但還能再約（題目要最簡）時 "simplify"
  M.judge = (slot, s) => {
    const v = M.parse(s);
    if (!v) return "no";
    if (!M.same(v, slot.ans)) return "no";
    if (slot.simplest) {
      if (v.root && M.simp(v.root[1])[1] !== v.root[1]) return "simplify";
      if (!v.root && s.includes("/") && gcd(v.n, v.d) !== 1) return "simplify";
    }
    return "ok";
  };
  // 答案寫成排版字串
  M.show = (x) => {
    if (typeof x === "number") return Number.isInteger(x) ? String(x) : String(+x.toFixed(4));
    if (typeof x === "string") return x;
    if (x.root) {
      const [a, b] = x.root;
      return `${a === 1 ? "" : a === -1 ? "-" : a}√${b}`;
    }
    const f = M.frac(x.n, x.d);
    if (f.d === 1) return String(f.n);
    return f.n < 0 ? `-{${-f.n}/${f.d}}` : `{${f.n}/${f.d}}`;
  };

  /* ---------- 算式排版 ----------
     {a/b} 分數、^2 或 ^{10} 次方、√12 或 √{x+1} 根號、~AB~ 線段（上面一橫）、**粗體**。其他照原樣 */
  const TOKEN = /\{([^{}/]+)\/([^{}/]+)\}|\^\{([^{}]+)\}|\^(-?\w)|√\{([^{}]+)\}|√(\d+|[a-zA-Z])|~([^~]+)~|\*\*([^*]+)\*\*/g;
  M.tex = (str, cls) => {
    const box = h("span", { class: "mx-tex" + (cls ? " " + cls : "") });
    const s = String(str == null ? "" : str);
    let last = 0;
    // matchAll 每次用自己的複本：分數裡面還有算式時會遞迴呼叫 M.tex
    for (const m of s.matchAll(TOKEN)) {
      if (m.index > last) box.append(s.slice(last, m.index));
      if (m[1] != null) box.append(h("span", { class: "mx-frac" }, h("span", { class: "top" }, M.tex(m[1])), h("span", { class: "bot" }, M.tex(m[2]))));
      else if (m[3] != null) box.append(h("sup", {}, M.tex(m[3])));
      else if (m[4] != null) box.append(h("sup", {}, m[4]));
      else if (m[5] != null) box.append(h("span", { class: "mx-rt" }, "√", h("span", { class: "in" }, M.tex(m[5]))));
      else if (m[6] != null) box.append(h("span", { class: "mx-rt" }, "√", h("span", { class: "in" }, m[6])));
      else if (m[7] != null) box.append(h("span", { class: "mx-ov" }, m[7]));
      else if (m[8] != null) box.append(h("b", {}, M.tex(m[8])));
      last = m.index + m[0].length;
    }
    if (last < s.length) box.append(s.slice(last));
    return box;
  };
  // 純文字（結算畫面、家長頁的錯題清單用）
  const SUP = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹", "-": "⁻", n: "ⁿ", x: "ˣ" };
  M.plain = (str) => String(str == null ? "" : str)
    .replace(/\{([^{}/]+)\/([^{}/]+)\}/g, "$1/$2")
    .replace(/\^\{([^{}]+)\}/g, (_, a) => [...a].map((c) => SUP[c] || c).join(""))
    .replace(/\^(-?\w)/g, (_, a) => [...a].map((c) => SUP[c] || c).join(""))
    .replace(/√\{([^{}]+)\}/g, "√($1)")
    .replace(/~([^~]+)~/g, "$1")
    .replace(/\*\*/g, "");

  /* ---------- 產生器 ---------- */
  M.reg = (obj) => Object.assign(M.gens, obj);
  // 出一題：帶上 ref（題型、等級），答錯變怪物時才能換數字重出
  M.make = (gen, lv = 1, seed = M.newSeed()) => {
    const fn = M.gens[gen];
    if (!fn) throw new Error("沒有這個題型：" + gen);
    const q = fn(M.rand(seed), lv);
    dropTraps(q);
    q.gen = gen;
    q.lv = lv;
    q.seed = seed;
    return q;
  };
  // 常見錯法剛好等於正確答案時（例如 45° 的互餘）就不算錯法
  function dropTraps(q) {
    if (q.ask && q.traps) q.traps = q.traps.filter((t) => { const w = [].concat(t.a); return !(w.length === q.ask.length && w.every((v, i) => M.same(v, q.ask[i].ans))); });
    if (q.next) dropTraps(q.next);
    if (q.steps && q.chain) q.steps.forEach(dropTraps);
  }
  const ansText = (q) => {
    if (q.tune) return M.plain(q.tune.answerText);
    if (q.pick) return M.plain(q.pick[q.ans]);
    if (q.ask) {
      // 填空接回算式：(x＋▢) 填 −5 寫成 (x−5)；(x＋▢)(x＋▢)、7＜√63＜8 中間不加逗號
      let out = "";
      for (const a of q.ask) {
        let pre = a.pre ? M.plain(a.pre) : "", v = M.plain(M.show(a.ans));
        if (v.startsWith("-")) v = "−" + v.slice(1);
        if (/^[=＝]/.test(pre) === false && /[=＝]$/.test(pre)) pre += " ";
        let piece = pre + v + (a.post ? M.plain(a.post) : "");
        if (out && !(/[(（＋+−×＜<≤]$/.test(out) || (/[)）²]$/.test(out) && /^[(（]/.test(piece)))) out += "，";
        if (/[＋+]$/.test(out) && piece.startsWith("−")) out = out.slice(0, -1);
        if (!out && /[＋+]$/.test(pre) && v.startsWith("−")) piece = pre.slice(0, -1) + v + (a.post ? M.plain(a.post) : "");
        out += piece;
      }
      return out.replace(/[＋+]−/g, "−");
    }
    return "";
  };
  // 答錯要記的東西：結算畫面、家長頁讀 q、o、a、ex；gen、lv 給怪物重出
  M.wrongOf = (q, ref) => ({ q: M.plain(q.q), o: [ansText(q)], a: 0, ex: M.plain(q.ok || ""), gen: q.gen, lv: q.lv, ...(ref || {}) });
  M.ansText = ansText;

  /* ---------- 數字鍵盤 ----------
     遊戲自己畫，不用手機鍵盤：不會擋畫面、不會自動放大。電腦也能直接打字 */
  M.pad = (host, q, onFire, fireLabel) => {
    host.innerHTML = "";
    const slots = q.ask.map((a) => ({ ...a, text: "" }));
    let cur = 0, locked = false;
    const hasRoot = slots.some((s) => s.kind === "root");
    const hasFrac = !slots.every((s) => s.kind === "int" || s.kind === "root");
    const row = h("div", { class: "mx-slots" });
    const render = () => {
      row.innerHTML = "";
      slots.forEach((s, i) => {
        const sl = h("button", { class: "mx-slot" + (i === cur ? " on" : ""), onclick: () => { cur = i; render(); } }, slotFace(s.text));
        const unit = h("span", { class: "mx-unit" });
        if (s.pre) unit.append(M.tex(s.pre));
        unit.append(sl);
        if (s.post) unit.append(M.tex(s.post));
        row.append(unit);
      });
    };
    const press = (k) => {
      if (locked) return;
      const s = slots[cur];
      G.sfx("click");
      if (k === "⌫") s.text = s.text.slice(0, -1);
      else if (k === "−") s.text = s.text.startsWith("-") ? s.text.slice(1) : "-" + s.text;
      else if (k === "/") { if (/^-?\d+$/.test(s.text)) s.text += "/"; }
      else if (k === ".") { if (/^-?\d+$/.test(s.text)) s.text += "."; }
      else if (k === "√") { if (!s.text.includes("√") && !s.text.includes("/") && !s.text.includes(".")) s.text += "√"; }
      else if (k === "→") cur = (cur + 1) % slots.length;
      else if (k === "fire") return fire();
      else if (s.text.replace(/\D/g, "").length < 6) s.text += k;
      render();
    };
    const fire = () => {
      if (locked) return;
      if (slots.some((s) => !M.parse(s.text))) {
        const empty = slots.findIndex((s) => !M.parse(s.text));
        cur = empty;
        render();
        G.toast(slots.length > 1 ? "每一格都要填好才能發射！" : "先輸入答案再發射！");
        return;
      }
      onFire(slots.map((s) => s.text));
    };
    const K = (label, k, cls) => h("button", { class: "mx-key" + (cls ? " " + cls : ""), "data-k": k || label, onclick: () => press(k || label) }, label);
    // 好幾格時可以直接點格子，按發射也會跳到還沒填的那一格；用不到分數的題目，空位放「下一格」
    const third = hasFrac ? K("分數", "/", "alt") : slots.length > 1 ? K("下一格", "→", "alt") : h("span", { class: "mx-key off" });
    const keys = h("div", { class: "mx-keys" },
      K("7"), K("8"), K("9"), K("⌫", "⌫", "alt"),
      K("4"), K("5"), K("6"), K("−", "−", "alt"),
      K("1"), K("2"), K("3"), third,
      K("0"), hasRoot ? K("√", "√") : K(".", "."), h("button", { class: "mx-key fire", onclick: () => press("fire") }, fireLabel || "🔥 發射"));
    host.append(row, keys, h("button", { class: "mx-key fire mx-sendmini", onclick: () => press("fire") }, fireLabel || "🔥 發射"));
    render();
    const onKey = (e) => {
      if (document.querySelector(".explain-veil")) return;
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === "-") press("−");
      else if (e.key === "/") press("/");
      else if (e.key === ".") press(".");
      else if (e.key === "Backspace") press("⌫");
      else if (e.key === "Tab") { e.preventDefault(); press("→"); }
      else if (e.key === "r" && hasRoot) press("√");
      else if (e.key === "Enter") { e.preventDefault(); press("fire"); }
    };
    document.addEventListener("keydown", onKey);
    return {
      lock(v) { locked = v; },
      clear() { slots.forEach((s) => (s.text = "")); cur = 0; render(); },
      destroy() { document.removeEventListener("keydown", onKey); },
    };
  };
  // 格子裡顯示正在打的字：分數上下兩格、根號
  function slotFace(t) {
    if (!t) return h("span", { class: "mx-ph" }, "　");
    const m = t.match(/^(-?)(\d+)\/(\d*)$/);
    if (m) return h("span", {}, m[1] ? "−" : "", h("span", { class: "mx-frac" }, h("span", { class: "top" }, m[2]), h("span", { class: "bot" }, m[3] || "　")));
    const r = t.match(/^(-?)(\d*)√(\d*)$/);
    if (r) return h("span", {}, r[1] ? "−" : "", r[2], h("span", { class: "mx-rt" }, "√", h("span", { class: "in" }, r[3] || "　")));
    return h("span", {}, t.replace("-", "−"));
  }
})();
