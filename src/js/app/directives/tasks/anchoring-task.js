/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

  // --------------------------------------------------
  // AnchoringTask
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var AnchoringTask = function($scope, $element, $attrs, $injector) {
    var type = $injector.get('TYPE_ANCHORING');
    var user = $injector.get('user');

    this.$scope = $scope;
    this.$attrs = $attrs;
    this.$element = $element;
    this.$injector = $injector;

    this.task = user.getTaskByType(type);
    this.group = user.getGroupAsString();
  };

  AnchoringTask.$inject = ['$scope','$element','$attrs', '$injector'];

  //
  // PROPERTIES
  //

  // SERVER

  /** @var {object} task Task's resource from server. */
  AnchoringTask.prototype.task = null;

  // GAMEPLAY

  /** @var {number} choice Currently selected user answer. */
  AnchoringTask.prototype.choice = null;

  /** @var {string} group Current user's group assignment. */
  AnchoringTask.prototype.group = false;

  /** @var {boolean} resolved If player has resolved the game. */
  AnchoringTask.prototype.resolved = false;

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
  AnchoringTask.prototype.$onInit = function() {
    this.init();
  };

  /**
   * Retrieves result payload for server.
   *
   * @public
   * @method getPayload
   * @return {object}
   */
  AnchoringTask.prototype.getPayload = function() {
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
  AnchoringTask.prototype.isLocked = function() {
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
  AnchoringTask.prototype.canResolve = function() {
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
  AnchoringTask.prototype.init = function() {
    this.resolved = false;
  };

  /**
   * Resets initial state.
   *
   * @public
   * @method reset
   * @return {void}
   */
  AnchoringTask.prototype.reset = function(){
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
  AnchoringTask.prototype.update = function(choice, selected){
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
  AnchoringTask.prototype.resolve = function(){
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
  angular.module(module).directive('anchoringTask', function(){
    return {
      scope: {
        onResolve: '&anchoringTaskOnResolve'
      },
      restrict: 'A',
      transclude: true,
      controller: AnchoringTask,
      bindToController: true,
      controllerAs: 'anchoringTaskController',
      templateUrl: 'views/directives/tasks/anchoring-task.html'
    };
  });

})(ANGULAR_MODULE, angular);
