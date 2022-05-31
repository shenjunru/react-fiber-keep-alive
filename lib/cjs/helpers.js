"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreFiber = exports.protectFiber = exports.appendFiberEffect = exports.replaceFiber = exports.traverseFiber = exports.findFibersByType = exports.findFiberByType = exports.findFibers = exports.findFiber = exports.getRootFiber = exports.getElementFiber = exports.getInternalKey = exports.HookEffectTag = exports.FiberFlag = exports.FiberMode = exports.FiberTag = exports.FiberVisit = exports.markClassComponentHasSideEffectRender = exports.markEffectHookIsOnetime = void 0;
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
const FiberVisit = {
    Child: 0b000001,
    Sibling: 0b000010,
    Return: 0b000100,
    Effect: 0b001000,
    Break: 0b010000,
};
exports.FiberVisit = FiberVisit;
const FiberTag = {
    FunctionComponent: 0,
    ClassComponent: 1,
    HostRoot: 3,
    HostPortal: 4,
    HostComponent: 5,
    HostText: 6,
    MemoComponent: 14,
    SimpleMemoComponent: 15,
};
exports.FiberTag = FiberTag;
const FiberMode = {
    NoMode: 0b000000,
    ConcurrentMode: v18 ? 0b000001
        : 0b000100,
};
exports.FiberMode = FiberMode;
const FiberFlag = {
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
};
exports.FiberFlag = FiberFlag;
const HookEffectTag = {
    NoFlags: 0b0000,
    HasEffect: 0b0001,
    Insertion: v18 ? 0b0010
        : 0,
    Layout: v18 ? 0b0100
        : 0b0010,
    Passive: v18 ? 0b1000
        : 0b0100,
};
exports.HookEffectTag = HookEffectTag;
const getInternalKey = (element, prefix) => {
    return element && Object.keys(element).find((key) => key.startsWith(prefix));
};
exports.getInternalKey = getInternalKey;
const getElementFiber = (element, prefix = DomPropPrefix) => {
    const internalKey = getInternalKey(element, prefix);
    return internalKey ? element[internalKey] : undefined;
};
exports.getElementFiber = getElementFiber;
const getRootFiber = (container) => {
    var _a, _b;
    const fiber = v18 && container && getElementFiber(container, '__reactContainer$');
    const root = fiber ? fiber.stateNode : (_b = (_a = container) === null || _a === void 0 ? void 0 : _a._reactRootContainer) === null || _b === void 0 ? void 0 : _b._internalRoot;
    return root === null || root === void 0 ? void 0 : root.current;
};
exports.getRootFiber = getRootFiber;
const pushVisitStack = (stack, fiber, flags) => {
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
const findFiber = (fiber, predicate, flags = FiberVisit.Child | FiberVisit.Sibling) => {
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
            return current;
        }
        pushVisitStack(stack, current, flags);
    }
    return null;
};
exports.findFiber = findFiber;
const findFibers = (fiber, predicate, flags = FiberVisit.Child | FiberVisit.Sibling) => {
    const result = [];
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
            result.push(current);
        }
        pushVisitStack(stack, current, flags);
    }
    return result;
};
exports.findFibers = findFibers;
const findFiberByType = (root, type, flags) => findFiber(root, (fiber) => {
    return fiber.type === type;
}, flags);
exports.findFiberByType = findFiberByType;
const findFibersByType = (root, type, flags) => findFibers(root, (fiber) => {
    return fiber.type === type;
}, flags);
exports.findFibersByType = findFibersByType;
const traverseFiber = (fiber, visit, flags = FiberVisit.Child | FiberVisit.Sibling) => {
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
        if (isFunction(post)) {
            stack.push(post);
        }
        pushVisitStack(stack, current, flags);
    }
};
exports.traverseFiber = traverseFiber;
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
        case FiberTag.FunctionComponent:
        case FiberTag.MemoComponent:
        case FiberTag.SimpleMemoComponent: {
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
            if (needRender || isFunction(instance === null || instance === void 0 ? void 0 : instance.componentDidMount)) {
                flags |= FiberFlag.Update;
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
    if (prop === 'stateNode' && fiber.tag === FiberTag.HostComponent) {
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
    const restore = { current: false };
    if (UseDeepDetach) {
        traverseFiber(fiber, (node) => () => {
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
        traverseFiber(fiber, (node) => () => {
            restoreFiberProps(node, null);
            traverseEffectHooks(node, (effect) => {
                effect.destroy = undefined;
            });
        });
    }
    else {
        restoreFiberProps(fiber, null);
        traverseFiber(fiber, (node) => {
            traverseEffectHooks(node, (effect) => {
                effect.destroy = undefined;
            });
        });
    }
    restore.current = false;
};
exports.restoreFiber = restoreFiber;