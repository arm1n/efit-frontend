/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

 /**
  * @constructor
  */
  var Status = function($injector) {
    this.$injector = $injector;
  };

  Status.$inject = ['$injector'];

  //
  // PROPERTIES
  //

  /** @var {string} name Name of Status. */
  Status.prototype.name = null;

  /** @var {string} email Email of Status. */
  Status.prototype.email = null;

  /** @var {string} subject Subject of Status. */
  Status.prototype.subject = null;

  /** @var {string} message Message of Status. */
  Status.prototype.message = null;

  /** @var {string} messageMinLength Message minmimum length. */
  Status.prototype.messageMinLength = 25;

  //
  // METHODS
  //

  /**
   * Fetches results of current user.
   *
   * @public
   * @method submit
   * @return {Void}
   */
  Status.prototype.getTasks = function()
    {
      /*
      var mail = this.$injector.get('mail');
      var form = this.$scope.StatusForm;
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
      */
    };

  /**
   * Resets all form inputs to initial state.
   *
   * @public
   * @method reset
   * @return {Void}
   */
  Status.prototype.getTickets = function()
    {
    };

  angular.module(module).controller('StatusController', Status);

})(ANGULAR_MODULE, angular);
