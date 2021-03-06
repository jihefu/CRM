const { injectBabelPlugin } = require('react-app-rewired');
const rewireLess = require('react-app-rewire-less');
module.exports = function override(config, env) {
	// do stuff with the webpack config...
	config = injectBabelPlugin(['import', { libraryName: 'antd', style: true }], config);
	// config = injectBabelPlugin(['import', { libraryName: 'antd', libraryDirectory: 'es', style: 'css' }], config);
	config = rewireLess.withLoaderOptions({
		modifyVars: { "@primary-color": "#1890ff" },
	})(config, env);
	return config;
};