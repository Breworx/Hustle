// Jobs, fighters, districts and the stories told about them.
import {SKIN} from "./catalog.js";
const DISTRICTS=[
 {id:"water",n:"Waterfront",lvl:1,fare:30,seed:7,sky:["#f4c84a","#e06a2a"],far:"#8a2a1c",near:"#1b1714",lamp:"#f2c23a",neon:"#4fe3ff",weather:"rain",blurb:"Ferries, food carts and tourists with fat wallets."},
 {id:"old",n:"Old Town",lvl:4,fare:80,seed:23,sky:["#f0b84a","#b0386a"],far:"#5a1c3a",near:"#1b1714",lamp:"#f5c96a",neon:"#ff5fc8",weather:"rain",blurb:"Pawn shops, call centres and narrow brick lanes."},
 {id:"docks",n:"The Docks",lvl:8,fare:150,seed:41,sky:["#e8b21f","#c3301f"],far:"#6a2410",near:"#1b1714",lamp:"#f2c23a",neon:"#ffb547",weather:"fog",blurb:"Containers, cranes and the casino on the pier."},
 {id:"heights",n:"The Heights",lvl:15,fare:300,seed:67,sky:["#d9c7f0","#3a2a6a"],far:"#2a1f4a",near:"#120e22",lamp:"#e8e2ff",neon:"#9f8cff",weather:"clear",blurb:"Glass towers, private lifts and money that never touches the ground."},
 {id:"airport",n:"The Airport",lvl:22,fare:500,seed:83,sky:["#c9e4f0","#1f3a5a"],far:"#1a2c40",near:"#0b1420",lamp:"#bfe3ff",neon:"#6db7e8",weather:"clear",blurb:"Cargo sheds, private hangars and a customs hall that can be talked round."},
 {id:"island",n:"Casino Island",lvl:30,fare:800,seed:97,sky:["#ffd27a","#6a1f3a"],far:"#3a1424",near:"#14070d",lamp:"#ffd27a",neon:"#ff5fa0",weather:"clear",blurb:"A private island of chandeliers and high rollers, guarded like a mint."}
];
const CRIMES=[
 {id:"bins",d:"any",n:"Rummage through bins",nv:1,base:92,min:0,max:12,lvl:1,xp:1,ic:"bin"},
 {id:"shop",d:"water",n:"Shoplift from the dairy",nv:2,base:88,min:5,max:30,lvl:1,xp:2,ic:"bag"},
 {id:"pick",d:"water",n:"Pickpocket ferry tourists",nv:3,base:74,min:20,max:85,lvl:1,xp:3,ic:"wallet"},
 {id:"tag",d:"water",n:"Tag a billboard for a crew",nv:3,base:72,min:30,max:95,lvl:2,xp:4,ic:"spray"},
 {id:"snk",d:"water",n:"Flog knock-off sneakers",nv:4,base:64,min:50,max:160,lvl:2,xp:5,ic:"sneaker"},
 {id:"ute",d:"old",n:"Break into a parked ute",nv:5,base:56,min:120,max:420,lvl:4,xp:7,ic:"ute"},
 {id:"scam",d:"old",n:"Run a phone scam",nv:6,base:50,min:200,max:620,lvl:5,xp:9,ic:"phone"},
 {id:"pawn",d:"old",n:"Fence jewellery at the pawn shop",nv:7,base:44,min:300,max:950,lvl:6,xp:11,ic:"diamond"},
 {id:"ware",d:"docks",n:"Warehouse job",nv:10,base:36,min:1000,max:3200,lvl:8,xp:18,ic:"crate"},
 {id:"smug",d:"docks",n:"Smuggle a container",nv:12,base:30,min:2500,max:7000,lvl:10,xp:24,ic:"boat"},
 {id:"vault",d:"docks",n:"Crack the casino vault",nv:15,base:22,min:5000,max:16000,lvl:12,xp:30,ic:"vault"},
 {id:"party",d:"heights",n:"Work a penthouse party",nv:12,base:34,min:4000,max:11000,lvl:15,xp:28,ic:"mask"},
 {id:"armour",d:"heights",n:"Hijack an armoured van",nv:16,base:24,min:9000,max:26000,lvl:17,xp:38,ic:"van"},
 {id:"insider",d:"heights",n:"Sell an insider tip",nv:18,base:20,min:15000,max:45000,lvl:20,xp:50,ic:"chart"},
 {id:"cargo",d:"airport",n:"Swap a cargo pallet",nv:18,base:30,min:20000,max:55000,lvl:22,xp:60,ic:"crate"},
 {id:"diamonds",d:"airport",n:"Walk diamonds through customs",nv:20,base:24,min:40000,max:110000,lvl:25,xp:80,ic:"diamond"},
 {id:"jet",d:"airport",n:"Steal a private jet",nv:24,base:18,min:90000,max:240000,lvl:28,xp:110,ic:"plan"},
 {id:"highroller",d:"island",n:"Rig the high-roller table",nv:22,base:26,min:120000,max:300000,lvl:30,xp:130,ic:"dice"},
 {id:"gold",d:"island",n:"Empty the gold reserve",nv:26,base:18,min:250000,max:650000,lvl:34,xp:180,ic:"vault"},
 {id:"bigone",d:"island",n:"The Big One",nv:30,base:12,min:800000,max:2000000,lvl:38,xp:300,ic:"trophy"}
 ,{id:"launder",d:"island",n:"Wash a fortune through the casino",nv:28,base:24,min:2500000,max:6000000,lvl:42,xp:420,ic:"dice"}
 ,{id:"porthack",d:"docks",n:"Hack the port's shipping system",nv:30,base:22,min:3500000,max:8500000,lvl:46,xp:520,ic:"phone"}
 ,{id:"yachtransom",d:"island",n:"Hold a billionaire's yacht to ransom",nv:32,base:20,min:5000000,max:12000000,lvl:50,xp:650,ic:"boat"}
 ,{id:"counterfeit",d:"old",n:"Print a run of perfect banknotes",nv:34,base:20,min:7000000,max:16000000,lvl:55,xp:800,ic:"chart"}
 ,{id:"centralbank",d:"heights",n:"Rob the central bank's night vault",nv:36,base:18,min:10000000,max:24000000,lvl:60,xp:1000,ic:"vault"}
 ,{id:"crownjewels",d:"heights",n:"Lift the crown jewels from the museum",nv:38,base:16,min:14000000,max:34000000,lvl:66,xp:1250,ic:"diamond"}
 ,{id:"bullion",d:"airport",n:"Hijack a gold bullion flight",nv:40,base:15,min:20000000,max:48000000,lvl:72,xp:1550,ic:"plan"}
 ,{id:"chipswap",d:"island",n:"Swap every chip in the casino for fakes",nv:42,base:14,min:28000000,max:65000000,lvl:78,xp:1900,ic:"dice"}
 ,{id:"council",d:"heights",n:"Buy the city council",nv:45,base:13,min:38000000,max:90000000,lvl:84,xp:2300,ic:"mask"}
 ,{id:"union",d:"docks",n:"Take over the docks union",nv:48,base:12,min:52000000,max:120000000,lvl:89,xp:2800,ic:"crate"}
 ,{id:"deeds",d:"heights",n:"Steal the deeds to Greyhaven Tower",nv:51,base:11,min:70000000,max:160000000,lvl:94,xp:3400,ic:"van"}
 ,{id:"lastjob",d:"island",n:"The Last Job",nv:55,base:9,min:120000000,max:300000000,lvl:98,xp:4500,ic:"trophy"}
];
const CRIME_LOOT={bins:["junk","food","plush","card","stamp"],shop:["food","use","junk","card"],pick:["junk","jewel","stamp","card"],tag:["junk","record","comic"],snk:["armour","junk","elec"],ute:["weapon","elec","junk","food"],scam:["elec","card"],pawn:["jewel","coin","figure","record"],ware:["elec","weapon","box","armour"],smug:["collect","box","fossil","figure"],vault:["coin","jewel","collect","fossil"],party:["jewel","elec","figure","record"],armour:["coin","weapon","armour","box"],insider:["collect","coin","jewel","fossil"],cargo:["elec","box","figure","record"],diamonds:["jewel","coin","collect"],jet:["collect","fossil","box"],highroller:["coin","jewel","card"],gold:["coin","collect","fossil","jewel"],bigone:["collect","fossil","jewel","coin"],launder:["jewel","coin","collect"],porthack:["elec","box","collect"],yachtransom:["jewel","collect","fossil"],counterfeit:["coin","stamp","collect"],centralbank:["coin","jewel","box"],crownjewels:["jewel","collect","fossil"],bullion:["coin","jewel","collect"],chipswap:["coin","collect","box"],council:["collect","stamp","jewel"],union:["box","collect","weapon"],deeds:["collect","jewel","fossil"],lastjob:["jewel","collect","fossil","coin"]};
const FOES=[
 {d:"water",n:"Corner kid",p:20,cash:[20,90],xp:8,lvl:1,skin:SKIN[2],hat:"cap",shirt:"#d97bb3",bg:"#1c5568",grin:1,loot:["junk","plush","card","food"]},
 {d:"water",n:"Nightclub bouncer",p:90,cash:[80,300],xp:18,lvl:2,skin:SKIN[3],hat:"bald",shirt:"#111",bg:"#12313f",shades:1,loot:["armour","use","food"]},
 {d:"old",n:"Debt collector",p:260,cash:[250,800],xp:35,lvl:4,skin:SKIN[0],hat:"slick",shirt:"#4a3a5a",bg:"#5a2c54",scar:1,loot:["jewel","elec","record"]},
 {d:"old",n:"Bikie enforcer",p:700,cash:[700,2200],xp:70,lvl:6,skin:SKIN[4],hat:"bandana",shirt:"#222",bg:"#2b1d36",beard:1,loot:["weapon","armour"]},
 {d:"docks",n:"Dock boss",p:1800,cash:[2000,6000],xp:140,lvl:9,skin:SKIN[1],hat:"beanie",shirt:"#f2a33a",bg:"#7a3a14",beard:1,scar:1,loot:["collect","box","fossil"]},
 {d:"docks",n:"The Kingpin",p:5000,cash:[8000,25000],xp:300,lvl:13,skin:SKIN[5],hat:"fedora",shirt:"#3a1414",bg:"#3a2014",chain:1,shades:1,grin:1,loot:["jewel","coin","collect","fossil"]}
 ,{d:"heights",n:"Private security",p:9000,cash:[10000,30000],xp:420,lvl:15,skin:SKIN[1],hat:"headset",shirt:"#111",bg:"#2a1f4a",shades:1,loot:["armour","weapon","elec"]}
 ,{d:"heights",n:"The Developer",p:20000,cash:[25000,80000],xp:700,lvl:19,skin:SKIN[2],hat:"slick",shirt:"#e8e2ff",bg:"#3a2a6a",grin:1,chain:1,loot:["collect","jewel","coin","fossil"]}
 ,{d:"airport",n:"Customs dog handler",p:40000,cash:[50000,120000],xp:1000,lvl:22,skin:SKIN[4],hat:"cap",shirt:"#1f3a5a",bg:"#1a2c40",loot:["armour","elec","box"]}
 ,{d:"airport",n:"The Smuggler Queen",p:80000,cash:[120000,300000],xp:1500,lvl:26,skin:SKIN[2],hat:"long",shirt:"#6db7e8",bg:"#1f3a5a",lips:1,shades:1,chain:1,loot:["jewel","collect","coin"]}
 ,{d:"island",n:"Casino enforcer",p:150000,cash:[200000,500000],xp:2200,lvl:30,skin:SKIN[5],hat:"bald",shirt:"#111",bg:"#3a1424",scar:1,shades:1,loot:["weapon","armour","coin"]}
 ,{d:"island",n:"The Owner of the Island",p:400000,cash:[600000,1500000],xp:4000,lvl:35,skin:SKIN[0],hat:"fedora",shirt:"#6a1f3a",bg:"#14070d",grin:1,chain:1,loot:["collect","fossil","jewel","coin"]}
 ,{d:"heights",n:"Ex-special forces bodyguard",p:900000,cash:[1500000,4000000],xp:6000,lvl:45,skin:SKIN[1],hat:"headset",shirt:"#2f3a2a",bg:"#1d2a1a",scar:1,shades:1,loot:["weapon","armour","box"]}
 ,{d:"docks",n:"The Harbourmaster",p:2000000,cash:[3000000,8000000],xp:9000,lvl:55,skin:SKIN[3],hat:"beanie",shirt:"#273042",bg:"#12313f",beard:1,loot:["collect","fossil","coin"]}
 ,{d:"airport",n:"An Interpol agent",p:4500000,cash:[6000000,15000000],xp:13000,lvl:65,skin:SKIN[0],hat:"slick",shirt:"#1f3a5a",bg:"#0b1420",glasses:1,loot:["elec","armour","collect"]}
 ,{d:"old",n:"The Old Man of Old Town",p:9000000,cash:[12000000,30000000],xp:19000,lvl:75,skin:SKIN[1],hat:"fedora",shirt:"#3a2a1a",bg:"#5a1c3a",beard:1,chain:1,loot:["jewel","coin","fossil"]}
 ,{d:"island",n:"The Collector",p:20000000,cash:[25000000,60000000],xp:28000,lvl:86,skin:SKIN[5],hat:"long",shirt:"#e8e2ff",bg:"#3a1424",lips:1,chain:1,loot:["collect","fossil","jewel"]}
 ,{d:"island",n:"The Phantom",p:45000000,cash:[50000000,140000000],xp:40000,lvl:97,skin:SKIN[2],hat:"bald",shirt:"#111",bg:"#14070d",shades:1,scar:1,loot:["collect","fossil","jewel","coin"]}
];

