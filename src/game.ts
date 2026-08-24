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
	scene: [TitleScene, MainScene, GameOverScene, WinScene],
	render: {
		antialias: false,
		pixelArt: true,
		roundPixels: true,
		powerPreference: 'high-performance'
	}
};

const game = new Phaser.Game(config);

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
