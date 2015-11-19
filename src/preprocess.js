var extend = require('./extend');

function includes(source, parent) {
	var INCLUDES = /^(#include)\s+"([^"\\]*(\\.[^"\\]*)*)"[ ]*\r?(?:\n|$)/mg;
	var list = [];
	var previousIndex = 0;
	while ((match = INCLUDES.exec(source)) !== null) {
		var preceding = source.substring(previousIndex, match.index);
		previousIndex = INCLUDES.lastIndex;
		var include = {
			preceding: preceding,
			include: match[2],
			children: [],
			parent: parent
		};
		list.push(include);
	}
	var tail = {
		preceding: source.substring(previousIndex),
		include: false,
		children: [],
		parent: parent
	};
	list.push(tail);
	return list;
}

function load(list, fnGetSource, fnDone) {
	var index = 0;
	(function next() {
		if (index == list.length) {
			return fnDone();
		}

		var item = list[index++];
		if (!item.include)
			return next();

		var parentInclude = false;
		if (item.parent) {
			if (item.parent.includeResolved)
				parentInclude = item.parent.includeResolved;
			else
				parentInclude = item.parent.include;
		}

		fnGetSource(item.include, parentInclude, function(source, resolvedInclude) {
			item.content = source;
			item.includeResolved = resolvedInclude;
			next();
		});
	})();
}

function parse(list, options, done) {
	load(list, options.include, function() {
		var index = 0;
		(function next() {
			if (index == list.length) {
				return done();
			}
			var item = list[index++];
			if (!item.include)
				return next();
			item.children = includes(item.content, item);
			parse(item.children, options, function() {
				next();
			});
		})();
	});
}

function join(list) {
	var output = '';
	for (var i=0; i<list.length; i++) {
		var item = list[i];
		output += item.preceding;
		if (item.children.length > 0)
			output += join(item.children);
	}
	return output;
}

function preprocess(source, options, done) {
	options = extend({
		include: function(file, parent, done) { done("// include: " + file + "\n"); }
	}, options);

	var parts = includes(source, null);
	parse(parts, options, function() {
		done(join(parts));
	});
}

module.exports = preprocess;
