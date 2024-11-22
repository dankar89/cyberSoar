import {
  ASSERT,
  EngineObject,
  rand,
  randInCircle,
} from "littlejsengine";
import Boid, { BoidOptions, BoidType } from "./Boid.ts";
import { Weights, WeightsEnum } from "./types.ts";
import Game from "../game.ts";
import Player from "../Player.ts";
import { SpriteAnimation } from "../spriteUtils.ts";
import { InfiniteSpatialGrid } from "./InfiniteSpatialGrid.ts";

export default class BoidManager {
  boids: Boid[] = [];

  targetVariation: number = 2.5;
  baseSeekRadius: number = 5;
  seekRadiusVariation: number = 0.15;

  weights: Weights = {
    alignment: 1,
    cohesion: 1,
    separation: 4,
    attraction: 0.5,
  };

  addTimeoutId: NodeJS.Timeout;
  canAddBoids: boolean = true;

  birdSpriteAnim: SpriteAnimation;
  droneSpriteAnim: SpriteAnimation;

  spatialGrid: InfiniteSpatialGrid;

  boidAnimations: Record<BoidType, SpriteAnimation>;

  constructor(game: Game, boidCount: number, player: Player) {
    this.spatialGrid = new InfiniteSpatialGrid(10);

    this.boidAnimations = {
      [BoidType.Friendly]: game.spriteAtlas.bird,
      [BoidType.Enemy]: game.spriteAtlas.drone
    }

    this.spawnBoids(
      boidCount,
      { leader: player, type: BoidType.Friendly });
  }

  spawnBoid(options: BoidOptions) {
    const {
      leader,
      type,
      spawnPos
    } = options;
    ASSERT(!!spawnPos || !!leader, 'A boid needs a spawnPos or a leader!');

    const minRadius = 0.1;
    const maxRadius = 5.0;

    const spriteAnim = this.boidAnimations[type as BoidType];

    const spawnCenter = spawnPos ?? (leader as EngineObject)?.pos;
    const spawnPosition = spawnCenter.add(randInCircle(maxRadius, minRadius));
    this.boids.push(new Boid(
      {
        spawnPos: spawnPosition,
        seekTargetOffset: randInCircle(maxRadius, minRadius),
        seekOuterRadius: this.baseSeekRadius + rand(1.0 + this.seekRadiusVariation, 1.0 - this.seekRadiusVariation),
        spriteAnim,
        type,
        ...options
      }
    ));
  }

  spawnBoids(
    boidCount: number, options: BoidOptions) {
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
    this.boids.forEach(boid => this.spatialGrid.addBoid(boid));

    // Update each boid using neighbors from the grid
    this.boids.forEach(boid => {
      const neighbors = this.spatialGrid.getNeighbors(boid);
      boid.flock(
        neighbors,
        this.weights,
      );
      boid.update();
      boid.render();
    });

    // Prune unused cells (optional, if you want memory optimization)
    this.spatialGrid.pruneUnusedCells(this.boids.map(boid => boid.position));
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
}
