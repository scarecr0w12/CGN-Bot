module.exports = {
	env: {
		browser: true,
		es6: true,
		serviceworker: true,
	},
	globals: {
		$: 'readonly',
		jQuery: 'readonly',
		swal: 'readonly',
	},
	rules: {
		quotes: ['error', 'single'],
		'max-nested-callbacks': ['error', 6],
		'no-console': 'off',
	},
};
