var rAF = require('./lib/rAF');
var tween = require('./lib/tween');

var mat4 = require('gl-mat4');
var vec3 = require('gl-vec3');
var quat = require('gl-quat');

var depth = .5;
var minSpeed = .06;
var scale = .002;

function setQuaternionFromEulerZXY ( quat, euler ) {
    
    var c1 = Math.cos( euler[ 0 ] / 2 );
	var c2 = Math.cos( euler[ 1 ] / 2 );
	var c3 = Math.cos( euler[ 2 ] / 2 );
	var s1 = Math.sin( euler[ 0 ] / 2 );
	var s2 = Math.sin( euler[ 1 ] / 2 );
	var s3 = Math.sin( euler[ 2 ] / 2 );
	
	quat[ 0 ] = s1 * c2 * c3 + c1 * s2 * s3;
	quat[ 1 ] = c1 * s2 * c3 - s1 * c2 * s3;
	quat[ 2 ] = c1 * c2 * s3 - s1 * s2 * c3;
	quat[ 3 ] = c1 * c2 * c3 + s1 * s2 * s3;
	
}

function absMinComponentLength( v, min ) {
    
    var maxPos = Math.max( ...v );
    var maxNeg = Math.abs( Math.min( ...v ) );
    
    var max = Math.max( maxPos, maxNeg );
    
    if ( max > min ) return;
    
    var scale = min / max;
    
    v[ 0 ] *= scale;
    v[ 1 ] *= scale;
    v[ 2 ] *= scale;
    
}

