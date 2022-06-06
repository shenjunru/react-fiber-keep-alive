import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, } from 'react';
import { markClassComponentHasSideEffectRender, markEffectHookIsOnetime, appendFiberEffect, findFiber, findFiberByType, getRootFiber, protectFiber, replaceFiber, FiberVisit, } from './helpers';
function noop() { }
const useIsomorphicLayoutEffect = typeof window !== 'undefined' &&
    typeof window.document !== 'undefined' &&
    typeof window.document.createElement !== 'undefined'
    ? useLayoutEffect
    : useEffect;
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
        const cursorFiber = findFiber(rootFiber, (fiber) => fiber.stateNode === cursor.current);
        const renderFiber = cursorFiber?.sibling?.sibling;
        if (!renderFiber) {
            return;
        }
        if (findFiberByType(cursorFiber.return, KeepAliveRender, FiberVisit.Return)) {
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
        const cursorFiber = findFiber(rootFiber, (fiber) => fiber.stateNode === cursor.current);
        const renderFiber = cursorFiber?.sibling?.sibling;
        if (!renderFiber || !renderFiber) {
            return setState([1]);
        }
        caches.delete(name);
        const [cachedFiber, restore] = cache;
        replaceFiber(renderFiber, cachedFiber, restore);
        return setState([2]);
    }, [context, state, name]);
    useEffect(() => {
        if (step === 2) {
            setState([0]);
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
