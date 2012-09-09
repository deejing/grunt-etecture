var fs = require('fs'),
    xml = require('xml2js');

module.exports = function(grunt) {

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
      // parse xml file
      var resources = [];
      var folders = [];
      var filesInManifest = [];
      parser.parseString(grunt.file.read(manifest), function (err, result) {
        // get resource folders
        result['export'].module[0].resources[0].resource.forEach(function (item) {
          resources.push(config.root + '/' + item.$.uri.toString().substr(1).replace(config.sitesCms, config.sitesLocal));
          folders.push(config.root + '/' + item.$.uri.toString().substr(1).replace(config.sitesCms, config.sitesLocal) + '**');
        });
        // get files from manifest
        result['export'].files[0].file.forEach(function (item) {
          var file = config.root + '/' + item.destination.toString().replace(config.sitesCms, config.sitesLocal);
          if (file.split('/').pop().indexOf('.') === -1) {
            file += '/';
          }
          filesInManifest.push(file);
        });
        // get files from resource folders
        var files = grunt.file.expand(folders);
        // get the difference between files in manifest and files in resource folders
        var missingFiles = grunt.utils._.difference(filesInManifest, resources, files);
        // output result messages
        if (missingFiles.length === 0) {
          grunt.log.notverbose.or.ok(manifest + ' is ok. All files found in filesystem and no missing files in manifest');
        }
        else {
          missingFiles.forEach(function (file) {
            manifestError = true;
            if (!fs.existsSync(file)) {
              errors.inFs++;
              grunt.log.error(file + ' was not found in one of the resource paths. The file seems to be removed from the filesystem.');
            }
            else {
              errors.inManifest++;
              grunt.log.error(file + ' is missing from ' + manifest.split('/').pop());
            }
          });
        }
        callback();
      });
    }, function () {
      if (manifestError) {
        grunt.log.error('Errors in Manifests: ' + errors.inManifest + ' | Errors in Filesystem: ' + errors.inFs +  ' | Total: ' + (errors.inFs + errors.inManifest));
      }
      done(!manifestError);
    });
  });

};

