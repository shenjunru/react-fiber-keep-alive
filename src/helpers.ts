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
    Child:   0b000001,
    Sibling: 0b000010,
    Return:  0b000100,
    Effect:  0b001000,
    Break:   0b010000,
});

// v16: shared/ReactWorkTags.js
// react-reconciler/src/ReactWorkTags.js
export const FiberTag = Object.freeze({
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
            return fiber.stateNode.containerInfo;
    }
    return null;
};

const isHostFiber = (fiber: Fiber) => {
    switch (fiber.tag) {
        case FiberTag.HostComponent:
        case FiberTag.HostText:
        case FiberTag.HostRoot:
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
    if (scope !== fiber && flags === FiberVisit.Child) {
        flags |= FiberVisit.Sibling;
    }
    if (flags & FiberVisit.Sibling) {
        fiber.sibling && stack.push(fiber.sibling);
    }
    if (isFunction(callback)) {
        stack.push(callback);
    }
    if (flags & FiberVisit.Child) {
        fiber.child && stack.push(fiber.child);
    }
    if (flags === FiberVisit.Return) {
        fiber.return && stack.push(fiber.return);
    }
    if (flags === FiberVisit.Effect) {
        fiber.nextEffect && stack.push(fiber.nextEffect);
    }
};

export const findFiber = <T extends Fiber>(
    fiber: Nullable<Fiber>,
    predicate: (fiber: Fiber) => boolean,
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
        if (predicate(current)) {
            return <T>current;
        }
        pushVisitStack(stack, fiber, current, flags, null);
    }

    return null;
};

export const findFibers = <T extends Fiber>(
    fiber: Nullable<Fiber>,
    predicate: (fiber: Fiber) => boolean,
    flags: number = FiberVisit.Child,
): T[] => {
    const result: T[] = [];
    if (!fiber) {
        return result;
    }

    const stack = [fiber];
    while (stack.length) {
        const current = stack.pop();
        if (!current) {
            continue;
        }
        if (predicate(current)) {
            result.push(<T>current);
        }
        pushVisitStack(stack, fiber, current, flags, null);
    }

    return result;
};

export const findFiberByType = <T extends ComponentType<any>>(
    fiber: Nullable<Fiber>,
    type: T,
    flags?: number,
): null | TypedFiber<T> => findFiber(fiber, (node) => {
    return node.type === type;
}, flags);

export const findFibersByType = <T extends ComponentType<any>>(
    fiber: Nullable<Fiber>,
    type: T,
    flags?: number,
): Array<TypedFiber<T>> => findFibers(fiber, (node) => {
    return node.type === type;
}, flags);

export const traverseFiber = (
    fiber: Nullable<Fiber>,
    visit: (fiber: Fiber) =>  Nullable<void | typeof FiberVisit.Break | (() => void)>,
    flags = FiberVisit.Child,
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
        const post = visit(current);
        if (post === FiberVisit.Break) {
            continue;
        }
        pushVisitStack(stack, fiber, current, flags, post);
    }
};

export const findChildHostFibers = (fiber: Nullable<Fiber>): Fiber[] => {
    const result: Fiber[] = [];
    if (!fiber) {
        return result;
    }

    const stack: Array<Nullable<Fiber>> = [fiber];
    while (stack.length) {
        const current = stack.pop();
        if (!current || current.tag === FiberTag.HostPortal) {
            continue;
        }
        if (isHostFiber(current)) {
            result.push(current);
            pushVisitStack(stack, fiber, current, FiberVisit.Sibling, null);
        } else {
            pushVisitStack(stack, fiber, current, FiberVisit.Child | FiberVisit.Sibling, null);
        }
    }
    return result;
};

