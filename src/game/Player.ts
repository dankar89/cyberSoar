import {
  keyIsDown,
  Color,
  EngineObject,
  vec2,
  Vector2,
  timeDelta,
  mousePosScreen,
  gamepadStick,
  screenToWorld
} from "littlejsengine";
import Game from "./game.ts";
import BirdSprite from "./BirdSprite.ts";

let oldMousePosScreen: Vector2 = mousePosScreen;
let mouseDelta: Vector2 = vec2(0, 0);

export default class Player extends EngineObject {
  birdSprite: BirdSprite;
  game: Game;

  constructor(pos: Vector2, game: Game) {
    super(pos, vec2(2, 2)); // Initialize the base EngineObject
    this.game = game;

    // Player-specific properties
    this.birdSprite = new BirdSprite(game.spriteAtlas.bird);

    // Physics properties
    this.damping = 0.9; // Simulate drag/friction (adjust as needed)
    this.mass = 1; // Set mass to control responsiveness to forces

    this.color = new Color(20 / 255.0, 180 / 255.0, 150 / 255.0, 1); // Set the player color

    oldMousePosScreen = mousePosScreen;
  }

  update() {
    super.update(); // Call the base EngineObject update method

    const forceAmount = .5 * timeDelta; // Adjust force strength as needed
    let moveDir = vec2(0, 0);

    if (keyIsDown('ArrowLeft')) {
      moveDir.x = -1;
    }

    if (keyIsDown('ArrowRight')) {
      moveDir.x = 1;
    }

    if (keyIsDown('ArrowUp')) {
      moveDir.y = 1;
    }

    if (keyIsDown('ArrowDown')) {
      moveDir.y = -1;
    }

    const noKeyboardInput = moveDir.x === 0 && moveDir.y === 0;
    const noMouseInput = mouseDelta.length() === 0;
    if (noKeyboardInput && !noMouseInput) {
      moveDir = screenToWorld(mousePosScreen).subtract(this.pos);
    }

    if (!noMouseInput && !noKeyboardInput) {
      const leftStick = gamepadStick(0);
      if (leftStick.length() > 0.1) {
        moveDir = leftStick;
      }
    }

    if (moveDir.x === 0 && moveDir.y === 0) {
      // constance force in velocity direction
      moveDir = this.velocity;
    }


    const force = moveDir.normalize().scale(forceAmount).clampLength(forceAmount);
    this.applyAcceleration(force);

    mouseDelta = mousePosScreen.subtract(oldMousePosScreen);
    oldMousePosScreen = mousePosScreen;
  }

  render() {
    // Use the BirdSprite to render the player
    this.birdSprite.render(this.pos, this.size, this.color, this.velocity.angle());
  }
}
