(function($) {
    $.fn.scrollpane = function(config) {
        config = $.extend({
            scrollXStep: 10,
            scrollYStep: 100,
            scrollCallback: function(x, y) { console.log('scrolled x: ' + x + ', y: ' + y); }
        });

        var $this = this.scrollbar(config);
        $this.scroll(function(){
            $.doTimeout( 'scroll', 250, function(){
                var x = $this.scrollLeft();
                var y = $this.scrollTop();
                config.scrollCallback(x, y);
            });
        });
    }
})(jQuery);