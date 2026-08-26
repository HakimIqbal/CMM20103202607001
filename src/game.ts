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
		mode: Phaser.Scale.ENVELOP,
		autoCenter: Phaser.Scale.CENTER_BOTH,
		width: 1280,
		height: 720,
		autoRound: true
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

// Build marker: lets the operator verify which bundle a client actually
// loaded (check browser console).
console.log('[PixelQuest] build 2408-35 · aggro fix + retry state reset');

// Debug handle for automated testing / headless verification.
if (typeof window !== 'undefined') {
	(window as unknown as { __game: Phaser.Game }).__game = game;
}

// Register scenes manually (config.scene is empty so nothing auto-starts)
game.scene.add('TitleScene', TitleScene, false);
game.scene.add('MainScene', MainScene, false);
game.scene.add('GameOverScene', GameOverScene, false);
game.scene.add('WinScene', WinScene, false);

/**
 * Font loading race fix: wait until the 'Arcade' font is actually loaded
 * before starting TitleScene, so Phaser bakes correct pixel-font metrics
 * into text textures on the very first render.
 *
 * Uses document.fonts.load() which works with the CSS @font-face rule —
 * no duplicate FontFace registration (which can confuse Chromium's font
 * matching). Safety timeout: if the font never loads (offline/blocked),
 * start anyway after 3s so the game is never stuck.
 */
const startGame = () => {
	const ts: any = (game.scene as any).getScene('TitleScene');
	if (ts && ts.scene && ts.scene.isActive()) return;
	game.scene.start('TitleScene');
};

Promise.race([
	(document as any).fonts.load('16px Arcade').then(() => (document as any).fonts.ready),
	new Promise(resolve => setTimeout(resolve, 3000))
]).then(() => {
	// One more frame for the font to settle in the renderer
	requestAnimationFrame(() => startGame());
});

// Clean scale management handles responsive resize natively via Phaser Scale.FIT
window.addEventListener('orientationchange', () => {
	setTimeout(() => {
		if (game.scale) game.scale.refresh();
	}, 200);
});
