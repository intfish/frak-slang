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
		console.log('#%s: ', i, statements[i].type);
		switch (stmt.type) {
			case 'preprocessor':
				// TODO: evaluate things that are passed in 'defines'
				scope.statements.push(stmt);
				break;

			case 'precision':
				scope.statements.push(stmt);
				break;

			case 'declarator':
				if (glsl.query.first(stmt, isAttribute) && isVertex) {
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
					console.log('\tUNHANDLED VARIABLE!', stmt);
				}
				break;

			case 'function_declaration':
				if (stmt.name in deps.functions) {
					scope.statements.push(stmt);
				}
				break;

			default:
				console.log('\tUNHANDLED!');
				break;
		}
	}
}

function compileVertex(data, strOpt, defines) {
	if (!('vertex' in data.functions))
		throw new Error('No vertex() function found.');

	var vert = data.functions['vertex'];
	var deps = dependencies(vert, data);
	// var order = deps.graph.overallOrder();
	// console.log('deps = ', deps);
	// console.log('order = ', order);

	defines.__VERTEX__ = true;
	defines.__FRAGMENT__ = false;

	var scope = glsl.wrap();

	var statements = data.ast.statements;
	compileRootStatements(statements, scope, deps, defines, true);
	// for (var i=0; i<statements.length; i++) {
	// 	var stmt = statements[i];
	// 	console.log('#%s: ', i, statements[i].type);
	// 	switch (stmt.type) {
	// 		case 'preprocessor':
	// 			// TODO: evaluate things that are passed in 'defines'
	// 			scope.statements.push(stmt);
	// 			break;
	//
	// 		case 'precision':
	// 			scope.statements.push(stmt);
	// 			break;
	//
	// 		case 'declarator':
	// 			if (glsl.query.first(stmt, isAttribute) ||
	// 				glsl.query.first(stmt, isVarying)) {
	// 				scope.statements.push(stmt);
	// 			}
	// 			else if (glsl.query.first(stmt, isUniform)) {
	// 				var identifier = glsl.query.first(stmt, selectIdentifiers);
	// 				if (identifier.name in deps.variables) {
	// 					scope.statements.push(stmt);
	// 				}
	// 			}
	// 			break;
	//
	// 		case 'function_declaration':
	// 			if (stmt.name in deps.functions) {
	// 				scope.statements.push(stmt);
	// 			}
	// 			break;
	//
	// 		default:
	// 			console.log('\tUNHANDLED!');
	// 			break;
	// 	}
	// }
// traverse ast root:
//   - if preprocessor: pass through or handle depending on operation
//   - if attribute: only in vert
//   - if uniform: check deps
//   - if varying: always pass through
//   - if const or global variable: check deps
//   - if function: check deps

	// // Attributes
	// for (var name in data.attributes) {
	// 	var item = data.attributes[name];
	// 	scope.statements.push(item.ast);
	// }
	//
	// // Varyings
	// for (var name in data.varyings) {
	// 	var item = data.varyings[name];
	// 	scope.statements.push(item.ast);
	// }
	//
	// // Global variables
	// for (var i=0; i<order.length; i++) {
	// 	var name = order[i];
	// 	if (name in deps.variables)
	// 		scope.statements.push(deps.variables[name]);
	// }
	//
	// // Functions
	// for (var i=0; i<order.length; i++) {
	// 	var name = order[i];
	// 	if (name in deps.functions)
	// 		scope.statements.push(deps.functions[name]);
	// }

	vert.ast.name = 'main';
	defines.__VERTEX__ = false;
	return glsl.string(scope, strOpt);
}

function compileFragment(data, strOpt, defines) {
	if (!('fragment' in data.functions))
		throw new Error('No fragment() function found.');

	var frag = data.functions['fragment'];
	var deps = dependencies(frag, data);
	var order = deps.graph.overallOrder();

	defines.__VERTEX__ = false;
	defines.__FRAGMENT__ = true;

	var scope = glsl.wrap();

	// Varyings
	for (var name in data.varyings) {
		var item = data.varyings[name];
		scope.statements.push(item.ast);
	}


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
	defines.__FRAGMENT__ = false;
	return glsl.string(scope, strOpt);
}

function compile(extracted, defines) {
	defines = extend(DEFAULT_DEFINES, defines);

	var stringifyOptions = {};

	if ('main' in extracted.functions) {
		throw new Error("Declaration of function main() not allowed");
	}

	/*for (var i=0; i<extracted.ast.statements.length; i++) {
		var statement = extracted.ast.statements[i];
		console.log('#%s: ', i, statement.type);
	}*/

	var shaders = {
		vertex: compileVertex(extracted, stringifyOptions, defines),
		fragment: compileFragment(extracted, stringifyOptions, defines)
	};
	return shaders;
}

module.exports = compile;
