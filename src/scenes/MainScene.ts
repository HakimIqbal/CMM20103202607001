import { Dialog, Hud, LevelMap, LevelSprite } from '@src/components';
/* NOTE: loveChest system temporarily disabled for Step 2 testing.
   Will be reintroduced as the level goal in Step 3. */
import { Coin } from '@src/entities/Coin';
import { Enemy } from '@src/entities/Enemy';
import { Spikes } from '@src/entities/Spikes';
import { BossEnemy } from '@src/entities/BossEnemy';
import { Sfx } from '@src/components/Sfx';
import { MusicPlaylist } from '@src/components/MusicPlaylist';
import { Player } from '@src/entities';

import { LevelScene } from './LevelScene';

export class MainScene extends LevelScene {
	private player: Player;
	private map: LevelMap;
	private dialog: Dialog;
	private giftsCount: number;
	private coins: Coin[] = [];
	private enemies: Enemy[] = [];
	private hud: Hud;
	private score: number = 0;
	private lives: number = 3;
	private gameOver: boolean = false;
	private playerPrevBottom: number = 0;
	private invincibleUntil: number = 0;
	private heartIcons: Phaser.GameObjects.Image[] = [];
	private sfx!: Sfx;
	private level: number = 1;
	private finishing: boolean = false;
	private musicPlaylist: MusicPlaylist;

	constructor() {
		super({ key: 'MainScene' });
	}

	public init(data: { level?: number; score?: number }) {
		if (data && data.level) this.level = data.level;
		if (data && data.score) this.score = data.score;

		this.dialog = new Dialog();
		this.player = new Player({ scene: this });
		this.map = new LevelMap({ scene: this, level: this.level });
		this.musicPlaylist = new MusicPlaylist();
		this.musicPlaylist.play();
	}

	public preload() {
		super.preload();
		this.map.preload();
		this.player.preload();
		new Coin({ scene: this }).preload();
		new Enemy({ scene: this, position: { x: 0, y: 0 } }).preload();
		this.sfx = new Sfx({ scene: this });
		this.sfx.preload();
	}

	public create() {
		super.create();
		this.map.create();
		this.player.create({ position: this.map.getStartPosition() });
		this.player.onFallOut = () => void this.handleFallOut();
		this.addColliders();
		this.spawnCoins();
		this.spawnEnemies();
		this.spawnSpikes();
		this.spawnBoss();
		this.hud = new Hud({ scene: this });
		this.hud.create();
		this.hud.setLives(this.lives);
		this.sfx.create();
	}

	/** spike tiles: overlap = -1 heart + upward knockback (invincibility applies) */
	private spikes: Spikes;

	private spawnSpikes() {
		this.spikes = new Spikes({ scene: this });
		this.spikes.create(this.map.spikeLayer, this.map.scalingFactor);
		for (const s of this.spikes.sprites) {
			this.physics.add.overlap(this.player.sprite, s, () =>
				this.loseHeart()
			);
		}
	}

	/** mini-boss near map end — stomp N times to finish the level */
	private boss!: BossEnemy;

	private spawnBoss() {
		this.boss = new BossEnemy({ scene: this, maxHp: 2 + this.level }); // L1:3 L2:4 L3:5
		// texture 'slime' already loaded by Enemy.preload() — no extra preload needed
		const speedMult = 1 + (this.level - 1) * 0.25;
		// boss arena: last solid ground column of the map
		const pos = { x: this.scale.width * 0.92, y: 0 };
		this.boss.create(pos, this.map.scalingFactor - 1, speedMult);
		this.physics.add.collider(this.boss.sprite, this.map.platforms);
		this.physics.add.collider(this.boss.sprite, this.map.platformObjects);
		this.physics.add.overlap(
			this.player.sprite,
			this.boss.sprite,
			() => this.handleBossTouch()
		);
		this.boss.onComplete = () => void this.winLevel();
	}

	private handleBossTouch() {
		if (this.boss.isDead || this.time.now < this.invincibleUntil || this.finishing) return;
		const playerBottom = this.player.sprite.body.bottom;
		const playerPrevBottom = this.playerPrevBottom;
		const bossTop = this.boss.sprite.body.top;
		if (playerBottom <= bossTop + 12 && playerPrevBottom <= bossTop + 6) {
			// stomp!
			const killed = this.boss.stomp();
			this.player.sprite.setVelocityY(-450);
			this.score += 100;
			this.hud.setScore(this.score);
			this.sfx.play('sfx_stomp');
			if (killed) {
				this.score += 250; // kill bonus
				this.hud.setScore(this.score);
			}
		} else {
			this.loseHeart();
		}
	}

