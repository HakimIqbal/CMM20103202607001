import { LevelScene } from './LevelScene';
import { isTouchDevice } from '@src/utils';

/**
 * Title screen (Step 4): game logo, blinking start prompt, controls hint.
 * Any key / click / tap -> GameScene level 1.
 */
export class TitleScene extends LevelScene {
	private started: boolean = false;

	constructor() {
		super({ key: 'TitleScene' });
	}

	public preload() {
		super.preload();
		// Preload assets for title cast decoration
		this.load.spritesheet('slime', 'assets/sprites/slime.png?v=24089', {
			frameWidth: 32,
			frameHeight: 24
		});
		this.load.spritesheet('loveChest', 'assets/sprites/love_chest.png?v=24089', {
			frameWidth: 64,
			frameHeight: 64
		});
		this.load.spritesheet('ara', 'assets/sprites/ara.png?v=24089', {
			frameHeight: 102,
			frameWidth: 77,
			margin: 1,
			spacing: 2
		});
	}

	public create() {
		super.create();
		this.cameras.main.setBackgroundColor('#448AFF');

		const w = this.scale.width;
		const h = this.scale.height;
		const cx = w / 2;

		// Build tag (tiny, corner): lets the operator verify the loaded
		// bundle version on any device without devtools.
		this.add
			.text(w - 8, h - 8, 'v2408-35', {
				fontFamily: 'monospace',
				fontSize: '11px',
				color: '#ffffff'
			})
			.setOrigin(1, 1)
			.setDepth(100);

		this.add
			.text(cx, h * 0.22, 'PIXEL', {
				fontFamily: 'Arcade',
				fontSize: `${Math.round(w / 9)}px`,
				color: '#ffffff',
				stroke: '#2b3f8e',
				strokeThickness: Math.round(w / 160)
			})
			.setOrigin(0.5)
			.setDepth(10);

		this.add
			.text(cx, h * 0.37, 'QUEST', {
				fontFamily: 'Arcade',
				fontSize: `${Math.round(w / 22)}px`,
				color: '#ffe98a',
				stroke: '#2b3f8e',
				strokeThickness: Math.round(w / 220)
			})
			.setOrigin(0.5)
			.setDepth(10);

		const prompt = this.add
			.text(
				cx,
				h * 0.6,
				isTouchDevice ? 'TAP TO START' : 'PRESS SPACE TO START',
				{
					fontFamily: 'Arcade',
					fontSize: `${Math.round(w / 40)}px`,
					color: '#ffffff'
				}
			)
			.setOrigin(0.5)
			.setDepth(10);

		this.tweens.add({
			targets: prompt,
			alpha: 0,
			duration: 500,
			yoyo: true,
			repeat: -1
		});

		// ---- Decorative Cast Layout (Animated & High Quality) ----
		const groundY = h * 0.82;

		// 1. Ara (Hero) - Left-Center standing
		const araSprite = this.add.sprite(cx - w * 0.18, groundY, 'ara').setOrigin(0.5, 1);
		const araScale = Math.max(1.8, w / 450);
		araSprite.setScale(araScale).setDepth(6);
		// Play idle animation (frame 0)
		araSprite.setFrame(0);

		// 2. Love Chest - Right side
		const chestSprite = this.add.sprite(cx + w * 0.22, groundY, 'loveChest').setOrigin(0.5, 1);
		const chestScale = Math.max(1.5, w / 550);
		chestSprite.setScale(chestScale).setDepth(6);

		// 3. Slime Enemy - Patrolling between Ara and Chest
		const slimeSprite = this.add.sprite(cx + w * 0.05, groundY, 'slime').setOrigin(0.5, 1);
		const slimeScale = Math.max(2.0, w / 400);
		slimeSprite.setScale(slimeScale).setDepth(6);
		if (!this.anims.exists('slime_walk')) {
			this.anims.create({
				key: 'slime_walk',
				frameRate: 6,
				frames: this.anims.generateFrameNumbers('slime', { start: 0, end: 3 }),
				repeat: -1
			});
		}
		slimeSprite.play('slime_walk');

		// Gentle patrol animation for Slime (walks back and forth)
		this.tweens.add({
			targets: slimeSprite,
			x: cx + w * 0.12,
			duration: 2000,
			yoyo: true,
			repeat: -1,
			ease: 'Sine.easeInOut',
			onYoyo: () => slimeSprite.setFlipX(true),
			onRepeat: () => slimeSprite.setFlipX(false)
		});

		// 4. Floating Decorative Hearts & Coins above the scene
		const heart1 = this.add.image(cx - w * 0.25, h * 0.35, 'heart').setScale(2.5).setDepth(4);
		const heart2 = this.add.image(cx + w * 0.28, h * 0.38, 'heart').setScale(2.2).setDepth(4);
		const heart3 = this.add.image(cx + w * 0.12, h * 0.28, 'heart').setScale(1.8).setDepth(4);

		[heart1, heart2, heart3].forEach((hImg, idx) => {
			this.tweens.add({
				targets: hImg,
				y: `+=${12 + idx * 4}`,
				duration: 1400 + idx * 300,
				yoyo: true,
				repeat: -1,
				ease: 'Sine.easeInOut'
			});
		});

		this.add
			.text(
				cx,
				h * 0.74,
				isTouchDevice
					? 'TOUCH LEFT/RIGHT TO MOVE - TOP TO JUMP'
					: 'ARROWS MOVE - SPACE/UP JUMP',
				{
					fontFamily: 'Arcade',
					fontSize: `${Math.round(w / 58)}px`,
					color: '#dbe6ff'
				}
			)
			.setOrigin(0.5)
			.setDepth(10);

		const start = () => {
			if (this.started) return;
			this.started = true;
			this.scene.start('MainScene', { level: 1 });
		};
		this.input.keyboard.once('keydown-SPACE', start);
		this.input.keyboard.once('keydown-ENTER', start);
		this.input.once('pointerdown', start);
	}
}
