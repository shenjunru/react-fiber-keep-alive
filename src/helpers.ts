import type { ComponentType, ComponentProps } from 'react';
import type { Fiber } from 'react-reconciler';
import React, { version } from 'react';
import isFunction from 'lodash/isFunction';
import identity from 'lodash/identity';

export type Nullable<T> = T | null | undefined;

const v16 = version.startsWith('16');
const v17 = version.startsWith('17');
const v18 = version.startsWith('18');
const DomPropPrefix = v16 ? '__reactInternalInstance$' : '__reactFiber$';
// const RefPropPrefix = V16 ? '_reactInternalFiber' : '_reactInternals';
const FiberEffectProp = (v16 ? 'effectTag' : 'flags') as 'flags';

type PropRestore = { current: boolean };
const ProtectedFiberProps: Array<keyof Fiber> = [
    'alternate',
    'child',
    'sibling',
    'return',
    'dependencies',
    'pendingProps',
    'memoizedProps',
    'memoizedState',
    'stateNode',
    'updateQueue',
    // __DEV__
    '_debugOwner',
];

export enum FiberVisit {
    Child   = 0b0001,
    Sibling = 0b0010,
    Return  = 0b0100,
}


/* eslint-disable @typescript-eslint/indent */

// v16: shared/ReactWorkTags.js
// react-reconciler/src/ReactWorkTags.js
export enum FiberTag {
    FunctionComponent = 0,
    ClassComponent = 1,
    HostComponent = 5,
    HostText = 6,
}
// react-reconciler/src/ReactTypeOfMode.js
export enum FiberMode {
    NoMode = 0,
    ConcurrentMode = v18 ? 0b000001  // 1
         /* v16 | v17 */ : 0b000100, // 4
}

// v16: shared/ReactSideEffectTags.js
// react-reconciler/src/ReactFiberFlags.js
export enum FiberFlag {
    NoFlags       =       0b00000000000000000000000000, // 0
    PerformedWork =       0b00000000000000000000000001, // 1
    Placement     =       0b00000000000000000000000010, // 2
    Update        =       0b00000000000000000000000100, // 4
    Deletion      =       0b00000000000000000000001000, // 8
    ChildDeletion = v18 ? 0b00000000000000000000010000  // 16
        /* v16 | v17 */ : 0,
    Callback      = v18 ? 0b00000000000000000001000000  // 64
        /* v16 | v17 */ : 0b00000000000000000000100000, // 32
    Ref           = v18 ? 0b00000000000000001000000000  // 512
        /* v16 | v17 */ : 0b00000000000000000010000000, // 128
    Snapshot      = v18 ? 0b00000000000000010000000000  // 1024
        /* v16 | v17 */ : 0b00000000000000000100000000, // 256
    Passive       = v18 ? 0b00000000000000100000000000  // 2048
        /* v16 | v17 */ : 0b00000000000000001000000000, // 512

    Incomplete    = v18 ? 0b00000000001000000000000000  // 32768
        /* v16 | v17 */ : 0b00000000000000100000000000, // 2048
    Forked        = v18 ? 0b00000100000000000000000000  // 1048576
        /* v16 | v17 */ : 0,

    LayoutStatic  = v18 ? 0b00010000000000000000000000  // 4194304
        /* v16 | v17 */ : 0,
    PassiveStatic = v18 ? 0b00100000000000000000000000  // 8388608
                  : v17 ? 0b00000000001000000000000000  // 32768
              /* v16 */ : 0,

    LayoutMask    = v18 ? 0b00000000000010001001000100  // 8772 = Update | Callback | Ref | Visibility
                  : v17 ? 0b00000000000000000010100100  // 164
              /* v16 */ : 0,

    PassiveMask   = v18 ? 0b00000000000000100000010000  // 2064 = Passive | ChildDeletion
                  : v17 ? 0b00000000000000001000001000  // 520
              /* v16 */ : 0,

    StaticMask    = v18 ? 0b00111000000000000000000000 // 14680064 = LayoutStatic | PassiveStatic | RefStatic
                  : v17 ? 0b00000000001000000000000000 // 32768
              /* v16 */ : 0,
}

