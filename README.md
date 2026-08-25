# PIXEL QUEST 🎮

Pixel Quest is a 2D web platformer built with HTML5, TypeScript, and Phaser 3. It was created for the Multimedia Technology course (CMM20103) at Management & Science University (MSU) for the July 2026 session.

The game runs directly in any modern desktop or mobile browser without extra plugins or downloads. Players control Ara as she runs, jumps, collects coins, stomps on slimes, avoids pits, and opens the Love Chest to finish the level.

---

## Screenshots

| Title Screen | Gameplay & Combat |
| :---: | :---: |
| ![Title Screen](src/assets/images/readme/title-screen.png) | ![Gameplay](src/assets/images/readme/gameplay.png) |
| Animated title scene with Ara, patrolling slimes, and hearts | Real-time physics, HUD score, coins, and enemy chase logic |

| Game Over Scene | Victory Celebration |
| :---: | :---: |
| ![Game Over](src/assets/images/readme/game-over.png) | ![Victory](src/assets/images/readme/victory.png) |
| Retro game-over screen with Ara and mocking slimes | Victory screen with open Love Chest and heart particle bursts |

---

## Core Features

- **Five Multimedia Elements**
  - **Graphics:** Pixel art character sprites, slimes, coins, chest, tilemap terrain, and three parallax background layers.
  - **Animation:** Sprite sheets for walking, jumping, and falling, plus spinning coins, hopping slimes, and heart particles.
  - **Audio:** Loopable background music playlist and six distinct sound effects for jump, coin, stomp, hurt, game over, and victory.
  - **Text:** Custom arcade pixel font for the HUD, score counter, prompts, and screen headers.
  - **Interactivity:** Arcade physics, enemy chase behavior, dual input (keyboard and touch), and state management.

- **Slime Split System**
  - Stomping a big slime yields 50 points and splits it into three mini slimes. Mini slimes are smaller, faster, and chase the player directly.

- **Stomp to Open Goal**
  - The level ends when the player lands on top of the Love Chest. Opening it uses the same jump and stomp mechanic as defeating enemies.

- **Responsive Touch & Keyboard Controls**
  - Works with keyboard controls on desktop and touch zone overlays on mobile screens.

---

## Controls

| Action | Keyboard (Desktop) | Touch (Mobile) |
| :--- | :--- | :--- |
| Move Left / Right | Left / Right Arrows or A / D | Touch left or right side of screen |
| Jump | Space / Up Arrow or W | Touch upper section of screen |
| Start / Retry | Space / Enter | Tap anywhere on screen |

---

## Technical Stack

- **Game Engine:** Phaser 3.16 (Arcade Physics, Scene Manager, Particle Emitters)
- **Language:** TypeScript (strict mode across 29 source files)
- **Bundler:** Webpack 5 (production minification and bundle splitting)
- **Level Design:** Tiled Map Editor (16x16 tilemap layers exported to JSON)
- **Hosting & Deployment:** Apache2 + Cloudflare Tunnel (HTTPS delivery)
- **Automated QA:** Playwright headless browser test scripts

---

## Repository Layout

```text
CMM20103202607001/
├── docs/                      # PRD specifications and planning notes
├── src/
│   ├── assets/                # Audio, fonts, icons, sprites, and tilemaps
│   ├── components/            # UI, Map, HUD, SFX, and Chest modules
│   ├── entities/              # Player, Enemy, and Coin physics entities
│   ├── scenes/                # TitleScene, MainScene, GameOverScene, WinScene
│   ├── utils/                 # Touch checks and input helpers
│   ├── favicon.ico            # Heart icon favicon
│   ├── game.ts                # Phaser game entry point and config
│   └── index.ejs              # Main HTML template
├── webpack/                   # Webpack build configurations
├── package.json               # Dependencies and scripts
└── README.md                  # Project documentation
```

---

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/HakimIqbal/CMM20103202607001.git
cd CMM20103202607001
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run in Development Mode
```bash
npm start
```
Open `http://localhost:8080` in your browser.

### 4. Build for Production
```bash
npm run build
```
The production bundle will be generated in the `dist/` directory.

---

## Academic Information

Subject Code : CMM20103  
Subject Name : MULTIMEDIA TECHNOLOGY  
Class Id : CMM20103202607001  
Group Id :  
01202607000326  
01202607000327  
Programe: Bachelor Computer Science  
Lecturer:  
Mr. Izzul Iman Bin Suhairi  
Mr. Muhammad Rohaizad Bin Zainun  
