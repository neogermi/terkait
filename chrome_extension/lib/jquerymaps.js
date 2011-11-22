/**
 * jquery.googlemap v1.0.0
 *
 * Copyright David Hong 2009
 * http://davidhong.id.au/jquery/google/maps/
 *
 * Simplified Google Maps API integrated into jQuery
 *
 * Launched: <TBA>
 * Version: v1.0.0 (27/02/2009 15:59 AEDST)
 * 
 * SIMPLE USAGE:
 * 
 * $("google-map-canvas").googlemap({
 *     controls: false,
 *     labels: true,
 *     addresses: [
 *         "1 ABC St, NSW Australia",
 *         "2 XYZ St, NSW Australia"
 *     ]
 * });
 * 
 **/
  
(function($) {
    
    // fireEvent(opts, fn, self, arg)
    //     opts:    (json) jQuery options for this plugin
    //     fn:      (function) function to run
    //     self:    (object) this
    //     arg:     (object) argument to feed to function (fn)
    //
    // note: fn should always return true on successful runs, otherwise return
    //       false
    function fireEvent(opts, fn, self, arg) {        
        if ($.isFunction(fn)) { 
            try {  
                return fn.call(self, arg);
            } catch (error) {
                if (opts.debug) {
                    alert("Error calling googlemaps." + fn + ": " + error);
                } else {
                    throw error;    
                }
                return false;
            }                     
        }
        return true;            
    }
                
    var current = null;    
    
    function Googlemap(root, conf) {
        // current instance
        var self = this;
        if (!current) {
            current = self;
        }
        
        // internal variables
        var map;
        var geo;
        var bounds;
        var markers;
        //var index = 0;
        
        // configuration (comments show default values)
        var latitude    = conf.latitude;    // -35
        var longitude   = conf.longitude;   // 150
        var zoom        = conf.zoom;        // 4
        var controls    = conf.controls;    // true
        var labels      = conf.labels;      // true
        var html        = conf.html;        // null
        var anchor      = conf.anchor;      // null
        var addresses   = conf.addresses;   // null
        var debug       = conf.debug;       // false
        
        // methods
        $.extend(self, {
            // plugin specific
            getVersion: function() { return [1, 0, 0]; },
            getRoot: function() { return root; },
            
            // google maps specific
            getMap: function() { return map; },
            getGeo: function() { return geo; },
            getAddresses: function() { return addresses; },
            getBounds: function() { return bounds; },
            //getIndex: function() { return index; },
            getMarkers: function() { return markers; },
            
            // api
            isBrowserCompatible: function() {
                if ($.isFunction(GBrowserIsCompatible))
                    return GBrowserIsCompatible();
                
                return false;
            },
            initialise: function() {
                self.trace("initialising: " + this);
                if (self.isBrowserCompatible()) {
                    map         = map || new GMap2(document.getElementById($(root)[0].id));
                    geo         = geo || new GClientGeocoder();
                    bounds      = bounds || new GLatLngBounds();
                    markers     = markers || new Array();
                    
                    GEvent.addListener(map, "load", function() {
                        self.trace("google map loaded!");
                    });
                    
                    // set the map center
                    map.setCenter(new GLatLng(latitude, longitude), zoom);
                    
                    // mark addresses on the map
                    if (addresses) {
                        if (addresses.length > 0) {
                            var i = 0;
                            while (i < addresses.length) {
                                self.geocode(i++);
                            }
                        }
                    }
                    
                    // add controls
                    if (controls) {
                        map.addControl(new GSmallMapControl());
                        map.addControl(new GMapTypeControl());
                    }
                }
            },

            // geocode(index, address, html, anchor) :
            //     index:     (number) index of the marker (obsolete when label == false)
            //     address:   (string) human readable address to query
            //     html:      [array] what to display on marker's "click" event
            //     anchor:    [array] simulate marker's "click" event outside the map via a link
            geocode: function(index) {
                geo = (geo == null) ? new GClientGeocoder() : geo;
                if (addresses && index >= 0) {
                    self.trace("processing address: [" + addresses[i] + "] (" + index + ")");
                    markers = markers || new Array();
                    
                    // safer way of geocoding - avoids G_GEO_TOO_MANY_QUERIES
                    geo.getLocations(addresses[index], function(response) {                        
                        var statuscode = response.Status.code;
                        
                        if (statuscode == G_GEO_SUCCESS) {
                            // success!
                            self.trace(response.Placemark);
                            var point = new GLatLng(response.Placemark[0].Point.coordinates[1], response.Placemark[0].Point.coordinates[0], true);
                            
                            // extend bounds
                            bounds = bounds || new GLatLngBounds();
                            bounds.extend(point); self.trace("bounds extended");
                            
                            // marker
                            var marker = self.createMarker(index, point);
                            self.trace(marker); self.trace("marker created");
                            
                            // marker events
                                                        GEvent.addListener(marker, "click", function() {
                                                                zoom = 15;
                                                                map.setCenter(marker.getLatLng(), zoom);
                                                        });
                            
                            // add marker to array and display
                            markers[index] = marker;
                            map.addOverlay(marker);
                            
                            // onMarkerLoaded
                                        if (fireEvent(conf, self.onMarkerLoaded, self, index) === false) {
                                                return self;
                                        }
                        } else {
                            if (statuscode == G_GEO_TOO_MANY_QUERIES) {
                                // retry again after a short while
                                var delay = 600;
                                self.trace("index " + index + " will begin retry in " + delay + "ms")
                                setTimeout(function() {
                                    self.geocode(index);
                                }, delay);
                            } else {
                                self.trace("unknown error code: " + statuscode);
                                marker[index] = null;
                            }
                        }
                    });
                }
            },
            
            // onMarkerLoaded(index)
            //     internal function : DO NOT MODIFY
            onMarkerLoaded: function(index) {
                // set map bounds and zoom level to optimal level so all marker can fit
                return self.optimiseZoomLevel();
            },
            
            // optimiseZoomLevel()
            optimiseZoomLevel: function(index) {
                if (bounds && (addresses.length == markers.length)) {
                                        zoom = map.getBoundsZoomLevel(bounds);
                    map.setZoom(zoom);
                    map.setCenter(bounds.getCenter());
                }
                
                return true;
            },
            
            // createMarker(index, point)
            //     index:    (number) index of the marker (also used to generate a letter)
            //     point:    (GLatLng) latitude and longitude of the marker
            createMarker: function(index, point) {
                // create a base icon for all of our markers that specifies the
                // shadow, icon dimensions, etc.
                var baseIcon = new GIcon(G_DEFAULT_ICON);
                baseIcon.shadow = "http://www.google.com/mapfiles/shadow50.png";
                baseIcon.iconSize = new GSize(20, 34);
                baseIcon.shadowSize = new GSize(37, 34);
                baseIcon.iconAnchor = new GPoint(9, 34);
                baseIcon.infoWindowAnchor = new GPoint(9, 2);
                
                // lettered marker which starts at "A" and wraps at "Z"
                var range = "Z".charCodeAt(0) - "A".charCodeAt(0) + 1;
                var letter = String.fromCharCode("A".charCodeAt(0) + (index % range));
                var letteredIcon = new GIcon(baseIcon);
                letteredIcon.image = "http://www.google.com/mapfiles/marker" + letter + ".png";
                
                var markerOptions = { 
                    icon: letteredIcon,
                    bouncy: true
                };

                var marker = (labels) ? new GMarker(point, markerOptions) : new GMarker(point);
                return marker;
            },
            
            // trace(arg, [args...]) : print everything in the arguments array
            trace: function() {
                if (!debug) return;
                
                var caller = arguments.caller || "self";
                for (i = 0; i < arguments.length; i++) {
                    var argument = arguments[i]; // print object as it is
                    var line = argument;
                    try {
                        // Firefox, Safari, Opera
                        console.debug(line);
                    } catch (error) {
                        // fails gracefully on IE, Chrome
                        alert(line);
                    }
                }
            }
        });
        
        function load() {
            self.initialise();
            return self;
        }
        
        load();
    }


    // jQuery plugin implementation
        jQuery.prototype.googlemap = function(conf) {
        // already constructed --> return API
        var api = this.eq(typeof conf == 'number' ? conf : 0).data("googlemap");
        if (api) { return api; }        
        
        var opts = {
            latitude: -23,
            longitude: 133,
            zoom: 4,
            labels: true,
            controls: true,
            html: null,
            anchor: null,
            addresses: null,
            debug: false
        };
        
        $.extend(opts, conf);           
                
                this.each(function() {
                        var el = new Googlemap($(this), opts);
                        $(this).data("googlemap", el);  
                });
                
                return this;
    };
    
})(jQuery);
