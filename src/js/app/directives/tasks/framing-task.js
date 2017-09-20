/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

  // --------------------------------------------------
  // FramingTask
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var FramingTask = function($scope, $elemnt, $attrs, $injector) {
    var type = $injector.get('TYPE_FRAMING');
    var user = $injector.get('user');

    this.$injector = $injector;
    this.task = user.getTaskByType(type);
  };

  FramingTask.$inject = ['$scope','$element','$attrs', '$injector'];

  // SERVER

  /** @var {object} task Task's resource from server. */
  FramingTask.prototype.task = null;

  // GAMEPLAY

  /** @var {boolean} resolved If player has resolved the game. */
  FramingTask.prototype.resolved = false;

  /** @var {boolean} lotteryA If player opts in for lottery A. */
  FramingTask.prototype.lotteryA = null;

  /** @var {boolean} lotteryB If player opts in for lottery A. */
  FramingTask.prototype.lotteryB = null;

  //
  // METHODS
  //

  /**
   * Proxies to `init()` if controller's ready.
   *
   * @public
   * @method $onInit
   * @return {void}
   */
  FramingTask.prototype.$onInit = function() {
    this.init();
  };

  /**
   * Retrieves result payload for server.
   *
   * @public
   * @method getPayload
   * @return {void}
   */
  FramingTask.prototype.getPayload = function() {
    return {
      task: this.task,
      json: {
        lotteryA: this.lotteryA,
        lotteryB: this.lotteryB
      }
    };
  };

  /**
   * Whether or not task is currently locked.
   *
   * @public
   * @method isLocked
   * @return {boolean}
   */
  FramingTask.prototype.isLocked = function() {
    if (this.task === null) {
      return true;
    }

    return !this.task.isActive;
  };

  /**
   * Whether or not task can be sent to server.
   *
   * @public
   * @method canResolve
   * @return {boolean}
   */
  FramingTask.prototype.canResolve = function() {
    var user = this.$injector.get('user');
    if (!user.isUser()) {
      return false;
    }

    if (this.isLocked()) {
      return false;
    }

    if (this.resolved) {
      return false;
    }

    if (this.lotteryA === null) {
      return false;
    }

    if (this.lotteryB === null) {
      return false;
    }

    return true;
  };

  /**
   * Sets up initial state.
   *
   * @public
   * @method init
   * @return {void}
   */
  FramingTask.prototype.init = function() {
    this.lotteryA = null;
    this.lotteryB = null;
    this.resolved = false;
  };

  /**
   * Resets initial state.
   *
   * @public
   * @method reset
   * @return {void}
   */
  FramingTask.prototype.reset = function(){
    this.init();
  };

  /**
   * Updates provided lottery with given state.
   *
   * @public
   * @method update
   * @param {string} lottery
   * @param {boolean} state
   * @return {void}
   */
  FramingTask.prototype.update = function(lottery, state){
    this[lottery] = state;
  };

  /**
   * Sets `resolved` flag. Calls `onResolve`
   * callback with JSON result for consumer.
   *
   * @public
   * @method resolve
   * @return {void}
   */
  FramingTask.prototype.resolve = function(){
    var $q = this.$injector.get('$q');

    if (!this.canResolve()) {
      var defer = $q.defer();
      defer.reject();

      return defer.promise;
    }

    var result = this.onResolve({
      payload: this.getPayload()
    });

    var me = this;
    var successCallback = function() {
      me.resolved = true;
    };
    var failureCallback = function() {

    };

    var promise = $q.when(result);
    promise.then(
      successCallback,
      failureCallback
    );

    return promise;
  };

  //
  // REGISTRY
  //
  angular.module(module).directive('framingTask', function(){
    return {
      scope: {
        onResolve: '&framingTaskOnResolve'
      },
      restrict: 'A',
      transclude: true,
      controller: FramingTask,
      bindToController: true,
      controllerAs: 'framingTaskController',
      templateUrl: 'views/directives/tasks/framing-task.html'
    };
  });

})(ANGULAR_MODULE, angular);
