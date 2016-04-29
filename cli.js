#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var options = require('commander');
var FRAKSlang = require('./index');
var pkg = require('./package.json');

function list(val) {
	return val.split(',');
}

function error() {
	var args = Array.prototype.slice.call(arguments);
	args.unshift('\n  Error:');
	console.log.apply(console, args);
}

function findFile(file, primaryPath) {
	var paths = [primaryPath];
	if ('include' in options) {
		paths = paths.concat(options.include);
	}
	for (var i=0; i<paths.length; i++) {
		var f = path.join(paths[i], file);
		try {
			fs.accessSync(f, fs.R_OK);
			return f;
		}
		catch(err) {}
	}
	return null;
}

function getSource(file, parent, done) {
	var currentPath = !!parent ? path.dirname(parent) : process.cwd();
	filePath = findFile(file, currentPath);
	if (!filePath) {
		error('Could not find included file:', file);
		process.exit(1);
	}

	fs.readFile(filePath, 'utf8', function(err, data) {
		if (err) {
			error('Could not open included file:', filePath);
			process.exit(1);
		}
		done(data, filePath);
	});
}

options
	.version(pkg.version)
	.arguments('<file>')
	.option('-I --include <paths>', 'Comma separated list of include paths', list)
	.option('-o --output <file>', 'Output file path (required)')
	.option('-t --type <type>', 'Output type: GLSL or JSON', /^(glsl|json)$/i, 'GLSL')
	.parse(process.argv);

if (options.args.length != 1) {
	options.help();
	process.exit(1);
}

if (!('output' in options) || options.output.length == 0) {
	error('You must specify the output (-o) parameter');
	process.exit(1);
}

var type = options.type.toUpperCase();

fs.readFile(options.args[0], 'utf8', function(err, data) {
	if (err) {
		error('Could not open', options.args[0]);
		process.exit(1);
	}

	FRAKSlang.compile(data, {
		include: getSource,
		sourceURI: options.args[0]
	}, function(compiled) {
		if (type == 'GLSL') {
			fs.writeFileSync(options.output + '.vert', compiled.vertex);
			fs.writeFileSync(options.output + '.frag', compiled.fragment);
			console.log('  Output written to %s.vert, %s.frag', options.output, options.output);
		}
		else if (type == 'JSON') {
			fs.writeFileSync(options.output, JSON.stringify(compiled));
			console.log('  Output written to %s', options.output);
		}
	});
});
