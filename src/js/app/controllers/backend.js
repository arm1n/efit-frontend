/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

 /**
  * @constructor
  */
  var Backend = function($injector, isSuperAdmin) {
    this.$injector = $injector;

    this.isSuperAdmin = isSuperAdmin;
  };

  Backend.$inject = ['$injector', 'isSuperAdmin'];

  //
  // PROPERTIES
  //

  /** @var {boolean} isSuperAdmin If user is super admin. */
  Backend.prototype.isSuperAdmin = false;

  /** @var {boolean} confirmLogout Flag for logout confirmation. */
  Backend.prototype.confirmLogout = false;

  //
  // METHODS
  //

  /**
   * Destroys user session and redirects to login.
   *
   * @public
   * @method logout
   * @return {Void}
   */
  Backend.prototype.logout = function()
    {
      var $timeout = this.$injector.get('$timeout');
      var $state = this.$injector.get('$state');
      var auth = this.$injector.get('auth');

      var successCallback = function()
        {
          // force invokation of redirect
          // as it sometimes won't change
          $timeout(function(){
            $state.go('login.backend');
          });
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
  Backend.prototype.goTo = function(state)
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
  Backend.prototype.markConfirmLogout = function()
    {
      this.confirmLogout = true;
    };

  angular.module(module).controller('BackendController', Backend);

})(ANGULAR_MODULE, angular);
