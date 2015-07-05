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

var canvasObjs = new Array();
$( document ).ready(function() {
    canvasExtrusion = new CGCanvas3D("gl-canvas-extrusion");
    canvasClosed    = new CGCanvas2D("gl-canvas-closed-curve", true);
    canvasOpen      = new CGCanvas2D("gl-canvas-open-curve", false);
    
    canvasObjs.push(canvasExtrusion);
    canvasObjs.push(canvasOpen);    
    canvasObjs.push(canvasClosed);
    
    setupFloatingMenu("#parameters", canvasClosed);
    setupFloatingMenu("#parameters-segment", canvasOpen);
	resizeCanvas();
});

/**
* Set up the events for the floating menu of each 2D canvas
* object.
*/
function setupFloatingMenu(divId, canvas) {
    var append = divId == "#parameters-segment" ? "-segment" : "";
    $(divId + " #clear" + append).click(function() {
        canvas.clear();
    });
    
    $(divId + " #curve-rags" + append).click(function() {
        $(this).addClass('active');
        $("#curve-bspline" + append).removeClass('active');
        
        //show the sigma content
        $(divId + " #params-curve-sigma" + append).show();

        canvas.changeCurveType(false);
    });

    $(divId + " #curve-bspline" + append).click(function() {
        $(this).addClass('active');
        $(" #curve-rags" + append).removeClass('active');

        //hide the sigma content
        $(divId + " #params-curve-sigma" + append).hide();

        canvas.changeCurveType(true);
    });
    
    $(divId + " #points-curve" + append).change(function() {
        var points = parseInt($(this).val());
        if (isNaN(points)) {
            alert("You must provide a valid number for the points :(")
            return;
        }
        
        canvas.setNumberOfPoints(points);
    });

    $(divId + " #degree-curve" + append).change(function() {
        var degree = parseInt($(this).val());
        if (isNaN(degree)) {
            alert("You must provide a valid number for the degree :(")
            return;
        }
        
        canvas.setDegree(degree);
    });

    $(divId + " #sigma-curve" + append).change(function() {
        var sigma = parseFloat($(this).val());
        if (isNaN(sigma)) {
            alert("You must provide a valid real number for the sigma :(")
            return;
        }
        
        canvas.setSigma(sigma);
    });
    
};

/**
* Set up the webgl, shaders, page components, and
* the shader program variables.
*/
function init() {
    for (i = 0; i < canvasObjs.length; i++) {
        var cgCanvas = canvasObjs[i];
        var gl       = cgCanvas.gl;
        var canvas   = cgCanvas.canvas;
        
        cgCanvas.prepare();

        // create light components
        ambientProduct  = mult(lightAmbient, materialAmbient);
        diffuseProduct  = mult(lightDiffuse, materialDiffuse);
        specularProduct = mult(lightSpecular, materialSpecular);

        // create model, view and projection matrices
        cgCanvas.projectionMatrixLoc = gl.getUniformLocation(cgCanvas.program, "projectionMatrix");
        cgCanvas.viewMatrixLoc       = gl.getUniformLocation(cgCanvas.program, "viewMatrix");
        cgCanvas.modelMatrixLoc      = gl.getUniformLocation(cgCanvas.program, "modelMatrix");

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
    var offset = 0;
    $.each( canvasObjs, function( key, cgCanvas ) {
        var canvas = cgCanvas.canvas;
        var width = canvas.clientWidth;
        var height = canvas.clientHeight;
        if (canvas.width != width || canvas.height != height) {
            canvas.width = width;
            canvas.height = height;
        }
        
        offset = canvas.width;
        if(cgCanvas instanceof CGCanvas3D)
            cgCanvas.aspect = canvas.width/canvas.height;
    });
    
    $('#parameters-segment').css( { marginLeft : offset + 12 + "px" } );
    $('#parameters').css( { width : offset-30 + "px" } );
    $('#parameters-segment').css( { width : offset-30 + "px" } );
    init();
};

/**
* Draw the object according the material given, light
* and position in the canvas space.
*/
function render() {
    for (k = 0; k < canvasObjs.length; k++) {
        var cgCanvas = canvasObjs[k];
        var gl       = cgCanvas.gl;
        var scene    = cgCanvas.scene;
        
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        viewMatrix = lookAt(cgCanvas.eye, cgCanvas.at, cgCanvas.up);
        if(cgCanvas instanceof CGCanvas3D) {
            var vtrm = cgCanvas.virtualTB.getRotationMatrix();
            viewMatrix = mult(viewMatrix, vtrm);
        }
        
        if(cgCanvas instanceof CGCanvas3D)
            projectionMatrix = perspective(cgCanvas.fovy, cgCanvas.aspect, cgCanvas.znear, cgCanvas.zfar);
        else
            projectionMatrix = ortho(cgCanvas.xleft, cgCanvas.xright, cgCanvas.ybottom, cgCanvas.ytop, cgCanvas.znear, cgCanvas.zfar);

        gl.uniformMatrix4fv(cgCanvas.viewMatrixLoc, false, flatten(viewMatrix));
        gl.uniformMatrix4fv(cgCanvas.projectionMatrixLoc, false, flatten(projectionMatrix));

        scene.buffers = new Array(scene.meshes.length);
        for(i = 0; i < scene.meshes.length; i++) {
            obj = scene.meshes[i];
            
            var bufferObj = scene.createBuffers(obj.vertices, obj.normals, obj.colors);
            if (bufferObj) {
                scene.buffers[i] = bufferObj;
            }
            
            gl.uniformMatrix4fv(cgCanvas.modelMatrixLoc, false, flatten(obj.modelMatrix));
            gl.drawArrays(obj.primitive, 0, obj.vertices.length);
        }
    }
}
