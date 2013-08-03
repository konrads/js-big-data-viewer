/*
Design:
Layer 1:
+---------+-----------------------+
| filler  |   column headers      |
+---------+-----------------------++
|         |                        |
|  row    |                        |
|         |       cnt          |
| headers |                        |
|         |                        |
|         |                        |
+---------+                        |    -
          +------------------------+    - room for optional scrollbar

                                  ||
                    room for optional scrollbar

Column headers, row headers and cnt are all scrollable.  The structure (based on cnt)
looks like:

Layer 2:
+-----------------------------------------------------
| cnt_canvas                                      
|                                                     
|   +----------------------------------------+        
|   | cnt_data                           |        
|   |    +-----------------------------+     |        
|   |    |  cnt (view)             |     |        
|   |    |                             |     |        
|   |    |                             |     |        
|   |    |                             |     |        
|   |    +-----------------------------+     |        
|   |                                        |        
|   +----------------------------------------+        
|                                                     
|                                                     
|                                                     

- cnt (view) shows portion of the cnt_canvas in a scrollable way
- cnt_canvas represents the entire table.  Due to browser performance/memory restraints,
  I only populate portion of the canvas - cnt_data
- cnt_data is a predefined grid, floating on top of the canvas.  If a scrollbar moves,
  data is repopulated and repositioned to match the view.  Data is larger than cnt so that
  scrolling gives impression of continuous data being present (whilst we repopulate & reposition data)


cnt_data structure:
+--------------------+--------------------+--------------------+---
|  id="cell_0_0"     |  id="cell_1_0"     |   id="cell_2_0"    |
+--------------------+--------------------+--------------------+---
|  id="cell_0_1"     |  id="cell_1_1"     |   id="cell_2_1"    |
+--------------------+--------------------+--------------------+---



custom events propagated out:

*/

function DimHelper(
        currInd,          // starting index of visible area
        cnt,              // number of all values
        visible,          // number of values displayable at any moment
        buffer,           // buffer used for prefetching data.  Fetch set = buffer + visible area + buffer
        size) {           // size in pixels
    
    var dataOffset = (currInd-buffer)*size;

    this.inds = function() {
        return {
            min: Math.max(0, currInd-buffer),
            max: Math.min(cnt, currInd+visible+buffer)
        };
    };
    
    // getter/setter
    this.currInd = function(val) {
        if (val === undefined) return currInd;
        else {
            currInd = val;
            // used for initializing
            dataOffset = (currInd-buffer)*size;
        }
    };

    this.pageStart = function(val) {
        if (val === undefined) return currInd - buffer;
        else {
            currInd = val + buffer;
            // NOTE: not setting dataOffset, should be set already by scrolling...
        }
    };

    this.pageEnd = function() {
        return buffer + currInd + visible + buffer;
    };


    // getter/setter
    this.dataOffset = function(val) {
        if (val == undefined) return dataOffset;
        else {
            currInd = Math.floor(val/size) - buffer;
            dataOffset = val;
        }
    };

    this.dataIndsCnt = function() {
        return buffer+visible+buffer;
    };

    this.dataSize = function() {
        return (buffer+visible+buffer) * size;
    };

    this.canvasSize = function() {
        return cnt * size;
    };
} 



