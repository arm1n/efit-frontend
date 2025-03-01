/* global ANGULAR_MODULE, angular, EventSource */
(function(module, angular) {
  'use strict';

  //
  // SERVICE
  //

  /**
   * @constructor
   */
  var SSE = function($injector)
    {
      this.$injector = $injector;
      this._sources = {};
    };

  SSE.$inject = ['$injector'];

  //
  // METHODS
  //

  /**
   * Adds a new event source to listen to.
   *
   * @public
   * @method add
   * @param string url
   * @param string event
   * @param function callback
   * @return {void}
   */
  SSE.prototype.addSource = function(url, config) {
    config = config || {};

    config.retry = config.retry || null;
    config.event = config.event || null;
    config.sleep = config.sleep || null;
    config.onError = config.onError || function(){};
    config.onMessage = config.onMessage || function(){};

    url = this._buildUrl(url, config);
    var source = new EventSource(url);

    source.onmessage = function(event) {
      var data = angular.fromJson(event.data);
      config.onMessage.call(this, data, event);
    };

    source.onerror = function(event) {
      config.onError.call(this, event);
    };

    this._sources[url] = source;
    return source;
  };

  /**
   * Adds a new event source to listen to.
   *
   * @public
   * @method removeSource
   * @param object source
   * @return {void}
   */
  SSE.prototype.removeSource = function(source) {
    delete this._sources[source.url];
    source.close();
  };

  /**
   * Appends JWT token as query string to url.
   * Adds optional config options if available.
   *
   * @private
   * @method _getUrl
   * @param string url
   * @param object config
   * @return {string}
   */
  SSE.prototype._buildUrl = function(url, config){
    var jwt = this.$injector.get('jwt');
    var token = jwt.getToken();

    url = url + '?bearer=' + token;

    if (config.event) {
      url += '&event=' + config.event;
    }

    if (config.sleep) {
      url += '&sleep=' + config.sleep;
    }

    if (config.retry) {
      url += '&retry=' + config.retry;
    }

    return url;
  };

  //
  // REGISTRY
  //
  angular.module(module).service('sse', SSE);

})(ANGULAR_MODULE, angular);
