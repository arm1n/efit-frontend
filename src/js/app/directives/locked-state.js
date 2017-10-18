/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

  // --------------------------------------------------
  // Locked State
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var LockedState = function($scope, $element, $attrs, $injector) {
    this.$scope = $scope;
    this.$attrs = $attrs;
    this.$element = $element;

    this.user = $injector.get('user');
  };

  LockedState.$inject = ['$scope','$element','$attrs', '$injector'];

  //
  // REGISTRY
  //
  angular.module(module).directive('lockedState', function(){
    return {
      scope: {
        isLocked: '=?lockedState'
      },
      restrict: 'A',
      transclude: {
        userText: '?userText',
        adminText: '?adminText',
        superAdminText: '?superAdminText'
      },
      controller: LockedState,
      bindToController: true,
      controllerAs: 'lockedStateController',
      templateUrl: 'views/directives/locked-state.html'
    };
  });

})(ANGULAR_MODULE, angular);
