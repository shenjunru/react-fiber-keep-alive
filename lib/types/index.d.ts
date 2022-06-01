import React from 'react';
import { markClassComponentHasSideEffectRender, markEffectHookIsOnetime } from './helpers';
declare const useIsomorphicLayoutEffect: typeof React.useLayoutEffect;
declare type KeepAliveProps = {
    name: string;
    hostTag?: 'div' | 'span';
    children: React.ReactNode;
};
declare function keepAlive<P>(Component: React.ComponentType<P>, getProps: (props: P) => string | Omit<KeepAliveProps, 'children'>): React.FC<P>;
declare const KeepAlive: React.FC<KeepAliveProps> & {
    Provider: React.Provider<HTMLElement | null>;
};
export default KeepAlive;
export { markClassComponentHasSideEffectRender, markEffectHookIsOnetime, useIsomorphicLayoutEffect, keepAlive, KeepAlive, };
