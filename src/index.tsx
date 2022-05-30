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
import noop from 'lodash/noop';

type Status = [string, void | Fiber];
type Target = string;

const DefaultRouteKey = 'default';
const KeepAliveTargetContext = createContext<Target>(DefaultRouteKey);
const KeepAliveStatusContext = createContext<Status>([DefaultRouteKey, undefined]);

const KeepAlive: React.FC<{
    children: React.ReactNode;
    name: string;
    wait: boolean;
}> = ({ children, name, wait }) => (
    <div data-keep-alive-save={name}>
        {wait ? null : children}
    </div>
);

export function keepAlive<P>(Component: React.ComponentType<P>): React.FC<P> {
    return (props) => {
        const key = useContext(KeepAliveTargetContext);
        const [name, cache] = useContext(KeepAliveStatusContext);

        return (
            <div data-keep-alive-wrap={key}>
                <KeepAlive key={key} name={key} wait={key !== name || null != cache}>
                    <Component {...props} />
                </KeepAlive>
            </div>
        );
    };
}

const EffectProp = Symbol('Effect');
const EnableProp = Symbol('Enable');
type EffectProxy = React.EffectCallback & {
    [EffectProp]: React.EffectCallback;
    [EnableProp]: boolean;
};
const asActiveEffect = (effect: React.EffectCallback) => {
    const proxy = (() => {
        return proxy[EnableProp] ? proxy[EffectProp]() : undefined;
    }) as EffectProxy;

    Object.defineProperty(proxy, EffectProp, {
        configurable: false,
        enumerable: false,
        get() {
            return effect;
        },
    });

    Object.defineProperty(proxy, EnableProp, {
        configurable: true,
        enumerable: false,
        value: false,
    });

    return proxy;
};

export const useActiveEffect = (effect: React.EffectCallback, deps: React.DependencyList) => {
    return useEffect(asActiveEffect(effect), deps);
};

export const useActiveLayoutEffect = (effect: React.EffectCallback, deps: React.DependencyList) => {
    return useLayoutEffect(asActiveEffect(effect), deps);
};

export const KeepAliveProvider: React.FC<{
    children: React.ReactNode;
    container: HTMLElement;
    history: History;
}> = ({ children, container, history }) => {
    const caches = useMemo(() => new Map<string, Fiber>(), []);
    const restore = useRef<boolean>(false);
    const [target, setTarget] = useState<Target>(DefaultRouteKey);
    const [status, setStatus] = useState<Status>([DefaultRouteKey, undefined]);

    const unbind = useMemo(() => history.listen(({ key = DefaultRouteKey }) => {
        const rootFiber = getRootFiber(container);
        const newFiber = findFiberByType(rootFiber, KeepAlive);

        if (newFiber?.key && newFiber.child) {
            console.log('[KEEP-ALIVE]', '[KEEP]', newFiber.key, newFiber);
            protectFiber(newFiber, restore);
            caches.set(newFiber.key, newFiber);
        }

        const oldFiber = caches.get(key);
        if (oldFiber) {
            restoreFiber(oldFiber, restore);
            requestAnimationFrame(() => {
                console.log('[KEEP-ALIVE]', '[LOAD]', key, oldFiber);
                setStatus([key, oldFiber]);
            });
        } else {
            requestAnimationFrame(() => {
                console.log('[KEEP-ALIVE]', '[LOAD]', key, undefined);
                setStatus([key, undefined]);
            });
        }

        setTarget(key);
    }), []);

    useEffect(() => unbind, []);

    useLayoutEffect(() => {
        const [key, oldFiber] = status;
        if (!oldFiber) {
            return;
        }

        const newStatus: Status = [key, undefined];
        const rootFiber = getRootFiber(container);
        if (!rootFiber) {
            console.log('[KEEP-ALIVE]', '[WARN]', 'No root fiber');
            return setStatus(newStatus);
        }

        const newFiber = findFiberByType(rootFiber, KeepAlive);
        if (key !== newFiber?.key) {
            console.log('[KEEP-ALIVE]', '[WAIT]', `Wait "${key}" to be mounted`, newFiber, newFiber?.key);
            return void requestAnimationFrame(() => {
                setStatus((curStatus) => {
                    return curStatus !== status ? curStatus : [...status];
                });
            });
        }

        const parentFiber = newFiber.return;
        if (!parentFiber || parentFiber.child !== newFiber) {
            console.log('[KEEP-ALIVE]', '[WARN]', 'Invalid parent fiber', { oldFiber, newFiber });
            return setStatus(newStatus);
        }

        const newElement: Nullable<HTMLElement> = newFiber.child?.stateNode;
        if (!newElement?.parentElement) {
            console.log('[KEEP-ALIVE]', '[WAIT]', `Wait "${key}" to be rendered`, newElement);
            return void requestAnimationFrame(() => {
                setStatus((curStatus) => {
                    return curStatus !== status ? curStatus : [...status];
                });
            });
        }

        const oldElement: Nullable<HTMLElement> = oldFiber.child?.stateNode;
        if (!oldElement) {
            console.log('[KEEP-ALIVE]', '[WARN]', 'No old element', { oldFiber, newFiber });
            return setStatus(newStatus);
        }

        console.log('[KEEP-ALIVE]', '[SWAP]', key, { newFiber, oldFiber });
        caches.delete(key);

        newElement.parentElement.replaceChild(oldElement, newElement);
        replaceFiber(newFiber, oldFiber);
        appendFiberEffect(rootFiber, oldFiber, KeepAliveProvider);

        // TODO: dangerous
        status[1] = undefined;
    }, [status]);

    // trigger effect hook
    useEffect(noop, [status]);

    return (
        <KeepAliveTargetContext.Provider value={target}>
            <KeepAliveStatusContext.Provider value={status}>
                {children}
            </KeepAliveStatusContext.Provider>
        </KeepAliveTargetContext.Provider>
    );
};

export default KeepAliveProvider;
