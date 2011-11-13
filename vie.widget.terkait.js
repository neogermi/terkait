$(window).load(function () {
	var sideDiv = '<div class="slide-out-div">'+
					'<div class="handle"></div>'+
					'<div id="tag_container">'+
						'<div class="persons"><h3>Persons</h3><div class="tags"></div></div>'+
						'<div class="places"><h3>Places</h3><div class="tags"></div></div>'+
					'</div>'+
					'<div id="image_container"></div>'+
				'</div>';
	$('body').append(sideDiv);
    $('.slide-out-div').tabSlideOut({
            tabHandle: '.handle',                     //class of the element that will become your tab
            pathToTabImage: './utils/img/terkait.png', //path to the image for the tab //Optionally can be set using css
            imageHeight: '173px',                     //height of tab image           //Optionally can be set using css
            imageWidth: '40px',                       //width of tab image            //Optionally can be set using css
            tabLocation: 'right',                      //side of screen where tab lives, top, right, bottom, or left
            speed: 300,                               //speed of animation
            action: 'click',                          //options: 'click' or 'hover', action to trigger animation
            topPos: '0px',                          //position from the top/ use if tabLocation is left or right
            leftPos: '0px',                          //position from left/ use if tabLocation is bottom or top
            fixedPosition: false                      //options: true makes it stick(fixed position) on scroll
    });
	$('.handle').trigger('click');	
	//Initialize VIE
	var myVIE = window.myVIE = new VIE();
    myVIE.loadSchemaOrg();
	
	// auto-tagging part
	var elem = $('article');
	$('#tag_container .persons .tags').vieAutoTag({
                    vie : myVIE,
                    services: {
                        'stanbol' : {
                            use: true,
                            service: myVIE.StanbolService
                        }
                    },
                    element: elem,
                    filter: ["Person"],
                    label: [function (entity) {
                        if (entity.has("givenName")) {
                            var givenName = entity.get("givenName");
                            var name = entity.get("name");
                            var lbl = ($.isArray(givenName))? givenName[0] : givenName;
                            lbl += " ";
                            lbl += ($.isArray(name))? name[0] : name;
							return lbl.replace(/"/g, "").replace(/@[a-z]+/, '');
                        } else {
                            var name = entity.get("name");
                            var lbl = ($.isArray(name))? name[0] : name;
							return lbl.replace(/"/g, "").replace(/@[a-z]+/, '');
                        }
                    }],
					end_query: function(){
							$(this).find('.tag').each(function(ev){
							
								var uri = $(this).attr('title');
								var img_container = $(this).find('.tag_images');
	
								// set-up of the Image-widget
								img_container
									.vieImageSearch({
										vie    : myVIE,
										bin_size: 8,
										services : {
											flickr : {
												api_key : "ffd6f2fc41249feeddd8e62a531dc83e",
												use: true
											},
											gimage : {
												use: true
											}
										},
										render: render
										
								});
								//start search
								img_container
									.vieImageSearch({
										entity: uri,
									});
																				
		
					});}
                });

	$('#tag_container .places .tags')
                .vieAutoTag({
                    vie : myVIE,
                    services: {
                        'stanbol' : {
                            use: true,
                            service: myVIE.StanbolService
                        }
                    },
                    element: elem,
                    filter: ["Place"],
                    label: ["Thing.name"],
					end_query: function(){
								$(this).find('.tag').each(function(ev){
								var uri = $(this).attr('title');
								var img_container = $(this).find('.tag_images');
	
								// set-up of the Image-widget
								img_container
									.vieImageSearch({
										vie    : myVIE,
										bin_size: 8,
										services : {
											flickr : {
												api_key : "ffd6f2fc41249feeddd8e62a531dc83e",
												use: true
											},
											gimage : {
												use: true
											}
										}
								});
								//start search
								img_container
									.vieImageSearch({
										entity: uri,
									});
																				
		
					});}
                });
	
            
    render = function(data){
			var self = this;
            
            var photos = self.options.photos;
            var time = data.time;
            
            // clear the container element
            $(self.element).empty();
            //rendering

			var preload_div = $('<div class="coda-slider preload">');
			var ul = $('<ul>');
			for (var p = 0; p < photos.length && p < this.options.bin_size; p++) {
				var photo = photos[p];
				var li = $('<li class="slider_item">');
				var a = $('<a class="' + self.widgetBaseClass + '-image" target="_blank" href="' + photo.original + '"></a>');
				var img = $('<img src="' + photo.thumbnail + '" />');
				var div = $('<div>');
				div.css({"height":"200px", "width": "200px"});
				a.append(img);
				div.append(a);
				li.append(a);
				ul.append(li);
				
			}
			ul.appendTo($(self.element));
            ul.anythingSlider({theme: 'minimalist-round'});
			$('.tag_images img').each(function(){
				debugger;
				var img_pad = (150-$(this).height())/2+"px "+(200-$(this).width())/2+"px";
				$(this).css({"max-height":"150px", "max-width": "200px", padding: img_pad,"background-color":"black"});
			});	

			return this;}
});
