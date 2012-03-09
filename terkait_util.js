if (!window.terkait) {
    window.terkait = {};
}
window.terkait.util = {};

jQuery.extend(window.terkait.util, {

	active_jobs : 0,
	
	updateActiveJobs : function (i) {
		window.terkait.util.active_jobs += i;
		if (window.terkait.util.active_jobs <= 0) {
			window.terkait.util.active_jobs = 0;
			jQuery('#terkait-container .loader')
	        .hide();
		} else {
			jQuery('#terkait-container .loader')
	        .show();
		}
	},
	
	selectCOI : function() {
        var res = jQuery(
                ':header,header,section,article,div,span,p,q,i,b,u,em,th,td,strong,font')
                .filter(
                        function() {
                            var self = jQuery(this);
                            var text = self.text() // get the text of element
                            .replace(/\W/g, ' ') // remove non-letter symbols
                            .replace(/\s+/g, ' ').trim(); // collapse multiple whitespaces

                            var words = text.match(/\b\w{5,}\b/g); // a word contains at least 5 letters
                            var children = self.children();
                            var emptyChildren = self.children()
                                    .filter(
                                            function() {
                                                return jQuery(this).children().size() === 0;
                                            });
                            var hasText = text.length > 0;
                            var numWords = (words === null) ? 0
                                    : words.length;
                            var area = self.height() * self.width();
                            var isShown = area > 0
                                    && self.css('display') !== "none"
                                    && self.css('visibility') !== "hidden";

                            return (isShown && hasText && numWords > 5 && (children
                                    .size() === emptyChildren.size()));
                        })
                    .not('#terkait-container *');
        return res;
    },
	
    getRangeObject : function() {
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
    
    dbpediaLoader : function (entities, done, fail) {
    	entities = (_.isArray(entities))? entities : [ entities ];
    	var max = 10;
    	
    	var queryEntities = [];
        
        for (var e = 0; e < entities.length; e++) {
            var entity = entities[e];
            //filter for dbpedia entities only!
            if (entity && 
                ((typeof entity === "string" && entity.indexOf("http://dbpedia") >= 0) || 
                 (!entity.has("DBPediaServiceLoad") && entity.getSubject().indexOf("http://dbpedia") >= 0)))
                queryEntities.push(entity);
        }
    	
    	if (queryEntities.length > max) {
    		var first = queryEntities.slice(0, max);
    		var rest = queryEntities.slice(max);
    		
    		var followUp = function (rest, done, fail, ret) {
    			window.terkait.util.dbpediaLoader(rest, function (retRest) {
					retRest = (_.isArray(retRest))? retRest : [ retRest ];
					var x = jQuery.merge([], ret);
					jQuery.merge(x, retRest);
					done(x);
				}, function (err) {
					done(ret);
					fail(err);
				});
    		};

    		window.terkait.util.dbpediaLoader(first, function (ret) {
    			ret = (_.isArray(ret))? ret : [ ret ];
    			followUp(rest, done, fail, ret);
    		}, function (err) {
    			console.log("error", err);
    			followUp(rest, done, fail, []);
    			fail(err);
    		});
    		return;
    	}
    	
    	if (queryEntities.length > 0) {
	    	 window.terkait.util.updateActiveJobs(1);
	    	 window.terkait.vie
	         .load({
	             entities : queryEntities
	         })
	         .using('dbpedia')
	         .execute()
	         .done(function(e) {
	             window.terkait.util.updateActiveJobs(-1);
	         	if (done) done(e);
	         })
	         .fail(
	             function(e) {
	                 window.terkait.util.updateActiveJobs(-1);
	             	if (fail) fail(e);
	         });
    	} else {
    		if (done) done([]);
    	}
    },
    
    isEntityOfInterest : function (entity) {
    	var isEntityOfInterest = false;
		for (var t = 0, len2 = window.terkait.settings.filterTypes.length; t < len2 && !isEntityOfInterest;  t++) {
			isEntityOfInterest = isEntityOfInterest || entity.isof(window.terkait.settings.filterTypes[t]);
		}
		isEntityOfInterest = isEntityOfInterest && !entity.isof("enhancer:Enhancement");

        return isEntityOfInterest;
    },
    
    filterDups: function (entities, properties) {
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
                    	window.terkait.util.unification(object, subject);
                    	entities.splice(i, 1);
                    	i--;
                    	ids.splice(containedIdx, 1);
                    }
                }
                for (var x = 0; x < ids.length; x++) {
                	var newEntity = new window.terkait.vie.Entity({"@subject" : ids[x]});
                	window.terkait.util.unification(object, newEntity);
                	entities.splice(i, 1, newEntity);
                }
            }
        }
    },
    
    unification : function (source, target, properties) {
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
    
    getMapZoomFactor : function (entity) {
		var zoom = 12;
        var areaKm = entity.get("dbprop:areaKm");
		areaKm = (jQuery.isArray(areaKm))? areaKm[0] : areaKm;
		if(!areaKm || areaKm == "" || isNaN(areaKm)){
			areaKm = entity.get("dbpedia:areaTotal");
			areaKm = (jQuery.isArray(areaKm))? areaKm[0] : areaKm;
			areaKm = areaKm/1000000;
		}
		if(!areaKm || areaKm == "" || isNaN(areaKm)){
			var areaLand = entity.get("dbpedia:areaLand");
			var areaWater = entity.get("dbpedia:areaWater");
			areaLand = (jQuery.isArray(areaLand))? areaLand[0] : areaLand;
			areaWater = (jQuery.isArray(areaWater))? areaWater[0] : areaWater;
			areaKm = (areaLand+areaWater)/1000000;
		}
		if(!areaKm || areaKm == "" || isNaN(areaKm)){
			areaKm = entity.get("dbprop:areaTotalSqMi");
			areaKm = (jQuery.isArray(areaKm))? areaKm[0] : areaKm;
			areaKm = areaKm* 2.598;
		}
		if(!areaKm || areaKm == "" || isNaN(areaKm)){
			areaKm = entity.get("dbprop:areaTotalKm");
			areaKm = (jQuery.isArray(areaKm))? areaKm[0] : areaKm;
		}
		if(areaKm && areaKm != ""){
			switch(true){	
				case(areaKm>10000000) : zoom = 2; break;
				case(areaKm>9600000 && areaKm<10000000) : zoom = 3; break;
				case(areaKm>2750000 && areaKm<9600000) : zoom = 4; break;
				case(areaKm>1200000 && areaKm<2750000) : zoom = 5; break;
				case(areaKm>150000 && areaKm<1200000) : zoom = 6; break;
				case(areaKm>30000 && areaKm<150000) : zoom = 7; break;
				case(areaKm>10000 && areaKm<30000) : zoom = 8; break;
				case(areaKm>2000 && areaKm<10000) : zoom = 9; break;
				case(areaKm>1000 && areaKm<2000) : zoom = 10; break;
				case(areaKm>200 && areaKm<1000) : zoom = 11; break;
				case(areaKm<200) : zoom = 12; break;
			}
		}
		else{	
			if(entity.isof("Continent")){zoom =  1;}
			if(entity.isof("Country")){zoom =  3;}
			if(entity.isof("State")){zoom =  5;}
			if(entity.isof("City")){zoom =  11;}
		}
		return zoom;
	},
    
    humanReadable : function (number) {
        number = (_.isArray(number))? number[0] : number;
        
        if (number > 1000000000) {
            return Math.floor(number / 1000000000) + " billion"; // chrome.i18n.getMessage("billionUnit");
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
    
    retrieveLatLongMap : function(latitude, longitude,zoom, mapDiv) {
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
    
    retrieveKeywordMap : function(kw, mapDiv) {
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
    },
    
	decapitaliseFirstLetter : function(str) {
        return str.charAt(0).toLowerCase() + str.slice(1);
    },
	
	addIndefiniteArticle : function(str) {
		return ((str.substring(0,1).search(/[aeiou]/i) == 0)? 'an ': 'a ') + str.charAt(0).toLowerCase() + str.slice(1);
	},
	
    rankEntity : function (entity) {
    	var eRank = (entity.has("entityhub:entityRank"))? entity.get("entityhub:entityRank") : 1.0;
    	//var score = (entity.has("entityhub2:score"))? entity.get("entityhub2:score") : 1.0;

		var numTAnnots = entity.get("enhancer:hasTextAnnotation");
		numTAnnots = (_.isArray(numTAnnots))? numTAnnots : [ numTAnnots ];
		numTAnnots = numTAnnots.length;
		
		var total = numTAnnots * eRank;
		return total;
    },
	
	formatDate : function (date,f) {
		if (!date.valueOf())
			return ' ';
		var gsMonthNames = new Array(
			'January',
			'February',
			'March',
			'April',
			'May',
			'June',
			'July',
			'August',
			'September',
			'October',
			'November',
			'December'
		);
		var gsDayNames = new Array(
			'Sunday',
			'Monday',
			'Tuesday',
			'Wednesday',
			'Thursday',
			'Friday',
			'Saturday'
		);
		var d = date;
		zf = function(s) { return  (s.toString().length==2)? s: ('0'+s); };

		return f.replace(/(yyyy|mmmm|mmm|mm|dddd|ddd|dd|hh|nn|ss|a\/p)/gi,
			function($1)
			{
				switch ($1.toLowerCase())
				{
				case 'yyyy': return d.getFullYear();
				case 'yy':   return zf(d.getFullYear());
				case 'mmmm': return gsMonthNames[d.getMonth()];
				case 'mmm':  return gsMonthNames[d.getMonth()].substr(0, 3);
				case 'mm':   return zf(d.getMonth() + 1);
				case 'dddd': return gsDayNames[d.getDay()];
				case 'ddd':  return gsDayNames[d.getDay()].substr(0, 3);
				case 'dd':   return zf(d.getDate());
				case 'hh':   return zf((h = d.getHours() % 12) ? h : 12);
				case 'nn':   return zf(d.getMinutes());
				case 'ss':   return zf(d.getSeconds());
				case 'a/p':  return d.getHours() < 12 ? 'a' : 'p';
				}
			}
		);
	},
	
	hyphenateElem : function (elem) {
		var elems = jQuery(elem).get();
		for (var e = 0; e < elems.length; e++) {
			Hyphenator.hyphenate(elems[e], 'en');
		}
	}
});