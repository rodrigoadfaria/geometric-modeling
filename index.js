var lightPosition = vec4( 30.0, 30.0, 50.0, 0.0 );
var lightAmbient = vec4( 0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

// #f50057
var materialAmbient = vec4( 245/255.0, 0.0, 87/255.0, 1.0 );
var materialDiffuse = vec4( 245/255.0, 0.0, 87/255.0, 1.0 );
var materialSpecular = vec4( 245/255.0, 0.0, 87/255.0, 1.0 );
var materialShininess = 100.0;

// transformation and projection matrices
var viewMatrix, projectionMatrix, modelMatrix;

//var ctm;
var ambientColor, diffuseColor, specularColor;

// to control the start up
var isStart = true;

// tell us the kind of primitive to be used
var GL_DRAW = {
	TRIANGLES: 1,
	LINE_STRIP: 2
}
var glDraw = GL_DRAW.TRIANGLES;

var canvasObjs = new Array();
$( document ).ready(function() {
    canvasExtrusion = new CGCanvas("gl-canvas-extrusion");
    canvasClosed = new CGCanvas("gl-canvas-closed-curve");
    canvasOpen = new CGCanvas("gl-canvas-open-curve");
    
    canvasObjs.push(canvasExtrusion);
    canvasObjs.push(canvasClosed);
    canvasObjs.push(canvasOpen);    
    
	resizeCanvas();
});

/**
* Set up the webgl, shaders, page components, and
* the shader program variables.
*/
function init() {
    for (i = 0; i < canvasObjs.length; i++) {
        var cgCanvas = canvasObjs[i];
        var gl = cgCanvas.gl;
        var canvas = cgCanvas.canvas;
        
        cgCanvas.prepare();

        // create light components
        ambientProduct = mult(lightAmbient, materialAmbient);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        specularProduct = mult(lightSpecular, materialSpecular);

        // create model, view and projection matrices
        cgCanvas.projectionMatrixLoc = gl.getUniformLocation(cgCanvas.program, "projectionMatrix");
        cgCanvas.viewMatrixLoc = gl.getUniformLocation(cgCanvas.program, "viewMatrix");
        cgCanvas.modelMatrixLoc = gl.getUniformLocation(cgCanvas.program, "modelMatrix");

        gl.uniform4fv(gl.getUniformLocation(cgCanvas.program, "ambientProduct"),  flatten(ambientProduct));
        gl.uniform4fv(gl.getUniformLocation(cgCanvas.program, "diffuseProduct"),  flatten(diffuseProduct) );
        gl.uniform4fv(gl.getUniformLocation(cgCanvas.program, "specularProduct"), flatten(specularProduct) );
        gl.uniform4fv(gl.getUniformLocation(cgCanvas.program, "lightPosition"),   flatten(lightPosition) );
           
        gl.uniform1f(gl.getUniformLocation(cgCanvas.program, "shininess"), materialShininess);        
    }
    
    render();
    $('.overlay').hide();
};

/**
* Resize event to change the aspect ratio of the canvas.
*/
window.onresize = resizeCanvas;

function resizeCanvas() {
    $.each( canvasObjs, function( key, cgCanvas ) {
        var canvas = cgCanvas.canvas;
        var width = canvas.clientWidth;
        var height = canvas.clientHeight;
        if (canvas.width != width || canvas.height != height) {
            canvas.width = width;
            canvas.height = height;
        }

        cgCanvas.aspect = canvas.width/canvas.height;
    });
    
    init();
};

/**
* Draw the object according the material given, light
* and position in the canvas space.
*/
function render() {
    for (k = 0; k < canvasObjs.length; k++) {
        var cgCanvas = canvasObjs[k];
        var gl = cgCanvas.gl;
        var scene = cgCanvas.scene;
        
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        viewMatrix = lookAt(cgCanvas.eye, cgCanvas.at, cgCanvas.up);

        var vtrm = cgCanvas.virtualTB.getRotationMatrix();
        viewMatrix = mult(viewMatrix, vtrm);

        projectionMatrix = perspective(cgCanvas.fovy, cgCanvas.aspect, cgCanvas.znear, cgCanvas.zfar);

        gl.uniformMatrix4fv(cgCanvas.viewMatrixLoc, false, flatten(viewMatrix));
        gl.uniformMatrix4fv(cgCanvas.projectionMatrixLoc, false, flatten(projectionMatrix));

        scene.buffers = new Array(scene.meshes.length);
        for (i = 0; i < scene.meshes.length; i++) {
            obj = scene.meshes[i];
            
            var bufferObj = scene.createBuffers(obj.vertices, obj.draw_normals);
            if (bufferObj) {
                scene.buffers[i] = bufferObj;
            }
            
            gl.uniformMatrix4fv(cgCanvas.modelMatrixLoc, false, flatten(obj.modelMatrix));

            var primitive = gl.TRIANGLES;
            if (i === cgCanvas.manipulator.getActiveObjectIndex())
                primitive = gl.LINE_STRIP;
            
            gl.drawArrays(primitive, 0, obj.vertices.length);
        }
    }
}