(function($) {
    $.fn.bigtable = function(config) {
        var $this = this;

        var config = $.extend(config, {
            col: { currInd: 0, cnt: 10, visible: 5, buffer: 1, w: 100, h: 50 },
            row: { currInd: 0, cnt: 6,  visible: 4, buffer: 1, w: 150, h: 50 },

            // dummy content generator
            contentFetch: function(colMin, colMax, rowMin, rowMax, callback) {
                var cols = _.map(_.range(colMin, colMax+1), function(c) { return 'c' + c; });
                var rows = _.map(_.range(rowMin, rowMax+1), function(r) { return 'r' + r; });
                var vals =  _.map(rows, function(r) {
                    return _.map(cols, function(c) {
                        return r + c;
                    });
                });

                callback(cols, rows, vals);
            }
        });

        // populate Layer 1 elements
        var scrollbarDims = {
            w: config.row.visible < config.row.cnt ? 16 : 0,
            h: config.col.visible < config.col.cnt ? 16 : 0
        };
        var cntDims = { w: config.col.visible*config.col.w + scrollbarDims.w, h: config.row.visible*config.row.h + scrollbarDims.h };
        var fillerDims = { w: config.row.w, h: config.col.h };
        var colHdrDims = { w: config.col.visible*config.col.w, h: config.col.h };
        var rowHdrDims = { w: config.row.w, h: config.row.visible*config.row.h };

        var colDim = new DimHelper(config.col.currInd, config.col.cnt, config.col.visible, config.col.buffer, config.col.w);
        var rowDim = new DimHelper(config.row.currInd, config.row.cnt, config.row.visible, config.row.buffer, config.row.h);

        var colHdrTemplate = '<div id="<%= id %>" class="bdt_colhdr" style="width: <%= col.w %>px; height: <%= col.h %>px; float: left;"></div>';
        var rowHdrTemplate = '<div id="<%= id %>" class="bdt_rowhdr" style="width: <%= row.w %>px; height: <%= row.h %>px;"></div>';
        var cellRowTemplate = '<div id="<%= id %>" class="bdt_cnt_row"><%= cells %></div>';
        var cellTemplate = '<div id="<%= id %>" class="bdt_cnt_cell" style="width: <%= cell.w %>px; height: <%= cell.h %>px; float: left;"></div>';

        var allTemplate = 
            '<div class="bdt_filler_and_colhdrs" style="width: <%= colHdrDims.w+fillerDims.w %>px; height: <%= colHdrDims.h %>px;">' +
                '<div class="bdt_filler" style="width: <%= fillerDims.w %>px; height: <%= fillerDims.h %>px; float:left;"></div>'+
                '<div class="bdt_colhdrs" style="width: <%= colHdrDims.w %>px; height: <%= colHdrDims.h %>px; overflow: hidden; flow:left;">' +
                    '<div class="bdt_colhdrs_canvas" style="width: <%= colDim.canvasSize() %>px; height: 100%">' +
                        '<div class="bdt_colhdrs_data" style="position: relative; left: <%= colDim.dataOffset() %>px; width: <%= colDim.dataSize() %>px; height: 100%;">' +
                            _.map(_.range(colDim.dataIndsCnt()), function(c) { return _.template(colHdrTemplate, { id: 'c'+c, col: config.col })}).join('') +
                        '</div>' +
                    '</div>' +
                '</div>'+
            '</div>'+
            '<div class="bdt_rowhdrs_and_cnt" style="width: <%= rowHdrDims.w+cntDims.w %>px; height: <%= cntDims.h %>px;">' +
                '<div class="bdt_rowhdrs" style="width: <%= rowHdrDims.w %>px; height: <%= rowHdrDims.h %>px; float:left; overflow: hidden;">' +
                    '<div class="bdt_rowhdrs_canvas" style="width: 100%; height: <%= rowDim.canvasSize() %>px">' +
                        '<div class="bdt_rowhdrs_data" style="position: relative; top: <%= rowDim.dataOffset() %>px; width: 100%; height: <%= rowDim.dataSize() %>px;">' +
                            _.map(_.range(rowDim.dataIndsCnt()), function(r) { return _.template(rowHdrTemplate, { id: 'r'+r, row: config.row })}).join('') +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="bdt_cnt" style="width: <%= cntDims.w %>px; height: <%= cntDims.h %>px; float:left;">' +
                    '<div class="bdt_cnt_canvas" style="width:  <%= colDim.canvasSize() %>px; height:  <%= rowDim.canvasSize() %>px; overflow: hidden;">' +
                        '<div class="bdt_cnt_data" style="position: relative; top: <%= rowDim.dataOffset() %>px; left: <%= colDim.dataOffset() %>px; width: <%= colDim.dataSize() %>px; height: <%= rowDim.dataSize() %>px;">' +
                            _.map(_.range(
                                rowDim.dataIndsCnt()),
                                function(r) {
                                    var cells = _.map(_.range(
                                        colDim.dataIndsCnt()),
                                        function(c) {
                                            return _.template(cellTemplate, { id: 'cell_r'+r+'_c'+c, cell: { w: config.col.w, h: config.row.h }})
                                        }
                                    ).join('');
                                    return _.template(cellRowTemplate, { id: 'cellr'+r, cells: cells });
                                }
                            ).join('') +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';

        $this.width (fillerDims.w + colHdrDims.w + scrollbarDims.w);
        $this.height(fillerDims.h + rowHdrDims.h + scrollbarDims.h);

        var rendered = _.template(allTemplate, { cntDims: cntDims, colHdrDims: colHdrDims, rowHdrDims: rowHdrDims, fillerDims: fillerDims, colDim: colDim, rowDim: rowDim });
        $this.append(rendered);

        $this.find('.bdt_cnt').scrollpane({
            arrowButtonSpeedX: config.col.w,
            arrowButtonSpeedY: config.row.h,
            scrollCallback: function(x, y) {
                // console.log('*** scroll x: ' + x + ', y: ' + y);
                colHdrs.scrollLeft(x);
                colDim.dataOffset(x);
                rowHdrs.scrollTop(y);
                rowDim.dataOffset(y);
                $this.trigger('scroll_cont', [x, y]);
            },
            scrollStopCallback: function(x, y) {
                // console.log('*** scroll STOP x: ' + x + ', y: ' + y);
                enable(false);
                $this.trigger('scroll_stop', [x, y]);
                var colMin = colDim.pageStart();
                var colMax = colDim.pageEnd();
                var rowMin = rowDim.pageStart();
                var rowMax = rowDim.pageEnd();
                var dataOffset = { w: 0, h: 0 };
                config.contentFetch(colMin, colMax, rowMin, rowMax, function(cols, rows, vals) {
                    // populate data
                    // adjust data positioning
                    // finished - enable
                    enable(true);
                    $this.trigger('populated', [cols, rows, vals]);
                });
            }
        });

        var colHdrs = $this.find('.bdt_colhdrs');
        var rowHdrs = $this.find('.bdt_rowhdrs');

        // private methods
        function enable(b) {
            console.log('** enable: ' + b);
        };

        return $this;

    }
})(jQuery);