if (!window.terkait) {
    window.terkait = {};
}

jQuery.extend(window.terkait, {

    _getRangeObject : function() {
        try {
            var selectionObject;
            if (window.getSelection) {
                selectionObject = window.getSelection();
            } else if (document.selection) {
                selectionObject = document.selection.createRange();
            } else {
            	return undefined;
            }
            if (selectionObject.getRangeAt)
                return selectionObject.getRangeAt(0);
            else { // Safari!
                var range = document.createRange();
                range.setStart(selectionObject.anchorNode,
                        selectionObject.anchorOffset);
                range.setEnd(selectionObject.focusNode,
                        selectionObject.focusOffset);
                return range;
            }
        } catch (e) {
            // nothing to be ranged
            return undefined;
        }
    },
    
    _dbpediaLoader : function (entity, e) {
        //be sure that we query DBPedia only once per entity!
        if (typeof e === "string" || !e.has("DBPediaServiceLoad")) {
        	var id = (typeof e === "string")? e : e.id;
            window.terkait.vie
            .load({
                entity : id
            })
            .using('dbpedia')
            .execute()
            .done(
                function(ret) {
                    entity.trigger("rerender");
                }
            );
        }
    },
    
    filterDups: function (entities, properties) {
        for (var i = 0; i < entities.length; i++) {
            var object = entities[i];
            for (var p = 0; p < properties.length; p++) {
                if (object.has(p)) {
                    var ids = object.get(p);
                    for (var j = 0; j < entities.length; j++) {
                        if (j === i) continue;
                        
                    }
                }
            }
        }
    },
    
    _humanReadable : function (number) {
        number = (_.isArray(number))? number[0] : number;
        
        if (number > 1000000000) {
            return Math.floor(number / 1000000000) + " billion";
        }
        if (number > 1000000) {
            return Math.floor(number / 1000000) + " million";
        }
        if (number > 1000) {
            return Math.floor(number / 1000) + " thousand";
        }
        if (number > 100) {
            return Math.floor(number / 100) + " houndred";
        }
        return number;
    },
    
    _retrieveMap : function(latitude, longitude, mapDiv) {
        var zoom = 8;
		var a = $('<a target="_blank" href="http://maps.google.com/maps?z=' + (zoom+4) + '&q=' + latitude + ',' + longitude + '">');
		
		var map = $('<div>');
		var img_src = 'http://maps.googleapis.com/maps/api/staticmap?&zoom='+zoom+'&size=100x100&sensor=false&markers='+latitude+','+longitude;
        jQuery(map)
        .css({
            "background-image" : "url(" + img_src + ")"
        });
		
		a
		.append(map)
		.appendTo(mapDiv);
    },
    
    _extractString : function(entity, attrs) {
        if (typeof entity !== "string") {
            var possibleAttrs = (_.isArray(attrs))? attrs : [ attrs ];
            for (var p = 0; p < possibleAttrs.length; p++) {
                var attr = possibleAttrs[p];
                if (entity.has(attr)) {
                    var name = entity.get(attr);
                    if (jQuery.isArray(name) && name.length > 0) {
                        for ( var i = 0; i < name.length; i++) {
                            if (name[i].indexOf('@' + window.terkait.options.language) > -1) {
                                name = name[i];
                                break;
                            }
                        }
                        if (jQuery.isArray(name))
                            name = name[0]; // just take the first
                    }
                    name = name.replace(/"/g, "").replace(/@[a-z]+/, '').trim();
                    return name;
                }
            }
        }
        return "NO NAME";
    },
	
});