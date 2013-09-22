jQuery.fn.wowscroll = function(options) {
	var WowScrollObj = inherit(WowScroll);

	WowScrollObj.init(options);
	WowScrollObj.build(this);
	WowScrollObj.drawThumb();
	WowScrollObj.setEvents();

	function inherit(proto) {
		function F() {}
		F.prototype = proto;
		return new F;
	}
}

var WowScroll = {
	axis: "y",
	wheelSense: 120,
	wheelEnabled: true,
	hide: true,
	scrollbarSize: "auto",
	arrows: false,

	init: function(options) {
		for (var prop in options) {
			this[prop] = options[prop];
		}

		var scrollbarSize = this.scrollbarSize,
			wheelSense = this.wheelSense;

		this.axis = this.axis === "x";
		this.wheelSense = (wheelSense >= 1) ? wheelSense : 120;				
	},

	build: function(target) {
		var self = this,
			container = target,
			content = container.html(),
			contentWrap,
			contentBlock,
			scrollbar,
			scrollbarSize = self.scrollbarSize,
			track,
			thumb,
			axis = self.axis,
			arrows = self.arrows,
			arrowHome,
			arrowEnd,
			axisClass,
			viewLength;

		axisClass = (axis) ? "horizontal" : "vertical";		

		container.empty();
		contentWrap = $("<div/>")
			.addClass("wowscroll-content-wrap")
			.addClass(axisClass)
			.appendTo(container);

		contentBlock = $("<div/>")
			.addClass("wowscroll-content")
			.append(content)
			.appendTo(contentWrap);

		scrollbar = $("<div/>")
			.addClass("wowscroll-scrollbar")
			.appendTo(contentWrap);

		if(self.hide) {
			scrollbar.addClass("hide");
		}

		viewLength = (axis) ? contentWrap.width() : contentWrap.height();	
		scrollbarSize = (!isNaN(parseFloat(scrollbarSize)) && isFinite(scrollbarSize) && (scrollbarSize < viewLength)) ? scrollbarSize : "auto";	
		if(scrollbarSize !== "auto") {
			scrollbarSize = (scrollbarSize >= 20) ? scrollbarSize : 20;
			scrollbarSize = (arrows && (scrollbarSize > (viewLength - 10))) ? viewLength - 10 : scrollbarSize;					
		} else {
			scrollbarSize = (arrows) ? viewLength - 10 : viewLength;
		}
		(axis) ? scrollbar.css("width", scrollbarSize) : scrollbar.css("height", scrollbarSize);
		self.scrollbarSize = scrollbarSize;

		if(arrows) {
			(axis) ? scrollbar.css("left", 5) : scrollbar.css("top", 5);

			arrowHome = $("<button/>")
				.addClass("nav")
				.addClass("nav-home")
				.prependTo(scrollbar);

			arrowEnd = $("<button/>")
				.addClass("nav")
				.addClass("nav-end")
				.appendTo(scrollbar);

			self.arrowHome = arrowHome;
			self.arrowEnd = arrowEnd;
		}

		track = $("<div/>")
			.addClass("track")
			.appendTo(scrollbar);

		thumb = $("<div/>")
			.addClass("thumb")
			.appendTo(track);		

		self.container = container;
		self.contentWrap = contentWrap;
		self.contentBlock = contentBlock;
		self.scrollbar = scrollbar;
		self.track = track;
		self.thumb = thumb;
		self.contentLength = (axis) ? contentBlock.width() : contentBlock.height();
		self.viewLength = viewLength;
		self.scrollbarScale = (viewLength / self.contentLength);	
	},

	drawThumb: function() {
		var self = this,
			axis = self.axis,
			viewLength = self.viewLength,
			scrollbarSize = self.scrollbarSize,
			scrollbarScale = self.scrollbarScale,
			thumbLength,
			prop = (axis) ? "width" : "height";

		thumbLength = scrollbarScale * scrollbarSize;
		if(thumbLength < 5) {
			thumbLength = 5;						
			scrollbarScale = (scrollbarSize - thumbLength) / (self.contentLength - viewLength);			
		} else {
			scrollbarScale = scrollbarScale * scrollbarSize / viewLength;
		}

		self.thumb.css(prop, thumbLength);

		self.thumbLength = thumbLength;
		self.scrollbarScale = scrollbarScale;
	},

	setEvents: function() {
		var self = this,
			axis = self.axis,
			container = self.container,
			scrollbar = self.scrollbar,
			wheelSense = self.wheelSense,
			arrowHome = self.arrowHome,
			arrowEnd = self.arrowEnd,
			thumb = self.thumb;

		if(self.wheelEnabled) {
			container[0].addEventListener('DOMMouseScroll', wheel, false);
	        container[0].addEventListener('mousewheel', wheel, false);
	        container[0].addEventListener('MozMousePixelScroll', function(event){
		            event.preventDefault();
		        }, false);
		}

		if(self.arrows) {
			arrowHome[0].addEventListener('click', function() { scroll(wheelSense) }, false);
			arrowEnd[0].addEventListener('click', function() { scroll(-wheelSense) }, false);

			arrowHome[0].addEventListener('mousedown', arrowsFast, false);
			arrowEnd[0].addEventListener('mousedown', arrowsFast, false);

			arrowHome[0].addEventListener('mouseup', function() { clearInterval(self.intervalId) }, false);
			arrowEnd[0].addEventListener('mouseup', function() { clearInterval(self.intervalId) }, false);
		}
		
        thumb.bind('mousedown', grab);

        container.on('mouseenter', updateScroll);

        function wheel(event) {
        	event.stopImmediatePropagation();
        	event.preventDefault();

        	var delta;

        	delta = (axis) ? (event.wheelDelta * wheelSense / Math.abs(event.wheelDelta)) : (event.wheelDeltaY * wheelSense / Math.abs(event.wheelDeltaY));
        	
        	scroll(delta);
        }

        function scroll(delta) {
        	self.contentScroll(delta);
        	self.thumbScroll();
        }

        function grab(event) {
        	event.preventDefault();

        	var thumbLength = self.thumbLength,
        		scrollbarSize = self.scrollbarSize,
        		startPosition,
        		dragArea = {};

        	startPosition = axis ? event.pageX : event.pageY;
        	dragArea.from = axis ? event.pageX - parseFloat(thumb.css("margin-left")) : event.pageY - parseFloat(thumb.css("margin-top"));
        	dragArea.to = dragArea.from + (scrollbarSize - thumbLength);

        	self.startPosition = startPosition;
        	self.dragArea = dragArea;

        	$(document).bind('mousemove', drag);
            $(document).bind('mouseup', release);
            thumb.bind('mouseup', release);

            $("body").addClass("unselectable");
            scrollbar.css("opacity", 1);
        }

        function drag(event) {
        	var startPosition = self.startPosition,
        		dragArea = self.dragArea,
        		scrollbarScale = self.scrollbarScale,
        		currentPosition = axis ? event.pageX : event.pageY;
				delta = startPosition - currentPosition;

			if((currentPosition > dragArea.from && delta < 0) || (currentPosition < dragArea.to && delta > 0)) {
				scroll(delta / scrollbarScale);
			}

			self.startPosition = currentPosition;
        }

        function release(event) {
        	$(document).unbind('mousemove', drag);
            $(document).unbind('mouseup', release);
            thumb.unbind('mouseup', release);

            self.startPosition = null;

            $("body").removeClass("unselectable");
            scrollbar.css("opacity", "");
        }

        function arrowsFast() {
        	var delta = $(event.target).hasClass("nav-home") ? wheelSense : -wheelSense;
        	self.intervalId = setInterval(function() { scroll(delta) }, 200);

        	$(event.target).bind('mouseup', arrowsFastStop);
        	$(document).bind('mouseup', arrowsFastStop);
        }

        function arrowsFastStop() {
        	clearInterval(self.intervalId);
        }

        function updateScroll(event) {
	    	event.stopImmediatePropagation();

	    	var contentBlock = self.contentBlock,
	    		viewLength = self.viewLength,
	    		contentLength = self.contentLength,
	    		scrollbarSize = self.scrollbarSize,
	    		newContentLength = (axis) ? contentBlock.width() : contentBlock.height(),
	    		prop = (axis) ? "width" : "height",
	    		scrollbarScale,
	    		thumbLength;

	    	if(newContentLength !== contentLength) {
	    		scrollbarScale = scrollbarSize / newContentLength;
	    		if(scrollbarScale < 1) {
	    			scrollbar.removeClass("disabled");
	    		} else {
	    			scrollbar.addClass("disabled");
	    		}

	    		self.scrollbarScale = scrollbarScale;
	    		self.contentLength = newContentLength;
	    		
	    		self.drawThumb();

	    		self.thumbScroll();
	    	}    	
		}
	},

	contentScroll: function (delta) {
    	var self = this,
    		axis = self.axis,
    		contentBlock = self.contentBlock,
    		viewLength = self.viewLength,
    		contentLength = self.contentLength,
    		prop = (axis) ? "left" : "top",
    		contentMove,
    		margin = parseFloat(contentBlock.css(prop), 10) + delta,
    		maxMargin = contentLength - viewLength;

    	margin = (margin < -maxMargin) ? -maxMargin : margin;
    	margin = (margin < 0) ? margin : 0;
    	contentMove = margin;

    	contentBlock.css(prop, contentMove);
    },

	thumbScroll: function() {
    	var self = this,
    		axis = self.axis,
    		contentBlock = self.contentBlock,
    		scrollbarSize = self.scrollbarSize,
    		thumb = self.thumb,
    		thumbLength = self.thumbLength,
    		scrollbarScale = self.scrollbarScale,
    		prop = (axis) ? "margin-left" : "margin-top",
    		contentProp = (axis) ? "left" : "top",
    		thumbMove,
    		margin = -parseFloat(contentBlock.css(contentProp), 10) * scrollbarScale,
    		maxMargin = scrollbarSize - thumbLength;

    	margin = (margin > maxMargin) ? maxMargin : margin;
    	margin = (margin > 0) ? margin : 0; 
    	thumbMove =  margin; 		
    	
    	thumb.css(prop, thumbMove);
    }	
}