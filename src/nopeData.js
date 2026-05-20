export const CONTRACT = "EQApjQK1qpZ3BjECMaK0GkseWS7qfnhA5YXdP-YKUkK2Hnon";

export const rarityLabels = {
  common: "COMMON GARBAGE",
  uncommon: "UNCOMMON TRASH",
  rare: "RARE REGRET",
  epic: "EPIC FAILURE",
  glitch: "GLITCH LOOP",
  forbidden: "FORBIDDEN LOOP",
  cursed: "CURSED LOOP",
  illegal: "ILLEGAL LOOP",
  mythic: "MYTHIC WASTE",
  uber: "UBER NOPE",
};

export const defaultAchievementStats = {
  contractCopyCount: 0,
  duplicateCount: 0,
  shareCopyCount: 0,
  shareCount: 0,
};

const UBER_IDS = [
  "znope",
  "speednope",
  "00nope",
  "matrixnope",
  "nopeorno",
  "nopeornothing",
  "godteirnope",
  "godnope",
  "sketchnope",
];

const MYTHIC_IDS = [
  "robo3nope",
  "bnwnope",
  "russiannope",
  "redhoodnope",
  "ricknope",
  "nopeorno2",
  "hackernope",
  "matrix2nope",
];

export const normalNopeEntities = [
  { id: "00nope", name: "00 NOPE", image: "/images/00nope.jpg", type: "image", caption: "first contact with refusal" },
  { id: "100knope", name: "100K NOPE", image: "/images/100knope.jpg", type: "image", caption: "six figures of nothing" },
  { id: "airdropnope", name: "AIRDROP NOPE", image: "/images/airdropnope.jpg", type: "image", caption: "claim denied" },
  { id: "babyvadernope", name: "BABY VADER NOPE", image: "/images/babyvadernope.jpg", type: "image", caption: "tiny dark side refusal" },
  { id: "banananope", name: "BANANA NOPE", image: "/images/banananope.jpg", type: "image", caption: "potassium rejected" },
  { id: "bandannope", name: "BANDAN NOPE", image: "/images/bandannope.jpg", type: "image", caption: "headwear, no utility" },
  { id: "baskectballnope", name: "BASKETBALL NOPE", image: "/images/baskectballnope.jpg", type: "image", caption: "absolutely no hoops" },
  { id: "bat2nope", name: "BAT 2 NOPE", image: "/images/bat2nope.jpg", type: "image", caption: "second bat, same answer" },
  { id: "batnope", name: "BAT NOPE", image: "/images/batnope.jpg", type: "image", caption: "rejects hope from the shadows" },
  { id: "beernope", name: "BEER NOPE", image: "/images/beernope.jpg", type: "image", caption: "liquidity, but worse" },
  { id: "bennope", name: "BEN NOPE", image: "/images/bennope.jpg", type: "image", caption: "ben says no" },
  { id: "bluepillnope", name: "BLUEPILL NOPE", image: "/images/bluepillnope.jpg", type: "image", caption: "chooses denial" },
  { id: "bnwnope", name: "BNW NOPE", image: "/images/bnwnope.jpg", type: "image", caption: "monochrome disappointment" },
  { id: "boynopes", name: "BOY NOPES", image: "/images/boynopes.jpg", type: "image", caption: "the lads refused" },
  { id: "busynope", name: "BUSY NOPE", image: "/images/busynope.jpg", type: "image", caption: "currently unavailable" },
  { id: "campfirenope", name: "CAMPFIRE NOPE", image: "/images/campfirenope.jpg", type: "image", caption: "warmth denied" },
  { id: "campingnope", name: "CAMPING NOPE", image: "/images/campingnope.jpg", type: "image", caption: "touching grass rejected" },
  { id: "capseanope", name: "CAPSEA NOPE", image: "/images/capseanope.jpg", type: "image", caption: "sea-level refusal" },
  { id: "captnope", name: "CAPT NOPE", image: "/images/captnope.jpg", type: "image", caption: "captain of absolutely not" },
  { id: "catnope", name: "CAT NOPE", image: "/images/catnope.jpg", type: "image", caption: "meow? nope." },
  { id: "chaddernope", name: "CHADDER NOPE", image: "/images/chaddernope.jpg", type: "image", caption: "cheddar refused" },
  { id: "chadnope", name: "CHAD NOPE", image: "/images/chadnope.jpg", type: "image", caption: "alpha refusal" },
  { id: "cheersnope", name: "CHEERS NOPE", image: "/images/cheersnope.jpg", type: "image", caption: "raises glass, rejects all" },
  { id: "chef2nope", name: "CHEF 2 NOPE", image: "/images/chef2nope.jpg", type: "image", caption: "cooking more regret" },
  { id: "chefnope", name: "CHEF NOPE", image: "/images/chefnope.jpg", type: "image", caption: "let him cook. no." },
  { id: "chemicalnope", name: "CHEMICAL NOPE", image: "/images/chemicalnope.jpg", type: "image", caption: "unstable refusal compound" },
  { id: "chopnope", name: "CHOP NOPE", image: "/images/chopnope.jpg", type: "image", caption: "cutting expectations" },
  { id: "choppernope", name: "CHOPPER NOPE", image: "/images/choppernope.jpg", type: "image", caption: "air support denied" },
  { id: "clownnope", name: "CLOWN NOPE", image: "/images/clownnope.jpg", type: "image", caption: "circus detected" },
  { id: "cowboy2nope", name: "COWBOY 2 NOPE", image: "/images/cowboy2nope.jpg", type: "image", caption: "yeehaw denied again" },
  { id: "cowboynope", name: "COWBOY NOPE", image: "/images/cowboynope.jpg", type: "image", caption: "yeehaw? nope." },
  { id: "decnope", name: "DEC NOPE", image: "/images/decnope.jpg", type: "image", caption: "decorative refusal" },
  { id: "deepseanope", name: "DEEPSEA NOPE", image: "/images/deepseanope.jpg", type: "image", caption: "pressure-tested denial" },
  { id: "diamondnope", name: "DIAMOND NOPE", image: "/images/diamondnope.jpg", type: "image", caption: "sparkling worthlessness" },
  { id: "dianmondhandnope", name: "DIAMOND HAND NOPE", image: "/images/dianmondhandnope.jpg", type: "image", caption: "holds nothing proudly" },
  { id: "docnope", name: "DOC NOPE", image: "/images/docnope.jpg", type: "image", caption: "medical advice: nope" },
  { id: "dragnope", name: "DRAG NOPE", image: "/images/dragnope.jpg", type: "image", caption: "slaying expectations" },
  { id: "ermnope", name: "ERM NOPE", image: "/images/ermnope.jpg", type: "image", caption: "erm... absolutely not" },
  { id: "fangnope", name: "FANG NOPE", image: "/images/fangnope.jpg", type: "image", caption: "bites hope" },
  { id: "finenope", name: "FINE NOPE", image: "/images/finenope.jpg", type: "image", caption: "everything is not fine" },
  { id: "firen2ope", name: "FIRE N2OPE", image: "/images/firen2ope.jpg", type: "image", caption: "burning optimism" },
  { id: "firenope", name: "FIRE NOPE", image: "/images/firenope.jpg", type: "image", caption: "hot refusal" },
  { id: "flashnope", name: "FLASH NOPE", image: "/images/flashnope.jpg", type: "image", caption: "fastest no alive" },
  { id: "flynope", name: "FLY NOPE", image: "/images/flynope.jpg", type: "image", caption: "airborne rejection" },
  { id: "gandelffnope", name: "GANDELFF NOPE", image: "/images/gandelffnope.jpg", type: "image", caption: "you shall not pass" },
  { id: "gangstanope", name: "GANGSTA NOPE", image: "/images/gangstanope.jpg", type: "image", caption: "street-certified refusal" },
  { id: "gardennope", name: "GARDEN NOPE", image: "/images/gardennope.jpg", type: "image", caption: "grass rejected" },
  { id: "ghostnope", name: "GHOST NOPE", image: "/images/ghostnope.jpg", type: "image", caption: "haunting your bags" },
  { id: "gladnope", name: "GLAD NOPE", image: "/images/gladnope.jpg", type: "image", caption: "happy to refuse" },
  { id: "gm2nope", name: "GM 2 NOPE", image: "/images/gm2nope.jpg", type: "image", caption: "gm again, still nope" },
  { id: "gmnope", name: "GM NOPE", image: "/images/gmnope.jpg", type: "image", caption: "good morning refused" },
  { id: "gnope", name: "GNOPE", image: "/images/gnope.jpg", type: "image", caption: "silent g, loud nope" },
  { id: "guitarnope", name: "GUITAR NOPE", image: "/images/guitarnope.jpg", type: "image", caption: "plays the no chord" },
  { id: "gun2nope", name: "GUN 2 NOPE", image: "/images/gun2nope.jpg", type: "image", caption: "second amendment to vibes denied" },
  { id: "gunnope", name: "GUN NOPE", image: "/images/gunnope.jpg", type: "image", caption: "armed with bad decisions" },
  { id: "hidenope", name: "HIDE NOPE", image: "/images/hidenope.jpg", type: "image", caption: "concealed refusal" },
  { id: "hippynope", name: "HIPPY NOPE", image: "/images/hippynope.jpg", type: "image", caption: "peace, love, and no" },
  { id: "hoodcapnope", name: "HOODCAP NOPE", image: "/images/hoodcapnope.jpg", type: "image", caption: "cap detected" },
  { id: "hoodednope", name: "HOODED NOPE", image: "/images/hoodednope.jpg", type: "image", caption: "hood up, hope down" },
  { id: "icekingnope", name: "ICE KING NOPE", image: "/images/icekingnope.jpg", type: "image", caption: "cold denial" },
  { id: "imnope", name: "I'M NOPE", image: "/images/imnope.jpg", type: "image", caption: "identity confirmed" },
  { id: "jedinope", name: "JEDI NOPE", image: "/images/jedinope.jpg", type: "image", caption: "the force says no" },
  { id: "jonesnope", name: "JONES NOPE", image: "/images/jonesnope.jpg", type: "image", caption: "artifact of refusal" },
  { id: "jurrasicnope", name: "JURRASIC NOPE", image: "/images/jurrasicnope.jpg", type: "image", caption: "life found a nope" },
  { id: "keetnope", name: "KEET NOPE", image: "/images/keetnope.jpg", type: "image", caption: "bird-based rejection" },
  { id: "king2nope", name: "KING 2 NOPE", image: "/images/king2nope.jpg", type: "image", caption: "second throne, same no" },
  { id: "kingnope", name: "KING NOPE", image: "/images/kingnope.jpg", type: "image", caption: "royal refusal" },
  { id: "knightnope", name: "KNIGHT NOPE", image: "/images/knightnope.jpg", type: "image", caption: "armoured denial" },
  { id: "lambonope", name: "LAMBO NOPE", image: "/images/lambonope.jpg", type: "image", caption: "wen lambo? nope." },
  { id: "magicnope", name: "MAGIC NOPE", image: "/images/magicnope.jpg", type: "image", caption: "wizard-grade nonsense" },
  { id: "masknope", name: "MASK NOPE", image: "/images/masknope.jpg", type: "image", caption: "identity refused" },
  { id: "matrixnope", name: "MATRIX NOPE", image: "/images/matrixnope.jpg", type: "image", caption: "red pill? nope." },
  { id: "meditatenope", name: "MEDITATE NOPE", image: "/images/meditatenope.jpg", type: "image", caption: "inner peace denied" },
  { id: "metelnope", name: "METEL NOPE", image: "/images/metelnope.jpg", type: "image", caption: "heavy refusal" },
  { id: "nativenope", name: "NATIVE NOPE", image: "/images/nativenope.jpg", type: "image", caption: "chain-native denial" },
  { id: "ninjanope", name: "NINJA NOPE", image: "/images/ninjanope.jpg", type: "image", caption: "silent refusal" },
  { id: "nopenotpepe", name: "NOPE NOT PEPE", image: "/images/nopenotpepe.jpg", type: "image", caption: "definitely not pepe" },
  { id: "notnope", name: "NOT NOPE", image: "/images/notnope.jpg", type: "image", caption: "double negative detected" },
  { id: "pheronope", name: "PHERO NOPE", image: "/images/pheronope.jpg", type: "image", caption: "pheromones rejected" },
  { id: "piratenope", name: "PIRATE NOPE", image: "/images/piratenope.jpg", type: "image", caption: "yarrr no" },
  { id: "pizzanope", name: "PIZZA NOPE", image: "/images/pizzanope.jpg", type: "image", caption: "extra nope topping" },
  { id: "poolnope", name: "POOL NOPE", image: "/images/poolnope.jpg", type: "image", caption: "liquidity pool? no." },
  { id: "poornope", name: "POOR NOPE", image: "/images/poornope.jpg", type: "image", caption: "portfolio accurate" },
  { id: "populernope", name: "POPULER NOPE", image: "/images/populernope.jpg", type: "image", caption: "misspelled popularity" },
  { id: "portnope", name: "PORT NOPE", image: "/images/portnope.jpg", type: "image", caption: "harbouring regret" },
  { id: "proffnope", name: "PROFF NOPE", image: "/images/proffnope.jpg", type: "image", caption: "academically denied" },
  { id: "readernope", name: "READER NOPE", image: "/images/readernope.jpg", type: "image", caption: "read the room: no" },
  { id: "real2nope", name: "REAL 2 NOPE", image: "/images/real2nope.jpg", type: "image", caption: "real again, still no" },
  { id: "realnope", name: "REAL NOPE", image: "/images/realnope.jpg", type: "image", caption: "verified worthless" },
  { id: "redhoodnope", name: "REDHOOD NOPE", image: "/images/redhoodnope.jpg", type: "image", caption: "hooded red flag" },
  { id: "richnope", name: "RICH NOPE", image: "/images/richnope.jpg", type: "image", caption: "wealth simulation failed" },
  { id: "ricknope", name: "RICK NOPE", image: "/images/ricknope.jpg", type: "image", caption: "never gonna give you gains" },
  { id: "robo2nope", name: "ROBO 2 NOPE", image: "/images/robo2nope.jpg", type: "image", caption: "automated refusal v2" },
  { id: "robo3nope", name: "ROBO 3 NOPE", image: "/images/robo3nope.jpg", type: "image", caption: "third machine, still no" },
  { id: "robonope", name: "ROBO NOPE", image: "/images/robonope.jpg", type: "image", caption: "mechanised denial" },
  { id: "rock2nope", name: "ROCK 2 NOPE", image: "/images/rock2nope.jpg", type: "image", caption: "solid no, sequel" },
  { id: "rocketnope", name: "ROCKET NOPE", image: "/images/rocketnope.jpg", type: "image", caption: "moon mission cancelled" },
  { id: "rocknope", name: "ROCK NOPE", image: "/images/rocknope.jpg", type: "image", caption: "solid refusal" },
  { id: "rockstarnope", name: "ROCKSTAR NOPE", image: "/images/rockstarnope.jpg", type: "image", caption: "stage-diving into nothing" },
  { id: "rockstarnope2", name: "ROCKSTAR NOPE 2", image: "/images/rockstarnope2.jpg", type: "image", caption: "encore denied" },
  { id: "rollernope", name: "ROLLER NOPE", image: "/images/rollernope.jpg", type: "image", caption: "rolling downhill" },
  { id: "russiannope", name: "RUSSIAN NOPE", image: "/images/russiannope.jpg", type: "image", caption: "cyka no" },
  { id: "sam2nope", name: "SAM 2 NOPE", image: "/images/sam2nope.jpg", type: "image", caption: "second sam, same refusal" },
  { id: "samaerinope", name: "SAMAEARI NOPE", image: "/images/samaerinope.jpg", type: "image", caption: "honourable no" },
  { id: "samnope", name: "SAM NOPE", image: "/images/samnope.jpg", type: "image", caption: "sam says nope" },
  { id: "sanatnope", name: "SANAT NOPE", image: "/images/sanatnope.jpg", type: "image", caption: "seasonal refusal" },
  { id: "seanope", name: "SEA NOPE", image: "/images/seanope.jpg", type: "image", caption: "ocean of no" },
  { id: "sexynope", name: "SEXY NOPE", image: "/images/sexynope.jpg", type: "image", caption: "seductive refusal" },
  { id: "shadownope", name: "SHADOW NOPE", image: "/images/shadownope.jpg", type: "image", caption: "dark mode denial" },
  { id: "sheetnope", name: "SHEET NOPE", image: "/images/sheetnope.jpg", type: "image", caption: "spreadsheet says no" },
  { id: "sherlocknope", name: "SHERLOCK NOPE", image: "/images/sherlocknope.jpg", type: "image", caption: "elementary, no" },
  { id: "skinope", name: "SKI NOPE", image: "/images/skinope.jpg", type: "image", caption: "downhill only" },
  { id: "sky2nope", name: "SKY 2 NOPE", image: "/images/sky2nope.jpg", type: "image", caption: "blue-sky refusal" },
  { id: "slamnope", name: "SLAM NOPE", image: "/images/slamnope.jpg", type: "image", caption: "dunked on hope" },
  { id: "soccer2nope", name: "SOCCER 2 NOPE", image: "/images/soccer2nope.jpg", type: "image", caption: "second half refusal" },
  { id: "soccer3nope", name: "SOCCER 3 NOPE", image: "/images/soccer3nope.jpg", type: "image", caption: "hat trick of no" },
  { id: "soccernope", name: "SOCCER NOPE", image: "/images/soccernope.jpg", type: "image", caption: "own goal detected" },
  { id: "spacenope", name: "SPACE NOPE", image: "/images/spacenope.jpg", type: "image", caption: "interstellar refusal" },
  { id: "spacexnope", name: "SPACEX NOPE", image: "/images/spacexnope.jpg", type: "image", caption: "launch scrubbed" },
  { id: "speednope", name: "SPEED NOPE", image: "/images/speednope.jpg", type: "image", caption: "fast no" },
  { id: "spidernope", name: "SPIDER NOPE", image: "/images/spidernope.jpg", type: "image", caption: "web3, unfortunately" },
  { id: "spoonnope", name: "SPOON NOPE", image: "/images/spoonnope.jpg", type: "image", caption: "no soup for you" },
  { id: "sportnope", name: "SPORT NOPE", image: "/images/sportnope.jpg", type: "image", caption: "competitive denial" },
  { id: "spotlightnope", name: "SPOTLIGHT NOPE", image: "/images/spotlightnope.jpg", type: "image", caption: "attention rejected" },
  { id: "starwatchernope", name: "STARWATCHER NOPE", image: "/images/starwatchernope.jpg", type: "image", caption: "searching for gains" },
  { id: "supernope", name: "SUPER NOPE", image: "/images/supernope.jpg", type: "image", caption: "heroic uselessness" },
  { id: "surfernope", name: "SURFER NOPE", image: "/images/surfernope.jpg", type: "image", caption: "riding the red candles" },
  { id: "sus2nope", name: "SUS 2 NOPE", image: "/images/sus2nope.jpg", type: "image", caption: "suspicious again" },
  { id: "susnope", name: "SUS NOPE", image: "/images/susnope.jpg", type: "image", caption: "looking extremely nope" },
  { id: "susnope2", name: "SUS NOPE 2", image: "/images/susnope2.jpg", type: "image", caption: "sus sequel" },
  { id: "tatnope", name: "TAT NOPE", image: "/images/tatnope.jpg", type: "image", caption: "inked refusal" },
  { id: "tattoonope", name: "TATTOO NOPE", image: "/images/tattoonope.jpg", type: "image", caption: "permanent mistake" },
  { id: "tonnope", name: "TON NOPE", image: "/images/tonnope.jpg", type: "image", caption: "chain reaction: no" },
  { id: "trumpnope", name: "TRUMP NOPE", image: "/images/trumpnope.jpg", type: "image", caption: "campaign of refusal" },
  { id: "vadernope", name: "VADER NOPE", image: "/images/vadernope.jpg", type: "image", caption: "the empire says no" },
  { id: "vikingnope", name: "VIKING NOPE", image: "/images/vikingnope.jpg", type: "image", caption: "raiding expectations" },
  { id: "viktornope", name: "VIKTOR NOPE", image: "/images/viktornope.jpg", type: "image", caption: "hexcore says absolutely not" },
  { id: "winternope", name: "WINTER NOPE", image: "/images/winternope.jpg", type: "image", caption: "cold bags" },
  { id: "wizard2nope", name: "WIZARD 2 NOPE", image: "/images/wizard2nope.jpg", type: "image", caption: "spell failed again" },
  { id: "wizardnope", name: "WIZARD NOPE", image: "/images/wizardnope.jpg", type: "image", caption: "casts deny" },
  { id: "wolfnope", name: "WOLF NOPE", image: "/images/wolfnope.jpg", type: "image", caption: "howling at nothing" },
  { id: "yaghtnope", name: "YAGHT NOPE", image: "/images/yaghtnope.jpg", type: "image", caption: "misspelled yacht, real regret" },
  { id: "castlenope", name: "CASTLE NOPE", image: "/images/castlenope.jpg", type: "image", caption: "royal garbage recovered" },
  { id: "diamondcoatnope", name: "DIAMOND COAT NOPE", image: "/images/diamondcoatnope.jpg", type: "image", caption: "dripped out and still worthless" },
  { id: "dinonope", name: "DINO NOPE", image: "/images/dinonope.jpg", type: "image", caption: "prehistoric disappointment" },
  { id: "dudenope", name: "DUDE NOPE", image: "/images/dudenope.jpg", type: "image", caption: "the dude refuses" },
  { id: "godnope", name: "GOD NOPE", image: "/images/godnope.jpg", type: "image", caption: "holy rejection protocol" },
  { id: "godteirnope", name: "GOD TEIR NOPE", image: "/images/godteirnope.jpg", type: "image", caption: "misspelled divinity detected" },
  { id: "hackernope", name: "HACKER NOPE", image: "/images/hackernope.jpg", type: "image", caption: "mainframe access denied" },
  { id: "holdcatnope", name: "HOLD CAT NOPE", image: "/images/holdcatnope.jpg", type: "image", caption: "cat held. hope dropped" },
  { id: "matrix2nope", name: "MATRIX 2 NOPE", image: "/images/matrix2nope.jpg", type: "image", caption: "second matrix, same refusal" },
  { id: "mushnope", name: "MUSH NOPE", image: "/images/mushnope.jpg", type: "image", caption: "sports utility denied" },
  { id: "neednope", name: "NEED NOPE", image: "/images/neednope.jpg", type: "image", caption: "you need nope" },
  { id: "nopeorno2", name: "NOPE OR NO 2", image: "/images/nopeorno2.jpg", type: "image", caption: "the sequel also said no" },
  { id: "runmatrixnope", name: "RUN MATRIX NOPE", image: "/images/runmatrixnope.jpg", type: "image", caption: "running from reality" },
  { id: "sketchnope", name: "SKETCH NOPE", image: "/images/sketchnope.jpg", type: "image", caption: "prototype of pure refusal" },
  { id: "smashnope", name: "SMASH NOPE", image: "/images/smashnope.jpg", type: "image", caption: "smashing expectations" },
  { id: "stopnope", name: "STOP NOPE", image: "/images/stopnope.jpg", type: "image", caption: "stop means nope" },
  { id: "znope", name: "Z NOPE", image: "/images/znope.jpg", type: "image", caption: "final alphabet refusal" },
];

