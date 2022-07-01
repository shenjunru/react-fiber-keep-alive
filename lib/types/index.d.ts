import type { Fiber } from 'react-reconciler';
import * as React from 'react';
import { markClassComponentHasSideEffectRender, markEffectHookIsOnetime } from './helpers';
declare const enum Step {
    Finish = 0,
    Render = 1,
    Effect = 2
}
export declare type KeepAliveCache = [Fiber, {
    current: boolean;
}];
export declare type KeepAliveState = [Step, null | KeepAliveCache];
export declare type KeepAliveProps = {
    name: string;
    ignore?: boolean;
    onSave?: (name: string) => void;
    onRead?: (name: string) => void;
    children: React.ReactNode;
};
export interface IMap<K, V> {
    delete(key: K): void;
    forEach(iterator: (value: V, key: K) => void): void;
    get(key: K): V | undefined;
    set(key: K, value: V): void;
}
export declare type Context = Readonly<[] | [HTMLElement, IMap<string, KeepAliveCache>, IMap<string, string>]>;
export declare const KeepAliveContext: React.Context<Context>;
export declare const KeepAlive: React.FC<KeepAliveProps> & {
    Context: React.Context<Context>;
    Provider: React.FC<{
        children: React.ReactNode;
        value: null | HTMLElement;
    }>;
};
export declare function keepAlive<P>(Component: React.ComponentType<P>, getProps: (props: P) => ((Omit<KeepAliveProps, 'children'> & {
    key?: React.Key;
}) | string)): React.FC<P>;
export declare const useIgnoreKeepAlive: () => (name: string) => void;
export { markClassComponentHasSideEffectRender, markEffectHookIsOnetime, };
export default KeepAlive;
