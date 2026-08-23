import { LevelScene } from '@src/scenes';

type PhSprite = Phaser.Physics.Arcade.Sprite & {
	body: Phaser.Physics.Arcade.Body;
};

/**
 * Collectible coin. Spins; collected on player overlap.
 */
export class Coin {
	public sprite: PhSprite;
	private scene: LevelScene;
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

	public static ensureAnimation(scene: LevelScene): void {
		if (!scene.anims.exists('coin_spin')) {
			scene.anims.create({
				key: 'coin_spin',
				frameRate: 8,
				frames: scene.anims.generateFrameNumbers('coin', {
					start: 0,
					end: 5
				}),
				repeat: -1
			});
		}
	}

	public create(position: Vector2Like): PhSprite {
		Coin.ensureAnimation(this.scene);
		this.sprite = this.scene.physics.add.sprite(
			position.x,
			position.y,
			'coin'
		) as PhSprite;
		this.sprite.play('coin_spin');
		this.sprite.body.setAllowGravity(false);
		this.sprite.body.setSize(12, 12);
		this.sprite.setDepth(47);
		return this.sprite;
	}

	public collect(): void {
		if (this.collected) return;
		this.collected = true;
		this.sprite.destroy();
	}

	public get isCollected(): boolean {
		return this.collected;
	}
}
