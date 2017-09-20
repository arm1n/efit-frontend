/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

  // --------------------------------------------------
  // MentalBookkeepingTask
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var MentalBookkeepingTask = function($scope, $element, $attrs, $injector) {
    var type = $injector.get('TYPE_MENTAL_BOOKKEEPING');
    var user = $injector.get('user');

    this.$scope = $scope;
    this.$attrs = $attrs;
    this.$element = $element;
    this.$injector = $injector;

    this.task = user.getTaskByType(type);
    this.group = user.getGroupAsString();
  };

  MentalBookkeepingTask.$inject = ['$scope','$element','$attrs', '$injector'];

  //
  // PROPERTIES
  //

  // SERVER

  /** @var {object} task Task's resource from server. */
  MentalBookkeepingTask.prototype.task = null;

  // GAMEPLAY

  /** @var {number} choice Currently selected user answer. */
  MentalBookkeepingTask.prototype.choice = null;

  /** @var {string} group Current user's group assignment. */
  MentalBookkeepingTask.prototype.group = false;

  /** @var {boolean} resolved If player has resolved the game. */
  MentalBookkeepingTask.prototype.resolved = false;

  //
  // METHODS
  //

  /**
   * Proxies to `init()` if controller's ready.
   * Sets up event source for listening to
   *
   * @public
   * @method $onInit
   * @return {void}
   */
  MentalBookkeepingTask.prototype.$onInit = function() {
    this.init();
  };

  /**
   * Retrieves result payload for server.
   *
   * @public
   * @method getPayload
   * @return {object}
   */
  MentalBookkeepingTask.prototype.getPayload = function() {
    var user = this.$injector.get('user');

    return {
      task: this.task,
      json: {
        group: user.group,
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
  MentalBookkeepingTask.prototype.isLocked = function() {
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
  MentalBookkeepingTask.prototype.canResolve = function() {
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
   * @return {void}
   */
  MentalBookkeepingTask.prototype.init = function() {
    this.resolved = false;
  };

  /**
   * Resets initial state.
   *
   * @public
   * @method reset
   * @return {void}
   */
  MentalBookkeepingTask.prototype.reset = function(){
    this.init();
  };

  /**
   * Description.
   *
   * @public
   * @method update
   * @param {number} choice
   * @param {number} selected
   * @return {void}
   */
  MentalBookkeepingTask.prototype.update = function(choice, selected){
    this.choice = selected ? choice : null;
  };

  /**
   * Sets `resolved` flag. Calls `onResolve`
   * callback with JSON result for consumer.
   *
   * @public
   * @method resolve
   * @return {void}
   */
  MentalBookkeepingTask.prototype.resolve = function(){
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
  angular.module(module).directive('mentalBookkeepingTask', function(){
    return {
      scope: {
        onResolve: '&mentalBookkeepingTaskOnResolve'
      },
      restrict: 'A',
      transclude: true,
      bindToController: true,
      controller: MentalBookkeepingTask,
      controllerAs: 'mentalBookkeepingTaskController',
      templateUrl: 'views/directives/tasks/mental-bookkeeping-task.html'
    };
  });

})(ANGULAR_MODULE, angular);
