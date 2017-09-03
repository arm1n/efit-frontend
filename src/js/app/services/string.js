/* global ANGULAR_MODULE, angular */
(function(module, angular) {

  'use strict';

  //
  // SERVICE
  //

  /**
   * @constructor
   */
  var String = function()
    {
    };

  String.$inject = [];

  /**
   * Replaces placeholders (= '%s') from a string with variables.
   *
   * @public
   * @method sprintf
   * @param {string} input String to replace placeholders.
   * @param {object} variables Object holding replacements.
   * @return {string}
   */
  String.prototype.sprintf = function(input,variables)
    {
        if (!angular.isArray(variables)) {
          variables = [].slice.call(arguments, 1);
        }

        for (var i=0; i<variables.length; i++) {
          input = input.replace(/%s/,variables[i]);
        }

        return input;
    };

  /**
   * Truncates a string by given params.
   *
   * @public
   * @method truncate
   * @param {string} input String to be truncated.
   * @param {number} [maxLength=20] Maximum number of chars.
   * @return {string}
   */
  String.prototype.truncate = function(input,maxLength)
    {
        maxLength = maxLength || 20;
        if (input.length <= maxLength) {
          return input;
        }

        return input.substring(0,maxLength) + '...';
    };

  /**
   * Trims a string.
   *
   * @public
   * @method trim
   * @param {string} input String to trim.
   * @return {string}
   */
  String.prototype.trim = function(input)
    {
        return input.replace(/^\s+|\s+$/g, '');
    };

  /**
   * Transforms a string to camel case.
   *
   * @public
   * @method toCamel
   * @param {string} input String to convert.
   * @return {string}
   */
  String.prototype.toCamel = function(input)
    {
        return input.replace(/([-_][a-z])/g, function(part){
            return part.toUpperCase().replace(/[-_]/,'');
        });
    };

  /**
   * Transforms a string to spinal case.
   *
   * @public
   * @method toSpinal
   * @param {string} input String to convert.
   * @return {string}
   */
  String.prototype.toSpinal = function(input)
    {
        return input.replace(/([A-Z]|_[a-z])/g, function(part){
            return '-' + part.toLowerCase().replace(/_/,'');
        });
    };

  /**
   * Transforms a string to snake case.
   *
   * @public
   * @method toSnake
   * @param {string} input String to convert.
   * @return {string}
   */
  String.prototype.toSnake = function(input)
    {
        return input.replace(/([A-Z]|-[a-z])/g, function(part){
            return '_' + part.toLowerCase().replace(/-/,'');
        });
    };

  //
  // REGISTRY
  //
  angular.module(module).service('string', String);

})(ANGULAR_MODULE, angular);
