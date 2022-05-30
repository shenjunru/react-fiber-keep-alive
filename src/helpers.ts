import type { ComponentType, ComponentProps } from 'react';
import type { Fiber } from 'react-reconciler';
import React, { version } from 'react';
import isFunction from 'lodash/isFunction';

export type Nullable<T> = T | null | undefined;

const V16 = version.startsWith('16');
const DomPropPrefix = V16 ? '__reactInternalInstance$' : '__reactFiber$';
// const RefPropPrefix = V16 ? '_reactInternalFiber' : '_reactInternals';
const FiberEffectProp = (V16 ? 'effectTag' : 'flags') as 'tag';

export enum FiberTag {
    FunctionComponent = 0,
    ClassComponent = 1,
}

export enum FiberEffect {
    NoEffect = 0, // NoEffect(0)
    PerformedWork = 1, // PerformedWork(1)
    Placement = 2, // Placement(2)
    Update = 4, // Update(4)
    PlacementAndUpdate = 6, // PlacementAndUpdate(6)
    Deletion = 8, // Deletion(8)
    Passive = 512, // Passive(512)
}

export enum HookEffectTag {
    HasEffect = 1, // HasEffect(1)
    Layout = 2, // Layout(2)
    Passive = 4, // Passive$1(4)
}

// https://github.com/facebook/react/blob/main/packages/shared/ReactTypes.js
interface TypedFiber<C extends ComponentType<any> = ComponentType<any>> extends Fiber {
    memoizedProps: ComponentProps<C>;
}

interface FiberEffectHookState {
    tag: number;
    create: React.EffectCallback;
    destroy: ReturnType<React.EffectCallback>;
    deps: React.DependencyList;
    // Circular
    next: null | FiberEffectHookState;
}

interface FiberMemoizedState {
    memoizedState: null | FiberEffectHookState; // any
    // baseState: any;
    // baseQueue: any;
    // queue: any;
    next: null | FiberMemoizedState;
}

interface DomContainer extends HTMLElement {
    _reactRootContainer?: {
        _internalRoot: {
            containerInfo: DomContainer;
            current: Fiber;
        };
    };
}

export const getRootFiber = (container: Nullable<HTMLElement>) => {
    return (container as DomContainer)?._reactRootContainer?._internalRoot.current;
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


/*
-----
# Hooks - Effect

## ReactCurrentDispatcher(HooksDispatcherOnMountInDEV)
    |-> mountEffect() / mountLayoutEffect() / mountImperativeHandle()
        |-> mountEffectImpl()
            |-> mountWorkInProgressHook()
            |-> pushEffect()

## ReactCurrentDispatcher(HooksDispatcherOnUpdateInDEV)
    |-> updateEffect() / updateLayoutEffect() / updateImperativeHandle()
        |-> updateEffectImpl()
            |-> updateWorkInProgressHook()
            |-> pushEffect()

commitLifeCycles()
commitHookEffectListMount()
commitPassiveHookEffects()
-----
*/

export const applyFiberEffect = (fiber: Nullable<Fiber>): number => {
    let flags = 0;

    switch (fiber?.tag) {
        case FiberTag.FunctionComponent: {
            let state: FiberMemoizedState['next'] = fiber.memoizedState;
            while (state) {
                const effect = state.memoizedState;
                if (null != effect?.tag) {
                    let match = 0;
                    if (match || (match = effect.tag & HookEffectTag.Layout)) {
                        flags |= FiberEffect.Update;
                    }

                    if (match || (match = effect.tag & HookEffectTag.Passive)) {
                        flags |= FiberEffect.Update;
                        flags |= FiberEffect.Passive;
                    }

                    if (match) {
                        effect.tag |= HookEffectTag.HasEffect;
                        effect.destroy = undefined;
                    }
                }
                state = state.next;
            }

            const updateQueue = fiber.updateQueue as any;
            const lastEffect = updateQueue?.lastEffect;
            let nextEffect: Nullable<FiberEffectHookState> = updateQueue?.lastEffect;
            while (nextEffect) {
                if (null != nextEffect?.tag) {
                    let match = 0;

                    match || (match = nextEffect.tag & HookEffectTag.Layout);
                    match || (match = nextEffect.tag & HookEffectTag.Passive);

                    if (match) {
                        nextEffect.tag |= HookEffectTag.HasEffect;
                        nextEffect.destroy = undefined;
                    }
                }
                nextEffect = nextEffect.next;
                if (nextEffect === lastEffect) {
                    break;
                }
            }

            break;
        }

        case FiberTag.ClassComponent: {
            const instance = fiber.stateNode as React.Component;
            if (isFunction(instance?.componentDidMount)) {
                flags |= FiberEffect.Update;

                if (fiber.alternate) {
                    const propKey = 'componentDidUpdate';
                    const propVal = instance[propKey];
                    const ownProp = Object.prototype.hasOwnProperty.call(instance, propKey);
                    instance[propKey] = function simulateComponentDidMount() {
                        if (ownProp) {
                            instance[propKey] = propVal;
                        } else {
                            delete instance[propKey];
                        }
                        this.componentDidMount?.();
                    };
                }

                // TODO: remove
                instance.render();
            }
        }
    }

    return flags;
};

export const appendFiberEffect = (root: Fiber, fiber: Fiber) => {
    const flags = applyFiberEffect(fiber);
    if (!flags) {
        return;
    }

    root[FiberEffectProp] |= flags;
    fiber[FiberEffectProp] |= flags;

    const lastEffect = root.lastEffect;
    if (lastEffect) {
        root.lastEffect = lastEffect.nextEffect = fiber;
    } else {
        root.firstEffect = root.lastEffect = fiber;
    }
};
