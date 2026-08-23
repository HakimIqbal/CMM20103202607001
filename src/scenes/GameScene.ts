import { LevelBackground, LevelMap } from '@src/components';
import { Coin } from '@src/entities/Coin';
import { Enemy } from '@src/entities/Enemy';
import { Player } from '@src/entities/Player';
import { LevelScene } from './LevelScene';
import { Hud } from '@src/components/Hud';
import { sleep } from '@src/utils';

type PhSprite = Phaser.Physics.Arcade.Sprite;

/**
 * Core gameplay scene. Runs one level (1..3):
 * collect coins, stomp slimes, reach the door at the end.
 * 3 hearts, pit fall or enemy touch = -1 heart.
 */
export class GameScene extends LevelScene {
	public player: Player;
	private map: LevelMap;
	private hud: Hud;
	private coins: Coin[] = [];
	private enemies: Enemy[] = [];
	private door: PhSprite;
	private level: number = 1;
	private score: number = 0;
	private lives: number = 3;
	private transitioning: boolean = false;
	private playerPrevBottom: number = 0;
	private sfx: { [key: string]: Phaser.Sound.BaseSound } = {};

	constructor() {
		super({ key: 'GameScene' });
	}

	public init(data: { level?: number; score?: number; lives?: number }) {
		this.level = (data.level != null ? data.level : 1);
		this.score = (data.score != null ? data.score : 0);
		this.lives = (data.lives != null ? data.lives : 3);
	}

	public preload() {
		super.preload();
		this.map = new LevelMap({ scene: this, levelKey: `level${this.level}` });
		this.player = new Player({ scene: this });
		this.hud = new Hud({ scene: this });
		this.map.preload();
		this.player.preload();
		this.hud.preload();
		new Coin({ scene: this }).preload();
		new Enemy({ scene: this, position: { x: 0, y: 0 } }).preload();
		this.load.audio('sfx_coin', 'assets/audio/sfx_coin.ogg');
		this.load.audio('sfx_stomp', 'assets/audio/sfx_stomp.ogg');
		this.load.audio('sfx_hurt', 'assets/audio/sfx_hurt.ogg');
		this.load.audio('sfx_jump', 'assets/audio/sfx_jump.ogg');
		this.load.audio('sfx_win', 'assets/audio/sfx_win.ogg');
		this.load.audio('sfx_gameover', 'assets/audio/sfx_gameover.ogg');
	}

	public create() {
		super.create();
		this.map.create();
		this.hud.create({ level: this.level, score: this.score, lives: this.lives });

		this.map
			.getCoinPositions()
			.forEach(pos => {
				const coin = new Coin({ scene: this });
				coin.createStatic();
				coin.spawn(pos);
				this.coins.push(coin);
			});

		this.map
			.getEnemyPositions()
			.forEach(pos => {
				const enemy = new Enemy({ scene: this, position: pos });
				enemy.create({ position: pos });
				this.enemies.push(enemy);
				this.physics.add.collider(enemy.sprite, this.map.platforms);
			});

		// goal door
		this.door = this.physics.add.staticSprite(
			this.map.doorPosition.x,
			this.map.doorPosition.y,
			'door'
		) as PhSprite;
		this.door.setOrigin(0, 0);
		this.door.setDepth(46);

		this.player.create({ position: this.map.getStartPosition() });
		this.player.onFallOut = () => void this.handleFallOut();

		this.physics.add.collider(this.map.platforms, this.player.sprite);
		this.physics.add.collider(this.map.platformObjects, this.player.sprite);
		this.physics.add.overlap(this.player.sprite, this.door, () =>
			void this.handleLevelComplete()
		);
		this.coins.forEach(c =>
			this.physics.add.overlap(this.player.sprite, c.sprite, () =>
				this.collectCoin(c)
			)
		);
		this.enemies.forEach(e =>
			this.physics.add.collider(
				this.player.sprite,
				e.sprite,
				() => void this.handleEnemyTouch(e)
			)
		);

		this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);

		this.hud.showLevelBanner(this.level);
		this.initSfx();
	}

	public update() {
		if (this.transitioning) return;
		this.map.update();
		this.player.update();
		this.playerPrevBottom = this.player.sprite.body.bottom;
		this.coins.forEach(c => c.update());
		this.enemies.forEach(e => e.update());
	}

	private initSfx() {
		[
			'sfx_coin',
			'sfx_stomp',
			'sfx_hurt',
			'sfx_jump',
			'sfx_win',
			'sfx_gameover'
		].forEach(key => {
			this.sfx[key] = this.sound.add(key, { volume: 0.5 });
		});
	}

	private collectCoin(coin: Coin) {
		if (this.transitioning || coin.sprite.body == null) return;
		coin.collect();
		this.score += 10;
		this.hud.setScore(this.score);
		this.sfx['sfx_coin'].play();
	}

	private async handleEnemyTouch(enemy: Enemy) {
		if (this.transitioning || enemy.isDead) return;
		const stomped = enemy.interact(
			this.player.sprite.body.bottom,
			this.playerPrevBottom
		);
		if (stomped) {
			this.score += 50;
			this.hud.setScore(this.score);
			this.sfx['sfx_stomp'].play();
			// bounce the player off the stomped enemy
			this.player.sprite.setVelocityY(-450);
		} else {
			await this.loseHeart();
		}
	}

	private async handleFallOut() {
		if (this.transitioning) return;
		await this.loseHeart(true);
	}

	private async loseHeart(fromPit: boolean = false) {
		if (this.transitioning) return;
		this.transitioning = true;
		this.lives -= 1;
		this.sfx['sfx_hurt'].play();
		this.hud.setLives(this.lives);
		if (!fromPit) {
			this.cameras.main.shake(200, 0.012);
			this.player.sprite.setTint(0xff6b6b);
			this.player.toggleFreeze(true);
			await sleep(900);
			this.player.sprite.clearTint();
		} else {
			await sleep(400);
		}

		if (this.lives <= 0) {
			this.sfx['sfx_gameover'].play();
			this.scene.start('GameOverScene', { score: this.score, level: this.level });
			return;
		}

		// respawn at start of level, keep score
		this.scene.restart({ level: this.level, score: this.score, lives: this.lives });
	}

	private async handleLevelComplete() {
		if (this.transitioning) return;
		this.transitioning = true;
		this.sfx['sfx_win'].play();
		this.player.toggleFreeze(true);

		if (this.level >= 3) {
			this.scene.start('WinScene', { score: this.score });
			return;
		}
		this.scene.start('LevelCompleteScene', {
			score: this.score,
			level: this.level
		});
	}
}
