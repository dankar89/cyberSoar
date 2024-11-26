import EventEmitter from "events";
import { Color, drawRect, engineInit, mainCanvasSize, screenToWorld, vec2, setCameraPos, mouseWasPressed, mousePos, playAudioFile, keyWasPressed, SoundWave, toggleFullscreen } from "littlejsengine";
import spritesData from "./data/sprites.json";
import BoidManager from "./boids/BoidManager.ts";
import { createSpriteAtlas, SpriteAtlas } from "./spriteUtils.ts";
import { BackgroundLayer } from "./background/BackgroundLayer.ts";
import Player from "./Player.ts";
import { PostProcessLayer } from "./PostProcessLayer.ts";
import { BoidType } from "./boids/Boid.ts";
import { DroneManager } from "./DroneManager.ts";

export default class Game extends EventEmitter {
  public boidManager!: BoidManager;
  public spriteAtlas!: SpriteAtlas;

  public backgroundLayer!: BackgroundLayer;
  public postProcessLayer!: PostProcessLayer;

  droneManager!: DroneManager;

  player!: Player;

  postProcessEnabled: boolean = true;

  initialized: boolean = false;

  #musicVolume: number;
  music: SoundWave;

  constructor() {
    super();
    const imageSources = ['sprites/sprites.png'];
    // Initialize LittleJS engine
    engineInit(
      this.gameInit,
      this.gameUpdate,
      this.gameUpdatePost,
      this.gameRender,
      this.gameRenderPost,
      imageSources
    );

    this.#musicVolume = 1.0;
    this.music = playAudioFile('audio/bird_song.wav', this.#musicVolume, true);
  }

  handleInput = () => {
    if (keyWasPressed('KeyM')) {
      this.#musicVolume = this.#musicVolume > 0 ? 0 : 1.0;
      this.music.setVolume(this.#musicVolume);
    }

    if (keyWasPressed('KeyF')) {
      toggleFullscreen();
    }
  }

  gameInit = async () => {
    this.spriteAtlas = createSpriteAtlas(spritesData as any);
    console.log("this.spriteAtlas", this.spriteAtlas);

    this.backgroundLayer = new BackgroundLayer();
    this.postProcessLayer = new PostProcessLayer();

    this.player = new Player(screenToWorld(mainCanvasSize.scale(0.5)), this);
    this.boidManager = new BoidManager(this, 0, this.player);
    this.droneManager = new DroneManager(this);

    await Promise.all([
      this.backgroundLayer.loaded,
      this.postProcessLayer.loaded,
    ]);

    console.log("Game Initialized", this);
    this.initialized = true;
    this.emit('loaded');
  };

  gameUpdate = () => {
    if (!this.backgroundLayer.initialized) {
      return;
    }

    this.handleInput();
    this.droneManager.update();
    this.boidManager.update();
    // Add other game update logic here if needed

    // Camera follow player
    setCameraPos(this.player.pos);
  };

  gameUpdatePost = () => {
  };


  gameRender = () => {
    if (!this.backgroundLayer.initialized) {
      drawRect(vec2(0, 0), mainCanvasSize, new Color(0, 0.125, 0.15, 1));
      return;
    }
    this.backgroundLayer.render();

    this.boidManager.render();
  };

  gameRenderPost = () => {
    // Optional post-render logic
    if (this.postProcessEnabled) {
      this.postProcessLayer.render();
    }

    this.boidManager.renderPost();
  };
}