"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markEffectHookIsOnetime = exports.markClassComponentHasSideEffectRender = exports.useIgnoreKeepAlive = exports.keepAlive = exports.KeepAlive = void 0;
const react_1 = require("react");
const helpers_1 = require("./helpers");
Object.defineProperty(exports, "markClassComponentHasSideEffectRender", { enumerable: true, get: function () { return helpers_1.markClassComponentHasSideEffectRender; } });
Object.defineProperty(exports, "markEffectHookIsOnetime", { enumerable: true, get: function () { return helpers_1.markEffectHookIsOnetime; } });
function noop() { }
const InBrowser = (typeof window !== 'undefined' &&
    typeof window.document !== 'undefined' &&
    typeof window.document.createElement !== 'undefined');
const useIsomorphicLayoutEffect = InBrowser ? react_1.useLayoutEffect : react_1.useEffect;
const randomKey = Math.random().toString(36).slice(2);
const CachesPropKey = ('__keepAliveCaches$' + randomKey);
const MapperPropKey = ('__keepAliveMapper$' + randomKey);
const KeepAliveContext = (0, react_1.createContext)(null);
const KeepAliveProvider = (props) => {
    const context = props.value;
    (0, react_1.useEffect)(() => () => {
        if (context) {
            delete context[CachesPropKey];
            delete context[MapperPropKey];
        }
    }, [context]);
    return (react_1.default.createElement(KeepAliveContext.Provider, Object.assign({}, props)));
};
class KeepAliveCursor extends react_1.default.Component {
    render() {
        return null;
    }
}
const KeepAliveEffect = (props) => {
    const context = (0, react_1.useContext)(KeepAliveContext);
    const cursor = props.cursor;
    const state = props.state;
    const [step] = state;
    useIsomorphicLayoutEffect(() => {
        if (!context || step !== 2) {
            return;
        }
        const rootFiber = (0, helpers_1.getRootFiber)(context);
        const cursorFiber = (0, helpers_1.findFiber)(rootFiber, (fiber) => fiber.stateNode === cursor.current);
        const effectFiber = cursorFiber === null || cursorFiber === void 0 ? void 0 : cursorFiber.sibling;
        const renderFiber = effectFiber === null || effectFiber === void 0 ? void 0 : effectFiber.sibling;
        const finishFiber = renderFiber === null || renderFiber === void 0 ? void 0 : renderFiber.sibling;
        if (rootFiber && effectFiber && renderFiber && finishFiber) {
            (0, helpers_1.appendFiberEffect)(rootFiber, effectFiber, renderFiber, finishFiber);
        }
    }, [state]);
    (0, react_1.useEffect)(noop, [state]);
    return null;
};
const KeepAliveRender = (props) => (react_1.default.createElement(react_1.default.Fragment, null, props.children));
const KeepAliveFinish = (props) => {
    const state = props.state;
    useIsomorphicLayoutEffect(noop, [state]);
    (0, react_1.useEffect)(noop, [state]);
    return null;
};
const KeepAliveManage = (props) => {
    const context = (0, react_1.useContext)(KeepAliveContext);
    const cursor = (0, react_1.useRef)(null);
    const caches = (0, react_1.useMemo)(() => {
        const value = (context === null || context === void 0 ? void 0 : context[CachesPropKey]) || new Map();
        if (context) {
            context[CachesPropKey] = value;
        }
        return value;
    }, []);
    const mapper = (0, react_1.useMemo)(() => {
        const value = (context === null || context === void 0 ? void 0 : context[MapperPropKey]) || new Map();
        if (context) {
            context[MapperPropKey] = value;
        }
        return value;
    }, []);
    const readKey = (0, react_1.useMemo)(() => mapper.get(props.name) || props.name, []);
    props.name && mapper.set(props.name, readKey);
    const [state, setState] = (0, react_1.useState)(() => {
        const _cache = caches.get(readKey);
        caches.delete(readKey);
        props.ignore && mapper.forEach((value, key) => {
            if (value === readKey) {
                mapper.delete(key);
            }
        });
        return props.ignore ? [0, null] : [1, _cache || null];
    });
    const [step, cache] = state;
    const bypass = (0, react_1.useRef)(false);
    const ignore = (0, react_1.useRef)(true === props.ignore);
    ignore.current = true === props.ignore;
    useIsomorphicLayoutEffect(() => () => {
        var _a;
        if (!context || !readKey || ignore.current || bypass.current) {
            return;
        }
        const rootFiber = (0, helpers_1.getRootFiber)(context);
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
    }, []);
    (0, react_1.useEffect)(() => {
        var _a;
        if (step !== 1) {
            return;
        }
        if (!context || !readKey || !cache) {
            return setState([0, cache]);
        }
        const rootFiber = (0, helpers_1.getRootFiber)(context);
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
    (0, react_1.useEffect)(() => {
        if (step === 2) {
            setState([0, null]);
        }
    }, [state]);
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(KeepAliveCursor, { ref: cursor }),
        react_1.default.createElement(KeepAliveEffect, { cursor: cursor, name: readKey, state: state }),
        react_1.default.createElement(KeepAliveRender, null, null != cache ? null : props.children),
        react_1.default.createElement(KeepAliveFinish, { state: state })));
};
exports.KeepAlive = Object.assign(KeepAliveManage, {
    Provider: KeepAliveProvider,
});
function keepAlive(Component, getProps) {
    return (props) => {
        const value = getProps(props);
        const alive = typeof value === 'string' ? { name: value } : value;
        return (react_1.default.createElement(exports.KeepAlive, Object.assign({}, alive),
            react_1.default.createElement(Component, Object.assign({}, props))));
    };
}
exports.keepAlive = keepAlive;
const useIgnoreKeepAlive = () => {
    const context = (0, react_1.useContext)(KeepAliveContext);
    return (0, react_1.useCallback)((name) => {
        const caches = context === null || context === void 0 ? void 0 : context[CachesPropKey];
        const mapper = context === null || context === void 0 ? void 0 : context[MapperPropKey];
        const readKey = mapper === null || mapper === void 0 ? void 0 : mapper.get(name);
        readKey && (caches === null || caches === void 0 ? void 0 : caches.delete(readKey));
        readKey && (mapper === null || mapper === void 0 ? void 0 : mapper.forEach((value, key) => {
            if (value === readKey) {
                mapper.delete(key);
            }
        }));
    }, [context]);
};
exports.useIgnoreKeepAlive = useIgnoreKeepAlive;
exports.default = exports.KeepAlive;
