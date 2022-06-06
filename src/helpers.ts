import type { Fiber } from 'react-reconciler';
import type {
    Component,
    ComponentClass,
    ComponentType,
    ComponentProps,
    DependencyList,
    EffectCallback,
} from 'react';
import { version } from 'react';

type Nullable<T> = T | null | undefined;

interface TypedFiber<C extends ComponentType<any> = ComponentType<any>> extends Fiber {
    memoizedProps: ComponentProps<C>;
}

interface FiberEffectHookState {
    tag: number;
    create: EffectCallback;
    destroy: ReturnType<EffectCallback>;
    deps: DependencyList;
    // Circular
    next: null | FiberEffectHookState;
}

const v16 = version.startsWith('16');
const v17 = version.startsWith('17');
const v18 = version.startsWith('18');
const DomPropPrefix = v16 ? '__reactInternalInstance$' : '__reactFiber$';
// const RefPropPrefix = V16 ? '_reactInternalFiber' : '_reactInternals';
const FiberEffectProp = (v16 ? 'effectTag' : 'flags') as 'flags';
const UseSubtreeFlags = v18;
const UseDeepDetach = v18;

const hasOwnProperty = Object.prototype.hasOwnProperty;
const isFunction = (object: any): object is (...args: any[]) => any =>  {
    return 'function' === typeof object;
};

const EffectProp = Symbol('Effect');
export const markEffectHookIsOnetime = (effect: React.EffectCallback) => {
    return Object.defineProperty(effect, EffectProp, {
        configurable: true,
        enumerable: false,
        get() {
            return true;
        },
    });
};

export const markClassComponentHasSideEffectRender = <T extends ComponentClass<any>>(Class: T): T => {
    return Object.defineProperty(Class, EffectProp, {
        configurable: true,
        enumerable: false,
        get() {
            return true;
        },
    });
};

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


/* eslint-disable @typescript-eslint/indent */

export const FiberVisit = Object.freeze(<const>{
    // Property Accessor
    Child:        0b00000001,
    Sibling:      0b00000010,
    Return:       0b00000100,
    Effect:       0b00001000,
    SiblingFirst: 0b00010000,

    // Traverse Controller
    Break:        0b01000000,
    Continue:     0b00100000,
});

type FiberTraverseControl = (
    | typeof FiberVisit.Break
    | typeof FiberVisit.Continue
);

// v16: shared/ReactWorkTags.js
// react-reconciler/src/ReactWorkTags.js
export const FiberTag = Object.freeze(<const>{
    FunctionComponent:   0,
    ClassComponent:      1,
    HostRoot:            3,
    HostPortal:          4,
    HostComponent:       5,
    HostText:            6,
    ForwardRef:          11,
    MemoComponent:       14,
    SimpleMemoComponent: 15,
});

// react-reconciler/src/ReactTypeOfMode.js
export const FiberMode = Object.freeze({
    NoMode         :       0b000000, // 0
    ConcurrentMode : v18 ? 0b000001  // 1
         /* v16 | v17 */ : 0b000100, // 4
});

