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
		this.scene.load.spritesheet('slime', 'assets/sprites/slime.png?v=24089', {
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
	/** real-displacement tracking for the stuck detector */
	private lastPosX: number = -1;
	private lastPosAt: number = 0;
	/** injected by the scene every frame: the player's world position */
	public setPlayerPos(x: number, y: number): void {
		this.playerPosX = x;
		this.playerPosY = y;
	}

	private playerPosX: number = 0;
	private playerPosY: number = -9999;
	/** when true the slime reacts to the player's position (aggro) */
	public mirrorPlayer: boolean = false;

	/** aggro tuning — 300 keeps spawn (col 0) out of the nearest slime's
	 * aggro radius (~408px away): a retry must never be punished by an
	 * instant chase-kill loop at the spawn point. */
	private static readonly AGGRO_RANGE_X = 300;
	private static readonly AGGRO_RANGE_Y = 80;
	private static readonly CHASE_SPEED = 105;
	/** how often the slime re-evaluates chase direction (reaction delay) */
	private static readonly CHASE_THINK_MS = 300;

	private chasing: boolean = false;
	private chaseDir: 0 | 1 | -1 = 0;
	private lastChaseThinkAt: number = 0;

	public update(): void {
		if (this.dead || !this.sprite.body) return;
		const now = this.scene.time.now;
		const vx = this.sprite.body.velocity.x;

		const wallHit =
			this.sprite.body.blocked.left ? -1 :
			this.sprite.body.blocked.right ? 1 : 0;

		if (wallHit !== 0 && now - this.lastTurnAt > 250) {
			this.lastTurnAt = now;
			this.sprite.setVelocityX(-wallHit * this.speed);
		}

		// ---- MANDATORY LEDGE TURN ------------------------------------
		// Checked EVERY frame with NO cooldown: the moment there is no
		// ground ahead, the slime must reverse. It may never walk off,
		// pause at, or fall from a ledge while alive.
		if (
			vx !== 0 &&
			this.sprite.body.onFloor() &&
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

		// ---- MIRROR PLAYER (never into a pit) ------------------------
		// Aggro: when the player is roughly on the same platform band and
		// within range, walk TOWARD THE PLAYER'S POSITION (Goomba-style
		// approach), not just mirror their facing. Ledge law still wins:
		// never step toward a pit.
		//
		// REACTION DELAY (spec STEP 3): direction intent is re-evaluated on
		// a 300ms tick, so a quick feint by the player buys ~0.3s of slime
		// confusion instead of instant tracking. Ledge safety still runs
		// EVERY frame and overrides everything — safety is never delayed.
		if (
			this.mirrorPlayer &&
			this.hasGroundAt &&
			this.sprite.body.onFloor() &&
			now - this.lastChaseThinkAt >= Enemy.CHASE_THINK_MS
		) {
			this.lastChaseThinkAt = now;
			const inBandY = Math.abs(this.playerPosY - this.sprite.y) < Enemy.AGGRO_RANGE_Y;
			const inRangeX = Math.abs(this.playerPosX - this.sprite.x) < Enemy.AGGRO_RANGE_X;
			if (inBandY && inRangeX) {
				this.chaseDir = this.playerPosX > this.sprite.x ? 1 : -1;
				this.chasing = true;
			} else {
				this.chasing = false; // out of range: forget the player until next think
			}
		}
		if (this.chasing && this.chaseDir !== 0 && this.hasGroundAt) {
			const chaseSpeed = Math.max(Enemy.CHASE_SPEED, this.speed);
			if (wallHit !== this.chaseDir) {
				const probeX =
					this.sprite.body.center.x +
					(this.sprite.body.width / 3) * this.chaseDir;
				const probeY = this.sprite.body.bottom + 6;
				if (this.hasGroundAt(probeX, probeY)) {
					this.sprite.setVelocityX(this.chaseDir * chaseSpeed);
				} else {
					// ledge blocks the approach: patrol away from it
					this.sprite.setVelocityX(-this.chaseDir * this.speed);
				}
			}
		}

		// ---- priority 3: NEVER FREEZE (hop when stuck) ---------------
		// Stuck = REAL displacement near-zero regardless of velocity value.
		// A slime pressing against a wall has velocity but moves nowhere;
		// checking only velocity misses that case entirely.
		const movedX = Math.abs(this.sprite.x - this.lastPosX);
		const stalledNow = this.sprite.body.onFloor() && movedX < 2 && now - this.lastPosAt > 400;
		if (stalledNow) {
			if (this.stuckSince === 0) {
				this.stuckSince = now;
			} else if (now - this.stuckSince > 600) {
				// unstick: hop toward current facing (or flip if unsafe)
				const d = vx !== 0 ? (vx >= 0 ? 1 : -1) : this.playerPosX >= this.sprite.x ? 1 : -1;
				this.sprite.setVelocity(d * this.speed * 1.4, -350);
				this.stuckSince = 0;
				this.lastTurnAt = now;
			}
		} else if (movedX >= 2) {
			this.stuckSince = 0;
		}
		if (now - this.lastPosAt > 400) {
			this.lastPosX = this.sprite.x;
			this.lastPosAt = now;
		}

		// ---- periodic hop for liveliness ------------------------------
		// SAFETY: a hop lasts ~0.55s; at chase speed that is ~58px of
		// horizontal travel while the ledge check (onFloor-only) is blind.
		// Probe the FULL airtime landing zone before hopping, else turn.
		if (this.nextHopAt === 0) this.nextHopAt = now + Phaser.Math.Between(1800, 3200);
		if (
			now > this.nextHopAt &&
			this.sprite.body.onFloor() &&
			this.hasGroundAt &&
			vx !== 0
		) {
			const dir = vx > 0 ? 1 : -1;
			const airtime = 1.1; // seconds up+down at jumpVelocity -300
			const travel = Math.abs(vx) * airtime * 1.15;
			const probeX = this.sprite.body.center.x + travel * dir;
			const probeY = this.sprite.body.bottom + 6;
			let safe = true;
			for (let d = 16; d <= travel && safe; d += 16) {
				if (!this.hasGroundAt(this.sprite.body.center.x + d * dir, probeY)) {
					safe = false;
				}
			}
			if (safe) {
				this.nextHopAt = now + Phaser.Math.Between(1800, 3200);
				this.sprite.setVelocityY(-300);
			} else {
				// unsafe: skip hop and turn away from the ledge now
				this.nextHopAt = now + Phaser.Math.Between(1800, 3200);
				this.lastTurnAt = now;
				this.sprite.setVelocityX(-dir * this.speed);
			}
		}

		this.sprite.setFlipX(this.sprite.body.velocity.x < 0);

		// safety net: a slime that somehow fell out of the world is GONE.
		// Respawning it would teleport it back into view mid-air (players
		// reported "fountain" minis raining from above the pit) — and for
		// minis it would also resurrect points the player already earned.
		if (this.sprite.y > this.scene.height + 100) {
			this.kill();
		}
	}

	private turn(currentVx: number): void {
		this.lastTurnAt = this.scene.time.now;
		this.sprite.setVelocityX(-(currentVx || this.speed));
	}

	/**
	 * Called when player collides with this enemy.
	 * Returns 'stomp' if the player hit from above (enemy dies), else 'hurt'.
	 * When a BIG slime is stomped it splits: this.splitInto(3) is invoked by
	 * the scene so the new minis join the live enemy list.
	 */
	public interact(playerBottom: number, playerPrevBottom: number): 'stomp' | 'hurt' {
		if (this.dead) return 'hurt';
		const stomped =
			playerPrevBottom <= this.sprite.body.top + 8 &&
			playerBottom >= this.sprite.body.top;
		if (stomped) {
			if (this.onStomped) this.onStomped(this);
			this.kill();
			return 'stomp';
		}
		return 'hurt';
	}

	/** set by the scene: called with `this` right before a stomped slime dies */
	public onStomped?: (slime: Enemy) => void;

	public get isDead(): boolean {
		return this.dead;
	}

	public get isMini(): boolean {
		return this.mini;
	}

	private mini: boolean = false;

	/** mark as mini: smaller sprite, faster, chases the player relentlessly */
	public makeMini(scale: number): void {
		this.mini = true;
		this.speed = Math.round(this.speed * 1.3);
		this.sprite.setScale(scale);
		this.sprite.body.setSize(24, 18);
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
