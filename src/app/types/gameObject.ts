import { Shader } from "./shader";
import { Texture } from "./texture";
import { Buffers } from './buffers';

export class GameObject {
  position: Array<Number>;
  scale: Array<Number>;
  rotation: Array<Number>;
  texture: Texture;
  shader: Shader;
  buffers: Buffers;

  constructor(object: Object) {
    this.position = object['position'];
    this.scale = object['scale'];
    this.rotation = object['rotation'];
    this.texture = object['texture'];
    this.shader = object['shader'];
    this.buffers = object['buffers'];
  }
}