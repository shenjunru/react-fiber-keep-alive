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

enum Step {
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
}> = ({ host, name, status }) => {
    const context = useContext(KeepAliveContext);
    const [step] = status;

    useIsomorphicLayoutEffect(() => {
        if (!context || step !== Step.Effect) {
            return;
        }

        console.log('[KEEP-ALIVE] [LIFE]', name);

        const rootFiber = getRootFiber(context);
        const divFiber = findFiber(rootFiber, (fiber) => fiber.stateNode === host.current);

        const effectFiber = divFiber?.child;
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
    children: React.ReactNode;
    name: string;
    wait: boolean;
}> = ({ children, name, wait }) => (
    <div data-keep-alive-save={name}>
        {wait ? null : children}
    </div>
);

export const KeepAlive: React.FC<{
    name: string;
    children: React.ReactNode;
}> = ({ name, children }) => {
    const host = useRef<HTMLDivElement>(null);
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
        const hostFiber = findFiber(rootFiber, (fiber) => fiber.stateNode === host.current);

        const renderFiber = hostFiber?.child?.sibling;
        if (!name || !renderFiber) {
            return;
        }

        console.log('[KEEP-ALIVE]', '[SAVE]', name, renderFiber);
        const restore = protectFiber(renderFiber);
        caches.set(name, [renderFiber, restore]);
    }, [context, name]);

    useEffect(() => {
        if (step !== Step.Render) {
            return;
        }

        if (!context || !cache) {
            console.log('[KEEP-ALIVE]', '[SKIP]', name);
            return setStatus([Step.Finish]);
        }

        const rootFiber = getRootFiber(context);
        const divFiber = findFiber(rootFiber, (fiber) => fiber.stateNode === host.current);

        const oldFiber = divFiber?.child?.sibling;
        const oldElement: Nullable<HTMLElement> = oldFiber?.child?.stateNode;
        if (!divFiber || !oldFiber || !oldElement?.parentElement) {
            console.error('[KEEP-ALIVE]', '[WAIT]', name);
            return setStatus([Step.Render]);
        }

        caches.delete(name);

        const [newFiber, restore] = cache;
        restoreFiber(newFiber, restore);

        const newElement: Nullable<HTMLElement> = newFiber.child?.stateNode;
        if (!newElement) {
            console.error('[KEEP-ALIVE]', '[FAIL]', name, newFiber);
            return setStatus([Step.Finish]);
        }

        console.log('[KEEP-ALIVE]', '[SWAP]', name, { newFiber, oldFiber });
        oldElement.parentElement.replaceChild(newElement, oldElement);

        replaceFiber(oldFiber, newFiber);

        return setStatus([Step.Effect]);
    }, [context, status, name]);

    useEffect(() => {
        if (step === Step.Effect) {
            console.log('[KEEP-ALIVE]', '[DONE]', name);
            setStatus([Step.Finish]);
        }
    }, [context, status, name]);

    return (
        <div ref={host} data-keep-alive-host={name}>
            <KeepAliveEffect host={host} name={name} status={status} />
            <KeepAliveRender name={name} wait={null != cache}>
                {children}
            </KeepAliveRender>
            <KeepAliveFinish />
        </div>
    );
};

export default Object.assign(KeepAlive, {
    Provider: KeepAliveContext.Provider,
});

export function keepAlive<P>(
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

export {
    markClassComponentHasSideEffectRender,
    markEffectHookIsOnetime,
} from './helpers';
