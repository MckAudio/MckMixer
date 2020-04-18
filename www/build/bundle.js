
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function add_resize_listener(element, fn) {
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }
        const object = document.createElement('object');
        object.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; pointer-events: none; z-index: -1;');
        object.setAttribute('aria-hidden', 'true');
        object.type = 'text/html';
        object.tabIndex = -1;
        let win;
        object.onload = () => {
            win = object.contentDocument.defaultView;
            win.addEventListener('resize', fn);
        };
        if (/Trident/.test(navigator.userAgent)) {
            element.appendChild(object);
            object.data = 'about:blank';
        }
        else {
            object.data = 'about:blank';
            element.appendChild(object);
        }
        return {
            cancel: () => {
                win && win.removeEventListener && win.removeEventListener('resize', fn);
                element.removeChild(object);
            }
        };
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.20.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Tools.svelte generated by Svelte v3.20.1 */

    function DbToLog(_db, _min, _max) {
    	if (_min == undefined) {
    		_min = -110;
    	}

    	if (_max == undefined) {
    		_max = 0;
    	}

    	_db = Math.max(_min, Math.min(_max, _db));
    	return Math.pow((_db - _min) / (_max - _min), 2);
    }

    function LogToDb(_val, _min, _max) {
    	if (_min == undefined) {
    		_min = -110;
    	}

    	if (_max == undefined) {
    		_max = 0;
    	}

    	let _db = Math.sqrt(_val) * (_max - _min) + _min;
    	return Math.max(-200, _db);
    }

    function GetOffsetLeft(elem) {
    	var offsetLeft = 0;

    	do {
    		if (!isNaN(elem.offsetLeft)) {
    			offsetLeft += elem.offsetLeft;
    		}
    	} while (elem = elem.offsetParent);

    	return offsetLeft;
    }

    function GetOffsetTop(elem) {
    	var offsetTop = 0;

    	do {
    		if (!isNaN(elem.offsetTop)) {
    			offsetTop += elem.offsetTop;
    		}
    	} while (elem = elem.offsetParent);

    	return offsetTop;
    }

    /* src/Slider.svelte generated by Svelte v3.20.1 */

    const { console: console_1 } = globals;
    const file = "src/Slider.svelte";

    // (176:2) {:else}
    function create_else_block(ctx) {
    	let div;
    	let t0;
    	let span;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = space();
    			span = element("span");
    			t1 = text(/*curWidth*/ ctx[1]);
    			attr_dev(div, "class", "slider hori svelte-d7gg15");
    			set_style(div, "width", /*curWidth*/ ctx[1] + "%");
    			add_location(div, file, 176, 4, 4807);
    			attr_dev(span, "class", "svelte-d7gg15");
    			add_location(span, file, 177, 4, 4867);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, span, anchor);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*curWidth*/ 2) {
    				set_style(div, "width", /*curWidth*/ ctx[1] + "%");
    			}

    			if (dirty & /*curWidth*/ 2) set_data_dev(t1, /*curWidth*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(176:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (172:2) {#if vertical}
    function create_if_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "slider vert svelte-d7gg15");
    			set_style(div, "top", 100 - /*curHeight*/ ctx[2] + "%");
    			set_style(div, "height", /*curHeight*/ ctx[2] + "%");
    			add_location(div, file, 172, 4, 4699);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*curHeight*/ 4) {
    				set_style(div, "top", 100 - /*curHeight*/ ctx[2] + "%");
    			}

    			if (dirty & /*curHeight*/ 4) {
    				set_style(div, "height", /*curHeight*/ ctx[2] + "%");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(172:2) {#if vertical}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*vertical*/ ctx[0]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "base svelte-d7gg15");
    			add_location(div, file, 170, 0, 4585);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    			/*div_binding*/ ctx[14](div);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(div, "mousedown", /*MouseHandler*/ ctx[5], false, false, false),
    				listen_dev(div, "touchstart", /*TouchHandler*/ ctx[4], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    			/*div_binding*/ ctx[14](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { vertical = false } = $$props;
    	let { Handler = undefined } = $$props;
    	let { value = 0 } = $$props;
    	let curValue = -1;
    	let curWidth = 100;
    	let curHeight = 100;
    	let base = undefined;
    	let offset = 0;
    	let mouse = 0;
    	let elemWidth = 0;
    	let elemHeight = 0;
    	let isDragging = false;

    	function TouchHandler(_evt) {
    		console.log("[TOUCH]", _evt);

    		if (_evt.type == "touchstart") {
    			if (base) {
    				isDragging = true;
    				elemWidth = base.offsetWidth;
    				elemHeight = base.offsetHeight;
    				let _val = curValue;

    				if (vertical) {
    					offset = GetOffsetTop(base);
    					_val = 1 - Math.max(0, Math.min(1, (_evt.touches[0].clientY - offset) / elemHeight));
    				} else {
    					offset = GetOffsetLeft(base);
    					_val = Math.max(0, Math.min(1, (_evt.touches[0].clientX - offset) / elemWidth));
    				}

    				if (Handler) {
    					Handler(_val);
    				}
    			} //_evt.preventDefault();
    		} else if (_evt.type == "touchmove") {
    			if (isDragging) {
    				let _val = curValue;

    				if (vertical) {
    					offset = GetOffsetTop(base);
    					_val = 1 - Math.max(0, Math.min(1, (_evt.touches[0].clientY - offset) / elemHeight));
    				} else {
    					offset = GetOffsetLeft(base);
    					_val = Math.max(0, Math.min(1, (_evt.touches[0].clientX - offset) / elemWidth));
    				}

    				if (Handler) {
    					Handler(_val);
    				}

    				_evt.stopImmediatePropagation();
    			}
    		} else if (_evt.type == "touchend") {
    			if (isDragging) {
    				isDragging = false;
    			} //_evt.preventDefault();
    		}
    	}

    	function MouseHandler(_evt) {
    		if (_evt.type == "mousedown") {
    			if (base) {
    				isDragging = true;
    				elemWidth = base.offsetWidth;
    				elemHeight = base.offsetHeight;
    				let _val = curValue;

    				if (vertical) {
    					offset = GetOffsetTop(base);
    					_val = 1 - Math.max(0, Math.min(1, (_evt.y - offset) / elemHeight));
    				} else {
    					offset = GetOffsetLeft(base);
    					_val = Math.max(0, Math.min(1, (_evt.x - offset) / elemWidth));
    				}

    				if (Handler) {
    					Handler(_val);
    				}

    				_evt.preventDefault();
    			}
    		} else if (_evt.type == "mousemove") {
    			if (isDragging) {
    				let _val = curValue;

    				if (vertical) {
    					offset = GetOffsetTop(base);
    					_val = 1 - Math.max(0, Math.min(1, (_evt.y - offset) / elemHeight));
    				} else {
    					offset = GetOffsetLeft(base);
    					_val = Math.max(0, Math.min(1, (_evt.x - offset) / elemWidth));
    				}

    				if (Handler) {
    					Handler(_val);
    				}

    				_evt.preventDefault();
    			}
    		} else if (_evt.type == "mouseup") {
    			if (isDragging) {
    				isDragging = false;
    				_evt.preventDefault();
    			}
    		}
    	}

    	onMount(() => {
    		window.addEventListener("contextmenu", e => e.preventDefault());
    		document.addEventListener("mousemove", MouseHandler);
    		document.addEventListener("mouseup", MouseHandler);
    		document.addEventListener("touchmove", TouchHandler);
    		document.addEventListener("touchend", TouchHandler);
    	});

    	onDestroy(() => {
    		document.removeEventListener("mousemove", MouseHandler);
    		document.removeEventListener("mouseup", MouseHandler);
    		document.removeEventListener("touchmove", TouchHandler);
    		document.removeEventListener("touchend", TouchHandler);
    	});

    	const writable_props = ["vertical", "Handler", "value"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Slider> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Slider", $$slots, []);

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(3, base = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("vertical" in $$props) $$invalidate(0, vertical = $$props.vertical);
    		if ("Handler" in $$props) $$invalidate(6, Handler = $$props.Handler);
    		if ("value" in $$props) $$invalidate(7, value = $$props.value);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		GetOffsetLeft,
    		GetOffsetTop,
    		vertical,
    		Handler,
    		value,
    		curValue,
    		curWidth,
    		curHeight,
    		base,
    		offset,
    		mouse,
    		elemWidth,
    		elemHeight,
    		isDragging,
    		TouchHandler,
    		MouseHandler
    	});

    	$$self.$inject_state = $$props => {
    		if ("vertical" in $$props) $$invalidate(0, vertical = $$props.vertical);
    		if ("Handler" in $$props) $$invalidate(6, Handler = $$props.Handler);
    		if ("value" in $$props) $$invalidate(7, value = $$props.value);
    		if ("curValue" in $$props) $$invalidate(8, curValue = $$props.curValue);
    		if ("curWidth" in $$props) $$invalidate(1, curWidth = $$props.curWidth);
    		if ("curHeight" in $$props) $$invalidate(2, curHeight = $$props.curHeight);
    		if ("base" in $$props) $$invalidate(3, base = $$props.base);
    		if ("offset" in $$props) offset = $$props.offset;
    		if ("mouse" in $$props) mouse = $$props.mouse;
    		if ("elemWidth" in $$props) elemWidth = $$props.elemWidth;
    		if ("elemHeight" in $$props) elemHeight = $$props.elemHeight;
    		if ("isDragging" in $$props) isDragging = $$props.isDragging;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*value, curValue, vertical*/ 385) {
    			 if (value != curValue) {
    				$$invalidate(8, curValue = Math.max(0, Math.min(1, value)));

    				if (vertical) {
    					$$invalidate(2, curHeight = Math.round(curValue * 100));
    				} else {
    					$$invalidate(1, curWidth = Math.round(curValue * 100));
    				}
    			} //slider.style.width = `${Math.round(curValue * 100.0)}$`;
    		}
    	};

    	return [
    		vertical,
    		curWidth,
    		curHeight,
    		base,
    		TouchHandler,
    		MouseHandler,
    		Handler,
    		value,
    		curValue,
    		offset,
    		elemWidth,
    		elemHeight,
    		isDragging,
    		mouse,
    		div_binding
    	];
    }

    class Slider extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { vertical: 0, Handler: 6, value: 7 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Slider",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get vertical() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set vertical(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get Handler() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Handler(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/SliderLabel.svelte generated by Svelte v3.20.1 */

    const { console: console_1$1 } = globals;
    const file$1 = "src/SliderLabel.svelte";

    // (192:2) {:else}
    function create_else_block$1(ctx) {
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let t2;
    	let span;
    	let t3;
    	let t4;
    	let div3;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			t2 = space();
    			span = element("span");
    			t3 = text(/*label*/ ctx[1]);
    			t4 = space();
    			div3 = element("div");
    			attr_dev(div0, "class", "blend bg svelte-fdzzhg");
    			set_style(div0, "width", /*elemWidth*/ ctx[5] + "px");
    			set_style(div0, "height", /*elemHeight*/ ctx[6] + "px");
    			add_location(div0, file$1, 192, 4, 5125);
    			attr_dev(div1, "class", "blend slider hori svelte-fdzzhg");
    			set_style(div1, "width", /*curValue*/ ctx[2] * /*elemWidth*/ ctx[5] + "px");
    			set_style(div1, "height", /*elemHeight*/ ctx[6] + "px");
    			add_location(div1, file$1, 193, 4, 5212);
    			attr_dev(div2, "class", "blend fg svelte-fdzzhg");
    			set_style(div2, "width", /*elemWidth*/ ctx[5] + "px");
    			set_style(div2, "height", /*elemHeight*/ ctx[6] + "px");
    			add_location(div2, file$1, 194, 4, 5315);
    			set_style(span, "width", /*elemWidth*/ ctx[5] + "px");
    			set_style(span, "height", /*elemHeight*/ ctx[6] + "px");
    			set_style(span, "line-height", /*elemHeight*/ ctx[6] + "px");
    			attr_dev(span, "class", "svelte-fdzzhg");
    			add_location(span, file$1, 195, 4, 5402);
    			attr_dev(div3, "class", "blend border svelte-fdzzhg");
    			set_style(div3, "width", /*elemWidth*/ ctx[5] + "px");
    			set_style(div3, "height", /*elemHeight*/ ctx[6] + "px");
    			add_location(div3, file$1, 196, 4, 5510);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div2, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, span, anchor);
    			append_dev(span, t3);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div3, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*elemWidth*/ 32) {
    				set_style(div0, "width", /*elemWidth*/ ctx[5] + "px");
    			}

    			if (dirty & /*elemHeight*/ 64) {
    				set_style(div0, "height", /*elemHeight*/ ctx[6] + "px");
    			}

    			if (dirty & /*curValue, elemWidth*/ 36) {
    				set_style(div1, "width", /*curValue*/ ctx[2] * /*elemWidth*/ ctx[5] + "px");
    			}

    			if (dirty & /*elemHeight*/ 64) {
    				set_style(div1, "height", /*elemHeight*/ ctx[6] + "px");
    			}

    			if (dirty & /*elemWidth*/ 32) {
    				set_style(div2, "width", /*elemWidth*/ ctx[5] + "px");
    			}

    			if (dirty & /*elemHeight*/ 64) {
    				set_style(div2, "height", /*elemHeight*/ ctx[6] + "px");
    			}

    			if (dirty & /*label*/ 2) set_data_dev(t3, /*label*/ ctx[1]);

    			if (dirty & /*elemWidth*/ 32) {
    				set_style(span, "width", /*elemWidth*/ ctx[5] + "px");
    			}

    			if (dirty & /*elemHeight*/ 64) {
    				set_style(span, "height", /*elemHeight*/ ctx[6] + "px");
    			}

    			if (dirty & /*elemHeight*/ 64) {
    				set_style(span, "line-height", /*elemHeight*/ ctx[6] + "px");
    			}

    			if (dirty & /*elemWidth*/ 32) {
    				set_style(div3, "width", /*elemWidth*/ ctx[5] + "px");
    			}

    			if (dirty & /*elemHeight*/ 64) {
    				set_style(div3, "height", /*elemHeight*/ ctx[6] + "px");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(span);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(192:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (188:2) {#if vertical}
    function create_if_block$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "slider vert svelte-fdzzhg");
    			set_style(div, "top", 100 - /*curHeight*/ ctx[3] + "%");
    			set_style(div, "height", /*curHeight*/ ctx[3] + "%");
    			add_location(div, file$1, 188, 4, 5017);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*curHeight*/ 8) {
    				set_style(div, "top", 100 - /*curHeight*/ ctx[3] + "%");
    			}

    			if (dirty & /*curHeight*/ 8) {
    				set_style(div, "height", /*curHeight*/ ctx[3] + "%");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(188:2) {#if vertical}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let div_resize_listener;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*vertical*/ ctx[0]) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "base svelte-fdzzhg");
    			add_render_callback(() => /*div_elementresize_handler*/ ctx[15].call(div));
    			add_location(div, file$1, 186, 0, 4843);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    			div_resize_listener = add_resize_listener(div, /*div_elementresize_handler*/ ctx[15].bind(div));
    			/*div_binding*/ ctx[16](div);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(div, "mousedown", /*MouseHandler*/ ctx[8], false, false, false),
    				listen_dev(div, "touchstart", /*TouchHandler*/ ctx[7], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    			div_resize_listener.cancel();
    			/*div_binding*/ ctx[16](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { vertical = false } = $$props;
    	let { Handler = undefined } = $$props;
    	let { value = 0 } = $$props;
    	let { label = "" } = $$props;
    	let curValue = -1;
    	let curWidth = 100;
    	let curHeight = 100;
    	let base = undefined;
    	let offset = 0;
    	let mouse = 0;
    	let elemWidth = 0;
    	let elemHeight = 0;
    	let isDragging = false;

    	function TouchHandler(_evt) {
    		console.log("[TOUCH]", _evt);

    		if (_evt.type == "touchstart") {
    			if (base) {
    				isDragging = true;

    				//elemWidth = base.offsetWidth;
    				//elemHeight = base.offsetHeight;
    				let _val = curValue;

    				if (vertical) {
    					offset = GetOffsetTop(base);
    					_val = 1 - Math.max(0, Math.min(1, (_evt.touches[0].clientY - offset) / elemHeight));
    				} else {
    					offset = GetOffsetLeft(base);
    					_val = Math.max(0, Math.min(1, (_evt.touches[0].clientX - offset) / elemWidth));
    				}

    				if (Handler) {
    					Handler(_val);
    				}
    			} //_evt.preventDefault();
    		} else if (_evt.type == "touchmove") {
    			if (isDragging) {
    				let _val = curValue;

    				if (vertical) {
    					offset = GetOffsetTop(base);
    					_val = 1 - Math.max(0, Math.min(1, (_evt.touches[0].clientY - offset) / elemHeight));
    				} else {
    					offset = GetOffsetLeft(base);
    					_val = Math.max(0, Math.min(1, (_evt.touches[0].clientX - offset) / elemWidth));
    				}

    				if (Handler) {
    					Handler(_val);
    				}

    				_evt.stopImmediatePropagation();
    			}
    		} else if (_evt.type == "touchend") {
    			if (isDragging) {
    				isDragging = false;
    			} //_evt.preventDefault();
    		}
    	}

    	function MouseHandler(_evt) {
    		if (_evt.type == "mousedown") {
    			if (base) {
    				isDragging = true;

    				//elemWidth = base.offsetWidth;
    				//elemHeight = base.offsetHeight;
    				let _val = curValue;

    				if (vertical) {
    					offset = GetOffsetTop(base);
    					_val = 1 - Math.max(0, Math.min(1, (_evt.y - offset) / elemHeight));
    				} else {
    					offset = GetOffsetLeft(base);
    					_val = Math.max(0, Math.min(1, (_evt.x - offset) / elemWidth));
    				}

    				if (Handler) {
    					Handler(_val);
    				}

    				_evt.preventDefault();
    			}
    		} else if (_evt.type == "mousemove") {
    			if (isDragging) {
    				let _val = curValue;

    				if (vertical) {
    					offset = GetOffsetTop(base);
    					_val = 1 - Math.max(0, Math.min(1, (_evt.y - offset) / elemHeight));
    				} else {
    					offset = GetOffsetLeft(base);
    					_val = Math.max(0, Math.min(1, (_evt.x - offset) / elemWidth));
    				}

    				if (Handler) {
    					Handler(_val);
    				}

    				_evt.preventDefault();
    			}
    		} else if (_evt.type == "mouseup") {
    			if (isDragging) {
    				isDragging = false;
    				_evt.preventDefault();
    			}
    		}
    	}

    	onMount(() => {
    		window.addEventListener("contextmenu", e => e.preventDefault());
    		document.addEventListener("mousemove", MouseHandler);
    		document.addEventListener("mouseup", MouseHandler);
    		document.addEventListener("touchmove", TouchHandler);
    		document.addEventListener("touchend", TouchHandler);
    	});

    	onDestroy(() => {
    		document.removeEventListener("mousemove", MouseHandler);
    		document.removeEventListener("mouseup", MouseHandler);
    		document.removeEventListener("touchmove", TouchHandler);
    		document.removeEventListener("touchend", TouchHandler);
    	});

    	const writable_props = ["vertical", "Handler", "value", "label"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<SliderLabel> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("SliderLabel", $$slots, []);

    	function div_elementresize_handler() {
    		elemWidth = this.clientWidth;
    		elemHeight = this.clientHeight;
    		$$invalidate(5, elemWidth);
    		$$invalidate(6, elemHeight);
    	}

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(4, base = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("vertical" in $$props) $$invalidate(0, vertical = $$props.vertical);
    		if ("Handler" in $$props) $$invalidate(9, Handler = $$props.Handler);
    		if ("value" in $$props) $$invalidate(10, value = $$props.value);
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		GetOffsetLeft,
    		GetOffsetTop,
    		vertical,
    		Handler,
    		value,
    		label,
    		curValue,
    		curWidth,
    		curHeight,
    		base,
    		offset,
    		mouse,
    		elemWidth,
    		elemHeight,
    		isDragging,
    		TouchHandler,
    		MouseHandler
    	});

    	$$self.$inject_state = $$props => {
    		if ("vertical" in $$props) $$invalidate(0, vertical = $$props.vertical);
    		if ("Handler" in $$props) $$invalidate(9, Handler = $$props.Handler);
    		if ("value" in $$props) $$invalidate(10, value = $$props.value);
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("curValue" in $$props) $$invalidate(2, curValue = $$props.curValue);
    		if ("curWidth" in $$props) curWidth = $$props.curWidth;
    		if ("curHeight" in $$props) $$invalidate(3, curHeight = $$props.curHeight);
    		if ("base" in $$props) $$invalidate(4, base = $$props.base);
    		if ("offset" in $$props) offset = $$props.offset;
    		if ("mouse" in $$props) mouse = $$props.mouse;
    		if ("elemWidth" in $$props) $$invalidate(5, elemWidth = $$props.elemWidth);
    		if ("elemHeight" in $$props) $$invalidate(6, elemHeight = $$props.elemHeight);
    		if ("isDragging" in $$props) isDragging = $$props.isDragging;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*value, curValue, vertical*/ 1029) {
    			 if (value != curValue) {
    				$$invalidate(2, curValue = Math.max(0, Math.min(1, value)));

    				if (vertical) {
    					$$invalidate(3, curHeight = Math.round(curValue * 100));
    				} else {
    					curWidth = Math.round(curValue * 100);
    				}
    			} //slider.style.width = `${Math.round(curValue * 100.0)}$`;
    		}
    	};

    	return [
    		vertical,
    		label,
    		curValue,
    		curHeight,
    		base,
    		elemWidth,
    		elemHeight,
    		TouchHandler,
    		MouseHandler,
    		Handler,
    		value,
    		curWidth,
    		offset,
    		isDragging,
    		mouse,
    		div_elementresize_handler,
    		div_binding
    	];
    }

    class SliderLabel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			vertical: 0,
    			Handler: 9,
    			value: 10,
    			label: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SliderLabel",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get vertical() {
    		throw new Error("<SliderLabel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set vertical(value) {
    		throw new Error("<SliderLabel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get Handler() {
    		throw new Error("<SliderLabel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Handler(value) {
    		throw new Error("<SliderLabel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<SliderLabel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<SliderLabel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<SliderLabel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<SliderLabel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.20.1 */

    const { console: console_1$2 } = globals;
    const file$2 = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[26] = list[i];
    	child_ctx[28] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[29] = list[i];
    	child_ctx[28] = i;
    	return child_ctx;
    }

    // (116:2) {#if data != undefined}
    function create_if_block_1(ctx) {
    	let div0;
    	let i0;
    	let t0;
    	let span0;
    	let t2;
    	let span1;
    	let t3_value = Math.round(/*data*/ ctx[0].gain) + "";
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let div1;
    	let i1;
    	let t7;
    	let span2;
    	let t9;
    	let span3;
    	let t10_value = Math.round(/*data*/ ctx[0].gain) + "";
    	let t10;
    	let t11;
    	let t12;
    	let input0;
    	let input0_value_value;
    	let t13;
    	let div2;
    	let i2;
    	let t15;
    	let select;
    	let t16;
    	let span4;
    	let t17_value = /*data*/ ctx[0].reverb.rt60 + "";
    	let t17;
    	let t18;
    	let t19;
    	let input1;
    	let input1_value_value;
    	let t20;
    	let div3;
    	let i3;
    	let t21;
    	let span5;
    	let t23;
    	let span6;
    	let t24_value = /*data*/ ctx[0].reverb.gain + "";
    	let t24;
    	let t25;
    	let t26;
    	let input2;
    	let input2_value_value;
    	let t27;
    	let div4;
    	let i4;
    	let t29;
    	let span7;
    	let t30;
    	let span8;
    	let t31_value = /*data*/ ctx[0].delay.delay + "";
    	let t31;
    	let t32;
    	let t33;
    	let input3;
    	let input3_value_value;
    	let t34;
    	let div5;
    	let i5;
    	let t35;
    	let span9;
    	let t37;
    	let span10;
    	let t38_value = /*data*/ ctx[0].delay.feedback + "";
    	let t38;
    	let t39;
    	let t40;
    	let input4;
    	let input4_value_value;
    	let t41;
    	let div6;
    	let i6;
    	let t42;
    	let span11;
    	let t44;
    	let span12;
    	let t45_value = /*data*/ ctx[0].delay.gain + "";
    	let t45;
    	let t46;
    	let t47;
    	let input5;
    	let input5_value_value;
    	let t48;
    	let t49;
    	let button0;
    	let t51;
    	let button1;
    	let current;
    	let dispose;

    	const sliderlabel = new SliderLabel({
    			props: {
    				label: Math.round(/*data*/ ctx[0].gain) + " dB",
    				value: DbToLog(/*data*/ ctx[0].gain),
    				Handler: /*func*/ ctx[11]
    			},
    			$$inline: true
    		});

    	let each_value_1 = /*revTypes*/ ctx[1];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*data*/ ctx[0].channels;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			i0 = element("i");
    			t0 = space();
    			span0 = element("span");
    			span0.textContent = "Master";
    			t2 = space();
    			span1 = element("span");
    			t3 = text(t3_value);
    			t4 = text(" dB");
    			t5 = space();
    			create_component(sliderlabel.$$.fragment);
    			t6 = space();
    			div1 = element("div");
    			i1 = element("i");
    			t7 = space();
    			span2 = element("span");
    			span2.textContent = "Master";
    			t9 = space();
    			span3 = element("span");
    			t10 = text(t10_value);
    			t11 = text(" dB");
    			t12 = space();
    			input0 = element("input");
    			t13 = space();
    			div2 = element("div");
    			i2 = element("i");
    			i2.textContent = "REV";
    			t15 = space();
    			select = element("select");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t16 = space();
    			span4 = element("span");
    			t17 = text(t17_value);
    			t18 = text(" s");
    			t19 = space();
    			input1 = element("input");
    			t20 = space();
    			div3 = element("div");
    			i3 = element("i");
    			t21 = space();
    			span5 = element("span");
    			span5.textContent = "Gain";
    			t23 = space();
    			span6 = element("span");
    			t24 = text(t24_value);
    			t25 = text(" dB");
    			t26 = space();
    			input2 = element("input");
    			t27 = space();
    			div4 = element("div");
    			i4 = element("i");
    			i4.textContent = "dly";
    			t29 = space();
    			span7 = element("span");
    			t30 = space();
    			span8 = element("span");
    			t31 = text(t31_value);
    			t32 = text(" s");
    			t33 = space();
    			input3 = element("input");
    			t34 = space();
    			div5 = element("div");
    			i5 = element("i");
    			t35 = space();
    			span9 = element("span");
    			span9.textContent = "Feedback";
    			t37 = space();
    			span10 = element("span");
    			t38 = text(t38_value);
    			t39 = text(" dB");
    			t40 = space();
    			input4 = element("input");
    			t41 = space();
    			div6 = element("div");
    			i6 = element("i");
    			t42 = space();
    			span11 = element("span");
    			span11.textContent = "Gain";
    			t44 = space();
    			span12 = element("span");
    			t45 = text(t45_value);
    			t46 = text(" dB");
    			t47 = space();
    			input5 = element("input");
    			t48 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t49 = space();
    			button0 = element("button");
    			button0.textContent = "Add new mono channel";
    			t51 = space();
    			button1 = element("button");
    			button1.textContent = "Add new stereo channel";
    			add_location(i0, file$2, 117, 8, 2726);
    			add_location(span0, file$2, 118, 8, 2742);
    			add_location(span1, file$2, 119, 8, 2770);
    			attr_dev(div0, "class", "channel svelte-1pb5bts");
    			add_location(div0, file$2, 116, 6, 2696);
    			add_location(i1, file$2, 131, 8, 3262);
    			add_location(span2, file$2, 132, 8, 3278);
    			add_location(span3, file$2, 133, 8, 3306);
    			attr_dev(input0, "type", "range");
    			input0.value = input0_value_value = Math.round(/*data*/ ctx[0].gain).toString();
    			attr_dev(input0, "min", "-60");
    			attr_dev(input0, "max", "6");
    			add_location(input0, file$2, 134, 8, 3354);
    			attr_dev(div1, "class", "channel svelte-1pb5bts");
    			add_location(div1, file$2, 130, 6, 3232);
    			add_location(i2, file$2, 142, 8, 3615);
    			add_location(select, file$2, 143, 8, 3634);
    			add_location(span4, file$2, 152, 8, 3969);
    			attr_dev(input1, "type", "range");
    			input1.value = input1_value_value = Math.round(/*data*/ ctx[0].reverb * 10).toString();
    			attr_dev(input1, "min", "5.0");
    			attr_dev(input1, "max", "100.0");
    			add_location(input1, file$2, 153, 8, 4011);
    			attr_dev(div2, "class", "channel svelte-1pb5bts");
    			add_location(div2, file$2, 141, 6, 3585);
    			add_location(i3, file$2, 161, 8, 4292);
    			add_location(span5, file$2, 162, 8, 4308);
    			add_location(span6, file$2, 163, 8, 4334);
    			attr_dev(input2, "type", "range");
    			input2.value = input2_value_value = Math.round(/*data*/ ctx[0].reverb.gain).toString();
    			attr_dev(input2, "min", "-60");
    			attr_dev(input2, "max", "6");
    			add_location(input2, file$2, 164, 8, 4377);
    			attr_dev(div3, "class", "channel svelte-1pb5bts");
    			add_location(div3, file$2, 160, 6, 4262);
    			add_location(i4, file$2, 172, 8, 4645);
    			add_location(span7, file$2, 173, 8, 4664);
    			add_location(span8, file$2, 174, 8, 4686);
    			attr_dev(input3, "type", "range");
    			input3.value = input3_value_value = Math.round(/*data*/ ctx[0].delay * 10).toString();
    			attr_dev(input3, "min", "1.0");
    			attr_dev(input3, "max", "50.0");
    			add_location(input3, file$2, 175, 8, 4728);
    			attr_dev(div4, "class", "channel svelte-1pb5bts");
    			add_location(div4, file$2, 171, 6, 4615);
    			add_location(i5, file$2, 183, 8, 5007);
    			add_location(span9, file$2, 184, 8, 5023);
    			add_location(span10, file$2, 185, 8, 5053);
    			attr_dev(input4, "type", "range");
    			input4.value = input4_value_value = Math.round(/*data*/ ctx[0].delay.feedback).toString();
    			attr_dev(input4, "min", "-60");
    			attr_dev(input4, "max", "-3");
    			add_location(input4, file$2, 186, 8, 5099);
    			attr_dev(div5, "class", "channel svelte-1pb5bts");
    			add_location(div5, file$2, 182, 6, 4977);
    			add_location(i6, file$2, 194, 8, 5374);
    			add_location(span11, file$2, 195, 8, 5390);
    			add_location(span12, file$2, 196, 8, 5416);
    			attr_dev(input5, "type", "range");
    			input5.value = input5_value_value = Math.round(/*data*/ ctx[0].delay.gain).toString();
    			attr_dev(input5, "min", "-60");
    			attr_dev(input5, "max", "6");
    			add_location(input5, file$2, 197, 8, 5458);
    			attr_dev(div6, "class", "channel svelte-1pb5bts");
    			add_location(div6, file$2, 193, 6, 5344);
    			attr_dev(button0, "type", "button");
    			add_location(button0, file$2, 252, 4, 7133);
    			attr_dev(button1, "type", "button");
    			add_location(button1, file$2, 255, 4, 7236);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, i0);
    			append_dev(div0, t0);
    			append_dev(div0, span0);
    			append_dev(div0, t2);
    			append_dev(div0, span1);
    			append_dev(span1, t3);
    			append_dev(span1, t4);
    			append_dev(div0, t5);
    			mount_component(sliderlabel, div0, null);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, i1);
    			append_dev(div1, t7);
    			append_dev(div1, span2);
    			append_dev(div1, t9);
    			append_dev(div1, span3);
    			append_dev(span3, t10);
    			append_dev(span3, t11);
    			append_dev(div1, t12);
    			append_dev(div1, input0);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, i2);
    			append_dev(div2, t15);
    			append_dev(div2, select);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select, null);
    			}

    			append_dev(div2, t16);
    			append_dev(div2, span4);
    			append_dev(span4, t17);
    			append_dev(span4, t18);
    			append_dev(div2, t19);
    			append_dev(div2, input1);
    			insert_dev(target, t20, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, i3);
    			append_dev(div3, t21);
    			append_dev(div3, span5);
    			append_dev(div3, t23);
    			append_dev(div3, span6);
    			append_dev(span6, t24);
    			append_dev(span6, t25);
    			append_dev(div3, t26);
    			append_dev(div3, input2);
    			insert_dev(target, t27, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, i4);
    			append_dev(div4, t29);
    			append_dev(div4, span7);
    			append_dev(div4, t30);
    			append_dev(div4, span8);
    			append_dev(span8, t31);
    			append_dev(span8, t32);
    			append_dev(div4, t33);
    			append_dev(div4, input3);
    			insert_dev(target, t34, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, i5);
    			append_dev(div5, t35);
    			append_dev(div5, span9);
    			append_dev(div5, t37);
    			append_dev(div5, span10);
    			append_dev(span10, t38);
    			append_dev(span10, t39);
    			append_dev(div5, t40);
    			append_dev(div5, input4);
    			insert_dev(target, t41, anchor);
    			insert_dev(target, div6, anchor);
    			append_dev(div6, i6);
    			append_dev(div6, t42);
    			append_dev(div6, span11);
    			append_dev(div6, t44);
    			append_dev(div6, span12);
    			append_dev(span12, t45);
    			append_dev(span12, t46);
    			append_dev(div6, t47);
    			append_dev(div6, input5);
    			insert_dev(target, t48, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t49, anchor);
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t51, anchor);
    			insert_dev(target, button1, anchor);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input0, "change", /*change_handler*/ ctx[12], false, false, false),
    				listen_dev(select, "change", /*change_handler_1*/ ctx[13], false, false, false),
    				listen_dev(input1, "change", /*change_handler_2*/ ctx[14], false, false, false),
    				listen_dev(input2, "change", /*change_handler_3*/ ctx[15], false, false, false),
    				listen_dev(input3, "change", /*change_handler_4*/ ctx[16], false, false, false),
    				listen_dev(input4, "change", /*change_handler_5*/ ctx[17], false, false, false),
    				listen_dev(input5, "change", /*change_handler_6*/ ctx[18], false, false, false),
    				listen_dev(button0, "click", /*click_handler*/ ctx[23], false, false, false),
    				listen_dev(button1, "click", /*click_handler_1*/ ctx[24], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*data*/ 1) && t3_value !== (t3_value = Math.round(/*data*/ ctx[0].gain) + "")) set_data_dev(t3, t3_value);
    			const sliderlabel_changes = {};
    			if (dirty & /*data*/ 1) sliderlabel_changes.label = Math.round(/*data*/ ctx[0].gain) + " dB";
    			if (dirty & /*data*/ 1) sliderlabel_changes.value = DbToLog(/*data*/ ctx[0].gain);
    			sliderlabel.$set(sliderlabel_changes);
    			if ((!current || dirty & /*data*/ 1) && t10_value !== (t10_value = Math.round(/*data*/ ctx[0].gain) + "")) set_data_dev(t10, t10_value);

    			if (!current || dirty & /*data*/ 1 && input0_value_value !== (input0_value_value = Math.round(/*data*/ ctx[0].gain).toString())) {
    				prop_dev(input0, "value", input0_value_value);
    			}

    			if (dirty & /*revTypes, data*/ 3) {
    				each_value_1 = /*revTypes*/ ctx[1];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if ((!current || dirty & /*data*/ 1) && t17_value !== (t17_value = /*data*/ ctx[0].reverb.rt60 + "")) set_data_dev(t17, t17_value);

    			if (!current || dirty & /*data*/ 1 && input1_value_value !== (input1_value_value = Math.round(/*data*/ ctx[0].reverb * 10).toString())) {
    				prop_dev(input1, "value", input1_value_value);
    			}

    			if ((!current || dirty & /*data*/ 1) && t24_value !== (t24_value = /*data*/ ctx[0].reverb.gain + "")) set_data_dev(t24, t24_value);

    			if (!current || dirty & /*data*/ 1 && input2_value_value !== (input2_value_value = Math.round(/*data*/ ctx[0].reverb.gain).toString())) {
    				prop_dev(input2, "value", input2_value_value);
    			}

    			if ((!current || dirty & /*data*/ 1) && t31_value !== (t31_value = /*data*/ ctx[0].delay.delay + "")) set_data_dev(t31, t31_value);

    			if (!current || dirty & /*data*/ 1 && input3_value_value !== (input3_value_value = Math.round(/*data*/ ctx[0].delay * 10).toString())) {
    				prop_dev(input3, "value", input3_value_value);
    			}

    			if ((!current || dirty & /*data*/ 1) && t38_value !== (t38_value = /*data*/ ctx[0].delay.feedback + "")) set_data_dev(t38, t38_value);

    			if (!current || dirty & /*data*/ 1 && input4_value_value !== (input4_value_value = Math.round(/*data*/ ctx[0].delay.feedback).toString())) {
    				prop_dev(input4, "value", input4_value_value);
    			}

    			if ((!current || dirty & /*data*/ 1) && t45_value !== (t45_value = /*data*/ ctx[0].delay.gain + "")) set_data_dev(t45, t45_value);

    			if (!current || dirty & /*data*/ 1 && input5_value_value !== (input5_value_value = Math.round(/*data*/ ctx[0].delay.gain).toString())) {
    				prop_dev(input5, "value", input5_value_value);
    			}

    			if (dirty & /*Math, data, SendValue, Number*/ 5) {
    				each_value = /*data*/ ctx[0].channels;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(t49.parentNode, t49);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sliderlabel.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sliderlabel.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(sliderlabel);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t20);
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t27);
    			if (detaching) detach_dev(div4);
    			if (detaching) detach_dev(t34);
    			if (detaching) detach_dev(div5);
    			if (detaching) detach_dev(t41);
    			if (detaching) detach_dev(div6);
    			if (detaching) detach_dev(t48);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t49);
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t51);
    			if (detaching) detach_dev(button1);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(116:2) {#if data != undefined}",
    		ctx
    	});

    	return block;
    }

    // (148:10) {:else}
    function create_else_block$2(ctx) {
    	let option;
    	let t_value = /*rev*/ ctx[29] + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*i*/ ctx[28];
    			option.value = option.__value;
    			add_location(option, file$2, 148, 10, 3876);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(148:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (146:10) {#if i == data.reverb.type}
    function create_if_block_2(ctx) {
    	let option;
    	let t_value = /*rev*/ ctx[29] + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*i*/ ctx[28];
    			option.value = option.__value;
    			option.selected = true;
    			add_location(option, file$2, 146, 10, 3806);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(146:10) {#if i == data.reverb.type}",
    		ctx
    	});

    	return block;
    }

    // (145:8) {#each revTypes as rev, i}
    function create_each_block_1(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*i*/ ctx[28] == /*data*/ ctx[0].reverb.type) return create_if_block_2;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(145:8) {#each revTypes as rev, i}",
    		ctx
    	});

    	return block;
    }

    // (207:4) {#each data.channels as chan, i}
    function create_each_block(ctx) {
    	let div0;
    	let i0;
    	let t0;
    	let t1_value = /*i*/ ctx[28] + 1 + "";
    	let t1;
    	let t2;
    	let span0;
    	let t3_value = /*chan*/ ctx[26].name + "";
    	let t3;
    	let t4;
    	let span1;
    	let t5_value = /*chan*/ ctx[26].gain + "";
    	let t5;
    	let t6;
    	let t7;
    	let input0;
    	let input0_value_value;
    	let t8;
    	let div1;
    	let i1;
    	let t9;
    	let span2;
    	let t11;
    	let span3;
    	let t12_value = /*chan*/ ctx[26].pan + "";
    	let t12;
    	let t13;
    	let t14;
    	let input1;
    	let input1_value_value;
    	let t15;
    	let div2;
    	let i2;
    	let t16;
    	let span4;
    	let t18;
    	let span5;
    	let t19_value = /*chan*/ ctx[26].sendReverb + "";
    	let t19;
    	let t20;
    	let t21;
    	let input2;
    	let input2_value_value;
    	let t22;
    	let div3;
    	let i3;
    	let t23;
    	let span6;
    	let t25;
    	let span7;
    	let t26_value = /*chan*/ ctx[26].sendDelay + "";
    	let t26;
    	let t27;
    	let t28;
    	let input3;
    	let input3_value_value;
    	let dispose;

    	function change_handler_7(...args) {
    		return /*change_handler_7*/ ctx[19](/*i*/ ctx[28], ...args);
    	}

    	function change_handler_8(...args) {
    		return /*change_handler_8*/ ctx[20](/*i*/ ctx[28], ...args);
    	}

    	function change_handler_9(...args) {
    		return /*change_handler_9*/ ctx[21](/*i*/ ctx[28], ...args);
    	}

    	function change_handler_10(...args) {
    		return /*change_handler_10*/ ctx[22](/*i*/ ctx[28], ...args);
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			i0 = element("i");
    			t0 = text("#");
    			t1 = text(t1_value);
    			t2 = space();
    			span0 = element("span");
    			t3 = text(t3_value);
    			t4 = space();
    			span1 = element("span");
    			t5 = text(t5_value);
    			t6 = text(" dB");
    			t7 = space();
    			input0 = element("input");
    			t8 = space();
    			div1 = element("div");
    			i1 = element("i");
    			t9 = space();
    			span2 = element("span");
    			span2.textContent = "Pan";
    			t11 = space();
    			span3 = element("span");
    			t12 = text(t12_value);
    			t13 = text(" %");
    			t14 = space();
    			input1 = element("input");
    			t15 = space();
    			div2 = element("div");
    			i2 = element("i");
    			t16 = space();
    			span4 = element("span");
    			span4.textContent = "Reverb Send";
    			t18 = space();
    			span5 = element("span");
    			t19 = text(t19_value);
    			t20 = text(" dB");
    			t21 = space();
    			input2 = element("input");
    			t22 = space();
    			div3 = element("div");
    			i3 = element("i");
    			t23 = space();
    			span6 = element("span");
    			span6.textContent = "Delay Send";
    			t25 = space();
    			span7 = element("span");
    			t26 = text(t26_value);
    			t27 = text(" dB");
    			t28 = space();
    			input3 = element("input");
    			add_location(i0, file$2, 208, 8, 5763);
    			add_location(span0, file$2, 209, 8, 5787);
    			add_location(span1, file$2, 210, 8, 5820);
    			attr_dev(input0, "type", "range");
    			input0.value = input0_value_value = Math.round(/*chan*/ ctx[26].gain).toString();
    			attr_dev(input0, "min", "-60");
    			attr_dev(input0, "max", "6");
    			add_location(input0, file$2, 211, 8, 5856);
    			attr_dev(div0, "class", "channel svelte-1pb5bts");
    			add_location(div0, file$2, 207, 6, 5733);
    			add_location(i1, file$2, 219, 8, 6111);
    			add_location(span2, file$2, 220, 8, 6127);
    			add_location(span3, file$2, 221, 8, 6152);
    			attr_dev(input1, "type", "range");
    			input1.value = input1_value_value = Math.round(/*chan*/ ctx[26].pan).toString();
    			attr_dev(input1, "min", "0");
    			attr_dev(input1, "max", "100");
    			add_location(input1, file$2, 222, 8, 6186);
    			attr_dev(div1, "class", "channel svelte-1pb5bts");
    			add_location(div1, file$2, 218, 6, 6081);
    			add_location(i2, file$2, 230, 8, 6439);
    			add_location(span4, file$2, 231, 8, 6455);
    			add_location(span5, file$2, 232, 8, 6488);
    			attr_dev(input2, "type", "range");
    			input2.value = input2_value_value = Math.round(/*chan*/ ctx[26].sendReverb).toString();
    			attr_dev(input2, "min", "-60");
    			attr_dev(input2, "max", "20");
    			add_location(input2, file$2, 233, 8, 6530);
    			attr_dev(div2, "class", "channel svelte-1pb5bts");
    			add_location(div2, file$2, 229, 6, 6409);
    			add_location(i3, file$2, 241, 8, 6798);
    			add_location(span6, file$2, 242, 8, 6814);
    			add_location(span7, file$2, 243, 8, 6846);
    			attr_dev(input3, "type", "range");
    			input3.value = input3_value_value = Math.round(/*chan*/ ctx[26].sendDelay).toString();
    			attr_dev(input3, "min", "-60");
    			attr_dev(input3, "max", "20");
    			add_location(input3, file$2, 244, 8, 6887);
    			attr_dev(div3, "class", "channel svelte-1pb5bts");
    			add_location(div3, file$2, 240, 6, 6768);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, i0);
    			append_dev(i0, t0);
    			append_dev(i0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, span0);
    			append_dev(span0, t3);
    			append_dev(div0, t4);
    			append_dev(div0, span1);
    			append_dev(span1, t5);
    			append_dev(span1, t6);
    			append_dev(div0, t7);
    			append_dev(div0, input0);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, i1);
    			append_dev(div1, t9);
    			append_dev(div1, span2);
    			append_dev(div1, t11);
    			append_dev(div1, span3);
    			append_dev(span3, t12);
    			append_dev(span3, t13);
    			append_dev(div1, t14);
    			append_dev(div1, input1);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, i2);
    			append_dev(div2, t16);
    			append_dev(div2, span4);
    			append_dev(div2, t18);
    			append_dev(div2, span5);
    			append_dev(span5, t19);
    			append_dev(span5, t20);
    			append_dev(div2, t21);
    			append_dev(div2, input2);
    			insert_dev(target, t22, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, i3);
    			append_dev(div3, t23);
    			append_dev(div3, span6);
    			append_dev(div3, t25);
    			append_dev(div3, span7);
    			append_dev(span7, t26);
    			append_dev(span7, t27);
    			append_dev(div3, t28);
    			append_dev(div3, input3);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input0, "change", change_handler_7, false, false, false),
    				listen_dev(input1, "change", change_handler_8, false, false, false),
    				listen_dev(input2, "change", change_handler_9, false, false, false),
    				listen_dev(input3, "change", change_handler_10, false, false, false)
    			];
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*data*/ 1 && t3_value !== (t3_value = /*chan*/ ctx[26].name + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*data*/ 1 && t5_value !== (t5_value = /*chan*/ ctx[26].gain + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*data*/ 1 && input0_value_value !== (input0_value_value = Math.round(/*chan*/ ctx[26].gain).toString())) {
    				prop_dev(input0, "value", input0_value_value);
    			}

    			if (dirty & /*data*/ 1 && t12_value !== (t12_value = /*chan*/ ctx[26].pan + "")) set_data_dev(t12, t12_value);

    			if (dirty & /*data*/ 1 && input1_value_value !== (input1_value_value = Math.round(/*chan*/ ctx[26].pan).toString())) {
    				prop_dev(input1, "value", input1_value_value);
    			}

    			if (dirty & /*data*/ 1 && t19_value !== (t19_value = /*chan*/ ctx[26].sendReverb + "")) set_data_dev(t19, t19_value);

    			if (dirty & /*data*/ 1 && input2_value_value !== (input2_value_value = Math.round(/*chan*/ ctx[26].sendReverb).toString())) {
    				prop_dev(input2, "value", input2_value_value);
    			}

    			if (dirty & /*data*/ 1 && t26_value !== (t26_value = /*chan*/ ctx[26].sendDelay + "")) set_data_dev(t26, t26_value);

    			if (dirty & /*data*/ 1 && input3_value_value !== (input3_value_value = Math.round(/*chan*/ ctx[26].sendDelay).toString())) {
    				prop_dev(input3, "value", input3_value_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t22);
    			if (detaching) detach_dev(div3);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(207:4) {#each data.channels as chan, i}",
    		ctx
    	});

    	return block;
    }

    // (262:2) {#if data != undefined}
    function create_if_block$2(ctx) {
    	let current;

    	const slider = new Slider({
    			props: {
    				vertical: true,
    				value: DbToLog(/*data*/ ctx[0].gain),
    				Handler: /*func_1*/ ctx[25]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(slider.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(slider, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const slider_changes = {};
    			if (dirty & /*data*/ 1) slider_changes.value = DbToLog(/*data*/ ctx[0].gain);
    			slider.$set(slider_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(slider.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(slider.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(slider, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(262:2) {#if data != undefined}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div2;
    	let div0;
    	let t;
    	let div1;
    	let current;
    	let if_block0 = /*data*/ ctx[0] != undefined && create_if_block_1(ctx);
    	let if_block1 = /*data*/ ctx[0] != undefined && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			div1 = element("div");
    			if (if_block1) if_block1.c();
    			attr_dev(div0, "class", "main svelte-1pb5bts");
    			add_location(div0, file$2, 114, 2, 2645);
    			attr_dev(div1, "class", "master svelte-1pb5bts");
    			add_location(div1, file$2, 260, 2, 7355);
    			attr_dev(div2, "class", "base svelte-1pb5bts");
    			add_location(div2, file$2, 113, 0, 2624);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div2, t);
    			append_dev(div2, div1);
    			if (if_block1) if_block1.m(div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*data*/ ctx[0] != undefined) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    					transition_in(if_block0, 1);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div0, null);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*data*/ ctx[0] != undefined) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block$2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { name } = $$props;
    	let port = 9001;
    	let socket = undefined;
    	let socketConnected = false;
    	let gain = 0;
    	let data = undefined;
    	let revTypes = ["STREV", "PROG2", "ZREV2", "NREVB"];

    	function SendValue(_idx, _section, _type, _val) {
    		let _data = JSON.parse(JSON.stringify(data));

    		if (_section == "channels") {
    			_data.channels[_idx][_type] = _val;
    		} else if (_section == "master") {
    			_data[_type] = _val;
    		} else if (_section == "reverb") {
    			_data.reverb[_type] = _val;
    		} else if (_section == "delay") {
    			_data.delay[_type] = _val;
    		}

    		let _msg = {
    			msgType: "partial",
    			section: "config",
    			data: JSON.stringify(_data)
    		};

    		if (socketConnected) {
    			socket.send(JSON.stringify(_msg));
    		} else {
    			Connect("ws://127.0.0.1", port);
    			socket.send(JSON.stringify(_msg));
    		}
    	}

    	function RecvMsg(_msg) {
    		let _tmp = JSON.parse(_msg);

    		if (_tmp.msgType == "partial" && _tmp.section == "config") {
    			let _data = JSON.parse(_tmp.data);
    			$$invalidate(0, data = _data);
    			console.log("[NEW DATA]", data);
    		}
    	}

    	function Connect(_url, _port) {
    		let _uri = `${_url}:${_port}`;
    		console.log(_uri);
    		socket = new WebSocket(_uri);

    		socket.onopen = _evt => {
    			console.log("WS was opened!");
    			socketConnected = true;
    		};

    		socket.onclose = _evt => {
    			console.log("WS was closed!");
    			socketConnected = false;
    		};

    		socket.onmessage = _evt => RecvMsg(_evt.data);
    	}

    	onMount(() => {
    		let _uri = document.URL;
    		let _url = _uri.substring(_uri.indexOf("://") + 3, _uri.lastIndexOf(":"));
    		Connect("ws://" + _url, port);
    	});

    	onDestroy(() => {
    		if (socketConnected) {
    			socket.close();
    		}
    	});

    	function AddChannel(_isStereo) {
    		let _msg = {
    			msgType: "command",
    			section: "channel",
    			data: JSON.stringify({
    				command: "add",
    				isStereo: _isStereo,
    				idx: 0
    			})
    		};

    		if (socketConnected) {
    			socket.send(JSON.stringify(_msg));
    		}
    	}

    	const writable_props = ["name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	const func = _v => SendValue(undefined, "master", "gain", LogToDb(_v));
    	const change_handler = e => SendValue(undefined, "master", "gain", Number(e.target.value));
    	const change_handler_1 = e => SendValue(undefined, "reverb", "type", Number(e.target.value));
    	const change_handler_2 = e => SendValue(undefined, "reverb", "rt60", Number(e.target.value) / 10);
    	const change_handler_3 = e => SendValue(undefined, "reverb", "gain", Number(e.target.value));
    	const change_handler_4 = e => SendValue(undefined, "delay", "delay", Number(e.target.value) / 10);
    	const change_handler_5 = e => SendValue(undefined, "delay", "feedback", Number(e.target.value));
    	const change_handler_6 = e => SendValue(undefined, "delay", "gain", Number(e.target.value));
    	const change_handler_7 = (i, e) => SendValue(i, "channels", "gain", Number(e.target.value));
    	const change_handler_8 = (i, e) => SendValue(i, "channels", "pan", Number(e.target.value));
    	const change_handler_9 = (i, e) => SendValue(i, "channels", "sendReverb", Number(e.target.value));
    	const change_handler_10 = (i, e) => SendValue(i, "channels", "sendDelay", Number(e.target.value));
    	const click_handler = () => AddChannel(false);
    	const click_handler_1 = () => AddChannel(true);
    	const func_1 = _v => SendValue(undefined, "master", "gain", LogToDb(_v));

    	$$self.$set = $$props => {
    		if ("name" in $$props) $$invalidate(4, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		DbToLog,
    		LogToDb,
    		Slider,
    		SliderLabel,
    		name,
    		port,
    		socket,
    		socketConnected,
    		gain,
    		data,
    		revTypes,
    		SendValue,
    		RecvMsg,
    		Connect,
    		AddChannel
    	});

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(4, name = $$props.name);
    		if ("port" in $$props) port = $$props.port;
    		if ("socket" in $$props) socket = $$props.socket;
    		if ("socketConnected" in $$props) socketConnected = $$props.socketConnected;
    		if ("gain" in $$props) gain = $$props.gain;
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("revTypes" in $$props) $$invalidate(1, revTypes = $$props.revTypes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		data,
    		revTypes,
    		SendValue,
    		AddChannel,
    		name,
    		socket,
    		socketConnected,
    		port,
    		gain,
    		RecvMsg,
    		Connect,
    		func,
    		change_handler,
    		change_handler_1,
    		change_handler_2,
    		change_handler_3,
    		change_handler_4,
    		change_handler_5,
    		change_handler_6,
    		change_handler_7,
    		change_handler_8,
    		change_handler_9,
    		change_handler_10,
    		click_handler,
    		click_handler_1,
    		func_1
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { name: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[4] === undefined && !("name" in props)) {
    			console_1$2.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
