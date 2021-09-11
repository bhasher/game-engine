import { GameObject } from '../gameObject';

export interface CollisionInfo {
  gameObjectA: GameObject;
  gameObjectB: GameObject;
  localPositionA: number[];
  localPositionB: number[];
  normal: number[];
  penetration: number;
}

export enum ColliderType {
  Circle,
  AABB
}

export interface Collider {
  type: ColliderType;
  position: number[];
}

export class CircleCollider implements Collider {
  position: number[];
  radius: number;
  type: ColliderType;

  constructor(object: object) {
    this.position = object['position'];
    this.radius = object['radius'];
    this.type = ColliderType.Circle;
  }
}

export class AABBCollider implements Collider {
  type: ColliderType;
  position: number[];
  halfSize: number;

  constructor(object: object) {
    this.position = object['position'];
    this.halfSize = object['halfSize'];
    this.type = ColliderType.AABB;
  }
}