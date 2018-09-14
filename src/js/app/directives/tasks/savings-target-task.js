/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

  // --------------------------------------------------
  // SavingsTargetTask
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var SavingsTargetTask = function($scope, $element, $attrs, $injector) {
    var type = $injector.get('TYPE_SAVINGS_TARGET');
    var user = $injector.get('user');

    this.$attrs = $attrs;
    this.$scope = $scope;
    this.$element = $element;
    this.$injector = $injector;

    this.task = user.getTaskByType(type);
  };

  SavingsTargetTask.$inject = ['$scope','$element','$attrs', '$injector'];

  // SERVER

  /** @var {object} task Task's resource from server. */
  SavingsTargetTask.prototype.task = null;

  // GAMEPLAY

  /** @var {string} wish Players wish for saving target. */
  SavingsTargetTask.prototype.wish = null;

  /** @var {number} amount Players first amount for saving target. */
  SavingsTargetTask.prototype.amount = null;

  /** @var {boolean} resolved If player has resolved the game. */
  SavingsTargetTask.prototype.resolved = false;

  // MISC

  /** @var {object} form Form collecting user input. */
  SavingsTargetTask.prototype.form = null;

  /** @var {number} minAmount Minimum amount for `amount` input. */
  SavingsTargetTask.prototype.minAmount = 1;

  /** @var {number} maxAmount Maximum amount for `amount` input. */
  SavingsTargetTask.prototype.maxAmount = 999;

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
  SavingsTargetTask.prototype.$onInit = function() {
    this.init();
  };

  /**
   * Retrieves result payload for server.
   *
   * @public
   * @method getPayload
   * @return {void}
   */
  SavingsTargetTask.prototype.getPayload = function() {
    return {
      task: this.task,
      json: {
        wish: this.wish,
        amount: this.amount
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
  SavingsTargetTask.prototype.isLocked = function() {
    if (this.task === null) {
      return false;
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
  SavingsTargetTask.prototype.canResolve = function() {
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

    if (this.form.$invalid) {
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
  SavingsTargetTask.prototype.init = function() {
    this.wish = null;
    this.amount = null;
    this.resolved = false;
  };

  /**
   * Resets initial state.
   *
   * @public
   * @method reset
   * @return {void}
   */
  SavingsTargetTask.prototype.reset = function(){
    this.init();
  };

  /**
   * Noop in this task - written by ngModel.
   *
   * @public
   * @method update
   * @return {void}
   */
  SavingsTargetTask.prototype.update = function(){};

  /**
   * Sets `resolved` flag. Calls `onResolve`
   * callback with JSON result for consumer.
   *
   * @public
   * @method resolve
   * @return {void}
   */
  SavingsTargetTask.prototype.resolve = function(){
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
  angular.module(module).directive('savingsTargetTask', function(){
    return {
      scope: {
        onResolve: '&savingsTargetTaskOnResolve'
      },
      restrict: 'A',
      transclude: true,
      bindToController: true,
      controller: SavingsTargetTask,
      controllerAs: 'savingsTargetTaskController',
      templateUrl: 'views/directives/tasks/savings-target-task.html'
    };
  });

})(ANGULAR_MODULE, angular);
