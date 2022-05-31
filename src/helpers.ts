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
const markEffectHookIsOnetime = (effect: React.EffectCallback) => {
    return Object.defineProperty(effect, EffectProp, {
        configurable: true,
        enumerable: false,
        get() {
            return true;
        },
    });
};

const markClassComponentHasSideEffectRender = <T extends ComponentClass<any>>(Class: T): T => {
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

const FiberVisit = <const>{
    Child:    0b000001,
    Sibling:  0b000010,
    Return:   0b000100,
    Effect:   0b001000,
    Break:    0b010000,
};

// v16: shared/ReactWorkTags.js
// react-reconciler/src/ReactWorkTags.js
const FiberTag = {
    FunctionComponent:   0,
    ClassComponent:      1,
    HostRoot:            3,
    HostPortal:          4,
    HostComponent:       5,
    HostText:            6,
    MemoComponent:       14,
    SimpleMemoComponent: 15,
};

// react-reconciler/src/ReactTypeOfMode.js
const FiberMode = {
    NoMode         :       0b000000, // 0
    ConcurrentMode : v18 ? 0b000001  // 1
         /* v16 | v17 */ : 0b000100, // 4
};

// v16: shared/ReactSideEffectTags.js
// react-reconciler/src/ReactFiberFlags.js
const FiberFlag = {
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
};

// react-reconciler/src/ReactHookEffectTags.js
const HookEffectTag = {
    NoFlags   :       0b0000, // 0
    HasEffect :       0b0001, // 1
    Insertion : v18 ? 0b0010  // 2
    /* v16 | v17 */ : 0,
    Layout    : v18 ? 0b0100  // 4
    /* v16 | v17 */ : 0b0010, // 2
    Passive   : v18 ? 0b1000  // 8
    /* v16 | v17 */ : 0b0100, // 4
};

/* eslint-enable @typescript-eslint/indent */


const getInternalKey = (element: Nullable<HTMLElement>, prefix: string) => {
    return element && Object.keys(element).find((key) => key.startsWith(prefix));
};

const getElementFiber = (element: Nullable<HTMLElement>, prefix = DomPropPrefix): undefined | Fiber => {
    const internalKey = getInternalKey(element, prefix);
    return internalKey ? (element as any)[internalKey] : undefined;
};

const getRootFiber = (container: Nullable<void | HTMLElement>): undefined | Fiber => {
    const fiber = v18 && container && getElementFiber(container, '__reactContainer$');
    const root = fiber ? fiber.stateNode : (container as any)?._reactRootContainer?._internalRoot;
    return root?.current;
};

const pushVisitStack = (stack: any[], fiber: Fiber, flags: number) => {
    if (flags & FiberVisit.Sibling) {
        fiber.sibling && stack.push(fiber.sibling);
    }
    if (flags & FiberVisit.Child) {
        fiber.child && stack.push(fiber.child);
    }
    if (flags & FiberVisit.Return) {
        fiber.return && stack.push(fiber.return);
    }
    if (flags & FiberVisit.Effect) {
        fiber.nextEffect && stack.push(fiber.nextEffect);
    }
};

const findFiber = <T extends Fiber>(
    fiber: Nullable<Fiber>,
    predicate: (fiber: Fiber) => boolean | typeof FiberVisit.Break,
    flags = FiberVisit.Child | FiberVisit.Sibling,
): null | T => {
    const stack = [fiber];
    while (stack.length) {
        const current = stack.pop();
        if (!current) {
            continue;
        }
        const value = predicate(current);
        if (value === FiberVisit.Break) {
            continue;
        }
        if (value) {
            return <T>current;
        }
        pushVisitStack(stack, current, flags);
    }
    return null;
};

const findFibers = <T extends Fiber>(
    fiber: Nullable<Fiber>,
    predicate: (fiber: Fiber) => boolean | typeof FiberVisit.Break,
    flags = FiberVisit.Child | FiberVisit.Sibling,
): T[] => {
    const result: T[] = [];
    const stack = [fiber];
    while (stack.length) {
        const current = stack.pop();
        if (!current) {
            continue;
        }
        const value = predicate(current);
        if (value === FiberVisit.Break) {
            continue;
        }
        if (value) {
            result.push(<T>current);
        }
        pushVisitStack(stack, current, flags);
    }
    return result;
};

const findFiberByType = <T extends ComponentType<any>>(
    root: Nullable<Fiber>,
    type: T,
    flags?: number,
): null | TypedFiber<T> => findFiber(root, (fiber) => {
    return fiber.type === type;
}, flags);

const findFibersByType = <T extends ComponentType<any>>(
    root: Nullable<Fiber>,
    type: T,
    flags?: number,
): Array<TypedFiber<T>> => findFibers(root, (fiber) => {
    return fiber.type === type;
}, flags);

const traverseFiber = (
    fiber: Nullable<Fiber>,
    visit: (fiber: Fiber) =>  Nullable<void | typeof FiberVisit.Break | (() => void)>,
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
        if (post === FiberVisit.Break) {
            continue;
        }
        if (isFunction(post)) {
            stack.push(post);
        }
        pushVisitStack(stack, current, flags);
    }
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

const replaceFiber = (oldFiber: Fiber, newFiber: Fiber) => {
    const parentFiber = oldFiber.return;
    if (!parentFiber) {
        return false;
    }

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
const appendFiberEffect = (
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


// against fiber detaching
// - v16 detachFiber()
// - v17 detachFiberMutation()
// - v18 detachFiberAfterEffects()

const protectFiber = (fiber: Fiber) => {
    const restore: PropRestore = { current: false };
    if (UseDeepDetach) {
        traverseFiber(fiber, (node) => () => {
            protectFiberProps(node, null, restore);
        });
    } else {
        protectFiberProps(fiber, null, restore);
    }
    return restore;
};

const restoreFiber = (fiber: Fiber, restore: PropRestore) => {
    restore.current = true;
    if (UseDeepDetach) {
        traverseFiber(fiber, (node) => () => {
            restoreFiberProps(node, null);

            // unset effect hook destroy(), which is executed already
            traverseEffectHooks(node, (effect) => {
                effect.destroy = undefined;
            });
        });
    } else {
        restoreFiberProps(fiber, null);

        // unset effect hook destroy(), which is executed already
        traverseFiber(fiber, (node) => {
            traverseEffectHooks(node, (effect) => {
                effect.destroy = undefined;
            });
        });
    }
    restore.current = false;
};

export {
    markEffectHookIsOnetime,
    markClassComponentHasSideEffectRender,
    FiberVisit,
    FiberTag,
    FiberMode,
    FiberFlag,
    HookEffectTag,
    getInternalKey,
    getElementFiber,
    getRootFiber,
    findFiber,
    findFibers,
    findFiberByType,
    findFibersByType,
    traverseFiber,
    replaceFiber,
    appendFiberEffect,
    protectFiber,
    restoreFiber,
};
