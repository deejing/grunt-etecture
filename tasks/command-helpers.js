var path = require('path'),
    which = require('which').sync,
    getPhantomCmd = require('../lib/phantomCmd');

module.exports = function(grunt) {
    /*
     * Helper for running phantomjs
     */
    grunt.registerHelper('phantomjs', function(options) {
        grunt.verbose.writeln('Running ' + getPhantomCmd() + ' with arguments ' + grunt.log.wordlist(options.args));
        return grunt.utils.spawn({
            cmd: getPhantomCmd(),
            args: options.args
        }, function (err, result, code) {
            if (!err) {
                return options.done(null, result.stdout, false);
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
                if (result.stdout) {
                    return options.done(null, result.stdout, true);
                }
                else if (result.stderr) {
                    result.stderr.split('\n').forEach(grunt.log.error, grunt.log);
                }
                else {
                    result.split('\n').forEach(grunt.log.error, grunt.log);
                }
                grunt.warn('PhantomJS exited unexpectedly with exit code ' + code + '.', 90);
            }
            options.done(code);
        });
    });

    /*
     * Helper for running ant
     */
    grunt.registerHelper('ant', function(options) {
        grunt.verbose.writeln('Running ant with arguments ' + grunt.log.wordlist(options.args));
        return grunt.utils.spawn({
            cmd: which('ant'),
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

};
