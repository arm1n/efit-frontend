/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

  // --------------------------------------------------
  // SavingsSupportedTask
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var SavingsSupportedTask = function($scope, $element, $attrs, $injector) {
    var type = $injector.get('TYPE_SAVINGS_SUPPORTED');
    var user = $injector.get('user');

    this.$scope = $scope;
    this.$attrs = $attrs;
    this.$element = $element;
    this.$injector = $injector;

    this.task = user.getTaskByType(type);
  };

  SavingsSupportedTask.$inject = ['$scope', '$element', '$attrs', '$injector'];

  //
  // PROPERTIES
  //

  // SERVER

  /** @var {object} task Task's resource from server. */
  SavingsSupportedTask.prototype.task = null;

  // GAMEPLAY

  /** @var {number} choice Currently selected user answer. */
  SavingsSupportedTask.prototype.choice = null;

  /** @var {boolean} resolved If player has resolved the game. */
  SavingsSupportedTask.prototype.resolved = false;

  //
  // METHODS
  //

  /**
   * Proxies to `init()` if controller's ready.
   *
   * @public
   * @method $onInit
   * @return {Void}
   */
  SavingsSupportedTask.prototype.$onInit = function() {
    this.init();
  };

  /**
   * Retrieves result payload for server.
   *
   * @public
   * @method getPayload
   * @return {Void}
   */
  SavingsSupportedTask.prototype.getPayload = function() {
    return {
      task: this.task,
      json: {
        choice: this.choice
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
  SavingsSupportedTask.prototype.isLocked = function() {
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
  SavingsSupportedTask.prototype.canResolve = function() {
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

    if (!this.choice) {
      return false;
    }

    return true;
  };

  /**
   * Sets up initial state.
   *
   * @public
   * @method init
   * @return {Void}
   */
  SavingsSupportedTask.prototype.init = function() {
    this.resolved = false;
  };

  /**
   * Resets initial state.
   *
   * @public
   * @method reset
   * @return {Void}
   */
  SavingsSupportedTask.prototype.reset = function(){
    this.init();
  };

  /**
   * Sets current selection on `choice`.
   *
   * @public
   * @method update
   * @param {number} choice
   * @param {number} selected
   * @return {void}
   */
  SavingsSupportedTask.prototype.update = function(choice, selected){
    this.choice = selected ? choice : null;
  };

  /**
   * Sets `resolved` flag. Calls `onResolve`
   * callback with JSON result for consumer.
   *
   * @public
   * @method resolve
   * @return {Void}
   */
  SavingsSupportedTask.prototype.resolve = function(){
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
  angular.module(module).directive('savingsSupportedTask', function(){
    return {
      scope: {
        onResolve: '&savingsSupportedTaskOnResolve'
      },
      restrict: 'A',
      transclude: true,
      bindToController: true,
      controller: SavingsSupportedTask,
      controllerAs: 'savingsSupportedTaskController',
      templateUrl: 'views/directives/tasks/savings-supported-task.html'
    };
  });

})(ANGULAR_MODULE, angular);
