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
    this.activeTab = this.tabDescription;
    this.hasExercise = $transclude.isSlotFilled('exercise');
  };

  Tabber.$inject = ['$scope','$element','$attrs', '$transclude'];

  //
  // PROPERTIES
  //

  /** @var {object} activeTab Reference to current active tab. */
  Tabber.prototype.activeTab = null;

  /** @var {array} hasExercise If slot `exercise` has contents. */
  Tabber.prototype.hasExercise = false;

  /** @var {string} tabExercise Id of `exercise` tab. */
  Tabber.prototype.tabExercise = 'exercise';

  /** @var {string} tabDescription Id of `description` tab. */
  Tabber.prototype.tabDescription = 'description';

  //
  // METHODS
  //

  /**
   * Sets up event listeners and animation frame.
   *
   * @public
   * @method onClick
   * @return {void}
   */
  Tabber.prototype.onClick = function(tab) {
    this.activeTab = tab;
  };

  /**
   * Sets up event listeners and animation frame.
   *
   * @public
   * @method onClick
   * @return {void}
   */
  Tabber.prototype.isDescriptionActive = function() {
    return this.activeTab === this.tabDescription;
  };

  /**
   * Sets up event listeners and animation frame.
   *
   * @public
   * @method onClick
   * @return {void}
   */
  Tabber.prototype.isExerciseActive = function() {
    return this.activeTab === this.tabExercise;
  };

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
