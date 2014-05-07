module.controller('VolumeEditView', [
	'$scope', 'volume', 'pageService', function ($scope, volume, page) {
		page.title = page.constants.message('page.title.stub');

		$scope.$watch(function () {
			return page.$location.search().page;
		}, function (val, old) {
			if (val && val !== old) {
				for (var step in $scope.wizard.steps) {
					if ($scope.wizard.steps.hasOwnProperty(step) && $scope.wizard.steps[step].id.indexOf(val) > -1) {
						$scope.wizard.activateStep($scope.wizard.steps[step]);
						break;
					}
				}
			}
		});

		var activateFn = function (step) {
			page.$location.search('page', step.id.split('_').pop());
		};

		//

		$scope.wizard = {};

		$scope.retrieveWizard = function (wizard) {
			$scope.wizard = wizard;
			$scope.wizard.activateFn = activateFn;
		};

		$scope.updateWizard = function () {
			if ($scope.wizard.newStep) {
				$scope.wizard.newStep.complete = false;
				$scope.wizard.newStep.allow = !!(volume || $scope.wizard.newStep.id === 'volume_edit_overview');

				if (page.$location.search().page && $scope.wizard.newStep.id.indexOf(page.$location.search().page) > -1) {
					$scope.wizard.activateStep($scope.wizard.newStep);
				} else if ($scope.wizard.newStep.id === 'volume_edit_overview') {
					$scope.wizard.activateStep($scope.wizard.newStep);
				}

				if (angular.isFunction($scope.prepareStep[$scope.wizard.newStep.id]))
					$scope.prepareStep[$scope.wizard.newStep.id]($scope.wizard.newStep);
			}

			angular.forEach($scope.wizard.steps, function (step) {
				if(angular.isFunction($scope.updateStep[step.id](step)))
					$scope.updateStep[step.id](step);
			});
		};

		//

		var forms = {
			overview: undefined,
			publications: undefined,
			materials: undefined,
			access: undefined,
		};

		$scope.$watch(function () {
			for (var form in forms) {
				if (forms.hasOwnProperty(form) && forms[form] && forms[form].$dirty)
					return forms[form];
			}

			return false;
		}, function (form) {
			angular.forEach($scope.wizard.steps, function (step) {
				if (form && !step.active) {
					step.allow = false;
				} else {
					step.allow = true;
				}
			});
		});

		//

		$scope.prepareStep = {
			'volume_edit_overview': function (step) {
				forms.overview = step.volumeEditOverviewForm;
				forms.overview.volume = volume;
			},

			'volume_edit_publications': function (step) {
				forms.publications = step.volumeEditPublicationsForm;
				forms.publications.volume = volume;
			},

			'volume_edit_materials': function (step) {
				forms.materials = step.volumeEditMaterialsForm;
				forms.materials.volume = volume;
			},

			'volume_edit_access': function (step) {
				forms.access = step.volumeEditAccessForm;
				forms.access.volume = volume;
			},
		};

		//

		$scope.updateStep = {
			'volume_edit_overview': function (step) {
				forms.overview.data = {};
			},

			'volume_edit_publications': function (step) {
				forms.publications.data = {};
			},

			'volume_edit_materials': function (step) {
				forms.materials.data = {};
			},

			'volume_edit_access': function (step) {
				forms.access.data = {};
			},
		};
	}
]);