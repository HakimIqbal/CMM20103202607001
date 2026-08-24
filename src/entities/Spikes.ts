import { LevelScene } from '@src/scenes';

type PhSprite = Phaser.Physics.Arcade.Sprite & {
	body: Phaser.Physics.Arcade.StaticBody;
};

/**
 * Static spike hazard.
 *
 * IMPORTANT: the tilemap loads extruded.png via load.image(), which yields
 * ONE frame covering the whole 576x576 texture. Using that key with a frame
 * index makes Phaser fall back to __BASE — rendering the ENTIRE atlas per
 * spike and sizing physics bodies to 1728x1728 (instant death at spawn).
 * We therefore load the same PNG separately as a real 16x16 spritesheet
 * (extruded layout: margin 1, spacing 2) and use frames from that key.
 */
export class Spikes {
	private scene: LevelScene;
	private spikes: PhSprite[] = [];
	// Frame 256 = clean symmetric ice-spike triangle in extruded.png.
	public static readonly TILE_INDEX = 256;
	public static readonly TEXTURE_KEY = 'tiles_frames';

	constructor({ scene }: { scene: LevelScene }) {
		this.scene = scene;
	}

	public preload(): void {
		this.scene.load.spritesheet(Spikes.TEXTURE_KEY, 'assets/tilemaps/extruded.png', {
			frameWidth: 16,
			frameHeight: 16,
			margin: 1,
			spacing: 2
		});
	}

	public create(layer: Phaser.Tilemaps.DynamicTilemapLayer, scale: number): void {
		layer.forEachTile(tile => {
			if (tile.index - 1 !== Spikes.TILE_INDEX) return;
			// Tile coords are in unscaled 16px units — multiply by the map
			// scaling factor, same convention as enemy/coin placement.
			const worldX = tile.pixelX * scale + 8 * scale;
			const worldY = tile.pixelY * scale + 8 * scale;
			const s = this.scene.physics.add.staticSprite(
				worldX,
				worldY,
				Spikes.TEXTURE_KEY,
				Spikes.TILE_INDEX
			) as PhSprite;
			s.setScale(scale);
			s.setDepth(46);
			// Forgiving hitbox: small box near the base of the spike, far
			// smaller than the 48px visual. Phaser 3.16 StaticBody.setSize
			// takes WORLD pixels + offset. Do NOT call refreshBody() after
			// this — it re-derives the body from display size (1728px bug).
			s.body.setSize(14, 18, 17, 28);
			this.spikes.push(s);
		});
	}

	public get sprites(): PhSprite[] {
		return this.spikes;
	}
}
