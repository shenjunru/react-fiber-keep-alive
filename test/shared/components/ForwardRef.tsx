import type { Logger } from '@shared/interfaces/Logger';
import { keepAlive } from '@shared/react-fiber-keep-alive';
import * as React from 'react';

export const ForwardRef = React.forwardRef<HTMLSpanElement, {
    logger: Logger;
    prefix: string;
}>(({ logger, prefix }, ref) => {
    const date = React.useMemo(() => {
        logger(`[${prefix}] create - useMemo()`);
        return new Date();
    }, []);

    React.useEffect(() => {
        logger(`[${prefix}] create - useEffect()`);
        return () => {
            logger(`[${prefix}] destroy - useEffect()`);
        };
    }, []);

    React.useLayoutEffect(() => {
        logger(`[${prefix}] create - useLayoutEffect()`);
        return () => {
            logger(`[${prefix}] destroy - useLayoutEffect()`);
        };
    }, []);

    return <span ref={ref}>{date.valueOf()}</span>;
});

export const KeepForwardRef = keepAlive(ForwardRef, (props) => props.prefix);
