/**
* Jquery Google Maps
* Version 1.1
* by Tibor Karcsics
* email: mycroft84gmail.com
* 
*/

    function compareObject(o1, o2){
    	for(var p in o1){
    		if(o1[p] !== o2[p]){
    			return false;
    		}
    	}
    	for(var p in o2){
    		if(o1[p] !== o2[p]){
    			return false;
    		}
    	}
    	return true;
    }
    
;(function($){
	
     var methods = {
	    init : function( options ) {
		
    		var defaults =   {
                controls: {
                       panControl: true,
                       zoomControl: true,
                       mapTypeControl: true,
                       scaleControl: false,
                       streetViewControl: true,
                       overviewMapControl: false,
                       rotateControl: true
                   },
                scrollwheel: true,
                maptype: 'ROADMAP',
                markers: [],
                icon: {
                    image: "http://www.google.com/mapfiles/marker.png",
                    shadow: "http://www.google.com/mapfiles/shadow50.png",
                    iconsize: [20, 34],
                    shadowsize: [37, 34],
                    iconanchor: [0, 34],
                    shadowanchor: [0, 34]
                },
                latitude: 0,
                longitude: 0,
                zoom: 1
    		};
       	   
       	   var opts = $.extend(defaults, options);
       	   
       	   return $(this).each(function(){
       		   $this = $(this);
       		   var o = $.meta ? $.extend({}, opts, $this.data()) : opts;
               
               var maps_config = {
                  zoom: o.zoom,
                  mapTypeId: google.maps.MapTypeId[o.maptype],
                  center: new google.maps.LatLng(o.latitude, o.longitude),
                  panControl: o.controls.panControl,
                  zoomControl: o.controls.zoomControl,
                  mapTypeControl: o.controls.mapTypeControl,
                  scaleControl: o.controls.scaleControl,
                  streetViewControl: o.controls.streetViewControl,
                  overviewMapControl: o.controls.overviewMapControl,
                  rotateControl: o.controls.rotateControl,
                  scrollwheel: o.scrollwheel   
               };
               
               var map = new google.maps.Map($this[0],maps_config);
               
               o.map = map;
               o.mapMarkers = new Array();
               $this.data(o);
               
               if (o.markers.length > 0)
               {
                    $.each(o.markers,function(index,values){
                        $this.gmaps('addMarker',values); 
                    });
               }
               
            });
        },
	    destroy : function() {
	       $(this).empty().removeAttr('style');
           $(this).gmaps('deleteAllMarkers');
	    },
	    addMarker : function(data) {
	       var o = $(this).data();
           var geocoder = new google.maps.Geocoder();
           
           var marker_default = {
                draggable: false,
                animation: 'DROP',
                clickable: true,
                flat: false,
                visible: true,
                title: ''
           };
           
           //set icon
           var icons = $.extend(o.icon,data.icon);
           var image =  new google.maps.MarkerImage(
                            icons.image,
                            new google.maps.Size(icons.iconsize[0],icons.iconsize[1]),
                            new google.maps.Point(0,0),
                            new google.maps.Point(icons.iconanchor[0],icons.iconanchor[1])
           );
                        
           var shadow = new google.maps.MarkerImage(
                            icons.shadow,
                            new google.maps.Size(icons.shadowsize[0],icons.shadowsize[1]),
                            new google.maps.Point(0,0),
                            new google.maps.Point(icons.shadowanchor[0],icons.shadowanchor[1])
           );
           
           if (typeof(data.latitude) != 'undefined')
           {
               var coord = new google.maps.LatLng(data.latitude,data.longitude);
               geocoder.geocode( {'latLng': coord }, function(results, status) {
                    var o_marker = $.extend(marker_default,data);
                
                    var marker = new google.maps.Marker({
                        map: o.map,
                        draggable: o_marker.draggable,
                        animation: google.maps.Animation[o_marker.animation],
                        clickable: o_marker.clickable,
                        flat: o_marker.flat,
                        visible: o_marker.visible,
                        title: o_marker.title,
                        position: coord,
                        icon: image,
                        shadow: shadow
                    });
                    
                    if (typeof(data.html) != 'undefined')
                    {
                        var address = results[0].formatted_address;
                        var lat = results[0].geometry.location.Pa;
                        var lng = results[0].geometry.location.Qa;
                        
                        var content = data.html.replace(/%address%/g,address).replace(/%lat%/g,lat).replace(/%lng%/g,lng);
                        
                        var infowindow = new google.maps.InfoWindow({
                            content : content
                        });
                        google.maps.event.addListener(marker, 'click', function(){
                            infowindow.open(o.map,marker);
                        }) 
                    }
                    
                    o.mapMarkers.push(marker);
                    $(this).data(o);
                    marker.setMap(o.map);
                    
               });
               
               
                  
           } 
           else if (typeof(data.address) != 'undefined')
           {
                 geocoder.geocode( {'address': data.address }, function(results, status) {
                    var o_marker = $.extend(marker_default,data);
                    
                    var coord = new google.maps.LatLng(results[0].geometry.location.Pa,results[0].geometry.location.Qa);
                    var marker = new google.maps.Marker({
                        map: o.map,
                        draggable: o_marker.draggable,
                        animation: google.maps.Animation[o_marker.animation],
                        clickable: o_marker.clickable,
                        flat: o_marker.flat,
                        visible: o_marker.visible,
                        title: o_marker.title,
                        position: coord,
                        icon: image,
                        shadow: shadow
                    });
                    
                    if (typeof(data.html) != 'undefined')
                    {
                        var address = results[0].formatted_address;
                        var lat = results[0].geometry.location.Pa;
                        var lng = results[0].geometry.location.Qa;
                        
                        var content = data.html.replace(/%address%/g,address).replace(/%lat%/g,lat).replace(/%lng%/g,lng);
                        
                        var infowindow = new google.maps.InfoWindow({
                            content : content
                        });
                        google.maps.event.addListener(marker, 'click', function(){
                            infowindow.open(o.map,marker);
                        }) 
                    }
                    
                    o.mapMarkers.push(marker);
                    $(this).data(o);
                    marker.setMap(o.map);
                    
                 });
                 
                 
           }
                      
           
	    },
	    deleteMarker : function(data) {
	       var o = $(this).data();
           var temp = new Array();
           
           if (typeof(data) != 'object')
           {
                
                $.each(o.mapMarkers,function(index,value) {
                      if (index != data-0) temp.push(value);
                      else value.setMap(null);
                });
           } else {
                $.each(o.mapMarkers,function(index,value) {
                      if (!compareObject(data,value)) temp.push(value);
                      else value.setMap(null);
                });            
           }
           
           o.mapMarkers = temp;
           $(this).data = o;
	    },
        deleteAllMarkers : function() {
            var o = $(this).data();
            
            if (o.mapMarkers) {
                for (i in o.mapMarkers) {
                  o.mapMarkers[i].setMap(null);
                }
                o.mapMarkers.length = 0;
              }
        },
        centerAt: function(data) {
            var o = $(this).data();
            var defaults = {
               latitude: false,
               longitude: false,
               zoom: 1,
               address: false,
               panTo: false  
            };
            var opts = $.extend(defaults, data);
            
            if (opts.latitude !== false) {
                var coord = new google.maps.LatLng(opts.latitude,opts.longitude);
                o.map.setZoom(opts.zoom);
                if (opts.panTo) o.map.panTo(coord);
                else o.map.setCenter(coord);
            }
                
            if (opts.address !== false) {
                var geocoder = new google.maps.Geocoder();
                geocoder.geocode( {'address': data.address }, function(results, status) {
                    var coord = new google.maps.LatLng(results[0].geometry.location.Pa,results[0].geometry.location.Qa);
                    o.map.setZoom(opts.zoom);
                    if (opts.panTo) o.map.panTo(coord);
                    else o.map.setCenter(coord);
                });
            }
            
            
            
        }
	  };
	
	$.fn.gmaps = function(method)
	{
	     // Method calling logic
	    if ( methods[method] ) {
	      return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
	    } else if ( typeof method === 'object' || ! method ) {
	      return methods.init.apply( this, arguments );
	    } else {
	      $.error( 'Method ' +  method + ' does not exist on jQuery.gmaps' );
	    }
	}
		
})(jQuery)