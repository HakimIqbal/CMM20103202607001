import { LevelScene } from '@src/scenes';

type PhSprite = Phaser.Physics.Arcade.Sprite & {
	body: Phaser.Physics.Arcade.Body;
};

/**
 * Collectible coin. +10 score, ding SFX, spin animation, float bob.
 */
export class Coin {
	public sprite: PhSprite;
	private scene: LevelScene;
	private baseY: number;
	private t: number = Math.random() * Math.PI * 2;
	private collected: boolean = false;

	constructor({ scene }: { scene: LevelScene }) {
		this.scene = scene;
	}

	public preload(): void {
		this.scene.load.spritesheet('coin', 'assets/sprites/coin.png', {
			frameWidth: 16,
			frameHeight: 16
		});
	}

	public createStatic(): void {
		const animKey = 'coin_spin';
		if (!this.scene.anims.exists(animKey)) {
			this.scene.anims.create({
				key: animKey,
				frameRate: 8,
				frames: this.scene.anims.generateFrameNumbers('coin', {
					start: 0,
					end: 5
				}),
				repeat: -1
			});
		}
	}

	public spawn(position: Vector2Like): PhSprite {
		this.sprite = this.scene.physics.add.sprite(
			position.x,
			position.y,
			'coin'
		) as PhSprite;
		this.sprite.play('coin_spin');
		this.sprite.body.setAllowGravity(false);
		this.sprite.body.setSize(12, 12);
		this.baseY = position.y;
		return this.sprite;
	}

	public update(): void {
		if (this.collected || !this.sprite.body) return;
		this.t += 0.05;
		this.sprite.y = this.baseY + Math.sin(this.t) * 3;
	}

	public collect(): void {
		if (this.collected) return;
		this.collected = true;
		this.sprite.destroy();
	}
}
