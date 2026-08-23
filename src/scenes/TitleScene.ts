import { LevelScene } from '@src/scenes';
import { isTouchDevice } from '@src/utils';

/**
 * Title screen: logo, blinking start prompt, controls hint.
 * Any key / click / tap -> starts the game at level 1.
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

		const cx = this.width / 2;

		this.add
			.text(cx, this.height * 0.22, 'KIKO', {
				fontFamily: 'Arcade',
				fontSize: '110px',
				color: '#ffffff',
				stroke: '#2b3f8e',
				strokeThickness: 10
			})
			.setOrigin(0.5)
			.setDepth(10);

		this.add
			.text(cx, this.height * 0.34, 'ADVENTURE', {
				fontFamily: 'Arcade',
				fontSize: '44px',
				color: '#ffe98a',
				stroke: '#2b3f8e',
				strokeThickness: 8
			})
			.setOrigin(0.5)
			.setDepth(10);

		this.prompt = this.add
			.text(cx, this.height * 0.58, isTouchDevice ? 'TAP TO START' : 'PRESS SPACE TO START', {
				fontFamily: 'Arcade',
				fontSize: '26px',
				color: '#ffffff'
			})
			.setOrigin(0.5)
			.setDepth(10);

		this.add
			.text(
				cx,
				this.height * 0.72,
				isTouchDevice
					? 'TOUCH LEFT/RIGHT TO MOVE - TOP TO JUMP'
					: 'ARROWS TO MOVE - SPACE/UP TO JUMP',
				{
					fontFamily: 'Arcade',
					fontSize: '16px',
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
	}

	private startGame = () => {
		if (this.started) return;
		this.started = true;
		this.scene.start('GameScene', { level: 1 });
	};
}
