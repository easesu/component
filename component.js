define([
    'underscore',
    'backbone',
    'jquery'
], function (
    _,
    Backbone,
    $
) {


    return function (prototype) {

        function Super() {}
        _.extend(Super.prototype, Backbone.Events, {
            defaults: function () {
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
            buildView: function () {
                return $('<div />');
            },

            /**
             * get DOM element
             * @public
             * */
            getDOM: function () {
                return this.element;
            },

            /**
             * get
             * @public
             * */
            get: function (properties) {
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
            set: function (property, value) {
                this._set(property, value, true);
            },

            /**
             *  setter, used by self
             * @private
             * */
            _set: function (property, value, silent) {
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
                    _.each(properties, function (value, property) {
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

            show: function () {
                this.element.show();
            },

            hide: function () {
                this.element.hide();
            },


            showError: function () {
                if (!this.error) {
                    this.error = true;
                    this.element.addClass('search_ctrl_error');
                }
            },


            hideError: function () {
                if (this.error) {
                    this.error = false;
                    this.element.removeClass('search_ctrl_error');
                }
            },

            check: function () {
                var error,
                    data = this.get(),
                    count = 0;

                error = _.every(data, function (value, property) {
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