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
type KeepAliveState = [Step, null | undefined | KeepAliveCache];
type KeepAliveProps = {
    name: string;
    ignore?: boolean;
    children: React.ReactNode;
};

const randomKey = Math.random().toString(36).slice(2);
const KeepAlivePropKey = '__keepAlive$' + randomKey;
const KeepAliveContext = createContext<null | HTMLElement>(null);

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
    }, [context, state]);

    // fake passive effect
    useEffect(noop, [context, state]);

    return null;
};

const KeepAliveRender: React.FC<{
    children: React.ReactNode;
}> = (props) => (
    <>{props.children}</>
);

const KeepAliveFinish: React.FC = () => {
    useIsomorphicLayoutEffect(noop);
    useEffect(noop);

    return null;
};

const KeepAliveManage: React.FC<KeepAliveProps> = (props) => {
    const name = props.name;
    const context = useContext(KeepAliveContext);
    const cursor = useRef<KeepAliveCursor>(null);
    const ignore = useRef(true === props.ignore);
    const caches = useMemo((): Map<string, [Fiber, { current: boolean }]> => {
        const value = (context as any)?.[KeepAlivePropKey] || new Map();
        if (context) {
            (context as any)[KeepAlivePropKey] = value;
        }
        return value;
    }, [context]);

    ignore.current = true === props.ignore;

    const [state, setState] = useState<KeepAliveState>(() => {
        return [Step.Render, ignore.current ? null : caches.get(name)];
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

        // console.log('[KEEP-ALIVE]', '[SAVE]', name, renderFiber);
        const restore = protectFiber(renderFiber);
        caches.set(name, [renderFiber, restore]);
    }, [context, name]);

    useEffect(() => {
        if (step !== Step.Render) {
            return;
        }

        if (!context || !name || !cache) {
            // console.log('[KEEP-ALIVE]', '[SKIP]', name);
            name && ignore.current && caches.delete(name);
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
            return setState([Step.Finish, null]);
        }

        caches.delete(name);
        // console.log('[KEEP-ALIVE]', '[SWAP]', name);

        const [cachedFiber, restore] = cache;
        replaceFiber(renderFiber, cachedFiber, restore);

        return setState([Step.Effect, null]);
    }, [context, state, name]);

    useEffect(() => {
        if (step === Step.Effect) {
            // console.log('[KEEP-ALIVE]', '[DONE]', name);
            setState([Step.Finish, null]);
        }
    }, [context, state, name]);

    return (
        <>
            <KeepAliveCursor ref={cursor} />
            <KeepAliveEffect cursor={cursor} name={name} state={state} />
            <KeepAliveRender>
                {null != cache ? null : props.children}
            </KeepAliveRender>
            <KeepAliveFinish />
        </>
    );
};

export const KeepAlive = Object.assign(KeepAliveManage, {
    Provider: KeepAliveContext.Provider,
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

