import { LevelScene } from '@src/scenes';

type PhSprite = Phaser.Physics.Arcade.Sprite & {
	body: Phaser.Physics.Arcade.Body;
};

/**
 * Static spike hazard (atlas tile 75).
 * - Rendered from tilemap 'platform_objects' layer via tile index
 * - Overlap = player loses 1 heart + upward knockback (no double-hit)
 * - Immune to stomp; purely avoidable terrain
 */
export class Spikes {
	private scene: LevelScene;
	private spikes: PhSprite[] = [];
	public static readonly TILE_INDEX = 75;

	constructor({ scene }: { scene: LevelScene }) {
		this.scene = scene;
	}

	public create(layer: Phaser.Tilemaps.DynamicTilemapLayer, scale: number): void {
		layer.forEachTile(tile => {
			if (tile.index - 1 !== Spikes.TILE_INDEX) return;
			const worldX = tile.pixelX + 8;
			const worldY = tile.pixelY + 8;
			const s = this.scene.physics.add.staticSprite(
				worldX,
				worldY,
				'tiles',
				Spikes.TILE_INDEX
			) as PhSprite;
			s.setScale(scale);
			s.setDepth(46);
			// hitbox smaller than visual — forgiving, hits only near the tip
			s.body.setSize(10, 12).setOffset(3, 4);
			s.refreshBody();
			this.spikes.push(s);
		});
	}

	public get sprites(): PhSprite[] {
		return this.spikes;
	}
}
