// Seasonal events. Each runs on the same dates every year (New Zealand time).
// While one is on: its limited items can drop from jobs and fights, and actions earn event points.
// When it ends, the top 10 on the event leaderboard can claim that year's trophy.
// Items are limited per event, forever: once they're all found, they only change hands on the market.
export const SEASONS = [
  { id: "heatwave", n: "Summer Heatwave", from: [1, 6], to: [2, 9], icon: "Sun",
    blurb: "Forty degrees in the shade. Tempers short, windows open, and nobody guarding anything properly.",
    points: { job: 1, fight_win: 3, bust: 2, train: 0.1 },
    items: [
      { id: "ev_heat_jandal", n: "Melted jandal", r: 1, supply: 2500, v: 400, sh: "jandal", c: "#ff7a3d", d: "Left on the asphalt at the Waterfront for one second too long." },
      { id: "ev_heat_iceblock", n: "Last ice block in the city", r: 2, supply: 300, v: 6000, sh: "icecream", c: "#6db7e8", d: "Still frozen. Somehow. Everyone wants it." },
      { id: "ev_heat_fan", n: "Golden desk fan", r: 3, supply: 40, v: 60000, sh: "wheel", c: "#f2c14e", d: "The only working fan in Old Town during the great heatwave." },
      { id: "ev_heat_sun", n: "Bottled sunshine", r: 4, supply: 4, v: 600000, sh: "bottle", c: "#f2c14e", d: "Captured at noon on the hottest day ever recorded in the harbour." },
    ] },
  { id: "storms", n: "Winter Storms", from: [6, 20], to: [7, 20], icon: "CloudLightning",
    blurb: "Gales off the harbour knock the power out every night. Dark streets, wet alarms, rich pickings.",
    points: { job: 1, fight_win: 3, bust: 3, use: 1 },
    items: [
      { id: "ev_storm_umbrella", n: "Inside-out umbrella", r: 1, supply: 2500, v: 400, sh: "umbrella", c: "#748a88", d: "Lost a fight with a southerly. So did its owner." },
      { id: "ev_storm_sign", n: "Storm-blown shop sign", r: 2, supply: 300, v: 6000, sh: "ticket", c: "#e8664f", d: "Blew three blocks from the bakery. The bakery would like it back." },
      { id: "ev_storm_lantern", n: "Harbour storm lantern", r: 3, supply: 40, v: 60000, sh: "spyglass", c: "#f0a43a", d: "Kept the ferries off the rocks the night the lighthouse failed." },
      { id: "ev_storm_lightning", n: "Lightning in a bottle", r: 4, supply: 4, v: 600000, sh: "bottle", c: "#9f8cff", d: "It still crackles when you hold it up to your ear." },
    ] },
  { id: "halloween", n: "Halloween Night", from: [10, 24], to: [10, 31], icon: "Ghost",
    blurb: "Masks everywhere, so nobody can tell who's trick-or-treating and who's robbing the place.",
    points: { job: 1, fight_win: 3, bust: 2 },
    items: [
      { id: "ev_hw_mask", n: "Rubber monster mask", r: 1, supply: 2500, v: 400, sh: "plush", c: "#5cc8a0", d: "Half the jobs in the city were done in one of these tonight." },
      { id: "ev_hw_lolly", n: "Bucket of stolen lollies", r: 2, supply: 300, v: 6000, sh: "chips", c: "#ff7a3d", d: "Confiscated from a gang of nine-year-olds. Morally complicated." },
      { id: "ev_hw_ring", n: "Haunted signet ring", r: 3, supply: 40, v: 60000, sh: "ring", c: "#b18be8", d: "Feels cold. Gets colder near police officers." },
      { id: "ev_hw_skull", n: "Crystal skull", r: 4, supply: 4, v: 600000, sh: "bone", c: "#e8e2ff", d: "From the Old Town museum's locked basement. It was not on display for a reason." },
    ] },
  { id: "fireworks", n: "Fireworks Week", from: [11, 1], to: [11, 10], icon: "Sparkles",
    blurb: "Rockets every night for a week. Nobody hears a window break, and every alarm sounds like a bang.",
    points: { job: 1, fight_win: 3, bust: 2, market: 1 },
    items: [
      { id: "ev_fw_rocket", n: "Spent sky rocket", r: 1, supply: 2500, v: 400, sh: "bottle", c: "#e8664f", d: "It went up. It came down on someone's car." },
      { id: "ev_fw_sparkler", n: "Golden sparkler", r: 2, supply: 300, v: 6000, sh: "feather", c: "#f2c14e", d: "Never stops fizzing. Nobody knows why." },
      { id: "ev_fw_wheel", n: "The last Catherine wheel", r: 3, supply: 40, v: 60000, sh: "wheel", c: "#ff5fc8", d: "Banned after the 1994 incident. This is one of the few left." },
      { id: "ev_fw_star", n: "Fallen firework star", r: 4, supply: 4, v: 600000, sh: "meteor", c: "#f2c14e", d: "Still glowing. It landed in Aunty Rose's chilly bin." },
    ] },
  { id: "christmas", n: "The Christmas Heist", from: [12, 10], to: [12, 26], icon: "Gift",
    blurb: "Every shop is full, every courier is late, and every warehouse is stacked to the roof with presents.",
    points: { job: 1, fight_win: 2, bust: 3, use: 1, market: 1 },
    items: [
      { id: "ev_xm_cracker", n: "Unpulled Christmas cracker", r: 1, supply: 2500, v: 400, sh: "ticket", c: "#e8664f", d: "Contains a paper hat, a bad joke, and possibly a small plastic fish." },
      { id: "ev_xm_sack", n: "Santa's sack (empty)", r: 2, supply: 300, v: 6000, sh: "box", c: "#c2412b", d: "Lifted off a mall Santa. The kids didn't notice. Santa did." },
      { id: "ev_xm_bauble", n: "Golden bauble", r: 3, supply: 40, v: 60000, sh: "jpend", c: "#f2c14e", d: "From the top of the tree in the Heights shopping centre. Real gold." },
      { id: "ev_xm_star", n: "The Christmas star", r: 4, supply: 4, v: 600000, sh: "statue", c: "#f2c14e", d: "From the very top of the harbour's giant tree. Someone climbed sixty metres for it." },
    ] },
];
// One trophy per event, ten a year.
export const TROPHIES = SEASONS.map(s => ({ id: "trophy_" + s.id, n: `${s.n} trophy`, r: 4, supply: 100, v: 1000000, sh: "statue", c: "#f2c14e", event: s.id,
  d: `Awarded to the top ten players of ${s.n}. Engraved with the year.` }));
