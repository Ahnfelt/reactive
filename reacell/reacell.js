
function isCell(o) {
    return typeof o === "object" && typeof o.isCell != "undefined" && o.isCell;
}

var cellIdCounter = 1;
var listenerIdCounter = 1;

function Cell() {
        var self = {
        // Private stuff
        isCell: true, // TODO make class or something
        id: cellIdCounter++,
        f: undefined,
        parameters: undefined,
        dependers: {}, // cell ID -> cell mappings
        dependees: {}, // cell ID -> cell mappings
        listeners: {}, // listener ID -> listener function mappings
        fireOnChanged: function () {
            for(var id in self.listeners) {
                self.listeners[id](self.getValue());
            }
            for (var id in self.dependers) self.dependers[id].fireOnChanged()
        },
        addDependency: function(depender) {
            self.dependers[depender.id] = depender;
        },
        removeDependency: function(depender) {
            delete self.dependers[depender.id];
        },

        // Public stuff
        getValue: function() {
            var values = map(function (v) {return isCell(v) ? v.getValue() : v}, self.parameters);
            return self.f.apply(self, values);
        },
        setValue: function () {
            var argumentsCopy = Array.prototype.slice.call(arguments);
            if (argumentsCopy.length == 0) throw "Argument needed for Cell.setValue()";
            if (argumentsCopy.length == 1) {
                self.f = function(v) {return v};
                self.parameters = argumentsCopy;
            } else {
                var f = argumentsCopy[0];
                if (typeof f != "function") throw "First argument to Cell.setValue() must be a function when several arguments are given";
                self.f = f;
                self.parameters = argumentsCopy.splice(1);
            }
            for (var id in self.dependees) {
                var oldDependee = self.dependees[id];
                oldDependee.removeDependency(self);
                if (isCell(oldDependee)) delete self.dependees[id];
            }
            for (var i = 0; i < self.parameters.length; i++) {
                var newDependee = self.parameters[i];
                if (isCell(newDependee)) {
                    newDependee.addDependency(self);
                    self.dependees[newDependee.id] = newDependee;
                }
            }
            self.fireOnChanged();
        },
        addListener: function(listener) {
            if (typeof listener != "function") throw "The provided listener argument to Cell.listen() must be a function";
            var id = listenerIdCounter;
            listenerIdCounter += 1;
            self.listeners[id] = listener;
            return id;
        },
        removeListener: function(id) {
            delete self.listeners[id];
        }
    };
    self.setValue.apply(self, arguments);
    return self;
}

Cell.logic = {
    or: function (a, b) {return a || b}
};

Cell.or = function(a, b) {return Cell(Cell.logic.or, a, b)};
Cell.plus = function(a ,b) {return Cell(function(a, b) {return a + b}, a, b)};


// Cells that updates automatically when the DOM or browser window changes.
Cell.auto = {};
Cell.auto.mousePosition = Cell({left: 0, top: 0});
Cell.auto.mousePositionLeft = Cell(function(p) {return p.left}, Cell.auto.mousePosition);
Cell.auto.mousePositionTop = Cell(function(p) {return p.top}, Cell.auto.mousePosition);
Cell.auto.viewportSize = Cell({left: 0, top: 0});

jQuery(document).ready(function(){
    $(document).mousemove(function(e){
        Cell.auto.mousePosition.setValue({left: e.pageX, top: e.pageY});
    });

    Cell.auto.viewportSize.setValue({width: $(window).width(), height: $(window).height()});
    $(window).resize(function() {
        Cell.auto.viewportSize.setValue({width: $(window).width(), height: $(window).height()});
    });

});


// Extend some jQuery DOM modification methods to accept Cell values
function reactiveVersion(jqueryMethodName) {
    var originalMethod = jQuery.fn[jqueryMethodName];
    jQuery.fn[jqueryMethodName] = function() {
        if (arguments.length == 0) {
            return originalMethod.apply(this, []);
        } else {
            var argumentsCopy = Array.prototype.slice.call(arguments);
            var last = argumentsCopy[argumentsCopy.length - 1];
            if (isCell(last)) {
                var selected = this;
                // TODO remove listener when the selected elements are removed.
                var handle = last.addListener(function (v) {
                    argumentsCopy[argumentsCopy.length - 1] = v;
                    originalMethod.apply(selected, argumentsCopy);
                });
                argumentsCopy[argumentsCopy.length - 1] = last.getValue();
                originalMethod.apply(selected, argumentsCopy);
                return selected;
            } else {
                return originalMethod.apply(this, arguments);
            }
        }
    }
}

reactiveVersion('text');
reactiveVersion('after');
reactiveVersion('append');
reactiveVersion('appendTo');
reactiveVersion('attr');
reactiveVersion('before');
reactiveVersion('css');
reactiveVersion('height');
reactiveVersion('prepend');
reactiveVersion('prependTo');
reactiveVersion('prop');
reactiveVersion('scrollLeft');
reactiveVersion('scrollTop');
reactiveVersion('text');
reactiveVersion('toggleClass');
reactiveVersion('val');
reactiveVersion('width');


// Add some jQuery DOM query methods that produce Cell values
jQuery.fn.valCell = function() {
    var target = this.first();
    var cell = Cell(target.val());
    target.change(function () {
        cell.setValue(target.val());
    });
    target.keyup(function () {
        cell.setValue(target.val());
    });
    return cell;
};

jQuery.fn.mouseOverCell = function() {
    var cell = Cell(false);
    this.mouseover(function() {
        cell.setValue(true)
    }).mouseout(function(){
            cell.setValue(false)
    });
    return cell;
};


// AUX
function map(f, array) {
    var array2 = [];
    for(var i = 0; i < array.length; i++) {
        array2.push(f(array[i]));
    }
    return array2;
}
