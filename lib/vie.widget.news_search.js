// VIE Widgets - Vienna IKS Editable Widgets
// (c) 2011 Sebastian Germesin, IKS Consortium
// VIE Widgets may be freely distributed under the MIT license.
// (see LICENSE)

(function($, undefined) {
    $.widget('view.vieNewsSearch', {
        
        _create: function () {
            //extend VIE with an ontological representation of the images
            var v = this.options.vie;
			/* TODO
			if (v.types.get("NewsObject").attributes.get("depicts") !== undefined) {
				v.types.get("NewsObject").attributes.add("depicts", ["Thing"]);
				v.types.get("Thing").attributes.get("image").range.push("NewsObject");
				v.types.add("VIENewsResult", [
				   {
				   "id"    : "query",
				   "range" : ["Text", "Thing"]
				   },
				   {
				   "id"    : "service",
				   "range" : ["Text", "Thing"]
				   },
				   {
					"id"    : "time",
					"range" : "Date"
				   },
				   {
					"id"    : "entity",
					"range" : "Thing"
				   }]
				).inherit(v.types.get("Thing"));
			} */
            return this;
        },
        
        _init: function () {
            this.triggerSearch(this.options.entity);
        },
        
        render: function (data) {
            data.time = (data.time)? data.time : new Date();
            if (data.queryId === this.options.query_id) {
                for (var p = 0; p < data.objects.length; p++) {
                    /* TODO this._triplifyNews(data.objects[p], data.time, data.serviceId, data.entityId, data.queryId); */
                    this.options.objects.push(data.objects[p]);
                }
                delete data["objects"];
                var render = (this.options.render)? this.options.render : this._render;
                if (render) {
                    render.call(this, data);
                } else {
                    console.log("vie.widget.news_search", "No render method specified!");
                }
            } else {
                //discard results as they depend on an old query
            }
        },
        
        /* TODO 
        _render: function (data) {
            var self = this;
            
            var newss = self.options.newss;
            var time = data.time;
            
            // clear the container element
            $(self.element).empty();
                        
            //rendering
            for (var p = 0; p < newss.length && p < this.options.bin_size; p++) {
                var photo = newss[p];
                var image = $('<a class="' + self.widgetBaseClass + '-image" target="_blank" href="' + photo.original + '"></a>')
                    .append($("<img src=\"" + photo.thumbnail + "\" />"));
                $(self.element).append(image);
            }
            return this;
        },*/
        
        triggerSearch: function (entityId, pageNum) {
            var self = this;
            
            if (this.options.timer) {
                clearTimeout(this.options.timer);
            }
            this.options.query_id++;
            var qId = this.options.query_id;
            this.options.objects = [];
            this.options.page_num = (pageNum)? pageNum : 0;
            
            var entity = undefined;
            if (typeof entityId === "string") {
                entity = this.options.vie.entities.get(entityId);
            } else {
                entity = entityId;
            }

            if (entity) {
                var queryPerformed = false;
                for (var s in this.options.services) {
                    var service = this.options.services[s];
                    if (service.use) {
                        this._trigger('start_query', undefined, {entity: entity, service: s, time: new Date(), queryId : qId});
                        service.query(entity, s, this, qId);
                        queryPerformed = true;
                    }
                }
                if (queryPerformed) {
                    this.options.timer = setTimeout(function (widget) {
                        return function () {
                            // discard all results that return after this timeout happened
                            widget.options.query_id++;
                        };
                    }(this), this.options.timeout, "JavaScript");
                }
            } else {
                this._trigger('error', undefined, {msg: "Entity needs to be registered in VIE.", id : entityId});
            }
            return this;
        },
        
        /* TODO
        _triplifyNews: function (photo, time, serviceId, entityId, queryId) {
            var entity = this.options.vie.entities.get(entityId);
            
            var imageId = "<" + photo.original + ">";
            this.options.vie.entities.addOrUpdate({
                '@subject' : imageId, 
                '@type'    : "NewsObject",
                "time"     : time.toUTCString(),
                "query"    : queryId,
                "service"  : serviceId,
                "entity"   : entity.id,
                "image"    : photo.original
            });
            entity.setOrAdd('news', imageId);
        },*/
        
        _getUrlMainPartFromEntity : function (entity, serviceId) {
            var service = this.options.services[serviceId];
            
            entity = ($.isArray(entity))? entity : [ entity ];

            for (var e = 0; e < entity.length; e++) {
                var types = entity[e].get('@type');
                types = ($.isArray(types))? types : [ types ];
                
                for (var t = 0; t < types.length; t++) {
                    var type = this.options.vie.types.get(types[t]);
                    if (type) {
                        var tsKeys = [];
                        for (var q in this.options.ts_url) {
                            tsKeys.push(q);
                        }
                        //sort the keys in ascending order!
                        tsKeys = this.options.vie.types.sort(tsKeys, false);
                        for (var q = 0; q < tsKeys.length; q++) {
                            var key = tsKeys[q];
                            if (type.isof(key) && this.options.ts_url[key][serviceId]) {
                                var ret = this.options.ts_url[key][serviceId].call(this, entity[e], serviceId);
                                if (ret) {
                                    return ret;
                                }
                            }
                        }
                    }
                }
            }
            return "";
        },
        
        options: {
            vie         : new VIE(),
            timeout     : 10000,
            bin_size  : 10,
            services    : {
                'gnews' : {
                    use       : false,
                    api_key   : undefined,
                    ned       : "us",
                    hl        : "en",
                    base_url  : "https://ajax.googleapis.com/ajax/services/search/news?v=1.0",
                    tail_url  : function (widget, service) {
                        var url = "&rsz=" + widget.options.bin_size;
                        url += "&start=" + (widget.options.page_num * widget.options.bin_size);
                        url += "&hl=" + service.hl;
                        url += "&ned=" + service.ned;
                        
                        return url;
                    },
                    query : function (entity, serviceId, widget, queryId) {
                        // assemble the URL
                        
                        var mainUrl = widget._getUrlMainPartFromEntity(entity, serviceId);
                        
                        if (mainUrl) {
                            var url = this.base_url;
                            url += mainUrl;
                            url += this.tail_url(widget, this);
                            // trigger the search & receive the data via callback
                            jQuery.getJSON(url,null,this.callback(widget, entity.id, serviceId, queryId));
                        } else {
                            widget._trigger("error", undefined, {
                                msg: "No type-specific URL can be acquired for entity. Please add/overwrite widget.options[<widget_type>][" + serviceId + "]!", 
                                id : entityId, 
                                service : serviceId, 
                                queryId : queryId});
                        }
                    },
                    callback  : function (widget, entityId, serviceId, queryId) {
                        return function (data) {
                            var objects = [];
                            if (data && data.responseStatus === 200) {
                                var rData = data.responseData.results;
                                for (var r = 0; r < rData.length; r++) {
                                    var res = rData[r];
                                    
                                    var obj = {
                                        title         : res.title,
                                        url           : res.unescapedUrl,
                                        publisher     : res.publisher,
                                        publishedDate : res.publishedDate,
                                        image         : res.image
                                    };
                                    objects.push(obj);
                                }
                            }
                            var data = {entityId : entityId, serviceId: serviceId, queryId : queryId, time: new Date(), objects: objects};
                            widget._trigger('end_query', undefined, data);
                            widget.render(data);
                          };
                    }
                }
            },
            ts_url : {
                "Thing" : {
                    'gnews' : function (entity, serviceId) {
                        var url = "";
                        if (entity.has("name")) {
                            url += "&q="; // *no* type-specific keywords
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
                                name = name.replace(/"/g, "").replace(/@[a-z]+/, '').replace(/ /g, "+");
                                url += name;
                            }
                        }
                        return url;
                    }
                }
            },
            
            // helper
            render      : undefined,
            entity      : undefined,
            objects     : [],
            timer       : undefined,
            page_num    : 1,
            query_id    : 0,
            
            // events
            start_query : function () {},
            end_query   : function () {},
            error       : function () {}
        }
        
    });
})(jQuery);
