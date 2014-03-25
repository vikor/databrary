define(['config/module'], function (module) {
	'use strict';

	module.directive('message', ['MessageService', function (messages) {
		var link = function ($scope, $element, $attrs) {
			messages.add({
				id: $attrs.id,
				type: $attrs.type,
				target: $attrs.target,
				closeable: $attrs.closeable,
				countdown: $attrs.countdown,
				enabled: $attrs.enabled,
				body: $attrs.body || $element.html()
			});

			$element.remove();
		};

		return {
			restrict: 'EA',
			link: link
		}
	}]);
});