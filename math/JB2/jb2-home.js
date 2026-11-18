/* jb2-home.js — 勇者小屋編輯器（擺設／壁紙／上色／寵物）＋參觀好友小屋。
 * 每一項編輯功能都要先在商店用金幣買「小屋權限」才會開通（見 jb2-decor.js）。
 * 小屋存檔在 H.home：{wall, wh, wb, objs:[{u,id,x,y,w,h?,rot,z,hue,bri,fl}], pet:{x,y,w,fl,hue,bri}|null, seen:{}}
 * x、y＝物件「中心點」佔房間的 %；w＝寬度佔房間寬的 %。
 */
(function () {
  'use strict';
  var Hub = null, GC = null, LEG = {}, editing = false, sel = null, drag = null, toolbar = null, vis = null, saveT = 0;
  var PERM_LABEL = { move: '🪑 擺設', deco: '✨ 小配件', wall: '🖼️ 壁紙', color: '🎨 調色', pet: '🐾 寵物' };

  var css = document.createElement('style');
  css.textContent = [
    '.po{position:absolute;display:flex;align-items:center;justify-content:center;pointer-events:none;line-height:1;user-select:none;-webkit-user-select:none}',
    '.po img{width:100%;display:block;filter:drop-shadow(0 2px 2px #0005);pointer-events:none}',
    '.po.hh img{height:100%;object-fit:contain}',
    '.po.ed,.petSpot.ed{pointer-events:auto;cursor:grab;touch-action:none}',
    '.po.sel,.petSpot.sel{outline:2px dashed #ffd84d;outline-offset:3px;border-radius:6px}',
    '.wallbg{position:absolute;inset:0;background-size:cover;background-position:center}',
    '.room.edit .fur{pointer-events:none;opacity:.55}',
    '.room.edit .homeBar .btn{pointer-events:auto}',
    '#home.on.editing{flex-direction:column;justify-content:flex-start;align-items:center;gap:8px;overflow-y:auto;padding:8px 0}',
    '#hedit{width:min(96vw,980px);background:#161a2eee;border:1px solid var(--line,#444);border-radius:14px;padding:10px;color:var(--txt,#eee);font-size:14px}',
    '#hedit .hr{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:5px 0}',
    '#hedit .btn.small{padding:4px 10px;font-size:13px}',
    '#hedit .lk{opacity:.6;border:1px dashed #888;border-radius:999px;padding:3px 10px;font-size:13px;cursor:pointer;background:none;color:inherit}',
    '#hedit .tray button{display:flex;flex-direction:column;align-items:center;gap:2px;width:70px;background:#0b0f22;color:inherit;border:1px solid var(--line,#444);border-radius:10px;padding:4px;font-size:11px}',
    '#hedit .tray img{height:36px;max-width:60px;object-fit:contain}',
    '#hedit .tray .em{font-size:28px;height:36px;line-height:36px}',
    '#hedit input[type=range]{width:130px}',
    '.vbar{position:absolute;left:10px;top:10px;z-index:6;background:#161a2ecc;border:1px solid var(--bronze,#c90);border-radius:999px;padding:3px 12px;font-size:14px;color:#fff}'
  ].join('\n');
  document.head.appendChild(css);

  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return Hub.esc(s); };
  var num = function (v, lo, hi, d) { v = +v; if (!isFinite(v)) v = d; return Math.min(hi, Math.max(lo, v)); };
  var uid = function () { return 'o' + Math.random().toString(36).slice(2, 9); };
  var perm = function (k) { return Hub.owned('perm_' + k); };
  var defOf = function (id) { return LEG[id] || Hub.ITEM[id]; };
  var isPlaceable = function (it) { return it && (it.slot === 'furn' || it.slot === 'deco') && it.id !== 'furn_stars'; };
  var permFor = function (id) { var d = defOf(id); return d && d.slot === 'deco' ? 'deco' : 'move'; };

  /* ---------- 存檔結構 ---------- */
  var floorSlots = [18, 32, 46, 60, 74, 86], wallSlots = [20, 34, 48, 62, 76], cnt = { floor: 0, wall: 0, ceil: 0 };
  function defaultPos(it) {
    var k = it.kind || 'floor', n = cnt[k]++;
    if (k === 'wall') return { x: wallSlots[n % wallSlots.length], y: 26 + (n >= wallSlots.length ? 18 : 0) };
    if (k === 'ceil') return { x: wallSlots[(n + 1) % wallSlots.length], y: 11 };
    return { x: floorSlots[n % floorSlots.length], y: 78 - (n >= floorSlots.length ? 8 : 0) };
  }
  function ensure() {
    var H = Hub.H, h = H.home;
    if (!h || typeof h !== 'object') h = H.home = { v: 1, wall: '', wh: 0, wb: 100, objs: [], pet: null, seen: {}, mig: 0 };
    if (!Array.isArray(h.objs)) h.objs = [];
    h.seen = h.seen || {};
    if (!h.mig) {   /* 第一次：把舊版小屋已經買的家具搬進新格式（位置不變） */
      h.mig = 1;
      (GC.home.furniture || []).forEach(function (f) {
        if (f.id === 'furn_stars' || !Hub.owned(f.id)) return;
        h.objs.push({ u: uid(), id: f.id, x: f.x + f.w / 2, y: f.y + f.h / 2, w: f.w, h: f.h, rot: f.rot || 0, z: f.z || 1, hue: 0, bri: 100, fl: 0 });
        h.seen[f.id] = 1;
      });
    }
    cnt = { floor: 0, wall: 0, ceil: 0 };
    h.objs.forEach(function (o) { var d = defOf(o.id); if (d) cnt[d.kind || 'floor'] = (cnt[d.kind || 'floor'] || 0) + 1; });
    Hub.ITEMS.forEach(function (it) {   /* 新買到的家具／小配件，自動擺進小屋 */
      if (!isPlaceable(it) || !Hub.owned(it.id) || h.seen[it.id]) return;
      h.seen[it.id] = 1;
      var p = defaultPos(it);
      h.objs.push({ u: uid(), id: it.id, x: p.x, y: p.y, w: it.w || 10, rot: 0, z: it.kind === 'floor' ? 2 : 1, hue: 0, bri: 100, fl: 0 });
    });
    return h;
  }
  function placedCount(id) { return ensure().objs.filter(function (o) { return o.id === id; }).length; }
  function persist() {
    Hub.save();
    clearTimeout(saveT);
    saveT = setTimeout(function () { try { window.JB2Friends && JB2Friends.uploadHome(); } catch (e) {} }, 2500);
  }

  /* ---------- 畫面 ---------- */
  function filt(o) {
    var f = '', hue = num(o.hue, 0, 360, 0), bri = num(o.bri, 50, 150, 100);
    if (hue) f += 'hue-rotate(' + hue + 'deg) ';
    if (bri !== 100) f += 'brightness(' + bri + '%)';
    return f ? 'filter:' + f + ';' : '';
  }
  function cur() { return vis ? vis.layout : ensure(); }
  function objHTML(o, ed) {
    var d = defOf(o.id); if (!d) return '';
    var im = Hub.OK[d.img], w = num(o.w, 2, 90, 10), hasH = o.h != null;
    var st = 'left:' + num(o.x, -10, 110, 50) + '%;top:' + num(o.y, -10, 110, 50) + '%;width:' + w + '%;' + (hasH ? 'height:' + num(o.h, 2, 90, 10) + '%;' : '') + 'z-index:' + (num(o.z, 0, 9, 1) + 1) +
      ';transform:translate(-50%,-50%) rotate(' + num(o.rot, -180, 180, 0) + 'deg) scaleX(' + (o.fl ? -1 : 1) + ');' + filt(o);
    var inner;
    if (im) inner = '<img src="' + esc(im) + '" alt="">';
    else { st += (hasH ? '' : 'aspect-ratio:1;') + 'font-size:calc(var(--u)*' + (w * 0.8) + ');'; inner = esc(d.emoji || (Hub.ITEM[o.id] && Hub.ITEM[o.id].icon) || d.icon || ''); }
    return '<div class="po' + (hasH ? ' hh' : '') + (!im && d.cls ? ' ' + d.cls : '') + (ed ? ' ed' : '') + (ed && sel === o.u ? ' sel' : '') + '" data-u="' + esc(o.u) + '" style="' + st + '">' + inner + '</div>';
  }
  function wallInfo(L) { var it = L.wall && Hub.ITEM[L.wall]; return it && it.slot === 'wall' ? it : null; }
  function wallHTML() {
    var L = cur(), it = wallInfo(L); if (!it) return '';
    var im = Hub.OK[it.img], bg = im ? 'url("' + im + '")' : it.bg;
    return '<div class="wallbg" style="background-image:' + bg.replace(/"/g, '&quot;') + ';' + filt({ hue: L.wh, bri: L.wb }) + '"></div>';
  }
  function objsHTML() { var L = cur(), ed = editing && !vis; return (L.objs || []).map(function (o) { return objHTML(o, ed); }).join(''); }
  function petInfo() { var eq = vis ? vis.eq : Hub.H.eq; return eq && eq.pet && Hub.ITEM[eq.pet] ? Hub.ITEM[eq.pet] : null; }
  function petBox() {
    var L = cur(), P0 = GC.home.pet, w0 = P0.w || P0.size || 6, p = L.pet || {};
    return { x: p.x != null ? num(p.x, 0, 100, 50) : P0.x + w0 / 2, y: p.y != null ? num(p.y, 0, 100, 60) : P0.y + (P0.h || w0) / 2, w: num(p.w != null ? p.w : w0, 3, 30, w0), fl: p.fl ? 1 : 0, hue: p.hue || 0, bri: p.bri || 100 };
  }
  function petHTML() {
    var pi = petInfo(); if (!pi) return '';
    var b = petBox(), im = Hub.OK[pi.img], ed = editing && !vis && perm('pet');
    var st = 'left:' + b.x + '%;top:' + b.y + '%;width:' + b.w + '%;font-size:calc(var(--u)*' + (b.w * 0.85) + ');transform:translate(-50%,-50%) scaleX(' + (b.fl ? -1 : 1) + ');z-index:6;display:flex;align-items:center;justify-content:center;line-height:1;' + filt(b);
    return '<div class="petSpot' + (ed ? ' ed' : '') + (ed && sel === '__pet' ? ' sel' : '') + '" data-u="__pet" style="' + st + '">' + (im ? '<img src="' + esc(im) + '" alt="" style="max-width:100%;max-height:100%">' : esc(pi.icon)) + '</div>';
  }
  function hasStars() { return vis ? !!vis.layout.stars : Hub.owned('furn_stars'); }
  function afterRoom(room) {
    var L = cur(), has = !!wallInfo(L);
    room.classList.toggle('edit', editing && !vis);
    if (has) { room.classList.add('art'); room.style.backgroundImage = ''; room.style.background = 'none'; } else room.style.background = '';
    if (vis) { var v = document.createElement('div'); v.className = 'vbar'; v.textContent = '🏠 參觀 ' + vis.name + ' 的小屋'; room.appendChild(v); }
    $('#home').classList.toggle('editing', editing && !vis);
  }
  function homeBarHTML() {
    if (vis) return '<div class="homeBar"><button class="btn" data-ha="endVisit">⬅️ 回家</button></div>';
    if (editing) return '<div class="homeBar"><button class="btn" data-ha="done">✅ 完成編輯</button></div>';
    return '<div class="homeBar"><button class="btn ghost" data-ha="edit">✏️ 編輯小屋</button> <button class="btn" data-act="exitHome">🚪 出門</button></div>';
  }

  /* ---------- 編輯工具列 ---------- */
  function lockBtn(k, why) { return '<button class="lk" data-ha="goPerm" title="' + esc(why) + '">🔒 ' + PERM_LABEL[k] + '（到商店開通）</button>'; }
  function selObj() { return sel && sel !== '__pet' ? ensure().objs.filter(function (o) { return o.u === sel; })[0] : null; }
  function thumb(it) { var im = Hub.OK[it.img]; return im ? '<img src="' + esc(im) + '" alt="">' : '<span class="em">' + esc(it.icon) + '</span>'; }
  function sliders(o, label) {
    if (!perm('color')) return '<div class="hr">' + lockBtn('color', '調色需要調色權') + '</div>';
    return '<div class="hr">🎨 ' + label + '色相 <input type="range" min="0" max="360" step="5" value="' + (o.hue || o.wh || 0) + '" data-hs="hue"> 亮度 <input type="range" min="60" max="140" step="5" value="' + (o.bri || o.wb || 100) + '" data-hs="bri"> <button class="btn ghost small" data-ha="colorReset">還原顏色</button></div>';
  }
  function drawToolbar() {
    if (!toolbar) return;
    if (!editing) { toolbar.style.display = 'none'; return; }
    toolbar.style.display = 'block';
    var h = ensure(), t = '<div class="hr"><b>✏️ 編輯小屋</b><span style="opacity:.75">　拖曳物件可以搬移；點一下可選取。所有改動會自動存檔。</span></div>';
    /* 選取中的物件 */
    var o = selObj();
    if (sel === '__pet') {
      var b = petBox(), pi = petInfo();
      t += '<div class="hr"><b>' + esc(pi ? pi.name : '寵物') + '</b> <button class="btn ghost small" data-ha="size-">➖ 縮小</button><button class="btn ghost small" data-ha="size+">➕ 放大</button><button class="btn ghost small" data-ha="flip">⇋ 翻面</button></div>' + sliders(b, '寵物');
    } else if (o) {
      var d = defOf(o.id);
      t += '<div class="hr"><b>' + esc(d.name || '物件') + '</b> <button class="btn ghost small" data-ha="size-">➖</button><button class="btn ghost small" data-ha="size+">➕</button><button class="btn ghost small" data-ha="rotL">↺</button><button class="btn ghost small" data-ha="rotR">↻</button><button class="btn ghost small" data-ha="flip">⇋ 翻面</button><button class="btn ghost small" data-ha="zUp">⬆ 往前</button><button class="btn ghost small" data-ha="zDown">⬇ 往後</button><button class="btn ghost small" data-ha="del">📦 收起來</button></div>' + sliders(o, '物件');
    } else t += '<div class="hr" style="opacity:.7">（還沒有選取物件）</div>';
    /* 物品盤：可以擺出來的東西 */
    var rows = '', locked = {};
    Hub.ITEMS.forEach(function (it) {
      if (!isPlaceable(it) || !Hub.owned(it.id)) return;
      var left = (it.copies || 1) - placedCount(it.id); if (left <= 0) return;
      var k = permFor(it.id); if (!perm(k)) { locked[k] = 1; return; }
      rows += '<button data-ha="add" data-id="' + esc(it.id) + '" title="' + esc(it.name) + '">' + thumb(it) + '<span>' + esc(it.name) + (left > 1 ? ' ×' + left : '') + '</span></button>';
    });
    t += '<div class="hr"><b>🎒 可以擺出來的東西</b>' + (rows ? '' : '<span style="opacity:.7">（沒有了。去商店逛逛吧！）</span>') + '</div>';
    if (rows) t += '<div class="hr tray">' + rows + '</div>';
    /* 壁紙 */
    if (perm('wall')) {
      var ws = Hub.ITEMS.filter(function (it) { return it.slot === 'wall' && Hub.owned(it.id); });
      t += '<div class="hr"><b>🖼️ 壁紙</b> <button class="btn small ' + (h.wall ? 'ghost' : '') + '" data-ha="wall" data-id="">原本的</button>' + ws.map(function (it) { return '<button class="btn small ' + (h.wall === it.id ? '' : 'ghost') + '" data-ha="wall" data-id="' + esc(it.id) + '">' + esc(it.icon + ' ' + it.name.replace('壁紙', '')) + '</button>'; }).join('') + (ws.length ? '' : '<span style="opacity:.7">（去商店買壁紙）</span>') + '</div>';
      if (h.wall) t += perm('color') ? '<div class="hr">🎨 壁紙色相 <input type="range" min="0" max="360" step="5" value="' + (h.wh || 0) + '" data-hs="wall-hue"> 亮度 <input type="range" min="60" max="140" step="5" value="' + (h.wb || 100) + '" data-hs="wall-bri"></div>' : '<div class="hr">' + lockBtn('color', '調色需要調色權') + '</div>';
    }
    /* 還沒開通的權限 */
    var lk = ''; ['move', 'deco', 'wall', 'pet', 'color'].forEach(function (k) { if (!perm(k)) lk += lockBtn(k, '商店「小屋權限」'); });
    if (lk) t += '<div class="hr">' + lk + '</div>';
    t += '<div class="hr"><button class="btn ghost small" data-ha="reset">🧹 全部收起來重擺</button></div>';
    toolbar.innerHTML = t;
  }

  /* ---------- 編輯動作 ---------- */
  function clampObj(o) { o.x = num(o.x, 3, 97, 50); o.y = num(o.y, 3, 97, 50); o.w = num(o.w, 3, 70, 10); if (o.h != null) o.h = num(o.h, 3, 70, 10); }
  function act(a, el) {
    var h = ensure(), o = selObj(), pet = sel === '__pet';
    var tgt = pet ? (h.pet = h.pet || {}) : o;
    switch (a) {
      case 'edit':
        if (!['move', 'deco', 'wall', 'color', 'pet'].some(perm)) { noPermPanel(); return; }
        editing = true; sel = null; Hub.renderHome(); drawToolbar(); return;
      case 'done': editing = false; sel = null; Hub.renderHome(); drawToolbar(); persist(); return;
      case 'goPerm': editing = false; sel = null; drawToolbar(); Hub.renderHome(); Hub.openShop('perm'); return;
      case 'endVisit': vis = null; editing = false; Hub.closeHome(); try { JB2Friends.openPanel(); } catch (e) {} return;
      case 'wall': if (!perm('wall')) return; h.wall = el.dataset.id || ''; if (!h.wall) { h.wh = 0; h.wb = 100; } break;
      case 'add': {
        var it = Hub.ITEM[el.dataset.id]; if (!it || !perm(permFor(it.id)) || placedCount(it.id) >= (it.copies || 1)) return;
        var p = defaultPos(it), n = { u: uid(), id: it.id, x: p.x, y: p.y, w: it.w || 10, rot: 0, z: it.kind === 'floor' ? 2 : 1, hue: 0, bri: 100, fl: 0 };
        h.objs.push(n); sel = n.u; break;
      }
      case 'del': if (!o || !perm(permFor(o.id))) return; h.objs = h.objs.filter(function (x) { return x !== o; }); sel = null; break;
      case 'reset': if (!confirm('要把小屋裡的東西全部收起來嗎？（東西不會不見，可以再一個一個擺出來）')) return; h.objs = []; h.pet = null; h.wall = ''; h.wh = 0; h.wb = 100; h.seen = {}; h.mig = 1; sel = null; break;
      case 'size+': case 'size-': {
        if (!tgt) return; var k = a === 'size+' ? 1.12 : 1 / 1.12;
        if (pet) { if (!perm('pet')) return; var b = petBox(); tgt.w = num(b.w * k, 3, 30, b.w); tgt.x = b.x; tgt.y = b.y; }
        else { if (!perm(permFor(o.id))) return; o.w *= k; if (o.h != null) o.h *= k; clampObj(o); }
        break;
      }
      case 'rotL': case 'rotR': if (!o || !perm(permFor(o.id))) return; o.rot = num((o.rot || 0) + (a === 'rotR' ? 15 : -15), -180, 180, 0); if (o.rot === 180 || o.rot === -180) o.rot = 0; break;
      case 'flip': if (!tgt) return; if (pet) { if (!perm('pet')) return; var b2 = petBox(); tgt.x = b2.x; tgt.y = b2.y; tgt.w = b2.w; } else if (!perm(permFor(o.id))) return; tgt.fl = tgt.fl ? 0 : 1; break;
      case 'zUp': case 'zDown': if (!o || !perm(permFor(o.id))) return; o.z = num((o.z || 1) + (a === 'zUp' ? 1 : -1), 0, 8, 1); break;
      case 'colorReset': if (!tgt || !perm('color')) return; tgt.hue = 0; tgt.bri = 100; break;
      default: return;
    }
    persist(); Hub.renderHome(); drawToolbar();
  }

  /* 拖曳 */
  function bindRoom() {
    var room = $('#room');
    room.addEventListener('pointerdown', function (e) {
      if (!editing || vis) return;
      var t = e.target.closest('.po.ed,.petSpot.ed'); if (!t) { if (e.target.closest('.homeBar'))return; sel = null; room.querySelectorAll('.sel').forEach(function (x) { x.classList.remove('sel'); }); drawToolbar(); return; }
      var u = t.dataset.u, h = ensure(), o = u === '__pet' ? null : h.objs.filter(function (x) { return x.u === u; })[0];
      if (u !== '__pet' && (!o || !perm(permFor(o.id)))) { return; }
      if (u === '__pet' && !perm('pet')) return;
      e.preventDefault();
      var r = room.getBoundingClientRect(), b = u === '__pet' ? petBox() : o;
      sel = u; room.querySelectorAll('.sel').forEach(function (x) { x.classList.remove('sel'); }); t.classList.add('sel');
      drag = { t: t, u: u, o: o, r: r, dx: (e.clientX - r.left) / r.width * 100 - b.x, dy: (e.clientY - r.top) / r.height * 100 - b.y, moved: false, id: e.pointerId };
      try { t.setPointerCapture(e.pointerId); } catch (x) {}
      drawToolbar();
    });
    room.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var x = num((e.clientX - drag.r.left) / drag.r.width * 100 - drag.dx, 3, 97, 50), y = num((e.clientY - drag.r.top) / drag.r.height * 100 - drag.dy, 3, 97, 50);
      drag.t.style.left = x + '%'; drag.t.style.top = y + '%'; drag.x = x; drag.y = y; drag.moved = true;
    });
    var end = function (e) {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      if (drag.moved) {
        if (drag.u === '__pet') { var h = ensure(), b = petBox(); h.pet = Object.assign({}, h.pet || {}, { x: drag.x, y: drag.y, w: b.w }); }
        else { drag.o.x = drag.x; drag.o.y = drag.y; }
        persist();
      }
      drag = null;
    };
    room.addEventListener('pointerup', end); room.addEventListener('pointercancel', end);
  }

  function noPermPanel() {
    Hub.openPanel('✏️ 編輯小屋', '<div class="cat"><div class="av">🐱</div><div>想自己布置小屋嗎？每一種編輯功能都要到商店用 ' + esc(Hub.CUR) + ' 開通「權限」喔！<br>多練習、多闖關，就能一項一項解鎖：<br>🪑 擺設　✨ 小配件　🖼️ 壁紙　🎨 調色　🐾 寵物　🚪 串門子</div></div><button class="btn" data-ha="shopPerm">🏪 去商店看看</button>');
  }

  /* ---------- 參觀好友 ---------- */
  function clean(rec) {   /* 別人傳來的資料一律當成「不可信」，只留下認得的欄位 */
    var L = rec && rec.layout && typeof rec.layout === 'object' ? rec.layout : {}, out = { objs: [], wall: '', wh: num(L.wh, 0, 360, 0), wb: num(L.wb, 50, 150, 100), stars: !!L.stars, pet: null };
    if (L.wall && Hub.ITEM[L.wall] && Hub.ITEM[L.wall].slot === 'wall') out.wall = L.wall;
    (Array.isArray(L.objs) ? L.objs : []).slice(0, 60).forEach(function (o) {
      if (!o || !defOf(o.id)) return;
      out.objs.push({ u: String(o.u || uid()).replace(/[^\w]/g, '').slice(0, 12), id: o.id, x: num(o.x, 0, 100, 50), y: num(o.y, 0, 100, 50), w: num(o.w, 2, 70, 10), h: o.h != null ? num(o.h, 2, 70, 10) : null, rot: num(o.rot, -180, 180, 0), z: num(o.z, 0, 8, 1), hue: num(o.hue, 0, 360, 0), bri: num(o.bri, 50, 150, 100), fl: o.fl ? 1 : 0 });
    });
    if (L.pet && typeof L.pet === 'object') out.pet = { x: num(L.pet.x, 0, 100, 50), y: num(L.pet.y, 0, 100, 60), w: num(L.pet.w, 3, 30, 6), fl: L.pet.fl ? 1 : 0, hue: num(L.pet.hue, 0, 360, 0), bri: num(L.pet.bri, 50, 150, 100) };
    var eq = rec && rec.eq && typeof rec.eq === 'object' ? rec.eq : {}, e2 = {};
    ['cloak', 'hat', 'staff', 'pet', 'title'].forEach(function (k) { if (typeof eq[k] === 'string' && (Hub.ITEM[eq[k]] || !eq[k])) e2[k] = eq[k]; });
    return { sid: String(rec.student_number || ''), name: String(rec.name || '好友').slice(0, 12), eq: Object.assign({ cloak: 'cloak_blue', hat: 'hat_none', staff: 'staff_wood', pet: '', title: '' }, e2), layout: out };
  }
  function visit(rec) { vis = clean(rec); editing = false; Hub.closePanel(); Hub.openHome(); }

  /* ---------- 啟動 ---------- */
  function init(hub) {
    Hub = hub; GC = hub.GC;
    (GC.home.furniture || []).forEach(function (f) { LEG[f.id] = Object.assign({}, f, { slot: 'furn', name: (Hub.ITEM[f.id] && Hub.ITEM[f.id].name) || f.id, kind: 'floor' }); });
    toolbar = document.createElement('div'); toolbar.id = 'hedit'; toolbar.style.display = 'none';
    $('#home').appendChild(toolbar);
    bindRoom();
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ha]'); if (!b) return;
      var a = b.dataset.ha;
      if (a === 'shopPerm') { Hub.closePanel(); Hub.openShop('perm'); return; }
      act(a, b);
    });
    document.addEventListener('input', function (e) {
      var s = e.target.closest && e.target.closest('input[data-hs]'); if (!s) return;
      var h = ensure(), k = s.dataset.hs, v = +s.value, o = selObj();
      if (!perm('color')) return;
      if (k === 'wall-hue') h.wh = v; else if (k === 'wall-bri') h.wb = v;
      else if (sel === '__pet') { var b = petBox(); h.pet = Object.assign({}, h.pet || {}, { x: b.x, y: b.y, w: b.w, fl: b.fl }); h.pet[k] = v; }
      else if (o) o[k] = v; else return;
      var room = $('#room');
      if (k.indexOf('wall') === 0) { var w = room.querySelector('.wallbg'); if (w) w.style.filter = filt({ hue: h.wh, bri: h.wb }).replace('filter:', '').replace(';', ''); }
      else { var el = room.querySelector('[data-u="' + (sel === '__pet' ? '__pet' : o.u) + '"]'); if (el) el.style.filter = filt(sel === '__pet' ? h.pet : o).replace('filter:', '').replace(';', '') || 'none'; }
    });
    document.addEventListener('change', function (e) { if (e.target.closest && e.target.closest('input[data-hs]')) persist(); });
    ensure();
    window.JB2Home.ready = true;
  }

  window.JB2Home = {
    init: init, ready: false,
    get vis() { return vis; },
    get editing() { return editing; },
    wallHTML: wallHTML, objsHTML: objsHTML, petHTML: petHTML, hasStars: hasStars, afterRoom: afterRoom, homeBarHTML: homeBarHTML,
    visit: visit, ensure: ensure,
    exitHome: function () { if (editing) { editing = false; sel = null; drawToolbar(); } vis = null; },
    snapshot: function () { var h = ensure(); return { wall: h.wall, wh: h.wh, wb: h.wb, objs: h.objs, pet: h.pet, stars: Hub.owned('furn_stars') }; },
    onOpen: function () { ensure(); drawToolbar(); }
  };
})();