export const forbiddenNopeGifs = [
  { id: "nope1", name: "FORBIDDEN NOPE 01", image: "/images/nope1.gif", type: "gif", caption: "animated regret detected" },
  { id: "nope2", name: "FORBIDDEN NOPE 02", image: "/images/nope2.gif", type: "gif", caption: "moving violation" },
  { id: "nope3", name: "FORBIDDEN NOPE 03", image: "/images/nope3.gif", type: "gif", caption: "this one wiggles incorrectly" },
  { id: "nope4", name: "FORBIDDEN NOPE 04", image: "/images/nope4.gif", type: "gif", caption: "motion sickness unlocked" },
  { id: "nope5", name: "FORBIDDEN NOPE 05", image: "/images/nope5.gif", type: "gif", caption: "frames of disappointment" },
  { id: "nope6", name: "FORBIDDEN NOPE 06", image: "/images/nope6.gif", type: "gif", caption: "looping bad decision" },
  { id: "nope7", name: "FORBIDDEN NOPE 07", image: "/images/nope7.gif", type: "gif", caption: "illegal movement detected" },
  { id: "nope8", name: "FORBIDDEN NOPE 08", image: "/images/nope8.gif", type: "gif", caption: "animated no protocol" },
  { id: "nope9", name: "FORBIDDEN NOPE 09", image: "/images/nope9.gif", type: "gif", caption: "gif-based refusal" },
  { id: "nope10", name: "FORBIDDEN NOPE 10", image: "/images/nope10.gif", type: "gif", caption: "halfway to forbidden" },
  { id: "nope11", name: "FORBIDDEN NOPE 11", image: "/images/nope11.gif", type: "gif", caption: "moving trash collected" },
  { id: "nope12", name: "FORBIDDEN NOPE 12", image: "/images/nope12.gif", type: "gif", caption: "unlicensed animation energy" },
  { id: "nope13", name: "FORBIDDEN NOPE 13", image: "/images/nope13.gif", type: "gif", caption: "unlucky refusal" },
  { id: "nope14", name: "FORBIDDEN NOPE 14", image: "/images/nope14.gif", type: "gif", caption: "frame-by-frame nonsense" },
  { id: "nope15", name: "FORBIDDEN NOPE 15", image: "/images/nope15.gif", type: "gif", caption: "rare moving nope" },
  { id: "nope16", name: "FORBIDDEN NOPE 16", image: "/images/nope16.gif", type: "gif", caption: "visual liability" },
  { id: "nope17", name: "FORBIDDEN NOPE 17", image: "/images/nope17.gif", type: "gif", caption: "unnecessary motion" },
  { id: "nope18", name: "FORBIDDEN NOPE 18", image: "/images/nope18.gif", type: "gif", caption: "cursed loop recovered" },
  { id: "nope19", name: "FORBIDDEN NOPE 19", image: "/images/nope19.gif", type: "gif", caption: "animated nothing" },
  { id: "nope20", name: "FORBIDDEN NOPE 20", image: "/images/nope20.gif", type: "gif", caption: "final forbidden nope" },
];

