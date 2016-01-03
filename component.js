;(function(factory) {
    // amd
    if (window.define && window.define.amd) {
        define('', ['underscore', 'jquery'], function(_, $) {
            factory(_, $);
        });
    } else {
        window.createComponent = factory(window._, window.jQuery);
    }
})(function(_, $) {
    return function(prototype) {
        var Events = {
            on: function(name, callback, context) {
                if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
                this._events || (this._events = {});
                var events = this._events[name] || (this._events[name] = []);
                events.push({
                    callback: callback,
                    context: context,
                    ctx: context || this
                });
                return this;
            },
            once: function(name, callback, context) {
                if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
                var self = this;
                var once = _.once(function() {
                    self.off(name, once);
                    callback.apply(this, arguments);
                });
                once._callback = callback;
                return this.on(name, once, context);
            },
            off: function(name, callback, context) {
                var retain, ev, events, names, i, l, j, k;
                if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
                if (!name && !callback && !context) {
                    this._events = void 0;
                    return this;
                }
                names = name ? [name] : _.keys(this._events);
                for (i = 0, l = names.length; i < l; i++) {
                    name = names[i];
                    if (events = this._events[name]) {
                        this._events[name] = retain = [];
                        if (callback || context) {
                            for (j = 0, k = events.length; j < k; j++) {
                                ev = events[j];
                                if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                                    (context && context !== ev.context)) {
                                    retain.push(ev);
                                }
                            }
                        }
                        if (!retain.length) delete this._events[name];
                    }
                }

                return this;
            },
            trigger: function(name) {
                if (!this._events) return this;
                var args = slice.call(arguments, 1);
                if (!eventsApi(this, 'trigger', name, args)) return this;
                var events = this._events[name];
                var allEvents = this._events.all;
                if (events) triggerEvents(events, args);
                if (allEvents) triggerEvents(allEvents, arguments);
                return this;
            },
            stopListening: function(obj, name, callback) {
                var listeningTo = this._listeningTo;
                if (!listeningTo) return this;
                var remove = !name && !callback;
                if (!callback && typeof name === 'object') callback = this;
                if (obj)(listeningTo = {})[obj._listenId] = obj;
                for (var id in listeningTo) {
                    obj = listeningTo[id];
                    obj.off(name, callback, this);
                    if (remove || _.isEmpty(obj._events)) delete this._listeningTo[id];
                }
                return this;
            }
        };

        var eventSplitter = /\s+/;

        var eventsApi = function(obj, action, name, rest) {
            if (!name) return true;

            // Handle event maps.
            if (typeof name === 'object') {
                for (var key in name) {
                    obj[action].apply(obj, [key, name[key]].concat(rest));
                }
                return false;
            }

            // Handle space separated event names.
            if (eventSplitter.test(name)) {
                var names = name.split(eventSplitter);
                for (var i = 0, l = names.length; i < l; i++) {
                    obj[action].apply(obj, [names[i]].concat(rest));
                }
                return false;
            }

            return true;
        };

        var triggerEvents = function(events, args) {
            var ev, i = -1,
                l = events.length,
                a1 = args[0],
                a2 = args[1],
                a3 = args[2];
            switch (args.length) {
                case 0:
                    while (++i < l)(ev = events[i]).callback.call(ev.ctx);
                    return;
                case 1:
                    while (++i < l)(ev = events[i]).callback.call(ev.ctx, a1);
                    return;
                case 2:
                    while (++i < l)(ev = events[i]).callback.call(ev.ctx, a1, a2);
                    return;
                case 3:
                    while (++i < l)(ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
                    return;
                default:
                    while (++i < l)(ev = events[i]).callback.apply(ev.ctx, args);
                    return;
            }
        };

        var listenMethods = {
            listenTo: 'on',
            listenToOnce: 'once'
        };

        _.each(listenMethods, function(implementation, method) {
            Events[method] = function(obj, name, callback) {
                var listeningTo = this._listeningTo || (this._listeningTo = {});
                var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
                listeningTo[id] = obj;
                if (!callback && typeof name === 'object') callback = this;
                obj[implementation](name, callback, this);
                return this;
            };
        });

        Events.bind = Events.on;
        Events.unbind = Events.off;



        function Super() {};

        _.extend(Super.prototype, Events, {
            defaults: function() {
                return {}
            },
            /**
             * initialize
             * */
            init: function() {

            },

            $: function(selector) {
                return this.element.find(selector);
            },

            /**
             * build view
             * @public
             * */
            buildView: function() {
                return $('<div />');
            },

            /**
             * get DOM element
             * @public
             * */
            getDOM: function() {
                return this.element;
            },

            /**
             * get
             * @public
             * */
            get: function(properties) {
                var originData = this.data,
                    resData = {};
                if (!properties) {
                    // get all original properties
                    return _.clone(originData);
                } else if (typeof properties == 'string') {
                    // get one property
                    return originData[properties];
                } else if (_.isArray(properties)) {
                    // get a group of properties
                    _.each(properties, function(property) {
                        resData[property] = originData[property];
                    });
                    return resData;
                }
                return null;
            },

            /**
             *  setter
             * @public
             * */
            set: function(property, value) {
                this._set(property, value, true);
            },

            /**
             *  setter, used by self
             * @private
             * */
            _set: function(property, value, silent) {
                var properties,
                    changed = false,
                    changedData = {},
                    originData = this.data;

                if (typeof property == 'string') {
                    properties = {};
                    properties[property] = value;
                } else if (_.isObject(property)) {
                    properties = property;
                    silent = value;
                }

                if (properties) {
                    _.each(properties, function(value, property) {
                        if (originData[property] !== value) {
                            changed = true;
                            changedData[property] = originData[property];
                            originData[property] = value;
                        }
                    });
                    if (changed && !silent) {
                        this.trigger('changed', changedData);
                    }
                }

                if (this.error) {
                    this.hideError();
                }

            },

            show: function() {
                this.element.show();
            },

            hide: function() {
                this.element.hide();
            },


            showError: function() {
                if (!this.error) {
                    this.error = true;
                    this.element.addClass('search_ctrl_error');
                }
            },


            hideError: function() {
                if (this.error) {
                    this.error = false;
                    this.element.removeClass('search_ctrl_error');
                }
            },

            check: function() {
                var error,
                    data = this.get(),
                    count = 0;

                error = _.every(data, function(value, property) {
                    count++;
                    return !!value;
                });
                return count ? error : false;
            },

            getData: function(silent) {
                var data = this.get(),
                    error = !this.check();
                if (!silent && error) {
                    this.showError();
                }
                return error ? false : data;
            }

        });

        function Component() {
            this.data = this.defaults();
            this.config = {};
            this.init();
        }
        Component.prototype = new Super;
        _.extend(Component.prototype, {
            __super: Super.prototype
        }, prototype);

        return new Component;
    }
});