/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

  var Random = function() {
    this._spareRandomCache = null;
  };

  Random.$inject = [];

  Random.prototype.between = function(min, max) {
    min = typeof min !== 'undefined' ? min : 0;
    max = typeof max !== 'undefined' ? max : 1;

    var fact = (max - min + 1);
    var rand = Math.random();

    return Math.floor(rand * fact + min);
  };

  Random.prototype.gaussian = function(mean, stdDev) {
    stdDev = typeof stdDev !== 'undefined' ? stdDev : 1;
    mean = typeof mean !== 'undefined' ? mean : 0;

    var spare = this._spareRandomCache;
    if (this._spareRandomCache !== null) {
      this._spareRandomCache = null;
      return mean + stdDev * spare;
    }

    var u, v, s;

    do {
      u = 2 * Math.random() - 1;
      v = 2 * Math.random() - 1;
      s = u*u + v*v;
    } while (s >= 1 || s===0);

    var m = Math.sqrt(-2 * Math.log(s) / s);
    this._spareRandomCache = v * m;
    return mean + stdDev * u * m;
  };

  Random.prototype.pick = function(array) {
    return array[this.between(0, array.length - 1)];
  };

  Random.prototype.push = function(array, value) {
    var rand = this.between(0, array.length - 1);
    array.push(array[rand]);
    array[rand] = value;

    return array.length;
  };

  Random.prototype.shuffle = function(array) {
    for( var i=array.length-1; i>0; i-- ) {
      var rand = this.between(0, i);
      var temp = array[i];

      array[i] = array[rand];
      array[rand] = temp;
    }

    return array;
  };

  //
  // REGISTRY
  //
  angular.module(module).service('random', Random);

})(ANGULAR_MODULE, angular);
