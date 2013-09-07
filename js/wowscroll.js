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
	size: "auto",
	thumbsize: "auto",
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
			.appendTo(container);

		contentblock = $("<div/>")
			.addClass("wowscroll-content")
			.append(content)
			.appendTo(contentwrap);

		scrollbar = $("<div/>")
			.addClass("wowscroll-scrollbar")
			.addClass(axisClass)
			.appendTo(contentwrap);

		track = $("<div/>")
			.addClass("track")
			.appendTo(scrollbar);		

		this.container = container;
		this.contentwrap = contentwrap;
		this.contentblock = contentblock;
		this.scrollbar = scrollbar;
	},

	drawThumb: function() {
		var self = this,
			container = self.container,
			contentwrap = self.contentwrap,
			contentblock = self.contentblock,
			scrollbar = self.scrollbar,
			track = scrollbar.find(".track"),
			axis = self.axis === "x",
			scale,
			thumbSize;

		if(!axis) {
			scale = contentwrap.height()/contentblock.height();
			thumbSize = { "height": scale*contentwrap.height() ^ 0 };
		} else {
			scale = contentwrap.width()/contentblock.width();
			thumbSize = { "width": scale*contentwrap.width() ^ 0 };
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
			axis = self.axis === "x";

		container[0].addEventListener( 'DOMMouseScroll', wheel, false );
        container[0].addEventListener( 'mousewheel', wheel, false );
        container[0].addEventListener( 'MozMousePixelScroll', function( event ){
            event.preventDefault();
        }, false);

        function wheel(event){
        	event.stopImmediatePropagation();
        	event.preventDefault();
        	var delta,
        		prop,
        		thumbMove = {},
        		margin,
        		maxMargin;

        	delta = (axis) ? event.wheelDeltaX : event.wheelDeltaY;
        	prop = (axis) ? "margin-left" : "margin-top";
        	margin = parseInt(thumb.css(prop));
			maxMargin = (axis) ? scrollbar.width()-thumb.width() : scrollbar.height()-thumb.height();

        	thumbMove[prop] = (-delta*scale^0)+margin;
    		thumbMove[prop] = (thumbMove[prop] > maxMargin) ? maxMargin : thumbMove[prop];
        	thumbMove[prop] = (thumbMove[prop] > 0) ? thumbMove[prop] : 0;        		
        	
        	thumb.css(thumbMove);

        	contentScroll(delta);
        }

        function contentScroll(delta) {
        	var prop = (axis) ? "left" : "top",
        		contentMove = {},
        		margin = parseInt(contentblock.css(prop))+delta,
        		maxMargin = (axis) ? contentblock.width()-contentwrap.width() : contentblock.height()-contentwrap.height();

        	margin = (margin < -maxMargin) ? -maxMargin : margin;
        	margin = (margin < 0) ? margin : 0;
        	contentMove[prop] = margin;

        	contentblock.css(contentMove);
        }
	}
}