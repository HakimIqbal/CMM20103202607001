import { LevelScene } from '@src/scenes';

/**
 * Victory screen after level 3: total score + heart fireworks.
 */
export class WinScene extends LevelScene {
	private score: number = 0;

	constructor() {
		super({ key: 'WinScene' });
	}

	public init(data: { score?: number }) {
		this.score = (data.score != null ? data.score : 0);
	}

	public create() {
		super.create();
		this.cameras.main.setBackgroundColor('#448AFF');
		const cx = this.width / 2;

		const w = this.scale.width;
		this.add
			.text(cx, this.height * 0.26, 'YOU WIN!', {
				fontFamily: 'Arcade',
				fontSize: `${Math.round(w / 16)}px`,
				color: '#ffe98a',
				stroke: '#2b3f8e',
				strokeThickness: 10
			})
			.setOrigin(0.5);

		this.add
			.text(cx, this.height * 0.42, `FINAL SCORE ${String(this.score).padStart(6, '0')}`, {
				fontFamily: 'Arcade',
				fontSize: `${Math.round(w / 36)}px`,
				color: '#ffffff'
			})
			.setOrigin(0.5);

		this.add
			.text(cx, this.height * 0.56, 'THANKS FOR PLAYING', {
				fontFamily: 'Arcade',
				fontSize: `${Math.round(w / 48)}px`,
				color: '#dbe6ff'
			})
			.setOrigin(0.5);

		// celebratory heart fireworks bursts
		const burst = () => {
			this.particles.hearts.setDepth(55).createEmitter({
				x: Phaser.Math.Between(this.width * 0.15, this.width * 0.85),
				y: Phaser.Math.Between(this.height * 0.15, this.height * 0.5),
				speed: 260,
				quantity: 12,
				maxParticles: 12,
				scale: { start: 1.4, end: 0 },
				lifespan: 900
			});
		};
		for (let i = 0; i < 6; i++) this.time.delayedCall(i * 500, burst, [], this);
		this.time.addEvent({ delay: 3000, loop: true, callback: burst });

		const hint = this.add
			.text(cx, this.height * 0.74, 'PRESS SPACE TO PLAY AGAIN', {
				fontFamily: 'Arcade',
				fontSize: `${Math.round(w / 52)}px`,
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

		const restart = () => this.scene.start('GameScene', { level: 1, score: 0, lives: 3 });
		this.input.keyboard.once('keydown-SPACE', restart);
		this.input.once('pointerdown', restart);
	}
}
