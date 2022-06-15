import type { Logger } from '@shared/interfaces/Logger';
import * as React from 'react';
import { keepAlive, markEffectHookIsOnetime } from '@shared/react-fiber-keep-alive';
import { lazy } from '@shared/helpers/lazy';
import { ForwardRef } from '@shared/components/ForwardRef';

function noop() {}

export const CounterFN: React.FC<{
    logger: Logger;
    prefix: string;
}> = ({ prefix, logger }) => {
    logger(`[${prefix}] render()`);

    const ref = React.useRef(noop);

    const [count, setCount] = React.useState(() => {
        logger(`[${prefix}] create - useState()`);
        return 0;
    });

    const setButtonRef = React.useCallback((value: null | HTMLButtonElement) => {
        logger(`[${prefix}] setButtonRef()`, value?.tagName || value);
    }, []);

    const action = React.useCallback(() => {
        logger(`[${prefix}] useCallback()`, count);
    }, [count]);

    React.useImperativeHandle(ref, () => {
        logger(`[${prefix}] useImperativeHandle()`, count);
        action();
        return action;
    }, [count, action]);

    React.useMemo(() => {
        logger(`[${prefix}] useMemo()`);
    }, []);

    React.useMemo(() => {
        logger(`[${prefix}] useMemo(count)`, count);
    }, [count]);

    React.useEffect(() => {
        logger(`[${prefix}] create - useEffect()`);
        return () => {
            logger(`[${prefix}] destroy - useEffect()`);
        };
    }, []);

    React.useEffect(() => {
        logger(`[${prefix}] create - useEffect(count)`, count);
        return () => {
            logger(`[${prefix}] destroy - useEffect(count)`, count);
        };
    }, [count]);

    React.useEffect(markEffectHookIsOnetime(() => {
        logger(`[${prefix}] create - onetime - useEffect(count)`, count);
        return () => {
            logger(`[${prefix}] destroy - onetime - useEffect(count)`, count);
        };
    }), [count]);

    React.useLayoutEffect(() => {
        logger(`[${prefix}] create - useLayoutEffect()`);
        return () => {
            logger(`[${prefix}] destroy - useLayoutEffect()`);
        };
    }, []);

    React.useLayoutEffect(() => {
        logger(`[${prefix}] create - useLayoutEffect(count)`, count);
        return () => {
            logger(`[${prefix}] destroy - useLayoutEffect(count)`, count);
        };
    }, [count]);

    React.useLayoutEffect(markEffectHookIsOnetime(() => {
        logger(`[${prefix}] create - onetime - useLayoutEffect(count)`, count);
        return () => {
            logger(`[${prefix}] destroy - onetime - useLayoutEffect(count)`, count);
        };
    }), [count]);

    return (
        <button ref={setButtonRef} onClick={() => setCount(count + 1)}>
            [{prefix}] {count}
        </button>
    );
};

export const LazyCounterFN = lazy(CounterFN, ({ logger, prefix }) => (
    <ForwardRef logger={logger} prefix={`${prefix}-Fallback`} />
));
export const MemoCounterFN = React.memo(CounterFN);

export const KeepCounterFN = keepAlive(CounterFN, (props) => props.prefix);
export const KeepLazyCounterFN = keepAlive(LazyCounterFN, (props) => props.prefix);
export const KeepMemoCounterFN = keepAlive(MemoCounterFN, (props) => props.prefix);
