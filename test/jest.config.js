// https://jestjs.io/docs/en/webpack

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    resolver: '<rootDir>/../jest.resolver.js',
    moduleNameMapper: {
        '@shared/(.*)': '<rootDir>/../shared/$1',
    },
    watchman: false,
    haste: {
        enableSymlinks: true,
    },
    globals: {
        IS_REACT_ACT_ENVIRONMENT: true, // fix v18 "act()" warning
        'ts-jest': {
            diagnostics: false,
        },
    },
};
