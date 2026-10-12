// ============================================================
// Tommy Q - Clean Edition | 打字遊戲
// Complete game engine - Vanilla JS + Canvas 2D
// ============================================================

// ── Word List ────────────────────────────────────────────────
const WORD_LIST = [
  "abandon","ability","able","about","above","absent","absorb","abstract","abuse","accept",
  "access","accident","account","accurate","accuse","achieve","acid","acquire","across","action",
  "active","activity","actor","actual","adapt","add","address","adjust","admin","admit",
  "adopt","adult","advance","advice","advise","affair","affect","afford","afraid","after",
  "again","against","age","agency","agenda","agent","agree","ahead","aid","aim","air",
  "aircraft","airport","album","alcohol","alive","all","allow","ally","almost","alone",
  "along","already","also","alter","always","amazing","among","amount","analyst","analyze",
  "ancient","anger","angle","angry","animal","announce","annual","another","answer","anxiety",
  "any","anybody","anyone","anything","anyway","apart","appeal","appear","apple","apply",
  "appoint","approach","approve","area","argue","arise","arm","army","around","arrange",
  "arrest","arrive","art","article","artist","as","aside","ask","asleep","aspect",
  "assault","assert","assess","asset","assign","assist","assume","assure","at","athlete",
  "attach","attack","attempt","attend","attitude","attract","audience","author","auto","avoid",
  "award","aware","away","awful","baby","back","bad","badly","bag","bake","balance","ball",
  "ban","band","bank","bar","barely","barrel","barrier","base","basic","basis","basket",
  "battle","be","beach","bean","bear","beat","beauty","because","become","bed","beer",
  "before","begin","behavior","behind","being","belief","believe","bell","belong","below",
  "belt","bench","bend","benefit","best","bet","better","between","beyond","big","bike",
  "bill","bind","bird","birth","bit","bite","black","blade","blame","blank","blast",
  "blaze","bleed","blend","bless","blind","block","blood","blow","blue","board","boat",
  "body","bomb","bond","bone","book","boom","boot","border","boss","both","bother","bottle",
  "bottom","bowl","box","boy","brain","branch","brand","brave","bread","break","breath",
  "breathe","brick","bridge","brief","bright","bring","broad","broken","brother","brown",
  "brush","buck","budget","bug","build","bullet","bunch","burden","burn","burst","bury",
  "bus","butter","button","buy","cabin","cable","cage","cake","call","calm","came","camera",
  "camp","campus","can","cancel","cancer","cap","capable","capture","car","carbon","card",
  "care","career","careful","carry","case","cash","cast","cat","catch","cause","cell",
  "center","central","century","chain","chair","chamber","champion","chance","change","channel",
  "chapter","charge","charity","chart","chase","cheap","check","cheek","cheese","chef","chest",
  "chief","child","chip","choice","choose","church","circle","citizen","city","civil","claim",
  "class","classic","clean","clear","click","client","climb","clock","clone","close","cloth",
  "cloud","club","clue","coach","coast","coat","code","coffee","cold","collect","color",
  "column","combine","come","comfort","command","comment","commit","common","company","compare",
  "complex","compute","concern","conduct","confirm","connect","consist","contact","contain",
  "content","contest","context","control","convert","cook","cool","copy","core","corner",
  "correct","cost","couch","could","council","count","country","county","couple","courage",
  "course","court","cousin","cover","crack","craft","crash","crazy","cream","create","credit",
  "crew","crime","crisis","cross","crowd","cruel","crush","cry","cup","cure","current",
  "curve","custom","cut","cycle","dad","damage","dance","danger","dare","dark","data",
  "date","dawn","day","dead","deal","dear","death","debate","debt","decade","decent",
  "decide","deck","declare","decline","deep","deer","defeat","defend","define","degree",
  "delay","deliver","demand","deny","depart","depend","deploy","depth","derive","desert",
  "design","desk","detail","detect","develop","device","devote","dialog","die","diet",
  "differ","dig","digital","dinner","direct","dirty","discover","disease","dish","dismiss",
  "display","distance","divide","doctor","dog","dollar","domain","door","double","doubt",
  "down","dozen","draft","drag","dragon","drama","draw","dream","dress","drink","drive",
  "drop","drug","drum","dry","duck","due","dump","during","dust","duty","each","eagle",
  "ear","early","earn","earth","ease","east","easy","eat","echo","edge","edit","editor",
  "effect","effort","egg","eight","either","elect","element","emerge","emotion","empire",
  "employ","empty","enable","end","enemy","energy","engine","enjoy","enough","ensure","enter",
  "entire","entry","equal","equip","era","error","escape","essay","even","event","ever",
  "every","evil","exact","exam","example","exceed","except","exchange","excite","excuse",
  "exist","exit","expand","expect","expense","expert","explain","explore","export","expose",
  "extend","extra","extreme","eye","face","fact","factor","fade","fail","fair","faith",
  "fall","false","family","famous","fan","fancy","far","farm","fast","fat","fate","father",
  "fault","favor","fear","feature","federal","fee","feed","feel","female","fence","few",
  "field","fight","figure","file","fill","film","final","finally","find","fine","finger",
  "finish","fire","firm","first","fish","fit","five","fix","flag","flame","flash","flat",
  "flavor","flee","flesh","flight","flip","float","flood","floor","flow","flower","fly",
  "focus","fold","folk","follow","food","foot","for","force","forest","forget","form",
  "formal","former","forth","fortune","forward","found","four","fox","frame","free","fresh",
  "friend","front","fruit","fuel","full","fun","fund","funny","future","gain","game",
  "gang","gap","garage","garden","gas","gate","gather","gave","gear","gender","general",
  "gentle","ghost","giant","gift","girl","give","glad","glass","global","glory","goal",
  "god","gold","golden","golf","gone","good","govern","grab","grace","grade","grain",
  "grand","grant","grass","grave","gray","great","green","grew","ground","group","grow",
  "growth","guard","guess","guest","guide","guilt","guitar","gun","guy","habit","hair",
  "half","hall","hand","handle","hang","happen","happy","harbor","hard","harm","hat",
  "hate","have","head","health","hear","heart","heat","heavy","height","held","hell",
  "hello","help","her","here","hero","hide","high","hill","him","hip","hire","his",
  "hit","hold","hole","holy","home","honest","honor","hook","hope","horror","horse",
  "host","hot","hotel","hour","house","huge","human","humor","hunt","hurry","hurt","ice",
  "idea","ignore","image","imagine","impact","import","impose","improve","inch","include",
  "income","index","indian","indicate","indoor","initial","injury","inner","input","insect",
  "inside","insist","install","instead","intend","interest","into","invest","invite","iron",
  "island","issue","item","its","jacket","jail","jam","jet","job","join","joke","joy",
  "judge","juice","jump","junior","jury","just","justice","keen","keep","key","kick","kid",
  "kill","kind","king","kiss","kit","knee","knew","knife","knock","know","label","labor",
  "lack","lady","lake","land","lane","large","last","late","later","laugh","launch","law",
  "lawn","layer","lead","leader","leaf","league","lean","learn","least","leave","left",
  "leg","legal","lemon","length","less","lesson","let","letter","level","liberty","library",
  "lie","life","lift","light","like","likely","limit","line","link","lion","lip","list",
  "listen","little","live","load","loan","local","locate","lock","long","look","loose",
  "lord","lose","loss","lost","lot","loud","love","lovely","low","lower","luck","lunch",
  "lung","machine","mad","magic","mail","main","major","make","male","mall","man","manage",
  "manner","many","map","march","mark","market","marry","mask","mass","master","match",
  "matter","may","maybe","mayor","me","meal","mean","measure","meat","media","medical",
  "meet","member","memory","mental","mention","menu","mercy","mere","mess","message","metal",
  "method","middle","might","mile","milk","million","mind","mine","minor","minute","mirror",
  "miss","mission","mix","mode","model","modern","mom","moment","money","month","mood",
  "moon","moral","more","morning","most","mother","motion","motor","mount","mouse","mouth",
  "move","movie","much","murder","muscle","music","must","mutual","myself","mystery","myth",
  "name","narrow","nation","native","nature","near","nearly","neck","need","nerve","net",
  "never","new","news","next","nice","night","nine","noble","nod","noise","none","nor",
  "normal","north","nose","not","note","nothing","notice","novel","now","number","nurse",
  "object","observe","obtain","obvious","occur","ocean","odd","off","offense","offer",
  "office","often","oil","old","once","one","online","only","onto","open","operate",
  "opinion","oppose","option","orange","order","organ","origin","other","ought","our","out",
  "outcome","output","outside","over","overall","own","owner","pace","pack","page","paid",
  "pain","paint","pair","palace","pale","palm","pan","panel","panic","paper","parent",
  "park","part","partner","party","pass","passage","past","patch","path","patient","pattern",
  "pause","pay","peace","peak","peer","pen","people","perfect","perform","perhaps","period",
  "permit","person","phase","phone","photo","phrase","pick","picture","piece","pilot","pin",
  "pink","pipe","pitch","place","plain","plan","plane","planet","plant","plate","play",
  "player","please","plenty","plot","plus","pocket","poem","poet","point","poison","pole",
  "police","policy","poll","pool","poor","pop","popular","port","pose","position","positive",
  "possess","possible","post","pot","potato","pound","pour","poverty","powder","power",
  "powerful","practice","prayer","predict","prefer","prepare","present","press","pressure",
  "pretend","pretty","prevent","price","pride","primary","prince","print","prior","prison",
  "private","prize","probably","problem","proceed","process","produce","product","profile",
  "profit","program","project","promise","promote","proof","proper","propose","protect",
  "protest","proud","prove","provide","public","pull","punch","pure","purpose","push","put",
  "qualify","quarter","queen","question","quick","quiet","quit","quite","quote","race","radio",
  "rage","rain","raise","range","rank","rapid","rare","rate","rather","raw","reach","react",
  "read","ready","real","reality","realize","really","reason","recall","receive","recent",
  "record","recover","red","reduce","reflect","reform","regard","regime","region","register",
  "regret","reject","relate","release","relief","religion","rely","remain","remark","remember",
  "remind","remote","remove","repeat","replace","reply","report","represent","request","require",
  "rescue","research","resource","respond","rest","restore","result","retain","retire","return",
  "reveal","revenue","review","rich","ride","rifle","right","ring","rise","risk","river",
  "road","robot","rock","role","roll","roof","room","root","rope","rose","rough","round",
  "route","row","royal","rub","ruin","rule","run","rural","rush","sacred","sad","safe",
  "saint","sake","salary","sale","salt","same","sample","sand","satisfy","save","say","scale",
  "scene","school","science","score","screen","sea","search","season","seat","second","secret",
  "section","secure","see","seed","seek","seem","segment","seize","select","self","sell",
  "senate","send","senior","sense","sentence","separate","series","serious","serve","service",
  "session","set","settle","seven","severe","shade","shadow","shake","shall","shame","shape",
  "share","sharp","she","sheet","shelf","shell","shelter","shift","shine","ship","shirt",
  "shock","shoe","shoot","shop","shore","short","shot","should","shoulder","shout","show",
  "shower","shut","sick","side","sight","sign","signal","silence","silver","similar","simple",
  "simply","since","sing","sir","sister","sit","site","six","size","skill","skin","sky",
  "slave","sleep","slice","slide","slight","slip","slow","small","smart","smell","smile",
  "smoke","smooth","snap","snow","so","soccer","social","soft","soil","solar","soldier",
  "solid","solution","solve","some","somebody","somehow","someone","song","soon","sorry",
  "sort","soul","sound","source","south","space","speak","special","speech","speed","spend",
  "sphere","spirit","split","sport","spot","spread","spring","square","stable","staff","stage",
  "stake","stand","star","stare","start","state","status","stay","steady","steal","steam",
  "steel","steep","step","stick","stiff","still","stock","stone","stop","store","storm",
  "story","straight","strange","strategy","stream","street","strength","stress","stretch",
  "strike","string","strip","stroke","strong","structure","struggle","student","studio","study",
  "stuff","stupid","style","subject","submit","succeed","success","such","sudden","suffer",
  "sugar","summer","sun","super","supply","support","suppose","sure","surface","surprise",
  "survive","suspect","sweet","swim","swing","switch","symbol","system","table","tail","take",
  "tale","talent","talk","tall","tank","tape","target","task","taste","tax","tea","teach",
  "teacher","team","tear","tell","temple","ten","tend","term","terror","test","text","than",
  "thank","that","the","their","them","theme","then","theory","there","these","they","thick",
  "thin","thing","think","third","this","those","though","thought","threat","three","throat",
  "through","throw","thus","ticket","tide","tie","tight","till","time","tiny","tip","tire",
  "title","to","today","toe","together","tomorrow","tone","tongue","tonight","too","tool",
  "top","topic","toss","total","touch","tough","tour","toward","tower","town","trace","track",
  "trade","train","transfer","transform","travel","treat","tree","trend","trial","tribe",
  "trick","trip","triumph","troop","trouble","truck","true","truly","trust","truth","try",
  "tube","tunnel","turn","twice","twin","twist","two","type","typical","ugly","uncle","under",
  "undergo","understand","union","unique","unit","unite","universe","unknown","unless","unlike",
  "until","unusual","up","upon","upper","upset","urban","urge","us","use","used","useful",
  "user","usual","valley","value","van","variety","various","vast","vehicle","version","very",
  "victim","victory","video","view","village","violence","virtue","visible","vision","visit",
  "visual","vital","voice","volume","vote","wage","wait","wake","walk","wall","want","war",
  "warn","wash","waste","watch","water","wave","way","we","weak","wealth","weapon","wear",
  "weather","web","week","weigh","weight","welcome","well","west","western","wet","what",
  "wheel","when","where","whether","which","while","whisper","white","who","whole","whom",
  "whose","why","wide","wife","wild","will","win","wind","window","wine","wing","winner",
  "winter","wire","wisdom","wise","wish","with","within","without","witness","woman","wonder",
  "wood","word","work","worker","world","worry","worse","worst","worth","would","wound",
  "wrap","write","writer","wrong","yard","yeah","year","yellow","yes","yesterday","yet",
  "yield","you","young","your","youth","zero","zone"
];

