"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeepAlive = exports.keepAlive = exports.useIsomorphicLayoutEffect = exports.markEffectHookIsOnetime = exports.markClassComponentHasSideEffectRender = void 0;
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
exports.useIsomorphicLayoutEffect = useIsomorphicLayoutEffect;
const randomKey = Math.random().toString(36).slice(2);
const KeepAlivePropKey = '__keepAlive$' + randomKey;
const KeepAliveContext = react_1.createContext(null);
const KeepAliveEffect = (props) => {
    const context = react_1.useContext(KeepAliveContext);
    const state = props.state;
    const host = props.host;
    const [step] = state;
    useIsomorphicLayoutEffect(() => {
        if (!context || step !== 2) {
            return;
        }
        const rootFiber = helpers_1.getRootFiber(context);
        const hostFiber = helpers_1.findFiber(rootFiber, (fiber) => fiber.stateNode === host.current);
        const effectFiber = hostFiber === null || hostFiber === void 0 ? void 0 : hostFiber.child;
        const renderFiber = effectFiber === null || effectFiber === void 0 ? void 0 : effectFiber.sibling;
        const finishFiber = renderFiber === null || renderFiber === void 0 ? void 0 : renderFiber.sibling;
        if (rootFiber && effectFiber && renderFiber && finishFiber) {
            helpers_1.appendFiberEffect(rootFiber, effectFiber, renderFiber, finishFiber);
        }
    }, [context, state]);
    react_1.useEffect(noop, [context, state]);
    return null;
};
const KeepAliveFinish = () => {
    useIsomorphicLayoutEffect(noop);
    react_1.useEffect(noop);
    return null;
};
const KeepAliveRender = (props) => react_1.default.Children.only(props.children);
const KeepAliveManage = (props) => {
    const name = props.name;
    const HostTag = props.hostTag || 'div';
    const hostRef = react_1.useRef(null);
    const context = react_1.useContext(KeepAliveContext);
    const [state, setState] = react_1.useState([1]);
    const caches = react_1.useMemo(() => {
        var _a;
        const value = ((_a = context) === null || _a === void 0 ? void 0 : _a[KeepAlivePropKey]) || new Map();
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
        const rootFiber = helpers_1.getRootFiber(context);
        const hostFiber = helpers_1.findFiber(rootFiber, (fiber) => fiber.stateNode === hostRef.current);
        const renderFiber = (_a = hostFiber === null || hostFiber === void 0 ? void 0 : hostFiber.child) === null || _a === void 0 ? void 0 : _a.sibling;
        if (!renderFiber) {
            return;
        }
        const restore = helpers_1.protectFiber(renderFiber);
        caches.set(name, [renderFiber, restore]);
    }, [context, name]);
    react_1.useEffect(() => {
        var _a, _b, _c;
        if (step !== 1) {
            return;
        }
        if (!context || !name || !cache) {
            return setState([0]);
        }
        const rootFiber = helpers_1.getRootFiber(context);
        const hostFiber = helpers_1.findFiber(rootFiber, (fiber) => fiber.stateNode === hostRef.current);
        const oldFiber = (_a = hostFiber === null || hostFiber === void 0 ? void 0 : hostFiber.child) === null || _a === void 0 ? void 0 : _a.sibling;
        const oldElement = (_b = oldFiber === null || oldFiber === void 0 ? void 0 : oldFiber.child) === null || _b === void 0 ? void 0 : _b.stateNode;
        if (!hostFiber || !oldFiber || !(oldElement === null || oldElement === void 0 ? void 0 : oldElement.parentElement)) {
            return setState([1]);
        }
        caches.delete(name);
        const [newFiber, restore] = cache;
        helpers_1.restoreFiber(newFiber, restore);
        const newElement = (_c = newFiber.child) === null || _c === void 0 ? void 0 : _c.stateNode;
        if (!newElement) {
            return setState([0]);
        }
        oldElement.parentElement.replaceChild(newElement, oldElement);
        helpers_1.replaceFiber(oldFiber, newFiber);
        return setState([2]);
    }, [context, state, name]);
    react_1.useEffect(() => {
        if (step === 2) {
            setState([0]);
        }
    }, [context, state, name]);
    return (react_1.default.createElement(HostTag, { ref: hostRef, "data-keep-alive-host": name },
        react_1.default.createElement(KeepAliveEffect, { host: hostRef, name: name, state: state }),
        react_1.default.createElement(KeepAliveRender, null,
            react_1.default.createElement(HostTag, { "data-keep-alive-save": name }, null != cache ? null : props.children)),
        react_1.default.createElement(KeepAliveFinish, null)));
};
function keepAlive(Component, getProps) {
    return (props) => {
        const value = getProps(props);
        const alive = typeof value === 'string' ? { name: value } : value;
        return (react_1.default.createElement(KeepAlive, Object.assign({}, alive),
            react_1.default.createElement(Component, Object.assign({}, props))));
    };
}
exports.keepAlive = keepAlive;
const KeepAlive = Object.assign(KeepAliveManage, {
    Provider: KeepAliveContext.Provider,
});
exports.KeepAlive = KeepAlive;
exports.default = KeepAlive;
