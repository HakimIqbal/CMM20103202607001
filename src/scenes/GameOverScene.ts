import { LevelScene } from '@src/scenes';
import { isTouchDevice } from '@src/utils';

/**
 * Game over screen: final score, retry current level or back to title.
 */
export class GameOverScene extends LevelScene {
	private score: number = 0;
	private level: number = 1;

	constructor() {
		super({ key: 'GameOverScene' });
	}

	public init(data: { level?: number; score?: number }) {
		this.level = (data.level != null ? data.level : 1);
		this.score = (data.score != null ? data.score : 0);
	}

	public create() {
		super.create();
		this.cameras.main.setBackgroundColor('#1a2b5e');
		const cx = this.width / 2;

		this.add
			.text(cx, this.height * 0.28, 'GAME OVER', {
				fontFamily: 'Arcade',
				fontSize: '64px',
				color: '#ff6b6b',
				stroke: '#3d0e1a',
				strokeThickness: 8
			})
			.setOrigin(0.5);

		this.add
			.text(cx, this.height * 0.44, `SCORE ${String(this.score).padStart(6, '0')}`, {
				fontFamily: 'Arcade',
				fontSize: '30px',
				color: '#ffffff'
			})
			.setOrigin(0.5);

		const retry = this.add
			.text(cx, this.height * 0.62, isTouchDevice ? 'TAP TO RETRY LEVEL' : 'PRESS SPACE TO RETRY LEVEL', {
				fontFamily: 'Arcade',
				fontSize: '22px',
				color: '#dbe6ff'
			})
			.setOrigin(0.5);

		this.tweens.add({
			targets: retry,
			alpha: 0.2,
			duration: 400,
			yoyo: true,
			repeat: -1
		});

		this.input.keyboard.once('keydown-SPACE', () => {
			this.scene.start('GameScene', { level: this.level, score: 0, lives: 3 });
		});
		this.input.once('pointerdown', () => {
			this.scene.start('GameScene', { level: this.level, score: 0, lives: 3 });
		});

		// ESC / long way back to title
		this.input.keyboard.once('keydown-ESC', () => {
			this.scene.start('TitleScene');
		});
	}
}
