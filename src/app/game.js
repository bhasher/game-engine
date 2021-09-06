const { glMatrix, mat4, vec3, vec2 } = require('gl-matrix');
const input = require('./input');
const fs = require('fs');

class Game {
  start() {

    /** @type {HTMLCanvasElement} */
    const canvas = document.querySelector("#glCanvas");

    const gl = canvas.getContext("webgl2");

    if (gl === null) {
      alert('GL broken');
      return;
    }


    // --------------------------------------------------------------------------------------------
    // SHADERS

    const shaders = {
      /** @type {Shader} */
      cube: {
        attribs: ['aPosition', 'aNormal', 'aTextureUV'],
        uniforms: [
          'uProjectionMatrix', 'uViewMatrix', 'uModelMatrix',
          'uSampler', 'uTextureScale', 'uLightPosition', 'uViewPosition'
        ],
        data: [{
          file: 'cube.vert',
          src: fs.readFileSync(`${__dirname}/shaders/cube.vert`),
          type: gl.VERTEX_SHADER
        }, {
          file: 'cube.frag',
          src: fs.readFileSync(`${__dirname}/shaders/cube.frag`),
          type: gl.FRAGMENT_SHADER,
        }]
      },
      /** @type {Shader} */
      basic: {
        attribs: ['aPosition', 'aTextureUV'],
        uniforms: [
          'uProjectionMatrix', 'uViewMatrix', 'uModelMatrix', 
          'uSampler', 'uTextureScale'
        ],
        data: [{
          file: 'basic.vert',
          src: fs.readFileSync(`${__dirname}/shaders/basic.vert`),
          type: gl.VERTEX_SHADER
        }, {
          file: 'basic.frag',
          src: fs.readFileSync(`${__dirname}/shaders/basic.frag`),
          type: gl.FRAGMENT_SHADER,
        }]
      }
    };

    [shaders.cube, shaders.basic].forEach(shader=>{
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
  
      const allAttribs = ['aPosition', 'aNormal', 'aTextureUV'];
      const allUniforms = [
        'uProjectionMatrix', 'uViewMatrix', 'uModelMatrix',
        'uSampler', 'uTextureScale', 'uViewPosition', 'uLightPosition'
      ]

      allAttribs.forEach(attrib => {
        if (shader.attribs.includes(attrib))
          shader[attrib] = gl.getAttribLocation(shader.program, attrib);
      });

      allUniforms.forEach(uniform => {
        if (shader.uniforms.includes(uniform))
          shader[uniform] = gl.getUniformLocation(shader.program, uniform);
      })
    }); 

    // --------------------------------------------------------------------------------------------
    // BUFFERS

    const buffers = {
      cube: {},
      Barrel: {}
    };

    ['cube', 'Barrel'].forEach(x => {
      var mesh = JSON.parse(fs.readFileSync('./src/assets/mesh/' + x + '.json'));

      buffers[x].positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers[x].positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.position), gl.STATIC_DRAW);

      buffers[x].normalBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers[x].normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.normal), gl.STATIC_DRAW);

      buffers[x].textureUVBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers[x].textureUVBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.uv), gl.STATIC_DRAW);

      buffers[x].indiciesBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers[x].indiciesBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.index), gl.STATIC_DRAW);

      buffers[x].indexLength = mesh.index.length;
    });

    gl.clearColor(0.1, 0.0, 0.8, 1.0);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LEQUAL);


    // --------------------------------------------------------------------------------------------
    // Textures

    const textures = {
      floor: {
        file: '../assets/png/gravel.png',
        texture: null,
        scale: vec2.fromValues(1,1)
      },
      wall: {
        file: '../assets/png/rocks.png',
        texture: null,
        scale: vec2.fromValues(1,1)
      },
      sun: {
        file: '../assets/png/the-sun.png',
        texture: null,
        scale: vec2.fromValues(1,1)
      },
      barrel: {
        file: '../assets/png/Barrel_Material.png',
        texture: null,
        scale: vec2.fromValues(1,1)
      }
    }

    Object.keys(textures).forEach(i => {
      const x = textures[i];
      
      x.texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, x.texture );

      /*
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);     
      */

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, 
                    gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 255, 255]));


      const image = new Image();
      image.onload = function () {
        x.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, x.texture);
        //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      }
      image.src = x.file;
    });


    // -------------------------------------------------------------------------------------------
    // Object Models

    const camera = {
      position: vec3.create(),
      target: vec3.create(),
      yaw: 0,
      pitch: 0,
      fov: 90,
      zNear: 0.1,
      zFar: 100
    };


    /* CUBES */

    var gameObjects = [];
    for (var x = -16; x <= 16; x+=2) {
      for (var z = -16; z <= 16; z+=2) {
        gameObjects.push({
          position: [x, -3, z],
          texture: textures.floor,
          shader: shaders.cube,
          scale: [1, 1, 1],
          buffers: buffers.cube
        });
      }
    };

    for (var z = -15; z <= 15; z+=2) {
      gameObjects.push({
        position: [-15, -1, z],
        texture: textures.wall,
        shader: shaders.cube,
        buffers: buffers.cube
      });
      gameObjects.push({
        position: [15, -1, z],
        texture: textures.wall,
        shader: shaders.cube,
        buffers: buffers.cube
      });
    };

    for (var y = -1; y <= 3; y+=2) {
      [[3,2],[8,7],[2,-5]].forEach(pair=>{
        gameObjects.push({
          position: [ pair[0], y, pair[1] ],
          texture: textures.wall,
          shader: shaders.cube,
          buffers: buffers.cube
        });
      });
    }


    /* The sun! */

    const lightPosition = [-25, 20, 5];

    gameObjects.push({
      position: lightPosition,
      texture: textures.sun,
      scale: [5, 5, 5],
      rotation: [0, 0, 90],
      shader: shaders.basic,
      buffers: buffers.cube
    });

    /* Barrel */

    [[-5,-5], [5, 5], [10, -5]].forEach(x => {
      gameObjects.push({
        position: [x[0], -2, x[1]],
        texture: textures.barrel,
        scale: [0.5, 0.5, 0.5],
        shader: shaders.cube,
        buffers: buffers.Barrel
      });
    });

    // --------------------------------------------------------------------------------------------
    // Loop

    var then = 0;
    var delta = {
      ms: 0,
      s: 0
    };

    const loop = now => {
      delta.ms = now - then;
      delta.s = delta.ms / 1000;
      then = now;

      if (canvas.width != canvas.clientWidth || canvas.clientHeight != canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      // ------------------------------------------------------------------------------------------
      // Input & Movement

      const moveDirection = vec3.fromValues(0, 0, 0);

      if (!input.paused) {
        if (input.getBindingByName('forward').isDown) {
          vec3.add(moveDirection, moveDirection, [0,0,-1]);
        }
        if (input.getBindingByName('back').isDown) {
          vec3.add(moveDirection, moveDirection, [0,0,1]);
        }
        if (input.getBindingByName('left').isDown) {
          vec3.add(moveDirection, moveDirection, [-1,0,0]);
        }
        if (input.getBindingByName('right').isDown) {
          vec3.add(moveDirection, moveDirection, [1,0,0]);
        }
        camera.pitch += input.getMouseY() * delta.s * 0.5;
        camera.yaw += input.getMouseX() * delta.s * 0.5;

        const maxLookUp = 1.5;
        if (camera.pitch > maxLookUp)
          camera.pitch = maxLookUp;
        if (camera.pitch < -maxLookUp)
          camera.pitch = -maxLookUp;

        vec3.normalize(moveDirection, moveDirection);
        const moveMultiplier = 7 * delta.s;
        vec3.multiply(moveDirection, moveDirection, [moveMultiplier, 0, moveMultiplier]);
        vec3.rotateY(moveDirection, moveDirection, [0, 0, 0], camera.yaw);
        vec3.add(camera.position, camera.position, moveDirection);

        const spin = vec3.create();
        vec3.rotateY(spin, [0, 0, -1], [0, 0, 0], camera.yaw);
        vec3.add(camera.target, spin, camera.position);
        camera.target[1] = camera.position[1] + camera.pitch;

        if (camera.position[0] > 14)
          camera.position[0] = 14;
        if (camera.position[0] < -14)
          camera.position[0] = -14;

        if (camera.position[2] > 14)
          camera.position[2] = 14;
        if (camera.position[2] < -14)
          camera.position[2] = -14;
      }


      // ------------------------------------------------------------------------------------------
      // Render Game Objects

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gameObjects.forEach(gameObj => {

        gl.useProgram(gameObj.shader.program);

        gl.bindBuffer(gl.ARRAY_BUFFER, gameObj.buffers.positionBuffer);
        gl.vertexAttribPointer(gameObj.shader.aPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(gameObj.shader.aPosition);

        if (gameObj.shader.aNormal) {
          gl.bindBuffer(gl.ARRAY_BUFFER, gameObj.buffers.normalBuffer);
          gl.vertexAttribPointer(gameObj.shader.aNormal, 3, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(gameObj.shader.aNormal);
        }
        
        gl.bindBuffer(gl.ARRAY_BUFFER, gameObj.buffers.textureUVBuffer);
        gl.vertexAttribPointer(gameObj.shader.aTextureUV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(gameObj.shader.aTextureUV);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gameObj.buffers.indiciesBuffer);

        const viewMatrix = mat4.create();
        mat4.lookAt(viewMatrix, camera.position, camera.target, [0,1,0]);

        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, glMatrix.toRadian(camera.fov),
          canvas.width / canvas.height, camera.zNear, camera.zFar);

        const modelMatrix = mat4.create();
        mat4.translate(modelMatrix, modelMatrix, gameObj.position);
        if (gameObj.rotation) {
          mat4.rotate(modelMatrix, modelMatrix, glMatrix.toRadian(gameObj.rotation[0]), [1, 0, 0]);
          mat4.rotate(modelMatrix, modelMatrix, glMatrix.toRadian(gameObj.rotation[1]), [0, 1, 0]);
          mat4.rotate(modelMatrix, modelMatrix, glMatrix.toRadian(gameObj.rotation[2]), [0, 0, 1]);
        }
        if (gameObj.scale) {
          mat4.scale(modelMatrix, modelMatrix, gameObj.scale);
        } 

        gl.uniformMatrix4fv(gameObj.shader.uProjectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(gameObj.shader.uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(gameObj.shader.uModelMatrix, false, modelMatrix);

        if (gameObj.shader.uViewPosition)
          gl.uniform3fv(gameObj.shader.uViewPosition, camera.position);

        if (gameObj.shader.uLightPosition)
          gl.uniform3fv(gameObj.shader.ulightPosition, lightPosition);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, gameObj.texture.texture);
        gl.uniform1i(gameObj.shader.uSampler, 0);
        gl.uniform2fv(gameObj.shader.uTextureScale, gameObj.texture.scale);

        gl.drawElements(gl.TRIANGLES, gameObj.buffers.indexLength, gl.UNSIGNED_SHORT, 0);
      });

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
};

module.exports = new Game();