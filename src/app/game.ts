import { ShaderRegistry, Shader, ShaderData } from './types/shader';
import { Texture, TextureRegistry } from './types/texture';
import { BuffersRegistry, Buffers } from './types/buffers';
import { GameObject } from './types/gameObject';
const { glMatrix, mat4, vec3, vec2 } = require('gl-matrix');
const input = require('./input');
const fs = require('fs');

export class Game {

  start() {

    console.log('started');

    if (gl === null) {
      alert('GL broken');
      return;
    }

    // --------------------------------------------------------------------------------------------
    // SHADERS

    const shaderRegistry: ShaderRegistry = new ShaderRegistry([
      new Shader({
        name: 'cube',
        attribs: ['aPosition', 'aNormal', 'aTextureUV'],
        uniforms: [
          'uProjectionMatrix', 'uViewMatrix', 'uModelMatrix',
          'uSampler', 'uTextureScale', 'uLightPosition', 'uViewPosition'
        ],
        data: [new ShaderData({
          file: 'cube.vert',
          src: fs.readFileSync(`${__dirname}/shaders/cube.vert`),
          type: gl.VERTEX_SHADER
        }), new ShaderData({
          file: 'cube.frag',
          src: fs.readFileSync(`${__dirname}/shaders/cube.frag`),
          type: gl.FRAGMENT_SHADER,
        })]
      }),
      new Shader({
        name: 'basic',
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
      })
    ]);

    // --------------------------------------------------------------------------------------------
    // BUFFERS

    const bufferRegistry = new BuffersRegistry([
      new Buffers('cube'),
      new Buffers('barrel')
    ]);

    gl.clearColor(0.1, 0.0, 0.8, 1.0);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LEQUAL);


    // --------------------------------------------------------------------------------------------
    // Textures

    const textureRegistry = new TextureRegistry([
      new Texture('gravel'),
      new Texture('rocks'),
      new Texture('the-sun'),
      new Texture('barrel')
    ]);

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

    var gameObjects: Array<GameObject> = [];
    for (var x = -16; x <= 16; x+=2) {
      for (var z = -16; z <= 16; z+=2) {
        gameObjects.push(new GameObject({
          position: [x, -3, z],
          texture: textureRegistry.getTextureByName('gravel'),
          shader: shaderRegistry.getShaderByName('cube'),
          scale: [1, 1, 1],
          buffers: bufferRegistry.getByName('cube')
        }));
      }
    };

    for (var z = -15; z <= 15; z+=2) {
      gameObjects.push(new GameObject({
        position: [-15, -1, z],
        texture: textureRegistry.getTextureByName('rocks'),
        shader: shaderRegistry.getShaderByName('cube'),
        buffers: bufferRegistry.getByName('cube')
      }));
      gameObjects.push(new GameObject({
        position: [15, -1, z],
        texture: textureRegistry.getTextureByName('rocks'),
        shader: shaderRegistry.getShaderByName('cube'),
        buffers: bufferRegistry.getByName('cube')
      }));
    };

    for (var y = -1; y <= 3; y+=2) {
      [[3,2],[8,7],[2,-5]].forEach(pair=>{
        gameObjects.push(new GameObject({
          position: [ pair[0], y, pair[1] ],
          texture: textureRegistry.getTextureByName('rocks'),
          shader: shaderRegistry.getShaderByName('cube'),
          buffers: bufferRegistry.getByName('cube')
        }));
      });
    }


    /* The sun! */

    const lightPosition = [-25, 20, 5];

    gameObjects.push(new GameObject({
      position: lightPosition,
      texture: textureRegistry.getTextureByName('the-sun'),
      scale: [5, 5, 5],
      rotation: [0, 0, 90],
      shader: shaderRegistry.getShaderByName('basic'),
      buffers: bufferRegistry.getByName('cube')
    }));

    /* Barrel */

    [[-5,-5], [5, 5], [10, -5]].forEach(x => {
      gameObjects.push(new GameObject({
        position: [x[0], -2, x[1]],
        texture: textureRegistry.getTextureByName('barrel'),
        scale: [0.5, 0.5, 0.5],
        shader: shaderRegistry.getShaderByName('cube'),
        buffers: bufferRegistry.getByName('barrel')
      }));
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