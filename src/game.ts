import 'phaser';

import { MainScene } from './scenes/MainScene';
import { TitleScene } from './scenes/TitleScene';
import { GameOverScene } from './scenes/GameOverScene';
import { WinScene } from './scenes/WinScene';

const config: GameConfig = {
	type: Phaser.AUTO,
	parent: 'game',
	input: { keyboard: true },
	physics: {
		arcade: {
			debug: false,
			gravity: { y: 1850 }
		},
		default: 'arcade'
	},
	scale: {
		width: 1536,
		height: 864,
		autoCenter: Phaser.Scale.CENTER_BOTH,
		autoRound: true,
		mode: Phaser.Scale.FIT
	},
	scene: [],
	render: {
		antialias: false,
		pixelArt: true,
		roundPixels: true,
		powerPreference: 'high-performance'
	}
};

const game = new Phaser.Game(config);

// Register scenes manually (config.scene is empty so nothing auto-starts)
game.scene.add('TitleScene', TitleScene, false);
game.scene.add('MainScene', MainScene, false);
game.scene.add('GameOverScene', GameOverScene, false);
game.scene.add('WinScene', WinScene, false);

/**
 * Font loading race fix: custom 'Arcade' font via @font-face may not be
 * ready when TitleScene.create() renders its text objects. Phaser 3.16
 * bakes fallback-font metrics into the text texture and never re-renders,
 * producing broken/offset title text in browsers where the font loads
 * slower than scene boot (Chromium resource scheduling differs from WebKit).
 *
 * Fix: Phaser waits for the font before booting any scene.
 */
const _FF: any = (window as any).FontFace;
const ARCADE_FONT = new _FF(
	'Arcade',
	'url(assets/fonts/arcade.ttf)'
);
ARCADE_FONT.load()
	.then(() => {
		(document as any).fonts.add(ARCADE_FONT);
		game.scene.start('TitleScene');
	})
	.catch(() => {
		// Font failed to load (offline, blocked) — start anyway with fallback
		game.scene.start('TitleScene');
	});

/**
 * Mobile viewport fix: set parent element height via JS to avoid
 * CSS viewport unit (100vh/100dvh) differences across browsers.
 * Brave, Mi Browser, Chrome, Safari all report different innerHeight
 * with CSS units. Direct pixel sizing via JS is the only reliable way.
 */
const _w: any = window;
function refreshGameSize() {
	const parent = document.getElementById('game');
	if (!parent) return;
	let vh: number;
	if (_w.visualViewport) {
		vh = _w.visualViewport.height;
	} else {
		vh = window.innerHeight;
	}
	parent.style.width = window.innerWidth + 'px';
	parent.style.height = vh + 'px';
	// Only refresh scale after game is fully booted
	try {
		if (game.scale) {
			game.scale.refresh();
		}
	} catch (e) {
		// ScaleManager not ready yet — skip
	}
}

// Listen to all possible resize events (only after game boots)
window.addEventListener('resize', refreshGameSize);
window.addEventListener('orientationchange', () => setTimeout(refreshGameSize, 200));
if (_w.visualViewport) {
	_w.visualViewport.addEventListener('resize', refreshGameSize);
	_w.visualViewport.addEventListener('scroll', refreshGameSize);
}
window.addEventListener('load', refreshGameSize);
