import { LevelBackground } from './LevelBackground';
import { LevelScene } from '@src/scenes';

/**
 * Loads one of the level tilemaps (level1..level3) and exposes spawn points.
 * Same tileset/atlas and parallax background as the original game.
 */
export class LevelMap {
	public platforms: Phaser.Tilemaps.DynamicTilemapLayer;
	public platformObjects: Phaser.Tilemaps.DynamicTilemapLayer;
	public map: Phaser.Tilemaps.Tilemap;
	public doorPosition: { x: number; y: number } = { x: 0, y: 0 };
	private startPosition: LevelObject;
	private coinPositions: Vector2Like[] = [];
	private enemyPositions: Vector2Like[] = [];
	private scene: LevelScene;
	private levelKey: string;
	private background: LevelBackground;
	private scaling: number = 3;

	constructor({ scene, levelKey }: { scene: LevelScene; levelKey: string }) {
		this.scene = scene;
		this.levelKey = levelKey;
		this.background = new LevelBackground({ scene });
	}

	public preload() {
		this.scene.load.image('tiles', 'assets/tilemaps/extruded.png');
		this.scene.load.tilemapTiledJSON(this.levelKey, `assets/tilemaps/${this.levelKey}.json`);
		this.background.preload();
	}

	public create() {
		this.scene.cameras.main.setBackgroundColor('#448AFF');
		this.map = this.scene.make.tilemap({ key: this.levelKey });
		const tiles = this.map.addTilesetImage('atlas', 'tiles', 16, 16, 1, 2);
		this.platforms = this.map.createDynamicLayer('platforms', tiles);
		this.platforms.setScale(this.scaling);
		this.platforms.setDepth(50);
		this.platformObjects = this.map.createDynamicLayer('platform_objects', tiles);
		this.platformObjects.setScale(this.scaling);
		this.platformObjects.setDepth(45);
		// collisions: any non-empty tile is solid
		this.platforms.setCollisionByExclusion([-1]);
		this.platformObjects.setCollisionByExclusion([-1]);

		this.background.create({
			width: this.platforms.displayWidth,
			height: this.platforms.displayHeight
		});

		const objects = this.map.getObjectLayer('objects');
		objects.objects.forEach(o => {
			const tiled = o as any;
			const dx: number = tiled.x * this.scaling;
			const dy: number = tiled.y * this.scaling;
			if (tiled.name === 'startPosition') {
				this.startPosition = { displayX: dx, displayY: dy } as LevelObject;
			}
			if (tiled.name === 'coin') this.coinPositions.push({ x: dx, y: dy });
			if (tiled.name === 'enemy') this.enemyPositions.push({ x: dx, y: dy });
			if (tiled.name === 'door') this.doorPosition = { x: dx, y: dy };
		});

		this.scene.physics.world.setBounds(
			0,
			0,
			this.platforms.displayWidth,
			this.scene.height
		);
		this.scene.cameras.main.setBounds(
			0,
			0,
			this.platforms.displayWidth,
			this.scene.height
		);
	}

	public update() {
		this.background.update();
	}

	public getStartPosition(): Vector2Like {
		return { x: this.startPosition.displayX, y: this.startPosition.displayY };
	}

	public getCoinPositions(): Vector2Like[] {
		return this.coinPositions;
	}

	public getEnemyPositions(): Vector2Like[] {
		return this.enemyPositions;
	}

	public get width(): number {
		return this.platforms.displayWidth;
	}
}
