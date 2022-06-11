import { hydrate, render } from 'react-dom'; // v16 / v17

export const output = (container: HTMLElement, children: React.ReactElement) => {
    if (container?.children.length) {
        hydrate(children, container);
    } else {
        render(children, container);
    }
};
