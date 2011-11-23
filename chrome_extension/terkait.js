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
                                console.log("rendering " + entitiesOfInterest.length + " entities");
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
                // append at the end of the container!
                var accordionContainer = jQuery('<div>')
                    .addClass("accordion")
                    .append(this.createCloseButton())
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

                //button for country
                if (entity.has("dbpedia:country")) {
                    var range = this.getLabel(entity.get("dbpedia:country"));
                    var prop = $('<p>country: </p>');
                    var button = $('<button></button>');

                    button.click(function(entity, accordion) {
                        return function() {
                            window.terkait.render(entity, accordion);
                        };
                    }(entity, card.parent()));

                    rightSideCard.append(prop.append(button.append(range)));
                }
                //button for country
                if (entity.has("dbpedia:district")) {
                    var range = this.getLabel(entity.get("dbpedia:district"));
                    var prop = $('<p>district: </p>');
                    var button = $('<button></button>');

                    button.click(function(entity, accordion) {
                        return function() {
                            window.terkait.render(entity, accordion);
                        };
                    }(entity, card.parent()));

                    rightSideCard.append(prop.append(button.append(range)));
                }
            // DEBUG
        },
        
        getLabel : function(entity) {
            if (entity.has("name")) {
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
            var title = $('<h3>').text("Recommended Content");
            
            var images = terkait._renderImages(entity);
            var videos = $('<div>');
            var websearch = $('<div>');
            var newssearch = $('<div>');
            var historysearch = $('<div>');
            
            panel
                .append(title)
                .append(images)
                .append(videos)
                .append(websearch)
                .append(newssearch)
                .append(historysearch);
                
        },
        
        _renderImages : function (entity) {
            var imgContainer = $('<div>');
            
            imgContainer
                .vieImageSearch({
                    vie    : window.terkait.vie,
                    bin_size: 8,
                    services : {
                        gimage : {
                            use: true
                        }
                    },
                    render: function(data) {
                                        var self = this;
                        
                                        var photos = self.options.photos;
                                        var time = data.time;
                                        
                                        // clear the container element
                                        jQuery(self.element).empty();
                                        //rendering
                                        var ul = jQuery('<ul>');
                                        for (var p = 0; p < photos.length && p < this.options.bin_size; p++) {
                                            var photo = photos[p];
                                            var li = jQuery('<li class="slider_item">');
                                            var a = jQuery('<a class="' + self.widgetBaseClass + '-image" target="_blank" href="' + photo.original + '"></a>');
                                            var img = jQuery('<img src="' + photo.thumbnail + '" />');
                                            var div = jQuery('<div>');
                                            div.css({"height":"102px", "width": "90px"});
                                            a.append(img);
                                            div.append(a);
                                            li.append(a);
                                            ul.append(li);
                                            
                                        }
                                        ul.appendTo(jQuery(self.element));
                                        /*ul.anythingSlider({
                                            theme: 'minimalist-round'
                                            ,buildNavigation: false
                                            //,autoPlay: true
                                            ,expand: true
                                        });*/
                                        jQuery('img', ul).each(function(){
                                            var max_height = 90;
                                            var max_width = 90;
                                            var img_pad = Math.round((max_height-jQuery(this).height())/2)+"px "+Math.round((max_width-jQuery(this).width())/2)+"px";
                                            jQuery(this).css({"max-height":max_height+"px", "max-width": max_width+"px", padding: img_pad,"background-color":"black"});
                                        });    
                                        return this;}
                    
            });
            imgContainer
                .vieImageSearch({
                    entity: entity
            });
        },
        /*
            var newsContainer = jQuery('<div class = "tag_news">');
            contentSelector.append(newsContainer);
            //newsSearch = new google.search.NewsSearch();
            newsSearch.setSearchCompleteCallback(this, window.terkait.searchComplete, [newsSearch,newsContainer]);
            newsSearch.execute(query);
            
            var videoContainer = jQuery('<div class = "tag_video">');
            contentSelector.append(videoContainer);
            var videoSearch = new google.search.VideoSearch();
            videoSearch.setSearchCompleteCallback(this, window.terkait.searchComplete, [videoSearch,videoContainer]);
            videoSearch.execute(query);        
        }, */
        
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
