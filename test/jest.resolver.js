const { join } = require('path');
const { existsSync } = require('fs');

module.exports = (path, options) => {
    if (options.rootDir && /^[@a-z]/i.test(path)) {
        const m_path = join(options.rootDir, 'node_modules', path);
        if (existsSync(m_path)) {
            return options.defaultResolver(m_path, options);
        }
    }
    return options.defaultResolver(path, options);
};
