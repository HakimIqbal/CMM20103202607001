type PhSprite = Phaser.GameObjects.Sprite;

export type LevelSprite = PhSprite & {
	levelObject: LevelObject;
};
