/* =========================================================
   LIO TWEAKS — supported games
   To add a game: add an entry here, then tag guides with its id.
   ========================================================= */
window.LT.GAMES = [
  { id: "fortnite", name: "Fortnite", short: "FN", blurb: "Graphics, rendering, controller and keyboard & mouse settings.", tools: ["fortnite", "controller", "kbm"] },
  { id: "cod", name: "Call of Duty", short: "CoD", blurb: "Clarity, field of view and performance settings.", tools: ["pc", "controller", "kbm"] },
  { id: "minecraft", name: "Minecraft", short: "MC", blurb: "Java and Bedrock performance settings.", tools: ["pc"] },
  { id: "roblox", name: "Roblox", short: "RBX", blurb: "Graphics quality and smoother gameplay.", tools: ["pc"] },
  { id: "valorant", name: "Valorant", short: "VAL", blurb: "Competitive video and mouse settings.", tools: ["pc", "kbm"] },
  { id: "apex", name: "Apex Legends", short: "APX", blurb: "Video settings, frame cap and clarity.", tools: ["pc", "controller", "kbm"] }
];
window.LT.gameById = (id) => window.LT.GAMES.find(g => g.id === id);
