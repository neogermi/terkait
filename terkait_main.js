if (!window.terkait) {
    window.terkait = {};
}

jQuery.extend(window.terkait, {
	
	entitiesOfInterest : [],
	
	vie : function() {
    	try {
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
    		var stanbol = new v.StanbolService({
    			url : window.terkait.settings.stanbol.split(",")
    		});
            v.use(stanbol);
    		stanbol.rules = jQuery.merge(stanbol.rules, window.terkait.getRules(stanbol));
    		
    		var rdfa = new v.RdfaService();
            v.use(rdfa);
            rdfa.rules = jQuery.merge(rdfa.rules, window.terkait.getRules(rdfa));
            
            var rdfardfquery = new v.RdfaRdfQueryService();
            v.use(rdfardfquery);
            rdfardfquery.rules = jQuery.merge(rdfardfquery.rules, window.terkait.getRules(rdfardfquery));
            
            var dbpedia = new v.DBPediaService();
            v.use(dbpedia);
            dbpedia.rules = jQuery.merge(dbpedia.rules, window.terkait.getRules(dbpedia));
            
            var zemanta = new v.ZemantaService({
            	api_key : window.terkait.settings.zemanta
            });
            v.use(zemanta);
            zemanta.rules = jQuery.merge(zemanta.rules, window.terkait.getRules(zemanta));
            
            var opencalais = new v.OpenCalaisService({
            	api_key : window.terkait.settings.opencalais
            });
            v.use(opencalais);
            opencalais.rules = jQuery.merge(opencalais.rules, window.terkait.getRules(opencalais));
    		
    		return v;
    	} catch (e) {
    		console.log(e);
    	}
	},

    create : function() {
        try {
            if (jQuery('#terkait-container').size() > 0) {
                // clear former results!
                jQuery('#terkait-container .entities')
                .empty();
                jQuery('#terkait-container')
                .animate({
                    "opacity" : 1,
                    "left" : "0px"
                }, 250);
            } else {
                var description = jQuery("<span class=\"description\">\"<b>terkait</b> analyzes semantic objects on a webpage and presents related content\"</span>");
                var entities = jQuery('<div>')
                    .addClass("entities")
                    .scroll(function () {
                        jQuery('.terkait-recommended-content-dialog').remove(); //remove old dialog
                    });
                var wrapper = jQuery('<div id="terkait-wrapper">').appendTo(jQuery('body'));
                
                var loadIndicator = jQuery('<div>')
                .addClass("loader")
                .attr("title", "There's some hardcore semantic analysis going on...")
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
        	console.log(e);
            return false;
        }
        return true;
    },

    destroy : function() {
        jQuery('#terkait-container').animate({
            "opacity" : 0,
            "left" : "300px"
        }, 500);
        return true;
    },

    selector : function() {
        var res = jQuery(
                ':header,header,section,article,div,span,p,q,i,b,u,em,th,td,strong,font')
                .filter(
                        function() {
                            var jQuerythis = jQuery(this);
                            var text = jQuerythis.text() // get the text of element
                            .replace(/\W/g, ' ') // remove non-letter symbols
                            .replace(/\s+/g, ' ').trim(); // collapse multiple whitespaces

                            var words = text.match(/\b\w{5,}\b/g); // a word contains at least 5 letters
                            var children = jQuerythis.children();
                            var emptyChildren = jQuerythis.children()
                                    .filter(
                                            function() {
                                                return jQuery(this).children().size() === 0;
                                            });
                            var hasText = text.length > 0;
                            var numWords = (words === null) ? 0
                                    : words.length;
                            var area = jQuerythis.height() * jQuerythis.width();
                            var isShown = area > 0
                                    && jQuerythis.css('display') !== "none"
                                    && jQuerythis.css('visibility') !== "hidden";

                            return (isShown && hasText && numWords > 5 && (children
                                    .size() === emptyChildren.size()));
                        })
                    .not('#terkait-container *');
        return res;
    },

    recommend : function() {
        var elems = this.selector();
        elems.addClass("terkait-toi");
        var meta = jQuery('<span>');
        elems.each(function() {
            var text = jQuery(this).text();
            meta.text(meta.text() + " " + text.replace(/"/g, '\\"'));
        });
        
        var doneCallback = function(entities) {
            window.terkait.updateActiveJobs(-1);
            entities = (_.isArray(entities))? entities : [ entities ];
        	console.log("service returned with " + entities.length + " entities", entities);
            for (var e = 0; e < entities.length; e++) {
                var entity = entities[e];
                if (window.terkait._isEntityOfInterest(entity)) {
                    //TODO: sort by relevance
                    //TODO: filter dups window.terkait._filterDups(window.terkait.entitiesOfInterest, ["rdfs:seeAlso", "dbpedia:wikiPageRedirects"]);
                    window.terkait.render(entity);
                }
            }
            // filtering for the interesting entities
            window.terkait._dbpediaLoader(entities, 
				function (ent) {
            		ent = (_.isArray(ent))? ent : [ ent ];
            		for (var e = 0; e < ent.length; e++) {
            			ent[e].trigger("rerender");
                        console.log("rerendering ", ent[e].getSubject());
            		}
    			}, function (e) {
    				console.warn(e);
			});
        };
        
        var servicesToUse = ["stanbol"/*, /*"zemanta"/*, "TODO: interpret response! opencalais"*/];
        for (var s = 0; s < servicesToUse.length; s++) {
            window.terkait.updateActiveJobs(1);
	        window.terkait.vie
	        .analyze({element : meta})
	        .using(servicesToUse[s])
	        .execute()
	        .done(doneCallback)
	        .fail(function(f) {
	            window.terkait.updateActiveJobs(-1);
	            console.warn(f);
	        });
        }
        
        return {
            foundElems : elems.size() > 0
        };
    },
    
    
    ////////////////////////////////////////////////////////
    /* TODO
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
    },*/
    
    annotate : function(type, sendResponse) {
        var rng = window.terkait._getRangeObject();
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
            window.terkait.render(entity);

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

    }
    
});
