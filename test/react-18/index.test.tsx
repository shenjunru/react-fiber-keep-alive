import * as React from 'react';
import { createRoot } from 'react-dom/client'; // v18
import KeepAlive from '@shared/react-fiber-keep-alive';

describe(`react-${React.version}`, () => {

    it('should work correctly', () => {
        const container = document.createElement('main');
        const root = createRoot(container);

        root.render((
            <KeepAlive.Provider value={container}>
                {`react-${React.version}`}
            </KeepAlive.Provider>
        ));
    });

});
