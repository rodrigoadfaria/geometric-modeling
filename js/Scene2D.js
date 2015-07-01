/**
* Scene object
*/
Scene2D = function() {
	this.gl = null;
    this.program = null;
	
	this.buffers = new Array();
	this.meshes = new Array();
};

Scene2D.prototype = {
	/**
	* Create the buffers for the shaders.
	*/
	createBuffers: function(points, normals) {
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
		
		var buffer = new Buffer(vBuffer, nBuffer);
		return buffer;
	},
    
    setGlAndProgram: function(gl, program) {
        this.gl = gl;
        this.program = program;
    },
};

/**
* Buffer object
*/
Buffer = function(vertexBuffer, normalBuffer) {
	this.nBuffer = normalBuffer;
	this.vBuffer = vertexBuffer;
};
