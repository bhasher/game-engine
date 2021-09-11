import { Shader } from "./shader";
import { Texture } from "./texture";
import { Buffers } from './buffers';
import { RidgidBody } from './physics/ridgidBody';
import { Collider } from "./collision/collider";

export class GameObject {
  position: Array<number>;
  ridgidBody: RidgidBody;
  scale: Array<number>;
  rotation: Array<number>;
  texture: Texture;
  shader: Shader;
  buffers: Buffers;
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