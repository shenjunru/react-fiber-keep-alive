import type { Logger } from '@shared/interfaces/Logger';
import * as React from 'react';
import { keepAlive } from '@shared/react-fiber-keep-alive';
import {
    ForwardRef,
    KeepForwardRef,
} from '@shared/components/ForwardRef';
import {
    CounterCX,
    KeepCounterCX,
    KeepLazyCounterCX,
    LazyCounterCX
} from '@shared/components/CounterCX';
import {
    CounterFN,
    KeepCounterFN,
    KeepLazyCounterFN,
    KeepMemoCounterFN,
    LazyCounterFN,
    MemoCounterFN,
} from '@shared/components/CounterFN';

export const ListA: React.FC<{
    logger: Logger;
}> = ({ logger }) => (
    <ul>
        <li><ForwardRef logger={logger} prefix="A-ForwardRef" /></li>
        <li><CounterCX logger={logger} prefix="A-CounterCX" /></li>
        <li><CounterFN logger={logger} prefix="A-CounterFN" /></li>
        <li><MemoCounterFN logger={logger} prefix="A-MemoCounterFN" /></li>
        <li><LazyCounterCX logger={logger} prefix="A-LazyCounterCX" /></li>
        <li><LazyCounterFN logger={logger} prefix="A-LazyCounterFN" /></li>
    </ul>
);

export const ListB: React.FC<{
    logger: Logger;
}> = ({ logger }) => (
    <ul>
        <li><KeepForwardRef logger={logger} prefix="B-ForwardRef" /></li>
        <li><KeepCounterCX logger={logger} prefix="B-CounterCX" /></li>
        <li><KeepCounterFN logger={logger} prefix="B-CounterFN" /></li>
        <li><KeepMemoCounterFN logger={logger} prefix="B-MemoCounterFN" /></li>
        <li><KeepLazyCounterCX logger={logger} prefix="B-LazyCounterCX" /></li>
        <li><KeepLazyCounterFN logger={logger} prefix="B-LazyCounterFN" /></li>
    </ul>
);

export const KeepA = keepAlive(ListA, () => {
    return 'ListA';
});

export const KeepB = keepAlive(ListB, () => {
    return 'ListB';
});
