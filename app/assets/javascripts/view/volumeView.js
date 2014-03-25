define(['config/module'], function (module) {
	'use strict';

	module.controller('VolumeView', ['$scope', 'volume', 'PanelService', function ($scope, volume, panelService) {
		$scope.volume = volume;

		$scope.browser.initialize('volume', volume);

		$scope.$watch('volume', function () {
			panelService.refreshPanels();
		}, true);
	}]);
});