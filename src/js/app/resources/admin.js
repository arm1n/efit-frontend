/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

  //
  // FACTORY
  //

  /**
   * @constructor
   */
  var Factory = function($resource, API_URL) {
    var url = API_URL + '/admin/:id';
    var paramDefaults = { id: '@id' };
    var actions = {
      validateAdmin: {
        method: 'GET',
        skipGlobalErrorMessage: true,
        url: API_URL + '/admin/username/:username'
      }
    };
    var options = {

    };

    return $resource(url, paramDefaults, actions, options);
  };

  Factory.$inject = ['$resource', 'API_URL'];

  //
  // REGISTRY
  //
  angular.module(module).factory('Admin', Factory);

})(ANGULAR_MODULE, angular);
