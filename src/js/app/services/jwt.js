/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

  /**
  * @constructor
  */
  var JWT = function($injector, storage) {
    this.$injector = $injector;
    this.storage = storage.getProxy();
  };

  JWT.$inject = ['$injector', 'storage'];

  //
  // PROPERTIES
  //

  /** @var {string} tokenKey Token key for local storage. */
  JWT.prototype.tokenKey = 'NAksNyshI3';

  /** @var {string} refreshKey Refresh key for local storage. */
  JWT.prototype.refreshKey = 'i08BFNG9t5';

  //
  // METHODS
  //

  /**
   * Resets JWT token / refresh token in local storage.
   *
   * @public
   * @method invalidate
   * @return {void}
   */
  JWT.prototype.invalidate = function()
    {
      this.removeRefreshToken();
      this.removeToken();
    };

  /**
   * Gets JWT token from local storage.
   *
   * @public
   * @method getToken
   * @return {string|null}
   */
  JWT.prototype.getToken = function()
    {
      return this.storage.getItem(this.tokenKey);
    };

  /**
   * Sets JWT token in local storage.
   *
   * @public
   * @method setToken
   * @param {string} token
   * @return {void}
   */
  JWT.prototype.setToken = function(token)
    {
      this.storage.setItem(this.tokenKey,token);
    };

  /**
   * Removes JWT token from local storage.
   *
   * @public
   * @method removeToken
   * @return {void}
   */
  JWT.prototype.removeToken = function()
    {
      this.storage.removeItem(this.tokenKey);
    };

  /**
   * Gets JWT refresh token from local storage.
   *
   * @public
   * @method getRefreshToken
   * @return {string|null}
   */
  JWT.prototype.getRefreshToken = function()
    {
      return this.storage.getItem(this.refreshKey);
    };

  /**
   * Sets JWT refresh token in local storage.
   *
   * @public
   * @method setRefreshToken
   * @param {string} refreshToken
   * @return {void}
   */
  JWT.prototype.setRefreshToken = function(refreshToken)
    {
      this.storage.setItem(this.refreshKey, refreshToken);
    };

  /**
   * Removes JWT refresh token from local storage.
   *
   * @public
   * @method removeToken
   * @return {void}
   */
  JWT.prototype.removeRefreshToken = function()
    {
      this.storage.removeItem(this.refreshKey);
    };

  /**
   * Converts timestamp into date object.
   *
   * @public
   * @method getExpirationDate
   * @param {string} token
   * @return {date}
   */
  JWT.prototype.getExpirationDate = function(token)
    {
      var $log = this.$injector.get('$log');

      token = token || this.getToken();
      if (!token) {
        $log.error('No token given or available!');
        return null;
      }

      var decoded = this.decode(token);
      if (typeof decoded.exp==='undefined') {
        $log.error('No `exp` property available!');
        return null;
      }

      var date = new Date(0);
      date.setUTCSeconds(decoded.exp);

      return date;
    };

  /**
   * Determines if given token is expired.
   *
   * @public
   * @method isExpired
   * @param {string} token
   * @param {number} offset In seconds.
   * @return {boolean}
   */
  JWT.prototype.isExpired = function(token, offset)
    {
      offset = offset || 0;
      token = token || this.getToken();

      var date = this.getExpirationDate(token);
      if (date === null) {
        return true;
      }

      var now = new Date().valueOf();
      offset = now + offset * 1000;
      date = date.valueOf();

      return date <= offset;
    };

  /**
   * Tries to decode a JWT token.
   *
   * @public
   * @method decode
   * @param {string} token
   * @return {object|null}
   */
  JWT.prototype.decode = function(token)
    {
      var $log = this.$injector.get('$log');

      try {
        var parts = token.split('.');
        if (parts.length !== 3) {
          throw new Error('JWT must have 3 parts!');
        }

        var decoded = this._base64Decode(parts[1]);
        if (!decoded) {
          throw new Error('Cannot decode the token!');
        }

        return angular.fromJson(decoded);
      } catch(e) {
        $log.error(e);
        return null;
      }
    };

  /**
   * Validates and decodes a base64 url.
   *
   * @private
   * @method _base64Decode
   * @param {string} input
   * @return {string}
   */
  JWT.prototype._base64Decode = function(input)
    {
      var $window = this.$injector.get('$window');
      var $log = this.$injector.get('$log');

      var output = input
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      try{
        switch (output.length % 4) {
          case 0: {
            break;
          }

          case 2: {
            output += '=='; break;
          }

          case 3: {
            output += '='; break;
          }

          default: {
            throw new Error('Illegal base64url code!');
          }
        }
      } catch(e) {
        $log.error(e);
        return '';
      }

      var decoded = $window.atob(output);
      var escaped = $window.escape(decoded);

      return $window.decodeURIComponent(escaped);
    };

  //
  // REGISTRY
  //
  angular.module(module).service('jwt', JWT);

})(ANGULAR_MODULE, angular);
