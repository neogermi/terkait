if (!window.terkait) {

	window.terkait = {

		vie : function() {
			var v = new VIE();
			v.loadSchemaOrg();
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
				jQuery('#terkait-container .container').empty();
			} else {
				jQuery('<div id="terkait-container">')
						.css(
								{
									"background-image" : "url("
											+ chrome.extension
													.getURL("terkait_transparent.png")
											+ ")"
								})
						.hover(function() {
							jQuery(this).animate({
								"right" : "-1em"
							})
						}, function() {
							jQuery(this).animate({
								"right" : "-25em"
							})
						})
						.appendTo(
								jQuery('<div id="terkait-wrapper">').appendTo(
										jQuery('body')))
						.append(
								jQuery(
										'<div id="terkait-entities" class="entities"></div>')
										.append(
												jQuery('<div class="container">')));
			}
			;
		},

		selector : function() {
			var res = $(
					':header,header,section,article,div,span,p,q,i,b,u,em,strong,font')
					.filter(
							function() {
								var $this = $(this);
								var text = $this.text() // get the text of
								// element
								.replace(/\W/g, ' ') // remove non-letter
								// symbols
								.replace(/\s+/g, ' ').trim(); // collapse
								// multiple
								// whitespaces

								var words = text.match(/\b\w{5,}\b/g); // a
								// word
								// contains
								// at
								// least 5 letters
								var children = $this.children();
								var emptyChildren = $this.children()
										.filter(
												function() {
													return $(this).children()
															.size() === 0;
												});
								var hasText = text.length > 0;
								var numWords = (words === null) ? 0
										: words.length;
								var area = $this.height() * $this.width();
								var isShown = area > 0
										&& $this.css('display') !== "none"
										&& $this.css('visibility') !== "hidden";

								return (isShown && hasText && numWords > 5 && (children
										.size() === emptyChildren.size()));
							});

			return res;
		},

		recommend : function() {
			var elems = this.selector();
			elems.addClass("terkait-toi");
			var meta = $('<span>');
			elems.each(function() {
				var text = $(this).text();
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
									var isEntityOfInterest = (!entity
											.isof("enhancer:Enhancement"))
											&& (entity.isof("Person")
													|| entity.isof("Place")
													|| entity
															.isof("Organization") || entity
													.isof("skos:Concept"));
									var hasAnnotations = entity
											.has("enhancer:hasEntityAnnotation")
											|| entity
													.has("enhancer:hasTextAnnotation");

									if (isEntityOfInterest && hasAnnotations) {
										entitiesOfInterest.push(entity);
									}
								}
								// sorting by "relevance" (number of occurrences
								// in the text)
								entitiesOfInterest
										.sort(function(a, b) {
											var numOfEntityAnnotsA = ($
													.isArray(a
															.get("enhancer:hasEntityAnnotation"))) ? a
													.get("enhancer:hasEntityAnnotation").length
													: 1;
											var numOfTextAnnotsA = ($
													.isArray(a
															.get("enhancer:hasTextAnnotation"))) ? a
													.get("enhancer:hasTextAnnotation").length
													: 1;
											var sumA = numOfEntityAnnotsA
													+ numOfTextAnnotsA;
											var numOfEntityAnnotsB = ($
													.isArray(b
															.get("enhancer:hasEntityAnnotation"))) ? b
													.get("enhancer:hasEntityAnnotation").length
													: 1;
											var numOfTextAnnotsB = ($
													.isArray(b
															.get("enhancer:hasTextAnnotation"))) ? b
													.get("enhancer:hasTextAnnotation").length
													: 1;
											var sumB = numOfEntityAnnotsB
													+ numOfTextAnnotsB;

											if (sumA == sumB)
												return 0;
											else if (sumA < sumB)
												return 1;
											else
												return -1;
										});
								for ( var i = 0; i < entitiesOfInterest.length; i++) {
									var entity = entitiesOfInterest[i];
									window.terkait.render(entity);

									// trigger a search in DBPedia to ensure to
									// have "all"
									// properties
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
								console.log("rendering:",
										entitiesOfInterest.length,
										entitiesOfInterest);
							}).fail(function(f) {
						console.warn(f);
						// TODO!
					});
			return {
				foundElems : elems.size() > 0
			};
		},
		
		createBBView: function (entity) {
		    var View = Backbone.View.extend({
		        
		        render: function () {
		            $(this.el).empty(); // clear card first
		            if (entity.isof("Person")) {
		                this.el = window.terkait.renderPerson(this.model);
		            } else if (entity.isof("Organization")) {
		                this.el = window.terkait.renderOrganization(this.model);
		            } else if (entity.isof("Place")) {
		                this.el = window.terkait.renderPlace(this.model);
		            }
		        }
		    });
		    return new View({model: entity});
		},
		
		render : function(entity, selector) {
		    var view = this.createBBView(entity); //create the VIEW on that entity
		    view.render(); // render it the first time
		    entity.bind("change", view.render); // bind the entitie's "change" event to a rerendering of the VIEW
		    
		    //the element of the VIEW
		    var div = $(view.el);
			
		    //where to put it?
            if (selector) {
				// append to that accordion!
				jQuery(selector).append(div);
			} else {
				// append at the end of the container!
				jQuery('#terkait-entities > .container').append(div);
			}
		},

		renderPerson : function(entity) {
			var div = jQuery('<div id="accordion"></div>');
			// var div = jQuery('<div>');
			var div = $('<div class ="entity_card">');
			var rightSideCard = $('<div class ="entityDetails">');
			// TODO: create new accordion in div and return that

			// jQuery('#terkait-container .container').append('');
			// TODO: foreach attribute that could be used:
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
						name = name[0]; // just take the
					// first
//					 div.append('<dl><dt>Test Slide</dt><dd><h2>TEST SLIDE</h2><p>Text to
//					 test</p></dd><div class="entity_card">la</div> </dd></dl>');
					var res = name.replace(/"/g, "").replace(/@[a-z]+/, '');
					div.append("<p> Person  :" + res + "</p>");
				}
				// TODO: Guy!
			}
			if (entity.has("givenName")) {
				var givenName = entity.get("name");
				if (jQuery.isArray(givenName) && givenName.length > 0) {
					for ( var i = 0; i < givenName.length; i++) {
						if (givenName[i].indexOf('@en') > -1) {
							givenName = givenName[i];
							break;
						}
					}
					if (jQuery.isArray(givenName))
						givenName = givenName[0]; // just
					// take
					// the
					// first
					div.append("<p> Person GIVENNAME :" + givenName + "</p>");
				}
				// TODO: Guy!
			}

			if (entity.has("birthDate")) {
				var birthDate = entity.get("birthDate");
				if (jQuery.isArray(birthDate) && birthDate.length > 0) {
					for ( var i = 0; i < birthDate.length; i++) {
						if (birthDate[i].indexOf('@en') > -1) {
							birthDate = birthDate[i];
							break;
						}
					}
					if (jQuery.isArray(birthDate))
						birthDate = birthDate[0]; // just
					// take
					// the
					// first
					div.append("<p> Person BIRTHDATE :" + birthDate + "</p>");
				}
				// TODO: Guy!
			}
			if (entity.has("text")) {
				var description = entity.get("text");
				if (jQuery.isArray(description) && description.length > 0) {
					for ( var i = 0; i < description.length; i++) {
						if (description[i].indexOf('@en') > -1) {
							description = description[i];
							break;
						}
					}
					if (jQuery.isArray(description))
						description = description[0]; // just
					// take
					// the
					// first
					div.append("<p> Person DESCRIPTION: " + description
							+ "</p>");
				}
				// TODO: Guy!
			}
			// initialize accordion
			div.easyAccordion({
				autoStart : false
			});
			return div;
		},

		renderOrganization : function(entity) {
			var div = jQuery('<div>');
			// TODO: create new accordion
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
						name = name[0]; // just take the
					// first
					div.append("<p> Organization NAME : " + name + "</p>");
				}
			}
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
						url = url[0]; // just take the
					// first
					div.append("<p> Organization URL: " + url + "</p>");
				}
			}
			if (entity.has("telephone")) {
				var telephone = entity.get("telephone");
				if (jQuery.isArray(telephone) && telephone.length > 0) {
					for ( var i = 0; i < telephone.length; i++) {
						if (telephone[i].indexOf('@en') > -1) {
							telephone = telephone[i];
							break;
						}
					}
					if (jQuery.isArray(telephone))
						telephone = telephone[0]; // just
					// take
					// the
					// first
					div.append("<p> Organization TELEPHONE : " + telephone
							+ "</p>");
				}
			}
			return div;
		},

		renderPlace : function(entity) {
			var arc = jQuery('<div id="accordion"></div>');
			// var div = jQuery('<div>');

			var div = $('<div class ="entity_card">');
			arc.append(div);
			var leftSideCard = $('<div class ="content">');
			var rightSideCard = $('<div class ="entityDetails">');
			div.append(leftSideCard);
			// TODO: create new accordion
			// var div = jQuery('<div id="accordion"></div>');
			// TODO: create new accordion in div and return that
			// jQuery('#terkait-container .container').append('');
			// TODO: foreach attribute that could be used:
			if (entity.has("geo")) {
				var geoCoordinates = entity.get("geo");
				console.log("unknown request", geoCoordinates);
				var url = geoCoordinates.get("url");
				div.append("<p>" + url + "</P>");
			}
			if (entity.has("latMIn")) {
				var lat = entity.get("lat");
				console.log("unknown request", lat);
				// var url = lat.get("url");
				div.append("<p>" + lat + "</P>");
			}
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
						name = name[0]; // just take the
					// first
					var res = name.replace(/"/g, "").replace(/@[a-z]+/, '');
					div.append(rightSideCard).append(
							"Place NAME :" + '<a href ="#">' + res + '</a>');
				}
			}
			if (entity.has("geo:lat")) {
				var geoCoordinates = entity.get("geo:lat");
				//console.log("unknown request", geoCoordinates);
				//var url = geoCoordinates.get("url");
				div.append("<p> Lat:" + geoCoordinates + "</P>");
			}
			if (entity.has("dbpedia:country")) {
				var country = entity.get("dbpedia:country");
				div.append("<p> Country :" + country + "</P>");
			}
			if (entity.has("website")) {
				var website = entity.get("website");
				div.append("<p> Place Website :" + website + "</P>");
			}
			// initialize accordion
			arc.easyAccordion({
				autoStart : false
			});
			return arc;
		},

		annotate : function(type, sendResponse) {
			var rng = window.terkait._getRangeObject();
			if (rng && rng.startContainer === rng.endContainer
					&& rng.startOffset !== rng.endOffset) {
				rng.expand("word"); // expands to word boundaries
				var selectedText = $(rng.cloneContents()).text();
				rng.deleteContents();
				var $elem = $("<span>" + selectedText + "</span>").addClass(
						"terkait-annotation");
				rng.insertNode($elem.get(0));

				var text = rng.toString();

				var entity = new window.terkait.vie.Entity({
					'@type' : window.terkait.vie.types.get(type),
					'name' : text
				});
				window.terkait.vie.entities.add(entity);

				window.terkait.vie.save({
					entity : entity,
					element : $elem
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