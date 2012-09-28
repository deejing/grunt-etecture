var system = require('system'),
    fs = require('fs');

// check for required arguments
if (system.args.length < 2) {
    console.log('Usage: casperjs test-runner.js <casperPath> --url=<base-url> --suite=<test-suite-path> --xunit=<path-to-xml>');
    phantom.exit(64);
}

// set casperjs path
phantom.casperPath = 'vendor/casperjs';

// the first argument ist the path to casper
// hopefully this will work on windows too
if (system.args[1]) {
    phantom.casperPath = system.args[1];
}

// inject casperjs
phantom.injectJs(phantom.casperPath + '/bin/bootstrap.js');

if (!phantom.casperLoaded) {
    console.log('This script must be invoked using the casperjs executable');
    phantom.exit(1);
}

// initialize casperjs and casperjs's utils
var utils = require('utils'),
    colorizer = require('colorizer'),
    fs = require('fs'),
    f = utils.format,
    includes = [],
    tests = [],
    casper = require('casper').create({
        exitOnError: false
    });

// local utils
function checkIncludeFile(include) {
    var absInclude = fs.absolute(include.trim());
    if (!fs.exists(absInclude)) {
        casper.warn("%s file not found, can't be included", absInclude);
        return;
    }
    if (!utils.isJsFile(absInclude)) {
        casper.warn("%s is not a supported file type, can't be included", absInclude);
        return;
    }
    if (fs.isDirectory(absInclude)) {
        casper.warn("%s is a directory, can't be included", absInclude);
        return;
    }
    if (tests.indexOf(include) > -1 || tests.indexOf(absInclude) > -1) {
        casper.warn("%s is a test file, can't be included", absInclude);
        return;
    }
    return absInclude;
}

// parse some options from cli
casper.options.verbose = casper.cli.get('direct') || false;
casper.options.logLevel = casper.cli.get('log-level') || "error";

if (casper.cli.get('no-colors')) {
    var cls = 'Dummy';
    casper.options.colorizerType = cls;
    casper.colorizer = colorizer.create(cls);
}
var test = [];
if (casper.cli.get('suite')) {
    tests.push(casper.cli.get('suite'));
} else {
    casper.echo('No test path passed, exiting.', 'RED_BAR', 80);
    casper.exit(1);
}

// includes handling
if (casper.cli.has('includes')) {
    includes = casper.cli.get('includes').split(',').map(function(include) {
        // we can't use filter() directly because of abspath transformation
        return checkIncludeFile(include);
    }).filter(function(include) {
        return utils.isString(include);
    });
    casper.test.includes = utils.unique(includes);
}

// set base url for usage in tests
casper.test.baseUrl = casper.cli.get('url');

// test suites completion listener
casper.test.on('tests.complete', function() {
    this.renderResults(true, undefined, casper.cli.get('xunit') || undefined);
});

var shoot = function (count, result) {
    casper.capture(casper.cli.get('screens') + '/screen_' + count + '_' + result + '.png', {
        top: 0,
        left: 0,
        width: 1200,
        height: 800
    });
};

if (casper.cli.has('screens')) {
    var count = 1;
    casper.test.on('success', function() {
        shoot(count, 'success');
        count++;
    });
    casper.test.on('fail', function() {
        shoot(count, 'fail');
        count++;
    });
    casper.on('screenshot.do', function() {
        shoot(count, 'user');
        count++;
    });
}

// run all the suites
casper.test.runSuites.apply(casper.test, tests);
