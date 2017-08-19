/*!
 * eFit Website
 * An app for financial training in educational environments
 * http://www.e-fit.com
 * @author Armin Pfurtscheller
 * @version 1.0.0
 * Copyright 2017. MIT licensed.
 */
/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

  // --------------------------------------------------
  // AbstractTask
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var AbstractTask = function($scope, $elemnt, $attrs, $injector) {
    var type = $injector.get('TYPE_XXX');
    var user = $injector.get('user');

    this.$injector = $injector;
    this.task = user.getTaskByType(type);
  };

  AbstractTask.$inject = ['$scope','$element','$attrs', '$injector'];

  // SERVER

  /** @var {object} task Task's resource from server. */
  AbstractTask.prototype.task = null;

  // GAMEPLAY

  /** @var {boolean} resolved If player has resolved the game. */
  AbstractTask.prototype.resolved = false;

  // SETTINGS

  /** @var {boolean} setting Description. */
  AbstractTask.prototype.setting = null;

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
  AbstractTask.prototype.$onInit = function() {
    this.init();
  };

  /**
   * Retrieves result payload for server.
   *
   * @public
   * @method getPayload
   * @return {void}
   */
  AbstractTask.prototype.getPayload = function() {
    return {
      task: this.task,
      json: {
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
  AbstractTask.prototype.isLocked = function() {
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
  AbstractTask.prototype.canResolve = function() {
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

    return true;
  };

  /**
   * Sets up initial state.
   *
   * @public
   * @method init
   * @return {void}
   */
  AbstractTask.prototype.init = function() {
    this.resolved = false;
  };

  /**
   * Resets initial state.
   *
   * @public
   * @method reset
   * @return {void}
   */
  AbstractTask.prototype.reset = function(){
    this.init();
  };

  /**
   * Description.
   *
   * @public
   * @method update
   * @return {void}
   */
  AbstractTask.prototype.update = function(){
    this.resolve();
  };

  /**
   * Sets `resolved` flag. Calls `onResolve`
   * callback with JSON result for consumer.
   *
   * @public
   * @method resolve
   * @return {void}
   */
  AbstractTask.prototype.resolve = function(){
    var $q = this.$injector.get('$q');

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
  angular.module(module).directive('abstractTask', function(){
    return {
      scope: {
        onResolve: '&abstractTaskOnResolve'
      },
      restrict: 'A',
      transclude: true,
      controller: AbstractTask,
      bindToController: true,
      controllerAs: 'abstractTaskController',
      templateUrl: 'views/directives/tasks/abstract-task.html'
    };
  });

})(ANGULAR_MODULE, angular);