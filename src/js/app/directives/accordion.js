/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

  // --------------------------------------------------
  // Accordion
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var Accordion = function($scope, $element, $attrs, $injector) {
    this.$scope = $scope;
    this.$attrs = $attrs;
    this.$element = $element;
    this.$injector = $injector;

    this._accordion = null;
    this._collapsibles = [];
    this._init = this._init.bind(this);
    this._onCollapsibleClicked = this._onCollapsibleClicked.bind(this);
  };

  Accordion.$inject = ['$scope','$element','$attrs', '$injector'];

  //
  // PROPERTIES
  //

  /** @var {object} options Options for accordion. */
  Accordion.prototype.options = null;

  //
  // METHODS
  //

  /**
   * Initializes accordion after rendering.
   *
   * @public
   * @method $onInit
   * @return {Void}
   */
  Accordion.prototype.$onInit = function() {
    var $timeout = this.$injector.get('$timeout');

    // wait for being rendered
    $timeout(this._init, 1);
  };

  /**
   * Tears down accordion on desctruction.
   *
   * @public
   * @method $onDestroy
   * @return {Void}
   */
  Accordion.prototype.$onDestroy = function() {
    if (this._accordion) {
      this._accordion.$destroy();
    }

    this._unlistenCollapsible();
  };

  /**
   * Sets `activeTab` property by name.
   *
   * @public
   * @method addCollapsible
   * @param {Object} collapsible
   * @return {Void}
   */
  Accordion.prototype.addCollapsible = function(collapsible) {
    this._collapsibles.push(collapsible)
  };

  /**
   * Initializes UIKit accordion and event listeners.
   *
   * @private
   * @method _init
   * @return {Void}
   */
  Accordion.prototype._init = function() {
    var $rootScope = this.$injector.get('$rootScope');
    var element = this.$element.get(0);

    var options = angular.extend(
      {
        targets: '.collapsible',
        animation: false
      },
      this.options || {}
    );

    this._unlistenCollapsible = $rootScope.$on(
      'collapsible_clicked',
      this._onCollapsibleClicked
    );

    this._accordion = UIkit.accordion(element, options);
  };

  /**
   * Initializes UIKit accordion and event listeners.
   *
   * @private
   * @method _onCollapsibleClicked
   * @return {Void}
   */
  Accordion.prototype._onCollapsibleClicked = function(evt, sender) {
    var iterate = function(item, index) {
      var senderId = sender.$scope.$id;
      var itemId = item.$scope.$id;

      // ignore sender collapsible
      if (senderId === itemId) {
        return;
      }

      // ignore closing sender
      if (!sender.open) {
        return;
      }

      // ignore closed items
      if (!item.open) {
        return
      }

      // toggle open items
      this._accordion.toggle(index);
      item.open = false;
    };

    angular.forEach(
      this._collapsibles,
      iterate.bind(this)
    );
  };

  //
  // REGISTRY
  //
  angular.module(module).directive('accordion', function(){
    return {
      scope: {
        options: '=?accordionOptions'
      },
      restrict: 'A',
      transclude: true,
      controller: Accordion,
      bindToController: true,
      controllerAs: 'accordionController',
      templateUrl: 'views/directives/accordion.html'
    };
  });

  // --------------------------------------------------
  // Accordion Item
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var Collapsible = function($scope, $element, $attrs, $injector) {
    this.$scope = $scope;
    this.$attrs = $attrs;
    this.$element = $element;
    this.$injector = $injector;

    this.domId = this.id || 'accordion-item-' + $scope.$id;
  };

  Collapsible.$inject = ['$scope','$element','$attrs', '$injector'];

  //
  // PROPERTIES
  //

  /** @var {string} id Unique dom id for this collapsible. */
  Collapsible.prototype.id = null;

  /** @var {boolean} open If collapsible is currently open. */
  Collapsible.prototype.open = false;

  //
  // METHODS
  //

  /**
   * Sets `activeTab` property by name.
   *
   * @public
   * @method setActive
   * @param {string} tab
   * @return {Void}
   */
  Collapsible.prototype.$onInit = function() {
    this.accordion.addCollapsible(this);
  };

  /**
   * Sets `activeTab` property by name.
   *
   * @public
   * @method setActive
   * @param {string} tab
   * @return {Void}
   */
  Collapsible.prototype.onClick = function() {
    this.open = !this.open;

    var $rootScope = this.$injector.get('$rootScope');
    $rootScope.$broadcast('collapsible_clicked', this);
  };

  //
  // REGISTRY
  //
  angular.module(module).directive('collapsible', function(){
    return {
      scope: {
        id: '=?collapsibleId',
        open: '=?collapsibleOpen'
      },
      restrict: 'A',
      transclude: {
        title: '?collapsibleTitle',
        content: 'collapsibleContent'
      },
      require: {
        accordion: '^accordion'
      },
      controller: Collapsible,
      bindToController: true,
      controllerAs: 'collapsibleController',
      templateUrl: 'views/directives/collapsible.html'
    };
  });

})(ANGULAR_MODULE, angular);
