var path = require('path'),
    fs = require('fs'),
    http = require('http');

module.exports = function(grunt) {

    grunt.registerTask('deploy', 'Deploy modules to opencms.', function(server, target, env) {

        // Tell grunt this task is asynchronous.
        var done = this.async();

        // check for required config properties
        grunt.config.requires('deploy.dist', 'deploy.servers', 'deploy.targets');

        // get deploy config object
        var config = grunt.config.process('deploy');

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

        // check for opencms server
        http.get(config.servers[server].url, function(res) {
          start();
        }).on('error', function(e) {
          grunt.warn('OpenCMS server is not responding.\nDid you set the correct server url in grunt.json? <' + config.servers[server].url + '>\nIs your OpenCMS server running?\n');
        });

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
                  if (f.indexOf(module + '.zip') > -1) {
                    file = path.join(process.cwd(), config.dist, f);
                  }
                });
                if (file) {
                    grunt.log.subhead('Deploying ' + module);
                    var args = [];
                    args.push(path.join(__dirname, '../lib/', 'deploy-runner.js'));
                    args.push(path.join(__dirname, '../vendor/casperjs'));
                    args.push('--url=' + config.servers[server].url);
                    args.push('--file=' + file);
                    args.push('--user=' + config.servers[server].user);
                    args.push('--pass=' + config.servers[server].pass);
                    args.push('--module=' + module);
                    if (config.log) {
                        args.push('--log=' + config.log);
                    }
                    if (grunt.option('verbose')) {
                        args.push('--direct');
                        args.push('--log-level=info');
                    }
                    grunt.helper('phantomjs', {
                        args: args,
                        done: function (err, result) {
                            if (!err) {
                                grunt.log.writeln(result);
                                // go to next iteration
                                callback();
                            }
                            else {
                                grunt.fail(err);
                            }
                        }
                    });
                }
                else {
                    grunt.log.error('zip-file for ' + module + ' not found.');
                    callback();
                }
            }, done);
        };

        // start ant build if not --skip-build
        var start = function () {
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
                if (env && env === 'dev') {
                    antArgs.push('-DassetEnv=dev');
                }
                // start ant command
                grunt.log.subhead('Starting build');
                grunt.helper('ant', {
                    args: antArgs,
                    done: function (err) {
                        if (!err) {
                            grunt.log.ok('Ok');
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
        };

    });

};
