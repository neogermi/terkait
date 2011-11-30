if (!window.terkait) {
    window.terkait = {};
}

jQuery.extend(window.terkait, {
    
    createLabelView : function(entity) {
        var LabelView = Backbone.View.extend({

            tagName : "div",
            className : "card-label",

            initialize : function() {
                // bind the entitie's "change" event to a rerendering of the VIEW
                this.model.bind("rerender", this.render, this);
                this.render(); // render it the first time
            },
            
            render : function() {
                var $el = jQuery(this.el);
                $el.text(window.terkait.getLabel(this.model));
            }
        });
        return new LabelView({
            model : entity
        });
    },
    
    createCardView : function(entity) {
        var CardView = Backbone.View.extend({

            className : "card-content",

            initialize : function() {
                // bind the entitie's "change" event to a rerendering of the
                // VIEW
                this.model.bind("rerender", this.render, this);
                this.render(); // render it the first time
            },

            render : function() {
                var $el = jQuery(this.el);
                $el.empty(); // clear card first

                window.terkait._renderEntityDetails(this.model, $el);
            }
        });
        return new CardView({
            model : entity
        });
    },

    createCloseButton : function () {
      return jQuery('<div>')
        .addClass('close-button')
        .css({
            "background-image" : "url(" + chrome.extension.getURL("icons/close_button.png") + ")"
        });
    },

    render : function(entity, selector) {
        var labelView = this.createLabelView(entity);
        var cardView = this.createCardView(entity); // create the VIEW on that entity
        var card = jQuery('<div>')
            .addClass("entity-card")
            .append(jQuery(labelView.el))
            .append(jQuery(cardView.el));
        
        // where to put it?
        if (selector) {
            // append to that accordion!
            jQuery(selector).parent('.accordion').first().append(card);
        } else {
            var closeButton = window.terkait.createCloseButton();
            closeButton.click(function () {
                var $this = $(this);
                var $accord = $this.parent('.accordion').first();
                $this.remove();
                $accord
                .slideUp(500, function () {
                    $(this).remove();
                });
            });
            
            // append at the end of the container!
            var accordionContainer = jQuery('<div>')
            .addClass("accordion")
            .append(closeButton.hide())
            .append(card)
            .hover (function () {
                var $this = $(this);
                var $button = $('.close-button', this);
                $button
                .fadeIn(500);
                return true;
            }, function () {
                var $button = $('.close-button', this);
                $button.fadeOut(500);
                return true;
            });
            jQuery('#terkait-container .entities')
                .append(accordionContainer);
        }
		terkait.renderAccordion(card);
    },

	renderAccordion : function(card){
		card.parent().find('.entity-card').css({height: '35px'});
		card.parent().find('.card-content').css({height: '1px'});
//		card.parent().find('.entity-details').css({width: '1px'});
		card.css({height: '245px'});
		card.find('.card-content').css({height: '222px'});
//		card.find('.entity-details').css({width: '74px'});
		console.log("renderedCard? ",card.parent().find('.entity-card'));
		card.parent().find('.entity-card').click(function() {
		window.terkait.rerenderAccordion($(this));
		}); 		
	},//#f6a828
	rerenderAccordion : function(card){
		console.log("rerender: ", card)
		card.parent().find('.entity-card').css({height: '35px'});
		card.parent().find('.card-content').css({height: '1px'});
		card.parent().find('.card-label').css({border: '2px solid #999', 'border-radius' : '10px', 'background-image' : '-webkit-linear-gradient(135deg, #5c9ccc, #ffffff)'});
		card.css({height: '245px'});
		card.find('.card-label').css({border: 'none', 'background-image' : '-webkit-linear-gradient(135deg, #ffffff, #ffffff'});
		card.find('.card-content').css({height: '222px'});
	},  
	
    _renderEntityDetails : function (entity, card) {
        var leftSideCard = jQuery('<div>').addClass("recommended-content");
        var rightSideCard = jQuery('<div>').addClass("entity-details");
        card.append(leftSideCard).append(rightSideCard);

        setTimeout(function (e, l) {
                return function () {
                    window.terkait.renderRecommendedContent(e, l);
                };
        }(entity, leftSideCard), 1);
        
        setTimeout(function (e, r) {
            return function () {
                if (entity.isof("Person")) {
                    window.terkait.renderPerson(e, r);
                } else if (entity.isof("Organization")) {
                    window.terkait.renderOrganization(e, r);
                } else if (entity.isof("Place")) {
                    window.terkait.renderPlace(e, r);
                } else {
                    console.log("no renderer for type", e.get('@type'));
                }
            };
       }(entity, rightSideCard), 1);
    },
    
    //TODO: do not use this yet
    _renderer : {
        'Person' : function (entity, div) {
          //TODO
        },
        'Organization' : function (entity, div) {
          //TODO
        },
        'Place' : function (entity, div) {
          //TODO
        },
        'Thing' : function (entity, div) {
          //TODO
        }
    },

    renderPerson : function(entity, rightSideCard) {
        var card = rightSideCard.parent().first();    
        var res = this.getLabel(entity);
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
        var res = this.getLabel(entity);
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
    },

    
    renderPlace : function(entity, rightSideCard) {        
        var card = rightSideCard.parent().first();    
        var res = this.getLabel(entity);
        if (entity.has("geo:lat")) {
                if (entity.has("geo:long")) {
                    rightSideCard.append(this.renderMap(entity));
                }
            }   
            if (entity.has("dbpedia:country")) {
                rightSideCard.append(this.renderButtonCountry(entity,card));
            }
            if (entity.has("dbpedia:capital")) {
                rightSideCard.append(this.renderButtonCapital(entity,card));
            }
            if (entity.has("dbpedia:district")) {
                rightSideCard.append(this.renderButtonDistrict(entity,card));
            }
            if (entity.has("dbpedia:federalState")) {               
                rightSideCard.append(this.renderButtonFederalState(entity,card));
            }               
            if (entity.has("foaf:page")) {              
                rightSideCard.append(this.renderLinkWikiPage(entity));
            }
    },

	//used in renderPerson
	renderBirthPlace : function(entity, card) {
            var birthPlace = entity.get('dbpedia:birthPlace');
			var res = "";
            var button = $('<a target="_blank" href=""></a>');

			if(jQuery.isArray(birthPlace)){
				birthPlace.reverse();
				res = birthPlace[0]; //just the last			
			}
			
			button.click(function(entity, accordion) {
					return function(event) {
						event.preventDefault();                     
						window.terkait.render(res, accordion);
						};
					}(entity, card.parent()));
					
			var placeName = this.getLabel(res);
			var prop = $('<p>born: </p>');
			return prop.append(button.append(placeName));
	},
	//used in renderPerson
	renderOffice : function(entity, card) {
            var orderInOffice = entity.get('dbpedia:orderInOffice');
			var res = "";
            if (jQuery.isArray(orderInOffice) && orderInOffice.length > 0) {
                for ( var i = 0; i < orderInOffice.length; i++) {
                    if (orderInOffice[i].indexOf('@en') > -1) {
                        res = res + orderInOffice[i];
                        //break;
                    }
                } 
			} else if (jQuery.isArray(orderInOffice)){
                res = orderInOffice[0]; // just take the first}
			} else {
				res = orderInOffice;
			}
			res = res.replace(/"/g, "").replace(/@[a-z]+/g, '');          
            var prop = $("<p>office: " + res + "</p>");                            
			return prop;
	},			
    //used in renderPlace       
    renderMap : function(entity) {                              
                var latitude = "";
                var longitude = "";
                if (entity.has("geo:lat")){
                    latitude = entity.get("geo:lat");
                    if(jQuery.isArray(latitude)){
                        latitude = latitude[0];
                    }
                }
                if (entity.has("geo:long")) {
                    longitude = entity.get("geo:long");
                    if(jQuery.isArray(longitude)){
                        longitude = longitude[0];
                    }
                }
                
                var res = $('<div class="map_canvas"></div>').css({height: '150px', width: '150px'});
                //TODO: this.retrieveMap(latitude,longitude, res);
                return res;
    },      
    //used in renderPlace       
    renderButtonCountry : function(entity, card) {
                var range = this.getLabel(entity.get("dbpedia:country"));
                var prop = $('<p>country: </p>');
                var button = $('<a target="_blank" href=""></a>');
                var country = entity.get("dbpedia:country");
                button.click(function(entity, accordion) {
                    return function(event) {
                        event.preventDefault();                     
                        window.terkait.render(country, accordion);
                    };
                }(entity, card.parent()));

                return prop.append(button.append(range));
    }, //used in renderPlace       
    renderButtonCapital : function(entity, card) {
                var range = this.getLabel(entity.get("dbpedia:capital"));
                var prop = $('<p>capital: </p>');
                var button = $('<a target="_blank" href=""></a>');
                var capital = entity.get("dbpedia:capital");
	            button.click(function(entity, accordion) {
                    return function(event) {
                        event.preventDefault();                     
                        window.terkait.render(capital, accordion);
                    };
                }(entity, card.parent()));

                return prop.append(button.append(range));
    },
    //used in renderPlace       
    renderButtonDistrict : function(entity, card) {
            if (entity.has("dbpedia:district")) {
                var range = "";//TODO: this.getLabel(entity.get("dbpedia:district"));
                var prop = $('<p>district: </p>');
                var button = $('<a target="_blank" href=""></a>');
                var district = entity.get("dbpedia:district");

                button.click(function(entity, accordion) {
                    return function(event) {
                        event.preventDefault();                     
                        window.terkait.render(district, accordion);
                    };
                }(entity, card.parent()));

                return prop.append(button.append(range));
            }
    },      
    //used in renderPlace
    renderButtonFederalState : function(entity, card) {
                var range = "";//TODO: this.getLabel(entity.get("dbpedia:federalState"));
                var prop = $('<p>state: </p>');
                var button = $('<a target="_blank" href=""></a>');

                button.click(function(entity, accordion) {
                    return function(event) {
                        event.preventDefault();                     
                        window.terkait.render(entity, accordion);
                    };
                }(entity, card.parent()));

                return prop.append(button.append(range));
    },      
    //used in renderPlace       
    renderLinkWikiPage : function(entity) {
                var range = entity.get("foaf:page");
                if($.isArray(range)){
                range = range[0];
                }
                var rangeSt = new String(range.id);
                rangeSt = rangeSt.replace(/</i,'').replace(/>/i,'');    
                var prop = $('<p>find out <a target="_blank" href="'+rangeSt+'">MORE</a><br>in Wikipedia</p>');

                return prop;
    },
    //used in renderMap
    retrieveMap : function(latitude,longitude, mapDiv){
        var latlng = new google.maps.LatLng(latitude,longitude);
        var myOptions = {
            zoom: 6,
            center: latlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(mapDiv[0],myOptions);
        var marker = new google.maps.Marker({
            position: latlng,
            map: map
        });
    },
    
    getLabel : function(entity) {
        if (typeof entity === "string") {

            return "NO NAME";
        }
        else if (entity.has("name")) {

            var name = entity.get("name");
            if (jQuery.isArray(name) && name.length > 0) {
                for ( var i = 0; i < name.length; i++) {
                    if (name[i].indexOf('@en') > -1) {
                        name = name[i];
                        break;
                    }
                }
                if (jQuery.isArray(name))
                    name = name[0]; // just take the first
                
            }
            name = name.replace(/"/g, "").replace(/@[a-z]+/, '');
            return name;
        }
        return "NO NAME";
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
            var $parent = $this.parents('.entity-card').first();
            
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
            var $parent = $this.parents('.entity-card').first();
            
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
            var $parent = $this.parents('.entity-card').first();
            
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
                        var img = jQuery('<img src="' + obj.original + '" width="300px" height="220px" />');
                        container.append(border.append(img));
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
    }
    
});