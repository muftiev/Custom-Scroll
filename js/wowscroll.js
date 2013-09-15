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
	scrollbarScale: 1,

	init: function(options) {
		for (var prop in options) {
			this[prop] = options[prop];
		}
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
			axis = self.axis === "x",
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
			scrollbarSize = (scrollbarSize >= 15) ? scrollbarSize : 15;
			(axis) ? scrollbar.css("width", scrollbarSize) : scrollbar.css("height", scrollbarSize);
			self.scrollbarScale = scrollbarSize / viewLength;
			self.scrollbarSize = scrollbarSize;
		} else {
			self.scrollbarSize = viewLength;
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
		self.axis = axis;
		self.contentLength = (axis) ? contentBlock.width() : contentBlock.height();
		self.viewLength = viewLength;
		self.contentScale = self.viewLength / self.contentLength;
		
	},

	drawThumb: function() {
		var self = this,
			axis = self.axis,
			scrollbarSize = self.scrollbarSize,
			thumbLength,
			prop = (axis) ? "width" : "height";

		thumbLength = self.contentScale * scrollbarSize;
		if(thumbLength < 5) {
			thumbLength = 5;						
			contentScale = (scrollbarSize - thumbLength) / (self.contentLength - self.viewLength);
			self.contentScale = contentScale;
		}

		self.thumb.css(prop, thumbLength);

		self.thumbLength = thumbLength;
	},

	setEvents: function() {
		var self = this,
			axis = self.axis,
			container = self.container,
			scrollbar = self.scrollbar,
			thumb = self.thumb;

		if(self.wheelEnabled) {
			container[0].addEventListener('DOMMouseScroll', wheel, false);
	        container[0].addEventListener('mousewheel', wheel, false);
	        container[0].addEventListener('MozMousePixelScroll', function(event){
		            event.preventDefault();
		        }, false);
		}
		
        thumb.bind('mousedown', grab);
        thumb.bind('mouseup', drag);

        container.on('mouseenter', updateScroll);

        function wheel(event) {
        	event.stopImmediatePropagation();
        	event.preventDefault();

        	var delta,
        		wheelSense = self.wheelSense;

        	delta = (axis) ? (event.wheelDelta * wheelSense / Math.abs(event.wheelDelta)) : (event.wheelDeltaY * wheelSense / Math.abs(event.wheelDeltaY));
        	
        	self.contentScroll(delta);
        	self.thumbScroll();
        }

        function grab(event) {
        	event.preventDefault();

        	var startPosition = axis ? event.pageX : event.pageY;

        	self.startPosition = startPosition;

        	$(document).bind('mousemove', drag);
            $(document).bind('mouseup', release);
            thumb.bind('mouseup', release);

            $("body").addClass("unselectable");
            scrollbar.css("opacity", 1);
        }

        function drag(event) {
        	var startPosition = self.startPosition,
        		contentScale = self.contentScale,
        		scrollbarScale = self.scrollbarScale,
				delta = axis ? startPosition - event.pageX : startPosition - event.pageY;

			self.contentScroll(delta / (contentScale * scrollbarScale));
			self.thumbScroll();

			self.startPosition = axis ? event.pageX : event.pageY;
        }

        function release(event) {
        	$(document).unbind('mousemove', drag);
            $(document).unbind('mouseup', release);
            thumb.unbind('mouseup', release);

            self.startPosition = null;

            $("body").removeClass("unselectable");
            scrollbar.css("opacity", "");
        }

        function updateScroll(event) {
	    	event.stopImmediatePropagation();

	    	var contentBlock = self.contentBlock,
	    		viewLength = self.viewLength,
	    		contentLength = self.contentLength,
	    		scrollbarSize = self.scrollbarSize,
	    		newContentLength = (axis) ? contentBlock.width() : contentBlock.height(),
	    		prop = (axis) ? "width" : "height",
	    		contentScale,
	    		thumbLength;

	    	if(newContentLength !== contentLength) {
	    		contentScale = viewLength / newContentLength;
	    		if(contentScale < 1) {
	    			scrollbar.removeClass("disabled");
	    		} else {
	    			scrollbar.addClass("disabled");
	    		}

	    		self.contentScale = contentScale;
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
    		contentScale = self.contentScale,
    		prop = (axis) ? "margin-left" : "margin-top",
    		contentProp = (axis) ? "left" : "top",
    		thumbMove,
    		margin = -parseFloat(contentBlock.css(contentProp), 10)  * contentScale * scrollbarScale,
    		maxMargin = scrollbarSize - thumbLength;

    	margin = (margin > maxMargin) ? maxMargin : margin;
    	margin = (margin > 0) ? margin : 0; 
    	thumbMove =  margin; 		
    	
    	thumb.css(prop, thumbMove);
    }	
}