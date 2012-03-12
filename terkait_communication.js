/**
 * This file holds all methods to communicate with the background.html page.
 */

if (!window.terkait) {
    window.terkait = {};
}

window.terkait.communication =  {};

jQuery.extend(window.terkait.communication, {
	sendReq : function  (req, opts) {
		opts = (opts)? opts : {};
		
		if (req === "getOptions") {
			chrome.extension.sendRequest({action: req}, function (theOptions) {
				window.terkait.settings = theOptions;
				if (typeof window.terkait.vie === "function")
					window.terkait.vie = window.terkait.vie();
				window.terkait.updateSettings();
			});
		} else if (req === "openUrl") {
			chrome.extension.sendRequest({action: req, options: opts});
		}
	}
});

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
	if (request.action === "createOrDestroy") {
        var res = window.terkait.createOrDestroy();
        sendResponse(res);
    } else if (request.action === "recommend") {
        var res = window.terkait.recommend();
        sendResponse(res);
    } else if (request.action === "analyzeSelection") {
    	window.terkait.create();
    	var rng = window.terkait.util.getRangeObject();
        if (rng) {
            rng.expand("word"); // expands to word boundaries
            var text = rng.toString();
            var res = window.terkait.recommend(text);
            sendResponse(res);
        } else {
        	sendResponse({
                error : "No Range could be found!"
            });
        }
    } else if (request.action === "annotateSelectionAs") {
        var res = window.terkait.annotate(request["args"]["id"], sendResponse);
        sendResponse(res);
    } else {
        sendResponse({
            error : "unknown request!" + request
        });
    }
});


window.terkait.communication.sendReq("getOptions");
setInterval(function () {window.terkait.communication.sendReq("getOptions");}, 10000);