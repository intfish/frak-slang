var glsl = require('glsl-man');
var DepGraph = require('dependency-graph').DepGraph;

function getUniformOrGlobal(name, data) {
	if (name in data.uniforms)
		return data.uniforms[name];
	if (name in data.globals)
		return data.globals[name];
	return null;
}

function dependencies(fn, data, result) {
	if (!result) {
		result = {
			variables: {},
			functions: {},
			graph: new DepGraph()
		};
		result.graph.addNode(fn.name);
		result.functions[fn.name] = fn.ast;
	}

	for (var i=0; i<fn.identifiers.length; i++) {
		var ident = fn.identifiers[i];
		var v = getUniformOrGlobal(ident.name, data);
		if (v) {
			result.graph.addNode(ident.name);
			result.graph.addDependency(fn.name, ident.name);
			result.variables[ident.name] = v.ast;
		}
	}

	for (var i=0; i<fn.function_calls.length; i++) {
		var call = fn.function_calls[i];
		if (!(call.function_name in data.functions) || call.function_name == fn.name) {
			continue;
		}
		result.graph.addNode(call.function_name);
		result.graph.addDependency(fn.name, call.function_name);

		var f = data.functions[call.function_name];
		result.functions[call.function_name] = f.ast;
		dependencies(f, data, result);
	}

	return result;
}

function compileVertex(data, strOpt) {
	if (!('vertex' in data.functions))
		throw new Error('No vertex() function found.');

	var scope = glsl.wrap();

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
	var deps = dependencies(vert, data);
	var order = deps.graph.overallOrder();

	// Global variables
	for (var i=0; i<order.length; i++) {
		var name = order[i];
		if (name in deps.variables)
			scope.statements.push(deps.variables[name]);
	}

	// Functions
	for (var i=0; i<order.length; i++) {
		var name = order[i];
		if (name in deps.functions)
			scope.statements.push(deps.functions[name]);
	}

	vert.ast.name = 'main';
	return glsl.string(scope, strOpt);
}

function compileFragment(data, strOpt) {
	if (!('fragment' in data.functions))
		throw new Error('No fragment() function found.');

	var scope = glsl.wrap();

	// Varyings
	for (var name in data.varyings) {
		var item = data.varyings[name];
		scope.statements.push(item.ast);
	}

	var frag = data.functions['fragment'];
	var deps = dependencies(frag, data);
	var order = deps.graph.overallOrder();

	// Global variables
	for (var i=0; i<order.length; i++) {
		var name = order[i];
		if (name in deps.variables)
			scope.statements.push(deps.variables[name]);
	}

	// Functions
	for (var i=0; i<order.length; i++) {
		var name = order[i];
		if (name in deps.functions)
			scope.statements.push(deps.functions[name]);
	}

	frag.ast.name = 'main';
	return glsl.string(scope, strOpt);
}

function compile(extracted) {
	var stringifyOptions = {};

	if ('main' in extracted.functions) {
		throw new Error("Declaration of function main() not allowed");
	}

	/*for (var i=0; i<extracted.ast.statements.length; i++) {
		var statement = extracted.ast.statements[i];
		console.log('#%s: ', i, statement.type);
	}*/

	var shaders = {
		vertex: compileVertex(extracted, stringifyOptions),
		fragment: compileFragment(extracted, stringifyOptions)
	};
	return shaders;
}

module.exports = compile;
