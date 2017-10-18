/* global ANGULAR_MODULE, angular, moment */
/* jshint bitwise: false */
(function(module, angular) {
  'use strict';

  // --------------------------------------------------
  // ProcrastinationTask
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var ProcrastinationTask = function($scope, $elemnt, $attrs, $injector) {
    var type = $injector.get('TYPE_PROCRASTINATION');
    var user = $injector.get('user');

    this.$injector = $injector;
    this.task = user.getTaskByType(type);
    this.result = user.getPendingByType(type);

    this.domId = 'procrastination-task-' + $scope.$id;

    this._intervalId = null;
    this._onInterval = this._onInterval.bind(this);
  };

  ProcrastinationTask.$inject = ['$scope','$element','$attrs', '$injector'];

  // SERVER

  /** @var {string} type Task's `type` property from server. */
  ProcrastinationTask.prototype.type = null;

  /** @var {object} task Task's resource from server. */
  ProcrastinationTask.prototype.task = null;

  /** @var {object} result Task's pending result from server. */
  ProcrastinationTask.prototype.result = null;

  // GAMEPLAY

  /** @var {string} mode One of `ALL` or `SPLIT`. */
  ProcrastinationTask.prototype.mode = null;

  /** @var {number} rounds Current game round count. */
  ProcrastinationTask.prototype.count = 0;

  /** @var {number} total Total rounds depends on `mode`. */
  ProcrastinationTask.prototype.total = 1;

  /** @var {array} rounds Results of single game rounds. */
  ProcrastinationTask.prototype.rounds = [];

  /** @var {number} openRounds Number of left rounds to play. */
  ProcrastinationTask.prototype.openRounds = null;

  /** @var {number} minCatched Minimum catched bubbles depends on `mode`. */
  ProcrastinationTask.prototype.minCatched = null;

  /** @var {number} maxEscaped Maximum escaped bubbles depends on `mode`. */
  ProcrastinationTask.prototype.maxEscaped = null;

  /** @var {number} updatedAt When last result was written. */
  ProcrastinationTask.prototype.updatedAt = null;

  /** @var {number} invalidAt When task will be unresolvable. */
  ProcrastinationTask.prototype.invalidAt = null;

  /** @var {string} state One of `IDLE`, `DECISION`, `PLAYING`. */
  ProcrastinationTask.prototype.state = 'IDLE';

  /** @var {boolean} resolved If player has resolved the game. */
  ProcrastinationTask.prototype.resolved = false;

  // MISC

  /** @var {string} domId Unique dom id for this task for scrolling purposes. */
  ProcrastinationTask.prototype.domId = null;

  /** @var {boolean} warmup If dry-run has been finished. */
  ProcrastinationTask.prototype.hasWarmup = false;

  /** @var {number} warmupMaxEscaped Maximum escaped bubbles for demo mode. */
  ProcrastinationTask.prototype.warmupMaxEscaped = 2;

  /** @var {number} warmupMinCatched Minimum catched bubbles for demo mode. */
  ProcrastinationTask.prototype.warmupMinCatched = 20;

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
  ProcrastinationTask.prototype.$onInit = function() {
    this.init();
  };

  /**
   * Proxies to `init()` if controller's ready.
   *
   * @public
   * @method $onInit
   * @return {void}
   */
  ProcrastinationTask.prototype.$onDestroy = function() {
    var $interval = this.$injector.get('$interval');

    if (this._intervalId !== null) {
      $interval.cancel(this._intervalId);
    }
  };

  /**
   * Retrieves result payload for server.
   *
   * @public
   * @method getPayload
   * @return {void}
   */
  ProcrastinationTask.prototype.getPayload = function() {
    var payload = {
      task: this.task,
      json: {
        mode: this.mode,
        state: this.state,
        rounds: this.rounds,
        success: this.hasSuccess()
      },
      isPending: this._isPending(),
      ticketCount: this.getTicketCount()
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
  ProcrastinationTask.prototype.isLocked = function() {
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
  ProcrastinationTask.prototype.canResolve = function() {
    var user = this.$injector.get('user');
    if (!user.isUser()) {
      return false;
    }

    if (this.isLocked()) {
      return false;
    }

    if (!this.hasWarmup) {
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
  ProcrastinationTask.prototype.init = function() {
    // check for pending result
    if (this.result !== null) {
      var json = this.result.json;

      // 1) apply round / count
      this.rounds = json.rounds;
      this.count = json.rounds.length;

      // 2) call setters only now
      this.setWarmup(true);
      this.setMode(json.mode);
      this.setState(json.state);
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
  ProcrastinationTask.prototype.reset = function(){
    this.init();
  };

  /**
   * Description.
   *
   * @public
   * @method update
   * @return {void}
   */
  ProcrastinationTask.prototype.update = function(result){
    var state = this.state;
    var count = this.count;

    switch (this.state) {
      case 'IDLE':
        this.setState('DECISION');
        break;

      case 'DECISION':
        this.setState('PLAYING');
        break;

      case 'PLAYING':
        this.count = this.rounds.push(result);
        break;
      default:
    }

    var me = this;
    var successCallback = function(){};
    var failureCallback = function(){
      me.setState(state);
      me.count = count;
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
  ProcrastinationTask.prototype.resolve = function(){
    var notification = this.$injector.get('notification');
    var i18n = this.$injector.get('i18n');
    var $q = this.$injector.get('$q');

    console.log('>>>RESOLVE!');

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
      var message;

      if (result.isPending) {
        me.result = result;

        switch (me.state) {
          case 'IDLE': break;
          case 'DECISION': break;
          case 'PLAYING':
            switch (me.mode) {
              case 'ALL': break;
              case 'SPLIT':
                if (me.count > 0) {
                  message = i18n.get(
                    'Super, you have succeeded exercise %s of %s!',
                    me.count,
                    me.total
                  );
                  notification.success(message);
                }
                break;
              default:
                break;
            }
            break;
          default:
        }

        return;
      }

      if (!me.hasSuccess()) {
        message = i18n.get('Sorry, but the time has expired for this exercise and you retrieve only 1 ticket!');
        notification.error(message);
      } else {
        message = i18n.get('Super, you have successfully done this exercise and retrieve 5 tickets!');
        notification.success(message);
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
   * Sets game mode to `ALL` or `SPLIT`.
   *
   * @public
   * @method setMode
   * @param {string} mode
   * @return {void}
   */
  ProcrastinationTask.prototype.setMode = function(mode){
    switch (mode) {
      case 'ALL':
        this.total = 1;
        this.maxEscaped = 15;
        this.minCatched = 150;
        break;
      case 'SPLIT':
        this.total = 3;
        this.maxEscaped = 5;
        this.minCatched = 50;
        break;
      default:
        return;
    }

    this.mode = mode;
    this.openRounds = this.total - this.count;
  };

  /**
   * Sets game state to `IDLE`, `DECISION` or `PLAYING`.
   *
   * @public
   * @method setState
   * @param {string} state
   * @return {void}
   */
  ProcrastinationTask.prototype.setState = function(state){
    var $interval = this.$injector.get('$interval');

    switch (state) {
      case 'IDLE':
        break;
      case 'DECISION':
        break;
      case 'PLAYING':
        var updatedAt = this.result.updatedAt;
        this.updatedAt = moment.unix(updatedAt);
        this.invalidAt = this.updatedAt.clone();

        switch (this.mode) {
          case 'ALL':
            this.invalidAt.add(6, 'weeks');
            break;
          case 'SPLIT':
            this.invalidAt.add(2, 'weeks');
            break;
          default:
        }

        this._intervalId = $interval(this._onInterval, 1000);

        break;
      default:
        return;
    }

    this.state = state;
  };

  /**
   * Sets `hasWarmup` flag after dry run.
   *
   * @public
   * @method setWarmup
   * @param {boolean} warmup
   * @return {void}
   */
  ProcrastinationTask.prototype.setWarmup = function(warmup){
    this.hasWarmup = warmup;
  };

  /**
   * Whether or not task is actually invalid.
   *
   * @public
   * @method isInvalid
   * @return {boolean}
   */
  ProcrastinationTask.prototype.isInvalid = function() {
    if (this.invalidAt === null) {
      return false;
    }

    return +this._now() > +this.invalidAt;
  };

  /**
   * If amount of results corresponds to `total`.
   *
   * @public
   * @method hasSuccess
   * @return {boolean}
   */
  ProcrastinationTask.prototype.hasSuccess = function() {
    return this.rounds.length === this.total;
  };

  /**
   * Retrieves the current played round.
   *
   * @public
   * @method getCurrentRound
   * @return {string}
   */
  ProcrastinationTask.prototype.getCurrentRound = function(){
    return this.count + 1;
  };

  /**
   * Calculates remaining time for finishing
   * this task depending on chosen game mode.
   *
   * @public
   * @method getRemainingTime
   * @return {string}
   */
  ProcrastinationTask.prototype.getRemainingTime = function(){
    var string = this.$injector.get('string');
    var i18n = this.$injector.get('i18n');

    if (this.invalidAt === null) {
      return '';
    }

    var difference = this.invalidAt.diff(this._now());
    var duration = moment.duration(difference);

    var seconds = ~~duration.asSeconds();
    var minutes = ~~duration.asMinutes();
    var hours = ~~duration.asHours();
    var days = ~~duration.asDays();
    var value, keys;

    if (days > 0) {
      value = days;
      keys = ['day', 'days'];
    } else if (hours > 0) {
      value = hours;
      keys = ['hour', 'hours'];
    } else if (minutes > 0) {
      value = minutes;
      keys = ['minute', 'minutes'];
    } else {
      value = seconds >= 0 ? seconds : 0;
      keys = ['second', 'seconds'];
    }

    var key = value === 1 ?
      keys[0] :
      keys[1];

    var unit = i18n.get(key);

    return string.sprintf('%s %s', value, unit);
  };

  /**
   * Calculates final ticket amount by predefined formula.
   *
   * @public
   * @method getTicketCount
   * @return {number}
   */
  ProcrastinationTask.prototype.getTicketCount = function(){
    if (this.hasSuccess()) {
      return 5;
    }

    return 1;
  };

  /**
   * Interval callback for checking invalidation.
   *
   * @private
   * @method _onInterval
   * @return {boolean}
   */
  ProcrastinationTask.prototype._onInterval = function() {
    var $interval = this.$injector.get('$interval');
    if (!this.isInvalid() || !this.canResolve()) {
      return;
    }

    $interval.cancel(this._intervalId);
    this.count = this.total;
    this.resolve();
  };

  /**
   * Whether or not task is currently pending.
   *
   * @private
   * @method _isPending
   * @return {boolean}
   */
  ProcrastinationTask.prototype._isPending = function() {
    return this.count < this.total;
  };

  /**
   * Gets the current timestamp as moment.
   *
   * @private
   * @method _now
   * @return {object}
   */
  ProcrastinationTask.prototype._now = function() {
    /*
    if (!this._testInvalidation) {
      this._testInvalidation = this.invalidAt.clone().subtract(3, 'seconds')
    } else {
      this._testInvalidation.add(1, 'second');
    }
    return this._testInvalidation;
    */
    return moment();
  };

  //
  // REGISTRY
  //
  angular.module(module).directive('procrastinationTask', function(){
    return {
      scope: {
        onUpdate: '&procrastinationTaskOnUpdate',
        onResolve: '&procrastinationTaskOnResolve'
      },
      restrict: 'A',
      transclude: true,
      controller: ProcrastinationTask,
      bindToController: true,
      controllerAs: 'procrastinationTaskController',
      templateUrl: 'views/directives/tasks/procrastination-task.html'
    };
  });

  // --------------------------------------------------
  // ProcrastinationTask Game
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var ProcrastinationTaskGame = function($scope,$element,$attrs,$injector) {
    this.$scope = $scope;
    this.$attrs = $attrs;
    this.$element = $element;
    this.$injector = $injector;

    this.bubbles = {};
    this.viewport = {};
    this.domId = 'viewport-' + $scope.$id;

    this._nextId = 0;
    this._tapped = 0;
    this._rounds = 0;
    this._retries = 0;
    this._timeout = 100;
    this._requestId = null;

    this._loop = this._loop.bind(this);
    this._update = this._update.bind(this);
    this._resize = this._resize.bind(this);

    this._window = angular.element(window);
    this._viewport = this.$element.find('.viewport');
  };

  ProcrastinationTaskGame.$inject = ['$scope','$element','$attrs','$injector'];

  //
  // PROPERTIES
  //

  /** @var {number} catched Count of catched bubbles. */
  ProcrastinationTaskGame.prototype.catched = 0;

  /** @var {number} escaped Count of escaped bubbles. */
  ProcrastinationTaskGame.prototype.escaped = 0;

  /** @var {number} accuracy Players scoring accuracy. */
  ProcrastinationTaskGame.prototype.accuracy = 0;

  /** @var {object} bubbles Hash map keeping bubble objects. */
  ProcrastinationTaskGame.prototype.bubbles = null;

  /** @var {object} viewport Viewport holding dimensions and offsets. */
  ProcrastinationTaskGame.prototype.viewport = null;

  /** @var {boolean} state One of `IDLE`, `RUNNING`, `TIMEOUT`, `GAME_OVER` or `GAME_DONE`. */
  ProcrastinationTaskGame.prototype.state = 'IDLE';

  /** @var {boolean} expired Flag for expiring current game while its running. */
  ProcrastinationTaskGame.prototype.expired = false;

  /** @var {number} maxRounds Maximum number of rounds after `GAME_DONE`. */
  ProcrastinationTaskGame.prototype.maxRounds = 1;

  /** @var {number} maxRounds Maximum number of retries after `GAME_OVER`. */
  ProcrastinationTaskGame.prototype.maxRetries = Number.POSITIVE_INFINITY;

  /** @var {number} maxEscaped Maximum amount of escaped bubbles for `GAME_OVER`. */
  ProcrastinationTaskGame.prototype.maxEscaped = 15;

  /** @var {number} maxEscaped Maximum amount of escaped bubbles for `GAME_DONE`. */
  ProcrastinationTaskGame.prototype.minCatched = 150;

  /** @var {string} bubbleDelay Timeout until next bubble will appear on viewport. */
  ProcrastinationTaskGame.prototype.bubbleDelay = 100;

  //
  // METHODS
  //

  /**
   * Sets up event listeners and animation frame.
   *
   * @public
   * @method $onInit
   * @return {void}
   */
  ProcrastinationTaskGame.prototype.$onInit = function() {
    this._window.on('resize', this._resize);

    var me = this;
    this._unwatch = this.$scope.$watch(
      function() {
        return me.expired;
      },
      function(isExpired) {
        if (isExpired) {
          me.expire();
        }
      }
    );
  };

  /**
   * Removes event listener and animation frame.
   *
   * @public
   * @method $onDestroy
   * @return {void}
   */
  ProcrastinationTaskGame.prototype.$onDestroy = function() {
    this._window.off('resize', this._resize);
    this._unwatch();
    this._unloop();
  };

  /**
   * Invokes game loop and sets `RUNNING` state.
   *
   * @public
   * @method start
   * @return {void}
   */
  ProcrastinationTaskGame.prototype.start = function() {
    // calculate viewport now that we can
    // be sure that elements are rendered
    this.viewport = this._getViewport();

    this.state = 'RUNNING';
    this._loop();
  };

  /**
   * Stops and sets `GAME_OVER` state.
   *
   * @public
   * @method gameOver
   * @return {void}
   */
  ProcrastinationTaskGame.prototype.quit = function() {
    this._unloop();

    this._retries++;

    this.bubbles = {};
    this.state = 'GAME_OVER';

    var result = this._getResult();
    this.onGameOver({ result: result });
  };

  /**
   * Stops and sets `FINISHED` state.
   *
   * @public
   * @method done
   * @return {void}
   */
  ProcrastinationTaskGame.prototype.done = function() {
    this._unloop();

    this._rounds++;

    this.bubbles = {};
    this.state = 'GAME_DONE';

    var result = this._getResult();
    this.onGameDone({ result: result });
  };

  /**
   * Stops and sets `TIMEOUT` state.
   *
   * @public
   * @method expire
   * @return {void}
   */
  ProcrastinationTaskGame.prototype.expire = function() {
    this._unloop();

    this.bubbles = {};
    this.state = 'TIMEOUT';
  };

  /**
   * Resets game and sets `IDLE` state.
   *
   * @public
   * @method reset
   * @return {void}
   */
  ProcrastinationTaskGame.prototype.reset = function() {
    this._unloop();

    this._nextId = 0;
    this._tapped = 0;
    this._timeout = 100;
    this._requestId = null;

    this.catched = 0;
    this.escaped = 0;
    this.accuracy = 0;
    this.state = 'IDLE';
  };

  /**
   * Initializes
   *
   * @public
   * @method $onDestroy
   * @return {void}
   */
  ProcrastinationTaskGame.prototype.onClick = function($event) {
    switch (this.state) {
      case 'IDLE':
        this.start();
        break;
      case 'RUNNING':
        this._tapped++;

        var target = $event.target;
        var viewport = this._viewport.get(0);

        // only update accuracy immediately if
        // clicked on viewport, otherwise this
        // will be done after bubble animation!
        if (viewport.id === target.id) {
          this._setAccuracy();
        }

        break;
      case 'TIMEOUT':
        // noop - disabled
        break;
      case 'GAME_OVER':
        if (this.canRetry()) {
          this.reset();
          this.start();
        }

        break;
      case 'GAME_DONE':
        if (this.canRestart()) {
          this.reset();
          this.start();
        }

        break;
      default:
    }
  };

  /**
   * True if player can retry game after `GAME_OVER`.
   *
   * @public
   * @method canRetry
   * @return {void}
   */
  ProcrastinationTaskGame.prototype.canRetry = function() {
    return this._retries < this.maxRetries;
  };

  /**
   * True if player can retry game after `GAME_OVER`.
   *
   * @public
   * @method canRestart
   * @return {void}
   */
  ProcrastinationTaskGame.prototype.canRestart = function() {
    return this._rounds < this.maxRounds;
  };

  /**
   * Adds bubble controller to internal hash.
   *
   * @public
   * @method addBubble
   * @return {void}
   */
  ProcrastinationTaskGame.prototype.addBubble = function(bubble) {
    this.bubbles[bubble.id] = bubble;
  };

  /**
   * Removes bubble, update counters and checks game state.
   *
   * @public
   * @method removeBubble
   * @return {void}
   */
  ProcrastinationTaskGame.prototype.removeBubble = function(bubble) {
    // don't remove twice ($onDestroy)
    if (!this.bubbles[bubble.id]) {
      return;
    }

    // catched - check min count
    if (bubble.catched) {
      this.catched++;

      // update accuracy
      this._setAccuracy();

      var min = this.minCatched;
      if (this.catched >= min) {
        this.done();
      }
    }

    // escaped - check max count
    if (bubble.escaped) {
      this.escaped++;

      var max = this.maxEscaped;
      if (this.escaped >= max) {
        this.quit();
      }
    }

    delete this.bubbles[bubble.id];
  };

  /**
   * Actual gaming loop for animation frame.
   *
   * @private
   * @method _loop
   * @return {void}
   */
  ProcrastinationTaskGame.prototype._loop = function() {
    var animation = this.$injector.get('animation');

    this._requestId = animation.requestAnimationFrame(this._loop);
    this.$scope.$evalAsync(this._update);
  };

  /**
   * Removes current animation frame.
   *
   * @public
   * @method stop
   * @return {void}
   */
  ProcrastinationTaskGame.prototype._unloop = function() {
    var animation = this.$injector.get('animation');
    animation.cancelAnimationFrame(this._requestId);
  };

  /**
   * Animation frame callback handling creation of new
   * bubbles being rendered and propagates `update()`.
   *
   * @private
   * @method _update
   * @return {void}
   */
  ProcrastinationTaskGame.prototype._update = function() {
    var random = this.$injector.get('random');

    this._timeout--;
    if (this._timeout === 0 ) {
      this._timeout = random.between(0, this.bubbleDelay) + 25;
      this.bubbles[this._nextId++] = null;
    }

    for (var id in this.bubbles) {
      var bubble = this.bubbles[id];
      if (!bubble) {
        continue;
      }

      bubble.update();
    }
  };

  /**
   * Sets up new `ratio` of viewport and propages `resize()`.
   *
   * @private
   * @method resize
   * @return {void}
   */
  ProcrastinationTaskGame.prototype._resize = function() {
    this.viewport = this._getViewport();

    var height = this.viewport.height;
    var width = this.viewport.width;

    this.ratio = width / height;

    for (var id in this.bubbles) {
      var bubble = this.bubbles[id];
      if (!bubble) {
        continue;
      }

      bubble.resize();
    }
  };

  /**
   * Gets result payload for game callbacks.
   *
   * @private
   * @method _getResult
   * @return {void}
   */
  ProcrastinationTaskGame.prototype._getResult = function() {
    return {
      catched: this.catched,
      escaped: this.escaped,
      accuracy: this.accuracy
    };
  };

  /**
   * Calculates and sets `accuracy` property.
   *
   * @private
   * @method _setAccuracy
   * @return {void}
   */
  ProcrastinationTaskGame.prototype._setAccuracy = function() {
    this.accuracy = this.catched / this._tapped;
  };

  /**
   * Gets viewport dimensions and offsets.
   *
   * @private
   * @method _getViewport
   * @return {void}
   */
  ProcrastinationTaskGame.prototype._getViewport = function() {
    var width = this._viewport.width();
    var height = this._viewport.height();
    var top = this._viewport.scrollTop();
    var left = this._viewport.scrollLeft();

    return {
      top: top,
      left: left,
      width: width,
      height: height,
      right: left + width,
      bottom: top + height
    };
  };

  //
  // REGISTRY
  //
  angular.module(module).directive('procrastinationTaskGame', function(){
    return {
      scope: {
        expired: '=?procrastinationTaskGameExpired',
        maxRounds: '=?procrastinationTaskGameMaxRounds',
        maxRetries: '=?procrastinationTaskGameMaxRetries',
        onGameDone: '&procrastinationTaskGameOnGameDone',
        onGameOver: '&procrastinationTaskGameOnGameOver',
        minCatched: '=?procrastinationTaskGameMinCatched',
        maxEscaped: '=?procrastinationTaskGameMaxEscaped',
        bubbleDelay: '=?procrastinationTaskGameBubbleDelay'
      },
      restrict: 'A',
      transclude: true,
      bindToController: true,
      controller: ProcrastinationTaskGame,
      controllerAs: 'procrastinationTaskGameController',
      templateUrl: 'views/directives/tasks/procrastination-task-game.html'
    };
  });

  // --------------------------------------------------
  // ProcrastinationTask Bubble
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var ProcrastinationTaskBubble = function($scope,$element,$attrs,$injector) {
    this.$scope = $scope;
    this.$attrs = $attrs;
    this.$element = $element;
    this.$injector = $injector;

    this.domId = 'bubble-' + $scope.$id;
  };

  ProcrastinationTaskBubble.$inject = ['$scope','$element','$attrs','$injector'];

  //
  // PROPERTIES
  //

  /** @var {array} themes Predefined themes for bubbles. */
  ProcrastinationTaskBubble.prototype.themes = [
    'theme-1',
    'theme-2',
    'theme-3',
    'theme-4',
    'theme-5'
  ];

  /**

  /** @var {string} class CSS class namem for bubble. */
  ProcrastinationTaskBubble.prototype.class = 'bubble';

  /** @var {object} style Style definitions for bubble. */
  ProcrastinationTaskBubble.prototype.style = {};

  /** @var {string} theme A random theme for bubble. */
  ProcrastinationTaskBubble.prototype.theme = null;

  /** @var {number} radius Radius of bubble. */
  ProcrastinationTaskBubble.prototype.radius = null;

  /** @var {number} radius Animation speed of bubble. */
  ProcrastinationTaskBubble.prototype.speed = null;

  /** @var {number} wave Horizontal swinging intensity. */
  ProcrastinationTaskBubble.prototype.wave = null;

  /** @var {number} x Current x position of bubble. */
  ProcrastinationTaskBubble.prototype.x = null;

  /** @var {number} y Current y position of bubble. */
  ProcrastinationTaskBubble.prototype.y = null;

  //
  // METHODS
  //

  /**
   * Registeres bubble with game controller after inital setup.
   *
   * @public
   * @method $onInit
   * @return {void}
   */
  ProcrastinationTaskBubble.prototype.$onInit = function() {
    var random = this.$injector.get('random');
    var game = this.gameController;

    this.theme = random.pick(this.themes);

    this.radius = random.between(0, 15) + 20;
    this.speed = random.between(0, 1.25)  + 2.25;
    this.wave = 1.5 + this.radius;

    var xOffset = this.radius * 2;
    this.y = game.viewport.height + random.between(0, 50) + 50;
    this.x = random.between(xOffset, game.viewport.width - xOffset);

    this._originalR = game.ratio;
    this._originalX = this.x;

    this.style = {
      top: this.y,
      left: this.x,
      width: this.radius * 2,
      height: this.radius * 2
    };

    this.gameController.addBubble(this);
  };

  /**
   * Unregisteres bubble with game controller.
   *
   * @public
   * @method $onDestroy
   * @return {void}
   */
  ProcrastinationTaskBubble.prototype.$onDestroy = function() {
    this.gameController.removeBubble(this);
  };

  /**
   * Updates `x` and `y` coordinates and applies style.
   *
   * @public
   * @method update
   * @return {void}
   */
  ProcrastinationTaskBubble.prototype.update = function() {
    var sin = Math.sin(new Date().getTime() * 0.002);
    this.x = this.wave * sin + this._originalX;
    this.y = this.y - this.speed;

    this.style.left = this.x;
    this.style.top = this.y;

    var offscreenY = -this.radius * 2;
    if (this.y > offscreenY) {
      return;
    }

    this.escaped = true;
    this.gameController.removeBubble(this);
  };

  /**
   * Updates `x` coordinate according to new ratio.
   *
   * @public
   * @method resize
   * @return {void}
   */
  ProcrastinationTaskBubble.prototype.resize = function() {
    var $timeout = this.$injector.get('$timeout');

    var me = this;
    var timeout = function() {
      var ratio = me.gameController.ratio;
      var move = ratio / me._originalR;

      me._originalX *= move;
      me._resizeId = null;
    };

    if (this._resizeId) {
      $timeout.cancel(this._resizeId);
    }

    this._resizeId = $timeout(timeout, 250);
  };

  /**
   *
   *
   * @public
   * @method onClick
   * @return {void}
   */
  ProcrastinationTaskBubble.prototype.onClick = function() {
    var animation = this.$injector.get('animation');
    var $timeout = this.$injector.get('$timeout');

    var me = this;

    var evalAsync = function() {
      me.gameController.removeBubble(me);
    };

    var onAnimationEnd = function() {
      me.$scope.$evalAsync(evalAsync);
      me.$element.off(
        animation.animationEndEvent,
        onAnimationEnd
      );
    };

    if (animation.animationEndEvent) {
      this.$element.on(
        animation.animationEndEvent,
        onAnimationEnd
      );
    } else {
      $timeout(evalAsync, 50);
    }

    this.catched = true;
  };

  //
  // REGISTRY
  //
  angular.module(module).directive('procrastinationTaskBubble', function(){
    return {
      scope: {
        id: '=procrastinationTaskBubble'
      },
      restrict: 'A',
      transclude: true,
      require: {
        'gameController': '^procrastinationTaskGame'
      },
      bindToController: true,
      controller: ProcrastinationTaskBubble,
      controllerAs: 'procrastinationTaskBubbleController',
      templateUrl: 'views/directives/tasks/procrastination-task-bubble.html'
    };
  });

})(ANGULAR_MODULE, angular);
