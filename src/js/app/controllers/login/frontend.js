/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

 /**
  * @constructor
  */
  var LoginFrontend = function($scope, $injector) {
    this.$injector = $injector;
    this.$scope = $scope;
  };

  LoginFrontend.$inject = ['$scope', '$injector'];

  //
  // PROPERTIES
  //

  /** @var {string} code Workshop code for authentication. */
  LoginFrontend.prototype.code = null;

  /** @var {string} username User name for authentication. */
  LoginFrontend.prototype.username = null;

  /** @var {RegExp} codeMinLength Minimum length of password. */
  LoginFrontend.prototype.codeMinLength = 8;

  /** @var {RegExp} codePattern Regular expression for `username` property. */
  LoginFrontend.prototype.codePattern = /^[A-Za-z0-9]+$/;

  /** @var {RegExp} userpattern Regular expression for `username` property. */
  LoginFrontend.prototype.userpattern = /^[A-Za-z][A-Za-z](?:0[1-9]|[12]\d|3[01])[A-Za-z]\d$/;

  //
  // METHODS
  //

  /**
   * Signs a user in with personal code to gather JWT token.
   *
   * @public
   * @method signin
   * @return {Void}
   */
  LoginFrontend.prototype.signin = function()
    {
      var notification = this.$injector.get('notification');
      var $state = this.$injector.get('$state');
      var auth = this.$injector.get('auth');
      var i18n = this.$injector.get('i18n');

      var form = this.$scope.loginForm;
      if (form.$invalid) {
        return;
      }

      var successCallback = function()
      {
        var message = i18n.get('You have successfully signed in!');
        notification.success(message);
        $state.go('frontend');
      };

      var failureCallback = function()
      {
        // @see: httpInterceptor
      };

      auth.signin({
        username: this.username
      }, 'frontend').then(
        successCallback,
        failureCallback
      );
    };

  /**
   * Signs a user up with personal and workshop code.
   *
   * @public
   * @method signup
   * @return {Void}
   */
  LoginFrontend.prototype.signup = function()
    {
      var notification = this.$injector.get('notification');
      var $state = this.$injector.get('$state');
      var auth = this.$injector.get('auth');
      var i18n = this.$injector.get('i18n');

      var form = this.$scope.loginForm;
      if (form.$invalid) {
        return;
      }

      var successCallback = function()
      {
        var message = i18n.get('You have successfully signed up!');
        notification.success(message);
        $state.go('frontend');
      };

      var failureCallback = function()
      {
        // @see: httpInterceptor
      };

      auth
        .signup({
          username: this.username,
          password: this.code
        }, 'frontend').then(
          successCallback,
          failureCallback
        );
    };

  angular.module(module).controller('LoginFrontendController', LoginFrontend);

})(ANGULAR_MODULE, angular);
