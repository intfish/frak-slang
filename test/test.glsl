// Diffuse shader
#ifdef GL_ES
precision highp float;
#endif

precision highp int;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 texcoord2d0;

uniform mat4 projection;
uniform mat4 modelview;
uniform vec4 diffuse;
uniform sampler2D diffuse0;

#define MAGIC

#ifdef MAGIC
uniform vec4 magic;
#endif

#ifdef __VERTEX__
uniform vec3 vertOnlyUniform;
#endif

#ifdef __FRAGMENT__
uniform vec3 fragOnlyUniform;
#endif

#ifndef __VERTEX__
uniform int alwaysIncludedInFragment;
#endif

varying vec2 uv0;

const float bias = 0.001;
vec3 scale = vec3(0.5, 0.5, 0.5);

struct Value {
	vec4 color;
	float second;
};

float unused(float a) {
	return a * a;
}

Value lighting() {
	Value value;
	value.color = texture2D(diffuse0, uv0);
#ifdef DISABLE_RED
	value.color.r = 0.0;
#endif
	value.color.a += bias;
	return value;
}

void fragment(void) {
	Value v = lighting();
	gl_FragColor = clamp(v.color, 0.0, 1.0);
}

void vertex() {
	uv0 = texcoord2d0;
	gl_Position = projection * modelview * vec4(position * scale, 1.0);
}
