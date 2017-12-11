/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

  // --------------------------------------------------
  // RandomNumber
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var RandomNumber = function($scope, $attrs, $element, $injector) {
    this.$scope = $scope;
    this.$attrs = $attrs;
    this.$element = $element;
    this.$injector = $injector;

    this._timer = null;
    this._shuffle = this._shuffle.bind(this);
  };

  RandomNumber.$inject = ['$scope', '$attrs', '$element', '$injector'];

  //
  // PROPERTIES
  //

  /** @var {array} collection Array of random items. */
  RandomNumber.prototype.numbers = [];

  /** @var {boolean} shuffle Flag to kick off shuffling. */
  RandomNumber.prototype.shuffle = true;

  /** @var {boolean} finished Flag truthy after iteration. */
  RandomNumber.prototype.finished = false;

  /** @var {string} value Current display value of component. */
  RandomNumber.prototype.value = '?';

  //
  // METHODS
  //

  /**
   * Registers watch for `shuffle` flag.
   *
   * @public
   * @method $onInit
   * @return {Void}
   */
  RandomNumber.prototype.$onInit = function()
    {
      var me = this;

      this._unwatch = this.$scope.$watch(
        function(){ return me.shuffle; },
        function(shuffle) {
          if (shuffle) {
            me.finished = false;
            me._shuffle(0);
            return;
          }

          me._stop();
        }
      );
    };

  /**
   * Cleans up everything on destruction.
   *
   * @public
   * @method $onDestroy
   * @return {Void}
   */
  RandomNumber.prototype.$onDestroy = function()
    {
      this._unwatch();
      this._stop();
    };

  /**
   * Shows next display value from shuffled values.
   *
   * @private
   * @method _shuffle
   * @param {number} index
   * @return {Void}
   */
  RandomNumber.prototype._shuffle = function(index) {
    var $timeout = this.$injector.get('$timeout');
    var maximum = this.numbers.length - 1;

    this.value = this.numbers[index];

    if (index >= maximum) {
      this.finished = true;
      this._stop();
      return;
    }

    this._timer = $timeout(this._shuffle, 100, true, ++index);
  };

  /**
   * Cancels timers and resets shuffle flag.
   *
   * @private
   * @method _stop
   * @return {Void}
   */
  RandomNumber.prototype._stop = function() {
    var $timeout = this.$injector.get('$timeout');

    $timeout.cancel(this._timer);
    this.shuffle = false;
    this._timer = null;
  };

  //
  // REGISTRY
  //
  angular.module(module).directive('randomNumber', function(){
    return {
      scope: {
        numbers: '=randomNumber',
        shuffle: '=?randomNumberShuffle',
        finished: '=?randomNumberFinished'
      },
      restrict: 'A',
      transclude: true,
      bindToController: true,
      controller: RandomNumber,
      controllerAs: 'randomNumberController',
      templateUrl: 'views/directives/random-number.html'
    };
  });

})(ANGULAR_MODULE, angular);
