var path = require('path');

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
            var xpath = this.data.xunit.split('/');
            xpath.pop();
            grunt.file.mkdir(path.join(process.cwd(), xpath.join('/')));
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
        grunt.helper('phantomjs', {
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
};
