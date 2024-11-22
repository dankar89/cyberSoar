import { Color, drawTile, TileInfo, time, Vector2 } from "littlejsengine";
import { SpriteAnimation } from "./spriteUtils";

export default class AnimatedSprite {
  spriteAnim: SpriteAnimation;
  animationSpeed: number = 30.0;
  animationTimeOffset: number = 0;
  frameOffset: number = 0;

  constructor(spriteAnim: SpriteAnimation, animationSpeed: number = 30.0, animationTimeOffset: number = 0) {
    this.spriteAnim = spriteAnim;
    this.animationSpeed = animationSpeed;
    this.animationTimeOffset = animationTimeOffset;
  }

  updateFrameOffset() {
    const t = time + this.animationTimeOffset;
    this.frameOffset = Math.floor(t * this.animationSpeed) % this.spriteAnim.frames.length;
  }

  getSpriteFrame(): TileInfo {
    this.updateFrameOffset();
    const frame = this.spriteAnim.frames[this.frameOffset];
    return frame.tileInfo as TileInfo;
  }

  render(position: Vector2, size: Vector2, color: Color, angle: number) {
    const spriteFrame = this.getSpriteFrame();
    drawTile(position, size, spriteFrame, color, angle);
  }
}