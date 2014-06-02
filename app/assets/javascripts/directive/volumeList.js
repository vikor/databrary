module.directive('volumelist',['pageService', function(page){

			var link = function($scope, $el, $attrs){
				$scope.page = page;
				$scope.volumeClasses = function (volume) {
					var cls = [], study = false;

					if (Object.keys(volume.providers).length === 0) {
						cls.push('dataset');
					} else {
						cls.push('study');
					}

					return cls;
				};

				$scope.iconClass = function (volume) {
					var cls = [];

					if (Object.keys(volume.providers).length === 0) {
						cls.push('dataset');
					} else {
						cls.push('study');
					}

					return cls;
				};

				var tips = {};

				var bindTooltips = function () {
					var newtips = {
						'.search_results .icon.dataset': page.constants.message('object.tip.dataset'),
						'.search_results .icon.study': page.constants.message('object.tip.study')
					};

					angular.forEach(newtips, function (message, target) {
						tips[target] = page.tooltips.add({
							live: true,
							$target: target,
							message: message
						});
					});
				};

				bindTooltips();

				$scope.$on('$destroy', function () {
					angular.forEach(tips, function (tip) {
						page.tooltips.remove(tip);
					})
				});

			};

			return {
				restrict: 'E',
				replace: false,
				scope: {
					vlist: "=volumesIn"	
				},
				templateUrl: 'volumeList.html',
				link: link,
			};}

		]);
