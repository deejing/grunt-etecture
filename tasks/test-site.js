/* Features
- Seiten Root URL muss aus grunt.js kommen
- Ordner der Test Suite muss aus grunt.js kommen
- Ausgabe als xUnit.xml oder auf Screen
*/
var path = require('path'),
    getPhantomCmd = require('../lib/phantomCmd');

module.exports = function(grunt) {

    var dateToYMD = function (date) {
        var d = date.getDate();
        var m = date.getMonth()+1;
        var y = date.getFullYear();
        var hh = date.getHours();
        var mm = date.getMinutes();
        var ss = date.getSeconds();
        return '' + y + '' + (m<=9?'0'+m:m) +''+ (d<=9?'0'+d:d) + '_' + (hh<=9?'0'+hh:hh) + '' + (mm<=9?'0'+mm:mm) + '' + (ss<=9?'0'+ss:ss);
    };

    grunt.registerMultiTask('test-site', 'Runs a test suite with casper on specified website.', function() {

        // Tell grunt this task is asynchronous.
        var done = this.async();

        // check for required config properties
        grunt.config.requires('test-site.' + this.target + '.url', 'test-site.' + this.target + '.suite');

        // generate args for phantom js
        var args = [];

        // argument for casper path and test-runner file
        args.push(path.join(__dirname, '../lib/', 'test-runner.js'));
        args.push(path.join(__dirname, '../vendor/casperjs'));

        // arguments for url
        args.push('--url=' + grunt.template.process(this.data.url, grunt.config()));

        // argument for test suite directory
        args.push('--suite=' + path.join(process.cwd(), this.data.suite));

        // if we need to write a xunit report set argument
        if (this.data.xunit) {
            grunt.file.mkdir(path.join(process.cwd(), this.data.xunit));
            args.push('--xunit=' + path.join(process.cwd(), this.data.xunit));
        }

        // if we need to generate screenshots of the pages we visit
        if (this.data.screensDir) {
            var d = path.join(process.cwd(), this.data.screensDir, dateToYMD(new Date()));
            grunt.file.mkdir(d);
            args.push('--screens=' + d);
        }

        if (grunt.option('verbose')) {
            args.push('--direct');
            args.push('--log-level=info');
        }

        // start phantomjs with casper bootstrap
        grunt.log.subhead('Running test suite at ' + this.data.suite);
        grunt.helper('test-runner', {
            args: args,
            done: function (err, result, testError) {
                if (!err) {
                    grunt.log.writeln(result);
                    done();
                }
                else {
                    grunt.fail(err);
                }
            }
        });
    });

    grunt.registerHelper('test-runner', function(options) {
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
};
