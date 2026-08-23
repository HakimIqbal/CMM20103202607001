import { LevelScene } from '@src/scenes';
import { isTouchDevice } from '@src/utils';

/**
 * Title screen: logo, blinking start prompt, controls hint.
 * Any key / click / tap -> starts the game at level 1.
 * All sizes derive from live canvas width so it looks right on any screen.
 */
export class TitleScene extends LevelScene {
	private prompt: Phaser.GameObjects.Text;
	private started: boolean = false;

	constructor() {
		super({ key: 'TitleScene' });
	}

	public preload() {
		super.preload();
	}

	public create() {
		super.create();
		this.cameras.main.setBackgroundColor('#448AFF');

		const w = this.scale.width;
		const h = this.scale.height;
		const cx = w / 2;

		this.add
			.text(cx, h * 0.22, 'KIKO', {
				fontFamily: 'Arcade',
				fontSize: `${Math.round(w / 10)}px`,
				color: '#ffffff',
				stroke: '#2b3f8e',
				strokeThickness: Math.round(w / 150)
			})
			.setOrigin(0.5)
			.setDepth(10);

		this.add
			.text(cx, h * 0.36, 'ADVENTURE', {
				fontFamily: 'Arcade',
				fontSize: `${Math.round(w / 24)}px`,
				color: '#ffe98a',
				stroke: '#2b3f8e',
				strokeThickness: Math.round(w / 200)
			})
			.setOrigin(0.5)
			.setDepth(10);

		this.prompt = this.add
			.text(
				cx,
				h * 0.58,
				isTouchDevice ? 'TAP TO START' : 'PRESS SPACE TO START',
				{
					fontFamily: 'Arcade',
					fontSize: `${Math.round(w / 42)}px`,
					color: '#ffffff'
				}
			)
			.setOrigin(0.5)
			.setDepth(10);

		this.add
			.text(
				cx,
				h * 0.72,
				isTouchDevice
					? 'TOUCH LEFT/RIGHT TO MOVE - TOP TO JUMP'
					: 'ARROWS TO MOVE - SPACE/UP TO JUMP',
				{
					fontFamily: 'Arcade',
					fontSize: `${Math.round(w / 62)}px`,
					color: '#dbe6ff'
				}
			)
			.setOrigin(0.5)
			.setDepth(10);

		this.tweens.add({
			targets: this.prompt,
			alpha: 0,
			duration: 500,
			yoyo: true,
			repeat: -1
		});

		this.input.keyboard.once('keydown-SPACE', this.startGame);
		this.input.keyboard.once('keydown-ENTER', this.startGame);
		this.input.once('pointerdown', this.startGame);

		this.scale.on('resize', () => this.reposition());

		// safety: when the Arcade font finishes loading, force text re-render
		var fontsAny = (document as any).fonts;
		if (fontsAny && fontsAny.ready) {
			fontsAny.ready.then(
				() => {
					this.children.each(function(child: any) {
						if (child.setStyle && child.style && child.updateText) {
							child.updateText();
						}
					});
				},
				() => {}
			);
		}
	}

	private reposition() {
		// simplest correct behavior on resize: rebuild the scene
		if (!this.started) this.scene.restart();
	}

	private startGame = () => {
		if (this.started) return;
		this.started = true;
		this.scene.start('GameScene', { level: 1 });
	};
}
