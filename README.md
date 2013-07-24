Hypercube data viewer
=====================

Javascript widget to display multidimensional data in scrollable format.  Features:

* shows 2 dimensions as scrollable table (with scrollbars)
* shows other dimensions as sliders
* upon scrollbar/slider adjustment, data is fetched from the backend and table repopulated
* events are issued once data is fetched (to tie in with other visualisation mechanisms)
* data can be cached on the dimension boundary margins, to minimize server traffic
* integration with top visualization tools provided
* plugins for ajax, jsonp, websockets

Future work:

* Rserve integration
    * Chef recipe for install of R, Rserve, pyRserve
    * instantionation of Rserve as a daemon
* intermediate HDF5 storage of R results (HDF5/pytables/?)
