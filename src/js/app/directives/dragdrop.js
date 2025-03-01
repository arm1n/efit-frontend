/* global ANGULAR_MODULE, angular, interact */
(function(module, angular) {
  'use strict';

  // --------------------------------------------------
  // Draggable
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var Draggable = function($scope, $element, $attrs, $injector) {
    this.$element = $element;
    this.$scope = $scope;
    this.$attrs = $attrs;
    this.$injector = $injector;

    this._body = null;
    this._clone = null;
    this._coordinates = {};
    this._interactable = null;
    this._activeClass = 'active';
    this._itemClass = 'draggable';
    this._disabledClass = 'disabled';

    var me = this;
    this._unwatch = $scope.$watch(
      function(){ return me.disabled; },
      function(disabled) {
        if (disabled) {
          me.$element.addClass(me._disabledClass);
        } else {
          me.$element.removeClass(me._disabledClass);
        }

        me._interactable.draggable({enabled: !disabled});
      }
    );

    this._onResize = this._onResize.bind(this);
  };

  Draggable.$inject = ['$scope','$element','$attrs','$injector'];

  //
  // PROPERTIES
  //

  /** @var {object} data Connected data for draggable. */
  Draggable.prototype.data = null;

  /** @type {boolean} clone If clone item should be used. */
  Draggable.prototype.clone = false;

  /** @var {boolean} disabled If draggable is disabled. */
  Draggable.prototype.disabled = false;

  /** @type {boolean} clone If clone item should be used. */
  Draggable.prototype.restriction = 'parent';

  //
  // METHODS
  //

  /**
   * Initializes `interact` library on element
   * with all available callbacks for dragging.
   *
   * @public
   * @method $onInit
   * @return {Void}
   */
  Draggable.prototype.$onInit = function() {
    var $window = this.$injector.get('$window');

    this._body = angular.element(document.body);
    this.$element.addClass(this._itemClass);
    var element = this.$element.get(0);

    this._interactable = interact(element);

    var me = this;
    var options = {
      inertia: true,
      autoScroll: true,
      enabled: !this.disabled,
      onend: this._onEndItem.bind(this),
      onmove: this._onMoveItem.bind(this),
      onstart: this._onStartItem.bind(this),
      snap: {
          targets:[function(x,y,interaction) {
            // 'startCoords' doesn't work here, so
            // we catch initial position once from
            // interaction element and this values
            if (!me._origin) {
              me._origin = {
                x: interaction.startCoords.page.x,
                y: interaction.startCoords.page.y
              };
            }

            // if not dropped, move draggable
            // smoothly back to origin point
            if (!interaction.dropTarget) {
              return {
                x: me._origin.x, // instead of 0
                y: me._origin.y  // instead of 0
              };
            }
          }],
          //offset: 'startCoords',
          endOnly: true
      }
    };

    if (this.clone) {
      angular.extend(options, { manualStart: true });
      this._interactable.on('move', this._onMove.bind(this));
    }

    this._interactable.draggable(options);
    this._interactable.getData = this._getData.bind(this);

    this._window = angular.element($window);
    this._window.on('resize', this._resize);
  };

  /**
   * Removes event listener and watches.
   *
   * @public
   * @method $onDestroy
   * @return {void}
   */
  Draggable.prototype.$onDestroy = function() {
    this._window.off('resize', this._onResize);
    this._interactable.unset();
    this._unwatch();
  };

  /**
   * Resets `origin` info for snapping.
   *
   * @public
   * @method $onDestroy
   * @return {void}
   */
  Draggable.prototype._onResize = function() {
    this._origin = null;
  };

  /**
   * Adds `activeClass` to clone and invokes `onDragStart`.
   *
   * @private
   * @method _onStartItem
   * @return {Void}
   */
  Draggable.prototype._onStartItem = function(event) {
    var target = !this.clone ?
      angular.element(event.target) :
      this._clone;

    target.addClass(this._activeClass);

    this._trigger('onDragStart', {
      $event: event,
      $data: this.data
    });
  };

  /**
   * This performs actual dragging logic with CSS.
   * The method triggers the `onDragMove` callback.
   *
   * @private
   * @method _onMoveItem
   * @return {Void}
   */
  Draggable.prototype._onMoveItem = function(event) {
    var target = !this.clone ?
      angular.element(event.target) :
      this._clone;

    var x = (this._coordinates.x || 0) + event.dx;
    var y = (this._coordinates.y || 0) + event.dy;

    this._translate(target,x,y);

    this._trigger('onDragMove', {
      $event: event,
      $data: this.data
    });
  };

  /**
   * This performs resetting work by removing clone.
   * It invokes always the `onDragEnd` and the `onDrop`
   * callbacks - if dropped on target element.
   *
   * @private
   * @method _onEndItem
   * @return {Void}
   */
  Draggable.prototype._onEndItem = function(event) {
    var dropped = !!event.interaction.dropTarget;

    if (!this.clone) {
      var target = angular.element(event.target);
      target.removeClass(this._activeClass);

      // remove translate for snapping if
      // animating back to origin coords!
      if (!dropped) {
        this._translate(target,0,0);
      }

    } else {
      this._coordinates = {};
      this._clone.remove();
      this._clone = null;
    }

    this._trigger('onDragEnd', {
      $event: event,
      $data: this.data
    });

    if (dropped) {
      this._trigger('onDrop', {
        $event: event,
        $data: this.data
      });
    }
  };

  /**
   * Creates the clone and triggers manual kick-off for `interact`.
   * This is necessary because we want:
   *
   * 1) being able to show clone object
   * 2) being able to have disable control
   *
   * @private
   * @method _onMove
   * @return {Void}
   */
  Draggable.prototype._onMove = function(event) {
    var interactable = event.interactable;
    var interaction = event.interaction;
    var element = event.currentTarget;

    // we've to control `enabled` by our own as we are using the
    // `manualStart` option to create clone - noop if `disabled`
    if (this.disabled) {
      return;
    }

    // create clone if user holds mouse/finger and no interaction
    // is currently started - position absolutely at end of body!
    if (interaction.pointerIsDown && !interaction.interacting()) {
      this._clone = angular.element(element).clone();

      var offsetY = element.clientHeight / 2;
      var offsetX = element.clientWidth / 2;

      var pageY = !!event.touches ?
        event.touches[0].pageY :
        event.pageY;
      var pageX = !!event.touches ?
        event.touches[0].pageX :
        event.pageX;

      this._clone.css({
        left: (pageX - offsetX) + 'px',
        top: (pageY - offsetY) + 'px',
        position: 'absolute'
      });

      this._body.append(this._clone);
      element = this._clone.get(0);
    }

    // invoke 'drag' interaction manually with the target/clone
    interaction.start({ name: 'drag' }, interactable, element);
  };

  /**
   * Retrieves the connected drag object data.
   *
   * @private
   * @method _getData
   * @return {object}
   */
  Draggable.prototype._getData = function() {
    return this.data;
  };

  /**
   * Translates DOM node to given coordinates.
   *
   * @private
   * @method _translate
   * @param object element
   * @param number x
   * @param number y
   * @return {void}
   */
  Draggable.prototype._translate = function(element, x, y) {
    var translate = 'translate('+x+'px,'+y+'px)';

    element.css({
      'webkitTransform': translate,
      'mozTransform': translate,
      'msTransform': translate,
      'oTransform': translate,
      'transform': translate
    });

    this._coordinates.x = x;
    this._coordinates.y = y;
  };

  /**
   * Primitive method for invoking callbacks.
   *
   * @private
   * @method _trigger
   * @return {void}
   */
  Draggable.prototype._trigger = function(method, args) {
    this.$scope.$evalAsync(this[method].bind(this,args));
  };

  //
  // REGISTRY
  //
  angular.module(module).directive('draggable', function(){
    return {
      scope: {
        data: '=?draggableData',
        clone: '=?draggableClone',
        disabled: '=?draggableDisabled',
        onDragStart: '&draggableOnDragStart',
        onDragMove: '&draggableOnDragMove',
        onDragEnd: '&draggableOnDragEnd',
        onDrop: '&draggableOnDrop'
      },
      restrict: 'A',
      controller: Draggable,
      bindToController: true,
      controllerAs: 'draggableController'
    };
  });

  // --------------------------------------------------
  // Dropable
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var Dropable = function($scope, $element, $attrs) {
    this.$element = $element;
    this.$scope = $scope;
    this.$attrs = $attrs;

    this._interactable = null;
    this._enterClass = 'enter';
    this._activeClass = 'active';
    this._itemClass = 'dropable';
    this._acceptClass = 'draggable';
    this._disabledClass = 'disabled';

    var me = this;
    this._unwatch = $scope.$watch(
      function(){ return me.disabled; },
      function(disabled) {
        if (disabled) {
          me.$element.addClass(me._disabledClass);
        } else {
          me.$element.removeClass(me._disabledClass);
        }
      }
    );
  };

  Dropable.$inject = ['$scope','$element','$attrs'];

  //
  // PROPERTIES
  //

  /** @var {boolean} disabled If draggable is disabled. */
  Dropable.prototype.disabled = false;

  //
  // METHODS
  //

  /**
   * Initializes `interact` library on element
   * with all available callbacks for dragging.
   *
   * @public
   * @method $onInit
   * @return {Void}
   */
  Dropable.prototype.$onInit = function() {
    this._body = angular.element(document.body);
    this.$element.addClass(this._itemClass);
    var accept = '.' + this._acceptClass;
    var element = this.$element.get(0);

    this._interactable = interact(element)
      .dropzone({
        accept: accept,
        enabled: !this.disabled,
        ondrop: this._onDrop.bind(this),
        ondragenter: this._onDragEnter.bind(this),
        ondragleave: this._onDragLeave.bind(this),
        ondropactivate: this._onDropActivate.bind(this),
        ondropdeactivate: this._onDropDeactivate.bind(this)
      });
  };

  /**
   * Removes event listener and watches.
   *
   * @public
   * @method $onDestroy
   * @return {void}
   */
  Dropable.prototype.$onDestroy = function() {
    this._interactable.unset();
    this._unwatch();
  };

  /**
   * Removes the active class from element and
   * triggers the `onDropDeactivate` callback.
   *
   * @private
   * @method _onDropDeactivate
   * @return {Void}
   */
  Dropable.prototype._onDropDeactivate = function(event) {
    this.$element.removeClass(this._activeClass);
    var data = event.draggable.getData();

    this._trigger('onDropDeactivate', {
      $event: event,
      $data: data
    });
  };

  /**
   * Applies the active class from element and
   * triggers the `onDropActivate` callback.
   *
   * @private
   * @method _onDropDeactivate
   * @return {Void}
   */
  Dropable.prototype._onDropActivate = function(event) {
    this.$element.addClass(this._activeClass);
    var data = event.draggable.getData();

    this._trigger('onDropActivate', {
      $event: event,
      $data: data
    });
  };

  /**
   * Applies the enter class from element and
   * triggers the `onDragEnter` callback.
   *
   * @private
   * @method _onDropDeactivate
   * @return {Void}
   */
  Dropable.prototype._onDragEnter = function(event) {
    this.$element.addClass(this._enterClass);
    var data = event.draggable.getData();

    this._trigger('onDragEnter', {
      $event: event,
      $data: data
    });
  };

  /**
   * Removes the enter class from element and
   * triggers the `onDragLeave` callback.
   *
   * @private
   * @method _onDropDeactivate
   * @return {Void}
   */
  Dropable.prototype._onDragLeave = function(event) {
    this.$element.removeClass(this._enterClass);
    var data = event.draggable.getData();

    this._trigger('onDragLeave', {
      $event: event,
      $data: data
    });
  };

  /**
   * Removes the enter class from element and
   * triggers the `onDrop` callback with data
   * from the draggable element.
   *
   * @private
   * @method _onDropDeactivate
   * @return {Void}
   */
  Dropable.prototype._onDrop = function(event) {
    this.$element.removeClass(this._enterClass);
    var data = event.draggable.getData();

    this._trigger('onDrop',{
      $event: event,
      $data: data
    });
  };

  /**
   * Primitive method for invoking callbacks.
   *
   * @private
   * @method _trigger
   * @return {void}
   */
  Dropable.prototype._trigger = function(method, args) {
    this.$scope.$evalAsync(this[method].bind(this,args));
  };

  //
  // REGISTRY
  //
  angular.module(module).directive('dropable', function(){
    return {
      scope: {
        disabled: '=?dropableDisabled',
        onDropDeactivate: '&dropableOnDropDeactivate',
        onDropActivate: '&dropableOnDropActivate',
        onDragEnter: '&dropableOnDragEnter',
        onDragLeave: '&dropableOnDragLeave',
        onDrop: '&dropableOnDrop'
      },
      restrict: 'A',
      controller: Dropable,
      bindToController: true,
      controllerAs: 'droppableController'
    };
  });

})(ANGULAR_MODULE, angular);
