/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

  //
  // SERVICE
  //

  /**
   * @constructor
   */
  var Mail = function($injector)
    {
      this.$injector = $injector;
    };

  Mail.$inject = ['$injector'];

  //
  // METHODS
  //

  /**
   * Sends a POST request to send mail.
   *
   * @public
   * @method send
   * @param {Object} data
   * @param {Object} [config] $http config.
   * @return {Promise}
   */
  Mail.prototype.send = function(data, config) {
    var notification = this.$injector.get('notification');
    var $http = this.$injector.get('$http');
    var i18n = this.$injector.get('i18n');

    var successCallback = function(/*response*/)
      {
        notification.success(
          i18n.get(
            'Your email has been sent!'
          )
        );
      };

    var failureCallback = function(/*rejection*/)
      {
      };

    var promise = $http.post(
      this._getPostUrl(),
      {
        _name: data.name,
        _mail: data.email,
        _subject: data.subject,
        _message: data.message
      },
      config || {}
    );

    promise.then(
      successCallback,
      failureCallback
    );

    return promise;
  };

  /**
   * Returns endpoint to send the email.
   *
   * @private
   * @method _getPostUrl
   * @return {string}
   */
  Mail.prototype._getPostUrl = function(){
    var API_URL = this.$injector.get('API_URL');

    return API_URL + '/mail';
  };

  //
  // REGISTRY
  //
  angular.module(module).service('mail', Mail);

})(ANGULAR_MODULE, angular);
