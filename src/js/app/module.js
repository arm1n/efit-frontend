/* global angular */
(function(global, angular){
  'use strict';

  //
  // MODULE
  //
  var module = 'eFit';

  //
  // APP
  //
  var app = angular.module(module, [
    'ngSanitize',
    'ngMessages',
    'ngResource',
    'ui.router',
    'eFit.views',
    'eFit.config'
  ]);

  //
  // CONSTANTS
  //

  // @see: config.js

  //
  // CONFIG
  //
  app.config([
    '$locationProvider', '$stateProvider', '$urlRouterProvider', '$httpProvider',
    '$templateRequestProvider', '$resourceProvider', '$qProvider', 'VIEWS_PATH',
    function(
      $locationProvider, $stateProvider, $urlRouterProvider, $httpProvider,
      $templateRequestProvider, $resourceProvider, $qProvider, VIEWS_PATH) {

      // -------------------------
      // LOCATION
      // -------------------------
      $locationProvider.html5Mode(false);
      $locationProvider.hashPrefix('!');

      // -------------------------
      // INTERCEPTORS
      // -------------------------
      $httpProvider.interceptors.push('httpInterceptor');

      // -------------------------
      // PROMISES
      // -------------------------
      $qProvider.errorOnUnhandledRejections(false);

      // -------------------------
      // RESOURCES
      // -------------------------
      $resourceProvider.defaults.actions = {
        get:    { method: 'GET' },
        list:   { method: 'GET', isArray:true },
        update: { method: 'PATCH' },
        create: { method: 'POST'},
        delete: { method: 'DELETE'}
      };

      // -------------------------
      // TEMPLATES
      // -------------------------

      // assign default `templateUrl` for states
      $stateProvider.decorator('views', function(state, parent) {
        //
        // Assigns default template URL:
        // ./path/to/state/[view/][/name].html
        //
        var newViewConfig = {}, views = parent(state);
        angular.forEach(views, function(config, view){
          var viewMatch = view.match(/([^@]+)\@/); // [parentView/]view@state.name
          var viewName = viewMatch ? '/' + viewMatch[1] : '';

          var stateName = state.name.replace(/\./g, '/');

          var templateUrl = config.templateUrl || [
            VIEWS_PATH,
            stateName,
            viewName,
            '.html'
          ].join('');

          config.templateUrl = templateUrl;
          newViewConfig[view] = config;
        });

        return newViewConfig;
      });

      // ignore JWT authorization on template requests
      $templateRequestProvider.httpOptions({
        skipAuthorization: true
      });

      // -------------------------
      // STATES
      // -------------------------

      // main (i18n)
      $stateProvider.state('main', {
        url: '',
        abstract: true,
        resolve: {
          translations: ['i18n', function(i18n){
            return i18n.load('de', {
              skipAuthorization: true
            });
          }],
        },
        template: '<div id="main" data-ui-view=""></div>'
      });

      // frontend
      $stateProvider.state('frontend', {
        parent: 'main',
        url: '/',
        resolve: {
          current: [
            'user', '$state', '$q',
            function(user, $state){
              var promise = user.load().$promise;
              return promise.catch(function(){
                $state.go('login.frontend');
              });
            }
          ]
        },
        data: {
          role: [
            'ROLE_USER',
            'ROLE_ADMIN',
            'ROLE_SUPER_ADMIN'
          ]
        },
        views: {
          'navbar@frontend': {},
          'home@frontend': {},
          'topics@frontend': {},

          'financial-knowledge@frontend':{},
          'financial-knowledge/interest-task@frontend':{},
          'financial-knowledge/diversification-task@frontend':{},

          'consumer-behaviour@frontend':{},
          'consumer-behaviour/bomb-task@frontend':{},
          'consumer-behaviour/anchoring-task@frontend':{},
          'consumer-behaviour/mental-bookkeeping-task@frontend':{},
          'consumer-behaviour/framing-task@frontend':{},

          'self-control@frontend':{},
          'self-control/savings-target-task@frontend':{},
          'self-control/savings-supported-task@frontend':{},
          'self-control/self-commitment-task@frontend':{},
          'self-control/procrastination-task@frontend':{},

          'status@frontend': {},
          'contact@frontend': {
            controller: 'ContactController',
            controllerAs: 'contactController'
          },
          'footer@frontend': {},
          'offcanvas@': {
            controller: 'FrontendController',
            controllerAs: 'frontendController'
          },
          '@': {
            controller: 'FrontendController',
            controllerAs: 'frontendController'
          }
        }
      });

      // backend
      $stateProvider.state('backend', {
        parent: 'main',
        url: '/admin',
        data: {
          role: [
            'ROLE_ADMIN',
            'ROLE_SUPER_ADMIN'
          ]
        },
        resolve: {
          isSuperAdmin: [
            'auth', '$state', '$q',
            function(auth, $state, $q){
              var defer = $q.defer();

              var successCallback = function() {
                defer.resolve(true);
              };
              var failureCallback = function() {
                defer.resolve(false);
              };

              auth.hasRole(
                'ROLE_SUPER_ADMIN'
              ).then(
                successCallback,
                failureCallback
              );

              return defer.promise;
            }
          ]
        },
        redirectTo: 'backend.workshops',
        views: {
          'main@backend': {},
          'navbar@backend': {},
          'footer@backend': {},
          'offcanvas@': {
            controller: 'BackendController',
            controllerAs: 'backendController'
          },
          '@': {
            controller: 'BackendController',
            controllerAs: 'backendController'
          }
        },

      });

      $stateProvider.state('backend.workshops', {
        url: '?{expand:int}',
        data: {
          role: [
            'ROLE_ADMIN',
            'ROLE_SUPER_ADMIN'
          ]
        },
        resolve: {
          workshops: ['Workshop', function(Workshop){
            return Workshop.list().$promise;
          }]
        },
        params: {
          expand: {
            value: null,
            dynamic: true
          }
        },
        controller: 'WorkshopController',
        controllerAs: 'workshopController'
      });

      $stateProvider.state('backend.admins', {
        url: '/trainer',
        data: {
          role: 'ROLE_SUPER_ADMIN',
          redirects: {
            ROLE_ADMIN: 'backend'
          }
        },
        resolve: {
          admins: ['Admin', function(Admin){
            return Admin.list().$promise;
          }]
        },
        controller: 'AdminController',
        controllerAs: 'adminController'
      });

      // login
      $stateProvider.state('login', {
        url: '/login',
        parent: 'main',
        abstract: true,
        redirectTo: 'login.frontend.index'
      });

      $stateProvider.state('login.frontend', {
        url: '/app',
        resolve: {
          code: [
            'CODE_STORAGE_KEY', 'storage',
            function(CODE_STORAGE_KEY, storage){
              var proxy = storage.getProxy();
              return proxy.getItem(
                CODE_STORAGE_KEY
              );
            }
          ]
        },
        data: {
          redirects: {
            ROLE_USER: 'frontend'
          }
        },
        redirectTo: 'login.frontend.index',
        controller: 'LoginFrontendController',
        controllerAs: 'loginFrontendController'
      });

      $stateProvider.state('login.frontend.index', {
        url: ''
      });

      $stateProvider.state('login.frontend.signup', {
        url: '/schule',
        redirectTo: 'login.frontend.signup.step1'
      });

      $stateProvider.state('login.frontend.signup.step1', {
        url: '/schritt-1',
        redirectTo: function(transition){
          var redirectTo = function(code) {
            if (code) {
              return 'login.frontend.signup.step2';
            }
          };

          var $injector = transition.injector();
          var code = $injector.getAsync('code');
          return code.then(redirectTo);
        }
      });

      $stateProvider.state('login.frontend.signup.step2', {
        url: '/schritt-2',
        resolvePolicy: { when: 'EAGER' },
        redirectTo: function(transition){
          var redirectTo = function(code) {
            if (!code) {
              return 'login.frontend.signup.step1';
            }
          };

          var $injector = transition.injector();
          var code = $injector.getAsync('code');
          return code.then(redirectTo);
        }
      });

      $stateProvider.state('login.frontend.signin', {
        url: '/zuhause'
      });

      $stateProvider.state('login.backend', {
        url: '/admin',
        data: {
          redirects: {
            ROLE_ADMIN: 'backend',
            ROLE_SUPER_ADMIN: 'backend'
          }
        },
        controller: 'LoginBackendController',
        controllerAs: 'loginBackendController'
      });

      $urlRouterProvider.otherwise('/');
    }
  ]);

  //
  // RUN
  //
  app.run(['$injector', function($injector) {
      var $transitions = $injector.get('$transitions');
      var $rootScope = $injector.get('$rootScope');
      var appState = $injector.get('appState');
      var $state = $injector.get('$state');
      var auth = $injector.get('auth');
      var user = auth.getUser();

      var onStart = function(transition) {
        appState.routerBusy = true;

        var state = transition.to();
        var data = state.data || {};
        var role = data.role || null;
        var redirects = data.redirects || {};

        // no authentication check for states
        // without any authorization settings
        if (role === null) {

          // try to redirect authenticated users
          // with auth roles to configured route
          if (user === null) {
            return true;
          }

          var roles = user.roles || [];
          for (role in redirects) {
            if (roles.indexOf(role)>=0) {
              var target = redirects[role];
              return $state.target(target);
            }
          }

          return true;
        }

        // assert role an array for callbacks
        if (!angular.isArray(role)) {
          role = [role];
        }

        var successCallback = function()
          {
            return true;
          };

        var failureCallback = function()
          {
            // redirect to login page depending on
            // given role with unsufficient rights
            // or possibly failed refresh process!
            switch(role[0])
            {
              case 'ROLE_ADMIN':
              case 'ROLE_SUPER_ADMIN':
                return $state.target('login.backend');
              default:
                return $state.target('login.frontend');
            }
          };

        return auth.hasRole(role).then(
          successCallback,
          failureCallback
        );
      };

      var onError = function(/*transition*/) {
        appState.routerBusy = false;

        // no initial user before transition
        if (user === null) {
          return;
        }

        // get initial user's role and see if
        // there was an invalidation ($http)!
        var role = user.roles[0];
        user = auth.getUser();
        if (user !== null) {
          return;
        }

        // user's jwt was destroyed, redirect
        // user according to its initial role
        switch(role)
        {
          case 'ROLE_ADMIN':
          case 'ROLE_SUPER_ADMIN':
            $state.go('login.backend');
            break;
          default:
            $state.go('login.frontend');
        }
      };

      var onSuccess = function(transition) {
        $rootScope.state = transition.to();
        appState.routerBusy = false;
      };

      $rootScope.$watch(
        function() {
          return appState.isBusy();
        },
        function(isBusy) {
          $rootScope.isBusy = isBusy;
          $rootScope.httpBusy = appState.httpBusy;
          $rootScope.routerBusy = appState.routerBusy;
        }
      );

      $transitions.onError({}, onError);
      $transitions.onStart({}, onStart);
      $transitions.onSuccess({}, onSuccess);
    }
  ]);

  //
  // EXPOSE
  //
  global.ANGULAR_MODULE = module;

})(window, angular);
