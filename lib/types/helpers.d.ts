import type { Fiber } from 'react-reconciler';
import type { ComponentClass, ComponentType, ComponentProps, EffectCallback } from 'react';
declare type Nullable<T> = T | null | undefined;
interface TypedFiber<C extends ComponentType<any> = ComponentType<any>> extends Fiber {
    memoizedProps: ComponentProps<C>;
}
declare const markEffectHookIsOnetime: (effect: React.EffectCallback) => any;
declare const markClassComponentHasSideEffectRender: <T extends ComponentClass<any, any>>(Class: T) => T;
declare type PropRestore = {
    current: boolean;
};
declare const FiberVisit: {
    readonly Child: 1;
    readonly Sibling: 2;
    readonly Return: 4;
    readonly Effect: 8;
    readonly Break: 16;
};
declare const FiberTag: {
    FunctionComponent: number;
    ClassComponent: number;
    HostRoot: number;
    HostPortal: number;
    HostComponent: number;
    HostText: number;
    MemoComponent: number;
    SimpleMemoComponent: number;
};
declare const FiberMode: {
    NoMode: number;
    ConcurrentMode: number;
};
declare const FiberFlag: {
    NoFlags: number;
    Placement: number;
    Update: number;
    Passive: number;
    LifecycleEffectMask: number;
    PassiveMask: number;
};
declare const HookEffectTag: {
    NoFlags: number;
    HasEffect: number;
    Insertion: number;
    Layout: number;
    Passive: number;
};
declare const getInternalKey: (element: Nullable<HTMLElement>, prefix: string) => string | null | undefined;
declare const getElementFiber: (element: Nullable<HTMLElement>, prefix?: string) => undefined | Fiber;
declare const getRootFiber: (container: Nullable<void | HTMLElement>) => undefined | Fiber;
declare const findFiber: <T extends Fiber>(fiber: Nullable<Fiber>, predicate: (fiber: Fiber) => boolean | typeof FiberVisit.Break, flags?: number) => T | null;
declare const findFibers: <T extends Fiber>(fiber: Nullable<Fiber>, predicate: (fiber: Fiber) => boolean | typeof FiberVisit.Break, flags?: number) => T[];
declare const findFiberByType: <T extends ComponentType<any>>(root: Nullable<Fiber>, type: T, flags?: number | undefined) => TypedFiber<T> | null;
declare const findFibersByType: <T extends ComponentType<any>>(root: Nullable<Fiber>, type: T, flags?: number | undefined) => TypedFiber<T>[];
declare const traverseFiber: (fiber: Nullable<Fiber>, visit: (fiber: Fiber) => Nullable<void | typeof FiberVisit.Break | (() => void)>, flags?: number) => void;
declare const replaceFiber: (oldFiber: Fiber, newFiber: Fiber) => boolean;
declare const appendFiberEffect: (rootFiber: Fiber, effectFiber: Fiber, renderFiber: Fiber, finishFiber: Fiber) => void;
declare const protectFiber: (fiber: Fiber) => PropRestore;
declare const restoreFiber: (fiber: Fiber, restore: PropRestore) => void;
export { markEffectHookIsOnetime, markClassComponentHasSideEffectRender, FiberVisit, FiberTag, FiberMode, FiberFlag, HookEffectTag, getInternalKey, getElementFiber, getRootFiber, findFiber, findFibers, findFiberByType, findFibersByType, traverseFiber, replaceFiber, appendFiberEffect, protectFiber, restoreFiber, };
