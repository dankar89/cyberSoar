import {
  EngineObject,
  Vector2,
  frame,
  mainCanvasSize,
  rand,
  randInCircle
} from "littlejsengine";
import Boid, { BoidOptions, BoidType } from "./Boid.ts";
import { Weights, WeightsEnum } from "./types.ts";
import Game from "../game.ts";
import Player from "../Player.ts";
import { SpriteFrame } from "../spriteUtils.ts";
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

  birdSpriteAnim: SpriteFrame[];

  spatialGrid: InfiniteSpatialGrid

  constructor(game: Game, numberOfBoids: number, player: Player) {
    this.spatialGrid = new InfiniteSpatialGrid(10);
    this.birdSpriteAnim = game.spriteAtlas.bird;
    this.spawnBoids(numberOfBoids, player as EngineObject);
  }

  spawnBoid(options?: BoidOptions) {
    const leader = options?.leader;
    const minRadius = 0.1;// * this.boids.length || 0.15;
    const maxRadius = 5.0;//minRadius + ((this.boids.length % 10 || 1) * this.targetVariation);
    const spawnPosition = (leader ? leader.pos : mainCanvasSize).add(randInCircle(maxRadius, minRadius));
    this.boids.push(new Boid(
      spawnPosition.x,
      spawnPosition.y,
      {
        seekTargetOffset: randInCircle(maxRadius, minRadius),
        seekOuterRadius: this.baseSeekRadius + rand(1.0 + this.seekRadiusVariation, 1.0 - this.seekRadiusVariation),
        spriteAnim: this.birdSpriteAnim,
        // if leader is a player, this boid is friendly
        type: leader instanceof Player ? BoidType.Friendly : BoidType.Enemy,
        ...options
      }
    ));
  }

  spawnBoids(numberOfBoids: number, leader?: EngineObject) {
    if (!this.canAddBoids) {
      return;
    }
    console.log('spawning boids: ', numberOfBoids);

    for (let i = 0; i < numberOfBoids; i++) {
      this.spawnBoid({ leader });
    }
    this.canAddBoids = false;

    this.addTimeoutId = setTimeout(() => {
      this.canAddBoids = true;
    }, 250);
  }

  updateBoids() {
    // Clear and repopulate the grid
    // update every 5 frames
    // if (frame % 5 === 0) {
      this.spatialGrid.clear();
      this.boids.forEach(boid => this.spatialGrid.addBoid(boid));
    // }

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
    // for (let boid of this.boids) {
    //   boid.flock(
    //     this.boids,
    //     this.weights,
    //   );
    //   boid.update();
    //   boid.render();
    // }
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
