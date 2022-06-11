import * as React from 'react';

const expose = Object.assign(function lazy<T extends React.ComponentType<any>>(
    Component: T,
    Fallback: React.FC<React.ComponentProps<T>>,
) {
    const LazyComponent = React.lazy(() => new Promise<{
        default: T;
    }>((resolve) => {
        promise.then(() => {
            resolve({ default: Component });
        });
    }));

    return (props: React.ComponentProps<T>) => (
        <React.Suspense fallback={<Fallback {...props} />}>
            <LazyComponent {...props} />
        </React.Suspense>
    );
}, {
    promise: Promise.resolve(),
    resolve() {},
});

const promise = new Promise((resolve) => Object.assign(expose, { resolve }));
Object.assign(expose, { promise });

export {
    expose as lazy,
};
