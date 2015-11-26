Widgets for big data, displayed in tabular format
=================================================

Comprises JS source (utilizing jQuery and integrated with angularjs), as well as
a simple Python Flask server to show of client-server interactions.

Widgets:

Scroll pane
-----------
Extension to jQuery scrollpane, integrates 'scroll-stop' event, can do initial scroll at load time (trigering no events).


Big table
---------
* shows 2 dimensions as scrollable table (with scrollbars)
* upon scrollbar/slider adjustment, data is fetched from the backend and table repopulated
* events are issued once data is fetched (to tie in with other visualisation mechanisms)
* data can be cached on the dimension boundary margins, to minimize server traffic
* integration with angularjs
* plugins for ajax, potentially for the future: jsonp, websockets


To run
------
```bash
> mkvirtualenv js-big-data-viewer
> pip install -r requirements.txt
> cd app
> python flaskserver.py
> open http://localhost:5000/portfolio
```


Hypercube
---------
UNIMPLEMENTED:
Big table with additional dimensions (shown as sliders)


Future work
-----------
* Rserve integration
    * Chef recipe for install of R, Rserve, pyRserve
    * instantionation of Rserve as a daemon
* intermediate HDF5 storage of R results (HDF5/pytables/?)
