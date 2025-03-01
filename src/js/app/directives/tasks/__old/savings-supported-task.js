/* global ANGULAR_MODULE, angular, Scratchcard */
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
    this.result = user.getPendingByType(type);
  };

  SavingsSupportedTask.$inject = ['$scope', '$element', '$attrs', '$injector'];

  //
  // PROPERTIES
  //

  // SERVER

  /** @var {object} task Task's resource from server. */
  SavingsSupportedTask.prototype.task = null;

  /** @var {object} result Task's pending result from server. */
  SavingsSupportedTask.prototype.result = null;

  // GAMEPLAY

  /** @var {boolean} resolved If player has resolved the game. */
  SavingsSupportedTask.prototype.resolved = false;

  // SETTINGS

  /** @var {number} amount Amount of total cards. */
  SavingsSupportedTask.prototype.total = 3;

  /** @var {array} cards Dummy collection of cards. */
  SavingsSupportedTask.prototype.cards = [];

  /** @var {number} count Number of revealed cards. */
  SavingsSupportedTask.prototype.count = 0;

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
    var payload = {
      task: this.task,
      json: {
        count: this.count,
        total: this.total
      },
      isPending: this.count !== this.total
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
    // try to initialize from pending result
    if (this.result !== null) {
      this.count = this.result.json.count;
    }

    this.cards = [];
    for (var i=1; i<=this.total; i++) {
      this.cards.push({
        complete: i <= this.count,
        number: i
      });
    }

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
    this.resolved = false;
    this.result = null;
    this.count = 0;
    this.init();
  };

  /**
   * Increases `count` and invokes `resolve()`.
   *
   * @public
   * @method update
   * @param {object} card
   * @return {Void}
   */
  SavingsSupportedTask.prototype.update = function(card){
    var notification = this.$injector.get('notification');
    var i18n = this.$injector.get('i18n');

    // check for sequential resolving of cards
    var nextWeek = this.count + 1;
    if (card.number !== nextWeek) {
      var message = i18n.get('Please reveal week %s next!', nextWeek);
      notification.warning(message);
      card.complete = false;
      return;
    }

    // check if 1 week pasted since last result
    /*
    if (this.result !== null) {
      var updatedAt = new Date(this.result.updatedAt * 1000);
      var minDate = new Date(updatedAt.getTime());
      minDate.setDate(minDate.getDate()+7);

      var curTime = (new Date()).getTime();
      var minTime = minDate.getTime();

      if (curTime < minTime) {
        var message = i18n.get("Doesn't seem a week already elapsed!");
        notification.warning(message);
        card.complete = false;
        return;
      }
    }
    */

    // now publish the change
    var me = this;
    var successCallback = function(){};
    var failureCallback = function(){
      card.complete = false;
      me.count--;
    };

    this.count = nextWeek;
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
   * @return {Void}
   */
  SavingsSupportedTask.prototype.resolve = function(){
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

    var result = callback({
      payload: this.getPayload()
    });

    var me = this;
    var successCallback = function(result) {
      if (result.isPending) {
        var message = i18n.get('Super, keep it up!');
        notification.success(message);
        me.result = result;
        return;
      }

      me.resolved = true;
    };

    var failureCallback = function() {
    };

    var promise = $q.when(result).then(
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
        amount: '=?savingsSupportedTaskAmount',
        onUpdate: '&savingsSupportedTaskOnUpdate',
        onResolve: '&savingsSupportedTaskOnResolve'
      },
      restrict: 'A',
      transclude: true,
      controller: SavingsSupportedTask,
      bindToController: true,
      controllerAs: 'savingsSupportedTaskController',
      templateUrl: 'views/directives/tasks/savings-supported-task.html'
    };
  });

  // --------------------------------------------------
  // SavingsSupportedTask Card
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var SavingsSupportedTaskCard = function($scope,$element,$attrs, $injector) {
    this.$element = $element;
    this.$scope = $scope;
    this.$attrs = $attrs;

    this.$injector = $injector;

    this._scratchCard = null;
  };

  SavingsSupportedTaskCard.$inject = ['$scope','$element','$attrs', '$injector'];

  //
  // PROPERTIES
  //

  /** @var {boolean} complete If card has been revelead. */
  SavingsSupportedTaskCard.prototype.complete = false;

  /** @var {number} thickness Thickness of rubber in pixel. */
  SavingsSupportedTaskCard.prototype.thickness = 20;

  /** @var {number} treshold Treshold level when card revels. */
  SavingsSupportedTaskCard.prototype.threshold = 0.25;

  /** @var {string} color Color of card overlay. */
  SavingsSupportedTaskCard.prototype.color = '#e5e5e5';

  //
  // METHODS
  //

  /**
   * Initializes element with `Scratchcard` library.
   *
   * @public
   * @method $onInit
   * @return {Void}
   */
  SavingsSupportedTaskCard.prototype.$onInit = function() {
    this._scratchCard = new Scratchcard(
      this.$element.get(0),
      {
        painter: new Scratchcard.Painter({
          thickness: this.thickness,
          color: this.color
        })
      }
    );

    var me = this;
    this._unwatch = this.$scope.$watch(
      function() {
        return me.card.complete;
      },
      function(isComplete) {
        if (isComplete) {
          me._scratchCard.complete();
        } else {
          me._scratchCard.reset();
        }
      }
    );

    this._listener = this._onProgress.bind(this);
    this._scratchCard.addListener('progress', this._listener);
  };

  /**
   * Removes listeners and watches from directive.
   *
   * @public
   * @method $onDestroy
   * @return {Void}
   */
  SavingsSupportedTaskCard.prototype.$onDestroy = function() {
    this._scratchCard.removeListener('progress', this._listener);
    this._scratchCard = null;
    this._unwatch();
  };

  /**
   * Checks progress' treshold has been exceeded, but is still
   * below 100%. In this case, the card will be revelead and
   * the `onComplete` callback can be invoked.
   *
   * @public
   * @method _onProgress
   * @return {Void}
   */
  SavingsSupportedTaskCard.prototype._onProgress = function(progress) {
    var $timeout = this.$injector.get('$timeout');

    var me = this;
    var onProgress = function() {
      if (progress>me.threshold && progress<1) {
        // call with $timeout() cause consumer
        // could also change `complete` flag!
        me.card.complete = true;
        $timeout(me.onComplete);
      }
    };

    this.$scope.$evalAsync(onProgress);
  };

  //
  // REGISTRY
  //
  angular.module(module).directive('savingsSupportedTaskCard', function(){
    return {
      scope: {
        card: '=?savingsSupportedTaskCard',
        color: '=?savingsSupportedTaskCardColor',
        thickness: '=?savingsSupportedTaskCardThickness',
        threshold: '=?savingsSupportedTaskCardThreshold',
        onComplete: '&savingsSupportedTaskCardOnComplete'
      },
      restrict: 'A',
      transclude: true,
      controller: SavingsSupportedTaskCard,
      bindToController: true,
      controllerAs: 'savingsSupportedTaskCardController',
      templateUrl: 'views/directives/tasks/savings-supported-task-card.html'
    };
  });

})(ANGULAR_MODULE, angular);
