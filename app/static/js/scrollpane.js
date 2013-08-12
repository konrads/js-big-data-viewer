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

        var prevScroll = { x: api.getContentPositionX(), y: api.getContentPositionY() };
        var prevScrollStop = $.extend({}, prevScroll);

        $this.scroll(function() {
            if (config.scrollCallback) {
                var now = { x: api.getContentPositionX(), y: api.getContentPositionY() };
                if (prevScroll.x != now.x || prevScroll.y != now.y) {
                    config.scrollCallback(now.x, now.y);
                    prevScroll = now;
                }
            }
            $.doTimeout( 'scroll', config.refreshRate, function() {
                if (config.scrollStopCallback) {
                    var now = { x: api.getContentPositionX(), y: api.getContentPositionY() };
                    if (prevScrollStop.x != now.x || prevScrollStop.y != now.y) {
                        config.scrollStopCallback(now.x, now.y);
                        prevScrollStop = now;
                    }
                }
            });
        });

        return $this;
    }
})(jQuery);
