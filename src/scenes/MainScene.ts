import { Dialog, DoorState, Hud, LevelMap, LevelSprite } from '@src/components';
import { Coin } from '@src/entities/Coin';
import { MusicPlaylist } from '@src/components/MusicPlaylist';
import { Player } from '@src/entities';

import { LevelScene } from './LevelScene';

export class MainScene extends LevelScene {
	private player: Player;
	private map: LevelMap;
	private dialog: Dialog;
	private giftsCount: number;
	private coins: Coin[] = [];
	private hud: Hud;
	private score: number = 0;
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
	}

	public create() {
		super.create();
		this.map.create();
		this.player.create({ position: this.map.getStartPosition() });
		this.addColliders();
		this.spawnCoins();
		this.hud = new Hud({ scene: this });
		this.hud.create();
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
			});
		});
	}

	public update(time: number, delta: number) {
		this.map.update();
		this.player.update();
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
