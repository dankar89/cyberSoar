import {
  Color,
  EngineObject,
  Vector2,
  timeDelta as dt,
  rand,
  time,
  vec2,
} from "littlejsengine";
import { Weights } from "./types";
import { SpriteAnimation } from "../spriteUtils";
import AnimatedSprite from "../AnimatedSprite.ts";
import { Poolable } from "../ObjectPool.ts";

export type BoidOptions = {
  seekTargetOffset?: Vector2; // Each boid should have a unique target offset
  seekOuterRadius?: number;
  leader?: EngineObject,
  spriteAnim?: SpriteAnimation,
  type?: BoidType,
  spawnPos?: Vector2,
  size?: Vector2
};

const friendlyColor = new Color(5 / 255.0, 125 / 255.0, 80 / 255.0, 1);
const enemyColor = new Color(200 / 255.0, 50 / 255.0, 50 / 255.0, 1);

export enum BoidState {
  Idle,
  Seek,
  Attack
}

export enum BoidType {
  Friendly,
  Enemy
}

export default abstract class Boid implements Poolable {
  position: Vector2 = vec2();
  velocity: Vector2 = vec2();
  acceleration: Vector2 = vec2();
  maxSpeed: number = 12;
  minSpeed: number = 7;
  maxForce: number = 2;
  color: Color = new Color(1, 1, 1, 1);
  options: BoidOptions = {
    seekTargetOffset: vec2(0, 0),
    seekOuterRadius: 0,
    spriteAnim: { frames: [], offset: 0 },
    type: BoidType.Friendly,
    size: vec2(1)
  };
  animationTimeOffset: number = Math.random() * 10.0;

  sprite?: AnimatedSprite;
  boidSize: Vector2 = vec2(1, 1);

  active: boolean = false;

  protected wanderAngle: number = Math.random() * Math.PI * 2; // For idle behaviors
  private forcesApplied: boolean = false;

  activate(): void {
    this.active = true;
  }

  deactivate(): void {
    this.active = false;
    // Reset state
    this.position = vec2(0, 0);
    this.velocity = vec2(0, 0);
    this.acceleration = vec2(0, 0);
    // this.sprite?.destroy();
  }

  init(options: BoidOptions) {
    if (!options?.spriteAnim?.frames.length) {
      throw new Error('Boid must have a valid sprite animation');
    }

    if (!options.spawnPos) {
      throw new Error('Boid must have a valid spawnPos');
    }

    this.position = options.spawnPos;
    this.options = {
      ...this.options,
      ...options,
    };

    this.boidSize = (options.size || this.boidSize).scale(rand(0.8, 1.2));
    this.color = this.options.type === BoidType.Friendly ? friendlyColor : enemyColor;

    this.initSprite(options.spriteAnim as SpriteAnimation);
  }

  protected abstract initSprite(spriteAnim: SpriteAnimation): void;

  // Each boid type implements its own idle behavior
  protected abstract idle(): Vector2;

  update() {
    if (!this.forcesApplied) {
      // No forces were applied this frame, use idle behavior
      this.applyForce(this.idle());
    }

    this.velocity = this.velocity.add(this.acceleration).clampLength(this.maxSpeed);
    this.position = this.position.add(this.velocity.multiply(vec2(dt, dt)));
    this.acceleration = vec2(0, 0);
    this.forcesApplied = false; // Reset for next frame
  }

  applyForce(force: Vector2) {
    if (force.length() > 0) {
      this.forcesApplied = true;
    }
    this.acceleration = this.acceleration.add(force);
  }

  // Cohesion - steer towards the center of mass of flockmates
  cohesion(boids: Boid[], cohesionCoefficient: number): Vector2 {
    // If there is no leader, reduce the count by 1 to exclude the current boid
    const boidCount = boids.length;// + (this.options.leader ? 0 : -1);
    let centerOfMass = vec2(0, 0);
    for (let other of boids) centerOfMass = centerOfMass.add(other.position);

    centerOfMass = centerOfMass.divide(vec2(boidCount, boidCount));
    return centerOfMass.subtract(this.position).divide(vec2(cohesionCoefficient, cohesionCoefficient));
  }

