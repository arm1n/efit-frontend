/* globals UIkit */
(function() {
  'use strict';

  UIkit.component('off-canvas-scroll', {

    defaults: {
      offset: 0,
      target: '',
      duration: 1000,
      transition: 'easeOutExpo'
    },

    props: {
      target: String,
      offset: Number,
      duration: Number,
      transition: String
    },

    computed: {
        offcanvas: function() {
          return UIkit.offcanvas(this.target);
        },

        $offcanvas: function() {
          return this.offcanvas && this.offcanvas.$el;
        }
    },

    init: function() {
      if (!this.target) {
        console.error('off-canvas-scroll: Required "target" option is not set.');
        return;
      }

      if (!this.offcanvas) {
        console.error('off-canvas-scroll: No offcanvas component found with id: ' + this.target);
        return;
      }
    },

    events: {
      click: function(event, data) {
        if (data && data.scroll) {
          return;
        }

        this.offcanvas.hide();
        this.$offcanvas.on('hidden', this._onHidden);
      }
    },

    methods: {

      _onHidden: function() {
        this.$offcanvas.off('hidden', this._onHidden);

        this._dummyScroll = UIkit.scroll(this.$el, {
          transition: this.transition,
          duration: this.duration,
          offset: this.offset
        });

        this.$el.on('scrolled', this._onScrolled);
        this.$el.trigger('click', { scroll: true });
      },

      _onScrolled: function() {
        this.$el.off('scrolled', this._onScrolled);
        this._dummyScroll.$destroy();
      }
    }
  });

})();
