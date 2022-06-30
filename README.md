# Keep-Alive for `React DOM`

[![npm](https://img.shields.io/npm/v/react-fiber-keep-alive.svg?style=for-the-badge)](http://npm.im/react-fiber-keep-alive)
[![downloads](https://img.shields.io/npm/dm/react-fiber-keep-alive.svg?style=for-the-badge)](https://www.npmjs.com/package/react-fiber-keep-alive)
[![typescript](https://img.shields.io/badge/language-typescript-blue?style=for-the-badge)](https://www.typescriptlang.org/)
[![LICENSE](https://img.shields.io/npm/l/react-fiber-keep-alive.svg?style=for-the-badge)](https://github.com/shenjunru/react-fiber-keep-alive/blob/main/LICENSE)

`<KeepAlive>` is a component that maintains component state and avoids repeated re-rendering.


## ✨ Features
- [x] Only based on `React Fiber` and `React Hooks`.
- [x] Triggers original class component life circle.
- [x] Triggers original effect hooks.
- [x] Supports context updates.
- [x] Supports multiple `keep-alive`.
- [x] Supports `react-dom` v16.8+.
- [x] Supports `react-dom` v17.
- [x] Supports `react-dom` v18.


## 📦 Installation

```bash
npm install --save react-fiber-keep-alive
```


## 🔨 Usage

```JavaScript
import React from 'react';
import ReactDOM from 'react-dom';
import KeepAlive from 'react-fiber-keep-alive';

const root = document.getElementById('root');

ReactDOM.render((
    <KeepAlive.Provider value={root}>
        ...
        <KeepAlive name="test">
            <YourComponent />
        </KeepAlive>
        ...
    </KeepAlive.Provider>
), root);
```

## 📝 API

- Provider `root` container element
    ```JSX
    <KeepAlive.Provider value={container}>
    ```
  - Must be the root container of `render()`.
  - If not provided, `keep-alive` will be disabled.

- Wrap your component with `<KeepAlive>`
    ```JSX
    <KeepAlive name="unique-key">
        <YourComponent />
    </KeepAlive>
    ```
    - prop "name" is a required unique string used to identify the cache.
    - prop "ignore" is a optional boolean used to bypass and clear the cache.
    - prop "onRead(name: string): void" is a optional callback after cache applied.
    - prop "onSave(name: string): void" is a optional callback after cache saved.

- Wrap your component with `keepLive()`
    ```JavaScript
    import { keepAlive } from 'react-fiber-keep-alive';

    const NewComponent = keepAlive(YourComponent, (props) => {
        // props: the income props for `<YourComponent>`
        
        // you can use react hooks here

        return `unique-key`;

        // or

        return {
            name: `unique-key`,
            // other props for `<KeepAlive>`
        };
    });
    ```

- Hook: `useIgnoreKeepAlive()` returns a cache cleaner function.
    ```JavaScript
    import { useIgnoreKeepAlive } from 'react-fiber-keep-alive';
    
    const ignoreCache = useIgnoreKeepAlive();

    ignoreCache(`unique-key`);
    ```

- If the `render()` of class component has side effects.
    ```JavaScript
    import { markClassComponentHasSideEffectRender } from 'react-fiber-keep-alive';

    markClassComponentHasSideEffectRender(ClassComponent);

    // Example:
    class Test extends React.Component {
        render() {
            // side effect here, ex: emit event here.
            return null;
        }
    }
    markClassComponentHasSideEffectRender(Test);
    ```

- If no need to trigger the effect hook while remounting.
    ```JavaScript
    import { markEffectHookIsOnetime } from 'react-fiber-keep-alive';

    markEffectHookIsOnetime(effectHook);

    // Example:
    React.useEffect(markEffectHookIsOnetime(() => {
        // do something
    }), []);
    React.useLayoutEffect(markEffectHookIsOnetime(() => {
        // do something
    }), []);
    ```


## 💡 Tips

- Be careful the global side effects. (ex: insert global style)
- Do not use `<KeepAlive>` under the `<React.StrictMode>`.
- Recursive `<KeepAlive>` handled by top level `<KeepAlive>`.
- If the `container` changed in `ReactDOM.createPortal(children, container)`.
  - All saved sub tree state will be lost.
- Errors from `react-devtools` after `<KeepAlive>` remounted.
  - Try force refresh the components tree. (ex: updates components filter)


## 🏁 Tested

### Examples
- [react-router v5](https://codesandbox.io/s/keep-alive-react-router-example-hfbbi7)

### React v16.8+ / v17 / v18
- [x] `render(children, container)`
- [x] `hydrate(children, container)`

### React v18 (concurrent mode)
- [x] `createRoot(container).render(children)`
- [x] `hydrateRoot(container, children)`

### Class Component
- [x] `Component.getDerivedStateFromProps()`
- [x] `Component.getDerivedStateFromError()`
- [x] `instance.componentDidMount()`
- [x] `instance.getSnapshotBeforeUpdate()`
- [x] `instance.componentDidUpdate()`
- [x] `instance.componentWillUnmount()`
- [x] `instance.render()`

### Function Component
- [x] `useContext()`
- [x] `useCallback()`
- [x] `useEffect()`
- [x] `useImperativeHandle()`
- [x] `useLayoutEffect()`
- [x] `useMemo()`
- [x] `useRef()`
- [x] `useState()`
- [ ] `useDebugValue()`
- [ ] `useDeferredValue()` (since v18)
- [ ] `useId()` (since v18)
- [x] `useInsertionEffect()` (since v18)
- [ ] `useSyncExternalStore()` (since v18)
- [ ] `useTransition()` (since v18)

### Other
- [x] `ReactDOM.createPortal(children, container)`
- [x] `React.memo()`
- [x] `React.forwardRef()`
- [x] `React.lazy()`
- [x] `<Suspense>`
- [ ] `<Offscreen>` (since v18)


## 🐛 Issues

If you find a bug, please file an issue on [our issue tracker on GitHub](https://github.com/shenjunru/react-fiber-keep-alive/issues).


## 📄 License

Copyright © 2022 [**Shen Junru**](https://github.com/shenjunru) • [**MIT license**](LICENSE).
