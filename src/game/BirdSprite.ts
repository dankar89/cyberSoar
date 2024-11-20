import { Color, drawTile, rand, tile, TileInfo, time, vec2, Vector2 } from "littlejsengine";
import { SpriteFrame } from "./spriteUtils";

const GLIDE_FRAME = 4;

export default class BirdSprite {
  isGliding: boolean = false;
  glideTime: number = 2; // seconds
  glideStartTime: number = 0;
  spriteAnim: SpriteFrame[];
  tileInfo: TileInfo;

  constructor(spriteAnim: SpriteFrame[]) {
    this.spriteAnim = spriteAnim;
    const { x, y, w, h } = this.spriteAnim[0];
    this.tileInfo = tile(vec2(x, y), vec2(w, h));
  }

  startGlide() {
    if (this.isGliding) return;
    this.isGliding = true;
    this.glideStartTime = time;
  }

  updateGlide() {
    if (this.isGliding) {
      const glideTimeElapsed = time - this.glideStartTime > this.glideTime;
      if (glideTimeElapsed) {
        this.isGliding = false;
        this.glideStartTime = 0;
      }
    }
  }

  handleGlide(startGlide: boolean) {
    if (!this.isGliding && startGlide) {
      this.startGlide();
    } else {
      this.updateGlide();
    }

    return this.isGliding;
  }

  getSpriteFrame(animationTimeOffset: number = 0): TileInfo {
    let animSpeed = 30.0;

    const t = time + animationTimeOffset;
    let frameOffset = Math.floor(t * animSpeed) % this.spriteAnim.length;

    const isGliding = this.handleGlide(frameOffset === GLIDE_FRAME && rand() < 0.07);

    if (isGliding) {
      frameOffset = GLIDE_FRAME;
    }

    const { x, y } = this.spriteAnim[frameOffset];
    return this.tileInfo.offset(vec2(x, y));
  }

  render(position: Vector2, size: Vector2, color: Color, angle: number, animationTimeOffset: number = 0) {
    const spriteFrame = this.getSpriteFrame(animationTimeOffset);
    drawTile(position, size, spriteFrame, color, angle, false, new Color(0, 0, 0, 0), true);
  }
}