/**
* CGCanvas object used to generalize the functions
* and iterations over all canvas objects.
*/
CGCanvas3D = function(id) {
    //used to track the canvas element in the HTML page
    this.id = id;

    this.canvas = document.getElementById(id);
    _gl = WebGLUtils.setupWebGL( this.canvas );
    if ( !_gl ) {
        alert( "WebGL isn't available" );
        return;
    }
    
    this.gl = _gl;
    this.program = null;
    this.scene   = new Scene3D();
    
    this.viewMatrixLoc = null;
    this.projectionMatrixLoc = null;
    this.modelMatrixLoc = null;
    
    // camera default definitions
    this.eye = vec3(0.0, 0.0, 30.0);
    this.at = vec3(0.0, 0.0, 0.0);
    this.up = vec3(0.0, 1.0, 0.0);

    // our universe perspective view
    this.znear = 0.1;
    this.zfar = 100.0;
    this.fovy = 30.0;       // field-of-view in Y direction angle (in degrees)
    this.aspect = 1.0;      // viewport aspect ratio

    // disable the context menu when right click is pressed
	this.canvas.oncontextmenu = function() {
		return false;  
	};
    
    // control shaders
    this.vertexShaderName = "vertex-shader";
    this.fragShaderName = "fragment-shader";
    
	this.virtualTB = new VirtualTrackBall();
	this.manipulator = new Manipulator();
    
    
    this.startManipulator = false;
    this.newMouseX = null;
    this.newMouseY = null;
    this.oldMouseX = null;
    this.oldMouseY = null;
    
    this.tempMouseY = 0;

};

CGCanvas3D.prototype = {

    prepare: function() {
        // create viewport and clear color
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height );
        
        // enable depth testing for hidden surface removal
        this.gl.enable(this.gl.DEPTH_TEST);

        //  load shaders and initialize attribute buffers	
        this.program = initShaders( this.gl, this.vertexShaderName, this.fragShaderName );
        this.gl.useProgram( this.program );
        
        this.scene.setGlAndProgram(this.gl, this.program);
        
        this.setupCanvasMouseEvents();
    },

    /**
    * Set up mouse down, up and move events in canvas element.
    */
    setupCanvasMouseEvents: function() {
        var mObject = this;
        
        mObject.virtualTB.setCanvasSize(mObject.canvas.width, mObject.canvas.height);
        
        mObject.canvas.addEventListener("mousedown", function(event) {
            mObject.mouseDownListener(event);
        });
        mObject.canvas.addEventListener("mouseup", function(event) {
            mObject.mouseUpListener(event);
        });
        mObject.canvas.addEventListener("mousemove", function(event) {
            mObject.mouseMoveListener(event);
        });
        mObject.canvas.addEventListener("mousewheel", function(event) {
            mObject.mouseWheelListener(event);
        });
        
        mObject.canvas.addEventListener("keyup", function(event) {
            mObject.keyUpListener(event);
        });
    },

    /**
    * Mouse down event listener used to capture the click in the canvas area
    * to start monitoring the user movements.
    */
    mouseDownListener: function(event) {
        this.virtualTB.mousedown = true;
        this.tempMouseY = 0;		
        
        var rect = this.canvas.getBoundingClientRect();
        this.virtualTB.setRotationStart(event.clientX - rect.left, event.clientY - rect.top);
    },

    /**
    * Mouse up event listener used to capture the release of the mouse
    * when clicked in the canvas area to end up the user movements.
    */
    mouseUpListener: function(event) {
        this.virtualTB.mousedown = false;
    },

    /**
    * Mouse move event listener used to keep tracking the user movements
    * in the canvas area and, so:
    * 1. Rotate if the event came from left click.
    * 2. Scale if the event is from the right click.
    */
    mouseMoveListener: function(event) {
        if (this.virtualTB.mousedown == true) {
            if (event.button === 2 || event.buttons === 2) {//right click
                var d = this.getMouseMoveDirection(event);
                this.fovy = this.virtualTB.getZoomFactor(this.fovy, d, this.znear, this.zfar);
            } else { //left click
                var rect = this.canvas.getBoundingClientRect();
                var x = event.clientX - rect.left;
                var y = event.clientY - rect.top;
                
                if (this.manipulator.active) { //manipulating an object
                    // user already has taken a choice either transformation
                    // and axis
                    this.newMouseX = 2 * ((event.pageX - rect.left)/rect.width) - 1;
                    this.newMouseY = 1 - 2 * ((event.pageY - rect.top)/rect.height);
                    if(this.startManipulator) {
                        this.oldMouseX = this.newMouseX;
                        this.oldMouseY = this.newMouseY;
                        this.startManipulator = false;
                    }
                    if(this.oldMouseX != this.newMouseX) {
                        if(this.oldMouseX < this.newMouseX)
                            var d = 1;
                        else
                            var d = -1;
                    } else if(this.oldMouseY != this.newMouseY) {
                        if(this.oldMouseY < this.newMouseY)
                            var d = 1;
                        else
                            var d = -1;
                    } else {
                        var d = 0;
                    }

                    if (this.manipulator.type != null && this.manipulator.axis != null)
                        this.manipulator.apply(d);
                    
                    this.oldMouseX = this.newMouseX;
                    this.oldMouseY = this.newMouseY;
                    this.manipulator.updateView();
                } else {// manipulating the world
                    this.virtualTB.rotateTo(x, y);
                }
            }
            
            render();
        }
    },

    getMouseMoveDirection: function (event) {
        var direction = event.pageY > this.tempMouseY;
        
        this.tempMouseY = event.pageY;
        var d = 1;
        if (direction)
            d = -1;
            
        return d;
    },
    
    /**
    * Mouse wheel event listener used to keep tracking the mouse middle button 
    * user movements in the canvas area and scale the scene according it.
    */
    mouseWheelListener: function(event) {
        var d = ((typeof event.wheelDelta != "undefined") ? 
            (-event.wheelDelta) : event.detail);
        d = ( d > 0) ? 1 : -1;

        this.fovy = this.virtualTB.getZoomFactor(this.fovy, d, this.znear, this.zfar);
        render();
    },


    keyUpListener: function(event) {
        var code = (event.keyCode ? event.keyCode : event.which);
        
        var index = this.manipulator.getActiveObjectIndex();
        var msg = "Select an object in the left menu or load an object file if none.";
        
        if (code == Key.T || code == Key.R || code == Key.S) {
            if (index == -1) {
                alert(msg)
                return;
            }

            this.manipulator.setType(code);
            this.manipulator.makeOffsetView();//no parameter clean the div
            this.manipulator.updateView();
        }
        
        if (code == Key.X || code == Key.Y || code == Key.Z) {
            if (this.manipulator.type != null) {//user already selected an axis
                this.manipulator.setAxis(code);
                this.manipulator.active = true;
                this.startManipulator = true;

                this.manipulator.updateView();
            }
        }
        
        if (!this.manipulator.active) {
            if (code == Key.DEL || code == Key.X) {
                if (index == -1) {
                    alert(msg)
                    return;
                }
                
                scene.remove(index);
                this.manipulator.setActiveObjectIndex(-1);
                rebuildList();
                this.manipulator.updateView();
                
                render();
            }
        }
        
        if (code == Key.ESC) {
            this.manipulator.type = null;
            this.manipulator.axis = null;
            this.manipulator.active = false;
            this.manipulator.setActiveObjectIndex(-1);
            
            $('#exp-obj-list>li').removeClass('active');
            this.manipulator.updateView();
            
            render();
        }
    } 
    
};
