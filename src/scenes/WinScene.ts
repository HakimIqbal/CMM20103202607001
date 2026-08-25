import { LevelScene } from './LevelScene';
import { isTouchDevice } from '@src/utils';

/**
 * Victory screen: celebratory stage with Ara jumping, open Love Chest,
 * heart particle fireworks, and final score summary.
 */
export class WinScene extends LevelScene {
	private score: number = 0;

	constructor() {
		super({ key: 'WinScene' });
	}

	public init(data: { score?: number }) {
		this.score = data && data.score != null ? data.score : 0;
	}

	public preload() {
		super.preload();
		this.load.spritesheet('loveChest', 'assets/sprites/love_chest.png?v=24089', {
			frameWidth: 64,
			frameHeight: 64
		});
		this.load.spritesheet('ara', 'assets/sprites/ara.png?v=24089', {
			frameHeight: 102,
			frameWidth: 77,
			margin: 1,
			spacing: 2
		});
	}

	public create() {
		super.create();
		this.cameras.main.setBackgroundColor('#448AFF');

		const w = this.scale.width;
		const h = this.scale.height;
		const cx = w / 2;

		// 1. Victory Header
		const title = this.add
			.text(cx, h * 0.18, 'VICTORY!', {
				fontFamily: 'Arcade',
				fontSize: `${Math.round(w / 12)}px`,
				color: '#ffe98a',
				stroke: '#2b3f8e',
				strokeThickness: Math.max(4, Math.round(w / 160))
			})
			.setOrigin(0.5)
			.setDepth(20);

		this.tweens.add({
			targets: title,
			scale: { from: 0.9, to: 1.05 },
			duration: 600,
			yoyo: true,
			repeat: -1,
			ease: 'Sine.easeInOut'
		});

		// 2. Center Stage: Celebrating Ara + Open Chest
		const groundY = h * 0.62;

		// Ara Jumping for Joy (Frame 9 - mid jump)
		const ara = this.add.sprite(cx - 50, groundY, 'ara', 9).setOrigin(0.5, 1);
		const araScale = Math.max(1.8, w / 480);
		ara.setScale(araScale).setDepth(15);

		// Joy jump animation
		this.tweens.add({
			targets: ara,
			y: groundY - 30,
			duration: 400,
			yoyo: true,
			repeat: -1,
			ease: 'Quad.easeOut'
		});

		// Open Love Chest (Frame 1 is open)
		const chest = this.add.sprite(cx + 60, groundY, 'loveChest', 1).setOrigin(0.5, 1);
		chest.setScale(Math.max(1.5, w / 550)).setDepth(15);

		// 3. Final Score Display
		this.add
			.text(
				cx,
				h * 0.72,
				`FINAL SCORE ${String(this.score).padStart(6, '0')}`,
				{
					fontFamily: 'Arcade',
					fontSize: `${Math.round(w / 30)}px`,
					color: '#ffffff',
					stroke: '#2b3f8e',
					strokeThickness: 3
				}
			)
			.setOrigin(0.5)
			.setDepth(20);

		// 4. Celebratory Heart Fireworks Burst
		for (let i = 0; i < 8; i++) {
			this.time.delayedCall(
				i * 350,
				() => {
					this.particles.hearts.createEmitter({
						x: Phaser.Math.Between(w * 0.1, w * 0.9),
						y: Phaser.Math.Between(h * 0.15, h * 0.55),
						speed: 250,
						quantity: 12,
						maxParticles: 12,
						lifespan: 1000,
						scale: { start: 1.4, end: 0 }
					});
				},
				[],
				this
			);
		}

		// 5. Play Again Prompt
		const hint = this.add
			.text(
				cx,
				h * 0.84,
				isTouchDevice ? 'TAP TO PLAY AGAIN' : 'PRESS SPACE TO PLAY AGAIN',
				{
					fontFamily: 'Arcade',
					fontSize: `${Math.round(w / 38)}px`,
					color: '#ffffff',
					stroke: '#2b3f8e',
					strokeThickness: 3
				}
			)
			.setOrigin(0.5)
			.setDepth(20);

		this.tweens.add({
			targets: hint,
			alpha: 0,
			duration: 450,
			yoyo: true,
			repeat: -1
		});

		const restart = () => this.scene.start('MainScene', { level: 1, score: 0 });
		this.input.keyboard.once('keydown-SPACE', restart);
		this.input.keyboard.once('keydown-ENTER', restart);
		this.input.once('pointerdown', restart);
	}
}

