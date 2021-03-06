var includePaths = require('rollup-plugin-includepaths');

module.exports = {
	entry: './dist/index.js',
	sourceMap: true,
	format: 'umd',
	moduleName: 'AwayjsView',
	external: [
		'@awayjs/core',
		'@awayjs/graphics',
		'@awayjs/scene',
		'@awayjs/stage',
		'@awayjs/renderer'
	],
	globals: {
		'@awayjs/core': 'AwayjsCore',
		'@awayjs/graphics': 'AwayjsGraphics',
		'@awayjs/scene': 'AwayjsScene',
		'@awayjs/stage': 'AwayjsStage',
		'@awayjs/renderer': 'AwayjsRenderer'
	},
	targets: [
		{ dest: './bundle/awayjs-view.umd.js'}
	],
	plugins: [
		includePaths({
			include : {
				"tslib": "./node_modules/tslib/tslib.es6.js"
			}
		}) ]
};