import { LevelScene } from '@src/scenes';

type SoundMap = { [key: string]: Phaser.Sound.BaseSound };

/**
 * Step 5: simple sound manager. Loads chiptune SFX, plays by key.
 * Volume kept modest; browsers require a user gesture before audio —
 * the title screen's start press satisfies that.
 */
export class Sfx {
	private sounds: SoundMap = {};
	private scene: LevelScene;
	private muted: boolean = false;

	constructor({ scene }: { scene: LevelScene }) {
		this.scene = scene;
	}

	public preload(): void {
		const files = [
			'sfx_coin',
			'sfx_stomp',
			'sfx_hurt',
			'sfx_jump',
			'sfx_win',
			'sfx_gameover'
		];
		files.forEach(key => {
			this.scene.load.audio(key, `assets/audio/${key}.ogg`);
		});
	}

	public create(): void {
		[
			'sfx_coin',
			'sfx_stomp',
			'sfx_hurt',
			'sfx_jump',
			'sfx_win',
			'sfx_gameover'
		].forEach(key => {
			if (this.scene.cache.audio.exists(key)) {
				this.sounds[key] = this.scene.sound.add(key, { volume: 0.45 });
			}
		});
	}

	public play(key: string): void {
		if (this.muted) return;
		const s = this.sounds[key];
		if (s && !this.scene.sound.locked) {
			s.play();
		}
	}

	public toggleMute(): boolean {
		this.muted = !this.muted;
		return this.muted;
	}
}
