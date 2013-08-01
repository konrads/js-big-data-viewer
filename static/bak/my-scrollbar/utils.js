(function($) {
    /* Means of achieving the width of the scrollbar: create a hidden div and calculate it's scrollbar dim */
    var scrollbarSize;
    $.scrollbarSize = function() {
       if (scrollbarSize === undefined) {
           var div = $('<div style="width:50px;height:50px;overflow:hidden;position:absolute;top:-200px;left:-200px;"><div style="height:100px;"></div>');
           // Append our div, do our calculation and then remove it
           $('body').append(div);
           var w1 = $('div', div).innerWidth();
           div.css('overflow-y', 'scroll');
           var w2 = $('div', div).innerWidth();
           $(div).remove();
           scrollbarSize = w1 - w2;
           console.log('w1: '+ w1 + ', w2: '+ w2);
       }
       console.log('scrollbarSize: ' + scrollbarSize);
       return scrollbarSize;
    };
   
    $.callstack = function(message) {
       try {
           throw new Error(message);
       } catch (e) {
           var callstack = e.message + ', callstack:\n';
           var lines = e.stack.split('\n');
           for (var i=1, len=lines.length; i<len; i++) callstack += '\t' + lines[i] + '\n';
           return callstack;
       }
    };
   
    $.fn.safe_scroll = function(config) {
       var $this = this;
       // require memory of following to prevent callbacks on display: none -> display: visible (occurs during GWT tab changes)
       var currX, currY; 
       var currStopX, currStopY;

       config = $.extend({
           x: 0,
           y: 0,
           delayInitScroll: false,
           scroll: function(ui) {},
           scrollStop: function(ui) {}
       }, config);
       currX = currStopX = config.x;
       currY = currStopY = config.y;
      
       var overallScroll = (function() {
           var timer;
           return function(ui) {
               if (config.scroll && (currX!==ui.target.scrollLeft || currY!==ui.target.scrollTop)) {
                   config.scroll(ui);
                   currX = ui.target.scrollLeft;
                   currY = ui.target.scrollTop;
               }
              
               // setup scrollstop
               if (config.scrollStop) {
                   if (timer) clearTimeout(timer);
                   timer = setTimeout(function() {
                       if (currStopX!==ui.target.scrollLeft || currStopY!==ui.target.scrollTop) {
                           config.scrollStop(ui);
                           currStopX = ui.target.scrollLeft;
                           currStopY = ui.target.scrollTop;
                       }
                   }, 300);
               }
           }
       }());
      
       if (config.x===0 && config.y===0) {
           // no scrolling
           $this.scroll(overallScroll);
       } else {
           // setup up once off scrollback
           $this.scroll(function() {
               $this.unbind('scroll').scroll(overallScroll);
               return true;
           });
           // trigger scrolling
           var initScrollF = function() { $this.scrollLeft(config.x).scrollTop(config.y); };
           if (config.delayInitScroll) setTimeout(initScrollF, 1)
           else initScrollF();
       }
    }
})(jQuery);