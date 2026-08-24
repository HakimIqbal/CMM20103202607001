import { LevelScene } from './LevelScene';
import { isTouchDevice } from '@src/utils';

/**
 * Game Over screen: final score, retry from level 1.
 */
export class GameOverScene extends LevelScene {
	private score: number = 0;
	private level: number = 1;

	constructor() {
		super({ key: 'GameOverScene' });
	}

	public init(data: { score?: number; level?: number }) {
		this.score = data && data.score != null ? data.score : 0;
		this.level = data && data.level != null ? data.level : 1;
	}

	public create() {
		super.create();
		this.cameras.main.setBackgroundColor('#1a2b5e');

		const w = this.scale.width;
		const h = this.scale.height;
		const cx = w / 2;

		this.add
			.text(cx, h * 0.28, 'GAME OVER', {
				fontFamily: 'Arcade',
				fontSize: `${Math.round(w / 16)}px`,
				color: '#ff6b6b',
				stroke: '#3d0e1a',
				strokeThickness: Math.round(w / 200)
			})
			.setOrigin(0.5);

		this.add
			.text(cx, h * 0.45, `SCORE ${String(this.score).padStart(6, '0')}`, {
				fontFamily: 'Arcade',
				fontSize: `${Math.round(w / 32)}px`,
				color: '#ffffff'
			})
			.setOrigin(0.5);

		const retry = this.add
			.text(
				cx,
				h * 0.62,
				isTouchDevice ? 'TAP TO RETRY' : 'PRESS SPACE TO RETRY',
				{
					fontFamily: 'Arcade',
					fontSize: `${Math.round(w / 44)}px`,
					color: '#dbe6ff'
				}
			)
			.setOrigin(0.5);

		this.tweens.add({
			targets: retry,
			alpha: 0.2,
			duration: 400,
			yoyo: true,
			repeat: -1
		});

		const restart = () => {
			this.scene.start('MainScene', { level: this.level, score: 0 });
		};
		this.input.keyboard.once('keydown-SPACE', restart);
		this.input.once('pointerdown', restart);
	}
}
