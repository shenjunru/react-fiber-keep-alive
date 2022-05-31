import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, } from 'react';
import { appendFiberEffect, protectFiber, restoreFiber, replaceFiber, getRootFiber, findFiber, } from './helpers';
function noop() { }
const useIsomorphicLayoutEffect = typeof window !== 'undefined' &&
    typeof window.document !== 'undefined' &&
    typeof window.document.createElement !== 'undefined'
    ? useLayoutEffect
    : useEffect;
const randomKey = Math.random().toString(36).slice(2);
const KeepAlivePropKey = '__keepAlive$' + randomKey;
const KeepAliveContext = createContext(null);
const KeepAliveEffect = (props) => {
    const context = useContext(KeepAliveContext);
    const host = props.host;
    const [step] = props.status;
    useIsomorphicLayoutEffect(() => {
        if (!context || step !== 2) {
            return;
        }
        const rootFiber = getRootFiber(context);
        const divFiber = findFiber(rootFiber, (fiber) => fiber.stateNode === host.current);
        const effectFiber = divFiber?.child;
        const renderFiber = effectFiber?.sibling;
        const finishFiber = renderFiber?.sibling;
        if (rootFiber && effectFiber && renderFiber && finishFiber) {
            appendFiberEffect(rootFiber, effectFiber, renderFiber, finishFiber);
        }
    }, [context, props.status]);
    useEffect(noop, [context, props.status]);
    return null;
};
const KeepAliveFinish = () => {
    useIsomorphicLayoutEffect(noop);
    useEffect(noop);
    return null;
};
const KeepAliveRender = (props) => (React.createElement("div", { "data-keep-alive-save": props.name }, props.wait ? null : props.children));
const KeepAlive = Object.assign((props) => {
    const name = props.name;
    const host = useRef(null);
    const context = useContext(KeepAliveContext);
    const [status, setStatus] = useState([1]);
    const caches = useMemo(() => {
        const value = context?.[KeepAlivePropKey] || new Map();
        if (context) {
            context[KeepAlivePropKey] = value;
        }
        return value;
    }, [context]);
    const [step] = status;
    const cache = caches.get(name);
    useIsomorphicLayoutEffect(() => () => {
        if (!context) {
            return;
        }
        const rootFiber = getRootFiber(context);
        const hostFiber = findFiber(rootFiber, (fiber) => fiber.stateNode === host.current);
        const renderFiber = hostFiber?.child?.sibling;
        if (!name || !renderFiber) {
            return;
        }
        const restore = protectFiber(renderFiber);
        caches.set(name, [renderFiber, restore]);
    }, [context, name]);
    useEffect(() => {
        if (step !== 1) {
            return;
        }
        if (!context || !cache) {
            return setStatus([0]);
        }
        const rootFiber = getRootFiber(context);
        const divFiber = findFiber(rootFiber, (fiber) => fiber.stateNode === host.current);
        const oldFiber = divFiber?.child?.sibling;
        const oldElement = oldFiber?.child?.stateNode;
        if (!divFiber || !oldFiber || !oldElement?.parentElement) {
            console.error('[KEEP-ALIVE]', '[WAIT]', name);
            return setStatus([1]);
        }
        caches.delete(name);
        const [newFiber, restore] = cache;
        restoreFiber(newFiber, restore);
        const newElement = newFiber.child?.stateNode;
        if (!newElement) {
            console.error('[KEEP-ALIVE]', '[FAIL]', name, newFiber);
            return setStatus([0]);
        }
        oldElement.parentElement.replaceChild(newElement, oldElement);
        replaceFiber(oldFiber, newFiber);
        return setStatus([2]);
    }, [context, status, name]);
    useEffect(() => {
        if (step === 2) {
            setStatus([0]);
        }
    }, [context, status, name]);
    return (React.createElement("div", { ref: host, "data-keep-alive-host": name },
        React.createElement(KeepAliveEffect, { host: host, name: name, status: status }),
        React.createElement(KeepAliveRender, { name: name, wait: null != cache }, props.children),
        React.createElement(KeepAliveFinish, null)));
}, {
    Provider: KeepAliveContext.Provider,
});
function keepAlive(Component, getCacheName) {
    return (props) => {
        const name = getCacheName(props);
        return (React.createElement(KeepAlive, { name: name },
            React.createElement(Component, Object.assign({}, props))));
    };
}
export default KeepAlive;
export { useIsomorphicLayoutEffect, keepAlive, KeepAlive, };
export { markClassComponentHasSideEffectRender, markEffectHookIsOnetime, } from './helpers';
