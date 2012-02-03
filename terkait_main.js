if (!window.terkait) {
    window.terkait = {};
}

jQuery.extend(window.terkait, {
	
	vie : function() {
    	try {
    		var v = new VIE();
    		v.loadSchema(chrome.extension.getURL(window.terkait.settings.schemaDefintion), {
    			baseNS : window.terkait.settings.baseNamespace
    		});
    		var stanbol = new v.StanbolService({
    			url : window.terkait.settings.stanbol.split(",")
    		});
            v.use(stanbol);
    		stanbol.rules = jQuery.merge(stanbol.rules, window.terkait.getRules(stanbol));
    		
    		var rdfa = new v.RdfaService();
            v.use(rdfa);
            rdfa.rules = jQuery.merge(rdfa.rules, window.terkait.getRules(rdfa));
            
    		var dbpedia = new v.DBPediaService();
            v.use(dbpedia);
            dbpedia.rules = jQuery.merge(dbpedia.rules, window.terkait.getRules(dbpedia));
    		
    		return v;
    	} catch (e) {
    		console.log(e);
    	}
	},

    create : function() {
        try {
            if (jQuery('#terkait-container').size() > 0) {
                // clear former results!
                jQuery('#terkait-container .entities').empty();
            } else {
                var description = jQuery("<span class=\"description\">\"<b>terkait</b> anaylzes semantic objects on a webpage and presents related content\"</span>");
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
                        })/* TODO: for later
                        .hover(
                            function() {
                                jQuery(this).animate({ "left" : "0px" });
                            }
                        ) */
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
        jQuery('#terkait-container').remove();
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
        
        window.terkait.updateActiveJobs(1);
        window.terkait.vie
        .analyze({
            element : meta
        })
        .using('stanbol')
        .execute()
        .done(
            function(entities) {
                // filtering for the interesting entities
                window.terkait.updateActiveJobs(-1);
                var entitiesOfInterest = [];
                window.terkait._filterDups(entities, ["rdfs:seeAlso", "dbpedia:wikiPageRedirects"]);
                for ( var e = 0, len = entities.length; e < len; e++) {
                    var entity = entities[e];
                    var isEntityOfInterest = false;
					for (var t = 0, len2 = window.terkait.settings.filterTypes.length; t < len2 && !isEntityOfInterest;  t++) {
						isEntityOfInterest = isEntityOfInterest || entity.isof(window.terkait.settings.filterTypes[t]);
					}
					isEntityOfInterest = isEntityOfInterest && !entity.isof("enhancer:Enhancement");
                    var hasAnnotations = entity.has("enhancer:hasEntityAnnotation")
                            || entity.has("enhancer:hasTextAnnotation");

                    if (isEntityOfInterest && hasAnnotations) {
                        entitiesOfInterest.push(entity);
                    }
                }
                // sorting by "relevance" (number of occurrences in the text)
                entitiesOfInterest
                        .sort(function(a, b) {
                            var numOfEntityAnnotsA = (jQuery.isArray(a.get("enhancer:hasEntityAnnotation"))) ? a
                                    .get("enhancer:hasEntityAnnotation").length : 1;
                            var numOfTextAnnotsA = (jQuery.isArray(a.get("enhancer:hasTextAnnotation"))) ? a
                                    .get("enhancer:hasTextAnnotation").length : 1;
                            var sumA = numOfEntityAnnotsA + numOfTextAnnotsA;
                            var numOfEntityAnnotsB = (jQuery.isArray(b.get("enhancer:hasEntityAnnotation"))) ? b
                                    .get("enhancer:hasEntityAnnotation").length : 1;
                            var numOfTextAnnotsB = (jQuery.isArray(b.get("enhancer:hasTextAnnotation"))) ? b
                                    .get("enhancer:hasTextAnnotation").length : 1;
                            var sumB = numOfEntityAnnotsB + numOfTextAnnotsB;

                            if (sumA == sumB)
                                return 0;
                            else if (sumA < sumB)
                                return 1;
                            else
                                return -1;
                        });
				entitiesOfInterest = entitiesOfInterest.slice(0, entitiesOfInterest.length < window.terkait.settings["max-entities"] ? entitiesOfInterest.length : window.terkait.settings["max-entities"]);
                for (var i = 0, len = entitiesOfInterest.length; i < len; i++) {
                    var entity = entitiesOfInterest[i];
                    window.terkait.render(entity);

                    // trigger a search in DBPedia to ensure to have "all" properties
                    window.terkait._dbpediaLoader(entity, entity);
                }
                console.log("rendering " + entitiesOfInterest.length + " entities", entitiesOfInterest);
            }
        )
        .fail(function(f) {
            window.terkait.updateActiveJobs(-1);
            console.warn(f);
        });
        
        return {
            foundElems : elems.size() > 0
        };
    },
    
    
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
        var rng = window.terkait._getRangeObject();
        if (rng && rng.startContainer === rng.endContainer
                && rng.startOffset !== rng.endOffset) {
            rng.expand("word"); // expands to word boundaries
            var selectedText = jQuery(rng.cloneContents()).text();
            rng.deleteContents();
            var jQueryelem = jQuery("<span>" + selectedText + "</span>").addClass(
                    "terkait-annotation");
            rng.insertNode(jQueryelem.get(0));
            
            
            //////////////////
            window.terkait.instantiate(jQueryelem);
            
            
            //////////////////
            /*
            var text = rng.toString();

            var entity = new window.terkait.vie.Entity({
                '@type' : window.terkait.vie.types.get(type),
                'name' : text
            });
            window.terkait.vie.entities.add(entity);
            window.terkait.render(entity);

            window.terkait.vie.save({
                entity : entity,
                element : jQueryelem
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
            });*/
            return true;
        } else {
            return false;
        }

    }
    
});
