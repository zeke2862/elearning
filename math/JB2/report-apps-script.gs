/* Google 試算表接收端（待實測）。
 * 部署：試算表 → 擴充功能 → Apps Script → 貼上 → 專案設定 → 指令碼屬性 新增 TOKEN（自己取一組長字串）
 * → 部署為網頁應用程式（執行身分：我；存取：所有人）→ 把網址貼進 game-config.js 的 report.url（或編輯器）。
 * 學生端只能 POST（寫入）；讀取一定要帶 TOKEN，token 只給老師，不要放進公開檔案。 */
var HEAD=['學號','勇者名','更新時間','總星數','金幣持有','累計賺','累計花','連續簽到','弱點(前5)','各章星數JSON','各關JSON'];
function sheet_(){var s=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('回報');if(!s){s=SpreadsheetApp.getActiveSpreadsheet().insertSheet('回報');s.appendRow(HEAD)}return s}
function doPost(e){
  try{
    var p=JSON.parse(e.postData.contents);
    if(!p.no)return ContentService.createTextOutput('no');
    var s=sheet_(),vals=s.getDataRange().getValues(),row=-1;
    for(var i=1;i<vals.length;i++){if(String(vals[i][0])===String(p.no)){row=i+1;break}}
    var r=[String(p.no).slice(0,12),String(p.hero||'').slice(0,8),p.at,p.stars,p.gold,p.earned,p.spent,p.streak,JSON.stringify(p.weak||[]),JSON.stringify(p.ch||{}),JSON.stringify(p.stages||{})];
    if(row>0)s.getRange(row,1,1,r.length).setValues([r]);else s.appendRow(r);
    return ContentService.createTextOutput('ok');
  }catch(err){return ContentService.createTextOutput('err')}
}
function doGet(e){
  var tok=PropertiesService.getScriptProperties().getProperty('TOKEN');
  if(!tok||!e.parameter||e.parameter.token!==tok)return ContentService.createTextOutput(JSON.stringify({error:'forbidden'})).setMimeType(ContentService.MimeType.JSON);
  var v=sheet_().getDataRange().getValues(),h=v.shift(),out=v.map(function(r){var o={};h.forEach(function(k,i){o[k]=r[i]});return o});
  return ContentService.createTextOutput(JSON.stringify({rows:out})).setMimeType(ContentService.MimeType.JSON);
}
