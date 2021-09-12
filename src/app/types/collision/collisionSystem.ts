import { GameObject } from '../gameObject';
import { CollisionInfo, ColliderType, AABBCollider, CircleCollider } from './collider';
const { vec3 } = require('gl-matrix');

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

export class CollisionSystem {

  static TestCollisions(gameObjects: Array<GameObject>) {
    for (var x = 0; x < gameObjects.length; x++) {
      for (var y = x+1; y < gameObjects.length; y++) {
        var collisionInfo = this.ObjectIntersection(gameObjects[x], gameObjects[y]);
        if (collisionInfo != null) 
          this.ResolveCollision(collisionInfo);
      }
    }
  }

  static ResolveCollision(collisionInfo: CollisionInfo) {
    if (collisionInfo.penetration <= 0) {
      //vm.log(`Penetration: ${collisionInfo.penetration}`);
      return;
    }

    var gameObject: GameObject;
    if (collisionInfo.gameObjectA.ridgidBody == null) {
      gameObject = collisionInfo.gameObjectB;
      gameObject.ridgidBody.velocity = [0, 0, 0];
      gameObject.position = gameObject.position.map((x, i) => {
        return x - collisionInfo.normal[i] * collisionInfo.penetration * gameObject.ridgidBody.mass;
      });
    } else {
      gameObject = collisionInfo.gameObjectA;
      gameObject.ridgidBody.velocity = gameObject.ridgidBody.velocity.map((x, i) => {
       return x + collisionInfo.normal[i] * collisionInfo.penetration * gameObject.ridgidBody.mass;
      });
    }
  }

  static ObjectIntersection(gameObjectA: GameObject, gameObjectB: GameObject) : CollisionInfo {
    if (gameObjectA.collider == null || gameObjectB.collider == null) {
      return null;
    }
    if (gameObjectA.ridgidBody == null && gameObjectB.ridgidBody == null) {
      return null;
    }

    if (gameObjectA.collider.type == ColliderType.Circle) {
      if (gameObjectB.collider.type == ColliderType.Circle) {
        return null;
      }
      if (gameObjectB.collider.type == ColliderType.AABB) {
        return this.AABBSphereIntersection(gameObjectB, gameObjectA);
      }
    }
    if (gameObjectA.collider.type == ColliderType.AABB) {
      if (gameObjectB.collider.type == ColliderType.Circle) {
        return this.AABBSphereIntersection(gameObjectA, gameObjectB);
      }
      if (gameObjectB.collider.type == ColliderType.AABB) {
        return null;
      }
    }
  }

  static AABBSphereIntersection(gameObjectA: GameObject, gameObjectB: GameObject) : CollisionInfo {
    var volA = gameObjectA.collider as AABBCollider;
    var volB = gameObjectB.collider as CircleCollider;

    var delta = [0, 0, 0];
    vec3.subtract(delta, gameObjectA.position, gameObjectB.position);

    var closestPointOnBox = delta.map(x => {
      return clamp(x, -volA.halfSize, volA.halfSize);
    });

    var localPoint = [0, 0, 0];
    vec3.subtract(localPoint, delta, closestPointOnBox);

    var distance = vec3.length(localPoint);

    if (distance <= volB.radius) {
      var normal = [0, 0, 0];
      vec3.normalize(normal, localPoint);
      var penetration = volB.radius - distance;

      var localA = [0, 0, 0];
      var localB = normal.map((x) => x * -volB.radius);

      return {
        gameObjectA: gameObjectA,
        gameObjectB: gameObjectB,
        localPositionA: localA,
        localPositionB: localB,
        normal: normal,
        penetration: penetration
      }
    }
    return null;
  }
}