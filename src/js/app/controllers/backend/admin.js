/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

 /**
  * @constructor
  */
  var Admin = function($scope, $injector, admins) {
    this.admins = admins;
    this.$injector = $injector;
    this.$scope = $scope;
  };

  Admin.$inject = ['$scope', '$injector', 'admins'];

  //
  // PROPERTIES
  //

  /** @var {string} name Name of new workshop. */
  Admin.prototype.username = null;

  /** @var {string} code Code of new workshop. */
  Admin.prototype.password = null;

  /** @var {RegExp} usernameMinLength Minimum length of workshop name. */
  Admin.prototype.usernameMinLength = 5;

  /** @var {RegExp} passwordMinLength Minimum length of workshop code. */
  Admin.prototype.passwordMinLength = 8;

  /** @var {object} editAdmin Currently marked workshop for editing. */
  Admin.prototype.editAdmin = null;

  /** @var {object} deleteAdmin Currently marked workshop for deletion. */
  Admin.prototype.deleteAdmin = null;

  //
  // METHODS
  //

  /**
   * Creates a new admin.
   *
   * @public
   * @method create
   * @return {void}
   */
  Admin.prototype.create = function()
    {
      var notification = this.$injector.get('notification');
      var Admin = this.$injector.get('Admin');
      var i18n = this.$injector.get('i18n');

      var admin = new Admin({
        username: this.username,
        password: this.password
      });

      var me = this;

      var successCallback = function(admin)
        {
          var message = i18n.get('Admin has been created successfully!');
          notification.success(message);

          me.admins.unshift(admin);

          me.username = null;
          me.password = null;
        };

      var failureCallback = function()
        {
          // noop
        };

      admin.$create().then(
        successCallback,
        failureCallback
      );
    };

  /**
   * Invokes confirmation modal for deleting a admin.
   *
   * @public
   * @method markAdminForDeletion
   * @param {object} admin
   * @return {void}
   */
  Admin.prototype.markAdminForDeletion = function(admin)
    {
      this.deleteAdmin = admin;
    };

  /**
   * Deletes a admin after confirmation.
   *
   * @public
   * @method delete
   * @param {object} admin
   * @return {void}
   */
  Admin.prototype.delete = function(admin)
    {
      var notification = this.$injector.get('notification');
      var i18n = this.$injector.get('i18n');

      var me = this;

      var successCallback = function()
        {
          var message = i18n.get('Admin has been deleted successfully!');
          notification.success(message);

          var index = me.admins.indexOf(admin);
          me.admins.splice(index, 1);
        };

      var failureCallback = function()
        {
          // noop
        };

      admin.$delete().then(
        successCallback,
        failureCallback
      );
    };

  /**
   * Invokes confirmation modal for editing a admin.
   *
   * @public
   * @method markAdminForEdit
   * @param {object} admin
   * @return {void}
   */
  Admin.prototype.markAdminForEdit = function(admin)
    {
      this.editAdmin = admin;
    };

  /**
   * Updates a admin after confirmation.
   *
   * @public
   * @method update
   * @param {object} admin
   * @return {void}
   */
  Admin.prototype.update = function(admin)
    {
      var notification = this.$injector.get('notification');
      var i18n = this.$injector.get('i18n');

      var successCallback = function()
        {
          var message = i18n.get('Password has been successfully updated!');
          notification.success(message);
        };

      var failureCallback = function()
        {
          // noop
        };

      admin.$update().then(
        successCallback,
        failureCallback
      );
    };

  angular.module(module).controller('AdminController', Admin);

})(ANGULAR_MODULE, angular);
