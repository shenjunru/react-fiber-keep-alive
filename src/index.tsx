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

const InBrowser = (
    typeof window !== 'undefined' &&
    typeof window.document !== 'undefined' &&
    typeof window.document.createElement !== 'undefined'
);

const useIsomorphicLayoutEffect = InBrowser ? React.useLayoutEffect : React.useEffect;

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

type Context = Readonly<[] | [HTMLElement, Map<string, KeepAliveCache>,  Map<string, string>]>;

const KeepAliveContext = React.createContext<Context>([]);

const KeepAliveProvider: React.FC<{
    children: React.ReactNode;
    value: null | HTMLElement;
}> = (props) => {
    const container = props.value;
    const context: Context = React.useMemo(() => {
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
    const [container] = React.useContext(KeepAliveContext);
    const cursor = props.cursor;
    const state = props.state;
    const [step] = state;

    useIsomorphicLayoutEffect(() => {
        if (!container || step !== Step.Effect) {
            return;
        }

        // console.log('[KEEP-ALIVE] [LIVE]', props.name);

        const rootFiber = getRootFiber(container);
        const cursorFiber = findFiber(rootFiber, (fiber) => fiber.stateNode === cursor.current);
        const effectFiber = cursorFiber?.sibling;
        const renderFiber = effectFiber?.sibling;
        const finishFiber = renderFiber?.sibling;

        if (rootFiber && effectFiber && renderFiber && finishFiber) {
            appendFiberEffect(rootFiber, effectFiber, renderFiber, finishFiber);
        }
    }, [state]);

    // fake passive effect
    React.useEffect(noop, [state]);

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
    React.useEffect(noop, [state]);

    return null;
};

const KeepAliveManage: React.FC<KeepAliveProps> = (props) => {
    const [container, caches, mapper] = React.useContext(KeepAliveContext);
    const cursor = React.useRef<KeepAliveCursor>(null);

    const readKey = React.useMemo(() => mapper?.get(props.name) || props.name, []);
    props.name && mapper?.set(props.name, readKey);

    const [state, setState] = React.useState<KeepAliveState>(() => {
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

    const bypass = React.useRef(false);
    const ignore = React.useRef(true === props.ignore);
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

        // console.log('[KEEP-ALIVE]', '[SAVE]', name, renderFiber);
        const restore = protectFiber(renderFiber);
        caches.set(readKey, [renderFiber, restore]);
    }, []);

    React.useEffect(() => {
        if (step !== Step.Render) {
            return;
        }

        if (!container || !readKey || !cache) {
            // console.log('[KEEP-ALIVE]', '[SKIP]', name);
            return setState([Step.Finish, cache]);
        }

        const rootFiber = getRootFiber(container);
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

    React.useEffect(() => {
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

export const useIgnoreKeepAlive = () => {
    const [, caches, mapper] = React.useContext(KeepAliveContext);

    return React.useCallback((name: string) => {
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
