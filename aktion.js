/**
 * Define Aktion data attributes.
 *
 * @attr data-aktion-name Unique action name (default: autogenerated)
 * @attr data-aktion-type Action type (can be: 'set'|'toggle'|'add'|'remove'|'trigger-event', default: 'toggle')
 * @attr data-aktion-value String value which will affect the attribute value of the destination DOM element(s) (required)
 * @attr data-aktion-value-type The attribute value of the destination DOM element(s) can be a "static" string,
 * or the name of an "attribute" of the source DOM element which stores the value, or the name of an "event" which will be triggered
 * on the destination DOM element (can be 'static'|'attribute')
 * @attr data-aktion-event Native/custom event fires up action (default: 'click')
 * @attr data-aktion-event-threshold Custom event (swipe) threshold value (default: 10)
 * @attr data-aktion-source-selector A valid DOM selector which determines the source DOM element(s) (default: this)
 * @attr data-aktion-destination-selector A valid DOM selector which determines the destination DOM element(s) (default: this)
 * @attr data-aktion-trigger-before Action will trigger before this named action, which has the same source selector (default: false)
 * @attr data-aktion-trigger-after Action will trigger after this named action, which has the same source selector (default: false)
 * @attr data-aktion-attribute The attribute of the destination DOM element, which will be affected (if data-aktion-value-type is not "event")  (default: 'class')
 * @attr data-aktion-interval-time Time of the function calling interval (in milliseconds). Used at custom scroll event checking (default: 100).
 * @attr data-aktion-extra-condition Function call which determines extra condition for the execution of the action (default: true)
 **/

