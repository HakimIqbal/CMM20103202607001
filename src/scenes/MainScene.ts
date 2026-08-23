import { Dialog, DoorState, Hud, LevelMap, LevelSprite } from '@src/components';
/* NOTE: door/loveChest systems temporarily disabled for Step 2 testing.
   Will be reintroduced as the level goal in Step 3. */
import { Coin } from '@src/entities/Coin';
import { Enemy } from '@src/entities/Enemy';
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
	private musicPlaylist: MusicPlaylist;

	constructor() {
		super({ key: 'MainScene' });

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
	}

	public create() {
		super.create();
		this.map.create();
		this.player.create({ position: this.map.getStartPosition() });
		this.player.onFallOut = () => void this.handleFallOut();
		this.addColliders();
		this.spawnCoins();
		this.spawnEnemies();
		this.hud = new Hud({ scene: this });
		this.hud.create();
		this.hud.setLives(this.lives);
	}

	private spawnEnemies() {
		// derive enemy spots from tilemap surface, spaced apart from coin columns
		const positions = this.map.getEnemyPositions();
		positions.forEach(pos => {
			const enemy = new Enemy({ scene: this, position: pos });
			enemy.create(pos, this.map.scalingFactor - 1);
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
			this.invincibleUntil = this.time.now + 1500;
			this.cameras.main.shake(120, 0.008);
			this.player.sprite.setTint(0xff6b6b);
			this.time.delayedCall(400, () => {
				if (this.player.sprite.active) this.player.sprite.clearTint();
			}, [], this);
		}
		if (this.lives <= 0) {
			this.gameOver = true; // block further callbacks during restart
			this.time.delayedCall(300, () => this.scene.restart(), [], this);
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
			});
		});
	}

	public update(time: number, delta: number) {
		this.map.update();
		this.player.update();
		this.playerPrevBottom = this.player.sprite.body.bottom;
		this.enemies.forEach(e => e.update());
	}

	private addColliders() {
		this.physics.add.collider(this.map.platforms, this.player.sprite);
		this.physics.add.collider(this.map.platformObjects, this.player.sprite);
	}


}