export const findNextHostFiber = (scope: Fiber, target: Fiber): null | Fiber => {
    let current = target.sibling || target.return;
    while (current) {
        if (current === scope) {
            return null;
        }
        const found = findFiber(current.sibling, isHostFiber, FiberVisit.Child | FiberVisit.Sibling);
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

export const replaceFiber = (oldFiber: Fiber, newFiber: Fiber) => {
    const parentFiber = oldFiber.return;
    if (!parentFiber) {
        return false;
    }

    // replace on dom tree
    const hostFiber = findFiber(parentFiber, isHostFiber, FiberVisit.Return);
    const hostNode = getHostNode(hostFiber);
    if (!hostFiber || !hostNode) {
        return false;
    }

    const nextHostFiber = findNextHostFiber(hostFiber, oldFiber);
    const nextHostNode = getHostNode(nextHostFiber);
    findChildHostFibers(oldFiber).forEach((fiber) => {
        const thisHostNode = getHostNode(fiber);
        thisHostNode && hostNode.removeChild(thisHostNode);
    });
    findChildHostFibers(newFiber).forEach(nextHostNode ? (fiber) => {
        const thisHostNode = getHostNode(fiber);
        thisHostNode && hostNode.insertBefore(thisHostNode, nextHostNode);
    } : (fiber) => {
        const thisHostNode = getHostNode(fiber);
        thisHostNode && hostNode.appendChild(thisHostNode);
    });

    const portalFibers = findFibers(newFiber, (node) => node.tag === FiberTag.HostPortal);
    portalFibers.forEach((portalFiber) => {
        const containerInfo = portalFiber.stateNode?.containerInfo;
        containerInfo && findChildHostFibers(portalFiber.child).forEach((fiber) => {
            const thisHostNode = getHostNode(fiber);
            thisHostNode && containerInfo.appendChild(thisHostNode);
        });
    });

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
                return FiberVisit.Break;
            }

            const flags = applyFiberEffect(fiber);
            rootFiber[FiberEffectProp] |= flags;
            fiber[FiberEffectProp] |= flags;
            fiber.nextEffect = null;

            return () => {
                if (FiberFlag.NoFlags === (fiber[FiberEffectProp] & FiberFlag.LifecycleEffectMask)) {
                    return;
                }

                const nextEffect = effectFiber.nextEffect;

                effectFiber.nextEffect = fiber;
                fiber.nextEffect = nextEffect;
            };
        });
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

const protectFiberProp = (fiber: Nullable<Fiber>, prop: keyof Fiber, restore: PropRestore, needDummy: boolean) => {
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
    if (needDummy && prop === 'stateNode' && isHostFiber(fiber)) {
        value = null;

        if (backup?.parentNode) {
            value = document.createElement('dummy');
            backup.parentNode.appendChild(value);
        }
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

const protectFiberProps = (fiber: Fiber, current: null | Fiber, restore: PropRestore, needDummy: boolean) => {
    const alternate = fiber.alternate;
    if (alternate && !current) {
        protectFiberProps(alternate, fiber, restore, false);
    }

    for (const prop of ProtectedFiberProps) {
        protectFiberProp(fiber, prop, restore, needDummy);
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

export const protectFiber = (fiber: Fiber) => {
    const restore: PropRestore = { current: true };
    const stack = [true];

    traverseFiber(fiber, (node) => {
        const needDummy = isHostFiber(node) && true === stack[0];
        if (needDummy) {
            // detach child node of parent host node or portal node
            protectFiberProp(node, 'stateNode', restore, false);
            const hostNode = getHostNode(node);
            const parentNode = hostNode?.parentNode;
            if (hostNode && parentNode) {
                const dummy = document.createElement('dummy');
                parentNode.replaceChild(dummy, hostNode);
                node.stateNode = dummy;
            }
        }

        if (UseDeepDetach || node === fiber) {
            protectFiberProps(node, null, restore, true);
        }

        if (node.tag === FiberTag.HostPortal) {
            stack.unshift(true);
            return () => stack.shift();
        }
        if (needDummy) {
            stack.unshift(false);
            return () => stack.shift();
        }
    });

    restore.current = false;

    return restore;
};

export const restoreFiber = (fiber: Fiber, restore: PropRestore) => {
    restore.current = true;

    const stack = [true];
    traverseFiber(fiber, (node) => {
        const needRestore = isHostFiber(node) && true === stack[0];
        if (UseDeepDetach || node === fiber) {
            restoreFiberProps(node, null);
        } else if (needRestore) {
            restoreFiberProp(node, 'stateNode');
        }

        // unset effect hook destroy(), which is executed already
        traverseEffectHooks(node, (effect) => {
            effect.destroy = undefined;
        });

        if (node.tag === FiberTag.HostPortal) {
            stack.unshift(true);
            return () => stack.shift();
        }
        if (needRestore) {
            stack.unshift(false);
            return () => stack.shift();
        }
        return null;
    });

    restore.current = false;
};
