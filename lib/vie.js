(function(){//     VIE - Vienna IKS Editables
//     (c) 2011 Henri Bergius, IKS Consortium
//     (c) 2011 Sebastian Germesin, IKS Consortium
//     (c) 2011 Szaby Grünwald, IKS Consortium
//     VIE may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://viejs.org/
var root = this,
    jQuery = root.jQuery,
    Backbone = root.Backbone,
    _ = root._;

// ## VIE constructor
//
// The VIE constructor is the way to initialize VIE for your
// application. The instance of VIE handles all management of
// semantic interaction, including keeping track of entities,
// changes to them, the possible RDFa views on the page where
// the entities are displayed, and connections to external
// services like Stanbol and DBPedia.
//
// To get a VIE instance, simply run:
//
//     var vie = new VIE();
//
// You can also pass configurations to the VIE instance through
// the constructor. For example, to set a different default
// namespace to be used for names that don't have a namespace
// specified, do:
//
//     var vie = new VIE({
//         baseNamespace: 'http://example.net'
//     });
//
// ### Differences with VIE 1.x
//
// VIE 1.x used singletons for managing entities and views loaded
// from a page. This has been changed with VIE 2.x, and now all
// data managed by VIE is tied to the instance of VIE being used.
//
// This means that VIE needs to be instantiated before using. So,
// when previously you could get entities from page with:
//
//     VIE.RDFaEntities.getInstances();
//
// Now you need to instantiate VIE first. This example uses the
// Classic API compatibility layer instead of the `load` method:
//
//     var vie = new VIE();
//     vie.RDFaEntities.getInstances();
//
// Currently the Classic API is enabled by default, but it is
// recommended to ensure it is enabled before using it. So:
//
//     var vie = new VIE({classic: true});
//     vie.RDFaEntities.getInstances();
var VIE = root.VIE = function(config) {
    this.config = (config) ? config : {};
    this.services = {};
    this.entities = new this.Collection();

    this.Entity.prototype.entities = this.entities;
    this.entities.vie = this;
    this.Entity.prototype.entityCollection = this.Collection;
    this.Entity.prototype.vie = this;
    
    this.Namespaces.prototype.vie = this;
// ### Namespaces in VIE
// VIE supports different ontologies and an easy use of them.
// Namespace prefixes reduce the amount of code you have to
// write. In VIE, it does not matter if you access an entitie's
// property with 
// `entity.get('<http://dbpedia.org/property/capitalOf>')` or 
// `entity.get('dbprop:capitalOf')` or even 
// `entity.get('capitalOf')` once the corresponding namespace
// is registered as *baseNamespace*.
// By default `"http://viejs.org/ns/"`is set as base namespace.
// For more information about how to set, get and list all
// registered namespaces, refer to the 
// <a href="Namespace.html">Namespaces documentation</a>.
    this.namespaces = new this.Namespaces(
        (this.config.baseNamespace) ? this.config.baseNamespace : "http://viejs.org/ns/",
        
// By default, VIE is shipped with common namespace prefixes:

// +    owl    : "http://www.w3.org/2002/07/owl#"
// +    rdfs   : "http://www.w3.org/2000/01/rdf-schema#"
// +    rdf    : "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
// +    schema : 'http://schema.org/'
// +    foaf   : 'http://xmlns.com/foaf/0.1/'
// +    geo    : 'http://www.w3.org/2003/01/geo/wgs84_pos#'
// +    dbpedia: "http://dbpedia.org/ontology/"
// +    dbprop : "http://dbpedia.org/property/"
// +    skos   : "http://www.w3.org/2004/02/skos/core#"
// +    xsd    : "http://www.w3.org/2001/XMLSchema#"
// +    sioc   : "http://rdfs.org/sioc/ns#"
// +    dcterms: "http://purl.org/dc/terms/"
        {
            owl    : "http://www.w3.org/2002/07/owl#",
            rdfs   : "http://www.w3.org/2000/01/rdf-schema#",
            rdf    : "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            schema : 'http://schema.org/',
            foaf   : 'http://xmlns.com/foaf/0.1/',
            geo    : 'http://www.w3.org/2003/01/geo/wgs84_pos#',
            dbpedia: "http://dbpedia.org/ontology/",
            dbprop : "http://dbpedia.org/property/",
            skos   : "http://www.w3.org/2004/02/skos/core#",
            xsd    : "http://www.w3.org/2001/XMLSchema#",
            sioc   : "http://rdfs.org/sioc/ns#",
            dcterms: "http://purl.org/dc/terms/"
        }
    );


    this.Type.prototype.vie = this;
    this.Types.prototype.vie = this;
    this.Attribute.prototype.vie = this;
    this.Attributes.prototype.vie = this;
// ### Type hierarchy in VIE
// VIE takes care about type hierarchy of entities
// (aka. *schema* or *ontology*).
// Once a type hierarchy is known to VIE, we can leverage
// this information, to easily ask, whether an entity
// is of type, e.g., *foaf:Person* or *schema:Place*.
// For more information about how to generate such a type
// hierarchy, refer to the 
// <a href="Type.html">Types documentation</a>.
    this.types = new this.Types();
// By default, there is a parent type in VIE, called
// *owl:Thing*. All types automatically inherit from this
// type and all registered entities, are of this type.
    this.types.add("owl:Thing");

// As described above, the Classic API of VIE 1.x is loaded
// by default. As this might change in the future, it is
// recommended to ensure it is enabled before using it. So:
//
//     var vie = new VIE({classic: true});
//     vie.RDFaEntities.getInstances();
    if (this.config.classic !== false) {
        /* Load Classic API as well */
        this.RDFa = new this.ClassicRDFa(this);
        this.RDFaEntities = new this.ClassicRDFaEntities(this);
        this.EntityManager = new this.ClassicEntityManager(this);

        this.cleanup = function() {
            this.entities.reset();
        };
    }
};

// ### Service API of VIE
// TODO: describe me!
VIE.prototype.use = function(service, name) {
  if (!name) {
    name = service.name;
  }
  service.vie = this;
  service.name = name;
  if (service.init) {
      service.init();
  }
  this.services[name] = service;
};

VIE.prototype.service = function(name) {
  if (!this.services[name]) {
    throw "Undefined service " + name;
  }
  return this.services[name];
};

VIE.prototype.getServicesArray = function() {
  return _.map(this.services, function (v) {return v;});
};

// Declaring the ..able classes
// Loadable
VIE.prototype.load = function(options) {
  if (!options) { options = {}; }
  options.vie = this;
  return new this.Loadable(options);
};



// Savable
VIE.prototype.save = function(options) {
  if (!options) { options = {}; }
  options.vie = this;
  return new this.Savable(options);
};


// Removable
VIE.prototype.remove = function(options) {
  if (!options) { options = {}; }
  options.vie = this;
  return new this.Removable(options);
};


// Analyzable
VIE.prototype.analyze = function(options) {
  if (!options) { options = {}; }
  options.vie = this;
  return new this.Analyzable(options);
};


// Findable
VIE.prototype.find = function(options) {
  if (!options) { options = {}; }
  options.vie = this;
  return new this.Findable(options);
};

// VIE only knows the *owl:Thing* type by default.
// You can use `vie.loadSchema()` to import another
// schema (ontology) from an external resource.
// As this method works asynchronously, you might want
// to register `success` and `error` callbacks via the
// options:
//    
//     var vie = new VIE();
//     vie.loadSchema("http://schema.rdfs.org/all.json", 
//        {
//          baseNS : "http://schema.org/",
//          succes : function () {console.log("success");},
//          error  : function (msg) {console.warn(msg);}
//        });
VIE.prototype.loadSchema = function(url, options) {
    options = (!options)? {} : options;
    
    if (!url) {
        throw new Error("Please provide a proper URL");
    }
    else {
        var vie = this;
        jQuery.getJSON(url)
        .success(function(data) {
            VIE.Util.loadSchemaOrg(vie, data, options.baseNS);
            if (options.success) {
                options.success.call(vie);
            }
         })
        .error(function(data, textStatus, jqXHR) { 
            if (options.error) {
                options.error.call(vie, "Could not load schema from URL (" + url + ")");
            }
         });
    }
};

// ## Running VIE on Node.js
//
// When VIE is running under Node.js we can use the CommonJS
// require interface to load our dependencies automatically.
//
// This means Node.js users don't need to care about dependencies
// and can just run VIE with:
//
//     var VIE = require('vie');
//
// In browser environments the dependencies have to be included
// before including VIE itself.
if(typeof exports === 'object') {
    exports.VIE = VIE;

    if (!jQuery) {
        jQuery = require('jquery');
    }
    if (!Backbone) {
        Backbone = require('backbone');
    }
    if (!_) {
        _ = require('underscore')._;
    }
}
//     VIE - Vienna IKS Editables
//     (c) 2011 Henri Bergius, IKS Consortium
//     (c) 2011 Sebastian Germesin, IKS Consortium
//     (c) 2011 Szaby Grünwald, IKS Consortium
//     VIE may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://viejs.org/

VIE.prototype.Able = function(){
};
    // takes a list of services or just one
VIE.prototype.Able.prototype = {
    using: function(services) {
        var service = this;
        if ( services instanceof Array ) {
            _(services).each(function(s){
                service._using(s);
            });
        } else {
            var s = services;
            service._using(s);
        }
        return this;
    },
    _using: function(service) {
        var self = this;
        var serviceObj = (_.isArray(service))? service : [ service ];
        _.each (serviceObj, function (s) {
            var obj = (typeof s === "string")? self.vie.service(s) : s;
            self.services.push(obj);
        });
        return this;
    },
    init: function(options, methodName) {
        this.methodName = methodName;
        this.options = options;
        this.services = options.from || options.using || options.to || [];
        this.vie = options.vie;
        this.deferred = jQuery.Deferred();

        // Public deferred-methods
        this.resolve = this.deferred.resolve;
        this.resolveWith = this.deferred.resolveWith;
        this.reject = this.deferred.reject;
        this.rejectWith = this.deferred.rejectWith;

        // Synonyms
        this.success = this.done = this.deferred.done;
        this.fail = this.deferred.fail;
        this.then = this.deferred.then; // Takes 2 arguments, successCallbacks, failCallbacks
        this.always = this.deferred.always;
        this.from = this.using;
        this.to = this.using;
    },
    // Running the actual method
    execute: function() {
        // call service.load
        var able = this;
        _(this.services).each(function(service){
            service[able.methodName](able);
        });
        return this;
    }
};

VIE.prototype.Loadable = function (options) {
    this.init(options,"load");
};
VIE.prototype.Loadable.prototype = new VIE.prototype.Able();

VIE.prototype.Savable = function(options){
    this.init(options, "save");
};
VIE.prototype.Savable.prototype = new VIE.prototype.Able();

VIE.prototype.Removable = function(options){
    this.init(options, "remove");
};
VIE.prototype.Removable.prototype = new VIE.prototype.Able();

VIE.prototype.Analyzable = function (options) {
    this.init(options, "analyze");
};
VIE.prototype.Analyzable.prototype = new VIE.prototype.Able();

VIE.prototype.Findable = function (options) {
    this.init(options, "find");
};

VIE.prototype.Findable.prototype = new VIE.prototype.Able();

//     VIE - Vienna IKS Editables
//     (c) 2011 Henri Bergius, IKS Consortium
//     (c) 2011 Sebastian Germesin, IKS Consortium
//     (c) 2011 Szaby Grünwald, IKS Consortium
//     VIE may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://viejs.org/

// ## VIE Utils
//
// The here-listed methods are utility methods for the day-to-day 
// VIE.js usage. All methods are within the static namespace ```VIE.Util```.
VIE.Util = {
    
// ### VIE.Util.unduplicate(arr)
// This is a method which removes duplicates from an array.
//This methods leaves the original array untouched and returns a copy with no duplicates.  
// **Parameters**:  
// *{array}* **arr** The array where the duplicates should be removed from.  
// **Throws**:  
// nothing  
// **Returns**:  
// *{array}* : A **new** array, containing unique entries of the given array. **!Attention!**:
// The order of the returned array might differ from the input array.  
// **Example usage**:  
//
//     var arr = ["a", "a", "b" , "c", "d", "c", "e", "a"];
//     console.log(VIE.Util.unduplicate(arr).join(" "));
//         // --> "a b c d e"
    unduplicate : function (arr) {
        var sorted_arr = arr.sort();
        var results = [];
        for (var i = 0; i < sorted_arr.length; i++) {
            if (i === sorted_arr.length-1 || sorted_arr[i] !== sorted_arr[i+1]) {
                results.push(sorted_arr[i]);
            }
        }
        return results;
    },

// ### VIE.Util.toCurie(uri, safe, namespaces)
// This method converts a given 
// URI into a CURIE (or SCURIE), based on the given ```VIE.Namespaces``` object.
// If the given uri is already a URI, it is left untouched and directly returned.
// If no prefix could be found, an ```Error``` is thrown.  
// **Parameters**:  
// *{string}* **uri** The URI to be transformed.  
// *{boolean}* **safe** A flag whether to generate CURIEs or SCURIEs.  
// *{VIE.Namespaces}* **namespaces** The namespaces to be used for the prefixes.  
// **Throws**:  
// *{Error}* If no prefix could be found in the passed namespaces.  
// **Returns**:  
// *{string}* The CURIE or SCURIE.  
// **Example usage**: 
//
//     var ns = new myVIE.Namespaces(
//           "http://viejs.org/ns/", 
//           { "dbp": "http://dbpedia.org/ontology/" }
//     );
//     var uri = "<http://dbpedia.org/ontology/Person>";
//     VIE.Util.toCurie(uri, false, ns); // --> dbp:Person
//     VIE.Util.toCurie(uri, true, ns); // --> [dbp:Person]
	toCurie : function (uri, safe, namespaces) {
        if (VIE.Util.isCurie(uri, namespaces)) {
            return uri;
        }
        var delim = ":";
        for (var k in namespaces.toObj()) {
            if (uri.indexOf(namespaces.get(k)) === 1) {
                var pattern = new RegExp("^" + "<" + namespaces.get(k));
                if (k === '') {
                    delim = '';
                }
                return ((safe)? "[" : "") + 
                        uri.replace(pattern, k + delim).replace(/>$/, '') +
                        ((safe)? "]" : "");
            }
        }
        throw new Error("No prefix found for URI '" + uri + "'!");
    },

// ### VIE.Util.isCurie(curie, namespaces)
// This method checks, whether 
// the given string is a CURIE and returns ```true``` if so and ```false```otherwise.  
// **Parameters**:  
// *{string}* **curie** The CURIE (or SCURIE) to be checked.  
// *{VIE.Namespaces}* **namespaces** The namespaces to be used for the prefixes.  
// **Throws**:  
// nothing.  
// **Returns**:  
// *{boolean}* ```true``` if the given curie is a CURIE or SCURIE and ```false``` otherwise.  
// **Example usage**: 
//
//     var ns = new myVIE.Namespaces(
//           "http://viejs.org/ns/", 
//           { "dbp": "http://dbpedia.org/ontology/" }
//     );
//     var uri = "<http://dbpedia.org/ontology/Person>";
//     var curie = "dbp:Person";
//     var scurie = "[dbp:Person]";
//     var text = "This is some text.";
//     VIE.Util.isCurie(uri, ns);    // --> false
//     VIE.Util.isCurie(curie, ns);  // --> true
//     VIE.Util.isCurie(scurie, ns); // --> true
//     VIE.Util.isCurie(text, ns);   // --> false
    isCurie : function (curie, namespaces) {
        try {
            VIE.Util.toUri(curie, namespaces);
            return true;
        } catch (e) {
            return false;
        }
    },

// ### VIE.Util.toUri(curie, namespaces)
// This method converts a 
// given CURIE (or save CURIE) into a URI, based on the given ```VIE.Namespaces``` object.  
// **Parameters**:  
// *{string}* **curie** The CURIE to be transformed.  
// *{VIE.Namespaces}* **namespaces** The namespaces object  
// **Throws**:  
// *{Error}* If no URI could be assembled.  
// **Returns**:  
// *{string}* : A string, representing the URI.  
// **Example usage**: 
//
//     var ns = new myVIE.Namespaces(
//           "http://viejs.org/ns/", 
//           { "dbp": "http://dbpedia.org/ontology/" }
//     );
//     var curie = "dbp:Person";
//     var scurie = "[dbp:Person]";
//     VIE.Util.toUri(curie, ns); 
//          --> <http://dbpedia.org/ontology/Person>
//     VIE.Util.toUri(scurie, ns);
//          --> <http://dbpedia.org/ontology/Person>
    toUri : function (curie, namespaces) {
        var delim = ":";
        for (var prefix in namespaces.toObj()) {
            if (prefix !== "" && (curie.indexOf(prefix + ":") === 0 || curie.indexOf("[" + prefix + ":") === 0)) {
                var pattern = new RegExp("^" + "\\[{0,1}" + prefix + delim);
                return "<" + curie.replace(pattern, namespaces.get(prefix)).replace(/\]{0,1}$/, '') + ">";
            }
        }
        /* check for the default namespace */
        if (curie.indexOf(delim) === -1) {
            return "<" + namespaces.base() + curie + ">";
        }
        throw new Error("No prefix found for CURIE '" + curie + "'!");
    },
    
// ### VIE.Util.isUri(something)
// This method checks, whether the given string is a URI.  
// **Parameters**:  
// *{string}* **something** : The string to be checked.  
// **Throws**:  
// nothing  
// **Returns**:  
// *{boolean}* : ```true``` if the string is a URI, ```false``` otherwise.  
// **Example usage**: 
//
//     var uri = "<http://dbpedia.org/ontology/Person>";
//     var curie = "dbp:Person";
//     VIE.Util.isUri(uri, ns);   // --> true
//     VIE.Util.isUri(curie, ns); // --> false
    isUri : function (something) {
        return (typeof something === "string" && something.search(/^<.+:.+>$/) === 0);
    },
    
    
// ### VIE.Util.blankNodeID()
// This method generates a new blank id for an entity.  
// **Parameters**:  
// nothing  
// **Throws**:  
// nothing  
// **Returns**:  
// *{string}* : A string, representing a unique blank id with the prefix ```'_:bnode'```.  
// **Example usage**: 
//
//     VIE.Util.blankNodeID(); // --> _:bnode38e
//     VIE.Util.blankNodeID(); // --> _:bnode38f
    _blankNodeSeed : new Date().getTime() % 1000,
    
    blankNodeID : function () {
      VIE.Util._blankNodeSeed += 1;
      return '_:bnode' + VIE.Util._blankNodeSeed.toString(16);
    },

// ### VIE.Util.rdf2Entities(service, results)
// This method converts *rdf/json* data from an external service
// into VIE.Entities.  
// **Parameters**:  
// *{object}* **service** The service that retrieved the data.  
// *{object}* **results** The data to be transformed.  
// **Throws**:  
// nothing  
// **Returns**:  
// *{[VIE.Entity]}* : An array, containing VIE.Entity instances which have been transformed from the given data.
    rdf2Entities: function (service, results) {
        if (typeof jQuery.rdf !== 'function') {
            /* fallback if no rdfQuery has been loaded */
            return VIE.Util._rdf2EntitiesNoRdfQuery(service, results);
        }
        var rdf = (results instanceof jQuery.rdf)? results : jQuery.rdf().load(results, {});

        /* if the service contains rules to apply special transformation, they are executed here.*/
        if (service.rules) {
            var rules = jQuery.rdf.ruleset();
            for (var prefix in service.namespaces.toObj()) {
                if (prefix !== "") {
                    rules.prefix(prefix, service.namespaces.get(prefix));
                }
            }
            for (var i = 0; i < service.rules.length; i++)if(service.rules.hasOwnProperty(i)) {
                var rule = service.rules[i];
                rules.add(rule['left'], rule['right']);
            }
            rdf = rdf.reason(rules, 10); /* execute the rules only 10 times to avoid looping */
        }
        var entities = {};
        rdf.where('?subject ?property ?object').each(function() {
            var subject = this.subject.toString();
            if (!entities[subject]) {
                entities[subject] = {
                    '@subject': subject,
                    '@context': service.namespaces.toObj(),
                    '@type': []
                };
            }
            var propertyUri = this.property.toString();
            var propertyCurie;

            propertyUri = propertyUri.substring(1, propertyUri.length - 1);
            try {
                property = jQuery.createCurie(propertyUri, {namespaces: service.namespaces.toObj()});
            } catch (e) {
                property = propertyUri;
                console.warn(propertyUri + " doesn't have a namespace definition in '", service.namespaces.toObj());
            }
            entities[subject][property] = entities[subject][property] || [];

            function getValue(rdfQueryLiteral){
                if(typeof rdfQueryLiteral.value === "string"){
                    if (rdfQueryLiteral.lang)
                        return rdfQueryLiteral.toString();
                    else
                        return rdfQueryLiteral.value;
                    return rdfQueryLiteral.value.toString();
                } else if (rdfQueryLiteral.type === "uri"){
                    return rdfQueryLiteral.toString();
                } else {
                    return rdfQueryLiteral.value;
                }
            }
            entities[subject][property].push(getValue(this.object));
        });

        _(entities).each(function(ent){
            ent["@type"] = ent["@type"].concat(ent["rdf:type"]);
            delete ent["rdf:type"];
            _(ent).each(function(value, property){
                if(value.length === 1){
                    ent[property] = value[0];
                }
            });
        });

        var vieEntities = [];
        jQuery.each(entities, function() {
            var entityInstance = new service.vie.Entity(this);
            entityInstance = service.vie.entities.addOrUpdate(entityInstance);
            vieEntities.push(entityInstance);
        });
        return vieEntities;
    },
    
// ### VIE.Util._rdf2EntitiesNoRdfQuery(service, results)
// This is a **private** method which should
// only be accessed through ```VIE.Util._rdf2Entities()``` and is a helper method in case there is no
// rdfQuery loaded (*not recommended*).  
// **Parameters**:  
// *{object}* **service** The service that retrieved the data.  
// *{object}* **results** The data to be transformed.  
// **Throws**:  
// nothing  
// **Returns**:  
// *{[VIE.Entity]}* : An array, containing VIE.Entity instances which have been transformed from the given data.
    _rdf2EntitiesNoRdfQuery: function (service, results) {
        var jsonLD = [];
        _.forEach(results, function(value, key) {
            var entity = {};
            entity['@subject'] = '<' + key + '>';
            _.forEach(value, function(triples, predicate) {
                predicate = '<' + predicate + '>';
                _.forEach(triples, function(triple) {
                    if (triple.type === 'uri') {
                        triple.value = '<' + triple.value + '>';
                    }

                    if (entity[predicate] && !_.isArray(entity[predicate])) {
                        entity[predicate] = [entity[predicate]];
                    }

                    if (_.isArray(entity[predicate])) {
                        entity[predicate].push(triple.value);
                        return;
                    }
                    entity[predicate] = triple.value;
                });
            });
            jsonLD.push(entity);
        });
        return jsonLD;
    },

// ### VIE.Util.loadSchemaOrg(vie, SchemaOrg, baseNS)
// This method is a wrapper around
// the <a href="http://schema.org/">schema.org</a> ontology. It adds all the
// given types and properties as ```VIE.Type``` instances to the given VIE instance.
// If the paramenter **baseNS** is set, the method automatically sets the namespace
// to the provided one. If it is not set, it will keep the base namespace of VIE untouched.  
// **Parameters**:  
// *{VIE}* **vie** The instance of ```VIE```.   
// *{object}* **SchemaOrg** The data imported from schema.org.   
// *{string|undefined}* **baseNS** If set, this will become the new baseNamespace within the given ```VIE``` instance.   
// **Throws**:  
// *{Error}* If the parameter was not given.  
// **Returns**:  
// nothing.
    loadSchemaOrg : function (vie, SchemaOrg, baseNS) {
    
        if (!SchemaOrg) {
            throw new Error("Please load the schema.json file.");
        }
        vie.types.remove("<http://schema.org/Thing>");
        
        var baseNSBefore = (baseNS)? baseNS : vie.namespaces.base();
        vie.namespaces.base(baseNS);
        
        var datatypeMapping = {
            'DataType': 'xsd:anyType',
            'Boolean' : 'xsd:boolean',
            'Date'    : 'xsd:date',
            'Float'   : 'xsd:float',
            'Integer' : 'xsd:integer',
            'Number'  : 'xsd:anySimpleType',
            'Text'    : 'xsd:string',
            'URL'     : 'xsd:anyURI'
        };
        
        var dataTypeHelper = function (ancestors, id) {
            var type = vie.types.add(id, [{'id' : 'value', 'range' : datatypeMapping[id]}]);
            
            for (var i = 0; i < ancestors.length; i++) {
                var supertype = (vie.types.get(ancestors[i]))? vie.types.get(ancestors[i]) :
                    dataTypeHelper.call(vie, SchemaOrg["datatypes"][ancestors[i]].supertypes, ancestors[i]);
                type.inherit(supertype);
            }
            return type;
        };
        
        for (var dt in SchemaOrg["datatypes"]) {
            if (!vie.types.get(dt)) {
                var ancestors = SchemaOrg["datatypes"][dt].supertypes;
                dataTypeHelper.call(vie, ancestors, dt);
            }
        }
        
        var typeProps = function (id) {
            var props = [];
            var specProps = SchemaOrg["types"][id]["specific_properties"];
            for (var p = 0; p < specProps.length; p++) {
                var pId = specProps[p];
                var range = SchemaOrg["properties"][pId]["ranges"];
                props.push({
                    'id'    : pId,
                    'range' : range
                });
            }
            return props;
        };
        
        var typeHelper = function (ancestors, id, props) {
            var type = vie.types.add(id, props);
           
            for (var i = 0; i < ancestors.length; i++) {
                var supertype = (vie.types.get(ancestors[i]))? vie.types.get(ancestors[i]) :
                    typeHelper.call(vie, SchemaOrg["types"][ancestors[i]].supertypes, ancestors[i], typeProps.call(vie, ancestors[i]));
                type.inherit(supertype);
            }
            if (id === "Thing" && !type.isof("owl:Thing")) {
                type.inherit("owl:Thing");
            }
            return type;
        };
        
        for (var t in SchemaOrg["types"]) {
            if (!vie.types.get(t)) {
                var ancestors = SchemaOrg["types"][t].supertypes;
                typeHelper.call(vie, ancestors, t, typeProps.call(vie, t));
            }
        }
        /* set the namespace to either the old value or the provided baseNS value */
        vie.namespaces.base(baseNSBefore);
    }
};
VIE.prototype.Entity = function(attrs, opts) {

    var self = this;

    var mapAttributeNS = function (attr, ns) {
        var a = attr;
        if (ns.isUri (attr) || attr.indexOf('@') === 0) {
            //ignore
        } else if (ns.isCurie(attr)) {
            a = ns.uri(attr);
        } else if (!ns.isUri(attr)) {
            if (attr.indexOf(":") === -1) {
                a = '<' + ns.base() + attr + '>';
            } else {
                a = '<' + attr + '>';
            }
        }
        return a;
    };

    if (attrs['@type'] !== undefined) {
        attrs['@type'] = (_.isArray(attrs['@type']))? attrs['@type'] : [ attrs['@type'] ];
        attrs['@type'] = _.map(attrs['@type'], function(val){
            if (!self.vie.types.get(val)) {
                //if there is no such type -> add it and let it inherit from "owl:Thing"
                self.vie.types.add(val).inherit("owl:Thing");
            }
            return self.vie.types.get(val).id;
        });
        attrs['@type'] = (attrs['@type'].length === 1)? attrs['@type'][0] : attrs['@type'];
    } else {
        // provide "owl:Thing" as the default type if none was given
        attrs['@type'] = self.vie.types.get("owl:Thing").id;
    }

    //the following provides full seamless namespace support
    //for attributes. It should not matter, if you
    //query for `model.get('name')` or `model.get('foaf:name')`
    //or even `model.get('http://xmlns.com/foaf/0.1/name');`
    //However, if we just overwrite `set()` and `get()`, this
    //raises a lot of side effects, so we need to expand
    //the attributes before we create the model.
    attrs = (attrs) ? attrs : {};
    _.each (attrs, function (value, key) {
        var newKey = mapAttributeNS(key, this.namespaces);
        if (key !== newKey) {
            delete attrs[key];
            attrs[newKey] = value;
        }
    }, self.vie);

    var Model = Backbone.Model.extend({
        idAttribute: '@subject',

        initialize: function(attributes, options) {
            if (attributes['@subject']) {
                this.id = this['@subject'] = this.toReference(attributes['@subject']);
            }
            return this;
        },

        get: function (attr) {
            attr = mapAttributeNS(attr, self.vie.namespaces);
            var value = Backbone.Model.prototype.get.call(this, attr);
            value = (_.isArray(value))? value : [ value ];

            value = _.map(value, function(v) {
                if (v !== undefined && attr === '@type' && self.vie.types.get(v)) {
                    return self.vie.types.get(v);
                } else if (v !== undefined && self.vie.entities.get(v)) {
                    return self.vie.entities.get(v);
                } else {
                    return v;
                }
            }, this);
            if(value.length === 0) {
                return undefined;
            }
            // if there is only one element, just return that one
            value = (value.length === 1)? value[0] : value;
            return value;
        },

        has: function(attr) {
            attr = mapAttributeNS(attr, self.vie.namespaces);
            return Backbone.Model.prototype.has.call(this, attr);
        },

        set : function(attrs, options) {
            if (!attrs) {
                return this;
            }
            if (attrs.attributes) {
                attrs = attrs.attributes;
            }
            _.each (attrs, function (value, key) {
                var newKey = mapAttributeNS(key, self.vie.namespaces);
                if (key !== newKey) {
                    delete attrs[key];
                    attrs[newKey] = value;
                }
            }, this);
            _.each (attrs, function (value, key) {
               if (key.indexOf('@') === -1) {
                   if (typeof value === "object" &&
                       !jQuery.isArray(value) &&
                       !value.isCollection) {
                       var child = new self.vie.Entity(value, options);
                       self.vie.entities.addOrUpdate(child);
                       attrs[key] = child.getSubject();
                   } else if (value.isCollection) {
                       //attrs[key] = [];
                       value.each(function (child) {
                           self.vie.entities.addOrUpdate(child);
                           //attrs[key].push(child.getSubject());
                       });
                   }
               }
            }, this);
            return Backbone.Model.prototype.set.call(this, attrs, options);
        },

        unset: function (attr, opts) {
            attr = mapAttributeNS(attr, self.vie.namespaces);
            return Backbone.Model.prototype.unset.call(this, attr, opts);
        },

        getSubject: function(){
            if (typeof this.id === "undefined") {
                this.id = this.attributes[this.idAttribute];
            }
            if (typeof this.id === 'string') {
                if (this.id.substr(0, 7) === 'http://' || this.id.substr(0, 4) === 'urn:') {
                    return this.toReference(this.id);
                }
                return this.id;
            }
            return this.cid.replace('c', '_:bnode');
        },

        getSubjectUri: function(){
            return this.fromReference(this.getSubject());
        },

        isReference: function(uri){
            var matcher = new RegExp("^\\<([^\\>]*)\\>$");
            if (matcher.exec(uri)) {
                return true;
            }
            return false;
        },

        toReference: function(uri){
            if (typeof uri !== "string") {
                return uri;
            }
            if (this.isReference(uri)) {
                return uri;
            }
            return '<' + uri + '>';
        },

        fromReference: function(uri){
            if (typeof uri !== "string") {
                return uri;
            }
            if (!this.isReference(uri)) {
                return uri;
            }
            return uri.substring(1, uri.length - 1);
        },

        as: function(encoding){
            if (encoding === "JSON") {
                return this.toJSON();
            }
            if (encoding === "JSONLD") {
                return this.toJSONLD();
            }
            throw new Error("Unknown encoding " + encoding);
        },

        toJSONLD: function(){
            var instanceLD = {};
            var instance = this;
            _.each(instance.attributes, function(value, name){
                var entityValue = value; //instance.get(name);

                if (value instanceof instance.vie.Collection) {
                    entityValue = value.map(function(instance) {
                        return instance.getSubject();
                    });
                }

                // TODO: Handle collections separately
                instanceLD[name] = entityValue;
            });

            instanceLD['@subject'] = instance.getSubject();

            return instanceLD;
        },

        setOrAdd: function (arg1, arg2) {
            var entity = this;
            if (typeof arg1 === "string" && arg2) {
                // calling entity.setOrAdd("rdfs:type", "example:Musician")
                entity._setOrAddOne(arg1, arg2);
            }
            else
                if (typeof arg1 === "object") {
                    // calling entity.setOrAdd({"rdfs:type": "example:Musician", ...})
                    _(arg1).each(function(val, key){
                        entity._setOrAddOne(key, val);
                    });
                }
            return this;
        },

        _setOrAddOne: function (attr, value) {
            var obj;
            attr = mapAttributeNS(attr, self.vie.namespaces);
            var val = Backbone.Model.prototype.get.call(this, attr);

            // No value yet, use the set method
            if (!val) {
                obj = {};
                obj[attr] = value;
                this.set(obj);
            }
            else {
                if (!(val instanceof Array)) {
                    val = [val];
                }
                // Make sure not to set the same value twice
                var contains = false;
                for (var v = 0; v < val.length; v++) {
                    if (typeof val[v] === "string") {
                        contains |= val[v] == value;
                    } else {
                        contains |= val[v].id == value;
                    }
                }
                if (!contains) {
                    val.push(value);
                    obj = {};
                    obj[attr] = val;
                    this.set(obj);
                }
            }
        },

        hasType: function(type){
            type = self.vie.types.get(type);
            return this.hasPropertyValue("@type", type);
        },

        hasPropertyValue: function(property, value) {
            var t = this.get(property);
            if (!(value instanceof Object)) {
                value = self.vie.entities.get(value);
            }
            if (t instanceof Array) {
                return t.indexOf(value) !== -1;
            }
            else {
                return t === value;
            }
        },

        isof: function (type) {
            var types = this.get('@type');
            
            if (types === undefined) {
                return false;
            }
            types = (_.isArray(types))? types : [ types ];
            
            type = (self.vie.types.get(type))? self.vie.types.get(type) : new self.vie.Type(type);
            for (var t = 0; t < types.length; t++) {
                if (self.vie.types.get(types[t])) {
                    if (self.vie.types.get(types[t]).isof(type)) {
                        return true;
                    }
                } else {
                    var typeTmp = new self.vie.Type(types[t]);
                    if (typeTmp.id === type.id) {
                        return true;
                    }
                }
            }
            return false;
        },
        
        addTo : function (collection, update) {
            var self = this;
            if (collection instanceof self.vie.Collection) {
                if (update) {
                    collection.addOrUpdate(self);
                } else {
                    collection.add(self);
                }
                return this;
            }
            throw new Error("Please provide a proper collection of type VIE.Collection as argument!");
        },

        isEntity: true,

        vie: self.vie
    });

    return new Model(attrs, opts);
};
VIE.prototype.Collection = Backbone.Collection.extend({
    model: VIE.prototype.Entity,
    
    get: function(id) {
        if (id === null) {
            return null;
        }
        
        id = (id.getSubject)? id.getSubject() : id;        
        if (typeof id === "string" && id.indexOf("_:") === 0) {
            if (id.indexOf("bnode") === 2) {
                //bnode!
                id = id.replace("_:bnode", 'c');
                return this._byCid[id];
            } else {
                return this._byId["<" + id + ">"];
            }
        } else {
            id = this.toReference(id);
            return this._byId[id];
        }
    },

    addOrUpdate: function(model) {
        var collection = this;
        var existing;
        if (_.isArray(model)) {
            var entities = [];
            _.each(model, function(item) {
                entities.push(collection.addOrUpdate(item));
            });
            return entities;
        }

        if (!model.isEntity) {
            model = new this.model(model);
        }

        if (model.id && this.get(model.id)) {
            existing = this.get(model.id);
        }
        if (this.getByCid(model.cid)) {
            var existing = this.getByCid(model.cid);
        }
        if (existing) {
            var newAttribs = {};
            _.each(model.attributes, function(value, attribute) {
                if (!existing.has(attribute)) {
                    newAttribs[attribute] = value;
                    return true;
                }
                else if (existing.get(attribute) === value) {
                    return true;
                } else {
                    //merge existing attribute values with new ones!
                    //not just overwrite 'em!!
                    var oldVals = existing.attributes[attribute];
                    var newVals = value;
                    if (oldVals instanceof collection.vie.Collection) {
                        // TODO: Merge collections
                        return true;
                    }
                    
                    if (attribute === '@context') {
                        newAttribs[attribute] = jQuery.extend(true, {}, oldVals, newVals);
                    } else {
                        oldVals = (jQuery.isArray(oldVals))? oldVals : [ oldVals ];
                        newVals = (jQuery.isArray(newVals))? newVals : [ newVals ];
                        newAttribs[attribute] = VIE.Util.unduplicate(oldVals.concat(newVals));
                        newAttribs[attribute] = (newAttribs[attribute].length === 1)? newAttribs[attribute][0] : newAttribs[attribute];
                    }
                }
            });

            if (!_.isEmpty(newAttribs)) {
                existing.set(newAttribs);
            }
            return existing;
        }

        this.add(model);
        return model;
    },

    isReference: function(uri){
        var matcher = new RegExp("^\\<([^\\>]*)\\>$");
        if (matcher.exec(uri)) {
            return true;
        }
        return false;
    },
        
    toReference: function(uri){
        if (this.isReference(uri)) {
            return uri;
        }
        return '<' + uri + '>';
    },
        
    fromReference: function(uri){
        if (!this.isReference(uri)) {
            return uri;
        }
        return uri.substring(1, uri.length - 1);
    },
    
    isCollection: true
});
//     VIE - Vienna IKS Editables
//     (c) 2011 Henri Bergius, IKS Consortium
//     (c) 2011 Sebastian Germesin, IKS Consortium
//     (c) 2011 Szaby Grünwald, IKS Consortium
//     VIE may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://viejs.org/

if (VIE.prototype.Type) {
	throw new Error("ERROR: VIE.Type is already defined. Please check your installation!");
}
if (VIE.prototype.Types) {
	throw new Error("ERROR: VIE.Types is already defined. Please check your installation!");
}

// The constructor of a VIE.Type. 
//Usage: ``var personType = new vie.Type("Person", []).inherit("Thing");``
// This creates a type person in the base namespace that has no attributes
// but inherits from the type "Thing". 
VIE.prototype.Type = function (id, attrs) {
    if (id === undefined || typeof id !== 'string') {
        throw "The type constructor needs an 'id' of type string! E.g., 'Person'";
    }

    this.id = this.vie.namespaces.isUri(id) ? id : this.vie.namespaces.uri(id);

    // checks whether such a type is already defined. 
    if (this.vie.types.get(this.id)) {
        throw new Error("The type " + this.id + " is already defined!");
    }    
    
    // the supertypes (parentclasses) of the current type.
    this.supertypes = new this.vie.Types();
    // the subtypes (childclasses) of the current type.
    this.subtypes = new this.vie.Types();
    
    // the given attributes as a `vie.Attributes` element.
    this.attributes = new this.vie.Attributes(this, (attrs)? attrs : []);
    
    // checks whether the current type inherits of the
    // given type, e.g.,: ``personType.isof("Thing");``
    // would evaluate to `true`.
    // We can either pass a type object or a string that
    // represents the id of the type.
    this.isof = function (type) {
        type = this.vie.types.get(type);
        if (type) {
            return type.subsumes(this.id);
        } else {
            throw new Error("No valid type given");
        }
    };
    
    // checks whether the current type subsumes the
    // given type, e.g.,: ``thingType.subsumes("Person");``
    // would evaluate to `true`.
    // We can either pass a type object or a string that
    // represents the id of the type.
    this.subsumes = function (type) {
        type = this.vie.types.get(type);
        if (type) {
            if (this.id === type.id) {
                return true;
            }
            var subtypes = this.subtypes.list();
            for (var c = 0; c < subtypes.length; c++) {
                var childObj = subtypes[c];
                if (childObj) {
                     if (childObj.id === type.id || childObj.subsumes(type)) {
                         return true;
                     }
                }
            }
            return false;
        } else {
            throw new Error("No valid type given");
        }
    };
    
    //inherit all attributes from the supertype (recursively).
    //we can either pass a string (id) of the supertype, the
    //supertype itself or an array of both.
    this.inherit = function (supertype) {
        if (typeof supertype === "string") {
            this.inherit(this.vie.types.get(supertype));
        }
        else if (supertype instanceof this.vie.Type) {
            supertype.subtypes.addOrOverwrite(this);
            this.supertypes.addOrOverwrite(supertype);
            try {
                // only for validation of attribute-inheritance!
                // if this throws an error (inheriting two attributes
                // that cannot be combined) we reverse all changes. 
                this.attributes.list();
            } catch (e) {
                supertype.subtypes.remove(this);
                this.supertypes.remove(supertype);
                throw e;
            }
        } else if (jQuery.isArray(supertype)) {
            for (var i = 0; i < supertype.length; i++) {
                this.inherit(supertype[i]);
            }
        } else {
            throw new Error("Wrong argument in VIE.Type.inherit()");
        }
        return this;
    };
        
    // serializes the hierarchy of child types into an
    // object.
    this.hierarchy = function () {
        var obj = {id : this.id, subtypes: []};
        var list = this.subtypes.list();
        for (var c = 0; c < list.length; c++) {
            var childObj = this.vie.types.get(list[c]);
            obj.subtypes.push(childObj.hierarchy());
        }
        return obj;
    };
    
    // creates an Entity instance from this type.
    this.instance = function (attrs, opts) {
        attrs = (attrs)? attrs : {};
        opts = (opts)? opts : {};
        
        // turn type/attribute checking on by default!
        if (opts.typeChecking !== false) {
            for (var a in attrs) {
                if (a.indexOf('@') !== 0 && !this.attributes.get(a)) {
                    throw new Error("Cannot create an instance of " + this.id + " as the type does not allow an attribute '" + a + "'!");
                }
            }
        }
        
        if (attrs['@type']) {
            attrs['@type'].push(this.id);
        } else {
            attrs['@type'] = this.id;
        }
        
        return new this.vie.Entity(attrs, opts);
    };
        
    // returns the id of the type.
    this.toString = function () {
        return this.id;
    };
    
    
    
};

//basically a convenience class that represents a list of `VIE.Type`s.
//var types = new vie.Types();
VIE.prototype.Types = function () {
        
    this._types = {};
    
    //Adds a `VIE.Type` to the types.
    //This throws an exception if a type with the given id
    //already exists.
    this.add = function (id, attrs) {
        if (this.get(id)) {
            throw "Type '" + id + "' already registered.";
        } 
        else {
            if (typeof id === "string") {
                var t = new this.vie.Type(id, attrs);
                this._types[t.id] = t;
                return t;
            } else if (id instanceof this.vie.Type) {
            	this._types[id.id] = id;
                return id;
            } else {
                throw new Error("Wrong argument to VIE.Types.add()!");
            }
        }
        return this;
    };
    
    //This is the same as ``this.remove(id); this.add(id, attrs);``
    this.addOrOverwrite = function(id, attrs){
        if (this.get(id)) {
            this.remove(id);
        }
        return this.add(id, attrs);
    };
    
    //Retrieve a type by either it's id or by the type itself
    //(for convenience issues).
    //Returnes **undefined** if no type has been found.
    this.get = function (id) {
        if (!id) {
            return undefined;
        }
        if (typeof id === 'string') {
            var lid = this.vie.namespaces.isUri(id) ? id : this.vie.namespaces.uri(id);
            return this._types[lid];
        } else if (id instanceof this.vie.Type) {
            return this.get(id.id);
        }
        return undefined;
    };
    
    //Removes a type of given id from the type. This also
    // removes all children if their only parent were this
    //type. Furthermore, this removes the link from the
    //super- and subtypes.
    this.remove = function (id) {
        var t = this.get(id);
        /* test whether the type actually exists in VIE
         * and prevents removing *owl:Thing*.
         */
        if (!t || t.subsumes("owl:Thing")) {
            return this;
        }
        delete this._types[t.id];
        
        var subtypes = t.subtypes.list();
        for (var c = 0; c < subtypes.length; c++) {
            var childObj = subtypes[c];
            if (childObj.supertypes.list().length === 1) {
                //recursively remove all children 
                //that inherit only from this type
                this.remove(childObj);
            } else {
                childObj.supertypes.remove(t.id);
            }
        }
        return t;
    };
    
    //returns an array of all types.
    this.toArray = this.list = function () {
        var ret = [];
        for (var i in this._types) {
            ret.push(this._types[i]);
        }
        return ret;
    };
    
    //Sorts an array of types in their order, given by the
    //inheritance. If 'desc' is given and 'true', the sorted
    //array will be in descendant order.
    this.sort = function (types, desc) {
        var self = this;
        var copy = $.merge([], ($.isArray(types))? types : [ types ]);
        desc = (desc)? true : false;
        
        for (var x = 0; x < copy.length; x++) {
            var a = copy.shift();
            var idx = 0;
            for (var y = 0; y < copy.length; y++) {
                var b = self.vie.types.get(copy[y]);                
                if (b.subsumes(a)) {
                    idx = y;
                }
            }
            copy.splice(idx+1,0,a);
        }
        
        if (!desc) {
            copy.reverse();
        }
        return copy;
    };
};
//     VIE - Vienna IKS Editables
//     (c) 2011 Henri Bergius, IKS Consortium
//     (c) 2011 Sebastian Germesin, IKS Consortium
//     (c) 2011 Szaby Grünwald, IKS Consortium
//     VIE may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://viejs.org/
//

// ## VIE.Attributes
// Within VIE, we provide special capabilities of handling attributes of types of entites. This
// helps first of all to list all attributes of an entity type, but furthermore fully supports
// inheritance of attributes from the type-class to inherit from.
if (VIE.prototype.Attribute) {
	throw new Error("ERROR: VIE.Attribute is already defined. Please check your VIE installation!");
}
if (VIE.prototype.Attributes) {
	throw new Error("ERROR: VIE.Attributes is already defined. Please check your VIE installation!");
}

// ### VIE.Attribute(id, range, domain);
// This is the constructor of a VIE.Attribute.  
// **Parameters**:  
// *{string}* **id** The id of the attribute.  
// *{string|array}* **range** A string or an array of strings of the target range of 
// the attribute.  
// *{string}* **domain** The domain of the attribute.  
// **Throws**:  
// *{Error}* if one of the given paramenters is missing.  
// **Returns**:  
// *{VIE.Attribute}* : A **new** VIE.Attribute object.  
// **Example usage**:  
//
//     var knowsAttr = new vie.Attribute("knows", ["Person"], "Person");
//      // Creates an attribute to describe a *knows*-relationship
//      // between persons.
VIE.prototype.Attribute = function (id, range, domain) {
    if (id === undefined || typeof id !== 'string') {
        throw new Error("The attribute constructor needs an 'id' of type string! E.g., 'Person'");
    }
    if (range === undefined) {
        throw new Error("The attribute constructor needs 'range'.");
    }
    if (domain === undefined) {
        throw new Error("The attribute constructor needs a 'domain'.");
    }
    
    this._domain = domain;
    
// ### range;
// This field stores the ranges of the attribute's instance.  
// **Parameters**:  
// nothing
// **Throws**:  
// nothing  
// **Returns**:  
// *{array}* : An array of strings which represent the types.  
// **Example usage**:  
//
//     var knowsAttr = new vie.Attribute("knows", ["Person"], "Person");
//     console.log(knowsAttr.range);
//      // --> ["Person"]
    this.range = (_.isArray(range))? range : [ range ];
     
// ### id;
// This field stores the id of the attribute's instance.  
// **Parameters**:  
// nothing
// **Throws**:  
// nothing  
// **Returns**:  
// *{string}* : A URI, representing the id of the attribute.  
// **Example usage**:  
//
//     var knowsAttr = new vie.Attribute("knows", ["Person"], "Person");
//     console.log(knowsAttr.id);
//     // --> <http://viejs.org/ns/knows>
    this.id = this.vie.namespaces.isUri(id) ? id : this.vie.namespaces.uri(id);

// ### applies(range);
// This method checks, whether the current attribute applies in the given range.
// If ```range``` is a string and cannot be transformed into a ```VIE.Type```, 
// this performs only string comparison, if it is a VIE.Type 
// or an ID of a VIE.Type, then inheritance is checked as well.
// **Parameters**:  
// *{string|VIE.Type}* **range** The ```VIE.Type``` (or it's string representation) to be checked. 
// **Throws**:  
// nothing  
// **Returns**:  
// *{boolean}* : ```true``` if the given type applies to this attribute and ```false``` otherwise.  
// **Example usage**:  
//
//     var knowsAttr = new vie.Attribute("knows", ["Person"], "Person");
//     console.log(knowsAttr.applies("Person")); // --> true
//     console.log(knowsAttr.applies("Place")); // --> false
    this.applies = function (range) {
        if (this.vie.types.get(range)) {
            range = this.vie.types.get(range);
        }
        for (var r = 0, len = this.range.length; r < len; r++) {
            var x = this.vie.types.get(this.range[r]);
            if (x === undefined && typeof range === "string") {
                if (range === this.range[r]) {
                    return true;
                }
            }
            else {
                if (range.isof(this.range[r])) {
                    return true;
                }
            }
        }
        return false;
    };
            
};


// ## VIE.Attributes(domain, attrs);
// This is the constructor of a VIE.Attributes. Basically a convenience class
// that represents a list of ```VIE.Attribute```. As attributes are part of a 
// certain ```VIE.Type```, it needs to be passed for inheritance checks.  
// **Parameters**:  
// *{string}* **domain** The domain of the attributes (the type they will be part of).  
// *{string|VIE.Attribute|array}* **attrs** Either a string representation of an attribute,
// a proper instance of ```VIE.Attribute``` or an array of both.  
// *{string}* **domain** The domain of the attribute.  
// **Throws**:  
// *{Error}* if one of the given paramenters is missing.  
// **Returns**:  
// *{VIE.Attribute}* : A **new** VIE.Attribute object.  
// **Example usage**:  
//
//     var knowsAttr = new vie.Attribute("knows", ["Person"], "Person");
//     var personAttrs = new vie.Attributes("Person", knowsAttr);
VIE.prototype.Attributes = function (domain, attrs) {
    
    this._local = {};
    this._attributes = {};
    
// ### domain;
// This field stores the domain of the attributes' instance.  
// **Parameters**:  
// nothing
// **Throws**:  
// nothing  
// **Returns**:  
// *{string}* : The string representation of the domain.  
// **Example usage**:  
//
//     console.log(personAttrs.domain);
//     // --> ["Person"]
    this.domain = domain;
    
// ### add(id, range);
// This method adds a ```VIE.Attribute``` to the attributes instance.
// **Parameters**:  
// *{string|VIE.Attribute}* **id** The string representation of an attribute, or a proper
// instance of a ```VIE.Attribute```.  
// **Throws**:  
// *{Error}* If an atribute with the given id is already registered.  
// *{Error}* If the ```id``` parameter is not a string, nor a ```VIE.Type``` instance.  
// **Returns**:  
// *{VIE.Attribute}* : The generated or passed attribute.  
// **Example usage**:  
//
//     personAttrs.add("name", "Text");
    this.add = function (id, range) {
        if (this.get(id)) {
            throw new Error("Attribute '" + id + "' already registered for domain " + this.domain.id + "!");
        } 
        else {
            if (typeof id === "string") {
                var a = new this.vie.Attribute(id, range, this.domain);
                this._local[a.id] = a;
                return a;
            } else if (id instanceof this.vie.Type) {
                id.domain = this.domain;
                id.vie = this.vie;
                this._local[id.id] = id;
                return id;
            } else {
                throw new Error("Wrong argument to VIE.Types.add()!");
            }
        }
    };
    
// ### remove(id);
// This method removes a ```VIE.Attribute``` from the attributes instance.
// **Parameters**:  
// *{string|VIE.Attribute}* **id** The string representation of an attribute, or a proper
// instance of a ```VIE.Attribute```.  
// **Throws**:  
// *{Error}* When the attribute is inherited from a parent ```VIE.Type``` and thus cannot be removed.
// **Returns**:  
// *{VIE.Attribute}* : The removed attribute.  
// **Example usage**:  
//
//     personAttrs.remove("knows");
    //removes a `VIE.Attribute` from the attributes.
    this.remove = function (id) {
        var a = this.get(id);
        if (a.id in this._local) {
            delete this._local[a.id];
            return a;
        }
        throw new Error("The attribute " + id + " is inherited and cannot be removed from the domain " + this.domain.id + "!");
    };
    
    //retrieve a `VIE.Attribute` from the attributes by it's id.
    this.get = function (id) {
        if (typeof id === 'string') {
            var lid = this.vie.namespaces.isUri(id) ? id : this.vie.namespaces.uri(id);
            return this._inherit()._attributes[lid];
        } else if (id instanceof this.vie.Attribute) {
            return this.get(id.id);
        } else {
            throw new Error("Wrong argument in VIE.Attributes.get()");
        }
    };
    
    // creates a full list of all attributes (local and inherited).
    // the ranges of inherited attributes with the same id will be merged. 
    this._inherit = function () {
        var attributes = jQuery.extend(true, {}, this._local);
        
        var inherited = _.map(this.domain.supertypes.list(),
            function (x) {
               return x.attributes; 
            }
        );

        var add = {};
        var merge = {};
        
        for (var a = 0; a < inherited.length; a++) {
            var attrs = inherited[a].list();
            for (var x = 0; x < attrs.length; x++) {
                var id = attrs[x].id;
                if (!(id in attributes)) {
                    if (!(id in add) && !(id in merge)) {
                        add[id] = attrs[x];
                    }
                    else {
                        if (!merge[id]) {
                            merge[id] = [];
                        }
                        if (id in add) {
                            merge[id] = jQuery.merge(merge[id], add[id].range);
                            delete add[id];
                        }
                        merge[id] = jQuery.merge(merge[id], attrs[x].range);
                        merge[id] = VIE.Util.unduplicate(merge[id]);
                    }
                }
            }
        }
        
        //add
        jQuery.extend(attributes, add);
        
        // merge
        for (var id in merge) {
            var merged = merge[id];
            var ranges = [];
            for (var r = 0; r < merged.length; r++) {
                var p = this.vie.types.get(merged[r]);
                var isAncestorOf = false;
                if (p) {
                    for (var x = 0; x < merged.length; x++) {
                        if (x === r) {
                            continue;
                        }
                        var c = this.vie.types.get(merged[x]);
                        if (c && c.isof(p)) {
                            isAncestorOf = true;
                            break;
                        }
                    }
                }
                if (!isAncestorOf) {
                    ranges.push(merged[r]);
                }
            }
            attributes[id] = new this.vie.Attribute(id, ranges, this);
        }

        this._attributes = attributes;
        return this;
    };

    // returns an Array of all attributes, combined
    // with the inherited ones.
    this.toArray = this.list = function (range) {
        var ret = [];
        var attributes = this._inherit()._attributes;
        for (var a in attributes) {
            if (!range || attributes[a].applies(range)) {
                ret.push(attributes[a]);
            }
        }
        return ret;
    };
        
    attrs = _.isArray(attrs) ? attrs : [ attrs ];
    
    for (var a = 0, len = attrs.length; a < len; a++) {
        this.add(attrs[a].id, attrs[a].range);
    }
};
//     VIE - Vienna IKS Editables
//     (c) 2011 Henri Bergius, IKS Consortium
//     (c) 2011 Sebastian Germesin, IKS Consortium
//     (c) 2011 Szaby Grünwald, IKS Consortium
//     VIE may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://viejs.org/
if (VIE.prototype.Namespaces) {
    throw new Error("ERROR: VIE.Namespaces is already defined. " + 
        "Please check your VIE installation!");
}

// ## VIE Namespaces constructor
//
// In general, a namespace is a container that provides context for the identifiers.
// Within VIE, namespaces are used to distinguish different ontolgies or vocabularies
// of identifiers, types and attributes. However, because of their verbosity, namespaces
// tend to make their usage pretty circuitous. The ``VIE.Namespaces(...)`` class provides VIE
// with methods to maintain abbreviations (akak **prefixes**) for namespaces in order to
// alleviate their usage. By default, every VIE instance is equipped with a main instance
// of the namespaces in ``myVIE.namespaces``. Furthermore, VIE uses a **base namespace**, 
// which is used if no prefix is given (has an empty prefix).
// In the upcoming sections, we will explain the
// methods to add, access and remove prefixes.
//
// The constructor: The constructor initially needs a *base namespace* and can optionally be initialised
// with an associative array of prefixes and namespaces.
//
//     var namespaces = new myVIE.Namespaces("http://viejs.org/ns/");
//
// The above code initialises the namespaces with a base namespace ``http://viejs.org/ns/``. Which means
// that every non-prefixed, non-expanded attribute or type is assumed to be of that namespace. This helps, e.g.,
// in an environment where only one namespace is given.
//
// We can also bootstrap namespaces within the constructor:
//
//     var ns = new myVIE.Namespaces("http://viejs.org/ns/", 
//           {
//            "foaf": "http://xmlns.com/foaf/0.1/"
//           });
VIE.prototype.Namespaces = function (base, namespaces) {
    
    if (!base) {
        throw new Error("Please provide a base namespace!");
    }
    this._base = base;
    
    this._namespaces = (namespaces)? namespaces : {};
    if (typeof this._namespaces !== "object" || _.isArray(this._namespaces)) {
        throw new Error("If you want to initialise VIE namespace prefixes, " + 
            "please provide a proper object!");
    }
};

// This is a **getter** and **setter** for the base
// namespace. If called like ``myVIE.namespaces.base();`` it
// returns the actual base namespace as a string. If provided
// with a string, e.g., ``myVIE.namespaces.base("http://viejs.org/ns/");``
// it sets the current base namespace and retuns the namespace object
// for the purpose of chaining. If provided with anything except a string,
// it throws an Error. 
VIE.prototype.Namespaces.prototype.base = function (ns) {
    if (!ns) { 
        return this._base;
    }
    else if (typeof ns === "string") {
        this._base = ns;
        return this;
    } else {
        throw new Error("Please provide a valid namespace!");
    }
};
    
// This method (``add()``) adds new prefix mappings to the
// current instance. If a prefix or a namespace is already
// present (in order to avoid ambiguities), an Error is thrown. 
// ``prefix`` can also be an object in which case, the method 
// is called sequentially on all elements.
// It returns the current instance for the sake of chaining.
//
//     calling: 
//     myVIE.namespaces.add("", "http://...");
//     // is always equal to
//     myVIE.namespaces.base("http://..."); // <-- setter of base namespace
VIE.prototype.Namespaces.prototype.add = function (prefix, namespace) {
    if (typeof prefix === "object") {
        for (var k1 in prefix) {
            this.add(k1, prefix[k1]);
        }
        return this;
    }
    if (prefix === "") {
        this.base(namespace);
        return this;
    }
    /* checking if we overwrite existing mappings */
    else if (this.contains(prefix) && namespace !== this._namespaces[prefix]) {
        throw new Error("ERROR: Trying to register namespace prefix mapping (" + prefix + "," + namespace + ")!" +
              "There is already a mapping existing: '(" + prefix + "," + this.get(prefix) + ")'!");
    } else {
        jQuery.each(this._namespaces, function (k1,v1) {
            if (v1 === namespace && k1 !== prefix) {
                throw new Error("ERROR: Trying to register namespace prefix mapping (" + prefix + "," + namespace + ")!" +
                      "There is already a mapping existing: '(" + k1 + "," + namespace + ")'!");
            }
        });
    }
    /* if not, just add them */
    this._namespaces[prefix] = namespace;
    return this;
};
    
// This method (``addOrReplace()``) overwrites existing mappings or adds them.
// It returns the current instance for the sake of chaining. ``prefix`` can also
// be an object in which case, the method is called sequentially on all elements.
VIE.prototype.Namespaces.prototype.addOrReplace = function (prefix, namespace) {
    if (typeof prefix === "object") {
        for (var k1 in prefix) {
            this.addOrReplace(k1, prefix[k1]);
        }
        return this;
    }
    this.remove(prefix);
    this.removeNamespace(namespace);
    return this.add(prefix, namespace);
};
    
// This method (``get()``) returns the namespace for the given prefix ``prefix`` or
// ``undefined`` if no such prefix could be found.
//
//     calling: 
//     myVIE.namespaces.get(""); // <-- empty string
//     // is always equal to
//     myVIE.namespaces.base(); // <-- getter of base namespace
VIE.prototype.Namespaces.prototype.get = function (prefix) {
    if (prefix === "") {
        return this.base();
    }
    return this._namespaces[prefix];
};

// This method (``getPrefix()``) returns a prefix for the given ``namespace`` or
// ``undefined`` if the namespace could not be found in the current instance.
VIE.prototype.Namespaces.prototype.getPrefix = function (namespace) {
    var prefix = undefined;
    jQuery.each(this._namespaces, function (k1,v1) {
        if (v1 === namespace) {
            prefix = k1;
        }
    });
    return prefix;
};

// This method (``contains()``) checks, whether a prefix is stored in the instance and
// returns ``true`` if so and ``false`` otherwise. 
VIE.prototype.Namespaces.prototype.contains = function (prefix) {
    return (prefix in this._namespaces);
};
    
// This method (``containsNamespace()``) checks, whether a namespace is stored in the instance and
// returns ``true`` if so and ``false`` otherwise. 
VIE.prototype.Namespaces.prototype.containsNamespace = function (namespace) {
    return this.getPrefix(namespace) !== undefined;
};

// This method (``update()``) overwrites the namespace that is stored under the prefix ``prefix``
// with the new namespace ``namespace``. If a namespace is already bound to another prefix, an
// Error is thrown.
// The method returns the namespace instance for the purpose of chaining.
VIE.prototype.Namespaces.prototype.update = function (prefix, namespace) {
    this.remove(prefix);
    return this.add(prefix, namespace);
};

// This method (``updateNamespace()``) overwrites the prefix that is bound to the 
// namespace ``namespace`` with the new prefix ``prefix``. If another namespace is
// already registered with the given ``prefix``, an Error is thrown.
// The method returns the namespace instance for the purpose of chaining.
VIE.prototype.Namespaces.prototype.updateNamespace = function (prefix, namespace) {
    this.removeNamespace(prefix);
    return this.add(prefix, namespace);
};

// This method (``remove()``) removes the namespace that is stored under the prefix ``prefix``.
// The method returns the namespace instance for the purpose of chaining.
VIE.prototype.Namespaces.prototype.remove = function (prefix) {
    if (prefix) {
        delete this._namespaces[prefix];
    }
    return this;
};

// This method (``removeNamespace()``) removes the namespace ``namespace``
// from the instance.
// The method returns the namespace instance for the purpose of chaining.
VIE.prototype.Namespaces.prototype.removeNamespace = function (namespace) {
    var prefix = this.getPrefix(namespace);
    if (prefix) {
        delete this._namespaces[prefix];
    }
    return this;
};
    
// This serializes the namespace instance into an associative
// array representation. The base namespace is given an empty
// string as key.
VIE.prototype.Namespaces.prototype.toObj = function () {
    return jQuery.extend({'' : this._base}, this._namespaces);
};
    
// This method transforms a URI into a CURIE, based on the given
// namespace instance. If ``safe`` is set to ``true``, it will
// return a safe CURIE. If no prefix can be found, an Error is
// thrown.
//
//     calling: 
//     myVIE.namespaces.curie("...", true|false); 
//     // is always equal to
//     VIE.Util.toCurie("...", true|false, myVIE.namespaces);
VIE.prototype.Namespaces.prototype.curie = function(uri, safe){
    return VIE.Util.toCurie(uri, safe, this);
};
    
// This method checks, whether the passed string is a proper CURIE, 
// based on the prefixes in the current namespace instance and
// returns ``true`` if so and ``false`` otherwise.
//
//     calling: 
//     myVIE.namespaces.isCurie("..."); 
//     // is always equal to
//     VIE.Util.isCurie("...", myVIE.namespaces);
VIE.prototype.Namespaces.prototype.isCurie = function (something) {
    return VIE.Util.isCurie(something, this);
};
    
// This method transforms the passed ``curie`` into a URI, based
// on the current namespace instance. If no prefix could be found, 
// an Error is thrown. 
//
//     calling: 
//     myVIE.namespaces.uri("..."); 
//     // is always equal to
//     VIE.Util.toUri("...", myVIE.namespaces);
VIE.prototype.Namespaces.prototype.uri = function (curie) {
    return VIE.Util.toUri(curie, this);
};
    
// This method checks, whether the given string is a URI and
// returns ``true`` if so and ``false`` otherwise.
//
//     calling: 
//     myVIE.namespaces.isUri("..."); 
//     // is always equal to
//     VIE.Util.isUri("...");
VIE.prototype.Namespaces.prototype.isUri = VIE.Util.isUri;
// Classic VIE API bindings to new VIE
VIE.prototype.ClassicRDFa = function(vie) {
    this.vie = vie;
};

VIE.prototype.ClassicRDFa.prototype = {
    readEntities: function(selector) {
        var jsonEntities = [];
        var entities = this.vie.RDFaEntities.getInstances(selector);
        _.each(entities, function(entity) {
            jsonEntities.push(entity.toJSONLD());
        });
        return jsonEntities;
    },

    findPredicateElements: function(subject, element, allowNestedPredicates) {
        return this.vie.services.rdfa._findPredicateElements(subject, element, allowNestedPredicates);
    },

    getPredicate: function(element) {
        return this.vie.services.rdfa.getElementPredicate(element);
    },

    getSubject: function(element) {
        return this.vie.services.rdfa.getElementSubject(element);
    }
};

VIE.prototype.ClassicRDFaEntities = function(vie) {
    this.vie = vie;
};

VIE.prototype.ClassicRDFaEntities.prototype = {
    getInstances: function(selector) {
        if (!this.vie.services.rdfa) {
            this.vie.use(new this.vie.RdfaService());
        }
        var foundEntities = null;
        var loaded = false;
        this.vie.load({element: selector}).from('rdfa').execute().done(function(entities) {
            foundEntities = entities;
            loaded = true;
        });

        while (!loaded) {
        }

        return foundEntities;
    },

    getInstance: function(selector) {
        var instances = this.getInstances(selector);
        if (instances && instances.length) {
            return instances.pop();
        }
        return null;
    }
};

VIE.prototype.ClassicEntityManager = function(vie) {
    this.vie = vie;
    this.entities = this.vie.entities;
};

VIE.prototype.ClassicEntityManager.prototype = {
    getBySubject: function(subject) {
        return this.vie.entities.get(subject);
    },

    getByJSONLD: function(json) {
        if (typeof json === 'string') {
            try {
                json = jQuery.parseJSON(json);
            } catch (e) {
                return null;
            }
        }
        return this.vie.entities.addOrUpdate(json);
    },

    initializeCollection: function() {
        return;
    }
};
//     VIE - Vienna IKS Editables
//     (c) 2011 Henri Bergius, IKS Consortium
//     (c) 2011 Sebastian Germesin, IKS Consortium
//     (c) 2011 Szaby Grünwald, IKS Consortium
//     VIE may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://viejs.org/
(function(){

// ## VIE - DBPedia service
//
// TODO: fill with more documentation
VIE.prototype.DBPediaService = function(options) {
    var defaults = {
        name : 'dbpedia',
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
        }
    };
    this.options = jQuery.extend(true, defaults, options ? options : {});

    this.vie = null; /* will be set via VIE.use(); */
    this.name = this.options.name;
    this.connector = new DBPediaConnector(this.options);

    jQuery.ajaxSetup({
        converters: {"text application/rdf+json": function(s){return JSON.parse(s);}},
        timeout: 60000 /* 60 seconds timeout */
    });

};

VIE.prototype.DBPediaService.prototype = {
    init: function() {

       for (var key in this.options.namespaces) {
            var val = this.options.namespaces[key];
            this.vie.namespaces.add(key, val);
        }
        this.namespaces = this.vie.namespaces;

        this.rules = [
             //rule to transform a DBPedia person into a VIE person
             {
                 'left' : [
                        '?subject a dbpedia:Person'
                 ],
                 'right': function(ns){
                     return function(){
                         return [
                             jQuery.rdf.triple(this.subject.toString(),
                                 'a',
                                 '<' + ns.base() + 'Person>', {
                                     namespaces: ns.toObj()
                                 })
                             ];
                     };
                 }(this.namespaces)
             }
        ];
    },

    // VIE API load implementation
    load: function(loadable){
        var service = this;
        
        var correct = loadable instanceof this.vie.Loadable;
        if (!correct) {throw new Error("Invalid Loadable passed");}

        var entity = loadable.options.entity;
        if (!entity) {
            loadable.reject([]);
        }
        else {
            entity = (typeof entity === "string")? entity : entity.id;
            
            var success = function (results) {
                results = (typeof results === "string")? JSON.parse(results) : results;
                var entities = VIE.Util.rdf2Entities(service, results);
                loadable.resolve(entities);
            };
            var error = function (e) {
                loadable.reject(e);
            };
            this.connector.load(entity, success, error);
        }
    }
};
var DBPediaConnector = function(options){
    this.options = options;
};

DBPediaConnector.prototype = {

    load: function (uri, success, error, options) {
        if (!options) { options = {}; }
        
        uri = (/^<.+>$/.test(uri))? uri : '<' + uri + '>';
        
        var url = "http://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&timeout=0" + 
        "&format=" + encodeURIComponent("application/rdf+json") + 
        "&query=" +
        encodeURIComponent("CONSTRUCT { " + uri + " ?prop ?val } WHERE { " + uri + " ?prop ?val }");
        
        var format = options.format || "application/rdf+json";

        if (typeof exports !== "undefined" && typeof process !== "undefined") {
            // We're on Node.js, don't use jQuery.ajax
            return this.loadNode(url, success, error, options, format);
        }

        jQuery.ajax({
            success: function(response){
                success(response);
            },
            error: error,
            type: "GET",
            url: url,
            accepts: {"application/rdf+json": "application/rdf+json"}
        });
    },

    loadNode: function (uri, success, error, options, format) {
        var request = require('request');
        var r = request({
            method: "GET",
            uri: uri,
            headers: {
                Accept: format
            }
        }, function(error, response, body) {
            success(JSON.parse(body));
        });
        r.end();
    }
};
})();

