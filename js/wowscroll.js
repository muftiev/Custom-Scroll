jQuery.fn.wowscroll = function(options) {
	var WowScrollObj = inherit(WowScroll);

	WowScrollObj.init(options);
	WowScrollObj.build(this);
	WowScrollObj.draw_thumb();
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
	sizethumb: "auto",
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
			axis_class;

		axis_class = (axis) ? "horizontal" : "vertical";

		container.empty();
		contentwrap = $("<div/>")
			.addClass("wowscroll-content-wrap")
			.appendTo(container);

		$("<div/>")
			.addClass("wowscroll-content")
			.append(content)
			.appendTo(contentwrap);

		scrollbar = $("<div/>")
			.addClass("wowscroll-scrollbar")
			.addClass(axis_class)
			.appendTo(contentwrap);

		track = $("<div/>")
			.addClass("track")
			.appendTo(scrollbar);		

		this.container = container;
		this.contentwrap = contentwrap;
		this.scrollbar = scrollbar;
	},

	draw_thumb: function() {
		var self = this,
			container = this.container,
			contentwrap = this.contentwrap,
			scrollbar = this.scrollbar,
			track = scrollbar.find(".track"),
			axis = self.axis === "x",
			thumb_size;

		if(!axis) {
			thumb_size = { "height": Math.pow(contentwrap.height(),2)/contentwrap.find(".wowscroll-content").height() ^ 0 };
		} else {
			thumb_size = { "width": Math.pow(contentwrap.width(),2)/contentwrap.find(".wowscroll-content").width() ^ 0 };
		}

		$("<div/>")
			.addClass("thumb")
			.css(thumb_size)
			.appendTo(track);
	}
}