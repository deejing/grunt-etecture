var fs      = require( 'fs' ),
    path    = require( 'path' ),
    which   = require('which').sync,
    exec    = require('child_process').exec;
module.exports = function( grunt ) {

    grunt.registerMultiTask( 'ant', 'execute ANT command', function() {

        var done = this.async(),
            antTask = this.data.task;

        function doneFunction( error, result, code ) {
            grunt.verbose.write(result);

            if ( error !== null ) {
                grunt.log.error( error );
                done(false);
            }
            else 
            {
                done(true);
            }
        }

        if ( antTask !== undefined ) 
        {
            if( Object.prototype.toString.apply( antTask ) === "[object Array]" && antTask.length > 0) 
            {
                grunt.utils.spawn({
                    cmd : which('ant'),
                    args : antTask
                }, doneFunction );
            }
            else 
            {
                var cmd = 'ant ' + antTask;
                exec( cmd, doneFunction );        
            }
        }
        else {
            grunt.log.error( 'No ant Task' );
        }
    });
};
