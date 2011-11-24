if (!window.terkait) {

    window.terkait = {

        vie : function() {
            var v = new VIE();
            v.loadSchemaOrg();
            v.namespaces.add("purl", "http://purl.org/dc/terms/subject");
            v.use(new v.StanbolService({
                url : "http://dev.iks-project.eu:8081",
                proxyDisabled : true
            }));
            v.use(new v.RdfaRdfQueryService());
            v.use(new v.DBPediaService());
            return v;
        }(),

        create : function() {
            if (jQuery('#terkait-container').size() > 0) {
                // clear former results!
                jQuery('#terkait-container .entities').empty();
            } else {
                jQuery('<div id="terkait-container">')
                        .css({
                              "background-image" : "url(" + chrome.extension.getURL("terkait_transparent.png") + ")"
                        })
                        /*
                         * no hovering for development .hover(function() {
                         * jQuery(this).animate({ "right" : "-1em" }) },
                         * function() { jQuery(this).animate({ "right" : "-25em" }) })
                         */
                        .appendTo(jQuery('<div id="terkait-wrapper">').appendTo(jQuery('body')))
                        .append(jQuery('<div>').addClass("entities"));
            }
        },

        selector : function() {
            var res = jQuery(
                    ':header,header,section,article,div,span,p,q,i,b,u,em,strong,font')
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
                            });
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
            window.terkait.vie
                    .analyze({
                        element : meta
                    })
                    .using('stanbol')
                    .execute()
                    .done(
                            function(entities) {
                                // filtering for the interesting entities
                                var entitiesOfInterest = [];
                                for ( var e = 0; e < entities.length; e++) {
                                    var entity = entities[e];
                                    var isEntityOfInterest = (!entity.isof("enhancer:Enhancement"))
                                            && (entity.isof("Person") || entity.isof("Place") || entity.isof("Organization"));
                                    var hasAnnotations = entity.has("enhancer:hasEntityAnnotation")
                                            || entity.has("enhancer:hasTextAnnotation");

                                    if (isEntityOfInterest && hasAnnotations) {
                                        entitiesOfInterest.push(entity);
                                    }
                                }
                                // sorting by "relevance" (number of occurrences
                                // in the text)
                                entitiesOfInterest
                                        .sort(function(a, b) {
                                            var numOfEntityAnnotsA = (jQuery.isArray(a.get("enhancer:hasEntityAnnotation"))) ? a
                                                    .get("enhancer:hasEntityAnnotation").length
                                                    : 1;
                                            var numOfTextAnnotsA = (jQuery.isArray(a.get("enhancer:hasTextAnnotation"))) ? a
                                                    .get("enhancer:hasTextAnnotation").length
                                                    : 1;
                                            var sumA = numOfEntityAnnotsA + numOfTextAnnotsA;
                                            var numOfEntityAnnotsB = (jQuery.isArray(b.get("enhancer:hasEntityAnnotation"))) ? b
                                                    .get("enhancer:hasEntityAnnotation").length
                                                    : 1;
                                            var numOfTextAnnotsB = (jQuery.isArray(b.get("enhancer:hasTextAnnotation"))) ? b
                                                    .get("enhancer:hasTextAnnotation").length
                                                    : 1;
                                            var sumB = numOfEntityAnnotsB + numOfTextAnnotsB;

                                            if (sumA == sumB)
                                                return 0;
                                            else if (sumA < sumB)
                                                return 1;
                                            else
                                                return -1;
                                        });
                                for (var i = 0; i < entitiesOfInterest.length; i++) {
                                    var entity = entitiesOfInterest[i];
                                    window.terkait.render(entity);

                                    // trigger a search in DBPedia to ensure to have "all" properties
                                    window.terkait.vie
                                            .load({
                                                entity : entity.id
                                            })
                                            .using('dbpedia')
                                            .execute()
                                            .done(
                                                    function(entities) {
                                                        for ( var e = 0; e < entities.length; e++) {
                                                            var updated = window.terkait.vie.entities
                                                                    .get(entities[e].id);
                                                            updated.change();
                                                        }
                                                    });
                                }
                                console.log("rendering " + entitiesOfInterest.length + " entities", entitiesOfInterest);
                            })
                    .fail(function(f) {
                        console.warn(f);
                        // TODO!
                    });
            return {
                foundElems : elems.size() > 0
            }
        },

        createLabelView : function(entity) {
            var LabelView = Backbone.View.extend({

                tagName : "div",
                className : "card-label",

                initialize : function() {
                    // bind the entitie's "change" event to a rerendering of the VIEW
                    this.model.bind("change", this.render, this);
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
                    this.model.bind("change", this.render, this);
                    this.render(); // render it the first time
                },

                render : function() {
                    var $el = jQuery(this.el);
                    $el.empty(); // clear card first
                    if (entity.isof("Person")) {
                        window.terkait.renderPerson(this.model, $el);
                    } else if (entity.isof("Organization")) {
                        window.terkait.renderOrganization(this.model, $el);
                    } else if (entity.isof("Place")) {
                        window.terkait.renderPlace(this.model, $el);
                    } else {
                        console.log("no renderer for type", entity.get('@type'));
                    }
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
                "background-image" : "url(" + chrome.extension.getURL("close_button.png") + ")"
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
                    $this.parent('.accordion').first().hide(500, function () {
                        $(this).remove();
                    });
                });
                // append at the end of the container!
                var accordionContainer = jQuery('<div>')
                    .addClass("accordion")
                    .append(closeButton)
                    .append(card);
                jQuery('#terkait-container .entities')
                    .append(accordionContainer);
            }
        },

        renderPerson : function(entity, card) {
            var leftSideCard = jQuery('<div>').addClass("recommended-content");
            window.terkait.renderRecommendedContent(entity, leftSideCard);
            var rightSideCard = jQuery('<div>').addClass("entity-details");
            card.append(leftSideCard).append(rightSideCard);
            var res = "TODO";//this.getLabel(entity);
            rightSideCard.append("<p> Person  :" + res + "</p>");
			if(entity.has('dbpedia:birthDate')) {
				birthDate = entity.get('dbpedia:birthDate');
				rightSideCard.append("<p> born:" + birthDate + "</p>");
			}
			if (entity.has("foaf:page")) {				
				rightSideCard.append(this.renderLinkWikiPage(entity));
            }
        },

        renderOrganization : function(entity, card) {
            var leftSideCard = jQuery('<div>').addClass("recommended-content");
            window.terkait.renderRecommendedContent(entity, leftSideCard);
            var rightSideCard = jQuery('<div>').addClass("entity-details");
            card.append(leftSideCard).append(rightSideCard);
            
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
		
        renderPlace : function(entity, card) {
            var leftSideCard = jQuery('<div>').addClass("recommended-content");
            window.terkait.renderRecommendedContent(entity, leftSideCard);
            var rightSideCard = jQuery('<div>').addClass("entity-details");
            card.append(leftSideCard).append(rightSideCard);
            
            var res = this.getLabel(entity);
            rightSideCard.append("NAME :" + '<a href ="#">' + res + '</a>');

            var latitude = "";
            var longitude = "";
            if (entity.has("geo:lat")) {
                latitude = entity.get("geo:lat");
                rightSideCard.append("<p> Lat:" + latitude + "</P>");
            }
            if (entity.has("geo:long")) {
                longitude = entity.get("geo:long");
                // console.log("unknown request", geoCoordinates);
                // var url = geoCoordinates.get("url");
                rightSideCard.append("<p> Long:" + longitude + "</P>");
            }
            var elem = $('<div id ="map_canvas">');
            rightSideCard.append(elem);
            // TODO: GUY: var options = window.terkait.initMap(latitude, longitude);
//max           var options = window.terkait.initMap(latitude, longitude);
            // TODO: GUY: var map = new
            // google.maps.Map(document.getElementById("map_canvas"), options);
//max           google.maps.Map(document.getElementById("map_canvas"), options);
            // DEBUG
			console.log("hasCountry: ",entity.has("dbpedia:country"));
				if (entity.has("geo:lat")) {
					if (entity.has("geo:long")) {
			            rightSideCard.append(this.renderMap(entity));
					}
				}	
                if (entity.has("dbpedia:country")) {
					rightSideCard.append(this.renderButtonCountry(entity,card));
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

		//used in renderPlace		
		renderMap : function(entity) {
					var latitude = entity.get("geo:lat");
					var longitude = entity.get("geo:long");
					var res = $('<div id ="map_canvas"></div>');
					res.append(this.retrieveMap(latitude,longitude));
					return res;
		},		
		//used in renderPlace		
		renderButtonCountry : function(entity, card) {
					var range = this.getLabel(entity.get("dbpedia:country"));
					var prop = $('<p>country: </p>');
					var button = $('<button></button>');

					button.click(function(entity, accordion) {
						return function() {
						
							window.terkait.render(entity.get(entity.id), accordion);
						};
					}(entity, card.parent()));

					return prop.append(button.append(range));
		},
		//used in renderPlace		
		renderButtonDistrict : function(entity, card) {
                if (entity.has("dbpedia:district")) {
                    var range = "TOOD:";//this.getLabel(entity.get("dbpedia:district"));
                    var prop = $('<p>district: </p>');
                    var button = $('<button></button>');

                    button.click(function(entity, accordion) {
                        return function() {
                            window.terkait.render(entity, accordion);
                        };
                    }(entity, card.parent()));

					return prop.append(button.append(range));
				}
		},		
		//used in renderPlace
		renderButtonFederalState : function(entity, card) {
                    var range = "toDo";//this.getLabel(entity.get("dbpedia:federalState"));
                    var prop = $('<p>state: </p>');
                    var button = $('<button></button>');

                    button.click(function(entity, accordion) {
                        return function() {
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
					var prop = $('<p>find out <a href="'+rangeSt+'">MORE</a><br>in Wikipedia</p>');

					return prop;
		},
		//used in renderMap
		retrieveMap : function(latitude,longitude){
			return 'hier comes the map';
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
                    name = name.replace(/"/g, "").replace(/@[a-z]+/, '');
                    return name;
                }
            }
            return "NO NAME";
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

                var text = rng.toString();

                var entity = new window.terkait.vie.Entity({
                    '@type' : window.terkait.vie.types.get(type),
                    'name' : text
                });
                window.terkait.vie.entities.add(entity);

                window.terkait.vie.save({
                    entity : entity,
                    element : jQueryelem
                }).using('rdfardfquery').execute().done(function() {
                    sendResponse({
                        success : true
                    });
                }).fail(function() {
                    sendResponse({
                        success : false
                    });
                });
                return true;
            } else {
                return false;
            }

        },
        
        renderRecommendedContent: function (entity, panel){
            
            var images = terkait._renderImages(entity);
            var videos = terkait._renderVideos(entity).css("margin-top", "120px");
            var newssearch = terkait._renderNews(entity).css("margin-top", "120px");
            var websearch = terkait._renderImages(entity).css("margin-top", "120px");
            var historysearch = terkait._renderImages(entity).css("margin-top", "120px");
            
            panel
                .append(images)
                .append(videos)
                .append(newssearch)
                /*.append(newssearch)
                .append(historysearch)
                */
                ;
                
        },
        
        _renderImages : function (entity) {
            var imgContainer = $('<div>');
            
            imgContainer
                .vieImageSearch({
                    vie    : window.terkait.vie,
                    bin_size: 3,
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
                                'background-color': 'white',
                                'padding': '10px',
                            });
                            var img = jQuery('<img src="' + obj.original + '" width="110px" height="110px" />');
                            container.append(border.append(img));
                        }
                        
                        container.cycle({
                            fx: 'fade'
                        });
                        
                        // clear the container element
                        self.element.empty();
                        container.appendTo(jQuery(self.element));
                        return this;
                    }
                    
            }).vieImageSearch({
                entity: entity
            });
            
            return imgContainer;
        },
        
        _renderVideos : function (entity) {
            var vidContainer = $('<div>');
            
            vidContainer
                .vieVideoSearch({
                    vie    : window.terkait.vie,
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
                            var container = jQuery('<div>').css('position', 'relative');
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
                                    "width": "110px",
                                    "height": "82px",
                                    "controls" : 0
                                });
                                container.append(border.append(vid));
                            }
                            
                            container.cycle({
                                fx: 'fade'
                            });
                            
                            // clear the container element
                            self.element.empty();
                            container.appendTo(jQuery(self.element));
                            return this;
                        }
        
            }).vieVideoSearch({
                entity: entity
            });
            
            return vidContainer;
        },
        
        _renderNews : function (entity) {
            var newContainer = $('<div>');
            
            newContainer
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
                            fx: 'fade'
                        })
                        .cycle('stop');
                        
                        // clear the container element
                        self.element.empty();
                        container.appendTo(jQuery(self.element));
                        return this;
                    }
        
                }).vieNewsSearch({
                    entity: entity
                });
            
            return newContainer;
        },
        
        searchComplete: function(googleSearch,container) {
            if (googleSearch.results && googleSearch.results.length > 0) {
              var ul = jQuery('<ul>');
              for (var i = 0; i < googleSearch.results.length; i++) {
                var li = jQuery('<li class="slider_item">');
                var a = jQuery('<a>');
                a[0].href = googleSearch.results[i].url;
                a[0].innerHTML = googleSearch.results[i].title;
                var div = jQuery('<div>');
                div.css({"height":"102px", "width": "90px"});
                div.append(a);
                li.append(a);
                ul.append(li);
              }
              container.append(ul);
              ul.anythingSlider({
                    theme: 'minimalist-round'
                    ,buildNavigation: false
                    //,autoPlay: true
                    ,expand: true
                });
            }
        },
        
        _getRangeObject : function() {
            try {
                var selectionObject;
                if (window.getSelection) {
                    selectionObject = window.getSelection();
                } else if (document.selection) {
                    selectionObject = document.selection.createRange();
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
    };
        
};

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    if (request.action === "create") {
        window.terkait.create();
        sendResponse({
            success : true
        });
    } else if (request.action === "recommend") {
        try {
            var res = window.terkait.recommend();
            sendResponse({
                result : res,
                success : true
            });
        } catch (e) {
            sendResponse({
                error : e
            });
        }
    } else if (request.action === "annotateSelectionAs") {
        var res = window.terkait.annotate(request["args"]["id"], sendResponse);
    } else {
        sendResponse({
            error : "unknown request!" + request
        });
        console.log("unknown request", request);
    }
});
