Obj = function() {
    this.primitive;
    this.vertices    = [];
    this.normals     = [];
    this.colors      = [];    
    this.translate   = mat4([1, 0, 0, 0],
                            [0, 1, 0, 0],
                            [0, 0, 1, 0],
                            [0, 0, 0, 1]);
    this.rotation    = mat4([1, 0, 0, 0],
                            [0, 1, 0, 0],
                            [0, 0, 1, 0],
                            [0, 0, 0, 1]);
    this.scale       = mat4([1, 0, 0, 0],
                            [0, 1, 0, 0],
                            [0, 0, 1, 0],
                            [0, 0, 0, 1]);
    this.modelMatrix = mat4([1, 0, 0, 0],
                            [0, 1, 0, 0],
                            [0, 0, 1, 0],
                            [0, 0, 0, 1]);
};

Obj.prototype = {

    /**
    * Set up the translation matrix according to the given
    * x, y and z values.
    */
    setTranslate: function(tx, ty, tz) {
        tx += this.translate[0][3];
        ty += this.translate[1][3];
        tz += this.translate[2][3];
        this.translate = translate([tx, ty, tz]);

        this.buildModelMatrix();
    },

    /**
    * Set up the scale matrix according to the given scale
    * factor of x, y and z.
    */
    setScale: function(sx, sy, sz) {
        this.scale = genScale([sx, sy, sz]);

        this.buildModelMatrix();
    },
    
    /**
    * Set up the rotation matrix according to the given angle
    * and axis of x, y and z.
    */
    setRotation: function(angle, rx, ry, rz) {
        this.rotation = rotate(angle, vec3(rx, ry, rz));

        this.buildModelMatrix();
    },
    
    /**
    * Compute the model matrix according to the current scale,
    * translate and rotate matrices.
    */
    buildModelMatrix: function() {
        this.modelMatrix = this.scale;
        this.modelMatrix = mult(this.modelMatrix, this.translate);
        this.modelMatrix = mult(this.modelMatrix, this.rotation);
    },
    
    /**
    * Set a specific color to be rendered by vertex of the mesh.
    */
    setColor: function(color) {
        this.color = (color == undefined) ? Color.rgb_007_067_077 : color;
        this.colors = [];
        for (var i=0; i < this.vertices.length; i++) {
            this.colors.push(this.color);            
        }
    },
    
    /**
    * Compute the transformation matrix to find out the mean value
    * of the x, y, z vertices and apply to this object to translate
    * this object to the world origin, scale and rotate it.
    */
    computeModelMatrix: function() {
        if (this.vertices) {
            var tMatrix = new TransformationMatrix();
            for (var i=0; i < this.vertices.length; i++) {
                var vertex = this.vertices[i];
                tMatrix.calcMinMaxValue(vertex[0], vertex[1], vertex[2]);
            }
            
            tMatrix.x = (tMatrix.max_x - Math.abs(tMatrix.min_x)) / 2;;
            tMatrix.y = (tMatrix.max_y - Math.abs(tMatrix.min_y)) / 2;
            tMatrix.z = (tMatrix.max_z - Math.abs(tMatrix.min_z)) / 2;;
            tMatrix.generateScaleFactor();
            
            this.setScale(tMatrix.scale, tMatrix.scale, tMatrix.scale);
            this.setTranslate(-tMatrix.x, -tMatrix.y, -tMatrix.z);
        }
    }
};

/** TransformationMatrix object */
var TransformationMatrix = function () {
	this.started = false,
	
	this.min_x = 0,
	this.min_y = 0,
	this.min_z = 0,
	this.max_x = 0,
	this.max_y = 0,
	this.max_z = 0,
	this.x = 0,
	this.y = 0,
	this.z = 0,
	
	this.scale = 1
};

/**
* Look for the max value of x, y or z coordinate to be
* the candidate for the scale factor.
*/
TransformationMatrix.prototype.generateScaleFactor = function() {
	this.scale = Math.abs(this.max_x);
	
	var maxAbsY = Math.abs(this.max_y);
	if (this.scale < maxAbsY)
		this.scale = maxAbsY;
	
	var maxAbsZ = Math.abs(this.max_z);
	if (this.scale < maxAbsZ)
		this.scale = maxAbsZ;
		
	this.scale = 1 / this.scale;
}

/**
* Compute the min/max value for each axis 
* using the value of each vertex.
*/
TransformationMatrix.prototype.calcMinMaxValue = function(x, y, z) {
	if (this.started) {
		if (this.min_x > x)
			this.min_x = x;
		else if (this.max_x < x)
			this.max_x = x;

		if (this.min_y > y)
			this.min_y = y;
		else if (this.max_y < y)
			this.max_y = y;

		if (this.min_z > z)
			this.min_z = z;
		else if (this.max_z < z)
			this.max_z = z;
			
	} else {
		this.min_x = x;
		this.min_y = y;
		this.min_z = z;
		this.started = true;
	}
};
