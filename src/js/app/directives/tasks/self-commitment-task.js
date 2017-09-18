/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

  // --------------------------------------------------
  // SelfCommitmentTask
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var SelfCommitmentTask = function($scope, $elemnt, $attrs, $injector) {
    var type = $injector.get('TYPE_SELF_COMMITMENT');

    this.$injector = $injector;

    this.user = this.$injector.get('user');
    this.task = this.user.getTaskByType(type);
    this.result = this.user.getPendingByType(type);
  };

  SelfCommitmentTask.$inject = ['$scope','$element','$attrs', '$injector'];

  // SERVER

  /** @var {object} user Alias to user service. */
  SelfCommitmentTask.prototype.user = null;

  /** @var {object} task Task's resource from server. */
  SelfCommitmentTask.prototype.task = null;

  /** @var {object} result Task's pending result from server. */
  SelfCommitmentTask.prototype.result = null;

  // GAMEPLAY

  /** @var {object} watched Hash storing watched video ids. */
  SelfCommitmentTask.prototype.videos = {
    'ImPxD_FDpKM': false,
    'gUYjYEGbxEY': false
  };

  /** @var {boolean} resolved If player has resolved the game. */
  SelfCommitmentTask.prototype.resolved = false;

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
  SelfCommitmentTask.prototype.$onInit = function() {
    this.init();
  };

  /**
   * Retrieves result payload for server.
   *
   * @public
   * @method getPayload
   * @return {void}
   */
  SelfCommitmentTask.prototype.getPayload = function() {
    var payload = {
      task: this.task,
      json: {
        videos: this.videos
      },
      isPending: this._isPending()
    };

    if (this.result !== null) {
      payload = angular.extend(
        this.result,
        payload
      );
    }

    return payload;
  };

  /**
   * Whether or not task is currently locked.
   *
   * @public
   * @method isLocked
   * @return {boolean}
   */
  SelfCommitmentTask.prototype.isLocked = function() {
    // admins always can watch
    // videos for explanation!
    if (!this.user.isUser()) {
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
  SelfCommitmentTask.prototype.canResolve = function() {
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
  SelfCommitmentTask.prototype.init = function() {
    if (this.result !== null) {
      var json = this.result.json;
      this.videos = json.videos;
    }

    this.resolved = false;
  };

  /**
   * Resets initial state.
   *
   * @public
   * @method reset
   * @return {void}
   */
  SelfCommitmentTask.prototype.reset = function(){
    this.init();
  };

  /**
   * Description.
   *
   * @public
   * @method update
   * @return {void}
   */
  SelfCommitmentTask.prototype.update = function(id){
    if (this.videos[id]) {
      return;
    }

    this.videos[id] = true;
    if (!this.canResolve()) {
      return;
    }

    var me = this;
    var successCallback = function(){};
    var failureCallback = function(){
      me.videos[id] = false;
    };

    this.resolve().then(
      successCallback,
      failureCallback
    );
  };

  /**
   * Sets `resolved` flag. Calls `onResolve`
   * callback with JSON result for consumer.
   *
   * @public
   * @method resolve
   * @return {void}
   */
  SelfCommitmentTask.prototype.resolve = function(){
    var $q = this.$injector.get('$q');

    var callback = this.result === null ?
      this.onResolve :
      this.onUpdate;

    var payload = this.getPayload();
    var result = callback({
      payload: payload
    });

    var me = this;
    var successCallback = function(result) {
      if (result.isPending) {
        me.result = result;
        return;
      }

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

  /**
   * Checks if user is allowed to watch videos:
   * - (Super-)Admins are always allowed
   * - Users only if not in workshop
   *
   * @public
   * @method canWatch
   * @return {boolean}
   */
  SelfCommitmentTask.prototype.canWatch = function(){
    if (!this.user.isUser()) {
      return true;
    }

    return !this.user.isInWorkshop();
  };

  /**
   * Checks if all videos has been watched.
   *
   * @private
   * @method _isPending
   * @return {boolean}
   */
  SelfCommitmentTask.prototype._isPending = function(){
    for (var id in this.videos) {
      if (!this.videos[id]) {
        return true;
      }
    }

    return false;
  };

  //
  // REGISTRY
  //
  angular.module(module).directive('selfCommitmentTask', function(){
    return {
      scope: {
        onUpdate: '&selfCommitmentTaskOnUpdate',
        onResolve: '&selfCommitmentTaskOnResolve'
      },
      restrict: 'A',
      transclude: true,
      bindToController: true,
      controller: SelfCommitmentTask,
      controllerAs: 'selfCommitmentTaskController',
      templateUrl: 'views/directives/tasks/self-commitment-task.html'
    };
  });

})(ANGULAR_MODULE, angular);
