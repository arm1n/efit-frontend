/* global ANGULAR_MODULE, angular, UIkit */
(function(module, angular) {
  'use strict';

  // --------------------------------------------------
  // Modal
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var Modal = function($scope, $attrs, $element, $transclude) {
    this.$scope = $scope;
    this.$attrs = $attrs;
    this.$element = $element;
    this.$transclude = $transclude;

    this._element = null;
    this._modal = null;
    this._scope = null;
  };

  Modal.$inject = ['$scope', '$attrs', '$element', '$transclude'];

  //
  // PROPERTIES
  //

  /** @var {boolean} isVisible Flag for modal visibility. */
  Modal.prototype.isVisible = false;

  //
  // METHODS
  //

  /**
   * Registers UIkit callbacks and watches.
   *
   * @public
   * @method $onInit
   * @return {Void}
   */
  Modal.prototype.$onInit = function()
    {
      var me = this;

      // listeners
      this._onShow = function() {
        me.$scope.$evalAsync(me.onShow);
      };

      this._onShown = function() {
        me.$scope.$evalAsync(me.onShown);
      };

      this._onBeforeShow = function() {
        me.$scope.$evalAsync(me.onBeforeShow);
      };

      this._onHide = function() {
        me.$scope.$evalAsync(me.onHide);
      };

      this._onHidden = function() {
        me.$scope.$evalAsync(function(){
          me.onHidden();
          me.isVisible = false;
        });
      };

      this._onBeforeHide = function() {
        me.$scope.$evalAsync(me.onBeforeHide);
      };

      // watches
      this._unwatch = this.$scope.$watch(
        'modalController.isVisible',
        function(isVisible) {
          if (isVisible) {
            me.transclude();
            return;
          }

          me.destroy();
        }
      );
    };

  /**
   * Cleans up everything on destruction.
   *
   * @public
   * @method $onDestroy
   * @return {Void}
   */
  Modal.prototype.$onDestroy = function()
    {
      this._unwatch();
      this.destroy();
    };

  /**
   * Transcludes contents and shows modal.
   *
   * @public
   * @method render
   * @return {Void}
   */
  Modal.prototype.transclude = function() {
    var me = this;

    var transclude = function(clone, scope) {
      // save element and scope
      me._element = clone;
      me._scope = scope;

      // register UIKit listeners
      me._element.on('show', me._onShow);
      me._element.on('shown', me._onShown);
      me._element.on('beforeshow', me._onBeforeShow);

      me._element.on('hide', me._onHide);
      me._element.on('hidden', me._onHidden);
      me._element.on('beforeHide', me._onBeforeHide);

      // replace with actual element
      me.$element.append(clone);

      // create and show the modal
      me._modal = UIkit.modal(clone);
      me._modal.show();
    };

    this.$transclude(transclude);
  };

  /**
   * Destructs current modal transclusion from DOM.
   *
   * @public
   * @method $onDestroy
   * @return {Void}
   */
  Modal.prototype.destroy = function() {
    if (this._element !== null) {
      this._element.off('show', this._onShow);
      this._element.off('shown', this._onShown);
      this._element.off('beforeshow', this._onBeforeShow);

      this._element.off('hide', this._onHide);
      this._element.off('hidden', this._onHidden);
      this._element.off('beforeHide', this._onBeforeHide);

      this._element.remove();
      this._element = null;
    }

    if (this._scope !== null) {
      this._scope.$destroy();
      this._scope = null;
    }

    if (this._modal !== null) {
      this._modal.hide();
      this._modal = null;
    }
  };

  //
  // REGISTRY
  //
  angular.module(module).directive('modal', function(){
    return {
      scope: {
        isVisible: '=?modal',
        onShow:'&modalOnShow',
        onHide:'&modalOnHide',
        onShown:'&modalOnShown',
        onHidden:'&modalOnHidden',
        onBeforeShow:'&modalOnBeforeShow',
        onBeforeHide:'&modalOnBeforeHide'
      },
      restrict: 'A',
      controller: Modal,
      transclude: 'element',
      bindToController: true,
      controllerAs: 'modalController'
    };
  });

})(ANGULAR_MODULE, angular);
