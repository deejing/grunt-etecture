var system = require('system'),
    fs = require('fs');

// check for required arguments
if (system.args.length < 2) {
    console.log('Usage: casperjs opencms-casper.js <casperPath> --url=<base-url> --file=<file> --user=<user> --pass=<pass> --module=<module-name> --log=<log-dir>');
    phantom.exit(64);
}

// set casperjs path
phantom.casperPath = 'vendor/casperjs';

// if deployment is started by deploy script the 6th argument is the absolute path to casper js
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
    casper = require('casper').create();

// get some mor command line arguments
var loginUrl = casper.cli.get('url') + 'cms/system/login/index.html';
var topUrl = casper.cli.get('url') + 'cms/system/workplace/views/top_head.jsp';
var uploadUrl = casper.cli.get('url') + 'cms/system/workplace/views/admin/admin-main.jsp?path=%2Fmodules%2Fmodules_import';
var file = casper.cli.get('file');
var user = casper.cli.get('user');
var pass = casper.cli.get('pass');

// parse some options from cli
casper.options.verbose = casper.cli.get('direct') || false;
casper.options.logLevel = casper.cli.get('log-level') || "error";

if (casper.cli.has('module')) {
    var module = casper.cli.get('module');
}

if (casper.cli.has('log')) {
    var logDir = casper.cli.get('log');
}

var dateToYMD = function (date) {
    var d = date.getDate();
    var m = date.getMonth()+1;
    var y = date.getFullYear();
    var hh = date.getHours();
    var mm = date.getMinutes();
    var ss = date.getSeconds();
    return '' + y + '' + (m<=9?'0'+m:m) +''+ (d<=9?'0'+d:d) + '_' + (hh<=9?'0'+hh:hh) + '' + (mm<=9?'0'+mm:mm) + '' + (ss<=9?'0'+ss:ss);
};

// prints opencms reports in iframe to stdout
var updateReport = function () {
    var openCmsLog = casper.evaluate(function() {
        return document.querySelector('#report').contentDocument.querySelector('.main').innerText;
    });
    console.log(openCmsLog);
    if (logDir) {
        fs.write(logDir + '/' + dateToYMD(new Date()) + '_' + module + '.log', openCmsLog);
    }
};

// when the report iframe is requested, we tell the user
casper.on('navigation.requested', function(url, navigationType, navigationLocked, isMainFrame) {
    if (url.indexOf('reportupdate') > -1) casper.log('still working ...', 'info');
});

// on error print out message and exit
casper.on('error', function (msg, trace) {
    console.log(msg + '\n');
    trace.forEach(function(item) {
        console.log('  ', item.file, ':', item.line);
    });
    casper.exit(75);
});

casper.on('load.failed', function (obj) {
    casper.log('error loading ' + obj.url, 'error');
    casper.exit(69);
});

// open login form and submit
casper.start(loginUrl, function() {
    casper.fill('form[name="ocLoginForm"]', {
        ocUname: user,
        ocPword: pass
    }, true);
});

// open opencms header frame and change site to /
casper.thenOpen(topUrl, function() {
    casper.fill('form[name="wpSiteSelect"]', {
        wpSite: ''
    });
});

// open import form and submit the module zip file
casper.thenOpen(uploadUrl, function() {
    casper.fill('form[name="main"]', {
        importfile: file
    }, true);
});

// wait until the ok button isn't diabled anymore
casper.waitWhileSelector('form[name="main"] input[name="ok"]:disabled',
    function then() {},
    function timeout() {},
    60000*20);

// run all steps defined before
casper.run(function() {
    // after running all steps we get the opencms log and write to stdout
    updateReport();
    // we are done
    casper.echo('module deployed', 'GREEN_BAR');
    // exit with successful exit code
    casper.exit(0);
});
