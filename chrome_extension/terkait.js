if (!window.terkait) {
    
    jQuery.extend(jQuery.expr[':'],{
        inline: function(a) {
            return jQuery(a).css('display') === 'inline';
        }
    });
    
window.terkait = {
        
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
               var isShown = $this.css('display') !== "none" && $this.css('visibility') !== "hidden";
               
               return (area > 0 &&
                       isShown &&
                       hasText && 
                       numWords > 5 &&
                       (children.size() === emptyChildren.size()));
            });
            
            return res;
        },
        
        recommend: function() {
            var elems = this.selector();
            elems.addClass("terkait-toi");
            // var v = new VIE();
            return {
              foundElems : elems.size() > 0  
            };
        },
        
        annotate: function (selection, type) {
            //TODO
        }
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
            window.terkait.annotate(window.getSelection(), request["args"]["id"]);
            sendResponse({success: true});
        }
        else {
            sendResponse({error: "unknown request!" + request});
            console.log("unknown request", request);
        }
});