import type { Logger } from '@shared/interfaces/Logger';
import * as React from 'react';
import { act, Simulate } from 'react-dom/test-utils';
import { lazy } from '@shared/helpers/lazy';
import { test } from '@shared/helpers/test';
import { output } from './output';
import KeepAlive from '@shared/react-fiber-keep-alive';
import { Test, TestRef } from '@shared/components/Test';
import {
    KeepA,
    ListB,
    KeepB,
} from '@shared/components/List';

test([
    [`react-${React.version}`, async (container) => {
        const logs: any[] = [];
        const logger: Logger = (...args) => void logs.push(args);
        const test = React.createRef<null | TestRef>();

        const clickButtons = () => act(() => {
            const buttons = container.querySelectorAll('button');
            buttons.forEach((button) => {
                Simulate.click(button);
            });
        });

        const checkButtons = (values: string[]) => {
            const buttons = container.querySelectorAll('button');
            expect(buttons.length).toBe(values.length);
            buttons.forEach((button, i) => {
                expect(button.textContent?.split(' ').pop()).toBe(values[i]);
            });
        };

        const checkDates = (values: string[]) => {
            const dates = container.querySelectorAll('span');
            expect(dates.length).toBe(values.length);
            dates.forEach((button, i) => {
                expect(button.textContent).toBe(values[i]);
            });
        };

        const checkLogs = (name: string) => {
            expect(logs).toMatchSnapshot(name);
            logs.length = 0;
        };

        jest.useFakeTimers({ now: 0 });

        act(() => output(container, (
            <KeepAlive.Provider value={container}>
                <Test ref={test} logger={logger} />
            </KeepAlive.Provider>
        )));
        checkButtons([]);
        checkDates([]);
        checkLogs('initialization');

        act(() => test.current?.setComponent(KeepA));
        const A1 = container.innerHTML;
        checkButtons(['0', '0', '0']);
        checkDates(['0', '0', '0']);
        checkLogs('#1 KeepA render()');

        act(() => test.current?.setComponent(ListB));
        const B1 = container.innerHTML;
        checkButtons(['0', '0', '0']);
        checkDates(['0', '0', '0']);
        checkLogs('#1 ListB render()');

        act(() => test.current?.setComponent(KeepB));
        const C1 = container.innerHTML;
        checkButtons(['0', '0', '0']);
        checkDates(['0', '0', '0']);
        checkLogs('#1 KeepB render()');

        jest.useFakeTimers({ now: 1 });

        act(() => test.current?.setComponent(KeepA));
        const A2 = container.innerHTML;
        checkButtons(['0', '0', '0']);
        checkDates(['0', '0', '0']);
        checkLogs('#2 KeepA render()');
        expect(A2).toBe(A1);

        clickButtons();
        const A3 = container.innerHTML;
        checkButtons(['1', '1', '1']);
        checkDates(['0', '0', '0']);
        checkLogs('#3 KeepA click()');
        expect(A3).not.toBe(A2);

        act(() => test.current?.setComponent(ListB));
        const B2 = container.innerHTML;
        checkButtons(['0', '0', '0']);
        checkDates(['0', '0', '0']);
        checkLogs('#2 ListB render()');
        expect(B2).toBe(B1);

        clickButtons();
        const B3 = container.innerHTML;
        checkButtons(['1', '1', '1']);
        checkDates(['0', '0', '0']);
        checkLogs('#3 ListB click()');
        expect(B3).not.toBe(B2);

        act(() => test.current?.setComponent(KeepB));
        const C2 = container.innerHTML;
        checkButtons(['0', '0', '0']);
        checkDates(['0', '0', '0']);
        checkLogs('#2 KeepB render()');
        expect(C2).toBe(C1);

        clickButtons();
        const C3 = container.innerHTML;
        checkButtons(['1', '1', '1']);
        checkDates(['0', '0', '0']);
        checkLogs('#3 KeepB click()');
        expect(C3).not.toBe(C2);

        jest.useFakeTimers({ now: 3 });

        await act(() => (lazy.resolve(), lazy.promise));
        await act(() => lazy.promise);

        checkButtons(['1', '1', '1', '0', '0']);
        checkDates(['0']);
        checkLogs('#4 KeepB render()');

        clickButtons();
        checkButtons(['2', '2', '2', '1', '1']);
        checkDates(['0']);
        checkLogs('#5 KeepB click()');

        act(() => test.current?.setComponent(KeepA));
        checkButtons(['1', '1', '1', '0', '0']);
        checkDates(['0']);
        checkLogs('#4 KeepA render()');

        clickButtons();
        checkButtons(['2', '2', '2', '1', '1']);
        checkDates(['0']);
        checkLogs('#5 KeepA click()');

        act(() => test.current?.setComponent(ListB));
        checkButtons(['1', '1', '1', '0', '0']);
        checkDates(['0']);
        checkLogs('#4 ListB render()');

        clickButtons();
        checkButtons(['2', '2', '2', '1', '1']);
        checkDates(['0']);
        checkLogs('#5 ListB click()');
    }],
]);
