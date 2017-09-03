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
    var url = API_URL + '/workshop/:id';
    var paramDefaults = { id: '@id' };
    var actions = {
      validateWorkshopBackend: {
        method: 'GET',
        skipGlobalErrorMessage: true,
        url: API_URL + '/workshop/code/:code'
      },
      validateUsernameFrontend: {
        method: 'GET',
        skipGlobalErrorMessage: true,
        url: API_URL + '/auth/validate/username/:username'
      },
      validateWorkshopFrontend: {
        method: 'GET',
        skipGlobalErrorMessage: true,
        url: API_URL + '/auth/validate/workshop/:code'
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
  angular.module(module).factory('Workshop', Factory);

})(ANGULAR_MODULE, angular);
