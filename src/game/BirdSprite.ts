import { rand, time } from "littlejsengine";
import { SpriteAnimation } from "./spriteUtils";
import AnimatedSprite from "./AnimatedSprite.ts";

const GLIDE_FRAME = 4;

export default class BirdSprite extends AnimatedSprite {
  isGliding: boolean = false;
  glideTime: number = 2; // seconds
  glideStartTime: number = 0;

  constructor(spriteAnim: SpriteAnimation, animationSpeed: number = 30.0, animationTimeOffset: number = 0) {
    super(spriteAnim, animationSpeed, animationTimeOffset);
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

  handleGlide(shouldStartGlide: boolean) {
    if (!this.isGliding && shouldStartGlide) {
      this.startGlide();
    } else {
      this.updateGlide();
    }

    return this.isGliding;
  }

  // Override the updateFrameOffset method to handle gliding
  updateFrameOffset() {
    super.updateFrameOffset();
    const isGliding = this.handleGlide(this.frameOffset === GLIDE_FRAME && rand() < 0.07);
    if (isGliding) {
      this.frameOffset = GLIDE_FRAME;
    }
  }
}