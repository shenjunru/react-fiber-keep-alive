import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, } from 'react';
import { markClassComponentHasSideEffectRender, markEffectHookIsOnetime, appendFiberEffect, findFiber, findParentFiber, getRootFiber, protectFiber, replaceFiber, } from './helpers';
function noop() { }
const InBrowser = (typeof window !== 'undefined' &&
    typeof window.document !== 'undefined' &&
    typeof window.document.createElement !== 'undefined');
const useIsomorphicLayoutEffect = InBrowser ? useLayoutEffect : useEffect;
const randomKey = Math.random().toString(36).slice(2);
const KeepAlivePropKey = '__keepAlive$' + randomKey;
const KeepAliveContext = createContext(null);
class KeepAliveCursor extends React.Component {
    render() {
        return null;
    }
}
const KeepAliveEffect = (props) => {
    const context = useContext(KeepAliveContext);
    const cursor = props.cursor;
    const state = props.state;
    const [step] = state;
    useIsomorphicLayoutEffect(() => {
        if (!context || step !== 2) {
            return;
        }
        const rootFiber = getRootFiber(context);
        const cursorFiber = findFiber(rootFiber, (fiber) => fiber.stateNode === cursor.current);
        const effectFiber = cursorFiber?.sibling;
        const renderFiber = effectFiber?.sibling;
        const finishFiber = renderFiber?.sibling;
        if (rootFiber && effectFiber && renderFiber && finishFiber) {
            appendFiberEffect(rootFiber, effectFiber, renderFiber, finishFiber);
        }
    }, [context, state]);
    useEffect(noop, [context, state]);
    return null;
};
const KeepAliveRender = (props) => (React.createElement(React.Fragment, null, props.children));
const KeepAliveFinish = () => {
    useIsomorphicLayoutEffect(noop);
    useEffect(noop);
    return null;
};
const KeepAliveManage = (props) => {
    const name = props.name;
    const context = useContext(KeepAliveContext);
    const cursor = useRef(null);
    const ignore = useRef(true === props.ignore);
    const caches = useMemo(() => {
        const value = context?.[KeepAlivePropKey] || new Map();
        if (context) {
            context[KeepAlivePropKey] = value;
        }
        return value;
    }, [context]);
    ignore.current = true === props.ignore;
    const [state, setState] = useState(() => {
        return [1, ignore.current ? null : caches.get(name)];
    });
    const [step, cache] = state;
    useIsomorphicLayoutEffect(() => () => {
        if (!context || ignore.current) {
            return;
        }
        const rootFiber = getRootFiber(context);
        const cursorFiber = findFiber(rootFiber, (fiber) => fiber.stateNode === cursor.current);
        const renderFiber = cursorFiber?.sibling?.sibling;
        if (!renderFiber) {
            return;
        }
        const boundaryFiber = findParentFiber(cursorFiber, KeepAliveRender);
        if (boundaryFiber) {
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
            name && ignore.current && caches.delete(name);
            return setState([0, cache]);
        }
        const rootFiber = getRootFiber(context);
        const cursorFiber = findFiber(rootFiber, (fiber) => fiber.stateNode === cursor.current);
        const renderFiber = cursorFiber?.sibling?.sibling;
        if (!renderFiber || !renderFiber) {
            return setState([1, cache]);
        }
        const boundaryFiber = findParentFiber(cursorFiber, KeepAliveRender);
        if (boundaryFiber) {
            return setState([0, null]);
        }
        caches.delete(name);
        const [cachedFiber, restore] = cache;
        replaceFiber(renderFiber, cachedFiber, restore);
        return setState([2, null]);
    }, [context, state, name]);
    useEffect(() => {
        if (step === 2) {
            setState([0, null]);
        }
    }, [context, state, name]);
    return (React.createElement(React.Fragment, null,
        React.createElement(KeepAliveCursor, { ref: cursor }),
        React.createElement(KeepAliveEffect, { cursor: cursor, name: name, state: state }),
        React.createElement(KeepAliveRender, null, null != cache ? null : props.children),
        React.createElement(KeepAliveFinish, null)));
};
export const KeepAlive = Object.assign(KeepAliveManage, {
    Provider: KeepAliveContext.Provider,
});
export function keepAlive(Component, getProps) {
    return (props) => {
        const value = getProps(props);
        const alive = typeof value === 'string' ? { name: value } : value;
        return (React.createElement(KeepAlive, { ...alive },
            React.createElement(Component, { ...props })));
    };
}
export { markClassComponentHasSideEffectRender, markEffectHookIsOnetime, };
export default KeepAlive;
