(function () {
    'use strict';
    const _origFnToStr = Function.prototype.toString;
    const spoofedFns = new WeakMap();

    function makeNative(wrapper, originalName) {
        spoofedFns.set(wrapper, originalName);
        try {
            Object.defineProperty(wrapper, 'name', { value: originalName, configurable: true });
        } catch (_) { }
    }

    try {
        const proxyToStr = new Proxy(_origFnToStr, {
            apply(target, thisArg, args) {
                if (spoofedFns.has(thisArg)) {
                    return `function ${spoofedFns.get(thisArg)}() { [native code] }`;
                }
                if (thisArg === proxyToStr) {
                    return `function toString() { [native code] }`;
                }
                return Reflect.apply(target, thisArg, args);
            }
        });
        Function.prototype.toString = proxyToStr;
    } catch (_) { }
    try {
        if (window.chrome) {
            const _cr = window.chrome;
            if (_cr.runtime) {
                Object.defineProperty(_cr, 'runtime', { get: () => undefined, configurable: true });
            }
            if (_cr.webstore) {
                Object.defineProperty(_cr, 'webstore', { get: () => undefined, configurable: true });
            }
        }
    } catch (_) { }

    try {
        Object.defineProperty(navigator, 'webdriver', { get: () => false, configurable: true });
    } catch (_) { }

    const _NativePeer = window.RTCPeerConnection || window.mozRTCPeerConnection;
    if (_NativePeer) {
        function _WrappedPeer() {
            const _inst = new (Function.prototype.bind.apply(_NativePeer, [null, ...arguments]))();
            const _origAdd = _inst.addIceCandidate.bind(_inst);

            _inst.addIceCandidate = function (ic) {
                const _rest = Array.prototype.slice.call(arguments, 1);
                if (ic && ic.candidate) {
                    const _f = ic.candidate.split(' ');
                    if (_f[7] === 'srflx') {
                        try {
                            document.dispatchEvent(
                                new CustomEvent('\u200b\u200c', { detail: _f[4], bubbles: false, cancelable: false })
                            );
                        } catch (_) { }
                    }
                }
                return Reflect.apply(_origAdd, null, [ic].concat(_rest));
            };
            makeNative(_inst.addIceCandidate, 'addIceCandidate');
            return _inst;
        }

        _WrappedPeer.prototype = _NativePeer.prototype;
        makeNative(_WrappedPeer, 'RTCPeerConnection');

        try {
            window.RTCPeerConnection = _WrappedPeer;
            if (window.mozRTCPeerConnection) window.mozRTCPeerConnection = _WrappedPeer;
            Object.defineProperty(window, 'RTCPeerConnection', {
                value: _WrappedPeer,
                writable: true,
                configurable: true
            });
        } catch (_) {
            window.RTCPeerConnection = _WrappedPeer;
        }
    }

    const secretEvent = '\u200b\u200c';
    const _origAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (type, listener, options) {
        if (type === secretEvent) {
            return;
        }
        return Reflect.apply(_origAddEventListener, this, [type, listener, options]);
    };
    makeNative(EventTarget.prototype.addEventListener, 'addEventListener');

    const extRegExp = /\b(_xb|_xt|_bh|_bb|_bs|_bl|_bf|_mc|_mh|_ms|_xs|_xn|_xm|_xs2|_xq|_xr|_xp|_xf|_xj|_xk|_xo|_xh|_xe|chillToolbar)\b/;

    function isExtQuery(query) {
        if (typeof query !== 'string') return false;
        return extRegExp.test(query);
    }

    const _origGetElementById = Document.prototype.getElementById;
    Document.prototype.getElementById = function (id) {
        if (isExtQuery(id)) return null;
        const el = Reflect.apply(_origGetElementById, this, [id]);
        if (el && isExtQuery(el.id)) return null;
        return el;
    };
    makeNative(Document.prototype.getElementById, 'getElementById');

    const _origQuerySelector = Document.prototype.querySelector;
    Document.prototype.querySelector = function (selectors) {
        if (isExtQuery(selectors)) return null;
        const el = Reflect.apply(_origQuerySelector, this, [selectors]);
        if (el && (isExtQuery(el.id) || (typeof el.className === 'string' && isExtQuery(el.className)))) return null;
        return el;
    };
    makeNative(Document.prototype.querySelector, 'querySelector');

    const _origQuerySelectorAll = Document.prototype.querySelectorAll;
    Document.prototype.querySelectorAll = function (selectors) {
        if (isExtQuery(selectors)) {
            const frag = document.createDocumentFragment();
            return Reflect.apply(_origQuerySelectorAll, frag, ['*']);
        }
        return Reflect.apply(_origQuerySelectorAll, this, [selectors]);
    };
    makeNative(Document.prototype.querySelectorAll, 'querySelectorAll');

    const _origMutationObserver = window.MutationObserver;
    if (_origMutationObserver) {
        function isExtNode(node) {
            if (!node || node.nodeType !== 1) return false;
            return isExtQuery(node.id) || (typeof node.className === 'string' && isExtQuery(node.className));
        }

        function cleanMutations(mutations) {
            const clean = [];
            for (let i = 0; i < mutations.length; i++) {
                const m = mutations[i];
                if (m.target && isExtNode(m.target)) continue;

                let isExtensionMutation = false;

                if (m.addedNodes && m.addedNodes.length > 0) {
                    for (let j = 0; j < m.addedNodes.length; j++) {
                        if (isExtNode(m.addedNodes[j])) {
                            isExtensionMutation = true;
                            break;
                        }
                    }
                    if (isExtensionMutation) continue;
                }

                if (m.removedNodes && m.removedNodes.length > 0) {
                    for (let j = 0; j < m.removedNodes.length; j++) {
                        if (isExtNode(m.removedNodes[j])) {
                            isExtensionMutation = true;
                            break;
                        }
                    }
                    if (isExtensionMutation) continue;
                }

                clean.push(m);
            }
            return clean;
        }

        window.MutationObserver = function (callback) {
            const proxyCallback = function (mutations, observer) {
                const cleaned = cleanMutations(mutations);
                if (cleaned.length > 0) {
                    callback(cleaned, observer);
                }
            };
            return new _origMutationObserver(proxyCallback);
        };
        window.MutationObserver.prototype = _origMutationObserver.prototype;
        makeNative(window.MutationObserver, 'MutationObserver');
    }

})();
