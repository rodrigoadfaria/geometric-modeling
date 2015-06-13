var lightPosition = vec4( 30.0, 30.0, 50.0, 0.0 );
var lightAmbient = vec4( 0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4( 1.0, 0.8, 0.0, 1.0 );
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
    
	prepareObjectMenu();
	
	resizeCanvas();
});

/**
* Set up the webgl, shaders, page components, and
* the shader program variables.
*/
function init() {
    if (isStart)// pass here just once
        prepareElements();
    
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
* Prepare the elements of the page to listen to the needed events.
*/
function prepareElements() {
	var btnMeshFlat = $("#shading-flat");
	var btnMeshSmooth = $("#shading-smooth");
	btnMeshFlat.click(function() {
		btnMeshSmooth.removeClass('active');
		btnMeshFlat.addClass('active');
		
		scene.isSmoothShading = false;
		scene.toggleMeshShader();
		render();
	});

	btnMeshSmooth.click(function() {
		btnMeshFlat.removeClass('active');
		btnMeshSmooth.addClass('active');
		
		scene.isSmoothShading = true;
		scene.toggleMeshShader();
		render();
	});

	var btnTriangles = $("#btn-triangles");
	var btnLines = $("#btn-lines");
	btnTriangles.click(function() {
		btnLines.removeClass('active');
		btnTriangles.addClass('active');
		
		glDraw = GL_DRAW.TRIANGLES;
		render();
	});

	btnLines.click(function() {
		btnTriangles.removeClass('active');
		btnLines.addClass('active');
		
		glDraw = GL_DRAW.LINE_STRIP;
		render();
	});
	
    $("#btn-load-file").click(function() {
		$("#files").trigger('click');
	});
	$("#files").change(function (evt) {
		setupFileLoad(evt);
    });
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
};

/**
* Set up the button to the file load event.
*/
function setupFileLoad(evt) {
	//Retrieve the file chosen from the FileList object
	var file = evt.target.files[0]; 

	if (file) {
		$('.overlay').show();
		var fileReader = new FileReader();
		fileReader.onload = function(e) {
			var contents = e.target.result;
			
			loadObject(contents, file.name);			
		}
		
		fileReader.readAsText(file);
	} else { 
		alert("Ops, you need to select a valid file :(");
	}
};

/**
* Call the parser to get the file content
* and keep it in our obj variable.
*/
function loadObject(data, fileName) {
	var obj = loadObjFile(data);
	if (obj) {
        for (k = 0; k < canvasObjs.length; k++) {
            var cgCanvas = canvasObjs[k];    
            cgCanvas.scene.add(obj);
            
            isStart = false;
        }
		init();
	}	
};

function prepareObjectMenu() {
	$('#exp-obj-list').find('li:has(ul)').click( function(event) {
		if (this == event.target) {
			$(this).toggleClass('expanded');
			$(this).children('ul').toggle('medium');
			
			$('#exp-obj-list>li').removeClass('active');
			if ($(this).hasClass('expanded')) {
				var idx = $(this).index();
				manipulator.setActiveObjectIndex(idx);
				$(this).addClass('active');
				
				manipulator.updateView();
				render();
			} else {
				manipulator.setActiveObjectIndex(-1);
				$(this).removeClass('active');
				render();
			}
		}
		
		return false;
	})
	.addClass('collapsed')
	.children('ul').hide();
};

function rebuildList() {
	if (scene) {
		$('#exp-obj-list').empty();
		for (i = 0; i < scene.meshes.length; i++) {
		var obj = scene.meshes[i];
			appendObjItem(obj.name, obj.vertices.length, obj.faces.length);
		}
	}
};

function appendObjItem(name, faces, vertices) {
	$('#exp-obj-list').find('li:has(ul)').unbind('click');
	$('.collapsed').removeClass('expanded');
    $('.collapsed').children().hide('medium');

	var child =  '<li>' + name +
					'<ul>Faces: <span class=".face-number">'+ faces +'</span></ul>'+
					'<ul>Vertices: <span class=".vertices-number">'+ vertices +'</span></ul>'
				'</li>';
	$('#exp-obj-list').append(child);
	
	prepareObjectMenu();
}
