// TODO: Check for configuration options (this.data, this.target)

var mime = require('../vendor/mime'),
    fs = require('fs');

module.exports = function(grunt) {

    var _ = grunt.utils._;

    /**
     * Checks if a path is excluded
     * @param  {string}  p       path to file or directory
     * @param  {array}  exclude array of exclude patterns
     * @return {Boolean}
     */
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

    /**
     * Returns array without excluded items
     * @param  {array} list   List of paths
     * @param  {array} filter List of exclude patterns
     * @return {array}        List without excluded items
     */
    var exclude = function (list, filter) {
        return grunt.utils._.filter(list, function (item) {
            return !isExcluded(item, filter);
        });
    };

    /**
     * Returns opencms type of a file (plain or image)
     * @param  {string} f Path to file
     * @return {string}   plain or image
     */
    var getType = function (f) {
        var m = mime.lookup(f);
        if (m.indexOf('image') > -1) {
            return 'image';
        }
        else {
            return 'plain';
        }
    };

    /**
     * Mapping of checkout types to directory names
     * @type {Object}
     */
    var checkoutMapping = {
        'aktionsbausteine': 'aktionsbaustein',
        'fussnoten': 'fussnote',
        'produktbausteine': 'produktbaustein',
        'produktkonfiguration': 'produktkonfiguration'
    };

    /**
     * checks if a path is a checkout type
     * @param  {string}  f Path of file or directory
     * @return {Boolean}
     */
    var isCheckoutType = function (f) {
        var p = f.split('/');
        if (getType(f) === 'image') {
            return false;
        }
        if (_.contains(_.keys(checkoutMapping), p[p.length - 2])) {
            return true;
        }
        return false;
    };

    /**
     * Returns the checkout type for a given file
     * @param  {string} f Path to file or directory
     * @return {string}   One of the defined mappings or 'plain'
     */
    var getCheckoutType = function (f) {
        var p = f.split('/');
        if (_.contains(_.keys(checkoutMapping), p[p.length - 2])) {
            return checkoutMapping[p[p.length - 2]];
        }
        return 'plain';
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
            checkout: this.data.checkout,
            commentStart: this.data.commentStart,
            commentEnd: this.data.commentEnd
        });
        // write new manifest
        if (xml.length > 0) {
            grunt.file.write(this.data.manifest, xml);
        }

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
        // loop through each file
        grunt.utils._.each(files, function (file) {
            // replace system path with cms path
            var cmsFile = file.replace(/\\/g, '/').replace(options.root, options.site);
            // if we got a directory
            if (fs.statSync(file).isDirectory()) {
                xml.push('<file>\n');
                xml.push('\t<destination>' + cmsFile + '</destination>\n');
                xml.push('\t<type>folder</type>\n');
                xml.push('\t<flags>0</flags>\n');
                var spl = file.split('/');
                // special case for checkout module
                // we have to mark images dir for export
                if (options.checkout && spl[spl.length - 2] === 'images') {
                    xml.push('\t<properties>\n');
                    xml.push('\t\t<property>\n');
                    xml.push('\t\t\t<name>export</name>\n');
                    xml.push('\t\t\t<value><![CDATA[true]]></value>\n');
                    xml.push('\t\t</property>\n');
                    xml.push('\t</properties>\n');
                }
                else {
                    xml.push('\t<properties />\n');
                }
                xml.push('\t<accesscontrol />\n');
                xml.push('</file>\n');
            }
            else {
                xml.push('<file>\n');
                xml.push('\t<source>' + cmsFile + '</source>\n');
                xml.push('\t<destination>' + cmsFile + '</destination>\n');
                // special case for checkout module
                // files types in checkout are defined by the foldername --> see: var checkoutMapping
                if (options.checkout && isCheckoutType(cmsFile)) {
                    xml.push('\t<type>' + getCheckoutType(file) + '</type>\n');
                }
                else {
                    xml.push('\t<type>' + getType(file) + '</type>\n');
                }
                xml.push('\t<flags>0</flags>\n');
                xml.push('\t<properties />\n');
                xml.push('\t<accesscontrol />\n');
                xml.push('</file>\n');
            }
        });
        // read manifest file
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
