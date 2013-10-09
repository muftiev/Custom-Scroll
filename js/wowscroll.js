jQuery.fn.wowscroll = function(options) {
	var ua = navigator.userAgent.toLowerCase(),
		isAndroid = ua.indexOf("android") > -1,
		WowScrollObj = inherit(WowScroll);

	if(isAndroid) return false;

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
		this.touchEvents = 'ontouchstart' in document.documentElement;
		this.arrows = (this.touchEvents) ? false : this.arrows;			
	},

	build: function(target) {
		var self = this,
			touchEvents = self.touchEvents,
			container = target,
			content = container.html(),
			contentWrap,
			contentBlock,
			scrollbar,
			track,
			thumb,
			axis = self.axis,
			arrows = self.arrows,
			arrowHome,
			arrowEnd,
			axisClass,
			viewLength;

		axisClass = (axis) ? "horizontal" : "vertical";		
		if(container.selector === "body") {
			(axis) ? container.css("width", window.innerWidth) : container.css("height", window.innerHeight);
		}

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

		self.contentBlock = contentBlock;		
		self.scrollbar = scrollbar;
		self.viewLength = (axis) ? contentWrap.width() : contentWrap.height();

		self.setScrollbarSize();		

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

		if(self.touchEvents && $("body>.wowscroll-tap").length === 0) {
			$("<img/>")
				.attr({"src": "img/tap.png", "alt": "tap"})
				.addClass("wowscroll-tap")
				.appendTo("body");
		}

		self.container = container;
		self.contentWrap = contentWrap;
		self.track = track;
		self.thumb = thumb;			
	},

	setScrollbarSize: function(update) {
		var self = this,
			scrollbar = self.scrollbar,			
			scrollbarSize = self.scrollbarSize,
			viewLength = self.viewLength,
			arrows = self.arrows,
			axis = self.axis;

		scrollbarSize = (!isNaN(parseFloat(scrollbarSize)) && isFinite(scrollbarSize) && (scrollbarSize < viewLength)) ? scrollbarSize : "auto";	
		if(scrollbarSize !== "auto" && !update) {
			scrollbarSize = (scrollbarSize >= 20) ? scrollbarSize : 20;
			scrollbarSize = (arrows && (scrollbarSize > (viewLength - 10))) ? viewLength - 10 : scrollbarSize;					
		} else {
			scrollbarSize = (arrows) ? viewLength - 10 : viewLength;
		}
		(axis) ? scrollbar.css("width", scrollbarSize) : scrollbar.css("height", scrollbarSize);

		self.scrollbarSize = scrollbarSize;
		self.contentLength = (axis) ? self.contentBlock.width() : self.contentBlock.height();
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
			thumb = self.thumb,
			touchEvents = self.touchEvents;

		if(self.wheelEnabled) {
			container[0].addEventListener('wheel', wheel, false);
	        container[0].addEventListener('mousewheel', wheel, false);
		}

		if(self.arrows) {
			arrowHome[0].addEventListener('click', function() { scroll(wheelSense) }, false);
			arrowEnd[0].addEventListener('click', function() { scroll(-wheelSense) }, false);

			arrowHome[0].addEventListener('mousedown', arrowsFast, false);
			arrowEnd[0].addEventListener('mousedown', arrowsFast, false);

			arrowHome[0].addEventListener('mouseup', function() { clearInterval(self.intervalId) }, false);
			arrowEnd[0].addEventListener('mouseup', function() { clearInterval(self.intervalId) }, false);
		}
		
		if(touchEvents) {
			self.dragTouchMode = false;
			self.touchStartId = null;

			container[0].ontouchstart = function(event) { 
				if(event.touches.length == 1) {
                	event.preventDefault();
                	event.stopImmediatePropagation();
                    touch(event);
                } else {
                	return true;
                }
            }
		} else {
			thumb.bind('mousedown', grab);
		}        

        container.on('mouseenter', updateScroll);

        if(container.selector === "body") {
			$(window).resize(updateBodyScroll);
			document.addEventListener('gestureend', updateBodyScroll);
			document.addEventListener('orientationchange', updateBodyScroll);
		}

        function wheel(event) {
        	event.stopPropagation();
        	event.preventDefault();

        	var delta;

        	if(!axis) {
        		if((typeof event.wheelDeltaY === 'number') && isFinite(event.wheelDeltaY)) {
        			delta = event.wheelDeltaY * wheelSense / Math.abs(event.wheelDeltaY);
        		} else if((typeof event.deltaY === 'number') && isFinite(event.deltaY)) {
        			delta = -event.deltaY * wheelSense / Math.abs(event.deltaY);
        		} else {
        			delta = event.wheelDelta * wheelSense / Math.abs(event.wheelDelta);
        		}
        	} else {
        		if((typeof event.wheelDelta === 'number') && isFinite(event.wheelDelta)) {
        			delta = event.wheelDelta * wheelSense / Math.abs(event.wheelDelta);
        		} else if((typeof event.deltaX === 'number') && isFinite(event.deltaX) && event.deltaX !== 0) {
        			delta = -event.deltaX * wheelSense / Math.abs(event.deltaX);
        		} else {
        			delta = -event.deltaY * wheelSense / Math.abs(event.deltaY);
        		}
        	}

        	scroll(delta);
        }

        function scroll(delta) {
        	self.contentScroll(delta);
        	self.thumbScroll();
        }

        function grab(event) {
        	var thumbLength = self.thumbLength,
        		scrollbarSize = self.scrollbarSize,
        		startPosition,
        		dragArea = {};

        	startPosition = axis ? event.pageX : event.pageY;
        	dragArea.from = axis ? event.pageX - parseFloat(thumb.css("margin-left")) : event.pageY - parseFloat(thumb.css("margin-top"));
        	dragArea.to = dragArea.from + (scrollbarSize - thumbLength);

        	self.startPosition = startPosition;
        	self.dragArea = dragArea;

        	$(document).bind('mousemove', dragThumb);
            $(document).bind('mouseup', release);
            thumb.bind('mouseup', release);

            $("body").addClass("unselectable");
            scrollbar.css("opacity", 1);
        }

        function dragThumb(event) {
        	var startPosition = self.startPosition,
        		dragArea = self.dragArea,
        		scrollbarScale = self.scrollbarScale,
        		currentPosition = axis ? event.pageX : event.pageY,
				delta = startPosition - currentPosition;

			if(touchEvents) {
				scroll(-delta);
			} else {
				if((currentPosition > dragArea.from && delta < 0) || (currentPosition < dragArea.to && delta > 0)) {
					scroll(delta / scrollbarScale);
				}
			}			

			self.startPosition = currentPosition;
        }

        function touch(event) {
        	self.startPosition = axis ? event.pageX : event.pageY;        	
        	self.touchStartId = setTimeout(function() {
        		$("body>.wowscroll-tap").css({"left": event.pageX-25, "top": event.pageY-25}).show(0);
        		$("body>.wowscroll-tap").animate({
        			width: 100,
        			left: event.pageX-50,
        			top: event.pageY-50
        		}, 2000,
        		function() {
        			$(this).hide(0).css("width", 50);
        			self.dragTouchMode = true;
        		});        		
        		
        	}, 1000);
        	
    		document.ontouchmove = function(event) {
    			event.stopImmediatePropagation();
    			if(self.dragTouchMode) {
    				dragTouch(event);
    			} else {
    				clearTimeout(self.touchStartId);
    				$("body>.wowscroll-tap").stop().hide(0).css("width", 50);
    				dragThumb(event)
    			}
    			self.touchStartId = null;
            };
            document.ontouchend = release;  

            $("body").addClass("unselectable");
            scrollbar.css("opacity", 1);         		
        	       	
        }

        function dragTouch(event) {
        	var startPosition = self.startPosition,
        		currentPosition = axis ? event.pageX : event.pageY,
				delta = (startPosition - currentPosition > 0) ? wheelSense : -wheelSense,
				dragDirection = delta < 0;

			if(Math.abs(startPosition - currentPosition) > 20) {
				if(typeof self.intervalId !== "number") {
					self.intervalId = setInterval(function() { scroll(delta) }, 200);
					self.dragDirection = dragDirection; 
				} else if(self.dragDirection !== dragDirection) {
					clearInterval(self.intervalId);
					self.intervalId = setInterval(function() { scroll(delta) }, 200);
					self.dragDirection = dragDirection; 
				}
				self.startPosition = currentPosition;				
			}			

			
        }

        function release(event) {
        	$(document).unbind('mousemove', dragThumb);
            $(document).unbind('mouseup', release);
            thumb.unbind('mouseup', release);
            document.ontouchmove = document.ontouchend = null;

            clearInterval(self.intervalId);
            self.startPosition = null;
            self.intervalId = null;
            self.dragTouchMode = false;
            if(self.touchStartId !== null) {
            	clearTimeout(self.touchStartId);
            }

            $("body>.wowscroll-tap").stop().hide(0).css("width", 50);
            $("body").removeClass("unselectable");
            scrollbar.css("opacity", "");
        }

        function arrowsFast(event) {
        	var delta = $(event.target).hasClass("nav-home") ? wheelSense : -wheelSense;

        	self.intervalId = setInterval(function() { scroll(delta) }, 200);

        	$(event.target).bind('mouseup', arrowsFastStop);
        	$(document).bind('mouseup', arrowsFastStop);
        }

        function arrowsFastStop() {
        	clearInterval(self.intervalId);

        	$(event.target).unbind('mouseup', arrowsFastStop);
        	$(document).unbind('mouseup', arrowsFastStop);
        }

        function updateScroll(event) {
	    	event.stopImmediatePropagation();

	    	var contentBlock = self.contentBlock,
	    		contentWrap = self.contentWrap,
	    		newViewLength = (axis) ? contentWrap.width() : contentWrap.height(),
	    		contentLength = self.contentLength,
	    		newContentLength = (axis) ? contentBlock.width() : contentBlock.height(),
	    		prop = (axis) ? "width" : "height",
	    		scrollbarScale,
	    		thumbLength;

	    	if((newViewLength !== self.viewLength) || (newContentLength !== contentLength)) {
	    		self.viewLength = newViewLength;
	    		self.setScrollbarSize(true);

	    		scrollbarScale = newViewLength / newContentLength;
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

		function updateBodyScroll() {
			var contentBlock = self.contentBlock,
	    		contentWrap = self.contentWrap,
	    		viewLength = (axis) ? contentWrap.width() : contentWrap.height(),
	    		contentLength = (axis) ? contentBlock.width() : contentBlock.height(),
	    		prop = (axis) ? "width" : "height",
	    		scrollbarScale,
	    		thumbLength;

	    	(axis) ? container.css("width", window.innerWidth) : container.css("height", window.innerHeight);

	    	self.viewLength = viewLength;
	    	self.setScrollbarSize(true);
	    	
    		scrollbarScale = viewLength / contentLength;
    		if(scrollbarScale < 1) {
    			scrollbar.removeClass("disabled");
    		} else {
    			scrollbar.addClass("disabled");
    		}

    		self.scrollbarScale = scrollbarScale;
    		self.contentLength = contentLength;
    		
    		self.drawThumb();

    		self.thumbScroll();
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