module.exports = shapes => {
    
    var active = 0;
    
    var alphas = shapes.map( ( paths, i ) => paths.map( path => 0 ) );
    
    var bufferLength = shapes.reduce( (acc, paths) => acc + paths.reduce( ( acc2, path ) => acc2 + path.length, 0 ), 0 ) * 1.5;
    
    var buffer = new Float32Array( bufferLength );
    
    var offset = 0;
    
    var offsets = shapes.map( paths => paths.map( ( path, pathIndex ) => {
        
        var numVerts = path.length / 2;
        
        for ( var i = 0; i < numVerts; i++ ) {
            
            buffer[ offset * 3 + i * 3 + 0 ] = path[ i * 2 ] * scale;
            buffer[ offset * 3 + i * 3 + 1 ] = path[ i * 2 + 1 ] * scale;
            buffer[ offset * 3 + i * 3 + 2 ] = pathIndex * ( depth / paths.length );
            
        }
        
        var ret = [ offset, numVerts ];
        
        offset += numVerts;
        
        return ret;
        
    }))
    
    var canvas, gl, aPosition, uAlpha, uModelMatrix, uProjectionMatrix;
    
    var modelMatrix = mat4.create();
    var projectionMatrix = mat4.create();
    
    var position = vec3.create();
    vec3.set( position, 0, 0, -1 );
    
    var rotation = quat.create();
    
    function onResize () {
        
        var w = window.innerWidth * ( window.devicePixelRatio || 1 );
        var h = window.innerHeight * ( window.devicePixelRatio || 1 );
        
        canvas.width = w;
        canvas.height = h;
        
        gl.viewport( 0, 0, w, h );
        
        mat4.perspective( projectionMatrix, Math.PI / 2, w / h, .01, 3 );
        
        gl.uniformMatrix4fv( uProjectionMatrix, false, projectionMatrix );
        
    }
    
    function init () {
        
        canvas = document.createElement( 'canvas' );
        
        document.body.appendChild( canvas );
        
        gl = canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' );
        
        var vs = gl.createShader( gl.VERTEX_SHADER );
        
        gl.shaderSource( vs, `
            
            uniform mat4 projectionMatrix;
            uniform mat4 modelMatrix;
            
            attribute vec3 position;
            
            void main () {
                
                gl_Position = projectionMatrix * modelMatrix * vec4( position, 1.0 );
                
            }
        
        `);
        
        gl.compileShader( vs );
        
        var fs = gl.createShader( gl.FRAGMENT_SHADER );
        
        gl.shaderSource( fs, `
            
            precision highp float;
            
            uniform float alpha;
            
            void main () {
                
                gl_FragColor = vec4( 0., 0., 0., alpha );
                
            }
        
        `);
        
        gl.compileShader( fs );
        
        var shader = gl.createProgram();
        
        gl.attachShader( shader, vs );
        gl.attachShader( shader, fs );
        gl.linkProgram( shader );
        gl.useProgram( shader );
        
        gl.bindBuffer( gl.ARRAY_BUFFER, gl.createBuffer() );
        
        gl.bufferData( gl.ARRAY_BUFFER, buffer, gl.STATIC_DRAW );
        
        aPosition = gl.getAttribLocation( shader, "position" );
        
        gl.enableVertexAttribArray( aPosition );
        gl.vertexAttribPointer( aPosition, 3, gl.FLOAT, false, 0, 0 );
        
        uAlpha = gl.getUniformLocation( shader, "alpha" );
        
        uProjectionMatrix = gl.getUniformLocation( shader, "projectionMatrix" );
        uModelMatrix = gl.getUniformLocation( shader, "modelMatrix" );
        
        gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
        gl.enable( gl.BLEND );
        
        gl.disable( gl.DEPTH_TEST );
        
    }
    
    var shape, path, iShape, iPath, alpha;
    
    var rotationEuler = vec3.create();
    var rotationSpeed = vec3.create();
    
    vec3.random( rotationSpeed, minSpeed );
    
    var rotationDelta = vec3.create();
    
    var then = Date.now();
    
    function tick () {
        
        var now = Date.now();
        var dT = ( now - then ) / 1000;
        then = now;
        
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT );
        
        vec3.scale( rotationSpeed, rotationSpeed, .97 );
        
        absMinComponentLength( rotationSpeed, minSpeed );
        
        vec3.scale( rotationDelta, rotationSpeed, dT );
        
        vec3.add( rotationEuler, rotationEuler, rotationDelta );
        
        setQuaternionFromEulerZXY( rotation, rotationEuler );
        
        mat4.fromRotationTranslation( modelMatrix, rotation, position );
        
        gl.uniformMatrix4fv( uModelMatrix, false, modelMatrix );
        
        for ( iShape = 0; iShape < offsets.length; iShape++ ) {
            
            shape = offsets[ iShape ];
            
            for ( iPath = 0; iPath < shape.length; iPath++ ) {
                
                alpha = alphas[ iShape ][ iPath ];
                
                if ( alpha === 0 ) continue;
                
                gl.uniform1f( uAlpha, alpha );
                
                var [ offset, length ] = shape[ iPath ];
                
                gl.drawArrays( gl.LINE_LOOP, offset, length );
                
            }
            
        }
        
    }
    
    var lastMouse;
    var mouse = vec3.create();
    var mouseDelta = vec3.create();
    
    function onMouseMove ( e ) {
        
        var x = e.clientY * .01;
        var y = e.clientX * .01;
        
        if ( !lastMouse ) {
            
            lastMouse = vec3.create();
            vec3.set( lastMouse, x, y, 0 );
            
        }
        
        vec3.set( mouse, x, y, 0 );
        vec3.subtract( mouseDelta, mouse, lastMouse );
        
        vec3.add( rotationSpeed, rotationSpeed, mouseDelta );
        
        vec3.copy( lastMouse, mouse );
        
    }
    
    init();
    
    onResize();
    
    window.addEventListener( 'resize', onResize );
    
    window.addEventListener( 'mousemove', onMouseMove );
    
    window.addEventListener( 'touchstart', e => {
        var t = e.touches[ 0 ]
        if ( !lastMouse ) lastMouse = vec3.create();
        vec3.set( lastMouse, t.clientX * .01, t.clientY * .01, 0 );
     })
    
    window.addEventListener( 'touchmove', e => onMouseMove( e.touches[ 0 ] ) )
    
    rAF.start( tick );
    
    transition( 0, 1 );
    
    function transition ( i, alpha ) {
        
        var as = alphas[ i ];
        
        var timeStep = 500 / as.length;
        
        as.forEach( (_, j) => {
            
            setTimeout(() => {
                
                tween( as[j], alpha, 50, x => as[j] = x )
                
            }, timeStep * j)
            
        })
        
    }
    
    return i => {
        
        if ( i === active ) return;
        
        transition( active, 0 );
        transition( i, 1 );
        
        active = i;
        
    }
    
}