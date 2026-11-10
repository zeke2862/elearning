const fs=require('fs'),path=require('path');
const M=path.join(__dirname,'../../MOCC'), OUT=path.join(__dirname,'..');
const rules={};
for(const f of fs.readdirSync(M+'/rules').filter(f=>f.endsWith('.json'))){const r=JSON.parse(fs.readFileSync(M+'/rules/'+f,'utf8'));rules[r.id]=r;}
const src=fs.readFileSync(M+'/server.js','utf8');
const m=src.match(/const ANSWER_PREVIEW_IMAGES = (\{[\s\S]*?\n\});/);
const previews=eval('('+m[1]+')');
for(const k in previews) previews[k]=previews[k].map(p=>({name:p.name,url:p.url.replace('/answer-preview/','../MOCC/public/answer-preview/')}));
const templates={};
for(const id in rules){const b=id.replace('01_','');const ext=rules[id].fileType==='xlsx'?'xlsx':'docx';
  if(fs.existsSync(M+'/templates/'+b+'_blank.'+ext)) templates[id]='../MOCC/templates/'+b+'_blank.'+ext;}
const files=fs.readdirSync(M+'/public/mocc-data').filter(f=>!f.startsWith('.')).sort((a,b)=>a.localeCompare(b,'zh-Hant'));
// 題目資料裡不需要的欄位也一併保留（評分引擎要用）
fs.writeFileSync(OUT+'/data.js','/* 由 moccbuild/gen.js 產生：題庫規則、範本與解答示意圖路徑 */\nwindow.MOCC_RULES='+JSON.stringify(rules)+';\nwindow.MOCC_PREVIEWS='+JSON.stringify(previews)+';\nwindow.MOCC_TEMPLATES='+JSON.stringify(templates)+';\nwindow.MOCC_FILES='+JSON.stringify(files)+';\n');

console.log(Object.keys(rules).length,'rules',Object.keys(previews).length,'previews',Object.keys(templates).length,'templates',files.length,'files');