VIE.prototype.RdfaRdfQueryService = function(options) {
    if (!options) {
        options = {};
    }
    this.vie = null; /* will be set via VIE.use(); */
    this.name = 'rdfardfquery';
};

VIE.prototype.RdfaRdfQueryService.prototype = {
    
    analyze: function(analyzable) {
        analyzable.reject("Not yet implemented");
    },
        
    load : function(loadable) {
        loadable.reject("Not yet implemented");
    },

    save : function(savable) {
        var correct = savable instanceof this.vie.Savable;
        if (!correct) {
            savable.reject("Invalid Savable passed");
        }
    
        if (!savable.options.element) {
            savable.reject("Unable to write entity to RDFa, no element given");
        }
    
        if (!savable.options.entity) {
            savable.reject("Unable to write to RDFa, no entity given");
        }
        
        if (!jQuery.rdf) {
            savable.reject("No rdfQuery found.");
        }
        
        var entity = savable.options.entity;
        
        var triples = [];
        triples.push(entity.getSubject() + " a " + entity.get('@type'));
        //TODO: add all attributes!
        jQuery(savable.options.element).rdfa(triples);
    
        savable.resolve();
    }
    
};
VIE.prototype.RdfaService = function(options) {
    if (!options) {
        options = {};
    }
    this.vie = null; /* will be set via VIE.use(); */
    this.name = 'rdfa';
    this.subjectSelector = options.subjectSelector ? options.subjectSelector : "[about],[typeof],[src],html";
    this.predicateSelector = options.predicateSelector ? options.predicateSelector : "[property],[rel]";

    this.attributeExistenceComparator = options.attributeExistenceComparator;
    this.views = [];
};

