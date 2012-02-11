// Creates a constructor for behaviors and a range of helper functions.
// It's wrapped in this way to make it easy to include in other libraries.
// See ri/viewport.js and ri/index.html for examples.
function createReactiveBehaviorModule() {

    // PRIVATE
    
    var nextId = 0;

    function read(behavior) {
        if(Ri.target !== undefined) {
            behavior.downstream['behavior-' + Ri.target.id] = Ri.target;
            Ri.target.upstream['behavior-' + behavior.id] = behavior;
        }
        if(!behavior.computed) {
            unstream(behavior);
            var oldTarget = Ri.target;
            Ri.target = behavior;
            behavior.cached = behavior.computation.call(behavior.thisPointer);
            behavior.computed = true;
            Ri.target = oldTarget;
        }
        return behavior.cached;
    };

    function unstream(behavior) {
        for(key in behavior.upstream) {
            var stream = behavior.upstream[key].downstream;
            delete stream['behavior-' + behavior.id];
        }
        behavior.upstream = {};
    }

    // PUBLIC
    
    // This constructs a behavior using the given computation.
    // If any of the behaviors read during the computation changes at a
    // later time, the value of this behavior will be updated 
    // accordingly by re-running the computation.
    // A value is considered to have changed precisely when the new value 
    // N and the old value O makes this expression false: N === O
    // Note that a behavior won't compute its value until the first time
    // the value is read. It's thus possible to create behaviors from
    // other behaviors that don't have a meaningful value yet.
    // If the thisPointer is specified, the special JavaScript 'this' 
    // variable will have that value whenever the computation is called.
    // If it's undefined or null, then a new empty object will be created,
    // which is then used in every call to the computation instead.
    function module(computation, thisPointer) {
        function behavior() {
            return read(behavior);
        }
        behavior.id = nextId++;
        behavior.computation = computation;
        behavior.computed = false;
        behavior.upstream = {};
        behavior.downstream = {};
        behavior.listeners = {};
        behavior.thisPointer = thisPointer != null ? thisPointer : {};
        return behavior;
    };
    
    // Forces a recomputation of the specified behavior.
    module.recompute = function(behavior) {
        var cached = behavior.cached;
        behavior.computed = false;
        var value = read(behavior);
        if(cached !== value) {
            for(streamKey in behavior.downstream) {
                behavior.downstream[streamKey].computed = false;
            }
            for(streamKey in behavior.downstream) {
                module.recompute(behavior.downstream[streamKey]);
            }
            for(listenerKey in behavior.listeners) {
                behavior.listeners[listenerKey](value);
            }
        }
    };

    // Adds an event handler that is executed every time the value
    // of the behavior changes. A handle is returned that will 
    // remove the event if passed to .off()
    module.on = function(behavior, handler, thisPointer) {
        var key = 'listener-' + nextId++;
        thisPointer = thisPointer != null ? thisPointer : {};
        behavior.listeners[key] = function(value) {
            handler.call(thisPointer, value);
        };
        return {behavior: behavior, key: key};
    }

    // Similar to .on(), except it also immediately executes the
    // handler with the current value of the behavior.
    module.bind = function(behavior, handler, thisPointer) {
        var handle = module.on(behavior, handler, thisPointer);
        handler.call(thisPointer, behavior());
        return handle;
    }

    // Removes an event handler given a handle to it.
    module.off = function(handle) {
        var listeners = handle.behavior.listeners;
        delete listeners[handle.key];
    }
    
    // Removes all ties from and to other behaviors. If this is
    // not called, this behavior will be kept alive in memory
    // by the behaviors it depends on, even if there's no other
    // way to ever reach the behavior again.
    // Note that if JavaScript gets weak references sometime
    // in the future, this method will no longer be required.
    module.destroy = function(behavior) {
        unstream(behavior);
        delete behavior.id;
        delete behavior.computation;
        delete behavior.computed;
        delete behavior.upstream;
        delete behavior.downstream;
        delete behavior.listeners;
        delete behavior.thisPointer;
    }
    
    return module;
}

