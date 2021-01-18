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

    const shader = {};
    shader.data = [{
      file: 'cube.vert',
      type: gl.VERTEX_SHADER
    }, {
      file: 'cube.frag',
      type: gl.FRAGMENT_SHADER,
    }].map(x => {
      x.src = fs.readFileSync(`${__dirname}/${x.file}`);
      return x;
    });

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
        if (!gl.getShaderParameter(x.shader, gl.COMPILE_STATUS)) {
          console.error(`Shader Compile Error: ${x.file}: ${gl.getShaderInfoLog(x.shader)}`);
          gl.deleteShader(x.shader);
        }
      });
      console.error(gl.getProgramInfoLog(shader.program));
      return null;
    }

    shader.aPosition = gl.getAttribLocation(shader.program, 'aPosition');
    shader.aNormal = gl.getAttribLocation(shader.program, 'aNormal');
    shader.aTextureUV = gl.getAttribLocation(shader.program, 'aTextureUV');

    shader.uProjectionMatrix = gl.getUniformLocation(shader.program, 'uProjectionMatrix');
    shader.uViewMatrix = gl.getUniformLocation(shader.program, 'uViewMatrix');
    shader.uModelMatrix = gl.getUniformLocation(shader.program, 'uModelMatrix');
    shader.uNormalMatrix = gl.getUniformLocation(shader.program, 'uNormalMatrix');

    shader.uSampler = gl.getUniformLocation(shader.program, 'uSampler');
    shader.uTextureScale = gl.getUniformLocation(shader.program, 'uTextureScale');
    shader.uViewPosition = gl.getUniformLocation(shader.program, 'uViewPosition');

    console.log(shader);

    // --------------------------------------------------------------------------------------------
    // BUFFERS

    const cube = require('./cube.js');

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube.position), gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube.normal), gl.STATIC_DRAW);

    const textures = {
      floor: {
        file: '../assets/gravel.png',
        texture: null,
        scale: vec2.fromValues(1,1)
      },
      wall: {
        file: '../assets/rocks.png',
        texture: null,
        scale: vec2.fromValues(1,1)
      },
      sun: {
        file: '../assets/the-sun.png',
        texture: null,
        scale: vec2.fromValues(1,1)
      }
    }

    Object.keys(textures).forEach(i => {
      const x = textures[i];
      
      x.texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, x.texture );

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, 
                    gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 255, 255]));


      const image = new Image();
      image.onload = function () {
        x.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, x.texture);

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

    const textureUVBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureUVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube.uv), gl.STATIC_DRAW);

    const indiciesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indiciesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cube.index), gl.STATIC_DRAW);

    gl.clearColor(0.1, 0.0, 0.8, 1.0);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

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

    var gameObjects = [];
    for (var x = -15; x <= 15; x+=2) {
      for (var z = -15; z <= 15; z+=2) {
        gameObjects.push({
          position: [x, -3, z],
          texture: textures.floor
        });
      }
    };

    for (var z = -15; z <= 15; z+=2) {
      gameObjects.push({
        position: [-15, -1, z],
        texture: textures.wall
      });
      gameObjects.push({
        position: [15, -1, z],
        texture: textures.wall
      });
    };

    for (var y = -1; y < 4; y+=2) {
      [[3,2],[8,7],[2,-5]].forEach(pair=>{
        gameObjects.push({
          position: [ pair[0], y, pair[1] ],
          texture: textures.wall
        });
      });
    }

    gameObjects.push({
      position: [-10, 15, -17],
      texture: textures.sun,
      scale: [-5, -5, -5],
      rotation: [0, 0, 90]
    });

    var then = 0;
    var delta = {
      ms: 0,
      s: 0
    };

    // --------------------------------------------------------------------------------------------
    // Loop
    const loop = now => {
      delta.ms = now - then;
      delta.s = delta.ms / 1000;
      then = now;

      /*
      if (canvas.width != canvas.clientWidth || canvas.clientHeight != canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        gl.viewport(0, 0, canvas.width, canvas.height);
      }
      */

      // Handle Input

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

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gameObjects.forEach(x => {

        gl.useProgram(shader.program);

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(shader.aPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shader.aPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.vertexAttribPointer(shader.aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shader.aNormal);

        gl.bindBuffer(gl.ARRAY_BUFFER, textureUVBuffer);
        gl.vertexAttribPointer(shader.aTextureUV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shader.aTextureUV);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indiciesBuffer);

        const viewMatrix = mat4.create();
        mat4.lookAt(viewMatrix, camera.position, camera.target, [0,1,0]);

        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, glMatrix.toRadian(camera.fov),
          canvas.width / canvas.height, camera.zNear, camera.zFar);

        const modelMatrix = mat4.create();
        mat4.translate(modelMatrix, modelMatrix, x.position);
        if (x.rotation) {
          mat4.rotate(modelMatrix, modelMatrix, glMatrix.toRadian(x.rotation[0]), [1, 0, 0]);
          mat4.rotate(modelMatrix, modelMatrix, glMatrix.toRadian(x.rotation[1]), [0, 1, 0]);
          mat4.rotate(modelMatrix, modelMatrix, glMatrix.toRadian(x.rotation[2]), [0, 0, 1]);
        }
        if (x.scale) {
          mat4.scale(modelMatrix, modelMatrix, x.scale);
        } 

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, modelMatrix);
        mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(shader.uProjectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(shader.uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(shader.uModelMatrix, false, modelMatrix);
        gl.uniformMatrix4fv(shader.uNormalMatrix, false, normalMatrix);

        //gl.uniform3fv(uViewPosition, false, camera.position);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, x.texture.texture);
        gl.uniform1i(shader.uSampler, 0);
        gl.uniform2fv(shader.uTextureScale, x.texture.scale);

        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
      });

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
};

module.exports = new Game();