export const extraUberNopeRelics = [
  {
    id: "nopeorno",
    name: "NOPE OR NO",
    image: "/images/nopeorno.jpg",
    type: "uber",
    caption: "both options were rejected",
  },
  {
    id: "nopeornothing",
    name: "NOPE OR NOTHING",
    image: "/images/nopeornothing.jpg",
    type: "uber",
    caption: "all or absolutely nope",
  },
];

const dropChanceSpread = {
  common: [1.8, 1.7, 1.9, 1.6, 2],
  uncommon: [0.8, 0.7, 0.9, 0.6],
  rare: [0.35, 0.3, 0.25],
  epic: [0.15, 0.12, 0.1],
};

const fixedStandardRarity = {
  castlenope: { caption: "royal garbage recovered", dropChance: 0.3, rarity: "rare" },
  chaddernope: { caption: "cheese-based refusal", dropChance: 0.8, rarity: "uncommon" },
  diamondcoatnope: { caption: "dripped out and still worthless", dropChance: 0.12, rarity: "epic" },
  dinonope: { caption: "prehistoric disappointment", dropChance: 0.3, rarity: "rare" },
  dudenope: { caption: "the dude refuses", dropChance: 0.7, rarity: "uncommon" },
  holdcatnope: { caption: "cat held. hope dropped", dropChance: 0.25, rarity: "rare" },
  mushnope: { caption: "sports utility denied", dropChance: 1.7, rarity: "common" },
  neednope: { caption: "you need nope", dropChance: 0.1, rarity: "epic" },
  runmatrixnope: { caption: "running from reality", dropChance: 0.12, rarity: "epic" },
  sexynope: { caption: "disguise rejected", dropChance: 0.7, rarity: "uncommon" },
  smashnope: { caption: "smashing expectations", dropChance: 0.3, rarity: "rare" },
  stopnope: { caption: "stop means nope", dropChance: 1.6, rarity: "common" },
};

