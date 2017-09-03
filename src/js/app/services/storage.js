/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

  /**
   * @varructor
   */
  var Storage = function($injector) {
    this.$injector = $injector;
  };

  Storage.MODE_COOKIES = 'COOKIES';
  Storage.MODE_STORAGE = 'STORAGE';
  Storage.$inject = ['$injector'];

  /**
   * Gets the current storage interface of the service.
   * Can be one of modes `COOKIES` or `STORAGE`. If no
   * one is given will default to local storage if it's
   * supported, otherwise falls back to cookies.
   *
   * @public
   * @method getProxy
   * @param {String} mode
   * @return {Object}
   */
  Storage.prototype.getProxy = function(mode) {
    switch (mode) {
      case Storage.MODE_COOKIES:
       return this._getCookieProxy();

      case Storage.MODE_STORAGE:
       return this._getLocalStorageProxy();

     default:
      if (this.supportsLocalStorage()) {
        return this._getLocalStorageProxy();
      }

      return this._getCookieProxy();
    }
  };

  /**
   * Checks if browser supports local storage.
   *
   * @public
   * @method supportsLocalStorage
   * @return {Boolean}
   */
  Storage.prototype.supportsLocalStorage = function() {
    var $window = this.$injector.get('$window');
    var storageProxy = $window.localStorage;
    var key = '__local__storage__feature__test';
    var val = '__local__storage__feature__test';

    try {
     storageProxy.setItem(key, val);
     storageProxy.removeItem(key);
    } catch (e) {
     return false;
    }

    return true;
  };

  /**
   * Stringifies and uri encodes a value.
   *
   * @private
   * @param {Mixed} value
   * @method _encode
   *
   * @return {String}
   */
  Storage.prototype._encode = function(value) {
    try {
     value = JSON.stringify(value);
    } catch (e) {
     value = undefined;
    }

    return encodeURIComponent(value);
  };

  /**
   * Decodes a stringified and uri encoded value.
   *
   * @private
   * @param {Mixed}
   * @method _decodeValue
   *
   * @return {Mixed}
   */
  Storage.prototype._decode = function(value) {
    var decoded;
    switch (typeof value) {
     case 'string':
       decoded = decodeURIComponent(value);
       try {
         decoded = JSON.parse(decoded);
       } catch (e) {
         /* noop */
       }
       break;
     default:
       decoded = undefined;
    }

    if (decoded === 'undefined') {
     decoded = undefined;
    }

    if (decoded === undefined) {
     decoded = null;
    }

    return decoded;
  };

  /**
   * Provides cookie storage proxy layer.
   *
   * @private
   * @method _getCookieProxy
   *
   * @return {Object}
   */
  Storage.prototype._getCookieProxy = function() {
    var documentProxy = this.$injector.get('$document');

    var me = this;
    var _getAll = function(parse) {
     var items = {};

     var cookies = documentProxy.cookie.split('; ');
     if (cookies.length === 1 && cookies[0] === '') {
       return items;
     }

     for (var i = 0; i < cookies.length; i++) {
       var cookie = cookies[i].split('=');
       if (!parse) {
         items[cookie[0]] = cookie[1];
         continue;
       }

       items[cookie[0]] = me._decode(cookie[1]);
     }

     return items;
    };

    var setCookie = function(key, value, expires, domain, path, secure) {
     value = me._encode(value);

     try {
       var date = new Date(expires);
       if (isNaN(date)) {
         var input = expires;
         expires = undefined;
         throw new Error('storage.js: "' + input + '" cannot be converted to date string!');
       }

       expires = date.toUTCString();
     } catch (e) {
       /* noop */
     }

     expires = expires ? expires : false;

     var cookie = key + '=' + value;
     cookie += expires ? ';expires='+expires : '';
     cookie += domain ? ';domain='+domain : '';
     cookie += path ? ';path='+path : '';
     cookie += secure ? ';secure' : '';

     documentProxy.cookie = cookie;
    };

    var getCookie = function(key) {
     var cookies = _getAll(false);
     if (cookies.hasOwnProperty(key)) {
       return me._decode(cookies[key]);
     }

     return null;
    };

    var getAllCookies = function() {
     return _getAll(true);
    };

    var removeCookie = function(key) {
     setCookie(key, '', -1);
    };

    var removeAllCookies = function() {
     for (var key in getAllCookies()) {
       removeCookie(key);
     }
    };

    return {
     getItem: getCookie,
     getAllItems: getAllCookies,
     setItem: setCookie,
     removeItem: removeCookie,
     removeAllItems: removeAllCookies
    };
  };

  /**
   * Provides local storage proxy layer.
   *
   * @private
   * @method _getLocalStorageProxy
   *
   * @return {Object}
   */
  Storage.prototype._getLocalStorageProxy = function() {
    var $window = this.$injector.get('$window');
    var storageProxy = $window.localStorage;

    var me = this;
    var setItem = function(key, value) {
     value = me._encode(value);
     storageProxy.setItem(key, value);
    };

    var getItem = function(key) {
     var value = storageProxy.getItem(key);
     return me._decode(value);
    };

    var getAllItems = function() {
     var items = {};

     for (var i = 0; i < storageProxy.length; i++) {
       var key = storageProxy.key(i);
       items[key] = getItem(key);
     }

     return items;
    };

    var removeItem = function(key) {
     storageProxy.removeItem(key);
    };

    var removeAllItems = function() {
     storageProxy.clear();
    };

    return {
     getItem: getItem,
     getAllItems: getAllItems,
     setItem: setItem,
     removeItem: removeItem,
     removeAllItems: removeAllItems
    };
  };

  //
  // REGISTRY
  //
  angular.module(module).service('storage', Storage);

})(ANGULAR_MODULE, angular);
