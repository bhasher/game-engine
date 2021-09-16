import { ShaderRegistry, Shader, ShaderData } from './types/shader';
import { Texture, TextureRegistry } from './types/texture';
import { BuffersRegistry, Buffers } from './types/buffers';
import { GameObject } from './types/gameObject';
import { RidgidBody } from './types/physics/ridgidBody';
import { ForceRegistration, ForceRegistry } from './types/physics/forceRegistry';
import { GravityGenerator } from './types/physics/gravityGenerator';
import { CollisionSystem } from './types/collision/collisionSystem';
import { CircleCollider, AABBCollider } from './types/collision/collider';
import { glMatrix, mat4, vec3 } from 'gl-matrix';
import * as input from './input';
//import { ipcRenderer } from 'electron';
import { GameState } from './gameState';
import { createPublicKey } from 'crypto';
import { FileManager } from './types/fileManager';

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
          type: gl.VERTEX_SHADER
        }), new ShaderData({
          file: 'cube.frag',
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
          type: gl.VERTEX_SHADER
        }, {
          file: 'basic.frag',
          type: gl.FRAGMENT_SHADER,
        }]
      })
    ]);

    // --------------------------------------------------------------------------------------------
    // Meshes
    //MeshRegistery.loadMeshes(['cube', 'barrel']);

    // --------------------------------------------------------------------------------------------
    // BUFFERS

    const bufferRegistry = new BuffersRegistry([
      new Buffers('cube'),
      new Buffers('barrel')
    ]);




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
      position: new Float32Array([0, 1.77, 0]),
      target: vec3.create(),
      yaw: 0,
      pitch: 0,
      fov: 90,
      zNear: 0.1,
      zFar: 100
    };

    /* CUBES */

    // The Ground
    var gameObjects: Array<GameObject> = [];
    for (var x = -16; x <= 16; x++) {
      for (var z = -16; z <= 16; z++) {
        gameObjects.push(new GameObject({
          position: [x, 0, z],
          texture: textureRegistry.getTextureByName('gravel'),
          shader: shaderRegistry.getShaderByName('cube'),
          scale: [1, 1, 1],
          buffers: bufferRegistry.getByName('cube'),
          collider: new AABBCollider({
            halfSize: 0.5
          })
        }));
      }
    };

    // Side Walls
    for (var z = -15; z <= 15; z++) {
      for (var y = 1; y <= 2; y++) {
        gameObjects.push(new GameObject({
          position: [-15, y, z],
          texture: textureRegistry.getTextureByName('rocks'),
          shader: shaderRegistry.getShaderByName('cube'),
          buffers: bufferRegistry.getByName('cube'),
          collider: new AABBCollider({
            halfSize: 0.5
          })
        }));
        gameObjects.push(new GameObject({
          position: [15, y, z],
          texture: textureRegistry.getTextureByName('rocks'),
          shader: shaderRegistry.getShaderByName('cube'),
          buffers: bufferRegistry.getByName('cube'),
          collider: new AABBCollider({
            halfSize: 0.5
          })
        }));
      }    
    };

    // Pillars
    for (var y = 1; y <= 4; y++) {
      [[3,2],[8,7],[2,-5]].forEach(pair=>{
        gameObjects.push(new GameObject({
          position: [ pair[0], y, pair[1] ],
          texture: textureRegistry.getTextureByName('rocks'),
          shader: shaderRegistry.getShaderByName('cube'),
          buffers: bufferRegistry.getByName('cube'),
          collider: new AABBCollider({
            halfSize: 0.5
          })
        }));
      });
    }

    const player = new GameObject({
      position: [0, 10, 0],
      texture: textureRegistry.getTextureByName('rocks'),
      shader: shaderRegistry.getShaderByName('cube'),
      buffers: bufferRegistry.getByName('cube'),
      ridgidBody: new RidgidBody({
        mass: 2
      }),
      collider: new CircleCollider({
        postion: [0, 0, 0],
        radius: 0.5
      })
    });
    gameObjects.push(player);

    ForceRegistry.add(new ForceRegistration({
      ridgidBody: gameObjects[gameObjects.length - 1].ridgidBody,
      forceGenerator: new GravityGenerator(9.807)
    }));


    /* The sun! */

    const lightPosition = [0, 5, 0];

    gameObjects.push(new GameObject({
      position: lightPosition,
      texture: textureRegistry.getTextureByName('the-sun'),
      scale: [1, 1, 1],
      rotation: [0, 0, 90],
      shader: shaderRegistry.getShaderByName('basic'),
      buffers: bufferRegistry.getByName('cube')
    }));

    /* Barrel */

    [[-5,-5], [5, 5], [10, -5]].forEach(x => {
      gameObjects.push(new GameObject({
        position: [x[0], .5, x[1]],
        texture: textureRegistry.getTextureByName('barrel'),
        scale: [0.5, 0.5, 0.5],
        shader: shaderRegistry.getShaderByName('cube'),
        buffers: bufferRegistry.getByName('barrel'),
        collider: new AABBCollider({
          position: [0, 0, 0],
          halfSize: 0.7
        })
      }));
    });

    // --------------------------------------------------------------------------------------------
    // Electron IPC

    // ipcRenderer.on('pause', (event, store) => {
    //   GameState.paused = !GameState.paused;
    //   if (!GameState.paused)
    //     requestAnimationFrame(loop);
    // });

    // --------------------------------------------------------------------------------------------
    // Loop

    gl.clearColor(0.1, 0.0, 0.8, 1.0);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LESS);

    var then = 0;
    const delta = {
      ms: 0,
      s: 0
    };

    const totalTime = {
      s: 0,
      ms: 0
    };

    var lastFPSupdate = 0;
    var fpsList = [];

    var pressedJump = false;

    const loop = now => {
      if (GameState.paused) {
        GameState.pausedTime = now;
        return;
      }

      if (GameState.pausedTime) {
        delta.ms = GameState.pausedTime - then;
        GameState.pausedTime = null;
      } else {
        delta.ms = now - then;
      }
      delta.s = delta.ms / 1000;
      then = now;

      totalTime.ms += delta.ms;
      totalTime.s += delta.s;

      vm.setFPS(Math.round(1 / delta.s));
      fpsList.push(1 / delta.s);
      if (totalTime.s - lastFPSupdate >= 1) {
        GameState.isOneSecondTickFrame = true;
        var avg_fps = Math.round(avg_fps = (fpsList.reduce((a, b) => a + b) / fpsList.length));
        vm.setAvgFPS(avg_fps);
        fpsList = [];
        lastFPSupdate = totalTime.s;
      }  else {
        GameState.isOneSecondTickFrame = false;
      }

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
        vec3.add(player.position, player.position, moveDirection);
        camera.position = new Float32Array([player.position[0], player.position[1] + 1.27, player.position[2]]);

        const spin = vec3.create();
        vec3.rotateY(spin, [0, 0, -1], [0, 0, 0], camera.yaw);
        vec3.add(camera.target, spin, camera.position);
        camera.target[1] = camera.position[1] + camera.pitch;

        if (input.getBindingByName('jump').pressed) {
          pressedJump = true;
        }
        input.flush();
      }
      
      // ------------------------------------------------------------------------------------------
      // Physics

      ForceRegistry.update(delta.s);
      CollisionSystem.TestCollisions(gameObjects);

      if (pressedJump) {
        player.ridgidBody.velocity[1] += 6;
        pressedJump = false;
      }    

      // ------------------------------------------------------------------------------------------
      // Animate Light

      // const lightOffset = 12;
      // lightPosition[0] = Math.sin(totalTime.s) * lightOffset;
      // lightPosition[2] = Math.cos(totalTime.s) * lightOffset;



      // ------------------------------------------------------------------------------------------
      // Render Game Objects

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      
      gameObjects.forEach(gameObj => {

        if (gameObj.ridgidBody != null) {
          gameObjects.filter(x => x.ridgidBody != null).forEach(x => x.ridgidBody.integrate(delta.s));    
        }

        
        
        if (gameObj.shader.program != shaderRegistry.lastUsedShader) {
          gl.useProgram(gameObj.shader.program);
          shaderRegistry.lastUsedShader = gameObj.shader.program;
        }
        

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
          gl.uniform3fv(gameObj.shader.uLightPosition, lightPosition);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, gameObj.texture.texture);
        gl.uniform1i(gameObj.shader.uSampler, 0);
        gl.uniform2fv(gameObj.shader.uTextureScale, gameObj.texture.scale);

        gl.drawElements(gl.TRIANGLES, gameObj.buffers.indexLength, gl.UNSIGNED_SHORT, 0);

        //gl.drawElements(gl.LINES, gameObj.buffers.indexLength, gl.UNSIGNED_SHORT, 0);
      });

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
};

var game = new Game();
game.start();