import type { Fiber } from 'react-reconciler';
import type { ComponentClass, ComponentType, ComponentProps, EffectCallback } from 'react';
declare type Nullable<T> = T | null | undefined;
interface TypedFiber<C extends ComponentType<any> = ComponentType<any>> extends Fiber {
    memoizedProps: ComponentProps<C>;
}
export declare const markEffectHookIsOnetime: (effect: React.EffectCallback) => EffectCallback;
export declare const markClassComponentHasSideEffectRender: <T extends ComponentClass<any, any>>(Class: T) => T;
declare type PropRestore = {
    current: boolean;
};
export declare const FiberVisit: Readonly<{
    readonly Child: 1;
    readonly Sibling: 2;
    readonly Return: 4;
    readonly Effect: 8;
    readonly SiblingFirst: 16;
    readonly Break: 64;
    readonly Continue: 32;
}>;
declare type FiberTraverseControl = (typeof FiberVisit.Break | typeof FiberVisit.Continue);
export declare const FiberTag: Readonly<{
    readonly FunctionComponent: 0;
    readonly ClassComponent: 1;
    readonly HostRoot: 3;
    readonly HostPortal: 4;
    readonly HostComponent: 5;
    readonly HostText: 6;
    readonly ForwardRef: 11;
    readonly MemoComponent: 14;
    readonly SimpleMemoComponent: 15;
}>;
export declare const FiberMode: Readonly<{
    NoMode: number;
    ConcurrentMode: number;
}>;
export declare const FiberFlag: Readonly<{
    NoFlags: number;
    Placement: number;
    Update: number;
    Passive: number;
    LifecycleEffectMask: number;
    PassiveMask: number;
}>;
export declare const HookEffectTag: Readonly<{
    NoFlags: number;
    HasEffect: number;
    Insertion: number;
    Layout: number;
    Passive: number;
}>;
export declare const getElementFiber: (element: Nullable<HTMLElement>, prefix?: string) => undefined | Fiber;
export declare const getRootFiber: (container: Nullable<void | HTMLElement>) => undefined | Fiber;
export declare const findFiber: <T extends Fiber>(fiber: Nullable<Fiber>, predicate: (fiber: Fiber) => boolean | FiberTraverseControl, flags?: number) => T | null;
export declare const findParentFiber: <T extends ComponentType<any>>(fiber: Nullable<Fiber>, Component: T) => TypedFiber<T> | null;
export declare const traverseFiber: (fiber: Nullable<Fiber>, visit: (fiber: Fiber) => Nullable<void | FiberTraverseControl | (() => void)>, flags?: number) => void;
export declare const appendFiberEffect: (rootFiber: Fiber, effectFiber: Fiber, renderFiber: Fiber, finishFiber: Fiber) => void;
export declare const protectFiber: (fiber: Fiber) => PropRestore;
export declare const replaceFiber: (oldFiber: Fiber, newFiber: Fiber, restore: PropRestore) => boolean;
export {};
