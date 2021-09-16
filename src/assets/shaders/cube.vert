#version 300 es

in vec3 aPosition;
in vec3 aNormal;
in vec2 aTextureUV;

uniform mat4 uProjectionMatrix; 
uniform mat4 uViewMatrix; 
uniform mat4 uModelMatrix;

out highp vec3 vNormal;
out highp vec2 vTextureUV;
out highp vec3 vFragPosition;

void main(void) {
  highp vec4 fragPosition = uModelMatrix * vec4(aPosition, 1.0);
  vFragPosition = vec3(fragPosition);

  vTextureUV = aTextureUV;
  vNormal = mat3(transpose(inverse(uModelMatrix))) * aNormal;

  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
}