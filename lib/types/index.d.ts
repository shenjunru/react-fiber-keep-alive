import React from 'react';
declare const useIsomorphicLayoutEffect: typeof React.useLayoutEffect;
declare const KeepAliveContext: React.Context<HTMLElement | null>;
declare const KeepAlive: React.FC<{
    name: string;
    children: React.ReactNode;
}> & {
    Provider: typeof KeepAliveContext.Provider;
};
declare function keepAlive<P>(Component: React.ComponentType<P>, getCacheName: (props: P) => string): React.FC<P>;
export default KeepAlive;
export { useIsomorphicLayoutEffect, keepAlive, KeepAlive, };
export { markClassComponentHasSideEffectRender, markEffectHookIsOnetime, } from './helpers';