// ── Chinese Character Database (Top 500 Most Frequent Characters) ──
const CHINESE_CHARACTERS = [
  {char:"的",pinyin:"de",input:"de"}, {char:"一",pinyin:"yī",input:"yi"}, {char:"是",pinyin:"shì",input:"shi"}, {char:"不",pinyin:"bù",input:"bu"}, {char:"了",pinyin:"le",input:"le"},
  {char:"在",pinyin:"zài",input:"zai"}, {char:"人",pinyin:"rén",input:"ren"}, {char:"有",pinyin:"yǒu",input:"you"}, {char:"我",pinyin:"wǒ",input:"wo"}, {char:"他",pinyin:"tā",input:"ta"},
  {char:"這",pinyin:"zhè",input:"zhe"}, {char:"中",pinyin:"zhōng",input:"zhong"}, {char:"大",pinyin:"dà",input:"da"}, {char:"來",pinyin:"lái",input:"lai"}, {char:"上",pinyin:"shàng",input:"shang"},
  {char:"國",pinyin:"guó",input:"guo"}, {char:"個",pinyin:"gè",input:"ge"}, {char:"到",pinyin:"dào",input:"dao"}, {char:"說",pinyin:"shuō",input:"shuo"}, {char:"們",pinyin:"men",input:"men"},
  {char:"為",pinyin:"wèi",input:"wei"}, {char:"子",pinyin:"zǐ",input:"zi"}, {char:"和",pinyin:"hé",input:"he"}, {char:"你",pinyin:"nǐ",input:"ni"}, {char:"地",pinyin:"de",input:"de"},
  {char:"出",pinyin:"chū",input:"chu"}, {char:"道",pinyin:"dào",input:"dao"}, {char:"也",pinyin:"yě",input:"ye"}, {char:"時",pinyin:"shí",input:"shi"}, {char:"年",pinyin:"nián",input:"nian"},
  {char:"得",pinyin:"de",input:"de"}, {char:"就",pinyin:"jiù",input:"jiu"}, {char:"那",pinyin:"nà",input:"na"}, {char:"要",pinyin:"yào",input:"yao"}, {char:"下",pinyin:"xià",input:"xia"},
  {char:"以",pinyin:"yǐ",input:"yi"}, {char:"生",pinyin:"shēng",input:"sheng"}, {char:"會",pinyin:"huì",input:"hui"}, {char:"自",pinyin:"zì",input:"zi"}, {char:"著",pinyin:"zhe",input:"zhe"},
  {char:"去",pinyin:"qù",input:"qu"}, {char:"之",pinyin:"zhī",input:"zhi"}, {char:"過",pinyin:"guò",input:"guo"}, {char:"家",pinyin:"jiā",input:"jia"}, {char:"學",pinyin:"xué",input:"xue"},
  {char:"對",pinyin:"duì",input:"dui"}, {char:"可",pinyin:"kě",input:"ke"}, {char:"她",pinyin:"tā",input:"ta"}, {char:"後",pinyin:"hòu",input:"hou"}, {char:"成",pinyin:"chéng",input:"cheng"},
  {char:"天",pinyin:"tiān",input:"tian"}, {char:"能",pinyin:"néng",input:"neng"}, {char:"開",pinyin:"kāi",input:"kai"}, {char:"想",pinyin:"xiǎng",input:"xiang"}, {char:"都",pinyin:"dōu",input:"dou"},
  {char:"分",pinyin:"fēn",input:"fen"}, {char:"好",pinyin:"hǎo",input:"hao"}, {char:"多",pinyin:"duō",input:"duo"}, {char:"小",pinyin:"xiǎo",input:"xiao"}, {char:"心",pinyin:"xīn",input:"xin"},
  {char:"麼",pinyin:"me",input:"me"}, {char:"然",pinyin:"rán",input:"ran"}, {char:"起",pinyin:"qǐ",input:"qi"}, {char:"看",pinyin:"kàn",input:"kan"}, {char:"事",pinyin:"shì",input:"shi"},
  {char:"只",pinyin:"zhǐ",input:"zhi"}, {char:"面",pinyin:"miàn",input:"mian"}, {char:"樣",pinyin:"yàng",input:"yang"}, {char:"動",pinyin:"dòng",input:"dong"}, {char:"兩",pinyin:"liǎng",input:"liang"},
  {char:"理",pinyin:"lǐ",input:"li"}, {char:"前",pinyin:"qián",input:"qian"}, {char:"發",pinyin:"fā",input:"fa"}, {char:"些",pinyin:"xiē",input:"xie"}, {char:"還",pinyin:"hái",input:"hai"},
  {char:"見",pinyin:"jiàn",input:"jian"}, {char:"當",pinyin:"dāng",input:"dang"}, {char:"同",pinyin:"tóng",input:"tong"}, {char:"把",pinyin:"bǎ",input:"ba"}, {char:"機",pinyin:"jī",input:"ji"},
  {char:"如",pinyin:"rú",input:"ru"}, {char:"最",pinyin:"zuì",input:"zui"}, {char:"水",pinyin:"shuǐ",input:"shui"}, {char:"第",pinyin:"dì",input:"di"}, {char:"明",pinyin:"míng",input:"ming"},
  {char:"實",pinyin:"shí",input:"shi"}, {char:"意",pinyin:"yì",input:"yi"}, {char:"本",pinyin:"běn",input:"ben"}, {char:"頭",pinyin:"tóu",input:"tou"}, {char:"進",pinyin:"jìn",input:"jin"},
  {char:"文",pinyin:"wén",input:"wen"}, {char:"定",pinyin:"dìng",input:"ding"}, {char:"法",pinyin:"fǎ",input:"fa"}, {char:"現",pinyin:"xiàn",input:"xian"}, {char:"重",pinyin:"zhòng",input:"zhong"},
  {char:"點",pinyin:"diǎn",input:"dian"}, {char:"主",pinyin:"zhǔ",input:"zhu"}, {char:"通",pinyin:"tōng",input:"tong"}, {char:"關",pinyin:"guān",input:"guan"}, {char:"先",pinyin:"xiān",input:"xian"},
  {char:"條",pinyin:"tiáo",input:"tiao"}, {char:"各",pinyin:"gè",input:"ge"}, {char:"結",pinyin:"jié",input:"jie"}, {char:"間",pinyin:"jiān",input:"jian"}, {char:"門",pinyin:"mén",input:"men"},
  {char:"應",pinyin:"yīng",input:"ying"}, {char:"又",pinyin:"yòu",input:"you"}, {char:"車",pinyin:"chē",input:"che"}, {char:"日",pinyin:"rì",input:"ri"}, {char:"月",pinyin:"yuè",input:"yue"},
  {char:"問",pinyin:"wèn",input:"wen"}, {char:"使",pinyin:"shǐ",input:"shi"}, {char:"政",pinyin:"zhèng",input:"zheng"}, {char:"身",pinyin:"shēn",input:"shen"}, {char:"氣",pinyin:"qì",input:"qi"},
  {char:"部",pinyin:"bù",input:"bu"}, {char:"萬",pinyin:"wàn",input:"wan"}, {char:"無",pinyin:"wú",input:"wu"}, {char:"表",pinyin:"biǎo",input:"biao"}, {char:"合",pinyin:"hé",input:"he"},
  {char:"外",pinyin:"wài",input:"wai"}, {char:"力",pinyin:"lì",input:"li"}, {char:"次",pinyin:"cì",input:"ci"}, {char:"給",pinyin:"gěi",input:"gei"}, {char:"手",pinyin:"shǒu",input:"shou"},
  {char:"名",pinyin:"míng",input:"ming"}, {char:"物",pinyin:"wù",input:"wu"}, {char:"回",pinyin:"huí",input:"hui"}, {char:"再",pinyin:"zài",input:"zai"}, {char:"寫",pinyin:"xiě",input:"xie"},
  {char:"方",pinyin:"fāng",input:"fang"}, {char:"行",pinyin:"xíng",input:"xing"}, {char:"美",pinyin:"měi",input:"mei"}, {char:"許",pinyin:"xǔ",input:"xu"}, {char:"情",pinyin:"qíng",input:"qing"},
  {char:"話",pinyin:"huà",input:"hua"}, {char:"太",pinyin:"tài",input:"tai"}, {char:"展",pinyin:"zhǎn",input:"zhan"}, {char:"處",pinyin:"chù",input:"chu"}, {char:"將",pinyin:"jiāng",input:"jiang"},
  {char:"百",pinyin:"bǎi",input:"bai"}, {char:"知",pinyin:"zhī",input:"zhi"}, {char:"相",pinyin:"xiāng",input:"xiang"}, {char:"全",pinyin:"quán",input:"quan"}, {char:"正",pinyin:"zhèng",input:"zheng"},
  {char:"代",pinyin:"dài",input:"dai"}, {char:"向",pinyin:"xiàng",input:"xiang"}, {char:"告",pinyin:"gào",input:"gao"}, {char:"安",pinyin:"ān",input:"an"}, {char:"市",pinyin:"shì",input:"shi"},
  {char:"公",pinyin:"gōng",input:"gong"}, {char:"式",pinyin:"shì",input:"shi"}, {char:"區",pinyin:"qū",input:"qu"}, {char:"被",pinyin:"bèi",input:"bei"}, {char:"便",pinyin:"biàn",input:"bian"},
  {char:"或",pinyin:"huò",input:"huo"}, {char:"題",pinyin:"tí",input:"ti"}, {char:"老",pinyin:"lǎo",input:"lao"}, {char:"高",pinyin:"gāo",input:"gao"}, {char:"信",pinyin:"xìn",input:"xin"},
  {char:"原",pinyin:"yuán",input:"yuan"}, {char:"認",pinyin:"rèn",input:"ren"}, {char:"記",pinyin:"jì",input:"ji"}, {char:"界",pinyin:"jiè",input:"jie"}, {char:"算",pinyin:"suàn",input:"suan"},
  {char:"變",pinyin:"biàn",input:"bian"}, {char:"真",pinyin:"zhēn",input:"zhen"}, {char:"感",pinyin:"gǎn",input:"gan"}, {char:"金",pinyin:"jīn",input:"jin"}, {char:"幾",pinyin:"jǐ",input:"ji"},
  {char:"每",pinyin:"měi",input:"mei"}, {char:"統",pinyin:"tǒng",input:"tong"}, {char:"果",pinyin:"guǒ",input:"guo"}, {char:"音",pinyin:"yīn",input:"yin"}, {char:"世",pinyin:"shì",input:"shi"},
  {char:"常",pinyin:"cháng",input:"chang"}, {char:"戰",pinyin:"zhàn",input:"zhan"}, {char:"平",pinyin:"píng",input:"ping"}, {char:"立",pinyin:"lì",input:"li"}, {char:"強",pinyin:"qiáng",input:"qiang"},
  {char:"組",pinyin:"zǔ",input:"zu"}, {char:"活",pinyin:"huó",input:"huo"}, {char:"內",pinyin:"nèi",input:"nei"}, {char:"報",pinyin:"bào",input:"bao"}, {char:"帶",pinyin:"dài",input:"dai"},
  {char:"連",pinyin:"lián",input:"lian"}, {char:"步",pinyin:"bù",input:"bu"}, {char:"保",pinyin:"bǎo",input:"bao"}, {char:"總",pinyin:"zǒng",input:"zong"}, {char:"傳",pinyin:"chuán",input:"chuan"},
  {char:"長",pinyin:"cháng",input:"chang"}, {char:"走",pinyin:"zǒu",input:"zou"}, {char:"聞",pinyin:"wén",input:"wen"}, {char:"經",pinyin:"jīng",input:"jing"}, {char:"做",pinyin:"zuò",input:"zuo"},
  {char:"沒",pinyin:"méi",input:"mei"}, {char:"業",pinyin:"yè",input:"ye"}, {char:"答",pinyin:"dá",input:"da"}, {char:"加",pinyin:"jiā",input:"jia"}, {char:"女",pinyin:"nǚ",input:"nv"},
  {char:"反",pinyin:"fǎn",input:"fan"}, {char:"受",pinyin:"shòu",input:"shou"}, {char:"其",pinyin:"qí",input:"qi"}, {char:"由",pinyin:"yóu",input:"you"}, {char:"教",pinyin:"jiào",input:"jiao"},
  {char:"此",pinyin:"cǐ",input:"ci"}, {char:"數",pinyin:"shù",input:"shu"}, {char:"基",pinyin:"jī",input:"ji"}, {char:"期",pinyin:"qí",input:"qi"}, {char:"放",pinyin:"fàng",input:"fang"},
  {char:"運",pinyin:"yùn",input:"yun"}, {char:"笑",pinyin:"xiào",input:"xiao"}, {char:"張",pinyin:"zhāng",input:"zhang"}, {char:"流",pinyin:"liú",input:"liu"}, {char:"海",pinyin:"hǎi",input:"hai"},
  {char:"覺",pinyin:"jué",input:"jue"}, {char:"路",pinyin:"lù",input:"lu"}, {char:"非",pinyin:"fēi",input:"fei"}, {char:"任",pinyin:"rèn",input:"ren"}, {char:"建",pinyin:"jiàn",input:"jian"},
  {char:"規",pinyin:"guī",input:"gui"}, {char:"少",pinyin:"shǎo",input:"shao"}, {char:"求",pinyin:"qiú",input:"qiu"}, {char:"確",pinyin:"què",input:"que"}, {char:"度",pinyin:"dù",input:"du"},
  {char:"解",pinyin:"jiě",input:"jie"}, {char:"打",pinyin:"dǎ",input:"da"}, {char:"山",pinyin:"shān",input:"shan"}, {char:"語",pinyin:"yǔ",input:"yu"}, {char:"論",pinyin:"lùn",input:"lun"},
  {char:"飛",pinyin:"fēi",input:"fei"}, {char:"設",pinyin:"shè",input:"she"}, {char:"神",pinyin:"shén",input:"shen"}, {char:"愛",pinyin:"ài",input:"ai"}, {char:"制",pinyin:"zhì",input:"zhi"},
  {char:"資",pinyin:"zī",input:"zi"}, {char:"半",pinyin:"bàn",input:"ban"}, {char:"接",pinyin:"jiē",input:"jie"}, {char:"影",pinyin:"yǐng",input:"ying"}, {char:"質",pinyin:"zhì",input:"zhi"},
  {char:"造",pinyin:"zào",input:"zao"}, {char:"線",pinyin:"xiàn",input:"xian"}, {char:"風",pinyin:"fēng",input:"feng"}, {char:"空",pinyin:"kōng",input:"kong"}, {char:"光",pinyin:"guāng",input:"guang"},
  {char:"木",pinyin:"mù",input:"mu"}, {char:"電",pinyin:"diàn",input:"dian"}, {char:"夜",pinyin:"yè",input:"ye"}, {char:"取",pinyin:"qǔ",input:"qu"}, {char:"始",pinyin:"shǐ",input:"shi"},
  {char:"白",pinyin:"bái",input:"bai"}, {char:"十",pinyin:"shí",input:"shi"}, {char:"二",pinyin:"èr",input:"er"}, {char:"三",pinyin:"sān",input:"san"}, {char:"四",pinyin:"sì",input:"si"},
  {char:"五",pinyin:"wǔ",input:"wu"}, {char:"六",pinyin:"liù",input:"liu"}, {char:"七",pinyin:"qī",input:"qi"}, {char:"八",pinyin:"bā",input:"ba"}, {char:"九",pinyin:"jiǔ",input:"jiu"},
  {char:"千",pinyin:"qiān",input:"qian"}, {char:"書",pinyin:"shū",input:"shu"}, {char:"友",pinyin:"yǒu",input:"you"}, {char:"朋",pinyin:"péng",input:"peng"}, {char:"客",pinyin:"kè",input:"ke"},
  {char:"服",pinyin:"fú",input:"fu"}, {char:"花",pinyin:"huā",input:"hua"}, {char:"火",pinyin:"huǒ",input:"huo"}, {char:"石",pinyin:"shí",input:"shi"}, {char:"馬",pinyin:"mǎ",input:"ma"},
  {char:"鳥",pinyin:"niǎo",input:"niao"}, {char:"魚",pinyin:"yú",input:"yu"}, {char:"草",pinyin:"cǎo",input:"cao"}, {char:"雨",pinyin:"yǔ",input:"yu"}, {char:"雪",pinyin:"xuě",input:"xue"},
  {char:"黑",pinyin:"hēi",input:"hei"}, {char:"紅",pinyin:"hóng",input:"hong"}, {char:"綠",pinyin:"lǜ",input:"lv"}, {char:"藍",pinyin:"lán",input:"lan"}, {char:"黃",pinyin:"huáng",input:"huang"},
  {char:"春",pinyin:"chūn",input:"chun"}, {char:"夏",pinyin:"xià",input:"xia"}, {char:"秋",pinyin:"qiū",input:"qiu"}, {char:"冬",pinyin:"dōng",input:"dong"}, {char:"早",pinyin:"zǎo",input:"zao"},
  {char:"晚",pinyin:"wǎn",input:"wan"}, {char:"快",pinyin:"kuài",input:"kuai"}, {char:"慢",pinyin:"màn",input:"man"}, {char:"新",pinyin:"xīn",input:"xin"}, {char:"舊",pinyin:"jiù",input:"jiu"},
  {char:"冷",pinyin:"lěng",input:"leng"}, {char:"熱",pinyin:"rè",input:"re"}, {char:"男",pinyin:"nán",input:"nan"}, {char:"兒",pinyin:"ér",input:"er"}, {char:"父",pinyin:"fù",input:"fu"},
  {char:"母",pinyin:"mǔ",input:"mu"}, {char:"哥",pinyin:"gē",input:"ge"}, {char:"弟",pinyin:"dì",input:"di"}, {char:"姐",pinyin:"jiě",input:"jie"}, {char:"妹",pinyin:"mèi",input:"mei"},
  {char:"吃",pinyin:"chī",input:"chi"}, {char:"喝",pinyin:"hē",input:"he"}, {char:"玩",pinyin:"wán",input:"wan"}, {char:"買",pinyin:"mǎi",input:"mai"}, {char:"賣",pinyin:"mài",input:"mai"},
  {char:"歌",pinyin:"gē",input:"ge"}, {char:"唱",pinyin:"chàng",input:"chang"}, {char:"跳",pinyin:"tiào",input:"tiao"}, {char:"跑",pinyin:"pǎo",input:"pao"}, {char:"坐",pinyin:"zuò",input:"zuo"},
  {char:"站",pinyin:"zhàn",input:"zhan"}, {char:"睡",pinyin:"shuì",input:"shui"}, {char:"聽",pinyin:"tīng",input:"ting"}, {char:"讀",pinyin:"dú",input:"du"}, {char:"幫",pinyin:"bāng",input:"bang"},
  {char:"助",pinyin:"zhù",input:"zhu"}, {char:"希",pinyin:"xī",input:"xi"}, {char:"望",pinyin:"wàng",input:"wang"}, {char:"願",pinyin:"yuàn",input:"yuan"}, {char:"喜",pinyin:"xǐ",input:"xi"},
  {char:"歡",pinyin:"huān",input:"huan"}, {char:"樂",pinyin:"lè",input:"le"}, {char:"苦",pinyin:"kǔ",input:"ku"}, {char:"甜",pinyin:"tián",input:"tian"}, {char:"酸",pinyin:"suān",input:"suan"},
  {char:"辣",pinyin:"là",input:"la"}, {char:"香",pinyin:"xiāng",input:"xiang"}, {char:"臭",pinyin:"chòu",input:"chou"}, {char:"遠",pinyin:"yuǎn",input:"yuan"}, {char:"近",pinyin:"jìn",input:"jin"},
  {char:"深",pinyin:"shēn",input:"shen"}, {char:"淺",pinyin:"qiǎn",input:"qian"}, {char:"輕",pinyin:"qīng",input:"qing"}, {char:"寬",pinyin:"kuān",input:"kuan"}, {char:"窄",pinyin:"zhǎi",input:"zhai"},
  {char:"厚",pinyin:"hòu",input:"hou"}, {char:"薄",pinyin:"báo",input:"bao"}, {char:"圓",pinyin:"yuán",input:"yuan"}, {char:"短",pinyin:"duǎn",input:"duan"}, {char:"低",pinyin:"dī",input:"di"},
  {char:"左",pinyin:"zuǒ",input:"zuo"}, {char:"右",pinyin:"yòu",input:"you"}, {char:"裡",pinyin:"lǐ",input:"li"}, {char:"頂",pinyin:"dǐng",input:"ding"}, {char:"底",pinyin:"dǐ",input:"di"},
  {char:"東",pinyin:"dōng",input:"dong"}, {char:"南",pinyin:"nán",input:"nan"}, {char:"西",pinyin:"xī",input:"xi"}, {char:"北",pinyin:"běi",input:"bei"}, {char:"星",pinyin:"xīng",input:"xing"},
  {char:"雲",pinyin:"yún",input:"yun"}, {char:"雷",pinyin:"léi",input:"lei"}, {char:"閃",pinyin:"shǎn",input:"shan"}, {char:"河",pinyin:"hé",input:"he"}, {char:"江",pinyin:"jiāng",input:"jiang"},
  {char:"湖",pinyin:"hú",input:"hu"}, {char:"洋",pinyin:"yáng",input:"yang"}, {char:"土",pinyin:"tǔ",input:"tu"}, {char:"沙",pinyin:"shā",input:"sha"}, {char:"林",pinyin:"lín",input:"lin"},
  {char:"森",pinyin:"sēn",input:"sen"}, {char:"樹",pinyin:"shù",input:"shu"}, {char:"葉",pinyin:"yè",input:"ye"}, {char:"枝",pinyin:"zhī",input:"zhi"}, {char:"根",pinyin:"gēn",input:"gen"},
  {char:"苗",pinyin:"miáo",input:"miao"}, {char:"園",pinyin:"yuán",input:"yuan"}, {char:"田",pinyin:"tián",input:"tian"}, {char:"野",pinyin:"yě",input:"ye"}, {char:"村",pinyin:"cūn",input:"cun"},
  {char:"鎮",pinyin:"zhèn",input:"zhen"}, {char:"城",pinyin:"chéng",input:"cheng"}, {char:"鄉",pinyin:"xiāng",input:"xiang"}, {char:"橋",pinyin:"qiáo",input:"qiao"}, {char:"房",pinyin:"fáng",input:"fang"},
  {char:"屋",pinyin:"wū",input:"wu"}, {char:"室",pinyin:"shì",input:"shi"}, {char:"院",pinyin:"yuàn",input:"yuan"}, {char:"樓",pinyin:"lóu",input:"lou"}, {char:"館",pinyin:"guǎn",input:"guan"},
  {char:"堂",pinyin:"táng",input:"tang"}, {char:"床",pinyin:"chuáng",input:"chuang"}, {char:"桌",pinyin:"zhuō",input:"zhuo"}, {char:"椅",pinyin:"yǐ",input:"yi"}, {char:"燈",pinyin:"dēng",input:"deng"},
  {char:"鐘",pinyin:"zhōng",input:"zhong"}, {char:"鏡",pinyin:"jìng",input:"jing"}, {char:"筆",pinyin:"bǐ",input:"bi"}, {char:"紙",pinyin:"zhǐ",input:"zhi"}, {char:"墨",pinyin:"mò",input:"mo"},
  {char:"硯",pinyin:"yàn",input:"yan"}, {char:"包",pinyin:"bāo",input:"bao"}, {char:"箱",pinyin:"xiāng",input:"xiang"}, {char:"袋",pinyin:"dài",input:"dai"}, {char:"瓶",pinyin:"píng",input:"ping"},
  {char:"杯",pinyin:"bēi",input:"bei"}, {char:"盤",pinyin:"pán",input:"pan"}, {char:"碗",pinyin:"wǎn",input:"wan"}, {char:"筷",pinyin:"kuài",input:"kuai"}, {char:"勺",pinyin:"sháo",input:"shao"},
  {char:"刀",pinyin:"dāo",input:"dao"}, {char:"叉",pinyin:"chā",input:"cha"}, {char:"鍋",pinyin:"guō",input:"guo"}, {char:"盆",pinyin:"pén",input:"pen"}, {char:"桶",pinyin:"tǒng",input:"tong"},
  {char:"繩",pinyin:"shéng",input:"sheng"}, {char:"針",pinyin:"zhēn",input:"zhen"}, {char:"布",pinyin:"bù",input:"bu"}, {char:"衣",pinyin:"yī",input:"yi"}, {char:"褲",pinyin:"kù",input:"ku"},
  {char:"鞋",pinyin:"xié",input:"xie"}, {char:"帽",pinyin:"mào",input:"mao"}, {char:"襪",pinyin:"wà",input:"wa"}, {char:"巾",pinyin:"jīn",input:"jin"}, {char:"傘",pinyin:"sǎn",input:"san"},
  {char:"扇",pinyin:"shàn",input:"shan"}, {char:"球",pinyin:"qiú",input:"qiu"}, {char:"棋",pinyin:"qí",input:"qi"}, {char:"牌",pinyin:"pái",input:"pai"}, {char:"琴",pinyin:"qín",input:"qin"},
  {char:"畫",pinyin:"huà",input:"hua"}, {char:"詩",pinyin:"shī",input:"shi"}, {char:"詞",pinyin:"cí",input:"ci"}, {char:"曲",pinyin:"qǔ",input:"qu"}, {char:"篇",pinyin:"piān",input:"pian"},
  {char:"章",pinyin:"zhāng",input:"zhang"}, {char:"頁",pinyin:"yè",input:"ye"}, {char:"冊",pinyin:"cè",input:"ce"}, {char:"首",pinyin:"shǒu",input:"shou"}, {char:"尾",pinyin:"wěi",input:"wei"},
  {char:"臉",pinyin:"liǎn",input:"lian"}, {char:"眼",pinyin:"yǎn",input:"yan"}, {char:"耳",pinyin:"ěr",input:"er"}, {char:"鼻",pinyin:"bí",input:"bi"}, {char:"口",pinyin:"kǒu",input:"kou"},
  {char:"牙",pinyin:"yá",input:"ya"}, {char:"舌",pinyin:"shé",input:"she"}, {char:"唇",pinyin:"chún",input:"chun"}, {char:"眉",pinyin:"méi",input:"mei"}, {char:"髮",pinyin:"fà",input:"fa"},
  {char:"頸",pinyin:"jǐng",input:"jing"}, {char:"胸",pinyin:"xiōng",input:"xiong"}, {char:"腹",pinyin:"fù",input:"fu"}, {char:"腰",pinyin:"yāo",input:"yao"}, {char:"背",pinyin:"bèi",input:"bei"},
  {char:"骨",pinyin:"gǔ",input:"gu"}, {char:"肉",pinyin:"ròu",input:"rou"}, {char:"血",pinyin:"xuè",input:"xue"}, {char:"皮",pinyin:"pí",input:"pi"}, {char:"腳",pinyin:"jiǎo",input:"jiao"},
  {char:"指",pinyin:"zhǐ",input:"zhi"}, {char:"甲",pinyin:"jiǎ",input:"jia"}, {char:"腿",pinyin:"tuǐ",input:"tui"}, {char:"膝",pinyin:"xī",input:"xi"}, {char:"肩",pinyin:"jiān",input:"jian"},
  {char:"腕",pinyin:"wàn",input:"wan"}, {char:"肘",pinyin:"zhǒu",input:"zhou"}, {char:"掌",pinyin:"zhǎng",input:"zhang"}, {char:"肝",pinyin:"gān",input:"gan"}, {char:"膽",pinyin:"dǎn",input:"dan"},
  {char:"胃",pinyin:"wèi",input:"wei"}, {char:"腸",pinyin:"cháng",input:"chang"}, {char:"腦",pinyin:"nǎo",input:"nao"}, {char:"牛",pinyin:"niú",input:"niu"}, {char:"羊",pinyin:"yáng",input:"yang"},
  {char:"豬",pinyin:"zhū",input:"zhu"}, {char:"狗",pinyin:"gǒu",input:"gou"}, {char:"貓",pinyin:"māo",input:"mao"}, {char:"雞",pinyin:"jī",input:"ji"}, {char:"鴨",pinyin:"yā",input:"ya"},
  {char:"鵝",pinyin:"é",input:"e"}, {char:"兔",pinyin:"tù",input:"tu"}, {char:"鼠",pinyin:"shǔ",input:"shu"}, {char:"虎",pinyin:"hǔ",input:"hu"}, {char:"獅",pinyin:"shī",input:"shi"},
  {char:"象",pinyin:"xiàng",input:"xiang"}, {char:"熊",pinyin:"xióng",input:"xiong"}, {char:"狼",pinyin:"láng",input:"lang"}, {char:"鹿",pinyin:"lù",input:"lu"}, {char:"猴",pinyin:"hóu",input:"hou"},
  {char:"蛇",pinyin:"shé",input:"she"}, {char:"龜",pinyin:"guī",input:"gui"}, {char:"龍",pinyin:"lóng",input:"long"}, {char:"鳳",pinyin:"fèng",input:"feng"}, {char:"鷹",pinyin:"yīng",input:"ying"},
  {char:"蝶",pinyin:"dié",input:"die"}, {char:"蜂",pinyin:"fēng",input:"feng"}, {char:"蟻",pinyin:"yǐ",input:"yi"}, {char:"茶",pinyin:"chá",input:"cha"}, {char:"酒",pinyin:"jiǔ",input:"jiu"},
  {char:"飯",pinyin:"fàn",input:"fan"}, {char:"菜",pinyin:"cài",input:"cai"}, {char:"蛋",pinyin:"dàn",input:"dan"}, {char:"糖",pinyin:"táng",input:"tang"}, {char:"鹽",pinyin:"yán",input:"yan"},
  {char:"油",pinyin:"yóu",input:"you"}, {char:"醋",pinyin:"cù",input:"cu"}, {char:"醬",pinyin:"jiàng",input:"jiang"}, {char:"銀",pinyin:"yín",input:"yin"}, {char:"銅",pinyin:"tóng",input:"tong"}
];

