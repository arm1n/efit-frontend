/* global ANGULAR_MODULE, angular */
(function(module, angular) {
  'use strict';

  //
  // SERVICE
  //

  /**
   * @constructor
   */
  var Auth = function($injector)
    {
      this.$injector = $injector;
    };

  /**
   * @property {Array.<string>} $inject
   */
  Auth.$inject = ['$injector'];

  //
  // METHODS
  //

  /**
   * Sends a POST request to register route and
   * persists retrieved JWT token on success.
   *
   * @public
   * @method signin
   * @param {Object} data Data to submit.
   * @param {string} [firewall='frontend'] firewall
   * @param {Object} [config={}] $http config.
   * @return {Promise}
   */
  Auth.prototype.signup = function(data, firewall, config)
    {
      var $http = this.$injector.get('$http');

      firewall = firewall || 'frontend';
      config = config || {};

      var me = this;
      var successCallback = function(response)
        {
          me._saveToken(response.data);
        };

      var failureCallback = function()
        {
          // noop
        };

      var url = this._getSignupUrl(firewall);

      var promise = $http.post(
        url,
        {
          _username: data.username,
          _password: data.password
        },
        angular.extend(config || {})
      );

      promise.then(
        successCallback,
        failureCallback
      );

      return promise;
    };

  /**
   * Sends a POST request to login route and
   * persists retrieved JWT token on success.
   *
   * @public
   * @method signin
   * @param {Object} data Data to submit.
   * @param {string} [firewall='frontend'] firewall
   * @param {Object} [config={}] $http config.
   * @return {Promise}
   */
  Auth.prototype.signin = function(data, firewall, config)
    {
      var $http = this.$injector.get('$http');

      firewall = firewall || 'frontend';
      config = config || {};

      var me = this;
      var successCallback = function(response)
        {
          me._saveToken(response.data);
        };

      var failureCallback = function()
        {
          // noop
        };

      var url = this._getSigninUrl(firewall);

      var promise = $http.post(
        url,
        {
          _username: data.username,
          _password: data.password
        },
        angular.extend(config || {}, {
          skipAuthorization: true
        })
      );

      promise.then(
        successCallback,
        failureCallback
      );

      return promise;
    };

  /**
   * Destroys JWT token representing user.
   *
   * @public
   * @method logout
   * @param {Object} [config] $http config.
   * @return {Void}
   */
  Auth.prototype.signout = function(config)
    {
      var $http = this.$injector.get('$http');
      var user = this.$injector.get('user');
      var jwt = this.$injector.get('jwt');

      var successCallback = function()
        {
          jwt.invalidate();
          user.unload();
        };

      var failureCallback = function()
        {
          // noop
        };

      return $http.get(
        this._getSignoutUrl(),
        config || {}
      ).then(
        successCallback,
        failureCallback
      );
    };

  /**
   * Sends a POST request to refresh route
   * with saved refresh token from login().
   *
   * @public
   * @method refresh
   * @param {Object} [config] $http config.
   * @return {Promise}
   */
  Auth.prototype.refresh = function(config)
    {
      var $http = this.$injector.get('$http');
      var jwt = this.$injector.get('jwt');

      var me = this;
      var successCallback = function(response)
        {
          me._saveToken(response.data);
        };

      var failureCallback = function(rejection)
        {
          // invalidate possibly stored jwt
          // token to avoid further lookups
          // especially from router resolve
          jwt.invalidate();
        };

      var promise = $http.post(
        this._getRefereshUrl(),
        {
          /* jshint camelcase: false */
          refresh_token: jwt.getRefreshToken()
          /* jshint camelcase: true */
        },
        angular.extend(config || {}, {
          skipGlobalErrorMessage: true,
          skipAuthorization: true
        })
      );

      promise.then(
        successCallback,
        failureCallback
      );

      return promise;
    };

  /**
   * Returns decoded JWT token containing
   * user information such as `username`.
   * Note: By default expired tokens are
   * not accepted, set parameter if you
   * want to accept expired tokens too!
   *
   * @public
   * @method getUser
   * @param {boolean} [acceptExpired=false]
   * @return {Object|null}
   */
  Auth.prototype.getUser = function(acceptExpired)
    {
      acceptExpired = acceptExpired || false;

      var jwt = this.$injector.get('jwt');

      var token = jwt.getToken();
      if (!token) {
        return null;
      }

      if (!acceptExpired) {
        if (jwt.isExpired()) {
          return null;
        }
      }

      return jwt.decode(token);
    };

  /**
   * Checks if user has given role provided
   * in `roles` property encoded into JWT.
   *
   * @public
   * @method hasRole
   * @param {string|array} role
   * @return {Promise}
   */
  Auth.prototype.hasRole = function(role)
    {
      var jwt = this.$injector.get('jwt');
      var $q = this.$injector.get('$q');

      var defer = $q.defer();
      var promise = defer.promise;

      var isArray = angular.isArray(role);
      if (isArray && role.length === 0) {
        defer.reject(null);
        return promise;
      }

      if (!role) {
        defer.reject(null);
        return promise;
      }

      // accept expired tokens - we will
      // use refresh() to get new token
      // if current one is invalid now
      var user = this.getUser(true);
      if (user === null) {
        defer.reject(null);
        return promise;
      }

      // primitive method for role check
      var resolveRole = function(user) {
        var roles = user.roles || [];
        if (angular.isString(role)) {
          role = [role];
        }

        var hasRole = false;
        for (var i=0; i<role.length; i++) {
          if (roles.indexOf(role[i]) >= 0) {
            hasRole = true;
            break;
          }
        }

        if (hasRole) {
          defer.resolve();
        } else {
          defer.reject();
        }
      };

      // immediately resolve valid tokens
      if (!jwt.isExpired()) {
        resolveRole(user);
        return promise;
      }

      // try to refresh invalid tokens
      var me = this;
      var successCallback = function()
        {
          user = me.getUser();
          resolveRole(user);
        };

      var failureCallback = function()
        {
          defer.reject();
        };

      this.refresh().then(
        successCallback,
        failureCallback
      );

      return promise;
    };

  /**
   * Saves server response containing
   * the `token` and `refresh_token`.
   *
   * @private
   * @method _saveToken
   * @param {object} response
   * @return {void}
   */
  Auth.prototype._saveToken = function(data)
    {
      /* jshint camelcase: false */
      var jwt = this.$injector.get('jwt');

      jwt.setRefreshToken(data.refresh_token);
      jwt.setToken(data.token);
      /* jshint camelcase: true */
    };

  /**
   * Returns endpoint to gather JWT depending on firewall.
   *
   * @private
   * @method _getSigninUrl
   * @param {string} firewall
   * @return {string}
   */
  Auth.prototype._getSigninUrl = function(firewall){
    var API_URL = this.$injector.get('API_URL');

    switch(firewall) {
      case 'backend':
      case 'frontend':
        return API_URL + '/auth/' + firewall + '/signin';
      default:
        throw new Error('Unknown firewall name: ' + firewall);
    }
  };

  /**
   * Returns endpoint to register at given firewall.
   *
   * @private
   * @method _getSignupUrl
   * @param {string} firewall
   * @return {string}
   */
  Auth.prototype._getSignupUrl = function(firewall){
    var API_URL = this.$injector.get('API_URL');

    switch(firewall) {
      case 'frontend':
        return API_URL + '/auth/' + firewall + '/signup';
      case 'backend':
        throw new Error('Not implemented yet!');
      default:
        throw new Error('Unknown firewall name: ' + firewall);
    }
  };

  /**
   * Returns endpoint to refresh the JWT.
   *
   * @private
   * @method _getRefereshUrl
   * @return {string}
   */
  Auth.prototype._getRefereshUrl = function(){
    var API_URL = this.$injector.get('API_URL');

    return API_URL + '/auth/refresh';
  };

  /**
   * Returns endpoint to revoke the JWT.
   *
   * @private
   * @method _getSignoutUrl
   * @param {string} firewall
   * @return {string}
   */
  Auth.prototype._getSignoutUrl = function(){
    var API_URL = this.$injector.get('API_URL');

    return API_URL + '/signout';
  };

  //
  // REGISTRY
  //
  angular.module(module).service('auth', Auth);

})(ANGULAR_MODULE, angular);
