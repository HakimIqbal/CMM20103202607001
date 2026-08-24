import { LevelScene } from '@src/scenes';
import { LevelBackground } from './LevelBackground';

export class LevelMap {
	public platforms: Phaser.Tilemaps.DynamicTilemapLayer;
	public platformObjects: Phaser.Tilemaps.DynamicTilemapLayer;
	public map: Phaser.Tilemaps.Tilemap;
	private startPosition: LevelObject;
	private coinPositions: Vector2Like[] = [];
	private enemyPositions: Vector2Like[] = [];
	private objectsLayer: Phaser.Tilemaps.ObjectLayer;
	private scene: LevelScene;
	private tiles: Phaser.Tilemaps.Tileset;
	private background: LevelBackground;
	private scaling: number = 3;

	constructor({ scene }: { scene: LevelScene }) {
		this.scene = scene;
		this.background = new LevelBackground({ scene });
	}

	public preload() {
		// Cache-busted URLs: these files change content between deploys while
		// keeping the same path — browsers may serve stale copies forever.
		this.scene.load.image('tiles', 'assets/tilemaps/extruded.png?v=24087');
		this.scene.load.tilemapTiledJSON('map', 'assets/tilemaps/base.json?v=24087');
		this.background.preload();
	}

	public create() {
		this.scene.cameras.main.setBackgroundColor('#448AFF');
		this.map = this.scene.make.tilemap({ key: 'map' });
		this.tiles = this.map.addTilesetImage('atlas', 'tiles', 16, 16, 1, 2);
		this.platforms = this.createLayer('platforms');
		this.platforms.setDepth(50);
		this.platformObjects = this.createLayer('platform_objects');
		this.platformObjects.setDepth(45);
		this.background.create({
			width: this.platforms.displayWidth,
			height: this.platforms.displayHeight
		});
		this.objectsLayer = this.map.getObjectLayer('objects');
		this.computeCoinPositions();
		this.computeEnemyPositions();
		this.startPosition = this.getObject('startPosition');

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

	/**
	 * Re-anchor every tilemap layer to the CURRENT scene height.
	 *
	 * Chrome/Brave fire a window resize AFTER the scene boots (bookmark bar,
	 * zoom, devtools). createLayer() anchors layers once at boot; without a
	 * re-anchor, layer.y keeps a stale value while the viewport moves.
	 */
	public refreshAnchors(): void {
		const h = this.scene.height;
		const layers: Phaser.Tilemaps.DynamicTilemapLayer[] = [
			this.platforms,
			this.platformObjects
		];
		layers.forEach(layer => {
			layer.y = h - layer.displayHeight;
		});
	}

	public getStartPosition(): Vector2Like {
		const { displayX, displayY } = this.startPosition;
		return { x: displayX, y: displayY };
	}

	/**
	 * Derive coin spawn points: every ground/platform column top gets a coin
	 * floating 3 tiles above it, skipping the immediate start area. Deterministic.
	 */
	private computeCoinPositions(): void {
		const mapW = this.map.width;
		const step = 9; // one coin every N columns
		for (let x = 6; x < mapW - 4; x += step) {
			const surfaceRow = this.findSurfaceRow(x);
			if (surfaceRow == null) continue;
			const displayX = x * 16 * this.scaling + 8 * this.scaling;
			const displayY =
				(this.scene.height - this.platforms.displayHeight) +
				(surfaceRow - 3) * 16 * this.scaling;
			this.coinPositions.push({ x: displayX, y: displayY });
		}
	}

	private findSurfaceRow(col: number): number | null {
		for (let row = 0; row < this.map.height; row++) {
			if (this.platforms.hasTileAt(col, row)) return row;
		}
		return null;
	}

	/**
	 * Enemy spawn points: ground columns between coin spots, standing ON the surface.
	 */
	private computeEnemyPositions(): void {
		const mapW = this.map.width;
		const step = 14;
		for (let x = 12; x < mapW - 6; x += step) {
			const surfaceRow = this.findSurfaceRow(x);
			if (surfaceRow == null) continue;
			const displayX = x * 16 * this.scaling + 8 * this.scaling;
			const displayY =
				(this.scene.height - this.platforms.displayHeight) +
				(surfaceRow - 1) * 16 * this.scaling;
			this.enemyPositions.push({ x: displayX, y: displayY });
		}
	}

	public getEnemyPositions(): Vector2Like[] {
		return this.enemyPositions;
	}

	public get scalingFactor(): number {
		return this.scaling;
	}

	public getCoinPositions(): Vector2Like[] {
		return this.coinPositions;
	}

	public getObject(name: string): LevelObject {
		return this.getObjects(name)[0];
	}

	public getObjects(name: string): LevelObject[] {
		const objects = this.objectsLayer.objects.filter(
			o => o.name === name
		) as LevelObject[];

		objects.forEach(o => Object.assign(o, this.scaleObject(o)));
		return objects;
	}

	public scaleObject(obj: LevelObject) {
		return {
			displayX: obj.x * this.scaling,
			displayY:
				this.scene.height - this.platforms.displayHeight + obj.y * this.scaling,
			displayWidth: obj.width * this.scaling,
			displayHeight: obj.height * this.scaling
		};
	}

	private createLayer(name: string): Phaser.Tilemaps.DynamicTilemapLayer {
		const layer = this.map.createDynamicLayer(name, this.tiles, 0, 0);
		layer.setScale(this.scaling);
		layer.y = this.scene.height - layer.displayHeight;
		layer.setCollisionFromCollisionGroup();
		return layer;
	}
}
