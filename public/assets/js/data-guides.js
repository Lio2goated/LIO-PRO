/* =========================================================
   LIO TWEAKS — free guide library
   Each guide: id, title, cat, game (optional), mins, summary, intro, steps [[title, text]], tip
   Pro guides are NOT stored here — only their titles. Their content
   lives in the Supabase "pro_content" table and is only sent to Pro members.
   ========================================================= */
window.LT.GUIDE_CATS = [
  { id: "fortnite", name: "Fortnite" },
  { id: "pc", name: "PC" },
  { id: "console", name: "Console" },
  { id: "general", name: "General Gaming" },
  { id: "games", name: "Other Games" },
  { id: "pro", name: "Pro" }
];

window.LT.GUIDES = [
  /* ---------------- FORTNITE ---------------- */
  {
    id: "fortnite-performance", cat: "fortnite", game: "fortnite", mins: 6, featured: true,
    title: "Best Fortnite Performance Settings",
    summary: "A clean starting setup for smoother, more consistent frame rates on PC.",
    intro: "Open Fortnite, press Esc, then open Settings (gear icon) and go to the Video tab. Change one thing at a time and test in Creative or a match so you can feel the difference.",
    steps: [
      ["Use fullscreen and your native resolution", "Set Window Mode to Fullscreen and Resolution to your monitor's native resolution (for example 1920×1080). Fullscreen usually gives the most consistent frame pacing."],
      ["Match the frame rate limit to your monitor", "Set Frame Rate Limit to your refresh rate (144 FPS on a 144Hz monitor). If your PC can't hold that number, pick the next lower option it holds steadily — steady feels better than spiky."],
      ["Turn V-Sync off", "V-Sync adds input delay. If you have a G-SYNC or FreeSync monitor, turn that on instead in your graphics driver."],
      ["Choose a rendering mode", "On lower-end PCs and laptops, try Rendering Mode: Performance — it lowers visual quality but is much lighter. On stronger PCs, DirectX 12 usually works well. Fortnite asks you to restart after changing this."],
      ["Lower the heavy settings first", "Shadows, Effects and Post Processing cost the most performance. Set them to Low or Off before lowering anything else."],
      ["Enable low-latency mode", "If you have an NVIDIA card, set NVIDIA Reflex Low Latency to On (or On + Boost). This reduces input delay."],
      ["Show FPS while you test", "Turn on Show FPS so you can see what changes actually help on your PC."]
    ],
    tip: "After big Fortnite updates, the first match can stutter while shaders build. Play a few minutes before judging your settings."
  },
  {
    id: "fortnite-graphics", cat: "fortnite", game: "fortnite", mins: 7,
    title: "Fortnite Graphics Settings Explained",
    summary: "What each graphics option does and how much it costs.",
    intro: "Knowing what each setting does lets you choose where to spend your PC's power.",
    steps: [
      ["3D Resolution", "Renders the game world below your screen resolution and scales it up. Lowering it boosts FPS a lot but makes the image softer. Keep it at 100% if you can; drop to 85–90% before lowering anything you'd miss more."],
      ["View Distance", "Controls how far away objects and players appear in detail. Medium or Far is a good balance — keeping enemies visible matters more than shadows."],
      ["Shadows", "One of the most demanding settings. Off gives the biggest boost and also makes some areas easier to see into."],
      ["Anti-Aliasing & Super Resolution", "Smooths jagged edges. Upscalers like TSR, DLSS or FSR can give you more FPS while keeping the image sharper than lowering 3D Resolution."],
      ["Textures", "Mostly uses graphics card memory (VRAM), not raw speed. If your card has 6 GB or more, Medium or High usually costs little. If you see stutter, lower it."],
      ["Effects and Post Processing", "Explosions, smoke and image filters. Low keeps fights clearer and smoother."],
      ["Rendering Mode", "DirectX 11, DirectX 12 and Performance. Performance is the lightest. Try DirectX 12 on modern cards and compare."]
    ],
    tip: "Change one setting at a time and play the same area for a minute — that's the only honest way to know what helps on your PC."
  },
  {
    id: "fortnite-controller", cat: "fortnite", game: "fortnite", mins: 6,
    title: "Fortnite Controller Settings",
    summary: "Sensitivity, deadzones, layouts and build/edit multipliers.",
    intro: "Open Settings and look at the Controller Options and Controller Sensitivity tabs.",
    steps: [
      ["Pick a layout", "Builder Pro is the most popular layout for building. Combat Pro suits Zero Build. Quick Builder is easier for beginners. You can also remap buttons in Custom."],
      ["Set look and targeting sensitivity", "Start in the middle of the range and adjust in small steps. If you overshoot targets, lower it. If turning feels slow, raise it."],
      ["Use build and edit multipliers", "Build Mode and Edit Mode sensitivity multipliers let you turn faster while building or editing without changing your aim."],
      ["Set deadzones as low as possible", "Lower deadzones feel more responsive. Lower them until the camera moves on its own when you aren't touching the stick, then raise them a little."],
      ["Try advanced options", "Turning on advanced sensitivity options unlocks horizontal/vertical speeds, ramp time and look input curve (Linear or Exponential). Exponential is smoother for small aim adjustments."],
      ["Test in Creative", "Practice your settings in a Creative map for a few sessions before changing them again."]
    ],
    tip: "Use the Lio Tweaks Controller Lab to generate a starting profile and save it to your account."
  },
  {
    id: "fortnite-kbm", cat: "fortnite", game: "fortnite", mins: 5,
    title: "Fortnite Keyboard & Mouse Settings",
    summary: "Mouse sensitivity, build/edit multipliers and keybind tips.",
    intro: "Open Settings and go to the Mouse & Keyboard tabs.",
    steps: [
      ["Set your mouse DPI first", "Pick a DPI in your mouse software (400–1600 is common) and leave it there. Change sensitivity in the game, not DPI."],
      ["Set X and Y sensitivity", "Keep X and Y the same to start. Lower sensitivity helps precise aim; higher helps fast turns."],
      ["Targeting and scope sensitivity", "These control how sensitive aiming down sights and scopes feel. Leave them at default until your main sensitivity feels right."],
      ["Build and edit multipliers", "Raise the Mouse Build Mode and Mouse Edit Mode multipliers a little if building or editing feels slow."],
      ["Move important binds near WASD", "Put building pieces and edit on keys your fingers can reach without lifting off movement — for example Q, E, F, C, Z, X, or mouse side buttons."]
    ],
    tip: "The Lio Tweaks Keyboard & Mouse Lab can suggest binds for your keyboard layout."
  },
  {
    id: "fortnite-config", cat: "fortnite", game: "fortnite", mins: 5,
    title: "General Fortnite Game Configuration",
    summary: "Gameplay, HUD and audio settings most players should check.",
    intro: "These settings live in the Game, Game UI and Audio tabs.",
    steps: [
      ["Turn on Visualize Sound Effects", "In Audio, this shows on-screen markers for footsteps, chests and gunfire. It helps a lot, especially without a good headset."],
      ["Adjust HUD scale", "In Game UI, lower the HUD scale if the interface covers too much of your screen."],
      ["Building helpers", "Turbo Building, Edit Hold Time and Reset Building Choice change how building feels. Try them in Creative before a real match."],
      ["Auto-open doors and auto-pickup", "Turn these on to save button presses."],
      ["Check your audio output", "Enable 3D Headphones if you use headphones — it can make direction easier to hear."]
    ],
    tip: "Write down settings that work for you, or save them as a Lio Tweaks profile."
  },

  /* ---------------- PC ---------------- */
  {
    id: "pc-windows-gaming", cat: "pc", mins: 6, featured: true,
    title: "Windows Gaming Features",
    summary: "Built-in Windows 11 settings that help games run smoothly.",
    intro: "These are built into Windows — no downloads or registry tweaks needed.",
    steps: [
      ["Turn on Game Mode", "Settings › Gaming › Game Mode › On. It helps Windows prioritize your game."],
      ["Check Hardware-accelerated GPU scheduling", "Settings › System › Display › Graphics › Advanced graphics settings. On modern graphics cards it's usually best left On. Restart after changing it."],
      ["Use your dedicated graphics on laptops", "Settings › System › Display › Graphics, add your game and set it to High performance so it uses the dedicated GPU."],
      ["Set power mode", "Settings › System › Power › Power mode › Best performance. On laptops, keep the charger plugged in while gaming."],
      ["Confirm your refresh rate", "Settings › System › Display › Advanced display › Choose a refresh rate. Many 144Hz monitors are set to 60Hz by default."],
      ["Keep Windows updated", "Windows 10 stopped receiving free security updates in October 2025. If your PC supports it, Windows 11 is the safer choice for gaming online."]
    ],
    tip: "Avoid 'optimizer' programs that change hidden registry settings. They rarely help and can cause problems."
  },
  {
    id: "pc-maintenance", cat: "pc", mins: 5,
    title: "PC Maintenance for Gamers",
    summary: "Drivers, startup apps, temperatures and dust.",
    intro: "A well-maintained PC runs cooler and more consistently.",
    steps: [
      ["Update your graphics driver", "Use your card maker's official app: NVIDIA App, AMD Software: Adrenalin Edition, or Intel's graphics software. Driver updates often fix game issues."],
      ["Trim startup apps", "Press Ctrl + Shift + Esc, open Startup apps, and disable programs you don't need at startup."],
      ["Watch temperatures", "If games get slower after a few minutes, your PC may be overheating. Check temperatures with your GPU app's overlay."],
      ["Clean dust", "Shut down, unplug, and use compressed air on fans and filters every few months."],
      ["Restart regularly", "A restart clears leftover background processes and finishes pending updates."]
    ],
    tip: "Only download drivers from the official manufacturer — never from random driver sites."
  },
  {
    id: "pc-storage", cat: "pc", mins: 4,
    title: "Storage Management",
    summary: "Faster loading and fewer stutters with smart storage habits.",
    intro: "Where your games live affects loading times and texture streaming.",
    steps: [
      ["Install games on an SSD", "Games load much faster from an SSD than a hard drive. Many newer games need one."],
      ["Keep free space", "Try to keep at least 15–20% of each drive free. Full drives slow down updates and shader caching."],
      ["Turn on Storage Sense", "Settings › System › Storage › Storage Sense cleans temporary files automatically."],
      ["Don't defragment SSDs", "Windows handles SSD maintenance automatically. Manual defragmenting is only for hard drives."],
      ["Uninstall games you don't play", "Your launcher can reinstall them later."]
    ]
  },
  {
    id: "pc-graphics-basics", cat: "pc", mins: 5,
    title: "PC Graphics Settings Basics",
    summary: "Cables, refresh rate and adaptive sync done right.",
    intro: "A few setup mistakes can hide a lot of performance.",
    steps: [
      ["Plug your monitor into the graphics card", "On desktops, use the ports on the graphics card, not the motherboard. Otherwise you may be using the slower built-in graphics."],
      ["Use the right cable", "DisplayPort or HDMI 2.0+ is needed for high refresh rates at higher resolutions."],
      ["Set the refresh rate in Windows", "Settings › System › Display › Advanced display."],
      ["Enable G-SYNC or FreeSync", "If your monitor supports adaptive sync, turn it on in the monitor menu and your GPU software. It removes tearing without V-Sync's delay."],
      ["Use upscaling", "DLSS, FSR or XeSS can raise FPS with a smaller quality loss than lowering resolution."]
    ]
  },
  {
    id: "pc-hardware", cat: "pc", mins: 6,
    title: "Understanding PC Hardware",
    summary: "What the CPU, GPU, RAM and storage each do for gaming.",
    intro: "Knowing which part does what helps you find what's holding your PC back.",
    steps: [
      ["Graphics card (GPU)", "Draws everything you see. It matters most for resolution and graphics quality."],
      ["Processor (CPU)", "Runs game logic, physics and players. It matters most for very high frame rates and busy games."],
      ["Memory (RAM)", "16 GB is a solid target for most games today. Two matching sticks (dual-channel) usually perform better than one."],
      ["Storage", "An SSD speeds up loading and helps open-world and battle royale games stream data."],
      ["Cooling and power", "Hot parts slow themselves down. A good power supply keeps everything stable."],
      ["Spot the bottleneck", "If your GPU usage is near 100%, the GPU limits you. If it's much lower while FPS is low, the CPU is often the limit."]
    ]
  },

  /* ---------------- CONSOLE ---------------- */
  {
    id: "ps5-display", cat: "console", mins: 5, featured: true,
    title: "PS5 Display Settings",
    summary: "Video output, 120Hz, VRR and HDR on PlayStation 5.",
    intro: "On PS5, open Settings › Screen and Video › Video Output.",
    steps: [
      ["Resolution: Automatic", "Lets the PS5 pick the best resolution your TV supports."],
      ["120Hz Output: Automatic", "Allows 120Hz in games that support it, if your display does too."],
      ["VRR: Automatic", "Variable refresh rate smooths frame rate dips on supported TVs and monitors."],
      ["Adjust HDR", "If your TV supports HDR, run Adjust HDR in the same menu so bright and dark scenes look right."],
      ["Set a game preset", "Settings › Saved Data and Game/App Settings › Game Presets lets you prefer Performance Mode (higher frame rate) or Resolution Mode in supported games."],
      ["Turn on your TV's Game Mode", "This lowers input delay on most TVs."]
    ]
  },
  {
    id: "console-120hz", cat: "console", mins: 4,
    title: "120Hz Setup Explained",
    summary: "What you need for 120 FPS on PS5 and Xbox Series X|S.",
    intro: "120Hz makes games feel smoother and more responsive — but every link in the chain has to support it.",
    steps: [
      ["Check your display", "Your TV or monitor must support 120Hz on the HDMI input you're using. Many TVs only support it on certain ports."],
      ["Use the included HDMI cable", "4K at 120Hz needs HDMI 2.1 bandwidth. The cable that came with your console supports it."],
      ["Enable 120Hz on the console", "PS5: Settings › Screen and Video › Video Output › 120Hz Output. Xbox: Settings › General › TV & display options › Refresh rate."],
      ["Enable it in the game", "Many games, including Fortnite, have their own 120 FPS or performance option in their video settings."],
      ["Expect trade-offs", "120 FPS modes often lower resolution or effects. That's normal."]
    ]
  },
  {
    id: "console-controller", cat: "console", mins: 4,
    title: "Console Controller Configuration",
    summary: "Remapping, stick drift checks and firmware updates.",
    intro: "A well-configured controller is the cheapest upgrade you can make.",
    steps: [
      ["Remap buttons at the system level", "PS5: Settings › Accessibility › Controllers › Custom Button Assignments. Xbox: Settings › Accessibility › Controller › Button mapping."],
      ["Check for stick drift", "If the camera moves when you're not touching the stick, raise your in-game deadzone slightly or clean/repair the controller."],
      ["Update controller firmware", "Both consoles prompt for controller updates — install them."],
      ["Try paddles", "Controllers with back paddles let you jump or build without taking your thumb off the right stick."]
    ]
  },
  {
    id: "console-performance", cat: "console", mins: 4,
    title: "Console Performance Tips",
    summary: "Small changes for smoother, more responsive console gaming.",
    intro: "Consoles don't have many settings, but these still matter.",
    steps: [
      ["Pick performance mode in games", "When a game offers Performance vs Quality, Performance usually gives a higher frame rate."],
      ["Use a wired connection", "Ethernet gives a steadier connection than Wi-Fi."],
      ["Keep storage free", "Leave space for updates so they install smoothly."],
      ["Keep vents clear", "Give your console room to breathe and dust it regularly."],
      ["Use TV Game Mode", "Reduces input delay on most TVs."]
    ]
  },

  /* ---------------- GENERAL ---------------- */
  {
    id: "input-settings", cat: "general", mins: 4,
    title: "Input Settings Basics",
    summary: "Sensitivity, deadzones and response curves in any game.",
    intro: "These ideas apply to almost every shooter.",
    steps: [
      ["Sensitivity", "Lower sensitivity = more precise, slower turns. Higher = faster turns, harder fine aim. Pick one and practice with it."],
      ["Deadzones", "The amount of stick movement ignored before input registers. Lower is more responsive; raise it only to stop drift."],
      ["Response curves", "Linear responds evenly. Exponential is slower near the center, which helps small aim adjustments."],
      ["Consistency beats perfection", "Changing settings every day stops your muscle memory from building."]
    ]
  },
  {
    id: "monitor-settings", cat: "general", mins: 4,
    title: "Monitor Settings",
    summary: "Refresh rate, response time, adaptive sync and HDR.",
    intro: "Most monitors need a few changes out of the box.",
    steps: [
      ["Verify your refresh rate", "Check it in Windows display settings — many high-refresh monitors start at 60Hz."],
      ["Overdrive / response time", "The middle setting is usually best. The highest setting can cause ghosting trails."],
      ["Adaptive sync", "Turn on FreeSync or G-SYNC compatible mode in the monitor menu."],
      ["Game picture mode", "Use the monitor's Game or Standard mode rather than heavy 'Dynamic' modes."]
    ]
  },
  {
    id: "accessories", cat: "general", mins: 4,
    title: "Gaming Accessories Guide",
    summary: "What actually matters when choosing gear.",
    intro: "Comfort and consistency matter more than flashy specs.",
    steps: [
      ["Mouse", "Shape and weight that fit your hand matter more than extreme DPI."],
      ["Keyboard", "Smaller layouts (TKL, 75%, 65%) leave more room for mouse movement."],
      ["Headset", "Clear directional audio helps you hear footsteps. Comfort matters for long sessions."],
      ["Controller", "Back paddles and good stick tension help competitive play."],
      ["Mousepad", "A large pad gives room for lower sensitivities."]
    ]
  },
  {
    id: "setup-recommendations", cat: "general", mins: 4,
    title: "Gaming Setup Recommendations",
    summary: "Desk, seating, lighting and network basics.",
    intro: "A good setup keeps you comfortable and focused.",
    steps: [
      ["Screen height", "The top of the screen should be around eye level."],
      ["Arm position", "Keep elbows near 90° and your wrist relaxed."],
      ["Lighting", "Soft light behind the screen reduces eye strain."],
      ["Network", "Use Ethernet when possible. If you must use Wi-Fi, keep the router close and unobstructed."],
      ["Take breaks", "Short breaks every hour help focus and prevent strain."]
    ]
  },

  /* ---------------- OTHER GAMES ---------------- */
  {
    id: "cod-settings", cat: "games", game: "cod", mins: 5,
    title: "Call of Duty: Clarity & Performance",
    summary: "Field of view, blur and upscaling settings for recent Call of Duty games.",
    intro: "Menu names change between Call of Duty releases, but these options appear in most recent titles under Graphics.",
    steps: [
      ["Raise field of view", "A wider FOV shows more of the battlefield. Increase it until targets feel too small, then step back a little."],
      ["Turn off motion blur", "Disable world and weapon motion blur for a clearer image while moving."],
      ["Turn off depth of field", "Keeps the background sharp when aiming."],
      ["Use upscaling for FPS", "On PC, DLSS, FSR or XeSS can raise frame rate with a smaller visual cost."],
      ["Lock your frame rate", "Set a custom frame rate limit at or near your refresh rate for consistent frame pacing."]
    ]
  },
  {
    id: "minecraft-performance", cat: "games", game: "minecraft", mins: 5,
    title: "Minecraft Performance (Java & Bedrock)",
    summary: "Render distance, simulation distance and performance mods.",
    intro: "Minecraft performance depends heavily on how far you load the world.",
    steps: [
      ["Lower render distance", "Options › Video Settings › Render Distance. This is the biggest performance setting."],
      ["Lower simulation distance", "Controls how far the world keeps 'ticking'. Lowering it helps busy worlds."],
      ["Use Fast graphics", "Fast instead of Fancy reduces load, especially on laptops."],
      ["Java: try a performance mod", "Sodium (for the Fabric loader) is a widely used mod that can greatly improve frame rate. Only download mods from trusted sites such as Modrinth or CurseForge."],
      ["Bedrock: turn off fancy extras", "Disable Beautiful Skies and Fancy Leaves if you need more FPS."]
    ]
  },
  {
    id: "roblox-performance", cat: "games", game: "roblox", mins: 3,
    title: "Smoother Roblox Gameplay",
    summary: "Graphics quality and simple fixes for lag.",
    intro: "Open the Roblox menu (Esc) and go to Settings.",
    steps: [
      ["Set Graphics Mode to Manual", "Then lower the Graphics Quality bar until gameplay is smooth."],
      ["Set a frame rate limit", "If your version shows a Maximum Frame Rate option, set it to match your refresh rate."],
      ["Close other apps", "Browsers with many tabs use a lot of memory."],
      ["Check your connection", "Roblox 'lag' is often network-related. A wired connection helps."]
    ]
  },
  {
    id: "valorant-settings", cat: "games", game: "valorant", mins: 5,
    title: "Valorant Competitive Settings",
    summary: "Video settings for high, stable frame rates.",
    intro: "Valorant relies heavily on the CPU, so high frame rates are achievable on many PCs. Open Settings › Video.",
    steps: [
      ["Display mode: Fullscreen", "Gives the most consistent frame pacing."],
      ["Lower quality settings", "Material, Texture and Detail Quality on Low or Medium are common for competitive play."],
      ["Enable NVIDIA Reflex", "Set it to On or On + Boost on NVIDIA cards."],
      ["Multithreaded rendering", "Keep it on for most modern CPUs."],
      ["Limit FPS sensibly", "Use the frame limit options to keep frame rate steady rather than jumping around."]
    ]
  },
  {
    id: "apex-settings", cat: "games", game: "apex", mins: 5,
    title: "Apex Legends Video Settings",
    summary: "Clarity and performance settings for Apex on PC.",
    intro: "Open Settings › Video.",
    steps: [
      ["Display mode: Full Screen", "Use your native resolution."],
      ["Adaptive resolution FPS target", "Set it to 0 to turn it off if you prefer a consistently sharp image."],
      ["V-Sync off", "Use G-SYNC or FreeSync instead if available."],
      ["Texture streaming budget", "Set it to match your graphics card memory — too high causes stutter."],
      ["Frame cap", "Apex supports the launch option +fps_max followed by a number (for example +fps_max 144) in the EA app or Steam."]
    ]
  }
];

/* Pro titles shown on the Pro page. Content is loaded from Supabase only for Pro members. */
window.LT.PRO_CATALOG = [
  { id: "pro-pc-playbook", title: "Advanced PC Performance Playbook", summary: "Memory profiles, bottleneck testing, frame-time tuning and more." },
  { id: "pro-fn-competitive", title: "Fortnite Competitive Configuration", summary: "A complete tournament-style setup with reasoning for every setting." },
  { id: "pro-fn-lowend", title: "Fortnite on Low-End PCs & Laptops", summary: "Get the most out of older hardware and laptops." },
  { id: "pro-ct-tuning", title: "Advanced Controller Tuning", summary: "Deadzone testing, response curves and paddle layouts." },
  { id: "pro-kbm-sens", title: "Find Your Perfect Mouse Sensitivity", summary: "A step-by-step sensitivity-matching method." },
  { id: "pro-network", title: "Exclusive Tutorial: Reduce Online Lag", summary: "Find and fix network problems that cost you fights." }
];
