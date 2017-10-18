/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

  // --------------------------------------------------
  // BombTask
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var BombTask = function($scope, $attrs, $element, $injector) {
    var type = $injector.get('TYPE_RISK');
    var user = $injector.get('user');

    this.$scope = $scope;
    this.$attrs = $attrs;
    this.$element = $element;
    this.$injector = $injector;

    this.task = user.getTaskByType(type);
  };

  BombTask.$inject = ['$scope', '$attrs', '$element', '$injector'];

  //
  // PROPERTIES
  //

  // SERVER

  /** @var {object} task Task's resource from server. */
  BombTask.prototype.task = null;

  // GAMEPLAY

  /** @var {boolean} started If the task has started. */
  BombTask.prototype.started = false;

  /** @var {boolean} stopped If the task has stopped. */
  BombTask.prototype.stopped = false;

  /** @var {boolean} hasBomb If bomb is in current collection. */
  BombTask.prototype.hasBomb = false;

  /** @var {boolean} resolved If player has resolved the game. */
  BombTask.prototype.resolved = false;

  /** @var {number} totalBoxes Total boxes of current game. */
  BombTask.prototype.totalBoxes = 0;

  /** @var {number} remainingBoxes Remaining boxes of current game. */
  BombTask.prototype.remainingBoxes = 0;

  /** @var {number} collectedBoxes Collected boxes of current game. */
  BombTask.prototype.collectedBoxes = 0;

  // SETTINGS

  /** @var {number} avg Average of collected boxes from statistics. */
  BombTask.prototype.avg = 12;

  /** @var {number} rows Amount of rows for bomb task. */
  BombTask.prototype.rows = 5;

  /** @var {number} cols Amount of cols for bomb task. */
  BombTask.prototype.cols = 5;

  /** @var {number} interval Timeout for interval in seconds. */
  BombTask.prototype.interval = 1;

  /** @var {boolean} random
   * - If `random` = false, boxes are collected row-wise one-by-one, starting in the top-left corner
   * - If `random` = true, boxes are collected randomly (Fisher-Yates Algorithm)
   * Note that this affects game play independently of `dynamic` property
   */
  BombTask.prototype.random = false;

  /** @var {boolean} dynamic
   * - If `dynamic` = true, one box per time interval is collected automatically
   * - In case of `dynamic` = true, game play is affected by the variables `interval` and `random`
   * - If `dynamic` = false, subjects collect as many boxes as they want by clicking or entering the respective number
   * - In case of `dynamic` = false, game play is affected by the variables `random`
   */
  BombTask.prototype.dynamic = false;

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
  BombTask.prototype.$onInit = function() {
    this.init();
  };

  /**
   * Retrieves result payload for server.
   *
   * @public
   * @method getPayload
   * @return {Void}
   */
  BombTask.prototype.getPayload = function() {
    return {
      task: this.task,
      json: {
        hasBomb: this.hasBomb,
        collectedBoxes: this.collectedBoxes
      },
      ticketCount: this.getTicketCount()
    };
  };

  /**
   * Whether or not task is currently locked.
   *
   * @public
   * @method isLocked
   * @return {boolean}
   */
  BombTask.prototype.isLocked = function() {
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
  BombTask.prototype.canResolve = function() {
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

    if (this.dynamic) {
      return this.stopped;
    }

    if (!this.collectedBoxes) {
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
  BombTask.prototype.init = function() {
    this._initMembers();
    this._initMatrix();
    this._initBomb();

    if (!this.dynamic) {
      this.start();
    }
  };

  /**
   * Resets initial state.
   *
   * @public
   * @method reset
   * @return {Void}
   */
  BombTask.prototype.reset = function() {
    this.init();
  };

  /**
   * Sets `started` flag. If `dynamic` is true,
   * the interval will start to reveal cards.
   *
   * @public
   * @method start
   * @return {Void}
   */
  BombTask.prototype.start = function(index) {
    if (this.dynamic) {
      var $interval = this.$injector.get('$interval');

      this._intIndex = index || 0;

      var me = this;
      var max = this.iterator.length;
      this._intervalId = $interval(
        function(){

          var item = me.iterator[me._intIndex];
          me.update(item,true);

          me._intIndex++;
          if (me._intIndex===max) {
            me.stop();
          }

        },
        this.interval*1000, // = from seconds
        max - this._intIndex // = max iterations
      );
    }

    this.started = true;
  };

  /**
   * Sets `stopped` flag. If `dynamic` is true,
   * the interval will be stopped in addition.
   *
   * @public
   * @method start
   * @return {Void}
   */
  BombTask.prototype.stop = function() {
    if (this.dynamic && this._intervalId) {
      var $interval = this.$injector.get('$interval');
      $interval.cancel(this._intervalId);
    }

    this.stopped = true;
  };

  /**
   * Sets `resolved` flag. Calls `onResolve`
   * callback with JSON result for consumer.
   *
   * @public
   * @method resolve
   * @return {Void}
   */
  BombTask.prototype.resolve = function() {
    var $q = this.$injector.get('$q');

    if (!this.canResolve()) {
      var defer = $q.defer();
      defer.reject();

      return defer.promise;
    }

    var result = this.onResolve({
      payload: this.getPayload()
    });

    var resolveCard = function(card) {
      card.$$resolved = true;
    };

    var me = this;
    var successCallback = function() {
      angular.forEach(me.collection, resolveCard);
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
   * Calculates final ticket amount by predefined formula.
   *
   * @public
   * @method getTicketCount
   * @return {number}
   */
  BombTask.prototype.getTicketCount = function(){
    if (this.hasBomb) {
      return 1;
    }

    return this.collectedBoxes;
  };

  /**
   * Callback for card click. Updates all
   * related properties for final result.
   *
   * @public
   * @method toggle
   * @param {object} column
   * @param {boolean} active
   * @return {Void}
   */
  BombTask.prototype.toggle = function(column, active) {
    var index = this.collection.indexOf(column);

    if (active) {
      if (index<0) {
        this.collection.push(column);
        this.collectedBoxes++;
      }

      column.$$active = true;
    } else {
      if (index>=0) {
        this.collection.splice(index,1);
        column.$$active = false;
        this.collectedBoxes--;
      }
    }

    if (this.isBomb(column)) {
      this.hasBomb = true;
    }

    var total = this.totalBoxes;
    var collected = this.collectedBoxes;
    this.remainingBoxes = total - collected;
  };

  /**
   * Provides indiviual tracking id for column.
   *
   * @public
   * @method trackId
   * @param {object} column
   * @return {Void}
   */
  BombTask.prototype.trackId = function(column) {
    return column.row + '_' + column.col;
  };

  /**
   * Determines if column is actual bomb.
   *
   * @public
   * @method isBomb
   * @param {object} column
   * @return {Void}
   */
  BombTask.prototype.isBomb = function(column) {
    return angular.equals(this.bomb,column);
  };

  /**
   * Initialzes internal properties.
   *
   * @private
   * @method _initMembers
   * @return {Void}
   */
  BombTask.prototype._initMembers = function() {
    this.collection = [];

    this.hasBomb = false;
    this.started = false;
    this.stopped = false;
    this.resolved = false;

    this.collectedBoxes = 0;
    this.remainingBoxes = 0;
    this.totalBoxes = this.rows * this.cols;
  };

  /**
   * Calculates the actual matrix.
   *
   * @private
   * @method _initMatrix
   * @return {Void}
   */
  BombTask.prototype._initMatrix = function() {
    this.matrix = [];
    this.iterator = [];

    for (var i=0; i<this.rows; i++) {

      var columns = [];
      for( var j=0; j<this.cols; j++ ) {
        var data = {
          row: i+1,
          col: j+1
        };

        columns.push(data);

        if (this.dynamic) {
          if (!this.random) {
            this.iterator.push(data);
          } else {
            var random = this.$injector.get('random');
            random.push(this.iterator,data);
          }
        }
      }

      this.matrix.push(columns);
    }
  };

  /**
   * Initializes bomb's actual location.
   *
   * @private
   * @method _initBomb
   * @return {Void}
   */
  BombTask.prototype._initBomb = function() {
    var random = this.$injector.get('random');

    var row = random.between(0,this.rows-1);
    var col = random.between(0,this.cols-1);

    this.bomb = this.matrix[row][col];
  };

  //
  // REGISTRY
  //
  angular.module(module).directive('bombTask',function(){
    return {
      scope: {
        avg: '=?bombTaskAvg',
        rows: '=?bombTaskRows',
        cols: '=?bombTaskCols',
        random: '=?bombTaskRandom',
        dynamic: '=?bombTaskDynamic',
        interval: '=?bombTaskInterval',
        onResolve: '&bombTaskOnResolve'
      },
      restrict: 'A',
      transclude: true,
      controller: BombTask,
      bindToController: true,
      controllerAs: 'bombTaskController',
      templateUrl: 'views/directives/tasks/bomb-task.html'
    };
  });

  // --------------------------------------------------
  // BombTask Card
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var BombTaskCard = function(){
  };

  //
  // PROPERTIES
  //

  /** @var {string} id Card's accociated model. */
  BombTaskCard.prototype.model = null;

  /** @var {string} isActive If card is active. */
  BombTaskCard.prototype.isActive = false;

  /** @var {string} isDisabled If card is disabled. */
  BombTaskCard.prototype.isDisabled = false;

  /** @var {string} isClickable If card is clickable. */
  BombTaskCard.prototype.isClickable = true;

  //
  // METHODS
  //

  /**
   * Toggles `isActive` if `isDisabled` and
   * `isClickable` allow the action. Invokes
   * `onToggle` callback for consumer.
   *
   * @public
   * @method toggle
   * @return {Void}
   */
  BombTaskCard.prototype.toggle = function() {
    if (this.isDisabled || !this.isClickable) {
      return;
    }

    this.isActive = !this.isActive;

    this.onToggle({
      model:this.model,
      state:this.isActive
    });
  };

  // registry
  angular.module(module).directive('bombTaskCard', function(){
    return {
      scope: {
        model:'=bombTaskCard',
        onToggle:'&bombTaskCardOnToggle',
        isActive:'=?bombTaskCardIsActive',
        isDisabled:'=?bombTaskCardIsDisabled',
        isClickable:'=?bombTaskCardIsClickable'
      },
      restrict: 'A',
      transclude: true,
      controller: BombTaskCard,
      bindToController: true,
      controllerAs: 'bombTaskCardController',
      templateUrl: 'views/directives/tasks/bomb-task-card.html'
    };
  });

})(ANGULAR_MODULE, angular);