// ── Chinese "unit" helpers (used by article mode & the built-in chinese list) ──
// A "unit" is one hanzi to type, plus any trailing punctuation glued onto its
// display text, its toned pinyin (for reading) and its toneless typing target.
function isHanzi(ch) {
  return /[\u4e00-\u9fff]/.test(ch);
}

function normalizePinyinInput(s) {
  return (s || '').replace(/ü/g, 'v').toLowerCase();
}

// Build {word, units, char, pinyin} from any Chinese text (a character, a word,
// an idiom, or a whole punctuated sentence) using the pinyin-pro library.
function buildChineseUnits(text) {
  if (!text || !window.pinyinPro) return null;
  let tonedArr, plainArr;
  try {
    tonedArr = window.pinyinPro.pinyin(text, { type: 'array', toneType: 'symbol' });
    plainArr = window.pinyinPro.pinyin(text, { type: 'array', toneType: 'none' });
  } catch (e) {
    return null;
  }
  const chars = text.split('');
  const units = [];
  let cumulative = 0;
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (isHanzi(ch)) {
      const toned = (tonedArr && tonedArr[i]) || ch;
      const plain = normalizePinyinInput((plainArr && plainArr[i]) || '');
      cumulative += plain.length;
      units.push({ display: ch, pinyin: toned, input: plain, boundary: cumulative });
    } else if (units.length > 0) {
      // Punctuation / whitespace: glue onto the previous hanzi's display text
      // so it's visible without needing to be typed separately.
      units[units.length - 1].display += ch;
    }
    // Leading punctuation before any hanzi is simply dropped.
  }
  if (units.length === 0) return null;
  // Reject if any character's pinyin couldn't be resolved to plain a-z letters
  // (very rare/variant characters) — better to skip it than spawn an
  // impossible-to-type zombie.
  if (units.some(u => !/^[a-z]+$/.test(u.input))) return null;
  const word = units.map(u => u.input).join('');
  return {
    word,
    units,
    isChinese: true,
    char: units.length === 1 ? units[0].display : null,
    pinyin: units.length === 1 ? units[0].pinyin : null,
  };
}

// Build the Easy / Medium / Hard word pools for "中文-文章" mode from the
// selected articles. Runs once per article selection (see _startGame).
function buildArticlePools(articles) {
  const pools = { Easy: [], Medium: [], Hard: [] };
  if (!articles || !articles.length || !window.pinyinPro) return pools;

  // ── Easy：從文章中隨機抽出單字 ──
  const charSet = new Set();
  articles.forEach(a => {
    for (const ch of a.content) {
      if (isHanzi(ch)) charSet.add(ch);
    }
  });
  charSet.forEach(ch => {
    const item = buildChineseUnits(ch);
    if (item) pools.Easy.push(item);
  });

  // ── Medium：從文章中隨機截出 3-5 個連續中文字的片段（詞/成語風格）──
  // 說明：pinyin-pro 內建的 segment() 沒有載入完整辭典時，幾乎每個字都會被
  // 拆成單獨一個詞，切不出真正的詞語，所以這裡改成直接從文章的連續中文字
  // 中隨機挑出 3～5 字的片段，不跨越標點符號。文章篇數/字數多時片段數量會
  // 爆增，所以設一個上限（600個），抽夠了就停止，避免遊戲載入變慢。
  const seenWords = new Set();
  const MEDIUM_CAP = 600;
  outerMedium:
  for (const a of articles) {
    const runs = (a.content.match(/[\u4e00-\u9fff]+/g) || []).filter(r => r.length >= 3);
    for (const run of runs) {
      const attempts = Math.min(15, run.length);
      for (let i = 0; i < attempts; i++) {
        if (pools.Medium.length >= MEDIUM_CAP) break outerMedium;
        const maxLen = Math.min(5, run.length);
        const len = Math.floor(Math.random() * (maxLen - 2)) + 3; // 3~5字（片段不夠5字就用片段本身長度）
        const start = Math.floor(Math.random() * (run.length - len + 1));
        const chunk = run.slice(start, start + len);
        if (chunk.length >= 3 && !seenWords.has(chunk)) {
          seenWords.add(chunk);
          const item = buildChineseUnits(chunk);
          if (item) pools.Medium.push(item);
        }
      }
    }
  }

  // ── Hard：完整句子，至少10個字，含標點符號 ──
  // 如果單一句子（用 。！？； 斷句）不到10個字，就跟下一句合併，
  // 直到湊滿至少10個中文字為止，確保每篇文章都能產生 Hard 題目。
  const seenSentences = new Set();
  articles.forEach(a => {
    const raw = a.content.replace(/\r?\n/g, '');
    const sentences = raw.split(/(?<=[。！？；])/).map(s => s.trim()).filter(Boolean);
    let buffer = '';
    let bufferHanzi = 0;
    sentences.forEach(s => {
      buffer += s;
      bufferHanzi += (s.match(/[\u4e00-\u9fff]/g) || []).length;
      if (bufferHanzi >= 10) {
        if (!seenSentences.has(buffer)) {
          seenSentences.add(buffer);
          const item = buildChineseUnits(buffer);
          if (item) pools.Hard.push(item);
        }
        buffer = '';
        bufferHanzi = 0;
      }
    });
    // 文章結尾殘句不足10字就直接捨棄，避免出現太短的 Hard 題目
  });

  return pools;
}

