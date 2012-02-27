if (!window.terkait) {
    window.terkait = {};
}
window.terkait.formEditor = {};

jQuery.extend(window.terkait.formEditor, {
	
	EntityView : Backbone.View.extend({
	
	    tagName : "div",
	    className : "entity",
	
	    initialize : function() {
	        this.model.bind("rerender", this.render, this);
	        this.model.bind("change", this.validate, this);
	        
	        this.render();
	    },
	
	    render : function () {
	        var $el = jQuery(this.el);
	        $el.empty();
	        var model = this.model;
	        
	        var type = model.get("@type"); // get the type of the model
	        type = (jQuery.isArray(type))? type : [type];
	        for (var t = 0; t < type.length; t++) {
	        	var vieType = window.terkait.vie.types.get(type[t]);
	        	if (vieType && vieType.isof("Thing")) {
	        		type = type[t];
	        	}
	        }
	        type = (jQuery.isArray(type))? window.terkait.vie.types.get("Thing") : type;
	        
	        var attributes = type.attributes.list(); // get the list of possible attributes of that model
	        for (var a = 0; a < attributes.length; a++) { //iterate over them
	            var attr = attributes[a]; // the VIE.Attribute of the current attribute
	            var attrType = attr.range[0]; // the target range of the attribute
	            var label = attr.id; // the id (as URI) of the attribute
	            
	            //render label in view
	            $el.append(window.terkait.formEditor._renderLabel(model, attr));
	            
	            //render the value
	            var value = model.get(label); // this is one of: [collection,undefined,value,array]
	            var isSimpleType = window.terkait.vie.types.get(attrType).isof("DataType");
	            var bucket = (isSimpleType) ? $("<div>").addClass("widget-holder") : $el;
	            
	            if (value && !value.isCollection) {
        			var child = window.terkait.vie.types.get(attrType).instance({
        				"value" : value
        			});
            		model.set(label, child, {silent: true});
            		value = model.get(label);
	            }
	            
            	if (value && value.size() > 0) {
	                // iterate over collection
	                value.each(function (attrValue) {
	                    var elem = window.terkait.formEditor._renderEntity(model, attr, attrValue);
	                    bucket.append(elem);
	                });
	            }

	            //this should generate a possibility to add a new values
	            var elem = window.terkait.formEditor._renderMissingEntity(model, attr);
	            bucket.append(elem);
	            
	            if (isSimpleType) {
	                // is already done in the other case
	                $el.append(bucket);
	            }
	            
	        }
	    }
	}),

	modelRenderer : {
	    "owl:Thing" : window.terkait.formEditor.EntityView
	},

	renderComplexEntity : function(model, attr, value) {
	    var View = window.terkait.formEditor.selectRenderer(attr.range[0]);
	    return new View({model : value}).el;
	},

	renderSimpleEntity : function(model, attr, value) {
	    var val = value.get("value");
	    if (attr.id === "<http://schema.org/html>") {
	        val = (val) ? val : "";
	        return $('<textarea  cols="50" rows="10">' + val + "</textarea>");
	    } 
	    else if (attr.id === "<http://schema.org/image>") {
	        return $('<input type="file" />');
	    } else {
	        val = (val) ? val : "";
	        return $("<input type=\"text\" size=\"30\">").val(val).bind("blur", function () {
	            var newValue = $(this).val();
	            value.set("value", newValue);
	            model.change();
	            model.trigger('change:' + attr.id);
	        });
	    }
	},

	_renderMissingEntity : function(model, attribute) {
	    return $('<input type="image" src="' + chrome.extension.getURL("icons/add-button.gif") + '">')
        .click(function () {
	        var type = window.terkait.vie.types.get(attribute.range[0]);
	        var newEntity = type.instance();
	        model.setOrAdd(attribute.id, newEntity);
	        var elem = window.terkait.formEditor._renderEntity(model, attribute, newEntity);
	        $(this).before(elem);
	    });
	},

	_renderLabel : function(model, attribute) {
	    var lbl = attribute.id.replace("<" + window.terkait.vie.namespaces.base(), "").replace(/[<>]/g, "");
	    switch (attribute.id) {
	        case ("<http://schema.org/name>") :
	            lbl = "Name";
	            break;
	        case ("<http://schema.org/title>") :
	            lbl = "Titel";
	            break;
	        case ("<http://schema.org/url>") :
	            lbl = "URL";
	            break;
	    }
	    return $("<label>").html(window.terkait.capitaliseFirstLetter(lbl)); //TODO i18n
	},

/***************/
/**** HELPER ***/
/***************/

	_renderEntity : function (parent, attribute, entity) {
	    var type = window.terkait.vie.types.get(attribute.range[0]);
	
	    if (type.isof("DataType")) {
	        return window.terkait.formEditor.renderSimpleEntity(parent, attribute, entity);
	    } else {
	        return window.terkait.formEditor.renderComplexEntity(parent, attribute, entity);
	    }
	},
	
	selectRenderer : function (type) {
	    var tsKeys = [];
	    for (var q in window.terkait.formEditor.modelRenderer) {
	        tsKeys.push(q);
	    }
	    //sort the keys in ascending order!
	    tsKeys = window.terkait.vie.types.sort(tsKeys, true);
	    var ttype = window.terkait.vie.types.get(type);
	    if (ttype) {
	        for (var q = 0, qlen = tsKeys.length; q < qlen; q++) {
	            var key = tsKeys[q];
	            if (ttype.isof(key)) {
	                return window.terkait.formEditor.modelRenderer[key];
	            }
	        }
	    }
	    return undefined;
	}
	
});