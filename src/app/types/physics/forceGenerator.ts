import { RidgidBody } from './ridgidBody';

export interface ForceGenerator {
  update(ridgidBody: RidgidBody, time: number): void;
}