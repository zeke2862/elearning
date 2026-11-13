// ============================================================
// Tommy Q - Clean Edition | 打字遊戲
// Complete game engine - Vanilla JS + Canvas 2D
// ============================================================

// ── Word List ────────────────────────────────────────────────
const WORD_LIST = [   // 單字取自 English_Look_Subject 42 篇文章
  "abandon","abandoned","abbey","abbreviation","ability","able","aboard","about","above","abraham",
  "abroad","abuse","abused","academic","accelerating","accept","accepted","access","accessible","accessories",
  "accident","accommodation","accomplished","according","account","accounting","accounts","accuracy","accurate","accurately",
  "accused","achieve","achieved","achievement","acid","acquire","across","acting","action","active",
  "activities","activity","actor","actors","acts","actual","actually","adam","add","added",
  "addicts","adding","addition","additional","address","adds","admire","adopt","adopting","advance",
  "advanced","advances","advantage","advantages","adventurer","adventurous","advertising","advice","advisers","aec",
  "affair","affairs","affect","affected","afford","afraid","africa","african","after","afternoon",
  "again","against","age","aged","agency","agenda","agent","ages","aggressive","ago",
  "agree","agreed","agreement","agricultural","agriculture","ahead","aid","aidc","aides","aim",
  "aimed","aims","air","airline","airlines","airplane","airplanes","airport","alarming","alienated",
  "alive","all","allegations","alleged","allied","allow","allowed","allowing","allows","ally",
  "almost","alone","along","already","also","alternative","although","always","am","amadeus",
  "amazed","amazing","ambassador","ambitions","amendment","amendments","america","american","americans","amoco",
  "among","amount","amounted","amounts","ample","an","analyses","analysis","analysts","analyze",
  "ancient","and","andrew","angeles","anger","angry","animal","animals","annie","announce",
  "announced","announcement","annual","annually","another","answer","answered","anti","antique","anxiety",
  "any","anyone","anything","aoki","apart","apartment","apparatus","apparently","appeal","appealed",
  "appear","appeared","appearing","appears","apple","application","applications","applied","apply","applying",
  "appreciation","appropriate","approval","approved","approximately","april","arats","architect","architects","architecture",
  "are","area","areas","arena","argue","argued","aria","aristocrats","arm","arms",
  "army","arose","around","aroused","arrange","arrangements","arrival","arrive","arrived","arrows",
  "art","article","articles","artifacts","artillery","artist","artistic","artists","as","asia",
  "asian","asians","aside","ask","asked","asking","asleep","aspect","assembly","assist",
  "associated","association","assure","astronomical","at","ate","atmosphere","atolls","attached","attack",
  "attempt","attempting","attend","attendant","attendants","attended","attention","attitude","attitudes","attorney",
  "attract","attraction","audience","august","australia","australian","austria","author","authorities","auto",
  "automated","automation","automobiles","available","average","avis","avoid","award","aware","away",
  "awful","babies","baby","bach","back","background","bacteria","bad","badminton","bag",
  "bagmati","bahal","balance","balanced","baldridge","ball","bamford","bank","banker","bankers",
  "banking","banks","banquet","bar","barely","baroque","barrels","barriers","bars","base",
  "based","bases","basic","basin","basis","basketball","baskets","batch","bath","battle",
  "baumer","bay","be","beach","beaches","bear","beasts","beat","beatrice","beautiful",
  "beauty","became","because","become","becomes","becoming","been","beer","beethoven","before",
  "beg","began","begin","beginning","begun","behavior","behind","beijing","being","belfast",
  "belief","believe","believed","believes","bell","bellow","belong","below","bend","beneath",
  "benefit","benson","benz","bering","besides","best","better","between","beyond","bhaktapur",
  "bicycle","bid","bidding","big","bigger","biggest","bike","bill","billion","billionaire",
  "bills","bind","biotechnology","bird","birds","birth","birthday","bit","black","blame",
  "blanket","bless","blessing","blind","blinds","block","blocking","blow","blue","board",
  "boat","boating","boats","bodhnath","bodies","body","boise","bold","bomb","bond",
  "bonds","bones","bonuses","book","books","boom","boost","border","born","boss",
  "both","bottle","bottom","bound","boundaries","boundary","bourse","bow","box","boy",
  "boyish","branch","brand","brave","bread","break","breaking","breath","breathe","bribery",
  "bridge","brief","briefings","bright","bring","bringing","british","broad","broaden","broadway",
  "broke","broken","brokers","bronze","brother","brought","brown","buddha","buddhist","budget",
  "build","building","buildings","built","bullet","burden","bureau","bureaucratic","burma","burning",
  "burst","bus","buses","bush","business","businesses","businessman","busy","but","buy",
  "buyer","buyers","buying","buyout","buyouts","by","bytes","cabin","cable","cables",
  "cake","calculations","calendar","california","call","called","calls","calm","came","camp",
  "campaign","campaigns","campus","can","canada","canadian","cancer","candidates","cannot","cap",
  "capacity","capital","capricorn","captain","car","card","cards","care","cared","career",
  "carefully","caribbean","carried","carry","carrying","cars","carson","cart","carved","case",
  "cases","cash","cast","casual","catalog","catch","cattle","caught","cause","caused",
  "causes","causing","cave","ceiling","cell","cent","center","central","centre","centuries",
  "century","ceremonies","ceremony","cerf","certain","certainly","chain","chains","chairman","challenge",
  "challenges","championed","chan","chance","chances","chang","change","changed","changes","changing",
  "channel","chao","chapter","character","characters","charge","charged","charges","charity","charter",
  "chartered","cheap","cheaply","check","checked","checks","chemical","chemicals","chen","cheng",
  "chest","chi","chiang","chicago","chief","child","childhood","children","chin","china",
  "chinese","cho","choice","choose","choosing","chorus","chosen","christmas","chu","chung",
  "circle","cited","cites","cities","citizen","citizens","city","cla","claimed","claims",
  "class","classical","classroom","clavier","clean","cleaning","clear","clearly","clement","clerk",
  "client","clients","climate","climates","climbed","clock","clone","cloning","close","closed",
  "closely","clothes","cloud","club","clubs","clue","coal","coast","coat","cocaine",
  "code","coffee","coin","coined","coins","coke","cold","collar","collect","collection",
  "college","colonists","color","colour","coloured","colouring","combination","come","comes","comfort",
  "comfortable","coming","command","commander","comment","commented","comments","commerce","commercial","commission",
  "commissioned","commissions","commit","committee","common","commonwealth","communicate","communication","communist","communists",
  "community","commuter","companies","company","compared","compass","competition","competitions","competitive","competitors",
  "complete","completed","completely","completion","complex","complicated","components","compose","composed","composer",
  "composing","compression","computation","computer","computers","concepts","concern","concerned","concerto","concerts",
  "conclude","conclusion","concrete","condition","conditions","conference","confession","confidence","confident","conflict",
  "conflicts","connections","consequence","consequently","consider","considerable","considerably","consideration","considered","considering",
  "consignment","consistent","consists","constantly","constitute","constitution","constructed","construction","consumer","consumers",
  "consumption","contact","contain","contains","contamination","contemplating","content","contest","context","continental",
  "continue","continued","continuing","continuous","contract","contracts","contribute","contributing","control","controlled",
  "controls","controversial","controversy","convenience","convenient","conveniently","cook","cooked","cooking","cool",
  "cooperation","coordination","copper","copy","coral","cordell","core","corner","corp","corporate",
  "corporation","correct","corrupt","cosmetics","cost","costa","costs","cotton","could","couldn",
  "council","councilors","councils","count","counterpart","countries","country","county","couple","course",
  "courses","court","courts","cousin","cover","coverage","cows","crack","cracking","craft",
  "crafts","crammed","crawling","crazy","create","created","creates","creating","creation","creative",
  "creativity","creatures","credit","crew","cried","cries","crime","crimes","criminal","crisis",
  "critical","criticisms","crossing","crowd","crowded","crowds","crucial","cruise","cruising","crust",
  "cry","crystals","cultural","culturally","culture","cup","curb","curious","current","currently",
  "curse","custody","custom","customer","customers","cut","cutting","cycle","daily","damage",
  "damaged","damaging","dame","dance","danger","dangerous","dangerously","dangers","dare","daring",
  "dark","data","date","dated","daughter","day","days","dead","deal","deals",
  "dear","death","debate","debt","decade","decades","december","decent","decide","decided",
  "decision","declaration","declare","declared","decline","decrease","dedicated","deep","deeply","deer",
  "defend","defense","define","defined","degree","deities","delay","delegates","delegation","deliberately",
  "delightful","deliver","delivered","demand","demands","deming","democracy","demonstrates","denied","deny",
  "department","departments","departure","depend","dependence","depends","depth","depths","deputy","derived",
  "describe","described","description","desert","deserted","design","designed","designer","designing","desirous",
  "desk","despair","despite","destination","destiny","destroy","destroyed","destroying","destroys","destruction",
  "detail","details","detect","deter","determine","determined","devastated","develop","developed","developing",
  "development","developments","devote","dgbas","did","didn","die","died","diesel","difference",
  "differences","different","differently","difficult","difficulties","difficulty","diligence","dined","dinner","diplomatic",
  "direct","direction","directly","director","directors","dirty","disappear","disappearing","disaster","discharge",
  "discovered","discuss","discussed","disease","diseases","dismiss","disney","disorder","displaced","dispute",
  "dissidents","distance","distinguished","distribution","district","disturbed","divide","divided","divination","divine",
  "division","divisions","do","doctor","doctors","document","does","doing","dollar","dollars",
  "dome","domestic","dominated","don","donated","done","door","doors","double","doubled",
  "doubt","down","downfall","draft","dragged","dragon","dragons","drama","dramas","dramatic",
  "drawing","drawn","dream","dress","dressed","drink","drive","driven","driver","drivers",
  "drives","drop","dropped","dropping","drove","drug","drugs","due","dunkel","durbar",
  "during","duties","duty","dwell","dyes","dyestuffs","dying","dynasty","each","eager",
  "eagle","ear","earlier","early","earn","earnings","earth","earthquake","earthquakes","ease",
  "easier","easily","east","eastern","easy","eat","ebullience","echoing","ecological","ecology",
  "economic","economical","economically","economies","economy","edge","editor","editorial","editorials","educate",
  "education","educational","effect","effective","effects","efficient","efficiently","effort","efforts","egg",
  "eggs","eight","eign","either","elderly","elders","elect","elected","election","elections",
  "electrical","electricity","electronic","element","elements","elephants","eleventh","eliminate","eloquent","else",
  "embarrassed","embassy","emblazoned","emergency","emilia","emotional","emotionally","emperor","emphasize","empire",
  "employ","employee","employees","employment","emptiness","empty","enable","enables","enclose","enclosing",
  "encounter","encourage","encouraged","encouragement","end","endangered","endless","endorse","endorsed","enemy",
  "energy","enforced","engineered","engineering","engineers","england","english","enjoy","enjoyed","enormous",
  "enough","enrich","ensure","enter","entered","enterprise","enterprises","enters","entertain","enthusiastic",
  "enthusiasts","entire","entirely","entourage","entrance","entrepreneurs","entry","environment","environmental","epipsyche",
  "epipsychidion","episodes","equally","equator","equipment","equipped","era","error","escape","especially",
  "essay","essential","establish","established","establishing","estimate","estimated","etc","ethnic","europe",
  "european","europeans","evaluation","evaluations","even","evening","event","events","eventually","ever",
  "everlasting","every","everybody","everyone","everything","everywhere","evidence","evident","evoked","evolution",
  "evolving","evons","examine","example","examples","excellent","except","exception","exchange","excitement",
  "excuse","executive","executives","exercise","exhaust","exhibition","exhibitions","exhibits","exist","existed",
  "existence","expand","expanded","expanding","expect","expected","expense","expensive","experience","experienced",
  "experiences","experimental","experts","explain","explained","explanation","export","exported","exporter","exports",
  "expose","express","expressed","extend","extinct","extra","eye","eyes","fabrics","face",
  "faced","facilities","facility","facing","fact","factional","factions","factor","factories","factors",
  "factory","fail","failed","fair","fairly","fall","fallen","false","familiar","families",
  "family","famous","fan","far","farm","farmer","farmers","farming","farms","fascinated",
  "fashion","fast","fastened","faster","fastest","fat","fate","father","favor","favorite",
  "favourite","fear","feathers","feature","featured","february","feed","feel","feeling","feelings",
  "fees","feet","fell","fellow","felt","female","feng","festival","few","fewer",
  "fiction","field","fields","fifty","fight","figure","figures","fiji","file","fill",
  "filled","film","final","finally","finance","financial","financing","find","finding","fine",
  "fines","finest","finger","fingernails","finish","finished","fire","fires","firm","firms",
  "first","fish","fishermen","fishing","fit","five","fix","flash","flesh","flight",
  "floor","floors","flow","flower","flute","fly","flying","focus","fold","follow",
  "followed","following","food","foods","fool","foolish","foot","foothold","for","force",
  "forced","forces","fore","foreign","foreigners","foremost","forest","forget","forgotten","form",
  "formal","formed","former","forming","forms","formula","forth","fortune","forty","forward",
  "found","foundation","founder","fountain","four","fourth","frame","francisco","fraud","free",
  "freebase","freed","freedom","french","frequently","fresh","friday","friend","friendly","friends",
  "friendship","fright","frightened","from","front","fruit","fuel","fujian","full","fully",
  "fun","fund","fundamental","funded","funds","funny","furnished","furniture","further","furthermore",
  "future","futuristic","gain","galera","game","games","gap","garbage","garden","gas",
  "gasoline","gate","gates","gather","gathering","gave","gaza","general","generally","generated",
  "generating","generation","generous","genetic","genetically","gentle","genuine","geography","geomancy","german",
  "germany","get","getting","gettysburg","giant","giants","gift","gin","giovanni","girl",
  "give","given","giving","glad","glass","global","go","goal","god","goddess",
  "goes","going","gold","golden","gone","good","goods","got","government","governments",
  "governor","graceful","graduate","grant","grass","grateful","great","greater","greatest","greatly",
  "greek","green","greenery","grew","gross","ground","group","groups","grow","growing",
  "grown","growth","guaranteed","guard","guess","guest","guide","guy","habit","habits",
  "had","hair","half","halfway","hall","halls","hand","handicapped","handle","handling",
  "hands","handsome","hang","hangs","hangzhou","hanuman","happen","happened","happening","happiness",
  "happy","harbour","hard","harder","hardly","hardships","hardware","harm","harmful","harsh",
  "has","hasn","hau","have","having","hawaii","hawaiian","haydn","haze","he",
  "head","heading","headquarters","health","healthy","hear","heard","heart","hearty","heat",
  "heated","heating","heavy","height","held","hell","help","helped","helpful","helping",
  "helps","hemisphere","her","here","heritage","herself","hesitate","hidden","hide","hides",
  "high","higher","highest","highlights","highly","hijacked","hijackers","hijacking","hijackings","hill",
  "him","himself","hindu","hinterland","hippies","hiring","his","historic","historical","history",
  "hit","holbert","hold","holding","hole","holiday","holidays","holy","home","homeless",
  "homes","honesty","hong","honor","hope","hoped","hopeful","hopes","hoping","hormone",
  "horoscopes","horrible","horror","horse","horses","hospital","host","hosted","hot","hotel",
  "hotels","hour","hours","house","household","houses","housing","how","howard","however",
  "hsu","hualien","hualon","huang","huge","human","humblest","humor","hundred","hundreds",
  "hung","hungry","hunt","hunted","hunters","hurried","hurt","husband","hwa","hydrocarbons",
  "ice","idb","idea","ideal","ideas","if","ill","illegal","illiteracy","illiterate",
  "image","images","imagination","imaginative","imagine","immediate","immediately","immigration","immortal","impatient",
  "imperial","implication","import","importance","important","importation","imported","importer","importers","imports",
  "imposed","impossible","impression","impressive","improve","improved","improvement","improvements","improving","in",
  "inauguration","incentives","inch","inches","incinerators","include","included","includes","including","income",
  "incorporated","increase","increased","increasing","increasingly","incredible","indeed","index","india","indian",
  "indians","indicate","indicated","indicates","individual","individuals","indonesia","induce","industrial","industries",
  "industry","inflows","influence","influenced","information","informed","initial","injured","innocent","inscription",
  "insect","insecticide","insects","inside","insider","insists","inspect","inspections","inspiration","inspired",
  "installed","instance","instead","instinct","institute","institutional","institutions","instructions","instrument","instruments",
  "insufficient","insulin","insultingly","insurance","integration","intel","intelligently","intend","intensive","intention",
  "interest","interested","interesting","interfere","interior","intermediates","internal","international","internet","interview",
  "interviews","into","intra","introduced","introduction","invariably","invent","invention","invest","investigation",
  "investment","investments","investors","invite","invited","inviting","involve","involved","involves","ireland",
  "irish","iron","ironically","irritated","is","island","islands","islandwide","isn","isolated",
  "israel","issue","issues","issuing","it","italian","items","its","itself","jacket",
  "jail","jane","japan","japanese","jeou","jewels","jhochhen","job","jobs","joe",
  "john","johore","join","joined","joining","jojoba","joke","jolted","jordan","joseph",
  "journey","joy","judge","judges","judgment","judicial","july","jump","june","jungle",
  "junior","just","justice","kalabhairab","kaohsiung","kasthamandap","kat","katczinsky","kathmandu","keep",
  "keeping","keeps","kept","key","kick","kill","killed","killing","kilometers","kilowatts",
  "kind","kindly","kinds","king","kingdom","kings","kiribati","kit","kitchen","knew",
  "knife","knight","know","knowledge","known","knows","kong","korea","kuala","kumari",
  "kuo","kuomintang","kwong","labor","laborers","labour","lachrimosa","lack","lading","lady",
  "lai","lake","lakes","lam","land","landed","lane","lanes","langkawi","language",
  "languages","lanyu","large","larger","largest","last","late","later","latest","latter",
  "launch","lava","law","lawmakers","lawn","laws","lawyer","lawyers","lay","layer",
  "lead","leader","leaders","leading","leads","leaf","lean","leaning","learn","learned",
  "learning","least","leave","leaving","led","lee","left","leg","legal","legend",
  "lennon","leopold","less","lesser","lesson","let","letter","level","levels","liberty",
  "library","license","licensed","lie","lien","lies","life","lift","lifted","light",
  "lights","like","likely","lilliput","limestone","limited","lin","lincoln","line","lined",
  "lines","ling","lingering","lion","list","listen","listened","listening","literally","literature",
  "little","live","lives","living","load","local","locate","located","location","london",
  "lonely","long","longer","look","looked","looking","looks","lord","los","lose",
  "loss","lost","lot","lots","lotus","louis","love","loved","lovely","low",
  "lower","lowers","lowest","luck","lucky","lucrative","luddites","lumpur","lunch","lying",
  "lyrical","machine","machines","macy","made","magazine","magic","magnate","magnificent","mail",
  "main","mainland","mainly","maintain","maintained","maintains","major","majority","make","makers",
  "makes","making","makoto","malay","malaysia","malaysian","malcolm","male","malla","man",
  "manage","management","manager","managerial","managers","mandela","manifestation","manipulate","mankind","manner",
  "manufacture","manufactured","manufacturers","manufactures","manufacturing","many","map","march","margarine","marina",
  "marinas","mark","marked","market","marketing","markets","marks","marred","married","marry",
  "marshall","marvelous","mass","masses","massive","master","masterpiece","masters","match","material",
  "materials","matter","matters","mature","may","maybe","mayor","me","mean","meaning",
  "means","meanwhile","measure","measured","measuring","meat","medal","media","mediaeval","medical",
  "medicine","medium","meet","meeting","meetings","meets","megatrends","melanesia","melanesians","member",
  "members","memory","men","mental","mention","mentioned","menu","mercedes","mercy","mere",
  "merely","merit","message","met","metal","metals","metaphor","meters","method","methods",
  "metre","michael","michelangelo","michener","mickey","micronesia","microwave","microwaves","mid","middle",
  "midnight","midst","might","migration","mildendo","miles","military","milk","million","millionaire",
  "millions","mind","minds","mine","ming","minimum","minister","ministry","minor","minsheng",
  "minute","minutes","mirror","miserable","misgivings","miss","mission","missionaries","missionary","mixed",
  "mixture","mobile","model","models","modern","modest","moment","monday","money","monitor",
  "month","monthly","months","monument","monuments","moo","mood","moon","moral","more",
  "morning","mortal","most","mother","motor","mount","mountain","mountainous","mountains","mounted",
  "mouse","mouth","move","moved","movement","movements","moves","movie","moving","mozart",
  "much","multi","murder","muscles","museum","music","musical","musically","must","mutual",
  "mutually","muzium","my","myself","mystery","mysticism","naisbitt","name","named","names",
  "narrow","natasha","nation","national","nations","native","natural","naturally","nature","navy",
  "near","nearby","nearly","necessary","necessity","need","needed","needs","needy","negara",
  "neglected","negotiations","negotiators","neighbors","neikirk","neither","nepal","nepalese","nerve","nervous",
  "net","network","neumarkt","never","nevertheless","new","news","newspaper","newspapers","next",
  "nice","night","nights","nine","ninety","no","nobility","noble","nobody","noise",
  "non","none","noon","nor","norm","normal","north","northern","northwestern","nose",
  "not","notable","note","noted","notes","nothing","noticed","novel","november","now",
  "nowadays","number","numbers","numerous","object","objects","observers","observes","obstacles","obtain",
  "obtaining","obvious","occupation","occupied","occur","occurred","ocean","oceania","oceanic","oceans",
  "october","of","off","offenders","offenses","offer","offered","offers","office","officer",
  "officers","offices","official","officially","officials","offspring","often","oh","oil","old",
  "older","olympic","on","once","one","ones","ongoing","only","onto","open",
  "opened","opera","operas","operate","operates","operating","operation","operations","operators","opinion",
  "opportunity","oppose","opposed","opposite","optimism","option","or","orchestra","orchid","order",
  "ordered","orders","organic","organization","oriented","origin","original","osaka","ostp","other",
  "others","ought","oung","our","ourselves","ous","out","outdoor","output","outside",
  "oven","ovens","over","overall","overcrowded","overnight","overseas","own","owned","owner",
  "owners","ownership","oxygen","pace","pacific","package","packed","page","pages","pagoda",
  "paid","pain","painted","pair","pakistan","palace","pale","palestinian","pan","panic",
  "pantheon","paper","paradise","parallel","parent","parents","park","parks","parliaments","part",
  "participate","participation","particular","particularly","parties","partner","partners","parts","party","pass",
  "passed","passengers","passes","passing","past","patan","path","patient","pattern","paul",
  "pay","payment","payments","peace","peaceful","peak","pearl","pedestrians","pei","peitsun",
  "penetration","pennsylvania","pentium","people","peoples","per","percent","perfect","perfomers","perform",
  "performance","performances","performed","performers","performing","perhaps","period","periods","permanent","permanently",
  "permission","permit","permits","person","personal","personality","personally","persons","persuade","persuaded",
  "pervasive","pessimistic","peter","phase","philharmonic","philippine","philippines","philosophy","phone","phrase",
  "phuket","physical","physician","physicians","piano","picaresque","pick","picked","picture","piece",
  "pieces","pierre","pilot","ping","pisa","place","placed","places","plain","plan",
  "plane","plankton","planned","plans","plant","plants","platform","plausible","play","played",
  "playing","plays","pleasant","please","pleased","pleasure","plenty","plus","pocket","poem",
  "poet","poetry","point","pointed","points","poison","poisoned","pole","police","policeman",
  "policy","political","politics","polling","polls","polluted","pollution","polynesia","polynesian","polynesians",
  "pond","pool","poor","popular","population","port","portable","portables","pose","position",
  "positions","positive","possess","possibilities","possibility","possible","possibly","post","pot","potato",
  "potential","pound","pounds","pour","poverty","powder","power","powered","powerful","practical",
  "practice","practices","practitioners","precious","precise","precocious","predicted","predictions","prefer","preliminary",
  "premier","preparations","prepare","prepared","preparing","presence","present","presented","presently","president",
  "presidential","press","pressed","pressure","pretend","pretoria","pretty","prevent","previous","previously",
  "price","prices","pride","priests","primarily","primary","prime","prince","principal","principally",
  "principles","print","printed","priority","prison","prisoners","private","prize","probably","problem",
  "problems","procedure","procedures","proceed","process","processed","processes","processing","processor","processors",
  "prodigy","produce","produced","producers","produces","producing","product","production","productive","productivity",
  "products","profession","professional","profit","profits","program","programs","progress","project","projects",
  "prominent","promise","promised","promote","promotional","prompted","prone","pronunciation","proof","proper",
  "property","proportion","proposal","propose","proposed","prospect","prosperity","protect","protected","protection",
  "protects","protest","prove","proverb","provide","provided","provides","providing","province","provinces",
  "public","publication","publicly","published","publisher","puerto","pull","pulled","punish","punished",
  "purchase","pure","purpose","purse","pursuit","push","pushed","pushing","put","puts",
  "putting","qian","qiandao","quake","quakes","quality","quantities","quarter","quarters","question",
  "questioned","questions","quick","quickly","quiet","quietly","quit","quite","quotas","quote",
  "quoted","rabbit","race","races","radiation","radical","radio","rage","raiders","railway",
  "rain","rainforest","raise","raised","rally","ran","random","range","rank","raped",
  "rapid","rapidly","rapids","rare","rarely","rate","rates","rather","rating","ray",
  "rays","reach","reached","reaches","react","read","reading","readings","ready","real",
  "reality","realize","realizes","really","realm","reason","reasonable","reasons","rebuild","rebuked",
  "recall","receive","received","recent","recently","recognition","recognize","recognized","recommend","record",
  "records","recover","red","reduce","reducing","reefs","reference","references","refineries","reflect",
  "reform","refuse","refused","regard","regarded","regards","regatta","region","regional","register",
  "regret","regular","regularly","regulations","reiterated","reject","rejects","relations","relatively","relatives",
  "relax","release","released","releases","reliable","relieved","religion","religious","rely","remain",
  "remained","remaining","remains","remarks","remember","remind","remote","remove","renaissance","renowned",
  "repatriation","repeat","repeatedly","replace","replaced","reply","report","reported","reporter","reporters",
  "reports","represent","reproduce","republic","reputation","request","requested","requiem","require","required",
  "requirements","requires","requisite","rescue","research","researchers","reserves","residents","resist","resources",
  "respect","respite","respond","response","responsible","rest","restrictions","restructuring","result","resulted",
  "results","retailer","retailing","retire","return","returned","returns","reunification","review","revisions",
  "revolution","rica","rich","richard","richter","ride","riders","ridge","right","rights",
  "ring","rise","rising","risk","risks","rival","river","rivers","road","robes",
  "robots","roc","rock","rocks","role","roll","roman","romance","rome","roof",
  "room","roosevelt","ropes","rose","rough","roughly","round","rounds","route","routes",
  "row","royal","rucken","ruin","rule","ruled","rules","ruling","run","running",
  "runs","rural","rush","rushed","sacred","sacrifice","sad","saens","safe","safer",
  "safety","said","sail","sailed","sailing","sailors","sails","saint","sake","salaries",
  "salary","sale","sales","salieri","salt","same","samoa","samples","san","sand",
  "sandy","santa","satellite","satisfaction","satisfied","satisfy","saturday","save","saved","saw",
  "say","saying","says","scale","scarcer","scenario","scene","scenes","scheduled","schive",
  "scholar","school","schools","schwartz","science","scientific","scientist","scientists","score","screen",
  "script","sculpture","sea","search","seas","season","seat","seats","seavey","sec",
  "second","seconds","secret","secretary","section","sector","securities","security","sedan","sedans",
  "see","seed","seeing","seek","seeking","seem","seemed","seems","seen","sef",
  "seize","seldom","select","selection","self","sell","seller","selling","sells","semiskilled",
  "send","sending","sends","senior","sense","sent","sentence","separate","separated","serious",
  "seriously","servants","serve","service","services","session","set","setting","settle","settled",
  "settlement","seven","several","severe","sewage","shade","shadow","shaffer","shake","shakespeare",
  "shaking","shall","shallow","shan","shape","shaped","share","sharing","sharp","sharply",
  "shaykin","she","shelf","shelley","shelter","shelters","shewart","shi","shifts","shin",
  "ship","shipment","ships","shirt","shirts","shiva","shoe","shook","shoot","shop",
  "shopping","shore","short","shortage","shot","should","shouted","show","showed","showing",
  "shown","shows","shu","shui","shut","shy","sick","side","sides","sight",
  "sighting","sign","signals","signed","significant","signing","silence","silent","silk","silver",
  "similar","similarly","simple","simplified","simply","since","sing","singapore","singer","singers",
  "single","sink","sir","sister","sit","site","sitting","situated","situation","six",
  "sixties","size","sized","skill","skilled","skills","sky","slash","slave","slavery",
  "slaves","sleep","slide","slight","slow","slowly","small","smaller","smell","smile",
  "smilingly","smith","smog","smoke","so","soap","soared","social","societies","society",
  "soft","software","soil","sold","soldier","soldiers","solid","solo","solve","some",
  "somebody","somehow","someone","something","sometimes","somewhat","somewhere","son","song","songs",
  "sons","soon","sort","sought","soul","sound","source","sources","south","southeast",
  "southeastern","southern","southwestern","sovereign","soviet","space","span","spanish","speak","speaker",
  "speakers","speaking","special","specialize","specialized","species","specific","specification","speech","speed",
  "spencer","spend","spending","spends","spent","spice","spire","spirit","spirits","spiritual",
  "spite","splinter","split","spoken","spokesman","sport","sports","spot","spray","sprayed",
  "spread","spring","square","squarely","stable","staff","staffs","stage","stages","stance",
  "stand","standard","standards","standing","stands","star","stare","stars","start","started",
  "starting","state","statement","states","station","stations","statistical","statistics","statue","statues",
  "status","stay","steady","steal","steam","steel","steep","stencil","step","stepped",
  "steps","stereo","stick","sticky","still","stimulated","stirring","stock","stocks","stomach",
  "stone","stones","stood","stop","stopped","stopping","storage","store","stored","stores",
  "stories","storm","story","straight","strait","straits","strange","strategic","strategy","strauss",
  "stream","streams","street","streets","strength","strengthen","stress","stretch","strict","strike",
  "string","strip","strive","strong","strongly","struck","structure","structures","struggle","stuck",
  "student","students","studied","studies","studio","study","studying","stupa","style","subdivided",
  "subject","subjects","submitted","subsequently","subsidence","subsidiaries","subsidies","substance","substances","substantial",
  "substitution","subway","succeed","success","successful","successfully","successive","such","suddenly","suffer",
  "suffered","suffering","sufficient","suggest","suggested","suit","suitable","suited","sulphur","sumatra",
  "summer","summit","sun","sunday","sundays","supervisors","supplied","suppliers","supplies","supply",
  "support","supported","supports","suppose","supposed","sure","surface","surplus","surprise","surprised",
  "surrounding","survival","survive","surviving","suspects","suspension","suspicious","sustained","swayambhunath","sweat",
  "sweeping","sweet","swept","swim","swimming","switch","symbol","symbolism","sympathy","symphony",
  "synthetic","system","systems","table","tahan","taichung","taipei","taiwan","taiwanese","take",
  "taken","takes","taking","tale","talented","tales","talk","talked","talking","tall",
  "tallest","taman","tank","tanker","tape","tar","tariffs","task","taste","taught",
  "tax","taxes","tea","teach","teacher","teachers","teaching","team","tears","tech",
  "technical","technique","techniques","technological","technologies","technology","teh","telegraphic","telephone","tell",
  "telling","temperature","temple","temporary","ten","tend","tenders","tends","teng","term",
  "terminal","terms","terrible","terrifying","terror","test","tested","testified","texas","text",
  "textile","textiles","thai","thailand","than","thank","thanksgiving","that","the","theater",
  "their","them","theme","themselves","then","theory","there","thereafter","therefore","these",
  "they","thick","thin","thing","things","think","third","thirty","this","those",
  "though","thought","thoughts","thousand","thousands","threat","threatened","threatening","three","thriving",
  "through","throughout","throw","throwing","thrown","thumb","thursday","thus","tibet","tibetan",
  "tibetans","ticket","tide","tied","ties","tiger","till","tim","time","times",
  "tiny","tip","tired","title","to","today","together","tokyo","told","tom",
  "tomorrow","tonga","tongue","tonight","tons","too","took","tool","tools","top",
  "topic","tops","total","totally","touch","tough","tour","tourism","tourist","tourists",
  "toward","towards","tower","towers","town","track","trade","trading","tradition","traditional",
  "traditions","traffic","tragedy","trails","train","training","transaction","transfer","transferred","transit",
  "travails","travel","traveled","travelers","traveling","treat","treated","tree","trees","tremble",
  "trend","trends","trendy","trial","tried","trip","trips","tropic","tropical","trouble",
  "truck","true","truly","trust","truth","try","trying","tube","tuesday","tuition",
  "tunnel","turkey","turn","turned","turning","turnover","turns","tween","twelve","twentieth",
  "twenty","twice","two","type","types","typical","ugly","ultimately","umbrella","unable",
  "uncle","under","understand","understanding","understands","understood","undertaken","unemployment","unexpected","unfair",
  "unforgettable","unification","unified","uniform","union","unions","unique","unit","united","units",
  "universe","universities","university","unknown","unless","unlike","unlikely","unnatural","unskilled","until",
  "unusual","up","upcoming","upgrading","upon","upper","upset","upward","urban","urge",
  "urged","us","use","used","useful","user","users","uses","using","usual",
  "usually","vacation","vacations","vain","valley","valuable","value","values","van","vantage",
  "variations","variety","various","vast","vegetable","vegetables","venues","verdict","version","very",
  "vice","victim","victims","victory","vienna","vietnam","view","viewed","views","villa",
  "village","villages","violence","violent","violently","virgin","virtually","virtue","vishnu","vision",
  "visit","visited","visiting","visitor","visitors","visual","vocabulary","voice","volcanic","volcanism",
  "volcanoes","volume","vote","votes","voting","vowed","voyage","wag","wage","wages",
  "waiters","waiting","wake","walk","walked","walking","walks","wall","walls","walt",
  "walter","wang","want","wanted","wants","war","ward","warm","warming","warned",
  "warning","was","wash","washington","wasn","waste","wastes","watanabe","watch","watchdog",
  "watched","watching","water","waters","wave","waves","wax","way","ways","we",
  "weak","wealth","wealthy","weapons","wearing","weather","wednesday","week","weeks","weighed",
  "weight","welcome","welfare","well","wen","went","were","west","western","wet",
  "whale","whalers","whales","whaling","what","whatever","wheat","when","where","whereas",
  "whether","which","while","white","whitney","who","whole","wholly","whom","whose",
  "why","wide","widely","widespread","wife","wild","wildlife","will","william","willing",
  "wills","win","wind","window","windows","winning","winter","wisdom","wish","wishes",
  "witch","with","within","without","woke","woman","women","won","wonderful","wood",
  "wooden","word","words","work","worked","workers","workforce","working","workmen","workplace",
  "works","workshop","world","worried","worries","worry","worse","worst","worth","would",
  "wouldn","wound","wounded","write","writers","writing","written","wrong","wrote","yacht",
  "yachting","yachts","yachtsmen","yard","year","years","yeasts","yeh","yes","yesterday",
  "yet","yield","ying","york","you","young","younger","youngest","your","yourself",
  "youth","yuan","yung","zaide","zealand","zone"
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
// A unit's `display` is its hanzi, or — for a punctuation unit — just the
// punctuation mark itself. This pulls the bare hanzi back out of a display
// string so the 候選字 system never leaks anything extra.
function bareHanzi(display) {
  const m = (display || '').match(/[一-鿿]/);
  return m ? m[0] : display;
}

// Explicit key for every full-width Chinese punctuation mark that has NO
// Unicode "Fullwidth Forms" counterpart (punctTypingKey below handles the
// ones that do, algorithmically). Chosen to match how a real IME keys
// these: the ASCII shape typed to produce each one, same key reused for a
// mark's open/close pair since only one is ever expected at a given spot.
const EXPLICIT_PUNCT_KEY_MAP = {
  '。': '.',              // ideographic full stop
  '、': '\\',             // enumeration comma — the backslash key in Rime
  '「': '[', '」': ']',     // corner brackets
  '『': '{', '』': '}',     // white corner brackets
  '《': '<', '》': '>',     // book title brackets
  '“': '"', '”': '"',      // double quotes (Rime alternates open/close on the same key)
  '‘': "'", '’': "'",      // single quotes (same idea)
  '—': '_',               // em dash (Rime types two: ——)
  '…': '^', '⋯': '^',      // ellipsis (Rime types two: ……)
  '·': '|', '‧': '|',      // interpunct
};

// Full-width versions of ASCII punctuation (， ？ ！ ： ； （ ） ～ etc.) sit in
// Unicode's Fullwidth Forms block at a fixed +0xFEE0 offset from the plain
// ASCII key that produces them in a real IME — so this covers all of them
// without needing to list each one by hand. Falls back to the explicit
// table above for CJK-only marks, then to the spacebar as a last resort so
// literally every punctuation character in an article is typable, never
// silently given away for free.
function punctTypingKey(ch) {
  const code = ch.charCodeAt(0);
  if (code >= 0xff01 && code <= 0xff5e) {
    const mapped = String.fromCharCode(code - 0xfee0);
    // Fullwidth digits (０-９) also live in this range — skip them so they
    // can never collide with the 候選字 number-key / page-flip controls.
    if (!/[0-9]/.test(mapped)) return mapped;
  }
  return EXPLICIT_PUNCT_KEY_MAP[ch] || null;
}

function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


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
      units.push({ display: ch, pinyin: toned, input: plain, boundary: cumulative, isPunct: false });
    } else if (/\s/.test(ch) || ch === '　') {
      // Invisible whitespace (including the fullwidth ideographic space):
      // never needs typing, so it's simply skipped rather than turned into
      // a unit or glued onto anything.
      continue;
    } else {
      // EVERY other symbol — standard Chinese punctuation, a fullwidth
      // ASCII look-alike, or anything unrecognized — becomes its own
      // typable unit. Nothing is free; the key to press is shown above it
      // the same way pinyin is shown above a hanzi. No candidate selection
      // either — there's only one possible key, so nothing to choose
      // between.
      const mapped = punctTypingKey(ch);
      const key = mapped || ' ';
      cumulative += key.length;
      // `free` marks symbols no input method can produce (digits, Latin
      // letters, exotic marks) — only the built-in mode asks for a spacebar
      // press; with the real Rime engine they're skipped automatically.
      units.push({ display: ch, pinyin: mapped ? key : '␣', input: key, boundary: cumulative, isPunct: true, free: !mapped });
    }
  }
  if (units.length === 0) return null;
  // Reject if any hanzi's pinyin couldn't be resolved to plain a-z letters
  // (very rare/variant characters) — better to skip it than spawn an
  // impossible-to-type zombie. Punctuation units are always valid by
  // construction, so they skip this check.
  if (units.some(u => !u.isPunct && !/^[a-z]+$/.test(u.input))) return null;
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
  // 如果單一句子（用 。！？；，、： 斷句）不到10個字，就跟下一句合併，
  // 直到湊滿至少10個中文字為止，確保每篇文章都能產生 Hard 題目。
  const seenSentences = new Set();
  articles.forEach(a => {
    const raw = a.content.replace(/\r?\n/g, '');
    // 用句號與逗號等斷開，湊滿 10 字就出題，避免整段長文一次出現
    const sentences = raw.split(/(?<=[。！？；，、：])/).map(s => s.trim()).filter(Boolean)
      // 單句過長（超過 16 個字）就每 12 字切一段，題目不會長到打不完
      .flatMap(s => (s.match(/[\u4e00-\u9fff]/g) || []).length > 16 ? (s.match(/.{1,12}/g) || [s]) : [s]);
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

// ── 中文-文章：依文章「出現的先後次序」排好的題目（讓學生有機會默默背下文章）──
// Easy：文章裡的每個國字，照順序一個一個出（重複的字也照出）
// Medium：每段連續中文字依序切成 3~5 字的片段（不跨標點）
// Hard：句子（至少10字），跟原本一樣的斷句方式，但照文章順序出、不去重
// 這裡只存「字串」，真正的拼音單位等到出怪時才算（見 _nextArticleItem），所以載入不會變慢。
function buildArticleSequences(articles) {
  const seq = { Easy: [], Medium: [], Hard: [] };
  (articles || []).forEach(a => {
    const content = String(a.content || '');
    for (const ch of content) if (isHanzi(ch)) seq.Easy.push(ch);

    (content.match(/[\u4e00-\u9fff]+/g) || []).forEach(run => {
      let n = run.length, pos = 0;
      if (n < 3) return;
      while (n > 0) {
        let take = n <= 5 ? n : 4;
        if (n > 5 && n - 4 < 3) take = 3;   // 避免剩下 1~2 個字的零碎片段
        seq.Medium.push(run.slice(pos, pos + take));
        pos += take; n -= take;
      }
    });

    const raw = content.replace(/\r?\n/g, '');
    const sentences = raw.split(/(?<=[。！？；，、：])/).map(x => x.trim()).filter(Boolean)
      .flatMap(x => (x.match(/[\u4e00-\u9fff]/g) || []).length > 16 ? (x.match(/.{1,12}/g) || [x]) : [x]);
    let buffer = '', cnt = 0;
    sentences.forEach(x => {
      buffer += x;
      cnt += (x.match(/[\u4e00-\u9fff]/g) || []).length;
      if (cnt >= 10) { seq.Hard.push(buffer); buffer = ''; cnt = 0; }
    });
  });
  return seq;
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
  // （預設不勾選）。用「固定的 id」判斷每一篇內建文章存不存在，所以：
  // - 瀏覽器裡完全沒存過文章 → 全部補進來
  // - 瀏覽器裡已經有舊資料（例如之前版本編碼判斷錯誤存下來的亂碼內容）
  //   → 一樣會把內建文章用正確內容補上/更新，不會被舊資料卡住
  // 老師自己額外上傳、或刪除「非內建」文章的狀態，都不會被這裡影響。
  _seedBuiltinArticles() {
    const builtin = [].concat(
      Array.isArray(window.BUILTIN_ARTICLES) ? window.BUILTIN_ARTICLES : [],
      Array.isArray(window.BUILTIN_ENGLISH_ARTICLES) ? window.BUILTIN_ENGLISH_ARTICLES : []   // 英文-文章 模式用
    );
    if (builtin.length === 0) return;
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
    });
    // 預設一篇都不勾選：一次性把舊版「預設全選」的紀錄清掉，之後老師自己勾選的會被記住
    try {
      if (!localStorage.getItem('zombieTyping_defaultNoneSelected')) {
        this.selectedIds = [];
        localStorage.setItem('zombieTyping_defaultNoneSelected', '1');
        changed = true;
      }
    } catch (e) { /* ignore */ }
    if (changed) this._save();
  }

  _loadFromStorage() {
    try {
      const raw = localStorage.getItem('zombieTyping_articles');
      this.articles = raw ? JSON.parse(raw) : [];
    } catch (e) { this.articles = []; }
    try {
      const rawSel = localStorage.getItem('zombieTyping_articleSelection');
      this.selectedIds = rawSel ? JSON.parse(rawSel) : [];
    } catch (e) { this.selectedIds = []; }
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

  // kind: 'zh' 只取中文文章、'en' 只取英文文章；不給就全部
  getSelectedArticles(kind) {
    const list = this.articles.filter(a => this.selectedIds.includes(a.id));
    if (kind === 'zh') return list.filter(a => /[\u4e00-\u9fff]/.test(a.content));
    if (kind === 'en') return list.filter(a => !/[\u4e00-\u9fff]/.test(a.content));
    return list;
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

// 一隻怪物的「字量」：中文＝字數；英文＝字母數 / 4（4 個字母算 1 單位）
function entityWork(item) {
  if (item && item.isChinese && item.units && item.units.length) return item.units.length;
  const len = item && item.word ? String(item.word).length : 4;
  return Math.max(0.5, len / 4);
}

// 英文-文章：從勾選的英文文章裡取單字，依長度分 Easy(3-4字母) / Medium(5-7) / Hard(8-13)
function buildEnglishPools(articles) {
  const pools = { Easy: [], Medium: [], Hard: [] };
  const seen = new Set();
  (articles || []).forEach(a => {
    const text = String(a.content || '').replace(/-\s*\n\s*/g, '');
    (text.match(/[A-Za-z]+/g) || []).forEach(w => {
      w = w.toLowerCase();
      if (seen.has(w) || w.length < 3 || w.length > 13 || !/[aeiouy]/.test(w)) return;
      seen.add(w);
      const item = { word: w, isChinese: false };
      if (w.length <= 4) pools.Easy.push(item);
      else if (w.length <= 7) pools.Medium.push(item);
      else pools.Hard.push(item);
    });
  });
  return pools;
}

function getWordForCategory(category, difficulty = 'Medium', extra = {}) {
  if (category === 'english_article') {
    const pool = (extra.englishPools || {})[difficulty];
    if (!pool || pool.length === 0) return getWordForCategory('easy_words', difficulty);
    return pool[Math.floor(Math.random() * pool.length)];
  }
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

    // 可愛版預設圖（cute-sprites.js，Canva 製作）：同樣 64x64 繪製、不改任何玩法；
    // 沒載入或圖片壞掉時，仍使用上面原本的程式繪圖。
    const cute = window.CUTE_SPRITES;
    if (cute) {
      for (const key in cute) {
        if (!this.defaultCanvases[key]) continue;
        const cimg = new Image();
        const fallback = this.defaultImages[key];
        this.defaultImages[key] = fallback;           // 載入完成前先用舊圖
        cimg.onload = () => { this.defaultImages[key] = cimg; this.updatePreviews && this.updatePreviews(); };
        cimg.src = cute[key];
      }
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
let W = 916, H = 500;   // H 在手機精簡版會變小（見 setCompact）
let LANE_COUNT = 5, LANE_BASE = 120, LANE_STEP = 72;
const LANE_Y = (lane) => LANE_BASE + (lane - 1) * LANE_STEP;
const BARRICADE_LEFT_X = 200;
const BARRICADE_RIGHT_X = 716;
// 怪物出現的節奏：起步比較慢（一隻一隻慢慢來），過關後才會逐漸加快
// （見下面的升級加速與同時在場數量上限）。
const DIFFICULTY_DELAYS = { Easy: 10000, Medium: 8000, Hard: 5500 };
const MIN_SPAWN_DELAY = 1400; // 加速的下限，避免後面的關卡變成不可能完成

// 候選字設定：每個字有 18 個候選字，一頁 9 個，共 2 頁（按 0 或點頁碼換頁）。
const CANDIDATE_TOTAL = 18;
const CANDIDATES_PER_PAGE = 9;
// 選單上的三個難度（簡易/普通/挑戰）對應到程式內部使用的名稱
const DIFFICULTY_KEYS = ['Easy', 'Medium', 'Hard'];
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
// 畫面上所有中文字統一使用的字型
const UI_FONT = '"Outfit", "Microsoft JhengHei", "PingFang TC", "Noto Sans TC", sans-serif';
// 主選單版面（繪圖與點擊判斷共用，避免兩邊對不上）
const MENU_LAYOUT = {
  diff: { w: 120, h: 40, gap: 10, y: 222 },
  cat: { w: 140, h: 40, gap: 10, y: 292, rowGap: 8, perRow: 4 },
  play: { w: 240, h: 52, cy: 438 },
};

// ── Game ─────────────────────────────────────────────────────
// ── RIME input method (the engine behind 小狼毫/Weasel) ────────────────────
// The real librime engine, compiled to WebAssembly, with the 朙月拼音
// dictionary. Everything it needs lives in the rime/ folder as asset-*.js
// files (base64), so nothing has to be installed and it also works when
// index.html is opened straight from disk. If anything fails to load, the
// game quietly falls back to its built-in 候選字 mode.
class RimeIME {
  constructor() {
    this.status = 'idle'; // idle | loading | ready | failed
    this.error = null;
    this._promise = null;
  }

  load() {
    if (this._promise) return this._promise;
    this.status = 'loading';
    this._promise = this._load()
      .then(() => { this.status = 'ready'; })
      .catch(err => {
        this.status = 'failed';
        this.error = String(err && err.message || err);
        console.warn('Rime IME unavailable, using built-in mode:', this.error);
      });
    return this._promise;
  }

  _script(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('cannot load ' + src));
      document.head.appendChild(s);
    });
  }

  async _load() {
    const assetNames = [
      'rime.wasm', 'rime.data',
      'luna_pinyin.prism.bin', 'luna_pinyin.table.bin',
      'luna_pinyin.reverse.bin', 'luna_pinyin.schema.yaml',
    ];
    // 六個大檔同時下載（原本是一個接一個），並記錄已完成幾個，給選單顯示進度
    this.loadedCount = 0;
    this.totalCount = assetNames.length;
    this.loadStartedAt = Date.now();
    await Promise.all(assetNames.map(n =>
      this._script('rime/asset-' + n.replace(/\./g, '_') + '.js').then(() => { this.loadedCount++; })
    ));
    const A = window.RIME_ASSETS || {};
    const toBytes = (b64) => {
      const bin = atob(b64);
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    };
    const wasmBinary = toBytes(A['rime.wasm']);
    const dataBuf = toBytes(A['rime.data']).buffer;

    window._deployStatus = function () {};
    await new Promise((resolve, reject) => {
      window.Module = {
        wasmBinary,
        getPreloadedPackage: () => dataBuf,
        locateFile: (p) => 'rime/' + p,
        print() {}, printErr() {},
        onRuntimeInitialized: resolve,
        onAbort: (m) => reject(new Error('wasm abort ' + m)),
      };
      this._script('rime/rime.js').catch(reject);
    });

    const M = this.M = window.Module;
    const FS = M.FS;
    try { FS.mkdir('/rime'); } catch (e) { /* already there */ }
    try { FS.mkdir('/usr/share/rime-data/build'); } catch (e) { /* already there */ }
    for (const n of assetNames.slice(2)) {
      FS.writeFile('/usr/share/rime-data/build/' + n, toBytes(A[n]));
    }
    delete window.RIME_ASSETS; // free the big base64 strings
    M.ccall('init', 'null', [], []);
    M.ccall('set_ime', 'null', ['string'], ['luna_pinyin']);
    M.ccall('set_page_size', 'null', ['number'], [5]);
  }

  _parse(s) {
    try { return typeof s === 'string' ? JSON.parse(s) : s; } catch (e) { return null; }
  }

  // Feed one key, using librime key names ("a", " ", ",", "{BackSpace}", "{Return}", "{Escape}")
  key(k) { return this._parse(this.M.ccall('process', 'string', ['string'], [k])); }
  select(i) { return this._parse(this.M.ccall('select_candidate_on_current_page', 'string', ['number'], [i])); }
  // backward=false -> next page, true -> previous page
  page(backward) { return this._parse(this.M.ccall('change_page', 'string', ['boolean'], [!!backward])); }
  reset() { try { this.key('{Escape}'); } catch (e) { /* ignore */ } }
}

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
    this._initDemo();

    this.state = 'MENU'; // MENU | PLAYING | PAUSED | GAME_OVER | WAVE_COMPLETE | HORDE_INTRO
    this.menuSelection = {
      difficulty: 'Medium',
      category: 'easy_words',
      difficultyIndex: 1,
      categoryIndex: 0,
    };
    this.difficulties = ['簡易版', '普通版', '挑戰版'];
    this.categories = [
      { id: 'easy_words', label: '簡單單字' },
      { id: 'hard_words', label: '困難單字' },
      { id: 'home_row', label: '中列' },
      { id: 'top_row', label: '上列' },
      { id: 'bottom_row', label: '下列' },
      { id: 'chinese', label: '中文拼音' },
      { id: 'chinese_article', label: '中文-文章' },
      { id: 'english_article', label: '英文-文章' },
    ];

    // 中文-文章 mode: word pools built from the selected uploaded articles
    this.articlePools = { Easy: [], Medium: [], Hard: [] };
    this._articlePoolsKey = null;
    this.englishPools = { Easy: [], Medium: [], Hard: [] };   // 英文-文章 mode
    this._englishPoolsKey = null;
    // 中文-文章：依文章次序出字。seqIdx＝下一個要出的題目編號；死掉時記下「最早沒打掉的那題」，可選擇接續
    this.articleSeq = null;
    this._articleSeqKey = null;
    this.seqIdx = 0;
    this._seqUnitCache = new Map();
    this._resume = null;   // { key, idx }
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
        y: LANE_Y(Math.floor(Math.random() * LANE_COUNT) + 1),
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

    // 中文輸入：小狼毫（Rime）輸入引擎；載入不了就自動改用內建的候選字選字模式
    this.rime = new RimeIME();      // 真正的小狼毫引擎（見 RimeIME）
    this.rimeActive = false;        // 這一場遊戲是否由 Rime 負責輸入
    this.imeState = null;           // Rime 最近一次回報的拼音／候選字狀態
    this._imeToast = null;
    this.candidatePage = 0;         // 內建候選字模式：目前顯示第幾頁
    setTimeout(() => this.rime.load(), 300);

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

  // 手機精簡版：只剩 2 道、畫面變矮，這樣整個畫面可以放大（只能在主選單切換）
  setCompact(on) {
    if (!!on === !!this.compact) return false;
    LANE_COUNT = on ? 2 : 5;
    LANE_BASE = on ? 118 : 120;
    LANE_STEP = on ? 96 : 72;
    H = on ? 330 : 500;
    this.canvas.height = H;
    this.compact = !!on;
    return true;
  }

  // ── Input ────────────────────────────────────────────────
  _bindInput() {
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      // Toggle Pause with Escape or 'p'/'P'
      if (e.key === 'Escape') {
        if (this.state === 'PLAYING' && this.rimeActive && this.imeState && this.imeState.body) {
          // 跟真的輸入法一樣：Esc 先取消正在打的拼音
          this._applyRimeResult(this.rime.key('{Escape}'));
          this.imeState = null;
          return;
        }
        if (this.state === 'PLAYING') {
          this.togglePause();
          return;
        } else if (this.state === 'PAUSED') {
          this.togglePause();
          return;
        }
      }

      if (this.state === 'MENU') {
        // 中文-文章：按 C 從上次背到的地方接續（紀錄在學生存檔裡，換電腦也有）
        if ((e.key === 'c' || e.key === 'C') && this._storedResume()) {
          this._resume = this._storedResume();
          this._startGame(true);
          return;
        }
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

    // 用 pointerdown：滑鼠、手指、觸控筆都能點（手機不用等 300ms）
    this.canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
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
      this.menuSelection.difficulty = DIFFICULTY_KEYS[this.menuSelection.difficultyIndex];
      this.audio.menuClick();
    }
    if (e.key === 'ArrowRight') {
      this.menuSelection.difficultyIndex = Math.min(2, this.menuSelection.difficultyIndex + 1);
      this.menuSelection.difficulty = DIFFICULTY_KEYS[this.menuSelection.difficultyIndex];
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

    if (this.rimeActive && this._handleRimeKey(e)) return;

    if (e.key === 'ArrowUp' && p.lane > 1) {
      p.lane--;
      this.targetedEnemies = [];
    } else if (e.key === 'ArrowDown' && p.lane < LANE_COUNT) {
      p.lane++;
      this.targetedEnemies = [];
    } else if (e.key === 'ArrowLeft' && p.dir > 0) {
      p.dir = -1;
      this.targetedEnemies = [];
    } else if (e.key === 'ArrowRight' && p.dir < 0) {
      p.dir = 1;
      this.targetedEnemies = [];
    } else if (e.key === 'Enter') {
      this._usePowerup();
    } else if (e.key === '0' && this._getFlatCandidates().length > CANDIDATES_PER_PAGE) {
      // "0" flips between the 候選字 pages (9 candidates per page, 18 total)
      // — like pressing + / page-down in a real input method to see more
      // candidates when the right one isn't on the first page.
      const totalPages = Math.ceil(this._getFlatCandidates().length / CANDIDATES_PER_PAGE);
      this.candidatePage = (this.candidatePage + 1) % totalPages;
      this.audio.menuClick();
    } else if (/^[1-9]$/.test(e.key) && this._getVisibleCandidates().length > 0) {
      // Number keys 1-9 pick a candidate from the current 候選字 page, same
      // as a real pinyin input method (type the sound, press the digit to
      // choose the character you meant).
      const n = parseInt(e.key, 10);
      const visible = this._getVisibleCandidates();
      if (visible[n - 1]) this._confirmUnitCandidate(visible[n - 1].entity, visible[n - 1].char);
    } else if (e.key.length === 1 && /[a-zA-Z0-9,.\/';\-=\[\]\\`~ !@#$%^&*()_+{}|:"<>?]/.test(e.key)) {
      this._handleTyping(e.key.toLowerCase());
    }
  }

  // 第 i 個「練習內容」按鈕的位置（兩排，每排最多 4 個，置中）
  _menuCatRect(i) {
    const L = MENU_LAYOUT.cat;
    const row = Math.floor(i / L.perRow);
    const col = i % L.perRow;
    const inRow = Math.min(L.perRow, this.categories.length - row * L.perRow);
    const rowW = inRow * L.w + (inRow - 1) * L.gap;
    return { x: (W - rowW) / 2 + col * (L.w + L.gap), y: L.y + row * (L.h + L.rowGap), w: L.w, h: L.h };
  }

  _handleClick(mx, my) {
    if (this.state === 'MENU') {
      const L = MENU_LAYOUT;
      // 開始按鈕
      if (mx > W/2 - L.play.w/2 && mx < W/2 + L.play.w/2 && my > L.play.cy - L.play.h/2 && my < L.play.cy + L.play.h/2) {
        this._startGame();
        return;
      }
      // 難度按鈕
      const dTotal = this.difficulties.length * L.diff.w + (this.difficulties.length - 1) * L.diff.gap;
      this.difficulties.forEach((d, i) => {
        const bx = (W - dTotal) / 2 + i * (L.diff.w + L.diff.gap);
        if (mx > bx && mx < bx + L.diff.w && my > L.diff.y && my < L.diff.y + L.diff.h) {
          this.menuSelection.difficultyIndex = i;
          this.menuSelection.difficulty = DIFFICULTY_KEYS[i];
          this.audio.menuClick();
        }
      });
      // 練習內容按鈕
      this.categories.forEach((c, i) => {
        const r = this._menuCatRect(i);
        if (mx > r.x && mx < r.x + r.w && my > r.y && my < r.y + r.h) {
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
      const canResume = !!this._resume;
      // 中文-文章：上面「接續上次進度」、下面「重頭開始」；其他模式維持原本「再玩一次」
      if (mx > W/2 - 130 && mx < W/2 + 130 && my > 310 && my < 360) {
        this._startGame(canResume);
      }
      if (canResume && mx > W/2 - 130 && mx < W/2 + 130 && my > 365 && my < 405) {
        this._startGame(false);
      }
      const menuTop = canResume ? 412 : 370;
      if (mx > W/2 - 130 && mx < W/2 + 130 && my > menuTop && my < menuTop + 40) {
        this.returnToMenu();
      }
    } else if (this.state === 'PLAYING') {
      // 候選字列：點選候選字（Rime 小狼毫視窗，或內建的選字列）
      const barHit = (this._candidateBarHitboxes || []).find(h =>
        mx >= h.left && mx <= h.right && my >= h.top && my <= h.bottom
      );
      if (barHit && barHit.rime) {
        if (barHit.rime === 'select') this._applyRimeResult(this.rime.select(barHit.index));
        else this._applyRimeResult(this.rime.page(barHit.rime === 'prev'));
      } else if (barHit) {
        if (barHit.isPageFlip) {
          const totalPages = Math.ceil(this._getFlatCandidates().length / CANDIDATES_PER_PAGE);
          this.candidatePage = (this.candidatePage + 1) % Math.max(1, totalPages);
          this.audio.menuClick();
        } else {
          this._confirmUnitCandidate(barHit.entity, barHit.char);
        }
      }
      // HOME/TOP/BOTTOM ROW 提示小鍵盤：縮小/放大/關閉，關閉後的重新顯示按鈕
      if (!barHit && ROW_KEYBOARD_CHARS[this.menuSelection.category]) {
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
  _startGame(resume = false) {
    this.setCompact(document.body.classList.contains('touch-mode'));   // 手機：2 道精簡版
    if (this.menuSelection.category === 'english_article') {
      const selected = window.articleManager ? window.articleManager.getSelectedArticles('en') : [];
      if (selected.length === 0) {
        this._flashMenuWarning('請先點右下角 📚 選擇至少一篇「英文」文章');
        return;
      }
      const key = selected.map(a => a.id).sort().join(',');
      if (this._englishPoolsKey !== key) {
        this.englishPools = buildEnglishPools(selected);
        this._englishPoolsKey = key;
      }
      const total = this.englishPools.Easy.length + this.englishPools.Medium.length + this.englishPools.Hard.length;
      if (total === 0) {
        this._flashMenuWarning('文章內容太少，請多選幾篇文章再試');
        return;
      }
    }
    if (this.menuSelection.category === 'chinese_article') {
      const selected = window.articleManager ? window.articleManager.getSelectedArticles('zh') : [];
      if (selected.length === 0) {
        this._flashMenuWarning('請先點右下角 📚 選擇至少一篇文章');
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
      // 依文章次序出題；「接續」只在同一組文章＋同一難度時有效，否則從頭開始
      const seqKey = key + '|' + this.menuSelection.difficulty;
      if (this._articleSeqKey !== key) {
        this.articleSeq = buildArticleSequences(selected);
        this._articleSeqKey = key;
        this._seqUnitCache = new Map();
      }
      this.seqIdx = (resume && this._resume && this._resume.key === seqKey) ? this._resume.idx : 0;
      this._resume = null;
    }

    const isChineseCat = this.menuSelection.category === 'chinese' || this.menuSelection.category === 'chinese_article';
    if (isChineseCat && this.rime.status === 'loading') {
      // 第一次按：提醒；若學生不想等，再按一次就先用「簡易選字模式」開始玩
      if (!this._startAnywayArmed) {
        this._startAnywayArmed = true;
        this._flashMenuWarning('輸入法還在載入。再按一次「開始遊戲」可先用簡易選字模式玩');
        return;
      }
    }
    this._startAnywayArmed = false;
    this.rimeActive = isChineseCat && this.rime.status === 'ready';
    this.imeState = null;
    this._imeToast = null;
    if (this.rimeActive) this.rime.reset();
    this._buildHomophoneIndex();
    this.candidatePage = 0;
    this.audio.init();
    this.state = 'PLAYING';
    this.player = { lane: Math.ceil(LANE_COUNT / 2), dir: 1, dead: false, shootAnim: 0 };
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

    // Chinese entities are typed and confirmed one CHARACTER at a time.
    // Finishing a character's pinyin doesn't kill anything by itself — it
    // pops up a row of candidate hanzi (the correct one plus several
    // same-sound decoys, just like a real pinyin input method) and the
    // player must pick the matching character before the next one can be
    // typed. This is what makes "selecting the character" a real exercise
    // in recognizing hanzi instead of a rubber-stamp click.
    const stillLocked = e => !e.dead && !e.awaitingUnitConfirm;

    if (this.targetedEnemies.length > 0) {
      // Direct Chinese character match if typed via IME
      const directMatches = this.targetedEnemies.filter(e => !e.awaitingUnitConfirm && e.isChinese && e.char === key);
      if (directMatches.length > 0) {
        this.audio.hit();
        directMatches.forEach(e => {
          e.typed = e.word.length;
          this._checkUnitBoundary(e);
        });
        this.targetedEnemies = this.targetedEnemies.filter(stillLocked);
        return;
      }

      // Continue typing on existing targets
      const matching = this.targetedEnemies.filter(e => !e.awaitingUnitConfirm && matchesKey(e, e.typed, key));
      if (matching.length > 0) {
        this.audio.hit();
        if (matching.every(e => e.isChinese)) {
          // Don't auto-shoot yet — nothing is confirmed until the player
          // selects a candidate; shooting on every keystroke would look like
          // the game already decided for them.
        } else {
          this._shootAt(matching[0]);
        }
        matching.forEach(e => {
          e.typed++;
          this._checkUnitBoundary(e);
        });
        // Remove non-matching (and now-awaiting) from target list
        this.targetedEnemies = matching.filter(stillLocked);
      } else {
        this.audio.error();
      }
    } else {
      // Find new targets
      const allTypable = [...this.enemies, ...this.powerupItems];
      const candidates = allTypable.filter(e =>
        !e.dead && !e.awaitingUnitConfirm && e.lane === p.lane &&
        ((p.dir > 0 && e.fromRight) || (p.dir < 0 && !e.fromRight)) &&
        (matchesKey(e, 0, key) || (e.isChinese && e.char === key))
      );

      if (candidates.length > 0) {
        this.audio.hit();
        this.targetedEnemies = candidates;
        if (!candidates.every(e => e.isChinese)) {
          this._shootAt(candidates[0]);
        }
        candidates.forEach(e => {
          if (e.isChinese && e.char === key) {
            e.typed = e.word.length;
          } else {
            e.typed++;
          }
          this._checkUnitBoundary(e);
        });
        this.targetedEnemies = candidates.filter(stillLocked);
      } else {
        this.audio.error();
      }
    }
  }

  // Non-Chinese words die the instant they're fully typed, same as before.
  // A Chinese entity instead checks whether its CURRENT character's pinyin
  // is now fully typed; if so, it pauses and waits for the player to pick
  // the right hanzi out of the 候選字 (candidate) row before moving on to
  // the next character (or dying, if that was its last one).
  _checkUnitBoundary(e) {
    if (!e.isChinese) {
      if (e.typed >= e.word.length) this._killEnemy(e);
      return;
    }
    const unit = e.units[e.curUnit || 0];
    if (!unit || e.typed < unit.boundary || e.awaitingUnitConfirm) return;

    if (unit.isPunct) {
      // Punctuation has exactly one possible key — nothing to choose
      // between, so it's confirmed the instant it's typed, same as a
      // non-Chinese word's last letter.
      e.curUnit = (e.curUnit || 0) + 1;
      if (e.curUnit >= e.units.length) {
        this._shootAt(e);
        this._killEnemy(e);
      }
      return;
    }

    // Build candidates from the bare hanzi only — if this unit has
    // trailing (unmapped) punctuation glued on, showing it on just the
    // correct chip would give the answer away by sight alone.
    e.pendingCandidates = this._buildCandidates(bareHanzi(unit.display), unit.input);
    e.awaitingUnitConfirm = true;
    // Every new character starts back on page 1 of its candidates.
    this.candidatePage = 0;
  }

  // Builds the 候選字 options for one character: the correct hanzi plus
  // many decoys that share the same (toneless) pinyin — just like a real
  // input method's candidate list — topped up with random filler characters
  // if there aren't enough true homophones. 18 total, shown 9-per-page (see
  // CANDIDATES_PER_PAGE), so there's always a real set of look-alike options
  // to search through across two pages rather than a single obvious answer.
  _buildCandidates(correctChar, pinyinToneless) {
    const index = this.homophoneIndex || {};
    const known = this.allKnownChars || [];
    const targetTotal = CANDIDATE_TOTAL;
    let decoys = shuffleArray((index[pinyinToneless] || []).filter(c => c !== correctChar)).slice(0, targetTotal - 1);
    if (decoys.length < targetTotal - 1) {
      const filler = shuffleArray(known.filter(c => c !== correctChar && !decoys.includes(c)));
      for (const c of filler) {
        if (decoys.length >= targetTotal - 1) break;
        decoys.push(c);
      }
    }
    return shuffleArray([correctChar, ...decoys]);
  }

  // Builds the pinyin → [同音字...] lookup used by _buildCandidates, from the
  // 500 common built-in characters plus every character that appears in the
  // currently-selected 中文-文章 articles (so decoys for article mode are
  // drawn from vocabulary the student has actually seen).
  _buildHomophoneIndex() {
    const charSet = new Set(CHINESE_CHARACTERS.map(c => c.char));
    ['Easy', 'Medium', 'Hard'].forEach(diff => {
      const pool = (this.articlePools && this.articlePools[diff]) || [];
      pool.forEach(item => {
        (item.units || []).forEach(u => {
          const hanzi = (u.display || '').match(/[一-鿿]/g);
          if (hanzi) hanzi.forEach(c => charSet.add(c));
        });
      });
    });
    const allChars = Array.from(charSet);
    const index = {};
    if (window.pinyinPro) {
      allChars.forEach(ch => {
        let py = '';
        try { py = normalizePinyinInput(window.pinyinPro.pinyin(ch, { toneType: 'none' })); } catch (e) { py = ''; }
        if (!py) return;
        (index[py] = index[py] || []).push(ch);
      });
    }
    this.homophoneIndex = index;
    this.allKnownChars = allChars;
  }

  // Confirms one candidate pick: used by clicking its chip in the 候選字 bar
  // or pressing its number key. A wrong pick just buzzes — the zombie keeps
  // coming and the candidates stay up so the student can try again. The
  // right pick advances to the next character, or kills the entity if that
  // was its last one.
  _confirmUnitCandidate(entity, char) {
    if (!entity || entity.dead || !entity.awaitingUnitConfirm) {
      this.audio.error();
      return;
    }
    const unit = entity.units[entity.curUnit || 0];
    if (!unit || char !== bareHanzi(unit.display)) {
      this.audio.error();
      return;
    }
    this.audio.hit();
    entity.awaitingUnitConfirm = false;
    entity.pendingCandidates = null;
    entity.curUnit = (entity.curUnit || 0) + 1;
    this.candidatePage = 0; // list just shrank/changed — back to page 1
    if (entity.curUnit >= entity.units.length) {
      this._shootAt(entity);
      this._killEnemy(entity);
      this.targetedEnemies = this.targetedEnemies.filter(e => e !== entity);
    } else if (!this.targetedEnemies.includes(entity)) {
      this.targetedEnemies.push(entity);
    }
  }

  // ── Real Rime input (小狼毫 engine) ─────────────────────────
  _enemiesInFront() {
    const p = this.player;
    return [...this.enemies, ...this.powerupItems].filter(e =>
      !e.dead && e.isChinese && e.units && e.lane === p.lane &&
      ((p.dir > 0 && e.fromRight) || (p.dir < 0 && !e.fromRight)));
  }

  _remainingText(e) {
    return e.units.slice(e.curUnit || 0).map(u => bareHanzi(u.display)).join('');
  }

  // Symbols no input method can produce (digits, Latin letters, exotic marks)
  // are skipped automatically when Rime drives the game.
  _skipFreeUnits(e) {
    if (!e.units) return;
    let c = e.curUnit || 0;
    while (c < e.units.length && e.units[c].free) c++;
    e.curUnit = c;
    e.typed = c > 0 ? e.units[c - 1].boundary : 0;
  }

  // Routes a keypress to the Rime engine. Returns true when the key was used.
  _handleRimeKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return false;
    const composing = !!(this.imeState && this.imeState.body);
    let k = null;
    if (e.key === ' ') {
      if (!composing) return true;       // idle space does nothing
      k = ' ';
    } else if (e.key === 'Backspace') {
      if (!composing) return true;
      k = '{BackSpace}';
    } else if (e.key === 'Enter') {
      if (!composing) return false;      // Enter still fires the power-up
      k = '{Return}';
    } else if (e.key.length === 1) {
      k = /[A-Za-z]/.test(e.key) ? e.key.toLowerCase() : e.key;
    } else {
      return false;                      // arrows etc. stay game controls
    }
    this._applyRimeResult(this.rime.key(k));
    return true;
  }

  _applyRimeResult(r) {
    if (!r) return;
    if (r.committed) this._onImeCommit(r.committed);
    if (r.body !== undefined && r.state === 1) this.imeState = r;
    else if (r.state !== 3) this.imeState = null; // 3 = key not handled, keep what's on screen
  }

  _imeToastShow(msg) {
    this._imeToast = { msg, until: performance.now() + 1400 };
  }

  // The player confirmed some text (a character, a word, a punctuation mark)
  // in the input method — check it against the zombies they're facing.
  _onImeCommit(text) {
    // 只把左右引號視為同一個（同一個鍵）；異體字（爲／為）是不同的字，必須選對
    const norm = s => (s || '').replace(/”/g, '“').replace(/’/g, '‘');
    const t = norm(text);
    const matches = this._enemiesInFront().filter(e => norm(this._remainingText(e)).startsWith(t));
    if (!t || matches.length === 0) {
      this.audio.error();
      this._imeToastShow('✗ 「' + text + '」不是前面殭屍要的字');
      return;
    }
    // Identical text on several zombies: the one closest to the player goes first
    matches.sort((a, b) => Math.abs(a.x - W / 2) - Math.abs(b.x - W / 2));
    const e = matches[0];
    this.audio.hit();
    e.curUnit = (e.curUnit || 0) + t.length;
    e.typed = e.curUnit > 0 ? e.units[e.curUnit - 1].boundary : 0;
    this._skipFreeUnits(e);
    this._shootAt(e);
    if (e.curUnit >= e.units.length) this._killEnemy(e);
  }

  // Weasel-style window: the pinyin being typed on top, numbered candidates below.
  _drawRimeWindow(ctx) {
    this._candidateBarHitboxes = [];
    if (this.htmlCandidates) return;   // 手機：由網頁上的大按鈕顯示（touch.js）
    if (this.state !== 'PLAYING') return;
    const st = this.imeState;
    const now = performance.now();
    const toast = this._imeToast && now < this._imeToast.until ? this._imeToast.msg : null;
    const font = 'bold 18px "Outfit", "Microsoft JhengHei", "PingFang SC", sans-serif';
    const small = '11px "Outfit", "Microsoft JhengHei", sans-serif';

    ctx.save();
    ctx.textAlign = 'left';
    if (!st || !st.body) {
      // Idle: just a small reminder of what's active
      ctx.font = small;
      ctx.fillStyle = 'rgba(160,255,190,0.55)';
      ctx.textAlign = 'center';
      ctx.fillText('小狼毫輸入引擎（朙月拼音）｜打拼音，空白鍵選第1個，1~5選字，Esc取消', W / 2, H - 10);
      if (toast) {
        ctx.font = 'bold 14px "Outfit", "Microsoft JhengHei", sans-serif';
        ctx.fillStyle = '#ff6b81';
        ctx.fillText(toast, W / 2, H - 34);
      }
      ctx.restore();
      return;
    }

    const cands = st.candidates || [];
    const pad = 12, gap = 16, rowH = 30;
    ctx.font = font;
    const items = cands.map((c, i) => {
      const label = (i + 1) + ' ' + c.text;
      const cw = ctx.measureText(label).width;
      let cm = '';
      if (c.comment) { cm = c.comment; }
      ctx.font = small;
      const mw = cm ? ctx.measureText(cm).width + 4 : 0;
      ctx.font = font;
      return { i, label, comment: cm, w: cw + mw };
    });
    const candW = items.reduce((s, it) => s + it.w, 0) + gap * Math.max(0, items.length - 1);
    const pagerW = 54;
    ctx.font = font;
    const preW = ctx.measureText((st.head || '') + st.body + (st.tail || '')).width;
    const boxW = Math.max(candW + pagerW, preW) + pad * 2;
    const boxH = rowH * 2 + pad;
    const x = Math.round(W / 2 - boxW / 2);
    const y = H - boxH - 26;

    ctx.fillStyle = 'rgba(8, 14, 26, 0.95)';
    ctx.beginPath(); ctx.roundRect(x, y, boxW, boxH, 10); ctx.fill();
    ctx.strokeStyle = '#2ed573'; ctx.lineWidth = 1.5; ctx.stroke();

    // Row 1: what's being typed
    ctx.fillStyle = '#ffd700';
    ctx.fillText((st.head || '') + st.body + (st.tail || ''), x + pad, y + 24);

    // Row 2: candidates
    let cx = x + pad;
    const ry = y + rowH + 22;
    items.forEach(it => {
      const hl = it.i === st.highlighted;
      if (hl) {
        ctx.fillStyle = 'rgba(46, 213, 115, 0.35)';
        ctx.beginPath(); ctx.roundRect(cx - 5, ry - 20, it.w + 10, 28, 6); ctx.fill();
      }
      ctx.font = font;
      ctx.fillStyle = hl ? '#ffffff' : '#d8ffe6';
      ctx.fillText(it.label, cx, ry);
      if (it.comment) {
        ctx.font = small;
        ctx.fillStyle = '#8fa6a0';
        ctx.fillText(it.comment, cx + ctx.measureText(it.label).width + 4, ry);
      }
      this._candidateBarHitboxes.push({ rime: 'select', index: it.i, left: cx - 5, right: cx + it.w + 5, top: ry - 20, bottom: ry + 8 });
      cx += it.w + gap;
    });

    // Pager ◂ ▸
    const px = x + boxW - pad - 40;
    const canPrev = (st.page || 0) > 0;
    const canNext = !st.isLastPage;
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = canPrev ? '#ffffff' : '#46524d';
    ctx.fillText('◂', px, ry);
    ctx.fillStyle = canNext ? '#ffffff' : '#46524d';
    ctx.fillText('▸', px + 24, ry);
    if (canPrev) this._candidateBarHitboxes.push({ rime: 'prev', left: px - 6, right: px + 16, top: ry - 20, bottom: ry + 8 });
    if (canNext) this._candidateBarHitboxes.push({ rime: 'next', left: px + 18, right: px + 40, top: ry - 20, bottom: ry + 8 });

    if (toast) {
      ctx.font = 'bold 14px "Outfit", "Microsoft JhengHei", sans-serif';
      ctx.fillStyle = '#ff6b81';
      ctx.textAlign = 'center';
      ctx.fillText(toast, W / 2, y - 8);
    }
    ctx.restore();
  }

  // Flattens every awaiting entity's full (18-per-character) candidate list.
  // Used to know the total count (for page math) — see _getVisibleCandidates
  // for what's actually shown on screen right now.
  _getFlatCandidates() {
    const result = [];
    [...this.enemies, ...this.powerupItems].forEach(e => {
      if (!e.dead && e.isChinese && e.awaitingUnitConfirm && e.pendingCandidates) {
        e.pendingCandidates.forEach(ch => result.push({ entity: e, char: ch }));
      }
    });
    return result;
  }

  // The current 9-candidate page (of up to 18 total) — what the 候選字 bar
  // draws and what number keys 1-9 index into. "0" flips this.candidatePage.
  _getVisibleCandidates() {
    const flat = this._getFlatCandidates();
    const start = this.candidatePage * CANDIDATES_PER_PAGE;
    return flat.slice(start, start + CANDIDATES_PER_PAGE);
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
    const lane = Math.floor(Math.random() * LANE_COUNT) + 1;
    const fromRight = Math.random() > 0.5;
    const type = Math.floor(Math.random() * 5) + 1;
    const wordItem = this._getUniqueWord(true);
    let speed = (0.3 + Math.random() * 0.2) * (1 + (this.stats.level - 1) * 0.08);
    // 字量越多，走到柵欄的時間要越長（普通版／挑戰版）：
    // 一個「字量單位」＝ 1 個中文字（含選字）或 4 個英文字母。
    // 抵達時間至少 8 秒 + 3.5 秒 × 字量，速度再依關卡慢慢加快。
    const work = entityWork(wordItem);
    this.lastSpawnWork = work;
    if (this.menuSelection.difficulty !== 'Easy') {
      const dist = Math.abs((fromRight ? BARRICADE_RIGHT_X + 30 : BARRICADE_LEFT_X - 30) - (fromRight ? W + 30 : -30));
      const minTravelMs = Math.min(60000, 8000 + 3500 * work);
      const maxSpeed = dist / (minTravelMs / 16) * (1 + (this.stats.level - 1) * 0.08);
      speed = Math.min(speed, maxSpeed);
    }

    this.enemies.push({
      x: fromRight ? W + 30 : -30,
      y: LANE_Y(lane),
      lane, fromRight, type,
      word: wordItem.word,
      seqIdx: wordItem.seqIdx,
      char: wordItem.char || null,
      pinyin: wordItem.pinyin || null,
      units: wordItem.units || null,
      isChinese: !!wordItem.isChinese,
      typed: 0, dead: false, speed,
      bob: Math.random() * Math.PI * 2,
      isPowerup: false,
      curUnit: 0, awaitingUnitConfirm: false, pendingCandidates: null,
    });
    if (this.rimeActive) this._skipFreeUnits(this.enemies[this.enemies.length - 1]);
    this.zombiesSpawned++;
  }

  _spawnPowerup() {
    const lane = Math.floor(Math.random() * LANE_COUNT) + 1;
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
      typed: 0, dead: false, speed: 0.35,
      curUnit: 0, awaitingUnitConfirm: false, pendingCandidates: null,
      isPowerup: true, powerType,
      bob: Math.random() * Math.PI * 2,
    });
  }

  // 示範帳號：左下角「示範模式」面板（無敵由 update 裡判斷；這裡只放跳過題目／跳過這波）
  _initDemo() {
    if (!window.KeyagentDemo || !KeyagentDemo.isActive()) return;
    KeyagentDemo.mountBar([
      { label: '跳過這題', key: 'F2', fn: () => {
        if (this.state !== 'PLAYING') return;
        const list = this.enemies.filter(e => !e.dead && !e.isPowerup);
        if (!list.length) return;
        const dist = e => e.fromRight ? e.x - BARRICADE_RIGHT_X : BARRICADE_LEFT_X - e.x;
        list.sort((a, b) => dist(a) - dist(b));
        this._killEnemy(list[0]);
      } },
      { label: '跳過這波', key: 'F3', fn: () => { if (this.state === 'PLAYING') this.waveTimer = 1; } }
    ]);
  }

  // 中文-文章：照文章次序取下一題（到尾巴就從頭循環）
  _nextArticleItem() {
    const list = this.articleSeq && this.articleSeq[this.menuSelection.difficulty];
    if (!list || list.length === 0) return null;
    const abs = this.seqIdx++;
    const str = list[abs % list.length];
    let item = this._seqUnitCache.get(str);
    if (!item) {
      item = buildChineseUnits(str);
      if (!item) return null;
      this._seqUnitCache.set(str, item);
    }
    return Object.assign({}, item, { seqIdx: abs });
  }

  // 死掉時記下接續位置：場上最早還沒打掉的那一題；沒有就從下一題開始
  _recordResume() {
    if (this.menuSelection.category !== 'chinese_article' || !this.articleSeq) { this._resume = null; }
    else {
      const alive = this.enemies.filter(e => !e.dead && e.seqIdx !== undefined).map(e => e.seqIdx);
      const idx = alive.length ? Math.min(...alive) : this.seqIdx;
      this._resume = { key: this._articleSeqKey + '|' + this.menuSelection.difficulty, idx };
    }
    this._saveOtherRecord();
  }

  // ── 學號登入後，戰績與「背到哪裡」記在學生的雲端存檔裡（sync-client.js）：換電腦、換座位也能接續 ──
  _saveOtherRecord() {
    if (typeof keyagentUpdateOtherGame !== 'function') return;
    const st = this.stats;
    const cat = this.menuSelection.category;
    keyagentUpdateOtherGame('zombie', old => {
      const patch = {
        plays: (old.plays || 0) + 1,
        bestScore: Math.max(old.bestScore || 0, st.score),
        bestKills: Math.max(old.bestKills || 0, st.kills),
        bestLevel: Math.max(old.bestLevel || 0, st.level),
        totalKills: (old.totalKills || 0) + st.kills,
        lastScore: st.score, lastCategory: cat, lastDifficulty: this.menuSelection.difficulty
      };
      if (cat === 'chinese_article' && this._resume) patch.resume = { key: this._resume.key, idx: this._resume.idx };
      return patch;
    });
  }
  _storedResume() {
    if (typeof keyagentGetOtherGames !== 'function') return null;
    const og = keyagentGetOtherGames();
    const r = og && og.zombie && og.zombie.resume;
    if (!r || this.menuSelection.category !== 'chinese_article') return null;
    const sel = window.articleManager ? window.articleManager.getSelectedArticles('zh') : [];
    const key = sel.map(a => a.id).sort().join(',') + '|' + this.menuSelection.difficulty;
    return r.key === key ? r : null;   // 選的文章或難度和上次不同就不提供接續
  }

  _getUniqueWord(sequential) {
    if (sequential && this.menuSelection.category === 'chinese_article' && this.articleSeq) {
      const it = this._nextArticleItem();
      if (it) return it;
    }
    const usedWords = [...this.enemies, ...this.powerupItems].map(e => e.word);
    let item;
    let attempts = 0;
    do {
      item = getWordForCategory(this.menuSelection.category, this.menuSelection.difficulty, { articlePools: this.articlePools, englishPools: this.englishPools });
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
          // 緩和加速：每過一關出怪間隔約快 8%（原本約 22%），並設下限
          this.spawnDelay = Math.max(MIN_SPAWN_DELAY, this.spawnDelay * 0.92);
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
        const delay = this.waveType === 'HORDE' ? this.spawnDelay * 0.75 : this.spawnDelay;
        this.spawnTimer = delay;

        if (this.frozenTimer <= 0) {
          // 同時在場的怪物數量上限：一開始很少（輕鬆好應付），
          // 隨著過關逐漸增加，最多 5 隻（對應 5 條路線）。
          const maxConcurrent = this.waveType === 'HORDE'
            ? Math.min(3 + (this.stats.level - 1), 5)
            : Math.min(2 + (this.stats.level - 1), 5);
          const aliveCount = this.enemies.filter(e => !e.dead).length;
          const diff = this.menuSelection.difficulty;
          const cap = (this.menuSelection.category === 'chinese_article')
            ? (diff === 'Hard' ? 3 : diff === 'Medium' ? 4 : 5) : 5;
          if (aliveCount < Math.min(maxConcurrent, cap)) {
            this._spawnZombie();
            // 字量大的怪物，下一隻出現的間隔也跟著拉長（普通版／挑戰版）
            if (diff !== 'Easy') {
              const f = Math.min(4, Math.max(0.8, (this.lastSpawnWork || 1) / 1.5));
              this.spawnTimer = delay * f;
            }
            // Occasional power-up
            if (Math.random() < 0.06 && !this.heldPowerup) {
              this._spawnPowerup();
            }
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
        if (!(window.KeyagentDemo && KeyagentDemo.opt('invincible'))) b.hp -= 0.03 * (dt / 16);   // 示範帳號：無敵
        if (b.hp <= 0) {
          b.hp = 0;
          this.player.dead = true;
          this._recordResume();
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
    this.projectiles.forEach(p => { p.progress += dt / 200; });
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

    if (this.rimeActive && this.state === 'PLAYING') {
      // 小狼毫模式：把玩家面前的怪物標示出來
      this.targetedEnemies = this._enemiesInFront();
    }

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
    this._drawCandidateBar(ctx);
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
    for (let i = 1; i <= LANE_COUNT; i++) {
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
      ctx.font = `bold 12px ${UI_FONT}`;
      ctx.fillStyle = '#ffa';
      ctx.fillText('按Enter', px - 22, py + 36);
      ctx.restore();
    }

    // Lane arrow indicators
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px sans-serif';
    if (p.lane > 1) ctx.fillText('▲', px + 35 * p.dir, py - 20);
    if (p.lane < LANE_COUNT) ctx.fillText('▼', px + 35 * p.dir, py + 15);
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
    const awaiting = !!entity.awaitingUnitConfirm;
    const curUnit = entity.curUnit || 0;
    const WINDOW = 10; // max hanzi shown at once so long sentences don't overflow

    // Units before curUnit have already been confirmed and typed-away —
    // they disappear and everything after shifts left to fill the gap.
    const remaining = entity.units.slice(curUnit);
    if (remaining.length === 0) return; // about to die this frame
    const shown = remaining.slice(0, WINDOW);
    const hasMore = remaining.length > WINDOW;
    const prevBoundary = curUnit > 0 ? entity.units[curUnit - 1].boundary : 0;

    const hanziFont = 'bold 18px "Outfit", "Microsoft JhengHei", "PingFang SC", sans-serif';
    const pinyinFont = 'bold 12px "Outfit", sans-serif';
    const colGap = 4;
    const padX = 10;

    // Measure each visible column. Only column 0 (the current character)
    // has any typing progress — the rest haven't been reached yet.
    const cols = shown.map((u, idx) => {
      ctx.font = hanziFont;
      const hanziW = ctx.measureText(u.display).width;
      ctx.font = pinyinFont;
      const pinyinW = ctx.measureText(u.pinyin).width;
      const colW = Math.max(hanziW, pinyinW);
      let typedInUnit = 0;
      if (idx === 0) {
        typedInUnit = awaiting ? u.input.length : Math.max(0, Math.min(u.input.length, entity.typed - prevBoundary));
      }
      return { u, idx, colW, hanziW, pinyinW, typedInUnit };
    });
    let totalW = cols.reduce((sum, c) => sum + c.colW, 0) + colGap * (cols.length - 1);
    if (hasMore) totalW += 18;
    const boxW = totalW + padX * 2;
    const boxH = 34;
    // 長句子的文字框往「柵欄／畫面中間」那一側延伸，並限制在畫面內，
    // 這樣殭屍一出現就能看到第一個字，不必等它走過來。
    let x = entity.x - boxW / 2;
    if (boxW > 130) {
      x = entity.fromRight ? entity.x + 45 - boxW : entity.x - 45;
    }
    x = Math.max(4, Math.min(W - 4 - boxW, x));
    const y = entity.y - 82;

    // Box background — pulses while the current character awaits selection
    const pulse = awaiting ? (Math.sin(this.globalTime / 150) + 1) / 2 : 0; // 0..1
    ctx.fillStyle = awaiting ? 'rgba(10, 30, 20, 0.94)' : (isTargeted ? 'rgba(10, 16, 32, 0.92)' : 'rgba(0, 0, 0, 0.85)');
    ctx.beginPath();
    ctx.roundRect(x, y - 23, boxW, boxH, 6);
    ctx.fill();
    ctx.strokeStyle = awaiting ? `rgba(46, 213, 115, ${0.6 + pulse * 0.4})` : (isTargeted ? 'rgba(0, 212, 255, 0.8)' : 'rgba(255, 255, 255, 0.22)');
    ctx.lineWidth = awaiting ? 3 : (isTargeted ? 2 : 1.5);
    if (awaiting) { ctx.shadowColor = '#2ed573'; ctx.shadowBlur = 10 + pulse * 8; }
    else if (isTargeted) { ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 8; }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw each column: pinyin on top, hanzi below
    let cx = x + padX;
    cols.forEach((col) => {
      const isCurrentCol = col.idx === 0;
      const isAwaitingThis = isCurrentCol && awaiting;

      // Hanzi
      ctx.font = hanziFont;
      ctx.fillStyle = isAwaitingThis ? '#2ed573' : (isCurrentCol && col.typedInUnit > 0 ? '#2ed573' : (isCurrentCol && isTargeted ? '#00d4ff' : '#ffd700'));
      ctx.fillText(col.u.display, cx + (col.colW - col.hanziW) / 2, y + 6);

      // Pinyin, colored letter-by-letter for the current column's progress
      ctx.font = pinyinFont;
      let px = cx + (col.colW - col.pinyinW) / 2;
      const pinyinLetters = col.u.pinyin.split('');
      for (let i = 0; i < pinyinLetters.length; i++) {
        if (isAwaitingThis) {
          ctx.fillStyle = '#8fffb0';
        } else if (isCurrentCol && i < col.typedInUnit) {
          ctx.fillStyle = '#2ed573'; // typed
        } else if (isCurrentCol && i === col.typedInUnit && isTargeted) {
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

    // Hint once the current character awaits selection — the candidates
    // themselves (with their own numbers) are in the 候選字 bar below.
    if (awaiting) {
      ctx.font = 'bold 10px "Outfit", "Microsoft JhengHei", sans-serif';
      ctx.fillStyle = `rgba(143, 255, 176, ${0.7 + pulse * 0.3})`;
      ctx.textAlign = 'center';
      ctx.fillText('👆 請在下方候選字選出正確的字', x + boxW / 2, y - 30);
      ctx.textAlign = 'left';
    }
  }

  // The 候選字 (candidate) bar: a Weasel/Rime-style numbered strip along the
  // bottom of the play area listing the current page of candidate characters
  // (9 of up to 18 total per typed character) — the correct hanzi mixed in
  // among many decoys. Click a chip or press its number; only the one that
  // matches the entity's actual character counts. When there's a second
  // page, a "0 換頁" chip flips between them (same as pressing "0").
  _drawCandidateBar(ctx) {
    if (this.rimeActive) { this._drawRimeWindow(ctx); return; }
    if (this.htmlCandidates) { this._candidateBarHitboxes = []; return; }   // 手機：由網頁上的大按鈕顯示
    const total = this.state === 'PLAYING' ? this._getFlatCandidates().length : 0;
    const visible = this.state === 'PLAYING' ? this._getVisibleCandidates() : [];
    this._candidateBarHitboxes = [];
    if (total === 0) return;

    const totalPages = Math.ceil(total / CANDIDATES_PER_PAGE);
    const showPageChip = totalPages > 1;

    ctx.save();
    const chipH = 34;
    const chipGap = 8;
    const padX = 12;
    const barY = H - chipH - 10;

    ctx.font = 'bold 16px "Outfit", "Microsoft JhengHei", "PingFang SC", sans-serif';
    const chips = visible.map((c, i) => {
      const label = `${i + 1}  ${c.char}`;
      const w = ctx.measureText(label).width + padX * 2 + 14;
      return { entity: c.entity, char: c.char, label, w, num: i + 1, isPageFlip: false };
    });
    if (showPageChip) {
      const label = `0  第${this.candidatePage + 1}/${totalPages}頁 ▸`;
      const w = ctx.measureText(label).width + padX * 2 + 14;
      chips.push({ entity: null, char: null, label, w, num: 0, isPageFlip: true });
    }
    const totalW = chips.reduce((s, c) => s + c.w, 0) + chipGap * (chips.length - 1);
    let cx = W / 2 - totalW / 2;

    // Backing bar
    ctx.fillStyle = 'rgba(5, 10, 20, 0.88)';
    ctx.beginPath();
    ctx.roundRect(cx - 14, barY - 6, totalW + 28, chipH + 12, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(46, 213, 115, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    chips.forEach(chip => {
      const pulse = (Math.sin(this.globalTime / 150 + chip.num) + 1) / 2;
      ctx.fillStyle = chip.isPageFlip
        ? `rgba(0, 212, 255, ${0.18 + pulse * 0.12})`
        : `rgba(46, 213, 115, ${0.22 + pulse * 0.15})`;
      ctx.beginPath();
      ctx.roundRect(cx, barY, chip.w, chipH, 8);
      ctx.fill();
      ctx.strokeStyle = chip.isPageFlip ? '#00d4ff' : '#2ed573';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = chip.isPageFlip ? '#d9f6ff' : '#eafff0';
      ctx.font = 'bold 16px "Outfit", "Microsoft JhengHei", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(chip.label, cx + padX, barY + chipH / 2 + 6);

      this._candidateBarHitboxes.push({
        entity: chip.entity,
        char: chip.char,
        isPageFlip: chip.isPageFlip,
        left: cx, right: cx + chip.w, top: barY, bottom: barY + chipH,
      });

      cx += chip.w + chipGap;
    });

    ctx.textAlign = 'left';
    ctx.restore();
  }

  _drawProjectiles(ctx) {
    ctx.save();
    this.projectiles.forEach(p => {
      const cx = p.x + (p.tx - p.x) * p.progress;
      const cy = p.y + (p.ty - p.y) * p.progress - Math.sin(p.progress * Math.PI) * 15;
      // 丟出去的飛劍：邊飛邊旋轉（純視覺，命中判定不受影響）
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(p.progress * Math.PI * 5);
      ctx.shadowColor = 'rgba(255,255,200,0.8)';
      ctx.shadowBlur = 6;
      // 劍身
      ctx.fillStyle = '#e8f1ff';
      ctx.strokeStyle = '#5b6b8c';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(15, 0); ctx.lineTo(8, -3); ctx.lineTo(-4, -3);
      ctx.lineTo(-4, 3); ctx.lineTo(8, 3); ctx.closePath();
      ctx.fill(); ctx.stroke();
      // 護手
      ctx.fillStyle = '#f2c230';
      ctx.fillRect(-6, -6, 3, 12);
      // 劍柄與劍首
      ctx.fillStyle = '#7a4a21';
      ctx.fillRect(-12, -1.5, 6, 3);
      ctx.fillStyle = '#f2c230';
      ctx.beginPath(); ctx.arc(-13, 0, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
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
    ctx.font = `bold 15px ${UI_FONT}`;
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`分數：${this.stats.score.toLocaleString()}`, panelX + 16, panelY + 22);

    ctx.fillStyle = '#2ed573';
    ctx.fillText(`等級：${this.stats.level}`, panelX + 230, panelY + 22);

    const waveLeft = Math.max(0, Math.ceil(this.waveTimer / 1000));
    ctx.fillStyle = this.waveType === 'HORDE' ? '#ff4757' : '#00d4ff';
    const waveLabel = this.waveType === 'HORDE' ? `大軍 ${waveLeft} 秒` : `波次 ${waveLeft} 秒`;
    ctx.fillText(waveLabel, panelX + 340, panelY + 22);

    // Bottom row inside HUD
    ctx.fillStyle = '#e8e8e8';
    ctx.fillText(`擊殺：${this.stats.kills}`, panelX + 16, panelY + 44);

    const mins = Math.floor(this.stats.timeAlive / 60);
    const secs = this.stats.timeAlive % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    ctx.fillText(`時間：${timeStr}`, panelX + 230, panelY + 44);

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
      ctx.font = `bold 40px ${UI_FONT}`;
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 20;
      ctx.fillText('殭屍大軍來襲！', W / 2, H / 2 - 10);
      ctx.font = `bold 20px ${UI_FONT}`;
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#faa';
      ctx.fillText('做好準備…', W / 2, H / 2 + 28);
      ctx.textAlign = 'start';
      ctx.restore();

    } else if (this.state === 'WAVE_COMPLETE') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#2ed573';
      ctx.font = `bold 44px ${UI_FONT}`;
      ctx.shadowColor = '#2ed573';
      ctx.shadowBlur = 15;
      ctx.fillText('本波完成！', W / 2, H / 2 - 40);
      ctx.shadowBlur = 0;

      ctx.font = `bold 20px ${UI_FONT}`;
      ctx.fillStyle = '#e8e8e8';
      ctx.fillText(`分數：${this.stats.score.toLocaleString()}　｜　擊殺：${this.stats.kills}`, W / 2, H / 2 + 10);

      ctx.fillStyle = '#ffd700';
      const countdown = Math.ceil(this.overlayTimer / 1000);
      ctx.fillText(`${countdown} 秒後開始下一波…`, W / 2, H / 2 + 50);
      ctx.textAlign = 'start';
      ctx.restore();

    } else if (this.state === 'PAUSED') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.textAlign = 'center';

      // Title
      ctx.fillStyle = '#00d4ff';
      ctx.font = `bold 44px ${UI_FONT}`;
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 15;
      ctx.fillText('遊戲暫停', W / 2, H / 2 - 70);
      ctx.shadowBlur = 0;

      ctx.font = `16px ${UI_FONT}`;
      ctx.fillStyle = '#bbb';
      ctx.fillText('按 Esc、P 或空白鍵繼續遊戲', W / 2, H / 2 - 35);

      // Buttons
      // Resume Button
      ctx.fillStyle = '#2ed573';
      ctx.beginPath();
      ctx.roundRect(W / 2 - 130, 220, 260, 45, 8);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = `bold 22px ${UI_FONT}`;
      ctx.fillText('繼續遊戲', W / 2, 250);

      // Main Menu Button
      ctx.fillStyle = '#6c63ff';
      ctx.beginPath();
      ctx.roundRect(W / 2 - 130, 280, 260, 40, 8);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `bold 20px ${UI_FONT}`;
      ctx.fillText('回主選單', W / 2, 306);

      ctx.textAlign = 'start';
      ctx.restore();

    } else if (this.state === 'GAME_OVER') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.textAlign = 'center';

      // Title
      ctx.fillStyle = '#ff4757';
      ctx.font = `bold 50px ${UI_FONT}`;
      ctx.shadowColor = '#ff4757';
      ctx.shadowBlur = 20;
      ctx.fillText('遊戲結束', W / 2, H / 2 - 80);
      ctx.shadowBlur = 0;

      // Stats
      ctx.font = `bold 18px ${UI_FONT}`;
      ctx.fillStyle = '#e8e8e8';
      const mins = Math.floor(this.stats.timeAlive / 60);
      const secs = this.stats.timeAlive % 60;
      ctx.fillText(`分數：${this.stats.score.toLocaleString()}`, W / 2, H / 2 - 30);
      ctx.fillText(`擊殺：${this.stats.kills}　｜　等級：${this.stats.level}`, W / 2, H / 2 - 5);
      ctx.fillText(`時間：${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`, W / 2, H / 2 + 20);

      // Buttons
      // Play Again
      ctx.fillStyle = '#2ed573';
      ctx.beginPath();
      ctx.roundRect(W/2 - 130, 310, 260, 45, 8);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = `bold 22px ${UI_FONT}`;
      ctx.fillText(this._resume ? '接續上次進度' : '再玩一次', W / 2, 341);

      if (this._resume) {
        ctx.fillStyle = '#ffa502';
        ctx.beginPath();
        ctx.roundRect(W/2 - 130, 365, 260, 40, 8);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = `bold 20px ${UI_FONT}`;
        ctx.fillText('重頭開始', W / 2, 392);
      }

      // Menu
      const menuTop = this._resume ? 412 : 370;
      ctx.fillStyle = '#6c63ff';
      ctx.beginPath();
      ctx.roundRect(W/2 - 130, menuTop, 260, 40, 8);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `bold 20px ${UI_FONT}`;
      ctx.fillText('回主選單', W / 2, menuTop + 27);

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
    const L = MENU_LAYOUT;

    // 標題
    ctx.shadowColor = '#ff4757';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#ff4757';
    ctx.font = `bold 56px ${UI_FONT}`;
    ctx.fillText('末日生存', W / 2, 92 + this.menuTitleBounce);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#e8e8e8';
    ctx.font = `bold 26px ${UI_FONT}`;
    ctx.fillText('防禦殭屍戰', W / 2, 134 + this.menuTitleBounce);

    // 難度
    ctx.fillStyle = '#c0c0d0';
    ctx.font = `bold 20px ${UI_FONT}`;
    ctx.fillText('難度', W / 2, 212);

    const dTotal = this.difficulties.length * L.diff.w + (this.difficulties.length - 1) * L.diff.gap;
    this.difficulties.forEach((d, i) => {
      const bx = (W - dTotal) / 2 + i * (L.diff.w + L.diff.gap);
      const selected = i === this.menuSelection.difficultyIndex;
      ctx.fillStyle = selected ? '#6c63ff' : 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.roundRect(bx, L.diff.y, L.diff.w, L.diff.h, 8);
      ctx.fill();
      if (selected) {
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
      ctx.fillStyle = selected ? '#fff' : '#a8a8b8';
      ctx.font = `bold 20px ${UI_FONT}`;
      ctx.textBaseline = 'middle';
      ctx.fillText(d, bx + L.diff.w / 2, L.diff.y + L.diff.h / 2 + 1);
      ctx.textBaseline = 'alphabetic';
    });

    // 練習內容
    ctx.fillStyle = '#c0c0d0';
    ctx.font = `bold 20px ${UI_FONT}`;
    ctx.fillText('練習內容', W / 2, 282);

    this.categories.forEach((c, i) => {
      const r = this._menuCatRect(i);
      const selected = i === this.menuSelection.categoryIndex;
      ctx.fillStyle = selected ? '#6c63ff' : 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.w, r.h, 8);
      ctx.fill();
      if (selected) {
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
      ctx.fillStyle = selected ? '#fff' : '#a8a8b8';
      ctx.font = `bold 19px ${UI_FONT}`;
      ctx.textBaseline = 'middle';
      ctx.fillText(c.label, r.x + r.w / 2, r.y + r.h / 2 + 1);
      ctx.textBaseline = 'alphabetic';
    });

    // 提示列（已選文章數 ／ 警告）
    const noteY = 292 + 2 * 40 + 8 + 24;
    if (this.menuSelection.category === 'chinese_article' || this.menuSelection.category === 'english_article') {
      const kind = this.menuSelection.category === 'english_article' ? 'en' : 'zh';
      const n = window.articleManager ? window.articleManager.getSelectedArticles(kind).length : 0;
      ctx.fillStyle = n > 0 ? '#2ed573' : '#ffa502';
      ctx.font = `bold 16px ${UI_FONT}`;
      ctx.fillText(n > 0 ? `已選 ${n} 篇文章 ✓` : '尚未選擇文章，請點右下角 📚', W / 2, noteY);
      const sr = kind === 'zh' ? this._storedResume() : null;
      if (sr) {
        ctx.fillStyle = '#ffd700';
        ctx.font = `bold 15px ${UI_FONT}`;
        ctx.fillText(`上次背到第 ${sr.idx + 1} 題　按 C 接續，或按「開始遊戲」從頭開始`, W / 2, noteY + 22);
      }
    }
    if (this.menuWarningTimer > 0) {
      ctx.fillStyle = '#ff4757';
      ctx.font = `bold 17px ${UI_FONT}`;
      ctx.fillText(this.menuWarning, W / 2, noteY);
    }

    // 開始按鈕
    const playPulse = 0.97 + Math.sin(this.globalTime / 400) * 0.03;
    ctx.save();
    ctx.translate(W / 2, L.play.cy);
    ctx.scale(playPulse, playPulse);
    ctx.fillStyle = '#2ed573';
    ctx.shadowColor = '#2ed573';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.roundRect(-L.play.w / 2, -L.play.h / 2, L.play.w, L.play.h, 12);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#04210f';
    ctx.font = `bold 28px ${UI_FONT}`;
    ctx.textBaseline = 'middle';
    ctx.fillText('開始遊戲', 0, 2);
    ctx.restore();

    // 操作說明
    ctx.fillStyle = '#9a9aac';
    ctx.font = `15px ${UI_FONT}`;
    if (this.menuSelection.category === 'chinese' || this.menuSelection.category === 'chinese_article') {
      const st = this.rime.status;
      ctx.fillStyle = st === 'ready' ? '#2ed573' : (st === 'failed' ? '#ffa502' : '#c0c0d0');
      ctx.font = `bold 16px ${UI_FONT}`;
      ctx.fillText(
        st === 'ready' ? '⌨ 小狼毫輸入引擎已就緒（朙月拼音）：打拼音 → 空白鍵或數字鍵選字，跟真的輸入法一樣'
          : st === 'failed' ? '⌨ 輸入引擎載入失敗，改用簡易選字模式（打拼音 → 選出正確的字）'
          : `⌨ 小狼毫輸入引擎載入中（${this.rime.loadedCount || 0}/${this.rime.totalCount || 6}，已等 ${this.rime.loadStartedAt ? Math.floor((Date.now() - this.rime.loadStartedAt) / 1000) : 0} 秒）｜不想等可連按兩次「開始遊戲」先用簡易模式`,
        W / 2, 488);
    } else {
      ctx.fillText('↑↓ 換行　←→ 轉向　打字消滅殭屍　Enter ＝ 使用道具　｜　點「開始遊戲」或按 Enter／空白鍵開始', W / 2, 488);
    }

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

if (typeof keyagentInstallPageHideSync === 'function') keyagentInstallPageHideSync();
