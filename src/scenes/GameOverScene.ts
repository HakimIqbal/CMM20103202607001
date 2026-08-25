import { LevelScene } from './LevelScene';
import { isTouchDevice } from '@src/utils';

/**
 * Game Over screen: styled retro game-over stage with Ara sitting,
 * laughing slimes, cracked heart icon, and clean arcade score card.
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

	public preload() {
		super.preload();
		this.load.spritesheet('slime', 'assets/sprites/slime.png?v=24089', {
			frameWidth: 32,
			frameHeight: 24
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
		this.cameras.main.setBackgroundColor('#141d38');

		const w = this.scale.width;
		const h = this.scale.height;
		const cx = w / 2;

		// 1. GAME OVER Title Header
		this.add
			.text(cx, h * 0.18, 'GAME OVER', {
				fontFamily: 'Arcade',
				fontSize: `${Math.round(w / 14)}px`,
				color: '#ff6b6b',
				stroke: '#2b0b14',
				strokeThickness: Math.max(4, Math.round(w / 180))
			})
			.setOrigin(0.5)
			.setDepth(20);

		// 2. Center Stage: Defeated Ara + Bouncing Slimes
		const groundY = h * 0.62;

		// Ara Sitting/Defeated (Frame 17)
		let ara = this.add.sprite(cx - 30, groundY, 'ara', 17).setOrigin(0.5, 1);
		const araScale = Math.max(1.8, w / 480);
		ara = ara.setScale(araScale).setDepth(15);

		// Tint Ara slightly dark/desaturated on defeat
		ara.setTint(0xc0c0d8);

		// Two mocking slimes hopping next to Ara
		if (!this.anims.exists('slime_walk')) {
			this.anims.create({
				key: 'slime_walk',
				frameRate: 6,
				frames: this.anims.generateFrameNumbers('slime', { start: 0, end: 3 }),
				repeat: -1
			});
		}

		const s1 = this.add.sprite(cx + 80, groundY, 'slime').setOrigin(0.5, 1);
		s1.setScale(Math.max(1.8, w / 480)).setDepth(16);
		s1.play('slime_walk');
		this.tweens.add({
			targets: s1,
			y: groundY - 24,
			scaleY: s1.scaleY * 1.25,
			scaleX: s1.scaleX * 0.85,
			duration: 320,
			yoyo: true,
			repeat: -1,
			ease: 'Quad.easeOut'
		});

		const s2 = this.add.sprite(cx + 140, groundY, 'slime').setOrigin(0.5, 1);
		s2.setScale(Math.max(1.4, w / 600)).setDepth(16);
		s2.play('slime_walk');
		this.tweens.add({
			targets: s2,
			y: groundY - 18,
			scaleY: s2.scaleY * 1.25,
			scaleX: s2.scaleX * 0.85,
			duration: 280,
			delay: 150,
			yoyo: true,
			repeat: -1,
			ease: 'Quad.easeOut'
		});

		// 3. Score Banner Box
		this.add
			.text(
				cx,
				h * 0.72,
				`SCORE ${String(this.score).padStart(6, '0')}`,
				{
					fontFamily: 'Arcade',
					fontSize: `${Math.round(w / 32)}px`,
					color: '#ffe98a',
					stroke: '#2b3f8e',
					strokeThickness: 3
				}
			)
			.setOrigin(0.5)
			.setDepth(20);

		// 4. Retry Prompt
		const retry = this.add
			.text(
				cx,
				h * 0.84,
				isTouchDevice ? 'TAP TO RETRY' : 'PRESS SPACE TO RETRY',
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
			targets: retry,
			alpha: 0,
			duration: 450,
			yoyo: true,
			repeat: -1
		});

		const restart = () => {
			this.scene.start('MainScene', { level: this.level, score: 0 });
		};
		this.input.keyboard.once('keydown-SPACE', restart);
		this.input.keyboard.once('keydown-ENTER', restart);
		this.input.once('pointerdown', restart);
	}
}