// react-reconciler/src/ReactHookEffectTags.js
export enum HookEffectTag {
    NoFlags   =       0b0000, // 0
    HasEffect =       0b0001, // 1
    Insertion = v18 ? 0b0010  // 2
    /* v16 | v17 */ : 0,
    Layout    = v18 ? 0b0100  // 4
    /* v16 | v17 */ : 0b0010, // 2
    Passive   = v18 ? 0b1000  // 8
    /* v16 | v17 */ : 0b0100, // 4
}

/* eslint-enable @typescript-eslint/indent */


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

export const isConcurrentMode = (fiber: Fiber) => {
    return v18 && FiberMode.NoMode !== (fiber.mode & FiberMode.ConcurrentMode);
};

export const getInternalKey = (element: Nullable<HTMLElement>, prefix: string) => {
    return element && Object.keys(element).find((key) => key.startsWith(prefix));
};

export const getElementFiber = (element: Nullable<HTMLElement>, prefix = DomPropPrefix): undefined | Fiber => {
    const internalKey = getInternalKey(element, prefix);
    return internalKey ? (element as any)[internalKey] : undefined;
};

export const getRootFiber = (container: Nullable<void | HTMLElement>): undefined | Fiber => {
    const fiber = v18 && container && getElementFiber(container, '__reactContainer$');
    const root = fiber ? fiber.stateNode : (container as any)?._reactRootContainer?._internalRoot;
    return root?.current;
};

export const findFiber = <T extends Fiber>(
    fiber: Nullable<Fiber>,
    predicate: (fiber: Fiber) => boolean,
    flags = FiberVisit.Child | FiberVisit.Sibling,
): null | T => {
    const stack = [fiber];
    while (stack.length) {
        const current = stack.pop();
        if (!current) {
            continue;
        }
        if (predicate(current)) {
            return <T>current;
        }
        if ((flags & FiberVisit.Sibling) && current.sibling) {
            stack.push(current.sibling);
        }
        if ((flags & FiberVisit.Child) && current.child) {
            stack.push(current.child);
        }
        if ((flags & FiberVisit.Return) && current.return) {
            stack.push(current.return);
        }
    }
    return null;
};

export const findFibers = <T extends Fiber>(
    fiber: Nullable<Fiber>,
    predicate: (fiber: Fiber) => boolean,
    flags = FiberVisit.Child | FiberVisit.Sibling,
): T[] => {
    const result: T[] = [];
    const stack = [fiber];
    while (stack.length) {
        const current = stack.pop();
        if (!current) {
            continue;
        }
        if (predicate(current)) {
            result.push(<T>current);
        }
        if ((flags & FiberVisit.Sibling) && current.sibling) {
            stack.push(current.sibling);
        }
        if ((flags & FiberVisit.Child) && current.child) {
            stack.push(current.child);
        }
        if ((flags & FiberVisit.Return) && current.return) {
            stack.push(current.return);
        }
    }
    return result;
};

export const findFiberByType = <T extends ComponentType<any>>(
    root: Nullable<Fiber>,
    type: T,
    flags?: number,
): null | TypedFiber<T> => findFiber(root, (fiber) => {
    return fiber.type === type;
}, flags);

export const findFibersByType = <T extends ComponentType<any>>(
    root: Nullable<Fiber>,
    type: T,
    flags?: number,
): Array<TypedFiber<T>> => findFibers(root, (fiber) => {
    return fiber.type === type;
}, flags);

export const traverseFiber = (
    fiber: Nullable<Fiber>,
    visit: (fiber: Fiber) => void | Nullable<() => void>,
    flags = FiberVisit.Child | FiberVisit.Sibling,
) => {
    const stack: Array<Nullable<Fiber | (() => void)>> = [fiber];
    while (stack.length) {
        const current = stack.pop();
        if (!current) {
            continue;
        }
        if (isFunction(current)) {
            current();
            continue;
        }
        const post = visit(current);
        if (post) {
            stack.push(post);
        }
        if ((flags & FiberVisit.Sibling) && current.sibling) {
            stack.push(current.sibling);
        }
        if ((flags & FiberVisit.Child) && current.child) {
            stack.push(current.child);
        }
        if ((flags & FiberVisit.Return) && current.return) {
            stack.push(current.return);
        }
    }
};

