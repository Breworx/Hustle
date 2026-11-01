// The exchange: each game company is a stand-in for a real US-listed company ("twin").
// Every trading day its price moves by the same % its twin moved at the close.
export const STOCKS=[
 {t:"GRCH",n:"Greenchip Graphics",sector:"Graphics chips",twin:"NVDA",base:180,vol:1.3,shares:100,perk:"passive:job",desc:"+3% job success while you hold the block"},
 {t:"ORCH",n:"Orchard Computers",sector:"Phones and laptops",twin:"AAPL",base:250,vol:0.9,shares:100,perk:"daily:elec",desc:"A gadget every day"},
 {t:"WNDO",n:"Windowpane Software",sector:"Software",twin:"MSFT",base:420,vol:0.8,shares:100,perk:"daily:cash750",desc:"A $750 dividend every day"},
 {t:"VOLT",n:"Volta Motors",sector:"Electric cars",twin:"TSLA",base:300,vol:1.8,shares:100,perk:"passive:freetaxi",desc:"Taxis are free"},
 {t:"RVBX",n:"Riverbox Retail",sector:"Online shopping",twin:"AMZN",base:220,vol:1,shares:150,perk:"daily:smallbox",desc:"A small mystery box every day"},
 {t:"CHPW",n:"Chipwell Corp",sector:"Processors",twin:"INTC",base:40,vol:1.4,shares:500,perk:"passive:gym",desc:"+5% gym gains while you hold the block"},
 {t:"RDLN",n:"Redline Microdevices",sector:"Processors",twin:"AMD",base:160,vol:1.4,shares:100,perk:"passive:power",desc:"+5% fight power while you hold the block"},
 {t:"MGTA",n:"Magenta Mobile",sector:"Phone networks",twin:"TMUS",base:230,vol:0.8,shares:100,perk:"daily:burner",desc:"A burner phone every day"},
 {t:"TRHD",n:"Trailhead Motors",sector:"Electric trucks",twin:"RIVN",base:15,vol:1.8,shares:1000,perk:"passive:fasttaxi",desc:"Taxi rides take 20 seconds"},
 {t:"EXOD",n:"Exodus Oil",sector:"Oil and gas",twin:"XOM",base:115,vol:0.7,shares:200,perk:"daily:cash500",desc:"A $500 dividend every day"},
 {t:"CRMB",n:"Cookie & Crumb",sector:"Snacks",twin:"MDLZ",base:62,vol:0.6,shares:300,perk:"daily:food3",desc:"Three snacks every day"},
 {t:"CNBL",n:"Coinbarrel Exchange",sector:"Crypto trading",twin:"COIN",base:300,vol:2,shares:50,perk:"daily:coin",desc:"An old coin every day"},
 {t:"UPVT",n:"Upvote Forums",sector:"Social media",twin:"RDDT",base:190,vol:1.8,shares:100,perk:"passive:heat",desc:"Heat fades 25% faster"},
 {t:"BLKW",n:"Blockworld Games",sector:"Video games",twin:"RBLX",base:110,vol:1.6,shares:200,perk:"daily:card",desc:"A trading card every day"},
 {t:"SHWD",n:"Sherwood Trading",sector:"Share trading app",twin:"HOOD",base:120,vol:1.8,shares:100,perk:"passive:slots",desc:"+2 market listing slots"},
 {t:"RSCF",n:"Rosecliff Pharma",sector:"Medicines",twin:"ABBV",base:210,vol:0.6,shares:100,perk:"daily:med2",desc:"Two first-aid kits every day"},
 {t:"QWIK",n:"Qwikchip Wireless",sector:"Phone chips",twin:"QCOM",base:165,vol:1.2,shares:100,perk:"daily:drink",desc:"An energy drink every day"},
 {t:"DOOR",n:"Doorknock Delivery",sector:"Food delivery",twin:"DASH",base:260,vol:1.2,shares:150,perk:"daily:food2",desc:"Two meals delivered every day"}
];
// Real % moves at the US close on Fri 30 Oct 2026 (Capp Notes closing look; StockTitan market wrap). Not available for AAPL, MSFT, TSLA.
export const REAL_1030={GRCH:-4.22,RVBX:-1.41,CHPW:-28.58,RDLN:-10.88,MGTA:6.21,TRHD:6.20,EXOD:2.16,CRMB:3.85,CNBL:-10.62,UPVT:-29.22,BLKW:-18.05,SHWD:-7.21,RSCF:1.41,QWIK:-11.12,DOOR:-0.01};
// Same formula as game.stock_now() in the database, so the board and the server agree on the price.
export function stockNow(t,base,vol,ms=Date.now()){let s=0;for(const ch of t)s+=ch.charCodeAt(0);const x=ms/1000;
  return Math.round(base*(1+vol*0.006*(Math.sin(x/2220+s*0.37)+0.6*Math.sin(x/660+s*1.13)+0.3*Math.sin(x/180+s*2.71)))*100)/100}
