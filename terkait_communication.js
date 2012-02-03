/**
 * This file holds all methods to communicate with the background.html page.
 */

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

chrome.extension.sendRequest({action: 'gpmeGetOptions'}, function (theOptions) {
	window.terkait.settings = theOptions;
	window.terkait.vie = window.terkait.vie();
});