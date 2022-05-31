import type { ComponentType, ComponentProps } from 'react';
import type { Fiber } from 'react-reconciler';
import { version } from 'react';

export type Nullable<T> = T | null | undefined;

export const identity = <T>(x: T) => x;

export const noop = () => {/**/};

export const isFunction = (obj: any): obj is ((...args: any[]) => any) => {
    return 'function' === typeof obj;
};

const V16 = version.startsWith('16');
const DomPropPrefix = V16 ? '__reactInternalInstance$' : '__reactFiber$';
// const RefPropPrefix = V16 ? '_reactInternalFiber' : '_reactInternals';

// https://github.com/facebook/react/blob/main/packages/shared/ReactTypes.js
// https://cdn.jsdelivr.net/npm/@types/react-reconciler@0.26.6/index.d.ts
export interface TypedFiber<C extends ComponentType<any> = ComponentType<any>> extends Fiber {
    memoizedProps: ComponentProps<C>;
}

export type Container = HTMLElement & {
    _reactRootContainer?: {
        _internalRoot: {
            containerInfo: HTMLElement;
            current: Fiber;
        };
    };
};

export const getRootFiber = (container: Nullable<HTMLElement>) => {
    return (container as Container)?._reactRootContainer?._internalRoot.current;
};

export const getInternalKey = (element: Nullable<HTMLElement>) => {
    return element && Object.keys(element).find((key) => key.startsWith(DomPropPrefix));
};

export const getElementFiber = (element: Nullable<HTMLElement>) => {
    const internalKey = getInternalKey(element);
    return internalKey ? (element as any)[internalKey] as Fiber : undefined;
};

type NodePath<P extends (void | boolean)> = Array<P extends true ? (
    | 'return'
) : (
    | 'child'
    | 'sibling'
)>;

export const findFiber = <T extends Fiber, P extends boolean = false>(
    fiber: Nullable<Fiber>,
    predicate: (fiber: Fiber) => boolean,
    parent?: P,
): [null | T, NodePath<P>] => {
    const path: NodePath<P> = [];
    const stack = [fiber];
    while (stack.length) {
        const current = stack.pop();
        if (!current) {
            path.pop();
            continue;
        }
        if (predicate(current)) {
            return [<T>current, path];
        }
        if (true !== parent && current.child) {
            path.push('child' as any);
            stack.push(current.child);
        }
        if (!parent && current.sibling) {
            path.push('sibling' as any);
            stack.push(current.sibling);
        }
        if (parent && current.return) {
            path.push('return' as any);
            stack.push(current.return);
        }
    }
    return [null, []];
};

export const findFibers = <T extends Fiber, P extends boolean = false>(
    fiber: Nullable<Fiber>,
    predicate: (fiber: Fiber) => boolean,
    parent?: P,
): Array<[T, NodePath<P>]> => {
    const path: NodePath<P> = [];
    const result: Array<[T, NodePath<P>]> = [];
    const stack = [fiber];
    while (stack.length) {
        const current = stack.pop();
        if (!current) {
            path.pop();
            continue;
        }
        if (predicate(current)) {
            result.push([<T>current, [...path]]);
        }
        if (!parent && current.child) {
            path.push('child' as any);
            stack.push(current.child);
        }
        if (!parent && current.sibling) {
            path.push('sibling' as any);
            stack.push(current.sibling);
        }
        if (parent && current.return) {
            path.push('return' as any);
            stack.push(current.return);
        }
    }
    return result;
};

export const traverseFiber = (
    fiber: Nullable<Fiber>,
    visit: (fiber: Fiber) => void,
    parent?: boolean,
) => {
    const stack = [fiber];
    while (stack.length) {
        const current = stack.pop();
        if (!current) {
            continue;
        }
        visit(current);
        if (!parent && current.child) {
            stack.push(current.child);
        }
        if (!parent && current.sibling) {
            stack.push(current.sibling);
        }
        if (parent && current.return) {
            stack.push(current.return);
        }
    }
};

export const findFiberByType = <T extends ComponentType<any>, P extends boolean = false>(
    root: Nullable<Fiber>,
    type: T,
    parent?: P,
): [null | TypedFiber<T>, NodePath<P>] => findFiber(root, (fiber) => {
    return fiber.type === type;
}, parent);

export const findFibersByType = <T extends ComponentType<any>, P extends boolean = false>(
    root: Nullable<Fiber>,
    type: T,
    parent?: P,
): Array<[TypedFiber<T>, NodePath<P>]> => findFibers(root, (fiber) => {
    return fiber.type === type;
}, parent);
