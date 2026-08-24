import { Dialog, Hud, LevelMap, LevelSprite } from '@src/components';
/* NOTE: loveChest system temporarily disabled for Step 2 testing.
   Will be reintroduced as the level goal in Step 3. */
import { Coin } from '@src/entities/Coin';
import { Enemy } from '@src/entities/Enemy';
import { Spikes } from '@src/entities/Spikes';
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
		this.map = new LevelMap({ scene: this });
		this.musicPlaylist = new MusicPlaylist();
		this.musicPlaylist.play();
	}

	public preload() {
		super.preload();
		this.map.preload();
		this.player.preload();
		new Coin({ scene: this }).preload();
		new Enemy({ scene: this, position: { x: 0, y: 0 } }).preload();
		new Spikes({ scene: this }).preload();
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
		this.hud = new Hud({ scene: this });
		this.hud.create();
		this.hud.setLives(this.lives);
		this.sfx.create();
	}

	/** spike tiles: overlap = -1 heart; respects invincibility window */
	private spikes: Spikes;

	private spawnSpikes() {
		if (!this.spikes) this.spikes = new Spikes({ scene: this });
		this.spikes.create(this.map.spikeLayer, this.map.scalingFactor, this.map.platforms);
		for (const s of this.spikes.sprites) {
			this.physics.add.overlap(this.player.sprite, s, () => {
				if (this.gameOver || this.time.now < this.invincibleUntil) return;
				this.loseHeart();
			});
		}
	}

	private spawnEnemies() {
		// derive enemy spots from tilemap surface, spaced apart from coin columns
		const positions = this.map.getEnemyPositions();
		positions.forEach(pos => {
			const enemy = new Enemy({ scene: this, position: pos });
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
	}

	private addColliders() {
		this.physics.add.collider(this.map.platforms, this.player.sprite);
		this.physics.add.collider(this.map.platformObjects, this.player.sprite);
	}


}
