import { LevelScene } from '@src/scenes';

/**
 * Minimal HUD for step 1: score counter top-left using the arcade font.
 */
export class Hud {
	private scoreText: Phaser.GameObjects.Text;
	private scene: LevelScene;
	private hearts: Phaser.GameObjects.Image[] = [];

	constructor({ scene }: { scene: LevelScene }) {
		this.scene = scene;
	}

	public create(): void {
		// Scale-relative sizing: fixed pixel sizes looked tiny on wide /
		// high-DPI screens. Everything derives from viewport width now.
		const w = this.scene.scale.width;
		this.scoreText = this.scene.add.text(24, 18, '', {
			fontFamily: 'Arcade',
			fontSize: `${Math.round(Math.max(30, w / 34))}px`,
			color: '#ffe98a',
			stroke: '#2b3f8e',
			strokeThickness: Math.round(w / 220)
		});
		this.scoreText.setScrollFactor(0).setDepth(60);
		this.setScore(0);
	}

	public setScore(score: number): void {
		this.scoreText.setText(`SCORE ${String(score).padStart(6, '0')}`);
	}

	public setLives(lives: number): void {
		if (this.hearts.length === 0) {
			for (let i = 0; i < 3; i++) {
				const h = this.scene.add.image(0, 0, 'heart');
				h.setScrollFactor(0).setDepth(60);
				h.setOrigin(1, 0);
				this.hearts.push(h);
			}
			this.layoutHearts();
			this.scene.scale.on('resize', () => this.layoutHearts());
		}
		this.hearts.forEach((h, i) => h.setVisible(i < lives));
	}

	private layoutHearts(): void {
		const w = this.scene.scale.width;
		// Heart art is 16px — scale it up relative to viewport width
		// (was a flat 2x = ~32px, tiny on modern screens; now ≈ w/22).
		const heartScale = Math.max(3, w / 352);
		const gap = Math.max(64, w / 18);
		const topOffset = Math.max(16, w * 0.014);
		this.hearts.forEach((h, i) => {
			h.setScale(heartScale);
			h.setPosition(
				w - topOffset - i * gap,
				topOffset
			);
		});
	}
}
