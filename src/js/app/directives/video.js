/* global ANGULAR_MODULE, angular */
(function(module, angular, global) {
  'use strict';

  // --------------------------------------------------
  // Video
  // --------------------------------------------------

  //
  // CONTROLLER
  //

  /**
   * @constructor
   */
  var Video = function($scope, $element, $attrs, $injector) {
    this.$scope = $scope;
    this.$attrs = $attrs;
    this.$element = $element;
    this.$injector = $injector;

    this._player = null;
    this._element = this.$element.find('.player');

    this._onReady = this._onReady.bind(this);
    this._onStateChange = this._onStateChange.bind(this);
  };

  Video.$inject = ['$scope', '$element', '$attrs', '$injector'];

  //
  // PROPERTIES
  //

  /** @var {number} width Width of player. */
  Video.prototype.width = 640;

  /** @var {number} height Height of player. */
  Video.prototype.height = 360;

  /** @var {string} videoId ID of the YouTube video. */
  Video.prototype.videoId = null;

  //
  // METHODS
  //

  /**
   * Waits for YOUTUBE_API_LOADED flag and initializes
   * player afterwards including all relevant events.
   *
   * @public
   * @method $onInit
   * @return {Void}
   */
  Video.prototype.$onInit = function()
    {
      var $timeout = this.$injector.get('$timeout');
      var $window = this.$injector.get('$window');

      var me = this;
      var _watchAPIExpression = function() {
        // frame should be visible to make events
        // work with frame's postMessage() message
        // YOUTUBE_API_LOADED is a global constant
        // set in index.html right before api load
        var isVisible = me._element.is(':visible');
        var isLoaded = $window.YOUTUBE_API_LOADED;

        return (isVisible && isLoaded);
      };

      var _watchAPICallback = function(isReady) {
        if (isReady) {

          me._unwatchAPI();
          $timeout(me._onReady, 100);
        }
      };

      this._unwatchAPI = this.$scope.$watch(
        _watchAPIExpression,
        _watchAPICallback
      );
    };

  /**
   * Removes event listener and watches.
   *
   * @public
   * @method $onDestroy
   * @return {void}
   */
  Video.prototype.$onDestroy = function() {
    if (this._player) {
      this._player.destroy();
    }
  };

  /**
   * Provides `padding-bottom` with correct
   * aspect ratio for a responsive viewport.
   *
   * @public
   * @method $onDestroy
   * @return {void}
   */
  Video.prototype.getStyle = function() {
    return {
      'padding-bottom': (
        this.height /
        this.width *
        100
      ) + '%',
    };
  };

  /**
   * Invoked by YouTube API when player's ready.
   *
   * @private
   * @method _onReady
   * @return {Void}
   */
  Video.prototype._onReady = function()
    {
      var element = this._element.get(0);

      this._player = new YT.Player(
        element,
        {
          width: this.width,
          height: this.height,
          videoId: this.videoId,
          events: {
            'onStateChange': this._onStateChange
          }
      });
    };

  /**
   * Invoked by YouTube API when player's ready.
   *
   * @private
   * @method _onReady
   * @return {Void}
   */
  Video.prototype._onStateChange = function(event)
    {
      switch (event.data) {
        case YT.PlayerState.PLAYING:
          this.onPlaying();
          break;
        case YT.PlayerState.PAUSED:
          this.onPaused();
          break;
        case YT.PlayerState.ENDED:
          this.onEnded();
          break;
        case YT.PlayerState.CUED:
          this.onCued();
          break;
        default:
      }
    };

  //
  // REGISTRY
  //
  angular.module(module).directive('video', function(){
    return {
      scope: {
        videoId:'=videoId',
        width:'=?videoWidth',
        height:'=?videoHeight',
        onCued: '&videoOnCued',
        onEnded: '&videoOnEnded',
        onPaused: '&videoOnPaused',
        onPlaying: '&videoOnPlaying',
        onBuffering: '&videoOnBuffering'
      },
      restrict: 'A',
      transclude: true,
      controller: Video,
      bindToController: true,
      controllerAs: 'videoController',
      templateUrl: 'views/directives/video.html'
    };
  });

})(ANGULAR_MODULE, angular, this);