normalNopeEntities.forEach((entity) => {
  if (UBER_IDS.includes(entity.id)) {
    entity.type = "uber";
    entity.rarity = "uber";
    entity.rarityLabel = rarityLabels.uber;
    entity.dropChance = 0.1;
    return;
  }

  if (MYTHIC_IDS.includes(entity.id)) {
    entity.type = "mythic";
    entity.rarity = "mythic";
    entity.rarityLabel = rarityLabels.mythic;
    entity.dropChance = 0.5;
    return;
  }

  entity.type = "image";
});

export const standardNopeEntities = normalNopeEntities.filter((entity) => entity.type === "image");

standardNopeEntities.forEach((entity, index) => {
  let rarity = "common";

  if (index >= 124) {
    rarity = "epic";
  } else if (index >= 110) {
    rarity = "rare";
  } else if (index >= 78) {
    rarity = "uncommon";
  }

  const chances = dropChanceSpread[rarity];
  const fixedRarity = fixedStandardRarity[entity.id];

  if (fixedRarity) {
    entity.caption = fixedRarity.caption;
    entity.rarity = fixedRarity.rarity;
    entity.rarityLabel = rarityLabels[fixedRarity.rarity];
    entity.dropChance = fixedRarity.dropChance;
    return;
  }

  entity.rarity = rarity;
  entity.rarityLabel = rarityLabels[rarity];
  entity.dropChance = chances[index % chances.length];
});

