#version 300 es

precision highp float;

in highp vec3 vNormal;
in highp vec2 vTextureUV;
in highp vec3 vFragPosition;

uniform sampler2D uSampler;
uniform vec2 uTextureScale;
uniform vec3 uViewPosition;

out vec4 fragmentColor;

void main(void) {
  vec4 objectColor = texture(uSampler, vTextureUV * uTextureScale);

  float ambientStrength = 0.4;
  vec3 lightColor = vec3(1, 0.8, 1) * 0.7;
  vec3 ambientColor = ambientStrength * lightColor;
  
  vec3 lightPosition = vec3(-10,15,-17);
  vec3 lightDirection = normalize(lightPosition - vFragPosition);

  vec3 diffuseColor = max(dot(normalize(vNormal), lightDirection), 0.0) * lightColor;

  vec3 lightingColor = ambientColor + diffuseColor;
  fragmentColor = vec4(objectColor.rbg * lightingColor, objectColor.a);
}