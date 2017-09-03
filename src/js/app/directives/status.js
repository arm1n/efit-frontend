/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

  // --------------------------------------------------
  // Status
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var Status = function($scope, $attrs, $element, $injector) {
    this.$scope = $scope;
    this.$attrs = $attrs;
    this.$element = $element;
    this.$injector = $injector;

    this.iconRatio = 1;
    this.isCompact = false;
    this.iconColor = 'currentcolor';
  };

  Status.$inject = ['$scope', '$element', '$attrs', '$injector'];

  //
  // PROPERTIES
  //

  /** @var {object} tasks User's task hash map. */
  Status.prototype.tasks = {};

  /** @var {array} tickets User's ticket collection. */
  Status.prototype.tickets = [];

  /** @var {boolean} tasksVisible If task overview is visible. */
  Status.prototype.tasksVisible = false;

  /** @var {boolean} ticketsVisible If tickets overview is visible. */
  Status.prototype.ticketsVisible = false;

  //
  // METHODS
  //

  /**
   * Watches user's `tasks` and `tickets` properties and maps them for view.
   *
   * @public
   * @method $onInit
   * @return {Void}
   */
  Status.prototype.$onInit = function()
    {
      var user = this.$injector.get('user');

      var me = this;

      var _watchTicketsExpression = function(){
        return user.tickets;
      };

      var _watchTicketsCallback = function(tickets) {
        me.tickets = tickets;
      };

      this._unwatchTickets = this.$scope.$watchCollection(
        _watchTicketsExpression,
        _watchTicketsCallback
      );

      var _watchTasksExpression = function(){
        return user.getTasks();
      };

      var _watchTasksCallback = function(tasks) {
        me.tasks = tasks;
      };

      this._unwatchTasks = this.$scope.$watch(
        _watchTasksExpression,
        _watchTasksCallback
      );
    };

  /**
   * Removes event listener and watches.
   *
   * @public
   * @method $onDestroy
   * @return {void}
   */
  Status.prototype.$onDestroy = function() {
    this._unwatchTickets();
    this._unwatchTasks();
  };

  /**
   * Toggles `tasksVisible` property.
   *
   * @public
   * @method toggleTasks
   * @return {Void}
   */
  Status.prototype.toggleTasks = function()
    {
      this.tasksVisible = !this.tasksVisible;
    };

  /**
   * Toggles `ticketsVisible` property.
   *
   * @public
   * @method toggleTickets
   * @return {Void}
   */
  Status.prototype.toggleTickets = function()
    {
      this.ticketsVisible = !this.ticketsVisible;
    };

  //
  // REGISTRY
  //
  angular.module(module).directive('status', function(){
    return {
      scope: {
        iconRatio:'=?statusIconRatio',
        iconColor:'=?statusIconColor',
        isCompact:'=?statusIsCompact'
      },
      restrict: 'A',
      transclude: true,
      controller: Status,
      bindToController: true,
      controllerAs: 'statusController',
      templateUrl: 'views/directives/status.html'
    };
  });

  // --------------------------------------------------
  // Status Icons
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var StatusIcons = function($scope, $attrs, $element, $injector) {
    this.$scope = $scope;
    this.$attrs = $attrs;
    this.$element = $element;
    this.$injector = $injector;

    this.ratio = 1;
    this.color = 'currentcolor';
  };

  StatusIcons.$inject = ['$scope', '$attrs', '$element', '$injector'];

  //
  // PROPERTIES
  //

  /** @var {boolean} isBeginner If user has state `STATE_BEGINNER` or higher. */
  StatusIcons.prototype.isBeginner = false;

  /** @var {boolean} isAmateuer If user has state `STATE_AMATEUR` or higher. */
  StatusIcons.prototype.isAmateuer = false;

  /** @var {boolean} isAdvanced If user has state `STATE_ADVANCED` or higher. */
  StatusIcons.prototype.isAdvanced = false;

  /** @var {boolean} isExpert If user has state `STATE_EXPERT` or higher. */
  StatusIcons.prototype.isExpert = false;

  /** @var {boolean} isProfi If user has state `STATE_PROFI` or higher. */
  StatusIcons.prototype.isProfi = false;

  //
  // METHODS
  //

  /**
   * Watches user's `state` property and maps them for view.
   *
   * @public
   * @method $onInit
   * @return {Void}
   */
  StatusIcons.prototype.$onInit = function()
    {
      var STATE_BEGINNER = this.$injector.get('STATE_BEGINNER');
      var STATE_AMATEUR = this.$injector.get('STATE_AMATEUR');
      var STATE_ADVANCED = this.$injector.get('STATE_ADVANCED');
      var STATE_EXPERT = this.$injector.get('STATE_EXPERT');
      var user = this.$injector.get('user');

      var me = this;

      var _watchExpression = function(){
        return user.state;
      };

      var _watchCallback = function(state) {
        me.isBeginner = state >= STATE_BEGINNER;
        me.isAmateur = state >= STATE_AMATEUR;
        me.isAdvanced = state >= STATE_ADVANCED;
        me.isExpert = state >= STATE_EXPERT;
      };

      this._unwatch = this.$scope.$watch(
        _watchExpression,
        _watchCallback
      );
    };

  /**
   * Removes event listener and watches.
   *
   * @public
   * @method $onDestroy
   * @return {void}
   */
  StatusIcons.prototype.$onDestroy = function() {
    this._unwatch();
  };

  //
  // REGISTRY
  //
  angular.module(module).directive('statusIcons', function() {
    return {
      scope: {
        ratio:'=?statusIconsRatio',
        color:'=?statusIconsColor',
      },
      restrict: 'A',
      transclude: true,
      controller: StatusIcons,
      bindToController: true,
      controllerAs: 'statusIconsController',
      templateUrl: 'views/directives/status-icons.html'
    };
  });

  // --------------------------------------------------
  // Status Label
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var StatusLabel = function($scope, $attrs, $element, $injector) {
    this.$scope = $scope;
    this.$attrs = $attrs;
    this.$element = $element;
    this.$injector = $injector;
  };

  StatusLabel.$inject = ['$scope', '$attrs', '$element', '$injector'];

  //
  // PROPERTIES
  //

  /** @var {string} state String represenation of user's `state`. */
  StatusLabel.prototype.state = null;

  /** @var {boolean} isCompact If presentation is in compact format. */
  StatusLabel.prototype.isCompact = false;

  //
  // METHODS
  //

  /**
   * Watches user's `state` property and maps them for view.
   *
   * @public
   * @method $onInit
   * @return {Void}
   */
  StatusLabel.prototype.$onInit = function()
    {
      var user = this.$injector.get('user');

      var me = this;

      var _watchExpression = function() {
        return user.state;
      };

      var _watchCallback = function() {
        me.state = user.getStateAsString();
      };

      this._unwatch = this.$scope.$watch(
        _watchExpression,
        _watchCallback
      );
    };

  /**
   * Removes event listener and watches.
   *
   * @public
   * @method $onDestroy
   * @return {void}
   */
  StatusLabel.prototype.$onDestroy = function() {
    this._unwatch();
  };

  //
  // REGISTRY
  //
  angular.module(module).directive('statusLabel', function(){
    return {
      scope: {
        isCompact: '=?statusLabelIsCompact'
      },
      restrict: 'A',
      transclude: true,
      controller: StatusLabel,
      bindToController: true,
      controllerAs: 'statusLabelController',
      templateUrl: 'views/directives/status-label.html'
    };
  });

  // --------------------------------------------------
  // Status Label
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var StatusTickets = function($scope, $attrs, $element, $injector) {
    this.$scope = $scope;
    this.$attrs = $attrs;
    this.$element = $element;
    this.$injector = $injector;
  };

  StatusTickets.$inject = ['$scope', '$attrs', '$element', '$injector'];

  //
  // PROPERTIES
  //

  /** @var {number} tickets Current user ticket count. */
  StatusTickets.prototype.tickets = 0;

  /** @var {boolean} isCompact If presentation is in compact format. */
  StatusTickets.prototype.isCompact = false;

  //
  // METHODS
  //

  /**
   * Watches user's `state` property and maps them for view.
   *
   * @public
   * @method $onInit
   * @return {Void}
   */
  StatusTickets.prototype.$onInit = function()
    {
      var user = this.$injector.get('user');

      var me = this;

      var _watchExpression = function() {
        return user.tickets;
      };

      var _watchCallback = function(tickets) {
        me.tickets = tickets ? tickets.length : 0;
      };

      this._unwatch = this.$scope.$watchCollection(
        _watchExpression,
        _watchCallback
      );
    };

  /**
   * Removes event listener and watches.
   *
   * @public
   * @method $onDestroy
   * @return {void}
   */
  StatusTickets.prototype.$onDestroy = function() {
    this._unwatch();
  };

  //
  // REGISTRY
  //
  angular.module(module).directive('statusTickets', function(){
    return {
      scope: {
        isCompact: '=?statusTicketsIsCompact'
      },
      restrict: 'A',
      transclude: true,
      controller: StatusTickets,
      bindToController: true,
      controllerAs: 'statusTicketsController',
      templateUrl: 'views/directives/status-tickets.html'
    };
  });

})(ANGULAR_MODULE, angular);
