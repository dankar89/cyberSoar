import {
  ASSERT,
  EngineObject,
  rand,
  randInCircle,
} from "littlejsengine";
import Boid, { BoidOptions, BoidType } from "./Boid";
import { Weights, WeightsEnum } from "./types";
import Game from "../game";
import Player from "../Player";
import { SpriteAnimation } from "../spriteUtils";
import { InfiniteSpatialGrid } from "./InfiniteSpatialGrid";
import ObjectPool from "../ObjectPool";
import DroneEnemy from "./DroneEnemy";
import BirdBoid from "./BirdBoid";

const MAX_RADIUS = 5.0;
const MIN_RADIUS = 0.1;
const INITIAL_POOL_SIZE = 1000;

export default class BoidManager {
  private boidPools: Record<BoidType, ObjectPool<Boid>>;
  private activeBoids: Set<Boid>;

  targetVariation: number = 2.5;
  baseSeekRadius: number = 5;
  seekRadiusVariation: number = 0.15;

  weights: Weights = {
    alignment: 1,
    cohesion: 1,
    separation: 4,
    attraction: 0.5,
  };

  addTimeoutId?: NodeJS.Timeout;
  canAddBoids: boolean = true;

  spatialGrid: InfiniteSpatialGrid;

  boidAnimations: Record<BoidType, SpriteAnimation>;

  constructor(game: Game, boidCount: number, player: Player) {
    this.spatialGrid = new InfiniteSpatialGrid(10);
    this.activeBoids = new Set();

    // Create a pool for each boid type
    this.boidPools = {
      [BoidType.Friendly]: new ObjectPool<Boid>(
        () => new BirdBoid(),
        INITIAL_POOL_SIZE,
        1.5
      ),
      [BoidType.Enemy]: new ObjectPool<Boid>(
        () => new DroneEnemy(),
        INITIAL_POOL_SIZE,
        1.5
      )
    };

    this.boidAnimations = {
      [BoidType.Friendly]: game.spriteAtlas.bird,
      [BoidType.Enemy]: game.spriteAtlas.drone
    }

    this.spawnBoids(
      boidCount,
      { leader: player, type: BoidType.Friendly });
  }

  addBoid(options: BoidOptions): Boid {
    const boid = this.boidPools[options.type as BoidType].get();
    boid.init(options);
    this.activeBoids.add(boid);
    return boid;
  }

  removeBoid(boid: Boid): boolean {
    if (this.activeBoids.delete(boid)) {
      // Find the correct pool based on the boid's type
      const pool = this.boidPools[boid.options.type as BoidType];
      pool.release(boid);
      return true;
    }
    return false;
  }

  spawnBoid(options: BoidOptions) {
    const {
      leader,
      type,
      spawnPos
    } = options;
    ASSERT(!!spawnPos || !!leader, 'A boid needs a spawnPos or a leader!');

    const spriteAnim = this.boidAnimations[type as BoidType];
    const spawnCenter = spawnPos ?? (leader as EngineObject)?.pos;
    const spawnPosition = spawnCenter.add(randInCircle(MAX_RADIUS, MIN_RADIUS));

    return this.addBoid({
      spawnPos: spawnPosition,
      seekTargetOffset: randInCircle(MAX_RADIUS, MIN_RADIUS),
      seekOuterRadius: this.baseSeekRadius + rand(1.0 + this.seekRadiusVariation, 1.0 - this.seekRadiusVariation),
      spriteAnim,
      type,
      ...options
    });
  }

  spawnBoids(boidCount: number, options: BoidOptions) {
    if (!this.canAddBoids) {
      return;
    }
    console.log('spawning boids: ', boidCount);

    for (let i = 0; i < boidCount; i++) {
      this.spawnBoid(options);
    }
    this.canAddBoids = false;

    this.addTimeoutId = setTimeout(() => {
      this.canAddBoids = true;
    }, 250);
  }

  updateBoids() {
    this.spatialGrid.clear();
    this.activeBoids.forEach(boid => this.spatialGrid.addBoid(boid));

    // Update each boid using neighbors from the grid
    this.activeBoids.forEach(boid => {
      const neighbors = this.spatialGrid.getNeighbors(boid);
      boid.flock(
        neighbors,
        this.weights,
      );
      boid.update();
      boid.render();
    });

    // Prune unused cells
    this.spatialGrid.pruneUnusedCells(Array.from(this.activeBoids).map(boid => boid.position));
  }

  update() {
    this.updateBoids();
  }

  render() {
  }

  renderPost() {
    this.spatialGrid.renderGrid();
  }

  resetWeights() {
    this.weights = {
      alignment: 1,
      cohesion: 1,
      separation: 1,
      attraction: 1,
    };
  }

  setWeight(type: WeightsEnum, value: number) {
    console.log('setWeight: ', type, value);
    if (type in this.weights) {
      this.weights[type] = value;
    }
  }

  getWeight(type: WeightsEnum) {
    return this.weights[type];
  }

  get activeBoidCount(): number {
    return this.activeBoids.size;
  }

  get totalPoolSize(): number {
    return Object.values(this.boidPools).reduce((acc, pool) => acc + pool.size, 0);
  }
}
