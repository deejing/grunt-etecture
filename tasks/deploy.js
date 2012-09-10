var path = require('path'),
    fs= require('fs');

module.exports = function(grunt) {

    grunt.registerTask('deploy', 'Deploy modules to opencms.', function(server, target) {

        // Tell grunt this task is asynchronous.
        var done = this.async();

        // check for required config properties
        grunt.config.requires('deploy.dist', 'deploy.servers', 'deploy.targets');

        // get deploy config object
        var config = grunt.config.get('deploy');

        // check grunt command arguments
        if (!server || !target || target === 'config') {
            if (target === 'config') grunt.warn('Don\'t call deploy:config directly.');
            else grunt.warn('Use: `grunt deploy:<SERVER>:<TARGET>');
        }

        // check if server is configured
        if (grunt.utils._.indexOf(grunt.utils._.keys(config.servers), server) === -1) {
            grunt.warn('Server `' + server + '´ not configured.');
        }
        // check for required server properties
        grunt.config.requires('deploy.servers.' + server + '.url', 'deploy.servers.' + server + '.user', 'deploy.servers.' + server + '.pass', 'deploy.servers.' + server + '.antTarget');

        // check if target is configured
        if (grunt.utils._.indexOf(grunt.utils._.keys(config.targets), target) === -1) {
            grunt.warn('Target `' + target + '´ not configured.');
        }
        // check for required target properties
        grunt.config.requires('deploy.targets.' + target + '.modules');

        // starts deployment
        var deploy = function () {
            // creating log dir
            if (config.log) {
                grunt.file.mkdir(path.join(process.cwd(), config.log));
                config.log = path.join(process.cwd(), config.log);
            }
            // deploy every module
            grunt.utils.async.forEachSeries(config.targets[target].modules, function (module, callback) {
                // find module zip file
                var files = fs.readdirSync(path.join(process.cwd(), config.dist));
                var file = null;
                files.forEach(function (f) {
                  if (f.indexOf(module.replace('create-', '') + '.zip') > 0) {
                    file = path.join(process.cwd(), config.dist, f);
                  }
                });
                if (file) {
                    grunt.log.subhead('Deploying ' + module);
                    grunt.helper('deploy', {
                        args: [
                            path.join(__dirname, '../lib/', 'opencms-casper.js'),
                            config.servers[server].url,
                            file,
                            config.servers[server].user,
                            config.servers[server].pass,
                            path.join(__dirname, '../vendor/casperjs'),
                            module,
                            config.log || ''
                        ],
                        done: function (err) {
                            if (!err) {
                                grunt.log.ok('Ok');
                                // go to next iteration
                                callback();
                            }
                            else {
                                grunt.fail(err);
                            }
                        }
                    });
                }
            }, done);
        };

        // start ant build if not --skip-build
        if (!grunt.option('skip-build')) {
            var antArgs = [];
            if (grunt.option('clean')) {
                antArgs.push('clean');
            }
            // ant targets start with create- before the module name
            config.targets[target].modules.forEach(function (module) {
                antArgs.push('create-' + module);
            });
            antArgs.push('-Dtarget=' + config.servers[server].antTarget);
            // start ant command
            grunt.log.subhead('Starting build');
            grunt.helper('ant', {
                args: antArgs,
                done: function (err) {
                    if (!err) {
                        grunt.log.ok('Ok');
                        // go to next iteration
                        deploy();
                    }
                    else {
                        grunt.fail(err);
                    }
                }
            });
        }
        else {
            deploy();
        }

    });

    grunt.registerHelper('ant', function(options) {
        grunt.verbose.writeln('Running ant with arguments ' + grunt.log.wordlist(options.args));
        return grunt.utils.spawn({
            cmd: 'ant',
            args: options.args
        }, function (err, result, code) {
            grunt.verbose.write(result);
            if (!err) {
                return options.done(null);
            }
            // Something went horribly wrong.
            grunt.verbose.or.writeln();
            grunt.log.write('Running ant ... ').error();
            if (code === 127) {
                grunt.log.errorlns(
                    'In order for this task to work properly, ant must be ' +
                    'installed and in the system PATH (if you can run "ant" at' +
                    ' the command line, this task should work). Unfortunately, ' +
                    'ant cannot be installed automatically via npm or grunt. '
                );
                grunt.warn('ant not found.', 90);
            }
            else {
                result.split('\n').forEach(grunt.log.error, grunt.log);
                grunt.warn('ant exited unexpectedly with exit code ' + code + '.', 90);
            }
            options.done(code);
        });
    });

    // get system dependent phantom command
    var getPhanomCmd = function () {
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

    grunt.registerHelper('deploy', function(options) {
        grunt.verbose.writeln('Running ' + getPhanomCmd() + ' with arguments ' + grunt.log.wordlist(options.args));
        return grunt.utils.spawn({
            cmd: getPhanomCmd(),
            args: options.args
        }, function (err, result, code) {
            grunt.verbose.write(result);
            if (!err) {
                return options.done(null);
            }
            // Something went horribly wrong.
            grunt.verbose.or.writeln();
            grunt.log.write('Running PhantomJS ... ').error();
            if (code === 127) {
                grunt.log.errorlns(
                    'In order for this task to work properly, PhantomJS must be ' +
                    'installed and in the system PATH (if you can run "phantomjs" at' +
                    ' the command line, this task should work). Unfortunately, ' +
                    'PhantomJS cannot be installed automatically via npm or grunt. '
                );
                grunt.warn('PhantomJS not found.', 90);
            }
            else {
                result.split('\n').forEach(grunt.log.error, grunt.log);
                grunt.warn('PhantomJS exited unexpectedly with exit code ' + code + '.', 90);
            }
            options.done(code);
        });
    });

};