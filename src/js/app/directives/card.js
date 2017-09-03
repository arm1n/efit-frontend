/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

  // --------------------------------------------------
  // Card
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var CardContainer = function() {
  };

  CardContainer.$inject = ['$scope', '$element', '$attrs'];

  //
  // PROPERTIES
  //

  /** @var {array} cards Stack of registered cards. */
  CardContainer.prototype.cards = [];

  /** @var {boolean} canToggle If cards can be toggled. */
  CardContainer.prototype.canToggle = false;

  //
  // METHODS
  //

  /**
   * Adds a `card` directive to stack.
   *
   * @public
   * @method click
   * @return {Void}
   */
  CardContainer.prototype.add = function(card) {
    this.cards.push(card);
  };

  /**
   * Toggles card state if `canToggle` is true.
   *
   * @public
   * @method set
   * @return {boolean}
   */
  CardContainer.prototype.set = function(card) {
    if (card.selected && !this.canToggle) {
      return false;
    }

    // toggle current card's state
    var selected = !!card.selected;
    card.selected = selected ? null : true;

    // reset all other card states
    angular.forEach(this.cards, function(current) {
      if (current.id === card.id) {
        return;
      }

      current.selected = card.selected ? false : null;
    });

    return true;
  };

  //
  // REGISTRY
  //
  angular.module(module).directive('cardContainer', function(){
    return {
      scope: {
        canToggle: '=?cardContainerCanToggle'
      },
      restrict: 'A',
      controller: CardContainer,
      bindToController: true,
      controllerAs: 'cardContainerController'
    };
  });

  // --------------------------------------------------
  // Card
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var Card = function($scope, $element, $attrs, $transclude) {
    this.$scope = $scope;
    this.$attrs = $attrs;
    this.$element = $element;

    this.id = this.$scope.$id;
    this.hasIcon = $transclude.isSlotFilled('icon');
  };

  Card.$inject = ['$scope', '$element', '$attrs', '$transclude'];

  //
  // PROPERTIES
  //

  /** @var {number} id Unique id of card. */
  Card.prototype.id = null;

  /** @var {mixed} data Passthrough data of card. */
  Card.prototype.data = null;

  /** @var {boolean} selected If card is selected. */
  Card.prototype.selected = null;

  /** @var {boolean} disabled If card is disabled. */
  Card.prototype.disabled = null;

  /** @var {boolean} hasIcon If card has `icon` slot filled. */
  Card.prototype.hasIcon = null;

  /** @var {boolean} isCheckbox If card should behave as checkbox. */
  Card.prototype.isCheckbox = false;

  //
  // METHODS
  //

  /**
   * Invokes the `cardOnClick` callback.
   *
   * @public
   * @method $onInit
   * @return {Void}
   */
  Card.prototype.$onInit = function() {
    if (!this.cardContainer) {
      return;
    }

    this.cardContainer.add(this);
  };

  /**
   * Invokes the `cardOnClick` callback.
   *
   * @public
   * @method click
   * @return {Void}
   */
  Card.prototype.click = function($event) {
    if (this.disabled) {
      return;
    }

    $event.stopPropagation();
    $event.preventDefault();

    if (this.cardContainer) {
      var changed = this.cardContainer.set(this);
      if (!changed) {
        return;
      }
    }

    this.onClick({
      data: this.data,
      selected: this.selected,
      disabled: this.disabled
    });
  };

  //
  // REGISTRY
  //
  angular.module(module).directive('card', function(){
    return {
      scope: {
        data: '=?cardData',
        onClick: '&cardOnClick',
        selected: '=?cardSelected',
        disabled: '=?cardDisabled',
        isCheckbox: '=?cardIsCheckbox'
      },
      restrict: 'A',
      transclude: {
        text: 'cardText',
        title: 'cardTitle',
        icon: '?cardIcon',
        buttons: '?cardButtons'
      },
      controller: Card,
      bindToController: true,
      controllerAs: 'cardController',
      require:{
        cardContainer: '^?cardContainer',
      },
      templateUrl: 'views/directives/card.html'
    };
  });

})(ANGULAR_MODULE, angular);
