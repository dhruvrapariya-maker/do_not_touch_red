# 🔴 DON'T TOUCH THE RED

A fast-paced, highly addictive neon arcade survival mini-game built with pure HTML5 Canvas, modern CSS, and vanilla JavaScript.

---

## 🎮 Game Concept & Objective
Control a glowing neon ball. The objective is simple: **Survive as long as possible while avoiding every red obstacle.**
The game accelerates and introduces increasingly lethal hazard patterns every 10 seconds.

One collision ends the game.

---

## ✨ Features

### 🕹️ Core Gameplay
- **Multi-Input Controls**:
  - **Mouse / Pointer**: Direct tracking with smooth lerp physics.
  - **Mobile Touch**:
    - *Smart Touch Offset* (default): Ball renders ~45px above your thumb so your finger never blocks your view!
    - *Direct Follow* & *Relative Drag* selectable in Settings.
  - **Keyboard**: Smooth `W A S D` or Arrow Keys movement with velocity acceleration and boundary clamping.
- **Dynamic Red Hazards**:
  - **Falling & Sweeping Bars**: Neon laser walls with safe passage gaps.
  - **Bouncing Pulse Mines**: Energy orbs that rebound off borders.
  - **Homing Drone Chasers**: Menacing glowing drones that slowly track the player.
  - **Rotating Laser Blades**: Spinning crosses that slice through the field.
  - **Laser Sweepers**: Telegraph dashed warning beams that fire deadly wide lasers!
- **Golden Coins & Magnetic Pull**:
  - Collect rotating 3D gold coins to earn bonus points and fill your wallet.
  - Nearby coins are magnetically pulled toward the player ball.
- **⚡ Adrenaline / Golden Fever Mode**:
  - Collecting coins and pulling off risky near-misses charges the **Fever Gauge**.
  - At 100%, trigger **Golden Fever** for 5.5 seconds:
    - 3x Score Multiplier!
    - Obstacles turn golden and slow down.
    - Crashing into obstacles vaporizes them into `+150 SMASH` bonus points instead of killing you!
- **🔥 Near-Miss Reward System**:
  - Brushing dangerously close to a red obstacle rewards `+50 NEAR MISS!` points, a spark burst, slow-mo micro-freeze, and a huge boost to your Fever gauge.

---

### 🚀 Viral & Retention Mechanics
- **Daily Challenge Mode**:
  - Seeded daily based on the calendar date.
  - Features high-stakes modifiers (+30% starting speed, 2x coins) and a separate Daily Record.
- **Top 5 Leaderboard**:
  - Tracks top 5 personal best runs with medals (🥇, 🥈, 🥉), score, survival time, coins, and date.
- **Viral Score Sharing**:
  - Uses native **Web Share API** on mobile devices to share scores directly to WhatsApp, Twitter/X, Instagram, or Messages.
  - Automatic clipboard fallback with brag text and link.
- **🖼️ Brag Card Generator**:
  - One-click generated 800x450 official arcade certificate rendered to Canvas.
  - Allows instant PNG download to post on social media.
- **20+ Funny Death Roasts**:
  - Sarcastic and funny quotes on game over to fuel replay motivation.
- **10 Unlockable Achievement Badges**:
  - Real-time in-game slide toast notifications when a milestone is achieved.
- **6 Collectible Neon Ball Skins**:
  - Neon Cyan, Solar Flare, Toxic Ghost, Cyber Magenta, Amethyst Void, and Rainbow Prism (cycles dynamic RGB hue).
- **Instant Restart**:
  - Press `Space`, `Enter`, `R`, or tap to restart immediately in < 0.1s.

---

### 🎨 Visuals & Sound
- **100% Procedural Web Audio Engine**:
  - Retro synth sound effects (coin chime, near-miss whistle, sub-bass explosion, level-up fanfare, fever siren).
  - Zero external `.mp3` / `.wav` assets required—no 404s or CORS blocks!
- **Particle System**:
  - Dynamic player trail, shockwave rings, coin sparkles, floating score text, cyber dust background motes.
- **High-DPI Retina Ready**:
  - Crisp rendering on 4K desktop displays and mobile Retina screens.

---

## 🚀 How to Run Locally

You can run the game by opening `index.html` in any modern web browser:

1. **Directly in browser**:
   Double click `index.html` or drag it into Chrome, Edge, Safari, or Firefox.

2. **Using Python local server** (optional):
   ```bash
   python -m http.server 8080
   ```
   Then open `http://localhost:8080` in your browser.

---

## 📁 Project Structure

```
├── index.html            # Main game container, UI overlays, and modals
├── assets/
│   └── favicon.svg       # Glowing SVG game icon
├── css/
│   └── style.css         # Cyberpunk / Neon Arcade styling and responsive layout
├── js/
│   ├── storage.js        # LocalStorage manager (High score, coins, skins, achievements, leaderboard)
│   ├── audio.js          # Web Audio API synthesizer for all retro sound FX
│   ├── particles.js      # Particle systems, shockwaves, floating text, and cyberdust
│   ├── obstacles.js      # Hazard patterns, spawner logic, and collision/near-miss detection
│   ├── ui.js             # UI screens, roasts, brag card canvas generator, and modals
│   └── game.js           # Core 60fps loop, player movement, input smoothing, state machine
└── README.md             # Game documentation
```
