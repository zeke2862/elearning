/* lockdown.js —— 學生端遊戲頁面的「基本防護」
 * 擋掉：右鍵選單、F12、Ctrl+Shift+I/J/C、Ctrl+U（看原始碼）、Ctrl+S（另存）、長按選單、拖曳選取複製。
 * 也會自動套用到遊戲裡的 iframe（例如關卡頁）。
 * 注意：這只是「提高門檻」，擋得住一般同學的好奇手滑；真正防作弊要靠後台的資料檢查。
 * 老師要除錯：暫時把頁面裡的 <script src=".../lockdown.js"> 那行拿掉即可。 */
(function () {
  if (window.__lockdown) return; window.__lockdown = true;
  var BAD = function (e) {
    var k = (e.key || '').toLowerCase(), c = e.ctrlKey || e.metaKey;
    if (e.keyCode === 123 || k === 'f12') return true;                                  // F12
    if (c && e.shiftKey && 'ijcke'.indexOf(k) >= 0 && k) return true;                    // Ctrl+Shift+I/J/C/K/E
    if (c && e.altKey && 'iujc'.indexOf(k) >= 0 && k) return true;                      // Mac：⌘⌥I/U/J/C
    if (c && (k === 'u' || k === 's')) return true;                                     // 看原始碼、另存
    return false;
  };
  var stop = function (e) { e.preventDefault(); e.stopPropagation(); return false; };
  function attach(doc) {
    try {
      if (!doc || doc.__lk) return; doc.__lk = true;
      doc.addEventListener('contextmenu', stop, true);
      doc.addEventListener('keydown', function (e) { if (BAD(e)) stop(e); }, true);
      doc.addEventListener('dragstart', function (e) { var t = e.target; if (!t || !/^(input|textarea)$/i.test(t.tagName)) stop(e); }, true);
      var st = doc.createElement('style');
      st.textContent = 'img{-webkit-user-drag:none;-webkit-touch-callout:none}body{-webkit-touch-callout:none}';
      (doc.head || doc.documentElement).appendChild(st);
    } catch (e) {}
  }
  function scan() {      // 同網站的 iframe（關卡頁）也一起鎖
    var fs = document.getElementsByTagName('iframe');
    for (var i = 0; i < fs.length; i++) { try { attach(fs[i].contentDocument); } catch (e) {} }
  }
  attach(document);
  setInterval(scan, 800);
  document.addEventListener('load', scan, true);
})();
