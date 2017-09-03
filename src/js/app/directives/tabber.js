/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

  // --------------------------------------------------
  // Tabber
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var Tabber = function($scope, $element, $attrs, $transclude) {
    this.$scope = $scope;
    this.$attrs = $attrs;
    this.$element = $element;
    this.$transclude = $transclude;

    this.domId = 'tabber-' + $scope.$id;

    this.hasExercise = $transclude.isSlotFilled('exercise');
  };

  Tabber.$inject = ['$scope','$element','$attrs', '$transclude'];

  //
  // PROPERTIES
  //

  /** @var {array} hasExercise If slot `exercise` has contents. */
  Tabber.prototype.hasExercise = false;

  //
  // REGISTRY
  //
  angular.module(module).directive('tabber', function(){
    return {
      scope: {
        icon: '=?tabberIcon'
      },
      restrict: 'A',
      transclude: {
        exercise: '?tabberExercise',
        description: 'tabberDescription'
      },
      controller: Tabber,
      bindToController: true,
      controllerAs: 'tabberController',
      templateUrl: 'views/directives/tabber.html'
    };
  });

})(ANGULAR_MODULE, angular);
