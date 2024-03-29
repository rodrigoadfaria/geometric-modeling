/**
* CGCanvas object used to generalize the functions
* and iterations over all canvas objects.
*/
CGCanvas2D = function(id, isClose) {
    //used to track the canvas element in the HTML page
    this.id = id;

    this.canvas = document.getElementById(id);
    _gl = WebGLUtils.setupWebGL( this.canvas );
    if ( !_gl ) {
        alert( "WebGL isn't available" );
        return;
    }
    
    this.gl      = _gl;
    this.program = null;
    
    this.degree              = 3;
    this.pickPoint           = 0;
    this.numPoints           = 200;
    this.sigma               = 0.15;
    this.isSpline            = true;
    this.isClose             = isClose;
    this.tempMouse           = null;
    this.curve               = null;
    this.viewMatrixLoc       = null;
    this.projectionMatrixLoc = null;
    this.modelMatrixLoc      = null;
    this.controlPoints       = null;
    this.scene               = new Scene2D();

    // camera default definitions
    this.eye = vec3(0.0, 0.0, 30.0);
    this.at  = vec3(0.0, 0.0, 0.0);
    this.up  = vec3(0.0, 1.0, 0.0);

    // our universe perspective view
    this.xleft   = -1.0;
    this.xright  = 1.0;
    this.ybottom = -1.0;
    this.ytop    = 1.0;
    this.znear   = -100.0;
    this.zfar    = 100.0;

    // disable the context menu when right click is pressed
	this.canvas.oncontextmenu = function() {
		return false;  
	};
    
    // control shaders
    this.vertexShaderName = "vertex-shader";
    this.fragShaderName   = "fragment-shader";

    this.mousedown = false;

    if(isClose)
        this.linePrimitive = this.gl.LINE_LOOP;
    else
        this.linePrimitive = this.gl.LINE_STRIP;
        
    this.setupCanvasMouseEvents();
};

