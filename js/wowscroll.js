jQuery.fn.wowscroll = function(options) {
	var WowScrollObj = inherit(WowScroll);

	WowScrollObj.init(options);
	WowScrollObj.build(this);
	WowScrollObj.drawThumb();
	WowScrollObj.setEvents();
}

function inherit(proto) {
  function F() {}
  F.prototype = proto;
  return new F;
}

var WowScroll = {
	axis: "y",
	wheel: 40,
	scroll: true,
	hide: true,

	init: function(options) {
		for (var prop in options) {
			this[prop] = options[prop];
		}
	},

	build: function(target) {
		var self = this,
			container = target,
			content = container.html(),
			contentwrap,
			scrollbar,
			axis = self.axis === "x",
			axisClass;

		axisClass = (axis) ? "horizontal" : "vertical";

		container.empty();
		contentwrap = $("<div/>")
			.addClass("wowscroll-content-wrap")
			.addClass(axisClass)
			.appendTo(container);

		contentblock = $("<div/>")
			.addClass("wowscroll-content")
			.append(content)
			.appendTo(contentwrap);

		scrollbar = $("<div/>")
			.addClass("wowscroll-scrollbar")
			.appendTo(contentwrap);

		track = $("<div/>")
			.addClass("track")
			.appendTo(scrollbar);		

		this.container = container;
		this.contentwrap = contentwrap;
		this.contentblock = contentblock;
		this.scrollbar = scrollbar;
		this.axis = axis;
	},

	drawThumb: function() {
		var self = this,
			container = self.container,
			contentwrap = self.contentwrap,
			contentblock = self.contentblock,
			scrollbar = self.scrollbar,
			track = scrollbar.find(".track"),
			axis = self.axis,
			scale,
			thumbSize;

		if(!axis) {
			scale = contentwrap.height()/contentblock.height();
			thumbSize = { "height": scale*scrollbar.height() };
		} else {
			scale = contentwrap.width()/contentblock.width();
			thumbSize = { "width": scale*scrollbar.width() };
		}

		$("<div/>")
			.addClass("thumb")
			.css(thumbSize)
			.appendTo(track);

		this.scale = scale;
	},

	setEvents: function() {
		var self = this,
			container = self.container,
			contentwrap = self.contentwrap,
			contentblock = self.contentblock,
			scrollbar = self.scrollbar,
			scale = self.scale,
			thumb = scrollbar.find(".thumb"),
			axis = self.axis;

		container[0].addEventListener( 'DOMMouseScroll', wheel, false );
        container[0].addEventListener( 'mousewheel', wheel, false );
        container[0].addEventListener( 'MozMousePixelScroll', function( event ){
            event.preventDefault();
        }, false);

        thumb.bind('mousedown', grab);
        thumb.bind('mouseup', drag);

        function grab(event) {
        	event.preventDefault();

        	var startPosition = axis ? event.pageX : event.pageY;

        	self.startPosition = startPosition;

        	$(document).bind('mousemove', drag);
            $(document).bind('mouseup', release);
            thumb.bind('mouseup', release);

            $("body").addClass("unselectable");
        }

        function drag(event) {
        	var startPosition = self.startPosition,
				delta = axis ? startPosition-event.pageX : startPosition-event.pageY;

			thumbScroll(delta/scale);
			contentScroll();

			self.startPosition = axis ? event.pageX : event.pageY;
        }

        function release(event) {
        	$(document).unbind('mousemove', drag);
            $(document).unbind('mouseup', release);
            thumb.unbind('mouseup', release);

            self.startPosition = null;

            $("body").removeClass("unselectable");
        }

        function wheel(event) {
        	event.stopImmediatePropagation();
        	event.preventDefault();

        	var delta,
        		prop,
        		thumbMove = {},
        		margin,
        		maxMargin;

        	delta = (axis) ? event.wheelDelta : event.wheelDeltaY;        	
        	
        	thumbScroll(delta)
        	contentScroll();
        }

        function thumbScroll(delta) {
        	var prop = (axis) ? "margin-left" : "margin-top";
        		thumbMove = {},
        		margin = parseInt(thumb.css(prop), 10)-delta*scale,
        		maxMargin = (axis) ? scrollbar.width()-thumb.width() : scrollbar.height()-thumb.height();

        	margin = (margin > maxMargin) ? maxMargin : margin;
        	margin = (margin > 0) ? margin : 0; 
        	thumbMove[prop] =  margin; 		
        	
        	thumb.css(thumbMove);
        }

        function contentScroll() {
        	var prop = (axis) ? "left" : "top",
        		thumbProp = (axis) ? "margin-left" : "margin-top",
        		contentMove = {},
        		margin = -parseInt(thumb.css(thumbProp), 10)/scale,
        		maxMargin = (axis) ? contentblock.width()-contentwrap.width() : contentblock.height()-contentwrap.height();

        	margin = (margin < -maxMargin) ? -maxMargin : margin;
        	margin = (margin < 0) ? margin : 0;
        	contentMove[prop] = margin;

        	contentblock.css(contentMove);
        }
	}
}