import { version } from 'react';
const v16 = version.startsWith('16');
const v17 = version.startsWith('17');
const v18 = version.startsWith('18');
const DomPropPrefix = v16 ? '__reactInternalInstance$' : '__reactFiber$';
const FiberEffectProp = (v16 ? 'effectTag' : 'flags');
const UseSubtreeFlags = v18;
const UseDeepDetach = v18;
const hasOwnProperty = Object.prototype.hasOwnProperty;
const isFunction = (object) => {
    return 'function' === typeof object;
};
const EffectProp = Symbol('Effect');
export const markEffectHookIsOnetime = (effect) => {
    return Object.defineProperty(effect, EffectProp, {
        configurable: true,
        enumerable: false,
        get() {
            return true;
        },
    });
};
export const markClassComponentHasSideEffectRender = (Class) => {
    return Object.defineProperty(Class, EffectProp, {
        configurable: true,
        enumerable: false,
        get() {
            return true;
        },
    });
};
const ProtectedFiberProps = [
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
    '_debugOwner',
];
export const FiberVisit = Object.freeze({
    Child: 0b000001,
    Sibling: 0b000010,
    Return: 0b000100,
    Effect: 0b001000,
    Break: 0b010000,
    SiblingFirst: 0b100000,
});
export const FiberTag = Object.freeze({
    FunctionComponent: 0,
    ClassComponent: 1,
    HostRoot: 3,
    HostPortal: 4,
    HostComponent: 5,
    HostText: 6,
    ForwardRef: 11,
    MemoComponent: 14,
    SimpleMemoComponent: 15,
});
export const FiberMode = Object.freeze({
    NoMode: 0b000000,
    ConcurrentMode: v18 ? 0b000001
        : 0b000100,
});
export const FiberFlag = Object.freeze({
    NoFlags: 0b00000000000000000000000000,
    Placement: 0b00000000000000000000000010,
    Update: 0b00000000000000000000000100,
    Passive: v18 ? 0b00000000000000100000000000
        : 0b00000000000000001000000000,
    LifecycleEffectMask: v18 ? 0b00000000000111111000000000
        : 0b00000000000000001110100100,
    PassiveMask: v18 ? 0b00000000000000100000010000
        : v17 ? 0b00000000000000001000001000
            : 0,
});
export const HookEffectTag = Object.freeze({
    NoFlags: 0b0000,
    HasEffect: 0b0001,
    Insertion: v18 ? 0b0010
        : 0,
    Layout: v18 ? 0b0100
        : 0b0010,
    Passive: v18 ? 0b1000
        : 0b0100,
});
const getInternalKey = (element, prefix) => {
    return element && Object.keys(element).find((key) => key.startsWith(prefix));
};
export const getElementFiber = (element, prefix = DomPropPrefix) => {
    const internalKey = getInternalKey(element, prefix);
    return internalKey ? element[internalKey] : undefined;
};
export const getRootFiber = (container) => {
    const fiber = v18 && container && getElementFiber(container, '__reactContainer$');
    const root = fiber ? fiber.stateNode : container?._reactRootContainer?._internalRoot;
    return root?.current;
};
const getHostNode = (fiber) => {
    switch (fiber?.tag) {
        case FiberTag.HostComponent:
        case FiberTag.HostText:
            return fiber.stateNode;
        case FiberTag.HostRoot:
            return fiber.stateNode.containerInfo;
    }
    return null;
};
const isHostFiber = (fiber) => {
    switch (fiber.tag) {
        case FiberTag.HostComponent:
        case FiberTag.HostText:
        case FiberTag.HostRoot:
            return true;
    }
    return false;
};
const pushVisitStack = (stack, scope, fiber, flags, callback) => {
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
export const findFiber = (fiber, predicate, flags = FiberVisit.Child) => {
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
            return current;
        }
        pushVisitStack(stack, fiber, current, flags, null);
    }
    return null;
};
export const findFibers = (fiber, predicate, flags = FiberVisit.Child) => {
    const result = [];
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
            result.push(current);
        }
        pushVisitStack(stack, fiber, current, flags, null);
    }
    return result;
};
export const findFiberByType = (fiber, type, flags) => findFiber(fiber, (node) => {
    return node.type === type;
}, flags);
export const findFibersByType = (fiber, type, flags) => findFibers(fiber, (node) => {
    return node.type === type;
}, flags);
export const traverseFiber = (fiber, visit, flags = FiberVisit.Child) => {
    if (!fiber) {
        return;
    }
    const stack = [fiber];
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
export const findChildHostFibers = (fiber) => {
    const result = [];
    if (!fiber) {
        return result;
    }
    const stack = [fiber];
    while (stack.length) {
        const current = stack.pop();
        if (!current || current.tag === FiberTag.HostPortal) {
            continue;
        }
        if (isHostFiber(current)) {
            result.push(current);
            pushVisitStack(stack, fiber, current, FiberVisit.Sibling, null);
        }
        else {
            pushVisitStack(stack, fiber, current, FiberVisit.Child | FiberVisit.Sibling, null);
        }
    }
    return result;
};
export const findNextHostFiber = (scope, target) => {
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
const replaceFiberOnParent = (parentFiber, oldFiber, newFiber) => {
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
export const replaceFiber = (oldFiber, newFiber) => {
    const parentFiber = oldFiber.return;
    if (!parentFiber) {
        return false;
    }
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
    replaceFiberOnParent(parentFiber, oldFiber, newFiber);
    if (!newFiber.alternate || !parentFiber.alternate) {
        if (newFiber.alternate) {
            newFiber.alternate.return = null;
            newFiber.alternate.sibling = null;
        }
    }
    else {
        replaceFiberOnParent(parentFiber.alternate, oldFiber.alternate, newFiber.alternate);
    }
    return true;
};
const traverseEffectHooks = (fiber, visit) => {
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
    const updateQueue = fiber.updateQueue;
    const lastEffect = updateQueue?.lastEffect;
    let nextEffect = updateQueue?.lastEffect;
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
const isNoEffectHook = (effect) => {
    const create = effect.create;
    if (!create) {
        return true;
    }
    if (!hasOwnProperty.call(create, EffectProp)) {
        return false;
    }
    return HookEffectTag.NoFlags === (effect.tag & HookEffectTag.HasEffect);
};
const applyFiberEffect = (fiber) => {
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
            const instance = fiber.stateNode;
            const noUpdate = FiberFlag.NoFlags === (fiber.flags & FiberFlag.Update);
            const needRender = noUpdate && (true === instance.constructor[EffectProp]);
            if (needRender || isFunction(instance?.componentDidMount)) {
                flags |= FiberFlag.Update;
                const propKey = 'componentDidUpdate';
                const propVal = instance[propKey];
                const ownProp = hasOwnProperty.call(instance, propKey);
                instance[propKey] = function simulateComponentDidMount() {
                    if (ownProp) {
                        instance[propKey] = propVal;
                    }
                    else {
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
const bubbleProperties = (fiber) => {
    let child = fiber.child;
    while (child) {
        fiber.subtreeFlags |= child.subtreeFlags;
        fiber.subtreeFlags |= child.flags;
        child = child.sibling;
    }
};
export const appendFiberEffect = (rootFiber, effectFiber, renderFiber, finishFiber) => {
    if (UseSubtreeFlags) {
        traverseFiber(renderFiber, (fiber) => {
            const flags = applyFiberEffect(fiber);
            fiber.flags |= flags;
            return fiber.child && (() => {
                bubbleProperties(fiber);
            });
        });
        effectFiber.subtreeFlags &= FiberFlag.PassiveMask;
    }
    else {
        effectFiber.nextEffect = finishFiber;
        traverseFiber(renderFiber, (fiber) => {
            if (fiber === finishFiber) {
                return FiberVisit.Break;
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
const defineFiberProp = (fiber, prop, value) => {
    Object.defineProperty(fiber, prop, {
        configurable: true,
        enumerable: true,
        writable: true,
        value,
    });
};
const protectFiberProp = (fiber, prop, restore, needDummy) => {
    if (null == fiber) {
        return;
    }
    const descriptor = Object.getOwnPropertyDescriptor(fiber, prop);
    if (!descriptor || descriptor.get) {
        return;
    }
    const backup = fiber[prop];
    let value = backup;
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
            return restore.current ? backup : value;
        },
        set(update) {
            value = update;
        },
    });
};
const restoreFiberProp = (fiber, prop) => {
    if (hasOwnProperty.call(fiber, prop)) {
        defineFiberProp(fiber, prop, fiber[prop]);
    }
};
const protectFiberProps = (fiber, current, restore, needDummy) => {
    const alternate = fiber.alternate;
    if (alternate && !current) {
        protectFiberProps(alternate, fiber, restore, false);
    }
    for (const prop of ProtectedFiberProps) {
        protectFiberProp(fiber, prop, restore, needDummy);
    }
};
const restoreFiberProps = (fiber, current) => {
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
export const protectFiber = (fiber) => {
    const restore = { current: true };
    const stack = [true];
    traverseFiber(fiber, (node) => {
        const needDummy = isHostFiber(node) && true === stack[0];
        if (needDummy) {
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
        return null;
    });
    restore.current = false;
    return restore;
};
export const restoreFiber = (fiber, restore) => {
    restore.current = true;
    const stack = [true];
    traverseFiber(fiber, (node) => {
        const needRestore = isHostFiber(node) && true === stack[0];
        if (UseDeepDetach || node === fiber) {
            restoreFiberProps(node, null);
        }
        else if (needRestore) {
            restoreFiberProp(node, 'stateNode');
        }
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
