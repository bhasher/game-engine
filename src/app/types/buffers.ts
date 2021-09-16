import { FileManager } from './fileManager';
export class BuffersRegistry {
  buffers: Array<Buffers>;
  
  constructor(buffers: Array<Buffers>) {
    this.buffers = buffers;
  }

  getByName(name: string) : Buffers {
    return this.buffers.filter(x => x.name == name)[0] || null;
  }
}

export class Buffers {
  get path() {
    //return path.normalize(path.join(__dirname, '../..',  `assets/mesh/${this.name}.json`));
    return `assets/mesh/${this.name}.json`;
  }

  name: string;
  positionBuffer: WebGLBuffer;
  normalBuffer: WebGLBuffer;
  textureUVBuffer: WebGLBuffer;
  indiciesBuffer: WebGLBuffer;
  indexLength: number;

  constructor(name: string) {
    this.name = name;
    this.init();
  }
  init() {
    var mesh = JSON.parse(FileManager.ReadFileSync(this.path));

    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.position), gl.STATIC_DRAW);

    this.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.normal), gl.STATIC_DRAW);

    this.textureUVBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.textureUVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.uv), gl.STATIC_DRAW);

    this.indiciesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indiciesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.index), gl.STATIC_DRAW);

    this.indexLength = mesh.index.length;
  }
}