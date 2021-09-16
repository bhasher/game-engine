#version 300 es

precision highp float;

in highp vec2 vTextureUV;

uniform sampler2D uSampler;
uniform vec2 uTextureScale;

out vec4 fragmentColor;

void main(void) {
  fragmentColor = texture(uSampler, vTextureUV * uTextureScale);
}