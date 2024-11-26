import { Vector2, vec2 } from "littlejsengine";
import Boid, { BoidType } from "./Boid";
import { SpriteAnimation } from "../spriteUtils";
import AnimatedSprite from "../AnimatedSprite";

export default class DroneEnemy extends Boid {
  protected initSprite(spriteAnim: SpriteAnimation): void {
    this.sprite = new AnimatedSprite(spriteAnim);
    this.sprite.animationTimeOffset = this.animationTimeOffset;
  }

  protected idle(): Vector2 {
    // Drones hover in place with small random movements
    const time = performance.now() * 0.001;

    // Scale the movement based on minSpeed for subtle movement
    const idleSpeed = this.minSpeed * 0.02; // Use 2% of minSpeed for idle movement

    // Create a subtle hovering motion using sine waves
    const hoverX = Math.sin(time * 0.2 + this.animationTimeOffset) * idleSpeed;
    const hoverY = Math.cos(time * 0.15 + this.animationTimeOffset) * (idleSpeed * 0.5);

    // Add some random drift to make it less predictable
    this.wanderAngle += (Math.random() - 0.5) * 0.01;
    const driftMagnitude = idleSpeed * 0.25; // Even smaller drift
    const drift = vec2(
      Math.cos(this.wanderAngle) * driftMagnitude,
      Math.sin(this.wanderAngle) * driftMagnitude
    );

    return vec2(hoverX, hoverY).add(drift);
  }
}
