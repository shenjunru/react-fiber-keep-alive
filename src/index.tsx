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
type KeepAliveStatus = [Step];

const randomKey = Math.random().toString(36).slice(2);
const KeepAlivePropKey = '__keepAlive$' + randomKey;
const KeepAliveContext = createContext<null | HTMLElement>(null);

const KeepAliveEffect: React.FC<{
    host: React.RefObject<HTMLDivElement>;
    name: string;
    status: KeepAliveStatus;
}> = (props) => {
    const context = useContext(KeepAliveContext);
    const status = props.status;
    const host = props.host;
    // const name = props.name;
    const [step] = status;

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
    }, [context, status]);

    // fake passive effect
    useEffect(noop, [context, status]);

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

const KeepAlive = Object.assign<React.FC<{
    name: string;
    hostTag?: 'div' | 'span';
    children: React.ReactNode;
}>, {
    Provider: typeof KeepAliveContext.Provider;
}>((props) => {
    const name = props.name;
    const HostTag = props.hostTag || 'div';
    const hostRef = useRef<HTMLDivElement>(null);
    const context = useContext(KeepAliveContext);
    const [status, setStatus] = useState<KeepAliveStatus>([Step.Render]);
    const caches = useMemo((): Map<string, [Fiber, { current: boolean }]> => {
        const value = (context as any)?.[KeepAlivePropKey] || new Map();
        if (context) {
            (context as any)[KeepAlivePropKey] = value;
        }
        return value;
    }, [context]);

    const [step] = status;
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
            return setStatus([Step.Finish]);
        }

        const rootFiber = getRootFiber(context);
        const hostFiber = findFiber(rootFiber, (fiber) => fiber.stateNode === hostRef.current);

        const oldFiber = hostFiber?.child?.sibling;
        const oldElement: Nullable<HTMLElement> = oldFiber?.child?.stateNode;
        if (!hostFiber || !oldFiber || !oldElement?.parentElement) {
            // console.log('[KEEP-ALIVE]', '[WAIT]', name);
            return setStatus([Step.Render]);
        }

        caches.delete(name);

        const [newFiber, restore] = cache;
        restoreFiber(newFiber, restore);

        const newElement: Nullable<HTMLElement> = newFiber.child?.stateNode;
        if (!newElement) {
            // console.error('[KEEP-ALIVE]', '[FAIL]', name, newFiber);
            return setStatus([Step.Finish]);
        }

        // console.log('[KEEP-ALIVE]', '[SWAP]', name, { newFiber, oldFiber });
        oldElement.parentElement.replaceChild(newElement, oldElement);

        replaceFiber(oldFiber, newFiber);

        return setStatus([Step.Effect]);
    }, [context, status, name]);

    useEffect(() => {
        if (step === Step.Effect) {
            // console.log('[KEEP-ALIVE]', '[DONE]', name);
            setStatus([Step.Finish]);
        }
    }, [context, status, name]);

    return (
        <HostTag ref={hostRef} data-keep-alive-host={name}>
            <KeepAliveEffect host={hostRef} name={name} status={status} />
            <KeepAliveRender>
                <HostTag data-keep-alive-save={name}>
                    {null != cache ? null : props.children}
                </HostTag>
            </KeepAliveRender>
            <KeepAliveFinish />
        </HostTag>
    );
}, {
    Provider: KeepAliveContext.Provider,
});

function keepAlive<P>(
    Component: React.ComponentType<P>,
    getCacheName: (props: P) => string,
): React.FC<P> {
    return (props) => {
        const name = getCacheName(props);
        return (
            <KeepAlive name={name}>
                <Component {...props} />
            </KeepAlive>
        );
    };
}

export default KeepAlive;
export {
    useIsomorphicLayoutEffect,
    keepAlive,
    KeepAlive,
};
export {
    markClassComponentHasSideEffectRender,
    markEffectHookIsOnetime,
} from './helpers';
