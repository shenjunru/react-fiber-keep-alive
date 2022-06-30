"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markEffectHookIsOnetime = exports.markClassComponentHasSideEffectRender = exports.useIgnoreKeepAlive = exports.keepAlive = exports.KeepAlive = exports.KeepAliveContext = void 0;
const React = require("react");
const helpers_1 = require("./helpers");
Object.defineProperty(exports, "markClassComponentHasSideEffectRender", { enumerable: true, get: function () { return helpers_1.markClassComponentHasSideEffectRender; } });
Object.defineProperty(exports, "markEffectHookIsOnetime", { enumerable: true, get: function () { return helpers_1.markEffectHookIsOnetime; } });
function noop() { }
const { useCallback, useContext, useEffect, useInsertionEffect, useLayoutEffect, useMemo, useRef, useState, } = React;
const InBrowser = (typeof window !== 'undefined' &&
    typeof window.document !== 'undefined' &&
    typeof window.document.createElement !== 'undefined');
const HasInsertionEffect = null != useInsertionEffect;
const useIsomorphicLayoutEffect = InBrowser ? useLayoutEffect : useEffect;
const useIsomorphicInsertionEffect = InBrowser ? useInsertionEffect || useIsomorphicLayoutEffect : useEffect;
exports.KeepAliveContext = React.createContext([]);
const KeepAliveProvider = (props) => {
    const container = props.value;
    const context = useMemo(() => {
        return container ? [container, new Map(), new Map()] : [];
    }, []);
    return (React.createElement(exports.KeepAliveContext.Provider, { value: context }, props.children));
};
class KeepAliveCursor extends React.Component {
    render() {
        return null;
    }
}
const KeepAliveEffect = (props) => {
    const [container] = useContext(exports.KeepAliveContext);
    const cursor = props.cursor;
    const state = props.state;
    const [step] = state;
    useIsomorphicInsertionEffect(() => {
        if (!container || step !== 2) {
            return;
        }
        const rootFiber = (0, helpers_1.getRootFiber)(container);
        const wipRootFiber = HasInsertionEffect ? rootFiber === null || rootFiber === void 0 ? void 0 : rootFiber.alternate : rootFiber;
        const cursorFiber = (0, helpers_1.findFiber)(wipRootFiber, (fiber) => fiber.stateNode === cursor.current);
        const effectFiber = cursorFiber === null || cursorFiber === void 0 ? void 0 : cursorFiber.sibling;
        const renderFiber = effectFiber === null || effectFiber === void 0 ? void 0 : effectFiber.sibling;
        const finishFiber = renderFiber === null || renderFiber === void 0 ? void 0 : renderFiber.sibling;
        if (rootFiber && effectFiber && renderFiber && finishFiber) {
            (0, helpers_1.appendFiberEffect)(rootFiber, effectFiber, renderFiber, finishFiber);
        }
    }, [state]);
    useEffect(noop, [state]);
    return null;
};
const KeepAliveRender = (props) => (React.createElement(React.Fragment, null, props.children));
const KeepAliveFinish = (props) => {
    const state = props.state;
    useIsomorphicInsertionEffect(noop, [state]);
    useIsomorphicLayoutEffect(noop, [state]);
    useEffect(noop, [state]);
    return null;
};
const KeepAliveManage = (props) => {
    const [container, caches, mapper] = useContext(exports.KeepAliveContext);
    const cursor = useRef(null);
    const readKey = useMemo(() => (mapper === null || mapper === void 0 ? void 0 : mapper.get(props.name)) || props.name, []);
    props.name && (mapper === null || mapper === void 0 ? void 0 : mapper.set(props.name, readKey));
    const [state, setState] = useState(() => {
        const _cache = caches === null || caches === void 0 ? void 0 : caches.get(readKey);
        caches === null || caches === void 0 ? void 0 : caches.delete(readKey);
        props.ignore && (mapper === null || mapper === void 0 ? void 0 : mapper.forEach((value, key) => {
            if (value === readKey) {
                mapper.delete(key);
            }
        }));
        return props.ignore ? [0, null] : [1, _cache || null];
    });
    const [step, cache] = state;
    const bypass = useRef(false);
    const ignore = useRef(true === props.ignore);
    ignore.current = true === props.ignore;
    const refProps = useRef(props);
    refProps.current = props;
    useIsomorphicLayoutEffect(() => () => {
        var _a, _b, _c;
        if (!container || !caches || !readKey || ignore.current || bypass.current) {
            return;
        }
        const rootFiber = (0, helpers_1.getRootFiber)(container);
        const cursorFiber = (0, helpers_1.findFiber)(rootFiber, (fiber) => fiber.stateNode === cursor.current);
        const renderFiber = (_a = cursorFiber === null || cursorFiber === void 0 ? void 0 : cursorFiber.sibling) === null || _a === void 0 ? void 0 : _a.sibling;
        if (!renderFiber) {
            return;
        }
        const boundaryFiber = (0, helpers_1.findParentFiber)(cursorFiber, KeepAliveRender);
        if (boundaryFiber) {
            return;
        }
        const restore = (0, helpers_1.protectFiber)(renderFiber);
        caches.set(readKey, [renderFiber, restore]);
        (_c = (_b = refProps.current).onSave) === null || _c === void 0 ? void 0 : _c.call(_b, readKey);
    }, []);
    useEffect(() => {
        var _a;
        if (step !== 1) {
            return;
        }
        if (!container || !readKey || !cache) {
            return setState([0, cache]);
        }
        const rootFiber = (0, helpers_1.getRootFiber)(container);
        const cursorFiber = (0, helpers_1.findFiber)(rootFiber, (fiber) => fiber.stateNode === cursor.current);
        const renderFiber = (_a = cursorFiber === null || cursorFiber === void 0 ? void 0 : cursorFiber.sibling) === null || _a === void 0 ? void 0 : _a.sibling;
        if (!renderFiber || !renderFiber) {
            return setState([1, cache]);
        }
        const boundaryFiber = (0, helpers_1.findParentFiber)(cursorFiber, KeepAliveRender);
        if (boundaryFiber) {
            bypass.current = true;
            return setState([0, null]);
        }
        const [cachedFiber, restore] = cache;
        (0, helpers_1.replaceFiber)(renderFiber, cachedFiber, restore);
        return setState([2, null]);
    }, [state]);
    useEffect(() => {
        var _a, _b;
        if (step === 2) {
            setState([0, null]);
            (_b = (_a = refProps.current).onRead) === null || _b === void 0 ? void 0 : _b.call(_a, readKey);
        }
    }, [state]);
    return (React.createElement(React.Fragment, null,
        React.createElement(KeepAliveCursor, { ref: cursor }),
        React.createElement(KeepAliveEffect, { cursor: cursor, name: readKey, state: state }),
        React.createElement(KeepAliveRender, null, null != cache ? null : props.children),
        React.createElement(KeepAliveFinish, { state: state })));
};
exports.KeepAlive = Object.assign(KeepAliveManage, {
    Context: exports.KeepAliveContext,
    Provider: KeepAliveProvider,
});
function keepAlive(Component, getProps) {
    return (props) => {
        const value = getProps(props);
        const alive = typeof value === 'string' ? { name: value } : value;
        return (React.createElement(exports.KeepAlive, Object.assign({}, alive),
            React.createElement(Component, Object.assign({}, props))));
    };
}
exports.keepAlive = keepAlive;
const useIgnoreKeepAlive = () => {
    const [, caches, mapper] = useContext(exports.KeepAliveContext);
    return useCallback((name) => {
        const readKey = mapper === null || mapper === void 0 ? void 0 : mapper.get(name);
        readKey && (caches === null || caches === void 0 ? void 0 : caches.delete(readKey));
        readKey && (mapper === null || mapper === void 0 ? void 0 : mapper.forEach((value, key) => {
            if (value === readKey) {
                mapper.delete(key);
            }
        }));
    }, [caches, mapper]);
};
exports.useIgnoreKeepAlive = useIgnoreKeepAlive;
exports.default = exports.KeepAlive;
