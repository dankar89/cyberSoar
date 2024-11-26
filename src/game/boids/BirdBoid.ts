import { Vector2, vec2 } from "littlejsengine";
import Boid from "./Boid";
import { SpriteAnimation } from "../spriteUtils";
import BirdSprite from "../BirdSprite";

export default class BirdBoid extends Boid {
  protected initSprite(spriteAnim: SpriteAnimation): void {
    this.sprite = new BirdSprite(spriteAnim);
    this.sprite.animationTimeOffset = this.animationTimeOffset;
  }

  protected idle(): Vector2 {
    // Birds wander in a more natural, flowing pattern
    const time = performance.now() * 0.001;

    // Update wander angle smoothly
    this.wanderAngle += Math.sin(time * 0.5 + this.animationTimeOffset) * 0.1;

    // Create a circular motion pattern
    const circleRadius = 2;
    const circleSpeed = 1;

    // Combine circular motion with forward movement
    return vec2(
      Math.cos(this.wanderAngle * circleSpeed) * circleRadius,
      Math.sin(this.wanderAngle * circleSpeed) * circleRadius
    );
  }
}
