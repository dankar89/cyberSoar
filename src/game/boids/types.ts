export const enum WeightsEnum {
  alignment = 'alignment',
  cohesion = 'cohesion',
  separation = 'separation',
  attraction = 'attraction',
}

export type Weights = {
  [WeightsEnum.alignment]: number;
  [WeightsEnum.cohesion]: number;
  [WeightsEnum.separation]: number;
  [WeightsEnum.attraction]: number;
};