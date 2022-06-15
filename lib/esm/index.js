import * as React from 'react';
import { markClassComponentHasSideEffectRender, markEffectHookIsOnetime, appendFiberEffect, findFiber, findParentFiber, getRootFiber, protectFiber, replaceFiber, } from './helpers';
function noop() { }
const InBrowser = (typeof window !== 'undefined' &&
    typeof window.document !== 'undefined' &&
    typeof window.document.createElement !== 'undefined');
const useIsomorphicLayoutEffect = InBrowser ? React.useLayoutEffect : React.useEffect;
const KeepAliveContext = React.createContext([]);
const KeepAliveProvider = (props) => {
    const container = props.value;
    const context = React.useMemo(() => {
        return container ? [container, new Map(), new Map()] : [];
    }, []);
    return (React.createElement(KeepAliveContext.Provider, { value: context }, props.children));
};
class KeepAliveCursor extends React.Component {
    render() {
        return null;
    }
}
const KeepAliveEffect = (props) => {
    const [container] = React.useContext(KeepAliveContext);
    const cursor = props.cursor;
    const state = props.state;
    const [step] = state;
    useIsomorphicLayoutEffect(() => {
        if (!container || step !== 2) {
            return;
        }
        const rootFiber = getRootFiber(container);
        const cursorFiber = findFiber(rootFiber, (fiber) => fiber.stateNode === cursor.current);
        const effectFiber = cursorFiber === null || cursorFiber === void 0 ? void 0 : cursorFiber.sibling;
        const renderFiber = effectFiber === null || effectFiber === void 0 ? void 0 : effectFiber.sibling;
        const finishFiber = renderFiber === null || renderFiber === void 0 ? void 0 : renderFiber.sibling;
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
    const [container, caches, mapper] = React.useContext(KeepAliveContext);
    const cursor = React.useRef(null);
    const readKey = React.useMemo(() => (mapper === null || mapper === void 0 ? void 0 : mapper.get(props.name)) || props.name, []);
    props.name && (mapper === null || mapper === void 0 ? void 0 : mapper.set(props.name, readKey));
    const [state, setState] = React.useState(() => {
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
    const bypass = React.useRef(false);
    const ignore = React.useRef(true === props.ignore);
    ignore.current = true === props.ignore;
    useIsomorphicLayoutEffect(() => () => {
        var _a;
        if (!container || !caches || !readKey || ignore.current || bypass.current) {
            return;
        }
        const rootFiber = getRootFiber(container);
        const cursorFiber = findFiber(rootFiber, (fiber) => fiber.stateNode === cursor.current);
        const renderFiber = (_a = cursorFiber === null || cursorFiber === void 0 ? void 0 : cursorFiber.sibling) === null || _a === void 0 ? void 0 : _a.sibling;
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
        var _a;
        if (step !== 1) {
            return;
        }
        if (!container || !readKey || !cache) {
            return setState([0, cache]);
        }
        const rootFiber = getRootFiber(container);
        const cursorFiber = findFiber(rootFiber, (fiber) => fiber.stateNode === cursor.current);
        const renderFiber = (_a = cursorFiber === null || cursorFiber === void 0 ? void 0 : cursorFiber.sibling) === null || _a === void 0 ? void 0 : _a.sibling;
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
        return (React.createElement(KeepAlive, Object.assign({}, alive),
            React.createElement(Component, Object.assign({}, props))));
    };
}
export const useIgnoreKeepAlive = () => {
    const [, caches, mapper] = React.useContext(KeepAliveContext);
    return React.useCallback((name) => {
        const readKey = mapper === null || mapper === void 0 ? void 0 : mapper.get(name);
        readKey && (caches === null || caches === void 0 ? void 0 : caches.delete(readKey));
        readKey && (mapper === null || mapper === void 0 ? void 0 : mapper.forEach((value, key) => {
            if (value === readKey) {
                mapper.delete(key);
            }
        }));
    }, [caches, mapper]);
};
export { markClassComponentHasSideEffectRender, markEffectHookIsOnetime, };
export default KeepAlive;
