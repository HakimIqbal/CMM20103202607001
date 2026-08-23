import { LevelScene } from '@src/scenes';

type PhSprite = Phaser.Physics.Arcade.Sprite & {
	body: Phaser.Physics.Arcade.Body;
};

/**
 * Patrolling slime enemy (Step 2).
 * - Walks left/right, turns at walls or ledge patrol bounds
 * - Stomp (player lands on top): slime dies, player bounces
 * - Side contact: player loses 1 heart + brief invincibility
 */
export class Enemy {
	public sprite: PhSprite;
	private scene: LevelScene;
	private speed: number;
	private dead: boolean = false;

	constructor({ scene, position }: { scene: LevelScene; position: Vector2Like }) {
		this.scene = scene;
		this.speed = Phaser.Math.Between(40, 70);
	}

	public preload(): void {
		this.scene.load.spritesheet('slime', 'assets/sprites/slime.png', {
			frameWidth: 32,
			frameHeight: 24
		});
	}

	public static ensureAnimation(scene: LevelScene): void {
		if (!scene.anims.exists('slime_walk')) {
			scene.anims.create({
				key: 'slime_walk',
				frameRate: 5,
				frames: scene.anims.generateFrameNumbers('slime', {
					start: 0,
					end: 3
				}),
				repeat: -1
			});
		}
	}

	public create(position: Vector2Like, scale: number): void {
		Enemy.ensureAnimation(this.scene);
		this.sprite = this.scene.physics.add.sprite(
			position.x,
			position.y,
			'slime'
		) as PhSprite;
		this.sprite.play('slime_walk');
		this.sprite.setScale(scale);
		this.sprite.body.setSize(24, 18);
		this.sprite.setDepth(47);
		this.spawnPoint = { x: position.x, y: position.y };
		this.sprite.setVelocityX(this.speed);
	}

	private spawnPoint: Vector2Like = { x: 0, y: 0 };
	/** injected by the scene: does world-space (x, y) sit above solid ground? */
	public hasGroundAt?: (x: number, y: number) => boolean;

	private lastTurnAt: number = 0;
	/** when true, the slime mirrors the player's walking direction */
	public mirrorPlayer: boolean = false;

	/** called by the scene every frame with the player's facing direction (-1/1) */
	public setPlayerFacing(dir: number): void {
		if (!this.mirrorPlayer || this.dead || !this.sprite.body) return;
		if (dir === 0) return;
		const vx = this.sprite.body.velocity.x;
		// only steer if currently moving the other way and turn-cooldown allows
		if (vx * dir < 0 && this.scene.time.now - this.lastTurnAt > 300) {
			this.turn(vx);
		}
	}

	public update(): void {
		if (this.dead || !this.sprite.body) return;

		const vx = this.sprite.body.velocity.x;
		const moving = Math.abs(vx) > 1;

		// turn around at walls (always allowed)
		if (this.sprite.body.blocked.left || this.sprite.body.blocked.right) {
			this.turn(vx);
		} else if (moving) {
			// ledge check with generous probe: 1/3 body width ahead, below feet
			const dir = vx > 0 ? 1 : -1;
			const probeOffset = this.sprite.body.width / 3 * dir;
			const probeX = this.sprite.body.center.x + probeOffset;
			const probeY = this.sprite.body.bottom + 6;
			const now = this.scene.time.now;
			const canTurn = now - this.lastTurnAt > 300; // anti flip-flop cooldown
			if (
				canTurn &&
				this.hasGroundAt &&
				!this.hasGroundAt(probeX, probeY)
			) {
				this.turn(vx);
			}
		}

		this.sprite.setFlipX(this.sprite.body.velocity.x < 0);

		// safety net: if it somehow fell out of the world, return to spawn
		if (this.sprite.y > this.scene.height + 100) {
			this.sprite.setPosition(this.spawnPoint.x, this.spawnPoint.y);
			this.sprite.setVelocityX(this.speed);
		}

		// keep walking: ensure a minimum speed in the facing direction
		if (Math.abs(this.sprite.body.velocity.x) < 5) {
			const dir = this.sprite.body.blocked.left ? 1 : -1;
			this.sprite.setVelocityX((dir || 1) * this.speed);
		}
	}

	private turn(currentVx: number): void {
		this.lastTurnAt = this.scene.time.now;
		this.sprite.setVelocityX(-(currentVx || this.speed));
	}

	/**
	 * Called when player collides with this enemy.
	 * Returns 'stomp' if the player hit from above (enemy dies), else 'hurt'.
	 */
	public interact(playerBottom: number, playerPrevBottom: number): 'stomp' | 'hurt' {
		if (this.dead) return 'hurt';
		const stomped =
			playerPrevBottom <= this.sprite.body.top + 8 &&
			playerBottom >= this.sprite.body.top;
		if (stomped) {
			this.kill();
			return 'stomp';
		}
		return 'hurt';
	}

	public get isDead(): boolean {
		return this.dead;
	}

	private kill(): void {
		this.dead = true;
		if (this.scene.particles && this.scene.particles.hearts) {
			this.scene.particles.hearts
				.setDepth(52)
				.createEmitter({
					x: this.sprite.x,
					y: this.sprite.y,
					speed: 200,
					quantity: 6,
					maxParticles: 6,
					lifespan: 450,
					scale: { start: 0.8, end: 0 }
				});
		}
		this.sprite.destroy();
	}
}
