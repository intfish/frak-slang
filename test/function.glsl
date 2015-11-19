#include "foobar.glsl"

float getValue() {
	float smth = 1.0;
	return smth * 0.5;
}

void fragment() {
	vec3 v = vec3(5);
	float x = v.x;
	float val = getValue() * x;
	gl_FragColor = vec4(val, val, val, 1.0);
}
