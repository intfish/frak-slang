#ifdef GL_ES
precision highp float;
#endif
precision highp int;
attribute vec3 position;
attribute vec3 normal;
attribute vec2 texcoord2d0;
uniform mat4 projection;
uniform mat4 modelview;
#define MAGIC
#ifdef MAGIC
uniform vec4 magic;
#endif
uniform vec3 vertOnlyUniform;
varying vec2 uv0;
vec3 scale = vec3(0.5, 0.5, 0.5);
struct Value {
	vec4 color;
	float second;
};
void main() {
	uv0 = texcoord2d0;
	gl_Position = (projection * modelview) * vec4(position * scale, 1.0);
}
