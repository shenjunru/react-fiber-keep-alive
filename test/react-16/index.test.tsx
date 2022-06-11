import * as React from 'react';
import { render } from 'react-dom'; // v16 / v17
import KeepAlive from '@shared/react-fiber-keep-alive';

describe(`react-${React.version}`, () => {

    it('should work correctly', () => {
        const container = document.createElement('main');

        render((
            <KeepAlive.Provider value={container}>
                {`react-${React.version}`}
            </KeepAlive.Provider>
        ), container);
    });

});
