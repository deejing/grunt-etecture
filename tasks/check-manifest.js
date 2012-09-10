var fs = require('fs'),
    xml = require('xml2js');

module.exports = function(grunt) {
  _ = grunt.utils._;
  grunt.registerTask('check-manifest', 'Checks for files missing in the manifests and for files that no longer exist but are listed in the manifest.', function() {
    // Tell grunt this task is asynchronous.
    var done = this.async();

    // check for required config properties
    grunt.config.requires('check-manifest.manifests', 'check-manifest.root', 'check-manifest.sitesLocal', 'check-manifest.sitesCms');

    // get deploy config object
    var config = grunt.config.get('check-manifest');

    // get listing of directory
    var manifests = grunt.file.expand(config.manifests);
    var manifestError = false;
    var errors = {
      inManifest: 0,
      inFs: 0
    };
    var parser = new xml.Parser({explicitArray: true, normalize: true});
    grunt.utils.async.forEachSeries(manifests, function (manifest, callback) {
      grunt.log.subhead('Checking ' + manifest);
      // parse xml file
      var resources = [];
      var folders = [];
      var filesInManifest = [];
      var errorInManifest = false;
      parser.parseString(grunt.file.read(manifest), function (err, result) {
        // get resource folders
        result['export'].module[0].resources[0].resource.forEach(function (item) {
          item = config.root + '/' + _.trim(item.$.uri.toString(), '/').replace(config.sitesCms, config.sitesLocal);
          resources.push(item);
          folders.push(item + '/**');
        });
        // get files from manifest
        result['export'].files[0].file.forEach(function (item, index) {
          var file = config.root + '/' + item.destination.toString().replace(config.sitesCms, config.sitesLocal);
          // pushing and triming starting and ending /
          filesInManifest.push(_.trim(file, '/'));
        });
        // get files from resource folders
        var files = _.map(grunt.file.expand(folders), function (item) {
          // triming starting and ending /
          return _.trim(item, '/');
        });
        // get the difference between files in manifest and files in resource folders
        var missingFiles = _.difference(filesInManifest, resources, files);
        // output result messages
        if (missingFiles.length === 0) {
          grunt.log.notverbose.or.ok(manifest + ' is ok. All files found in filesystem and no missing files in manifest');
        }
        else {
          missingFiles.forEach(function (file) {
            manifestError = true;
            if (!fs.existsSync(file)) {
              errors.inFs++;
              errorInManifest = true;
              grunt.log.error(file + ' >>>> ' + 'not in path'.yellow);
            }
            else {
              errors.inManifest++;
              errorInManifest = true;
              grunt.log.error(file + ' >>>> ' + 'not in manifest'.yellow + ' >>>> ' + manifest.split('/').pop().blue);
            }
          });
        }
        if (!errorInManifest) {
          grunt.log.ok('Ok');
        }
        callback();
      });
    }, function () {
      if (manifestError) {
        grunt.log.subhead('Result:');
        grunt.log.writeln('Errors in Manifests: ' + errors.inManifest + ' | Errors in Filesystem: ' + errors.inFs +  ' | Total: ' + (errors.inFs + errors.inManifest)).writeln();
      }
      done(!manifestError);
    });
  });

};

