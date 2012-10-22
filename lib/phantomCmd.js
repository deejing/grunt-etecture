var path = require('path');

module.exports = function () {
    var cmd = path.join(__dirname, '../vendor/phantomjs/');
    if (process.platform === 'win32') {
        cmd = path.join(cmd, 'win32/phantomjs.exe');
    }
    else if (process.platform === 'darwin') {
        cmd = path.join(cmd, 'darwin/phantomjs');
    }
    else if (process.platform === 'linux') {
        if (process.arch === 'x64') {
            cmd = path.join(cmd, 'linux-x86_64/bin/phantomjs');
        }
        else {
            cmd = path.join(cmd, 'linux-i686/bin/phantomjs');
        }
    }
    return cmd;
};
