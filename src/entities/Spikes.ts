import { LevelScene } from '@src/scenes';

type PhSprite = Phaser.Physics.Arcade.Sprite & {
	body: Phaser.Physics.Arcade.StaticBody;
};

/**
 * Static spike hazard.
 *
 * Rendering: uses a dedicated pre-tinted red PNG (spike_red.png) instead of
 * the atlas. Rationale: extruded.png is loaded as a single-frame image for
 * the tilemap, so atlas frame indices silently fall back to __BASE there;
 * and canvas-baked tinted textures are unreliable on the old WebGL pipeline.
 * A plain PNG asset renders correctly under both Canvas and WebGL.
 */
export class Spikes {
	private scene: LevelScene;
	private spikes: PhSprite[] = [];
	// Frame 256 in extruded.png = symmetric ice-spike triangle; the red PNG
	// is generated from that frame (gid 257 in base.json platform_objects).
	public static readonly TILE_INDEX = 256;

	constructor({ scene }: { scene: LevelScene }) {
		this.scene = scene;
	}

	public preload(): void {
		this.scene.load.image('spike_red', 'assets/sprites/spike_red.png');
	}
	public create(layer: Phaser.Tilemaps.DynamicTilemapLayer, scale: number): void {
		// Collect marker tiles first, then REMOVE them from the tilemap so
		// the map does not draw its own (white, untinted) triangles on top of
		// our sprites. The JSON gids act purely as placement markers.
		const spots: { px: number; py: number }[] = [];
		layer.forEachTile(tile => {
			if (tile.index - 1 !== Spikes.TILE_INDEX) return;
			spots.push({ px: tile.pixelX, py: tile.pixelY });
		});
		for (const s of spots) {
			layer.removeTileAt(s.px / 16, s.py / 16);
		}
		// Tile coords are unscaled 16px units. The tilemap layers are
		// shifted UP by (mapHeight - sceneHeight) = -720px so their bottom
		// aligns with the viewport; sprites must apply the same offset or
		// they render one screen lower than the visual terrain.
		const layerYOffset = layer.y || 0;
		for (const spot of spots) {
			const worldX = spot.px * scale + 8 * scale;
			const worldY = spot.py * scale + 8 * scale + layerYOffset;
			const s = this.scene.physics.add.staticSprite(
				worldX,
				worldY,
				'spike_red'
			) as PhSprite;
			s.setScale(scale);
			// Depth ABOVE platforms layer (50): spikes must never be covered by ground.
			s.setDepth(52);
			// Forgiving hitbox: small box near the base of the spike, far
			// smaller than the 48px visual. Phaser 3.16 StaticBody.setSize
			// takes WORLD pixels + offset. Do NOT call refreshBody() after
			// this — it re-derives the body from display size.
			s.body.setSize(14, 18, 17, 28);
			this.spikes.push(s);
		}
	}

	public get sprites(): PhSprite[] {
		return this.spikes;
	}
}
