#version 300 es

in vec3 aPosition;
in vec2 aTextureUV;

uniform mat4 uProjectionMatrix; 
uniform mat4 uViewMatrix; 
uniform mat4 uModelMatrix;

out highp vec2 vTextureUV;

void main(void) {
  vTextureUV = aTextureUV;
  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
}