import { Vector2, rand, time, vec2 } from "littlejsengine";
import Player from "./Player";
import Game from "./game";
import { BoidType } from "./boids/Boid";
import BoidManager from "./boids/BoidManager";
import { SpriteAnimation } from "./spriteUtils";
import DroneEnemy from "./boids/DroneEnemy";

export class DroneManager {
  private activeDrones: Set<DroneEnemy> = new Set();
  private player: Player;
  private boidManager: BoidManager;
  private droneSprite: SpriteAnimation;

  // Spawn control
  private readonly spawnInterval: number = 2; // Seconds between spawn attempts
  private readonly spawnBatchSize: number = 2; // How many drones to spawn at once
  private readonly maxDrones: number = 50; // Maximum number of drones allowed
  private lastSpawnTime: number = 0;

  // Distance control
  private readonly minSpawnDistance: number = 30; // Distance from player to spawn
  private readonly maxActiveDistance: number = 50; // Distance at which drones are removed
  private readonly spawnArcAngle: number = Math.PI / 2; // 90 degree arc for spawning

  constructor(game: Game) {
    this.player = game.player;
    this.boidManager = game.boidManager;
    this.droneSprite = game.spriteAtlas.drone;
  }

  update() {
    this.trySpawnDrones();
    this.updateDrones();

    console.log("###### drones", this.droneCount)
  }

  private trySpawnDrones() {
    // Check if it's time to spawn and we're under the limit
    if (time - this.lastSpawnTime < this.spawnInterval ||
      this.activeDrones.size >= this.maxDrones) {
      return;
    }

    const spawnPositions = this.calculateSpawnPositions();
    for (const position of spawnPositions) {
      const drone = this.boidManager.spawnBoid({
        type: BoidType.Enemy,
        spawnPos: position,
        size: vec2(2), // Slightly larger than normal boids
        spriteAnim: this.droneSprite
      }) as DroneEnemy;

      this.activeDrones.add(drone);
    }

    this.lastSpawnTime = time;
  }

  private updateDrones() {
    for (const drone of this.activeDrones) {
      if (!drone.active) {
        this.activeDrones.delete(drone);
        continue;
      }

      const distance = this.calculateDistance(drone.position, this.player.pos);
      if (distance > this.maxActiveDistance) {
        this.boidManager.removeBoid(drone);
        this.activeDrones.delete(drone);
      }
    }
  }

  private calculateSpawnPositions(): Vector2[] {
    const positions: Vector2[] = [];
    const playerPos = this.player.pos;
    const playerVelocity = this.player.velocity || vec2(0, 0);

    // Calculate spawn arc center - ahead of player based on velocity
    const lookAheadTime = 1; // 1 second prediction
    const spawnCenter = playerPos.add(playerVelocity.multiply(vec2(lookAheadTime)));

    // Spawn in batches
    for (let i = 0; i < this.spawnBatchSize; i++) {
      // Calculate random angle within arc facing player's movement direction
      const baseAngle = playerVelocity.length() > 0.1
        ? playerVelocity.angle()
        : Math.random() * Math.PI * 2;

      const angleOffset = (Math.random() - 0.5) * this.spawnArcAngle;
      const spawnAngle = baseAngle + angleOffset;

      // Calculate position on arc
      const spawnDistance = this.minSpawnDistance + rand(0, 5);
      const spawnOffset = vec2(
        Math.cos(spawnAngle) * spawnDistance,
        Math.sin(spawnAngle) * spawnDistance
      );

      positions.push(spawnCenter.add(spawnOffset));
    }

    return positions;
  }

  private calculateDistance(pos1: Vector2, pos2: Vector2): number {
    return Math.sqrt((pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2);
  }

  get droneCount(): number {
    return this.activeDrones.size;
  }
}