// v16: shared/ReactSideEffectTags.js
// react-reconciler/src/ReactFiberFlags.js
export const FiberFlag = Object.freeze({
    NoFlags             :       0b00000000000000000000000000, // 0
//  PerformedWork       :       0b00000000000000000000000001, // 1
    Placement           :       0b00000000000000000000000010, // 2
    Update              :       0b00000000000000000000000100, // 4
//  Deletion            :       0b00000000000000000000001000, // 8
//  ChildDeletion       : v18 ? 0b00000000000000000000010000  // 16
//            /* v16 | v17 */ : 0,
//  Callback            : v18 ? 0b00000000000000000001000000  // 64
//            /* v16 | v17 */ : 0b00000000000000000000100000, // 32
//  Ref                 : v18 ? 0b00000000000000001000000000  // 512
//            /* v16 | v17 */ : 0b00000000000000000010000000, // 128
//  Snapshot            : v18 ? 0b00000000000000010000000000  // 1024
//            /* v16 | v17 */ : 0b00000000000000000100000000, // 256
    Passive             : v18 ? 0b00000000000000100000000000  // 2048
              /* v16 | v17 */ : 0b00000000000000001000000000, // 512

    LifecycleEffectMask : v18 ? 0b00000000000111111000000000  // 32256 = Passive | Update | Callback | Ref | Snapshot | StoreConsistency
              /* v16 | v17 */ : 0b00000000000000001110100100, // 932 = Passive | Update | Callback | Ref | Snapshot

//  Incomplete          : v18 ? 0b00000000001000000000000000  // 32768
//            /* v16 | v17 */ : 0b00000000000000100000000000, // 2048
//  Forked              : v18 ? 0b00000100000000000000000000  // 1048576
//            /* v16 | v17 */ : 0,

//  LayoutStatic        : v18 ? 0b00010000000000000000000000  // 4194304
//            /* v16 | v17 */ : 0,
//  PassiveStatic       : v18 ? 0b00100000000000000000000000  // 8388608
//                      : v17 ? 0b00000000001000000000000000  // 32768
//                  /* v16 */ : 0,

//  LayoutMask          : v18 ? 0b00000000000010001001000100  // 8772 = Update | Callback | Ref | Visibility
//                      : v17 ? 0b00000000000000000010100100  // 164
//                  /* v16 */ : 0,

    PassiveMask         : v18 ? 0b00000000000000100000010000  // 2064 = Passive | ChildDeletion
                        : v17 ? 0b00000000000000001000001000  // 520
                    /* v16 */ : 0,

//  StaticMask          : v18 ? 0b00111000000000000000000000  // 14680064 = LayoutStatic | PassiveStatic | RefStatic
//                      : v17 ? 0b00000000001000000000000000  // 32768 = PassiveStatic
//                  /* v16 */ : 0,
});

// react-reconciler/src/ReactHookEffectTags.js
export const HookEffectTag = Object.freeze({
    NoFlags   :       0b0000, // 0
    HasEffect :       0b0001, // 1
    Insertion : v18 ? 0b0010  // 2
    /* v16 | v17 */ : 0,
    Layout    : v18 ? 0b0100  // 4
    /* v16 | v17 */ : 0b0010, // 2
    Passive   : v18 ? 0b1000  // 8
    /* v16 | v17 */ : 0b0100, // 4
});

/* eslint-enable @typescript-eslint/indent */


const getInternalKey = (element: Nullable<HTMLElement>, prefix: string) => {
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

const getHostNode = (fiber: Nullable<Fiber>): null | Node => {
    switch (fiber?.tag) {
        case FiberTag.HostComponent:
        case FiberTag.HostText:
            return fiber.stateNode;
        case FiberTag.HostRoot:
        case FiberTag.HostPortal:
            return fiber.stateNode.containerInfo;
    }
    return null;
};

const isNodeFiber = (fiber: Fiber) => {
    switch (fiber.tag) {
        case FiberTag.HostComponent:
        case FiberTag.HostText:
            return true;
    }
    return false;
};

const isHostFiber = (fiber: Fiber) => {
    switch (fiber.tag) {
        case FiberTag.HostRoot:
        case FiberTag.HostPortal:
            return true;
    }
    return false;
};

const pushVisitStack = (
    stack: any[],
    scope: Fiber,
    fiber: Fiber,
    flags: number,
    callback: Nullable<void | (() => void)>,
) => {
    if (flags === FiberVisit.Return) {
        fiber.return && stack.push(fiber.return);
        return;
    }
    if (flags === FiberVisit.Effect) {
        fiber.nextEffect && stack.push(fiber.nextEffect);
        return;
    }

    if (scope !== fiber && (flags & ~FiberVisit.SiblingFirst) === FiberVisit.Child) {
        flags |= FiberVisit.Sibling;
    }

    const siblingFirst = flags & FiberVisit.SiblingFirst;
    if (flags & FiberVisit.Sibling) {
        siblingFirst || fiber.sibling && stack.push(fiber.sibling);
    }
    if (isFunction(callback)) {
        stack.push(callback);
    }
    if (flags & FiberVisit.Child) {
        fiber.child && stack.push(fiber.child);
    }
    if (flags & FiberVisit.Sibling) {
        siblingFirst && fiber.sibling && stack.push(fiber.sibling);
    }
};

export const findFiber = <T extends Fiber>(
    fiber: Nullable<Fiber>,
    predicate: (fiber: Fiber) => boolean | FiberTraverseControl,
    flags: number = FiberVisit.Child,
): null | T => {
    if (!fiber) {
        return null;
    }

    const stack = [fiber];
    while (stack.length) {
        const current = stack.pop();
        if (!current) {
            continue;
        }
        const value = predicate(current);
        if (value === FiberVisit.Break) {
            break;
        }
        if (value === FiberVisit.Continue) {
            continue;
        }
        if (value) {
            return <T>current;
        }
        pushVisitStack(stack, fiber, current, flags, null);
    }

    return null;
};

export const findFiberByType = <T extends ComponentType<any>>(
    fiber: Nullable<Fiber>,
    type: T,
    flags?: number,
): null | TypedFiber<T> => findFiber(fiber, (node) => {
    return node.type === type;
}, flags);

export const traverseFiber = (
    fiber: Nullable<Fiber>,
    visit: (fiber: Fiber) => Nullable<void | FiberTraverseControl | (() => void)>,
    flags: number = FiberVisit.Child,
) => {
    if (!fiber) {
        return;
    }

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
        const value = visit(current);
        if (value === FiberVisit.Break) {
            break;
        }
        if (value === FiberVisit.Continue) {
            continue;
        }
        pushVisitStack(stack, fiber, current, flags, value);
    }
};

