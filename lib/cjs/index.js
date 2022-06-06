"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markEffectHookIsOnetime = exports.markClassComponentHasSideEffectRender = exports.keepAlive = exports.KeepAlive = void 0;
const react_1 = require("react");
const helpers_1 = require("./helpers");
Object.defineProperty(exports, "markClassComponentHasSideEffectRender", { enumerable: true, get: function () { return helpers_1.markClassComponentHasSideEffectRender; } });
Object.defineProperty(exports, "markEffectHookIsOnetime", { enumerable: true, get: function () { return helpers_1.markEffectHookIsOnetime; } });
function noop() { }
const useIsomorphicLayoutEffect = typeof window !== 'undefined' &&
    typeof window.document !== 'undefined' &&
    typeof window.document.createElement !== 'undefined'
    ? react_1.useLayoutEffect
    : react_1.useEffect;
const randomKey = Math.random().toString(36).slice(2);
const KeepAlivePropKey = '__keepAlive$' + randomKey;
const KeepAliveContext = (0, react_1.createContext)(null);
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
    }, [context, state]);
    (0, react_1.useEffect)(noop, [context, state]);
    return null;
};
const KeepAliveRender = (props) => (react_1.default.createElement(react_1.default.Fragment, null, props.children));
const KeepAliveFinish = () => {
    useIsomorphicLayoutEffect(noop);
    (0, react_1.useEffect)(noop);
    return null;
};
const KeepAliveManage = (props) => {
    const name = props.name;
    const context = (0, react_1.useContext)(KeepAliveContext);
    const cursor = (0, react_1.useRef)(null);
    const [state, setState] = (0, react_1.useState)([1]);
    const caches = (0, react_1.useMemo)(() => {
        const value = (context === null || context === void 0 ? void 0 : context[KeepAlivePropKey]) || new Map();
        if (context) {
            context[KeepAlivePropKey] = value;
        }
        return value;
    }, [context]);
    const [step] = state;
    const cache = caches.get(name);
    useIsomorphicLayoutEffect(() => () => {
        var _a;
        if (!context) {
            return;
        }
        const rootFiber = (0, helpers_1.getRootFiber)(context);
        const cursorFiber = (0, helpers_1.findFiber)(rootFiber, (fiber) => fiber.stateNode === cursor.current);
        const renderFiber = (_a = cursorFiber === null || cursorFiber === void 0 ? void 0 : cursorFiber.sibling) === null || _a === void 0 ? void 0 : _a.sibling;
        if (!renderFiber) {
            return;
        }
        if ((0, helpers_1.findFiberByType)(cursorFiber.return, KeepAliveRender, helpers_1.FiberVisit.Return)) {
            return;
        }
        const restore = (0, helpers_1.protectFiber)(renderFiber);
        caches.set(name, [renderFiber, restore]);
    }, [context, name]);
    (0, react_1.useEffect)(() => {
        var _a;
        if (step !== 1) {
            return;
        }
        if (!context || !name || !cache) {
            return setState([0]);
        }
        const rootFiber = (0, helpers_1.getRootFiber)(context);
        const cursorFiber = (0, helpers_1.findFiber)(rootFiber, (fiber) => fiber.stateNode === cursor.current);
        const renderFiber = (_a = cursorFiber === null || cursorFiber === void 0 ? void 0 : cursorFiber.sibling) === null || _a === void 0 ? void 0 : _a.sibling;
        if (!renderFiber || !renderFiber) {
            return setState([1]);
        }
        caches.delete(name);
        const [cachedFiber, restore] = cache;
        (0, helpers_1.replaceFiber)(renderFiber, cachedFiber, restore);
        return setState([2]);
    }, [context, state, name]);
    (0, react_1.useEffect)(() => {
        if (step === 2) {
            setState([0]);
        }
    }, [context, state, name]);
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(KeepAliveCursor, { ref: cursor }),
        react_1.default.createElement(KeepAliveEffect, { cursor: cursor, name: name, state: state }),
        react_1.default.createElement(KeepAliveRender, null, null != cache ? null : props.children),
        react_1.default.createElement(KeepAliveFinish, null)));
};
exports.KeepAlive = Object.assign(KeepAliveManage, {
    Provider: KeepAliveContext.Provider,
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
exports.default = exports.KeepAlive;
