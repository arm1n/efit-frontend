/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

  // --------------------------------------------------
  // i18n
  // --------------------------------------------------
  angular.module(module).filter('i18n',['i18n',function(i18n){
    var filter = function()
      {
        return i18n.get.apply(i18n, arguments);
      };

    filter.$stateful = true;

    return filter;
  }]);

  // --------------------------------------------------
  // Percentage
  // --------------------------------------------------
  angular.module(module).filter('percent', function(){
    return function(value, fraction) {
      fraction = isNaN(fraction) ? 0 : fraction;
      value = isNaN(value) ? 0 : value * 100;

      return value.toFixed(fraction) + '%';
    };
  });

  // --------------------------------------------------
  // Coin
  // --------------------------------------------------
  angular.module(module).filter('coin', function(){
    return function(value) {

      if (value >= 1) {
        return value + '&#8364;';
      }

      return (value*100) + '&#162;';
    };
  });

  // --------------------------------------------------
  // Note
  // --------------------------------------------------
  angular.module(module).filter('note', function(){
    return function(value) {
      return value + '&#8364;';
    };
  });

})(ANGULAR_MODULE, angular);
