/* global ANGULAR_MODULE, angular */
(function(module, angular) {

  'use strict';

  //
  // SERVICE
  //

  /**
   * @constructor
   */
  var I18N = function($injector)
    {
      this.translations = {};
      this.$injector = $injector;

      this.setLocale(this._detectLocale());
    };

  I18N.$inject = ['$injector'];

  //
  // PROPERTIES
  //

  /** @var {object} locales Currently supported locales. */
  I18N.prototype.locales = {
    'de': true
  };

  /** @var {string} defaultLocale Default locale to use. */
  I18N.prototype.defaultLocale = 'de';

  /**
   * Loads translations according to current locale if not available.
   *
   * @public
   * @method load
   * @param {locale} [locale] Two letter language code.
   * @param {Object} [config] Additional config for $http
   * @return {Promise|void}
   */
  I18N.prototype.load = function(locale, config)
    {
      locale = locale || this.getLocale();
      config = config || {};

      if (this.translations[locale]) {
        return;
      }

      var $http = this.$injector.get('$http');
      var $log = this.$injector.get('$log');

      var me = this;
      var url = this._getJSONUrl(locale);
      var successCallback = function(response)
        {
          me.translations[locale] = response.data;
        };

      var failureCallback = function()
        {
          $log.error('Could not load translations!');
        };

      return $http.get(url, config).then(
        successCallback,
        failureCallback
      );
    };

  /**
   * Sets locale to given paraemter if it's a valid one.
   * Falls back to `defaultLocale` if it's an invalid one.
   *
   * @public
   * @method setLocale
   * @param {string} locale
   * @return {void}
   */
  I18N.prototype.setLocale = function(locale)
    {
      if (this.locales[locale]) {
        this.locale = locale;
        return;
      }

      this.locale = this.defaultLocale;
    };

  /**
   * Delivers the currently used locale for translations.
   *
   * @public
   * @method setLocale
   * @param {string} locale
   * @return {void}
   */
  I18N.prototype.getLocale = function()
    {
      return this.locale;
    };

  /**
   * Makes a lookup within current translation dictionary.
   *
   * @param {string} key The i18n key.
   * @param {string} ... Parameters to be replaced.
   * @return {string}
   */
  I18N.prototype.get = function(key)
    {
      var string = this.$injector.get('string');
      var params = [].slice.call(arguments,1);
      var locale = this.getLocale();

      var text;
      try {
        text = this.translations[locale][key];
      } catch(e) {}

      return string.sprintf(text || key, params);
    };

  /**
   * Returns endpoint to gather JSON translations.
   *
   * @private
   * @method _getTranslationsUrl
   * @param {string} locale
   * @return {string}
   */
  I18N.prototype._getJSONUrl = function(locale)
    {
      return 'json/' + locale + '.json';
    };

  /**
   * @ignore
   */
  I18N.prototype._detectLocale = function()
    {
      var navigator = this.$injector.get('$window').navigator;
      var android = /android.*\W(\w\w)-(\w\w)\W/i;
      var language;

      // try to find locale on android devices!
      if( navigator && navigator.userAgent &&
          (language = navigator.userAgent.match(android)) ) {
          language = language[1];
      }

      // for all other browsers
      if (!language && navigator) {
        if( navigator.language ) {
          language = navigator.language;
        } else if( navigator.userLanguage ) {
          language = navigator.userLanguage;
        } else if( navigator.systemLanguage ) {
          language = navigator.systemLanguage;
        } else if( navigator.browserLanguage ) {
          language = navigator.browserLanguage;
        }
      }

      // now we can get iso code
      if (language) {
        return language.substr(0,2);
      }

      // use `defaultLocale` as fallback
      return this.defaultLocale;
    };

  //
  // REGISTRY
  //
  angular.module(module).service('i18n', I18N);

})(ANGULAR_MODULE, angular);
