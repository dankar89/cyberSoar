import { TileInfo, tile, vec2 } from "littlejsengine";

export type SpriteFrame = {
  x: number;
  y: number;
  w: number;
  h: number;
  tileInfo?: TileInfo;
};

export type SpriteAnimation = {
  frames: SpriteFrame[];
  offset: number; // The number of sprites before the first frame of this animation in the spritesheet
}

export type TexturePackerFrame = {
  filename: string;
  frame: SpriteFrame;
  rotated: boolean;
  trimmed: boolean;
  spriteSourceSize: SpriteFrame;
  sourceSize: SpriteFrame;
  pivot: SpriteFrame;
};

export type TexturePackerData = {
  frames: TexturePackerFrame[],
  [key: string]: any;
};

export type SpriteAtlas = {
  [key: string]: SpriteAnimation;
};

export const createSpriteAtlas = (texturePackerData: TexturePackerData) => {
  const spriteAtlas: SpriteAtlas = {};
  let frameCount = 0;

  Object.entries(texturePackerData.frames).forEach(([key, frameData]) => {
    const { filename, frame } = frameData;
    // Remove everything after the last underscore
    const spriteName = filename.split("_").slice(0, -1).join("_");
    if (!spriteAtlas[spriteName]) {
      spriteAtlas[spriteName] = { frames: [], offset: frameCount };
    }

    // Create TileInfo with position and size
    const tileInfo = tile(vec2(frame.x, frame.y), vec2(frame.w, frame.h));
    frame.tileInfo = tileInfo;

    spriteAtlas[spriteName].frames.push(frame);
    frameCount++;
  });
  return spriteAtlas;
}