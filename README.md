# frak-slang
Lightweight GLSL preprocessor for [FRAK Engine](https://github.com/lammas/frak).


## Features

* Declare uniforms/attributes/varyings only once
* #include
* Have both vertex and fragment shader entry points in the same file
* Transpile into standard GLSL vertex and fragment shader
* Unused variables and functions are culled
* Extract shader parameters
* Command line tool for integrating into build scripts

## Limitations

* #ifdef / #ifndef directives inside functions are not evauluated
* Unused variables and functions inside preprocessor directives are not culled
* Comments on the same line as #include directives are not handled

## Install

```sh
npm install frak-slang
```

## Usage (as library)

```javascript
var FRAKSlang = require('frak-slang');

FRAKSlang.compile(glslSource, {
    include: handleIncludedFiles(includedFile, parentFile, done) { /* ... */ },
    sourceURI: 'main/glsl/file/location'
}, function(compiled) {
    // compiled = {
    //   vertex: 'vertex program code here',
    //   fragment: 'fragment program code here'
    // }
});
```

## Usage (as command line tool)

```sh
frak-slang -o <output_filename> -t <glsl|json> <file.glsl>
```

* The default value for --type (-t) is GLSL
* If the type is GLSL the output will result in two files: output_filename.vert and output_filename.frag