var Aktion = (function(customConfig) {
    /**
     * MinJS
     *
     * https://github.com/remy/min.js
     *
     * Upgraded by megant
     *
     **/
    var $ = (function (document, window, $) {
        // Node covers all elements, but also the document objects
        var node = Node.prototype,
            nodeList = NodeList.prototype,
            forEach = 'forEach',
            trigger = 'trigger',
            each = [][forEach],
            // note: createElement requires a string in Firefox
            dummy = document.createElement('i'),
            event_idx;

        nodeList[forEach] = each;

        // we have to explicitly add a window.on as it's not included
        // in the Node object.
        window.on = node.on = function (events, fn) {
            events = events.split(" ");
            for (event_idx in events) {
                this.addEventListener(events[event_idx], fn, false);
            }

            // allow for chaining
            return this;
        };

        nodeList.on = function (events, fn) {
            events = events.split(" ");

            this[forEach](function (el) {
                for (event_idx in events) {
                    el.on(events[event_idx], fn);
                }
            });

            return this;
        };

        // we save a few bytes (but none really in compression)
        // by using [trigger] - really it's for consistency in the
        // source code.
        window[trigger] = node[trigger] = function (type, data) {
            // construct an HTML event. This could have
            // been a real custom event
            var event = document.createEvent('HTMLEvents');
            event.initEvent(type, true, true);
            event.data = data || {};
            event.eventName = type;
            event.target = this;
            this.dispatchEvent(event);
            return this;
        };

        nodeList[trigger] = function (event) {
            this[forEach](function (el) {
                el[trigger](event);
            });
            return this;
        };

        $ = function (s) {
            var r = document.querySelectorAll(s || '☺'),
                length = r.length;
            return length == 1 ? r[0] : r;
        };

        // $.on and $.trigger allow for pub/sub type global
        // custom events.
        $.on = node.on.bind(dummy);
        $[trigger] = node[trigger].bind(dummy);

        return $;
    })(document, this);

    Node.prototype.delegate=function(a,b,c){var d=this.mozMatchesSelector||this.webkitMatchesSelector||this.oMatchesSelector||this.matchesSelector||function(a){var b=this,c=$(a),d=!1;return c instanceof NodeList?c.forEach(function(a){a===b&&(d=!0)}):c===b&&(d=!0),d};return this.on(b,function(b){d.call(b.target,a)&&c.call(b.target,b)}),this};

    /**
     * Main Aktion object
     *
     * @constructor
     * @param {object} customConfig Public configuration object
     * @returns {object} Public API object
     */
    var AktionBase = function(customConfig) {

        /** "Private" properties **/

        /** Scroll position checker interval **/
        var scrollInterval = null;

        /** Collection of elements with custom scroll events **/
        var scrollElements = [];

        /** Aktion-wide indicators */
        var indicators = {
            isIOS: false,
            actionCheckInProgress: false,
            // data-action-name counter (if data-action-name is not present)
            elementNameCounter: 0,
            // 0: inactive, 1: active, 2: in progress, 3: stopped
            scrollStatus: 0
        };

        /** Touch position indicators for mobile events */
        var touchPositions = {
            startX: null,
            startY: null,
            currentX: null,
            currentY: null
        };

        /** Default configuration options */
        var defaultConfig = {
            dataAttributePrefix: "aktion",
            autoActivate: true,
            debugMode: false
        };

        /** Instance configuration options */
        var config = {};

        /** data-action-* attribute defaults */
        var elementDefaults = {
            type: 'toggle',
            source_selector: null,
            destination_selector: null,
            event: 'click',
            event_threshold: 10,
            attribute: 'class',
            value: null,
            value_type: 'static',
            trigger_before: false,
            trigger_after: false,
            interval_time: 100,
            extra_condition: (function () {return true})
        };

        /** currently triggering aktions queue */
        var actionQueue = {};

        /** aktion order container array */
        var actionOrder = [];

        /** Helper methods **/
        var Helpers = {

            /**
             * Log to the console
             *
             * @param {string} message Log message
             * @param {object} data Log data object
             * @returns {boolean} false if debug mode is disabled
             */
            log: function(message, data) {
                if (!config.debugMode) {
                    return false;
                }

                console.log(message, data);
            },

            /**
             * Create a new object by combining two or more objects
             *
             * @returns {object} extended object
             */
            extend: function () {
                // Variables
                var extended = {};
                var deep = false;
                var i = 0;
                var length = arguments.length;

                // Check if a deep merge
                if (Object.prototype.toString.call(arguments[0]) === '[object Boolean]') {
                    deep = arguments[0];
                    i++;
                }

                // Merge the object into the extended object
                var merge = function (obj) {
                    for (var prop in obj) {
                        if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                            // If deep merge and property is an object, merge properties
                            if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') {
                                extended[prop] = extend(true, extended[prop], obj[prop]);
                            } else {
                                extended[prop] = obj[prop];
                            }
                        }
                    }
                };

                // Loop through each object and conduct a merge
                for (; i < length; i++) {
                    var obj = arguments[i];
                    merge(obj);
                }

                return extended;
            },

            /**
             * Cross-browser pointer event getter
             *
             * @param {Event} event Event object
             * @returns {Event} Browser compatible pointer event object
             */
            getPointerEvent: function (event) {
                return event.targetTouches ? event.targetTouches[0] : event;
            },

            /**
             * Get height of an element
             *
             * @param {DOM object} el DOM object
             * @returns {number} Height in pixels
             */
            getHeight: function (el) {
                var height;

                if (el == window) {
                    height = el.innerHeight;

                } else if (el == document) {

                    height = this.getDocumentDimension('height');

                } else {
                    height = el.offsetHeight;

                    var style = getComputedStyle(el);

                    height += parseInt(style.marginTop) + parseInt(style.marginBottom);
                }

                return height;
            },

            /**
             * Cross-browser document height getter
             *
             * @param {string} dimension name of the searched dimension
             * @returns {number} dimension in pixels
             */
            getDocumentDimension: function (dimension) {
                var D = document;
                dimension = dimension.charAt(0).toUpperCase() + dimension.slice(1);
                return Math.max(
                    D.body['scroll' + dimension], D.documentElement['scroll' + dimension],
                    D.body['offset' + dimension], D.documentElement['offset' + dimension],
                    D.body['client' + dimension], D.documentElement['client' + dimension]
                );
            },

            /**
             * iOS platform check
             *
             * @returns {boolean} True if platform is iOS
             */
            checkIOS: function () {
                return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            },

            /**
             * Get delegator DOM element (if needed)
             *
             * @param {string} source_selector Source element selector string
             * @returns {DOM object} Delegator DOM object
             */
            getDelegatorDOMElement: function (source_selector) {

                if (source_selector == 'window') {
                    return false;
                } else {
                    return $('body');
                }
            },

            /**
             * Get aktion attribute value
             *
             * @param {DOM element}
             * @param {string} attr attribute of Aktion
             *
             * @returns Aktion attribute
             */
            getAttr: function (elm, attr) {
                var fullAttribute = this.getAttrName(attr);

                return elm.getAttribute(fullAttribute);
            },

            /**
             * Get full aktion data attribute name
             *
             * @param {string} attr Short attribute name
             * @returns {string} Full aktion data attribute name
             */
            getAttrName: function (attr) {
                return 'data-' + config.dataAttributePrefix + '-' + attr;
            },

            /**
             * Cross-browser foreach method for old browsers
             *
             * @oaram {array} array Array which will be looped thru
             * @param {function} callback Callback function
             * @param {object} scope Optional scope object
             */
             forEach: function (array, callback, scope) {
                if (undefined === array.length) {
                    array = [array];
                }

                for (var i = 0; i < array.length; i++) {
                    callback.call(scope, array[i], i); // passes back stuff we need
                }
            },

            /**
             * Get window scroll top property
             *
             * @returns {integer} Scroll top property in pixels
             */
            getWindowScrollTop: function() {
                return (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;
            }
        }


        /**
         * Object init
         */
        var init = function () {

            config = Helpers.extend(defaultConfig, customConfig)
            indicators.isIOS = Helpers.checkIOS();

            if (config.autoActivate) _activate();
        };

        /**
         * Activate aktion events
         */
        var _activate = function () {
            var $aktions = $('[' + Helpers.getAttrName('value') + ']');

            // No aktion elements has been found
            if ($aktions.length < 1) return false;
            // CSS3 animation and transition events
            initCrossPlatformEvents($aktions);

            Helpers.forEach($aktions, function ($aktion, index) {
                // Element data object
                var element = setElementData($aktion);

                handleActionTriggering(element);
            });
        }

        /**
         * Cross-platform event initialization
         */
        var initCrossPlatformEvents = function () {
            // Cross-browser transition end event trigger
            $('['+Helpers.getAttrName('event')+'="trans-end"]').on('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', function (event) {
                event.target.trigger('trans-end');
            });

            // Cross-browser animation end event trigger
            $('['+Helpers.getAttrName('event')+'="anim-end"]').on('animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd', function (event) {
                event.target.trigger('anim-end');
            });
        }

        /**
         * Trigger custom swipe events
         * @param {object} element Element data object
         */
        var handleSwipeEvent = function (element) {

            var touchStarted = false;
            var _events = [];

            element.sourceElm.on('touchstart', function (e) {
                var pointer = Helpers.getPointerEvent(e);

                // caching the current x
                touchPositions.startX = touchPositions.currentX = pointer.pageX;
                touchPositions.startY = touchPositions.currentY = pointer.pageY;

                // a touch event is detected
                touchStarted = true;

                // detecting if after 200ms the finger is still in the same position
                setTimeout(function () {
                    if ((touchPositions.startX === touchPositions.currentX) && !touchStarted && (touchPositions.startY === touchPositions.currentY)) {
                        touchStarted = false;
                    }
                }, 200);
            });

            element.sourceElm.on('touchmove', function (e) {

                var pointer = Helpers.getPointerEvent(e);

                _events = [];

                touchPositions.currentX = pointer.pageX;
                touchPositions.currentY = pointer.pageY;

                if (touchPositions.currentX + element.event_threshold < touchPositions.startX) {
                    _events.push('swipeleft');
                } else if (touchPositions.currentX - element.event_threshold > touchPositions.startX) {
                    _events.push('swiperight');
                }

                if (touchPositions.currentY + element.event_threshold < touchPositions.startY) {
                    _events.push('swipeup');
                } else if (touchPositions.currentY - element.event_threshold > touchPositions.startY) {
                    _events.push('swipedown');
                }
            });

            element.sourceElm.on('touchend touchcancel', function (e) {

                if (touchStarted && _events.length) {

                    var event_idx = _events.indexOf(element.event);

                    if (event_idx > -1 && element.extra_condition()) {
                        element.sourceElm.trigger(_events[event_idx]);
                    }
                }

                // here we can consider finished the touch event
                touchStarted = false;
                _events = [];
            });
        }

        /**
         * Custom scroll event checking
         *
         * @param {integer} index The index of the current scroll_element (from scrollElements)
         * @param {string} event_type Event type name
         * @return {boolean} True if scroll event condition is fulfilled, false if not
         */
        var checkScrollEvent = function (index, event_type) {

            var condition, direction;
            var element = scrollElements[index];

            if (element.sourceElm == window) {
                element.scrollContainer.scrollTop = Helpers.getWindowScrollTop();
            }

            if (null !== element.lastY && element.lastY < element.scrollContainer.scrollTop) {
                direction = 1;
            } else if (element.lastY > element.scrollContainer.scrollTop) {
                direction = -1;
            } else {
                direction = null;
            }

            var scroll_status = indicators.scrollStatus;
            var scroll_stopped = (scroll_status > 1 && null === direction);

            if (scroll_stopped && (element.lastDirection === null || (element.event == 'scroll-reached-bottom' || element.event == 'scroll-reached-top'))) {

                if (event_type == "scrollstart") {
                    element.scrollContainer.trigger('scrollend');
                }

                return false;
            }

            // Browser's top position bouncing is not a scroll event
            if (element.scrollContainer.scrollTop < 0 || element.scrollContainer.scrollTop + Helpers.getHeight(element.scrollContainer) > Helpers.getDocumentDimension('height')) {
                return false;
            }

            switch (element.event) {
                case 'scroll-start':
                    condition = (scroll_status == 1 && element.scrollContainer.scrollTop > 0);
                    break;
                case 'scroll-stop':
                    condition = (scroll_status > 1 && null === direction);
                    break;
                case 'scroll':
                    condition = (scroll_status > 1 && null !== direction);
                    break;
                case 'scroll-up':
                    condition = (scroll_status > 1 && direction == -1);
                    break;
                case 'scroll-down':
                    condition = (scroll_status > 1 && direction == 1);
                    break;
                case 'scroll-dir-change':
                    condition = (scroll_status > 1 && ((element.lastDirection == -1 && direction == 1) || (element.lastDirection == 1 && direction == -1)));
                    break;
                case 'scroll-dir-change-up':
                    condition = (scroll_status > 1 && element.lastDirection == 1 && direction == -1);
                    break;
                case 'scroll-dir-change-down':
                    condition = (scroll_status > 1 && element.lastDirection == -1 && direction == 1);
                    break;
                case 'scroll-reached-top':
                    condition = (scroll_status > 1 && element.lastDirection != 1 && element.scrollContainer.scrollTop == 0);
                    break;
                case 'scroll-reached-bottom':
                    condition = (scroll_status > 1 && element.lastDirection != -1 && element.scrollContainer.scrollTop + Helpers.getHeight(element.scrollContainer) == Helpers.getHeight(element.scrollContent));
                    break;

            }

            scrollElements[index].lastDirection = direction;
            scrollElements[index].lastY = element.scrollContainer.scrollTop;

            if (scroll_status == 1 && null !== direction) {
                indicators.scrollStatus = 2;
            }

            return (element.extra_condition() && condition);
        }

        /**
         * Add an action to the queue
         *
         * @param {object|int} element The element object/index of the current scroll_element (from scrollElements)
         * @param {object} _this The DOM element of the current source element
         */
        var addToActionQueue = function (element, _this) {

            actionQueue[element.name] = {
                _this: _this,
                element: element
            };

            actionOrder.push(element.name);

            // The "call after all events" hack
            window.setTimeout(function () {
                if (!indicators.actionCheckInProgress && actionOrder.length > 0) {
                    indicators.actionCheckInProgress = true;
                    sortActions();
                }
            }, 0);
        }

        /**
         * Reset action queue and order
         */
        var resetActionQueue = function () {
            actionQueue = {};
            actionOrder = [];

            indicators.actionCheckInProgress = false;
        }

        /**
         * Sort triggering actions
         *
         */
        var sortActions = function () {
            var element_name, element;

            for (var idx in actionOrder) {

                element_name = actionOrder[idx];
                element = actionQueue[element_name].element;

                if (element.trigger_before && actionOrder.indexOf(element.trigger_before) > -1 && actionOrder.indexOf(element_name) > actionOrder.indexOf(element.trigger_before)) {
                    delete actionOrder[idx];
                    actionOrder.splice(actionOrder.indexOf(element.trigger_before), 0, element_name);
                }
                else if (element.trigger_after && actionOrder.indexOf(element.trigger_after) > -1 && actionOrder.indexOf(element_name) < actionOrder.indexOf(element.trigger_after)) {
                    delete actionOrder[idx];
                    actionOrder.splice(actionOrder.indexOf(element.trigger_after) + 1, 0, element_name);
                }
            }

            triggerActions();
        }

        /**
         * Trigger all actions from the queue
         *
         */
        var triggerActions = function () {

            var action, callback;
            var callbackQueue = [];

            for (var idx in actionOrder) {
                action = actionQueue[actionOrder[idx]];
                callback = triggerAction(action.element, action._this);

                if (false !== callback) {
                    callbackQueue.push(callback);
                }
            }

            resetActionQueue();

            if (callbackQueue.length) {
                Helpers.forEach(callbackQueue, function(cb, idx) {
                    cb();
                });
            }
        }

        /**
         * Trigger an action
         *
         * @param {object|int} element The element object/index of the current scroll_element (from scrollElements)
         * @param {object} _this The DOM element of the current source element
         *
         * @returns {function|boolean} Callback function or false if no callback present
         */
        var triggerAction = function (element, _this) {

            Helpers.log(element.name + ' action is running.', element);

            if (typeof element != 'object') {
                element = scrollElements[element];
            }

            var $this,
                attr,
                values,
                value,
                current_values,
                current_idx,
                action_value,
                affected_elements;

            // get value from source's attribute if present
            if (element.value_type == 'attribute') {
                value_data = _this.getAttribute(element.value);
            } else {
                value_data = element.value;
            }

            if (element.type != 'trigger-event') {

                values = value_data.split(",");
                var boolean_attributes = ['checked', 'selected', 'disabled'];

                if (element.destination_selector === null && element.destElm.length > 1) {
                    affected_elements = _this;
                } else {
                    affected_elements = element.destElm;
                }

                for (var idx in values) {

                    value = values[idx].trim();

                    Helpers.forEach(affected_elements, function (elm, index) {

                        attr = elm.getAttribute(element.attribute);

                        if (null !== attr) {
                            current_values = attr.split(" ");
                            current_idx = current_values.indexOf(value);
                        } else {
                            current_values = null;
                            current_idx = -1;
                        }

                        if (element.type != 'set') {

                            if (element.type != 'remove' && current_idx < 0) {
                                action_value = ((attr !== null && attr.length > 0) ? attr + ' ' : '') + value;
                            } else if (element.type != 'add' && current_idx > -1) {
                                if (boolean_attributes.indexOf(element.attribute) > -1) {
                                    elm[element.attribute] = false;
                                    return;
                                }

                                current_values.splice(current_idx, 1);
                                action_value = current_values.join(" ");
                            } else {
                                return false;
                            }
                        } else {
                            action_value = value;
                        }

                        elm.setAttribute(element.attribute, action_value);
                    });
                }

                return false;
            } else {
                return function() {
                    $((element.destination_selector === null) ? element.source_selector : element.destination_selector).trigger(value_data)
                };
            }
        }


        /**
         * Element data object creator
         *
         * @param {DOM object} $el DOM element of an aktion element
         * @returns {object}
         */
        var setElementData = function ($el) {

            var data_attribute_value, value;

            if (Helpers.getAttr($el, 'name')) {
                var element_name = Helpers.getAttr($el, 'name');
            }
            else {
                var element_name = 'action' + indicators.elementNameCounter;
                indicators.elementNameCounter++;
            }

            var element = {name: element_name};

            // set element object properties
            for (var attribute in elementDefaults) {

                data_attribute_value = Helpers.getAttr($el, attribute.replace('_', '-'));

                if (data_attribute_value) {

                    switch (typeof elementDefaults[attribute]) {
                        case 'number':
                            value = parseInt(data_attribute_value);
                            break;
                        case 'function':
                            value = window[data_attribute_value];
                            break;
                        default:
                            value = data_attribute_value;
                            break;

                    }
                }
                else {
                    value = elementDefaults[attribute];
                }

                element[attribute] = value;
            }

            // Handle special selectors (window/document)
            switch (element.source_selector) {
                case 'window':
                    element.sourceElm = window;
                    break;
                case 'document':
                    element.sourceElm = document;
                    break;
                case null:
                    element.sourceElm = $el;
                    break;
                default:
                    element.sourceElm = $(element.source_selector);
            }

            // iOS click trigger hack
            if (indicators.isIOS && element.source_selector != 'window' && element.source_selector != 'document' && element.event == 'click') {
                element.sourceElm.style.cursor = 'pointer';
            }

            element.destElm = (element.destination_selector !== null) ? $(element.destination_selector) : element.sourceElm;

            return element;
        }

        /**
         * Handle action triggering according to action type
         *
         * @param {object} element Aktion element data object
         */
        var handleActionTriggering = function (element) {
            // Scroll event
            if (element.event.indexOf('scroll') > -1) {
                handleScrollActions(element);
            } else if (element.event.indexOf('swipe') > -1) {
                handleSwipeActions(element);
            } else {
                handleCommonActions(element);
            }
        }

        /**
         * Handle scroll action triggering
         *
         * @param {object} element Aktion element data object
         */
        var handleScrollActions = function(element) {
            // Scroll event
            element.lastY = null;
            element.direction = null;
            var sourceElements = (element.source_selector == 'window' || element.source_selector == 'document') ? [window] : element.sourceElm;

            Helpers.forEach(sourceElements, function(elm, idx) {

                if (undefined !== elm.parentNode) {
                    element.scrollContainer = elm.parentNode;
                } else {
                    element.scrollContainer = elm;
                }

                element.scrollContent = (element.source_selector == 'window' || element.source_selector == 'document') ? document : elm;

                element.scrollContainer.on('touchstart mousedown scrollstart', function (evt) {

                    if (null === scrollInterval) {

                        indicators.scrollStatus = 1;

                        scrollInterval = setInterval(function () {

                            for (var index in scrollElements) {
                                if (checkScrollEvent(index, evt.type)) {
                                    addToActionQueue(scrollElements[index], scrollElements[index].sourceElm);
                                }
                            }
                        }, element.interval_time);
                    }
                });

                element.scrollContainer.on('touchend touchcancel mouseup scrollend', function (evt) {

                    if (null !== scrollInterval) {
                        clearInterval(scrollInterval);
                        scrollInterval = null;
                        element.lastY = null;
                        indicators.scrollStatus = 0;
                    }
                });

                element.scrollContainer.on('scroll', function(evt) {

                    if (null === scrollInterval) {
                        element.scrollContainer.trigger('scrollstart');
                    }
                });

                scrollElements.push(element);
            });
        }

        /**
         * Handle swipe action triggering
         *
         * @param {object} element Aktion element data object
         */
        var handleSwipeActions = function(element) {
            handleSwipeEvent(element);

            if (null !== element.source_selector &&
                (delegator = Helpers.getDelegatorDOMElement(element.source_selector))) {

                delegator.delegate(element.source_selector, element.event, function (event) {
                    addToActionQueue(element, event.target);
                });
            } else {
                element.sourceElm.on(element.event, function (event) {
                    addToActionQueue(element, event.target);
                });
            }
        }

        /**
         * Handle common action triggering
         *
         * @param {object} element Aktion element data object
         */
        var handleCommonActions = function(element) {
            // Native events

            if (null !== element.source_selector &&
                (delegator = Helpers.getDelegatorDOMElement(element.source_selector))) {

                delegator.delegate(element.source_selector, element.event, function (event) {
                    if (element.extra_condition()) {
                        addToActionQueue(element, event.target);
                    }
                });
            } else {
                element.sourceElm.on(element.event, function (event) {

                    if (element.extra_condition()) {
                        addToActionQueue(element, event.target);
                    }
                });
            }
        }

        /** Public methods and properties **/
        var api = {

            /**
             * Activate Aktion
             *
             * @returns {function} _activate private method
             */
            activate: function() {
                return _activate();
            }
        };

        init();

        return api;
    }

    return AktionBase;

})();