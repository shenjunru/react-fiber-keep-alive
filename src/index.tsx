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
    protectFiber,
    restoreFiber,
    replaceFiber,
    getRootFiber,
    findFiber,
} from './helpers';

function noop() {}

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' &&
  typeof window.document !== 'undefined' &&
  typeof window.document.createElement !== 'undefined'
    ? useLayoutEffect
    : useEffect

const enum Step {
    Finish = 0b0000,
    Render = 0b0001,
    Effect = 0b0010,
}

type Nullable<T> = T | null | undefined;
type KeepAliveState = [Step];
type KeepAliveProps = {
    name: string;
    hostTag?: 'div' | 'span';
    children: React.ReactNode;
};

const randomKey = Math.random().toString(36).slice(2);
const KeepAlivePropKey = '__keepAlive$' + randomKey;
const KeepAliveContext = createContext<null | HTMLElement>(null);

const KeepAliveEffect: React.FC<{
    host: React.RefObject<HTMLDivElement>;
    name: string;
    state: KeepAliveState;
}> = (props) => {
    const context = useContext(KeepAliveContext);
    const state = props.state;
    const host = props.host;
    // const name = props.name;
    const [step] = state;

    useIsomorphicLayoutEffect(() => {
        if (!context || step !== Step.Effect) {
            return;
        }

        // console.log('[KEEP-ALIVE] [LIVE]', name);

        const rootFiber = getRootFiber(context);
        const hostFiber = findFiber(rootFiber, (fiber) => fiber.stateNode === host.current);

        const effectFiber = hostFiber?.child;
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

const KeepAliveFinish: React.FC = () => {
    useIsomorphicLayoutEffect(noop);
    useEffect(noop);

    return null;
};

const KeepAliveRender: React.FC<{
    children: React.ReactElement;
}> = (props) => React.Children.only(props.children);

const KeepAliveManage: React.FC<KeepAliveProps> = (props) => {
    const name = props.name;
    const HostTag = props.hostTag || 'div';
    const hostRef = useRef<HTMLDivElement>(null);
    const context = useContext(KeepAliveContext);
    const [state, setState] = useState<KeepAliveState>([Step.Render]);
    const caches = useMemo((): Map<string, [Fiber, { current: boolean }]> => {
        const value = (context as any)?.[KeepAlivePropKey] || new Map();
        if (context) {
            (context as any)[KeepAlivePropKey] = value;
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
            return setState([Step.Finish]);
        }

        const rootFiber = getRootFiber(context);
        const hostFiber = findFiber(rootFiber, (fiber) => fiber.stateNode === hostRef.current);

        const oldFiber = hostFiber?.child?.sibling;
        const oldElement: Nullable<HTMLElement> = oldFiber?.child?.stateNode;
        if (!hostFiber || !oldFiber || !oldElement?.parentElement) {
            // console.log('[KEEP-ALIVE]', '[WAIT]', name);
            return setState([Step.Render]);
        }

        caches.delete(name);

        const [newFiber, restore] = cache;
        restoreFiber(newFiber, restore);

        const newElement: Nullable<HTMLElement> = newFiber.child?.stateNode;
        if (!newElement) {
            // console.error('[KEEP-ALIVE]', '[FAIL]', name, newFiber);
            return setState([Step.Finish]);
        }

        // console.log('[KEEP-ALIVE]', '[SWAP]', name, { newFiber, oldFiber });
        oldElement.parentElement.replaceChild(newElement, oldElement);

        replaceFiber(oldFiber, newFiber);

        return setState([Step.Effect]);
    }, [context, state, name]);

    useEffect(() => {
        if (step === Step.Effect) {
            // console.log('[KEEP-ALIVE]', '[DONE]', name);
            setState([Step.Finish]);
        }
    }, [context, state, name]);

    return (
        <HostTag ref={hostRef} data-keep-alive-host={name}>
            <KeepAliveEffect host={hostRef} name={name} state={state} />
            <KeepAliveRender>
                <HostTag data-keep-alive-save={name}>
                    {null != cache ? null : props.children}
                </HostTag>
            </KeepAliveRender>
            <KeepAliveFinish />
        </HostTag>
    );
};

function keepAlive<P>(
    Component: React.ComponentType<P>,
    getProps: (props: P) => string | Omit<KeepAliveProps, 'children'>,
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

const KeepAlive = Object.assign(KeepAliveManage, {
    Provider: KeepAliveContext.Provider,
});

export default KeepAlive;
export {
    markClassComponentHasSideEffectRender,
    markEffectHookIsOnetime,
    useIsomorphicLayoutEffect,
    keepAlive,
    KeepAlive,
};
