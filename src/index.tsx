import type { Fiber } from 'react-reconciler';
import * as React from 'react';
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

const {
    useCallback,
    useContext,
    useEffect,
    useInsertionEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} = React as typeof React & {
    useInsertionEffect?: typeof React.useEffect;
};

const InBrowser = (
    typeof window !== 'undefined' &&
    typeof window.document !== 'undefined' &&
    typeof window.document.createElement !== 'undefined'
);

const HasInsertionEffect = null != useInsertionEffect;

const useIsomorphicLayoutEffect = InBrowser ? useLayoutEffect : useEffect;
const useIsomorphicInsertionEffect = InBrowser ? useInsertionEffect || useIsomorphicLayoutEffect : useEffect;

const enum Step {
    Finish = 0b0000,
    Render = 0b0001,
    Effect = 0b0010,
}

export type KeepAliveCache = [Fiber, { current: boolean }];
export type KeepAliveState = [Step, null | KeepAliveCache];

export type KeepAliveProps = {
    name: string;
    ignore?: boolean;
    children: React.ReactNode;
};

type Context = Readonly<[] | [HTMLElement, Map<string, KeepAliveCache>, Map<string, string>]>;

export const KeepAliveContext = React.createContext<Context>([]);

const KeepAliveProvider: React.FC<{
    children: React.ReactNode;
    value: null | HTMLElement;
}> = (props) => {
    const container = props.value;
    const context: Context = useMemo(() => {
        return container ? [container, new Map(), new Map()] : [];
    }, []);

    return (
        <KeepAliveContext.Provider value={context}>
            {props.children}
        </KeepAliveContext.Provider>
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
    const [container] = useContext(KeepAliveContext);
    const cursor = props.cursor;
    const state = props.state;
    const [step] = state;

    useIsomorphicInsertionEffect(() => {
        if (!container || step !== Step.Effect) {
            return;
        }

        // console.log('[KEEP-ALIVE] [LIVE]', props.name);
        const rootFiber = getRootFiber(container);
        const wipRootFiber = HasInsertionEffect ? rootFiber?.alternate : rootFiber;
        const cursorFiber = findFiber(wipRootFiber, (fiber) => fiber.stateNode === cursor.current);
        const effectFiber = cursorFiber?.sibling;
        const renderFiber = effectFiber?.sibling;
        const finishFiber = renderFiber?.sibling;

        if (rootFiber && effectFiber && renderFiber && finishFiber) {
            appendFiberEffect(rootFiber, effectFiber, renderFiber, finishFiber);
        }
    }, [state]);

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

    useIsomorphicInsertionEffect(noop, [state]);
    useIsomorphicLayoutEffect(noop, [state]);
    useEffect(noop, [state]);

    return null;
};

const KeepAliveManage: React.FC<KeepAliveProps> = (props) => {
    const [container, caches, mapper] = useContext(KeepAliveContext);
    const cursor = useRef<KeepAliveCursor>(null);

    const readKey = useMemo(() => mapper?.get(props.name) || props.name, []);
    props.name && mapper?.set(props.name, readKey);

    const [state, setState] = useState<KeepAliveState>(() => {
        const _cache = caches?.get(readKey);
        caches?.delete(readKey);

        props.ignore && mapper?.forEach((value, key) => {
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
        if (!container || !caches || !readKey || ignore.current || bypass.current) {
            return;
        }

        const rootFiber = getRootFiber(container);
        const cursorFiber = findFiber(rootFiber, (fiber) => fiber.stateNode === cursor.current);
        const renderFiber = cursorFiber?.sibling?.sibling;
        if (!renderFiber) {
            return;
        }

        const boundaryFiber = findParentFiber(cursorFiber, KeepAliveRender);
        if (boundaryFiber) {
            return;
        }

        // console.log('[KEEP-ALIVE]', '[SAVE]', readKey, renderFiber);
        const restore = protectFiber(renderFiber);
        caches.set(readKey, [renderFiber, restore]);
    }, []);

    useEffect(() => {
        if (step !== Step.Render) {
            return;
        }

        if (!container || !readKey || !cache) {
            // console.log('[KEEP-ALIVE]', '[SKIP]', readKey);
            return setState([Step.Finish, cache]);
        }

        const rootFiber = getRootFiber(container);
        const cursorFiber = findFiber(rootFiber, (fiber) => fiber.stateNode === cursor.current);
        const renderFiber = cursorFiber?.sibling?.sibling;
        if (!renderFiber || !renderFiber) {
            // console.log('[KEEP-ALIVE]', '[WAIT]', readKey);
            return setState([Step.Render, cache]);
        }

        const boundaryFiber = findParentFiber(cursorFiber, KeepAliveRender);
        if (boundaryFiber) {
            // console.log('[KEEP-ALIVE]', '[PASS]', readKey);
            bypass.current = true;
            return setState([Step.Finish, null]);
        }

        const [cachedFiber, restore] = cache;
        // console.log('[KEEP-ALIVE]', '[SWAP]', readKey);
        replaceFiber(renderFiber, cachedFiber, restore);

        return setState([Step.Effect, null]);
    }, [state]);

    useEffect(() => {
        if (step === Step.Effect) {
            // console.log('[KEEP-ALIVE]', '[DONE]', readKey);
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
    Context: KeepAliveContext,
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

export const useIgnoreKeepAlive = () => {
    const [, caches, mapper] = useContext(KeepAliveContext);

    return useCallback((name: string) => {
        const readKey = mapper?.get(name);
        readKey && caches?.delete(readKey);
        readKey && mapper?.forEach((value, key) => {
            if (value === readKey) {
                mapper.delete(key);
            }
        });
    }, [caches, mapper]);
};

export {
    markClassComponentHasSideEffectRender,
    markEffectHookIsOnetime,
};

export default KeepAlive;
