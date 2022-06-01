import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, } from 'react';
import { markClassComponentHasSideEffectRender, markEffectHookIsOnetime, appendFiberEffect, protectFiber, restoreFiber, replaceFiber, getRootFiber, findFiber, } from './helpers';
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
    const state = props.state;
    const host = props.host;
    const [step] = state;
    useIsomorphicLayoutEffect(() => {
        if (!context || step !== 2) {
            return;
        }
        const rootFiber = getRootFiber(context);
        const hostFiber = findFiber(rootFiber, (fiber) => fiber.stateNode === host.current);
        const effectFiber = hostFiber?.child;
        const renderFiber = effectFiber?.sibling;
        const finishFiber = renderFiber?.sibling;
        if (rootFiber && effectFiber && renderFiber && finishFiber) {
            appendFiberEffect(rootFiber, effectFiber, renderFiber, finishFiber);
        }
    }, [context, state]);
    useEffect(noop, [context, state]);
    return null;
};
const KeepAliveFinish = () => {
    useIsomorphicLayoutEffect(noop);
    useEffect(noop);
    return null;
};
const KeepAliveRender = (props) => React.Children.only(props.children);
const KeepAliveManage = (props) => {
    const name = props.name;
    const HostTag = props.hostTag || 'div';
    const hostRef = useRef(null);
    const context = useContext(KeepAliveContext);
    const [state, setState] = useState([1]);
    const caches = useMemo(() => {
        const value = context?.[KeepAlivePropKey] || new Map();
        if (context) {
            context[KeepAlivePropKey] = value;
        }
        return value;
    }, [context]);
    const [step] = state;
    const cache = caches.get(name);
    useIsomorphicLayoutEffect(() => () => {
        if (!context) {
            return;
        }
        const rootFiber = getRootFiber(context);
        const hostFiber = findFiber(rootFiber, (fiber) => fiber.stateNode === hostRef.current);
        const renderFiber = hostFiber?.child?.sibling;
        if (!renderFiber) {
            return;
        }
        const restore = protectFiber(renderFiber);
        caches.set(name, [renderFiber, restore]);
    }, [context, name]);
    useEffect(() => {
        if (step !== 1) {
            return;
        }
        if (!context || !name || !cache) {
            return setState([0]);
        }
        const rootFiber = getRootFiber(context);
        const hostFiber = findFiber(rootFiber, (fiber) => fiber.stateNode === hostRef.current);
        const oldFiber = hostFiber?.child?.sibling;
        const oldElement = oldFiber?.child?.stateNode;
        if (!hostFiber || !oldFiber || !oldElement?.parentElement) {
            return setState([1]);
        }
        caches.delete(name);
        const [newFiber, restore] = cache;
        restoreFiber(newFiber, restore);
        const newElement = newFiber.child?.stateNode;
        if (!newElement) {
            return setState([0]);
        }
        oldElement.parentElement.replaceChild(newElement, oldElement);
        replaceFiber(oldFiber, newFiber);
        return setState([2]);
    }, [context, state, name]);
    useEffect(() => {
        if (step === 2) {
            setState([0]);
        }
    }, [context, state, name]);
    return (React.createElement(HostTag, { ref: hostRef, "data-keep-alive-host": name },
        React.createElement(KeepAliveEffect, { host: hostRef, name: name, state: state }),
        React.createElement(KeepAliveRender, null,
            React.createElement(HostTag, { "data-keep-alive-save": name }, null != cache ? null : props.children)),
        React.createElement(KeepAliveFinish, null)));
};
function keepAlive(Component, getProps) {
    return (props) => {
        const value = getProps(props);
        const alive = typeof value === 'string' ? { name: value } : value;
        return (React.createElement(KeepAlive, Object.assign({}, alive),
            React.createElement(Component, Object.assign({}, props))));
    };
}
const KeepAlive = Object.assign(KeepAliveManage, {
    Provider: KeepAliveContext.Provider,
});
export default KeepAlive;
export { markClassComponentHasSideEffectRender, markEffectHookIsOnetime, useIsomorphicLayoutEffect, keepAlive, KeepAlive, };
