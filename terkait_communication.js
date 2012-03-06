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
	if (request.action === "create") {
        var res = window.terkait.create();
        sendResponse({
            success : res
        });
    } else if (request.action === "destroy") {
        var res = window.terkait.destroy();
        sendResponse({
            success : res
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


window.terkait.communication.sendReq("getOptions");
setInterval(function () {window.terkait.communication.sendReq("getOptions");}, 10000);