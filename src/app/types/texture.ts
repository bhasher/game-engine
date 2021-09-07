const { glMatrix, mat4, vec3, vec2 } = require('gl-matrix');

export class TextureRegistry {
  textures: Array<Texture>;
  constructor(textures: Array<Texture>) {
    this.textures = textures;
  }
  getTextureByName(name: string) {
    return this.textures.filter(x => x.name == name)[0] || null;
  }
}

export class Texture {

  static PATH = '../dist/assets/png/';

  name: string;
  texture: WebGLTexture;
  scale: any;

  constructor(name: string) {
    this.name = name;
    this.scale = vec2.fromValues(1, 1);
    this.init();
  }

  init() {
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, 
      gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 255, 255]));

      const image = new Image();
      image.onload = () => {
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      }
      image.src = `${Texture.PATH}${this.name}.png`;
  }
}