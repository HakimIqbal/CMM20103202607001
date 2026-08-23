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
	private nextHopAt: number = 0;
	private stuckSince: number = 0;
	/** when true, the slime mirrors the player's walking direction */
	public mirrorPlayer: boolean = false;

	/** called by the scene every frame with the player's facing direction (-1/1) */
	public setPlayerFacing(dir: number): void {
		this.desiredDir = dir;
	}

	private desiredDir: number = 0;

	public update(): void {
		if (this.dead || !this.sprite.body) return;
		const now = this.scene.time.now;
		const vx = this.sprite.body.velocity.x;

		const wallHit =
			this.sprite.body.blocked.left ? -1 :
			this.sprite.body.blocked.right ? 1 : 0;

		// ---- priority 1: SAFETY --------------------------------------
		if (wallHit !== 0 && now - this.lastTurnAt > 250) {
			this.lastTurnAt = now;
			this.sprite.setVelocityX(-wallHit * this.speed);
		} else if (
			vx !== 0 &&
			now - this.lastTurnAt > 250 &&
			this.hasGroundAt
		) {
			const dir = vx > 0 ? 1 : -1;
			const probeX = this.sprite.body.center.x + (this.sprite.body.width / 3) * dir;
			const probeY = this.sprite.body.bottom + 6;
			if (!this.hasGroundAt(probeX, probeY)) {
				this.lastTurnAt = now;
				this.sprite.setVelocityX(-dir * this.speed);
			}
		}

		// ---- priority 2: MIRROR PLAYER -------------------------------
		if (
			this.mirrorPlayer &&
			this.desiredDir !== 0 &&
			wallHit !== this.desiredDir &&          // not pinned by a wall on that side
			now - this.lastTurnAt > 400 &&
			vx * this.desiredDir < 0                // moving opposite to player
		) {
			this.lastTurnAt = now;
			this.sprite.setVelocityX(this.desiredDir * this.speed);
		}

		// ---- priority 3: NEVER FREEZE (hop when stuck) ---------------
		const stalledNow = Math.abs(this.sprite.body.velocity.x) < 8;
		if (stalledNow) {
			if (this.stuckSince === 0) this.stuckSince = now;
			else if (now - this.stuckSince > 600) {
				// hop toward desired dir (or flip if unsafe)
				const d = this.desiredDir !== 0 ? this.desiredDir : (vx >= 0 ? 1 : -1);
				this.sprite.setVelocity(d * this.speed * 1.4, -350);
				this.stuckSince = 0;
				this.lastTurnAt = now;
			}
		} else {
			this.stuckSince = 0;
		}

		// ---- periodic hop for liveliness ------------------------------
		if (this.nextHopAt === 0) this.nextHopAt = now + Phaser.Math.Between(1800, 3200);
		if (
			now > this.nextHopAt &&
			this.sprite.body.onFloor() &&
			!this.dead
		) {
			this.nextHopAt = now + Phaser.Math.Between(1800, 3200);
			this.sprite.setVelocityY(-300);
		}

		this.sprite.setFlipX(this.sprite.body.velocity.x < 0);

		// safety net: if it somehow fell out of the world, return to spawn
		if (this.sprite.y > this.scene.height + 100) {
			this.sprite.setPosition(this.spawnPoint.x, this.spawnPoint.y);
			this.sprite.setVelocityX(this.speed);
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
