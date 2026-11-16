window.JB2=window.JB2||{stages:{}};
/* 自動產生：取自 JB2V2 各關卡檔的題目產生器 */
JB2.stages['1-1-1']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
const MODES={easy:{t:0,max:6},real:{t:15,max:9},hard:{t:10,max:12}};
const PLAN=['identify','combine','fracCombine','dist','bracket','decCombine','combine','identify','expr','exprDiff'];
const ITEMS=[['紅茶','綠茶','杯'],['原子筆','鉛筆','支'],['麵包','蛋糕','個'],['門票','套票','張']];

function fmt(n,v){ // n*v項字串，n可能為負/0/1/-1
  if(n===0)return '';
  const sign=n<0?' - ':' + ';
  const av=Math.abs(n);
  return sign+(av===1?v:av+v);
}
function firstFmt(n,v){
  if(n===0)return '';
  const sign=n<0?'-':'';
  const av=Math.abs(n);
  return sign+(av===1?v:av+v);
}
function combineExpr(X,Y){
  if(X===0&&Y===0)return '0';
  if(X===0)return firstFmt(Y,'y');
  if(Y===0)return firstFmt(X,'x');
  return firstFmt(X,'x')+fmt(Y,'y');
}
function randCoef(M){let v=R(1,M.max);return Math.random()<0.5?-v:v;}
function sumVar(terms,v){return terms.filter(t=>t.v===v).reduce((s,t)=>s+t.c,0);}
function ensure4(ans,cands){
  const s=new Set([ans]);
  for(const c of cands){const cs=String(c);if(s.size<4&&cs!==ans&&cs.trim()!=='')s.add(cs);}
  /* 誘答選項不夠時：答案不是純數字就「改動答案裡的一個數字」補齊（例如 (5, 5)→(5, 4)），不再塞無關的 -5、6 */
  if(s.size<4&&!/^-?\d+(\.\d+)?$/.test(String(ans))){
    const str=String(ans),vars=[],re=/\d+(?:\.\d+)?/g;let mm;
    while((mm=re.exec(str))!==null){for(const d of [1,-1,2,-2,3,-3]){const nv=Number(mm[0])+d;if(nv<0)continue;const dec=(mm[0].split('.')[1]||'').length;vars.push(str.slice(0,mm.index)+(dec?nv.toFixed(dec):nv)+str.slice(mm.index+mm[0].length));}}
    for(let i=vars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[vars[i],vars[j]]=[vars[j],vars[i]];}
    for(const v of vars){if(s.size>=4)break;if(!s.has(v))s.add(v);}
  }
  let g=1;
  while(s.size<4){const v=(Number(ans)||0)+(g%2===0?g/2+5:-(Math.ceil(g/2)+4));const vs=String(v);if(!s.has(vs))s.add(vs);g++;}
  return sh([...s]);
}

/* ---------- 項／係數／常數／同類項 ---------- */
function genIdentify(M){
  const p1=randCoef(M),p2=randCoef(M);
  const nY=R(1,2),hasConst=Math.random()<0.7;
  const q1=randCoef(M),q2=nY===2?randCoef(M):null;
  const k=hasConst?randCoef(M):null;
  const items=[{c:p1,v:'x'},{c:p2,v:'x'},{c:q1,v:'y'}];
  if(q2!==null)items.push({c:q2,v:'y'});
  if(k!==null)items.push({c:k,v:''});
  const order=sh(items);
  let text='';
  order.forEach((it,i)=>{
    let piece;
    if(it.v){piece=i===0?firstFmt(it.c,it.v):fmt(it.c,it.v);}
    else{piece=i===0?String(it.c):(it.c<0?` - ${-it.c}`:` + ${it.c}`);}
    text+=piece;
  });
  const subPool=['count','coef','like'];if(k!==null)subPool.push('const');
  const sub=pick(subPool);
  if(sub==='count'){
    const n=order.length;
    return {text:`代數式　${text}　中，一共有幾「項」？`,ans:String(n),
      options:ensure4(String(n),[n-1,n+1,n-2>0?n-2:n+2]),
      hint:'把式子用加、減號切開，數一數切成幾段。',explain:`${text} 共可切成 ${n} 段，所以有 ${n} 項。`};
  }
  if(sub==='const'){
    return {text:`代數式　${text}　中，「常數項」是多少？`,ans:String(k),
      options:ensure4(String(k),[p1,p2,q1,q2].filter(v=>v!==null)),
      hint:'找出那一項──它沒有 x、也沒有 y，只是一個單獨的數字。',explain:`常數項是沒有字母的那一項，要連同前面的正負號一起看，所以是 ${k}。`};
  }
  if(sub==='coef'){
    const varTerms=order.filter(it=>it.v);
    const target=pick(varTerms);
    const shown=target.v==='x'?(firstFmt(target.c,'x')||fmt(target.c,'x').trim()):(firstFmt(target.c,'y')||fmt(target.c,'y').trim());
    const showSigned=shown.startsWith('-')?shown:('+'+shown);
    return {text:`代數式　${text}　中，「${showSigned}」這一項的「係數」是多少？`,ans:String(target.c),
      options:ensure4(String(target.c),[-target.c,Math.abs(target.c),target.c*2]),
      hint:'係數就是那個字母前面、連同正負號一起看的數字。',explain:`「${showSigned}」的係數是 ${target.c}。`};
  }
  const sum=p1+p2;
  return {text:`代數式　${text}　中，把兩個「x」項合併成同類項後，係數是多少？`,ans:String(sum),
    options:ensure4(String(sum),[p1-p2,p2-p1,sum+2]),
    hint:'兩個 x 項才是同類項，可以直接把係數相加；y 項不能跟 x 項合併。',explain:`x 項的係數相加：${p1<0?'('+p1+')':p1} + ${p2<0?'('+p2+')':p2} = ${sum}，所以合併後係數是 ${sum}。`};
}

/* ---------- 整數版合併同類項（高誘答力選項） ---------- */
// 項的排列：x、y 要交錯，不能 x 全部擠在一邊、y 全部擠在一邊；項數 4～5 項
function termVars(){
  const nx=pick([2,2,3]),ny=pick([2,2,3]);
  let vs,g=0;
  do{vs=sh([...Array(nx).fill('x'),...Array(ny).fill('y')]);g++;}while(g<50&&/^x+y+$|^y+x+$/.test(vs.join('')));
  return vs;
}
function termText(terms,first,fmtc){return terms.map((tm,i)=>i===0?first(tm.c,tm.v):fmtc(tm.c,tm.v)).join('');}
function genCombine(M){
  let terms,X,Y,tries=0;
  do{
    terms=termVars().map(v=>({c:randCoef(M),v}));
    X=sumVar(terms,'x');Y=sumVar(terms,'y');tries++;
  }while(tries<300&&!(X!==0&&Y!==0&&Math.abs(X)>=2&&Math.abs(Y)>=2&&terms.filter(t=>Math.abs(t.c)===1).length<=1));
  const text='化簡：'+termText(terms,firstFmt,fmt);
  const ans=combineExpr(X,Y);
  const swap=combineExpr(Y,X); // 誘答：x、y 係數看反
  const flipIdx=R(0,terms.length-1);
  const flipped=terms.map((t,i)=>i===flipIdx?{...t,c:-t.c}:t);
  const signErr=combineExpr(sumVar(flipped,'x'),sumVar(flipped,'y')); // 誘答：漏看一項的正負號
  const dropIdx=R(0,terms.length-1);
  const dropped=terms.filter((_,i)=>i!==dropIdx);
  const dropErr=combineExpr(sumVar(dropped,'x'),sumVar(dropped,'y')); // 誘答：漏加一項
  const lst=v=>terms.filter(t=>t.v===v).map(t=>t.c<0?`(${t.c})`:`${t.c}`).join(' + ');
  return {text,ans,options:ensure4(ans,[swap,signErr,dropErr]),
    hint:'把所有 x 項加起來、所有 y 項加起來，注意每一項前面自己帶的正負號，不要漏看、也不要跟 y 項混在一起。',
    explain:`x 項：${lst('x')} = ${X}；y 項：${lst('y')} = ${Y}，所以化簡結果是 ${ans}。`};
}

/* ---------- 分數版合併同類項 ---------- */
function gcdInt(a,b){a=Math.abs(a);b=Math.abs(b);return b?gcdInt(b,a%b):a}
function mkFrac(n,d){if(d<0){n=-n;d=-d;}const g=gcdInt(n,d)||1;return {n:n/g,d:d/g};}
function fracAdd(a,b){return mkFrac(a.n*b.d+b.n*a.d,a.d*b.d);}
function fracStr(f){return f.d===1?String(f.n):`${f.n}/${f.d}`;}
function fracTerm(av,v){return av.d===1?(av.n===1?'':String(av.n))+v:(av.n===1?'':String(av.n))+v+'/'+av.d;}
function fracFirstFmt(f,v){if(f.n===0)return '';const sign=f.n<0?'-':'';return sign+fracTerm({n:Math.abs(f.n),d:f.d},v);}
function fracFmt(f,v){if(f.n===0)return '';const sign=f.n<0?' - ':' + ';return sign+fracTerm({n:Math.abs(f.n),d:f.d},v);}
function combineFracExpr(X,Y){if(X.n===0&&Y.n===0)return '0';if(X.n===0)return fracFirstFmt(Y,'y');if(Y.n===0)return fracFirstFmt(X,'x');return fracFirstFmt(X,'x')+fracFmt(Y,'y');}
function sumFracVar(terms,v){return terms.filter(t=>t.v===v).reduce((s,t)=>fracAdd(s,t.c),{n:0,d:1});}
function genFracCombine(){
  const pairs=[[2,2],[3,3],[4,4],[5,5],[6,6],[2,4],[3,6],[4,2],[6,3],[2,6],[4,8],[3,9]];
  let terms,X,Y,tries=0;
  do{
    const [d1,d2]=pick(pairs);
    terms=termVars().map(v=>{const d=Math.random()<0.5?d1:d2;let n=R(1,d*2-1);if(n%d===0)n+=1;if(Math.random()<0.5)n=-n;return {c:mkFrac(n,d),v};});
    X=sumFracVar(terms,'x');Y=sumFracVar(terms,'y');tries++;
    var ones=terms.filter(t=>Math.abs(t.c.n)===t.c.d).length;
    var okAbs=f=>f.n!==0&&Math.abs(f.n)!==f.d;
  }while(tries<300&&!(okAbs(X)&&okAbs(Y)&&ones===0));
  let text='化簡（分數係數）：'+termText(terms,fracFirstFmt,fracFmt);
  const ans=combineFracExpr(X,Y);
  const swap=combineFracExpr(Y,X);
  const flipIdx=R(0,terms.length-1);
  const flipped=terms.map((t,i)=>i===flipIdx?{...t,c:mkFrac(-t.c.n,t.c.d)}:t);
  const signErr=combineFracExpr(sumFracVar(flipped,'x'),sumFracVar(flipped,'y'));
  const dropIdx=R(0,terms.length-1);
  const dropped=terms.filter((_,i)=>i!==dropIdx);
  const dropErr=combineFracExpr(sumFracVar(dropped,'x'),sumFracVar(dropped,'y'));
  return {text,ans,options:ensure4(ans,[swap,signErr,dropErr]),
    hint:'分母不同的要先通分，分母相同時分子直接相加減。x 項跟 x 項合併、y 項跟 y 項合併。',
    explain:`x 項相加得 ${fracStr(X)}；y 項相加得 ${fracStr(Y)}，所以化簡結果是 ${ans}。`};
}
function decNum(t){const tt=Math.abs(t);const ip=Math.floor(tt/10),dp=tt%10;return ip+'.'+dp;}
function decValStr(t){return (t<0?'-':'')+decNum(t).replace(/\.0$/,'');}
function decFirstFmt(t,v){if(t===0)return '';return (t<0?'-':'')+decNum(t)+v;}
function decFmt(t,v){if(t===0)return '';return (t<0?' - ':' + ')+decNum(t)+v;}
function combineDecExpr(X,Y){if(X===0&&Y===0)return '0';if(X===0)return decFirstFmt(Y,'y');if(Y===0)return decFirstFmt(X,'x');return decFirstFmt(X,'x')+decFmt(Y,'y');}
function randDecT(){let t;do{t=R(1,30);}while(t%10===0);return Math.random()<0.5?-t:t;}
function genDecCombine(){
  let terms,X,Y,tries=0;
  do{
    terms=termVars().map(v=>({c:randDecT(),v}));
    X=sumVar(terms,'x');Y=sumVar(terms,'y');tries++;
  }while(tries<300&&!(X!==0&&Y!==0&&Math.abs(X)!==10&&Math.abs(Y)!==10));
  const text='化簡（小數係數）：'+termText(terms,decFirstFmt,decFmt);
  const ans=combineDecExpr(X,Y);
  const swap=combineDecExpr(Y,X);
  const flipIdx=R(0,terms.length-1);
  const flipped=terms.map((t,i)=>i===flipIdx?{...t,c:-t.c}:t);
  const signErr=combineDecExpr(sumVar(flipped,'x'),sumVar(flipped,'y'));
  const dropIdx=R(0,terms.length-1);
  const dropped=terms.filter((_,i)=>i!==dropIdx);
  const dropErr=combineDecExpr(sumVar(dropped,'x'),sumVar(dropped,'y'));
  return {text,ans,options:ensure4(ans,[swap,signErr,dropErr]),
    hint:'小數對齊小數點直接相加減，x 項跟 x 項合併、y 項跟 y 項合併。',
    explain:`x 項相加得 ${decValStr(X)}；y 項相加得 ${decValStr(Y)}，所以化簡結果是 ${ans}。`};
}

/* ---------- 拆括號（小括號 ( ) → 中括號 [ ] → 大括號 { }，由內而外） ---------- */
function genBracket(M){
  const k3=R(2,4);
  const op1=pick(['+','-']),op2=pick(['+','-']);
  const rng=[-5,-4,-3,-2,-1,1,2,3,4,5];
  const a=pick(rng),b=pick(rng),c=pick(rng),d=pick(rng);
  const op1s=op1==='+'?1:-1,op2s=op2==='+'?1:-1;
  const X=k3*(a+op2s*op1s*c),Y=k3*(op2s*(b+op1s*d));
  const text=`化簡：${k3}{ ${firstFmt(a,'x')} ${op2} [ ${firstFmt(b,'y')} ${op1} ( ${firstFmt(c,'x')}${fmt(d,'y')} ) ] }`; // 小括號( )在最裡面、中括號[ ]在中間、大括號{ }在最外面
  const ans=combineExpr(X,Y);
  const forgetOuter=combineExpr(a+op2s*op1s*c,op2s*(b+op1s*d)); // 誘答：忘記乘最外層的 k3
  const flipOp1=combineExpr(k3*(a+op2s*(-op1s)*c),k3*(op2s*(b+(-op1s)*d))); // 誘答：小括號前面那個符號（op1）忘記變號
  const flipOp2=combineExpr(k3*(a+(-op2s)*op1s*c),k3*((-op2s)*(b+op1s*d))); // 誘答：中括號前面那個符號（op2）忘記變號
  return {text,ans,options:ensure4(ans,[forgetOuter,flipOp1,flipOp2]),
    hint:'括號由內到外是：小括號 ( )、中括號 [ ]、大括號 { }。從最裡面的小括號開始拆，每拆一層括號，記得看清楚外面是「+」還是「－」──是「－」的話，裡面每一項都要變號，最後別忘了乘最外層的數字。',
    explain:`由內而外展開：先拆小括號 ( )，再拆中括號 [ ]，最後拆大括號 { } 並乘上 ${k3}，合併後 x 項為 ${X}、y 項為 ${Y}，答案是 ${ans}。`};
}

// 情境庫：買賣（買 x／y 個東西，求總價）、也支援不同角色與動詞，讓每次看到的故事不一樣，不是只有數字在變
const EXPR_SCENES=[
  (A,B,m,n,u)=>`買 x ${u}${A}（每${u} ${m} 元）與 y ${u}${B}（每${u} ${n} 元），總價要怎麼列式？`,
  (A,B,m,n,u)=>`園遊會擺攤賣 x ${u}${A}（每${u} ${m} 元）與 y ${u}${B}（每${u} ${n} 元），這攤的收入要怎麼列式？`,
  (A,B,m,n,u)=>`班費採購了 x ${u}${A}（每${u} ${m} 元）與 y ${u}${B}（每${u} ${n} 元），總花費要怎麼列式？`,
  (A,B,m,n,u)=>`文具店裡，x ${u}${A}（每${u} ${m} 元）加上 y ${u}${B}（每${u} ${n} 元），總共要付多少錢？請列式。`,
];
function genExpr(M){
  const [A,B,u]=pick(ITEMS);
  let m=R(1,M.max)*5,n=R(1,M.max)*5;
  while(m===n)n=R(1,M.max)*5;
  const text=pick(EXPR_SCENES)(A,B,m,n,u);
  const ans=`${m}x + ${n}y`;
  const opts=ensure4(ans,[`${n}x + ${m}y`,`${m}x - ${n}y`,`(${m}+${n})(x+y)`]);
  return {text,ans,options:opts,hint:'單價 × 數量，再把兩種東西的花費加起來。（代數裡 30x 就是 30 × x，乘號省略不寫。）',explain:`${A}共 ${m}x 元，${B}共 ${n}y 元，合起來是 ${ans} 元。`};
}
// 情境庫：比較兩人（或兩班）花費／收入的差，角色配對隨機挑選，句型也有兩種
const DIFF_ROLES=[['哥哥','弟弟'],['姊姊','妹妹'],['一班','二班'],['隊長','隊員']];
const EXPR_DIFF_SCENES=[
  (P,Q,A,B,m,n,u)=>`${P}買 x ${u}${A}（每${u} ${m} 元），${Q}買 y ${u}${B}（每${u} ${n} 元）。${P}比${Q}多花多少錢？請列式。`,
  (P,Q,A,B,m,n,u)=>`${P}訂了 x ${u}${A}（每${u} ${m} 元），${Q}訂了 y ${u}${B}（每${u} ${n} 元）。${P}比${Q}多花多少錢？請列式。`,
];
function genExprDiff(M){
  const [A,B,u]=pick(ITEMS);
  const [P,Q]=pick(DIFF_ROLES);
  let m=R(1,M.max)*5,n=R(1,M.max)*5;
  while(m===n)n=R(1,M.max)*5;
  const text=pick(EXPR_DIFF_SCENES)(P,Q,A,B,m,n,u);
  const ans=`${m}x - ${n}y`;
  const opts=ensure4(ans,[`${n}y - ${m}x`,`${m}x + ${n}y`,`${m}y - ${n}x`]);
  return {text,ans,options:opts,hint:`「多花多少」就是兩者花費相減：${P}的花費 － ${Q}的花費。`,explain:`${P}花費 ${m}x 元，${Q}花費 ${n}y 元，多花的錢是 ${m}x - ${n}y 元。`};
}
function gen(t){
  const M=MODES[mode];
  if(t==='identify')return genIdentify(M);
  if(t==='combine')return genCombine(M);
  if(t==='fracCombine')return genFracCombine();
  if(t==='decCombine')return genDecCombine();
  if(t==='dist')return genDist(M);
  if(t==='bracket')return genBracket(M);
  if(t==='exprDiff')return genExprDiff(M);
  return genExpr(M);
}
function genDist(M){
  const k1=R(2,4),k2=R(2,4),op=pick(['+','-']);
  const a=randCoef(M),b=randCoef(M),c=randCoef(M),d=randCoef(M);
  const t1x=k1*a,t1y=k1*b;
  const t2x=(op==='+'?1:-1)*k2*c,t2y=(op==='+'?1:-1)*k2*d;
  const X=t1x+t2x,Y=t1y+t2y;
  const text=`化簡：${k1}(${firstFmt(a,'x')}${fmt(b,'y')}) ${op} ${k2}(${firstFmt(c,'x')}${fmt(d,'y')})`;
  const ans=combineExpr(X,Y);
  const wrongForget=combineExpr(t1x+(op==='+'?1:-1)*c,t1y+(op==='+'?1:-1)*d); // 誘答：第二個括號忘記乘k2
  const wrongOp=combineExpr(t1x+(op==='+'?-1:1)*k2*c,t1y+(op==='+'?-1:1)*k2*d); // 誘答：加減號看反
  const wrongForget1=combineExpr(a+t2x,b+t2y); // 誘答：第一個括號忘記乘k1
  return {text,ans,options:ensure4(ans,[wrongForget,wrongOp,wrongForget1]),
    hint:'先用乘法把每個括號展開（分配律：括號裡每一項都要乘到外面的數字），再合併 x 項與 y 項。',
    explain:`第一個括號展開：x 項 ${k1}×${a<0?'('+a+')':a} = ${t1x}，y 項 ${k1}×${b<0?'('+b+')':b} = ${t1y}。第二個括號展開後（${op==='+'?'加上':'減去'}這個括號）：x 項 ${t2x}、y 項 ${t2y}。合併得 x 項 ${X}、y 項 ${Y}，答案是 ${ans}。`};
}


return {plan:['identify','combine','fracCombine','dist','bracket','decCombine','combine','identify','expr','exprDiff'],gen:function(t,m){mode=m;return gen(t);}};
})();

JB2.stages['1-1-2']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
const MODES={easy:{t:0,max:5,neg:false},real:{t:15,max:8,neg:true},hard:{t:10,max:12,neg:true}};
const PLAN=['is','solve','is','solve','isFrac','solve','is','isDec','solve','is'];

function fmt(n,v){if(n===0)return '';const sign=n<0?' - ':' + ';const av=Math.abs(n);return sign+(av===1?v:av+v);}
function firstFmt(n,v){if(n===0)return '';const sign=n<0?'-':'';const av=Math.abs(n);return sign+(av===1?v:av+v);}
function eqText(a,b,c){
  return `${firstFmt(a,'x')}${fmt(b,'y')} = ${c}`;
}
function ensure4(ans,cands){
  const s=new Set([ans]);
  for(const c of cands){const cs=String(c);if(s.size<4&&cs!==ans&&cs.trim()!=='')s.add(cs);}
  /* 誘答選項不夠時：答案不是純數字就「改動答案裡的一個數字」補齊（例如 (5, 5)→(5, 4)），不再塞無關的 -5、6 */
  if(s.size<4&&!/^-?\d+(\.\d+)?$/.test(String(ans))){
    const str=String(ans),vars=[],re=/\d+(?:\.\d+)?/g;let mm;
    while((mm=re.exec(str))!==null){for(const d of [1,-1,2,-2,3,-3]){const nv=Number(mm[0])+d;if(nv<0)continue;const dec=(mm[0].split('.')[1]||'').length;vars.push(str.slice(0,mm.index)+(dec?nv.toFixed(dec):nv)+str.slice(mm.index+mm[0].length));}}
    for(let i=vars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[vars[i],vars[j]]=[vars[j],vars[i]];}
    for(const v of vars){if(s.size>=4)break;if(!s.has(v))s.add(v);}
  }
  let g=1;
  while(s.size<4){const v=(Number(ans)||0)+(g%2===0?g/2+5:-(Math.ceil(g/2)+4));const vs=String(v);if(!s.has(vs))s.add(vs);g++;}
  return sh([...s]);
}
function genIs(M){
  const a=R(1,M.max);
  let b=R(1,M.max);if(M.neg&&Math.random()<0.5)b=-b;
  const x0=R(M.neg?-M.max:0,M.max),y0=R(M.neg?-M.max:0,M.max);
  const c=a*x0+b*y0;
  const text0=eqText(a,b,c);
  const text=`方程式 ${text0} 有下列四組數對，哪一組是它的解？`;
  const ans=`(${x0}, ${y0})`;
  const cands=[(a===b?'':`(${y0}, ${x0})`),`(${-x0}, ${y0})`,`(${x0}, ${-y0})`,`(${x0+pick([-2,-1,1,2])}, ${y0})`,`(${x0}, ${y0+pick([-2,-1,1,2])})`];
  const s=new Set([ans]);
  for(const c2 of cands){if(s.size<4&&c2!==ans&&c2!=='')s.add(c2);}
  while(s.size<4){const dx=x0+R(4,9);s.add(`(${dx}, ${y0})`);}
  const t1=a*x0,t2=b*y0;
  const steps=`代入 x=${x0}, y=${y0}：<br>`
    +`${a}×(${x0}) ${b<0?'－':'＋'} ${Math.abs(b)}×(${y0})<br>`
    +`= ${t1} ${t2<0?'－':'＋'} ${Math.abs(t2)}<br>`
    +`= ${c}　✅ 等式成立，所以是解。`;
  return {text,ans,options:sh([...s]),hint:`把 x、y 代入 ${text0} 左邊，算出來要等於 ${c}。`,explain:steps+`<br>常見錯誤是把 x、y 的值弄反，或漏看正負號。`};
}
function gcdInt(a,b){a=Math.abs(a);b=Math.abs(b);return b?gcdInt(b,a%b):a}
function mkFrac(n,d){if(d<0){n=-n;d=-d;}const g=gcdInt(n,d)||1;return {n:n/g,d:d/g};}
function fracStr(f){return f.d===1?String(f.n):`${f.n}/${f.d}`;}
function fracAdd(a,b){return mkFrac(a.n*b.d+b.n*a.d,a.d*b.d);}
function fracMulInt(f,k){return mkFrac(f.n*k,f.d);}
function genIsFrac(M){
  const a=R(1,4),b=pick([1,2,3,4]);
  const d=pick([2,3,4]);
  const mkT=()=>mkFrac(R(1,d-1)*pick([1,-1]),d);
  const x0=mkT(),y0=mkT();
  const c=fracAdd(fracMulInt(x0,a),fracMulInt(y0,b));
  const text0=`${a===1?'x':a+'x'} + ${b===1?'y':b+'y'} = ${fracStr(c)}`;
  const text=`方程式 ${text0}（分數解）有下列四組數對，哪一組是它的解？`;
  const ans=`(${fracStr(x0)}, ${fracStr(y0)})`;
  const cands=[(a===b?'':`(${fracStr(y0)}, ${fracStr(x0)})`),`(${fracStr(mkFrac(-x0.n,x0.d))}, ${fracStr(y0)})`,`(${fracStr(x0)}, ${fracStr(mkFrac(-y0.n,y0.d))})`,`(${fracStr(mkFrac(x0.n+1,x0.d))}, ${fracStr(y0)})`,`(${fracStr(x0)}, ${fracStr(mkFrac(y0.n+1,y0.d))})`];
  const t1=fracMulInt(x0,a),t2=fracMulInt(y0,b);
  const steps=`代入 x=${fracStr(x0)}, y=${fracStr(y0)}：<br>`
    +`${a}×(${fracStr(x0)}) + ${b}×(${fracStr(y0)})<br>`
    +`= ${fracStr(t1)} + ${fracStr(t2)}<br>`
    +`= ${fracStr(c)}　✅ 等式成立，所以是解。`;
  return {text,ans,options:ensure4(ans,cands),hint:`把 x、y 分別代入方程式左邊，通分後算出來要等於 ${fracStr(c)}。`,explain:steps};
}
function genIsDec(M){
  const a=R(1,4),b=pick([1,2,3,4]);
  const mkT=()=>{let t;do{t=R(1,20);}while(t%10===0);return (Math.random()<0.5?-t:t);};
  const x0t=mkT(),y0t=mkT();
  const decStr=t=>{const neg=t<0;const tt=Math.abs(t);const ip=Math.floor(tt/10),dp=tt%10;return (neg?'-':'')+ip+'.'+dp;};
  const realC=(a*x0t+b*y0t)/10;
  const text0=`${a===1?'x':a+'x'} + ${b===1?'y':b+'y'} = ${realC.toFixed(1)}`;
  const text=`方程式 ${text0}（小數解）有下列四組數對，哪一組是它的解？`;
  const ans=`(${decStr(x0t)}, ${decStr(y0t)})`;
  const cands=[(a===b?'':`(${decStr(y0t)}, ${decStr(x0t)})`),`(${decStr(-x0t)}, ${decStr(y0t)})`,`(${decStr(x0t)}, ${decStr(-y0t)})`,`(${decStr(x0t+pick([-10,10]))}, ${decStr(y0t)})`,`(${decStr(x0t)}, ${decStr(y0t+pick([-10,10]))})`];
  const dec1=t=>Math.abs(t/10).toFixed(1);
  const t1v=a*x0t,t2v=b*y0t;
  const steps=`代入 x=${decStr(x0t)}, y=${decStr(y0t)}：<br>`
    +`${a}×(${decStr(x0t)}) + ${b}×(${decStr(y0t)})<br>`
    +`= ${t1v<0?'－ ':''}${dec1(t1v)} ${t2v<0?'－':'＋'} ${dec1(t2v)}<br>`
    +`= ${realC.toFixed(1)}　✅ 等式成立，所以是解。`;
  return {text,ans,options:ensure4(ans,cands),hint:`把 x、y 分別代入方程式左邊算算看，結果要等於 ${realC.toFixed(1)}。`,explain:steps};
}
function genSolve(M){
  const a=R(1,M.max);
  let b=R(1,M.max);if(M.neg&&Math.random()<0.5)b=-b;
  const x0=R(M.neg?-M.max:0,M.max),y0=R(M.neg?-M.max:0,M.max);
  const c=a*x0+b*y0;
  const text0=eqText(a,b,c);
  const askX=Math.random()<0.5;
  const text=`已知 ${text0}，且 ${askX?`y = ${y0}`:`x = ${x0}`}，求 ${askX?'x':'y'} 的值。`;
  const correct=askX?x0:y0;
  const known=askX?y0:x0;
  const ans=String(correct);
  const forgetDivide=askX?c-b*y0:c-a*x0; // 誘答：忘記除以係數
  const cands=[String(known),String(forgetDivide),String(correct+pick([-3,-2,-1,1,2,3])),String(-correct)];
  const hint=askX?`把 y=${y0} 代入後，${firstFmt(a,'x')} = ${c} - (${fmt(b,'y').trim()}代入的值)，再用除法求 x。`:`把 x=${x0} 代入後，剩下含 y 的一元一次方程式，用減法、除法求 y。`;
  let steps;
  if(askX){
    const bY=b*y0,rhs=c-bY;
    steps=`已知 y=${y0}，代入 ${text0}：<br>`
      +`${firstFmt(a,'x')} ${b<0?'－':'＋'} ${Math.abs(b)}×(${y0}) = ${c}<br>`
      +`${firstFmt(a,'x')} = ${c} ${bY>=0?'－':'＋'} ${Math.abs(bY)}<br>`
      +`${firstFmt(a,'x')} = ${rhs}<br>`
      +`x = ${rhs} ÷ ${a<0?'('+a+')':a} = ${x0}`;
  }else{
    const aX=a*x0,rhs=c-aX;
    const byLabel=(b<0?'-':'')+Math.abs(b)+'y';
    steps=`已知 x=${x0}，代入 ${text0}：<br>`
      +`${a}×(${x0}) ${b<0?'－':'＋'} ${Math.abs(b)}y = ${c}<br>`
      +`${byLabel} = ${c} ${aX>=0?'－':'＋'} ${Math.abs(aX)}<br>`
      +`${byLabel} = ${rhs}<br>`
      +`y = ${rhs} ÷ ${b<0?'('+b+')':b} = ${y0}`;
  }
  return {text,ans,options:ensure4(ans,cands),hint,explain:steps+`<br>別忘了最後要除以未知數的係數，不是只有相減而已。`};
}
function gen(t){
  const M=MODES[mode];
  if(t==='solve')return genSolve(M);
  if(t==='isFrac')return genIsFrac(M);
  if(t==='isDec')return genIsDec(M);
  return genIs(M);
}


return {plan:['is','solve','is','solve','isFrac','solve','is','isDec','solve','is'],gen:function(t,m){mode=m;return gen(t);}};
})();

JB2.stages['1-1-3']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
const MODES={easy:{t:0,nmax:3},real:{t:20,nmax:4},hard:{t:14,nmax:4}};
const PLAN=['countsol','find','countsol','find','countsol','find','countsol','find','countsol','find'];
function gcdInt(a,b){return b?gcdInt(b,a%b):a}
const PAIRS=[[2,3],[2,5],[3,4],[3,5],[2,7],[4,5],[3,7],[5,6]];
function ensure4(ans,cands){
  const s=new Set([ans]);
  for(const c of cands){const cs=String(c);if(s.size<4&&cs!==ans&&cs.trim()!=='')s.add(cs);}
  /* 誘答選項不夠時：答案不是純數字就「改動答案裡的一個數字」補齊（例如 (5, 5)→(5, 4)），不再塞無關的 -5、6 */
  if(s.size<4&&!/^-?\d+(\.\d+)?$/.test(String(ans))){
    const str=String(ans),vars=[],re=/\d+(?:\.\d+)?/g;let mm;
    while((mm=re.exec(str))!==null){for(const d of [1,-1,2,-2,3,-3]){const nv=Number(mm[0])+d;if(nv<0)continue;const dec=(mm[0].split('.')[1]||'').length;vars.push(str.slice(0,mm.index)+(dec?nv.toFixed(dec):nv)+str.slice(mm.index+mm[0].length));}}
    for(let i=vars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[vars[i],vars[j]]=[vars[j],vars[i]];}
    for(const v of vars){if(s.size>=4)break;if(!s.has(v))s.add(v);}
  }
  let g=1;
  while(s.size<4){const v=(Number(ans)||0)+(g%2===0?g/2+5:-(Math.ceil(g/2)+4));const vs=String(v);if(!s.has(vs))s.add(vs);g++;}
  return sh([...s]);
}

// 情境庫：兩種面額／單價找非負整數解，涵蓋郵票、硬幣、票券等不同故事
const COUNTSOL_SCENES=[
  (a,b)=>`兩種郵票，面額分別是 ${a} 元與 ${b} 元。`,
  (a,b)=>`撲滿裡只有 ${a} 元與 ${b} 元兩種硬幣。`,
  (a,b)=>`園遊會有兩種代幣券，面額分別是 ${a} 元與 ${b} 元。`,
];
function genCountsol(M){
  let [a,b]=pick(PAIRS);
  if(Math.random()<0.5)[a,b]=[b,a];
  const N=R(2,M.nmax);
  const r=R(0,b-1);
  const X0=(N-1)*b+r;
  const c=a*X0;
  const scene=pick(COUNTSOL_SCENES)(a,b);
  const text=`${scene}若用了 x 個 ${a} 元的、y 個 ${b} 元的，總金額恰好是 ${c} 元（即 ${a}x + ${b}y = ${c}），且 x、y 都是非負整數，請問共有幾種組合方式？`;
  const ans=String(N);
  const opts=ensure4(ans,[N-1,N+1,N+2,N-2].filter(v=>v>=1));
  let list='';
  for(let k=0;k<N;k++){list+=`(x=${X0-b*k}, y=${a*k})　`;}
  return {text,ans,options:opts,hint:`x 每減少 ${b}，y 就增加 ${a}，從 x=${X0}, y=0 開始一直列到 x 變成負數為止。`,explain:`所有非負整數解：${list}共 ${N} 組。`};
}
function genFind(M){
  let [a,b]=pick(PAIRS);
  if(Math.random()<0.5)[a,b]=[b,a];
  const askX=Math.random()<0.5;
  const x0=R(1,M.nmax+2),y0=R(1,M.nmax+1);
  const c=a*x0+b*y0;
  const known=askX?y0:x0,correct=askX?x0:y0;
  const knownName=askX?'y':'x',findName=askX?'x':'y';
  const coefKnown=askX?b:a,coefFind=askX?a:b;
  const SCENES=[
    ()=>`小發文具社賣兩種筆記本，甲款每本 ${a} 元、乙款每本 ${b} 元。小美買了 ${knownName}=${known} 本${askX?'乙':'甲'}款，兩款合計花費 ${c} 元（即 ${a}x + ${b}y = ${c}），求她買了幾本${askX?'甲':'乙'}款（${findName} 的值）？`,
    ()=>`飲料店賣兩種杯型，大杯 ${a} 元、小杯 ${b} 元。這一天賣出 ${knownName}=${known} 杯${askX?'小':'大'}杯，兩種合計收入 ${c} 元（即 ${a}x + ${b}y = ${c}），求賣出了幾杯${askX?'大':'小'}杯（${findName} 的值）？`,
    ()=>`書店裡漫畫每本 ${a} 元、小說每本 ${b} 元。小華買了 ${knownName}=${known} 本${askX?'小說':'漫畫'}，兩種合計花費 ${c} 元（即 ${a}x + ${b}y = ${c}），求他買了幾本${askX?'漫畫':'小說'}（${findName} 的值）？`,
  ];
  const text=pick(SCENES)();
  const ans=String(correct);
  const forgetDivide=c-coefKnown*known; // 誘答：忘記除以係數
  const cands=[String(known),String(forgetDivide),String(correct+pick([-2,-1,1,2])),String(correct+pick([-3,3]))];
  return {text,ans,options:ensure4(ans,cands),hint:`先算 ${coefKnown}×${known}，用總花費 ${c} 減掉它，剩下的錢再除以 ${coefFind} 元就是${findName}的數量。`,
    explain:`${c} － ${coefKnown}×${known} = ${forgetDivide}，再 ÷ ${coefFind} = ${correct}，所以${findName}=${correct}。（常見錯誤：算到相減就停了，忘記還要除以係數）`};
}
function gen(t){
  const M=MODES[mode];
  return t==='find'?genFind(M):genCountsol(M);
}


return {plan:['countsol','find','countsol','find','countsol','find','countsol','find','countsol','find'],gen:function(t,m){mode=m;return gen(t);}};
})();

JB2.stages['1-2-1']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
const MODES={easy:{t:0,max:5,neg:false},real:{t:18,max:8,neg:true},hard:{t:12,max:9,neg:true}};
const PLAN=['both','both','both','both','both','both','both','both','both','both'];

function fmt(n,v){if(n===0)return '';const sign=n<0?' - ':' + ';const av=Math.abs(n);return sign+(av===1?v:av+v);}
function firstFmt(n,v){if(n===0)return '';const sign=n<0?'-':'';const av=Math.abs(n);return sign+(av===1?v:av+v);}
function eqText(a,b,c){return `${firstFmt(a,'x')}${fmt(b,'y')} = ${c}`;}
function randCoef(M){let v=R(1,M.max);return M.neg&&Math.random()<0.5?-v:v;}

function gen(t){
  const M=MODES[mode];
  let a1,b1,a2,b2,x0,y0,det,p2,p3,p4,tries=0;
  do{
    tries++;
    a1=randCoef(M);b1=randCoef(M);a2=randCoef(M);b2=randCoef(M);
    det=a1*b2-a2*b1;
    x0=R(M.neg?-M.max:0,M.max);y0=R(M.neg?-M.max:0,M.max);
    p2={x:x0+b1,y:y0-a1};        // 只滿足①
    p3={x:x0+b2,y:y0-a2};        // 只滿足②
    p4={x:x0+1,y:y0+1};          // 通常兩個都不滿足
  }while(tries<25&&(det===0
    ||(p2.x===x0&&p2.y===y0)||(p3.x===x0&&p3.y===y0)
    ||(p2.x===p3.x&&p2.y===p3.y)
    ||(p4.x*a1+p4.y*b1===a1*x0+b1*y0)||(p4.x*a2+p4.y*b2===a2*x0+b2*y0)
    ||(p4.x===x0&&p4.y===y0)||(p4.x===p2.x&&p4.y===p2.y)||(p4.x===p3.x&&p4.y===p3.y)));
  const c1=a1*x0+b1*y0,c2=a2*x0+b2*y0;
  const eq1=eqText(a1,b1,c1),eq2=eqText(a2,b2,c2);
  const text=`①${eq1}　②${eq2}　下列哪一組數對「同時」滿足①和②？`;
  const ans=`(${x0}, ${y0})`;
  const opts=sh([ans,`(${p2.x}, ${p2.y})`,`(${p3.x}, ${p3.y})`,`(${p4.x}, ${p4.y})`]);
  const t1a=a1*x0,t1b=b1*y0,t2a=a2*x0,t2b=b2*y0;
  const line1=`①：${a1}×(${x0}) ${b1<0?'－':'＋'} ${Math.abs(b1)}×(${y0}) = ${t1a} ${t1b<0?'－':'＋'} ${Math.abs(t1b)} = ${c1}　✅`;
  const line2=`②：${a2}×(${x0}) ${b2<0?'－':'＋'} ${Math.abs(b2)}×(${y0}) = ${t2a} ${t2b<0?'－':'＋'} ${Math.abs(t2b)} = ${c2}　✅`;
  const explain=`代入 x=${x0}, y=${y0}：<br>${line1}<br>${line2}<br>兩式都成立，所以是聯立方程式的解；其他選項至少有一式不成立。`;
  return {text,ans,options:opts,hint:'把每一組數對分別代入①和②，兩個都要成立才行。',explain};
}


return {plan:['both','both','both','both','both','both','both','both','both','both'],gen:function(t,m){mode=m;return gen(t);}};
})();

JB2.stages['1-2-2']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
const MODES={easy:{t:0,max:5,neg:false},real:{t:20,max:7,neg:true},hard:{t:14,max:8,neg:true}};
const PLAN=['sub','sub','sub','sub','sub','sub','sub','sub','sub','sub'];

function kx(k,v){return k===1?v:k===-1?'-'+v:k+v}
function pm(m){return m===0?'':(m>0?` + ${m}`:` - ${-m}`)}
function axby(a,b){
  const ax=a===1?'x':a===-1?'-x':(a+'x');
  const by=b===1?' + y':b===-1?' - y':(b>0?` + ${b}y`:` - ${-b}y`);
  return ax+by;
}
function ensure4(ans,cands){
  const s=new Set([ans]);
  for(const c of cands){const cs=String(c);if(s.size<4&&cs!==ans&&cs.trim()!=='')s.add(cs);}
  /* 誘答選項不夠時：答案不是純數字就「改動答案裡的一個數字」補齊（例如 (5, 5)→(5, 4)），不再塞無關的 -5、6 */
  if(s.size<4&&!/^-?\d+(\.\d+)?$/.test(String(ans))){
    const str=String(ans),vars=[],re=/\d+(?:\.\d+)?/g;let mm;
    while((mm=re.exec(str))!==null){for(const d of [1,-1,2,-2,3,-3]){const nv=Number(mm[0])+d;if(nv<0)continue;const dec=(mm[0].split('.')[1]||'').length;vars.push(str.slice(0,mm.index)+(dec?nv.toFixed(dec):nv)+str.slice(mm.index+mm[0].length));}}
    for(let i=vars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[vars[i],vars[j]]=[vars[j],vars[i]];}
    for(const v of vars){if(s.size>=4)break;if(!s.has(v))s.add(v);}
  }
  let g=1;
  while(s.size<4){const v=(Number(ans)||0)+(g%2===0?g/2+5:-(Math.ceil(g/2)+4));const vs=String(v);if(!s.has(vs))s.add(vs);g++;}
  return sh([...s]);
}
function gen(t){
  const M=MODES[mode];
  const subY=Math.random()<0.5; // true: ①式為 y=kx+m（代入消去y）；false: ①式為 x=ky+m（代入消去x）
  const k=pick(M.neg?[-3,-2,-1,1,2,3]:[1,2,3]);
  const free=R(M.neg?-M.max:0,M.max); // 自由變數的值（subY 時是 x0，否則是 y0）
  const m=R(-M.max,M.max);
  const dep=k*free+m; // subY 時是 y0，否則是 x0
  const x0=subY?free:dep, y0=subY?dep:free;
  let a,b;
  do{a=R(1,M.max);b=pick(M.neg?[-3,-2,-1,1,2,3]:[1,2,3]);}while(subY?(a+b*k===0):(a*k+b===0));
  const d=a*x0+b*y0;
  const eq1=subY?`y = ${kx(k,'x')}${pm(m)}`:`x = ${kx(k,'y')}${pm(m)}`;
  const eq2=`${axby(a,b)} = ${d}`;
  const askX=Math.random()<0.5;
  const text=`①${eq1}　②${eq2}　用代入消去法解聯立方程式，求出 ${askX?'x':'y'} 的值。`;
  const correct=askX?x0:y0;
  const other=askX?y0:x0;
  const ans=String(correct);
  const den=subY?(a+k):(k+b);
  const forget=den!==0?Math.round((d-m)/den):correct+3; // 誘答：代入時忘記把括號乘上外面的係數
  const cands=[String(other),String(forget),String(correct+pick([-2,-1,1,2])),String(-correct)];
  return {text,ans,options:ensure4(ans,cands),hint:`把①式代入②式，消去 ${subY?'y':'x'}，先解出剩下的那個未知數；代入時記得把整個式子用括號框起來再乘開，別漏乘外面的係數。`,explain:`代入消去後解得 x = ${x0}, y = ${y0}。`};
}


return {plan:['sub','sub','sub','sub','sub','sub','sub','sub','sub','sub'],gen:function(t,m){mode=m;return gen(t);}};
})();

JB2.stages['1-2-3']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
const MODES={easy:{t:0,max:5,neg:false},real:{t:20,max:7,neg:true},hard:{t:14,max:8,neg:true}};
const PLAN=['elim','elim','elim','elim','elimMix','elimMix','elimMix','elimMix','elimMix','elimMix'];

function axby(a,b){
  const ax=a===1?'x':a===-1?'-x':(a+'x');
  const by=b===1?' + y':b===-1?' - y':(b>0?` + ${b}y`:` - ${-b}y`);
  return ax+by;
}
function ensure4(ans,cands){
  const s=new Set([ans]);
  for(const c of cands){const cs=String(c);if(s.size<4&&cs!==ans&&cs.trim()!=='')s.add(cs);}
  /* 誘答選項不夠時：答案不是純數字就「改動答案裡的一個數字」補齊（例如 (5, 5)→(5, 4)），不再塞無關的 -5、6 */
  if(s.size<4&&!/^-?\d+(\.\d+)?$/.test(String(ans))){
    const str=String(ans),vars=[],re=/\d+(?:\.\d+)?/g;let mm;
    while((mm=re.exec(str))!==null){for(const d of [1,-1,2,-2,3,-3]){const nv=Number(mm[0])+d;if(nv<0)continue;const dec=(mm[0].split('.')[1]||'').length;vars.push(str.slice(0,mm.index)+(dec?nv.toFixed(dec):nv)+str.slice(mm.index+mm[0].length));}}
    for(let i=vars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[vars[i],vars[j]]=[vars[j],vars[i]];}
    for(const v of vars){if(s.size>=4)break;if(!s.has(v))s.add(v);}
  }
  let g=1;
  while(s.size<4){const v=(Number(ans)||0)+(g%2===0?g/2+5:-(Math.ceil(g/2)+4));const vs=String(v);if(!s.has(vs))s.add(vs);g++;}
  return sh([...s]);
}
function gcdInt(a,b){a=Math.abs(a);b=Math.abs(b);return b?gcdInt(b,a%b):a}
function mkFrac(n,d){if(d<0){n=-n;d=-d;}const g=gcdInt(n,d)||1;return {n:n/g,d:d/g};}
function fracStr(f){return f.d===1?String(f.n):`${f.n}/${f.d}`;}
function fracAdd(a,b){return mkFrac(a.n*b.d+b.n*a.d,a.d*b.d);}
function fracMulInt(f,k){return mkFrac(f.n*k,f.d);}
function fracTerm(av,v){return av.d===1?(av.n===1?'':String(av.n))+v:(av.n===1?'':String(av.n))+v+'/'+av.d;}
function fracFirstFmt(f,v){if(f.n===0)return '';const sign=f.n<0?'-':'';return sign+fracTerm({n:Math.abs(f.n),d:f.d},v);}
function fracFmt(f,v){if(f.n===0)return '';const sign=f.n<0?' - ':' + ';return sign+fracTerm({n:Math.abs(f.n),d:f.d},v);}
function decNum(t){const tt=Math.abs(t);const ip=Math.floor(tt/10),dp=tt%10;return ip+'.'+dp;}
function decValStr(t){return (t<0?'-':'')+decNum(t);}
function decFirstFmt(t,v){if(t===0)return '';return (t<0?'-':'')+decNum(t)+v;}
function decFmt(t,v){if(t===0)return '';return (t<0?' - ':' + ')+decNum(t)+v;}

function genElim(M){
  const x0=R(M.neg?-M.max:0,M.max),y0=R(M.neg?-M.max:0,M.max);
  let a1,b1,a2,b2,same,opp;
  if(mode==='hard'){
    let det;
    do{
      a1=R(1,M.max);a2=R(1,M.max);
      b1=pick([-3,-2,-1,1,2,3]);b2=pick([-3,-2,-1,1,2,3]);
      det=a1*b2-a2*b1;
    }while(det===0);
    same=false;opp=false;
  }else{
    const b=R(1,M.max);
    let x1,x2;do{x1=R(1,M.max);x2=R(1,M.max);}while(x1===x2);
    a1=x1;a2=x2;
    opp=Math.random()<0.5;
    b1=b;b2=opp?-b:b;
    same=true;
  }
  const c1=a1*x0+b1*y0,c2=a2*x0+b2*y0;
  const eq1=`${axby(a1,b1)} = ${c1}`,eq2=`${axby(a2,b2)} = ${c2}`;
  const askX=Math.random()<0.5;
  const text=`①${eq1}　②${eq2}　用加減消去法解聯立方程式，求出 ${askX?'x':'y'} 的值。`;
  const correct=askX?x0:y0,other=askX?y0:x0;
  const ans=String(correct);
  const cands=[String(other),String(correct+pick([-2,-1,1,2])),String(-correct),String(correct+pick([-3,3]))];
  const hint=same?(opp?`①、②的 y 係數一正一負，兩式直接相加就能消去 y。`:`①、②的 y 係數都是 ${b1}，兩式直接相減就能消去 y。`)
    :'先把①、②其中一式乘上適當倍數，讓其中一個未知數的係數相等（或相反），再相加或相減消去它。';
  const coefX=opp?a1+a2:a1-a2,rhs=opp?c1+c2:c1-c2;
  const aY=c1-a1*x0; // 代回①求 y 用的中間值
  const explain=same?
    (`①${opp?'＋':'－'}②消去 y：<br>`
    +`(${a1}${opp?'＋':'－'}${a2})x = ${c1} ${opp?'＋':'－'} (${c2})<br>`
    +`${coefX}x = ${rhs}<br>`
    +`x = ${rhs} ÷ ${coefX} = ${x0}<br>`
    +`代回①：${b1}y = ${c1} － ${a1}×(${x0}) = ${aY}<br>`
    +`y = ${aY} ÷ ${b1} = ${y0}`)
    :(()=>{
      const t1a=a1*x0,t1b=b1*y0,t2a=a2*x0,t2b=b2*y0;
      return `先把①或②乘上適當倍數，讓 x（或 y）的係數對齊，相加或相減消去它，解得 x = ${x0}, y = ${y0}，代回驗算：<br>`
        +`①：${a1}×(${x0}) ${b1<0?'－':'＋'} ${Math.abs(b1)}×(${y0}) = ${t1a} ${t1b<0?'－':'＋'} ${Math.abs(t1b)} = ${c1}　✅<br>`
        +`②：${a2}×(${x0}) ${b2<0?'－':'＋'} ${Math.abs(b2)}×(${y0}) = ${t2a} ${t2b<0?'－':'＋'} ${Math.abs(t2b)} = ${c2}　✅`;
    })();
  return {text,ans,options:ensure4(ans,cands),hint,explain};
}
function genElimMix(M){
  const x0=R(M.neg?-M.max:0,M.max),y0=R(M.neg?-M.max:0,M.max);
  const a1=R(1,M.max),b1=pick(M.neg?[-3,-2,-1,1,2,3]:[1,2,3]);
  const c1=a1*x0+b1*y0;
  const eq1=`${axby(a1,b1)} = ${c1}`;
  const numType=pick(['int','frac','dec']);
  let eq2,hint,explain;
  if(numType==='int'){
    let a2,b2;
    do{a2=R(1,M.max);b2=pick(M.neg?[-3,-2,-1,1,2,3]:[1,2,3]);}while((a2===a1&&b2===b1)||a1*b2===a2*b1);
    const c2=a2*x0+b2*y0;
    eq2=`${axby(a2,b2)} = ${c2}`;
    hint='先把①、②其中一式乘上適當倍數，讓其中一個未知數的係數相等（或相反），再相加或相減消去它。';
    const t1a=a1*x0,t1b=b1*y0,t2a=a2*x0,t2b=b2*y0;
    explain=`解聯立方程式可得 x = ${x0}, y = ${y0}，代回驗算：<br>`
      +`①：${a1}×(${x0}) ${b1<0?'－':'＋'} ${Math.abs(b1)}×(${y0}) = ${t1a} ${t1b<0?'－':'＋'} ${Math.abs(t1b)} = ${c1}　✅<br>`
      +`②：${a2}×(${x0}) ${b2<0?'－':'＋'} ${Math.abs(b2)}×(${y0}) = ${t2a} ${t2b<0?'－':'＋'} ${Math.abs(t2b)} = ${c2}　✅`;
  }else if(numType==='frac'){
    const d=pick([2,3,4]);
    let p,r;
    do{p=R(1,d*2);if(Math.random()<0.5)p=-p;r=R(1,d*2);if(Math.random()<0.5)r=-r;}while(a1*r===p*b1);
    const pf=mkFrac(p,d),rf=mkFrac(r,d);
    const c2=fracAdd(fracMulInt(pf,x0),fracMulInt(rf,y0));
    eq2=`${fracFirstFmt(pf,'x')}${fracFmt(rf,'y')} = ${fracStr(c2)}`;
    hint='②式有分數係數，先把②式兩邊同乘以分母的公倍數，變成整數係數，再用加減消去法解。';
    const t1a=a1*x0,t1b=b1*y0,t2a=fracMulInt(pf,x0),t2b=fracMulInt(rf,y0);
    explain=`②式先通分、乘開變成整數係數的方程式，再跟①式消去，解得 x = ${x0}, y = ${y0}，代回驗算：<br>`
      +`①：${a1}×(${x0}) ${b1<0?'－':'＋'} ${Math.abs(b1)}×(${y0}) = ${t1a} ${t1b<0?'－':'＋'} ${Math.abs(t1b)} = ${c1}　✅<br>`
      +`②：${fracStr(pf)}×(${x0}) ${rf.n<0?'－':'＋'} ${fracStr(mkFrac(Math.abs(rf.n),rf.d))}×(${y0}) = ${fracStr(t2a)} ${t2b.n<0?'－':'＋'} ${fracStr(mkFrac(Math.abs(t2b.n),t2b.d))} = ${fracStr(c2)}　✅`;
  }else{
    const mkT=()=>{let t;do{t=R(1,20);}while(t%10===0);return Math.random()<0.5?-t:t;};
    let pt,rt;
    do{pt=mkT();rt=mkT();}while(a1*rt===pt*b1);
    const c2t=pt*x0+rt*y0;
    eq2=`${decFirstFmt(pt,'x')}${decFmt(rt,'y')} = ${decValStr(c2t)}`;
    hint='②式有小數係數，先把②式兩邊同乘以 10（或適當的 10 的倍數），變成整數係數，再用加減消去法解。';
    const dec1=t=>(t/10).toFixed(1);
    const t1a=a1*x0,t1b=b1*y0,t2a=pt*x0,t2b=rt*y0;
    explain=`②式先乘 10 變成整數係數的方程式，再跟①式消去，解得 x = ${x0}, y = ${y0}，代回驗算：<br>`
      +`①：${a1}×(${x0}) ${b1<0?'－':'＋'} ${Math.abs(b1)}×(${y0}) = ${t1a} ${t1b<0?'－':'＋'} ${Math.abs(t1b)} = ${c1}　✅<br>`
      +`②：${decValStr(pt)}×(${x0}) ${rt<0?'－':'＋'} ${decNum(rt)}×(${y0}) = ${dec1(t2a)} ${t2b<0?'－':'＋'} ${dec1(Math.abs(t2b))} = ${decValStr(c2t)}　✅`;
  }
  const askX=Math.random()<0.5;
  const text=`①${eq1}　②${eq2}　解聯立方程式，求出 ${askX?'x':'y'} 的值。`;
  const correct=askX?x0:y0,other=askX?y0:x0;
  const ans=String(correct);
  const cands=[String(other),String(correct+pick([-2,-1,1,2])),String(-correct),String(correct+pick([-3,3]))];
  return {text,ans,options:ensure4(ans,cands),hint,explain};
}
function gen(t){
  const M=MODES[mode];
  return t==='elimMix'?genElimMix(M):genElim(M);
}


return {plan:['elim','elim','elim','elim','elimMix','elimMix','elimMix','elimMix','elimMix','elimMix'],gen:function(t,m){mode=m;return gen(t);}};
})();

JB2.stages['1-3-1']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
const MODES={easy:{t:0,max:6},real:{t:25,max:9},hard:{t:18,max:12}};
const PLAN=['sumdiff','price','sumdiff','price','sumdiff','price','sumdiff','price','sumdiff','price'];

/* ---------- 結構一：和差問題（兩個量的「和」與「差」都給你，設 x、y 用加減消去法）---------- */
// 每個情境給 na（x 代表誰／什麼）、nb（y 代表誰／什麼）、unit（單位）跟一句題目敘述，
// 這樣同樣是「和差題」，玩家每次看到的故事、單位都不一樣，不是只有數字在變。
const SUMDIFF=[
  (S,D,askA)=>({na:'姊姊',nb:'妹妹',unit:'歲',
    text:`姊姊和妹妹的年齡和是 ${S} 歲，姊姊比妹妹大 ${D} 歲。求${askA?'姊姊':'妹妹'}幾歲？`}),
  (S,D,askA)=>({na:'哥哥',nb:'弟弟',unit:'元',
    text:`哥哥和弟弟這個月的零用錢合計 ${S} 元，哥哥比弟弟多 ${D} 元。求${askA?'哥哥':'弟弟'}這個月領了多少零用錢？`}),
  (S,D,askA)=>({na:'一班',nb:'二班',unit:'人',
    text:`園遊會擺攤，一班和二班參加擺攤的人數共 ${S} 人，一班比二班多 ${D} 人。求${askA?'一班':'二班'}有幾人參加擺攤？`}),
  (S,D,askA)=>({na:'男生',nb:'女生',unit:'人',
    text:`班際籃球賽報名表上，男生比女生多報名 ${D} 人，男生、女生合計報名了 ${S} 人。求報名的${askA?'男生':'女生'}有幾人？`}),
  (S,D,askA)=>({na:'第一天',nb:'第二天',unit:'人',
    text:`校外教學分兩天出遊，兩天參加的總人數是 ${S} 人，第一天比第二天多 ${D} 人。求${askA?'第一天':'第二天'}參加了幾人？`}),
];
function genSumdiff(M){
  const y0=R(5,M.max*2+4),D=R(1,M.max);
  const x0=y0+D,S=x0+y0;
  const askA=Math.random()<0.5;
  const sc=pick(SUMDIFF)(S,D,askA);
  const correct=askA?x0:y0,other=askA?y0:x0;
  return mkResult(sc.text,correct,other,S,
    `設${sc.na} x（${sc.unit}）、${sc.nb} y（${sc.unit}），列出①x+y=${S}　②x－y=${D}，兩式相加可消去 y，直接求出 x。`,
    `①＋②消去 y：2x = ${S+D}，解得 x = ${x0}；代回①得 y = ${y0}。`);
}

/* ---------- 結構二：總量＋總價問題（兩種東西各買多少、單價多少，給總數量與總花費）---------- */
// 每個情境給 n1／n2（兩種東西的名字）、unit（單位）、scene（場景），以及怎麼問「買了幾個」的說法，
// 涵蓋買東西、餐盤（自助餐）計價、活動人數計費等不同故事，數學架構相同但敘述方式不一樣。
const PRICE=[
  (p1,p2,N,T,askX,unit)=>({n1:'大人票',n2:'小孩票',
    text:`園遊會門票：大人票每張 ${p1} 元、小孩票每張 ${p2} 元。某班師生共買了 ${N} 張門票，總共花費 ${T} 元。求買了 ${askX?'大人票':'小孩票'} 幾張？`}),
  (p1,p2,N,T,askX)=>({n1:'全票',n2:'學生票',
    text:`電影院：全票每張 ${p1} 元、學生票每張 ${p2} 元。這場電影共賣出 ${N} 張票，票房收入 ${T} 元。求賣出了${askX?'全票':'學生票'}幾張？`}),
  (p1,p2,N,T,askX)=>({n1:'蘋果',n2:'橘子',
    text:`水果攤：蘋果每公斤 ${p1} 元、橘子每公斤 ${p2} 元。小華共買了 ${N} 公斤水果，總共花費 ${T} 元。求買了${askX?'蘋果':'橘子'}幾公斤？`}),
  (p1,p2,N,T,askX)=>({n1:'原子筆',n2:'鉛筆',
    text:`文具店：原子筆一支 ${p1} 元、鉛筆一支 ${p2} 元。老師一共買了 ${N} 支文具當獎品，總共花費 ${T} 元。求買了${askX?'原子筆':'鉛筆'}幾支？`}),
  (p1,p2,N,T,askX)=>({n1:'排骨飯',n2:'素食飯',
    text:`自助餐店：排骨飯一份 ${p1} 元、素食飯一份 ${p2} 元。全班訂了 ${N} 份餐盒當班遊午餐，總共花費 ${T} 元。求訂了${askX?'排骨飯':'素食飯'}幾份？`}),
  (p1,p2,N,T,askX)=>({n1:'大杯珍奶',n2:'小杯珍奶',
    text:`飲料店：大杯珍奶一杯 ${p1} 元、小杯珍奶一杯 ${p2} 元。班費採購了 ${N} 杯飲料當獎勵，總共花費 ${T} 元。求買了${askX?'大杯':'小杯'}珍奶幾杯？`}),
  (p1,p2,N,T,askX)=>({n1:'第一梯次',n2:'第二梯次',
    text:`校外教學分梯次報名：第一梯次每人 ${p1} 元、第二梯次每人 ${p2} 元。全年級共 ${N} 人報名，總收費 ${T} 元。求報名${askX?'第一':'第二'}梯次的有幾人？`}),
];
function genPrice(M){
  const p2=R(1,M.max)*5,dp=R(1,3)*5,p1=p2+dp;
  const x0=R(1,M.max),y0=R(1,M.max),N=x0+y0,T=p1*x0+p2*y0;
  const askX=Math.random()<0.5;
  const sc=pick(PRICE)(p1,p2,N,T,askX);
  const correct=askX?x0:y0,other=askX?y0:x0;
  return mkResult(sc.text,correct,other,N,
    `設${sc.n1} x、${sc.n2} y，列出①x+y=${N}　②${p1}x+${p2}y=${T}，用代入或加減消去法求解。`,
    `由①得 y=${N}－x，代入②：${p1}x + ${p2}(${N}－x) = ${T}，解得 x = ${x0}，y = ${y0}。`);
}
function ensure4(ans,cands){
  const s=new Set([ans]);
  for(const c of cands){const cs=String(c);if(s.size<4&&cs!==ans&&cs.trim()!=='')s.add(cs);}
  /* 誘答選項不夠時：答案不是純數字就「改動答案裡的一個數字」補齊（例如 (5, 5)→(5, 4)），不再塞無關的 -5、6 */
  if(s.size<4&&!/^-?\d+(\.\d+)?$/.test(String(ans))){
    const str=String(ans),vars=[],re=/\d+(?:\.\d+)?/g;let mm;
    while((mm=re.exec(str))!==null){for(const d of [1,-1,2,-2,3,-3]){const nv=Number(mm[0])+d;if(nv<0)continue;const dec=(mm[0].split('.')[1]||'').length;vars.push(str.slice(0,mm.index)+(dec?nv.toFixed(dec):nv)+str.slice(mm.index+mm[0].length));}}
    for(let i=vars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[vars[i],vars[j]]=[vars[j],vars[i]];}
    for(const v of vars){if(s.size>=4)break;if(!s.has(v))s.add(v);}
  }
  let g=1;
  while(s.size<4){const v=(Number(ans)||0)+(g%2===0?g/2+3:-(Math.ceil(g/2)+2));const vs=String(v);if(!s.has(vs)&&Number(vs)>=0)s.add(vs);g++;}
  return sh([...s]);
}
function mkResult(text,correct,other,total,hint,explain){
  const ans=String(correct);
  const cands=[String(other),String(total),String(correct+pick([-2,-1,1,2])),String(correct+pick([-3,3]))];
  return {text,ans,options:ensure4(ans,cands),hint,explain};
}
function gen(t){
  const M=MODES[mode];
  if(t==='sumdiff')return genSumdiff(M);
  return genPrice(M);
}


return {plan:['sumdiff','price','sumdiff','price','sumdiff','price','sumdiff','price','sumdiff','price'],gen:function(t,m){mode=m;return gen(t);}};
})();

JB2.stages['2-1-1']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
function ensure4(ans,cands){
  const s=new Set([ans]);
  for(const c of cands){const cs=String(c);if(s.size<4&&cs!==ans&&cs.trim()!=='')s.add(cs);}
  /* 誘答選項不夠時：答案不是純數字就「改動答案裡的一個數字」補齊（例如 (5, 5)→(5, 4)），不再塞無關的 -5、6 */
  if(s.size<4&&!/^-?\d+(\.\d+)?$/.test(String(ans))){
    const str=String(ans),vars=[],re=/\d+(?:\.\d+)?/g;let mm;
    while((mm=re.exec(str))!==null){for(const d of [1,-1,2,-2,3,-3]){const nv=Number(mm[0])+d;if(nv<0)continue;const dec=(mm[0].split('.')[1]||'').length;vars.push(str.slice(0,mm.index)+(dec?nv.toFixed(dec):nv)+str.slice(mm.index+mm[0].length));}}
    for(let i=vars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[vars[i],vars[j]]=[vars[j],vars[i]];}
    for(const v of vars){if(s.size>=4)break;if(!s.has(v))s.add(v);}
  }
  let g=1;
  while(s.size<4){const v=(Number(ans)||0)+(g%2===0?g/2+5:-(Math.ceil(g/2)+4));const vs=String(v);if(!s.has(vs))s.add(vs);g++;}
  return sh([...s]);
}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);return b?gcd(b,a%b):(a||1)}
function lcm(a,b){return Math.abs(a*b)/gcd(a,b)}
/* 坐標平面 SVG 繪圖工具：points 畫點、lines 畫 ax+by=c 直線、dashedTo 畫到兩軸的虛線 */
function lineSegPoints(a,b,c,R2){
  const pts=[];
  if(b!==0){[-R2,R2].forEach(x=>{const y=(c-a*x)/b;if(y>=-R2-0.0001&&y<=R2+0.0001)pts.push([x,y]);});}
  if(a!==0){[-R2,R2].forEach(y=>{const x=(c-b*y)/a;if(x>=-R2-0.0001&&x<=R2+0.0001)pts.push([x,y]);});}
  if(pts.length<2)return null;
  pts.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);
  return [pts[0],pts[pts.length-1]];
}
function svgGrid(opts){
  const RG=opts.range||7,S=260,C=S/2,U=(S-36)/(2*RG);
  const toX=x=>C+x*U,toY=y=>C-y*U;
  let g=`<div class="qsvg"><svg viewBox="0 0 ${S} ${S}" style="width:100%;max-width:260px;background:#fff;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  for(let i=-RG;i<=RG;i++){
    g+=`<line x1="${toX(i)}" y1="${toY(-RG)}" x2="${toX(i)}" y2="${toY(RG)}" stroke="#e3e3e3" stroke-width="1"/>`;
    g+=`<line x1="${toX(-RG)}" y1="${toY(i)}" x2="${toX(RG)}" y2="${toY(i)}" stroke="#e3e3e3" stroke-width="1"/>`;
  }
  g+=`<line x1="${toX(-RG)}" y1="${toY(0)}" x2="${toX(RG)}" y2="${toY(0)}" stroke="#333" stroke-width="2"/>`;
  g+=`<line x1="${toX(0)}" y1="${toY(-RG)}" x2="${toX(0)}" y2="${toY(RG)}" stroke="#333" stroke-width="2"/>`;
  g+=`<text x="${toX(RG)-10}" y="${toY(0)-6}" font-size="12" fill="#333">x</text><text x="${toX(0)+6}" y="${toY(RG)+12}" font-size="12" fill="#333">y</text>`;
  (opts.lines||[]).forEach(ln=>{
    const pts=lineSegPoints(ln.a,ln.b,ln.c,RG);
    if(pts)g+=`<line x1="${toX(pts[0][0])}" y1="${toY(pts[0][1])}" x2="${toX(pts[1][0])}" y2="${toY(pts[1][1])}" stroke="${ln.color||'#d24a33'}" stroke-width="2.5"/>`;
  });
  (opts.dashedTo||[]).forEach(p=>{
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(p.x)}" y2="${toY(0)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(0)}" y2="${toY(p.y)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
  });
  (opts.points||[]).forEach(p=>{
    g+=`<circle cx="${toX(p.x)}" cy="${toY(p.y)}" r="4.5" fill="${p.color||'#d24a33'}"/>`;
    if(p.label)g+=`<text x="${toX(p.x)+6}" y="${toY(p.y)-6}" font-size="12" font-weight="700" fill="${p.color||'#d24a33'}">${p.label}</text>`;
  });
  g+='</svg></div>';
  return g;
}
function fmtEq(a,b,c){
  return (a===1?'':a)+'x + '+(b===1?'':b)+'y = '+c;
}
function fmtEqGen(a,b,c){
  let s=(a===1?'':a===-1?'-':a)+'x';
  s+=b>=0?' + '+(b===1?'':b)+'y':' - '+(Math.abs(b)===1?'':Math.abs(b))+'y';
  s+=' = '+c;
  return s;
}
const QUADS=['第一象限','第二象限','第三象限','第四象限'];
function quadName(x,y){
  if(x===0&&y===0)return '原點（不屬於任何象限）';
  if(x===0)return 'y 軸上（不屬於任何象限）';
  if(y===0)return 'x 軸上（不屬於任何象限）';
  if(x>0&&y>0)return '第一象限';
  if(x<0&&y>0)return '第二象限';
  if(x<0&&y<0)return '第三象限';
  return '第四象限';
}
const MODES={easy:{t:0,max:7},real:{t:15,max:6},hard:{t:10,max:7}};
const PLAN=['read','word','read','origin','compare','word','read','origin','compare','word'];

function signsFor(){
  if(mode==='easy')return [1,1];
  return [Math.random()<0.5?1:-1,Math.random()<0.5?1:-1];
}
function genRead(M){
  const [sx,sy]=signsFor();
  let a=sx*R(1,M.max),b=sy*R(1,M.max);
  if(mode==='hard'&&Math.random()<0.25){if(Math.random()<0.5)a=0;else b=0;}
  const svg=svgGrid({points:[{x:a,y:b,label:'P',color:'#d24a33'}]});
  const text='軸線雷鷹把寶箱藏在圖中 P 點，請寫出 P 點的坐標：';
  const ans=`(${a}, ${b})`;
  const wrong1=`(${b}, ${a})`,wrong2=`(${-a}, ${b})`,wrong3=`(${a}, ${-b})`;
  return {text,svg,ans,options:ensure4(ans,[wrong1,wrong2,wrong3]),
    hint:'先看點在 x 軸方向的位置（左右）當作 x 坐標，再看 y 軸方向的位置（上下）當作 y 坐標，寫成 (x, y)。',
    explain:`P 點在 x 方向的位置是 ${a}、y 方向的位置是 ${b}，所以坐標為 (${a}, ${b})。`};
}
function genWord(M){
  const [sx,sy]=signsFor();
  const a=R(1,M.max),b=R(1,M.max);
  const x=sx*a,y=sy*b;
  const dirX=sx>0?'右方':'左方',dirY=sy>0?'上方':'下方';
  const text=`軸線雷鷹發出訊息：『寶藏在距離 y 軸${dirX} ${a} 單位、距離 x 軸${dirY} ${b} 單位的地方』，請寫出寶藏的坐標：`;
  const ans=`(${x}, ${y})`;
  const wrong1=`(${-x}, ${y})`,wrong2=`(${x}, ${-y})`,wrong3=`(${y}, ${x})`;
  return {text,ans,options:ensure4(ans,[wrong1,wrong2,wrong3]),
    hint:'距離 y 軸的左右決定 x 坐標的正負；距離 x 軸的上下決定 y 坐標的正負。',
    explain:`距離 y 軸${dirX} ${a} 單位 → x 坐標為 ${x}；距離 x 軸${dirY} ${b} 單位 → y 坐標為 ${y}，坐標為 (${x}, ${y})。`};
}
function genOrigin(M){
  if(Math.random()<0.5){
    const text='x 軸與 y 軸的交點，有一個特別的名字，叫做什麼？它的坐標是多少？';
    const a=R(1,M.max);
    const ans='原點 (0, 0)';
    return {text,ans,options:ensure4(ans,[`原點 (${a}, 0)`,`交會點 (0, ${a})`,`中心點 (${a}, ${a})`]),
      hint:'x 軸與 y 軸相交的那一點，坐標一定都是 0。',explain:'x 軸與 y 軸的交點叫做「原點」，坐標固定是 (0, 0)。'};
  }
  const a=R(1,M.max),b=R(2,M.max);
  const cands=sh([[0,0],[a,0],[0,b],[a,b]]);
  const labels=['甲','乙','丙','丁'];
  const originIdx=cands.findIndex(p=>p[0]===0&&p[1]===0);
  const text='下面甲、乙、丙、丁四個點，哪一個是原點？<br>'+cands.map((p,i)=>`${labels[i]}(${p[0]}, ${p[1]})`).join('　');
  const ans=labels[originIdx];
  return {text,ans,options:sh(labels.slice()),hint:'原點的 x 坐標與 y 坐標都必須是 0。',
    explain:`原點的坐標是 (0, 0)，對照起來就是 ${labels[originIdx]} 點。`};
}
function genCompare(M){
  const [sx1,sy1]=signsFor();
  let a1=sx1*R(1,M.max),b1=sy1*R(1,M.max);
  const [sx2,sy2]=signsFor();
  let a2=sx2*R(1,M.max),b2=sy2*R(1,M.max);
  let g=0;while(a1===a2&&b1===b2&&g<10){a2=(Math.random()<0.5?1:-1)*R(1,M.max);g++;}
  const axis=Math.random()<0.5?'x':'y';
  const v1=axis==='x'?a1:b1,v2=axis==='x'?a2:b2;
  const svg=svgGrid({points:[{x:a1,y:b1,label:'甲',color:'#d24a33'},{x:a2,y:b2,label:'乙',color:'#2f6fb5'}]});
  const text=`比較甲點 (${a1}, ${b1}) 與乙點 (${a2}, ${b2})，哪一點的 ${axis} 坐標比較大？`;
  const ans=v1>v2?'甲':(v2>v1?'乙':'一樣大');
  return {text,svg,ans,options:['甲','乙','一樣大','看不出來'],
    hint:`只要比較兩點的 ${axis} 坐標數字大小就好，不用管另一個坐標。`,
    explain:`甲的 ${axis} 坐標是 ${v1}，乙的 ${axis} 坐標是 ${v2}，所以${ans==='一樣大'?'兩者相等':ans+'比較大'}。`};
}
function gen(t){
  const M=MODES[mode];
  if(t==='read')return genRead(M);
  if(t==='word')return genWord(M);
  if(t==='origin')return genOrigin(M);
  return genCompare(M);
}

return {plan:['read','word','read','origin','compare','word','read','origin','compare','word'],gen:function(t,m){mode=m;return gen(t);}};
})();

JB2.stages['2-1-2']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
function ensure4(ans,cands){
  const s=new Set([ans]);
  for(const c of cands){const cs=String(c);if(s.size<4&&cs!==ans&&cs.trim()!=='')s.add(cs);}
  /* 誘答選項不夠時：答案不是純數字就「改動答案裡的一個數字」補齊（例如 (5, 5)→(5, 4)），不再塞無關的 -5、6 */
  if(s.size<4&&!/^-?\d+(\.\d+)?$/.test(String(ans))){
    const str=String(ans),vars=[],re=/\d+(?:\.\d+)?/g;let mm;
    while((mm=re.exec(str))!==null){for(const d of [1,-1,2,-2,3,-3]){const nv=Number(mm[0])+d;if(nv<0)continue;const dec=(mm[0].split('.')[1]||'').length;vars.push(str.slice(0,mm.index)+(dec?nv.toFixed(dec):nv)+str.slice(mm.index+mm[0].length));}}
    for(let i=vars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[vars[i],vars[j]]=[vars[j],vars[i]];}
    for(const v of vars){if(s.size>=4)break;if(!s.has(v))s.add(v);}
  }
  let g=1;
  while(s.size<4){const v=(Number(ans)||0)+(g%2===0?g/2+5:-(Math.ceil(g/2)+4));const vs=String(v);if(!s.has(vs))s.add(vs);g++;}
  return sh([...s]);
}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);return b?gcd(b,a%b):(a||1)}
function lcm(a,b){return Math.abs(a*b)/gcd(a,b)}
/* 坐標平面 SVG 繪圖工具：points 畫點、lines 畫 ax+by=c 直線、dashedTo 畫到兩軸的虛線 */
function lineSegPoints(a,b,c,R2){
  const pts=[];
  if(b!==0){[-R2,R2].forEach(x=>{const y=(c-a*x)/b;if(y>=-R2-0.0001&&y<=R2+0.0001)pts.push([x,y]);});}
  if(a!==0){[-R2,R2].forEach(y=>{const x=(c-b*y)/a;if(x>=-R2-0.0001&&x<=R2+0.0001)pts.push([x,y]);});}
  if(pts.length<2)return null;
  pts.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);
  return [pts[0],pts[pts.length-1]];
}
function svgGrid(opts){
  const RG=opts.range||7,S=260,C=S/2,U=(S-36)/(2*RG);
  const toX=x=>C+x*U,toY=y=>C-y*U;
  let g=`<div class="qsvg"><svg viewBox="0 0 ${S} ${S}" style="width:100%;max-width:260px;background:#fff;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  for(let i=-RG;i<=RG;i++){
    g+=`<line x1="${toX(i)}" y1="${toY(-RG)}" x2="${toX(i)}" y2="${toY(RG)}" stroke="#e3e3e3" stroke-width="1"/>`;
    g+=`<line x1="${toX(-RG)}" y1="${toY(i)}" x2="${toX(RG)}" y2="${toY(i)}" stroke="#e3e3e3" stroke-width="1"/>`;
  }
  g+=`<line x1="${toX(-RG)}" y1="${toY(0)}" x2="${toX(RG)}" y2="${toY(0)}" stroke="#333" stroke-width="2"/>`;
  g+=`<line x1="${toX(0)}" y1="${toY(-RG)}" x2="${toX(0)}" y2="${toY(RG)}" stroke="#333" stroke-width="2"/>`;
  g+=`<text x="${toX(RG)-10}" y="${toY(0)-6}" font-size="12" fill="#333">x</text><text x="${toX(0)+6}" y="${toY(RG)+12}" font-size="12" fill="#333">y</text>`;
  (opts.lines||[]).forEach(ln=>{
    const pts=lineSegPoints(ln.a,ln.b,ln.c,RG);
    if(pts)g+=`<line x1="${toX(pts[0][0])}" y1="${toY(pts[0][1])}" x2="${toX(pts[1][0])}" y2="${toY(pts[1][1])}" stroke="${ln.color||'#d24a33'}" stroke-width="2.5"/>`;
  });
  (opts.dashedTo||[]).forEach(p=>{
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(p.x)}" y2="${toY(0)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(0)}" y2="${toY(p.y)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
  });
  (opts.points||[]).forEach(p=>{
    g+=`<circle cx="${toX(p.x)}" cy="${toY(p.y)}" r="4.5" fill="${p.color||'#d24a33'}"/>`;
    if(p.label)g+=`<text x="${toX(p.x)+6}" y="${toY(p.y)-6}" font-size="12" font-weight="700" fill="${p.color||'#d24a33'}">${p.label}</text>`;
  });
  g+='</svg></div>';
  return g;
}
function fmtEq(a,b,c){
  return (a===1?'':a)+'x + '+(b===1?'':b)+'y = '+c;
}
function fmtEqGen(a,b,c){
  let s=(a===1?'':a===-1?'-':a)+'x';
  s+=b>=0?' + '+(b===1?'':b)+'y':' - '+(Math.abs(b)===1?'':Math.abs(b))+'y';
  s+=' = '+c;
  return s;
}
const QUADS=['第一象限','第二象限','第三象限','第四象限'];
function quadName(x,y){
  if(x===0&&y===0)return '原點（不屬於任何象限）';
  if(x===0)return 'y 軸上（不屬於任何象限）';
  if(y===0)return 'x 軸上（不屬於任何象限）';
  if(x>0&&y>0)return '第一象限';
  if(x<0&&y>0)return '第二象限';
  if(x<0&&y<0)return '第三象限';
  return '第四象限';
}
const MODES={easy:{t:0,max:5},real:{t:15,max:6},hard:{t:10,max:7}};
const PLAN=['quadrant','sign','axis','quadrant','visual','sign','axis','quadrant','visual','sign'];
const SIGNS={'第一象限':'x > 0, y > 0','第二象限':'x < 0, y > 0','第三象限':'x < 0, y < 0','第四象限':'x > 0, y < 0'};

function genQuadrant(M){
  let a=R(1,M.max)*(Math.random()<0.5?1:-1),b=R(1,M.max)*(Math.random()<0.5?1:-1);
  if(mode==='hard'&&Math.random()<0.2){if(Math.random()<0.5)a=0;else b=0;}
  const text=`點 P (${a}, ${b}) 位在哪一個象限？（如果剛好在坐標軸上，也請選出正確答案）`;
  const ans=quadName(a,b);
  const allOpts=['第一象限','第二象限','第三象限','第四象限','x 軸上（不屬於任何象限）','y 軸上（不屬於任何象限）','原點（不屬於任何象限）'];
  const wrongPool=allOpts.filter(o=>o!==ans);
  return {text,ans,options:ensure4(ans,sh(wrongPool)),
    hint:'x 是正的往右、負的往左；y 是正的往上、負的往下；只要有一個坐標是 0，就不在任何象限裡。',
    explain:`x=${a}${a===0?'（在 y 軸上）':a>0?'（正）':'（負）'}，y=${b}${b===0?'（在 x 軸上）':b>0?'（正）':'（負）'}，所以 P 在${ans}。`};
}
function genSign0(M){
  const qd=pick(QUADS);
  const text=`如果點 (x, y) 在${qd}，那麼 x 與 y 的正負關係應該是？`;
  const ans=SIGNS[qd];
  const wrongs=QUADS.filter(q=>q!==qd).map(q=>SIGNS[q]);
  return {text,ans,options:ensure4(ans,wrongs),
    hint:'背口訣：一正正、二負正、三負負、四正負（x 在前、y 在後）。',
    explain:`${qd}的判斷方式是「${ans}」，這就是象限口訣的內容。`};
}
const TS=(say,hint,ok,wrong,line)=>({say,hint,ok,wrong:wrong||[],line:line||''});

const QKEY={'第一象限':[1,1],'第二象限':[-1,1],'第三象限':[-1,-1],'第四象限':[1,-1]};
const qOfS=(sx,sy)=>sx>0?(sy>0?'第一象限':'第四象限'):(sy>0?'第二象限':'第三象限');
const posNeg=v=>v>0?'正數':'負數';
function genSign(M){
  const r=Math.random();
  if(r<0.25)return genSign0(M);
  if(r<0.45){ // 由 x、y 的正負判斷象限（小老師已有對應步驟）
    const sx=Math.random()<0.5?1:-1,sy=Math.random()<0.5?1:-1,ans=qOfS(sx,sy);
    return {text:`x 坐標是${posNeg(sx)}、y 坐標是${posNeg(sy)}，這個點會在第幾象限？`,ans,options:QUADS.slice(),
      hint:'背口訣：一正正、二負正、三負負、四正負（x 在前、y 在後）。',
      explain:`x ${sx>0?'>':'<'} 0、y ${sy>0?'>':'<'} 0，對照口訣就是${ans}。`};
  }
  // 用字母 a、b 推理：P(a,b) 在某象限，Q 是由 a、b 組成的新點，Q 在第幾象限？
  const qd=pick(QUADS),[sa,sb]=QKEY[qd];
  const terms=[['a',sa],['b',sb],['−a',-sa],['−b',-sb]];
  let t1,t2;do{t1=pick(terms);t2=pick(terms);}while(t1[0]==='a'&&t2[0]==='b');
  const ans=qOfS(t1[1],t2[1]);
  const combo=(u,v)=>`x ${u>0?'正':'負'}、y ${v>0?'正':'負'}`;
  const tutor=[
    TS(`P (a, b) 在${qd}，所以 <b>a</b> 是正數還是負數？`,'一正正、二負正、三負負、四正負：第一個字是 x（也就是 a）。',posNeg(sa),[[posNeg(-sa),`${qd}的 x 坐標是${posNeg(sa)}喔。`]],`a ${sa>0?'> 0':'< 0'}`),
    TS(`那 <b>b</b> 是正數還是負數？`,'第二個字是 y（也就是 b）。',posNeg(sb),[[posNeg(-sb),`${qd}的 y 坐標是${posNeg(sb)}喔。`]],`b ${sb>0?'> 0':'< 0'}`),
    TS(`新點 Q (${t1[0]}, ${t2[0]})：它的 x 坐標 <b>${t1[0]}</b> 和 y 坐標 <b>${t2[0]}</b>，正負是？`,'前面有「−」的，正負會反過來。',combo(t1[1],t2[1]),[[combo(-t1[1],t2[1]),'x 的正負判斷反了，注意有沒有「−」。'],[combo(t1[1],-t2[1]),'y 的正負判斷反了，注意有沒有「−」。'],[combo(-t1[1],-t2[1]),'兩個都反了，再算一次。']],combo(t1[1],t2[1]))
  ];
  const why={};QUADS.forEach(q=>{if(q!==ans){const k=QKEY[q];why[q]=`${q}要 ${combo(k[0],k[1])}，但 Q 是 ${combo(t1[1],t2[1])}。`}});
  return {text:`已知點 P (a, b) 在${qd}，那麼點 Q (${t1[0]}, ${t2[0]}) 在第幾象限？`,ans,options:QUADS.slice(),tutor,why,
    hint:'先判斷 a、b 各是正還是負，再看 Q 的兩個坐標。',
    explain:`P 在${qd}：a ${sa>0?'>':'<'} 0、b ${sb>0?'>':'<'} 0。Q 的 x 坐標 ${t1[0]} ${t1[1]>0?'>':'<'} 0、y 坐標 ${t2[0]} ${t2[1]>0?'>':'<'} 0，所以 Q 在${ans}。`};
}
function genVisual(M){
  const r=Math.random();
  if(r<0.34)return genVisual0(M);
  const rs=()=>Math.random()<0.5?1:-1;
  if(r<0.67){ // 讀坐標
    const a=R(1,M.max)*rs(),b=R(1,M.max)*rs(),L=pick(['P','Q','A','B','C','M']);
    const svg=svgGrid({points:[{x:a,y:b,label:L,color:'#8a3ad2'}]});
    const ans=`(${a}, ${b})`;
    const tutor=[
      TS(`先看 ${L} 點在<b>左右</b>的位置：從 y 軸（直的那條）往右或往左數，x 坐標是多少？`,'往右是正、往左是負。',String(a),[[String(-a),'方向弄反了：右邊是正、左邊是負。'],[String(b),'那是上下的位置（y 坐標）。']],`x = ${a}`),
      TS(`再看<b>上下</b>的位置：從 x 軸（橫的那條）往上或往下數，y 坐標是多少？`,'往上是正、往下是負。',String(b),[[String(-b),'方向弄反了：上面是正、下面是負。'],[String(a),'那是左右的位置（x 坐標）。']],`y = ${b}`)
    ];
    return {text:`圖中的 ${L} 點，坐標是多少？（${L} 點在${qOfS(a,b)}）`,svg,ans,options:ensure4(ans,[`(${b}, ${a})`,`(${-a}, ${b})`,`(${a}, ${-b})`]),tutor,
      hint:'先看左右（x）、再看上下（y），寫成 (x, y)。',explain:`${L} 點 x 方向是 ${a}、y 方向是 ${b}，坐標是 (${a}, ${b})。`};
  }
  // 兩點比較：哪一個點在某象限
  let a1=R(1,M.max)*rs(),b1=R(1,M.max)*rs(),a2,b2,g=0;
  do{a2=R(1,M.max)*rs();b2=R(1,M.max)*rs();g++}while(qOfS(a1,b1)===qOfS(a2,b2)&&g<30);
  if(qOfS(a1,b1)===qOfS(a2,b2)){a2=-a1;b2=b1}
  const askA=Math.random()<0.5,target=askA?qOfS(a1,b1):qOfS(a2,b2),ans=askA?'A 點':'B 點';
  const svg=svgGrid({points:[{x:a1,y:b1,label:'A',color:'#d24a33'},{x:a2,y:b2,label:'B',color:'#2f6fb5'}]});
  const tutor=[
    TS('先看 A 點：它在 y 軸的左邊還是右邊、x 軸的上面還是下面？所以在第幾象限？','右上＝一、左上＝二、左下＝三、右下＝四。',qOfS(a1,b1),QUADS.filter(q=>q!==qOfS(a1,b1)).slice(0,2).map(q=>[q,'再看一次 A 點的位置。']),`A 在${qOfS(a1,b1)}`),
    TS('再看 B 點：它在第幾象限？','同樣方法看左右、上下。',qOfS(a2,b2),QUADS.filter(q=>q!==qOfS(a2,b2)).slice(0,2).map(q=>[q,'再看一次 B 點的位置。']),`B 在${qOfS(a2,b2)}`)
  ];
  return {text:`圖中有 A、B 兩點，哪一個點在${target}？`,svg,ans,options:['A 點','B 點','兩個點都是','兩個點都不是'],tutor,
    hint:'分別判斷 A、B 在哪個象限，再找出符合題目的那一個。',explain:`A 在${qOfS(a1,b1)}，B 在${qOfS(a2,b2)}，所以${target}的是 ${ans}。`};
}
function genAxis(M){
  const onAxis=Math.random()<0.6;
  let a,b;
  if(onAxis){
    if(Math.random()<0.5){a=R(1,M.max)*(Math.random()<0.5?1:-1);b=0;}
    else{a=0;b=R(1,M.max)*(Math.random()<0.5?1:-1);}
    if(Math.random()<0.15){a=0;b=0;}
  }else{a=R(1,M.max)*(Math.random()<0.5?1:-1);b=R(1,M.max)*(Math.random()<0.5?1:-1);}
  const text=`點 (${a}, ${b}) 是落在 x 軸上、y 軸上、原點，還是都不是（落在某個象限裡）？`;
  let ans;
  if(a===0&&b===0)ans='原點';else if(b===0)ans='x 軸上';else if(a===0)ans='y 軸上';else ans='都不是（在象限裡）';
  return {text,ans,options:['x 軸上','y 軸上','原點','都不是（在象限裡）'],
    hint:'y 坐標是 0 代表在 x 軸上；x 坐標是 0 代表在 y 軸上；兩個都是 0 就是原點。',
    explain:`(${a}, ${b})：${ans==='原點'?'x、y 都是 0，是原點':ans==='x 軸上'?'y 坐標是 0，所以在 x 軸上':ans==='y 軸上'?'x 坐標是 0，所以在 y 軸上':'x、y 都不是 0，所以落在某個象限裡'}。`};
}
function genVisual0(M){
  let a=R(1,M.max)*(Math.random()<0.5?1:-1),b=R(1,M.max)*(Math.random()<0.5?1:-1);
  const svg=svgGrid({points:[{x:a,y:b,label:'P',color:'#8a3ad2'}]});
  const text='圖中的 P 點位在第幾象限？';
  const ans=quadName(a,b);
  const wrongPool=QUADS.filter(q=>q!==ans);
  return {text,svg,ans,options:sh([ans,...wrongPool]),
    hint:'看 P 點在 x 軸的左右、y 軸的上下，對照象限口訣判斷。',
    explain:`P (${a}, ${b}) 的 x、y 都不是 0，符合${ans}的正負規則。`};
}
function gen(t){
  const M=MODES[mode];
  if(t==='quadrant')return genQuadrant(M);
  if(t==='sign')return genSign(M);
  if(t==='axis')return genAxis(M);
  return genVisual(M);
}
/* ===== 題庫擴充：同一題型多幾種問法，避免一直遇到同一題 ===== */
(function(){
  const _g=gen;
  const mk=(text,ans,wrongs,hint,explain)=>({text,ans,options:ensure4(ans,wrongs),hint,explain});
  const BANK={};
  BANK['sign2']={p:1,make:()=>{
    const sx=Math.random()<0.5?1:-1,sy=Math.random()<0.5?1:-1,nx=R(1,MODES[mode].max),ny=R(1,MODES[mode].max);
    const text=`如果一個點的 x 坐標${sx>0?'是正數':'是負數'}、y 坐標${sy>0?'是正數':'是負數'}，這個點會在第幾象限？`;
    const ans=quadName(sx*nx,sy*ny);
    return {text,ans,options:sh(QUADS.slice()),hint:'背口訣：一正正、二負正、三負負、四正負（x 在前、y 在後）。',explain:`x ${sx>0?'為正':'為負'}、y ${sy>0?'為正':'為負'}，所以在${ans}。`};}};
  BANK['sign']={p:.5,make:()=>BANK['sign2'].make()};

  gen=function(t){const B=BANK[t];if(B&&Math.random()<B.p){return B.make();}return _g.apply(this,arguments);};
})();

return {plan:['quadrant','sign','axis','quadrant','visual','sign','axis','quadrant','visual','sign'],gen:function(t,m){mode=m;return gen(t);}};
})();

JB2.stages['2-1-3']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
function ensure4(ans,cands){
  const s=new Set([ans]);
  for(const c of cands){const cs=String(c);if(s.size<4&&cs!==ans&&cs.trim()!=='')s.add(cs);}
  /* 誘答選項不夠時：答案不是純數字就「改動答案裡的一個數字」補齊（例如 (5, 5)→(5, 4)），不再塞無關的 -5、6 */
  if(s.size<4&&!/^-?\d+(\.\d+)?$/.test(String(ans))){
    const str=String(ans),vars=[],re=/\d+(?:\.\d+)?/g;let mm;
    while((mm=re.exec(str))!==null){for(const d of [1,-1,2,-2,3,-3]){const nv=Number(mm[0])+d;if(nv<0)continue;const dec=(mm[0].split('.')[1]||'').length;vars.push(str.slice(0,mm.index)+(dec?nv.toFixed(dec):nv)+str.slice(mm.index+mm[0].length));}}
    for(let i=vars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[vars[i],vars[j]]=[vars[j],vars[i]];}
    for(const v of vars){if(s.size>=4)break;if(!s.has(v))s.add(v);}
  }
  let g=1;
  while(s.size<4){const v=(Number(ans)||0)+(g%2===0?g/2+5:-(Math.ceil(g/2)+4));const vs=String(v);if(!s.has(vs))s.add(vs);g++;}
  return sh([...s]);
}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);return b?gcd(b,a%b):(a||1)}
function lcm(a,b){return Math.abs(a*b)/gcd(a,b)}
/* 坐標平面 SVG 繪圖工具：points 畫點、lines 畫 ax+by=c 直線、dashedTo 畫到兩軸的虛線 */
function lineSegPoints(a,b,c,R2){
  const pts=[];
  if(b!==0){[-R2,R2].forEach(x=>{const y=(c-a*x)/b;if(y>=-R2-0.0001&&y<=R2+0.0001)pts.push([x,y]);});}
  if(a!==0){[-R2,R2].forEach(y=>{const x=(c-b*y)/a;if(x>=-R2-0.0001&&x<=R2+0.0001)pts.push([x,y]);});}
  if(pts.length<2)return null;
  pts.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);
  return [pts[0],pts[pts.length-1]];
}
function svgGrid(opts){
  const RG=opts.range||7,S=260,C=S/2,U=(S-36)/(2*RG);
  const toX=x=>C+x*U,toY=y=>C-y*U;
  let g=`<div class="qsvg"><svg viewBox="0 0 ${S} ${S}" style="width:100%;max-width:260px;background:#fff;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  for(let i=-RG;i<=RG;i++){
    g+=`<line x1="${toX(i)}" y1="${toY(-RG)}" x2="${toX(i)}" y2="${toY(RG)}" stroke="#e3e3e3" stroke-width="1"/>`;
    g+=`<line x1="${toX(-RG)}" y1="${toY(i)}" x2="${toX(RG)}" y2="${toY(i)}" stroke="#e3e3e3" stroke-width="1"/>`;
  }
  g+=`<line x1="${toX(-RG)}" y1="${toY(0)}" x2="${toX(RG)}" y2="${toY(0)}" stroke="#333" stroke-width="2"/>`;
  g+=`<line x1="${toX(0)}" y1="${toY(-RG)}" x2="${toX(0)}" y2="${toY(RG)}" stroke="#333" stroke-width="2"/>`;
  g+=`<text x="${toX(RG)-10}" y="${toY(0)-6}" font-size="12" fill="#333">x</text><text x="${toX(0)+6}" y="${toY(RG)+12}" font-size="12" fill="#333">y</text>`;
  (opts.lines||[]).forEach(ln=>{
    const pts=lineSegPoints(ln.a,ln.b,ln.c,RG);
    if(pts)g+=`<line x1="${toX(pts[0][0])}" y1="${toY(pts[0][1])}" x2="${toX(pts[1][0])}" y2="${toY(pts[1][1])}" stroke="${ln.color||'#d24a33'}" stroke-width="2.5"/>`;
  });
  (opts.dashedTo||[]).forEach(p=>{
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(p.x)}" y2="${toY(0)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(0)}" y2="${toY(p.y)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
  });
  (opts.points||[]).forEach(p=>{
    g+=`<circle cx="${toX(p.x)}" cy="${toY(p.y)}" r="4.5" fill="${p.color||'#d24a33'}"/>`;
    if(p.label)g+=`<text x="${toX(p.x)+6}" y="${toY(p.y)-6}" font-size="12" font-weight="700" fill="${p.color||'#d24a33'}">${p.label}</text>`;
  });
  g+='</svg></div>';
  return g;
}
function fmtEq(a,b,c){
  return (a===1?'':a)+'x + '+(b===1?'':b)+'y = '+c;
}
function fmtEqGen(a,b,c){
  let s=(a===1?'':a===-1?'-':a)+'x';
  s+=b>=0?' + '+(b===1?'':b)+'y':' - '+(Math.abs(b)===1?'':Math.abs(b))+'y';
  s+=' = '+c;
  return s;
}
const QUADS=['第一象限','第二象限','第三象限','第四象限'];
function quadName(x,y){
  if(x===0&&y===0)return '原點（不屬於任何象限）';
  if(x===0)return 'y 軸上（不屬於任何象限）';
  if(y===0)return 'x 軸上（不屬於任何象限）';
  if(x>0&&y>0)return '第一象限';
  if(x<0&&y>0)return '第二象限';
  if(x<0&&y<0)return '第三象限';
  return '第四象限';
}
const MODES={easy:{t:0,max:5},real:{t:15,max:7},hard:{t:10,max:8}};
const PLAN=['distX','distY','both','reverse','distX','both','distY','reverse','both','distX'];

function genDist(M,axis){
  let a=R(1,M.max)*(Math.random()<0.5?1:-1),b=R(1,M.max)*(Math.random()<0.5?1:-1);
  const svg=svgGrid({points:[{x:a,y:b,label:'A',color:'#43a58f'}],dashedTo:[{x:a,y:b}]});
  const distX=Math.abs(b),distY=Math.abs(a);
  const axisName=axis==='x'?'x 軸':'y 軸';
  const ans=String(axis==='x'?distX:distY);
  const text=`星靈閃爍在坐標 A (${a}, ${b})，牠距離 ${axisName} 有幾個單位？`;
  const wrong=axis==='x'?[String(distY),String(b),String(-distX)]:[String(distX),String(a),String(-distY)];
  return {text,svg,ans,options:ensure4(ans,wrong),
    hint:axis==='x'?'到 x 軸的距離，是看 y 坐標的絕對值。':'到 y 軸的距離，是看 x 坐標的絕對值。',
    explain:`A 點到 ${axisName} 的距離 = |${axis==='x'?b:a}| = ${ans}（距離一定是正數，不能是負的）。`};
}
function genBoth(M){
  let a=R(1,M.max)*(Math.random()<0.5?1:-1),b=R(1,M.max)*(Math.random()<0.5?1:-1);
  const svg=svgGrid({points:[{x:a,y:b,label:'A',color:'#43a58f'}],dashedTo:[{x:a,y:b}]});
  const dx=Math.abs(a),dy=Math.abs(b);
  const ans=`到 x 軸 ${dy}，到 y 軸 ${dx}`;
  const wrong1=`到 x 軸 ${dx}，到 y 軸 ${dy}`;
  const wrong2=`到 x 軸 ${dy+1}，到 y 軸 ${dx}`;
  const wrong3=`到 x 軸 ${dy}，到 y 軸 ${dx+1}`;
  const text=`星靈站在 A (${a}, ${b})，牠到 x 軸與到 y 軸的距離分別是多少？`;
  return {text,svg,ans,options:ensure4(ans,[wrong1,wrong2,wrong3]),
    hint:'到 x 軸的距離看 |y|，到 y 軸的距離看 |x|，兩個很容易搞混，要小心！',
    explain:`到 x 軸距離 = |${b}| = ${dy}；到 y 軸距離 = |${a}| = ${dx}。`};
}
function genReverse(M){
  const dx=R(1,M.max),dy=R(1,M.max);
  const qd=pick(QUADS);
  const sx=(qd==='第一象限'||qd==='第四象限')?1:-1;
  const sy=(qd==='第一象限'||qd==='第二象限')?1:-1;
  const x=sx*dx,y=sy*dy;
  const text=`一個點在${qd}，牠到 y 軸的距離是 ${dx}、到 x 軸的距離是 ${dy}，這個點的坐標是？`;
  const ans=`(${x}, ${y})`;
  const wrong1=`(${sx*dy}, ${sy*dx})`,wrong2=`(${-x}, ${y})`,wrong3=`(${x}, ${-y})`;
  return {text,ans,options:ensure4(ans,[wrong1,wrong2,wrong3]),
    hint:'到 y 軸的距離決定 |x|，到 x 軸的距離決定 |y|，再依象限決定正負號。',
    explain:`${qd}的 x 坐標為${sx>0?'正':'負'}、y 坐標為${sy>0?'正':'負'}，所以坐標為 (${x}, ${y})。`};
}
function gen(t){
  const M=MODES[mode];
  if(t==='distX')return genDist(M,'x');
  if(t==='distY')return genDist(M,'y');
  if(t==='both')return genBoth(M);
  return genReverse(M);
}

return {plan:['distX','distY','both','reverse','distX','both','distY','reverse','both','distX'],gen:function(t,m){mode=m;return gen(t);}};
})();

JB2.stages['2-2-1']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
function ensure4(ans,cands){
  const s=new Set([ans]);
  for(const c of cands){const cs=String(c);if(s.size<4&&cs!==ans&&cs.trim()!=='')s.add(cs);}
  /* 誘答選項不夠時：答案不是純數字就「改動答案裡的一個數字」補齊（例如 (5, 5)→(5, 4)），不再塞無關的 -5、6 */
  if(s.size<4&&!/^-?\d+(\.\d+)?$/.test(String(ans))){
    const str=String(ans),vars=[],re=/\d+(?:\.\d+)?/g;let mm;
    while((mm=re.exec(str))!==null){for(const d of [1,-1,2,-2,3,-3]){const nv=Number(mm[0])+d;if(nv<0)continue;const dec=(mm[0].split('.')[1]||'').length;vars.push(str.slice(0,mm.index)+(dec?nv.toFixed(dec):nv)+str.slice(mm.index+mm[0].length));}}
    for(let i=vars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[vars[i],vars[j]]=[vars[j],vars[i]];}
    for(const v of vars){if(s.size>=4)break;if(!s.has(v))s.add(v);}
  }
  let g=1;
  while(s.size<4){const v=(Number(ans)||0)+(g%2===0?g/2+5:-(Math.ceil(g/2)+4));const vs=String(v);if(!s.has(vs))s.add(vs);g++;}
  return sh([...s]);
}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);return b?gcd(b,a%b):(a||1)}
function lcm(a,b){return Math.abs(a*b)/gcd(a,b)}
/* 坐標平面 SVG 繪圖工具：points 畫點、lines 畫 ax+by=c 直線、dashedTo 畫到兩軸的虛線 */
function lineSegPoints(a,b,c,R2){
  const pts=[];
  if(b!==0){[-R2,R2].forEach(x=>{const y=(c-a*x)/b;if(y>=-R2-0.0001&&y<=R2+0.0001)pts.push([x,y]);});}
  if(a!==0){[-R2,R2].forEach(y=>{const x=(c-b*y)/a;if(x>=-R2-0.0001&&x<=R2+0.0001)pts.push([x,y]);});}
  if(pts.length<2)return null;
  pts.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);
  return [pts[0],pts[pts.length-1]];
}
function svgGrid(opts){
  const RG=opts.range||7,S=260,C=S/2,U=(S-36)/(2*RG);
  const toX=x=>C+x*U,toY=y=>C-y*U;
  let g=`<div class="qsvg"><svg viewBox="0 0 ${S} ${S}" style="width:100%;max-width:260px;background:#fff;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  for(let i=-RG;i<=RG;i++){
    g+=`<line x1="${toX(i)}" y1="${toY(-RG)}" x2="${toX(i)}" y2="${toY(RG)}" stroke="#e3e3e3" stroke-width="1"/>`;
    g+=`<line x1="${toX(-RG)}" y1="${toY(i)}" x2="${toX(RG)}" y2="${toY(i)}" stroke="#e3e3e3" stroke-width="1"/>`;
  }
  g+=`<line x1="${toX(-RG)}" y1="${toY(0)}" x2="${toX(RG)}" y2="${toY(0)}" stroke="#333" stroke-width="2"/>`;
  g+=`<line x1="${toX(0)}" y1="${toY(-RG)}" x2="${toX(0)}" y2="${toY(RG)}" stroke="#333" stroke-width="2"/>`;
  g+=`<text x="${toX(RG)-10}" y="${toY(0)-6}" font-size="12" fill="#333">x</text><text x="${toX(0)+6}" y="${toY(RG)+12}" font-size="12" fill="#333">y</text>`;
  (opts.lines||[]).forEach(ln=>{
    const pts=lineSegPoints(ln.a,ln.b,ln.c,RG);
    if(pts)g+=`<line x1="${toX(pts[0][0])}" y1="${toY(pts[0][1])}" x2="${toX(pts[1][0])}" y2="${toY(pts[1][1])}" stroke="${ln.color||'#d24a33'}" stroke-width="2.5"/>`;
  });
  (opts.dashedTo||[]).forEach(p=>{
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(p.x)}" y2="${toY(0)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(0)}" y2="${toY(p.y)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
  });
  (opts.points||[]).forEach(p=>{
    g+=`<circle cx="${toX(p.x)}" cy="${toY(p.y)}" r="4.5" fill="${p.color||'#d24a33'}"/>`;
    if(p.label)g+=`<text x="${toX(p.x)+6}" y="${toY(p.y)-6}" font-size="12" font-weight="700" fill="${p.color||'#d24a33'}">${p.label}</text>`;
  });
  g+='</svg></div>';
  return g;
}
function fmtEq(a,b,c){
  return (a===1?'':a)+'x + '+(b===1?'':b)+'y = '+c;
}
function fmtEqGen(a,b,c){
  let s=(a===1?'':a===-1?'-':a)+'x';
  s+=b>=0?' + '+(b===1?'':b)+'y':' - '+(Math.abs(b)===1?'':Math.abs(b))+'y';
  s+=' = '+c;
  return s;
}
const QUADS=['第一象限','第二象限','第三象限','第四象限'];
function quadName(x,y){
  if(x===0&&y===0)return '原點（不屬於任何象限）';
  if(x===0)return 'y 軸上（不屬於任何象限）';
  if(y===0)return 'x 軸上（不屬於任何象限）';
  if(x>0&&y>0)return '第一象限';
  if(x<0&&y>0)return '第二象限';
  if(x<0&&y<0)return '第三象限';
  return '第四象限';
}
const MODES={easy:{t:0,max:4},real:{t:15,max:5},hard:{t:10,max:6}};
const PLAN=['xIntercept','yIntercept','onLine','findPoint','xIntercept','findPoint','onLine','yIntercept','findPoint','onLine'];

function genLineEq(M){
  // 練兵／實戰模式：先只練 x0、y0 都是正的（截距在第一象限），數字比較好想像。
  // 修羅模式：x0、y0 各有一半機率變成負的，這樣直線就會出現在不同象限，四個象限都練得到。
  let x0=R(1,M.max),y0=R(1,M.max);
  if(mode==='hard'){
    if(Math.random()<0.5)x0=-x0;
    if(Math.random()<0.5)y0=-y0;
  }
  const L=lcm(Math.abs(x0),Math.abs(y0));
  const kk=pick(mode==='easy'?[1,2]:[1,2,3]);   // 把整條方程式同乘 kk，直線不變、看起來不同
  const a=L/x0*kk,b=L/y0*kk,c=L*kk;   // 用 x/x0 + y/y0 = 1 的關係推出來，x0、y0 是正是負都成立
  return {a,b,c,x0,y0};
}
// 在 [lo,hi] 之間找一個整數 x，讓 (c-a*x) 可以被 b 整除（也就是能找到整數的 y）
function findIntOn(lo,hi,solve){
  const xs=[];for(let x=lo;x<=hi;x++)xs.push(x);
  sh(xs);
  for(const x of xs){const y=solve(x);if(y!==null)return {x,y};}
  return null;
}
const MONS=['直線軌跡蛇','光束彗星','閃電鰻','雷射飛魚','影子獵豹'];
function genXIntercept(M){
  const {a,b,c,x0,y0}=genLineEq(M);
  const eqText=fmtEqGen(a,b,c);
  const svg=svgGrid({lines:[{a,b,c,color:'#d24a33'}],points:[{x:x0,y:0,label:'',color:'#d24a33'}]});
  const text=`${pick(MONS)}的方程式是 ${eqText}，牠與 x 軸的交點坐標是？（提示：交點在 x 軸上，y = 0）`;
  const ans=`(${x0}, 0)`;
  const wrong1=`(0, ${x0})`,wrong2=`(${y0}, 0)`,wrong3=`(${x0}, ${y0})`;
  return {text,svg,ans,options:ensure4(ans,[wrong1,wrong2,wrong3]),
    hint:'與 x 軸的交點，y 坐標一定是 0，把 y=0 代入方程式解出 x。',
    explain:`把 y=0 代入 ${eqText}，得 ${a===1?'':a}x=${c}，解得 x=${x0}，交點為 (${x0}, 0)。`};
}
function genYIntercept(M){
  const {a,b,c,x0,y0}=genLineEq(M);
  const eqText=fmtEqGen(a,b,c);
  const svg=svgGrid({lines:[{a,b,c,color:'#d24a33'}],points:[{x:0,y:y0,label:'',color:'#d24a33'}]});
  const text=`${pick(MONS)}的方程式是 ${eqText}，牠與 y 軸的交點坐標是？（提示：交點在 y 軸上，x = 0）`;
  const ans=`(0, ${y0})`;
  const wrong1=`(${y0}, 0)`,wrong2=`(0, ${x0})`,wrong3=`(${x0}, ${y0})`;
  return {text,svg,ans,options:ensure4(ans,[wrong1,wrong2,wrong3]),
    hint:'與 y 軸的交點，x 坐標一定是 0，把 x=0 代入方程式解出 y。',
    explain:`把 x=0 代入 ${eqText}，得 ${b===1?'':b}y=${c}，解得 y=${y0}，交點為 (0, ${y0})。`};
}
function genOnLine(M){
  const {a,b,c,x0,y0}=genLineEq(M);
  const eqText=fmtEqGen(a,b,c);
  const onLineFlag=Math.random()<0.5;
  const loX=Math.min(0,x0)-2,hiX=Math.max(0,x0)+2;
  const loY=Math.min(0,y0)-2,hiY=Math.max(0,y0)+2;
  let px,py;
  if(onLineFlag){
    const hit=findIntOn(loX,hiX,x=>{const rem=c-a*x;return Number.isInteger(rem/b)?rem/b:null;});
    if(hit){px=hit.x;py=hit.y;}else{px=x0;py=0;}
  }else{
    px=R(loX,hiX);py=R(loY,hiY);
    if(a*px+b*py===c)py+=1;
  }
  const check=a*px+b*py;
  const svg=svgGrid({lines:[{a,b,c,color:'#d24a33'}],points:[{x:px,y:py,label:'Q',color:'#2f6fb5'}]});
  const text=`點 Q (${px}, ${py}) 是否在直線 ${eqText} 上？`;
  const ans=check===c?'是，在直線上':'不是，不在直線上';
  return {text,svg,ans,options:['是，在直線上','不是，不在直線上','需要更多資訊','無法判斷'],
    hint:'把點的 x、y 值代入方程式，看看等號兩邊算出來是否相等。',
    explain:`代入得 ${a===1?'':a}×${px} + ${b===1?'':b}×${py} = ${check}，${check===c?`剛好等於 ${c}，所以在直線上`:`不等於 ${c}，所以不在直線上`}。`};
}
function genFindPoint(M){
  const {a,b,c,x0,y0}=genLineEq(M);
  const eqText=fmtEqGen(a,b,c);
  const giveX=Math.random()<0.5;
  const loX=Math.min(0,x0)-4,hiX=Math.max(0,x0)+4;
  const loY=Math.min(0,y0)-4,hiY=Math.max(0,y0)+4;
  if(giveX){
    const hit=findIntOn(loX,hiX,x=>{const rem=c-a*x;return Number.isInteger(rem/b)?rem/b:null;});
    const x=hit?hit.x:0,y=hit?hit.y:c/b;
    const text=`直線 ${eqText} 上有一點，x 坐標是 ${x}，求這一點的 y 坐標。`;
    const ans=String(y);
    return {text,ans,options:ensure4(ans,[String(y+1),String(y-1),String(y+2)]),
      hint:'把已知的 x 值代入方程式，解出 y。',explain:`代入 x=${x}：${a===1?'':a===-1?'-':a}×${x} + ${b===1?'':b===-1?'-':b}y = ${c}，解得 y = ${y}。`};
  }else{
    const hit=findIntOn(loY,hiY,y=>{const rem=c-b*y;return Number.isInteger(rem/a)?rem/a:null;});
    const y=hit?hit.x:0,x=hit?hit.y:c/a;
    const text=`直線 ${eqText} 上有一點，y 坐標是 ${y}，求這一點的 x 坐標。`;
    const ans=String(x);
    return {text,ans,options:ensure4(ans,[String(x+1),String(x-1),String(x+2)]),
      hint:'把已知的 y 值代入方程式，解出 x。',explain:`代入 y=${y}：${a===1?'':a===-1?'-':a}x + ${b===1?'':b===-1?'-':b}×${y} = ${c}，解得 x = ${x}。`};
  }
}
function gen(t){
  const M=MODES[mode];
  if(t==='xIntercept')return genXIntercept(M);
  if(t==='yIntercept')return genYIntercept(M);
  if(t==='onLine')return genOnLine(M);
  return genFindPoint(M);
}

return {plan:['xIntercept','yIntercept','onLine','findPoint','xIntercept','findPoint','onLine','yIntercept','findPoint','onLine'],gen:function(t,m){mode=m;return gen(t);}};
})();

JB2.stages['2-2-2']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
function ensure4(ans,cands){
  const s=new Set([ans]);
  for(const c of cands){const cs=String(c);if(s.size<4&&cs!==ans&&cs.trim()!=='')s.add(cs);}
  /* 誘答選項不夠時：答案不是純數字就「改動答案裡的一個數字」補齊（例如 (5, 5)→(5, 4)），不再塞無關的 -5、6 */
  if(s.size<4&&!/^-?\d+(\.\d+)?$/.test(String(ans))){
    const str=String(ans),vars=[],re=/\d+(?:\.\d+)?/g;let mm;
    while((mm=re.exec(str))!==null){for(const d of [1,-1,2,-2,3,-3]){const nv=Number(mm[0])+d;if(nv<0)continue;const dec=(mm[0].split('.')[1]||'').length;vars.push(str.slice(0,mm.index)+(dec?nv.toFixed(dec):nv)+str.slice(mm.index+mm[0].length));}}
    for(let i=vars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[vars[i],vars[j]]=[vars[j],vars[i]];}
    for(const v of vars){if(s.size>=4)break;if(!s.has(v))s.add(v);}
  }
  let g=1;
  while(s.size<4){const v=(Number(ans)||0)+(g%2===0?g/2+5:-(Math.ceil(g/2)+4));const vs=String(v);if(!s.has(vs))s.add(vs);g++;}
  return sh([...s]);
}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);return b?gcd(b,a%b):(a||1)}
function lcm(a,b){return Math.abs(a*b)/gcd(a,b)}
/* 坐標平面 SVG 繪圖工具：points 畫點、lines 畫 ax+by=c 直線、dashedTo 畫到兩軸的虛線 */
function lineSegPoints(a,b,c,R2){
  const pts=[];
  if(b!==0){[-R2,R2].forEach(x=>{const y=(c-a*x)/b;if(y>=-R2-0.0001&&y<=R2+0.0001)pts.push([x,y]);});}
  if(a!==0){[-R2,R2].forEach(y=>{const x=(c-b*y)/a;if(x>=-R2-0.0001&&x<=R2+0.0001)pts.push([x,y]);});}
  if(pts.length<2)return null;
  pts.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);
  return [pts[0],pts[pts.length-1]];
}
function svgGrid(opts){
  const RG=opts.range||7,S=260,C=S/2,U=(S-36)/(2*RG);
  const toX=x=>C+x*U,toY=y=>C-y*U;
  let g=`<div class="qsvg"><svg viewBox="0 0 ${S} ${S}" style="width:100%;max-width:260px;background:#fff;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  for(let i=-RG;i<=RG;i++){
    g+=`<line x1="${toX(i)}" y1="${toY(-RG)}" x2="${toX(i)}" y2="${toY(RG)}" stroke="#e3e3e3" stroke-width="1"/>`;
    g+=`<line x1="${toX(-RG)}" y1="${toY(i)}" x2="${toX(RG)}" y2="${toY(i)}" stroke="#e3e3e3" stroke-width="1"/>`;
  }
  g+=`<line x1="${toX(-RG)}" y1="${toY(0)}" x2="${toX(RG)}" y2="${toY(0)}" stroke="#333" stroke-width="2"/>`;
  g+=`<line x1="${toX(0)}" y1="${toY(-RG)}" x2="${toX(0)}" y2="${toY(RG)}" stroke="#333" stroke-width="2"/>`;
  g+=`<text x="${toX(RG)-10}" y="${toY(0)-6}" font-size="12" fill="#333">x</text><text x="${toX(0)+6}" y="${toY(RG)+12}" font-size="12" fill="#333">y</text>`;
  (opts.lines||[]).forEach(ln=>{
    const pts=lineSegPoints(ln.a,ln.b,ln.c,RG);
    if(pts)g+=`<line x1="${toX(pts[0][0])}" y1="${toY(pts[0][1])}" x2="${toX(pts[1][0])}" y2="${toY(pts[1][1])}" stroke="${ln.color||'#d24a33'}" stroke-width="2.5"/>`;
  });
  (opts.dashedTo||[]).forEach(p=>{
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(p.x)}" y2="${toY(0)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(0)}" y2="${toY(p.y)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
  });
  (opts.points||[]).forEach(p=>{
    g+=`<circle cx="${toX(p.x)}" cy="${toY(p.y)}" r="4.5" fill="${p.color||'#d24a33'}"/>`;
    if(p.label)g+=`<text x="${toX(p.x)+6}" y="${toY(p.y)-6}" font-size="12" font-weight="700" fill="${p.color||'#d24a33'}">${p.label}</text>`;
  });
  g+='</svg></div>';
  return g;
}
function fmtEq(a,b,c){
  return (a===1?'':a)+'x + '+(b===1?'':b)+'y = '+c;
}
function fmtEqGen(a,b,c){
  let s=(a===1?'':a===-1?'-':a)+'x';
  s+=b>=0?' + '+(b===1?'':b)+'y':' - '+(Math.abs(b)===1?'':Math.abs(b))+'y';
  s+=' = '+c;
  return s;
}
const QUADS=['第一象限','第二象限','第三象限','第四象限'];
function quadName(x,y){
  if(x===0&&y===0)return '原點（不屬於任何象限）';
  if(x===0)return 'y 軸上（不屬於任何象限）';
  if(y===0)return 'x 軸上（不屬於任何象限）';
  if(x>0&&y>0)return '第一象限';
  if(x<0&&y>0)return '第二象限';
  if(x<0&&y<0)return '第三象限';
  return '第四象限';
}
const MODES={easy:{t:0,max:5},real:{t:15,max:6},hard:{t:10,max:7}};
const PLAN=['identifyType','throughPoint','writeEq','axisEq','identifyType','throughPoint','writeEq','identifyType','throughPoint','axisEq'];

function signK(M){
  if(mode==='easy')return R(1,M.max);
  return R(1,M.max)*(Math.random()<0.5?1:-1);
}
function genIdentifyType0(M){
  const isY=Math.random()<0.5;
  const k=signK(M);
  const eq=isY?`y = ${k}`:`x = ${k}`;
  const svg=isY?svgGrid({lines:[{a:0,b:1,c:k,color:'#d24a33'}]}):svgGrid({lines:[{a:1,b:0,c:k,color:'#2f6fb5'}]});
  const text=`巨像的盾牌方程式是 ${eq}，牠的圖形是水平線還是鉛垂線（垂直線）？`;
  const ans=isY?'水平線（平行 x 軸）':'鉛垂線（平行 y 軸）';
  return {text,svg,ans,options:['水平線（平行 x 軸）','鉛垂線（平行 y 軸）','通過原點的斜線','無法判斷'],
    hint:'y = 數字 是「橫著走」的水平線；x = 數字 是「豎著站」的鉛垂線。',
    explain:`${eq} 中${isY?'每一點的 y 坐標都固定是 '+k:'每一點的 x 坐標都固定是 '+k}，所以是${ans}，通過${isY?`(0, ${k})`:`(${k}, 0)`}。`};
}
function randNe(max,...forbid){
  let v;do{v=R(1,max)*(Math.random()<0.5?1:-1);}while(forbid.includes(v));
  return v;
}
const TS=(say,hint,ok,wrong,line)=>({say,hint,ok,wrong:wrong||[],line:line||''});

function genIdentifyType(M){
  const r=Math.random();
  if(r<0.3)return genIdentifyType0(M);
  const isY=Math.random()<0.5,k=signK(M),v=isY?'y':'x',other=isY?'x':'y';
  const svg=isY?svgGrid({lines:[{a:0,b:1,c:k,color:'#d24a33'}]}):svgGrid({lines:[{a:1,b:0,c:k,color:'#2f6fb5'}]});
  const ans=isY?'水平線（平行 x 軸）':'鉛垂線（平行 y 軸）';
  let eq,step1;
  if(r<0.65){ // 係數在前：m y = m k
    const m=pick([2,3,4]);eq=`${m}${v} = ${m*k}`;
    step1=TS(`<b>${eq}</b> 兩邊同除以 ${m}，會變成？`,`兩邊都除以 ${m}。`,`${v} = ${k}`,[[`${v} = ${m*k}`,'兩邊都要除，右邊也要變。'],[`${v} = ${m*k*m}`,'是「除以」，不是乘。']],`${v} = ${k}`);
  }else{ // 移項型：v − k = 0 / v + k = 0
    eq=k>0?`${v} − ${k} = 0`:`${v} + ${-k} = 0`;
    step1=TS(`<b>${eq}</b> 移項之後，會變成？`,'把常數移到等號右邊，要變號。',`${v} = ${k}`,[[`${v} = ${-k}`,'移項要變號，正負弄反了。'],[`${v} = 0`,'常數也要算進去喔。']],`${v} = ${k}`);
  }
  const tutor=[step1,TS(`${v} = ${k} 表示所有點的哪一個坐標都固定是 ${k}？`,'看等號左邊的字母。',`${v} 坐標`,[[`${other} 坐標`,`式子裡寫的是 ${v}。`]],`${v} 固定`),
    TS(`${v} 固定、${other} 自由變，這些點連起來是什麼線？`,isY?'y 固定：高度一樣，橫著走。':'x 固定：左右位置一樣，直直站。',isY?'水平線':'鉛垂線',[[isY?'鉛垂線':'水平線','換個方向想：固定的是哪一個坐標？']],isY?'水平線':'鉛垂線')];
  const why={'水平線（平行 x 軸）':'y 固定時才是水平線。','鉛垂線（平行 y 軸）':'x 固定時才是鉛垂線。','通過原點的斜線':'這種式子只有一個字母，不是斜線。','無法判斷':'化簡之後就能判斷。'};
  return {text:`巨像的盾牌方程式是 ${eq}，牠的圖形是水平線還是鉛垂線（垂直線）？`,svg,ans,options:['水平線（平行 x 軸）','鉛垂線（平行 y 軸）','通過原點的斜線','無法判斷'],tutor,why,
    hint:'先把式子化成「y = 數字」或「x = 數字」，再判斷。',explain:`${eq} 化簡後是 ${v} = ${k}，${v} 坐標固定，所以是${ans}。`};
}
function genAxisEq(M){
  const r=Math.random();
  if(r<0.2)return genAxisEq0(M);
  if(r<0.4){ // 方程式 x=0／y=0 的圖形（小老師已有對應步驟）
    const isX=Math.random()<0.5,v=isX?'x':'y',ans=isX?'y 軸':'x 軸';
    return {text:`方程式 ${v} = 0 的圖形是哪一條線？`,ans,options:['x 軸','y 軸','原點','通過原點的斜線'],
      hint:`${v} = 0 表示所有點的 ${v} 坐標都是 0。`,explain:`${v} 坐標都是 0 的點連起來就是${ans}。`};
  }
  if(r<0.7){ // 水平線／鉛垂線 和坐標軸的關係
    const isY=Math.random()<0.5,k=R(-M.max,M.max),axis=isY?'x 軸':'y 軸',v=isY?'y':'x';
    const side=isY?(k>0?'上方':'下方'):(k>0?'右邊':'左邊');
    const ans=k===0?`剛好就是 ${axis}（重合）`:`平行 ${axis}，在 ${axis}的${side} ${Math.abs(k)} 格`;
    const tutor=[TS(`${v} = ${k} 的意思是：所有點的 ${v} 坐標都是 ${k}。這個 ${k} 離 0 有幾格？`,'看數字離 0 多遠。',String(Math.abs(k)),[[String(Math.abs(k)+1),'再數一次。']],`${v} = ${k}`),
      TS(k===0?`${v} 坐標是 0，在哪裡？`:`${k>0?'正數':'負數'}要往哪一邊走？`,isY?'y：正在上、負在下。':'x：正在右、負在左。',k===0?`就在 ${axis} 上`:side,k===0?[['在 '+axis+' 旁邊','0 就是軸本身。']]:[[isY?(k>0?'下方':'上方'):(k>0?'左邊':'右邊'),'正負方向弄反了。']],'')];
    const wrongs=[`平行 ${axis}，在 ${axis}的${isY?'下方':'左邊'} ${Math.abs(k)||1} 格`,`平行 ${axis}，在 ${axis}的${isY?'上方':'右邊'} ${Math.abs(k)||1} 格`,`垂直於 ${axis}`,`剛好就是 ${axis}（重合）`].filter(o=>o!==ans);
    return {text:`方程式 ${v} = ${k} 的圖形和${axis}的關係是？`,ans,options:ensure4(ans,wrongs),tutor,
      hint:`${v} = 常數 的圖形是${isY?'水平線':'鉛垂線'}，它和另一條軸垂直、和${axis}平行。`,explain:`${v} = ${k}：${k===0?`就是${axis}本身`:`是${isY?'水平線':'鉛垂線'}，平行${axis}，在${side}${Math.abs(k)}格`}。`};
  }
  // 與軸的交點
  const isY=Math.random()<0.5,k=randNe(M.max),eq=isY?`y = ${k}`:`x = ${k}`;
  const ans=isY?`(0, ${k})`:`(${k}, 0)`,axis=isY?'y 軸':'x 軸';
  const tutor=[TS(`${axis}上的點，哪一個坐標一定是 0？`,isY?'y 軸是直的，在它上面 x 坐標是 0。':'x 軸是橫的，在它上面 y 坐標是 0。',isY?'x 坐標':'y 坐標',[[isY?'y 坐標':'x 坐標','看看軸的位置：在軸上的那個方向坐標是 0。']],isY?'x = 0':'y = 0'),
    TS(`直線 ${eq} 規定另一個坐標是 ${k}，所以交點是？`,'x 在前、y 在後。',ans,[[isY?`(${k}, 0)`:`(0, ${k})`,'x、y 放反位置了。']],ans)];
  return {text:`${isY?'水平線':'鉛垂線'} ${eq} 和 ${axis} 相交，交點坐標是？`,ans,options:ensure4(ans,[isY?`(${k}, 0)`:`(0, ${k})`,`(${k}, ${k})`,`(0, 0)`]),tutor,
    hint:`交點同時在${axis}上，也在 ${eq} 上。`,explain:`在${axis}上 ${isY?'x':'y'} 坐標是 0，又 ${eq}，所以交點是 ${ans}。`};
}
function genThroughPoint(M){
  // 這一題要小心：y=k（水平線）上，x 可以是「任何數」；x=k（鉛垂線）上，y 可以是「任何數」。
  // 所以錯誤選項一定要讓「固定的那個坐標」錯掉，不能只是把另一個坐標改掉，否則那個點其實也在直線上！
  // 三個干擾數字都特別避開跟 k 相同、避開彼此相同，確保四個選項不會重複、也不會意外剛好也在直線上。
  const isY=Math.random()<0.5;
  const k=signK(M);
  const eq=isY?`y = ${k}`:`x = ${k}`;
  const other=randNe(M.max,k);
  const other2=randNe(M.max,k);
  let other3=randNe(M.max,k);
  while(other3===other2)other3=randNe(M.max,k);
  const svg=isY?svgGrid({lines:[{a:0,b:1,c:k,color:'#d24a33'}]}):svgGrid({lines:[{a:1,b:0,c:k,color:'#2f6fb5'}]});
  const ans=isY?`(${other}, ${k})`:`(${k}, ${other})`;
  const wrong1=isY?`(${k}, ${other})`:`(${other}, ${k})`;         // 常見迷思：把 x、y 該固定的坐標搞反
  const wrong2=isY?`(${other2}, ${-k})`:`(${-k}, ${other2})`;      // 固定坐標的正負號搞反
  const wrong3=isY?`(${other3}, ${-k})`:`(${-k}, ${other3})`;      // 固定坐標的正負號搞反（換一組數字）
  const text=`下列哪一個點會落在直線 ${eq} 上？`;
  return {text,svg,ans,options:sh([ans,wrong1,wrong2,wrong3]),
    hint:isY?'y = 常數的直線上，所有點的 y 坐標都要等於那個常數，x 可以是任何數。':'x = 常數的直線上，所有點的 x 坐標都要等於那個常數，y 可以是任何數。',
    explain:`${eq} 上的點，${isY?'y':'x'} 坐標都固定是 ${k}，${isY?'x':'y'} 坐標可以是任何數，所以 ${ans} 符合。`};
}
function genWriteEq(M){
  const isY=Math.random()<0.5;
  const k=signK(M);
  const other=R(1,M.max);
  const text=isY?`一條水平線通過點 (${other}, ${k})，它的方程式是？`:`一條鉛垂線通過點 (${k}, ${other})，它的方程式是？`;
  const ans=isY?`y = ${k}`:`x = ${k}`;
  const wrong1=isY?`x = ${k}`:`y = ${k}`;
  const wrong2=isY?`y = ${-k}`:`x = ${-k}`;
  const wrong3=`x + y = ${k}`;
  return {text,ans,options:ensure4(ans,[wrong1,wrong2,wrong3]),
    hint:'水平線上所有點的 y 坐標都相同；鉛垂線上所有點的 x 坐標都相同。',
    explain:`${isY?'水平線方程式是「y = 該點的 y 坐標」':'鉛垂線方程式是「x = 該點的 x 坐標」'}，所以是 ${ans}。`};
}
function genAxisEq0(M){
  const askX=Math.random()<0.5;
  const text=askX?'x 軸本身其實也可以用一個方程式表示，請問是什麼？':'y 軸本身其實也可以用一個方程式表示，請問是什麼？';
  const ans=askX?'y = 0':'x = 0';
  return {text,ans,options:['y = 0','x = 0','x = y','xy = 0'],
    hint:'x 軸上每一點的 y 坐標都是 0；y 軸上每一點的 x 坐標都是 0。',
    explain:`${askX?'x 軸就是 y 恆等於 0 的水平線，方程式為 y = 0':'y 軸就是 x 恆等於 0 的鉛垂線，方程式為 x = 0'}。`};
}
function gen(t){
  const M=MODES[mode];
  if(t==='identifyType')return genIdentifyType(M);
  if(t==='throughPoint')return genThroughPoint(M);
  if(t==='writeEq')return genWriteEq(M);
  return genAxisEq(M);
}
/* ===== 題庫擴充：同一題型多幾種問法，避免一直遇到同一題 ===== */
(function(){
  const _g=gen;
  const mk=(text,ans,wrongs,hint,explain)=>({text,ans,options:ensure4(ans,wrongs),hint,explain});
  const BANK={};
  {const L=[
    ['x 軸本身其實也可以用一個方程式表示，請問是什麼？','y = 0',['x = 0','x = y','xy = 0'],'x 軸上每一點的 y 坐標都是 0。','x 軸就是 y 恆等於 0 的水平線，方程式為 y = 0。'],
    ['y 軸本身其實也可以用一個方程式表示，請問是什麼？','x = 0',['y = 0','x = y','xy = 0'],'y 軸上每一點的 x 坐標都是 0。','y 軸就是 x 恆等於 0 的鉛垂線，方程式為 x = 0。'],
    ['方程式 y = 0 的圖形是哪一條線？','x 軸',['y 軸','通過原點的斜線','不存在'],'y 恆等於 0 的點，都落在 x 軸上。','y = 0 的圖形就是 x 軸。'],
    ['方程式 x = 0 的圖形是哪一條線？','y 軸',['x 軸','通過原點的斜線','不存在'],'x 恆等於 0 的點，都落在 y 軸上。','x = 0 的圖形就是 y 軸。'],
    ['x 軸與 y 軸相交在哪一點？','原點 (0, 0)',['(1, 1)','(0, 1)','(1, 0)'],'兩條軸的交點就是原點。','x 軸與 y 軸交於原點 (0, 0)。']];BANK['axisEq']={p:.3,make:()=>{const e=pick(L);return mk(e[0],e[1],e[2],e[3],e[4]);}};}

  gen=function(t){const B=BANK[t];if(B&&Math.random()<B.p){return B.make();}return _g.apply(this,arguments);};
})();

return {plan:['identifyType','throughPoint','writeEq','axisEq','identifyType','throughPoint','writeEq','identifyType','throughPoint','axisEq'],gen:function(t,m){mode=m;return gen(t);}};
})();

JB2.stages['2-2-3']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
function ensure4(ans,cands){
  const s=new Set([ans]);
  for(const c of cands){const cs=String(c);if(s.size<4&&cs!==ans&&cs.trim()!=='')s.add(cs);}
  /* 誘答選項不夠時：答案不是純數字就「改動答案裡的一個數字」補齊（例如 (5, 5)→(5, 4)），不再塞無關的 -5、6 */
  if(s.size<4&&!/^-?\d+(\.\d+)?$/.test(String(ans))){
    const str=String(ans),vars=[],re=/\d+(?:\.\d+)?/g;let mm;
    while((mm=re.exec(str))!==null){for(const d of [1,-1,2,-2,3,-3]){const nv=Number(mm[0])+d;if(nv<0)continue;const dec=(mm[0].split('.')[1]||'').length;vars.push(str.slice(0,mm.index)+(dec?nv.toFixed(dec):nv)+str.slice(mm.index+mm[0].length));}}
    for(let i=vars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[vars[i],vars[j]]=[vars[j],vars[i]];}
    for(const v of vars){if(s.size>=4)break;if(!s.has(v))s.add(v);}
  }
  let g=1;
  while(s.size<4){const v=(Number(ans)||0)+(g%2===0?g/2+5:-(Math.ceil(g/2)+4));const vs=String(v);if(!s.has(vs))s.add(vs);g++;}
  return sh([...s]);
}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);return b?gcd(b,a%b):(a||1)}
function lcm(a,b){return Math.abs(a*b)/gcd(a,b)}
/* 坐標平面 SVG 繪圖工具：points 畫點、lines 畫 ax+by=c 直線、dashedTo 畫到兩軸的虛線 */
function lineSegPoints(a,b,c,R2){
  const pts=[];
  if(b!==0){[-R2,R2].forEach(x=>{const y=(c-a*x)/b;if(y>=-R2-0.0001&&y<=R2+0.0001)pts.push([x,y]);});}
  if(a!==0){[-R2,R2].forEach(y=>{const x=(c-b*y)/a;if(x>=-R2-0.0001&&x<=R2+0.0001)pts.push([x,y]);});}
  if(pts.length<2)return null;
  pts.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);
  return [pts[0],pts[pts.length-1]];
}
function svgGrid(opts){
  const RG=opts.range||7,S=260,C=S/2,U=(S-36)/(2*RG);
  const toX=x=>C+x*U,toY=y=>C-y*U;
  let g=`<div class="qsvg"><svg viewBox="0 0 ${S} ${S}" style="width:100%;max-width:260px;background:#fff;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  for(let i=-RG;i<=RG;i++){
    g+=`<line x1="${toX(i)}" y1="${toY(-RG)}" x2="${toX(i)}" y2="${toY(RG)}" stroke="#e3e3e3" stroke-width="1"/>`;
    g+=`<line x1="${toX(-RG)}" y1="${toY(i)}" x2="${toX(RG)}" y2="${toY(i)}" stroke="#e3e3e3" stroke-width="1"/>`;
  }
  g+=`<line x1="${toX(-RG)}" y1="${toY(0)}" x2="${toX(RG)}" y2="${toY(0)}" stroke="#333" stroke-width="2"/>`;
  g+=`<line x1="${toX(0)}" y1="${toY(-RG)}" x2="${toX(0)}" y2="${toY(RG)}" stroke="#333" stroke-width="2"/>`;
  g+=`<text x="${toX(RG)-10}" y="${toY(0)-6}" font-size="12" fill="#333">x</text><text x="${toX(0)+6}" y="${toY(RG)+12}" font-size="12" fill="#333">y</text>`;
  (opts.lines||[]).forEach(ln=>{
    const pts=lineSegPoints(ln.a,ln.b,ln.c,RG);
    if(pts)g+=`<line x1="${toX(pts[0][0])}" y1="${toY(pts[0][1])}" x2="${toX(pts[1][0])}" y2="${toY(pts[1][1])}" stroke="${ln.color||'#d24a33'}" stroke-width="2.5"/>`;
  });
  (opts.dashedTo||[]).forEach(p=>{
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(p.x)}" y2="${toY(0)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(0)}" y2="${toY(p.y)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
  });
  (opts.points||[]).forEach(p=>{
    g+=`<circle cx="${toX(p.x)}" cy="${toY(p.y)}" r="4.5" fill="${p.color||'#d24a33'}"/>`;
    if(p.label)g+=`<text x="${toX(p.x)+6}" y="${toY(p.y)-6}" font-size="12" font-weight="700" fill="${p.color||'#d24a33'}">${p.label}</text>`;
  });
  g+='</svg></div>';
  return g;
}
function fmtEq(a,b,c){
  return (a===1?'':a)+'x + '+(b===1?'':b)+'y = '+c;
}
function fmtEqGen(a,b,c){
  let s=(a===1?'':a===-1?'-':a)+'x';
  s+=b>=0?' + '+(b===1?'':b)+'y':' - '+(Math.abs(b)===1?'':Math.abs(b))+'y';
  s+=' = '+c;
  return s;
}
const QUADS=['第一象限','第二象限','第三象限','第四象限'];
function quadName(x,y){
  if(x===0&&y===0)return '原點（不屬於任何象限）';
  if(x===0)return 'y 軸上（不屬於任何象限）';
  if(y===0)return 'x 軸上（不屬於任何象限）';
  if(x>0&&y>0)return '第一象限';
  if(x<0&&y>0)return '第二象限';
  if(x<0&&y<0)return '第三象限';
  return '第四象限';
}
const MODES={easy:{t:0,max:4},real:{t:15,max:5},hard:{t:10,max:6}};
const PLAN=['intersect','area','interpret','intersect','area','intersect','interpret','area','intersect','interpret'];

function pickLine(x0,y0){
  let a,b;
  do{a=R(1,3)*(Math.random()<0.3?-1:1);b=R(1,3)*(Math.random()<0.3?-1:1);}while(a===0&&b===0);
  const c=a*x0+b*y0;
  return {a,b,c};
}
function genLines(M){
  let x0=R(-M.max,M.max),y0=R(-M.max,M.max);
  if(mode==='easy'){x0=R(1,M.max);y0=R(1,M.max);}
  let L1=pickLine(x0,y0),L2=pickLine(x0,y0),tries=0;
  while(L1.a*L2.b===L2.a*L1.b&&tries<10){L2=pickLine(x0,y0);tries++;}
  return {x0,y0,L1,L2};
}
function genIntersect(M){
  const {x0,y0,L1,L2}=genLines(M);
  const eq1=fmtEqGen(L1.a,L1.b,L1.c),eq2=fmtEqGen(L2.a,L2.b,L2.c);
  const svg=svgGrid({range:8,lines:[{a:L1.a,b:L1.b,c:L1.c,color:'#d24a33'},{a:L2.a,b:L2.b,c:L2.c,color:'#2f6fb5'}],points:[{x:x0,y:y0,label:'交點',color:'#161a2e'}]});
  const text=`交點幾何獸釋放兩條光束直線：①${eq1}　②${eq2}，兩條光束的交點就是幾何獸的命門！請求出交點坐標。`;
  const ans=`(${x0}, ${y0})`;
  const wrong1=`(${y0}, ${x0})`,wrong2=`(${x0+1}, ${y0})`,wrong3=`(${x0}, ${y0-1})`;
  return {text,svg,ans,options:ensure4(ans,[wrong1,wrong2,wrong3]),
    hint:'兩條直線的交點，就是同時滿足①式與②式的聯立方程式解，用代入法或加減法解解看！',
    explain:`解聯立方程式①②，可以求得交點為 (${x0}, ${y0})，這一點同時在兩條直線上，所以能一擊必殺！`};
}
function genInterpret0(){
  const variants=[
    {text:'兩條直線的交點坐標，和這兩條直線所組成的二元一次聯立方程式，有什麼關係？',
     ans:'交點坐標就是聯立方程式的解',
     opts:['交點坐標就是聯立方程式的解','交點與聯立方程式沒有關係','交點只能用來畫圖，不能拿來求解','交點坐標一定是 (0, 0)']},
    {text:'如果一個二元一次聯立方程式的解是 (3, 5)，這在圖形上代表什麼意思？',
     ans:'兩條直線的圖形都會通過 (3, 5)，並在該點相交',
     opts:['兩條直線的圖形都會通過 (3, 5)，並在該點相交','只有一條直線會通過 (3, 5)','(3, 5) 是原點的另一個名稱','兩條直線在 (3, 5) 處互相平行，不會相交']}
  ];
  const v=pick(variants);
  return {text:v.text,ans:v.ans,options:sh(v.opts.slice()),
    hint:'聯立方程式的解，要同時滿足兩個方程式，所以在圖形上就是兩條直線「都會經過」的那一點。',
    explain:'二元一次聯立方程式的解 (x, y)，在幾何上就是這兩條直線圖形的交點坐標。'};
}

function genInterpret(){
  const r=Math.random();
  if(r<0.15)return genInterpret0();
  let v;
  if(r<0.45){const p=R(1,9),q=R(1,9);
    v={text:`如果一個二元一次聯立方程式的解是 (${p}, ${q})，這在圖形上代表什麼意思？`,ans:`兩條直線都會通過 (${p}, ${q})，並在該點相交`,
      opts:[`兩條直線都會通過 (${p}, ${q})，並在該點相交`,`只有一條直線會通過 (${p}, ${q})`,`(${p}, ${q}) 是原點的另一個名稱`,`兩條直線在 (${p}, ${q}) 處互相平行，不會相交`]};}
  else if(r<0.62)v={text:'兩條直線完全重合時，它們所組成的聯立方程式有幾組解？',ans:'無限多組解',opts:['無限多組解','剛好 1 組解','沒有解','剛好 2 組解']};
  else if(r<0.78)v={text:'兩條不平行的直線，它們的交點會有幾個？',ans:'剛好 1 個',opts:['剛好 1 個','沒有交點','2 個','無限多個']};
  else if(r<0.9)v={text:'兩條平行（但不重合）的直線所組成的聯立方程式，解是什麼情況？',ans:'沒有解',opts:['沒有解','剛好 1 組解','無限多組解','剛好 2 組解']};
  else{const a=R(-5,9),b=R(-5,9);
    v={text:`兩條直線的交點坐標是 (${a}, ${b})，那麼這兩條直線所組成的聯立方程式，x、y 的解分別是多少？`,ans:`x = ${a}，y = ${b}`,opts:[`x = ${a}，y = ${b}`,`x = ${b}，y = ${a}`,`x = ${-a}，y = ${b}`,`x = ${a}，y = ${-b}`]};}
  const seen={},opts=v.opts.filter(o=>!seen[o]&&(seen[o]=1));
  while(opts.length<4)opts.push('以上皆非'+opts.length);
  return {text:v.text,ans:v.ans,options:sh(opts),
    hint:'聯立方程式的解，要同時滿足兩個方程式，所以在圖形上就是兩條直線「都會經過」的那一點。',
    explain:'二元一次聯立方程式的解 (x, y)，在幾何上就是這兩條直線圖形的交點坐標；平行無交點＝無解，重合＝無限多組解。'};
}
function genLineEqPositive(M){
  const x0=R(2,M.max+2),y0=R(2,M.max+2);
  const L=lcm(x0,y0),kk=pick([1,2]);
  const a=L/x0*kk,b=L/y0*kk,c=L*kk;
  return {a,b,c,x0,y0};
}
function genArea(M){
  const {a,b,c,x0,y0}=genLineEqPositive(M);
  const eqText=fmtEq(a,b,c);
  const svg=svgGrid({range:9,lines:[{a,b,c,color:'#d24a33'}],points:[{x:x0,y:0,label:'',color:'#d24a33'},{x:0,y:y0,label:'',color:'#d24a33'}]});
  const area=(x0*y0)/2;
  const text=`直線 ${eqText} 與 x 軸、y 軸分別交於兩點，這條直線與兩坐標軸所圍成的三角形面積是多少？`;
  const ans=Number.isInteger(area)?String(area):area.toFixed(1);
  const wrong1=String(x0*y0),wrong2=String(x0+y0),wrong3=Number.isInteger(area)?String(area+1):(area+1).toFixed(1);
  return {text,svg,ans,options:ensure4(ans,[wrong1,wrong2,wrong3]),
    hint:'三角形面積 = 底 × 高 ÷ 2，底和高分別就是這條直線的 x 截距與 y 截距（到原點的距離）。',
    explain:`x 截距為 ${x0}，y 截距為 ${y0}，三角形面積 = ${x0} × ${y0} ÷ 2 = ${ans}。`};
}
function gen(t){
  const M=MODES[mode];
  if(t==='intersect')return genIntersect(M);
  if(t==='area')return genArea(M);
  return genInterpret();
}
/* ===== 題庫擴充：同一題型多幾種問法，避免一直遇到同一題 ===== */
(function(){
  const _g=gen;
  const mk=(text,ans,wrongs,hint,explain)=>({text,ans,options:ensure4(ans,wrongs),hint,explain});
  const BANK={};
  {const L=[
    ['兩條直線的交點坐標，和這兩條直線所組成的二元一次聯立方程式，有什麼關係？','交點坐標就是聯立方程式的解',['交點與聯立方程式沒有關係','交點只能用來畫圖，不能拿來求解','交點坐標一定是 (0, 0)'],'聯立方程式的解要同時滿足兩個方程式。','交點同時在兩條直線上，所以是聯立方程式的解。'],
    ['如果兩條直線互相平行（而且不重合），它們所組成的聯立方程式會是什麼情況？','沒有解',['恰有一組解','恰有兩組解','有無限多組解'],'平行線不會相交。','平行不重合的兩條直線沒有交點，所以聯立方程式無解。'],
    ['如果兩條直線完全重合，它們所組成的聯立方程式會是什麼情況？','有無限多組解',['恰有一組解','沒有解','恰有兩組解'],'重合的直線每一點都是共同點。','兩直線重合時，每一個點都同時滿足兩個方程式，所以有無限多組解。'],
    ['兩條不平行的直線，交點有幾個？','恰好 1 個',['0 個','2 個','無限多個'],'不平行的兩條直線一定會相交在一點。','兩條不平行的直線恰交於一點。']];BANK['interpret']={p:.3,make:()=>{const e=pick(L);return mk(e[0],e[1],e[2],e[3],e[4]);}};}

  gen=function(t){const B=BANK[t];if(B&&Math.random()<B.p){return B.make();}return _g.apply(this,arguments);};
})();

return {plan:['intersect','area','interpret','intersect','area','intersect','interpret','area','intersect','interpret'],gen:function(t,m){mode=m;return gen(t);}};
})();

JB2.stages['3-1-1']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
function ensure4(ans,cands){
  const s=new Set([ans]);
  for(const c of cands){const cs=String(c);if(s.size<4&&cs!==ans&&cs.trim()!=='')s.add(cs);}
  /* 誘答選項不夠時：答案不是純數字就「改動答案裡的一個數字」補齊（例如 (5, 5)→(5, 4)），不再塞無關的 -5、6 */
  if(s.size<4&&!/^-?\d+(\.\d+)?$/.test(String(ans))){
    const str=String(ans),vars=[],re=/\d+(?:\.\d+)?/g;let mm;
    while((mm=re.exec(str))!==null){for(const d of [1,-1,2,-2,3,-3]){const nv=Number(mm[0])+d;if(nv<0)continue;const dec=(mm[0].split('.')[1]||'').length;vars.push(str.slice(0,mm.index)+(dec?nv.toFixed(dec):nv)+str.slice(mm.index+mm[0].length));}}
    for(let i=vars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[vars[i],vars[j]]=[vars[j],vars[i]];}
    for(const v of vars){if(s.size>=4)break;if(!s.has(v))s.add(v);}
  }
  let g=1;
  while(s.size<4){const v=(Number(ans)||0)+(g%2===0?g/2+5:-(Math.ceil(g/2)+4));const vs=String(v);if(!s.has(vs))s.add(vs);g++;}
  return sh([...s]);
}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);return b?gcd(b,a%b):(a||1)}
function lcm(a,b){return Math.abs(a*b)/gcd(a,b)}
/* 坐標平面 SVG 繪圖工具：points 畫點、lines 畫 ax+by=c 直線、dashedTo 畫到兩軸的虛線 */
function lineSegPoints(a,b,c,R2){
  const pts=[];
  if(b!==0){[-R2,R2].forEach(x=>{const y=(c-a*x)/b;if(y>=-R2-0.0001&&y<=R2+0.0001)pts.push([x,y]);});}
  if(a!==0){[-R2,R2].forEach(y=>{const x=(c-b*y)/a;if(x>=-R2-0.0001&&x<=R2+0.0001)pts.push([x,y]);});}
  if(pts.length<2)return null;
  pts.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);
  return [pts[0],pts[pts.length-1]];
}
function svgGrid(opts){
  const RG=opts.range||7,S=260,C=S/2,U=(S-36)/(2*RG);
  const toX=x=>C+x*U,toY=y=>C-y*U;
  let g=`<div class="qsvg"><svg viewBox="0 0 ${S} ${S}" style="width:100%;max-width:260px;background:#fff;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  for(let i=-RG;i<=RG;i++){
    g+=`<line x1="${toX(i)}" y1="${toY(-RG)}" x2="${toX(i)}" y2="${toY(RG)}" stroke="#e3e3e3" stroke-width="1"/>`;
    g+=`<line x1="${toX(-RG)}" y1="${toY(i)}" x2="${toX(RG)}" y2="${toY(i)}" stroke="#e3e3e3" stroke-width="1"/>`;
  }
  g+=`<line x1="${toX(-RG)}" y1="${toY(0)}" x2="${toX(RG)}" y2="${toY(0)}" stroke="#333" stroke-width="2"/>`;
  g+=`<line x1="${toX(0)}" y1="${toY(-RG)}" x2="${toX(0)}" y2="${toY(RG)}" stroke="#333" stroke-width="2"/>`;
  g+=`<text x="${toX(RG)-10}" y="${toY(0)-6}" font-size="12" fill="#333">x</text><text x="${toX(0)+6}" y="${toY(RG)+12}" font-size="12" fill="#333">y</text>`;
  (opts.lines||[]).forEach(ln=>{
    const pts=lineSegPoints(ln.a,ln.b,ln.c,RG);
    if(pts)g+=`<line x1="${toX(pts[0][0])}" y1="${toY(pts[0][1])}" x2="${toX(pts[1][0])}" y2="${toY(pts[1][1])}" stroke="${ln.color||'#d24a33'}" stroke-width="2.5"/>`;
  });
  (opts.dashedTo||[]).forEach(p=>{
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(p.x)}" y2="${toY(0)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(0)}" y2="${toY(p.y)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
  });
  (opts.points||[]).forEach(p=>{
    g+=`<circle cx="${toX(p.x)}" cy="${toY(p.y)}" r="4.5" fill="${p.color||'#d24a33'}"/>`;
    if(p.label)g+=`<text x="${toX(p.x)+6}" y="${toY(p.y)-6}" font-size="12" font-weight="700" fill="${p.color||'#d24a33'}">${p.label}</text>`;
  });
  g+='</svg></div>';
  return g;
}
function fmtEq(a,b,c){
  return (a===1?'':a)+'x + '+(b===1?'':b)+'y = '+c;
}
function fmtEqGen(a,b,c){
  let s=(a===1?'':a===-1?'-':a)+'x';
  s+=b>=0?' + '+(b===1?'':b)+'y':' - '+(Math.abs(b)===1?'':Math.abs(b))+'y';
  s+=' = '+c;
  return s;
}
const QUADS=['第一象限','第二象限','第三象限','第四象限'];
function quadName(x,y){
  if(x===0&&y===0)return '原點（不屬於任何象限）';
  if(x===0)return 'y 軸上（不屬於任何象限）';
  if(y===0)return 'x 軸上（不屬於任何象限）';
  if(x>0&&y>0)return '第一象限';
  if(x<0&&y>0)return '第二象限';
  if(x<0&&y<0)return '第三象限';
  return '第四象限';
}
function coprimePair(max){
  let p,q;
  do{p=R(1,max);q=R(1,max);}while(gcd(p,q)!==1||p===q);
  return [p,q];
}
function fmtNum(n){
  if(Number.isInteger(n))return String(n);
  return String(Math.round(n*100)/100);
}
const MODES={easy:{t:0,maxRatio:5,maxK:4},real:{t:15,maxRatio:7,maxK:6},hard:{t:10,maxRatio:9,maxK:9}};
const PLAN=['simplify','value','word','equivalent','simplify','word','value','equivalent','word','simplify'];
const CONTEXTS=[['鮮奶','紅茶','毫升'],['蘋果汁','葡萄汁','毫升'],['麵粉','糖','公克'],['男生','女生','人'],['白米','糯米','公斤']];

function genSimplify(M){
  const p=coprimePair(M.maxRatio);
  const k=R(2,M.maxK);
  const a=p[0]*k,b=p[1]*k;
  const text=`比值化簡狐做出兩個數量：${a} 與 ${b}，請化成最簡整數比。`;
  const ans=`${p[0]} : ${p[1]}`;
  const wrong1=`${a} : ${b}`,wrong2=`${p[1]} : ${p[0]}`,wrong3=`${p[0]+1} : ${p[1]}`;
  return {text,ans,options:ensure4(ans,[wrong1,wrong2,wrong3]),
    hint:'找出兩個數的最大公因數，前項和後項同時除以它。',
    explain:`${a} 和 ${b} 的最大公因數是 ${k}，同除以 ${k} 得最簡整數比 ${p[0]} : ${p[1]}。`};
}
function genValue(M){
  const p=coprimePair(M.maxRatio);
  const k=R(2,M.maxK);
  const a=p[0]*k,b=p[1]*k;
  const text=`已知比為 ${a} : ${b}，求它的比值（前項 ÷ 後項，化成最簡分數；結果是整數就直接寫整數）。`;
  const fs=(n,d)=>d===1?String(n):`${n}/${d}`;
  const ans=fs(p[0],p[1]);
  const wrong1=fs(p[1],p[0]),wrong2=fs(a,b),wrong3=fs(b,a); // 錯誤選項：倒數、沒約分、沒約分的倒數
  return {text,ans,options:ensure4(ans,[wrong1,wrong2,wrong3]),
    hint:'比值 = 前項 ÷ 後項，記得要先化成最簡分數。',
    explain:`比值 = ${a}/${b}，同除以 ${k}，化簡為最簡分數 ${p[0]}/${p[1]}。`};
}
function genWord(M){
  const [n1,n2,unit]=pick(CONTEXTS);
  const p=coprimePair(M.maxRatio);
  const k=R(2,M.maxK);
  const a=p[0]*k,b=p[1]*k;
  const text=`比值化簡狐調出幻影：${n1} ${a} ${unit}與${n2} ${b} ${unit}，請問${n1}對${n2}的最簡整數比是多少？`;
  const ans=`${p[0]} : ${p[1]}`;
  const wrong1=`${p[1]} : ${p[0]}`,wrong2=`${a} : ${b}`,wrong3=`${p[0]+1} : ${p[1]}`;
  return {text,ans,options:ensure4(ans,[wrong1,wrong2,wrong3]),
    hint:'同除以最大公因數，把比化成最簡整數比。',
    explain:`${a} : ${b}，同除以 ${k}，得最簡整數比 ${p[0]} : ${p[1]}。`};
}
function genEquivalent(M){
  const p=coprimePair(M.maxRatio);
  const k1=R(2,M.maxK);
  const target=`${p[0]*k1} : ${p[1]*k1}`;
  let correctK=R(2,M.maxK);
  while(correctK===k1)correctK=R(2,M.maxK);
  const correct=`${p[0]*correctK} : ${p[1]*correctK}`;
  const wrong1=`${p[1]*correctK} : ${p[0]*correctK}`;
  const wrong2=`${p[0]*correctK+1} : ${p[1]*correctK}`;
  const wrong3=`${p[0]*correctK} : ${p[1]*correctK+1}`;
  const text=`比值化簡狐出示比 ${target}，下列哪一個比與它相等？`;
  return {text,ans:correct,options:ensure4(correct,[wrong1,wrong2,wrong3]),
    hint:'兩個比相等的條件：化成最簡整數比後一樣，或是外項乘積等於內項乘積。',
    explain:`${target} 化簡後是 ${p[0]}:${p[1]}，${correct} 化簡後也是 ${p[0]}:${p[1]}，所以兩者相等。`};
}
function gen(t){
  const M=MODES[mode];
  if(t==='simplify')return genSimplify(M);
  if(t==='value')return genValue(M);
  if(t==='word')return genWord(M);
  return genEquivalent(M);
}

return {plan:['simplify','value','word','equivalent','simplify','word','value','equivalent','word','simplify'],gen:function(t,m){mode=m;return gen(t);}};
})();

JB2.stages['3-1-2']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
function ensure4(ans,cands){
  const s=new Set([ans]);
  for(const c of cands){const cs=String(c);if(s.size<4&&cs!==ans&&cs.trim()!=='')s.add(cs);}
  /* 誘答選項不夠時：答案不是純數字就「改動答案裡的一個數字」補齊（例如 (5, 5)→(5, 4)），不再塞無關的 -5、6 */
  if(s.size<4&&!/^-?\d+(\.\d+)?$/.test(String(ans))){
    const str=String(ans),vars=[],re=/\d+(?:\.\d+)?/g;let mm;
    while((mm=re.exec(str))!==null){for(const d of [1,-1,2,-2,3,-3]){const nv=Number(mm[0])+d;if(nv<0)continue;const dec=(mm[0].split('.')[1]||'').length;vars.push(str.slice(0,mm.index)+(dec?nv.toFixed(dec):nv)+str.slice(mm.index+mm[0].length));}}
    for(let i=vars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[vars[i],vars[j]]=[vars[j],vars[i]];}
    for(const v of vars){if(s.size>=4)break;if(!s.has(v))s.add(v);}
  }
  let g=1;
  while(s.size<4){const v=(Number(ans)||0)+(g%2===0?g/2+5:-(Math.ceil(g/2)+4));const vs=String(v);if(!s.has(vs))s.add(vs);g++;}
  return sh([...s]);
}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);return b?gcd(b,a%b):(a||1)}
function lcm(a,b){return Math.abs(a*b)/gcd(a,b)}
/* 坐標平面 SVG 繪圖工具：points 畫點、lines 畫 ax+by=c 直線、dashedTo 畫到兩軸的虛線 */
function lineSegPoints(a,b,c,R2){
  const pts=[];
  if(b!==0){[-R2,R2].forEach(x=>{const y=(c-a*x)/b;if(y>=-R2-0.0001&&y<=R2+0.0001)pts.push([x,y]);});}
  if(a!==0){[-R2,R2].forEach(y=>{const x=(c-b*y)/a;if(x>=-R2-0.0001&&x<=R2+0.0001)pts.push([x,y]);});}
  if(pts.length<2)return null;
  pts.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);
  return [pts[0],pts[pts.length-1]];
}
function svgGrid(opts){
  const RG=opts.range||7,S=260,C=S/2,U=(S-36)/(2*RG);
  const toX=x=>C+x*U,toY=y=>C-y*U;
  let g=`<div class="qsvg"><svg viewBox="0 0 ${S} ${S}" style="width:100%;max-width:260px;background:#fff;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  for(let i=-RG;i<=RG;i++){
    g+=`<line x1="${toX(i)}" y1="${toY(-RG)}" x2="${toX(i)}" y2="${toY(RG)}" stroke="#e3e3e3" stroke-width="1"/>`;
    g+=`<line x1="${toX(-RG)}" y1="${toY(i)}" x2="${toX(RG)}" y2="${toY(i)}" stroke="#e3e3e3" stroke-width="1"/>`;
  }
  g+=`<line x1="${toX(-RG)}" y1="${toY(0)}" x2="${toX(RG)}" y2="${toY(0)}" stroke="#333" stroke-width="2"/>`;
  g+=`<line x1="${toX(0)}" y1="${toY(-RG)}" x2="${toX(0)}" y2="${toY(RG)}" stroke="#333" stroke-width="2"/>`;
  g+=`<text x="${toX(RG)-10}" y="${toY(0)-6}" font-size="12" fill="#333">x</text><text x="${toX(0)+6}" y="${toY(RG)+12}" font-size="12" fill="#333">y</text>`;
  (opts.lines||[]).forEach(ln=>{
    const pts=lineSegPoints(ln.a,ln.b,ln.c,RG);
    if(pts)g+=`<line x1="${toX(pts[0][0])}" y1="${toY(pts[0][1])}" x2="${toX(pts[1][0])}" y2="${toY(pts[1][1])}" stroke="${ln.color||'#d24a33'}" stroke-width="2.5"/>`;
  });
  (opts.dashedTo||[]).forEach(p=>{
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(p.x)}" y2="${toY(0)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(0)}" y2="${toY(p.y)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
  });
  (opts.points||[]).forEach(p=>{
    g+=`<circle cx="${toX(p.x)}" cy="${toY(p.y)}" r="4.5" fill="${p.color||'#d24a33'}"/>`;
    if(p.label)g+=`<text x="${toX(p.x)+6}" y="${toY(p.y)-6}" font-size="12" font-weight="700" fill="${p.color||'#d24a33'}">${p.label}</text>`;
  });
  g+='</svg></div>';
  return g;
}
function fmtEq(a,b,c){
  return (a===1?'':a)+'x + '+(b===1?'':b)+'y = '+c;
}
function fmtEqGen(a,b,c){
  let s=(a===1?'':a===-1?'-':a)+'x';
  s+=b>=0?' + '+(b===1?'':b)+'y':' - '+(Math.abs(b)===1?'':Math.abs(b))+'y';
  s+=' = '+c;
  return s;
}
const QUADS=['第一象限','第二象限','第三象限','第四象限'];
function quadName(x,y){
  if(x===0&&y===0)return '原點（不屬於任何象限）';
  if(x===0)return 'y 軸上（不屬於任何象限）';
  if(y===0)return 'x 軸上（不屬於任何象限）';
  if(x>0&&y>0)return '第一象限';
  if(x<0&&y>0)return '第二象限';
  if(x<0&&y<0)return '第三象限';
  return '第四象限';
}
function coprimePair(max){
  let p,q;
  do{p=R(1,max);q=R(1,max);}while(gcd(p,q)!==1);
  return [p,q];
}
function fmtNum(n){
  if(Number.isInteger(n))return String(n);
  return String(Math.round(n*100)/100);
}
const MODES={easy:{t:0,max:4},real:{t:15,max:6},hard:{t:10,max:8}};
const PLAN=['solve','check','cross','word','solve','word','check','solve','cross','word'];
const PROP_CONTEXTS=[['做蛋糕','人份','公克麵粉'],['煮飯','人份','公克白米'],['泡茶','人份','公克茶葉'],['調果汁','杯','毫升糖漿']];

function genSolve(M){
  let m,d,b,c,rhs,x,outer=0;
  do{/* 不出 x=0 的題目，也不出前後項一樣大(例如 x : 3 = 8 : 3)那種一眼看穿的題目 */
    m=R(0,4)*(Math.random()<0.6?1:-1);
    d=R(2,M.max);b=R(2,M.max);
    let tries=0;
    do{c=R(1,M.max*2);tries++;}while((b*c)%d!==0&&tries<50);
    if((b*c)%d!==0)c=d;
    rhs=(b*c)/d;
    x=rhs-m;outer++;
  }while((x===0||b===d)&&outer<40);
  const leftExpr=m===0?'x':(m>0?`(x + ${m})`:`(x - ${Math.abs(m)})`);
  const text=`內外項天秤龍噴出比例式：${leftExpr} : ${b} = ${c} : ${d}，求 x。`;
  const ans=String(x);
  return {text,ans,options:ensure4(ans,[String(x+1),String(x-1),String(-x)]),
    hint:'比例式的性質：外項乘外項＝內項乘內項（交叉相乘）。',
    explain:`交叉相乘：${d} × ${leftExpr} = ${b} × ${c}，右邊 = ${b*c}，所以 ${m===0?'x':'x'+(m>0?' + '+m:' - '+Math.abs(m))} = ${rhs}，解得 x = ${x}。`};
}
function genCheck(M){
  const p=coprimePair(M.max);
  const k1=R(2,M.max);let k2;do{k2=R(2,M.max);}while(k2===k1);
  const a=p[0]*k1,b=p[1]*k1;
  let c=p[0]*k2,d=p[1]*k2;
  if(Math.random()<0.5){c+=R(1,2);}
  const check1=a*d,check2=b*c;
  const text=`比例式 ${a} : ${b} = ${c} : ${d} 成立嗎？`;
  const ans=check1===check2?'成立（是比例式）':'不成立（不是比例式）';
  return {text,ans,options:['成立（是比例式）','不成立（不是比例式）','無法判斷','兩邊都要化簡才能比較'],
    hint:'檢查「外項乘外項」是否等於「內項乘內項」：a×d 是否等於 b×c。',
    explain:`外項乘積 ${a}×${d}=${check1}，內項乘積 ${b}×${c}=${check2}，${check1===check2?'兩者相等，所以成立':'兩者不相等，所以不成立'}。`};
}
function genCrossProduct(M){
  const p=coprimePair(M.max);
  const k1=R(2,M.max);let k2;do{k2=R(2,M.max);}while(k2===k1);
  const a=p[0]*k1,b=p[1]*k1,c=p[0]*k2,d=p[1]*k2;
  const val=b*c;
  const text=`已知比例式 ${a} : ${b} = ${c} : ${d} 成立，求內項乘積（${b} × ${c}）的值。`;
  const ans=String(val);
  return {text,ans,options:ensure4(ans,[String(a*c),String(b*d),String(a*b)]),
    hint:'比例式成立時，外項乘積和內項乘積一樣大。內項就是中間那兩個數。',
    explain:`內項乘積 ${b}×${c} = ${val}，剛好也等於外項乘積 ${a}×${d} = ${a*d}，驗證比例式成立。`};
}
function genWordSetup(M){
  const [act,unit1,unit2]=pick(PROP_CONTEXTS);
  const p=coprimePair(M.max);
  const k1=R(2,M.max);let k2;do{k2=R(2,M.max);}while(k2===k1);
  const base1=p[0]*k1,baseAmt=p[1]*k1;
  const target1=p[0]*k2,ansAmt=p[1]*k2;
  const text=`天秤龍出題：${act} ${base1} ${unit1}需要 ${baseAmt} ${unit2}，用同樣的比例，${act} ${target1} ${unit1}需要多少 ${unit2}？`;
  const ans=String(ansAmt);
  return {text,ans,options:ensure4(ans,[String(ansAmt+p[1]),String(ansAmt-p[1]>0?ansAmt-p[1]:ansAmt+2*p[1]),String(base1*target1)]),
    hint:`先列出比例式 ${base1} : ${baseAmt} = ${target1} : x，再用外項乘內項的方法求解。`,
    explain:`列出比例式 ${base1}:${baseAmt} = ${target1}:x，交叉相乘可得 x = ${ansAmt}。`};
}
function gen(t){
  const M=MODES[mode];
  if(t==='solve')return genSolve(M);
  if(t==='check')return genCheck(M);
  if(t==='cross')return genCrossProduct(M);
  return genWordSetup(M);
}

return {plan:['solve','check','cross','word','solve','word','check','solve','cross','word'],gen:function(t,m){mode=m;return gen(t);}};
})();

JB2.stages['3-1-3']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
function ensure4(ans,cands){
  const s=new Set([ans]);
  for(const c of cands){const cs=String(c);if(s.size<4&&cs!==ans&&cs.trim()!=='')s.add(cs);}
  /* 誘答選項不夠時：答案不是純數字就「改動答案裡的一個數字」補齊（例如 (5, 5)→(5, 4)），不再塞無關的 -5、6 */
  if(s.size<4&&!/^-?\d+(\.\d+)?$/.test(String(ans))){
    const str=String(ans),vars=[],re=/\d+(?:\.\d+)?/g;let mm;
    while((mm=re.exec(str))!==null){for(const d of [1,-1,2,-2,3,-3]){const nv=Number(mm[0])+d;if(nv<0)continue;const dec=(mm[0].split('.')[1]||'').length;vars.push(str.slice(0,mm.index)+(dec?nv.toFixed(dec):nv)+str.slice(mm.index+mm[0].length));}}
    for(let i=vars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[vars[i],vars[j]]=[vars[j],vars[i]];}
    for(const v of vars){if(s.size>=4)break;if(!s.has(v))s.add(v);}
  }
  let g=1;
  while(s.size<4){const v=(Number(ans)||0)+(g%2===0?g/2+5:-(Math.ceil(g/2)+4));const vs=String(v);if(!s.has(vs))s.add(vs);g++;}
  return sh([...s]);
}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);return b?gcd(b,a%b):(a||1)}
function lcm(a,b){return Math.abs(a*b)/gcd(a,b)}
/* 坐標平面 SVG 繪圖工具：points 畫點、lines 畫 ax+by=c 直線、dashedTo 畫到兩軸的虛線 */
function lineSegPoints(a,b,c,R2){
  const pts=[];
  if(b!==0){[-R2,R2].forEach(x=>{const y=(c-a*x)/b;if(y>=-R2-0.0001&&y<=R2+0.0001)pts.push([x,y]);});}
  if(a!==0){[-R2,R2].forEach(y=>{const x=(c-b*y)/a;if(x>=-R2-0.0001&&x<=R2+0.0001)pts.push([x,y]);});}
  if(pts.length<2)return null;
  pts.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);
  return [pts[0],pts[pts.length-1]];
}
function svgGrid(opts){
  const RG=opts.range||7,S=260,C=S/2,U=(S-36)/(2*RG);
  const toX=x=>C+x*U,toY=y=>C-y*U;
  let g=`<div class="qsvg"><svg viewBox="0 0 ${S} ${S}" style="width:100%;max-width:260px;background:#fff;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  for(let i=-RG;i<=RG;i++){
    g+=`<line x1="${toX(i)}" y1="${toY(-RG)}" x2="${toX(i)}" y2="${toY(RG)}" stroke="#e3e3e3" stroke-width="1"/>`;
    g+=`<line x1="${toX(-RG)}" y1="${toY(i)}" x2="${toX(RG)}" y2="${toY(i)}" stroke="#e3e3e3" stroke-width="1"/>`;
  }
  g+=`<line x1="${toX(-RG)}" y1="${toY(0)}" x2="${toX(RG)}" y2="${toY(0)}" stroke="#333" stroke-width="2"/>`;
  g+=`<line x1="${toX(0)}" y1="${toY(-RG)}" x2="${toX(0)}" y2="${toY(RG)}" stroke="#333" stroke-width="2"/>`;
  g+=`<text x="${toX(RG)-10}" y="${toY(0)-6}" font-size="12" fill="#333">x</text><text x="${toX(0)+6}" y="${toY(RG)+12}" font-size="12" fill="#333">y</text>`;
  (opts.lines||[]).forEach(ln=>{
    const pts=lineSegPoints(ln.a,ln.b,ln.c,RG);
    if(pts)g+=`<line x1="${toX(pts[0][0])}" y1="${toY(pts[0][1])}" x2="${toX(pts[1][0])}" y2="${toY(pts[1][1])}" stroke="${ln.color||'#d24a33'}" stroke-width="2.5"/>`;
  });
  (opts.dashedTo||[]).forEach(p=>{
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(p.x)}" y2="${toY(0)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(0)}" y2="${toY(p.y)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
  });
  (opts.points||[]).forEach(p=>{
    g+=`<circle cx="${toX(p.x)}" cy="${toY(p.y)}" r="4.5" fill="${p.color||'#d24a33'}"/>`;
    if(p.label)g+=`<text x="${toX(p.x)+6}" y="${toY(p.y)-6}" font-size="12" font-weight="700" fill="${p.color||'#d24a33'}">${p.label}</text>`;
  });
  g+='</svg></div>';
  return g;
}
function fmtEq(a,b,c){
  return (a===1?'':a)+'x + '+(b===1?'':b)+'y = '+c;
}
function fmtEqGen(a,b,c){
  let s=(a===1?'':a===-1?'-':a)+'x';
  s+=b>=0?' + '+(b===1?'':b)+'y':' - '+(Math.abs(b)===1?'':Math.abs(b))+'y';
  s+=' = '+c;
  return s;
}
const QUADS=['第一象限','第二象限','第三象限','第四象限'];
function quadName(x,y){
  if(x===0&&y===0)return '原點（不屬於任何象限）';
  if(x===0)return 'y 軸上（不屬於任何象限）';
  if(y===0)return 'x 軸上（不屬於任何象限）';
  if(x>0&&y>0)return '第一象限';
  if(x<0&&y>0)return '第二象限';
  if(x<0&&y<0)return '第三象限';
  return '第四象限';
}
function coprimePair(max){
  let p,q;
  do{p=R(1,max);q=R(1,max);}while(gcd(p,q)!==1);
  return [p,q];
}
function fmtNum(n){
  if(Number.isInteger(n))return String(n);
  return String(Math.round(n*100)/100);
}
const MODES={easy:{t:0,max:4,scaleN:5},real:{t:15,max:6,scaleN:6},hard:{t:10,max:8,scaleN:8}};
const SCALES=[10000,20000,25000,40000,50000,100000,200000,250000];

function genMapScale(M){
  const N=pick(SCALES.slice(0,M.scaleN));
  const mapCm=R(1,9);
  const actualCm=mapCm*N;
  const actualKm=actualCm/100000;
  const text=`縮放地圖鹿展開藏寶圖，比例尺是 1 : ${N}。如果圖上量到的距離是 ${mapCm} 公分，實際距離是幾公里？`;
  const ans=fmtNum(actualKm)+' 公里';
  const wrong1=fmtNum(actualCm/1000)+' 公里';
  const wrong2=fmtNum(actualKm*10)+' 公里';
  const wrong3=fmtNum(mapCm*N)+' 公分';
  return {text,ans,options:ensure4(ans,[wrong1,wrong2,wrong3]),
    hint:'先算出實際距離是幾「公分」（圖上距離×比例尺後項），再換算成公里（100000 公分 = 1 公里）。',
    explain:`實際距離 = ${mapCm} × ${N} = ${actualCm} 公分 = ${fmtNum(actualKm)} 公里。`};
}
function genDistribute(M){
  const parts=Math.random()<0.5?2:3;
  const ratios=[];
  for(let i=0;i<parts;i++)ratios.push(R(1,M.max));
  const sum=ratios.reduce((a,b)=>a+b,0);
  const unit=R(2,M.max);
  const total=sum*unit;
  const shares=ratios.map(r=>r*unit);
  const askIdx=R(0,parts-1);
  const labels=parts===2?['甲','乙']:['甲','乙','丙'];
  const text=`縮放地圖鹿把 ${total} 顆寶石，依照 ${labels.join(':')} = ${ratios.join(':')} 的比例分給 ${labels.join('、')}，請問 ${labels[askIdx]} 分到幾顆？`;
  const ans=String(shares[askIdx]);
  const wrongPool=shares.filter((v,i)=>i!==askIdx).map(String);
  wrongPool.push(String(shares[askIdx]+unit),String(total));
  return {text,ans,options:ensure4(ans,wrongPool),
    hint:`先把比的每一份加起來（${ratios.join('+')} = ${sum}），用總數 ÷ ${sum} 算出「每 1 份」，再乘上${labels[askIdx]}分到的份數。`,
    explain:`每 1 份 = ${total} ÷ ${sum} = ${unit}，${labels[askIdx]}分到 ${ratios[askIdx]} 份，所以 ${labels[askIdx]} = ${ratios[askIdx]} × ${unit} = ${shares[askIdx]} 顆。`};
}
function genFindMissing(M){
  const p=coprimePair(M.max);
  const k1=R(2,M.max),k2=R(2,M.max);
  const t1=p[0]*k1,d1=p[1]*k1;
  const t2=p[0]*k2,d2=p[1]*k2;
  const text=`地圖鹿以固定速度前進，${t1} 分鐘可以走 ${d1} 公里。用同樣的速度，${t2} 分鐘可以走幾公里？`;
  const ans=String(d2);
  return {text,ans,options:ensure4(ans,[String(d2+p[1]),String(d2-p[1]>0?d2-p[1]:d2+2*p[1]),String(t2*d1)]),
    hint:`列出比例式 ${t1} : ${d1} = ${t2} : x，用外項乘內項的方法求解。`,
    explain:`${t1}:${d1} = ${t2}:x，交叉相乘可得 x = ${ans} 公里。`};
}
function gen(t){
  const M=MODES[mode];
  if(t==='mapScale')return genMapScale(M);
  if(t==='distribute')return genDistribute(M);
  return genFindMissing(M);
}
const PLAN=['mapScale','distribute','findMissing','mapScale','distribute','findMissing','distribute','mapScale','findMissing','distribute'];

return {plan:['mapScale','distribute','findMissing','mapScale','distribute','findMissing','distribute','mapScale','findMissing','distribute'],gen:function(t,m){mode=m;return gen(t);}};
})();

JB2.stages['3-2-1']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
function ensure4(ans,cands){
  const s=new Set([ans]);
  for(const c of cands){const cs=String(c);if(s.size<4&&cs!==ans&&cs.trim()!=='')s.add(cs);}
  /* 誘答選項不夠時：答案不是純數字就「改動答案裡的一個數字」補齊（例如 (5, 5)→(5, 4)），不再塞無關的 -5、6 */
  if(s.size<4&&!/^-?\d+(\.\d+)?$/.test(String(ans))){
    const str=String(ans),vars=[],re=/\d+(?:\.\d+)?/g;let mm;
    while((mm=re.exec(str))!==null){for(const d of [1,-1,2,-2,3,-3]){const nv=Number(mm[0])+d;if(nv<0)continue;const dec=(mm[0].split('.')[1]||'').length;vars.push(str.slice(0,mm.index)+(dec?nv.toFixed(dec):nv)+str.slice(mm.index+mm[0].length));}}
    for(let i=vars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[vars[i],vars[j]]=[vars[j],vars[i]];}
    for(const v of vars){if(s.size>=4)break;if(!s.has(v))s.add(v);}
  }
  let g=1;
  while(s.size<4){const v=(Number(ans)||0)+(g%2===0?g/2+5:-(Math.ceil(g/2)+4));const vs=String(v);if(!s.has(vs))s.add(vs);g++;}
  return sh([...s]);
}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);return b?gcd(b,a%b):(a||1)}
function lcm(a,b){return Math.abs(a*b)/gcd(a,b)}
/* 坐標平面 SVG 繪圖工具：points 畫點、lines 畫 ax+by=c 直線、dashedTo 畫到兩軸的虛線 */
function lineSegPoints(a,b,c,R2){
  const pts=[];
  if(b!==0){[-R2,R2].forEach(x=>{const y=(c-a*x)/b;if(y>=-R2-0.0001&&y<=R2+0.0001)pts.push([x,y]);});}
  if(a!==0){[-R2,R2].forEach(y=>{const x=(c-b*y)/a;if(x>=-R2-0.0001&&x<=R2+0.0001)pts.push([x,y]);});}
  if(pts.length<2)return null;
  pts.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);
  return [pts[0],pts[pts.length-1]];
}
function svgGrid(opts){
  const RG=opts.range||7,S=260,C=S/2,U=(S-36)/(2*RG);
  const toX=x=>C+x*U,toY=y=>C-y*U;
  let g=`<div class="qsvg"><svg viewBox="0 0 ${S} ${S}" style="width:100%;max-width:260px;background:#fff;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  for(let i=-RG;i<=RG;i++){
    g+=`<line x1="${toX(i)}" y1="${toY(-RG)}" x2="${toX(i)}" y2="${toY(RG)}" stroke="#e3e3e3" stroke-width="1"/>`;
    g+=`<line x1="${toX(-RG)}" y1="${toY(i)}" x2="${toX(RG)}" y2="${toY(i)}" stroke="#e3e3e3" stroke-width="1"/>`;
  }
  g+=`<line x1="${toX(-RG)}" y1="${toY(0)}" x2="${toX(RG)}" y2="${toY(0)}" stroke="#333" stroke-width="2"/>`;
  g+=`<line x1="${toX(0)}" y1="${toY(-RG)}" x2="${toX(0)}" y2="${toY(RG)}" stroke="#333" stroke-width="2"/>`;
  g+=`<text x="${toX(RG)-10}" y="${toY(0)-6}" font-size="12" fill="#333">x</text><text x="${toX(0)+6}" y="${toY(RG)+12}" font-size="12" fill="#333">y</text>`;
  (opts.lines||[]).forEach(ln=>{
    const pts=lineSegPoints(ln.a,ln.b,ln.c,RG);
    if(pts)g+=`<line x1="${toX(pts[0][0])}" y1="${toY(pts[0][1])}" x2="${toX(pts[1][0])}" y2="${toY(pts[1][1])}" stroke="${ln.color||'#d24a33'}" stroke-width="2.5"/>`;
  });
  (opts.dashedTo||[]).forEach(p=>{
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(p.x)}" y2="${toY(0)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(0)}" y2="${toY(p.y)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
  });
  (opts.points||[]).forEach(p=>{
    g+=`<circle cx="${toX(p.x)}" cy="${toY(p.y)}" r="4.5" fill="${p.color||'#d24a33'}"/>`;
    if(p.label)g+=`<text x="${toX(p.x)+6}" y="${toY(p.y)-6}" font-size="12" font-weight="700" fill="${p.color||'#d24a33'}">${p.label}</text>`;
  });
  g+='</svg></div>';
  return g;
}
function fmtEq(a,b,c){
  return (a===1?'':a)+'x + '+(b===1?'':b)+'y = '+c;
}
function fmtEqGen(a,b,c){
  let s=(a===1?'':a===-1?'-':a)+'x';
  s+=b>=0?' + '+(b===1?'':b)+'y':' - '+(Math.abs(b)===1?'':Math.abs(b))+'y';
  s+=' = '+c;
  return s;
}
const QUADS=['第一象限','第二象限','第三象限','第四象限'];
function quadName(x,y){
  if(x===0&&y===0)return '原點（不屬於任何象限）';
  if(x===0)return 'y 軸上（不屬於任何象限）';
  if(y===0)return 'x 軸上（不屬於任何象限）';
  if(x>0&&y>0)return '第一象限';
  if(x<0&&y>0)return '第二象限';
  if(x<0&&y<0)return '第三象限';
  return '第四象限';
}
function coprimePair(max){
  let p,q;
  do{p=R(1,max);q=R(1,max);}while(gcd(p,q)!==1);
  return [p,q];
}
function fmtNum(n){
  if(Number.isInteger(n))return String(n);
  return String(Math.round(n*100)/100);
}
const MODES={easy:{t:0,max:6},real:{t:15,max:6},hard:{t:10,max:9}};
const PLAN=['findK','findY','findX','identify','findK','findY','identify','findX','findY','identify'];

const CTX1=['正比加速馬奔跑距離 y 與時間 x 成正比。','買筆記本的總價 y 與本數 x 成正比。','水龍頭流出的水量 y 與時間 x 成正比。','機器人走的路程 y 與時間 x 成正比。','影印的總張數 y 與分鐘數 x 成正比。'];
function genFindK(M){
  const k=R(2,M.max);
  const x0=R(2,M.max);
  const y0=k*x0;
  const text=`${pick(CTX1)}已知當 x=${x0} 時，y=${y0}，求關係式（用 y=kx 表示）。`;
  const ans=`y = ${k}x`;
  const wrong1=`y = ${x0}x`,wrong2=`y = x + ${y0-x0}`,wrong3=`y = ${k+1}x`;
  return {text,ans,options:ensure4(ans,[wrong1,wrong2,wrong3]),
    hint:'正比關係式是 y = kx，把已知的 x、y 代入求出 k = y ÷ x。',
    explain:`k = y ÷ x = ${y0} ÷ ${x0} = ${k}，所以關係式為 y = ${k}x。`};
}
function genFindY(M){
  const k=R(2,M.max);
  const x=R(2,M.max);
  const y=k*x;
  const text=`${pick(CTX1)}已知 y 與 x 成正比，關係式為 y = ${k}x，當 x = ${x} 時，y 是多少？`;
  const ans=String(y);
  return {text,ans,options:ensure4(ans,[String(y+k),String(y-k),String(k+x)]),
    hint:'把 x 的值直接代入 y=kx 計算。',
    explain:`y = ${k} × ${x} = ${y}。`};
}
function genFindX(M){
  const k=R(2,M.max);
  const x=R(2,M.max);
  const y=k*x;
  const text=`${pick(CTX1)}已知 y 與 x 成正比，關係式為 y = ${k}x，當 y = ${y} 時，x 是多少？`;
  const ans=String(x);
  return {text,ans,options:ensure4(ans,[String(x+1),String(x-1>0?x-1:x+2),String(y*k)]),
    hint:'x = y ÷ k，把已知的 y 除以 k。',
    explain:`x = ${y} ÷ ${k} = ${x}。`};
}
function genIdentify(M){
  const k=R(2,M.max);
  const x1=R(2,M.max);
  let x2=R(2,M.max+2);if(x2===x1)x2+=1;
  const y1=k*x1;
  const isProp=Math.random()<0.6;
  const y2=isProp?k*x2:k*x2+R(1,3);
  const real=y1*x2===y2*x1;
  const ans=real?'是，符合正比（y÷x 都相等）':'不是，不符合正比（y÷x 不相等）';
  const text=`加速馬紀錄了兩組數據：x=${x1} 時 y=${y1}；x=${x2} 時 y=${y2}。這兩組數據符合 y 與 x 成正比嗎？`;
  return {text,ans,options:['是，符合正比（y÷x 都相等）','不是，不符合正比（y÷x 不相等）','資料不足，無法判斷','一定符合反比'],
    hint:'正比的判斷方法：檢查每一組的 y÷x 是否都相等。',
    explain:`第一組 y÷x = ${y1}÷${x1} = ${fmtNum(y1/x1)}；第二組 y÷x = ${y2}÷${x2} = ${fmtNum(y2/x2)}，${real?'兩者相等，所以符合正比':'兩者不相等，所以不符合正比'}。`};
}
function gen(t){
  const M=MODES[mode];
  if(t==='findK')return genFindK(M);
  if(t==='findY')return genFindY(M);
  if(t==='findX')return genFindX(M);
  return genIdentify(M);
}

return {plan:['findK','findY','findX','identify','findK','findY','identify','findX','findY','identify'],gen:function(t,m){mode=m;return gen(t);}};
})();

JB2.stages['3-2-2']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
function ensure4(ans,cands){
  const s=new Set([ans]);
  for(const c of cands){const cs=String(c);if(s.size<4&&cs!==ans&&cs.trim()!=='')s.add(cs);}
  /* 誘答選項不夠時：答案不是純數字就「改動答案裡的一個數字」補齊（例如 (5, 5)→(5, 4)），不再塞無關的 -5、6 */
  if(s.size<4&&!/^-?\d+(\.\d+)?$/.test(String(ans))){
    const str=String(ans),vars=[],re=/\d+(?:\.\d+)?/g;let mm;
    while((mm=re.exec(str))!==null){for(const d of [1,-1,2,-2,3,-3]){const nv=Number(mm[0])+d;if(nv<0)continue;const dec=(mm[0].split('.')[1]||'').length;vars.push(str.slice(0,mm.index)+(dec?nv.toFixed(dec):nv)+str.slice(mm.index+mm[0].length));}}
    for(let i=vars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[vars[i],vars[j]]=[vars[j],vars[i]];}
    for(const v of vars){if(s.size>=4)break;if(!s.has(v))s.add(v);}
  }
  let g=1;
  while(s.size<4){const v=(Number(ans)||0)+(g%2===0?g/2+5:-(Math.ceil(g/2)+4));const vs=String(v);if(!s.has(vs))s.add(vs);g++;}
  return sh([...s]);
}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);return b?gcd(b,a%b):(a||1)}
function lcm(a,b){return Math.abs(a*b)/gcd(a,b)}
/* 坐標平面 SVG 繪圖工具：points 畫點、lines 畫 ax+by=c 直線、dashedTo 畫到兩軸的虛線 */
function lineSegPoints(a,b,c,R2){
  const pts=[];
  if(b!==0){[-R2,R2].forEach(x=>{const y=(c-a*x)/b;if(y>=-R2-0.0001&&y<=R2+0.0001)pts.push([x,y]);});}
  if(a!==0){[-R2,R2].forEach(y=>{const x=(c-b*y)/a;if(x>=-R2-0.0001&&x<=R2+0.0001)pts.push([x,y]);});}
  if(pts.length<2)return null;
  pts.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);
  return [pts[0],pts[pts.length-1]];
}
function svgGrid(opts){
  const RG=opts.range||7,S=260,C=S/2,U=(S-36)/(2*RG);
  const toX=x=>C+x*U,toY=y=>C-y*U;
  let g=`<div class="qsvg"><svg viewBox="0 0 ${S} ${S}" style="width:100%;max-width:260px;background:#fff;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  for(let i=-RG;i<=RG;i++){
    g+=`<line x1="${toX(i)}" y1="${toY(-RG)}" x2="${toX(i)}" y2="${toY(RG)}" stroke="#e3e3e3" stroke-width="1"/>`;
    g+=`<line x1="${toX(-RG)}" y1="${toY(i)}" x2="${toX(RG)}" y2="${toY(i)}" stroke="#e3e3e3" stroke-width="1"/>`;
  }
  g+=`<line x1="${toX(-RG)}" y1="${toY(0)}" x2="${toX(RG)}" y2="${toY(0)}" stroke="#333" stroke-width="2"/>`;
  g+=`<line x1="${toX(0)}" y1="${toY(-RG)}" x2="${toX(0)}" y2="${toY(RG)}" stroke="#333" stroke-width="2"/>`;
  g+=`<text x="${toX(RG)-10}" y="${toY(0)-6}" font-size="12" fill="#333">x</text><text x="${toX(0)+6}" y="${toY(RG)+12}" font-size="12" fill="#333">y</text>`;
  (opts.lines||[]).forEach(ln=>{
    const pts=lineSegPoints(ln.a,ln.b,ln.c,RG);
    if(pts)g+=`<line x1="${toX(pts[0][0])}" y1="${toY(pts[0][1])}" x2="${toX(pts[1][0])}" y2="${toY(pts[1][1])}" stroke="${ln.color||'#d24a33'}" stroke-width="2.5"/>`;
  });
  (opts.dashedTo||[]).forEach(p=>{
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(p.x)}" y2="${toY(0)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(0)}" y2="${toY(p.y)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
  });
  (opts.points||[]).forEach(p=>{
    g+=`<circle cx="${toX(p.x)}" cy="${toY(p.y)}" r="4.5" fill="${p.color||'#d24a33'}"/>`;
    if(p.label)g+=`<text x="${toX(p.x)+6}" y="${toY(p.y)-6}" font-size="12" font-weight="700" fill="${p.color||'#d24a33'}">${p.label}</text>`;
  });
  g+='</svg></div>';
  return g;
}
function fmtEq(a,b,c){
  return (a===1?'':a)+'x + '+(b===1?'':b)+'y = '+c;
}
function fmtEqGen(a,b,c){
  let s=(a===1?'':a===-1?'-':a)+'x';
  s+=b>=0?' + '+(b===1?'':b)+'y':' - '+(Math.abs(b)===1?'':Math.abs(b))+'y';
  s+=' = '+c;
  return s;
}
const QUADS=['第一象限','第二象限','第三象限','第四象限'];
function quadName(x,y){
  if(x===0&&y===0)return '原點（不屬於任何象限）';
  if(x===0)return 'y 軸上（不屬於任何象限）';
  if(y===0)return 'x 軸上（不屬於任何象限）';
  if(x>0&&y>0)return '第一象限';
  if(x<0&&y>0)return '第二象限';
  if(x<0&&y<0)return '第三象限';
  return '第四象限';
}
function coprimePair(max){
  let p,q;
  do{p=R(1,max);q=R(1,max);}while(gcd(p,q)!==1);
  return [p,q];
}
function fmtNum(n){
  if(Number.isInteger(n))return String(n);
  return String(Math.round(n*100)/100);
}
const MODES={easy:{t:0,max:6},real:{t:15,max:6},hard:{t:10,max:8}};
const PLAN=['findK','findY','findX','identify','findK','findY','identify','findX','findY','identify'];

const CTX2=['反比平衡水怪控制排水量 x（每秒立方公尺）與所需時間 y（秒）成反比。','工人人數 x 與完成工作所需天數 y 成反比。','行駛速度 x 與所需時間 y 成反比。','每人分到的糖果數 x 與分到的人數 y 成反比。','水管數量 x 與灌滿水池的時間 y 成反比。'];
function genFindK(M){
  const x0=R(2,M.max),y0=R(2,M.max);
  const k=x0*y0;
  const text=`${pick(CTX2)}已知當 x=${x0} 時，y=${y0}，求關係式（用 xy=k 表示）。`;
  const ans=`xy = ${k}`;
  const wrong1=`y = ${x0}x`,wrong2=`xy = ${x0+y0}`,wrong3=`xy = ${k+Math.max(x0,y0)}`;
  return {text,ans,options:ensure4(ans,[wrong1,wrong2,wrong3]),
    hint:'反比關係式是 xy = k，把已知的 x、y 相乘就能求出 k。',
    explain:`k = x × y = ${x0} × ${y0} = ${k}，所以關係式為 xy = ${k}。`};
}
function genFindY(M){
  const x=R(2,M.max),y=R(2,M.max);
  const k=x*y;
  let x2=R(2,M.max),tries=0;
  while(k%x2!==0&&tries<20){x2=R(2,M.max);tries++;}
  if(k%x2!==0)x2=x;
  const yAns=k/x2;
  const text=`${pick(CTX2)}已知 x 與 y 成反比，關係式為 xy = ${k}，當 x = ${x2} 時，y 是多少？`;
  const ans=String(yAns);
  return {text,ans,options:ensure4(ans,[String(yAns+1),String(yAns-1>0?yAns-1:yAns+2),String(k*x2)]),
    hint:'反比關係中，y = k ÷ x，把 k 除以已知的 x。',
    explain:`y = ${k} ÷ ${x2} = ${yAns}。`};
}
function genFindX(M){
  const x=R(2,M.max),y=R(2,M.max);
  const k=x*y;
  let y2=R(2,M.max),tries=0;
  while(k%y2!==0&&tries<20){y2=R(2,M.max);tries++;}
  if(k%y2!==0)y2=y;
  const xAns=k/y2;
  const text=`${pick(CTX2)}已知 x 與 y 成反比，關係式為 xy = ${k}，當 y = ${y2} 時，x 是多少？`;
  const ans=String(xAns);
  return {text,ans,options:ensure4(ans,[String(xAns+1),String(xAns-1>0?xAns-1:xAns+2),String(k*y2)]),
    hint:'反比關係中，x = k ÷ y，把 k 除以已知的 y。',
    explain:`x = ${k} ÷ ${y2} = ${xAns}。`};
}
function genIdentify(M){
  const x1=R(2,M.max);
  let x2=R(2,M.max+2);if(x2===x1)x2+=1;
  const isInv=Math.random()<0.6;
  let y1,y2;
  if(isInv){
    const L=lcm(x1,x2),k=L*R(1,3);
    y1=k/x1;y2=k/x2;
  }else{
    y1=x1+R(1,M.max);y2=x2+R(1,M.max)+1;
  }
  const real=x1*y1===x2*y2;
  const ans=real?'是，符合反比（x×y 都相等）':'不是，不符合反比（x×y 不相等）';
  const text=`水怪紀錄了兩組數據：x=${x1} 時 y=${y1}；x=${x2} 時 y=${y2}。這兩組數據符合 x 與 y 成反比嗎？`;
  return {text,ans,options:['是，符合反比（x×y 都相等）','不是，不符合反比（x×y 不相等）','資料不足，無法判斷','一定符合正比'],
    hint:'反比的判斷方法：檢查每一組的 x×y 是否都相等。',
    explain:`第一組 x×y = ${x1}×${y1} = ${x1*y1}；第二組 x×y = ${x2}×${y2} = ${x2*y2}，${real?'兩者相等，所以符合反比':'兩者不相等，所以不符合反比'}。`};
}
function gen(t){
  const M=MODES[mode];
  if(t==='findK')return genFindK(M);
  if(t==='findY')return genFindY(M);
  if(t==='findX')return genFindX(M);
  return genIdentify(M);
}

return {plan:['findK','findY','findX','identify','findK','findY','identify','findX','findY','identify'],gen:function(t,m){mode=m;return gen(t);}};
})();

JB2.stages['3-2-3']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
function ensure4(ans,cands){
  const s=new Set([ans]);
  for(const c of cands){const cs=String(c);if(s.size<4&&cs!==ans&&cs.trim()!=='')s.add(cs);}
  /* 誘答選項不夠時：答案不是純數字就「改動答案裡的一個數字」補齊（例如 (5, 5)→(5, 4)），不再塞無關的 -5、6 */
  if(s.size<4&&!/^-?\d+(\.\d+)?$/.test(String(ans))){
    const str=String(ans),vars=[],re=/\d+(?:\.\d+)?/g;let mm;
    while((mm=re.exec(str))!==null){for(const d of [1,-1,2,-2,3,-3]){const nv=Number(mm[0])+d;if(nv<0)continue;const dec=(mm[0].split('.')[1]||'').length;vars.push(str.slice(0,mm.index)+(dec?nv.toFixed(dec):nv)+str.slice(mm.index+mm[0].length));}}
    for(let i=vars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[vars[i],vars[j]]=[vars[j],vars[i]];}
    for(const v of vars){if(s.size>=4)break;if(!s.has(v))s.add(v);}
  }
  let g=1;
  while(s.size<4){const v=(Number(ans)||0)+(g%2===0?g/2+5:-(Math.ceil(g/2)+4));const vs=String(v);if(!s.has(vs))s.add(vs);g++;}
  return sh([...s]);
}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);return b?gcd(b,a%b):(a||1)}
function lcm(a,b){return Math.abs(a*b)/gcd(a,b)}
/* 坐標平面 SVG 繪圖工具：points 畫點、lines 畫 ax+by=c 直線、dashedTo 畫到兩軸的虛線 */
function lineSegPoints(a,b,c,R2){
  const pts=[];
  if(b!==0){[-R2,R2].forEach(x=>{const y=(c-a*x)/b;if(y>=-R2-0.0001&&y<=R2+0.0001)pts.push([x,y]);});}
  if(a!==0){[-R2,R2].forEach(y=>{const x=(c-b*y)/a;if(x>=-R2-0.0001&&x<=R2+0.0001)pts.push([x,y]);});}
  if(pts.length<2)return null;
  pts.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);
  return [pts[0],pts[pts.length-1]];
}
function svgGrid(opts){
  const RG=opts.range||7,S=260,C=S/2,U=(S-36)/(2*RG);
  const toX=x=>C+x*U,toY=y=>C-y*U;
  let g=`<div class="qsvg"><svg viewBox="0 0 ${S} ${S}" style="width:100%;max-width:260px;background:#fff;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  for(let i=-RG;i<=RG;i++){
    g+=`<line x1="${toX(i)}" y1="${toY(-RG)}" x2="${toX(i)}" y2="${toY(RG)}" stroke="#e3e3e3" stroke-width="1"/>`;
    g+=`<line x1="${toX(-RG)}" y1="${toY(i)}" x2="${toX(RG)}" y2="${toY(i)}" stroke="#e3e3e3" stroke-width="1"/>`;
  }
  g+=`<line x1="${toX(-RG)}" y1="${toY(0)}" x2="${toX(RG)}" y2="${toY(0)}" stroke="#333" stroke-width="2"/>`;
  g+=`<line x1="${toX(0)}" y1="${toY(-RG)}" x2="${toX(0)}" y2="${toY(RG)}" stroke="#333" stroke-width="2"/>`;
  g+=`<text x="${toX(RG)-10}" y="${toY(0)-6}" font-size="12" fill="#333">x</text><text x="${toX(0)+6}" y="${toY(RG)+12}" font-size="12" fill="#333">y</text>`;
  (opts.lines||[]).forEach(ln=>{
    const pts=lineSegPoints(ln.a,ln.b,ln.c,RG);
    if(pts)g+=`<line x1="${toX(pts[0][0])}" y1="${toY(pts[0][1])}" x2="${toX(pts[1][0])}" y2="${toY(pts[1][1])}" stroke="${ln.color||'#d24a33'}" stroke-width="2.5"/>`;
  });
  (opts.dashedTo||[]).forEach(p=>{
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(p.x)}" y2="${toY(0)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(0)}" y2="${toY(p.y)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
  });
  (opts.points||[]).forEach(p=>{
    g+=`<circle cx="${toX(p.x)}" cy="${toY(p.y)}" r="4.5" fill="${p.color||'#d24a33'}"/>`;
    if(p.label)g+=`<text x="${toX(p.x)+6}" y="${toY(p.y)-6}" font-size="12" font-weight="700" fill="${p.color||'#d24a33'}">${p.label}</text>`;
  });
  g+='</svg></div>';
  return g;
}
function fmtEq(a,b,c){
  return (a===1?'':a)+'x + '+(b===1?'':b)+'y = '+c;
}
function fmtEqGen(a,b,c){
  let s=(a===1?'':a===-1?'-':a)+'x';
  s+=b>=0?' + '+(b===1?'':b)+'y':' - '+(Math.abs(b)===1?'':Math.abs(b))+'y';
  s+=' = '+c;
  return s;
}
const QUADS=['第一象限','第二象限','第三象限','第四象限'];
function quadName(x,y){
  if(x===0&&y===0)return '原點（不屬於任何象限）';
  if(x===0)return 'y 軸上（不屬於任何象限）';
  if(y===0)return 'x 軸上（不屬於任何象限）';
  if(x>0&&y>0)return '第一象限';
  if(x<0&&y>0)return '第二象限';
  if(x<0&&y<0)return '第三象限';
  return '第四象限';
}
function coprimePair(max){
  let p,q;
  do{p=R(1,max);q=R(1,max);}while(gcd(p,q)!==1);
  return [p,q];
}
function fmtNum(n){
  if(Number.isInteger(n))return String(n);
  return String(Math.round(n*100)/100);
}
const MODES={easy:{t:0,max:6},real:{t:15,max:6},hard:{t:10,max:8}};
const PLAN=['classifyEq','classifyTable','apply','classifyEq','apply','classifyTable','classifyEq','apply','classifyTable','apply'];

function genClassifyEq(M){
  const type=pick(['prop','prop2','inv','inv2','none1','none2','none3','none4']);
  const k=R(2,M.max+3);
  let eqStr,ans;
  if(type==='prop'){eqStr=`y = ${k}x`;ans='正比';}
  else if(type==='prop2'){eqStr=`y = -${k}x`;ans='正比';}
  else if(type==='inv'){eqStr=`xy = ${k}`;ans='反比';}
  else if(type==='inv2'){eqStr=`y = ${k}/x`;ans='反比';}
  else if(type==='none1'){const c=R(1,M.max);eqStr=`x + y = ${k+c}`;ans='兩者皆非';}
  else if(type==='none2'){const c=R(1,M.max);eqStr=`y = x + ${c}`;ans='兩者皆非';}
  else if(type==='none3'){const c=R(1,M.max);eqStr=`y = ${k}x + ${c}`;ans='兩者皆非';}
  else{eqStr=`y = x - ${k}`;ans='兩者皆非';}
  const text=`${pick(['變率獸','比例精靈','關係魔像'])}發射光束，方程式為 ${eqStr}，請問 y 與 x 成正比、成反比，還是兩者皆非？`;
  return {text,ans,options:['正比','反比','兩者皆非','無法判斷'],
    hint:'y=kx 形式是正比；xy=k（或 y=k/x）形式是反比；其他形式（例如相加、相減、加常數）通常兩者皆非。',
    explain:`${eqStr} ${ans==='正比'?'是 y=kx 的形式，所以是正比':ans==='反比'?'是 xy=k（y=k/x）的形式，所以是反比':'既不是 y=kx，也不是 xy=k 的形式，所以兩者皆非'}。`};
}
function genClassifyTable(M){
  const type=pick(['prop','inv','none']);
  const x1=R(2,M.max);
  let x2=R(2,M.max+2);if(x2===x1)x2+=1;
  let y1,y2;
  if(type==='prop'){const k=R(2,M.max);y1=k*x1;y2=k*x2;}
  else if(type==='inv'){const L=lcm(x1,x2),k=L*R(1,3);y1=k/x1;y2=k/x2;}
  else{y1=x1*R(2,M.max)+R(1,3);y2=x2*R(2,M.max)+R(4,6);if(y1*x2===y2*x1)y2+=1;if(x1*y1===x2*y2)y2+=1;}
  const isProp=y1*x2===y2*x1;
  const isInv=x1*y1===x2*y2;
  const ans=isProp?'正比':(isInv?'反比':'兩者皆非');
  const text=`變率獸展示兩組數據：x=${x1} 時 y=${y1}；x=${x2} 時 y=${y2}。這組數據是正比、反比，還是兩者皆非？`;
  return {text,ans,options:['正比','反比','兩者皆非','資料不足，無法判斷'],
    hint:'正比看 y÷x 是否固定；反比看 x×y 是否固定；兩者都不固定就是皆非。',
    explain:`y÷x：${x1}→${fmtNum(y1/x1)}、${x2}→${fmtNum(y2/x2)}；x×y：${x1*y1}、${x2*y2}。${ans==='正比'?'y÷x 相等，是正比':ans==='反比'?'x×y 相等，是反比':'兩者都不相等，兩者皆非'}。`};
}
function genApply(M){
  const isProp=Math.random()<0.5;
  if(isProp){
    const k=R(2,M.max);
    const x1=R(2,M.max),y1=k*x1;
    let x2=R(2,M.max+2);if(x2===x1)x2+=1;
    const y2=k*x2;
    const text=`變率獸出題：y 與 x 成正比，已知 x=${x1} 時 y=${y1}，求 x=${x2} 時 y 是多少？`;
    const ans=String(y2);
    return {text,ans,options:ensure4(ans,[String(y2+k),String(y2-k),String(x2*y1)]),
      hint:'先求出 k = y÷x，再用 y = kx 算出答案。',
      explain:`k = ${y1}÷${x1} = ${k}，所以 y = ${k}×${x2} = ${y2}。`};
  }else{
    let x1,y1,k,cand;
    do{x1=R(2,M.max);y1=R(2,M.max);k=x1*y1;cand=[];for(let dd=2;dd<=M.max+2;dd++)if(k%dd===0&&dd!==x1)cand.push(dd);}while(!cand.length);/* 要問的 x 不能和已知的 x 一樣 */
    const x2=pick(cand);
    const y2=k/x2;
    const text=`變率獸出題：y 與 x 成反比，已知 x=${x1} 時 y=${y1}，求 x=${x2} 時 y 是多少？`;
    const ans=String(y2);
    return {text,ans,options:ensure4(ans,[String(y2+1),String(y2-1>0?y2-1:y2+2),String(x2*y1)]),
      hint:'先求出 k = x×y，再用 y = k÷x 算出答案。',
      explain:`k = ${x1}×${y1} = ${k}，所以 y = ${k}÷${x2} = ${y2}。`};
  }
}
function gen(t){
  const M=MODES[mode];
  if(t==='classifyEq')return genClassifyEq(M);
  if(t==='classifyTable')return genClassifyTable(M);
  return genApply(M);
}

return {plan:['classifyEq','classifyTable','apply','classifyEq','apply','classifyTable','classifyEq','apply','classifyTable','apply'],gen:function(t,m){mode=m;return gen(t);}};
})();

JB2.stages['4-1-1']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
function ensure4(ans,cands){
  const s=new Set([ans]);
  for(const c of cands){const cs=String(c);if(s.size<4&&cs!==ans&&cs.trim()!=='')s.add(cs);}
  /* 誘答選項不夠時：答案不是純數字就「改動答案裡的一個數字」補齊（例如 (5, 5)→(5, 4)），不再塞無關的 -5、6 */
  if(s.size<4&&!/^-?\d+(\.\d+)?$/.test(String(ans))){
    const str=String(ans),vars=[],re=/\d+(?:\.\d+)?/g;let mm;
    while((mm=re.exec(str))!==null){for(const d of [1,-1,2,-2,3,-3]){const nv=Number(mm[0])+d;if(nv<0)continue;const dec=(mm[0].split('.')[1]||'').length;vars.push(str.slice(0,mm.index)+(dec?nv.toFixed(dec):nv)+str.slice(mm.index+mm[0].length));}}
    for(let i=vars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[vars[i],vars[j]]=[vars[j],vars[i]];}
    for(const v of vars){if(s.size>=4)break;if(!s.has(v))s.add(v);}
  }
  let g=1;
  while(s.size<4){const v=(Number(ans)||0)+(g%2===0?g/2+5:-(Math.ceil(g/2)+4));const vs=String(v);if(!s.has(vs))s.add(vs);g++;}
  return sh([...s]);
}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);return b?gcd(b,a%b):(a||1)}
function lcm(a,b){return Math.abs(a*b)/gcd(a,b)}
/* 坐標平面 SVG 繪圖工具：points 畫點、lines 畫 ax+by=c 直線、dashedTo 畫到兩軸的虛線 */
function lineSegPoints(a,b,c,R2){
  const pts=[];
  if(b!==0){[-R2,R2].forEach(x=>{const y=(c-a*x)/b;if(y>=-R2-0.0001&&y<=R2+0.0001)pts.push([x,y]);});}
  if(a!==0){[-R2,R2].forEach(y=>{const x=(c-b*y)/a;if(x>=-R2-0.0001&&x<=R2+0.0001)pts.push([x,y]);});}
  if(pts.length<2)return null;
  pts.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);
  return [pts[0],pts[pts.length-1]];
}
function svgGrid(opts){
  const RG=opts.range||7,S=260,C=S/2,U=(S-36)/(2*RG);
  const toX=x=>C+x*U,toY=y=>C-y*U;
  let g=`<div class="qsvg"><svg viewBox="0 0 ${S} ${S}" style="width:100%;max-width:260px;background:#fff;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  for(let i=-RG;i<=RG;i++){
    g+=`<line x1="${toX(i)}" y1="${toY(-RG)}" x2="${toX(i)}" y2="${toY(RG)}" stroke="#e3e3e3" stroke-width="1"/>`;
    g+=`<line x1="${toX(-RG)}" y1="${toY(i)}" x2="${toX(RG)}" y2="${toY(i)}" stroke="#e3e3e3" stroke-width="1"/>`;
  }
  g+=`<line x1="${toX(-RG)}" y1="${toY(0)}" x2="${toX(RG)}" y2="${toY(0)}" stroke="#333" stroke-width="2"/>`;
  g+=`<line x1="${toX(0)}" y1="${toY(-RG)}" x2="${toX(0)}" y2="${toY(RG)}" stroke="#333" stroke-width="2"/>`;
  g+=`<text x="${toX(RG)-10}" y="${toY(0)-6}" font-size="12" fill="#333">x</text><text x="${toX(0)+6}" y="${toY(RG)+12}" font-size="12" fill="#333">y</text>`;
  (opts.lines||[]).forEach(ln=>{
    const pts=lineSegPoints(ln.a,ln.b,ln.c,RG);
    if(pts)g+=`<line x1="${toX(pts[0][0])}" y1="${toY(pts[0][1])}" x2="${toX(pts[1][0])}" y2="${toY(pts[1][1])}" stroke="${ln.color||'#d24a33'}" stroke-width="2.5"/>`;
  });
  (opts.dashedTo||[]).forEach(p=>{
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(p.x)}" y2="${toY(0)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(0)}" y2="${toY(p.y)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
  });
  (opts.points||[]).forEach(p=>{
    g+=`<circle cx="${toX(p.x)}" cy="${toY(p.y)}" r="4.5" fill="${p.color||'#d24a33'}"/>`;
    if(p.label)g+=`<text x="${toX(p.x)+6}" y="${toY(p.y)-6}" font-size="12" font-weight="700" fill="${p.color||'#d24a33'}">${p.label}</text>`;
  });
  g+='</svg></div>';
  return g;
}
function fmtEq(a,b,c){
  return (a===1?'':a)+'x + '+(b===1?'':b)+'y = '+c;
}
function fmtEqGen(a,b,c){
  let s=(a===1?'':a===-1?'-':a)+'x';
  s+=b>=0?' + '+(b===1?'':b)+'y':' - '+(Math.abs(b)===1?'':Math.abs(b))+'y';
  s+=' = '+c;
  return s;
}
const QUADS=['第一象限','第二象限','第三象限','第四象限'];
function quadName(x,y){
  if(x===0&&y===0)return '原點（不屬於任何象限）';
  if(x===0)return 'y 軸上（不屬於任何象限）';
  if(y===0)return 'x 軸上（不屬於任何象限）';
  if(x>0&&y>0)return '第一象限';
  if(x<0&&y>0)return '第二象限';
  if(x<0&&y<0)return '第三象限';
  return '第四象限';
}
function coprimePair(max){
  let p,q;
  do{p=R(1,max);q=R(1,max);}while(gcd(p,q)!==1);
  return [p,q];
}
function fmtNum(n){
  if(Number.isInteger(n))return String(n);
  return String(Math.round(n*100)/100);
}
const OPS=['>','<','≥','≤'];
function evalOp(lhs,op,rhs){
  if(op==='>')return lhs>rhs;
  if(op==='<')return lhs<rhs;
  if(op==='≥')return lhs>=rhs;
  return lhs<=rhs;
}
function flipOp(op){
  return op==='>'?'<':op==='<'?'>':op==='≥'?'≤':'≥';
}
function svgNumberLine(boundary,op,range){
  const R2=range||8,S=280,PADX=20;
  const toX=v=>PADX+(v+R2)/(2*R2)*(S-2*PADX);
  let g=`<div class="qsvg"><svg viewBox="0 0 ${S} 60" style="width:100%;max-width:280px;background:#fff;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  g+=`<line x1="${toX(-R2)}" y1="30" x2="${toX(R2)}" y2="30" stroke="#333" stroke-width="2"/>`;
  for(let i=-R2;i<=R2;i++){
    g+=`<line x1="${toX(i)}" y1="26" x2="${toX(i)}" y2="34" stroke="#999" stroke-width="1"/>`;
    if(i%2===0||R2<=6)g+=`<text x="${toX(i)}" y="48" font-size="9" fill="#555" text-anchor="middle">${i}</text>`;
  }
  const filled=(op==='≥'||op==='≤');
  const dir=(op==='>'||op==='≥')?1:-1;
  const endX=dir>0?toX(R2):toX(-R2);
  g+=`<line x1="${toX(boundary)}" y1="30" x2="${endX}" y2="30" stroke="#d24a33" stroke-width="4"/>`;
  g+=`<circle cx="${toX(boundary)}" cy="30" r="5" fill="${filled?'#d24a33':'#fff'}" stroke="#d24a33" stroke-width="2.5"/>`;
  const tipX=dir>0?endX-7:endX+7;
  g+=`<polygon points="${tipX},26 ${tipX},34 ${endX},30" fill="#d24a33"/>`;
  g+='</svg></div>';
  return g;
}
const MODES={easy:{t:0,max:10},real:{t:15,max:15},hard:{t:10,max:20}};
const PLAN=['translate','reverse','symbol','setupWord','translate','symbol','reverse','setupWord','translate','symbol'];
const PHRASES=[['不小於','≥'],['不低於','≥'],['至少','≥'],['最少','≥'],['最低','≥'],['以上','≥'],['不大於','≤'],['不超過','≤'],['至多','≤'],['最多','≤'],['最高','≤'],['以下','≤'],['超過','>'],['多於','>'],['未滿','<'],['少於','<']];
const POST={'以上':1,'以下':1}; /* 以上、以下要把數字放在前面：18 歲以上 */
const cond=(label,v,unit,ph,val)=>POST[ph]?`${label} ${v} 是 ${val}${unit}${ph}`:`${label} ${v} ${unit}${ph} ${val}`;
const rv=(v,ph,val)=>POST[ph]?`${v} 是 ${val} ${ph}`:`${v} ${ph} ${val}`;
const CTXS=[['身高','x','公分','雲霄飛車入口的牌子寫著：'],['體重','x','公斤','門檻天平獸的告示牌寫著：'],['票價','y','元','售票亭貼出公告：'],['年齡','x','歲','社團招生海報寫著：'],['重量','x','公克','快遞站的規定寫著：'],['載重','x','公斤','電梯裡貼著提醒：'],['點數','x','點','遊戲公會的公告寫著：'],['成績','x','分','老師在黑板上寫著：']];
const LEADS=1;
const SCENES=[['遊樂園入場','身高','公分','x'],['社團招生','年齡','歲','x'],['特價活動','消費金額','元','y'],['體適能測驗','仰臥起坐次數','下','x'],['電梯搭乘','載重','公斤','x'],['遊戲公會入會','點數','點','x'],['營隊報名','年齡','歲','x']];

function genTranslate(M){
  const [phrase,sym]=pick(PHRASES);
  const val=R(5,M.max)*10;
  const [label,varname,unit,lead]=pick(CTXS);
  const text=`${lead}『${cond(label,varname,unit,phrase,val)}』，請列出正確的不等式。`;
  const ans=`${varname} ${sym} ${val}`;
  const otherSyms=OPS.filter(s=>s!==sym);
  const wrongs=otherSyms.map(s=>`${varname} ${s} ${val}`);
  return {text,ans,options:ensure4(ans,wrongs),
    hint:'「不小於／不低於／至少／最少／最低／以上」是≥；「不大於／不超過／至多／最多／最高／以下」是≤；「超過／多於」是＞；「未滿／少於」是＜。',
    explain:`「${phrase}」對應的符號是「${sym}」，所以不等式為 ${varname} ${sym} ${val}。`};
}
function genReverse(M){
  const [phrase,sym]=pick(PHRASES);
  const val=R(5,M.max)*10;
  const varname=pick(['x','y']);
  const text=`不等式 ${varname} ${sym} ${val} 用生活用語來說，最適合的說法是？`;
  const ans=rv(varname,phrase,val);
  const others=PHRASES.filter(p=>p[1]!==sym);
  const wrongPhrases=sh(others).slice(0,3).map(p=>rv(varname,p[0],val));
  return {text,ans,options:ensure4(ans,wrongPhrases),
    hint:'先看不等號是 >、<、≥ 還是 ≤，再對照生活用語。',
    explain:`符號 ${sym} 對應的生活用語就是「${phrase}」，所以是 ${varname} ${phrase} ${val}。`};
}
function genChooseSymbol(M){
  const [phrase,sym]=pick(PHRASES);
  const text=`生活用語「${phrase}」應該對應下列哪一個不等號？`;
  return {text,ans:sym,options:OPS.slice(),
    hint:'「不小於/至少/不低於/最少/最低/以上」→≥；「不大於/至多/不超過/最多/最高/以下」→≤；「超過/多於」→>；「未滿/少於」→<。',
    explain:`「${phrase}」代表的不等號是「${sym}」。`};
}
function genSetupWord(M){
  const [scene,label,unit,varname]=pick(SCENES);
  const [phrase1,sym1]=pick(PHRASES);
  const val1=R(5,M.max)*10;
  /* 兩個條件要「同時成立得了」：上限（≤、<）和下限（≥、>）並存時，下限的數字一定要比上限小，否則會出現「至多 80 又不小於 90」這種不可能的告示牌 */
  const isUp=s=>s==='≤'||s==='<';
  const isLow=s=>s==='≥'||s==='>';
  const okPair=(p2,v2)=>{
    if(p2[1]===sym1)return false;
    if(isUp(sym1)&&isLow(p2[1]))return v2<val1;
    if(isLow(sym1)&&isUp(p2[1]))return v2>val1;
    return true;
  };
  let phrase2=pick(PHRASES),val2=R(5,M.max)*10,tries=0;
  while(!okPair(phrase2,val2)&&tries<60){phrase2=pick(PHRASES);val2=R(5,M.max)*10;tries++;}
  if(!okPair(phrase2,val2)){ /* 保底：選同方向（都是上限或都是下限）的另一個說法 */
    const same=PHRASES.filter(p=>p[1]!==sym1&&((isUp(sym1)&&isUp(p[1]))||(isLow(sym1)&&isLow(p[1]))));
    phrase2=same.length?pick(same):phrase2;val2=R(5,M.max)*10;
  }
  const text=`門檻天平獸守護${scene}，告示牌寫著：『${cond(label,varname,unit,phrase1,val1)}，且另一項條件${POST[phrase2[0]]?'是 '+val2+' '+phrase2[0]:phrase2[0]+' '+val2}』。請寫出「${POST[phrase1]?label+' '+val1+' '+unit+phrase1:label+phrase1+' '+val1}」這個條件的不等式。`;
  const ans=`${varname} ${sym1} ${val1}`;
  const otherSyms=OPS.filter(s=>s!==sym1);
  const wrongs=otherSyms.map(s=>`${varname} ${s} ${val1}`);
  return {text,ans,options:ensure4(ans,wrongs),
    hint:'先找到題目中要問的那個條件用語，再對照不等號口訣轉換。',
    explain:`「${phrase1}」對應「${sym1}」，所以這個條件的不等式為 ${varname} ${sym1} ${val1}。`};
}
function gen(t){
  const M=MODES[mode];
  if(t==='translate')return genTranslate(M);
  if(t==='reverse')return genReverse(M);
  if(t==='symbol')return genChooseSymbol(M);
  return genSetupWord(M);
}

return {plan:['translate','reverse','symbol','setupWord','translate','symbol','reverse','setupWord','translate','symbol'],gen:function(t,m){mode=m;return gen(t);}};
})();

JB2.stages['4-1-2']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
function ensure4(ans,cands){
  const s=new Set([ans]);
  for(const c of cands){const cs=String(c);if(s.size<4&&cs!==ans&&cs.trim()!=='')s.add(cs);}
  /* 誘答選項不夠時：答案不是純數字就「改動答案裡的一個數字」補齊（例如 (5, 5)→(5, 4)），不再塞無關的 -5、6 */
  if(s.size<4&&!/^-?\d+(\.\d+)?$/.test(String(ans))){
    const str=String(ans),vars=[],re=/\d+(?:\.\d+)?/g;let mm;
    while((mm=re.exec(str))!==null){for(const d of [1,-1,2,-2,3,-3]){const nv=Number(mm[0])+d;if(nv<0)continue;const dec=(mm[0].split('.')[1]||'').length;vars.push(str.slice(0,mm.index)+(dec?nv.toFixed(dec):nv)+str.slice(mm.index+mm[0].length));}}
    for(let i=vars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[vars[i],vars[j]]=[vars[j],vars[i]];}
    for(const v of vars){if(s.size>=4)break;if(!s.has(v))s.add(v);}
  }
  let g=1;
  while(s.size<4){const v=(Number(ans)||0)+(g%2===0?g/2+5:-(Math.ceil(g/2)+4));const vs=String(v);if(!s.has(vs))s.add(vs);g++;}
  return sh([...s]);
}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);return b?gcd(b,a%b):(a||1)}
function lcm(a,b){return Math.abs(a*b)/gcd(a,b)}
/* 坐標平面 SVG 繪圖工具：points 畫點、lines 畫 ax+by=c 直線、dashedTo 畫到兩軸的虛線 */
function lineSegPoints(a,b,c,R2){
  const pts=[];
  if(b!==0){[-R2,R2].forEach(x=>{const y=(c-a*x)/b;if(y>=-R2-0.0001&&y<=R2+0.0001)pts.push([x,y]);});}
  if(a!==0){[-R2,R2].forEach(y=>{const x=(c-b*y)/a;if(x>=-R2-0.0001&&x<=R2+0.0001)pts.push([x,y]);});}
  if(pts.length<2)return null;
  pts.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);
  return [pts[0],pts[pts.length-1]];
}
function svgGrid(opts){
  const RG=opts.range||7,S=260,C=S/2,U=(S-36)/(2*RG);
  const toX=x=>C+x*U,toY=y=>C-y*U;
  let g=`<div class="qsvg"><svg viewBox="0 0 ${S} ${S}" style="width:100%;max-width:260px;background:#fff;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  for(let i=-RG;i<=RG;i++){
    g+=`<line x1="${toX(i)}" y1="${toY(-RG)}" x2="${toX(i)}" y2="${toY(RG)}" stroke="#e3e3e3" stroke-width="1"/>`;
    g+=`<line x1="${toX(-RG)}" y1="${toY(i)}" x2="${toX(RG)}" y2="${toY(i)}" stroke="#e3e3e3" stroke-width="1"/>`;
  }
  g+=`<line x1="${toX(-RG)}" y1="${toY(0)}" x2="${toX(RG)}" y2="${toY(0)}" stroke="#333" stroke-width="2"/>`;
  g+=`<line x1="${toX(0)}" y1="${toY(-RG)}" x2="${toX(0)}" y2="${toY(RG)}" stroke="#333" stroke-width="2"/>`;
  g+=`<text x="${toX(RG)-10}" y="${toY(0)-6}" font-size="12" fill="#333">x</text><text x="${toX(0)+6}" y="${toY(RG)+12}" font-size="12" fill="#333">y</text>`;
  (opts.lines||[]).forEach(ln=>{
    const pts=lineSegPoints(ln.a,ln.b,ln.c,RG);
    if(pts)g+=`<line x1="${toX(pts[0][0])}" y1="${toY(pts[0][1])}" x2="${toX(pts[1][0])}" y2="${toY(pts[1][1])}" stroke="${ln.color||'#d24a33'}" stroke-width="2.5"/>`;
  });
  (opts.dashedTo||[]).forEach(p=>{
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(p.x)}" y2="${toY(0)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(0)}" y2="${toY(p.y)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
  });
  (opts.points||[]).forEach(p=>{
    g+=`<circle cx="${toX(p.x)}" cy="${toY(p.y)}" r="4.5" fill="${p.color||'#d24a33'}"/>`;
    if(p.label)g+=`<text x="${toX(p.x)+6}" y="${toY(p.y)-6}" font-size="12" font-weight="700" fill="${p.color||'#d24a33'}">${p.label}</text>`;
  });
  g+='</svg></div>';
  return g;
}
function fmtEq(a,b,c){
  return (a===1?'':a)+'x + '+(b===1?'':b)+'y = '+c;
}
function fmtEqGen(a,b,c){
  let s=(a===1?'':a===-1?'-':a)+'x';
  s+=b>=0?' + '+(b===1?'':b)+'y':' - '+(Math.abs(b)===1?'':Math.abs(b))+'y';
  s+=' = '+c;
  return s;
}
const QUADS=['第一象限','第二象限','第三象限','第四象限'];
function quadName(x,y){
  if(x===0&&y===0)return '原點（不屬於任何象限）';
  if(x===0)return 'y 軸上（不屬於任何象限）';
  if(y===0)return 'x 軸上（不屬於任何象限）';
  if(x>0&&y>0)return '第一象限';
  if(x<0&&y>0)return '第二象限';
  if(x<0&&y<0)return '第三象限';
  return '第四象限';
}
function coprimePair(max){
  let p,q;
  do{p=R(1,max);q=R(1,max);}while(gcd(p,q)!==1);
  return [p,q];
}
function fmtNum(n){
  if(Number.isInteger(n))return String(n);
  return String(Math.round(n*100)/100);
}
const OPS=['>','<','≥','≤'];
function evalOp(lhs,op,rhs){
  if(op==='>')return lhs>rhs;
  if(op==='<')return lhs<rhs;
  if(op==='≥')return lhs>=rhs;
  return lhs<=rhs;
}
function flipOp(op){
  return op==='>'?'<':op==='<'?'>':op==='≥'?'≤':'≥';
}
function svgNumberLine(boundary,op,range){
  const R2=range||8,S=280,PADX=20;
  const toX=v=>PADX+(v+R2)/(2*R2)*(S-2*PADX);
  let g=`<div class="qsvg"><svg viewBox="0 0 ${S} 60" style="width:100%;max-width:280px;background:#fff;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  g+=`<line x1="${toX(-R2)}" y1="30" x2="${toX(R2)}" y2="30" stroke="#333" stroke-width="2"/>`;
  for(let i=-R2;i<=R2;i++){
    g+=`<line x1="${toX(i)}" y1="26" x2="${toX(i)}" y2="34" stroke="#999" stroke-width="1"/>`;
    if(i%2===0||R2<=6)g+=`<text x="${toX(i)}" y="48" font-size="9" fill="#555" text-anchor="middle">${i}</text>`;
  }
  const filled=(op==='≥'||op==='≤');
  const dir=(op==='>'||op==='≥')?1:-1;
  const endX=dir>0?toX(R2):toX(-R2);
  g+=`<line x1="${toX(boundary)}" y1="30" x2="${endX}" y2="30" stroke="#d24a33" stroke-width="4"/>`;
  g+=`<circle cx="${toX(boundary)}" cy="30" r="5" fill="${filled?'#d24a33':'#fff'}" stroke="#d24a33" stroke-width="2.5"/>`;
  const tipX=dir>0?endX-7:endX+7;
  g+=`<polygon points="${tipX},26 ${tipX},34 ${endX},30" fill="#d24a33"/>`;
  g+='</svg></div>';
  return g;
}
const MODES={easy:{t:0,max:6},real:{t:15,max:8},hard:{t:10,max:10}};
const PLAN=['checkOne','checkMultiple','findBoundary','checkOne','findBoundary','checkMultiple','checkOne','findBoundary','checkMultiple','checkOne'];

function genCheckOne(M){
  const a=R(1,3),c=R(-M.max,M.max);
  let b;do{b=R(-M.max,M.max);}while(b===0);
  const op=pick(OPS);
  const x=R(-M.max,M.max);
  const lhs=a*x+b;
  const text=`範圍判定蠍發動毒液結界：${a===1?'':a}x ${b>=0?'+ '+b:'- '+Math.abs(b)} ${op} ${c}。候選數 x=${x} 是這個不等式的解嗎？`;
  const real=evalOp(lhs,op,c);
  const ans=real?`是，x=${x} 是解`:`不是，x=${x} 不是解`;
  return {text,ans,options:[`是，x=${x} 是解`,`不是，x=${x} 不是解`,'無法判斷','兩者皆有可能'],
    hint:'把 x 的值代入不等式左邊算出結果，再跟右邊比較大小關係是否成立。',
    explain:`代入 x=${x}：左邊 = ${a}×${x}${b>=0?'+':''}${b} = ${lhs}，${real?`${lhs} ${op} ${c} 成立，所以是解`:`${lhs} ${op} ${c} 不成立，所以不是解`}。`};
}
function genCheckMultiple(M){
  const a=R(1,3);let b;do{b=R(-M.max,M.max);}while(b===0);
  const op=pick(OPS);
  let cands=[];
  while(cands.length<4){const v=R(-M.max,M.max);if(!cands.includes(v))cands.push(v);}
  const lhsArr=cands.map(x=>a*x+b);
  let c,trueIdx;
  if(op==='≥'){trueIdx=lhsArr.indexOf(Math.max(...lhsArr));c=lhsArr[trueIdx];}
  else if(op==='>'){trueIdx=lhsArr.indexOf(Math.max(...lhsArr));c=lhsArr[trueIdx]-1;}
  else if(op==='≤'){trueIdx=lhsArr.indexOf(Math.min(...lhsArr));c=lhsArr[trueIdx];}
  else{trueIdx=lhsArr.indexOf(Math.min(...lhsArr));c=lhsArr[trueIdx]+1;}
  const text=`範圍判定蠍的結界不等式是 ${a===1?'':a}x ${b>=0?'+ '+b:'- '+Math.abs(b)} ${op} ${c}。下列哪一個 x 是這個不等式的解？`;
  const ans=String(cands[trueIdx]);
  return {text,ans,options:cands.map(String),
    hint:'把每個候選數代入不等式，看哪一個能讓不等式成立。',
    explain:`代入 x=${cands[trueIdx]}：左邊 = ${a}×${cands[trueIdx]}${b>=0?'+':''}${b} = ${lhsArr[trueIdx]}，符合 ${op} ${c}，所以是解；其餘代入後都不符合。`};
}
function genFindBoundary(M){
  let b;do{b=R(-M.max,M.max);}while(b===0);
  const op=pick(OPS);
  const boundary=R(-M.max,M.max);
  const c=boundary+b;
  const text=`判定蠍的結界不等式是 x ${b>=0?'+ '+b:'- '+Math.abs(b)} ${op} ${c}，解開之後 x 的範圍是？`;
  const ans=`x ${op} ${boundary}`;
  const otherOps=OPS.filter(o=>o!==op);
  const wrongs=otherOps.map(o=>`x ${o} ${boundary}`);
  return {text,ans,options:ensure4(ans,wrongs),
    hint:'把常數移到不等號右邊（同時改變正負號），不等號方向不變（因為沒有乘除負數）。',
    explain:`x ${b>=0?'+ '+b:'- '+Math.abs(b)} ${op} ${c}，兩邊同時${b>=0?'減去':'加上'} ${Math.abs(b)}，得 x ${op} ${boundary}。`};
}
function gen(t){
  const M=MODES[mode];
  if(t==='checkOne')return genCheckOne(M);
  if(t==='checkMultiple')return genCheckMultiple(M);
  return genFindBoundary(M);
}

return {plan:['checkOne','checkMultiple','findBoundary','checkOne','findBoundary','checkMultiple','checkOne','findBoundary','checkMultiple','checkOne'],gen:function(t,m){mode=m;return gen(t);}};
})();

JB2.stages['4-1-3']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
function ensure4(ans,cands){
  const s=new Set([ans]);
  for(const c of cands){const cs=String(c);if(s.size<4&&cs!==ans&&cs.trim()!=='')s.add(cs);}
  /* 誘答選項不夠時：答案不是純數字就「改動答案裡的一個數字」補齊（例如 (5, 5)→(5, 4)），不再塞無關的 -5、6 */
  if(s.size<4&&!/^-?\d+(\.\d+)?$/.test(String(ans))){
    const str=String(ans),vars=[],re=/\d+(?:\.\d+)?/g;let mm;
    while((mm=re.exec(str))!==null){for(const d of [1,-1,2,-2,3,-3]){const nv=Number(mm[0])+d;if(nv<0)continue;const dec=(mm[0].split('.')[1]||'').length;vars.push(str.slice(0,mm.index)+(dec?nv.toFixed(dec):nv)+str.slice(mm.index+mm[0].length));}}
    for(let i=vars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[vars[i],vars[j]]=[vars[j],vars[i]];}
    for(const v of vars){if(s.size>=4)break;if(!s.has(v))s.add(v);}
  }
  let g=1;
  while(s.size<4){const v=(Number(ans)||0)+(g%2===0?g/2+5:-(Math.ceil(g/2)+4));const vs=String(v);if(!s.has(vs))s.add(vs);g++;}
  return sh([...s]);
}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);return b?gcd(b,a%b):(a||1)}
function lcm(a,b){return Math.abs(a*b)/gcd(a,b)}
/* 坐標平面 SVG 繪圖工具：points 畫點、lines 畫 ax+by=c 直線、dashedTo 畫到兩軸的虛線 */
function lineSegPoints(a,b,c,R2){
  const pts=[];
  if(b!==0){[-R2,R2].forEach(x=>{const y=(c-a*x)/b;if(y>=-R2-0.0001&&y<=R2+0.0001)pts.push([x,y]);});}
  if(a!==0){[-R2,R2].forEach(y=>{const x=(c-b*y)/a;if(x>=-R2-0.0001&&x<=R2+0.0001)pts.push([x,y]);});}
  if(pts.length<2)return null;
  pts.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);
  return [pts[0],pts[pts.length-1]];
}
function svgGrid(opts){
  const RG=opts.range||7,S=260,C=S/2,U=(S-36)/(2*RG);
  const toX=x=>C+x*U,toY=y=>C-y*U;
  let g=`<div class="qsvg"><svg viewBox="0 0 ${S} ${S}" style="width:100%;max-width:260px;background:#fff;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  for(let i=-RG;i<=RG;i++){
    g+=`<line x1="${toX(i)}" y1="${toY(-RG)}" x2="${toX(i)}" y2="${toY(RG)}" stroke="#e3e3e3" stroke-width="1"/>`;
    g+=`<line x1="${toX(-RG)}" y1="${toY(i)}" x2="${toX(RG)}" y2="${toY(i)}" stroke="#e3e3e3" stroke-width="1"/>`;
  }
  g+=`<line x1="${toX(-RG)}" y1="${toY(0)}" x2="${toX(RG)}" y2="${toY(0)}" stroke="#333" stroke-width="2"/>`;
  g+=`<line x1="${toX(0)}" y1="${toY(-RG)}" x2="${toX(0)}" y2="${toY(RG)}" stroke="#333" stroke-width="2"/>`;
  g+=`<text x="${toX(RG)-10}" y="${toY(0)-6}" font-size="12" fill="#333">x</text><text x="${toX(0)+6}" y="${toY(RG)+12}" font-size="12" fill="#333">y</text>`;
  (opts.lines||[]).forEach(ln=>{
    const pts=lineSegPoints(ln.a,ln.b,ln.c,RG);
    if(pts)g+=`<line x1="${toX(pts[0][0])}" y1="${toY(pts[0][1])}" x2="${toX(pts[1][0])}" y2="${toY(pts[1][1])}" stroke="${ln.color||'#d24a33'}" stroke-width="2.5"/>`;
  });
  (opts.dashedTo||[]).forEach(p=>{
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(p.x)}" y2="${toY(0)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(0)}" y2="${toY(p.y)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
  });
  (opts.points||[]).forEach(p=>{
    g+=`<circle cx="${toX(p.x)}" cy="${toY(p.y)}" r="4.5" fill="${p.color||'#d24a33'}"/>`;
    if(p.label)g+=`<text x="${toX(p.x)+6}" y="${toY(p.y)-6}" font-size="12" font-weight="700" fill="${p.color||'#d24a33'}">${p.label}</text>`;
  });
  g+='</svg></div>';
  return g;
}
function fmtEq(a,b,c){
  return (a===1?'':a)+'x + '+(b===1?'':b)+'y = '+c;
}
function fmtEqGen(a,b,c){
  let s=(a===1?'':a===-1?'-':a)+'x';
  s+=b>=0?' + '+(b===1?'':b)+'y':' - '+(Math.abs(b)===1?'':Math.abs(b))+'y';
  s+=' = '+c;
  return s;
}
const QUADS=['第一象限','第二象限','第三象限','第四象限'];
function quadName(x,y){
  if(x===0&&y===0)return '原點（不屬於任何象限）';
  if(x===0)return 'y 軸上（不屬於任何象限）';
  if(y===0)return 'x 軸上（不屬於任何象限）';
  if(x>0&&y>0)return '第一象限';
  if(x<0&&y>0)return '第二象限';
  if(x<0&&y<0)return '第三象限';
  return '第四象限';
}
function coprimePair(max){
  let p,q;
  do{p=R(1,max);q=R(1,max);}while(gcd(p,q)!==1);
  return [p,q];
}
function fmtNum(n){
  if(Number.isInteger(n))return String(n);
  return String(Math.round(n*100)/100);
}
const OPS=['>','<','≥','≤'];
function evalOp(lhs,op,rhs){
  if(op==='>')return lhs>rhs;
  if(op==='<')return lhs<rhs;
  if(op==='≥')return lhs>=rhs;
  return lhs<=rhs;
}
function flipOp(op){
  return op==='>'?'<':op==='<'?'>':op==='≥'?'≤':'≥';
}
function svgNumberLine(boundary,op,range){
  const R2=range||8,S=280,PADX=20;
  const toX=v=>PADX+(v+R2)/(2*R2)*(S-2*PADX);
  let g=`<div class="qsvg"><svg viewBox="0 0 ${S} 60" style="width:100%;max-width:280px;background:#fff;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  g+=`<line x1="${toX(-R2)}" y1="30" x2="${toX(R2)}" y2="30" stroke="#333" stroke-width="2"/>`;
  for(let i=-R2;i<=R2;i++){
    g+=`<line x1="${toX(i)}" y1="26" x2="${toX(i)}" y2="34" stroke="#999" stroke-width="1"/>`;
    if(i%2===0||R2<=6)g+=`<text x="${toX(i)}" y="48" font-size="9" fill="#555" text-anchor="middle">${i}</text>`;
  }
  const filled=(op==='≥'||op==='≤');
  const dir=(op==='>'||op==='≥')?1:-1;
  const endX=dir>0?toX(R2):toX(-R2);
  g+=`<line x1="${toX(boundary)}" y1="30" x2="${endX}" y2="30" stroke="#d24a33" stroke-width="4"/>`;
  g+=`<circle cx="${toX(boundary)}" cy="30" r="5" fill="${filled?'#d24a33':'#fff'}" stroke="#d24a33" stroke-width="2.5"/>`;
  const tipX=dir>0?endX-7:endX+7;
  g+=`<polygon points="${tipX},26 ${tipX},34 ${endX},30" fill="#d24a33"/>`;
  g+='</svg></div>';
  return g;
}
const MODES={easy:{t:0,max:5},real:{t:15,max:7},hard:{t:10,max:9}};
const PLAN=['graphToIneq','ineqToDesc','circleType','direction','graphToIneq','ineqToDesc','circleType','graphToIneq','direction','ineqToDesc'];

function genGraphToIneq(M){
  const boundary=R(-M.max,M.max);
  const op=pick(OPS);
  const svg=svgNumberLine(boundary,op,M.max+2);
  const text='數線圓圈光巨龍吐出這道光芒領域，牠對應的不等式是？';
  const ans=`x ${op} ${boundary}`;
  const otherOps=OPS.filter(o=>o!==op);
  const wrongs=otherOps.map(o=>`x ${o} ${boundary}`);
  return {text,svg,ans,options:ensure4(ans,wrongs),
    hint:'空心圓圈代表不包含（> 或 <）；實心圓點代表包含（≥ 或 ≤）；箭頭往右是較大，往左是較小。',
    explain:`圖中在 ${boundary} 是${(op==='≥'||op==='≤')?'實心圓點（包含）':'空心圓圈（不包含）'}，箭頭指向${(op==='>'||op==='≥')?'右方（較大）':'左方（較小）'}，所以是 x ${op} ${boundary}。`};
}
function genIneqToDesc(M){
  const boundary=R(-M.max,M.max);
  const op=pick(OPS);
  const filled=(op==='≥'||op==='≤');
  const dirRight=(op==='>'||op==='≥');
  const text=`不等式 x ${op} ${boundary} 畫在數線上，正確的畫法是？`;
  const ans=`在 ${boundary} 畫${filled?'實心':'空心'}圓${filled?'點':'圈'}，射線指向${dirRight?'右方':'左方'}`;
  const wrong1=`在 ${boundary} 畫${filled?'空心':'實心'}圓${filled?'圈':'點'}，射線指向${dirRight?'右方':'左方'}`;
  const wrong2=`在 ${boundary} 畫${filled?'實心':'空心'}圓${filled?'點':'圈'}，射線指向${dirRight?'左方':'右方'}`;
  const wrong3=`在 ${boundary} 畫${filled?'空心':'實心'}圓${filled?'圈':'點'}，射線指向${dirRight?'左方':'右方'}`;
  return {text,ans,options:sh([ans,wrong1,wrong2,wrong3]),
    hint:'「≥、≤」用實心圓點（包含端點）；「>、<」用空心圓圈（不包含端點）；> 和 ≥ 都指向右邊（較大方向）。',
    explain:`x ${op} ${boundary} 中，因為${filled?'有等號，所以包含端點，畫實心圓點':'沒有等號，所以不包含端點，畫空心圓圈'}；${op} 是「${dirRight?'較大':'較小'}」的方向，所以射線指向${dirRight?'右方':'左方'}。`};
}
function genCircleType(M){
  const op=pick(OPS);
  const filled=(op==='≥'||op==='≤');
  const text=`在數線上圖示不等式 x ${op} k 的解時，在 k 這個點應該畫實心圓點還是空心圓圈？`;
  const ans=filled?'實心圓點（包含 k）':'空心圓圈（不包含 k）';
  return {text,ans,options:['實心圓點（包含 k）','空心圓圈（不包含 k）','不用畫任何符號','畫正方形'],
    hint:'有等號（≥、≤）的解包含端點，用實心圓點；沒有等號（>、<）的解不包含端點，用空心圓圈。',
    explain:`${op} ${filled?'含有等號，代表包含 k，所以要畫實心圓點':'不含等號，代表不包含 k，所以要畫空心圓圈'}。`};
}
function genDirection(M){
  const op=pick(OPS);
  const dirRight=(op==='>'||op==='≥');
  const text=`在數線上圖示不等式 x ${op} k 的解時，射線（箭頭）應該指向哪個方向？`;
  const ans=dirRight?'右方（數字較大的方向）':'左方（數字較小的方向）';
  return {text,ans,options:['右方（數字較大的方向）','左方（數字較小的方向）','同時指向左右兩方','不需要畫射線'],
    hint:'> 或 ≥（比較大）指向右方；< 或 ≤（比較小）指向左方。',
    explain:`x ${op} k 表示 x ${dirRight?'比 k 大':'比 k 小'}${(op==='≥'||op==='≤')?'（或等於）':''}，所以射線指向${dirRight?'右方':'左方'}。`};
}
function gen(t){
  const M=MODES[mode];
  if(t==='graphToIneq')return genGraphToIneq(M);
  if(t==='ineqToDesc')return genIneqToDesc(M);
  if(t==='circleType')return genCircleType(M);
  return genDirection(M);
}
/* ===== 題庫擴充：同一題型多幾種問法，避免一直遇到同一題 ===== */
(function(){
  const _g=gen;
  const mk=(text,ans,wrongs,hint,explain)=>({text,ans,options:ensure4(ans,wrongs),hint,explain});
  const BANK={};
  BANK['circleType']={p:.75,make:()=>{const op=pick(['>','≥','<','≤']),k=R(-9,9),filled=(op==='≥'||op==='≤');
    return {text:`不等式 x ${op} ${k} 的解畫在數線上，在 ${k} 這個點要畫實心圓點還是空心圓圈？`,ans:filled?'實心圓點（包含 '+k+'）':'空心圓圈（不包含 '+k+'）',
      options:sh(['實心圓點（包含 '+k+'）','空心圓圈（不包含 '+k+'）','不用畫任何符號','畫正方形']),hint:'有等號（≥、≤）用實心圓點；沒有等號（>、<）用空心圓圈。',explain:`${op} ${filled?'含有等號，所以畫實心圓點':'不含等號，所以畫空心圓圈'}。`};}};
  BANK['direction']={p:.75,make:()=>{const op=pick(['>','≥','<','≤']),k=R(-9,9),r=(op==='>'||op==='≥');
    return {text:`不等式 x ${op} ${k} 的解畫在數線上，射線（箭頭）要指向哪個方向？`,ans:r?'右方（數字較大的方向）':'左方（數字較小的方向）',
      options:sh(['右方（數字較大的方向）','左方（數字較小的方向）','同時指向左右兩方','不需要畫射線']),hint:'> 或 ≥ 指向右方；< 或 ≤ 指向左方。',explain:`x ${op} ${k} 表示 x 比 ${k} ${r?'大':'小'}${(op==='≥'||op==='≤')?'（或等於）':''}，所以射線指向${r?'右方':'左方'}。`};}};

  gen=function(t){const B=BANK[t];if(B&&Math.random()<B.p){return B.make();}return _g.apply(this,arguments);};
})();

return {plan:['graphToIneq','ineqToDesc','circleType','direction','graphToIneq','ineqToDesc','circleType','graphToIneq','direction','ineqToDesc'],gen:function(t,m){mode=m;return gen(t);}};
})();

JB2.stages['4-2-1']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
function ensure4(ans,cands){
  const s=new Set([ans]);
  for(const c of cands){const cs=String(c);if(s.size<4&&cs!==ans&&cs.trim()!=='')s.add(cs);}
  /* 誘答選項不夠時：答案不是純數字就「改動答案裡的一個數字」補齊（例如 (5, 5)→(5, 4)），不再塞無關的 -5、6 */
  if(s.size<4&&!/^-?\d+(\.\d+)?$/.test(String(ans))){
    const str=String(ans),vars=[],re=/\d+(?:\.\d+)?/g;let mm;
    while((mm=re.exec(str))!==null){for(const d of [1,-1,2,-2,3,-3]){const nv=Number(mm[0])+d;if(nv<0)continue;const dec=(mm[0].split('.')[1]||'').length;vars.push(str.slice(0,mm.index)+(dec?nv.toFixed(dec):nv)+str.slice(mm.index+mm[0].length));}}
    for(let i=vars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[vars[i],vars[j]]=[vars[j],vars[i]];}
    for(const v of vars){if(s.size>=4)break;if(!s.has(v))s.add(v);}
  }
  let g=1;
  while(s.size<4){const v=(Number(ans)||0)+(g%2===0?g/2+5:-(Math.ceil(g/2)+4));const vs=String(v);if(!s.has(vs))s.add(vs);g++;}
  return sh([...s]);
}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);return b?gcd(b,a%b):(a||1)}
function lcm(a,b){return Math.abs(a*b)/gcd(a,b)}
/* 坐標平面 SVG 繪圖工具：points 畫點、lines 畫 ax+by=c 直線、dashedTo 畫到兩軸的虛線 */
function lineSegPoints(a,b,c,R2){
  const pts=[];
  if(b!==0){[-R2,R2].forEach(x=>{const y=(c-a*x)/b;if(y>=-R2-0.0001&&y<=R2+0.0001)pts.push([x,y]);});}
  if(a!==0){[-R2,R2].forEach(y=>{const x=(c-b*y)/a;if(x>=-R2-0.0001&&x<=R2+0.0001)pts.push([x,y]);});}
  if(pts.length<2)return null;
  pts.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);
  return [pts[0],pts[pts.length-1]];
}
function svgGrid(opts){
  const RG=opts.range||7,S=260,C=S/2,U=(S-36)/(2*RG);
  const toX=x=>C+x*U,toY=y=>C-y*U;
  let g=`<div class="qsvg"><svg viewBox="0 0 ${S} ${S}" style="width:100%;max-width:260px;background:#fff;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  for(let i=-RG;i<=RG;i++){
    g+=`<line x1="${toX(i)}" y1="${toY(-RG)}" x2="${toX(i)}" y2="${toY(RG)}" stroke="#e3e3e3" stroke-width="1"/>`;
    g+=`<line x1="${toX(-RG)}" y1="${toY(i)}" x2="${toX(RG)}" y2="${toY(i)}" stroke="#e3e3e3" stroke-width="1"/>`;
  }
  g+=`<line x1="${toX(-RG)}" y1="${toY(0)}" x2="${toX(RG)}" y2="${toY(0)}" stroke="#333" stroke-width="2"/>`;
  g+=`<line x1="${toX(0)}" y1="${toY(-RG)}" x2="${toX(0)}" y2="${toY(RG)}" stroke="#333" stroke-width="2"/>`;
  g+=`<text x="${toX(RG)-10}" y="${toY(0)-6}" font-size="12" fill="#333">x</text><text x="${toX(0)+6}" y="${toY(RG)+12}" font-size="12" fill="#333">y</text>`;
  (opts.lines||[]).forEach(ln=>{
    const pts=lineSegPoints(ln.a,ln.b,ln.c,RG);
    if(pts)g+=`<line x1="${toX(pts[0][0])}" y1="${toY(pts[0][1])}" x2="${toX(pts[1][0])}" y2="${toY(pts[1][1])}" stroke="${ln.color||'#d24a33'}" stroke-width="2.5"/>`;
  });
  (opts.dashedTo||[]).forEach(p=>{
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(p.x)}" y2="${toY(0)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(0)}" y2="${toY(p.y)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
  });
  (opts.points||[]).forEach(p=>{
    g+=`<circle cx="${toX(p.x)}" cy="${toY(p.y)}" r="4.5" fill="${p.color||'#d24a33'}"/>`;
    if(p.label)g+=`<text x="${toX(p.x)+6}" y="${toY(p.y)-6}" font-size="12" font-weight="700" fill="${p.color||'#d24a33'}">${p.label}</text>`;
  });
  g+='</svg></div>';
  return g;
}
function fmtEq(a,b,c){
  return (a===1?'':a)+'x + '+(b===1?'':b)+'y = '+c;
}
function fmtEqGen(a,b,c){
  let s=(a===1?'':a===-1?'-':a)+'x';
  s+=b>=0?' + '+(b===1?'':b)+'y':' - '+(Math.abs(b)===1?'':Math.abs(b))+'y';
  s+=' = '+c;
  return s;
}
const QUADS=['第一象限','第二象限','第三象限','第四象限'];
function quadName(x,y){
  if(x===0&&y===0)return '原點（不屬於任何象限）';
  if(x===0)return 'y 軸上（不屬於任何象限）';
  if(y===0)return 'x 軸上（不屬於任何象限）';
  if(x>0&&y>0)return '第一象限';
  if(x<0&&y>0)return '第二象限';
  if(x<0&&y<0)return '第三象限';
  return '第四象限';
}
function coprimePair(max){
  let p,q;
  do{p=R(1,max);q=R(1,max);}while(gcd(p,q)!==1);
  return [p,q];
}
function fmtNum(n){
  if(Number.isInteger(n))return String(n);
  return String(Math.round(n*100)/100);
}
const OPS=['>','<','≥','≤'];
function evalOp(lhs,op,rhs){
  if(op==='>')return lhs>rhs;
  if(op==='<')return lhs<rhs;
  if(op==='≥')return lhs>=rhs;
  return lhs<=rhs;
}
function flipOp(op){
  return op==='>'?'<':op==='<'?'>':op==='≥'?'≤':'≥';
}
function svgNumberLine(boundary,op,range){
  const R2=range||8,S=280,PADX=20;
  const toX=v=>PADX+(v+R2)/(2*R2)*(S-2*PADX);
  let g=`<div class="qsvg"><svg viewBox="0 0 ${S} 60" style="width:100%;max-width:280px;background:#fff;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  g+=`<line x1="${toX(-R2)}" y1="30" x2="${toX(R2)}" y2="30" stroke="#333" stroke-width="2"/>`;
  for(let i=-R2;i<=R2;i++){
    g+=`<line x1="${toX(i)}" y1="26" x2="${toX(i)}" y2="34" stroke="#999" stroke-width="1"/>`;
    if(i%2===0||R2<=6)g+=`<text x="${toX(i)}" y="48" font-size="9" fill="#555" text-anchor="middle">${i}</text>`;
  }
  const filled=(op==='≥'||op==='≤');
  const dir=(op==='>'||op==='≥')?1:-1;
  const endX=dir>0?toX(R2):toX(-R2);
  g+=`<line x1="${toX(boundary)}" y1="30" x2="${endX}" y2="30" stroke="#d24a33" stroke-width="4"/>`;
  g+=`<circle cx="${toX(boundary)}" cy="30" r="5" fill="${filled?'#d24a33':'#fff'}" stroke="#d24a33" stroke-width="2.5"/>`;
  const tipX=dir>0?endX-7:endX+7;
  g+=`<polygon points="${tipX},26 ${tipX},34 ${endX},30" fill="#d24a33"/>`;
  g+='</svg></div>';
  return g;
}
const MODES={easy:{t:0,max:5},real:{t:15,max:7},hard:{t:10,max:9}};
const PLAN=['flipOrNot','solveFlip','applyOp','conceptCheck','flipOrNot','applyOp','solveFlip','conceptCheck','applyOp','flipOrNot'];
const STATEMENTS=[
  ['不等式兩邊同加上一個數，不等號方向不會改變。',true],
  ['不等式兩邊同乘以一個正數，不等號方向不會改變。',true],
  ['不等式兩邊同乘以一個負數，不等號方向不會改變。',false],
  ['不等式兩邊同除以一個負數，不等號方向要翻轉。',true],
  ['不等式兩邊同減去一個數，不等號方向要翻轉。',false]
];

function genFlipOrNot(M){
  let n=R(-M.max,M.max);
  while(n===0)n=R(-M.max,M.max);
  const text=`如果一個不等式的兩邊同乘（或同除）以 ${n}，不等號方向會改變嗎？`;
  const ans=n<0?'會改變（因為乘/除的是負數）':'不會改變（因為乘/除的是正數）';
  return {text,ans,options:['會改變（因為乘/除的是負數）','不會改變（因為乘/除的是正數）','一定會改變','看不等號種類而定'],
    hint:'同乘或同除以「正數」不等號方向不變；同乘或同除以「負數」不等號方向要翻轉。',
    explain:`${n} 是${n<0?'負數，所以不等號方向要翻轉':'正數，所以不等號方向不變'}。`};
}
function genSolveFlip(M){
  const a=R(2,M.max);
  const x0=R(-M.max,M.max);
  const op=pick(OPS);
  const b=-a*x0;
  const newOp=flipOp(op);
  const text=`變色龍偽裝在方程式 ${-a}x ${op} ${b} 中，求解 x 的範圍（記得同除以負數要翻轉不等號）。`;
  const ans=`x ${newOp} ${x0}`;
  const wrong1=`x ${op} ${x0}`;
  const otherOps=OPS.filter(o=>o!==newOp&&o!==op);
  const wrongs=[wrong1,...otherOps.map(o=>`x ${o} ${x0}`)];
  return {text,ans,options:ensure4(ans,wrongs),
    hint:'兩邊同除以負的係數時，不等號方向一定要翻轉：> 變 <，≥ 變 ≤，反之亦然。',
    explain:`${-a}x ${op} ${b}，兩邊同除以 ${-a}（負數），不等號方向翻轉，得 x ${newOp} ${x0}。`};
}
function genApplyOp(M){
  let c=R(-M.max,M.max);
  while(c===0)c=R(-M.max,M.max);
  const op=pick(OPS);
  let n=R(-M.max,M.max);
  while(n===0||n===1)n=R(-M.max,M.max);
  const newOp=n<0?flipOp(op):op;
  const wrongOp=n<0?op:flipOp(op);/* 錯誤符號：該翻轉卻沒翻，或不該翻卻翻了 */
  const newC=n*c;
  const text=`已知 x ${op} ${c}，如果不等式兩邊同乘以 ${n}，會得到什麼結果？`;
  const ans=`${n}x ${newOp} ${newC}`;
  const wrong1=`${n}x ${wrongOp} ${newC}`;
  const wrong2=`${n}x ${newOp} ${c}`;
  const wrong3=`${n}x ${wrongOp} ${c}`;
  return {text,ans,options:ensure4(ans,[wrong1,wrong2,wrong3]),
    hint:`兩邊同乘以 ${n<0?'負數，不等號方向要翻轉，':'正數，不等號方向不變，'}同時把右邊的數字也乘上 ${n}。`,
    explain:`兩邊同乘以 ${n}：左邊變成 ${n}x，右邊變成 ${n}×${c}=${newC}，${n<0?'因為乘的是負數，不等號方向翻轉':'因為乘的是正數，不等號方向不變'}，所以是 ${n}x ${newOp} ${newC}。`};
}
function genConceptCheck(M){
  const [stmt,real]=pick(STATEMENTS);
  const text=`判斷下列敘述是否正確：『${stmt}』`;
  const ans=real?'正確':'錯誤';
  return {text,ans,options:['正確','錯誤','部分正確','需視情況而定'],
    hint:'加減不會改變方向；乘除正數不會改變方向；乘除負數一定要翻轉方向。',
    explain:`這個敘述${real?'是正確的':'是錯誤的'}。${real?'':'正確的規則是：乘或除以負數時，方向才需要翻轉。'}`};
}
function gen(t){
  const M=MODES[mode];
  if(t==='flipOrNot')return genFlipOrNot(M);
  if(t==='solveFlip')return genSolveFlip(M);
  if(t==='applyOp')return genApplyOp(M);
  return genConceptCheck(M);
}
/* ===== 題庫擴充：同一題型多幾種問法，避免一直遇到同一題 ===== */
(function(){
  const _g=gen;
  const mk=(text,ans,wrongs,hint,explain)=>({text,ans,options:ensure4(ans,wrongs),hint,explain});
  const BANK={};
  STATEMENTS.push(
    ['不等式兩邊同除以一個負數，不等號方向要翻轉。',true],
    ['不等式兩邊同減去一個數，不等號方向要翻轉。',false],
    ['若 a > b，則 a + 3 > b + 3。',true],
    ['若 a > b，則 −2a > −2b。',false],
    ['若 a > b，則 −2a < −2b。',true],
    ['不等式 −x > 3 兩邊同乘 −1，會變成 x < −3。',true],
    ['不等式兩邊同乘以一個正數，不等號方向會翻轉。',false]);

  gen=function(t){const B=BANK[t];if(B&&Math.random()<B.p){return B.make();}return _g.apply(this,arguments);};
})();

return {plan:['flipOrNot','solveFlip','applyOp','conceptCheck','flipOrNot','applyOp','solveFlip','conceptCheck','applyOp','flipOrNot'],gen:function(t,m){mode=m;return gen(t);}};
})();

JB2.stages['4-2-2']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
function ensure4(ans,cands){
  const s=new Set([ans]);
  for(const c of cands){const cs=String(c);if(s.size<4&&cs!==ans&&cs.trim()!=='')s.add(cs);}
  /* 誘答選項不夠時：答案不是純數字就「改動答案裡的一個數字」補齊（例如 (5, 5)→(5, 4)），不再塞無關的 -5、6 */
  if(s.size<4&&!/^-?\d+(\.\d+)?$/.test(String(ans))){
    const str=String(ans),vars=[],re=/\d+(?:\.\d+)?/g;let mm;
    while((mm=re.exec(str))!==null){for(const d of [1,-1,2,-2,3,-3]){const nv=Number(mm[0])+d;if(nv<0)continue;const dec=(mm[0].split('.')[1]||'').length;vars.push(str.slice(0,mm.index)+(dec?nv.toFixed(dec):nv)+str.slice(mm.index+mm[0].length));}}
    for(let i=vars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[vars[i],vars[j]]=[vars[j],vars[i]];}
    for(const v of vars){if(s.size>=4)break;if(!s.has(v))s.add(v);}
  }
  let g=1;
  while(s.size<4){const v=(Number(ans)||0)+(g%2===0?g/2+5:-(Math.ceil(g/2)+4));const vs=String(v);if(!s.has(vs))s.add(vs);g++;}
  return sh([...s]);
}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);return b?gcd(b,a%b):(a||1)}
function lcm(a,b){return Math.abs(a*b)/gcd(a,b)}
/* 坐標平面 SVG 繪圖工具：points 畫點、lines 畫 ax+by=c 直線、dashedTo 畫到兩軸的虛線 */
function lineSegPoints(a,b,c,R2){
  const pts=[];
  if(b!==0){[-R2,R2].forEach(x=>{const y=(c-a*x)/b;if(y>=-R2-0.0001&&y<=R2+0.0001)pts.push([x,y]);});}
  if(a!==0){[-R2,R2].forEach(y=>{const x=(c-b*y)/a;if(x>=-R2-0.0001&&x<=R2+0.0001)pts.push([x,y]);});}
  if(pts.length<2)return null;
  pts.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);
  return [pts[0],pts[pts.length-1]];
}
function svgGrid(opts){
  const RG=opts.range||7,S=260,C=S/2,U=(S-36)/(2*RG);
  const toX=x=>C+x*U,toY=y=>C-y*U;
  let g=`<div class="qsvg"><svg viewBox="0 0 ${S} ${S}" style="width:100%;max-width:260px;background:#fff;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  for(let i=-RG;i<=RG;i++){
    g+=`<line x1="${toX(i)}" y1="${toY(-RG)}" x2="${toX(i)}" y2="${toY(RG)}" stroke="#e3e3e3" stroke-width="1"/>`;
    g+=`<line x1="${toX(-RG)}" y1="${toY(i)}" x2="${toX(RG)}" y2="${toY(i)}" stroke="#e3e3e3" stroke-width="1"/>`;
  }
  g+=`<line x1="${toX(-RG)}" y1="${toY(0)}" x2="${toX(RG)}" y2="${toY(0)}" stroke="#333" stroke-width="2"/>`;
  g+=`<line x1="${toX(0)}" y1="${toY(-RG)}" x2="${toX(0)}" y2="${toY(RG)}" stroke="#333" stroke-width="2"/>`;
  g+=`<text x="${toX(RG)-10}" y="${toY(0)-6}" font-size="12" fill="#333">x</text><text x="${toX(0)+6}" y="${toY(RG)+12}" font-size="12" fill="#333">y</text>`;
  (opts.lines||[]).forEach(ln=>{
    const pts=lineSegPoints(ln.a,ln.b,ln.c,RG);
    if(pts)g+=`<line x1="${toX(pts[0][0])}" y1="${toY(pts[0][1])}" x2="${toX(pts[1][0])}" y2="${toY(pts[1][1])}" stroke="${ln.color||'#d24a33'}" stroke-width="2.5"/>`;
  });
  (opts.dashedTo||[]).forEach(p=>{
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(p.x)}" y2="${toY(0)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(0)}" y2="${toY(p.y)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
  });
  (opts.points||[]).forEach(p=>{
    g+=`<circle cx="${toX(p.x)}" cy="${toY(p.y)}" r="4.5" fill="${p.color||'#d24a33'}"/>`;
    if(p.label)g+=`<text x="${toX(p.x)+6}" y="${toY(p.y)-6}" font-size="12" font-weight="700" fill="${p.color||'#d24a33'}">${p.label}</text>`;
  });
  g+='</svg></div>';
  return g;
}
function fmtEq(a,b,c){
  return (a===1?'':a)+'x + '+(b===1?'':b)+'y = '+c;
}
function fmtEqGen(a,b,c){
  let s=(a===1?'':a===-1?'-':a)+'x';
  s+=b>=0?' + '+(b===1?'':b)+'y':' - '+(Math.abs(b)===1?'':Math.abs(b))+'y';
  s+=' = '+c;
  return s;
}
const QUADS=['第一象限','第二象限','第三象限','第四象限'];
function quadName(x,y){
  if(x===0&&y===0)return '原點（不屬於任何象限）';
  if(x===0)return 'y 軸上（不屬於任何象限）';
  if(y===0)return 'x 軸上（不屬於任何象限）';
  if(x>0&&y>0)return '第一象限';
  if(x<0&&y>0)return '第二象限';
  if(x<0&&y<0)return '第三象限';
  return '第四象限';
}
function coprimePair(max){
  let p,q;
  do{p=R(1,max);q=R(1,max);}while(gcd(p,q)!==1);
  return [p,q];
}
function fmtNum(n){
  if(Number.isInteger(n))return String(n);
  return String(Math.round(n*100)/100);
}
const OPS=['>','<','≥','≤'];
function evalOp(lhs,op,rhs){
  if(op==='>')return lhs>rhs;
  if(op==='<')return lhs<rhs;
  if(op==='≥')return lhs>=rhs;
  return lhs<=rhs;
}
function flipOp(op){
  return op==='>'?'<':op==='<'?'>':op==='≥'?'≤':'≥';
}
function svgNumberLine(boundary,op,range){
  const R2=range||8,S=280,PADX=20;
  const toX=v=>PADX+(v+R2)/(2*R2)*(S-2*PADX);
  let g=`<div class="qsvg"><svg viewBox="0 0 ${S} 60" style="width:100%;max-width:280px;background:#fff;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  g+=`<line x1="${toX(-R2)}" y1="30" x2="${toX(R2)}" y2="30" stroke="#333" stroke-width="2"/>`;
  for(let i=-R2;i<=R2;i++){
    g+=`<line x1="${toX(i)}" y1="26" x2="${toX(i)}" y2="34" stroke="#999" stroke-width="1"/>`;
    if(i%2===0||R2<=6)g+=`<text x="${toX(i)}" y="48" font-size="9" fill="#555" text-anchor="middle">${i}</text>`;
  }
  const filled=(op==='≥'||op==='≤');
  const dir=(op==='>'||op==='≥')?1:-1;
  const endX=dir>0?toX(R2):toX(-R2);
  g+=`<line x1="${toX(boundary)}" y1="30" x2="${endX}" y2="30" stroke="#d24a33" stroke-width="4"/>`;
  g+=`<circle cx="${toX(boundary)}" cy="30" r="5" fill="${filled?'#d24a33':'#fff'}" stroke="#d24a33" stroke-width="2.5"/>`;
  const tipX=dir>0?endX-7:endX+7;
  g+=`<polygon points="${tipX},26 ${tipX},34 ${endX},30" fill="#d24a33"/>`;
  g+='</svg></div>';
  return g;
}
const MODES={easy:{t:0,max:4},real:{t:15,max:6},hard:{t:10,max:8}};
const PLAN=['oneStep','twoSided','distribute','oneStep','twoSided','distribute','twoSided','oneStep','distribute','twoSided'];

const nz=(lo,hi)=>{let v;do{v=R(lo,hi);}while(v===0);return v;};
const cx=n=>n===1?'x':n===-1?'-x':n+'x';
function genOneStep(M){
  const a=R(2,M.max);
  const x0=R(-M.max,M.max);
  const b=nz(-M.max,M.max);
  const op=pick(OPS);
  const c=a*x0+b;
  const text=`移項解鎖獸的第一道鎖鏈是：${a}x ${b>=0?'+ '+b:'- '+Math.abs(b)} ${op} ${c}，解出 x 的範圍。`;
  const ans=`x ${op} ${x0}`;
  const otherOps=OPS.filter(o=>o!==op);
  const wrongs=otherOps.map(o=>`x ${o} ${x0}`);
  return {text,ans,options:ensure4(ans,wrongs),
    hint:'先把常數項移到右邊（正負號要變），因為係數是正數，不等號方向不變。',
    explain:`${a}x ${b>=0?'+ '+b:'- '+Math.abs(b)} ${op} ${c}，移項得 ${a}x ${op} ${c-b}，兩邊除以 ${a}（正數，方向不變），得 x ${op} ${x0}。`};
}
function genTwoSided(M){
  const x0=R(-M.max,M.max);
  const a=R(1,M.max);
  let d=R(1,M.max);
  while(d===a)d=R(1,M.max);
  let b,e;
  do{b=R(-M.max,M.max);e=a*x0+b-d*x0;}while(b===0||e===0);
  const op=pick(OPS);
  const netCoef=a-d;
  const finalOp=netCoef<0?flipOp(op):op;
  const text=`移項解鎖獸噴出鎖鏈：${a===1?'':a}x ${b>=0?'+ '+b:'- '+Math.abs(b)} ${op} ${d===1?'':d}x ${e>=0?'+ '+e:'- '+Math.abs(e)}，解出 x 的範圍。`;
  const ans=`x ${finalOp} ${x0}`;
  const otherOps=OPS.filter(o=>o!==finalOp);
  const wrongs=otherOps.map(o=>`x ${o} ${x0}`);
  return {text,ans,options:ensure4(ans,wrongs),
    hint:'先把含 x 的項移到同一邊、常數移到另一邊；如果最後 x 的係數是負數，記得要翻轉不等號方向。',
    explain:`移項合併同類項後得 ${cx(netCoef)} ${op} ${e-b}，${netCoef<0?'兩邊除以負數，不等號方向要翻轉，':'兩邊除以正數，方向不變，'}解得 x ${finalOp} ${x0}。`};
}
function genDistribute(M){
  let a=R(2,M.max);
  if(mode==='hard'&&Math.random()<0.5)a=-a;
  const b=nz(-M.max,M.max);
  const x0=R(-M.max,M.max);
  const op=pick(OPS);
  const c=a*x0+a*b;
  const finalOp=a<0?flipOp(op):op;
  const bStr=b>=0?`x + ${b}`:`x - ${Math.abs(b)}`;
  const text=`移項解鎖獸的進階鎖鏈：${a}(${bStr}) ${op} ${c}，解出 x 的範圍。`;
  const ans=`x ${finalOp} ${x0}`;
  const otherOps=OPS.filter(o=>o!==finalOp);
  const wrongs=otherOps.map(o=>`x ${o} ${x0}`);
  return {text,ans,options:ensure4(ans,wrongs),
    hint:'先用分配律展開括號，再移項求解；如果係數是負數，記得除的時候要翻轉不等號。',
    explain:`展開得 ${a}x ${a*b>=0?'+ '+a*b:'- '+Math.abs(a*b)} ${op} ${c}，移項並除以 ${a}${a<0?'（負數，方向翻轉）':'（正數，方向不變）'}，解得 x ${finalOp} ${x0}。`};
}
function gen(t){
  const M=MODES[mode];
  if(t==='oneStep')return genOneStep(M);
  if(t==='twoSided')return genTwoSided(M);
  return genDistribute(M);
}

return {plan:['oneStep','twoSided','distribute','oneStep','twoSided','distribute','twoSided','oneStep','distribute','twoSided'],gen:function(t,m){mode=m;return gen(t);}};
})();

JB2.stages['4-2-3']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
function ensure4(ans,cands){
  const s=new Set([ans]);
  for(const c of cands){const cs=String(c);if(s.size<4&&cs!==ans&&cs.trim()!=='')s.add(cs);}
  /* 誘答選項不夠時：答案不是純數字就「改動答案裡的一個數字」補齊（例如 (5, 5)→(5, 4)），不再塞無關的 -5、6 */
  if(s.size<4&&!/^-?\d+(\.\d+)?$/.test(String(ans))){
    const str=String(ans),vars=[],re=/\d+(?:\.\d+)?/g;let mm;
    while((mm=re.exec(str))!==null){for(const d of [1,-1,2,-2,3,-3]){const nv=Number(mm[0])+d;if(nv<0)continue;const dec=(mm[0].split('.')[1]||'').length;vars.push(str.slice(0,mm.index)+(dec?nv.toFixed(dec):nv)+str.slice(mm.index+mm[0].length));}}
    for(let i=vars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[vars[i],vars[j]]=[vars[j],vars[i]];}
    for(const v of vars){if(s.size>=4)break;if(!s.has(v))s.add(v);}
  }
  let g=1;
  while(s.size<4){const v=(Number(ans)||0)+(g%2===0?g/2+5:-(Math.ceil(g/2)+4));const vs=String(v);if(!s.has(vs))s.add(vs);g++;}
  return sh([...s]);
}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);return b?gcd(b,a%b):(a||1)}
function lcm(a,b){return Math.abs(a*b)/gcd(a,b)}
/* 坐標平面 SVG 繪圖工具：points 畫點、lines 畫 ax+by=c 直線、dashedTo 畫到兩軸的虛線 */
function lineSegPoints(a,b,c,R2){
  const pts=[];
  if(b!==0){[-R2,R2].forEach(x=>{const y=(c-a*x)/b;if(y>=-R2-0.0001&&y<=R2+0.0001)pts.push([x,y]);});}
  if(a!==0){[-R2,R2].forEach(y=>{const x=(c-b*y)/a;if(x>=-R2-0.0001&&x<=R2+0.0001)pts.push([x,y]);});}
  if(pts.length<2)return null;
  pts.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);
  return [pts[0],pts[pts.length-1]];
}
function svgGrid(opts){
  const RG=opts.range||7,S=260,C=S/2,U=(S-36)/(2*RG);
  const toX=x=>C+x*U,toY=y=>C-y*U;
  let g=`<div class="qsvg"><svg viewBox="0 0 ${S} ${S}" style="width:100%;max-width:260px;background:#fff;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  for(let i=-RG;i<=RG;i++){
    g+=`<line x1="${toX(i)}" y1="${toY(-RG)}" x2="${toX(i)}" y2="${toY(RG)}" stroke="#e3e3e3" stroke-width="1"/>`;
    g+=`<line x1="${toX(-RG)}" y1="${toY(i)}" x2="${toX(RG)}" y2="${toY(i)}" stroke="#e3e3e3" stroke-width="1"/>`;
  }
  g+=`<line x1="${toX(-RG)}" y1="${toY(0)}" x2="${toX(RG)}" y2="${toY(0)}" stroke="#333" stroke-width="2"/>`;
  g+=`<line x1="${toX(0)}" y1="${toY(-RG)}" x2="${toX(0)}" y2="${toY(RG)}" stroke="#333" stroke-width="2"/>`;
  g+=`<text x="${toX(RG)-10}" y="${toY(0)-6}" font-size="12" fill="#333">x</text><text x="${toX(0)+6}" y="${toY(RG)+12}" font-size="12" fill="#333">y</text>`;
  (opts.lines||[]).forEach(ln=>{
    const pts=lineSegPoints(ln.a,ln.b,ln.c,RG);
    if(pts)g+=`<line x1="${toX(pts[0][0])}" y1="${toY(pts[0][1])}" x2="${toX(pts[1][0])}" y2="${toY(pts[1][1])}" stroke="${ln.color||'#d24a33'}" stroke-width="2.5"/>`;
  });
  (opts.dashedTo||[]).forEach(p=>{
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(p.x)}" y2="${toY(0)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(0)}" y2="${toY(p.y)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
  });
  (opts.points||[]).forEach(p=>{
    g+=`<circle cx="${toX(p.x)}" cy="${toY(p.y)}" r="4.5" fill="${p.color||'#d24a33'}"/>`;
    if(p.label)g+=`<text x="${toX(p.x)+6}" y="${toY(p.y)-6}" font-size="12" font-weight="700" fill="${p.color||'#d24a33'}">${p.label}</text>`;
  });
  g+='</svg></div>';
  return g;
}
function fmtEq(a,b,c){
  return (a===1?'':a)+'x + '+(b===1?'':b)+'y = '+c;
}
function fmtEqGen(a,b,c){
  let s=(a===1?'':a===-1?'-':a)+'x';
  s+=b>=0?' + '+(b===1?'':b)+'y':' - '+(Math.abs(b)===1?'':Math.abs(b))+'y';
  s+=' = '+c;
  return s;
}
const QUADS=['第一象限','第二象限','第三象限','第四象限'];
function quadName(x,y){
  if(x===0&&y===0)return '原點（不屬於任何象限）';
  if(x===0)return 'y 軸上（不屬於任何象限）';
  if(y===0)return 'x 軸上（不屬於任何象限）';
  if(x>0&&y>0)return '第一象限';
  if(x<0&&y>0)return '第二象限';
  if(x<0&&y<0)return '第三象限';
  return '第四象限';
}
function coprimePair(max){
  let p,q;
  do{p=R(1,max);q=R(1,max);}while(gcd(p,q)!==1);
  return [p,q];
}
function fmtNum(n){
  if(Number.isInteger(n))return String(n);
  return String(Math.round(n*100)/100);
}
const OPS=['>','<','≥','≤'];
function evalOp(lhs,op,rhs){
  if(op==='>')return lhs>rhs;
  if(op==='<')return lhs<rhs;
  if(op==='≥')return lhs>=rhs;
  return lhs<=rhs;
}
function flipOp(op){
  return op==='>'?'<':op==='<'?'>':op==='≥'?'≤':'≥';
}
function svgNumberLine(boundary,op,range){
  const R2=range||8,S=280,PADX=20;
  const toX=v=>PADX+(v+R2)/(2*R2)*(S-2*PADX);
  let g=`<div class="qsvg"><svg viewBox="0 0 ${S} 60" style="width:100%;max-width:280px;background:#fff;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  g+=`<line x1="${toX(-R2)}" y1="30" x2="${toX(R2)}" y2="30" stroke="#333" stroke-width="2"/>`;
  for(let i=-R2;i<=R2;i++){
    g+=`<line x1="${toX(i)}" y1="26" x2="${toX(i)}" y2="34" stroke="#999" stroke-width="1"/>`;
    if(i%2===0||R2<=6)g+=`<text x="${toX(i)}" y="48" font-size="9" fill="#555" text-anchor="middle">${i}</text>`;
  }
  const filled=(op==='≥'||op==='≤');
  const dir=(op==='>'||op==='≥')?1:-1;
  const endX=dir>0?toX(R2):toX(-R2);
  g+=`<line x1="${toX(boundary)}" y1="30" x2="${endX}" y2="30" stroke="#d24a33" stroke-width="4"/>`;
  g+=`<circle cx="${toX(boundary)}" cy="30" r="5" fill="${filled?'#d24a33':'#fff'}" stroke="#d24a33" stroke-width="2.5"/>`;
  const tipX=dir>0?endX-7:endX+7;
  g+=`<polygon points="${tipX},26 ${tipX},34 ${endX},30" fill="#d24a33"/>`;
  g+='</svg></div>';
  return g;
}
const MODES={easy:{t:0,max:6},real:{t:15,max:8},hard:{t:10,max:10}};
const PLAN=['budgetMax','minCount','setupApp','budgetMax','setupApp','minCount','budgetMax','setupApp','minCount','budgetMax'];
const ITEMS=[['礦泉水','瓶',15],['麵包','個',25],['貼紙','張',10],['文具','個',20],['餅乾','包',18]];
const FIXED=[['便當',60],['入場費',50],['運費',30],['基本費',40]];

/* 用語庫：[詞, 符號, 數字放後面?]。以上／以下要把數字放在前面（240 元以下） */
const WMAX=[['不超過','≤'],['至多','≤'],['最多','≤'],['不大於','≤'],['以下','≤',1]];
const WMIN=[['不低於','≥'],['至少','≥'],['最少','≥'],['最低','≥'],['不小於','≥'],['以上','≥',1]];
const WSTR_MAX=['未滿','<'], WSTR_MIN=['超過','>'];   /* 嚴格（不含等於）：只在列式題，或確定不會整除時才用 */
const rd=(total,w,B,cu)=>w[2]?`${total}是 ${B} ${cu}${w[0]}`:`${total}${w[0]} ${B} ${cu}`;
/* 情境庫：每個情境都是「p·x + f 對 B」的不等式，只是故事不同。meta 給小老師用 */
function sceneMax(){
  const k=pick(['shop','shop','lift','taxi','phone','park']);
  if(k==='lift'){const p=pick([4,5,6,8,10]),f=pick([40,45,50,55]);return {k,p,f,unit:'箱',cu:'公斤',total:'總重量',per:'每箱',ask:'最多可以搬幾箱書？',story:(B,W)=>`電梯載重上限是 ${B} 公斤，小明自己重 ${f} 公斤，他要搬 x 箱書上樓，每箱重 ${p} 公斤，${W}。`};}
  if(k==='taxi'){const p=pick([5,6,8,10,12]),f=pick([50,70,85]);return {k,p,f,unit:'公里',cu:'元',total:'總車資',per:'每公里',ask:'最多可以搭幾公里？（只算整公里）',story:(B,W)=>`搭計程車要先付起跳價 ${f} 元，之後每搭 1 公里再付 ${p} 元。小華搭 x 公里，${W}。`};}
  if(k==='phone'){const p=pick([2,3,4,5]),f=pick([199,299,399]);return {k,p,f,unit:'分鐘',cu:'元',total:'總月費',per:'每分鐘',ask:'最多可以多通話幾分鐘？',story:(B,W)=>`手機方案月租 ${f} 元，每通話 1 分鐘另收 ${p} 元。小美這個月通話 x 分鐘，${W}。`};}
  if(k==='park'){const p=pick([20,30,40,50]),f=pick([100,150,200]);return {k,p,f,unit:'項',cu:'元',total:'總花費',per:'每項',ask:'最多可以玩幾項設施？',story:(B,W)=>`遊樂園入場費 ${f} 元，每玩 1 項設施要再付 ${p} 元。小傑玩 x 項設施，${W}。`};}
  const [item,unit,p]=pick(ITEMS);const [fname,f]=pick(FIXED);
  return {k:'shop',p,f,unit,cu:'元',total:'總花費',per:'每'+unit,ask:`最多可以買幾${unit}${item}？`,story:(B,W)=>`到超商買 x ${unit}${item}，每${unit} ${p} 元，另外還要付${fname} ${f} 元，${W}。`};
}
function sceneMin(){
  const k=pick(['profit','saving','water']);
  if(k==='saving'){const p=pick([30,40,50,60]),f=pick([100,150,200,250]);return {k,p,f,unit:'週',cu:'元',total:'存款',per:'每週',ask:'至少要存幾週？',story:(B,W)=>`小明想買一台 ${B} 元的耳機。他現在已有 ${f} 元，之後每週再存 ${p} 元。存 x 週後，${W}才買得起。`};}
  if(k==='water'){const p=pick([3,4,5,6]),f=pick([20,30,40]);return {k,p,f,unit:'分鐘',cu:'公升',total:'水量',per:'每分鐘',ask:'至少要注水幾分鐘？',story:(B,W)=>`水池裡原本有 ${f} 公升的水，水龍頭每分鐘再注入 ${p} 公升。注水 x 分鐘後，${W}才夠用。`};}
  return {k:'profit',p:0,f:0,unit:'件',cu:'元',total:'利潤',per:'每件',ask:'至少要賣出幾件商品？'};
}
function metaOf(sc,kind,p,f,B,w){return {k:sc.k,kind,p,f,B,unit:sc.unit,cu:sc.cu,total:sc.total,per:sc.per,ask:sc.ask,word:w[0],sym:w[1],post:!!w[2]};}
function genBudgetMax(M){
  const sc=sceneMax(),p=sc.p,f=sc.f;
  const xTarget=R(1,M.max);
  let extra=R(0,p-1);
  let w=pick(WMAX);
  if(extra>=1&&Math.random()<0.15)w=WSTR_MAX;   /* 不整除時，「未滿」和「不超過」的最大整數解相同 */
  const B=p*xTarget+f+extra;
  const maxX=Math.floor((B-f)/p);
  const text=`限額購物怪出題：${sc.story(B,rd(sc.total,w,B,sc.cu))}${sc.ask}`;
  const ans=String(maxX);
  return {text,ans,options:ensure4(ans,[String(maxX+1),String(maxX-1>=0?maxX-1:maxX+2),String(Math.floor(B/p))]),
    meta:metaOf(sc,'max',p,f,B,w),
    hint:`先列出不等式：${p}x + ${f} ${w[1]} ${B}（「${w[0]}」是 ${w[1]}），解出 x 的範圍後，因為「${sc.unit}」是整數單位，取最大整數解。`,
    explain:`列出 ${p}x + ${f} ${w[1]} ${B}，解得 x ${w[1]} ${fmtNum((B-f)/p)}，因為 x 必須是整數，所以最多是 ${maxX} ${sc.unit}。`};
}
function genMinCount(M){
  const sc=sceneMin();
  const profit=R(2,M.max), xMin=R(2,M.max), r=R(0,profit-1);
  let w=pick(WMIN);
  const mk=(p,f,B,sc2)=>{
    if(r>=1&&Math.random()<0.15)w=WSTR_MIN;
    return w;};
  if(sc.k==='profit'){
    const target=profit*xMin-r; mk();
    const text=`限額購物怪出題：賣一件商品可以賺 ${profit} 元，如果${rd('利潤',w,target,'元')}，${sc.ask}`;
    const ans=String(xMin);
    return {text,ans,options:ensure4(ans,[String(xMin+1),String(xMin-1>=0?xMin-1:xMin+2),String(target)]),
      meta:metaOf({k:'profit',unit:'件',cu:'元',total:'利潤',per:'每件',ask:sc.ask},'min',profit,0,target,w),
      hint:`先列出不等式：${profit}x ${w[1]} ${target}（「${w[0]}」是 ${w[1]}），解出 x 的範圍後，因為件數必須是整數，取最小整數解。`,
      explain:`列出 ${profit}x ${w[1]} ${target}，解得 x ${w[1]} ${fmtNum(target/profit)}，因為 x 必須是整數，所以至少要賣 ${xMin} 件。`};
  }
  const p=sc.p,f=sc.f,r2=R(0,p-1),B=f+p*xMin-r2;
  w=pick(WMIN); if(r2>=1&&Math.random()<0.15)w=WSTR_MIN;
  const text=`限額購物怪出題：${sc.story(B,rd(sc.total,w,B,sc.cu))}${sc.ask}`;
  const ans=String(xMin);
  return {text,ans,options:ensure4(ans,[String(xMin+1),String(xMin-1>=0?xMin-1:xMin+2),String(Math.floor((B-f)/p))]),
    meta:metaOf(sc,'min',p,f,B,w),
    hint:`先列出不等式：${p}x + ${f} ${w[1]} ${B}（「${w[0]}」是 ${w[1]}），解出 x 的範圍後，因為「${sc.unit}」要用整數，取最小整數解。`,
    explain:`列出 ${p}x + ${f} ${w[1]} ${B}，解得 x ${w[1]} ${fmtNum((B-f)/p)}，因為 x 必須是整數，所以至少要 ${xMin} ${sc.unit}。`};
}
function genSetupApp(M){
  const kind=pick(['max','max','min']);
  let sc,B,w;
  if(kind==='max'){sc=sceneMax();B=R(5,M.max)*20+sc.f;w=pick(WMAX.concat([WSTR_MAX]));}
  else{sc=sceneMin();
    if(sc.k==='profit'){sc={k:'saving',p:50,f:100,unit:'週',cu:'元',total:'存款',per:'每週',ask:'',story:(B,W)=>`小明想買一台 ${B} 元的耳機。他現在已有 100 元，之後每週再存 50 元。存 x 週後，${W}才買得起。`};}
    B=R(5,M.max)*20+sc.f;w=pick(WMIN.concat([WSTR_MIN]));}
  const text=`限額購物怪出題：${sc.story(B,rd(sc.total,w,B,sc.cu))}請列出正確的不等式（不用求解）。`;
  const p=sc.p,f=sc.f,sym=w[1];
  const ans=`${p}x + ${f} ${sym} ${B}`;
  const flip={'≤':'≥','≥':'≤','<':'>','>':'<'}[sym], alt={'≤':'<','≥':'>','<':'≤','>':'≥'}[sym];
  return {text,ans,options:ensure4(ans,[`${p}x + ${f} ${flip} ${B}`,`${p}x + ${f} ${alt} ${B}`,`${p}x − ${f} ${sym} ${B}`]),
    meta:Object.assign(metaOf(sc,kind,p,f,B,w),{}),
    hint:`「${w[0]}」代表${{'≤':'小於或等於（≤）','≥':'大於或等於（≥）','<':'小於（＜，不含等於）','>':'大於（＞，不含等於）'}[sym]}；${sc.total} = 每份的量×份數 + 原本就有（或固定）的量。`,
    explain:`${sc.total}為 ${p}x + ${f}，「${w[0]}」代表 ${sym}，所以不等式為 ${p}x + ${f} ${sym} ${B}。`};
}
function gen(t){
  const M=MODES[mode];
  if(t==='budgetMax')return genBudgetMax(M);
  if(t==='minCount')return genMinCount(M);
  return genSetupApp(M);
}

return {plan:['budgetMax','minCount','setupApp','budgetMax','setupApp','minCount','budgetMax','setupApp','minCount','budgetMax'],gen:function(t,m){mode=m;return gen(t);}};
})();

JB2.stages['5-1-1']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
function ensure4(ans,cands){
  const s=new Set([ans]);
  for(const c of cands){const cs=String(c);if(s.size<4&&cs!==ans&&cs.trim()!=='')s.add(cs);}
  /* 誘答選項不夠時：答案不是純數字就「改動答案裡的一個數字」補齊（例如 (5, 5)→(5, 4)），不再塞無關的 -5、6 */
  if(s.size<4&&!/^-?\d+(\.\d+)?$/.test(String(ans))){
    const str=String(ans),vars=[],re=/\d+(?:\.\d+)?/g;let mm;
    while((mm=re.exec(str))!==null){for(const d of [1,-1,2,-2,3,-3]){const nv=Number(mm[0])+d;if(nv<0)continue;const dec=(mm[0].split('.')[1]||'').length;vars.push(str.slice(0,mm.index)+(dec?nv.toFixed(dec):nv)+str.slice(mm.index+mm[0].length));}}
    for(let i=vars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[vars[i],vars[j]]=[vars[j],vars[i]];}
    for(const v of vars){if(s.size>=4)break;if(!s.has(v))s.add(v);}
  }
  let g=1;
  while(s.size<4){const v=(Number(ans)||0)+(g%2===0?g/2+5:-(Math.ceil(g/2)+4));const vs=String(v);if(!s.has(vs))s.add(vs);g++;}
  return sh([...s]);
}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);return b?gcd(b,a%b):(a||1)}
function lcm(a,b){return Math.abs(a*b)/gcd(a,b)}
/* 坐標平面 SVG 繪圖工具：points 畫點、lines 畫 ax+by=c 直線、dashedTo 畫到兩軸的虛線 */
function lineSegPoints(a,b,c,R2){
  const pts=[];
  if(b!==0){[-R2,R2].forEach(x=>{const y=(c-a*x)/b;if(y>=-R2-0.0001&&y<=R2+0.0001)pts.push([x,y]);});}
  if(a!==0){[-R2,R2].forEach(y=>{const x=(c-b*y)/a;if(x>=-R2-0.0001&&x<=R2+0.0001)pts.push([x,y]);});}
  if(pts.length<2)return null;
  pts.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);
  return [pts[0],pts[pts.length-1]];
}
function svgGrid(opts){
  const RG=opts.range||7,S=260,C=S/2,U=(S-36)/(2*RG);
  const toX=x=>C+x*U,toY=y=>C-y*U;
  let g=`<div class="qsvg"><svg viewBox="0 0 ${S} ${S}" style="width:100%;max-width:260px;background:#fff;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  for(let i=-RG;i<=RG;i++){
    g+=`<line x1="${toX(i)}" y1="${toY(-RG)}" x2="${toX(i)}" y2="${toY(RG)}" stroke="#e3e3e3" stroke-width="1"/>`;
    g+=`<line x1="${toX(-RG)}" y1="${toY(i)}" x2="${toX(RG)}" y2="${toY(i)}" stroke="#e3e3e3" stroke-width="1"/>`;
  }
  g+=`<line x1="${toX(-RG)}" y1="${toY(0)}" x2="${toX(RG)}" y2="${toY(0)}" stroke="#333" stroke-width="2"/>`;
  g+=`<line x1="${toX(0)}" y1="${toY(-RG)}" x2="${toX(0)}" y2="${toY(RG)}" stroke="#333" stroke-width="2"/>`;
  g+=`<text x="${toX(RG)-10}" y="${toY(0)-6}" font-size="12" fill="#333">x</text><text x="${toX(0)+6}" y="${toY(RG)+12}" font-size="12" fill="#333">y</text>`;
  (opts.lines||[]).forEach(ln=>{
    const pts=lineSegPoints(ln.a,ln.b,ln.c,RG);
    if(pts)g+=`<line x1="${toX(pts[0][0])}" y1="${toY(pts[0][1])}" x2="${toX(pts[1][0])}" y2="${toY(pts[1][1])}" stroke="${ln.color||'#d24a33'}" stroke-width="2.5"/>`;
  });
  (opts.dashedTo||[]).forEach(p=>{
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(p.x)}" y2="${toY(0)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(0)}" y2="${toY(p.y)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
  });
  (opts.points||[]).forEach(p=>{
    g+=`<circle cx="${toX(p.x)}" cy="${toY(p.y)}" r="4.5" fill="${p.color||'#d24a33'}"/>`;
    if(p.label)g+=`<text x="${toX(p.x)+6}" y="${toY(p.y)-6}" font-size="12" font-weight="700" fill="${p.color||'#d24a33'}">${p.label}</text>`;
  });
  g+='</svg></div>';
  return g;
}
function fmtEq(a,b,c){
  return (a===1?'':a)+'x + '+(b===1?'':b)+'y = '+c;
}
function fmtEqGen(a,b,c){
  let s=(a===1?'':a===-1?'-':a)+'x';
  s+=b>=0?' + '+(b===1?'':b)+'y':' - '+(Math.abs(b)===1?'':Math.abs(b))+'y';
  s+=' = '+c;
  return s;
}
const QUADS=['第一象限','第二象限','第三象限','第四象限'];
function quadName(x,y){
  if(x===0&&y===0)return '原點（不屬於任何象限）';
  if(x===0)return 'y 軸上（不屬於任何象限）';
  if(y===0)return 'x 軸上（不屬於任何象限）';
  if(x>0&&y>0)return '第一象限';
  if(x<0&&y>0)return '第二象限';
  if(x<0&&y<0)return '第三象限';
  return '第四象限';
}
function fmtNum(n){
  if(Number.isInteger(n))return String(n);
  return String(Math.round(n*100)/100);
}
const MODES={easy:{t:0,totalMax:5},real:{t:15,totalMax:7},hard:{t:10,totalMax:9}};
const PLAN=['percentCalc','fractionCalc','findMissing','findPercent','percentCalc','findMissing','fractionCalc','findPercent','percentCalc','findMissing'];
const PCTS=[5,10,15,20,25,30,35,40,45,50,60,70,75,80,90];
const FRACS=[[1,9],[1,6],[1,4],[1,3],[1,5],[2,5],[3,8],[1,8],[1,10],[3,10]];
const CATS=[['步行','搭公車','騎腳踏車','家長接送'],['閱讀','球類運動','音樂','美術'],['蘋果','香蕉','橘子','葡萄']];
const CATS3=[['閱讀','球類運動','音樂','美術'],['蘋果','香蕉','橘子','葡萄'],['小狗','小貓','兔子','小鳥']];

function genPercentCalc(M){
  const total=R(2,M.totalMax)*100;
  const percent=pick(PCTS);
  const cat=pick(pick(CATS));
  const count=total*percent/100;
  const text=`統計長條怪展示全校 ${total} 名學生的調查圓形圖：${cat}佔 ${percent}%，請問${cat}的學生有多少人？`;
  const ans=String(count);
  return {text,ans,options:ensure4(ans,[String(count+10),String(count-10>0?count-10:count+20),String(total-count)]),
    hint:'人數 = 總人數 × 百分比（先把百分比換成小數或分數）。',
    explain:`${total} × ${percent}% = ${total} × ${percent}/100 = ${count} 人。`};
}
function genFractionCalc(M){
  const [num,den]=pick(FRACS);
  const total=den*R(2,M.totalMax)*R(2,4);
  const count=total*num/den;
  const cat=pick(pick(CATS));
  const text=`統計長條怪的調查資料顯示，全校 ${total} 名學生中，${cat}佔全體的 ${num}/${den}，請問${cat}的學生有多少人？`;
  const ans=String(count);
  return {text,ans,options:ensure4(ans,[String(count+den),String(Math.max(count-den,1)),String(total-count)]),
    hint:'人數 = 總人數 × 分數，把總人數乘以這個分數就可以了。',
    explain:`${total} × ${num}/${den} = ${count} 人。`};
}
function genFindPercent(M){
  const total=R(2,M.totalMax)*100;
  const percent=pick(PCTS);
  const count=total*percent/100;
  const cat=pick(pick(CATS));
  const text=`統計長條怪的調查資料顯示，全校 ${total} 名學生中，${cat}有 ${count} 人，請問${cat}佔全體的百分之多少？`;
  const ans=`${percent}%`;
  return {text,ans,options:ensure4(ans,[`${percent+10}%`,`${Math.max(percent-10,5)}%`,`${percent+5}%`]),
    hint:'百分比 = (部分人數 ÷ 總人數) × 100%。',
    explain:`${count} ÷ ${total} × 100% = ${percent}%。`};
}
function genFindMissing(M){
  const cats=pick(CATS3);
  const total=R(20,M.totalMax*4)*10;
  let counts,sum,missing,tries=0;
  do{
    counts=[];sum=0;
    for(let i=0;i<3;i++){const v=R(5,Math.max(6,Math.floor(total/5)));counts.push(v);sum+=v;}
    missing=total-sum;
    tries++;
  }while(missing<=0&&tries<30);
  if(missing<=0){counts=[5,5,5];sum=15;missing=Math.max(total-15,5);}
  const lines=cats.slice(0,3).map((c,i)=>`${c} ${counts[i]} 人`).join('、');
  const text=`統計長條怪的次數分配表顯示，全部共 ${total} 人，其中 ${lines}，請問${cats[3]}有幾人？`;
  const ans=String(missing);
  return {text,ans,options:ensure4(ans,[String(missing+5),String(Math.max(missing-5,1)),String(sum)]),
    hint:'先把已知的類別人數加起來，再用總人數減去這個和，就是剩下那一類的人數。',
    explain:`已知三類共 ${sum} 人，總人數 ${total} 人，所以${cats[3]} = ${total} − ${sum} = ${missing} 人。`};
}
function gen(t){
  const M=MODES[mode];
  if(t==='percentCalc')return genPercentCalc(M);
  if(t==='fractionCalc')return genFractionCalc(M);
  if(t==='findPercent')return genFindPercent(M);
  return genFindMissing(M);
}

return {plan:['percentCalc','fractionCalc','findMissing','findPercent','percentCalc','findMissing','fractionCalc','findPercent','percentCalc','findMissing'],gen:function(t,m){mode=m;return gen(t);}};
})();

JB2.stages['5-1-2']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
function ensure4(ans,cands){
  const s=new Set([ans]);
  for(const c of cands){const cs=String(c);if(s.size<4&&cs!==ans&&cs.trim()!=='')s.add(cs);}
  /* 誘答選項不夠時：答案不是純數字就「改動答案裡的一個數字」補齊（例如 (5, 5)→(5, 4)），不再塞無關的 -5、6 */
  if(s.size<4&&!/^-?\d+(\.\d+)?$/.test(String(ans))){
    const str=String(ans),vars=[],re=/\d+(?:\.\d+)?/g;let mm;
    while((mm=re.exec(str))!==null){for(const d of [1,-1,2,-2,3,-3]){const nv=Number(mm[0])+d;if(nv<0)continue;const dec=(mm[0].split('.')[1]||'').length;vars.push(str.slice(0,mm.index)+(dec?nv.toFixed(dec):nv)+str.slice(mm.index+mm[0].length));}}
    for(let i=vars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[vars[i],vars[j]]=[vars[j],vars[i]];}
    for(const v of vars){if(s.size>=4)break;if(!s.has(v))s.add(v);}
  }
  let g=1;
  while(s.size<4){const v=(Number(ans)||0)+(g%2===0?g/2+5:-(Math.ceil(g/2)+4));const vs=String(v);if(!s.has(vs))s.add(vs);g++;}
  return sh([...s]);
}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);return b?gcd(b,a%b):(a||1)}
function lcm(a,b){return Math.abs(a*b)/gcd(a,b)}
/* 坐標平面 SVG 繪圖工具：points 畫點、lines 畫 ax+by=c 直線、dashedTo 畫到兩軸的虛線 */
function lineSegPoints(a,b,c,R2){
  const pts=[];
  if(b!==0){[-R2,R2].forEach(x=>{const y=(c-a*x)/b;if(y>=-R2-0.0001&&y<=R2+0.0001)pts.push([x,y]);});}
  if(a!==0){[-R2,R2].forEach(y=>{const x=(c-b*y)/a;if(x>=-R2-0.0001&&x<=R2+0.0001)pts.push([x,y]);});}
  if(pts.length<2)return null;
  pts.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);
  return [pts[0],pts[pts.length-1]];
}
function svgGrid(opts){
  const RG=opts.range||7,S=260,C=S/2,U=(S-36)/(2*RG);
  const toX=x=>C+x*U,toY=y=>C-y*U;
  let g=`<div class="qsvg"><svg viewBox="0 0 ${S} ${S}" style="width:100%;max-width:260px;background:#fff;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  for(let i=-RG;i<=RG;i++){
    g+=`<line x1="${toX(i)}" y1="${toY(-RG)}" x2="${toX(i)}" y2="${toY(RG)}" stroke="#e3e3e3" stroke-width="1"/>`;
    g+=`<line x1="${toX(-RG)}" y1="${toY(i)}" x2="${toX(RG)}" y2="${toY(i)}" stroke="#e3e3e3" stroke-width="1"/>`;
  }
  g+=`<line x1="${toX(-RG)}" y1="${toY(0)}" x2="${toX(RG)}" y2="${toY(0)}" stroke="#333" stroke-width="2"/>`;
  g+=`<line x1="${toX(0)}" y1="${toY(-RG)}" x2="${toX(0)}" y2="${toY(RG)}" stroke="#333" stroke-width="2"/>`;
  g+=`<text x="${toX(RG)-10}" y="${toY(0)-6}" font-size="12" fill="#333">x</text><text x="${toX(0)+6}" y="${toY(RG)+12}" font-size="12" fill="#333">y</text>`;
  (opts.lines||[]).forEach(ln=>{
    const pts=lineSegPoints(ln.a,ln.b,ln.c,RG);
    if(pts)g+=`<line x1="${toX(pts[0][0])}" y1="${toY(pts[0][1])}" x2="${toX(pts[1][0])}" y2="${toY(pts[1][1])}" stroke="${ln.color||'#d24a33'}" stroke-width="2.5"/>`;
  });
  (opts.dashedTo||[]).forEach(p=>{
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(p.x)}" y2="${toY(0)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(0)}" y2="${toY(p.y)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
  });
  (opts.points||[]).forEach(p=>{
    g+=`<circle cx="${toX(p.x)}" cy="${toY(p.y)}" r="4.5" fill="${p.color||'#d24a33'}"/>`;
    if(p.label)g+=`<text x="${toX(p.x)+6}" y="${toY(p.y)-6}" font-size="12" font-weight="700" fill="${p.color||'#d24a33'}">${p.label}</text>`;
  });
  g+='</svg></div>';
  return g;
}
function fmtEq(a,b,c){
  return (a===1?'':a)+'x + '+(b===1?'':b)+'y = '+c;
}
function fmtEqGen(a,b,c){
  let s=(a===1?'':a===-1?'-':a)+'x';
  s+=b>=0?' + '+(b===1?'':b)+'y':' - '+(Math.abs(b)===1?'':Math.abs(b))+'y';
  s+=' = '+c;
  return s;
}
const QUADS=['第一象限','第二象限','第三象限','第四象限'];
function quadName(x,y){
  if(x===0&&y===0)return '原點（不屬於任何象限）';
  if(x===0)return 'y 軸上（不屬於任何象限）';
  if(y===0)return 'x 軸上（不屬於任何象限）';
  if(x>0&&y>0)return '第一象限';
  if(x<0&&y>0)return '第二象限';
  if(x<0&&y<0)return '第三象限';
  return '第四象限';
}
function fmtNum(n){
  if(Number.isInteger(n))return String(n);
  return String(Math.round(n*100)/100);
}
const MODES={easy:{t:0,nMin:3,nMax:4},real:{t:15,nMin:3,nMax:5},hard:{t:10,nMin:4,nMax:6}};
const PLAN=['computeMean','targetScore','sumFromMean','missingScore','computeMean','targetScore','missingScore','sumFromMean','targetScore','computeMean'];

function genComputeMean(M){
  const n=R(M.nMin,M.nMax);
  const scores=[];
  for(let i=0;i<n;i++)scores.push(R(50,100));
  const sum=scores.reduce((a,b)=>a+b,0);
  const mean=sum/n;
  const text=`平均權衡獸給出召喚師 ${n} 次小考分數：${scores.join(', ')}，請問平均分數是多少？`;
  const ans=fmtNum(mean);
  return {text,ans,options:ensure4(ans,[fmtNum(mean+1),fmtNum(mean-1),fmtNum(sum)]),
    hint:'平均數 = 總和 ÷ 個數。',
    explain:`總和 = ${scores.join('+')} = ${sum}，平均 = ${sum} ÷ ${n} = ${ans}。`};
}
function genTargetScore(M){
  const n=R(M.nMin,M.nMax);
  let scores,sum,target,totalTarget,need,tries=0;
  do{
    scores=[];
    for(let i=0;i<n-1;i++)scores.push(R(60,95));
    sum=scores.reduce((a,b)=>a+b,0);
    target=R(70,95);
    totalTarget=target*n;
    need=totalTarget-sum;
    tries++;
  }while((need<55||need>100)&&tries<500);
  const text=`平均權衡獸給出召喚師前 ${n-1} 次小考分數：${scores.join(', ')}，如果要讓 ${n} 次的總平均達到 ${target} 分，第 ${n} 次要考幾分？`;
  const ans=String(need);
  return {text,ans,options:ensure4(ans,[String(need+5),String(need-5),String(target)]),
    hint:`先算出 ${n} 次的總分目標（平均 × 次數），再減去前面已經考的總分。`,
    explain:`${n} 次總分目標 = ${target} × ${n} = ${totalTarget}，前 ${n-1} 次總分 = ${sum}，所以第 ${n} 次要考 ${totalTarget} − ${sum} = ${need} 分。`};
}
function genSumFromMean(M){
  const n=R(M.nMin,M.nMax+3);
  const mean=R(60,95);
  const sum=mean*n;
  const text=`平均權衡獸說：『${n} 個數字的平均數是 ${mean}』，請問這 ${n} 個數字的總和是多少？`;
  const ans=String(sum);
  return {text,ans,options:ensure4(ans,[String(sum+n),String(sum-n),String(mean)]),
    hint:'總和 = 平均數 × 個數。',
    explain:`總和 = ${mean} × ${n} = ${sum}。`};
}
function genMissingScore(M){
  const n=R(M.nMin,M.nMax);
  let scores,x,sum,mean,tries=0;
  do{
    scores=[];for(let i=0;i<n-1;i++)scores.push(R(50,95));
    x=R(50,95);
    sum=scores.reduce((a,b)=>a+b,0)+x;
    mean=sum/n;
    tries++;
  }while(!Number.isInteger(mean)&&tries<40);
  if(!Number.isInteger(mean)){
    const base=scores.reduce((a,b)=>a+b,0);
    mean=Math.round((base+x)/n);
    x=mean*n-base;
    sum=mean*n;
  }
  const displayScores=[...scores];
  const pos=R(0,displayScores.length);
  displayScores.splice(pos,0,'x');
  const text=`平均權衡獸給出 ${n} 個分數：${displayScores.join(', ')}，已知平均是 ${mean} 分，求 x 是多少？`;
  const ans=String(x);
  return {text,ans,options:ensure4(ans,[String(x+5),String(x-5),String(mean)]),
    hint:'先用平均數 × 個數算出總和，再減去已知的分數，剩下的就是 x。',
    explain:`總和 = ${mean} × ${n} = ${sum}，已知分數和 = ${sum-x}，所以 x = ${sum} − ${sum-x} = ${x}。`};
}
function gen(t){
  const M=MODES[mode];
  if(t==='computeMean')return genComputeMean(M);
  if(t==='targetScore')return genTargetScore(M);
  if(t==='sumFromMean')return genSumFromMean(M);
  return genMissingScore(M);
}

return {plan:['computeMean','targetScore','sumFromMean','missingScore','computeMean','targetScore','missingScore','sumFromMean','targetScore','computeMean'],gen:function(t,m){mode=m;return gen(t);}};
})();

JB2.stages['5-1-3']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
function ensure4(ans,cands){
  const s=new Set([ans]);
  for(const c of cands){const cs=String(c);if(s.size<4&&cs!==ans&&cs.trim()!=='')s.add(cs);}
  /* 誘答選項不夠時：答案不是純數字就「改動答案裡的一個數字」補齊（例如 (5, 5)→(5, 4)），不再塞無關的 -5、6 */
  if(s.size<4&&!/^-?\d+(\.\d+)?$/.test(String(ans))){
    const str=String(ans),vars=[],re=/\d+(?:\.\d+)?/g;let mm;
    while((mm=re.exec(str))!==null){for(const d of [1,-1,2,-2,3,-3]){const nv=Number(mm[0])+d;if(nv<0)continue;const dec=(mm[0].split('.')[1]||'').length;vars.push(str.slice(0,mm.index)+(dec?nv.toFixed(dec):nv)+str.slice(mm.index+mm[0].length));}}
    for(let i=vars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[vars[i],vars[j]]=[vars[j],vars[i]];}
    for(const v of vars){if(s.size>=4)break;if(!s.has(v))s.add(v);}
  }
  let g=1;
  while(s.size<4){const v=(Number(ans)||0)+(g%2===0?g/2+5:-(Math.ceil(g/2)+4));const vs=String(v);if(!s.has(vs))s.add(vs);g++;}
  return sh([...s]);
}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);return b?gcd(b,a%b):(a||1)}
function lcm(a,b){return Math.abs(a*b)/gcd(a,b)}
/* 坐標平面 SVG 繪圖工具：points 畫點、lines 畫 ax+by=c 直線、dashedTo 畫到兩軸的虛線 */
function lineSegPoints(a,b,c,R2){
  const pts=[];
  if(b!==0){[-R2,R2].forEach(x=>{const y=(c-a*x)/b;if(y>=-R2-0.0001&&y<=R2+0.0001)pts.push([x,y]);});}
  if(a!==0){[-R2,R2].forEach(y=>{const x=(c-b*y)/a;if(x>=-R2-0.0001&&x<=R2+0.0001)pts.push([x,y]);});}
  if(pts.length<2)return null;
  pts.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);
  return [pts[0],pts[pts.length-1]];
}
function svgGrid(opts){
  const RG=opts.range||7,S=260,C=S/2,U=(S-36)/(2*RG);
  const toX=x=>C+x*U,toY=y=>C-y*U;
  let g=`<div class="qsvg"><svg viewBox="0 0 ${S} ${S}" style="width:100%;max-width:260px;background:#fff;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  for(let i=-RG;i<=RG;i++){
    g+=`<line x1="${toX(i)}" y1="${toY(-RG)}" x2="${toX(i)}" y2="${toY(RG)}" stroke="#e3e3e3" stroke-width="1"/>`;
    g+=`<line x1="${toX(-RG)}" y1="${toY(i)}" x2="${toX(RG)}" y2="${toY(i)}" stroke="#e3e3e3" stroke-width="1"/>`;
  }
  g+=`<line x1="${toX(-RG)}" y1="${toY(0)}" x2="${toX(RG)}" y2="${toY(0)}" stroke="#333" stroke-width="2"/>`;
  g+=`<line x1="${toX(0)}" y1="${toY(-RG)}" x2="${toX(0)}" y2="${toY(RG)}" stroke="#333" stroke-width="2"/>`;
  g+=`<text x="${toX(RG)-10}" y="${toY(0)-6}" font-size="12" fill="#333">x</text><text x="${toX(0)+6}" y="${toY(RG)+12}" font-size="12" fill="#333">y</text>`;
  (opts.lines||[]).forEach(ln=>{
    const pts=lineSegPoints(ln.a,ln.b,ln.c,RG);
    if(pts)g+=`<line x1="${toX(pts[0][0])}" y1="${toY(pts[0][1])}" x2="${toX(pts[1][0])}" y2="${toY(pts[1][1])}" stroke="${ln.color||'#d24a33'}" stroke-width="2.5"/>`;
  });
  (opts.dashedTo||[]).forEach(p=>{
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(p.x)}" y2="${toY(0)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(0)}" y2="${toY(p.y)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
  });
  (opts.points||[]).forEach(p=>{
    g+=`<circle cx="${toX(p.x)}" cy="${toY(p.y)}" r="4.5" fill="${p.color||'#d24a33'}"/>`;
    if(p.label)g+=`<text x="${toX(p.x)+6}" y="${toY(p.y)-6}" font-size="12" font-weight="700" fill="${p.color||'#d24a33'}">${p.label}</text>`;
  });
  g+='</svg></div>';
  return g;
}
function fmtEq(a,b,c){
  return (a===1?'':a)+'x + '+(b===1?'':b)+'y = '+c;
}
function fmtEqGen(a,b,c){
  let s=(a===1?'':a===-1?'-':a)+'x';
  s+=b>=0?' + '+(b===1?'':b)+'y':' - '+(Math.abs(b)===1?'':Math.abs(b))+'y';
  s+=' = '+c;
  return s;
}
const QUADS=['第一象限','第二象限','第三象限','第四象限'];
function quadName(x,y){
  if(x===0&&y===0)return '原點（不屬於任何象限）';
  if(x===0)return 'y 軸上（不屬於任何象限）';
  if(y===0)return 'x 軸上（不屬於任何象限）';
  if(x>0&&y>0)return '第一象限';
  if(x<0&&y>0)return '第二象限';
  if(x<0&&y<0)return '第三象限';
  return '第四象限';
}
function fmtNum(n){
  if(Number.isInteger(n))return String(n);
  return String(Math.round(n*100)/100);
}
const MODES={easy:{t:0,max:10},real:{t:15,max:15},hard:{t:10,max:20}};
const PLAN=['findMode','findMedian','combined','findMode','combined','findMedian','compareConcept','combined','findMode','findMedian'];
const CONCEPTS=[
  ['一組資料中出現次數最多的數，叫做這組資料的什麼？','眾數',['眾數','中位數','平均數','全距']],
  ['把一組資料由小到大排序後，最中間的那個數（或中間兩數的平均），叫做這組資料的什麼？','中位數',['中位數','眾數','平均數','全距']],
  ['一組資料如果有偶數個數字，中位數要怎麼求？','取中間兩個數的平均',['取中間兩個數的平均','直接取最大的那個數','直接取最小的那個數','把所有數字相加']],
  ['一組資料的眾數可以有幾個？','可以有一個、多個，或沒有眾數',['可以有一個、多個，或沒有眾數','一定只有一個','一定要有兩個','眾數一定等於中位數']]
];

function genFindMode(M){
  const n=R(6,9);
  const modeVal=R(1,M.max);
  const repeatCount=R(3,4);
  let arr=[];
  for(let i=0;i<repeatCount;i++)arr.push(modeVal);
  let guard=0;
  while(arr.length<n&&guard<100){
    guard++;
    const v=R(1,M.max);
    const cnt=arr.filter(x=>x===v).length;
    if(v!==modeVal&&cnt<repeatCount-1)arr.push(v);
  }
  while(arr.length<n)arr.push(R(1,M.max));
  arr=sh(arr);
  const text=`三頭犬吐出一組數據氣息：[${arr.join(', ')}]，請問這組資料的眾數是多少？`;
  const ans=String(modeVal);
  const others=[...new Set(arr)].filter(v=>v!==modeVal);
  let wrongs=sh(others).slice(0,3).map(String);
  let extra=1;
  while(wrongs.length<3){wrongs.push(String(modeVal+extra));extra++;}
  return {text,ans,options:ensure4(ans,wrongs),
    hint:'眾數就是這組資料中「出現次數最多」的數字。',
    explain:`把每個數字出現的次數數一數，${modeVal} 出現了 ${repeatCount} 次，次數最多，所以眾數是 ${modeVal}。`};
}
function genFindMedian(M){
  const n=pick([5,6,7,8,9]);
  let arr=[];
  while(arr.length<n)arr.push(R(1,M.max*3));
  const sorted=[...arr].sort((a,b)=>a-b);
  let median;
  if(n%2===1)median=sorted[(n-1)/2];
  else median=(sorted[n/2-1]+sorted[n/2])/2;
  const displayArr=sh(arr);
  const text=`三頭犬吐出一組數據氣息：[${displayArr.join(', ')}]，請問由小到大排序後，這組資料的中位數是多少？`;
  const ans=fmtNum(median);
  return {text,ans,options:ensure4(ans,[fmtNum(median+1),fmtNum(median-1),String(sorted[sorted.length-1])]),
    hint:'先把資料由小到大排序，最中間的數（或中間兩個數的平均）就是中位數。',
    explain:`排序後：${sorted.join(', ')}，${n%2===1?`中間第 ${(n+1)/2} 個數是 ${median}`:`中間兩個數 ${sorted[n/2-1]} 與 ${sorted[n/2]} 的平均是 ${median}`}，所以中位數是 ${ans}。`};
}
function genCombined(M){
  const n=8;
  const modeVal=R(1,M.max);
  let arr=[modeVal,modeVal,modeVal];
  let guard=0;
  while(arr.length<n&&guard<500){
    guard++;
    const v=R(1,M.max);
    if(v!==modeVal&&arr.filter(x=>x===v).length<2)arr.push(v);
  }
  let extraV=M.max+1;
  while(arr.length<n)arr.push(extraV++);
  arr=sh(arr);
  const sorted=[...arr].sort((a,b)=>a-b);
  const median=(sorted[n/2-1]+sorted[n/2])/2;
  const askMode=Math.random()<0.5;
  const text=`三頭犬吐出一組數據氣息：[${arr.join(', ')}]（共 ${n} 個數）。三個頭之一問：這組資料的${askMode?'眾數':'中位數（由小到大排序後）'}是多少？`;
  if(askMode){
    const ans=String(modeVal);
    const others=[...new Set(arr)].filter(v=>v!==modeVal);
    let wrongs=sh(others).slice(0,3).map(String);
    let extra=1;
    while(wrongs.length<3){wrongs.push(String(modeVal+extra));extra++;}
    return {text,ans,options:ensure4(ans,wrongs),
      hint:'眾數是出現次數最多的數字。',
      explain:`${modeVal} 出現了 3 次，是這組資料中出現次數最多的，所以眾數是 ${modeVal}。`};
  }
  const ans=fmtNum(median);
  return {text,ans,options:ensure4(ans,[fmtNum(median+1),fmtNum(median-1),String(sorted[n-1])]),
    hint:'排序後，中間兩個數的平均就是中位數（因為資料共有偶數個）。',
    explain:`排序後：${sorted.join(', ')}，中間兩個數 ${sorted[n/2-1]} 與 ${sorted[n/2]} 的平均是 ${median}，所以中位數是 ${ans}。`};
}
function genCompareConcept(M){
  const [q,ans,opts]=pick(CONCEPTS);
  return {text:q,ans,options:sh(opts.slice()),
    hint:'回想眾數、中位數的定義：眾數看「次數」，中位數看「排序後的位置」。',
    explain:`正確答案是「${ans}」。`};
}
function gen(t){
  const M=MODES[mode];
  if(t==='findMode')return genFindMode(M);
  if(t==='findMedian')return genFindMedian(M);
  if(t==='combined')return genCombined(M);
  return genCompareConcept(M);
}
/* ===== 題庫擴充：同一題型多幾種問法，避免一直遇到同一題 ===== */
(function(){
  const _g=gen;
  const mk=(text,ans,wrongs,hint,explain)=>({text,ans,options:ensure4(ans,wrongs),hint,explain});
  const BANK={};
  CONCEPTS.push(
    ['一組資料中，可能有不只一個眾數嗎？','可能，當有兩個以上的數出現次數同樣最多時',['可能，當有兩個以上的數出現次數同樣最多時','不可能，眾數只會有一個','不可能，眾數一定是最大的數','只有資料個數是偶數才可能']],
    ['如果把一組資料中最大的那個數變得更大，中位數通常會怎樣？','通常不會改變',['通常不會改變','一定變大','一定變小','變成眾數']],
    ['要找出資料中「出現次數最多」的數，應該看哪一個統計量？','眾數',['眾數','中位數','平均數','全距']],
    ['資料有 7 個數字（奇數個），排序後中位數是第幾個？','第 4 個',['第 4 個','第 3 個','第 7 個','第 3 個和第 4 個的平均']],
    ['資料有 6 個數字（偶數個），排序後中位數是？','第 3、第 4 個數的平均',['第 3、第 4 個數的平均','第 3 個數','第 4 個數','第 6 個數']],
    ['要求中位數之前，第一步要做什麼？','先把資料由小到大（或由大到小）排序',['先把資料由小到大（或由大到小）排序','先把所有資料加起來','先找出出現最多次的數','先把最大的數去掉']]);

  gen=function(t){const B=BANK[t];if(B&&Math.random()<B.p){return B.make();}return _g.apply(this,arguments);};
})();

return {plan:['findMode','findMedian','combined','findMode','combined','findMedian','compareConcept','combined','findMode','findMedian'],gen:function(t,m){mode=m;return gen(t);}};
})();

JB2.stages['6-1-1']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
function ensure4(ans,cands){
  const s=new Set([ans]);
  for(const c of cands){const cs=String(c);if(s.size<4&&cs!==ans&&cs.trim()!=='')s.add(cs);}
  /* 誘答選項不夠時：答案不是純數字就「改動答案裡的一個數字」補齊（例如 (5, 5)→(5, 4)），不再塞無關的 -5、6 */
  if(s.size<4&&!/^-?\d+(\.\d+)?$/.test(String(ans))){
    const str=String(ans),vars=[],re=/\d+(?:\.\d+)?/g;let mm;
    while((mm=re.exec(str))!==null){for(const d of [1,-1,2,-2,3,-3]){const nv=Number(mm[0])+d;if(nv<0)continue;const dec=(mm[0].split('.')[1]||'').length;vars.push(str.slice(0,mm.index)+(dec?nv.toFixed(dec):nv)+str.slice(mm.index+mm[0].length));}}
    for(let i=vars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[vars[i],vars[j]]=[vars[j],vars[i]];}
    for(const v of vars){if(s.size>=4)break;if(!s.has(v))s.add(v);}
  }
  let g=1;
  while(s.size<4){const v=(Number(ans)||0)+(g%2===0?g/2+5:-(Math.ceil(g/2)+4));const vs=String(v);if(!s.has(vs))s.add(vs);g++;}
  return sh([...s]);
}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);return b?gcd(b,a%b):(a||1)}
function lcm(a,b){return Math.abs(a*b)/gcd(a,b)}
/* 坐標平面 SVG 繪圖工具：points 畫點、lines 畫 ax+by=c 直線、dashedTo 畫到兩軸的虛線 */
function lineSegPoints(a,b,c,R2){
  const pts=[];
  if(b!==0){[-R2,R2].forEach(x=>{const y=(c-a*x)/b;if(y>=-R2-0.0001&&y<=R2+0.0001)pts.push([x,y]);});}
  if(a!==0){[-R2,R2].forEach(y=>{const x=(c-b*y)/a;if(x>=-R2-0.0001&&x<=R2+0.0001)pts.push([x,y]);});}
  if(pts.length<2)return null;
  pts.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);
  return [pts[0],pts[pts.length-1]];
}
function svgGrid(opts){
  const RG=opts.range||7,S=260,C=S/2,U=(S-36)/(2*RG);
  const toX=x=>C+x*U,toY=y=>C-y*U;
  let g=`<div class="qsvg"><svg viewBox="0 0 ${S} ${S}" style="width:100%;max-width:260px;background:#fff;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  for(let i=-RG;i<=RG;i++){
    g+=`<line x1="${toX(i)}" y1="${toY(-RG)}" x2="${toX(i)}" y2="${toY(RG)}" stroke="#e3e3e3" stroke-width="1"/>`;
    g+=`<line x1="${toX(-RG)}" y1="${toY(i)}" x2="${toX(RG)}" y2="${toY(i)}" stroke="#e3e3e3" stroke-width="1"/>`;
  }
  g+=`<line x1="${toX(-RG)}" y1="${toY(0)}" x2="${toX(RG)}" y2="${toY(0)}" stroke="#333" stroke-width="2"/>`;
  g+=`<line x1="${toX(0)}" y1="${toY(-RG)}" x2="${toX(0)}" y2="${toY(RG)}" stroke="#333" stroke-width="2"/>`;
  g+=`<text x="${toX(RG)-10}" y="${toY(0)-6}" font-size="12" fill="#333">x</text><text x="${toX(0)+6}" y="${toY(RG)+12}" font-size="12" fill="#333">y</text>`;
  (opts.lines||[]).forEach(ln=>{
    const pts=lineSegPoints(ln.a,ln.b,ln.c,RG);
    if(pts)g+=`<line x1="${toX(pts[0][0])}" y1="${toY(pts[0][1])}" x2="${toX(pts[1][0])}" y2="${toY(pts[1][1])}" stroke="${ln.color||'#d24a33'}" stroke-width="2.5"/>`;
  });
  (opts.dashedTo||[]).forEach(p=>{
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(p.x)}" y2="${toY(0)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(0)}" y2="${toY(p.y)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
  });
  (opts.points||[]).forEach(p=>{
    g+=`<circle cx="${toX(p.x)}" cy="${toY(p.y)}" r="4.5" fill="${p.color||'#d24a33'}"/>`;
    if(p.label)g+=`<text x="${toX(p.x)+6}" y="${toY(p.y)-6}" font-size="12" font-weight="700" fill="${p.color||'#d24a33'}">${p.label}</text>`;
  });
  g+='</svg></div>';
  return g;
}
function fmtEq(a,b,c){
  return (a===1?'':a)+'x + '+(b===1?'':b)+'y = '+c;
}
function fmtEqGen(a,b,c){
  let s=(a===1?'':a===-1?'-':a)+'x';
  s+=b>=0?' + '+(b===1?'':b)+'y':' - '+(Math.abs(b)===1?'':Math.abs(b))+'y';
  s+=' = '+c;
  return s;
}
const QUADS=['第一象限','第二象限','第三象限','第四象限'];
function quadName(x,y){
  if(x===0&&y===0)return '原點（不屬於任何象限）';
  if(x===0)return 'y 軸上（不屬於任何象限）';
  if(y===0)return 'x 軸上（不屬於任何象限）';
  if(x>0&&y>0)return '第一象限';
  if(x<0&&y>0)return '第二象限';
  if(x<0&&y<0)return '第三象限';
  return '第四象限';
}
function fmtNum(n){
  if(Number.isInteger(n))return String(n);
  return String(Math.round(n*100)/100);
}
function cubeGrid(grid){
  let html='<div class="qsvg"><table style="margin:8px auto;border-collapse:collapse;font-family:monospace;font-size:1.15rem">';
  html+='<caption style="caption-side:top;font-size:.78rem;color:#555;margin-bottom:4px">（鳥瞰圖／數字＝該位置堆疊的正方體個數・上排＝後排，下排＝前排）</caption>';
  for(let r=0;r<grid.length;r++){
    html+='<tr>';
    for(let c=0;c<grid[r].length;c++){
      html+=`<td style="border:2px solid #333;width:38px;height:38px;text-align:center;background:#fff;color:#2b2416">${grid[r][c]}</td>`;
    }
    html+='</tr>';
  }
  html+='</table></div>';
  return html;
}
const MODES={easy:{t:0,aMin:10,aMax:45},real:{t:15,aMin:10,aMax:80},hard:{t:10,aMin:5,aMax:85}};
const PLAN=['concept','angleCalc','symbolMeaning','distanceDefine','concept','angleCalc','symbolMeaning','concept','angleCalc','distanceDefine'];
const STATEMENTS61=[
  ['從直線外一點到這條直線的所有線段中，垂直線段的長度最短。',true],
  ['兩條直線互相垂直時，交角是 90 度。',true],
  ['點到直線的距離，是指這一點到直線上任一點的線段長度（不論長短）。',false],
  ['垂直符號寫作「⊥」。',true],
  ['兩條互相垂直的直線，交角可以是 60 度。',false],
  ['過一點只能畫一條直線垂直於已知直線。',true]
];

function genConcept(M){
  const [stmt,real]=pick(STATEMENTS61);
  const text=`垂直線段精靈考驗召喚師，判斷下列敘述是否正確：『${stmt}』`;
  const ans=real?'正確':'錯誤';
  return {text,ans,options:['正確','錯誤','部分正確','需視情況而定'],
    hint:'記住「垂線段最短」，且垂直的交角一定是 90 度。',
    explain:`這個敘述${real?'是正確的':'是錯誤的'}。${real?'':'點到直線的距離，指的是「垂直線段」的長度，不是任意線段。'}`};
}
function genAngleCalc(M){
  const a1=R(M.aMin,M.aMax);
  const a2=90-a1;
  const text=`垂直線段精靈說：『兩條射線 OA、OB 互相垂直（∠AOB = 90°），中間被一條射線 OC 分成 ∠AOC 與 ∠COB 兩部分。已知 ∠AOC = ${a1}°，求 ∠COB 的度數。』`;
  const ans=`${a2}°`;
  return {text,ans,options:ensure4(ans,[`${90+a1}°`,`${180-a1}°`,`${a1}°`]),
    hint:'因為 OA⊥OB，所以 ∠AOC + ∠COB = 90°，兩個角互為「餘角」。',
    explain:`∠AOC + ∠COB = 90°，所以 ∠COB = 90° − ${a1}° = ${a2}°。`};
}
function genSymbolMeaning(M){
  const text='符號「⊥」代表兩條直線（或線段）之間的什麼關係？';
  const ans='互相垂直（交角為 90°）';
  return {text,ans,options:['互相垂直（交角為 90°）','互相平行（永不相交）','互相重合（同一條線）','沒有特別關係'],
    hint:'「⊥」是垂直符號，代表兩條線相交成直角。',
    explain:'符號「⊥」表示兩條直線垂直，交角為 90 度。'};
}
function genDistanceDefine(M){
  const text='數學上「點 P 到直線 L 的距離」，指的是下列哪一種線段的長度？';
  const ans='從 P 點到 L 的垂直線段（垂線段）';
  return {text,ans,options:['從 P 點到 L 的垂直線段（垂線段）','從 P 點到 L 上任一點的線段（取最長的那條）','從 P 點到 L 上任一點的線段（隨便取一條）','P 點與 L 之間沒有距離的定義'],
    hint:'記住「垂線段最短」，所以點到直線的距離被定義為垂直線段的長度。',
    explain:'點到直線的距離，定義為從這一點到直線的「垂直線段」長度，因為垂線段是所有連接線段中最短的一條。'};
}
function gen(t){
  const M=MODES[mode];
  if(t==='concept')return genConcept(M);
  if(t==='angleCalc')return genAngleCalc(M);
  if(t==='symbolMeaning')return genSymbolMeaning(M);
  return genDistanceDefine(M);
}
/* ===== 題庫擴充：同一題型多幾種問法，避免一直遇到同一題 ===== */
(function(){
  const _g=gen;
  const mk=(text,ans,wrongs,hint,explain)=>({text,ans,options:ensure4(ans,wrongs),hint,explain});
  const BANK={};
  STATEMENTS61.push(
    ['兩條直線垂直時，它們相交所形成的四個角都是直角。',true],
    ['從直線外一點到這條直線，最短的路徑是斜斜地走過去。',false],
    ['如果 OA ⊥ OB，那麼 ∠AOB = 180°。',false],
    ['垂直的兩條直線一定會相交。',true],
    ['兩條平行線互相垂直。',false],
    ['直線 L 外的點 P，到 L 上各點的線段中，垂線段是最長的一條。',false],
    ['點到直線的距離，就是這個點到直線的垂直線段的長度。',true],
    ['兩個角互為餘角，代表它們的和是 90°。',true]);
  {const L=[
    ['符號「⊥」代表兩條直線（或線段）之間的什麼關係？','互相垂直（交角為 90°）',['互相平行（永不相交）','互相重合（同一條線）','沒有特別關係'],'「⊥」是垂直符號，代表兩條線相交成直角。','符號「⊥」表示兩條直線垂直，交角為 90 度。'],
    ['符號「∥」代表兩條直線之間的什麼關係？','互相平行（永不相交）',['互相垂直（交角為 90°）','互相重合（同一條線）','交角為 45°'],'「∥」像兩條並排的直線，代表平行。','符號「∥」表示兩條直線互相平行。'],
    ['如果寫成 L ⊥ M，代表什麼意思？','直線 L 與直線 M 互相垂直',['直線 L 與直線 M 互相平行','直線 L 與直線 M 一樣長','直線 L 比直線 M 長'],'⊥ 就是垂直。','L ⊥ M 讀作「L 垂直於 M」。'],
    ['看到「∠AOB = 90°」，射線 OA 與射線 OB 的關係是什麼？','互相垂直',['互相平行','互相重合','沒有特別關係'],'90° 的角就是直角，兩邊互相垂直。','兩邊夾成 90° 的角，這兩條射線互相垂直。']];BANK['symbolMeaning']={p:1,make:()=>{const e=pick(L);return mk(e[0],e[1],e[2],e[3],e[4]);}};}
  {const L=[
    ['數學上「點 P 到直線 L 的距離」，指的是下列哪一種線段的長度？','從 P 點到 L 的垂直線段（垂線段）',['從 P 點到 L 上任一點的線段（取最長的那條）','從 P 點到 L 上任一點的線段（隨便取一條）','沿著 L 走到最遠處的長度'],'記住「垂線段最短」。','點到直線的距離，定義為這一點到直線的垂直線段長度，因為垂線段最短。'],
    ['小明站在筆直河岸旁的 P 點，想知道 P 點到河岸 L 的距離，應該量哪一段？','P 點到河岸的垂直線段',['P 點到河岸上最遠一點的線段','P 點到河岸上隨便一點的線段','沿著河岸走的那一段'],'點到直線的距離要量垂直的那一段。','點到直線的距離就是垂線段的長度。'],
    ['從 P 點畫到直線 L 的所有線段中，哪一種線段最短？','垂直於 L 的線段（垂線段）',['斜得最厲害的線段','連到最遠點的線段','每一條都一樣長'],'垂線段最短。','所有連接 P 與 L 的線段中，垂線段最短。'],
    ['要量「點到直線的距離」，下列哪個做法正確？','過這個點作直線的垂線，量這個點到垂足的長度',['任選直線上一點，量它到這個點的長度','量直線上最遠的點到這個點的長度','用直線本身的長度當作距離'],'先作垂線，再量垂線段。','點到直線的距離是垂線段的長度。']];BANK['distanceDefine']={p:1,make:()=>{const e=pick(L);return mk(e[0],e[1],e[2],e[3],e[4]);}};}

  gen=function(t){const B=BANK[t];if(B&&Math.random()<B.p){return B.make();}return _g.apply(this,arguments);};
})();

return {plan:['concept','angleCalc','symbolMeaning','distanceDefine','concept','angleCalc','symbolMeaning','concept','angleCalc','distanceDefine'],gen:function(t,m){mode=m;return gen(t);}};
})();

JB2.stages['6-1-2']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
function ensure4(ans,cands){
  const s=new Set([ans]);
  for(const c of cands){const cs=String(c);if(s.size<4&&cs!==ans&&cs.trim()!=='')s.add(cs);}
  /* 誘答選項不夠時：答案不是純數字就「改動答案裡的一個數字」補齊（例如 (5, 5)→(5, 4)），不再塞無關的 -5、6 */
  if(s.size<4&&!/^-?\d+(\.\d+)?$/.test(String(ans))){
    const str=String(ans),vars=[],re=/\d+(?:\.\d+)?/g;let mm;
    while((mm=re.exec(str))!==null){for(const d of [1,-1,2,-2,3,-3]){const nv=Number(mm[0])+d;if(nv<0)continue;const dec=(mm[0].split('.')[1]||'').length;vars.push(str.slice(0,mm.index)+(dec?nv.toFixed(dec):nv)+str.slice(mm.index+mm[0].length));}}
    for(let i=vars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[vars[i],vars[j]]=[vars[j],vars[i]];}
    for(const v of vars){if(s.size>=4)break;if(!s.has(v))s.add(v);}
  }
  let g=1;
  while(s.size<4){const v=(Number(ans)||0)+(g%2===0?g/2+5:-(Math.ceil(g/2)+4));const vs=String(v);if(!s.has(vs))s.add(vs);g++;}
  return sh([...s]);
}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);return b?gcd(b,a%b):(a||1)}
function lcm(a,b){return Math.abs(a*b)/gcd(a,b)}
/* 坐標平面 SVG 繪圖工具：points 畫點、lines 畫 ax+by=c 直線、dashedTo 畫到兩軸的虛線 */
function lineSegPoints(a,b,c,R2){
  const pts=[];
  if(b!==0){[-R2,R2].forEach(x=>{const y=(c-a*x)/b;if(y>=-R2-0.0001&&y<=R2+0.0001)pts.push([x,y]);});}
  if(a!==0){[-R2,R2].forEach(y=>{const x=(c-b*y)/a;if(x>=-R2-0.0001&&x<=R2+0.0001)pts.push([x,y]);});}
  if(pts.length<2)return null;
  pts.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);
  return [pts[0],pts[pts.length-1]];
}
function svgGrid(opts){
  const RG=opts.range||7,S=260,C=S/2,U=(S-36)/(2*RG);
  const toX=x=>C+x*U,toY=y=>C-y*U;
  let g=`<div class="qsvg"><svg viewBox="0 0 ${S} ${S}" style="width:100%;max-width:260px;background:#fff;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  for(let i=-RG;i<=RG;i++){
    g+=`<line x1="${toX(i)}" y1="${toY(-RG)}" x2="${toX(i)}" y2="${toY(RG)}" stroke="#e3e3e3" stroke-width="1"/>`;
    g+=`<line x1="${toX(-RG)}" y1="${toY(i)}" x2="${toX(RG)}" y2="${toY(i)}" stroke="#e3e3e3" stroke-width="1"/>`;
  }
  g+=`<line x1="${toX(-RG)}" y1="${toY(0)}" x2="${toX(RG)}" y2="${toY(0)}" stroke="#333" stroke-width="2"/>`;
  g+=`<line x1="${toX(0)}" y1="${toY(-RG)}" x2="${toX(0)}" y2="${toY(RG)}" stroke="#333" stroke-width="2"/>`;
  g+=`<text x="${toX(RG)-10}" y="${toY(0)-6}" font-size="12" fill="#333">x</text><text x="${toX(0)+6}" y="${toY(RG)+12}" font-size="12" fill="#333">y</text>`;
  (opts.lines||[]).forEach(ln=>{
    const pts=lineSegPoints(ln.a,ln.b,ln.c,RG);
    if(pts)g+=`<line x1="${toX(pts[0][0])}" y1="${toY(pts[0][1])}" x2="${toX(pts[1][0])}" y2="${toY(pts[1][1])}" stroke="${ln.color||'#d24a33'}" stroke-width="2.5"/>`;
  });
  (opts.dashedTo||[]).forEach(p=>{
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(p.x)}" y2="${toY(0)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(0)}" y2="${toY(p.y)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
  });
  (opts.points||[]).forEach(p=>{
    g+=`<circle cx="${toX(p.x)}" cy="${toY(p.y)}" r="4.5" fill="${p.color||'#d24a33'}"/>`;
    if(p.label)g+=`<text x="${toX(p.x)+6}" y="${toY(p.y)-6}" font-size="12" font-weight="700" fill="${p.color||'#d24a33'}">${p.label}</text>`;
  });
  g+='</svg></div>';
  return g;
}
function fmtEq(a,b,c){
  return (a===1?'':a)+'x + '+(b===1?'':b)+'y = '+c;
}
function fmtEqGen(a,b,c){
  let s=(a===1?'':a===-1?'-':a)+'x';
  s+=b>=0?' + '+(b===1?'':b)+'y':' - '+(Math.abs(b)===1?'':Math.abs(b))+'y';
  s+=' = '+c;
  return s;
}
const QUADS=['第一象限','第二象限','第三象限','第四象限'];
function quadName(x,y){
  if(x===0&&y===0)return '原點（不屬於任何象限）';
  if(x===0)return 'y 軸上（不屬於任何象限）';
  if(y===0)return 'x 軸上（不屬於任何象限）';
  if(x>0&&y>0)return '第一象限';
  if(x<0&&y>0)return '第二象限';
  if(x<0&&y<0)return '第三象限';
  return '第四象限';
}
function fmtNum(n){
  if(Number.isInteger(n))return String(n);
  return String(Math.round(n*100)/100);
}
function cubeGrid(grid){
  let html='<div class="qsvg"><table style="margin:8px auto;border-collapse:collapse;font-family:monospace;font-size:1.15rem">';
  html+='<caption style="caption-side:top;font-size:.78rem;color:#555;margin-bottom:4px">（鳥瞰圖／數字＝該位置堆疊的正方體個數・上排＝後排，下排＝前排）</caption>';
  for(let r=0;r<grid.length;r++){
    html+='<tr>';
    for(let c=0;c<grid[r].length;c++){
      html+=`<td style="border:2px solid #333;width:38px;height:38px;text-align:center;background:#fff;color:#2b2416">${grid[r][c]}</td>`;
    }
    html+='</tr>';
  }
  html+='</table></div>';
  return html;
}
const MODES={easy:{t:0,max:5},real:{t:15,max:7},hard:{t:10,max:9}};
const PLAN=['reflectYAxis','reflectXAxis','identifyAxis','reflectVLine','reflectYAxis','reflectXAxis','identifyAxis','reflectVLine','reflectYAxis','reflectXAxis'];

function genReflectYAxis(M){
  const x=R(1,M.max)*(Math.random()<0.5?1:-1);
  const y=R(1,M.max)*(Math.random()<0.5?1:-1);
  const text=`鏡像對稱蝶展開翅膀，左翅膀有棋子坐標 (${x}, ${y})，對稱軸為 y 軸，請問右翅膀相對應的對稱點坐標為何？`;
  const ans=`(${-x}, ${y})`;
  const wrong1=`(${x}, ${-y})`,wrong2=`(${-x}, ${-y})`,wrong3=`(${y}, ${x})`;
  return {text,ans,options:ensure4(ans,[wrong1,wrong2,wrong3]),
    hint:'關於 y 軸對稱：y 坐標不變，x 坐標變成相反數。',
    explain:`(${x}, ${y}) 關於 y 軸的對稱點，y 坐標不變仍是 ${y}，x 坐標變成相反數 ${-x}，所以是 (${-x}, ${y})。`};
}
function genReflectXAxis(M){
  const x=R(1,M.max)*(Math.random()<0.5?1:-1);
  const y=R(1,M.max)*(Math.random()<0.5?1:-1);
  const text=`鏡像對稱蝶展開翅膀，上翅膀有棋子坐標 (${x}, ${y})，對稱軸為 x 軸，請問下翅膀相對應的對稱點坐標為何？`;
  const ans=`(${x}, ${-y})`;
  const wrong1=`(${-x}, ${y})`,wrong2=`(${-x}, ${-y})`,wrong3=`(${y}, ${x})`;
  return {text,ans,options:ensure4(ans,[wrong1,wrong2,wrong3]),
    hint:'關於 x 軸對稱：x 坐標不變，y 坐標變成相反數。',
    explain:`(${x}, ${y}) 關於 x 軸的對稱點，x 坐標不變仍是 ${x}，y 坐標變成相反數 ${-y}，所以是 (${x}, ${-y})。`};
}
function genReflectVLine(M){
  let k=R(-M.max,M.max);while(k===0)k=R(-M.max,M.max);
  let x=R(-M.max,M.max);while(x===0||x===k)x=R(-M.max,M.max);/* 點不要剛好在對稱軸上，也不要在 y 軸上，避免誘答選項重複 */
  let y=R(-M.max,M.max);while(y===0)y=R(-M.max,M.max);
  const symX=2*k-x;
  const text=`對稱蝶把對稱軸換成了鉛垂線 x = ${k}，已知一點坐標 (${x}, ${y})，請問它的對稱點坐標為何？`;
  const ans=`(${symX}, ${y})`;
  const wrong1=`(${x}, ${y})`,wrong2=`(${-x}, ${y})`,wrong3=`(${symX}, ${-y})`;
  return {text,ans,options:ensure4(ans,[wrong1,wrong2,wrong3]),
    hint:'關於直線 x=k 對稱：y 坐標不變，可用公式「對稱點 x 坐標 = 2k − 原 x 坐標」。',
    explain:`對稱點的 x 坐標 = 2×${k} − ${x} = ${symX}，y 坐標不變，所以對稱點為 (${symX}, ${y})。`};
}
function genIdentifyAxis(M){
  const x=R(1,M.max),y=R(1,M.max);
  const type=pick(['y','x','origin']);
  let symX,symY,desc;
  if(type==='y'){symX=-x;symY=y;desc='y 軸';}
  else if(type==='x'){symX=x;symY=-y;desc='x 軸';}
  else{symX=-x;symY=-y;desc='原點（中心對稱）';}
  const text=`已知一點 (${x}, ${y}) 與它的對稱點 (${symX}, ${symY})，這是關於什麼對稱？`;
  const ans=desc;
  return {text,ans,options:['y 軸','x 軸','原點（中心對稱）','無法判斷'],
    hint:'y 坐標不變、x 變號 → 關於 y 軸；x 坐標不變、y 變號 → 關於 x 軸；兩個坐標都變號 → 關於原點。',
    explain:`(${x},${y}) 變成 (${symX},${symY})，${type==='y'?'y 坐標沒變、x 變號，所以是關於 y 軸對稱':type==='x'?'x 坐標沒變、y 變號，所以是關於 x 軸對稱':'x、y 坐標都變號，所以是關於原點對稱'}。`};
}
function gen(t){
  const M=MODES[mode];
  if(t==='reflectYAxis')return genReflectYAxis(M);
  if(t==='reflectXAxis')return genReflectXAxis(M);
  if(t==='identifyAxis')return genIdentifyAxis(M);
  return genReflectVLine(M);
}

return {plan:['reflectYAxis','reflectXAxis','identifyAxis','reflectVLine','reflectYAxis','reflectXAxis','identifyAxis','reflectVLine','reflectYAxis','reflectXAxis'],gen:function(t,m){mode=m;return gen(t);}};
})();

JB2.stages['6-1-3']=(function(){
let mode='easy';

const $=s=>document.querySelector(s);
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
function ensure4(ans,cands){
  const s=new Set([ans]);
  for(const c of cands){const cs=String(c);if(s.size<4&&cs!==ans&&cs.trim()!=='')s.add(cs);}
  /* 誘答選項不夠時：答案不是純數字就「改動答案裡的一個數字」補齊（例如 (5, 5)→(5, 4)），不再塞無關的 -5、6 */
  if(s.size<4&&!/^-?\d+(\.\d+)?$/.test(String(ans))){
    const str=String(ans),vars=[],re=/\d+(?:\.\d+)?/g;let mm;
    while((mm=re.exec(str))!==null){for(const d of [1,-1,2,-2,3,-3]){const nv=Number(mm[0])+d;if(nv<0)continue;const dec=(mm[0].split('.')[1]||'').length;vars.push(str.slice(0,mm.index)+(dec?nv.toFixed(dec):nv)+str.slice(mm.index+mm[0].length));}}
    for(let i=vars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[vars[i],vars[j]]=[vars[j],vars[i]];}
    for(const v of vars){if(s.size>=4)break;if(!s.has(v))s.add(v);}
  }
  let g=1;
  while(s.size<4){const v=(Number(ans)||0)+(g%2===0?g/2+5:-(Math.ceil(g/2)+4));const vs=String(v);if(!s.has(vs))s.add(vs);g++;}
  return sh([...s]);
}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);return b?gcd(b,a%b):(a||1)}
function lcm(a,b){return Math.abs(a*b)/gcd(a,b)}
/* 坐標平面 SVG 繪圖工具：points 畫點、lines 畫 ax+by=c 直線、dashedTo 畫到兩軸的虛線 */
function lineSegPoints(a,b,c,R2){
  const pts=[];
  if(b!==0){[-R2,R2].forEach(x=>{const y=(c-a*x)/b;if(y>=-R2-0.0001&&y<=R2+0.0001)pts.push([x,y]);});}
  if(a!==0){[-R2,R2].forEach(y=>{const x=(c-b*y)/a;if(x>=-R2-0.0001&&x<=R2+0.0001)pts.push([x,y]);});}
  if(pts.length<2)return null;
  pts.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);
  return [pts[0],pts[pts.length-1]];
}
function svgGrid(opts){
  const RG=opts.range||7,S=260,C=S/2,U=(S-36)/(2*RG);
  const toX=x=>C+x*U,toY=y=>C-y*U;
  let g=`<div class="qsvg"><svg viewBox="0 0 ${S} ${S}" style="width:100%;max-width:260px;background:#fff;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  for(let i=-RG;i<=RG;i++){
    g+=`<line x1="${toX(i)}" y1="${toY(-RG)}" x2="${toX(i)}" y2="${toY(RG)}" stroke="#e3e3e3" stroke-width="1"/>`;
    g+=`<line x1="${toX(-RG)}" y1="${toY(i)}" x2="${toX(RG)}" y2="${toY(i)}" stroke="#e3e3e3" stroke-width="1"/>`;
  }
  g+=`<line x1="${toX(-RG)}" y1="${toY(0)}" x2="${toX(RG)}" y2="${toY(0)}" stroke="#333" stroke-width="2"/>`;
  g+=`<line x1="${toX(0)}" y1="${toY(-RG)}" x2="${toX(0)}" y2="${toY(RG)}" stroke="#333" stroke-width="2"/>`;
  g+=`<text x="${toX(RG)-10}" y="${toY(0)-6}" font-size="12" fill="#333">x</text><text x="${toX(0)+6}" y="${toY(RG)+12}" font-size="12" fill="#333">y</text>`;
  (opts.lines||[]).forEach(ln=>{
    const pts=lineSegPoints(ln.a,ln.b,ln.c,RG);
    if(pts)g+=`<line x1="${toX(pts[0][0])}" y1="${toY(pts[0][1])}" x2="${toX(pts[1][0])}" y2="${toY(pts[1][1])}" stroke="${ln.color||'#d24a33'}" stroke-width="2.5"/>`;
  });
  (opts.dashedTo||[]).forEach(p=>{
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(p.x)}" y2="${toY(0)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
    g+=`<line x1="${toX(p.x)}" y1="${toY(p.y)}" x2="${toX(0)}" y2="${toY(p.y)}" stroke="#999" stroke-width="1.3" stroke-dasharray="4,3"/>`;
  });
  (opts.points||[]).forEach(p=>{
    g+=`<circle cx="${toX(p.x)}" cy="${toY(p.y)}" r="4.5" fill="${p.color||'#d24a33'}"/>`;
    if(p.label)g+=`<text x="${toX(p.x)+6}" y="${toY(p.y)-6}" font-size="12" font-weight="700" fill="${p.color||'#d24a33'}">${p.label}</text>`;
  });
  g+='</svg></div>';
  return g;
}
function fmtEq(a,b,c){
  return (a===1?'':a)+'x + '+(b===1?'':b)+'y = '+c;
}
function fmtEqGen(a,b,c){
  let s=(a===1?'':a===-1?'-':a)+'x';
  s+=b>=0?' + '+(b===1?'':b)+'y':' - '+(Math.abs(b)===1?'':Math.abs(b))+'y';
  s+=' = '+c;
  return s;
}
const QUADS=['第一象限','第二象限','第三象限','第四象限'];
function quadName(x,y){
  if(x===0&&y===0)return '原點（不屬於任何象限）';
  if(x===0)return 'y 軸上（不屬於任何象限）';
  if(y===0)return 'x 軸上（不屬於任何象限）';
  if(x>0&&y>0)return '第一象限';
  if(x<0&&y>0)return '第二象限';
  if(x<0&&y<0)return '第三象限';
  return '第四象限';
}
function fmtNum(n){
  if(Number.isInteger(n))return String(n);
  return String(Math.round(n*100)/100);
}
/* ===== 積木圖：立體樂高（題目）＋ 平面視圖（選項）===== */
const LEGO_PAL=['#e3342f','#2f6fe0','#f2c230','#2fa84f','#f08a24','#8a4fd1'];
function shadeHex(h,f){const n=parseInt(h.slice(1),16);let r=n>>16,g=(n>>8)&255,b=n&255;const m=f<1?0:255,t=f<1?1-f:f-1;r=Math.round(r+(m-r)*t);g=Math.round(g+(m-g)*t);b=Math.round(b+(m-b)*t);return `rgb(${r},${g},${b})`}
function legoIso(grid){
  const rows=grid.length,cols=grid[0].length,U=36,K=.866;
  const P=(x,y,z)=>[(x+y)*K*U,((x-y)*.5-z)*U];
  const cubes=[];
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const y=rows-1-r,h=grid[r][c];for(let z=0;z<h;z++)cubes.push({x:c,y,z,top:z===h-1,col:LEGO_PAL[(c*2+y)%LEGO_PAL.length]})}
  cubes.sort((p,q)=>((q.y-q.x)-(p.y-p.x))||(p.z-q.z));
  let minx=1e9,maxx=-1e9,miny=1e9,maxy=-1e9;
  const grow=([x,y])=>{minx=Math.min(minx,x);maxx=Math.max(maxx,x);miny=Math.min(miny,y);maxy=Math.max(maxy,y)};
  for(let x=0;x<=cols;x++)for(let y=0;y<=rows;y++){grow(P(x,y,0));grow(P(x,y,Math.max(...grid.flat(),1)+.4))}
  const pad=26;let g='';
  const poly=(pts,fill)=>`<polygon points="${pts.map(q=>q[0].toFixed(1)+','+q[1].toFixed(1)).join(' ')}" fill="${fill}" stroke="#2b2416" stroke-width="1.3" stroke-linejoin="round"/>`;
  /* 地板格線 */
  g+=poly([P(0,0,0),P(cols,0,0),P(cols,rows,0),P(0,rows,0)],'#e9e2cf');
  cubes.forEach(k=>{
    const {x,y,z}=k;
    g+=poly([P(x,y,z),P(x+1,y,z),P(x+1,y,z+1),P(x,y,z+1)],k.col);                       /* 前面 */
    g+=poly([P(x+1,y,z),P(x+1,y+1,z),P(x+1,y+1,z+1),P(x+1,y,z+1)],shadeHex(k.col,.72));  /* 右面 */
    g+=poly([P(x,y,z+1),P(x+1,y,z+1),P(x+1,y+1,z+1),P(x,y+1,z+1)],shadeHex(k.col,1.28)); /* 上面 */
    if(k.top){const [cx,cy]=P(x+.5,y+.5,z+1),rx=.3*U,ry=.18*U,hh=.13*U;
      g+=`<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx}" ry="${ry}" fill="${shadeHex(k.col,.8)}"/><rect x="${(cx-rx).toFixed(1)}" y="${(cy-hh).toFixed(1)}" width="${2*rx}" height="${hh}" fill="${shadeHex(k.col,.9)}"/><ellipse cx="${cx.toFixed(1)}" cy="${(cy-hh).toFixed(1)}" rx="${rx}" ry="${ry}" fill="${shadeHex(k.col,1.15)}" stroke="#2b2416" stroke-width=".8"/>`}
  });
  /* 方向提示：正面（靠近你的長邊）、右側 */
  const fl=P(cols/2,0,0),rl=P(cols,rows/2,0);
  g+=`<text x="${(fl[0]-6).toFixed(1)}" y="${(fl[1]+40).toFixed(1)}" font-size="15" font-weight="700" fill="#7a4a12" text-anchor="middle">▲ 正面（前）</text>`;
  g+=`<text x="${(rl[0]+8).toFixed(1)}" y="${(rl[1]+34).toFixed(1)}" font-size="15" font-weight="700" fill="#7a4a12" text-anchor="start">右側 ▶</text>`;
  const bl=P(0,rows/2,0);
  const vx=minx-pad,vy=miny-pad,vw=maxx-minx+pad*2+70,vh=maxy-miny+pad*2+46;
  return `<div class="qsvg"><svg viewBox="${vx.toFixed(1)} ${vy.toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}" style="width:100%;max-width:330px;background:#fffdf5;border-radius:10px;border:1px solid #d9cfb4" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="積木立體圖">${g}</svg></div>`;
}
/* 平面視圖（選項圖片）：heights＝由左到右每一疊的高度 */
function legoCols(heights){
  const n=heights.length,mx=Math.max(...heights,1),S=30,pad=8,W=n*S+pad*2,H=mx*S+pad*2+8;let g='';
  g+=`<line x1="${pad-4}" y1="${H-pad}" x2="${W-pad+4}" y2="${H-pad}" stroke="#2b2416" stroke-width="2"/>`;
  heights.forEach((h,i)=>{const col=LEGO_PAL[i%LEGO_PAL.length];
    for(let j=0;j<h;j++){const x=pad+i*S,y=H-pad-(j+1)*S;g+=`<rect x="${x}" y="${y}" width="${S}" height="${S}" fill="${col}" stroke="#2b2416" stroke-width="1.4"/>`}
    if(h>0){const x=pad+i*S+S/2,y=H-pad-h*S;g+=`<rect x="${x-7}" y="${y-5}" width="14" height="5" rx="1.5" fill="${shadeHex(col,1.15)}" stroke="#2b2416" stroke-width="1"/>`}});
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:150px;height:auto" xmlns="http://www.w3.org/2000/svg">${g}</svg>`;
}
/* 上視圖（選項圖片）：str＝「■■□／■□□」，上排＝後排 */
function legoTop(str){
  const rows=str.split('／'),S=30,pad=8,W=rows[0].length*S+pad*2,H=rows.length*S+pad*2;let g='';
  rows.forEach((r,ri)=>[...r].forEach((ch,ci)=>{const x=pad+ci*S,y=pad+ri*S;
    if(ch==='■')g+=`<rect x="${x}" y="${y}" width="${S}" height="${S}" fill="#e3342f" stroke="#2b2416" stroke-width="1.4"/><circle cx="${x+S/2}" cy="${y+S/2}" r="8" fill="#f06a60" stroke="#2b2416" stroke-width="1"/>`;
    else g+=`<rect x="${x}" y="${y}" width="${S}" height="${S}" fill="#f4efe0" stroke="#9a8f70" stroke-width="1.2" stroke-dasharray="4 3"/>`}));
  g+=`<text x="${W-pad}" y="${pad+11}" font-size="11" fill="#7a4a12" text-anchor="end" opacity=".0">後</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:130px;height:auto" xmlns="http://www.w3.org/2000/svg">${g}</svg>`;
}
function optPic(type,v){
  if(type==='cols')return legoCols(String(v).split(/\s*,\s*/).map(Number));
  if(type==='top')return legoTop(String(v));
  return null;
}
const MODES={easy:{t:0,max:2},real:{t:15,max:3},hard:{t:10,max:4}};
const PLAN=['frontView','sideView','topView','totalCubes','frontView','topView','sideView','totalCubes','frontView','sideView'];

let LASTGRID=null;
function genGrid(M){
  const cols=pick([2,3]);
  const rows=2;
  let grid;
  /* 立體圖從「前右上方」看：前排某疊會擋住它「左後方」那疊的下半部。要求 後排[x-1] ≥ 前排[x]，這樣每一疊的頂端都看得到，不會有看不見的方塊 */
  for(let tries=0;tries<400;tries++){
    grid=[];
    for(let r=0;r<rows;r++){const row=[];for(let c=0;c<cols;c++)row.push(R(0,M.max));grid.push(row)}
    if(grid.flat().every(v=>v===0))continue;
    let ok=true;for(let x=1;x<cols;x++)if(grid[0][x-1]<grid[1][x])ok=false;
    if(ok)break;
  }
  if(grid.flat().every(v=>v===0))grid[0][0]=Math.max(1,M.max);
  LASTGRID=grid;
  return {grid,rows,cols};
}
function genFrontView(M){
  const {grid,cols}=genGrid(M);
  const frontHeights=[];
  for(let c=0;c<cols;c++)frontHeights.push(Math.max(grid[0][c],grid[1][c]));
  const svg=legoIso(grid);
  const text='空間三視幻影怪是用積木疊成的（如圖，從「正面」看過去最靠近你的是前排，每一疊都是從地面往上疊）。請問從正前方看過去（前視圖），哪一張圖才是對的？（由左到右）';
  const ans=frontHeights.join(', ');
  const rev=[...frontHeights].reverse().join(', ');
  const plusOne=frontHeights.map(h=>h+1).join(', ');
  const backOnly=grid[1].join(', ');
  return {text,svg,ans,pic:'cols',options:ensure4(ans,[rev,plusOne,backOnly]),
    hint:'前視圖是「站在正前方看」：同一直行裡，前排和後排疊在一起，矮的會被擋住，只看得到比較高的那一疊。',
    explain:`數圖中每一疊的積木數（後排 ${grid[0].join('、')}；前排 ${grid[1].join('、')}），每一直行取前排、後排中比較高的：${grid[0].map((v,c)=>`第${c+1}行 max(${grid[0][c]},${grid[1][c]})=${frontHeights[c]}`).join('；')}，所以前視圖高度依序為 ${ans}。`};
}
function genSideView(M){
  const {grid,rows}=genGrid(M);
  const heights=[];
  for(let r=0;r<rows;r++)heights.push(Math.max(...grid[r]));
  const sideOrder=[heights[1],heights[0]];
  const svg=legoIso(grid);
  const text='幻影怪由積木疊成（如圖）。從右側看過去（右視圖），哪一張圖才是對的？（圖中左邊是前排、右邊是後排）';
  const ans=sideOrder.join(', ');
  const rev=[...sideOrder].reverse().join(', ');
  const plusOne=sideOrder.map(h=>h+1).join(', ');
  const wrong3=[heights[0],heights[1]].join(', ');
  return {text,svg,ans,pic:'cols',options:ensure4(ans,[rev,plusOne,wrong3]),
    hint:'側視圖看的是「每一排（前排、後排）裡最高的那一疊」，前排看前排最高的，後排看後排最高的。',
    explain:`前排最高為 ${heights[1]}，後排最高為 ${heights[0]}，所以側視圖由前到後依序為 ${ans}。`};
}
function genTopCount(M){
  const {grid,rows,cols}=genGrid(M);
  const count=grid.flat().filter(v=>v>0).length;
  const svg=legoIso(grid);
  const text='從正上方往下看（上視圖），總共有幾個位置擺放了正方體（高度為 0 的空格不算）？';
  const ans=String(count);
  const total=rows*cols;
  return {text,svg,ans,options:ensure4(ans,[String(total),String(Math.max(count-1,0)),String(count+1)]),
    hint:'上視圖看的是「從上面往下看，哪些位置有積木」，只要有疊積木，不管疊幾塊，都算一個位置。',
    explain:`從上面看總共 ${total} 個位置，其中有積木的有 ${count} 個，所以上視圖有 ${count} 個位置擺放了正方體。`};
}
function genTotalCubes(M){
  const {grid}=genGrid(M);
  const total=grid.flat().reduce((a,b)=>a+b,0);
  const svg=legoIso(grid);
  const text='幻影怪是用積木疊成的（如圖，每一疊都是從地面往上疊，沒有懸空）。總共用了幾塊積木？';
  const ans=String(total);
  return {text,svg,ans,options:ensure4(ans,[String(total+1),String(Math.max(total-1,0)),String(total+2)]),
    hint:'一疊一疊數：每一疊有幾塊積木，全部加起來，就是總共用了幾塊積木。',
    explain:`把每個位置的高度加起來：${grid.flat().join(' + ')} = ${total}，所以總共用了 ${total} 個正方體。`};
}
function genTopView(M){
  const {grid,rows,cols}=genGrid(M);
  const svg=legoIso(grid);
  const rowStr=r=>grid[r].map(v=>v>0?'■':'□').join('');
  const ans=[rowStr(0),rowStr(1)].join('／');
  const cands=[[rowStr(1),rowStr(0)].join('／'),[[...rowStr(0)].reverse().join(''),[...rowStr(1)].reverse().join('')].join('／')];
  const flip=(str,i)=>{const a=[...str];let k=0;return a.map(ch=>ch==='／'?ch:(k++===i?(ch==='■'?'□':'■'):ch)).join('')};
  for(let i=0;i<rows*cols;i++)cands.push(flip(ans,i));
  const set=new Set([ans]);for(const c of sh(cands.slice(0,2)).concat(sh(cands.slice(2))))if(set.size<4&&c!==ans)set.add(c);
  const text='幻影怪由積木疊成（如圖）。從正上方往下看（上視圖），哪一張圖才是對的？（圖中上排是後排、下排是前排；紅色有圓點＝有積木，虛線空格＝沒有）';
  return {text,svg,ans,pic:'top',options:[...set],
    hint:'上視圖只看「有沒有積木」，不管疊幾塊：有疊的位置畫紅色，沒有的位置空白。注意上排是後排、下排是前排。',
    explain:`從上面往下看，每個位置只要有積木就畫實心。後排：${grid[0].map(v=>v>0?'有':'沒有').join('、')}；前排：${grid[1].map(v=>v>0?'有':'沒有').join('、')}。`};
}
function gen(t){
  const M=MODES[mode];
  if(t==='frontView')return genFrontView(M);
  if(t==='sideView')return genSideView(M);
  if(t==='topCount')return genTopCount(M);
  if(t==='topView')return genTopView(M);
  return genTotalCubes(M);
}
const _gen=gen;gen=function(t){const r=_gen(t);r.grid=LASTGRID.map(x=>x.slice());return r};

return {plan:['frontView','sideView','topView','totalCubes','frontView','topView','sideView','totalCubes','frontView','sideView'],gen:function(t,m){mode=m;return gen(t);}};
})();
