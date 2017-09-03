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
    var user = $injector.get('user');

    this.$scope = $scope;
    this.$attrs = $attrs;
    this.$element = $element;
    this.$injector = $injector;

    this.task = user.getTaskByType(type);
  };

  InterestTask.$inject = ['$scope', '$element', '$attrs', '$injector'];

  //
  // PROPERTIES
  //

  // SERVER

  /** @var {object} task Task's resource from server. */
  InterestTask.prototype.task = null;

  // GAMEPLAY

  /** @var {boolean} resolved If player has resolved the game. */
  InterestTask.prototype.resolved = false;

   /** @var {number} correctAnswers Count of correct answers. */
  InterestTask.prototype.correctAnswers = 0;

  /** @var {number} exercise1Answer Answer for first exercise. */
  InterestTask.prototype.exercise1Answer = 0;

  /** @var {number} exercise2Answer Answer for second exercise. */
  InterestTask.prototype.exercise2Answer = 0;

  /** @var {boolean} exercise1Correct Resolution state of first exercise. */
  InterestTask.prototype.exercise1Correct = false;

  /** @var {boolean} exercise2Correct Resolution state of second exercise. */
  InterestTask.prototype.exercise2Correct = false;

  /** @var {number} exercise1Result Correct result for first exercise. */
  InterestTask.prototype.exercise1Result = 0;

  /** @var {number} exercise2Result Correct result for second exercise. */
  InterestTask.prototype.exercise2Result = 0;

  // SETTINGS

  /** @var {number} amount Amount of money. */
  InterestTask.prototype.amount = 1000;

  /** @var {number} rate Interest rate. */
  InterestTask.prototype.rate = 0.02;

  /** @var {number} years Number of years. */
  InterestTask.prototype.years = 1;

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
    /* jshint camelcase: false */
    return {
      task: this.task,
      json: {
        exercise1: {
          current_result: this.exercise1Result,
          actual_result: this.exercise1Answer,
          is_valid: this.exercise1Correct
        },
        exercise2: {
          current_result: this.exercise2Result,
          actual_result: this.exercise2Answer,
          is_valid: this.exercise2Correct
        }
      }
    };
    /* jshint camelcase: true */
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

    if (!this.exercise1Answer) {
      return false;
    }

    if (!this.exercise2Answer) {
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
  InterestTask.prototype.init = function() {
    this.resolved = false;
    this.correctAnswers = 0;
    this.exercise1Answer = 0;
    this.exercise2Answer = 0;
    this.exercise1Correct = false;
    this.exercise2Correct = false;
    this.exercise1Result = this._calculateResult(1);
    this.exercise2Result = this._calculateResult(1 + this.years);
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
  InterestTask.prototype.update = function(value, exercise){
    switch(exercise) {
      case 'exercise1':
        this.exercise1Answer = value;
        break;
      case 'exercise2':
        this.exercise2Answer = value;
        break;
      default:
    }

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
   * Sets `resolved` flag. Calls `onResolve`
   * callback with JSON result for consumer.
   *
   * @public
   * @method resolve
   * @return {Void}
   */
  InterestTask.prototype.resolve = function(){
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
        onResolve: '&interestTaskOnResolve'
      },
      restrict: 'A',
      transclude: true,
      controller: InterestTask,
      bindToController: true,
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
      function(){ return me.sum; },
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
      controller: InterestTaskExercise,
      bindToController: true,
      controllerAs: 'interestTaskExerciseController',
      templateUrl: 'views/directives/tasks/interest-task-exercise.html'
    };
  });

})(ANGULAR_MODULE, angular);
