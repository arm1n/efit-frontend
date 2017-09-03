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
    var url = API_URL + '/ticket/:id';
    var paramDefaults = { id: '@id' };
    var actions = {
      getByWorkshop: {
        method: 'GET',
        isArray: true,
        url: API_URL + '/ticket/workshop/:workshopId'
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
  angular.module(module).factory('Ticket', Factory);

})(ANGULAR_MODULE, angular);
