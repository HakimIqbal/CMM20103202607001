import { Dialog, DoorState, Hud, LevelMap, LevelSprite } from '@src/components';
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

	private loseHeart() {
		if (this.lives <= 0) return;
		this.lives -= 1;
		this.hud.setLives(this.lives);
		this.invincibleUntil = this.time.now + 1500;
		// red flash + knockback
		this.cameras.main.shake(120, 0.008);
		this.player.sprite.setTint(0xff6b6b);
		this.time.delayedCall(400, () => {
			if (this.player.sprite.active) this.player.sprite.clearTint();
		}, [], this);
		if (this.lives <= 0) {
			// Step 4 will replace this with a Game Over screen; for now restart level
			this.scene.restart();
		}
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
		this.physics.add.collider(this.map.doors.sprites, this.player.sprite);

		this.physics.add.collider(
			this.map.doors.questionAreas,
			this.player.sprite,
			this.handlePlayerCollidesQuestion
		);

		this.physics.add.collider(
			this.map.doors.loveChest.sprite,
			this.player.sprite,
			this.handlePlayerCollidesChest
		);
	}

	private handlePlayerCollidesQuestion = async (
		question: Phaser.GameObjects.GameObject
	) => {
		if (this.dialog.isOpened) return;

		const area = question as LevelSprite;
		const index = +area.levelObject.type;
		const door = this.map.doors.sprites[index];
		if (door.state === DoorState.opened) return;

		area.body.checkCollision.none = true;
		this.player.toggleFreeze(true);
		const count = await this.dialog.openDialog(index);
		this.map.doors.openDoor(door);
		this.player.toggleFreeze(false);

		if (typeof count === 'number') {
			this.giftsCount = count;
		}
	}

	private handlePlayerCollidesChest = async () => {
		await this.map.doors.loveChest.open(this.giftsCount);
	}
}
