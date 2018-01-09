/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

 /**
  * @constructor
  */
  var Workshop = function($scope, $injector, workshops) {
    this.workshops = workshops;
    this.$injector = $injector;
    this.$scope = $scope;

    this._resultsSource = null;
    this._userSources = {};
    this._workshops = {};
    this._tasks = {};

    this._initWorkshops();
    this._initListener();
  };

  Workshop.$inject = ['$scope', '$injector', 'workshops'];

  //
  // PROPERTIES
  //

  /** @var {string} name Name of new workshop. */
  Workshop.prototype.name = null;

  /** @var {string} code Code of new workshop. */
  Workshop.prototype.code = null;

  /** @var {RegExp} nameMinLength Minimum length of workshop name. */
  Workshop.prototype.nameMinLength = 8;

  /** @var {RegExp} codeMinLength Minimum length of workshop code. */
  Workshop.prototype.codeMinLength = 8;

  /** @var {RegExp} userpattern Regular expression for `username` property. */
  Workshop.prototype.codePattern = /^[A-Za-z0-9]+$/;

  /** @var {object} deleteWorkshop Currently marked workshop for deletion. */
  Workshop.prototype.deleteWorkshop = null;

  /** @var {object} drawingWorkshop Currently marked workshop for drawing. */
  Workshop.prototype.drawingWorkshop = null;

  /** @var {array} drawingTickets Randomly picked tickets of drawing. */
  Workshop.prototype.drawingTickets = null;

  /** @var {array} drawingTicketsAll Total amount of drawing tickets. */
  Workshop.prototype.drawingTicketsAll = null;

  /** @var {array} drawingTicketsOne Randomized tickets for first run. */
  Workshop.prototype.drawingTicketsOne = null;

  /** @var {array} drawingTicketsTwo Randomized tickets for second run. */
  Workshop.prototype.drawingTicketsTwo = null;

  /** @var {array} drawingAmount Amount of chosen tickets for drawing. */
  Workshop.prototype.drawingAmount = 2;

  /** @var {array} chartResults Currently loaded results for chart. */
  Workshop.prototype.chartResults = null;

  /** @var {object} chartTask Currently selected task of results. */
  Workshop.prototype.chartTask = null;

  //
  // METHODS
  //

  /**
   * Toggles `$$expanded` flag on workshop depending on query params.
   * https://ui-router.github.io/ng1/docs/latest/interfaces/ng1.ng1controller.html#uionparamschanged
   *
   * @public
   * @method uiOnParamsChanged
   * @param {object} params
   * @return {void}
   */
  Workshop.prototype.uiOnParamsChanged = function(params)
    {
      var workshop = this._workshops[params.expand];


      // close opened workshop before toggling
      if (this._expanded) {
        this._expanded.$$expanded = false;
        this._expanded = null;
      }

      // expand the new workshop now
      if (workshop) {
        workshop.$$expanded = true;
        this._expanded = workshop;
      }
    };

  /**
   * Creates a new workshop.
   *
   * @public
   * @method create
   * @return {void}
   */
  Workshop.prototype.create = function()
    {
      var notification = this.$injector.get('notification');
      var Workshop = this.$injector.get('Workshop');
      var i18n = this.$injector.get('i18n');

      var workshop = new Workshop({
        name: this.name,
        code: this.code
      });

      var me = this;

      var successCallback = function(workshop)
        {
          var message = i18n.get('Workshop has been created successfully!');
          notification.success(message);

          me.workshops.unshift(workshop);
          me._initWorkshop(workshop);

          me.name = null;
          me.code = null;
        };

      var failureCallback = function()
        {
          // noop
        };

      workshop.$create().then(
        successCallback,
        failureCallback
      );
    };

  /**
   * Deletes a workshop after confirmation.
   *
   * @public
   * @method delete
   * @param {object} workshop
   * @return {void}
   */
  Workshop.prototype.delete = function(workshop)
    {
      var notification = this.$injector.get('notification');
      var i18n = this.$injector.get('i18n');

      var me = this;

      var successCallback = function()
        {
          var message = i18n.get('Workshop has been deleted successfully!');
          notification.success(message);

          var index = me.workshops.indexOf(workshop);
          me.workshops.splice(index, 1);

          me._removeUsersStream(workshop);
        };

      var failureCallback = function()
        {
          // noop
        };

      workshop.$delete().then(
        successCallback,
        failureCallback
      );
    };

  /**
   * Loads and randomizes workshop tickets and invokes modal dialog.
   *
   * @public
   * @method markWorkshopForDrawing
   * @param {object} workshop
   * @return {void}
   */
  Workshop.prototype.markWorkshopForDrawing = function(workshop)
    {
      var Ticket = this.$injector.get('Ticket');
      var random = this.$injector.get('random');

      var me = this;

      var successCallback = function(tickets)
        {
          me.drawingTicketsAll = tickets;

          me.drawingTickets = random.shuffle(me.drawingTicketsAll);
          me.drawingTickets = me.drawingTickets.slice(
            Math.max(tickets.length - 20, 0)
          );

          var ticketHash = {};
          var rightSide = me.drawingTickets.map(
            function(ticket) {
              ticketHash[ticket.id] = ticket.username;

              return ticket.id;
            }
          );
          var halfSize = Math.ceil(me.drawingTickets.length/2);
          var leftSide = rightSide.splice(0, halfSize);

          me.drawingTicketsOne = leftSide.concat(rightSide);
          me.drawingTicketsTwo = rightSide.concat(leftSide);

          var indexOne = me.drawingTicketsOne.length - 1;
          var indexTwo = me.drawingTicketsTwo.length - 1;

          var ticketOne = me.drawingTicketsOne[indexOne];
          var ticketTwo = me.drawingTicketsTwo[indexTwo];

          me.drawingUserOne = ticketHash[ticketOne];
          me.drawingUserTwo = ticketHash[ticketTwo];

          if (me.drawingUserOne !== me.drawingUserTwo) {
            me.drawingWorkshop = workshop;
            return;
          }

          // >>> TAIL RECURSION
          successCallback(tickets);
        };

      var failureCallback = function()
        {
        };

      var resource = Ticket.getByWorkshop({ workshopId: workshop.id });
      resource.$promise.then(
        successCallback,
        failureCallback
      );
    };

  /**
   * Sets `$$shuffleOne` and `$$shuffleTwo` flag for drawing workshop to kick off drawing directive.
   *
   * @public
   * @method makeWorkshopDrawing
   * @return {void}
   */
  Workshop.prototype.makeWorkshopDrawing = function() {
    this.drawingWorkshop.$$shuffleOne = true;
    this.drawingWorkshop.$$shuffleTwo = true;
  };

  /**
   * Unsets drawing workshop flags to ensure clean state in next drawing (if any).
   *
   * @public
   * @method resetWorkshopDrawing
   * @return {void}
   */
  Workshop.prototype.resetWorkshopDrawing = function() {
    this.drawingWorkshop.$$shuffleOne = null;
    this.drawingWorkshop.$$shuffleTwo = null;
    this.drawingWorkshop.$$finishedOne = null;
    this.drawingWorkshop.$$finishedTwo = null;
  };

  /**
   * Invokes confirmation modal for deleting a workshop.
   *
   * @public
   * @method markWorkshopForDeletion
   * @param {object} workshop
   * @return {void}
   */
  Workshop.prototype.markWorkshopForDeletion = function(workshop)
    {
      this.deleteWorkshop = workshop;
    };

  /**
   * Toggles `isActive` of a workshop.
   *
   * @public
   * @method toggleWorkshop
   * @param {object} workshop
   * @return {void}
   */
  Workshop.prototype.toggleWorkshop = function(workshop)
    {
      var notification = this.$injector.get('notification');
      var i18n = this.$injector.get('i18n');

      var me = this;

      var successCallback = function(workshop)
        {
          var message = i18n.get(
            workshop.isActive ?
              'Workshop has been unlocked successfully. Students can register now!' :
              'Workshop has been locked successfully. Students can now only use their access from home!'
          );
          notification.success(message);

          me._initWorkshop(workshop);
        };

      var failureCallback = function()
        {
          // revert the change on failed update!
          workshop.isActive = !workshop.isActive;
        };

      workshop.isActive = !workshop.isActive;

      workshop.$update().then(
        successCallback,
        failureCallback
      );
    };

  /**
   * Toggles `$$showCode` of a workshop.
   *
   * @public
   * @method toggleCode
   * @param {object} workshop
   * @return {void}
   */
  Workshop.prototype.toggleCode = function(workshop)
    {
      workshop.$$code = !workshop.$$code;
    };

  /**
   * Loads task's results and invokes modal dialog.
   *
   * @public
   * @method markTaskForChart
   * @param {object} task
   * @return {void}
   */
  Workshop.prototype.markTaskForChart = function(task)
    {
      var Result = this.$injector.get('Result');

      var me = this;
      var successCallback = function(results)
        {
          me.chartResults = results;
          me.chartTask = task;
        };

      var failureCallback = function()
        {
        };

      var resource = Result.getByTask({ taskId: task.id });
      resource.$promise.then(
        successCallback,
        failureCallback
      );
    };

  /**
   * Toggles `isActive` of a task.
   *
   * @public
   * @method toggleTask
   * @param {object} task
   * @return {void}
   */
  Workshop.prototype.toggleTask = function(task)
    {
      var notification = this.$injector.get('notification');
      var i18n = this.$injector.get('i18n');
      var Task = this.$injector.get('Task');

      var successCallback = function(/*workshop*/)
        {
          var message = i18n.get(
            task.isActive ?
              'Task has been unlocked successfully. Students can send results now!' :
              'Task has been locked successfully. Students cannot send results currently!'
          );
          notification.success(message);
        };

      var failureCallback = function()
        {
          // revert the change on failed update!
          task.isActive = !task.isActive;
        };

      task.isActive = !task.isActive;

      var resource = Task.update({ id: task.id}, task);
      resource.$promise.then(
        successCallback,
        failureCallback
      );
    };

  /**
   * Sets `expand` query parameter dependending on
   * workshop's current `$$expanded` flag info.
   *
   * @public
   * @method expand
   * @param {object} workshop
   * @return {void}
   */
  Workshop.prototype.expand = function(workshop)
    {
      var $state = this.$injector.get('$state');
      var expand = !workshop.$$expanded ?
        workshop.id : 
        null;

      $state.go('backend.workshops', {
        expand: expand
      });
    };

  /**
   * Sets up an event source for streaming user count.
   *
   * @private
   * @method _addUsersStream
   * @param {object} workshop
   * @return {void}
   */
  Workshop.prototype._addUsersStream = function(workshop)
    {
      var API_URL = this.$injector.get('API_URL');
      var sse = this.$injector.get('sse');

      var me = this;

      var _onMessage = function(data) {
        me.$scope.$evalAsync(function(){
          workshop.$$users = data;
        });
      };

      var url = API_URL + '/sse/workshop/' + workshop.id + '/users';
      var options = { onMessage: _onMessage, sleep: 10 };
      var source = sse.addSource(url, options);
      this._userSources[workshop.id] = source;
    };

  /**
   * Removes an event source from internal stack and service.
   *
   * @private
   * @method _removeUsersStream
   * @param {object} workshop
   * @return {void}
   */
  Workshop.prototype._removeUsersStream = function(workshop)
    {
      var sse = this.$injector.get('sse');

      var source = this._userSources[workshop.id];
      if (!source) {
        return;
      }

      delete this._userSources[workshop.id];
      sse.removeSource(source);
    };

  /**
   * Sets up event sources for updating result counters.
   *
   * @private
   * @method _streamResults
   * @return {void}
   */
  Workshop.prototype._streamResults = function()
    {
      var API_URL = this.$injector.get('API_URL');
      var sse = this.$injector.get('sse');

      var me = this;

      // --- SSE ---
      var _onMessage = function(workshop, data) {
        me.$scope.$evalAsync(function(){
          // remove event source if workshop is not
          // active at the moment === one-shot only
          if (!workshop.isActive) {
            sse.removeSource(me._resultsSource);
          }

          angular.forEach(data, function(item){
            var task = me._tasks[item.id];
            task.$$results = item.results;
          });
        });
      };

      var _watchExpression = function() {
        // workshop must be opened, but we also need
        // to watch `isActive` state to catch toggle
        // from property to reinitialize event source
        return me._expanded && me._expanded.isActive;
      };

      var _watchCallback = function() {
        if (me._resultsSource) {
          sse.removeSource(me._resultsSource);
        }

        if (me._expanded) {
          var url = API_URL + '/sse/workshop/' + me._expanded.id + '/results';
          var onMessage = _onMessage.bind(me, me._expanded);
          var options = { onMessage: onMessage, sleep: 5 };
          me._resultsSource = sse.addSource(url, options);
        }
      };

      this._unwatch = this.$scope.$watch(
        _watchExpression,
        _watchCallback
      );
    };

  /**
   * Maps all workshops to hash maps, sets up streaming and query params.
   *
   * @private
   * @method _initWorkshops
   * @return {void}
   */
  Workshop.prototype._initWorkshops = function()
    {
      var $uiRouterGlobals = this.$injector.get('$uiRouterGlobals');

      // create hash maps for workshops and tasks for ease lookups
      angular.forEach(this.workshops, this._initWorkshop.bind(this));

      // now make the initial call to change handler
      this.uiOnParamsChanged($uiRouterGlobals.params);

      // kick off general streaming of task results
      this._streamResults();
    };

  /**
   * Adds workshop and tasks to hash map and initializes
   * streaming for workshop depending on `isActive` flag.
   *
   * @private
   * @method _initWorkshop
   * @param {object} workshop
   * @return {void}
   */
  Workshop.prototype._initWorkshop = function(workshop)
    {
      // map all `tasks` to internal hash and set `$$results`
      var me = this;
      angular.forEach(workshop.tasks, function(task){
        var old = me._tasks[task.id] || null;
        task.$$results = old !== null ?
          old.$$results
          : 0;

        me._tasks[task.id] = task;
      });

      // initialize `$$code` flag for this workshop
      workshop.$$code = false;

      // check `$$expanded` flag for this workshop
      var id = this._expanded && this._expanded.id;
      workshop.$$expanded = workshop.id === id;

      // initialize `$$users` and set up streaming
      workshop.$$users = workshop.users.length;

      if (!workshop.isActive) {
        this._removeUsersStream(workshop);
      } else {
        this._addUsersStream(workshop);
      }

      this._workshops[workshop.id] = workshop;
    };

  /**
   * Removes all watches, listeners and sources
   * as soon as controller's $scope is destroyed.
   *
   * @private
   * @method _initListener
   * @return {void}
   */
  Workshop.prototype._initListener = function()
    {
      var sse = this.$injector.get('sse');

      var me = this;

      var _onDestroy = function() {
        for (var id in me._userSources) {
          sse.removeSource(me._userSources[id]);
        }

        if (me._resultsSource) {
          sse.removeSource(me._resultsSource);
        }

        me._resultsSource = null;
        me._userSources = {};

        me._unlisten();
        me._unwatch();
      };

      this._unlisten = this.$scope.$on('$destroy', _onDestroy);
    };


  angular.module(module).controller('WorkshopController', Workshop);

})(ANGULAR_MODULE, angular);
