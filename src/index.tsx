import type { History } from 'history';
import type { Fiber } from 'react-reconciler';
import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { findFiberByType, getRootFiber, Nullable } from './helpers';
import pick from 'lodash/pick';

type Cache = [Fiber, Partial<Fiber>, Partial<Fiber>];
type Status = [string, void | Fiber];

const PatrialProps: Array<keyof Fiber> = [
    'alternate',
    'child',
    'firstEffect',
    'nextEffect',
    'lastEffect',
];

const KeepAliveTragetContext = createContext<string>('default');
const KeepAliveStatusContext = createContext<Status>(['default', undefined]);

const KeepAlive: React.FC<{
    children: React.ReactNode;
    name: string;
    wait: boolean;
}> = ({ children, name, wait }) => (
    <div data-keep-alive={name}>
        {wait ? null : children}
    </div>
);

export function keepAlive<P>(Component: React.ComponentType<P>): React.FC<P> {
    return (props) => {
        const key = useContext(KeepAliveTragetContext);
        const [name, cache] = useContext(KeepAliveStatusContext);
        return (
            <KeepAlive key={key} name={key} wait={key !== name || null != cache}>
                <Component {...props} />
            </KeepAlive>
        );
    };
}

export const KeepAliveProvider: React.FC<{
    children: React.ReactNode;
    container: HTMLElement;
    history: History;
}> = ({ children, container, history }) => {
    const caches = useMemo(() => new Map<string, Cache>(), []);
    const [target, setTarget] = useState<string>('default');
    const [status, setStatus] = useState<Status>(['default', undefined]);

    const unbind = useMemo(() => history.listen(({ key = 'default' }) => {
        const rootFiber = getRootFiber(container);
        const [newFiber] = findFiberByType(rootFiber, KeepAlive) || [];

        if (newFiber?.key && newFiber.child) {
            console.log('[KEEP-ALIVE]', '[KEEP]', newFiber.key, newFiber, newFiber.child);
            caches.set(newFiber.key, [
                newFiber,
                pick(newFiber, PatrialProps),
                pick(newFiber.alternate, PatrialProps),
            ]);
        }

        const cached = caches.get(key);
        if (cached) {
            const [oldFiber, oldPartial, altPartial] = cached;
            if (oldPartial.alternate) {
                Object.assign(oldPartial.alternate, altPartial);
            }
            Object.assign(oldFiber, oldPartial);
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

        const [newFiber] = findFiberByType(rootFiber, KeepAlive) || [];
        if (key !== newFiber?.key) {
            console.log('[KEEP-ALIVE]', '[WAIT]', `Wait "${key}" to be mounted`, newFiber, newFiber?.key);
            return void requestAnimationFrame(() => setStatus((curStatus) => {
                return curStatus !== status ? curStatus : [...status];
            }));
        }

        const parentFiber = newFiber.return;
        if (!parentFiber || parentFiber.child !== newFiber) {
            console.log('[KEEP-ALIVE]', '[WARN]', 'Invalid parent fiber', { oldFiber, newFiber });
            return setStatus(newStatus);
        }

        const newElement: Nullable<HTMLElement> = newFiber.child?.stateNode;
        if (!newElement?.parentElement) {
            console.log('[KEEP-ALIVE]', '[WAIT]', `Wait "${key}" to be rendered`, newElement);
            return void requestAnimationFrame(() => setStatus((curStatus) => {
                return curStatus !== status ? curStatus : [...status];
            }));
        }

        const oldElement: Nullable<HTMLElement> = oldFiber.child?.stateNode;
        if (!oldElement) {
            console.log('[KEEP-ALIVE]', '[WARN]', 'No old element', { oldFiber, newFiber });
            return setStatus(newStatus);
        }

        console.log('[KEEP-ALIVE]', '[SWAP]', key, { newFiber, oldFiber });
        caches.delete(key);
        newElement.parentElement.replaceChild(oldElement, newElement);

        parentFiber.child = oldFiber;
        oldFiber.return = parentFiber;
        if (newFiber._debugOwner) {
            oldFiber._debugOwner = newFiber._debugOwner;
        }

        if (!oldFiber.alternate || !parentFiber.alternate) {
            if (oldFiber.alternate) {
                oldFiber.alternate.return = null;
                oldFiber.alternate.sibling = null;
            }
        } else {
            parentFiber.alternate.child = oldFiber.alternate;
            oldFiber.alternate.return = parentFiber.alternate;
            if (newFiber.alternate?._debugOwner) {
                oldFiber.alternate._debugOwner = newFiber.alternate._debugOwner;
            }
        }

        setStatus(newStatus);
    }, [status]);

    return (
        <KeepAliveTragetContext.Provider value={target}>
            <KeepAliveStatusContext.Provider value={status}>
                {children}
            </KeepAliveStatusContext.Provider>
        </KeepAliveTragetContext.Provider>
    );
};

export default KeepAliveProvider;
