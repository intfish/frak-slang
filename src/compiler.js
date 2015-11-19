var glsl = require('glsl-man');

function inspect(o) {
	console.log(require('util').inspect(o, { depth: null }));
}

function getDeclarationsWithQualifier(ast, qualifier) {
	var selector = glsl.query.selector('declarator[typeAttribute] > type[qualifier='+qualifier+']');
	var selectIdentifier = glsl.query.selector('identifier');
	var list = glsl.query.all(ast, selector);
	var result = [];
	for (var i=0; i<list.length; i++) {
		var item = list[i].parent;
		var identifier = glsl.query.first(item, selectIdentifier);
		if (!identifier)
			continue;
		result.push({
			name: identifier.name,
			ast: item
		});
	}
	return result;
}

function getFunctionDeclarations(ast) {
	var selector = glsl.query.selector('function_declaration');
	var list = glsl.query.all(ast, selector);
	var result = {};
	for (var i=0; i<list.length; i++) {
		var fn = list[i];
		result[fn.name] = {
			name: fn.name,
			ast: fn,
			// TODO: identifiers/function_calls
		};
		console.log(fn);
	}
	return result;
}

function compile(source) {
	var ast = glsl.parse(source);
	if (!ast)
		return null;

	console.log('=== AST ===');
	inspect(ast);
	console.log('=== === ===');

	var result = {
		attributes: getDeclarationsWithQualifier(ast, 'attribute'),
		uniforms: getDeclarationsWithQualifier(ast, 'uniform'),
		varyings: getDeclarationsWithQualifier(ast, 'varying'),
		functions: getFunctionDeclarations(ast)
	};

	return result;
}

module.exports = compile;
