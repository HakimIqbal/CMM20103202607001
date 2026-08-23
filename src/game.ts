import 'phaser';

import { TitleScene, GameScene, LevelCompleteScene, GameOverScene, WinScene } from './scenes';

const config: GameConfig = {
	type: Phaser.AUTO,
	width: window.innerWidth,
	height: window.innerHeight,
	input: { keyboard: true },
	parent: 'game',
	physics: {
		arcade: {
			debug: false,
			gravity: { y: 1850 }
		},
		default: 'arcade'
	},
	scale: {
		mode: Phaser.Scale.RESIZE,
		autoRound: true
	},
	scene: [TitleScene, GameScene, LevelCompleteScene, GameOverScene, WinScene],
	render: {
		antialias: false,
		pixelArt: true,
		roundPixels: true,
		powerPreference: 'high-performance'
	}
};

const game = new Phaser.Game(config);