const gifLoopTiers = {
  nope1: { dropChance: 0.8, rarity: "glitch" },
  nope2: { dropChance: 0.8, rarity: "glitch" },
  nope3: { dropChance: 0.8, rarity: "glitch" },
  nope4: { dropChance: 0.8, rarity: "glitch" },
  nope5: { dropChance: 0.8, rarity: "glitch" },
  nope6: { dropChance: 0.8, rarity: "glitch" },
  nope7: { dropChance: 0.8, rarity: "glitch" },
  nope8: { dropChance: 0.8, rarity: "glitch" },
  nope9: { dropChance: 0.4, rarity: "forbidden" },
  nope10: { dropChance: 0.4, rarity: "forbidden" },
  nope11: { dropChance: 0.4, rarity: "forbidden" },
  nope12: { dropChance: 0.4, rarity: "forbidden" },
  nope13: { dropChance: 0.4, rarity: "forbidden" },
  nope14: { dropChance: 0.4, rarity: "forbidden" },
  nope15: { dropChance: 0.2, rarity: "cursed" },
  nope16: { dropChance: 0.2, rarity: "cursed" },
  nope17: { dropChance: 0.2, rarity: "cursed" },
  nope18: { dropChance: 0.2, rarity: "cursed" },
  nope19: { dropChance: 0.1, rarity: "illegal" },
  nope20: { dropChance: 0.1, rarity: "illegal" },
};

