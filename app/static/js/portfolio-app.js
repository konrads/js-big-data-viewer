'use strict';

angular.module('portfolioApp', [])
    .config(function($interpolateProvider, $routeProvider, $httpProvider) { 
        $interpolateProvider.startSymbol('[['); 
        $interpolateProvider.endSymbol(']]');
    })
    .directive('bigtable',function() {
        return {
            restrict:'E',
            replace: true,
            template: '<div class="bigtable"></div>',
            scope: {
                contentFetch: '=',
                colCnt: '=',
                colVisible: '=',
                colBuffer: '=',
                colW: '=',
                colH: '=',
                rowCnt: '=',
                rowVisible: '=',
                rowBuffer: '=',
                rowW: '=',
                rowH: '='
            },
            link: function (scope, elm, attrs) {
                console.log('in directive, scope:');
                console.log(scope);

                elm.bigtable({
                    refreshRate: 200,
                    col: { currInd: 5, cnt: scope.colCnt, visible: scope.colVisible, buffer: scope.colBuffer, w: scope.colW, h: scope.colH },
                    row: { currInd: 2, cnt: scope.rowCnt, visible: scope.rowVisible, buffer: scope.rowBuffer, w: scope.rowW, h: scope.rowH },
                    contentFetch: scope.contentFetch})
                .on('scroll_stop', function(event, x, y) { console.log('scroll stop: x: ' + x + ', y: ' + y); })
            }
        };
    })
    .controller('PortfolioCtrl', function ($scope) {
        // callback for data fetching
        function dateToYMD(inMs) {
            var date = new Date(inMs);
            var d = date.getDate();
            var m = date.getMonth() + 1;
            var y = date.getFullYear();
            return '' + y + '-' + (m<=9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);
        }
        var dayDelta = 24*60*60*1000;
        $scope.symbolFetch = function(colMin, colMax, rowMin, rowMax, callback) {
            var startDate = dateToYMD(firstDate + colMin*dayDelta);
            var endDate = dateToYMD(firstDate + colMax*dayDelta);
            var symbols2 = symbols.slice(rowMin, rowMax+1);
            // FIXME: replace with angularjs ajax call
            $.ajax({
                url: 'api/symbols/' + symbols2.join(',') + '/start_date/' + startDate + '/end_date/' + endDate,
                dataType: 'json'
            })
            .done(function(resp) {
                callback(resp.cols, resp.rows, resp.vals);
            })
        };


        // hide/display functionality, to test rendering of invisible elems
        $scope.btnLabel = 'Show';
        $scope.tableShow = false;
        $scope.toggleBtn = function() {
            $scope.tableShow = $scope.tableShow ? false : true;
            $scope.btnLabel = $scope.tableShow ? 'Hide' : 'Show';
        };
    });