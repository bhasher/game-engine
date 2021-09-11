import { GameObject } from '../gameObject';
import { GameState } from '../../gameState';
import { CollisionInfo } from '../collision/collider';
const { glMatrix, mat4, vec3, vec2 } = require('gl-matrix');

export class RidgidBody {

  parent: GameObject;

  velocity: Array<number>;
  acceleration: Array<number>;
  lastFrameAcceleration: Array<number>;
  inverseMass: number;
  forceAccum: Array<number>;

  constructor(object: object) {
    this.velocity = object['velocity'] || [0, 0, 0];
    this.acceleration = object['acceleration'] || [0, 0, 0];
    this.mass = object['mass'];
    this.forceAccum = [0, 0, 0];
    this.lastFrameAcceleration = [0, 0, 0];
  }

  integrate(time: number) {
    this.lastFrameAcceleration = [...this.acceleration];
    this.lastFrameAcceleration = this.lastFrameAcceleration.map((x,i) => x  + this.forceAccum[i] * this.inverseMass);

    this.velocity = this.velocity.map((x, i) => x + this.lastFrameAcceleration[i] * time);

    this.parent.position = this.parent.position.map((x, i) => x + this.velocity[i] * time);

    this.forceAccum = [0, 0, 0];
  }

  addForce(force: Array<number>) {
    this.forceAccum = this.forceAccum.map((x, i) => x + force[i]);
  }

  get mass() {
    if (this.inverseMass == 0)
      return Number.MAX_VALUE;
    else
      return 1.0 / this.inverseMass;
  }

  set mass(mass: number) {
    this.inverseMass = 1.0 / mass;
  }
}