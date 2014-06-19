module.directive('partyEditProfileForm', [
	'pageService', function (page) {
		var link = function ($scope) {
			var form = $scope.partyEditProfileForm;

			form.data = {};
			form.authors = [];
			var backup = {};

			form.saveFn = undefined;
			form.resetFn = undefined;
			form.successFn = undefined;
			form.errorFn = undefined;

			//

			form.init = function (party) {
				form.party = form.party || party;
				form.data = {
					name: party.name,
					orcid: party.orcid,
					duns: party.duns,
					affiliation: party.affiliation,
					avatar: party.avatar,
				};

				backup = $.extend(true, {}, form.data);
			};

			//

			form.save = function () {
				if (angular.isFunction(form.saveFn)) {
					form.saveFn(form);
				}

				if (angular.isObject(form.data.avatar)) {
					var fd = new FormData();

					fd.append('avatar', form.data.avatar[0]);
					form.data.avatar = undefined;

					for (var prop in form.data) {
						if (form.data.hasOwnProperty(prop) && angular.isDefined(form.data[prop]) && form.data[prop] !== null) {
							fd.append(prop, form.data[prop]);
						}
					}

					var msg = form.messages.add({
						type: 'yellow',
						body: page.constants.message('party.edit.avatar.upload', page.constants.message('avatar')),
					});

					page.models.Party.upload(form.party, fd)
						.then(function (res) {
							form.validator.server({});

							form.messages.add({
								type: 'green',
								countdown: 3000,
								body: page.constants.message('party.edit.profile.success'),
							});

							form.data.avatar = res.data.avatar;

							backup = $.extend(true, {}, form.data);

							form.messages.remove(msg);

							if (angular.isFunction(form.successFn)) {
								form.successFn(form, res);
							}

							form.$setPristine();
							page.models.Party.$cache.removeAll();
						}, function (res) {
							form.validator.server(res);

							form.messages.remove(msg);

							if (angular.isFunction(form.errorFn)) {
								form.errorFn(form, res);
							}
						});
				} else {
					page.models.Party.save({
							id: form.party.id,
						}, form.data,
						function (res) {
							form.validator.server({});

							form.messages.add({
								type: 'green',
								countdown: 3000,
								body: page.constants.message('party.edit.profile.success'),
							});

							backup = $.extend(true, {}, form.data);

							if (angular.isFunction(form.successFn)) {
								form.successFn(form, res);
							}

							form.$setPristine();
							page.models.Party.$cache.removeAll();
						}, function (res) {
							form.validator.server(res);

							if (angular.isFunction(form.errorFn)) {
								form.errorFn(form, res);
							}
						});
				}
			};

			form.reset = function () {
				if (angular.isFunction(form.resetFn))
					form.resetFn(form);

				form.validator.clearServer();

				form.data = $.extend(true, {}, backup);
				form.$setPristine();
			};

			form.replace = function () {
				delete form.data.avatar;
				form.$setDirty();
			};

			form.uploading = function () {
				return !form.data.avatar || angular.isObject(form.data.avatar);
			};

			//

			form.validator.client({
				name: {
					tips: page.constants.message('party.edit.name.help')
				},
				affiliation: {
					tips: page.constants.message('party.edit.affiliation.help')
				},
				orcid: {
					tips: page.constants.message('party.edit.orcid.help')
				},
				duns: {
					tips: page.constants.message('party.edit.duns.help')
				},
			}, true);

			//

			page.events.talk('partyEditProfileForm-init', form, $scope);
		};

		//

		return {
			restrict: 'E',
			templateUrl: 'partyEditProfileForm.html',
			scope: false,
			replace: true,
			link: link
		};
	}
]);