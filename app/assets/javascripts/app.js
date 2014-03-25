require.config({
	baseUrl: '/public/javascripts',
	optimize: 'none',

	paths: {
		domReady: 'vendors/domReady-2.0.1/domReady',

		jquery: 'vendors/jquery-1.11.0/jquery-1.11.0.min',

		angular: 'vendors/angular-1.2.15/angular.min',
		ngAnimate: 'vendors/angular-1.2.15/angular-animate.min',
		ngCookies: 'vendors/angular-1.2.15/angular-cookies.min',
		ngLoader: 'vendors/angular-1.2.15/angular-loader.min',
		ngResource: 'vendors/angular-1.2.15/angular-resource.min',
		ngRoute: 'vendors/angular-1.2.15/angular-route.min',
		ngSanitize: 'vendors/angular-1.2.15/angular-sanitize.min',
		ngTouch: 'vendors/angular-1.2.15/angular-touch.min',
		ngMocks: 'vendors/angular-1.2.15/angular-mocks',
		ngScenario: 'vendors/angular-1.2.15/angular-scenario',

		ngStorage: 'vendors/ngStorage/ngStorage.min',

		bindonce: 'vendors/bindonce/bindonce.min'
	},

	shim: {
		jquery: {
			exports: 'jQuery'
		},

		angular: {
			exports: 'angular',
			deps: ['jquery']
		},
		ngAnimate: {
			deps: ['angular']
		},
		ngCookies: {
			deps: ['angular']
		},
		ngLoader: {
			deps: ['angular']
		},
		ngResource: {
			deps: ['angular']
		},
		ngRoute: {
			deps: ['angular']
		},
		ngSanitize: {
			deps: ['angular']
		},
		ngTouch: {
			deps: ['angular']
		},
		ngMocks: {
			deps: ['angular']
		},
		ngScenario: {
			deps: ['angular']
		},

		ngStorage: {
			deps: ['angular']
		},

		bindonce: {
			deps: ['angular']
		}
	},

	deps: ['config/bootstrap']
});