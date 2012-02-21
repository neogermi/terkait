if (!window.terkait) {
    window.terkait = {};
}

jQuery.extend(window.terkait, {
    
    createContentView : function(entity, parentEl) {
        var ContentView = Backbone.View.extend({

            className : "card-content",

            initialize : function() {
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
                
                front.hover(function () {
                	$(this).find(".button").fadeIn(500);
                }, function () {
                	$(this).find(".button").fadeOut(500);
                });
                
                console.log("render", this.model);
                /*TODO: back
                .append(window.terkait._renderEntityEditor(this.model));
                */
                var closeButton = window.terkait.createCloseButton();
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
		            };
                }(this));
                
                var editButton = window.terkait.createEditButton();
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
                
                var finishEditButton = window.terkait.createFinishEditButton();
                finishEditButton
                .css({"position":"absolute", top: "0px", right: "0px"})
                .appendTo(back)
                .click(function (view) {
                	return function () {
                		jQuery(view.el).css("-webkit-transform", "rotateY(0deg)");
		            };
                }(this));
                
                
                this.render();
            },

            render : function() {
                var $el = jQuery(this.el);
                var renderer = window.terkait._selectRenderer(this.model);
                if (renderer !== undefined) {
                    console.log("rerededede", this.model);
                    // first clear the content
                    var labelElem = jQuery(".card-label", $el).empty();
                    var leftElem = jQuery(".recommended-content", $el).empty();
                    var rightElem = jQuery(".entity-details", $el).empty();
                    
                    renderer["label"](this.model, labelElem);
                    renderer["left"](this.model, leftElem);
                    renderer["right"](this.model, rightElem);
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

    render : function(entity, selector) {
        
        var accordionContainer;
        // where to put it?
        if (selector) {
        	accordionContainer = jQuery(selector).parent('.accordion').first();
        } else {
        	var numEntitiesShown = jQuery("#terkait-container .entities .accordion").size();
        	if (numEntitiesShown < window.terkait.settings.maxEntities) {
	            accordionContainer = jQuery('<div>')
	            .addClass("accordion")
	            .hide()
	            .appendTo(jQuery('#terkait-container .entities'));
        	}
        }
        
        // create the VIEW on that entity
        this.createContentView(entity, accordionContainer);
    },
    
    _selectRenderer : function (entity) {
        var types = entity.get('@type');
        types = (jQuery.isArray(types))? types : [ types ];
        
        var tsKeys = [];
        for (var q in window.terkait._renderer) {
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
	                        return window.terkait._renderer[key];
	                    }
	                }
            	}
            }
        }
        return undefined;
    },
    
    renderPerson : function (entity, div) {
        div.addClass("person");
        var img = window.terkait._renderDepiction(entity);
        
        var abs = jQuery('<div class="abstract">');
        abs.append(img);
        abs.append(jQuery("<div>" + window.terkait._getLabel(entity) + " is a person!</div>"));
        
        div.append(abs);
    },
    
    renderCountry : function (entity, div) {
        div.addClass("country");
        var map = window.terkait._renderMap(entity);
        
        var capital = entity.get("dbprop:capital");
        var capSentence = "";
        if (capital) {
	        capital = (capital.isCollection)? capital.at(0) : capital;
	        window.terkait._dbpediaLoader(capital, 
	        		function (e) {
	        			if (_.isArray(e) && e.length > 0 || e.isEntity)
	        				entity.trigger("rerender");
			        }, 
			        function (e) {
			        	console.warn(e);
			        });
	        capSentence = " It's capital is <a href=\"" + capital.getSubject().replace(/[<>]/g, "") + "\">" + 
	        			  window.terkait._getLabel(capital) + "</a>.";
	        
        }
        
        var abs = jQuery('<div class="abstract">');
        abs.append(map);
        abs.append(jQuery("<div>" + window.terkait._getLabel(entity) + " is a country with a population of " + 
        window.terkait._humanReadable(entity.get("dbpedia:populationTotal")) + 
        "." + capSentence + "</div>"));
        
        div.append(abs);
    },
    
    renderContinent : function (entity, div) {
        div.addClass("continent");
        var map = window.terkait._renderMap(entity);
        div.append(map);
        
        var abs = jQuery('<div class="abstract">');
        abs.html(window.terkait._getLabel(entity) + " is a continent with an area of " + 
        window.terkait._humanReadable(parseInt(entity.get("dbpedia:areaTotal")) / 1000000) + " km&sup2; and a population of " + 
        window.terkait._humanReadable(entity.get("dbpedia:populationTotal")) + 
        ". It comprises " + entity.get("dbprop:countries") + " countries.");
        
        div.append(abs);
    },
    
    renderPlace : function (entity, div) {
    	div.addClass("place");
        var map = window.terkait._renderMap(entity);
        
        var abs = jQuery('<div class="abstract">');
        abs.append(map);
        abs.append(jQuery("<div>" + window.terkait._getLabel(entity) + " is a place.</div>"));
        
        div.append(abs);
    },
    
    renderCity : function (entity, div) {
        div.addClass("city");
        var map = window.terkait._renderMap(entity);
        div.append(map);
        
        //collect information from connected entities!
        var country = entity.get("dbpedia:country");
        country = (country && country.isCollection)? country.at(0) : country;
        window.terkait._dbpediaLoader(country, 
        		function (e) {
                    if (_.isArray(e) && e.length > 0 || e.isEntity)
                        entity.trigger("rerender");
		        }, 
		        function (e) {
		        	console.warn(e);
		        });
        
        var population = entity.get("dbpedia:populationTotal");
        
        var abs = jQuery('<div class="abstract">');
        abs.html(window.terkait._getLabel(entity) + " is a city in " +
        window.terkait._getLabel(country) + " with a population of " + 
        window.terkait._humanReadable(population) + ".");
        
        div.append(abs);
    },
    
    renderState : function (entity, div) {
        div.addClass("state");
        var map = window.terkait._renderMap(entity);
        
        //collect information from connected entities!
        var country = entity.get("dbpedia:country");
        country = (country.isCollection)? country.at(0) : country;
        window.terkait._dbpediaLoader(country, 
        		function (e) {
        		    if (_.isArray(e) && e.length > 0 || e.isEntity)
                        entity.trigger("rerender");
		        }, 
		        function (e) {
		        	console.warn(e);
		        });

        var capital = entity.get("dbprop:capital");
        capital = (capital.isCollection)? capital.at(0) : capital;
        window.terkait._dbpediaLoader(capital, 
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
	        window.terkait._dbpediaLoader(largestCity, 
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
        abs.append(jQuery("<div>" + window.terkait._getLabel(entity) + " is a state in " +
        window.terkait._getLabel(country) + " with a total area of " + 
        window.terkait._humanReadable(parseInt(area) / 1000000) + " km&sup2;. It's capital is " +
        window.terkait._getLabel(capital) +
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
    
  //used in renderPlace
    _renderMap : function(entity) {
        var res = $('<div class="map_canvas"></div>');
        var latitude = entity.get("geo:lat");
        var longitude = entity.get("geo:long");
        var label = this._getLabel(entity);
		var zoom = this._getMapZoomFactor(entity);
        if (latitude && longitude) {
        	latitude = (jQuery.isArray(latitude))? latitude[0] : latitude;
        	longitude = (jQuery.isArray(longitude))? longitude[0] : longitude;
        	this._retrieveLatLongMap(latitude,longitude,zoom,res);
        } else if (label) {
        	this._retrieveKeywordMap(label, res);
        } else {
        	this._retrieveLatLongMap(undefined, undefined, res);
        }
        return res;
    },
    
	_getMapZoomFactor : function (entity) {
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
			areaKm = areaKm;
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
	
    //used in renderPerson       
    _renderDepiction : function(entity) {
        var res = $('<img>');
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
    
    _getLabel : function (entity) {
    	return window.terkait._extractString(entity, ["name", "rdfs:label"]);
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
            
            terkait.registerRecommendedContentDialog($this, $parent, terkait._renderImages, entity);
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
            
            terkait.registerRecommendedContentDialog($this, $parent, terkait._renderVideos, entity);
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
            
            terkait.registerRecommendedContentDialog($this, $parent, terkait._renderNews, entity);
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
                bin_size: 3,
                lang_id : "en",
                services : {
                    gimage : {
                        use: true
                    }
                },
                render: function(data) {
                    var self = this;
    
                    var objects = self.options.objects;
                    var time = data.time;
                    
                    //rendering
                    var container = jQuery('<div>').css('position', 'relative');
                    for (var o = 0; o < objects.length && o < this.options.bin_size; o++) {
                        var obj = objects[o];
                        var img = 
                        jQuery('<img src="' + obj.original + '" height="80px" width="auto"/>')
                        .css({
                            "display" : "inline",
                            "margin-top" : "0px",
                            "margin-left" : "0px",
                            "margin-right" : "10px",
                            "margin-bottom" : "10px",
                            "box-shadow": "rgb(128, 128, 128) 5px 7px 6px"
                        })
                        .error(function(){
                                $(this).remove();
                            });
                        container.append(img);
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
            bin_size: 3,
            services : {
                gvideo : {
                    use: true
                }
            },
            render: function(data) {
                var self = this;

                var objects = self.options.objects;
                var time = data.time;
                
              //rendering
                var container = jQuery('<div>');
                
              //render the first video large
                var vid = jQuery('<object>')
                .attr({
                    "width":"218",
                    "height":"180"})
                .css({
                    "display" : "inline",
                    "margin-top" : "0px",
                    "margin-left" : "0px",
                    "margin-right" : "10px",
                    "margin-bottom" : "10px"
                })
                .append(
                    jQuery('<param>')
                    .attr({
                        "name":"movie",
                        "value":objects[0].original.replace("/embed/", "/v/") + "&rel=0"
                    }))
                .append(
            		jQuery('<param name="wmode" value="opaque" />'))
                .append(
                    jQuery('<embed>')
                    .attr({
                        "type"   : "application/x-shockwave-flash",
                        "src"    : objects[0].original.replace("/embed/", "/v/") + "&rel=0",
                        "width"  : "218",
                        "height" : "180",
                        "wmode"  : "opaque"
                    })
                    .css({
                        "box-shadow": "rgb(128, 128, 128) 5px 7px 6px"
                    }));
                container.append(vid);
                /*TODO: render all others as previews
                for (var o = 1; o < objects.length && o < this.options.bin_size; o++) {
                    var obj = objects[o];
                    var vid = jQuery('<object>')
                    .attr({
                        "width":"218",
                        "height":"180"})
                    .css({
                        "display" : "inline",
                        "margin-top" : "0px",
                        "margin-left" : "0px",
                        "margin-right" : "10px",
                        "margin-bottom" : "10px",
                        "box-shadow": "rgb(128, 128, 128) 5px 7px 6px"
                    })
                    .append(
                        jQuery('<param>')
                        .attr({
                            "name":"movie",
                            "value":obj.original.replace("/embed/", "/v/") + "&rel=0"
                        }))
                    .append(
                        jQuery('<embed>')
                        .attr({
                            "type":"application/x-shockwave-flash",
                            "src":obj.original.replace("/embed/", "/v/") + "&rel=0",
                            "width" : "218",
                            "height" : "180"
                        }));
                    container.append(vid);
                }*/
                
                // clear the container element
                self.element.empty();
                container.appendTo(jQuery(self.element));
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
            bin_size: 3,
            services : {
                gnews : {
                    use: true,
                    ned: "de_at",
                    hl: "en"
                }
            },
            render: function(data) {
                var self = this;
                var objects = self.options.objects;
                var time = data.time;
                
                //rendering
                var container = jQuery('<div>').css('position', 'relative');
                for (var o = 0; o < objects.length && o < this.options.bin_size; o++) {
                    var obj = objects[o];
                    var border = jQuery('<div>')
                    .css({
                        'background-color': 'white',
                        'padding': '10px',
                    });
                    var newsItem = jQuery('<div>');
					var title = obj.title? obj.title: "untitled";
					var url = obj.url? obj.url: "undefined";
					if(url!="undefined"){
						var a = jQuery('<a href="'+url+'" target="_blank">'+title+'</a>');
						newsItem.append(a);
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
            var $div = $('<div>');
            var $container = $('<div>').addClass("terkait-recommended-content-dialog")
            .append($div).appendTo($('body')).hide();
            
            renderer(entity, $div);
            $container.css({
                top: parent.offset().top,
                left: parent.offset().left
            }).animate({
                left: (parent.offset().left - 330),
                opacity: 'show'
            }, 'slow');
        }
        button.data('activated', !activated);
    },
    
    //this registers the individual renderer for the differerent types
    _renderer : {
        'Continent' : {
            label : function (entity, div) {
                div.text(window.terkait._getLabel(entity));
            },
            left : function (entity, div) {
                window.terkait.renderRecommendedContent(entity, div)
            },
            right : function (entity, div) {
                window.terkait.renderContinent(entity, div);
            }
        },
        'Country' : {
            label : function (entity, div) {
                div.text(window.terkait._getLabel(entity));
            },
            left : function (entity, div) {
                window.terkait.renderRecommendedContent(entity, div)
            },
            right : function (entity, div) {
                window.terkait.renderCountry(entity, div);
            }
        },
        'State' : {
            label : function (entity, div) {
                div.text(window.terkait._getLabel(entity));
            },
            left : function (entity, div) {
                window.terkait.renderRecommendedContent(entity, div)
            },
            right : function (entity, div) {
            	window.terkait.renderState(entity, div);
            }
        },
        'City' : {
            label : function (entity, div) {
                div.text(window.terkait._getLabel(entity));
            },
            left : function (entity, div) {
                window.terkait.renderRecommendedContent(entity, div)
            },
            right : function (entity, div) {
                window.terkait.renderCity(entity, div);
            }
        },
        'Place' : {
            label : function (entity, div) {
                div.text(window.terkait._getLabel(entity));
            },
            left : function (entity, div) {
                window.terkait.renderRecommendedContent(entity, div)
            },
            right : function (entity, div) {
                window.terkait.renderPlace(entity, div);
            }
        },
        'Person' : {
            label : function (entity, div) {
                div.text(window.terkait._getLabel(entity));
            },
            left : function (entity, div) {
                window.terkait.renderRecommendedContent(entity, div)
            },
            right : function (entity, div) {
                window.terkait.renderPerson(entity, div);
            }
        }/*,
        'Thing' : {
            label : function (entity, div) {
                div.text(window.terkait._getLabel(entity));
            },
            left : function (entity, div) {
                window.terkait.renderRecommendedContent(entity, div)
            },
            right : function (entity, div) {
                div.text("Thing");
            }
        }*/
    }
    
});
