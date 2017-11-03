/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

 /**
  * @constructor
  */
  var LoginBackend = function($scope, $injector) {
    this.$injector = $injector;
    this.$scope = $scope;
  };

  LoginBackend.$inject = ['$scope', '$injector'];

  //
  // PROPERTIES
  //

  /** @var {string} username Username for authentication. */
  LoginBackend.prototype.username = null;

  /** @var {string} workshop Password for authentication. */
  LoginBackend.prototype.password = null;

  /** @var {RegExp} usernameMinLength Minimum length of username. */
  LoginBackend.prototype.usernameMinLength = 5;

  /** @var {RegExp} passwordMinLength Minimum length of password. */
  LoginBackend.prototype.passwordMinLength = 8;

  /** @var {RegExp} passwordMaxLength Maximum length of password. */
  LoginBackend.prototype.passwordMaxLength = 4096;

  //
  // METHODS
  //

  /**
   * Signs an admin in with username and password.
   *
   * @public
   * @method signin
   * @return {Void}
   */
  LoginBackend.prototype.signin = function()
    {
      var notification = this.$injector.get('notification');
      var $timeout = this.$injector.get('$timeout');
      var $state = this.$injector.get('$state');
      var auth = this.$injector.get('auth');
      var i18n = this.$injector.get('i18n');

      var form = this.$scope.loginForm;
      if (form.$invalid) {
        return;
      }

      var successCallback = function()
      {
        var message = i18n.get('You are logged in now!');
        notification.success(message);

        // force invokation of redirect
        // as it sometimes won't change
        $timeout(function(){
          $state.go('backend');
        });
      };

      var failureCallback = function()
      {
        // @see: httpInterceptor
      };

      auth.signin({
        username: this.username,
        password: this.password
      }, 'backend').then(
        successCallback,
        failureCallback
      );
    };

  angular.module(module).controller('LoginBackendController', LoginBackend);

})(ANGULAR_MODULE, angular);
