import type { Logger } from '@shared/interfaces/Logger';
import * as React from 'react';

type SharedProps = {
    logger: Logger;
}

type TestComponent = React.ComponentType<SharedProps>;

export type TestRef = {
    setComponent(Component: TestComponent): void;
};

export const Test = React.forwardRef<TestRef, SharedProps>((props, ref) => {
    const [Component, setComponent] = React.useState<TestComponent>(() => () => null);

    React.useImperativeHandle(ref, () => ({
        setComponent(NewComponent) {
            setComponent(() => NewComponent);
        },
    }), []);

    return (
        <Component {...props} />
    );
});
