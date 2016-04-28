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

## Install

```sh
npm install frak-slang
```

## Usage (as command line tool)

```
TODO
```


## Usage (as library)

```
TODO
```
