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
		this.scoreText = this.scene.add.text(24, 18, '', {
			fontFamily: 'Arcade',
			fontSize: '26px',
			color: '#ffe98a',
			stroke: '#2b3f8e',
			strokeThickness: 4
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
				h.setScale(2).setScrollFactor(0).setDepth(60);
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
		const gap = Math.max(40, w / 30);
		this.hearts.forEach((h, i) => h.setPosition(w - w * 0.02 - i * gap, Math.round(w * 0.012)));
	}
}
