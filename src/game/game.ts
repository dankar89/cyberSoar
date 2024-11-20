import EventEmitter from "events";
import { Color, drawRect, engineInit, mainCanvasSize, screenToWorld, vec2, setCameraPos, mouseWasPressed } from "littlejsengine";
import spritesData from "./data/sprites.json";
import BoidManager from "./boids/BoidManager.ts";
import { createSpriteAtlas, SpriteAtlas } from "./spriteUtils.ts";
import { BackgroundLayer } from "./background/BackgroundLayer.ts";
import Player from "./Player.ts";
import { PostProcessLayer } from "./PostProcessLayer.ts";

export default class Game extends EventEmitter {
  public boidManager: BoidManager;
  public spriteAtlas: SpriteAtlas;

  public backgroundLayer: BackgroundLayer;
  public postProcessLayer: PostProcessLayer;

  player: Player;

  postProcessEnabled: boolean = true;

  initialized: boolean = false;

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

    // this.setupPostProcess();
  }

  // setupPostProcess = () => {
  //   const televisionShader = `
  //   // Simple TV Shader Code
  //   float hash(vec2 p)
  //   {
  //       p=fract(p*.3197);
  //       return fract(1.+sin(51.*p.x+73.*p.y)*13753.3);
  //   }
  //   float noise(vec2 p)
  //   {
  //       vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
  //       return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+1.),u.x),u.y);
  //   }
  //   void mainImage(out vec4 c, vec2 p)
  //   {
  //       // put uv in texture pixel space
  //       p /= iResolution.xy;

  //       // apply fuzz as horizontal offset
  //       const float fuzz = .0005;
  //       const float fuzzScale = 800.;
  //       const float fuzzSpeed = 9.;
  //       p.x += fuzz*(noise(vec2(p.y*fuzzScale, iTime*fuzzSpeed))*2.-1.);

  //       // init output color
  //       c = texture(iChannel0, p);

  //       // chromatic aberration
  //       const float chromatic = .002;
  //       c.r = texture(iChannel0, p - vec2(chromatic,0)).r;
  //       c.b = texture(iChannel0, p + vec2(chromatic,0)).b;

  //       // tv static noise
  //       const float staticNoise = .1;
  //       c += staticNoise * hash(p + mod(iTime, 1e3));

  //       // scan lines
  //       const float scanlineScale = 1e3;
  //       const float scanlineAlpha = .1;
  //       c *= 1. + scanlineAlpha*sin(p.y*scanlineScale);

  //       // black vignette around edges
  //       const float vignette = 2.;
  //       const float vignettePow = 6.;
  //       float dx = 2.*p.x-1., dy = 2.*p.y-1.;
  //       c *= 1.-pow((dx*dx + dy*dy)/vignette, vignettePow);

  //       c = vec4(1, 0, 0, 1);
  //   }`;

  //   initPostProcess(televisionShader);
  // };

  gameInit = async () => {
    this.spriteAtlas = createSpriteAtlas(spritesData as any);
    console.log("this.spriteAtlas", this.spriteAtlas);

    this.backgroundLayer = new BackgroundLayer();
    this.postProcessLayer = new PostProcessLayer();

    this.player = new Player(screenToWorld(mainCanvasSize.scale(0.5)), this);

    this.boidManager = new BoidManager(this, 25, this.player); // Initialize with 50 boids

    Promise.all([
      this.backgroundLayer.loaded,
      this.postProcessLayer.loaded,
    ]).then(() => {
      console.log("Game Initialized", this);
      this.initialized = true;
      this.emit('loaded');
    });
  };

  gameUpdate = () => {
    if (!this.backgroundLayer.initialized) {
      return;
    }

    if (mouseWasPressed(1)) {
      this.boidManager.spawnBoids(20, this.player);
    }

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