/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

  // --------------------------------------------------
  // Evaluation
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var Evaluation = function($scope, $element, $attrs, $injector) {
    this.$scope = $scope;
    this.$attrs = $attrs;
    this.$element = $element;
    this.$injector = $injector;

    this.user = $injector.get('user');
    this.domId = 'evaluation-' + $scope.$id;
  };

  Evaluation.$inject = ['$scope','$element','$attrs', '$injector'];

  //
  // PROPERTIES
  //

  /** @var {string} domId Unique dom id for scrolling. */
  Evaluation.prototype.domId = null;

  //
  // REGISTRY
  //
  angular.module(module).directive('evaluation', function(){
    return {
      scope: {
        parent: '=evaluation'
      },
      restrict: 'A',
      transclude: {
        text: 'evaluationText',
        customButtons: '?evaluationCustomButtons',
        defaultButtons: '?evaluationDefaultButtons'
      },
      controller: Evaluation,
      bindToController: true,
      controllerAs: 'evaluationController',
      templateUrl: 'views/directives/evaluation.html'
    };
  });

})(ANGULAR_MODULE, angular);
