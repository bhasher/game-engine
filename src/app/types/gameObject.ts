import { Shader } from "./shader";
import { Texture } from "./texture";
import { Buffers } from './buffers';
import { RidgidBody } from './physics/ridgidBody';
import { Collider } from "./collision/collider";
import { Mesh } from "./mesh";
import { ReadonlyVec3 } from "gl-matrix";

export class GameObject {
  position: Float32Array;
  ridgidBody: RidgidBody;
  scale: ReadonlyVec3;
  rotation: Array<number>;
  texture: Texture;
  shader: Shader;
  buffers: Buffers;
  mesh: Mesh;
  collider: Collider;

  constructor(object: Object) {
    this.position = object['position'];
    this.scale = object['scale'];
    this.rotation = object['rotation'];
    this.texture = object['texture'];
    this.shader = object['shader'];
    this.buffers = object['buffers'];
    this.ridgidBody = object['ridgidBody'];
    if (this.ridgidBody)
      this.ridgidBody.parent = this;
    this.collider = object['collider'];
  }

}