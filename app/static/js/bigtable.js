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

function assertEquals(v1, v2, msg) {
    if (v1 != v2) {
        var fullMsg = msg + ', vals: [' + v1 + ', ' + v2 + ']';
        console.log(fullMsg);
        throw fullMsg;
    }
}

function DimHelper(isCol, dim) {
    this.inds = function() {
        return {
            min: Math.max(0, dim.currInd-dim.buffer),
            max: Math.min(cnt, dim.currInd+dim.visible+dim.buffer)
        };
    };
    
    // getter/setter
    this.currInd = function(val) {
        if (val === undefined) return dim.currInd;
        else {
            dim.currInd = val;
            // used for initializing
            dataOffset = (dim.currInd-dim.buffer)*size;
        }
    };

    this.scrollTo = function(val) {
        this.currInd(Math.round(val/size));
    };

    this.scrollPos = function() {
        return dim.currInd*size;
    };

    this.dataOffset = function() {
        return dataOffset;
    };

    this.page = function() {
        var actualStart = Math.max(0, dim.currInd-dim.buffer);
        var dataStart   = Math.max(0, dim.buffer-dim.currInd);
        var actualEnd = Math.min(dim.cnt-1, dim.currInd+dim.visible+dim.buffer-1);
        var dataEnd = dataStart + (actualEnd-actualStart);
        return { actualStart: actualStart, dataStart: dataStart, actualEnd: actualEnd, dataEnd: dataEnd, currInd: dim.currInd }
    };

    this.dataIndsCnt = function() {
        return dim.buffer+dim.visible+dim.buffer;
    };

    this.dataSize = function() {
        return (dim.buffer+dim.visible+dim.buffer) * size;
    };

    this.canvasSize = function() {
        return dim.cnt * size;
    };

    this.shouldFetch = function() {
        if (prevInd === undefined ||
            (dim.buffer+dim.visible < dim.cnt && Math.abs(prevInd-dim.currInd) > dim.scrollTrigger)) {
            prevInd = dim.currInd;
            return true;
        } else {
            return false;
        }
    };

    // initialize
    var dataOffset, prevInd;
    var size = isCol ? dim.w : dim.h;
    var name = isCol ? 'col' : 'row';  // for debugging
    this.currInd(dim.currInd);
} 


