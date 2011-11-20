// VIE Widgets - Vienna IKS Editable Widgets
// (c) 2011 Sebastian Germesin, IKS Consortium
// VIE Widgets may be freely distributed under the MIT license.
// (see LICENSE)

(function($, undefined) {
    $.widget('view.vieAutoTag', {
        
        _create: function () {
            var self = this;
            for (var s in this.options.services) {
                if (this.options.services[s].service) {
                    var options = 
                        (this.options.services[s].options)? 
                                this.options.services[s].options : {};
                    this.options.vie.use(new this.options.services[s].service(options));
                }
            }
            return this;
        },
        
        _init: function () {
            this.triggerTagging();
            return this;
        },
        
        triggerTagging : function () {
            var self = this;
            var bucket = $(this.element);
            var elem = $(this.options.element);
            
            if (!self.options.append) {
                self.options.entities = [];
            }
            
            for (var s in this.options.services) {
                var service = this.options.services[s];
                if (!this.options.services[s].use) {
                    continue;
                }
                this.options.vie.analyze({element: elem})
                .from(s).execute()
                .done(function (entities) {
                    self.options.entities = self.options.entities.concat(entities);
                    self._unduplicateEntities();
                    var render = (self.options.render)? self.options.render : self._render;
                    render.call(self, self.options.entities);
					self._trigger('end_query', undefined, {service : s, time: new Date(), entities: entities});
                })
                .fail(function () {
                    debugger;
                });

                this._trigger('start_query', undefined, {service : s, time: new Date()});
				
            }
            return this;
        },
        
        _render: function (entities) {
            var self = this;
            self.options.label = ($.isArray(self.options.label))? self.options.label : [ self.options.label ];
            var list = $('<div class="entities">');
            for (var e = 0; e < entities.length; e++) {
                var ent = $('<div class="entity">');
                ent.css({width: "100%", height: "240px", overflow : "auto"});
				var label = undefined;
                var filtered = (self.options.filter.length > 0);
                for (var f = 0; f < self.options.filter.length; f++) {
                    if (entities[e].isof(self.options.filter[f])) {
                        filtered = false;
                        break;
                    }
                }
                if (!filtered) {
                    for (var l = 0; l < self.options.label.length; l++) {
                        var la = self.options.label[l];
                        if (typeof la === "string") {
                            var type = la.split(".")[0];
                            var prop = la.split(".")[1];
                            if (entities[e].isof(type) &&
                                entities[e].has(prop)) {
                                var lit = entities[e].get(prop);
                                if ($.isArray(lit)) {
                                    var tmp = $.merge([], lit);
                                    lit = tmp[0];
                                    for (var l = 0; l < tmp.length; l++) {
                                        if (tmp[l].indexOf('@en') > 0) {
                                            lit = tmp[l];
                                        }
                                    }
                                }
                                label = lit.replace(/"/g, "").replace(/@[a-z]+/, '');
                                break;
                            }
                        } else if (typeof la === "function") {
                            if (la(entities[e])) {
                                label = la(entities[e]);
                                break;
                            }
                        }
                    }
                
                    if (!label) {
                        label = entities[e].id.replace(/</, "&lt;");
                    }
                    
                    ent
                    .addClass("tag")
                    .attr("title", entities[e].id.replace(/</g, '').replace(/>/g, ''))
                    .text(label)
                    .appendTo(list);
					var img_container = $('<div class="tag_images">');
					img_container.css({height:"90px", width:"150px"});
					ent.append(img_container);
					var news_container = $('<div class="tag_news">');
					news_container.css({height:"90px", width:"150px"});
					ent.append(news_container);
					var video_container = $('<div class="tag_video">');
					video_container.css({height:"90px", width:"150px"});
					ent.append(video_container);
                }
            }
            $(this.element).empty().append(list);
            
            return this;
        },
        
        _unduplicateEntities: function () {
            for (var i = 0; i < this.options.entities.length; i++) {
                var iid = this.options.entities[i].id;
                for (var j = i+1; j < this.options.entities.length; j++) {
                    var jid = this.options.entities[j].id;
                    if (iid === jid) {
                        this.options.entities.splice(j, 1);
                        j--;
                    }
                }
            }
            return this;
        },
                
        options: {
            vie         : new VIE(),
            append      : true,
            label       : [],
            filter      : [],
            services    : {
                'stanbol' : {
                    use: false,
                    options: {
                        url : "http://dev.iks-project.eu:8081",
                        proxyDisabled: true,
                        proxyUrl: "../../../utils/proxy/proxy.php"
                    }
                },
                'rdfa' : {
                    use: false
                }
            },
            
            
            // helper
            render: undefined,
            entities: [],
            
            // events
            start_query: function () {},
            end_query: function () {}
        }
        
    });
})(jQuery);