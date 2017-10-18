/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

  //
  // SERVICE
  //

  /**
   * @constructor
   */
  var User = function($injector) {
    this.$injector = $injector;

    this._states = [
      $injector.get('STATE_BEGINNER'),
      $injector.get('STATE_AMATEUR'),
      $injector.get('STATE_ADVANCED'),
      $injector.get('STATE_EXPERT')
    ];

    this._eventSource = null;
    this._results = [];
    this._payload = {};
    this._pending = {};
    this._tasks = {};
  };

  User.$inject = ['$injector'];

  //
  // PROPERTIES
  //

  /** @var {number} state Current state of user. */
  User.prototype.state = null;

  /** @var {number} group Random group of user. */
  User.prototype.group = null;

  /** @var {number} tickets Current ticket count. */
  User.prototype.tickets = null;

  //
  // METHODS
  //

  /**
   * Fetches current user through `User` resource.
   *
   * @public
   * @method load
   * @return {void}
   */
  User.prototype.load = function() {
    var User = this.$injector.get('User');

    var me = this;
    var successCallback = function(user) {

      // save only json payload from
      // ng-resource's `user` object
      me._payload = user.toJSON();

      // initialize members
      me._initTickets();
      me._initState();
      me._initGroup();

      // gameplay setup calls
      // only for `ROLE_USER`!
      if (!me.isUser()) {
        return;
      }

      // init tasks at first!
      me._initWatches();
      me._initTasks();

      // then results & SSE!
      me._initPending();
      me._initResults();
      me._initSSE();
    };

    var failureCallback = function(/*rejection*/) {

    };

    var current = User.current();

    current.$promise.then(
      successCallback,
      failureCallback
    );

    return current;
  };

  /**
   * Resets current user session from application.
   *
   * @public
   * @method reset
   * @return {void}
   */
  User.prototype.unload = function() {
    var sse = this.$injector.get('sse');

    if (this._eventSource) {
      sse.removeSource(this._eventSource);
    }

    if (this._unwatchTickets) {
      this._unwatchTickets();
    }

    if (this._unwatchState) {
      this._unwatchState();
    }

    this._eventSource = null;
    this._results = [];
    this._payload = {};
    this._pending = {};
    this._tasks = {};

    this.tickets = null;
    this.state = null;
    this.group = null;
  };

  /**
   * Updates user from external scopes.
   * This is helpful for refreshing its
   * state without invoking a request to
   * the server when user was embedded in
   * another request's response.
   *
   * @public
   * @method update
   * @param {object} result
   * @return {void}
   *
   */
  User.prototype.update = function(result) {
    this._payload = result.user;

    this._addResult(result);
    this._initTickets();
    this._initState();
    this._initGroup();
  };

  /**
   * Checks if current user has role `ROLE_USER`.
   *
   * @public
   * @method isUser
   * @return {boolean}
   */
  User.prototype.isUser = function() {
    return this.hasRole('ROLE_USER');
  };

  /**
   * Checks if current user has role `ROLE_ADMIN`.
   *
   * @public
   * @method isAdmin
   * @return {boolean}
   */
  User.prototype.isAdmin = function() {
    return this.hasRole('ROLE_ADMIN');
  };

  /**
   * Checks if current user has role `ROLE_SUPER_ADMIN`.
   *
   * @public
   * @method isSuperAdmin
   * @return {boolean}
   */
  User.prototype.isSuperAdmin = function() {
    return this.hasRole('ROLE_SUPER_ADMIN');
  };

  /**
   * Checks if current user's workshop is active.
   *
   * @public
   * @method isInWorkshop
   * @return {boolean}
   */
  User.prototype.isInWorkshop = function() {
    if (!this.isUser()) {
      return true;
    }

    return this._payload.workshop.isActive;
  };

  /**
   * Checks if current user has given role.
   *
   * @public
   * @method hasRole
   * @param {string|array} role
   * @return {boolean}
   */
  User.prototype.hasRole = function(role) {
    if (!angular.isArray(role)) {
      role = [role];
    }

    var roles = this._payload.roles || [];
    for (var i=0; i<role.length; i++) {
      if (roles.indexOf(role[i])>=0) {
        return true;
      }
    }

    return false;
  };

  /**
   * Provides user's task hash map.
   *
   * @public
   * @method getTasks
   * @return {object}
   */
  User.prototype.getTasks = function() {
    return this._tasks;
  };

  /**
   * Gets `task` resource of user by type.
   *
   * @public
   * @method getTaskByType
   * @param {string} type
   * @return {object|null}
   */
  User.prototype.getTaskByType = function(type) {
    return this._tasks[type] || null;
  };

  /**
   * Gets pending `result` resource of user by type.
   *
   * @public
   * @method getResultByType
   * @param {string} type
   * @return {object|null}
   */
  User.prototype.getPendingByType = function(type) {
    return this._pending[type] || null;
  };

  /**
   * Gets `state` mapped to string representation.
   *
   * @public
   * @method getGroupAsString
   * @return {string}
   */
  User.prototype.getGroupAsString = function() {
    switch(this.group) {
      case this.$injector.get('GROUP_A'):
        return 'GROUP_A';
      case this.$injector.get('GROUP_B'):
        return 'GROUP_B';
      default:
        return null;
    }
  };

  /**
   * Gets `state` mapped to string representation.
   *
   * @public
   * @method getStateAsString
   * @return {string}
   */
  User.prototype.getStateAsString = function() {
    switch(this.state) {
      case this.$injector.get('STATE_AMATEUR'):
        return 'STATE_AMATEUR';
      case this.$injector.get('STATE_ADVANCED'):
        return 'STATE_ADVANCED';
      case this.$injector.get('STATE_EXPERT'):
        return 'STATE_EXPERT';
      default:
        return 'STATE_BEGINNER';
    }
  };

  /**
   * Initializes `state` member.
   *
   * @private
   * @method _initState
   * @return {void}
   */
  User.prototype._initState = function() {
    var STATE_BEGINNER = this.$injector.get('STATE_BEGINNER');
    this.state = this._payload.state || STATE_BEGINNER;
  };

  /**
   * Initializes `group` member.
   *
   * @private
   * @method _initGroup
   * @return {void}
   */
  User.prototype._initGroup = function() {
    this.group = this._payload.group || null;
  };

  /**
   * Initializes `tickets` member.
   *
   * @private
   * @method init
   * @return {void}
   */
  User.prototype._initTickets = function() {
    var tickets = this._payload.tickets;
    this.tickets = tickets || [];
  };

  /**
   * Watches `state` and `tickets` for changes to
   * show the corresponding user notifications.
   *
   * @private
   * @method _initWatches
   * @return {void}
   */
  User.prototype._initWatches = function() {
    var notification = this.$injector.get('notification');
    var $rootScope = this.$injector.get('$rootScope');
    var i18n = this.$injector.get('i18n');
    var me = this;

    var _watchStateExpression = function() {
      return me.state;
    };

    var _watchStateCallback = function(newState, oldState) {
      if (newState === oldState) {
        return;
      }

      notification.success(
        i18n.get(
          'Congratulations, you have reached the state %s!',
          i18n.get(me.getStateAsString())
        )
      );
    };

    var _watchTicketsExpression = function() {
      return me.tickets;
    };

    var _watchTicketsCallback = function(newTickets, oldTickets) {
      if (newTickets === oldTickets) {
        return;
      }

      var oldCount = oldTickets && oldTickets.length;
      var newCount = newTickets && newTickets.length;

      var tickets = newCount - oldCount;
      if (tickets <= 0) {
        return;
      }

      var message = tickets === 1 ?
        i18n.get('Congratulations, you have earned 1 new ticket!') :
        i18n.get('Congratulations, you have earned %s new tickets!', tickets);

      notification.primary(message);
    };

    this._unwatchTickets = $rootScope.$watchCollection(
      _watchTicketsExpression,
      _watchTicketsCallback
    );

    this._unwatchState = $rootScope.$watch(
      _watchStateExpression,
      _watchStateCallback
    );
  };


  /**
   * Destroys user session and redirects to login.
   *
   * @private
   * @method _initSSE
   * @return {Void}
   */
  User.prototype._initSSE = function()
    {
      var $rootScope = this.$injector.get('$rootScope');
      var API_URL = this.$injector.get('API_URL');
      var sse = this.$injector.get('sse');

      // don't setup SSE when playing remote
      var workshop = this._payload.workshop;
      if (!workshop.isActive) {
        return;
      }

      var me = this;

      var _onMessage = function(data) {
        $rootScope.$evalAsync(function(){
          angular.forEach(data, function(item) {
            var unix = Date.parse(item.updatedAt);
            var task = me._tasks[item.type];
            task.isActive = !!item.isActive;

            if (!isNaN(unix)) {
              item.updatedAt = unix;
            }
          });
        });
      };

      var url = API_URL + '/sse/workshop/' + workshop.id + '/tasks';
      var options = { onMessage: _onMessage, sleep: 1 };
      this._eventSource = sse.addSource(url, options);
    };

  /**
   * Caches task hash map from workshop
   * for lookups from `getTaskByType()`.
   *
   * @private
   * @method _initTasks
   * @return {void}
   */
  User.prototype._initTasks = function() {
    var workshop = this._payload.workshop;
    if (!workshop) {
      return;
    }

    var me = this;
    angular.forEach(workshop.tasks,function(task) {
      me._tasks[task.type] = task;
    });
  };

  /**
   * Caches pending hash map from workshop
   * for lookups from `getPendingByType()`.
   *
   * @private
   * @method _initPending
   * @return {void}
   */
  User.prototype._initPending = function() {
    var pending = this._payload.pending;
    if (!pending) {
      return;
    }

    var me = this;
    angular.forEach(pending,function(result) {
      me._pending[result.task.type] = result;
    });
  };

  /**
   * Caches results hash map from workshop
   * for lookups from `getResultsByType()`.
   *
   * @private
   * @method _initResults
   * @return {void}
   */
  User.prototype._initResults = function() {
    var _addResult = this._addResult.bind(this);
    var results = this._payload.results || [];

    angular.forEach(results, _addResult);
  };

  /**
   * Adds result to collection and sets `$$result`
   *
   * @private
   * @method _addResult
   * @param {object} result
   * @return {void}
   */
  User.prototype._addResult = function(result) {
    var task = this.getTaskByType(result.task.type);
    if (task !== null) {
      var current = task.$$results || 0;
      task.$$results = current + 1;
    }

    this._results.push(result);
  };

  //
  // REGISTRY
  //
  angular.module(module).service('user', User);

})(ANGULAR_MODULE, angular);
