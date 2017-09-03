/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

  //
  // SERVICE
  //

  /**
   * @constructor
   */
  var AppState = function($injector)
    {
      this.$injector = $injector;
    };

  AppState.$inject = ['$injector'];

  //
  // PROPERTIES
  //

  /** @var {boolean} httpBusy If $http is currently doing work. */
  AppState.prototype.httpBusy = false;

  /** @var {boolean} routerBusy If router is currently doing work. */
  AppState.prototype.routerBusy = false;

  //
  // METHODS
  //

  /**
   * Returns true if `httpBusy` or `routeBusy` is true.
   *
   * @public
   * @method isBusy
   * @return {void}
   */
  AppState.prototype.isBusy = function() {
    return this.httpBusy || this.routeBusy;
  };

  //
  // REGISTRY
  //
  angular.module(module).service('appState', AppState);

})(ANGULAR_MODULE, angular);
