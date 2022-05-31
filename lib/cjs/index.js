"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markEffectHookIsOnetime = exports.markClassComponentHasSideEffectRender = exports.KeepAlive = exports.keepAlive = exports.useIsomorphicLayoutEffect = void 0;
const react_1 = require("react");
const helpers_1 = require("./helpers");
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
    const host = props.host;
    const [step] = props.status;
    useIsomorphicLayoutEffect(() => {
        if (!context || step !== 2) {
            return;
        }
        const rootFiber = helpers_1.getRootFiber(context);
        const divFiber = helpers_1.findFiber(rootFiber, (fiber) => fiber.stateNode === host.current);
        const effectFiber = divFiber === null || divFiber === void 0 ? void 0 : divFiber.child;
        const renderFiber = effectFiber === null || effectFiber === void 0 ? void 0 : effectFiber.sibling;
        const finishFiber = renderFiber === null || renderFiber === void 0 ? void 0 : renderFiber.sibling;
        if (rootFiber && effectFiber && renderFiber && finishFiber) {
            helpers_1.appendFiberEffect(rootFiber, effectFiber, renderFiber, finishFiber);
        }
    }, [context, props.status]);
    react_1.useEffect(noop, [context, props.status]);
    return null;
};
const KeepAliveFinish = () => {
    useIsomorphicLayoutEffect(noop);
    react_1.useEffect(noop);
    return null;
};
const KeepAliveRender = (props) => (react_1.default.createElement("div", { "data-keep-alive-save": props.name }, props.wait ? null : props.children));
const KeepAlive = Object.assign((props) => {
    const name = props.name;
    const host = react_1.useRef(null);
    const context = react_1.useContext(KeepAliveContext);
    const [status, setStatus] = react_1.useState([1]);
    const caches = react_1.useMemo(() => {
        var _a;
        const value = ((_a = context) === null || _a === void 0 ? void 0 : _a[KeepAlivePropKey]) || new Map();
        if (context) {
            context[KeepAlivePropKey] = value;
        }
        return value;
    }, [context]);
    const [step] = status;
    const cache = caches.get(name);
    useIsomorphicLayoutEffect(() => () => {
        var _a;
        if (!context) {
            return;
        }
        const rootFiber = helpers_1.getRootFiber(context);
        const hostFiber = helpers_1.findFiber(rootFiber, (fiber) => fiber.stateNode === host.current);
        const renderFiber = (_a = hostFiber === null || hostFiber === void 0 ? void 0 : hostFiber.child) === null || _a === void 0 ? void 0 : _a.sibling;
        if (!name || !renderFiber) {
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
        if (!context || !cache) {
            return setStatus([0]);
        }
        const rootFiber = helpers_1.getRootFiber(context);
        const divFiber = helpers_1.findFiber(rootFiber, (fiber) => fiber.stateNode === host.current);
        const oldFiber = (_a = divFiber === null || divFiber === void 0 ? void 0 : divFiber.child) === null || _a === void 0 ? void 0 : _a.sibling;
        const oldElement = (_b = oldFiber === null || oldFiber === void 0 ? void 0 : oldFiber.child) === null || _b === void 0 ? void 0 : _b.stateNode;
        if (!divFiber || !oldFiber || !(oldElement === null || oldElement === void 0 ? void 0 : oldElement.parentElement)) {
            console.error('[KEEP-ALIVE]', '[WAIT]', name);
            return setStatus([1]);
        }
        caches.delete(name);
        const [newFiber, restore] = cache;
        helpers_1.restoreFiber(newFiber, restore);
        const newElement = (_c = newFiber.child) === null || _c === void 0 ? void 0 : _c.stateNode;
        if (!newElement) {
            console.error('[KEEP-ALIVE]', '[FAIL]', name, newFiber);
            return setStatus([0]);
        }
        oldElement.parentElement.replaceChild(newElement, oldElement);
        helpers_1.replaceFiber(oldFiber, newFiber);
        return setStatus([2]);
    }, [context, status, name]);
    react_1.useEffect(() => {
        if (step === 2) {
            setStatus([0]);
        }
    }, [context, status, name]);
    return (react_1.default.createElement("div", { ref: host, "data-keep-alive-host": name },
        react_1.default.createElement(KeepAliveEffect, { host: host, name: name, status: status }),
        react_1.default.createElement(KeepAliveRender, { name: name, wait: null != cache }, props.children),
        react_1.default.createElement(KeepAliveFinish, null)));
}, {
    Provider: KeepAliveContext.Provider,
});
exports.KeepAlive = KeepAlive;
function keepAlive(Component, getCacheName) {
    return (props) => {
        const name = getCacheName(props);
        return (react_1.default.createElement(KeepAlive, { name: name },
            react_1.default.createElement(Component, Object.assign({}, props))));
    };
}
exports.keepAlive = keepAlive;
exports.default = KeepAlive;
var helpers_2 = require("./helpers");
Object.defineProperty(exports, "markClassComponentHasSideEffectRender", { enumerable: true, get: function () { return helpers_2.markClassComponentHasSideEffectRender; } });
Object.defineProperty(exports, "markEffectHookIsOnetime", { enumerable: true, get: function () { return helpers_2.markEffectHookIsOnetime; } });
