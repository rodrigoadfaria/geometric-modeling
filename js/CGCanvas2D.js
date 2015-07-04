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
    this.isSpline            = true;
    this.isClose             = isClose;
    this.tempMouse           = null;
    this.curve               = null;
    this.viewMatrixLoc       = null;
    this.projectionMatrixLoc = null;
    this.modelMatrixLoc      = null;
    this.controlPoints       = null;
    this.domain              = [1, -1];
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
};

//FIXME
CGCanvas2D.closedSpline = null;
CGCanvas2D.surface = null;
CGCanvas2D.prototype = {

    prepare: function() {
        // create viewport and clear color
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height );
        
        // enable depth testing for hidden surface removal
        this.gl.enable(this.gl.DEPTH_TEST);

        // load shaders and initialize attribute buffers	
        this.program = initShaders( this.gl, this.vertexShaderName, this.fragShaderName );
        this.gl.useProgram( this.program );
        
        this.scene.setGlAndProgram(this.gl, this.program);
        this.setupCanvasMouseEvents();
    },

    /**
    * Set up the degree of the polynomial.
    */
    setDegree: function(degree) {
        this.degree = degree != undefined ? degree : 3;//3 default
    },

    /**
    * Set up the number of points to be interpolated.
    */
    setNumberOfPoints: function(nPoints) {
        this.numPoints = nPoints != undefined ? nPoints : 200;//200 default
    },
    
    /**
    * Set up the type of the curve: RaGs or B-Splines.
    */
    changeCurveType: function(isSpline) {
        if(this.isSpline == isSpline)
            return;

        this.isSpline = isSpline;

        var curveObj = new Obj();
        this.curve = new Polynomial(this.controlPoints, this.isSpline, this.degree, this.domain, this.isClose, this.numPoints);
        curveObj.primitive = this.gl.LINE_STRIP;
        curveObj.vertices  = this.curve.drawPoints;
        curveObj.normals   = this.curve.drawPoints;
        curveObj.setColor(Color.rgb_000_128_148);
        this.scene.meshes.pop();
        this.scene.add(curveObj);

        init();
    },

    /**
    * Set up mouse down, up and move events in canvas element.
    */
    setupCanvasMouseEvents: function() {
        var mObject = this;
        
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
        if(this.mousedown)
            return;

        this.mousedown = true;
        var rect = this.canvas.getBoundingClientRect();
        var x    = ((event.clientX - rect.left)/(rect.width)) * 2 - 1;
        var y    = 1 - 2 * ((event.clientY - rect.top)/(rect.height));
        var p    = vec4(x, y, -this.znear, 1);
        var pick = 1;

        if(this.domain[0] > x)
            this.domain[0] = x;
        if(this.domain[1] < x)
            this.domain[1] = x;

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
        line.normals   = this.controlPoints;
        line.setColor(Color.rgb_069_090_100);
        this.scene.meshes.push(line);

        if(this.controlPoints.length >= this.degree + 1) {
            var curveObj = new Obj();

            this.curve = new Polynomial(this.controlPoints, this.isSpline, this.degree, this.domain, this.isClose, this.numPoints);
            curveObj.primitive = this.gl.LINE_STRIP;
            curveObj.vertices  = this.curve.drawPoints;
            curveObj.normals   = this.curve.drawPoints;
            curveObj.setColor(Color.rgb_000_128_148);
            this.scene.meshes.push(curveObj);
            

            // FIXME testing the open spline
            if (this.curve && this.curve.isClose) {
                CGCanvas2D.closedSpline = curveObj.vertices;
            }

            if (!this.isClose) {
                if (CGCanvas2D.closedSpline != undefined && CGCanvas2D.closedSpline != null && CGCanvas2D.closedSpline.length > 0) {
                    var controlPointsx = [];
                    var controlPointsy = [];
                    for(k = 0; k < this.controlPoints.length; k++) {
                        controlPointsx.push(this.controlPoints[k][0]); //x
                        controlPointsy.push(this.controlPoints[k][1]); //y
                    }
                    
                    //CGCanvas2D.surface = openSpline(this.domain[0], this.domain[1], this.numPoints, this.degree, 
                    //                                controlPointsx, controlPointsy, CGCanvas2D.closedSpline)
                }
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
        var xMouse = ((event.pageX - rect.left)/(rect.width)) * 2 - 1;
        var yMouse = 1 - 2 * ((event.pageY - rect.top)/(rect.height));
        var x      = this.controlPoints[this.pickPoint][0];
        var y      = this.controlPoints[this.pickPoint][1];
        var delta  = null;
        
        delta = this.getDeltaMove(xMouse, yMouse);
        if(delta[0] == 0 && delta[1] == 0)
            return;

        var newx = x + delta[0];
        var newy = y + delta[1];
        if(this.domain[0] > newx)
            this.domain[0] = newx;
        if(this.domain[1] < newx)
            this.domain[1] = newx;

        if(this.controlPoints.length >= 2)
            this.scene.meshes.pop();
        if(this.curve != null)
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
        line.normals   = this.controlPoints;
        line.setColor(Color.rgb_069_090_100);
        this.scene.meshes.push(line);

        if(this.curve != null) {
            var curveObj = new Obj();

            this.curve = new Polynomial(this.controlPoints, this.isSpline, this.degree, this.domain, this.isClose, this.numPoints);
            curveObj.primitive = this.gl.LINE_STRIP;
            curveObj.vertices  = this.curve.drawPoints;
            curveObj.normals   = this.curve.drawPoints;
            curveObj.setColor(Color.rgb_000_128_148);
            this.scene.meshes.push(curveObj);
            
        }

        init();
    },

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

    keyUpListener: function(event) {
        var code = (event.keyCode ? event.keyCode : event.which);
        
        if (code == 46) {
            if(this.controlPoints == null) {
                console.log("Nenhum ponto a ser deletado!")
                return;
            } else {
                this.clear();
            }
        }
    },
    
    clear: function() {
        this.controlPoints = null;
        this.curve         = null;
        this.scene         = new Scene2D();
        init();
    }
};
