import { LevelScene } from '@src/scenes';

/**
 * Interstitial shown between levels: "LEVEL COMPLETE" + score, then next level.
 */
export class LevelCompleteScene extends LevelScene {
	private level: number = 1;
	private score: number = 0;

	constructor() {
		super({ key: 'LevelCompleteScene' });
	}

	public init(data: { level?: number; score?: number }) {
		this.level = (data.level != null ? data.level : 1);
		this.score = (data.score != null ? data.score : 0);
	}

	public create() {
		super.create();
		this.cameras.main.setBackgroundColor('#448AFF');
		const cx = this.width / 2;

		this.add
			.text(cx, this.height * 0.3, 'LEVEL COMPLETE!', {
				fontFamily: 'Arcade',
				fontSize: '52px',
				color: '#ffe98a',
				stroke: '#2b3f8e',
				strokeThickness: 8
			})
			.setOrigin(0.5);

		this.add
			.text(cx, this.height * 0.5, `SCORE ${String(this.score).padStart(6, '0')}`, {
				fontFamily: 'Arcade',
				fontSize: '32px',
				color: '#ffffff'
			})
			.setOrigin(0.5);

		const hint = this.add
			.text(cx, this.height * 0.68, `GET READY FOR LEVEL ${this.level + 1}...`, {
				fontFamily: 'Arcade',
				fontSize: '22px',
				color: '#dbe6ff'
			})
			.setOrigin(0.5);

		this.tweens.add({
			targets: hint,
			alpha: 0.2,
			duration: 400,
			yoyo: true,
			repeat: -1
		});

		this.time.delayedCall(2600, () => {
			this.scene.start('GameScene', {
	level: this.level + 1,
				score: this.score,
				lives: 3
			});
		}, [], this);
	}
}
