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

    this.$attrs = $attrs;
    this.$scope = $scope;
    this.$element = $element;
    this.$injector = $injector;

    this.user = this.$injector.get('user');
    this.task = this.user.getTaskByType(type);
    this.result = this.user.getPendingByType(type);

    this._isLocked = null;
  };

  SavingsTargetTask.$inject = ['$scope','$element','$attrs', '$injector'];

  // SERVER

  /** @var {object} user Alias to user service. */
  SavingsTargetTask.prototype.user = null;

  /** @var {object} task Task's resource from server. */
  SavingsTargetTask.prototype.task = null;

  /** @var {object} result Task's pending result from server. */
  SavingsTargetTask.prototype.result = null;

  // GAMEPLAY

  /** @var {number} step Current step . */
  SavingsTargetTask.prototype.step = 1;

  /** @var {number} total Players wish for saving target. */
  SavingsTargetTask.prototype.total = 3;

  /** @var {string} wish Players wish for saving target. */
  SavingsTargetTask.prototype.wish = null;

  /** @var {number} amount Players first amount for saving target. */
  SavingsTargetTask.prototype.amount = null;

  /** @var {number} amountRepeated Players second amount for saving target. */
  SavingsTargetTask.prototype.amountRepeated = null;

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
    var payload = {
      task: this.task,
      json: {
        step: this.step,
        wish: this.wish,
        total: this.total,
        amount: this.amount,
        amountRepeated: this.amountRepeated
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
  SavingsTargetTask.prototype.isLocked = function() {
    if (this.task === null) {
      return true;
    }

    // if result was created and
    // we are waiting for paused
    // state, we skip unlocking
    // with internal `_isLocked`
    if (this.task.isActive) {
      return this._isLocked;
    }

    // reset `_isLocked` flag if
    // `isActive` changed again
    this._isLocked = null;

    // inactive
    return true;
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

    if (this.form.$invalid) {
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
  SavingsTargetTask.prototype.init = function() {
    if (this.result !== null) {
      var json = this.result.json;

      // `amountRepeated` cannot be desisted cause it's the
      // condition in last step before setting `isPending`
      this.amount = json.amount;
      this.total = json.total;
      this.wish = json.wish;
      this.step = json.step;

      // set `_isLocked` only until last step cause the step
      // before last one gets manually updated AFTER unlock!
      var timestampTask = this.task.updatedAt;
      var timestampResult = this.result.updatedAt;
      this._isLocked = timestampResult > timestampTask;
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
  SavingsTargetTask.prototype.reset = function(){
    this.init();
  };

  /**
   * Increases `step` and invokes `resolve()`.
   *
   * @public
   * @method update
   * @return {void}
   */
  SavingsTargetTask.prototype.update = function(){
    if (this.step < this.total) {
      this.step++;
    }

    var me = this;
    var successCallback = function(){};
    var failureCallback = function(){
      me.step--;
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
  SavingsTargetTask.prototype.resolve = function(){
    var notification = this.$injector.get('notification');
    var i18n = this.$injector.get('i18n');
    var $q = this.$injector.get('$q');

    if (!this.canResolve()) {
      var defer = $q.defer();
      defer.reject();

      return defer.promise;
    }

    var callback = this.result === null ?
      this.onResolve :
      this.onUpdate;

    var payload = this.getPayload();
    var result = callback({
      payload: payload
    });

    // switch UI immediately
    if (payload.isPending) {
      this._isLocked = true;
    }

    var me = this;
    var successCallback = function(result) {
      if (result.isPending) {
        if (me.step < me.total) {
          var message = i18n.get('Thank you for your input!');
          notification.success(message);
        }

        me.result = result;
        return;
      }

      me.resolved = true;
    };

    var failureCallback = function() {
      me._isLocked = null;
    };

    var promise = $q.when(result);
    promise.then(
      successCallback,
      failureCallback
    );

    return promise;
  };

  /**
   * Calculates difference between `amount` and `amountRepeated`.
   *
   * @public
   * @method getDifference
   * @return {void}
   */
  SavingsTargetTask.prototype.getDifference = function(){
    return this.amountRepeated - this.amount;
  };

  /**
   * Checks if `amountRepeated` is already set.
   *
   * @private
   * @method _isPending
   * @return {boolean}
   */
  SavingsTargetTask.prototype._isPending = function(){
    return this.amountRepeated === null;
  };

  //
  // REGISTRY
  //
  angular.module(module).directive('savingsTargetTask', function(){
    return {
      scope: {
        onUpdate: '&savingsTargetTaskOnUpdate',
        onResolve: '&savingsTargetTaskOnResolve'
      },
      restrict: 'A',
      transclude: true,
      controller: SavingsTargetTask,
      bindToController: true,
      controllerAs: 'savingsTargetTaskController',
      templateUrl: 'views/directives/tasks/savings-target-task.html'
    };
  });

})(ANGULAR_MODULE, angular);
