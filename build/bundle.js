
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
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

    const { Error: Error_1, Object: Object_1, console: console_1$4 } = globals;

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

    function create_fragment$7(ctx) {
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
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
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
    		id: create_fragment$7.name,
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

    function instance$7($$self, $$props, $$invalidate) {
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$4.warn(`<Router> was created with unknown prop '${key}'`);
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

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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

    /* src/routes/Home/App.svelte generated by Svelte v3.47.0 */
    const file$4 = "src/routes/Home/App.svelte";

    function create_fragment$6(ctx) {
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
    	let span;
    	let t4;
    	let t5;
    	let button1;
    	let t7;
    	let button2;
    	let t9;
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
    			span = element("span");
    			t4 = text(/*search*/ ctx[0]);
    			t5 = space();
    			button1 = element("button");
    			button1.textContent = "Назад";
    			t7 = space();
    			button2 = element("button");
    			button2.textContent = "Главная";
    			t9 = space();
    			create_component(route.$$.fragment);
    			attr_dev(input, "type", "search");
    			attr_dev(input, "id", "form1");
    			attr_dev(input, "class", "form-control");
    			add_location(input, file$4, 38, 16, 1152);
    			attr_dev(label, "class", "form-label");
    			attr_dev(label, "for", "form1");
    			add_location(label, file$4, 39, 16, 1254);
    			attr_dev(div0, "class", "form-outline");
    			add_location(div0, file$4, 37, 16, 1109);
    			attr_dev(i, "class", "fas fa-search");
    			add_location(i, file$4, 42, 16, 1438);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "btn btn-primary");
    			add_location(button0, file$4, 41, 16, 1346);
    			attr_dev(div1, "class", "input-group");
    			add_location(div1, file$4, 36, 12, 1067);
    			attr_dev(div2, "class", "d-flex");
    			add_location(div2, file$4, 35, 8, 1034);
    			add_location(span, file$4, 46, 8, 1536);
    			attr_dev(button1, "class", "btn mx-2");
    			add_location(button1, file$4, 47, 12, 1570);
    			attr_dev(button2, "class", "btn mx-2");
    			add_location(button2, file$4, 48, 12, 1646);
    			attr_dev(div3, "class", "container-fluid d-flex justify-content-center align-items-center");
    			add_location(div3, file$4, 34, 4, 947);
    			attr_dev(nav, "class", "navbar navbar-light bg-light");
    			add_location(nav, file$4, 33, 0, 900);
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
    			append_dev(div3, span);
    			append_dev(span, t4);
    			append_dev(div3, t5);
    			append_dev(div3, button1);
    			append_dev(div3, t7);
    			append_dev(div3, button2);
    			insert_dev(target, t9, anchor);
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

    			if (!current || dirty & /*search*/ 1) set_data_dev(t4, /*search*/ ctx[0]);
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
    			if (detaching) detach_dev(t9);
    			destroy_component(route, detaching);
    			mounted = false;
    			run_all(dispose);
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
    	let search;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	const routes = {
    		'/': wrap$1({
    			asyncComponent: () => Promise.resolve().then(function () { return Default$1; })
    		}),
    		'/:id': wrap$1({
    			asyncComponent: () => Promise.resolve().then(function () { return Default$1; })
    		}),
    		'/film/:id': wrap$1({
    			asyncComponent: () => Promise.resolve().then(function () { return Film$1; })
    		}),
    		'/search/:text': wrap$1({
    			asyncComponent: () => Promise.resolve().then(function () { return Search$1; })
    		}),
    		'*': wrap$1({
    			asyncComponent: () => Promise.resolve().then(function () { return NotFound$1; })
    		})
    	};

    	function searchFun(string) {
    		$$invalidate(0, search = '');
    		push('/search/' + string);
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
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.47.0 */

    function create_fragment$5(ctx) {
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

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

    const { console: console_1$3 } = globals;
    const file$3 = "src/routes/Home/Pagination.svelte";

    function create_fragment$4(ctx) {
    	let nav;
    	let ul;
    	let li0;
    	let a0;
    	let t1;
    	let li1;
    	let a1;
    	let t3;
    	let li2;
    	let a2;
    	let t4;
    	let span;
    	let t5;
    	let t6;
    	let li3;
    	let a3;
    	let t7;
    	let t8;
    	let li4;
    	let a4;

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "Previous";
    			t1 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "1";
    			t3 = space();
    			li2 = element("li");
    			a2 = element("a");
    			t4 = text("2 ");
    			span = element("span");
    			t5 = text(/*currentPage*/ ctx[0]);
    			t6 = space();
    			li3 = element("li");
    			a3 = element("a");
    			t7 = text(/*allPages*/ ctx[1]);
    			t8 = space();
    			li4 = element("li");
    			a4 = element("a");
    			a4.textContent = "Next";
    			attr_dev(a0, "class", "page-link");
    			add_location(a0, file$3, 10, 8, 223);
    			attr_dev(li0, "class", "page-item disabled");
    			add_location(li0, file$3, 9, 6, 183);
    			attr_dev(a1, "class", "page-link");
    			attr_dev(a1, "href", "#");
    			add_location(a1, file$3, 12, 28, 297);
    			attr_dev(li1, "class", "page-item");
    			add_location(li1, file$3, 12, 6, 275);
    			attr_dev(span, "class", "visually-hidden");
    			add_location(span, file$3, 14, 40, 434);
    			attr_dev(a2, "class", "page-link");
    			attr_dev(a2, "href", "#");
    			add_location(a2, file$3, 14, 8, 402);
    			attr_dev(li2, "class", "page-item active");
    			attr_dev(li2, "aria-current", "page");
    			add_location(li2, file$3, 13, 6, 344);
    			attr_dev(a3, "class", "page-link");
    			attr_dev(a3, "href", "#");
    			add_location(a3, file$3, 16, 28, 529);
    			attr_dev(li3, "class", "page-item");
    			add_location(li3, file$3, 16, 6, 507);
    			attr_dev(a4, "class", "page-link");
    			attr_dev(a4, "href", "#");
    			add_location(a4, file$3, 18, 8, 616);
    			attr_dev(li4, "class", "page-item");
    			add_location(li4, file$3, 17, 6, 585);
    			attr_dev(ul, "class", "pagination");
    			add_location(ul, file$3, 8, 4, 153);
    			attr_dev(nav, "class", "m-3");
    			attr_dev(nav, "aria-label", "...");
    			add_location(nav, file$3, 7, 0, 114);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(li2, a2);
    			append_dev(a2, t4);
    			append_dev(a2, span);
    			append_dev(span, t5);
    			append_dev(ul, t6);
    			append_dev(ul, li3);
    			append_dev(li3, a3);
    			append_dev(a3, t7);
    			append_dev(ul, t8);
    			append_dev(ul, li4);
    			append_dev(li4, a4);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*currentPage*/ 1) set_data_dev(t5, /*currentPage*/ ctx[0]);
    			if (dirty & /*allPages*/ 2) set_data_dev(t7, /*allPages*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Pagination', slots, []);
    	let { currentPage } = $$props;
    	let { allPages } = $$props;
    	let myarr = [allPages];
    	console.log(myarr);
    	const writable_props = ['currentPage', 'allPages'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$3.warn(`<Pagination> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('currentPage' in $$props) $$invalidate(0, currentPage = $$props.currentPage);
    		if ('allPages' in $$props) $$invalidate(1, allPages = $$props.allPages);
    	};

    	$$self.$capture_state = () => ({ currentPage, allPages, myarr });

    	$$self.$inject_state = $$props => {
    		if ('currentPage' in $$props) $$invalidate(0, currentPage = $$props.currentPage);
    		if ('allPages' in $$props) $$invalidate(1, allPages = $$props.allPages);
    		if ('myarr' in $$props) myarr = $$props.myarr;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [currentPage, allPages];
    }

    class Pagination extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { currentPage: 0, allPages: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Pagination",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*currentPage*/ ctx[0] === undefined && !('currentPage' in props)) {
    			console_1$3.warn("<Pagination> was created without expected prop 'currentPage'");
    		}

    		if (/*allPages*/ ctx[1] === undefined && !('allPages' in props)) {
    			console_1$3.warn("<Pagination> was created without expected prop 'allPages'");
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
    }

    /* src/routes/Home/Default.svelte generated by Svelte v3.47.0 */

    const { console: console_1$2 } = globals;
    const file$2 = "src/routes/Home/Default.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (68:32) 
    function create_if_block_1$2(ctx) {
    	let div0;
    	let pagination;
    	let t;
    	let div1;
    	let current;

    	pagination = new Pagination({
    			props: {
    				allPages: /*data*/ ctx[0].last_page,
    				currenPage: /*data*/ ctx[0].currenPage
    			},
    			$$inline: true
    		});

    	let each_value = /*data*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			create_component(pagination.$$.fragment);
    			t = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "m-2 container-fluid d-flex justify-content-center align-items-center");
    			add_location(div0, file$2, 68, 0, 2469);
    			attr_dev(div1, "class", "wrapper mt-2 svelte-pk62ge");
    			add_location(div1, file$2, 71, 0, 2636);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			mount_component(pagination, div0, null);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const pagination_changes = {};
    			if (dirty & /*data*/ 1) pagination_changes.allPages = /*data*/ ctx[0].last_page;
    			if (dirty & /*data*/ 1) pagination_changes.currenPage = /*data*/ ctx[0].currenPage;
    			pagination.$set(pagination_changes);

    			if (dirty & /*data, filmDate*/ 9) {
    				each_value = /*data*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
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
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pagination.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pagination.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(pagination);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(68:32) ",
    		ctx
    	});

    	return block;
    }

    // (58:0) {#if data.loading === true}
    function create_if_block$2(ctx) {
    	let section;
    	let div3;
    	let div1;
    	let div0;
    	let span;
    	let t1;
    	let div2;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div3 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			span = element("span");
    			span.textContent = "Loading...";
    			t1 = space();
    			div2 = element("div");
    			attr_dev(div0, "class", "spinner-border loading-icon text-success");
    			attr_dev(div0, "role", "status");
    			attr_dev(div0, "id", "");
    			add_location(div0, file$2, 63, 8, 2155);
    			attr_dev(span, "class", "loading-text text-success");
    			add_location(span, file$2, 63, 88, 2235);
    			attr_dev(div1, "class", "loading-colors loading-spinner position-absolute");
    			add_location(div1, file$2, 60, 8, 2058);
    			attr_dev(div2, "class", "loading-backdrop position-absolute");
    			attr_dev(div2, "id", "");
    			set_style(div2, "opacity", "0.2");
    			set_style(div2, "background-color", "blue");
    			add_location(div2, file$2, 64, 8, 2307);
    			attr_dev(div3, "id", "loading-test-2");
    			set_style(div3, "height", "300px");
    			set_style(div3, "width", "100%");
    			set_style(div3, "z-index", "1029");
    			attr_dev(div3, "class", "position-relative");
    			add_location(div3, file$2, 59, 4, 1948);
    			attr_dev(section, "class", "w-100 p-4 d-flex justify-content-center pb-4");
    			add_location(section, file$2, 58, 0, 1881);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div3);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			append_dev(div1, span);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
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
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(58:0) {#if data.loading === true}",
    		ctx
    	});

    	return block;
    }

    // (126:20) {:else}
    function create_else_block$1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "No items found";
    			add_location(span, file$2, 126, 17, 4594);
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
    		source: "(126:20) {:else}",
    		ctx
    	});

    	return block;
    }

    // (124:16) {#each film.genres || [] as genre, i}
    function create_each_block_1$1(ctx) {
    	let span;
    	let t0_value = /*genre*/ ctx[8].name + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(span, "class", "video-genres");
    			add_location(span, file$2, 124, 20, 4488);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t0_value !== (t0_value = /*genre*/ ctx[8].name + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(124:16) {#each film.genres || [] as genre, i}",
    		ctx
    	});

    	return block;
    }

    // (73:0) {#each data as film}
    function create_each_block$1(ctx) {
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
    	let t2_value = /*film*/ ctx[5].ru_title + "";
    	let t2;
    	let a1_href_value;
    	let t3;
    	let div2;
    	let span;
    	let t4_value = /*filmDate*/ ctx[3](/*film*/ ctx[5].released) + "";
    	let t4;
    	let t5;
    	let t6;
    	let div4_intro;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*film*/ ctx[5].genres || [];
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
    			if (!src_url_equal(img.src, img_src_value = /*film*/ ctx[5].poster_path)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Poster");
    			add_location(img, file$2, 75, 12, 2832);
    			attr_dev(i, "class", "fas fa-play fa-4x text-primary d-flex align-items-center justify-content-center h-100");
    			add_location(i, file$2, 87, 53, 3246);
    			attr_dev(a0, "href", a0_href_value = "/film/" + /*film*/ ctx[5].imdb_id);
    			add_location(a0, file$2, 87, 13, 3206);
    			attr_dev(div0, "class", "mask");
    			set_style(div0, "background", "linear-gradient( 45deg, rgba(29, 236, 197, 0.5), rgba(91, 14, 214, 0.5) 100% )");
    			add_location(div0, file$2, 78, 12, 2933);
    			attr_dev(div1, "class", "bg-image hover-overlay");
    			add_location(div1, file$2, 74, 8, 2783);
    			set_style(h3, "overflow", "hidden");
    			set_style(h3, "max-height", "54px");
    			set_style(h3, "margin", "5px 0 0");
    			set_style(h3, "font-size", "15px");
    			set_style(h3, "font-weight", "600");
    			set_style(h3, "line-height", "18px");
    			set_style(h3, "color", "#333");
    			add_location(h3, file$2, 100, 16, 3707);
    			attr_dev(a1, "href", a1_href_value = "/film/" + /*film*/ ctx[5].imdb_id);
    			set_style(a1, "overflow", "hidden");
    			set_style(a1, "max-height", "54px");
    			set_style(a1, "margin", "5px 0 0");
    			set_style(a1, "font-size", "15px");
    			set_style(a1, "font-weight", "600");
    			set_style(a1, "line-height", "18px");
    			set_style(a1, "color", "#333");
    			add_location(a1, file$2, 91, 12, 3424);
    			attr_dev(span, "class", "video-year");
    			add_location(span, file$2, 122, 16, 4356);
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
    			add_location(div2, file$2, 111, 12, 4040);
    			attr_dev(div3, "class", "p-2");
    			add_location(div3, file$2, 90, 8, 3394);
    			attr_dev(div4, "class", "card d-flex flex-column m-2  svelte-pk62ge");
    			add_location(div4, file$2, 73, 4, 2688);
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

    			if (dirty & /*data*/ 1 && !src_url_equal(img.src, img_src_value = /*film*/ ctx[5].poster_path)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*data*/ 1 && a0_href_value !== (a0_href_value = "/film/" + /*film*/ ctx[5].imdb_id)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*data*/ 1 && t2_value !== (t2_value = /*film*/ ctx[5].ru_title + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*data*/ 1 && a1_href_value !== (a1_href_value = "/film/" + /*film*/ ctx[5].imdb_id)) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (dirty & /*data*/ 1 && t4_value !== (t4_value = /*filmDate*/ ctx[3](/*film*/ ctx[5].released) + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*data*/ 1) {
    				each_value_1 = /*film*/ ctx[5].genres || [];
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
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(73:0) {#each data as film}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function loadPoster$1(id, i) {
    	const response = await fetch("https://api.themoviedb.org/3/movie/" + id + "?api_key=012107c38dbdef7c24537c12f1f022e6&language=ru-RU");
    	const character = await response.json();
    	const src = 'https://image.tmdb.org/t/p/original' + character.poster_path;

    	if (i !== undefined) {
    		i.genres = character.genres;
    		return src;
    	}
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Default', slots, []);
    	let currentEasing = circIn;
    	let duration = 700;
    	let data = [];
    	data.loading = true;
    	let { params } = $$props;

    	if (params === undefined) {
    		params = {};
    		params.id = 1;
    	}

    	onMount(async () => {
    		const response = await fetch('https://38.svetacdn.in/api/movies?api_token=caPViSv7B4vYtQeyX0bAAdcHxSOQSc1O&page=' + params.id);
    		const filmsPage = await response.json();
    		console.log(filmsPage);
    		$$invalidate(0, data = filmsPage.data);
    		$$invalidate(0, data.current_page = filmsPage.current_page, data);
    		$$invalidate(0, data.last_page = filmsPage.last_page, data);
    		data.every((element, index, array) => loadPoster$1(data[index].imdb_id, element).then(returns => $$invalidate(0, data[index].poster_path = returns, data)));
    		loadPoster$1(data[0].imdb_id);
    		console.log(data);
    		$$invalidate(0, data.loading = false, data);

    		// Optional return. Great place for clean-up code.
    		return () => {
    			
    		}; // ... Code to run just before the component is removed ("unmounted") from the DOM.
    	});

    	let filmDate = date => {
    		let data1 = new Date(date);
    		data1 = data1.getFullYear(data1);
    		return data1;
    	};

    	const writable_props = ['params'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<Default> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('params' in $$props) $$invalidate(4, params = $$props.params);
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
    		currentEasing,
    		duration,
    		data,
    		params,
    		loadPoster: loadPoster$1,
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

    	return [data, currentEasing, duration, filmDate, params];
    }

    class Default extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { params: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Default",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[4] === undefined && !('params' in props)) {
    			console_1$2.warn("<Default> was created without expected prop 'params'");
    		}
    	}

    	get params() {
    		throw new Error("<Default>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Default>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Default$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Default
    });

    /* src/routes/Home/Film.svelte generated by Svelte v3.47.0 */

    const { console: console_1$1 } = globals;
    const file$1 = "src/routes/Home/Film.svelte";

    // (66:32) 
    function create_if_block_1$1(ctx) {
    	let div10;
    	let div3;
    	let div0;
    	let t0;
    	let div2;
    	let div1;
    	let p0;
    	let t1_value = /*data*/ ctx[0].ru_title + "";
    	let t1;
    	let t2;
    	let t3_value = /*data*/ ctx[0].orig_title + "";
    	let t3;
    	let t4;
    	let div9;
    	let div7;
    	let div4;
    	let img;
    	let img_src_value;
    	let t5;
    	let div6;
    	let div5;
    	let h5;
    	let t6_value = /*data*/ ctx[0].tagline + "";
    	let t6;
    	let t7;
    	let p1;
    	let span;
    	let t8_value = /*data*/ ctx[0].overview + "";
    	let t8;
    	let t9;
    	let div8;
    	let iframe;
    	let iframe_src_value;
    	let div10_intro;

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div2 = element("div");
    			div1 = element("div");
    			p0 = element("p");
    			t1 = text(t1_value);
    			t2 = text(" / ");
    			t3 = text(t3_value);
    			t4 = space();
    			div9 = element("div");
    			div7 = element("div");
    			div4 = element("div");
    			img = element("img");
    			t5 = space();
    			div6 = element("div");
    			div5 = element("div");
    			h5 = element("h5");
    			t6 = text(t6_value);
    			t7 = space();
    			p1 = element("p");
    			span = element("span");
    			t8 = text(t8_value);
    			t9 = space();
    			div8 = element("div");
    			iframe = element("iframe");
    			attr_dev(div0, "class", "bg-image");
    			set_style(div0, "background-image", "url(" + /*data*/ ctx[0].backdrop_path + ")");
    			set_style(div0, "height", "40vh");
    			add_location(div0, file$1, 69, 8, 3079);
    			attr_dev(p0, "class", "mb-0 p-2");
    			set_style(p0, "font-family", "'HeliosExtBlackC', serif");
    			set_style(p0, "font-size", "18pt");
    			set_style(p0, "color", "#ffffff");
    			set_style(p0, "background-color", "rgba(0, 0, 0, 0.6)");
    			add_location(p0, file$1, 75, 12, 3346);
    			attr_dev(div1, "class", "d-flex justify-content-center align-items-center h-100");
    			add_location(div1, file$1, 74, 12, 3265);
    			attr_dev(div2, "class", "mask");
    			attr_dev(div2, "style", "");
    			add_location(div2, file$1, 73, 8, 3225);
    			attr_dev(div3, "class", "bg-image");
    			add_location(div3, file$1, 68, 4, 3047);
    			attr_dev(img, "class", "img-fluid shadow-5");
    			if (!src_url_equal(img.src, img_src_value = /*data*/ ctx[0].poster_path)) attr_dev(img, "src", img_src_value);
    			add_location(img, file$1, 89, 30, 3901);
    			attr_dev(div4, "class", "align-self-start me-auto");
    			set_style(div4, "flex", "0 0 25%");
    			set_style(div4, "position", "relative");
    			set_style(div4, "top", "-120px");
    			add_location(div4, file$1, 87, 12, 3775);
    			attr_dev(h5, "class", "card-title");
    			add_location(h5, file$1, 93, 18, 4069);
    			add_location(span, file$1, 95, 22, 4174);
    			attr_dev(p1, "class", "card-text");
    			add_location(p1, file$1, 94, 18, 4130);
    			attr_dev(div5, "class", "card-body");
    			add_location(div5, file$1, 92, 16, 4027);
    			attr_dev(div6, "class", "card m-3");
    			add_location(div6, file$1, 91, 12, 3988);
    			attr_dev(div7, "class", "d-flex flex-row justify-content-center align-items-start");
    			add_location(div7, file$1, 86, 8, 3692);
    			set_style(iframe, "height", "inherit");
    			set_style(iframe, "width", "inherit");
    			if (!src_url_equal(iframe.src, iframe_src_value = "https:" + /*data*/ ctx[0].iframe_src)) attr_dev(iframe, "src", iframe_src_value);
    			add_location(iframe, file$1, 101, 12, 4398);
    			attr_dev(div8, "class", "ratio ratio-16x9 d-flex justify-content-center align-items-center w-100 h-100");
    			add_location(div8, file$1, 100, 8, 4294);
    			attr_dev(div9, "class", "container");
    			add_location(div9, file$1, 84, 4, 3659);
    			add_location(div10, file$1, 66, 0, 2988);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div3);
    			append_dev(div3, div0);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, p0);
    			append_dev(p0, t1);
    			append_dev(p0, t2);
    			append_dev(p0, t3);
    			append_dev(div10, t4);
    			append_dev(div10, div9);
    			append_dev(div9, div7);
    			append_dev(div7, div4);
    			append_dev(div4, img);
    			append_dev(div7, t5);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, h5);
    			append_dev(h5, t6);
    			append_dev(div5, t7);
    			append_dev(div5, p1);
    			append_dev(p1, span);
    			append_dev(span, t8);
    			append_dev(div9, t9);
    			append_dev(div9, div8);
    			append_dev(div8, iframe);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*data*/ 1) {
    				set_style(div0, "background-image", "url(" + /*data*/ ctx[0].backdrop_path + ")");
    			}

    			if (dirty & /*data*/ 1 && t1_value !== (t1_value = /*data*/ ctx[0].ru_title + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*data*/ 1 && t3_value !== (t3_value = /*data*/ ctx[0].orig_title + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*data*/ 1 && !src_url_equal(img.src, img_src_value = /*data*/ ctx[0].poster_path)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*data*/ 1 && t6_value !== (t6_value = /*data*/ ctx[0].tagline + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*data*/ 1 && t8_value !== (t8_value = /*data*/ ctx[0].overview + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*data*/ 1 && !src_url_equal(iframe.src, iframe_src_value = "https:" + /*data*/ ctx[0].iframe_src)) {
    				attr_dev(iframe, "src", iframe_src_value);
    			}
    		},
    		i: function intro(local) {
    			if (!div10_intro) {
    				add_render_callback(() => {
    					div10_intro = create_in_transition(div10, fade, {
    						easing: /*currentEasing*/ ctx[1],
    						duration: /*duration*/ ctx[2]
    					});

    					div10_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(66:32) ",
    		ctx
    	});

    	return block;
    }

    // (56:0) {#if data.loading === true}
    function create_if_block$1(ctx) {
    	let section;
    	let div3;
    	let div1;
    	let div0;
    	let span;
    	let t1;
    	let div2;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div3 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			span = element("span");
    			span.textContent = "Loading...";
    			t1 = space();
    			div2 = element("div");
    			attr_dev(div0, "class", "spinner-border loading-icon text-success");
    			attr_dev(div0, "role", "status");
    			attr_dev(div0, "id", "");
    			add_location(div0, file$1, 61, 12, 2662);
    			attr_dev(span, "class", "loading-text text-success");
    			add_location(span, file$1, 61, 92, 2742);
    			attr_dev(div1, "class", "loading-colors loading-spinner position-absolute");
    			add_location(div1, file$1, 58, 12, 2553);
    			attr_dev(div2, "class", "loading-backdrop position-absolute");
    			attr_dev(div2, "id", "");
    			set_style(div2, "opacity", "0.2");
    			set_style(div2, "background-color", "blue");
    			add_location(div2, file$1, 62, 12, 2818);
    			attr_dev(div3, "id", "loading-test-2");
    			set_style(div3, "height", "300px");
    			set_style(div3, "width", "100%");
    			set_style(div3, "z-index", "1029");
    			attr_dev(div3, "class", "position-relative");
    			add_location(div3, file$1, 57, 8, 2439);
    			attr_dev(section, "class", "w-100 h-100 p-4 d-flex justify-content-center pb-4");
    			add_location(section, file$1, 56, 4, 2362);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div3);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			append_dev(div1, span);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
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
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(56:0) {#if data.loading === true}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*data*/ ctx[0].loading === true) return create_if_block$1;
    		if (/*data*/ ctx[0].loading !== true) return create_if_block_1$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: function intro(local) {
    			transition_in(if_block);
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) {
    				if_block.d(detaching);
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

    async function searchFilm(text) {
    	const response = await fetch('https://api.themoviedb.org/3/search/movie?api_key=012107c38dbdef7c24537c12f1f022e6&language=ru-RU&page=1&include_adult=false&query=' + text);
    	const character = await response.json();
    	console.log('Search: ', character);
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Film', slots, []);
    	let currentEasing = circIn;
    	let duration = 700;
    	let { params = {} } = $$props;
    	let data;
    	data = { loading: true };
    	let mysearch = 'Форсаж';
    	searchFilm(mysearch);

    	async function loadDataFilm(id) {
    		const response = await fetch("https://api.themoviedb.org/3/movie/" + id + "?api_key=012107c38dbdef7c24537c12f1f022e6&language=ru-RU");
    		const character = await response.json();
    		const url_person = await fetch('https://api.themoviedb.org/3/discover/movie?api_key=012107c38dbdef7c24537c12f1f022e6&language=ru-RU&sort_by=popularity.desc&include_adult=false&include_video=false&page=1&with_watch_monetization_types=flatrate');
    		const personal = await url_person.json();
    		console.log('полная: ', personal);
    		$$invalidate(0, data.overview = character.overview, data);

    		$$invalidate(
    			0,
    			data.poster_path = character.poster_path !== null && character.poster_path !== undefined
    			? 'https://image.tmdb.org/t/p/original' + character.poster_path
    			: '/build/noposter.png',
    			data
    		);

    		$$invalidate(0, data.backdrop_path = 'https://image.tmdb.org/t/p/original' + character.backdrop_path, data);
    		$$invalidate(0, data.tagline = character.tagline, data);
    		console.log(character);
    	}

    	onMount(async () => {
    		const response = await fetch('https://38.svetacdn.in/api/movies?api_token=caPViSv7B4vYtQeyX0bAAdcHxSOQSc1O&imdb_id=' + params.id);
    		const filmsPage = await response.json();
    		$$invalidate(0, data = filmsPage.data[0]);
    		loadDataFilm(params.id);
    		document.title = 'Фильм: ' + data.ru_title;
    		console.log(data);
    		$$invalidate(0, data.loading = false, data);

    		// Optional return. Great place for clean-up code.
    		return () => {
    			
    		}; // ... Code to run just before the component is removed ("unmounted") from the DOM.
    	});

    	const writable_props = ['params'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Film> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('params' in $$props) $$invalidate(3, params = $$props.params);
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
    		currentEasing,
    		duration,
    		params,
    		data,
    		mysearch,
    		searchFilm,
    		loadDataFilm
    	});

    	$$self.$inject_state = $$props => {
    		if ('currentEasing' in $$props) $$invalidate(1, currentEasing = $$props.currentEasing);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('params' in $$props) $$invalidate(3, params = $$props.params);
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('mysearch' in $$props) mysearch = $$props.mysearch;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data, currentEasing, duration, params];
    }

    class Film extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { params: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Film",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get params() {
    		throw new Error("<Film>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Film>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Film$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Film
    });

    /* src/routes/Home/Search.svelte generated by Svelte v3.47.0 */

    const { console: console_1 } = globals;
    const file = "src/routes/Home/Search.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (71:32) 
    function create_if_block_1(ctx) {
    	let div0;
    	let h3;
    	let t0;
    	let t1_value = /*data*/ ctx[0].total + "";
    	let t1;
    	let t2;
    	let div1;
    	let each_value = /*data*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h3 = element("h3");
    			t0 = text("Всего результатов: ");
    			t1 = text(t1_value);
    			t2 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h3, file, 72, 8, 2551);
    			attr_dev(div0, "class", "mt-3 d-flex justify-content-center");
    			add_location(div0, file, 71, 4, 2494);
    			attr_dev(div1, "class", "wrapper mt-2 svelte-pk62ge");
    			add_location(div1, file, 74, 4, 2607);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h3);
    			append_dev(h3, t0);
    			append_dev(h3, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t1_value !== (t1_value = /*data*/ ctx[0].total + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*data, filmDate*/ 9) {
    				each_value = /*data*/ ctx[0];
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
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(71:32) ",
    		ctx
    	});

    	return block;
    }

    // (61:0) {#if data.loading === true}
    function create_if_block(ctx) {
    	let section;
    	let div3;
    	let div1;
    	let div0;
    	let span;
    	let t1;
    	let div2;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div3 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			span = element("span");
    			span.textContent = "Loading...";
    			t1 = space();
    			div2 = element("div");
    			attr_dev(div0, "class", "spinner-border loading-icon text-success");
    			attr_dev(div0, "role", "status");
    			attr_dev(div0, "id", "");
    			add_location(div0, file, 66, 8, 2176);
    			attr_dev(span, "class", "loading-text text-success");
    			add_location(span, file, 66, 88, 2256);
    			attr_dev(div1, "class", "loading-colors loading-spinner position-absolute");
    			add_location(div1, file, 63, 8, 2079);
    			attr_dev(div2, "class", "loading-backdrop position-absolute");
    			attr_dev(div2, "id", "");
    			set_style(div2, "opacity", "0.2");
    			set_style(div2, "background-color", "blue");
    			add_location(div2, file, 67, 8, 2328);
    			attr_dev(div3, "id", "loading-test-2");
    			set_style(div3, "height", "300px");
    			set_style(div3, "width", "100%");
    			set_style(div3, "z-index", "1029");
    			attr_dev(div3, "class", "position-relative");
    			add_location(div3, file, 62, 4, 1969);
    			attr_dev(section, "class", "w-100 p-4 d-flex justify-content-center pb-4");
    			add_location(section, file, 61, 0, 1902);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div3);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			append_dev(div1, span);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
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
    		id: create_if_block.name,
    		type: "if",
    		source: "(61:0) {#if data.loading === true}",
    		ctx
    	});

    	return block;
    }

    // (129:20) {:else}
    function create_else_block(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "No items found";
    			add_location(span, file, 129, 17, 4632);
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
    		source: "(129:20) {:else}",
    		ctx
    	});

    	return block;
    }

    // (127:16) {#each film.genres || [] as genre, i}
    function create_each_block_1(ctx) {
    	let span;
    	let t0_value = /*genre*/ ctx[8].name + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(span, "class", "video-genres");
    			add_location(span, file, 127, 20, 4526);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t0_value !== (t0_value = /*genre*/ ctx[8].name + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(127:16) {#each film.genres || [] as genre, i}",
    		ctx
    	});

    	return block;
    }

    // (76:0) {#each data as film}
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
    	let t2_value = /*film*/ ctx[5].ru_title + "";
    	let t2;
    	let a1_href_value;
    	let t3;
    	let div2;
    	let span;
    	let t4_value = /*filmDate*/ ctx[3](/*film*/ ctx[5].released) + "";
    	let t4;
    	let t5;
    	let t6;
    	let div4_intro;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*film*/ ctx[5].genres || [];
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
    			if (!src_url_equal(img.src, img_src_value = /*film*/ ctx[5].poster_path)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Poster");
    			add_location(img, file, 78, 12, 2803);
    			attr_dev(i, "class", "fas fa-play fa-4x text-primary d-flex align-items-center justify-content-center h-100");
    			add_location(i, file, 90, 53, 3217);
    			attr_dev(a0, "href", a0_href_value = "/film/" + /*film*/ ctx[5].imdb_id);
    			add_location(a0, file, 90, 13, 3177);
    			attr_dev(div0, "class", "mask");
    			set_style(div0, "background", "linear-gradient( 45deg, rgba(29, 236, 197, 0.5), rgba(91, 14, 214, 0.5) 100% )");
    			add_location(div0, file, 81, 12, 2904);
    			attr_dev(div1, "class", "bg-image hover-overlay");
    			add_location(div1, file, 77, 8, 2754);
    			set_style(h3, "overflow", "hidden");
    			set_style(h3, "max-height", "54px");
    			set_style(h3, "margin", "5px 0 0");
    			set_style(h3, "font-size", "15px");
    			set_style(h3, "font-weight", "600");
    			set_style(h3, "line-height", "18px");
    			set_style(h3, "color", "#333");
    			add_location(h3, file, 103, 16, 3717);
    			attr_dev(a1, "href", a1_href_value = "/film/" + /*film*/ ctx[5].imdb_id);
    			set_style(a1, "overflow", "hidden");
    			set_style(a1, "max-height", "54px");
    			set_style(a1, "margin", "5px 0 0");
    			set_style(a1, "font-size", "15px");
    			set_style(a1, "font-weight", "600");
    			set_style(a1, "line-height", "18px");
    			set_style(a1, "color", "#333");
    			add_location(a1, file, 94, 12, 3434);
    			attr_dev(span, "class", "video-year");
    			add_location(span, file, 125, 16, 4394);
    			attr_dev(div2, "class", "d-flexborder align-items-end");
    			set_style(div2, "height", "18px");
    			set_style(div2, "margin", "2px 0 3px");
    			set_style(div2, "color", "#a6a6a6");
    			set_style(div2, "font-size", "12px");
    			set_style(div2, "font-weight", "400");
    			set_style(div2, "line-height", "18px");
    			set_style(div2, "overflow", "hidden");
    			set_style(div2, "text-overflow", "ellipsis");
    			set_style(div2, "white-space", "nowrap");
    			add_location(div2, file, 114, 12, 4050);
    			attr_dev(div3, "class", "p-2 d-flexborder align-items-end flex-fill");
    			add_location(div3, file, 93, 8, 3365);
    			attr_dev(div4, "class", "card d-flex flex-column m-2  svelte-pk62ge");
    			add_location(div4, file, 76, 4, 2659);
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

    			if (dirty & /*data*/ 1 && !src_url_equal(img.src, img_src_value = /*film*/ ctx[5].poster_path)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*data*/ 1 && a0_href_value !== (a0_href_value = "/film/" + /*film*/ ctx[5].imdb_id)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*data*/ 1 && t2_value !== (t2_value = /*film*/ ctx[5].ru_title + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*data*/ 1 && a1_href_value !== (a1_href_value = "/film/" + /*film*/ ctx[5].imdb_id)) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (dirty & /*data*/ 1 && t4_value !== (t4_value = /*filmDate*/ ctx[3](/*film*/ ctx[5].released) + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*data*/ 1) {
    				each_value_1 = /*film*/ ctx[5].genres || [];
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
    		id: create_each_block.name,
    		type: "each",
    		source: "(76:0) {#each data as film}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*data*/ ctx[0].loading === true) return create_if_block;
    		if (/*data*/ ctx[0].loading !== true) return create_if_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: function intro(local) {
    			transition_in(if_block);
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) {
    				if_block.d(detaching);
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

    async function loadPoster(id, i) {
    	const response = await fetch("https://api.themoviedb.org/3/movie/" + id + "?api_key=012107c38dbdef7c24537c12f1f022e6&language=ru-RU");
    	const character = await response.json();
    	let src = '';

    	src = character.poster_path !== null && character.poster_path !== undefined
    	? 'https://image.tmdb.org/t/p/original' + character.poster_path
    	: '/build/noposter.png';

    	if (i !== undefined) {
    		i.genres = character.genres;
    		return src;
    	}
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Search', slots, []);
    	let currentEasing = circIn;
    	let duration = 700;
    	let data = [];
    	data.loading = true;
    	let { params } = $$props;

    	if (params === undefined) {
    		params = {};
    		params.id = 1;
    	}

    	onMount(async () => {
    		const response = await fetch('https://38.svetacdn.in/api/movies?api_token=caPViSv7B4vYtQeyX0bAAdcHxSOQSc1O&query=' + params.text);
    		const filmsPage = await response.json();
    		$$invalidate(0, data = filmsPage.data);
    		$$invalidate(0, data.total = filmsPage.total, data);
    		console.log(filmsPage);
    		data.every((element, index, array) => loadPoster(data[index].imdb_id, element).then(returns => $$invalidate(0, data[index].poster_path = returns, data)));
    		loadPoster(data[0].imdb_id);
    		console.log(data);
    		$$invalidate(0, data.loading = false, data);

    		// Optional return. Great place for clean-up code.
    		return () => {
    			
    		}; // ... Code to run just before the component is removed ("unmounted") from the DOM.
    	});

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
    		if ('params' in $$props) $$invalidate(4, params = $$props.params);
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
    		currentEasing,
    		duration,
    		data,
    		params,
    		loadPoster,
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

    	return [data, currentEasing, duration, filmDate, params];
    }

    class Search extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { params: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Search",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[4] === undefined && !('params' in props)) {
    			console_1.warn("<Search> was created without expected prop 'params'");
    		}
    	}

    	get params() {
    		throw new Error("<Search>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Search>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Search$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Search
    });

    /* src/routes/Home/NotFound.svelte generated by Svelte v3.47.0 */

    function create_fragment(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
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
