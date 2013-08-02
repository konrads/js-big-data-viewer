/*
Design:
Layer 1:
+---------+-----------------------+
| filler  |   column headers      |
+---------+-----------------------++
|         |                        |
|  row    |                        |
|         |       content          |
| headers |                        |
|         |                        |
|         |                        |
+---------+                        |    -
          +------------------------+    - room for optional scrollbar

                                  ||
                    room for optional scrollbar

Column headers, row headers and content are all scrollable.  The structure (based on content)
looks like:

Layer 2:
+-----------------------------------------------------
| content_canvas                                      
|                                                     
|   +----------------------------------------+        
|   | content_data                           |        
|   |    +-----------------------------+     |        
|   |    |  content (view)             |     |        
|   |    |                             |     |        
|   |    |                             |     |        
|   |    |                             |     |        
|   |    +-----------------------------+     |        
|   |                                        |        
|   +----------------------------------------+        
|                                                     
|                                                     
|                                                     

- content (view) shows portion of the content_canvas in a scrollable way
- content_canvas represents the entire table.  Due to browser performance/memory restraints,
  I only populate portion of the canvas - content_data
- content_data is a predefined grid, floating on top of the canvas.  If a scrollbar moves,
  data is repopulated and repositioned to match the view.  Data is larger than content so that
  scrolling gives impression of continuous data being present (whilst we repopulate & reposition data)


content_data structure:
+--------------------+--------------------+--------------------+---
|  id="cell_0_0"     |  id="cell_1_0"     |   id="cell_2_0"    |
+--------------------+--------------------+--------------------+---
|  id="cell_0_1"     |  id="cell_1_1"     |   id="cell_2_1"    |
+--------------------+--------------------+--------------------+---

*/


function ScrollableDim(
        currInd,          // starting index of visible area
        cnt,              // number of all values
        visible,          // number of values displayable at any moment
        buffer,           // buffer used for prefetching data.  Fetch set = buffer + visible area + buffer
        size) {           // size in pixels
    
    var dataOffset = (currInd-buffer)*size;

    this.fetchSetInds = function() {
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
            dataOffset = (currInd-buffer)*size;
        }
    };

    // getter/setter
    this.dataOffset = function(val) {
        // console.log('val:' + val + ', dataOffset: ' + dataOffset + ', buffer: ' + buffer + ', visible: ' + visible + ', size: ' + size);
        if (val == undefined) return dataOffset;
        else {
            currInd = Math.floor(size/val) - buffer;
            dataOffset = val;
        }
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
        config = $.extend(config, {
            col: { currInd: 0, cnt: 10, visible: 5, buffer: 1, w: 100, h: 50 },
            row: { currInd: 0, cnt: 4,  visible: 2, buffer: 1, w: 150, h: 50 },

            // dummy content generator
            contentFetcher: function(col, row, colCnt, rowCnt) {
                var buffer = 5;
                var colRange = { min: col-config.col.buffer, max: col+colCnt+config.col.buffer };
                var rowRange = { min: row-config.row.buffer, max: row+rowCnt+config.row.buffer };

                var cols = _.map(_.range(colRange.min, colRange.max), function(c) { return 'c' + c; });
                var rows = _.map(_.range(rowRange.min, rowRange.max), function(r) { return 'r' + r; });
                values: _.map(rows, function(r) {
                    return _.map(cols, function(c) {
                        return r + c;
                    });
                })

                return {
                    colRange: colRange,
                    rowRange: rowRange,
                    cols: cols,
                    rows: rows,
                    values: values
                };
            }
        });

        var $this = this;
        // populate Layer 1 elements
        var scrollbarDims = {
            w: config.col.visible < config.col.cnt ? 16 : 0,
            h: config.row.visible < config.row.cnt ? 16 : 0
        };
        var cntDims = { w: config.col.visible*config.col.w + scrollbarDims.w, h: config.row.visible*config.row.h + scrollbarDims.h };
        var fillerDims = { w: config.row.w, h: config.col.h };
        var colHdrDims = { w: config.col.visible*config.col.w, h: config.col.h };
        var rowHdrDims = { w: config.row.w, h: config.row.visible*config.row.h };

        var wDim = new ScrollableDim(config.col.currInd, config.col.cnt, config.col.visible, config.col.buffer, config.col.w);
        var hDim = new ScrollableDim(config.row.currInd, config.row.cnt, config.row.visible, config.row.buffer, config.row.h);

        var allTemplate = 
            '<div class="bdt_filler_and_col_headers" style="width: <%= colHdrDims.w+fillerDims.w %>px; height: <%= colHdrDims.h %>px;">' +
                '<div class="bdt_filler" style="width: <%= fillerDims.w %>px; height: <%= fillerDims.h %>px; float:left;"></div>'+
                '<div class="bdt_col_headers" style="width: <%= colHdrDims.w %>px; height: <%= colHdrDims.h %>px; overflow: hidden; flow:left;"></div>'+
            '</div>'+
            '<div class="bdt_row_headers_and_content" style="width: <%= rowHdrDims.w+cntDims.w %>px; height: <%= cntDims.h %>px;">' +
                '<div class="bdt_row_headers" style="width: <%= rowHdrDims.w %>px; height: <%= rowHdrDims.h %>px; float:left; overflow: hidden;"></div>' +
                '<div class="bdt_content content scroll-standard" style="width: <%= cntDims.w %>px; height: <%= cntDims.h %>px; float:left;">' +
                    '<div class="bdt_content_canvas resizable" style="width:  <%= wDim.canvasSize() %>px; height:  <%= hDim.dataSize() %>px;">' +
                        '<div class="bdt_content_data" style="position: relative; top: <%= hDim.dataOffset() %>px; left: <%= wDim.dataOffset() %>px; width: <%= wDim.dataSize() %>px; height: <%= hDim.dataSize() %>px;">' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';

        $this.width(fillerDims.w + colHdrDims.w + scrollbarDims.w);
        $this.height(fillerDims.h + rowHdrDims.h + scrollbarDims.h);

        var rendered = _.template(allTemplate, { cntDims: cntDims, colHdrDims: colHdrDims, rowHdrDims: rowHdrDims, fillerDims: fillerDims, wDim: wDim, hDim: hDim });
        $this.append(rendered);
        var scrollpane = $this.find('.bdt_content').scrollpane2();
        console.log($this.find('.bdt_content'));

        // populate Layer 2 elements
        var rowTemplate = '<div class="bdt_row_<%= row => row_<%= odd_even =>"><div>';
        var colTemplate = '<div class';
        var contentTemplate = '';

    }
})(jQuery);