// ── 上傳的 .txt 文章自動判斷編碼 ──
// 很多老師電腦裡的舊 .txt 檔案其實是「Big5」編碼（Windows 繁體中文的舊格式），
// 不是 UTF-8。如果整篇檔案硬要用 UTF-8 解碼，中文字會整段變亂碼，導致遊戲抽
// 不出正確的中文字/詞/句子。這裡先嘗試「嚴格」UTF-8 解碼，失敗（代表不是合
// 法的 UTF-8 內容）就改用 Big5 解碼；兩種都失敗才退回寬鬆 UTF-8，至少不會整
// 個掛掉。
function decodeArticleText(arrayBuffer) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(arrayBuffer);
  } catch (e) {
    try {
      return new TextDecoder('big5').decode(arrayBuffer);
    } catch (e2) {
      try {
        return new TextDecoder('utf-8').decode(arrayBuffer);
      } catch (e3) {
        return '';
      }
    }
  }
}

// ── Article Manager: 上傳、儲存、勾選「中文-文章」模式的題庫文章 ──
class ArticleManager {
  constructor() {
    this.articles = [];      // [{id, title, content}]
    this.selectedIds = [];   // ids currently checked
    this._loadFromStorage();
    this._seedBuiltinArticles();
  }

  // 自動把內建的題庫文章（articles-data.js）補進文章清單裡，並確保是最新內容、
  // 已經勾選。用「固定的 id」判斷每一篇內建文章存不存在，所以：
  // - 瀏覽器裡完全沒存過文章 → 全部補進來
  // - 瀏覽器裡已經有舊資料（例如之前版本編碼判斷錯誤存下來的亂碼內容）
  //   → 一樣會把內建文章用正確內容補上/更新，不會被舊資料卡住
  // 老師自己額外上傳、或刪除「非內建」文章的狀態，都不會被這裡影響。
  _seedBuiltinArticles() {
    const builtin = window.BUILTIN_ARTICLES;
    if (!Array.isArray(builtin) || builtin.length === 0) return;
    let changed = false;
    builtin.forEach(a => {
      const content = String(a.content || '').trim();
      if (!content) return;
      const id = 'art_builtin_' + a.title;
      const existing = this.articles.find(x => x.id === id);
      if (existing) {
        if (existing.content !== content) { existing.content = content; changed = true; }
      } else {
        this.articles.push({ id, title: a.title, content });
        changed = true;
      }
      if (!this.selectedIds.includes(id)) {
        this.selectedIds.push(id);
        changed = true;
      }
    });
    if (changed) this._save();
  }

  _loadFromStorage() {
    try {
      const raw = localStorage.getItem('zombieTyping_articles');
      this.articles = raw ? JSON.parse(raw) : [];
    } catch (e) { this.articles = []; }
    try {
      const rawSel = localStorage.getItem('zombieTyping_articleSelection');
      this.selectedIds = rawSel ? JSON.parse(rawSel) : this.articles.map(a => a.id);
    } catch (e) { this.selectedIds = this.articles.map(a => a.id); }
  }

  _save() {
    try {
      localStorage.setItem('zombieTyping_articles', JSON.stringify(this.articles));
      localStorage.setItem('zombieTyping_articleSelection', JSON.stringify(this.selectedIds));
    } catch (e) { /* storage full or unavailable — silently ignore */ }
  }

  handleFiles(fileList) {
    const files = Array.from(fileList || []).filter(f => /\.txt$/i.test(f.name));
    if (files.length === 0) return;
    let remaining = files.length;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const content = decodeArticleText(reader.result).trim();
        if (content) {
          const title = file.name.replace(/\.txt$/i, '');
          const id = 'art_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
          this.articles.push({ id, title, content });
          this.selectedIds.push(id);
        }
        remaining--;
        if (remaining === 0) {
          this._save();
          this.renderList();
        }
      };
      // 用 ArrayBuffer 讀取，讓 decodeArticleText() 自己判斷是 UTF-8 還是 Big5，
      // 不要寫死用 UTF-8（很多老師的舊 .txt 檔其實是 Big5 編碼，強制當 UTF-8
      // 讀會整篇變成亂碼，導致抽不出正確的中文字/詞/句子）。
      reader.readAsArrayBuffer(file);
    });
  }

  removeArticle(id) {
    this.articles = this.articles.filter(a => a.id !== id);
    this.selectedIds = this.selectedIds.filter(x => x !== id);
    this._save();
    this.renderList();
  }

  toggleSelected(id, checked) {
    if (checked && !this.selectedIds.includes(id)) this.selectedIds.push(id);
    if (!checked) this.selectedIds = this.selectedIds.filter(x => x !== id);
    this._save();
    this.renderList();
  }

  selectAll() {
    this.selectedIds = this.articles.map(a => a.id);
    this._save();
    this.renderList();
  }

  selectNone() {
    this.selectedIds = [];
    this._save();
    this.renderList();
  }

  getSelectedArticles() {
    return this.articles.filter(a => this.selectedIds.includes(a.id));
  }

  renderList() {
    const listEl = document.getElementById('articlesList');
    const countEl = document.getElementById('articleSelectedCount');
    if (countEl) countEl.textContent = `已選 ${this.selectedIds.length} 篇`;
    if (!listEl) return;
    if (this.articles.length === 0) {
      listEl.innerHTML = '<p class="article-empty" id="articleEmptyMsg">尚未上傳任何文章，請點上方「上傳 TXT 文章」。</p>';
      return;
    }
    listEl.innerHTML = '';
    this.articles.forEach(a => {
      const row = document.createElement('div');
      row.className = 'article-item';
      const checked = this.selectedIds.includes(a.id) ? 'checked' : '';
      row.innerHTML = `
        <input type="checkbox" ${checked} data-id="${a.id}">
        <div class="article-item-info">
          <div class="article-item-title">${a.title}</div>
          <div class="article-item-meta">約 ${a.content.length} 字</div>
        </div>
        <button class="article-item-delete" data-id="${a.id}" title="刪除">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>`;
      row.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
        this.toggleSelected(a.id, e.target.checked);
      });
      row.querySelector('.article-item-delete').addEventListener('click', () => {
        this.removeArticle(a.id);
      });
      listEl.appendChild(row);
    });
  }
}

function getWordForCategory(category, difficulty = 'Medium', extra = {}) {
  if (category === 'chinese_article') {
    const pools = extra.articlePools || {};
    const pool = pools[difficulty];
    if (!pool || pool.length === 0) {
      // Fallback so the game never breaks if the article text was too short
      return getWordForCategory('chinese', difficulty);
    }
    return pool[Math.floor(Math.random() * pool.length)];
  } else if (category === 'chinese') {
    let poolSize = 200;
    if (difficulty === 'Easy') poolSize = 50;
    else if (difficulty === 'Hard') poolSize = 500;
    const pool = CHINESE_CHARACTERS.slice(0, poolSize);
    const item = pool[Math.floor(Math.random() * pool.length)];
    return {
      word: item.input,
      char: item.char,
      pinyin: item.pinyin,
      units: [{ display: item.char, pinyin: item.pinyin, input: item.input, boundary: item.input.length }],
      isChinese: true,
    };
  } else if (category === 'hard_words') {
    const pool = WORD_LIST.filter(w => w.length >= 6 && w.length <= 10);
    return { word: pool[Math.floor(Math.random() * pool.length)], isChinese: false };
  } else if (category === 'easy_words') {
    const pool = WORD_LIST.filter(w => w.length >= 2 && w.length <= 5);
    return { word: pool[Math.floor(Math.random() * pool.length)], isChinese: false };
  } else {
    let chars = 'abcdefghijklmnopqrstuvwxyz';
    if (ROW_KEYBOARD_CHARS[category]) chars = ROW_KEYBOARD_CHARS[category];
    const len = Math.floor(Math.random() * 4) + 3;
    let result = '';
    for (let i = 0; i < len; i++) result += chars[Math.floor(Math.random() * chars.length)];
    return { word: result, isChinese: false };
  }
}

// ── Sound Engine (Web Audio API) ─────────────────────────────
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.musicEnabled = true;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  _play(freq, type, dur, vol = 0.15) {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + dur);
    } catch (e) { /* silent */ }
  }

  hit()       { this._play(520, 'square', 0.08, 0.08); }
  error()     { this._play(120, 'sawtooth', 0.18, 0.12); }
  kill()      {
    this._play(800, 'sine', 0.12, 0.15);
    setTimeout(() => this._play(1200, 'sine', 0.1, 0.1), 60);
  }
  explosion() {
    this._play(80, 'square', 0.4, 0.2);
    this._play(60, 'sawtooth', 0.5, 0.15);
  }
  freeze()    {
    this._play(1400, 'sine', 0.3, 0.08);
    setTimeout(() => this._play(1800, 'sine', 0.4, 0.06), 100);
  }
  powerup()   {
    this._play(600, 'triangle', 0.15, 0.12);
    setTimeout(() => this._play(900, 'triangle', 0.15, 0.1), 80);
    setTimeout(() => this._play(1200, 'triangle', 0.2, 0.08), 160);
  }
  menuClick() { this._play(440, 'triangle', 0.08, 0.06); }
}

// ── Sprite Manager ───────────────────────────────────────────
class SpriteManager {
  constructor() {
    this.customSprites = {};
    this.defaultCanvases = {};
    this.defaultImages = {};
    this._generateAllDefaults();
    this._loadFromStorage();
  }

  _generateAllDefaults() {
    this.defaultCanvases.player = this._createSprite(64, 64, (ctx) => {
      // Skin
      ctx.fillStyle = '#ffcc99';
      ctx.beginPath(); ctx.arc(32, 16, 11, 0, Math.PI * 2); ctx.fill();
      // Eyes
      ctx.fillStyle = '#333';
      ctx.fillRect(28, 13, 3, 4);
      ctx.fillRect(35, 13, 3, 4);
      // Hair
      ctx.fillStyle = '#553311';
      ctx.fillRect(21, 5, 22, 8);
      ctx.fillRect(21, 5, 4, 14);
      // Shirt
      ctx.fillStyle = '#e63946';
      ctx.fillRect(22, 27, 20, 18);
      // Arms
      ctx.fillStyle = '#e63946';
      ctx.fillRect(42, 27, 14, 7);
      ctx.fillRect(12, 27, 10, 7);
      // Hands
      ctx.fillStyle = '#ffcc99';
      ctx.fillRect(54, 27, 6, 6);
      ctx.fillRect(8, 27, 6, 6);
      // Gun
      ctx.fillStyle = '#555';
      ctx.fillRect(52, 29, 12, 4);
      ctx.fillStyle = '#333';
      ctx.fillRect(58, 26, 6, 3);
      // Pants
      ctx.fillStyle = '#457b9d';
      ctx.fillRect(22, 45, 8, 14);
      ctx.fillRect(34, 45, 8, 14);
      // Shoes
      ctx.fillStyle = '#333';
      ctx.fillRect(20, 57, 12, 5);
      ctx.fillRect(32, 57, 12, 5);
    });

    const zombieConfigs = [
      { body: '#4a7c59', skin: '#6b9b5a', name: 'Classic' },
      { body: '#5c4b8a', skin: '#7b6aaa', name: 'Shadow' },
      { body: '#8a3b3b', skin: '#aa5b5b', name: 'Blood' },
      { body: '#8a7b2b', skin: '#aaa44b', name: 'Decay' },
      { body: '#4a4a5a', skin: '#6a6a7a', name: 'Iron' },
    ];

    zombieConfigs.forEach((cfg, i) => {
      this.defaultCanvases['zombie' + (i + 1)] = this._createSprite(64, 64, (ctx) => {
        // Head
        ctx.fillStyle = cfg.skin;
        ctx.beginPath(); ctx.arc(32, 14, 12, 0, Math.PI * 2); ctx.fill();
        // Eyes
        ctx.fillStyle = '#ff0';
        ctx.fillRect(27, 11, 4, 5);
        ctx.fillRect(35, 11, 4, 5);
        ctx.fillStyle = '#900';
        ctx.fillRect(28, 12, 2, 3);
        ctx.fillRect(36, 12, 2, 3);
        // Mouth
        ctx.fillStyle = '#300';
        ctx.fillRect(28, 21, 8, 3);
        // Body
        ctx.fillStyle = cfg.body;
        ctx.fillRect(20, 26, 24, 22);
        // Torn shirt detail
        ctx.fillStyle = cfg.skin;
        ctx.fillRect(20, 44, 24, 4);
        // Arms
        ctx.fillStyle = cfg.skin;
        ctx.fillRect(8, 28, 12, 6);
        ctx.fillRect(44, 26, 14, 6);
        // Extended arm (reaching)
        ctx.fillStyle = cfg.skin;
        ctx.fillRect(54, 24, 8, 5);
        // Legs
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(22, 48, 8, 12);
        ctx.fillRect(34, 48, 8, 12);
        // Feet
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(20, 58, 12, 5);
        ctx.fillRect(32, 58, 12, 5);
      });
    });

    // Convert canvases to images
    for (const key in this.defaultCanvases) {
      const img = new Image();
      img.src = this.defaultCanvases[key].toDataURL();
      this.defaultImages[key] = img;
    }
  }

