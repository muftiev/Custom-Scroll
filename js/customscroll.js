var CustomScroll = {
    axis: "y",
    wheelSense: 120,
    wheelEnabled: true,
    hide: true,
    scrollbarSize: "auto",
    arrows: true,

    init: function(options) {
        for (var prop in options) {
            if (options.hasOwnProperty(prop)) {
                this[prop] = options[prop];
            }
        }

        var wheelSense = this.wheelSense;

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
            axisClass;

        axisClass = (axis) ? "horizontal" : "vertical";
        if(container.selector === "body") {
            if(axis) {
                container.css("width", window.innerWidth);
            } else {
                container.css("height", window.innerHeight);
            }
        }

        container.addClass("customscroll").empty();
        contentWrap = $("<div/>")
            .addClass("customscroll-content-wrap")
            .addClass(axisClass)
            .appendTo(container);

        contentBlock = $("<div/>")
            .addClass("customscroll-content")
            .append(content)
            .appendTo(contentWrap);

        scrollbar = $("<div/>")
            .addClass("customscroll-scrollbar")
            .appendTo(contentWrap);

        if(self.hide) {
            scrollbar.addClass("hide");
        }

        self.contentBlock = contentBlock;
        self.scrollbar = scrollbar;
        self.viewLength = (axis) ? contentWrap.width() : contentWrap.height();

        self.setScrollbarSize();

        if(arrows) {
            if(axis) {
                scrollbar.css("left", 5);
            } else {
                scrollbar.css("top", 5);
            }

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

        if(touchEvents && $(".customscroll-tap").length === 0) {
            $("<img/>")
                .attr({"src": "img/tap.png", "alt": "tap"})
                .addClass("customscroll-tap")
                .appendTo("body");
        }

        self.container = container;
        self.contentWrap = contentWrap;
        self.track = track;
        self.thumb = thumb;
    },

    setScrollbarSize: function(isUpdate) {
        var self = this,
            scrollbar = self.scrollbar,
            scrollbarSize = self.scrollbarSize,
            viewLength = self.viewLength,
            arrows = self.arrows,
            axis = self.axis;

        scrollbarSize = (!isNaN(parseFloat(scrollbarSize)) && isFinite(scrollbarSize) && (scrollbarSize < viewLength)) ? scrollbarSize : "auto";    
        if(scrollbarSize !== "auto" && !isUpdate) {
            scrollbarSize = (scrollbarSize >= 20) ? scrollbarSize : 20;        // min scrollbar lenth 20px
            scrollbarSize = (arrows && (scrollbarSize > (viewLength - 10))) ? viewLength - 10 : scrollbarSize;    // 5px for each arrow button
        } else {
            scrollbarSize = (arrows) ? viewLength - 10 : viewLength;
        }
        if(axis) {
            scrollbar.css("width", scrollbarSize);
        } else {
            scrollbar.css("height", scrollbarSize);
        }

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
        if(thumbLength < 5) {    // min thumb length 5px
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
            container[0].addEventListener('wheel', wheel, false);        // for Firefox
            container[0].addEventListener('mousewheel', wheel, false);
        }

        if(self.arrows) {
            arrowHome[0].addEventListener('click', function() { scroll(wheelSense); }, false);
            arrowEnd[0].addEventListener('click', function() { scroll(-wheelSense); }, false);

            arrowHome[0].addEventListener('mousedown', arrowsFast, false);    // scrolling until mouseup
            arrowEnd[0].addEventListener('mousedown', arrowsFast, false);

            arrowHome[0].addEventListener('mouseup', function() { clearInterval(self.intervalId); }, false);
            arrowEnd[0].addEventListener('mouseup', function() { clearInterval(self.intervalId); }, false);
        }

        if(touchEvents) {
            self.dragTouchMode = false;        // drag mode flag
            self.touchStartId = null;

            container[0].ontouchstart = function(event) { 
                if(event.touches.length == 1) {        // for more than 1 touches event - native behavior
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    touch(event);
                }
            };
        } else {
            thumb.bind('mousedown', grab);
        }

        container.on('mouseenter', updateScroll);

        if(container.selector === "body") {        // for body scroll more update cases
            $(window).resize(updateBodyScroll);
            document.addEventListener('gestureend', updateBodyScroll);
            document.addEventListener('orientationchange', updateBodyScroll);
        }

        /**
        * Mousewheel delta calculation
        */
        function wheel(event) {
            event.stopPropagation();
            event.preventDefault();

            var delta;

            if(!axis) {
                if((typeof event.wheelDeltaY === "number") && isFinite(event.wheelDeltaY)) {
                    delta = event.wheelDeltaY * wheelSense / Math.abs(event.wheelDeltaY);
                } else if((typeof event.deltaY === "number") && isFinite(event.deltaY)) {
                    delta = -event.deltaY * wheelSense / Math.abs(event.deltaY);    // for Firefox
                } else {
                    delta = event.wheelDelta * wheelSense / Math.abs(event.wheelDelta);
                }
            } else {
                if((typeof event.wheelDelta === "number") && isFinite(event.wheelDelta)) {
                    delta = event.wheelDelta * wheelSense / Math.abs(event.wheelDelta);
                } else if((typeof event.deltaX === "number") && isFinite(event.deltaX) && event.deltaX !== 0) {
                    delta = -event.deltaX * wheelSense / Math.abs(event.deltaX);    // for Firefox
                } else {
                    delta = -event.deltaY * wheelSense / Math.abs(event.deltaY);
                }
            }

            scroll(delta);
        }

        /**
        * Content and thumb scrolling function
        */
        function scroll(delta) {
            self.contentScroll(delta);
            self.thumbScroll();
        }

        /**
        * Grab the thumb by mouse event handler
        */
        function grab(event) {
            var thumbLength = self.thumbLength,
                scrollbarSize = self.scrollbarSize,
                startPosition,
                dragArea = {};

            event.preventDefault();

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

        /**
        * Dragging thumb event handler
        */
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

        /**
        * Touch event handler
        */
        function touch(event) {
            self.startPosition = axis ? event.pageX : event.pageY;
            self.touchStartId = setTimeout(function() {        // long touch detection
                $(".customscroll-tap").css({"left": event.pageX-25, "top": event.pageY-25}).show(0);
                $(".customscroll-tap").animate({    // long touch animation
                    width: 100,
                    left: event.pageX-50,
                    top: event.pageY-50
                }, 2000,
                function() {
                    $(this).hide(0).css("width", 50);
                    self.dragTouchMode = true;    // touch dragging mode enabled
                });

            }, 1000);

            document.ontouchmove = function(event) {
                event.stopImmediatePropagation();
                if(self.dragTouchMode) {    // touch dragging mode case
                    dragTouch(event);
                } else {
                    clearTimeout(self.touchStartId);    // prevent touch dragging mode enabling
                    $(".customscroll-tap").stop().hide(0).css("width", 50);
                    dragThumb(event);
                }
                self.touchStartId = null;
            };
            document.ontouchend = release;

            $("body").addClass("unselectable");
            scrollbar.css("opacity", 1);
        }

        /**
        * Touch dragging mode
        */
        function dragTouch(event) {
            var startPosition = self.startPosition,
                currentPosition = axis ? event.pageX : event.pageY,
                delta = (startPosition - currentPosition > 0) ? wheelSense : -wheelSense,
                dragDirection = delta < 0;

            if(Math.abs(startPosition - currentPosition) > 20) {
                if(typeof self.intervalId !== "number") {
                    self.intervalId = setInterval(function() { scroll(delta); }, 200);
                    self.dragDirection = dragDirection; 
                } else if(self.dragDirection !== dragDirection) {
                    clearInterval(self.intervalId);
                    self.intervalId = setInterval(function() { scroll(delta); }, 200);
                    self.dragDirection = dragDirection; 
                }
                self.startPosition = currentPosition;
            }
        }

        /**
        * Stop scrolling
        */
        function release() {
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

            $(".customscroll-tap").stop().hide(0).css("width", 50);
            $("body").removeClass("unselectable");
            scrollbar.css("opacity", "");
        }

        /**
        * Arrow buttons mousedown scrolling
        */
        function arrowsFast(event) {
            var delta = $(event.target).hasClass("nav-home") ? wheelSense : -wheelSense;

            self.intervalId = setInterval(function() { scroll(delta); }, 200);

            $(event.target).bind('mouseup', arrowsFastStop);
            $(document).bind('mouseup', arrowsFastStop);
        }

        /**
        * Stop arrow buttons mousedown scrolling
        */
        function arrowsFastStop() {
            clearInterval(self.intervalId);

            $(event.target).unbind('mouseup', arrowsFastStop);
            $(document).unbind('mouseup', arrowsFastStop);
        }

        /**
        * Scroll recalculations
        */
        function updateScroll(event) {
            event.stopImmediatePropagation();

            var contentBlock = self.contentBlock,
                contentWrap = self.contentWrap,
                newViewLength = (axis) ? contentWrap.width() : contentWrap.height(),
                contentLength = self.contentLength,
                newContentLength = (axis) ? contentBlock.width() : contentBlock.height(),
                scrollbarScale;

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

        /**
        * Body scroll recalculations
        */
        function updateBodyScroll() {
            var contentBlock = self.contentBlock,
                contentWrap = self.contentWrap,
                viewLength = (axis) ? contentWrap.width() : contentWrap.height(),
                contentLength = (axis) ? contentBlock.width() : contentBlock.height(),
                scrollbarScale;

            if(axis) {
                container.css("width", window.innerWidth);
            } else {
                container.css("height", window.innerHeight);
            }

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

    /**
    * Content scrolling function
    */
    contentScroll: function(delta) {
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

    /**
    * Thumb scrolling function
    */
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
        thumbMove = margin;
        
        thumb.css(prop, thumbMove);
    }
};

jQuery.fn.customscroll = function(options) {
    var ua = navigator.userAgent.toLowerCase(),
        isAndroid = ua.indexOf("android") > -1,
        CustomScrollObj = inherit(CustomScroll);

    if(isAndroid) return false;
    if(this.hasClass("customscroll")) return false;

    CustomScrollObj.init(options);
    CustomScrollObj.build(this);
    CustomScrollObj.drawThumb();
    CustomScrollObj.setEvents();

    function inherit(proto) {
        function F() {}
        F.prototype = proto;
        return new F();
    }
};