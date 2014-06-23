module.directive('fundingGrantForm', [
	'pageService', function (page) {
		var link = function ($scope, $element, $attrs) {
			var form = $scope.fundingGrantForm;
			form.funding = angular.isDefined($attrs.funding);

			form.volume = page.$parse($attrs.volume)($scope) || undefined;
			form.data = page.$parse($attrs.funder)($scope) || {};
			form.awards = [];

			var backup = $.extend(true, {}, form.data);

			if (form.data.awards) {
				form.awards = form.data.awards.map(function (award) {
					return {
						val: award,
					};
				});
			}

			//

			form.extend = function () {
				form.data.inherit = form.data === form.data.inherit ? 0 : Math.min(form.data, page.permission.CONTRIBUTE);
			};

			//

			form.saveFn = undefined;
			form.successFn = undefined;
			form.errorFn = undefined;

			form.save = function () {
				form.data.awards = form.awards.map(function (award) {
					return award.val;
				});

				form.volumeAccess = new page.models.VolumeAccess(form.data);

				if (angular.isFunction(form.saveFn)) {
					form.saveFn(form);
				}

				form.volumeAccess.$saveFunding({
					id: form.volume.id,
					funderId: form.data.funder.id
				}, function () {
					if (angular.isFunction(form.successFn)) {
						form.successFn(form, arguments);
					}

					form.messages.add({
						body: page.constants.message('funding.save.success'),
						type: 'green',
						countdown: 3000,
					});

					delete form.data.new;
					backup = $.extend(true, {}, form.data);
					page.models.Volume.$cache.removeAll();
					form.$setPristine();
				}, function (res) {
					form.messages.addError({
						body: page.constants.message('funding.save.error'),
						report: res,
					});

					if (angular.isFunction(form.errorFn)) {
						form.errorFn(form, arguments);
					}
				});
			};

			form.resetFn = undefined;

			form.reset = function () {
				if (angular.isFunction(form.resetFn)) {
					form.resetFn(form);
				}

				form.validator.clearServer();

				if (form.data.awards) {
					form.awards = form.data.awards.map(function (award) {
						return {
							val: award,
						};
					});
				}

				form.data = $.extend(true, {}, backup);

				if (!form.data.new) {
					form.$setPristine();
				} else {
					form.remove();
				}
			};

			//

			form.removeFn = undefined;
			form.removeSuccessFn = undefined;
			form.removeErrorFn = undefined;

			form.remove = function () {
				form.volumeAccess = new page.models.VolumeAccess();

				if (angular.isFunction(form.removeFn)) {
					form.removeFn(form);
				}

				form.volumeAccess.$deleteFunding({
					id: form.volume.id,
					funderId: form.data.funder.id,
				}, function () {
					if (angular.isFunction(form.removeSuccessFn)) {
						form.removeSuccessFn(form, arguments, form.access);
					}

					form.messages.add({
						body: page.constants.message('funding.remove.success'),
						type: 'green',
						countdown: 3000,
					});

					delete form.data.new;
					page.models.Volume.$cache.removeAll();
					form.$setPristine();
				}, function (res) {
					form.messages.addError({
						body: page.constants.message('funding.remove.error'),
						report: res,
					});

					if (angular.isFunction(form.removeErrorFn)) {
						form.removeErrorFn(form, arguments, form.access);
					}
				});
			};

			//

			form.addAward = function () {
				if (!form.awards) {
					form.awards = [];
				}

				form.awards.push({});
				form.$setDirty();
			};

			form.removeAward = function (award) {
				var i = form.awards.indexOf(award);

				if (i > -1) {
					form.awards.splice(i, 1);
				}

				form.$setDirty();
			};

			//

			$scope.$emit('fundingGrantForm-init', form, $scope);
		};

		//

		return {
			restrict: 'E',
			templateUrl: 'fundingGrantForm.html',
			scope: false,
			replace: true,
			link: link
		};
	}
]);