const { glMatrix, mat4, vec3, vec2 } = require('gl-matrix');

const input = require('./input');

const fs = require('fs');

class Game {

  start() {

    /** @type {HTMLCanvasElement} */
    var canvas = document.querySelector("#glCanvas");

    var gl = canvas.getContext("webgl2");

    if (gl === null) {
      alert('GL broken');
      return;
    }

    // ---------------------------------------------------------------------------
    // SHADERS

    const shaders = [{
      file: 'cube.vert',
      type: gl.VERTEX_SHADER
    }, {
      file: 'cube.frag',
      type: gl.FRAGMENT_SHADER,
    }].map(x => {
      x.src = fs.readFileSync(`${__dirname}/${x.file}`);
      return x;
    });

    const shaderProgram = gl.createProgram();

    shaders.forEach(x => {
      x.shader = gl.createShader(x.type);
      gl.shaderSource(x.shader, x.src);
      gl.compileShader(x.shader);
      gl.attachShader(shaderProgram, x.shader);
    });

    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      shaders.forEach(x => {
        if (!gl.getShaderParameter(x.shader, gl.COMPILE_STATUS)) {
          console.error(`Shader Compile Error: ${x.file}: ${gl.getShaderInfoLog(x.shader)}`);
          gl.deleteShader(x.shader);
        }
      });
      console.error(gl.getProgramInfoLog(shaderProgram));
      return null;
    }

    const aVertexPosition = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
    const aVertexNormal = gl.getAttribLocation(shaderProgram, 'aVertexNormal');
    const aTextureUV = gl.getAttribLocation(shaderProgram, 'aTextureUV');

    const uProjectionMatrix = gl.getUniformLocation(shaderProgram, 'uProjectionMatrix');
    const uViewMatrix = gl.getUniformLocation(shaderProgram, 'uViewMatrix');
    const uModelViewMatrix = gl.getUniformLocation(shaderProgram, 'uModelViewMatrix');
    const uNormalMatrix = gl.getUniformLocation(shaderProgram, 'uNormalMatrix');

    const uSampler = gl.getUniformLocation(shaderProgram, 'uSampler');
    const uTextureScale = gl.getUniformLocation(shaderProgram, 'uTextureScale');

    // ---------------------------------------------------------------------------
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
        scale: vec2.fromValues(12,12)
      },
      wall: {
        file: '../assets/rocks.png',
        texture: null,
        scale: vec2.fromValues(7,.5)
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
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
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

    // ---------------------------------------------------------------------------
    // DRAW

    gl.clearColor(0.1, 0.0, 0.8, 1.0);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // ---------------------------------------------------------------------------
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

    var gameObjects = [{
      position: [0,-2.5, 0],
      rotation: [0, 0, 0],
      scale: [15, 1, 15],
      texture: textures.floor
    }, { // Front
      position: [0, -0.5, -15],
      rotation: [ 0, 0, 0],
      scale: [15, 1, 0.5],
      texture: textures.wall
    }, { // Front above
      position: [0, 8, -15],
      rotation: [ 0, 0, 0],
      scale: [15, 1, 0.5],
      texture: textures.wall
    }, { // Pole left
      position: [-6, 4, -15],
      rotation: [ 0, 0, 0],
      scale: [.3, 8, .3],
      texture: textures.wall
    }, { // Pole right
      position: [6, 4, -15],
      rotation: [ 0, 0, 0],
      scale: [.3, 8, .3],
      texture: textures.wall
    }, { // Back
      position: [0, -0.5, 15],
      rotation: [ 0, 180, 0],
      scale: [15, 1, 0.5],
      texture: textures.wall
    }, { // Left
      position: [-15, -0.5, 0],
      rotation: [ 0, 180, 0],
      scale:    [0.5, 1, 15],
      texture: textures.wall
    }, { // Right
      position: [15, -0.5, 0],
      rotation: [ 0, 0, 0],
      scale:    [0.5, 1, 15],
      texture: textures.wall
    }];

    var then = 0;
    var delta = {
      ms: 0,
      s: 0
    };

    // ---------------------------------------------------------------------------
    // Loop
    const loop = now => {
      delta.ms = now - then;
      delta.s = delta.ms / 1000;
      then = now;

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

        gl.useProgram(shaderProgram);

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(aVertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aVertexPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.vertexAttribPointer(aVertexNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aVertexNormal);

        gl.bindBuffer(gl.ARRAY_BUFFER, textureUVBuffer);
        gl.vertexAttribPointer(aTextureUV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aTextureUV);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indiciesBuffer);

        const viewMatrix = mat4.create();
        mat4.lookAt(viewMatrix, camera.position, camera.target, [0,1,0]);

        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, glMatrix.toRadian(camera.fov),
          gl.canvas.clientWidth / gl.canvas.clientHeight, camera.zNear, camera.zFar);

        const modelViewMatrix = mat4.create();
        mat4.translate(modelViewMatrix, modelViewMatrix, x.position);
        mat4.rotate(modelViewMatrix, modelViewMatrix, glMatrix.toRadian(x.rotation[0]), [1, 0, 0]);
        mat4.rotate(modelViewMatrix, modelViewMatrix, glMatrix.toRadian(x.rotation[1]), [0, 1, 0]);
        mat4.rotate(modelViewMatrix, modelViewMatrix, glMatrix.toRadian(x.rotation[2]), [0, 0, 1]);
        mat4.scale(modelViewMatrix, modelViewMatrix, x.scale);

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, modelViewMatrix);
        mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);
        gl.uniformMatrix4fv(uNormalMatrix, false, normalMatrix);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, x.texture.texture);
        gl.uniform1i(uSampler, 0);
        gl.uniform2fv(uTextureScale, x.texture.scale);

        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
      });

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
};

module.exports = new Game();