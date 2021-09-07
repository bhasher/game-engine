
const allAttribs = ['aPosition', 'aNormal', 'aTextureUV'];
const allUniforms = [
  'uProjectionMatrix', 'uViewMatrix', 'uModelMatrix',
  'uSampler', 'uTextureScale', 'uViewPosition', 'uLightPosition'
]

export class ShaderRegistry {
  shaders: Array<Shader>;
  gl: WebGLRenderingContext;
  getShaderByName(name: string) {
    return this.shaders.filter(x => x.name == name)[0] || null;
  }
  constructor(shaders: Array<Shader>) {
    this.shaders = shaders;
    this.initializeShaders();
  }
  initializeShaders() {
    this.shaders.forEach(shader => {
      shader.program = gl.createProgram();

      shader.data.forEach(x => {
        x.shader = gl.createShader(x.type);
        gl.shaderSource(x.shader, x.src);
        gl.compileShader(x.shader);
        gl.attachShader(shader.program, x.shader);
      });
  
      gl.linkProgram(shader.program);
  
      if (!gl.getProgramParameter(shader.program, gl.LINK_STATUS)) {
        shader.data.forEach(x => {
          if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(`Shader Compile Error: ${x.file}: ${gl.getShaderInfoLog(shader)}`);
            gl.deleteShader(shader);
          }
        });
        console.error(gl.getProgramInfoLog(shader.program));
        return null;
      }
  
      allAttribs.forEach(attrib => {
        if (shader.attribs.includes(attrib))
          shader[attrib] = gl.getAttribLocation(shader.program, attrib);
      });

      allUniforms.forEach(uniform => {
        if (shader.uniforms.includes(uniform))
          shader[uniform] = gl.getUniformLocation(shader.program, uniform);
      })
    })
  }
}

export class Shader {
  [x: string]: any;
  name: string;
  attribs: string[];
  uniforms: string[];
  data: Array<ShaderData>;
  program: WebGLProgram;

  constructor(object: object) {
    this.name = object['name'];
    this.attribs = object['attribs'];
    this.uniforms = object['uniforms'];
    this.data = object['data'];
  }
}

export class ShaderData {
  src: string;
  shader: WebGLShader;
  type: number;
  file: string;

  constructor(object: object) {
    this.src = object['src'];
    this.type = object['type'];
    this.file = object['file'];
  }
}
