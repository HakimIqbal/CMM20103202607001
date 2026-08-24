import { LevelScene } from './LevelScene';
import { isTouchDevice } from '@src/utils';

/**
 * Victory screen: total score + heart fireworks, play again.
 */
export class WinScene extends LevelScene {
	private score: number = 0;

	constructor() {
		super({ key: 'WinScene' });
	}

	public init(data: { score?: number }) {
		this.score = data && data.score != null ? data.score : 0;
	}

	public create() {
		super.create();
		this.cameras.main.setBackgroundColor('#448AFF');

		const w = this.scale.width;
		const h = this.scale.height;
		const cx = w / 2;

		this.add
			.text(cx, h * 0.28, 'YOU WIN!', {
				fontFamily: 'Arcade',
				fontSize: `${Math.round(w / 14)}px`,
				color: '#ffe98a',
				stroke: '#2b3f8e',
				strokeThickness: Math.round(w / 180)
			})
			.setOrigin(0.5);

		this.add
			.text(cx, h * 0.45, `FINAL SCORE ${String(this.score).padStart(6, '0')}`, {
				fontFamily: 'Arcade',
				fontSize: `${Math.round(w / 34)}px`,
				color: '#ffffff'
			})
			.setOrigin(0.5);

		this.add
			.text(cx, h * 0.58, 'THANKS FOR PLAYING', {
				fontFamily: 'Arcade',
				fontSize: `${Math.round(w / 48)}px`,
				color: '#dbe6ff'
			})
			.setOrigin(0.5);

		// celebratory heart bursts
		for (let i = 0; i < 6; i++) {
			this.time.delayedCall(
				i * 450,
				() => {
					this.particles.hearts.createEmitter({
						x: Phaser.Math.Between(w * 0.15, w * 0.85),
						y: Phaser.Math.Between(h * 0.15, h * 0.5),
						speed: 240,
						quantity: 10,
						maxParticles: 10,
						lifespan: 900,
						scale: { start: 1.2, end: 0 }
					});
				},
				[],
				this
			);
		}

		const hint = this.add
			.text(cx, h * 0.74, isTouchDevice ? 'TAP TO PLAY AGAIN' : 'PRESS SPACE TO PLAY AGAIN', {
				fontFamily: 'Arcade',
				fontSize: `${Math.round(w / 50)}px`,
				color: '#ffffff'
			})
			.setOrigin(0.5);
		this.tweens.add({
			targets: hint,
			alpha: 0.2,
			duration: 400,
			yoyo: true,
			repeat: -1
		});

		const restart = () => this.scene.start('MainScene', { level: 1, score: 0 });
		this.input.keyboard.once('keydown-SPACE', restart);
		this.input.once('pointerdown', restart);
	}
}
