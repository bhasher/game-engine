import { ForceGenerator } from "./forceGenerator";
import { RidgidBody } from "./ridgidBody";

export class GravityGenerator implements ForceGenerator {

  gravity: number;

  constructor(gravity: number) {
    this.gravity = gravity;
  }

  update(ridgidBody: RidgidBody, time: number): void {
    if (ridgidBody.inverseMass == 0)
      return;
    ridgidBody.addForce([0, -this.gravity * ridgidBody.mass, 0]);
  }
}