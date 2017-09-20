/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

  // --------------------------------------------------
  // Form Field
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var FormField = function($scope, $element, $attrs, $transclude, $timeout)
    {
      this.$scope = $scope;
      this.$attrs = $attrs;
      this.$element = $element;
      this.$timeout = $timeout;
      this.$transclude = $transclude;

      this._transcludeElements = [];
      this._transcludeScopes = [];
      this._cloneDefault = null;
      this._cloneLabel = null;
      this._unlisten = [];
      this._unwatch = [];
    };

  FormField.$inject = ['$scope', '$element', '$attrs', '$transclude', '$timeout'];

  //
  // PROPERTIES
  //

  /** @var {string} id Dom id form element. */
  FormField.prototype.id = '';

  /** @var {string} label Label of form element. */
  FormField.prototype.label = '';

  /** @var {ngModelController} model Added `ngModel` controller. */
  FormField.prototype.ngModel = null;

  /** @var {boolean} resetEmpty If validation resets on empty model. */
  FormField.prototype.resetEmpty = true;

  /** @var {boolean} showMessages True if `ngMessages` are visible. */
  FormField.prototype.showMessages = false;

  /** @var {string} labelClass Class to append to label. */
  FormField.prototype.labelClass = 'uk-form-label';

  /** @var {string} failureClass Class to append on failure. */
  FormField.prototype.failureClass = 'uk-form-danger';

  /** @var {string} successClass Class to append on success. */
  FormField.prototype.successClass = 'uk-form-success';

  //
  // METHODS
  //

  /**
   * Renders custom transclusion (form element) and
   * sets up watchers as well as clean up methods.
   *
   * @public
   * @method $onInit
   * @return {Void}
   */
  FormField.prototype.$onInit = function()
    {
      // create dom id from `name` and $scope id
      // controller properties are only available
      // in $onInit() callback from Angular 1.5.x
      this.id = 'form-field-' + this.$scope.$id;

      // add watch properties
      this._addWatches();

      // transclude contents
      this._transclude();
    };

  /**
   * Removes transcluded elements, scope and watches.
   *
   * @public
   * @method $onDestroy
   * @return {void}
   */
  FormField.prototype.$onDestroy = function()
    {
      angular.forEach(this._transcludeElements, function(element){
        element.remove();
      });

      angular.forEach(this._transcludeScopes, function(scope){
        scope.$destroy();
      });

      angular.forEach(this._unlisten, function(unlisten){
        unlisten();
      });

      angular.forEach(this._unwatch, function(unwatch){
        unwatch();
      });
    };

  /**
   * Sets model controller from transcluded form
   * element using the `ng-model` attribute and
   * the `form-field-model` helper component.
   *
   * @public
   * @method setModel
   * @param {NgModelController} ngModel
   * @return {void}
   */
  FormField.prototype.setModel = function(ngModel)
    {
      this.ngModel = ngModel;
    };

  /**
   * Updates validation depending on `ngModel.$valid`.
   *
   * @private
   * @method _update
   * @return {void}
   */
  FormField.prototype._update = function()
    {
      if (this.ngModel.$valid) {
        this._cloneDefault.removeClass(this.failureClass);
        this._cloneDefault.addClass(this.successClass);
      } else {
        this._cloneDefault.removeClass(this.successClass);
        this._cloneDefault.addClass(this.failureClass);
      }

      this.showMessages = this.ngModel.$invalid;
    };

  /**
   * Resets corresponding validation properties.
   *
   * @private
   * @method _reset
   * @return {boolean}
   */
  FormField.prototype._reset = function()
    {
      this._cloneDefault.removeClass(this.failureClass);
      this._cloneDefault.removeClass(this.successClass);
      this.ngModel.$setUntouched();
      this.showMessages = false;
    };

  /**
   * Adds scope watches for `isValid()` and `isInvalid()`.
   *
   * @private
   * @method _addWatches
   * @return {void}
   */
  FormField.prototype._addWatches = function()
    {
      var me = this;

      // observes `ngModel` controller for changing any
      // of its validation properties such as `$valid`
      var unwatchModel = this.$scope.$watchCollection(
        'formFieldController.ngModel',
        function(newModel, oldModel)
        {
          // ignore initial invocation
          if (newModel === oldModel) {
            return;
          }

          // as long as model hasn't been
          // touched no validation's made
          if (!newModel.$touched) {
              return;
          }

          // wait for async validators
          if (newModel.$pending) {
            return;
          }

          // if no view value is present
          // reset all validation props!
          if (!newModel.$viewValue) {
            if (me.resetEmpty) {
              me._reset();
              return;
            }
          }

          me._update();
        }
      );

      this._unwatch.push(unwatchModel);
    };

  /**
   * Transcludes `default` and `label` slot programmatically
   * to append custom attributes and events to dom elements.
   *
   * @private
   * @method _transclude
   * @return {void}
   */
  FormField.prototype._transclude = function()
    {
      var me = this;

      // adds `id` attribute to be focues by <label>
      var transcludeDefault = function(clone, scope)
      {
        var domId = '#default-' + me.id;
        var template = angular.element(domId);

        clone.attr('id', me.id);

        template.replaceWith(clone);

        me._cloneDefault = clone;

        me._transcludeScopes.push(scope);
        me._transcludeElements.push(clone);
      };

      // adds `labelClass` and sets `for` attribute
      // for <label> in order to auto focus element
      var transcludeLabel = function(clone, scope)
      {
        var domId = '#label-' + me.id;
        var template = angular.element(domId);

        clone.attr('for', me.id);
        clone.addClass(me.labelClass);

        template.replaceWith(clone);

        me._cloneLabel = clone;

        me._transcludeScopes.push(scope);
        me._transcludeElements.push(clone);
      };

      // wait for dom to be ready before transclude
      var timeout = function()
      {
        me.$transclude(transcludeDefault, null, null);
        me.$transclude(transcludeLabel, null, 'label');
      };

      this.$timeout(timeout);
    };

  //
  // REGISTRY
  //
  angular.module(ANGULAR_MODULE).directive('formField',function() {
    return {
      scope: {
          name: '=formField',
          resetEmpty: '=?formFieldResetEmpty',
          labelClass: '=?formFieldLabelClass',
          failureClass: '=?formFieldFailureClass',
          successClass: '=?formFieldSuccessClass'
      },
      transclude: {
        label: '?label',
        messageMin: '?messageMin',
        messageMax: '?messageMax',
        messageUrl: '?messageUrl',
        messageEmail: '?messageEmail',
        messageNumber: '?messageNumber',
        messagePattern: '?messagePattern',
        messageRequired: '?messageRequired',
        messageMinlength: '?messageMinlength',
        messageMaxlength: '?messageMaxlength',
        messagesCustom: '?messagesCustom'
      },
      restrict: 'A',
      controller: FormField,
      bindToController: true,
      controllerAs: 'formFieldController',
      templateUrl: 'views/directives/form-field.html'
    };
  });

  // --------------------------------------------------
  // Form Field Model
  // --------------------------------------------------

  /**
   * @constructor
   */
  var FormFieldModel = function($scope, $attrs, $element, $injector) {
    this.$scope = $scope;
    this.$attrs = $attrs;
    this.$element = $element;
    this.$injector = $injector;
  };

  FormFieldModel.$inject = ['$scope', '$attrs', '$element', '$injector'];

  //
  // PROPERTIES
  //

  /** @var {boolean} autoFocus If true element receives focus on init. */
  FormFieldModel.prototype.autoFocus = false;

  //
  // METHODS
  //

  /**
   * Registers `ngModel` on `formField` controller.
   *
   * @public
   * @method $onInit
   * @return {Void}
   */
  FormFieldModel.prototype.$onInit = function()
    {
      var $timeout = this.$injector.get('$timeout');
      var $log = this.$injector.get('$log');

      if (!this.formField) {
        $log.warn('formFieldModel: No form field controller found!');
        return;
      }

      if (this.autoFocus) {
        var element = this.$element.get(0);
        var focus = function() {
          element.focus();
        };

        $timeout(focus, 1);
      }

      this.formField.setModel(this.ngModel);
    };

  //
  // REGISTRY
  //
  angular.module(module).directive('formFieldModel', function(){
    return {
      scope: {
        'autoFocus': '=?formFieldModelAutoFocus'
      },
      restrict: 'A',
      require: {
        'ngModel': 'ngModel',
        'formField': '^?formField',
      },
      bindToController: true,
      controller: FormFieldModel
    };
  });

})(ANGULAR_MODULE, angular);
