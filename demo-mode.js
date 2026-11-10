// demo-mode.js — 老師用「示範帳號」專用工具（所有遊戲共用，一律先判斷是不是示範帳號，不是就完全不動作）
//
// 啟用條件：用「學校主機認證過」的示範帳號學號登入（index.html 登入時，伺服器回傳 isDemo:true，
// 身分會存進 localStorage 的 keyagent_active_student）。一般學生、在家的本機模式登入都不會啟用。
//
// 提供：
//   KeyagentDemo.isActive()            是不是示範帳號
//   KeyagentDemo.opt('invincible')     目前「無敵不扣血」開關（另有 'money'、'autoNext'）
//   KeyagentDemo.ensureWallet()        把共用錢包（GBit）補到無限（所有共用 GBit 的遊戲都適用）
//   KeyagentDemo.mountBar(actions)     在畫面左下角放一個小面板：開關 ＋ 跳過題目／跳過這波／直接通關 按鈕
//                                       actions = [{ label, key:'F2', fn }]
(function (g) {
  const ACTIVE_KEY = 'keyagent_active_student';
  const OPT_KEY = 'keyagent_demo_options';
  const BASE_SAVE_KEY = 'keyagent_save_v1';
  const BIG = 999999999;
  const DEFAULTS = { invincible: true, money: true, autoNext: true };

  function identity() {
    try { return JSON.parse(localStorage.getItem(ACTIVE_KEY) || 'null'); } catch (e) { return null; }
  }
  function isActive() {
    const id = identity();
    return !!(id && id.verified === true && id.isDemo === true && id.studentNumber);
  }
  function opts() {
    let o = {};
    try { o = JSON.parse(localStorage.getItem(OPT_KEY) || '{}'); } catch (e) { /* ignore */ }
    return Object.assign({}, DEFAULTS, o);
  }
  function opt(name) { return isActive() && !!opts()[name]; }
  function setOpt(name, val) {
    const o = opts(); o[name] = !!val;
    try { localStorage.setItem(OPT_KEY, JSON.stringify(o)); } catch (e) { /* ignore */ }
  }

  // 錢包：直接把這位學生共用存檔裡的 GBit 補滿（鍵位特工商店、寵物…等共用 GBit 的地方都會看到）
  function ensureWallet() {
    if (!isActive() || !opts().money) return;
    const id = identity();
    const key = BASE_SAVE_KEY + ':' + id.studentNumber;
    try {
      const save = JSON.parse(localStorage.getItem(key) || '{}');
      if ((save.gbit || 0) >= BIG / 2) return;
      save.gbitEarnedLifetime = BIG;
      save.gbitSpentLifetime = 0;
      save.gbit = BIG;
      localStorage.setItem(key, JSON.stringify(save));
    } catch (e) { /* ignore */ }
  }

  let _bar = null;
  function mountBar(actions) {
    if (!isActive() || _bar) return;
    actions = actions || [];
    const wrap = document.createElement('div');
    wrap.id = 'keyagentDemoBar';
    wrap.style.cssText = 'position:fixed;left:10px;bottom:10px;z-index:2147483000;font:13px/1.4 "Microsoft JhengHei",sans-serif;color:#fff;';
    const toggle = document.createElement('button');
    toggle.textContent = '🧪 示範模式';
    toggle.style.cssText = 'background:#7c3aed;color:#fff;border:0;border-radius:16px;padding:6px 12px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.4);';
    const panel = document.createElement('div');
    panel.style.cssText = 'display:none;margin-bottom:6px;background:rgba(20,20,35,.94);border:1px solid #7c3aed;border-radius:10px;padding:10px 12px;min-width:190px;box-shadow:0 4px 14px rgba(0,0,0,.5);';
    const o = opts();
    [['invincible', '無敵（不扣血、不失敗）'], ['money', '金錢無限'], ['autoNext', '過關自動下一關']].forEach(([k, label]) => {
      const row = document.createElement('label');
      row.style.cssText = 'display:flex;gap:6px;align-items:center;margin:3px 0;cursor:pointer;';
      const cb = document.createElement('input');
      cb.type = 'checkbox'; cb.checked = !!o[k];
      cb.addEventListener('change', () => { setOpt(k, cb.checked); if (k === 'money') ensureWallet(); });
      row.appendChild(cb); row.appendChild(document.createTextNode(label));
      panel.appendChild(row);
    });
    actions.forEach(a => {
      const b = document.createElement('button');
      b.textContent = a.label + (a.key ? '（' + a.key + '）' : '');
      b.style.cssText = 'display:block;width:100%;margin-top:6px;padding:5px 8px;background:#2563eb;color:#fff;border:0;border-radius:6px;cursor:pointer;';
      b.addEventListener('mousedown', e => e.preventDefault());   // 不搶走遊戲輸入框的焦點
      b.addEventListener('click', () => { try { a.fn(); } catch (err) { console.warn(err); } });
      panel.appendChild(b);
    });
    toggle.addEventListener('mousedown', e => e.preventDefault());
    toggle.addEventListener('click', () => { panel.style.display = panel.style.display === 'none' ? 'block' : 'none'; });
    wrap.appendChild(panel); wrap.appendChild(toggle);
    document.body.appendChild(wrap);
    _bar = wrap;

    document.addEventListener('keydown', e => {
      const a = actions.find(x => x.key === e.key);
      if (a) { e.preventDefault(); e.stopPropagation(); try { a.fn(); } catch (err) { console.warn(err); } }
    }, true);
  }

  g.KeyagentDemo = { isActive, opt, ensureWallet, mountBar };
})(window);