/* ---------- item catalogue ---------- */
const STORY={
launder:{s:["Chips in, clean money out. By sunrise {cash} has no history at all."],f:["The cashier counts too slowly and looks up too often. You walk away from the table."],j:["The pit boss was a cop all along. {npc} reads you your rights by the roulette wheel."],h:["The casino's security team escorts you out the hard way."]},
porthack:{s:["Three containers vanish from the manifest and reappear as yours. They're worth {cash}."],f:["The firewall holds. Somewhere a sysadmin called {npc} is very pleased with himself."],j:["The trace leads straight to your laptop, and the laptop leads straight to you."],h:["The server room's fire system goes off while you're inside it."]},
yachtransom:{s:["The owner pays {cash} before lunch. He wants his tender back for the weekend."],f:["The crew lock themselves in the engine room and wait you out."],j:["The coastguard was already alongside. {npc} has a very big boat."],h:["You slip on the teak deck and go over the rail."]},
counterfeit:{s:["The notes are perfect, right down to the hologram. You move {cash} of them before anyone checks."],f:["The ink smudges on the first sheet. You burn the lot."],j:["A bank teller called {npc} holds one up to the light, then presses the button under the counter."],h:["The press catches your sleeve and nearly takes your arm."]},
centralbank:{s:["The night vault opens at 3:12am. You're gone at 3:19 with {cash}."],f:["The time lock doesn't open when the manual said it would. You leave empty-handed."],j:["Armed police in the lobby. {npc} has been waiting all night."],h:["The vault door swings back on its hinges, and you're in the way."]},
crownjewels:{s:["The display case is empty by the time the guard turns around. Fenced quietly, they bring {cash}."],f:["The laser grid is tighter than the plans said. You back out of the vent."],j:["The jewels were fakes and so was the guard. Detective {npc} enjoyed the sting."],h:["A guard dog finds you in the ventilation shaft."]},
bullion:{s:["The pallets go out the back of the plane over the bay. You pick up {cash} from a fishing boat."],f:["The flight is diverted. Your crew sits on a runway for six hours with nothing."],j:["Federal agents meet the plane on the tarmac, and you're on it."],h:["The cargo door opens early and you very nearly go with the gold."]},
chipswap:{s:["Ten thousand fake chips on the floor, ten thousand real ones in your bags. They cash out at {cash}."],f:["A croupier weighs one chip and frowns. You abort."],j:["Surveillance had the whole thing on camera. {npc} hands you the tape."],h:["The casino's owner takes the fakes very personally."]},
council:{s:["Seven councillors, seven envelopes, and the harbour rezoning goes your way. Worth {cash}."],f:["One councillor goes to the papers instead. You deny everything."],j:["The anti-corruption squad had a wire on councillor {npc}."],h:["A rival's men catch you outside the council chambers."]},
union:{s:["The union votes you in as 'consultant'. Every container now pays you. First month: {cash}."],f:["The old guard votes you down and nails your proposal to the door."],j:["Half the union were informants. {npc} counted the votes for the police."],h:["The wharfies settle it in the car park."]},
deeds:{s:["The deeds change hands in a law office at midnight. On paper, and at {cash}, the tower is yours."],f:["The safe holds copies only. The originals are somewhere else entirely."],j:["The lawyer was recording. {npc} from fraud squad was listening."],h:["The tower's security chief knows exactly where the stairwell cameras don't reach."]},
lastjob:{s:["Everything goes exactly to plan for once. You walk away with {cash} and a story nobody will believe."],f:["It falls apart in the first minute. Everyone gets out, nobody gets paid."],j:["The whole city's police force turns out for you. Commissioner {npc} makes the arrest personally."],h:["It nearly works. Nearly."]},
bins:{s:["Behind the fish market you find {cash} in loose coins and something that might be worth keeping.","A bin outside the bakery: day-old bread, a lost purse with {cash}, and a smell you will remember forever.","You dig through the skip behind the hardware store and come out with {cash} and grubby hands."],
 f:["The seagulls got here first. They're not sharing.","Wet cardboard and broken dreams. Nothing else."],
 j:["The council has started fining bin divers. Council officer {npc} is very proud that you're her first."],
 h:["A rat the size of a cat disagrees with your being there."]},
shop:{s:["You palm a pack of lollies while the owner argues with a kid about the price of a slushie. Outside, you count {cash} in loose change.","You time it with the bread delivery. Two loaves, a chocolate bar and {cash} from the counter tin. Nobody saw a thing.","The owner, {npc}, is glued to the cricket. You walk out with an armful of snacks and sell them on for {cash}."],
 f:["The bell over the door rings at the worst moment. You put the chips back and buy one lolly to look normal.","{npc} the owner looks up every time you move. You leave with nothing but a strong sense of being watched."],
 j:["You stuff a hot pie inside your jacket. It's very hot. You yelp, and the off-duty cop in the queue turns around.","The dairy has a new camera, and {npc} has already called it in. A patrol car is waiting at the corner."],
 h:["The owner's sausage dog, who has a grudge, chases you three blocks and gets your ankle."]},
pick:{s:["A tourist stops to photograph a seagull. You lift a wallet with {cash} inside and a ferry ticket to nowhere.","You bump into a man in a souvenir hat and apologise twice. He's {cash} lighter.","The 6:15 ferry is packed. By the time it docks you've collected {cash} and a laminated map of the harbour."],
 f:["You go for a handbag and find a hand already on it. Its owner smiles at you. You walk away, fast.","The wallet you lift is empty apart from a library card and a photo of a cat."],
 j:["The tourist you picked is an off-duty detective on holiday. She is not pleased.","Harbour security has been watching you for twenty minutes. {npc} from the ticket office points you out."],
 h:["You slip on a chip wrapper on the wet boardwalk and go head-first into a bollard."]},
tag:{s:["You finish the whole billboard before sunrise: a giant pigeon in sunglasses. {npc}'s crew pays you {cash}.","Up the ladder, a can in each hand. The crew's name in letters two metres tall. {cash}, cash on delivery.","You cover a real estate ad with something much better. The crew pays {cash}, and a passing bus driver honks."],
 f:["The can runs dry halfway through the first letter. It now just says 'C'.","A rival crew is already up there. You decide tonight is not the night."],
 j:["You're admiring your work from across the road when a patrol car pulls up. Your hands are bright pink.","{npc} owns the billboard. And, it turns out, the security company."],
 h:["The ladder wasn't tied down. You land in a hedge, which helps less than you'd think."]},
snk:{s:["You lay the 'Nikey Air' boxes out on a tarp at the market. They're gone in an hour and you're up {cash}.","A school kid buys four pairs and asks if you do bulk. {cash} and a new business contact.","{npc} haggles hard but you still clear {cash}. The left shoes are slightly bigger than the right ones. Nobody needs to know."],
 f:["Rain soaks the boxes and the logos run. Nobody wants melting 'Abibas'.","A customer asks what they're made of. You don't know. Neither does she. No sale."],
 j:["Your best customer is a trading standards officer with a clipboard and no sense of humour.","A market inspector asks for your stall permit. You offer him a pair of sneakers. Wrong answer."],
 h:["An unhappy customer comes back with his mates and the left shoe. He throws it hard."]},
ute:{s:["The ute's unlocked. Of course it is. A toolbox, a chilly bin and {cash} in the glovebox.","You pop the lock with a coat hanger in nine seconds flat. Stereo, tools and {cash} by morning.","{npc} left the keys in the sun visor. You take the gear from the tray and leave the dog, who seems relieved. {cash}."],
 f:["The ute's alarm plays a full country song. You listen to the first verse, then leave.","Inside there's a dozen empty energy drink cans and a single jandal."],
 j:["The ute belongs to a police dog handler. The dog is in the back. The dog is not friendly.","You're halfway through the window when the owner, {npc}, walks back with a pie and a phone already dialling 111."],
 h:["The ute rolls backwards down the hill while you're still half inside it."]},
scam:{s:["'Hello, this is your bank.' {npc} reads out every number on the card. {cash} gone before the kettle boils.","You sell {npc} a lifetime warranty on a toaster. Then the kettle. Then the toaster again. {cash} by lunch.","Forty calls, thirty-nine hang-ups and one very trusting grandson. {cash} in the account."],
 f:["The person on the other end says 'Nice try' and reads out your own phone number.","{npc} keeps you on the line for forty minutes talking about her roses. You get nothing, but you know a lot about roses."],
 j:["The 'grandmother' you've been calling is a fraud squad detective. She has been recording everything.","The call centre is raided mid-sentence. You finish the sentence in the back of a van."],
 h:["Your landlord catches you behind on rent and throws your desk chair at you. You're still sitting in it."]},
pawn:{s:["You slide a velvet bag across the counter. The owner squints, shrugs and counts out {cash}. No questions asked.","{npc} at the pawn shop has a terrible memory for faces. You leave with {cash} and a wink.","The ring's real, the paperwork isn't. The owner doesn't care. {cash}, in fifties."],
 f:["The owner tests the gold with a magnet. It sticks. He slides it back without a word.","There's a cop browsing the guitars. You decide you're just here to look at guitars."],
 j:["The necklace was reported stolen this morning. The owner already has the photo taped to his counter.","{npc} behind the counter is wearing a wire. You notice too late."],
 h:["The owner's brother takes your fake diamond personally and shows you out through the window."]},
ware:{s:["You cut the fence, find the right container and load the van in twenty minutes. Your fence pays {cash}.","The night guard, {npc}, is asleep in front of the rugby. You walk past him twice. {cash} worth of stock.","Forklift, pallet, van, gone. {cash}, and the forklift is still beeping when you leave."],
 f:["The warehouse is full of plastic garden gnomes. Thousands of them. You leave them.","The guard dog patrol changes shift early. You climb back over the fence empty-handed."],
 j:["The pallet was a police sting, packed with tracked phones. They knew your route before you did.","{npc} the guard is awake after all, and he has a very loud whistle."],
 h:["A pallet of tinned peaches comes down off the top shelf. Onto you."]},
smug:{s:["Container 947 slips through customs with its paperwork 'in order'. Your cut: {cash}.","{npc} at the port signs the manifest without looking up. By dawn the goods are gone and you're up {cash}.","The ship docks at 3am. Lights off, crane on, truck out. {cash}, and the harbour never noticed."],
 f:["Customs pick this container for a random check. You walk away from it like it belongs to someone else.","The crane driver doesn't turn up. Nobody can lift a container by hand. You tried."],
 j:["The sniffer dog checks your container, then sits down. It's carrying cheese, but you're the one in handcuffs.","{npc} from customs was never on the payroll. She was just patient."],
 h:["A crane hook swings round at head height. You see it a second too late."]},
vault:{s:["Three dials, two guards, one perfect night. The vault door swings open and you walk out with {cash}.","{npc} the pit boss owes you a favour. He looks the other way for exactly four minutes. {cash}.","You crack the vault by listening to the tumblers through a doctor's stethoscope. {cash}, and the stethoscope back where you found it."],
 f:["The vault has a new time lock. It opens in eleven hours. You don't have eleven hours.","Someone wins big on roulette and every camera swings toward the floor. You bail."],
 j:["The head of security, {npc}, was waiting inside the vault. She'd expected you for a week.","Every door in the casino locks at once. The only way out is past six guards and a very large man called {npc2}."],
 h:["The guards catch you in the car park and you learn how hard casino carpet really is."]},
party:{s:["Black tie, borrowed invitation, and a coat check nobody is watching. You leave with {cash} in other people's pockets.","{npc} the caterer lets you carry trays. Between canapés you lift {cash} in watches and wallets."],
 f:["The host recognises you from the Docks. You're shown the lift, politely, by two very large men.","Every bag in the cloakroom is chained to the rail. Classy and careful."],
 j:["Plain-clothes officer {npc} was a guest. She enjoyed the canapés and enjoyed arresting you more."],
 h:["You slip on a marble staircase that cost more than your life. The ambulance takes its time."]},
armour:{s:["A fake roadworks sign, a nervous driver and four very heavy bags. {cash}, and not a shot fired.","{npc} on the inside left the back door unlocked at 3:12. By 3:15 you're {cash} richer."],
 f:["The van takes a different route today. You spend an hour staring at an empty road.","The driver hits the panic button before you're out of the car. You abort."],
 j:["Armed response arrives in ninety seconds. You're face down on the motorway by minute two."],
 h:["The guard had a stun baton and opinions. You wake up in A&E."]},
insider:{s:["A whisper about a merger, sold to the right man in the right bar. He pays {cash} in cash, and you never met.","{npc} at the brokerage buys your tip for {cash}. By Friday the shares have doubled and you're a ghost."],
 f:["Your tip turns out to be yesterday's news. Your buyer laughs you out of the club.","The deal falls through before you can sell the story. Nobody wants it now."],
 j:["Your buyer was wearing a wire. Financial crimes officer {npc} has been waiting months for this."],
 h:["The man whose secret you sold sends two friends to explain how he feels about it."]},
cargo:{s:["Two pallets, two labels, one sticker gun. By the time anyone notices, the right goods are on the wrong plane and {cash} is in your account.","{npc} on the forklift owes you one. A pallet of phones goes missing and you're {cash} better off."],
 f:["The pallet you wanted was loaded an hour early. Wrong plane, wrong country.","Someone has written your pallet's number on a whiteboard in the security office. You walk away."],
 j:["Airport police officer {npc} has been watching the cargo bays all week. She's very pleased to meet you."],
 h:["A forklift reverses into you at walking pace. It still breaks two ribs."]},
diamonds:{s:["You walk through the green lane with $4 million sewn into a jacket lining. Your cut is {cash}.","{npc} at the customs desk waves you through without looking up. {cash} for a very relaxed walk."],
 f:["The flight is diverted. You spend six hours in a departure lounge with stones in your shoes, then fly home.","A sniffer dog takes an interest in your bag. You abandon it in the toilets."],
 j:["Customs officer {npc} asks you to step this way. You do not enjoy the next eleven hours."],
 h:["Your courier contact decides to keep the diamonds and you. It doesn't go well for either of you."]},
jet:{s:["Ground crew think you're the owner's nephew. You taxi out, take off, and sell the jet in another city for {cash}.","{npc} files a flight plan in your name. Six hours later you're {cash} richer and the jet has a new tail number."],
 f:["The jet has no fuel. Of course it has no fuel.","Air traffic control asks for a callsign you don't have. You climb back out and walk off quickly."],
 j:["The jet's real owner is standing on the tarmac with three airport police. Awkward."],
 h:["You jump from the steps as it starts to roll. Tarmac is very hard."]},
highroller:{s:["A marked deck, a dealer called {npc}, and a high roller who never stood a chance. {cash} across the felt.","You count the cards for three hours and leave with {cash} and a free room you'll never use."],
 f:["The pit boss swaps decks halfway through. The rest of the night is just honest gambling, and you lose.","The cameras find your partner's earpiece. You both leave before the security team arrives."],
 j:["Casino security officer {npc} walks you to a very small room with no windows and calls the police."],
 h:["The high roller you cleaned out brought friends. They explain the rules of fair play with their fists."]},
gold:{s:["Down two vaults, through three doors, past one sleeping guard. You carry out {cash} in gold bars.","{npc} on the night shift turns the cameras to face the wall for nine minutes. Long enough for {cash} in gold."],
 f:["The second vault has a time lock nobody mentioned. You leave empty-handed and very annoyed.","A gold bar is much heavier than you expected. You can't lift it. Nobody can lift it."],
 j:["The vault door closes behind you. The island's own police open it again at breakfast."],
 h:["The gold shelf collapses. Gold is heavy. You learn exactly how heavy."]},
bigone:{s:["Every guard, every camera, every lock. Planned for a year, done in an hour. {cash}, and a story nobody will ever believe.","{npc}, the floor manager, the helicopter pilot and you. The cleanest job in the island's history: {cash}."],
 f:["Everything goes perfectly until the helicopter doesn't arrive. You swim back to the mainland with nothing.","The island goes into lockdown an hour early. Someone talked."],
 j:["The Owner was expecting you. Island police, mainland police and a very unimpressed judge."],
 h:["The Owner's personal guard is waiting at the vault door. You wake up in A&E three days later."]}
};
const BUSTSTORY={s:["You phone in a noise complaint two streets away. While the duty sergeant is on the call, you walk {npc} out the back door. They slip you {cash}.","A borrowed key, a squeaky gate and a very quiet corridor. {npc} is free and presses {cash} into your hand."],
 f:["The cell door creaks. Loudly. You leave {npc} where they are.","{npc} won't stop talking. You give up before the guard notices."],
 j:["The guard was only pretending to sleep. Now you're sharing a cell with {npc}.","You pick the lock perfectly. Then the door behind you clicks shut."]};
