if (!window.terkait) {
    
    jQuery.extend(jQuery.expr[':'],{
        inline: function(a) {
            return jQuery(a).css('display') === 'inline';
        }
    });
    
window.terkait = {
        
        vie : function() {
            var v = new VIE();
            v.loadSchemaOrg();
            v.use(new v.StanbolService({url : "http://dev.iks-project.eu:8081", proxyDisabled: true}));
            v.use(new v.RdfaRdfQueryService());
            return v;
        }(),
        
        create : function () {
            if (jQuery('#terkait-container').size() > 0) {
                //clear former results!
                jQuery('#terkait-container .container').empty();
            } else {
                jQuery('<div id="terkait-container">')
                .css({
                    "background-image" : "url(" + chrome.extension.getURL("terkait_transparent.png") + ")"
                })
                .hover (
                        function () {jQuery(this).animate({"right" : "-1em"})},
                        function () {jQuery(this).animate({"right" : "-25em"})}
                )
                .appendTo(jQuery('<div id="terkait-wrapper">').appendTo(jQuery('body')))
                .append(jQuery('<div id="terkait-persons" class="entities"></div>').append(jQuery('<div class="container">')));
                };
        },
                
        selector : function () {
            var res = $(':header,header,section,article,div,span,p,q,i,b,u,em,strong,font')
            .filter (function () {
               var $this = $(this);
               var text = $this
               .text()    //get the text of element
               .replace(/\W/g, ' ') // remove non-letter symbols
               .replace(/\s+/g, ' ').trim(); //collapse multiple whitespaces
               
               var words = text.match(/\b\w{5,}\b/g); //a word contains at least 5 letters
               var children = $this.children();
               var emptyChildren = $this.children().filter(function () {return $(this).children().size() === 0;});
               var hasText = text.length > 0;
               var numWords = (words === null)? 0 : words.length;
               var area = $this.height() * $this.width();
               var isShown = area > 0 && $this.css('display') !== "none" && $this.css('visibility') !== "hidden";
               
               return (isShown &&
                       hasText && 
                       numWords > 5 &&
                       (children.size() === emptyChildren.size()));
            });
            
            return res;
        },
        
        recommend: function() {
            var elems = this.selector();
            elems.addClass("terkait-toi");
            elems.each(function () {
                var $this = $(this);
                window.terkait.vie
                .analyze({element: $this})
                .using('stanbol')
                .execute()
                .done(function(entities) {
                    //TODO!
                    console.log(entities);
                })
                .fail(function(f){
                    //TODO!
                });
            });
            return {
              foundElems : elems.size() > 0  
            };
        },
        
        annotate: function (type, sendResponse) {
            var rng = window.terkait._getRangeObject();
            if (rng && rng.startContainer === rng.endContainer && 
                rng.startOffset !== rng.endOffset) {
                rng.expand("word"); //expands to word boundaries
                var selectedText = $(rng.cloneContents()).text();
                rng.deleteContents();
                var $elem = $("<span>" + selectedText + "</span>").addClass("terkait-annotation");
                rng.insertNode($elem.get(0));
                
                var text = rng.toString();
                
                var entity = new window.terkait.vie.Entity({
                    '@type' : window.terkait.vie.types.get(type),
                    'name'  : text
                });
                window.terkait.vie.entities.add(entity);
                
                window.terkait.vie
                .save({entity: entity, element: $elem})
                .using('rdfardfquery')
                .execute()
                .done(function() {
                    sendResponse({success: true});
                })
                .fail(function() {
                    sendResponse({success: false});
                });
                return true;
            } else {
                return false;
            }
            
        },
        
        _getRangeObject: function () {
            try {
                var selectionObject;
                if (window.getSelection) {
                    selectionObject = window.getSelection();
                }
                else if (document.selection) {
                    selectionObject = document.selection.createRange();
                }
                if (selectionObject.getRangeAt)
                    return selectionObject.getRangeAt(0);
                else { // Safari!
                    var range = document.createRange();
                    range.setStart(selectionObject.anchorNode,selectionObject.anchorOffset);
                    range.setEnd(selectionObject.focusNode,selectionObject.focusOffset);
                    return range;
                }
            } catch (e) {
                //nothing to be ranged
                return undefined;
            }
        },
    };
}

chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "create") {
            window.terkait.create();
            sendResponse({success: true});
        }
        else if (request.action === "recommend") {
          try {
              var res = window.terkait.recommend();
              sendResponse({result : res, success: true});
          } catch (e) {
              sendResponse({error: e});
          }
        }
        else if (request.action === "annotateSelectionAs") {
            var res = window.terkait.annotate(request["args"]["id"], sendResponse);
        }
        else {
            sendResponse({error: "unknown request!" + request});
            console.log("unknown request", request);
        }
});