define(['app/config/module'], function (module) {
	'use strict';

	module.controller('TagsPanel', ['$scope', 'Tag', '$route', 'MessageService', function ($scope, Tag, $route, messageService) {
		var DEFAULT_MESSAGE = {
			type: 'alert',
			countdown: 3000
		};

		//

		var createMessage = function (message) {
			if (typeof(message) == 'string')
				messageService.createMessage(angular.extend({}, DEFAULT_MESSAGE, {
					message: message
				}));
			else
				messageService.createMessage(angular.extend({}, DEFAULT_MESSAGE, message));
		};

		//

		$scope.tags = [];
		$scope.target = {
			container: null,
			segment: null
		};

		$scope.refreshPanel = function () {
			switch ($route.current.controller) {
				case 'VolumeView':
					$scope.prepareTags($scope.volume.tags);
					$scope.target.container = $scope.volume.top.id;
					$scope.target.segment = ',';
					$scope.enabled = true;
					break;

				case 'SlotView':
					$scope.prepareTags($scope.slot.tags);
//					$scope.target.container = null;
//					$scope.target.segment = null;
					$scope.enabled = true;
					break;

				case 'PartyView':
					$scope.prepareTags($scope.party.tags);
//					$scope.target.container = null;
//					$scope.target.segment = null;
					$scope.enabled = angular.isArray($scope.tags) && $scope.tags.length > 0;
					break;
			}
		};

		$scope.prepareTags = function (tags) {
			var temp = [];

			angular.forEach(tags, function (tag) {
				temp.push(tag);
			});

			$scope.tags = temp;

			$scope.sortTags();
		};

		$scope.sortTags = function () {
			$scope.tags = $scope.tags.sort(function (a, b) {
				return (a.weight > b.weight) ? -1 : (a.weight < b.weight) ? 1 : 0;
			});
		};

		//

		$scope.vote = function (tag, vote) {
			var tagModel = new Tag({id: tag.id});

			tagModel.$save({
				id: tag.id,
				vote: vote == -1 ? 'false' : vote == 1 ? "true" : "",
				container: $scope.target.container,
				segment: $scope.target.segment
			}, function (newTag, status, headers, config) {
//				$scope.tags.splice($scope.tags.indexOf(tag), 1, newTag); // currently returns slot

				switch(vote) {
					case -1:
						createMessage('Tag <strong>' + tag.id + '</strong> voted down successfully!');
						tag.weight = tag.vote ? tag.weight -2 : tag.weight - 1;
						tag.vote = -1;
						break;

					case 0:
						createMessage('Tag <strong>' + tag.id + '</strong> vote cancelled successfully!');
						tag.weight = tag.weight - tag.vote;
						delete tag.vote;
						break;

					case 1:
						createMessage('Tag <strong>' + tag.id + '</strong> voted up successfully!');
						tag.weight = tag.vote ? tag.weight + 2 : tag.weight + 1;
						tag.vote = 1;
						break;
				}
			});
		};

		$scope.voteNew = function (form) {
			if (form.$invalid)
				return;

			var tagModel = new Tag({id: $scope.newName});

			tagModel.$save({
				id: $scope.newName,
				vote: "true",
				container: $scope.target.container,
				segment: $scope.target.segment
			}, function (newTag, status, headers, config) {
//				$scope.tags.splice($scope.tags.indexOf(tag), 1, newTag); // currently returns slot
				createMessage('Tag <strong>' + $scope.newName + '</strong> added successfully!');

				$scope.tags.push({
					id: $scope.newName,
					weight: 1,
					vote: 1
				});
				$scope.newName = '';
			});
		};

		//

		$scope.newName = '';

		$scope.newNameChange = function (form) {
			if (form.newName.$pristine || form.newName.$valid)
				return disableNewNameError();

			return enableNewNameError();
		};

		$scope.newNameBlur = function (form) {
			return disableNewNameError();
		};

		//

		var enableNewNameError = function () {
			if ($scope.tagNewFormMessage) {
				$scope.tagNewFormMessage = messageService.updateMessage($scope.tagNewFormMessage, {enabled: true});
			} else {
				var message = {
					enabled: true,
					type: 'error',
					message: '<dl>' +
						'<dt>Tag Name</dt>' +
						'<dd>Must be between 3 and 32 characters.</dd>' +
						'<dd>Only letters, spaces, and dashes (-) allowed.</dd>' +
						'</dl>'
				};

				$scope.tagNewFormMessage = messageService.createMessage(message);
			}
		};

		var disableNewNameError = function () {
			if ($scope.tagNewFormMessage)
				$scope.tagNewFormMessage = messageService.updateMessage($scope.tagNewFormMessage, {enabled: false});
		};


	}]);
});


var tempppppppp = function (module) {
	'use strict';

	module.controller('TagsPanelCtrl', ['$scope', '$http', 'MessageService', function ($scope, $http, messageService) {

		$scope.formAction = $scope.formAction || '/';

		$scope.getIndex = function (tag) {
			return $scope.tags.indexOf(tag);
		};

		$scope.getTag = function (tag) {
			return $scope.tags[$scope.getIndex(tag)];
		};

		$scope.createTag = function (tag) {
			$scope.tags.push(tag);

			return $scope.tags.slice(-1)[0];
		};

		$scope.updateTags = function (tags) {
			if (typeof(tags) != 'undefined')
				$scope.tags = tags;

			$scope.sortTags();
		};

		$scope.updateTag = function (old, tag) {
			var index = $scope.getIndex(old);

			if (!~index)
				return false;

			$scope.tags[index] = $.extend(true, {}, $scope.tags[index], tag);

			return $scope.tags[index];
		};

		$scope.deleteTag = function (tag) {
			var index = $scope.getIndex(tag);

			if (!~index)
				return false;

			return $scope.tags.splice(index, 1);
		};
	}]);
};
