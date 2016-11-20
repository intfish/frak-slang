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
struct Value {
	vec4 color;
	float second;
};
Value lighting() {
	Value value;
	value.color = texture2D(diffuse0, uv0);
#ifdef DISABLE_RED
	value.color.r = 0.0;
#endif
	value.color.a += bias;
	return value;
}
void main() {
	Value v = lighting();
	gl_FragColor = clamp(v.color, 0.0, 1.0);
}
