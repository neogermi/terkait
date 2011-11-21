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
						/*
						 * no hovering for development .hover(function() {
						 * jQuery(this).animate({ "right" : "-1em" }) },
						 * function() { jQuery(this).animate({ "right" : "-25em" }) })
						 */
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

		createBBView : function(entity) {
			var CardView = Backbone.View.extend({

				className : "entity_card",

				initialize : function() {
					// bind the entitie's "change" event to a rerendering of the
					// VIEW
					this.model.bind("change", this.render, this);
					this.render(); // render it the first time
				},

				render : function() {
					var $el = $(this.el);
					$el.empty(); // clear card first
					if (entity.isof("Person")) {
						window.terkait.renderPerson(this.model, $el);
					} else if (entity.isof("Organization")) {
						window.terkait.renderOrganization(this.model, $el);
					} else if (entity.isof("Place")) {
						window.terkait.renderPlace(this.model, $el);
					}
				}
			});
			return new CardView({
				model : entity
			});
		},

		render : function(entity, selector) {
			var cardView = this.createBBView(entity); // create the VIEW on
			// that entity

			var dt = $('<dt>').text(window.terkait.getLabel(entity));
			var dd = $('<dd>').append($(cardView.el));

			// where to put it?
			if (selector) {
				// append to that accordion!
				jQuery(selector).find('dl').first().append(dt).append(dd);
			} else {
				var dl = $('<dl>').append(dt).append(dd);

				var accordion = $('<div class="accordion">').append(dl);
				// append at the end of the container!
				jQuery('#terkait-entities > .container').append(accordion);
			}
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
			return "No name!";
		},

		renderPerson : function(entity, card) {
			var rightSideCard = $('<div class ="entityDetails">');
			card.append(rightSideCard);
			var res = this.getLabel(entity);
			rightSideCard.append("<p> Person  :" + res + "</p>");

		},

		renderOrganization : function(entity, card) {
			var leftSideCard = $('<div class ="content">');
			var rightSideCard = $('<div class ="entityDetails">');
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
						url = url[0]; // just take the
					// first
					rightSideCard.append("<p> Organization URL: " + url + "</p>");
				}
			}
		},

		renderPlace : function(entity, card) {
			var leftSideCard = $('<div class ="content">');
			var rightSideCard = $('<div class ="entityDetails">');
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
			// TODO: GUY: var options = this.initMap(latitude, longitude);
			// TODO: GUY: var map = new
			// google.maps.Map(document.getElementById("map_canvas"), options);
			// DEBUG
			var button = $('<button>BUTTON</button>');

			button.click(function(entity, accordion) {
				return function() {
					window.terkait.render(entity, accordion);
				};
			}(entity, card.parent()));

			card.append(button);
			// DEBUG
		},

		initMap : function(latitude, longitude) {
			var latlng = new google.maps.LatLng(latitude, longitude);
			var myOptions = {
				zoom : 8,
				center : latlng,
				mapTypeId : google.maps.MapTypeId.ROADMAP
			};
			return myOptions;
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
