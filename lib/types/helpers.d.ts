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
    readonly Break: 16;
    readonly SiblingFirst: 32;
}>;
export declare const FiberTag: Readonly<{
    FunctionComponent: number;
    ClassComponent: number;
    HostRoot: number;
    HostPortal: number;
    HostComponent: number;
    HostText: number;
    ForwardRef: number;
    MemoComponent: number;
    SimpleMemoComponent: number;
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
export declare const findFiber: <T extends Fiber>(fiber: Nullable<Fiber>, predicate: (fiber: Fiber) => boolean, flags?: number) => T | null;
export declare const findFibers: <T extends Fiber>(fiber: Nullable<Fiber>, predicate: (fiber: Fiber) => boolean, flags?: number) => T[];
export declare const findFiberByType: <T extends ComponentType<any>>(fiber: Nullable<Fiber>, type: T, flags?: number | undefined) => TypedFiber<T> | null;
export declare const findFibersByType: <T extends ComponentType<any>>(fiber: Nullable<Fiber>, type: T, flags?: number | undefined) => TypedFiber<T>[];
export declare const traverseFiber: (fiber: Nullable<Fiber>, visit: (fiber: Fiber) => Nullable<void | typeof FiberVisit.Break | (() => void)>, flags?: number) => void;
export declare const findChildHostFibers: (fiber: Nullable<Fiber>) => Fiber[];
export declare const findNextHostFiber: (scope: Fiber, target: Fiber) => null | Fiber;
export declare const replaceFiber: (oldFiber: Fiber, newFiber: Fiber) => boolean;
export declare const appendFiberEffect: (rootFiber: Fiber, effectFiber: Fiber, renderFiber: Fiber, finishFiber: Fiber) => void;
export declare const protectFiber: (fiber: Fiber) => PropRestore;
export declare const restoreFiber: (fiber: Fiber, restore: PropRestore) => void;
export {};
