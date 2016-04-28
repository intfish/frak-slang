#ifdef GL_ES
precision highp float;
#endif
precision highp int;
uniform sampler2D diffuse0;
#define MAGIC
#ifdef MAGIC
uniform vec4 magic;
#endif
uniform vec3 fragOnlyUniform;
uniform int alwaysIncludedInFragment;
varying vec2 uv0;
const float bias = 0.001;
vec4 lighting() {
	vec4 textureColor = texture2D(diffuse0, uv0);
#ifdef DISABLE_RED
	textureColor.r = 0.0;
#endif
	textureColor.a += bias;
	return textureColor;
}
void main() {
	vec4 color = lighting();
	gl_FragColor = clamp(color, 0.0, 1.0);
}