forbiddenNopeGifs.forEach((entity) => {
  const tier = gifLoopTiers[entity.id] || { dropChance: 0.4, rarity: "forbidden" };

  entity.rarity = tier.rarity;
  entity.rarityLabel = rarityLabels[tier.rarity];
  entity.dropChance = tier.dropChance;
});

extraUberNopeRelics.forEach((entity) => {
  entity.rarity = "uber";
  entity.rarityLabel = rarityLabels.uber;
  entity.dropChance = 0.1;
});

export const mythicNopeRelics = normalNopeEntities.filter((entity) => entity.type === "mythic");
export const uberNopeRelics = [
  ...normalNopeEntities.filter((entity) => entity.type === "uber"),
  ...extraUberNopeRelics,
];
export const NORMAL_TOTAL = standardNopeEntities.length;
export const GIF_TOTAL = forbiddenNopeGifs.length;
export const MYTHIC_TOTAL = mythicNopeRelics.length;
export const UBER_TOTAL = uberNopeRelics.length;
export const stickerGridEntities = [...standardNopeEntities, ...forbiddenNopeGifs];
export const allNopeEntities = [...standardNopeEntities, ...forbiddenNopeGifs, ...mythicNopeRelics, ...uberNopeRelics];
export const rarityPools = {
  common: standardNopeEntities.filter((entity) => entity.rarity === "common"),
  cursed: forbiddenNopeGifs.filter((entity) => entity.rarity === "cursed"),
  uncommon: standardNopeEntities.filter((entity) => entity.rarity === "uncommon"),
  rare: standardNopeEntities.filter((entity) => entity.rarity === "rare"),
  epic: standardNopeEntities.filter((entity) => entity.rarity === "epic"),
  forbidden: forbiddenNopeGifs.filter((entity) => entity.rarity === "forbidden"),
  glitch: forbiddenNopeGifs.filter((entity) => entity.rarity === "glitch"),
  illegal: forbiddenNopeGifs.filter((entity) => entity.rarity === "illegal"),
  mythic: mythicNopeRelics,
  uber: uberNopeRelics,
};

