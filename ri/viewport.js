Ri = function(initializer) {
    $(initializer);
};

Ri.behavior = createReactiveBehaviorModule();

Ri(function() {
    var innerWidth = 0;
    var innerHeight = 0;
    var mouseX = 0;
    var mouseY = 0;
    var mouseLeft = false;
    var mouseMiddle = false;
    var mouseRight = false;

    Ri.innerWidth = Ri.behavior(function() { return innerWidth; });
    Ri.innerHeight = Ri.behavior(function() { return innerHeight; });
    Ri.mouseX = Ri.behavior(function() { return mouseX; });
    Ri.mouseY = Ri.behavior(function() { return mouseY; });
    Ri.mouseLeft = Ri.behavior(function() { return mouseLeft; });
    Ri.mouseMiddle = Ri.behavior(function() { return mouseMiddle; });
    Ri.mouseRight = Ri.behavior(function() { return mouseRight; });

    var element = $('<div id="Ri-viewport" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;"></div>');
    $('body').append(element);
    var w = $(window);

    innerWidth = w.innerWidth();
    innerHeight = w.innerHeight();
    w.on('resize.Ri-event', function(event) {
        innerWidth = w.innerWidth();
        innerHeight = w.innerHeight();
        Ri.behavior.recompute(Ri.innerWidth);
        Ri.behavior.recompute(Ri.innerHeight);
    });

    w.on('mousemove.Ri-event', function(event) {
        mouseX = event.pageX;
        mouseY = event.pageY;
        Ri.behavior.recompute(Ri.mouseX);
        Ri.behavior.recompute(Ri.mouseY);
    });

    w.on('mousedown.Ri-event', function(event) {
        if(event.which === 1) {
            mouseLeft = true;
            Ri.behavior.recompute(Ri.mouseLeft);
        } else if(event.which === 2) {
            mouseMiddle = true;
            Ri.behavior.recompute(Ri.mouseMiddle);
        } else if(event.which === 3) {
            mouseRight = true;
            Ri.behavior.recompute(Ri.mouseRight);
        }
    });

    w.on('mouseup.Ri-event', function(event) {
        if(event.which === 1) {
            mouseLeft = false;
            Ri.behavior.recompute(Ri.mouseLeft);
        } else if(event.which === 2) {
            mouseMiddle = false;
            Ri.behavior.recompute(Ri.mouseMiddle);
        } else if(event.which === 3) {
            mouseRight = false;
            Ri.behavior.recompute(Ri.mouseRight);
        }
    });
});

