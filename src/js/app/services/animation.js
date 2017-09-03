/* global ANGULAR_MODULE, angular */
(function(module, angular) {

  'use strict';

  //
  // SERVICE
  //

  /**
   * @constructor
   */
  var Animation = function($injector)
    {
      this.$injector = $injector;
    };

  Animation.$inject = ['$injector'];

  /**
   * Gets correctly prefixed animation end event.
   *
   * @private
   * @property animationEndEvent
   * @return {void}
   */
  Animation.prototype.animationEndEvent = (function() {
    var dummy = document.createElement('div');
    var events = {
      'WebkitAnimation': 'webkitAnimationEnd',
      'MozTAnimation': 'animationend',
      'animation': 'animationend'
    };

    for(var key in events){
        var event = dummy.style[key];
        if( event !== undefined ){
          return events[key];
        }
    }

    return null;
  })();

  /**
   * Gets correctly prefixed transition end event.
   *
   * @private
   * @property transitionEndEvent
   * @return {void}
   */
  Animation.prototype.transitionEndEvent = (function() {
    var dummy = document.createElement('div');
    var events = {
      'transition':'transitionend',
      'OTransition':'oTransitionEnd',
      'MozTransition':'transitionend',
      'WebkitTransition':'webkitTransitionEnd'
    };

    for(var key in events){
        var event = dummy.style[key];
        if( event !== undefined ){
          return events[key];
        }
    }

    return null;
  })();

  /**
   * Prepares cross-browser compatible tranlsate hash for ng-style.
   *
   * @public
   * @method translate
   * @param {number} x
   * @param {number} y
   * @param {number} [z]
   * @return {object}
   */
  Animation.prototype.translate = function(x, y, z) {
    var string = this.$injector.get('string');

    var translate = angular.isUndefined(z) ?
      string.sprintf('translate(%spx,%spx)', x, y) :
      string.sprintf('translate3d(%spx,%spx,%spx)', x, y, z);

    return {
      'webkitTransform': translate,
      'mozTransform': translate,
      'msTransform': translate,
      'oTransform': translate,
      'transform': translate
    };
  };

  /**
   * Polyfills potentially missing `requestAnimationFrame`.
   *
   * @private
   * @method requestAnimationFrame
   * @return {void}
   */
  Animation.prototype.requestAnimationFrame = (function(){
      var lastTime = 0;
      var vendors = ['ms', 'moz', 'webkit', 'o'];
      for(var i = 0; i < vendors.length && !window.requestAnimationFrame; i++) {
          window.requestAnimationFrame = window[vendors[i]+'RequestAnimationFrame'];
          window.cancelAnimationFrame = (
            window[vendors[i]+'CancelAnimationFrame'] ||
            window[vendors[i]+'CancelRequestAnimationFrame']
          );
      }

      if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var timeout = function() { callback(currTime + timeToCall); };
            var id = window.setTimeout(timeout, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
      }

      return window.requestAnimationFrame.bind(window);
  }());

  /**
   * Polyfills potentially missing `cancelAnimationFrame`.
   *
   * @private
   * @method cancelAnimationFrame
   * @return {void}
   */
  Animation.prototype.cancelAnimationFrame = (function(){
    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = function(id) { clearTimeout(id); };
    }

    return window.cancelAnimationFrame.bind(window);
  })();

  //
  // REGISTRY
  //
  angular.module(module).service('animation', Animation);

})(ANGULAR_MODULE, angular);