export const bootLines = [
  { text: "NOT PEPE TERMINAL v0.0.1" },
  { text: "------------------------" },
  { text: "> connecting to TON..." },
  { text: "> checking for pepe..." },
  { text: "> pepe not found.", important: true, pause: 520 },
  { text: "> checking utility..." },
  { text: "> utility not found.", important: true, pause: 560 },
  { text: "> checking contract..." },
  { text: "> contract detected" },
  { text: "> last 3 chars: non", important: true, pause: 640 },
  { text: "> coincidence? probably." },
  { text: "> bullish? nope.", important: true, pause: 620 },
  { text: "> TON probably needed a Pepe." },
  { text: "> Turns out it was definitely NOT Pepe.", important: true, pause: 720 },
  { text: "> NOPE machine ready.", important: true, pause: 620 },
  { text: `> contract: ${CONTRACT}` },
  { text: "> press the big stupid button." },
  { text: "> you might find something." },
  { text: "> probably nope though." },
];

export const nopeLabels = ["NOPE", "NOPE?", "NOOOOOPE", "ABSOLUTELY NOT", "STILL NOPE", "HARD PASS"];

export const glitchWarnings = [
  "NOPE OS UNSTABLE",
  "SIGNAL CONTAMINATED",
  "VALUE GAINED: ZERO",
  "PEPE DETECTED / REJECTED",
  "NON HASH VERIFIED",
  "DUPLICATE TRASH RESONANCE",
  "REALITY REFUSED",
];

export const noHitMessages = [
  "no signal. no sticker. no apology.",
  "empty packet received. value gained: zero.",
  "the machine refused to reward you.",
  "nothing found. still somehow your fault.",
  "failed pull. emotional damage applied.",
  "packet rejected. try being luckier.",
  "no trash recovered. shame.",
];

export const ranks = [
  { count: 500, name: "final boss of nothing" },
  { count: 250, name: "operationally useless" },
  { count: 100, name: "high priest of no" },
  { count: 50, name: "nope enjoyer" },
  { count: 25, name: "terminal idiot" },
  { count: 10, name: "pepe denier" },
  { count: 5, name: "suspicious noper" },
  { count: 0, name: "visitor" },
];

