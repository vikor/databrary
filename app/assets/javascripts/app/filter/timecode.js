define(['app/config/module'], function (module) {
	'use strict';

	module.filter('timecode', [function () {
		return function (input) {
			if(!angular.isNumber(input))
				return input;

			var time = [], tmp;

			var millTo = {
				days: 86400000,
				hours: 3600000,
				minutes: 60000,
				seconds: 1000
			};

			if(input > millTo.days) {
				time.push(Math.floor(input / millTo.days));
				input = input % millTo.days;
			}

			if(input > millTo.hours) {
				time.push(Math.floor(input / millTo.hours));
				input = input % millTo.hours;
			}

			if(input > millTo.minutes) {
				time.push(Math.floor(input / millTo.minutes));
				input = input % millTo.minutes;
			}

			if(input > millTo.seconds) {
				time.push(Math.floor(input / millTo.seconds));
				input = input % millTo.seconds;
			}

			angular.forEach(time, function (input, k) {
				time[k] = new Array(3 - input.toString().length).join('0')+input;
			});

			time.push(new Array(4 - input.toString().length).join('0')+input);

			return time.join(':');
		};
	}]);
});