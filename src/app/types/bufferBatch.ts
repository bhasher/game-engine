import { GameObject } from './gameObject';

export class BufferBatch {

  positionBuffer: WebGLBuffer;
  normalBuffer: WebGLBuffer;
  textureUVBuffer: WebGLBuffer;
  indicesBuffer: WebGLBuffer;

  constructor(gameObjects: Array<GameObject>) {
    this.generatePositionBuffer(gameObjects);
  }

  private generatePositionBuffer(gameObjects: Array<GameObject>) {
    var positionSize = gameObjects.map(x => x.mesh.position.length)
      .reduce((a, b) => a + b);
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positionSize, gl.STATIC_DRAW);

    var offset = 0;
    gameObjects.forEach(gameObject => {
      gl.bufferSubData(gl.ARRAY_BUFFER, offset, new Float32Array(gameObject.mesh.position));
      offset += gameObject.mesh.position.length;
    });
  }

  private generateNormalBuffer(gameObjects: Array<GameObject>) {
    
  }
}