const HSTORY={clean:["Nine minutes, start to finish. Every guard change called, the lock gave on the second try, and the car was rolling before the alarm went off.","Textbook. You walk out the front door in a borrowed uniform while security chases a decoy two streets away."],
 partial:["The getaway car stalls at the lights. You run for it with one bag and leave the rest in the boot.","A bag splits going over the fence. Banknotes everywhere. You keep what you can carry."],
 caught:["The lock was fine. The silent alarm wasn't. Officers are waiting at both exits.","You're inside when the lights come on. All of them."],
 abort:["The scout spots an unmarked van across the road. The same van as yesterday. You call it off.","Too many guards, too much light. Some nights you just go home."]};
const BOXSTORY=["You prise the lid off with a screwdriver.","Inside, wrapped in newspaper from 1998:","The lock gives with a satisfying clunk.","You shake it, listen, then open it."];
const BOTTLESTORY=["The note inside, in faded pencil, says: 'Sorry about the boat.' Rolled up with it is something worth keeping.","It's a love letter from 1962, signed 'Forever, M'. Something is tucked inside.","The note says 'HELP' and, underneath, 'never mind, all good'. There's a gift too."];
const MAPSTORY=["You follow the old map to a crumbling wall under the third pier. Behind a loose brick: a tin with one coin in it.","The X marks a spot behind the Old Town clock tower. You dig very quietly. Something glints."];
export{DISTRICTS,CRIMES,CRIME_LOOT,FOES,STORY,BUSTSTORY,BOXSTORY,BOTTLESTORY,MAPSTORY};
