import { LevelScene } from '@src/scenes';

type PhSprite = Phaser.Physics.Arcade.Sprite & {
	body: Phaser.Physics.Arcade.StaticBody;
};

/**
 * Static spike hazard (wooden stake look).
 *
 * Rendering: dedicated pre-tinted PNG (spike_wood.png) generated from atlas
 * frame 256 — the tilemap's own extruded.png is a single-frame image, so
 * atlas frame indices silently fall back to __BASE there.
 *
 * Placement: JSON gids in platform_objects act as markers only. Each marker
 * is removed from the layer at runtime and snapped DOWN to the first solid
 * ground row below it, so spikes never float above dynamic terrain.
 */
export class Spikes {
	private scene: LevelScene;
	private spikes: PhSprite[] = [];
	// Frame 256 in extruded.png = symmetric spike triangle.
	public static readonly TILE_INDEX = 256;

	constructor({ scene }: { scene: LevelScene }) {
		this.scene = scene;
	}

	public preload(): void {
		this.scene.load.image('spike_wood', 'assets/sprites/spike_wood.png');
	}

	public create(
		layer: Phaser.Tilemaps.DynamicTilemapLayer,
		scale: number,
		platforms: Phaser.Tilemaps.DynamicTilemapLayer
	): void {
		const map = layer.tilemap;
		const spots: { col: number; row: number }[] = [];
		layer.forEachTile(tile => {
			if (tile.index - 1 !== Spikes.TILE_INDEX) return;
			spots.push({ col: tile.x, row: tile.y });
			layer.removeTileAt(tile.x, tile.y);
		});

		const layerYOffset = layer.y || 0;

		for (const spot of spots) {
			let row = spot.row;
			// Snap down to the first solid platform row below the marker.
			let found = -1;
			for (let r = spot.row; r < map.height; r++) {
				if (platforms.hasTileAt(spot.col, r)) {
					found = r;
					break;
				}
			}
			if (found >= 0) row = found - 1; // sit on top of that tile
			const worldX = spot.col * 16 * scale + 8 * scale;
			const worldY =
				row * 16 * scale + 8 * scale + layerYOffset;
			const s = this.scene.physics.add.staticSprite(
				worldX,
				worldY,
				'spike_wood'
			) as PhSprite;
			s.setScale(scale);
			// Depth ABOVE platforms layer (50): never covered by ground.
			s.setDepth(52);
			// Forgiving hitbox near the base. Phaser 3.16 StaticBody.setSize
			// takes WORLD pixels + offset; no refreshBody() after this.
			s.body.setSize(14, 18, 17, 28);
			this.spikes.push(s);
		}
	}

	public get sprites(): PhSprite[] {
		return this.spikes;
	}
}