	private winLevel() {
		if (this.finishing) return;
		this.finishing = true;
		this.sfx.play('sfx_win');
		this.player.toggleFreeze(true);
		const w = this.scale.width;
		const banner = this.add
			.text(this.cameras.main.midPoint.x, this.cameras.main.midPoint.y, 'LEVEL COMPLETE!', {
				fontFamily: 'Arcade',
				fontSize: `${Math.round(w / 24)}px`,
				color: '#ffe98a',
				stroke: '#2b3f8e',
				strokeThickness: 6
			})
			.setOrigin(0.5)
			.setDepth(80)
			.setScrollFactor(0);
		this.time.delayedCall(2200, () => {
			banner.destroy();
			this.finishing = false;
			if (this.level >= 3) {
				this.scene.start('WinScene', { score: this.score });
				return;
			}
			this.level += 1;
			this.scene.restart({ level: this.level, score: this.score });
		}, [], this);
	}

	private spawnEnemies() {
		// derive enemy spots from tilemap surface, spaced apart from coin columns
		const positions = this.map.getEnemyPositions();
		// difficulty scaling: enemies get faster each level
		const speedMult = 1 + (this.level - 1) * 0.25; // L1:1.0 L2:1.25 L3:1.5
		positions.forEach(pos => {
			const enemy = new Enemy({ scene: this, position: pos, speedMultiplier: speedMult });
			enemy.create(pos, this.map.scalingFactor - 1);
			enemy.mirrorPlayer = true;
			enemy.hasGroundAt = (x: number, y: number) => {
				const col = Math.floor(x / this.map.scalingFactor / 16);
				const row = Math.floor(y / this.map.scalingFactor / 16);
				return this.map.platforms.hasTileAt(col, row);
			};
			this.enemies.push(enemy);
			this.physics.add.collider(enemy.sprite, this.map.platforms);
			this.physics.add.collider(enemy.sprite, this.map.platformObjects);
			this.physics.add.overlap(
				this.player.sprite,
				enemy.sprite,
				() => this.handleEnemyTouch(enemy)
			);
		});
	}

	private handleEnemyTouch(enemy: Enemy) {
		if (enemy.isDead || this.time.now < this.invincibleUntil) return;
		const result = enemy.interact(
			this.player.sprite.body.bottom,
			this.playerPrevBottom
		);
		if (result === 'stomp') {
			this.score += 50;
			this.hud.setScore(this.score);
			this.sfx.play('sfx_stomp');
			// bounce player off the squashed slime
			this.player.sprite.setVelocityY(-450);
		} else {
			this.loseHeart();
		}
	}

	private loseHeart(fromPit: boolean = false) {
		if (this.gameOver || this.lives <= 0) return;
		this.lives -= 1;
		this.hud.setLives(this.lives);
		if (!fromPit) {
			this.sfx.play('sfx_hurt');
			this.invincibleUntil = this.time.now + 1500;
			this.cameras.main.shake(120, 0.008);
			this.player.sprite.setTint(0xff6b6b);
			this.time.delayedCall(400, () => {
				if (this.player.sprite.active) this.player.sprite.clearTint();
			}, [], this);
		}
		if (this.lives <= 0) {
			this.gameOver = true;
			this.sfx.play('sfx_gameover');
			this.time.delayedCall(400, () => {
				this.scene.start('GameOverScene', {
					score: this.score,
					level: this.level
				});
			}, [], this);
			return;
		}
	}

	/** fell into a pit: -1 heart, respawn at start position, keep score & coins */
	private async handleFallOut() {
		await this.loseHeartAsync(true);
	}

	private loseHeartAsync(fromPit: boolean): Promise<void> {
		return new Promise(resolve => {
			this.loseHeart(fromPit);
			if (!this.gameOver && this.lives > 0) {
				// respawn at start position without recreating the scene
				const pos = this.map.getStartPosition();
				this.player.sprite.setPosition(pos.x, pos.y - this.player.sprite.displayHeight);
				this.player.sprite.setVelocity(0, 0);
				this.player.sprite.setVisible(true);
				this.cameras.main.startFollow(this.player.sprite);
			}
			resolve();
		});
	}

	/** hearts row in HUD */
	// (rendered by Hud via setLives)

	public get currentLevel(): number {
		return this.level;
	}

	private spawnCoins() {
		Coin.ensureAnimation(this);
		this.map.getCoinPositions().forEach(pos => {
			const coin = new Coin({ scene: this });
			const sprite = coin.create(pos, Math.max(1, this.map.scalingFactor - 1));
			this.coins.push(coin);
			this.physics.add.overlap(this.player.sprite, sprite, () => {
				if (coin.isCollected) return;
				coin.collect();
				this.score += 10;
				this.hud.setScore(this.score);
				this.sfx.play('sfx_coin');
			});
		});
	}

	public update(time: number, delta: number) {
		this.map.update();
		this.player.update();
		this.playerPrevBottom = this.player.sprite.body.bottom;
		// facing = last direction the character looked (flipX persists while standing)
		const facing = this.player.sprite.flipX ? -1 : 1;
		this.enemies.forEach(e => {
			e.setPlayerFacing(facing);
			e.update();
		});
		if (this.boss && !this.boss.isDead) this.boss.update();
	}

	private addColliders() {
		this.physics.add.collider(this.map.platforms, this.player.sprite);
		this.physics.add.collider(this.map.platformObjects, this.player.sprite);
	}


}
