(function($) {
    $.fn.scrollbar = function(config) {
       var $this = this;
       var barHeight = $.scrollbarSize();
      
       config = $.extend({
           label: 'Dim X',
           vals:  $.map([0,1,2,3,4,5,6,7,8,9,10], function(x) {return 'x'+x;}),
           initVal: 'x7',
           labelWidth: 50,
           delayInitScroll: false,    // needed in GWT, which mangles up DOM building/event firing order
           scrollCallback: function (val, ind) { console.log('scrolled to val ' + val + '@' + ind); }
       }, config);

       var contents = '<div class="label-container" style="font: 12px Verdana,Geneva,Arial,Helvetica,sans-serif; float: left;">' +
           '<label class="label" style="font-weight: bold; padding: 0px 10px; float: left; text-align: right; ">' + config.label + ' : </label><br/>' +
           '<label class="value" style="padding: 0px 10px; float: left; "></label></div>' +
           '<div class="bar" style="overflow: scroll; float: left; padding: 5px 0px;"><div class="bar-content"></div</div>';
      
       $this.append(contents);
       var barWidth = $this.width() - config.labelWidth;
       var actualWidth = barWidth * config.vals.length;
       var step = actualWidth / config.vals.length;
       console.log('config.labelWidth: ' + config.labelWidth);
       console.log('barWidth: ' + barWidth);
       console.log('actualWidth: ' + actualWidth);
       console.log('step: ' + step);
      
       $this.css('visibility', 'hidden');
       $('div.label-container', $this).width(config.labelWidth).height(barHeight).attr('id', 'label_' + config.label + '_container');
       $('label.label', $this).attr('id', 'label_' + config.label);
       $('label.value', $this).attr('id', 'value_' + config.label);
       var barDiv = $('div.bar', $this).width(barWidth).height(barHeight).attr('id', 'bar_' + config.label);
      
       barDiv.find('div.bar-content').width(actualWidth).height(barHeight);
      
       var initValInd = Math.max(0, config.vals.indexOf(config.initVal));

       // display initial value
       $('label.value', $this).text(config.vals[initValInd]);
      
       barDiv.safe_scroll({
           x: step * initValInd,
           delayInitScroll: config.delayInitScroll,
           scroll: function(ui) {
               var ind = Math.round(ui.target.scrollLeft / step);
               var val = config.vals[ind];
               $('label.value', $this).text(val).css({'font-weight': 'bold', color: 'red'});
           },
           scrollStop: function(ui) {
               var ind = Math.round(ui.target.scrollLeft / step);
               var val = config.vals[ind];
               $('label.value', $this).css({'font-weight': 'normal', color: 'black'});
               if (config.scrollCallback) config.scrollCallback(val, ind);
           }
       });
      
       // show once initialized
       $this.css('visibility', 'visible')
      
       $this.scrollToVal = function(val) {
           var ind = config.vals.indexOf(val);
           barDiv.scrollLeft(ind * step);
       };

       return $this;
    };
})(jQuery);