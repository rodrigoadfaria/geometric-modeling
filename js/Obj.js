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

    setTranslate: function(tx, ty, tz) {
        tx += this.translate[0][3];
        ty += this.translate[1][3];
        tz += this.translate[2][3];
        this.translate = translate([tx, ty, tz]);

        this.modelMatrix = this.scale;
        this.modelMatrix = mult(this.modelMatrix, this.translate);
        this.modelMatrix = mult(this.modelMatrix, this.rotation);
    },
    
    setScale: function(sx, sy, sz) {
        this.scale = genScale([sx, sy, sz]);

        this.modelMatrix = this.scale;
        this.modelMatrix = mult(this.modelMatrix, this.translate);
        this.modelMatrix = mult(this.modelMatrix, this.rotation);
    },
    
    setRotation: function(rx, ry, rz) {
        this.translate = translate([rx, ry, rz]);

        this.modelMatrix = this.scale;
        this.modelMatrix = mult(this.modelMatrix, this.translate);
        this.modelMatrix = mult(this.modelMatrix, this.rotation);
    },
    
    setColor: function(color) {
        this.color = (color == undefined) ? Color.rgb_007_067_077 : color;
        this.colors = [];
        for (var i=0; i < this.vertices.length; i++) {
            this.colors.push(this.color);            
        }
    }
};