export const achievements = [
  { id: "first-bad-decision", name: "FIRST BAD DECISION", description: "pressed NOPE once.", reward: "nothing", check: ({ nopeCount }) => nopeCount >= 1 },
  { id: "mild-regret", name: "MILD REGRET", description: "pressed NOPE 10 times.", reward: "still nothing", check: ({ nopeCount }) => nopeCount >= 10 },
  { id: "terminal-idiot-press", name: "TERMINAL IDIOT", description: "pressed NOPE 25 times.", reward: "questionable pride", check: ({ nopeCount }) => nopeCount >= 25 },
  { id: "nope-enjoyer-press", name: "NOPE ENJOYER", description: "pressed NOPE 50 times.", reward: "absolutely nothing", check: ({ nopeCount }) => nopeCount >= 50 },
  { id: "high-priest-press", name: "HIGH PRIEST OF NO", description: "pressed NOPE 100 times.", reward: "ceremonial regret", check: ({ nopeCount }) => nopeCount >= 100 },
  { id: "operationally-useless-press", name: "OPERATIONALLY USELESS", description: "pressed NOPE 250 times.", reward: "advanced uselessness", check: ({ nopeCount }) => nopeCount >= 250 },
  { id: "final-boss-press", name: "FINAL BOSS OF NOTHING", description: "pressed NOPE 500 times.", reward: "final nothing", check: ({ nopeCount }) => nopeCount >= 500 },
  { id: "trash-collector", name: "TRASH COLLECTOR", description: "found 10 worthless NOPES.", reward: "bin juice", check: ({ normalCollectedCount }) => normalCollectedCount >= 10 },
  { id: "garbage-curator", name: "GARBAGE CURATOR", description: "found 25 worthless NOPES.", reward: "museum of rubbish", check: ({ normalCollectedCount }) => normalCollectedCount >= 25 },
  { id: "sticker-gremlin", name: "STICKER GREMLIN", description: "found 50 worthless NOPES.", reward: "sticky fingers", check: ({ normalCollectedCount }) => normalCollectedCount >= 50 },
  { id: "nopedex-damage", name: "NOPEDEX DAMAGE", description: "found 100 worthless NOPES.", reward: "emotional lag", check: ({ normalCollectedCount }) => normalCollectedCount >= 100 },
  { id: "why-are-you-like-this", name: "WHY ARE YOU LIKE THIS?", description: "completed the worthless sticker set.", reward: "concern", check: ({ normalCollectedCount }) => normalCollectedCount >= NORMAL_TOTAL },
  { id: "forbidden-behaviour", name: "FORBIDDEN BEHAVIOUR", description: "found a forbidden loop.", reward: "moving regret", check: ({ gifCollectedCount }) => gifCollectedCount >= 1 },
  { id: "loop-sickness", name: "LOOP SICKNESS", description: "found 5 forbidden loops.", reward: "dizziness", check: ({ gifCollectedCount }) => gifCollectedCount >= 5 },
  { id: "animated-regret", name: "ANIMATED REGRET", description: "found 10 forbidden loops.", reward: "frames of shame", check: ({ gifCollectedCount }) => gifCollectedCount >= 10 },
  { id: "gif-criminal", name: "GIF CRIMINAL", description: "completed the forbidden loop set.", reward: "no parole", check: ({ gifCollectedCount }) => gifCollectedCount >= GIF_TOTAL },
  { id: "illegal-movement", name: "ILLEGAL MOVEMENT", description: "found an illegal loop.", reward: "animated criminal record", check: ({ collectedIds }) => collectedIds.some((id) => forbiddenNopeGifs.some((entity) => entity.id === id && entity.rarity === "illegal")) },
  { id: "mythically-useless", name: "MYTHICALLY USELESS", description: "found mythic waste.", reward: "rare nothing", check: ({ mythicCollectedCount }) => mythicCollectedCount >= 1 },
  { id: "nope-or-no-achievement", name: "NOPE OR NO", description: "found NOPE OR NO.", reward: "both options rejected", check: ({ collectedIds }) => collectedIds.includes("nopeorno") },
  { id: "nope-or-nothing-achievement", name: "NOPE OR NOTHING", description: "found NOPE OR NOTHING.", reward: "all or absolutely nope", check: ({ collectedIds }) => collectedIds.includes("nopeornothing") },
  { id: "both-options-rejected", name: "BOTH OPTIONS REJECTED", description: "found both NOPE OR Uber relics.", reward: "choice deleted", check: ({ collectedIds }) => collectedIds.includes("nopeorno") && collectedIds.includes("nopeornothing") },
  { id: "uberly-pointless", name: "UBERLY POINTLESS", description: "found an Uber NOPE.", reward: "probability trauma", check: ({ uberCollectedCount }) => uberCollectedCount >= 1 },
  { id: "duplicate-damage", name: "DUPLICATE DAMAGE", description: "found 10 duplicates.", reward: "recycled disappointment", check: ({ duplicateCount }) => duplicateCount >= 10 },
  { id: "emotional-recycling", name: "EMOTIONAL RECYCLING", description: "found 50 duplicates.", reward: "reused pain", check: ({ duplicateCount }) => duplicateCount >= 50 },
  { id: "again-really", name: "AGAIN? REALLY?", description: "found 100 duplicates.", reward: "deja nope", check: ({ duplicateCount }) => duplicateCount >= 100 },
  { id: "spread-the-disease", name: "SPREAD THE DISEASE", description: "shared a worthless find.", reward: "influence not included", check: ({ shareCount }) => shareCount >= 1 },
  { id: "public-embarrassment", name: "PUBLIC EMBARRASSMENT", description: "shared 5 worthless finds.", reward: "social damage", check: ({ shareCount }) => shareCount >= 5 },
  { id: "copypasta-contagion", name: "COPYPASTA CONTAGION", description: "copied share text 10 times.", reward: "clipboard infection", check: ({ shareCopyCount }) => shareCopyCount >= 10 },
  { id: "contract-said-non", name: "THE CONTRACT SAID NON", description: "copied the contract address.", reward: "non confirmed", check: ({ contractCopyCount }) => contractCopyCount >= 1 },
  { id: "rare-mistake-achievement", name: "RARE MISTAKE", description: "discovered a rare mistake.", reward: "statistically unimpressive", check: ({ rareCollectedCount }) => rareCollectedCount >= 1 },
  { id: "epic-failure-achievement", name: "EPIC FAILURE", description: "discovered an epic failure.", reward: "larger disappointment", check: ({ epicCollectedCount }) => epicCollectedCount >= 1 },
  { id: "common-sense-lost", name: "COMMON SENSE LOST", description: "collected 25 common trash stickers.", reward: "common sense not found", check: ({ commonCollectedCount }) => commonCollectedCount >= 25 },
  { id: "rubbish-with-range", name: "RUBBISH WITH RANGE", description: "collected 10 uncommon rubbish stickers.", reward: "premium garbage", check: ({ uncommonCollectedCount }) => uncommonCollectedCount >= 10 },
  { id: "total-nopeification", name: "TOTAL NOPEIFICATION", description: "completed the non-Uber NOPEDEX.", reward: "seek help", check: ({ normalCollectedCount, gifCollectedCount, mythicCollectedCount }) => normalCollectedCount >= NORMAL_TOTAL && gifCollectedCount >= GIF_TOTAL && mythicCollectedCount >= MYTHIC_TOTAL },
  { id: "ascended-into-nope", name: "ASCENDED INTO NOPE", description: "found every Uber NOPE.", reward: "Telegram tag maybe, eventually", check: ({ uberCollectedCount }) => uberCollectedCount >= UBER_TOTAL },
];

export function getRank(count) {
  return ranks.find((rank) => count >= rank.count).name;
}

export function pickDiscoveryEntity() {
  const hits = allNopeEntities.filter((entity) => Math.random() * 100 < entity.dropChance);

  if (hits.length === 0) {
    return null;
  }

  return hits[Math.floor(Math.random() * hits.length)];
}


export const gifNopeEntities = forbiddenNopeGifs;
export const mythicNopeEntities = mythicNopeRelics;
export const uberNopeEntities = uberNopeRelics;

export function getNopeEntityById(id) {
  return allNopeEntities.find((entity) => entity.id === id);
}

export function getAchievementById(id) {
  return achievements.find((achievement) => achievement.id === id);
}
