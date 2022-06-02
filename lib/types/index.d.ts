import React from 'react';
import { markClassComponentHasSideEffectRender, markEffectHookIsOnetime } from './helpers';
declare type KeepAliveProps = {
    name: string;
    children: React.ReactNode;
};
export declare const KeepAlive: React.FC<KeepAliveProps> & {
    Provider: React.Provider<HTMLElement | null>;
};
export declare function keepAlive<P>(Component: React.ComponentType<P>, getProps: (props: P) => string | Omit<KeepAliveProps, 'children'>): React.FC<P>;
export { markClassComponentHasSideEffectRender, markEffectHookIsOnetime, };
export default KeepAlive;
