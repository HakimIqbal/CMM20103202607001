import { LevelScene } from '@src/scenes';

type PhSprite = Phaser.Physics.Arcade.Sprite & {
	body: Phaser.Physics.Arcade.StaticBody;
};

/**
 * Static spike hazard — TILEMAP-NATIVE rendering.
 *
 * The wood-brown spike graphic is baked INTO extruded.png (frame 288) and
 * drawn by the platform_objects layer itself. The tilemap can never
 * mis-place its own tiles relative to the terrain, so floating spikes are
 * structurally impossible.
 *
 * This entity's only jobs:
 *  1. find marker tiles (gid 289 = frame index 288),
 *  2. drop markers whose column has no ground below (pit edges),
 *  3. attach a small static body at each remaining tile's exact position.
 */
export class Spikes {
	private scene: LevelScene;
	private bodies: PhSprite[] = [];
	// Frame 288 = wood-brown spike baked into extruded.png (gid 289 in JSON).
	public static readonly TILE_INDEX = 288;

	constructor({ scene }: { scene: LevelScene }) {
		this.scene = scene;
	}

	/** A spike is grounded when its column has solid ground within 2 tiles below. */
	private static hasGroundBelowCheck(found: number, row: number): boolean {
		return found >= 0 && found <= row + 2;
	}

	public create(layer: Phaser.Tilemaps.DynamicTilemapLayer, scale: number, platforms: Phaser.Tilemaps.DynamicTilemapLayer): void {
		const map = layer.tilemap;
		const spots: { col: number; row: number }[] = [];

		layer.forEachTile(tile => {
			if (tile.index - 1 !== Spikes.TILE_INDEX) return;
			spots.push({ col: tile.x, row: tile.y });
		});

		// One spike per column: when markers stack vertically (e.g. rows
		// 24+25), keep only the LOWEST one — a spike resting on another
		// spike reads as "floating above the grass".
		const lowest = new Map<number, { col: number; row: number }>();
		for (const spot of spots) {
			const cur = lowest.get(spot.col);
			if (!cur || spot.row > cur.row) lowest.set(spot.col, spot);
		}
		for (const spot of spots) {
			if (lowest.get(spot.col) !== spot) {
				layer.removeTileAt(spot.col, spot.row);
			}
		}
		const finalSpots = Array.from(lowest.values());

		for (const spot of finalSpots) {
			let found = -1;
			if (platforms) {
				for (let r = spot.row; r < map.height; r++) {
					if (platforms.hasTileAt(spot.col, r)) {
						found = r;
						break;
					}
				}
			}
			if (!Spikes.hasGroundBelowCheck(found, spot.row)) {
				// Pit edge / floating marker: remove the tile so the map
				// does not draw a spike with nothing under it.
				layer.removeTileAt(spot.col, spot.row);
				continue;
			}
			// Snap the TILE itself to the row directly above its ground.
			const targetRow = found - 1;
			if (targetRow !== spot.row) {
				layer.removeTileAt(spot.col, spot.row);
				layer.putTileAt(Spikes.TILE_INDEX + 1, spot.col, targetRow);
			}

			const worldX = spot.col * 16 * scale + 8 * scale;
			const worldY =
				spot.row * 16 * scale + 8 * scale + (layer.y || 0);
			const b = this.scene.physics.add.staticImage(
				worldX,
				worldY,
				'__DEFAULT'
			) as unknown as PhSprite;
			b.setVisible(false); // visuals handled entirely by the tilemap
			b.body.setSize(14, 18, 17, 28);
			this.bodies.push(b);
		}
	}

	public get sprites(): PhSprite[] {
		return this.bodies;
	}
}
