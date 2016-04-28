#!/usr/bin/env node

var options = require('commander');
var pkg = require('./package.json')

function list(val) {
	return val.split(',');
}

options
	.version(pkg.version)
	.arguments('<file>')
	.option('-I --include <paths>', 'Comma separated list of include paths', list)
	.option('-o --output <file>', 'Output file path')
	.option('-t --type <type>', 'Output type: GLSL or JSON', /^(glsl|json)$/i, 'GLSL')
	.parse(process.argv);

if (options.args.length != 1)
	options.help();

// TODO: check that output is present
// TODO: check if source exists
// TODO: force type to be uppercase
// TODO: compile input
// TODO: output shader data (2 files, glsl or 1 file, json)
// TODO: include paths search
console.log(options);
