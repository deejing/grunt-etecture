// TODO: Check for configuration options (this.data, this.target)

var mime = require('../vendor/mime'),
    fs = require('fs');

module.exports = function(grunt) {

    var isExcluded = function (p, exclude) {
        if (exclude && grunt.utils._.isArray(exclude)) {
            var separator = (p.indexOf('/') === -1) ? '\\' : '/';
            var sec = grunt.utils._.intersection(p.split(separator), exclude);
            if (sec.length > 0) {
                return true;
            }
        }
        return false;
    };

    var exclude = function (list, filter) {
        return grunt.utils._.filter(list, function (item) {
            return !isExcluded(item, filter);
        });
    };

    var getType = function (f) {
        var m = mime.lookup(f);
        if (m.indexOf('image') > -1) {
            return 'image';
        }
        else {
            return 'plain';
        }
    };

    // ==========================================================================
    // TASKS
    // ==========================================================================

    grunt.registerMultiTask('manifest', 'This task creates opencms manifest files.', function() {

        // get listing of directory
        var files = grunt.file.expand(this.data.dir);
        // generate new manifest
        var xml = grunt.helper('manifest', exclude(files, this.data.exclude), {
            name: this.data.manifest,
            root: this.data.root,
            site: this.data.site,
            commentStart: this.data.commentStart,
            commentEnd: this.data.commentEnd
        });
        // write new manifest
        grunt.file.write(this.data.manifest, xml);

        // Fail task if errors were logged.
        if (this.errorCount) { return false; }

        // Otherwise, print a success message.
        grunt.log.writeln('New manifest "' + this.data.manifest + '" created.');

    });

    // ==========================================================================
    // HELPERS
    // ==========================================================================

    grunt.registerHelper('manifest', function(files, options) {
        var xml = [];
        grunt.utils._.each(files, function (file) {
            var cmsFile = file.replace(/\\/g, '/').replace(options.root, options.site);
            if (fs.statSync(file).isDirectory()) {
                xml.push('<file>\n');
                xml.push('\t<destination>' + cmsFile + '</destination>\n');
                xml.push('\t<type>folder</type>\n');
                xml.push('\t<flags>0</flags>\n');
                xml.push('\t<properties />\n');
                xml.push('\t<accesscontrol />\n');
                xml.push('</file>\n');
            }
            else {
                xml.push('<file>\n');
                xml.push('\t<source>' + cmsFile + '</source>\n');
                xml.push('\t<destination>' + cmsFile + '</destination>\n');
                xml.push('\t<type>' + getType(file) + '</type>\n');
                xml.push('\t<flags>0</flags>\n');
                xml.push('\t<properties />\n');
                xml.push('\t<accesscontrol />\n');
                xml.push('</file>\n');
            }
        });

        var manifest = grunt.file.read(options.name, 'utf-8').toString();
        // Replace old xml with new content between comments
        var start = manifest.indexOf(options.commentStart) + options.commentEnd.length + 2;
        var end = manifest.indexOf(options.commentEnd);
        if (start === -1 || end === -1) {
            grunt.log.error('Missing start or end comment in ' + options.name);
            grunt.log.error('please insert');
            grunt.log.error(options.commentStart);
            grunt.log.error('and');
            grunt.log.error(options.commentEnd);
            grunt.log.error('in your manifest file.');
            return '';
        }
        else {
          var new_mani = manifest.slice(0, start) + '\n' + xml.join('') + manifest.slice(end);
          return new_mani;
        }
    });

};
