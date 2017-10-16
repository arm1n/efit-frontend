/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

 /**
  * @constructor
  */
  var Frontend = function($injector) {
    this.$injector = $injector;

    this.user = $injector.get('user');
  };

  Frontend.$inject = ['$injector'];

  //
  // PROPERTIES
  //

  /** @var {object} user User service object. */
  Frontend.prototype.user = null;

  /** @var {boolean} confirmLogout Flag for logout confirmation. */
  Frontend.prototype.confirmLogout = false;

  //
  // METHODS
  //

  /**
   * Creates a new result resource from task payload.
   *
   * @public
   * @method createResult
   * @param {object} payload
   * @return {Void}
   */
  Frontend.prototype.createResult = function(payload)
  {
    var Result = this.$injector.get('Result');
    var user = this.$injector.get('user');

    var successCallback = function(result)
      {
        // update user object from response
        // handling comparisons for `state`,
        // `tickets` and showing messages
        user.update(result);
      };

    var failureCallback = function()
      {
        // noop
      };

    var result = new Result(payload);
    var promise = result.$create();
    promise.then(
      successCallback,
      failureCallback
    );

    return promise;
  };

  /**
   * Updates a new result resource from task `result`.
   *
   * @public
   * @method updateResult
   * @param {object} result
   * @return {Void}
   */
  Frontend.prototype.updateResult = function(payload)
  {
    var Result = this.$injector.get('Result');
    var user = this.$injector.get('user');

    var successCallback = function(result)
      {
        // update user object from response
        // handling comparisons for `state`,
        // `tickets` and showing messages
        user.update(result);
      };

    var failureCallback = function()
      {
        // noop
      };

    var promise = Result.update({ id: payload.id }, payload).$promise;
    promise.then(
      successCallback,
      failureCallback
    );

    return promise;
  };

  /**
   * Destroys user session and redirects to login.
   *
   * @public
   * @method logout
   * @return {Void}
   */
  Frontend.prototype.logout = function()
    {
      var $state = this.$injector.get('$state');
      var auth = this.$injector.get('auth');
      var isUser = this.user.isUser();

      var successCallback = function()
        {
          if (isUser) {
            $state.go('login.frontend');
          } else {
            $state.go('login.backend');
          }
        };

      var failureCallback = function()
        {

        };

      auth.signout().then(
        successCallback,
        failureCallback
      );
    };

  /**
   * Redirects router to state.
   *
   * @public
   * @method goTo
   * @param {string} state
   * @return {Void}
   */
  Frontend.prototype.goTo = function(state)
    {
      var $state = this.$injector.get('$state');

      $state.go(state);
    };

  /**
   * Sets `confirmLogout` flag to true.
   *
   * @public
   * @method markConfirmLogout
   * @return {Void}
   */
  Frontend.prototype.markConfirmLogout = function()
    {
      this.confirmLogout = true;
    };

  angular.module(module).controller('FrontendController', Frontend);

})(ANGULAR_MODULE, angular);
