function createReactiveBehaviorModule() {

    var module = function(computation, thisPointer) {
        function behavior() {
            return module.get(behavior);
        }
        behavior.id = module.nextId++;
        behavior.computation = computation;
        behavior.computed = false;
        behavior.upstream = {};
        behavior.downstream = {};
        behavior.listeners = {};
        behavior.thisPointer = thisPointer != null ? thisPointer : {};
        return behavior;
    };

    module.nextId = 0;

    module.get = function(behavior) {
        if(Ri.target !== undefined) {
            behavior.downstream['behavior-' + Ri.target.id] = Ri.target;
            Ri.target.upstream['behavior-' + behavior.id] = behavior;
        }
        if(!behavior.computed) {
            module.unstream(behavior);
            var oldTarget = Ri.target;
            Ri.target = behavior;
            behavior.cached = behavior.computation.call(behavior.thisPointer);
            behavior.computed = true;
            Ri.target = oldTarget;
        }
        return behavior.cached;
    };

    module.unstream = function(behavior) {
        for(key in behavior.upstream) {
            var stream = behavior.upstream[key].downstream;
            delete stream['behavior-' + behavior.id];
        }
        behavior.upstream = {};
    }

    module.recompute = function(behavior) {
        var cached = behavior.cached;
        behavior.computed = false;
        var value = module.get(behavior);
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

    module.on = function(behavior, handler, thisPointer) {
        var key = 'listener-' + module.nextId++;
        thisPointer = thisPointer != null ? thisPointer : {};
        behavior.listeners[key] = function(value) {
            handler.call(thisPointer, value);
        };
        return {behavior: behavior, key: key};
    }

    module.bind = function(behavior, handler, thisPointer) {
        var handle = module.on(behavior, handler, thisPointer);
        handler.call(thisPointer, behavior());
        return handle;
    }

    module.off = function(handle) {
        var listeners = handle.behavior.listeners;
        delete listeners[handle.key];
    }

    module.destroy = function(behavior) {
        module.unstream(behavior);
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

