if (!window.terkait) {
    window.terkait = {};
}

jQuery.extend(window.terkait, {
	
	entitiesOfInterest : [],
	
	vie : function () {
		var v = new VIE();
		v.loadSchema(chrome.extension.getURL(window.terkait.settings.schemaDefintion), {
			baseNS : window.terkait.settings.baseNamespace,
			success : function () {
				window.terkait.vie.types.addOrOverwrite('Artist', []).inherit("Person");
				window.terkait.vie.types.addOrOverwrite('Athlete', []).inherit("Person");
				window.terkait.vie.types.addOrOverwrite('MilitaryPerson', []).inherit("Person");
				window.terkait.vie.types.addOrOverwrite('Scientist', []).inherit("Person");
				window.terkait.vie.types.addOrOverwrite('Politician', []).inherit("Person");
			}
		});
		
		return v;
	},
	
	updateSettings : function() {
    	try {
    		
    		if (window.terkait.settings.stanbol) {
	    		var stanbol = new window.terkait.vie.StanbolService({
	    			url : window.terkait.settings.stanbol.split(",")
	    		});
	            window.terkait.vie.use(stanbol);
	    		stanbol.rules = jQuery.merge(stanbol.rules, window.terkait.getRules(stanbol));
    		}
    		
    		var rdfa = new window.terkait.vie.RdfaService();
            window.terkait.vie.use(rdfa);
            rdfa.rules = jQuery.merge(rdfa.rules, window.terkait.getRules(rdfa));
            
            var rdfardfquery = new window.terkait.vie.RdfaRdfQueryService();
            window.terkait.vie.use(rdfardfquery);
            rdfardfquery.rules = jQuery.merge(rdfardfquery.rules, window.terkait.getRules(rdfardfquery));
            
            var dbpedia = new window.terkait.vie.DBPediaService();
            window.terkait.vie.use(dbpedia);
            dbpedia.rules = jQuery.merge(dbpedia.rules, window.terkait.getRules(dbpedia));
            
            if (window.terkait.settings.zemanta) {
            	var zemanta = new window.terkait.vie.ZemantaService({
	            	api_key : window.terkait.settings.zemanta
	            });
	            window.terkait.vie.use(zemanta);
	            zemanta.rules = jQuery.merge(zemanta.rules, window.terkait.getRules(zemanta));
            }
            
            if (window.terkait.settings.opencalais) {
	            var opencalais = new window.terkait.vie.OpenCalaisService({
	            	api_key : window.terkait.settings.opencalais
	            });
	            window.terkait.vie.use(opencalais);
	            opencalais.rules = jQuery.merge(opencalais.rules, window.terkait.getRules(opencalais));
            }
    	} catch (e) {
    		console.log(e);
    	}
	},

    create : function() {
        try {
        	window.terkait.vie.entities.each(function (e) {
            	if (e.has("terkaitRendered"))
        			e.unset("terkaitRendered");
            });
            if (jQuery('#terkait-container').size() > 0) {
                // clear former results!
                jQuery('#terkait-container .entities')
                .empty();
                jQuery('#terkait-container')
                .animate({
                    "left" : "0px"
                }, 250);
            } else {
                var description = jQuery("<div class=\"description\">\"" + chrome.i18n.getMessage("extDesc") + "\"</div>");
                var entities = jQuery('<div>')
                    .addClass("entities")
                    .scroll(function () {
                    	// remove content dialog when scrolling through entities
                        jQuery('.terkait-recommended-content-dialog').remove();
                    });
                
                //prevent document.body from scrolling when reaching end of container
                entities.bind('mousewheel DOMMouseScroll', function(e) {
                    var scrollTo = null;

                    if (e.type == 'mousewheel') {
                        scrollTo = (e.originalEvent.wheelDelta * -1);
                    }
                    else if (e.type == 'DOMMouseScroll') {
                        scrollTo = 40 * e.originalEvent.detail;
                    }

                    if (scrollTo) {
                        e.preventDefault();
                        var current = jQuery(this).scrollTop();
                        jQuery(this).scrollTop(scrollTo + current);
                    }
                });
                
                var wrapper = jQuery('<div id="terkait-wrapper">').appendTo(jQuery('body'));
                
                var loadIndicator = jQuery('<div>')
                .addClass("loader")
                .attr("title", chrome.i18n.getMessage("loaderMsg"))
                .css({
                      "background-image" : "url(" + chrome.extension.getURL("icons/ajax-loader.gif") + ")"
                })
                .hide();
                
                jQuery('<div id="terkait-container">')
                .css({
                      "background-image" : "url(" + chrome.extension.getURL("icons/terkait_transparent.png") + ")"
                })
                .append(description)
                .append(loadIndicator)
                .append(entities)
                .appendTo(wrapper);
            }
        } catch (e) {
        	console.error(e);
            return false;
        }
        return true;
    },

    destroy : function() {
        jQuery('#terkait-container')
        .animate({
            "left" : "350px"
        }, 500);
        window.terkait.vie.entities.each(function (e) {
        	if (e.has("terkaitRendered"))
    			e.unset("terkaitRendered");
        });
        return true;
    },

    recommend : function(preselectedText) {
        var meta = jQuery('<span>');
    	if (preselectedText) {
    		meta.text(preselectedText);
    	} else {
	        var elems = jQuery(".terkait-toi");
	        elems = (elems.size > 0)? elems.removeClass("terkait-toi") : window.terkait.util.selectCOI();
	        elems.addClass("terkait-toi");
	        elems.each(function() {
	            var text = jQuery(this).text();
	            meta.text(meta.text() + " " + text.replace(/"/g, '\\"'));
	        });
    	}
        var doneCallback = function(entities) {
            window.terkait.util.updateActiveJobs(-1);
            
            entities = (_.isArray(entities))? entities : [ entities ];
            
            var sorted = entities;
            sorted.sort(function (a,b) {
        		var totalA = window.terkait.util.rankEntity(a);
        		var totalB = window.terkait.util.rankEntity(b);
        		
        		return totalB - totalA;
    		});
            
        	for (var e = 0; e < sorted.length; e++) {
        		var entity = sorted[e];
        		if (entity.has("terkaitRendered")) {
        			entity.trigger("rerender");
    			} else if (window.terkait.util.isEntityOfInterest(entity)) {
    				window.terkait.rendering.render(entity);
    			}
        	}
        	
            window.terkait.util.dbpediaLoader(entities, 
				function (ent) {
            		ent = (_.isArray(ent))? ent : [ ent ];
            		// filtering for the interesting entities
                    for (var e = 0; e < ent.length; e++) {
            			var entity = ent[e];
            			try {
	            			if (entity.has("terkaitRendered")) {
	                			entity.trigger("rerender");
	            			} else if (window.terkait.util.isEntityOfInterest(entity)) {
	            				window.terkait.rendering.render(entity);
	            			}
            			} catch (e) {
            				//debugger;
            			}
            		}
    			}, function (e) {
    				console.warn(e);
			});
        };
        
        var servicesToUse = ["stanbol"/*TODO: interpret response! , "zemanta", "opencalais"*/];
        for (var s = 0; s < servicesToUse.length; s++) {
            window.terkait.util.updateActiveJobs(1);
	        window.terkait.vie
	        .analyze({element : meta})
	        .using(servicesToUse[s])
	        .execute()
	        .done(doneCallback)
	        .fail(function(f) {
	            window.terkait.util.updateActiveJobs(-1);
	            console.warn(f);
	        });
        }
        
        return true;
    }
    /* TODO,
    
    
    ////////////////////////////////////////////////////////
    
    instantiate : function(elem){
        jQuery(elem).annotate({
            vie: window.terkait.vie,
            // typeFilter: ["http://dbpedia.org/ontology/Place", "http://dbpedia.org/ontology/Organisation", "http://dbpedia.org/ontology/Person"],
            debug: true,
            //autoAnalyze: true,
            showTooltip: true,
            decline: function(event, ui){
                console.info('decline event', event, ui);
            },
            select: function(event, ui){
                console.info('select event', event, ui);
            },
            remove: function(event, ui){
                console.info('remove event', event, ui);
            },
            success: function(event, ui){
                console.info('success event', event, ui);
            },
            error: function(event, ui){
                console.info('error event', event, ui);
            }
        });
    },
    
    annotate : function(type, sendResponse) {
        var rng = window.terkait.util.getRangeObject();
        if (rng && rng.startContainer === rng.endContainer
                && rng.startOffset !== rng.endOffset) {
            rng.expand("word"); // expands to word boundaries
            
            var newNode = document.createElement("span");
            rng.surroundContents(newNode);
            
            //////////////////
            //TODO: window.terkait.instantiate(jQueryelem);
            
            //////////////////
            newNode = jQuery(newNode).addClass("terkait-annotation");
            var text = rng.toString();

            var entity = new window.terkait.vie.Entity({
                '@type' : window.terkait.vie.types.get(type),
                'name' : text
            });
            window.terkait.vie.entities.add(entity);
            if (jQuery('#terkait-container').size() === 0) {
            	window.terkait.create();
            }
            window.terkait.rendering.render(entity);

            window.terkait.vie.save({
                entity : entity,
                element : newNode
            })
            .using('rdfardfquery')
            .execute()
            .done(function() {
                sendResponse({
                    success : true
                });
            })
            .fail(function() {
                sendResponse({
                    success : false
                });
            });
            return true;
        } else {
            return false;
        }

    }*/
    
});