  _createSprite(w, h, drawFn) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    drawFn(c.getContext('2d'));
    return c;
  }

  getSprite(type) {
    return this.customSprites[type] || this.defaultImages[type];
  }

  getDefaultCanvas(type) {
    return this.defaultCanvases[type];
  }

  setCustom(type, dataUrl) {
    const img = new Image();
    img.onload = () => {
      this.customSprites[type] = img;
      this._saveToStorage();
      this.updatePreviews();
    };
    img.src = dataUrl;
  }

  resetCustom(type) {
    delete this.customSprites[type];
    this._saveToStorage();
    this.updatePreviews();
  }

  _saveToStorage() {
    const data = {};
    for (const key in this.customSprites) {
      if (this.customSprites[key]) {
        // Convert to data URL from image
        const c = document.createElement('canvas');
        c.width = this.customSprites[key].naturalWidth || this.customSprites[key].width;
        c.height = this.customSprites[key].naturalHeight || this.customSprites[key].height;
        c.getContext('2d').drawImage(this.customSprites[key], 0, 0);
        data[key] = c.toDataURL();
      }
    }
    try { localStorage.setItem('tommyq_sprites', JSON.stringify(data)); } catch(e) {}
  }

  _loadFromStorage() {
    try {
      const raw = localStorage.getItem('tommyq_sprites');
      if (!raw) return;
      const data = JSON.parse(raw);
      for (const key in data) {
        if (data[key]) {
          const img = new Image();
          img.src = data[key];
          this.customSprites[key] = img;
        }
      }
    } catch(e) {}
  }

  exportAll() {
    const data = {};
    const types = ['player','zombie1','zombie2','zombie3','zombie4','zombie5'];
    types.forEach(t => {
      const spr = this.customSprites[t] || this.defaultImages[t];
      if (spr) {
        const c = document.createElement('canvas');
        c.width = spr.naturalWidth || spr.width || 64;
        c.height = spr.naturalHeight || spr.height || 64;
        c.getContext('2d').drawImage(spr, 0, 0);
        data[t] = c.toDataURL();
      }
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tommyq_sprites.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  importAll(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        for (const key in data) {
          if (data[key] && ['player','zombie1','zombie2','zombie3','zombie4','zombie5'].includes(key)) {
            const img = new Image();
            img.onload = () => {
              this.customSprites[key] = img;
              this._saveToStorage();
              this.updatePreviews();
            };
            img.src = data[key];
          }
        }
      } catch(err) { console.error('Import failed:', err); }
    };
    reader.readAsText(file);
  }

  downloadSprite(type) {
    const spr = this.customSprites[type] || this.defaultImages[type];
    if (!spr) return;
    const c = document.createElement('canvas');
    c.width = spr.naturalWidth || spr.width || 64;
    c.height = spr.naturalHeight || spr.height || 64;
    c.getContext('2d').drawImage(spr, 0, 0);
    const a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = `tommyq_${type}.png`;
    a.click();
  }

  updatePreviews() {
    const types = ['player','zombie1','zombie2','zombie3','zombie4','zombie5'];
    types.forEach(type => {
      const container = document.getElementById('preview-' + type);
      if (!container) return;
      container.innerHTML = '';
      const spr = this.getSprite(type);
      if (spr) {
        const img = document.createElement('img');
        img.src = spr.src || spr.toDataURL?.() || '';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.imageRendering = 'pixelated';
        container.appendChild(img);
      }
    });
  }

  connectUI() {
    const types = ['player','zombie1','zombie2','zombie3','zombie4','zombie5'];

    // Upload buttons
    document.querySelectorAll('.upload-sprite').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        const input = document.getElementById('upload-' + target);
        if (input) input.click();
      });
    });

    // File inputs
    types.forEach(type => {
      const input = document.getElementById('upload-' + type);
      if (input) {
        input.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => this.setCustom(type, ev.target.result);
          reader.readAsDataURL(file);
          e.target.value = '';
        });
      }
    });

    // Download buttons
    document.querySelectorAll('.download-sprite').forEach(btn => {
      btn.addEventListener('click', () => {
        this.downloadSprite(btn.getAttribute('data-target'));
      });
    });

    // Reset buttons
    document.querySelectorAll('.reset-sprite').forEach(btn => {
      btn.addEventListener('click', () => {
        this.resetCustom(btn.getAttribute('data-target'));
      });
    });

    // Export All
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) exportBtn.addEventListener('click', () => this.exportAll());

    // Import
    const importBtn = document.getElementById('importBtn');
    const importInput = document.getElementById('importInput');
    if (importBtn && importInput) {
      importBtn.addEventListener('click', () => importInput.click());
      importInput.addEventListener('change', (e) => {
        if (e.target.files[0]) this.importAll(e.target.files[0]);
        e.target.value = '';
      });
    }

    // Initial preview
    setTimeout(() => this.updatePreviews(), 200);
  }
}

// ── Constants ────────────────────────────────────────────────
const W = 916, H = 500;
const LANE_COUNT = 5;
const LANE_Y = (lane) => 120 + (lane - 1) * 72;
const BARRICADE_LEFT_X = 200;
const BARRICADE_RIGHT_X = 716;
const DIFFICULTY_DELAYS = { Easy: 7000, Medium: 5500, Hard: 2650 };
// HOME ROW / TOP ROW / BOTTOM ROW 提示小鍵盤：每個分類對應要顯示（也用來出題）
// 的那一排按鍵，含該排鍵盤上實際會用到的標點符號：
//   Home row：a s d f g h j k l ;
//   Top row ：q w e r t y u i o p [ ]
//   Bottom row：z x c v b n m , . /
const ROW_KEYBOARD_CHARS = {
  home_row: 'asdfghjkl;',
  top_row: 'qwertyuiop[]',
  bottom_row: 'zxcvbnm,./',
};
// 關閉小鍵盤時的加碼分數倍率（沒有提示，難度變高，分數多給一點作為獎勵）
const KB_HIDDEN_SCORE_BONUS = 1.3;

