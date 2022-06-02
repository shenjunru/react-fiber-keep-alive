"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreFiber = exports.protectFiber = exports.appendFiberEffect = exports.replaceFiber = exports.findNextHostFiber = exports.findChildHostFibers = exports.traverseFiber = exports.findFibersByType = exports.findFiberByType = exports.findFibers = exports.findFiber = exports.getRootFiber = exports.getElementFiber = exports.HookEffectTag = exports.FiberFlag = exports.FiberMode = exports.FiberTag = exports.FiberVisit = exports.markClassComponentHasSideEffectRender = exports.markEffectHookIsOnetime = void 0;
const react_1 = require("react");
const v16 = react_1.version.startsWith('16');
const v17 = react_1.version.startsWith('17');
const v18 = react_1.version.startsWith('18');
const DomPropPrefix = v16 ? '__reactInternalInstance$' : '__reactFiber$';
const FiberEffectProp = (v16 ? 'effectTag' : 'flags');
const UseSubtreeFlags = v18;
const UseDeepDetach = v18;
const hasOwnProperty = Object.prototype.hasOwnProperty;
const isFunction = (object) => {
    return 'function' === typeof object;
};
const EffectProp = Symbol('Effect');
const markEffectHookIsOnetime = (effect) => {
    return Object.defineProperty(effect, EffectProp, {
        configurable: true,
        enumerable: false,
        get() {
            return true;
        },
    });
};
exports.markEffectHookIsOnetime = markEffectHookIsOnetime;
const markClassComponentHasSideEffectRender = (Class) => {
    return Object.defineProperty(Class, EffectProp, {
        configurable: true,
        enumerable: false,
        get() {
            return true;
        },
    });
};
exports.markClassComponentHasSideEffectRender = markClassComponentHasSideEffectRender;
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
exports.FiberVisit = Object.freeze({
    Child: 0b000001,
    Sibling: 0b000010,
    Return: 0b000100,
    Effect: 0b001000,
    Break: 0b010000,
});
exports.FiberTag = Object.freeze({
    FunctionComponent: 0,
    ClassComponent: 1,
    HostRoot: 3,
    HostPortal: 4,
    HostComponent: 5,
    HostText: 6,
    MemoComponent: 14,
    SimpleMemoComponent: 15,
});
exports.FiberMode = Object.freeze({
    NoMode: 0b000000,
    ConcurrentMode: v18 ? 0b000001
        : 0b000100,
});
exports.FiberFlag = Object.freeze({
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
exports.HookEffectTag = Object.freeze({
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
const getElementFiber = (element, prefix = DomPropPrefix) => {
    const internalKey = getInternalKey(element, prefix);
    return internalKey ? element[internalKey] : undefined;
};
exports.getElementFiber = getElementFiber;
const getRootFiber = (container) => {
    var _a;
    const fiber = v18 && container && (0, exports.getElementFiber)(container, '__reactContainer$');
    const root = fiber ? fiber.stateNode : (_a = container === null || container === void 0 ? void 0 : container._reactRootContainer) === null || _a === void 0 ? void 0 : _a._internalRoot;
    return root === null || root === void 0 ? void 0 : root.current;
};
exports.getRootFiber = getRootFiber;
const getHostNode = (fiber) => {
    switch (fiber === null || fiber === void 0 ? void 0 : fiber.tag) {
        case exports.FiberTag.HostComponent:
        case exports.FiberTag.HostText:
            return fiber.stateNode;
        case exports.FiberTag.HostRoot:
            return fiber.stateNode.containerInfo;
    }
    return null;
};
const isHostFiber = (fiber) => {
    switch (fiber.tag) {
        case exports.FiberTag.HostComponent:
        case exports.FiberTag.HostText:
        case exports.FiberTag.HostRoot:
            return true;
    }
    return false;
};
const pushVisitStack = (stack, scope, fiber, flags) => {
    if (scope !== fiber && flags === exports.FiberVisit.Child) {
        flags |= exports.FiberVisit.Sibling;
    }
    if (flags & exports.FiberVisit.Sibling) {
        fiber.sibling && stack.push(fiber.sibling);
    }
    if (flags & exports.FiberVisit.Child) {
        fiber.child && stack.push(fiber.child);
    }
    if (flags === exports.FiberVisit.Return) {
        fiber.return && stack.push(fiber.return);
    }
    if (flags === exports.FiberVisit.Effect) {
        fiber.nextEffect && stack.push(fiber.nextEffect);
    }
};
const findFiber = (fiber, predicate, flags = exports.FiberVisit.Child) => {
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
        pushVisitStack(stack, fiber, current, flags);
    }
    return null;
};
exports.findFiber = findFiber;
const findFibers = (fiber, predicate, flags = exports.FiberVisit.Child) => {
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
        pushVisitStack(stack, fiber, current, flags);
    }
    return result;
};
exports.findFibers = findFibers;
const findFiberByType = (fiber, type, flags) => (0, exports.findFiber)(fiber, (node) => {
    return node.type === type;
}, flags);
exports.findFiberByType = findFiberByType;
const findFibersByType = (fiber, type, flags) => (0, exports.findFibers)(fiber, (node) => {
    return node.type === type;
}, flags);
exports.findFibersByType = findFibersByType;
const traverseFiber = (fiber, visit, flags = exports.FiberVisit.Child) => {
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
        if (post === exports.FiberVisit.Break) {
            continue;
        }
        if (isFunction(post)) {
            stack.push(post);
        }
        pushVisitStack(stack, fiber, current, flags);
    }
};
exports.traverseFiber = traverseFiber;
const findChildHostFibers = (fiber) => {
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
        if (isHostFiber(current)) {
            result.push(current);
            pushVisitStack(stack, fiber, current, exports.FiberVisit.Sibling);
        }
        else {
            pushVisitStack(stack, fiber, current, exports.FiberVisit.Child | exports.FiberVisit.Sibling);
        }
    }
    return result;
};
exports.findChildHostFibers = findChildHostFibers;
const findNextHostFiber = (scope, target) => {
    let current = target.sibling || target.return;
    while (current) {
        if (current === scope) {
            return null;
        }
        const found = (0, exports.findFiber)(current.sibling, isHostFiber, exports.FiberVisit.Child | exports.FiberVisit.Sibling);
        if (found) {
            return found;
        }
        current = current.return;
    }
    return null;
};
exports.findNextHostFiber = findNextHostFiber;
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
const replaceFiber = (oldFiber, newFiber) => {
    const parentFiber = oldFiber.return;
    if (!parentFiber) {
        return false;
    }
    const hostFiber = (0, exports.findFiber)(parentFiber, isHostFiber, exports.FiberVisit.Return);
    const hostNode = getHostNode(hostFiber);
    if (!hostFiber || !hostNode) {
        return false;
    }
    const nextHostFiber = (0, exports.findNextHostFiber)(hostFiber, oldFiber);
    const nextHostNode = getHostNode(nextHostFiber);
    (0, exports.findChildHostFibers)(oldFiber).forEach((fiber) => {
        hostNode.removeChild(fiber.stateNode);
    });
    (0, exports.findChildHostFibers)(newFiber).forEach(nextHostNode ? (fiber) => {
        hostNode.insertBefore(fiber.stateNode, nextHostNode);
    } : (fiber) => {
        hostNode.appendChild(fiber.stateNode);
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
exports.replaceFiber = replaceFiber;
const traverseEffectHooks = (fiber, visit) => {
    switch (fiber.tag) {
        case exports.FiberTag.FunctionComponent:
        case exports.FiberTag.MemoComponent:
        case exports.FiberTag.SimpleMemoComponent: {
            break;
        }
        default:
            return false;
    }
    const updateQueue = fiber.updateQueue;
    const lastEffect = updateQueue === null || updateQueue === void 0 ? void 0 : updateQueue.lastEffect;
    let nextEffect = updateQueue === null || updateQueue === void 0 ? void 0 : updateQueue.lastEffect;
    while (nextEffect) {
        if (null != (nextEffect === null || nextEffect === void 0 ? void 0 : nextEffect.tag)) {
            let match = exports.HookEffectTag.NoFlags;
            match || (match = nextEffect.tag & exports.HookEffectTag.Layout);
            match || (match = nextEffect.tag & exports.HookEffectTag.Passive);
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
    return exports.HookEffectTag.NoFlags === (effect.tag & exports.HookEffectTag.HasEffect);
};
const applyFiberEffect = (fiber) => {
    let flags = exports.FiberFlag.NoFlags;
    const isFunctionComponent = traverseEffectHooks(fiber, (effect) => {
        if (isNoEffectHook(effect)) {
            return;
        }
        effect.tag |= exports.HookEffectTag.HasEffect;
        effect.destroy = undefined;
        switch (effect.tag & ~exports.HookEffectTag.HasEffect) {
            case exports.HookEffectTag.Layout:
                flags |= exports.FiberFlag.Update;
                break;
            case exports.HookEffectTag.Passive:
                flags |= exports.FiberFlag.Update;
                flags |= exports.FiberFlag.Passive;
                break;
        }
    });
    if (isFunctionComponent) {
        return flags;
    }
    switch (fiber.tag) {
        case exports.FiberTag.ClassComponent: {
            if (!fiber.alternate) {
                break;
            }
            const instance = fiber.stateNode;
            const noUpdate = exports.FiberFlag.NoFlags === (fiber.flags & exports.FiberFlag.Update);
            const needRender = noUpdate && (true === instance.constructor[EffectProp]);
            if (needRender || isFunction(instance === null || instance === void 0 ? void 0 : instance.componentDidMount)) {
                flags |= exports.FiberFlag.Update;
                const propKey = 'componentDidUpdate';
                const propVal = instance[propKey];
                const ownProp = hasOwnProperty.call(instance, propKey);
                instance[propKey] = function simulateComponentDidMount() {
                    var _a;
                    if (ownProp) {
                        instance[propKey] = propVal;
                    }
                    else {
                        delete instance[propKey];
                    }
                    if (needRender) {
                        this.render();
                    }
                    (_a = this.componentDidMount) === null || _a === void 0 ? void 0 : _a.call(this);
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
const appendFiberEffect = (rootFiber, effectFiber, renderFiber, finishFiber) => {
    if (UseSubtreeFlags) {
        (0, exports.traverseFiber)(renderFiber, (fiber) => {
            const flags = applyFiberEffect(fiber);
            fiber.flags |= flags;
            return fiber.child && (() => {
                bubbleProperties(fiber);
            });
        });
        effectFiber.subtreeFlags &= exports.FiberFlag.PassiveMask;
    }
    else {
        effectFiber.nextEffect = finishFiber;
        (0, exports.traverseFiber)(renderFiber, (fiber) => {
            if (fiber === finishFiber) {
                return exports.FiberVisit.Break;
            }
            const flags = applyFiberEffect(fiber);
            rootFiber[FiberEffectProp] |= flags;
            fiber[FiberEffectProp] |= flags;
            fiber.nextEffect = null;
            return () => {
                if (exports.FiberFlag.NoFlags === (fiber[FiberEffectProp] & exports.FiberFlag.LifecycleEffectMask)) {
                    return;
                }
                const nextEffect = effectFiber.nextEffect;
                effectFiber.nextEffect = fiber;
                fiber.nextEffect = nextEffect;
            };
        });
    }
};
exports.appendFiberEffect = appendFiberEffect;
const defineFiberProp = (fiber, prop, value) => {
    Object.defineProperty(fiber, prop, {
        configurable: true,
        enumerable: true,
        writable: true,
        value,
    });
};
const protectFiberProp = (fiber, prop, restore) => {
    if (null == fiber) {
        return;
    }
    const descriptor = Object.getOwnPropertyDescriptor(fiber, prop);
    if (!descriptor || descriptor.get) {
        return;
    }
    const backup = fiber[prop];
    let value = backup;
    if (!restore.current && prop === 'stateNode' && isHostFiber(fiber)) {
        value = null;
        if (backup === null || backup === void 0 ? void 0 : backup.parentNode) {
            const dummy = document.createElement('div');
            backup.parentNode.appendChild(dummy);
            value = dummy;
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
const protectFiberProps = (fiber, current, restore) => {
    const alternate = fiber.alternate;
    if (alternate && !current) {
        protectFiberProps(alternate, fiber, restore);
    }
    for (const prop of ProtectedFiberProps) {
        protectFiberProp(fiber, prop, restore);
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
const protectFiber = (fiber) => {
    const restore = { current: true };
    (0, exports.findChildHostFibers)(fiber).forEach((node) => {
        protectFiberProp(node, 'stateNode', restore);
        const hostNode = getHostNode(node);
        const parentNode = hostNode === null || hostNode === void 0 ? void 0 : hostNode.parentNode;
        if (hostNode && parentNode) {
            const dummy = document.createElement('div');
            parentNode.replaceChild(dummy, hostNode);
            node.stateNode = dummy;
        }
    });
    restore.current = false;
    if (UseDeepDetach) {
        (0, exports.traverseFiber)(fiber, (node) => () => {
            protectFiberProps(node, null, restore);
        });
    }
    else {
        protectFiberProps(fiber, null, restore);
    }
    return restore;
};
exports.protectFiber = protectFiber;
const restoreFiber = (fiber, restore) => {
    restore.current = true;
    if (UseDeepDetach) {
        (0, exports.traverseFiber)(fiber, (node) => () => {
            restoreFiberProps(node, null);
            traverseEffectHooks(node, (effect) => {
                effect.destroy = undefined;
            });
        });
    }
    else {
        restoreFiberProps(fiber, null);
        (0, exports.findChildHostFibers)(fiber).forEach((node) => {
            restoreFiberProp(node, 'stateNode');
        });
        (0, exports.traverseFiber)(fiber, (node) => {
            traverseEffectHooks(node, (effect) => {
                effect.destroy = undefined;
            });
        });
    }
    restore.current = false;
};
exports.restoreFiber = restoreFiber;
