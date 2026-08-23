import { LevelScene } from '@src/scenes';

/**
 * In-game HUD: score, hearts (lives), level label, level banner.
 * Positions and font sizes adapt to the live canvas size (RESIZE scale mode).
 */
export class Hud {
	private scene: LevelScene;
	private scoreText?: Phaser.GameObjects.Text;
	private levelText?: Phaser.GameObjects.Text;
	private hearts: Phaser.GameObjects.Image[] = [];
	private banner?: Phaser.GameObjects.Text;

	constructor({ scene }: { scene: LevelScene }) {
		this.scene = scene;
	}

	public preload() {
		// heart.png already loaded by LevelScene
	}

	public create({
		level,
		score,
		lives
	}: {
		level: number;
		score: number;
		lives: number;
	}) {
		const fontFamily = 'Arcade';
		const fontSize = `${Math.max(18, Math.round(this.scene.scale.width / 55))}px`;

		this.scoreText = this.scene.add.text(0, 0, '', {
			fontFamily,
			fontSize,
			color: '#ffe98a',
			stroke: '#2b3f8e',
			strokeThickness: 4
		});
		this.scoreText.setScrollFactor(0).setDepth(60);

		this.levelText = this.scene.add.text(0, 0, `LEVEL ${level}`, {
			fontFamily,
			fontSize,
			color: '#ffffff',
			stroke: '#2b3f8e',
			strokeThickness: 4
		});
		this.levelText.setOrigin(0.5, 0);
		this.levelText.setScrollFactor(0).setDepth(60);

		const heartScale = Math.max(1, this.scene.scale.width / 900);
		for (let i = 0; i < 3; i++) {
			const h = this.scene.add.image(0, 0, 'heart');
			h.setScale(heartScale * 1.6).setScrollFactor(0).setDepth(60);
			this.hearts.push(h);
		}

		this.layout();

		// keep HUD glued to corners when the window resizes
		this.scene.scale.on('resize', () => this.layout());

		this.setScore(score);
		this.setLives(lives);
	}

	private layout() {
		if (!this.scoreText || !this.levelText) return;
		const w = this.scene.scale.width;
		const gap = Math.max(44, w / 26);

		this.scoreText.setPosition(Math.round(w * 0.02), Math.round(w * 0.012));
		this.levelText.setPosition(Math.round(w / 2), Math.round(w * 0.012));

		const heartScale = Math.max(1, w / 900) * 1.6;
		const y = Math.round(w * 0.012 + 20 * heartScale);
		this.hearts.forEach((h, i) => {
			h.setScale(heartScale);
			h.setPosition(Math.round(w - w * 0.02 - i * gap), y);
		});
	}

	public setScore(score: number) {
		if (this.scoreText) {
			this.scoreText.setText(`SCORE ${String(score).padStart(6, '0')}`);
		}
	}

	public setLives(lives: number) {
		this.hearts.forEach((h, i) => h.setVisible(i < lives));
	}

	public showLevelBanner(level: number) {
		const w = this.scene.scale.width;
		const h = this.scene.scale.height;
		this.banner = this.scene.add
			.text(w / 2, h / 2 - h * 0.08, `LEVEL ${level}`, {
				fontFamily: 'Arcade',
				fontSize: `${Math.max(40, Math.round(w / 22))}px`,
				color: '#ffffff',
				stroke: '#2b3f8e',
				strokeThickness: 8
			})
			.setOrigin(0.5)
			.setDepth(70)
			.setScrollFactor(0);

		this.scene.tweens.add({
			targets: this.banner,
			alpha: 0,
			delay: 1400,
			duration: 600,
			onComplete: () => {
				if (this.banner) this.banner.destroy();
			}
		});
	}
}
