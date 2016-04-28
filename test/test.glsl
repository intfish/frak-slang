// Diffuse shader
#ifdef GL_ES
precision highp float;
#endif

precision mediump int;

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

varying vec2 uv0;

const float bias = 0.001;
vec3 scale = vec3(0.5, 0.5, 0.5);

// Parser does not handle this
// struct TheStruct
// {
// 	vec3 first;
// 	vec4 second;
// 	mat4x3 third;
// };
// uniform TheStruct aUniformOfArrayType;

float unused(float a) {
	return a * a;
}

vec4 lighting() {
	vec4 textureColor = texture2D(diffuse0, uv0);
#ifdef DISABLE_RED
	textureColor.r = 0.0;
#endif
	textureColor.a += bias;
	return textureColor;
}

void fragment(void) {
	vec4 color = lighting();
	gl_FragColor = clamp(color, 0.0, 1.0);
}

void vertex() {
	uv0 = texcoord2d0;
	gl_Position = projection * modelview * vec4(position * scale, 1.0);
}
