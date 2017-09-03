/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

 /**
  * @constructor
  */
  var Contact = function($scope, $injector) {
    this.$injector = $injector;
    this.$scope = $scope;
  };

  Contact.$inject = ['$scope','$injector'];

  //
  // PROPERTIES
  //

  /** @var {string} name Name of contact. */
  Contact.prototype.name = null;

  /** @var {string} email Email of contact. */
  Contact.prototype.email = null;

  /** @var {string} subject Subject of contact. */
  Contact.prototype.subject = null;

  /** @var {string} message Message of contact. */
  Contact.prototype.message = null;

  /** @var {string} messageMinLength Message minmimum length. */
  Contact.prototype.messageMinLength = 25;

  //
  // METHODS
  //

  /**
   * Sends an email from contact form to admins.
   *
   * @public
   * @method submit
   * @return {Void}
   */
  Contact.prototype.submit = function()
    {
      var mail = this.$injector.get('mail');
      var form = this.$scope.contactForm;
      if (form.$invalid) {
        return;
      }

      var me = this;

      var successCallback = function()
      {
        me.reset();
      };

      var failureCallback = function()
      {
        // @see: httpInterceptor
      };

      mail.send({
        name: this.name,
        email: this.email,
        subject: this.subject,
        message: this.message
      }).then(
        successCallback,
        failureCallback
      );
    };

  /**
   * Resets all form inputs to initial state.
   *
   * @public
   * @method reset
   * @return {Void}
   */
  Contact.prototype.reset = function()
    {
      this.name = null;
      this.email = null;
      this.subject = null;
      this.message = null;
    };

  angular.module(module).controller('ContactController', Contact);

})(ANGULAR_MODULE, angular);
