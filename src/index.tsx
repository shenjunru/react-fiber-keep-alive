import type { History } from 'history';
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
    Nullable,
    appendFiberEffect,
    findFiberByType,
    getRootFiber,
    protectFiber,
    restoreFiber,
    replaceFiber,
} from './helpers';

export {
    markClassComponentHasSideEffectRender,
    markEffectHookIsOnetime,
} from './helpers';

type Context = [null | HTMLElement, string, string, number];

enum Step {
    Finish = 0b0000,
    Render = 0b0001,
    Effect = 0b0010,
}

export function noop() {}
const DefaultRouteKey = 'default';
const KeepAliveContext = createContext<Context>([null, DefaultRouteKey, DefaultRouteKey, Step.Finish]);

const KeepAliveEffect: React.FC = () => {
    const context = useContext(KeepAliveContext);
    const [container, target, , step] = context;

    useLayoutEffect(() => {
        if (!(step & Step.Effect)) {
            return;
        }

        console.log('[KEEP-ALIVE] [LIFE]', target);
        context[3] = Step.Finish;

        const rootFiber = getRootFiber(container);
        const thisFiber = findFiberByType(rootFiber, KeepAliveEffect);
        const takeFiber = findFiberByType(rootFiber, KeepAliveRender);
        const nextFiber = findFiberByType(rootFiber, KeepAliveFinish);

        if (rootFiber && thisFiber && takeFiber && nextFiber) {
            appendFiberEffect(rootFiber, thisFiber, takeFiber, nextFiber);
        }
    }, [context]);

    // fake passive effect
    useEffect(noop, [context]);

    return null;
};

const KeepAliveFinish: React.FC = () => {
    useLayoutEffect(noop);
    useEffect(noop);

    return null;
};

const KeepAliveRender: React.FC<{
    children: React.ReactNode;
    name: string;
    wait: boolean;
}> = ({ children, name, wait }) => {
    return (
        <div data-keep-alive-save={name}>
            {wait ? null : children}
        </div>
    );
};

export function keepAlive<P>(Component: React.ComponentType<P>): React.FC<P> {
    return (props) => {
        const context = useContext(KeepAliveContext);
        const [, target, current] = context;

        return (
            <div data-keep-alive-wrap={target}>
                <KeepAliveEffect />
                <KeepAliveRender key={target} name={target} wait={target !== current}>
                    <Component {...props} />
                </KeepAliveRender>
                <KeepAliveFinish />
            </div>
        );
    };
}

export const KeepAliveProvider: React.FC<{
    children: React.ReactNode;
    container: HTMLElement;
    history: History;
}> = ({ children, container, history }) => {
    const caches = useMemo(() => new Map<string, Fiber>(), []);
    const restore = useRef<boolean>(false);
    const [context, setContext] = useState<Context>([container, DefaultRouteKey, DefaultRouteKey, Step.Finish]);
    const [, target, current, step] = context;

    const unbind = useMemo(() => history.listen(({ key = DefaultRouteKey }) => {
        const rootFiber = getRootFiber(container);
        const newFiber = findFiberByType(rootFiber, KeepAliveRender);

        if (newFiber?.key && newFiber.child) {
            console.log('[KEEP-ALIVE]', '[SAVE]', newFiber.key, newFiber);
            protectFiber(newFiber, restore);
            caches.set(newFiber.key, newFiber);
        }

        setContext(([, old]) => [container, key, old, Step.Render]);
        // TEST POINT: context updated during the fiber remounting
    }), []);

    useEffect(() => unbind, []);

    useEffect(() => {
        if (target === target && !(step & Step.Render)) {
            return;
        }

        const newStatus: Context = [container, target, target, Step.Finish];
        const newFiber = caches.get(target);

        if (!newFiber) {
            console.log('[KEEP-ALIVE]', '[SKIP]', target);
            // TEST POINT: context updated while the fiber is detached
            return setContext(newStatus);
        }

        const rootFiber = getRootFiber(container);
        if (!rootFiber) {
            console.error('[KEEP-ALIVE]', '[SKIP]', 'No root fiber');
            return setContext(newStatus);
        }

        const oldFiber = findFiberByType(rootFiber, KeepAliveRender);
        const oldElement: Nullable<HTMLElement> = oldFiber?.child?.stateNode;
        if (!oldElement?.parentElement || (target !== oldFiber?.key)) {
            console.log('[KEEP-ALIVE]', '[WAIT]', target);
            return setContext([container, target, current, step]);
        }

        restoreFiber(newFiber, restore);

        const newElement: Nullable<HTMLElement> = newFiber.child?.stateNode;
        if (!newElement) {
            console.error('[KEEP-ALIVE]', '[SKIP]', 'Invalid cache', newFiber);
            return setContext(newStatus);
        }

        console.log('[KEEP-ALIVE]', '[SWAP]', target, { newFiber: oldFiber, oldFiber: newFiber });
        oldElement.parentElement.replaceChild(newElement, oldElement);
        caches.delete(target);

        replaceFiber(oldFiber, newFiber);

        return setContext([container, target, target, Step.Effect]);
    }, [context]);

    // optional step
    useEffect(() => {
        if (!(step & Step.Effect)) {
            return;
        }
        console.log('[KEEP-ALIVE]', '[DONE]', target);
        setContext([container, target, current, Step.Finish]);
    }, [context]);

    return (
        <KeepAliveContext.Provider value={context}>
            {children}
        </KeepAliveContext.Provider>
    );
};

export default KeepAliveProvider;