VIE.prototype.RdfaService.prototype = {
    
    analyze: function(analyzable) {
        // in a certain way, analyze is the same as load
        var service = this;

        var correct = analyzable instanceof this.vie.Analyzable;
        if (!correct) {throw "Invalid Analyzable passed";}

        return this.load(new this.vie.Loadable({element : analyzable.options.element}));
    },
        
    load : function(loadable) {
        var service = this;
        var correct = loadable instanceof this.vie.Loadable;
        if (!correct) {
            throw "Invalid Loadable passed";
        }

        var element;
        if (!loadable.options.element) {
            if (typeof document === 'undefined') { 
                return loadable.resolve([]);
            }
            element = jQuery(document);
        } else {
            element = loadable.options.element;
        }
    
        var ns = this.xmlns(element);
        for (var prefix in ns) {
            this.vie.namespaces.addOrReplace(prefix, ns[prefix]);
        }
        var entities = [];
        jQuery(this.subjectSelector, element).add(jQuery(element).filter(this.subjectSelector)).each(function() {
            var entity = service._readEntity(jQuery(this));
            if (entity) {
                entities.push(entity);
            }
        });
        loadable.resolve(entities);
    },

    save : function(savable) {
        var correct = savable instanceof this.vie.Savable;
        if (!correct) {
            throw "Invalid Savable passed";
        }
    
        if (!savable.options.element) {
            // FIXME: we could find element based on subject
            throw "Unable to write entity to RDFa, no element given";
        }
    
        if (!savable.options.entity) {
            throw "Unable to write to RDFa, no entity given";
        }
    
        this._writeEntity(savable.options.entity, savable.options.element);
        savable.resolve();
    },
    
    _readEntity : function(element) {
        var subject = this.getElementSubject(element);
        var type = this._getElementType(element);
        var predicate, value, valueCollection;
        var entity = this._readEntityPredicates(subject, element, false);
        //if (jQuery.isEmptyObject(entity)) {
        //    return null;
        //}
        var vie = this.vie;
        for (predicate in entity) {
            value = entity[predicate];
            if (!_.isArray(value)) {
                continue;
            }
            valueCollection = new this.vie.Collection();
            _.each(value, function(valueItem) {
                var linkedEntity = vie.entities.addOrUpdate({'@subject': valueItem});
                valueCollection.addOrUpdate(linkedEntity);
            });
            entity[predicate] = valueCollection;
        }
    
        entity['@subject'] = subject;
        if (type) {
            entity['@type'] = type;
        }
        var entityInstance = new this.vie.Entity(entity);
        entityInstance = this.vie.entities.addOrUpdate(entityInstance);
        this._registerEntityView(entityInstance, element);
        return entityInstance;
    },
    
    _writeEntity : function(entity, element) {
        var service = this;
        this._findPredicateElements(this.getElementSubject(element), element, true).each(function() {
            var predicateElement = jQuery(this);
            var predicate = service.getElementPredicate(predicateElement);
            if (!entity.has(predicate)) {
                return true;
            }
    
            var value = entity.get(predicate);
            if (value.isCollection) {
                // Handled by CollectionViews separately
                return true;
            }
            if (value === service.readElementValue(predicate, predicateElement)) {
                return true;
            }
            service.writeElementValue(predicate, predicateElement, value);
        });
        return true;
    },
    
    _getViewForElement : function(element, collectionView) {
        var viewInstance;
        jQuery.each(this.views, function() {
            if (this.el.get(0) === element.get(0)) {
                if (collectionView && !this.template) {
                    return true;
                }
                viewInstance = this;
                return false;
            }
        });
        return viewInstance;
    },
    
    _registerEntityView : function(entity, element) {
        if (!element.length) {
            return;
        }

        var service = this;
        var viewInstance = this._getViewForElement(element);
        if (viewInstance) {
            return viewInstance;
        }
    
        viewInstance = new this.vie.view.Entity({
            model: entity,
            el: element,
            tagName: element.get(0).nodeName,
            vie: this.vie,
            service: this.name
        });
        this.views.push(viewInstance);
    
        // Find collection elements and create collection views for them
        _.each(entity.attributes, function(value, predicate) {
            var attributeValue = entity.fromReference(entity.get(predicate));
            if (attributeValue instanceof service.vie.Collection) {
                jQuery.each(service.getElementByPredicate(predicate, element), function() {
                    service._registerCollectionView(attributeValue, jQuery(this), entity);
                });
            }
        });
        return viewInstance;
    },
    
    _registerCollectionView : function(collection, element, entity) {
        var viewInstance = this._getViewForElement(element, true);
        if (viewInstance) {
            return viewInstance;
        }
    
        var entityTemplate = element.children(':first-child');
    
        viewInstance = new this.vie.view.Collection({
            owner: entity,
            collection: collection,
            model: collection.model,
            el: element,
            template: entityTemplate,
            service: this,
            tagName: element.get(0).nodeName
        });
        this.views.push(viewInstance);
        return viewInstance;
    },
    
    _getElementType : function (element) {
        var type;
        if (jQuery(element).attr('typeof')) {
            type = jQuery(element).attr('typeof');
            if (type.indexOf("://") !== -1) {
                return "<" + type + ">";
            } else {
                return type;
            }
        }
        return null;
    },
    
    getElementSubject : function(element) {
        var service = this;
        
        if (typeof document !== 'undefined') {
            if (element === document) {
                return document.baseURI;
            }
        }
        var subject = undefined;
        jQuery(element).closest(this.subjectSelector).each(function() {


            if (jQuery(this).attr('about') !== service.attributeExistenceComparator) {
                subject = jQuery(this).attr('about');
                return true;
            }
            if (jQuery(this).attr('src') !== service.attributeExistenceComparator) {
                subject = jQuery(this).attr('src');
                return true;
            }
            if (jQuery(this).attr('typeof') !== service.attributeExistenceComparator) {
                subject = VIE.Util.blankNodeID();
                //subject = this;
                return true;
            }
            // We also handle baseURL outside browser context by manually
            // looking for the `<base>` element inside HTML head.
            if (jQuery(this).get(0).nodeName === 'HTML') {
                jQuery('base', this).each(function() {
                    subject = jQuery(this).attr('href');
                });
            }
        });
                
        if (!subject) {
            return undefined;
        }
                
        if (typeof subject === 'object') {
            return subject;
        }
    
        return (subject.indexOf("_:") === 0)? subject : "<" + subject + ">";
    },
    
    setElementSubject : function(subject, element) {
        if (jQuery(element).attr('src')) {
            return jQuery(element).attr('src', subject);
        }
        return jQuery(element).attr('about', subject);
    },
    
    getElementPredicate : function(element) {
        var predicate;
        predicate = element.attr('property');
        if (!predicate) {
            predicate = element.attr('rel');
        }
        return predicate;
    },
    
    getElementBySubject : function(subject, element) {
        var service = this;
        return jQuery(element).find(this.subjectSelector).add(jQuery(element).filter(this.subjectSelector)).filter(function() {
            if (service.getElementSubject(jQuery(this)) !== subject) {
                return false;
            }
     
            return true;
        });
    },
    
    getElementByPredicate : function(predicate, element) {
        var service = this;
        var subject = this.getElementSubject(element);
        return jQuery(element).find(this.predicateSelector).add(jQuery(element).filter(this.predicateSelector)).filter(function() {
            var foundPredicate = service.getElementPredicate(jQuery(this));
            if (service.vie.namespaces.curie(foundPredicate) !== service.vie.namespaces.curie(predicate)) {
                return false;
            }
    
            if (service.getElementSubject(jQuery(this)) !== subject) {
                return false;
            }
     
            return true;
        });
    },
    
    _readEntityPredicates : function(subject, element, emptyValues) {
        var service = this;
        var entityPredicates = {};
    
        this._findPredicateElements(subject, element, true).each(function() {
            var predicateElement = jQuery(this);
            var predicate = service.getElementPredicate(predicateElement);
            var value = service.readElementValue(predicate, predicateElement);
    
            if (value === null && !emptyValues) {
                return;
            }
   
            entityPredicates[predicate] = value;
        });
    
        if (jQuery(element).get(0).tagName !== 'HTML') {
            jQuery(element).parent('[rev]').each(function() {
                entityPredicates[jQuery(this).attr('rev')] = service.getElementSubject(this); 
            });
        }
    
        return entityPredicates;
    },
    
    _findPredicateElements : function(subject, element, allowNestedPredicates) {
        var service = this;
        return jQuery(element).find(this.predicateSelector).add(jQuery(element).filter(this.predicateSelector)).filter(function() {
            if (service.getElementSubject(this) !== subject) {
                return false;
            }
            if (!allowNestedPredicates) {
                if (!jQuery(this).parents('[property]').length) {
                    return true;
                }
                return false;
            }
    
            return true;
        });
    },
    
    readElementValue : function(predicate, element) {
        // The `content` attribute can be used for providing machine-readable
        // values for elements where the HTML presentation differs from the
        // actual value.
        var content = element.attr('content');
        if (content) {
            return content;
        }
                
        // The `resource` attribute can be used to link a predicate to another
        // RDF resource.
        var resource = element.attr('resource');
        if (resource) {
            return ["<" + resource + ">"];
        }
                
        // `href` attribute also links to another RDF resource.
        var href = element.attr('href');
        if (href && element.attr('rel') === predicate) {
            return ["<" + href + ">"];
        }
    
        // If the predicate is a relation, we look for identified child objects
        // and provide their identifiers as the values. To protect from scope
        // creep, we only support direct descentants of the element where the
        // `rel` attribute was set.
        if (element.attr('rel')) {
            var value = [];
            var service = this;
            jQuery(element).children(this.subjectSelector).each(function() {
                value.push(service.getElementSubject(this));
            });
            return value;
        }
    
        // If none of the checks above matched we return the HTML contents of
        // the element as the literal value.
        return element.html();
    },
    
    writeElementValue : function(predicate, element, value) {
        //TODO: this is a hack, please fix!
        if (value instanceof Array && value.length > 0) {
            value = value[0];
        }
        
        // The `content` attribute can be used for providing machine-readable
        // values for elements where the HTML presentation differs from the
        // actual value.
        var content = element.attr('content');
        if (content) {
            element.attr('content', value);
            return;
        }
                
        // The `resource` attribute can be used to link a predicate to another
        // RDF resource.
        var resource = element.attr('resource');
        if (resource) {
            element.attr('resource', value);
        }
    
        // Property has inline value. Change the HTML contents of the property
        // element to match the new value.
        element.html(value);
    },
    
    // mostyl copied from http://code.google.com/p/rdfquery/source/browse/trunk/jquery.xmlns.js
    xmlns : function (elem) {
        var $elem;
        if (!elem) {
            if (typeof document === 'undefined') { 
                return {};
            }
            $elem = jQuery(document);
        } else {
            $elem = jQuery(elem);
        }
        // Collect namespace definitions from the element and its parents
        $elem = $elem.add($elem.parents());
        var obj = {};

        $elem.each(function (i, e) {
            if (e.attributes) {
                for (i = 0; i < e.attributes.length; i += 1) {
                    var attr = e.attributes[i];
                    if (/^xmlns(:(.+))?$/.test(attr.nodeName)) {
                        var prefix = /^xmlns(:(.+))?$/.exec(attr.nodeName)[2] || '';
                        var value = attr.nodeValue;
                        if (prefix === '' || value !== '') {
                            obj[prefix] = attr.nodeValue;
                        }
                    }
                }
            }
        });
        
        return obj;
    }

};
//     VIE - Vienna IKS Editables
//     (c) 2011 Henri Bergius, IKS Consortium
//     (c) 2011 Sebastian Germesin, IKS Consortium
//     (c) 2011 Szaby Grünwald, IKS Consortium
//     VIE may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://viejs.org/
(function(){
VIE.prototype.StanbolService = function(options) {
    var defaults = {
        name : 'stanbol',
        // you can also pass an array of URLs which are then tried sequentially
        url: ["http://dev.iks-project.eu/stanbolfull"],
        namespaces : {
            semdeski : "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#",
            semdeskf : "http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#",
            skos: "http://www.w3.org/2004/02/skos/core#",
            foaf: "http://xmlns.com/foaf/0.1/",
            opengis: "http://www.opengis.net/gml/",
            dbpedia: "http://dbpedia.org/ontology/",
            dbprop: "http://dbpedia.org/property/",
            owl : "http://www.w3.org/2002/07/owl#",
            geonames : "http://www.geonames.org/ontology#",
            enhancer : "http://fise.iks-project.eu/ontology/",
            entityhub: "http://www.iks-project.eu/ontology/rick/model/",
            entityhub2: "http://www.iks-project.eu/ontology/rick/query/",
            rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            rdfs: "http://www.w3.org/2000/01/rdf-schema#",
            dcterms  : 'http://purl.org/dc/terms/',
            schema: 'http://schema.org/',
            geo: 'http://www.w3.org/2003/01/geo/wgs84_pos#'
        }
    };
    this.options = jQuery.extend(true, defaults, options ? options : {});

    this.vie = null; /* will be set via VIE.use(); */
    this.name = this.options.name;
    this.connector = new StanbolConnector(this.options);

    jQuery.ajaxSetup({
        converters: {"text application/rdf+json": function(s){return JSON.parse(s);}}
    });

};

VIE.prototype.StanbolService.prototype = {
    init: function(){

        for (var key in this.options.namespaces) {
            var val = this.options.namespaces[key];
            this.vie.namespaces.add(key, val);
        }
        this.namespaces = this.vie.namespaces;

        this.rules = [
            /* rule to add backwards-relations to the triples
             * this makes querying for entities a lot easier!
             */
            {'left' : [
                '?subject a <http://fise.iks-project.eu/ontology/EntityAnnotation>',
                '?subject enhancer:entity-type ?type',
                '?subject enhancer:confidence ?confidence',
                '?subject enhancer:entity-reference ?entity',
                '?subject dcterms:relation ?relation',
                '?relation a <http://fise.iks-project.eu/ontology/TextAnnotation>',
                '?relation enhancer:selected-text ?selected-text',
                '?relation enhancer:selection-context ?selection-context',
                '?relation enhancer:start ?start',
                '?relation enhancer:end ?end'
            ],
             'right' : [
                 '?entity a ?type',
                 '?entity enhancer:hasTextAnnotation ?relation',
                 '?entity enhancer:hasEntityAnnotation ?subject'
             ]
             },
             /* rule(s) to transform a Stanbol person into a VIE person */
             {
                'left' : [
                    '?subject a dbpedia:Person',
                    '?subject rdfs:label ?label'
                 ],
                 'right': function(ns){
                     return function(){
                         return [
                             jQuery.rdf.triple(this.subject.toString(),
                                 'a',
                                 '<' + ns.base() + 'Person>', {
                                     namespaces: ns.toObj()
                                 }),
                             jQuery.rdf.triple(this.subject.toString(),
                                 '<' + ns.base() + 'name>',
                                 this.label, {
                                     namespaces: ns.toObj()
                                 })
                             ];
                     };
                 }(this.namespaces)
             },
             {
             'left' : [
                     '?subject a foaf:Person',
                     '?subject rdfs:label ?label'
                  ],
                  'right': function(ns){
                      return function(){
                          return [
                              jQuery.rdf.triple(this.subject.toString(),
                                  'a',
                                  '<' + ns.base() + 'Person>', {
                                      namespaces: ns.toObj()
                                  }),
                              jQuery.rdf.triple(this.subject.toString(),
                                  '<' + ns.base() + 'name>',
                                  this.label, {
                                      namespaces: ns.toObj()
                                  })
                              ];
                      };
                  }(this.namespaces)
              },
             {
                 'left' : [
                     '?subject a dbpedia:Place',
                     '?subject rdfs:label ?label'
                  ],
                  'right': function(ns) {
                      return function() {
                          return [
                          jQuery.rdf.triple(this.subject.toString(),
                              'a',
                              '<' + ns.base() + 'Place>', {
                                  namespaces: ns.toObj()
                              }),
                          jQuery.rdf.triple(this.subject.toString(),
                                  '<' + ns.base() + 'name>',
                              this.label.toString(), {
                                  namespaces: ns.toObj()
                              })
                          ];
                      };
                  }(this.namespaces)
              },
			  {
                 'left' : [
                     '?subject a dbpedia:City',
                     '?subject rdfs:label ?label',
                     '?subject dbpedia:abstract ?abs',
                     '?subject dbpedia:country ?country'
                  ],
                  'right': function(ns) {
                      return function() {
                          return [
                          jQuery.rdf.triple(this.subject.toString(),
                              'a',
                              '<' + ns.base() + 'Place>', {
                                  namespaces: ns.toObj()
                              }),
                          jQuery.rdf.triple(this.subject.toString(),
                                  '<' + ns.base() + 'name>',
                              this.label.toString(), {
                                  namespaces: ns.toObj()
                              }),
                          jQuery.rdf.triple(this.subject.toString(),
                                  '<' + ns.base() + 'description>',
                              this.abs.toString(), {
                                  namespaces: ns.toObj()
                              }),
                          jQuery.rdf.triple(this.subject.toString(),
                                  '<' + ns.base() + 'containedIn>',
                              this.country.toString(), {
                                  namespaces: ns.toObj()
                              })
                          ];
                      };
                  }(this.namespaces)
              },
        ];

        this.vie.types.addOrOverwrite('enhancer:EntityAnnotation', [
            /*TODO: add attributes */
        ]).inherit("owl:Thing");
        this.vie.types.addOrOverwrite('enhancer:TextAnnotation', [
            /*TODO: add attributes */
        ]).inherit("owl:Thing");
        this.vie.types.addOrOverwrite('enhancer:Enhancement', [
            /*TODO: add attributes */
        ]).inherit("owl:Thing");
    },
    // VIE API analyze implementation
    analyze: function(analyzable) {
        var service = this;

        var correct = analyzable instanceof this.vie.Analyzable;
        if (!correct) {throw "Invalid Analyzable passed";}

        var element = analyzable.options.element ? analyzable.options.element : jQuery('body');

        var text = service._extractText(element);

        if (text.length > 0) {
            //query enhancer with extracted text
            var success = function (results) {
                _.defer(function(){
                    var entities = VIE.Util.rdf2Entities(service, results);
                    analyzable.resolve(entities);
                });
            };
            var error = function (e) {
                analyzable.reject(e);
            };

            this.connector.analyze(text, success, error);

        } else {
            console.warn("No text found in element.");
            analyzable.resolve([]);
        }

    },

    // VIE API load implementation
    // Runs a Stanbol entityhub find
    find: function (findable) {
        var correct = findable instanceof this.vie.Findable;
        if (!correct) {throw "Invalid Findable passed";}
        var service = this;
        // The term to find, * as wildcard allowed
        var term = escape(findable.options.term);
        if(!term){
            console.warn("StanbolConnector: No term to look for!");
            findable.resolve([]);
        };
        var limit = (typeof findable.options.limit === "undefined") ? 20 : findable.options.limit;
        var offset = (typeof findable.options.offset === "undefined") ? 0 : findable.options.offset;
        var success = function (results) {
            _.defer(function(){
                var entities = VIE.Util.rdf2Entities(service, results);
                findable.resolve(entities);
            });
        };
        var error = function (e) {
            findable.reject(e);
        };
        this.connector.find(term, limit, offset, success, error);
    },

    // VIE API load implementation
    // Runs a Stanbol entityhub find
    load: function(loadable){
        var correct = loadable instanceof this.vie.Loadable;
        if (!correct) {throw "Invalid Loadable passed";}
        var service = this;

        var entity = loadable.options.entity;
        if(!entity){
            console.warn("StanbolConnector: No entity to look for!");
            loadable.resolve([]);
        };
        var success = function (results) {
            _.defer(function(){
                var entities = VIE.Util.rdf2Entities(service, results);
                loadable.resolve(entities);
            });
        };
        var error = function (e) {
            loadable.reject(e);
        };
        this.connector.load(entity, success, error);
    },

    _extractText: function (element) {
        if (element.get(0) &&
            element.get(0).tagName &&
            (element.get(0).tagName == 'TEXTAREA' ||
            element.get(0).tagName == 'INPUT' && element.attr('type', 'text'))) {
            return element.get(0).val();
        }
        else {
            var res = element
                .text()    //get the text of element
                .replace(/\s+/g, ' ') //collapse multiple whitespaces
                .replace(/\0\b\n\r\f\t/g, ''); // remove non-letter symbols
            return jQuery.trim(res);
        }
    }
};

var StanbolConnector = function(options){
    this.options = options;
    this.baseUrl = (_.isArray(options.url))? options.url : [ options.url ];
    this.enhancerUrlPrefix = "/engines";
    this.entityhubUrlPrefix = "/entityhub";
    //TODO: this.ontonetUrlPrefix = "/ontonet";
    //TODO: this.rulesUrlPrefix = "/rules";
    //TODO: this.factstoreUrlPrefix = "/factstore";
};
StanbolConnector.prototype = {

    analyze: function(text, success, error, options) {
        if (!options) { options = { urlIndex : 0}; }
        if (options.urlIndex >= this.baseUrl.length) {
            error("Could not connect to the given Stanbol endpoints! Please check for their setup!");
            return;
        }
        
        var enhancerUrl = this.baseUrl[options.urlIndex].replace(/\/$/, '');
        enhancerUrl += this.enhancerUrlPrefix;
        
        var format = options.format || "application/rdf+json";
        
        var retryErrorCb = function (c, t, s, e, o) {
            return  function () {
                c.analyze(t, s, e, _.extend(o, {urlIndex : o.urlIndex+1}));
            };
        }(this, text, success, error, options);

        if (typeof exports !== "undefined" && typeof process !== "undefined") {
            // We're on Node.js, don't use jQuery.ajax
            return this.analyzeNode(enhancerUrl, text, success, retryErrorCb, options, format);
        }

        jQuery.ajax({
            success: function(response){
                success(response);
            },
            error: retryErrorCb,
            type: "POST",
            url: enhancerUrl,
            data: text,
            dataType: format,
            contentType: "text/plain",
            accepts: {"application/rdf+json": "application/rdf+json"}

        });
    },

    analyzeNode: function(url, text, success, error, options, format) {
        var request = require('request');
        var r = request({
            method: "POST",
            uri: url,
            body: text,
            headers: {
                Accept: format
            }
        }, function(error, response, body) {
            success({results: JSON.parse(body)});
        });
        r.end();
    },

    load: function (uri, success, error, options) {
        if (!options) { options = { urlIndex : 0}; }
        if (options.urlIndex >= this.baseUrl.length) {
            error("Could not connect to the given Stanbol endpoints! Please check for their setup!");
            return;
        }
        
        uri = uri.replace(/^</, '').replace(/>$/, '');
        var url = this.baseUrl[options.urlIndex].replace(/\/$/, '');
        url += this.entityhubUrlPrefix + "/sites/entity?id=" + escape(uri);
        
        var format = options.format || "application/rdf+json";
        
        var retryErrorCb = function (c, u, s, e, o) {
            return  function () {
                c.load(u, s, e, _.extend(o, {urlIndex : o.urlIndex+1}));
            };
        }(this, uri, success, error, options);
        
        jQuery.ajax({
            success: function(response){
                success(response);
            },
            error: retryErrorCb,
            type: "GET",
            url: url,
            data: null,
            dataType: format,
            contentType: "text/plain",
            accepts: {"application/rdf+json": "application/rdf+json"}
        });
    },

    find: function (term, limit, offset, success, error, options) {
        // curl -X POST -d "name=Bishofsh&limit=10&offset=0" http://localhost:8080/entityhub/sites/find
        if (!options) { options = { urlIndex : 0}; }
        
        if (options.urlIndex >= this.baseUrl.length) {
            error("Could not connect to the given Stanbol endpoints! Please check for their setup!");
            return;
        }
        
        var url = this.baseUrl[options.urlIndex].replace(/\/$/, '');
        url += this.entityhubUrlPrefix + "/sites/find";
        
        var format = options.format || "application/rdf+json";
        
        if (offset == null) {
            offset = 0;
        }
        if (limit == null) {
            limit = 10;
        }
        
        var retryErrorCb = function (c, t, l, of, s, e, o) {
            return  function () {
                c.find(t, l, of, s, e, _.extend(o, {urlIndex : o.urlIndex+1}));
            };
        }(this, term, limit, offset, success, error, options);
        
        jQuery.ajax({
            success: function(response){
                success(response);
            },
            error: retryErrorCb,
            type: "POST",
            url: url,
            data: "name=" + term + "&limit=" + limit + "&offset=" + offset,
            dataType: format,
            accepts: {"application/rdf+json": "application/rdf+json"}
        });
    }
};
})();