// ── Game ─────────────────────────────────────────────────────
class TommyQGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.width = W;
    canvas.height = H;

    this.sprites = new SpriteManager();
    this.sprites.connectUI();
    this.audio = new SoundEngine();

    this.state = 'MENU'; // MENU | PLAYING | PAUSED | GAME_OVER | WAVE_COMPLETE | HORDE_INTRO
    this.menuSelection = {
      difficulty: 'Medium',
      category: 'easy_words',
      difficultyIndex: 1,
      categoryIndex: 0,
    };
    this.difficulties = ['簡易版', '普通版', '挑戰版'];
    this.categories = [
      { id: 'easy_words', label: 'Easy Words' },
      { id: 'hard_words', label: 'Hard Words' },
      { id: 'home_row', label: '中列' },
      { id: 'top_row', label: '上列' },
      { id: 'bottom_row', label: '下列' },
      { id: 'chinese', label: '中文' },
      { id: 'chinese_article', label: '中文-文章' },
    ];

    // 中文-文章 mode: word pools built from the selected uploaded articles
    this.articlePools = { Easy: [], Medium: [], Hard: [] };
    this._articlePoolsKey = null;
    this.menuWarning = '';
    this.menuWarningTimer = 0;

    // Persistent state
    this.player = null;
    this.enemies = [];
    this.powerupItems = [];
    this.projectiles = [];
    this.particles = [];
    this.floatTexts = [];
    this.barricades = [];
    this.targetedEnemies = [];
    this.heldPowerup = null;
    this.frozenTimer = 0;
    this.waveTimer = 0;
    this.spawnTimer = 0;
    this.spawnDelay = 5500;
    this.waveType = 'NORMAL';
    this.overlayTimer = 0;
    this.stats = { score: 0, kills: 0, level: 1, waveScore: 0, waveKills: 0, timeStart: 0, timeAlive: 0 };
    this.zombiesSpawned = 0;
    this.menuBgZombies = [];
    this.menuTitleBounce = 0;
    this.stars = [];

    // Generate background stars
    for (let i = 0; i < 80; i++) {
      this.stars.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.5,
        size: Math.random() * 2 + 0.5,
        twinkle: Math.random() * Math.PI * 2,
        speed: Math.random() * 2 + 0.5,
      });
    }

    // Menu background zombies
    for (let i = 0; i < 8; i++) {
      this.menuBgZombies.push({
        x: Math.random() * W,
        y: LANE_Y(Math.floor(Math.random() * 5) + 1),
        type: Math.floor(Math.random() * 5) + 1,
        speed: (Math.random() * 0.3 + 0.2) * (Math.random() > 0.5 ? 1 : -1),
        bob: Math.random() * Math.PI * 2,
      });
    }

    this.lastTime = performance.now();
    this.globalTime = 0;

    // HOME ROW / TOP ROW / BOTTOM ROW 模式專用：半透明提示小鍵盤
    this.kbFlashKey = null;
    this.kbFlashTimer = 0;
    this._loadKbSettings();

    this._bindInput();
    this._loop();
  }

  // ── HOME/TOP/BOTTOM ROW 提示小鍵盤：讀取/儲存 顯示狀態與大小 ──
  _loadKbSettings() {
    try {
      const v = localStorage.getItem('zombieTyping_kbVisible');
      this.kbVisible = v === null ? true : v === '1';
    } catch (e) { this.kbVisible = true; }
    try {
      const s = localStorage.getItem('zombieTyping_kbScale');
      this.kbScale = s ? Math.min(1.6, Math.max(0.7, parseFloat(s))) : 1;
      if (!isFinite(this.kbScale)) this.kbScale = 1;
    } catch (e) { this.kbScale = 1; }
  }

  _saveKbSettings() {
    try {
      localStorage.setItem('zombieTyping_kbVisible', this.kbVisible ? '1' : '0');
      localStorage.setItem('zombieTyping_kbScale', String(this.kbScale));
    } catch (e) { /* storage unavailable — ignore */ }
  }

  // ── Input ────────────────────────────────────────────────
  _bindInput() {
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      // Toggle Pause with Escape or 'p'/'P'
      if (e.key === 'Escape') {
        if (this.state === 'PLAYING') {
          this.togglePause();
          return;
        } else if (this.state === 'PAUSED') {
          this.togglePause();
          return;
        }
      }

      if (this.state === 'MENU') {
        this._handleMenuInput(e);
      } else if (this.state === 'PLAYING') {
        this._handleGameInput(e);
      } else if (this.state === 'PAUSED') {
        if (e.key === 'Enter' || e.key === ' ') {
          this.togglePause();
        }
      } else if (this.state === 'GAME_OVER') {
        if (e.key === 'Enter' || e.key === ' ') {
          this.state = 'MENU';
          this.audio.menuClick();
        }
      }
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.audio.init();
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      this._handleClick(mx, my);
    });
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.audio.menuClick();
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.lastTime = performance.now(); // reset delta time
      this.audio.menuClick();
    }
  }

  returnToMenu() {
    this.state = 'MENU';
    this.audio.menuClick();
  }

  _flashMenuWarning(msg) {
    this.menuWarning = msg;
    this.menuWarningTimer = 2600;
    this.audio.error();
  }

  _handleMenuInput(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      this.audio.init();
      this._startGame();
    }
    if (e.key === 'ArrowLeft') {
      this.menuSelection.difficultyIndex = Math.max(0, this.menuSelection.difficultyIndex - 1);
      this.menuSelection.difficulty = this.difficulties[this.menuSelection.difficultyIndex];
      this.audio.menuClick();
    }
    if (e.key === 'ArrowRight') {
      this.menuSelection.difficultyIndex = Math.min(2, this.menuSelection.difficultyIndex + 1);
      this.menuSelection.difficulty = this.difficulties[this.menuSelection.difficultyIndex];
      this.audio.menuClick();
    }
    if (e.key === 'ArrowUp') {
      this.menuSelection.categoryIndex = Math.max(0, this.menuSelection.categoryIndex - 1);
      this.menuSelection.category = this.categories[this.menuSelection.categoryIndex].id;
      this.audio.menuClick();
    }
    if (e.key === 'ArrowDown') {
      this.menuSelection.categoryIndex = Math.min(this.categories.length - 1, this.menuSelection.categoryIndex + 1);
      this.menuSelection.category = this.categories[this.menuSelection.categoryIndex].id;
      this.audio.menuClick();
    }
  }

  _handleGameInput(e) {
    const p = this.player;
    if (!p || p.dead) return;

    if (e.key === 'ArrowUp' && p.lane > 1) {
      p.lane--;
      this.targetedEnemies = [];
    } else if (e.key === 'ArrowDown' && p.lane < 5) {
      p.lane++;
      this.targetedEnemies = [];
    } else if (e.key === 'ArrowLeft' && p.dir > 0) {
      p.dir = -1;
      this.targetedEnemies = [];
    } else if (e.key === 'ArrowRight' && p.dir < 0) {
      p.dir = 1;
      this.targetedEnemies = [];
    } else if (e.key === 'Enter') {
      if (this.menuSelection.category === 'chinese_article') {
        if (e.isComposing) return; // 輸入法選字中，先讓輸入法處理這個 Enter
        this._attemptChineseAttack();
      } else {
        this._usePowerup();
      }
    } else if (e.key.length === 1 && /[a-zA-Z0-9,.\/';\-=\[\]\\`~ !@#$%^&*()_+{}|:"<>?]/.test(e.key)) {
      // 「中文-文章」模式的文字改由 #zhTypingInput 輸入框 + 輸入法處理，
      // 這裡不要攔截字母鍵，否則輸入法沒辦法正常打字/選字。
      if (this.menuSelection.category !== 'chinese_article') {
        this._handleTyping(e.key.toLowerCase());
      }
    }
  }

  _handleClick(mx, my) {
    if (this.state === 'MENU') {
      // Play button area
      if (mx > W/2 - 110 && mx < W/2 + 110 && my > 350 && my < 400) {
        this._startGame();
        return;
      }
      // Difficulty buttons
      this.difficulties.forEach((d, i) => {
        const bx = W/2 - 150 + i * 110;
        if (mx > bx && mx < bx + 100 && my > 260 && my < 290) {
          this.menuSelection.difficultyIndex = i;
          this.menuSelection.difficulty = d;
          this.audio.menuClick();
        }
      });
      // Category buttons
      const catBtnW = 76;
      const catBtnGap = 8;
      const catTotalW = this.categories.length * catBtnW + (this.categories.length - 1) * catBtnGap;
      const catStartX = (W - catTotalW) / 2;
      this.categories.forEach((c, i) => {
        const bx = catStartX + i * (catBtnW + catBtnGap);
        if (mx > bx && mx < bx + catBtnW && my > 310 && my < 345) {
          this.menuSelection.categoryIndex = i;
          this.menuSelection.category = c.id;
          this.audio.menuClick();
        }
      });
    } else if (this.state === 'PAUSED') {
      // Resume button
      if (mx > W/2 - 130 && mx < W/2 + 130 && my > 220 && my < 265) {
        this.togglePause();
      }
      // Return to Menu button
      if (mx > W/2 - 130 && mx < W/2 + 130 && my > 280 && my < 320) {
        this.returnToMenu();
      }
    } else if (this.state === 'GAME_OVER') {
      // Play Again button
      if (mx > W/2 - 130 && mx < W/2 + 130 && my > 310 && my < 360) {
        this._startGame();
      }
      // Menu button
      if (mx > W/2 - 130 && mx < W/2 + 130 && my > 370 && my < 410) {
        this.returnToMenu();
      }
    } else if (this.state === 'PLAYING') {
      // HOME/TOP/BOTTOM ROW 提示小鍵盤：縮小/放大/關閉，關閉後的重新顯示按鈕
      if (ROW_KEYBOARD_CHARS[this.menuSelection.category]) {
        if (!this.kbVisible) {
          const r = this._getKbReopenLayout();
          if (mx > r.x && mx < r.x + r.w && my > r.y && my < r.y + r.h) {
            this.kbVisible = true;
            this._saveKbSettings();
            this.audio.menuClick();
          }
        } else {
          const layout = this._getKbLayout();
          const inBtn = (b) => mx > b.x && mx < b.x + b.w && my > b.y && my < b.y + b.h;
          if (layout && inBtn(layout.minusBtn)) {
            this.kbScale = Math.max(0.7, +(this.kbScale - 0.15).toFixed(2));
            this._saveKbSettings();
            this.audio.menuClick();
          } else if (layout && inBtn(layout.plusBtn)) {
            this.kbScale = Math.min(1.6, +(this.kbScale + 0.15).toFixed(2));
            this._saveKbSettings();
            this.audio.menuClick();
          } else if (layout && inBtn(layout.closeBtn)) {
            this.kbVisible = false;
            this._saveKbSettings();
            this.audio.menuClick();
          }
        }
      }
    }
  }

  // ── Game Start / Reset ───────────────────────────────────
  _startGame() {
    if (this.menuSelection.category === 'chinese_article') {
      const selected = window.articleManager ? window.articleManager.getSelectedArticles() : [];
      if (selected.length === 0) {
        this._flashMenuWarning('請先點右上角 📚 選擇至少一篇文章');
        return;
      }
      if (!window.pinyinPro) {
        this._flashMenuWarning('拼音工具載入中，請稍後再試一次');
        return;
      }
      const key = selected.map(a => a.id).sort().join(',');
      if (this._articlePoolsKey !== key) {
        this.articlePools = buildArticlePools(selected);
        this._articlePoolsKey = key;
      }
      const totalWords = this.articlePools.Easy.length + this.articlePools.Medium.length + this.articlePools.Hard.length;
      if (totalWords === 0) {
        this._flashMenuWarning('文章內容太少，請上傳更多文字再試');
        return;
      }
    }

    this.audio.init();
    this.state = 'PLAYING';
    this.player = { lane: 3, dir: 1, dead: false, shootAnim: 0 };
    this.enemies = [];
    this.powerupItems = [];
    this.projectiles = [];
    this.particles = [];
    this.floatTexts = [];
    this.targetedEnemies = [];
    this.heldPowerup = null;
    this.frozenTimer = 0;
    this.zombiesSpawned = 0;
    // Barricades: separate for left/right and each lane (1 to 5)
    this.barricades = {
      left: Array.from({ length: LANE_COUNT }, (_, i) => ({ lane: i + 1, x: BARRICADE_LEFT_X, hp: 100, maxHp: 100 })),
      right: Array.from({ length: LANE_COUNT }, (_, i) => ({ lane: i + 1, x: BARRICADE_RIGHT_X, hp: 100, maxHp: 100 })),
    };
    this.stats = { score: 0, kills: 0, level: 1, waveScore: 0, waveKills: 0, timeStart: Date.now(), timeAlive: 0 };
    this.spawnDelay = DIFFICULTY_DELAYS[this.menuSelection.difficulty] || 5500;
    this.waveType = 'NORMAL';
    this.waveTimer = 45000;
    this.spawnTimer = 500;
    this.overlayTimer = 0;
  }

  // ── Typing ───────────────────────────────────────────────
  // 注意：「中文-文章」模式不會走這個函式。那個模式改用瀏覽器/系統自己的
  // 輸入法（真的可以選字），由 #zhTypingInput 這個輸入框處理，
  // 按 ENTER 時交給 _attemptChineseAttack() 判斷攻擊。
  // 這裡處理的是其他模式：英打、中文單字（純鍵盤逐字母比對）。
  _handleTyping(key) {
    const p = this.player;

    // HOME ROW / TOP ROW / BOTTOM ROW 模式：讓小鍵盤上對應的按鍵發亮，
    // 不管打對打錯，只是單純顯示「你剛剛按了哪個鍵」。
    if (ROW_KEYBOARD_CHARS[this.menuSelection.category]) {
      this.kbFlashKey = key;
      this.kbFlashTimer = 160;
    }

    // Filter targeted enemies to ones still in same lane
    this.targetedEnemies = this.targetedEnemies.filter(e =>
      !e.dead && e.lane === p.lane &&
      ((p.dir > 0 && e.fromRight) || (p.dir < 0 && !e.fromRight))
    );

    const matchesKey = (e, index, k) => {
      if (!e.word || index >= e.word.length) return false;
      if (e.word[index] === k) return true;
      // Allow 'u' for 'v' in pinyin ü
      if (e.isChinese && e.word[index] === 'v' && k === 'u') return true;
      return false;
    };

    if (this.targetedEnemies.length > 0) {
      // Direct Chinese character match if typed via IME
      const directMatches = this.targetedEnemies.filter(e => e.isChinese && e.char === key);
      if (directMatches.length > 0) {
        this.audio.hit();
        this._shootAt(directMatches[0]);
        directMatches.forEach(e => {
          e.typed = e.word.length;
          this._killEnemy(e);
        });
        this.targetedEnemies = this.targetedEnemies.filter(e => !e.dead);
        return;
      }

      // Continue typing on existing targets
      const matching = this.targetedEnemies.filter(e => matchesKey(e, e.typed, key));
      if (matching.length > 0) {
        this.audio.hit();
        this._shootAt(matching[0]);
        matching.forEach(e => {
          e.typed++;
          if (e.typed >= e.word.length) this._killEnemy(e);
        });
        // Remove non-matching from target list
        this.targetedEnemies = matching.filter(e => !e.dead);
      } else {
        this.audio.error();
      }
    } else {
      // Find new targets
      const allTypable = [...this.enemies, ...this.powerupItems];
      const candidates = allTypable.filter(e =>
        !e.dead && e.lane === p.lane &&
        ((p.dir > 0 && e.fromRight) || (p.dir < 0 && !e.fromRight)) &&
        (matchesKey(e, 0, key) || (e.isChinese && e.char === key))
      );

      if (candidates.length > 0) {
        this.audio.hit();
        this.targetedEnemies = candidates;
        this._shootAt(candidates[0]);
        candidates.forEach(e => {
          if (e.isChinese && e.char === key) {
            e.typed = e.word.length;
          } else {
            e.typed++;
          }
          if (e.typed >= e.word.length) this._killEnemy(e);
        });
        this.targetedEnemies = candidates.filter(e => !e.dead);
      } else {
        this.audio.error();
      }
    }
  }

  // ── 中文-文章 模式專用：#zhTypingInput 輸入框用瀏覽器/系統輸入法
  // （注音、拼音、倉頡…都可以）打字選字，選好字、按下 ENTER 時呼叫這裡。
  // 拿輸入框裡「目前選好的文字」跟玩家面對的怪物「接下來還沒消滅的字」比對——
  // 如果輸入法一次選出一個詞（例如兩個字的候選字），也會一次把這幾個字
  // 都消滅掉，不是只能一次消一個字。
  _attemptChineseAttack() {
    const input = document.getElementById('zhTypingInput');
    if (!input) return;
    const text = input.value.trim();
    input.value = '';
    if (!text) return;

    const p = this.player;
    if (!p || p.dead) return;

    // 從目前還沒消滅的字開始，一個一個字累加起來跟輸入的文字比對，
    // 找出「累加起來剛好等於輸入文字」需要用到幾個字，回傳用到的字數（0代表不合）
    const matchUnitCount = (e) => {
      const confirmed = e.confirmed || 0;
      const pending = e.units.filter(u => u.boundary > confirmed);
      let acc = '';
      for (let i = 0; i < pending.length; i++) {
        acc += pending[i].display;
        if (acc === text) return i + 1;
        if (acc.length >= text.length) return 0;
      }
      return 0;
    };

    const allTypable = [...this.enemies, ...this.powerupItems];
    const candidates = allTypable.filter(e => {
      if (e.dead || e.lane !== p.lane) return false;
      if (!((p.dir > 0 && e.fromRight) || (p.dir < 0 && !e.fromRight))) return false;
      if (!e.isChinese || !e.units || !e.units.length) return false;
      return matchUnitCount(e) > 0;
    });

    if (candidates.length > 0) {
      this.audio.hit();
      this.targetedEnemies = candidates;
      this._shootAt(candidates[0]);
      candidates.forEach(e => {
        const confirmed = e.confirmed || 0;
        const pending = e.units.filter(u => u.boundary > confirmed);
        const n = matchUnitCount(e);
        e.confirmed = pending[n - 1].boundary;
        e.typed = e.confirmed;
        if (e.confirmed >= e.word.length) this._killEnemy(e);
      });
      this.targetedEnemies = candidates.filter(e => !e.dead);
    } else {
      this.audio.error();
    }
  }

  // ── 顯示/隱藏 #zhTypingBar：只有「中文-文章」模式在遊戲進行中才出現，
  // 並把輸入框清空、聚焦，讓學生可以直接用輸入法打字 ──
  _syncChineseTypingBar() {
    const bar = document.getElementById('zhTypingBar');
    const input = document.getElementById('zhTypingInput');
    if (!bar || !input) return;
    const shouldShow = this.state === 'PLAYING' && this.menuSelection.category === 'chinese_article';
    const isShown = bar.style.display !== 'none';
    if (shouldShow) {
      if (!isShown) bar.style.display = 'flex';
      if (document.activeElement !== input) input.focus();
    } else if (isShown) {
      bar.style.display = 'none';
      input.value = '';
      input.blur();
    }
  }

  _shootAt(target) {
    const p = this.player;
    p.shootAnim = 8;
    this.projectiles.push({
      x: W / 2 + 30 * p.dir,
      y: LANE_Y(p.lane) - 30,
      tx: target.x,
      ty: target.y - 20,
      progress: 0,
    });
  }

  _killEnemy(enemy) {
    enemy.dead = true;
    if (enemy.isPowerup) {
      this.heldPowerup = enemy.powerType;
      this.audio.powerup();
      this.powerupItems = this.powerupItems.filter(p => p !== enemy);
    } else {
      this.stats.kills++;
      this.stats.waveKills++;
      const isRowMode = !!ROW_KEYBOARD_CHARS[this.menuSelection.category];
      const bonus = (isRowMode && !this.kbVisible) ? KB_HIDDEN_SCORE_BONUS : 1;
      const pts = Math.round(enemy.word.length * 13 * bonus);
      this.stats.score += pts;
      this.stats.waveScore += pts;
      this.audio.kill();
      this.floatTexts.push({ x: enemy.x, y: enemy.y - 50, text: '+' + pts, life: 1.5 });
      for (let i = 0; i < 12; i++) {
        this.particles.push({
          x: enemy.x, y: enemy.y - 20,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6 - 2,
          life: 1.0,
          color: ['#4a7c59', '#8a3b3b', '#ff0', '#fff', '#6b9b5a'][Math.floor(Math.random() * 5)],
          size: Math.random() * 4 + 2,
        });
      }
      this.enemies = this.enemies.filter(e => e !== enemy);
    }
  }

  // ── Power-ups ────────────────────────────────────────────
  _usePowerup() {
    if (!this.heldPowerup) return;

    if (this.heldPowerup === 'ice') {
      if (this.enemies.length === 0) return;
      this.frozenTimer = 5000;
      this.audio.freeze();
      // Ice particles
      for (let i = 0; i < 30; i++) {
        this.particles.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 2, vy: -Math.random() * 2,
          life: 2.0, color: '#88ddff', size: Math.random() * 5 + 2,
        });
      }
    } else if (this.heldPowerup === 'bomb') {
      const alive = this.enemies.filter(e => !e.dead);
      if (alive.length === 0) return;
      const toKill = Math.max(1, Math.ceil(alive.length / 2));
      const shuffled = alive.sort(() => Math.random() - 0.5);
      for (let i = 0; i < toKill && i < shuffled.length; i++) {
        this._killEnemy(shuffled[i]);
      }
      this.audio.explosion();
      // Explosion particles
      for (let i = 0; i < 40; i++) {
        this.particles.push({
          x: W / 2 + (Math.random() - 0.5) * 400,
          y: H / 2 + (Math.random() - 0.5) * 200,
          vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8,
          life: 1.5, color: ['#ff4400', '#ffaa00', '#ffff00', '#ff0000'][Math.floor(Math.random() * 4)],
          size: Math.random() * 6 + 3,
        });
      }
    } else if (this.heldPowerup === 'book') {
      const inLane = this.enemies.filter(e => !e.dead && e.lane === this.player.lane);
      if (inLane.length === 0) return;
      inLane.forEach(e => {
        if (e.fromRight) e.x = Math.min(W + 50, e.x + 150);
        else e.x = Math.max(-50, e.x - 150);
      });
      this.audio.powerup();
    }

    this.heldPowerup = null;
  }

  // ── Spawn ────────────────────────────────────────────────
  _spawnZombie() {
    const lane = Math.floor(Math.random() * 5) + 1;
    const fromRight = Math.random() > 0.5;
    const type = Math.floor(Math.random() * 5) + 1;
    const wordItem = this._getUniqueWord();
    const speed = (0.3 + Math.random() * 0.2) * (1 + this.stats.level * 0.08);

    this.enemies.push({
      x: fromRight ? W + 30 : -30,
      y: LANE_Y(lane),
      lane, fromRight, type,
      word: wordItem.word,
      char: wordItem.char || null,
      pinyin: wordItem.pinyin || null,
      units: wordItem.units || null,
      isChinese: !!wordItem.isChinese,
      typed: 0, confirmed: 0, dead: false, speed,
      bob: Math.random() * Math.PI * 2,
      isPowerup: false,
    });
    this.zombiesSpawned++;
  }

  _spawnPowerup() {
    const lane = Math.floor(Math.random() * 5) + 1;
    const fromRight = Math.random() > 0.5;
    const types = ['ice', 'bomb', 'book'];
    const powerType = types[Math.floor(Math.random() * types.length)];

    let wordItem;
    if (this.menuSelection.category === 'chinese' || this.menuSelection.category === 'chinese_article') {
      const pinyinPowerups = {
        ice: { char: '冰', pinyin: 'bīng', input: 'bing' },
        bomb: { char: '雷', pinyin: 'léi', input: 'lei' },
        book: { char: '書', pinyin: 'shū', input: 'shu' },
      };
      const pu = pinyinPowerups[powerType] || pinyinPowerups.ice;
      wordItem = {
        char: pu.char, pinyin: pu.pinyin, word: pu.input, isChinese: true,
        units: [{ display: pu.char, pinyin: pu.pinyin, input: pu.input, boundary: pu.input.length }],
      };
    } else {
      wordItem = this._getUniqueWord();
    }

    this.powerupItems.push({
      x: fromRight ? W + 30 : -30,
      y: LANE_Y(lane),
      lane, fromRight,
      word: wordItem.word,
      char: wordItem.char || null,
      pinyin: wordItem.pinyin || null,
      units: wordItem.units || null,
      isChinese: !!wordItem.isChinese,
      typed: 0, confirmed: 0, dead: false, speed: 0.35,
      isPowerup: true, powerType,
      bob: Math.random() * Math.PI * 2,
    });
  }

  _getUniqueWord() {
    const usedWords = [...this.enemies, ...this.powerupItems].map(e => e.word);
    let item;
    let attempts = 0;
    do {
      item = getWordForCategory(this.menuSelection.category, this.menuSelection.difficulty, { articlePools: this.articlePools });
      attempts++;
    } while (usedWords.includes(item.word) && attempts < 50);
    return item;
  }

  // ── Update ───────────────────────────────────────────────
  update(dt) {
    this.globalTime += dt;

    if (this.kbFlashTimer > 0) {
      this.kbFlashTimer -= dt;
      if (this.kbFlashTimer <= 0) { this.kbFlashTimer = 0; this.kbFlashKey = null; }
    }

    if (this.state === 'MENU') {
      this.menuTitleBounce = Math.sin(this.globalTime / 500) * 5;
      if (this.menuWarningTimer > 0) this.menuWarningTimer -= dt;
      // Animate menu zombies
      this.menuBgZombies.forEach(z => {
        z.x += z.speed * (dt / 16);
        z.bob += dt * 0.003;
        if (z.x > W + 50) z.x = -50;
        if (z.x < -50) z.x = W + 50;
      });
      return;
    }

    if (this.state === 'HORDE_INTRO' || this.state === 'WAVE_COMPLETE') {
      this.overlayTimer -= dt;
      if (this.overlayTimer <= 0) {
        this.state = 'PLAYING';
      }
      return;
    }

    if (this.state !== 'PLAYING') return;

    this.stats.timeAlive = Math.floor((Date.now() - this.stats.timeStart) / 1000);

    // Frozen timer
    if (this.frozenTimer > 0) this.frozenTimer -= dt;

    // Wave timer
    this.waveTimer -= dt;
    if (this.waveTimer <= 0) {
      // Only transition when all zombies are cleared
      const zombiesLeft = this.enemies.filter(e => !e.dead).length;
      if (zombiesLeft === 0) {
        if (this.waveType === 'NORMAL') {
          this.waveType = 'HORDE';
          this.waveTimer = 10000;
          this.state = 'HORDE_INTRO';
          this.overlayTimer = 2500;
          this.spawnTimer = 300;
        } else {
          // Horde complete
          this.state = 'WAVE_COMPLETE';
          this.overlayTimer = 4000;
          this.stats.level++;
          this.spawnDelay *= 0.78;
          this.stats.waveScore = 0;
          this.stats.waveKills = 0;
          this.waveType = 'NORMAL';
          this.waveTimer = 45000;
          this.spawnTimer = 500;
        }
      }
    }

    // Spawning
    if (this.waveTimer > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        const delay = this.waveType === 'HORDE' ? this.spawnDelay * 0.65 : this.spawnDelay;
        this.spawnTimer = delay;

        if (this.frozenTimer <= 0) {
          this._spawnZombie();
          // Occasional power-up
          if (Math.random() < 0.06 && !this.heldPowerup) {
            this._spawnPowerup();
          }
        }
      }
    }

    // Move enemies
    const frozen = this.frozenTimer > 0;
    this.enemies.forEach(e => {
      if (e.dead) return;
      e.bob += dt * 0.005;
      if (frozen) return;

      const barricadeList = e.fromRight ? this.barricades.right : this.barricades.left;
      const b = barricadeList[e.lane - 1] || barricadeList[0];
      const targetX = e.fromRight ? b.x + 30 : b.x - 30;
      const atBarricade = e.fromRight ? (e.x <= targetX) : (e.x >= targetX);

      if (!atBarricade) {
        e.x += (e.fromRight ? -1 : 1) * e.speed * (dt / 16);
      } else {
        // Attack barricade for this specific lane
        b.hp -= 0.03 * (dt / 16);
        if (b.hp <= 0) {
          b.hp = 0;
          this.player.dead = true;
          this.state = 'GAME_OVER';
          return;
        }
      }
    });
    this.enemies = this.enemies.filter(e => !e.dead);

    // Move power-up items
    this.powerupItems.forEach(p => {
      if (p.dead) return;
      p.bob += dt * 0.008;
      if (frozen) return;
      const barricadeList = p.fromRight ? this.barricades.right : this.barricades.left;
      const b = barricadeList[p.lane - 1] || barricadeList[0];
      const targetX = p.fromRight ? b.x + 30 : b.x - 30;
      const atBarricade = p.fromRight ? (p.x <= targetX) : (p.x >= targetX);
      if (!atBarricade) {
        p.x += (p.fromRight ? -1 : 1) * p.speed * (dt / 16);
      }
    });
    this.powerupItems = this.powerupItems.filter(p => !p.dead);

    // Projectiles
    this.projectiles.forEach(p => { p.progress += dt / 120; });
    this.projectiles = this.projectiles.filter(p => p.progress < 1);

    // Particles
    this.particles.forEach(p => {
      p.x += p.vx * (dt / 16);
      p.y += p.vy * (dt / 16);
      p.vy += 0.1 * (dt / 16);
      p.life -= dt / 1000;
    });
    this.particles = this.particles.filter(p => p.life > 0);

    // Float texts
    this.floatTexts.forEach(ft => {
      ft.y -= 0.8 * (dt / 16);
      ft.life -= dt / 1000;
    });
    this.floatTexts = this.floatTexts.filter(ft => ft.life > 0);

    // Player shoot animation
    if (this.player.shootAnim > 0) this.player.shootAnim -= dt / 30;
  }

  // ── Drawing ──────────────────────────────────────────────
  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, W, H);

    this._drawBackground(ctx);

    if (this.state === 'MENU') {
      this._drawMenu(ctx);
      return;
    }

    this._drawLanes(ctx);
    this._drawBarricades(ctx);

    // Sort all visible entities by lane for depth ordering
    const toDraw = [];
    if (this.player && !this.player.dead) {
      toDraw.push({ type: 'player', lane: this.player.lane, obj: this.player });
    }
    this.enemies.forEach(e => toDraw.push({ type: 'enemy', lane: e.lane, obj: e }));
    this.powerupItems.forEach(p => toDraw.push({ type: 'powerup', lane: p.lane, obj: p }));
    toDraw.sort((a, b) => a.lane - b.lane);

    toDraw.forEach(item => {
      if (item.type === 'player') this._drawPlayer(ctx, item.obj);
      else if (item.type === 'enemy') this._drawZombie(ctx, item.obj);
      else if (item.type === 'powerup') this._drawPowerupItem(ctx, item.obj);
    });

    this._drawProjectiles(ctx);
    this._drawParticles(ctx);
    this._drawFloatTexts(ctx);
    this._drawRowKeyboard(ctx);
    this._drawHUD(ctx);
    this._drawFrozenOverlay(ctx);
    this._drawOverlays(ctx);
  }

  _drawBackground(ctx) {
    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#050510');
    skyGrad.addColorStop(0.4, '#0a0a2e');
    skyGrad.addColorStop(0.7, '#1a1a3e');
    skyGrad.addColorStop(1, '#2a1a1a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Stars
    this.stars.forEach(s => {
      const alpha = 0.3 + 0.7 * Math.abs(Math.sin(this.globalTime * s.speed / 1000 + s.twinkle));
      ctx.fillStyle = `rgba(255, 255, 240, ${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Moon
    ctx.fillStyle = '#fffde7';
    ctx.beginPath();
    ctx.arc(780, 70, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#050510';
    ctx.beginPath();
    ctx.arc(790, 62, 30, 0, Math.PI * 2);
    ctx.fill();
    // Moon glow
    const moonGlow = ctx.createRadialGradient(780, 70, 30, 780, 70, 100);
    moonGlow.addColorStop(0, 'rgba(255, 253, 200, 0.15)');
    moonGlow.addColorStop(1, 'rgba(255, 253, 200, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(780, 70, 100, 0, Math.PI * 2);
    ctx.fill();

    // Ground
    const groundGrad = ctx.createLinearGradient(0, H * 0.6, 0, H);
    groundGrad.addColorStop(0, '#1a1a0a');
    groundGrad.addColorStop(1, '#0a0a05');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, H * 0.6, W, H * 0.4);

    // Dead trees (simple silhouettes)
    this._drawTree(ctx, 60, H * 0.6 - 10, 0.8);
    this._drawTree(ctx, 850, H * 0.6 - 5, 0.7);
    this._drawTree(ctx, 150, H * 0.6, 0.5);
    this._drawTree(ctx, 750, H * 0.6 + 5, 0.6);

    // Tombstones
    ctx.fillStyle = '#2a2a3a';
    [[30, H*0.65], [120, H*0.7], [800, H*0.68], [870, H*0.72]].forEach(([tx, ty]) => {
      ctx.fillRect(tx, ty - 18, 16, 22);
      ctx.beginPath();
      ctx.arc(tx + 8, ty - 18, 8, Math.PI, 0);
      ctx.fill();
    });
  }

  _drawTree(ctx, x, y, scale) {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(x - 3 * scale, y - 60 * scale, 6 * scale, 60 * scale);
    // Branches
    ctx.save();
    ctx.translate(x, y - 45 * scale);
    ctx.rotate(-0.4);
    ctx.fillRect(0, 0, 30 * scale, 3 * scale);
    ctx.restore();
    ctx.save();
    ctx.translate(x, y - 30 * scale);
    ctx.rotate(0.5);
    ctx.fillRect(0, 0, 25 * scale, 3 * scale);
    ctx.restore();
    ctx.save();
    ctx.translate(x, y - 50 * scale);
    ctx.rotate(0.3);
    ctx.fillRect(0, 0, 20 * scale, 2 * scale);
    ctx.restore();
  }

  _drawLanes(ctx) {
    for (let i = 1; i <= 5; i++) {
      const y = LANE_Y(i);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.02)';
      ctx.fillRect(0, y - 36, W, 72);
      // Subtle lane lines
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.beginPath();
      ctx.moveTo(0, y - 36);
      ctx.lineTo(W, y - 36);
      ctx.stroke();
    }
  }

  _drawBarricades(ctx) {
    const sides = [
      { side: 'left', list: this.barricades.left, x: BARRICADE_LEFT_X },
      { side: 'right', list: this.barricades.right, x: BARRICADE_RIGHT_X },
    ];

    sides.forEach(({ list, x }) => {
      // Barricade body post
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(x - 8, 90, 16, 380);

      // Draw planks and separate HP bar for each lane
      for (let i = 0; i < LANE_COUNT; i++) {
        const laneBarricade = list[i];
        const hpRatio = Math.max(0, laneBarricade.hp) / laneBarricade.maxHp;
        const py = LANE_Y(i + 1);

        // Cross planks
        if (hpRatio > 0) {
          ctx.fillStyle = hpRatio > 0.4 ? '#7a5a2a' : '#5a3d1d';
          ctx.fillRect(x - 24, py - 18, 48, 8);
          ctx.fillRect(x - 20, py + 10, 40, 8);
        } else {
          ctx.fillStyle = '#3a2a0a';
          ctx.fillRect(x - 14, py - 16, 28, 5);
        }

        // Separate HP bar for each lane
        const barW = 44;
        const barH = 5;
        const barX = x - barW / 2;
        const barY = py - 32;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
        ctx.fillStyle = '#300';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = hpRatio > 0.5 ? '#2ed573' : hpRatio > 0.25 ? '#ffa502' : '#ff4757';
        ctx.fillRect(barX, barY, barW * hpRatio, barH);
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);
      }
    });
  }

  _drawPlayer(ctx, p) {
    const px = W / 2;
    const py = LANE_Y(p.lane);
    ctx.save();
    ctx.translate(px, py);
    if (p.dir < 0) ctx.scale(-1, 1);

    const spr = this.sprites.getSprite('player');
    if (spr && spr.complete !== false) {
      // Draw shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(0, 2, 20, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Slight recoil on shoot
      const recoil = p.shootAnim > 0 ? -3 : 0;
      ctx.drawImage(spr, -32 + recoil, -62, 64, 64);
    }

    ctx.restore();

    // Held power-up indicator
    if (this.heldPowerup) {
      ctx.save();
      const icons = { ice: '❄️', bomb: '💣', book: '📖' };
      ctx.font = '18px sans-serif';
      ctx.fillText(icons[this.heldPowerup] || '⚡', px - 10, py + 22);
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffa';
      ctx.fillText('ENTER', px - 20, py + 36);
      ctx.restore();
    }

    // Lane arrow indicators
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px sans-serif';
    if (p.lane > 1) ctx.fillText('▲', px + 35 * p.dir, py - 20);
    if (p.lane < 5) ctx.fillText('▼', px + 35 * p.dir, py + 15);
    ctx.restore();
  }

  // ── HOME/TOP/BOTTOM ROW 提示小鍵盤：座標計算（畫面 & 點擊判定共用同一份，
  // 避免兩邊算出來對不齊）──
  _getKbLayout() {
    const rowChars = ROW_KEYBOARD_CHARS[this.menuSelection.category];
    if (!rowChars) return null;
    const scale = this.kbScale || 1;
    const keySize = 32 * scale;
    const gap = 6 * scale;
    const n = rowChars.length;
    const keysW = n * keySize + (n - 1) * gap;
    const btnSize = 22;
    const btnGap = 6;
    const controlsW = btnSize * 3 + btnGap * 2;
    const totalW = keysW + 16 + controlsW;
    const startX = W / 2 - totalW / 2;
    const y = 452;
    const keys = [];
    for (let i = 0; i < n; i++) {
      keys.push({
        ch: rowChars[i],
        x: startX + i * (keySize + gap),
        y: y - keySize / 2,
        w: keySize, h: keySize,
      });
    }
    const controlsX = startX + keysW + 16;
    return {
      rowChars, keys, y, scale,
      minusBtn: { x: controlsX, y: y - btnSize / 2, w: btnSize, h: btnSize },
      plusBtn: { x: controlsX + btnSize + btnGap, y: y - btnSize / 2, w: btnSize, h: btnSize },
      closeBtn: { x: controlsX + (btnSize + btnGap) * 2, y: y - btnSize / 2, w: btnSize, h: btnSize },
    };
  }

  _getKbReopenLayout() {
    const w = 210, h = 26;
    return { x: W / 2 - w / 2, y: 452 - h / 2, w, h };
  }

  _drawRowKeyboard(ctx) {
    if (this.state !== 'PLAYING') return;
    const rowChars = ROW_KEYBOARD_CHARS[this.menuSelection.category];
    if (!rowChars) return;

    if (!this.kbVisible) {
      const r = this._getKbReopenLayout();
      ctx.save();
      ctx.fillStyle = 'rgba(10, 16, 32, 0.85)';
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.w, r.h, 13);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 10px "Outfit", "Microsoft JhengHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⌨ 顯示小鍵盤（分數 ×' + KB_HIDDEN_SCORE_BONUS + ' 加碼中）', r.x + r.w / 2, r.y + r.h / 2 + 1);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';
      ctx.restore();
      return;
    }

    const layout = this._getKbLayout();
    if (!layout) return;

    ctx.save();
    layout.keys.forEach(k => {
      const isFlashing = this.kbFlashKey === k.ch && this.kbFlashTimer > 0;
      ctx.fillStyle = isFlashing ? 'rgba(255, 215, 0, 0.85)' : 'rgba(255, 255, 255, 0.12)';
      ctx.strokeStyle = isFlashing ? '#ffd700' : 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.5;
      if (isFlashing) { ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 10; }
      ctx.beginPath();
      ctx.roundRect(k.x, k.y, k.w, k.h, 6 * layout.scale);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = isFlashing ? '#1a1a1a' : 'rgba(255, 255, 255, 0.85)';
      ctx.font = `bold ${Math.round(14 * layout.scale)}px "Outfit", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(k.ch.toUpperCase(), k.x + k.w / 2, k.y + k.h / 2 + 1);
    });
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';

    const drawCtrlBtn = (btn, label) => {
      ctx.fillStyle = 'rgba(10, 16, 32, 0.8)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 1);
    };
    drawCtrlBtn(layout.minusBtn, '－');
    drawCtrlBtn(layout.plusBtn, '＋');
    drawCtrlBtn(layout.closeBtn, '✕');
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  _drawZombie(ctx, e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    // Zombies face toward center
    if (!e.fromRight) ctx.scale(-1, 1);

    // Bob animation
    const bobY = Math.sin(e.bob) * 3;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 3, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    const spr = this.sprites.getSprite('zombie' + e.type);
    if (spr && spr.complete !== false) {
      ctx.drawImage(spr, -32, -62 + bobY, 64, 64);
    }

    // Frozen overlay
    if (this.frozenTimer > 0) {
      ctx.fillStyle = 'rgba(100, 200, 255, 0.35)';
      ctx.fillRect(-28, -60 + bobY, 56, 60);
      // Ice crystals
      ctx.fillStyle = 'rgba(200, 240, 255, 0.6)';
      ctx.font = '14px sans-serif';
      ctx.fillText('❄', -10, -40 + bobY);
    }

    ctx.restore();

    // Word
    this._drawWord(ctx, e);
  }

  _drawPowerupItem(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);

    const bobY = Math.sin(p.bob) * 5;
    const pulse = 0.9 + Math.sin(this.globalTime / 200) * 0.1;

    // Glow
    const colors = { ice: '#00ccff', bomb: '#ff4400', book: '#ffcc00' };
    const glowColor = colors[p.powerType] || '#fff';
    const glow = ctx.createRadialGradient(0, -25 + bobY, 5, 0, -25 + bobY, 30);
    glow.addColorStop(0, glowColor + '60');
    glow.addColorStop(1, glowColor + '00');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -25 + bobY, 30 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Icon
    const icons = { ice: '❄️', bomb: '💣', book: '📖' };
    ctx.font = `${24 * pulse}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(icons[p.powerType] || '⚡', 0, -18 + bobY);
    ctx.textAlign = 'start';

    ctx.restore();

    this._drawWord(ctx, p);
  }

  _drawWord(ctx, entity) {
    ctx.save();
    if (entity.isChinese && entity.units && entity.units.length) {
      this._drawChineseUnits(ctx, entity);
      ctx.restore();
      return;
    }

    ctx.font = 'bold 14px "Press Start 2P", monospace';
    const word = entity.word;
    const totalW = ctx.measureText(word).width;
    const x = entity.x - totalW / 2;
    const y = entity.y - 78;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    const padX = 8;
    const padY = 5;
    ctx.beginPath();
    ctx.roundRect(x - padX, y - 16, totalW + padX * 2, 24, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Letters
    let cx = x;
    for (let i = 0; i < word.length; i++) {
      if (i < entity.typed) {
        ctx.fillStyle = '#2ed573'; // typed = bright green
      } else if (i === entity.typed && this.targetedEnemies.includes(entity)) {
        ctx.fillStyle = '#ffa502'; // next = bright orange/yellow
      } else {
        ctx.fillStyle = '#ffffff'; // untyped = bright white
      }
      ctx.fillText(word[i], cx, y);
      cx += ctx.measureText(word[i]).width;
    }
    ctx.restore();
  }

  // Ruby-style renderer for Chinese entities: pinyin above each character.
  // Characters that have already been typed correctly disappear and the
  // remaining characters shift left to fill the gap (used for 中文-文章
  // 困難版 full-sentence typing, and works fine for shorter words too).
  _drawChineseUnits(ctx, entity) {
    const isTargeted = this.targetedEnemies.includes(entity);
    const typed = entity.typed;
    const WINDOW = 10; // max hanzi shown at once so long sentences don't overflow

    // Only keep units not yet confirmed-eliminated (ENTER pressed for them).
    // In 中文-文章 mode this waits for Enter; other Chinese modes kill the
    // whole enemy instantly on completion so `confirmed` never matters there.
    const confirmedPos = entity.confirmed || 0;
    const visible = [];
    let startBoundary = 0;
    for (const u of entity.units) {
      const done = u.input.length > 0 && u.boundary <= confirmedPos;
      if (!done) visible.push({ u, startBoundary });
      startBoundary = u.boundary;
    }
    const shown = visible.slice(0, WINDOW);
    const hasMore = visible.length > WINDOW;
    if (shown.length === 0) return; // about to die this frame

    const hanziFont = 'bold 18px "Outfit", "Microsoft JhengHei", "PingFang SC", sans-serif';
    const pinyinFont = 'bold 12px "Outfit", sans-serif';
    const colGap = 4;
    const padX = 10;

    // Measure each visible column
    const cols = shown.map(({ u, startBoundary: s }) => {
      ctx.font = hanziFont;
      const hanziW = ctx.measureText(u.display).width;
      ctx.font = pinyinFont;
      const pinyinW = ctx.measureText(u.pinyin).width;
      const colW = Math.max(hanziW, pinyinW);
      const typedInUnit = Math.max(0, Math.min(u.input.length, typed - s));
      return { u, colW, hanziW, pinyinW, typedInUnit };
    });
    let totalW = cols.reduce((sum, c) => sum + c.colW, 0) + colGap * (cols.length - 1);
    if (hasMore) totalW += 18;
    const boxW = totalW + padX * 2;
    const boxH = 34;
    const x = entity.x - boxW / 2;
    const y = entity.y - 82;

    // Box background
    ctx.fillStyle = isTargeted ? 'rgba(10, 16, 32, 0.92)' : 'rgba(0, 0, 0, 0.85)';
    ctx.beginPath();
    ctx.roundRect(x, y - 23, boxW, boxH, 6);
    ctx.fill();
    ctx.strokeStyle = isTargeted ? 'rgba(0, 212, 255, 0.8)' : 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = isTargeted ? 2 : 1.5;
    if (isTargeted) { ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 8; }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw each column: pinyin on top, hanzi below
    let cx = x + padX;
    cols.forEach((col, idx) => {
      const isCurrent = idx === 0 && col.typedInUnit > 0;
      const isNext = idx === 0;

      // Hanzi
      ctx.font = hanziFont;
      ctx.fillStyle = isCurrent ? '#2ed573' : (isNext && isTargeted ? '#00d4ff' : '#ffd700');
      ctx.fillText(col.u.display, cx + (col.colW - col.hanziW) / 2, y + 6);

      // Pinyin, colored letter-by-letter for the current column's progress
      ctx.font = pinyinFont;
      let px = cx + (col.colW - col.pinyinW) / 2;
      const pinyinLetters = col.u.pinyin.split('');
      for (let i = 0; i < pinyinLetters.length; i++) {
        if (idx === 0 && i < col.typedInUnit) {
          ctx.fillStyle = '#2ed573'; // typed
        } else if (idx === 0 && i === col.typedInUnit && isTargeted) {
          ctx.fillStyle = '#ffa502'; // next letter to type
        } else {
          ctx.fillStyle = '#ffffff';
        }
        ctx.fillText(pinyinLetters[i], px, y - 12);
        px += ctx.measureText(pinyinLetters[i]).width;
      }

      cx += col.colW + colGap;
    });

    if (hasMore) {
      ctx.font = 'bold 14px "Outfit", sans-serif';
      ctx.fillStyle = '#a0a0b0';
      ctx.fillText('…', cx - colGap + 4, y + 4);
    }
  }

  _drawProjectiles(ctx) {
    ctx.save();
    this.projectiles.forEach(p => {
      const cx = p.x + (p.tx - p.x) * p.progress;
      const cy = p.y + (p.ty - p.y) * p.progress - Math.sin(p.progress * Math.PI) * 15;
      ctx.fillStyle = '#ffffaa';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  _drawParticles(ctx) {
    ctx.save();
    this.particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    });
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  _drawFloatTexts(ctx) {
    ctx.save();
    ctx.font = '12px "Press Start 2P", monospace';
    this.floatTexts.forEach(ft => {
      ctx.globalAlpha = Math.max(0, ft.life / 1.5);
      ctx.fillStyle = '#ffd700';
      ctx.fillText(ft.text, ft.x - 15, ft.y);
    });
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  _drawFrozenOverlay(ctx) {
    if (this.frozenTimer > 0) {
      ctx.fillStyle = `rgba(100, 200, 255, ${0.08 + Math.sin(this.globalTime / 200) * 0.04})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  _drawHUD(ctx) {
    if (this.state !== 'PLAYING' && this.state !== 'HORDE_INTRO' && this.state !== 'WAVE_COMPLETE') return;

    ctx.save();

    // Centered Top Panel
    const panelW = 460;
    const panelH = 54;
    const panelX = (W - panelW) / 2;
    const panelY = 8;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Top row inside HUD
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`SCORE: ${this.stats.score.toLocaleString()}`, panelX + 16, panelY + 22);

    ctx.fillStyle = '#2ed573';
    ctx.fillText(`LEVEL: ${this.stats.level}`, panelX + 230, panelY + 22);

    const waveLeft = Math.max(0, Math.ceil(this.waveTimer / 1000));
    ctx.fillStyle = this.waveType === 'HORDE' ? '#ff4757' : '#00d4ff';
    const waveLabel = this.waveType === 'HORDE' ? `HORDE ${waveLeft}s` : `WAVE ${waveLeft}s`;
    ctx.fillText(waveLabel, panelX + 340, panelY + 22);

    // Bottom row inside HUD
    ctx.fillStyle = '#e8e8e8';
    ctx.fillText(`KILLS: ${this.stats.kills}`, panelX + 16, panelY + 44);

    const mins = Math.floor(this.stats.timeAlive / 60);
    const secs = this.stats.timeAlive % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    ctx.fillText(`TIME: ${timeStr}`, panelX + 230, panelY + 44);

    ctx.restore();
  }

  _drawOverlays(ctx) {
    if (this.state === 'HORDE_INTRO') {
      // Red pulsing overlay
      const pulse = 0.15 + Math.sin(this.globalTime / 150) * 0.1;
      ctx.fillStyle = `rgba(255, 0, 0, ${pulse})`;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.font = '24px "Press Start 2P", monospace';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 20;
      ctx.fillText('ZOMBIES APPROACHING!', W / 2, H / 2 - 10);
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#faa';
      ctx.fillText('Prepare yourself...', W / 2, H / 2 + 25);
      ctx.textAlign = 'start';
      ctx.restore();

    } else if (this.state === 'WAVE_COMPLETE') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#2ed573';
      ctx.font = '28px "Press Start 2P", monospace';
      ctx.shadowColor = '#2ed573';
      ctx.shadowBlur = 15;
      ctx.fillText('WAVE COMPLETE!', W / 2, H / 2 - 40);
      ctx.shadowBlur = 0;

      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillStyle = '#e8e8e8';
      ctx.fillText(`Score: ${this.stats.score.toLocaleString()}  |  Kills: ${this.stats.kills}`, W / 2, H / 2 + 10);

      ctx.fillStyle = '#ffd700';
      const countdown = Math.ceil(this.overlayTimer / 1000);
      ctx.fillText(`Next wave in ${countdown}...`, W / 2, H / 2 + 50);
      ctx.textAlign = 'start';
      ctx.restore();

    } else if (this.state === 'PAUSED') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.textAlign = 'center';

      // Title
      ctx.fillStyle = '#00d4ff';
      ctx.font = '32px "Press Start 2P", monospace';
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 15;
      ctx.fillText('PAUSED', W / 2, H / 2 - 70);
      ctx.shadowBlur = 0;

      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillStyle = '#aaa';
      ctx.fillText('Press ESC, P or Space to Resume', W / 2, H / 2 - 35);

      // Buttons
      // Resume Button
      ctx.fillStyle = '#2ed573';
      ctx.beginPath();
      ctx.roundRect(W / 2 - 130, 220, 260, 45, 8);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = '14px "Press Start 2P", monospace';
      ctx.fillText('RESUME (繼續)', W / 2, 248);

      // Main Menu Button
      ctx.fillStyle = '#6c63ff';
      ctx.beginPath();
      ctx.roundRect(W / 2 - 130, 280, 260, 40, 8);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillText('MAIN MENU (回主選單)', W / 2, 305);

      ctx.textAlign = 'start';
      ctx.restore();

    } else if (this.state === 'GAME_OVER') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.textAlign = 'center';

      // Title
      ctx.fillStyle = '#ff4757';
      ctx.font = '36px "Press Start 2P", monospace';
      ctx.shadowColor = '#ff4757';
      ctx.shadowBlur = 20;
      ctx.fillText('GAME OVER', W / 2, H / 2 - 80);
      ctx.shadowBlur = 0;

      // Stats
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillStyle = '#e8e8e8';
      const mins = Math.floor(this.stats.timeAlive / 60);
      const secs = this.stats.timeAlive % 60;
      ctx.fillText(`Score: ${this.stats.score.toLocaleString()}`, W / 2, H / 2 - 30);
      ctx.fillText(`Kills: ${this.stats.kills}  |  Level: ${this.stats.level}`, W / 2, H / 2 - 5);
      ctx.fillText(`Time: ${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`, W / 2, H / 2 + 20);

      // Buttons
      // Play Again
      ctx.fillStyle = '#2ed573';
      ctx.beginPath();
      ctx.roundRect(W/2 - 130, 310, 260, 45, 8);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = '14px "Press Start 2P", monospace';
      ctx.fillText('PLAY AGAIN', W / 2, 340);

      // Menu
      ctx.fillStyle = '#6c63ff';
      ctx.beginPath();
      ctx.roundRect(W/2 - 130, 370, 260, 40, 8);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillText('MAIN MENU', W / 2, 396);

      ctx.textAlign = 'start';
      ctx.restore();
    }
  }

  _drawMenu(ctx) {
    // Background zombies
    this.menuBgZombies.forEach(z => {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.translate(z.x, z.y);
      if (z.speed > 0) ctx.scale(-1, 1);
      const spr = this.sprites.getSprite('zombie' + z.type);
      if (spr && spr.complete !== false) {
        const bobY = Math.sin(z.bob) * 3;
        ctx.drawImage(spr, -32, -62 + bobY, 64, 64);
      }
      ctx.restore();
    });

    ctx.save();
    ctx.textAlign = 'center';

    // Title
    ctx.shadowColor = '#ff4757';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#ff4757';
    ctx.font = '48px "Press Start 2P", monospace';
    ctx.fillText('末日生存', W / 2, 130 + this.menuTitleBounce);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.fillStyle = '#e8e8e8';
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.fillText('防禦殭屍戰', W / 2, 170 + this.menuTitleBounce);

    ctx.font = '9px "Press Start 2P", monospace';
    ctx.fillStyle = '#6c63ff';
    ctx.fillText('Clean Edition - No Ads', W / 2, 195);

    // Difficulty selection
    ctx.fillStyle = '#a0a0b0';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillText('DIFFICULTY', W / 2, 240);

    this.difficulties.forEach((d, i) => {
      const bx = W / 2 - 150 + i * 110;
      const selected = i === this.menuSelection.difficultyIndex;
      ctx.fillStyle = selected ? '#6c63ff' : 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.roundRect(bx, 250, 100, 30, 6);
      ctx.fill();
      if (selected) {
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.fillStyle = selected ? '#fff' : '#888';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText(d, bx + 50, 270);
    });

    // Category selection
    ctx.fillStyle = '#a0a0b0';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillText('WORD TYPE', W / 2, 305);

    const catBtnW = 76;
    const catBtnGap = 8;
    const catTotalW = this.categories.length * catBtnW + (this.categories.length - 1) * catBtnGap;
    const catStartX = (W - catTotalW) / 2;

    this.categories.forEach((c, i) => {
      const bx = catStartX + i * (catBtnW + catBtnGap);
      const selected = i === this.menuSelection.categoryIndex;
      ctx.fillStyle = selected ? '#6c63ff' : 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.roundRect(bx, 314, catBtnW, 28, 5);
      ctx.fill();
      if (selected) {
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.fillStyle = selected ? '#fff' : '#888';
      if (c.id === 'chinese') {
        ctx.font = 'bold 12px "Outfit", "Microsoft JhengHei", sans-serif';
        ctx.fillText(c.label, bx + catBtnW / 2, 333);
      } else if (c.id === 'chinese_article') {
        ctx.font = 'bold 10px "Outfit", "Microsoft JhengHei", sans-serif';
        ctx.fillText(c.label, bx + catBtnW / 2, 333);
      } else {
        ctx.font = '7px "Press Start 2P", monospace';
        ctx.fillText(c.label, bx + catBtnW / 2, 332);
      }
    });

    // 中文-文章 mode: show how many articles are currently selected
    if (this.menuSelection.category === 'chinese_article') {
      const n = window.articleManager ? window.articleManager.getSelectedArticles().length : 0;
      ctx.fillStyle = n > 0 ? '#2ed573' : '#ffa502';
      ctx.font = '9px "Outfit", "Microsoft JhengHei", sans-serif';
      ctx.fillText(n > 0 ? `已選 ${n} 篇文章 ✓` : '尚未選擇文章，請點右上角 📚', W / 2, 350);
    }

    // Warning flash (e.g. no article selected)
    if (this.menuWarningTimer > 0) {
      ctx.fillStyle = '#ff4757';
      ctx.font = 'bold 11px "Outfit", "Microsoft JhengHei", sans-serif';
      ctx.fillText(this.menuWarning, W / 2, 350);
    }

    // Play button
    const playPulse = 0.95 + Math.sin(this.globalTime / 400) * 0.05;
    ctx.save();
    ctx.translate(W / 2, 375);
    ctx.scale(playPulse, playPulse);

    ctx.fillStyle = '#2ed573';
    ctx.shadowColor = '#2ed573';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.roundRect(-110, -25, 220, 50, 10);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#000';
    ctx.font = '18px "Press Start 2P", monospace';
    ctx.fillText('PLAY', 0, 8);
    ctx.restore();

    // Instructions
    ctx.fillStyle = '#666';
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillText('↑↓ Move  ←→ Face  Type words  Enter = Power-up', W / 2, 430);
    ctx.fillText('Click PLAY or press Enter/Space to start', W / 2, 450);

    ctx.textAlign = 'start';
    ctx.restore();
  }

  // ── Game Loop ────────────────────────────────────────────
  _loop() {
    const now = performance.now();
    const dt = Math.min(now - this.lastTime, 50); // Cap at 50ms to prevent huge jumps
    this.lastTime = now;

    this.update(dt);
    this.draw();
    this._syncChineseTypingBar();

    requestAnimationFrame(() => this._loop());
  }
}

// ── roundRect polyfill ───────────────────────────────────────
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (typeof r === 'number') r = [r, r, r, r];
    this.moveTo(x + r[0], y);
    this.lineTo(x + w - r[1], y);
    this.quadraticCurveTo(x + w, y, x + w, y + r[1]);
    this.lineTo(x + w, y + h - r[2]);
    this.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
    this.lineTo(x + r[3], y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r[3]);
    this.lineTo(x, y + r[0]);
    this.quadraticCurveTo(x, y, x + r[0], y);
    this.closePath();
  };
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  window.articleManager = new ArticleManager();

  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  const game = new TommyQGame(canvas);
  window.game = game;

  // Hide loading overlay
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 500);
    }, 500);
  }
});
