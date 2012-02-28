if (!window.terkait) {
    window.terkait = {};
}

jQuery.extend(window.terkait, {

	active_jobs : 0,
	
	updateActiveJobs : function (i) {
		window.terkait.active_jobs += i;
		if (window.terkait.active_jobs <= 0) {
			window.terkait.active_jobs = 0;
			jQuery('#terkait-container .loader')
	        .hide();
		} else {
			jQuery('#terkait-container .loader')
	        .show();
		}
	},
	
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
    
    _dbpediaLoader : function (entities, done, fail) {
    	entities = (_.isArray(entities))? entities : [ entities ];
    	var max = 10;
    	
    	var queryEntities = [];
        
        for (var e = 0; e < entities.length; e++) {
            var entity = entities[e];
            //filter for dbpedia entities only!
            if (entity && 
                ((typeof entity === "string" && entity.indexOf("<http://dbpedia") === 0) || 
                 (!entity.has("DBPediaServiceLoad") && entity.getSubject().indexOf("<http://dbpedia") === 0)))
                queryEntities.push(entity);
        }
        
    	
    	if (queryEntities.length > max) {
    		var first = queryEntities.slice(0, max);
    		var rest = queryEntities.slice(max);
    		
    		var followUp = function (rest, done, fail, ret) {
    			window.terkait._dbpediaLoader(rest, function (retRest) {
					retRest = (_.isArray(retRest))? retRest : [ retRest ];
					var x = jQuery.merge([], ret);
					jQuery.merge(x, retRest);
					done(x);
				}, function (err) {
					done(ret);
					fail(err);
				});
    		};

    		window.terkait._dbpediaLoader(first, function (ret) {
    			ret = (_.isArray(ret))? ret : [ ret ];
    			followUp(rest, done, fail, ret);
    		}, function (err) {
    			followUp(rest, done, fail, []);
    			fail(err);
    		});
    		return;
    	}
    	
    	if (queryEntities.length > 0) {
	    	 window.terkait.updateActiveJobs(1);
	    	 window.terkait.vie
	         .load({
	             entities : queryEntities
	         })
	         .using('dbpedia')
	         .execute()
	         .done(function(e) {
	             window.terkait.updateActiveJobs(-1);
	         	if (done) done(e);
	         })
	         .fail(
	             function(e) {
	                 window.terkait.updateActiveJobs(-1);
	             	if (fail) fail(e);
	         });
    	} else {
    		if (done) done([]);
    	}
    },
    
    _isEntityOfInterest : function (entity) {
    	var isEntityOfInterest = false;
		for (var t = 0, len2 = window.terkait.settings.filterTypes.length; t < len2 && !isEntityOfInterest;  t++) {
			isEntityOfInterest = isEntityOfInterest || entity.isof(window.terkait.settings.filterTypes[t]);
		}
		isEntityOfInterest = isEntityOfInterest && !entity.isof("enhancer:Enhancement");

        return isEntityOfInterest;
    },
    
    _filterDups: function (entities, properties) {
    	properties = (_.isArray(properties))? properties : [ properties ];
    	
        for (var i = 0; i < entities.length; i++) {
            var object = entities[i];
            var ids = [];
            for (var p = 0; p < properties.length; p++) {
            	var prop = properties[p];
                if (object.has(prop)) {
                	var tmpIds = object.get(prop);
                	tmpIds = (_.isArray(tmpIds))? tmpIds : [ tmpIds ];
                	//normalisierung auf IDs
                	for (var t = 0; t < tmpIds.length; t++) {
                		var x = tmpIds[t];
                		if (typeof x !== "string") {
                			if (x.isEntity) {
                				x = x.getSubject();
                        		ids.push(x);
                			} else if (x.isCollection) {
                				x.each(function (m) {
                					ids.push(m.getSubject());
                				});
                			} else {
                				throw new Error ("what?");
                			}
                		} else {
                    		ids.push(x);
                		}
                	}
                }
            }
            if (ids.length > 0) {
                for (var j = 0; j < entities.length; j++) {
                    if (i === j) continue;
                    var subject = entities[j];
                    var containedIdx = -1;
                    for (var x = 0; x < ids.length; x++) {
                    	if (entities[j].getSubject() === ids[x]) {
                    		containedIdx = x;
                    		break;
                    	}
                    }
                    if (containedIdx !== -1) {
                    	// that means that entities[i] has a property which points to entities[j]
                    	// unification!!!
                    	window.terkait._unification(object, subject);
                    	entities.splice(i, 1);
                    	i--;
                    	ids.splice(containedIdx, 1);
                    }
                }
                for (var x = 0; x < ids.length; x++) {
                	var newEntity = new window.terkait.vie.Entity({"@subject" : ids[x]});
                	window.terkait._unification(object, newEntity);
                	entities.splice(i, 1, newEntity);
                	console.log("replacing entity", object.getSubject(), "with", newEntity.getSubject());
                }
            }
        }
    },
    
    _unification : function (source, target, properties) {
    	//TODO: filter for non-properties only!
    	for (var attribute in source.attributes) {
    		if (attribute.indexOf("@") !== 0) {
        		if (!target.has(attribute))
        			target.set(attribute, source.get(attribute));
        		else {
        			try {
        				target.setOrAdd(attribute, source.get(attribute));
        			} catch (e) {
        				console.log("could not unify", attribute, e);
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
    
    _retrieveLatLongMap : function(latitude, longitude,zoom, mapDiv) {
		var a = $('<a target="_blank" href="http://maps.google.com/maps?z=' + zoom + '&q=' + latitude + ',' + longitude + '&iwloc=A">');
		zoom = Math.floor(zoom/2);
		var map = $('<div>');
		var img_src = 'http://maps.googleapis.com/maps/api/staticmap?zoom='+zoom+'&size=100x100&sensor=false&markers='+latitude+','+longitude;
        jQuery(map)
        .css({
            "background-image" : "url(" + img_src + ")"
        });
		
		a
		.append(map)
		.appendTo(mapDiv);
    },
    
    _retrieveKeywordMap : function(kw, mapDiv) {
        var a = $('<a target="_blank" href="http://maps.google.com/maps?q=' + kw + '&iwloc=A">');
		var map = $('<div>');
		var img_src = 'http://maps.googleapis.com/maps/api/staticmap?size=100x100&sensor=false&markers='+ encodeURI(kw);
        jQuery(map)
        .css({
            "background-image" : "url(" + img_src + ")"
        });
		
		a
		.append(map)
		.appendTo(mapDiv);
    },
    
    capitaliseFirstLetter : function(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
	
});