if (!VIE.prototype.view) {
    VIE.prototype.view = {};
}

VIE.prototype.view.Collection = Backbone.View.extend({
    // Ensure the collection view gets updated when items get added or removed
    initialize: function() {
        this.template = this.options.template;
        this.service = this.options.service;
        if (!this.service) {
            throw "No RDFa service provided to the Collection View";
        }
        this.owner = this.options.owner;
        this.entityViews = {};
        _.bindAll(this, 'addItem', 'removeItem', 'refreshItems');
        this.collection.bind('add', this.addItem);
        this.collection.bind('remove', this.removeItem);

        // Make the view aware of existing entities in collection
        var view = this;
        this.collection.forEach(function(entity) {
            view.registerItem(entity, view.collection);
        });
    },

    addItem: function(entity, collection) {
        if (collection !== this.collection) {
            return;
        }

        if (!this.template || this.template.length === 0) {
            return;
        }

        var entityView = this.service._registerEntityView(entity, this.cloneElement(this.template));
        var entityElement = entityView.render().el;
        if (entity.id) {
            this.service.setElementSubject(entity.getSubjectUri(), entityElement);
        }

        // TODO: Ordering
        this.el.append(entityElement);

        // Ensure we catch all inferred predicates. We add these via JSONLD
        // so the references get properly Collectionized.
        var service = this.service;
        jQuery(entityElement).parent('[rev]').each(function() {
            var predicate = jQuery(this).attr('rev');
            var relations = {};
            relations[predicate] = new service.vie.Collection();
            relations[predicate].addOrUpdate(service.vie.entities.get(service.getElementSubject(this)));
            entity.set(relations);
        });
        
        this.trigger('add', entityView);
        this.entityViews[entity.cid] = entityView;
        entityElement.show();
    },

    registerItem: function(entity, collection) {
        var element = this.service.getElementBySubject(entity.id, this.el);
        if (!element) {
            return;
        }

        var entityView = this.service._registerEntityView(entity, element);
        this.entityViews[entity.cid] = entityView;
    },

    removeItem: function(entity) {
        if (!this.entityViews[entity.cid]) {
            return;
        }

        this.trigger('remove', this.entityViews[entity.cid]);
        this.entityViews[entity.cid].el.remove();
        delete(this.entityViews[entity.cid]);
    },

    refreshItems: function(collection) {
        var view = this;
        jQuery(this.el).empty();
        collection.forEach(function(entity) {
            view.addItem(entity, collection);
        });
    },

    cloneElement: function(element) {
        var newElement = jQuery(element).clone(false);
        var service = this.service;
        if (typeof newElement.attr('about') !== 'undefined') {
            // Direct match with container
            newElement.attr('about', '');
        }
        newElement.find('[about]').attr('about', '');
        var subject = this.service.getElementSubject(newElement);
        service._findPredicateElements(subject, newElement, false).each(function() {
            service.writeElementValue(null, jQuery(this), '');
        });
        return newElement;
    }
});
if (!VIE.prototype.view) {
    VIE.prototype.view = {};
}

VIE.prototype.view.Entity = Backbone.View.extend({
    initialize: function(options) {
        this.service = options.service ? options.service : 'rdfa';
        this.vie = options.vie;

        // Ensure view gets updated when properties of the Entity change.
        _.bindAll(this, 'render');
        this.model.bind('change', this.render);
    },

    // Rendering a view means writing the properties of the Entity back to
    // the element containing our RDFa annotations.
    render: function() {
        this.vie.save({
                element: this.el, 
                entity: this.model
            }).
            to(this.service).
            execute();
        return this;
    }
}); })();