  // Alignment - steer towards the average heading of flockmates
  alignment(boids: Boid[], alignmentCoefficient: number): Vector2 {
    // If there is no leader, reduce the count by 1 to exclude the current boid
    const boidCount = boids.length;// + (this.options.leader ? 0 : -1);
    let avgVelocity = vec2(0, 0);
    for (let other of boids) avgVelocity = avgVelocity.add(other.velocity);

    avgVelocity = avgVelocity.divide(vec2(boidCount, boidCount));
    return avgVelocity.subtract(this.velocity).divide(vec2(alignmentCoefficient, alignmentCoefficient));
  }

  #calcSeparationForce = (otherPos: Vector2, perceptionRadius: number): Vector2 | null => {
    const distance = this.position.distance(otherPos);
    if (distance < perceptionRadius && distance > 0.001) { // Avoid self and distant boids
      const distanceSquared = distance * distance;
      let diff = this.position.subtract(otherPos);
      diff = diff.divide(vec2(distanceSquared)); // Weight by distance
      return diff;
    }
    return null;
  }

  // Separation - steer away from nearby flockmates to avoid crowding
  separation(boids: Boid[], separationCoefficient: number): Vector2 {
    const perceptionRadius = 10; // Define a fixed radius for proximity check
    let separationForce = vec2(0, 0);
    let total = 0;

    for (let other of boids) {
      const force = this.#calcSeparationForce(other.position, perceptionRadius);
      if (force) {
        separationForce = separationForce.add(force);
        total++;
      }
    }

    if (total > 0) {
      separationForce = separationForce.divide(vec2(total, total)); // Average the separation force
    }

    // Apply the separationCoefficient as a weight
    return separationForce.multiply(vec2(separationCoefficient, separationCoefficient));
  }

  // Seek method to follow a target with a more dynamic response
  seek(target: Vector2, outerRadius: number = 10, seekCoefficient: number): Vector2 {
    // Add a subtle dynamic offset for natural movement
    const dynamicOffset = vec2(
      Math.sin(time) * (this.options.seekTargetOffset?.x || 0.5),
      Math.cos(time) * (this.options.seekTargetOffset?.y || 0.5)
    );

    const targetWithOffset = target.add(dynamicOffset);
    const distanceToTarget = this.position.distance(targetWithOffset);
    const innerRadius = outerRadius * 0.4;

    // Simple distance-based force scaling
    let strength;
    if (distanceToTarget < innerRadius) {
      // Smoothly reduce force as we get closer to target
      strength = 0.2 + (distanceToTarget / innerRadius) * 0.3;
    } else if (distanceToTarget > outerRadius) {
      // Full force when too far
      strength = 1;
    } else {
      // Gradual increase between inner and outer radius
      strength = 0.5 + ((distanceToTarget - innerRadius) / (outerRadius - innerRadius)) * 0.5;
    }

    // Calculate desired velocity
    const desired = targetWithOffset
      .subtract(this.position)
      .normalize()
      .multiply(vec2(this.maxSpeed, this.maxSpeed));

    // Apply strength to steering rather than speed
    const steering = desired
      .subtract(this.velocity)
      .clampLength(this.maxForce)
      .multiply(vec2(strength * seekCoefficient, strength * seekCoefficient));

    return steering;
  }

  flock(boids: Boid[], weights: Weights) {
    const cohesionForce = this.cohesion(boids, weights.cohesion);
    const alignmentForce = this.alignment(boids, weights.alignment);
    const separationForce = this.separation(boids, weights.separation);

    // Steer towards the leader while staying within a comfortable radius
    let attractionForce = vec2(0, 0);
    if (this.options.leader) {
      const outerRadius = Math.min(15, 5 + ((boids.length - 1) * 0.05));
      attractionForce = this.seek(this.options.leader.pos, outerRadius, weights.attraction);
    }

    // Apply each force with weights
    this.applyForce(cohesionForce);
    this.applyForce(alignmentForce);
    this.applyForce(separationForce);
    this.applyForce(attractionForce);
  }

  render() {
    // Use the velocity length to determine the size of the boid
    // const scaleFactor = 1.25 - ((this.velocity.length() / this.maxSpeed) * 0.5);
    const size = this.boidSize;//.scale(scaleFactor);
    this.sprite?.render(this.position, size, this.color, this.velocity.angle());
  }
}
