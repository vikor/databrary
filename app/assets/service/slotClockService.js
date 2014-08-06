'use strict';

module.factory('slotClockService', [
  '$timeout', function ($timeout) {
    // Clock

    var Clock = function (slot, ctrl) {
      var clock = this;
      this.slot = slot;
      this.ctrl = ctrl;

      this.playFns = [];
      this.pauseFns = [];
      this.timeFns = [];

      this.begun = 0;
      this.duration = 0;
      this.paused = 0;

      Object.defineProperties(this, {
        position: {
          get: function () {
            var actual = Date.now() - clock.begun;
            return actual < clock.duration ? actual : clock.duration;
          }
        }
      });

      slot.assets.forEach(function (asset) {
        // TODO: hack until type classes
        asset.container = slot.container;

        if (ctrl.hasDuration(asset)) {
          clock.duration = clock.duration >= asset.segment[1] ? clock.duration : asset.segment[1];
        }
      });

      // ticker
      this.interval = 100;
      this.ticker = null;
    };

    // Clock behaviors

    Clock.prototype.play = function (when, asset) {
      if (angular.isNumber(when)) {
        this.begun = Date.now() - when;
      } else if (when || !this.begun) {
        this.begun = Date.now();
      } else {
        this.begun = Date.now() - this.paused;
      }

      if (asset) {
        this.setTempDuration(asset.asset.duration);
      }

      tickerOn(this);
      callFn(this, this.playFns);
    };

    Clock.prototype.playFn = function (fn) {
      return registerFn(this, this.playFns, fn);
    };

    Clock.prototype.setTempDuration = function (duration) {
      this._duration = this.duration;
      this.duration = duration;
    };

    Clock.prototype.unsetTempDuration = function () {
      this.duration = this._duration;
      this._duration = undefined;
    };

    //

    Clock.prototype.pause = function () {
      this.paused = this.position;
      tickerOff(this);

      if (this._duration) {
        this.unsetTempDuration();
      }

      callFn(this, this.pauseFns);
    };

    Clock.prototype.pauseFn = function (fn) {
      return registerFn(this, this.pauseFns, fn);
    };

    //

    Clock.prototype.time = function (pos) {
      if (angular.isNumber(pos)) {
        if (pos < 0) {
          this.begun = Date.now();
        } else if (pos > this.duration) {
          this.begun = Date.now() - this.duration;
        } else {
          this.begun = Date.now() - pos;
        }
      }

      callFn(this, this.timeFns);
    };

    Clock.prototype.timeFn = function (fn) {
      return registerFn(this, this.timeFns, fn);
    };

    // Callback helpers

    var registerFn = function (clock, fns, fn) {
      if (!angular.isFunction(fn))
        throw new Error('Clock callbacks must be callable.');

      if (fns.indexOf(fn) === -1) {
        return fns.push(fn);
      }

      return function cancelFn() {
        var index;

        if ((index = fns.indexOf(fn)) > -1) {
          return fns.splice(index, 1);
        }
      };
    };

    var callFn = function (clock, fns) {
      angular.forEach(fns, function (fn) {
        fn(clock);
      });
    };

    // Ticker helpers

    var ticker = function (clock) {
      return function () {
        clock.time();

        if (clock.position >= clock.duration) {
          return clock.pause();
        }

        clock.ticker = $timeout(ticker(clock), clock.interval);
      };
    };

    var tickerOn = function (clock) {
      if (clock.ticker) {
        tickerOff(clock);
      }

      clock.ticker = $timeout(ticker(clock), clock.interval);
    };

    var tickerOff = function (clock) {
      return $timeout.cancel(clock.ticker);
    };

    // Service

    return Clock;
  }
]);