export const replaceFiber = (target: Fiber, replacement: Fiber) => {
    const parentFiber = target.return;
    if (!parentFiber) {
        return false;
    }
    parentFiber.child = replacement;
    replacement.return = parentFiber;
    if (target._debugOwner) {
        replacement._debugOwner = target._debugOwner;
    }

    if (!replacement.alternate || !parentFiber.alternate) {
        if (replacement.alternate) {
            replacement.alternate.return = null;
            replacement.alternate.sibling = null;
        }
    } else {
        parentFiber.alternate.child = replacement.alternate;
        replacement.alternate.return = parentFiber.alternate;
        if (target.alternate?._debugOwner) {
            replacement.alternate._debugOwner = target.alternate._debugOwner;
        }
    }

    return true;
};

const applyFiberEffect = (fiber: Fiber): number => {
    let flags = 0;

    switch (fiber.tag) {
        case FiberTag.FunctionComponent: {
            let state: FiberMemoizedState['next'] = fiber.memoizedState;
            while (state) {
                const effect = state.memoizedState;
                if (null != effect?.tag) {
                    let match = 0;
                    if (match || (match = effect.tag & HookEffectTag.Layout)) {
                        flags |= FiberFlag.Update;
                    }

                    if (match || (match = effect.tag & HookEffectTag.Passive)) {
                        flags |= FiberFlag.Update;
                        flags |= FiberFlag.Passive;
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
                flags |= FiberFlag.Update;

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
            }
        }
    }

    return flags;
};

const bubbleProperties = (fiber: Fiber) => {
    let child = fiber.child;
    while (child) {
        fiber.subtreeFlags |= child.subtreeFlags;
        fiber.subtreeFlags |= child.flags;
        child = child.sibling;
    }
};

export const appendFiberEffect = (
    rootFiber: Fiber,
    takeFiber: Fiber,
    ThisComponent: ComponentType<any>,
) => {
    v18 && traverseFiber(takeFiber, (fiber) => {
        const flags = applyFiberEffect(fiber);
        if (!flags) {
            return;
        }

        fiber.flags |= flags;
        return fiber.child && (() => {
            bubbleProperties(fiber);
        });
    });

    v18 && traverseFiber(takeFiber.return, (fiber) => {
        bubbleProperties(fiber);
    }, FiberVisit.Return);

    v18 && commitSubtreeEffects(rootFiber, ThisComponent);

    v18 || traverseFiber(takeFiber, (fiber) => {
        const flags = applyFiberEffect(fiber);
        if (!flags) {
            return;
        }

        return () => {
            rootFiber[FiberEffectProp] |= flags;
            fiber[FiberEffectProp] |= flags;
            const lastEffect = rootFiber.lastEffect;
            if (lastEffect) {
                rootFiber.lastEffect = lastEffect.nextEffect = fiber;
            } else {
                rootFiber.firstEffect = rootFiber.lastEffect = fiber;
            }
        };
    });

    // TODO: remove
    traverseFiber(takeFiber, (fiber) => {
        if (fiber.tag === FiberTag.ClassComponent) {
            const instance = fiber.stateNode as React.Component;
            instance.render();
        }
    });
};

export const defineFiberProp = <K extends keyof Fiber>(
    fiber: Fiber,
    prop: K,
    value: Fiber[K],
) => {
    Object.defineProperty(fiber, prop, {
        configurable: true,
        enumerable: true,
        writable: true,
        value,
    });
};

const onetimeFiberProp = <K extends keyof Fiber>(
    fiber: Nullable<Fiber>,
    prop: K,
    getter: ((value: Fiber[K]) => Fiber[K]) = identity,
) => {
    if (null == fiber) {
        return;
    }
    const backup = fiber[prop];
    Object.defineProperty(fiber, prop, {
        configurable: true,
        enumerable: true,
        get() {
            // console.log('[GET]', `[${prop}]`, fiber, value);
            defineFiberProp(this, prop, backup);
            return getter(backup);
        },
        set() {
            // console.log('[SET]', `[${prop}]`, fiber, update);
            defineFiberProp(this, prop, backup);
        },
    });
};

const protectFiberProp = (fiber: Nullable<Fiber>, prop: keyof Fiber, restore: PropRestore) => {
    if (null == fiber) {
        return;
    }
    const descriptor = Object.getOwnPropertyDescriptor(fiber, prop);
    if (!descriptor || descriptor.get) {
        return;
    }

    const backup = fiber[prop];
    let value = backup;

    // prevent detachDeletedInstance() <- detachFiberAfterEffects()
    if (prop === 'stateNode' && fiber.tag === FiberTag.HostComponent) {
        value = null;

        if (backup?.parentNode) {
            const dummy = document.createElement('div');
            backup.parentNode.appendChild(dummy);
            value = dummy;
        }
    }

    Object.defineProperty(fiber, prop, {
        configurable: true,
        enumerable: true,
        get() {
            // console.log('[GET]', `[${prop}]`, fiber, restore.current ? backup : update);
            return restore.current ? backup : value;
        },
        set(update) {
            // console.log('[SET]', `[${prop}]`, fiber, update);
            value = update;
        },
    });
};

const restoreFiberProp = (fiber: Fiber, prop: keyof Fiber) => {
    if (Object.prototype.hasOwnProperty.call(fiber, prop)) {
        defineFiberProp(fiber, prop, fiber[prop]);
    }
};

const protectFiberProps = (fiber: Fiber, current: null | Fiber, restore: PropRestore) => {
    const alternate = fiber.alternate;
    if (alternate && !current) {
        protectFiberProps(alternate, fiber, restore);
    }

    for (const prop of ProtectedFiberProps) {
        protectFiberProp(fiber, prop, restore);
    }
};

const restoreFiberProps = (fiber: Fiber, current: null | Fiber) => {
    restoreFiberProp(fiber, 'alternate');
    const alternate = fiber.alternate;
    if (alternate && !current) {
        restoreFiberProps(alternate, fiber);
    }

    for (const prop of ProtectedFiberProps) {
        if (prop !== 'alternate') {
            restoreFiberProp(fiber, prop);
        }
    }
};


// against fiber detaching
// - v16 detachFiber()
// - v17 detachFiberMutation()
// - v18 detachFiberAfterEffects()

export const protectFiber = (fiber: Fiber, restore: PropRestore) => {
    if (v18) {
        traverseFiber(fiber, (node) => () => {
            protectFiberProps(node, null, restore);
        });
    } else {
        protectFiberProps(fiber, null, restore);
    }
};

export const restoreFiber = (fiber: Fiber, restore: PropRestore) => {
    restore.current = true;
    if (v18) {
        traverseFiber(fiber, (node) => () => {
            restoreFiberProps(node, null);
        });
    } else {
        restoreFiberProps(fiber, null);
    }
    restore.current = false;
};

// v18 - hijack loop of commitLayoutMountEffects_complete()
export const commitSubtreeEffects = (
    rootFiber: Fiber,
    ThisComponent: ComponentType<any>,
) => {
    const thisFiber = findFiberByType(rootFiber, ThisComponent);
    if (!thisFiber || !(thisFiber.subtreeFlags & FiberFlag.LayoutMask)) {
        return;
    }

    // in commitLayoutMountEffects_complete(thisFiber)
    // after commitLayoutEffectOnFiber(thisFiber) <- current effect
    // thisFiber.sibling -> thisFiber.return
    // return to commitLayoutMountEffects_begin()
    onetimeFiberProp(thisFiber, 'sibling', () => {
        // prevent set thisFiber.return.return once
        onetimeFiberProp(thisFiber.return, 'return');

        // in commitLayoutMountEffects_complete(subFiber)
        // while ((nexteffect = fiber.retrun) === thisFiber)
        // skip commitLayoutEffectOnFiber(thisFiber)
        onetimeFiberProp(thisFiber, 'flags', () => {
            return 0;
        });

        return thisFiber.return;
    });

    // in commitLayoutMountEffects_begin()
    // skip commitLayoutMountEffects_complete(thisFiber)
    onetimeFiberProp(thisFiber, 'subtreeFlags', (value) => {
        return value | FiberFlag.LayoutMask;
    });
};
