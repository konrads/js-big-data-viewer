(function($) {
    $.fn.scrollpane = function(config) {
        config = $.extend({
            showArrows: true,
            arrowButtonSpeedX: 10,
            arrowButtonSpeedY: 100,
            refreshRate: 100,
            x: 0,
            y: 0,
            scrollCallback: function(x, y) { console.log('scroll x: ' + x + ', y: ' + y); },
            scrollStopCallback: function(x, y) { console.log('scroll stop x: ' + x + ', y: ' + y); }
        }, config);

        var $this = this.jScrollPane(config);
        var api = $this.data('jsp');

        if (config.x || config.y) api.scrollTo(config.x, config.y);

        $this.scroll(function() {
            if (config.scrollCallback)
                config.scrollCallback(api.getContentPositionX(), api.getContentPositionY());
            $.doTimeout( 'scroll', config.refreshRate, function() {
                if (config.scrollStopCallback)
                    config.scrollStopCallback(api.getContentPositionX(), api.getContentPositionY());
            });
        });

        return $this;
    }
})(jQuery);
