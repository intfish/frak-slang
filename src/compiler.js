'use strict';

var glsl = require('glsl-man');
var DepGraph = require('dependency-graph').DepGraph;
var extend = require('./extend');
// var extractor = require('./extractor');

var DEFAULT_DEFINES = {
	__VERTEX__: false,
	__FRAGMENT__: false,
};

var isAttribute = glsl.query.selector('declarator[typeAttribute] > type[qualifier=attribute]');
var isUniform = glsl.query.selector('declarator[typeAttribute] > type[qualifier=uniform]');
var isVarying = glsl.query.selector('declarator[typeAttribute] > type[qualifier=varying]');
var isConst = glsl.query.selector('declarator[typeAttribute] > type[qualifier=const]');
var isGlobal = glsl.query.selector('declarator[typeAttribute] > type:not([qualifier])');
var selectIdentifiers = glsl.query.selector('identifier');

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

function compileRootStatements(statements, scope, deps, defines, isVertex) {
	for (var i=0; i<statements.length; i++) {
		var stmt = statements[i];
		switch (stmt.type) {
			case 'preprocessor':
				if (stmt.directive == '#ifdef' && stmt.value in defines) {
					if (!!defines[stmt.value]) {
						for (var j=0; j<stmt.guarded_statements.length; j++) {
							scope.statements.push(stmt.guarded_statements[j]);
						}
					}
				}
				else if (stmt.directive == '#ifndef' && stmt.value in defines) {
					if (!defines[stmt.value]) {
						for (var j=0; j<stmt.guarded_statements.length; j++) {
							scope.statements.push(stmt.guarded_statements[j]);
						}
					}
				}
				else {
					scope.statements.push(stmt);
				}
				break;

			case 'precision':
				scope.statements.push(stmt);
				break;

			case 'declarator':
				if (glsl.query.first(stmt, isAttribute)) {
					if (isVertex)
						scope.statements.push(stmt);
				}
				else if (glsl.query.first(stmt, isVarying)) {
					scope.statements.push(stmt);
				}
				else if (glsl.query.first(stmt, isUniform)) {
					var identifier = glsl.query.first(stmt, selectIdentifiers);
					if (identifier.name in deps.variables) {
						scope.statements.push(stmt);
					}
				}
				else if (glsl.query.first(stmt, isConst) || glsl.query.first(stmt, isGlobal)) {
					var identifier = glsl.query.first(stmt, selectIdentifiers);
					if (identifier.name in deps.variables) {
						scope.statements.push(stmt);
					}
				}
				else {
					var name = '<No identifier found>';
					var identifier = glsl.query.first(stmt, selectIdentifiers);
					if (identifier)
						name = identifier.name;
					throw new Error('Compiler issue: unhandled variable `' + name + '`');
				}
				break;

			case 'function_declaration':
				if (stmt.name in deps.functions) {
					scope.statements.push(stmt);
				}
				break;

			default:
				throw new Error('Compiler issue: unhandled statement of type `' + stmt.type + '`');
		}
	}
}

function compileVertex(data, strOpt, defines) {
	if (!('vertex' in data.functions))
		throw new Error('No vertex() function found.');

	var scope = glsl.wrap();
	var vert = data.functions['vertex'];
	var deps = dependencies(vert, data);
	var statements = data.ast.statements;

	defines.__VERTEX__ = true;
	defines.__FRAGMENT__ = false;
	compileRootStatements(statements, scope, deps, defines, true);
	defines.__VERTEX__ = false;

	vert.ast.name = 'main';
	return glsl.string(scope, strOpt);
}

function compileFragment(data, strOpt, defines) {
	if (!('fragment' in data.functions))
		throw new Error('No fragment() function found.');

	var scope = glsl.wrap();
	var frag = data.functions['fragment'];
	var deps = dependencies(frag, data);
	var statements = data.ast.statements;

	defines.__VERTEX__ = false;
	defines.__FRAGMENT__ = true;
	compileRootStatements(statements, scope, deps, defines, false);
	defines.__FRAGMENT__ = false;

	frag.ast.name = 'main';
	return glsl.string(scope, strOpt);
}

function compile(extracted, defines) {
	defines = extend(DEFAULT_DEFINES, defines);

	var stringifyOptions = {};

	if ('main' in extracted.functions) {
		throw new Error("Declaration of function main() not allowed");
	}

	var shaders = {
		vertex: compileVertex(extracted, stringifyOptions, defines),
		fragment: compileFragment(extracted, stringifyOptions, defines)
	};
	return shaders;
}

module.exports = compile;
