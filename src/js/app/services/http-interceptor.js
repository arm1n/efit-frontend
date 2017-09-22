/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

  var HttpInterceptor = function($injector)
    {
      this.$injector = $injector;
      this._urls = {};
    };

  /** @var {Array.<string>} $inject Dependencies to be injected by Angular. */
  HttpInterceptor.$inject = ['$injector'];

  /**
   * Gets latest response from $http.
   */
  HttpInterceptor.prototype.getLastSuccessResponse = function()
    {
      return this._lastSuccessResponse;
    };

  /**
   * Gets latest error from $http.
   */
  HttpInterceptor.prototype.getLastErrorResponse = function()
    {
      return this._lastErrorResponse;
    };

  /**
   * Gets latest response from $http.
   */
  HttpInterceptor.prototype.getLastResponse = function()
    {
      return this._lastResponse;
    };

  /**
   * Returns a hash of all requested urls.
   */
  HttpInterceptor.prototype.getUrls = function()
    {
      return this._urls;
    };

  /**
   * Intercepts $http request's config before invocation.
   * @param {object} config
   * @return {object} config
   */
  HttpInterceptor.prototype.request = function(config)
    {
      var appState = this.$injector.get('appState');

      // set app state to busy
      appState.httpBusy = true;

      // save url in internal cache
      this._setUrl(config);

      // set common headers
      config.headers['X-Requested-With'] = 'XMLHttpRequest';

      // JWT authorization
      var successCallback = function(token) {
        if (token) {
          config.headers.Authorization = 'Bearer ' + token;
        }

        return config;
      };

      var failureCallback = function() {
        return config;
      };

      if (config.skipAuthorization) {
        return config;
      }

      var jwtToken = this._getJWTToken(config);
      var $q = this.$injector.get('$q');
      return $q.when(jwtToken).then(
        successCallback,
        failureCallback
      );
    };

  /**
   * Intercepts $http request error's config before invocation.
   * @param {object} config
   * @return {object} config
   */
  HttpInterceptor.prototype.requestError = function(rejection)
    {
      var appState = this.$injector.get('appState');
      var $q = this.$injector.get('$q');

      appState.httpBusy = false;

      return $q.reject(rejection);
    };

  /**
   * Intercepts $http response before forwarding.
   * @param {object} config
   * @return {object} config
   */
  HttpInterceptor.prototype.response = function(response)
    {
      var appState = this.$injector.get('appState');

      this._setLastSuccessResponse(response);
      this._setLastResponse(response);

      appState.httpBusy = false;

      return response;
    };

  /**
   * Intercepts $http error response before forwarding.
   * @param {object} config
   * @return {object} config
   */
  HttpInterceptor.prototype.responseError = function(rejection)
    {
      var appState = this.$injector.get('appState');
      var $q = this.$injector.get('$q');

      this._showGlobalErrorMessage(rejection);
      this._setLastErrorResponse(rejection);
      this._setLastResponse(rejection);
      this._checkJWT(rejection);

      appState.httpBusy = false;

      return $q.reject(rejection);
    };

  /**
   * Sets fully qualified url with query string for a request.
   * This is useful to manage Angular's $cacheFactory for $http.
   * @param {object} config
   */
  HttpInterceptor.prototype._setUrl = function(config)
    {
      var $httpParamSerializer = this.$injector.get('$httpParamSerializer');
      var params = $httpParamSerializer(config.params);
      var url = config.url + (
        params ?
          '?' + params :
          ''
      );

      this._urls[url] = true;
    };

  /**
   * @ignore
   */
  HttpInterceptor.prototype._setLastResponse = function(responseOrRejection)
    {
      this._lastResponse = responseOrRejection;
    };

  /**
   * @ignore
   */
  HttpInterceptor.prototype._setLastErrorResponse = function(rejection)
    {
      this._lastErrorResponse = rejection;
    };

  /**
   * @ignore
   */
  HttpInterceptor.prototype._setLastSuccessResponse = function(response)
    {
      this._lastSuccessResponse = response;
    };

  /**
   * @ignore
   */
  HttpInterceptor.prototype._showGlobalErrorMessage = function(rejection)
  {
    var notification = this.$injector.get('notification');
    var i18n = this.$injector.get('i18n');

    var config = rejection.config || {};
    if (config.skipGlobalErrorMessage) {
      return;
    }

    var data = rejection.data || {};
    if (!data.message) {
      return;
    }

    notification.error(i18n.get(data.message));
  };

  /**
   * @ignore
   */
  HttpInterceptor.prototype._checkJWT = function(rejection)
  {
    var jwt = this.$injector.get('jwt');

    switch (rejection.status) {
      case 403:
        // invalidate user on 403 message
        // to redirect to the login pages
        jwt.invalidate();
        break;
      default:
    }
  };

  /**
   * @ignore
   */
  HttpInterceptor.prototype._getJWTToken = function() {
    var auth = this.$injector.get('auth');
    var jwt = this.$injector.get('jwt');

    // a) no token available in storage
    var token = jwt.getToken();
    if (!token) {
      return null;
    }

    // b) token is still valid, check for
    // refresh if it expires in 5 minutes
    if (jwt.isExpired(token, 600)) {
      var successCallback = function() {
        return jwt.getToken();
      };

      var failureCallback = function() {
        return null;
      };

      return auth.refresh().then(
        successCallback,
        failureCallback
      );
    }

    // c) use current token
    return jwt.getToken();
  };

  //
  // REGISTRY
  //
  angular.module(module).factory('httpInterceptor',['$injector',function($injector){

      var httpInterceptor = $injector.instantiate(HttpInterceptor);

      return { // important: $http service invokes this methods with global scope!
        getUrls: function(){ return httpInterceptor.getUrls(); },
        getLastResponse: function(){ return httpInterceptor.getLastResponse(); },
        getLastErrorResponse: function(){ return httpInterceptor.getLastErrorResponse(); },
        getLastSuccessResponse: function(){ return httpInterceptor.getLastSuccessResponse(); },
        request: function(config){ return httpInterceptor.request(config); },
        response: function(response){ return httpInterceptor.response(response); },
        requestError: function(rejection){ return httpInterceptor.responseError(rejection); },
        responseError: function(rejection){ return httpInterceptor.responseError(rejection); }
      };
    }]);

})(ANGULAR_MODULE, angular);