const findNextHostFiber = (scope: Fiber, target: Fiber): null | Fiber => {
    let current: null | Fiber = target;
    while (current) {
        if (current === scope) {
            return null;
        }
        const found = findFiber(current.sibling, (fiber) => {
            if (isHostFiber(fiber)) {
                return FiberVisit.Continue;
            }
            return isNodeFiber(fiber);
        }, FiberVisit.Child | FiberVisit.Sibling);
        if (found) {
            return found;
        }
        current = current.return;
    }
    return null;
};

const replaceFiberOnParent = (
    parentFiber: Fiber,
    oldFiber: null | Fiber,
    newFiber: Fiber,
) => {
    let child = parentFiber.child;
    while (child) {
        if (child.sibling === oldFiber) {
            child.sibling = newFiber;
            break;
        }

        child = child.sibling;

        if (!child) {
            parentFiber.child = newFiber;
        }
    }

    newFiber.return = parentFiber;

    if (oldFiber) {
        newFiber.sibling = oldFiber.sibling;

        if (oldFiber._debugOwner) {
            newFiber._debugOwner = oldFiber._debugOwner;
        }
    }

    return parentFiber;
};

const traverseEffectHooks = (
    fiber: Fiber,
    visit: (effect: FiberEffectHookState) => void,
) => {
    switch (fiber.tag) {
        case FiberTag.FunctionComponent:
        case FiberTag.ForwardRef:
        case FiberTag.MemoComponent:
        case FiberTag.SimpleMemoComponent: {
            break;
        }
        default:
            return false;
    }

    const updateQueue = fiber.updateQueue as any;
    const lastEffect = updateQueue?.lastEffect;
    let nextEffect: Nullable<FiberEffectHookState> = updateQueue?.lastEffect;
    while (nextEffect) {
        if (null != nextEffect?.tag) {
            let match = HookEffectTag.NoFlags;

            match || (match = nextEffect.tag & HookEffectTag.Layout);
            match || (match = nextEffect.tag & HookEffectTag.Passive);

            if (match) {
                visit(nextEffect);
            }
        }

        nextEffect = nextEffect.next;
        if (nextEffect === lastEffect) {
            break;
        }
    }

    return true;
};

const isNoEffectHook = (effect: FiberEffectHookState) => {
    const create = effect.create;
    if (!create) {
        return true;
    }
    if (!hasOwnProperty.call(create, EffectProp)) {
        return false;
    }
    // determine deps updated
    return HookEffectTag.NoFlags === (effect.tag & HookEffectTag.HasEffect);
};

