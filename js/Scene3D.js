/**
* Scene object
*/
Scene3D = function() {
	this.gl = null;
    this.program = null;
	
	this.buffers = new Array();
	this.meshes = new Array();
	
	this.isSmoothShading = false;
};

Scene3D.prototype = {
	
	/**
	* Add an object to the scene according to the shader chosen by the user.
	* For each object, we generate a scale and translation matrix and put it
	* into the modelMatrix to be rendered.
	*/
	add: function(object) {
		if (object) {
			object.draw_normals = object.normals;
			if (this.isSmoothShading)
				object.draw_normals = object.smooth_normals;
			
			this.meshes.push(object);
		}
	},
	
	/**
	* Remove the mesh object and vertices/normals buffers according to the
	* given index.
	*/
	remove: function(index) {
		if (index >= 0 && index < this.meshes.length && index < this.buffers.length) {
			var tmpMeshes = new Array(), tmpBuffers = new Array();
			for (i = 0; i < this.meshes.length; i++) {
				var rBuffer = this.buffers[i];
				var rObject = this.meshes[i];
				
				if (index === i) {
					this.gl.deleteBuffer(rBuffer.nBuffer);
					this.gl.deleteBuffer(rBuffer.vBuffer);
				} else {
					tmpMeshes.push(rObject);
					tmpBuffers.push(rBuffer);
				}
			}
			
			this.gl.deleteBuffer(rBuffer.nBuffer);
			this.gl.deleteBuffer(rBuffer.vBuffer);
					
			this.buffers = tmpBuffers;
			this.meshes = tmpMeshes;
		}
	},
	
	/**
	* Clean up the buffers and meshes, create them again once the flat/smooth
	* has changed.
	*/
	toggleMeshShader: function() {
		var objects = this.meshes;
		this.buffers = new Array();
		this.meshes = new Array();
		
		for (i = 0; i < objects.length; i++) {
			this.add(objects[i]);
		}
	},

	/**
	* Create the buffers for the shaders.
	*/
	createBuffers: function(points, normals, colors) {
		var nBuffer = this.gl.createBuffer();
		this.gl.bindBuffer( this.gl.ARRAY_BUFFER, nBuffer );
		this.gl.bufferData( this.gl.ARRAY_BUFFER, flatten(normals), this.gl.STATIC_DRAW );
		
		var vNormal = this.gl.getAttribLocation( this.program, "vNormal" );
		this.gl.vertexAttribPointer( vNormal, 4, this.gl.FLOAT, false, 0, 0 );
		this.gl.enableVertexAttribArray( vNormal );

		var vBuffer = this.gl.createBuffer();
		this.gl.bindBuffer( this.gl.ARRAY_BUFFER, vBuffer );
		this.gl.bufferData( this.gl.ARRAY_BUFFER, flatten(points), this.gl.STATIC_DRAW );
		
		var vPosition = this.gl.getAttribLocation(this.program, "vPosition");
		this.gl.vertexAttribPointer(vPosition, 4, this.gl.FLOAT, false, 0, 0);
		this.gl.enableVertexAttribArray(vPosition);
        
		var vColorBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vColorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten(colors), this.gl.STATIC_DRAW);

		var vColor = this.gl.getAttribLocation(this.program, "vColor");
		this.gl.vertexAttribPointer(vColor, 4, this.gl.FLOAT, false, 0, 0);
		this.gl.enableVertexAttribArray(vColor);
		
		var buffer = new Buffer(vBuffer, nBuffer, vColorBuffer);
		return buffer;
	},
    
    setGlAndProgram: function(gl, program) {
        this.gl = gl;
        this.program = program;
    }
};

/**
* Buffer object
*/
Buffer = function(vertexBuffer, normalBuffer, colorBuffer) {
	this.nBuffer = normalBuffer;
	this.vBuffer = vertexBuffer;
    this.cBuffer = colorBuffer;
};
