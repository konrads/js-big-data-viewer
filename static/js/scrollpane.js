(function($) {
    $.fn.scrollpane = function(config) {
        config = $.extend({
            showArrows: true,
            arrowButtonSpeedX: 10,
            arrowButtonSpeedY: 100,
            scrollCallback: function(x, y) { console.log('scroll x: ' + x + ', y: ' + y); },
            scrollStopCallback: function(x, y) { console.log('scroll stop x: ' + x + ', y: ' + y); }
        });

        var $this = this.jScrollPane(config);
        var api = $this.data('jsp');

        $this.scroll(function() {
            if (config.scrollCallback)
                config.scrollCallback(api.getContentPositionX(), api.getContentPositionY());
            $.doTimeout( 'scroll', 300, function() {
                if (config.scrollStopCallback)
                    config.scrollStopCallback(api.getContentPositionX(), api.getContentPositionY());
            });
        });
    }
})(jQuery);
