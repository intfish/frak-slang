var glsl = require('glsl-man');

function inspect(o) {
	console.log(require('util').inspect(o, { depth: null }));
}

function getDeclarationsWithQualifier(ast, qualifier) {
	var selector = glsl.query.selector('declarator[typeAttribute] > type[qualifier='+qualifier+']');
	var selectIdentifiers = glsl.query.selector('identifier');
	var list = glsl.query.all(ast, selector);
	var result = {};
	for (var i=0; i<list.length; i++) {
		var item = list[i].parent;
		var identifier = glsl.query.first(item, selectIdentifiers);
		if (!identifier)
			continue;
		result[identifier.name] = {
			name: identifier.name,
			ast: item
		};
	}
	return result;
}

function getFunctionDeclarations(ast) {
	var selector = glsl.query.selector('function_declaration');
	var selectFnCalls = glsl.query.selector('function_call');
	var selectIdentifiers = glsl.query.selector('identifier');
	var list = glsl.query.all(ast, selector);
	var result = {};
	for (var i=0; i<list.length; i++) {
		var fn = list[i];
		var calls = glsl.query.all(fn, selectFnCalls);
		var identifiers = glsl.query.all(fn, selectIdentifiers);
		result[fn.name] = {
			name: fn.name,
			ast: fn,
			function_calls: calls,
			identifiers: identifiers
		};
	}
	return result;
}

function getGlobals(ast) {
	var selectIdentifiers = glsl.query.selector('identifier');
	var selectGlobals = glsl.query.selector('root > declarator[typeAttribute] > type:not([qualifier])');
	var result = getDeclarationsWithQualifier(ast, 'const');
	var list = glsl.query.all(ast, selectGlobals);
	for (var i=0; i<list.length; i++) {
		var item = list[i].parent;
		var identifier = glsl.query.first(item, selectIdentifiers);
		if (!identifier)
			continue;
		result[identifier.name] = {
			name: identifier.name,
			ast: item
		};
	}
	return result;
}

function compile(source) {
	var ast = glsl.parse(source);
	if (!ast)
		return null;

	// console.log('=== AST ===');
	// inspect(ast);
	// console.log('=== === ===');

	var result = {
		attributes: getDeclarationsWithQualifier(ast, 'attribute'),
		uniforms: getDeclarationsWithQualifier(ast, 'uniform'),
		varyings: getDeclarationsWithQualifier(ast, 'varying'),
		globals: getGlobals(ast),
		functions: getFunctionDeclarations(ast),
	};

	return result;
}

module.exports = compile;