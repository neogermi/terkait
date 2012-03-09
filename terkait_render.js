if (!window.terkait) {
    window.terkait = {};
}

window.terkait.rendering = {};

jQuery.extend(window.terkait.rendering, {
    
    createContentView : function(entity, parentEl, unfold) {
        var ContentView = Backbone.View.extend({
        	
        	folded: true,

            className : "card-content",

            initialize : function() {
            	this.folded = !unfold;
                // bind the entitie's "rerender" event to a rerendering of the VIEW
                this.model.bind("rerender", this.render, this);

                var front = jQuery("<div>").addClass("front");
                var back = jQuery("<div>").addClass("back");
                
                var labelElem = jQuery("<div>").addClass("card-label");
                var leftElem = jQuery("<div>").addClass("recommended-content");
                var rightElem = jQuery("<div>").addClass("entity-details");

                var $el = jQuery(this.el);
                
                $el
                .append(front)
                .append(back)
                .appendTo(parentEl);
                
                front
                .append(labelElem)
                .append(leftElem)
                .append(rightElem);
                

            	window.terkait.util.highlightEntityOccurrences(this.model);
                
                front
                .hover(function () {
                	$(this).find(".button").fadeIn(500);
                }, function () {
                	$(this).find(".button").fadeOut(500);
                });
                
                back
                .css("display", "none")//.append(window.terkait.rendering._renderEntityEditor(this.model));
                ;
                
                var closeButton = window.terkait.rendering.createCloseButton();
                closeButton
                .hide()
                .css({"position":"absolute", top: "0px", left: "0px"})
                .appendTo(front)
                .click(function (view) {
                	return function () {
                		var $accord = jQuery(view.el).parents('.accordion').first();
		                $accord.slideUp(500, function () {
			                view.remove();
		                	jQuery(this).remove();
		                });
		                jQuery('.terkait-recommended-content-dialog').remove();
		            };
                }(this));
                
                var foldButton = window.terkait.rendering.createFoldButton();
                var $accord = $el.parents('.accordion').first();
            	if (this.folded) {
                	foldButton.css("-webkit-transform", "rotate(90deg)");
                	$accord.css("height", "26px");
                } else {
                	foldButton.css("-webkit-transform", "rotate(270deg)");
                	$accord.css("height", "222px");
                }
                foldButton
                .hide()
                .css({"position":"absolute", top: "0px", right: "0px"})
                .appendTo(front)
                .click(function (view) {
                	return function () {
                		var foldButton = jQuery(this);
                		var $accord = jQuery(view.el).parents('.accordion').first();
                		if (view.folded) {
            				foldButton.css("-webkit-transform", "rotate(270deg)");
                			$accord.animate({"height" : "222px"}, 500, function () {
                        		view.folded = !view.folded;
                    		});
                		} else {
            				foldButton.css("-webkit-transform", "rotate(90deg)");
                			$accord.animate ({"height" : "26px"}, 500, function () {
                        		view.folded = !view.folded;
                    		});
                		}
		            };
                }(this));
                
                /* TODO: editing will be available in v1.1
                var editButton = window.terkait.rendering.createEditButton();
                editButton
                .hide()
                .css({"position":"absolute", top: "0px", right: "0px"})
                .appendTo(front)
                .click(function (view) {
                	return function () {
                		jQuery(view.el).css("-webkit-transform", "rotateY(-180deg)");
                		$(this).parent().find(".button").hide();
                		
		            };
                }(this));
                
                
                var finishEditButton = window.terkait.rendering.createFinishEditButton();
                finishEditButton
                .css({"position":"absolute", top: "0px", right: "0px"})
                .appendTo(back)
                .click(function (view) {
                	return function () {
                		jQuery(view.el).css("-webkit-transform", "rotateY(0deg)");
		            };
                }(this));
                */
                
                this.render();
            },

            render : function() {
                var $el = jQuery(this.el);
                var renderer = window.terkait.rendering.selectRenderer(this.model);
                
                if (renderer !== undefined) {
                    // first clear the content
                    var labelElem = jQuery(".card-label", $el).empty();
                    var leftElem = jQuery(".recommended-content", $el).empty();
                    var rightElem = jQuery(".entity-details", $el).empty();
                    
                    renderer["label"](this.model, labelElem);
                    renderer["left"](this.model, leftElem);
                    renderer["right"](this.model, rightElem);
                    window.terkait.util.hyphenateElem(rightElem.find(".abstract"));
                    $el.parent().show();
                } else {
                    console.log("no renderer found for entity", this.model);
                    $el.parent().hide();
                }
            }
        });
        return new ContentView({
            model : entity,
            parentEl : parentEl
        });
    },

    createCloseButton : function () {
	    return jQuery('<div>')
	      .addClass('button')
	      .css({
	          "background-image" : "url(" + chrome.extension.getURL("icons/check-false.png") + ")"
	      });
	  },
	  
	  createFoldButton : function () {
		    return jQuery('<div>')
		      .addClass('button')
		      .css({
		          "background-image" : "url(" + chrome.extension.getURL("icons/icon_play.png") + ")"
		      });
		  },
	  
    createEditButton : function () {
      return jQuery('<div>')
      .addClass('button')
        .css({
            "background-image" : "url(" + chrome.extension.getURL("icons/info.png") + ")"
        });
    },
	    
    createFinishEditButton : function () {
      return jQuery('<div>')
      .addClass('button')
        .css({
            "background-image" : "url(" + chrome.extension.getURL("icons/check-true.png") + ")"
        });
    },
    
    _renderEntityEditor : function (entity) {
    	var view = new window.terkait.formEditor.EntityView({model : entity});
    	return jQuery(view.el);
    },

    render : function(entity, opts) {
        
    	opts = (opts) ? opts : {};
    	
        var accordionContainer = undefined;
        var numEntitiesShown = 10000;
        // where to put it?
        if (opts.selector) {
        	accordionContainer = jQuery(opts.selector).parent('.accordion').first();
        } else {
        	numEntitiesShown = jQuery("#terkait-container .entities .accordion").size();
        	if (numEntitiesShown < window.terkait.settings.maxEntities) {
	            accordionContainer = jQuery('<div>')
	            .addClass("accordion")
	            .hide()
	            .appendTo(jQuery('#terkait-container .entities'));
                entity.set("terkaitRendered", true);
        	}
        }
        
        if (accordionContainer) {
	        // create the VIEW on that entity
	        this.createContentView(entity, accordionContainer, (numEntitiesShown < 2));
        }
    },
    
    selectRenderer : function (entity) {
        var types = entity.get('@type');
        types = (jQuery.isArray(types))? types : [ types ];
        
        var tsKeys = [];
        for (var q in window.terkait.rendering._renderer) {
            tsKeys.push(q);
        }
        //sort the keys in ascending order!
        tsKeys = window.terkait.vie.types.sort(tsKeys, false);
        types = window.terkait.vie.types.sort(types, false);
        
        var whiteTypes = window.terkait.settings.filterTypes;
                
        for (var t = 0, tlen = types.length; t < tlen; t++) {
            var type = window.terkait.vie.types.get(types[t]);
            if (type) {
            	var isWhiteType = false;
            	for (var w = 0; w < whiteTypes.length && !isWhiteType; w++) {
            		isWhiteType = isWhiteType || type.isof(whiteTypes[w]);
            	}
            	if (isWhiteType) {
	                for (var q = 0, qlen = tsKeys.length; q < qlen; q++) {
	                    var key = tsKeys[q];
	                    if (type.isof(key)) {
	                        return window.terkait.rendering._renderer[key];
	                    }
	                }
            	}
            }
        }
        return undefined;
    },
    
    renderPerson : function (entity, div) {
        div.addClass("person");
        var img = window.terkait.rendering.renderDepiction(entity);
        var abs = jQuery('<div class="abstract">');
		var age = window.terkait.rendering.renderAge(entity);
        abs.append(img);
        abs.append(jQuery("<div>" + window.terkait.rendering.getLabel(entity) + " " + age + " is a person.</div>"));
        
        div.append(abs);
    },
	
	renderArtist : function (entity, div) {
        div.addClass("artist");
		var label = window.terkait.rendering.getLabel(entity);
        var img = window.terkait.rendering.renderDepiction(entity);
		var age = window.terkait.rendering.renderAge(entity);
		var isLiving = !entity.has('dbpedia:deathDate');
		var nat = VIE.Util.extractLanguageString(entity, ["dbprop:nationality"], window.terkait.settings.language);
		var occupation = VIE.Util.extractLanguageString(entity, ["dbpedia:background","dbprop:occupation"], window.terkait.settings.language);
		
		if(occupation){
			occupation = occupation.replace(/_/g, " ");
			occupation = window.terkait.util.decapitaliseFirstLetter(occupation);
		}
        
		if(nat){
			nat = window.terkait.util.addIndefiniteArticle(nat);
		}
		else{
			nat = '';
			occupation = occupation? window.terkait.util.addIndefiniteArticle(occupation): ' an artist';
		}
		
		var genre = entity.get("dbprop:genre");
		if(genre){
			genre = jQuery.isArray(genre)? genre: [genre];
			for(var i = 0; i < genre.length; i++){
				var g = genre[i];
				g = (VIE.Util.isUri(g))? g.substring(g.lastIndexOf("/")+1,g.length-1): g.replace(/["]/g, "").replace(/@[a-z]+/, '').trim();
				g = g.replace(/_/gi, " ");
				g = window.terkait.util.decapitaliseFirstLetter(g);
				genre[i] = g;
			}
			genre = (genre.length>1)? genre.join(", "): genre[0];
			genre = ', ' + (isLiving? 'working': 'worked') +' in genre: ' + genre;
			
		}
		else{
			genre = '';
		}

		var abs = jQuery('<div class="abstract">');
        abs.append(img);
		abs.append(jQuery("<div>" + label + " " + age + (isLiving? " is ": " was ") + nat + " " + occupation + genre + ".</div>"));
        div.append(abs);
    },

	renderAthlete : function (entity, div) {
        div.addClass("athlete");
        var img = window.terkait.rendering.renderDepiction(entity);
        var age = window.terkait.rendering.renderAge(entity);
		var isLiving = !entity.has('dbpedia:deathDate');
        var weight = entity.get('dbpedia:weight');
		weight = (jQuery.isArray(weight))? weight[0]: weight;
		var height = entity.get('dbpedia:height');
		height = (jQuery.isArray(height))? height[0]: height;
		var nat = VIE.Util.extractLanguageString(entity, ["dbprop:nationality"], window.terkait.settings.language);
		var occupation = VIE.Util.extractLanguageString(entity, ["dbprop:occupation"], window.terkait.settings.language);
		if(nat){
			nat = window.terkait.util.addIndefiniteArticle(nat);
		}
		else{
			nat = '';
			occupation = occupation? window.terkait.util.addIndefiniteArticle(occupation): ' an athlete';
		}

		var country = entity.get('dbpedia:country');
		country = (jQuery.isArray(country))? country[0]: country;
		var abs = jQuery('<div class="abstract">');
        abs.append(img);
        abs.append(jQuery("<div>" + window.terkait.rendering.getLabel(entity) + " " + age + (isLiving? " is ": " was ") + nat + occupation + ".</div>"));
		div.append(abs);
		if(weight){
			div.append('Weight: ' + weight / 1000 + 'kg<br/>');
		};
		if(height){
			div.append('Height: ' + height + 'm');
		};
		if(country && VIE.Util.isUri(country)){
			window.terkait.util.dbpediaLoader(country, 
        		function (e) {
                    if (_.isArray(e) && e.length > 0 || e.isEntity)
                        entity.trigger("rerender");
		        }, 
		        function (e) {
		        	console.warn(e);
		        });
				div.append('Country: ' + jQuery('<span class="country">' + window.terkait.rendering.getLabel(country) + '</span>'));
		};
    },
    
	renderPolitician : function (entity, div) {
        div.addClass("politician");
        var img = window.terkait.rendering.renderDepiction(entity);
        var age = window.terkait.rendering.renderAge(entity);
		var isLiving = !entity.has('dbpedia:deathDate');
		var nat = VIE.Util.extractLanguageString(entity, ["dbprop:nationality"], window.terkait.settings.language);
		var occupation = VIE.Util.extractLanguageString(entity, ["dbprop:occupation"], window.terkait.settings.language);
		if(occupation){
			occupation = occupation.replace(/_/g, " ");
			occupation = window.terkait.util.decapitaliseFirstLetter(occupation);
		}
		
 		if(nat){
			nat = window.terkait.util.addIndefiniteArticle(nat);
			occupation = occupation? (' ' + occupation): ' polititian';
		}
		else{
			nat = '';
			occupation = occupation? (' ' + window.terkait.util.addIndefiniteArticle(occupation)): ' a politician';
		}

        var party = entity.get('dbpedia:party');
		party = (jQuery.isArray(party))? party[0]: party;
		if(party){
			window.terkait.util.dbpediaLoader(party, 
        		function (e) {
                    if (_.isArray(e) && e.length > 0 || e.isEntity)
                        entity.trigger("rerender");
		        }, 
		        function (e) {
		        	console.warn(e);
		        });
			party = ', affiliated with the <span class="party">' + window.terkait.rendering.getLabel(party) + '</span>';
		}
		else{
			party = '';
		};
		var dpt = VIE.Util.extractLanguageString(entity, ["dbprop:department"], window.terkait.settings.language);
		dpt = (jQuery.isArray(dpt))? (', working at ' + dpt[0].replace(/_/g, " ")): '';
		var abs = jQuery('<div class="abstract">');
        abs.append(img);
        abs.append(jQuery("<div>" + window.terkait.rendering.getLabel(entity) + " " + age + (isLiving? " is ": " was ") + nat + occupation + dpt + party + ".</div>"));
        div.append(abs);
    },
	
	renderScientist : function (entity, div) {
        div.addClass("scientist");
        var img = window.terkait.rendering.renderDepiction(entity);
		var age = window.terkait.rendering.renderAge(entity);
        var isLiving = !entity.has('dbpedia:deathDate');
		var nat = VIE.Util.extractLanguageString(entity, ["dbprop:nationality"], window.terkait.settings.language);
		var occupation = VIE.Util.extractLanguageString(entity, ["dbprop:occupation"], window.terkait.settings.language);
		if(nat){
			nat = window.terkait.util.addIndefiniteArticle(nat);
			occupation = occupation? (' ' + occupation): ' scientist';
		}
		else{
			nat = '';
			occupation = occupation? (' ' + window.terkait.util.addIndefiniteArticle(occupation)): ' a scientist';
		}
		var institution = VIE.Util.extractLanguageString(entity, ["dbprop:workIntitutions","dbprop:workplaces"], window.terkait.settings.language);
		institution = institution? (', ' + isLiving? 'working': 'worked' + 'at <span class = "institution">' + institution + "</span>"): '';
		var abs = jQuery('<div class="abstract">');
        abs.append(img);
        abs.append(jQuery("<div>" + window.terkait.rendering.getLabel(entity) + " " + age + (isLiving? " is ": " was ") + nat + occupation + institution + ".</div>"));
        
        div.append(abs);
    },
	
	renderMilitaryPerson : function (entity, div) {
        div.addClass("militaryPerson");
        var img = window.terkait.rendering.renderDepiction(entity);
        var age = window.terkait.rendering.renderAge(entity);
        var isLiving = !entity.has('dbpedia:deathDate');
		var nat = VIE.Util.extractLanguageString(entity, ["dbprop:nationality"], window.terkait.settings.language);
		var occupation = VIE.Util.extractLanguageString(entity, ["dbprop:occupation"], window.terkait.settings.language);
		if(nat){
			nat = window.terkait.util.addIndefiniteArticle(nat);
			occupation = occupation? (' ' + occupation): ' military person';
		}
		else{
			nat = '';
			occupation = occupation? (' ' + window.terkait.util.addIndefiniteArticle(occupation)): ' a military person';
		}
		var branch = entity.get('dbprop:branch');
		if(branch){
			branch = jQuery.isArray(branch)? branch: [branch];
			for(var i = 0; i < branch.length; i++){
				var bra = branch[i];
				bra = (VIE.Util.isUri(bra))? bra.substring(bra.lastIndexOf("/")+1,bra.length-1): bra.replace(/["]/g, "").replace(/@[a-z]+/, '').trim();
				bra = bra.replace(/_/gi, " ");
				branch[i] = bra;
			}
			branch = (branch.length>1)? branch.join(", "): branch[0];
			branch = ', staffed by ' + branch;
		}
		else{
			branch = '';
		}
		var abs = jQuery('<div class="abstract">');
        abs.append(img);
        abs.append(jQuery("<div>" + window.terkait.rendering.getLabel(entity) + " " + age + (isLiving? " is ": " was ") + nat + occupation + branch + ".</div>"));
        
        div.append(abs);
    },
	
    renderCountry : function (entity, div) {
        div.addClass("country");
        var map = window.terkait.rendering.renderMap(entity);
        
        var capital = entity.get("dbprop:capital");
        var capSentence = "";
        if (capital) {
	        capital = (capital.isCollection)? capital.at(0) : capital;
	        window.terkait.util.dbpediaLoader(capital, 
	        		function (e) {
	        			if (_.isArray(e) && e.length > 0 || e.isEntity)
	        				entity.trigger("rerender");
			        }, 
			        function (e) {
			        	console.warn(e);
			        });
	        capSentence = " It's capital is <a href=\"" + capital.getSubject().replace(/[<>]/g, "") + "\">" + 
	        			  window.terkait.rendering.getLabel(capital) + "</a>.";
	        
        }
        
        var abs = jQuery('<div class="abstract">');
        abs.append(map);
        abs.append(jQuery("<div>" + window.terkait.rendering.getLabel(entity) + " is a country with a population of " + 
        window.terkait.util.humanReadable(entity.get("dbpedia:populationTotal")) + 
        "." + capSentence + "</div>"));
        
        div.append(abs);
    },
    
    renderContinent : function (entity, div) {
        div.addClass("continent");
        var map = window.terkait.rendering.renderMap(entity);
        div.append(map);
        
        var abs = jQuery('<div class="abstract">');
        abs.html(window.terkait.rendering.getLabel(entity) + " is a continent with an area of " + 
        window.terkait.util.humanReadable(parseInt(entity.get("dbpedia:areaTotal")) / 1000000) + " km&sup2; and a population of " + 
        window.terkait.util.humanReadable(entity.get("dbpedia:populationTotal")) + 
        ". It comprises " + entity.get("dbprop:countries") + " countries.");
        
        div.append(abs);
    },
    
    renderPlace : function (entity, div) {
    	div.addClass("place");
        var map = window.terkait.rendering.renderMap(entity);
        
        var abs = jQuery('<div class="abstract">');
        abs.append(map);
        abs.append(jQuery("<div>" + window.terkait.rendering.getLabel(entity) + " is a place.</div>"));
        
        div.append(abs);
    },
    
    renderCity : function (entity, div) {
        div.addClass("city");
        var map = window.terkait.rendering.renderMap(entity);
        div.append(map);
        
        //collect information from connected entities!
        var country = entity.get("dbpedia:country");
        country = (country && country.isCollection)? country.at(0) : country;
        window.terkait.util.dbpediaLoader(country, 
        		function (e) {
                    if (_.isArray(e) && e.length > 0 || e.isEntity)
                        entity.trigger("rerender");
		        }, 
		        function (e) {
		        	console.warn(e);
		        });
        
        var population = entity.get("dbpedia:populationTotal");
        
        var abs = jQuery('<div class="abstract">');
        abs.html(window.terkait.rendering.getLabel(entity) + " is a city in " +
        window.terkait.rendering.getLabel(country) + " with a population of " + 
        window.terkait.util.humanReadable(population) + ".");
        
        div.append(abs);
    },
    
    renderState : function (entity, div) {
        div.addClass("state");
        var map = window.terkait.rendering.renderMap(entity);
        
        //collect information from connected entities!
        var country = entity.get("dbpedia:country");
        country = (country.isCollection)? country.at(0) : country;
        country = (_.isArray(country))? country[0] : country;
        window.terkait.util.dbpediaLoader(country, 
        		function (e) {
        		    if (_.isArray(e) && e.length > 0 || e.isEntity)
                        entity.trigger("rerender");
		        }, 
		        function (e) {
		        	console.warn(e);
		        });

        var capital = entity.get("dbprop:capital");
        capital = (capital.isCollection)? capital.at(0) : capital;
        capital = (_.isArray(capital))? capital[0] : capital;
        window.terkait.util.dbpediaLoader(capital, 
        		function (e) {
                    if (_.isArray(e) && e.length > 0 || e.isEntity)
                        entity.trigger("rerender");
		        }, 
		        function (e) {
		        	console.warn(e);
		        });
        
        var largestCity = entity.get("dbpedia:largestCity");
        var capitalSent = ".";
        if (largestCity) {
	        largestCity = (largestCity.isCollection)? largestCity.at(0) : largestCity;
	        window.terkait.util.dbpediaLoader(largestCity, 
	        		function (e) {
                        if (_.isArray(e) && e.length > 0 || e.isEntity)
                            entity.trigger("rerender");
			        }, 
			        function (e) {
			        	console.warn(e);
			        });
	        if (largestCity.getSubject() === capital.getSubject()) {
	        	capitalSent = " which is also the largest city.";
	        } else {
	        	capitalSent = " which is <b>not</b> the largest city.";
        	}
        }

        var area = entity.get("dbpedia:areaTotal");
        
        var abs = jQuery('<div class="abstract">');
        abs.append(map);
        abs.append(jQuery("<div>" + window.terkait.rendering.getLabel(entity) + " is a state in " +
        window.terkait.rendering.getLabel(country) + " with a total area of " + 
        window.terkait.util.humanReadable(parseInt(area) / 1000000) + " km&sup2;. It's capital is " +
        window.terkait.rendering.getLabel(capital) +
        capitalSent + "</div>"));
        
        div.append(abs);
    },
          
    _renderLinkWikiPage: function(entity) {
        var range = entity.get("foaf:page");
        if($.isArray(range)){
        range = range[0];
        }
        var rangeSt = new String(range.id);
        rangeSt = rangeSt.replace(/</i,'').replace(/>/i,'');    
        var prop = $('<p>find out <a target="_blank" href="'+rangeSt+'">MORE</a><br>in Wikipedia</p>');
    
        return prop;
    },
    
    renderMap : function(entity) {
        var res = $('<div class="map_canvas"></div>');
        var latitude = entity.get("geo:lat");
        var longitude = entity.get("geo:long");
        var label = window.terkait.rendering.getLabel(entity);
		var zoom = window.terkait.util.getMapZoomFactor(entity);
        if (latitude && longitude) {
        	latitude = (jQuery.isArray(latitude))? latitude[0] : latitude;
        	longitude = (jQuery.isArray(longitude))? longitude[0] : longitude;
        	window.terkait.util.retrieveLatLongMap(latitude,longitude,zoom,res);
        } else if (label) {
        	window.terkait.util.retrieveKeywordMap(label, res);
        } else {
        	window.terkait.util.retrieveLatLongMap(undefined, undefined, res);
        }
        return res;
    },
	      
    renderDepiction : function(entity) {
        var res = jQuery('<img>');
        var depict = entity.get("dbpedia:thumbnail");
        
        if (depict) {
        	depict = (jQuery.isArray(depict))? depict[0] : depict;
        	depict = depict.replace(/[<>]/g, "");
        	res.attr("src", depict);
        	res.css({
        		"width" : "100px",
        		"height": "auto",
        		"float" : "right",
        		"box-shadow": "5px 7px 6px grey",
        		"margin-left": "10px",
        		"margin-bottom": "10px",
        		"margin-right": "10px"
        	});
        }
        return res;
    },

	renderAge: function(entity){
		var res = '';
		var bdate = entity.get('dbpedia:birthDate');
		bdate = (jQuery.isArray(bdate))? bdate[0] : bdate;
		bdate = bdate? new Date(bdate) : bdate;
		var ddate = entity.get('dbpedia:deathDate');
		ddate = (jQuery.isArray(ddate))? ddate[0] : ddate;
		ddate = ddate? new Date(ddate) : ddate;
		var age = (bdate && ddate)? 
					Math.floor((ddate.getTime()-bdate.getTime())/1000/24/60/60/365) 
					:(bdate? Math.floor(((new Date()).getTime()-bdate.getTime())/1000/24/60/60/365):'-');
		bdate = bdate? window.terkait.util.formatDate(bdate,'dd.mm.yyyy') : bdate;
		ddate = ddate? window.terkait.util.formatDate(ddate,'dd.mm.yyyy') : ddate;
		if(bdate && ddate){
			res = '('+bdate+'-'+ddate+', aged '+age+')';
		}
		else if(bdate){
			res = '(born '+bdate+', age '+age+')';
		}
		else {
			res = '-';
		}
		return res;
	},	
    
    getLabel : function (entity, shorten) {
    	var str =  VIE.Util.extractLanguageString(entity, ["name", "rdfs:label"], window.terkait.settings.language);
    	
    	if (str.length > 21 && shorten) {
    		str = str.substr(0,9) + "..." + str.substr(-9);
    	}
    	return str;
    },
    
    renderRecommendedContent: function (entity, panel) {
        
        var images = jQuery('<div class="recommended-icon">')
        .css({
              "background-image" : "url(" + chrome.extension.getURL("icons/icon_images_sw.png") + ")"
        })
        .hover(function () {
            var $this = $(this);
            $this
            .css({
              "background-image" : "url(" + chrome.extension.getURL("icons/icon_images.png") + ")"
            });
        }, function () {
            var $this = $(this);
            $this
            .css({
              "background-image" : "url(" + chrome.extension.getURL("icons/icon_images_sw.png") + ")"
            });
        })
        .click(function () {
            var $this = $(this);
            var $parent = $this.parents('.accordion').first();
            
            terkait.rendering.registerRecommendedContentDialog($this, $parent, terkait.rendering._renderImages, entity);
        });
        var videos = jQuery('<div class="recommended-icon">')
        .css({
              "background-image" : "url(" + chrome.extension.getURL("icons/icon_videos_sw.png") + ")"
        })
        .hover(function () {
            var $this = $(this);
            $this
            .css({
              "background-image" : "url(" + chrome.extension.getURL("icons/icon_videos.png") + ")"
            });
        }, function () {
            var $this = $(this);
            $this
            .css({
              "background-image" : "url(" + chrome.extension.getURL("icons/icon_videos_sw.png") + ")"
            });
        })
        .click(function () {
            var $this = $(this);
            var $parent = $this.parents('.accordion').first();
            
            terkait.rendering.registerRecommendedContentDialog($this, $parent, terkait.rendering._renderVideos, entity);
        });
        var news = jQuery('<div class="recommended-icon">')
        .css({
              "background-image" : "url(" + chrome.extension.getURL("icons/icon_news_sw.png") + ")"
        })
        .hover(function () {
            var $this = $(this);
            $this
            .css({
              "background-image" : "url(" + chrome.extension.getURL("icons/icon_news.png") + ")"
            });
        }, function () {
            var $this = $(this);
            $this
            .css({
              "background-image" : "url(" + chrome.extension.getURL("icons/icon_news_sw.png") + ")"
            });
        })
        .click(function () {
            var $this = $(this);
            var $parent = $this.parents('.accordion').first();
            
            terkait.rendering.registerRecommendedContentDialog($this, $parent, terkait.rendering._renderNews, entity);
        });
        
        panel
            .append(images)
            .append(videos)
            .append(news);
            
    },
    
    _renderImages : function (entity, contentContainer) {
        
        contentContainer
            .vieImageSearch({
                vie    : window.terkait.vie,
                bin_size: 8,
                lang_id : "en",
                services : {
                    gimage : {
                        use: true
                    }
                },
                render: function(data) {
                    var self = this;
    
                    var objects = self.options.objects;
                    
                    //rendering
                    var container = jQuery('<div>').css('position', 'relative');
                    for (var o = 0; o < objects.length && o < this.options.bin_size; o++) {
                        var obj = objects[o];
                        
                        var id = "img_" + new Date().getTime();
                        
                        var thumb = 
                        jQuery('<img src="' + obj.thumbnail + '" height="56px" width="auto"/>')
                        .data("orig_image_url", obj.original)
                        .data("thumb_image_url", obj.thumbnail)
                        .data("orig_image_id", id)
                        .data("context_url", obj.context)
                        .addClass("terkait-image-item")
                        .mousemove(function(e) {
                        	var thumbUrl = jQuery(this).data("thumb_image_url");
                        	var url = jQuery(this).data("orig_image_url");
                        	var id = jQuery(this).data("orig_image_id");
                        	
                        	var img = jQuery("#" + id);
                        	
                        	if (img.size() === 0) {
                        		window.terkait.util.updateActiveJobs(1);
                        		img = jQuery('<img id="' + id + '" src="' + url + '" height="300px" width="auto"/>')
                        		.appendTo("body")
                        		.css({
                        			"display": "none",
	                            	"z-index" : 99999,
	                            	"position" : "absolute"
                        		})
                        		.load(function () {
                            		window.terkait.util.updateActiveJobs(-1);
                        			var image = jQuery(this);
                        			var height = image.height();
                            		var width = image.width();

                            		image
                            		.css({
    	                            	"display" : "block",
		                                top: (e.pageY - (height / 2)) + "px",
		                                left: (e.pageX - (width + 20)) + "px"
		                            });
                        		})
                                .error(function(){
                                    $(this).attr("src", thumbUrl);
                            		window.terkait.util.updateActiveJobs(-1);
                                });
                        	} else {
                    			var height = img.height();
                        		var width = img.width();
                        		img.css({
	                                top: (e.pageY - (height / 2)) + "px",
	                                left: (e.pageX - (width + 20)) + "px"
	                            });
                        	}
                        })
                        .mouseout(function(e) {
                    		window.terkait.util.updateActiveJobs(-1);
                        	var id = jQuery(this).data("orig_image_id");
                        	
                        	jQuery("#" + id).remove();
                        })
                        .click(function (e) {
                        	var url = jQuery(this).data("context_url");
                        	
                        	if (url) {
                        		window.terkait.communication.sendReq("openUrl", {url : url});
                        	}
                        })
                        .error(function(){
                            $(this).remove();
                        });
                        
                        container.append(thumb);
                    }
                    
                    // clear the container element
                    self.element.empty();
                    container.appendTo(jQuery(self.element));
                    return this;
                }
        });
        
        setTimeout(function () {
            contentContainer
            .vieImageSearch({
                entity: entity
            });
        }, 1);
    },
    
    _renderVideos : function (entity, contentContainer) {
        
        contentContainer
        .vieVideoSearch({
            vie    : window.terkait.vie,
            lang_id : "en",
            bin_size: 4,
            services : {
                gvideo : {
                    use: true
                }
            },
            render: function(data) {
                var self = this;
                
                var $elem = jQuery(self.element);
                $elem.empty();

                var original = data.original.responseData;
                var objects = data.objects;
                
                //render the first video large
                var vid = jQuery('<object>')
                .attr({
                    "width":"213",
                    "height":"160"})
                .css({
                    "display" : "inline",
                    "margin-top" : "0px",
                    "margin-left" : "0px",
                    "margin-right" : "10px",
                    "margin-bottom" : "10px",
                    "float" : "left"
                })
                .append(jQuery('<param>')
                    .attr({
                        "name":"movie",
                        "value":objects[0].original.replace("/embed/", "/v/") + "&rel=0"
                    }))
                .append(jQuery('<param name="wmode" value="opaque" />'))
                .append(jQuery('<embed>')
                    .attr({
                        "type"   : "application/x-shockwave-flash",
                        "src"    : objects[0].original.replace("/embed/", "/v/") + "&rel=0",
                        "width"  : "213",
                        "height" : "160",
                        "wmode"  : "opaque"
                    })
                    .css({
                        "box-shadow": "rgb(128, 128, 128) 5px 7px 6px"
                    }));
                $elem.append(vid);
                
                
                // render all others as previews
                for (var o = 1; o < original.results.length; o++) {
                    var obj = original.results[o];
                    
                    var thumb = jQuery("<img>")
                    .attr("src", obj.tbUrl).attr("height", 55).attr("width", "auto")
                    .css({
                    	"float": "right",
                    	"display" : "block",
                    	"margin-bottom": "10px",
                    	"box-shadow": "rgb(128, 128, 128) 5px 7px 6px"
                    });
                    
                    var anchor = jQuery("<a>")
                    .attr("href", obj.url)
                    .attr("target", "_blank")
                    .attr("title", obj.titleNoFormatting);
                    
                    $elem.append(anchor.append(thumb));
                }
                
                //add title of large video
                var title = jQuery("<div>").css("max-width", "213px").css("float", "left").addClass("terkait-news-item-title").text(original.results[0].titleNoFormatting);
                $elem.append(title);
                
                // clear the container element
                return this;
            }
        });
        
        setTimeout(function () {
            contentContainer
            .vieVideoSearch({
                entity: entity
            });
        }, 1);
    },
    
    _renderNews : function (entity, contentContainer) {
        
        contentContainer
        .vieNewsSearch({
            vie    : window.terkait.vie,
            bin_size: 5,
            services : {
                gnews : {
                    use: true,
                    ned: "us",
                    hl: "en"
                }
            },
            render: function(data) {
                var self = this;
                var objects = self.options.objects;
                
                //rendering
                var container = jQuery('<div>')
				.css({
					'position': 'relative',
					'overflow-y': 'auto',
					'overflow-x': 'hidden',
					'height': '200px'
				});
				
                for (var o = 0; o < objects.length && o < this.options.bin_size; o++) {
                    var obj = objects[o];
                    var border = jQuery('<div>')
                    .css({
                        'background-color': 'white',
                        'padding': '10px'
                    });
                    var newsItem = jQuery('<div class="terkait-news-item">');
					var title = obj.titleNoFormatting? obj.titleNoFormatting: undefined;
					var url = obj.url? obj.url: undefined;
					var content = obj.content? obj.content: undefined;
					var publisher = obj.publisher? obj.publisher: undefined;
					content = String(content).substring(0,100)+"...";
					if (url && title && publisher && content) {
						var shortUrl = (url.length < 50)? url : url.substr(0, 20) + " ... " + url.substr(-20);
						var a = jQuery('<a class="terkait-news-item-title" href="'+url+'" target="_blank">'+publisher+': '+title+'</a>');	
						var source = jQuery('<a class="terkait-news-item-source" href="'+url+'" target="_blank">'+shortUrl+'</a>');
						newsItem.append(a);
						newsItem.append('<br/>');
						newsItem.append(content);
						newsItem.append('<br/>');
						newsItem.append(source);
					}
                    container.append(border.append(newsItem));
                }
                
                // clear the container element
                self.element.empty();
                container.appendTo(jQuery(self.element));
                return this;
            }
        });
        
        setTimeout(function () {
            contentContainer
            .vieNewsSearch({
                entity: entity
            });
        }, 1);
    },
    
    registerRecommendedContentDialog: function (button, parent, renderer, entity) {
        var activated = (button.data('activated'))? button.data('activated') : false;
        if (activated) {
            $('.terkait-recommended-content-dialog')
            .animate({
                left: parent.offset().left,
                opacity: 'hide'
            }, 'slow', function () {
                $(this).remove();
            });
        } else {
            $('.terkait-recommended-content-dialog').remove(); //remove old dialog
            var $container = $('<div>').addClass("terkait-recommended-content-dialog")
            .appendTo($('body')).hide();
            
            renderer(entity, $container);
            $container.css({
                top: parent.offset().top - jQuery('body').scrollTop(),
                left: parent.offset().left
            }).animate({
                left: (parent.offset().left - 330),
                opacity: 'show'
            }, 'slow');
            
            //prevent document.body from scrolling when reaching end of container
            $container.bind('mousewheel DOMMouseScroll', function(e) {
                var scrollTo = null;

                if (e.type == 'mousewheel') {
                    scrollTo = (e.originalEvent.wheelDelta * -1);
                }
                else if (e.type == 'DOMMouseScroll') {
                    scrollTo = 40 * e.originalEvent.detail;
                }

                if (scrollTo) {
                    e.preventDefault();
                    var current = $(this).children().first().scrollTop();
                    $(this).children().first().scrollTop(scrollTo + current);
                }
            });
        }
        button.data('activated', !activated);
    },
    
    //this registers the individual renderer for the differerent types
    _renderer : {
        'Continent' : {
            label : function (entity, div) {
                div.text(window.terkait.rendering.getLabel(entity, true));
            },
            left : function (entity, div) {
                window.terkait.rendering.renderRecommendedContent(entity, div);
            },
            right : function (entity, div) {
                window.terkait.rendering.renderContinent(entity, div);
            }
        },
        'Country' : {
            label : function (entity, div) {
                div.text(window.terkait.rendering.getLabel(entity, true));
            },
            left : function (entity, div) {
                window.terkait.rendering.renderRecommendedContent(entity, div);
            },
            right : function (entity, div) {
                window.terkait.rendering.renderCountry(entity, div);
            }
        },
        'State' : {
            label : function (entity, div) {
                div.text(window.terkait.rendering.getLabel(entity, true));
            },
            left : function (entity, div) {
                window.terkait.rendering.renderRecommendedContent(entity, div);
            },
            right : function (entity, div) {
            	window.terkait.rendering.renderState(entity, div);
            }
        },
        'City' : {
            label : function (entity, div) {
                div.text(window.terkait.rendering.getLabel(entity, true));
            },
            left : function (entity, div) {
                window.terkait.rendering.renderRecommendedContent(entity, div);
            },
            right : function (entity, div) {
                window.terkait.rendering.renderCity(entity, div);
            }
        },
        'Place' : {
            label : function (entity, div) {
                div.text(window.terkait.rendering.getLabel(entity, true));
            },
            left : function (entity, div) {
                window.terkait.rendering.renderRecommendedContent(entity, div);
            },
            right : function (entity, div) {
                window.terkait.rendering.renderPlace(entity, div);
            }
        },
        'Person' : {
            label : function (entity, div) {
                div.text(window.terkait.rendering.getLabel(entity, true));
            },
            left : function (entity, div) {
                window.terkait.rendering.renderRecommendedContent(entity, div);
            },
            right : function (entity, div) {
                window.terkait.rendering.renderPerson(entity, div);
            }
        },
        'Artist' : {
            label : function (entity, div) {
                div.text(window.terkait.rendering.getLabel(entity, true));
            },
            left : function (entity, div) {
                window.terkait.rendering.renderRecommendedContent(entity, div);
            },
            right : function (entity, div) {
                window.terkait.rendering.renderArtist(entity, div);
            }
        },
        'Athlete' : {
            label : function (entity, div) {
                div.text(window.terkait.rendering.getLabel(entity, true));
            },
            left : function (entity, div) {
                window.terkait.rendering.renderRecommendedContent(entity, div);
            },
            right : function (entity, div) {
                window.terkait.rendering.renderAthlete(entity, div);
            }
        },
        'Politician' : {
            label : function (entity, div) {
                div.text(window.terkait.rendering.getLabel(entity, true));
            },
            left : function (entity, div) {
                window.terkait.rendering.renderRecommendedContent(entity, div);
            },
            right : function (entity, div) {
                window.terkait.rendering.renderPolitician(entity, div);
            }
        },
        'Scientist' : {
            label : function (entity, div) {
                div.text(window.terkait.rendering.getLabel(entity, true));
            },
            left : function (entity, div) {
                window.terkait.rendering.renderRecommendedContent(entity, div);
            },
            right : function (entity, div) {
                window.terkait.rendering.renderScientist(entity, div);
            }
        },
        'MilitaryPerson' : {
            label : function (entity, div) {
                div.text(window.terkait.rendering.getLabel(entity, true));
            },
            left : function (entity, div) {
                window.terkait.rendering.renderRecommendedContent(entity, div);
            },
            right : function (entity, div) {
                window.terkait.rendering.renderMilitaryPerson(entity, div);
            }
        }/*,
        'Thing' : {
            label : function (entity, div) {
                div.text(window.terkait.rendering.getLabel(entity, true));
            },
            left : function (entity, div) {
                window.terkait.renderRecommendedContent(entity, div);
            },
            right : function (entity, div) {
                div.text("Thing");
            }
        }*/
    }
    
});
