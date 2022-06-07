import type { Fiber } from 'react-reconciler';
import React, {
    createContext,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    markClassComponentHasSideEffectRender,
    markEffectHookIsOnetime,
    appendFiberEffect,
    findFiber,
    findParentFiber,
    getRootFiber,
    protectFiber,
    replaceFiber,
} from './helpers';

function noop() {}

const InBrowser = (
    typeof window !== 'undefined' &&
    typeof window.document !== 'undefined' &&
    typeof window.document.createElement !== 'undefined'
);

const useIsomorphicLayoutEffect = InBrowser ? useLayoutEffect : useEffect;

const enum Step {
    Finish = 0b0000,
    Render = 0b0001,
    Effect = 0b0010,
}

type KeepAliveCache = [Fiber, { current: boolean }];
type KeepAliveState = [Step, null | KeepAliveCache];
type KeepAliveProps = {
    name: string;
    ignore?: boolean;
    children: React.ReactNode;
};

const randomKey = Math.random().toString(36).slice(2);
const CachesPropKey = '__keepAliveCaches$' + randomKey;
const MapperPropKey = '__keepAliveMapper$' + randomKey;
const KeepAliveContext = createContext<null | HTMLElement>(null);

const KeepAliveProvider: React.FC<{
    children: React.ReactNode;
    value: null | HTMLElement;
}> = (props) => {
    const value = props.value;

    useEffect(() => () => {
        if (value) {
            delete (value as any)[CachesPropKey];
            delete (value as any)[MapperPropKey];
        }
    }, [value]);

    return (
        <KeepAliveContext.Provider {...props} />
    );
};

class KeepAliveCursor extends React.Component {
    public render() {
        return null;
    }
}

const KeepAliveEffect: React.FC<{
    cursor: React.RefObject<KeepAliveCursor>;
    state: KeepAliveState;
    name: string;
}> = (props) => {
    const context = useContext(KeepAliveContext);
    const cursor = props.cursor;
    const state = props.state;
    const [step] = state;

    useIsomorphicLayoutEffect(() => {
        if (!context || step !== Step.Effect) {
            return;
        }

        // console.log('[KEEP-ALIVE] [LIVE]', props.name);

        const rootFiber = getRootFiber(context);
        const cursorFiber = findFiber(rootFiber, (fiber) => fiber.stateNode === cursor.current);
        const effectFiber = cursorFiber?.sibling;
        const renderFiber = effectFiber?.sibling;
        const finishFiber = renderFiber?.sibling;

        if (rootFiber && effectFiber && renderFiber && finishFiber) {
            appendFiberEffect(rootFiber, effectFiber, renderFiber, finishFiber);
        }
    }, [state]);

    // fake passive effect
    useEffect(noop, [state]);

    return null;
};

const KeepAliveRender: React.FC<{
    children: React.ReactNode;
}> = (props) => (
    <>{props.children}</>
);

const KeepAliveFinish: React.FC<{
    state: KeepAliveState;
}> = (props) => {
    const state = props.state;

    useIsomorphicLayoutEffect(noop, [state]);
    useEffect(noop, [state]);

    return null;
};

const KeepAliveManage: React.FC<KeepAliveProps> = (props) => {
    const context = useContext(KeepAliveContext);
    const cursor = useRef<KeepAliveCursor>(null);
    const caches = useMemo((): Map<string, KeepAliveCache> => {
        const value = (context as any)?.[CachesPropKey] || new Map();
        if (context) {
            (context as any)[CachesPropKey] = value;
        }
        return value;
    }, []);
    const mapper = useMemo((): Map<string, string> => {
        const value = (context as any)?.[MapperPropKey] || new Map();
        if (context) {
            (context as any)[MapperPropKey] = value;
        }
        return value;
    }, []);

    const readKey = useMemo(() => mapper.get(props.name) || props.name, []);
    props.name && mapper.set(props.name, readKey);

    const [state, setState] = useState<KeepAliveState>(() => {
        const _cache = caches.get(readKey);
        caches.delete(readKey);

        props.ignore && mapper.forEach((value, key) => {
            if (value === readKey) {
                mapper.delete(key);
            }
        });

        return props.ignore ? [Step.Finish, null] : [Step.Render, _cache || null];
    });
    const [step, cache] = state;

    const bypass = useRef(false);
    const ignore = useRef(true === props.ignore);
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

        // console.log('[KEEP-ALIVE]', '[SAVE]', name, renderFiber);
        const restore = protectFiber(renderFiber);
        caches.set(readKey, [renderFiber, restore]);
    }, []);

    useEffect(() => {
        if (step !== Step.Render) {
            return;
        }

        if (!context || !readKey || !cache) {
            // console.log('[KEEP-ALIVE]', '[SKIP]', name);
            return setState([Step.Finish, cache]);
        }

        const rootFiber = getRootFiber(context);
        const cursorFiber = findFiber(rootFiber, (fiber) => fiber.stateNode === cursor.current);
        const renderFiber = cursorFiber?.sibling?.sibling;
        if (!renderFiber || !renderFiber) {
            // console.log('[KEEP-ALIVE]', '[WAIT]', name);
            return setState([Step.Render, cache]);
        }

        const boundaryFiber = findParentFiber(cursorFiber, KeepAliveRender);
        if (boundaryFiber) {
            // console.log('[KEEP-ALIVE]', '[PASS]', name);
            bypass.current = true;
            return setState([Step.Finish, null]);
        }

        const [cachedFiber, restore] = cache;
        // console.log('[KEEP-ALIVE]', '[SWAP]', name);
        replaceFiber(renderFiber, cachedFiber, restore);

        return setState([Step.Effect, null]);
    }, [state]);

    useEffect(() => {
        if (step === Step.Effect) {
            // console.log('[KEEP-ALIVE]', '[DONE]', name);
            setState([Step.Finish, null]);
        }
    }, [state]);

    return (
        <>
            <KeepAliveCursor ref={cursor} />
            <KeepAliveEffect cursor={cursor} name={readKey} state={state} />
            <KeepAliveRender>
                {null != cache ? null : props.children}
            </KeepAliveRender>
            <KeepAliveFinish state={state} />
        </>
    );
};

export const KeepAlive = Object.assign(KeepAliveManage, {
    Provider: KeepAliveProvider,
});

export function keepAlive<P>(
    Component: React.ComponentType<P>,
    getProps: (props: P) => (
        | (Omit<KeepAliveProps, 'children'> & { key?: React.Key })
        | string
    ),
): React.FC<P> {
    return (props) => {
        const value = getProps(props);
        const alive = typeof value === 'string' ? { name: value } : value;
        return (
            <KeepAlive {...alive}>
                <Component {...props} />
            </KeepAlive>
        );
    };
}

export {
    markClassComponentHasSideEffectRender,
    markEffectHookIsOnetime,
};

export default KeepAlive;

