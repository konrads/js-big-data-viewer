/*
Design:

+---------------------------------+
| Filler  |   Column headers      |
+---------+-----------------------++
|         |                        |
|  row    |                        |
|         |       content          |
| headers |                        |
|         |                        |
|         |                        |
+---------+                        |    - room for scrollbar
          +------------------------+

                                  |
                          room for scrollbar

*/


(function($) {
    $.fn.bigtable = function(config) {
        config = $.extend({
            col: { cnt: 100, visible: 10, w: 100, h: 50 },
            row: { cnt: 40,  visible:  5, w: 150, h: 50 },

            contentFetcher: function(col, row, colCnt, rowCnt) {
                var cols =  _.map(_.range(col, col+col.cnt), function(c) {
                    return 'c' + c;
                });
                var rows = _.map(_.range(row, row+row.cnt), function(r) {
                    return 'r' + r;
                });
                values: _.map(rows, function(r) {
                    return _.map(cols, function(c) {
                        return r + c;
                    });
                })

                return {
                    cols: cols,
                    rows: rows,
                    values: values
                };
            }
        });

        var $this = this;
        var scrollbarDims = {
            w: config.col.visible < config.col.cnt ? 17 : 0,
            h: config.row.visible < config.row.cnt ? 17 : 0
        };
        var contentDims = { w: config.col.visible*config.col.w + scrollbarDims.w, h: config.row.visible*config.row.h + scrollbarDims.h };
        var fillerDims = { w: config.row.w, h: config.col.h };
        var colHeadersDims = { w: config.col.visible*config.col.w, h: config.col.h };
        var rowHeadersDims = { w: config.row.w, h: config.row.visible*config.row.h };

        $this.width(fillerDims.w + colHeadersDims.w + scrollbarDims.w);
        $this.height(fillerDims.h + rowHeadersDims.h + scrollbarDims.h);

        var allTemplate = 
            '<div class="bdt_filler_and_col_headers" style="width: <%= colHeadersDims.w+fillerDims.w %>px; height: <%= colHeadersDims.h %>px;">' +
                '<div class="bdt_filler" style="width: <%= fillerDims.w %>px; height: <%= fillerDims.h %>px; float:left;"></div>'+
                '<div class="bdt_col_headers" style="width: <%= colHeadersDims.w %>px; height: <%= colHeadersDims.h %>px; overflow: hidden; flow:left;"></div>'+
            '</div>'+
            '<div class="bdt_row_headers_and_content" style="width: <%= rowHeadersDims.w+contentDims.w %>px; height: <%= colHeadersDims.h+contentDims.h %>px;">' +
                '<div class="bdt_row_headers" style="width: <%= rowHeadersDims.w %>px; height: <%= rowHeadersDims.h %>px; float:left; overflow: hidden;"></div>' +
                '<div class="bdt_content" style="width: <%= contentDims.w %>px; height: <%= contentDims.h %>px; float:left; overflow: hidden;">' +
                '</div>' +
            '</div>';
        var rowTemplate = '<div class="bdt_row_<%= row => row_<%= odd_even =>"><div>';
        var colTemplate = '<div class';
        var contentTemplate = '';
        var rendered = _.template(allTemplate, { contentDims: contentDims, colHeadersDims: colHeadersDims, rowHeadersDims: rowHeadersDims, fillerDims: fillerDims });
        var scrollpane = $this.find('bgt_content').scrollpane();

        $this.append(rendered);
    }
})(jQuery);