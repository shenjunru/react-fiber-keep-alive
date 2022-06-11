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
        'ts-jest': {
            diagnostics: false,
        },
    },
};
