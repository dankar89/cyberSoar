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
import BirdSprite from "../BirdSprite.ts";
import { SpriteFrame } from "../spriteUtils";

export type BoidOptions = {
  seekTargetOffset?: Vector2; // Each boid should have a unique target offset
  seekOuterRadius?: number;
  leader?: EngineObject,
  spriteAnim?: SpriteFrame[],
  type?: BoidType;
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

export default class Boid {
  position: Vector2;
  velocity: Vector2;
  acceleration: Vector2;
  maxSpeed: number;
  minSpeed: number;
  maxForce: number;
  color: Color;
  options: BoidOptions = {
    seekTargetOffset: vec2(0, 0),
    seekOuterRadius: 0,
    spriteAnim: [],
    type: BoidType.Friendly,
  };
  animationTimeOffset: number = Math.random() * 10.0;

  birdSprite: BirdSprite;
  boidSize: Vector2 = vec2(1, 1).scale(rand(0.8, 1.2));

  constructor(x: number, y: number, options: BoidOptions) {
    if (!options?.spriteAnim?.length) {
      throw new Error('Boid must have a sprite animation');
    }

    this.position = vec2(x, y);
    this.velocity = vec2(0, 0);
    this.acceleration = vec2(0, 0);
    this.maxSpeed = 12; // Example max speed
    this.minSpeed = 7;
    this.maxForce = 2; // Example max force
    this.options = {
      ...this.options,
      ...options,
    };

    this.color = this.options.type === BoidType.Friendly ? friendlyColor : enemyColor;

    this.birdSprite = new BirdSprite(this.options?.spriteAnim as SpriteFrame[]);
  }

  // Update position and velocity with deltaTime to maintain consistent movement
  update() {
    this.velocity = this.velocity.add(this.acceleration).clampLength(this.maxSpeed);
    this.position = this.position.add(this.velocity.multiply(vec2(dt, dt))); // Apply deltaTime to position only
    this.acceleration = vec2(0, 0); // Reset acceleration
  }

  // Apply a force to the boid without scaling down by deltaTime for acceleration responsiveness
  applyForce(force: Vector2) {
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
  seek(target: Vector2, outerRadius: number = 10, seekCoefficient): Vector2 {
    const targetWithOffset = target
      .add(this.options.seekTargetOffset || vec2(0, 0))
      .add(vec2(Math.sin(time) * (2 * (this.options.seekTargetOffset?.x || 1)), Math.cos(time) * (2 * (this.options.seekTargetOffset?.y || 1)))); // Add some dynamic offset
    const distanceToTarget = this.position.distance(targetWithOffset);
    const innerRadius = outerRadius * 0.3;

    // Stop seeking if within the comfort zone
    if (distanceToTarget < innerRadius) {
      return vec2(0, 0);
    }

    // Calculate the diminishing attraction within the outer radius
    const strength = Math.min((distanceToTarget - innerRadius) / (outerRadius - innerRadius), 1);
    const adjustedMaxSpeed = Math.min(this.maxSpeed * strength, this.minSpeed); // Adjust speed dynamically based on distance

    // Calculate desired velocity and steering force
    let desired = targetWithOffset
      .subtract(this.position)
      .add(vec2(Math.sin(time) * (4 * (this.options.seekTargetOffset?.x || 1)), Math.cos(time) * (4 * (this.options.seekTargetOffset?.y || 1)))) // Add some dynamic offset
      .normalize()
      .multiply(vec2(adjustedMaxSpeed, adjustedMaxSpeed));
    let steering = desired.subtract(this.velocity).clampLength(this.maxForce);

    return steering.multiply(vec2(seekCoefficient, seekCoefficient));
  }


  // Limit the magnitude of velocity to maxSpeed (frame-rate independent with dt)
  limitVelocity() {
    if (this.velocity.length() > this.maxSpeed) {
      this.velocity = this.velocity.normalize().multiply(vec2(this.maxSpeed, this.maxSpeed));
    }
  }

  flock(boids: Boid[], weights: Weights) {
    const cohesionForce = this.cohesion(boids, weights.cohesion);
    const alignmentForce = this.alignment(boids, weights.alignment);
    const separationForce = this.separation(boids, weights.separation);

    // Steer towards the leader while staying within a comfortable radius
    let attractionForce = vec2(0, 0);
    if (this.options.leader) {
      const outerRadius = Math.min(15, 5 + ((boids.length - 1) * 0.05));
      attractionForce = this.seek(this.options.leader.pos, outerRadius, weights.attraction); // 100 is the desired distance to leader
    }
    // Apply each force with weights
    this.applyForce(cohesionForce.multiply(vec2(weights.cohesion, weights.cohesion)));
    this.applyForce(alignmentForce.multiply(vec2(weights.alignment, weights.alignment)));
    this.applyForce(separationForce.multiply(vec2(weights.separation, weights.separation)));
    this.applyForce(attractionForce); // Follow the leader
  }

  render() {
    // Use the velocity length to determine the size of the boid
    const scaleFactor = 1.25 - ((this.velocity.length() / this.maxSpeed) * 0.5);
    const size = this.boidSize.scale(scaleFactor);
    this.birdSprite.render(this.position, size, this.color, this.velocity.angle(), this.animationTimeOffset);
  }
}
