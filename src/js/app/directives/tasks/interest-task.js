/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

  // --------------------------------------------------
  // InterestTask
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var InterestTask = function($scope, $element, $attrs, $injector) {
    var type = $injector.get('TYPE_INTEREST');

    this.$scope = $scope;
    this.$attrs = $attrs;
    this.$element = $element;
    this.$injector = $injector;

    this.domId = 'interest-task-' + $scope.$id;

    this.user = this.$injector.get('user');
    this.task = this.user.getTaskByType(type);
    this.result = this.user.getPendingByType(type);
  };

  InterestTask.$inject = ['$scope', '$element', '$attrs', '$injector'];

  //
  // PROPERTIES
  //

  // SERVER

  /** @var {object} user Alias to user service. */
  InterestTask.prototype.user = null;

  /** @var {object} task Task's resource from server. */
  InterestTask.prototype.task = null;

  /** @var {object} result Task's pending result from server. */
  InterestTask.prototype.result = null;

  // GAMEPLAY

  /** @var {boolean} resolved If player has resolved the game. */
  InterestTask.prototype.resolved = false;

  /** @var {number} currentExercise Count of correct answers. */
  InterestTask.prototype.currentExercise = 1;

  /** @var {number} correctAnswers Count of correct answers. */
  InterestTask.prototype.correctAnswers = null;

  /** @var {number} exercise1Answer Answer for first exercise. */
  InterestTask.prototype.exercise1Answer = null;

  /** @var {number} exercise2Answer Answer for second exercise. */
  InterestTask.prototype.exercise2Answer = null;

  /** @var {boolean} exercise1Correct Resolution state of first exercise. */
  InterestTask.prototype.exercise1Correct = false;

  /** @var {boolean} exercise2Correct Resolution state of second exercise. */
  InterestTask.prototype.exercise2Correct = false;

  /** @var {number} exercise1Result Correct result for first exercise. */
  InterestTask.prototype.exercise1Result = null;

  /** @var {number} exercise2Result Correct result for second exercise. */
  InterestTask.prototype.exercise2Result = null;

  // SETTINGS

  /** @var {number} amount Amount of money. */
  InterestTask.prototype.amount = 1000;

  /** @var {number} rate Interest rate. */
  InterestTask.prototype.rate = 0.01;

  /** @var {number} years Number of years. */
  InterestTask.prototype.years = 1;

  // MISC

  /** @var {string} domId Unique dom id for this task for scrolling purposes. */
  InterestTask.prototype.domId = null;

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
  InterestTask.prototype.$onInit = function() {
    this.init();
  };

  /**
   * Retrieves result payload for server.
   *
   * @public
   * @method getPayload
   * @return {Void}
   */
  InterestTask.prototype.getPayload = function() {
    var payload = {
      task: this.task,
      json: {
        exercise1: {
          currentResult: this.exercise1Result,
          actualResult: this.exercise1Answer,
          isValid: this.exercise1Correct
        },
        exercise2: {
          currentResult: this.exercise2Result,
          actualResult: this.exercise2Answer,
          isValid: this.exercise2Correct
        },
        currentExercise: this.currentExercise+1
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
  InterestTask.prototype.isLocked = function() {
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
  InterestTask.prototype.canResolve = function() {
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

    if (this.currentExercise === 1) {
      if (!this.exercise1Answer) {
        return false;
      }
    }

    if (this.currentExercise === 2) {
      if (!this.exercise2Answer) {
        return false;
      }
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
  InterestTask.prototype.init = function() {
    if (this.result !== null) {
      var json = this.result.json;

      // `exercise2Answer` cannot be desisted cause it's the
      // condition in last step before setting `isPending`
      this.exercise1Answer = json.exercise1.actualResult;
      this.currentExercise = json.currentExercise;
    }

    this.resolved = false;
    this.exercise1Result = this._calculateResult(1);
    this.exercise2Result = this._calculateResult(1 + this.years);

    this._setCorrectAnswers();
  };

  /**
   * Resets initial state.
   *
   * @public
   * @method reset
   * @return {Void}
   */
  InterestTask.prototype.reset = function(){
    this.init();
  };

  /**
   * Updates answers, state and counters
   * for given exercise for evaluation.
   *
   * @public
   * @method update
   * @param {number} value
   * @param {string} exercise
   * @return {Void}
   */
  InterestTask.prototype.update = function(){
    var me = this;
    var successCallback = function(){
      // updated after resolve cause
      // we need current exercise in
      // `canResolve()` for checking
      me.currentExercise++;
    };
    var failureCallback = function(){};

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
  InterestTask.prototype.resolve = function(){
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
   * Updates answers for given exercise with sum.
   *
   * @public
   * @method setResult
   * @param {number} value
   * @param {string} exercise
   * @return {boolean}
   */
  InterestTask.prototype.setResult = function(value, exercise){
    switch(exercise) {
      case 'exercise1':
        this.exercise1Answer = value || null;
        break;
      case 'exercise2':
        this.exercise2Answer = value || null;
        break;
      default:
    }

    this._setCorrectAnswers();
  };

  /**
   * Checks if `exercise2Answer` is already set.
   *
   * @private
   * @method _isPending
   * @return {boolean}
   */
  InterestTask.prototype._isPending = function(){
    return this.exercise2Answer === null;
  };

  /**
   * Updates the poroperty belonging to correctness.
   *
   * @private
   * @method _setCorrectAnswers
   * @return {void}
   */
  InterestTask.prototype._setCorrectAnswers = function() {
    this.exercise1Correct = this.exercise1Answer === this.exercise1Result;
    this.exercise2Correct = this.exercise2Answer === this.exercise2Result;

    if (this.exercise1Correct && this.exercise2Correct) {
      this.correctAnswers = 2;
    } else if (this.exercise1Correct) {
      this.correctAnswers = 1;
    } else if (this.exercise2Correct) {
      this.correctAnswers = 1;
    } else {
      this.correctAnswers = 0;
    }
  };

  /**
   * Calculates result for given years.
   *
   * @private
   * @method _calculateResult
   * @param {number} years
   * @return {number}
   */
  InterestTask.prototype._calculateResult = function(years) {
    return this.amount * Math.pow(1 + this.rate, years || 1);
  };

  //
  // REGISTRY
  //
  angular.module(module).directive('interestTask', function(){
    return {
      scope: {
        rate: '=?interestTaskRate',
        years: '=?interestTaskYears',
        amount: '=?interestTaskAmount',
        onUpdate: '&interestTaskOnUpdate',
        onResolve: '&interestTaskOnResolve'
      },
      restrict: 'A',
      transclude: true,
      bindToController: true,
      controller: InterestTask,
      controllerAs: 'interestTaskController',
      templateUrl: 'views/directives/tasks/interest-task.html'
    };
  });

  // --------------------------------------------------
  // InterestTask Exercise
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var InterestTaskExercise = function($scope,$element,$attrs) {
    this.$element = $element;
    this.$scope = $scope;
    this.$attrs = $attrs;

    this.disabled = false;
    this.stack = [];
    this.sum = 0;

    var me = this;
    this._unwatch = $scope.$watch(
      function(){ return me.sum; },
      function(sum) {
        if (!sum) {
          me.sum = 0;
          me.stack = [];
        }
      }
    );
  };

  InterestTaskExercise.$inject = ['$scope','$element','$attrs'];

  //
  // PROPERTIES
  //

  /** @var {boolean} disabled If exercise is currently disabled. */
  InterestTaskExercise.prototype.disabled = false;

  /** @var {array} stack Stack collection all notes and coins. */
  InterestTaskExercise.prototype.stack = [];

  /** @var {number} sum Total sum of all values from `stack`. */
  InterestTaskExercise.prototype.sum = 0;

  /** @var {array} notes All selectable notes for exercise. */
  InterestTaskExercise.prototype.notes = [500,200,100,50,20,10,5];

  /** @var {array} notes All selectable coins for exercise. */
  InterestTaskExercise.prototype.coins = [2,1,0.5,0.2,0.1,0.05,0.02,0.01];

  //
  // METHODS
  //

  /**
   * Removes event listener and watches.
   *
   * @public
   * @method $onDestroy
   * @return {void}
   */
  InterestTaskExercise.prototype.$onDestroy = function() {
    this._unwatch();
  };

  /**
   * Adds value to `stack`, increases `sum`
   * and invokes the `onUpdate` callback.
   *
   * @public
   * @method onDrop
   * @return {Void}
   */
  InterestTaskExercise.prototype.onDrop = function(value){
    this.stack.push(value);
    this.sum += value;

    this.onUpdate({
      sum: this.sum
    });
  };

  /**
   * Removes last item from `stack`, decreases
   * `sum` and invokes the `onUpdate` callback.
   *
   * @public
   * @method revert
   * @return {Void}
   */
  InterestTaskExercise.prototype.revert = function() {
    this.sum -= this.stack.pop();

    this.onUpdate({
      sum: this.sum
    });
  };

  //
  // REGISTRY
  //
  angular.module(module).directive('interestTaskExercise', function(){
    return {
      scope: {
        sum: '=?interestTaskExerciseSum',
        onUpdate: '&interestTaskExerciseOnUpdate',
        disabled: '=?interestTaskExerciseDisabled'
      },
      restrict: 'A',
      transclude: true,
      bindToController: true,
      controller: InterestTaskExercise,
      controllerAs: 'interestTaskExerciseController',
      templateUrl: 'views/directives/tasks/interest-task-exercise.html'
    };
  });

})(ANGULAR_MODULE, angular);
