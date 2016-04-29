var extend = require('./src/extend');

var FRAKSlang = {
	extract: require('./src/extractor').extract,
	compileExtracted: require('./src/compiler'),
	preprocess: require('./src/preprocess')
};

FRAKSlang.compile = function(source, options, done) {
	options = extend({
		include: function(file, parent, done) { done("// Warning: include callback not provided: #include " + file + "\n"); },
		sourceURI: null,
	}, options);

	if (!options.sourceURI) {
		throw new Error('Error: no sourceURI option provided');
	}

	if (typeof(done) != 'function') {
		throw new Error('Error: done callback is not a function');
	}

	FRAKSlang.preprocess(source, options, function(data) {
		var extracted = FRAKSlang.extract(data);
		var compiled = FRAKSlang.compileExtracted(extracted);
		done(compiled);
	});
};

module.exports = FRAKSlang;
