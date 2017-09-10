/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

 /**
  * @constructor
  */
  var LoginFrontend = function($scope, $injector, code) {
    this.$injector = $injector;
    this.$scope = $scope;

    // @see: next()
    this.code = code;
  };

  LoginFrontend.$inject = ['$scope', '$injector', 'code'];

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
  LoginFrontend.prototype.userpattern = /^[A-Za-z][A-Za-z](?:0[1-9]|[12]\d|3[01])(?:0[1-9]|1[012])\d$/;

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

  /**
   * Persists code in storage and navigates to `step2` of signup.
   *
   * @public
   * @method continue
   * @return {Void}
   */
  LoginFrontend.prototype.next = function()
    {
      var CODE_STORAGE_KEY = this.$injector.get('CODE_STORAGE_KEY');
      var storage = this.$injector.get('storage').getProxy();
      var $state = this.$injector.get('$state');

      storage.setItem(CODE_STORAGE_KEY, this.code);
      $state.go('login.frontend.signup.step2', {}, {
        // note: this is important to avoid usual
        // redirection by refetching resolve data
        // of `login.frontend` parent state
        reload: true
      });
    };

  angular.module(module).controller('LoginFrontendController', LoginFrontend);

})(ANGULAR_MODULE, angular);
