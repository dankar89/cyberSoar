import { PI, Vector2 } from "littlejsengine";

export const vector2ToRad = (vector: Vector2): number => {
  return Math.atan2(vector.y, vector.x);
};

export const vector2ToDeg = (vector: Vector2): number => {
  return radToDeg(vector2ToRad(vector));
}

export const angleToVector2 = (angle: number): Vector2 => {
  return new Vector2(Math.cos(angle), Math.sin(angle));
}

export const degToRad = (degrees: number): number => {
  return degrees * PI / 180;
}

export const radToDeg = (radians: number): number => {
  return radians * 180 / PI;
}