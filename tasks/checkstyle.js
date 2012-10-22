/*
 * grunt-checkstyle
 * https://github.com/aslansky/grunt-checkstyle
 *
 * Copyright (c) 2012 Alexander Slansky
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {

  // External libs.
  var hint = require('jshint/lib/hint');
      jshint = require('jshint').JSHINT;

  // ==========================================================================
  // TASKS
  // ==========================================================================

  grunt.registerMultiTask('checkstyle', 'Generate checkstyle reports with jshint.', function() {
    // Get flags and globals, allowing target-specific options and globals to
    // override the default options and globals.
    var options, globals, tmp;

    tmp = grunt.config(['jshint', this.target, 'options']);
    if (typeof tmp === 'object') {
      grunt.verbose.writeln('Using "' + this.target + '" JSHint options.');
      options = tmp;
    } else {
      grunt.verbose.writeln('Using master JSHint options.');
      options = grunt.config('jshint.options');
    }
    grunt.verbose.writeflags(options, 'Options');

    tmp = grunt.config(['jshint', this.target, 'globals']);
    if (typeof tmp === 'object') {
      grunt.verbose.writeln('Using "' + this.target + '" JSHint globals.');
      globals = tmp;
    } else {
      grunt.verbose.writeln('Using master JSHint globals.');
      globals = grunt.config('jshint.globals');
    }
    grunt.verbose.writeflags(globals, 'Globals');

    // Lint specified files.
    var checkstyle = grunt.helper('checkstyle', grunt.file.expandFiles(this.file.src), options, globals);

    // Checkstyle xml to dest
    grunt.file.mkdir(this.file.dest);
    grunt.file.write(this.file.dest + '/jshint.xml', checkstyle);

    // Fail task if errors were logged.
    if (this.errorCount) { return false; }
    // Print a success message.
    grunt.log.writeln('Checkstyle written.');
  });

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  // Lint source code with JSHint.
  grunt.registerHelper('checkstyle', function(src, options, globals) {
    // JSHint sometimes modifies objects you pass in, so clone them.
    options = grunt.utils._.clone(options);
    globals = grunt.utils._.clone(globals);
    // Enable/disable debugging if option explicitly set.
    if (grunt.option('debug') !== undefined) {
      options.devel = options.debug = grunt.option('debug');
      // Tweak a few things.
      if (grunt.option('debug')) {
        options.maxerr = Infinity;
      }
    }
    var msg = 'Generating checkstyle report ...';
    grunt.verbose.write(msg);
    // Lint.
    opts = options || {};
    opts.globals = globals || {};

    // get checkstyle reporter
    var reporter = require('../lib/checkstyle-reporter');

    hint.hint(src, opts || {}, reporter.reporter);

    return reporter.result;
  });

};

