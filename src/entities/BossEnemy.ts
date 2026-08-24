import { LevelScene } from '@src/scenes';

type PhSprite = Phaser.Physics.Arcade.Sprite & {
	body: Phaser.Physics.Arcade.Body;
};

/**
 * Mini-boss "Slime King" — replaces the removed door as the level goal.
 * - Big slime patrolling near the end of the map
 * - Stomp on top: -1 boss HP, boss speeds up, player bounces away
 * - Side contact: player loses 1 heart (standard enemy rules)
 * - HP reaches 0: death particle burst -> level complete callback
 */
export class BossEnemy {
	public sprite: PhSprite;
	private scene: LevelScene;
	private maxHp: number;
	private hp: number;
	private baseSpeed: number;
	private dead: boolean = false;
	private spawnPoint: Vector2Like;
	public onComplete: () => void = () => {};

	constructor({ scene, maxHp }: { scene: LevelScene; maxHp?: number }) {
		this.scene = scene;
		this.maxHp = maxHp || 3;
		this.hp = this.maxHp;
	}

	public preload(): void {
		this.scene.load.spritesheet('slime', 'assets/sprites/slime.png', {
			frameWidth: 32,
			frameHeight: 24
		});
	}

	public create(position: Vector2Like, scale: number, speedMult: number): void {
		if (!this.scene.anims.exists('slime_walk')) {
			this.scene.anims.create({
				key: 'slime_walk',
				frameRate: 5,
				frames: this.scene.anims.generateFrameNumbers('slime', { start: 0, end: 3 }),
				repeat: -1
			});
		}
		this.spawnPoint = position;
		this.baseSpeed = 55 * speedMult;
		this.sprite = this.scene.physics.add.sprite(position.x, position.y, 'slime') as PhSprite;
		this.sprite.play('slime_walk');
		// double size vs normal slime (scale-2)
		this.sprite.setScale(scale + 1);
		this.sprite.body.setSize(26, 20);
		this.sprite.setDepth(48);
		// slight red tint to read as "boss"
		this.sprite.setTint(0xffb0b8);
		this.sprite.setVelocityX(this.baseSpeed);

		// patrol bounds around spawn point so it stays in its arena
		this.patrolMinX = position.x - 140;
		this.patrolMaxX = position.x + 140;
	}

	private patrolMinX: number = 0;
	private patrolMaxX: number = 0;

	/** called from MainScene.update() */
	public update(): void {
		if (this.dead || !this.sprite.body) return;
		const v = this.sprite.body.velocity.x;
		const x = this.sprite.x;
		// turn inside patrol bounds or at walls
		if ((v > 0 && x > this.patrolMaxX) || (v < 0 && x < this.patrolMinX)) {
			this.sprite.setVelocityX(-v || this.baseSpeed);
		}
		if (Math.abs(v) < 5) {
			this.sprite.setVelocityX(this.baseSpeed);
		}
	}

	/** player stomped the boss: returns true if this hit killed it */
	public stomp(): boolean {
		if (this.dead) return false;
		this.hp -= 1;
		// boss enrages: faster each hit
		this.baseSpeed *= 1.35;
		this.sprite.setVelocityX(this.sprite.body.velocity.x >= 0 ? this.baseSpeed : -this.baseSpeed);
		// white flash feedback
		this.sprite.setTintFill(0xffffff);
		this.scene.time.delayedCall(120, () => {
			if (!this.dead) this.sprite.clearTint();
			if (!this.dead) this.sprite.setTint(0xffb0b8);
		}, [], this);
		if (this.hp <= 0) {
			this.die();
			return true;
		}
		return false;
	}

	private die(): void {
		this.dead = true;
		this.sprite.body.enable = false;
		// heart-particle burst then remove (Phaser 3.16 emitter API)
		const x = this.sprite.x;
		const y = this.sprite.y;
		this.scene.particles.hearts.setDepth(60).createEmitter({
			x: { min: x - 24, max: x + 24 },
			y: y,
			speed: { min: 150, max: 350 },
			gravityY: 500,
			lifespan: 900,
			scale: { start: 1.4, end: 0 },
			quantity: 14,
			maxParticles: 14
		});
		this.sprite.destroy();
		this.onComplete();
	}

	public get isDead(): boolean {
		return this.dead;
	}
}
