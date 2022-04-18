
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
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
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active$1 = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active$1 += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active$1 -= deleted;
            if (!active$1)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active$1)
                return;
            managed_styles.forEach(info => {
                const { stylesheet } = info;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                info.rules = {};
            });
            managed_styles.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
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
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
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
        seen_callbacks.clear();
        set_current_component(saved_component);
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

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
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
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function each(items, fn) {
        let str = '';
        for (let i = 0; i < items.length; i += 1) {
            str += fn(items[i], i);
        }
        return str;
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
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
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
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
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.47.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
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
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /**
     * @typedef {Object} WrappedComponent Object returned by the `wrap` method
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback AsyncSvelteComponent
     * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions Options object for the call to `wrap`
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap$1(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function parse(str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.47.0 */

    const { Error: Error_1$2, Object: Object_1, console: console_1$3 } = globals;

    // (251:0) {:else}
    function create_else_block$2(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(251:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (244:0) {#if componentParams}
    function create_if_block$3(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(244:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$3, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1$2("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
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
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn('Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading');

    	return wrap$1({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf('#/');

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: '/';

    	// Check if there's a querystring
    	const qsPosition = location.indexOf('?');

    	let querystring = '';

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener('hashchange', update, false);

    	return function stop() {
    		window.removeEventListener('hashchange', update, false);
    	};
    });

    const location$1 = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);
    const params = writable(undefined);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == '#' ? '' : '#') + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == '#' ? '' : '#') + location;

    	try {
    		const newState = { ...history.state };
    		delete newState['__svelte_spa_router_scrollX'];
    		delete newState['__svelte_spa_router_scrollY'];
    		window.history.replaceState(newState, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn('Caught exception while replacing the current page. If you\'re running this in the Svelte REPL, please note that the `replace` method might not work in this environment.');
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event('hashchange'));
    }

    function link(node, opts) {
    	opts = linkOpts(opts);

    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != 'a') {
    		throw Error('Action "link" can only be used with <a> tags');
    	}

    	updateLink(node, opts);

    	return {
    		update(updated) {
    			updated = linkOpts(updated);
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, opts) {
    	let href = opts.href || node.getAttribute('href');

    	// Destination must start with '/' or '#/'
    	if (href && href.charAt(0) == '/') {
    		// Add # to the href attribute
    		href = '#' + href;
    	} else if (!href || href.length < 2 || href.slice(0, 2) != '#/') {
    		throw Error('Invalid value for "href" attribute: ' + href);
    	}

    	node.setAttribute('href', href);

    	node.addEventListener('click', event => {
    		// Prevent default anchor onclick behaviour
    		event.preventDefault();

    		if (!opts.disabled) {
    			scrollstateHistoryHandler(event.currentTarget.getAttribute('href'));
    		}
    	});
    }

    // Internal function that ensures the argument of the link action is always an object
    function linkOpts(val) {
    	if (val && typeof val == 'string') {
    		return { href: val };
    	} else {
    		return val || {};
    	}
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {string} href - Destination
     */
    function scrollstateHistoryHandler(href) {
    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Router', slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = '' } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != 'function' && (typeof component != 'object' || component._sveltesparouter !== true)) {
    				throw Error('Invalid component object');
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == 'string' && (path.length < 1 || path.charAt(0) != '/' && path.charAt(0) != '*') || typeof path == 'object' && !(path instanceof RegExp)) {
    				throw Error('Invalid value for "path" argument - strings must start with / or *');
    			}

    			const { pattern, keys } = parse(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == 'object' && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, check if it matches the start of the path.
    			// If not, bail early, else remove it before we run the matching.
    			if (prefix) {
    				if (typeof prefix == 'string') {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || '/';
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || '/';
    					} else {
    						return null;
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || '') || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {boolean} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	let popStateChanged = null;

    	if (restoreScrollState) {
    		popStateChanged = event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.__svelte_spa_router_scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		};

    		// This is removed in the destroy() invocation below
    		window.addEventListener('popstate', popStateChanged);

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.__svelte_spa_router_scrollX, previousScrollState.__svelte_spa_router_scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	const unsubscribeLoc = loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData,
    				params: match && typeof match == 'object' && Object.keys(match).length
    				? match
    				: null
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick('conditionsFailed', detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoading', Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    						component,
    						name: component.name,
    						params: componentParams
    					}));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == 'object' && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    				component,
    				name: component.name,
    				params: componentParams
    			})).then(() => {
    				params.set(componentParams);
    			});

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    		params.set(undefined);
    	});

    	onDestroy(() => {
    		unsubscribeLoc();
    		popStateChanged && window.removeEventListener('popstate', popStateChanged);
    	});

    	const writable_props = ['routes', 'prefix', 'restoreScrollState'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$3.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		writable,
    		derived,
    		tick,
    		_wrap: wrap$1,
    		wrap,
    		getLocation,
    		loc,
    		location: location$1,
    		querystring,
    		params,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		linkOpts,
    		scrollstateHistoryHandler,
    		onDestroy,
    		createEventDispatcher,
    		afterUpdate,
    		parse,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		popStateChanged,
    		lastLoc,
    		componentObj,
    		unsubscribeLoc
    	});

    	$$self.$inject_state = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ('component' in $$props) $$invalidate(0, component = $$props.component);
    		if ('componentParams' in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ('props' in $$props) $$invalidate(2, props = $$props.props);
    		if ('previousScrollState' in $$props) previousScrollState = $$props.previousScrollState;
    		if ('popStateChanged' in $$props) popStateChanged = $$props.popStateChanged;
    		if ('lastLoc' in $$props) lastLoc = $$props.lastLoc;
    		if ('componentObj' in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			history.scrollRestoration = restoreScrollState ? 'manual' : 'auto';
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get routes() {
    		throw new Error_1$2("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1$2("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1$2("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1$2("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1$2("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1$2("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    // List of nodes to update
    const nodes = [];

    // Current location
    let location;

    // Function that updates all nodes marking the active ones
    function checkActive(el) {
        const matchesLocation = el.pattern.test(location);
        toggleClasses(el, el.className, matchesLocation);
        toggleClasses(el, el.inactiveClassName, !matchesLocation);
    }

    function toggleClasses(el, className, shouldAdd) {
        (className || '').split(' ').forEach((cls) => {
            if (!cls) {
                return
            }
            // Remove the class firsts
            el.node.classList.remove(cls);

            // If the pattern doesn't match, then set the class
            if (shouldAdd) {
                el.node.classList.add(cls);
            }
        });
    }

    // Listen to changes in the location
    loc.subscribe((value) => {
        // Update the location
        location = value.location + (value.querystring ? '?' + value.querystring : '');

        // Update all nodes
        nodes.map(checkActive);
    });

    /**
     * @typedef {Object} ActiveOptions
     * @property {string|RegExp} [path] - Path expression that makes the link active when matched (must start with '/' or '*'); default is the link's href
     * @property {string} [className] - CSS class to apply to the element when active; default value is "active"
     */

    /**
     * Svelte Action for automatically adding the "active" class to elements (links, or any other DOM element) when the current location matches a certain path.
     * 
     * @param {HTMLElement} node - The target node (automatically set by Svelte)
     * @param {ActiveOptions|string|RegExp} [opts] - Can be an object of type ActiveOptions, or a string (or regular expressions) representing ActiveOptions.path.
     * @returns {{destroy: function(): void}} Destroy function
     */
    function active(node, opts) {
        // Check options
        if (opts && (typeof opts == 'string' || (typeof opts == 'object' && opts instanceof RegExp))) {
            // Interpret strings and regular expressions as opts.path
            opts = {
                path: opts
            };
        }
        else {
            // Ensure opts is a dictionary
            opts = opts || {};
        }

        // Path defaults to link target
        if (!opts.path && node.hasAttribute('href')) {
            opts.path = node.getAttribute('href');
            if (opts.path && opts.path.length > 1 && opts.path.charAt(0) == '#') {
                opts.path = opts.path.substring(1);
            }
        }

        // Default class name
        if (!opts.className) {
            opts.className = 'active';
        }

        // If path is a string, it must start with '/' or '*'
        if (!opts.path || 
            typeof opts.path == 'string' && (opts.path.length < 1 || (opts.path.charAt(0) != '/' && opts.path.charAt(0) != '*'))
        ) {
            throw Error('Invalid value for "path" argument')
        }

        // If path is not a regular expression already, make it
        const {pattern} = typeof opts.path == 'string' ?
            parse(opts.path) :
            {pattern: opts.path};

        // Add the node to the list
        const el = {
            node,
            className: opts.className,
            inactiveClassName: opts.inactiveClassName,
            pattern
        };
        nodes.push(el);

        // Trigger the action right away
        checkActive(el);

        return {
            // When the element is destroyed, remove it from the list
            destroy() {
                nodes.splice(nodes.indexOf(el), 1);
            }
        }
    }

    /*
    Adapted from https://github.com/mattdesl
    Distributed under MIT License https://github.com/mattdesl/eases/blob/master/LICENSE.md
    */
    function backInOut(t) {
        const s = 1.70158 * 1.525;
        if ((t *= 2) < 1)
            return 0.5 * (t * t * ((s + 1) * t - s));
        return 0.5 * ((t -= 2) * t * ((s + 1) * t + s) + 2);
    }
    function backIn(t) {
        const s = 1.70158;
        return t * t * ((s + 1) * t - s);
    }
    function backOut(t) {
        const s = 1.70158;
        return --t * t * ((s + 1) * t + s) + 1;
    }
    function bounceOut(t) {
        const a = 4.0 / 11.0;
        const b = 8.0 / 11.0;
        const c = 9.0 / 10.0;
        const ca = 4356.0 / 361.0;
        const cb = 35442.0 / 1805.0;
        const cc = 16061.0 / 1805.0;
        const t2 = t * t;
        return t < a
            ? 7.5625 * t2
            : t < b
                ? 9.075 * t2 - 9.9 * t + 3.4
                : t < c
                    ? ca * t2 - cb * t + cc
                    : 10.8 * t * t - 20.52 * t + 10.72;
    }
    function bounceInOut(t) {
        return t < 0.5
            ? 0.5 * (1.0 - bounceOut(1.0 - t * 2.0))
            : 0.5 * bounceOut(t * 2.0 - 1.0) + 0.5;
    }
    function bounceIn(t) {
        return 1.0 - bounceOut(1.0 - t);
    }
    function circInOut(t) {
        if ((t *= 2) < 1)
            return -0.5 * (Math.sqrt(1 - t * t) - 1);
        return 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1);
    }
    function circIn(t) {
        return 1.0 - Math.sqrt(1.0 - t * t);
    }
    function circOut(t) {
        return Math.sqrt(1 - --t * t);
    }
    function cubicInOut(t) {
        return t < 0.5 ? 4.0 * t * t * t : 0.5 * Math.pow(2.0 * t - 2.0, 3.0) + 1.0;
    }
    function cubicIn(t) {
        return t * t * t;
    }
    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }
    function elasticInOut(t) {
        return t < 0.5
            ? 0.5 *
                Math.sin(((+13.0 * Math.PI) / 2) * 2.0 * t) *
                Math.pow(2.0, 10.0 * (2.0 * t - 1.0))
            : 0.5 *
                Math.sin(((-13.0 * Math.PI) / 2) * (2.0 * t - 1.0 + 1.0)) *
                Math.pow(2.0, -10.0 * (2.0 * t - 1.0)) +
                1.0;
    }
    function elasticIn(t) {
        return Math.sin((13.0 * t * Math.PI) / 2) * Math.pow(2.0, 10.0 * (t - 1.0));
    }
    function elasticOut(t) {
        return (Math.sin((-13.0 * (t + 1.0) * Math.PI) / 2) * Math.pow(2.0, -10.0 * t) + 1.0);
    }
    function expoInOut(t) {
        return t === 0.0 || t === 1.0
            ? t
            : t < 0.5
                ? +0.5 * Math.pow(2.0, 20.0 * t - 10.0)
                : -0.5 * Math.pow(2.0, 10.0 - t * 20.0) + 1.0;
    }
    function expoIn(t) {
        return t === 0.0 ? t : Math.pow(2.0, 10.0 * (t - 1.0));
    }
    function expoOut(t) {
        return t === 1.0 ? t : 1.0 - Math.pow(2.0, -10.0 * t);
    }
    function quadInOut(t) {
        t /= 0.5;
        if (t < 1)
            return 0.5 * t * t;
        t--;
        return -0.5 * (t * (t - 2) - 1);
    }
    function quadIn(t) {
        return t * t;
    }
    function quadOut(t) {
        return -t * (t - 2.0);
    }
    function quartInOut(t) {
        return t < 0.5
            ? +8.0 * Math.pow(t, 4.0)
            : -8.0 * Math.pow(t - 1.0, 4.0) + 1.0;
    }
    function quartIn(t) {
        return Math.pow(t, 4.0);
    }
    function quartOut(t) {
        return Math.pow(t - 1.0, 3.0) * (1.0 - t) + 1.0;
    }
    function quintInOut(t) {
        if ((t *= 2) < 1)
            return 0.5 * t * t * t * t * t;
        return 0.5 * ((t -= 2) * t * t * t * t + 2);
    }
    function quintIn(t) {
        return t * t * t * t * t;
    }
    function quintOut(t) {
        return --t * t * t * t * t + 1;
    }
    function sineInOut(t) {
        return -0.5 * (Math.cos(Math.PI * t) - 1);
    }
    function sineIn(t) {
        const v = Math.cos(t * Math.PI * 0.5);
        if (Math.abs(v) < 1e-14)
            return 1;
        else
            return 1 - v;
    }
    function sineOut(t) {
        return Math.sin((t * Math.PI) / 2);
    }

    var eases = /*#__PURE__*/Object.freeze({
        __proto__: null,
        backIn: backIn,
        backInOut: backInOut,
        backOut: backOut,
        bounceIn: bounceIn,
        bounceInOut: bounceInOut,
        bounceOut: bounceOut,
        circIn: circIn,
        circInOut: circInOut,
        circOut: circOut,
        cubicIn: cubicIn,
        cubicInOut: cubicInOut,
        cubicOut: cubicOut,
        elasticIn: elasticIn,
        elasticInOut: elasticInOut,
        elasticOut: elasticOut,
        expoIn: expoIn,
        expoInOut: expoInOut,
        expoOut: expoOut,
        quadIn: quadIn,
        quadInOut: quadInOut,
        quadOut: quadOut,
        quartIn: quartIn,
        quartInOut: quartInOut,
        quartOut: quartOut,
        quintIn: quintIn,
        quintInOut: quintInOut,
        quintOut: quintOut,
        sineIn: sineIn,
        sineInOut: sineInOut,
        sineOut: sineOut,
        linear: identity
    });

    function blur(node, { delay = 0, duration = 400, easing = cubicInOut, amount = 5, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const f = style.filter === 'none' ? '' : style.filter;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `opacity: ${target_opacity - (od * u)}; filter: ${f} blur(${u * amount}px);`
        };
    }
    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }
    function slide(node, { delay = 0, duration = 400, easing = cubicOut } = {}) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => 'overflow: hidden;' +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }
    function scale(node, { delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const sd = 1 - start;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `
			transform: ${transform} scale(${1 - (sd * u)});
			opacity: ${target_opacity - (od * u)}
		`
        };
    }

    /* src/routes/Home/Pagination.svelte generated by Svelte v3.47.0 */
    const file$6 = "src/routes/Home/Pagination.svelte";

    function create_fragment$7(ctx) {
    	let nav;
    	let ul;
    	let li0;
    	let a0;
    	let t0;
    	let a0_href_value;
    	let li0_class_value;
    	let t1;
    	let li1;
    	let a1;
    	let t2;
    	let a1_href_value;
    	let t3;
    	let li2;
    	let span1;
    	let t4;
    	let t5;
    	let span0;
    	let t6;
    	let t7;
    	let li3;
    	let a2;
    	let t8;
    	let a2_href_value;
    	let t9;
    	let li4;
    	let a3;
    	let t10;
    	let a3_href_value;
    	let li4_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			t0 = text("Previous");
    			t1 = space();
    			li1 = element("li");
    			a1 = element("a");
    			t2 = text("1");
    			t3 = space();
    			li2 = element("li");
    			span1 = element("span");
    			t4 = text(/*currentPage*/ ctx[0]);
    			t5 = space();
    			span0 = element("span");
    			t6 = text(/*currentPage*/ ctx[0]);
    			t7 = space();
    			li3 = element("li");
    			a2 = element("a");
    			t8 = text(/*allPages*/ ctx[1]);
    			t9 = space();
    			li4 = element("li");
    			a3 = element("a");
    			t10 = text("Next");
    			attr_dev(a0, "class", "page-link");
    			attr_dev(a0, "href", a0_href_value = "/" + (/*text*/ ctx[2] + /*previous*/ ctx[3]));
    			add_location(a0, file$6, 17, 14, 495);
    			attr_dev(li0, "class", li0_class_value = "page-item " + (/*currentPage*/ ctx[0] === 1 ? 'disabled' : ''));
    			add_location(li0, file$6, 16, 12, 420);
    			attr_dev(a1, "class", "page-link");
    			attr_dev(a1, "href", a1_href_value = "/" + /*text*/ ctx[2] + "1");
    			add_location(a1, file$6, 19, 34, 614);
    			attr_dev(li1, "class", "page-item");
    			add_location(li1, file$6, 19, 12, 592);
    			attr_dev(span0, "class", "visually-hidden");
    			add_location(span0, file$6, 23, 16, 818);
    			attr_dev(span1, "class", "page-link");
    			add_location(span1, file$6, 21, 14, 747);
    			attr_dev(li2, "class", "page-item active");
    			attr_dev(li2, "aria-current", "page");
    			add_location(li2, file$6, 20, 12, 683);
    			attr_dev(a2, "class", "page-link");
    			attr_dev(a2, "href", a2_href_value = "/" + (/*text*/ ctx[2] + /*allPages*/ ctx[1]));
    			add_location(a2, file$6, 26, 34, 943);
    			attr_dev(li3, "class", "page-item");
    			add_location(li3, file$6, 26, 12, 921);
    			attr_dev(a3, "class", "page-link");
    			attr_dev(a3, "href", a3_href_value = "/" + (/*text*/ ctx[2] + /*next*/ ctx[4]));
    			add_location(a3, file$6, 28, 14, 1111);

    			attr_dev(li4, "class", li4_class_value = "page-item " + (/*currentPage*/ ctx[0] === /*allPages*/ ctx[1]
    			? 'disabled'
    			: ''));

    			add_location(li4, file$6, 27, 12, 1029);
    			attr_dev(ul, "class", "pagination");
    			add_location(ul, file$6, 15, 10, 384);
    			attr_dev(nav, "class", "m-3");
    			add_location(nav, file$6, 14, 6, 356);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(a0, t0);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(a1, t2);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(li2, span1);
    			append_dev(span1, t4);
    			append_dev(span1, t5);
    			append_dev(span1, span0);
    			append_dev(span0, t6);
    			append_dev(ul, t7);
    			append_dev(ul, li3);
    			append_dev(li3, a2);
    			append_dev(a2, t8);
    			append_dev(ul, t9);
    			append_dev(ul, li4);
    			append_dev(li4, a3);
    			append_dev(a3, t10);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link.call(null, a0)),
    					action_destroyer(link.call(null, a1)),
    					action_destroyer(link.call(null, a2)),
    					action_destroyer(link.call(null, a3))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*text*/ 4 && a0_href_value !== (a0_href_value = "/" + (/*text*/ ctx[2] + /*previous*/ ctx[3]))) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*currentPage*/ 1 && li0_class_value !== (li0_class_value = "page-item " + (/*currentPage*/ ctx[0] === 1 ? 'disabled' : ''))) {
    				attr_dev(li0, "class", li0_class_value);
    			}

    			if (dirty & /*text*/ 4 && a1_href_value !== (a1_href_value = "/" + /*text*/ ctx[2] + "1")) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (dirty & /*currentPage*/ 1) set_data_dev(t4, /*currentPage*/ ctx[0]);
    			if (dirty & /*currentPage*/ 1) set_data_dev(t6, /*currentPage*/ ctx[0]);
    			if (dirty & /*allPages*/ 2) set_data_dev(t8, /*allPages*/ ctx[1]);

    			if (dirty & /*text, allPages*/ 6 && a2_href_value !== (a2_href_value = "/" + (/*text*/ ctx[2] + /*allPages*/ ctx[1]))) {
    				attr_dev(a2, "href", a2_href_value);
    			}

    			if (dirty & /*text*/ 4 && a3_href_value !== (a3_href_value = "/" + (/*text*/ ctx[2] + /*next*/ ctx[4]))) {
    				attr_dev(a3, "href", a3_href_value);
    			}

    			if (dirty & /*currentPage, allPages*/ 3 && li4_class_value !== (li4_class_value = "page-item " + (/*currentPage*/ ctx[0] === /*allPages*/ ctx[1]
    			? 'disabled'
    			: ''))) {
    				attr_dev(li4, "class", li4_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Pagination', slots, []);
    	let { currentPage } = $$props;
    	let { allPages } = $$props;
    	let { text } = $$props;
    	let previous = currentPage - 1;
    	let next = currentPage + 1;
    	const writable_props = ['currentPage', 'allPages', 'text'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Pagination> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('currentPage' in $$props) $$invalidate(0, currentPage = $$props.currentPage);
    		if ('allPages' in $$props) $$invalidate(1, allPages = $$props.allPages);
    		if ('text' in $$props) $$invalidate(2, text = $$props.text);
    	};

    	$$self.$capture_state = () => ({
    		link,
    		active,
    		push,
    		pop,
    		replace,
    		location: location$1,
    		querystring,
    		currentPage,
    		allPages,
    		text,
    		previous,
    		next
    	});

    	$$self.$inject_state = $$props => {
    		if ('currentPage' in $$props) $$invalidate(0, currentPage = $$props.currentPage);
    		if ('allPages' in $$props) $$invalidate(1, allPages = $$props.allPages);
    		if ('text' in $$props) $$invalidate(2, text = $$props.text);
    		if ('previous' in $$props) $$invalidate(3, previous = $$props.previous);
    		if ('next' in $$props) $$invalidate(4, next = $$props.next);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [currentPage, allPages, text, previous, next];
    }

    class Pagination extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { currentPage: 0, allPages: 1, text: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Pagination",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*currentPage*/ ctx[0] === undefined && !('currentPage' in props)) {
    			console.warn("<Pagination> was created without expected prop 'currentPage'");
    		}

    		if (/*allPages*/ ctx[1] === undefined && !('allPages' in props)) {
    			console.warn("<Pagination> was created without expected prop 'allPages'");
    		}

    		if (/*text*/ ctx[2] === undefined && !('text' in props)) {
    			console.warn("<Pagination> was created without expected prop 'text'");
    		}
    	}

    	get currentPage() {
    		throw new Error("<Pagination>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentPage(value) {
    		throw new Error("<Pagination>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get allPages() {
    		throw new Error("<Pagination>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set allPages(value) {
    		throw new Error("<Pagination>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<Pagination>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Pagination>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/Home/Loading.svelte generated by Svelte v3.47.0 */

    const file$5 = "src/routes/Home/Loading.svelte";

    function create_fragment$6(ctx) {
    	let section;
    	let div7;
    	let div0;
    	let span0;
    	let t1;
    	let div1;
    	let span1;
    	let t3;
    	let div2;
    	let span2;
    	let t5;
    	let div3;
    	let span3;
    	let t7;
    	let div4;
    	let span4;
    	let t9;
    	let div5;
    	let span5;
    	let t11;
    	let div6;
    	let span6;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div7 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			span0.textContent = "Loading...";
    			t1 = space();
    			div1 = element("div");
    			span1 = element("span");
    			span1.textContent = "Loading...";
    			t3 = space();
    			div2 = element("div");
    			span2 = element("span");
    			span2.textContent = "Loading...";
    			t5 = space();
    			div3 = element("div");
    			span3 = element("span");
    			span3.textContent = "Loading...";
    			t7 = space();
    			div4 = element("div");
    			span4 = element("span");
    			span4.textContent = "Loading...";
    			t9 = space();
    			div5 = element("div");
    			span5 = element("span");
    			span5.textContent = "Loading...";
    			t11 = space();
    			div6 = element("div");
    			span6 = element("span");
    			span6.textContent = "Loading...";
    			attr_dev(span0, "class", "visually-hidden");
    			add_location(span0, file$5, 3, 12, 227);
    			attr_dev(div0, "class", "spinner-grow text-primary");
    			attr_dev(div0, "role", "status");
    			add_location(div0, file$5, 2, 8, 161);
    			attr_dev(span1, "class", "visually-hidden");
    			add_location(span1, file$5, 6, 12, 370);
    			attr_dev(div1, "class", "spinner-grow text-secondary");
    			attr_dev(div1, "role", "status");
    			add_location(div1, file$5, 5, 10, 302);
    			attr_dev(span2, "class", "visually-hidden");
    			add_location(span2, file$5, 9, 12, 511);
    			attr_dev(div2, "class", "spinner-grow text-success");
    			attr_dev(div2, "role", "status");
    			add_location(div2, file$5, 8, 10, 445);
    			attr_dev(span3, "class", "visually-hidden");
    			add_location(span3, file$5, 12, 12, 651);
    			attr_dev(div3, "class", "spinner-grow text-danger");
    			attr_dev(div3, "role", "status");
    			add_location(div3, file$5, 11, 10, 586);
    			attr_dev(span4, "class", "visually-hidden");
    			add_location(span4, file$5, 15, 12, 792);
    			attr_dev(div4, "class", "spinner-grow text-warning");
    			attr_dev(div4, "role", "status");
    			add_location(div4, file$5, 14, 10, 726);
    			attr_dev(span5, "class", "visually-hidden");
    			add_location(span5, file$5, 18, 12, 930);
    			attr_dev(div5, "class", "spinner-grow text-info");
    			attr_dev(div5, "role", "status");
    			add_location(div5, file$5, 17, 10, 867);
    			attr_dev(span6, "class", "visually-hidden");
    			add_location(span6, file$5, 21, 12, 1069);
    			attr_dev(div6, "class", "spinner-grow text-light");
    			attr_dev(div6, "role", "status");
    			add_location(div6, file$5, 20, 10, 1005);
    			set_style(div7, "z-index", "1029");
    			attr_dev(div7, "class", "h-100 container-fluid d-flex justify-content-center align-items-center");
    			add_location(div7, file$5, 1, 4, 46);
    			attr_dev(section, "class", "");
    			set_style(section, "height", "100vh");
    			add_location(section, file$5, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div7);
    			append_dev(div7, div0);
    			append_dev(div0, span0);
    			append_dev(div7, t1);
    			append_dev(div7, div1);
    			append_dev(div1, span1);
    			append_dev(div7, t3);
    			append_dev(div7, div2);
    			append_dev(div2, span2);
    			append_dev(div7, t5);
    			append_dev(div7, div3);
    			append_dev(div3, span3);
    			append_dev(div7, t7);
    			append_dev(div7, div4);
    			append_dev(div4, span4);
    			append_dev(div7, t9);
    			append_dev(div7, div5);
    			append_dev(div5, span5);
    			append_dev(div7, t11);
    			append_dev(div7, div6);
    			append_dev(div6, span6);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
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

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Loading', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Loading> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Loading extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Loading",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/routes/Home/Films.svelte generated by Svelte v3.47.0 */

    const { console: console_1$2 } = globals;
    const file$4 = "src/routes/Home/Films.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	child_ctx[11] = i;
    	return child_ctx;
    }

    // (72:32) 
    function create_if_block_1$2(ctx) {
    	let div0;
    	let pagination0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let pagination1;
    	let current;

    	pagination0 = new Pagination({
    			props: {
    				text: '',
    				allPages: /*data*/ ctx[0].last_page,
    				currentPage: /*data*/ ctx[0].current_page
    			},
    			$$inline: true
    		});

    	let each_value = /*data*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	pagination1 = new Pagination({
    			props: {
    				allPages: /*data*/ ctx[0].last_page,
    				currentPage: /*data*/ ctx[0].current_page
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			create_component(pagination0.$$.fragment);
    			t0 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			div2 = element("div");
    			create_component(pagination1.$$.fragment);
    			attr_dev(div0, "class", "m-2 container-fluid d-flex justify-content-center align-items-center");
    			add_location(div0, file$4, 72, 0, 2489);
    			attr_dev(div1, "class", "container wrapper mt-2 svelte-pk62ge");
    			add_location(div1, file$4, 77, 0, 2673);
    			attr_dev(div2, "class", "m-2 container-fluid d-flex justify-content-center align-items-center");
    			add_location(div2, file$4, 139, 0, 4761);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			mount_component(pagination0, div0, null);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			insert_dev(target, t1, anchor);
    			insert_dev(target, div2, anchor);
    			mount_component(pagination1, div2, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const pagination0_changes = {};
    			if (dirty & /*data*/ 1) pagination0_changes.allPages = /*data*/ ctx[0].last_page;
    			if (dirty & /*data*/ 1) pagination0_changes.currentPage = /*data*/ ctx[0].current_page;
    			pagination0.$set(pagination0_changes);

    			if (dirty & /*data, filmDate*/ 9) {
    				each_value = /*data*/ ctx[0];
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

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			const pagination1_changes = {};
    			if (dirty & /*data*/ 1) pagination1_changes.allPages = /*data*/ ctx[0].last_page;
    			if (dirty & /*data*/ 1) pagination1_changes.currentPage = /*data*/ ctx[0].current_page;
    			pagination1.$set(pagination1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pagination0.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(pagination1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pagination0.$$.fragment, local);
    			transition_out(pagination1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(pagination0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div2);
    			destroy_component(pagination1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(72:32) ",
    		ctx
    	});

    	return block;
    }

    // (70:0) {#if data.loading === true}
    function create_if_block$2(ctx) {
    	let loading;
    	let current;
    	loading = new Loading({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(loading.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(loading, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loading.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loading.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(loading, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(70:0) {#if data.loading === true}",
    		ctx
    	});

    	return block;
    }

    // (132:20) {:else}
    function create_else_block$1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "No items found";
    			add_location(span, file$4, 132, 17, 4649);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(132:20) {:else}",
    		ctx
    	});

    	return block;
    }

    // (130:16) {#each film.genres || [] as genre, i}
    function create_each_block_1$1(ctx) {
    	let span;
    	let t0_value = /*genre*/ ctx[9].name + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(span, "class", "video-genres");
    			add_location(span, file$4, 130, 20, 4543);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t0_value !== (t0_value = /*genre*/ ctx[9].name + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(130:16) {#each film.genres || [] as genre, i}",
    		ctx
    	});

    	return block;
    }

    // (79:0) {#each data as film}
    function create_each_block$2(ctx) {
    	let div4;
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let a0;
    	let i;
    	let a0_href_value;
    	let t1;
    	let div3;
    	let a1;
    	let h3;
    	let t2_value = /*film*/ ctx[6].ru_title + "";
    	let t2;
    	let a1_href_value;
    	let t3;
    	let div2;
    	let span;
    	let t4_value = /*filmDate*/ ctx[3](/*film*/ ctx[6].released) + "";
    	let t4;
    	let t5;
    	let t6;
    	let div4_intro;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*film*/ ctx[6].genres || [];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	let each_1_else = null;

    	if (!each_value_1.length) {
    		each_1_else = create_else_block$1(ctx);
    	}

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			a0 = element("a");
    			i = element("i");
    			t1 = space();
    			div3 = element("div");
    			a1 = element("a");
    			h3 = element("h3");
    			t2 = text(t2_value);
    			t3 = space();
    			div2 = element("div");
    			span = element("span");
    			t4 = text(t4_value);
    			t5 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (each_1_else) {
    				each_1_else.c();
    			}

    			t6 = space();
    			attr_dev(img, "class", "card-img-top");
    			if (!src_url_equal(img.src, img_src_value = /*film*/ ctx[6].poster_path)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Poster");
    			add_location(img, file$4, 81, 12, 2879);
    			attr_dev(i, "class", "fas fa-play fa-4x text-primary d-flex align-items-center justify-content-center h-100");
    			add_location(i, file$4, 93, 53, 3301);
    			attr_dev(a0, "href", a0_href_value = "/film/" + /*film*/ ctx[6].imdb_id);
    			add_location(a0, file$4, 93, 13, 3261);
    			attr_dev(div0, "class", "mask");
    			set_style(div0, "background", "linear-gradient( 45deg, rgba(29, 236, 197, 0.5), rgba(91, 14, 214, 0.5) 100% )");
    			add_location(div0, file$4, 84, 12, 2988);
    			attr_dev(div1, "class", "bg-image hover-overlay");
    			add_location(div1, file$4, 80, 8, 2830);
    			set_style(h3, "overflow", "hidden");
    			set_style(h3, "max-height", "54px");
    			set_style(h3, "margin", "5px 0 0");
    			set_style(h3, "font-size", "15px");
    			set_style(h3, "font-weight", "600");
    			set_style(h3, "line-height", "18px");
    			set_style(h3, "color", "#333");
    			add_location(h3, file$4, 106, 16, 3762);
    			attr_dev(a1, "href", a1_href_value = "/film/" + /*film*/ ctx[6].imdb_id);
    			set_style(a1, "overflow", "hidden");
    			set_style(a1, "max-height", "54px");
    			set_style(a1, "margin", "5px 0 0");
    			set_style(a1, "font-size", "15px");
    			set_style(a1, "font-weight", "600");
    			set_style(a1, "line-height", "18px");
    			set_style(a1, "color", "#333");
    			add_location(a1, file$4, 97, 12, 3479);
    			attr_dev(span, "class", "video-year");
    			add_location(span, file$4, 128, 16, 4411);
    			attr_dev(div2, "class", "");
    			set_style(div2, "height", "18px");
    			set_style(div2, "margin", "2px 0 3px");
    			set_style(div2, "color", "#a6a6a6");
    			set_style(div2, "font-size", "12px");
    			set_style(div2, "font-weight", "400");
    			set_style(div2, "line-height", "18px");
    			set_style(div2, "overflow", "hidden");
    			set_style(div2, "text-overflow", "ellipsis");
    			set_style(div2, "white-space", "nowrap");
    			add_location(div2, file$4, 117, 12, 4095);
    			attr_dev(div3, "class", "p-2");
    			add_location(div3, file$4, 96, 8, 3449);
    			attr_dev(div4, "class", "card d-flex flex-column m-2  svelte-pk62ge");
    			add_location(div4, file$4, 79, 4, 2735);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div1);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, a0);
    			append_dev(a0, i);
    			append_dev(div4, t1);
    			append_dev(div4, div3);
    			append_dev(div3, a1);
    			append_dev(a1, h3);
    			append_dev(h3, t2);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, span);
    			append_dev(span, t4);
    			append_dev(div2, t5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			if (each_1_else) {
    				each_1_else.m(div2, null);
    			}

    			append_dev(div4, t6);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link.call(null, a0)),
    					action_destroyer(link.call(null, a1))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*data*/ 1 && !src_url_equal(img.src, img_src_value = /*film*/ ctx[6].poster_path)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*data*/ 1 && a0_href_value !== (a0_href_value = "/film/" + /*film*/ ctx[6].imdb_id)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*data*/ 1 && t2_value !== (t2_value = /*film*/ ctx[6].ru_title + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*data*/ 1 && a1_href_value !== (a1_href_value = "/film/" + /*film*/ ctx[6].imdb_id)) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (dirty & /*data*/ 1 && t4_value !== (t4_value = /*filmDate*/ ctx[3](/*film*/ ctx[6].released) + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*data*/ 1) {
    				each_value_1 = /*film*/ ctx[6].genres || [];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;

    				if (!each_value_1.length && each_1_else) {
    					each_1_else.p(ctx, dirty);
    				} else if (!each_value_1.length) {
    					each_1_else = create_else_block$1(ctx);
    					each_1_else.c();
    					each_1_else.m(div2, null);
    				} else if (each_1_else) {
    					each_1_else.d(1);
    					each_1_else = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (!div4_intro) {
    				add_render_callback(() => {
    					div4_intro = create_in_transition(div4, fade, {
    						easing: /*currentEasing*/ ctx[1],
    						duration: /*duration*/ ctx[2]
    					});

    					div4_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_each(each_blocks, detaching);
    			if (each_1_else) each_1_else.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(79:0) {#each data as film}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$2, create_if_block_1$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*data*/ ctx[0].loading === true) return 0;
    		if (/*data*/ ctx[0].loading !== true) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
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
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
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

    async function loadPoster$2(id, i) {
    	const res = await fetch("https://api.themoviedb.org/3/movie/" + id + "?api_key=012107c38dbdef7c24537c12f1f022e6&language=ru-RU");
    	const character = await res.json();

    	if (res.ok && i !== undefined) {
    		console.log('I : ', i);
    		i.genres = character.genres;

    		// i.genres = (i.genres)? character.genres : ''
    		const src = character.poster_path !== null && character.poster_path !== undefined
    		? 'https://image.tmdb.org/t/p/w500' + character.poster_path
    		: '/build/noposter.png';

    		return src;
    	} else {
    		if (i !== undefined) {
    			const src = character.poster_path !== null && character.poster_path !== undefined
    			? 'https://image.tmdb.org/t/p/w500' + character.poster_path
    			: '/build/noposter.png';

    			i.genres = [{ id: 1, name: '' }];
    			return src;
    		}
    	}
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Films', slots, []);
    	let currentEasing = circIn;
    	let duration = 700;
    	let data = [];
    	data.loading = true;
    	let { params } = $$props;

    	if (params === undefined) {
    		params = {};
    		params.id = 1;
    	}

    	async function module(page) {
    		$$invalidate(0, data.loading = true, data);
    		const res = await fetch('https://38.svetacdn.in/api/movies?api_token=caPViSv7B4vYtQeyX0bAAdcHxSOQSc1O&include_adult=true&page=' + page);

    		if (res.ok) {
    			const filmsPage = await res.json();
    			$$invalidate(0, data = filmsPage.data);
    			$$invalidate(0, data.current_page = filmsPage.current_page, data);
    			$$invalidate(0, data.last_page = filmsPage.last_page, data);
    			data.every((element, index, array) => loadPoster$2(data[index].imdb_id, element).then(returns => $$invalidate(0, data[index].poster_path = returns, data)));
    			loadPoster$2(data[0].imdb_id);
    			$$invalidate(0, data.loading = false, data);
    			console.log('FilmsData: ', filmsPage);
    		}
    	}

    	let filmDate = date => {
    		let data1 = new Date(date);
    		data1 = data1.getFullYear(data1);
    		return data1;
    	};

    	console.log(data.loading);
    	const writable_props = ['params'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<Films> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('params' in $$props) $$invalidate(4, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		fly,
    		slide,
    		scale,
    		blur,
    		eases,
    		each,
    		link,
    		active,
    		Pagination,
    		Loading,
    		currentEasing,
    		duration,
    		data,
    		params,
    		loadPoster: loadPoster$2,
    		module,
    		filmDate
    	});

    	$$self.$inject_state = $$props => {
    		if ('currentEasing' in $$props) $$invalidate(1, currentEasing = $$props.currentEasing);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('params' in $$props) $$invalidate(4, params = $$props.params);
    		if ('filmDate' in $$props) $$invalidate(3, filmDate = $$props.filmDate);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*params*/ 16) {
    			module(params.id);
    		}
    	};

    	return [data, currentEasing, duration, filmDate, params];
    }

    class Films extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { params: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Films",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[4] === undefined && !('params' in props)) {
    			console_1$2.warn("<Films> was created without expected prop 'params'");
    		}
    	}

    	get params() {
    		throw new Error("<Films>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Films>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Films$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Films
    });

    /* src/routes/Home/App.svelte generated by Svelte v3.47.0 */
    const file$3 = "src/routes/Home/App.svelte";

    function create_fragment$4(ctx) {
    	let nav;
    	let div3;
    	let div2;
    	let div1;
    	let div0;
    	let input;
    	let t0;
    	let label;
    	let t2;
    	let button0;
    	let i;
    	let t3;
    	let button1;
    	let t5;
    	let button2;
    	let t7;
    	let route;
    	let current;
    	let mounted;
    	let dispose;

    	route = new Router({
    			props: {
    				routes: /*routes*/ ctx[1],
    				restoreScrollState: true
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			label.textContent = "Search";
    			t2 = space();
    			button0 = element("button");
    			i = element("i");
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "Назад";
    			t5 = space();
    			button2 = element("button");
    			button2.textContent = "Главная";
    			t7 = space();
    			create_component(route.$$.fragment);
    			attr_dev(input, "type", "search");
    			attr_dev(input, "id", "form1");
    			attr_dev(input, "class", "form-control");
    			add_location(input, file$3, 44, 16, 1305);
    			attr_dev(label, "class", "form-label");
    			attr_dev(label, "for", "form1");
    			add_location(label, file$3, 45, 16, 1407);
    			attr_dev(div0, "class", "form-outline");
    			add_location(div0, file$3, 43, 16, 1262);
    			attr_dev(i, "class", "fas fa-search");
    			add_location(i, file$3, 48, 16, 1591);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "btn btn-primary");
    			add_location(button0, file$3, 47, 16, 1499);
    			attr_dev(div1, "class", "input-group");
    			add_location(div1, file$3, 42, 12, 1220);
    			attr_dev(div2, "class", "d-flex");
    			add_location(div2, file$3, 41, 8, 1187);
    			attr_dev(button1, "class", "btn mx-2");
    			add_location(button1, file$3, 52, 12, 1693);
    			attr_dev(button2, "class", "btn mx-2");
    			add_location(button2, file$3, 53, 12, 1769);
    			attr_dev(div3, "class", "container-fluid d-flex justify-content-center align-items-center");
    			add_location(div3, file$3, 40, 4, 1100);
    			attr_dev(nav, "class", "navbar navbar-light bg-light");
    			add_location(nav, file$3, 39, 0, 1053);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*search*/ ctx[0]);
    			append_dev(div0, t0);
    			append_dev(div0, label);
    			append_dev(div1, t2);
    			append_dev(div1, button0);
    			append_dev(button0, i);
    			append_dev(div3, t3);
    			append_dev(div3, button1);
    			append_dev(div3, t5);
    			append_dev(div3, button2);
    			insert_dev(target, t7, anchor);
    			mount_component(route, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "submit", /*submit_handler*/ ctx[3], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[4]),
    					listen_dev(
    						button0,
    						"click",
    						function () {
    							if (is_function(/*searchFun*/ ctx[2](/*search*/ ctx[0]))) /*searchFun*/ ctx[2](/*search*/ ctx[0]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(button1, "click", /*click_handler*/ ctx[5], false, false, false),
    					listen_dev(button2, "click", /*click_handler_1*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*search*/ 1) {
    				set_input_value(input, /*search*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(route.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(route.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			if (detaching) detach_dev(t7);
    			destroy_component(route, detaching);
    			mounted = false;
    			run_all(dispose);
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
    	let search;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	const routes = {
    		'/': wrap$1({
    			asyncComponent: () => Promise.resolve().then(function () { return Films$1; }),
    			props: { params: { id: 1 } }
    		}),
    		'/:id': wrap$1({
    			asyncComponent: () => Promise.resolve().then(function () { return Films$1; })
    		}),
    		'/film/:id': wrap$1({
    			asyncComponent: () => Promise.resolve().then(function () { return Film$1; })
    		}),
    		'/search/:text/:page': wrap$1({
    			asyncComponent: () => Promise.resolve().then(function () { return Search$1; })
    		}),
    		'*': wrap$1({
    			asyncComponent: () => Promise.resolve().then(function () { return NotFound$1; })
    		})
    	};

    	function searchFun(string) {
    		$$invalidate(0, search = '');
    		replace('/search/' + string + '/1');
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function submit_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_input_handler() {
    		search = this.value;
    		$$invalidate(0, search);
    	}

    	const click_handler = () => pop();
    	const click_handler_1 = () => push('/');

    	$$self.$capture_state = () => ({
    		link,
    		wrap: wrap$1,
    		Route: Router,
    		active,
    		push,
    		pop,
    		replace,
    		Films,
    		routes,
    		searchFun,
    		search
    	});

    	$$self.$inject_state = $$props => {
    		if ('search' in $$props) $$invalidate(0, search = $$props.search);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$invalidate(0, search = '');

    	return [
    		search,
    		routes,
    		searchFun,
    		submit_handler,
    		input_input_handler,
    		click_handler,
    		click_handler_1
    	];
    }

    class App$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.47.0 */

    function create_fragment$3(ctx) {
    	let home;
    	let current;
    	home = new App$1({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(home.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(home, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(home.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(home.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(home, detaching);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Home: App$1 });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    /* src/routes/Home/Film.svelte generated by Svelte v3.47.0 */

    const { Error: Error_1$1, console: console_1$1 } = globals;
    const file$2 = "src/routes/Home/Film.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i].id;
    	child_ctx[9] = list[i].name;
    	child_ctx[11] = i;
    	return child_ctx;
    }

    // (86:32) 
    function create_if_block_1$1(ctx) {
    	let div9;
    	let header;
    	let div7;
    	let div6;
    	let div5;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div4;
    	let div1;
    	let h20;
    	let t1_value = /*data*/ ctx[1].ru_title + "";
    	let t1;
    	let t2;
    	let h21;
    	let span0;
    	let t3;
    	let t4_value = /*filmDate*/ ctx[4](/*data*/ ctx[1].year, 1) + "";
    	let t4;
    	let t5;
    	let t6;
    	let div2;
    	let span1;
    	let t7_value = /*filmDate*/ ctx[4](/*data*/ ctx[1].year, 2) + "";
    	let t7;
    	let t8;
    	let t9;
    	let span2;
    	let t10_value = /*data*/ ctx[1].runtime + "";
    	let t10;
    	let t11;
    	let div3;
    	let h30;
    	let t12_value = /*data*/ ctx[1].tagline + "";
    	let t12;
    	let t13;
    	let h31;
    	let t15;
    	let p;
    	let t16_value = /*data*/ ctx[1].overview + "";
    	let t16;
    	let t17;
    	let main;
    	let div8;
    	let iframe;
    	let iframe_src_value;
    	let div9_intro;
    	let each_value = /*genres*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div9 = element("div");
    			header = element("header");
    			div7 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div4 = element("div");
    			div1 = element("div");
    			h20 = element("h2");
    			t1 = text(t1_value);
    			t2 = space();
    			h21 = element("h2");
    			span0 = element("span");
    			t3 = text(" (");
    			t4 = text(t4_value);
    			t5 = text(")");
    			t6 = space();
    			div2 = element("div");
    			span1 = element("span");
    			t7 = text(t7_value);
    			t8 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t9 = space();
    			span2 = element("span");
    			t10 = text(t10_value);
    			t11 = space();
    			div3 = element("div");
    			h30 = element("h3");
    			t12 = text(t12_value);
    			t13 = space();
    			h31 = element("h3");
    			h31.textContent = "Обзор";
    			t15 = space();
    			p = element("p");
    			t16 = text(t16_value);
    			t17 = space();
    			main = element("main");
    			div8 = element("div");
    			iframe = element("iframe");
    			set_style(img, "border-radius", "8px");
    			attr_dev(img, "class", "h-100 shadow-3");
    			if (!src_url_equal(img.src, img_src_value = /*data*/ ctx[1].poster_path)) attr_dev(img, "src", img_src_value);
    			add_location(img, file$2, 106, 20, 4196);
    			attr_dev(div0, "class", "d-flex py-3 h-100");
    			add_location(div0, file$2, 105, 16, 4144);
    			add_location(h20, file$2, 111, 24, 4435);
    			attr_dev(span0, "class", "");
    			add_location(span0, file$2, 112, 45, 4506);
    			attr_dev(h21, "class", "fw-light");
    			add_location(h21, file$2, 112, 24, 4485);
    			attr_dev(div1, "class", "d-flex");
    			add_location(div1, file$2, 110, 20, 4390);
    			attr_dev(span1, "class", "p-1");
    			add_location(span1, file$2, 125, 24, 5017);
    			attr_dev(span2, "class", "time p-1");
    			add_location(span2, file$2, 132, 24, 5316);
    			attr_dev(div2, "class", "d-flex");
    			set_style(div2, "border-radius", "2px");
    			set_style(div2, "margin-left", "7px");
    			set_style(div2, "margin-right", "7px");
    			add_location(div2, file$2, 114, 20, 4613);
    			set_style(h30, "font-size", "1.1em");
    			set_style(h30, "font-weight", "400");
    			set_style(h30, "font-style", "italic");
    			set_style(h30, "opacity", "0.7");
    			attr_dev(h30, "class", "text-start fst-italic");
    			add_location(h30, file$2, 139, 24, 5512);
    			attr_dev(h31, "class", "text-start");
    			add_location(h31, file$2, 145, 24, 5811);
    			attr_dev(p, "class", "text-start");
    			add_location(p, file$2, 146, 24, 5869);
    			add_location(div3, file$2, 138, 20, 5482);
    			attr_dev(div4, "class", "d-flex flex-column w-100 text-white m-3");
    			add_location(div4, file$2, 109, 16, 4316);
    			attr_dev(div5, "class", "d-flex h-100 container");
    			add_location(div5, file$2, 104, 12, 4091);
    			attr_dev(div6, "class", "mask");
    			set_style(div6, "background", "linear-gradient( 45deg, rgba(79, 74, 58, 0.7), rgb(4%, 16%, 40%, 0.7) 100% )");
    			add_location(div6, file$2, 98, 10, 3917);
    			attr_dev(div7, "class", "bg-image");
    			set_style(div7, "background-image", "url(" + /*data*/ ctx[1].backdrop_path + ")");
    			set_style(div7, "height", "500px");
    			add_location(div7, file$2, 91, 8, 3752);
    			attr_dev(header, "class", "shadow-inner");
    			add_location(header, file$2, 88, 4, 3679);
    			attr_dev(iframe, "id", "shadow");
    			set_style(iframe, "height", "inherit");
    			set_style(iframe, "width", "inherit");
    			if (!src_url_equal(iframe.src, iframe_src_value = "https:" + /*data*/ ctx[1].iframe_src)) attr_dev(iframe, "src", iframe_src_value);
    			add_location(iframe, file$2, 156, 12, 6215);
    			attr_dev(div8, "class", "ratio ratio-16x9 d-flex justify-content-center align-items-center w-100 h-100");
    			add_location(div8, file$2, 155, 8, 6111);
    			attr_dev(main, "class", "container mt-5 mb-5 border");
    			add_location(main, file$2, 154, 6, 6061);
    			attr_dev(div9, "class", "");
    			add_location(div9, file$2, 86, 0, 3611);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div9, anchor);
    			append_dev(div9, header);
    			append_dev(header, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div0);
    			append_dev(div0, img);
    			append_dev(div5, t0);
    			append_dev(div5, div4);
    			append_dev(div4, div1);
    			append_dev(div1, h20);
    			append_dev(h20, t1);
    			append_dev(div1, t2);
    			append_dev(div1, h21);
    			append_dev(h21, span0);
    			append_dev(span0, t3);
    			append_dev(span0, t4);
    			append_dev(span0, t5);
    			append_dev(div4, t6);
    			append_dev(div4, div2);
    			append_dev(div2, span1);
    			append_dev(span1, t7);
    			append_dev(div2, t8);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			append_dev(div2, t9);
    			append_dev(div2, span2);
    			append_dev(span2, t10);
    			append_dev(div4, t11);
    			append_dev(div4, div3);
    			append_dev(div3, h30);
    			append_dev(h30, t12);
    			append_dev(div3, t13);
    			append_dev(div3, h31);
    			append_dev(div3, t15);
    			append_dev(div3, p);
    			append_dev(p, t16);
    			append_dev(div9, t17);
    			append_dev(div9, main);
    			append_dev(main, div8);
    			append_dev(div8, iframe);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*data*/ 2 && !src_url_equal(img.src, img_src_value = /*data*/ ctx[1].poster_path)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*data*/ 2 && t1_value !== (t1_value = /*data*/ ctx[1].ru_title + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*data*/ 2 && t4_value !== (t4_value = /*filmDate*/ ctx[4](/*data*/ ctx[1].year, 1) + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*data*/ 2 && t7_value !== (t7_value = /*filmDate*/ ctx[4](/*data*/ ctx[1].year, 2) + "")) set_data_dev(t7, t7_value);

    			if (dirty & /*genres*/ 1) {
    				each_value = /*genres*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, t9);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*data*/ 2 && t10_value !== (t10_value = /*data*/ ctx[1].runtime + "")) set_data_dev(t10, t10_value);
    			if (dirty & /*data*/ 2 && t12_value !== (t12_value = /*data*/ ctx[1].tagline + "")) set_data_dev(t12, t12_value);
    			if (dirty & /*data*/ 2 && t16_value !== (t16_value = /*data*/ ctx[1].overview + "")) set_data_dev(t16, t16_value);

    			if (dirty & /*data*/ 2) {
    				set_style(div7, "background-image", "url(" + /*data*/ ctx[1].backdrop_path + ")");
    			}

    			if (dirty & /*data*/ 2 && !src_url_equal(iframe.src, iframe_src_value = "https:" + /*data*/ ctx[1].iframe_src)) {
    				attr_dev(iframe, "src", iframe_src_value);
    			}
    		},
    		i: function intro(local) {
    			if (!div9_intro) {
    				add_render_callback(() => {
    					div9_intro = create_in_transition(div9, fade, {
    						easing: /*currentEasing*/ ctx[2],
    						duration: /*duration*/ ctx[3]
    					});

    					div9_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div9);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(86:32) ",
    		ctx
    	});

    	return block;
    }

    // (84:0) {#if data.loading === true}
    function create_if_block$1(ctx) {
    	let loading;
    	let current;
    	loading = new Loading({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(loading.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(loading, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loading.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loading.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(loading, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(84:0) {#if data.loading === true}",
    		ctx
    	});

    	return block;
    }

    // (129:28) {#each genres  as {id,name}
    function create_each_block$1(ctx) {
    	let span;
    	let t_value = /*name*/ ctx[9] + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "genre borders p-1");
    			add_location(span, file$2, 129, 28, 5209);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*genres*/ 1 && t_value !== (t_value = /*name*/ ctx[9] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(129:28) {#each genres  as {id,name}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$1, create_if_block_1$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*data*/ ctx[1].loading === true) return 0;
    		if (/*data*/ ctx[1].loading !== true) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1$1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
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
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
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

    async function loadPoster$1(id, i) {
    	const res = await fetch("https://api.themoviedb.org/3/movie/" + id + "?api_key=012107c38dbdef7c24537c12f1f022e6&language=ru-RU");
    	const character = await res.json();

    	if (res.ok && i !== undefined) {
    		console.log('I : ', i);
    		i.genres = character.genres;

    		// i.genres = (i.genres)? character.genres : ''
    		const src = character.poster_path !== null && character.poster_path !== undefined
    		? 'https://image.tmdb.org/t/p/w500' + character.poster_path
    		: '/build/noposter.png';

    		return src;
    	} else {
    		if (i !== undefined) {
    			const src = character.poster_path !== null && character.poster_path !== undefined
    			? 'https://image.tmdb.org/t/p/w500' + character.poster_path
    			: '/build/noposter.png';

    			i.genres = [{ id: 1, name: '' }];
    			return src;
    		}
    	}
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Film', slots, []);
    	let currentEasing = circIn;
    	let duration = 700;
    	let genres = [];
    	let { params = {} } = $$props;
    	let data;
    	data = { loading: true };

    	async function loadDataFilm(id) {
    		const response = await fetch("https://api.themoviedb.org/3/movie/" + id + "?api_key=012107c38dbdef7c24537c12f1f022e6&language=ru-RU");
    		const character = await response.json();

    		if (response.ok) {
    			// const url_person = await fetch('https://api.themoviedb.org/3/search/multi?api_key=012107c38dbdef7c24537c12f1f022e6&language=ru-RU&language=ru-RU&page=1&include_adult=false')
    			// const personal = await url_person.json()
    			// console.log('полная: ', personal)
    			$$invalidate(1, data.overview = character.overview, data);

    			$$invalidate(
    				1,
    				data.poster_path = character.poster_path !== null && character.poster_path !== undefined
    				? 'https://image.tmdb.org/t/p/w500' + character.poster_path
    				: '/build/noposter.png',
    				data
    			);

    			$$invalidate(
    				1,
    				data.backdrop_path = character.backdrop_path !== null && character.backdrop_path !== undefined
    				? 'https://image.tmdb.org/t/p/original' + character.backdrop_path
    				: '/build/noposter.png',
    				data
    			);

    			$$invalidate(1, data.tagline = character.tagline, data);
    			$$invalidate(1, data.runtime = (character.runtime / 60 | 0) + " ч " + character.runtime % 60 + " мин", data);
    			$$invalidate(0, genres = character.genres);
    		}

    		console.log(character);
    	}

    	async function module(page) {
    		$$invalidate(1, data.loading = true, data);
    		const res = await fetch('https://38.svetacdn.in/api/movies?api_token=caPViSv7B4vYtQeyX0bAAdcHxSOQSc1O&imdb_id=' + page);
    		const filmsPage = await res.json();

    		if (res.ok) {
    			$$invalidate(1, data = filmsPage.data[0]);
    			loadDataFilm(params.id);
    			document.title = 'Фильм: ' + data.ru_title;
    			console.log(data);
    			$$invalidate(1, data.loading = false, data);
    		} else {
    			throw new Error(filmsPage);
    		}
    	}

    	module(params.id);

    	let filmDate = (date, id) => {
    		let data1 = new Date(date);

    		if (id === 1) {
    			data1 = data1.getFullYear(data1);
    		}

    		if (id === 2) {
    			let year = data1.getFullYear(data1);
    			let month = data1.getMonth(data1) + 1;
    			let day = data1.getDay(data1);
    			data1 = day + '/' + month + '/' + year;
    		}

    		return data1;
    	};

    	const writable_props = ['params'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Film> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('params' in $$props) $$invalidate(5, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		push,
    		pop,
    		replace,
    		onMount,
    		fade,
    		fly,
    		slide,
    		scale,
    		blur,
    		eases,
    		each,
    		get: get_store_value,
    		Loading,
    		currentEasing,
    		duration,
    		genres,
    		params,
    		data,
    		loadPoster: loadPoster$1,
    		loadDataFilm,
    		module,
    		filmDate
    	});

    	$$self.$inject_state = $$props => {
    		if ('currentEasing' in $$props) $$invalidate(2, currentEasing = $$props.currentEasing);
    		if ('duration' in $$props) $$invalidate(3, duration = $$props.duration);
    		if ('genres' in $$props) $$invalidate(0, genres = $$props.genres);
    		if ('params' in $$props) $$invalidate(5, params = $$props.params);
    		if ('data' in $$props) $$invalidate(1, data = $$props.data);
    		if ('filmDate' in $$props) $$invalidate(4, filmDate = $$props.filmDate);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [genres, data, currentEasing, duration, filmDate, params];
    }

    class Film extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { params: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Film",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get params() {
    		throw new Error_1$1("<Film>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error_1$1("<Film>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Film$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Film
    });

    /* src/routes/Home/Search.svelte generated by Svelte v3.47.0 */

    const { Error: Error_1, console: console_1 } = globals;
    const file$1 = "src/routes/Home/Search.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	child_ctx[13] = i;
    	return child_ctx;
    }

    // (83:32) 
    function create_if_block_1(ctx) {
    	let div0;
    	let h3;
    	let t0;
    	let t1_value = /*data*/ ctx[1].total + "";
    	let t1;
    	let t2;
    	let div1;
    	let pagination0;
    	let t3;
    	let div2;
    	let t4;
    	let div3;
    	let pagination1;
    	let current;

    	pagination0 = new Pagination({
    			props: {
    				text: 'search/' + /*params*/ ctx[0].text + '/',
    				allPages: /*data*/ ctx[1].last_page,
    				currentPage: /*data*/ ctx[1].current_page
    			},
    			$$inline: true
    		});

    	let each_value = /*data*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	pagination1 = new Pagination({
    			props: {
    				text: 'search/' + /*params*/ ctx[0].text + '/',
    				allPages: /*data*/ ctx[1].last_page,
    				currentPage: /*data*/ ctx[1].current_page
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h3 = element("h3");
    			t0 = text("Всего результатов: ");
    			t1 = text(t1_value);
    			t2 = space();
    			div1 = element("div");
    			create_component(pagination0.$$.fragment);
    			t3 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			div3 = element("div");
    			create_component(pagination1.$$.fragment);
    			add_location(h3, file$1, 84, 8, 2936);
    			attr_dev(div0, "class", "mt-3 d-flex justify-content-center");
    			add_location(div0, file$1, 83, 4, 2879);
    			attr_dev(div1, "class", "m-2 container-fluid d-flex justify-content-center align-items-center");
    			add_location(div1, file$1, 87, 4, 2993);
    			attr_dev(div2, "class", "wrapper container mt-2 svelte-pk62ge");
    			add_location(div2, file$1, 90, 4, 3210);
    			attr_dev(div3, "class", "m-2 container-fluid d-flex justify-content-center align-items-center");
    			add_location(div3, file$1, 152, 8, 5797);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h3);
    			append_dev(h3, t0);
    			append_dev(h3, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			mount_component(pagination0, div1, null);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div2, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			insert_dev(target, t4, anchor);
    			insert_dev(target, div3, anchor);
    			mount_component(pagination1, div3, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*data*/ 2) && t1_value !== (t1_value = /*data*/ ctx[1].total + "")) set_data_dev(t1, t1_value);
    			const pagination0_changes = {};
    			if (dirty & /*params*/ 1) pagination0_changes.text = 'search/' + /*params*/ ctx[0].text + '/';
    			if (dirty & /*data*/ 2) pagination0_changes.allPages = /*data*/ ctx[1].last_page;
    			if (dirty & /*data*/ 2) pagination0_changes.currentPage = /*data*/ ctx[1].current_page;
    			pagination0.$set(pagination0_changes);

    			if (dirty & /*data, filmDate*/ 18) {
    				each_value = /*data*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			const pagination1_changes = {};
    			if (dirty & /*params*/ 1) pagination1_changes.text = 'search/' + /*params*/ ctx[0].text + '/';
    			if (dirty & /*data*/ 2) pagination1_changes.allPages = /*data*/ ctx[1].last_page;
    			if (dirty & /*data*/ 2) pagination1_changes.currentPage = /*data*/ ctx[1].current_page;
    			pagination1.$set(pagination1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pagination0.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(pagination1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pagination0.$$.fragment, local);
    			transition_out(pagination1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			destroy_component(pagination0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div3);
    			destroy_component(pagination1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(83:32) ",
    		ctx
    	});

    	return block;
    }

    // (81:0) {#if data.loading === true}
    function create_if_block(ctx) {
    	let loading;
    	let current;
    	loading = new Loading({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(loading.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(loading, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loading.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loading.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(loading, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(81:0) {#if data.loading === true}",
    		ctx
    	});

    	return block;
    }

    // (145:28) {:else}
    function create_else_block(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "No items found";
    			add_location(span, file$1, 145, 28, 5629);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(145:28) {:else}",
    		ctx
    	});

    	return block;
    }

    // (143:24) {#each film.genres || [] as genre, i}
    function create_each_block_1(ctx) {
    	let span;
    	let t0_value = /*genre*/ ctx[11].name + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(span, "class", "video-genres");
    			add_location(span, file$1, 143, 28, 5504);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 2 && t0_value !== (t0_value = /*genre*/ ctx[11].name + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(143:24) {#each film.genres || [] as genre, i}",
    		ctx
    	});

    	return block;
    }

    // (92:8) {#each data as film}
    function create_each_block(ctx) {
    	let div4;
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let a0;
    	let i;
    	let a0_href_value;
    	let t1;
    	let div3;
    	let a1;
    	let h3;
    	let t2_value = /*film*/ ctx[8].ru_title + "";
    	let t2;
    	let a1_href_value;
    	let t3;
    	let div2;
    	let span;
    	let t4_value = /*filmDate*/ ctx[4](/*film*/ ctx[8].released) + "";
    	let t4;
    	let t5;
    	let t6;
    	let div4_intro;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*film*/ ctx[8].genres || [];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_1_else = null;

    	if (!each_value_1.length) {
    		each_1_else = create_else_block(ctx);
    	}

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			a0 = element("a");
    			i = element("i");
    			t1 = space();
    			div3 = element("div");
    			a1 = element("a");
    			h3 = element("h3");
    			t2 = text(t2_value);
    			t3 = space();
    			div2 = element("div");
    			span = element("span");
    			t4 = text(t4_value);
    			t5 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (each_1_else) {
    				each_1_else.c();
    			}

    			t6 = space();
    			attr_dev(img, "class", "card-img-top");
    			if (!src_url_equal(img.src, img_src_value = /*film*/ ctx[8].poster_path)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Poster");
    			add_location(img, file$1, 94, 20, 3448);
    			attr_dev(i, "class", "fas fa-play fa-4x text-primary d-flex align-items-center justify-content-center h-100");
    			add_location(i, file$1, 106, 61, 3966);
    			attr_dev(a0, "href", a0_href_value = "/film/" + /*film*/ ctx[8].imdb_id);
    			add_location(a0, file$1, 106, 21, 3926);
    			attr_dev(div0, "class", "mask");
    			set_style(div0, "background", "linear-gradient( 45deg, rgba(29, 236, 197, 0.5), rgba(91, 14, 214, 0.5) 100% )");
    			add_location(div0, file$1, 97, 20, 3581);
    			attr_dev(div1, "class", "bg-image hover-overlay");
    			add_location(div1, file$1, 93, 16, 3391);
    			set_style(h3, "overflow", "hidden");
    			set_style(h3, "max-height", "54px");
    			set_style(h3, "margin", "5px 0 0");
    			set_style(h3, "font-size", "15px");
    			set_style(h3, "font-weight", "600");
    			set_style(h3, "line-height", "18px");
    			set_style(h3, "color", "#333");
    			add_location(h3, file$1, 119, 24, 4531);
    			attr_dev(a1, "href", a1_href_value = "/film/" + /*film*/ ctx[8].imdb_id);
    			set_style(a1, "overflow", "hidden");
    			set_style(a1, "max-height", "54px");
    			set_style(a1, "margin", "5px 0 0");
    			set_style(a1, "font-size", "15px");
    			set_style(a1, "font-weight", "600");
    			set_style(a1, "line-height", "18px");
    			set_style(a1, "color", "#333");
    			add_location(a1, file$1, 110, 20, 4176);
    			attr_dev(span, "class", "video-year");
    			add_location(span, file$1, 141, 24, 5356);
    			attr_dev(div2, "class", "");
    			set_style(div2, "height", "18px");
    			set_style(div2, "margin", "2px 0 3px");
    			set_style(div2, "color", "#a6a6a6");
    			set_style(div2, "font-size", "12px");
    			set_style(div2, "font-weight", "400");
    			set_style(div2, "line-height", "18px");
    			set_style(div2, "overflow", "hidden");
    			set_style(div2, "text-overflow", "ellipsis");
    			set_style(div2, "white-space", "nowrap");
    			add_location(div2, file$1, 130, 20, 4952);
    			attr_dev(div3, "class", "p-2");
    			add_location(div3, file$1, 109, 16, 4138);
    			attr_dev(div4, "class", "card d-flex flex-column m-2  svelte-pk62ge");
    			add_location(div4, file$1, 92, 12, 3288);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div1);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, a0);
    			append_dev(a0, i);
    			append_dev(div4, t1);
    			append_dev(div4, div3);
    			append_dev(div3, a1);
    			append_dev(a1, h3);
    			append_dev(h3, t2);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, span);
    			append_dev(span, t4);
    			append_dev(div2, t5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			if (each_1_else) {
    				each_1_else.m(div2, null);
    			}

    			append_dev(div4, t6);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link.call(null, a0)),
    					action_destroyer(link.call(null, a1))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*data*/ 2 && !src_url_equal(img.src, img_src_value = /*film*/ ctx[8].poster_path)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*data*/ 2 && a0_href_value !== (a0_href_value = "/film/" + /*film*/ ctx[8].imdb_id)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*data*/ 2 && t2_value !== (t2_value = /*film*/ ctx[8].ru_title + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*data*/ 2 && a1_href_value !== (a1_href_value = "/film/" + /*film*/ ctx[8].imdb_id)) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (dirty & /*data*/ 2 && t4_value !== (t4_value = /*filmDate*/ ctx[4](/*film*/ ctx[8].released) + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*data*/ 2) {
    				each_value_1 = /*film*/ ctx[8].genres || [];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;

    				if (!each_value_1.length && each_1_else) {
    					each_1_else.p(ctx, dirty);
    				} else if (!each_value_1.length) {
    					each_1_else = create_else_block(ctx);
    					each_1_else.c();
    					each_1_else.m(div2, null);
    				} else if (each_1_else) {
    					each_1_else.d(1);
    					each_1_else = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (!div4_intro) {
    				add_render_callback(() => {
    					div4_intro = create_in_transition(div4, fade, {
    						easing: /*currentEasing*/ ctx[2],
    						duration: /*duration*/ ctx[3]
    					});

    					div4_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_each(each_blocks, detaching);
    			if (each_1_else) each_1_else.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(92:8) {#each data as film}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_if_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*data*/ ctx[1].loading === true) return 0;
    		if (/*data*/ ctx[1].loading !== true) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
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
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
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

    async function searchFilm(text) {
    	const response = await fetch('https://api.themoviedb.org/3/search/movie?api_key=012107c38dbdef7c24537c12f1f022e6&language=ru-RU&page=1&include_adult=false&query=' + text);
    	const character = await response.json();
    	console.log('Search: ', character);
    }

    async function loadPoster(id, i) {
    	const res = await fetch("https://api.themoviedb.org/3/movie/" + id + "?api_key=012107c38dbdef7c24537c12f1f022e6&language=ru-RU");
    	const character = await res.json();

    	if (res.ok && i !== undefined) {
    		console.log('I : ', i);
    		i.genres = character.genres;

    		// i.genres = (i.genres)? character.genres : ''
    		const src = character.poster_path !== null && character.poster_path !== undefined
    		? 'https://image.tmdb.org/t/p/w500' + character.poster_path
    		: '/build/noposter.png';

    		return src;
    	} else {
    		if (i !== undefined) {
    			const src = character.poster_path !== null && character.poster_path !== undefined
    			? 'https://image.tmdb.org/t/p/w500' + character.poster_path
    			: '/build/noposter.png';

    			i.genres = [{ id: 1, name: '' }];
    			return src;
    		}
    	}
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let mysearch;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Search', slots, []);
    	let currentEasing = circIn;
    	let duration = 700;
    	let data = [];
    	data.loading = true;
    	let { params } = $$props;
    	let currentPage = 1;
    	console.log(params);

    	async function module(text, page) {
    		$$invalidate(1, data.loading = true, data);
    		const res = await fetch('https://38.svetacdn.in/api/movies?api_token=caPViSv7B4vYtQeyX0bAAdcHxSOQSc1O&query=' + text + '&page=' + page);
    		const filmsPage = await res.json();

    		if (res.ok) {
    			$$invalidate(1, data = filmsPage.data);
    			$$invalidate(1, data.total = filmsPage.total, data);
    			$$invalidate(1, data.current_page = filmsPage.current_page, data);
    			$$invalidate(1, data.last_page = filmsPage.last_page, data);
    			data.every((element, index, array) => loadPoster(data[index].imdb_id, element).then(returns => $$invalidate(1, data[index].poster_path = returns, data)));
    			$$invalidate(1, data.loading = false, data);
    			console.log('FilmsData: ', data);
    		} else {
    			throw new Error(filmsPage);
    		}
    	}

    	console.log(data);

    	let filmDate = date => {
    		let data1 = new Date(date);
    		data1 = data1.getFullYear(data1);
    		return data1;
    	};

    	const writable_props = ['params'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Search> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('params' in $$props) $$invalidate(0, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		link,
    		active,
    		onMount,
    		fade,
    		fly,
    		slide,
    		scale,
    		blur,
    		eases,
    		each,
    		Pagination,
    		Loading,
    		currentEasing,
    		duration,
    		data,
    		params,
    		currentPage,
    		searchFilm,
    		loadPoster,
    		module,
    		filmDate,
    		mysearch
    	});

    	$$self.$inject_state = $$props => {
    		if ('currentEasing' in $$props) $$invalidate(2, currentEasing = $$props.currentEasing);
    		if ('duration' in $$props) $$invalidate(3, duration = $$props.duration);
    		if ('data' in $$props) $$invalidate(1, data = $$props.data);
    		if ('params' in $$props) $$invalidate(0, params = $$props.params);
    		if ('currentPage' in $$props) currentPage = $$props.currentPage;
    		if ('filmDate' in $$props) $$invalidate(4, filmDate = $$props.filmDate);
    		if ('mysearch' in $$props) $$invalidate(5, mysearch = $$props.mysearch);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*params*/ 1) {
    			$$invalidate(5, mysearch = params.text);
    		}

    		if ($$self.$$.dirty & /*mysearch, params*/ 33) {
    			module(mysearch, params.page);
    		}
    	};

    	return [params, data, currentEasing, duration, filmDate, mysearch];
    }

    class Search extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { params: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Search",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[0] === undefined && !('params' in props)) {
    			console_1.warn("<Search> was created without expected prop 'params'");
    		}
    	}

    	get params() {
    		throw new Error_1("<Search>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error_1("<Search>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Search$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Search
    });

    /* src/routes/Home/NotFound.svelte generated by Svelte v3.47.0 */

    const file = "src/routes/Home/NotFound.svelte";

    function create_fragment(ctx) {
    	let main;
    	let div4;
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div3;
    	let div2;
    	let h2;
    	let t2;
    	let p;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div4 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div3 = element("div");
    			div2 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Oops! This obviously isn't a page you were looking for.";
    			t2 = space();
    			p = element("p");
    			p.textContent = "Please, let us know how you got here, and use one of the following links to navigate back to safe harbor.";
    			if (!src_url_equal(img.src, img_src_value = "https://mdbootstrap.com/img/Others/404_mdb.webp")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Error 404");
    			attr_dev(img, "class", "img-fluid wow fadeIn");
    			add_location(img, file, 8, 16, 244);
    			attr_dev(div0, "class", "col-md-12 text-center float-md-none mx-auto");
    			add_location(div0, file, 7, 12, 170);
    			attr_dev(div1, "class", "row");
    			add_location(div1, file, 6, 8, 140);
    			attr_dev(h2, "class", "h2-responsive wow fadeIn mb-4");
    			attr_dev(h2, "data-wow-delay", "0.2s");
    			set_style(h2, "font-weight", "500");
    			add_location(h2, file, 16, 16, 502);
    			attr_dev(p, "class", "wow fadeIn");
    			attr_dev(p, "data-wow-delay", "0.4s");
    			set_style(p, "font-size", "1.25rem");
    			add_location(p, file, 17, 16, 668);
    			attr_dev(div2, "class", "col-md-12 text-center mb-5");
    			add_location(div2, file, 15, 12, 445);
    			attr_dev(div3, "class", "row mt-5");
    			add_location(div3, file, 14, 8, 410);
    			attr_dev(div4, "class", "mt-5 pt-5");
    			add_location(div4, file, 3, 4, 98);
    			attr_dev(main, "class", "container d-flex justify-content-center mx-auto h-100 align-items-center");
    			add_location(main, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div4);
    			append_dev(div4, div1);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div4, t0);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, h2);
    			append_dev(div2, t2);
    			append_dev(div2, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
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

    function instance($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NotFound', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<NotFound> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class NotFound extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NotFound",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var NotFound$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': NotFound
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
