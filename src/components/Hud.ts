import { LevelScene } from '@src/scenes';

/**
 * Minimal HUD for step 1: score counter top-left using the arcade font.
 */
export class Hud {
	private scoreText: Phaser.GameObjects.Text;
	private scene: LevelScene;

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
}
