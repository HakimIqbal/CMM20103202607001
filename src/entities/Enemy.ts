import { LevelScene } from '@src/scenes';

type PhSprite = Phaser.Physics.Arcade.Sprite & {
	body: Phaser.Physics.Arcade.Body;
};

/**
 * Patrolling enemy. Stompable from above (Mario-style), damages player on side contact.
 */
export class Enemy {
	public sprite: PhSprite;
	private scene: LevelScene;
	private readonly speed: number;
	private readonly minX: number;
	private readonly maxX: number;
	private dead: boolean = false;

	constructor({
		scene,
		position,
		patrolRange = 96
	}: {
		scene: LevelScene;
		position: Vector2Like;
		patrolRange?: number;
	}) {
		this.scene = scene;
		this.speed = Phaser.Math.Between(40, 70);
		this.minX = position.x - patrolRange / 2;
		this.maxX = position.x + patrolRange / 2;
	}

	public preload(): void {
		this.scene.load.spritesheet('slime', 'assets/sprites/slime.png', {
			frameWidth: 32,
			frameHeight: 24
		});
	}

	public create({ position }: { position: Vector2Like }): void {
		const animKey = 'slime_walk';
		if (!this.scene.anims.exists(animKey)) {
			this.scene.anims.create({
				key: animKey,
				frameRate: 5,
				frames: this.scene.anims.generateFrameNumbers('slime', {
					start: 0,
					end: 3
				}),
				repeat: -1
			});
		}
		this.sprite = this.scene.physics.add.sprite(
			position.x,
			position.y,
			'slime'
		) as PhSprite;
		this.sprite.play(animKey);
		this.sprite.body.setSize(24, 18);
		this.sprite.body.setOffset(4, 6);
		this.sprite.setVelocityX(this.speed);
		this.sprite.setDepth(47);
	}

	public update(): void {
		if (this.dead || !this.sprite.body) return;
		// reverse at patrol bounds or walls
		if (
			this.sprite.body.blocked.left ||
			this.sprite.body.blocked.right ||
			this.sprite.x <= this.minX ||
			this.sprite.x >= this.maxX
		) {
			this.sprite.setVelocityX(-this.sprite.body.velocity.x || this.speed);
		}
		this.sprite.setFlipX(this.sprite.body.velocity.x < 0);
		// fell off world -> cleanup silently
		if (this.sprite.y > this.scene.height + 200) this.kill(false);
	}

	/** returns true if this hit was a stomp (enemy dies), false if it hurt the player */
	public interact(playerYBottom: number, playerPrevBottom: number): boolean {
		if (this.dead) return false;
		const stomped =
			playerPrevBottom <= this.sprite.body.top + 8 &&
			playerYBottom >= this.sprite.body.top;
		if (stomped) {
			this.kill(true);
			return true;
		}
		return false;
	}

	public get isDead(): boolean {
		return this.dead;
	}

	public kill(withEffect: boolean): void {
		if (this.dead) return;
		this.dead = true;
		if (withEffect && this.scene.particles && this.scene.particles.stars) {
			this.scene.particles.stars.setDepth(52).createEmitter({
				x: this.sprite.x,
				y: this.sprite.y,
				speed: 220,
				quantity: 8,
				maxParticles: 8,
				lifespan: 500,
				scale: { start: 1, end: 0 }
			});
		}
		this.sprite.destroy();
	}
}
