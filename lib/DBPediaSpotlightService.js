//     VIE - Vienna IKS Editables
//     (c) 2011 Henri Bergius, IKS Consortium
//     (c) 2011 Sebastian Germesin, IKS Consortium
//     (c) 2011 Szaby Grünwald, IKS Consortium
//     VIE may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://viejs.org/

// ## VIE - DBPediaSpotlight service
// The DBPediaSpotlight service allows a VIE developer to analyze content
// with the enhancement endpoint that is offered by DBPedia Sportlight.
(function(){

// ## VIE.DBPediaSpotlightService(options)
// This is the constructor to instantiate a new service.  
// **Parameters**:  
// *{object}* **options** Optional set of fields, ```namespaces```, ```rules```, or ```name```.  
// **Throws**:  
// *nothing*  
// **Returns**:  
// *{VIE.DBPediaSpotlightService}* : A **new** VIE.DBPediaSpotlightService instance.  
// **Example usage**:  
//
//     var dbpsptlghtService = new vie.DBPediaSpotlightService({<some-configuration>});
VIE.prototype.DBPediaSpotlightService = function (options) {
    var defaults = {
        /* the default name of this service */
        name : 'dbpedia-spotlight',
        /* default namespaces that are shipped with this service */
        namespaces : {
            owl    : "http://www.w3.org/2002/07/owl#",
            yago   : "http://dbpedia.org/class/yago/",
            foaf: 'http://xmlns.com/foaf/0.1/',
            georss: "http://www.georss.org/georss/",
            geo: 'http://www.w3.org/2003/01/geo/wgs84_pos#',
            rdfs: "http://www.w3.org/2000/01/rdf-schema#",
            rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            dbpedia: "http://dbpedia.org/ontology/",
            dbprop : "http://dbpedia.org/property/",
            dcelements : "http://purl.org/dc/elements/1.1/"
        },
        /* default rules that are shipped with this service */
        rules : []
    };
    /* the options are merged with the default options */
    this.options = jQuery.extend(true, defaults, options ? options : {});

    this.vie = null; /* this.vie will be set via VIE.use(); */
    /* overwrite options.name if you want to set another name */
    this.name = this.options.name;
    
    /* basic setup for the ajax connection */
    jQuery.ajaxSetup({
        converters: {"text application/rdf+json": function(s){return JSON.parse(s);}},
        timeout: 60000 /* 60 seconds timeout */
    });
};

VIE.prototype.DBPediaSpotlightService.prototype = {
    
// ### init()
// This method initializes certain properties of the service and is called
// via ```VIE.use()```.  
// **Parameters**:  
// *nothing*  
// **Throws**:  
// *nothing*  
// **Returns**:  
// *{VIE.DBPediaSpotlightService}* : The VIE.DBPediaSpotlightService instance itself.  
// **Example usage**:  
//
//     var dbpService = new vie.DBPediaSpotlightService({<some-configuration>});
//     dbpService.init();
    init: function() {

        for (var key in this.options.namespaces) {
            var val = this.options.namespaces[key];
            this.vie.namespaces.add(key, val);
        }
        
        this.rules = jQuery.extend([], VIE.Util.transformationRules(this));
        this.rules = jQuery.merge(this.rules, (this.options.rules) ? this.options.rules : []);
        
        this.connector = new this.vie.DBPediaSpotlightConnector(this.options);
        
        return this;
    },
    

//  ### analyze(analyzable)
//  This method extracts text from the jQuery element and sends it to DBPediaSpotlight for analysis.  
//  **Parameters**:  
//  *{VIE.Analyzable}* **analyzable** The analyzable.  
//  **Throws**:  
//  *{Error}* if an invalid VIE.Findable is passed.  
//  **Returns**:  
//  *{VIE.DBPediaSpotlightService}* : The VIE.DBPediaSpotlightService instance itself.  
//  **Example usage**:  

//  var service = new vie.DBPediaSpotlightService({<some-configuration>});
//  service.analyzable(
//  new vie.Analyzable({element : jQuery("#foo")})
//  );
    analyze: function(analyzable) {
        var service = this;

        var correct = analyzable instanceof this.vie.Analyzable;
        if (!correct) {throw "Invalid Analyzable passed";}

        var element = analyzable.options.element ? analyzable.options.element : jQuery('body');

        var text = service._extractText(element);
        //text = "President Obama on Monday will call for a new minimum tax rate for individuals making more than $1 million a year to ensure that they pay at least the same percentage of their earnings as other taxpayers, according to administration officials.";
        
        if (text.length > 0) {
            /* query enhancer with extracted text */
            var success = function (results) {
                _.defer(function(){
                    var entities = [];
                    
                    if (results.Resources) {
		     for (var r = 0; r < results.Resources.length; r++) {
                        var resource = results.Resources[r];
                        
                        var type = "owl:Thing";
                        var hasSchemaOrgType = resource['@types'].match(/.*Schema.*/);
                        if (hasSchemaOrgType) {
                            type = "<" + resource['@types'].replace(/.*Schema:(\w+).*/g, "http://schema.org/$1") + ">";
                        }
                        
                        var entity = new service.vie.Entity({
                            '@subject' : resource["@URI"],
                            'surfaceForm' : resource["@surfaceForm"],
                            'name' : resource["@surfaceForm"],
                            'support' : resource["@support"],
                            'similarityScore' : resource["@similarityScore"],
                            'percentageOfSecondRank' : resource["@percentageOfSecondRank"],
                            'offset' : resource["@offset"],
                            '@type' : type
                        });
                        entities.push(entity);
                      }
		    }
                    analyzable.resolve(entities);
                });
            };
            var error = function (e) {
                analyzable.reject(e);
            };

            var options = {
                    confidence : analyzable.confidence ? analyzable.confidence : 0.4,
                    support : analyzable.support ? analyzable.support : 20,
                    spotter : analyzable.spotter ? analyzable.spotter : 'LingPipeSpotter', // one of: LingPipeSpotter,AtLeastOneNounSelector,CoOccurrenceBasedSelector
                    disambiguator : analyzable.spotter ? analyzable.spotter : 'Default', // one of: LingPipeSpotter,AtLeastOneNounSelector,CoOccurrenceBasedSelector
                    policy : analyzable.spotter ? analyzable.spotter : 'whitelist',
                    showScores: analyzable.showScores ? analyzable.showScores : 'yes',
                    'powered_by': analyzable['powered_by'] ? analyzable['powered_by'] : 'no',
                    types : analyzable.types ? analyzable.types : "",
                    sparql : analyzable.sparql ? analyzable.sparql : ""
            };

            this.connector.analyze(text, success, error, options);

        } else {
            console.warn("No text found in element.");
            analyzable.reject([]);
        }

    },

    /* this private method extracts text from a jQuery element */
    _extractText: function (element) {
        if (element.get(0) &&
                element.get(0).tagName &&
                (element.get(0).tagName == 'TEXTAREA' ||
                        element.get(0).tagName == 'INPUT' && element.attr('type', 'text'))) {
            return element.get(0).val();
        }
        else {
            var res = element
            .text()    /* get the text of element */
            .replace(/\s+/g, ' ') /* collapse multiple whitespaces */
            .replace(/\0\b\n\r\f\t/g, ''); /* remove non-letter symbols */
            return jQuery.trim(res);
        }
    }
};

// ## VIE.DBPediaSpotlightConnector(options)
// The DBPediaSpotlightConnector is the connection between the DBPediaSpotlight service
// and the backend service.  
// **Parameters**:  
// *{object}* **options** The options.  
// **Throws**:  
// *nothing*  
// **Returns**:  
// *{VIE.DBPediaSpotlightConnector}* : The **new** VIE.DBPediaSpotlightConnector instance.  
// **Example usage**:  
//
//     var dbpConn = new vie.DBPediaSpotlightConnector({<some-configuration>});
VIE.prototype.DBPediaSpotlightConnector = function (options) {
    
    var defaults =  {
        /* you can pass an array of URLs which are then tried sequentially */
        url: ["http://spotlight.dbpedia.org/rest/annotate"],
        timeout : 20000, /* 20 seconds timeout */
        "api_key" : undefined
    };

    /* the options are merged with the default options */
    this.options = jQuery.extend(true, defaults, options ? options : {});
    this.options.url = (_.isArray(this.options.url))? this.options.url : [ this.options.url ];
    
    this._init();

    this.baseUrl = (_.isArray(options.url))? options.url : [ options.url ];
};

VIE.prototype.DBPediaSpotlightConnector.prototype = {
        
     // ### _init()
     // Basic setup of the DBPediaSpotlight connector.  This is called internally by the constructor!
     // **Parameters**:  
     // *nothing*
     // **Throws**:  
     // *nothing*  
     // **Returns**:  
     // *{VIE.DBPediaSpotlightConnector}* : The VIE.DBPediaSpotlightConnector instance itself. 
         _init : function () {
             var connector = this;
             
             /* basic setup for the ajax connection */
             jQuery.ajaxSetup({
                 converters: {"text application/rdf+json": function(s){return JSON.parse(s);}},
                 timeout: connector.options.timeout
             });
             
             return this;
         },
         
        _iterate : function (params) {
            if (!params) { return; }
            
            if (params.urlIndex >= this.options.url.length) {
                params.error.call(this, "Could not connect to the given DBPediaSpotlight endpoints! Please check for their setup!");
                return;
            }
            
            var retryErrorCb = function (c, p) {
                /* in case a Zemanta backend is not responding and
                 * multiple URLs have been registered
                 */
                return function () {
                    console.log("DBPediaSpotlight connection error", arguments);
                    p.urlIndex = p.urlIndex+1;
                    c._iterate(p);
                };
            }(this, params);

            if (typeof exports !== "undefined" && typeof process !== "undefined") {
                /* We're on Node.js, don't use jQuery.ajax */
                return params.methodNode.call(
                        this, 
                        params.url.call(this, params.urlIndex, params.args.options),
                        params.args,
                        params.success,
                        retryErrorCb);
            }
            
            return params.method.call(
                    this, 
                    params.url.call(this, params.urlIndex, params.args.options),
                    params.args,
                    params.success,
                    retryErrorCb);
        },

        // ### analyze(text, success, error, options)
        // This method sends the given text to DBPediaSpotlight returns the result by the success callback.  
        // **Parameters**:  
        // *{string}* **text** The text to be analyzed.  
        // *{function}* **success** The success callback.  
        // *{function}* **error** The error callback.  
        // *{object}* **options** Options, like the ```format```, or the ```chain``` to be used.  
        // **Throws**:  
        // *nothing*  
        // **Returns**:  
        // *{VIE.DBPediaSpotlightConnector}* : The VIE.DBPediaSpotlightConnector instance itself.  
        // **Example usage**:  
         //
        //          var conn = new vie.DBPediaSpotlightConnector(opts);
        //          conn.analyze("<p>This is some HTML text.</p>",
        //                      function (res) { ... },
        //                      function (err) { ... });
        analyze: function(text, success, error, options) {
            options = (options)? options :  {};
            var connector = this;
            
            var chunks = text.match(/(.+? ){1,150}/g);
            
            if (chunks.length > 1) {
                var firstPart = chunks.shift().trim();
                var rest = chunks.join(" ").trim();
                
                connector._iterate({
                    method : connector._analyze,
                    methodNode : connector._analyzeNode,
                    success : function (r, s, e, o) {
                        return function (result) {
                            success(result);
                            connector.analyze(r, s, e, o);
                        };
                    }(rest, success, error, options),
                    error : error,
                    url : function (idx, opts) {
                        var u = this.options.url[idx].replace(/\/$/, '');
                        return u;
                    },
                    args : {
                        text : firstPart,
                        confidence : 0.4,
                        support : 20,
                        spotter : 'LingPipeSpotter', // one of: LingPipeSpotter,AtLeastOneNounSelector,CoOccurrenceBasedSelector
                        disambiguator : 'Default', // one of: LingPipeSpotter,AtLeastOneNounSelector,CoOccurrenceBasedSelector
                        policy : 'whitelist',
                        'showScores': 'yes',
                        'powered_by': 'no',
                        types : "",
                        sparql : "",
                        format : options.format || "application/json",
                        options : options
                    },
                    urlIndex : 0
                });
            } else {            
                connector._iterate({
                    method : connector._analyze,
                    methodNode : connector._analyzeNode,
                    success : success,
                    error : error,
                    url : function (idx, opts) {
                        var u = this.options.url[idx].replace(/\/$/, '');
                        return u;
                    },
                    args : {
                        text : text,
                        confidence : 0.4,
                        support : 20,
                        spotter : 'LingPipeSpotter', // one of: LingPipeSpotter,AtLeastOneNounSelector,CoOccurrenceBasedSelector
                        disambiguator : 'Default', // one of: LingPipeSpotter,AtLeastOneNounSelector,CoOccurrenceBasedSelector
                        policy : 'whitelist',
                        'showScores': 'yes',
                        'powered_by': 'no',
                        types : "",
                        sparql : "",
                        format : options.format || "application/json",
                        options : options
                    },
                    urlIndex : 0
                });
            }
        },
        
        _analyze : function (url, args, success, error) {           
            jQuery.ajax({ 
                url: url,
                type: "POST",
                success : success,
                error: error,
                data: {
                    'text': args.text,
                    'confidence': args.confidence,
                    'support': args.support, 
                    'spotter': args.spotter, 
                    'disambiguator': args.disambiguator, 
                    'policy': args.policy,
                    'types' : args.types,
                    'sparql' : args.sparql
                },
                headers: {'Accept': 'application/json'},
              });
        },

        _analyzeNode: function(url, args, success, error) {
            /*
            var request = require('request');
            var r = request({
                method: "POST",
                uri: url,
                body: args.text,
                headers: {
                    Accept: args.format,
                    'Content-Type': 'text/plain'
                }
            }, function(err, response, body) {
                try {
                    success({results: JSON.parse(body)});
                } catch (e) {
                    error(e);
                }
            });
            r.end();*/
            //TODO!
        }
};
})();

