var glsl = require('glsl-man');

function inspect(o) {
	console.log(require('util').inspect(o, { depth: null }));
}

function findVariable(name, data) {
	if (name in data.uniforms)
		return data.uniforms[name];
	if (name in data.globals)
		return data.globals[name];
	return null;
}

function findDeps(fn, data, deps) {
	for (var i=0; i<fn.identifiers.length; i++) {
		var ident = fn.identifiers[i];
		var v = findVariable(ident.name, data);
		if (v)
			deps.push(v.ast);
	}

	for (var i=0; i<fn.function_calls.length; i++) {
		var call = fn.function_calls[i];
		if (!(call.function_name in data.functions) || call.function_name == fn.name) {
			continue;
		}
		deps.push(data.functions[call.function_name].ast);
		findDeps(data.functions[call.function_name], data, deps);
	}

	return deps;
}

function compileVertex(data, strOpt) {
	if (!('vertex' in data.functions))
		throw new Error('No vertex() function found.');

	var buffer = [];

	//var scope = glsl.wrap(); // Not yet implemented in glsl-man
	var scope = glsl.parse('');

	// Attributes
	for (var name in data.attributes) {
		var item = data.attributes[name];
		scope.statements.push(item.ast);
	}

	// Varyings
	for (var name in data.varyings) {
		var item = data.varyings[name];
		scope.statements.push(item.ast);
	}

	var vert = data.functions['vertex'];
	var deps = [];
	findDeps(vert, data, deps);
	//console.log('vert deps:', deps);
	for (var i=0; i<deps.length; i++) {
		scope.statements.push(deps[i]);
	}

	vert.ast.name = 'main';
	scope.statements.push(vert.ast);

	return glsl.string(scope, strOpt);
}

function compileFragment(data, strOpt) {
	if (!('fragment' in data.functions))
		throw new Error('No fragment() function found.');

	var scope = glsl.parse('');

	// Varyings
	for (var name in data.varyings) {
		var item = data.varyings[name];
		scope.statements.push(item.ast);
	}

	var frag = data.functions['fragment'];
	var deps = [];
	findDeps(frag, data, deps);
	//console.log('frag deps:', deps);
	for (var i=0; i<deps.length; i++) {
		scope.statements.push(deps[i]);
	}

	frag.ast.name = 'main';
	scope.statements.push(frag.ast);

	return glsl.string(scope, strOpt);
}

function compile(extracted) {
	var stringifyOptions = {};
	//console.log(extracted);

	var shaders = {
		vertex: compileVertex(extracted, stringifyOptions),
		fragment: compileFragment(extracted, stringifyOptions)
	};
	return shaders;
}

module.exports = compile;
