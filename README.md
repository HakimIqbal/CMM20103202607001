# CMM20103202607001

## Multimedia Final Project — MSU July 2026

This project was developed as part of the **Multimedia** course at **Management & Science University (MSU)**.

It is a 2D web-based game where the player can explore the game environment, interact with different objects, move between areas, and experience the story through dialogues and background music.

The project was mainly developed using **TypeScript and Phaser 3**, with Webpack used for bundling and development.

---

## Features

* 2D game environment
* Player movement and controls
* Interactive objects
* Dialogue system
* Door and level interactions
* Background music
* Pixel-art sprites and backgrounds
* Tilemap-based levels
* Simple visual effects
* Progressive Web App support

---

## Technologies

* **TypeScript** — main programming language
* **Phaser 3** — game framework
* **Webpack** — bundling and build tools
* **Node.js** — development environment and server
* **Express.js** — local web server
* **Tiled** — used for creating the tilemap
* **PM2** — process management

---

## Project Structure

```text
CMM20103202607001/
│
├── src/
│   ├── assets/
│   │   ├── audio/
│   │   ├── backgrounds/
│   │   ├── fonts/
│   │   ├── icons/
│   │   ├── images/
│   │   ├── sprites/
│   │   └── tilemaps/
│   │
│   ├── components/
│   ├── entities/
│   ├── scenes/
│   ├── typings/
│   ├── utils/
│   └── game.ts
│
├── webpack/
├── server.js
├── package.json
├── tsconfig.json
├── tslint.json
├── Procfile
└── README.md
```

---

## Running The Project

### 1. Clone the repository

```bash
git clone https://github.com/HakimIqbal/CMM20103202607001.git
cd CMM20103202607001
```

### 2. Install the dependencies

```bash
npm install
```

### 3. Start the project

```bash
npm start
```

The game should then be available through the development server.

---

## Build

To create a production build:

```bash
npm run build
```

The Webpack configuration for the production build can be found in:

```text
webpack/webpack.prod.js
```

---

## Multimedia Elements

The project includes several multimedia elements, including:

* Character and object sprites
* Background images
* Tilemap environments
* Custom fonts
* Background music
* Game animations
* Dialogue and text effects

The assets used by the game are stored in the `src/assets` folder.

---

## Academic Information

**Course:** Multimedia
**Course Code:** CMM20103
**Project:** Final Project
**University:** Management & Science University (MSU)
**Session:** July 2026
**Project ID:** CMM20103202607001

---

## Note

This project was created for academic purposes as part of the Multimedia course at Management & Science University.
