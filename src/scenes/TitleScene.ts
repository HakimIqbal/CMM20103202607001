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
		// Title cast strip: real game characters composed into one PNG by
		// tools/make_title_cast.py (Ara poses + hearts + slime + chest).
		this.load.image('titleCast', 'assets/ui/title-cast.png?v=24090');
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

		// ---- Title cast strip (fills the empty lower half) ----------
		// Real characters from the game, anchored to an implied ground line
		// at ~78% height so they read as "standing" under the logo.
		if (this.textures.exists('titleCast')) {
			const cast = this.add.image(cx, 0, 'titleCast');
			const maxW = w * 0.62;
			const castScale = Math.min(maxW / cast.width, 1.4);
			cast.setScale(castScale);
			const groundY = h * 0.8;
			cast.setPosition(cx + w * 0.055, groundY - (cast.height * castScale) / 2);
			cast.setDepth(5);
			// gentle idle float on the whole cast (alive, not static)
			this.tweens.add({
				targets: cast,
				y: '+=10',
				duration: 1600,
				yoyo: true,
				repeat: -1,
				ease: 'Sine.easeInOut'
			});
		}

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
