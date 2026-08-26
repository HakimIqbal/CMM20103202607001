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



		// ---- Responsive Scaling & Layout for Mobile Portrait vs Desktop ----
		const isPortrait = isTouchDevice && h > w;
		
		// 1. Logo at top (0.16h & 0.28h on landscape, centered & enlarged on portrait)
		const logoY1 = isPortrait ? h * 0.20 : h * 0.16;
		const logoY2 = isPortrait ? h * 0.32 : h * 0.28;
		const fontScale = isPortrait ? 1.5 : 1.0;

		this.add
			.text(cx, logoY1, 'PIXEL', {
				fontFamily: 'Arcade',
				fontSize: `${Math.round((w / 9) * fontScale)}px`,
				color: '#ffffff',
				stroke: '#2b3f8e',
				strokeThickness: Math.round((w / 160) * fontScale)
			})
			.setOrigin(0.5);

		this.add
			.text(cx, logoY2, 'QUEST', {
				fontFamily: 'Arcade',
				fontSize: `${Math.round((w / 10) * fontScale)}px`,
				color: '#ffe98a',
				stroke: '#2b3f8e',
				strokeThickness: Math.round((w / 160) * fontScale)
			})
			.setOrigin(0.5)
			.setDepth(20);

		// Ground line for scene showcase
		const groundY = h * 0.72;

		// 1. Ara (Hero) - Left side, idle
		const araSprite = this.add.sprite(cx - w * 0.22, groundY, 'ara').setOrigin(0.5, 1);
		const araScale = Math.max(1.8, w / 450);
		araSprite.setScale(araScale).setDepth(15);
		araSprite.setFrame(0);

		// 2. Love Chest - Far Right
		const chestSprite = this.add.sprite(cx + w * 0.24, groundY, 'loveChest').setOrigin(0.5, 1);
		const chestScale = Math.max(1.5, w / 550);
		chestSprite.setScale(chestScale).setDepth(15);

		// 3. Animated Hop + Split Showcase for Slime (Tuing-Tuing & Split Loop)
		const slimeScale = Math.max(2.2, w / 380);
		if (!this.anims.exists('slime_walk')) {
			this.anims.create({
				key: 'slime_walk',
				frameRate: 6,
				frames: this.anims.generateFrameNumbers('slime', { start: 0, end: 3 }),
				repeat: -1
			});
		}

		const runSlimeCycle = () => {
			const startX = cx - w * 0.05;
			const bigSlime = this.add.sprite(startX, groundY, 'slime').setOrigin(0.5, 1);
			bigSlime.setScale(slimeScale).setDepth(16);
			bigSlime.play('slime_walk');

			// Hop 1 (Tuing!)
			this.tweens.add({
				targets: bigSlime,
				x: startX + 50,
				y: groundY - 45,
				scaleX: slimeScale * 0.8,
				scaleY: slimeScale * 1.3,
				duration: 350,
				ease: 'Quad.easeOut',
				yoyo: true,
				onYoyo: () => {
					this.tweens.add({
						targets: bigSlime,
						scaleX: slimeScale * 1.25,
						scaleY: slimeScale * 0.75,
						duration: 150,
						yoyo: true
					});
				},
				onComplete: () => {
					// Hop 2 (Tuing!)
					this.tweens.add({
						targets: bigSlime,
						x: startX + 110,
						y: groundY - 50,
						scaleX: slimeScale * 0.8,
						scaleY: slimeScale * 1.3,
						duration: 350,
						ease: 'Quad.easeOut',
						yoyo: true,
						onYoyo: () => {
							this.tweens.add({
								targets: bigSlime,
								scaleX: slimeScale * 1.25,
								scaleY: slimeScale * 0.75,
								duration: 150,
								yoyo: true
							});
						},
						onComplete: () => {
							// Stomp / Squish before POP
							this.tweens.add({
								targets: bigSlime,
								scaleY: slimeScale * 0.4,
								scaleX: slimeScale * 1.5,
								duration: 200,
								onComplete: () => {
									// POP effect (Burst into 3 minis!)
									const popX = bigSlime.x;
									const popY = groundY;
									bigSlime.destroy();

									const miniScale = slimeScale * 0.6;
									const minis: Phaser.GameObjects.Sprite[] = [];
									const offsets = [-45, 0, 45];

									offsets.forEach((dx) => {
										const m = this.add.sprite(popX, popY, 'slime').setOrigin(0.5, 1);
										m.setScale(miniScale).setDepth(16);
										m.play('slime_walk');
										minis.push(m);

										// Scatter hop
										this.tweens.add({
											targets: m,
											x: popX + dx * 1.4,
											y: groundY - 35,
											duration: 300,
											yoyo: true,
											ease: 'Quad.easeOut',
											onComplete: () => {
												// hop once more
												this.tweens.add({
													targets: m,
													x: m.x + (dx !== 0 ? Math.sign(dx) * 25 : 0),
													y: groundY - 20,
													duration: 250,
													yoyo: true,
													ease: 'Quad.easeOut'
												});
											}
										});
									});

									// Fade out minis and restart cycle
									this.time.delayedCall(1600, () => {
										minis.forEach((m) => {
											this.tweens.add({
												targets: m,
												alpha: 0,
												duration: 300,
												onComplete: () => m.destroy()
											});
										});
										this.time.delayedCall(500, runSlimeCycle, [], this);
									}, [], this);
								}
							});
						}
					});
				}
			});
		};

		runSlimeCycle();

		// Floating Decorative Hearts above
		const heart1 = this.add.image(cx - w * 0.28, h * 0.32, 'heart').setScale(2.5).setDepth(4);
		const heart2 = this.add.image(cx + w * 0.30, h * 0.35, 'heart').setScale(2.2).setDepth(4);
		const heart3 = this.add.image(cx, h * 0.38, 'heart').setScale(1.8).setDepth(4);

		[heart1, heart2, heart3].forEach((hImg, idx) => {
			this.tweens.add({
				targets: hImg,
				y: `+=${10 + idx * 4}`,
				duration: 1400 + idx * 300,
				yoyo: true,
				repeat: -1,
				ease: 'Sine.easeInOut'
			});
		});

		// Prompts positioned cleanly below the showcase area (scaled for mobile portrait readability)
		const promptY = isPortrait ? h * 0.52 : h * 0.84;
		const promptText = isTouchDevice ? 'TAP TO START' : 'PRESS SPACE TO START';
		const promptFontSize = isPortrait ? `${Math.round(w / 14)}px` : `${Math.round(w / 36)}px`;

		const prompt = this.add
			.text(
				cx,
				promptY,
				promptText,
				{
					fontFamily: 'Arcade',
					fontSize: promptFontSize,
					color: '#ffe98a',
					stroke: '#2b3f8e',
					strokeThickness: isPortrait ? 5 : 3
				}
			)
			.setOrigin(0.5)
			.setDepth(25);

		this.tweens.add({
			targets: prompt,
			alpha: 0,
			duration: 500,
			yoyo: true,
			repeat: -1
		});

		this.add
			.text(
				cx,
				h * 0.92,
				isTouchDevice
					? 'TOUCH LEFT/RIGHT TO MOVE - TOP TO JUMP'
					: 'ARROWS MOVE - SPACE/UP JUMP',
				{
					fontFamily: 'Arcade',
					fontSize: `${Math.round(w / 60)}px`,
					color: '#dbe6ff'
				}
			)
			.setOrigin(0.5)
			.setDepth(25);


		const start = () => {
			if (this.started) return;

			// Handle mobile auto-landscape & fullscreen on "TAP TO START"
			if (isTouchDevice) {
				// Request fullscreen
				try {
					if (document.documentElement.requestFullscreen) {
						document.documentElement.requestFullscreen().catch(() => {});
					}
				} catch (e) {}

				// Try locking screen orientation to landscape (works seamlessly on Android Chrome)
				if (screen.orientation && (screen.orientation as any).lock) {
					(screen.orientation as any).lock('landscape')
						.then(() => {
							// Android successfully locked to landscape! Start scene directly.
							proceedToGame();
						})
						.catch(() => {
							// Failed to lock (e.g. iOS Safari) -> evaluate viewport orientation
							evaluateOrientationAndProceed();
						});
				} else {
					// screen.orientation API not supported -> fallback
					evaluateOrientationAndProceed();
				}
			} else {
				// Desktop: proceed immediately
				proceedToGame();
			}
		};

		const evaluateOrientationAndProceed = () => {
			const isPortrait = window.innerHeight > window.innerWidth;
			if (isPortrait) {
				// Show iOS/Safari instruction overlay
				const overlay = document.getElementById('orientation-overlay');
				if (overlay) {
					overlay.style.display = 'block';
					const handleResize = () => {
						if (window.innerWidth > window.innerHeight) {
							// User rotated to landscape! Hide overlay & start game
							overlay.style.display = 'none';
							window.removeEventListener('resize', handleResize);
							proceedToGame();
						}
					};
					window.addEventListener('resize', handleResize);
				}
			} else {
				// Already landscape: proceed directly
				proceedToGame();
			}
		};

		const proceedToGame = () => {
			this.started = true;
			this.scene.start('MainScene', { level: 1 });
		};

		this.input.keyboard.once('keydown-SPACE', start);
		this.input.keyboard.once('keydown-ENTER', start);
		this.input.once('pointerdown', start);
	}
}
