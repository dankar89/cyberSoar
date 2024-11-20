// Example texture packer data:
/*
{"frames": [

{
  "filename": "bird_1.png",
  "frame": {"x":131,"y":1,"w":84,"h":109},
  "rotated": false,
  "trimmed": true,
  "spriteSourceSize": {"x":22,"y":0,"w":84,"h":109},
  "sourceSize": {"w":128,"h":109},
  "pivot": {"x":0.5,"y":0.5}
},
{
  "filename": "bird_2.png",
  "frame": {"x":1,"y":1,"w":128,"h":81},
  "rotated": false,
  "trimmed": true,
  "spriteSourceSize": {"x":0,"y":14,"w":128,"h":81},
  "sourceSize": {"w":128,"h":109},
  "pivot": {"x":0.5,"y":0.5}
},
{
  "filename": "bird_3.png",
  "frame": {"x":1,"y":112,"w":68,"h":85},
  "rotated": false,
  "trimmed": true,
  "spriteSourceSize": {"x":30,"y":12,"w":68,"h":85},
  "sourceSize": {"w":128,"h":109},
  "pivot": {"x":0.5,"y":0.5}
}],
"meta": {
  "app": "https://www.codeandweb.com/texturepacker",
  "version": "1.0",
  "image": "sprites.png",
  "format": "RGBA8888",
  "size": {"w":256,"h":256},
  "scale": "1",
  "smartupdate": "$TexturePacker:SmartUpdate:30de0fa0c283061c8f791ae4a1d2841d:6716d87dca3cdaa7ca7b7f1d5ea50379:1eabdf11f75e3a4fe3147baf7b5be24b$"
}
}
*/

export type SpriteFrame = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type TexturePackerFrame = {
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
  [key: string]: SpriteFrame[];
};

export const createSpriteAtlas = (texturePackerData: TexturePackerData) => {
  const spriteAtlas: SpriteAtlas = {};
  Object.entries(texturePackerData.frames).forEach(([key, frameData]) => {
    const { filename, frame } = frameData;
    // Remove everything after the last underscore
    const spriteName = filename.split("_").slice(0, -1).join("_");
    console.log("spriteName", spriteName, filename, frame);
    if (!spriteAtlas[spriteName]) {
      spriteAtlas[spriteName] = [];
    }
    spriteAtlas[spriteName].push(frame);
  });
  return spriteAtlas;
}