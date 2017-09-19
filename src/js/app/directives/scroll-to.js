/* global ANGULAR_MODULE, angular, UIkit, jQuery */
(function(module, angular) {
  'use strict';

  // --------------------------------------------------
  // ScrollTo
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var ScrollTo = function($scope, $element, $attrs, $injector) {
    this.$scope = $scope;
    this.$attrs = $attrs;
    this.$element = $element;
    this.$injector = $injector;

    this.options = {};

    this._source = null;
    this._target = null;
    this._scroller = null;
    this._init = this._init.bind(this);
    this._onClick = this._onClick.bind(this);
    this._onScrolled = this._onScrolled.bind(this);
  };

  ScrollTo.$inject = ['$scope','$element','$attrs', '$injector'];

  //
  // PROPERTIES
  //

  /** @var {number} delay Delayed invokation in ms. */
  ScrollTo.prototype.delay = null;

  /** @var {object} options Options for `scroll` service. */
  ScrollTo.prototype.options = null;

  /** @var {function} callback Callback for scroll finished. */
  ScrollTo.prototype.callback = null;

  /** @var {boolean} disabled Flag indicating disabled state. */
  ScrollTo.prototype.disabled = null;

  //
  // METHODS
  //

  /**
   * Waits for rendering and invokes `_init()`.
   *
   * @public
   * @method $onInit
   * @return {Void}
   */
  ScrollTo.prototype.$onInit = function() {
    var $timeout = this.$injector.get('$timeout');

    // wait for being rendered
    $timeout(this._init, 1);
  };

  /**
   * Removes event listener and watches.
   *
   * @public
   * @method $onDestroy
   * @return {void}
   */
  ScrollTo.prototype.$onDestroy = function() {
    this._source.off('scrolled', this._onScrolled);
    this.$element.off('click', this._onClick);

    this._scroller.$destroy(true);
  };

  /**
   * Extracts dom element and sets up scroller.
   *
   * @private
   * @method _init
   * @return {void}
   */
  ScrollTo.prototype._init = function() {
    // try to grab target from - can be either
    // a jquery element or a string id / hash
    if (this.element instanceof jQuery) {
      this._target = this.element;
    } else {
      if (angular.isString(this.element)) {
        if (this.element.charAt(0) !== '#') {
          this._target = '#' + this.element;
        }

        this._target = jQuery(this._target);
      }
    }

    if (this._target.length === 0) {
      console.warn('scroll-to.js: Invalid target element!');
      return;
    }

    // need to create a dummy `<a href='#hash'></a>`
    // element to set it as source object for UIkit
    var href = '#' + this._target.id;
    this._source = jQuery('<a href="'+href+'"></a>');

    this.options = this.options || {};
    this.options.easing = angular.isString(this.options.easing)
      ? this.options.easing
      : 'easeOutExpo';
    this.options.offset = angular.isNumber(this.options.offset)
      ? this.options.offset
      : 100;
    this.options.duration = angular.isNumber(this.options.duration)
      ? this.options.duration
      : 500;

    this.$element.on('click', this._onClick);
    this._source.on('scrolled', this._onScrolled);

    this._scroller = UIkit.scroll(this._source, this.options);
  };

  /**
   * Invokes scrolling to target element.
   *
   * @private
   * @method _onClick
   * @return {void}
   */
  ScrollTo.prototype._onClick = function() {
    var $timeout = this.$injector.get('$timeout');

    var onDelay = function() {
      if (this.disabled) {
        return;
      }

      this._scroller.scrollTo(this._target);
    };

    $timeout(onDelay.bind(this), this.delay);
  };

  /**
   * Tries to invoke callback after scrolling.
   *
   * @private
   * @method _onScrolled
   * @return {void}
   */
  ScrollTo.prototype._onScrolled = function() {
    if (!angular.isFunction(this.callback)) {
      return;
    }

    this.$scope.$evalAsync(this.callback);
  };

  //
  // REGISTRY
  //
  angular.module(module).directive('scrollTo', function(){
    return {
      scope: {
        element: '=scrollTo',
        delay: '=?scrollToDelay',
        options: '=?scrollToOptions',
        callback: '=?scrollToCallback',
        disabled: '=?scrollToDisabled'
      },
      restrict: 'A',
      controller: ScrollTo,
      bindToController: true
    };
  });

})(ANGULAR_MODULE, angular);
