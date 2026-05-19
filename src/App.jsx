import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const CONTRACT = "EQApjQK1qpZ3BjECMaK0GkseWS7qfnhA5YXdP-YKUkK2Hnon";
const STORAGE_KEYS = {
  collectedIds: "nopeMachine.collectedIds",
  introSeen: "nopeIntroSeen",
  latestDiscoveryId: "nopeMachine.latestDiscoveryId",
  nopeCount: "nopeMachine.nopeCount",
};

const NORMAL_TOTAL = 139;
const GIF_TOTAL = 20;

const normalNopeEntities = [
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
  { id: "nopeorno", name: "NOPE OR NO", image: "/images/nopeorno.jpg", type: "image", caption: "both are no" },
  { id: "nopeornothing", name: "NOPE OR NOTHING", image: "/images/nopeornothing.jpg", type: "image", caption: "all or absolutely nothing" },
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
  { id: "znope", name: "Z NOPE", image: "/images/znope.jpg", type: "image", caption: "final alphabet refusal" },
];

const forbiddenNopeGifs = [
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

const allNopeEntities = [...normalNopeEntities, ...forbiddenNopeGifs];

const bootLines = [
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

const nopeLabels = ["NOPE", "NOPE?", "NOOOOOPE", "ABSOLUTELY NOT", "STILL NOPE", "HARD PASS"];

const moods = [
  "legally not pepe",
  "emotionally illiquid",
  "refusing utility",
  "terminally online",
  "powered by bad decisions",
  "absolutely not financial advice",
  "checking vibes",
  "no roadmap detected",
];

const ranks = [
  { count: 500, name: "final boss of nothing" },
  { count: 250, name: "operationally useless" },
  { count: 100, name: "high priest of no" },
  { count: 50, name: "nope enjoyer" },
  { count: 25, name: "terminal idiot" },
  { count: 10, name: "pepe denier" },
  { count: 5, name: "suspicious noper" },
  { count: 0, name: "visitor" },
];

function getRank(count) {
  return ranks.find((rank) => count >= rank.count).name;
}

function pickDiscoveryEntity() {
  const pool = Math.random() < 0.12 ? forbiddenNopeGifs : normalNopeEntities;

  return pool[Math.floor(Math.random() * pool.length)];
}

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function readStoredArray(key) {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(key);
    const parsedValue = storedValue ? JSON.parse(storedValue) : [];

    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

function readStoredNumber(key) {
  if (typeof window === "undefined") {
    return 0;
  }

  const storedValue = Number(window.localStorage.getItem(key));

  return Number.isFinite(storedValue) ? storedValue : 0;
}

function readStoredString(key) {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(key);
}

export default function App() {
  const [showIntro, setShowIntro] = useState(() => readStoredString(STORAGE_KEYS.introSeen) !== "true");
  const [introChoice, setIntroChoice] = useState(null);
  const [isIntroExiting, setIsIntroExiting] = useState(false);
  const [lines, setLines] = useState([]);
  const [nopeCount, setNopeCount] = useState(() => readStoredNumber(STORAGE_KEYS.nopeCount));
  const [collectedIds, setCollectedIds] = useState(() =>
    readStoredArray(STORAGE_KEYS.collectedIds),
  );
  const [latestDiscoveryId, setLatestDiscoveryId] = useState(() =>
    readStoredString(STORAGE_KEYS.latestDiscoveryId),
  );
  const [entityTransmission, setEntityTransmission] = useState(null);
  const [breachFlash, setBreachFlash] = useState(null);
  const [nopedexPulse, setNopedexPulse] = useState(null);
  const [mood, setMood] = useState("legally not pepe");
  const [isBooting, setIsBooting] = useState(true);
  const [isGlitching, setIsGlitching] = useState(false);
  const [rankUpgrade, setRankUpgrade] = useState(null);
  const [isStickerBookOpen, setIsStickerBookOpen] = useState(false);
  const [stickerTab, setStickerTab] = useState("all");
  const [stickerFilter, setStickerFilter] = useState("all");
  const [buttonText, setButtonText] = useState("NOPE");
  const glitchTimerRef = useRef(null);
  const nopedexPulseTimerRef = useRef(null);
  const rankUpgradeTimerRef = useRef(null);
  const transmissionTimerRef = useRef(null);
  const breachTimerRef = useRef(null);
  const terminalLogRef = useRef(null);
  const lineIdRef = useRef(0);
  const nopeCountRef = useRef(nopeCount);
  const collectedIdsRef = useRef(collectedIds);
  const bootRunRef = useRef(0);

  const formattedCount = useMemo(
    () => nopeCount.toString().padStart(6, "0"),
    [nopeCount],
  );
  const currentRank = useMemo(() => getRank(nopeCount), [nopeCount]);
  const latestDiscovery = useMemo(
    () => allNopeEntities.find((entity) => entity.id === latestDiscoveryId),
    [latestDiscoveryId],
  );
  const normalCollectedCount = useMemo(
    () => collectedIds.filter((id) => normalNopeEntities.some((entity) => entity.id === id)).length,
    [collectedIds],
  );
  const gifCollectedCount = useMemo(
    () => collectedIds.filter((id) => forbiddenNopeGifs.some((entity) => entity.id === id)).length,
    [collectedIds],
  );
  const totalCollectedCount = normalCollectedCount + gifCollectedCount;

  function createLine(speaker, text = "", isTypingLine = false, important = false) {
    const id = lineIdRef.current;
    lineIdRef.current += 1;

    return {
      id,
      speaker,
      text,
      isTyping: isTypingLine,
      important,
    };
  }

  function addLine(line) {
    setLines((currentLines) => [...currentLines, line].slice(-80));
  }

  useEffect(() => {
    const terminalLog = terminalLogRef.current;

    if (terminalLog) {
      terminalLog.scrollTop = terminalLog.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    return () => {
      window.clearTimeout(glitchTimerRef.current);
      window.clearTimeout(nopedexPulseTimerRef.current);
      window.clearTimeout(rankUpgradeTimerRef.current);
      window.clearTimeout(transmissionTimerRef.current);
      window.clearTimeout(breachTimerRef.current);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.nopeCount, String(nopeCount));
    nopeCountRef.current = nopeCount;
  }, [nopeCount]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.collectedIds, JSON.stringify(collectedIds));
    collectedIdsRef.current = collectedIds;
  }, [collectedIds]);

  useEffect(() => {
    if (latestDiscoveryId) {
      window.localStorage.setItem(STORAGE_KEYS.latestDiscoveryId, latestDiscoveryId);
    }
  }, [latestDiscoveryId]);

  useEffect(() => {
    if (showIntro) {
      return undefined;
    }

    let isCancelled = false;
    const runId = bootRunRef.current + 1;
    bootRunRef.current = runId;

    async function typeBootLine(bootLine) {
      const lineId = lineIdRef.current;
      lineIdRef.current += 1;

      setLines((currentLines) => [
        ...currentLines,
        {
          id: lineId,
          speaker: "system",
          text: "",
          isTyping: true,
          important: Boolean(bootLine.important),
        },
      ]);

      for (let index = 1; index <= bootLine.text.length; index += 1) {
        if (isCancelled || bootRunRef.current !== runId) {
          return;
        }

        await sleep(bootLine.important ? randomBetween(18, 34) : randomBetween(7, 18));

        setLines((currentLines) =>
          currentLines.map((line) =>
            line.id === lineId ? { ...line, text: bootLine.text.slice(0, index) } : line,
          ),
        );
      }

      setLines((currentLines) =>
        currentLines.map((line) =>
          line.id === lineId ? { ...line, isTyping: false } : line,
        ),
      );
    }

    async function runBootSequence() {
      setLines([]);
      setIsBooting(true);

      await sleep(280);

      for (const bootLine of bootLines) {
        if (isCancelled || bootRunRef.current !== runId) {
          return;
        }

        await typeBootLine(bootLine);

        await sleep(bootLine.pause ?? randomBetween(80, 230));
      }

      if (!isCancelled && bootRunRef.current === runId) {
        setIsBooting(false);
      }
    }

    runBootSequence();

    return () => {
      isCancelled = true;
    };
  }, [showIntro]);

  function replayIntro(event) {
    event?.preventDefault();
    setIntroChoice(null);
    setIsIntroExiting(false);
    setShowIntro(true);
  }

  async function enterNopeOs(choice) {
    if (introChoice) {
      return;
    }

    setIntroChoice(choice);
    await sleep(1600);
    setIsIntroExiting(true);
    await sleep(420);
    window.localStorage.setItem(STORAGE_KEYS.introSeen, "true");
    setShowIntro(false);
  }

  function showTransmission(entity, signalType = "signal") {
    setEntityTransmission({ ...entity, signalType });
    window.clearTimeout(transmissionTimerRef.current);
    transmissionTimerRef.current = window.setTimeout(() => {
      setEntityTransmission(null);
    }, randomBetween(1800, 2500));
  }

  function showBreachFlash(entity) {
    const flashEntity =
      entity.type === "gif"
        ? entity
        : forbiddenNopeGifs[Math.floor(Math.random() * forbiddenNopeGifs.length)];

    setBreachFlash(flashEntity);
    window.clearTimeout(breachTimerRef.current);
    breachTimerRef.current = window.setTimeout(() => {
      setBreachFlash(null);
    }, randomBetween(900, 1400));
  }

  function pulseNopedex(type) {
    if (!type) {
      return;
    }

    setNopedexPulse(type);
    window.clearTimeout(nopedexPulseTimerRef.current);
    nopedexPulseTimerRef.current = window.setTimeout(() => {
      setNopedexPulse(null);
    }, type === "gif" ? 1250 : 900);
  }

  function getDiscoveryMessage(entity, alreadyCollected) {
    if (alreadyCollected) {
      return `duplicate: ${entity.name}. disappointment increased.`;
    }

    if (entity.type === "gif") {
      return `FORBIDDEN GIF BREACH: ${entity.name}. this should not have happened.`;
    }

    return `new trash discovered: ${entity.name}. value gained: zero.`;
  }

  function maybeChangeMood(chance) {
    if (Math.random() > chance) {
      return;
    }

    setMood((currentMood) => {
      let nextMood = moods[Math.floor(Math.random() * moods.length)];

      while (nextMood === currentMood && moods.length > 1) {
        nextMood = moods[Math.floor(Math.random() * moods.length)];
      }

      return nextMood;
    });
  }

  async function copyContract(event) {
    event?.preventDefault();

    if (isBooting) {
      return;
    }

    try {
      await navigator.clipboard.writeText(CONTRACT);
      addInstantNopeLine("contract copied. responsibility not included. NOPE.");
    } catch {
      addInstantNopeLine(`clipboard said no. manual contract: ${CONTRACT}`);
    }
  }

  function addInstantNopeLine(text) {
    addLine(createLine("nope", text));
  }

  function pressNope() {
    if (isBooting) {
      return;
    }

    const nextLabel = nopeLabels[Math.floor(Math.random() * nopeLabels.length)];
    const discoveredEntity = pickDiscoveryEntity();
    const alreadyCollected = collectedIdsRef.current.includes(discoveredEntity.id);
    const discoveryResponse = getDiscoveryMessage(discoveredEntity, alreadyCollected);
    const showDiscoveryOverlay = !alreadyCollected || Math.random() < 0.1;
    const showFullScreenBreach =
      discoveredEntity.type === "gif"
        ? !alreadyCollected || Math.random() < 0.25
        : alreadyCollected
          ? Math.random() < 0.03
          : Math.random() < 0.2;
    const signalType = alreadyCollected
      ? "duplicate"
      : discoveredEntity.type === "gif"
        ? "forbidden"
        : "new";
    const nextCount = nopeCountRef.current + 1;
    const nextRank = getRank(nextCount);
    const rankChanged = nextRank !== getRank(nopeCountRef.current);

    nopeCountRef.current = nextCount;
    setNopeCount(nextCount);

    if (showDiscoveryOverlay) {
      showTransmission(discoveredEntity, signalType);
    }

    if (showFullScreenBreach) {
      showBreachFlash(discoveredEntity);
    }

    setLatestDiscoveryId(discoveredEntity.id);

    if (!alreadyCollected) {
      const nextIds = [...collectedIdsRef.current, discoveredEntity.id];
      collectedIdsRef.current = nextIds;
      setCollectedIds(nextIds);
    }

    pulseNopedex(discoveredEntity.type === "gif" ? "gif" : alreadyCollected ? null : "normal");
    maybeChangeMood(0.55);
    setButtonText(nextLabel);
    setIsGlitching(true);

    if (rankChanged) {
      setRankUpgrade(nextRank);
      window.clearTimeout(rankUpgradeTimerRef.current);
      rankUpgradeTimerRef.current = window.setTimeout(() => {
        setRankUpgrade(null);
      }, 1200);
    }

    window.clearTimeout(glitchTimerRef.current);
    glitchTimerRef.current = window.setTimeout(() => {
      setIsGlitching(false);
      setButtonText("NOPE");
    }, 430);

    addInstantNopeLine(discoveryResponse);

    if (rankChanged) {
      addInstantNopeLine(`rank updated: ${nextRank}. achievement value: zero.`);
    }
  }

  function getStickerEntities() {
    if (stickerTab === "normal") {
      return normalNopeEntities;
    }

    if (stickerTab === "gif") {
      return forbiddenNopeGifs;
    }

    return allNopeEntities;
  }

  function getVisibleStickerEntities() {
    return getStickerEntities().filter((entity) => {
      const isCollected = collectedIds.includes(entity.id);

      if (stickerFilter === "found") {
        return isCollected;
      }

      if (stickerFilter === "missing") {
        return !isCollected;
      }

      return true;
    });
  }

  function renderStickerCard(entity, index) {
    const isCollected = collectedIds.includes(entity.id);
    const isGif = entity.type === "gif";

    return (
      <article
        className={`sticker-card ${isCollected ? "collected" : "locked"} ${isGif ? "gif-card" : ""}`}
        key={entity.id}
        style={{ "--sticker-tilt": `${((index % 5) - 2) * 1.25}deg` }}
      >
        {isCollected ? (
          <>
            <div className="sticker-media">
              <img
                src={entity.image}
                alt={entity.name}
                onError={(event) => {
                  event.currentTarget.classList.add("image-missing");
                }}
              />
            </div>
            <strong>{entity.name}</strong>
            <span>{isGif ? "FORBIDDEN LOOP" : "COLLECTED"}</span>
            <p>{entity.caption}</p>
            <em>value: zero</em>
          </>
        ) : (
          <>
            <div className="sticker-locked-mark">???</div>
            <strong>{isGif ? "FORBIDDEN LOOP MISSING" : "NOT FOUND"}</strong>
            <span>LOCKED TRASH</span>
            <p>{isGif ? "probability: disrespectful" : "press nope harder"}</p>
          </>
        )}
      </article>
    );
  }

  if (showIntro) {
    const introLines =
      introChoice === "red"
        ? ["> red pill selected", "> truth denied", "> booting NOPE OS..."]
        : introChoice === "blue"
          ? ["> blue pill selected", "> delusion denied", "> booting NOPE OS..."]
          : [];

    return (
      <main className={`intro-screen ${isIntroExiting ? "intro-exit" : ""}`}>
        <div className="matrix-rain" aria-hidden="true">
          {Array.from({ length: 44 }, (_, index) => (
            <span key={index}>NOPE 0101 TON ??? NOTPEPE NOPE 404 REJECT NON NOPE $NOPE 0X00</span>
          ))}
        </div>

        <section className="intro-window" aria-label="NOPE OS intro">
          <img src="/images/bluepillnope.jpg" alt="Blue pill NOPE" />

          {introChoice ? (
            <div className="intro-terminal">
              {introLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ) : (
            <div className="pill-buttons">
              <button className="red-pill" type="button" onClick={() => enterNopeOs("red")}>
                [ RED PILL ]
              </button>
              <button className="blue-pill" type="button" onClick={() => enterNopeOs("blue")}>
                [ BLUE PILL ]
              </button>
            </div>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className={`nope-page ${isGlitching ? "is-glitching" : ""}`}>
      <div className="crt-noise" />
      <header className="os-header" aria-label="NOPE OS">
        <strong>NOPE OS 0.0.1</strong>
        <span>press nope. collect garbage. close nothing.</span>
        <a href="#" onClick={replayIntro}>
          re-enter matrix
        </a>
      </header>

      <section className="machine-layout" aria-label="NOPE Machine">
        <section className="terminal-shell" aria-label="NOPE Machine terminal">
          <div className="terminal-top">
            <span className="terminal-light red" />
            <span className="terminal-light yellow" />
            <span className="terminal-light green" />
            <p>NOPE MACHINE.exe</p>
          </div>

          <div className="terminal-screen">
            <div className="terminal-log" ref={terminalLogRef} aria-live="polite">
              {lines.map((line) => (
                <p
                  className={`terminal-line ${line.speaker} ${line.important ? "important" : ""}`}
                  key={line.id}
                >
                  {line.speaker === "system" ? (
                    <>
                      <span className="terminal-text">{line.text}</span>
                      {line.isTyping && <span className="terminal-cursor" />}
                    </>
                  ) : (
                    <>
                      <span className="terminal-speaker">
                        {line.speaker === "user" ? "YOU " : "NOPE"}
                      </span>
                      <span className="terminal-prompt">&gt;</span>
                      <span className="terminal-text">{line.text || " "}</span>
                      {line.isTyping && <span className="terminal-cursor" />}
                    </>
                  )}
                </p>
              ))}
            </div>

            <div className="event-feed-footer">NOPE OS event feed // input port sealed</div>
          </div>

          {entityTransmission && (
            <aside
              className={`entity-transmission ${entityTransmission.type === "gif" ? "forbidden" : ""}`}
              aria-label="NOPE entity transmission"
            >
              <p className="panel-label">
                {entityTransmission.signalType === "forbidden"
                  ? "corrupted-nope-signal.gif"
                  : entityTransmission.signalType === "new"
                    ? "new-trash-found.jpg"
                    : entityTransmission.signalType === "duplicate"
                      ? "duplicate-trash.tmp"
                      : "corrupted-nope-signal.gif"}
              </p>
              <span className="signal-status">
                {entityTransmission.signalType === "forbidden"
                  ? "FORBIDDEN LOOP FOUND"
                  : entityTransmission.signalType === "new"
                    ? "NEW TRASH ACQUIRED"
                    : entityTransmission.signalType === "duplicate"
                      ? "DUPLICATE TRASH"
                      : "NOPE SIGNAL"}
              </span>
              <div className="transmission-media">
                <img
                  src={entityTransmission.image}
                  alt={entityTransmission.name}
                  onError={(event) => {
                    event.currentTarget.classList.add("image-missing");
                  }}
                />
              </div>
              <h2>{entityTransmission.name}</h2>
              <p>{entityTransmission.caption}</p>
              <b>value: zero</b>
            </aside>
          )}
        </section>

        <aside
          className={`rank-card ${rankUpgrade ? "rank-upgraded" : ""}`}
          aria-label="Current NOPE rank"
        >
          <p>{rankUpgrade ? "rank-upgrade.alert" : "rank.badge"}</p>
          <small>{rankUpgrade ? "RANK UPGRADE DETECTED" : "RANK"}</small>
          <strong>
            [ {isBooting ? "UNVERIFIED" : (rankUpgrade ?? currentRank).toUpperCase()} ]
          </strong>
          <span>
            status: {isBooting ? "booting nope machine" : rankUpgrade ? "achievement value zero" : mood}
          </span>
          {rankUpgrade && <em>&gt; refusing harder now</em>}
        </aside>

        <aside
          className={`nopedex-card ${nopedexPulse ? `nopedex-${nopedexPulse}` : ""}`}
          aria-label="NOPEDEX collection progress"
        >
          <p>nopedex.dat</p>
          <small className="nopedex-alert">
            {nopedexPulse === "gif"
              ? "FORBIDDEN GIF BREACH"
              : nopedexPulse === "normal"
                ? "NEW TRASH ACQUIRED"
                : "NOPEDEX"}
          </small>
          <span>
            trash: {normalCollectedCount.toString().padStart(3, "0")} / {NORMAL_TOTAL}
          </span>
          <span>
            loops: {gifCollectedCount.toString().padStart(3, "0")} / {GIF_TOTAL}
          </span>
          <span>latest:</span>
          <strong>{latestDiscovery ? latestDiscovery.name : "none. press the stupid button."}</strong>
          <button className="open-nopedex-button" type="button" onClick={() => setIsStickerBookOpen(true)}>
            [ OPEN STICKER BOOK ]
          </button>
        </aside>

      </section>

      <section className="button-zone" aria-label="NOPE button">
        <p>PRESS NOPE. COLLECT WORTHLESS TRASH.</p>
        <button className="mega-nope" type="button" onClick={pressNope} disabled={isBooting}>
          {isBooting ? "BOOTING..." : buttonText}
        </button>
        <div className="status-panel">
          <span>nopes submitted: {formattedCount}</span>
        </div>
        <div className="main-actions">
          <button type="button" onClick={() => setIsStickerBookOpen(true)}>
            [ OPEN STICKER BOOK ]
          </button>
          <button type="button" onClick={copyContract} disabled={isBooting}>
            [ COPY CONTRACT ]
          </button>
        </div>
      </section>

      <footer className="footer-links">
        <a href="#" onClick={(event) => event.preventDefault()}>
          Telegram
        </a>
        <a href="#" onClick={(event) => event.preventDefault()}>
          Chart
        </a>
        <a href="#" onClick={(event) => event.preventDefault()}>
          Buy? lol
        </a>
        <a href="#" onClick={copyContract}>
          contract
        </a>
        <a href="#" onClick={replayIntro}>
          take another pointless pill
        </a>
      </footer>

      {breachFlash && (
        <section className="breach-overlay" aria-label="Forbidden loop breach">
          <div className="breach-card">
            <p>FORBIDDEN LOOP BREACH</p>
            <img
              src={breachFlash.image}
              alt={breachFlash.name}
              onError={(event) => {
                event.currentTarget.classList.add("image-missing");
              }}
            />
            <strong>{breachFlash.name}</strong>
            <span>value gained: zero</span>
          </div>
        </section>
      )}

      {isStickerBookOpen && (
        <section className="stickerbook-overlay" aria-label="NOPEDEX sticker book">
          <div className="stickerbook-window">
            <div className="stickerbook-titlebar">
              <div>
                <strong>NOPEDEX STICKER BOOK</strong>
                <span>collect them all. achieve nothing.</span>
              </div>
              <button type="button" onClick={() => setIsStickerBookOpen(false)}>
                [ CLOSE NOPEDEX ]
              </button>
            </div>

            <div className="stickerbook-summary">
              <span>worthless finds: {normalCollectedCount} / {NORMAL_TOTAL}</span>
              <span>forbidden loops: {gifCollectedCount} / {GIF_TOTAL}</span>
              <span>total trash: {totalCollectedCount} / {NORMAL_TOTAL + GIF_TOTAL}</span>
              <span>portfolio impact: none</span>
            </div>

            <div className="stickerbook-controls" aria-label="NOPEDEX view controls">
              {[
                ["all", "ALL TRASH"],
                ["normal", "WORTHLESS NOPES"],
                ["gif", "FORBIDDEN LOOPS"],
              ].map(([value, label]) => (
                <button
                  className={stickerTab === value ? "active" : ""}
                  key={value}
                  type="button"
                  onClick={() => setStickerTab(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="stickerbook-controls filter-controls" aria-label="NOPEDEX filters">
              {[
                ["all", "ALL"],
                ["found", "FOUND"],
                ["missing", "MISSING"],
              ].map(([value, label]) => (
                <button
                  className={stickerFilter === value ? "active" : ""}
                  key={value}
                  type="button"
                  onClick={() => setStickerFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="sticker-grid">{getVisibleStickerEntities().map(renderStickerCard)}</div>
          </div>
        </section>
      )}
    </main>
  );
}
