/* global ANGULAR_MODULE, angular, UIkit */
(function(module, angular) {
  'use strict';

  //
  // SERVICE
  //

  /**
   * @constructor
   */
  var Notification = function() {
  };

  Notification.$inject = [];

  //
  // METHODS
  //

  /**
   * Shows user notification in a toast message.
   *
   * @public
   * @method notify
   * @param {string} message
   * @param {string} status One of `danger`, `warning`, `success` or `primary`.
   * @param {object} options Additional options like `timeout` and `pos`.
   * @return {object} Notification object
   */
  Notification.prototype.notify = function(message, status, options) {
    status = status || 'default';
    options = options || {};

    options.message = message;
    options.status = status;

    return UIkit.notification(options);
  };

  /**
   * Shows user success notification.
   *
   * @public
   * @method success
   * @param {string} message
   * @return {void}
   */
  Notification.prototype.success = function(message, options) {
    this.notify(message, 'success', options);
  };

  /**
   * Shows user primary notification.
   *
   * @public
   * @method success
   * @param {string} message
   * @return {void}
   */
  Notification.prototype.primary = function(message, options) {
    this.notify(message, 'primary', options);
  };

  /**
   * Shows user error notification.
   *
   * @public
   * @method error
   * @param {string} message
   * @return {void}
   */
  Notification.prototype.error = function(message, options) {
    this.notify(message, 'danger', options);
  };

  /**
   * Shows user warning notification.
   *
   * @public
   * @method warning
   * @param {string} message
   * @return {void}
   */
  Notification.prototype.warning = function(message, options) {
    this.notify(message, 'warning', options);
  };

  /**
   * Closes all open notifications.
   *
   * @public
   * @method closeAll
   * @return {void}
   */
  Notification.prototype.closeAll = function() {
    UIkit.notification.closeAll();
  };

  //
  // REGISTRY
  //
  angular.module(module).service('notification', Notification);

})(ANGULAR_MODULE, angular);
