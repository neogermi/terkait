if (!window.terkait) {
    window.terkait = {};
}

window.terkait.rendering = {};

jQuery.extend(window.terkait.rendering, {
    
    createContentView : function(entity, parentEl, unfold) {
        var ContentView = Backbone.View.extend({
        	
        	folded: true,

            className : "terkait-card-content",
            
            initialize : function() {
            	this.folded = !unfold;
            	
            	this.foldAction = function (view) {
                	return function () {
                		var foldButton = jQuery(view.el).find(".terkait-button.terkait-fold").first();
                		var $accord = jQuery(view.el).parents('.terkait-accordion').first();
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
                }(this);
            	
                // bind the entitie's "rerender" event to a rerendering of the VIEW
                this.model.bind("rerender", this.render, this);

                var front = jQuery("<div>").addClass("terkait-front");
                var back = jQuery("<div>").addClass("terkait-back");
                
                var labelElem = jQuery("<div>").addClass("terkait-card-label")
                .css({"cursor" : "pointer"})
                .click(this.foldAction);
                var leftElem = jQuery("<div>").addClass("terkait-recommended-content");
                var rightElem = jQuery("<div>").addClass("terkait-entity-details");
                
                var $el = jQuery(this.el);
                
                $el
                .append(front)
                .append(back)
                .appendTo(parentEl);
                
                front
                .append(labelElem)
                .append(leftElem)
                .append(rightElem);
                                
                back.css("display", "none")//.append(window.terkait.rendering._renderEntityEditor(this.model));
                ;
                
                var foldButton = window.terkait.rendering.createFoldButton();
                var $accord = $el.parents('.terkait-accordion').first();
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
                .click(this.foldAction);
                
                /* TODO: editing will be available in v1.1
                var editButton = window.terkait.rendering.createEditButton();
                editButton
                .hide()
                .css({"position":"absolute", top: "0px", right: "0px"})
                .appendTo(front)
                .click(function (view) {
                	return function () {
                		jQuery(view.el).css("-webkit-transform", "rotateY(-180deg)");
                		jQuery(this).parent().find(".terkait-button").hide();
                		
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
                    var labelElem = jQuery(".terkait-card-label", $el).empty();
                    var leftElem = jQuery(".terkait-recommended-content", $el).empty();
                    var rightElem = jQuery(".terkait-entity-details", $el).empty();
                    try {
                    renderer["label"](this.model, labelElem);
                    renderer["left"](this.model, leftElem);
                    renderer["right"](this.model, rightElem);
                    window.terkait.util.hyphenateElem(rightElem.find(".terkait-abstract"));
                    $el.parent().show();
                    } catch (e) {
                    	console.warn("Error during rendering", this.model, e);
                        $el.parent().hide();
                    }
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
	      .addClass('terkait-button')
	      .css({
	          "background-image" : "url(" + chrome.extension.getURL("icons/check-false.png") + ")"
	      })
	      .attr("title", chrome.i18n.getMessage("closeButtonMsg"));
	  },
	  
	  createFoldButton : function () {
		    return jQuery('<div>')
		      .addClass('terkait-button')
		      .addClass('terkait-fold')
		      .css({
		          "background-image" : "url(" + chrome.extension.getURL("icons/icon_play.png") + ")"
		      })
		      .attr("title", chrome.i18n.getMessage("foldButtonMsg"));
		  },
	  
    createEditButton : function () {
      return jQuery('<div>')
      .addClass('terkait-button')
        .css({
            "background-image" : "url(" + chrome.extension.getURL("icons/info.png") + ")"
        });
    },
	    
    createFinishEditButton : function () {
      return jQuery('<div>')
      .addClass('terkait-button')
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
        	accordionContainer = jQuery(opts.selector).parent('.terkait-accordion').first();
        } else {
        	numEntitiesShown = jQuery("#terkait-container .terkait-entities .terkait-accordion")
        	.filter(function () {
        		var w = jQuery(this).width();
        		var h = jQuery(this).height();
        		var isHidden = jQuery(this).css("display") === "none";
        		return w * h > 0 && !isHidden;
        	}).size();
        	if (numEntitiesShown < window.terkait.settings.maxEntities) {
	            accordionContainer = jQuery('<div>')
	            .addClass("terkait-accordion")
	            .hide()
	            .appendTo(jQuery('#terkait-container .terkait-entities'));
                entity.set("terkaitRendered", true);
        	}
        }
        
        if (accordionContainer) {
	        // create the VIEW on that entity
	        this.createContentView(entity, accordionContainer, (numEntitiesShown < 3));
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
        whiteTypes.push("owl:Thing");        
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
        div.addClass("terkait-person");
        var img = window.terkait.rendering.renderDepiction(entity);
        var abs = jQuery('<div class="terkait-abstract">');
		var age = window.terkait.rendering.renderAge(entity);
        abs.append(img);
        abs.append(jQuery("<div>" + window.terkait.rendering.getLabel(entity) + " " + age + " is a person.</div>"));
        abs.append(jQuery("<i> We don't know much about this person yet - but are currently querying semantic services to get more information.</i>"));
        
        div.append(abs);
    },
	
	renderArtist : function (entity, div) {
        div.addClass("terkait-artist");
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
			genre = (genre.isCollection)? genre.at(0): genre;
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

		var abs = jQuery('<div class="terkait-abstract">');
        abs.append(img);
		abs.append(jQuery("<div>" + label + " " + age + (isLiving? " is ": " was ") + nat + " " + occupation + genre + ".</div>"));
        div.append(abs);
    },

	renderAthlete : function (entity, div) {
        div.addClass("terkait-athlete");
        var img = window.terkait.rendering.renderDepiction(entity);
        var age = window.terkait.rendering.renderAge(entity);
		var isLiving = !entity.has('dbpedia:deathDate');
        var weight = entity.get('dbpedia:weight');
		var height = entity.get('dbpedia:height');
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
		var abs = jQuery('<div class="terkait-abstract">');
        abs.append(img);
        abs.append(jQuery("<div>" + window.terkait.rendering.getLabel(entity) + " " + age + (isLiving? " is ": " was ") + nat + occupation + ".</div>"));
		div.append(abs);
		if(weight){
	        weight = (weight.isCollection)? weight.at(0): weight;
			weight = (jQuery.isArray(weight))? weight[0]: weight;
			div.append('Weight: ' + weight / 1000 + ' kg<br/>');
		};
		if(height){
			height = (height.isCollection)? height.at(0): height;
			height = (jQuery.isArray(height))? height[0]: height;
			div.append('Height: ' + height + ' m');
		};
		if(country){
			country = (country.isCollection)? country.at(0): country;
			country = (jQuery.isArray(country))? country[0]: country;
			window.terkait.util.dbpediaLoader(country, 
        		function (e) {
                    if (_.isArray(e) && e.length > 0 || e.isEntity)
                        entity.trigger("rerender");
		        }, 
		        function (e) {
		        	console.warn(e);
		        });
				div.append('Country: ' + jQuery('<span class="terkait-country">' + window.terkait.rendering.getLabel(country) + '</span>'));
		};
    },
    
	renderPolitician : function (entity, div) {
        div.addClass("terkait-politician");
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
		if(party){
			party = (party.isCollection)? party.at(0): party;
			party = (jQuery.isArray(party))? party[0]: party;
			window.terkait.util.dbpediaLoader(party, 
        		function (e) {
                    if (_.isArray(e) && e.length > 0 || e.isEntity)
                        entity.trigger("rerender");
		        }, 
		        function (e) {
		        	console.warn(e);
		        });
			party = ', affiliated with the <span class="terkait-party">' + window.terkait.rendering.getLabel(party) + '</span>';
		}
		else{
			party = '';
		};
		var dpt = VIE.Util.extractLanguageString(entity, ["dbprop:department"], window.terkait.settings.language);
		dpt = (jQuery.isArray(dpt))? (', working at ' + dpt[0].replace(/_/g, " ")): '';
		var abs = jQuery('<div class="terkait-abstract">');
        abs.append(img);
        abs.append(jQuery("<div>" + window.terkait.rendering.getLabel(entity) + " " + age + (isLiving? " is ": " was ") + nat + occupation + dpt + party + ".</div>"));
        div.append(abs);
    },
	
	renderScientist : function (entity, div) {
        div.addClass("terkait-scientist");
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
		institution = institution? (', ' + isLiving? 'working': 'worked' + 'at <span class = "terkait-institution">' + institution + "</span>"): '';
		var abs = jQuery('<div class="terkait-abstract">');
        abs.append(img);
        abs.append(jQuery("<div>" + window.terkait.rendering.getLabel(entity) + " " + age + (isLiving? " is ": " was ") + nat + occupation + institution + ".</div>"));
        
        div.append(abs);
    },
	
	renderMilitaryPerson : function (entity, div) {
        div.addClass("terkait-militaryPerson");
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
			branch = (branch.isCollection)? branch.at(0): branch;
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
		var abs = jQuery('<div class="terkait-abstract">');
        abs.append(img);
        abs.append(jQuery("<div>" + window.terkait.rendering.getLabel(entity) + " " + age + (isLiving? " is ": " was ") + nat + occupation + branch + ".</div>"));
        
        div.append(abs);
    },
	
    renderCountry : function (entity, div) {
        div.addClass("terkait-country");
        var map = window.terkait.rendering.renderMap(entity);
        
        var capital = entity.get("dbprop:capital");
        var capSentence = "";
        if (capital) {
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
	        
	        var lbl = window.terkait.rendering.getLabel(capital);
	        if (lbl) {
	        	capSentence = " It's capital is " + lbl + ".";
	        }
        }
        
        var pop = entity.get("dbpedia:populationTotal");
        var popSentence = " is a country";
        if (pop) {
        	popSentence = " with a population of " + window.terkait.util.humanReadable(pop);
        }
        
        var area = entity.get("dbpedia:areaTotal");
        var areaSentence = "";
        if (area) {
        	areaSentence = " and a total area of " + (window.terkait.util.humanReadable(area, 1000000)) + " km&sup2;";
        }
        
        var abs = jQuery('<div class="terkait-abstract">');
        abs.append(map);
        abs.append(jQuery("<div>" + window.terkait.rendering.getLabel(entity) + popSentence + areaSentence + "." + capSentence + "</div>"));

        if (!pop && !area && !capital) {
        	abs.append(jQuery("<i> We don't know much about this country yet - but are currently querying semantic services to get more information.</i>"));
    	}
        
        div.append(abs);
    },
    
    renderContinent : function (entity, div) {
        div.addClass("terkait-continent");
        var map = window.terkait.rendering.renderMap(entity);
        
        var pop = entity.get("dbpedia:populationTotal");
        var popSentence = " is a continent";
        if (pop) {
        	popSentence = " with a population of " + window.terkait.util.humanReadable(pop);
        }
        
        var area = entity.get("dbpedia:areaTotal");
        var areaSentence = "";
        if (area) {
        	areaSentence = " and a total area of " + (window.terkait.util.humanReadable(area, 1000000)) + " km&sup2;";
        }
        
        var countr = entity.get("dbprop:countries");
        var countrSentence = "";
        if (countr) {
        	countrSentence = " It comprises " + window.terkait.util.humanReadable(countr) + " countries.";
        }
        
        var abs = jQuery('<div class="terkait-abstract">');
        abs.append(map);
        abs.append(jQuery("<div>" + window.terkait.rendering.getLabel(entity) + popSentence + areaSentence + "." + countrSentence + "</div>"));
        
        if (!pop && !area && !countr) {
        	abs.append(jQuery("<i> We don't know much about this continent yet - but are currently querying semantic services to get more information.</i>"));
    	}
                
        div.append(abs);
    },
    
    renderPlace : function (entity, div) {
    	div.addClass("terkait-place");
        var map = window.terkait.rendering.renderMap(entity);
        
        var abs = jQuery('<div class="terkait-abstract">');
        abs.append(map);
        abs.append(jQuery("<div>" + window.terkait.rendering.getLabel(entity) + " is a place.</div>"));
        abs.append(jQuery("<i> We don't know much about this place yet - but are currently querying semantic services to get more information.</i>"));
        
        div.append(abs);
    },
    
    renderCity : function (entity, div) {
        div.addClass("terkait-city");
        var map = window.terkait.rendering.renderMap(entity);
        div.append(map);
        
        //collect information from connected entities!
        var country = entity.get("dbpedia:country");
        var countrySentence = "";
        if (country) {
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
            
            var lbl = window.terkait.rendering.getLabel(country);
            if (lbl) {            
            	countrySentence = " in " + lbl;
            }
        }
        
        var pop = entity.get("dbpedia:populationTotal");
        var popSentence = "";
        if (pop) {
        	popSentence = " with a population of " + window.terkait.util.humanReadable(pop);
        }
        
        var abs = jQuery('<div class="terkait-abstract">');
        abs.append(jQuery("<div>" + window.terkait.rendering.getLabel(entity) + " is a city" + countrySentence + popSentence + ".</div>"));

        if (!country && !pop) {
        	abs.append(jQuery("<i> We don't know much about this city yet - but are currently querying semantic services to get more information.</i>"));
    	}
                
        div.append(abs);
    },
    
    renderState : function (entity, div) {
        div.addClass("terkait-state");
        var map = window.terkait.rendering.renderMap(entity);
        
        var capital = entity.get("dbprop:capital");
        var capSentence = "";
        if (capital) {
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
	        
	        var lbl = window.terkait.rendering.getLabel(capital);
	        if (lbl) {
	        	capSentence = " It's capital is " + lbl;
	        }
        }
        
          var largestCity = entity.get("dbpedia:largestCity");
	      var largestCitySentence = "";
	      if (largestCity) {
		        largestCity = (largestCity.isCollection)? largestCity.at(0) : largestCity;
		        largestCity = (_.isArray(largestCity))? largestCity[0] : largestCity;
		        window.terkait.util.dbpediaLoader(largestCity, 
		        		function (e) {
	                      if (_.isArray(e) && e.length > 0 || e.isEntity)
	                          entity.trigger("rerender");
				        }, 
				        function (e) {
				        	console.warn(e);
				        });
		        if (largestCity.isEntity && capital.isEntity) {
		        	if (largestCity.getSubject() === capital.getSubject()) {
		        		capitalSent = " which is also the largest city";
		        	} else {
			        	capitalSent = " which is <b>not</b> the largest city";
		        	}
		        }
	      }
        
        var country = entity.get("dbpedia:country");
        var countrySentence = "";
        if (country) {
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
            
            var lbl = window.terkait.rendering.getLabel(country);
            if (lbl) {            
            	countrySentence = " in " + lbl;
            }
        }
        
        var area = entity.get("dbpedia:areaTotal");
        var areaSentence = "";
        if (area) {
        	areaSentence = " and a total area of " + (window.terkait.util.humanReadable(area, 1000000)) + " km&sup2;";
        }
        
        var abs = jQuery('<div class="terkait-abstract">');
        abs.append(map);
        abs.append(jQuery("<div>" + window.terkait.rendering.getLabel(entity) + " is a state" + countrySentence + areaSentence + "." + capSentence + largestCitySentence + ".</div>"));
        
        if (!country && !area && !capital) {
        	abs.append(jQuery("<i> We don't know much about this state yet - but are currently querying semantic services to get more information.</i>"));
    	}
        
        div.append(abs);
    },
    
	renderOrganization : function (entity, div) {
    	div.addClass("terkait-organization");
        //var map = window.terkait.rendering.renderMap(entity);
		var img = window.terkait.rendering.renderDepiction(entity);
		var orgBasics = " an organization" + window.terkait.rendering.renderOrgBasics(entity);
		var abs = jQuery('<div class="terkait-abstract">');
        abs.append(img);
        abs.append(jQuery("<div>" + window.terkait.rendering.getLabel(entity) + " is " + orgBasics + ".</div>"));
        
        div.append(abs);
    },
    
	renderCompany : function (entity, div) {
    	div.addClass("terkait-company");
        //var map = window.terkait.rendering.renderMap(entity);
		var img = window.terkait.rendering.renderDepiction(entity);
		
		var abs = jQuery('<div class="terkait-abstract">');
        abs.append(img);
		var orgBasics = " a company" + window.terkait.rendering.renderOrgBasics(entity);
		var industry = (entity.has("dbpedia:industry"))? entity.get("dbpedia:industry"): VIE.Util.extractLanguageString(entity, ["dbpedia:industry","dpprop: industry"], window.terkait.settings.language);
		if(industry){
			industry = jQuery.isArray(industry)? industry: [industry];
			for(var i = 0; i < industry.length; i++){
				var g = industry[i];
				g = (VIE.Util.isUri(g))? g.substring(g.lastIndexOf("/")+1,g.length-1): g.replace(/["]/g, "").replace(/@[a-z]+/, '').trim();
				g = g.replace(/_/gi, " ");
				g = window.terkait.util.decapitaliseFirstLetter(g);
				industry[i] = g;
			}
			industry = ", it operates in " + ((industry.length>1)? industry.join(", ") + " industries": industry[0] + " industry");
		};
		industry = (industry)? industry: "";
		var revenue = VIE.Util.extractLanguageString(entity, ["dbprop:revenue"], window.terkait.settings.language);
		revenue = (revenue)? window.terkait.util.decapitaliseFirstLetter(revenue): revenue;
		revenue = (revenue && revenue!='not for profit')? ", it's revenue is " + revenue: "";
        abs.append(jQuery("<div>" + window.terkait.rendering.getLabel(entity) + " is " + orgBasics + industry + revenue + ".</div>"));
        
        div.append(abs);
    },
	
	renderMilitaryUnit : function (entity, div) {
    	div.addClass("terkait-militaryUnit");
        //var map = window.terkait.rendering.renderMap(entity);
		var img = window.terkait.rendering.renderDepiction(entity);
		var branch = entity.get('dbprop:branch');
		if(branch){
			branch = (branch.isCollection)? branch.at(0): branch;
			branch = jQuery.isArray(branch)? branch: [branch];
			for(var i = 0; i < branch.length; i++){
				var bra = branch[i];
				bra = (VIE.Util.isUri(bra))? bra.substring(bra.lastIndexOf("/")+1,bra.length-1): bra.replace(/["]/g, "").replace(/@[a-z]+/, '').trim();
				bra = bra.replace(/_/gi, " ");
				branch[i] = bra;
			}
			branch = (branch.length>1)? branch.join(", "): branch[0];
			branch = ' of ' + branch;
		}
		else{
			branch = '';
		}
		var abs = jQuery('<div class="terkait-abstract">');
        abs.append(img);
		var orgBasics = " a military unit" + window.terkait.rendering.renderOrgBasics(entity);
        abs.append(jQuery("<div>" + window.terkait.rendering.getLabel(entity) + " is " + orgBasics + branch + ".</div>"));
        
        div.append(abs);
    },
	
	renderSportsTeam : function (entity, div) {
    	div.addClass("terkait-sportsTeam");
		var img = window.terkait.rendering.renderDepiction(entity);
		var founded = VIE.Util.extractLanguageString(entity, ["dbprop:founded"], window.terkait.settings.language);
		founded = (founded && founded!="")? ", founded in " + founded: "";
		var division = VIE.Util.extractLanguageString(entity, ["dbpedia:league","dbprop:division"], window.terkait.settings.language);
		division = (division && division!="" && !VIE.Util.isUri(division))? ", playing in " + division: ""; //TODO handle <dbpedia resources>
		var coach = VIE.Util.extractLanguageString(entity, ["dbpedia:manager","dbprop:headCoach"], window.terkait.settings.language);
		coach = (coach && coach!="")? ", its head coach is " + coach: "";
		var position = VIE.Util.extractLanguageString(entity, ["dbpedia:position","dbprop:position"], window.terkait.settings.language);
		position = (position && position!="")? ", its ranking is " + position: "";
		var abs = jQuery('<div class="terkait-abstract">');
        abs.append(img);
		var orgBasics = " a sports team" + window.terkait.rendering.renderOrgBasics(entity);
        abs.append(jQuery("<div>" + window.terkait.rendering.getLabel(entity) + " is " + orgBasics + division + position + founded + coach + ".</div>"));
        
        div.append(abs);
    },
	
	renderBand : function (entity, div) {
    	div.addClass("terkait-band");
		var img = window.terkait.rendering.renderDepiction(entity);
		var genre = entity.get("dbprop:genre");
		if(genre){
			genre = (genre.isCollection)? genre.at(0): genre;
			genre = jQuery.isArray(genre)? genre: [genre];
			for(var i = 0; i < genre.length; i++){
				var g = genre[i];
				g = (VIE.Util.isUri(g))? g.substring(g.lastIndexOf("/")+1,g.length-1): g.replace(/["]/g, "").replace(/@[a-z]+/, '').trim();
				g = g.replace(/_/gi, " ");
				g = window.terkait.util.decapitaliseFirstLetter(g);
				genre[i] = g;
			}
			genre = (genre.length>1)? genre.join(", "): genre[0];
			genre = ', performing in genre: ' + genre;
			
		}
		else{
			genre = '';
		}
		var abs = jQuery('<div class="terkait-abstract">');
        abs.append(img);
		var orgBasics = " a band" + window.terkait.rendering.renderOrgBasics(entity);
        abs.append(jQuery("<div>" + window.terkait.rendering.getLabel(entity) + " is " + orgBasics + genre + ".</div>"));
        
        div.append(abs);
    },
	
	renderNonProfitOrganisation : function (entity, div) {
    	div.addClass("terkait-nonProfitOrganisation");
        //var map = window.terkait.rendering.renderMap(entity);
		var img = window.terkait.rendering.renderDepiction(entity);
		var founded = VIE.Util.extractLanguageString(entity, ["dbprop:foundedDate"], window.terkait.settings.language);
		founded = (founded && founded!="")? ", founded " + founded: "";
		var abs = jQuery('<div class="terkait-abstract">');
        abs.append(img);
		var orgBasics = " a non profit organization" + window.terkait.rendering.renderOrgBasics(entity);
        abs.append(jQuery("<div>" + window.terkait.rendering.getLabel(entity) + " is " + orgBasics + founded + ".</div>"));
        
        div.append(abs);
    },
	
	renderEducationalInstitution : function (entity, div) {
    	div.addClass("terkait-educationalInstitution");
        //var map = window.terkait.rendering.renderMap(entity);
		var img = window.terkait.rendering.renderDepiction(entity);
		
		var abs = jQuery('<div class="terkait-abstract">');
        abs.append(img);
		var orgBasics = " an educational institution" + window.terkait.rendering.renderOrgBasics(entity);
        abs.append(jQuery("<div>" + window.terkait.rendering.getLabel(entity) + " is " + orgBasics + ".</div>"));
        
        div.append(abs);
    },
	
	renderLegislature : function (entity, div) {
    	div.addClass("terkait-legislature");
        //var map = window.terkait.rendering.renderMap(entity);
		var img = window.terkait.rendering.renderDepiction(entity);
		
		var abs = jQuery('<div class="terkait-abstract">');
        abs.append(img);
		var orgBasics = " a ligislature" + window.terkait.rendering.renderOrgBasics(entity);
        abs.append(jQuery("<div>" + window.terkait.rendering.getLabel(entity) + " is " + orgBasics + ".</div>"));
        
        div.append(abs);
    },
	
	renderOrgBasics : function (entity) {
		var location = entity.get("dbpedia:location");
		var locationSentence = '';
		if (location) {
            location = (location.isCollection)? location.at(0) : location;
            location = (_.isArray(location))? location[0] : location;
            window.terkait.util.dbpediaLoader(location, 
            		function (e) {
                        if (_.isArray(e) && e.length > 0 || e.isEntity)
                            entity.trigger("rerender");
    		        }, 
    		        function (e) {
    		        	console.warn(e);
    		        });
            
            var lbl = window.terkait.rendering.getLabel(location);
            if (lbl) {            
            	locationSentence = ', located in <span class="">' + lbl + '</span>';
            }
        }
		var areaServed = VIE.Util.extractLanguageString(entity, ["dbprop:areaServed"], window.terkait.settings.language);
		areaServed = (areaServed && areaServed!="")? ", serving " + ((areaServed=="Worldwide")? areaServed: " worldwide"): "";
		var orgBasics = locationSentence + areaServed; 
		return orgBasics;
	},
	
    renderMap : function(entity) {
        var res = jQuery('<div class="terkait-map_canvas"></div>');
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
        	res.attr("width", "100px");
        	res.attr("height", "auto");
        	res.css({
        		"width" : "100px",
        		"height": "auto",
        		"float" : "right",
        		"box-shadow": "5px 7px 6px grey",
        		"margin-left": "10px",
        		"margin-bottom": "10px",
        		"margin-right": "10px"
        	})
        	.error(function () {
        		jQuery(this).removeAttr("src");
        	});
        } else {
        	res.attr("width", "100px");
        	res.attr("height", "150px");
        	res.css({
        		"width" : "100px",
        		"height": "150px",
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
    	
    	if (str && shorten && str.length > shorten) {
    		str = str.substr(0,(shorten/2 - 1)) + "..." + str.substr((shorten/2 - 1) * -1);
    	}
    	return str;
    },
    
    renderRecommendedContent: function (entity, panel) {
                
        var images = jQuery('<div class="terkait-recommended-icon">')
        .addClass("correct-relevant")
        .attr("title", chrome.i18n.getMessage("correctRelevantButtonMsg"))
        .hover(function () {
            var $this = jQuery(this);
            $this.addClass("hover");
        }, function () {
            var $this = jQuery(this);
            $this.removeClass("hover");
        })
        .click(function (e) { return function () {
            var $this = jQuery(this);
            var $parent = $this.parents('.terkait-recommended-content').first();
            
            if ($this.hasClass("active")) {
                $this.removeClass("active");
            } else {
                $parent.find('.active').removeClass('active');
                $this.addClass("active");
                e.set("terkait-status", "correctRelevant");
            }
            //TODO: window.terkait.util.sendFeedbackLREC12(uri, text, surface, offset, 0);
        }; } (entity));
        var videos = jQuery('<div class="terkait-recommended-icon">')
        .addClass("correct-notrelevant")
          .attr("title", chrome.i18n.getMessage("correctNotRelevantButtonMsg"))
          .hover(function () {
              var $this = jQuery(this);
              $this.addClass("hover");
          }, function () {
              var $this = jQuery(this);
              $this.removeClass("hover");
          })
          .click(function (e) { return function () {
              var $this = jQuery(this);
              var $parent = $this.parents('.terkait-recommended-content').first();
              
              if ($this.hasClass("active")) {
                  $this.removeClass("active");
              } else {
                  $parent.find('.active').removeClass('active');
                  $this.addClass("active");
                  e.set("terkait-status", "correctNotRelevant");
              }
            //TODO: window.terkait.util.sendFeedbackLREC12(uri, text, surface, offset, 1);
        }; } (entity));
        var news = jQuery('<div class="terkait-recommended-icon">')
        .addClass("incorrect")
          .attr("title", chrome.i18n.getMessage("incorrectButtonMsg"))
          .hover(function () {
              var $this = jQuery(this);
              $this.addClass("hover");
          }, function () {
              var $this = jQuery(this);
              $this.removeClass("hover");
          })
          .click(function (e) { return function () {
              var $this = jQuery(this);
              var $parent = $this.parents('.terkait-recommended-content').first();
              
              if ($this.hasClass("active")) {
                  $this.removeClass("active");
              } else {
                  $parent.find('.active').removeClass('active');
                  $this.addClass("active");
                  e.set("terkait-status", "incorrect");
              }
            //TODO: window.terkait.util.sendFeedbackLREC12(uri, text, surface, offset, 2);
        }; } (entity));
        

        var status = entity.get("terkait-status");
        status = (status)? status : "";
        if (status === "correctRelevant") {
            images.addClass("active");
        }
        if (status === "correctNotRelevant") {
            images.addClass("active");
        }
        if (status === "incorrect") {
            images.addClass("active");
        }
        
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
	                            	"z-index" : 99999999,
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
                                    jQuery(this).attr("src", thumbUrl);
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
                            jQuery(this).remove();
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
                youtube : {
                    use: true
                }
            },
            render: function(data) {
                var self = this;
                
                var $elem = jQuery(self.element);
                $elem.empty();

                var objects = data.objects;
                if (objects.length > 0) {
	                //render the first video large
	                console.log(objects[0].original);
	                var vid = jQuery('<iframe>')
	                .attr({
	                    "width":"213",
	                    "height":"160",
	                    "frameborder" : 0,
	                    "wmode" : "opaque",
	                    "src" : "http://www.youtube.com/embed/" + objects[0].id + "?wmode=transparent"})
	                .css({
	                    "display" : "inline",
	                    "margin-top" : "0px",
	                    "margin-left" : "0px",
	                    "margin-right" : "10px",
	                    "margin-bottom" : "10px",
	                    "float" : "left"
	                });
	                $elem.append(vid);
                
	                // render all others as previews
	                for (var o = 1; o < objects.length; o++) {
	                    var obj = objects[o];
	                    
	                    var thumb = jQuery("<img>")
	                    .attr("src", obj.thumbnail).attr("height", 55).attr("width", "auto")
	                    .css({
	                    	"float": "right",
	                    	"display" : "block",
	                    	"margin-bottom": "10px",
	                    	"box-shadow": "rgb(128, 128, 128) 5px 7px 6px"
	                    });
	                    
	                    var anchor = jQuery("<a>")
	                    .attr("href", obj.original)
	                    .attr("target", "_blank")
	                    .attr("title", obj.title);
	                    
	                    $elem.append(anchor.append(thumb));
	                }
	                
	                //add title of large video
	                var title = jQuery("<div>")
	                .css("max-width", "213px")
	                .css("float", "left")
	                .addClass("terkait-news-item-title")
	                .text(objects[0].title);
	                $elem.append(title);
                } else {
                	var name = VIE.Util.extractLanguageString(entity, ["rdfs:label", "name"], ["en"]);
                    $elem.append("Sorry, no videos have been found that were related" + ((name)? (" to " + name) : "") + ".");
                }
                
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
            bin_size: 8,
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
            jQuery('.terkait-recommended-content-dialog')
            .animate({
                left: parent.offset().left,
                opacity: 'hide'
            }, 'slow', function () {
                jQuery(this).remove();
            });
        } else {
            jQuery('.terkait-recommended-content-dialog').remove(); //remove old dialog
            var $container = jQuery('<div>').addClass("terkait-recommended-content-dialog")
            .appendTo(jQuery('body')).hide();
            
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
                    var current = jQuery(this).children().first().scrollTop();
                    jQuery(this).children().first().scrollTop(scrollTo + current);
                }
            });
        }
        button.data('activated', !activated);
    },
    
    //this registers the individual renderer for the differerent types
    _renderer : {
        'Continent' : {
            label : function (entity, div) {
            	div.append(jQuery('<div>')
          		      .css({
	          		    	"width": "16px",
		          		    "height": "16px",
		          		    "position": "absolute",
		          		    "left": "6px",
		          		    "top": "5px",
          		            "background-image" : "url(" + chrome.extension.getURL("icons/icon_place.png") + ")"
          		      }));
                div.append(jQuery("<div class=\"terkait-lbl\">" + window.terkait.rendering.getLabel(entity, 16) + "</div>"));
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
            	div.append(jQuery('<div>')
          		      .css({
	          		    	"width": "16px",
		          		    "height": "16px",
		          		    "position": "absolute",
		          		    "left": "6px",
		          		    "top": "5px",
          		            "background-image" : "url(" + chrome.extension.getURL("icons/icon_country.png") + ")"
          		      }));
                div.append(jQuery("<div class=\"terkait-lbl\">" + window.terkait.rendering.getLabel(entity, 16) + "</div>"));
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
            	div.append(jQuery('<div>')
          		      .css({
	          		    	"width": "16px",
		          		    "height": "16px",
		          		    "position": "absolute",
		          		    "left": "6px",
		          		    "top": "5px",
          		            "background-image" : "url(" + chrome.extension.getURL("icons/icon_place.png") + ")"
          		      }));
                div.append(jQuery("<div class=\"terkait-lbl\">" + window.terkait.rendering.getLabel(entity, 16) + "</div>"));
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
            	div.append(jQuery('<div>')
          		      .css({
	          		    	"width": "16px",
		          		    "height": "16px",
		          		    "position": "absolute",
		          		    "left": "6px",
		          		    "top": "5px",
          		            "background-image" : "url(" + chrome.extension.getURL("icons/icon_place.png") + ")"
          		      }));
                div.append(jQuery("<div class=\"terkait-lbl\">" + window.terkait.rendering.getLabel(entity, 16) + "</div>"));
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
            	div.append(jQuery('<div>')
          		      .css({
	          		    	"width": "16px",
		          		    "height": "16px",
		          		    "position": "absolute",
		          		    "left": "6px",
		          		    "top": "5px",
          		            "background-image" : "url(" + chrome.extension.getURL("icons/icon_place.png") + ")"
          		      }));
                div.append(jQuery("<div class=\"terkait-lbl\">" + window.terkait.rendering.getLabel(entity, 16) + "</div>"));
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
            	div.append(jQuery('<div>')
          		      .css({
	          		    	"width": "16px",
		          		    "height": "16px",
		          		    "position": "absolute",
		          		    "left": "6px",
		          		    "top": "5px",
          		            "background-image" : "url(" + chrome.extension.getURL("icons/icon_person.png") + ")"
          		      }));
                div.append(jQuery("<div class=\"terkait-lbl\">" + window.terkait.rendering.getLabel(entity, 16) + "</div>"));
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
            	div.append(jQuery('<div>')
          		      .css({
	          		    	"width": "16px",
		          		    "height": "16px",
		          		    "position": "absolute",
		          		    "left": "6px",
		          		    "top": "5px",
          		            "background-image" : "url(" + chrome.extension.getURL("icons/icon_person.png") + ")"
          		      }));
                div.append(jQuery("<div class=\"terkait-lbl\">" + window.terkait.rendering.getLabel(entity, 16) + "</div>"));
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
            	div.append(jQuery('<div>')
          		      .css({
	          		    	"width": "16px",
		          		    "height": "16px",
		          		    "position": "absolute",
		          		    "left": "6px",
		          		    "top": "5px",
          		            "background-image" : "url(" + chrome.extension.getURL("icons/icon_person.png") + ")"
          		      }));
                div.append(jQuery("<div class=\"terkait-lbl\">" + window.terkait.rendering.getLabel(entity, 16) + "</div>"));
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
            	div.append(jQuery('<div>')
          		      .css({
	          		    	"width": "16px",
		          		    "height": "16px",
		          		    "position": "absolute",
		          		    "left": "6px",
		          		    "top": "5px",
          		            "background-image" : "url(" + chrome.extension.getURL("icons/icon_politics.gif") + ")"
          		      }));
                div.append(jQuery("<div class=\"terkait-lbl\">" + window.terkait.rendering.getLabel(entity, 16) + "</div>"));
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
            	div.append(jQuery('<div>')
          		      .css({
	          		    	"width": "16px",
		          		    "height": "16px",
		          		    "position": "absolute",
		          		    "left": "6px",
		          		    "top": "5px",
          		            "background-image" : "url(" + chrome.extension.getURL("icons/icon_person.png") + ")"
          		      }));
                div.append(jQuery("<div class=\"terkait-lbl\">" + window.terkait.rendering.getLabel(entity, 16) + "</div>"));
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
            	div.append(jQuery('<div>')
          		      .css({
	          		    	"width": "16px",
		          		    "height": "16px",
		          		    "position": "absolute",
		          		    "left": "6px",
		          		    "top": "5px",
          		            "background-image" : "url(" + chrome.extension.getURL("icons/icon_person.png") + ")"
          		      }));
                div.append(jQuery("<div class=\"terkait-lbl\">" + window.terkait.rendering.getLabel(entity, 16) + "</div>"));
            },
            left : function (entity, div) {
                window.terkait.rendering.renderRecommendedContent(entity, div);
            },
            right : function (entity, div) {
                window.terkait.rendering.renderMilitaryPerson(entity, div);
            }
        },
        'Organization' : {
            label : function (entity, div) {
            	div.append(jQuery('<div>')
            		      .css({
  	          		    	"width": "16px",
  		          		    "height": "16px",
  		          		    "position": "absolute",
  		          		    "left": "6px",
  		          		    "top": "5px",
            		            "background-image" : "url(" + chrome.extension.getURL("icons/icon_organization.png") + ")"
            		      }));
              div.append(jQuery("<div class=\"terkait-lbl\">" + window.terkait.rendering.getLabel(entity, 16) + "</div>"));
            },
            left : function (entity, div) {
                window.terkait.rendering.renderRecommendedContent(entity, div);
            },
            right : function (entity, div) {
                window.terkait.rendering.renderOrganization(entity, div);
            }
        },
        'Company' : {
            label : function (entity, div) {
            	div.append(jQuery('<div>')
            		      .css({
  	          		    	"width": "16px",
  		          		    "height": "16px",
  		          		    "position": "absolute",
  		          		    "left": "6px",
  		          		    "top": "5px",
            		            "background-image" : "url(" + chrome.extension.getURL("icons/icon_organization.png") + ")"
            		      }));
              div.append(jQuery("<div class=\"terkait-lbl\">" + window.terkait.rendering.getLabel(entity, 16) + "</div>"));
            },
            left : function (entity, div) {
                window.terkait.rendering.renderRecommendedContent(entity, div);
            },
            right : function (entity, div) {
                window.terkait.rendering.renderCompany(entity, div);
            }
        },
        'MilitaryUnit' : {
            label : function (entity, div) {
            	div.append(jQuery('<div>')
            		      .css({
  	          		    	"width": "16px",
  		          		    "height": "16px",
  		          		    "position": "absolute",
  		          		    "left": "6px",
  		          		    "top": "5px",
            		            "background-image" : "url(" + chrome.extension.getURL("icons/icon_organization.png") + ")"
            		      }));
              div.append(jQuery("<div class=\"terkait-lbl\">" + window.terkait.rendering.getLabel(entity, 16) + "</div>"));
            },
            left : function (entity, div) {
                window.terkait.rendering.renderRecommendedContent(entity, div);
            },
            right : function (entity, div) {
                window.terkait.rendering.renderMilitaryUnit(entity, div);
            }
        },
        'SportsTeam' : {
            label : function (entity, div) {
            	div.append(jQuery('<div>')
            		      .css({
  	          		    	"width": "16px",
  		          		    "height": "16px",
  		          		    "position": "absolute",
  		          		    "left": "6px",
  		          		    "top": "5px",
            		            "background-image" : "url(" + chrome.extension.getURL("icons/icon_organization.png") + ")"
            		      }));
              div.append(jQuery("<div class=\"terkait-lbl\">" + window.terkait.rendering.getLabel(entity, 16) + "</div>"));
            },
            left : function (entity, div) {
                window.terkait.rendering.renderRecommendedContent(entity, div);
            },
            right : function (entity, div) {
                window.terkait.rendering.renderSportsTeam(entity, div);
            }
        },
        'Band' : {
            label : function (entity, div) {
            	div.append(jQuery('<div>')
            		      .css({
  	          		    	"width": "16px",
  		          		    "height": "16px",
  		          		    "position": "absolute",
  		          		    "left": "6px",
  		          		    "top": "5px",
            		            "background-image" : "url(" + chrome.extension.getURL("icons/icon_organization.png") + ")"
            		      }));
              div.append(jQuery("<div class=\"terkait-lbl\">" + window.terkait.rendering.getLabel(entity, 16) + "</div>"));
            },
            left : function (entity, div) {
                window.terkait.rendering.renderRecommendedContent(entity, div);
            },
            right : function (entity, div) {
                window.terkait.rendering.renderBand(entity, div);
            }
        },
        'Non-ProfitOrganisation' : {
            label : function (entity, div) {
            	div.append(jQuery('<div>')
            		      .css({
  	          		    	"width": "16px",
  		          		    "height": "16px",
  		          		    "position": "absolute",
  		          		    "left": "6px",
  		          		    "top": "5px",
            		            "background-image" : "url(" + chrome.extension.getURL("icons/icon_organization.png") + ")"
            		      }));
              div.append(jQuery("<div class=\"terkait-lbl\">" + window.terkait.rendering.getLabel(entity, 16) + "</div>"));
            },
            left : function (entity, div) {
                window.terkait.rendering.renderRecommendedContent(entity, div);
            },
            right : function (entity, div) {
                window.terkait.rendering.renderNonProfitOrganisation(entity, div);
            }
        },
        'EducationalInstitution' : {
            label : function (entity, div) {
            	div.append(jQuery('<div>')
            		      .css({
  	          		    	"width": "16px",
  		          		    "height": "16px",
  		          		    "position": "absolute",
  		          		    "left": "6px",
  		          		    "top": "5px",
            		            "background-image" : "url(" + chrome.extension.getURL("icons/icon_organization.png") + ")"
            		      }));
              div.append(jQuery("<div class=\"terkait-lbl\">" + window.terkait.rendering.getLabel(entity, 16) + "</div>"));
            },
            left : function (entity, div) {
                window.terkait.rendering.renderRecommendedContent(entity, div);
            },
            right : function (entity, div) {
                window.terkait.rendering.renderEducationalInstitution(entity, div);
            }
        },
        'Legislature' : {
            label : function (entity, div) {
            	div.append(jQuery('<div>')
            		      .css({
  	          		    	"width": "16px",
  		          		    "height": "16px",
  		          		    "position": "absolute",
  		          		    "left": "6px",
  		          		    "top": "5px",
            		            "background-image" : "url(" + chrome.extension.getURL("icons/icon_organization.png") + ")"
            		      }));
              div.append(jQuery("<div class=\"terkait-lbl\">" + window.terkait.rendering.getLabel(entity, 16) + "</div>"));
            },
            left : function (entity, div) {
                window.terkait.rendering.renderRecommendedContent(entity, div);
            },
            right : function (entity, div) {
                window.terkait.rendering.renderLegislature(entity, div);
            }
        },
        'owl:Thing' : {
            label : function (entity, div) {
                div.text(window.terkait.rendering.getLabel(entity, 16));
            },
            left : function (entity, div) {
                window.terkait.rendering.renderRecommendedContent(entity, div);
            },
            right : function (entity, div) {
console.log(entity);
                div.text("TODO: render more information of entity: " + entity.getSubjectUri() + "(see console for more information)");
            }
        }
    }
    
});
