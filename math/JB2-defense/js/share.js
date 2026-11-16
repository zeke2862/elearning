/* 數學保衛戰：小螢幕等比例縮小；橫拿照 1200×640，直拿照寬 640 */
(function () {
  const fit = () => {
    const portrait = window.innerHeight > window.innerWidth;
    const z = portrait ? Math.min(1, window.innerWidth / 640) : Math.min(1, window.innerWidth / 1200, window.innerHeight / 640);
    const zz = z < 0.98 ? Number(z.toFixed(3)) : 1;
    document.documentElement.style.zoom = zz < 1 ? zz : "";
    document.documentElement.style.setProperty("--vh", `${window.innerHeight / zz / 100}px`);
    document.documentElement.style.setProperty("--vw", `${window.innerWidth / zz / 100}px`);
    document.body.classList.toggle("portrait-math", portrait);
  };
  const again = () => { fit(); if (window.G && G.refreshScreen) G.refreshScreen(); };
  window.addEventListener("resize", again);
  window.addEventListener("orientationchange", again);
  fit();
})();
