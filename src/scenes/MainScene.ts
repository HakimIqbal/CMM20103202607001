import { Dialog, Hud, LevelMap, LevelSprite } from '@src/components';
import { LoveChest } from '@src/components';
import { Coin } from '@src/entities/Coin';
import { Enemy } from '@src/entities/Enemy';
import { Sfx } from '@src/components/Sfx';
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
	private sfx!: Sfx;
	private chest!: LoveChest;
	private level: number = 1;
	private finishing: boolean = false;
	private musicPlaylist: MusicPlaylist;

	constructor() {
		super({ key: 'MainScene' });
	}

	public init(data: { level?: number; score?: number }) {
		if (data && data.level) this.level = data.level;
		if (data && data.score) this.score = data.score;

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
		this.chest = new LoveChest({ scene: this });
		this.chest.preload();
		this.sfx = new Sfx({ scene: this });
		this.sfx.preload();
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
		this.sfx.create();
		this.spawnGoalChest();
	}

	/**
	 * Level goal (Step 3 of the plan): the love chest sits on the last
	 * solid column. Touching it wins the level -> WinScene with final score.
	 */
	private spawnGoalChest() {
		// Player request: chest goes LEFT of the rock decorations, on clean
		// grass. Scan left from the edge and take the first clean column
		// that also has at least one clean column before the rocks begin
		// (so the chest never hugs either the rocks or the wall).
		const col = this.map.getGoalColumn();
		const row = this.map.getSurfaceRow(col);
		const scale = this.map.scalingFactor - 1;
		const x = col * 16 * this.map.scalingFactor + 8 * this.map.scalingFactor;
		// Chest at world scale (2x) was 128px — bigger than the player and
		// it read as a boss prop. 0.75x of that (~96px, slightly wider than
		// the player) keeps it "important goal" without the comedy size.
		const chestScale = scale * 0.75;
		// Frame is 64x64. Sit the BOTTOM edge on the ground line:
		// centerY = groundTop - displayHeight/2.
		const groundTopY = this.map.platforms.y + row * 16 * this.map.scalingFactor;
		// Sink slightly INTO the grass line: the tile art draws grass tufts
		// above the collision surface, so an exact bottom-on-line chest
		// reads as floating. A few px of overlap grounds it visually.
		const sinkPx = 6 * scale;
		const y = groundTopY - (64 * chestScale) / 2 + sinkPx;
		const sprite = this.add.sprite(x, y, 'loveChest') as unknown as LevelSprite;
		sprite.setScale(chestScale);
		sprite.setDepth(46);
		this.physics.add.existing(sprite, true); // static body for overlap only
		this.chest.create({ sprite });
		// OPEN = JUMP ON TOP of the chest (stomp), same rule as killing a
		// slime: land from above with your previous frame's bottom above
		// the chest top. Walking into it does nothing.
		const zone = this.add.zone(x, y - 20 * scale, 120 * scale, 60 * scale);
		this.physics.add.existing(zone, true);
		this.physics.add.overlap(this.player.sprite, zone, () => {
			if (this.finishing || this.gameOver) return;
			const pbody = this.player.sprite.body;
			const zbody = zone.body as Phaser.Physics.Arcade.StaticBody;
			const landed =
				this.playerPrevBottom <= zbody.top + 14 &&
				pbody.bottom >= zbody.top;
			if (!landed) return;
			void this.winLevel();
		});
		// interaction hint floats above the chest
		const hint = this.add
			.text(x, y - 70 * scale, 'JUMP ON TOP!', {
				fontFamily: 'Arcade',
				fontSize: `${Math.round(11 * scale)}px`,
				color: '#ffffff',
				stroke: '#2b3f8e',
				strokeThickness: 4
			})
			.setOrigin(0.5)
			.setDepth(60);
		this.tweens.add({
			targets: hint,
			alpha: 0.25,
			duration: 700,
			yoyo: true,
			repeat: -1
		});
	}

	private async winLevel() {
		if (this.finishing || this.gameOver) return;
		this.finishing = true;
		// stop all motion BEFORE freezing — momentum would otherwise carry
		// the frozen player off the last column into the void (map edge).
		this.player.sprite.setVelocity(0, 0);
		this.player.sprite.body.stop();
		this.player.toggleFreeze(true);
		// the win is EARNED at touch: no enemy may hurt the player during
		// the celebration window (a patrolling slime near the chest would
		// otherwise drain hearts mid-confetti and steal the victory).
		this.invincibleUntil = Number.MAX_SAFE_INTEGER;
		// celebratory banner right above the chest — the moment should SAY
		// something, not just sparkle.
		const w = this.scale.width;
		const banner = this.add
			.text(
				this.cameras.main.midPoint.x,
				this.cameras.main.midPoint.y - 120,
				'YOU WIN! ❤',
				{
					fontFamily: 'Arcade',
					fontSize: `${Math.round(w / 16)}px`,
					color: '#ffe98a',
					stroke: '#2b3f8e',
					strokeThickness: Math.max(4, Math.round(w / 160))
				}
			)
			.setOrigin(0.5)
			.setDepth(90)
			.setScrollFactor(0);
		this.tweens.add({
			targets: banner,
			scale: { from: 0.6, to: 1 },
			duration: 350,
			ease: 'Back.easeOut'
		});
		try {
			await this.chest.open(5);
		} catch (e) {
			// celebration is cosmetic — the win must never get stuck
			console.warn('chest.open failed, continuing to WinScene', e);
		}
		this.time.delayedCall(400, () => {
			this.scene.start('WinScene', { score: this.score });
		}, [], this);
	}

	private spawnEnemies() {
		// derive enemy spots from tilemap surface, spaced apart from coin columns
		const positions = this.map.getEnemyPositions();
		positions.forEach(pos => {
			const enemy = new Enemy({ scene: this, position: pos });
			enemy.create(pos, this.map.scalingFactor - 1);
			enemy.mirrorPlayer = true; // aggro switch (kept name)
			// BIG slimes split into 3 minis when stomped (spec: STEP 2)
			enemy.onStomped = (slime) => this.splitSlime(slime);
			enemy.hasGroundAt = (x: number, y: number) => {
				// World -> tile conversion must use the LAYER's scale
				// (map.scalingFactor = 3, not the enemy sprite scale = 2)
				// and undo the layer's Y shift (layer.y = -(mapH - sceneH)).
				const layerScale = this.map.scalingFactor;
				const layerY = this.map.platforms.y;
				const col = Math.floor(x / layerScale / 16);
				const row = Math.floor((y - layerY) / layerScale / 16);
				return this.map.platforms.hasTileAt(col, row);
			};
			this.enemyHasGroundAt = enemy.hasGroundAt;
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

	/**
	 * STEP 2: a stomped BIG slime bursts into 3 mini slimes that spawn in a
	 * fan (left / center / right) around the split point. Minis inherit the
	 * same ground/ledge rules; their chase behavior is tuned in makeMini.
	 */
	private splitSlime(slime: Enemy): void {
		if (slime.isMini) return; // only big slimes split
		const scale = this.map.scalingFactor - 1;
		const cx = slime.sprite.x;
		const cy = slime.sprite.y;
		// Wider fan + slight vertical pop so the burst reads clearly and the
		// minis scatter around the player instead of clustering on one spot.
		const offsets = [
			{ dx: -64, dy: -30 },
			{ dx: 0, dy: -46 },
			{ dx: 64, dy: -30 }
		];
		for (const off of offsets) {
			const mini = new Enemy({ scene: this, position: { x: cx + off.dx, y: cy + off.dy } });
			mini.create({ x: cx + off.dx, y: cy + off.dy }, scale * 0.6);
			mini.makeMini(scale * 0.75);
			mini.mirrorPlayer = true;
			mini.hasGroundAt = this.enemyHasGroundAt;
			mini.onStomped = undefined; // minis do NOT split further
			this.physics.add.collider(mini.sprite, this.map.platforms);
			this.physics.add.collider(mini.sprite, this.map.platformObjects);
			this.physics.add.overlap(
				this.player.sprite,
				mini.sprite,
				() => this.handleEnemyTouch(mini)
			);
			this.enemies.push(mini);
		}
	}

	/** shared ground probe for every enemy (big or mini) */
	private enemyHasGroundAt?: (x: number, y: number) => boolean;

	private handleEnemyTouch(enemy: Enemy) {
		if (enemy.isDead || this.time.now < this.invincibleUntil) return;
		const result = enemy.interact(
			this.player.sprite.body.bottom,
			this.playerPrevBottom
		);
		if (result === 'stomp') {
			this.score += 50;
			this.hud.setScore(this.score);
			this.sfx.play('sfx_stomp');
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
			this.sfx.play('sfx_hurt');
			this.invincibleUntil = this.time.now + 1500;
			this.cameras.main.shake(120, 0.008);
			this.player.sprite.setTint(0xff6b6b);
			this.time.delayedCall(400, () => {
				if (this.player.sprite.active) this.player.sprite.clearTint();
			}, [], this);
		}
		if (this.lives <= 0) {
			this.gameOver = true;
			this.sfx.play('sfx_gameover');
			this.time.delayedCall(400, () => {
				this.scene.start('GameOverScene', {
					score: this.score,
					level: this.level
				});
			}, [], this);
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

	public get currentLevel(): number {
		return this.level;
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
				this.sfx.play('sfx_coin');
			});
		});
	}

	public update(time: number, delta: number) {
		this.map.update();
		this.player.update();
		if (this.chest) this.chest.update();
		this.playerPrevBottom = this.player.sprite.body.bottom;
		// facing = last direction the character looked (flipX persists while standing)
		this.enemies.forEach(e => {
			e.setPlayerPos(this.player.sprite.x, this.player.sprite.y);
			e.update();
		});
	}

	private addColliders() {
		this.physics.add.collider(this.map.platforms, this.player.sprite);
		this.physics.add.collider(this.map.platformObjects, this.player.sprite);
	}


}
