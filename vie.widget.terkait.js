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
							$('.tag').click(function(ev){
							var uri = $(this).attr('title');
							$('#image_container')
							.vieImageSearch({
								entity: uri
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
							$('.tag').click(function(ev){
							var uri = $(this).attr('title');
							$('#image_container')
							.vieImageSearch({
								entity: uri
							});
					});}
                });
	// Image search part
            
    // set-up of the Image-widget
    $('#image_container')
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
	var i = 10; 
	$('#image_container img').each(function () {
		i+= 10; 
		$(this)
		.css({
			"z-index" : i, 
			bottom: i + "px", 
			position: "absolute", 
			left: i + "px"})
		.click(function () { 
			$(this).css({"z-index" : 0});
		})
	});
});