(function($) {
    $.fn.bigtable = function(config) {
        var $this = this;

        // initialize main object
        var config = $.extend({
            refreshRate: 100,

            // dummy content generator
            colFetch: function(min, max) {
                return _.map(_.range(min, max+1), function(i) { return 'c' + i; });
            },
            
            rowFetch: function(min, max) {
                return _.map(_.range(min, max+1), function(i) { return 'r' + i; });
            },
            
            contentFetch: function(colMin, colMax, rowMin, rowMax, callback) {
                var cols = _.map(_.range(colMin, colMax+1), function(i) { return 'c' + i; });
                var rows = _.map(_.range(rowMin, rowMax+1), function(i) { return 'r' + i; });
                var vals = _.map(rows, function(r) {
                    return _.map(cols, function(c) {
                        return r + c;
                    });
                });

                callback(vals);
            },

            // means of controlling header/cell look and feel
            populateColHdr: function(hdrDiv, val, ind) { hdrDiv.innerHTML = val; },
            populateRowHdr: function(hdrDiv, val, ind) { hdrDiv.innerHTML = val; },
            fixCellRow:     function(cellRow, ind) {},
            populateCell:   function(cell, val, xInd, yInd) { cell.innerHTML = val; }
        }, config);
        // initialize individual dims
        config.col = $.extend({ currInd: 0, cnt: 10, visible: 5, buffer: 4, scrollTrigger: 2, w: 100, h: 30 }, config.col);
        config.row = $.extend({ currInd: 0, cnt: 6,  visible: 4, buffer: 4, scrollTrigger: 2, w: 150, h: 30 }, config.row);

        // populate Layer 1 elements
        var scrollbarDims = {
            w: config.row.visible < config.row.cnt ? 16 : 0,
            h: config.col.visible < config.col.cnt ? 16 : 0
        };
        var colDim = new DimHelper(true,  config.col);
        var rowDim = new DimHelper(false, config.row);
        var colHdrDim = new DimHelper(true,  config.col);
        var rowHdrDim = new DimHelper(false, config.row);

        var cntDims     = { w: config.col.visible*config.col.w + scrollbarDims.w, h: config.row.visible*config.row.h + scrollbarDims.h };
        var fillerDims  = { w: config.row.w, h: config.col.h };
        var colHdrDims  = { w: config.col.visible*config.col.w, h: config.col.h };
        var rowHdrDims  = { w: config.row.w, h: config.row.visible*config.row.h };
        var cellRowDims = { w: colDim.dataSize(), h: config.row.h };
        var cellDims    = { w: config.col.w, h: config.row.h };

        var colHdrTemplate = '<div class="bdt_colhdr_wrapper" style="width: <%= col.w %>px; height: <%= col.h %>px; overflow: hidden; float: left;"><div id="<%= id %>" class="bdt_colhdr"></div></div>';
        var rowHdrTemplate = '<div class="bdt_rowhdr_wrapper" style="width: <%= row.w %>px; height: <%= row.h %>px; overflow: hidden;"><div id="<%= id %>" class="bdt_rowhdr"></div></div>';
        var cellRowTemplate = '<div id="<%= id %>" class="bdt_cnt_row" style="width: <%= cellRowDims.w %>px; height: <%= cellRowDims.h %>px;"><%= cells %></div>';
        var cellTemplate = '<div class="bdt_cnt_cell_wrapper" style="width: <%= cellDims.w %>px; height: <%= cellDims.h %>px; overflow: hidden; float: left;"><div id="<%= id %>" class="bdt_cnt_cell"></div></div>';

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
                                            return _.template(cellTemplate, { id: 'cell_r'+r+'_c'+c, cellDims: cellDims})
                                        }
                                    ).join('');
                                    return _.template(cellRowTemplate, { id: 'cellr'+r, cellRowDims: cellRowDims, cells: cells });
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

        // cache for elements used later on
        var cache = {
            colHdrs: $.makeArray($this.find('.bdt_colhdrs_data .bdt_colhdr')),  // list of header divs
            rowHdrs: $.makeArray($this.find('.bdt_rowhdrs_data .bdt_rowhdr')),  // list of header divs
            cntRows: _.map($this.find('.bdt_cnt_data .bdt_cnt_row'), function(r) { return [r, $.makeArray($(r).find('.bdt_cnt_cell'))]; }),      // list of content [row_div, [row_cell]]

            colhdrsDataDiv: $this.find('.bdt_colhdrs_data'),
            rowhdrsDataDiv: $this.find('.bdt_rowhdrs_data'),
            cntDataDiv:  $this.find('.bdt_cnt_data'),

            colHdrsDiv: $this.find('.bdt_colhdrs'),
            rowHdrsDiv: $this.find('.bdt_rowhdrs'),

            cntDiv: $this.find('.bdt_cnt')
        };

        function scrolled(x, y) {
            colHdrDim.scrollTo(x);
            rowHdrDim.scrollTo(y);

            if (colHdrDim.shouldFetch()) {
                var colPage = colHdrDim.page();
                var colOffset = colHdrDim.dataOffset();
                var cols = config.colFetch(colPage.actualStart, colPage.actualEnd);
                assertEquals(cols.length, colPage.actualEnd-colPage.actualStart+1, "Col cnt doesn't match");
                cache.colHdrs.slice(colPage.dataStart, colPage.dataEnd+1).forEach(function(colHdr, i) { config.populateColHdr(colHdr, cols[i], i); });
                cache.colhdrsDataDiv.css({left: colOffset});
            }
            cache.colHdrsDiv.scrollLeft(x);

            if (rowHdrDim.shouldFetch()) {
                var rowPage = rowHdrDim.page();
                var rowOffset = rowHdrDim.dataOffset();
                var rows = config.rowFetch(rowPage.actualStart, rowPage.actualEnd);
                assertEquals(rows.length, rowPage.actualEnd-rowPage.actualStart+1, "Row cnt doesn't match");
                cache.rowHdrs.slice(rowPage.dataStart, rowPage.dataEnd+1).forEach(function(rowHdr, i) { config.populateRowHdr(rowHdr, rows[i], i); });
                cache.rowhdrsDataDiv.css({top: rowOffset});
            }
            cache.rowHdrsDiv.scrollTop(y);

            $this.trigger('scroll_cont', [x, y]);
        }

        function stoppedScrolling(x, y) {
            enable(false);
            $this.trigger('scroll_stop', [x, y]);
            colDim.scrollTo(x);
            rowDim.scrollTo(y);
            var colPage = colDim.page();
            var rowPage = rowDim.page();
            var colOffset = colDim.dataOffset();
            var rowOffset = rowDim.dataOffset();
            // console.log('stopped scrolling colPage.currInd: '+colPage.currInd+', rowPage.currInd:'+rowPage.currInd);

            var shouldFetchCol = colDim.shouldFetch(), shouldFetchRow = rowDim.shouldFetch();  // forcing execution on both dims - required

            if (shouldFetchCol || shouldFetchRow) {
                console.log('Fetching new content!');
                config.contentFetch(colPage.actualStart, colPage.actualEnd, rowPage.actualStart, rowPage.actualEnd, function(vals) {
                    // assert we got back required sizes:
                    assertEquals(vals.length, rowPage.actualEnd-rowPage.actualStart+1, "Val row cnt doesn't match");

                    // populate row/col header data
                    var rowI = rowPage.actualStart;

                    cache.cntRows.slice(rowPage.dataStart, rowPage.dataEnd+1).forEach(function(rowAndCell, y) {
                        var cellRow = rowAndCell[0];
                        var cells = rowAndCell[1];
                        assertEquals(vals[y].length, colPage.actualEnd-colPage.actualStart+1, "Val cell sizes doesn't match");
        
                        // add oddrow/everow class
                        var oddEven = (rowI++)%2 ? ['bdt_evenrow', 'bdt_oddrow'] : ['bdt_oddrow', 'bdt_evenrow'];
                        cellRow.classList.remove(oddEven[0]);
                        cellRow.classList.add(oddEven[1]);

                        cells.slice(colPage.dataStart, colPage.dataEnd+1).forEach(function(cell, x) {
                            config.populateCell(cell, vals[y][x], x, y);
                        });

                    });

                    // reposition 'data' divs
                    cache.cntDataDiv.css({left: colOffset, top: rowOffset});

                    // finished - enable
                    enable(true);
                    $this.trigger('populated', [vals]);
                });
            }
        }

        // private methods
        function enable(b) {
            // console.log('** enable: ' + b);
        };

        // initialize scrollpane
        // initalize data
        var orgX = colDim.scrollPos();
        var orgY = rowDim.scrollPos();
        scrolled(orgX, orgY);
        stoppedScrolling(orgX, orgY);
        cache.colHdrsDiv.scrollLeft(orgX);
        cache.rowHdrsDiv.scrollTop(orgY);

        cache.cntDiv.scrollpane({
            refreshRate: config.refreshRate,
            arrowButtonSpeedX: config.col.w,
            arrowButtonSpeedY: config.row.h,
            x: colDim.scrollPos(),
            y: rowDim.scrollPos(),
            scrollCallback: scrolled,
            scrollStopCallback: stoppedScrolling
        });

        return $this;

    }
})(jQuery);