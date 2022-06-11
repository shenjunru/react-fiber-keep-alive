import { createRoot, hydrateRoot } from 'react-dom/client'; // v18

export const output = (container: HTMLElement, children: React.ReactElement) => {
    if (container?.children.length) {
        hydrateRoot(container, children);
    } else {
        createRoot(container).render(children);
    }
};
