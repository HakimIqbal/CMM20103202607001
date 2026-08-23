import { LevelScene } from '@src/scenes';
import { isTouchDevice } from '@src/utils';

/**
 * In-game HUD: score, hearts (lives), level label, level banner.
 */
export class Hud {
	private scene: LevelScene;
	private scoreText: Phaser.GameObjects.Text;
	private levelText: Phaser.GameObjects.Text;
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

		this.scoreText = this.scene.add.text(24, 18, '', {
			fontFamily,
			fontSize: '26px',
			color: '#ffe98a',
			stroke: '#2b3f8e',
			strokeThickness: 4
		});
		this.scoreText.setScrollFactor(0).setDepth(60);

		this.levelText = this.scene.add
			.text(this.scene.width / 2, 18, `LEVEL ${level}`, {
				fontFamily,
				fontSize: '26px',
				color: '#ffffff',
				stroke: '#2b3f8e',
				strokeThickness: 4
			})
			.setOrigin(0.5, 0);
		this.levelText.setScrollFactor(0).setDepth(60);

		for (let i = 0; i < 3; i++) {
			const h = this.scene.add.image(
				this.scene.width - 40 - i * 56,
				36,
				'heart'
			);
			h.setScale(1.6).setScrollFactor(0).setDepth(60);
			this.hearts.push(h);
		}
		this.setScore(score);
		this.setLives(lives);
	}

	public setScore(score: number) {
		this.scoreText.setText(`SCORE ${String(score).padStart(6, '0')}`);
	}

	public setLives(lives: number) {
		this.hearts.forEach((h, i) => h.setVisible(i < lives));
	}

	public showLevelBanner(level: number) {
		this.banner = this.scene.add
			.text(this.scene.width / 2, this.scene.height / 2 - 60, `LEVEL ${level}`, {
				fontFamily: 'Arcade',
				fontSize: '64px',
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
