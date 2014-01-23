define(['app/config/module'], function (module) {
	'use strict';

	module.factory('Tag', ['$rootScope', '$resource', '$route', function ($rootScope, $resource, $route) {
		return $resource('/api/tag/:id', {}, {
			'query': {method: 'GET', isArray: false}
		});
	}]);
});
