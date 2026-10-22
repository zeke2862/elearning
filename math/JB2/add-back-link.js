/* 用法（在遊戲根目錄，也就是 world-map-vol2-all.html 所在資料夾）：node add-back-link.js
 * 會在 grade7-vol2-ch1..6/world-map-vol2chN.html 與 battle-vol2.html 加上「回總地圖」按鈕。
 * 可重複執行（已加過不會再加），每個被改的檔會先備份成 .bak。 */
const fs=require('fs'),path=require('path');
const TAG='<!--jb2-back-link-->';
function patch(file,href){
  if(!fs.existsSync(file)){console.log('找不到，略過：',file);return}
  let t=fs.readFileSync(file,'utf8');
  if(t.includes(TAG)){console.log('已加過：',file);return}
  const html=TAG+'<a href="'+href+'" style="position:fixed;left:10px;bottom:10px;z-index:9999;background:#d2a24c;color:#2a1d05;font:700 15px/1 sans-serif;padding:10px 14px;border-radius:12px;text-decoration:none;box-shadow:0 2px 8px #0006">🗺️ 回總地圖</a>';
  if(!/<\/body>/i.test(t)){console.log('沒有 </body>，略過：',file);return}
  fs.copyFileSync(file,file+'.bak');
  fs.writeFileSync(file,t.replace(/<\/body>/i,html+'</body>'));
  console.log('已加入：',file);
}
for(let n=1;n<=6;n++)patch(path.join('grade7-vol2-ch'+n,'world-map-vol2ch'+n+'.html'),'../world-map-vol2-all.html');
patch('battle-vol2.html','world-map-vol2-all.html');
