
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

    function FormatPan(_pan) {
    	_pan = Math.round(_pan * 2 - 100);
    	let _str = "";

    	if (_pan == 0) {
    		_str = "C";
    	} else if (_pan < 0) {
    		_str = `L ${Math.abs(_pan)} %`;
    	} else {
    		_str = `R ${Math.abs(_pan)} %`;
    	}

    	return _str;
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

    /* src/SliderLabel.svelte generated by Svelte v3.20.1 */

    const { console: console_1 } = globals;
    const file = "src/SliderLabel.svelte";

    // (223:2) {:else}
    function create_else_block(ctx) {
    	let div0;
    	let t0;
    	let t1;
    	let div1;
    	let div1_class_value;
    	let t2;
    	let span;
    	let t3;
    	let t4;
    	let div2;

    	function select_block_type_1(ctx, dirty) {
    		if (/*centered*/ ctx[2]) return create_if_block_1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = space();
    			if_block.c();
    			t1 = space();
    			div1 = element("div");
    			t2 = space();
    			span = element("span");
    			t3 = text(/*label*/ ctx[1]);
    			t4 = space();
    			div2 = element("div");
    			attr_dev(div0, "class", "blend bg svelte-47z1e0");
    			set_style(div0, "width", /*elemWidth*/ ctx[6] + "px");
    			set_style(div0, "height", /*elemHeight*/ ctx[7] + "px");
    			add_location(div0, file, 223, 4, 5565);
    			attr_dev(div1, "class", div1_class_value = "blend fg " + (/*centered*/ ctx[2] ? "centered" : "") + " svelte-47z1e0");
    			set_style(div1, "width", /*elemWidth*/ ctx[6] + "px");
    			set_style(div1, "height", /*elemHeight*/ ctx[7] + "px");
    			add_location(div1, file, 235, 4, 6024);
    			set_style(span, "width", /*elemWidth*/ ctx[6] + "px");
    			set_style(span, "height", /*elemHeight*/ ctx[7] + "px");
    			set_style(span, "line-height", /*elemHeight*/ ctx[7] + "px");
    			attr_dev(span, "class", "svelte-47z1e0");
    			add_location(span, file, 238, 4, 6148);
    			attr_dev(div2, "class", "blend border svelte-47z1e0");
    			set_style(div2, "width", /*elemWidth*/ ctx[6] + "px");
    			set_style(div2, "height", /*elemHeight*/ ctx[7] + "px");
    			add_location(div2, file, 242, 4, 6274);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t0, anchor);
    			if_block.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, span, anchor);
    			append_dev(span, t3);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div2, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*elemWidth*/ 64) {
    				set_style(div0, "width", /*elemWidth*/ ctx[6] + "px");
    			}

    			if (dirty & /*elemHeight*/ 128) {
    				set_style(div0, "height", /*elemHeight*/ ctx[7] + "px");
    			}

    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(t1.parentNode, t1);
    				}
    			}

    			if (dirty & /*centered*/ 4 && div1_class_value !== (div1_class_value = "blend fg " + (/*centered*/ ctx[2] ? "centered" : "") + " svelte-47z1e0")) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			if (dirty & /*elemWidth*/ 64) {
    				set_style(div1, "width", /*elemWidth*/ ctx[6] + "px");
    			}

    			if (dirty & /*elemHeight*/ 128) {
    				set_style(div1, "height", /*elemHeight*/ ctx[7] + "px");
    			}

    			if (dirty & /*label*/ 2) set_data_dev(t3, /*label*/ ctx[1]);

    			if (dirty & /*elemWidth*/ 64) {
    				set_style(span, "width", /*elemWidth*/ ctx[6] + "px");
    			}

    			if (dirty & /*elemHeight*/ 128) {
    				set_style(span, "height", /*elemHeight*/ ctx[7] + "px");
    			}

    			if (dirty & /*elemHeight*/ 128) {
    				set_style(span, "line-height", /*elemHeight*/ ctx[7] + "px");
    			}

    			if (dirty & /*elemWidth*/ 64) {
    				set_style(div2, "width", /*elemWidth*/ ctx[6] + "px");
    			}

    			if (dirty & /*elemHeight*/ 128) {
    				set_style(div2, "height", /*elemHeight*/ ctx[7] + "px");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if_block.d(detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(span);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(223:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (219:2) {#if vertical}
    function create_if_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "slider vert svelte-47z1e0");
    			set_style(div, "top", 100 - /*curHeight*/ ctx[4] + "%");
    			set_style(div, "height", /*curHeight*/ ctx[4] + "%");
    			add_location(div, file, 219, 4, 5457);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*curHeight*/ 16) {
    				set_style(div, "top", 100 - /*curHeight*/ ctx[4] + "%");
    			}

    			if (dirty & /*curHeight*/ 16) {
    				set_style(div, "height", /*curHeight*/ ctx[4] + "%");
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
    		source: "(219:2) {#if vertical}",
    		ctx
    	});

    	return block;
    }

    // (231:4) {:else}
    function create_else_block_1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "blend slider hori svelte-47z1e0");
    			set_style(div, "width", /*curValue*/ ctx[3] * /*elemWidth*/ ctx[6] + "px");
    			set_style(div, "height", /*elemHeight*/ ctx[7] + "px");
    			add_location(div, file, 231, 6, 5895);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*curValue, elemWidth*/ 72) {
    				set_style(div, "width", /*curValue*/ ctx[3] * /*elemWidth*/ ctx[6] + "px");
    			}

    			if (dirty & /*elemHeight*/ 128) {
    				set_style(div, "height", /*elemHeight*/ ctx[7] + "px");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(231:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (227:4) {#if centered}
    function create_if_block_1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "blend slider hori svelte-47z1e0");

    			set_style(div, "left", /*curValue*/ ctx[3] >= 0.5
    			? "50%"
    			: `${/*curValue*/ ctx[3] * /*elemWidth*/ ctx[6]}px`);

    			set_style(div, "width", Math.abs((/*curValue*/ ctx[3] - 0.5) * /*elemWidth*/ ctx[6]) + "px");
    			set_style(div, "height", /*elemHeight*/ ctx[7] + "px");
    			add_location(div, file, 227, 6, 5681);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*curValue, elemWidth*/ 72) {
    				set_style(div, "left", /*curValue*/ ctx[3] >= 0.5
    				? "50%"
    				: `${/*curValue*/ ctx[3] * /*elemWidth*/ ctx[6]}px`);
    			}

    			if (dirty & /*curValue, elemWidth*/ 72) {
    				set_style(div, "width", Math.abs((/*curValue*/ ctx[3] - 0.5) * /*elemWidth*/ ctx[6]) + "px");
    			}

    			if (dirty & /*elemHeight*/ 128) {
    				set_style(div, "height", /*elemHeight*/ ctx[7] + "px");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(227:4) {#if centered}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let div_resize_listener;
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
    			attr_dev(div, "class", "base svelte-47z1e0");
    			add_render_callback(() => /*div_elementresize_handler*/ ctx[16].call(div));
    			add_location(div, file, 211, 0, 5271);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    			div_resize_listener = add_resize_listener(div, /*div_elementresize_handler*/ ctx[16].bind(div));
    			/*div_binding*/ ctx[17](div);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(div, "mousedown", /*MouseHandler*/ ctx[9], false, false, false),
    				listen_dev(div, "touchstart", /*TouchHandler*/ ctx[8], false, false, false)
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
    			/*div_binding*/ ctx[17](null);
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
    	let { label = "" } = $$props;
    	let { centered = false } = $$props;
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
    				if (_evt.ctrlKey) {
    					if (centered) {
    						Handler(0.5);
    					} else {
    						Handler(1);
    					}

    					return;
    				}

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

    	const writable_props = ["vertical", "Handler", "value", "label", "centered"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<SliderLabel> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("SliderLabel", $$slots, []);

    	function div_elementresize_handler() {
    		elemWidth = this.clientWidth;
    		elemHeight = this.clientHeight;
    		$$invalidate(6, elemWidth);
    		$$invalidate(7, elemHeight);
    	}

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(5, base = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("vertical" in $$props) $$invalidate(0, vertical = $$props.vertical);
    		if ("Handler" in $$props) $$invalidate(10, Handler = $$props.Handler);
    		if ("value" in $$props) $$invalidate(11, value = $$props.value);
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("centered" in $$props) $$invalidate(2, centered = $$props.centered);
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
    		centered,
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
    		if ("Handler" in $$props) $$invalidate(10, Handler = $$props.Handler);
    		if ("value" in $$props) $$invalidate(11, value = $$props.value);
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("centered" in $$props) $$invalidate(2, centered = $$props.centered);
    		if ("curValue" in $$props) $$invalidate(3, curValue = $$props.curValue);
    		if ("curWidth" in $$props) curWidth = $$props.curWidth;
    		if ("curHeight" in $$props) $$invalidate(4, curHeight = $$props.curHeight);
    		if ("base" in $$props) $$invalidate(5, base = $$props.base);
    		if ("offset" in $$props) offset = $$props.offset;
    		if ("mouse" in $$props) mouse = $$props.mouse;
    		if ("elemWidth" in $$props) $$invalidate(6, elemWidth = $$props.elemWidth);
    		if ("elemHeight" in $$props) $$invalidate(7, elemHeight = $$props.elemHeight);
    		if ("isDragging" in $$props) isDragging = $$props.isDragging;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*value, curValue, vertical*/ 2057) {
    			 if (value != curValue) {
    				$$invalidate(3, curValue = Math.max(0, Math.min(1, value)));

    				if (vertical) {
    					$$invalidate(4, curHeight = Math.round(curValue * 100));
    				} else {
    					curWidth = Math.round(curValue * 100);
    				}
    			} //slider.style.width = `${Math.round(curValue * 100.0)}$`;
    		}
    	};

    	return [
    		vertical,
    		label,
    		centered,
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

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			vertical: 0,
    			Handler: 10,
    			value: 11,
    			label: 1,
    			centered: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SliderLabel",
    			options,
    			id: create_fragment.name
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

    	get centered() {
    		throw new Error("<SliderLabel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set centered(value) {
    		throw new Error("<SliderLabel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Settings.svelte generated by Svelte v3.20.1 */
    const file$1 = "src/Settings.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let span0;
    	let t1;
    	let button0;
    	let t3;
    	let span1;
    	let t4;
    	let button1;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			span0.textContent = "Add:";
    			t1 = space();
    			button0 = element("button");
    			button0.textContent = "Mono";
    			t3 = space();
    			span1 = element("span");
    			t4 = space();
    			button1 = element("button");
    			button1.textContent = "Stereo";
    			add_location(span0, file$1, 31, 4, 579);
    			attr_dev(button0, "type", "button");
    			add_location(button0, file$1, 32, 4, 601);
    			add_location(span1, file$1, 33, 4, 674);
    			attr_dev(button1, "type", "button");
    			add_location(button1, file$1, 34, 4, 686);
    			attr_dev(div, "class", "base svelte-1m27yaj");
    			add_location(div, file$1, 30, 0, 556);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(div, t1);
    			append_dev(div, button0);
    			append_dev(div, t3);
    			append_dev(div, span1);
    			append_dev(div, t4);
    			append_dev(div, button1);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(button0, "click", /*click_handler*/ ctx[4], false, false, false),
    				listen_dev(button1, "click", /*click_handler_1*/ ctx[5], false, false, false)
    			];
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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
    	let { data = undefined } = $$props;
    	let { SendValue = undefined } = $$props;
    	let { SendMsg = undefined } = $$props;

    	function AddChannel(_isStereo) {
    		let _data = JSON.stringify({
    			command: "add",
    			isStereo: _isStereo,
    			idx: 0
    		});

    		if (SendMsg) {
    			SendMsg("command", "channel", _data);
    		}
    	}

    	const writable_props = ["data", "SendValue", "SendMsg"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Settings> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Settings", $$slots, []);
    	const click_handler = () => AddChannel(false);
    	const click_handler_1 = () => AddChannel(true);

    	$$self.$set = $$props => {
    		if ("data" in $$props) $$invalidate(1, data = $$props.data);
    		if ("SendValue" in $$props) $$invalidate(2, SendValue = $$props.SendValue);
    		if ("SendMsg" in $$props) $$invalidate(3, SendMsg = $$props.SendMsg);
    	};

    	$$self.$capture_state = () => ({
    		SliderLabel,
    		data,
    		SendValue,
    		SendMsg,
    		AddChannel
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(1, data = $$props.data);
    		if ("SendValue" in $$props) $$invalidate(2, SendValue = $$props.SendValue);
    		if ("SendMsg" in $$props) $$invalidate(3, SendMsg = $$props.SendMsg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [AddChannel, data, SendValue, SendMsg, click_handler, click_handler_1];
    }

    class Settings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { data: 1, SendValue: 2, SendMsg: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get data() {
    		throw new Error("<Settings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Settings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get SendValue() {
    		throw new Error("<Settings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set SendValue(value) {
    		throw new Error("<Settings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get SendMsg() {
    		throw new Error("<Settings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set SendMsg(value) {
    		throw new Error("<Settings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Slider.svelte generated by Svelte v3.20.1 */

    const { console: console_1$1 } = globals;
    const file$2 = "src/Slider.svelte";

    // (176:2) {:else}
    function create_else_block$1(ctx) {
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
    			add_location(div, file$2, 176, 4, 4807);
    			attr_dev(span, "class", "svelte-d7gg15");
    			add_location(span, file$2, 177, 4, 4867);
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
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(176:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (172:2) {#if vertical}
    function create_if_block$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "slider vert svelte-d7gg15");
    			set_style(div, "top", 100 - /*curHeight*/ ctx[2] + "%");
    			set_style(div, "height", /*curHeight*/ ctx[2] + "%");
    			add_location(div, file$2, 172, 4, 4699);
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
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(172:2) {#if vertical}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
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
    			attr_dev(div, "class", "base svelte-d7gg15");
    			add_location(div, file$2, 170, 0, 4585);
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
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Slider> was created with unknown prop '${key}'`);
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
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { vertical: 0, Handler: 6, value: 7 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Slider",
    			options,
    			id: create_fragment$2.name
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

    /* src/Channel.svelte generated by Svelte v3.20.1 */
    const file$3 = "src/Channel.svelte";

    function create_fragment$3(ctx) {
    	let div5;
    	let i0;
    	let t0_value = /*index*/ ctx[2] + 1 + "";
    	let t0;
    	let t1;
    	let span;
    	let t2_value = /*data*/ ctx[0].name + "";
    	let t2;
    	let t3;
    	let div0;
    	let i1;
    	let t5;
    	let t6;
    	let div1;
    	let i2;
    	let t8;
    	let t9;
    	let div2;
    	let i3;
    	let t11;
    	let t12;
    	let div3;
    	let t13;
    	let div4;
    	let i4;
    	let t15;
    	let current;

    	const sliderlabel0 = new SliderLabel({
    			props: {
    				centered: true,
    				label: FormatPan(/*data*/ ctx[0].pan),
    				value: /*data*/ ctx[0].pan / 100,
    				Handler: /*func*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const sliderlabel1 = new SliderLabel({
    			props: {
    				label: Math.round(/*data*/ ctx[0].sendReverb) + " dB",
    				value: DbToLog(/*data*/ ctx[0].sendReverb),
    				Handler: /*func_1*/ ctx[4]
    			},
    			$$inline: true
    		});

    	const sliderlabel2 = new SliderLabel({
    			props: {
    				label: Math.round(/*data*/ ctx[0].sendDelay) + " dB",
    				value: DbToLog(/*data*/ ctx[0].sendDelay),
    				Handler: /*func_2*/ ctx[5]
    			},
    			$$inline: true
    		});

    	const sliderlabel3 = new SliderLabel({
    			props: {
    				label: Math.round(/*data*/ ctx[0].gain) + " dB",
    				value: DbToLog(/*data*/ ctx[0].gain),
    				Handler: /*func_3*/ ctx[6]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			i0 = element("i");
    			t0 = text(t0_value);
    			t1 = space();
    			span = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			div0 = element("div");
    			i1 = element("i");
    			i1.textContent = "Pan:";
    			t5 = space();
    			create_component(sliderlabel0.$$.fragment);
    			t6 = space();
    			div1 = element("div");
    			i2 = element("i");
    			i2.textContent = "Reverb Send:";
    			t8 = space();
    			create_component(sliderlabel1.$$.fragment);
    			t9 = space();
    			div2 = element("div");
    			i3 = element("i");
    			i3.textContent = "Delay Send:";
    			t11 = space();
    			create_component(sliderlabel2.$$.fragment);
    			t12 = space();
    			div3 = element("div");
    			t13 = space();
    			div4 = element("div");
    			i4 = element("i");
    			i4.textContent = "Gain:";
    			t15 = space();
    			create_component(sliderlabel3.$$.fragment);
    			attr_dev(i0, "class", "svelte-7wsn6x");
    			add_location(i0, file$3, 42, 2, 816);
    			attr_dev(span, "class", "svelte-7wsn6x");
    			add_location(span, file$3, 43, 2, 837);
    			add_location(i1, file$3, 45, 4, 890);
    			attr_dev(div0, "class", "control svelte-7wsn6x");
    			add_location(div0, file$3, 44, 2, 864);
    			add_location(i2, file$3, 53, 4, 1099);
    			attr_dev(div1, "class", "control svelte-7wsn6x");
    			add_location(div1, file$3, 52, 2, 1073);
    			add_location(i3, file$3, 60, 4, 1324);
    			attr_dev(div2, "class", "control svelte-7wsn6x");
    			add_location(div2, file$3, 59, 2, 1298);
    			attr_dev(div3, "class", "rest svelte-7wsn6x");
    			add_location(div3, file$3, 66, 2, 1519);
    			add_location(i4, file$3, 68, 4, 1567);
    			attr_dev(div4, "class", "control svelte-7wsn6x");
    			add_location(div4, file$3, 67, 2, 1541);
    			attr_dev(div5, "class", "base svelte-7wsn6x");
    			add_location(div5, file$3, 41, 0, 795);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, i0);
    			append_dev(i0, t0);
    			append_dev(div5, t1);
    			append_dev(div5, span);
    			append_dev(span, t2);
    			append_dev(div5, t3);
    			append_dev(div5, div0);
    			append_dev(div0, i1);
    			append_dev(div0, t5);
    			mount_component(sliderlabel0, div0, null);
    			append_dev(div5, t6);
    			append_dev(div5, div1);
    			append_dev(div1, i2);
    			append_dev(div1, t8);
    			mount_component(sliderlabel1, div1, null);
    			append_dev(div5, t9);
    			append_dev(div5, div2);
    			append_dev(div2, i3);
    			append_dev(div2, t11);
    			mount_component(sliderlabel2, div2, null);
    			append_dev(div5, t12);
    			append_dev(div5, div3);
    			append_dev(div5, t13);
    			append_dev(div5, div4);
    			append_dev(div4, i4);
    			append_dev(div4, t15);
    			mount_component(sliderlabel3, div4, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*index*/ 4) && t0_value !== (t0_value = /*index*/ ctx[2] + 1 + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*data*/ 1) && t2_value !== (t2_value = /*data*/ ctx[0].name + "")) set_data_dev(t2, t2_value);
    			const sliderlabel0_changes = {};
    			if (dirty & /*data*/ 1) sliderlabel0_changes.label = FormatPan(/*data*/ ctx[0].pan);
    			if (dirty & /*data*/ 1) sliderlabel0_changes.value = /*data*/ ctx[0].pan / 100;
    			if (dirty & /*SendValue*/ 2) sliderlabel0_changes.Handler = /*func*/ ctx[3];
    			sliderlabel0.$set(sliderlabel0_changes);
    			const sliderlabel1_changes = {};
    			if (dirty & /*data*/ 1) sliderlabel1_changes.label = Math.round(/*data*/ ctx[0].sendReverb) + " dB";
    			if (dirty & /*data*/ 1) sliderlabel1_changes.value = DbToLog(/*data*/ ctx[0].sendReverb);
    			if (dirty & /*SendValue*/ 2) sliderlabel1_changes.Handler = /*func_1*/ ctx[4];
    			sliderlabel1.$set(sliderlabel1_changes);
    			const sliderlabel2_changes = {};
    			if (dirty & /*data*/ 1) sliderlabel2_changes.label = Math.round(/*data*/ ctx[0].sendDelay) + " dB";
    			if (dirty & /*data*/ 1) sliderlabel2_changes.value = DbToLog(/*data*/ ctx[0].sendDelay);
    			if (dirty & /*SendValue*/ 2) sliderlabel2_changes.Handler = /*func_2*/ ctx[5];
    			sliderlabel2.$set(sliderlabel2_changes);
    			const sliderlabel3_changes = {};
    			if (dirty & /*data*/ 1) sliderlabel3_changes.label = Math.round(/*data*/ ctx[0].gain) + " dB";
    			if (dirty & /*data*/ 1) sliderlabel3_changes.value = DbToLog(/*data*/ ctx[0].gain);
    			if (dirty & /*SendValue*/ 2) sliderlabel3_changes.Handler = /*func_3*/ ctx[6];
    			sliderlabel3.$set(sliderlabel3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sliderlabel0.$$.fragment, local);
    			transition_in(sliderlabel1.$$.fragment, local);
    			transition_in(sliderlabel2.$$.fragment, local);
    			transition_in(sliderlabel3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sliderlabel0.$$.fragment, local);
    			transition_out(sliderlabel1.$$.fragment, local);
    			transition_out(sliderlabel2.$$.fragment, local);
    			transition_out(sliderlabel3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			destroy_component(sliderlabel0);
    			destroy_component(sliderlabel1);
    			destroy_component(sliderlabel2);
    			destroy_component(sliderlabel3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { data = undefined } = $$props;
    	let { SendValue = undefined } = $$props;
    	let { index = 0 } = $$props;
    	const writable_props = ["data", "SendValue", "index"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Channel> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Channel", $$slots, []);
    	const func = _v => SendValue("pan", _v * 100);
    	const func_1 = _v => SendValue("sendReverb", LogToDb(_v));
    	const func_2 = _v => SendValue("sendDelay", LogToDb(_v));
    	const func_3 = _v => SendValue("gain", LogToDb(_v));

    	$$self.$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("SendValue" in $$props) $$invalidate(1, SendValue = $$props.SendValue);
    		if ("index" in $$props) $$invalidate(2, index = $$props.index);
    	};

    	$$self.$capture_state = () => ({
    		SliderLabel,
    		Slider,
    		DbToLog,
    		LogToDb,
    		FormatPan,
    		data,
    		SendValue,
    		index
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("SendValue" in $$props) $$invalidate(1, SendValue = $$props.SendValue);
    		if ("index" in $$props) $$invalidate(2, index = $$props.index);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data, SendValue, index, func, func_1, func_2, func_3];
    }

    class Channel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { data: 0, SendValue: 1, index: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Channel",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get data() {
    		throw new Error("<Channel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Channel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get SendValue() {
    		throw new Error("<Channel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set SendValue(value) {
    		throw new Error("<Channel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<Channel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<Channel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/ReverbSend.svelte generated by Svelte v3.20.1 */
    const file$4 = "src/ReverbSend.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[9] = i;
    	return child_ctx;
    }

    // (70:6) {#each types as type, i}
    function create_each_block(ctx) {
    	let option;
    	let t_value = /*type*/ ctx[7] + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*i*/ ctx[9];
    			option.value = option.__value;
    			add_location(option, file$4, 70, 8, 1472);
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
    		id: create_each_block.name,
    		type: "each",
    		source: "(70:6) {#each types as type, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div5;
    	let i0;
    	let t0;
    	let t1_value = /*index*/ ctx[2] + 1 + "";
    	let t1;
    	let t2;
    	let span;
    	let t4;
    	let div0;
    	let i1;
    	let t6;
    	let select;
    	let option;
    	let t7_value = /*types*/ ctx[3][/*data*/ ctx[0].type] + "";
    	let t7;
    	let option_value_value;
    	let select_value_value;
    	let t8;
    	let div1;
    	let i2;
    	let t10;
    	let t11;
    	let div2;
    	let t12;
    	let div3;
    	let t13;
    	let div4;
    	let i3;
    	let t15;
    	let current;
    	let dispose;
    	let each_value = /*types*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const sliderlabel0 = new SliderLabel({
    			props: {
    				label: (Math.round(/*data*/ ctx[0].rt60 * 100) / 100).toFixed(2) + " s",
    				value: (/*data*/ ctx[0].rt60 - 0.1) / (5 - 0.1),
    				Handler: /*func*/ ctx[5]
    			},
    			$$inline: true
    		});

    	const sliderlabel1 = new SliderLabel({
    			props: {
    				label: Math.round(/*data*/ ctx[0].gain) + " dB",
    				value: DbToLog(/*data*/ ctx[0].gain),
    				Handler: /*func_1*/ ctx[6]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			i0 = element("i");
    			t0 = text("FX ");
    			t1 = text(t1_value);
    			t2 = space();
    			span = element("span");
    			span.textContent = "Reverb";
    			t4 = space();
    			div0 = element("div");
    			i1 = element("i");
    			i1.textContent = "Type:";
    			t6 = space();
    			select = element("select");
    			option = element("option");
    			t7 = text(t7_value);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t8 = space();
    			div1 = element("div");
    			i2 = element("i");
    			i2.textContent = "RT60:";
    			t10 = space();
    			create_component(sliderlabel0.$$.fragment);
    			t11 = space();
    			div2 = element("div");
    			t12 = space();
    			div3 = element("div");
    			t13 = space();
    			div4 = element("div");
    			i3 = element("i");
    			i3.textContent = "Gain:";
    			t15 = space();
    			create_component(sliderlabel1.$$.fragment);
    			attr_dev(i0, "class", "svelte-1fwy9dx");
    			add_location(i0, file$4, 58, 2, 1115);
    			attr_dev(span, "class", "svelte-1fwy9dx");
    			add_location(span, file$4, 59, 2, 1139);
    			add_location(i1, file$4, 61, 4, 1187);
    			set_style(option, "display", "none");
    			option.selected = true;
    			option.__value = option_value_value = /*types*/ ctx[3][/*data*/ ctx[0].type];
    			option.value = option.__value;
    			add_location(option, file$4, 68, 6, 1366);
    			attr_dev(select, "class", "svelte-1fwy9dx");
    			add_location(select, file$4, 62, 4, 1204);
    			attr_dev(div0, "class", "control svelte-1fwy9dx");
    			add_location(div0, file$4, 60, 2, 1161);
    			add_location(i2, file$4, 75, 4, 1571);
    			attr_dev(div1, "class", "control svelte-1fwy9dx");
    			add_location(div1, file$4, 74, 2, 1545);
    			attr_dev(div2, "class", "rest svelte-1fwy9dx");
    			add_location(div2, file$4, 81, 2, 1797);
    			attr_dev(div3, "class", "rest svelte-1fwy9dx");
    			add_location(div3, file$4, 82, 2, 1819);
    			add_location(i3, file$4, 84, 4, 1867);
    			attr_dev(div4, "class", "control svelte-1fwy9dx");
    			add_location(div4, file$4, 83, 2, 1841);
    			attr_dev(div5, "class", "base svelte-1fwy9dx");
    			add_location(div5, file$4, 57, 0, 1094);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, i0);
    			append_dev(i0, t0);
    			append_dev(i0, t1);
    			append_dev(div5, t2);
    			append_dev(div5, span);
    			append_dev(div5, t4);
    			append_dev(div5, div0);
    			append_dev(div0, i1);
    			append_dev(div0, t6);
    			append_dev(div0, select);
    			append_dev(select, option);
    			append_dev(option, t7);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_value_value = /*data*/ ctx[0].type;

    			for (var i = 0; i < select.options.length; i += 1) {
    				var option_1 = select.options[i];

    				if (option_1.__value === select_value_value) {
    					option_1.selected = true;
    					break;
    				}
    			}

    			append_dev(div5, t8);
    			append_dev(div5, div1);
    			append_dev(div1, i2);
    			append_dev(div1, t10);
    			mount_component(sliderlabel0, div1, null);
    			append_dev(div5, t11);
    			append_dev(div5, div2);
    			append_dev(div5, t12);
    			append_dev(div5, div3);
    			append_dev(div5, t13);
    			append_dev(div5, div4);
    			append_dev(div4, i3);
    			append_dev(div4, t15);
    			mount_component(sliderlabel1, div4, null);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(select, "change", /*change_handler*/ ctx[4], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*index*/ 4) && t1_value !== (t1_value = /*index*/ ctx[2] + 1 + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*data*/ 1) && t7_value !== (t7_value = /*types*/ ctx[3][/*data*/ ctx[0].type] + "")) set_data_dev(t7, t7_value);

    			if (!current || dirty & /*data*/ 1 && option_value_value !== (option_value_value = /*types*/ ctx[3][/*data*/ ctx[0].type])) {
    				prop_dev(option, "__value", option_value_value);
    			}

    			option.value = option.__value;

    			if (dirty & /*types*/ 8) {
    				each_value = /*types*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (!current || dirty & /*data*/ 1 && select_value_value !== (select_value_value = /*data*/ ctx[0].type)) {
    				for (var i = 0; i < select.options.length; i += 1) {
    					var option_1 = select.options[i];

    					if (option_1.__value === select_value_value) {
    						option_1.selected = true;
    						break;
    					}
    				}
    			}

    			const sliderlabel0_changes = {};
    			if (dirty & /*data*/ 1) sliderlabel0_changes.label = (Math.round(/*data*/ ctx[0].rt60 * 100) / 100).toFixed(2) + " s";
    			if (dirty & /*data*/ 1) sliderlabel0_changes.value = (/*data*/ ctx[0].rt60 - 0.1) / (5 - 0.1);
    			if (dirty & /*SendValue*/ 2) sliderlabel0_changes.Handler = /*func*/ ctx[5];
    			sliderlabel0.$set(sliderlabel0_changes);
    			const sliderlabel1_changes = {};
    			if (dirty & /*data*/ 1) sliderlabel1_changes.label = Math.round(/*data*/ ctx[0].gain) + " dB";
    			if (dirty & /*data*/ 1) sliderlabel1_changes.value = DbToLog(/*data*/ ctx[0].gain);
    			if (dirty & /*SendValue*/ 2) sliderlabel1_changes.Handler = /*func_1*/ ctx[6];
    			sliderlabel1.$set(sliderlabel1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sliderlabel0.$$.fragment, local);
    			transition_in(sliderlabel1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sliderlabel0.$$.fragment, local);
    			transition_out(sliderlabel1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			destroy_each(each_blocks, detaching);
    			destroy_component(sliderlabel0);
    			destroy_component(sliderlabel1);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { data = undefined } = $$props;
    	let { SendValue = undefined } = $$props;
    	let { index = 0 } = $$props;
    	let types = ["ST Rev", "Prog", "Z Rev", "N Rev"];
    	const writable_props = ["data", "SendValue", "index"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ReverbSend> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ReverbSend", $$slots, []);

    	const change_handler = _e => {
    		SendValue("type", Number(_e.target.value));
    		_e.target.selectedIndex = 0;
    	};

    	const func = _v => SendValue("rt60", 0.1 + _v * (5 - 0.1));
    	const func_1 = _v => SendValue("gain", LogToDb(_v));

    	$$self.$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("SendValue" in $$props) $$invalidate(1, SendValue = $$props.SendValue);
    		if ("index" in $$props) $$invalidate(2, index = $$props.index);
    	};

    	$$self.$capture_state = () => ({
    		SliderLabel,
    		Slider,
    		DbToLog,
    		LogToDb,
    		FormatPan,
    		data,
    		SendValue,
    		index,
    		types
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("SendValue" in $$props) $$invalidate(1, SendValue = $$props.SendValue);
    		if ("index" in $$props) $$invalidate(2, index = $$props.index);
    		if ("types" in $$props) $$invalidate(3, types = $$props.types);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data, SendValue, index, types, change_handler, func, func_1];
    }

    class ReverbSend extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { data: 0, SendValue: 1, index: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ReverbSend",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get data() {
    		throw new Error("<ReverbSend>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<ReverbSend>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get SendValue() {
    		throw new Error("<ReverbSend>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set SendValue(value) {
    		throw new Error("<ReverbSend>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<ReverbSend>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<ReverbSend>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/DelaySend.svelte generated by Svelte v3.20.1 */
    const file$5 = "src/DelaySend.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (69:6) {#each types as type, i}
    function create_each_block$1(ctx) {
    	let option;
    	let t_value = /*type*/ ctx[8] + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*i*/ ctx[10];
    			option.value = option.__value;
    			add_location(option, file$5, 69, 8, 1468);
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
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(69:6) {#each types as type, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div5;
    	let i0;
    	let t0;
    	let t1_value = /*index*/ ctx[2] + 1 + "";
    	let t1;
    	let t2;
    	let span;
    	let t4;
    	let div0;
    	let i1;
    	let t6;
    	let select;
    	let option;
    	let t7_value = /*types*/ ctx[3][/*data*/ ctx[0].type] + "";
    	let t7;
    	let option_value_value;
    	let select_value_value;
    	let t8;
    	let div1;
    	let i2;
    	let t10;
    	let t11;
    	let div2;
    	let i3;
    	let t13;
    	let t14;
    	let div3;
    	let t15;
    	let div4;
    	let i4;
    	let t17;
    	let current;
    	let dispose;
    	let each_value = /*types*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const sliderlabel0 = new SliderLabel({
    			props: {
    				label: (Math.round(/*data*/ ctx[0].delay * 100) / 100).toFixed(2) + " s",
    				value: (/*data*/ ctx[0].delay - 0.1) / (5 - 0.1),
    				Handler: /*func*/ ctx[5]
    			},
    			$$inline: true
    		});

    	const sliderlabel1 = new SliderLabel({
    			props: {
    				label: Math.round(/*data*/ ctx[0].feedback) + " dB",
    				value: DbToLog(/*data*/ ctx[0].feedback),
    				Handler: /*func_1*/ ctx[6]
    			},
    			$$inline: true
    		});

    	const sliderlabel2 = new SliderLabel({
    			props: {
    				label: Math.round(/*data*/ ctx[0].gain) + " dB",
    				value: DbToLog(/*data*/ ctx[0].gain),
    				Handler: /*func_2*/ ctx[7]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			i0 = element("i");
    			t0 = text("FX ");
    			t1 = text(t1_value);
    			t2 = space();
    			span = element("span");
    			span.textContent = "Delay";
    			t4 = space();
    			div0 = element("div");
    			i1 = element("i");
    			i1.textContent = "Type:";
    			t6 = space();
    			select = element("select");
    			option = element("option");
    			t7 = text(t7_value);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t8 = space();
    			div1 = element("div");
    			i2 = element("i");
    			i2.textContent = "Delay:";
    			t10 = space();
    			create_component(sliderlabel0.$$.fragment);
    			t11 = space();
    			div2 = element("div");
    			i3 = element("i");
    			i3.textContent = "Feedback:";
    			t13 = space();
    			create_component(sliderlabel1.$$.fragment);
    			t14 = space();
    			div3 = element("div");
    			t15 = space();
    			div4 = element("div");
    			i4 = element("i");
    			i4.textContent = "Gain:";
    			t17 = space();
    			create_component(sliderlabel2.$$.fragment);
    			attr_dev(i0, "class", "svelte-9xz6oa");
    			add_location(i0, file$5, 57, 2, 1112);
    			attr_dev(span, "class", "svelte-9xz6oa");
    			add_location(span, file$5, 58, 2, 1136);
    			add_location(i1, file$5, 60, 4, 1183);
    			set_style(option, "display", "none");
    			option.selected = true;
    			option.__value = option_value_value = /*types*/ ctx[3][/*data*/ ctx[0].type];
    			option.value = option.__value;
    			add_location(option, file$5, 67, 6, 1362);
    			attr_dev(select, "class", "svelte-9xz6oa");
    			add_location(select, file$5, 61, 4, 1200);
    			attr_dev(div0, "class", "control svelte-9xz6oa");
    			add_location(div0, file$5, 59, 2, 1157);
    			add_location(i2, file$5, 74, 4, 1567);
    			attr_dev(div1, "class", "control svelte-9xz6oa");
    			add_location(div1, file$5, 73, 2, 1541);
    			add_location(i3, file$5, 81, 4, 1823);
    			attr_dev(div2, "class", "control svelte-9xz6oa");
    			add_location(div2, file$5, 80, 2, 1797);
    			attr_dev(div3, "class", "rest svelte-9xz6oa");
    			add_location(div3, file$5, 87, 2, 2013);
    			add_location(i4, file$5, 89, 4, 2061);
    			attr_dev(div4, "class", "control svelte-9xz6oa");
    			add_location(div4, file$5, 88, 2, 2035);
    			attr_dev(div5, "class", "base svelte-9xz6oa");
    			add_location(div5, file$5, 56, 0, 1091);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, i0);
    			append_dev(i0, t0);
    			append_dev(i0, t1);
    			append_dev(div5, t2);
    			append_dev(div5, span);
    			append_dev(div5, t4);
    			append_dev(div5, div0);
    			append_dev(div0, i1);
    			append_dev(div0, t6);
    			append_dev(div0, select);
    			append_dev(select, option);
    			append_dev(option, t7);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_value_value = /*data*/ ctx[0].type;

    			for (var i = 0; i < select.options.length; i += 1) {
    				var option_1 = select.options[i];

    				if (option_1.__value === select_value_value) {
    					option_1.selected = true;
    					break;
    				}
    			}

    			append_dev(div5, t8);
    			append_dev(div5, div1);
    			append_dev(div1, i2);
    			append_dev(div1, t10);
    			mount_component(sliderlabel0, div1, null);
    			append_dev(div5, t11);
    			append_dev(div5, div2);
    			append_dev(div2, i3);
    			append_dev(div2, t13);
    			mount_component(sliderlabel1, div2, null);
    			append_dev(div5, t14);
    			append_dev(div5, div3);
    			append_dev(div5, t15);
    			append_dev(div5, div4);
    			append_dev(div4, i4);
    			append_dev(div4, t17);
    			mount_component(sliderlabel2, div4, null);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(select, "change", /*change_handler*/ ctx[4], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*index*/ 4) && t1_value !== (t1_value = /*index*/ ctx[2] + 1 + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*data*/ 1) && t7_value !== (t7_value = /*types*/ ctx[3][/*data*/ ctx[0].type] + "")) set_data_dev(t7, t7_value);

    			if (!current || dirty & /*data*/ 1 && option_value_value !== (option_value_value = /*types*/ ctx[3][/*data*/ ctx[0].type])) {
    				prop_dev(option, "__value", option_value_value);
    			}

    			option.value = option.__value;

    			if (dirty & /*types*/ 8) {
    				each_value = /*types*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (!current || dirty & /*data*/ 1 && select_value_value !== (select_value_value = /*data*/ ctx[0].type)) {
    				for (var i = 0; i < select.options.length; i += 1) {
    					var option_1 = select.options[i];

    					if (option_1.__value === select_value_value) {
    						option_1.selected = true;
    						break;
    					}
    				}
    			}

    			const sliderlabel0_changes = {};
    			if (dirty & /*data*/ 1) sliderlabel0_changes.label = (Math.round(/*data*/ ctx[0].delay * 100) / 100).toFixed(2) + " s";
    			if (dirty & /*data*/ 1) sliderlabel0_changes.value = (/*data*/ ctx[0].delay - 0.1) / (5 - 0.1);
    			if (dirty & /*SendValue*/ 2) sliderlabel0_changes.Handler = /*func*/ ctx[5];
    			sliderlabel0.$set(sliderlabel0_changes);
    			const sliderlabel1_changes = {};
    			if (dirty & /*data*/ 1) sliderlabel1_changes.label = Math.round(/*data*/ ctx[0].feedback) + " dB";
    			if (dirty & /*data*/ 1) sliderlabel1_changes.value = DbToLog(/*data*/ ctx[0].feedback);
    			if (dirty & /*SendValue*/ 2) sliderlabel1_changes.Handler = /*func_1*/ ctx[6];
    			sliderlabel1.$set(sliderlabel1_changes);
    			const sliderlabel2_changes = {};
    			if (dirty & /*data*/ 1) sliderlabel2_changes.label = Math.round(/*data*/ ctx[0].gain) + " dB";
    			if (dirty & /*data*/ 1) sliderlabel2_changes.value = DbToLog(/*data*/ ctx[0].gain);
    			if (dirty & /*SendValue*/ 2) sliderlabel2_changes.Handler = /*func_2*/ ctx[7];
    			sliderlabel2.$set(sliderlabel2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sliderlabel0.$$.fragment, local);
    			transition_in(sliderlabel1.$$.fragment, local);
    			transition_in(sliderlabel2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sliderlabel0.$$.fragment, local);
    			transition_out(sliderlabel1.$$.fragment, local);
    			transition_out(sliderlabel2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			destroy_each(each_blocks, detaching);
    			destroy_component(sliderlabel0);
    			destroy_component(sliderlabel1);
    			destroy_component(sliderlabel2);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { data = undefined } = $$props;
    	let { SendValue = undefined } = $$props;
    	let { index = 0 } = $$props;
    	let types = ["Digital", "Analog", "Ping Pong"];
    	const writable_props = ["data", "SendValue", "index"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DelaySend> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("DelaySend", $$slots, []);

    	const change_handler = _e => {
    		SendValue("type", Number(_e.target.value));
    		_e.target.selectedIndex = 0;
    	};

    	const func = _v => SendValue("delay", 0.1 + _v * (5 - 0.1));
    	const func_1 = _v => SendValue("feedback", LogToDb(_v));
    	const func_2 = _v => SendValue("gain", LogToDb(_v));

    	$$self.$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("SendValue" in $$props) $$invalidate(1, SendValue = $$props.SendValue);
    		if ("index" in $$props) $$invalidate(2, index = $$props.index);
    	};

    	$$self.$capture_state = () => ({
    		SliderLabel,
    		Slider,
    		DbToLog,
    		LogToDb,
    		FormatPan,
    		data,
    		SendValue,
    		index,
    		types
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("SendValue" in $$props) $$invalidate(1, SendValue = $$props.SendValue);
    		if ("index" in $$props) $$invalidate(2, index = $$props.index);
    		if ("types" in $$props) $$invalidate(3, types = $$props.types);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data, SendValue, index, types, change_handler, func, func_1, func_2];
    }

    class DelaySend extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { data: 0, SendValue: 1, index: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DelaySend",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get data() {
    		throw new Error("<DelaySend>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<DelaySend>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get SendValue() {
    		throw new Error("<DelaySend>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set SendValue(value) {
    		throw new Error("<DelaySend>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<DelaySend>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<DelaySend>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.20.1 */

    const { console: console_1$2 } = globals;
    const file$6 = "src/App.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	child_ctx[18] = i;
    	return child_ctx;
    }

    // (153:2) {#if data != undefined}
    function create_if_block$2(ctx) {
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let t2;
    	let t3;
    	let div3;
    	let current;

    	const settings = new Settings({
    			props: {
    				data: /*data*/ ctx[0],
    				SendValue: /*SendValue*/ ctx[1],
    				SendMsg: /*SendMsg*/ ctx[2]
    			},
    			$$inline: true
    		});

    	let each_value = /*data*/ ctx[0].channels;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const reverbsend = new ReverbSend({
    			props: {
    				index: 0,
    				data: /*data*/ ctx[0].reverb,
    				SendValue: /*func_1*/ ctx[13]
    			},
    			$$inline: true
    		});

    	const delaysend = new DelaySend({
    			props: {
    				index: 1,
    				data: /*data*/ ctx[0].delay,
    				SendValue: /*func_2*/ ctx[14]
    			},
    			$$inline: true
    		});

    	let if_block = /*data*/ ctx[0] != undefined && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			create_component(settings.$$.fragment);
    			t0 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			div2 = element("div");
    			create_component(reverbsend.$$.fragment);
    			t2 = space();
    			create_component(delaysend.$$.fragment);
    			t3 = space();
    			div3 = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "settings svelte-1amniun");
    			add_location(div0, file$6, 153, 4, 3690);
    			attr_dev(div1, "class", "channels svelte-1amniun");
    			add_location(div1, file$6, 156, 4, 3776);
    			attr_dev(div2, "class", "sends svelte-1amniun");
    			add_location(div2, file$6, 164, 4, 3992);
    			attr_dev(div3, "class", "master svelte-1amniun");
    			add_location(div3, file$6, 174, 4, 4280);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			mount_component(settings, div0, null);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			insert_dev(target, t1, anchor);
    			insert_dev(target, div2, anchor);
    			mount_component(reverbsend, div2, null);
    			append_dev(div2, t2);
    			mount_component(delaysend, div2, null);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div3, anchor);
    			if (if_block) if_block.m(div3, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const settings_changes = {};
    			if (dirty & /*data*/ 1) settings_changes.data = /*data*/ ctx[0];
    			settings.$set(settings_changes);

    			if (dirty & /*data, SendValue*/ 3) {
    				each_value = /*data*/ ctx[0].channels;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			const reverbsend_changes = {};
    			if (dirty & /*data*/ 1) reverbsend_changes.data = /*data*/ ctx[0].reverb;
    			reverbsend.$set(reverbsend_changes);
    			const delaysend_changes = {};
    			if (dirty & /*data*/ 1) delaysend_changes.data = /*data*/ ctx[0].delay;
    			delaysend.$set(delaysend_changes);

    			if (/*data*/ ctx[0] != undefined) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div3, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(settings.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(reverbsend.$$.fragment, local);
    			transition_in(delaysend.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(settings.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(reverbsend.$$.fragment, local);
    			transition_out(delaysend.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(settings);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div2);
    			destroy_component(reverbsend);
    			destroy_component(delaysend);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div3);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(153:2) {#if data != undefined}",
    		ctx
    	});

    	return block;
    }

    // (158:6) {#each data.channels as chan, i}
    function create_each_block$2(ctx) {
    	let current;

    	function func(...args) {
    		return /*func*/ ctx[12](/*i*/ ctx[18], ...args);
    	}

    	const channel = new Channel({
    			props: {
    				index: /*i*/ ctx[18],
    				data: /*chan*/ ctx[16],
    				SendValue: func
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(channel.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(channel, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const channel_changes = {};
    			if (dirty & /*data*/ 1) channel_changes.data = /*chan*/ ctx[16];
    			channel.$set(channel_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(channel.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(channel.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(channel, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(158:6) {#each data.channels as chan, i}",
    		ctx
    	});

    	return block;
    }

    // (176:6) {#if data != undefined}
    function create_if_block_1$1(ctx) {
    	let current;

    	const slider = new Slider({
    			props: {
    				vertical: true,
    				value: DbToLog(/*data*/ ctx[0].gain),
    				Handler: /*func_3*/ ctx[15]
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
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(176:6) {#if data != undefined}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div;
    	let current;
    	let if_block = /*data*/ ctx[0] != undefined && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "base svelte-1amniun");
    			add_location(div, file$6, 151, 0, 3641);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*data*/ ctx[0] != undefined) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
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

    	function SendMsg(_msgType, _section, _data) {
    		let _msg = {
    			msgType: _msgType,
    			section: _section,
    			data: _data
    		};

    		if (socketConnected) {
    			socket.send(JSON.stringify(_msg));
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
    	const func = (i, t, v) => SendValue(i, "channels", t, v);
    	const func_1 = (t, v) => SendValue(null, "reverb", t, v);
    	const func_2 = (t, v) => SendValue(null, "delay", t, v);
    	const func_3 = _v => SendValue(undefined, "master", "gain", LogToDb(_v));

    	$$self.$set = $$props => {
    		if ("name" in $$props) $$invalidate(3, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		DbToLog,
    		LogToDb,
    		Settings,
    		Slider,
    		SliderLabel,
    		Channel,
    		ReverbSend,
    		DelaySend,
    		name,
    		port,
    		socket,
    		socketConnected,
    		gain,
    		data,
    		revTypes,
    		SendValue,
    		RecvMsg,
    		SendMsg,
    		Connect,
    		AddChannel
    	});

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(3, name = $$props.name);
    		if ("port" in $$props) port = $$props.port;
    		if ("socket" in $$props) socket = $$props.socket;
    		if ("socketConnected" in $$props) socketConnected = $$props.socketConnected;
    		if ("gain" in $$props) gain = $$props.gain;
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("revTypes" in $$props) revTypes = $$props.revTypes;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		data,
    		SendValue,
    		SendMsg,
    		name,
    		socket,
    		socketConnected,
    		port,
    		gain,
    		revTypes,
    		RecvMsg,
    		Connect,
    		AddChannel,
    		func,
    		func_1,
    		func_2,
    		func_3
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { name: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[3] === undefined && !("name" in props)) {
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
