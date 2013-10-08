$(window).load(function() {
    var ulWidth = 0,
        ulElem = $(".main aside ul");

    ulElem.find('img').each(function() { 
        ulWidth += $(this).width(); 
    });
    ulElem.width(ulWidth);

    $("body").wowscroll({
        axis: "y",
        wheelSense: 20,
        arrows: true,
    });

    $(".main article").wowscroll({
        axis: "y",
        wheelSense: 20,
        arrows: true,
    });

    $(".main aside").wowscroll({
        axis: "x",
        hide: true,
        arrows: false,
    });
});