const applyFiberEffect = (fiber: Fiber): number => {
    let flags = FiberFlag.NoFlags;

    const isFunctionComponent = traverseEffectHooks(fiber, (effect) => {
        if (isNoEffectHook(effect)) {
            return;
        }

        effect.tag |= HookEffectTag.HasEffect;
        effect.destroy = undefined;

        switch (effect.tag & ~HookEffectTag.HasEffect) {
            case HookEffectTag.Layout:
                flags |= FiberFlag.Update;
                break;
            case HookEffectTag.Passive:
                flags |= FiberFlag.Update;
                flags |= FiberFlag.Passive;
                break;
        }
    });

    if (isFunctionComponent) {
        return flags;
    }

    switch (fiber.tag) {
        case FiberTag.ClassComponent: {
            if (!fiber.alternate) {
                break;
            }

            const instance = fiber.stateNode as Component;
            const noUpdate = FiberFlag.NoFlags === (fiber.flags & FiberFlag.Update);
            const needRender = noUpdate && (true === (instance.constructor as any)[EffectProp]);
            if (needRender || isFunction(instance?.componentDidMount)) {
                flags |= FiberFlag.Update;

                const propKey = 'componentDidUpdate';
                const propVal = instance[propKey];
                const ownProp = hasOwnProperty.call(instance, propKey);
                instance[propKey] = function simulateComponentDidMount() {
                    if (ownProp) {
                        instance[propKey] = propVal;
                    } else {
                        delete instance[propKey];
                    }
                    if (needRender) {
                        this.render();
                    }
                    this.componentDidMount?.();
                };

                break;
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

// only execute in the useLayoutEffect()
export const appendFiberEffect = (
    rootFiber: Fiber,
    effectFiber: Fiber, // fiber of <KeepAliveEffect> component
    renderFiber: Fiber, // fiber of <KeepAliveRender> component
    finishFiber: Fiber, // fiber of <KeepAliveFinish> component
) => {
    if (UseSubtreeFlags) {
        traverseFiber(renderFiber, (fiber) => {
            const flags = applyFiberEffect(fiber);

            fiber.flags |= flags;
            return fiber.child && (() => {
                bubbleProperties(fiber);
            });
        });

        // skip the fake passive effect
        effectFiber.subtreeFlags &= FiberFlag.PassiveMask;
    } else {
        // clean all effects in the <KeepAliveRender>
        effectFiber.nextEffect = finishFiber;

        traverseFiber(renderFiber, (fiber) => {
            if (fiber === finishFiber) {
                return FiberVisit.Continue;
            }

            const flags = applyFiberEffect(fiber);
            rootFiber[FiberEffectProp] |= flags;
            fiber[FiberEffectProp] |= flags;
            fiber.nextEffect = null;

            if (FiberFlag.NoFlags !== (fiber[FiberEffectProp] & FiberFlag.LifecycleEffectMask)) {
                const nextEffect = effectFiber.nextEffect;
                effectFiber.nextEffect = fiber;
                fiber.nextEffect = nextEffect;
            }

            return null;
        }, FiberVisit.Child | FiberVisit.SiblingFirst);
    }
};

const defineFiberProp = <K extends keyof Fiber>(
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
    if (prop === 'stateNode' && isNodeFiber(fiber)) {
        value = value && document.createElement('dummy');
    }

    Object.defineProperty(fiber, prop, {
        configurable: true,
        enumerable: true,
        get() {
            // console.log('[GET]', `[${prop}]`, fiber, restore.current ? backup : value);
            return restore.current ? backup : value;
        },
        set(update) {
            // console.log('[SET]', `[${prop}]`, fiber, update);
            value = update;
        },
    });
};

const restoreFiberProp = (fiber: Fiber, prop: keyof Fiber) => {
    if (hasOwnProperty.call(fiber, prop)) {
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

export const protectFiber = (fiber: Fiber) => {
    const restore: PropRestore = { current: true };
    const stack = [true];

    traverseFiber(fiber, (node) => {
        // v16 / v17: unmountHostComponents()
        // v18: commitDeletionEffectsOnFiber()
        const needDetach = isNodeFiber(node) && true === stack[0];
        if (needDetach) {
            const hostNode = getHostNode(node);
            const parentNode = hostNode?.parentNode;

            protectFiberProp(node, 'stateNode', restore);

            if (hostNode && parentNode) {
                const dummy = document.createElement('dummy');
                parentNode.replaceChild(dummy, hostNode);
                node.stateNode = dummy;
            }
        }

        // - v16: detachFiber()
        // - v17 / 18: detachFiberMutation() & detachFiberAfterEffects()
        if (UseDeepDetach || node === fiber) {
            protectFiberProps(node, null, restore);
        }

        if (node.tag === FiberTag.HostPortal) {
            stack.unshift(true);
            return () => stack.shift();
        }
        if (needDetach) {
            stack.unshift(false);
            return () => stack.shift();
        }
        return null;
    });

    restore.current = false;

    return restore;
};

export const replaceFiber = (oldFiber: Fiber, newFiber: Fiber, restore: PropRestore) => {
    const parentFiber = oldFiber.return;
    if (!parentFiber) {
        return false;
    }

    const containerFiber = findFiber(parentFiber, (fiber) => {
        return isNodeFiber(fiber) || isHostFiber(fiber);
    }, FiberVisit.Return);
    const containerNode = getHostNode(containerFiber);
    if (!containerFiber || !containerNode) {
        return false;
    }

    const stack: Array<null | Fiber> = [containerFiber];

    // detach old fiber host nodes
    traverseFiber(oldFiber, (fiber) => {
        const hostFiber = stack[0];
        const needDetach = isNodeFiber(fiber) && null != hostFiber;
        if (needDetach) {
            const parentNode = getHostNode(hostFiber);
            const childNode = getHostNode(fiber);
            if (parentNode && childNode) {
                parentNode.removeChild(childNode);
            }
        }

        if (fiber.tag === FiberTag.HostPortal) {
            stack.unshift(fiber);
            return () => stack.shift();
        }
        if (needDetach) {
            stack.unshift(null);
            return () => stack.shift();
        }
        return null;
    });

    const nextHostFiber = findNextHostFiber(containerFiber, oldFiber);
    const nextHostNode = getHostNode(nextHostFiber);

    // attach new fiber host nodes
    // opposite to protectFiber()
    restore.current = true;
    traverseFiber(newFiber, (fiber) => {
        const hostFiber = stack[0];
        const needAttach = isNodeFiber(fiber) && null != hostFiber;
        if (needAttach) {
            restoreFiberProp(fiber, 'stateNode');
            const parentNode = getHostNode(hostFiber);
            const childNode = getHostNode(fiber);
            if (parentNode && childNode) {
                if (!nextHostNode || hostFiber.tag === FiberTag.HostPortal) {
                    parentNode.appendChild(childNode);
                } else {
                    parentNode.insertBefore(childNode, nextHostNode);
                }
            }
        }

        if (UseDeepDetach || fiber === newFiber) {
            restoreFiberProps(fiber, null);
        }

        // unset effect hook destroy(), which is executed already
        traverseEffectHooks(fiber, (effect) => {
            effect.destroy = undefined;
        });

        if (fiber.tag === FiberTag.HostPortal) {
            stack.unshift(fiber);
            return () => stack.shift();
        }
        if (needAttach) {
            stack.unshift(null);
            return () => stack.shift();
        }
        return null;
    });
    restore.current = false;

    // replace on fiber tree
    replaceFiberOnParent(parentFiber, oldFiber, newFiber);
    if (!newFiber.alternate || !parentFiber.alternate) {
        if (newFiber.alternate) {
            newFiber.alternate.return = null;
            newFiber.alternate.sibling = null;
        }
    } else {
        replaceFiberOnParent(parentFiber.alternate, oldFiber.alternate, newFiber.alternate);
    }

    return true;
};