CGCanvas2D.prototype = {

    /**
    * Prepare the canvas element for drawing.
    */
    prepare: function() {
        // create viewport and clear color
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height );
        
        // enable depth testing for hidden surface removal
        this.gl.enable(this.gl.DEPTH_TEST);

        // load shaders and initialize attribute buffers	
        this.program = initShaders( this.gl, this.vertexShaderName, this.fragShaderName );
        this.gl.useProgram( this.program );
        
        this.scene.setGlAndProgram(this.gl, this.program);
    },

    /**
    * Set up the degree of the polynomial.
    */
    setDegree: function(degree) {
        this.degree = degree != undefined ? degree : 3;//3 default

        if(this.controlPoints == null)
            return;

        if(this.isSpline) {
            if(this.controlPoints.length >= this.degree + 1) {
                var curveObj = new Obj();
                
                if(this.curve != null)
                    this.scene.meshes.pop();
                this.curve = new Polynomial(this.controlPoints, this.isSpline, this.degree, this.isClose, this.numPoints, this.sigma);
                curveObj.primitive = this.gl.LINE_STRIP;
                curveObj.vertices  = this.curve.drawPoints;
                curveObj.normals   = this.curve.drawNormals;
                curveObj.setColor(Color.rgb_000_128_148);
                this.scene.meshes.push(curveObj);
            }
            else {
                if(this.curve != null) {
                    this.curve = null;
                    this.scene.meshes.pop();
                }
            }
        }
        else {
            var curveObj = new Obj();

            if(this.curve != null)
                this.scene.meshes.pop();
            this.curve = new Polynomial(this.controlPoints, this.isSpline, this.degree, this.isClose, this.numPoints, this.sigma);
            curveObj.primitive = this.gl.LINE_STRIP;
            curveObj.vertices  = this.curve.drawPoints;
            curveObj.normals   = this.curve.drawNormals;
            curveObj.setColor(Color.rgb_000_128_148);
            this.scene.meshes.push(curveObj);
        }

        init();
    },

    /**
    * Set up the number of points to be interpolated.
    */
    setNumberOfPoints: function(nPoints) {
        this.numPoints = nPoints != undefined ? nPoints : 200;//200 default

        if(this.controlPoints == null || this.curve == null)
            return;

        if(this.curve != null)
            this.scene.meshes.pop();
        var curveObj = new Obj();
        this.curve = new Polynomial(this.controlPoints, this.isSpline, this.degree, this.isClose, this.numPoints, this.sigma);
        curveObj.primitive = this.gl.LINE_STRIP;
        curveObj.vertices  = this.curve.drawPoints;
        curveObj.normals   = this.curve.drawNormals;
        curveObj.setColor(Color.rgb_000_128_148);
        this.scene.meshes.push(curveObj);

        init();
    },
    
    /**
    * Set up the sigma of gaussian function on RaGs
    */
    setSigma: function(sigma) {
        if(this.sigma == sigma)
            return;

        this.sigma= sigma;

        if(this.isSpline || this.controlPoints == null)
            return;

        if(this.curve != null)
            this.scene.meshes.pop();
        var curveObj = new Obj();
        this.curve = new Polynomial(this.controlPoints, this.isSpline, this.degree, this.isClose, this.numPoints, this.sigma);
        curveObj.primitive = this.gl.LINE_STRIP;
        curveObj.vertices  = this.curve.drawPoints;
        curveObj.normals   = this.curve.drawNormals;
        curveObj.setColor(Color.rgb_000_128_148);
        this.scene.meshes.push(curveObj);

        init();
    },

    /**
    * Set up the type of the curve: RaGs or B-Splines.
    */
    changeCurveType: function(isSpline) {
        if(this.isSpline == isSpline)
            return;

        this.isSpline = isSpline;

        if(this.controlPoints == null)
            return;
        
        var curveObj = new Obj();
        if(this.isSpline) {
            if(this.controlPoints.length >= this.degree + 1) {
                if(this.curve != null)
                    this.scene.meshes.pop();
                this.curve = new Polynomial(this.controlPoints, this.isSpline, this.degree, this.isClose, this.numPoints, this.sigma);
                curveObj.primitive = this.gl.LINE_STRIP;
                curveObj.vertices  = this.curve.drawPoints;
                curveObj.normals   = this.curve.drawNormals;
                curveObj.setColor(Color.rgb_000_128_148);

                this.scene.meshes.push(curveObj);
            } else {
                if(this.curve != null) {
                    this.curve = null;
                    this.scene.meshes.pop();
                }
            }
        } else {
            if(this.curve != null)
                this.scene.meshes.pop();
            this.curve = new Polynomial(this.controlPoints, this.isSpline, this.degree, this.isClose, this.numPoints, this.sigma);
            curveObj.primitive = this.gl.LINE_STRIP;
            curveObj.vertices  = this.curve.drawPoints;
            curveObj.normals   = this.curve.drawNormals;
            curveObj.setColor(Color.rgb_000_128_148);
            this.scene.meshes.push(curveObj);
        }

        //deep copy of the object
        if (this.isClose) {
            var canvas = canvasObjs[0];
            if (canvas && canvas.id == "gl-canvas-extrusion") {
                canvas.clear();
                var extrusion = $.extend(true, {}, curveObj);
                extrusion.primitive = this.gl.TRIANGLES_STRIP;
                canvas.scene.add(extrusion)
            }
        }

        init();
    },

    /**
    * Set up mouse down, up and move events in canvas element.
    */
    setupCanvasMouseEvents: function() {
        var mObject = this;
        
        mObject.canvas.addEventListener("mousedown", function(event) {
            event = event || window.event; // cross-browser event
            event.stopPropagation ? event.stopPropagation() : (event.cancelBubble = true);
        
            mObject.mouseDownListener(event);
        });

        mObject.canvas.addEventListener("mouseup", function(event) {
            event = event || window.event; // cross-browser event
            event.stopPropagation ? event.stopPropagation() : (event.cancelBubble = true);
        
            mObject.mouseUpListener(event);
        });

        mObject.canvas.addEventListener("mousemove", function(event) {
            event = event || window.event; // cross-browser event
            event.stopPropagation ? event.stopPropagation() : (event.cancelBubble = true);
        
            mObject.mouseMoveListener(event);
        });

        mObject.canvas.addEventListener("mousewheel", function(event) {
            event = event || window.event; // cross-browser event
            event.stopPropagation ? event.stopPropagation() : (event.cancelBubble = true);
        
            mObject.mouseWheelListener(event);
        });

        mObject.canvas.addEventListener("keyup", function(event) {
            event = event || window.event; // cross-browser event
            event.stopPropagation ? event.stopPropagation() : (event.cancelBubble = true);
        
            mObject.keyUpListener(event);
        });
    },

    /**
    * Mouse down event listener used to capture the click in the canvas area
    * to start monitoring the user movements.
    */
    mouseDownListener: function(event) {
        if(this.mousedown)
            return;

        this.mousedown = true;
        var rect = this.canvas.getBoundingClientRect();
        var x    = ((event.clientX - rect.left)/(rect.width)) * 2 - 1;
        var y    = 1 - 2 * ((event.clientY - rect.top)/(rect.height));
        var p    = vec4(x, y, -this.znear, 1);
        var pick = 1;

        if(this.controlPoints == null)
            this.controlPoints = new Array();
        else {
            for(i = 0; i < this.controlPoints.length; i++) {
                var cp     = this.controlPoints[i];
                var size   = length(subtract(p, cp));

                if(size < 0.1) {
                    if(pick > size) {
                        pick           = size;
                        this.pickPoint = i;
                    }
                }
            }
            this.scene.meshes.pop();
            if(this.curve != null)
                this.scene.meshes.pop();
        }

        var square       = new Obj();
        square.primitive = this.gl.LINE_LOOP;
        square.vertices.push(vec4(x + 0.01, y + 0.01, -this.znear, 1));
        square.vertices.push(vec4(x - 0.01, y + 0.01, -this.znear, 1));
        square.vertices.push(vec4(x - 0.01, y - 0.01, -this.znear, 1));
        square.vertices.push(vec4(x + 0.01, y - 0.01, -this.znear, 1));
        square.normals.push( vec4(x + 0.01, y + 0.01, -this.znear, 0));
        square.normals.push( vec4(x + 0.01, y + 0.01, -this.znear, 0));
        square.normals.push( vec4(x + 0.01, y + 0.01, -this.znear, 0));
        square.normals.push( vec4(x + 0.01, y + 0.01, -this.znear, 0));
        square.setColor(Color.rgb_245_000_087);

        if(pick != 1) {
            this.controlPoints[this.pickPoint] = p;
            this.scene.meshes[this.pickPoint]  = square;
        }
        else {
            this.controlPoints.push(p);
            this.pickPoint[this.controlPoints.length - 1];
            this.scene.meshes.push(square);
        }

        var line       = new Obj();
        line.primitive = this.linePrimitive;
        line.vertices  = this.controlPoints;
        for(i = 0; i < this.controlPoints.length; i++)
            line.normals.push(vec4(this.controlPoints[i][0], this.controlPoints[i][1], this.controlPoints[i][2], 0))
            
        line.setColor(Color.rgb_069_090_100);
        this.scene.meshes.push(line);

        var curveObj = new Obj();
        if(this.isSpline) {
            if(this.controlPoints.length >= this.degree + 1) {
                this.curve = new Polynomial(this.controlPoints, this.isSpline, this.degree, this.isClose, this.numPoints, this.sigma);
                curveObj.primitive = this.gl.LINE_STRIP;
                curveObj.vertices  = this.curve.drawPoints;
                curveObj.normals   = this.curve.drawNormals;
                curveObj.setColor(Color.rgb_000_128_148);

                this.scene.meshes.push(curveObj);
            }
        } else {
            this.curve = new Polynomial(this.controlPoints, this.isSpline, this.degree, this.isClose, this.numPoints, this.sigma);
            curveObj.primitive = this.gl.LINE_STRIP;
            curveObj.vertices  = this.curve.drawPoints;
            curveObj.normals   = this.curve.drawNormals;
            curveObj.setColor(Color.rgb_000_128_148);
            this.scene.meshes.push(curveObj);   
        }

        //deep copy of the object
        if (this.isClose) {
            var canvas = canvasObjs[0];
            if (canvas && canvas.id == "gl-canvas-extrusion") {
                canvas.clear();
                var extrusion = $.extend(true, {}, curveObj);
                extrusion.primitive = this.gl.TRIANGLES_STRIP;
                canvas.scene.add(extrusion)
            }
        }
        
        init();
    },

    /**
    * Mouse up event listener used to capture the release of the mouse
    * when clicked in the canvas area to end up the user movements.
    */
    mouseUpListener: function(event) {
        this.mousedown = false;
        this.tempMouse = null;
    },

    /**
    * Mouse move event listener used to keep tracking the user movements
    * in the canvas area and, so:
    * 1. Rotate if the event came from left click.
    * 2. Scale if the event is from the right click.
    */
    mouseMoveListener: function(event) {
        if(!this.mousedown)
            return;

        var rect   = this.canvas.getBoundingClientRect();
        var x      = this.controlPoints[this.pickPoint][0];
        var y      = this.controlPoints[this.pickPoint][1];
        var xMouse = ((event.pageX - rect.left)/(rect.width)) * 2 - 1;
        var yMouse = 1 - 2 * ((event.pageY - rect.top)/(rect.height));
        var delta  = null;
        
        delta = this.getDeltaMove(xMouse, yMouse);
        if(delta[0] == 0 && delta[1] == 0)
            return;

        var newx = x + delta[0];
        var newy = y + delta[1];

        if(this.curve != null)
            this.scene.meshes.pop();
        if(this.controlPoints.length >= 2)
            this.scene.meshes.pop();

        var square       = new Obj();
        square.primitive = this.gl.LINE_LOOP;
        square.vertices.push(vec4(newx + 0.01, newy + 0.01, -this.znear, 1));
        square.vertices.push(vec4(newx - 0.01, newy + 0.01, -this.znear, 1));
        square.vertices.push(vec4(newx - 0.01, newy - 0.01, -this.znear, 1));
        square.vertices.push(vec4(newx + 0.01, newy - 0.01, -this.znear, 1));
        square.normals.push( vec4(newx + 0.01, newy + 0.01, -this.znear, 0));
        square.normals.push( vec4(newx + 0.01, newy + 0.01, -this.znear, 0));
        square.normals.push( vec4(newx + 0.01, newy + 0.01, -this.znear, 0));
        square.normals.push( vec4(newx + 0.01, newy + 0.01, -this.znear, 0));
        square.setColor(Color.rgb_245_000_087);

        this.controlPoints[this.pickPoint] = vec4(newx, newy, -this.znear, 1);
        this.scene.meshes[this.pickPoint]  = square;

        var line       = new Obj();
        line.primitive = this.linePrimitive;
        line.vertices  = this.controlPoints;
        for(i = 0; i < this.controlPoints.length; i++)
            line.normals.push(vec4(this.controlPoints[i][0], this.controlPoints[i][1], this.controlPoints[i][2], 0));
            
        line.setColor(Color.rgb_069_090_100);
        this.scene.meshes.push(line);

        if(this.curve != null) {
            var curveObj = new Obj();

            this.curve = new Polynomial(this.controlPoints, this.isSpline, this.degree, this.isClose, this.numPoints, this.sigma);
            curveObj.primitive = this.gl.LINE_STRIP;
            curveObj.vertices  = this.curve.drawPoints;
            curveObj.normals   = this.curve.drawNormals;
            curveObj.setColor(Color.rgb_000_128_148);
            this.scene.meshes.push(curveObj);
            
            if (this.isClose) {
                //deep copy of the object
                var canvas = canvasObjs[0];
                if (canvas && canvas.id == "gl-canvas-extrusion") {
                    canvas.clear();
                    var extrusion = $.extend(true, {}, curveObj);
                    extrusion.primitive = this.gl.TRIANGLES_STRIP;
                    canvas.scene.add(extrusion)
                }

            }
        }

        init();
    },

    /**
    * Get the mouse movement offset.
    */
    getDeltaMove: function(x, y) {
        if(this.tempMouse == null) {
            this.tempMouse = [x, y];
            return [0, 0];
        }

        var delta  = [x - this.tempMouse[0], y - this.tempMouse[1]];
        this.tempMouse[0] = x;
        this.tempMouse[1] = y;
        return delta;
    },
    
    /**
    * Mouse wheel event listener used to keep tracking the mouse middle button 
    * user movements in the canvas area and scale the scene according it.
    */
    mouseWheelListener: function(event) {
    },

    /**
    * Key up event listener to clean the scene.
    */    
    keyUpListener: function(event) {
        var code = (event.keyCode ? event.keyCode : event.which);
        
        if (code == 46 || code == 88) {// DEL or X
            if(this.controlPoints == null) {
                return;
            } else {
                this.clear();
            }
        }
    },
    
    /**
    * Clear the entire scene.
    */
    clear: function() {
        this.controlPoints = null;
        this.curve         = null;
        this.scene         = new Scene2D();
        init();
    }
};
