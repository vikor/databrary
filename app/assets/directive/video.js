'use strict';

app.directive('video', [
  'Segment',
  function (Segment) { return {
    restrict: 'E',
    require: '^?ngController',
    link: function ($scope, $element, $attrs, view) {
      $element.on('loadedmetadata', function () {
        var seek = $scope.$eval($attrs.seek), stop;
        if (seek instanceof Segment) {
          stop = seek.u;
          seek = seek.l;
        }

        if (isFinite(seek) && seek > 0) {
          this.currentTime = seek / 1000;
          $element.off('loadedmetadata');
        }

        if (isFinite(stop) && stop > seek) {
          stop /= 1000;
          var checkStop = function() {
            if (this.currentTime < stop)
              return;
            this.pause();
            $element.off('timeupdate', checkStop);
          };
          $element.on('timeupdate', checkStop);
        }

        if (view && view.registerVideo) {
          view.registerVideo($element);
          $scope.$on('$destroy', function () {
            view.deregisterVideo($element);
          });
        }
      });
    }
  }; }
]);
