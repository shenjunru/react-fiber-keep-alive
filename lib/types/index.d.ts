import React from 'react';
import { markClassComponentHasSideEffectRender, markEffectHookIsOnetime } from './helpers';
declare type KeepAliveProps = {
    name: string;
    ignore?: boolean;
    children: React.ReactNode;
};
export declare const KeepAlive: React.FC<KeepAliveProps> & {
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
