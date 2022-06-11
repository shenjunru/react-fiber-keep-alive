import * as React from 'react';
import { markClassComponentHasSideEffectRender, markEffectHookIsOnetime, appendFiberEffect, findFiber, findParentFiber, getRootFiber, protectFiber, replaceFiber, } from './helpers';
function noop() { }
const InBrowser = (typeof window !== 'undefined' &&
    typeof window.document !== 'undefined' &&
    typeof window.document.createElement !== 'undefined');
const useIsomorphicLayoutEffect = InBrowser ? React.useLayoutEffect : React.useEffect;
const randomKey = Math.random().toString(36).slice(2);
const CachesPropKey = ('__keepAliveCaches$' + randomKey);
const MapperPropKey = ('__keepAliveMapper$' + randomKey);
const KeepAliveContext = React.createContext(null);
const KeepAliveProvider = (props) => {
    const context = props.value;
    React.useEffect(() => () => {
        if (context) {
            delete context[CachesPropKey];
            delete context[MapperPropKey];
        }
    }, [context]);
    return (React.createElement(KeepAliveContext.Provider, { ...props }));
};
class KeepAliveCursor extends React.Component {
    render() {
        return null;
    }
}
const KeepAliveEffect = (props) => {
    const context = React.useContext(KeepAliveContext);
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
    }, [state]);
    React.useEffect(noop, [state]);
    return null;
};
const KeepAliveRender = (props) => (React.createElement(React.Fragment, null, props.children));
const KeepAliveFinish = (props) => {
    const state = props.state;
    useIsomorphicLayoutEffect(noop, [state]);
    React.useEffect(noop, [state]);
    return null;
};
const KeepAliveManage = (props) => {
    const context = React.useContext(KeepAliveContext);
    const cursor = React.useRef(null);
    const caches = React.useMemo(() => {
        const value = context?.[CachesPropKey] || new Map();
        if (context) {
            context[CachesPropKey] = value;
        }
        return value;
    }, []);
    const mapper = React.useMemo(() => {
        const value = context?.[MapperPropKey] || new Map();
        if (context) {
            context[MapperPropKey] = value;
        }
        return value;
    }, []);
    const readKey = React.useMemo(() => mapper.get(props.name) || props.name, []);
    props.name && mapper.set(props.name, readKey);
    const [state, setState] = React.useState(() => {
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
    const bypass = React.useRef(false);
    const ignore = React.useRef(true === props.ignore);
    ignore.current = true === props.ignore;
    useIsomorphicLayoutEffect(() => () => {
        if (!context || !readKey || ignore.current || bypass.current) {
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
        caches.set(readKey, [renderFiber, restore]);
    }, []);
    React.useEffect(() => {
        if (step !== 1) {
            return;
        }
        if (!context || !readKey || !cache) {
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
            bypass.current = true;
            return setState([0, null]);
        }
        const [cachedFiber, restore] = cache;
        replaceFiber(renderFiber, cachedFiber, restore);
        return setState([2, null]);
    }, [state]);
    React.useEffect(() => {
        if (step === 2) {
            setState([0, null]);
        }
    }, [state]);
    return (React.createElement(React.Fragment, null,
        React.createElement(KeepAliveCursor, { ref: cursor }),
        React.createElement(KeepAliveEffect, { cursor: cursor, name: readKey, state: state }),
        React.createElement(KeepAliveRender, null, null != cache ? null : props.children),
        React.createElement(KeepAliveFinish, { state: state })));
};
export const KeepAlive = Object.assign(KeepAliveManage, {
    Provider: KeepAliveProvider,
});
export function keepAlive(Component, getProps) {
    return (props) => {
        const value = getProps(props);
        const alive = typeof value === 'string' ? { name: value } : value;
        return (React.createElement(KeepAlive, { ...alive },
            React.createElement(Component, { ...props })));
    };
}
export const useIgnoreKeepAlive = () => {
    const context = React.useContext(KeepAliveContext);
    return React.useCallback((name) => {
        const caches = context?.[CachesPropKey];
        const mapper = context?.[MapperPropKey];
        const readKey = mapper?.get(name);
        readKey && caches?.delete(readKey);
        readKey && mapper?.forEach((value, key) => {
            if (value === readKey) {
                mapper.delete(key);
            }
        });
    }, [context]);
};
export { markClassComponentHasSideEffectRender, markEffectHookIsOnetime, };
export default KeepAlive;
