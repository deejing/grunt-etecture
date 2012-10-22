var path = require('path'),
    fs = require('fs');

module.exports = function(grunt) {

    grunt.registerMultiTask('yslow', 'Runs yui-slow on specified website.', function() {
        var _ = grunt.utils._;

        // Tell grunt this task is asynchronous.
        var done = this.async();

        // check for required config properties
        grunt.config.requires('yslow.' + this.target + '.url');

        // generate args for phantom js
        var args = [];

        // argument for yui-slow path
        args.push(path.join(__dirname, '../vendor/yslow.js'));

        // set information to display (basic|grade|stats|comps|all default:all)
        if (this.data.info) {
            args.push('--info', this.data.info);
        }

        // set output format (json|xml|plain|tap|junit default:json)
        if (this.data.format) {
            args.push('--format', this.data.format);
        }

        // set threshold for test formats
        // the threshold to test scores ([0-100]|[A-F]|{JSON}) [80]
        // e.g.: '{"overall": "B", "ycdn": "F", "yexpires": 85}'
        if (this.data.threshold && _.isObject(this.data.threshold)) {
            args.push('--threshold', JSON.stringify(this.data.format));
        }

        if (this.data.output) {
            grunt.file.mkdir(path.join(process.cwd(), this.data.output));
        }

        if (grunt.option('verbose')) {
            args.push('--verbose');
        }

        // last argument is the url
        if (!_.isArray(this.data.url)) {
            this.data.url = [this.data.url];
        }

        var out = this.data.output;

        // start phantomjs for ever page
        grunt.utils.async.forEachSeries(this.data.url, function (url, callback) {
            argv = _.union(args, [url]);
            grunt.log.subhead('Running yslow at ' + url);
            grunt.helper('phantomjs', {
                args: argv,
                done: function (err, result, testError) {
                    if (!err) {
                        if (grunt.option('verbose')) {
                            grunt.log.writeln(result);
                        }
                        if (out && fs.statSync(out).isDirectory()) {
                            var file = path.join(out, _.slugify(url) + '.xml');
                            fs.writeFileSync(file, result, 'utf-8');
                            grunt.log.writeln('Test result written to ' + file);
                        }
                        callback();
                    }
                    else {
                        grunt.fail(err);
                    }
                }
            });
        }, done);
    });

};
