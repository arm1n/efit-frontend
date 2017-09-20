/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

  // --------------------------------------------------
  // DiversificationTask
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var DiversificationTask = function($scope, $elemnt, $attrs, $injector) {
    var type = $injector.get('TYPE_DIVERSIFICATION');
    var user = $injector.get('user');

    this.$injector = $injector;
    this.task = user.getTaskByType(type);
  };

  DiversificationTask.$inject = ['$scope','$element','$attrs', '$injector'];

  // SERVER

  /** @var {object} task Task's resource from server. */
  DiversificationTask.prototype.task = null;

  // GAMEPLAY

  /** @var {boolean} resolved If player has resolved the game. */
  DiversificationTask.prototype.resolved = false;

  /** @var {string} heads Current class of heads side. */
  DiversificationTask.prototype.heads = 'K';

  /** @var {string} tails Current class of tails side. */
  DiversificationTask.prototype.tails = 'Z';

  /** @var {array} companies Data for companies. */
  DiversificationTask.prototype.companies = {};

  /** @var {array} tickets Data for tickets. */
  DiversificationTask.prototype.tickets = {};

  /** @var {array} sides Two values for coin. */
  DiversificationTask.prototype.sides = [];

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
  DiversificationTask.prototype.$onInit = function() {
    this.init();
  };

  /**
   * Retrieves result payload for server.
   *
   * @public
   * @method getPayload
   * @return {void}
   */
  DiversificationTask.prototype.getPayload = function() {
    return {
      task: this.task,
      json: {
        tickets: {
          one: this.tickets.one.company,
          two: this.tickets.two.company
        },
        throws: {
          one: this.throws.one.toss,
          two: this.throws.two.toss
        }
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
  DiversificationTask.prototype.isLocked = function() {
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
  DiversificationTask.prototype.canResolve = function() {
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

    if (!this.tickets.one.company) {
      return false;
    }

    if (!this.tickets.two.company) {
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
  DiversificationTask.prototype.init = function() {
    var random = this.$injector.get('random');

    this.sides = [
      this.heads,
      this.tails
    ];

    this.throws = {
      one: {
        id: 1,
        toss: random.pick(this.sides)
      },
      two: {
        id: 2,
        toss: random.pick(this.sides)
      }
    };

    this.tickets = {
      one: {
        id: 1,
        company: null
      },
      two: {
        id: 2,
        company: null
      }
    };

    this.companies = {
      one: {
        id: 1,
        count: 0,
        tickets: {},
        name: 'Smart',
        image: 'company-a.svg'
      },
      two: {
        id: 2,
        count: 0,
        tickets: {},
        name: 'Phone',
        image: 'company-b.svg'
      }
    };

    this.resolved = false;
  };

  /**
   * Resets initial state.
   *
   * @public
   * @method reset
   * @return {void}
   */
  DiversificationTask.prototype.reset = function(){
    this.init();
  };

  /**
   * Adds or removes a ticket from given company.
   *
   * @public
   * @method update
   * @param ticket
   * @param company
   * @param action
   * @return {void}
   */
  DiversificationTask.prototype.update = function(ticket, company, action){
    switch (action) {
      case 'add':
        if (!company.tickets[ticket.id]) {
          company.tickets[ticket.id] = ticket;
          ticket.company = company.name;
          company.count++;
        }
        break;
      case 'remove':
        if (company.tickets[ticket.id]) {
          delete company.tickets[ticket.id];
          ticket.company = null;
          company.count--;
        }
        break;
      default:
    }
  };

  /**
   * Sets `resolved` flag. Calls `onResolve`
   * callback with JSON result for consumer.
   *
   * @public
   * @method resolve
   * @return {void}
   */
  DiversificationTask.prototype.resolve = function(){
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
   * Calculates total ticket amount by predefined formula.
   *
   * @public
   * @method getTotalTickets
   * @return {number}
   */
  DiversificationTask.prototype.getTicketCount = function(){
    var factorA = this.throws.one.toss === this.heads ? 2 : 1;
    var factorB = this.throws.two.toss === this.heads ? 2 : 1;

    var ticketsA = this.companies.one.count * factorA;
    var ticketsB = this.companies.two.count * factorB;

    return ticketsA + ticketsB;
  };

  //
  // REGISTRY
  //
  angular.module(module).directive('diversificationTask', function(){
    return {
      scope: {
        onResolve: '&diversificationTaskOnResolve'
      },
      restrict: 'A',
      transclude: true,
      bindToController: true,
      controller: DiversificationTask,
      controllerAs: 'diversificationTaskController',
      templateUrl: 'views/directives/tasks/diversification-task.html'
    };
  });

  // --------------------------------------------------
  // DiversificationTask Coin
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var DiversificationTaskCoin = function($scope,$element,$attrs,$injector) {
    this.$scope = $scope;
    this.$attrs = $attrs;
    this.$element = $element;
    this.$injector = $injector;

    this._element = this.$element.find('.coin');
  };

  DiversificationTaskCoin.$inject = ['$scope','$element','$attrs','$injector'];

  //
  // PROPERTIES
  //

  /** @var {string} toss One of `heads` or `tails`. */
  DiversificationTaskCoin.prototype.toss = null;

  /** @var {string} heads Current class of heads side. */
  DiversificationTaskCoin.prototype.sides = [];

  /** @var {string} heads Current class of heads side. */
  DiversificationTaskCoin.prototype.heads = 'K';

  /** @var {string} tails Current class of tails side. */
  DiversificationTaskCoin.prototype.tails = 'Z';

  /** @var {boolean} flip Flag to invoke a new toss. */
  DiversificationTaskCoin.prototype.flip = false;

  /** @var {boolean} flip Flag to apply CSS classes. */
  DiversificationTaskCoin.prototype.animate = false;

  /** @var {string} backClass CSS class for back side. */
  DiversificationTaskCoin.prototype.back = 'back';

  /** @var {string} frontClass CSS class for front side. */
  DiversificationTaskCoin.prototype.front = 'front';

  /** @var {string} startSide Initially displayed side of coin. */
  DiversificationTaskCoin.prototype.startSide = 'K';

  /** @var {string} startValue Initially displayed side of coin. */
  DiversificationTaskCoin.prototype.startValue = null;

  //
  // METHODS
  //

  /**
   * Sets up
   *
   * @public
   * @method $onDestroy
   * @return {void}
   */
  DiversificationTaskCoin.prototype.$onInit = function() {
    var animation = this.$injector.get('animation');
    var $timeout = this.$injector.get('$timeout');

    var me = this;

    this.sides = [
      {
        value: this.heads,
        class: this.front,
        text: this.heads,
      },
      {
        value: this.tails,
        class: this.back,
        text: this.tails
      }
    ];

    if (this.startSide !== this.heads) {
      this.sides[0].class = this.back;
      this.sides[1].class = this.front;
    }

    if (this.startValue !== null) {
      this.sides[0].text = this.startValue;
      this.sides[1].text = this.startValue;
    }

    me._toss = me._getToss();

    var _timeoutCallback = function() {
      var _iterateSides = function(side) {
        if (side.value === me._toss.value) {
          side.class = me.front;
          return;
        }

        side.class = me.back;
      };

      angular.forEach(me.sides, _iterateSides);
    };

    var _watchFlipCallback = function(newFlip/*,oldFlip*/) {
      if (newFlip) {
        me.onStart({toss: me._toss.value});
        $timeout(_timeoutCallback, 100);
        me.sides[0].text = me.heads;
        me.sides[1].text = me.tails;
        me.animate = true;
      }
    };

    var _watchFlipExpression = function() {
      return me.flip;
    };

    var _watchTossCallback = function(newToss, oldToss) {
      if (newToss !== oldToss) {
        me._toss = me._getToss();
      }
    };

    var _watchTossExpression = function() {
      return me.toss;
    };

    var _evalAsyncCallback = function() {
      me.onFinish({toss: me._toss.value});
      me.animate = false;
    };

    var _animationEndCallback = function() {
      me.$scope.$evalAsync(_evalAsyncCallback);
    };

    this.onInit({toss: me._toss.value});

    if (animation.animationEndEvent) {
      this._element.on(
        animation.animationEndEvent,
        _animationEndCallback
      );
    }

    this._unwatchFlip = this.$scope.$watch(_watchFlipExpression, _watchFlipCallback);
    this._unwatchToss = this.$scope.$watch(_watchTossExpression, _watchTossCallback);
  };

  /**
   * Removes event listener and watches.
   *
   * @public
   * @method $onDestroy
   * @return {void}
   */
  DiversificationTaskCoin.prototype.$onDestroy = function() {
    var animation = this.$injector.get('animation');

    this._element.off(animation.animationEndEvent);
    this._unwatchToss();
    this._unwatchFlip();
  };

  /**
   * Transforms `toss` to one side either
   * by random or by given consumer input.
   *
   * @private
   * @method _getToss
   * @return {void}
   */
  DiversificationTaskCoin.prototype._getToss = function() {
    var $filter = this.$injector.get('$filter');
    var random = this.$injector.get('random');
    var picked = random.pick(this.sides);

    if (this.toss === null) {
      return picked;
    }

    var filtered = $filter('filter')(
      this.sides,
      {
        value: this.toss
      }
    );

    if (filtered.length === 0) {
      console.warn('Invalid value for `toss` - using random value!');
      return picked;
    }

    return filtered[0];
  };

  //
  // REGISTRY
  //
  angular.module(module).directive('diversificationTaskCoin', function(){
    return {
      scope: {
        toss: '=?diversificationTaskCoinToss',
        flip: '=?diversificationTaskCoinFlip',
        onInit: '&diversificationTaskCoinOnInit',
        onStart: '&diversificationTaskCoinOnStart',
        onFinish: '&diversificationTaskCoinOnFinish',
        startSide: '=?diversificationTaskCoinStartSide',
        startValue: '=?diversificationTaskCoinStartValue'
      },
      restrict: 'A',
      transclude: true,
      bindToController: true,
      controller: DiversificationTaskCoin,
      controllerAs: 'diversificationTaskCoinController',
      templateUrl: 'views/directives/tasks/diversification-task-coin.html'
    };
  });

})(ANGULAR_MODULE, angular);
