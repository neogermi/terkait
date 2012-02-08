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
                
                back
                .append(window.terkait._renderEntityEditor(this.model));
                
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
            accordionContainer = jQuery('<div>')
            .addClass("accordion")
            .hide()
            .appendTo(jQuery('#terkait-container .entities'));
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
                
        for (var t = 0, tlen = types.length; t < tlen; t++) {
            var type = window.terkait.vie.types.get(types[t]);
            if (type) {
                for (var q = 0, qlen = tsKeys.length; q < qlen; q++) {
                    var key = tsKeys[q];
                    if (type.isof(key)) {
                        return window.terkait._renderer[key];
                    }
                }
            }
        }
        return undefined;
    },

/*
    renderPerson : function(entity, rightSideCard) {
        var card = rightSideCard.parent().first();    
        var res = this._getLabel(entity);
        var orderInOffice = "";
        rightSideCard.append("<p> Person  :" + res + "</p>");
        if(entity.has('dbpedia:birthDate')) {
            birthDate = entity.get('dbpedia:birthDate');
            rightSideCard.append("<p>born: " + birthDate + "</p>");
        }
        if(entity.has('dbpedia:birthPlace')) {
            rightSideCard.append(this.renderBirthPlace(entity,card));
        }
        if(entity.has('dbpedia:orderInOffice')) {
		            rightSideCard.append(this.renderOffice(entity,card));
        }

        if (entity.has("foaf:page")) {              
            rightSideCard.append(this.renderLinkWikiPage(entity));
        }
    },

    renderOrganization : function(entity, rightSideCard) {            
        var res = this._getLabel(entity);
        rightSideCard.append("<p> Organization NAME : " + res + "</p>");
        
        if (entity.has("url")) {
            var url = entity.get("url");
            if (jQuery.isArray(url) && url.length > 0) {
                for ( var i = 0; i < url.length; i++) {
                    if (url[i].indexOf('@en') > -1) {
                        url = url[i];
                        break;
                    }
                }
                if (jQuery.isArray(url))
                    url = url[0]; // just take the first
                rightSideCard.append("<p> Organization URL: " + url + "</p>");
            }
        }
        if (entity.has("foaf:page")) {              
            rightSideCard.append(this.renderLinkWikiPage(entity));
        }
    },*/
    
    renderCountry : function (entity, div) {
        div.addClass("country");
        var map = window.terkait._renderMap(entity);
        div.append(map);
        
        var capital = entity.get("dbprop:capital");
        var capSentence = "";
        if (capital) {
	        capital = (capital.isCollection)? capital.at(0) : capital;
	        window.terkait._dbpediaLoader(entity, capital);
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
        window.terkait._humanReadable(parseInt(entity.get("dbpedia:areaTotal")) / 1000) + " km&sup2; and a population of " + 
        window.terkait._humanReadable(entity.get("dbpedia:populationTotal")) + 
        ". It comprises " + entity.get("dbprop:countries") + " countries.");
        
        div.append(abs);
    },
    
    renderCity : function (entity, div) {
        div.addClass("city");
        var map = window.terkait._renderMap(entity);
        div.append(map);
        
        //collect information from connected entities!
        var country = entity.get("dbpedia:country");
        country = (country && country.isCollection)? country.at(0) : country;
        window.terkait._dbpediaLoader(entity, country);
        
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
        window.terkait._dbpediaLoader(entity, country);

        var capital = entity.get("dbprop:capital");
        capital = (capital.isCollection)? capital.at(0) : capital;
        window.terkait._dbpediaLoader(entity, capital);
        
        var largestCity = entity.get("dbpedia:largestCity");
        var capitalSent = ".";
        if (largestCity) {
	        largestCity = (largestCity.isCollection)? largestCity.at(0) : largestCity;
	        window.terkait._dbpediaLoader(entity, largestCity);
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
        window.terkait._humanReadable(parseInt(area) / 1000) + " km&sup2;. It's capital is " +
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
        if (latitude && longitude) {
        	latitude = (jQuery.isArray(latitude))? latitude[0] : latitude;
        
        	longitude = (jQuery.isArray(longitude))? longitude[0] : longitude;
    
        	this._retrieveLatLongMap(latitude,longitude, res);
        } else if (label) {
        	this._retrieveKeywordMap(label, res);
        } else {
        	this._retrieveLatLongMap(undefined, undefined, res);
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
                        var border = jQuery('<div>')
                        .css({
                            'background-color': 'white'
                        });
                        //TODO: visualize in a grid with zoom functionality instead of slideshow
                        var img = jQuery('<img src="' + obj.original + '" height="200px"/>')
                            .error(function(){
                                $(this).remove();
                            });
                        container.append(border.append(img));
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
                for (var o = 0; o < objects.length && o < this.options.bin_size; o++) {
                    var obj = objects[o];
                    var border = jQuery('<div>')
                    .css({
                        'background-color': 'white',
                        'padding': '10px',
                    });
                    var vid = jQuery('<iframe>')
                    .attr({
                        "src": obj.original,
                        "width": "300px",
                        "height": "220px"
                    });
                    container.append(border.append(vid));
                }
                
                container.cycle({
                    fx: 'fade',
                    pause: true
                });
                
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
                    container.append(border.append(newsItem));
                }
                
                container.cycle({
                    fx: 'fade',
                    pause: true
                });
                
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